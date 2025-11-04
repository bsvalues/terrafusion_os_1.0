# TerraFusion.Experiments — Experiment Manager (MVP)

This is a lightweight Experiment Manager scaffold for TerraFusion OS. It provides a minimal API to create and retrieve experiment manifests, and a SignalR hub to broadcast ExperimentUpdate events.

Local run (development):

```powershell
# from repository root
dotnet build TerraFusion.sln
dotnet run --project backend/TerraFusion.Experiments --urls "http://localhost:5010"
```

API examples:

Create an experiment (curl):

```bash
curl -X POST http://localhost:5010/api/experiments \
  -H "Content-Type: application/json" \
  -d '{ "name":"test", "datasetId":"dataset-1", "modelId":"model-x", "seed":42 }'
```

Get experiment:

```bash
curl http://localhost:5010/api/experiments/{id}
```

Notes:
- This MVP stores manifests in-memory and persists to a local `data/experiments.json` file in the app folder. For production, integrate with `TerraFusion.Data` and create an EF migration instead of using the local store.
- Use the SQL migration placeholder in `Migrations/0001_create_experiments_table.sql` as a starting point if you want to create a DB-backed Experiments table.
