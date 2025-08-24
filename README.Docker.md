# CardCataloger Docker Setup

This guide provides comprehensive instructions for setting up and running the CardCataloger application using Docker with full GPU support for AI processing.

## Prerequisites

### Required Software
- **Docker Engine** (version 20.10 or later)
- **Docker Compose** (version 2.0 or later)
- **Git** (for cloning the repository)

### For GPU Support (Recommended)
- **NVIDIA GPU** (GTX 1060 or better, RTX 3070ti recommended)
- **NVIDIA Docker** (nvidia-docker2 package)
- **NVIDIA Container Toolkit**

### System Requirements
- **RAM**: Minimum 8GB, 16GB+ recommended
- **Storage**: At least 20GB free space for Docker images and models
- **CPU**: Multi-core processor (4+ cores recommended)

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd CardCataloger
chmod +x scripts/*.sh
```

### 2. Configure Environment
Copy and customize the environment file:
```bash
cp .env.docker .env
# Edit .env file with your specific configuration
```

### 3. Start Application
```bash
./scripts/start.sh
```

### 4. Access Application
- **Web Interface**: http://localhost:8000
- **API**: http://localhost:3000
- **Ollama AI**: http://localhost:11434
- **MongoDB**: localhost:27017

### 5. Stop Application
```bash
./scripts/stop.sh
```

## GPU Support Configuration

### Installing NVIDIA Docker Support

#### Ubuntu/Debian
```bash
# Add NVIDIA package repositories
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Install nvidia-docker2
sudo apt-get update
sudo apt-get install -y nvidia-docker2

# Restart Docker daemon
sudo systemctl restart docker
```

#### Testing GPU Support
```bash
# Test NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### GPU Configuration in Docker Compose

The `docker-compose.yml` includes GPU support configuration:
```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
  runtime: nvidia
  environment:
    - NVIDIA_VISIBLE_DEVICES=all
    - NVIDIA_DRIVER_CAPABILITIES=compute,utility
```

## Services Architecture

### Core Services

#### 1. Frontend (Port 8000)
- **Technology**: React + Vite + Nginx
- **Purpose**: Web user interface
- **Health Check**: HTTP GET to port 80

#### 2. Backend (Port 3000)
- **Technology**: Node.js + Express
- **Purpose**: REST API and business logic
- **Health Check**: GET /api/system/status

#### 3. MongoDB (Port 27017)
- **Technology**: MongoDB 7.0
- **Purpose**: Data persistence
- **Health Check**: MongoDB ping command

#### 4. Ollama (Port 11434)
- **Technology**: Ollama with GPU support
- **Purpose**: AI image processing and analysis
- **Health Check**: GET /api/tags

#### 5. Ollama Setup (One-time)
- **Purpose**: Downloads and installs AI models
- **Models**: LLaVA (image analysis), Llama (text processing)

### Network Configuration
All services communicate through a dedicated Docker network (`cardcataloger-network`) for security and isolation.

### Volume Management
- **mongodb_data**: Persistent database storage
- **ollama_data**: AI model storage
- **backend_logs**: Application logs
- **card-images**: Mounted directory for card image files

## Development vs Production

### Development Mode
```bash
# Uses docker-compose.override.yml automatically
docker-compose up -d
```

Development features:
- Hot reloading for frontend and backend
- Source code mounted as volumes
- Development dependencies included
- Detailed logging enabled

### Production Mode
```bash
# Explicitly use production configuration
docker-compose -f docker-compose.yml up -d
```

Production features:
- Optimized builds
- Production dependencies only
- Health checks enabled
- Restart policies configured

## Configuration

### Environment Variables (.env.docker)

#### Database Configuration
```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
MONGO_DB_NAME=CardCataloger
```

#### API Keys (Optional)
```bash
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
EBAY_DEV_ID=your_ebay_dev_id
EBAY_USER_TOKEN=your_ebay_token
```

#### AI Service Configuration
```bash
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_HOST=0.0.0.0
```

### Custom Configuration

#### Card Images Directory
Mount your card images directory:
```yaml
volumes:
  - /path/to/your/card/images:/app/card-images:ro
```

#### Custom Models
Modify `scripts/setup-ollama.sh` to install different AI models:
```bash
ollama pull your-preferred-model:latest
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. GPU Not Detected
```bash
# Verify GPU is available
nvidia-smi

# Check Docker GPU support
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# If failed, reinstall nvidia-docker2
```

#### 3. Ollama Models Not Loading
```bash
# Check Ollama logs
docker-compose logs ollama

# Manually setup models
docker-compose exec ollama ollama pull llava:latest
```

#### 4. Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify database is accessible
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Viewing Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs ollama

# Follow logs in real-time
docker-compose logs -f backend
```

### Service Status
```bash
# Check all services
docker-compose ps

# Check health status
docker-compose exec backend curl http://localhost:3000/api/system/status
```

## Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/stop.sh
./scripts/start.sh
```

### Backup Data
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup

# Backup Ollama models
docker run --rm -v cardcataloger_ollama_data:/data -v $(pwd):/backup alpine tar czf /backup/ollama-backup.tar.gz /data
```

### Reset Everything
```bash
# Stop and remove all data
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all -v
```

## Performance Optimization

### For GPU Processing
- Ensure adequate GPU memory (8GB+ recommended)
- Monitor GPU usage: `nvidia-smi -l 1`
- Adjust batch sizes in processing if needed

### For Large Collections
- Increase MongoDB memory allocation
- Consider SSD storage for better I/O performance
- Monitor disk space usage

### Resource Monitoring
```bash
# Container resource usage
docker stats

# System resource usage
htop
nvidia-smi
```

## Security Considerations

### Production Deployment
1. **Change default passwords** in `.env` file
2. **Use strong JWT secrets**
3. **Configure firewall** to restrict port access
4. **Enable HTTPS** with reverse proxy (nginx/traefik)
5. **Regular security updates** for base images

### Network Security
- Services communicate only through internal Docker network
- External access only through designated ports
- No direct database access from outside

## Support

### Getting Help
1. Check logs: `docker-compose logs [service-name]`
2. Verify system status: `curl http://localhost:3000/api/system/status`
3. Review this documentation
4. Check Docker and GPU driver versions

### Reporting Issues
Include the following information:
- Operating system and version
- Docker and Docker Compose versions
- GPU model and driver version
- Complete error logs
- Steps to reproduce the issue