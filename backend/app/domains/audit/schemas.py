from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class AuditLogPublic(BaseModel):
    id: int
    page_name: Optional[str] = None
    field_type: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user: Optional[str] = None
    action: Optional[str] = None
    log_on: Optional[str] = None
    ip_address: Optional[str] = None
    date: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogPublic]
    total: int
    has_more: bool
