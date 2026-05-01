from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, and_, func
from typing import List, Optional
from ..database import get_session
from ..models.warengruppen import Warengruppe, WarengruppeRead, WarengruppeCreate, WarengruppeUpdate
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[WarengruppeRead])
async def read_warengruppen(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    bezeichnung: Optional[str] = None,
    session: Session = Depends(get_session)
):
    statement = select(Warengruppe)

    filters = []
    if bezeichnung:
        filters.append(Warengruppe.bezeichnung.like(f"%{bezeichnung}%"))

    if filters:
        statement = statement.where(and_(*filters))

    if sort.sort:
        if sort.sort.startswith('-'):
            field_name = sort.sort[1:]
            direction = 'desc'
        else:
            field_name = sort.sort
            direction = 'asc'

        if hasattr(Warengruppe, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Warengruppe, field_name).desc())
            else:
                statement = statement.order_by(getattr(Warengruppe, field_name).asc())
        else:
            statement = statement.order_by(Warengruppe.bezeichnung.asc())
    else:
        statement = statement.order_by(Warengruppe.bezeichnung.asc())

    statement = statement.offset(pagination.skip).limit(pagination.limit)
    warengruppen = session.exec(statement).all()

    count_statement = select(Warengruppe)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).all().__len__()

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=warengruppen, total=total_count, page=page, size=pagination.limit, pages=pages)


@router.get("/search")
async def search_warengruppen(
    q: str,
    limit: int = 7,
    session: Session = Depends(get_session)
):
    if not q or len(q) < 2:
        return []

    search_term = f"%{q}%"
    statement = (
        select(Warengruppe)
        .where(
            (Warengruppe.bezeichnung.like(search_term)) |
            (Warengruppe.beschreibung.like(search_term))
        )
        .limit(limit)
    )
    results = session.exec(statement).all()

    return [
        {
            'id': wg.id,
            'label': wg.bezeichnung,
            'subtitle': wg.beschreibung or '',
            'type': 'warengruppe',
            'href': '/stammdaten/warengruppen',
        }
        for wg in results
    ]


@router.get("/analysis")
async def warengruppen_analysis(
    days: Optional[int] = Query(default=None),
    year: Optional[int] = Query(default=None),
    all_years: Optional[bool] = Query(default=None),
    session: Session = Depends(get_session)
):
    from ..models.dokumente import Dokument
    from ..models.positionen import Position
    from ..models.artikel import Artikel
    from datetime import datetime, timedelta
    from sqlmodel import select, func

    # 1. Determine date filter
    cutoff = None
    if year:
        pass # Handle in python loop
    elif days:
        cutoff = (datetime.now() - timedelta(days=days)).date()
    elif all_years:
        pass
    else:
        # Default to 30 days
        cutoff = (datetime.now() - timedelta(days=30)).date()

    # 2. Get all RE docs first to filter by date (dataset is small)
    docs = session.exec(select(Dokument).where(Dokument.typ == 'RE')).all()
    
    relevant_doc_ids = []
    prev_period_doc_ids = []
    for d in docs:
        if d.datum:
            try:
                doc_date = datetime.strptime(d.datum, '%Y-%m-%d').date()
                if year and doc_date.year == year:
                    relevant_doc_ids.append(d.id)
                    if doc_date.year == year - 1:
                        prev_period_doc_ids.append(d.id)
                elif cutoff and doc_date >= cutoff:
                    relevant_doc_ids.append(d.id)
                elif all_years:
                    relevant_doc_ids.append(d.id)
                    
                # Calculate previous period for growth
                if cutoff and days:
                    prev_cutoff = cutoff - timedelta(days=days)
                    if prev_cutoff <= doc_date < cutoff:
                        prev_period_doc_ids.append(d.id)
            except ValueError:
                pass
                
    if not relevant_doc_ids:
        relevant_doc_ids = [0] # dummy to avoid empty IN clause
    if not prev_period_doc_ids:
        prev_period_doc_ids = [0]
        
    statement = (
        select(
            Warengruppe, 
            func.sum(Position.gesamtpreis), 
            func.count(Position.id),
            func.sum(func.coalesce(Artikel.ek_preis, 0) * Position.menge)
        )
        .join(Position, Position.warengruppe_id == Warengruppe.id)
        .outerjoin(Artikel, Position.artikel_id == Artikel.id)
        .where(Position.dokument_id.in_(relevant_doc_ids))
        .group_by(Warengruppe.id)
    )
    
    prev_statement = (
        select(Warengruppe.id, func.sum(Position.gesamtpreis))
        .join(Position, Position.warengruppe_id == Warengruppe.id)
        .where(Position.dokument_id.in_(prev_period_doc_ids))
        .group_by(Warengruppe.id)
    )
    
    results = session.exec(statement).all()
    prev_results = dict(session.exec(prev_statement).all())
    
    analysis_items = []
    total_revenue = 0.0
    total_cost = 0.0
    
    for wg, revenue, count, cost in results:
        revenue = float(revenue or 0)
        cost = float(cost or 0)
        total_revenue += revenue
        total_cost += cost
        
        margin = 0.0
        if revenue > 0:
            margin = ((revenue - cost) / revenue) * 100
            
        prev_rev = float(prev_results.get(wg.id, 0))
        growth = 0.0
        if prev_rev > 0:
            growth = ((revenue - prev_rev) / prev_rev) * 100
        elif revenue > 0 and prev_rev == 0:
            growth = 100.0 # From 0 to something
            
        analysis_items.append({
            "id": wg.id,
            "bezeichnung": wg.bezeichnung,
            "revenue": round(revenue, 2),
            "count": count,
            "margin": round(margin, 1),
            "growth": round(growth, 1),
        })
        
    analysis_items.sort(key=lambda x: x['revenue'], reverse=True)
    
    # KPIs
    active_articles = session.exec(select(func.count(Artikel.id)).where(Artikel.aktiv == 1)).one()
    available_years = sorted(list(set(datetime.strptime(d.datum, '%Y-%m-%d').year for d in docs if d.datum)), reverse=True)
    
    avg_margin = 0.0
    if total_revenue > 0:
        avg_margin = ((total_revenue - total_cost) / total_revenue) * 100
        
    return {
        "total_revenue": round(total_revenue, 2),
        "avg_margin": round(avg_margin, 1),
        "top_group": analysis_items[0]["bezeichnung"] if analysis_items else "N/A",
        "active_articles": active_articles,
        "items": analysis_items,
        "available_years": available_years
    }

@router.get("/{warengruppe_id}", response_model=WarengruppeRead)
async def read_warengruppe(warengruppe_id: int, session: Session = Depends(get_session)):
    warengruppe = session.get(Warengruppe, warengruppe_id)
    if not warengruppe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warengruppe not found")
    return warengruppe


@router.post("/", response_model=WarengruppeRead)
async def create_warengruppe(warengruppe: WarengruppeCreate, session: Session = Depends(get_session)):
    db_warengruppe = Warengruppe.from_orm(warengruppe)
    session.add(db_warengruppe)
    session.commit()
    session.refresh(db_warengruppe)
    return db_warengruppe


@router.put("/{warengruppe_id}", response_model=WarengruppeRead)
async def update_warengruppe(warengruppe_id: int, warengruppe: WarengruppeUpdate, session: Session = Depends(get_session)):
    db_warengruppe = session.get(Warengruppe, warengruppe_id)
    if not db_warengruppe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warengruppe not found")

    data = warengruppe.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_warengruppe, key, value)

    session.add(db_warengruppe)
    session.commit()
    session.refresh(db_warengruppe)
    return db_warengruppe


@router.delete("/{warengruppe_id}")
async def delete_warengruppe(warengruppe_id: int, session: Session = Depends(get_session)):
    warengruppe = session.get(Warengruppe, warengruppe_id)
    if not warengruppe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warengruppe not found")
    session.delete(warengruppe)
    session.commit()
    return {"message": "Warengruppe deleted successfully"}
