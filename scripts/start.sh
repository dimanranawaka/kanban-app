#!/bin/bash

echo "Starting Kanban App..."
docker-compose up -d
sleep 2
echo "Backend running at http://localhost:8000"
echo "Health check: curl http://localhost:8000/api/health"
