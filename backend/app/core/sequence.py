from datetime import date

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel


class DailySequence(SQLModel, table=True):
    """Per-day, per-prefix counter (e.g. prefix="TP" for invoice_num, "TR" for
    repay_num). Generating a number is a single atomic UPSERT against this tiny
    table instead of reading MAX(invoice_num)+1 off the data table, which races
    under concurrent inserts and never reset across days.

    (seq_date, prefix) is the primary key directly — no separate surrogate id
    column. A surrogate AUTO_INCREMENT id would make MySQL silently overwrite
    LAST_INSERT_ID() with the row's own id on every insert, clobbering the
    LAST_INSERT_ID(last_seq + 1) trick next_daily_seq relies on to read back
    the sequence value.
    """

    __tablename__ = "dl_daily_sequence"  # type: ignore[assignment]

    seq_date: date = Field(primary_key=True)
    prefix: str = Field(primary_key=True, max_length=8)
    last_seq: int = Field(default=0)


async def next_daily_seq(db: AsyncSession, prefix: str, seq_date: date) -> int:
    """Atomically increment and return today's sequence for `prefix`.

    Uses MySQL's INSERT ... ON DUPLICATE KEY UPDATE: the UNIQUE KEY on
    (seq_date, prefix) means concurrent callers serialize on this one counter
    row (a row-level lock) rather than racing on a MAX() read of the much
    larger data table. LAST_INSERT_ID(expr) is the standard MySQL trick to
    read back the value just written, in the same round trip's connection —
    it must wrap the VALUES(...) branch too (not just ON DUPLICATE KEY
    UPDATE), otherwise the very first call for a new (seq_date, prefix) would
    report the table's own autoincrement id instead of the seq value 1.
    """
    await db.execute(
        text(
            "INSERT INTO dl_daily_sequence (seq_date, prefix, last_seq) "
            "VALUES (:seq_date, :prefix, LAST_INSERT_ID(1)) "
            "ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1)"
        ),
        {"seq_date": seq_date, "prefix": prefix},
    )
    seq = await db.scalar(text("SELECT LAST_INSERT_ID()"))
    return int(seq or 1)
