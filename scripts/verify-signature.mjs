import fs from 'fs/promises';
import path from 'path';
import CryptoGuardian from '../security/CryptoGuardian.js';

async function main() {
    const [packagePath, signatureHex, publicKeyPemPath, authorId] = process.argv.slice(2);

    if (!packagePath || !signatureHex || !publicKeyPemPath || !authorId) {
        console.error('Usage: node verify-signature.mjs <package-path> <signature-hex> <public-key-pem-path> <author-id>');
        process.exit(1);
    }

    try {
        const packageData = await fs.readFile(packagePath);
        const publicKeyPem = await fs.readFile(publicKeyPemPath, 'utf8');
        
        // CryptoGuardian expects a base64 signature, so we convert from hex.
        const signatureBase64 = Buffer.from(signatureHex, 'hex').toString('base64');

        const guardian = new CryptoGuardian();
        const result = await guardian.validateSignature(packageData, signatureBase64, publicKeyPem, authorId);

        if (result.success) {
            console.log('✅ Signature verified successfully.');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        } else {
            console.error('❌ Signature verification failed.');
            console.error(JSON.stringify(result, null, 2));
            process.exit(1);
        }
    } catch (error) {
        console.error('An unexpected error occurred during signature verification:', error);
        process.exit(1);
    }
}

main();
