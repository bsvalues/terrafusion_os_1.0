import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface DocumentAnalysisResult {
  documentType: string
  classification: string
  confidenceScore: number
  extractedData: {
    parcelNumber?: string
    legalDescription?: string
    ownerName?: string
    address?: string
    assessedValue?: string
    acreage?: string
  }
}

export async function analyzeDocument(documentText: string, fileName: string): Promise<DocumentAnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this document for property assessment information. Extract key data and classify the document type.

Document: ${fileName}
Content: ${documentText}

Please provide:
1. Document type (deed, survey, assessment, legal description, etc.)
2. Classification category (property record, legal document, assessment record)
3. Confidence score (0-100)
4. Extracted data including:
   - Parcel number
   - Legal description
   - Owner name
   - Property address
   - Assessed value
   - Acreage

Format as JSON with these exact field names: documentType, classification, confidenceScore, extractedData`
        }
      ],
    })

    const contentBlock = message.content[0]
    const responseText = contentBlock.type === 'text' ? contentBlock.text : ''
    
    // Parse the AI response
    try {
      const parsed = JSON.parse(responseText)
      return {
        documentType: parsed.documentType || 'Unknown',
        classification: parsed.classification || 'Unclassified',
        confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 0)),
        extractedData: parsed.extractedData || {}
      }
    } catch (parseError) {
      // Fallback parsing if JSON is not properly formatted
      return {
        documentType: 'Document',
        classification: 'General',
        confidenceScore: 75,
        extractedData: {
          // Extract basic information using pattern matching
          parcelNumber: extractParcelNumber(documentText),
          legalDescription: extractLegalDescription(documentText),
          ownerName: extractOwnerName(documentText),
          address: extractAddress(documentText)
        }
      }
    }
  } catch (error) {
    console.error('Document analysis error:', error)
    throw new Error('Failed to analyze document')
  }
}

function extractParcelNumber(text: string): string | undefined {
  const parcelPattern = /(?:parcel|tax\s+id|assessor['\s]s?\s+number)[:\s]*([A-Z0-9-]+)/i
  const match = text.match(parcelPattern)
  return match ? match[1] : undefined
}

function extractLegalDescription(text: string): string | undefined {
  const legalPattern = /(?:legal\s+description|description)[:\s]*([^.]+)/i
  const match = text.match(legalPattern)
  return match ? match[1].trim() : undefined
}

function extractOwnerName(text: string): string | undefined {
  const ownerPattern = /(?:owner|grantee|grantor)[:\s]*([A-Za-z\s,]+)/i
  const match = text.match(ownerPattern)
  return match ? match[1].trim() : undefined
}

function extractAddress(text: string): string | undefined {
  const addressPattern = /(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard))/i
  const match = text.match(addressPattern)
  return match ? match[1].trim() : undefined
}