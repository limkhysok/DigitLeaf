from typing import Callable, Coroutine, Any
from fastapi import Request, Response
from fastapi.routing import APIRoute
from loguru import logger

from app.db.session import async_session_maker
from app.domains.audit.crud import create_audit_log
from app.core import security

AUDITED_METHODS = {"PUT", "PATCH", "DELETE"}


def _extract_user_info(auth_header: str | None) -> str | None:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = security.decode_token(token)
    if not payload:
        return None
    return payload.get("sub")


async def _log_to_db(
    ip_address: str | None,
    user: str | None,
    endpoint: str,
    method: str,
) -> None:
    try:
        async with async_session_maker() as db_session:
            await create_audit_log(
                session=db_session,
                endpoint=endpoint,
                method=method,
                user=user,
                ip_address=ip_address,
            )
    except Exception as log_error:
        logger.error(f"Failed to write audit log to DB: {log_error}")


class AuditLogRoute(APIRoute):
    def get_route_handler(self) -> Callable[[Request], Coroutine[Any, Any, Response]]:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            ip_address = request.client.host if request.client else None

            headers_dict = dict(request.headers)
            auth_header = headers_dict.pop("authorization", None)

            user = _extract_user_info(auth_header)

            try:
                response = await original_route_handler(request)
                return response
            finally:
                if request.method in AUDITED_METHODS:
                    await _log_to_db(
                        ip_address=ip_address,
                        user=user,
                        endpoint=request.url.path,
                        method=request.method,
                    )

        return custom_route_handler
