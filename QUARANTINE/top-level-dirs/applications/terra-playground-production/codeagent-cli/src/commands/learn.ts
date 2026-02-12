import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

/**
 * Register the learn command
 */
export function register(program: Command): void {
  program
    .command('learn')
    .description('Manage and view the learning database')
    .option('-t, --tag <tag>', 'Filter entries by tag')
    .option('-e, --export <path>', 'Export learning data to JSON file')
    .option('-i, --import <path>', 'Import learning data from JSON file')
    .option('-a, --analyze', 'Analyze learning data for patterns', false)
    .option('-f, --feedback <id>', 'Add feedback for a specific learning entry')
    .option('-c, --clean', 'Clean up low-quality entries', false)
    .option('-m, --merge <path>', 'Merge in data from another learning database')
    .action(async (options, command) => {
      const { learningManager } = program.context;

      // Initialize the learning manager if it hasn't been already
      if (learningManager) {
        await learningManager.initialize();
      } else {
        console.error(chalk.red('Learning manager not available'));
        return;
      }

      // If no options are provided, show an interactive menu
      if (Object.keys(options).length === 0) {
        await showInteractiveMenu(learningManager);
        return;
      }

      // Handle feedback option
      if (options.feedback) {
        await provideFeedback(learningManager, options.feedback);
        return;
      }

      // Handle export option
      if (options.export) {
        await exportLearningData(learningManager, options.export, options.tag);
        return;
      }

      // Handle import option
      if (options.import) {
        await importLearningData(learningManager, options.import);
        return;
      }

      // Handle analyze option
      if (options.analyze) {
        await analyzeLearningData(learningManager);
        return;
      }

      // Handle clean option
      if (options.clean) {
        await cleanLearningData(learningManager);
        return;
      }

      // Handle merge option
      if (options.merge) {
        await mergeLearningData(learningManager, options.merge);
        return;
      }

      // Default to showing recent learnings
      await showRecentLearnings(learningManager, options.tag);
    });
}

/**
 * Show an interactive menu for managing learning data
 */
async function showInteractiveMenu(learningManager: any): Promise<void> {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'View recent learnings', value: 'view' },
      { name: 'Filter by tag', value: 'filter' },
      { name: 'Provide feedback', value: 'feedback' },
      { name: 'Export learning data', value: 'export' },
      { name: 'Import learning data', value: 'import' },
      { name: 'Analyze patterns', value: 'analyze' },
      { name: 'Clean low-quality entries', value: 'clean' },
      { name: 'Exit', value: 'exit' },
    ],
  });

  switch (action) {
    case 'view':
      await showRecentLearnings(learningManager);
      break;

    case 'filter':
      const { tag } = await inquirer.prompt({
        type: 'input',
        name: 'tag',
        message: 'Enter tag to filter by:',
      });
      await showRecentLearnings(learningManager, tag);
      break;

    case 'feedback':
      const { id } = await inquirer.prompt({
        type: 'input',
        name: 'id',
        message: 'Enter learning entry ID to provide feedback for:',
        validate: input => {
          const parsedId = parseInt(input, 10);
          return !isNaN(parsedId) ? true : 'Please enter a valid numeric ID';
        },
      });
      await provideFeedback(learningManager, id);
      break;

    case 'export':
      const { exportPath } = await inquirer.prompt({
        type: 'input',
        name: 'exportPath',
        message: 'Enter path to export to:',
        default: './learning_export.json',
      });
      await exportLearningData(learningManager, exportPath);
      break;

    case 'import':
      const { importPath } = await inquirer.prompt({
        type: 'input',
        name: 'importPath',
        message: 'Enter path to import from:',
        validate: input => {
          const fs = require('fs');
          return fs.existsSync(input) ? true : 'File does not exist';
        },
      });
      await importLearningData(learningManager, importPath);
      break;

    case 'analyze':
      await analyzeLearningData(learningManager);
      break;

    case 'clean':
      await cleanLearningData(learningManager);
      break;

    case 'exit':
    default:
      console.log(chalk.blue('Exiting learning management'));
      break;
  }
}

/**
 * Show recent learning entries
 */
async function showRecentLearnings(learningManager: any, tag?: string): Promise<void> {
  const spinner = ora('Fetching learning entries...').start();

  try {
    let entries;

    if (tag) {
      // Get tagged entries
      entries = await learningManager.getTopRatedSolutionsForTag(tag, 10);
      spinner.succeed(`Found ${entries.length} entries with tag "${tag}"`);
    } else {
      // Get recent entries
      // This would be a new method to add to the learning manager
      entries = await learningManager.db.all(
        `SELECT * FROM learning_entries ORDER BY timestamp DESC LIMIT 10`
      );
      spinner.succeed(`Found ${entries.length} recent learning entries`);
    }

    if (entries.length === 0) {
      console.log(chalk.yellow('No learning entries found'));
      return;
    }

    // Display the entries
    console.log(chalk.blue.bold('\nLearning Entries:'));
    for (const entry of entries) {
      console.log(chalk.cyan(`\nID: ${entry.id} (${new Date(entry.timestamp).toLocaleString()})`));
      console.log(
        chalk.yellow(
          `Query: ${entry.query.substring(0, 100)}${entry.query.length > 100 ? '...' : ''}`
        )
      );
      console.log(chalk.green(`Feedback: ${entry.feedback.toFixed(1)}/5`));
      console.log(chalk.gray(`Tags: ${entry.tags || 'none'}`));
    }
  } catch (error) {
    spinner.fail('Error fetching learning entries');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Provide feedback for a learning entry
 */
async function provideFeedback(learningManager: any, entryId: string): Promise<void> {
  const id = parseInt(entryId, 10);

  if (isNaN(id)) {
    console.error(chalk.red('Invalid entry ID'));
    return;
  }

  const spinner = ora(`Fetching learning entry ${id}...`).start();

  try {
    // Get the learning entry
    const entry = await learningManager.db.get(`SELECT * FROM learning_entries WHERE id = ?`, id);

    if (!entry) {
      spinner.fail(`Learning entry ${id} not found`);
      return;
    }

    spinner.succeed(`Found learning entry ${id}`);

    // Display the entry
    console.log(chalk.blue.bold('\nLearning Entry:'));
    console.log(chalk.cyan(`ID: ${entry.id} (${new Date(entry.timestamp).toLocaleString()})`));
    console.log(chalk.yellow(`Query: ${entry.query}`));
    console.log(
      chalk.white(
        `Solution: ${entry.solution.substring(0, 200)}${entry.solution.length > 200 ? '...' : ''}`
      )
    );
    console.log(chalk.green(`Current Feedback: ${entry.feedback.toFixed(1)}/5`));

    // Get feedback
    const { rating, notes } = await inquirer.prompt([
      {
        type: 'list',
        name: 'rating',
        message: 'Rate the quality of this solution:',
        choices: [
          { name: '1 - Poor', value: 1 },
          { name: '2 - Fair', value: 2 },
          { name: '3 - Good', value: 3 },
          { name: '4 - Very Good', value: 4 },
          { name: '5 - Excellent', value: 5 },
        ],
      },
      {
        type: 'input',
        name: 'notes',
        message: 'Any additional notes (optional):',
        default: '',
      },
    ]);

    // Store the feedback
    await learningManager.storeFeedback({
      learningEntryId: id,
      feedback: rating,
      notes,
      timestamp: new Date().toISOString(),
    });

    console.log(chalk.green(`Feedback stored for learning entry ${id}`));
  } catch (error) {
    spinner.fail('Error providing feedback');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Export learning data to a file
 */
async function exportLearningData(
  learningManager: any,
  filePath: string,
  tag?: string
): Promise<void> {
  const spinner = ora('Exporting learning data...').start();

  try {
    // Get learning entries
    let entries;

    if (tag) {
      // Filter by tag
      entries = await learningManager.db.all(
        `SELECT * FROM learning_entries WHERE tags LIKE ?`,
        `%${tag}%`
      );
    } else {
      // Get all entries
      entries = await learningManager.db.all(`SELECT * FROM learning_entries`);
    }

    // Get feedback for each entry
    const entriesWithFeedback = await Promise.all(
      entries.map(async entry => {
        const feedback = await learningManager.db.all(
          `SELECT * FROM feedback_entries WHERE learning_entry_id = ?`,
          entry.id
        );

        return {
          ...entry,
          feedbackEntries: feedback,
        };
      })
    );

    // Write the data to file
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(entriesWithFeedback, null, 2));

    spinner.succeed(`Exported ${entries.length} learning entries to ${filePath}`);
  } catch (error) {
    spinner.fail('Error exporting learning data');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Import learning data from a file
 */
async function importLearningData(learningManager: any, filePath: string): Promise<void> {
  const spinner = ora('Importing learning data...').start();

  try {
    // Read the file
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(data)) {
      spinner.fail('Invalid data format');
      return;
    }

    // Import each entry
    let entriesImported = 0;
    let feedbackImported = 0;

    for (const entry of data) {
      // Check if entry exists
      const existingEntry = await learningManager.db.get(
        `SELECT id FROM learning_entries WHERE timestamp = ? AND query = ?`,
        entry.timestamp,
        entry.query
      );

      let entryId;

      if (existingEntry) {
        // Skip importing the entry itself but use its ID for feedback
        entryId = existingEntry.id;
      } else {
        // Insert the entry
        const result = await learningManager.db.run(
          `INSERT INTO learning_entries 
           (timestamp, context, query, solution, tools_used, feedback, tags) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          entry.timestamp,
          entry.context,
          entry.query,
          entry.solution,
          entry.tools_used,
          entry.feedback,
          entry.tags
        );

        entryId = result.lastID;
        entriesImported++;
      }

      // Import feedback if available
      if (Array.isArray(entry.feedbackEntries)) {
        for (const feedback of entry.feedbackEntries) {
          // Check if feedback exists
          const existingFeedback = await learningManager.db.get(
            `SELECT id FROM feedback_entries 
             WHERE learning_entry_id = ? AND timestamp = ?`,
            entryId,
            feedback.timestamp
          );

          if (!existingFeedback) {
            // Insert the feedback
            await learningManager.db.run(
              `INSERT INTO feedback_entries 
               (learning_entry_id, feedback, notes, timestamp) 
               VALUES (?, ?, ?, ?)`,
              entryId,
              feedback.feedback,
              feedback.notes,
              feedback.timestamp
            );

            feedbackImported++;
          }
        }
      }
    }

    spinner.succeed(`Imported ${entriesImported} entries and ${feedbackImported} feedback items`);
  } catch (error) {
    spinner.fail('Error importing learning data');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Analyze learning data for patterns
 */
async function analyzeLearningData(learningManager: any): Promise<void> {
  const spinner = ora('Analyzing learning data for patterns...').start();

  try {
    // Extract patterns
    await learningManager.extractPatterns();

    // This is a simple analysis for now, but could be expanded
    // with more sophisticated techniques

    // Get the top tags
    const tags = await learningManager.db.all(
      `SELECT tags, COUNT(*) as count FROM learning_entries
       GROUP BY tags
       ORDER BY count DESC
       LIMIT 10`
    );

    // Get the highest rated entries
    const topEntries = await learningManager.db.all(
      `SELECT id, query, feedback, tags FROM learning_entries
       WHERE feedback > 4
       ORDER BY feedback DESC
       LIMIT 5`
    );

    spinner.succeed('Analysis complete');

    // Display the results
    console.log(chalk.blue.bold('\nTop Tags:'));
    for (const tag of tags) {
      if (tag.tags) {
        console.log(chalk.cyan(`${tag.tags}: ${tag.count} entries`));
      }
    }

    console.log(chalk.blue.bold('\nHighest Rated Solutions:'));
    for (const entry of topEntries) {
      console.log(chalk.cyan(`ID: ${entry.id}, Rating: ${entry.feedback.toFixed(1)}/5`));
      console.log(
        chalk.yellow(
          `Query: ${entry.query.substring(0, 100)}${entry.query.length > 100 ? '...' : ''}`
        )
      );
      console.log(chalk.gray(`Tags: ${entry.tags || 'none'}`));
      console.log('');
    }
  } catch (error) {
    spinner.fail('Error analyzing learning data');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Clean low-quality entries from the learning database
 */
async function cleanLearningData(learningManager: any): Promise<void> {
  const spinner = ora('Identifying low-quality entries...').start();

  try {
    // Find entries with low feedback scores
    const lowQualityEntries = await learningManager.db.all(
      `SELECT id, query, feedback FROM learning_entries
       WHERE feedback < 2.5
       ORDER BY feedback ASC`
    );

    spinner.succeed(`Found ${lowQualityEntries.length} low-quality entries`);

    if (lowQualityEntries.length === 0) {
      console.log(chalk.green('No low-quality entries to clean'));
      return;
    }

    // Ask for confirmation
    const { confirm, deleteAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to clean ${lowQualityEntries.length} low-quality entries?`,
        default: false,
      },
      {
        type: 'confirm',
        name: 'deleteAll',
        message: 'Delete all at once? (No will prompt for each entry)',
        default: false,
        when: answers => answers.confirm,
      },
    ]);

    if (!confirm) {
      console.log(chalk.blue('Cleaning cancelled'));
      return;
    }

    // Delete the entries
    let deletedCount = 0;

    if (deleteAll) {
      // Delete all at once
      const deleteSpinner = ora('Deleting low-quality entries...').start();

      // Delete feedback first (foreign key constraint)
      await learningManager.db.run(
        `DELETE FROM feedback_entries
         WHERE learning_entry_id IN (
           SELECT id FROM learning_entries
           WHERE feedback < 2.5
         )`
      );

      // Delete the entries
      const result = await learningManager.db.run(
        `DELETE FROM learning_entries
         WHERE feedback < 2.5`
      );

      deletedCount = result.changes;
      deleteSpinner.succeed(`Deleted ${deletedCount} low-quality entries`);
    } else {
      // Prompt for each entry
      for (const entry of lowQualityEntries) {
        console.log(chalk.cyan(`\nID: ${entry.id}, Rating: ${entry.feedback.toFixed(1)}/5`));
        console.log(
          chalk.yellow(
            `Query: ${entry.query.substring(0, 100)}${entry.query.length > 100 ? '...' : ''}`
          )
        );

        const { deleteEntry } = await inquirer.prompt({
          type: 'confirm',
          name: 'deleteEntry',
          message: 'Delete this entry?',
          default: false,
        });

        if (deleteEntry) {
          // Delete feedback first (foreign key constraint)
          await learningManager.db.run(
            `DELETE FROM feedback_entries
             WHERE learning_entry_id = ?`,
            entry.id
          );

          // Delete the entry
          await learningManager.db.run(
            `DELETE FROM learning_entries
             WHERE id = ?`,
            entry.id
          );

          console.log(chalk.green('Entry deleted'));
          deletedCount++;
        }
      }
    }

    console.log(chalk.green(`Cleaned ${deletedCount} low-quality entries`));
  } catch (error) {
    spinner.fail('Error cleaning learning data');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Merge data from another learning database
 */
async function mergeLearningData(learningManager: any, dbPath: string): Promise<void> {
  const spinner = ora(`Merging data from ${dbPath}...`).start();

  try {
    // Check if the file exists
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      spinner.fail(`Database file not found: ${dbPath}`);
      return;
    }

    // Open the source database
    const sqlite3 = require('sqlite3');
    const { open } = require('sqlite');

    const sourceDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Get all entries from the source database
    const sourceEntries = await sourceDb.all(`SELECT * FROM learning_entries`);

    // Merge each entry
    let entriesMerged = 0;
    let feedbackMerged = 0;

    for (const entry of sourceEntries) {
      // Check if entry exists
      const existingEntry = await learningManager.db.get(
        `SELECT id FROM learning_entries WHERE timestamp = ? AND query = ?`,
        entry.timestamp,
        entry.query
      );

      let entryId;

      if (existingEntry) {
        // Skip importing the entry itself but use its ID for feedback
        entryId = existingEntry.id;
      } else {
        // Insert the entry
        const result = await learningManager.db.run(
          `INSERT INTO learning_entries 
           (timestamp, context, query, solution, tools_used, feedback, tags) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          entry.timestamp,
          entry.context,
          entry.query,
          entry.solution,
          entry.tools_used,
          entry.feedback,
          entry.tags
        );

        entryId = result.lastID;
        entriesMerged++;
      }

      // Get feedback for this entry
      const sourceFeedback = await sourceDb.all(
        `SELECT * FROM feedback_entries WHERE learning_entry_id = ?`,
        entry.id
      );

      // Import feedback
      for (const feedback of sourceFeedback) {
        // Check if feedback exists
        const existingFeedback = await learningManager.db.get(
          `SELECT id FROM feedback_entries 
           WHERE learning_entry_id = ? AND timestamp = ?`,
          entryId,
          feedback.timestamp
        );

        if (!existingFeedback) {
          // Insert the feedback
          await learningManager.db.run(
            `INSERT INTO feedback_entries 
             (learning_entry_id, feedback, notes, timestamp) 
             VALUES (?, ?, ?, ?)`,
            entryId,
            feedback.feedback,
            feedback.notes,
            feedback.timestamp
          );

          feedbackMerged++;
        }
      }
    }

    // Close the source database
    await sourceDb.close();

    spinner.succeed(
      `Merged ${entriesMerged} entries and ${feedbackMerged} feedback items from ${dbPath}`
    );
  } catch (error) {
    spinner.fail('Error merging learning data');
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
