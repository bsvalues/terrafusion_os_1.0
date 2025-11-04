# Phase 3 Implementation Plan - Terminal & Task Runner

**Status**: Ready to Execute
**Estimated Duration**: 2-3 days
**Complexity**: Medium (WebSocket integration + task execution)
**Dependencies**: Phase 2 complete ✅

---

## Overview

Phase 3 adds real-time command execution and build system integration:

1. **terminal_service.rs** - Execute system commands and stream output
2. **task_runner_service.rs** - Define and run module-specific build tasks
3. **WebSocket Integration** - Stream command output to frontend

This unblocks the Terminal and TaskRunner frontend components.

---

## 1. terminal_service.rs Implementation

### Purpose
Execute shell commands (cargo, npm, python scripts, etc.) and stream output in real-time via WebSocket.

### Structure
```rust
pub struct TerminalService;

impl TerminalService {
    pub async fn execute_command(
        cmd: &str,
        args: Vec<&str>,
        cwd: &str
    ) -> Result<CommandExecution, String>

    pub async fn stream_command_output(
        cmd: &str,
        args: Vec<&str>,
        cwd: &str,
        sender: tokio::sync::mpsc::Sender<String>
    ) -> Result<i32, String>  // Exit code

    pub fn supported_commands() -> Vec<&'static str>

    pub async fn validate_command(cmd: &str) -> bool
}
```

### Execution Model

For each command:
1. Validate command is whitelisted (cargo, npm, python, dotnet, etc.)
2. Spawn child process in specified working directory
3. Capture stdout + stderr
4. Stream output line-by-line through mpsc channel
5. Return exit code on completion

### Structs

```rust
pub struct CommandExecution {
    pub command: String,
    pub args: Vec<String>,
    pub exit_code: i32,
    pub stdout_lines: Vec<String>,
    pub stderr_lines: Vec<String>,
    pub duration_ms: u128,
}

pub struct CommandRequest {
    pub command: String,
    pub args: Option<Vec<String>>,
    pub cwd: String,
}
```

### Implementation Details

**Whitelisted Commands**:
- cargo (Rust builds)
- npm (JavaScript/TypeScript)
- yarn (JavaScript alternate)
- python, python3 (Python scripts)
- dotnet (C# .NET)
- bash, sh (Shell scripts)

**Safety Measures**:
- Command whitelist validation
- No shell injection (args as separate Vec)
- Timeout on long-running commands (30s default)
- Memory limits on output capture (100MB max)

### Route Integration
```
WebSocket: GET /ws/terminal
Body: { "command": "cargo", "args": ["build"], "cwd": "modules/terra-levy" }
Response: Stream of { "type": "stdout|stderr|exit", "data": "..." }
```

---

## 2. task_runner_service.rs Implementation

### Purpose
Define module-type-specific tasks and execute them with status tracking.

### Structure
```rust
pub struct TaskRunnerService;

impl TaskRunnerService {
    pub fn get_available_tasks(module_type: &str) -> Vec<Task>
    pub async fn execute_task(task_id: &str, cwd: &str) -> Result<TaskResult, String>
    pub async fn cancel_task(task_id: &str) -> Result<(), String>
    pub fn get_task_status(task_id: &str) -> TaskStatus
}
```

### Task Definitions

**For Rust Modules**:
```json
{
  "build": { "cmd": "cargo", "args": ["build", "--release"] },
  "test": { "cmd": "cargo", "args": ["test"] },
  "lint": { "cmd": "cargo", "args": ["clippy"] },
  "format": { "cmd": "cargo", "args": ["fmt"] },
  "clean": { "cmd": "cargo", "args": ["clean"] }
}
```

**For TypeScript/JavaScript Modules**:
```json
{
  "build": { "cmd": "npm", "args": ["run", "build"] },
  "test": { "cmd": "npm", "args": ["test"] },
  "lint": { "cmd": "npm", "args": ["run", "lint"] },
  "format": { "cmd": "npm", "args": ["run", "format"] },
  "dev": { "cmd": "npm", "args": ["run", "dev"] }
}
```

**For Python Modules**:
```json
{
  "test": { "cmd": "python", "args": ["-m", "pytest"] },
  "lint": { "cmd": "python", "args": ["-m", "pylint", "."] },
  "format": { "cmd": "python", "args": ["-m", "black", "."] }
}
```

### Structs

```rust
pub struct Task {
    pub id: String,
    pub name: String,
    pub description: String,
    pub command: String,
    pub args: Vec<String>,
}

pub struct TaskExecution {
    pub task_id: String,
    pub module_id: String,
    pub started_at: String,
    pub status: ExecutionStatus,
    pub exit_code: Option<i32>,
}

pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

pub struct TaskResult {
    pub task_id: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u128,
    pub status: ExecutionStatus,
}
```

### Implementation Details

**Task Selection Logic**:
1. Read module type from module.manifest.json
2. Look up task templates by module type
3. Return available tasks for that type
4. Frontend selects which task to run

**Execution Flow**:
1. Validate task is defined for module type
2. Resolve module working directory
3. Execute task via terminal_service
4. Stream output to WebSocket
5. Track status (Pending → Running → Completed/Failed)
6. Allow cancellation via signal

### Route Integration
```
GET /api/tasks/available?module_id=terra-levy
Response: [
  {"id": "build", "name": "Build", "command": "cargo build --release"},
  {"id": "test", "name": "Test", "command": "cargo test"}
]

POST /api/tasks/run
Body: {"task_id": "build", "module_id": "terra-levy"}
Response: {"status": "started", "execution_id": "exec-123"}

WebSocket: GET /ws/tasks/exec-123
Response: Stream of execution status updates
```

---

## 3. WebSocket Integration

### Terminal WebSocket Handler
```rust
async fn terminal_websocket_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(|socket| handle_terminal_websocket(socket))
}

async fn handle_terminal_websocket(mut socket: WebSocket) {
    // 1. Receive CommandRequest
    // 2. Execute command via terminal_service
    // 3. Stream stdout/stderr line-by-line
    // 4. Send exit code on completion
    // 5. Handle client disconnect
}
```

### Message Format
```json
// Incoming (from frontend)
{"command": "cargo", "args": ["build"], "cwd": "modules/terra-levy"}

// Outgoing (to frontend)
{"type": "stdout", "data": "Compiling terrafusion v0.1.0"}
{"type": "stderr", "data": "warning: unused variable"}
{"type": "exit", "code": 0}
```

---

## 4. Integration into main.rs

### Add Module Declarations
```rust
mod terminal_service;
mod task_runner_service;
```

### Add Handler Functions
```rust
async fn terminal_websocket_handler(ws: WebSocketUpgrade) -> Response
async fn get_available_tasks_handler(workspace_id, module_id) -> Json<Vec<Task>>
async fn run_task_handler(workspace_id, task_id, module_id) -> Json<TaskExecution>
async fn get_task_status_handler(execution_id) -> Json<TaskResult>
async fn cancel_task_handler(execution_id) -> Json<CancelResult>
```

### Add Routes
```rust
.route("/ws/terminal", get(terminal_websocket_handler))
.route("/api/tasks/available", get(get_available_tasks_handler))
.route("/api/tasks/run", post(run_task_handler))
.route("/api/tasks/:id/status", get(get_task_status_handler))
.route("/api/tasks/:id/cancel", post(cancel_task_handler))
```

---

## 5. Frontend Integration Points

### Terminal Component
```javascript
// Connect to /ws/terminal
const ws = new WebSocket('ws://localhost:8787/ws/terminal');

// Send command
ws.send(JSON.stringify({
  command: 'cargo',
  args: ['build'],
  cwd: 'modules/terra-levy'
}));

// Receive output
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'stdout') console.log(msg.data);
  if (msg.type === 'exit') console.log(`Exit code: ${msg.code}`);
};
```

### TaskRunner Component
```javascript
// Get available tasks
const tasks = await fetch(
  '/api/tasks/available?module_id=terra-levy'
).then(r => r.json());

// Run selected task
const execution = await fetch('/api/tasks/run', {
  method: 'POST',
  body: JSON.stringify({
    task_id: 'build',
    module_id: 'terra-levy'
  })
}).then(r => r.json());

// Stream task output
const ws = new WebSocket(`ws://localhost:8787/ws/tasks/${execution.execution_id}`);
```

---

## 6. Error Handling

### Command Validation
- ✅ Whitelisted commands only
- ✅ No shell metacharacters in args
- ✅ Working directory must exist
- ✅ Module must be discovered

### Execution Safety
- ✅ Process timeout (30s default)
- ✅ Memory limit on output capture
- ✅ Handle process termination gracefully
- ✅ Clean up resources on disconnect

### Status Tracking
- ✅ All states properly transitioned
- ✅ Exit codes captured correctly
- ✅ Errors formatted for frontend display
- ✅ Audit log for all task executions

---

## 7. Testing Strategy

### Unit Tests
- Test command validation logic
- Test task selection by module type
- Test process spawning and output capture
- Test WebSocket message formatting

### Integration Tests
- End-to-end task execution
- WebSocket streaming
- Multiple concurrent tasks
- Client disconnect handling

### Manual Testing
1. Connect Terminal component to /ws/terminal
2. Run `cargo build` in terra-levy module
3. Verify output streams in real-time
4. Verify TaskRunner loads available tasks
5. Run build/test/lint tasks
6. Verify status updates in real-time

---

## 8. Success Criteria

- ✅ Terminal WebSocket works (/ws/terminal)
- ✅ Commands execute correctly (cargo, npm, etc.)
- ✅ Output streams in real-time
- ✅ Exit codes captured
- ✅ Tasks defined for module types
- ✅ Task runner API works
- ✅ Status tracking functional
- ✅ Both frontend components can connect

---

## 9. Estimated Effort

| Component | Lines | Complexity | Time |
|-----------|-------|-----------|------|
| terminal_service.rs | 250 | Medium | 2 hours |
| task_runner_service.rs | 200 | Low | 1.5 hours |
| WebSocket integration | 150 | Medium | 1.5 hours |
| main.rs handlers | 100 | Low | 1 hour |
| Integration & testing | - | Medium | 2 hours |
| **Total** | **700** | **Medium** | **~8 hours** |

**Total Phase 3 Time**: 1-2 days (8-16 hours)

---

## 10. Completion Checklist

- [ ] terminal_service.rs created
- [ ] task_runner_service.rs created
- [ ] WebSocket handler implemented
- [ ] main.rs updated with mod declarations
- [ ] Handler functions created (5 handlers)
- [ ] Routes registered (5 routes)
- [ ] Logging added
- [ ] Code compiles successfully
- [ ] Terminal component connects
- [ ] TaskRunner component works
- [ ] All tests pass

---

## Next: Phase 4

After Phase 3 complete, Phase 4 will add:
- AI service (relay queries with module context)
- Registry client (Atlas integration)
- Integration testing (end-to-end workflows)

All 5 IDE components (FileExplorer, CodeEditor, Terminal, TaskRunner, AICopilot) will be fully functional.

---

**Ready to Execute**: ✅
**Estimated Completion**: 2-3 days
**Total Project Timeline**: 5-7 days
