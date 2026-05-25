# Current Use AI Assist Wiring

## Frontend

Add to `CurrentUseWorkbenchTab` after Notice Preview or beside Rollback Explanation:

```tsx
<CurrentUseAiAssistPanel overview={overview} rollbackResult={rollbackResult} />
```

## Backend

Register:

```csharp
services.AddTerraCurrentUseAiAssist();
```

Controller:

```txt
POST /api/forge/current-use/ai/assist
```

## Allowed Actions

- summarize document
- explain rule
- explain calculation
- draft notice language
- identify missing evidence
- compare owner statements
- summarize timeline
- flag possible inconsistency

## Forbidden Actions

- approve classification
- deny classification
- finalize removal
- override rollback calculation
- waive penalty
- determine statutory exception
- issue final notice without human review

## Rule

AI is review support only.
