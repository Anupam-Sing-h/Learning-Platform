import re
import httpx
import asyncio
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def extract_video_id(url: str) -> str:
    """Extracts the video ID from various YouTube URL formats."""
    # Strip any tracking parameters from the URL before matching
    patterns = [
        r'(?:v=|v\/|vi\/|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
            
    raise ValueError("Invalid YouTube URL")

def _fetch_transcript_sync(video_id: str):
    """Synchronous function to fetch transcript - runs in thread executor.
    
    Returns: (transcript_data, language_code) tuple.
    """
    import os
    import requests
    import http.cookiejar
    import io
    from youtube_transcript_api import YouTubeTranscriptApi
    
    # Securely load cookies from environment variable
    cookies_str = os.environ.get("YOUTUBE_COOKIES")
    session = requests.Session()
    
    if cookies_str:
        try:
            # Manually parse Netscape/Mozilla cookie format for higher robustness
            jar = http.cookiejar.CookieJar()
            
            # Clean up: remove surrounding quotes if any
            clean_cookies = cookies_str.strip().strip('"').strip("'")
            
            count = 0
            for line in clean_cookies.splitlines():
                line = line.strip()
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                
                # Netscape format is tab-separated
                parts = line.split('\t')
                if len(parts) >= 7:
                    domain, flag, path, secure, expiration, name, value = parts[:7]
                    
                    try:
                        expires = int(expiration) if expiration.isdigit() else None
                        cookie = http.cookiejar.Cookie(
                            version=0, name=name, value=value,
                            port=None, port_specified=False,
                            domain=domain, domain_specified=True, 
                            domain_initial_dot=domain.startswith('.'),
                            path=path, path_specified=True,
                            secure=secure.upper() == 'TRUE',
                            expires=expires,
                            discard=False, comment=None, comment_url=None, 
                            rest={}, rfc2109=False
                        )
                        jar.set_cookie(cookie)
                        count += 1
                    except Exception:
                        continue
            
            if count > 0:
                session.cookies = jar
                logger.info(f"Successfully loaded {count} YouTube cookies into request session.")
            else:
                logger.warning("No valid cookies found in YOUTUBE_COOKIES string.")
                
        except Exception as e:
            logger.warning(f"Failed to parse YOUTUBE_COOKIES: {e}. Proceeding without authentication.")


    try:
        # Standardize headers
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        })

        # Initialize API with our pre-authenticated session
        api = YouTubeTranscriptApi(http_client=session)
        transcript_list_obj = api.list(video_id)

        # Step 1: Try to get an English transcript directly
        try:
            transcript = transcript_list_obj.find_transcript(['en'])
            logger.info(f"Found English transcript for {video_id}")
            return transcript.fetch(), 'en'
        except Exception:
            logger.info(f"No manual English transcript for {video_id}")

        try:
            transcript = transcript_list_obj.find_generated_transcript(['en'])
            logger.info(f"Found generated English transcript for {video_id}")
            return transcript.fetch(), 'en'
        except Exception:
            logger.info(f"No generated English transcript for {video_id}, trying translation...")

        # Step 2: Try auto-generated transcript in any language → YouTube translate
        for transcript in transcript_list_obj:
            if transcript.is_generated and transcript.is_translatable:
                logger.info(f"YouTube-translating auto-generated '{transcript.language}' ({transcript.language_code}) to English for {video_id}")
                translated = transcript.translate('en')
                return translated.fetch(), 'en'

        # Step 3: Try manual transcript in any language → YouTube translate
        for transcript in transcript_list_obj:
            if not transcript.is_generated and transcript.is_translatable:
                logger.info(f"YouTube-translating manual '{transcript.language}' ({transcript.language_code}) to English for {video_id}")
                translated = transcript.translate('en')
                return translated.fetch(), 'en'

        # Step 4: Any translatable transcript → YouTube translate
        for transcript in transcript_list_obj:
            if transcript.is_translatable:
                logger.info(f"YouTube-translating '{transcript.language}' ({transcript.language_code}) to English for {video_id}")
                translated = transcript.translate('en')
                return translated.fetch(), 'en'

        # Step 5: Fetch any available transcript raw (non-translatable, e.g. Hindi auto-gen)
        # → will be translated by Gemini AI in get_transcript
        for transcript in transcript_list_obj:
            lang_code = transcript.language_code
            logger.info(f"Fetching raw '{transcript.language}' ({lang_code}) transcript for {video_id} — will use Gemini to translate")
            return transcript.fetch(), lang_code

        # Truly nothing available
        raise NoTranscriptFound(video_id, ['en'], transcript_list_obj)
        
    except Exception as e:
        logger.error(f"Error fetching transcript: {type(e).__name__}: {e}")
        raise


async def get_transcript(url: str) -> dict:
    """
    Extracts transcript and metadata from a YouTube video.
    """
    try:
        video_id = extract_video_id(url)
        logger.info(f"Extracting transcript for video ID: {video_id}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Run synchronous YouTube API calls in a thread to avoid blocking the event loop
    try:
        transcript_list, lang_code = await asyncio.to_thread(_fetch_transcript_sync, video_id)
        logger.info(f"Successfully fetched transcript with {len(transcript_list)} segments (lang={lang_code})")
    except TranscriptsDisabled:
        logger.error(f"Transcripts are disabled for video {video_id}")
        raise HTTPException(status_code=400, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        logger.error(f"No transcript found for video {video_id}")
        raise HTTPException(status_code=400, detail="No transcript available for this video")
    except VideoUnavailable:
        logger.error(f"Video unavailable: {video_id}")
        raise HTTPException(status_code=404, detail="Video not found")
    except Exception as e:
        logger.error(f"Failed to fetch transcript for {video_id}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcript: {type(e).__name__}: {str(e)}")

    transcript_text = " ".join([segment.text for segment in transcript_list])

    # If transcript is not in English, translate using Gemini AI
    if lang_code != 'en':
        logger.info(f"Transcript is in '{lang_code}', translating to English using Gemini...")
        try:
            from app.services.ai_service import translate_text
            transcript_text = await translate_text(transcript_text, source_lang=lang_code, target_lang="English")
            logger.info(f"Gemini translation complete for {video_id}")
        except Exception as e:
            logger.error(f"Gemini translation failed for {video_id}: {type(e).__name__}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to translate transcript: {str(e)}")
    
    # Calculate duration from the last segment
    last_segment = transcript_list[-1]
    duration_seconds = int(last_segment.start + last_segment.duration)
    minutes = duration_seconds // 60
    seconds = duration_seconds % 60
    duration_str = f"{minutes}:{seconds:02d}"

    # Fetch Title via OEmbed
    title = video_id # fallback
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://www.youtube.com/oembed?url=https://youtube.com/watch?v={video_id}&format=json"
            )
            if resp.status_code == 200:
                title = resp.json().get("title", video_id)
            else:
                logger.warning(f"OEmbed returned status {resp.status_code} for {video_id}")
    except httpx.ConnectTimeout:
        logger.warning(f"Connection timeout fetching title for {video_id}. Using ID as title.")
    except Exception as e:
        logger.warning(f"Failed to fetch video title for {video_id}: {type(e).__name__}: {e}")

    return {
        "video_id": video_id,
        "title": title,
        "transcript_text": transcript_text,
        "duration": duration_str,
        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    }
