// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const cardRoutes = require("./routes/cardRoutes");
const { connectDB } = require("./config/database");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware - MUST come before routes
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/api/cards')) {
    console.log('POST /api/cards request body keys:', Object.keys(req.body));
    console.log('Request body size:', JSON.stringify(req.body).length, 'characters');
  }
  next();
});

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// API Routes - MUST come before basic routes
app.use('/api/cards', cardRoutes);

// Basic Routes
app.use(basicRoutes);

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// Error handling middleware - MUST be last
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});