# Personal Research Assistant - Backend Setup Documentation

## 📋 Project Overview

**Project Name:** Personal Research Assistant with Long-Term Memory

**Description:** An AI-powered research assistant that helps users find and synthesize information from the web. The agent uses LangGraph for orchestration, Google Gemini for reasoning, and Neon PostgreSQL for long-term memory storage. Each user has personalized research history and the agent learns from past interactions.

---

## 🎯 Project Goals

- Build an intelligent research assistant using AI agents
- Implement user authentication and personalized experiences
- Store and retrieve long-term memory for contextual responses
- Create a scalable full-stack application with modern best practices

---

## 🏗️ Architecture Overview

### **Tech Stack:**

**Backend:**
- **FastAPI** - Modern Python web framework
- **LangGraph** - AI agent orchestration and workflow
- **LangChain** - LLM utilities and tool integration
- **Google Gemini** - Large Language Model (gemini-1.5-pro/flash)
- **Clerk** - Authentication and user management
- **Neon PostgreSQL** - Serverless PostgreSQL for memory storage
- **Tavily API** - Web search tool for research

**Frontend (Upcoming):**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Clerk React components

---

## 🚀 Setup Progress

### ✅ **Phase 1: Backend Environment Setup** (COMPLETED)

#### **1.1 Project Initialization**

Created the backend project structure:
```
AIAGENT/
└── backend/
    ├── .venv/           # Virtual environment
    ├── .gitignore       # Git ignore rules
    ├── main.py          # Entry point
    ├── pyproject.toml   # Project dependencies
    ├── README.md        # Documentation
    └── uv.lock          # Dependency lock file
```

#### **1.2 Package Management**

**Tool Used:** `uv` (Fast Python package installer)

**Rationale:** uv provides:
- Lightning-fast package installation
- Better dependency resolution
- Modern Python project management
- Compatible with pip ecosystem

#### **1.3 Virtual Environment Creation**

```bash
cd backend
uv init
uv venv
source .venv/bin/activate  # Mac/Linux
# .venv\Scripts\activate   # Windows
```

**Purpose:** Isolated Python environment to avoid conflicts with system packages.

---

## 📦 Installed Packages

### **Core Framework:**
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | Latest | Web framework for building APIs |
| `uvicorn[standard]` | Latest | ASGI server to run FastAPI |

### **AI & Agent Framework:**
| Package | Version | Purpose |
|---------|---------|---------|
| `langgraph` | Latest | Agent workflow orchestration |
| `langchain` | Latest | LLM framework utilities |
| `langchain-google-genai` | Latest | Google Gemini integration |

### **Authentication:**
| Package | Version | Purpose |
|---------|---------|---------|
| `pyclerk` | Latest | Clerk authentication SDK |

### **Database:**
| Package | Version | Purpose |
|---------|---------|---------|
| `psycopg2-binary` | Latest | PostgreSQL adapter |
| `sqlalchemy` | Latest | SQL ORM for database operations |
| `asyncpg` | Latest | Async PostgreSQL driver |

### **Tools & Utilities:**
| Package | Version | Purpose |
|---------|---------|---------|
| `tavily-python` | Latest | Web search API client |
| `python-dotenv` | Latest | Environment variable management |
| `httpx` | Latest | Async HTTP client |
| `python-multipart` | Latest | File upload support |

---

## 🔧 Installation Commands

All packages were installed using uv:

```bash
# Core Framework
uv pip install fastapi uvicorn[standard]

# LangGraph & LangChain
uv pip install langgraph langchain langchain-google-genai

# Clerk Authentication
uv pip install pyclerk

# Database (Neon PostgreSQL)
uv pip install psycopg2-binary sqlalchemy asyncpg


# Utilities
uv pip install python-dotenv httpx python-multipart
```

---

## 📁 Current Project Structure

```
AIAGENT/
├── backend/
│   ├── .venv/              # Virtual environment (excluded from git)
│   ├── .gitignore          # Git ignore configuration
│   ├── .python-version     # Python version specification
│   ├── main.py             # FastAPI entry point
│   ├── pyproject.toml      # Project configuration & dependencies
│   ├── README.md           # Project documentation
│   └── uv.lock             # Locked dependency versions
└── frontend/               # (To be created)
```

---

## 🔐 Environment Variables

Created `.env` file template for configuration:

```env
# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Google search enabled using model gemini gemini-2.5-flash also Tool(googleSearch=types.GoogleSearch.

# Neon Database
DATABASE_URL=postgresql://user:password@host/dbname

# Server Config
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

# CORS (for Next.js frontend)
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🎯 Next Steps

### **Phase 2: Project Structure & Configuration** (UPCOMING)

- [ ] Create organized folder structure (app/, models/, api/, agent/, etc.)
- [ ] Setup configuration management
- [ ] Create database models and connection
- [ ] Implement authentication middleware
- [ ] Build LangGraph agent workflow
- [ ] Create FastAPI routes
- [ ] Test API endpoints

### **Phase 3: Frontend Development** (FUTURE)

- [ ] Initialize Next.js project
- [ ] Setup Clerk authentication
- [ ] Create chat interface
- [ ] Implement API integration
- [ ] Build research history view

### **Phase 4: Deployment** (FUTURE)

- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Configure production environment variables
- [ ] Setup Neon database
- [ ] Test production environment

---

## 📝 Development Notes

### **Design Decisions:**

1. **uv over pip:** Faster installation and better dependency management
2. **FastAPI over Flask:** Modern async support, automatic API docs, type safety
3. **LangGraph over LangChain alone:** Better agent workflow control and debugging
4. **Neon over local PostgreSQL:** Serverless, no infrastructure management
5. **Clerk over custom auth:** Production-ready, saves development time

### **Best Practices Followed:**

- ✅ Virtual environment for dependency isolation
- ✅ `.gitignore` to exclude sensitive files and environments
- ✅ `.env` for configuration management
- ✅ Lock file (`uv.lock`) for reproducible builds
- ✅ Clear project documentation

---

## 🔍 Verification

**Package Installation Check:**
```bash
uv pip list
```

**Expected Output:** All listed packages should appear with their installed versions.

---

## 📚 Resources & References

- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **LangGraph Documentation:** https://langchain-ai.github.io/langgraph/
- **Clerk Documentation:** https://clerk.com/docs
- **Google Gemini API:** https://ai.google.dev/
- **Neon PostgreSQL:** https://neon.tech/docs
- **Tavily Search API:** https://tavily.com/

---

## ✅ Status Summary

| Task | Status |
|------|--------|
| Project initialization | ✅ Complete |
| Virtual environment setup | ✅ Complete |
| Package installation | ✅ Complete |
| `.env` template creation | ✅ Complete |
| `.gitignore` configuration | ✅ Complete |
| Folder structure | ⏳ Next step |
| Database setup | ⏳ Pending |
| Agent implementation | ⏳ Pending |
| API routes | ⏳ Pending |

---

**Last Updated:** October 14, 2025  
**Current Phase:** Backend Environment Setup - Complete  
**Next Phase:** Project Structure & Configuration

---

This documentation will be updated as the project progresses. 🚀


--- -------- ----------------

# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.5-flash"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config = types.ThinkingConfig(
            thinking_budget=-1,
        ),
        tools=tools,
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()
