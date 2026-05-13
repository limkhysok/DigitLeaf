from typing import Annotated, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Security
from sqlmodel import Session
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
    RepresentPublic,
    MemberFarmerPublic,
)

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Sack registration not found"
_FARMER_NOT_FOUND = "Member farmer not found"


@router.get("/represents", response_model=list[RepresentPublic])
def list_represents(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """Return all represents for the dropdown."""
    return crud.get_represents(session=session)


@router.get(
    "/member-farmers/search",
    response_model=MemberFarmerPublic,
    responses={
        400: {"description": "No search parameter provided"},
        404: {"description": _FARMER_NOT_FOUND},
    },
)
def search_member_farmer(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
):
    """Search a member farmer by name or identity card number."""
    if not name and not identity_card:
        raise HTTPException(status_code=400, detail="Provide name or identity_card query parameter")
    farmer = crud.search_member_farmer(session=session, name=name, identity_card=identity_card)
    if not farmer:
        raise HTTPException(status_code=404, detail=_FARMER_NOT_FOUND)
    return farmer


@router.get("/member-farmers/query", response_model=list[MemberFarmerPublic])
def query_member_farmers(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    q: str,
    represent_id: Optional[int] = None,
    limit: int = 10,
):
    """Query member farmers by name or identity card, optionally filtered by represent."""
    return crud.query_member_farmers(session=session, query=q, represent_id=represent_id, limit=limit)


@router.get("/", response_model=SackRegistrationListResponse)
def list_registrations(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    status: Optional[int] = None,
    date_from: Optional[date] = None,

    date_to: Optional[date] = None,
):
    items, total = crud.get_all(
        session=session,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        date_from=date_from,
        date_to=date_to,
    )

    return SackRegistrationListResponse(
        items=items,
        total=total,
        has_more=(skip + len(items)) < total,
    )


@router.get("/{sack_id}", response_model=SackRegistrationPublic, responses={404: {"description": _NOT_FOUND}})
def get_registration(
    sack_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return record


@router.post(
    "/",
    response_model=SackRegistrationPublic,
    responses={
        404: {"description": "Represent or member farmer not found"},
    },
)
def create_registration(
    data: SackRegistrationCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record, error = crud.create(
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
def update_registration(
    sack_id: int,
    data: SackRegistrationUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    updated, error = crud.update(session=session, record=record, data=data)
    if error == "farmer_not_found":
        raise HTTPException(status_code=404, detail=_FARMER_NOT_FOUND)
    return updated


@router.delete(
    "/{sack_id}",
    status_code=204,
    responses={404: {"description": _NOT_FOUND}},
)
def delete_registration(
    sack_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    crud.delete(session=session, record=record)
