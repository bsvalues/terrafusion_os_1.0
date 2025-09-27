/**
 * Natural Language Processing Service for TerraAgent AI
 */

import { NLPResult } from '../types/agent-types.js';

export class NLPProcessor {
  public async process(text: string): Promise<NLPResult> {
    // Simple NLP processing for now
    const intent = this.detectIntent(text);
    const entities = this.extractEntities(text);
    const sentiment = this.analyzeSentiment(text);

    return {
      intent,
      entities,
      sentiment,
      context: {
        topic: this.extractTopic(text),
        domain: 'real_estate',
        complexity: this.assessComplexity(text),
      },
    };
  }

  private detectIntent(text: string): { name: string; confidence: number; alternatives: any[] } {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('search') ||
      lowerText.includes('find') ||
      lowerText.includes('looking for')
    ) {
      return { name: 'property_search', confidence: 0.8, alternatives: [] };
    }
    if (
      lowerText.includes('analyze') ||
      lowerText.includes('analysis') ||
      lowerText.includes('value')
    ) {
      return { name: 'property_analysis', confidence: 0.8, alternatives: [] };
    }
    if (
      lowerText.includes('market') ||
      lowerText.includes('trends') ||
      lowerText.includes('prices')
    ) {
      return { name: 'market_analysis', confidence: 0.8, alternatives: [] };
    }
    if (
      lowerText.includes('invest') ||
      lowerText.includes('investment') ||
      lowerText.includes('roi')
    ) {
      return { name: 'investment_analysis', confidence: 0.8, alternatives: [] };
    }

    return { name: 'general_inquiry', confidence: 0.5, alternatives: [] };
  }

  private extractEntities(text: string): any[] {
    const entities: any[] = [];

    // Simple regex-based entity extraction
    const addressPattern =
      /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/gi;
    const pricePattern = /\$[\d,]+/g;
    const zipPattern = /\b\d{5}\b/g;

    const addresses = text.match(addressPattern) || [];
    addresses.forEach(address => {
      entities.push({
        type: 'address',
        value: address.trim(),
        confidence: 0.8,
        startIndex: text.indexOf(address),
        endIndex: text.indexOf(address) + address.length,
      });
    });

    const prices = text.match(pricePattern) || [];
    prices.forEach(price => {
      entities.push({
        type: 'price',
        value: price,
        confidence: 0.9,
        startIndex: text.indexOf(price),
        endIndex: text.indexOf(price) + price.length,
      });
    });

    const zips = text.match(zipPattern) || [];
    zips.forEach(zip => {
      entities.push({
        type: 'zipcode',
        value: zip,
        confidence: 0.9,
        startIndex: text.indexOf(zip),
        endIndex: text.indexOf(zip) + zip.length,
      });
    });

    return entities;
  }

  private analyzeSentiment(text: string): {
    polarity: number;
    subjectivity: number;
    emotion: string;
  } {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappointing'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    const polarity = positiveCount > negativeCount ? 0.5 : negativeCount > positiveCount ? -0.5 : 0;

    return {
      polarity,
      subjectivity: 0.5,
      emotion: polarity > 0 ? 'positive' : polarity < 0 ? 'negative' : 'neutral',
    };
  }

  private extractTopic(text: string): string {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('property') ||
      lowerText.includes('house') ||
      lowerText.includes('home')
    ) {
      return 'property';
    }
    if (lowerText.includes('market') || lowerText.includes('price')) {
      return 'market';
    }
    if (lowerText.includes('investment') || lowerText.includes('roi')) {
      return 'investment';
    }

    return 'general';
  }

  private assessComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const words = text.split(' ').length;
    const sentences = text.split(/[.!?]/).length;

    if (words < 10 && sentences <= 1) return 'simple';
    if (words < 50 && sentences <= 3) return 'moderate';
    return 'complex';
  }
}
