#!/bin/bash

echo "Starting CardCataloger application..."

# Create test data if it doesn't exist
if [ ! -d "test_data" ] || [ -z "$(ls -A test_data)" ]; then
    echo "Creating test data..."
    ./scripts/create-test-data.sh
fi

# Make sure the script is executable
chmod +x scripts/create-test-data.sh

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check if Ollama needs model installation
echo "Checking Ollama models..."
if docker-compose exec -T ollama ollama list | grep -q "NAME"; then
    echo "Ollama models already installed"
else
    echo "Installing Ollama models..."
    docker-compose exec -T ollama ollama pull llava:latest
    docker-compose exec -T ollama ollama pull llama2:latest
fi

echo ""
echo "CardCataloger is starting up!"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:8000"
echo "  - Backend API: http://localhost:3000"
echo "  - System Status: http://localhost:3000/api/system/status"
echo "  - Ollama: http://localhost:11434"
echo ""
echo "Test directory path to use in the app: /app/test_data"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: ./scripts/stop.sh"