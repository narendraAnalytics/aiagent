"""
LangGraph agent workflow for research assistant
Uses parallel execution:
- Gemini 2.5-flash with Google Search
- arXiv Search for academic papers
"""

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from google import genai
from google.genai import types
from langchain_community.utilities import ArxivAPIWrapper
import operator

from app.config import get_settings
from app.agent.tools import get_memory_context

settings = get_settings()


# Define the state
class AgentState(TypedDict):
    """State for the research agent with parallel execution"""

    user_id: str
    query: str
    memory_context: str
    gemini_response: Annotated[str, operator.add]
    arxiv_response: Annotated[str, operator.add]
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


async def search_google(state: AgentState) -> dict:
    """Search using Gemini 2.5-flash with Google Search"""
    query = state["query"]
    memory_context = state["memory_context"]

    print(f"\n🌐 Google Search Started")
    print(f"🌐 Query: {query}")

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

    print(f"🌐 Google Response Length: {len(response_text)}")

    # Return only the field we're updating
    return {"gemini_response": response_text}


async def search_arxiv(state: AgentState) -> dict:
    """Search arXiv for academic papers related to the query"""
    query = state["query"]

    print(f"\n📚 ArXiv Search Started")
    print(f"📚 Query: {query}")

    try:
        # Initialize arXiv search wrapper
        arxiv = ArxivAPIWrapper(top_k_results=3, doc_content_chars_max=2000)

        # Search arXiv
        arxiv_results = arxiv.run(query)

        print(f"📚 ArXiv Results Length: {len(arxiv_results) if arxiv_results else 0}")
        print(f"📚 ArXiv Results Preview: {arxiv_results[:200] if arxiv_results else 'EMPTY'}")

        if arxiv_results and arxiv_results.strip():
            arxiv_response = f"arXiv Search Results:\n\n{arxiv_results}"
        else:
            arxiv_response = "No relevant academic papers found on arXiv."

        print(f"📚 Final Response: {arxiv_response[:200]}")
    except Exception as e:
        print(f"📚 ArXiv Error: {str(e)}")
        arxiv_response = f"arXiv search unavailable: {str(e)}"

    # Return only the field we're updating
    return {"arxiv_response": arxiv_response}


async def combine_results(state: AgentState) -> AgentState:
    """Combine results from both Google Search and arXiv Search"""
    gemini_response = state["gemini_response"]
    arxiv_response = state["arxiv_response"]
    query = state["query"]

    print(f"\n🔄 Combining Results...")
    print(f"🔄 Google Data Length: {len(gemini_response)}")
    print(f"🔄 ArXiv Data Length: {len(arxiv_response)}")
    print(f"🔄 ArXiv Data Preview: {arxiv_response[:300]}")

    # Create Gemini client
    client = create_gemini_client()

    # Build synthesis prompt
    prompt = f"""You are a research assistant. Synthesize the following information to provide a comprehensive answer to the user's question.

User Question: {query}

Web Search Results (via Google):
{gemini_response}

Academic Papers (via arXiv):
{arxiv_response}

Provide a unified, well-structured answer that combines insights from both sources. Clearly indicate when information comes from web sources vs academic papers."""

    # Generate synthesis
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=-1),
    )

    # Stream response
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=settings.GEMINI_MODEL, contents=contents, config=config
    ):
        if chunk.text:
            response_text += chunk.text

    print(f"🔄 Final Combined Response Length: {len(response_text)}")

    state["final_response"] = response_text
    return state


# Build the graph
def create_research_graph():
    """Create the research agent workflow graph with parallel execution

    Flow: User → Get Context → [Google Search || arXiv Search] (parallel) → Combine → Response
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("get_context", get_context)
    workflow.add_node("search_google", search_google)
    workflow.add_node("search_arxiv", search_arxiv)
    workflow.add_node("combine_results", combine_results)

    # Add edges for parallel execution
    workflow.set_entry_point("get_context")

    # Parallel execution: both search_google and search_arxiv run simultaneously
    workflow.add_edge("get_context", "search_google")
    workflow.add_edge("get_context", "search_arxiv")

    # Both converge to combine_results
    workflow.add_edge("search_google", "combine_results")
    workflow.add_edge("search_arxiv", "combine_results")

    # Final edge to END
    workflow.add_edge("combine_results", END)

    return workflow.compile()


# Create the graph instance
research_graph = create_research_graph()
