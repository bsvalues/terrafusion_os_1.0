#!/usr/bin/env node
/**
 * TerraFusion OS - AI Agent Health Check
 * Validates AI agent understanding with dynamic configuration
 */

// Dynamic configuration loader (simplified for .mjs compatibility)
const config = (() => {
    try {
        // For now, return default config since dynamic loading in .mjs has path issues
        return {
            ai_swarm: {
                deployment_phases: {
                    target_phase: 5,
                    phases: [
                        { id: 5, agent_count: 50000 }
                    ]
                }
            }
        };
    } catch (error) {
        return null;
    }
})();

const targetPhase = config?.ai_swarm?.deployment_phases?.target_phase || 5;
const targetPhaseData = config?.ai_swarm?.deployment_phases?.phases?.find(p => p.id === targetPhase);
const targetAgentCount = targetPhaseData?.agent_count || 50000;

const healthCheck = {
    testAgentUnderstanding() {
        const questions = [
            {
                question: "What type of system is TerraFusion?",
                expected: "operating system",
                critical: true
            },
            {
                question: "How many AI agents are operational?",
                expected: targetAgentCount.toString(),
                critical: true
            },
            {
                question: "Does TerraFusion need web deployment?",
                expected: "no",
                critical: true
            },
            {
                question: "What port does the OS kernel use?",
                expected: process.env.TF_API_PORT || "5046",
                critical: false
            }
        ];
        
        console.log('🏥 TerraFusion OS - AI Agent Health Check');
        console.log('========================================');
        
        let passed = 0;
        let total = questions.length;
        
        questions.forEach((q, index) => {
            console.log(`${index + 1}. ${q.question}`);
            console.log(`   Expected: ${q.expected}`);
            console.log(`   Critical: ${q.critical ? 'YES' : 'NO'}`);
            console.log('');
        });
        
        console.log('🎯 Run this with agent responses to validate understanding');
        console.log('⚠️  Critical questions must be answered correctly');
        
        return { questions, total };
    },
    
    validateResponse(questionIndex, agentResponse) {
        const q = this.testAgentUnderstanding().questions[questionIndex];
        const correct = agentResponse.toLowerCase().includes(q.expected.toLowerCase());
        
        if (!correct && q.critical) {
            console.error(`❌ CRITICAL FAILURE: ${q.question}`);
            console.error(`   Agent said: ${agentResponse}`);
            console.error(`   Expected: ${q.expected}`);
            console.error('🚨 AI AGENT MUST RE-READ AI_AGENT_START_HERE.md');
            return false;
        }
        
        return correct;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = healthCheck;
} else {
    healthCheck.testAgentUnderstanding();
}