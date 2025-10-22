"""
API routes for LinkedIn post generation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.middleware.auth import get_current_user, ClerkUserData
from app.agent.linkedin_generator import generate_linkedin_post, generate_hashtags_from_content
from app.database.connection import AsyncSessionLocal
from app.database.linkedin_crud import (
    save_linkedin_post,
    get_user_linkedin_posts,
    get_linkedin_post_by_id,
    update_linkedin_post,
    mark_post_as_posted,
    delete_linkedin_post,
)

router = APIRouter()


# Request/Response models
class LinkedInGenerateRequest(BaseModel):
    """Request to generate LinkedIn post"""

    content: str
    style: str = "professional"  # professional, casual, storytelling
    tone: str = "educational"  # educational, promotional, thought_leadership, inspirational
    target_length: str = "medium"  # short, medium, long


class LinkedInPostResponse(BaseModel):
    """Generated LinkedIn post response"""

    hook: str
    main_content: str
    cta: str
    hashtags: List[str]
    full_post: str
    emojis_used: List[str]
    character_count: int


class HashtagsRequest(BaseModel):
    """Request to generate hashtags"""

    content: str
    count: int = 5


class HashtagsResponse(BaseModel):
    """Hashtags response"""

    hashtags: List[str]


class SaveLinkedInPostRequest(BaseModel):
    """Request to save a LinkedIn post"""

    original_content: str
    hook: str
    main_content: str
    cta: str
    hashtags: List[str]
    full_post: str
    emojis_used: List[str]
    character_count: int
    session_id: Optional[str] = None
    post_style: str = "professional"
    tone: str = "educational"
    target_length: str = "medium"


class LinkedInPostSavedResponse(BaseModel):
    """Saved LinkedIn post response"""

    id: int
    user_id: str
    full_post: str
    character_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class LinkedInPostHistoryResponse(BaseModel):
    """LinkedIn post history response"""

    posts: List[LinkedInPostSavedResponse]


# Routes
@router.post("/generate", response_model=LinkedInPostResponse)
async def generate_linkedin_post_endpoint(
    request: LinkedInGenerateRequest,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Generate a LinkedIn post from research content

    Requires authentication via Clerk token
    Uses Gemini AI to create engaging LinkedIn-formatted content
    """
    try:
        # Generate LinkedIn post using AI
        post_data = await generate_linkedin_post(
            content=request.content,
            style=request.style,
            tone=request.tone,
            target_length=request.target_length,
        )

        return LinkedInPostResponse(
            hook=post_data["hook"],
            main_content=post_data["main_content"],
            cta=post_data["cta"],
            hashtags=post_data["hashtags"],
            full_post=post_data["full_post"],
            emojis_used=post_data["emojis_used"],
            character_count=post_data["character_count"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LinkedIn post generation failed: {str(e)}",
        )


@router.post("/hashtags", response_model=HashtagsResponse)
async def generate_hashtags_endpoint(
    request: HashtagsRequest,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Generate relevant hashtags from content

    Requires authentication via Clerk token
    """
    try:
        hashtags = await generate_hashtags_from_content(request.content, request.count)

        return HashtagsResponse(hashtags=hashtags)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hashtag generation failed: {str(e)}",
        )


@router.post("/save", response_model=LinkedInPostSavedResponse)
async def save_generated_post(
    request: SaveLinkedInPostRequest,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Save a generated LinkedIn post to the database

    Requires authentication via Clerk token
    """
    try:
        async with AsyncSessionLocal() as session:
            saved_post = await save_linkedin_post(
                session=session,
                user_id=current_user.id,
                original_content=request.original_content,
                hook=request.hook,
                main_content=request.main_content,
                cta=request.cta,
                hashtags=request.hashtags,
                full_post=request.full_post,
                emojis_used=request.emojis_used,
                character_count=request.character_count,
                session_id=request.session_id,
                post_style=request.post_style,
                tone=request.tone,
                target_length=request.target_length,
            )

            return LinkedInPostSavedResponse(
                id=saved_post.id,
                user_id=saved_post.user_id,
                full_post=saved_post.full_post,
                character_count=saved_post.character_count,
                created_at=saved_post.created_at,
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save LinkedIn post: {str(e)}",
        )


@router.get("/history", response_model=LinkedInPostHistoryResponse)
async def get_post_history(
    limit: int = 50,
    offset: int = 0,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Get LinkedIn post history for the authenticated user

    Requires authentication via Clerk token
    """
    try:
        async with AsyncSessionLocal() as session:
            posts = await get_user_linkedin_posts(
                session=session,
                user_id=current_user.id,
                limit=limit,
                offset=offset,
            )

            post_responses = [
                LinkedInPostSavedResponse(
                    id=post.id,
                    user_id=post.user_id,
                    full_post=post.full_post,
                    character_count=post.character_count,
                    created_at=post.created_at,
                )
                for post in posts
            ]

            return LinkedInPostHistoryResponse(posts=post_responses)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch post history: {str(e)}",
        )


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Delete a LinkedIn post

    Requires authentication via Clerk token
    """
    try:
        async with AsyncSessionLocal() as session:
            deleted = await delete_linkedin_post(
                session=session,
                post_id=post_id,
                user_id=current_user.id,
            )

            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found",
                )

            return {"message": "Post deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete post: {str(e)}",
        )


@router.get("/health")
async def linkedin_health():
    """Health check for LinkedIn service"""
    return {"status": "healthy", "service": "linkedin-generator"}
