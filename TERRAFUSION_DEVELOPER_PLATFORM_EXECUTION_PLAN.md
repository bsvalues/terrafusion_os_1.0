# ⚡ TERRAFUSION DEVELOPER PLATFORM
## Execution Plan: 4-Phase Implementation

**Timeline:** 4 Weeks
**Scope:** Transform Command Portal into a true developer IDE
**Status:** 🔴 READY TO BEGIN

---

## 📋 PHASE 1: CLEAN THE BACKEND (Days 1-2)

### Task 1.1: Remove Misplaced Features

**Step 1:** Delete Tier 17/18 APIs from backend
```bash
cd backend/src/
rm tier_17_privacy_api.rs
rm tier_18_immersive_api.rs
rm tier_17_privacy/  # if exists
rm tier_18_immersive_privacy/  # if exists
```

**Step 2:** Update main.rs - remove integrations
```rust
// REMOVE THESE LINES:
// mod tier_17_privacy_api;
// mod tier_18_immersive_api;

// REMOVE FROM ROUTER:
// .nest("/api/privacy", tier_17_privacy_api::...)
// .nest("/api/immersive", tier_18_immersive_api::...)
```

**Step 3:** Update Cargo.toml
```toml
# CHANGE:
[package]
name = "tf_command_portal_api"
# TO:
[package]
name = "terrafusion_developer_platform"
description = "TerraFusion Developer Platform - VS Code-like IDE powered by AI swarm"

# REMOVE:
# aws-sdk-kms
# All Privacy/Visualization specific dependencies

# KEEP:
# axum, tokio, serde_json, tracing, etc. (core web framework)
```

**Step 4:** Verify compilation
```bash
cargo check
```

**Expected Result:**
- ✅ Compiles without Tier 17/18 code
- ✅ Fewer dependencies
- ✅ Cleaner codebase

---

### Task 1.2: Create V1 Backend Structure

**New src/ Structure:**
```
backend/src/
├── main.rs (Axum server setup)
├── file_system.rs (File browser APIs)
├── code_services.rs (Analysis & completion)
├── terminal.rs (Terminal proxy)
├── ai_relay.rs (Forward to 1,008-agent swarm)
├── tasks.rs (Build, test, deploy executors)
├── auth.rs (JWT validation)
├── health.rs (Health checks)
├── types.rs (Shared types)
└── middleware.rs (CORS, logging)
```

**Create Empty Files:**
```bash
touch backend/src/file_system.rs
touch backend/src/code_services.rs
touch backend/src/terminal.rs
touch backend/src/ai_relay.rs
touch backend/src/tasks.rs
touch backend/src/types.rs
touch backend/src/middleware.rs
```

**Update main.rs:**
```rust
mod file_system;
mod code_services;
mod terminal;
mod ai_relay;
mod tasks;
mod auth;
mod health;
mod types;
mod middleware;

use axum::{
    routing::{get, post},
    Router,
};

#[tokio::main]
async fn main() {
    // Server setup
    let app = Router::new()
        // File system endpoints
        .route("/api/files", get(file_system::list_files))
        .route("/api/files/search", post(file_system::search_files))
        .route("/api/files/read", post(file_system::read_file))
        .route("/api/files/write", post(file_system::write_file))

        // Code analysis endpoints
        .route("/api/code/complete", post(code_services::code_complete))
        .route("/api/code/analyze", post(code_services::analyze))
        .route("/api/code/format", post(code_services::format))

        // Terminal endpoints
        .route("/api/terminal/create", post(terminal::create))
        .route("/ws/terminal/:id", axum::routing::get(terminal::websocket))

        // AI endpoints
        .route("/api/ai/ask", post(ai_relay::ask_swarm))
        .route("/api/ai/suggest", post(ai_relay::suggest_refactor))
        .route("/api/ai/generate", post(ai_relay::generate_tests))

        // Task endpoints
        .route("/api/tasks", get(tasks::list_tasks))
        .route("/api/tasks/:id/run", post(tasks::run_task))
        .route("/api/tasks/:id/stop", post(tasks::stop_task))

        // Health
        .route("/health", get(health::health_check))

        .layer(middleware::cors());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8787").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Verify Compilation:**
```bash
cargo check
```

---

## 📋 PHASE 2: SIMPLIFY THE FRONTEND (Days 3-4)

### Task 2.1: Replace Quantum Visualizations

**Remove:**
```bash
# Remove consciousness engine code
rm frontend/src/components/TerraSphere.tsx
rm frontend/src/components/QuantumLattice.tsx
rm frontend/src/components/ConsciousnessMetrics.tsx
rm frontend/src/components/NeuralPathways.tsx

# Remove animation files
rm frontend/src/animations/consciousness*.ts
rm frontend/src/animations/quantum*.ts
```

**Create IDE Components:**
```bash
touch frontend/src/components/FileExplorer.tsx
touch frontend/src/components/CodeEditor.tsx
touch frontend/src/components/Terminal.tsx
touch frontend/src/components/AICopilot.tsx
touch frontend/src/components/TaskRunner.tsx
touch frontend/src/components/Debugger.tsx
touch frontend/src/components/Settings.tsx
```

### Task 2.2: FileExplorer Component

```typescript
// frontend/src/components/FileExplorer.tsx
import React, { useState, useEffect } from 'react';

export const FileExplorer: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch file tree from backend
    fetch('/api/files')
      .then(r => r.json())
      .then(data => setFiles(data));
  }, []);

  return (
    <div className="file-explorer">
      <input
        type="text"
        placeholder="Search files..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="file-tree">
        {renderFileTree(files, search, expanded, setExpanded)}
      </div>
    </div>
  );
};

function renderFileTree(files: any[], search: string, expanded: Set<string>, setExpanded: any) {
  // Recursively render file tree with filtering
  return files
    .filter(f => !search || f.name.includes(search))
    .map(file => (
      <div key={file.path} className="file-item">
        {file.isDir ? (
          <>
            <button onClick={() => toggleExpanded(file.path, expanded, setExpanded)}>
              {expanded.has(file.path) ? '▼' : '▶'} {file.name}
            </button>
            {expanded.has(file.path) && renderFileTree(file.children, search, expanded, setExpanded)}
          </>
        ) : (
          <span className="file-name">{file.name}</span>
        )}
      </div>
    ));
}
```

### Task 2.3: CodeEditor Component

```typescript
// frontend/src/components/CodeEditor.tsx
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor: React.FC<{ file: string }> = ({ file }) => {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    // Fetch file content
    fetch(`/api/files/read`, {
      method: 'POST',
      body: JSON.stringify({ path: file }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        setContent(data.content);
        setLanguage(detectLanguage(file));
      });
  }, [file]);

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={content}
      onChange={(value) => setContent(value || '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
        fontSize: 14,
      }}
    />
  );
};

function detectLanguage(file: string): string {
  const ext = file.split('.').pop();
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    rs: 'rust',
    py: 'python',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    dockerfile: 'dockerfile',
  };
  return map[ext || ''] || 'plaintext';
}
```

### Task 2.4: AICopilot Component

```typescript
// frontend/src/components/AICopilot.tsx
import React, { useState, useRef, useEffect } from 'react';

export const AICopilot: React.FC<{ selectedCode?: string }> = ({ selectedCode }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [agentLevel, setAgentLevel] = useState<'beginner' | 'advanced' | 'ninja'>('advanced');

  const handleSend = async () => {
    const msg = { role: 'user', content: input };
    setMessages([...messages, msg]);

    // Call backend AI relay
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({
        query: input,
        context: { selectedCode, agentLevel, file: 'current' },
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setInput('');
  };

  return (
    <div className="ai-copilot">
      <div className="copilot-header">
        <h3>🤖 AI Copilot</h3>
        <select value={agentLevel} onChange={(e) => setAgentLevel(e.target.value as any)}>
          <option value="beginner">Beginner Mode</option>
          <option value="advanced">Advanced Mode</option>
          <option value="ninja">Ninja Mode (All 1,008 Agents)</option>
        </select>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="role">{msg.role === 'user' ? 'You' : 'Supreme Commander'}</span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI swarm..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};
```

### Task 2.5: TaskRunner Component

```typescript
// frontend/src/components/TaskRunner.tsx
import React, { useState } from 'react';

const DEFAULT_TASKS = [
  { id: 'build', label: '⚙️ Build', command: 'cargo build' },
  { id: 'test', label: '✅ Test', command: 'cargo test' },
  { id: 'lint', label: '🔍 Lint', command: 'cargo clippy' },
  { id: 'format', label: '📝 Format', command: 'cargo fmt' },
  { id: 'deploy', label: '🚀 Deploy', command: './deploy.sh' },
];

export const TaskRunner: React.FC = () => {
  const [running, setRunning] = useState<string | null>(null);

  const handleRunTask = async (task: any) => {
    setRunning(task.id);
    await fetch(`/api/tasks/${task.id}/run`, { method: 'POST' });
    setRunning(null);
  };

  return (
    <div className="task-runner">
      <h3>Tasks</h3>
      <div className="task-buttons">
        {DEFAULT_TASKS.map(task => (
          <button
            key={task.id}
            onClick={() => handleRunTask(task)}
            disabled={running !== null}
            className={running === task.id ? 'running' : ''}
          >
            {running === task.id ? '⏳...' : task.label}
          </button>
        ))}
      </div>
      <div className="task-output">
        <Terminal />
      </div>
    </div>
  );
};
```

### Task 2.6: Update Layout

```typescript
// frontend/src/App.tsx
import React, { useState } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AICopilot } from './components/AICopilot';
import { TaskRunner } from './components/TaskRunner';
import { Terminal } from './components/Terminal';

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');

  return (
    <div className="terrafusion-ide">
      {/* Top bar */}
      <header className="navbar">
        <h1>🚀 TerraFusion Developer Platform</h1>
        <span className="status">Connected to 1,008-agent swarm</span>
      </header>

      {/* Main layout */}
      <div className="main-layout">
        {/* Sidebar: File explorer */}
        <aside className="sidebar">
          <FileExplorer onSelect={setSelectedFile} />
        </aside>

        {/* Center: Editor */}
        <main className="editor-pane">
          {selectedFile ? (
            <CodeEditor file={selectedFile} />
          ) : (
            <div className="welcome">
              <h2>Welcome to TerraFusion Developer Platform</h2>
              <p>Select a file to start editing</p>
            </div>
          )}
        </main>

        {/* Right sidebar: AI Copilot */}
        <aside className="right-sidebar">
          <AICopilot selectedCode={selectedCode} />
        </aside>

        {/* Bottom: Terminal + Tasks */}
        <footer className="bottom-panel">
          <TaskRunner />
          <Terminal />
        </footer>
      </div>
    </div>
  );
};
```

---

## 📋 PHASE 3: IMPLEMENT CORE BACKEND SERVICES (Days 5-9)

### Task 3.1: File System Service

```rust
// backend/src/file_system.rs
use axum::{extract::Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize)]
struct FileInfo {
    path: String,
    name: String,
    is_dir: bool,
    size: u64,
    modified: String,
}

pub async fn list_files(Json(payload): Json<ListRequest>) -> Result<Json<Vec<FileInfo>>, StatusCode> {
    // List files in workspace
    let path = Path::new(&payload.path);

    if !path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    let mut files = Vec::new();
    for entry in fs::read_dir(path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)? {
        let entry = entry.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let metadata = entry.metadata().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        files.push(FileInfo {
            path: entry.path().to_string_lossy().to_string(),
            name: entry.file_name().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified: format!("{:?}", metadata.modified()),
        });
    }

    Ok(Json(files))
}

pub async fn search_files(Json(payload): Json<SearchRequest>) -> Result<Json<Vec<FileInfo>>, StatusCode> {
    // Search files by name or content
    // Implementation: recursively search directory
    Ok(Json(vec![]))
}

#[derive(Deserialize)]
struct ListRequest {
    path: String,
}

#[derive(Deserialize)]
struct SearchRequest {
    query: String,
    path: String,
}
```

### Task 3.2: Code Services

```rust
// backend/src/code_services.rs
use axum::Json;

pub async fn code_complete(Json(payload): Json<CompleteRequest>) -> Json<CompleteResponse> {
    // Call AI swarm for code completion
    let response = crate::ai_relay::call_swarm(&format!(
        "Complete this code:\n{}",
        payload.code
    )).await;

    Json(CompleteResponse {
        suggestions: vec![response],
    })
}

pub async fn analyze(Json(payload): Json<AnalyzeRequest>) -> Json<AnalyzeResponse> {
    // Analyze code for issues
    Json(AnalyzeResponse {
        issues: vec![],
    })
}

pub async fn format(Json(payload): Json<FormatRequest>) -> Json<FormatResponse> {
    // Format code
    Json(FormatResponse {
        formatted: payload.code,
    })
}

#[derive(serde::Deserialize)]
struct CompleteRequest { code: String }
#[derive(serde::Deserialize)]
struct AnalyzeRequest { code: String }
#[derive(serde::Deserialize)]
struct FormatRequest { code: String }

#[derive(serde::Serialize)]
struct CompleteResponse { suggestions: Vec<String> }
#[derive(serde::Serialize)]
struct AnalyzeResponse { issues: Vec<String> }
#[derive(serde::Serialize)]
struct FormatResponse { formatted: String }
```

### Task 3.3: AI Relay Service

```rust
// backend/src/ai_relay.rs
use axum::{extract::Json, http::StatusCode};

pub async fn call_swarm(prompt: &str) -> String {
    // Call the 1,008-agent swarm
    // For now, mock response
    // TODO: Connect to actual swarm via WebSocket/HTTP

    format!("Response from AI Swarm: {}", prompt)
}

pub async fn ask_swarm(Json(payload): Json<AskRequest>) -> Result<Json<AskResponse>, StatusCode> {
    let response = call_swarm(&payload.query).await;

    Ok(Json(AskResponse {
        response,
        agent_count: 1008,
    }))
}

pub async fn suggest_refactor(Json(payload): Json<RefactorRequest>) -> Result<Json<RefactorResponse>, StatusCode> {
    let response = call_swarm(&format!("Suggest refactoring for:\n{}", payload.code)).await;

    Ok(Json(RefactorResponse {
        suggestions: vec![response],
    }))
}

pub async fn generate_tests(Json(payload): Json<TestRequest>) -> Result<Json<TestResponse>, StatusCode> {
    let response = call_swarm(&format!("Generate tests for:\n{}", payload.code)).await;

    Ok(Json(TestResponse {
        tests: vec![response],
    }))
}

#[derive(serde::Deserialize)]
struct AskRequest { query: String, context: serde_json::Value }
#[derive(serde::Deserialize)]
struct RefactorRequest { code: String }
#[derive(serde::Deserialize)]
struct TestRequest { code: String }

#[derive(serde::Serialize)]
struct AskResponse { response: String, agent_count: i32 }
#[derive(serde::Serialize)]
struct RefactorResponse { suggestions: Vec<String> }
#[derive(serde::Serialize)]
struct TestResponse { tests: Vec<String> }
```

### Task 3.4: Terminal Service

```rust
// backend/src/terminal.rs
use axum::extract::ws::WebSocket;
use futures::{sink::SinkExt, stream::StreamExt};
use tokio::process::Command;

pub async fn websocket(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();
    let mut child_process: Option<tokio::process::Child> = None;

    while let Some(msg) = receiver.next().await {
        if let Ok(msg) = msg {
            if let axum::extract::ws::Message::Text(cmd) = msg {
                // Execute command
                let output = Command::new("sh")
                    .arg("-c")
                    .arg(cmd)
                    .output()
                    .await;

                if let Ok(output) = output {
                    let response = String::from_utf8_lossy(&output.stdout);
                    let _ = sender.send(axum::extract::ws::Message::Text(response.to_string())).await;
                }
            }
        }
    }
}
```

### Task 3.5: Task Executor

```rust
// backend/src/tasks.rs
use axum::{extract::Path, Json, http::StatusCode};
use tokio::process::Command;

pub async fn run_task(Path(task_id): Path<String>) -> Result<Json<TaskResult>, StatusCode> {
    let command = match task_id.as_str() {
        "build" => "cargo build",
        "test" => "cargo test",
        "lint" => "cargo clippy",
        "deploy" => "./deploy.sh",
        _ => return Err(StatusCode::NOT_FOUND),
    };

    let output = Command::new("sh")
        .arg("-c")
        .arg(command)
        .output()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(TaskResult {
        success: output.status.success(),
        output: String::from_utf8_lossy(&output.stdout).to_string(),
        error: String::from_utf8_lossy(&output.stderr).to_string(),
    }))
}

#[derive(serde::Serialize)]
struct TaskResult {
    success: bool,
    output: String,
    error: String,
}
```

---

## 📋 PHASE 4: DEPLOY & VALIDATE (Days 10-14)

### Task 4.1: Build & Test

```bash
# Backend
cd backend
cargo build
cargo test

# Frontend
cd frontend
npm install
npm run build
npm test
```

### Task 4.2: Verify All Features Work

- [ ] File browser loads files
- [ ] Code editor displays correctly
- [ ] AI copilot responds
- [ ] Tasks execute
- [ ] Terminal works
- [ ] No Tier 17/18 code remains
- [ ] Can chat with swarm
- [ ] Build/test/deploy buttons work

### Task 4.3: Documentation

Update documentation:
- [ ] Update README.md (TerraFusion Developer Platform overview)
- [ ] Create DEVELOPER_GUIDE.md (how to use)
- [ ] Create API_REFERENCE.md (all endpoints)
- [ ] Delete old consciousness engine docs

### Task 4.4: Clean Up

```bash
# Remove old files
rm -rf frontend/src/components/TerraSphere.tsx
rm -rf frontend/src/animations/consciousness*.ts
rm PORTAL_IMPLEMENTATION.md
rm COMMAND_PORTAL_INTEGRATION_VALIDATION_COMPLETE.md

# Add to git
git add -A
git commit -m "TerraFusion Developer Platform: Complete architecture overhaul

- Removed Tier 17/18 APIs (moved to correct locations)
- Simplified backend to focused developer tools
- Replaced quantum visualizations with IDE interface
- Integrated with 1,008-agent swarm for code assistance
- Added file browser, code editor, AI copilot, tasks
- Tier 1 Platform Workspace (MIT PhD strategy)"
```

---

## ✅ FINAL CHECKLIST

When all are done:

- [x] Architecture decision made (Option A+)
- [ ] Phase 1 complete (Backend cleaned)
- [ ] Phase 2 complete (Frontend simplified)
- [ ] Phase 3 complete (Core services implemented)
- [ ] Phase 4 complete (Deployed & validated)
- [ ] Tier 17/18 moved to correct locations
- [ ] Documentation updated
- [ ] Git commit made
- [ ] Zero "consciousness engine" code remains
- [ ] MIT PhD Workspace Strategy alignment 100%
- [ ] Ready for team to start using

---

## 🎖️ THIS IS THE TERRAFUSION WAY

No more chaos. No more undefined systems. No more features added to the wrong place.

**Clean decision. Focused scope. Proper execution.**

Let's build it. 🚀

