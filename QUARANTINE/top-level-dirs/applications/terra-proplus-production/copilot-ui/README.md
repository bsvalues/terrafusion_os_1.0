# Terrafusion Copilot UI

## Overview
This React-based Copilot UI empowers appraisers with agentic AI assistance, full user control, and transparent, explainable suggestions. It integrates directly with the MCP server and supports onboarding, preference management, and continuous feedback.

## Features
- **Onboarding:** First-run modal lets users set their AI Copilot assistance level (Minimal, Smart, Full Copilot).
- **Copilot Panel:** Always-on panel shows context, agent suggestions, rationale ("Why?"), and Accept/Edit/Reject controls.
- **Ask Copilot:** Freeform input for natural language queries.
- **Feedback:** Quick feedback buttons (👍 👎 Report) for every suggestion.
- **Preference Management:** User AI level is globally managed and can be extended for persistence.

## File Structure
- `src/components/CopilotPanel.tsx` — Main Copilot UI panel
- `src/components/AICopilotOnboarding.tsx` — Onboarding dialog for AI level
- `src/context/AICopilotContext.tsx` — Global context for user AI preference
- `src/App.tsx` — App root, integrates onboarding and Copilot panel

## Running Locally
1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Start the dev server:
   ```bash
   npm start
   # or
   yarn start
   ```
3. Ensure the MCP server is running at the expected endpoints (see below).

## Backend Endpoints (MCP Server)
- `POST /agent/intent` — Parse user intent
- `POST /agent/suggest` — Get agentic suggestions
- `POST /agent/execute` — Execute agentic action
- `POST /agent/feedback` — Submit user feedback

## Extending & Customizing
- To persist user preferences, connect `AICopilotContext` to localStorage or a backend endpoint.
- To add new plugins or agentic actions, update the MCP server and UI as needed.
- For advanced analytics or feedback, connect to the feedback dashboard microservice.

## Mission & Principles
- **User Empowerment:** The user is always in control—AI is a tool, not a replacement.
- **Transparency:** Every suggestion/action is explainable and overrideable.
- **Continuous Improvement:** Feedback drives model and workflow improvements.

---
For questions or to contribute, see `docs/ARCHITECTURE.md` or contact the Terrafusion engineering team.
