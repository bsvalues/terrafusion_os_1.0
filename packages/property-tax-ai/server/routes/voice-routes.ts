import express from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = 'gpt-4o';

const router = express.Router();

// Schema for transcription request
const transcriptionSchema = z.object({
  audio: z.string(),
});

// Schema for parameter extraction request
const extractParamsSchema = z.object({
  text: z.string(),
});

/**
 * Transcribe audio and extract search parameters
 */
router.post('/transcribe', async (req, res) => {
  try {
    // Validate request
    const validationResult = transcriptionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }
    
    const { audio } = validationResult.data;
    
    // Decode base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create a temporary file with the audio
    const tempFileName = 'temp-audio-' + Date.now() + '.webm';
    const tempFilePath = '/tmp/' + tempFileName;
    require('fs').writeFileSync(tempFilePath, audioBuffer);
    
    try {
      // Transcribe the audio using OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: require('fs').createReadStream(tempFilePath),
        model: 'whisper-1',
      });
      
      // Get the transcribed text
      const text = transcription.text;
      
      // Extract search parameters from the transcribed text
      const searchParams = await extractSearchParameters(text);
      
      res.json({
        text,
        searchParams,
      });
    } finally {
      // Clean up the temporary file
      try {
        if (require('fs').existsSync(tempFilePath)) {
          require('fs').unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

/**
 * Extract search parameters from text
 */
router.post('/extract-params', async (req, res) => {
  try {
    // Validate request
    const validationResult = extractParamsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }
    
    const { text } = validationResult.data;
    
    // Extract search parameters from the text
    const searchParams = await extractSearchParameters(text);
    
    res.json(searchParams);
  } catch (error) {
    console.error('Error extracting search parameters:', error);
    res.status(500).json({ error: 'Failed to extract search parameters' });
  }
});

/**
 * Extract structured search parameters from text using OpenAI
 */
async function extractSearchParameters(text: string) {
  try {
    const systemPrompt = `
    You are a helpful assistant that extracts structured search parameters from natural language queries about properties.
    Extract the following parameters (if present):
    - propertyId: Property identification number
    - address: Property address
    - parcelNumber: Parcel number
    - owner: Owner name
    - area: Geographic area or neighborhood
    - propertyType: Type of property (residential, commercial, farm, etc.)
    - minValue: Minimum property value (number only)
    - maxValue: Maximum property value (number only)
    - minAcres: Minimum property size in acres (number only)
    - maxAcres: Maximum property size in acres (number only)
    - dateRange: Date range for property records (object with start and end dates in YYYY-MM-DD format)
    
    Only include parameters that are explicitly mentioned in the query. Format numbers as numbers, not strings.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' }
    });

    // Extract and validate the response
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return {};
    }
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(responseContent);
    
    // Return the extracted parameters
    return parsedResponse;
  } catch (error) {
    console.error('Error extracting search parameters with OpenAI:', error);
    return {};
  }
}

export default router;