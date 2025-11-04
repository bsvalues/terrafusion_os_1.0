# CodeAgent CLI - Enhanced AI Coding Assistant

CodeAgent is an advanced command-line AI coding assistant with learning capabilities. It helps developers write, analyze, and transform code with the power of AI.

## Features

- 🔍 **Context-Aware**: Understands your project's structure and codebase
- 🛠️ **Powerful Tools**: Built-in tools for file operations, git, and code analysis
- 📝 **Interactive Sessions**: Chat with the AI assistant about your code
- 📊 **Code Analysis**: Analyze code for bugs, performance, security, and style issues
- ✨ **Code Generation**: Generate code based on descriptions or transform existing code
- 📚 **Learning System**: Improves over time by learning from feedback
- 🔊 **Voice Command Integration**: Control the CLI using voice commands
- 🔄 **Environment Reset**: One-click environment reset capability with backups
- 📋 **Code Snippet Library**: Organize and manage your code snippets by context
- 🌐 **One-Click Code Sharing**: Easily share code snippets with password protection and QR codes

## Installation

```bash
npm install -g codeagent-cli
```

## Prerequisites

- Node.js 14 or higher
- OpenAI API key (set as OPENAI_API_KEY environment variable)

## Usage

### Setup

Before using CodeAgent, set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-api-key
```

Or create a `.env` file in your project directory:

```
OPENAI_API_KEY=your-api-key
```

### Basic Commands

#### Interactive Mode

Start an interactive session:

```bash
codeagent ask
```

#### Ask a Question

Ask a specific question:

```bash
codeagent ask "How do I implement a middleware in Express.js?"
```

#### Analyze Code

Analyze a file or directory:

```bash
codeagent analyze path/to/file.js --type bugs
```

Options for analysis types: bugs, performance, security, style, general

#### Generate Code

Generate code based on a description:

```bash
codeagent generate "Create a React component that displays a list of items" --language typescript
```

#### Transform Existing Code

Transform, refactor, or optimize existing code:

```bash
codeagent generate --input path/to/file.js --type refactor --output path/to/refactored.js
```

Options for transformation types: transform, refactor, optimize

#### Learning Management

Manage the learning database:

```bash
codeagent learn
```

#### Code Sharing

Share code snippets with others:

```bash
# Share a snippet from your library
codeagent share snippet <id>

# Share code from clipboard
codeagent share code

# Share code from file with password protection
codeagent share code --file path/to/file.js --password

# Share with QR code generation
codeagent share snippet <id> --qrcode

# List and manage shared snippets
codeagent share list
```

For more details, see [Code Snippet Sharing Guide](./docs/SHARING.md).

### Advanced Options

#### Context Files

You can provide context files to help the agent understand your project better:

```bash
codeagent ask "How do I fix this bug?" --context file1.js,file2.js
```

#### Enable Specific Tools

Enable specific tools for more powerful operations:

```bash
codeagent ask "Optimize my git workflow" --tools git_op,file_read,file_write
```

## Configuration

You can create a configuration file at `~/.codeagent/config.json`:

```json
{
  "default": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 8192,
    "userPreferences": {
      "codeStyle": "standard",
      "indentation": "2spaces",
      "commentStyle": "moderate"
    }
  }
}
```

## License

MIT
