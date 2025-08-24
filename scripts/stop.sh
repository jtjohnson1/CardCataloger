#!/bin/bash

# Stop script for CardCataloger application
set -e

echo "🛑 Stopping CardCataloger application..."

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed."
    exit 1
fi

# Stop all services
echo "🔄 Stopping all Docker containers..."
docker-compose down --remove-orphans

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker-compose down -v

echo "✅ CardCataloger application stopped successfully!"
echo ""
echo "💡 Use './scripts/start.sh' to start the application again"
echo "🗑️  To completely reset (remove all data), run: docker-compose down -v"
echo ""