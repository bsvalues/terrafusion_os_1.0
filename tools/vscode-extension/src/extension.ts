import * as vscode from 'vscode';
import { AgentActivityProvider } from './providers/AgentActivityProvider';
import { PortalWebViewProvider } from './providers/PortalWebViewProvider';
import { ServicesProvider } from './providers/ServicesProvider';
import { WorkspaceExplorerProvider } from './providers/WorkspaceExplorerProvider';
const WebSocket = require('ws');

let transparencyWs: any | null = null;
let currentLayer: 'surface' | 'hint' | 'depth' | 'expert' = 'hint';
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('🏛️ TerraFusion OS Extension Activating...');

  // Initialize tree view providers
  const workspaceProvider = new WorkspaceExplorerProvider();
  const servicesProvider = new ServicesProvider();
  const agentProvider = new AgentActivityProvider();

  // Register tree views
  vscode.window.registerTreeDataProvider('terrafusion.explorer', workspaceProvider);
  vscode.window.registerTreeDataProvider('terrafusion.services', servicesProvider);
  vscode.window.registerTreeDataProvider('terrafusion.agents', agentProvider);

  // Register Portal WebView
  const portalProvider = new PortalWebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('terrafusion.portal', portalProvider)
  );

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'terrafusion.cycleTransparency';
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('terrafusion.openPortal', () => {
      const config = vscode.workspace.getConfiguration('terrafusion');
      const portalUrl = config.get<string>('portalUrl', 'http://localhost:5174');

      const panel = vscode.window.createWebviewPanel(
        'terrafusionPortal',
        'TerraFusion Portal',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = getPortalIframeHtml(portalUrl);
    }),

    vscode.commands.registerCommand('terrafusion.cycleTransparency', () => {
      const layers: Array<typeof currentLayer> = ['surface', 'hint', 'depth', 'expert'];
      const currentIndex = layers.indexOf(currentLayer);
      currentLayer = layers[(currentIndex + 1) % layers.length];
      updateStatusBar();
      vscode.window.showInformationMessage(`Transparency Layer: ${currentLayer.toUpperCase()}`);

      // Notify transparency engine
      if (transparencyWs?.readyState === WebSocket.OPEN) {
        transparencyWs.send(
          JSON.stringify({
            type: 'setLayer',
            layer: currentLayer,
          })
        );
      }
    }),

    vscode.commands.registerCommand('terrafusion.refreshWorkspaces', () => {
      workspaceProvider.refresh();
    }),

    vscode.commands.registerCommand('terrafusion.launchBackend', async () => {
      const terminal = vscode.window.createTerminal('TerraFusion Backend');
      terminal.sendText('tdc launch:backend');
      terminal.show();
    }),

    vscode.commands.registerCommand('terrafusion.launchPortal', async () => {
      const terminal = vscode.window.createTerminal('TerraFusion Portal');
      terminal.sendText('tdc portal launch');
      terminal.show();
    }),

    vscode.commands.registerCommand('terrafusion.status', async () => {
      const terminal = vscode.window.createTerminal('TerraFusion Status');
      terminal.sendText('tdc status');
      terminal.show();
    }),

    vscode.commands.registerCommand('terrafusion.aiTrace', async () => {
      const terminal = vscode.window.createTerminal('TerraFusion AI Trace');
      terminal.sendText('tdc ai trace --follow');
      terminal.show();
    })
  );

  // Connect to Transparency Engine WebSocket
  const config = vscode.workspace.getConfiguration('terrafusion');
  if (config.get<boolean>('autoConnectTransparency', true)) {
    connectToTransparencyEngine(context);
  }

  console.log('✅ TerraFusion OS Extension Activated');
}

function connectToTransparencyEngine(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('terrafusion');
  const wsUrl = config.get<string>('transparencyEngineUrl', 'ws://localhost:8788');

  try {
    const ws = new WebSocket(wsUrl);
    transparencyWs = ws;

    ws.on('open', () => {
      console.log('✅ Connected to Transparency Engine');
      vscode.window.showInformationMessage('TerraFusion: Connected to Transparency Engine');
      updateStatusBar();
    });

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'agentAction') {
          // Forward to agent activity provider
          vscode.commands.executeCommand('terrafusion.updateAgentActivity', message.action);
        }
      } catch (err) {
        console.error('Failed to parse transparency message:', err);
      }
    });

    ws.on('error', err => {
      console.error('Transparency Engine connection error:', err);
    });

    ws.on('close', () => {
      console.log('Transparency Engine disconnected');
      transparencyWs = null;
      updateStatusBar();

      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        if (config.get<boolean>('autoConnectTransparency', true)) {
          connectToTransparencyEngine(context);
        }
      }, 5000);
    });
  } catch (err) {
    console.error('Failed to connect to Transparency Engine:', err);
  }
}

function updateStatusBar() {
  const connected = transparencyWs?.readyState === WebSocket.OPEN;
  const icon = connected ? '$(pulse)' : '$(circle-slash)';
  const layerEmoji = {
    surface: '🔵',
    hint: '🟢',
    depth: '🟡',
    expert: '🔴',
  }[currentLayer];

  statusBarItem.text = `${icon} TerraFusion ${layerEmoji} ${currentLayer.toUpperCase()}`;
  statusBarItem.tooltip = connected
    ? `Transparency Engine Connected\nLayer: ${currentLayer}\nClick to cycle`
    : `Transparency Engine Disconnected\nLayer: ${currentLayer}\nClick to cycle`;
}

function getPortalIframeHtml(portalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TerraFusion Portal</title>
	<style>
		body, html {
			margin: 0;
			padding: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}
		iframe {
			width: 100%;
			height: 100%;
			border: none;
		}
	</style>
</head>
<body>
	<iframe src="${portalUrl}" allow="clipboard-read; clipboard-write"></iframe>
</body>
</html>`;
}

export function deactivate() {
  if (transparencyWs) {
    transparencyWs.close();
  }
  console.log('TerraFusion OS Extension Deactivated');
}
