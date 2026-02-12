import React from "react";
import { Box, Typography, Slider, Button, Dialog } from "@mui/material";

const marks = [
  { value: 0, label: "Minimal" },
  { value: 1, label: "Smart" },
  { value: 2, label: "Full Copilot" },
];

const descriptions = [
  "AI only helps when you ask.",
  "AI flags issues, offers suggestions, and fills obvious fields.",
  "AI fills, suggests, and explains everything by default.",
];

export default function AICopilotOnboarding({ open, value, onChange, onSave }) {
  return (
    <Dialog open={open}>
      <Box sx={{ p: 4, minWidth: 350 }}>
<>
        <Typography variant="h6" gutterBottom>
          Welcome to Terrafusion AI Copilot!
        </Typography>
        <Typography
</> variant="body1" sx={{ mb: 2 }}>
          Choose how much help you want from your AI Copilot:
        </Typography>
        <Slider
          value={value}
          onChange={(_, v) => onChange(v)}
          min={0}
          max={2}
          step={1}
          marks={marks}
          sx={{ mb: 2 }}
        />
<>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {descriptions[value]}
        </Typography>
        <Button
</> variant="contained" onClick={onSave} fullWidth>
          Save Preference
        </Button>
      </Box>
    </Dialog>
  );
}
