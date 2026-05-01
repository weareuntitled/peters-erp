import os
import re
from pathlib import Path
from typing import Optional, Dict, Any, List
from jinja2 import Environment, FileSystemLoader, select_autoescape, Template
try:
    from weasyprint import HTML
except (ImportError, OSError):
    HTML = None

from sqlmodel import Session, select
from .formatting import format_currency, format_mwst_rate, format_date, format_document_number, get_document_title

from ..models.dokumente import Dokument
from ..models.kunden import Kunde
from ..models.positionen import Position
from ..models.vorlagen import Vorlage
from ..models.warengruppen import Warengruppe
from ..models.firmen_einstellungen import FirmenEinstellungen

TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "pdf"

class DocumentRenderer:
    """
    A deep service that encapsulates all PDF/HTML generation logic.
    Handles data assembly, templating, CSS inlining, and WeasyPrint rendering.
    """
    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(str(TEMPLATE_DIR)),
            autoescape=select_autoescape(['html', 'xml']),
        )
        
    def render_saved_html(self, document_id: int, session: Session, vorlage_id: Optional[int] = None) -> Optional[str]:
        """Render a saved document to HTML string."""
        context = self._build_context_from_db(document_id, session, vorlage_id)
        if not context:
            return None
        return self._render_context(context, session)

    def render_saved_pdf(self, document_id: int, session: Session, vorlage_id: Optional[int] = None) -> Optional[bytes]:
        """Render a saved document to PDF bytes."""
        html = self.render_saved_html(document_id, session, vorlage_id)
        if not html:
            return None
        if not HTML:
            raise RuntimeError("WeasyPrint is not installed or available.")
        return HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()

    def render_preview_html(self, preview_payload: Dict[str, Any], session: Session) -> Optional[str]:
        """Render an unsaved preview payload to HTML string."""
        context = self._build_context_from_preview(preview_payload, session)
        return self._render_context(context, session)

    # --- Internal Context Assembly ---
    
    def _get_company_info(self, session: Session) -> dict:
        settings = session.exec(select(FirmenEinstellungen).limit(1)).first()
        if not settings:
            settings = FirmenEinstellungen()
            
        logo_base64 = None
        if settings.logo_pfad:
            # Security: prevent path traversal by resolving to absolute path and checking it's within allowed directories
            allowed_dirs = ['/app/app/static', '/app/static', os.getcwd()]
            logo_path = os.path.abspath(settings.logo_pfad)
            is_allowed = any(logo_path.startswith(os.path.abspath(d)) for d in allowed_dirs)
            
            if is_allowed and os.path.exists(logo_path):
                import base64
                try:
                    with open(logo_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode()
                        ext = os.path.splitext(logo_path)[1].lower().replace('.', '')
                        mime_map = {'png': 'image/png', 'jpeg': 'image/jpeg', 'jpg': 'image/jpeg', 'gif': 'image/gif', 'svg': 'image/svg+xml'}
                        mime_type = mime_map.get(ext, 'image/png')
                        logo_base64 = f"data:{mime_type};base64,{encoded_string}"
                except Exception:
                    pass

        return {
            "name": settings.firmenname or "Peters GmbH",
            "strasse": settings.strasse or "Musterstraße 1",
            "plz": settings.plz or "12345",
            "ort": settings.ort or "Musterstadt",
            "tel": settings.telefon or "+49 123 456789",
            "mobil": settings.mobiltelefon or "",
            "email": settings.email or "info@peters.de",
            "web": settings.website or "www.peters.de",
            "steuernr": settings.steuernummer or "123/456/78901",
            "ust_id": settings.ust_id_nr or "DE123456789",
            "handelsregister": f"{settings.registergericht or ''} {settings.registernummer or ''}".strip(),
            "geschaeftsfuehrer": settings.inhaber_geschaeftsfuehrer or "Max Mustermann",
            "bank": settings.bankname or "Musterbank",
            "iban": settings.iban or "DE89 3704 0044 0532 0130 00",
            "bic": settings.bic or "COBADEFFXXX",
            "handwerkskammer": settings.handwerkskammer or "",
            "betriebsnummer": settings.betriebsnummer or "",
            "logo_base64": logo_base64,
            "zahlungsziel": settings.standard_zahlungsziel or 14,
            "einleitung_angebot": settings.einleitung_angebot or "",
            "schlusstext_rechnung": settings.schlusstext_rechnung or "",
            "text_35a": settings.text_35a or "",
            "info_freistellung": settings.info_freistellung or "",
        }
        
    def _format_currency_with_unit(self, amount: float, einheit: str) -> str:
        formatted = format_currency(amount)
        if formatted.endswith(" €"):
            return f"{formatted[:-2]} / {einheit}"
        return f"{formatted} / {einheit}"

    def _group_by_warengruppe(self, positionen: list, session: Session) -> list:
        groups = {}
        for pos in positionen:
            wg_id = pos.get("warengruppe_id")
            wg_name = pos.get("warengruppe_name")
            
            if not wg_name and wg_id and session:
                wg = session.get(Warengruppe, wg_id)
                if wg:
                    wg_name = wg.bezeichnung
                    
            if not wg_name:
                wg_name = "Sonstige"
                
            group_key = wg_id if wg_id else wg_name
            
            if group_key not in groups:
                groups[group_key] = {"name": wg_name, "positionen": [], "subtotal": 0.0}
                
            groups[group_key]["positionen"].append(pos)
            groups[group_key]["subtotal"] += float(pos.get("gesamtpreis", 0))

        result = []
        for group_key, group in groups.items():
            result.append({
                "name": group["name"],
                "positionen": group["positionen"],
                "subtotal": group["subtotal"],
                "subtotal_formatted": format_currency(group["subtotal"]),
            })
        return result

    def _build_context_from_db(self, document_id: int, session: Session, requested_vorlage_id: Optional[int] = None) -> Optional[dict]:
        dokument = session.get(Dokument, document_id)
        if not dokument:
            return None
            
        kunde = session.get(Kunde, dokument.kunde_id) if dokument.kunde_id else None
        
        # Resolve Vorlage
        vorlage_id = requested_vorlage_id or dokument.vorlage_id
        vorlage = session.get(Vorlage, vorlage_id) if vorlage_id else None
        if not vorlage:
            vorlage = session.exec(select(Vorlage).where(Vorlage.typ == dokument.typ, Vorlage.aktiv == 1, Vorlage.ist_standard == 1).limit(1)).first()

        # Load positions
        db_positions = session.exec(select(Position).where(Position.dokument_id == document_id).order_by(Position.position_nr.asc())).all()
        positionen = []
        for p in db_positions:
            positionen.append({
                "pos": p.position_nr,
                "bezeichnung": p.bezeichnung or "",
                "menge": float(p.menge or 1),
                "einheit": p.einheit or "Stk",
                "einzelpreis": float(p.einzelpreis or 0),
                "einzelpreis_formatted": self._format_currency_with_unit(float(p.einzelpreis or 0), p.einheit or "Stk"),
                "gesamtpreis": float(p.gesamtpreis or 0),
                "gesamtpreis_formatted": format_currency(float(p.gesamtpreis or 0)),
                "warengruppe_id": p.warengruppe_id,
                "warengruppe_name": getattr(p, 'warengruppe_name', None),
            })
            
        grouped = self._group_by_warengruppe(positionen, session)
        
        subtotal = sum(p.get("gesamtpreis", 0) for p in positionen)
        mwst_rate = 19.0
        mwst_betrag = subtotal * (mwst_rate / 100)
        total = subtotal + mwst_betrag

        return {
            "document": {
                "id": dokument.id,
                "typ": dokument.typ,
                "dokument_nr": dokument.dokument_nr,
                "datum": dokument.datum,
                "liefertermin": dokument.liefertermin,
                "betrag_netto": float(dokument.betrag_netto or 0),
                "betrag_brutto": float(dokument.betrag_brutto or 0),
                "kopftext": dokument.kopftext or (vorlage.kopftext if vorlage else None),
                "fusstext": dokument.fusstext or (vorlage.fusstext if vorlage else None),
                "bemerkung": dokument.bemerkung,
                "status": dokument.status,
            },
            "kunde": self._build_kunde_dict(kunde),
            "vorlage": self._build_vorlage_dict(vorlage),
            "positionen": positionen,
            "grouped_positionen": grouped,
            "totals": self._build_totals_dict(subtotal, mwst_rate, mwst_betrag, total, grouped),
            "company": self._get_company_info(session),
            "meta": {
                "title": get_document_title(dokument.typ or "RE"),
                "number": dokument.dokument_nr or format_document_number(dokument.typ or "RE", dokument.id),
                "datum_formatted": format_date(dokument.datum),
                "liefertermin_formatted": format_date(dokument.liefertermin) if dokument.liefertermin else None,
                "typ": dokument.typ,
            }
        }

    def _build_context_from_preview(self, payload: Dict[str, Any], session: Session) -> dict:
        typ = payload.get('typ', 'AN')
        kunde_id = payload.get('kunde_id')
        vorlage_id = payload.get('vorlage_id')
        datum = payload.get('datum')
        
        kunde = session.get(Kunde, kunde_id) if kunde_id else None
        
        vorlage = session.get(Vorlage, vorlage_id) if vorlage_id else None
        if not vorlage:
            vorlage = session.exec(select(Vorlage).where(Vorlage.typ == typ, Vorlage.aktiv == 1, Vorlage.ist_standard == 1).limit(1)).first()

        # Format incoming positions
        positionen_data = payload.get('positionen', [])
        formatted_positionen = []
        for i, pos in enumerate(positionen_data, 1):
            gesamt = float(pos.get('gesamtpreis', pos.get('einzelpreis', 0) * pos.get('menge', 1)))
            formatted_positionen.append({
                "pos": i,
                "bezeichnung": pos.get('bezeichnung', ''),
                "menge": float(pos.get('menge', 1)),
                "einheit": pos.get('einheit', 'Stk'),
                "einzelpreis": float(pos.get('einzelpreis', 0)),
                "einzelpreis_formatted": self._format_currency_with_unit(float(pos.get('einzelpreis', 0)), pos.get('einheit', 'Stk')),
                "gesamtpreis": gesamt,
                "gesamtpreis_formatted": format_currency(gesamt),
                "warengruppe_id": pos.get('warengruppe_id'),
                "warengruppe_name": pos.get('warengruppe_name', 'Sonstige'),
            })

        grouped = self._group_by_warengruppe(formatted_positionen, session)
        
        subtotal = float(payload.get('betrag_netto', sum(p.get("gesamtpreis", 0) for p in formatted_positionen)))
        mwst_rate = 19.0
        mwst_betrag = subtotal * (mwst_rate / 100)
        total = float(payload.get('betrag_brutto', subtotal + mwst_betrag))

        return {
            "document": {
                "id": 0,
                "typ": typ,
                "dokument_nr": f"{typ}-2026-VORSCHAU",
                "datum": datum,
                "liefertermin": payload.get('liefertermin'),
                "betrag_netto": subtotal,
                "betrag_brutto": total,
                "kopftext": vorlage.kopftext if vorlage else None,
                "fusstext": vorlage.fusstext if vorlage else None,
                "bemerkung": None,
                "status": "entwurf",
            },
            "kunde": self._build_kunde_dict(kunde) if kunde else {
                "name": "Unbekannter Kunde", "vorname": None, "strasse": "", "plz": "", "ort": "", "land": "Deutschland", "kundnr": ""
            },
            "vorlage": self._build_vorlage_dict(vorlage),
            "positionen": formatted_positionen,
            "grouped_positionen": grouped,
            "totals": self._build_totals_dict(subtotal, mwst_rate, mwst_betrag, total, grouped),
            "company": self._get_company_info(session),
            "meta": {
                "title": "Vorschau" if typ == 'AN' else "Rechnung" if typ == 'RE' else typ,
                "number": f"{typ}-2026-VORSCHAU",
                "datum_formatted": datum or "",
                "liefertermin_formatted": payload.get('liefertermin') or "",
                "typ": typ,
            }
        }

    def _build_kunde_dict(self, kunde: Optional[Kunde]) -> dict:
        if not kunde:
            return {"name": "Unbekannter Kunde", "vorname": None, "strasse": "", "plz": "", "ort": "", "land": "Deutschland", "kundnr": ""}
        return {
            "name": " ".join(filter(None, [kunde.vorname, kunde.name])),
            "vorname": kunde.vorname,
            "name": kunde.name or "",
            "strasse": kunde.strasse or "",
            "plz": kunde.plz or "",
            "ort": kunde.ort or "",
            "land": getattr(kunde, 'land', None) or "Deutschland",
            "kundnr": kunde.kundnr or "",
        }

    def _build_vorlage_dict(self, vorlage: Optional[Vorlage]) -> dict:
        if not vorlage:
            return {
                "name": None, "kopftext": None, "fusstext": None, "template_datei": None, "html_content": None,
                "mit_zwischensumme": 0, "mit_einzelpreisen": 1, "mit_positionsnummern": 1,
            }
        return {
            "name": vorlage.name,
            "kopftext": vorlage.kopftext,
            "fusstext": vorlage.fusstext,
            "template_datei": vorlage.template_datei,
            "html_content": vorlage.html_content,
            "mit_zwischensumme": vorlage.mit_zwischensumme,
            "mit_einzelpreisen": vorlage.mit_einzelpreisen,
            "mit_positionsnummern": vorlage.mit_positionsnummern,
        }
        
    def _build_totals_dict(self, subtotal, mwst_rate, mwst_betrag, total, grouped) -> dict:
        return {
            "subtotal": subtotal,
            "subtotal_formatted": format_currency(subtotal),
            "mwst_rate": mwst_rate,
            "mwst_rate_formatted": format_mwst_rate(mwst_rate),
            "mwst_betrag": mwst_betrag,
            "mwst_betrag_formatted": format_currency(mwst_betrag),
            "total": total,
            "total_formatted": format_currency(total),
            "warengruppen": [
                {"name": g["name"], "count": len(g["positionen"]), "subtotal_formatted": g["subtotal_formatted"]}
                for g in grouped
            ] if grouped else None,
        }

    # --- Internal Rendering ---

    def _render_context(self, context: dict, session: Session) -> str:
        html_content = context['vorlage'].get('html_content')
        template_datei = context['vorlage'].get('template_datei')
        
        if html_content:
            template = Template(html_content)
            html = template.render(**context)
            return self._inline_css(html)

        if not template_datei:
            templates = {"RE": "rechnung.html", "AN": "angebot.html", "GU": "rechnung.html", "LI": "rechnung.html", "AB": "angebot.html"}
            template_datei = templates.get(context["meta"]["typ"].upper(), "rechnung.html")

        try:
            template = self.env.get_template(template_datei)
        except Exception:
            template = self.env.get_template("rechnung.html")

        html = template.render(**context)
        return self._inline_css(html)

    def _inline_css(self, html: str) -> str:
        try:
            with open(TEMPLATE_DIR / "styles.css", "r", encoding="utf-8") as f:
                css_content = f.read()
            style_tag = f"<style>\n{css_content}\n</style>"
            pattern = re.compile(r'<link[^>]+href=["\']styles\.css["\'][^>]*>')
            if pattern.search(html):
                return pattern.sub(style_tag, html)
            elif "</head>" in html:
                return html.replace("</head>", f"{style_tag}\n</head>")
            return html
        except Exception:
            return html

    def flatten_template(self, template_name: str) -> Optional[str]:
        # Implementation moved from old pdf_service.py untouched
        try:
            source, filename, uptodate = self.env.loader.get_source(self.env, template_name)
        except Exception:
            return None

        if '{% extends ' not in source:
            return self._inline_css_source(source)

        extends_match = re.search(r'\{%\s*extends\s+["\']([^"\']+)["\']', source)
        if not extends_match:
            return self._inline_css_source(source)

        parent_name = extends_match.group(1)
        try:
            parent_source, _, _ = self.env.loader.get_source(self.env, parent_name)
        except Exception:
            return self._inline_css_source(source)

        result = parent_source
        child_blocks = re.findall(r'\{%\s*block\s+(\w+)\s*%\}(.*?)\{%\s*endblock\s*\}', source, re.DOTALL)
        for block_name, block_content in child_blocks:
            pattern = re.compile(r'(\{%\s*block\s+' + block_name + r'\s*%\}.*?\{%\s*endblock\s*\})', re.DOTALL)
            result = pattern.sub(block_content.strip(), result)

        empty_blocks = re.findall(r'(\{%\s*block\s+(\w+)\s*%\}\s*\{%\s*endblock\s*\})', result, re.DOTALL)
        for _, block_name in empty_blocks:
            pattern = re.compile(r'\{%\s*block\s+' + block_name + r'\s*%\}\s*\{%\s*endblock\s*\}', re.DOTALL)
            result = pattern.sub('', result)

        return self._inline_css_source(result)

    def _inline_css_source(self, source: str) -> str:
        try:
            with open(TEMPLATE_DIR / "styles.css", "r", encoding="utf-8") as f:
                css_content = f.read()
            style_tag = f"<style>\n{css_content}\n</style>"
            pattern = re.compile(r'<link[^>]+href=["\']styles\.css["\'][^>]*>')
            if pattern.search(source):
                return pattern.sub(style_tag, source)
            return source
        except Exception:
            return source

document_renderer = DocumentRenderer()
