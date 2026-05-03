# Kanban Studio

A containerized, multi-user project management application featuring a drag-and-drop Kanban board and a built-in AI assistant for autonomous board manipulation. 

## Architecture & Tech Stack

*   **Frontend**: Next.js (Static Export), React, Tailwind CSS, `dnd-kit`
*   **Backend**: Python, FastAPI, SQLite, `bcrypt`
*   **AI Agent**: OpenAI Structured Outputs API
*   **Infrastructure**: Docker, Docker Compose
*   **Package Management**: `uv` (Python), `npm` (Node.js)

## Prerequisites

*   Docker engine and Docker Compose
*   OpenAI API Key

## Quick Start

1.  **Environment Variables**
    Create a `.env` file in the repository root:
    ```bash
    echo "openai_api_key=your_api_key_here" > .env
    ```

2.  **Start Services**
    Build and launch the containerized application:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access**
    The application will be available at `http://localhost:8000`.

## Project Structure

```text
.
├── backend/            # FastAPI application
│   ├── routes/         # API endpoint controllers
│   ├── schemas/        # Pydantic validation models
│   ├── ai.py           # OpenAI structured output logic
│   └── main.py         # Application entry point
├── frontend/           # Next.js application
│   ├── src/components/ # React UI components
│   ├── src/lib/        # API clients and utilities
│   └── src/app/        # Next.js routing
├── data/               # Persistent SQLite storage volume
└── docker-compose.yml  # Container orchestration
```

## Features

*   **Authentication**: Session-based auth with secure `bcrypt` password hashing.
*   **State Management**: Real-time optimistic UI updates during drag-and-drop operations.
*   **AI Integration**: The backend processes conversational inputs, injects current JSON board state as context, and parses strict Pydantic schemas returned by the LLM to autonomously execute database transactions.
*   **Persistence**: Zero-configuration SQLite database dynamically mounted as a Docker volume (`/app/data`).

## Development Workflow

The backend utilizes `uvicorn` with hot-reloading enabled. Any modifications to the `backend/` directory will automatically trigger a server restart inside the container. 

The frontend relies on Next.js static exports. Modifying UI components requires a container rebuild:
```bash
docker-compose build pm-backend && docker-compose restart pm-backend
```
