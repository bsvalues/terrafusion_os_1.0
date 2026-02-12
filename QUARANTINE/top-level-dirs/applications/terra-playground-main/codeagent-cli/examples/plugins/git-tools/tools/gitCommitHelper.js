import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from '../../../../src/tools/types.js';

const execAsync = promisify(exec);

/**
 * GitCommitHelper - Generates well-formatted commit messages and summaries
 */
export class GitCommitHelper extends BaseTool {
  constructor() {
    super(
      'git_commit_helper',
      'Generates well-formatted commit messages and summaries',
      {
        mode: {
          name: 'mode',
          description: 'Operation mode',
          type: 'string',
          required: true,
          enum: ['generate', 'analyze', 'summarize-changes'],
        },
        description: {
          name: 'description',
          description: 'Brief description of the changes for generating commit messages',
          type: 'string',
          required: false,
        },
        commitHash: {
          name: 'commitHash',
          description: 'Commit hash to analyze',
          type: 'string',
          required: false,
        },
        format: {
          name: 'format',
          description: 'Commit message format convention',
          type: 'string',
          required: false,
          default: 'conventional',
          enum: ['conventional', 'gitmoji', 'simple'],
        },
      },
      ['git', 'commit']
    );
  }

  async execute(args) {
    try {
      const { mode, description, commitHash, format = 'conventional' } = args;

      switch (mode) {
        case 'generate':
          return await this.generateCommitMessage(description, format);
        case 'analyze':
          return await this.analyzeCommit(commitHash);
        case 'summarize-changes':
          return await this.summarizeChanges();
        default:
          return {
            success: false,
            output: `Invalid mode: ${mode}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        output: `Error in GitCommitHelper: ${error.message}`,
        error,
      };
    }
  }

  /**
   * Generate a well-formatted commit message
   */
  async generateCommitMessage(description, format) {
    if (!description) {
      return {
        success: false,
        output: 'Description is required for generating commit messages',
      };
    }

    // Get staged files to determine the type of changes
    const { stdout: stagedOutput } = await execAsync('git diff --staged --name-only');
    const stagedFiles = stagedOutput.trim().split('\\n');

    // Determine the commit type based on files
    const commitType = this.determineCommitType(stagedFiles);

    // Generate the commit message based on the format
    let commitMessage;

    switch (format) {
      case 'conventional':
        commitMessage = `${commitType}: ${description}`;
        break;
      case 'gitmoji':
        const emoji = this.getEmojiForCommitType(commitType);
        commitMessage = `${emoji} ${description}`;
        break;
      case 'simple':
      default:
        commitMessage = description;
    }

    return {
      success: true,
      output: commitMessage,
      data: {
        commitMessage,
        type: commitType,
        format,
      },
    };
  }

  /**
   * Analyze a commit
   */
  async analyzeCommit(commitHash) {
    if (!commitHash) {
      return {
        success: false,
        output: 'Commit hash is required for analyzing commits',
      };
    }

    // Get commit details
    const { stdout: commitDetails } = await execAsync(`git show --stat ${commitHash}`);

    // Parse the commit details
    const subject = commitDetails.split('\\n')[4].trim();
    const stats = commitDetails.match(
      /\\d+ files? changed(?:, (\\d+) insertions?\\(\\+\\))?(?:, (\\d+) deletions?\\(-\\))?/
    );

    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;

    if (stats) {
      filesChanged = parseInt(stats[0].match(/(\\d+) files?/)[1]);
      insertions = stats[1] ? parseInt(stats[1]) : 0;
      deletions = stats[2] ? parseInt(stats[2]) : 0;
    }

    // Try to identify the commit type based on conventional commits
    let type = 'unknown';
    const conventionalMatch = subject.match(
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.*\\))?:/
    );

    if (conventionalMatch) {
      type = conventionalMatch[1];
    }

    const analysis = {
      hash: commitHash,
      subject,
      type,
      stats: {
        filesChanged,
        insertions,
        deletions,
        totalChanges: insertions + deletions,
      },
    };

    return {
      success: true,
      output:
        `Commit ${commitHash} Analysis:\\n\\n` +
        `Subject: ${subject}\\n` +
        `Type: ${type}\\n` +
        `Files changed: ${filesChanged}\\n` +
        `Insertions: ${insertions}\\n` +
        `Deletions: ${deletions}\\n` +
        `Total changes: ${insertions + deletions}`,
      data: analysis,
    };
  }

  /**
   * Summarize changes in the staging area
   */
  async summarizeChanges() {
    // Get the diff summary
    const { stdout: diffSummary } = await execAsync('git diff --staged --stat');

    // Get the file list
    const { stdout: fileList } = await execAsync('git diff --staged --name-only');
    const files = fileList.trim().split('\\n').filter(Boolean);

    // Group files by type/directory
    const fileGroups = this.groupFiles(files);

    let summary = 'Changes summary:\\n\\n';

    for (const [group, groupFiles] of Object.entries(fileGroups)) {
      summary += `${group} (${groupFiles.length} files):\\n`;
      groupFiles.forEach(file => {
        summary += `- ${file}\\n`;
      });
      summary += '\\n';
    }

    // Add overall stats
    const stats = diffSummary.match(
      /\\d+ files? changed(?:, (\\d+) insertions?\\(\\+\\))?(?:, (\\d+) deletions?\\(-\\))?/
    );

    if (stats) {
      const filesChanged = parseInt(stats[0].match(/(\\d+) files?/)[1]);
      const insertions = stats[1] ? parseInt(stats[1]) : 0;
      const deletions = stats[2] ? parseInt(stats[2]) : 0;

      summary += `\\nOverall: ${filesChanged} files changed, ${insertions} insertions(+), ${deletions} deletions(-)`;
    }

    return {
      success: true,
      output: summary,
      data: {
        files,
        fileGroups,
      },
    };
  }

  /**
   * Determine the commit type based on the files changed
   */
  determineCommitType(files) {
    // Analyze files to determine the nature of the change
    const fileTypes = files.map(file => {
      const extension = file.split('.').pop().toLowerCase();

      if (
        file.includes('test/') ||
        file.includes('spec/') ||
        extension === 'test.js' ||
        extension === 'spec.js'
      ) {
        return 'test';
      } else if (file.includes('doc/') || file.includes('docs/') || extension === 'md') {
        return 'docs';
      } else if (
        file.includes('.github/') ||
        file.includes('ci/') ||
        file === '.travis.yml' ||
        file === 'Jenkinsfile'
      ) {
        return 'ci';
      } else if (file === 'package.json' || file === 'package-lock.json' || file === 'yarn.lock') {
        return 'build';
      } else if (extension === 'css' || extension === 'scss' || extension === 'less') {
        return 'style';
      } else {
        return 'code';
      }
    });

    // Count occurrences of each type
    const typeCounts = fileTypes.reduce((counts, type) => {
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});

    // Determine the main type
    const mainType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];

    // Map to conventional commit types
    const typeMap = {
      code: 'feat',
      test: 'test',
      docs: 'docs',
      ci: 'ci',
      build: 'build',
      style: 'style',
    };

    return typeMap[mainType] || 'feat';
  }

  /**
   * Get emoji for commit type
   */
  getEmojiForCommitType(type) {
    const emojiMap = {
      feat: '✨', // Sparkles for new features
      fix: '🐛', // Bug for fixes
      docs: '📝', // Memo for documentation
      style: '💄', // Lipstick for styling
      refactor: '♻️', // Recycle for refactoring
      perf: '⚡️', // Zap for performance
      test: '✅', // Check mark for tests
      build: '📦', // Package for build system
      ci: '👷', // Construction worker for CI
      chore: '🔧', // Wrench for chores
      revert: '⏪', // Rewind for reverts
    };

    return emojiMap[type] || '🔨'; // Hammer as default
  }

  /**
   * Group files by type or directory
   */
  groupFiles(files) {
    const groups = {};

    for (const file of files) {
      // Determine the group (by directory or extension)
      let group;

      if (file.includes('/')) {
        group = file.split('/')[0];
      } else {
        const ext = file.split('.').pop();
        group = `.${ext} files`;
      }

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(file);
    }

    return groups;
  }
}

// Export an instance of the tool
export default new GitCommitHelper();
