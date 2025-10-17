"""
User synchronization service for Clerk authentication
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any

from app.database.models import UserPreferences


def extract_clerk_user_data(clerk_response: dict) -> dict:
    """
    Extract user data from Clerk API response

    Args:
        clerk_response: Full response from Clerk API /v1/users/me

    Returns:
        Dictionary with extracted user fields

    Example Clerk response:
    {
        "id": "user_2abc123xyz",
        "email_addresses": [
            {
                "id": "email_abc",
                "email_address": "user@example.com",
                "primary": true
            }
        ],
        "first_name": "John",
        "last_name": "Doe",
        "username": "johndoe",
        "image_url": "https://...",
        "created_at": 1234567890,
        "updated_at": 1234567890
    }
    """
    # Extract primary email
    email_addresses = clerk_response.get("email_addresses", [])
    primary_email = None
    for email_obj in email_addresses:
        if email_obj.get("primary", False):
            primary_email = email_obj.get("email_address")
            break

    # Fallback to first email if no primary
    if not primary_email and email_addresses:
        primary_email = email_addresses[0].get("email_address")

    return {
        "clerk_user_id": clerk_response.get("id"),
        "email": primary_email,
        "first_name": clerk_response.get("first_name"),
        "last_name": clerk_response.get("last_name"),
        "username": clerk_response.get("username"),
    }


async def get_or_create_user(
    session: AsyncSession, clerk_data: dict
) -> UserPreferences:
    """
    Get existing user or create new user from Clerk data

    Args:
        session: Async database session
        clerk_data: Extracted Clerk user data from extract_clerk_user_data()

    Returns:
        UserPreferences object (existing or newly created)

    Raises:
        ValueError: If clerk_user_id or email is missing
    """
    clerk_user_id = clerk_data.get("clerk_user_id")
    email = clerk_data.get("email")

    if not clerk_user_id:
        raise ValueError("clerk_user_id is required")
    if not email:
        raise ValueError("email is required")

    # Check if user exists
    stmt = select(UserPreferences).where(
        UserPreferences.clerk_user_id == clerk_user_id
    )
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Update user data if changed
        updated = False

        if existing_user.email != email:
            existing_user.email = email
            updated = True

        if existing_user.first_name != clerk_data.get("first_name"):
            existing_user.first_name = clerk_data.get("first_name")
            updated = True

        if existing_user.last_name != clerk_data.get("last_name"):
            existing_user.last_name = clerk_data.get("last_name")
            updated = True

        if existing_user.username != clerk_data.get("username"):
            existing_user.username = clerk_data.get("username")
            updated = True

        if updated:
            await session.commit()
            await session.refresh(existing_user)

        return existing_user

    # Create new user
    new_user = UserPreferences(
        clerk_user_id=clerk_user_id,
        email=email,
        first_name=clerk_data.get("first_name"),
        last_name=clerk_data.get("last_name"),
        username=clerk_data.get("username"),
        preferences={},
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user
