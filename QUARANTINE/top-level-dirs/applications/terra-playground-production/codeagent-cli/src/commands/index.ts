import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically load all commands from the commands directory
 */
export async function loadCommands(program: Command): Promise<void> {
  const commandsDir = __dirname;

  // Skip the index.js file
  const commandFiles = fs
    .readdirSync(commandsDir)
    .filter(file => file !== 'index.js' && file.endsWith('.js'));

  // Import and register each command
  for (const file of commandFiles) {
    try {
      // Import as ES module
      const modulePath = `./${file}`;
      const commandModule = await import(modulePath);

      // Each command module should export a 'register' function
      if (typeof commandModule.register === 'function') {
        commandModule.register(program);
      }
    } catch (error) {
      console.error(`Error loading command from ${file}:`, error);
    }
  }
}
