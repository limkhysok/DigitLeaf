from typing import Annotated, List
from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.api.deps import get_current_user
from app.domains.users.models import User
from .schemas import TobaccoRepaymentItem, TContractRepayCreate
from .crud import get_tobacco_repayments

router = APIRouter()

@router.get("/", response_model=List[TobaccoRepaymentItem])
async def read_tobacco_repayments(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    note: str = Query(default="2026", description="Filter by note/year")
):
    """
    Retrieve tobacco repayment records based on a specific note (e.g. '2026').
    """
    return await get_tobacco_repayments(session, note=note)

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
async def create_tobacco_repayment(
    data: TContractRepayCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """
    Create a new tobacco repayment record.
    """
    from . import crud
    from fastapi import HTTPException
    try:
        return await crud.create_repayment(session, data)
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
