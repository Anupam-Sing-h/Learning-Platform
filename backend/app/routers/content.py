from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.models.schemas import (
    ProcessVideoRequest,
    ProcessVideoWithTranscriptRequest,
    ProcessVideoResponse, 
    ContentResponse, 
    ContentListResponse
)
from app.services import youtube_service, pdf_service, chunking_service, embedding_service, vector_store
from app.database import supabase
import uuid
import logging
import traceback

router = APIRouter()
logger = logging.getLogger(__name__)

async def process_video_task(content_id: str, url: str):
    """Background task to process a YouTube video transcript."""
    try:
        # 1. Extract transcript & metadata
        data = await youtube_service.get_transcript(url)
        
        # 2. Update content record with extracted info
        supabase.table("contents").update({
            "title": data["title"],
            "raw_text": data["transcript_text"],
            "thumbnail_url": data["thumbnail_url"],
            "duration": data["duration"]
        }).eq("id", content_id).execute()
        
        # 3. Chunk text
        chunks = chunking_service.chunk_text(data["transcript_text"])
        
        # 4. Generate embeddings
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
        
        # 5. Store in vector store
        await vector_store.store_chunks(content_id, chunks, embeddings)
        
        # 6. Mark as ready
        supabase.table("contents").update({"status": "ready"}).eq("id", content_id).execute()
        
    except Exception as e:
        logger.error(f"Error in process_video_task for {content_id}: {type(e).__name__}: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        supabase.table("contents").update({"status": "error"}).eq("id", content_id).execute()

async def process_pdf_task(content_id: str, file_bytes: bytes, filename: str):
    """Background task to process an uploaded PDF."""
    try:
        # 1. Extract text
        data = await pdf_service.extract_pdf_text(file_bytes, filename)
        
        # 2. Update content record
        supabase.table("contents").update({
            "title": data["title"],
            "raw_text": data["full_text"],
            "page_count": data["page_count"]
        }).eq("id", content_id).execute()
        
        # 3. Chunk text (page-aware)
        chunks = chunking_service.chunk_text_with_pages(data["pages"])
        
        # 4. Generate embeddings
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
        
        # 5. Store in vector store
        await vector_store.store_chunks(content_id, chunks, embeddings)
        
        # 6. Mark as ready
        supabase.table("contents").update({"status": "ready"}).eq("id", content_id).execute()
        
    except Exception as e:
        logger.error(f"Error in process_pdf_task for {content_id}: {e}")
        supabase.table("contents").update({"status": "error"}).eq("id", content_id).execute()


@router.post("/process-video", response_model=ProcessVideoResponse)
async def process_video(request: ProcessVideoRequest, background_tasks: BackgroundTasks):
    """Process a YouTube video URL."""
    logger.info(f"Received request to process video: {request.url}")
    
    # Pre-validate URL
    try:
        video_id = youtube_service.extract_video_id(request.url)
        logger.info(f"Extracted video ID: {video_id}")
    except ValueError as e:
        logger.error(f"Invalid URL: {request.url}")
        raise HTTPException(status_code=400, detail=str(e))
        
    content_id = str(uuid.uuid4())
    logger.info(f"Generated content ID: {content_id}")
    
    # Create placeholder record
    try:
        logger.info("Attempting to insert placeholder record into Supabase...")
        supabase.table("contents").insert({
            "id": content_id,
            "title": "Processing...",
            "source_type": "youtube",
            "source_url": request.url,
            "status": "processing",
            "raw_text": ""
        }).execute()
        logger.info("Successfully inserted placeholder record.")
    except Exception as e:
        logger.error(f"Failed to insert record into Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")
    
    background_tasks.add_task(process_video_task, content_id, request.url)
    logger.info(f"Background task added for content ID: {content_id}")
    
    return {
        "content_id": content_id,
        "title": "Processing...",
        "status": "processing"
    }


async def process_transcript_task(content_id: str, transcript_text: str, language_code: str = "en"):
    """Background task to process a pre-fetched transcript (translate, chunk, embed, store)."""
    try:
        # 1. Translate if not English
        if language_code != "en" and language_code != "en-US" and language_code != "en-GB" and "en" not in language_code.lower():
            logger.info(f"Translating transcript from {language_code} to English for {content_id}")
            from app.services.ai_service import translate_text
            transcript_text = await translate_text(
                text=transcript_text, 
                source_lang=language_code, 
                target_lang="English"
            )
            # Update the stored text with the English translation
            supabase.table("contents").update({"raw_text": transcript_text}).eq("id", content_id).execute()
            
        # 2. Chunk text
        chunks = chunking_service.chunk_text(transcript_text)
        
        # 3. Generate embeddings
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
        
        # 4. Store in vector store
        await vector_store.store_chunks(content_id, chunks, embeddings)
        
        # 5. Mark as ready
        supabase.table("contents").update({"status": "ready"}).eq("id", content_id).execute()
        
    except Exception as e:
        logger.error(f"Error in process_transcript_task for {content_id}: {type(e).__name__}: {e}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        supabase.table("contents").update({"status": "error"}).eq("id", content_id).execute()


@router.post("/process-video-with-transcript", response_model=ProcessVideoResponse)
async def process_video_with_transcript(
    request: ProcessVideoWithTranscriptRequest, 
    background_tasks: BackgroundTasks
):
    """Process a YouTube video with a pre-fetched transcript (from Vercel)."""
    logger.info(f"Received pre-fetched transcript for: {request.url} (title: {request.title})")
    
    if not request.transcript_text.strip():
        raise HTTPException(status_code=400, detail="Transcript text is empty")
    
    content_id = str(uuid.uuid4())
    
    # Create record with all metadata already available
    try:
        supabase.table("contents").insert({
            "id": content_id,
            "title": request.title,
            "source_type": "youtube",
            "source_url": request.url,
            "status": "processing",
            "raw_text": request.transcript_text,
            "thumbnail_url": request.thumbnail_url,
            "duration": request.duration,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to insert record into Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # Process in background (chunking + embedding + vector storage)
    background_tasks.add_task(
        process_transcript_task, 
        content_id, 
        request.transcript_text,
        request.language_code
    )
    
    return {
        "content_id": content_id,
        "title": request.title,
        "status": "processing"
    }


@router.post("/process-pdf", response_model=ProcessVideoResponse)
async def process_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Process an uploaded PDF file."""
    file_bytes = await file.read()
    
    # Validate PDF
    pdf_service.validate_pdf(file_bytes, file.filename)
    
    content_id = str(uuid.uuid4())
    
    # Create placeholder record
    supabase.table("contents").insert({
        "id": content_id,
        "title": "Processing PDF...",
        "source_type": "pdf",
        "status": "processing",
        "raw_text": ""
    }).execute()
    
    background_tasks.add_task(process_pdf_task, content_id, file_bytes, file.filename)
    
    return {
        "content_id": content_id,
        "title": "Processing PDF...",
        "status": "processing"
    }


@router.get("/contents", response_model=ContentListResponse)
async def list_contents():
    """List all processed content."""
    result = supabase.table("contents").select("*").order("created_at", desc=True).execute()
    return {"contents": result.data}


@router.get("/contents/{content_id}", response_model=ContentResponse)
async def get_content(content_id: str):
    """Get a specific content item."""
    result = supabase.table("contents").select("*").eq("id", content_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Content not found")
    return result.data[0]


@router.delete("/contents/{content_id}")
async def delete_content(content_id: str):
    """Delete a content item and all associated data."""
    # Chunks and other data will be deleted by CASCADE in the database
    supabase.table("contents").delete().eq("id", content_id).execute()
    return {"status": "deleted"}

@router.get("/study-progress/{content_id}")
async def get_study_progress(content_id: str):
    result = supabase.table("study_progress") \
        .select("*") \
        .eq("content_id", content_id) \
        .single() \
        .execute()
    if not result.data:
        return {"content_id": content_id, "flashcards_reviewed": 0, "quiz_score": 0, "quiz_attempts": 0}
    return result.data

@router.post("/study-progress/{content_id}/flashcard-reviewed")
async def update_flashcard_progress(content_id: str):
    # Increment flashcards_reviewed count
    existing = supabase.table("study_progress").select("*").eq("content_id", content_id).execute()
    if existing.data:
        new_count = existing.data[0]["flashcards_reviewed"] + 1
        supabase.table("study_progress").update({
            "flashcards_reviewed": new_count
        }).eq("content_id", content_id).execute()
        return {"status": "updated", "flashcards_reviewed": new_count}
    else:
        supabase.table("study_progress").insert({
            "content_id": content_id,
            "flashcards_reviewed": 1
        }).execute()
        return {"status": "created", "flashcards_reviewed": 1}

@router.get("/test-youtube")
async def test_youtube():
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        import inspect
        
        methods = dir(YouTubeTranscriptApi)
        mod_file = inspect.getfile(YouTubeTranscriptApi)
        return {"dir": methods, "file": mod_file}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.get("/test-process")
async def test_process():
    content_id = "6b27ba4a-8c16-467b-932d-815ea3abd962"
    from app.database import supabase
    from app.services import chunking_service, embedding_service, vector_store
    
    data = supabase.table("contents").select("raw_text, page_count").eq("id", content_id).single().execute()
    raw_text = data.data["raw_text"]
    
    pages = [{"page_num": 1, "text": raw_text[:200]}]  # keep it short
    
    try:
        chunks = chunking_service.chunk_text_with_pages(pages)
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
        
        # also test vector store
        await vector_store.store_chunks(content_id + "-test", chunks, embeddings)
        await vector_store.delete_chunks(content_id + "-test")
        
        return {
            "success": True,
            "embeddings_len": len(embeddings[0]) if embeddings else 0
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

