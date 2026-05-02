# Part 3: Frontend Static Build & Integration - Testing Guide

## Changes Made

✓ Updated `frontend/next.config.ts` with `output: 'export'` for static export
✓ Updated `Dockerfile` with multi-stage build:
  - Stage 1: Build Next.js frontend to `/app/frontend/out`
  - Stage 2: Copy built files and run FastAPI backend
✓ Updated `backend/main.py` to serve static files via StaticFiles mount
✓ Created integration tests in `backend/test_frontend_integration.py`

## Testing Steps

### 1. Verify Frontend Compilation
```bash
cd frontend
npm install
npm run build
# Verify .next/out directory is created
ls -la out/
```

### 2. Run Backend Unit Tests
```bash
cd backend
pip install pytest httpx fastapi uvicorn
pytest test_main.py test_frontend_integration.py -v
```

### 3. Build Docker Image
```bash
docker-compose build
```

### 4. Start Container and Test
```bash
docker-compose up -d
sleep 5

# Test API
curl http://localhost:8000/api/health

# Test Frontend
curl http://localhost:8000/
# Should return HTML (Kanban board)

# Check static assets
curl http://localhost:8000/_next/static/  # or similar path

docker-compose down
```

## Success Criteria

✓ Frontend builds to static files (`frontend/out/` directory exists)
✓ Docker build includes frontend build stage
✓ Backend serves static files from mounted directory
✓ GET / returns Kanban board HTML
✓ GET /api/health returns {"status": "ok"}
✓ All static assets load (CSS, JS, fonts)
✓ No 404 errors when loading the app
✓ All tests pass

## Expected Behavior

- Visit `http://localhost:8000/` and see the Kanban board
- All styling from Tailwind CSS should be applied
- Drag and drop should work (client-side)
- No console errors for missing assets
