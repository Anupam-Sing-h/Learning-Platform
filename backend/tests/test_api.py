import httpx
import asyncio
import json

async def test_process_video():
    url = "http://localhost:8000/process-video"
    payload = {"url": "https://youtu.be/rXvU7bPJ8n4"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_process_video())
