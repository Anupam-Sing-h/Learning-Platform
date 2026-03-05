"""Debug script to see what transcripts are available and test all 5 steps."""
import traceback
import asyncio
import sys
import os

# Add the backend directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from youtube_transcript_api import YouTubeTranscriptApi

VIDEO_ID = input("Enter YouTube video ID: ").strip()

try:
    api = YouTubeTranscriptApi()
    transcript_list = api.list(VIDEO_ID)
    
    print(f"\n=== Available transcripts for {VIDEO_ID} ===\n")
    
    for t in transcript_list:
        print(f"  Language: {t.language} ({t.language_code})")
        print(f"  Auto-generated: {t.is_generated}")
        print(f"  Translatable: {t.is_translatable}")
        if t.is_translatable:
            lang_codes = [lang.language_code for lang in t.translation_languages]
            print(f"  Can translate to: {len(lang_codes)} languages")
            if 'en' in lang_codes:
                print(f"  ✅ English translation available!")
            else:
                print(f"  ❌ English NOT in translation list")
        print()

    # ── Step 1: English transcript (manual) ──
    print("=== Testing fetch logic ===\n")
    transcript_list = api.list(VIDEO_ID)
    try:
        t = transcript_list.find_transcript(['en'])
        result = t.fetch()
        print(f"Step 1 ✅ Found English transcript ({len(result)} segments)")
        print(f"  First: {result[0].text[:100]}")
    except Exception as e:
        print(f"Step 1 ❌ {type(e).__name__}")

    # ── Step 1b: English transcript (generated) ──
    transcript_list = api.list(VIDEO_ID)
    try:
        t = transcript_list.find_generated_transcript(['en'])
        result = t.fetch()
        print(f"Step 1b ✅ Found generated English transcript ({len(result)} segments)")
        print(f"  First: {result[0].text[:100]}")
    except Exception as e:
        print(f"Step 1b ❌ {type(e).__name__}")

    # ── Step 2: Auto-generated, translatable → YouTube translate ──
    transcript_list = api.list(VIDEO_ID)
    found_step2 = False
    for t in transcript_list:
        if t.is_generated and t.is_translatable:
            try:
                translated = t.translate('en')
                result = translated.fetch()
                print(f"Step 2 ✅ YouTube-translated '{t.language}' to English ({len(result)} segments)")
                print(f"  First: {result[0].text[:100]}")
            except Exception as e:
                print(f"Step 2 ❌ Translation failed: {type(e).__name__}: {e}")
            found_step2 = True
            break
    if not found_step2:
        print("Step 2 ❌ No auto-generated translatable transcript found")

    # ── Step 5: Raw fetch + Gemini translation ──
    print("\n--- Step 5: Raw fetch + Gemini AI translation ---\n")
    transcript_list = api.list(VIDEO_ID)
    found_raw = False
    for t in transcript_list:
        if t.language_code != 'en':
            try:
                result = t.fetch()
                raw_text = " ".join([seg.text for seg in result])
                print(f"Step 5a ✅ Fetched raw '{t.language}' ({t.language_code}) transcript ({len(result)} segments)")
                print(f"  Raw text preview: {raw_text[:200]}...")
                
                # Now test Gemini translation
                print(f"\n  Translating with Gemini AI...")
                from app.services.ai_service import translate_text
                translated_text = asyncio.run(translate_text(raw_text[:1000], source_lang=t.language_code, target_lang="English"))
                print(f"Step 5b ✅ Gemini translation successful!")
                print(f"  Translated preview: {translated_text[:200]}...")
            except Exception as e:
                print(f"Step 5 ❌ Failed: {type(e).__name__}: {e}")
                traceback.print_exc()
            found_raw = True
            break
    if not found_raw:
        print("Step 5 ❌ No transcripts available at all")

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
