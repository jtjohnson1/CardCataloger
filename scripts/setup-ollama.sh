#!/bin/bash

# Wait for Ollama service to be ready
echo "Waiting for Ollama service to start..."

# Function to check if Ollama is ready using ollama CLI
check_ollama() {
    ollama list > /dev/null 2>&1
    return $?
}

# Wait up to 180 seconds for Ollama to be ready
TIMEOUT=180
ELAPSED=0
INTERVAL=10

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
    echo "Checking Ollama status..."
    ollama list && echo "Ollama is responding" || echo "Ollama is not responding"
    exit 1
fi

# Install required models
echo "Installing Ollama models..."

# List of models to install (using smaller models for faster setup)
MODELS=(
    "llava:7b"
)

for MODEL in "${MODELS[@]}"; do
    echo "Installing model: $MODEL"

    # Pull the model using ollama CLI
    ollama pull "$MODEL"

    if [ $? -eq 0 ]; then
        echo "Successfully installed model: $MODEL"
    else
        echo "WARNING: Failed to install model: $MODEL"
    fi
done

echo "Ollama setup completed!"

# Verify installed models
echo "Verifying installed models..."
ollama list

echo "Ollama is ready for use!"