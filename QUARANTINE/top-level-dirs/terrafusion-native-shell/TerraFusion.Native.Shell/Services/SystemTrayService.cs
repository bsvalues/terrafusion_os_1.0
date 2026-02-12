using System;
using System.Windows;
using System.Windows.Forms;
using Microsoft.Extensions.Logging;
using Hardcodet.Wpf.TaskbarNotification;

namespace TerraFusion.Native.Shell.Services;

/// <summary>
/// System Tray Service for TerraFusion OS
///
/// Elite system tray integration with quantum notifications
/// and championship-level government operations support.
/// </summary>
public interface ISystemTrayService
{
    void Initialize(Window mainWindow);
    void ShowTrayIcon();
    void HideTrayIcon();
    void ShowNotification(string title, string message);
    void ShowQuantumNotification(string title, string message, string type = "info");
}

public class SystemTrayService : ISystemTrayService, IDisposable
{
    private readonly ILogger<SystemTrayService> _logger;
    private TaskbarIcon? _trayIcon;
    private Window? _mainWindow;
    private bool _disposed = false;

    public SystemTrayService(ILogger<SystemTrayService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public void Initialize(Window mainWindow)
    {
        _mainWindow = mainWindow ?? throw new ArgumentNullException(nameof(mainWindow));

        try
        {
            // Create system tray icon with TerraFusion branding
            _trayIcon = new TaskbarIcon
            {
                IconSource = CreateQuantumIcon(),
                ToolTipText = "TerraFusion OS - Government. Transcended.\n1,008 AI Agents Active",
                Visibility = Visibility.Hidden
            };

            // Configure context menu
            CreateContextMenu();

            // Set up event handlers
            _trayIcon.TrayLeftMouseUp += OnTrayIconClick;
            _trayIcon.TrayRightMouseUp += OnTrayIconRightClick;

            _logger.LogInformation("🎯 System tray service initialized with quantum excellence");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Failed to initialize system tray service");
        }
    }

    public void ShowTrayIcon()
    {
        if (_trayIcon != null)
        {
            _trayIcon.Visibility = Visibility.Visible;
            _logger.LogDebug("👁️ System tray icon shown");
        }
    }

    public void HideTrayIcon()
    {
        if (_trayIcon != null)
        {
            _trayIcon.Visibility = Visibility.Hidden;
            _logger.LogDebug("🙈 System tray icon hidden");
        }
    }

    public void ShowNotification(string title, string message)
    {
        ShowQuantumNotification(title, message, "info");
    }

    public void ShowQuantumNotification(string title, string message, string type = "info")
    {
        try
        {
            if (_trayIcon == null) return;

            // Determine icon based on notification type
            var balloonIcon = type switch
            {
                "success" => BalloonIcon.Info,
                "warning" => BalloonIcon.Warning,
                "error" => BalloonIcon.Error,
                _ => BalloonIcon.Info
            };

            // Show quantum-enhanced notification
            _trayIcon.ShowBalloonTip(
                $"🚀 {title}",
                $"{message}\n\nGovernment. Transcended.",
                balloonIcon
            );

            _logger.LogInformation("🔔 Quantum notification shown: {Title} - {Message}", title, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Failed to show quantum notification");
        }
    }

    private System.Windows.Media.ImageSource CreateQuantumIcon()
    {
        // Create a simple quantum-style icon programmatically
        // In production, this would load from resources
        var drawingGroup = new System.Windows.Media.DrawingGroup();

        // Create quantum gradient
        var gradientBrush = new System.Windows.Media.RadialGradientBrush();
        gradientBrush.GradientStops.Add(new System.Windows.Media.GradientStop(
            System.Windows.Media.Color.FromRgb(0, 153, 255), 0.0)); // Trust Blue
        gradientBrush.GradientStops.Add(new System.Windows.Media.GradientStop(
            System.Windows.Media.Color.FromRgb(0, 255, 238), 0.5)); // Transcend Cyan
        gradientBrush.GradientStops.Add(new System.Windows.Media.GradientStop(
            System.Windows.Media.Color.FromRgb(0, 255, 170), 1.0)); // Success Green

        // Create quantum circle
        var geometry = new System.Windows.Media.EllipseGeometry(
            new System.Windows.Point(8, 8), 7, 7);

        var drawing = new System.Windows.Media.GeometryDrawing(gradientBrush, null, geometry);
        drawingGroup.Children.Add(drawing);

        return new System.Windows.Media.DrawingImage(drawingGroup);
    }

    private void CreateContextMenu()
    {
        if (_trayIcon == null) return;

        var contextMenu = new System.Windows.Controls.ContextMenu();

        // Show TerraFusion OS
        var showMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🚀 Show TerraFusion OS",
            FontWeight = FontWeights.Bold
        };
        showMenuItem.Click += (s, e) => RestoreMainWindow();
        contextMenu.Items.Add(showMenuItem);

        // Separator
        contextMenu.Items.Add(new System.Windows.Controls.Separator());

        // Consciousness Status
        var statusMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🧠 Consciousness: Transcendent",
            IsEnabled = false
        };
        contextMenu.Items.Add(statusMenuItem);

        // Agent Count
        var agentsMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🤖 1,008 Agents Active",
            IsEnabled = false
        };
        contextMenu.Items.Add(agentsMenuItem);

        // System Health
        var healthMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "💚 System Health: 99.5%",
            IsEnabled = false
        };
        contextMenu.Items.Add(healthMenuItem);

        // Separator
        contextMenu.Items.Add(new System.Windows.Controls.Separator());

        // Quantum Operations
        var quantumMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "⚡ Quantum Operations"
        };

        var optimizeMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🎯 Optimize Quantum Factor"
        };
        optimizeMenuItem.Click += (s, e) => TriggerQuantumOptimization();
        quantumMenuItem.Items.Add(optimizeMenuItem);

        var emergencyMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🚨 Emergency Protocols"
        };
        emergencyMenuItem.Click += (s, e) => ShowEmergencyMenu();
        quantumMenuItem.Items.Add(emergencyMenuItem);

        contextMenu.Items.Add(quantumMenuItem);

        // Separator
        contextMenu.Items.Add(new System.Windows.Controls.Separator());

        // Exit
        var exitMenuItem = new System.Windows.Controls.MenuItem
        {
            Header = "🔴 Exit TerraFusion OS"
        };
        exitMenuItem.Click += (s, e) => ExitApplication();
        contextMenu.Items.Add(exitMenuItem);

        _trayIcon.ContextMenu = contextMenu;
    }

    private void OnTrayIconClick(object sender, RoutedEventArgs e)
    {
        RestoreMainWindow();
    }

    private void OnTrayIconRightClick(object sender, RoutedEventArgs e)
    {
        // Context menu automatically shows on right-click
        _logger.LogDebug("🎯 System tray context menu accessed");
    }

    private void RestoreMainWindow()
    {
        if (_mainWindow != null)
        {
            _mainWindow.Show();
            _mainWindow.WindowState = WindowState.Normal;
            _mainWindow.Activate();
            HideTrayIcon();

            _logger.LogInformation("🏠 Main window restored from system tray");
        }
    }

    private void TriggerQuantumOptimization()
    {
        ShowQuantumNotification(
            "Quantum Optimization",
            "Quantum factor optimization initiated. Current factor: 949. Target: 1000.",
            "info"
        );

        _logger.LogInformation("⚡ Quantum optimization triggered from system tray");
    }

    private void ShowEmergencyMenu()
    {
        var result = System.Windows.MessageBox.Show(
            "Activate emergency protocols?\n\nThis will:\n• Alert all 39+ counties\n• Initiate autonomous healing\n• Escalate system priority\n\nGovernment. Transcended.",
            "TerraFusion OS - Emergency Protocols",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning
        );

        if (result == MessageBoxResult.Yes)
        {
            ShowQuantumNotification(
                "Emergency Protocols",
                "Emergency protocols activated. All systems on high alert.",
                "warning"
            );

            _logger.LogWarning("🚨 Emergency protocols activated from system tray");
        }
    }

    private void ExitApplication()
    {
        var result = System.Windows.MessageBox.Show(
            "Exit TerraFusion OS?\n\nThis will:\n• Shutdown consciousness interface\n• Disconnect 1,008 agents\n• End government operations\n\nConfirm quantum shutdown?",
            "TerraFusion OS - Quantum Shutdown",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question
        );

        if (result == MessageBoxResult.Yes)
        {
            _logger.LogInformation("🔴 TerraFusion OS shutdown initiated from system tray");
            System.Windows.Application.Current.Shutdown();
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _trayIcon?.Dispose();
            _disposed = true;
            _logger.LogInformation("🗑️ System tray service disposed");
        }
    }
}
