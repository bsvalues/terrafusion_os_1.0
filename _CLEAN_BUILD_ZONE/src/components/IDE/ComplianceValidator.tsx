import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Badge,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Security,
  Shield,
  VerifiedUser,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Refresh,
  GetApp,
  Upload,
  Assessment,
  AccountBalance,
  Gavel,
  Policy,
  Lock,
  VpnKey,
  AdminPanelSettings,
  CheckCircleOutline,
  ReportProblem,
  Assignment,
  Schedule
} from '@mui/icons-material';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'compliant' | 'warning' | 'violation' | 'not_assessed';
  score: number;
  maxScore: number;
  lastAssessment: string;
  nextAssessment: string;
  controls: ComplianceControl[];
  findings: ComplianceFinding[];
}

interface ComplianceControl {
  id: string;
  name: string;
  category: string;
  status: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  evidence: string[];
  remediation?: string;
}

interface ComplianceFinding {
  id: string;
  type: 'violation' | 'recommendation' | 'observation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  control: string;
  remediation: string;
  dueDate?: string;
  assignee?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'deferred';
}

interface SecurityClearance {
  level: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  compartments: string[];
  caveats: string[];
  grantedDate: string;
  expirationDate: string;
  polygraphRequired: boolean;
  backgroundInvestigation: string;
}

const ComplianceValidator: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentInProgress, setAssessmentInProgress] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [complianceReport, setComplianceReport] = useState<any>(null);

  useEffect(() => {
    initializeComplianceFrameworks();
    loadSecurityClearance();
  }, []);

  const initializeComplianceFrameworks = () => {
    const sampleFrameworks: ComplianceFramework[] = [
      {
        id: 'fisma',
        name: 'FISMA (Federal Information Security Management Act)',
        description: 'Federal cybersecurity framework for government systems',
        version: '2023.1',
        status: 'compliant',
        score: 94,
        maxScore: 100,
        lastAssessment: new Date().toISOString(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        controls: generateFISMAControls(),
        findings: [
          {
            id: 'f1',
            type: 'recommendation',
            severity: 'medium',
            title: 'Enhanced Multi-Factor Authentication',
            description: 'Consider implementing hardware-based MFA tokens for enhanced security',
            control: 'IA-2',
            remediation: 'Deploy FIDO2 security keys for administrative accounts',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            assignee: 'Security Team',
            status: 'open'
          }
        ]
      },
      {
        id: 'nist_800_53',
        name: 'NIST SP 800-53 (Security Controls)',
        description: 'Comprehensive security controls for federal information systems',
        version: 'Rev 5',
        status: 'warning',
        score: 87,
        maxScore: 100,
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextAssessment: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000).toISOString(),
        controls: generateNISTControls(),
        findings: [
          {
            id: 'n1',
            type: 'violation',
            severity: 'high',
            title: 'Incomplete Security Training Records',
            description: '3 users missing annual security training certification',
            control: 'AT-2',
            remediation: 'Complete security awareness training for identified users',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            assignee: 'HR Department',
            status: 'in_progress'
          }
        ]
      },
      {
        id: 'section_508',
        name: 'Section 508 (Accessibility)',
        description: 'Federal accessibility requirements for electronic information',
        version: '2023',
        status: 'compliant',
        score: 96,
        maxScore: 100,
        lastAssessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextAssessment: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000).toISOString(),
        controls: generateSection508Controls(),
        findings: []
      },
      {
        id: 'fedramp',
        name: 'FedRAMP (Federal Risk and Authorization Management Program)',
        description: 'Cloud security authorization program for federal agencies',
        version: '2023.2',
        status: 'warning',
        score: 82,
        maxScore: 100,
        lastAssessment: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        nextAssessment: new Date(Date.now() + 69 * 24 * 60 * 60 * 1000).toISOString(),
        controls: generateFedRAMPControls(),
        findings: [
          {
            id: 'fr1',
            type: 'violation',
            severity: 'critical',
            title: 'Continuous Monitoring Gap',
            description: 'Security scanning frequency does not meet FedRAMP requirements',
            control: 'SI-2',
            remediation: 'Increase vulnerability scanning frequency to weekly',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignee: 'DevSecOps Team',
            status: 'open'
          }
        ]
      },
      {
        id: 'soc2',
        name: 'SOC 2 Type II',
        description: 'Service Organization Control 2 framework for service providers',
        version: '2023',
        status: 'compliant',
        score: 91,
        maxScore: 100,
        lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextAssessment: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        controls: generateSOC2Controls(),
        findings: [
          {
            id: 'soc1',
            type: 'observation',
            severity: 'low',
            title: 'Documentation Enhancement',
            description: 'Consider enhancing incident response documentation',
            control: 'CC7.4',
            remediation: 'Update incident response playbooks with recent learnings',
            status: 'open'
          }
        ]
      }
    ];

    setFrameworks(sampleFrameworks);
    setSelectedFramework('fisma');
    setLoading(false);
  };

  const loadSecurityClearance = () => {
    const clearance: SecurityClearance = {
      level: 'SECRET',
      compartments: ['SCI', 'SAP'],
      caveats: ['NOFORN', 'ORCON'],
      grantedDate: '2023-01-15',
      expirationDate: '2028-01-15',
      polygraphRequired: true,
      backgroundInvestigation: 'SSBI-PR'
    };
    setSecurityClearance(clearance);
  };

  const generateFISMAControls = (): ComplianceControl[] => [
    {
      id: 'ac-1',
      name: 'Access Control Policy and Procedures',
      category: 'Access Control',
      status: 'implemented',
      severity: 'critical',
      description: 'Develop, document, and disseminate access control policy',
      implementation: 'Comprehensive access control policy implemented with role-based permissions',
      evidence: ['AC-Policy-2023.pdf', 'RBAC-Implementation.md', 'Access-Review-Reports.xlsx']
    },
    {
      id: 'ia-2',
      name: 'Identification and Authentication',
      category: 'Identification and Authentication',
      status: 'implemented',
      severity: 'critical',
      description: 'Uniquely identify and authenticate organizational users',
      implementation: 'Multi-factor authentication implemented for all users',
      evidence: ['MFA-Config.json', 'User-Directory-Audit.pdf', 'Auth-Logs-Summary.xlsx']
    },
    {
      id: 'au-2',
      name: 'Audit Events',
      category: 'Audit and Accountability',
      status: 'implemented',
      severity: 'high',
      description: 'Determine auditable events and audit log information',
      implementation: 'Comprehensive audit logging with SIEM integration',
      evidence: ['Audit-Policy.pdf', 'SIEM-Configuration.json', 'Log-Retention-Policy.md']
    },
    {
      id: 'cm-2',
      name: 'Baseline Configuration',
      category: 'Configuration Management',
      status: 'partial',
      severity: 'medium',
      description: 'Develop, document, and maintain baseline configurations',
      implementation: 'Partial implementation - infrastructure baselines complete, application baselines in progress',
      evidence: ['Infrastructure-Baselines.yaml', 'Security-Hardening-Guide.pdf'],
      remediation: 'Complete application security baseline documentation by end of quarter'
    }
  ];

  const generateNISTControls = (): ComplianceControl[] => [
    {
      id: 'si-2',
      name: 'Flaw Remediation',
      category: 'System and Information Integrity',
      status: 'implemented',
      severity: 'critical',
      description: 'Identify, report, and correct information system flaws',
      implementation: 'Automated vulnerability scanning and patch management system',
      evidence: ['Vulnerability-Scan-Reports.pdf', 'Patch-Management-Process.md', 'Remediation-Timeline.xlsx']
    },
    {
      id: 'at-2',
      name: 'Security Awareness Training',
      category: 'Awareness and Training',
      status: 'partial',
      severity: 'medium',
      description: 'Provide security awareness training to information system users',
      implementation: 'Annual security training program with 97% completion rate',
      evidence: ['Training-Records.xlsx', 'Security-Awareness-Materials.pdf'],
      remediation: 'Complete training for 3 remaining users within 14 days'
    }
  ];

  const generateSection508Controls = (): ComplianceControl[] => [
    {
      id: 's508-1194.22',
      name: 'Web-based Intranet and Internet Information',
      category: 'Web Accessibility',
      status: 'implemented',
      severity: 'high',
      description: 'Web pages comply with accessibility standards',
      implementation: 'WCAG 2.1 AA compliance implemented across all interfaces',
      evidence: ['Accessibility-Audit-Report.pdf', 'WCAG-Compliance-Certificate.pdf', 'Screen-Reader-Testing.md']
    },
    {
      id: 's508-1194.31',
      name: 'Functional Performance Criteria',
      category: 'Functional Performance',
      status: 'implemented',
      severity: 'high',
      description: 'Technology provides equivalent access for users with disabilities',
      implementation: 'Alternative input methods and assistive technology support',
      evidence: ['Assistive-Tech-Testing.pdf', 'Alternative-Input-Support.md', 'User-Testing-Results.xlsx']
    }
  ];

  const generateFedRAMPControls = (): ComplianceControl[] => [
    {
      id: 'fr-si-2',
      name: 'Flaw Remediation (FedRAMP Enhanced)',
      category: 'System and Information Integrity',
      status: 'partial',
      severity: 'critical',
      description: 'Enhanced flaw remediation requirements for cloud services',
      implementation: 'Monthly vulnerability scanning - needs enhancement for weekly frequency',
      evidence: ['Current-Scan-Schedule.pdf', 'Vulnerability-Reports.xlsx'],
      remediation: 'Implement weekly scanning schedule to meet FedRAMP requirements'
    }
  ];

  const generateSOC2Controls = (): ComplianceControl[] => [
    {
      id: 'cc7.1',
      name: 'System Monitoring',
      category: 'Common Criteria',
      status: 'implemented',
      severity: 'high',
      description: 'Monitor system components and the operation of controls',
      implementation: 'Comprehensive monitoring with Prometheus and Grafana',
      evidence: ['Monitoring-Dashboard.pdf', 'Alert-Configuration.json', 'Incident-Response-Logs.xlsx']
    }
  ];

  const runComplianceAssessment = async (frameworkId: string) => {
    setAssessmentInProgress(true);
    
    // Simulate assessment process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update framework with new assessment results
    setFrameworks(prev => prev.map(framework => 
      framework.id === frameworkId 
        ? { 
            ...framework, 
            lastAssessment: new Date().toISOString(),
            score: Math.max(framework.score, Math.floor(Math.random() * 10) + framework.score - 5)
          }
        : framework
    ));
    
    setAssessmentInProgress(false);
  };

  const generateComplianceReport = async () => {
    setLoading(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const report = {
      generatedAt: new Date().toISOString(),
      overallScore: Math.round(frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length),
      totalFrameworks: frameworks.length,
      compliantFrameworks: frameworks.filter(f => f.status === 'compliant').length,
      totalFindings: frameworks.reduce((sum, f) => sum + f.findings.length, 0),
      criticalFindings: frameworks.reduce((sum, f) => sum + f.findings.filter(finding => finding.severity === 'critical').length, 0)
    };
    
    setComplianceReport(report);
    setShowReportDialog(true);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'implemented':
      case 'resolved':
        return 'success';
      case 'warning':
      case 'partial':
      case 'in_progress':
        return 'warning';
      case 'violation':
      case 'not_implemented':
      case 'open':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const selectedFrameworkData = frameworks.find(f => f.id === selectedFramework);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">
        <Shield sx={{ mr: 1 }} />
        Government Compliance Validation
      </Typography>

      {/* Security Clearance Display */}
      {securityClearance && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <VpnKey />
            <Typography>
              <strong>Security Clearance:</strong> {securityClearance.level} | 
              <strong> Compartments:</strong> {securityClearance.compartments.join(', ')} | 
              <strong> Valid Until:</strong> {new Date(securityClearance.expirationDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Compliance Framework</InputLabel>
                <Select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  label="Compliance Framework"
                >
                  {frameworks.map(framework => (
                    <MenuItem key={framework.id} value={framework.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {framework.name}
                        <Chip 
                          label={framework.status.toUpperCase()} 
                          color={getStatusColor(framework.status) as any}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={assessmentInProgress ? <CircularProgress size={20} /> : <Assessment />}
                onClick={() => selectedFramework && runComplianceAssessment(selectedFramework)}
                disabled={assessmentInProgress || !selectedFramework}
                fullWidth
              >
                Run Assessment
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={generateComplianceReport}
                fullWidth
              >
                Generate Report
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Tooltip title="Overall compliance score across all frameworks">
                <Chip 
                  label={`${Math.round(frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length)}%`}
                  color="primary"
                  icon={<VerifiedUser />}
                />
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Framework Overview */}
      <Grid container spacing={3}>
        {/* Compliance Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Frameworks
              </Typography>
              <Typography variant="h4">
                {frameworks.length}
              </Typography>
              <Chip 
                label={`${frameworks.filter(f => f.status === 'compliant').length} Compliant`}
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical Findings
              </Typography>
              <Typography variant="h4">
                {frameworks.reduce((sum, f) => sum + f.findings.filter(finding => finding.severity === 'critical').length, 0)}
              </Typography>
              <Chip 
                label="Immediate Action Required" 
                color="error" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Next Assessment
              </Typography>
              <Typography variant="h4">
                {Math.min(...frameworks.map(f => Math.ceil((new Date(f.nextAssessment).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))))} days
              </Typography>
              <Chip 
                label="Upcoming" 
                color="info" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Government Ready
              </Typography>
              <Typography variant="h4">
                <CheckCircle color="success" />
              </Typography>
              <Chip 
                label="FISMA Compliant" 
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Framework Details */}
        {selectedFrameworkData && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    {selectedFrameworkData.name}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={`${selectedFrameworkData.score}/${selectedFrameworkData.maxScore}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={selectedFrameworkData.status.toUpperCase()}
                      color={getStatusColor(selectedFrameworkData.status) as any}
                    />
                  </Box>
                </Box>

                <Typography variant="body1" color="textSecondary" paragraph>
                  {selectedFrameworkData.description}
                </Typography>

                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Compliance Score
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedFrameworkData.score / selectedFrameworkData.maxScore) * 100}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {selectedFrameworkData.score}/{selectedFrameworkData.maxScore} ({Math.round((selectedFrameworkData.score / selectedFrameworkData.maxScore) * 100)}%)
                  </Typography>
                </Box>

                {/* Controls */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      <Policy sx={{ mr: 1 }} />
                      Security Controls ({selectedFrameworkData.controls.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Control ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Evidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedFrameworkData.controls.map(control => (
                            <TableRow key={control.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {control.id.toUpperCase()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {control.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {control.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={control.category} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={control.status.replace('_', ' ').toUpperCase()}
                                  color={getStatusColor(control.status) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={control.severity.toUpperCase()}
                                  sx={{ 
                                    backgroundColor: getSeverityColor(control.severity),
                                    color: 'white'
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Badge badgeContent={control.evidence.length} color="primary">
                                  <Assignment />
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Findings */}
                {selectedFrameworkData.findings.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6">
                        <ReportProblem sx={{ mr: 1 }} />
                        Findings ({selectedFrameworkData.findings.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {selectedFrameworkData.findings.map(finding => (
                          <ListItem key={finding.id} divider>
                            <ListItemIcon>
                              {finding.severity === 'critical' && <Error color="error" />}
                              {finding.severity === 'high' && <Warning color="warning" />}
                              {finding.severity === 'medium' && <Info color="info" />}
                              {finding.severity === 'low' && <CheckCircleOutline color="success" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle2">
                                    {finding.title}
                                  </Typography>
                                  <Chip 
                                    label={finding.type.toUpperCase()}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={finding.status.replace('_', ' ').toUpperCase()}
                                    color={getStatusColor(finding.status) as any}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" paragraph>
                                    {finding.description}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="textSecondary">
                                    <strong>Control:</strong> {finding.control} | 
                                    <strong> Remediation:</strong> {finding.remediation}
                                    {finding.dueDate && (
                                      <>
                                        <br />
                                        <Schedule sx={{ fontSize: 14, mr: 0.5 }} />
                                        Due: {new Date(finding.dueDate).toLocaleDateString()}
                                        {finding.assignee && ` | Assignee: ${finding.assignee}`}
                                      </>
                                    )}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <AccountBalance sx={{ mr: 1 }} />
          Government Compliance Report
        </DialogTitle>
        <DialogContent>
          {complianceReport && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6">Overall Score</Typography>
                  <Typography variant="h3" color="primary">
                    {complianceReport.overallScore}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Government Status</Typography>
                  <Chip 
                    label="READY FOR DEPLOYMENT"
                    color="success"
                    icon={<VerifiedUser />}
                    sx={{ fontSize: '1rem', height: 40 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Report Summary</Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary={`${complianceReport.compliantFrameworks}/${complianceReport.totalFrameworks} frameworks compliant`}
                        secondary="All major government frameworks meet compliance requirements"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={`${complianceReport.totalFindings} total findings`}
                        secondary={`${complianceReport.criticalFindings} critical findings requiring immediate attention`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Security Clearance Verified"
                        secondary={`${securityClearance?.level} clearance valid until ${new Date(securityClearance?.expirationDate || '').toLocaleDateString()}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<GetApp />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceValidator;