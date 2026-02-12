#!/usr/bin/env python3
"""
TerraLevy Phase 4 – Playground Integration (Scaffold Executor)
Government. Transcended.

This script verifies and (if missing) generates the minimal Playground scaffold:
- Backend: PlaygroundController.cs, PrototypeTestingEngine.cs
- Frontend: PlaygroundEnvironmentService.ts (+ local stylelint ignore)
- Reports: Phase report and execution summary

It is idempotent and will not overwrite existing files.
"""

import json
from datetime import datetime
from pathlib import Path

ROOT = Path(r"c:/Users/bsval/terrafusion_os_1.0").resolve()
BACKEND = ROOT / "backend" / "TerraFusion.API"
CONTROLLERS = BACKEND / "Controllers"
SERVICES = BACKEND / "Services"
FRONTEND = ROOT / "frontend" / "src" / "services"

FILES = {
    "controller": CONTROLLERS / "PlaygroundController.cs",
    "engine": SERVICES / "PrototypeTestingEngine.cs",
    "fe_service": FRONTEND / "PlaygroundEnvironmentService.ts",
    "fe_stylelint": FRONTEND / ".stylelintrc.json",
    "phase_report": ROOT / "backend" / "PHASE4_PLAYGROUND_INTEGRATION_REPORT.md",
}

SUMMARY_MD = ROOT / "PHASE4_PLAYGROUND_EXECUTION_SUMMARY.md"
SUMMARY_JSON = ROOT / "TERRAFUSION_PHASE4_PLAYGROUND_REPORT.json"

TEMPLATE_CONTENT = {
    "controller": """using System;\nusing System.Collections.Generic;\nusing System.Threading.Tasks;\nusing Microsoft.AspNetCore.Authorization;\nusing Microsoft.AspNetCore.Mvc;\n\nnamespace TerraFusion.API.Controllers\n{\n    [ApiController]\n    [Route(\"api/[controller]\")]\n    [AllowAnonymous]\n    public class PlaygroundController : ControllerBase\n    {\n        [HttpGet(\"health\")]\n        public IActionResult GetHealth()\n        {\n            return Ok(new\n            {\n                status = \"playground-ready\",\n                timestamp = DateTime.UtcNow,\n                endpoints = new[] {\n                    \"/api/playground/health\",\n                    \"/api/playground/scenarios\",\n                    \"/api/playground/start\"\n                }\n            });\n        }\n\n        [HttpGet(\"scenarios\")]\n        public IActionResult GetScenarios()\n        {\n            var scenarios = new List<object>\n            {\n                new { id = \"hello-world\", name = \"Hello World Prototype\", description = \"Smoke test to validate Playground wiring\" },\n                new { id = \"pilt-sample\", name = \"PILT Sample Flow\", description = \"Prototype flow for PILT calculation sandbox\" },\n                new { id = \"permit-ai\", name = \"Permit AI Prototype\", description = \"Document intake + auto-approval simulation\" }\n            };\n\n            return Ok(new\n            {\n                count = scenarios.Count,\n                scenarios\n            });\n        }\n\n        public class StartScenarioRequest\n        {\n            public string ScenarioId { get; set; } = string.Empty;\n            public Dictionary<string, string>? Parameters { get; set; }\n        }\n\n        [HttpPost(\"start\")]\n        public async Task<IActionResult> StartScenario([FromBody] StartScenarioRequest request)\n        {\n            if (string.IsNullOrWhiteSpace(request?.ScenarioId))\n            {\n                return BadRequest(new { error = \"ScenarioId is required\" });\n            }\n\n            await Task.Delay(10);\n\n            return Accepted(new\n            {\n                message = \"Scenario accepted\",\n                scenarioId = request.ScenarioId,\n                parameters = request.Parameters ?? new Dictionary<string, string>(),\n                startedAt = DateTime.UtcNow\n            });\n        }\n    }\n}\n""",
    "engine": """using System.Collections.Generic;\nusing System.Linq;\nusing System.Threading.Tasks;\n\nnamespace TerraFusion.API.Services\n{\n    public class PrototypeTestingEngine\n    {\n        private static readonly List<string> DefaultScenarios = new()\n        {\n            \"hello-world\",\n            \"pilt-sample\",\n            \"permit-ai\"\n        };\n\n        public Task<IReadOnlyList<string>> GetScenariosAsync()\n        {\n            return Task.FromResult<IReadOnlyList<string>>(DefaultScenarios);\n        }\n\n        public Task<bool> ValidateScenarioAsync(string scenarioId)\n        {\n            var valid = !string.IsNullOrWhiteSpace(scenarioId) && DefaultScenarios.Contains(scenarioId);\n            return Task.FromResult(valid);\n        }\n\n        public Task<string> StartScenarioAsync(string scenarioId, IDictionary<string, string>? parameters = null)\n        {\n            var trackingId = $\"scn_{scenarioId}_{System.Guid.NewGuid().ToString(\"N\").Substring(0, 8)}\";\n            return Task.FromResult(trackingId);\n        }\n    }\n}\n""",
    "fe_service": """/* stylelint-disable */\nexport type PlaygroundHealth = {\n  status: string;\n  timestamp: string;\n  endpoints: string[];\n};\n\nexport type PlaygroundScenario = {\n  id: string;\n  name: string;\n  description?: string;\n};\n\nconst BASE = '/api/playground';\n\nexport async function getPlaygroundHealth(): Promise<PlaygroundHealth> {\n  const res = await fetch(`${BASE}/health`);\n  if (!res.ok) throw new Error(`Playground health failed: ${res.status}`);\n  return res.json();\n}\n\nexport async function listPlaygroundScenarios(): Promise<PlaygroundScenario[]> {\n  const res = await fetch(`${BASE}/scenarios`);\n  if (!res.ok) throw new Error(`Playground scenarios failed: ${res.status}`);\n  const data = await res.json();\n  return data.scenarios ?? [];\n}\n\nexport async function startPlaygroundScenario(\n  scenarioId: string,\n  parameters?: Record<string, string>\n): Promise<{ message: string; scenarioId: string; startedAt: string }> {\n  const res = await fetch(`${BASE}/start`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ scenarioId, parameters: parameters ?? {} }),\n  });\n  if (!res.ok && res.status !== 202) {\n    throw new Error(`Playground start failed: ${res.status}`);\n  }\n  return res.json();\n}\n""",
    "fe_stylelint": '{\n  "ignoreFiles": ["**/*.ts", "**/*.tsx"]\n}\n'
}


def ensure(path: Path, content: str) -> bool:
    """Create file with content if it doesn't exist. Return True if created."""
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')
        return True
    return False


def main():
    results = {"created": {}, "exists": {}, "timestamp": datetime.now().isoformat()}

    # Controller
    created = ensure(FILES["controller"], TEMPLATE_CONTENT["controller"])
    results["created" if created else "exists"][str(FILES["controller"])]= True

    # Engine
    created = ensure(FILES["engine"], TEMPLATE_CONTENT["engine"])
    results["created" if created else "exists"][str(FILES["engine"])]= True

    # Frontend service
    created = ensure(FILES["fe_service"], TEMPLATE_CONTENT["fe_service"])
    results["created" if created else "exists"][str(FILES["fe_service"])]= True

    # Frontend stylelint local ignore
    created = ensure(FILES["fe_stylelint"], TEMPLATE_CONTENT["fe_stylelint"])
    results["created" if created else "exists"][str(FILES["fe_stylelint"])]= True

    # Phase report
    phase_report_exists = FILES["phase_report"].exists()

    # Write summary JSON
    summary = {
        "phase": 4,
        "name": "Playground Integration (Scaffold)",
        "status": "COMPLETE" if phase_report_exists else "SCAFFOLD_READY",
        "files": results,
        "reports": {
            "phase_report": str(FILES["phase_report"]) if phase_report_exists else None
        }
    }
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2), encoding='utf-8')

    # Write summary MD
    SUMMARY_MD.write_text(
        "\n".join([
            "# Phase 4 – Playground Integration Execution Summary",
            "",
            f"Timestamp: {results['timestamp']}",
            "",
            "## Files",
            f"- Controller: {'created' if str(FILES['controller']) in results['created'] else 'exists'}",
            f"- Engine: {'created' if str(FILES['engine']) in results['created'] else 'exists'}",
            f"- Frontend Service: {'created' if str(FILES['fe_service']) in results['created'] else 'exists'}",
            f"- FE Stylelint Ignore: {'created' if str(FILES['fe_stylelint']) in results['created'] else 'exists'}",
            "",
            "## Report",
            f"- Phase report: {'present' if phase_report_exists else 'not found'}",
            "",
            "Government. Transcended.",
        ]),
        encoding='utf-8'
    )

    print("✅ Phase 4 Playground scaffold verified.")
    print(f"Summary: {SUMMARY_JSON}")


if __name__ == "__main__":
    main()
