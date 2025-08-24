const cardService = require('../services/cardService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/cards';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to convert image file to base64
const imageToBase64 = (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg';
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Helper function to find card pairs in directory
const findCardPairs = (directory, includeSubdirectories = false) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const cardPairs = [];
  
  try {
    console.log('Scanning directory for image files:', directory);
    
    if (!fs.existsSync(directory)) {
      console.error('Directory does not exist:', directory);
      return [];
    }
    
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      const imageFiles = [];
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && includeSubdirectories) {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            imageFiles.push({
              name: file,
              path: fullPath,
              baseName: path.basename(file, ext)
            });
          }
        }
      }
      
      // Group images by base name to find front/back pairs
      const grouped = {};
      imageFiles.forEach(img => {
        const baseName = img.baseName.toLowerCase();
        if (!grouped[baseName]) {
          grouped[baseName] = [];
        }
        grouped[baseName].push(img);
      });
      
      // Create card pairs
      Object.keys(grouped).forEach((baseName, index) => {
        const images = grouped[baseName];
        
        if (images.length >= 1) {
          // Convert images to base64
          const frontImage = imageToBase64(images[0].path);
          const backImage = images.length > 1 ? imageToBase64(images[1].path) : frontImage;
          
          if (frontImage) {
            cardPairs.push({
              id: `${Date.now()}_${index}`,
              name: baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              frontImage: frontImage,
              backImage: backImage,
              status: 'ready',
              originalPaths: {
                front: images[0].path,
                back: images.length > 1 ? images[1].path : images[0].path
              }
            });
          }
        }
      });
    };
    
    scanDir(directory);
    console.log(`Found ${cardPairs.length} card pairs in directory`);
    return cardPairs;
    
  } catch (error) {
    console.error('Error scanning directory:', error);
    return [];
  }
};

class CardController {
  constructor() {
    this.upload = upload;
  }

  async scanDirectory(req, res) {
    try {
      console.log('=== DIRECTORY SCAN DEBUG START ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('Scanning directory for card images:', req.body);

      const { directory, includeSubdirectories } = req.body;

      if (!directory) {
        console.error('Directory path is required but not provided');
        return res.status(400).json({
          success: false,
          error: 'Directory path is required'
        });
      }

      console.log('Starting real directory scan for:', directory);
      console.log('Include subdirectories:', includeSubdirectories);
      console.log('Directory exists check...');
      
      // Check if directory exists first
      if (!fs.existsSync(directory)) {
        console.error('Directory does not exist:', directory);
        console.log('Available directories in parent:');
        try {
          const parentDir = path.dirname(directory);
          console.log('Parent directory:', parentDir);
          if (fs.existsSync(parentDir)) {
            const contents = fs.readdirSync(parentDir);
            console.log('Parent directory contents:', contents);
          } else {
            console.log('Parent directory does not exist either');
          }
        } catch (parentError) {
          console.error('Error checking parent directory:', parentError);
        }
        
        return res.status(400).json({
          success: false,
          error: `Directory does not exist: ${directory}`
        });
      }

      console.log('Directory exists, proceeding with scan...');

      // Actually scan the directory for real image files
      const cardPairs = findCardPairs(directory, includeSubdirectories);
      
      console.log('Scan completed. Found card pairs:', cardPairs.length);
      console.log('Card pairs details:', JSON.stringify(cardPairs, null, 2));

      if (cardPairs.length === 0) {
        console.log('No card pairs found in directory');
        
        // Let's see what files ARE in the directory
        try {
          const allFiles = fs.readdirSync(directory);
          console.log('All files in directory:', allFiles);
          
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const imageFiles = allFiles.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
          });
          console.log('Image files found:', imageFiles);
          
        } catch (readError) {
          console.error('Error reading directory contents:', readError);
        }

        return res.json({
          success: true,
          cardPairs: [],
          message: `No card images found in directory: ${directory}`
        });
      }

      console.log(`Successfully found ${cardPairs.length} real card pairs`);
      console.log('=== DIRECTORY SCAN DEBUG END ===');

      res.json({
        success: true,
        cardPairs: cardPairs
      });

    } catch (error) {
      console.error('=== DIRECTORY SCAN ERROR ===');
      console.error('Error in scanDirectory controller:', error);
      console.error('Error stack:', error.stack);
      console.error('=== END ERROR ===');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createCard(req, res) {
    try {
      console.log('=== CREATE CARD CONTROLLER START ===');
      console.log('Creating card with request body keys:', Object.keys(req.body));
      console.log('Request body data:', {
        ...req.body,
        frontImage: req.body.frontImage ? `[BASE64 DATA ${req.body.frontImage.length} chars]` : 'NO IMAGE',
        backImage: req.body.backImage ? `[BASE64 DATA ${req.body.backImage.length} chars]` : 'NO IMAGE'
      });

      const cardData = {
        playerName: req.body.playerName,
        year: parseInt(req.body.year),
        manufacturer: req.body.manufacturer,
        setName: req.body.setName,
        cardNumber: req.body.cardNumber,
        team: req.body.team || '',
        sport: req.body.sport,
        estimatedValue: parseFloat(req.body.estimatedValue) || 0,
        frontImage: req.body.frontImage,
        backImage: req.body.backImage,
        notes: req.body.notes || '',
        aiConfidence: parseFloat(req.body.aiConfidence) || 0,
        modelUsed: req.body.modelUsed || 'manual',
        processingTime: req.body.processingTime || '0s',
        needsPricing: req.body.needsPricing !== undefined ? req.body.needsPricing : (!req.body.estimatedValue || parseFloat(req.body.estimatedValue) === 0)
      };

      console.log('=== PROCESSED CARD DATA ===');
      console.log('Processed card data before creation:', {
        ...cardData,
        frontImage: cardData.frontImage ? `[BASE64 DATA ${cardData.frontImage.length} chars]` : 'NO IMAGE',
        backImage: cardData.backImage ? `[BASE64 DATA ${cardData.backImage.length} chars]` : 'NO IMAGE'
      });

      console.log('=== CALLING CARD SERVICE ===');
      const card = await cardService.createCard(cardData);

      console.log('=== CARD SERVICE RESPONSE ===');
      console.log('Card created successfully with ID:', card._id);
      console.log('Created card data keys:', Object.keys(card.toObject ? card.toObject() : card));

      console.log('=== SENDING RESPONSE ===');
      const responseData = {
        success: true,
        message: 'Card created successfully',
        card
      };
      console.log('Response data keys:', Object.keys(responseData));
      console.log('Response card ID:', responseData.card._id);

      res.status(201).json(responseData);
      console.log('=== CREATE CARD CONTROLLER END - SUCCESS ===');

    } catch (error) {
      console.error('=== CREATE CARD CONTROLLER ERROR ===');
      console.error('Error in createCard controller:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(400).json({
        success: false,
        error: error.message
      });
      console.log('=== CREATE CARD CONTROLLER END - ERROR ===');
    }
  }

  async processCardImages(req, res) {
    try {
      console.log('Processing card images...');

      if (!req.files || !req.files.frontImage || !req.files.backImage) {
        console.error('Missing required image files');
        return res.status(400).json({
          success: false,
          error: 'Both front and back images are required'
        });
      }

      const frontImagePath = req.files.frontImage[0].path;
      const backImagePath = req.files.backImage[0].path;

      console.log('Processing images at paths:', { frontImagePath, backImagePath });

      // Process images with OCR
      const ocrResult = await cardService.processCardImages(frontImagePath, backImagePath);

      if (!ocrResult.success) {
        console.error('OCR processing failed:', ocrResult.error);
        return res.status(400).json({
          success: false,
          error: ocrResult.error || 'OCR processing failed'
        });
      }

      console.log('OCR processing successful:', ocrResult);

      // Create card with OCR data
      const cardData = {
        ...ocrResult.data,
        frontImage: `/uploads/cards/${path.basename(frontImagePath)}`,
        backImage: `/uploads/cards/${path.basename(backImagePath)}`,
        aiConfidence: ocrResult.confidence,
        modelUsed: ocrResult.modelUsed,
        processingTime: ocrResult.processingTime,
        analysisDate: new Date(),
        needsPricing: !ocrResult.data.estimatedValue || ocrResult.data.estimatedValue === 0
      };

      console.log('Creating card with processed data:', cardData);

      const card = await cardService.createCard(cardData);

      console.log('Card created from OCR processing with ID:', card._id);

      res.status(201).json({
        success: true,
        message: 'Card processed and created successfully',
        card,
        ocrData: ocrResult.data,
        confidence: ocrResult.confidence
      });

    } catch (error) {
      console.error('Error in processCardImages controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllCards(req, res) {
    try {
      console.log('Getting all cards with query params:', req.query);

      const {
        sport,
        manufacturer,
        yearRange,
        valueRange,
        team,
        search,
        sortBy = 'dateAdded',
        sortOrder = 'desc',
        limit = 100,
        skip = 0
      } = req.query;

      // Parse filters
      const filters = {};

      if (sport) filters.sport = sport;
      if (manufacturer) {
        filters.manufacturer = Array.isArray(manufacturer) ? manufacturer : [manufacturer];
      }
      if (yearRange) {
        filters.yearRange = Array.isArray(yearRange) ? yearRange.map(Number) : [parseInt(yearRange), parseInt(yearRange)];
      }
      if (valueRange) {
        filters.valueRange = Array.isArray(valueRange) ? valueRange.map(Number) : [parseFloat(valueRange), parseFloat(valueRange)];
      }
      if (team) filters.team = team;
      if (search) filters.search = search;

      console.log('Parsed filters:', filters);

      const result = await cardService.getAllCards(
        filters,
        sortBy,
        sortOrder,
        parseInt(limit),
        parseInt(skip)
      );

      console.log('Retrieved cards result:', {
        cardsCount: result.cards?.length || 0,
        totalCount: result.totalCount,
        filters: filters
      });

      // Log detailed card data to understand what's being returned
      if (result.cards && result.cards.length > 0) {
        console.log('Sample card from database:', result.cards[0]);
        console.log('All cards from database:', result.cards);
      } else {
        console.log('No cards found in database');
      }

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error in getAllCards controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCardById(req, res) {
    try {
      console.log('Getting card by ID:', req.params.id);

      const { id } = req.params;
      const card = await cardService.getCardById(id);

      console.log('Retrieved card by ID:', card);

      res.json({
        success: true,
        card
      });

    } catch (error) {
      console.error('Error in getCardById controller:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateCard(req, res) {
    try {
      console.log('Updating card:', req.params.id, 'with data:', req.body);

      const { id } = req.params;
      const updateData = req.body;

      const card = await cardService.updateCard(id, updateData);

      console.log('Card updated successfully:', card);

      res.json({
        success: true,
        message: 'Card updated successfully',
        card
      });

    } catch (error) {
      console.error('Error in updateCard controller:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteCard(req, res) {
    try {
      console.log('Deleting card:', req.params.id);

      const { id } = req.params;
      await cardService.deleteCard(id);

      console.log('Card deleted successfully:', id);

      res.json({
        success: true,
        message: 'Card deleted successfully'
      });

    } catch (error) {
      console.error('Error in deleteCard controller:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteMultipleCards(req, res) {
    try {
      console.log('Deleting multiple cards:', req.body.cardIds);

      const { cardIds } = req.body;

      if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
        console.error('Invalid cardIds provided for bulk delete');
        return res.status(400).json({
          success: false,
          error: 'Card IDs array is required'
        });
      }

      const result = await cardService.deleteMultipleCards(cardIds);

      console.log('Multiple cards deleted successfully:', result);

      res.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} cards`,
        deletedCount: result.deletedCount
      });

    } catch (error) {
      console.error('Error in deleteMultipleCards controller:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async clearAllCards(req, res) {
    try {
      console.log('Clearing all cards from database...');
      const result = await cardService.clearAllCards();

      console.log('All cards cleared successfully:', result);

      res.json({
        success: true,
        message: `Successfully cleared ${result.deletedCount} cards from database`,
        deletedCount: result.deletedCount
      });

    } catch (error) {
      console.error('Error in clearAllCards controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async repriceCards(req, res) {
    try {
      console.log('Repricing cards:', req.body.cardIds);

      const { cardIds } = req.body;

      if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
        console.error('Invalid cardIds provided for repricing');
        return res.status(400).json({
          success: false,
          error: 'Card IDs array is required'
        });
      }

      const result = await cardService.repriceCards(cardIds);

      console.log('Cards repriced successfully:', result);

      res.json({
        success: true,
        message: `Successfully repriced ${result.updatedCount} cards`,
        updatedCards: result.updatedCards
      });

    } catch (error) {
      console.error('Error in repriceCards controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async bulkUpdatePrices(req, res) {
    try {
      console.log('Bulk updating prices for cards:', req.body.cardIds || 'all cards without pricing');

      const { cardIds } = req.body;

      const result = await cardService.bulkUpdatePrices(cardIds);

      console.log('Bulk price update completed:', result);

      res.json({
        success: true,
        message: `Successfully updated prices for ${result.updatedCount} cards`,
        updatedCount: result.updatedCount
      });

    } catch (error) {
      console.error('Error in bulkUpdatePrices controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async browseDirectories(req, res) {
    try {
      const { path: requestedPath } = req.query;
      console.log('Browsing directories for path:', requestedPath);

      // Start from home directory if no path provided
      let currentPath = requestedPath || require('os').homedir();
      
      // Security: Ensure we don't go outside reasonable bounds
      const allowedPaths = [
        require('os').homedir(),
        '/home',
        '/Users',
        '/tmp',
        '/var/tmp'
      ];

      const isAllowedPath = allowedPaths.some(allowed => 
        currentPath.startsWith(allowed) || allowed.startsWith(currentPath)
      );

      if (!isAllowedPath) {
        currentPath = require('os').homedir();
      }

      console.log('Scanning directory:', currentPath);

      if (!fs.existsSync(currentPath)) {
        console.error('Directory does not exist:', currentPath);
        return res.status(400).json({
          success: false,
          error: 'Directory does not exist'
        });
      }

      const items = [];
      
      try {
        const files = fs.readdirSync(currentPath);
        
        for (const file of files) {
          try {
            const fullPath = path.join(currentPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              // Only include directories that are readable
              try {
                fs.accessSync(fullPath, fs.constants.R_OK);
                items.push({
                  name: file,
                  path: fullPath,
                  type: 'directory',
                  isDirectory: true
                });
              } catch (accessError) {
                // Skip directories we can't read
                console.log('Skipping unreadable directory:', fullPath);
              }
            }
          } catch (statError) {
            // Skip files we can't stat
            console.log('Skipping file with stat error:', file);
          }
        }
      } catch (readError) {
        console.error('Error reading directory:', readError);
        return res.status(500).json({
          success: false,
          error: 'Cannot read directory contents'
        });
      }

      // Sort directories alphabetically
      items.sort((a, b) => a.name.localeCompare(b.name));

      // Add parent directory option (except for root-level paths)
      const parentPath = path.dirname(currentPath);
      if (parentPath !== currentPath && parentPath.length > 1) {
        items.unshift({
          name: '..',
          path: parentPath,
          type: 'directory',
          isDirectory: true,
          isParent: true
        });
      }

      console.log(`Found ${items.length} directories in ${currentPath}`);

      res.json({
        success: true,
        currentPath,
        directories: items
      });

    } catch (error) {
      console.error('Error browsing directories:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CardController();