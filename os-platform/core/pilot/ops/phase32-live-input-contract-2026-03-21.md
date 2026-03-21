# Phase 32 Live Input Contract

Date: 2026-03-21
Status: STAGED
Owner: Copilot / solo-dev execution lane
Scope: Exact external inputs required before the Phase 32 live execution window can truthfully run

## Purpose

This artifact defines the single external handoff for Phase 32.

Repo-owned prep is already staged.

The live window should not open until the inputs below are supplied or verified on the real executable surface.

## Decision Rule

If any required input below is missing, Phase 32 is not ready for live execution.

That does not reopen repo prep.

It means the live window remains environment-gated.

## Required Inputs

### 1. Base execution surface

- `TF_PHASE32_BASE_URL` or `TF_PILOT_BASE_URL`
- expected meaning: base URL for the executable pilot/canon surface that serves:
  - `POST /pilot/canon/ping`
  - `POST /pilot/canon/doctor`
  - `POST /pilot/canon/gatefast`
- acceptable evidence:
  - deployment record
  - operator-verified base URL
  - successful smoke response on the real surface

### 2. Auth path

- one truthful authorized path for the live window
- accepted forms:
  - bearer token path
  - session/cookie path
  - explicitly authorized unauthenticated route if that is the real deployment contract
- required evidence:
  - operator statement of the expected auth mode
  - one live request showing the chosen path is accepted by the target surface

### 3. Collaboration hub URL

- `TF_PHASE32_COLLAB_URL`
- expected meaning: full live hub URL for the collaboration surface
- current repo truth:
  - frontend assumes `/hubs/collaboration`
  - governed backend scope does not verify that mapping
- required evidence:
  - deployment/runtime proof of the actual hub route

### 4. Collaboration method truth

- `TF_PHASE32_COLLAB_JOIN_METHOD`
- `TF_PHASE32_COLLAB_LEAVE_METHOD`
- optional: `TF_PHASE32_COLLAB_SEND_METHOD`
- current repo truth:
  - frontend assumes `JoinSession` and `LeaveSession`
  - governed backend scope does not verify those methods on the executable surface
- required evidence:
  - runtime proof or backend authority confirming actual method names

### 5. Collaboration payload truth

- `TF_PHASE32_COLLAB_USER_JSON`
- optional: `TF_PHASE32_COLLAB_SEND_PAYLOAD_JSON`
- expected meaning:
  - exact join payload accepted by the live hub
  - exact optional edit/broadcast payload accepted by the live hub
- required evidence:
  - backend/runtime proof or successful invocation on the real hub

### 6. Release binding

- Benton release identifier or equivalent release metadata
- expected meaning:
  - the live smoke output can be tied to the same executable surface authorized for Benton
- acceptable evidence:
  - deployment tag
  - commit/release mapping
  - operator release record

## Command Binding

### REST smoke

Command:

```text
node os-platform/core/pilot/phase32-codex-live-smoke.mjs
```

Consumes:

- `TF_PHASE32_BASE_URL` or `TF_PILOT_BASE_URL` or `TF_API_URL`
- optional: `TF_PHASE32_CANON_ECHO`

### Collaboration smoke

Command:

```text
node os-platform/core/pilot/phase32-codex-collab-smoke.mjs
```

Consumes:

- `TF_PHASE32_COLLAB_URL`
- `TF_PHASE32_COLLAB_JOIN_METHOD`
- `TF_PHASE32_COLLAB_LEAVE_METHOD`
- optional: `TF_PHASE32_COLLAB_SEND_METHOD`
- optional: `TF_PHASE32_COLLAB_SESSION_ID`
- optional: `TF_PHASE32_COLLAB_USER_JSON`
- optional: `TF_PHASE32_COLLAB_SEND_PAYLOAD_JSON`

## Ready Check

Phase 32 live execution is ready only when all of the following are true:

1. base execution surface is verified
2. auth path is verified
3. collaboration hub URL is verified
4. collaboration method truth is verified
5. release binding is verified for Benton

## Output Classification Rule

If the inputs above are absent:

- report `environment-gated`
- populate the blocked-attempt receipt
- do not relabel the issue as architecture or planning uncertainty

If the inputs above are present and the live smoke still fails:

- classify the result as contract mismatch, auth path failure, or runtime failure based on command output
- update CP25 with the real failure class