/**
 * TerraFusion React Component Templates
 * Reusable component patterns for property assessment interfaces
 *
 * Includes:
 * - Assessment form components
 * - Property display components
 * - Data visualization components
 * - Government UI compliance patterns
 * - Accessibility features
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  LinearProgress,} from '@mui/material';
import {styled} from '@mui/material/styles';
import type {PropertyAssessment, CreateAssessmentRequest} from './api-client-template';

// =============================================
// STYLED COMPONENTS (Government UI Standards)
// =============================================

const GovCard = styled(Card)(({theme}) => ({border: '2px solid #0099ff',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 153, 255, 0.1)',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 153, 255, 0.15)',},
}));

const GovButton = styled(Button)(({theme}) => ({backgroundColor: '#0099ff',
  color: 'white',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: '#0077cc',},
  '&.secondary': {backgroundColor: '#00ffee',
    color: '#000',
    '&:hover': {
      backgroundColor: '#00ccbb',},
  },
}));

const ValueDisplay = styled(Typography)(({theme}) => ({fontFamily: 'monospace',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: '#0099ff',}));

const StatusChip = styled(Chip)<{status: 'draft' | 'pending' | 'approved' | 'rejected'}>(
  ({status, theme}) => ({fontWeight: 'bold',
    ...(status === 'approved' && {
      backgroundColor: '#00ffaa',
      color: '#000',}),
    ...(status === 'pending' && {backgroundColor: '#ffaa00',
      color: '#000',}),
    ...(status === 'rejected' && {backgroundColor: '#ff4444',
      color: '#fff',}),
    ...(status === 'draft' && {backgroundColor: '#cccccc',
      color: '#000',}),
  })
);

// =============================================
// INTERFACES
// =============================================

interface AssessmentFormProps {onSubmit: (data: CreateAssessmentRequest) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<CreateAssessmentRequest>;
  mode?: 'create' | 'edit';}

interface PropertyCardProps {assessment: PropertyAssessment;
  onEdit?: (assessment: PropertyAssessment) => void;
  onView?: (assessment: PropertyAssessment) => void;
  showActions?: boolean;}

interface AssessmentListProps {assessments: PropertyAssessment[];
  loading?: boolean;
  onEdit?: (assessment: PropertyAssessment) => void;
  onView?: (assessment: PropertyAssessment) => void;
  onDelete?: (assessmentId: string) => void;}

interface AssessmentStatsProps {totalAssessments: number;
  avgValue: number;
  pendingCount: number;
  completedToday: number;
  loading?: boolean;}

// =============================================
// ASSESSMENT FORM COMPONENT
// =============================================

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onSubmit,
  loading = false,
  initialData = {},
  mode = 'create',
}) => {const [formData, setFormData] = useState<Partial<CreateAssessmentRequest>>({
    propertyType: 'residential',
    ...initialData,});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange =
    (field: keyof CreateAssessmentRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {const value = event.target.value;
      setFormData(prev => ({ ...prev, [field]: value}));

      // Clear error when user starts typing
      if (errors[field]) {setErrors(prev => ({ ...prev, [field]: ''}));
      }
    };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string>= {};

    if (!formData.parcelNumber) {newErrors.parcelNumber = 'Parcel number is required';} else if (!/^\d{6}$/.test(formData.parcelNumber)) {newErrors.parcelNumber = 'Parcel number must be 6 digits';}

    if (!formData.address) {newErrors.address = 'Property address is required';}

    if (!formData.lotSize || formData.lotSize<= 0) {newErrors.lotSize = 'Lot size must be greater than 0';}

    if (formData.buildingArea && formData.buildingArea < 0) {newErrors.buildingArea = 'Building area cannot be negative';}

    if (
      formData.yearBuilt &&
      (formData.yearBuilt < 1800 || formData.yearBuilt >new Date().getFullYear())
    ) {newErrors.yearBuilt = 'Year built must be between 1800 and current year';}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {event.preventDefault();

    if (!validateForm()) {
      return;}

    try {await onSubmit(formData as CreateAssessmentRequest);} catch (error) {console.error('Form submission error:', error);}
  };

  return (<GovCard><CardHeader
        title={mode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
        titleTypographyProps={{ variant: 'h5', fontWeight: 'bold'}} /><CardContent><form onSubmit={handleSubmit} noValidate><Grid container spacing={3}><Grid item xs={12} md={6}><TextField
                fullWidth
                label="Parcel Number"
                value={formData.parcelNumber || ''}
                onChange={handleInputChange('parcelNumber')}
                error={!!errors.parcelNumber}
                helperText={errors.parcelNumber || 'Enter 6-digit parcel number'}
                required
                inputProps={{ maxLength: 6}} /></Grid><Grid item xs={12} md={6}><FormControl fullWidth required><InputLabel>Property Type</InputLabel><Select
                  value={formData.propertyType || 'residential'}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, propertyType: e.target.value as any}))
                  }
                  label="Property Type"
                ><MenuItem value="residential">Residential</MenuItem><MenuItem value="commercial">Commercial</MenuItem><MenuItem value="industrial">Industrial</MenuItem><MenuItem value="agricultural">Agricultural</MenuItem></Select></FormControl></Grid><Grid item xs={12}><TextField
                fullWidth
                label="Property Address"
                value={formData.address || ''}
                onChange={handleInputChange('address')}
                error={!!errors.address}
                helperText={errors.address || 'Enter complete property address'}
                required
                multiline
                rows={2} /></Grid><Grid item xs={12} md={4}><TextField
                fullWidth
                label="Lot Size (acres)"
                type="number"
                value={formData.lotSize || ''}
                onChange={handleInputChange('lotSize')}
                error={!!errors.lotSize}
                helperText={errors.lotSize}
                required
                inputProps={{ min: 0.01, step: 0.01}} /></Grid><Grid item xs={12} md={4}><TextField
                fullWidth
                label="Building Area (sq ft)"
                type="number"
                value={formData.buildingArea || ''}
                onChange={handleInputChange('buildingArea')}
                error={!!errors.buildingArea}
                helperText={errors.buildingArea}
                inputProps={{ min: 0}} /></Grid><Grid item xs={12} md={4}><TextField
                fullWidth
                label="Year Built"
                type="number"
                value={formData.yearBuilt || ''}
                onChange={handleInputChange('yearBuilt')}
                error={!!errors.yearBuilt}
                helperText={errors.yearBuilt}
                inputProps={{ min: 1800, max: new Date().getFullYear()}} /></Grid>{formData.propertyType === 'residential' && (<><Grid item xs={12} md={6}><TextField
                    fullWidth
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms || ''}
                    onChange={handleInputChange('bedrooms')}
                    inputProps={{ min: 0}} /></Grid><Grid item xs={12} md={6}><TextField
                    fullWidth
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms || ''}
                    onChange={handleInputChange('bathrooms')}
                    inputProps={{ min: 0, step: 0.5}} /></Grid></>)}<Grid item xs={12}><Box display="flex" gap={2} justifyContent="flex-end"><GovButton
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} />: null}
                >
                  {loading
                    ? 'Processing...'
                    : mode === 'create'
                      ? 'Create Assessment'
                      : 'Update Assessment'}</GovButton></Box></Grid></Grid></form></CardContent></GovCard>
  );
};

// =============================================
// PROPERTY CARD COMPONENT
// =============================================

export const PropertyCard: React.FC<PropertyCardProps>= ({assessment,
  onEdit,
  onView,
  showActions = true,}) => {const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,}).format(value);
  };

  const getConfidenceColor = (confidence: number): string => {if (confidence >= 0.9) return '#00ffaa';
    if (confidence >= 0.8) return '#ffaa00';
    return '#ff4444';};

  return (<GovCard><CardHeader
        title={<Typography variant="h6" fontWeight="bold">{assessment.address}</Typography>
        }
        subheader={`Parcel: ${assessment.parcelNumber}`}
        action={<StatusChip
            label={`${(assessment.confidence * 100).toFixed(1)}% Confidence`}
            status="approved"
            style={{ backgroundColor: getConfidenceColor(assessment.confidence)}} />
        }
      /><CardContent><Grid container spacing={2}><Grid item xs={12} md={6}><Typography variant="subtitle2" color="textSecondary">Land Value</Typography><ValueDisplay>{formatCurrency(assessment.landValue)}</ValueDisplay></Grid><Grid item xs={12} md={6}><Typography variant="subtitle2" color="textSecondary">Improvement Value</Typography><ValueDisplay>{formatCurrency(assessment.improvementValue)}</ValueDisplay></Grid><Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Total Assessed Value</Typography><Typography variant="h5" fontWeight="bold" color="primary">{formatCurrency(assessment.totalAssessedValue)}</Typography></Grid><Grid item xs={12} md={6}><Typography variant="subtitle2" color="textSecondary">Market Value</Typography><Typography variant="h6">{formatCurrency(assessment.marketValue)}</Typography></Grid><Grid item xs={12} md={6}><Typography variant="subtitle2" color="textSecondary">Market Trend</Typography><Chip
              label={`${assessment.aiAnalysis.marketTrends.trend.toUpperCase()} ${assessment.aiAnalysis.marketTrends.changePercent > 0 ? '+' : ''}${assessment.aiAnalysis.marketTrends.changePercent.toFixed(1)}%`}
              color={assessment.aiAnalysis.marketTrends.trend === 'increasing'
                  ? 'success'
                  : assessment.aiAnalysis.marketTrends.trend === 'decreasing'
                    ? 'error'
                    : 'default'}
            /></Grid>{assessment.aiAnalysis.riskFactors.length > 0 && (<Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Risk Factors</Typography><Box display="flex" gap={1} flexWrap="wrap">{assessment.aiAnalysis.riskFactors.map((risk, index) => (<Chip key={index} label={risk} size="small" variant="outlined" />))}</Box></Grid>)}

          {showActions && (<Grid item xs={12}><Box display="flex" gap={1} justifyContent="flex-end">{onView && (<Button variant="outlined" onClick={() =>onView(assessment)}>
                    View Details</Button>)}
                {onEdit && (<GovButton onClick={() => onEdit(assessment)}>Edit Assessment</GovButton>)}</Box></Grid>)}</Grid></CardContent></GovCard>
  );
};

// =============================================
// ASSESSMENT LIST COMPONENT
// =============================================

export const AssessmentList: React.FC<AssessmentListProps>= ({assessments,
  loading = false,
  onEdit,
  onView,
  onDelete,}) => {const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,}).format(value);
  };

  if (loading) {
    return (<GovCard><CardContent><Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress size={50} /></Box></CardContent></GovCard>);
  }

  return (<GovCard><CardHeader
        title="Property Assessments"
        titleTypographyProps={{ variant: 'h5', fontWeight: 'bold'}} /><CardContent><TableContainer component={Paper}><Table><TableHead><TableRow><TableCell><strong>Parcel</strong></TableCell><TableCell><strong>Address</strong></TableCell><TableCell align="right"><strong>Assessed Value</strong></TableCell><TableCell align="right"><strong>Market Value</strong></TableCell><TableCell align="center"><strong>Confidence</strong></TableCell><TableCell align="center"><strong>Actions</strong></TableCell></TableRow></TableHead><TableBody>{assessments.map(assessment => (<TableRow key={assessment.id} hover><TableCell>{assessment.parcelNumber}</TableCell><TableCell><Typography variant="body2" style={{ maxWidth: 200}}>{assessment.address}</Typography></TableCell><TableCell align="right"><ValueDisplay variant="body2">{formatCurrency(assessment.totalAssessedValue)}</ValueDisplay></TableCell><TableCell align="right">{formatCurrency(assessment.marketValue)}</TableCell><TableCell align="center"><LinearProgress
                      variant="determinate"
                      value={assessment.confidence * 100}
                      style={{ width: 60}} /><Typography variant="caption">{(assessment.confidence * 100).toFixed(0)}%</Typography></TableCell><TableCell align="center"><Box display="flex" gap={1}>{onView && (<Button size="small" onClick={() =>onView(assessment)}>
                          View</Button>)}
                      {onEdit && (<Button size="small" onClick={() =>onEdit(assessment)}>
                          Edit</Button>)}
                      {onDelete && (<Button size="small" color="error" onClick={() =>onDelete(assessment.id)}>
                          Delete</Button>)}</Box></TableCell></TableRow>))}</TableBody></Table></TableContainer>{assessments.length === 0 && (<Box textAlign="center" py={4}><Typography variant="h6" color="textSecondary">No assessments found</Typography><Typography variant="body2" color="textSecondary">Create your first property assessment to get started.</Typography></Box>)}</CardContent></GovCard>
  );
};

// =============================================
// ASSESSMENT STATS DASHBOARD
// =============================================

export const AssessmentStats: React.FC<AssessmentStatsProps> = ({totalAssessments,
  avgValue,
  pendingCount,
  completedToday,
  loading = false,}) => {const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,}).format(value);
  };

  const StatCard: React.FC<{title: string;
    value: string | number;
    color?: string;
    loading?: boolean;}>= ({title, value, color = '#0099ff', loading = false}) => (<Paper elevation={2} style={{ padding: 16, textAlign: 'center'}}><Typography variant="subtitle2" color="textSecondary">{title}</Typography>{loading ? (<CircularProgress size={24} />) : (<Typography variant="h4" style={{ color, fontWeight: 'bold'}}>{value}</Typography>)}</Paper>);

  return (<Box><Typography variant="h5" fontWeight="bold" gutterBottom>Assessment Dashboard</Typography><Grid container spacing={3}><Grid item xs={12} sm={6} md={3}><StatCard
            title="Total Assessments"
            value={totalAssessments.toLocaleString()}
            loading={loading} /></Grid><Grid item xs={12} sm={6} md={3}><StatCard
            title="Average Value"
            value={formatCurrency(avgValue)}
            color="#00ffee"
            loading={loading} /></Grid><Grid item xs={12} sm={6} md={3}><StatCard title="Pending Review" value={pendingCount} color="#ffaa00" loading={loading} /></Grid><Grid item xs={12} sm={6} md={3}><StatCard
            title="Completed Today"
            value={completedToday}
            color="#00ffaa"
            loading={loading} /></Grid></Grid></Box>
  );
};

// =============================================
// SEARCH AND FILTER COMPONENT
// =============================================

interface SearchFiltersProps {onSearch: (filters: {
    address?: string;
    parcelNumber?: string;
    minValue?: number;
    maxValue?: number;
    propertyType?: string;}) => void;
  loading?: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps>= ({onSearch, loading = false}) => {const [filters, setFilters] = useState({
    address: '',
    parcelNumber: '',
    minValue: '',
    maxValue: '',
    propertyType: '',});

  const handleSearch = () => {
    const searchFilters: any = {};

    if (filters.address) searchFilters.address = filters.address;
    if (filters.parcelNumber) searchFilters.parcelNumber = filters.parcelNumber;
    if (filters.minValue) searchFilters.minValue = parseFloat(filters.minValue);
    if (filters.maxValue) searchFilters.maxValue = parseFloat(filters.maxValue);
    if (filters.propertyType) searchFilters.propertyType = filters.propertyType;

    onSearch(searchFilters);
  };

  const handleReset = () => {setFilters({
      address: '',
      parcelNumber: '',
      minValue: '',
      maxValue: '',
      propertyType: '',});
    onSearch({});
  };

  return (<GovCard><CardHeader
        title="Search & Filter Assessments"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold'}} /><CardContent><Grid container spacing={2}><Grid item xs={12} md={4}><TextField
              fullWidth
              label="Address"
              value={filters.address}
              onChange={e => setFilters(prev => ({ ...prev, address: e.target.value}))}
              placeholder="Enter property address"
            /></Grid><Grid item xs={12} md={4}><TextField
              fullWidth
              label="Parcel Number"
              value={filters.parcelNumber}
              onChange={e => setFilters(prev => ({ ...prev, parcelNumber: e.target.value}))}
              placeholder="Enter parcel number"
            /></Grid><Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>Property Type</InputLabel><Select
                value={filters.propertyType}
                onChange={e => setFilters(prev => ({ ...prev, propertyType: e.target.value}))}
                label="Property Type"
              ><MenuItem value="">All Types</MenuItem><MenuItem value="residential">Residential</MenuItem><MenuItem value="commercial">Commercial</MenuItem><MenuItem value="industrial">Industrial</MenuItem><MenuItem value="agricultural">Agricultural</MenuItem></Select></FormControl></Grid><Grid item xs={12} md={6}><TextField
              fullWidth
              label="Min Value"
              type="number"
              value={filters.minValue}
              onChange={e => setFilters(prev => ({ ...prev, minValue: e.target.value}))}
              placeholder="Minimum assessed value"
              InputProps={{ startAdornment: '$'}}
            /></Grid><Grid item xs={12} md={6}><TextField
              fullWidth
              label="Max Value"
              type="number"
              value={filters.maxValue}
              onChange={e => setFilters(prev => ({ ...prev, maxValue: e.target.value}))}
              placeholder="Maximum assessed value"
              InputProps={{ startAdornment: '$'}}
            /></Grid><Grid item xs={12}><Box display="flex" gap={2} justifyContent="flex-end"><Button variant="outlined" onClick={handleReset}>Reset</Button><GovButton
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} />: null}
              >
                {loading ? 'Searching...' : 'Search'}</GovButton></Box></Grid></Grid></CardContent></GovCard>);
};

// =============================================
// EXPORT ALL COMPONENTS
// =============================================

export {GovCard, GovButton, ValueDisplay, StatusChip};

export type {AssessmentFormProps,
  PropertyCardProps,
  AssessmentListProps,
  AssessmentStatsProps,
  SearchFiltersProps,};

// Usage Example:
/*
import {AssessmentForm,
  PropertyCard,
  AssessmentList,
  AssessmentStats,
  SearchFilters} from './react-component-templates';

const MyAssessmentApp = () => {const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateAssessment = async (data: CreateAssessmentRequest) => {
    setLoading(true);
    try {
      const newAssessment = await api.assessments.create(data);
      setAssessments(prev => [...prev, newAssessment]);} catch (error) {console.error('Failed to create assessment:', error);} finally {setLoading(false);}
  };

  const handleSearch = async (filters: any) => {setLoading(true);
    try {
      const results = await api.assessments.search(filters);
      setAssessments(results.assessments);} catch (error) {console.error('Search failed:', error);} finally {setLoading(false);}
  };

  return (<Box p={3}><AssessmentStats
        totalAssessments={assessments.length}
        avgValue={assessments.reduce((sum, a) => sum + a.totalAssessedValue, 0) / assessments.length}
        pendingCount={0}
        completedToday={5}
      /><Box mt={3}><SearchFilters onSearch={handleSearch} loading={loading} /></Box><Box mt={3}><AssessmentForm onSubmit={handleCreateAssessment} loading={loading} /></Box><Box mt={3}><AssessmentList assessments={assessments} loading={loading} /></Box></Box>
  );
};
*/
