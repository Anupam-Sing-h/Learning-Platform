# 🧠 PocketProfesor — AI-Powered Learning Platform

> Transform YouTube videos and PDFs into interactive flashcards, quizzes, and AI-powered Q&A — powered by Google Gemini 2.0 and RAG (Retrieval-Augmented Generation).

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [User Workflow](#-user-workflow)
- [Step-by-Step Working Preview](#-step-by-step-working-preview)
- [API Endpoints](#-api-endpoints)
- [Common Practices](#-common-practices)
- [License](#-license)

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
| :--- | :--- |
| ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white) | React framework (App Router, Turbopack) |
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black) | UI library |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Type safety |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | Utility-first styling |
| ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) | Pre-built accessible components (Radix UI) |
| ![Lucide React](https://img.shields.io/badge/Lucide_React-F56565?style=for-the-badge&logo=lucide&logoColor=white) | Icon library |
| ![Markdown](https://img.shields.io/badge/react--markdown-000000?style=for-the-badge&logo=markdown&logoColor=white) | Markdown rendering in chat |

### Backend

| Technology | Purpose |
| :--- | :--- |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) | Async Python web framework |
| ![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white) | Backend language |
| ![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white) | Request / response validation |
| ![Google Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white) | LLM for generation & embeddings |
| ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) | Database, vector store (pgvector) |
| ![YouTube](https://img.shields.io/badge/YouTube_Transcript_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white) | YouTube transcript extraction |
| ![NLTK](https://img.shields.io/badge/NLTK-154F5B?style=for-the-badge&logo=python&logoColor=white) | Sentence-level text chunking |
| ![pytest](https://img.shields.io/badge/pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white) | Unit & integration testing |

### Infrastructure

| Service | Role |
| :--- | :--- |
| ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) | Hosted PostgreSQL + pgvector for similarity search |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) | Frontend deployment (optional) |

---

## 📁 Project Structure

```
Learning Platform/
├── frontend/                   # Next.js 15 application
│   ├── src/
│   │   ├── app/                # App Router pages & API routes
│   │   │   ├── page.tsx        # Home — upload YouTube / PDF
│   │   │   ├── library/        # Content library listing
│   │   │   ├── study/[id]/     # Study dashboard per content
│   │   │   │   ├── page.tsx    # Study overview (summary, notes)
│   │   │   │   ├── flashcards/ # Interactive flashcard viewer
│   │   │   │   ├── quiz/       # AI-generated quiz page
│   │   │   │   └── chat/       # RAG-powered AI chat
│   │   │   └── api/            # Next.js API proxy routes
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── chat/           # Chat-specific components
│   │   │   ├── flashcard/      # Flashcard components
│   │   │   ├── layout/         # Sidebar, header, nav
│   │   │   └── providers/      # Theme provider
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, utilities
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py             # App entry point & CORS setup
│   │   ├── config.py           # Pydantic settings (.env loader)
│   │   ├── database.py         # Supabase client initialization
│   │   ├── models/             # Pydantic request/response schemas
│   │   ├── routers/            # API route handlers
│   │   │   ├── content.py      # YouTube & PDF processing
│   │   │   ├── flashcards.py   # Flashcard CRUD & generation
│   │   │   ├── quiz.py         # Quiz generation & submission
│   │   │   ├── chat.py         # RAG chat with streaming
│   │   │   └── study_progress.py
│   │   ├── services/           # Business logic layer
│   │   │   ├── ai_service.py       # Gemini LLM integration
│   │   │   ├── youtube_service.py   # Transcript extraction
│   │   │   ├── pdf_service.py       # PDF text extraction
│   │   │   ├── chunking_service.py  # Smart text chunking (NLTK)
│   │   │   ├── embedding_service.py # Vector embedding generation
│   │   │   ├── vector_store.py      # Supabase pgvector operations
│   │   │   └── rag_service.py       # Full RAG pipeline
│   │   └── prompts/            # System & user prompt templates
│   │       ├── chat_prompt.py
│   │       ├── flashcard_prompt.py
│   │       └── quiz_prompt.py
│   ├── tests/                  # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
│
└── docs/                       # Documentation & planning
    ├── PRD.md
    └── Implementation Plan.md
```

---

## ✅ Prerequisites

- **Node.js** ≥ 18.x & **npm** ≥ 9.x
- **Python** ≥ 3.10
- A **Supabase** project (with `pgvector` extension enabled)
- A **Google AI Studio** API key (Gemini 2.0 Flash)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Learning Platform"
```

### 2. Backend setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env example and fill in your keys
cp .env.example .env

# Start the backend server
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env example and fill in your values
cp .env.example .env.local

# Start the development server (with Turbopack)
npm run dev
```

### 4. Open in browser

Navigate to **http://localhost:3000** — the app is ready to use.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:3000
EMBEDDING_MODEL=models/text-embedding-001
LLM_MODEL=models/gemini-2.0-flash (or models/gemini-2.5-flash)
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_URL=http://localhost:8000
```

## 👤 User Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. UPLOAD       Paste YouTube URL  OR  Upload PDF      │
│       ↓                                                 │
│  2. PROCESS      Backend extracts, chunks, embeds       │
│       ↓                                                 │
│  3. STUDY        View summary & generated notes         │
│       ↓                                                 │
│  4. LEARN        Choose a study mode:                   │
│       ├── 📇  Flashcards  (swipeable card deck)         │
│       ├── 📝  Quiz        (MCQ with scoring)            │
│       └── 💬  AI Chat     (RAG-powered Q&A)             │
│       ↓                                                 │
│  5. TRACK        Monitor study progress over time       │
└─────────────────────────────────────────────────────────┘
```

1. **Upload Content** — From the home page, paste a YouTube video URL or drag-and-drop a PDF.
2. **Automatic Processing** — The backend extracts text (transcript / PDF), chunks it using NLTK, generates vector embeddings via Gemini, and stores everything in Supabase.
3. **Study Dashboard** — Once processed, the user is redirected to a study page with an AI-generated summary and structured notes.
4. **Interactive Learning** — The user can switch between three modes:
   - **Flashcards** — AI-generated Q&A cards with a carousel interface.
   - **Quiz** — Multiple-choice questions with instant grading and explanations.
   - **AI Chat** — Ask any question about the content; answers are grounded in the source material via RAG.
5. **Progress Tracking** — Study progress (flashcards reviewed, quiz scores) is saved and displayed.

---

## 🔍 Step-by-Step Working Preview

### Step 1 — Content Ingestion

```
User Input  →  YouTube URL / PDF file
                      │
              ┌───────┴───────┐
              │   Router:     │
              │  content.py   │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         ▼                         ▼
  youtube_service.py         pdf_service.py
  (transcript via API)       (text via PyMuPDF)
```

- **YouTube**: Uses `youtube-transcript-api` to fetch the transcript. Supports auto-generated captions and translation to English (fallback via Gemini AI).
- **PDF**: Uses `PyMuPDF` (fitz) to extract text page-by-page from uploaded PDF files (max 10 MB).
- A `content` record is created in Supabase with status `processing`.

### Step 2 — Text Chunking

```
  Raw Text  →  chunking_service.py  →  Semantic Chunks
```

- Uses **NLTK sentence tokenizer** to split content into meaningful, overlapping chunks.
- Each chunk maintains context boundaries to avoid breaking mid-sentence.
- Chunks are stored in a `chunks` table with ordering metadata.

### Step 3 — Embedding Generation & Storage

```
  Text Chunks  →  embedding_service.py  →  Vector Embeddings
                                                   │
                                           vector_store.py
                                        (Supabase pgvector)
```

- Each chunk is sent to **Gemini Text Embedding 004** model to produce a dense vector representation.
- Vectors are stored using Supabase's `pgvector` extension for efficient similarity search.
- The content status is updated to `ready`.

### Step 4 — AI-Generated Study Materials

```
  Full Text  →  ai_service.py  →  Gemini 2.0 Flash
                                       │
                          ┌──────────────┼───────────────┐
                          ▼              ▼               ▼
                    Flashcards        Quizzes         Summary
                  (flashcard_prompt) (quiz_prompt)   (notes)
```

- Flashcards, quizzes, and summaries are generated **on-demand** when the user first requests them.
- Each generation uses a carefully engineered **prompt template** (stored in `app/prompts/`).
- Results are cached in Supabase to avoid redundant API calls.

### Step 5 — RAG-Powered AI Chat

```
  User Question
       │
       ▼
  generate_query_embedding()    ← Embed the question
       │
       ▼
  search_similar_chunks()       ← pgvector cosine similarity
       │
       ▼
  Retrieve top-K chunks         ← Relevant source context
       │
       ▼
  Build prompt (system + user + chat history)
       │
       ▼
  Gemini 2.0 Flash (streaming)  ← SSE response chunks
       │
       ▼
  Save to chat_history           ← Persistent conversation
```

- The **RAG pipeline** in `rag_service.py` retrieves the most relevant content chunks for each question.
- Responses are **streamed** to the frontend via **Server-Sent Events (SSE)** for a real-time typing experience.
- Chat history is persisted per session, enabling multi-turn conversations.
- Source citations are attached to each response for transparency.

### Step 6 — Study Progress Tracking

- Flashcard reviews and quiz attempts are recorded per content item.
- The study dashboard shows progress metrics (cards reviewed, quiz scores).
- Data is fetched via the `study_progress` router.

---

## 📡 API Endpoints

| Method   | Endpoint                             | Description                     |
| -------- | ------------------------------------ | ------------------------------- |
| `POST`   | `/api/content/process-video`         | Process a YouTube video URL     |
| `POST`   | `/api/content/process-pdf`           | Upload and process a PDF        |
| `GET`    | `/api/content`                       | List all processed content      |
| `GET`    | `/api/content/{id}`                  | Get a specific content item     |
| `DELETE` | `/api/content/{id}`                  | Delete content & associated data|
| `GET`    | `/api/flashcards/{content_id}`       | Get / generate flashcards       |
| `POST`   | `/api/quiz/{content_id}/generate`    | Generate a quiz                 |
| `POST`   | `/api/quiz/{content_id}/submit`      | Submit quiz answers             |
| `POST`   | `/api/chat/{content_id}`             | Chat with AI (SSE streaming)    |
| `GET`    | `/api/chat/{content_id}/history`     | Retrieve chat history           |
| `GET`    | `/api/content/{id}/study-progress`   | Get study progress              |
| `GET`    | `/health`                            | Health check                    |

---

<!-- ## 📌 Common Practices

### Code Organization
- **Separation of concerns** — Routers handle HTTP, services contain business logic, models define schemas.
- **Modular architecture** — Each feature (content, flashcards, quiz, chat) has its own router, service, and prompt.
- **Typed everything** — TypeScript on frontend, Pydantic on backend for end-to-end type safety.

### Environment & Configuration
- `.env.example` files provided for both frontend and backend.
- Sensitive keys are never committed (enforced via `.gitignore`).
- Configuration is centralized via `pydantic-settings` (`config.py`).

### API Design
- RESTful conventions with clear resource naming.
- CORS configured to only allow the frontend origin.
- Background tasks for long-running processing (video/PDF ingestion).
- SSE streaming for real-time chat responses.

### Frontend Best Practices
- **App Router** pattern with file-based routing (Next.js 15).
- **Component library** via shadcn/ui — accessible, customizable, consistent.
- **Dark/light theme** support with `next-themes`.
- **Loading states** — skeletons, progress bars, and spinners for all async operations.
- **Toast notifications** for success/error feedback.
- **Responsive design** — mobile-friendly layouts.
- **Custom hooks** for reusable stateful logic.

### Backend Best Practices
- **Async/await** throughout for non-blocking I/O.
- **Background tasks** (`BackgroundTasks`) for heavy processing pipelines.
- **Structured logging** with Python's `logging` module.
- **Prompt engineering** — prompts are isolated in `app/prompts/` for easy iteration.
- **Error handling** — try/catch with meaningful error responses and traceback logging.

### Database
- **Supabase (PostgreSQL)** as a single source of truth.
- **pgvector** extension for fast vector similarity search (cosine distance).
- Schema includes: `contents`, `chunks`, `flashcards`, `quizzes`, `chat_history`, `study_progress`.

### Testing
- **pytest** + **pytest-asyncio** for backend unit and integration tests.
- Test files organized under `backend/tests/`.

### Version Control
- Comprehensive `.gitignore` covering Node, Python, IDE, and OS-specific files.
- Only `.env.example` files are tracked.

--- -->
## 📸 Screenshots
Here are some previews of the app:
### Landing Page:
<img width=45% alt="Screenshot 2026-03-10 132520" src="https://github.com/user-attachments/assets/3c699f5b-da68-4b70-9987-c80a79e3bc95" />   <img width=45% alt="Screenshot 2026-03-10 132540" src="https://github.com/user-attachments/assets/e31a336a-677e-477a-ac35-c8f7cf72cc65" />

### Content Library:
<img width=45% alt="Screenshot 2026-03-10 140528" src="https://github.com/user-attachments/assets/2050ba7b-5da4-4eee-9efd-ca23a013e773" />

### Study Dashboard:
<img width=45% alt="Screenshot 2026-03-10 132805" src="https://github.com/user-attachments/assets/625af143-fffe-41f7-99c1-110908e1e827" />   <img width=45% alt="Screenshot 2026-03-10 133517" src="https://github.com/user-attachments/assets/4c33ef92-9773-481c-94f8-3ad260f9c5b2" />

### FlashCard and MCQ:
<img width=33% alt="Screenshot 2026-03-10 133737" src="https://github.com/user-attachments/assets/5835e6eb-aed2-4458-8fbb-861d0957ddf3" /> <img width=33% alt="Screenshot 2026-03-10 133329" src="https://github.com/user-attachments/assets/8a8c35bc-b912-4dbe-95ef-fff5544e965d" />   <img width=33% alt="Screenshot 2026-03-10 133453" src="https://github.com/user-attachments/assets/d0048302-d849-4746-8b7f-a78660a62214" />

### RAG Chat:
<img width=55% alt="Screenshot 2026-03-10 133636" src="https://github.com/user-attachments/assets/6f1e2194-1990-4181-b51b-1871b2308149" />

### Video & PDF Processing:
<img width=45% alt="Screenshot 2026-03-10 133914" src="https://github.com/user-attachments/assets/8ed0aa9a-4a50-4cb8-9d97-95ba43815332" />   <img width=45% alt="Screenshot 2026-03-10 134005" src="https://github.com/user-attachments/assets/1e964a7e-9c80-4b99-8a21-be364299713d" />






## 📄 License

This project is for educational purposes.
