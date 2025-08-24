#!/bin/bash

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
until curl -f http://ollama:11434/api/tags >/dev/null 2>&1; do
    echo "Ollama not ready yet, waiting..."
    sleep 2
done

echo "Ollama is ready! Installing models..."

# Pull required models
echo "Pulling llava:7b model..."
curl -X POST http://ollama:11434/api/pull \
    -H "Content-Type: application/json" \
    -d '{"name": "llava:7b"}' || echo "Failed to pull llava:7b"

echo "Pulling llama2:7b model..."
curl -X POST http://ollama:11434/api/pull \
    -H "Content-Type: application/json" \
    -d '{"name": "llama2:7b"}' || echo "Failed to pull llama2:7b"

echo "Verifying installed models..."
curl -s http://ollama:11434/api/tags | grep -q "llava" && echo "✅ llava:7b installed successfully"
curl -s http://ollama:11434/api/tags | grep -q "llama2" && echo "✅ llama2:7b installed successfully"

echo "Model setup complete!"