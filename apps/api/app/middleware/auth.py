# app/middleware/auth.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware that reads access_token from cookie
    if Authorization header is missing (for SSR / cookie-based flows).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # If no Authorization header, check for access_token cookie
        if "authorization" not in request.headers:
            token = request.cookies.get("access_token")
            if token:
                # Mutate headers to inject token (Starlette headers are immutable via scope)
                headers = dict(request.scope["headers"])
                headers[b"authorization"] = f"Bearer {token}".encode()
                request.scope["headers"] = list(headers.items())
        return await call_next(request)
