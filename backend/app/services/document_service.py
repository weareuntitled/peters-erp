from typing import Optional, List
from sqlmodel import Session, select, func
from datetime import datetime

from ..models.dokumente import Dokument, DokumentCreate
from ..models.positionen import Position
from ..models.vorlagen import Vorlage

class DocumentService:
    def create_document(self, dokument_in: DokumentCreate, session: Session) -> Dokument:
        positionen_data = dokument_in.positionen or []
        dokument_dict = dokument_in.model_dump(exclude={'positionen'})
        db_dokument = Dokument(**dokument_dict)

        if db_dokument.status == 'entwurf':
            db_dokument.status = 'offen'

        if not db_dokument.vorlage_id:
            standard = session.exec(
                select(Vorlage)
                .where(Vorlage.typ == db_dokument.typ)
                .where(Vorlage.aktiv == 1)
                .where(Vorlage.ist_standard == 1)
                .limit(1)
            ).first()
            if standard:
                db_dokument.vorlage_id = standard.id

        if not db_dokument.dokument_nr:
            typ_prefix = db_dokument.typ or 'DOC'
            result = session.exec(
                select(func.max(Dokument.dokument_nr)).where(Dokument.typ == db_dokument.typ)
            ).first()
            max_nr = result or f"{typ_prefix}-2026-00000"
            parts = max_nr.rsplit('-', 1)
            if len(parts) == 2 and parts[1].isdigit():
                new_num = int(parts[1]) + 1
                db_dokument.dokument_nr = f"{parts[0]}-{new_num:05d}"
            else:
                db_dokument.dokument_nr = f"{typ_prefix}-2026-00001"

        if not db_dokument.datum:
            db_dokument.datum = datetime.now().strftime("%Y-%m-%d")

        session.add(db_dokument)
        session.commit()
        session.refresh(db_dokument)

        for idx, pos_data in enumerate(positionen_data, 1):
            pos_dict = pos_data.model_dump()
            pos_dict['dokument_id'] = db_dokument.id
            pos_dict['position_nr'] = idx
            
            if not pos_dict.get('warengruppe_id') and pos_dict.get('warengruppe_name'):
                from ..models.warengruppen import Warengruppe
                wg = session.exec(
                    select(Warengruppe).where(Warengruppe.bezeichnung == pos_dict['warengruppe_name'])
                ).first()
                if wg:
                    pos_dict['warengruppe_id'] = wg.id
            
            db_position = Position(**pos_dict)
            session.add(db_position)
            
        session.commit()
        session.refresh(db_dokument)
        return db_dokument

    def duplicate_document(self, document_id: int, new_typ: str, session: Session) -> Optional[Dokument]:
        old_doc = session.get(Dokument, document_id)
        if not old_doc:
            return None

        # Implementation kept from old DocumentService
        new_doc_data = old_doc.model_dump(exclude={'id', 'dokument_nr', 'typ', 'status', 'erstellt_am', 'geaendert_am', 'gedruckt', 'gemailt', 'bezahlt_summe'})
        new_doc = Dokument(**new_doc_data)
        new_doc.typ = new_typ
        new_doc.status = "offen"
        
        # We recursively call create_document but we have to pass positions manually
        old_positions = session.exec(select(Position).where(Position.dokument_id == document_id)).all()
        
        session.add(new_doc)
        session.commit()
        session.refresh(new_doc)
        
        from ..services.numbering_service import numbering_service
        new_doc.dokument_nr = numbering_service.get_next_number(new_typ, session)
        
        for old_pos in old_positions:
            pos_data = old_pos.model_dump(exclude={'id', 'dokument_id'})
            new_pos = Position(**pos_data)
            new_pos.dokument_id = new_doc.id
            session.add(new_pos)
            
        session.commit()
        session.refresh(new_doc)
        return new_doc

document_service = DocumentService()
