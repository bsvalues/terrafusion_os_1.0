import { describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { DocumentType } from '../shared/document-types';

/**
 * Test suite for document classification functionality
 * 
 * These tests verify:
 * 1. The document classification endpoint works properly
 * 2. Different document types are correctly identified
 * 3. Classification confidence scores are correctly calculated
 */
describe('Document Classification Service', () => {
  const baseUrl = 'http://localhost:5000';
  
  test('POST /api/documents/classify should classify documents based on text content', async () => {
    // Sample document texts for different document types
    const sampleTexts = {
      [DocumentType.PLAT_MAP]: 'PLAT MAP OF BENTON COUNTY SUBDIVISION LOT 7 BLOCK 3 RECORDED DOCUMENT',
      [DocumentType.DEED]: 'WARRANTY DEED TRANSFER OF PROPERTY GRANTOR GRANTEE LEGAL DESCRIPTION',
      [DocumentType.SURVEY]: 'BOUNDARY SURVEY PREPARED BY LICENSED SURVEYOR COORDINATES BEARINGS DISTANCES',
      [DocumentType.LEGAL_DESCRIPTION]: 'LEGAL DESCRIPTION: THE EAST 50 FEET OF LOT 12, BLOCK 7, VISTA HEIGHTS ADDITION',
      [DocumentType.BOUNDARY_LINE_ADJUSTMENT]: 'BOUNDARY LINE ADJUSTMENT APPLICATION ADJACENT PARCELS REVISED LEGAL DESCRIPTION',
      [DocumentType.TAX_FORM]: 'PROPERTY TAX STATEMENT ASSESSED VALUE TAX YEAR PARCEL ID'
    };
    
    for (const [expectedType, text] of Object.entries(sampleTexts)) {
      const response = await fetch(`${baseUrl}/api/documents/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      expect(response.status).toBe(200);
      const classification = await response.json() as any;
      
      // Verify the response structure
      expect(classification).toHaveProperty('documentType');
      expect(classification).toHaveProperty('confidence');
      expect(classification).toHaveProperty('classifiedAt');
      expect(classification).toHaveProperty('documentTypeLabel');
      
      // Check that the document type is as expected
      expect(classification.documentType).toBe(expectedType);
      
      // Check that confidence is a number between 0 and 1
      expect(typeof classification.confidence).toBe('number');
      expect(classification.confidence).toBeGreaterThan(0);
      expect(classification.confidence).toBeLessThanOrEqual(1);
      
      // Check that timestamp is valid
      expect(new Date(classification.classifiedAt).toString()).not.toBe('Invalid Date');
    }
  });
  
  test('POST /api/documents/classify should handle documents that cannot be clearly classified', async () => {
    // Text that doesn't strongly match any document type
    const ambiguousText = 'This document contains generic text that does not clearly indicate the document type.';
    
    const response = await fetch(`${baseUrl}/api/documents/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: ambiguousText })
    });
    
    expect(response.status).toBe(200);
    const classification = await response.json() as any;
    
    // Even with ambiguous text, we should get a valid response
    expect(classification).toHaveProperty('documentType');
    expect(classification).toHaveProperty('confidence');
    
    // For ambiguous documents, confidence should be lower
    expect(classification.confidence).toBeLessThan(0.8);
  });
  
  test('POST /api/documents/classify should reject empty or invalid input', async () => {
    // Test with empty text
    const emptyResponse = await fetch(`${baseUrl}/api/documents/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: '' })
    });
    
    expect(emptyResponse.status).toBe(400);
    
    // Test with missing text field
    const missingResponse = await fetch(`${baseUrl}/api/documents/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    expect(missingResponse.status).toBe(400);
    
    // Test with non-string text
    const invalidResponse = await fetch(`${baseUrl}/api/documents/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: 123 })
    });
    
    expect(invalidResponse.status).toBe(400);
  });
});