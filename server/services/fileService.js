const fs = require('fs').promises;
const path = require('path');

class FileService {
  constructor() {
    this.supportedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
  }

  async scanDirectory(directoryPath, includeSubdirectories = false) {
    try {
      console.log(`Scanning directory: ${directoryPath}, recursive: ${includeSubdirectories}`);
      
      // Check if directory exists
      const stats = await fs.stat(directoryPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      const allFiles = await this.getAllFiles(directoryPath, includeSubdirectories);
      const imageFiles = allFiles.filter(file => 
        this.supportedExtensions.includes(path.extname(file).toLowerCase())
      );

      console.log(`Found ${imageFiles.length} image files out of ${allFiles.length} total files`);

      const cardPairs = this.groupCardFiles(imageFiles);
      
      const result = {
        cards: cardPairs.cards,
        totalImages: imageFiles.length,
        validPairs: cardPairs.validPairs,
        singleCards: cardPairs.singleCards
      };

      console.log(`Scan results: ${result.validPairs} pairs, ${result.singleCards} single cards`);
      return result;

    } catch (error) {
      console.error('Error scanning directory:', error);
      throw error;
    }
  }

  async getAllFiles(dir, recursive) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory() && recursive) {
        const subFiles = await this.getAllFiles(fullPath, recursive);
        files.push(...subFiles);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  groupCardFiles(imageFiles) {
    const cardMap = new Map();
    const cards = [];
    let validPairs = 0;
    let singleCards = 0;

    // Group files by lot-iteration pattern
    imageFiles.forEach(filePath => {
      const fileName = path.basename(filePath, path.extname(filePath));
      const match = fileName.match(/^(.+)-(\d+)-(front|back)$/i);

      if (match) {
        const [, lotNumber, iteration, side] = match;
        const key = `${lotNumber}-${iteration}`;

        if (!cardMap.has(key)) {
          cardMap.set(key, {
            lotNumber,
            iteration,
            frontImage: null,
            backImage: null
          });
        }

        const card = cardMap.get(key);
        if (side.toLowerCase() === 'front') {
          card.frontImage = filePath;
        } else if (side.toLowerCase() === 'back') {
          card.backImage = filePath;
        }
      }
    });

    // Convert to array and count pairs vs singles
    cardMap.forEach((card) => {
      if (card.frontImage) {
        cards.push({
          frontImage: card.frontImage,
          backImage: card.backImage,
          lotNumber: card.lotNumber,
          iteration: card.iteration
        });

        if (card.backImage) {
          validPairs++;
        } else {
          singleCards++;
        }
      }
    });

    return { cards, validPairs, singleCards };
  }

  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }
}

module.exports = new FileService();