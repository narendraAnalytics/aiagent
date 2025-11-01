# Personal Research AI Assistant

![Personal Research AI Assistant Banner](bannerImage.png)

<div align="center">

**An intelligent research assistant powered by LangGraph, Gemini AI, and advanced parallel execution**

[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://aiagent-ten-nu.vercel.app)
[![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-purple?style=flat&logo=railway)](https://railway.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.119-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.6-blue?style=flat)](https://langchain-ai.github.io/langgraph/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat&logo=postgresql)](https://neon.tech/)

[Live Demo](https://aiagent-ten-nu.vercel.app) " [API Docs](https://your-backend-url.up.railway.app/docs) " [Report Bug](https://github.com/yourusername/aiagent/issues)

</div>

---

## =� Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contact](#contact)
- [License](#license)

---

## <� Overview

**Personal Research AI Assistant** is an intelligent web application that combines the power of Google Gemini 2.5-flash, academic paper search (arXiv), and Google Search to provide comprehensive research answers with long-term memory. The platform also features AI-powered LinkedIn post generation to transform research insights into engaging social media content.

### Why This Project?

- **Parallel Execution**: Uses LangGraph to run multiple AI tools simultaneously, reducing response time
- **Long-term Memory**: Remembers your research history to provide contextual follow-up answers
- **Real-time Streaming**: See which tools are running in real-time via Server-Sent Events
- **Content Generation**: Transform research into professional LinkedIn posts with customizable styles

---

## ( Features

### =
 AI-Powered Research
- **Parallel Tool Execution**: Simultaneously queries Google Search and arXiv using LangGraph workflows
- **Multi-Source Intelligence**: Combines web search results with academic papers for comprehensive answers
- **Extended Thinking Mode**: Leverages Gemini's deep reasoning capabilities for complex queries
- **Real-time Streaming**: Live updates showing which tools are active during research
- **Session Management**: Organize research into sessions with full conversation history

### >� Long-term Memory
- Automatically stores all research queries and responses
- Retrieves relevant past research to provide contextual answers
- Persistent storage in PostgreSQL for reliable access across sessions

### =� LinkedIn Post Generation
- **AI-Powered Content**: Generate engaging LinkedIn posts from research content
- **Customizable Styles**: Choose from Professional, Casual, or Storytelling formats
- **Flexible Tones**: Educational, Promotional, Thought Leadership, or Inspirational
- **Length Options**: Short (500-800), Medium (1000-1500), or Long (2000-3000) characters
- **Auto-Enhancement**: Automatic hashtag generation and emoji placement
- **Draft Management**: Save, edit, and track posted/draft status

### = Authentication & User Management
- **Clerk Integration**: Secure OAuth authentication with multiple providers
- **Automatic Sync**: User data synchronized to PostgreSQL on login
- **JWT Verification**: Secure API access with token-based authentication

---

## =� Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.5 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Clerk** | 6.33.3 | Authentication & user management |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Radix UI** | Latest | Accessible component primitives |
| **Framer Motion** | 12.23.24 | Animation library |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Schema validation |
| **Zustand** | 5.0.8 | State management |
| **Axios** | 1.12.2 | HTTP client |
| **React Markdown** | Latest | Markdown rendering |
| **Sonner** | 2.0.7 | Toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.119.0 | Modern Python web framework |
| **Python** | 3.12 | Programming language |
| **Uvicorn** | 0.37.0 | ASGI server |
| **LangChain** | 0.3.27 | LLM orchestration |
| **LangGraph** | 0.6.10 | Workflow graph framework |
| **Google Gemini** | 2.5-flash | AI language model |
| **SQLAlchemy** | 2.0.44 | ORM with async support |
| **PostgreSQL** | Latest (Neon) | Cloud database |
| **Alembic** | 1.17.0 | Database migrations |
| **Clerk** | Latest | JWT verification |
| **arXiv API** | 2.1.0 | Academic paper search |
| **httpx** | 0.28.1 | Async HTTP client |

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Clerk

---

## <� Architecture

### LangGraph Parallel Execution Workflow

The core intelligence uses LangGraph to orchestrate parallel AI tool execution:


### Key Architectural Features

1. **Parallel Execution**: Google Search and arXiv run simultaneously using LangGraph's state management
2. **State Accumulation**: Uses `Annotated[str, operator.add]` to accumulate results from parallel nodes
3. **Streaming Events**: Real-time updates sent to frontend via Server-Sent Events (SSE)
4. **Context Awareness**: Retrieves top 5 recent research items for contextual understanding
5. **Extended Thinking**: Gemini's unlimited thinking budget for complex reasoning

```

## =� Database Schema

### ResearchMemory
Stores all research queries and AI responses for long-term memory.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | String | Clerk user ID (indexed) |
| `query` | Text | User's research question |
| `response` | Text | AI-generated response |
| `sources` | JSON | Array of source URLs |
| `extra_data` | JSON | Metadata (session_id, etc.) |
| `created_at` | DateTime | Timestamp |
| `updated_at` | DateTime | Last modified timestamp |

### UserPreferences
User profile and settings synchronized from Clerk.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `clerk_user_id` | String | Unique Clerk ID (indexed) |
| `email` | String | Unique email (indexed) |
| `first_name` | String | User's first name |
| `last_name` | String | User's last name |
| `username` | String | Username |
| `preferences` | JSON | User settings object |
| `created_at` | DateTime | Account creation timestamp |
| `updated_at` | DateTime | Last updated timestamp |

**Relationships**: One-to-Many with LinkedInPost

### LinkedInPost
Generated and saved LinkedIn posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | String | Foreign key to UserPreferences |
| `session_id` | String | Groups posts by session |
| `original_content` | Text | Source research content |
| `hook` | Text | Attention-grabbing opening |
| `main_content` | Text | Main body content |
| `cta` | Text | Call-to-action |
| `hashtags` | JSON | Array of hashtags |
| `full_post` | Text | Complete formatted post |
| `emojis_used` | JSON | Array of emojis |
| `character_count` | Integer | Total character count |
| `post_style` | String | professional/casual/storytelling |
| `tone` | String | educational/promotional/thought_leadership/inspirational |
| `target_length` | String | short/medium/long |
| `is_saved` | Boolean | Draft status |
| `is_posted` | Boolean | Published status |
| `posted_at` | DateTime | Publication timestamp |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last modified timestamp |

### ConversationHistory
Complete chat history for each user session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | String | Clerk user ID (indexed) |
| `session_id` | String | Conversation session (indexed) |
| `role` | String | 'user' or 'assistant' |
| `content` | Text | Message content |
| `extra_data` | JSON | Additional metadata |
| `created_at` | DateTime | Timestamp |

---

## = API Documentation

### Research Agent Routes (`/api`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/research` | Execute research query |  Yes |
| `POST` | `/research/stream` | Stream research with SSE |  Yes |
| `GET` | `/research/history` | Get user's research history |  Yes |
| `POST` | `/research/public` | Public research (test only) | L No |
| `GET` | `/health` | Health check endpoint | L No |

#### Example: Stream Research Request
```bash
curl -X POST https://your-backend.railway.app/api/research/stream \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest advances in quantum computing?",
    "session_id": "session_123"
  }'
```

**SSE Events**:
- `tool_start`: Tool begins execution
- `tool_complete`: Tool finishes with results
- `final_response`: Complete synthesized answer
- `done`: Request completed
- `error`: Error occurred

### LinkedIn Routes (`/api/linkedin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/generate` | Generate LinkedIn post from content |  Yes |
| `POST` | `/save` | Save generated post to database |  Yes |
| `GET` | `/history` | Get user's saved LinkedIn posts |  Yes |
| `GET` | `/post/{post_id}` | Get specific post by ID |  Yes |
| `PUT` | `/post/{post_id}` | Update existing post |  Yes |
| `DELETE` | `/post/{post_id}` | Delete post |  Yes |
| `PUT` | `/post/{post_id}/mark-posted` | Mark post as published |  Yes |

#### Example: Generate LinkedIn Post
```bash
curl -X POST https://your-backend.railway.app/api/linkedin/generate \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Research shows quantum computing will revolutionize cryptography...",
    "style": "professional",
    "tone": "educational",
    "target_length": "medium"
  }'
```

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/sync-user` | Sync Clerk user to database |  Yes |
| `GET` | `/me` | Get current user information |  Yes |

---

## =� Getting Started

### Prerequisites
- **Node.js** 18+ and npm/yarn/pnpm
- **Python** 3.12+
- **PostgreSQL** (or Neon account)
- **Clerk** account for authentication
- **Google Gemini API** key

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/aiagent.git
cd aiagent
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Create .env.local file (see Environment Variables section)
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Frontend will be available at `http://localhost:3000`

---

## = Environment Variables

### Backend `.env`
```env
# AI - Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication - Clerk
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Database - Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# CORS - Comma-separated origins
ALLOWED_ORIGINS=http://localhost:3000,https://aiagent-ten-nu.vercel.app

# Optional
ENVIRONMENT=production
PORT=8000
```

#### How to Get API Keys:

**Gemini API Key**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key to `GEMINI_API_KEY`

**Clerk Keys**:
1. Create account at [Clerk.com](https://clerk.com)
2. Create new application
3. Go to "API Keys" in dashboard
4. Copy publishable and secret keys

**Neon Database**:
1. Sign up at [Neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard
4. Use in `DATABASE_URL`

### Frontend `.env.local`
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
# For production: https://your-backend-url.up.railway.app
```

---

## < Deployment

### Backend Deployment (Railway)

1. **Create Railway Account**: [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects FastAPI

3. **Configure Environment Variables**:
   - Add all variables from `.env.example`
   - Railway provides `PORT` automatically

4. **Deploy**:
   ```bash
   # Railway uses Procfile automatically
   # Deployment command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Database Setup**:
   - Create Neon PostgreSQL instance
   - Add `DATABASE_URL` to Railway environment variables
   - Run migrations: `alembic upgrade head`

**Files Required**:
- `Procfile`: Web server command
- `nixpacks.toml`: Build configuration
- `requirements.txt`: Python dependencies

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: [vercel.com](https://vercel.com)

2. **Import Project**:
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Framework Preset: Next.js

3. **Configure**:
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Environment Variables**:
   - Add all variables from `.env.example`
   - Update `NEXT_PUBLIC_API_URL` to your Railway backend URL

5. **Deploy**:
   - Click "Deploy"
   - Vercel automatically deploys on git push

**Current Deployments**:
- Frontend: `https://aiagent-ten-nu.vercel.app`
- Backend: Deployed on Railway

---

## =� Usage

### 1. Authentication
- Navigate to the application
- Click "Sign In" or "Sign Up"
- Authenticate using Clerk (supports Google, GitHub, Email, etc.)
- User data automatically synced to database

### 2. Research Assistant
```
1. Enter your research question in the chat interface
2. Watch real-time tool execution (Google Search, arXiv)
3. Receive comprehensive synthesized answer with sources
4. Ask follow-up questions - the AI remembers context
5. Switch between sessions using the sidebar
```

**Example Queries**:
- "What are the latest developments in renewable energy?"
- "Explain quantum entanglement with recent research papers"
- "Compare machine learning frameworks for production use"

### 3. LinkedIn Post Generation
```
1. Click "Generate LinkedIn Post" in the sidebar
2. Paste your research content or insights
3. Choose style: Professional, Casual, or Storytelling
4. Select tone: Educational, Promotional, Thought Leadership, Inspirational
5. Pick length: Short, Medium, or Long
6. Click "Generate"
7. Review, edit, and save draft or mark as posted
```

### 4. Managing History
- **Research History**: View all past queries in sidebar
- **LinkedIn Drafts**: Access saved posts in LinkedIn sidebar
- **Sessions**: Organize conversations by session

---

## > Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/aiagent.git
   cd aiagent
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Code Style
- **Frontend**: ESLint + Prettier (Next.js defaults)
- **Backend**: PEP 8 (Python) with Black formatter
- **Commits**: Conventional Commits format

---

## =� Contact

**Narendra**
Email: narendra.insights@gmail.com

For bugs and feature requests, please open an issue on GitHub.

---

## =� License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## =O Acknowledgments

- **LangChain & LangGraph**: For powerful AI workflow orchestration
- **Google Gemini**: For advanced AI capabilities
- **Clerk**: For seamless authentication
- **Vercel & Railway**: For reliable hosting
- **Neon**: For serverless PostgreSQL
- **arXiv**: For academic paper access
- **Open Source Community**: For amazing tools and libraries

---

<div align="center">

**Built with d using LangGraph, Next.js, and FastAPI**

[ Back to Top](#personal-research-ai-assistant)

</div>

