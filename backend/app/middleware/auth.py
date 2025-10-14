"""
Clerk authentication middleware
"""

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx

from app.config import get_settings

settings = get_settings()
security = HTTPBearer()


async def verify_clerk_token(token: str) -> dict:
    """Verify Clerk JWT token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = security,
) -> dict:
    """Get current authenticated user from Clerk token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    user_data = await verify_clerk_token(credentials.credentials)
    return user_data


async def get_user_id(request: Request) -> Optional[str]:
    """Extract user ID from request (for dependency injection)"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        user_data = await verify_clerk_token(token)
        return user_data.get("id")
    except Exception:
        return None
