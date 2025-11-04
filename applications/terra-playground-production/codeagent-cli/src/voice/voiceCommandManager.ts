import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { VoiceCommandService } from './voiceCommandService.js';

/**
 * Voice Command Manager
 *
 * Manages voice commands and integrates with the CLI
 */
export class VoiceCommandManager {
  private voiceService: VoiceCommandService;
  private helpCommands: Map<string, string>;

  constructor() {
    this.voiceService = new VoiceCommandService();
    this.helpCommands = new Map();

    // Initialize help commands
    this.initializeHelpCommands();

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the help commands
   */
  private initializeHelpCommands(): void {
    this.helpCommands.set('help', 'Show available voice commands');
    this.helpCommands.set('list plugins', 'List all installed plugins');
    this.helpCommands.set('create plugin', 'Start the plugin creation wizard');
    this.helpCommands.set('install plugin {name}', 'Install a plugin');
    this.helpCommands.set('edit plugin {name}', 'Edit an existing plugin');
    this.helpCommands.set('edit settings for {plugin}', 'Edit settings for a plugin');
    this.helpCommands.set('ask {question}', 'Ask a question or give a command to the agent');
    this.helpCommands.set('stop listening', 'Stop voice recognition');
  }

  /**
   * Set up event handlers for the voice service
   */
  private setupEventHandlers(): void {
    // Handle command events
    this.voiceService.on('command', data => {
      if (data.action === 'showHelp') {
        this.showHelp();
      } else if (data.action === 'executeCommand') {
        this.executeCommand(data.parameters?.command || '');
      } else if (data.action === 'systemMessage') {
        console.log(chalk.cyan(`System: ${data.parameters?.message}`));
      }
    });

    // Handle transcription events
    this.voiceService.on('transcription', data => {
      console.log(chalk.gray(`Transcription: ${data.text}`));
    });

    // Handle result events
    this.voiceService.on('result', data => {
      if (data.isMatch) {
        if (data.action !== 'wake') {
          console.log(chalk.green(`Executing command: ${data.command}`));
        }
      }
    });

    // Handle no match events
    this.voiceService.on('nomatch', data => {
      console.log(chalk.yellow(`No matching command found for: "${data.input}"`));
    });

    // Handle wake events
    this.voiceService.on('wake', data => {
      console.log(chalk.blue(`Wake word detected: ${data.wakeWord}`));
      console.log(chalk.blue('Listening for command...'));
    });

    // Handle status events
    this.voiceService.on('status', data => {
      if (data.listening) {
        console.log(
          chalk.green(
            `Voice recognition ${data.keywordDetection ? 'started with keyword detection' : 'started'}`
          )
        );
      } else {
        console.log(chalk.yellow('Voice recognition stopped'));
      }
    });

    // Handle error events
    this.voiceService.on('error', data => {
      console.error(chalk.red(`Error: ${data.error.message}`));
    });
  }

  /**
   * Start the voice command service
   * @param withKeywordDetection Use keyword detection (wake word)
   * @param wakeWord Custom wake word
   * @param useRealRecording Whether to use real audio recording (if available)
   */
  async start(
    withKeywordDetection: boolean = false,
    wakeWord?: string,
    useRealRecording: boolean = false
  ): Promise<void> {
    // Check if Google Cloud Speech credentials are available
    const hasCredentials = await this.voiceService.checkCredentials();

    if (!hasCredentials) {
      console.log(chalk.yellow('Google Cloud Speech credentials not found.'));
      console.log(chalk.yellow('Voice commands will be simulated using text input.'));
      console.log(
        chalk.yellow(
          'For production use, set up credentials in the GOOGLE_APPLICATION_CREDENTIALS environment variable.'
        )
      );
      console.log('');

      // Force simulation mode if no credentials
      useRealRecording = false;
    } else if (useRealRecording) {
      console.log(chalk.green('Google Cloud Speech credentials found.'));
      console.log(chalk.green('Using real audio recording for voice commands.'));
      console.log('');
    }

    // Start listening for voice commands
    await this.voiceService.startListening(withKeywordDetection, wakeWord, useRealRecording);
  }

  /**
   * Stop the voice command service
   */
  stop(): void {
    this.voiceService.stopListening();
  }

  /**
   * Show help for available voice commands
   */
  showHelp(): void {
    console.log(chalk.blue.bold('\n📢 Available Voice Commands'));
    console.log(chalk.blue('─────────────────────────\n'));

    for (const [command, description] of this.helpCommands.entries()) {
      console.log(`${chalk.green(command)}: ${description}`);
    }

    console.log('');
  }

  /**
   * Execute a CLI command
   * @param command The command to execute
   */
  executeCommand(command: string): void {
    if (!command) return;

    try {
      // For demonstration purposes, we're just logging the command
      // In a real implementation, this would execute the command using the CLI
      console.log(chalk.cyan(`Executing: codeagent ${command}`));

      // For simple commands, we could use execSync
      // But for interactive commands, we would need to use a different approach
      // execSync(`codeagent ${command}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red(`Error executing command: ${error.message}`));
    }
  }

  /**
   * Set up custom voice commands
   */
  async setupCustomCommands(): Promise<void> {
    console.log(chalk.blue.bold('\n⚙️ Custom Voice Command Setup'));
    console.log(chalk.blue('──────────────────────────\n'));

    console.log(chalk.yellow('You can create custom voice commands that map to CLI commands.'));

    const { addCommand } = await inquirer.prompt({
      type: 'confirm',
      name: 'addCommand',
      message: 'Do you want to add a custom voice command?',
      default: true,
    });

    if (!addCommand) {
      return;
    }

    // Get command details
    const { voiceCommand, cliCommand } = await inquirer.prompt([
      {
        type: 'input',
        name: 'voiceCommand',
        message: 'Enter the voice command phrase:',
        validate: input => (input.trim() ? true : 'Voice command is required'),
      },
      {
        type: 'input',
        name: 'cliCommand',
        message: 'Enter the CLI command to execute:',
        validate: input => (input.trim() ? true : 'CLI command is required'),
      },
    ]);

    // Register the command
    this.voiceService.registerCommand(voiceCommand.toLowerCase(), () => {
      this.voiceService.emit('command', {
        command: voiceCommand,
        action: 'executeCommand',
        parameters: { command: cliCommand },
      });
    });

    // Add to help commands
    this.helpCommands.set(voiceCommand, `Execute: codeagent ${cliCommand}`);

    console.log(
      chalk.green(`Custom command added: "${voiceCommand}" will execute "codeagent ${cliCommand}"`)
    );

    // Ask if they want to add another command
    const { addAnother } = await inquirer.prompt({
      type: 'confirm',
      name: 'addAnother',
      message: 'Do you want to add another custom voice command?',
      default: false,
    });

    if (addAnother) {
      await this.setupCustomCommands();
    }
  }
}
