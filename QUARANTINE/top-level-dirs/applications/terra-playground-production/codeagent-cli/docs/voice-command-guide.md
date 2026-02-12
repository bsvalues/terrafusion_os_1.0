# Voice Command Integration Guide

This guide explains how to set up and use the voice command functionality in CodeAgent CLI.

## Overview

Voice commands allow you to control CodeAgent CLI using speech recognition. The system provides both:

1. **Simulation Mode** - Text-based simulation of voice commands (default)
2. **Real Recording Mode** - Actual audio recording and speech-to-text conversion (requires additional setup)

## Prerequisites for Real Recording Mode

To use real audio recording for voice commands, you need:

1. Audio recording tools (one of the following):

   - FFmpeg
   - SoX (Sound eXchange)
   - ALSA (Advanced Linux Sound Architecture) tools

2. Google Cloud Speech-to-Text API credentials:
   - A Google Cloud account
   - Speech-to-Text API enabled
   - A service account with permissions to use the API
   - A downloaded JSON key file for the service account

## Setting Up Credentials

To set up your Google Cloud Speech-to-Text API credentials:

```bash
codeagent voice --setup-credentials
```

Follow the on-screen instructions to provide your service account key file. The credentials will be saved for future use.

## Testing Audio Recording

To test if your system can record audio:

```bash
codeagent voice --test-recording
```

This will attempt to record 5 seconds of audio using available methods and report the results.

## Using Voice Commands

### Basic Usage

To start voice command mode with text simulation:

```bash
codeagent voice
```

### With Real Audio Recording

To use real audio recording (requires setup above):

```bash
codeagent voice --real-recording
```

### With Keyword Detection

To enable wake word detection (activate with "hey agent"):

```bash
codeagent voice --keyword
```

Or with a custom wake word:

```bash
codeagent voice --keyword --wake-word "computer"
```

### Setting Up Custom Commands

To create your own custom voice commands:

```bash
codeagent voice --custom
```

Follow the prompts to map voice phrases to CLI commands.

### Stop Voice Recognition

To stop an active voice recognition session:

```bash
codeagent voice --stop
```

## Available Voice Commands

The following commands are available by default:

- `help` - Show available voice commands
- `list plugins` - List all installed plugins
- `create plugin` - Start the plugin creation wizard
- `install plugin {name}` - Install a plugin
- `edit plugin {name}` - Edit an existing plugin
- `edit settings for {plugin}` - Edit settings for a plugin
- `ask {question}` - Ask a question to the agent
- `stop listening` - Stop voice recognition

## Troubleshooting

### Unable to Record Audio

If you encounter issues with audio recording:

1. Check that you have FFmpeg, SoX, or ALSA tools installed
2. Run `codeagent voice --test-recording` to diagnose issues
3. Try running with `--real-recording` flag to enable real recording

### Speech Recognition Not Working

If speech recognition isn't working properly:

1. Verify that you've set up credentials with `codeagent voice --setup-credentials`
2. Check that your Google Cloud Speech-to-Text API is enabled
3. Check that your service account has the correct permissions
4. Use a quiet environment with minimal background noise
5. Use clear, distinct speech when speaking commands

## Implementation Details

The voice command system consists of the following components:

- `VoiceCommandService` - Core service for speech recognition and command processing
- `VoiceCommandManager` - Manages the integration with the CLI and user interaction
- `AudioRecorder` - Handles audio recording using system tools
- `SpeechCredentialsHelper` - Assists with Google Cloud Speech credentials setup

The system uses a fallback approach for audio recording, attempting to use FFmpeg first, then SoX, then ALSA tools. If none are available, it falls back to text simulation.
