from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, Request
from sqlmodel import Session
from app.db.session import get_session
from app.domains.users.models import User
from app.api.deps import get_current_user
from app.core.route_logger import AuditLogRoute
from . import crud, schemas

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "Tobacco purchase not found"

@router.get("/purchasers")
def list_purchasers(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """List all purchasers for dropdown."""
    return crud.get_purchasers(db=session)

@router.get("/regions")
def list_regions(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """List available regions (where do_now_show is 0)."""
    return crud.get_regions(db=session)

@router.get("/ovens")
def list_ovens(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """List all ovens."""
    return crud.get_ovens(db=session)

@router.get("/tobacco-types")
def list_tobacco_types(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """List all active tobacco types."""
    return crud.get_tobacco_types(db=session)

@router.post("/", response_model=schemas.Purchase)
def create_purchase(
    data: schemas.PurchaseCreate,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """Create a new tobacco purchase with details."""
    ip_address = request.client.host if request.client else "unknown"
    return crud.create_purchase(
        db=session,
        obj_in=data,
        user_name=current_user.user_name,
        ip_address=ip_address
    )

@router.get("/", response_model=schemas.PurchaseList)
def list_purchases(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
):
    """List tobacco purchases with pagination and search."""
    items, total = crud.get_purchases(db=session, skip=skip, limit=limit, search=search)
    return schemas.PurchaseList(items=items, total=total)

@router.get("/{tp_id}", response_model=schemas.Purchase, responses={404: {"description": _NOT_FOUND}})
def get_purchase(
    tp_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """Get a specific tobacco purchase by ID, including details."""
    purchase = crud.get_purchase(db=session, tp_id=tp_id)
    if not purchase:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    
    # Details are handled by the relationship if defined, 
    # but here we'll manually attach them if needed, or let schemas handle it if defined in model.
    # Note: In our model we haven't defined relationship yet. 
    # Let's add the details to the object for the response model.
    purchase.details = crud.get_purchase_details(db=session, invoice_num=purchase.invoice_num)
    return purchase

@router.patch("/{tp_id}", response_model=schemas.Purchase, responses={404: {"description": _NOT_FOUND}})
def update_purchase(
    tp_id: int,
    data: schemas.PurchaseUpdate,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """Update a tobacco purchase."""
    db_obj = crud.get_purchase(db=session, tp_id=tp_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    
    ip_address = request.client.host if request.client else "unknown"
    return crud.update_purchase(
        db=session,
        db_obj=db_obj,
        obj_in=data,
        user_name=current_user.user_name,
        ip_address=ip_address
    )

@router.delete("/{tp_id}", status_code=204, responses={404: {"description": _NOT_FOUND}})
def delete_purchase(
    tp_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    """Delete a tobacco purchase and its details."""
    success = crud.delete_purchase(db=session, tp_id=tp_id)
    if not success:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return None
