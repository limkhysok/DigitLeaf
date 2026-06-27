from typing import Annotated, Literal, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
import openpyxl
from app.core.config import CAMBODIA_TZ
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.sack_registration import crud
from app.domains.sack_registration.schemas import (
    SackRegistrationCreate,
    SackRegistrationUpdate,
    SackRegistrationPublic,
    SackRegistrationListResponse,
    SackRegistrationStats,
)

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Sack registration not found"
_FARMER_NOT_FOUND = "Member farmer not found"
_FARMER_NOT_IN_REPRESENT = "Farmer does not belong to the selected represent; update the farmer too"


@router.get("/", response_model=SackRegistrationListResponse)
async def list_registrations(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_sack_in_kg: Optional[Literal["asc", "desc"]] = None,
    status: Optional[Literal["pending", "confirmed"]] = None,
    represent_id: Optional[int] = None,
):
    skip = (page - 1) * limit
    items, total = await crud.get_all(
        session=session,
        skip=skip,
        limit=limit,
        search=search,
        date_from=date_from,
        date_to=date_to,
        sort_sack_in_kg=sort_sack_in_kg,
        status=status,
        represent_id=represent_id,
    )
    return SackRegistrationListResponse(
        items=items,  # type: ignore[arg-type]
        total=total,
        has_more=(skip + len(items)) < total,
    )


@router.get("/export")
async def export_registrations(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[Literal["pending", "confirmed"]] = None,
    represent_id: Optional[int] = None,
):
    _EXPORT_LIMIT = 10_000
    items, total = await crud.get_all(
        session=session,
        skip=0,
        limit=_EXPORT_LIMIT,
        search=search,
        date_from=date_from,
        date_to=date_to,
        status=status,
        represent_id=represent_id,
    )
    if total > _EXPORT_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Export exceeds {_EXPORT_LIMIT:,} records ({total:,} matched). Apply filters to narrow the result.",
        )

    wb = openpyxl.Workbook()
    ws = wb.worksheets[0]
    ws.title = "Sack Registrations"

    headers = ["ID", "Represent Name", "Member Farmer", "Sack (KG)", "Registered At", "Notes"]
    ws.append(headers)

    total_sack = 0.0
    for item in items:
        sack_val = item.get("sack_in_kg") or 0.0
        total_sack += sack_val
        reg_at = item.get("created_at")
        if reg_at:
            if reg_at.tzinfo is not None:
                reg_at = reg_at.astimezone(CAMBODIA_TZ)
            reg_at = reg_at.strftime("%Y-%m-%d %H:%M:%S")
        ws.append([
            item.get("id"), item.get("represent_name"), item.get("member_farmer_name"),
            sack_val, reg_at, item.get("notes"),
        ])

    ws.append([])
    ws.append(["", "", "Total Sum:", total_sack, "", ""])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="sack_registrations_export.xlsx"'},
    )


@router.get("/stats", response_model=SackRegistrationStats)
async def get_stats(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_stats(session=session)


@router.get("/{sack_id}", response_model=SackRegistrationPublic, responses={404: {"description": _NOT_FOUND}})
async def get_registration(
    sack_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = await crud.get_details(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return record


@router.post(
    "/",
    response_model=SackRegistrationPublic,
    status_code=201,
    responses={404: {"description": "Represent or member farmer not found"}},
)
async def create_registration(
    data: SackRegistrationCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    if current_user.id is None:
        raise HTTPException(status_code=500, detail="Authenticated user has no id")
    record, error = await crud.create(
        session=session,
        data=data,
        current_user_id=current_user.id,
        current_user_name=current_user.user_name,
    )
    if error == "represent_not_found":
        raise HTTPException(status_code=404, detail="Represent not found")
    if error == "farmer_not_found":
        raise HTTPException(status_code=404, detail=_FARMER_NOT_FOUND)
    return record


@router.patch(
    "/{sack_id}",
    response_model=SackRegistrationPublic,
    responses={404: {"description": _NOT_FOUND}},
)
async def update_registration(
    sack_id: int,
    data: SackRegistrationUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = await crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    if current_user.id is None:
        raise HTTPException(status_code=500, detail="Authenticated user has no id")
    updated, error = await crud.update(
        session=session,
        record=record,
        data=data,
        current_user_id=current_user.id,
        current_user_name=current_user.user_name,
    )
    if error == "represent_not_found":
        raise HTTPException(status_code=404, detail="Represent not found")
    if error == "farmer_not_found":
        raise HTTPException(status_code=404, detail=_FARMER_NOT_FOUND)
    if error == "farmer_not_in_represent":
        raise HTTPException(status_code=422, detail=_FARMER_NOT_IN_REPRESENT)
    return updated


@router.delete(
    "/{sack_id}",
    status_code=204,
    responses={404: {"description": _NOT_FOUND}},
)
async def delete_registration(
    sack_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = await crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    await crud.delete(session=session, record=record)
