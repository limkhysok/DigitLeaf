from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Security
from sqlmodel import Session
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.leaf_sack_registration import crud
from app.domains.leaf_sack_registration.schemas import (
    LeafSackRegistrationCreate,
    LeafSackRegistrationUpdate,
    LeafSackRegistrationPublic,
    RepresentPublic,
    MemberFarmerPublic,
)

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Leaf sack registration not found"


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
        404: {"description": "Member farmer not found"},
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
        raise HTTPException(status_code=404, detail="Member farmer not found")
    return farmer


@router.get("/", response_model=list[LeafSackRegistrationPublic])
def list_registrations(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = 0,
    limit: int = 100,
):
    return crud.get_all(session=session, skip=skip, limit=limit)


@router.get("/{sack_id}", response_model=LeafSackRegistrationPublic, responses={404: {"description": _NOT_FOUND}})
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
    response_model=LeafSackRegistrationPublic,
    responses={
        404: {"description": "Represent or member farmer not found"},
    },
)
def create_registration(
    data: LeafSackRegistrationCreate,
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
        raise HTTPException(status_code=404, detail="Member farmer not found")
    return record


@router.patch(
    "/{sack_id}",
    response_model=LeafSackRegistrationPublic,
    responses={404: {"description": _NOT_FOUND}},
)
def update_registration(
    sack_id: int,
    data: LeafSackRegistrationUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, sack_id=sack_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return crud.update(session=session, record=record, data=data)


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
