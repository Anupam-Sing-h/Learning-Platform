// ─── Content ───
export interface Content {
    id: string;
    title: string;
    source_type: "youtube" | "pdf";
    source_url: string;
    raw_text: string;
    status: "processing" | "ready" | "error";
    created_at: string;
    thumbnail_url?: string;
    page_count?: number;
    duration?: string;
}

// ─── Flashcard ───
export interface Flashcard {
    id: number;
    content_id: string;
    front: string;
    back: string;
    difficulty: "easy" | "medium" | "hard";
    order_index: number;
}

export interface FlashcardSet {
    flashcards: Flashcard[];
    content_id: string;
}

// ─── Quiz ───
export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

export interface Quiz {
    questions: QuizQuestion[];
    content_id: string;
}

export interface QuizResult {
    question_id: number;
    correct: boolean;
    selected_answer: string;
    correct_answer: string;
    explanation: string;
}

export interface QuizEvaluation {
    score: number;
    total: number;
    percentage: number;
    results: QuizResult[];
}

// ─── Chat ───
export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    message: string;
    sources?: (string | { text_preview?: string; [key: string]: unknown })[];
    created_at: string;
    session_id?: string;
}

// ─── Study Progress ───
export interface StudyProgress {
    content_id: string;
    flashcards_reviewed: number;
    quiz_score: number;
    quiz_attempts: number;
    last_studied: string;
}

// ─── API Response ───
export interface ApiResponse<T> {
    data: T;
    error?: string;
}
