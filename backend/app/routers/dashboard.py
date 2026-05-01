from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func, or_
from typing import List, Dict, Any, Optional
from ..database import get_session
from ..models.dokumente import Dokument
from ..models.kunden import Kunde
from ..models.artikel import Artikel
from ..models.warengruppen import Warengruppe

router = APIRouter()

@router.get("/search")
async def global_search(
    q: str = Query(..., min_length=2),
    session: Session = Depends(get_session)
):
    results: List[Dict[str, Any]] = []
    search_term = f"%{q}%"
    
    kunden = session.exec(
        select(Kunde).where(
            or_(
                Kunde.name.like(search_term),
                Kunde.kundnr.like(search_term),
                Kunde.ort.like(search_term)
            )
        ).limit(5)
    ).all()
    for k in kunden:
        results.append({
            'type': 'kunde',
            'id': k.id,
            'label': k.name or f"{k.vorname} {k.name}",
            'subtitle': f"{k.kundnr} · {k.ort}",
            'href': f'/stammdaten/kunden/{k.id}',
        })
    
    dokumente = session.exec(
        select(Dokument).where(
            Dokument.dokument_nr.like(search_term)
        ).limit(5)
    ).all()
    for d in dokumente:
        results.append({
            'type': 'dokument',
            'id': d.id,
            'label': d.dokument_nr,
            'subtitle': f"{d.typ} · {d.datum or ''}",
            'href': f'/rechnungen/{d.id}',
        })
    
    artikel = session.exec(
        select(Artikel).where(
            or_(
                Artikel.bezeichnung.like(search_term),
                Artikel.artnr.like(search_term)
            )
        ).limit(5)
    ).all()
    for a in artikel:
        results.append({
            'type': 'artikel',
            'id': a.id,
            'label': a.bezeichnung,
            'subtitle': f"{a.artnr}",
            'href': f'/stammdaten/artikel',
        })
    
    warengruppen = session.exec(
        select(Warengruppe).where(
            Warengruppe.bezeichnung.like(search_term)
        ).limit(5)
    ).all()
    for wg in warengruppen:
        results.append({
            'type': 'warengruppe',
            'id': wg.id,
            'label': wg.bezeichnung,
            'subtitle': f'{wg.anzahl_artikel or 0} Artikel',
            'href': f'/stammdaten/artikel',
        })
    
    return results

@router.get("/aggregate")
async def dashboard_aggregate(
    typ: str = Query(default="RE", description="Document type: RE or AN"),
    days: Optional[int] = Query(default=None),
    year: Optional[int] = Query(default=None),
    all_years: Optional[bool] = Query(default=None),
    session: Session = Depends(get_session)
):
    """Get dashboard aggregation with support for days, year, or all years."""
    from datetime import datetime, timedelta
    
    # Fetch all docs for this type (dataset is small ~250 docs)
    docs = session.exec(
        select(Dokument).where(Dokument.typ == typ)
    ).all()
    
    # Pre-calculate corrected dates for all docs
    doc_data = []
    available_years_set = set()
    for d in docs:
        corrected = d.datum
        if corrected:
            try:
                dt = datetime.strptime(corrected, '%Y-%m-%d').date()
                doc_data.append({'corrected': corrected, 'dt': dt, 'doc': d})
                available_years_set.add(dt.year)
            except ValueError:
                continue

    # Determine filter
    filtered_docs = []
    if year:
        filtered_docs = [item for item in doc_data if item['dt'].year == year]
    elif days:
        cutoff = (datetime.now() - timedelta(days=days)).date()
        filtered_docs = [item for item in doc_data if item['dt'] >= cutoff]
    elif all_years:
        filtered_docs = doc_data
    else:
        # Default to 30 days if nothing specified
        cutoff = (datetime.now() - timedelta(days=30)).date()
        filtered_docs = [item for item in doc_data if item['dt'] >= cutoff]
    
    # Compute aggregates
    umsatz = 0.0
    offen_count = 0
    aktivitaet_map: Dict[str, float] = {}
    wg_revenue_map: Dict[int, float] = {}
    
    # Collect IDs for position query
    relevant_doc_ids = []
    
    for item in filtered_docs:
        d = item['doc']
        corrected = item['corrected']
        
        val = float(d.betrag_brutto or 0)
        umsatz += val
        if d.status != 'bezahlt':
            offen_count += 1
        
        day_key = corrected
        aktivitaet_map[day_key] = aktivitaet_map.get(day_key, 0.0) + val
        relevant_doc_ids.append(d.id)
    
    # Warengruppen breakdown for filtered docs
    if relevant_doc_ids:
        from ..models.positionen import Position
        positions = session.exec(
            select(Position).where(Position.id > 0) # Just a base statement
        ).all() # This is inefficient but let's filter in python for now to be safe with SQLite IN limits
        
        relevant_set = set(relevant_doc_ids)
        for p in positions:
            if p.dokument_id in relevant_set:
                if p.warengruppe_id:
                    v = float(p.gesamtpreis or 0)
                    wg_revenue_map[p.warengruppe_id] = wg_revenue_map.get(p.warengruppe_id, 0.0) + v
                else:
                    v = float(p.gesamtpreis or 0)
                    wg_revenue_map[0] = wg_revenue_map.get(0, 0.0) + v

    # Fetch warengruppe names
    wg_list = []
    if wg_revenue_map:
        ids = [i for i in wg_revenue_map.keys() if i > 0]
        wgs = session.exec(select(Warengruppe).where(Warengruppe.id.in_(ids))).all() if ids else []
        wg_name_map = {wg.id: wg.bezeichnung for wg in wgs}
        wg_name_map[0] = "Unkategorisiert"
        
        for wg_id, revenue in wg_revenue_map.items():
            wg_list.append({
                'id': wg_id,
                'name': wg_name_map.get(wg_id, f"WG #{wg_id}"),
                'umsatz': round(revenue, 2)
            })
    wg_list.sort(key=lambda x: x['umsatz'], reverse=True)

    # Aktivitaet list
    aktivitaet_list = [
        {'datum': k, 'umsatz': round(v, 2)}
        for k, v in sorted(aktivitaet_map.items())
    ]
    
    # Recent docs (within filtered set)
    filtered_docs.sort(key=lambda x: x['corrected'], reverse=True)
    recent_list = []
    for item in filtered_docs[:10]:
        d = item['doc']
        kunde = session.get(Kunde, d.kunde_id)
        kunde_name = None
        if kunde:
            parts = [p for p in [kunde.vorname, kunde.name] if p]
            kunde_name = " ".join(parts) if parts else None
        
        recent_list.append({
            'id': d.id,
            'dokument_nr': d.dokument_nr,
            'typ': d.typ,
            'status': d.status,
            'datum': item['corrected'],
            'betrag_brutto': float(d.betrag_brutto or 0),
            'kunde_id': d.kunde_id,
            'kunde_name': kunde_name,
        })
    
    return {
        'umsatz': round(umsatz, 2),
        'offene_count': offen_count,
        'days': days,
        'year': year,
        'aktivitaet': aktivitaet_list,
        'recent': recent_list,
        'warengruppen': wg_list,
        'available_years': sorted(list(available_years_set), reverse=True)
    }
