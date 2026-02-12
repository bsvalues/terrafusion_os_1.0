import { Command } from 'commander';
import chalk from 'chalk';
import { VoiceCommandManager } from '../voice/voiceCommandManager.js';
import { SpeechCredentialsHelper } from '../voice/speechCredentialsHelper.js';

/**
 * Register the voice command
 */
export function register(program: Command): void {
  program
    .command('voice')
    .description('Start voice command mode')
    .option('-k, --keyword', 'Enable keyword detection (wake word)', false)
    .option('-w, --wake-word <word>', 'Set custom wake word', 'hey agent')
    .option('-c, --custom', 'Set up custom voice commands', false)
    .option('-s, --stop', 'Stop voice recognition if running', false)
    .option('-r, --real-recording', 'Use real audio recording instead of text simulation', false)
    .option('--setup-credentials', 'Set up Google Cloud Speech credentials', false)
    .option('--test-recording', 'Test if audio recording is available on your system', false)
    .action(async options => {
      const voiceManager = new VoiceCommandManager();
      const credentialsHelper = new SpeechCredentialsHelper();

      // Handle stop option
      if (options.stop) {
        voiceManager.stop();
        return;
      }

      // Handle setup-credentials option
      if (options.setupCredentials) {
        await credentialsHelper.setupCredentials();
        return;
      }

      // Handle test-recording option
      if (options.testRecording) {
        console.log(chalk.blue.bold('\n🎙️ Testing Audio Recording'));
        console.log(chalk.blue('───────────────────────\n'));

        console.log('This will test if audio recording is available on your system.');
        console.log('A 5-second recording will be attempted using available methods.\n');

        try {
          const { AudioRecorder } = await import('../voice/audioRecorder.js');
          const recorder = new AudioRecorder();

          console.log(chalk.yellow('Recording will start in 3 seconds...'));
          await new Promise(resolve => setTimeout(resolve, 3000));

          console.log(chalk.green('🎙️ Recording for 5 seconds...'));

          // Set up event handlers
          recorder.on('recording', data => {
            console.log(chalk.green(`Recording started using ${data.tool}`));
          });

          recorder.on('recorded', data => {
            console.log(chalk.green('Recording completed successfully!'));
            console.log(chalk.green(`Audio saved to: ${data.path}`));
            if (data.duration) {
              console.log(chalk.green(`Duration: ${data.duration.toFixed(2)} seconds`));
            }
          });

          recorder.on('error', error => {
            console.error(chalk.red(`Error during recording: ${error.message}`));
          });

          recorder.on('warning', warning => {
            console.log(chalk.yellow(`Warning: ${warning.message}`));
          });

          // Start recording for 5 seconds
          await recorder.startRecording(5);

          // Wait for 6 seconds to allow recording to complete
          await new Promise(resolve => setTimeout(resolve, 6000));

          console.log(
            chalk.blue('\nTest completed. If you saw "Recording completed successfully!",')
          );
          console.log(chalk.blue('your system is capable of audio recording for voice commands.'));
          console.log(chalk.blue('You can use the --real-recording option to enable it.'));
        } catch (error) {
          console.error(chalk.red(`Error testing recording: ${error.message}`));
          console.log(
            chalk.red('Your system may not have the necessary audio libraries installed.')
          );
        }

        return;
      }

      console.log(chalk.blue.bold('\n🎤 Voice Command Mode'));
      console.log(chalk.blue('───────────────────\n'));

      // Check if credentials are set up
      if (!credentialsHelper.hasCredentials()) {
        console.log(chalk.yellow('Google Cloud Speech credentials not found.'));
        console.log(chalk.yellow('Voice commands will be simulated using text input.'));
        console.log(
          chalk.yellow('To set up credentials, run: codeagent voice --setup-credentials\n')
        );

        // Force simulation mode if no credentials
        options.realRecording = false;
      } else {
        // Set the environment variable for the credentials
        credentialsHelper.setEnvironmentVariable();
        console.log(chalk.green('Google Cloud Speech credentials found.'));
      }

      console.log('Voice commands allow you to control CodeAgent using your voice.');

      if (options.realRecording) {
        console.log(chalk.green('Using real audio recording for voice input.'));
        console.log(
          chalk.yellow('If you encounter issues, try running: codeagent voice --test-recording')
        );
      } else {
        console.log(chalk.yellow('Using text simulation for voice input (no actual recording).'));
        console.log(chalk.yellow('To use real recording, run with --real-recording option.'));
      }
      console.log('');

      // Set up custom commands if requested
      if (options.custom) {
        await voiceManager.setupCustomCommands();
      }

      // Show available commands
      voiceManager.showHelp();

      // Start voice command mode
      await voiceManager.start(options.keyword, options.wakeWord, options.realRecording);
    });
}
