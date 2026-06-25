from typing import Callable, Coroutine, Any
from fastapi import Request, Response
from fastapi.routing import APIRoute
from loguru import logger

from app.db.session import async_session_maker
from app.domains.audit.crud import create_audit_log
from app.core import security



def _extract_user_info(auth_header: str | None) -> tuple[str | None, int | None]:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, None
    token = auth_header.split(" ")[1]
    payload = security.decode_token(token)
    if not payload:
        return None, None
    return payload.get("sub"), payload.get("user_id")


async def _log_to_db(
    ip_address: str | None,
    user_agent: str | None,
    user_id: int | None,
    endpoint: str,
    method: str,
) -> None:
    try:
        async with async_session_maker() as db_session:
            await create_audit_log(
                session=db_session,
                endpoint=endpoint,
                method=method,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
    except Exception as log_error:
        logger.error(f"Failed to write audit log to DB: {log_error}")


class AuditLogRoute(APIRoute):
    def get_route_handler(self) -> Callable[[Request], Coroutine[Any, Any, Response]]:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

            headers_dict = dict(request.headers)
            auth_header = headers_dict.pop("authorization", None)

            _, user_id = _extract_user_info(auth_header)

            try:
                response = await original_route_handler(request)
                return response
            finally:
                await _log_to_db(
                    ip_address=ip_address,
                    user_agent=user_agent,
                    user_id=user_id,
                    endpoint=request.url.path,
                    method=request.method,
                )

        return custom_route_handler
