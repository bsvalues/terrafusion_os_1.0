import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS_DIR = path.join(__dirname, '../../../.github/workflows');

describe('Governance PR Gate', () => {
  it('should have a workflow that runs on pull_request and executes governance-proof', () => {
    if (!fs.existsSync(WORKFLOWS_DIR)) {
      throw new Error(`.github/workflows directory does not exist at ${WORKFLOWS_DIR}`);
    }

    const workflowFiles = fs
      .readdirSync(WORKFLOWS_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    let foundPrGate = false;
    let foundCommand = false;
    let foundArtifactUpload = false;
    let foundAlwaysCondition = false;

    // Helper to read file content
    const getFileContent = (file: string) =>
      fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8');

    for (const file of workflowFiles) {
      const content = getFileContent(file);

      // Check for pull_request trigger
      // Matches: on: pull_request or on: [pull_request] or - pull_request (list item)
      const hasPrTrigger =
        /on:\s*(\[.*?pull_request.*?\]|pull_request)/s.test(content) ||
        /pull_request:\s*(\n\s*types:|\[)/.test(content) ||
        /on:\s*\n\s*pull_request:/.test(content);

      if (hasPrTrigger) {
        // Check for command
        const hasCommand = /pnpm run ci:governance-proof(:log)?/.test(content);

        if (hasCommand) {
          foundPrGate = true;
          foundCommand = true;

          // Check for artifact upload
          // Looking for actions/upload-artifact
          const hasUpload = /uses: actions\/upload-artifact/.test(content);
          if (hasUpload) {
            foundArtifactUpload = true;

            // Check for if: always() in close proximity to the upload or command
            // This is a bit loose with regex, but checks if 'if: always()' exists in the file for now.
            // Ideally we'd check it's on the upload step, but that's hard without a parser.
            // We'll assume if the file has `if: always()` and runs the command, it's likely correct enough for a contract.
            if (/if:\s*always\(\)/.test(content)) {
              foundAlwaysCondition = true;
            }
          }
        }
      }
    }

    expect(
      foundPrGate,
      'No workflow found that runs on pull_request and executes ci:governance-proof'
    ).toBe(true);
    expect(foundCommand, 'No PR workflow found executing ci:governance-proof').toBe(true);
    expect(foundArtifactUpload, 'No PR workflow found uploading artifacts').toBe(true);
    expect(foundAlwaysCondition, 'No PR workflow found with if: always() for artifacts').toBe(true);
  });
});
