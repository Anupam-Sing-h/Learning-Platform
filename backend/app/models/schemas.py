from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


# ─── Content ───

class ProcessVideoRequest(BaseModel):
    url: str


class ProcessVideoWithTranscriptRequest(BaseModel):
    url: str
    title: str
    transcript_text: str
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    language_code: str = "en"


class ProcessVideoResponse(BaseModel):
    content_id: str
    title: str
    status: str


class ContentResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_url: Optional[str] = None
    raw_text: str
    status: str
    thumbnail_url: Optional[str] = None
    page_count: Optional[int] = None
    duration: Optional[str] = None
    created_at: datetime


class ContentListResponse(BaseModel):
    contents: List[ContentResponse]


# ─── Flashcards ───

class GenerateRequest(BaseModel):
    content_id: str


class FlashcardResponse(BaseModel):
    id: int
    front: str
    back: str
    difficulty: str
    order_index: int


class FlashcardSetResponse(BaseModel):
    flashcards: List[FlashcardResponse]
    content_id: str


# ─── Quiz ───

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: List[QuizQuestionResponse]
    content_id: str


class QuizAnswerRequest(BaseModel):
    content_id: str
    answers: Dict[int, str]


class QuizResultItem(BaseModel):
    question_id: int
    correct: bool
    selected_answer: str
    correct_answer: str
    explanation: str


class QuizEvaluationResponse(BaseModel):
    score: int
    total: int
    percentage: float
    results: List[QuizResultItem]


# ─── Chat ───

class ChatRequest(BaseModel):
    content_id: str
    message: str
    session_id: str


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    message: str
    sources: List[str] = Field(default_factory=list)
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]


# ─── Errors ───

class ErrorResponse(BaseModel):
    detail: str
    error_code: str
