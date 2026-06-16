from typing import Annotated
from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.farmer_contract import crud
from app.domains.farmer_contract.schemas import (
    FarmerContractListResponse,
    FarmerContractFormMetadata,
    FarmerContractCreate,
    FarmerContractCreated,
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
    data: FarmerContractCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.create_farmer_contract(session=session, data=data)


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
