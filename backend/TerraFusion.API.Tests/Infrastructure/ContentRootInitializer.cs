// Module initializer — runs exactly once, at test-assembly load, before
// ANY other code in this assembly (including static ctors of other types).
//
// Sets ASPNETCORE_CONTENTROOT so that WebApplicationFactory's default
// discovery walk is bypassed. The default walk fails in non-standard
// layouts (git worktrees, custom output paths) with:
//
//   System.InvalidOperationException: Unable to resolve TerraFusion.API
//   content root from 'C:\...\TerraFusion.API.Tests\bin\Debug\net8.0'
//
// ModuleInitializer timing: guaranteed to run before any test-class
// construction, any IClassFixture resolution, any [Fact] execution.

using System.IO;
using System.Runtime.CompilerServices;

namespace TerraFusion.API.Tests.Infrastructure;

internal static class ContentRootInitializer
{
    [ModuleInitializer]
    internal static void Initialize()
    {
        // From the test bin dir (bin/Debug/net8.0 under TerraFusion.API.Tests),
        // the API source lives at ../../../../src/TerraFusion.API.
        var apiSrc = Path.GetFullPath(Path.Combine(
            System.AppContext.BaseDirectory,
            "..", "..", "..", "..", "src", "TerraFusion.API"));

        if (Directory.Exists(apiSrc)
            && File.Exists(Path.Combine(apiSrc, "TerraFusion.API.csproj")))
        {
            // Only override if the caller hasn't already set it explicitly.
            if (string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("ASPNETCORE_CONTENTROOT")))
            {
                System.Environment.SetEnvironmentVariable("ASPNETCORE_CONTENTROOT", apiSrc);
            }
        }
    }
}
