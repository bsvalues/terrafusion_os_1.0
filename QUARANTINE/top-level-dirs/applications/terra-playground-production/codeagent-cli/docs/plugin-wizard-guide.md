# Plugin Configuration Wizard Guide

The Plugin Configuration Wizard provides an intuitive interface for creating, configuring, and managing plugins for CodeAgent. This guide covers the various features of the wizard and how to use them.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a New Plugin](#creating-a-new-plugin)
3. [Editing an Existing Plugin](#editing-an-existing-plugin)
4. [Managing Plugin Settings](#managing-plugin-settings)
5. [Command Reference](#command-reference)

## Getting Started

The Plugin Configuration Wizard can be accessed through the `codeagent` CLI using the following command:

```bash
codeagent plugin --wizard
```

This launches the interactive wizard for creating a new plugin. To edit an existing plugin, you can specify the plugin name:

```bash
codeagent plugin --wizard my-plugin
```

## Creating a New Plugin

The wizard guides you through the process of creating a new plugin with the following steps:

1. **Basic Information**

   - Plugin name (must be unique)
   - Version number
   - Description
   - Author information
   - Repository URL (optional)

2. **Features Selection**

   - Tools: Extend agent capabilities
   - Hooks: Run code at specific lifecycle events
   - Commands: Add new CLI commands
   - Settings: Configurable plugin options

3. **Configuration for Each Feature**

   - Tools: Define tool files
   - Hooks: Select hook types and define hook files
   - Commands: Define command files
   - Settings: Configure plugin settings

4. **Plugin Structure**
   The wizard automatically creates:
   - `manifest.json` with your plugin configuration
   - `README.md` with basic documentation
   - Template files for tools, hooks, and commands
   - Directory structure for your plugin

## Editing an Existing Plugin

To edit an existing plugin, use:

```bash
codeagent plugin --wizard my-plugin
```

The wizard will load the current configuration and allow you to modify:

- Basic information
- Tools, hooks, and commands
- Settings
- Dependencies

## Managing Plugin Settings

### Using the Plugin Settings Command

For focused management of plugin settings, use the dedicated plugin-settings command:

```bash
# List all plugins with settings
codeagent plugin-settings --list

# Edit settings for a specific plugin
codeagent plugin-settings --edit my-plugin

# Reset settings to defaults
codeagent plugin-settings --reset my-plugin
```

### Settings Management Features

- **View Settings**: See current settings for plugins
- **Edit Settings**: Modify existing setting values
- **Add Settings**: Add new settings to plugins
- **Delete Settings**: Remove unwanted settings
- **Reset Settings**: Restore default settings from the plugin manifest

### Types of Settings

You can configure settings of various types:

- **String**: Text values
- **Number**: Numeric values
- **Boolean**: True/false values
- **Array**: Lists of values
- **Object**: Complex JSON objects

## Command Reference

### Plugin Configuration Wizard

```bash
# Start the wizard to create a new plugin
codeagent plugin --wizard

# Edit an existing plugin
codeagent plugin --wizard my-plugin
```

### Plugin Settings Management

```bash
# List all plugins with settings
codeagent plugin-settings --list
codeagent ps --list  # Short alias

# Edit settings for a specific plugin
codeagent plugin-settings --edit my-plugin
codeagent ps --edit my-plugin  # Short alias

# Reset settings to defaults
codeagent plugin-settings --reset my-plugin
codeagent ps --reset my-plugin  # Short alias
```

### Other Plugin Management Commands

```bash
# List all installed plugins
codeagent plugin --list

# Install a plugin
codeagent plugin --install /path/to/plugin
codeagent plugin --install git+https://github.com/user/plugin.git
codeagent plugin --install npm-package-name

# Uninstall a plugin
codeagent plugin --uninstall my-plugin

# Enable a plugin
codeagent plugin --enable my-plugin

# Disable a plugin
codeagent plugin --disable my-plugin

# Create a simple plugin template (without the wizard)
codeagent plugin --create my-plugin
```

## Examples

### Creating a Data Processing Plugin

```bash
# Start the wizard
codeagent plugin --wizard

# Enter plugin information:
# Name: data-processor
# Description: A plugin for data processing and transformation
# Version: 1.0.0
# Author: Your Name

# Select features:
# [x] Tools
# [x] Hooks
# [ ] Commands
# [x] Settings

# Configure tools:
# - csvParser.js
# - jsonTransformer.js

# Configure hooks:
# - beforeCommand.js (to add data context)

# Configure settings:
# - maxFileSize: 10485760
# - allowedFormats: ["csv", "json", "xml"]
# - verbose: false
```

### Editing Plugin Settings

```bash
# List plugins with settings
codeagent ps --list

# Edit settings for a specific plugin
codeagent ps --edit data-processor

# Add a new setting
# Setting key: outputFormat
# Value type: String
# Value: json

# Edit an existing setting
# Select: maxFileSize
# New value: 20971520
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for your plugins and their components.
2. **Proper Versioning**: Follow semantic versioning for your plugins (MAJOR.MINOR.PATCH).
3. **Documentation**: Include thorough documentation in your plugin's README.
4. **Fallback Defaults**: Provide sensible default values for all settings.
5. **Error Handling**: Implement proper error handling in your tools and hooks.
6. **Testing**: Test your plugin thoroughly before sharing it with others.
7. **Validation**: Add input validation for all tool and command parameters.

## Troubleshooting

- **Plugin Not Loading**: Check if the plugin is enabled and properly installed.
- **Missing Dependencies**: Ensure all required dependencies are installed.
- **Broken Hooks**: Verify that your hook functions follow the correct signature.
- **Invalid Settings**: Settings must be valid JSON and adhere to the expected types.

## Need Help?

If you encounter any issues or have questions about creating or configuring plugins, refer to the main CodeAgent documentation or reach out to the community for assistance.
