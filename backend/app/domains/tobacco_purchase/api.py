from typing import Annotated, List, Literal, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from . import crud, schemas

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


@router.get("/vendor-sack")
async def get_vendor_sack(
    vendor_name: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    sack_kg = await crud.get_vendor_sack_kg(db=session, vendor_name=vendor_name)
    total_sack_kg = await crud.get_vendor_total_active_sack_kg(db=session, vendor_name=vendor_name)
    return {"sack_in_kg": sack_kg, "total_sack_in_kg": total_sack_kg}


@router.get("/vendors", response_model=List[schemas.VendorItem])
async def list_vendors_by_buyer(
    buyer_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_vendors_by_buyer(db=session, buyer_id=buyer_id)


@router.post("/", response_model=schemas.Purchase, status_code=201)
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
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    buyer: Optional[int] = None,
    sort_grand_total: Optional[Literal["asc", "desc"]] = None,
    sort_net_weight: Optional[Literal["asc", "desc"]] = None,
):
    items, total = await crud.get_purchases(
        db=session,
        skip=skip,
        limit=limit,
        search=search,
        date_from=date_from,
        date_to=date_to,
        buyer=buyer,
        sort_grand_total=sort_grand_total,
        sort_net_weight=sort_net_weight,
    )
    return schemas.PurchaseList(items=items, total=total)  # type: ignore[arg-type]


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
