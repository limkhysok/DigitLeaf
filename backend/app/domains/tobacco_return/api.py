from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.api.deps import get_current_user
from app.domains.users.models import User
from app.domains.tobacco_return.schemas import TobaccoReturnItem, TobaccoReturnListResponse, TContractReturnCreate
from app.domains.tobacco_return import crud

router = APIRouter()


@router.get("/", response_model=TobaccoReturnListResponse)
async def read_tobacco_returns(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    year: Optional[int] = Query(None),
):
    return await crud.get_tobacco_returns(session, skip=skip, limit=limit, year=year)


@router.get("/years", response_model=List[str])
async def read_available_years(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_available_years(session)


@router.post("/")
async def create_tobacco_return(
    data: TContractReturnCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        return await crud.create_return(session, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/contracts")
async def get_contracts(
    vendor_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_vendor_contracts(session, vendor_id)
