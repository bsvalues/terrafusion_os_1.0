import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import { Business,
  LocationOn,
  Assessment,
  AttachMoney,
  CheckCircle,
  Schedule,
  Warning,
  Photo,
  Description,
  Person } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const WorkflowCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 210, 255, 0.1)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    border: '1px solid rgba(0, 210, 255, 0.3)',
    transform: 'translateY(-2px)',
  },
}));

const StepIcon = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0891b2, #00d2ff)',
  width: '40px',
  height: '40px',
}));

interface PropertyData {
  parcelId: string;
  address: string;
  propertyType: string;
  yearBuilt: string;
  squareFootage: string;
  landValue: string;
  improvementValue: string;
  totalValue: string;
  ownerName: string;
  ownerAddress: string;
}

const PropertyAssessmentWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    parcelId: '',
    address: '',
    propertyType: 'residential',
    yearBuilt: '',
    squareFootage: '',
    landValue: '',
    improvementValue: '',
    totalValue: '',
    ownerName: '',
    ownerAddress: ''
  });
  const [aiAssessmentProgress, setAiAssessmentProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    {
      label: 'Property Identification',
      description: 'Enter basic property information',
      icon: <Business />,
      required: ['parcelId', 'address']
    },
    {
      label: 'Property Details',
      description: 'Specify property characteristics',
      icon: <LocationOn />,
      required: ['propertyType', 'yearBuilt', 'squareFootage']
    },
    {
      label: 'AI Valuation',
      description: 'AI-powered assessment analysis',
      icon: <Assessment />,
      required: []
    },
    {
      label: 'Owner Information',
      description: 'Property owner details',
      icon: <Person />,
      required: ['ownerName', 'ownerAddress']
    },
    {
      label: 'Final Review',
      description: 'Review and submit assessment',
      icon: <CheckCircle />,
      required: []
    }
  ];

  const handleNext = () => {
    if (activeStep === 2) {
      // Simulate AI assessment
      setIsProcessing(true);
      setAiAssessmentProgress(0);
      
      const interval = setInterval(() => {
        setAiAssessmentProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            
            // Simulate AI-generated values
            setPropertyData(prev => ({
              ...prev,
              landValue: '$285,000',
              improvementValue: '$342,000',
              totalValue: '$627,000'
            }));
            
            setActiveStep(activeStep + 1);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      
      return;
    }
    
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleInputChange = (field: keyof PropertyData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const isStepComplete = (stepIndex: number) => {
    const step = steps[stepIndex];
    return step.required.every(field => propertyData[field as keyof PropertyData]);
  };

  const canProceed = () => {
    return isStepComplete(activeStep);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parcel ID *"
                value={propertyData.parcelId}
                onChange={handleInputChange('parcelId')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Property Address *"
                value={propertyData.address}
                onChange={handleInputChange('address')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Property Type *</InputLabel>
                <Select
value={propertyData.propertyType}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, propertyType: e.target.value }))}
                  label="Property Type *"
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem
value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                  <MenuItem
value="agricultural">Agricultural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Year Built *"
                value={propertyData.yearBuilt}
                onChange={handleInputChange('yearBuilt')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Square Footage *"
                value={propertyData.squareFootage}
                onChange={handleInputChange('squareFootage')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Box>
            {isProcessing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  🤖 Orchestrating clarity…
                </Typography>
                <LinearProgress
variant="determinate"
                  value={aiAssessmentProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #00d2ff, #667eea)',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Advancing county intelligence with 1,008 AI agents...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <WorkflowCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #00ffaa, #00cc88)', mx: 'auto', mb: 2 }}>
                        <LocationOn />
                      </Avatar>
                      <Typography
variant="h6" sx={{ color: 'white', mb: 1 }}>
                        Land Value
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#00ffaa', fontWeight: 700 }}>
                        {propertyData.landValue}
                      </Typography>
                    </CardContent>
                  </WorkflowCard>
                </Grid>
                <Grid item xs={12} md={4}>
                  <WorkflowCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #00d2ff, #0891b2)', mx: 'auto', mb: 2 }}>
                        <Business />
                      </Avatar>
                      <Typography
variant="h6" sx={{ color: 'white', mb: 1 }}>
                        Improvement Value
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#00d2ff', fontWeight: 700 }}>
                        {propertyData.improvementValue}
                      </Typography>
                    </CardContent>
                  </WorkflowCard>
                </Grid>
                <Grid item xs={12} md={4}>
                  <WorkflowCard>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', mx: 'auto', mb: 2 }}>
                        <AttachMoney />
                      </Avatar>
                      <Typography
variant="h6" sx={{ color: 'white', mb: 1 }}>
                        Total Assessed Value
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 700 }}>
                        {propertyData.totalValue}
                      </Typography>
                    </CardContent>
                  </WorkflowCard>
                </Grid>
                <Grid item xs={12}>
                  <Alert
                    severity="success"
                    sx={{
                      background: 'rgba(0, 255, 170, 0.1)',
                      border: '1px solid rgba(0, 255, 170, 0.3)',
                      color: '#00ffaa',
                      '& .MuiAlert-icon': { color: '#00ffaa' }
                    }}
                  >
                    Transcendence complete. Values generated with 99.7% confidence using quantum-enhanced analysis. Your path is clear.
                  </Alert>
                </Grid>
              </Grid>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Name *"
                value={propertyData.ownerName}
                onChange={handleInputChange('ownerName')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Address *"
                value={propertyData.ownerAddress}
                onChange={handleInputChange('ownerAddress')}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );
      
      case 4:
        return (
          <Box>
            <Alert
              severity="info"
              sx={{
                background: 'rgba(0, 210, 255, 0.1)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                color: '#00d2ff',
                mb: 3,
                '& .MuiAlert-icon': { color: '#00d2ff' }
              }}
            >
              Please review all assessment details before final submission.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Property Information</Typography>
                <Stack
spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Parcel ID:</Typography>
                    <Typography
sx={{ color: 'white' }}>{propertyData.parcelId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Address:</Typography>
                    <Typography
sx={{ color: 'white' }}>{propertyData.address}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Type:</Typography>
                    <Typography
sx={{ color: 'white' }}>{propertyData.propertyType}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Assessment Values</Typography>
                <Stack
spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Land Value:</Typography>
                    <Typography
sx={{ color: '#00ffaa' }}>{propertyData.landValue}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Improvement Value:</Typography>
                    <Typography
sx={{ color: '#00d2ff' }}>{propertyData.improvementValue}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Value:</Typography>
                    <Typography
sx={{ color: '#667eea', fontWeight: 700 }}>{propertyData.totalValue}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" className="tf-text-gradient" sx={{ mb: 3, textAlign: 'center' }}>
        🏛️ Property Assessment Workflow
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <WorkflowCard>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step , index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <StepIcon>
                          {step.icon}
                        </StepIcon>
                      )}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: activeStep === index ? '#00d2ff' : 'rgba(255, 255, 255, 0.7)',
                          fontWeight: activeStep === index ? 600 : 400,
                        },
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </WorkflowCard>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <WorkflowCard>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                {steps[activeStep].label}
              </Typography>
              
              {renderStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Back
                </Button>
                
                <Button
variant="contained"
                  onClick={handleNext}
                  disabled={!canProceed() && activeStep !== 2 && activeStep !== 4}
                  sx={{
                    background: 'linear-gradient(135deg, #00d2ff, #667eea)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0891b2, #00d2ff)',
                    },
                  }}
                >
                  {activeStep === steps.length - 1 ? 'Submit Assessment' : 
                   activeStep === 2 && !isProcessing ? 'Run AI Analysis' : 'Next'}
                </Button>
              </Box>
            </CardContent>
          </WorkflowCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PropertyAssessmentWorkflow;