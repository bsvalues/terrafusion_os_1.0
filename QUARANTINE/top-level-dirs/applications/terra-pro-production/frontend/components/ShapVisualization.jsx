import React from "react";
import { Box, Typography, Paper, Divider, Tooltip, Card, CardContent } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled components for feature bar visualization
const FeatureBar = styled(Box)(({ theme }) => ({
  height: 24,
  borderRadius: 2,
  position: "relative",
  marginBottom: 12,
  backgroundColor: theme.palette.grey[100],
  overflow: "hidden",
}));

const FeatureImpact = styled(Box)(({ positive, theme }) => ({
  position: "absolute",
  height: "100%",
  top: 0,
  left: positive ? "50%" : "auto",
  right: positive ? "auto" : "50%",
  width: (props) => `${Math.abs(props.width)}%`,
  backgroundColor: positive ? theme.palette.success.light : theme.palette.error.light,
}));

const BaseValueMarker = styled(Box)(({ theme }) => ({
  position: "absolute",
  height: "140%",
  width: 2,
  backgroundColor: theme.palette.grey[600],
  top: "-20%",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2,
}));

const FeatureLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.85rem",
  fontWeight: 500,
  marginBottom: 4,
  display: "flex",
  justifyContent: "space-between",
}));

const FeatureValue = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
  marginLeft: 8,
}));

const ImpactValue = styled(Typography)(({ positive, theme }) => ({
  fontSize: "0.8rem",
  fontWeight: 500,
  color: positive ? theme.palette.success.dark : theme.palette.error.dark,
}));

/**
 * Component to visualize SHAP values/feature importance
 *
 * @param {Object} props
 * @param {Object} props.shapData - Object containing SHAP values and base value
 */
const ShapVisualization = ({ shapData }) => {
  if (!shapData || !shapData.shapValues || shapData.shapValues.length === 0) {
    return null;
  }

  // Get max impact value for scaling
  const maxImpact = Math.max(...shapData.shapValues.map((item) => Math.abs(item.impact)));

  // Sort by impact magnitude (absolute value)
  const sortedFeatures = [...shapData.shapValues]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 7); // Show top 7 features

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Feature Importance Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          See how different property characteristics influenced the estimated value.
        </Typography>

        {/* Feature visualization */}
        <Box sx={{ position: "relative", mt: 4, mb: 2 }}>
          <Divider sx={{ position: "absolute", top: -16, left: 0, right: 0 }} />
          {sortedFeatures.map((feature /* , index */) => {
            const impact = feature.impact;
            const isPositive = impact >= 0;
            const scaledWidth = (Math.abs(impact) / maxImpact) * 50; // Scale to max 50% of width

            return (
              <Box key={index} sx={{ mb: 3 }}>
                <FeatureLabel>
                  <Box sx={{ display: "flex" }}>
                    {feature.name}
                    {feature.value && <FeatureValue>{feature.value}</FeatureValue>}
                  </Box>
                  <Tooltip
                    title={
                      feature.explanation ||
                      `Impact: ${isPositive ? "+" : ""}${impact.toLocaleString("en-US", { style: "currency", currency: "USD" })}`
                    }
                  >
                    <ImpactValue positive={isPositive}>
                      {isPositive ? "+" : ""}
                      {impact.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </ImpactValue>
                  </Tooltip>
                </FeatureLabel>

                <FeatureBar>
                  <BaseValueMarker />
                  <FeatureImpact positive={isPositive} width={scaledWidth} />
                </FeatureBar>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ textAlign: "center", mt: 4, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Baseline value:{" "}
            {shapData.baseValue?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ||
              "Not available"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ShapVisualization;
