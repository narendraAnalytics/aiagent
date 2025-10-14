"""
API routes for research agent
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.middleware.auth import get_current_user, get_user_id
from app.agent.graph import research_graph
from app.agent.tools import save_research_memory

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


# Routes
@router.post("/research", response_model=ResearchResponse)
async def research(
    query: ResearchQuery,
    current_user: dict = Depends(get_current_user),
):
    """
    Perform research query using AI agent

    Requires authentication via Clerk token
    """
    try:
        user_id = current_user.get("id")

        # Run the research graph
        result = await research_graph.ainvoke(
            {
                "user_id": user_id,
                "query": query.query,
                "memory_context": "",
                "final_response": "",
            }
        )

        # Extract response
        response_text = result.get("final_response", "")

        # Save to memory (sources are embedded in Gemini's response)
        await save_research_memory(user_id, query.query, response_text, [])

        return ResearchResponse(
            response=response_text,
            session_id=query.session_id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research failed: {str(e)}",
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
