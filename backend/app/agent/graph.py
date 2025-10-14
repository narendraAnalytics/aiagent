"""
LangGraph agent workflow for research assistant
Uses Gemini 2.5-flash with Google Search enabled
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END
from google import genai
from google.genai import types

from app.config import get_settings
from app.agent.tools import get_memory_context

settings = get_settings()


# Define the state
class AgentState(TypedDict):
    """State for the research agent"""

    user_id: str
    query: str
    memory_context: str
    final_response: str


# Initialize Gemini with Google Search
def create_gemini_client():
    """Create Gemini client with Google Search enabled"""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return client


# Agent nodes
async def get_context(state: AgentState) -> AgentState:
    """Get user memory context"""
    user_id = state["user_id"]

    # Get memory context
    memory = await get_memory_context(user_id)
    state["memory_context"] = memory

    return state


async def generate_response(state: AgentState) -> AgentState:
    """Generate response using Gemini 2.5-flash with Google Search"""
    query = state["query"]
    memory_context = state["memory_context"]

    # Create Gemini client
    client = create_gemini_client()

    # Build prompt with memory context
    prompt = f"""You are a helpful research assistant. Answer the user's question using your knowledge and Google Search.

{f"Previous Context:\n{memory_context}\n" if memory_context else ""}User Question: {query}

Provide a comprehensive, well-structured answer. Include relevant sources from your search."""

    # Generate response with thinking and Google Search enabled
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    # Enable Google Search tool
    tools = [types.Tool(googleSearch=types.GoogleSearch())]

    # Configure with thinking mode
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=-1),
        tools=tools,
    )

    # Stream response
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=settings.GEMINI_MODEL, contents=contents, config=config
    ):
        if chunk.text:
            response_text += chunk.text

    state["final_response"] = response_text
    return state


# Build the graph
def create_research_graph():
    """Create the research agent workflow graph

    Flow: User → Get Context → Gemini 2.5-flash + Google Search → Response
    """
    workflow = StateGraph(AgentState)

    # Add nodes: User → Get Context → Gemini with Google Search → Response
    workflow.add_node("get_context", get_context)
    workflow.add_node("generate", generate_response)

    # Add edges
    workflow.set_entry_point("get_context")
    workflow.add_edge("get_context", "generate")
    workflow.add_edge("generate", END)

    return workflow.compile()


# Create the graph instance
research_graph = create_research_graph()
