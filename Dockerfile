FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy requirements
COPY backend/requirements.txt .

# Install dependencies with uv
RUN uv pip install --system -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Expose port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
