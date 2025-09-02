import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  ContentCopy,
  CheckCircle,
  Code,
  VideoLibrary,
  Book,
  Api,
  Launch
} from '@mui/icons-material';
import { APIDocumentationService } from './api-documentation-service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-docs-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InteractiveAPIDocumentation: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [videoLibrary, setVideoLibrary] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeExamples, setCodeExamples] = useState<Record<string, string>>({});
  const [apiTestRequest, setApiTestRequest] = useState({
    endpoint: '/api/properties',
    method: 'GET',
    headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.terrafusion.gov');

  const apiService = new APIDocumentationService();

  useEffect(() => {
    loadDocumentation();
  }, []);

  const loadDocumentation = async () => {
    try {
      // Load mock data for now
      setSwaggerSpec({ openapi: '3.0.3', info: { title: 'Terrafusion OS API', version: '1.0.0' } });
      setTutorials([{
        id: '1',
        title: 'Getting Started with Terrafusion API',
        description: 'Learn the basics of Terrafusion OS API integration',
        difficulty: 'beginner',
        estimatedTime: '15 minutes'
      }]);
      setVideoLibrary([{
        id: '1',
        title: 'Harris PACS Integration Tutorial',
        description: 'Complete guide to Harris PACS integration',
        difficulty: 'intermediate',
        duration: '25 minutes',
        thumbnailUrl: '/api/placeholder/video-thumb.jpg'
      }]);
      generateCodeExamples('/api/properties', 'GET');
    } catch (error) {
      console.error('Failed to load documentation:', error);
    }
  };

  const generateCodeExamples = async (endpoint: string, method: string) => {
    const examples: Record<string, string> = {
      javascript: `// JavaScript Example\nfetch('${apiEndpoint}${endpoint}', {\n  method: '${method}',\n  headers: {\n    'Authorization': 'Bearer YOUR_JWT_TOKEN',\n    'Content-Type': 'application/json'\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`,
      python: `# Python Example\nimport requests\n\nresponse = requests.${method.toLowerCase()}('${apiEndpoint}${endpoint}', \n    headers={'Authorization': 'Bearer YOUR_JWT_TOKEN'})\nprint(response.json())`,
      curl: `# cURL Example\ncurl -X ${method} '${apiEndpoint}${endpoint}' \\\n  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\\n  -H 'Content-Type: application/json'`,
      csharp: `// C# Example\nusing var client = new HttpClient();\nclient.DefaultRequestHeaders.Authorization = \n    new AuthenticationHeaderValue("Bearer", "YOUR_JWT_TOKEN");\nvar response = await client.${method === 'GET' ? 'GetAsync' : method + 'Async'}("${apiEndpoint}${endpoint}");\nvar content = await response.Content.ReadAsStringAsync();`
    };
    setCodeExamples(examples);
  };

  const handleTabChange = (event: any, newValue: number) => {
    setCurrentTab(newValue);
  };

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const executeAPITest = async () => {
    setIsTestingAPI(true);
    try {
      const response = await fetch(`${apiEndpoint}${apiTestRequest.endpoint}`, {
        method: apiTestRequest.method,
        headers: {
          'Content-Type': 'application/json',
          ...apiTestRequest.headers
        }
      });
      const data = await response.json();
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (error) {
      setTestResponse({ error: error.message });
    } finally {
      setIsTestingAPI(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}><>

        <Typography variant="h4" gutterBottom>
          Terrafusion OS API Documentation
        </Typography>
        <Typography
</>

variant="subtitle1" color="text.secondary">
          Interactive documentation with live examples, tutorials, and video training
        </Typography><>

        <TextField
          label="API Endpoint"
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          size="small"
          sx={{ mt: 2, minWidth: 300 }}
        />
      </Box>

      <Tabs
</>

value={currentTab} onChange={handleTabChange}>
        <Tab icon={<Api />} label="API Reference" />
        <Tab icon={<Book />} label="Tutorials" />
        <Tab icon={<Code />} label="Code Examples" />
        <Tab icon={<Launch />} label="Live Testing" />
        <Tab icon={<VideoLibrary />} label="Videos" />
      </Tabs>

      {/* API Reference */}
      <TabPanel value={currentTab} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>OpenAPI Specification</Typography>
            {swaggerSpec ? (
              <Box><>

                <Alert severity="info" sx={{ mb: 2 }}>
                  OpenAPI specification loaded successfully. Interactive Swagger UI would be rendered here.
                </Alert>
                <pre
</>

style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
                  {JSON.stringify(swaggerSpec, null, 2)}
                </pre>
              </Box>
            ) : (
              <LinearProgress />
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tutorials */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          {tutorials.map((tutorial) => (
            <Grid item xs={12} md={6} key={tutorial.id}>
              <Card>
                <CardContent><>

                  <Typography variant="h6">{tutorial.title}</Typography>
                  <Typography
</>

variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {tutorial.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={tutorial.difficulty} size="small" /><>

                    <Chip label={tutorial.estimatedTime} variant="outlined" size="small" />
                  </Box>
                  <Button
</>

variant="contained" startIcon={<PlayArrow />}>
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Code Examples */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent><>

                <Typography variant="h6" gutterBottom>Generate Examples</Typography>
                <TextField
</>

                  fullWidth
                  label="Endpoint"
                  value={apiTestRequest.endpoint}
                  onChange={(e) => setApiTestRequest(prev => ({ ...prev, endpoint: e.target.value }))}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}><>

                  <InputLabel>Method</InputLabel>
                  <Select
</>

                    value={apiTestRequest.method}
                    onChange={(e) => setApiTestRequest(prev => ({ ...prev, method: e.target.value }))}
                  ><>

                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem
</>

value="POST">POST</MenuItem><>

                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem
</>

value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => generateCodeExamples(apiTestRequest.endpoint, apiTestRequest.method)}
                >
                  Generate
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <FormControl sx={{ mb: 2, minWidth: 200 }}><>

              <InputLabel>Language</InputLabel>
              <Select
</>

                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              ><>

                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem
</>

value="python">Python</MenuItem><>

                <MenuItem value="curl">cURL</MenuItem>
                <MenuItem
</>

value="csharp">C#</MenuItem>
              </Select>
            </FormControl>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><>

                  <Typography variant="h6">{selectedLanguage.toUpperCase()}</Typography>
                  <IconButton
</>

                    onClick={() => copyToClipboard(codeExamples[selectedLanguage] || '', selectedLanguage)}
                  >
                    {copiedCode === selectedLanguage ? <CheckCircle color="success" /> : <ContentCopy />}
                  </IconButton>
                </Box>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre style={{ overflow: 'auto', fontSize: '14px' }}>
                    <code>{codeExamples[selectedLanguage] || 'Loading...'}</code>
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Live Testing */}
      <TabPanel value={currentTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent><>

                <Typography variant="h6" gutterBottom>Request</Typography>
                <TextField
</>

                  fullWidth
                  label="Endpoint"
                  value={apiTestRequest.endpoint}
                  onChange={(e) => setApiTestRequest(prev => ({ ...prev, endpoint: e.target.value }))}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}><>

                  <InputLabel>Method</InputLabel>
                  <Select
</>

                    value={apiTestRequest.method}
                    onChange={(e) => setApiTestRequest(prev => ({ ...prev, method: e.target.value }))}
                  ><>

                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem
</>

value="POST">POST</MenuItem><>

                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem
</>

value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={executeAPITest}
                  disabled={isTestingAPI}
                  startIcon={<Launch />}
                >
                  {isTestingAPI ? 'Testing...' : 'Execute'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Response</Typography>
                {testResponse ? (
                  <Box><>

                    <Alert severity={testResponse.error ? 'error' : 'success'} sx={{ mb: 2 }}>
                      {testResponse.error || `Status: ${testResponse.status}`}
                    </Alert>
                    <pre
</>

style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(testResponse.data || testResponse.error, null, 2)}
                    </pre>
                  </Box>
                ) : (
                  <Typography color="text.secondary">Execute a request to see response</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Videos */}
      <TabPanel value={currentTab} index={4}>
        <Grid container spacing={3}>
          {videoLibrary.map((video) => (
            <Grid item xs={12} md={4} key={video.id}>
              <Card>
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: `url(${video.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: '50%',
                      p: 2
                    }}
                  >
                    <PlayArrow sx={{ color: 'white', fontSize: 40 }} />
                  </Box>
                </Box>
                <CardContent><>

                  <Typography variant="h6">{video.title}</Typography>
                  <Typography
</>

variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {video.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={video.difficulty} size="small" /><>

                    <Chip label={video.duration} variant="outlined" size="small" />
                  </Box>
                  <Button
</>

fullWidth variant="outlined" startIcon={<VideoLibrary />}>
                    Watch Video
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default InteractiveAPIDocumentation;
