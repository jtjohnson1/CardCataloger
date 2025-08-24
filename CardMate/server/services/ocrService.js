const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llava:latest';
  }

  async processCardImage(imagePath, imageType = 'front') {
    try {
      console.log(`Processing ${imageType} card image: ${imagePath}`);
      const startTime = Date.now();

      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Create prompt based on image type
      const prompt = this.createPrompt(imageType);

      // Call Ollama API
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.defaultModel,
        prompt: prompt,
        images: [base64Image],
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      }, {
        timeout: 60000 // 60 second timeout
      });

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
      console.log(`OCR processing completed in ${processingTime}`);

      // Parse the response
      const extractedData = this.parseOCRResponse(response.data.response, imageType);
      
      return {
        success: true,
        data: extractedData,
        processingTime,
        confidence: this.calculateConfidence(extractedData)
      };

    } catch (error) {
      console.error(`OCR processing error for ${imageType} image:`, error.message);
      return {
        success: false,
        error: error.message,
        data: this.getDefaultCardData()
      };
    }
  }

  createPrompt(imageType) {
    if (imageType === 'front') {
      return `Analyze this sports card front image and extract the following information in JSON format:
{
  "playerName": "player's full name",
  "year": "year as number",
  "manufacturer": "card manufacturer/brand",
  "setName": "set or series name",
  "cardNumber": "card number",
  "team": "team name",
  "sport": "sport type (Baseball, Basketball, Football, Hockey, Soccer, or Non-Sports)"
}

Be precise and only extract information that is clearly visible. If information is not visible, use empty string or null.`;
    } else {
      return `Analyze this sports card back image and extract any additional information in JSON format:
{
  "additionalInfo": "any additional player info, stats, or details",
  "cardNumber": "card number if visible",
  "year": "year if visible",
  "manufacturer": "manufacturer if visible"
}

Focus on information that might not be visible on the front of the card.`;
    }
  }

  parseOCRResponse(response, imageType) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Clean and validate the data
        return {
          playerName: this.cleanString(parsedData.playerName),
          year: this.parseYear(parsedData.year),
          manufacturer: this.cleanString(parsedData.manufacturer),
          setName: this.cleanString(parsedData.setName),
          cardNumber: this.cleanString(parsedData.cardNumber),
          team: this.cleanString(parsedData.team),
          sport: this.validateSport(parsedData.sport),
          additionalInfo: this.cleanString(parsedData.additionalInfo)
        };
      }
    } catch (error) {
      console.error('Error parsing OCR response:', error.message);
    }

    // Fallback: return default data
    return this.getDefaultCardData();
  }

  cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/[^\w\s\-\.]/g, '');
  }

  parseYear(year) {
    if (!year) return new Date().getFullYear();
    const parsed = parseInt(year);
    if (isNaN(parsed) || parsed < 1800 || parsed > new Date().getFullYear() + 1) {
      return new Date().getFullYear();
    }
    return parsed;
  }

  validateSport(sport) {
    const validSports = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Non-Sports'];
    if (!sport || typeof sport !== 'string') return 'Non-Sports';
    
    const normalized = sport.trim();
    const found = validSports.find(s => s.toLowerCase() === normalized.toLowerCase());
    return found || 'Non-Sports';
  }

  calculateConfidence(data) {
    let score = 0;
    let total = 0;

    const fields = ['playerName', 'year', 'manufacturer', 'setName', 'cardNumber', 'sport'];
    
    fields.forEach(field => {
      total++;
      if (data[field] && data[field] !== '' && data[field] !== 'Unknown') {
        score++;
      }
    });

    return total > 0 ? score / total : 0;
  }

  getDefaultCardData() {
    return {
      playerName: 'Unknown Player',
      year: new Date().getFullYear(),
      manufacturer: 'Unknown',
      setName: 'Unknown Set',
      cardNumber: '0',
      team: '',
      sport: 'Non-Sports',
      additionalInfo: ''
    };
  }

  async checkOllamaConnection() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      console.log('Ollama connection successful');
      return { success: true, models: response.data.models };
    } catch (error) {
      console.error('Ollama connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OCRService();