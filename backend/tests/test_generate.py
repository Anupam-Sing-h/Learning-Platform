import httpx
import asyncio

async def main():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/generate-flashcards",
                json={"content_id": "72c7481d-77ef-4c29-a37e-32207070200b", "count": 5},
                timeout=30.0
            )
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Text: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
