from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List


class AuditLogPublic(BaseModel):
    id: int
    page_name: str
    field_type: str
    old_value: str
    new_value: str
    user: str
    action: str
    ip_address: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogPublic]
    total: int
    has_more: bool
