#!/usr/bin/env node

import * as ed from '@noble/ed25519';
import { promises as fs, createWriteStream, createReadStream } from 'fs';
import path from 'path';
import archiver from 'archiver';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

console.log('📦 TerraFusion Plugin Packager & Signer v3.0.0 (PEM Edition)');

// Parses a PKCS#8 PEM file to extract the raw 32-byte Ed25519 private key.
function parsePemPrivateKey(pem) {
  try {
    // 1. Strip PEM headers/footers and join lines.
    const pemBody = pem
      .split('\n')
      .filter(line => !line.startsWith('-----'))
      .join('');

    // 2. Decode from Base64 to get the DER-encoded data.
    const der = Buffer.from(pemBody, 'base64');

    // 3. The raw 32-byte private key in a PKCS#8 container for Ed25519
    // is the last 32 bytes of the structure.
    if (der.length < 32) {
      throw new Error('Invalid DER structure: key data is too short.');
    }

    // 4. Extract the raw private key.
    const privateKey = der.slice(der.length - 32);

    if (privateKey.length !== 32) {
      throw new Error(`Expected a 32-byte private key, but got ${privateKey.length} bytes.`);
    }

    console.log('✅ Successfully parsed PKCS#8 private key from PEM.');
    return privateKey;

  } catch (error) {
    console.error(`❌ Error parsing PEM private key: ${error.message}`);
    throw new Error('Failed to parse PEM. Ensure it is a valid PKCS#8 Ed25519 private key.');
  }
}

async function runSelfTest() {
  try {
    console.log('🔬 Running self-test...');
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKey(priv);
    const msg = new TextEncoder().encode('TerraFusion Self-Test');
    const sig = await ed.sign(msg, priv);
    const isValid = await ed.verify(sig, msg, pub);
    if (!isValid) throw new Error('Self-test signature validation failed.');
    console.log('✅ Self-test passed. Cryptography functions are working.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Self-test failed: ${error.message}`);
    process.exit(1);
  }
}

async function createPackage(sourceDir, outputDir, privateKeyPemPath) {
  try {
    // 0. Read and parse the private key PEM file
    const pemContent = await fs.readFile(privateKeyPemPath, 'utf-8');
    const privateKey = parsePemPrivateKey(pemContent); // TODO: Replace with real parsing logic

    // 1. Read manifest to get plugin id and version
    // 1. Read manifest to get plugin id and version
    const manifestPath = path.join(sourceDir, 'plugin.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    const { id: pluginId, version } = manifest;

    if (!pluginId || !version) {
      throw new Error('Manifest must contain a valid `id` and `version`.');
    }

    // 2. Create the .tfplugin archive
    const archiveName = `${pluginId}-${version}.tfplugin`;
    const archivePath = path.join(outputDir, archiveName);
    await fs.mkdir(outputDir, { recursive: true });

    const output = createWriteStream(archivePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Max compression
    });

    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', err => reject(err));
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    await archive.finalize();
    await archivePromise;

    console.log(`✅ Successfully created package: ${archivePath}`);

    // 3. Sign the package
    const packageBytes = await fs.readFile(archivePath);
    const signature = await ed.sign(packageBytes, privateKey);
    const signatureHex = Buffer.from(signature).toString('hex');

    // 4. Save the signature
    const signaturePath = `${archivePath}.sig`;
    await fs.writeFile(signaturePath, signatureHex);

    console.log(`✍️  Successfully signed package. Signature: ${signaturePath}`);

  } catch (error) {
    console.error(`❌ Error creating plugin package: ${error.message}`);
    process.exit(1);
  }
}

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --source <dir> --output <dir> --privateKeyPem <file>')
  .option('self-test', {
    describe: 'Run a quick cryptographic self-test and exit.',
    type: 'boolean',
  })
  .option('source', {
    alias: 's',
    describe: 'Plugin source directory (containing plugin.json)',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory for the signed package',
    type: 'string',
  })
  .option('privateKeyPem', {
    alias: 'p',
    describe: 'Path to the Ed25519 private key PEM file (PKCS#8)',
    type: 'string',
  })
  .help()
  .check((argv) => {
    if (argv.selfTest) return true; // If self-test, no other args needed
    if (argv.source && argv.output && argv.privateKeyPem) return true;
    throw new Error('Error: Missing required arguments for signing. Use --source, --output, and --privateKeyPem.');
  })
  .argv;

if (argv.selfTest) {
  runSelfTest();
} else {
  createPackage(argv.source, argv.output, argv.privateKeyPem);
}
