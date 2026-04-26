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
  Stack,
} from '@mui/material';
import {
  Business,
  LocationOn,
  Assessment,
  AttachMoney,
  CheckCircle,
  Schedule,
  Warning,
  Photo,
  Description,
  Person,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const WorkflowCard = styled(Card)(({ theme }) => ({
  /* HS Channel Anchors (file-local, property-assessment-workflow palette) */
  '--tf-paw-neutral-hs': '0 0%',
  '--tf-paw-cyan-hs': '191 100%',
  '--tf-paw-green-hs': '160 100%',
  background: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-paw-cyan-hs) 50% / 0.1)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    border: '1px solid hsl(var(--tf-paw-cyan-hs) 50% / 0.3)',
    transform: 'translateY(-2px)',
  },
}));

const StepIcon = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-cyan))',
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
    ownerAddress: '',
  });
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const steps = [
    {
      label: 'Property Identification',
      description: 'Enter basic property information',
      icon: <Business />,
      required: ['parcelId', 'address'],
    },
    {
      label: 'Property Details',
      description: 'Specify property characteristics',
      icon: <LocationOn />,
      required: ['propertyType', 'yearBuilt', 'squareFootage'],
    },
    {
      label: 'Valuation Evidence',
      description: 'Enter source-backed valuation evidence',
      icon: <Assessment />,
      required: ['landValue', 'improvementValue', 'totalValue'],
    },
    {
      label: 'Owner Information',
      description: 'Property owner details',
      icon: <Person />,
      required: ['ownerName', 'ownerAddress'],
    },
    {
      label: 'Final Review',
      description: 'Review and submit assessment',
      icon: <CheckCircle />,
      required: [],
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setSubmissionMessage('Assessment submission is unavailable until a governed backend/Pilot action is configured.');
      return;
    }

    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleInputChange =
    (field: keyof PropertyData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPropertyData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const isStepComplete = (stepIndex: number) => {
    const step = steps[stepIndex];
    return step.required.every((field) => propertyData[field as keyof PropertyData]);
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
                label='Parcel ID *'
                value={propertyData.parcelId}
                onChange={handleInputChange('parcelId')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Property Address *'
                value={propertyData.address}
                onChange={handleInputChange('address')}
                variant='outlined'
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
                  onChange={(e) =>
                    setPropertyData((prev) => ({ ...prev, propertyType: e.target.value }))
                  }
                  label='Property Type *'
                >
                  <MenuItem value='residential'>Residential</MenuItem>
                  <MenuItem value='commercial'>Commercial</MenuItem>

                  <MenuItem value='industrial'>Industrial</MenuItem>
                  <MenuItem value='agricultural'>Agricultural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Year Built *'
                value={propertyData.yearBuilt}
                onChange={handleInputChange('yearBuilt')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Square Footage *'
                value={propertyData.squareFootage}
                onChange={handleInputChange('squareFootage')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert
                severity='warning'
                sx={{
                  background: 'hsl(var(--tf-paw-cyan-hs) 50% / 0.1)',
                  border: '1px solid hsl(var(--tf-paw-cyan-hs) 50% / 0.3)',
                  color: 'var(--tf-transcend-cyan)',
                  '& .MuiAlert-icon': { color: 'var(--tf-transcend-cyan)' },
                }}
              >
                Governed AI valuation is not connected. Enter values only from source-backed assessment evidence.
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Land Value *'
                value={propertyData.landValue}
                onChange={handleInputChange('landValue')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Improvement Value *'
                value={propertyData.improvementValue}
                onChange={handleInputChange('improvementValue')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Total Assessed Value *'
                value={propertyData.totalValue}
                onChange={handleInputChange('totalValue')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Owner Name *'
                value={propertyData.ownerName}
                onChange={handleInputChange('ownerName')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Owner Address *'
                value={propertyData.ownerAddress}
                onChange={handleInputChange('ownerAddress')}
                variant='outlined'
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Alert
              severity='info'
              sx={{
                background: 'hsl(var(--tf-paw-cyan-hs) 50% / 0.1)',
                border: '1px solid hsl(var(--tf-paw-cyan-hs) 50% / 0.3)',
                color: 'var(--tf-transcend-cyan)',
                mb: 3,
                '& .MuiAlert-icon': { color: 'var(--tf-transcend-cyan)' },
              }}
            >
              Please review all assessment details before final submission.
            </Alert>
            {submissionMessage && (
              <Alert severity='warning' sx={{ mb: 3 }}>
                {submissionMessage}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ color: 'white', mb: 2 }}>
                  Property Information
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>Parcel ID:</Typography>
                    <Typography sx={{ color: 'white' }}>{propertyData.parcelId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>Address:</Typography>
                    <Typography sx={{ color: 'white' }}>{propertyData.address}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>Type:</Typography>
                    <Typography sx={{ color: 'white' }}>{propertyData.propertyType}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ color: 'white', mb: 2 }}>
                  Assessment Values
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>Land Value:</Typography>
                    <Typography sx={{ color: 'var(--tf-accent-success)' }}>{propertyData.landValue}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>
                      Improvement Value:
                    </Typography>
                    <Typography sx={{ color: 'var(--tf-transcend-cyan)' }}>
                      {propertyData.improvementValue}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)' }}>Total Value:</Typography>
                    <Typography sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 700 }}>
                      {propertyData.totalValue}
                    </Typography>
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
      <Typography variant='h4' className='tf-text-gradient' sx={{ mb: 3, textAlign: 'center' }}>
        🏛️ Property Assessment Workflow
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <WorkflowCard>
            <CardContent>
              <Stepper activeStep={activeStep} orientation='vertical'>
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => <StepIcon>{step.icon}</StepIcon>}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: activeStep === index ? 'var(--tf-transcend-cyan)' : 'hsl(var(--tf-paw-neutral-hs) 100% / 0.7)',
                          fontWeight: activeStep === index ? 600 : 400,
                        },
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant='body2' sx={{ color: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.6)' }}>
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
              <Typography variant='h6' sx={{ color: 'white', mb: 3 }}>
                {steps[activeStep].label}
              </Typography>

              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant='outlined'
                  sx={{
                    color: 'white',
                    borderColor: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.3)',
                    '&:hover': {
                      borderColor: 'hsl(var(--tf-paw-neutral-hs) 100% / 0.5)',
                    },
                  }}
                >
                  Back
                </Button>

                <Button
                  variant='contained'
                  onClick={handleNext}
                  disabled={!canProceed() && activeStep !== 2 && activeStep !== 4}
                  sx={{
                    background: 'linear-gradient(135deg, var(--tf-transcend-cyan), var(--tf-accent-quantum))',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-cyan))',
                    },
                  }}
                >
                  {activeStep === steps.length - 1
                    ? 'Submit Assessment'
                    : activeStep === 2
                      ? 'Continue with Evidence'
                      : 'Next'}
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
