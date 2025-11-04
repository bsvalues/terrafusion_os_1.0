// ES module script to test FTP functionality with TLS disabled
import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FTP connection configuration
const ftpConfig = {
  host: 'ftp.spatialest.com',
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  secure: false, // Try without TLS
  port: 21,
};

// Create a sample CSV file for testing
function createSampleCSV() {
  const tempDir = path.join(__dirname, '../uploads/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const samplePath = path.join(tempDir, 'sample-properties.csv');
  const csvContent = `propertyId,address,parcelNumber,propertyType,status,acres,value
BC001,123 Test St,12345-123-123,residential,active,0.25,150000
BC002,456 Sample Ave,12345-123-124,commercial,active,1.5,750000
BC003,789 Demo Blvd,12345-123-125,residential,pending,0.33,225000`;

  fs.writeFileSync(samplePath, csvContent);
  return samplePath;
}

async function testFtpConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('Testing FTP connection with TLS disabled...');
    console.log(
      `Using credentials: ${ftpConfig.user} / ${ftpConfig.password ? '[password provided]' : '[no password]'}`
    );

    await client.access(ftpConfig);
    console.log('FTP connection successful!');

    // List files in root directory
    console.log('\nListing files in root directory:');
    const files = await client.list();
    files.forEach(file => {
      console.log(
        `- ${file.name} (${file.type === 1 ? 'File' : 'Directory'}, Size: ${file.size} bytes)`
      );
    });

    // Upload test file
    console.log('\nUploading test file...');
    const localFile = createSampleCSV();
    const remoteFile = '/test-upload.csv';

    await client.uploadFrom(localFile, remoteFile);
    console.log(`Successfully uploaded ${localFile} to ${remoteFile}`);

    // Download the file
    console.log('\nDownloading test file...');
    const downloadPath = path.join(__dirname, '../uploads/temp/downloaded-test.csv');
    await client.downloadTo(downloadPath, remoteFile);
    console.log(`Successfully downloaded to ${downloadPath}`);

    // Verify content
    const fileContent = fs.readFileSync(downloadPath, 'utf8');
    console.log('Downloaded file content:');
    console.log(fileContent);

    // Clean up
    console.log('\nCleaning up test files...');
    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }

    console.log('FTP test completed successfully!');
  } catch (error) {
    console.error('FTP Test Error:', error);
  } finally {
    client.close();
  }
}

testFtpConnection().catch(console.error);
