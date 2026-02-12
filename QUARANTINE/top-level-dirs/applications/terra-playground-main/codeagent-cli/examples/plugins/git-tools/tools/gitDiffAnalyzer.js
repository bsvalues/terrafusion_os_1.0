import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from '../../../../src/tools/types.js';

const execAsync = promisify(exec);

/**
 * GitDiffAnalyzer - Analyzes git diffs and provides insights
 */
export class GitDiffAnalyzer extends BaseTool {
  constructor() {
    super(
      'git_diff_analyzer',
      'Analyzes git diffs and provides insights about changes',
      {
        baseBranch: {
          name: 'baseBranch',
          description: 'The base branch to compare with (default: main)',
          type: 'string',
          required: false,
          default: 'main',
        },
        path: {
          name: 'path',
          description: 'Path to analyze (default: current directory)',
          type: 'string',
          required: false,
          default: '.',
        },
        format: {
          name: 'format',
          description: 'Output format',
          type: 'string',
          required: false,
          default: 'summary',
          enum: ['summary', 'detailed', 'json'],
        },
      },
      ['git', 'analysis']
    );
  }

  async execute(args) {
    try {
      const baseBranch = args.baseBranch || 'main';
      const path = args.path || '.';
      const format = args.format || 'summary';

      // Get the diff
      const { stdout: diffOutput } = await execAsync(`git diff ${baseBranch} -- ${path}`);

      // Get the current branch
      const { stdout: branchOutput } = await execAsync('git branch --show-current');
      const currentBranch = branchOutput.trim();

      // Parse the diff
      const analysis = this.analyzeDiff(diffOutput);

      // Format the output
      let output;
      if (format === 'json') {
        output = JSON.stringify(analysis, null, 2);
      } else if (format === 'detailed') {
        output = this.formatDetailedOutput(analysis, currentBranch, baseBranch);
      } else {
        output = this.formatSummaryOutput(analysis, currentBranch, baseBranch);
      }

      return {
        success: true,
        output,
        data: analysis,
      };
    } catch (error) {
      return {
        success: false,
        output: `Error analyzing git diff: ${error.message}`,
        error,
      };
    }
  }

  /**
   * Analyze the git diff output
   */
  analyzeDiff(diffOutput) {
    // Simple diff analysis
    const lines = diffOutput.split('\n');
    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;
    let currentFile = null;
    const fileChanges = {};

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // New file in the diff
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        if (match) {
          currentFile = match[1];
          filesChanged++;
          fileChanges[currentFile] = { insertions: 0, deletions: 0 };
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Insertion
        insertions++;
        if (currentFile) {
          fileChanges[currentFile].insertions++;
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deletion
        deletions++;
        if (currentFile) {
          fileChanges[currentFile].deletions++;
        }
      }
    }

    // Calculate simple metrics
    const totalChanges = insertions + deletions;
    const changeRatio = deletions > 0 ? insertions / deletions : insertions;

    // Determine complexity based on simple metrics
    let complexity = 'low';
    if (totalChanges > 500) {
      complexity = 'high';
    } else if (totalChanges > 100) {
      complexity = 'medium';
    }

    return {
      filesChanged,
      insertions,
      deletions,
      totalChanges,
      changeRatio,
      complexity,
      fileChanges,
    };
  }

  /**
   * Format summary output
   */
  formatSummaryOutput(analysis, currentBranch, baseBranch) {
    return `Git Diff Analysis (${currentBranch} vs. ${baseBranch})

Summary:
- Files changed: ${analysis.filesChanged}
- Lines added: ${analysis.insertions}
- Lines removed: ${analysis.deletions}
- Total changes: ${analysis.totalChanges}
- Complexity: ${analysis.complexity}`;
  }

  /**
   * Format detailed output
   */
  formatDetailedOutput(analysis, currentBranch, baseBranch) {
    let output = `Git Diff Analysis (${currentBranch} vs. ${baseBranch})

Summary:
- Files changed: ${analysis.filesChanged}
- Lines added: ${analysis.insertions}
- Lines removed: ${analysis.deletions}
- Total changes: ${analysis.totalChanges}
- Change ratio: ${analysis.changeRatio.toFixed(2)} (insertions/deletions)
- Complexity: ${analysis.complexity}

File Details:`;

    // Add details for each file
    for (const [file, changes] of Object.entries(analysis.fileChanges)) {
      output += `\n- ${file}: +${changes.insertions} -${changes.deletions} (${changes.insertions + changes.deletions} total)`;
    }

    return output;
  }
}

// Export an instance of the tool
export default new GitDiffAnalyzer();
