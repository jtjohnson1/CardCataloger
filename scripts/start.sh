#!/bin/bash

# CardCataloger Startup Script
# This script sets up and starts the CardCataloger application using Docker

set -e  # Exit on any error

echo "🚀 Starting CardCataloger Application..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Error: docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Stop any local development servers that might be running
echo "🛑 Stopping any local development servers..."
pkill -f "npm run start" || true
pkill -f "nodemon" || true
pkill -f "vite" || true

# Check for NVIDIA GPU support if available
if command -v nvidia-smi >/dev/null 2>&1; then
    echo "🎮 NVIDIA GPU detected, enabling GPU support for Ollama..."
    export COMPOSE_DOCKER_CLI_BUILD=1
    export DOCKER_BUILDKIT=1
else
    echo "⚠️  No NVIDIA GPU detected, running Ollama in CPU mode..."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./card-images
mkdir -p ./logs

# Load environment variables from .env.docker
if [ -f .env.docker ]; then
    echo "🔧 Loading Docker environment variables..."
    export $(grep -v '^#' .env.docker | xargs)
else
    echo "⚠️  Warning: .env.docker file not found, using default values..."
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down --remove-orphans || true

# Clean up any orphaned volumes or networks
echo "🧹 Cleaning up..."
docker system prune -f || true

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
for i in {1..30}; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Services are starting up..."
        break
    fi
    echo "   Waiting for services... ($i/30)"
    sleep 2
done

# Wait for Ollama to be ready before setting up models
echo "🤖 Waiting for Ollama service to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    echo "   Waiting for Ollama... ($i/60)"
    sleep 2
done

# Setup Ollama models
echo "📚 Setting up Ollama models..."
if [ -f ./scripts/setup-ollama.sh ]; then
    chmod +x ./scripts/setup-ollama.sh
    docker-compose run --rm ollama-setup
else
    echo "⚠️  Warning: setup-ollama.sh script not found, skipping model setup..."
fi

# Final health check
echo "🏥 Performing final health check..."
sleep 5

# Check if all services are running
if docker-compose ps | grep -q "Exit"; then
    echo "❌ Some services failed to start. Checking logs..."
    docker-compose logs --tail=50
    exit 1
fi

echo ""
echo "🎉 CardCataloger is now running!"
echo ""
echo "📱 Access the application:"
echo "   Web Interface: http://localhost:8000"
echo "   Dev Frontend:  http://localhost:5173 (development mode)"
echo "   API Status:    http://localhost:3000/api/system/status"
echo "   Ollama API:    http://localhost:11434/api/tags"
echo ""
echo "📊 Monitor services:"
echo "   docker-compose logs -f          # View all logs"
echo "   docker-compose logs frontend    # View frontend logs"
echo "   docker-compose ps               # Check service status"
echo "   ./scripts/stop.sh              # Stop all services"
echo ""
echo "🔧 Troubleshooting:"
echo "   If services fail to start, check the logs above"
echo "   Ensure you have enough disk space and memory"
echo "   For GPU issues, verify NVIDIA Docker runtime is installed"
echo ""
echo "⚠️  IMPORTANT: Do not run 'npm run start' while Docker is running!"
echo "    Use either Docker OR local development, not both simultaneously."
echo ""