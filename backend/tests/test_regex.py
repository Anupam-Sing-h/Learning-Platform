import re

def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:v=|v\/|vi\/|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})'
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.search(pattern, url)
        if match:
            print(f"  Matched pattern {i}: {pattern}")
            print(f"  Extracted ID: '{match.group(1)}'")
            return match.group(1)
            
    raise ValueError("Invalid YouTube URL")

# Test with the user's URL
urls = [
    "https://youtu.be/--4A0Yatjhc?si=8t6KIbzC_-jriHYk",
    "https://youtu.be/--4A0Yatjhc",
    "https://www.youtube.com/watch?v=--4A0Yatjhc",
]

for url in urls:
    print(f"\nURL: {url}")
    try:
        vid = extract_video_id(url)
        print(f"  Result: '{vid}' (len={len(vid)})")
    except ValueError as e:
        print(f"  ERROR: {e}")
