import asyncio
from app.database import supabase
from app.services import chunking_service, embedding_service

async def main():
    try:
        content_id = "6b27ba4a-8c16-467b-932d-815ea3abd962"
        data = supabase.table("contents").select("raw_text, page_count").eq("id", content_id).single().execute()
        raw_text = data.data["raw_text"]
        
        pages = [{"page_num": 1, "text": raw_text[:200]}]  # keep it short
        
        chunks = chunking_service.chunk_text_with_pages(pages)
        chunk_texts = [c["chunk_text"] for c in chunks]
        print(f"Chunks: {len(chunk_texts)}")
        
        try:
            embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
            print(f"Success! Dimension: {len(embeddings[0]) if embeddings else 0}")
        except Exception as e:
            import traceback
            print("EMBEDDING ERROR:")
            traceback.print_exc()
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
