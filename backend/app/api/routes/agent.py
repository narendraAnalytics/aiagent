"""
API routes for research agent
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select

from app.middleware.auth import get_current_user, get_user_id, ClerkUserData
from app.agent.graph import research_graph
from app.agent.tools import save_research_memory
from app.database.connection import AsyncSessionLocal
from app.services.user_sync import get_or_create_user
from app.database.models import ResearchMemory

router = APIRouter()


# Request/Response models
class ResearchQuery(BaseModel):
    """Research query request"""

    query: str
    session_id: Optional[str] = None


class ResearchResponse(BaseModel):
    """Research query response"""

    response: str
    session_id: Optional[str] = None


class ResearchHistoryItem(BaseModel):
    """Single research history item"""

    id: int
    query: str
    response: str
    sources: List[str]
    session_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResearchHistoryResponse(BaseModel):
    """Research history response"""

    history: List[ResearchHistoryItem]


# Routes
@router.post("/research", response_model=ResearchResponse)
async def research(
    query: ResearchQuery,
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Perform research query using AI agent

    Requires authentication via Clerk token
    User is automatically synced to PostgreSQL on first request
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
            user_id = user.clerk_user_id  # Use Clerk ID for memory

        # Run the research graph
        result = await research_graph.ainvoke(
            {
                "user_id": user_id,
                "query": query.query,
                "memory_context": "",
                "gemini_response": "",
                "arxiv_response": "",
                "final_response": "",
            }
        )

        # Extract response
        response_text = result.get("final_response", "")

        # Save to memory (sources are embedded in Gemini's response)
        await save_research_memory(user_id, query.query, response_text, [], query.session_id)

        return ResearchResponse(
            response=response_text,
            session_id=query.session_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user data: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research failed: {str(e)}",
        )


@router.get("/research/history", response_model=ResearchHistoryResponse)
async def get_research_history(
    current_user: ClerkUserData = Depends(get_current_user),
):
    """
    Get research history for the authenticated user

    Returns all past research queries and responses from the database
    """
    try:
        user_id = current_user.id

        async with AsyncSessionLocal() as session:
            # Query research memories for this user, ordered by most recent
            result = await session.execute(
                select(ResearchMemory)
                .where(ResearchMemory.user_id == user_id)
                .order_by(ResearchMemory.created_at.desc())
            )
            memories = result.scalars().all()

            # Convert to response format
            history_items = [
                ResearchHistoryItem(
                    id=memory.id,
                    query=memory.query,
                    response=memory.response,
                    sources=memory.sources or [],
                    session_id=memory.extra_data.get("session_id") if memory.extra_data else None,
                    created_at=memory.created_at,
                )
                for memory in memories
            ]

            return ResearchHistoryResponse(history=history_items)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch research history: {str(e)}",
        )


@router.get("/health")
async def agent_health():
    """Health check for agent service"""
    return {"status": "healthy", "service": "research-agent"}


# Optional: Public endpoint for testing (no auth required)
@router.post("/research/public", response_model=ResearchResponse)
async def research_public(query: ResearchQuery):
    """
    Public research endpoint (no authentication required)
    For testing purposes only
    """
    try:
        # Use a default user ID for public queries
        user_id = "public_user"

        # Run the research graph
        result = await research_graph.ainvoke(
            {
                "user_id": user_id,
                "query": query.query,
                "memory_context": "",
                "gemini_response": "",
                "arxiv_response": "",
                "final_response": "",
            }
        )

        # Extract response (sources embedded in Gemini's response)
        response_text = result.get("final_response", "")

        return ResearchResponse(
            response=response_text,
            session_id=query.session_id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research failed: {str(e)}",
        )
