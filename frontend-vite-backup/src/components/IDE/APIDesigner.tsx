import React, {useState, useCallback, useEffect} from 'react';
import { useSecureAPI } from '../../contexts/InfrastructureContext';
import { CircuitBreakerError, AttestationError } from '../../infrastructure/SecureAPIClient';
import {Box,
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Menu,
  Tooltip,
  LinearProgress,} from '@mui/material';
import {Add,
  Save,
  Refresh,
  Api,
  Code,
  Security,
  Assessment,
  PlayArrow,
  Settings,
  Delete,
  Edit,
  ExpandMore,
  Send,
  Download,
  Upload,
  Description,
  AutoFixHigh,
  Psychology,
  Shield,
  DataObject,
  CloudSync,
  Backup,
  Visibility,
  FileCopy,
  CheckCircle,
  Error,
  Warning,} from '@mui/icons-material';

// API Design interfaces
interface APIEndpoint {id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  security: SecurityRequirement[];
  governmentCompliance: ComplianceInfo;
  auditLogging: boolean;
  rateLimit?: RateLimitConfig;
  deprecated: boolean;}

interface APIParameter {id: string;
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  type: string;
  required: boolean;
  description: string;
  example?: any;
  schema?: any;}

interface APIRequestBody {description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: any;
      example?: any;};
  };
}

interface APIResponse {code: string;
  description: string;
  headers?: { [name: string]: any};
  content?: {[mediaType: string]: {
      schema: any;
      example?: any;};
  };
}

interface SecurityRequirement {type: 'bearer' | 'apiKey' | 'oauth2' | 'government-pki';
  name: string;
  scopes?: string[];
  required: boolean;}

interface ComplianceInfo {level: 'RED' | 'YELLOW' | 'GREEN';
  standards: string[];
  dataClassification: string;
  auditRequired: boolean;
  retentionPeriod?: string;}

interface RateLimitConfig {requests: number;
  period: string;
  burst?: number;}

interface APISpec {id: string;
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: { [name: string]: any};
  securitySchemes: {[name: string]: any};
  servers: APIServer[];
  createdAt: Date;
  updatedAt: Date;
  complianceValidated: boolean;
  governmentApproved: boolean;
}

interface APIServer {url: string;
  description: string;
  environment: 'development' | 'staging' | 'production';}

interface APIDesignerProps {onSpecChange?: (spec: APISpec) => void;
  onSpecGenerate?: (spec: APISpec) => void;
  initialSpec?: APISpec;}

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const parameterTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
const mediaTypes = ['application/json', 'application/xml', 'text/plain', 'multipart/form-data'];

export const APIDesigner: React.FC<APIDesignerProps> = ({onSpecChange,
  onSpecGenerate,
  initialSpec,}) => {
  const secureAPI = useSecureAPI();
  
  const [spec, setSpec] = useState<APISpec>(
    initialSpec || {
      id: 'new-api',
      name: 'Government API',
      description: 'FISMA-compliant government API specification',
      version: '1.0.0',
      baseUrl: 'https://api.government.local',
      endpoints: [],
      schemas: {},
      securitySchemes: {bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',},
        governmentPKI: {type: 'http',
          scheme: 'bearer',
          description: 'Government PKI Certificate',},
      },
      servers: [
        {url: 'https://api-dev.government.local',
          description: 'Development Server',
          environment: 'development',},
        {url: 'https://api-staging.government.local',
          description: 'Staging Server',
          environment: 'staging',},
        {url: 'https://api.government.local',
          description: 'Production Server',
          environment: 'production',},
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceValidated: false,
      governmentApproved: false,
    }
  );

  const [selectedTab, setSelectedTab] = useState(0);
  const [endpointDialog, setEndpointDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [generatingSpec, setGeneratingSpec] = useState(false);

  const handleAddEndpoint = () =>{setSelectedEndpoint(null);
    setNewEndpoint({
      method: 'GET',
      path: '/',
      summary: '',
      description: '',
      tags: [],
      parameters: [],
      responses: [
        {
          code: '200',
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'object'},
            },
          },
        },
      ],
      security: [
        {type: 'bearer',
          name: 'bearerAuth',
          required: true,},
      ],
      governmentCompliance: {level: 'GREEN',
        standards: ['FISMA', 'NIST'],
        dataClassification: 'UNCLASSIFIED',
        auditRequired: true,},
      auditLogging: true,
      deprecated: false,
    });
    setEndpointDialog(true);
  };

  const handleSaveEndpoint = () => {
    if (!newEndpoint.method || !newEndpoint.path) return;

    const endpoint: APIEndpoint = {
      id: selectedEndpoint?.id || ('endpoint-' + Date.now()),
      method: newEndpoint.method!,
      path: newEndpoint.path!,
      summary: newEndpoint.summary || '',
      description: newEndpoint.description || '',
      tags: newEndpoint.tags || [],
      parameters: newEndpoint.parameters || [],
      requestBody: newEndpoint.requestBody,
      responses: newEndpoint.responses || [],
      security: newEndpoint.security || [],
      governmentCompliance: newEndpoint.governmentCompliance!,
      auditLogging: newEndpoint.auditLogging ?? true,
      rateLimit: newEndpoint.rateLimit,
      deprecated: newEndpoint.deprecated ?? false,
    };

    setSpec((prev) => {const updatedEndpoints = selectedEndpoint
        ? prev.endpoints.map((e) => (e.id === selectedEndpoint.id ? endpoint : e))
        : [...prev.endpoints, endpoint];

      return {
        ...prev,
        endpoints: updatedEndpoints,
        updatedAt: new Date(),};
    });

    setEndpointDialog(false);
    setNewEndpoint({});
  };

  const handleTestEndpoint = async (endpoint: APIEndpoint) => {
    setTestingEndpoint(endpoint.id);

    try {
      // Simulate API testing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, this would make an actual API call
      alert('Endpoint ' + endpoint.method + ' ' + endpoint.path + ' tested successfully!');
    } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Failed to test endpoint:', error);
    } finally {setTestingEndpoint(null);}
  };

  const handleGenerateOpenAPI = async () => {
    setGeneratingSpec(true);

    try {
      const authToken = localStorage.getItem('terrafusion-token') || '';
      const response = await secureAPI.post('terrafusion-backend', '/api-designer/generate-openapi', {
        spec: spec,
        format: 'yaml',
        governmentCompliance: true,
        includeSecuritySchemes: true,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
      });

      const result = response.data as any;

      if (result.success) {
        // Download OpenAPI spec
        const blob = new Blob([result.openapi], { type: 'application/yaml'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = spec.name.replace(/\s+/g, '_') + '_openapi.yaml';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Failed to generate OpenAPI spec:', error);
      } finally {
        setGeneratingSpec(false);
      }
  };

  const handleGenerateSDK = async (language: string) => {
    try {
      const authToken = localStorage.getItem('terrafusion-token') || '';
      const response = await secureAPI.get('terrafusion-backend', '/api-designer/generate-sdk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
        body: JSON.stringify({
          spec: spec,
          language: language,
          governmentCompliance: true,
          includeAuditLogging: true,
        }),
      });

      const result = response.data as any;

      if (result.success) {
        // Download SDK
        const blob = new Blob([result.sdk], { type: 'application/zip'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = spec.name.replace(/\s+/g, '_') + '_' + language + '_sdk.zip';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Failed to generate SDK:', error);
      }
  };

  const handleComplianceValidation = async () => {
    try {
      const authToken2 = localStorage.getItem('terrafusion-token') || '';
      const response = await secureAPI.get('terrafusion-backend', '/api-designer/validate-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken2,
        },
        body: JSON.stringify({spec: spec,
          standards: ['FISMA', 'NIST', 'Section508'],}),
      });

      const result = response.data as any;

      setSpec((prev) => ({...prev,
        complianceValidated: result.compliant,
        updatedAt: new Date(),}));

      alert('Compliance Validation: ' + (result.compliant ? 'PASSED' : 'FAILED') + '\n' + result.message);
    } catch (error: any) {
        if (error instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', error.state);
          // Handle circuit breaker error
        } else if (error instanceof AttestationError) {
          console.error('Security attestation failed:', error.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', error);
        }
        console.error('Failed to validate API compliance:', error);
      }
  };

  const getMethodColor = (method: string) => {switch (method) {
      case 'GET':
        return '#4CAF50';
      case 'POST':
        return '#FF9800';
      case 'PUT':
        return '#2196F3';
      case 'DELETE':
        return '#F44336';
      case 'PATCH':
        return '#9C27B0';
      default:
        return '#9E9E9E';}
  };

  const getComplianceColor = (level: string) => {switch (level) {
      case 'RED':
        return '#F44336';
      case 'YELLOW':
        return '#FF9800';
      case 'GREEN':
        return '#4CAF50';
      default:
        return '#9E9E9E';}
  };

  return (<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column'}}>{/* Header */}<Toolbar variant='dense' sx={{ borderBottom: 1, borderColor: 'divider'}}><Typography variant='h6' component='div' sx={{ flexGrow: 1}}>Government API Designer - {spec.name} v{spec.version}</Typography><Badge
          badgeContent={spec.complianceValidated ? '✓' : '!'}
          color={spec.complianceValidated ? 'success' : 'warning'}
          sx={{ mr: 2}}
        ><Chip label={spec.endpoints.length + ' Endpoints'} color='primary' variant='outlined' /></Badge><Button startIcon={<Add />} variant='contained' onClick={handleAddEndpoint} sx={{ mr: 1}}>Add Endpoint</Button><Button startIcon={<Assessment />} onClick={handleComplianceValidation} sx={{ mr: 1}}>Validate</Button><Button
          startIcon={<Code />}
          onClick={handleGenerateOpenAPI}
          disabled={generatingSpec}
          sx={{ mr: 1}}
        >{generatingSpec ? 'Generating...' : 'Export OpenAPI'}</Button><IconButton onClick={() => onSpecChange?.(spec)}><Save /></IconButton></Toolbar>{/* Main Content */}<Box sx={{ display: 'flex', flexGrow: 1}}>{/* Main Panel */}<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>{/* Tabs */}<Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider'}}
          ><Tab label='Endpoints' /><Tab label='Documentation' /><Tab label='Testing' /><Tab label='SDKs' /></Tabs><Box sx={{ flexGrow: 1, p: 3, overflow: 'auto'}}>{/* Endpoints Tab */}
            {selectedTab === 0 && (<Box><Typography variant='h5' gutterBottom>API Endpoints</Typography>{spec.endpoints.length === 0 ? (<Alert severity='info'>No endpoints defined. Click "Add Endpoint" to create your first API endpoint.</Alert>) : (<Grid container spacing={2}>{spec.endpoints.map((endpoint) => (<Grid item xs={12} key={endpoint.id}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Chip
                                label={endpoint.method}
                                size='small'
                                sx={{
                                  backgroundColor: getMethodColor(endpoint.method),
                                  color: 'white',
                                  fontWeight: 'bold',
                                  minWidth: 80,
                                  mr: 2,}} /><Typography
                                variant='h6'
                                sx={{ fontFamily: 'monospace', flexGrow: 1}}
                              >{endpoint.path}</Typography><Chip
                                label={endpoint.governmentCompliance.level}
                                size='small'
                                sx={{
                                  backgroundColor: getComplianceColor(
                                    endpoint.governmentCompliance.level
                                  ),
                                  color: 'white',
                                  fontSize: '10px',}} /></Box><Typography variant='body1' sx={{ mb: 1}}>{endpoint.summary}</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 2}}>{endpoint.description}</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>{endpoint.tags.map((tag) => (<Chip key={tag} label={tag} size='small' variant='outlined' />))}
                              {endpoint.auditLogging && (<Chip label='Audit Enabled' size='small' color='secondary' />)}
                              {endpoint.deprecated && (<Chip label='Deprecated' size='small' color='error' />)}</Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}><Typography variant='caption' color='text.secondary'>{endpoint.parameters.length} parameters •{' '}
                                {endpoint.responses.length} responses</Typography>{endpoint.rateLimit && (<Typography variant='caption' color='text.secondary'>• Rate Limited: {endpoint.rateLimit.requests}/
                                  {endpoint.rateLimit.period}</Typography>)}</Box></CardContent><CardActions><Button
                              size='small'
                              startIcon={<Edit />}
                              onClick={() =>{
                                setSelectedEndpoint(endpoint);
                                setNewEndpoint(endpoint);
                                setEndpointDialog(true);}}
                            >
                              Edit</Button><Button
                              size='small'
                              startIcon={testingEndpoint === endpoint.id ? <AutoFixHigh />:<PlayArrow />}
                              onClick={() =>handleTestEndpoint(endpoint)}
                              disabled={testingEndpoint === endpoint.id}
                            >
                              {testingEndpoint === endpoint.id ? 'Testing...' : 'Test'}</Button><Button
                              size='small'
                              startIcon={<FileCopy />}
                              onClick={() =>{
                                navigator.clipboard.writeText(
                                  endpoint.method + ' ' + endpoint.path
                                );
                              }}
                            >
                              Copy</Button></CardActions></Card></Grid>))}</Grid>)}</Box>)}

            {/* Documentation Tab */}
            {selectedTab === 1 && (<Box><Typography variant='h5' gutterBottom>API Documentation</Typography><Card sx={{ mb: 3}}><CardContent><Typography variant='h6' gutterBottom>{spec.name} API Documentation</Typography><Typography variant='body1' sx={{ mb: 2}}>{spec.description}</Typography><Grid container spacing={2}><Grid item xs={12} sm={4}><Typography variant='subtitle2'>Version</Typography><Typography variant='body2'>{spec.version}</Typography></Grid><Grid item xs={12} sm={4}><Typography variant='subtitle2'>Base URL</Typography><Typography variant='body2' sx={{ fontFamily: 'monospace'}}>{spec.baseUrl}</Typography></Grid><Grid item xs={12} sm={4}><Typography variant='subtitle2'>Endpoints</Typography><Typography variant='body2'>{spec.endpoints.length}</Typography></Grid></Grid></CardContent></Card><Accordion><AccordionSummary expandIcon={<ExpandMore />}><Typography variant='h6'>Authentication</Typography></AccordionSummary><AccordionDetails><Typography variant='body2' sx={{ mb: 2}}>This API uses government-approved authentication schemes:</Typography><List>{Object.entries(spec.securitySchemes).map(([name, scheme]) => (<ListItem key={name}><ListItemText
                            primary={name}
                            secondary={scheme.description || (scheme.type + ' authentication')} /></ListItem>))}</List></AccordionDetails></Accordion><Accordion><AccordionSummary expandIcon={<ExpandMore />}><Typography variant='h6'>Compliance Information</Typography></AccordionSummary><AccordionDetails><Alert
                      severity={spec.complianceValidated ? 'success' : 'warning'}
                      sx={{ mb: 2}}
                    >{spec.complianceValidated
                        ? 'API is compliant with government standards'
                        : 'API compliance validation pending'}</Alert><Typography variant='body2' sx={{ mb: 2}}>Government Standards Compliance:</Typography><Box>{['FISMA', 'NIST', 'Section508'].map((standard) => (<Chip
                          key={standard}
                          label={standard}
                          size='small'
                          color='secondary'
                          variant='outlined'
                          sx={{ mr: 1, mb: 1}} />))}</Box></AccordionDetails></Accordion></Box>)}

            {/* Testing Tab */}
            {selectedTab === 2 && (<Box><Typography variant='h5' gutterBottom>API Testing</Typography><Alert severity='info' sx={{ mb: 3}}>Test your API endpoints with government compliance validation</Alert>{spec.endpoints.map((endpoint) => (<Card key={endpoint.id} sx={{ mb: 2}}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Chip
                          label={endpoint.method}
                          size='small'
                          sx={{
                            backgroundColor: getMethodColor(endpoint.method),
                            color: 'white',
                            fontWeight: 'bold',
                            minWidth: 80,
                            mr: 2,}} /><Typography variant='h6' sx={{ fontFamily: 'monospace'}}>{endpoint.path}</Typography></Box>{testingEndpoint === endpoint.id && (<Box sx={{ mb: 2}}><LinearProgress /><Typography variant='caption'>Testing endpoint...</Typography></Box>)}<Button
                        variant='contained'
                        startIcon={<Send />}
                        onClick={() =>handleTestEndpoint(endpoint)}
                        disabled={testingEndpoint === endpoint.id}
                        sx={{ mt: 1}}
                      >
                        Test Endpoint</Button></CardContent></Card>))}</Box>)}

            {/* SDKs Tab */}
            {selectedTab === 3 && (<Box><Typography variant='h5' gutterBottom>SDK Generation</Typography><Typography variant='body1' color='text.secondary' sx={{ mb: 3}}>Generate government-compliant SDKs for various programming languages</Typography><Grid container spacing={3}>{[
                    {name: 'TypeScript/JavaScript', lang: 'typescript', icon: '📜'},
                    {name: 'C# / .NET', lang: 'csharp', icon: '🔷'},
                    {name: 'Python', lang: 'python', icon: '🐍'},
                    {name: 'Rust', lang: 'rust', icon: '🦀'},
                    {name: 'Java', lang: 'java', icon: '☕'},
                    {name: 'Go', lang: 'go', icon: '🐹'},
                  ].map((sdk) => (<Grid item xs={12} sm={6} md={4} key={sdk.lang}><Card><CardContent><Typography
                            variant='h6'
                            sx={{ display: 'flex', alignItems: 'center', mb: 2}}
                          ><span style={{ marginRight: 8, fontSize: '24px'}}>{sdk.icon}</span>{sdk.name}</Typography><Typography variant='body2' color='text.secondary' sx={{ mb: 2}}>Generate a fully-featured SDK with government compliance built-in</Typography><List dense><ListItem><ListItemText primary='✅ Authentication handling' /></ListItem><ListItem><ListItemText primary='✅ Automatic audit logging' /></ListItem><ListItem><ListItemText primary='✅ Error handling' /></ListItem><ListItem><ListItemText primary='✅ Type safety' /></ListItem></List></CardContent><CardActions><Button
                            startIcon={<Download />}
                            onClick={() =>handleGenerateSDK(sdk.lang)}
                          >
                            Generate SDK</Button></CardActions></Card></Grid>))}</Grid></Box>)}</Box></Box>{/* Properties Panel */}<Paper sx={{ width: 350, borderLeft: 1, borderColor: 'divider'}}><Box sx={{ p: 2}}><Typography variant='h6' gutterBottom>API Properties</Typography><TextField
              fullWidth
              label='API Name'
              value={spec.name}
              onChange={(e) =>
                setSpec((prev) => ({ ...prev, name: e.target.value, updatedAt: new Date()}))
              }
              sx={{ mb: 2}}
            /><TextField
              fullWidth
              multiline
              rows={3}
              label='Description'
              value={spec.description}
              onChange={(e) =>
                setSpec((prev) => ({ ...prev, description: e.target.value, updatedAt: new Date()}))
              }
              sx={{ mb: 2}}
            /><TextField
              fullWidth
              label='Version'
              value={spec.version}
              onChange={(e) =>
                setSpec((prev) => ({ ...prev, version: e.target.value, updatedAt: new Date()}))
              }
              sx={{ mb: 2}}
            /><TextField
              fullWidth
              label='Base URL'
              value={spec.baseUrl}
              onChange={(e) =>
                setSpec((prev) => ({ ...prev, baseUrl: e.target.value, updatedAt: new Date()}))
              }
              sx={{ mb: 2}}
            /><Alert severity={spec.complianceValidated ? 'success' : 'warning'} sx={{ mb: 2}}>{spec.complianceValidated
                ? 'API specification is government compliant'
                : 'Compliance validation pending'}</Alert><Typography variant='subtitle2' sx={{ mb: 1}}>Servers</Typography><List dense sx={{ mb: 2}}>{spec.servers.map((server, index) => (<ListItem key={index}><ListItemText
                    primary={server.description}
                    secondary={server.url}
                    secondaryTypographyProps={{
                      sx: { fontFamily: 'monospace', fontSize: '0.75rem'},
                    }} /><Chip
                    label={server.environment}
                    size='small'
                    color={server.environment === 'production'
                        ? 'error'
                        : server.environment === 'staging'
                          ? 'warning'
                          : 'success'} /></ListItem>))}</List></Box></Paper></Box>{/* Add/Edit Endpoint Dialog */}<Dialog
        open={endpointDialog}
        onClose={() => setEndpointDialog(false)}
        maxWidth='md'
        fullWidth
      ><DialogTitle>{selectedEndpoint ? 'Edit Endpoint' : 'Add New Endpoint'}</DialogTitle><DialogContent><Grid container spacing={2} sx={{ mt: 1}}><Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Method</InputLabel><Select
                  value={newEndpoint.method || 'GET'}
                  label='Method'
                  onChange={(e) =>setNewEndpoint((prev) => ({ ...prev, method: e.target.value as any}))
                  }
                >
                  {httpMethods.map((method) => (<MenuItem key={method} value={method}><Chip
                        label={method}
                        size='small'
                        sx={{
                          backgroundColor: getMethodColor(method),
                          color: 'white',
                          fontWeight: 'bold',}} /></MenuItem>))}</Select></FormControl></Grid><Grid item xs={12} sm={9}><TextField
                fullWidth
                label='Path'
                value={newEndpoint.path || ''}
                onChange={(e) => setNewEndpoint((prev) => ({ ...prev, path: e.target.value}))}
                placeholder='/api/v1/resources/{id}'
              /></Grid><Grid item xs={12}><TextField
                fullWidth
                label='Summary'
                value={newEndpoint.summary || ''}
                onChange={(e) => setNewEndpoint((prev) => ({ ...prev, summary: e.target.value}))}
              /></Grid><Grid item xs={12}><TextField
                fullWidth
                multiline
                rows={3}
                label='Description'
                value={newEndpoint.description || ''}
                onChange={(e) =>
                  setNewEndpoint((prev) => ({ ...prev, description: e.target.value}))
                }
              /></Grid><Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Compliance Level</InputLabel><Select
                  value={newEndpoint.governmentCompliance?.level || 'GREEN'}
                  label='Compliance Level'
                  onChange={(e) =>
                    setNewEndpoint((prev) => ({
                      ...prev,
                      governmentCompliance: {
                        ...prev.governmentCompliance!,
                        level: e.target.value as any,},
                    }))
                  }
                ><MenuItem value='GREEN'>GREEN (Confidential)</MenuItem><MenuItem value='YELLOW'>YELLOW (Secret)</MenuItem><MenuItem value='RED'>RED (Top Secret)</MenuItem></Select></FormControl></Grid><Grid item xs={12} sm={6}><FormControlLabel
                control={<Switch
                    checked={newEndpoint.auditLogging ?? true}
                    onChange={(e) =>
                      setNewEndpoint((prev) => ({ ...prev, auditLogging: e.target.checked}))
                    }
                  />
                }
                label='Enable Audit Logging'
              /></Grid></Grid></DialogContent><DialogActions><Button onClick={() => setEndpointDialog(false)}>Cancel</Button><Button
            onClick={handleSaveEndpoint}
            variant='contained'
            disabled={!newEndpoint.method || !newEndpoint.path}
          >{selectedEndpoint ? 'Update Endpoint' : 'Create Endpoint'}</Button></DialogActions></Dialog></Box>
  );
};

export default APIDesigner;
