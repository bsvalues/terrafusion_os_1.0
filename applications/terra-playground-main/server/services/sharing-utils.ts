/**
 * Sharing Utilities Service
 *
 * This service provides utilities for sharing property insights including:
 * - QR code generation
 * - PDF export preparation
 * - Frontend-facing URL generation
 */

import QRCode from 'qrcode';
import { PropertyInsightShare } from '@shared/schema';

/**
 * Interface for QR code generation options
 */
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

/**
 * Interface for PDF export options
 */
export interface PDFExportOptions {
  title?: string;
  author?: string;
  includeImages?: boolean;
  includeMetadata?: boolean;
}

/**
 * Sharing Utilities Service
 */
export class SharingUtilsService {
  private baseUrl: string;

  /**
   * Constructor for SharingUtilsService
   * @param baseUrl - The base URL for generating share links (e.g., 'http://localhost:5000')
   */
  constructor(baseUrl: string = '') {
    // Default to environment variable if available, or use provided baseUrl or empty string
    this.baseUrl = process.env.BASE_URL || baseUrl || '';
  }

  /**
   * Generate a shareable URL for a property insight
   *
   * @param shareId The unique share ID
   * @returns The full shareable URL
   */
  generateShareableUrl(shareId: string): string {
    return `${this.baseUrl}/share/${shareId}`;
  }

  /**
   * Generate a QR code for a property insight share
   *
   * @param shareId The unique share ID
   * @param options QR code generation options
   * @returns A Promise that resolves to the QR code data URL
   */
  async generateQRCode(shareId: string, options: QRCodeOptions = {}): Promise<string> {
    const url = this.generateShareableUrl(shareId);

    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: options.color || {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    try {
      // Generate QR code as data URL
      return await QRCode.toDataURL(url, qrOptions);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Prepare PDF export data for the frontend
   *
   * Note: Actual PDF generation happens on the client-side using jsPDF
   * This method prepares the necessary data structure to send to the frontend
   *
   * @param share The property insight share object
   * @param options PDF export options
   * @returns PDF export data structure
   */
  preparePDFExportData(share: PropertyInsightShare, options: PDFExportOptions = {}): any {
    // Format date for display
    const formatDate = (date: string | Date | null): string => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Create a data structure for the frontend to use with jsPDF
    return {
      title: options.title || share.title || 'Property Insight',
      author: options.author || "Benton County Assessor's Office",
      metadata: {
        createdAt: formatDate(share.createdAt),
        expiresAt: share.expiresAt ? formatDate(share.expiresAt) : 'Never',
        propertyId: share.propertyId,
        insightType: share.insightType,
        format: share.format,
        accessCount: share.accessCount,
      },
      content: share.insightData, // Using insightData instead of content
      shareUrl: this.generateShareableUrl(share.shareId),
      includeMetadata: options.includeMetadata !== false,
      qrCodePromise:
        options.includeImages !== false
          ? this.generateQRCode(share.shareId)
          : Promise.resolve(null),
    };
  }
}

// Create default instance with environment variable or empty base URL
export const sharingUtils = new SharingUtilsService();
