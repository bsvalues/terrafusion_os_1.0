using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase17;

/// <summary>
/// Phase 17A - OS-Shell Auth Flow Integrity Gate.
/// Scans frontend/apps/os-shell/src to enforce:
///   1. A single canonical auth-token localStorage key across all services.
///   2. Both 401 AND 403 handling in the central API interceptor.
///   3. A /login route registered in the Router.
/// Violations mean the auth layer is structurally broken and
/// must be fixed before new surface area is added.
/// </summary>
[Trait("Category", "Phase17")]
[Trait("Category", "Governance")]
public class AuthFlowIntegrityTests
{
    /// <summary>
    /// Canonical token key that ALL frontend services must use.
    /// Any deviation indicates a split-brain auth store.
    /// </summary>
    private const string CanonicalTokenKey = "authToken";

    private static readonly string OsShellSrcDir = FindOsShellSrcDir();

    private static string FindOsShellSrcDir()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            var candidate = Path.Combine(dir, "frontend", "apps", "os-shell", "src");
            if (Directory.Exists(candidate)) return candidate;
            var gitDir = Path.Combine(dir, ".git");
            if (Directory.Exists(gitDir) || File.Exists(gitDir))
            {
                candidate = Path.Combine(dir, "frontend", "apps", "os-shell", "src");
                if (Directory.Exists(candidate)) return candidate;
            }
            dir = Path.GetDirectoryName(dir);
        }
        return string.Empty;
    }

    /// <summary>
    /// Every localStorage auth-token reference in os-shell/src must use
    /// the canonical key. Mixed keys (auth_token, terrafusion_auth_token)
    /// cause silent token misses across services.
    /// </summary>
    [Fact]
    public void OsShell_Must_Use_Single_Canonical_Auth_Token_Key()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        // Match localStorage.getItem('...auth...'), setItem, removeItem
        var tokenKeyPattern = new Regex(
            @"localStorage\.(getItem|setItem|removeItem)\(['""]([^'""]*auth[^'""]*)['""]",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        var tsFiles = Directory.GetFiles(OsShellSrcDir, "*.ts", SearchOption.AllDirectories)
            .Concat(Directory.GetFiles(OsShellSrcDir, "*.tsx", SearchOption.AllDirectories))
            .Where(f => !f.Contains("node_modules") && !f.Contains("dist"))
            .ToArray();

        var violations = new List<string>();
        foreach (var file in tsFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                var match = tokenKeyPattern.Match(lines[i]);
                if (match.Success)
                {
                    var foundKey = match.Groups[2].Value;
                    if (foundKey != CanonicalTokenKey)
                    {
                        var relativePath = Path.GetRelativePath(OsShellSrcDir, file);
                        violations.Add(
                            $"  {relativePath}:{i + 1} uses '{foundKey}' " +
                            $"(expected '{CanonicalTokenKey}') — {lines[i].Trim()}");
                    }
                }
            }
        }

        violations.Should().BeEmpty(
            $"All os-shell auth token references must use the canonical key '{CanonicalTokenKey}'. " +
            $"Found {violations.Count} non-canonical key(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// The central API interceptor (services/api.ts) must handle both
    /// 401 (Unauthorized) and 403 (Forbidden) responses. Missing 403
    /// handling means forbidden errors are silently swallowed or
    /// surface as generic "API Error" without user feedback.
    /// </summary>
    [Fact]
    public void OsShell_Api_Interceptor_Must_Handle_401_And_403()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var apiFile = Path.Combine(OsShellSrcDir, "services", "api.ts");
        if (!File.Exists(apiFile))
            return;

        var content = File.ReadAllText(apiFile);

        // Must have 401 handling
        var has401 = Regex.IsMatch(content, @"status\s*===?\s*401");
        // Must have 403 handling
        var has403 = Regex.IsMatch(content, @"status\s*===?\s*403");

        var missing = new List<string>();
        if (!has401) missing.Add("401 (Unauthorized)");
        if (!has403) missing.Add("403 (Forbidden)");

        missing.Should().BeEmpty(
            "The central API interceptor (services/api.ts) must handle both " +
            "401 and 403 HTTP status codes. Missing handler(s): " +
            string.Join(", ", missing));
    }

    /// <summary>
    /// The Router must declare a /login route so that 401 redirects
    /// don't land on a blank page or the catch-all.
    /// </summary>
    [Fact]
    public void OsShell_Router_Must_Declare_Login_Route()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var routerFile = Path.Combine(OsShellSrcDir, "Router.tsx");
        if (!File.Exists(routerFile))
            return;

        var content = File.ReadAllText(routerFile);

        // Match path='/login' or path="/login"
        var hasLoginRoute = Regex.IsMatch(content, @"path\s*=\s*['""]\/login['""]");

        hasLoginRoute.Should().BeTrue(
            "Router.tsx must declare a /login route. The 401 interceptor " +
            "redirects to /login but no route exists, causing a blank page.");
    }
}
