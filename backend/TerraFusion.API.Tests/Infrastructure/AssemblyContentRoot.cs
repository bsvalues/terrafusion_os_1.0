// Pins the WebApplicationFactory content root for TerraFusion.API to the
// correct source directory, bypassing the default discovery walk that
// fails in non-standard layouts (git worktrees, custom output paths).
//
// Without this, tests using ApiWebAppFactory throw at construction time:
//   System.InvalidOperationException: Unable to resolve TerraFusion.API
//   content root from 'C:\...\TerraFusion.API.Tests\bin\Debug\net8.0' ...
//
// Reference: the MSBuild "GenerateMSBuildEditorConfigFile" target normally
// emits a similar attribute automatically, but only when the test project
// and API project are in sibling directories and the repo is laid out
// per the MVC Testing conventions. In this repo the API source lives at
// backend/src/TerraFusion.API while tests live at backend/TerraFusion.API.Tests —
// the sibling-only resolver misses it.

using Microsoft.AspNetCore.Mvc.Testing;

// 4-arg form:
//   assemblyName: entry point assembly (matches <TerraFusion.API.Program>)
//   contentRootPath: absolute or relative (walked from AppContext.BaseDirectory)
//   contentRootTest: marker file expected in the content root — verifies the
//                    path is actually the API project
//   priority: "0" is highest; lower wins when multiple attributes match
[assembly: WebApplicationFactoryContentRoot(
    "TerraFusion.API",
    "../../../../src/TerraFusion.API",
    "TerraFusion.API.csproj",
    "0")]
