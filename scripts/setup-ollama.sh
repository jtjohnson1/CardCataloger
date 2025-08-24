#!/bin/bash

# Setup script for Ollama models in CardCataloger
set -e

echo "🚀 Setting up Ollama models for CardCataloger..."

# Wait for Ollama service to be ready
echo "⏳ Waiting for Ollama service to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://ollama:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "🔄 Attempt $attempt/$max_attempts - Ollama not ready yet, waiting 10 seconds..."
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Failed to connect to Ollama service after $max_attempts attempts"
    exit 1
fi

# Pull required models for card image analysis
echo "📥 Pulling LLaVA model for image analysis..."
if ! ollama pull llava:latest; then
    echo "⚠️  Failed to pull llava:latest, trying llava:7b..."
    ollama pull llava:7b || echo "❌ Failed to pull LLaVA model"
fi

echo "📥 Pulling Llama model for text processing..."
if ! ollama pull llama3.2:latest; then
    echo "⚠️  Failed to pull llama3.2:latest, trying llama3.2:3b..."
    ollama pull llama3.2:3b || echo "❌ Failed to pull Llama model"
fi

# Verify models are installed
echo "🔍 Verifying installed models..."
ollama list

echo "✅ Ollama setup completed successfully!"
echo "🎯 CardCataloger AI services are ready for card image analysis!"