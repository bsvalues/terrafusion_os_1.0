# Code Snippet Sharing Guide

The Code Agent CLI provides powerful code sharing capabilities that allow you to quickly share code snippets with others, with features like expiration, password protection, and QR code generation.

## Quick Start

### Share a snippet from your library

```bash
# Share a snippet by ID
codeagent share snippet <id>

# Share with expiration (hours)
codeagent share snippet <id> --expiry 24

# Share with password protection
codeagent share snippet <id> --password

# Generate QR code
codeagent share snippet <id> --qrcode

# Open URL in browser after sharing
codeagent share snippet <id> --open
```

### Share code directly

```bash
# Share code from clipboard
codeagent share code

# Share code from a file
codeagent share code --file /path/to/file.js

# Share with custom settings
codeagent share code --name "My Code" --description "Example code" --language javascript
```

### Manage shared snippets

```bash
# List all shared snippets
codeagent share list

# Revoke a shared snippet
codeagent share revoke <id>

# Clean up expired shared snippets
codeagent share cleanup
```

## Features

### One-Click Sharing

Simply run `codeagent share code` to quickly share the code in your clipboard, or `codeagent share snippet <id>` to share an existing snippet from your library.

### Password Protection

Add `--password` to protect your shared snippets with a password, ensuring only authorized individuals can access them.

```bash
codeagent share snippet <id> --password
```

### Expiration Control

Set your shared snippets to expire after a certain time period.

```bash
codeagent share snippet <id> --expiry 24  # Expires after 24 hours
```

### Access Limitation

Limit the number of times a snippet can be accessed.

```bash
codeagent share snippet <id> --max-access 5  # Access limited to 5 times
```

### QR Code Generation

Generate QR codes for your shared snippets, making them easily accessible on mobile devices.

```bash
codeagent share snippet <id> --qrcode
```

### Clipboard Integration

URLs are automatically copied to your clipboard for easy sharing.

### Browser Integration

Open the shared snippet URL directly in your default browser.

```bash
codeagent share snippet <id> --open
```

## Command Reference

### `share snippet <id>`

Share an existing snippet from your library.

Options:

- `-e, --expiry <hours>`: Set an expiry time in hours
- `-m, --max-access <count>`: Set maximum number of accesses
- `-p, --password`: Protect with a password
- `--no-tags`: Do not include tags
- `--no-context`: Do not include context
- `-q, --qrcode`: Generate a QR code
- `-o, --open`: Open in browser after sharing

### `share code`

Share code directly from file or clipboard.

Options:

- `-f, --file <path>`: Read code from file
- `-n, --name <name>`: Set a name for the shared code
- `-d, --description <description>`: Set a description
- `-l, --language <language>`: Set the language
- `-e, --expiry <hours>`: Set an expiry time in hours
- `-m, --max-access <count>`: Set maximum number of accesses
- `-p, --password`: Protect with a password
- `-q, --qrcode`: Generate a QR code
- `-o, --open`: Open in browser after sharing

### `share list`

List all shared snippets.

### `share revoke <id>`

Revoke a shared snippet.

### `share cleanup`

Clean up expired shared snippets.

Options:

- `-f, --force`: Skip confirmation

## Best Practices

1. **Set expiration times**: For sensitive code, always set expiration times using `--expiry`.
2. **Use password protection**: For sensitive information, use `--password` to protect your snippets.
3. **Regularly clean up**: Use `share cleanup` to remove expired shared snippets.
4. **Descriptive naming**: When sharing code directly, provide meaningful names and descriptions.
