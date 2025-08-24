#!/bin/bash

# CardCataloger Application Startup Script
echo "Starting CardCataloger Application..."

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed or not in PATH"
    exit 1
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p test_data
mkdir -p card_images

# Create test data if it doesn't exist
if [ ! -f "test_data/sample-001-front.jpg" ]; then
    echo "Creating sample test data..."
    ./scripts/create-test-data.sh
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker compose down --remove-orphans

# Build and start services
echo "Building and starting services..."
docker compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
echo "Checking service status..."
docker compose ps

# Wait for Ollama to be fully ready and install models
echo "Setting up Ollama models..."
docker compose exec ollama /scripts/setup-ollama.sh

# Final status check
echo "Final service status:"
docker compose ps

echo ""
echo "CardCataloger Application Started Successfully!"
echo ""
echo "Services:"
echo "  - Frontend:  http://localhost:8000"
echo "  - Backend:   http://localhost:3000"
echo "  - MongoDB:   mongodb://localhost:27017"
echo "  - Ollama:    http://localhost:11434"
echo ""
echo "To stop the application, run: ./scripts/stop.sh"
echo "To view logs, run: docker compose logs -f"
echo ""