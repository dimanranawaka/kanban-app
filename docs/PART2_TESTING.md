# Part 2: Docker Scaffolding - Manual Test Instructions

## Files Created

✓ Dockerfile - Python 3.12 with FastAPI and uv
✓ docker-compose.yml - Service configuration with volume mounts
✓ backend/requirements.txt - FastAPI, uvicorn, pydantic dependencies
✓ backend/main.py - FastAPI app with / and /api/health routes
✓ scripts/start.sh - Start script for Mac/Linux
✓ scripts/stop.sh - Stop script for Mac/Linux
✓ scripts/start.bat - Start script for Windows
✓ scripts/stop.bat - Stop script for Windows

## Testing Instructions

### On Windows:
```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up

# In another terminal, test the endpoints:
curl http://localhost:8000/
curl http://localhost:8000/api/health

# Stop the container
docker-compose down
```

### On Mac/Linux:
```bash
# Make scripts executable
chmod +x scripts/start.sh scripts/stop.sh

# Start
./scripts/start.sh

# Test endpoints
curl http://localhost:8000/
curl http://localhost:8000/api/health

# Stop
./scripts/stop.sh
```

## Expected Results

- **GET /** returns HTML with "Hello from FastAPI" message
- **GET /api/health** returns JSON: `{"status": "ok"}`
- Container runs on port 8000
- Volume mounts enable hot-reload of backend code
