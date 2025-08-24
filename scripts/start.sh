#!/bin/bash

# Start script for CardCataloger application
set -e

echo "🚀 Starting CardCataloger application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Check for Nvidia Docker support if GPU is available
if command -v nvidia-smi > /dev/null 2>&1; then
    echo "🎮 GPU detected, checking Nvidia Docker support..."
    if ! docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi > /dev/null 2>&1; then
        echo "⚠️  Nvidia Docker support not available. Ollama will run on CPU only."
        echo "   To enable GPU support, install nvidia-docker2 package."
    else
        echo "✅ Nvidia Docker support available!"
    fi
else
    echo "ℹ️  No GPU detected, Ollama will run on CPU."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./data/mongodb
mkdir -p ./card-images
mkdir -p ./logs

# Load environment variables
if [ -f .env.docker ]; then
    echo "📋 Loading environment variables from .env.docker..."
    export $(cat .env.docker | grep -v '^#' | xargs)
else
    echo "⚠️  .env.docker file not found, using default values..."
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down --remove-orphans || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Wait for backend to be ready
echo "⏳ Waiting for backend API to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/api/system/status > /dev/null 2>&1; then
        echo "✅ Backend API is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "🔄 Attempt $attempt/$max_attempts - Backend not ready yet, waiting 10 seconds..."
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Backend API failed to start properly"
    echo "📋 Checking logs..."
    docker-compose logs backend
    exit 1
fi

# Check if Ollama models are being set up
echo "🤖 Checking Ollama model setup..."
docker-compose logs ollama-setup

echo ""
echo "🎉 CardCataloger application started successfully!"
echo ""
echo "📱 Web Application: http://localhost:8000"
echo "🔧 API Endpoint: http://localhost:3000"
echo "🤖 Ollama Service: http://localhost:11434"
echo "🗄️  MongoDB: localhost:27017"
echo ""
echo "💡 Use './scripts/stop.sh' to stop all services"
echo "📊 Use 'docker-compose logs [service-name]' to view logs"
echo ""