/**
 * This hook runs after a command is executed
 *
 * @param {Object} context - The command execution context
 * @param {Object} context.command - The command that was executed
 * @param {Object} context.args - The command arguments
 * @param {Object} context.options - The command options
 * @param {Object} context.result - The command result
 * @returns {Promise<void>}
 */
export default async function afterCommand(context) {
  // Only process git-related commands
  if (
    context.command === 'ask' &&
    context.args &&
    typeof context.args === 'string' &&
    context.args.toLowerCase().includes('git commit') &&
    context.result &&
    context.result.output
  ) {
    console.log('Git commit command detected, providing commit suggestions...');

    try {
      // Import required modules
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Check if there are staged changes
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: context.options.path || process.cwd(),
      });

      const stagedChanges =
        statusOutput.split('\n').filter(line => line.match(/^[MARCD]/)).length > 0;

      if (stagedChanges) {
        // Get the diff summary for staged changes
        const { stdout: diffOutput } = await execAsync('git diff --staged --stat', {
          cwd: context.options.path || process.cwd(),
        });

        // Add commit suggestions
        console.log('\nGit Commit Suggestions:');
        console.log('----------------------');
        console.log('Changes staged for commit:');
        console.log(diffOutput);
        console.log('\nSuggested conventional commit formats:');

        // Determine the most likely commit type
        let commitType = 'feat';
        if (diffOutput.includes('test/') || diffOutput.includes('spec.')) {
          commitType = 'test';
        } else if (diffOutput.includes('package.json') || diffOutput.includes('yarn.lock')) {
          commitType = 'build';
        } else if (diffOutput.includes('README') || diffOutput.includes('.md')) {
          commitType = 'docs';
        }

        console.log(`git commit -m "${commitType}: brief description of changes"`);
        console.log(
          `git commit -m "${commitType}: brief description of changes" -m "More detailed explanation if needed"`
        );
      } else {
        console.log('No changes staged for commit. Stage changes with:');
        console.log('git add <file>   # Stage specific file');
        console.log('git add .        # Stage all changes');
      }
    } catch (error) {
      // Not in a git repo or git not installed, ignore
      console.log('Not in a git repository or git not installed.');
    }
  }
}
