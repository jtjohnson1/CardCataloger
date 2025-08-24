const fs = require('fs');
const path = require('path');

class FileService {
  constructor() {
    this.supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    console.log('FileService initialized');
  }

  async scanDirectory(directory, includeSubdirectories = false) {
    try {
      console.log(`FileService.scanDirectory - Scanning: ${directory}`);
      
      const files = this.getAllImageFiles(directory, includeSubdirectories);
      console.log(`FileService.scanDirectory - Found ${files.length} image files`);
      
      const cardPairs = this.groupFilesIntoCardPairs(files);
      console.log(`FileService.scanDirectory - Grouped into ${cardPairs.validPairs.length} pairs and ${cardPairs.singleCards.length} singles`);
      
      return {
        totalImages: files.length,
        validPairs: cardPairs.validPairs,
        singleCards: cardPairs.singleCards
      };
    } catch (error) {
      console.error('Error in FileService.scanDirectory:', error);
      throw error;
    }
  }

  getAllImageFiles(directory, includeSubdirectories = false) {
    const files = [];
    
    try {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && includeSubdirectories) {
          // Recursively scan subdirectories
          const subFiles = this.getAllImageFiles(fullPath, true);
          files.push(...subFiles);
        } else if (stats.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (this.supportedImageExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      throw error;
    }
    
    return files;
  }

  groupFilesIntoCardPairs(files) {
    const validPairs = [];
    const singleCards = [];
    const processed = new Set();
    
    for (const file of files) {
      if (processed.has(file)) continue;
      
      const baseName = this.getBaseName(file);
      const frontFile = this.findMatchingFile(files, baseName, 'front');
      const backFile = this.findMatchingFile(files, baseName, 'back');
      
      if (frontFile) {
        const cardPair = {
          id: baseName,
          frontFile: path.basename(frontFile),
          lotNumber: this.extractLotNumber(baseName),
          iteration: this.extractIteration(baseName),
          hasBack: false
        };
        
        if (backFile) {
          cardPair.backFile = path.basename(backFile);
          cardPair.hasBack = true;
          processed.add(backFile);
          validPairs.push(cardPair);
        } else {
          singleCards.push(cardPair);
        }
        
        processed.add(frontFile);
      }
    }
    
    return { validPairs, singleCards };
  }

  getBaseName(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    // Remove -front or -back suffix
    return fileName.replace(/-(?:front|back)$/, '');
  }

  findMatchingFile(files, baseName, suffix) {
    const pattern = new RegExp(`${this.escapeRegex(baseName)}-${suffix}\\.(jpg|jpeg|png|gif|bmp|webp)$`, 'i');
    return files.find(file => pattern.test(path.basename(file)));
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  extractLotNumber(baseName) {
    // Extract lot number from patterns like "box1a-00003" -> "box1a"
    const match = baseName.match(/^([^-]+)/);
    return match ? match[1] : 'unknown';
  }

  extractIteration(baseName) {
    // Extract iteration from patterns like "box1a-00003" -> "00003"
    const match = baseName.match(/-([^-]+)$/);
    return match ? match[1] : '001';
  }

  validateFilePath(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }
}

module.exports = new FileService();