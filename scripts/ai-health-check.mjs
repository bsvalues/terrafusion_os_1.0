#!/usr/bin/env node
/**
 * TerraFusion OS - AI Agent Health Check
 * Validates AI agent understanding in real-time
 */

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
                expected: "1008",
                critical: true
            },
            {
                question: "Does TerraFusion need web deployment?",
                expected: "no",
                critical: true
            },
            {
                question: "What desktop shell does TerraFusion use?",
                expected: "electron",
                critical: true
            },
            {
                question: "What port does the OS kernel use?",
                expected: "5000",
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