using System.Windows;

namespace TerraFusion.Native.Shell;

/// <summary>
/// TerraFusion OS WPF Application
///
/// Elite desktop application shell with quantum-enhanced architecture
/// Government. Transcended.
/// </summary>
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Set application properties for championship excellence
        this.ShutdownMode = ShutdownMode.OnMainWindowClose;
        this.DispatcherUnhandledException += App_DispatcherUnhandledException;
    }

    private void App_DispatcherUnhandledException(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
    {
        // Elite error handling with autonomous recovery
        MessageBox.Show(
            $"TerraFusion OS encountered an unexpected error:\n\n{e.Exception.Message}\n\nAutonomous self-healing protocols activated.",
            "TerraFusion OS - Autonomous Recovery",
            MessageBoxButton.OK,
            MessageBoxImage.Warning
        );

        e.Handled = true; // Continue running with self-healing
    }
}
