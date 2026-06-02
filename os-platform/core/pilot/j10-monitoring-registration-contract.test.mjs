import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const programText = fs.readFileSync("backend/src/TerraFusion.API/Program.cs", "utf8");
const monitoringHealthText = fs.readFileSync(
  "backend/src/TerraFusion.Core/Services/Monitoring/HealthCheckServiceImpl.cs",
  "utf8"
);

test("MonitoringController dependencies are explicitly registered in the API host", () => {
  assert.match(
    programText,
    /AddScoped<\s*TerraFusion\.Core\.Services\.Monitoring\.IObservabilityService\s*,\s*TerraFusion\.Core\.Services\.Monitoring\.ObservabilityService\s*>/,
    "IObservabilityService must be registered so /api/monitoring/* does not fail controller activation"
  );
  assert.match(
    programText,
    /AddScoped<\s*TerraFusion\.Core\.Services\.Monitoring\.IMetricsCollectionService\s*,\s*TerraFusion\.Core\.Services\.Monitoring\.MetricsCollectionService\s*>/,
    "IMetricsCollectionService must be registered so /api/monitoring/metrics does not fail controller activation"
  );
  assert.match(
    programText,
    /AddScoped<\s*TerraFusion\.Core\.Services\.Monitoring\.IHealthCheckService\s*,\s*TerraFusion\.Core\.Services\.Monitoring\.TerraFusionHealthCheckService\s*>/,
    "IHealthCheckService must be registered so detailed monitoring health can execute"
  );
});

test("monitoring health adapter degrades instead of blocking controller activation when core health is absent", () => {
  assert.match(
    monitoringHealthText,
    /HealthCheckService\?\s+healthCheckService\s*=\s*null/,
    "TerraFusionHealthCheckService must tolerate an unconfigured core HealthCheckService"
  );
  assert.match(
    monitoringHealthText,
    /core_health_service_unavailable/,
    "missing core health service must be reported as an honest unavailable state"
  );
});
