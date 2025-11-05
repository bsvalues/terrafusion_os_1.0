/**
 * TerraFusion MIT PhD Systems Agent - Decision Tracking Framework
 * Evidence-based decision logging and rationale documentation
 */

import * as fs from 'fs';
import * as path from 'path';

interface Decision {
  id: string;
  timestamp: string;
  category: string;
  context: {
    problem: string;
    scope: string;
    stakeholders: string[];
    constraints: string[];
  };
  analysis: {
    evidence_collected: EvidenceItem[];
    options_evaluated: Option[];
    risks_identified: Risk[];
  };
  decision: {
    chosen_option: string;
    rationale: string;
    expected_outcomes: string[];
    success_criteria: string[];
  };
  implementation: {
    steps: string[];
    verification_plan: string[];
    rollback_plan: string[];
  };
  outcomes: {
    actual_results?: string[];
    lessons_learned?: string[];
    follow_up_actions?: string[];
  };
}

interface EvidenceItem {
  source: string;
  type: 'telemetry' | 'logs' | 'metrics' | 'code_analysis' | 'documentation' | 'test_results';
  data: any;
  credibility: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface Option {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  effort_estimate: string;
  risk_level: 'low' | 'medium' | 'high';
  alignment_with_principles: number; // 1-10
}

interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export class DecisionTracker {
  private logPath: string;
  private decisions: Map<string, Decision>;

  constructor(workspaceRoot: string) {
    this.logPath = path.join(
      workspaceRoot,
      'agents/terrafusion-phd-systems-agent/logs/decisions'
    );

    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }

    this.decisions = new Map();
    this.loadExistingDecisions();
  }

  /**
   * Create a new decision record
   */
  createDecision(category: string, problem: string): string {
    const id = this.generateDecisionId();
    const decision: Decision = {
      id,
      timestamp: new Date().toISOString(),
      category,
      context: {
        problem,
        scope: '',
        stakeholders: [],
        constraints: []
      },
      analysis: {
        evidence_collected: [],
        options_evaluated: [],
        risks_identified: []
      },
      decision: {
        chosen_option: '',
        rationale: '',
        expected_outcomes: [],
        success_criteria: []
      },
      implementation: {
        steps: [],
        verification_plan: [],
        rollback_plan: []
      },
      outcomes: {}
    };

    this.decisions.set(id, decision);
    return id;
  }

  /**
   * Add context to a decision
   */
  addContext(
    decisionId: string,
    scope: string,
    stakeholders: string[],
    constraints: string[]
  ): void {
    const decision = this.getDecision(decisionId);
    decision.context.scope = scope;
    decision.context.stakeholders = stakeholders;
    decision.context.constraints = constraints;
    this.saveDecision(decision);
  }

  /**
   * Add evidence to support decision-making
   */
  addEvidence(
    decisionId: string,
    source: string,
    type: EvidenceItem['type'],
    data: any,
    credibility: 'high' | 'medium' | 'low'
  ): void {
    const decision = this.getDecision(decisionId);
    decision.analysis.evidence_collected.push({
      source,
      type,
      data,
      credibility,
      timestamp: new Date().toISOString()
    });
    this.saveDecision(decision);
  }

  /**
   * Add an option for evaluation
   */
  addOption(decisionId: string, option: Option): void {
    const decision = this.getDecision(decisionId);
    decision.analysis.options_evaluated.push(option);
    this.saveDecision(decision);
  }

  /**
   * Add identified risk
   */
  addRisk(decisionId: string, risk: Risk): void {
    const decision = this.getDecision(decisionId);
    decision.analysis.risks_identified.push(risk);
    this.saveDecision(decision);
  }

  /**
   * Record the final decision
   */
  recordDecision(
    decisionId: string,
    chosenOption: string,
    rationale: string,
    expectedOutcomes: string[],
    successCriteria: string[]
  ): void {
    const decision = this.getDecision(decisionId);
    decision.decision = {
      chosen_option: chosenOption,
      rationale,
      expected_outcomes: expectedOutcomes,
      success_criteria: successCriteria
    };
    this.saveDecision(decision);
  }

  /**
   * Define implementation plan
   */
  defineImplementation(
    decisionId: string,
    steps: string[],
    verificationPlan: string[],
    rollbackPlan: string[]
  ): void {
    const decision = this.getDecision(decisionId);
    decision.implementation = {
      steps,
      verification_plan: verificationPlan,
      rollback_plan: rollbackPlan
    };
    this.saveDecision(decision);
  }

  /**
   * Record outcomes after implementation
   */
  recordOutcomes(
    decisionId: string,
    actualResults: string[],
    lessonsLearned: string[],
    followUpActions: string[]
  ): void {
    const decision = this.getDecision(decisionId);
    decision.outcomes = {
      actual_results: actualResults,
      lessons_learned: lessonsLearned,
      follow_up_actions: followUpActions
    };
    this.saveDecision(decision);
  }

  /**
   * Get decision by ID
   */
  getDecision(decisionId: string): Decision {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }
    return decision;
  }

  /**
   * Generate decision report
   */
  generateReport(decisionId: string): string {
    const decision = this.getDecision(decisionId);

    let report = '# Decision Record\n\n';
    report += `**ID**: ${decision.id}\n`;
    report += `**Category**: ${decision.category}\n`;
    report += `**Timestamp**: ${decision.timestamp}\n\n`;

    report += '## Context\n\n';
    report += `**Problem**: ${decision.context.problem}\n\n`;
    report += `**Scope**: ${decision.context.scope}\n\n`;
    report += `**Stakeholders**: ${decision.context.stakeholders.join(', ')}\n\n`;
    report += `**Constraints**:\n${decision.context.constraints.map(c => `- ${c}`).join('\n')}\n\n`;

    report += '## Analysis\n\n';
    report += `### Evidence Collected (${decision.analysis.evidence_collected.length} items)\n\n`;
    for (const evidence of decision.analysis.evidence_collected) {
      report += `- **${evidence.type}** from ${evidence.source} (${evidence.credibility} credibility)\n`;
      report += `  ${JSON.stringify(evidence.data, null, 2)}\n\n`;
    }

    report += `### Options Evaluated (${decision.analysis.options_evaluated.length} options)\n\n`;
    for (const option of decision.analysis.options_evaluated) {
      report += `#### ${option.name}\n\n`;
      report += `${option.description}\n\n`;
      report += `**Pros**:\n${option.pros.map(p => `- ${p}`).join('\n')}\n\n`;
      report += `**Cons**:\n${option.cons.map(c => `- ${c}`).join('\n')}\n\n`;
      report += `**Effort**: ${option.effort_estimate} | **Risk**: ${option.risk_level} | **Alignment**: ${option.alignment_with_principles}/10\n\n`;
    }

    report += `### Risks Identified (${decision.analysis.risks_identified.length} risks)\n\n`;
    for (const risk of decision.analysis.risks_identified) {
      report += `- **${risk.description}**\n`;
      report += `  Probability: ${risk.probability} | Impact: ${risk.impact}\n`;
      report += `  Mitigation: ${risk.mitigation}\n\n`;
    }

    report += '## Decision\n\n';
    report += `**Chosen Option**: ${decision.decision.chosen_option}\n\n`;
    report += `**Rationale**: ${decision.decision.rationale}\n\n`;
    report += `**Expected Outcomes**:\n${decision.decision.expected_outcomes.map(o => `- ${o}`).join('\n')}\n\n`;
    report += `**Success Criteria**:\n${decision.decision.success_criteria.map(c => `- ${c}`).join('\n')}\n\n`;

    report += '## Implementation\n\n';
    report += `**Steps**:\n${decision.implementation.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
    report += `**Verification Plan**:\n${decision.implementation.verification_plan.map(v => `- ${v}`).join('\n')}\n\n`;
    report += `**Rollback Plan**:\n${decision.implementation.rollback_plan.map(r => `- ${r}`).join('\n')}\n\n`;

    if (decision.outcomes.actual_results) {
      report += '## Outcomes\n\n';
      report += `**Actual Results**:\n${decision.outcomes.actual_results.map(r => `- ${r}`).join('\n')}\n\n`;

      if (decision.outcomes.lessons_learned) {
        report += `**Lessons Learned**:\n${decision.outcomes.lessons_learned.map(l => `- ${l}`).join('\n')}\n\n`;
      }

      if (decision.outcomes.follow_up_actions) {
        report += `**Follow-up Actions**:\n${decision.outcomes.follow_up_actions.map(a => `- ${a}`).join('\n')}\n\n`;
      }
    }

    return report;
  }

  /**
   * Export decision as markdown file
   */
  exportDecision(decisionId: string): string {
    const report = this.generateReport(decisionId);
    const filename = `decision-${decisionId}.md`;
    const filepath = path.join(this.logPath, filename);

    fs.writeFileSync(filepath, report);
    console.log(`📝 Decision record exported: ${filepath}`);

    return filepath;
  }

  /**
   * List all decisions
   */
  listDecisions(): Array<{ id: string; category: string; problem: string; timestamp: string }> {
    return Array.from(this.decisions.values()).map(d => ({
      id: d.id,
      category: d.category,
      problem: d.context.problem,
      timestamp: d.timestamp
    }));
  }

  // Private methods

  private generateDecisionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `DEC-${timestamp}-${random}`;
  }

  private saveDecision(decision: Decision): void {
    this.decisions.set(decision.id, decision);

    const filename = `decision-${decision.id}.json`;
    const filepath = path.join(this.logPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(decision, null, 2));
  }

  private loadExistingDecisions(): void {
    if (!fs.existsSync(this.logPath)) return;

    const files = fs.readdirSync(this.logPath)
      .filter(f => f.startsWith('decision-') && f.endsWith('.json'));

    for (const file of files) {
      try {
        const filepath = path.join(this.logPath, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const decision: Decision = JSON.parse(content);
        this.decisions.set(decision.id, decision);
      } catch (error) {
        console.error(`Error loading decision from ${file}:`, error);
      }
    }

    console.log(`📚 Loaded ${this.decisions.size} existing decision records`);
  }
}

/**
 * Rationale Logger - Quick documentation of implementation rationale
 */
export class RationaleLogger {
  private logFile: string;

  constructor(workspaceRoot: string) {
    const logsDir = path.join(
      workspaceRoot,
      'agents/terrafusion-phd-systems-agent/logs'
    );

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFile = path.join(logsDir, 'implementation-rationale.log');
  }

  /**
   * Log implementation rationale
   */
  log(
    component: string,
    action: string,
    rationale: string,
    evidence: any[] = []
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      component,
      action,
      rationale,
      evidence
    };

    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);

    console.log(`📝 Rationale logged: ${component} - ${action}`);
  }

  /**
   * Get recent rationale entries
   */
  getRecent(count: number = 10): any[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const content = fs.readFileSync(this.logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.length > 0);

    return lines
      .slice(-count)
      .map(line => JSON.parse(line))
      .reverse();
  }

  /**
   * Search rationale by component
   */
  searchByComponent(component: string): any[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const content = fs.readFileSync(this.logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.length > 0);

    return lines
      .map(line => JSON.parse(line))
      .filter(entry => entry.component.includes(component))
      .reverse();
  }
}

export default { DecisionTracker, RationaleLogger };
