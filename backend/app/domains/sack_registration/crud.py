from typing import Optional
from datetime import datetime, date
from sqlalchemy import cast, Date, func
from sqlmodel import Session, select
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration, Represent, MemberFarmer, MfConYear
from app.domains.weigh_leaf.models import WeighLeaf
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate, RepresentPublic

_ACTIVE_YEAR = 2026
_ACTIVE_JOIN = (MfConYear.mf_id == MemberFarmer.mf_id) & (MfConYear.year == _ACTIVE_YEAR)


def get_represents(session: Session) -> list[RepresentPublic]:
    rows = session.exec(
        select(
            Represent.represent_id,
            Represent.represent_name,
            func.count(MemberFarmer.mf_id).label("farmer_count"),
        )
        .join(MemberFarmer, MemberFarmer.represent == Represent.represent_id)
        .join(MfConYear, _ACTIVE_JOIN)
        .where(Represent.do_not_show == 0)
        .group_by(Represent.represent_id, Represent.represent_name)
        .order_by(Represent.represent_name)
    ).all()
    return [
        RepresentPublic(represent_id=r[0], represent_name=r[1], farmer_count=r[2])
        for r in rows
    ]


def search_member_farmer(
    session: Session,
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
) -> Optional[MemberFarmer]:
    base = select(MemberFarmer).join(MfConYear, _ACTIVE_JOIN)
    if identity_card:
        farmer = session.exec(base.where(MemberFarmer.mf_code == identity_card)).first()
        if farmer:
            return farmer
    if name:
        return session.exec(base.where(MemberFarmer.name == name)).first()
    return None


def query_member_farmers(
    session: Session,
    query: str,
    represent_id: Optional[int] = None,
    limit: int = 10,
) -> list[MemberFarmer]:
    """Search member farmers by name or identity card (fuzzy), scoped to active 2026 contracts."""
    stmt = (
        select(MemberFarmer)
        .join(MfConYear, _ACTIVE_JOIN)
        .where(
            (MemberFarmer.name.ilike(f"%{query}%")) | (MemberFarmer.mf_code.ilike(f"%{query}%"))
        )
        .distinct()
    )
    if represent_id is not None:
        stmt = stmt.where(MemberFarmer.represent == represent_id)
    return session.exec(stmt.limit(limit)).all()


def get_by_id(session: Session, sack_id: int) -> Optional[SackRegistration]:
    return session.exec(select(SackRegistration).where(SackRegistration.id == sack_id)).first()


def get_all(
    session: Session,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    status: Optional[int] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> tuple[list[SackRegistration], int]:
    stmt = select(SackRegistration)
    count_stmt = select(func.count()).select_from(SackRegistration)

    if search:
        pattern = f"%{search}%"
        cond = (
            SackRegistration.member_farmer_name.ilike(pattern)
            | SackRegistration.represent_name.ilike(pattern)
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    if status is not None:
        stmt = stmt.where(SackRegistration.status == status)
        count_stmt = count_stmt.where(SackRegistration.status == status)

    if date_from is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) >= date_from)
        count_stmt = count_stmt.where(cast(SackRegistration.registered_at, Date) >= date_from)

    if date_to is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) <= date_to)
        count_stmt = count_stmt.where(cast(SackRegistration.registered_at, Date) <= date_to)

    if sort_by == "sack_in_kg":
        col = SackRegistration.sack_in_kg
        stmt = stmt.order_by(col.asc() if order == "asc" else col.desc())
    else:
        stmt = stmt.order_by(SackRegistration.created_at.desc())

    total: int = session.exec(count_stmt).one()
    items = list(session.exec(stmt.offset(skip).limit(limit)).all())
    return items, total


def create(
    session: Session,
    data: SackRegistrationCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[SackRegistration], Optional[str]]:
    represent = session.exec(select(Represent).where(Represent.represent_id == data.represent_id)).first()
    if not represent:
        return None, "represent_not_found"

    farmer = search_member_farmer(
        session,
        name=data.member_farmer_name,
        identity_card=data.member_farmer_identity_card,
    )
    if not farmer:
        return None, "farmer_not_found"

    record = SackRegistration(
        represent_id=represent.represent_id,
        represent_name=represent.represent_name,
        member_farmer_id=farmer.mf_id,
        member_farmer_name=farmer.name,
        dl_user_id=current_user_id,
        dl_user_name=current_user_name,
        sack_in_kg=data.sack_in_kg,
        status=data.status,
        notes=data.notes,
        **({"registered_at": data.registered_at} if data.registered_at else {}),
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, None


def update(session: Session, record: SackRegistration, data: SackRegistrationUpdate) -> tuple[SackRegistration, Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    if "member_farmer_identity_card" in update_data:
        farmer = search_member_farmer(session, identity_card=update_data.pop("member_farmer_identity_card"))
        if not farmer:
            return record, "farmer_not_found"
        record.member_farmer_id = farmer.mf_id
        record.member_farmer_name = farmer.name

    for key, value in update_data.items():
        setattr(record, key, value)

    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, None


def delete(session: Session, record: SackRegistration) -> None:
    weigh_leaves = session.exec(
        select(WeighLeaf).where(WeighLeaf.sack_registration_id == record.id)
    ).all()
    for wl in weigh_leaves:
        session.delete(wl)
    session.delete(record)
    session.commit()
