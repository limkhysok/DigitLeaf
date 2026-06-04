from typing import Annotated, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
import openpyxl
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
    SackRegistrationStatusCounts,
    RepresentPublic,
    MemberFarmerPublic,
    FarmerContrastPublic,
    FarmerContrastListResponse,
)

router = APIRouter(route_class=AuditLogRoute)

@router.get("/farmer-contrast", response_model=FarmerContrastListResponse)
async def list_farmer_contrasts(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    year: int = 2026,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=500),
):
    return await crud.get_farmer_contrasts(session=session, year=year, skip=skip, limit=limit)

_NOT_FOUND = "Sack registration not found"
_FARMER_NOT_FOUND = "Member farmer not found"


@router.get("/represents", response_model=list[RepresentPublic])
async def list_represents(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_represents(session=session)


@router.get(
    "/member-farmers",
    response_model=list[MemberFarmerPublic],
    responses={400: {"description": "No search parameter provided"}},
)
async def get_member_farmers(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    q: Optional[str] = None,
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
    represent_id: Optional[int] = None,
    limit: int = 10,
):
    """
    Farmer lookup — two modes:
    - Fuzzy typeahead: provide `q` (returns up to `limit` results).
    - Exact lookup: provide `name` and/or `identity_card` (returns 0 or 1 result).
    """
    if q is not None:
        return await crud.query_member_farmers(
            session=session, query=q, represent_id=represent_id, limit=limit
        )
    if name or identity_card:
        farmer = await crud.search_member_farmer(session=session, name=name, identity_card=identity_card)
        return [farmer] if farmer else []
    raise HTTPException(status_code=400, detail="Provide q, name, or identity_card")


@router.get("/", response_model=SackRegistrationListResponse)
async def list_registrations(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    status: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_sack_in_kg: Optional[str] = None,
):
    items, total = await crud.get_all(
        session=session,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        date_from=date_from,
        date_to=date_to,
        sort_sack_in_kg=sort_sack_in_kg,
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
    status: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    items, _ = await crud.get_all(
        session=session,
        skip=0,
        limit=1000000,
        search=search,
        status=status,
        date_from=date_from,
        date_to=date_to,
    )
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sack Registrations"
    
    headers = [
        "ID", "Represent Name", "Member Farmer", 
        "Sack (KG)", "Status", "Registered At", "Notes"
    ]
    ws.append(headers)
    
    status_map = {0: "Pending", 1: "Approved", 2: "Rejected"}
    total_sack = 0.0
    
    for item in items:
        sack_val = item.get("sack_in_kg") or 0.0
        total_sack += sack_val
        st_val = item.get("status")
        st_str = status_map.get(st_val, str(st_val))
        
        reg_at = item.get("registered_at")
        if reg_at:
            reg_at = reg_at.strftime("%Y-%m-%d %H:%M:%S")
            
        row = [
            item.get("id"),
            item.get("represent_name"),
            item.get("member_farmer_name"),
            sack_val,
            st_str,
            reg_at,
            item.get("notes")
        ]
        ws.append(row)
        
    ws.append([])
    ws.append(["", "", "Total Sum:", total_sack, "", "", ""])
    
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    filename = "sack_registrations_export.xlsx"
    headers_dict = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers_dict
    )


@router.get("/status-counts", response_model=SackRegistrationStatusCounts)
async def get_status_counts(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    return await crud.get_status_counts(
        session=session,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )


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
    assert current_user.id is not None
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
    updated, error = await crud.update(session=session, record=record, data=data)
    if error == "farmer_not_found":
        raise HTTPException(status_code=404, detail=_FARMER_NOT_FOUND)
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
