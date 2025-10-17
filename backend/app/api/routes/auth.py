"""
API routes for authentication and user management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import get_current_user, ClerkUserData
from app.database.connection import AsyncSessionLocal
from app.services.user_sync import get_or_create_user

router = APIRouter()


# Response models
class UserSyncResponse(BaseModel):
    """User sync response"""

    success: bool
    message: str
    clerk_user_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


# Routes
@router.post("/sync-user", response_model=UserSyncResponse)
async def sync_user(
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Sync authenticated Clerk user to Neon database

    This endpoint is called when a user logs in to ensure their
    data is synced to the user_preferences table in PostgreSQL.

    Requires authentication via Clerk token.
    """
    try:
        # Extract Clerk user data
        clerk_data = {
            "clerk_user_id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "username": current_user.username,
        }

        # Get or create user in database
        async with AsyncSessionLocal() as session:
            user = await get_or_create_user(session, clerk_data)

        return UserSyncResponse(
            success=True,
            message="User synced successfully",
            clerk_user_id=user.clerk_user_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user data: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User sync failed: {str(e)}",
        )


@router.get("/me")
async def get_current_user_info(
    current_user: ClerkUserData = Depends(get_current_user),
):
    """Get current authenticated user information"""
    return {
        "clerk_user_id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "username": current_user.username,
    }
