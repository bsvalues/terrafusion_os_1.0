# Voice Command Integration Architecture

This document explains how the Voice Command functionality is integrated into the CodeAgent CLI system.

## Architecture Overview

The Voice Command integration allows users to control CodeAgent CLI using voice commands. It's designed with a modular architecture that supports both text simulation (for development or when audio recording isn't available) and real audio recording with speech-to-text conversion.

![Voice Command Architecture](https://mermaid.ink/img/pako:eNqFksFqwzAMhl_F-Ngh0NLDYIUESkth0F12MLFaE2Ir2FYZJXn3yU7adlsLPoT0S_onWbdoDa3hFdaYXMQ89zqjCMa7kIpnPfpANpE3bBwFiJ6zoJSUDM1DmR2W2iFfH6Hv4YwQhkGDsNphyOd_mDDOSBkkSVLd4-5rdlm5aq7nCjP4Fd-YCZOVNJq9TLFYdSrPvPjbSd1NVN1OkGvMXAiUXfRtCZrjfzrA2Ek4vxWnrWjRpb9-Q6aQWE-mH2jKvQ_xsbGLFYwxA5WDdjn5huIp9P4SaAVbVJPPkw33NbPB-6uNmAyZ1RVkNGFBnxcOCrShDgZKzJPuoPTRJrI2QlVAGO8h5SmXLGqK3D3tKNgCqfQebTVY-fGMNnDiTI2f9Dl_DnWSLr8B8Lyb6Q)

## Components

The integration consists of four primary components that work together:

### 1. VoiceCommandService

The core service that handles:

- Speech recognition and transcription
- Command pattern matching and extraction
- Event emission for command detection and execution
- Integration with the Google Cloud Speech-to-Text API
- Audio file processing for speech recognition

**Key Features:**

- Wake word detection ("Hey Agent")
- Pattern matching with parameter extraction
- Support for both text simulation and real audio recording
- Event-based architecture for loose coupling

### 2. VoiceCommandManager

Acts as a mediator between the CLI and the VoiceCommandService:

- Sets up event handlers for voice command events
- Manages user interaction and messaging
- Handles custom command registration
- Interfaces with the CLI execution engine

**Key Features:**

- User-friendly messaging and error handling
- Custom command configuration via interactive prompts
- Command execution routing
- Help system for available commands

### 3. AudioRecorder

Handles audio recording functionality:

- Cross-platform audio recording with multiple fallback methods
- Recording file management
- Event-based recording status notifications

**Key Features:**

- Support for multiple recording tools (FFmpeg, SoX, ALSA)
- Graceful fallback between recording methods
- Event-based architecture for async recording
- Simulation capability for development environments

### 4. SpeechCredentialsHelper

Manages Google Cloud Speech API credentials:

- Assists in setting up and configuring API credentials
- Validates credential availability
- Provides instructions for obtaining credentials

**Key Features:**

- Interactive credential setup flow
- Credential validation and testing
- Secure storage of API credentials

## Integration with CLI

The voice command system integrates with the CLI through the Commander.js framework:

```typescript
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
    // Command implementation
  });
```

## Event Flow

The voice command system uses an event-driven architecture:

1. **Input Capture**
   - Text input (simulation) or Audio recording
2. **Speech Recognition**
   - Google Cloud Speech-to-Text processing
3. **Command Detection**
   - Pattern matching and parameter extraction
4. **Command Execution**
   - Routing to appropriate CLI command handler
5. **Feedback**
   - User feedback via console outputs

## Error Handling

The system employs a comprehensive error handling strategy:

- **Graceful degradation**: Falls back to simulation mode if audio recording fails
- **Credential validation**: Checks for valid API credentials before attempting API calls
- **Feedback mechanisms**: Provides clear user feedback for all errors
- **Audio recording fallbacks**: Tries multiple recording methods before failing

## Extension Points

The voice command system is designed to be extensible:

1. **Custom Commands**
   - Users can add custom voice commands mapped to CLI commands
2. **Recording Methods**
   - New audio recording methods can be added to the AudioRecorder
3. **Command Patterns**
   - New command patterns with parameter extraction can be added

## Future Enhancements

Potential enhancements to the voice command system:

1. **Continuous Listening Mode**
   - Background listening for commands without manual invocation
2. **Enhanced Wake Word Detection**
   - More sophisticated wake word detection with lower false positives
3. **Offline Speech Recognition**
   - Support for offline speech recognition engines
4. **Voice Response**
   - Text-to-speech response capabilities for hands-free operation
5. **Command Context Awareness**
   - Context-sensitive commands based on current CLI state
