#!/bin/bash

# CardCataloger Docker Setup Script
echo "Setting up CardCataloger with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for Nvidia Docker support (for GPU acceleration)
if command -v nvidia-docker &> /dev/null || docker info | grep -q nvidia; then
    echo "✓ Nvidia Docker support detected - GPU acceleration will be available"
else
    echo "⚠ Warning: Nvidia Docker support not detected. Ollama will run on CPU only."
    echo "  To enable GPU acceleration, install nvidia-docker2 package"
fi

# Create necessary directories
echo "Creating required directories..."
mkdir -p card-images
mkdir -p uploads
mkdir -p logs

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.docker .env
    echo "⚠ Please edit .env file with your actual configuration values"
fi

# Pull required images
echo "Pulling Docker images..."
docker-compose pull

# Build custom images
echo "Building application images..."
docker-compose build

echo "Setup complete!"
echo ""
echo "To start the application:"
echo "  docker-compose up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose down"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:8000"
echo "  Backend API: http://localhost:3000"
echo "  Ollama API: http://localhost:11434"
echo ""
echo "Note: On first startup, Ollama will need to download the AI model."
echo "This may take several minutes depending on your internet connection."