from typing import Annotated, List
from fastapi import APIRouter, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.api.deps import get_current_user
from app.domains.users.models import User
from .schemas import TobaccoReturnItem, TContractReturnCreate
from .crud import get_tobacco_returns

router = APIRouter()

@router.get("/", response_model=List[TobaccoReturnItem])
async def read_tobacco_returns(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """
    Retrieve tobacco return records based on a specific note (e.g. '2026').
    """
    return await get_tobacco_returns(session)

@router.get("/years", response_model=List[str])
async def read_available_years(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """
    Retrieve all available distinct years (notes) from the contract table.
    """
    from . import crud
    return await crud.get_available_years(session)

@router.post("/")
async def create_tobacco_return(
    data: TContractReturnCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """
    Create a new tobacco return record.
    """
    from . import crud
    from fastapi import HTTPException
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
    """
    Get contracts for a specific vendor.
    """
    from . import crud
    return await crud.get_vendor_contracts(session, vendor_id)
