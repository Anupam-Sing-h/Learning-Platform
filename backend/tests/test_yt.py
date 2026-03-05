import traceback

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    tl = api.list("--4A0Yatjhc")
    t = tl.find_generated_transcript(['en'])
    result = t.fetch()
    print(f"Success, segments: {len(result)}")
    print(f"First segment: {result[0]}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
