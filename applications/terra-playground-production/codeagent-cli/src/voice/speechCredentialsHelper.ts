import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Speech Credentials Helper
 *
 * Helps with setting up and managing Google Cloud Speech credentials
 */
export class SpeechCredentialsHelper {
  private credentialsPath: string;

  constructor() {
    // Set credentials path
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.credentialsPath = path.join(homeDir, '.codeagent', 'credentials', 'google-speech.json');

    // Ensure credentials directory exists
    const credentialsDir = path.dirname(this.credentialsPath);
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
  }

  /**
   * Check if credentials are available
   */
  hasCredentials(): boolean {
    // Check if the credentials file exists
    return fs.existsSync(this.credentialsPath);
  }

  /**
   * Get the credentials file path
   */
  getCredentialsPath(): string {
    return this.credentialsPath;
  }

  /**
   * Set up Google Cloud Speech credentials
   */
  async setupCredentials(): Promise<boolean> {
    console.log(chalk.blue.bold('\n🔑 Google Cloud Speech Credentials Setup'));
    console.log(chalk.blue('─────────────────────────────────────\n'));

    console.log('Voice commands require Google Cloud Speech-to-Text API credentials.');
    console.log('You will need to create a service account on Google Cloud Platform');
    console.log('and download a JSON key file for authentication.\n');

    const instructions = [
      '1. Go to the Google Cloud Console (https://console.cloud.google.com/)',
      '2. Create a new project or select an existing one',
      '3. Enable the Speech-to-Text API for your project',
      '4. Go to "IAM & Admin" > "Service accounts"',
      '5. Create a new service account or select an existing one',
      '6. Add the "Speech-to-Text User" role to the service account',
      '7. Create a new JSON key for the service account',
      '8. Download the JSON key file',
    ];

    instructions.forEach(instruction => console.log(chalk.cyan(instruction)));
    console.log('');

    const { hasKey } = await inquirer.prompt({
      type: 'confirm',
      name: 'hasKey',
      message: 'Do you have a Google Cloud Speech service account key file?',
      default: false,
    });

    if (!hasKey) {
      console.log(
        chalk.yellow('Please follow the instructions above to get a key file before continuing.')
      );
      return false;
    }

    const { keyPath } = await inquirer.prompt({
      type: 'input',
      name: 'keyPath',
      message: 'Enter the path to your Google Cloud Speech service account key file:',
      validate: input => {
        if (!input.trim()) return 'Path is required';
        if (!fs.existsSync(input)) return 'File not found';
        return true;
      },
    });

    try {
      // Read the key file
      const keyData = fs.readFileSync(keyPath, 'utf8');

      // Validate that it's a proper JSON key file
      const keyJson = JSON.parse(keyData);
      if (!keyJson.type || !keyJson.project_id || !keyJson.private_key) {
        console.log(chalk.red('Invalid Google Cloud service account key file.'));
        return false;
      }

      // Save the key file to the credentials path
      fs.writeFileSync(this.credentialsPath, keyData);

      // Set the environment variable
      process.env.GOOGLE_APPLICATION_CREDENTIALS = this.credentialsPath;

      console.log(chalk.green('Google Cloud Speech credentials set up successfully!'));
      console.log(chalk.green(`Credentials saved to: ${this.credentialsPath}`));

      return true;
    } catch (error) {
      console.error(chalk.red(`Error setting up credentials: ${error.message}`));
      return false;
    }
  }

  /**
   * Set the environment variable for the credentials
   */
  setEnvironmentVariable(): void {
    if (this.hasCredentials()) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = this.credentialsPath;
    }
  }
}
