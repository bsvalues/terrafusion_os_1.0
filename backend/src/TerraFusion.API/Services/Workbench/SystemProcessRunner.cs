using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Services.Workbench;

// WORKBENCH-V0.3 SLICE-J: v0.3 bridge implementation — spawns existing Node.js tools.
// Future hardening may replace with a C# service.

/// <summary>
/// Production implementation of <see cref="IProcessRunner"/> that uses
/// <see cref="System.Diagnostics.Process"/>.
/// </summary>
public sealed class SystemProcessRunner : IProcessRunner
{
    public async Task<ProcessRunOutcome> RunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        string workingDirectory,
        IReadOnlyDictionary<string, string> environmentVars,
        CancellationToken cancellationToken = default)
    {
        var stdoutBuilder = new StringBuilder();
        var stderrBuilder = new StringBuilder();

        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        foreach (var arg in arguments)
            psi.ArgumentList.Add(arg);

        foreach (var (key, value) in environmentVars)
            psi.Environment[key] = value;

        var sw = Stopwatch.StartNew();

        using var process = new Process { StartInfo = psi };
        process.OutputDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                stdoutBuilder.AppendLine(e.Data);
        };
        process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                stderrBuilder.AppendLine(e.Data);
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);
        sw.Stop();

        return new ProcessRunOutcome
        {
            ExitCode = process.ExitCode,
            Stdout = stdoutBuilder.ToString(),
            Stderr = stderrBuilder.ToString(),
            DurationMs = (int)sw.ElapsedMilliseconds,
        };
    }
}
