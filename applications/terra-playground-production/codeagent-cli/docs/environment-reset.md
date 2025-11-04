# Environment Reset Command

The CodeAgent CLI provides a powerful environment reset command to easily restore your development environment to a clean state with a single command. This is particularly useful when debugging issues, starting a new project, or when you want to remove all configuration files and start fresh.

## Basic Usage

To reset your environment with default settings:

```bash
codeagent reset
```

This will perform the following actions:

1. Detect all resetable items in your environment
2. Present a list of what will be reset
3. Ask for confirmation before proceeding
4. Create a backup of all items being reset
5. Remove the items
6. Display a summary of the reset operation

## Options

The reset command provides several options to customize the reset process:

| Option                           | Description                                       |
| -------------------------------- | ------------------------------------------------- |
| `-f, --force`                    | Force reset without confirmation                  |
| `-k, --keep-plugins`             | Keep plugin configurations when resetting         |
| `-d, --clean-deps`               | Clean and reinstall dependencies                  |
| `-s, --reset-services`           | Reset service configurations and credentials      |
| `-o, --reset-only <paths...>`    | Only reset specified paths                        |
| `-c, --config-path <path>`       | Specify custom plugin config path                 |
| `-r, --restore <backupDir>`      | Restore from a previous backup                    |
| `-i, --restore-items <paths...>` | Only restore specified items from backup          |
| `-l, --list-resetable`           | List all resetable items without performing reset |

## Examples

### Basic Reset

```bash
codeagent reset
```

### Force Reset (Skip Confirmation)

```bash
codeagent reset --force
```

### Reset with Dependency Cleaning

```bash
codeagent reset --clean-deps
```

### Reset Only Specific Directories

```bash
codeagent reset --reset-only node_modules .cache tmp
```

### List Resetable Items

```bash
codeagent reset --list-resetable
```

### Restore from Backup

```bash
codeagent reset --restore /path/to/backup-directory
```

### Restore Only Specific Items from Backup

```bash
codeagent reset --restore /path/to/backup-directory --restore-items node_modules .env
```

## Default Reset Targets

By default, the reset command will target the following items:

- `config/` - Configuration directory
- `.config/` - Hidden configuration directory
- `settings/` - Settings directory
- `.settings/` - Hidden settings directory
- `.env` - Environment variables file
- `.env.local` - Local environment variables file
- `.cache/` - Cache directory
- `node_modules/` - Node.js dependencies
- `dist/` - Distribution directory
- `build/` - Build directory
- `tmp/` - Temporary directory
- `.tmp/` - Hidden temporary directory

If the `--reset-services` option is provided, the following service files will also be reset:

- `~/.codeagent/credentials/` - Service credential files
- `~/.codeagent/logs/` - Service log files
- `~/.codeagent/cache/` - Service cache files

## Backup and Restore

Every reset operation creates a backup of all resetable items before removing them. The backup is stored in a timestamped directory in your current working directory (e.g., `.backup-1234567890`).

You can restore from this backup using the `--restore` option:

```bash
codeagent reset --restore .backup-1234567890
```

This will copy all files from the backup directory back to their original locations.

## Safety Features

- Confirmation prompt before reset (unless `--force` is used)
- Automatic backup of all reset items
- Detection of existing configuration files before reset
- Detailed progress messages during the reset process
- Summary of the reset operation upon completion
