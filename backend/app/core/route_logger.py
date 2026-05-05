from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute
from loguru import logger
from sqlmodel import Session

from app.db.session import engine
from app.domains.audit.crud import create_audit_log
from app.core import security

def _extract_body(body_bytes: bytes | None) -> str | None:
    if not body_bytes:
        return None
    try:
        body_str = body_bytes.decode("utf-8")
        if "password" in body_str.lower():
            return "<redacted for security>"
        return body_str
    except Exception:
        return "<binary data>"

def _extract_user_info(auth_header: str | None) -> tuple[str | None, int | None]:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, None
    token = auth_header.split(" ")[1]
    payload = security.decode_token(token)
    if not payload:
        return None, None
    return payload.get("sub"), payload.get("user_id")

def _log_to_db(ip_address: str | None, user_agent: str | None, 
               user_id: int | None, endpoint: str, method: str) -> None:
    if not user_id:
        # Skip logging for non-authenticated requests (like login) if user_id is mandatory
        return
        
    try:
        with Session(engine) as db_session:
            create_audit_log(
                session=db_session,
                endpoint=endpoint,
                method=method,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
    except Exception as log_error:
        logger.error(f"Failed to write audit log to DB: {log_error}")

class AuditLogRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

            headers_dict = dict(request.headers)
            auth_header = headers_dict.pop("authorization", None)

            # We don't need body/headers anymore per user request
            _, user_id = _extract_user_info(auth_header)

            try:
                response = await original_route_handler(request)
                return response
            finally:
                _log_to_db(
                    ip_address=ip_address,
                    user_agent=user_agent,
                    user_id=user_id,
                    endpoint=request.url.path,
                    method=request.method
                )

        return custom_route_handler
