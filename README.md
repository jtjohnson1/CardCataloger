# CardCataloger

A web-based application for managing and cataloging scanned sports and non-sports card collections. CardCataloger automatically processes paired front/back card images, extracts card details using AI image recognition, and provides price comparisons from online marketplaces including eBay and other sources.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker** (version 20.10 or later) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0 or later) - Usually included with Docker Desktop
- **Git** - [Install Git](https://git-scm.com/downloads)

**For GPU Support (Recommended for faster AI processing):**
- NVIDIA GPU (GTX 1060 or better, RTX 3070ti recommended)
- NVIDIA Docker support - [Install Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/CardCataloger.git
   cd CardCataloger
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

3. **Start the application (Production Mode):**
   ```bash
   ./scripts/start.sh
   ```

4. **Access the application:**
   - **Web Interface**: http://localhost:8000
   - **API**: http://localhost:3000/api/system/status
   - **Ollama AI Service**: http://localhost:11434/api/tags

### Development Mode

For development with hot-reloading:

```bash
./scripts/start.sh dev
```

This will start:
- Frontend on http://localhost:5173 (Vite dev server)
- Backend on http://localhost:3000 (Nodemon with hot-reload)
- Alternative frontend access on http://localhost:8000

### First Time Setup

The first startup will take several minutes as it:
- Downloads Docker images
- Sets up the database
- Downloads AI models for card recognition
- Builds the application

You'll see progress messages in the terminal. Wait for the "CardCataloger application started successfully!" message.

## 📱 Using the Application

### 1. Processing Cards

1. Navigate to the **Process Cards** page
2. Select a directory containing your scanned card images
3. Card images should follow the naming pattern: `<lot>-<iteration>-front.jpg` and `<lot>-<iteration>-back.jpg`
4. Select which cards to process
5. Monitor the AI processing progress

### 2. Managing Your Collection

1. Go to the **Card Database** page
2. View all processed cards with thumbnails
3. Sort and filter your collection
4. Click on individual cards for detailed views
5. Add cards manually if needed

### 3. Price Comparisons

- View current market prices from eBay and other sources
- See price trends and comparable sales
- Get estimated values for your cards

## 🛠️ System Requirements

### Minimum Requirements
- **RAM**: 8GB
- **Storage**: 20GB free space
- **CPU**: 4+ cores recommended
- **OS**: Windows 10/11, macOS 10.14+, or Linux

### Recommended for Best Performance
- **RAM**: 16GB+
- **GPU**: NVIDIA RTX 3070ti or better
- **Storage**: SSD with 50GB+ free space
- **CPU**: 8+ cores

## 🔧 Configuration

### Environment Variables

Copy and customize the environment file:
```bash
cp .env.docker .env
```

Key settings you might want to change:
- **eBay API credentials** (for price comparisons)
- **Database passwords**
- **JWT secrets**

### Card Images Directory

Place your card images in the `./card-images` directory, or mount your own directory by editing `docker-compose.yml`:

```yaml
volumes:
  - /path/to/your/card/images:/app/card-images:ro
```

## 🐛 Troubleshooting

### Common Issues

**Services not starting in Docker:**
```bash
# Make sure you're using the Docker setup, not npm start
./scripts/start.sh

# Check which containers are running
docker-compose ps

# If only MongoDB and Ollama are running, the backend/frontend didn't start
docker-compose logs backend
docker-compose logs frontend
```

**Port already in use:**
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000
```

**Application won't start:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs
```

**GPU not working:**
```bash
# Test GPU support
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

**Running in wrong mode:**
```bash
# For production (recommended)
./scripts/start.sh

# For development
./scripts/start.sh dev
```

### Getting Help

1. **Check the logs:**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Verify system status:**
   ```bash
   curl http://localhost:3000/api/system/status
   ```

3. **View detailed setup guide:**
   See [README.Docker.md](README.Docker.md) for comprehensive Docker setup instructions.

## 🛑 Stopping the Application

```bash
./scripts/stop.sh
```

To completely reset and remove all data:
```bash
docker-compose down -v
```

## ⚠️ Important Notes

- **Don't use `npm start`** - This runs development servers directly, not in Docker
- **Use `./scripts/start.sh`** for production Docker setup
- **Use `./scripts/start.sh dev`** for development with hot-reloading
- **Check `docker-compose ps`** to verify all services are running in containers

## 📊 Features

### AI-Powered Card Recognition
- Automatic text extraction from card images
- Manufacturer and set identification
- Player/subject recognition
- Condition assessment
- Series information detection

### Price Intelligence
- Real-time eBay price comparisons
- Historical sales data
- Market trend analysis
- Multiple marketplace integration

### Collection Management
- Sortable and filterable card database
- Bulk operations and wildcard deletion
- Detailed card information views
- Manual editing capabilities

### User-Friendly Interface
- Modern, responsive web design
- Progress tracking for batch processing
- Thumbnail previews
- Dark/light theme support

## 🏗️ Architecture

CardCataloger consists of several Docker services:

- **Frontend**: React-based web interface (Port 8000)
- **Backend**: Node.js API server (Port 3000)
- **Database**: MongoDB for data storage (Port 27017)
- **AI Service**: Ollama for image recognition (Port 11434)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. Check this README and the troubleshooting section
2. Review the [Docker setup guide](README.Docker.md)
3. Verify you're using `./scripts/start.sh` not `npm start`
4. Check existing GitHub issues
5. Create a new issue with:
   - Your operating system
   - Docker version
   - Complete error logs
   - Steps to reproduce

---

**Happy card cataloging! 🃏**