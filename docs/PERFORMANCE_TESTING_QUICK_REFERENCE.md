# ⚡ Performance Testing Quick Reference

## Run All Tests
```powershell
cd backend/tests/TerraFusion.Performance.Tests
dotnet test
```

## Unit Benchmarks
```powershell
dotnet run --configuration Release
```

## Load Testing
```powershell
# 100 concurrent users
dotnet test --filter "Concurrency=100"

# 1,000 concurrent users  
dotnet test --filter "Concurrency=1000"
```

## Stress Testing
```powershell
# 50K AI agent swarm
dotnet test --filter "SwarmSize=50000"
```

## Endurance Testing
```powershell
# 24-hour test (WARNING: Long-running)
dotnet test --filter "Duration=24Hours"
```

## Championship Targets
- **P95 Latency**: <2s ✅
- **IAAO Accuracy**: 99.9% ✅
- **Error Rate**: <5% ✅
- **AI Swarm**: 50K agents ✅

## Report Locations
- HTML: `BenchmarkDotNet.Artifacts/results/`
- JSON: `performance-report.json`
- Grafana: `grafana_export.json`

---
**Government. Transcended. - Performance Excellence**
