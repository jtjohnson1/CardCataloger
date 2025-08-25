# CardCataloger Docker Setup

This guide explains how to set up and run the CardCataloger application using Docker with GPU support for AI processing.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2
- NVIDIA Container Toolkit (for GPU support)
- NVIDIA GPU drivers

## Quick Start

1. **Start the application:**
   ```bash
   ./scripts/start.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:3000
   - Ollama API: http://localhost:11434

3. **Stop the application:**
   ```bash
   ./scripts/stop.sh
   ```

## Components

### Services

- **Frontend**: React application served by Nginx on port 8000
- **Backend**: Node.js API server on port 3000
- **MongoDB**: Database on port 27017
- **Ollama**: AI service with GPU support on port 11434

### GPU Support

The Ollama service is configured with NVIDIA GPU support:
- Uses `runtime: nvidia`
- Maps all NVIDIA devices
- Configured for compute and utility capabilities

## Development vs Production

### Production Mode (Default)
- Uses production Dockerfiles
- Optimized builds
- Nginx serves static frontend files
- No volume mounts

### Development Mode
To enable development mode with hot reloading:

1. **Rename the override file:**
   ```bash
   mv docker-compose.override.yml.disabled docker-compose.override.yml
   ```

2. **Start in development mode:**
   ```bash
   docker compose up -d --build
   ```

3. **Access development servers:**
   - Frontend: http://localhost:5173 (Vite dev server)
   - Backend: http://localhost:3000 (with nodemon)

**Warning**: Development mode uses volume mounts that can cause permission issues in some environments.

## Configuration

### Environment Variables

Create a `.env` file or use the provided `.env.docker`:

```bash
# Database
DATABASE_URL=mongodb://mongodb:27017/CardCataloger

# JWT Secrets
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret

# eBay API (optional)
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
EBAY_DEV_ID=your_dev_id
EBAY_USER_TOKEN=your_token
EBAY_SANDBOX=true

# Ollama
OLLAMA_BASE_URL=http://ollama:11434
```

### GPU Configuration

The application automatically detects and uses NVIDIA GPUs. Ensure:

1. **NVIDIA drivers are installed:**
   ```bash
   nvidia-smi
   ```

2. **NVIDIA Container Toolkit is installed:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```

## Troubleshooting

### Common Issues

1. **Frontend permission errors:**
   - Ensure you're not using development mode in production
   - Check that `docker-compose.override.yml` doesn't exist

2. **Ollama GPU not detected:**
   - Verify NVIDIA drivers: `nvidia-smi`
   - Check container toolkit: `docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi`

3. **Database connection issues:**
   - Ensure MongoDB container is healthy: `docker compose ps`
   - Check logs: `docker compose logs mongodb`

4. **Version warnings:**
   - Update to Docker Compose V2: `docker compose version`

### Logs

View service logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f ollama
docker compose logs -f mongodb
```

### Health Checks

Check service health:
```bash
docker compose ps
```

All services should show "healthy" status.

## Data Persistence

- **MongoDB data**: Stored in `mongodb_data` volume
- **Ollama models**: Stored in `ollama_data` volume
- **Card images**: Stored in `card_images` volume

## Backup and Restore

### Backup
```bash
# Backup MongoDB
docker compose exec mongodb mongodump --out /data/backup

# Backup volumes
docker run --rm -v cardcataloger_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz /data
```

### Restore
```bash
# Restore MongoDB
docker compose exec mongodb mongorestore /data/backup

# Restore volumes
docker run --rm -v cardcataloger_mongodb_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb_backup.tar.gz -C /
```

## Performance Tuning

### Ollama GPU Memory
Adjust GPU memory usage in docker-compose.yml:
```yaml
ollama:
  environment:
    - OLLAMA_GPU_MEMORY=8GB  # Adjust based on your GPU
```

### MongoDB Memory
For large collections, increase MongoDB memory:
```yaml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 2
```

## Security

### Production Deployment
1. Change default JWT secrets
2. Use strong MongoDB passwords
3. Configure firewall rules
4. Use HTTPS with reverse proxy
5. Regular security updates

### Network Security
All services communicate through the internal `cardcataloger-network` bridge network.