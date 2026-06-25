from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.farmers import crud
from app.domains.farmers.models import MemberFarmer
from app.domains.farmers.schemas import RepresentPublic, MemberFarmerPublic

router = APIRouter(route_class=AuditLogRoute)


def _to_member_farmer_public(farmer: MemberFarmer, represent_name: Optional[str]) -> MemberFarmerPublic:
    return MemberFarmerPublic(
        mf_id=farmer.mf_id,
        name=farmer.name,
        mf_code=farmer.mf_code,
        address=farmer.address,
        represent_id=farmer.represent,
        represent_name=represent_name,
    )


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
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
):
    if q is not None:
        skip = (page - 1) * limit
        rows = await crud.query_member_farmers(
            session=session, query=q, represent_id=represent_id, skip=skip, limit=limit
        )
        return [_to_member_farmer_public(farmer, represent_name) for farmer, represent_name in rows]
    if name or identity_card:
        row = await crud.search_member_farmer(session=session, name=name, identity_card=identity_card)
        return [_to_member_farmer_public(*row)] if row else []
    raise HTTPException(status_code=400, detail="Provide q, name, or identity_card")
