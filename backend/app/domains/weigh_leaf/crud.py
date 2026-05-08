from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration
from app.domains.sack_registration.models.member_farmer import MemberFarmer
from app.domains.weigh_leaf.models import WeighLeaf, Tobacco
from app.domains.weigh_leaf.schemas import WeighLeafCreate, WeighLeafUpdate


def search_farmers(session: Session, query: str, limit: int = 10) -> list[MemberFarmer]:
    return session.exec(
        select(MemberFarmer)
        .where(
            MemberFarmer.mf_code.ilike(f"%{query}%") | MemberFarmer.name.ilike(f"%{query}%")
        )
        .limit(limit)
    ).all()


def get_sack_registrations_by_farmer(session: Session, farmer_id: int) -> list[SackRegistration]:
    return session.exec(
        select(SackRegistration)
        .where(SackRegistration.member_farmer_id == farmer_id)
        .order_by(SackRegistration.created_at.desc())
    ).all()


def get_leaf_types(session: Session) -> list[Tobacco]:
    return session.exec(
        select(Tobacco).where((Tobacco.t_cate == 2) & (Tobacco.discontinue == 0))
    ).all()


def get_all(session: Session, skip: int = 0, limit: int = 100) -> list[WeighLeaf]:
    return session.exec(
        select(WeighLeaf).order_by(WeighLeaf.created_at.desc()).offset(skip).limit(limit)
    ).all()


def get_by_id(session: Session, weigh_id: int) -> Optional[WeighLeaf]:
    return session.exec(select(WeighLeaf).where(WeighLeaf.id == weigh_id)).first()


def create(
    session: Session,
    data: WeighLeafCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[WeighLeaf], Optional[str]]:
    sack = session.exec(
        select(SackRegistration).where(SackRegistration.id == data.sack_registration_id)
    ).first()
    if not sack:
        return None, "sack_not_found"

    leaf_type = session.exec(
        select(Tobacco).where(Tobacco.t_id == data.leaf_type_id)
    ).first()
    if not leaf_type:
        return None, "leaf_type_not_found"

    record = WeighLeaf(
        sack_registration_id=sack.id,
        sack_code=sack.sack_code,
        sack_in_kg=sack.sack_in_kg,
        user_id=sack.member_farmer_id,
        user_name=sack.member_farmer_name,
        leaf_type_id=leaf_type.t_id,
        leaf_type_name=leaf_type.t_name,
        total_in_kg=data.total_in_kg,
        remork=data.remork,
        total_weight_in_kg=data.total_in_kg - data.remork - sack.sack_in_kg,
        dl_user_id=current_user_id,
        dl_user_name=current_user_name,
    )
    session.add(record)

    # Auto-approve the sack registration
    sack.status = 1
    sack.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(sack)

    session.commit()
    session.refresh(record)
    return record, None


def update(
    session: Session,
    record: WeighLeaf,
    data: WeighLeafUpdate,
) -> tuple[WeighLeaf, Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    if "leaf_type_id" in update_data:
        leaf_type = session.exec(
            select(Tobacco).where(Tobacco.t_id == update_data["leaf_type_id"])
        ).first()
        if not leaf_type:
            return record, "leaf_type_not_found"
        record.leaf_type_id = leaf_type.t_id
        record.leaf_type_name = leaf_type.t_name
        del update_data["leaf_type_id"]

    for key, value in update_data.items():
        setattr(record, key, value)

    record.total_weight_in_kg = record.total_in_kg - record.remork - record.sack_in_kg
    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, None


def delete(session: Session, record: WeighLeaf) -> None:
    session.delete(record)
    session.commit()
