import * as vscode from 'vscode';

export class PortalWebViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'transparencyLayerChanged':
          vscode.window.showInformationMessage(`Transparency layer changed to: ${data.layer}`);
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const config = vscode.workspace.getConfiguration('terrafusion');
    const portalUrl = config.get<string>('portalUrl', 'http://localhost:5174');

    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			margin: 0;
			padding: 0;
			overflow: hidden;
			background: #0A0E1A;
		}
		iframe {
			width: 100%;
			height: 100vh;
			border: none;
		}
		.connection-status {
			position: absolute;
			top: 8px;
			right: 8px;
			padding: 4px 8px;
			background: rgba(0, 255, 255, 0.1);
			border: 1px solid rgba(0, 255, 255, 0.3);
			border-radius: 4px;
			color: #00FFFF;
			font-size: 10px;
			font-family: monospace;
			z-index: 1000;
		}
	</style>
</head>
<body>
	<div class="connection-status" id="status">Connecting...</div>
	<iframe
		id="portal"
		src="${portalUrl}"
		allow="clipboard-read; clipboard-write"
		sandbox="allow-scripts allow-same-origin allow-forms"
	></iframe>
	<script>
		const vscode = acquireVsCodeApi();
		const iframe = document.getElementById('portal');
		const status = document.getElementById('status');

		iframe.onload = () => {
			status.textContent = 'Portal Connected';
			setTimeout(() => {
				status.style.opacity = '0.5';
			}, 2000);
		};

		iframe.onerror = () => {
			status.textContent = 'Portal Disconnected';
			status.style.background = 'rgba(255, 0, 0, 0.1)';
			status.style.borderColor = 'rgba(255, 0, 0, 0.3)';
			status.style.color = '#FF0000';
		};

		// Listen for messages from Portal
		window.addEventListener('message', event => {
			if (event.data.type === 'transparencyLayerChanged') {
				vscode.postMessage(event.data);
			}
		});
	</script>
</body>
</html>`;
  }
}
