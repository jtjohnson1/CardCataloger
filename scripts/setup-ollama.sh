#!/bin/bash

# Wait for Ollama service to be ready
echo "Waiting for Ollama service to start..."

# Function to check if Ollama is ready
check_ollama() {
    curl -s http://ollama:11434/api/tags > /dev/null 2>&1
    return $?
}

# Wait up to 120 seconds for Ollama to be ready
TIMEOUT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $TIMEOUT ]; do
    if check_ollama; then
        echo "Ollama service is ready!"
        break
    fi
    
    echo "Ollama not ready yet, waiting... ($ELAPSED/$TIMEOUT seconds)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: Ollama service failed to start within $TIMEOUT seconds"
    exit 1
fi

# Install required models
echo "Installing Ollama models..."

# List of models to install
MODELS=(
    "llava:7b"
    "llama3.2-vision:11b"
)

for MODEL in "${MODELS[@]}"; do
    echo "Installing model: $MODEL"
    
    # Pull the model
    curl -X POST http://ollama:11434/api/pull \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$MODEL\"}" \
        --max-time 600 \
        --silent \
        --show-error
    
    if [ $? -eq 0 ]; then
        echo "Successfully installed model: $MODEL"
    else
        echo "WARNING: Failed to install model: $MODEL"
    fi
done

echo "Ollama setup completed!"

# Verify installed models
echo "Verifying installed models..."
curl -s http://ollama:11434/api/tags | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | while read model; do
    echo "  - $model"
done

echo "Ollama is ready for use!"