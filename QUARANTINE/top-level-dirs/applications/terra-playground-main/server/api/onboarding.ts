import { NextApiRequest, NextApiResponse } from 'next';
import { PDFGenerator } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      countyName,
      contactName,
      contactEmail,
      contactPhone,
      implementationDate,
      features,
      customizations
    } = req.body;

    const outputDir = path.join(process.cwd(), 'public', 'onboarding');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${countyName.toLowerCase().replace(/\s+/g, '-')}-onboarding.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const pdfGenerator = new PDFGenerator(outputPath);
    await pdfGenerator.generateOnboardingPDF({
      countyName,
      contactName,
      contactEmail,
      contactPhone,
      implementationDate,
      features,
      customizations
    });

    res.status(200).json({
      success: true,
      pdfUrl: `/onboarding/${fileName}`
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 