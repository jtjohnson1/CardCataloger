#!/bin/bash

# Wait for Ollama service to be ready
echo "Waiting for Ollama service to start..."

# Function to check if Ollama is ready
check_ollama() {
    # Use wget instead of curl since it's more commonly available
    wget --quiet --tries=1 --spider http://localhost:11434/api/tags 2>/dev/null
    return $?
}

# Wait up to 180 seconds for Ollama to be ready (increased timeout)
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
    wget --quiet --tries=1 --spider http://localhost:11434/api/tags && echo "Ollama is responding" || echo "Ollama is not responding"
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
    
    # Pull the model using wget
    wget --quiet --post-data="{\"name\": \"$MODEL\"}" \
         --header="Content-Type: application/json" \
         --timeout=600 \
         -O /dev/null \
         http://localhost:11434/api/pull

    if [ $? -eq 0 ]; then
        echo "Successfully installed model: $MODEL"
    else
        echo "WARNING: Failed to install model: $MODEL"
    fi
done

echo "Ollama setup completed!"

# Verify installed models
echo "Verifying installed models..."
wget --quiet -O - http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | while read model; do
    echo "  - $model"
done

echo "Ollama is ready for use!"