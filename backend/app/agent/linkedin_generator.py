"""
LinkedIn Post Generator
Uses Gemini AI to transform research content into engaging LinkedIn posts
"""

from google import genai
from google.genai import types
import json
import re

from app.config import get_settings

settings = get_settings()


def create_gemini_client():
    """Create Gemini client"""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return client


async def generate_linkedin_post(
    content: str,
    style: str = "professional",
    tone: str = "educational",
    target_length: str = "medium",
) -> dict:
    """
    Generate a LinkedIn post from research content using Gemini AI

    Args:
        content: The research response content to transform
        style: Post style - "professional", "casual", or "storytelling"
        tone: Post tone - "educational", "promotional", "thought_leadership", or "inspirational"
        target_length: Target length - "short" (500-800), "medium" (1000-1500), or "long" (2000-3000)

    Returns:
        dict with keys: hook, content, hashtags, emojis_used, character_count, full_post
    """
    client = create_gemini_client()

    # Define style-specific instructions
    style_instructions = {
        "professional": "Use data-driven language, formal tone, and industry-specific terms. Focus on facts and insights.",
        "casual": "Use friendly, conversational language with a relaxed tone. Be approachable and relatable.",
        "storytelling": "Create a narrative arc with a beginning, middle, and end. Use personal anecdotes or examples to illustrate points.",
    }

    # Define tone-specific instructions
    tone_instructions = {
        "educational": "Focus on teaching and explaining concepts. Provide actionable insights and learning value.",
        "promotional": "Highlight benefits and value propositions. Create excitement and urgency around the topic.",
        "thought_leadership": "Present unique perspectives and forward-thinking ideas. Position as an industry expert.",
        "inspirational": "Motivate and inspire the audience. Use uplifting language and emphasize possibilities.",
    }

    # Define length targets
    length_targets = {
        "short": "500-800 characters",
        "medium": "1000-1500 characters",
        "long": "2000-3000 characters",
    }

    # Build the prompt for LinkedIn post generation
    prompt = f"""You are a LinkedIn content expert. Transform the following research content into an engaging LinkedIn post.

Research Content:
{content}

Post Specifications:
- Style: {style.upper()} - {style_instructions.get(style, style_instructions['professional'])}
- Tone: {tone.upper()} - {tone_instructions.get(tone, tone_instructions['educational'])}
- Target Length: {length_targets.get(target_length, '1000-1500 characters')}

Instructions:
1. Create a powerful hook (1-2 lines) with 1-2 relevant emojis that grab attention
2. Extract 3-5 key insights from the research
3. Add a relevant emoji at the START of each paragraph that matches the topic (e.g., 🤖 for AI, 💻 for tech, 🚀 for innovation, 📈 for growth, 🔬 for research, 💡 for ideas, 🎯 for goals, ⚡ for speed/impact, 🌟 for excellence, 🔥 for trending, 💼 for business, 🎓 for learning)
4. Use DIFFERENT emojis for bullet points - vary them for visual appeal (✓, ✨, 💡, 🎯, 🔹, ⚡, 🌟, 📊, 🔑, 🏆, 💪, ✅, etc.)
5. Format with line breaks and emoji bullets - DO NOT use → or ** symbols
6. Adhere to the specified style and tone throughout
7. Target the specified character count: {length_targets.get(target_length, '1000-1500 characters')}
8. Generate 3-5 contextual hashtags based on the actual topic (no generic hashtags)
9. End with a thought-provoking question or call-to-action that matches the tone
10. NEVER use markdown symbols like **, __, →, or other special characters - use natural text and emojis only

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks. Just pure JSON.

Format your response as this exact JSON structure:
{{
  "hook": "[emoji] [attention-grabbing hook statement]",
  "main_content": "[main body with topic-relevant emojis at the start of each paragraph AND different emoji bullets for each point]",
  "cta": "[thought-provoking question or call-to-action]",
  "hashtags": ["Topic1", "Topic2", "Topic3"]
}}

Example format for main_content:
"🤖 The AI revolution is profoundly reshaping software engineering, demanding a crucial shift in skills and mindset. This isn't just an evolution; it's a redefinition of roles and market dynamics.

Here's what this transformation means for software professionals:

✓ AI-Driven Automation & Higher-Level Focus: AI agents are automating routine tasks like code generation, debugging, and testing
💡 Strategic Shift in Competencies: Tech leaders emphasize that adaptability and new competencies are paramount for thriving
🎯 Human-Centered Design Focus: Engineers must concentrate on complex system architecture and strategic planning

🚀 This represents a fundamental shift in how we approach software development."""

    # Generate response using Gemini
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    config = types.GenerateContentConfig(
        temperature=0.8,  # Higher temperature for more creative output
        top_p=0.95,
    )

    # Get response
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=settings.GEMINI_MODEL, contents=contents, config=config
    ):
        if chunk.text:
            response_text += chunk.text

    # Parse the JSON response
    try:
        # Clean response - remove markdown code blocks if present
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]  # Remove ```json
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]  # Remove ```
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]  # Remove ```
        cleaned_response = cleaned_response.strip()

        # Parse JSON
        post_data = json.loads(cleaned_response)

        # Build the full post
        full_post = f"""{post_data['hook']}

{post_data['main_content']}

{post_data['cta']}

{' '.join(['#' + tag for tag in post_data['hashtags']])}"""

        # Count emojis used
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+",
            flags=re.UNICODE,
        )
        emojis_found = emoji_pattern.findall(full_post)

        return {
            "hook": post_data["hook"],
            "main_content": post_data["main_content"],
            "cta": post_data["cta"],
            "hashtags": post_data["hashtags"],
            "full_post": full_post,
            "emojis_used": emojis_found,
            "character_count": len(full_post),
        }

    except json.JSONDecodeError as e:
        # Fallback if JSON parsing fails
        print(f"JSON parsing error: {e}")
        print(f"Response was: {response_text}")

        # Return a basic formatted version
        return {
            "hook": "💡 Key insights from recent research",
            "main_content": content[:500] + "...",
            "cta": "What are your thoughts on this?",
            "hashtags": ["Research", "Innovation", "Insights"],
            "full_post": f"💡 Key insights from recent research\n\n{content[:500]}...\n\nWhat are your thoughts on this?\n\n#Research #Innovation #Insights",
            "emojis_used": ["💡"],
            "character_count": 600,
        }


async def generate_hashtags_from_content(content: str, count: int = 5) -> list[str]:
    """
    Generate relevant hashtags from content using Gemini

    Args:
        content: The content to analyze
        count: Number of hashtags to generate (default 5)

    Returns:
        List of hashtag strings (without # symbol)
    """
    client = create_gemini_client()

    prompt = f"""Analyze the following content and generate {count} relevant, specific hashtags for LinkedIn.

Content:
{content}

Instructions:
- Return hashtags that are specific to the actual topic discussed
- Avoid generic hashtags like #Innovation or #Technology
- Use proper capitalization (e.g., ArtificialIntelligence, not artificialintelligence)
- Each hashtag should be 1-3 words
- Return ONLY a JSON array of strings, nothing else

Example: ["MachineLearning", "QuantumComputing", "DataScience"]

Return format: ["Hashtag1", "Hashtag2", "Hashtag3"]"""

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    # Get response
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=settings.GEMINI_MODEL, contents=contents
    ):
        if chunk.text:
            response_text += chunk.text

    try:
        # Clean and parse response
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"```(?:json)?\n?", "", cleaned).strip()
        hashtags = json.loads(cleaned)
        return hashtags[:count]
    except:
        # Fallback
        return ["Research", "Innovation", "Technology", "Insights", "Learning"][:count]
