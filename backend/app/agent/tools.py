"""
Tools for the research agent
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database.connection import AsyncSessionLocal
from app.database.models import ResearchMemory

settings = get_settings()


async def get_memory_context(user_id: str, limit: int = 5) -> str:
    """
    Retrieve user's past research queries for context

    Args:
        user_id: User ID from Clerk
        limit: Number of recent queries to retrieve

    Returns:
        Formatted string of past research context
    """
    try:
        async with AsyncSessionLocal() as session:
            # Query recent research memory
            stmt = (
                select(ResearchMemory)
                .where(ResearchMemory.user_id == user_id)
                .order_by(ResearchMemory.created_at.desc())
                .limit(limit)
            )
            result = await session.execute(stmt)
            memories = result.scalars().all()

            if not memories:
                return ""

            # Format memory context
            context_parts = []
            for memory in reversed(memories):  # Chronological order
                context_parts.append(
                    f"Previous Query: {memory.query}\nResponse: {memory.response[:200]}..."
                )

            return "\n\n".join(context_parts)
    except Exception as e:
        print(f"Memory retrieval error: {str(e)}")
        return ""


async def save_research_memory(
    user_id: str, query: str, response: str, sources: list[str]
) -> bool:
    """
    Save research interaction to memory

    Args:
        user_id: User ID from Clerk
        query: User's research query
        response: Agent's response
        sources: List of source URLs

    Returns:
        True if saved successfully
    """
    try:
        async with AsyncSessionLocal() as session:
            memory = ResearchMemory(
                user_id=user_id,
                query=query,
                response=response,
                sources=sources,
                metadata={},
            )
            session.add(memory)
            await session.commit()
            return True
    except Exception as e:
        print(f"Memory save error: {str(e)}")
        return False
