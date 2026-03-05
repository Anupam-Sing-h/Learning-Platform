import asyncio
from app.database import supabase

async def main():
    content_id = '6b27ba4a-8c16-467b-932d-815ea3abd962'
    result = supabase.table("contents").select("*").eq("id", content_id).execute()
    print("DB Result:", result.data)

if __name__ == "__main__":
    asyncio.run(main())
