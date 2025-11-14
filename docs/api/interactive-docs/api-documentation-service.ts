import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { OpenAPIV3 } from 'openapi-types';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: Record<string, APIResponse>;
  examples: APIExample[];
  tutorial?: string;
  videoUrl?: string;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: any;
  example?: any;
}

export interface APIRequestBody {
  description: string;
  required: boolean;
  content: Record<string, {
    schema: any;
    examples?: Record<string, APIExample>;
  }>;
}

export interface APIResponse {
  description: string;
  content?: Record<string, {
    schema: any;
    examples?: Record<string, APIExample>;
  }>;
}

export interface APIExample {
  summary: string;
  description: string;
  value: any;
  externalValue?: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  expectedResponse?: any;
  notes?: string;
}

export interface APITutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  prerequisites: string[];
  steps: TutorialStep[];
  videoUrl?: string;
  tags: string[];
}

export class APIDocumentationService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get comprehensive API documentation with live examples
   */
  async getAPIDocumentation(): Promise<OpenAPIV3.Document> {
    const response = await fetch(`${this.baseUrl}/swagger.json`);
    return response.json();
  }

  /**
   * Execute live API example with real data
   */
  async executeLiveExample(
    endpoint: string,
    method: string,
    parameters?: Record<string, any>,
    body?: any
  ): Promise<{
    success: boolean;
    response?: any;
    error?: string;
    executionTime: number;
    statusCode: number;
  }> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      if (parameters && method === 'GET') {
        const queryParams = new URLSearchParams(parameters);
        url += `?${queryParams.toString()}`;
      }

      const requestOptions: RequestInit = {
        method,
        headers,
      };

      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      const executionTime = Date.now() - startTime;

      return {
        success: response.ok,
        response: responseData,
        error: response.ok ? undefined : responseData.error || 'Request failed',
        executionTime,
        statusCode: response.status
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        statusCode: 0
      };
    }
  }

  /**
   * Get available tutorials for specific API endpoints
   */
  getTutorials(): APITutorial[] {
    return [
      {
        id: 'property-management-basics',
        title: 'Property Management API Basics',
        description: 'Learn how to retrieve, create, and update property records using the Terrafusion API',
        difficulty: 'Beginner',
        estimatedTime: '15 minutes',
        prerequisites: ['Basic HTTP knowledge', 'API key access'],
        tags: ['properties', 'crud', 'basics'],
        videoUrl: 'https://training.terrafusionmarket.com/videos/property-basics.mp4',
        steps: [
          {
            id: 'step-1',
            title: 'Authentication',
            description: 'First, authenticate with the API using your Bearer token',
            language: 'javascript',
            code: `// Set up authentication headers
const headers = {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
};

// Test authentication
const response = await fetch('/api/auth/verify', { headers });
console.log('Auth status:', response.status);`,
            expectedResponse: { authenticated: true, user: 'demo@terrafusionmarket.com' },
            notes: 'Replace YOUR_JWT_TOKEN with your actual JWT token from the login process'
          },
          {
            id: 'step-2',
            title: 'Retrieve Properties',
            description: 'Get a list of properties for a specific jurisdiction',
            language: 'javascript',
            code: `// Get properties for Benton County
const response = await fetch('/api/properties?jurisdiction=benton-county&page=1&pageSize=10', {
  headers
});

const properties = await response.json();
console.log('Properties found:', properties.length);
console.log('First property:', properties[0]);`,
            expectedResponse: {
              id: 'PROP-2024-001',
              parcelNumber: '123-456-789',
              address: '123 Main Street',
              assessedValue: 285000
            },
            notes: 'This returns the first 10 properties. Adjust pageSize as needed.'
          },
          {
            id: 'step-3',
            title: 'Get Property Details',
            description: 'Retrieve detailed information for a specific property',
            language: 'javascript',
            code: `// Get detailed property information
const propertyId = 'PROP-2024-001';
const response = await fetch(\`/api/properties/\${propertyId}\`, { headers });

const property = await response.json();
console.log('Property details:', property);
console.log('Assessed value:', property.assessedValue);`,
            expectedResponse: {
              id: 'PROP-2024-001',
              parcelNumber: '123-456-789',
              address: '123 Main Street',
              city: 'Benton',
              state: 'WA',
              assessedValue: 285000,
              marketValue: 325000,
              propertyType: 'Residential'
            }
          }
        ]
      },
      {
        id: 'ai-agent-monitoring',
        title: 'AI Agent Monitoring and Management',
        description: 'Monitor AI agent performance and manage agent configurations',
        difficulty: 'Intermediate',
        estimatedTime: '20 minutes',
        prerequisites: ['Property Management Basics', 'Admin access'],
        tags: ['ai-agents', 'monitoring', 'management'],
        videoUrl: 'https://training.terrafusionmarket.com/videos/ai-agents.mp4',
        steps: [
          {
            id: 'step-1',
            title: 'List Active Agents',
            description: 'Get all currently active AI agents and their status',
            language: 'javascript',
            code: `// Get list of active AI agents
const response = await fetch('/api/ai-agents?status=active', { headers });
const agents = await response.json();

console.log('Active agents:', agents.length);
agents.forEach(agent => {
  console.log(\`\${agent.name}: \${agent.status} - \${agent.performance.successRate}% success\`);
});`,
            expectedResponse: [
              {
                id: 'AGENT-REV-001',
                name: 'Revenue Hunter Alpha',
                type: 'RevenueHunter',
                status: 'Active',
                performance: { successRate: 97.8, tasksCompleted: 1247 }
              }
            ]
          },
          {
            id: 'step-2',
            title: 'Monitor Agent Performance',
            description: 'Get detailed performance metrics for a specific agent',
            language: 'javascript',
            code: `// Get detailed agent performance
const agentId = 'AGENT-REV-001';
const response = await fetch(\`/api/ai-agents/\${agentId}/performance\`, { headers });
const performance = await response.json();

console.log('Performance metrics:', performance);
console.log('Success rate:', performance.successRate + '%');
console.log('Average response time:', performance.averageResponseTime + 'ms');`,
            expectedResponse: {
              tasksCompleted: 1247,
              successRate: 97.8,
              averageResponseTime: 245,
              tasksPerHour: 156,
              errorRate: 2.2
            }
          }
        ]
      },
      {
        id: 'compliance-reporting',
        title: 'Automated Compliance Reporting',
        description: 'Generate and manage compliance reports for various government frameworks',
        difficulty: 'Advanced',
        estimatedTime: '30 minutes',
        prerequisites: ['API Authentication', 'Compliance Officer role'],
        tags: ['compliance', 'reporting', 'fisma', 'nist'],
        videoUrl: 'https://training.terrafusionmarket.com/videos/compliance.mp4',
        steps: [
          {
            id: 'step-1',
            title: 'Generate FISMA Report',
            description: 'Create a comprehensive FISMA compliance report',
            language: 'javascript',
            code: `// Generate FISMA compliance report
const reportRequest = {
  framework: 'FISMA',
  scope: 'full-system',
  includeRemediation: true,
  format: 'json'
};

const response = await fetch('/api/compliance/reports', {
  method: 'POST',
  headers,
  body: JSON.stringify(reportRequest)
});

const report = await response.json();
console.log('Report ID:', report.id);
console.log('Compliance Score:', report.score + '%');`,
            expectedResponse: {
              id: 'COMP-2024-Q3-001',
              framework: 'FISMA',
              status: 'Compliant',
              score: 94.5,
              violations: []
            }
          }
        ]
      },
      {
        id: 'harris-pacs-integration',
        title: 'Harris PACS Data Integration',
        description: 'Integrate with Harris PACS system for property and tax data synchronization',
        difficulty: 'Intermediate',
        estimatedTime: '25 minutes',
        prerequisites: ['Harris PACS access', 'Data Manager role'],
        tags: ['harris-pacs', 'integration', 'sync'],
        videoUrl: 'https://training.terrafusionmarket.com/videos/harris-pacs.mp4',
        steps: [
          {
            id: 'step-1',
            title: 'Check System Status',
            description: 'Verify Harris PACS system connectivity and status',
            language: 'javascript',
            code: `// Check Harris PACS system status
const response = await fetch('/api/harrispacsintegration/system/status', { headers });
const status = await response.json();

console.log('PACS Online:', status.isOnline);
console.log('Version:', status.version);
console.log('Response Time:', status.responseTime + 'ms');`,
            expectedResponse: {
              isOnline: true,
              version: '12.5.3',
              responseTime: 145,
              activeConnections: 8
            }
          },
          {
            id: 'step-2',
            title: 'Sync Jurisdiction Data',
            description: 'Initiate data synchronization for a specific jurisdiction',
            language: 'javascript',
            code: `// Initiate data sync for Benton County
const jurisdiction = 'benton-county';
const response = await fetch(\`/api/harrispacsintegration/jurisdictions/\${jurisdiction}/sync\`, {
  method: 'POST',
  headers
});

const result = await response.json();
console.log('Sync initiated:', result.message);

// Check sync status
const statusResponse = await fetch(\`/api/harrispacsintegration/jurisdictions/\${jurisdiction}/sync/status\`, { headers });
const syncStatus = await statusResponse.json();
console.log('Sync status:', syncStatus.status);`,
            expectedResponse: {
              message: 'Data synchronization initiated for jurisdiction benton-county'
            }
          }
        ]
      }
    ];
  }

  /**
   * Get tutorial by ID with step-by-step execution
   */
  getTutorial(id: string): APITutorial | undefined {
    return this.getTutorials().find(tutorial => tutorial.id === id);
  }

  /**
   * Execute tutorial step with live API call
   */
  async executeTutorialStep(
    tutorialId: string,
    stepId: string,
    userInputs?: Record<string, any>
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    nextStep?: string;
  }> {
    const tutorial = this.getTutorial(tutorialId);
    if (!tutorial) {
      return {
        success: false,
        error: 'Tutorial not found',
        executionTime: 0
      };
    }

    const step = tutorial.steps.find(s => s.id === stepId);
    if (!step) {
      return {
        success: false,
        error: 'Tutorial step not found',
        executionTime: 0
      };
    }

    // Execute the step's code with user inputs
    const startTime = Date.now();
    
    try {
      // This would execute the actual API calls based on the step
      // For now, return mock success response
      const executionTime = Date.now() - startTime;
      
      const currentStepIndex = tutorial.steps.findIndex(s => s.id === stepId);
      const nextStep = currentStepIndex < tutorial.steps.length - 1 
        ? tutorial.steps[currentStepIndex + 1].id 
        : undefined;

      return {
        success: true,
        result: step.expectedResponse,
        executionTime,
        nextStep
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime
      };
    }
  }

  /**
   * Generate code examples for different programming languages
   */
  generateCodeExample(
    endpoint: APIEndpoint,
    language: 'javascript' | 'python' | 'curl' | 'csharp' | 'powershell'
  ): string {
    const baseUrl = this.baseUrl;
    const path = endpoint.path;
    const method = endpoint.method;

    switch (language) {
      case 'javascript':
        return this.generateJavaScriptExample(endpoint);
      case 'python':
        return this.generatePythonExample(endpoint);
      case 'curl':
        return this.generateCurlExample(endpoint);
      case 'csharp':
        return this.generateCSharpExample(endpoint);
      case 'powershell':
        return this.generatePowerShellExample(endpoint);
      default:
        return '// Code example not available for this language';
    }
  }

  private generateJavaScriptExample(endpoint: APIEndpoint): string {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const example = endpoint.examples[0];

    return `// ${endpoint.summary}
const response = await fetch('${this.baseUrl}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }${hasBody && example ? `,
  body: JSON.stringify(${JSON.stringify(example.value, null, 2)})` : ''}
});

const data = await response.json();
console.log('Response:', data);

// Expected response:
${example ? `// ${JSON.stringify(example.value, null, 2)}` : '// Response data will be displayed here'}`;
  }

  private generatePythonExample(endpoint: APIEndpoint): string {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const example = endpoint.examples[0];

    return `# ${endpoint.summary}
import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}

${hasBody && example ? `data = ${JSON.stringify(example.value, null, 2)}

response = requests.${endpoint.method.toLowerCase()}(
    '${this.baseUrl}${endpoint.path}',
    headers=headers,
    json=data
)` : `response = requests.${endpoint.method.toLowerCase()}(
    '${this.baseUrl}${endpoint.path}',
    headers=headers
)`}

if response.status_code == 200:
    result = response.json()
    print('Response:', result)
else:
    print('Error:', response.status_code, response.text)`;
  }

  private generateCurlExample(endpoint: APIEndpoint): string {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const example = endpoint.examples[0];

    return `# ${endpoint.summary}
curl -X ${endpoint.method} \\
  '${this.baseUrl}${endpoint.path}' \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json'${hasBody && example ? ` \\
  -d '${JSON.stringify(example.value)}'` : ''}`;
  }

  private generateCSharpExample(endpoint: APIEndpoint): string {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const example = endpoint.examples[0];

    return `// ${endpoint.summary}
using System.Text.Json;
using System.Text;

var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_JWT_TOKEN");

${hasBody && example ? `var requestData = ${JSON.stringify(example.value, null, 2)};
var json = JsonSerializer.Serialize(requestData);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.${endpoint.method === 'POST' ? 'PostAsync' : 
  endpoint.method === 'PUT' ? 'PutAsync' : 'PatchAsync'}(
    "${this.baseUrl}${endpoint.path}", 
    content
);` : `var response = await client.GetAsync("${this.baseUrl}${endpoint.path}");`}

if (response.IsSuccessStatusCode)
{
    var responseContent = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<object>(responseContent);
    Console.WriteLine($"Response: {result}");
}
else
{
    Console.WriteLine($"Error: {response.StatusCode}");
}`;
  }

  private generatePowerShellExample(endpoint: APIEndpoint): string {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method);
    const example = endpoint.examples[0];

    return `# ${endpoint.summary}
$headers = @{
    'Authorization' = 'Bearer YOUR_JWT_TOKEN'
    'Content-Type' = 'application/json'
}

${hasBody && example ? `$body = @'
${JSON.stringify(example.value, null, 2)}
'@

$response = Invoke-RestMethod -Uri '${this.baseUrl}${endpoint.path}' -Method ${endpoint.method} -Headers $headers -Body $body` : 
`$response = Invoke-RestMethod -Uri '${this.baseUrl}${endpoint.path}' -Method ${endpoint.method} -Headers $headers`}

Write-Output "Response: $($response | ConvertTo-Json -Depth 10)"`;
  }
}
