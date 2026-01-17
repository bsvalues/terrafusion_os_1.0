# TODO: Resolve NETSDK1194 Warnings

**Status**: Open
**Severity**: Low (Warning)
**Owner**: DevOps

## Description
The build process is emitting `NETSDK1194` warnings. This typically relates to floating-point representation or SDK version mismatches in .NET projects.

## Action Items
- [ ] Locate the source of the warning in the build logs (likely Backend or Integration tests).
- [ ] Determine if this impacts floating-point determinism in `TerraFusion.API` or `TerraFusion.Consciousness`.
- [ ] Apply fix (e.g., pinning SDK version, updating csproj settings).
- [ ] Verify clean build log.

## Reference
- See `DEPENDENCY_SCOPE_REPORT.md` or recent CI logs for occurrence context (though strictly it was mentioned in the prompt, not the files yet).
