/**
 * This hook runs before a command is executed
 *
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command being executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @returns {Promise<void>}
 */
export default async function beforeCommand(context) {
  // Only process git-related commands
  if (
    context.command === 'ask' &&
    context.args &&
    typeof context.args === 'string' &&
    context.args.toLowerCase().includes('git')
  ) {
    console.log('Git-related command detected, enhancing context...');

    try {
      // Import child_process and util for running git commands
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Get git status
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: context.options.path || process.cwd(),
      });

      // Only proceed if in a git repo
      if (statusOutput !== null) {
        // Get current branch
        const { stdout: branchOutput } = await execAsync('git branch --show-current', {
          cwd: context.options.path || process.cwd(),
        });

        // Count modified, added, deleted files
        const modified = (statusOutput.match(/^ M/gm) || []).length;
        const added = (statusOutput.match(/^A /gm) || []).length;
        const deleted = (statusOutput.match(/^D /gm) || []).length;
        const untracked = (statusOutput.match(/^\?\?/gm) || []).length;

        // Add git context to the command
        context.gitContext = {
          branch: branchOutput.trim(),
          modified,
          added,
          deleted,
          untracked,
          hasChanges: statusOutput.trim().length > 0,
        };

        console.log(
          `Git context added: Currently on branch ${branchOutput.trim()} with ${modified} modified, ${added} added, ${deleted} deleted, and ${untracked} untracked files.`
        );
      }
    } catch (error) {
      // Not in a git repo or git not installed, ignore
      console.log('Not in a git repository or git not installed.');
    }
  }
}
