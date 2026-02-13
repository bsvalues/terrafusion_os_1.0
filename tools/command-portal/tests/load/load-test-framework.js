/**
 * TerraFusion Load Testing Execution Framework
 * 
 * Automated execution and reporting for government-grade load testing
 * Provides comprehensive performance validation across all critical systems
 * 
 * THE TERRAFUSION WAY: Systematic performance excellence
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class TerraFusionLoadTestFramework {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = new Map();
        this.governmentStandards = {
            maxResponseTime: 2000,      // 2 seconds max response
            minSuccessRate: 99.5,       // 99.5% success rate minimum
            maxErrorRate: 0.5,          // 0.5% error rate maximum
            emergencyResponseMax: 500,   // 500ms max emergency response
            federationLatencyMax: 100,   // 100ms max federation latency
        };
        this.testSuites = [
            'k6-government-load-test.js',
            'terrafusion-load-test.js'
        ];
    }

    /**
     * Execute comprehensive load testing suite
     */
    async executeLoadTests() {
        console.log('🚀 TerraFusion Load Testing Framework - Starting Government-Scale Validation');
        console.log('=' .repeat(80));
        
        try {
            // Pre-test validation
            await this.validateTestEnvironment();
            
            // Execute all test suites
            for (const testSuite of this.testSuites) {
                console.log(`\n📊 Executing Test Suite: ${testSuite}`);
                await this.executeTestSuite(testSuite);
            }
            
            // Generate comprehensive report
            await this.generatePerformanceReport();
            
            // Validate against government standards
            const compliance = await this.validateGovernmentCompliance();
            
            console.log('\n✅ Load Testing Framework Execution Complete');
            return compliance;
            
        } catch (error) {
            console.error('❌ Load Testing Framework Failed:', error.message);
            throw error;
        }
    }

    /**
     * Validate test environment readiness
     */
    async validateTestEnvironment() {
        console.log('🔍 Validating Test Environment...');
        
        // Check k6 installation
        try {
            await this.executeCommand('k6 version');
            console.log('✅ K6 load testing framework detected');
        } catch (error) {
            throw new Error('K6 load testing framework not installed. Please install k6.');
        }
        
        // Check backend service availability
        try {
            const response = await fetch('http://localhost:8787/health');
            if (response.ok) {
                console.log('✅ Backend service operational on port 8787');
            } else {
                throw new Error('Backend service not responding');
            }
        } catch (error) {
            console.log('⚠️  Backend service not available - some tests may fail');
        }
        
        // Check frontend service availability
        try {
            const response = await fetch('http://localhost:5177');
            if (response.ok) {
                console.log('✅ Frontend service operational on port 5177');
            } else {
                throw new Error('Frontend service not responding');
            }
        } catch (error) {
            console.log('⚠️  Frontend service not available - some tests may fail');
        }
        
        // Create results directory
        await fs.mkdir('./test-results', { recursive: true });
        console.log('✅ Test results directory prepared');
    }

    /**
     * Execute individual test suite
     */
    async executeTestSuite(testFile) {
        const testPath = path.join('./tests/load', testFile);
        
        try {
            // Check if test file exists
            await fs.access(testPath);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const outputFile = `./test-results/${testFile.replace('.js', '')}-${timestamp}.json`;
            
            console.log(`📈 Running ${testFile}...`);
            
            // Execute k6 test with JSON output
            const command = `k6 run --out json=${outputFile} ${testPath}`;
            const result = await this.executeCommand(command);
            
            // Parse and store results
            const testResults = await this.parseTestResults(outputFile);
            this.testResults.push({
                testSuite: testFile,
                timestamp: timestamp,
                results: testResults,
                outputFile: outputFile
            });
            
            console.log(`✅ ${testFile} execution completed`);
            
        } catch (error) {
            console.error(`❌ Failed to execute ${testFile}:`, error.message);
            throw error;
        }
    }

    /**
     * Parse K6 test results from JSON output
     */
    async parseTestResults(outputFile) {
        try {
            const rawData = await fs.readFile(outputFile, 'utf8');
            const lines = rawData.trim().split('\n');
            const metrics = new Map();
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === 'Point' && data.metric) {
                        const metricName = data.metric;
                        if (!metrics.has(metricName)) {
                            metrics.set(metricName, []);
                        }
                        metrics.get(metricName).push(data.data);
                    }
                } catch (parseError) {
                    // Skip invalid JSON lines
                    continue;
                }
            }
            
            return this.calculateMetricSummary(metrics);
            
        } catch (error) {
            console.error('Failed to parse test results:', error.message);
            return {};
        }
    }

    /**
     * Calculate metric summaries for performance analysis
     */
    calculateMetricSummary(metrics) {
        const summary = {};
        
        for (const [metricName, dataPoints] of metrics) {
            if (dataPoints.length === 0) continue;
            
            const values = dataPoints.map(dp => dp.value).filter(v => v != null);
            if (values.length === 0) continue;
            
            values.sort((a, b) => a - b);
            
            summary[metricName] = {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                p50: this.percentile(values, 0.5),
                p90: this.percentile(values, 0.9),
                p95: this.percentile(values, 0.95),
                p99: this.percentile(values, 0.99)
            };
        }
        
        return summary;
    }

    /**
     * Calculate percentile values
     */
    percentile(values, p) {
        const index = Math.ceil(values.length * p) - 1;
        return values[Math.max(0, index)];
    }

    /**
     * Generate comprehensive performance report
     */
    async generatePerformanceReport() {
        console.log('\n📋 Generating Performance Report...');
        
        const report = {
            executionTimestamp: new Date().toISOString(),
            systemInfo: {
                platform: os.platform(),
                architecture: os.arch(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                cpuCount: os.cpus().length
            },
            testSuites: this.testResults,
            performanceSummary: this.generatePerformanceSummary(),
            governmentCompliance: await this.validateGovernmentCompliance()
        };
        
        // Save detailed JSON report
        const reportFile = `./test-results/terrafusion-performance-report-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Generate human-readable summary
        const summaryFile = `./test-results/performance-summary-${Date.now()}.md`;
        await this.generateMarkdownSummary(report, summaryFile);
        
        console.log(`✅ Performance report saved: ${reportFile}`);
        console.log(`📄 Summary report saved: ${summaryFile}`);
    }

    /**
     * Generate performance summary statistics
     */
    generatePerformanceSummary() {
        const summary = {
            totalTestsExecuted: this.testResults.length,
            overallMetrics: new Map(),
            criticalIssues: [],
            performanceHighlights: []
        };
        
        // Aggregate metrics across all test suites
        for (const testResult of this.testResults) {
            for (const [metricName, metricData] of Object.entries(testResult.results)) {
                if (!summary.overallMetrics.has(metricName)) {
                    summary.overallMetrics.set(metricName, []);
                }
                summary.overallMetrics.get(metricName).push(metricData);
            }
        }
        
        return Object.fromEntries(summary.overallMetrics);
    }

    /**
     * Validate performance against government compliance standards
     */
    async validateGovernmentCompliance() {
        console.log('\n🏛️  Validating Government Compliance Standards...');
        
        const compliance = {
            overallCompliant: true,
            checks: [],
            criticalFailures: [],
            recommendations: []
        };
        
        for (const testResult of this.testResults) {
            const results = testResult.results;
            
            // Check HTTP request duration compliance
            if (results.http_req_duration) {
                const check = {
                    standard: 'Maximum Response Time',
                    required: `${this.governmentStandards.maxResponseTime}ms`,
                    actual: `${Math.round(results.http_req_duration.p95)}ms (95th percentile)`,
                    compliant: results.http_req_duration.p95 <= this.governmentStandards.maxResponseTime
                };
                compliance.checks.push(check);
                
                if (!check.compliant) {
                    compliance.overallCompliant = false;
                    compliance.criticalFailures.push(`Response time exceeds government standard: ${check.actual}`);
                }
            }
            
            // Check success rate compliance
            if (results.http_req_failed) {
                const failureRate = (results.http_req_failed.count / 
                    (results.http_reqs ? results.http_reqs.count : 1)) * 100;
                const successRate = 100 - failureRate;
                
                const check = {
                    standard: 'Minimum Success Rate',
                    required: `${this.governmentStandards.minSuccessRate}%`,
                    actual: `${successRate.toFixed(2)}%`,
                    compliant: successRate >= this.governmentStandards.minSuccessRate
                };
                compliance.checks.push(check);
                
                if (!check.compliant) {
                    compliance.overallCompliant = false;
                    compliance.criticalFailures.push(`Success rate below government standard: ${check.actual}`);
                }
            }
            
            // Check emergency response time (if available)
            if (results.emergency_response_time) {
                const check = {
                    standard: 'Emergency Response Time',
                    required: `${this.governmentStandards.emergencyResponseMax}ms`,
                    actual: `${Math.round(results.emergency_response_time.p90)}ms (90th percentile)`,
                    compliant: results.emergency_response_time.p90 <= this.governmentStandards.emergencyResponseMax
                };
                compliance.checks.push(check);
                
                if (!check.compliant) {
                    compliance.overallCompliant = false;
                    compliance.criticalFailures.push(`Emergency response time exceeds standard: ${check.actual}`);
                }
            }
        }
        
        // Generate recommendations
        if (compliance.criticalFailures.length > 0) {
            compliance.recommendations.push('Optimize database queries and caching strategies');
            compliance.recommendations.push('Implement content delivery network (CDN) for static assets');
            compliance.recommendations.push('Scale horizontal infrastructure for peak load handling');
            compliance.recommendations.push('Enable response compression and HTTP/2');
        }
        
        console.log(compliance.overallCompliant ? 
            '✅ All government compliance standards met' : 
            `❌ ${compliance.criticalFailures.length} compliance violations detected`);
        
        return compliance;
    }

    /**
     * Generate markdown summary report
     */
    async generateMarkdownSummary(report, filePath) {
        const markdown = `
# TerraFusion Performance Testing Report

**Execution Date:** ${report.executionTimestamp}  
**System:** ${report.systemInfo.platform} ${report.systemInfo.architecture}  
**Test Suites Executed:** ${report.testSuites.length}

## Government Compliance Status

${report.governmentCompliance.overallCompliant ? 
    '✅ **COMPLIANT** - All government performance standards met' : 
    '❌ **NON-COMPLIANT** - Performance standards violations detected'}

### Compliance Checks

${report.governmentCompliance.checks.map(check => 
    `- **${check.standard}**: ${check.compliant ? '✅' : '❌'} Required: ${check.required}, Actual: ${check.actual}`
).join('\n')}

${report.governmentCompliance.criticalFailures.length > 0 ? `
### Critical Issues
${report.governmentCompliance.criticalFailures.map(issue => `- ❌ ${issue}`).join('\n')}
` : ''}

${report.governmentCompliance.recommendations.length > 0 ? `
### Recommendations
${report.governmentCompliance.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
` : ''}

## Test Suite Results

${report.testSuites.map(suite => `
### ${suite.testSuite}
- **Execution Time:** ${suite.timestamp}
- **Metrics Collected:** ${Object.keys(suite.results).length}
- **Results File:** ${suite.outputFile}
`).join('\n')}

## Performance Summary

Key performance metrics aggregated across all test suites:

${Object.entries(report.performanceSummary).map(([metric, data]) => 
    Array.isArray(data) && data.length > 0 ? `
- **${metric}**: Avg ${Math.round(data[0].avg)}ms, P95 ${Math.round(data[0].p95)}ms` : ''
).join('')}

---
*Generated by TerraFusion Load Testing Framework - THE TERRAFUSION WAY*
        `;
        
        await fs.writeFile(filePath, markdown);
    }

    /**
     * Execute shell command with promise
     */
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            const child = spawn('sh', ['-c', command], { stdio: 'pipe' });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });
        });
    }
}

// Execute load testing framework if called directly
if (require.main === module) {
    const framework = new TerraFusionLoadTestFramework();
    
    framework.executeLoadTests()
        .then(compliance => {
            console.log('\n🎉 TerraFusion Load Testing Framework - Execution Complete!');
            console.log('Government Compliance:', compliance.overallCompliant ? 'PASSED' : 'FAILED');
            process.exit(compliance.overallCompliant ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Load Testing Framework Failed:', error.message);
            process.exit(1);
        });
}

module.exports = TerraFusionLoadTestFramework;