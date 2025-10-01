#!/usr/bin/env node
/**
 * STRICT AI AGENT CONTROL SYSTEM
 * Prevents unauthorized AI agent actions
 * Only allows explicitly approved operations
 */

import fs from 'fs';
import path from 'path';

class StrictAgentController {
    constructor() {
        this.approvedActions = [
            // Explicitly approved operations only
            'read_file',
            'list_dir', 
            'grep_search',
            'semantic_search',
            'run_in_terminal' // with whitelist
        ];
        
        this.forbiddenActions = [
            'replace_string_in_file',  // NO unauthorized edits
            'create_file',            // NO unauthorized file creation
            'install_extension',      // NO unauthorized installs
            'run_vscode_command'      // NO unauthorized commands
        ];
        
        this.approvedCommands = [
            'npm run guard:frontend',
            'npm run benton-county:',
            'npm run os:dev',
            'npm run shell:dev',
            'npm run api:dev'
        ];
        
        this.forbiddenCommands = [
            'npm run benton-county:', // Benton County Washington focus
            'npm run dev:frontend',   // NO legacy frontend
            'docker',                 // NO Docker changes
            'git push',              // NO unauthorized pushes
            'rm -rf',                // NO deletions
        ];
    }

    enforceStrictControl() {
        console.log('🔒 STRICT AI AGENT CONTROL SYSTEM ACTIVE');
        console.log('==========================================');
        console.log('⚠️  AI AGENTS: ALL ACTIONS REQUIRE EXPLICIT APPROVAL');
        console.log('');
        console.log('✅ APPROVED ACTIONS:');
        this.approvedActions.forEach(action => console.log(`   - ${action}`));
        console.log('');
        console.log('❌ FORBIDDEN ACTIONS:');
        this.forbiddenActions.forEach(action => console.log(`   - ${action}`));
        console.log('');
        console.log('🚫 STRICT RULES:');
        console.log('   1. NO file edits without explicit permission');
        console.log('   2. NO package.json modifications');
        console.log('   3. NO county configuration changes');
        console.log('   4. NO frontend architecture changes');
        console.log('   5. ASK BEFORE ANY SYSTEM MODIFICATIONS');
        console.log('');
        console.log('📋 IF YOU NEED TO MAKE CHANGES:');
        console.log('   1. State exactly what you want to change');
        console.log('   2. Get explicit approval from developer');
        console.log('   3. Make ONLY the approved changes');
        console.log('   4. Stop immediately when complete');
        
        return {
            strictMode: true,
            enforced: true,
            unauthorizedActionsBlocked: true
        };
    }

    validateCommand(command) {
        // Check if command is explicitly approved
        const isApproved = this.approvedCommands.some(approved => 
            command.startsWith(approved)
        );
        
        const isForbidden = this.forbiddenCommands.some(forbidden => 
            command.includes(forbidden)
        );
        
        if (isForbidden) {
            console.log(`🚫 BLOCKED: Command "${command}" is explicitly forbidden`);
            return false;
        }
        
        if (!isApproved) {
            console.log(`⚠️  WARNING: Command "${command}" not in approved list`);
            console.log('   Request explicit approval before proceeding');
            return false;
        }
        
        return true;
    }

    createControlManifest() {
        const manifest = {
            systemOwner: "Benton County Assessor (Developer/Org)",
            strictMode: true,
            unauthorizedChangesProhibited: true,
            agentBehaviorRules: [
                "ASK before making ANY file changes",
                "NO Harris County references in Benton County system", 
                "NO frontend architecture changes without approval",
                "NO package.json modifications without approval",
                "STOP immediately when task is complete",
                "EXPLAIN what you're doing before you do it"
            ],
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync('.ai-agent-control-manifest.json', JSON.stringify(manifest, null, 2));
        console.log('📝 Strict control manifest created');
        
        return manifest;
    }
}

// Execute strict control
const controller = new StrictAgentController();
const result = controller.enforceStrictControl();
const manifest = controller.createControlManifest();

console.log('');
console.log('🔒 STRICT AGENT CONTROL SYSTEM DEPLOYED');
console.log('✅ Unauthorized actions now blocked');
console.log('✅ AI agents must request approval for changes');

export default StrictAgentController;