from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.api.deps import get_current_user
from app.domains.users.models import User
from app.domains.tobacco_repay.schemas import TobaccoRepayListResponse, TContractRepayCreate, TContractRepayRead, RepayHistoryListResponse
from app.domains.tobacco_repay import crud

router = APIRouter()


@router.get("/", response_model=TobaccoRepayListResponse)
async def read_tobacco_repays(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    year: int | None = Query(None),
):
    skip = (page - 1) * limit
    result = await crud.get_tobacco_repays(session, skip=skip, limit=limit, year=year)
    return TobaccoRepayListResponse(
        items=result["items"],
        total=result["total"],
        has_more=(skip + len(result["items"])) < result["total"],
    )


@router.get("/history", response_model=RepayHistoryListResponse)
async def read_tobacco_repay_history(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    year: int | None = Query(None),
):
    skip = (page - 1) * limit
    result = await crud.get_tobacco_repay_history(session, skip=skip, limit=limit, year=year)
    return RepayHistoryListResponse(
        items=result["items"],
        total=result["total"],
        has_more=(skip + len(result["items"])) < result["total"],
    )


@router.get("/years", response_model=list[int])
async def read_available_years(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_available_years(session)


@router.post("/", response_model=TContractRepayRead, status_code=201)
async def create_tobacco_repay(
    request: Request,
    data: TContractRepayCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        return await crud.create_repay(
            session,
            data,
            user_name=current_user.user_name,
            ip_address=request.client.host if request.client else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/next-repay-num", response_model=str)
async def get_next_repay_num(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.generate_repay_num(session)


@router.get("/contracts")
async def get_contracts(
    vendor_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_vendor_contracts(session, vendor_id)
