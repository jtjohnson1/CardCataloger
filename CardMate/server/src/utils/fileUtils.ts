import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

export interface ImageFile {
  filename: string;
  path: string;
  size: number;
  extension: string;
}

export class FileUtils {
  private static readonly SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  private static readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'cards');

  /**
   * Ensures the uploads directory exists
   */
  static async ensureUploadsDirectory(): Promise<void> {
    try {
      console.log('Ensuring uploads directory exists:', this.UPLOADS_DIR);
      await mkdir(this.UPLOADS_DIR, { recursive: true });
      console.log('Uploads directory ready');
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      throw new Error(`Failed to create uploads directory: ${error.message}`);
    }
  }

  /**
   * Checks if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a path is a directory
   */
  static async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      console.error('Error checking if path is directory:', error);
      return false;
    }
  }

  /**
   * Scans a directory for image files
   */
  static async scanDirectoryForImages(directoryPath: string): Promise<ImageFile[]> {
    try {
      console.log('Scanning directory for images:', directoryPath);
      
      if (!await this.fileExists(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`);
      }

      if (!await this.isDirectory(directoryPath)) {
        throw new Error(`Path is not a directory: ${directoryPath}`);
      }

      const files = await readdir(directoryPath);
      const imageFiles: ImageFile[] = [];

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        
        try {
          const stats = await stat(filePath);
          
          if (stats.isFile()) {
            const extension = path.extname(file).toLowerCase();
            
            if (this.SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
              imageFiles.push({
                filename: file,
                path: filePath,
                size: stats.size,
                extension: extension
              });
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          // Continue processing other files
        }
      }

      console.log(`Found ${imageFiles.length} image files in directory`);
      return imageFiles;
    } catch (error) {
      console.error('Error scanning directory for images:', error);
      throw new Error(`Failed to scan directory: ${error.message}`);
    }
  }

  /**
   * Copies a local image file to the uploads directory
   */
  static async copyImageToUploads(sourcePath: string, filename?: string): Promise<string> {
    try {
      console.log('Copying image to uploads:', sourcePath);
      
      if (!await this.fileExists(sourcePath)) {
        throw new Error(`Source file does not exist: ${sourcePath}`);
      }

      await this.ensureUploadsDirectory();

      const originalFilename = filename || path.basename(sourcePath);
      const timestamp = Date.now();
      const extension = path.extname(originalFilename);
      const baseName = path.basename(originalFilename, extension);
      const uniqueFilename = `${baseName}_${timestamp}${extension}`;
      
      const destinationPath = path.join(this.UPLOADS_DIR, uniqueFilename);

      const fileData = await readFile(sourcePath);
      await writeFile(destinationPath, fileData);

      console.log('Image copied successfully to:', destinationPath);
      return uniqueFilename;
    } catch (error) {
      console.error('Error copying image to uploads:', error);
      throw new Error(`Failed to copy image: ${error.message}`);
    }
  }

  /**
   * Converts an image file to base64 data URL
   */
  static async imageToBase64(imagePath: string): Promise<string> {
    try {
      console.log('Converting image to base64:', imagePath);
      
      if (!await this.fileExists(imagePath)) {
        throw new Error(`Image file does not exist: ${imagePath}`);
      }

      const fileData = await readFile(imagePath);
      const extension = path.extname(imagePath).toLowerCase();
      
      let mimeType = 'image/jpeg';
      switch (extension) {
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.bmp':
          mimeType = 'image/bmp';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        default:
          mimeType = 'image/jpeg';
      }

      const base64Data = fileData.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      console.log('Image converted to base64 successfully');
      return dataUrl;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  /**
   * Gets the file size in a human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Groups image files into pairs (front/back) based on naming conventions
   */
  static groupImagePairs(imageFiles: ImageFile[]): Array<{ front: ImageFile; back?: ImageFile }> {
    try {
      console.log('Grouping images into pairs');
      
      const pairs: Array<{ front: ImageFile; back?: ImageFile }> = [];
      const processed = new Set<string>();

      for (const file of imageFiles) {
        if (processed.has(file.filename)) {
          continue;
        }

        const baseName = path.basename(file.filename, file.extension);
        
        // Look for common naming patterns for card pairs
        const frontPatterns = ['_front', '_f', '-front', '-f'];
        const backPatterns = ['_back', '_b', '-back', '-b'];
        
        let isFront = false;
        let isBack = false;
        let baseNameWithoutSuffix = baseName;

        // Check if this is a front image
        for (const pattern of frontPatterns) {
          if (baseName.toLowerCase().endsWith(pattern)) {
            isFront = true;
            baseNameWithoutSuffix = baseName.substring(0, baseName.length - pattern.length);
            break;
          }
        }

        // Check if this is a back image
        if (!isFront) {
          for (const pattern of backPatterns) {
            if (baseName.toLowerCase().endsWith(pattern)) {
              isBack = true;
              baseNameWithoutSuffix = baseName.substring(0, baseName.length - pattern.length);
              break;
            }
          }
        }

        if (isFront) {
          // This is a front image, look for corresponding back
          const backFile = imageFiles.find(f => {
            const backBaseName = path.basename(f.filename, f.extension);
            return backPatterns.some(pattern => 
              backBaseName.toLowerCase() === (baseNameWithoutSuffix + pattern).toLowerCase()
            );
          });

          pairs.push({ front: file, back: backFile });
          processed.add(file.filename);
          if (backFile) {
            processed.add(backFile.filename);
          }
        } else if (!isBack) {
          // This is neither front nor back, treat as standalone front
          pairs.push({ front: file });
          processed.add(file.filename);
        }
        // If it's a back image without a front, it will be skipped
      }

      console.log(`Grouped ${imageFiles.length} images into ${pairs.length} pairs`);
      return pairs;
    } catch (error) {
      console.error('Error grouping image pairs:', error);
      throw new Error(`Failed to group image pairs: ${error.message}`);
    }
  }

  /**
   * Validates if a file is a supported image format
   */
  static isValidImageFile(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return this.SUPPORTED_IMAGE_EXTENSIONS.includes(extension);
  }

  /**
   * Gets the uploads directory path
   */
  static getUploadsDirectory(): string {
    return this.UPLOADS_DIR;
  }

  /**
   * Gets the full path to an uploaded file
   */
  static getUploadedFilePath(filename: string): string {
    return path.join(this.UPLOADS_DIR, filename);
  }

  /**
   * Cleans up old uploaded files (optional utility)
   */
  static async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      console.log(`Cleaning up files older than ${maxAgeHours} hours`);
      
      if (!await this.fileExists(this.UPLOADS_DIR)) {
        console.log('Uploads directory does not exist, nothing to clean');
        return;
      }

      const files = await readdir(this.UPLOADS_DIR);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.UPLOADS_DIR, file);
        
        try {
          const stats = await stat(filePath);
          const age = now - stats.mtime.getTime();
          
          if (age > maxAge) {
            await fs.promises.unlink(filePath);
            cleanedCount++;
            console.log(`Deleted old file: ${file}`);
          }
        } catch (error) {
          console.error(`Error processing file ${file} for cleanup:`, error);
        }
      }

      console.log(`Cleanup completed. Deleted ${cleanedCount} old files`);
    } catch (error) {
      console.error('Error during file cleanup:', error);
      throw new Error(`Failed to cleanup old files: ${error.message}`);
    }
  }
}