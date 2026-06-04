from typing import Annotated
from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.farmer_contrast import crud
from app.domains.farmer_contrast.schemas import FarmerContrastListResponse

router = APIRouter(route_class=AuditLogRoute)


@router.get("/", response_model=FarmerContrastListResponse)
async def list_farmer_contrasts(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    year: int = 2026,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
):
    return await crud.get_farmer_contrasts(session=session, year=year, skip=skip, limit=limit)
