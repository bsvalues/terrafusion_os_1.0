# Git Tools Plugin for CodeAgent

A powerful plugin that enhances CodeAgent with Git-specific capabilities for analyzing repositories, generating well-formatted commit messages, and improving Git workflows.

## Features

- **Git Diff Analyzer**: Analyze changes between branches or commits with detailed insights
- **Commit Message Helper**: Generate conventional commit messages based on staged changes
- **Command Hooks**: Automatically enhance Git-related commands with context
- **Commit Suggestions**: Get format suggestions after Git commit commands

## Installation

```bash
# From the plugin directory
codeagent plugin --install /path/to/git-tools

# From GitHub
codeagent plugin --install git+https://github.com/codeagent/git-tools-plugin.git
```

## Tools

### Git Diff Analyzer

Analyzes git diffs and provides insights about the changes.

```bash
codeagent ask "Analyze the diff between main and feature branch using git_diff_analyzer"
```

Parameters:

- `baseBranch`: The base branch to compare with (default: main)
- `path`: Path to analyze (default: current directory)
- `format`: Output format (summary, detailed, json)

Example:

```bash
codeagent ask "Use git_diff_analyzer to analyze changes in the src folder with format=detailed"
```

### Git Commit Helper

Generates well-formatted commit messages and summaries.

```bash
codeagent ask "Generate a commit message for my changes using git_commit_helper"
```

Parameters:

- `mode`: Operation mode (generate, analyze, summarize-changes)
- `description`: Brief description of the changes (for generate mode)
- `commitHash`: Commit hash to analyze (for analyze mode)
- `format`: Commit message format (conventional, gitmoji, simple)

Example:

```bash
codeagent ask "Use git_commit_helper with mode=generate and description='Add user authentication' and format=gitmoji"
```

## Hooks

This plugin provides command hooks that automatically enhance Git-related commands:

1. **Before Command Hook**: Adds Git context to Git-related queries

   - Detects Git repositories
   - Adds branch and status information to context
   - Improves Git-related responses

2. **After Command Hook**: Provides commit suggestions
   - Detects Git commit commands
   - Suggests conventional commit formats based on changes
   - Provides helpful reminders for staging changes

## Development

This plugin is designed as a reference implementation for the CodeAgent plugin system. Developers can use it as a template for creating their own plugins with custom tools and hooks.

### Plugin Structure

```
git-tools/
├── manifest.json      # Plugin metadata
├── tools/             # Custom tools
│   ├── gitDiffAnalyzer.js
│   └── gitCommitHelper.js
├── hooks/             # Command lifecycle hooks
│   ├── beforeCommand.js
│   └── afterCommand.js
└── README.md          # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
