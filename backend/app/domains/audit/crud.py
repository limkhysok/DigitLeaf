from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.audit.models import AuditLog


async def create_audit_log(
    session: AsyncSession,
    endpoint: str,
    method: str,
    user: str | None = None,
    ip_address: str | None = None,
    field_type: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    *,
    commit: bool = True,
) -> AuditLog:
    db_log = AuditLog(
        page_name=endpoint,
        action=method,
        user=user or "",
        ip_address=ip_address or "",
        field_type=field_type or "",
        old_value=old_value or "",
        new_value=new_value or "",
        log_on="KAIC",
    )
    session.add(db_log)
    if commit:
        await session.commit()
        await session.refresh(db_log)
    else:
        await session.flush()
    return db_log


def _humanize(field: str) -> str:
    return field.replace("_", " ").title()


async def log_field_changes(
    session: AsyncSession,
    *,
    page_name: str,
    record_id: int | str,
    old_values: dict[str, Any],
    new_values: dict[str, Any],
    user_name: str,
    ip_address: str | None,
) -> None:
    for field, new_val in new_values.items():
        old_val = old_values.get(field)
        if old_val == new_val:
            continue
        await create_audit_log(
            session=session,
            endpoint=page_name,
            method="UPDATE",
            user=user_name,
            ip_address=ip_address,
            field_type=f"Updated {_humanize(field)} (ID:{record_id})",
            old_value="" if old_val is None else str(old_val),
            new_value="" if new_val is None else str(new_val),
            commit=False,
        )
    await session.commit()


async def log_delete(
    session: AsyncSession,
    *,
    page_name: str,
    record_id: int | str,
    summary: str,
    user_name: str,
    ip_address: str | None,
) -> None:
    await create_audit_log(
        session=session,
        endpoint=page_name,
        method="DELETE",
        user=user_name,
        ip_address=ip_address,
        field_type=f"Deleted (ID:{record_id})",
        old_value=summary,
        new_value="",
    )
