# Phase 10: The Show (AI Superiority Demonstration) - SPEC

**Feature**: Autonomous Sovereign Protocol Execution ("The Show")
**Goal**: Demonstrate that the AI Brain (Cortex) autonomously controls the Muscle (Iron) via tools, with legal context (RAG) and full observability (Jaeger).

---

## 1. Identity & Rules

- **Role**: MIT PhD Systems Architect
- **Mission**: "Prove the Brain controls the Muscle."
- **Constraint**: Trace continuity is non-negotiable.

## 2. Pass Conditions

A single execution of `tests/demo/run_demo.sh` must demonstrate:

### A. Tool Handling (The Nerve)
- **Prompt**: "Who owns Parcel 1-1897-200-0020-000 and what is its current Assessed Value?"
- **Trace**: `Cortex (Agent) -> Tool (lookup_parcel) -> Iron API (GET /parcels/{id}) -> DB`
- **Output**: JSON data from Iron, synthesized into natural language.
- **Observability**: `parent_span_id` must propagate from Cortex to Iron.

### B. Reasoning & Context (The Brain)
- **Prompt**: "Analyze the improvement value ratio for this parcel. Is the land under-utilized?"
- **Trace**: Internal `reasoning_step` span.
- **Output**: Calculation `Improvement / Land` and a judgment call.
- **Attribute**: Span must have attribute `gen_ai.prompt`.

### C. Legal Retrieval (The Law) - *Optional/Mock for now if vector store unused*
- **Prompt**: "Based on the Zoning Code, what is the maximum building height for this parcel?"
- **Trace**: `Cortex -> VectorStore` (or `MockRetrieval`).
- **Citation**: "[Source: Benton County Zoning Code...]"

## 3. Implementation Plan

### Task 1: Context Propagation (Python -> .NET)
- **File**: `backend/terrafusion-bridge/app/tools.py`
- **Logic**: Use `opentelemetry.propagate.inject` to add headers to requests sent to Iron.
- **Target**: `lookup_parcel` function.

### Task 2: Trace Enrichment
- **File**: `backend/terrafusion-bridge/app/agent.py`
- **Logic**: Add semantic attributes (`gen_ai.prompt`, `gen_ai.tool_result_size`).
- **Target**: Main agent loop / prompt handler.

### Task 3: The Demo Script
- **File**: `tests/demo/run_demo.sh` (wraps python/curl calls).
- **File**: `tests/demo/the_show.py` (actual test logic).
- **Action**: Runs the 3 prompts.

---

## 4. Verification

1. **Jaeger**: `http://localhost:16686` -> Find trace with > 4 spans spanning multiple services.
2. **Output**: Console output must look like a sovereign government official (assessor grade).

