import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const copyFile = promisify(fs.copyFile);

export interface ImageProcessingResult {
  success: boolean;
  imagePath?: string;
  base64Data?: string;
  error?: string;
}

export class ImageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'cards');
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await access(this.uploadsDir);
      console.log('Uploads directory exists:', this.uploadsDir);
    } catch (error) {
      try {
        await mkdir(this.uploadsDir, { recursive: true });
        console.log('Created uploads directory:', this.uploadsDir);
      } catch (mkdirError) {
        console.error('Failed to create uploads directory:', mkdirError);
        throw new Error(`Failed to create uploads directory: ${mkdirError.message}`);
      }
    }
  }

  /**
   * Process a local image file by copying it to uploads directory
   */
  async processLocalImage(localImagePath: string): Promise<ImageProcessingResult> {
    try {
      console.log('Processing local image:', localImagePath);

      // Check if local file exists
      try {
        await access(localImagePath);
      } catch (error) {
        console.error('Local image file not found:', localImagePath, error);
        return {
          success: false,
          error: `Local image file not found: ${localImagePath}`
        };
      }

      // Generate unique filename
      const originalName = path.basename(localImagePath);
      const timestamp = Date.now();
      const uniqueName = `${timestamp}_${originalName}`;
      const destinationPath = path.join(this.uploadsDir, uniqueName);

      // Copy file to uploads directory
      try {
        await copyFile(localImagePath, destinationPath);
        console.log('Image copied successfully from', localImagePath, 'to', destinationPath);

        const relativePath = `/uploads/cards/${uniqueName}`;
        return {
          success: true,
          imagePath: relativePath
        };
      } catch (copyError) {
        console.error('Failed to copy image file:', copyError);
        return {
          success: false,
          error: `Failed to copy image file: ${copyError.message}`
        };
      }
    } catch (error) {
      console.error('Error processing local image:', error);
      return {
        success: false,
        error: `Error processing local image: ${error.message}`
      };
    }
  }

  /**
   * Convert local image file to base64 data
   */
  async convertToBase64(localImagePath: string): Promise<ImageProcessingResult> {
    try {
      console.log('Converting image to base64:', localImagePath);

      // Check if local file exists
      try {
        await access(localImagePath);
      } catch (error) {
        console.error('Local image file not found:', localImagePath, error);
        return {
          success: false,
          error: `Local image file not found: ${localImagePath}`
        };
      }

      // Read file and convert to base64
      try {
        const fileBuffer = await readFile(localImagePath);
        const fileExtension = path.extname(localImagePath).toLowerCase();
        
        let mimeType = 'image/jpeg';
        if (fileExtension === '.png') {
          mimeType = 'image/png';
        } else if (fileExtension === '.gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === '.webp') {
          mimeType = 'image/webp';
        }

        const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        console.log('Image converted to base64 successfully, size:', fileBuffer.length, 'bytes');

        return {
          success: true,
          base64Data: base64Data
        };
      } catch (readError) {
        console.error('Failed to read image file:', readError);
        return {
          success: false,
          error: `Failed to read image file: ${readError.message}`
        };
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return {
        success: false,
        error: `Error converting image to base64: ${error.message}`
      };
    }
  }

  /**
   * Check if an image file exists at the given path
   */
  async imageExists(imagePath: string): Promise<boolean> {
    try {
      // Handle both absolute paths and relative paths
      let fullPath = imagePath;
      if (imagePath.startsWith('/uploads/cards/')) {
        fullPath = path.join(process.cwd(), imagePath.substring(1));
      }

      await access(fullPath);
      return true;
    } catch (error) {
      console.log('Image does not exist:', imagePath);
      return false;
    }
  }

  /**
   * Get image data, handling missing files gracefully
   */
  async getImageData(imagePath: string): Promise<{ exists: boolean; path?: string; base64?: string }> {
    try {
      const exists = await this.imageExists(imagePath);
      
      if (!exists) {
        console.log('Image file missing:', imagePath);
        return { exists: false };
      }

      return {
        exists: true,
        path: imagePath
      };
    } catch (error) {
      console.error('Error getting image data:', error);
      return { exists: false };
    }
  }

  /**
   * Scan a directory for image files
   */
  async scanDirectoryForImages(directoryPath: string): Promise<string[]> {
    try {
      console.log('Scanning directory for images:', directoryPath);

      // Check if directory exists
      try {
        await access(directoryPath);
      } catch (error) {
        console.error('Directory not found:', directoryPath, error);
        throw new Error(`Directory not found: ${directoryPath}`);
      }

      // Read directory contents
      const files = await promisify(fs.readdir)(directoryPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const imageFiles = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(file => path.join(directoryPath, file));

      console.log(`Found ${imageFiles.length} image files in directory:`, directoryPath);
      return imageFiles;
    } catch (error) {
      console.error('Error scanning directory for images:', error);
      throw new Error(`Error scanning directory for images: ${error.message}`);
    }
  }

  /**
   * Process multiple local images
   */
  async processMultipleImages(localImagePaths: string[]): Promise<ImageProcessingResult[]> {
    console.log('Processing multiple images:', localImagePaths.length, 'files');
    
    const results: ImageProcessingResult[] = [];
    
    for (const imagePath of localImagePaths) {
      try {
        const result = await this.processLocalImage(imagePath);
        results.push(result);
      } catch (error) {
        console.error('Error processing image:', imagePath, error);
        results.push({
          success: false,
          error: `Error processing ${imagePath}: ${error.message}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Processed ${successCount}/${localImagePaths.length} images successfully`);
    
    return results;
  }

  /**
   * Clean up orphaned image files
   */
  async cleanupOrphanedImages(activeImagePaths: string[]): Promise<void> {
    try {
      console.log('Cleaning up orphaned images...');
      
      const uploadedFiles = await promisify(fs.readdir)(this.uploadsDir);
      const activeFiles = activeImagePaths
        .filter(path => path.startsWith('/uploads/cards/'))
        .map(path => path.replace('/uploads/cards/', ''));

      const orphanedFiles = uploadedFiles.filter(file => !activeFiles.includes(file));
      
      for (const orphanedFile of orphanedFiles) {
        try {
          const filePath = path.join(this.uploadsDir, orphanedFile);
          await promisify(fs.unlink)(filePath);
          console.log('Deleted orphaned image:', orphanedFile);
        } catch (error) {
          console.error('Failed to delete orphaned image:', orphanedFile, error);
        }
      }

      console.log(`Cleanup completed. Removed ${orphanedFiles.length} orphaned images`);
    } catch (error) {
      console.error('Error during image cleanup:', error);
      throw new Error(`Error during image cleanup: ${error.message}`);
    }
  }
}

export const imageService = new ImageService();