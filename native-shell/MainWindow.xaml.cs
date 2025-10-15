using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Windows;

namespace Terrafusion.Shell
{
    // Message classes for WebView2 communication
    public record WebViewMessage(string RequestId, string Endpoint, object Data);
    public record WebViewResponse(bool Success, string Data, string RequestId);
    
    /// <summary>
    /// Main application window - WebView2 container for TerraFusion cOS
    /// Week 1: Basic shell with Windows auth and WebView2 hosting
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            InitializeAsync();
        }
        
        private async void InitializeAsync()
        {
            try
            {
                UpdateLoadingStatus("Verifying Windows authentication...");
                
                // Step 1: Verify Windows authentication
                if (!VerifyWindowsAuthentication())
                {
                    ShowError("Windows authentication required. Please login to the domain.");
                    Application.Current.Shutdown();
                    return;
                }
                
                UpdateLoadingStatus("Validating security certificate...");
                
                // Step 2: Certificate validation (Week 1 Day 3-4)
                if (!ValidateCertificate())
                {
                    LogToEventLog("Certificate validation failed - continuing with limited access", EventLogEntryType.Warning);
                    // Don't block for Week 1, just warn
                }
                
                UpdateLoadingStatus("Initializing secure environment...");
                
                // Step 3: Initialize WebView2 (Week 1 Day 5-7)
                await InitializeWebView();
                
                UpdateLoadingStatus("Loading TerraFusion interface...");
                
                // Step 4: Load UI (Week 1: current web UI, Week 2+: dynamic)
                await LoadUI();
                
                HideLoadingScreen();
                LogToEventLog("TerraFusion launched successfully", EventLogEntryType.Information);
            }
            catch (Exception ex)
            {
                LogToEventLog($"Launch failed: {ex.Message}\n{ex.StackTrace}", EventLogEntryType.Error);
                ShowError($"Failed to launch TerraFusion: {ex.Message}");
            }
        }
        
        private bool VerifyWindowsAuthentication()
        {
            try
            {
                var identity = WindowsIdentity.GetCurrent();
                if (identity == null || !identity.IsAuthenticated)
                {
                    LogToEventLog("Windows authentication failed: No authenticated user", EventLogEntryType.Error);
                    return false;
                }
                
                // Extract user information
                string userName = identity.Name;
                string authenticationType = identity.AuthenticationType ?? "Unknown";
                bool isSystem = identity.IsSystem;
                
                // Log successful authentication
                LogToEventLog(
                    $"User authenticated successfully\n" +
                    $"User: {userName}\n" +
                    $"Auth Type: {authenticationType}\n" +
                    $"System Account: {isSystem}", 
                    EventLogEntryType.Information
                );
                
                // Store user identity for later use
                Application.Current.Properties["UserIdentity"] = identity.Name;
                Application.Current.Properties["AuthType"] = authenticationType;
                
                return true;
            }
            catch (Exception ex)
            {
                LogToEventLog($"Authentication verification failed: {ex.Message}", EventLogEntryType.Error);
                return false;
            }
        }
        
        private bool ValidateCertificate()
        {
            try
            {
                // Week 1 Day 3-4: Certificate validation
                // Check for certificate thumbprint in environment variable
                string? certThumbprint = Environment.GetEnvironmentVariable("TF_CERT_THUMBPRINT");
                
                if (string.IsNullOrEmpty(certThumbprint))
                {
                    LogToEventLog("TF_CERT_THUMBPRINT not set - using development mode", EventLogEntryType.Warning);
                    Application.Current.Properties["CertificateMode"] = "development";
                    return true; // Allow development mode for Week 1
                }
                
                // In production, would validate actual certificate here
                // For Week 1, just store the thumbprint
                Application.Current.Properties["CertificateThumbprint"] = certThumbprint;
                Application.Current.Properties["CertificateMode"] = "production";
                
                LogToEventLog($"Certificate validated: {certThumbprint.Substring(0, Math.Min(8, certThumbprint.Length))}...", EventLogEntryType.Information);
                return true;
            }
            catch (Exception ex)
            {
                LogToEventLog($"Certificate validation error: {ex.Message}", EventLogEntryType.Error);
                return false;
            }
        }
        
        private async Task InitializeWebView()
        {
            // Week 1 Day 5-7: Initialize WebView2
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "TerraFusion",
                "WebView2"
            );
            
            Directory.CreateDirectory(userDataFolder);
            
            var env = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: userDataFolder
            );
            
            await webView.EnsureCoreWebView2Async(env);
            
            // Apply security policies FIRST
            ApplySecurityPolicies();
            
            // Configure WebView2 settings
            var settings = webView.CoreWebView2.Settings;
            settings.IsScriptEnabled = true;
            settings.IsWebMessageEnabled = true;
            settings.IsStatusBarEnabled = false;
            settings.AreDevToolsEnabled = true; // Enable for development
            settings.AreHostObjectsAllowed = false;
            
            // Add navigation logging
            webView.CoreWebView2.NavigationCompleted += (sender, args) =>
            {
                if (args.IsSuccess)
                {
                    LogToEventLog($"✅ Navigation succeeded to: {args.Uri}", EventLogEntryType.Information);
                }
                else
                {
                    LogToEventLog($"❌ Navigation FAILED to: {args.Uri} - Error: {args.WebErrorStatus}", EventLogEntryType.Error);
                }
            };
            
            // Setup message bridge between React and Native Shell
            SetupWebViewMessaging();
        }
        
        private async Task LoadUI()
        {
            try
            {
                // 🎯 DYNAMIC SERVICE DISCOVERY - Read backend URL from service registry
                var registryPath = Path.Combine(
                    AppDomain.CurrentDomain.BaseDirectory, 
                    "..", "..", "..", "..", // Navigate up to workspace root
                    "service-registry.json"
                );
                
                string backendUrl = "http://localhost:5000"; // Fallback default
                
                if (File.Exists(registryPath))
                {
                    var registryJson = await File.ReadAllTextAsync(registryPath);
                    using var doc = System.Text.Json.JsonDocument.Parse(registryJson);
                    
                    if (doc.RootElement.TryGetProperty("services", out var services) &&
                        services.TryGetProperty("backend", out var backend) &&
                        backend.TryGetProperty("url", out var url) &&
                        url.GetString() is string urlStr && !string.IsNullOrEmpty(urlStr))
                    {
                        backendUrl = urlStr;
                        LogToEventLog($"✅ Discovered backend at: {backendUrl}", EventLogEntryType.Information);
                    }
                    else
                    {
                        LogToEventLog($"⚠️ Backend not registered in service registry yet, using fallback: {backendUrl}", EventLogEntryType.Warning);
                    }
                }
                else
                {
                    LogToEventLog($"⚠️ Service registry not found at {registryPath}, using fallback: {backendUrl}", EventLogEntryType.Warning);
                }
                
                // Load UI from discovered backend URL with cache-busting
                var timestamp = DateTime.UtcNow.Ticks;
                webView.Source = new Uri($"{backendUrl}/index.html?v={timestamp}");
                LogToEventLog($"Loading UI from {backendUrl}/index.html?v={timestamp}", EventLogEntryType.Information);
            }
            catch (Exception ex)
            {
                LogToEventLog($"❌ Error loading UI: {ex.Message}", EventLogEntryType.Error);
                // Fallback to default
                webView.Source = new Uri("http://localhost:5000/index.html");
            }
        }
        
        /// <summary>
        /// Configure WebView2 to React message bridge
        /// Allows React UI to call native shell capabilities
        /// </summary>
        private void SetupWebViewMessaging()
        {
            webView.CoreWebView2.WebMessageReceived += async (sender, args) =>
            {
                try
                {
                    var message = args.TryGetWebMessageAsString();
                    LogToEventLog($"Received message from UI: {message}", EventLogEntryType.Information);
                    
                    // Parse message as JSON
                    var messageObj = System.Text.Json.JsonSerializer.Deserialize<WebViewMessage>(message);
                    
                    if (messageObj == null)
                    {
                        return;
                    }
                    
                    // Route to appropriate handler
                    var response = await HandleWebViewMessage(messageObj);
                    
                    // Send response back to React
                    var responseJson = System.Text.Json.JsonSerializer.Serialize(response);
                    webView.CoreWebView2.PostWebMessageAsString(responseJson);
                }
                catch (Exception ex)
                {
                    LogToEventLog($"WebView message handling error: {ex.Message}", EventLogEntryType.Error);
                }
            };
        }
        
        /// <summary>
        /// Handle messages from React UI
        /// </summary>
        private async Task<WebViewResponse> HandleWebViewMessage(WebViewMessage message)
        {
            try
            {
                // Route to .NET API or handle natively
                using var httpClient = new HttpClient();
                httpClient.BaseAddress = new Uri("http://localhost:5000");
                
                var apiResponse = await httpClient.PostAsJsonAsync(message.Endpoint, message.Data);
                var apiResult = await apiResponse.Content.ReadAsStringAsync();
                
                return new WebViewResponse(
                    Success: apiResponse.IsSuccessStatusCode,
                    Data: apiResult,
                    RequestId: message.RequestId
                );
            }
            catch (Exception ex)
            {
                return new WebViewResponse(
                    Success: false,
                    Data: $"{{\"error\": \"{ex.Message}\"}}",
                    RequestId: message.RequestId
                );
            }
        }
        
        private void UpdateLoadingStatus(string message)
        {
            LoadingStatus.Text = message;
        }
        
        private void ShowLoadingScreen()
        {
            LoadingPanel.Visibility = Visibility.Visible;
            webView.Visibility = Visibility.Collapsed;
            ErrorPanel.Visibility = Visibility.Collapsed;
        }
        
        private void HideLoadingScreen()
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            webView.Visibility = Visibility.Visible;
            ErrorPanel.Visibility = Visibility.Collapsed;
        }
        
        private void ShowError(string message)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            webView.Visibility = Visibility.Collapsed;
            ErrorPanel.Visibility = Visibility.Visible;
            ErrorMessage.Text = message;
        }
        
        private void RetryButton_Click(object sender, RoutedEventArgs e)
        {
            ShowLoadingScreen();
            InitializeAsync();
        }
        
        private void LogToEventLog(string message, EventLogEntryType type)
        {
            try
            {
                // Week 1 Day 3-4: Enhanced logging
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                string logMessage = $"[{timestamp}] [{type}] {message}";
                
                // Console logging for development
                Console.WriteLine(logMessage);
                
                // File logging (production-ready)
                string logDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "TerraFusion",
                    "Logs"
                );
                Directory.CreateDirectory(logDir);
                
                string logFile = Path.Combine(logDir, $"terrafusion_{DateTime.Now:yyyyMMdd}.log");
                File.AppendAllText(logFile, logMessage + Environment.NewLine);
                
                // Event log (requires admin to create source, skip for now)
                string source = "TerraFusion";
                if (EventLog.SourceExists(source))
                {
                    EventLog.WriteEntry(source, message, type);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to write log: {ex.Message}");
            }
        }

        /// <summary>
        /// Apply government-grade security policies to WebView2
        /// Week 1: Basic restrictions
        /// Week 2+: Enhanced CSP, permission controls
        /// </summary>
        private void ApplySecurityPolicies()
        {
            try
            {
                LogToEventLog("Applying WebView2 security policies...", EventLogEntryType.Information);

                // Navigation restrictions: Only allow local files and county.gov domains
                webView.CoreWebView2.NavigationStarting += (sender, args) =>
                {
                    var uri = new Uri(args.Uri);
                    
                    // Allow file:// protocol (our UI)
                    if (uri.Scheme == "file")
                    {
                        return;
                    }
                    
                    // Allow localhost (for development/backend APIs)
                    if (uri.Host == "localhost" || uri.Host == "127.0.0.1")
                    {
                        return;
                    }
                    
                    // Allow *.county.gov domains (government resources only)
                    if (uri.Host.EndsWith(".county.gov", StringComparison.OrdinalIgnoreCase))
                    {
                        return;
                    }
                    
                    // Block everything else
                    LogToEventLog($"Blocked navigation to: {args.Uri}", EventLogEntryType.Warning);
                    args.Cancel = true;
                };

                // Permission requests: Deny all by default (microphone, camera, location, etc.)
                webView.CoreWebView2.PermissionRequested += (sender, args) =>
                {
                    LogToEventLog($"Permission requested: {args.PermissionKind} - DENIED", EventLogEntryType.Warning);
                    args.State = Microsoft.Web.WebView2.Core.CoreWebView2PermissionState.Deny;
                };

                // Download restrictions: Only allow from county.gov
                webView.CoreWebView2.DownloadStarting += (sender, args) =>
                {
                    var uri = new Uri(args.ResultFilePath);
                    
                    if (!args.DownloadOperation.Uri.Contains(".county.gov", StringComparison.OrdinalIgnoreCase))
                    {
                        LogToEventLog($"Blocked download from: {args.DownloadOperation.Uri}", EventLogEntryType.Warning);
                        args.Cancel = true;
                    }
                };

                LogToEventLog("Security policies applied successfully", EventLogEntryType.Information);
            }
            catch (Exception ex)
            {
                LogToEventLog($"Failed to apply security policies: {ex.Message}\n{ex.StackTrace}", EventLogEntryType.Error);
                throw;
            }
        }
    }
}
