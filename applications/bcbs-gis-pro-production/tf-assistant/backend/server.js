const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { askLLM, initializeRAG } = require('./lib/ai-client');
const { WorkflowAgent } = require('./agents/workflow-agent');
const { JudgeAgent } = require('./agents/judge-agent');
const { NarratorAgent } = require('./agents/narrator-agent');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize agents
const workflowAgent = new WorkflowAgent();
const judgeAgent = new JudgeAgent();
const narratorAgent = new NarratorAgent();

// Initialize RAG system on startup
initializeRAG().then(() => {
  console.log('✅ RAG system initialized with Benton County GIS documents');
}).catch(err => {
  console.error('❌ RAG initialization failed:', err);
});

// Agent mesh endpoint
app.post('/agent-mesh/workflow', async (req, res) => {
  try {
    const { task, parcelData, workflowType } = req.body;
    
    // Step 1: WorkflowAgent processes the task
    const workflowResult = await workflowAgent.processTask(task, parcelData, workflowType);
    
    // Step 2: JudgeAgent validates for compliance
    const validationResult = await judgeAgent.validateWorkflow(workflowResult);
    
    // Step 3: NarratorAgent creates summary
    const summaryResult = await narratorAgent.summarizeWorkflow(workflowResult, validationResult);
    
    // Log the complete workflow
    const auditLog = {
      timestamp: new Date().toISOString(),
      workflowType,
      task,
      workflowResult,
      validationResult,
      summaryResult,
      status: validationResult.isValid ? 'completed' : 'requires_review'
    };
    
    fs.appendFileSync(
      path.join(__dirname, '../logs/workflow-audit.log'), 
      JSON.stringify(auditLog) + '\n'
    );
    
    res.json({
      workflow: workflowResult,
      validation: validationResult,
      summary: summaryResult,
      auditId: auditLog.timestamp
    });
    
  } catch (error) {
    console.error('Agent mesh error:', error);
    res.status(500).json({ error: 'Agent mesh processing failed' });
  }
});

// Parcel processing endpoints
app.post('/parcel/sm00-report', async (req, res) => {
  try {
    const { parcelNumber, ownerName, legalDescription } = req.body;
    
    const sm00Data = await workflowAgent.generateSM00Report({
      parcelNumber,
      ownerName,
      legalDescription,
      county: 'Benton County, Washington'
    });
    
    const validation = await judgeAgent.validateSM00(sm00Data);
    
    res.json({
      sm00Report: sm00Data,
      validation,
      generated: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'SM00 report generation failed' });
  }
});

app.post('/parcel/bla-merge-split', async (req, res) => {
  try {
    const { operation, sourceParcels, targetConfiguration } = req.body;
    
    const blaResult = await workflowAgent.processBLAOperation({
      operation, // 'merge', 'split', 'boundary_adjustment'
      sourceParcels,
      targetConfiguration,
      county: 'Benton County, Washington'
    });
    
    const validation = await judgeAgent.validateBLA(blaResult);
    
    res.json({
      blaResult,
      validation,
      processed: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: 'BLA operation failed' });
  }
});

// RAG-enhanced document search
app.post('/rag/search', async (req, res) => {
  try {
    const { query, documentType, workflowStage } = req.body;
    
    const searchResults = await askLLM(
      `RAG_SEARCH: Find relevant documents for: ${query}`,
      { 
        context: { documentType, workflowStage },
        useRAG: true 
      }
    );
    
    res.json({ results: searchResults });
    
  } catch (error) {
    res.status(500).json({ error: 'RAG search failed' });
  }
});

// Prompt approval queue
app.get('/prompts/pending', async (req, res) => {
  try {
    const pendingFile = path.join(__dirname, '../logs/pending-prompts.json');
    
    if (fs.existsSync(pendingFile)) {
      const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
      res.json(pending);
    } else {
      res.json([]);
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending prompts' });
  }
});

app.post('/prompts/approve/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const { approved } = req.body;
    
    // Process approval logic here
    const approvalLog = {
      promptId,
      approved,
      timestamp: new Date().toISOString(),
      approvedBy: req.body.approvedBy || 'system'
    };
    
    fs.appendFileSync(
      path.join(__dirname, '../logs/prompt-approvals.log'),
      JSON.stringify(approvalLog) + '\n'
    );
    
    res.json({ status: 'processed' });
    
  } catch (error) {
    res.status(500).json({ error: 'Approval processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agents: {
      workflow: workflowAgent.isReady(),
      judge: judgeAgent.isReady(),
      narrator: narratorAgent.isReady()
    },
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Terrafusion GIS Workflow Assistant running on port ${PORT}`);
  console.log(`📍 Configured for Benton County, Washington`);
  console.log(`🤖 Multi-agent mesh: WorkflowAgent, JudgeAgent, NarratorAgent`);
  console.log(`🔐 Local LLM + RAG system active`);
});