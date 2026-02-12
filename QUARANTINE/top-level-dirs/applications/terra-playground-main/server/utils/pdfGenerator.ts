import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface OnboardingData {
  countyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  implementationDate: string;
  features: string[];
  customizations: string[];
}

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;
  private outputPath: string;

  constructor(outputPath: string) {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Terrafusion County Onboarding Guide',
        Author: 'Terrafusion Team',
        Subject: 'County Implementation Guide',
        Keywords: 'Terrafusion, Onboarding, Implementation',
        CreationDate: new Date()
      }
    });
    this.outputPath = outputPath;
  }

  private addHeader() {
    this.doc
      .image(path.join(process.cwd(), 'public/assets/terrafusion-logo.svg'), 50, 45, { width: 100 })
      .fontSize(20)
      .text('Terrafusion County Onboarding Guide', 200, 57, { align: 'center' })
      .moveDown();
  }

  private addFooter() {
    const bottom = this.doc.page.height - 50;
    this.doc
      .fontSize(10)
      .text(
        '© 2024 Terrafusion. All rights reserved.',
        50,
        bottom,
        { align: 'center', width: 500 }
      );
  }

  private addSection(title: string, content: string[]) {
    this.doc
      .fontSize(16)
      .text(title, { underline: true })
      .moveDown(0.5);

    content.forEach(line => {
      this.doc
        .fontSize(12)
        .text(`• ${line}`)
        .moveDown(0.5);
    });

    this.doc.moveDown();
  }

  public async generateOnboardingPDF(data: OnboardingData): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(this.outputPath);

      this.doc.pipe(stream);

      this.addHeader();

      this.doc
        .fontSize(14)
        .text('County Information', { underline: true })
        .moveDown(0.5)
        .fontSize(12)
        .text(`County Name: ${data.countyName}`)
        .text(`Contact Name: ${data.contactName}`)
        .text(`Contact Email: ${data.contactEmail}`)
        .text(`Contact Phone: ${data.contactPhone}`)
        .text(`Implementation Date: ${data.implementationDate}`)
        .moveDown();

      this.addSection('Included Features', data.features);
      this.addSection('Customizations', data.customizations);

      this.addSection('Getting Started', [
        'Access your Terrafusion dashboard using the provided credentials',
        'Review the initial data import and configuration',
        'Schedule your first training session with our team',
        'Set up your first data pipeline and visualization'
      ]);

      this.addSection('Support and Resources', [
        '24/7 Technical Support: support@terrafusion.ai',
        'Documentation: docs.terrafusion.ai',
        'Training Portal: training.terrafusion.ai',
        'Community Forum: community.terrafusion.ai'
      ]);

      this.addFooter();

      this.doc.end();

      stream.on('finish', () => {
        resolve(this.outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
} 