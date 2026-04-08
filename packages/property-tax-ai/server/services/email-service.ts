/**
 * Email Service
 * 
 * This service handles sending emails using Nodemailer.
 */

import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Create a test SMTP account for development purposes
 * This is exposed as a utility function that can be called directly
 * for testing and debugging email functionality
 */
export async function createTestEmailAccount(): Promise<{
  user: string;
  pass: string;
  smtp: { host: string; port: number; secure: boolean };
  previewUrl: string | null;
}> {
  try {
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    // Log information about the test account
    console.log('Created test email account:');
    console.log('User:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Host:', 'smtp.ethereal.email');
    
    // Create a transport with the generated credentials and send a test email
    const testTransport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // Send a test email
    const info = await testTransport.sendMail({
      from: '"Property Intelligence Platform" <test@example.com>',
      to: 'test-recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email from the Property Intelligence Platform',
      html: '<b>This is a test email from the Property Intelligence Platform</b>',
    });
    
    const msgUrl = nodemailer.getTestMessageUrl(info);
    const previewUrl = typeof msgUrl === 'string' ? msgUrl : null;
    console.log('Test email sent. Preview URL:', previewUrl || 'No preview URL available');
    
    return {
      user: testAccount.user,
      pass: testAccount.pass,
      smtp: {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
      },
      previewUrl,
    };
  } catch (error) {
    console.error('Failed to create test email account:', error);
    throw error;
  }
}

// Initialize transporter
async function initializeTransporter() {
  // If we already have a transporter, return it
  if (transporter) return transporter;

  // Create a test account if in development/test mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('Creating test email account for development environment');
    
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      // Create a transport with the generated credentials
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      // Output that we're using a test account
      console.log('Using Ethereal Email test account for email delivery');
      console.log('Test account username:', testAccount.user);
      console.log('Emails will not be delivered to real recipients, but can be viewed online.');
    } catch (err) {
      console.error('Failed to create test account. Falling back to dummy transport:', err);
      
      // If we fail to create a test account, create a dummy transport that logs emails
      transporter = {
        sendMail: (mailOptions: nodemailer.SendMailOptions) => {
          console.log('EMAIL WOULD BE SENT', mailOptions);
          return Promise.resolve({ 
            messageId: 'dummy-message-id',
            envelope: { from: mailOptions.from as string, to: mailOptions.to as string },
            accepted: [mailOptions.to as string]
          });
        }
      } as nodemailer.Transporter;
    }
  } else {
    // For production, use a real SMTP service
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '25', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }
  
  return transporter;
}

// Check if email service is configured
export async function isEmailServiceConfigured(): Promise<boolean> {
  try {
    return !!(await initializeTransporter());
  } catch (error) {
    console.error('Error initializing email transporter:', error);
    return false;
  }
}

// Email interface
export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = await initializeTransporter();
    if (!transport) {
      console.warn('Email transporter not initialized');
      return false;
    }

    const info = await transport.sendMail({
      from: options.from || process.env.EMAIL_FROM || 'noreply@property-intelligence.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br />')
    });
    
    // If we're using Ethereal email (test/dev environment), log the preview URL
    if (process.env.NODE_ENV !== 'production' && info.messageId) {
      const msgUrl = nodemailer.getTestMessageUrl(info);
      const previewUrl = typeof msgUrl === 'string' ? msgUrl : null;
      console.log('Email sent (preview):', previewUrl || 'No preview URL available');
      console.log('--------------------');
      console.log('Email Details:');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Preview URL:', previewUrl || 'Not available');
      console.log('--------------------');
    } else {
      console.log('Email sent:', info.messageId);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a property insight share email
 */
export async function sendPropertyInsightShareEmail(
  recipient: string,
  subject: string,
  message: string,
  shareUrl: string,
  propertyId: string,
  propertyName?: string,
  propertyAddress?: string
): Promise<boolean> {
  // Create HTML version with nicer formatting
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Property Insight Share</h2>
      <p>${message.replace(/\n/g, '<br />')}</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
        <p style="margin: 5px 0;"><strong>Property ID:</strong> ${propertyId}</p>
        ${propertyName ? `<p style="margin: 5px 0;"><strong>Property Name:</strong> ${propertyName}</p>` : ''}
        ${propertyAddress ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${propertyAddress}</p>` : ''}
      </div>
      
      <p>
        <a href="${shareUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4a5568; color: white; text-decoration: none; border-radius: 5px;">
          View Property Insight
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
        This is an automated message from the Benton County Assessor's Office Property Intelligence Platform.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipient,
    from: process.env.EMAIL_FROM || 'noreply@property-intelligence.com',
    subject,
    text: message,
    html: htmlContent
  });
}