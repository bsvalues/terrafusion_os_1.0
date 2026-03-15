// TMR-112: Notification Service - Multi-channel notifications (email/webhook stubs)
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Notifications
{
    /// <summary>
    /// Channel through which a notification is delivered.
    /// </summary>
    public enum NotificationChannel
    {
        Email,
        Webhook,
        Log
    }

    /// <summary>
    /// A notification to be sent through one or more channels.
    /// </summary>
    public class Notification
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public NotificationChannel Channel { get; set; } = NotificationChannel.Log;
        public List<string> Recipients { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Sends notifications via email, webhook, or log channels.
    /// All configuration (SMTP, webhook URLs) is read from IConfiguration.
    /// </summary>
    public class NotificationService
    {
        private readonly ILogger<NotificationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory? _httpClientFactory;

        public NotificationService(
            ILogger<NotificationService> logger,
            IConfiguration configuration,
            IHttpClientFactory? httpClientFactory = null)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Sends a notification through the specified channel.
        /// </summary>
        public async Task<bool> SendAsync(Notification notification)
        {
            _logger.LogInformation("Sending {Channel} notification: {Subject}",
                notification.Channel, notification.Subject);

            return notification.Channel switch
            {
                NotificationChannel.Email => await SendEmailAsync(notification),
                NotificationChannel.Webhook => await SendWebhookAsync(notification),
                NotificationChannel.Log => SendLogNotification(notification),
                _ => false
            };
        }

        private Task<bool> SendEmailAsync(Notification notification)
        {
            // Stub: In production, use configured SMTP settings from IConfiguration
            var smtpHost = _configuration["Notifications:Smtp:Host"];
            if (string.IsNullOrEmpty(smtpHost))
            {
                _logger.LogWarning("SMTP not configured; email notification logged only. Subject: {Subject}",
                    notification.Subject);
                return Task.FromResult(false);
            }

            // Stub: actual SMTP send would go here
            _logger.LogInformation("Email sent to {Recipients}: {Subject}",
                string.Join(", ", notification.Recipients), notification.Subject);
            return Task.FromResult(true);
        }

        private async Task<bool> SendWebhookAsync(Notification notification)
        {
            var webhookUrl = _configuration["Notifications:WebhookUrl"];
            if (string.IsNullOrEmpty(webhookUrl) || _httpClientFactory == null)
            {
                _logger.LogWarning("Webhook not configured; notification logged only. Subject: {Subject}",
                    notification.Subject);
                return false;
            }

            try
            {
                var client = _httpClientFactory.CreateClient("notifications");
                var payload = System.Text.Json.JsonSerializer.Serialize(new
                {
                    subject = notification.Subject,
                    body = notification.Body,
                    timestamp = notification.CreatedAt
                });
                var content = new StringContent(payload, Encoding.UTF8, "application/json");
                var response = await client.PostAsync(webhookUrl, content);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook notification failed");
                return false;
            }
        }

        private bool SendLogNotification(Notification notification)
        {
            _logger.LogInformation("[Notification] {Subject}: {Body}", notification.Subject, notification.Body);
            return true;
        }
    }
}
