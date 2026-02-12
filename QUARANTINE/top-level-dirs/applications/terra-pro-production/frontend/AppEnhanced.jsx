import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  Paper,
  AppBar,
  Toolbar,
  CircularProgress,
  Divider,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import axios from "axios";
import ValuationResults from "./components/ValuationResults";
import ShapVisualization from "./components/ShapVisualization";
import { ToastProvider, useToast } from "./components/Toast";
import ConditionPhotoUpload from "./components/ConditionPhotoUpload";
import "./App.css";

// Define property types and conditions
const conditions = ["Excellent", "Good", "Average", "Fair", "Poor"];

const propertyTypes = ["single-family", "condo", "townhouse", "multi-family", "land"];

// Helper function to format currency
function formatCurrency(value) {
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#388e3c",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

// Main App Component
function AppContent() {
  // Toast notifications
  const { showToast } = useToast();

  // Property form state
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "single-family",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    lotSize: "",
    condition: "Good",
    features: {
      "Hardwood Floors": false,
      "Updated Kitchen": false,
      Fireplace: false,
      Deck: false,
      "Swimming Pool": false,
      Garage: false,
      "Central AC": false,
      "New Roof": false,
    },
  });

  // Valuation result state
  const [valuationResult, setValuationResult] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("feature-")) {
      const featureName = name.replace("feature-", "");
      setFormData({
        ...formData,
        features: {
          ...formData.features,
          [featureName]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Sample data for Walla Walla property
  const fillSampleData = () => {
    setFormData({
      address: "4234 Old Milton Hwy",
      city: "Walla Walla",
      state: "WA",
      zipCode: "99362",
      propertyType: "single-family",
      bedrooms: "4",
      bathrooms: "2.5",
      squareFeet: "2450",
      yearBuilt: "1974",
      lotSize: "0.38",
      condition: "Good",
      features: {
        "Hardwood Floors": true,
        "Updated Kitchen": true,
        Fireplace: true,
        Deck: true,
        "Swimming Pool": false,
        Garage: true,
        "Central AC": true,
        "New Roof": true,
      },
    });

    showToast("Sample property data loaded", {
      severity: "info",
      title: "Data Filled",
    });
  };

  // SHAP data state
  const [shapData, setShapData] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValuationResult(null);
    setShapData(null);

    try {
      showToast("Starting property appraisal...", {
        severity: "info",
        title: "Processing",
      });

      // First check if we can use the real-time property analysis endpoint
      try {
        const realTimeResponse = await axios.post("/api/realtime/propertyAnalysis", {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          propertyType: formData.propertyType,
        });

        // If we got a valid estimated value (not a placeholder text)
        if (
          realTimeResponse.data.marketData &&
          realTimeResponse.data.marketData.estimatedValue &&
          typeof realTimeResponse.data.marketData.estimatedValue === "string" &&
          realTimeResponse.data.marketData.estimatedValue.includes("$")
        ) {
          const analysisData = realTimeResponse.data;

          // Format the data to display on the UI
          setValuationResult({
            estimatedValue: analysisData.marketData.estimatedValue,
            valueRange: {
              min: analysisData.marketData.estimatedValue,
              max: analysisData.marketData.estimatedValue,
            },
            confidenceLevel:
              analysisData.marketData.confidenceScore >= 0.8
                ? "high"
                : analysisData.marketData.confidenceScore >= 0.5
                  ? "medium"
                  : "low",
            adjustments: [],
            marketAnalysis: analysisData.marketData.marketTrends || "Market analysis not available",
            comparableAnalysis: analysisData.marketData.comparableSales
              ? `Based on ${analysisData.marketData.comparableSales.length} comparable properties in the area.`
              : "Comparable analysis not available",
            propertyAnalysis: analysisData.propertyAnalysis,
            appraisalSummary: analysisData.appraisalSummary,
          });

          showToast("Property valuation complete!", {
            severity: "success",
            title: "Analysis Complete",
          });

          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log("Real-time API not available, falling back to Python API");
        // Silently continue to the Python API
      }

      // If the real-time endpoint doesn't return a valid result,
      // fall back to the Python API for full valuation

      // Convert features to array format expected by API
      const featuresArray = Object.entries(formData.features)
        .filter(([_, isChecked]) => isChecked)
        .map(([name, _]) => ({ name, value: "Yes" }));

      // Prepare the request data
      const requestData = {
        property: {
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
          propertyType: formData.propertyType,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : null,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
          condition: formData.condition,
          features: featuresArray,
        },
      };

      // Use a relative URL that works with the proxy setup
      const apiUrl = "/appraise";

      // Use axios for modern API calls
      const response = await axios.post(apiUrl, requestData);

      // Set the valuation result
      setValuationResult(response.data);

      // If SHAP data is available in the response, use it
      if (response.data.shap_values || response.data.featureImportance) {
        // Process SHAP values into the format our component expects
        const shapValues = response.data.shap_values || response.data.featureImportance || [];
        const baseValue = response.data.baseValue || response.data.estimatedValue / 2; // Fallback base value

        // Transform SHAP data into the format our visualization component needs
        const formattedShapData = Array.isArray(shapValues)
          ? shapValues.map((item) => {
              // If it's already in our expected format
              if (item.name && item.impact !== undefined) {
                return item;
              }

              // If it's in a different format, try to extract needed fields
              return {
                name: item.feature || item.name || Object.keys(item)[0] || "Unknown Feature",
                impact: item.value || item.impact || Object.values(item)[0] || 0,
                value: item.rawValue || item.originalValue || item.value || "",
                explanation: item.description || item.explanation || "",
              };
            })
          : [];

        setShapData({
          shapValues: formattedShapData,
          baseValue: baseValue,
        });
      } else {
        // Create sample SHAP data based on the property details
        const sampleShapData = [
          {
            name: "Square Footage",
            impact: formData.squareFeet ? formData.squareFeet * 50 : 25000,
            value: formData.squareFeet || "N/A",
            explanation: "Property size is a primary factor in valuation.",
          },
          {
            name: "Location (Neighborhood)",
            impact: 30000,
            value: formData.city,
            explanation: "Property location significantly affects market value.",
          },
          {
            name: "Year Built",
            impact: formData.yearBuilt ? (2023 - parseInt(formData.yearBuilt)) * -500 : -15000,
            value: formData.yearBuilt || "N/A",
            explanation:
              "Older properties may have lower values due to potential maintenance needs.",
          },
          {
            name: "Bathrooms",
            impact: formData.bathrooms ? parseFloat(formData.bathrooms) * 10000 : 20000,
            value: formData.bathrooms || "N/A",
            explanation: "Additional bathrooms increase property value.",
          },
          {
            name: "Condition",
            impact:
              formData.condition === "Excellent"
                ? 25000
                : formData.condition === "Good"
                  ? 15000
                  : formData.condition === "Average"
                    ? 0
                    : formData.condition === "Fair"
                      ? -10000
                      : -20000,
            value: formData.condition,
            explanation: "Property condition directly impacts market value.",
          },
        ];

        // Add feature-based impacts
        Object.entries(formData.features)
          .filter(([_, isChecked]) => isChecked)
          .forEach(([feature, _]) => {
            const featureImpact = {
              "Hardwood Floors": 8000,
              "Updated Kitchen": 15000,
              Fireplace: 5000,
              Deck: 7000,
              "Swimming Pool": 20000,
              Garage: 10000,
              "Central AC": 12000,
              "New Roof": 15000,
            };

            sampleShapData.push({
              name: feature,
              impact: featureImpact[feature] || 5000,
              value: "Yes",
              explanation: `${feature} adds value to the property.`,
            });
          });

        setShapData({
          shapValues: sampleShapData,
          baseValue: response.data.estimatedValue * 0.6, // Base is 60% of final value
        });
      }

      showToast("Property valuation complete!", {
        severity: "success",
        title: "Analysis Complete",
      });
    } catch (error) {
      console.error("Error during valuation:", error);
      setError("Failed to perform valuation. Please try again.");

      showToast("Valuation failed. Please check your inputs and try again.", {
        severity: "error",
        title: "Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <HomeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Terrafusion Core AI Valuator
          </Typography>
          <Button color="inherit">Documentation</Button>
          <Button color="inherit">Help</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Advanced Property Valuation with AI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center">
            Enter your property details below for a comprehensive AI-powered valuation analysis
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <SearchIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h5" component="h2">
                  Property Details
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" size="small" onClick={fillSampleData}>
                  Fill Sample Data
                </Button>
              </Box>

              <form onSubmit={handleSubmit}>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ mt: 2, color: theme.palette.text.secondary }}
                >
                  Location
                </Typography>

                <TextField
                  fullWidth
                  margin="normal"
                  id="address"
                  name="address"
                  label="Street Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  variant="outlined"
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="city"
                      name="city"
                      label="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="state"
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="zipCode"
                      name="zipCode"
                      label="ZIP Code"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                </Grid>

                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ mt: 3, color: theme.palette.text.secondary }}
                >
                  Property Characteristics
                </Typography>

                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="property-type-label">Property Type</InputLabel>
                  <Select
                    labelId="property-type-label"
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    label="Property Type"
                    required
                  >
                    {propertyTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="bedrooms"
                      name="bedrooms"
                      label="Bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="bathrooms"
                      name="bathrooms"
                      label="Bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="yearBuilt"
                      name="yearBuilt"
                      label="Year Built"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      InputProps={{
                        inputProps: {
                          min: 1800,
                          max: new Date().getFullYear(),
                        },
                      }}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="squareFeet"
                      name="squareFeet"
                      label="Square Feet"
                      type="number"
                      value={formData.squareFeet}
                      onChange={handleInputChange}
                      InputProps={{ inputProps: { min: 0 } }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      id="lotSize"
                      name="lotSize"
                      label="Lot Size (acres)"
                      type="number"
                      value={formData.lotSize}
                      onChange={handleInputChange}
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>

                {/* Property Condition Photo Analysis */}
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 500 }}>
                  AI-Powered Condition Analysis
                </Typography>
                <Paper
                  elevation={0}
                  sx={{ p: 0, mb: 2, bgcolor: "background.paper", borderRadius: 1 }}
                >
                  <ConditionPhotoUpload
                    onScore={(score) => {
                      // Convert numerical score to condition level
                      let condition = "";
                      if (score >= 4.5) condition = "Excellent";
                      else if (score >= 3.5) condition = "Good";
                      else if (score >= 2.5) condition = "Average";
                      else if (score >= 1.5) condition = "Fair";
                      else condition = "Poor";

                      // Update the form data with the condition score
                      setFormData((prev) => ({ ...prev, condition }));

                      // Show a toast notification
                      showToast(`Property condition automatically set to ${condition}`, {
                        severity: "success",
                        title: "AI Analysis Complete",
                      });
                    }}
                  />
                </Paper>

                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="condition-label">Condition</InputLabel>
                  <Select
                    labelId="condition-label"
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    label="Condition"
                  >
                    {conditions.map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        {condition}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ mt: 3, color: theme.palette.text.secondary }}
                >
                  Features
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {Object.keys(formData.features).map((feature) => (
                    <Grid item xs={6} sm={4} key={feature}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.features[feature]}
                            onChange={handleInputChange}
                            name={`feature-${feature}`}
                            color="primary"
                          />
                        }
                        label={feature}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <AssessmentIcon />
                      )
                    }
                  >
                    {isLoading ? "Analyzing Property..." : "Appraise Property"}
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {error && (
              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: "#fdeded" }}>
                <Typography color="error" variant="body1">
                  {error}
                </Typography>
              </Paper>
            )}

            {isLoading && (
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: "center",
                  minHeight: "300px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <CircularProgress sx={{ mb: 3 }} />
                <Typography variant="h6">
                  Analyzing property data and market conditions...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Our AI is evaluating comparable properties, market trends, and property features
                </Typography>
              </Paper>
            )}

            {!isLoading && valuationResult && (
              <ValuationResults
                valuationResult={valuationResult}
                propertyDetails={{
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                  propertyType: formData.propertyType,
                  bedrooms: formData.bedrooms,
                  bathrooms: formData.bathrooms,
                  squareFeet: formData.squareFeet,
                  yearBuilt: formData.yearBuilt,
                  lotSize: formData.lotSize,
                  condition: formData.condition,
                  features: Object.entries(formData.features)
                    .filter(([_, isChecked]) => isChecked)
                    .map(([name]) => name),
                }}
                shapData={shapData}
              />
            )}
          </Grid>
        </Grid>
      </Container>

      <Box component="footer" sx={{ bgcolor: "background.paper", py: 3, mt: 5 }}>
        <Container maxWidth="lg">
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Terrafusion. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
