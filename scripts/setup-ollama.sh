#!/bin/bash

echo "Setting up Ollama with real AI models..."

# Wait for Ollama to be ready
while ! curl -s http://ollama:11434/api/tags > /dev/null; do
  echo "Waiting for Ollama to start..."
  sleep 5
done

# Pull required models for card analysis
echo "Pulling llava model for image analysis..."
ollama pull llava:latest

echo "Ollama setup complete!"