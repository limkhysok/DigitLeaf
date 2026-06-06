from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class AuditLogPublic(BaseModel):
    id: int
    user_id: Optional[int] = None
    endpoint: str
    method: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogPublic]
    total: int
    has_more: bool
