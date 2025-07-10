import { promises as fs } from 'fs';
import * as path from 'path';
import { logger } from '@elizaos/core';

export interface ImageServingOptions {
  useBase64?: boolean;
  serverUrl?: string;
  cloudProvider?: 'none' | 'imgur' | 'cloudinary' | 'github';
  maxFileSizeForBase64?: number; // in bytes, default 1MB
}

export interface ServedImage {
  url: string;
  type: 'base64' | 'static' | 'cloud';
  filename: string;
  relativePath: string;
}

export class ImageServingService {
  private options: ImageServingOptions;

  constructor(options: ImageServingOptions = {}) {
    this.options = {
      useBase64: true, // Prefer static URLs to avoid CSP issues
      serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
      cloudProvider: 'none',
      maxFileSizeForBase64: 1024 * 1024, // 1MB
      ...options,
    };
  }

  async serveImage(imagePath: string, timestamp?: number): Promise<ServedImage> {
    const filename = path.basename(imagePath);
    const relativePath = path.relative(process.cwd(), imagePath);
    
    // Check file size for base64 decision
    const stats = await fs.stat(imagePath);
    const useBase64 = this.options.useBase64 && stats.size <= this.options.maxFileSizeForBase64!;

    if (useBase64) {
      const dataUrl = await this.convertToBase64(imagePath);
      if (dataUrl) {
        return {
          url: dataUrl,
          type: 'base64',
          filename,
          relativePath,
        };
      }
    }

    // Fallback to static server URL
    const staticUrl = this.generateStaticUrl(imagePath, timestamp);
    return {
      url: staticUrl,
      type: 'static',
      filename,
      relativePath,
    };
  }

  private async convertToBase64(imagePath: string): Promise<string | null> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 
                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                     ext === '.gif' ? 'image/gif' : 'image/png';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      logger.error('Error converting image to base64:', error);
      return null;
    }
  }

  private generateStaticUrl(imagePath: string, timestamp?: number): string {
    const filename = path.basename(imagePath);
    if (timestamp) {
      return `${this.options.serverUrl}/charts/visualization-${timestamp}/${filename}`;
    }
    
    // Try to extract timestamp from path
    const pathMatch = imagePath.match(/visualization-(\d+)/);
    const extractedTimestamp = pathMatch ? pathMatch[1] : 'unknown';
    return `${this.options.serverUrl}/charts/visualization-${extractedTimestamp}/${filename}`;
  }

  // Future: Add cloud upload methods
  async uploadToCloud(imagePath: string): Promise<string | null> {
    switch (this.options.cloudProvider) {
      case 'imgur':
        return this.uploadToImgur(imagePath);
      case 'github':
        return this.uploadToGitHub(imagePath);
      default:
        logger.warn('Cloud provider not implemented');
        return null;
    }
  }

  private async uploadToImgur(imagePath: string): Promise<string | null> {
    // Placeholder for Imgur API implementation
    // Would require IMGUR_CLIENT_ID environment variable
    logger.info('Imgur upload not yet implemented');
    return null;
  }

  private async uploadToGitHub(imagePath: string): Promise<string | null> {
    // Placeholder for GitHub API implementation  
    // Would require GITHUB_TOKEN environment variable
    logger.info('GitHub upload not yet implemented');
    return null;
  }

  // Utility method to create a simple static server
  static createSimpleServer(port: number = 3001): void {
    try {
      const express = require('express');
      const app = express();
      
      app.use('/charts', express.static(path.join(process.cwd(), 'data', 'charts')));
      app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));
      
      app.listen(port, () => {
        logger.info(`Simple image server running on http://localhost:${port}`);
      });
    } catch (error) {
      logger.error('Failed to create simple server:', error);
    }
  }
}

// Export singleton instance with default options
export const imageService = new ImageServingService(); 