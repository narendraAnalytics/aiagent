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


async def generate_linkedin_post(content: str) -> dict:
    """
    Generate a LinkedIn post from research content using Gemini AI

    Args:
        content: The research response content to transform

    Returns:
        dict with keys: hook, content, hashtags, emojis_used, character_count, full_post
    """
    client = create_gemini_client()

    # Build the prompt for LinkedIn post generation
    prompt = f"""You are a LinkedIn content expert. Transform the following research content into an engaging LinkedIn post.

Research Content:
{content}

Instructions:
1. Create a powerful hook (1-2 lines) with ONE relevant emoji that grabs attention
2. Extract 3-5 key insights from the research
3. Use emojis strategically (1-3 relevant emojis total throughout the post, not too many)
4. Format with line breaks and bullet points (use → for bullets)
5. Keep it concise and engaging (1300-2000 characters ideal, max 3000)
6. Generate 3-5 contextual hashtags based on the actual topic (no generic hashtags)
7. End with a thought-provoking question or call-to-action
8. Use professional yet conversational tone

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks. Just pure JSON.

Format your response as this exact JSON structure:
{{
  "hook": "[emoji] [attention-grabbing hook statement]",
  "main_content": "[main body with insights, use → for bullets, add line breaks for readability]",
  "cta": "[thought-provoking question or call-to-action]",
  "hashtags": ["Topic1", "Topic2", "Topic3"]
}}"""

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
