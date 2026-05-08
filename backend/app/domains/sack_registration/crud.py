from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration, Represent, MemberFarmer
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate


def _generate_sack_code() -> str:
    today = datetime.now(CAMBODIA_TZ).strftime("%Y%m%d")
    return f"LSR-{today}"


def get_represents(session: Session) -> list[Represent]:
    return session.exec(select(Represent).order_by(Represent.represent_name)).all()


def search_member_farmer(
    session: Session,
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
) -> Optional[MemberFarmer]:
    if identity_card:
        farmer = session.exec(
            select(MemberFarmer).where(MemberFarmer.mf_code == identity_card)
        ).first()
        if farmer:
            return farmer
    if name:
        return session.exec(
            select(MemberFarmer).where(MemberFarmer.name == name)
        ).first()
    return None


def query_member_farmers(session: Session, query: str, limit: int = 10) -> list[MemberFarmer]:
    """Search member farmers by name or identity card (fuzzy)."""
    return session.exec(
        select(MemberFarmer)
        .where(
            (MemberFarmer.name.ilike(f"%{query}%")) | (MemberFarmer.mf_code.ilike(f"%{query}%"))
        )
        .limit(limit)
    ).all()


def get_by_id(session: Session, sack_id: int) -> Optional[SackRegistration]:
    return session.exec(select(SackRegistration).where(SackRegistration.id == sack_id)).first()


def get_all(session: Session, skip: int = 0, limit: int = 100) -> list[SackRegistration]:
    return session.exec(
        select(SackRegistration).order_by(SackRegistration.created_at.desc()).offset(skip).limit(limit)
    ).all()


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
        sack_code=_generate_sack_code(),
        represent_id=represent.represent_id,
        represent_name=represent.represent_name,
        member_farmer_id=farmer.mf_id,
        member_farmer_name=farmer.name,
        member_farmer_identity_card=farmer.mf_code,
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
        record.member_farmer_identity_card = farmer.mf_code

    for key, value in update_data.items():
        setattr(record, key, value)

    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, None


def delete(session: Session, record: SackRegistration) -> None:
    session.delete(record)
    session.commit()
