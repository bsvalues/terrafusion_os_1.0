// CAFÉ-Veritas Intelligent Validation Engine
// Provides smart discrepancy analysis and actionable guidance

export interface ValidationDiscrepancy {
  type: 'math_error' | 'rate_deviation' | 'historic_variance' | 'data_missing' | 'calculation_anomaly';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  recommendation: string;
  field: string;
  expectedValue?: number;
  actualValue?: number;
  variance?: number;
  historicalContext?: {
    lastYearValue?: number;
    averageValue?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface IntelligentValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 score
  discrepancies: ValidationDiscrepancy[];
  summary: string;
  actionItems: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class IntelligentValidationEngine {
  
  analyzeRecord(record: any, year: string, historicalData?: any[]): IntelligentValidationResult {
    const discrepancies: ValidationDiscrepancy[] = [];
    let confidence = 1.0;
    
    // Core PILT calculation validation
    const expectedAmount = this.calculateExpectedPILT(record);
    const actualAmount = record.amount || record.pilt_received || 0;
    const variance = Math.abs(expectedAmount - actualAmount);
    const variancePercent = expectedAmount > 0 ? (variance / expectedAmount) * 100 : 0;
    
    // Mathematical error detection
    if (variancePercent > 15) {
      discrepancies.push({
        type: 'math_error',
        severity: 'critical',
        description: `PILT amount deviates ${variancePercent.toFixed(1)}% from calculated expected value`,
        recommendation: 'Verify assessed value and levy rate calculations. Check for data entry errors.',
        field: 'pilt_amount',
        expectedValue: expectedAmount,
        actualValue: actualAmount,
        variance: variancePercent
      });
      confidence -= 0.3;
    } else if (variancePercent > 5) {
      discrepancies.push({
        type: 'calculation_anomaly',
        severity: 'warning',
        description: `Minor calculation variance of ${variancePercent.toFixed(1)}%`,
        recommendation: 'Review calculation methodology or consider rounding differences.',
        field: 'pilt_amount',
        expectedValue: expectedAmount,
        actualValue: actualAmount,
        variance: variancePercent
      });
      confidence -= 0.1;
    }
    
    // Levy rate validation
    if (record.levy_rate) {
      if (record.levy_rate > 10) {
        discrepancies.push({
          type: 'rate_deviation',
          severity: 'critical',
          description: `Levy rate of ${record.levy_rate}% appears unusually high`,
          recommendation: 'Verify levy rate is expressed correctly (as percentage vs decimal).',
          field: 'levy_rate'
        });
        confidence -= 0.2;
      } else if (record.levy_rate < 0.1) {
        discrepancies.push({
          type: 'rate_deviation',
          severity: 'warning',
          description: `Levy rate of ${record.levy_rate}% appears unusually low`,
          recommendation: 'Confirm levy rate accuracy with district records.',
          field: 'levy_rate'
        });
        confidence -= 0.1;
      }
    }
    
    // Historical comparison
    if (historicalData && historicalData.length > 0) {
      const lastYearRecord = historicalData.find(h => h.year === (parseInt(year) - 1).toString());
      if (lastYearRecord) {
        const yearOverYearChange = actualAmount > 0 && lastYearRecord.amount > 0 
          ? ((actualAmount - lastYearRecord.amount) / lastYearRecord.amount) * 100 
          : 0;
        
        if (Math.abs(yearOverYearChange) > 50) {
          discrepancies.push({
            type: 'historic_variance',
            severity: yearOverYearChange > 100 ? 'critical' : 'warning',
            description: `PILT amount changed ${yearOverYearChange.toFixed(1)}% from previous year`,
            recommendation: 'Investigate significant year-over-year changes. Verify assessed value updates or district boundary changes.',
            field: 'pilt_amount',
            historicalContext: {
              lastYearValue: lastYearRecord.amount,
              trend: yearOverYearChange > 0 ? 'increasing' : 'decreasing'
            }
          });
          confidence -= yearOverYearChange > 100 ? 0.3 : 0.15;
        }
      }
    }
    
    // Data completeness check
    const requiredFields = ['district', 'assessed_value', 'levy_rate', 'amount'];
    const missingFields = requiredFields.filter(field => !record[field] && record[field] !== 0);
    
    if (missingFields.length > 0) {
      discrepancies.push({
        type: 'data_missing',
        severity: 'critical',
        description: `Missing required fields: ${missingFields.join(', ')}`,
        recommendation: 'Complete all required data fields before validation.',
        field: missingFields[0]
      });
      confidence -= 0.4;
    }
    
    // Generate summary and action items
    const summary = this.generateSummary(discrepancies, confidence);
    const actionItems = this.generateActionItems(discrepancies);
    const riskLevel = this.assessRiskLevel(discrepancies, confidence);
    
    return {
      isValid: discrepancies.filter(d => d.severity === 'critical').length === 0,
      confidence: Math.max(0, confidence),
      discrepancies,
      summary,
      actionItems,
      riskLevel
    };
  }
  
  private calculateExpectedPILT(record: any): number {
    const assessedValue = record.assessed_value || 0;
    const levyRate = record.levy_rate || 0;
    
    // Standard PILT calculation: (Assessed Value × Levy Rate) ÷ 1000
    return (assessedValue * levyRate) / 1000;
  }
  
  private generateSummary(discrepancies: ValidationDiscrepancy[], confidence: number): string {
    if (discrepancies.length === 0) {
      return `Validation passed with ${(confidence * 100).toFixed(0)}% confidence. No issues detected.`;
    }
    
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
    
    if (criticalCount > 0) {
      return `Critical validation issues detected (${criticalCount} critical, ${warningCount} warnings). Immediate attention required.`;
    } else {
      return `Minor validation concerns identified (${warningCount} warnings). Review recommended.`;
    }
  }
  
  private generateActionItems(discrepancies: ValidationDiscrepancy[]): string[] {
    const actions: string[] = [];
    
    discrepancies.forEach(d => {
      if (d.type === 'math_error') {
        actions.push('Recalculate PILT amount using verified assessed value and levy rate');
      } else if (d.type === 'rate_deviation') {
        actions.push('Verify levy rate with district treasurer or tax authority');
      } else if (d.type === 'historic_variance') {
        actions.push('Investigate reason for significant year-over-year change');
      } else if (d.type === 'data_missing') {
        actions.push('Complete missing data fields from authoritative sources');
      }
    });
    
    // Add general recommendations
    if (discrepancies.some(d => d.severity === 'critical')) {
      actions.push('Contact district officials to resolve critical issues before submission');
    }
    
    return Array.from(new Set(actions)); // Remove duplicates
  }
  
  private assessRiskLevel(discrepancies: ValidationDiscrepancy[], confidence: number): 'low' | 'medium' | 'high' {
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    
    if (criticalCount > 0 || confidence < 0.5) {
      return 'high';
    } else if (discrepancies.length > 0 || confidence < 0.8) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  // Batch validation with intelligent prioritization
  validateBatch(records: any[], year: string, historicalData?: any[]): {
    results: IntelligentValidationResult[];
    prioritizedIssues: ValidationDiscrepancy[];
    overallRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const results = records.map(record => this.analyzeRecord(record, year, historicalData));
    
    // Collect and prioritize all discrepancies
    const allDiscrepancies = results.flatMap(r => r.discrepancies);
    const prioritizedIssues = allDiscrepancies
      .sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10); // Top 10 priority issues
    
    // Assess overall risk
    const criticalCount = allDiscrepancies.filter(d => d.severity === 'critical').length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (criticalCount > records.length * 0.1 || averageConfidence < 0.6) {
      overallRisk = 'high';
    } else if (criticalCount > 0 || averageConfidence < 0.8) {
      overallRisk = 'medium';
    }
    
    // Generate batch recommendations
    const recommendations = this.generateBatchRecommendations(allDiscrepancies, results.length);
    
    return {
      results,
      prioritizedIssues,
      overallRisk,
      recommendations
    };
  }
  
  private generateBatchRecommendations(discrepancies: ValidationDiscrepancy[], totalRecords: number): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
    const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
    
    if (criticalCount > totalRecords * 0.2) {
      recommendations.push('Consider reviewing data collection procedures - high error rate detected');
    }
    
    if (discrepancies.filter(d => d.type === 'rate_deviation').length > 3) {
      recommendations.push('Verify levy rate data source - multiple rate discrepancies found');
    }
    
    if (discrepancies.filter(d => d.type === 'historic_variance').length > totalRecords * 0.3) {
      recommendations.push('Investigate systematic changes affecting multiple districts');
    }
    
    return recommendations;
  }
}