# Contextual Code Snippet Library

The Contextual Code Snippet Library is a powerful feature of CodeAgent CLI that allows you to save, organize, and reuse code snippets across your projects. Unlike traditional snippet managers, it provides context-aware suggestions based on your current development environment.

## Overview

The snippet library allows you to:

1. **Save code snippets** with metadata (language, tags, descriptions)
2. **Organize** snippets by language, tags, and favorites
3. **Search** for snippets by text, language, tags, or context
4. **Get context-aware suggestions** based on your current development environment
5. **Import and export** snippets for sharing

All snippets are stored locally in `~/.codeagent/snippets/snippets.json` and can be easily backed up, version controlled, or shared with team members.

## Basic Usage

### Creating a Snippet

To create a new snippet:

```bash
codeagent snippet create
```

This will start an interactive process that:

1. Automatically detects your current development context (language, framework, file type)
2. Prompts you for snippet details (name, description, etc.)
3. Allows you to paste code from clipboard or enter it in an editor
4. Saves the snippet with the detected context for future suggestions

### Listing Snippets

To list all your snippets:

```bash
codeagent snippet list
```

You can filter the list using various options:

```bash
# Filter by language
codeagent snippet list --language javascript

# Filter by tags
codeagent snippet list --tags api,http

# Show only favorites
codeagent snippet list --favorite

# Search by text
codeagent snippet list --query "authentication"

# Filter by current context
codeagent snippet list --context
```

### Viewing a Snippet

To view a specific snippet:

```bash
codeagent snippet view <id>
```

This will display the snippet details and code, and give you the option to copy it to clipboard.

### Editing a Snippet

To edit an existing snippet:

```bash
codeagent snippet edit <id>
```

### Deleting a Snippet

To delete a snippet:

```bash
codeagent snippet delete <id>
```

## Contextual Suggestions

The most powerful feature of the snippet library is contextual suggestions based on your current development environment.

To get suggestions:

```bash
codeagent snippet suggest
```

This will:

1. Analyze your current directory to detect:
   - Programming language
   - Framework
   - Project type
   - Dependencies
   - File type
   - Git branch
2. Match this context against your snippet library
3. Suggest the most relevant snippets for your current work

Limit the number of suggestions:

```bash
codeagent snippet suggest --limit 10
```

## Import and Export

### Exporting Snippets

To export your snippets to a JSON file:

```bash
codeagent snippet export snippets.json
```

### Importing Snippets

To import snippets from a JSON file:

```bash
codeagent snippet import snippets.json
```

## Context Detection

The context detector analyzes your development environment to provide relevant snippet suggestions by detecting:

- **Language**: Based on file extensions and project files (package.json, requirements.txt, etc.)
- **Framework**: Derived from dependencies (React, Vue, Django, etc.)
- **Project type**: Based on project structure and configuration files
- **Dependencies**: From package.json, requirements.txt, Gemfile, etc.
- **File type**: From file extension
- **Current function**: When possible, detects the current function being edited
- **Git branch**: For branch-specific context

## Advanced Usage

### Creating Context-Specific Snippets

For better contextual matching, create snippets with specific contexts:

1. Create a snippet while working in the relevant environment
2. Choose "Yes" when asked "Add current context to snippet?"
3. The snippet will be tagged with the current context

### Organizing with Tags

Use a consistent tagging system for better organization:

```bash
# Creating a snippet with specific tags
codeagent snippet create
# When prompted for tags, enter: api,auth,jwt

# Finding snippets by tags
codeagent snippet list --tags api,auth
```

### Working with Favorites

Mark frequently used snippets as favorites:

```bash
# List only favorites
codeagent snippet list --favorite
```

## Best Practices

1. **Use descriptive names**: Make snippet names clear and descriptive
2. **Add detailed descriptions**: Include context and usage examples
3. **Use consistent tags**: Develop a tagging system for better organization
4. **Keep snippets atomic**: Each snippet should do one thing well
5. **Update context when needed**: If a snippet is framework-specific, ensure its context reflects that
6. **Regular exports**: Periodically export your snippets for backup

## Command Reference

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `snippet create`        | Create a new snippet          |
| `snippet list`          | List all snippets             |
| `snippet view <id>`     | View a specific snippet       |
| `snippet edit <id>`     | Edit a snippet                |
| `snippet delete <id>`   | Delete a snippet              |
| `snippet import <file>` | Import snippets from JSON     |
| `snippet export <file>` | Export snippets to JSON       |
| `snippet suggest`       | Get context-aware suggestions |

### List Options

| Option                  | Description               |
| ----------------------- | ------------------------- |
| `--tags <tags...>`      | Filter by tags            |
| `--language <language>` | Filter by language        |
| `--favorite`            | Show only favorites       |
| `--query <query>`       | Search by text            |
| `--context`             | Filter by current context |

### Suggest Options

| Option             | Description                     |
| ------------------ | ------------------------------- |
| `--limit <number>` | Limit the number of suggestions |
