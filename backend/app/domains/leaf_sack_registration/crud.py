import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
from app.core.config import CAMBODIA_TZ
from app.domains.leaf_sack_registration.models import LeafSackRegistration, Represent, MemberFarmer
from app.domains.leaf_sack_registration.schemas import LeafSackRegistrationCreate, LeafSackRegistrationUpdate


def _generate_sack_code() -> str:
    today = datetime.now(CAMBODIA_TZ).strftime("%Y%m%d")
    return f"LSR-{today}-{uuid.uuid4().hex[:6].upper()}"


def get_represents(session: Session) -> list[Represent]:
    return session.exec(select(Represent).order_by(Represent.represent_name)).all()


def search_member_farmer(
    session: Session,
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
) -> Optional[MemberFarmer]:
    if identity_card:
        farmer = session.exec(
            select(MemberFarmer).where(MemberFarmer.identified_no == identity_card)
        ).first()
        if farmer:
            return farmer
    if name:
        return session.exec(
            select(MemberFarmer).where(MemberFarmer.name == name)
        ).first()
    return None


def get_by_id(session: Session, sack_id: int) -> Optional[LeafSackRegistration]:
    return session.exec(select(LeafSackRegistration).where(LeafSackRegistration.id == sack_id)).first()


def get_all(session: Session, skip: int = 0, limit: int = 100) -> list[LeafSackRegistration]:
    return session.exec(
        select(LeafSackRegistration).order_by(LeafSackRegistration.created_at.desc()).offset(skip).limit(limit)
    ).all()


def create(
    session: Session,
    data: LeafSackRegistrationCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[LeafSackRegistration], Optional[str]]:
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

    record = LeafSackRegistration(
        leaf_sack_code=_generate_sack_code(),
        represent_id=represent.represent_id,
        represent_name=represent.represent_name,
        member_farmer_id=farmer.mf_id,
        member_farmer_name=farmer.name,
        member_farmer_identity_card=farmer.identified_no,
        dl_user_id=current_user_id,
        dl_user_name=current_user_name,
        sack_in_kg=data.sack_in_kg,
        status=data.status,
        notes=data.notes,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, None


def update(session: Session, record: LeafSackRegistration, data: LeafSackRegistrationUpdate) -> LeafSackRegistration:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def delete(session: Session, record: LeafSackRegistration) -> None:
    session.delete(record)
    session.commit()
