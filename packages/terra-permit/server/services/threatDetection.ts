import { EventEmitter } from 'events';

export interface ThreatEvent {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'anomaly' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  timestamp: Date;
  description: string;
  indicators: string[];
  mitigated: boolean;
  mitigationActions: string[];
}

export interface ThreatPattern {
  name: string;
  indicators: string[];
  severity: ThreatEvent['severity'];
  autoMitigate: boolean;
  actions: string[];
}

export class AdvancedThreatDetectionService extends EventEmitter {
  private threatPatterns: ThreatPattern[] = [];
  private detectedThreats: Map<string, ThreatEvent> = new Map();
  private monitoringActive: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeThreatPatterns();
    console.log('[ThreatDetection] Advanced threat detection service initialized');
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        name: 'Brute Force Attack',
        indicators: ['multiple_failed_logins', 'rapid_authentication_attempts'],
        severity: 'high',
        autoMitigate: true,
        actions: ['block_ip', 'increase_lockout_duration', 'alert_admin']
      },
      {
        name: 'Unauthorized Data Access',
        indicators: ['unusual_data_volume', 'off_hours_access', 'privilege_escalation'],
        severity: 'critical',
        autoMitigate: true,
        actions: ['revoke_session', 'alert_security_team', 'quarantine_user']
      },
      {
        name: 'SQL Injection Attempt',
        indicators: ['malicious_sql_patterns', 'database_error_spike'],
        severity: 'high',
        autoMitigate: true,
        actions: ['block_request', 'sanitize_inputs', 'alert_admin']
      },
      {
        name: 'Compliance Violation',
        indicators: ['encryption_disabled', 'audit_log_tampering', 'policy_bypass'],
        severity: 'medium',
        autoMitigate: false,
        actions: ['document_violation', 'notify_compliance_officer']
      },
      {
        name: 'Anomalous System Behavior',
        indicators: ['unusual_resource_usage', 'unexpected_network_traffic'],
        severity: 'medium',
        autoMitigate: false,
        actions: ['monitor_closely', 'collect_forensics']
      }
    ];

    console.log(`[ThreatDetection] Loaded ${this.threatPatterns.length} threat patterns`);
  }

  startMonitoring(): void {
    if (this.monitoringActive) return;

    this.monitoringActive = true;
    this.scanInterval = setInterval(() => {
      this.performThreatScan();
    }, 30000); // Scan every 30 seconds

    console.log('[ThreatDetection] Threat monitoring activated');
    this.emit('monitoring_started');
  }

  stopMonitoring(): void {
    if (!this.monitoringActive) return;

    this.monitoringActive = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    console.log('[ThreatDetection] Threat monitoring deactivated');
    this.emit('monitoring_stopped');
  }

  private async performThreatScan(): Promise<void> {
    const currentIndicators = await this.collectSecurityIndicators();
    
    for (const pattern of this.threatPatterns) {
      const matchedIndicators = pattern.indicators.filter(
        indicator => currentIndicators.includes(indicator)
      );

      if (matchedIndicators.length > 0) {
        const threat = await this.createThreatEvent(pattern, matchedIndicators);
        this.detectedThreats.set(threat.id, threat);
        
        console.warn(`[ThreatDetection] Threat detected: ${threat.type} (${threat.severity})`);
        this.emit('threat_detected', threat);

        if (pattern.autoMitigate) {
          await this.automaticMitigation(threat);
        }
      }
    }
  }

  private async collectSecurityIndicators(): Promise<string[]> {
    const indicators: string[] = [];
    
    // Simulate various security monitoring checks
    
    // Authentication monitoring
    const failedLogins = Math.floor(Math.random() * 10);
    if (failedLogins > 5) {
      indicators.push('multiple_failed_logins');
    }
    
    // Time-based anomaly detection
    const currentHour = new Date().getHours();
    if ((currentHour < 6 || currentHour > 22) && Math.random() > 0.8) {
      indicators.push('off_hours_access');
    }
    
    // Resource usage monitoring
    const cpuUsage = Math.random() * 100;
    if (cpuUsage > 90) {
      indicators.push('unusual_resource_usage');
    }
    
    // Network traffic analysis
    if (Math.random() > 0.95) {
      indicators.push('unexpected_network_traffic');
    }
    
    // SQL injection detection
    if (Math.random() > 0.98) {
      indicators.push('malicious_sql_patterns');
    }
    
    // Compliance monitoring
    if (Math.random() > 0.97) {
      indicators.push('encryption_disabled');
    }

    return indicators;
  }

  private async createThreatEvent(pattern: ThreatPattern, indicators: string[]): Promise<ThreatEvent> {
    const threat: ThreatEvent = {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapPatternToThreatType(pattern.name),
      severity: pattern.severity,
      source: 'internal_monitoring',
      target: 'permit_system',
      timestamp: new Date(),
      description: `${pattern.name} detected with indicators: ${indicators.join(', ')}`,
      indicators,
      mitigated: false,
      mitigationActions: []
    };

    return threat;
  }

  private mapPatternToThreatType(patternName: string): ThreatEvent['type'] {
    const mapping: Record<string, ThreatEvent['type']> = {
      'Brute Force Attack': 'unauthorized_access',
      'Unauthorized Data Access': 'data_breach',
      'SQL Injection Attempt': 'malware',
      'Compliance Violation': 'policy_violation',
      'Anomalous System Behavior': 'anomaly'
    };
    
    return mapping[patternName] || 'anomaly';
  }

  private async automaticMitigation(threat: ThreatEvent): Promise<void> {
    console.log(`[ThreatDetection] Initiating automatic mitigation for ${threat.type}`);
    
    const pattern = this.threatPatterns.find(p => 
      this.mapPatternToThreatType(p.name) === threat.type
    );
    
    if (!pattern) return;

    for (const action of pattern.actions) {
      try {
        await this.executeMitigationAction(action, threat);
        threat.mitigationActions.push(action);
      } catch (error) {
        console.error(`[ThreatDetection] Mitigation action failed: ${action}`, error);
      }
    }

    threat.mitigated = true;
    console.log(`[ThreatDetection] Automatic mitigation completed for ${threat.id}`);
    this.emit('threat_mitigated', threat);
  }

  private async executeMitigationAction(action: string, threat: ThreatEvent): Promise<void> {
    switch (action) {
      case 'block_ip':
        console.log(`[ThreatDetection] Blocking suspicious IP address`);
        // Would integrate with firewall/security system
        break;
        
      case 'revoke_session':
        console.log(`[ThreatDetection] Revoking user session`);
        // Would invalidate user sessions
        break;
        
      case 'quarantine_user':
        console.log(`[ThreatDetection] Quarantining user account`);
        // Would disable user account temporarily
        break;
        
      case 'block_request':
        console.log(`[ThreatDetection] Blocking malicious request`);
        // Would block specific request patterns
        break;
        
      case 'alert_admin':
      case 'alert_security_team':
        console.log(`[ThreatDetection] Sending security alert`);
        this.sendSecurityAlert(threat);
        break;
        
      case 'document_violation':
        console.log(`[ThreatDetection] Documenting compliance violation`);
        // Would log to compliance system
        break;
        
      case 'collect_forensics':
        console.log(`[ThreatDetection] Collecting forensic data`);
        // Would capture system state for analysis
        break;
        
      default:
        console.log(`[ThreatDetection] Executing custom action: ${action}`);
    }
    
    // Simulate action execution time
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private sendSecurityAlert(threat: ThreatEvent): void {
    const alert = {
      timestamp: new Date(),
      threatId: threat.id,
      severity: threat.severity,
      message: `Security threat detected: ${threat.description}`,
      indicators: threat.indicators,
      recommendedActions: this.getRecommendedActions(threat)
    };

    console.log(`[ThreatDetection] Security alert sent:`, alert);
    this.emit('security_alert', alert);
  }

  private getRecommendedActions(threat: ThreatEvent): string[] {
    const actions: Record<ThreatEvent['type'], string[]> = {
      unauthorized_access: [
        'Review user access logs',
        'Verify user credentials',
        'Consider multi-factor authentication enforcement'
      ],
      data_breach: [
        'Immediately review data access patterns',
        'Audit user permissions',
        'Consider data encryption upgrade'
      ],
      malware: [
        'Run full system scan',
        'Update security definitions',
        'Review input validation'
      ],
      policy_violation: [
        'Review compliance policies',
        'Retrain users on security protocols',
        'Update policy enforcement mechanisms'
      ],
      anomaly: [
        'Monitor system behavior closely',
        'Collect additional forensic data',
        'Consider system health check'
      ]
    };

    return actions[threat.type] || ['Review system logs', 'Contact security team'];
  }

  async getThreatSummary(): Promise<{
    totalThreats: number;
    activethreats: number;
    mitigatedThreats: number;
    severityBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  }> {
    const threats = Array.from(this.detectedThreats.values());
    
    return {
      totalThreats: threats.length,
      activethreats: threats.filter(t => !t.mitigated).length,
      mitigatedThreats: threats.filter(t => t.mitigated).length,
      severityBreakdown: {
        critical: threats.filter(t => t.severity === 'critical').length,
        high: threats.filter(t => t.severity === 'high').length,
        medium: threats.filter(t => t.severity === 'medium').length,
        low: threats.filter(t => t.severity === 'low').length
      },
      typeBreakdown: {
        unauthorized_access: threats.filter(t => t.type === 'unauthorized_access').length,
        data_breach: threats.filter(t => t.type === 'data_breach').length,
        malware: threats.filter(t => t.type === 'malware').length,
        policy_violation: threats.filter(t => t.type === 'policy_violation').length,
        anomaly: threats.filter(t => t.type === 'anomaly').length
      }
    };
  }

  getRecentThreats(limit: number = 10): ThreatEvent[] {
    return Array.from(this.detectedThreats.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  isMonitoring(): boolean {
    return this.monitoringActive;
  }
}

// Export singleton instance
export const threatDetectionService = new AdvancedThreatDetectionService();