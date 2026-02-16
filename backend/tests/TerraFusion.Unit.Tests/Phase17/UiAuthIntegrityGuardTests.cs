using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.Unit.Tests.Phase17;

/// <summary>
/// Phase 17 — UI Auth Integrity Guard.
/// Mechanical enforcement of os-shell authentication invariants.
/// Prevents auth drift: duplicate session sources, dead CRA env patterns,
/// missing identity headers, hardcoded credentials, and unencrypted storage.
/// </summary>
[Trait("Category", "Phase17")]
[Trait("Category", "Governance")]
public class UiAuthIntegrityGuardTests
{
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
    /// Helper: get all .ts/.tsx source files, excluding node_modules/obj/bin/dist.
    /// </summary>
    private static string[] GetSourceFiles(string pattern = "*.ts")
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return Array.Empty<string>();

        return Directory.GetFiles(OsShellSrcDir, pattern, SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules") &&
                        !f.Contains(Path.DirectorySeparatorChar + "obj" + Path.DirectorySeparatorChar) &&
                        !f.Contains(Path.DirectorySeparatorChar + "bin" + Path.DirectorySeparatorChar) &&
                        !f.Contains(Path.DirectorySeparatorChar + "dist" + Path.DirectorySeparatorChar))
            .ToArray();
    }

    private static string[] GetAllSourceFiles()
    {
        var ts = GetSourceFiles("*.ts");
        var tsx = GetSourceFiles("*.tsx");
        return ts.Concat(tsx).ToArray();
    }

    private static bool IsTestFile(string path) =>
        path.Contains("__tests__") ||
        path.Contains(".test.") ||
        path.Contains(".spec.") ||
        path.Contains("test-utils") ||
        path.Contains("testUtils") ||
        path.Contains("__mocks__") ||
        path.Contains("setupTests");

    #region Invariant 1: Single canonical session module

    /// <summary>
    /// There must be exactly one session.ts in the auth/ directory.
    /// Duplicate session management causes identity split-brain.
    /// </summary>
    [Fact]
    public void OsShell_Must_Have_Single_Canonical_Session_Module()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var sessionFiles = Directory.GetFiles(OsShellSrcDir, "session.ts", SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules") && !IsTestFile(f))
            .ToArray();

        sessionFiles.Should().HaveCountGreaterOrEqualTo(1,
            "os-shell must have at least one session.ts for auth identity");

        var authSessionFiles = sessionFiles
            .Where(f => f.Contains(Path.Combine("auth", "session.ts")))
            .ToArray();

        authSessionFiles.Should().HaveCount(1,
            "there must be exactly one auth/session.ts — the canonical session source");
    }

    #endregion

    #region Invariant 2: No CRA env pattern in Vite project

    /// <summary>
    /// os-shell is a Vite project. Using process.env.REACT_APP_* is a CRA pattern
    /// that produces undefined values at runtime. All env access must use
    /// getViteEnv() or import.meta.env.VITE_*.
    /// </summary>
    [Fact]
    public void OsShell_Must_Not_Use_CRA_Env_Pattern()
    {
        var files = GetAllSourceFiles()
            .Where(f => !IsTestFile(f))
            .ToArray();
        if (files.Length == 0) return;

        var craPattern = new Regex(
            @"process\.env\.REACT_APP_",
            RegexOptions.Compiled);

        var violations = new List<string>();

        foreach (var file in files)
        {
            var content = File.ReadAllText(file);
            var matches = craPattern.Matches(content);
            foreach (Match match in matches)
            {
                var rel = Path.GetRelativePath(OsShellSrcDir, file);
                var lineNum = content[..match.Index].Count(c => c == '\n') + 1;
                violations.Add($"  {rel}:{lineNum} — {match.Value}");
            }
        }

        violations.Should().BeEmpty(
            "os-shell is a Vite project — process.env.REACT_APP_* is dead at runtime. " +
            "Use getViteEnv() instead. " +
            $"Found {violations.Count} CRA env pattern(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Invariant 3: Pilot client injects identity headers

    /// <summary>
    /// pilotClient.ts must inject x-user-id and x-county-id headers.
    /// These are the mandatory identity headers for the Pilot subsystem.
    /// Missing either header causes silent anonymous access.
    /// </summary>
    [Fact]
    public void OsShell_PilotClient_Must_Inject_Identity_Headers()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var pilotClientPath = Path.Combine(OsShellSrcDir, "services", "pilotClient.ts");
        if (!File.Exists(pilotClientPath)) return;

        var content = File.ReadAllText(pilotClientPath);

        content.Should().Contain("x-user-id",
            "pilotClient.ts must inject x-user-id header for identity");
        content.Should().Contain("x-county-id",
            "pilotClient.ts must inject x-county-id header for county isolation");
    }

    #endregion

    #region Invariant 4: No hardcoded credentials

    /// <summary>
    /// Source files must not contain hardcoded passwords, API keys, or secrets.
    /// Env vars and encrypted storage are the only authorized patterns.
    /// </summary>
    [Fact]
    public void OsShell_Must_Not_Contain_Hardcoded_Credentials()
    {
        var files = GetAllSourceFiles()
            .Where(f => !IsTestFile(f))
            .ToArray();
        if (files.Length == 0) return;

        // Patterns that indicate hardcoded credentials
        var credentialPatterns = new[]
        {
            new Regex(@"(?:password|passwd|pwd)\s*[:=]\s*['""][^'""]{4,}['""]", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new Regex(@"(?:api_?key|apikey)\s*[:=]\s*['""][^'""]{8,}['""]", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new Regex(@"(?:secret_?key|secretkey)\s*[:=]\s*['""][^'""]{8,}['""]", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new Regex(@"Bearer\s+[A-Za-z0-9\-._~+/]+=*(?!['""}\s]*['""])", RegexOptions.Compiled),
        };

        // Allow-list for known safe patterns (type annotations, empty defaults, comments)
        var safePatterns = new[]
        {
            "password: string",
            "password?: string",
            "password: ''",
            "password: \"\"",
            "type='password'",
            "type=\"password\"",
            "Bearer ${",
            "Bearer ' +",
            "`Bearer ${",
            "Authorization: token ?",
        };

        var violations = new List<string>();

        foreach (var file in files)
        {
            var content = File.ReadAllText(file);
            var lines = content.Split('\n');

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];

                // Skip comments
                if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("*"))
                    continue;

                foreach (var pattern in credentialPatterns)
                {
                    if (pattern.IsMatch(line))
                    {
                        // Check against safe patterns
                        if (safePatterns.Any(safe => line.Contains(safe)))
                            continue;

                        var rel = Path.GetRelativePath(OsShellSrcDir, file);
                        violations.Add($"  {rel}:{i + 1} — potential hardcoded credential");
                    }
                }
            }
        }

        violations.Should().BeEmpty(
            "source files must not contain hardcoded credentials. " +
            "Use environment variables or encrypted storage. " +
            $"Found {violations.Count} potential credential(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Invariant 5: Auth token storage must use encryption

    /// <summary>
    /// AuthenticationService.ts must encrypt tokens before localStorage storage.
    /// Plain-text token storage is a FISMA violation.
    /// </summary>
    [Fact]
    public void OsShell_AuthService_Must_Encrypt_Token_Storage()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var authServicePath = Path.Combine(
            OsShellSrcDir, "services", "AuthenticationService.ts");
        if (!File.Exists(authServicePath)) return;

        var content = File.ReadAllText(authServicePath);

        // Must import/use a crypto library
        var hasCrypto = content.Contains("CryptoJS") ||
                        content.Contains("crypto") ||
                        content.Contains("encrypt") ||
                        content.Contains("AES");

        hasCrypto.Should().BeTrue(
            "AuthenticationService.ts must encrypt tokens before storage — " +
            "plain-text localStorage is a FISMA violation");

        // Must not store raw tokens directly
        var rawStoragePattern = new Regex(
            @"localStorage\.setItem\s*\(\s*[^,]+,\s*(?:accessToken|refreshToken|token)\s*\)",
            RegexOptions.Compiled);

        rawStoragePattern.IsMatch(content).Should().BeFalse(
            "AuthenticationService must not store raw tokens in localStorage — " +
            "tokens must be encrypted before storage");
    }

    #endregion

    #region Invariant 6: Single canonical getViteEnv source

    /// <summary>
    /// There must be exactly one getViteEnv implementation.
    /// Multiple copies cause env resolution drift and are a maintenance hazard.
    /// </summary>
    [Fact]
    public void OsShell_Must_Have_Single_Canonical_ViteEnv()
    {
        var files = GetSourceFiles("*.ts")
            .Where(f => !IsTestFile(f))
            .ToArray();
        if (files.Length == 0) return;

        var viteEnvDefPattern = new Regex(
            @"export\s+function\s+getViteEnv\s*\(",
            RegexOptions.Compiled);

        var defFiles = new List<string>();

        foreach (var file in files)
        {
            var content = File.ReadAllText(file);
            if (viteEnvDefPattern.IsMatch(content))
            {
                var rel = Path.GetRelativePath(OsShellSrcDir, file);
                defFiles.Add(rel);
            }
        }

        defFiles.Should().HaveCountLessOrEqualTo(1,
            "os-shell must have at most one getViteEnv definition to prevent env drift. " +
            $"Found {defFiles.Count} definition(s):\n  " +
            string.Join("\n  ", defFiles));
    }

    #endregion

    #region Invariant 7: pilotApi must not send unauthenticated requests

    /// <summary>
    /// pilotApi.ts functions that call fetch() must include auth headers
    /// or use an authenticated fetch wrapper. Bare fetch() with only
    /// Content-Type is a silent authentication bypass.
    /// </summary>
    [Fact]
    public void OsShell_PilotApi_Must_Include_Auth_Headers()
    {
        if (string.IsNullOrEmpty(OsShellSrcDir) || !Directory.Exists(OsShellSrcDir))
            return;

        var pilotApiPath = Path.Combine(OsShellSrcDir, "api", "pilotApi.ts");
        if (!File.Exists(pilotApiPath)) return;

        var content = File.ReadAllText(pilotApiPath);

        // Check for auth header patterns
        var hasAuthHeaders = content.Contains("Authorization") ||
                             content.Contains("x-user-id") ||
                             content.Contains("Bearer") ||
                             content.Contains("authenticatedFetch") ||
                             content.Contains("sessionToPilotHeaders") ||
                             content.Contains("buildHeaders");

        hasAuthHeaders.Should().BeTrue(
            "pilotApi.ts makes fetch() calls but has no authentication headers. " +
            "All API calls must include identity headers (x-user-id/x-county-id) " +
            "or Authorization bearer token to prevent anonymous access");
    }

    #endregion
}
