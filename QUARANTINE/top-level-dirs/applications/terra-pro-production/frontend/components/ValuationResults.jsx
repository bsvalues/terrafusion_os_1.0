import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BedIcon from "@mui/icons-material/Bed";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import KingBedIcon from "@mui/icons-material/KingBed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ShapVisualization from "./ShapVisualization";

/**
 * Component to display valuation results
 */
const ValuationResults = ({ valuationResult, propertyDetails, shapData }) => {
  if (!valuationResult) return null;

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    if (typeof value === "string" && value.includes("$")) return value;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper to format large numbers (e.g. sqft)
  const formatNumber = (value) => {
    if (!value && value !== 0) return "N/A";
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Get confidence color based on level
  const getConfidenceColor = (level) => {
    const confidenceLevels = {
      high: "#4caf50",
      medium: "#ff9800",
      low: "#f44336",
    };

    return confidenceLevels[level?.toLowerCase()] || confidenceLevels.medium;
  };

  return (
    <Box>
      {/* Valuation Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AssessmentIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" component="h2">
              Property Valuation
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Main valuation number */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
              {valuationResult.estimatedValue
                ? formatCurrency(valuationResult.estimatedValue)
                : "Valuation Pending"}
            </Typography>

            {valuationResult.valueRange && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Range: {formatCurrency(valuationResult.valueRange.min)} -{" "}
                {formatCurrency(valuationResult.valueRange.max)}
              </Typography>
            )}

            {valuationResult.confidenceLevel && (
              <Chip
                label={`${valuationResult.confidenceLevel.toUpperCase()} CONFIDENCE`}
                sx={{
                  mt: 1,
                  bgcolor: getConfidenceColor(valuationResult.confidenceLevel),
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            )}
          </Box>

          {/* Property details summary */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <HomeIcon sx={{ color: "primary.main", mr: 1 }} />
                  <Typography variant="subtitle2">
                    {propertyDetails.propertyType || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOnIcon sx={{ color: "primary.main", mr: 1 }} />
                  <Typography variant="subtitle2">
                    {propertyDetails.address}, {propertyDetails.city}, {propertyDetails.state}{" "}
                    {propertyDetails.zipCode}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BedIcon sx={{ color: "primary.main", mr: 1 }} />
                    <Typography variant="subtitle2">
                      {propertyDetails.bedrooms || "N/A"} Beds
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <BathtubIcon sx={{ color: "primary.main", mr: 1 }} />
                    <Typography variant="subtitle2">
                      {propertyDetails.bathrooms || "N/A"} Baths
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <SquareFootIcon sx={{ color: "primary.main", mr: 1 }} />
                    <Typography variant="subtitle2">
                      {formatNumber(propertyDetails.squareFeet) || "N/A"} sqft
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CalendarTodayIcon sx={{ color: "primary.main", mr: 1 }} />
                    <Typography variant="subtitle2">
                      Built {propertyDetails.yearBuilt || "N/A"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* SHAP Visualization */}
      {shapData && <ShapVisualization shapData={shapData} />}

      {/* Detailed Analysis */}
      <Box sx={{ mt: 3 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Market Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {valuationResult.marketAnalysis || "Market analysis not available"}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Comparable Properties</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {valuationResult.comparableAnalysis || "Comparable analysis not available"}
            </Typography>

            {valuationResult.marketData?.comparableSales && (
              <Grid container spacing={2}>
                {valuationResult.marketData.comparableSales.map((comp /* , index */) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {comp.address}
                        </Typography>
                        <Typography variant="h6">{comp.salePrice}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comp.saleDate}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            {comp.bedrooms} bd, {comp.bathrooms} ba, {formatNumber(comp.squareFeet)}{" "}
                            sqft
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Adjustments</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {valuationResult.adjustments && valuationResult.adjustments.length > 0 ? (
              <List sx={{ width: "100%" }}>
                {valuationResult.adjustments.map((adjustment /* , index */) => (
                  <React.Fragment key={index}>
                    <ListItem
                      secondaryAction={
                        <Typography
                          variant="body1"
                          sx={{
                            color: adjustment.amount >= 0 ? "success.main" : "error.main",
                            fontWeight: "medium",
                          }}
                        >
                          {adjustment.amount >= 0 ? "+" : ""}
                          {formatCurrency(adjustment.amount)}
                        </Typography>
                      }
                    >
                      <ListItemIcon>
                        {adjustment.amount >= 0 ? (
                          <ArrowUpwardIcon color="success" />
                        ) : (
                          <ArrowDownwardIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={adjustment.factor}
                        secondary={adjustment.description}
                      />
                    </ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 7, pr: 2, pb: 2 }}>
                      {adjustment.reasoning}
                    </Typography>
                    {index < valuationResult.adjustments.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1">No adjustments applied</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {valuationResult.appraisalSummary && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Appraisal Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" gutterBottom>
                <strong>Approach:</strong>{" "}
                {valuationResult.appraisalSummary.valuationApproach ||
                  valuationResult.valuationMethodology ||
                  "Standard appraisal methodology"}
              </Typography>

              {valuationResult.appraisalSummary.comments && (
                <Typography variant="body1" paragraph>
                  <strong>Comments:</strong> {valuationResult.appraisalSummary.comments}
                </Typography>
              )}

              {valuationResult.appraisalSummary.recommendedListPrice && (
                <Typography variant="body1" paragraph>
                  <strong>Recommended List Price:</strong>{" "}
                  {valuationResult.appraisalSummary.recommendedListPrice}
                </Typography>
              )}

              {valuationResult.appraisalSummary.riskFactors && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Risk Assessment:</strong>
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item>
                      <Chip
                        size="small"
                        label={`Market: ${valuationResult.appraisalSummary.riskFactors[0]}`}
                        sx={{
                          bgcolor:
                            valuationResult.appraisalSummary.riskFactors[0].toLowerCase() === "low"
                              ? "success.light"
                              : valuationResult.appraisalSummary.riskFactors[0].toLowerCase() ===
                                  "medium"
                                ? "warning.light"
                                : "error.light",
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <Chip
                        size="small"
                        label={`Comps: ${valuationResult.appraisalSummary.riskFactors[1]}`}
                        sx={{
                          bgcolor:
                            valuationResult.appraisalSummary.riskFactors[1].toLowerCase() === "low"
                              ? "success.light"
                              : valuationResult.appraisalSummary.riskFactors[1].toLowerCase() ===
                                  "medium"
                                ? "warning.light"
                                : "error.light",
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <Chip
                        size="small"
                        label={`Property: ${valuationResult.appraisalSummary.riskFactors[2]}`}
                        sx={{
                          bgcolor:
                            valuationResult.appraisalSummary.riskFactors[2].toLowerCase() === "low"
                              ? "success.light"
                              : valuationResult.appraisalSummary.riskFactors[2].toLowerCase() ===
                                  "medium"
                                ? "warning.light"
                                : "error.light",
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {/* Property Analysis Details (when available from AI) */}
      {valuationResult.propertyAnalysis && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Property Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Condition and Quality */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                  Condition & Quality
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography component="div" variant="body2">
                    <strong>Condition:</strong>{" "}
                    {valuationResult.propertyAnalysis.condition || "Not specified"}
                  </Typography>
                  <Typography component="div" variant="body2">
                    <strong>Quality Rating:</strong>{" "}
                    {valuationResult.propertyAnalysis.qualityRating || "Not specified"}
                  </Typography>
                </Box>
              </Grid>

              {/* Features */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                  Features
                </Typography>
                <Grid container spacing={1}>
                  {valuationResult.propertyAnalysis.features &&
                    valuationResult.propertyAnalysis.features.map((feature /* , index */) => (
                      <Grid item key={index}>
                        <Chip
                          size="small"
                          label={feature}
                          icon={<CheckCircleIcon />}
                          color="primary"
                          variant="outlined"
                        />
                      </Grid>
                    ))}
                </Grid>
              </Grid>

              {/* Recent Improvements */}
              {valuationResult.propertyAnalysis.improvements &&
                valuationResult.propertyAnalysis.improvements.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                      Recent Improvements
                    </Typography>
                    <List dense>
                      {valuationResult.propertyAnalysis.improvements.map((improvement /* , index */) => (
                        <ListItem key={index}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={improvement} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Timestamp */}
      {valuationResult.timestamp && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3, textAlign: "right" }}
        >
          Valuation completed: {new Date(valuationResult.timestamp).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
};

export default ValuationResults;
