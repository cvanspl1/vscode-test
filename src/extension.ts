import * as vscode from "vscode";
const path = require("path");

export function activate(context: vscode.ExtensionContext) {
  const child_process = require("child_process");

  let orange = vscode.window.createOutputChannel("API");
  orange.appendLine("started");
  orange.show();

  let showPath = vscode.commands.registerCommand("troutext.showPath", () => {
    if (vscode.window.activeTextEditor) {
      let currentlyOpenTabfilePath =
        vscode.window.activeTextEditor.document.fileName;

      let line = vscode.window.activeTextEditor.selection.active.line + 1;
      let currentlyOpenTabfileName = path.basename(currentlyOpenTabfilePath);
      orange.appendLine(currentlyOpenTabfilePath + " " + line.toString());
    }
  });

  let quickPing = vscode.commands.registerCommand("troutext.quickPing", () => {
    child_process.exec(
      "curl http://localhost:3000/api/user",
      (err: string, stdout: string, stderr: string) => {
        orange.appendLine(stdout);
        orange.appendLine("stderr: " + stderr);
        if (err) {
          orange.appendLine("error: " + err);
        }
      }
    );
  });

  context.subscriptions.push(showPath, quickPing);
}

export function deactivate() {}
