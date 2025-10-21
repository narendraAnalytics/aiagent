"""
CRUD operations for LinkedIn posts
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime

from app.database.models import LinkedInPost


async def save_linkedin_post(
    session: AsyncSession,
    user_id: str,
    original_content: str,
    hook: str,
    main_content: str,
    cta: str,
    hashtags: List[str],
    full_post: str,
    emojis_used: List[str],
    character_count: int,
    session_id: Optional[str] = None,
    research_memory_id: Optional[int] = None,
    post_style: str = "professional",
) -> LinkedInPost:
    """
    Save a generated LinkedIn post to the database

    Args:
        session: Database session
        user_id: Clerk user ID
        original_content: Original research content
        hook: Generated hook
        main_content: Main post content
        cta: Call to action
        hashtags: List of hashtags
        full_post: Complete formatted post
        emojis_used: List of emojis used
        character_count: Total character count
        session_id: Optional session ID
        research_memory_id: Optional link to ResearchMemory
        post_style: Style of post (professional, casual, storytelling)

    Returns:
        Created LinkedInPost instance
    """
    linkedin_post = LinkedInPost(
        user_id=user_id,
        session_id=session_id,
        research_memory_id=research_memory_id,
        original_content=original_content,
        hook=hook,
        main_content=main_content,
        cta=cta,
        hashtags=hashtags,
        full_post=full_post,
        emojis_used=emojis_used,
        character_count=character_count,
        post_style=post_style,
        is_saved=True,
        is_posted=False,
    )

    session.add(linkedin_post)
    await session.commit()
    await session.refresh(linkedin_post)

    return linkedin_post


async def get_user_linkedin_posts(
    session: AsyncSession,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[LinkedInPost]:
    """
    Get all LinkedIn posts for a user

    Args:
        session: Database session
        user_id: Clerk user ID
        limit: Maximum number of posts to return
        offset: Offset for pagination

    Returns:
        List of LinkedInPost instances
    """
    result = await session.execute(
        select(LinkedInPost)
        .where(LinkedInPost.user_id == user_id)
        .order_by(desc(LinkedInPost.created_at))
        .limit(limit)
        .offset(offset)
    )

    return result.scalars().all()


async def get_linkedin_post_by_id(
    session: AsyncSession,
    post_id: int,
    user_id: str,
) -> Optional[LinkedInPost]:
    """
    Get a specific LinkedIn post by ID

    Args:
        session: Database session
        post_id: Post ID
        user_id: Clerk user ID (for security)

    Returns:
        LinkedInPost instance or None
    """
    result = await session.execute(
        select(LinkedInPost)
        .where(LinkedInPost.id == post_id)
        .where(LinkedInPost.user_id == user_id)
    )

    return result.scalar_one_or_none()


async def update_linkedin_post(
    session: AsyncSession,
    post_id: int,
    user_id: str,
    full_post: str,
    character_count: int,
) -> Optional[LinkedInPost]:
    """
    Update an existing LinkedIn post

    Args:
        session: Database session
        post_id: Post ID
        user_id: Clerk user ID (for security)
        full_post: Updated full post content
        character_count: Updated character count

    Returns:
        Updated LinkedInPost instance or None
    """
    post = await get_linkedin_post_by_id(session, post_id, user_id)

    if not post:
        return None

    post.full_post = full_post
    post.character_count = character_count

    await session.commit()
    await session.refresh(post)

    return post


async def mark_post_as_posted(
    session: AsyncSession,
    post_id: int,
    user_id: str,
) -> Optional[LinkedInPost]:
    """
    Mark a LinkedIn post as posted

    Args:
        session: Database session
        post_id: Post ID
        user_id: Clerk user ID (for security)

    Returns:
        Updated LinkedInPost instance or None
    """
    post = await get_linkedin_post_by_id(session, post_id, user_id)

    if not post:
        return None

    post.is_posted = True
    post.posted_at = datetime.utcnow()

    await session.commit()
    await session.refresh(post)

    return post


async def delete_linkedin_post(
    session: AsyncSession,
    post_id: int,
    user_id: str,
) -> bool:
    """
    Delete a LinkedIn post

    Args:
        session: Database session
        post_id: Post ID
        user_id: Clerk user ID (for security)

    Returns:
        True if deleted, False if not found
    """
    post = await get_linkedin_post_by_id(session, post_id, user_id)

    if not post:
        return False

    await session.delete(post)
    await session.commit()

    return True


async def get_posts_by_session(
    session: AsyncSession,
    user_id: str,
    session_id: str,
) -> List[LinkedInPost]:
    """
    Get all LinkedIn posts for a specific session

    Args:
        session: Database session
        user_id: Clerk user ID
        session_id: Session ID

    Returns:
        List of LinkedInPost instances
    """
    result = await session.execute(
        select(LinkedInPost)
        .where(LinkedInPost.user_id == user_id)
        .where(LinkedInPost.session_id == session_id)
        .order_by(desc(LinkedInPost.created_at))
    )

    return result.scalars().all()
