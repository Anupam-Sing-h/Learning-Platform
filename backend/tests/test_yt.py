import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the backend directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env
load_dotenv()

async def test_cookies():
    from app.services import youtube_service
    import logging

    # Configure logging to see our breadcrumbs
    logging.basicConfig(level=logging.INFO)
    
    video_url = "https://www.youtube.com/watch?v=--4A0Yatjhc" # Standard video
    
    print("\n--- YouTube Cookie Test ---")
    cookies = os.environ.get("YOUTUBE_COOKIES")
    if cookies:
        print(f"DEBUG: YOUTUBE_COOKIES found in environment (length: {len(cookies)} characters)")
    else:
        print("DEBUG: YOUTUBE_COOKIES NOT found in environment!")
        print("Please ensure you have added YOUTUBE_COOKIES=\"...\" to your .env file.")
        return

    try:
        print(f"Attempting to fetch transcript for: {video_url}")
        result = await youtube_service.get_transcript(video_url)
        print("\n[SUCCESS!]")
        print(f"Title: {result.get('title')}")
        print(f"Transcript length: {len(result.get('transcript_text', ''))} characters")
        print("\nCheck your terminal for 'Using secure temporary cookie file...' to confirm auth worked.")
        
    except Exception as e:
        print(f"\n[FAILED!]")
        print(f"Error: {type(e).__name__}: {str(e)}")
        # print(traceback.format_exc()) # Replaced with simpler error for now


if __name__ == "__main__":
    asyncio.run(test_cookies())
