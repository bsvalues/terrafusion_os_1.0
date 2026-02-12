# Slack Notifications Plugin

Send notifications to Slack channels when workspace phases complete or fail.

## Features

- 🔔 Automatic notifications for phase completions and failures
- ⚙️ Configurable channels and notification settings
- 🎨 Color-coded messages (green for success, red for errors)
- 🤖 Customizable bot username and appearance

## Installation

1. Ensure you have a Slack webhook URL:
   - Go to your Slack workspace settings
   - Create a new incoming webhook
   - Copy the webhook URL

2. Install the plugin:

   ```bash
   terrafusion plugin install slack-notifications
   ```

3. Configure the plugin:
   ```bash
   terrafusion plugin configure slack-notifications
   ```

## Configuration

The plugin requires the following configuration:

- **webhook_url** (required): Your Slack webhook URL
- **channel** (optional): Default channel to send notifications to (default: #general)
- **username** (optional): Bot username to display (default: Terrafusion Launcher)
- **notify_on_success** (optional): Send notifications for successful phases (default: true)
- **notify_on_error** (optional): Send notifications for failed phases (default: true)

## Usage

Once configured, the plugin will automatically send notifications when:

- A workspace phase completes successfully
- A workspace phase fails with an error

You can also manually send notifications using the integration action:

```javascript
// Send a custom notification
await launcher.executePluginAction("slack-notifications", "send-notification", {
  message: "Custom deployment notification",
  channel: "#deployments",
  color: "warning",
});
```

## Message Format

Success messages:

```
🎉 Phase Development completed successfully!
```

Error messages:

```
❌ Phase Production failed: Connection timeout
```

## Permissions

This plugin requires the following permissions:

- `network.http_post`: To send HTTP requests to Slack
- `config.read`: To read plugin configuration

## Troubleshooting

1. **Plugin not sending notifications**: Check that the webhook URL is correctly configured
2. **Messages not appearing in expected channel**: Verify the channel name includes the # prefix
3. **Permission errors**: Ensure the webhook has permission to post to the specified channel

## Development

This plugin is written in Rhai script language. To modify:

1. Edit `plugin.rhai` with your changes
2. Reload the plugin: `terrafusion plugin reload slack-notifications`

## License

MIT License - see LICENSE file for details.
