from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration
from app.domains.sack_registration.models.member_farmer import MemberFarmer
from app.domains.weigh_leaf.models import WeighLeaf, Tobacco
from app.domains.weigh_leaf.schemas import WeighLeafCreate, WeighLeafUpdate


async def search_farmers(session: AsyncSession, query: str, limit: int = 10) -> list[MemberFarmer]:
    result = await session.execute(
        select(MemberFarmer)
        .where(
            MemberFarmer.mf_code.ilike(f"%{query}%") | MemberFarmer.name.ilike(f"%{query}%")
        )
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_sack_registrations_by_farmer(session: AsyncSession, farmer_id: int) -> list[SackRegistration]:
    result = await session.execute(
        select(SackRegistration)
        .where(SackRegistration.member_farmer_id == farmer_id)
        .order_by(SackRegistration.created_at.desc())
    )
    return list(result.scalars().all())


async def get_leaf_types(session: AsyncSession) -> list[Tobacco]:
    result = await session.execute(
        select(Tobacco).where((Tobacco.t_cate == 2) & (Tobacco.discontinue == 0))
    )
    return list(result.scalars().all())


async def get_all(session: AsyncSession, skip: int = 0, limit: int = 100) -> list[WeighLeaf]:
    result = await session.execute(
        select(WeighLeaf).order_by(WeighLeaf.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_by_id(session: AsyncSession, weigh_id: int) -> Optional[WeighLeaf]:
    result = await session.execute(select(WeighLeaf).where(WeighLeaf.id == weigh_id))
    return result.scalars().first()


async def create(
    session: AsyncSession,
    data: WeighLeafCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[WeighLeaf], Optional[str]]:
    sack_result = await session.execute(
        select(SackRegistration).where(SackRegistration.id == data.sack_registration_id)
    )
    sack = sack_result.scalars().first()
    if not sack:
        return None, "sack_not_found"

    leaf_result = await session.execute(
        select(Tobacco).where(Tobacco.t_id == data.leaf_type_id)
    )
    leaf_type = leaf_result.scalars().first()
    if not leaf_type:
        return None, "leaf_type_not_found"

    record = WeighLeaf(
        sack_registration_id=sack.id,
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

    sack.status = 1
    sack.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(sack)

    await session.commit()
    await session.refresh(record)
    return record, None


async def update(
    session: AsyncSession,
    record: WeighLeaf,
    data: WeighLeafUpdate,
) -> tuple[WeighLeaf, Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    if "leaf_type_id" in update_data:
        leaf_result = await session.execute(
            select(Tobacco).where(Tobacco.t_id == update_data["leaf_type_id"])
        )
        leaf_type = leaf_result.scalars().first()
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
    await session.commit()
    await session.refresh(record)
    return record, None


async def delete(session: AsyncSession, record: WeighLeaf) -> None:
    session.delete(record)
    await session.commit()
