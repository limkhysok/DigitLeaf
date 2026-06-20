from datetime import date
from typing import Annotated, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Security, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from . import crud, schemas
from .report import build_tobacco_purchase_template

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Tobacco purchase not found"


@router.get("/purchasers")
async def list_purchasers(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_purchasers(db=session)


@router.get("/regions")
async def list_regions(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_regions(db=session)


@router.get("/ovens")
async def list_ovens(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_ovens(db=session)


@router.get("/tobacco-types", response_model=List[schemas.TobaccoItem])
async def list_tobacco_types(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_tobacco_types(db=session)

@router.get("/form-metadata", response_model=schemas.FormMetadataResponse)
async def get_form_metadata(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
) -> schemas.FormMetadataResponse:
    purchasers = await crud.get_purchasers(db=session)
    regions = await crud.get_regions(db=session)
    ovens = await crud.get_ovens(db=session)
    tobacco_types = await crud.get_tobacco_types(db=session)
    return schemas.FormMetadataResponse(
        purchasers=purchasers,
        regions=regions,
        ovens=ovens,
        tobacco_types=[schemas.TobaccoItem.model_validate(t) for t in tobacco_types],
    )


@router.get("/vendor-sack")
async def get_vendor_sack(
    vendor_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    available = await crud.get_vendor_available_sack_kg(db=session, vendor_id=vendor_id)
    return {"sack_in_kg": available, "total_sack_in_kg": available}


@router.get("/vendors", response_model=List[schemas.VendorItem])
async def list_vendors(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    buyer_id: Optional[int] = None,
    search: Optional[str] = None,
):
    if buyer_id is not None:
        return await crud.get_vendors_by_buyer(db=session, buyer_id=buyer_id)
    return await crud.search_vendors(db=session, search=search or "")


@router.post("/", response_model=Optional[schemas.Purchase], status_code=201)
async def create_purchase(
    data: schemas.PurchaseCreate,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    ip_address = request.client.host if request.client else "unknown"
    try:
        purchase = await crud.create_purchase(
            db=session,
            obj_in=data,
            user_name=current_user.user_name,
            ip_address=ip_address,
        )
        return purchase
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/", response_model=schemas.PurchaseList)
async def list_purchases(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    buyer: Optional[int] = None,
    sort_grand_total: Optional[Literal["asc", "desc"]] = None,
    sort_net_weight: Optional[Literal["asc", "desc"]] = None,
):
    skip = (page - 1) * limit
    rows, total = await crud.get_purchases(
        db=session,
        skip=skip,
        limit=limit,
        search=search,
        buyer=buyer,
        sort_grand_total=sort_grand_total,
        sort_net_weight=sort_net_weight,
    )
    items = [
        schemas.PurchaseListItem(
            tp_id=tp.tp_id,
            invoice_num=tp.invoice_num,
            buyer=tp.buyer,
            vendor_id=tp.vendor_id,
            vendor_name=vendor_name or (
                str(tp.vendor_id) if tp.vendor_id and not str(tp.vendor_id).isdigit() else None
            ),
            v_addr=tp.v_addr,
            region=tp.region,
            tp_date=tp.tp_date,
            tp_note=tp.tp_note,
            closing=tp.closing,
            oven=tp.oven,
            rate=tp.rate,
            user=tp.user,
            do_date=tp.do_date,
            total_net_weight=tp.total_net_weight,
            grand_total=tp.grand_total,
            tobacco_item_count=detail_count,
        )
        for tp, vendor_name, detail_count in rows
    ]
    return schemas.PurchaseList(items=items, total=total, has_more=(skip + len(items)) < total)


@router.get("/report/template")
async def download_purchase_report_template(
    buyer_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    _EXPORT_LIMIT = 10_000
    data = await crud.get_purchase_report_data(db=session, buyer_id=buyer_id, date_from=date_from, date_to=date_to)
    if len(data["rows"]) > _EXPORT_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Export exceeds {_EXPORT_LIMIT:,} records ({len(data['rows']):,} matched). Narrow the date range.",
        )
    stream = build_tobacco_purchase_template(
        representative=data["representative"],
        region=data["region"],
        oven=data["oven"],
        report_date=data["report_date"],
        rows=data["rows"],
    )
    filename = f"tobacco_purchase_template_{data['report_date'].isoformat()}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{tp_id}", response_model=schemas.Purchase, responses={404: {"description": _NOT_FOUND}})
async def get_purchase(
    tp_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    purchase = await crud.get_purchase(db=session, tp_id=tp_id)
    if not purchase:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return purchase


@router.patch("/{tp_id}", response_model=schemas.Purchase, responses={404: {"description": _NOT_FOUND}})
async def update_purchase(
    tp_id: int,
    data: schemas.PurchaseUpdate,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    db_obj = await crud.get_purchase(db=session, tp_id=tp_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)

    ip_address = request.client.host if request.client else "unknown"
    try:
        return await crud.update_purchase(
            db=session,
            db_obj=db_obj,
            obj_in=data,
            user_name=current_user.user_name,
            ip_address=ip_address,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{tp_id}", status_code=204, responses={404: {"description": _NOT_FOUND}})
async def delete_purchase(
    tp_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    success = await crud.delete_purchase(db=session, tp_id=tp_id)
    if not success:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return None
