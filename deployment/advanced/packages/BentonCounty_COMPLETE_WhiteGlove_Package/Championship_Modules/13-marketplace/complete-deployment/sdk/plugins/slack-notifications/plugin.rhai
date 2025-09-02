// Slack Notifications Plugin Implementation

let manifest = #{
    id: "slack-notifications",
    name: "Slack Notifications",
    version: "1.0.0"
};

let config = #{
    webhook_url: "",
    channel: "#general",
    username: "TerraFusion Launcher",
    notify_on_success: true,
    notify_on_error: true
};

fn on_load(context) {
    print("Slack notifications plugin loaded");
    
    // Load configuration
    let plugin_config = context.api.get_config("slack-notifications");
    if plugin_config != () {
        config.webhook_url = plugin_config.webhook_url;
        config.channel = plugin_config.channel || "#general";
        config.username = plugin_config.username || "TerraFusion Launcher";
        config.notify_on_success = plugin_config.notify_on_success || true;
        config.notify_on_error = plugin_config.notify_on_error || true;
    }
}

fn on_enable() {
    print("Slack notifications plugin enabled");
    
    // Subscribe to phase events
    context.api.subscribe_event("phase-completed", "on_phase_completed");
    context.api.subscribe_event("phase-failed", "on_phase_failed");
}

fn on_disable() {
    print("Slack notifications plugin disabled");
    
    // Unsubscribe from events
    context.api.unsubscribe_event("phase-completed", "on_phase_completed");
    context.api.unsubscribe_event("phase-failed", "on_phase_failed");
}

fn on_unload() {
    print("Slack notifications plugin unloaded");
}

fn get_capabilities() {
    [
        #{
            id: "send-notification",
            name: "Send Slack Notification",
            description: "Send a message to a Slack channel",
            category: "communication",
            params_schema: #{
                type: "object",
                properties: #{
                    message: #{ type: "string" },
                    channel: #{ type: "string" },
                    color: #{ type: "string" }
                }
            }
        }
    ]
}

fn execute_action(action, params) {
    if action == "send-notification" {
        send_slack_message(
            params.message || "Hello from TerraFusion!",
            params.channel || config.channel,
            params.color || "good"
        )
    } else {
        throw "Unknown action: " + action;
    }
}

fn on_phase_completed(event_data) {
    if !config.notify_on_success {
        return;
    }
    
    let phase_name = event_data.phase || "Unknown Phase";
    let message = `🎉 Phase *${phase_name}* completed successfully!`;
    
    send_slack_message(message, config.channel, "good");
}

fn on_phase_failed(event_data) {
    if !config.notify_on_error {
        return;
    }
    
    let phase_name = event_data.phase || "Unknown Phase";
    let error_message = event_data.error || "Unknown error";
    let message = `❌ Phase *${phase_name}* failed: ${error_message}`;
    
    send_slack_message(message, config.channel, "danger");
}

fn send_slack_message(text, channel, color) {
    if config.webhook_url == "" {
        print("Slack webhook URL not configured");
        return #{
            success: false,
            error: "Webhook URL not configured"
        };
    }
    
    let payload = #{
        channel: channel,
        username: config.username,
        text: text,
        attachments: [
            #{
                color: color,
                text: text,
                footer: "TerraFusion Launcher",
                ts: timestamp()
            }
        ]
    };
    
    let response = http_post(config.webhook_url, payload);
    
    if response.status == 200 {
        print("Slack notification sent successfully");
        return #{
            success: true,
            sent: true
        };
    } else {
        print("Failed to send Slack notification: " + response.error);
        return #{
            success: false,
            error: response.error
        };
    }
}

// Helper function to get current timestamp
fn timestamp() {
    // This would be provided by the plugin runtime
    unix_timestamp()
}