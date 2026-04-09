#!/usr/bin/env node

/**
 * TaxI_AI Development Tools CLI
 * 
 * A command-line interface for managing TaxI_AI development tools including:
 * - Code Snippets Library
 * - Data Visualization Workshop
 * - UI Component Playground
 * 
 * Usage: node taxi-dev-tools-cli.js <command> [options]
 */

const { program } = require('commander');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3000/api';

// Setup program
program
  .name('taxi-dev-tools-cli')
  .description('CLI for managing TaxI_AI development tools')
  .version('1.0.0');

/**
 * Helper function to make API requests
 */
async function makeRequest(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(chalk.red(`Error making request to ${path}:`), error);
    return { status: 500, error: error.message };
  }
}

// ===== CODE SNIPPETS COMMANDS =====

program
  .command('snippets:list')
  .description('List all code snippets')
  .option('-l, --language <language>', 'Filter by language')
  .option('-t, --type <type>', 'Filter by snippet type')
  .option('-s, --search <query>', 'Search by name or description')
  .action(async (options) => {
    console.log(chalk.blue('Fetching code snippets...'));
    
    let queryParams = [];
    if (options.language) queryParams.push(`language=${options.language}`);
    if (options.type) queryParams.push(`type=${options.type}`);
    if (options.search) queryParams.push(`search=${encodeURIComponent(options.search)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    const { status, data } = await makeRequest(`/code-snippets${queryString}`);
    
    if (status === 200) {
      console.log(chalk.green(`Found ${data.length} snippets`));
      data.forEach(snippet => {
        console.log(chalk.yellow(`\n[${snippet.id}] ${snippet.name}`));
        console.log(chalk.gray(`Language: ${snippet.language} | Type: ${snippet.snippetType}`));
        if (snippet.description) console.log(snippet.description);
        if (snippet.tags && snippet.tags.length > 0) {
          console.log(chalk.cyan(`Tags: ${snippet.tags.join(', ')}`));
        }
      });
    } else {
      console.error(chalk.red('Failed to fetch snippets'), data);
    }
  });

program
  .command('snippets:get <id>')
  .description('Get a specific code snippet')
  .action(async (id) => {
    console.log(chalk.blue(`Fetching snippet with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/code-snippets/${id}`);
    
    if (status === 200) {
      console.log(chalk.yellow(`\n[${data.id}] ${data.name}`));
      console.log(chalk.gray(`Language: ${data.language} | Type: ${data.snippetType}`));
      if (data.description) console.log(data.description);
      if (data.tags && data.tags.length > 0) {
        console.log(chalk.cyan(`Tags: ${data.tags.join(', ')}`));
      }
      console.log(chalk.green('\nCode:'));
      console.log(data.code);
    } else {
      console.error(chalk.red(`Failed to fetch snippet with ID ${id}`), data);
    }
  });

program
  .command('snippets:export <id> [filename]')
  .description('Export a code snippet to a file')
  .action(async (id, filename) => {
    console.log(chalk.blue(`Exporting snippet with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/code-snippets/${id}`);
    
    if (status === 200) {
      const extension = getFileExtension(data.language);
      const outputFilename = filename || `snippet-${id}.${extension}`;
      
      await fs.writeFile(outputFilename, data.code);
      console.log(chalk.green(`Snippet exported to ${outputFilename}`));
    } else {
      console.error(chalk.red(`Failed to export snippet with ID ${id}`), data);
    }
  });

program
  .command('snippets:create')
  .description('Create a new code snippet')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Snippet name:',
        validate: input => input.trim() !== ''
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:'
      },
      {
        type: 'list',
        name: 'language',
        message: 'Language:',
        choices: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'sql']
      },
      {
        type: 'list',
        name: 'snippetType',
        message: 'Snippet type:',
        choices: ['FUNCTION', 'COMPONENT', 'UTILITY', 'API_CALL', 'DATA_MODEL', 'TEST', 'CUSTOM']
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        filter: input => input.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      },
      {
        type: 'confirm',
        name: 'importFromFile',
        message: 'Import code from file?',
        default: false
      },
      {
        type: 'input',
        name: 'filePath',
        message: 'File path:',
        when: answers => answers.importFromFile,
        validate: async (input) => {
          try {
            await fs.access(input);
            return true;
          } catch (error) {
            return 'File does not exist';
          }
        }
      },
      {
        type: 'editor',
        name: 'code',
        message: 'Code:',
        when: answers => !answers.importFromFile
      }
    ]);
    
    let code = answers.code;
    if (answers.importFromFile) {
      code = await fs.readFile(answers.filePath, 'utf8');
    }
    
    const snippetData = {
      name: answers.name,
      description: answers.description,
      language: answers.language,
      snippetType: answers.snippetType,
      code,
      tags: answers.tags,
      createdBy: 1, // Default user ID
      isPublic: true
    };
    
    console.log(chalk.blue('Creating code snippet...'));
    const { status, data } = await makeRequest('/code-snippets', 'POST', snippetData);
    
    if (status === 201) {
      console.log(chalk.green('Snippet created successfully!'));
      console.log(chalk.yellow(`ID: ${data.id}`));
    } else {
      console.error(chalk.red('Failed to create snippet'), data);
    }
  });

program
  .command('snippets:delete <id>')
  .description('Delete a code snippet')
  .action(async (id) => {
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete snippet with ID ${id}?`,
        default: false
      }
    ]);
    
    if (!confirmation.confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
    
    console.log(chalk.blue(`Deleting snippet with ID ${id}...`));
    const { status, data } = await makeRequest(`/code-snippets/${id}`, 'DELETE');
    
    if (status === 204) {
      console.log(chalk.green('Snippet deleted successfully!'));
    } else {
      console.error(chalk.red(`Failed to delete snippet with ID ${id}`), data);
    }
  });

program
  .command('snippets:generate')
  .description('Generate a code snippet with AI')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: 'Describe what you want to generate:',
        validate: input => input.trim() !== ''
      },
      {
        type: 'list',
        name: 'language',
        message: 'Language:',
        choices: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'sql']
      },
      {
        type: 'list',
        name: 'snippetType',
        message: 'Snippet type:',
        choices: ['FUNCTION', 'COMPONENT', 'UTILITY', 'API_CALL', 'DATA_MODEL', 'TEST', 'CUSTOM']
      }
    ]);
    
    console.log(chalk.blue('Generating code snippet...'));
    const { status, data } = await makeRequest('/code-snippets/generate', 'POST', answers);
    
    if (status === 200) {
      console.log(chalk.green('Snippet generated successfully!'));
      console.log(chalk.yellow(`\n${data.name || 'Generated Snippet'}`));
      if (data.description) console.log(data.description);
      console.log(chalk.green('\nCode:'));
      console.log(data.code);
      
      const saveAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: 'Save this snippet?',
          default: true
        }
      ]);
      
      if (saveAnswer.save) {
        const nameAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Snippet name:',
            default: data.name || 'Generated Snippet',
            validate: input => input.trim() !== ''
          }
        ]);
        
        const saveData = {
          ...data,
          name: nameAnswer.name,
          createdBy: 1,
          isPublic: true
        };
        
        const saveResult = await makeRequest('/code-snippets', 'POST', saveData);
        
        if (saveResult.status === 201) {
          console.log(chalk.green('Snippet saved successfully!'));
          console.log(chalk.yellow(`ID: ${saveResult.data.id}`));
        } else {
          console.error(chalk.red('Failed to save snippet'), saveResult.data);
        }
      }
    } else {
      console.error(chalk.red('Failed to generate snippet'), data);
    }
  });

// ===== DATA VISUALIZATIONS COMMANDS =====

program
  .command('visualizations:list')
  .description('List all data visualizations')
  .option('-t, --type <type>', 'Filter by visualization type')
  .option('-s, --search <query>', 'Search by name or description')
  .action(async (options) => {
    console.log(chalk.blue('Fetching data visualizations...'));
    
    let queryParams = [];
    if (options.type) queryParams.push(`type=${options.type}`);
    if (options.search) queryParams.push(`search=${encodeURIComponent(options.search)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    const { status, data } = await makeRequest(`/data-visualizations${queryString}`);
    
    if (status === 200) {
      console.log(chalk.green(`Found ${data.length} visualizations`));
      data.forEach(viz => {
        console.log(chalk.yellow(`\n[${viz.id}] ${viz.name}`));
        console.log(chalk.gray(`Type: ${viz.visualizationType}`));
        if (viz.description) console.log(viz.description);
      });
    } else {
      console.error(chalk.red('Failed to fetch visualizations'), data);
    }
  });

program
  .command('visualizations:get <id>')
  .description('Get a specific data visualization')
  .action(async (id) => {
    console.log(chalk.blue(`Fetching visualization with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/data-visualizations/${id}`);
    
    if (status === 200) {
      console.log(chalk.yellow(`\n[${data.id}] ${data.name}`));
      console.log(chalk.gray(`Type: ${data.visualizationType}`));
      if (data.description) console.log(data.description);
      console.log(chalk.green('\nConfiguration:'));
      console.log(JSON.stringify(data.configuration, null, 2));
      console.log(chalk.green('\nData Source:'));
      console.log(JSON.stringify(data.dataSource, null, 2));
    } else {
      console.error(chalk.red(`Failed to fetch visualization with ID ${id}`), data);
    }
  });

program
  .command('visualizations:export <id> [filename]')
  .description('Export a data visualization to a JSON file')
  .action(async (id, filename) => {
    console.log(chalk.blue(`Exporting visualization with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/data-visualizations/${id}`);
    
    if (status === 200) {
      const outputFilename = filename || `visualization-${id}.json`;
      
      await fs.writeFile(outputFilename, JSON.stringify(data, null, 2));
      console.log(chalk.green(`Visualization exported to ${outputFilename}`));
    } else {
      console.error(chalk.red(`Failed to export visualization with ID ${id}`), data);
    }
  });

// ===== UI COMPONENTS COMMANDS =====

program
  .command('components:list')
  .description('List all UI component templates')
  .option('-t, --type <type>', 'Filter by component type')
  .option('-f, --framework <framework>', 'Filter by framework')
  .option('-s, --search <query>', 'Search by name or description')
  .action(async (options) => {
    console.log(chalk.blue('Fetching UI component templates...'));
    
    let queryParams = [];
    if (options.type) queryParams.push(`type=${options.type}`);
    if (options.framework) queryParams.push(`framework=${options.framework}`);
    if (options.search) queryParams.push(`search=${encodeURIComponent(options.search)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    const { status, data } = await makeRequest(`/ui-components${queryString}`);
    
    if (status === 200) {
      console.log(chalk.green(`Found ${data.length} component templates`));
      data.forEach(component => {
        console.log(chalk.yellow(`\n[${component.id}] ${component.name}`));
        console.log(chalk.gray(`Type: ${component.componentType} | Framework: ${component.framework}`));
        if (component.description) console.log(component.description);
        if (component.tags && component.tags.length > 0) {
          console.log(chalk.cyan(`Tags: ${component.tags.join(', ')}`));
        }
      });
    } else {
      console.error(chalk.red('Failed to fetch component templates'), data);
    }
  });

program
  .command('components:get <id>')
  .description('Get a specific UI component template')
  .action(async (id) => {
    console.log(chalk.blue(`Fetching component template with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/ui-components/${id}`);
    
    if (status === 200) {
      console.log(chalk.yellow(`\n[${data.id}] ${data.name}`));
      console.log(chalk.gray(`Type: ${data.componentType} | Framework: ${data.framework}`));
      if (data.description) console.log(data.description);
      if (data.tags && data.tags.length > 0) {
        console.log(chalk.cyan(`Tags: ${data.tags.join(', ')}`));
      }
      console.log(chalk.green('\nCode:'));
      console.log(data.code);
    } else {
      console.error(chalk.red(`Failed to fetch component template with ID ${id}`), data);
    }
  });

program
  .command('components:export <id> [filename]')
  .description('Export a UI component to a file')
  .action(async (id, filename) => {
    console.log(chalk.blue(`Exporting component template with ID ${id}...`));
    
    const { status, data } = await makeRequest(`/ui-components/${id}`);
    
    if (status === 200) {
      const extension = getFrameworkExtension(data.framework);
      const outputFilename = filename || `component-${id}.${extension}`;
      
      await fs.writeFile(outputFilename, data.code);
      console.log(chalk.green(`Component exported to ${outputFilename}`));
    } else {
      console.error(chalk.red(`Failed to export component with ID ${id}`), data);
    }
  });

program
  .command('components:generate')
  .description('Generate a UI component with AI')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'prompt',
        message: 'Describe the component you want to generate:',
        validate: input => input.trim() !== ''
      },
      {
        type: 'list',
        name: 'framework',
        message: 'Framework:',
        choices: ['react', 'vue', 'angular', 'svelte']
      },
      {
        type: 'list',
        name: 'componentType',
        message: 'Component type:',
        choices: ['LAYOUT', 'INPUT', 'DISPLAY', 'NAVIGATION', 'FEEDBACK', 'DATA_DISPLAY', 'CUSTOM']
      }
    ]);
    
    console.log(chalk.blue('Generating UI component...'));
    const { status, data } = await makeRequest('/ui-components/generate', 'POST', answers);
    
    if (status === 200) {
      console.log(chalk.green('Component generated successfully!'));
      console.log(chalk.yellow(`\n${data.name || 'Generated Component'}`));
      if (data.description) console.log(data.description);
      console.log(chalk.green('\nCode:'));
      console.log(data.code);
      
      const saveAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: 'Save this component?',
          default: true
        }
      ]);
      
      if (saveAnswer.save) {
        const nameAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Component name:',
            default: data.name || 'Generated Component',
            validate: input => input.trim() !== ''
          }
        ]);
        
        const saveData = {
          ...data,
          name: nameAnswer.name,
          createdBy: 1,
          isPublic: true
        };
        
        const saveResult = await makeRequest('/ui-components', 'POST', saveData);
        
        if (saveResult.status === 201) {
          console.log(chalk.green('Component saved successfully!'));
          console.log(chalk.yellow(`ID: ${saveResult.data.id}`));
        } else {
          console.error(chalk.red('Failed to save component'), saveResult.data);
        }
      }
    } else {
      console.error(chalk.red('Failed to generate component'), data);
    }
  });

// ===== HELPER FUNCTIONS =====

/**
 * Get the appropriate file extension for a language
 */
function getFileExtension(language) {
  const extensionMap = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    go: 'go',
    ruby: 'rb',
    php: 'php',
    swift: 'swift',
    kotlin: 'kt',
    rust: 'rs',
    sql: 'sql'
  };
  
  return extensionMap[language.toLowerCase()] || 'txt';
}

/**
 * Get the appropriate file extension for a framework
 */
function getFrameworkExtension(framework) {
  const extensionMap = {
    react: 'jsx',
    'react-typescript': 'tsx',
    vue: 'vue',
    angular: 'ts',
    svelte: 'svelte'
  };
  
  return extensionMap[framework.toLowerCase()] || 'js';
}

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length === 2) {
  program.help();
}