// Module initializer — runs exactly once, at test-assembly load, before
// ANY other code in this assembly (including static ctors of other types).
//
// Sets ASPNETCORE_CONTENTROOT so that WebApplicationFactory<Program>'s
// default content-root discovery walk finds the TerraFusion.Operations
// project under src/, rather than looking for a sibling directory next
// to the test bin output (which is how the default heuristic walks).
//
// Without this override, integration tests that spin up the Operations
// Program via WebApplicationFactory<Program> fail with
//   System.IO.DirectoryNotFoundException: ...\backend\TerraFusion.Operations\
// because the default walk assumes the project sits next to the test
// project at the solution root — a layout this repo does not use.
//
// ModuleInitializer timing: guaranteed to run before any test-class
// construction, any IClassFixture resolution, any [Fact] execution.

using System.IO;
using System.Runtime.CompilerServices;

namespace TerraFusion.Integration.Tests.Infrastructure;

internal static class ContentRootInitializer
{
    [ModuleInitializer]
    internal static void Initialize()
    {
        // From the test bin dir (bin/Debug/net8.0 under TerraFusion.Integration.Tests),
        // the Operations source lives at ../../../../../src/TerraFusion.Operations
        // (four ".." for bin/Debug/net8.0/<project>, then up to backend/).
        var opsSrc = Path.GetFullPath(Path.Combine(
            System.AppContext.BaseDirectory,
            "..", "..", "..", "..", "..", "src", "TerraFusion.Operations"));

        if (Directory.Exists(opsSrc)
            && File.Exists(Path.Combine(opsSrc, "TerraFusion.Operations.csproj")))
        {
            // Only override if the caller hasn't already set it explicitly,
            // so per-run overrides via env var still win.
            if (string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("ASPNETCORE_CONTENTROOT")))
            {
                System.Environment.SetEnvironmentVariable("ASPNETCORE_CONTENTROOT", opsSrc);
            }
        }
    }
}
