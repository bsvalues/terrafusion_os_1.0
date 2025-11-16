const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const http = require('http');
const fs = require('fs');
const path = require('path');

class TerraFusionLoadTest {
    constructor() {
        this.config = {
            apiUrl: 'http://localhost:5000',
            wsUrl: 'ws://localhost:7000/terrafusion/core',
            maxConnections: 50,
            messageCount: 1000,
            testDuration: 300000, // 5 minutes
            county: 'benton'
        };
        
        this.metrics = {
            connectionTime: [],
            messageLatency: [],
            pluginLoadTime: [],
            harrisImportTime: [],
            errorCount: 0,
            totalRequests: 0,
            successfulRequests: 0
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            environment: 'production',
            county: 'benton',
            testConfig: this.config,
            performance: {},
            status: 'RUNNING'
        };
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    async runProductionTest() {
        this.log('🔥 TERRAFUSION OS PRODUCTION LOAD TEST INITIATED');
        this.log(`County: ${this.config.county}`);
        this.log(`Max Connections: ${this.config.maxConnections}`);
        this.log(`Test Duration: ${this.config.testDuration / 1000}s`);
        this.log('═══════════════════════════════════════════════');
        
        try {
            // Test 1: API Health Check
            await this.testApiHealth();
            
            // Test 2: Concurrent WebSocket connections
            await this.testConcurrentConnections(this.config.maxConnections);
            
            // Test 3: Message throughput
            await this.testMessageThroughput(this.config.messageCount);
            
            // Test 4: Plugin operations under load
            await this.testPluginOperations();
            
            // Test 5: Harris PACS import performance
            await this.testHarrisImportPerformance();
            
            // Test 6: System monitoring under load
            await this.testMonitoringSystem();
            
            // Test 7: Sustained load test
            await this.testSustainedLoad();
            
            this.generateReport();
            
        } catch (error) {
            this.log(`❌ Load test failed: ${error.message}`);
            this.results.status = 'FAILED';
            this.results.error = error.message;
            this.generateReport();
            process.exit(1);
        }
    }

    async testApiHealth() {
        this.log('Testing API health endpoints...');
        
        const endpoints = [
            '/health',
            '/terrafusion/core/negotiate',
            '/api/system/status'
        ];
        
        for (const endpoint of endpoints) {
            const startTime = performance.now();
            
            try {
                const response = await this.httpRequest('GET', endpoint);
                const responseTime = performance.now() - startTime;
                
                if (response.statusCode === 200) {
                    this.log(`✓ ${endpoint}: ${responseTime.toFixed(2)}ms`);
                    this.metrics.successfulRequests++;
                } else {
                    this.log(`⚠ ${endpoint}: HTTP ${response.statusCode}`);
                    this.metrics.errorCount++;
                }
                
                this.metrics.totalRequests++;
                
            } catch (error) {
                this.log(`✗ ${endpoint}: ${error.message}`);
                this.metrics.errorCount++;
                this.metrics.totalRequests++;
            }
        }
    }

    async testConcurrentConnections(count) {
        this.log(`Testing ${count} concurrent WebSocket connections...`);
        
        const connections = [];
        const connectionPromises = [];
        const startTime = performance.now();
        
        for (let i = 0; i < count; i++) {
            const connectionPromise = new Promise((resolve, reject) => {
                const ws = new WebSocket(this.config.wsUrl);
                const connectionStart = performance.now();
                
                ws.on('open', () => {
                    const connectionTime = performance.now() - connectionStart;
                    this.metrics.connectionTime.push(connectionTime);
                    connections.push(ws);
                    resolve(connectionTime);
                });
                
                ws.on('error', (error) => {
                    this.metrics.errorCount++;
                    reject(error);
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
            });
            
            connectionPromises.push(connectionPromise);
        }
        
        try {
            await Promise.all(connectionPromises);
            const totalTime = performance.now() - startTime;
            const avgConnectionTime = this.average(this.metrics.connectionTime);
            
            this.log(`✓ ${count} connections established in ${totalTime.toFixed(2)}ms`);
            this.log(`✓ Average connection time: ${avgConnectionTime.toFixed(2)}ms`);
            
            // Test connection stability
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const activeConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN);
            this.log(`✓ ${activeConnections.length}/${count} connections still active after 5s`);
            
            // Cleanup connections
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
            
        } catch (error) {
            this.log(`✗ Connection test failed: ${error.message}`);
            throw error;
        }
    }

    async testMessageThroughput(messageCount) {
        this.log(`Testing message throughput with ${messageCount} messages...`);
        
        const ws = new WebSocket(this.config.wsUrl);
        
        return new Promise((resolve, reject) => {
            let messagesReceived = 0;
            const messageLatencies = [];
            const startTime = performance.now();
            
            ws.on('open', () => {
                this.log('✓ WebSocket connected for throughput test');
                
                // Send messages rapidly
                for (let i = 0; i < messageCount; i++) {
                    const messageStart = performance.now();
                    const message = {
                        type: 'PluginInvoke',
                        moduleName: 'cama-core',
                        method: 'ping',
                        payload: { messageId: i, timestamp: messageStart }
                    };
                    
                    ws.send(JSON.stringify(message));
                }
            });
            
            ws.on('message', (data) => {
                const receiveTime = performance.now();
                messagesReceived++;
                
                try {
                    const response = JSON.parse(data);
                    if (response.result && response.result.timestamp) {
                        const latency = receiveTime - response.result.timestamp;
                        messageLatencies.push(latency);
                    }
                } catch (error) {
                    // Ignore parsing errors for this test
                }
                
                if (messagesReceived >= messageCount) {
                    const totalTime = performance.now() - startTime;
                    const throughput = (messageCount / totalTime) * 1000; // messages per second
                    const avgLatency = this.average(messageLatencies);
                    
                    this.log(`✓ ${messagesReceived}/${messageCount} messages processed`);
                    this.log(`✓ Throughput: ${throughput.toFixed(2)} messages/second`);
                    this.log(`✓ Average latency: ${avgLatency.toFixed(2)}ms`);
                    
                    this.metrics.messageLatency = messageLatencies;
                    
                    ws.close();
                    resolve();
                }
            });
            
            ws.on('error', (error) => {
                this.log(`✗ WebSocket error: ${error.message}`);
                reject(error);
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (messagesReceived < messageCount) {
                    reject(new Error(`Timeout: only ${messagesReceived}/${messageCount} messages received`));
                }
            }, 30000);
        });
    }

    async testPluginOperations() {
        this.log('Testing plugin operations under load...');
        
        const plugins = [
            { name: 'cama-core', method: 'ping' },
            { name: 'levy-core', method: 'calculate' },
            { name: 'gis-core', method: 'loadParcels' },
            { name: 'valuation-tools', method: 'predict' },
            { name: 'harris-pacs', method: 'importStatus' }
        ];
        
        const ws = new WebSocket(this.config.wsUrl);
        
        return new Promise((resolve, reject) => {
            let operationsCompleted = 0;
            const totalOperations = plugins.length * 10; // 10 operations per plugin
            const pluginTimes = [];
            
            ws.on('open', () => {
                this.log('✓ WebSocket connected for plugin testing');
                
                plugins.forEach((plugin, pluginIndex) => {
                    for (let i = 0; i < 10; i++) {
                        const operationStart = performance.now();
                        
                        const message = {
                            type: 'PluginInvoke',
                            moduleName: plugin.name,
                            method: plugin.method,
                            payload: { testId: `${pluginIndex}-${i}`, timestamp: operationStart }
                        };
                        
                        ws.send(JSON.stringify(message));
                    }
                });
            });
            
            ws.on('message', (data) => {
                const receiveTime = performance.now();
                operationsCompleted++;
                
                try {
                    const response = JSON.parse(data);
                    if (response.result && response.result.timestamp) {
                        const operationTime = receiveTime - response.result.timestamp;
                        pluginTimes.push(operationTime);
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
                
                if (operationsCompleted >= totalOperations) {
                    const avgPluginTime = this.average(pluginTimes);
                    
                    this.log(`✓ ${operationsCompleted} plugin operations completed`);
                    this.log(`✓ Average plugin response time: ${avgPluginTime.toFixed(2)}ms`);
                    
                    this.metrics.pluginLoadTime = pluginTimes;
                    
                    ws.close();
                    resolve();
                }
            });
            
            ws.on('error', reject);
            
            setTimeout(() => {
                if (operationsCompleted < totalOperations) {
                    reject(new Error(`Plugin test timeout: ${operationsCompleted}/${totalOperations} completed`));
                }
            }, 20000);
        });
    }

    async testHarrisImportPerformance() {
        this.log('Testing Harris PACS import performance...');
        
        const ws = new WebSocket(this.config.wsUrl);
        
        return new Promise((resolve, reject) => {
            ws.on('open', () => {
                const importStart = performance.now();
                
                // Test import status check
                const statusMessage = {
                    type: 'PluginInvoke',
                    moduleName: 'harris-pacs',
                    method: 'importStatus',
                    payload: { county: 'benton' }
                };
                
                ws.send(JSON.stringify(statusMessage));
                
                ws.on('message', (data) => {
                    const importTime = performance.now() - importStart;
                    
                    try {
                        const response = JSON.parse(data);
                        if (response.result && response.result.migrationStatus) {
                            this.log(`✓ Harris import status retrieved in ${importTime.toFixed(2)}ms`);
                            this.log(`✓ Migration completion: ${response.result.migrationStatus.completionPercentage}%`);
                            
                            this.metrics.harrisImportTime.push(importTime);
                            
                            ws.close();
                            resolve();
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            ws.on('error', reject);
            
            setTimeout(() => {
                reject(new Error('Harris import test timeout'));
            }, 10000);
        });
    }

    async testMonitoringSystem() {
        this.log('Testing system monitoring under load...');
        
        try {
            const response = await this.httpRequest('GET', '/api/system/metrics');
            
            if (response.statusCode === 200) {
                this.log('✓ System metrics endpoint responding');
                
                // Parse response if available
                if (response.data) {
                    const metrics = JSON.parse(response.data);
                    this.log(`✓ Current memory usage: ${metrics.memoryUsage || 'N/A'}`);
                    this.log(`✓ Active connections: ${metrics.activeConnections || 'N/A'}`);
                }
            } else {
                this.log(`⚠ System metrics returned HTTP ${response.statusCode}`);
            }
            
        } catch (error) {
            this.log(`⚠ Monitoring test failed: ${error.message}`);
        }
    }

    async testSustainedLoad() {
        this.log('Running sustained load test for 60 seconds...');
        
        const duration = 60000; // 1 minute
        const startTime = performance.now();
        const connections = [];
        const maxConcurrent = 20;
        
        // Create sustained connections
        for (let i = 0; i < maxConcurrent; i++) {
            const ws = new WebSocket(this.config.wsUrl);
            connections.push(ws);
            
            ws.on('open', () => {
                // Send periodic ping messages
                const interval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'PluginInvoke',
                            moduleName: 'cama-core',
                            method: 'ping',
                            payload: { sustainedTest: true }
                        }));
                    } else {
                        clearInterval(interval);
                    }
                }, 1000);
                
                // Clean up after test duration
                setTimeout(() => {
                    clearInterval(interval);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                }, duration);
            });
        }
        
        // Wait for test completion
        await new Promise(resolve => setTimeout(resolve, duration + 5000));
        
        const activeConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN);
        this.log(`✓ Sustained load test completed`);
        this.log(`✓ ${activeConnections.length}/${maxConcurrent} connections survived`);
        
        // Cleanup remaining connections
        connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
    }

    async httpRequest(method, path) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.config.apiUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    generateReport() {
        const errorRate = this.metrics.totalRequests > 0 ? 
            (this.metrics.errorCount / this.metrics.totalRequests) : 0;
        
        this.results.performance = {
            avgConnectionTime: this.average(this.metrics.connectionTime),
            maxConnectionTime: Math.max(...this.metrics.connectionTime),
            minConnectionTime: Math.min(...this.metrics.connectionTime),
            
            avgMessageLatency: this.average(this.metrics.messageLatency),
            maxMessageLatency: Math.max(...this.metrics.messageLatency),
            minMessageLatency: Math.min(...this.metrics.messageLatency),
            
            avgPluginLoadTime: this.average(this.metrics.pluginLoadTime),
            maxPluginLoadTime: Math.max(...this.metrics.pluginLoadTime),
            minPluginLoadTime: Math.min(...this.metrics.pluginLoadTime),
            
            avgHarrisImportTime: this.average(this.metrics.harrisImportTime),
            
            errorRate: errorRate,
            totalRequests: this.metrics.totalRequests,
            successfulRequests: this.metrics.successfulRequests,
            errorCount: this.metrics.errorCount
        };
        
        // Determine overall status
        const thresholds = {
            maxConnectionTime: 1000,    // 1 second
            maxMessageLatency: 100,     // 100ms
            maxPluginLoadTime: 500,     // 500ms
            maxErrorRate: 0.01          // 1%
        };
        
        const passed = 
            this.results.performance.avgConnectionTime < thresholds.maxConnectionTime &&
            this.results.performance.avgMessageLatency < thresholds.maxMessageLatency &&
            this.results.performance.avgPluginLoadTime < thresholds.maxPluginLoadTime &&
            this.results.performance.errorRate < thresholds.maxErrorRate;
        
        this.results.status = passed ? 'PASSED' : 'FAILED';
        this.results.thresholds = thresholds;
        
        // Generate report
        console.log('\n═══════════════════════════════════════════════');
        console.log('📊 TERRAFUSION OS PRODUCTION LOAD TEST REPORT');
        console.log('═══════════════════════════════════════════════');
        console.log(JSON.stringify(this.results, null, 2));
        console.log('═══════════════════════════════════════════════');
        
        if (this.results.status === 'PASSED') {
            this.log('🎉 LOAD TEST PASSED - SYSTEM READY FOR PRODUCTION');
        } else {
            this.log('❌ LOAD TEST FAILED - PERFORMANCE ISSUES DETECTED');
        }
        
        // Save report to file
        const reportPath = path.join(__dirname, '../../test-results', `load-test-${Date.now()}.json`);
        try {
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
            this.log(`📄 Report saved to: ${reportPath}`);
        } catch (error) {
            this.log(`⚠ Failed to save report: ${error.message}`);
        }
        
        return this.results;
    }
    
    average(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
}

// Execute load test if run directly
if (require.main === module) {
    const loadTest = new TerraFusionLoadTest();
    loadTest.runProductionTest().catch(error => {
        console.error('Load test execution failed:', error);
        process.exit(1);
    });
}

module.exports = TerraFusionLoadTest;
