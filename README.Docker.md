# CardCataloger Docker Setup

This document explains how to run CardCataloger using Docker with full GPU acceleration support for AI processing.

## Prerequisites

1. **Docker & Docker Compose**
   ```bash
   # Install Docker (Ubuntu/Debian)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Nvidia GPU Support (Optional but Recommended)**
   ```bash
   # Install nvidia-docker2 for GPU acceleration
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   
   sudo apt-get update && sudo apt-get install -y nvidia-docker2
   sudo systemctl restart docker
   ```

## Quick Start

1. **Setup the application**
   ```bash
   chmod +x docker-setup.sh
   ./docker-setup.sh
   ```

2. **Configure environment variables**
   ```bash
   # Edit the .env file with your settings
   nano .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:3000/api
   - Ollama API: http://localhost:11434

## Services

### Frontend (Port 8000)
- React application with Nginx
- Serves the web interface
- Proxies API requests to backend

### Backend (Port 3000)
- Express.js API server
- Handles business logic and database operations
- Communicates with Ollama for AI processing

### Ollama (Port 11434)
- AI processing service with GPU acceleration
- Optimized for Nvidia RTX 3070 Ti
- Automatically downloads required models on first run

### MongoDB (Port 27017)
- Database for storing card information
- Persistent data storage with Docker volumes

## GPU Configuration

The Ollama service is configured for optimal performance with Nvidia GPUs:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

### Verifying GPU Access
```bash
# Check if Ollama can access GPU
docker-compose exec ollama nvidia-smi

# View Ollama logs for GPU initialization
docker-compose logs ollama
```

## File Structure

```
CardCataloger/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile.frontend         # Frontend container build
├── Dockerfile.backend          # Backend container build
├── nginx.conf                  # Nginx configuration
├── .env                        # Environment variables
├── card-images/               # Mount point for card images
├── uploads/                   # Application uploads
└── docker-setup.sh           # Setup script
```

## Data Persistence

All important data is stored in Docker volumes:
- `cardcataloger-mongodb-data`: Database storage
- `cardcataloger-ollama-data`: AI models and cache
- `cardcataloger-backend-logs`: Application logs

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart [service_name]

# Update and rebuild
docker-compose pull
docker-compose build --no-cache
docker-compose up -d

# Clean up (removes containers and networks, keeps volumes)
docker-compose down --remove-orphans

# Full cleanup (WARNING: removes all data)
docker-compose down -v --remove-orphans
```

## Troubleshooting

### GPU Not Detected
1. Verify nvidia-docker2 is installed
2. Check Docker daemon configuration includes nvidia runtime
3. Restart Docker service after installing nvidia-docker2

### Ollama Model Download Issues
1. Check internet connection
2. Monitor logs: `docker-compose logs -f ollama`
3. Models are large (several GB) - be patient on first startup

### Database Connection Issues
1. Ensure MongoDB container is running: `docker-compose ps`
2. Check network connectivity between services
3. Verify DATABASE_URL in backend environment

### Port Conflicts
If ports are already in use, modify docker-compose.yml:
```yaml
ports:
  - "8001:8000"  # Change external port
```

## Production Considerations

1. **Security**: Change default JWT secrets in .env
2. **SSL**: Add SSL termination at nginx level
3. **Backups**: Regular backup of MongoDB volume
4. **Monitoring**: Add health check endpoints
5. **Scaling**: Use Docker Swarm or Kubernetes for scaling

## Performance Optimization

### For Nvidia RTX 3070 Ti
- 8GB VRAM is sufficient for most AI models
- Ensure adequate system RAM (16GB+ recommended)
- Use fast SSD storage for Docker volumes
- Monitor GPU temperature and usage

### Resource Limits
Adjust in docker-compose.yml if needed:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2.0'
```