import * as vscode from 'vscode';
export class WebviewViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  private _view?: vscode.WebviewView;

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    this._view = webviewView;

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'webExperimentation.setCredentials':
          vscode.commands.executeCommand('webExperimentation.setCredentials');
          break;
        case 'featureExperimentation.setCredentials':
          vscode.commands.executeCommand('featureExperimentation.setCredentials');
          break;
      }
    });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'node_modules',
        '@vscode',
        'webview-ui-toolkit',
        'dist',
        'toolkit.js',
      ),
    );

    const configureUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'configure.js'),
    );

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'script.js'));

    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'styles.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `
        <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AB Tasty</title>
      <link href="${styleUri}" rel="stylesheet">
      <script type="module" src="${toolkitUri}"></script>
  </head>
  <body>
      <div class="container">
          <h1>Welcome to the Visual Studio Code extension for AB Tasty!</h1>
          <p>With the VSC extension, you will be able to create and manage variations for your campaigns (for Web Experimentation &amp; Personalization) and/or to manage and use flags for your use cases (for Feature Experimentation &amp; Rollout) in order to enhance your productivity.</p>
          
          <div class="workspace-selection">
              <p>Select the workspace you want to configure to:</p>
              <div class="radio-group">
                  <vscode-radio-group orientation="vertical" id="radioGroup">
    <vscode-radio value="wep" checked="checked">Web Experimentation & Personalization</vscode-radio>
    <vscode-radio value="fer">Feature Experimentation & Rollout</vscode-radio>
  </vscode-radio-group>
              </div>
          </div>
          <div class="next-steps">
              <h2>Next steps</h2>
              <p>Select the workspace you want, then click Configure. You will then need to setup your credentials to configure your account.</p>
              <p>💡 Note that you can still come back to this page and select another workspace.</p>
          </div>
  
          <script nonce="${nonce}" type="text/javascript" src="${scriptUri}"></script>
          
          <div class="useful-links">
            <h2>Useful links</h2>
            <ul id="web-links">
              <li><a href="https://docs.developers.flagship.io/docs/visual-studio-code-abtasty-extension-web-experimentation">👉 Using the Web Experimentation & Personalization</a></li>
              <li><a href="https://app2.abtasty.com/settings/public-api">👉 Retrieving your IDs</a></li>
            </ul>
            <ul id="feature-links" style="display:none;">
              <li><a href="https://docs.developers.flagship.io/docs/visual-studio-code-abtasty-extension-feature-experimentation">👉 Using the Feature Experimentation & Rollout extension</a></li>
              <li><a href="https://flagship.zendesk.com/hc/en-us/articles/4499017687708--Acting-on-your-account-remotely">👉 Retrieving your IDs</a></li>
            </ul>
          </div>
          
          
         <button id="button" class="configure-button">Configure</button>
         <script nonce="${nonce}" type="text/javascript" src="${configureUri}"></script>
      </div>
  </body>
  </html>
      `;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
