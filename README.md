```markdown
# CardCataloger

CardCataloger is a web-based application designed to manage and catalog scanned sports and non-sports card collections. Using AI image recognition, the app processes paired front and back card images to extract card details and provides price comparisons from various online marketplaces, including eBay.

## Overview

CardCataloger is organized into two main parts: frontend and backend.

### Architecture and Technologies

- **Frontend**:
  - Developed using ReactJS and Vite.
  - Integrated with Shadcn-UI component library and Tailwind CSS.
  - Client-side routing with `react-router-dom`.
  - All frontend API requests are directed to backend endpoints starting with `/api/`.

- **Backend**:
  - Built with ExpressJS implementing REST API endpoints.
  - Uses MongoDB with Mongoose for database operations.
  - Integrated with various third-party services for AI image processing, price comparison, and data extraction.

### Project Structure

- `client/`: Contains the ReactJS frontend code.
  - `src/pages/`: Contains page components.
  - `src/components/`: Contains reusable components.
  - `src/api/`: Contains API request definitions and mock data.

- `server/`: Contains the ExpressJS server code.
  - `api/`: Contains the API endpoints.
  - `models/`: Defines the MongoDB schemas.
  - `services/`: Contains service classes for business logic.

## Features

### Main Dashboard
- Clean and modern web interface.
- Displays system health status such as Ollama connection and database status.

### Card Processing
- Directory browser to select source directory with card images.
- Real-time progress monitoring with error logging.
- Processes paired front and back card images using AI for detail extraction.

### Card Database
- Sortable and filterable table displaying processed cards.
- Detailed card view with manual edit capability.
- Price comparison from multiple online sources.

### Settings
- Configure API credentials for eBay and other marketplaces.
- Connection settings for Ollama and GPU configuration.
- Maintenance tools such as backup and restore options.

## Getting Started

### Requirements

- Node.js and npm.
- Docker (for containerized deployment).
- MongoDB instance.
- eBay Developer Account for API credentials.

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourgithubuser/CardCataloger.git
   cd CardCataloger
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `server` directory with the following variables:
     ```
     MONGODB_URI=<Your MongoDB URI>
     EBAY_API_KEY=<Your eBay API Key>
     ```

4. **Run the project**:
   ```bash
   npm run start
   ```

5. **Access the application**:
   - Frontend: Open [http://localhost:5173](http://localhost:5173) in your browser.
   - Backend: The API will be running on [http://localhost:3000](http://localhost:3000).

### License

The project is proprietary (not open source).

© 2024 Your Company Name. All rights reserved.
```