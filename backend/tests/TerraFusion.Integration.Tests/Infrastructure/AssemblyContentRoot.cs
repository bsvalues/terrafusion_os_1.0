// Pins the WebApplicationFactory content root for TerraFusion.Operations
// to the correct source directory, bypassing the default sibling-walk that
// fails in this repo's non-standard layout (src/ + tests/ split).
//
// Without this, Phase 39 IncidentTriageApiTests fails at ctor time with:
//   System.IO.DirectoryNotFoundException:
//     ...\backend\TerraFusion.Operations\
// because WebApplicationFactory<Program> assumes Operations sits next to
// the test project. This repo keeps runnable apps under src/, so we pin
// the content root explicitly.

using Microsoft.AspNetCore.Mvc.Testing;

// 4-arg form:
//   assemblyName:    entry-point assembly (the Operations Program lives here)
//   contentRootPath: relative to AppContext.BaseDirectory (bin/Debug/net8.0)
//   contentRootTest: marker file expected in the root — verifies it's the
//                    Operations project
//   priority:        "0" is highest precedence
[assembly: WebApplicationFactoryContentRoot(
    "TerraFusion.Operations",
    "../../../../../src/TerraFusion.Operations",
    "TerraFusion.Operations.csproj",
    "0")]
