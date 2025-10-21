"""
API routes for LinkedIn post generation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List

from app.middleware.auth import get_current_user, ClerkUserData
from app.agent.linkedin_generator import generate_linkedin_post, generate_hashtags_from_content

router = APIRouter()


# Request/Response models
class LinkedInGenerateRequest(BaseModel):
    """Request to generate LinkedIn post"""

    content: str


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
        post_data = await generate_linkedin_post(request.content)

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


@router.get("/health")
async def linkedin_health():
    """Health check for LinkedIn service"""
    return {"status": "healthy", "service": "linkedin-generator"}
