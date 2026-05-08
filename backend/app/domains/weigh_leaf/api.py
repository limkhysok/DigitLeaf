from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Security
from sqlmodel import Session
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from app.domains.weigh_leaf import crud
from app.domains.weigh_leaf.schemas import (
    WeighLeafCreate,
    WeighLeafUpdate,
    WeighLeafPublic,
    TobaccoPublic,
    MemberFarmerSearchPublic,
    SackRegistrationBriefPublic,
)

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Weigh leaf record not found"
_SACK_NOT_FOUND = "Sack registration not found"
_LEAF_TYPE_NOT_FOUND = "Leaf type not found"


@router.get("/farmers/search", response_model=list[MemberFarmerSearchPublic])
def search_farmers(
    q: str,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    limit: int = 10,
):
    return crud.search_farmers(session=session, query=q, limit=limit)


@router.get("/sack-registrations/by-farmer/{farmer_id}", response_model=list[SackRegistrationBriefPublic])
def get_sack_registrations_by_farmer(
    farmer_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return crud.get_sack_registrations_by_farmer(session=session, farmer_id=farmer_id)


@router.get("/leaf-types", response_model=list[TobaccoPublic])
def list_leaf_types(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return crud.get_leaf_types(session=session)


@router.get("/", response_model=list[WeighLeafPublic])
def list_weigh_leaves(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = 0,
    limit: int = 100,
):
    return crud.get_all(session=session, skip=skip, limit=limit)


@router.post(
    "/",
    response_model=WeighLeafPublic,
    responses={
        404: {"description": f"{_SACK_NOT_FOUND} or {_LEAF_TYPE_NOT_FOUND}"},
    },
)
def create_weigh_leaf(
    data: WeighLeafCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record, error = crud.create(
        session=session,
        data=data,
        current_user_id=current_user.id,
        current_user_name=current_user.user_name,
    )
    if error == "sack_not_found":
        raise HTTPException(status_code=404, detail=_SACK_NOT_FOUND)
    if error == "leaf_type_not_found":
        raise HTTPException(status_code=404, detail=_LEAF_TYPE_NOT_FOUND)
    return record


@router.patch(
    "/{weigh_id}",
    response_model=WeighLeafPublic,
    responses={404: {"description": _NOT_FOUND}},
)
def update_weigh_leaf(
    weigh_id: int,
    data: WeighLeafUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, weigh_id=weigh_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    updated, error = crud.update(session=session, record=record, data=data)
    if error == "leaf_type_not_found":
        raise HTTPException(status_code=404, detail=_LEAF_TYPE_NOT_FOUND)
    return updated


@router.delete("/{weigh_id}", status_code=204, responses={404: {"description": _NOT_FOUND}})
def delete_weigh_leaf(
    weigh_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    record = crud.get_by_id(session=session, weigh_id=weigh_id)
    if not record:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    crud.delete(session=session, record=record)
