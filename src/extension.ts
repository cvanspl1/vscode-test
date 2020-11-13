"use strict";
import { ExtensionContext, workspace, window, commands } from "vscode";
import { existsSync, mkdir, writeFile, readFile } from "fs";
import axios from "axios";
import * as utils from "./utils/utils";

export async function activate(context: ExtensionContext) {
  const { rootPath } = workspace;

  /**
   * create .resti folder & endpoints.json if none exists
   */
  if (!existsSync(rootPath + "/.resti")) {
    mkdir(rootPath + "/.resti", (err) => {
      if (err) return err;
      writeFile(
        rootPath + "/.resti/endpoints.json",
        JSON.stringify([]),
        (err) => {
          if (err) {
            return console.error("File write error:", err);
          }
        }
      );
    });
  }

  /**
   * init output window
   */
  const outputWindow = window.createOutputChannel("Rest{i}");
  outputWindow.appendLine("---Rest{i} initialized---");

  let quickPing = commands.registerCommand("resti.quickPing", () => {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) return;
    
    const document = activeEditor.document;
    const selection = activeEditor.selection.active;
    const endPoint = document.lineAt(selection.line).text.match(/"(\S*)"/)![1];
    const url = `http://localhost:3000/api${endPoint}`;

    /**
     * Attempt to resolve. todo: need to add timeout and send fail state if no response
     */
    axios({
      method: "get",
      url,
      headers: {},
    }).then((data) => {
      // writes inline decorative text
      utils.addDeco(
        data.statusText,
        selection.line,
        document.lineAt(selection).range.end.character,
        activeEditor
      );
    });
    
    /**
     * Update endpoints file
     */
    let info = {
      path: document.fileName,
      uri: endPoint,
      line: selection.line,
    };

    readFile(rootPath + "/.resti/endpoints.json", (err, data) => {
      if (err) {
        return console.error(err);
      }

      let temp = JSON.parse(data.toString());
      temp.push(info);

      writeFile(
        rootPath + "/.resti/endpoints.json",
        JSON.stringify(temp),
        (err) => {
          if (err) return console.error("File write error:", err);
        }
      );
    });
  });
  context.subscriptions.push(quickPing);
}
export function deactivate() {}
