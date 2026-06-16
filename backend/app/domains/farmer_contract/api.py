from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.farmer_contract import crud
from app.domains.farmer_contract.schemas import (
    FarmerContractListResponse,
    FarmerContractPublic,
    FarmerContractFormMetadata,
    FarmerContractCreate,
    FarmerContractCreated,
    FarmerContractUpdate,
    FarmerContractPatch,
)

router = APIRouter(route_class=AuditLogRoute)


@router.get("/form-metadata", response_model=FarmerContractFormMetadata)
async def get_form_metadata(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    result = await crud.get_form_metadata(session=session)
    return result


@router.post("/", response_model=FarmerContractCreated, status_code=201)
async def create_farmer_contract(
    request: Request,
    data: FarmerContractCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    ip = request.client.host if request.client else ""
    return await crud.create_farmer_contract(session=session, data=data, current_user=current_user, ip_address=ip)


@router.get("/", response_model=FarmerContractListResponse)
async def list_farmer_contracts(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    year: int = 2026,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
):
    skip = (page - 1) * limit
    result = await crud.get_farmer_contracts(session=session, year=year, skip=skip, limit=limit)
    return FarmerContractListResponse(
        items=result["items"],
        total=result["total"],
        has_more=(skip + len(result["items"])) < result["total"],
    )


@router.get("/{mf_con_id}", response_model=FarmerContractPublic)
async def get_farmer_contract(
    mf_con_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    result = await crud.get_farmer_contract(session=session, mf_con_id=mf_con_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Farmer contract not found")
    return result


@router.put("/{mf_con_id}", response_model=FarmerContractCreated)
async def update_farmer_contract(
    mf_con_id: int,
    request: Request,
    data: FarmerContractUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    ip = request.client.host if request.client else ""
    try:
        return await crud.update_farmer_contract(
            session=session, mf_con_id=mf_con_id, data=data, current_user=current_user, ip_address=ip
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{mf_con_id}", response_model=FarmerContractCreated)
async def patch_farmer_contract(
    mf_con_id: int,
    request: Request,
    data: FarmerContractPatch,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    ip = request.client.host if request.client else ""
    try:
        return await crud.patch_farmer_contract(
            session=session, mf_con_id=mf_con_id, data=data, current_user=current_user, ip_address=ip
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{mf_con_id}", status_code=204)
async def delete_farmer_contract(
    mf_con_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        await crud.delete_farmer_contract(session=session, mf_con_id=mf_con_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
