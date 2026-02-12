import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, Paper } from "@mui/material";
import { useAICopilot } from "../context/AICopilotContext";

export default function CopilotPanel({ context }) {
  const [suggestion, setSuggestion] = useState({ text: "", onWhy: () => {} });
  const [askInput, setAskInput] = useState("");
  const { aiLevel } = useAICopilot();
  const [rationale, setRationale] = useState("");

  // Fetch suggestion from MCP server when context or aiLevel changes
  useEffect(() => {
    async function fetchSuggestion() {
      const res = await fetch("/agent/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: { ...context, ai_level: aiLevel } }),
      });
      const data = await res.json();
      setSuggestion({
        text: data.suggestions?.[0] || "No suggestion",
        onWhy: () => setRationale(data.rationale || "No rationale provided."),
      });
      setRationale("");
    }
    fetchSuggestion();
  }, [context, aiLevel]);

  const handleAction = async (action) => {
    await fetch("/agent/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, context: { ...context, ai_level: aiLevel } }),
    });
    // Optionally refresh suggestion or show confirmation
  };

  const handleAsk = async (input) => {
    const res = await fetch("/agent/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, context: { ...context, ai_level: aiLevel } }),
    });
    const intentData = await res.json();
    // Optionally use intent to fetch suggestion or execute
  };

  const handleFeedback = async (feedback) => {
    await fetch("/agent/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, context: { ...context, ai_level: aiLevel } }),
    });
    // Optionally show thank you message
  };

  return (
    <Paper elevation={4} sx={{
      width: 350, position: "fixed", right: 0, top: 0, height: "100vh", p: 2, zIndex: 1300
    }}>
<>
      <Typography variant="h6" sx={{ mb: 1 }}>Terrafusion Copilot</Typography>
      <Typography
</> variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Context: {JSON.stringify(context)}
      </Typography>
      <Box sx={{ mb: 2 }}>
<>
        <Typography variant="subtitle1">Latest Suggestion:</Typography>
        <Typography
</> variant="body1" sx={{ mb: 1 }}>{suggestion.text}</Typography>
        <Button size="small" onClick={suggestion.onWhy}>Why?</Button>
        {rationale && <Typography variant="caption" color="info.main">{rationale}</Typography>}
        <Box sx={{ mt: 1 }}>
<>
          <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => handleAction("accept")}>Accept</Button>
          <Button
</> variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleAction("edit")}>Edit</Button>
          <Button variant="text" size="small" color="error" onClick={() => handleAction("reject")}>Reject</Button>
        </Box>
      </Box>
      <Box sx={{ mb: 2 }}>
<>
        <Typography variant="subtitle2">Ask Copilot</Typography>
        <TextField
</>
          fullWidth
          placeholder="Type a question or command..."
          value={askInput}
          onChange={e => setAskInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { handleAsk(askInput); setAskInput(""); } }}
          sx={{ mb: 1 }}
        />
        <Button onClick={() => { handleAsk(askInput); setAskInput(""); }} variant="outlined" size="small">Send</Button>
      </Box>
      <Box>
<>
        <Typography variant="caption">Was this helpful?</Typography>
        <Button
</> size="small" onClick={() => handleFeedback("up")}>👍</Button>
<>
        <Button size="small" onClick={() => handleFeedback("down")}>👎</Button>
        <Button
</> size="small" color="error" onClick={() => handleFeedback("report")}>Report</Button>
      </Box>
    </Paper>
  );
}
