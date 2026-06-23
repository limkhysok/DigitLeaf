from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.dashboard import crud
from app.domains.dashboard.crud import TrendPreset
from app.domains.dashboard.schemas import DashboardSummary, PurchaseTrendResponse, RecentActivityResponse

router = APIRouter(route_class=AuditLogRoute)


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_summary(session=session)


@router.get("/purchase-trend", response_model=PurchaseTrendResponse)
async def get_purchase_trend(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    preset: TrendPreset = Query("7d"),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
):
    return await crud.get_purchase_trend(session=session, preset=preset, start_date=start_date, end_date=end_date)


@router.get("/recent-activity", response_model=RecentActivityResponse)
async def get_recent_activity(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    limit: int = Query(10, ge=1, le=50),
):
    return await crud.get_recent_activity(session=session, limit=limit)
