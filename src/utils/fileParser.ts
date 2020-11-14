const util = require('util');
const path = require('path');
const fs = require('fs');
import { workspace, Uri } from 'vscode';

interface File {
  path: string;
  contents: string;
};

interface Router {
  name: string;
  path: string;
  contents: string;
  baseRoute: string;
}

class FileParser {
  codeFiles: Array<string>;
  serverFile: File;
  serverImport: string;
  serverName: string;
  routers: Array<Router>;

  constructor() {
    this.codeFiles = this.findCodeFiles(workspace.rootPath);
    this.serverFile = this.findServerFile();
    this.serverImport = this.findServerImport();
    this.serverName = this.findServerName();
    this.routers = this.findRouters();
    for (let i = 0; i < this.routers.length; i++) {
      this.routers[i].path = this.findRouterPath(this.routers[i]);
      this.routers[i].contents = this.parseRouterFile(this.routers[i]);
    }
    console.log("SERVER FILE: ", this.serverFile);
    console.log("EXPRESS IMPORT NAME: ", this.serverImport);
    console.log("EXPRESS SERVER NAME: ", this.serverName);
    console.log("ROUTERS: ", this.routers);
  }

  // Find all javascript/typescript files in the workspace
  findCodeFiles(dir: string | undefined) {
    // Handle case where no workspace is open
    if (dir === undefined) { return []; }
    let codeFiles : Array<string> = [];
    // Read all files/folders in the specified directory
    const dirContents: any = fs.readdirSync(dir);
    // Loop through each item in the current directory
    let files = dirContents.map((content: string) => {
      // Ignore the node_modules folder
      if (content === 'node_modules') { return ''; }
      let resource = path.resolve(dir, content);
      // If a folder, find the files within, otherwise store the file name
      return fs.statSync(resource).isDirectory() ? this.findCodeFiles(resource) : resource;
    });
    // Flatten the array of files
    files = files.flat(Infinity);
    // Reduce the list down to only javascript/typescript files
    files.forEach((file: string) => {
      if(file.match(/.*\.(js|ts)$/)) {
        codeFiles.push(file);
      }
    });
    return codeFiles;
  }

  // Find the file in the user's workspace that contains their express server
  findServerFile() {
    for (let i = 0; i < this.codeFiles.length; i++) {
      const file = this.codeFiles[i];
      // Read the contents of each code file
      const data = fs.readFileSync(file, { encoding:'utf8', flag:'r' });
      // Search the code file for an express import statement
      const serverImport = data.match(/[\s\S]*?(\S+)\s*=\s*require\s*\(\s*['"`]express['"`]\s*\)[\s\S]*?/);
      if(serverImport !== null) {
        const serverInit = data.match(new RegExp('(\\S+)\\s*=\\s*' + serverImport[1] + '\\(\\)'));
        // Return the server file if found
        if(serverInit !== null) {
          return { contents: data, path: file };
        }
      }
    }
    // Return an empty object if there is no server file
    return { contents: '', path: '' };
  }

  findServerImport() {
    const lines = this.serverFile.contents.split('\n');
    for(let i = 0; i < lines.length; i++) {
      const server = lines[i].match(/(\S+)\s*=\s*require\s*\(\s*['"`]express['"`]\s*\)/);
      if(server !== null) { return server[1]; }
    }
    return '';
  }

  findServerName() {
    const serverPattern = new RegExp('(\\S+)\\s*=\\s*' + this.serverImport + '\\(\\)');
    const lines = this.serverFile.contents.split('\n');
    for(let i = 0; i < lines.length; i++) {
      const server = lines[i].match(serverPattern);
      if(server !== null) { return server[1]; }
    }
    return '';
  }

  findRouters() {
    const routers : Array<Router> = [];
    const routerPattern = new RegExp(this.serverName + '\\.use\\([\'"`](\\S+)[\'"`],\\s*(\\S+)\\)');
    const lines = this.serverFile.contents.split('\n');
    for(let i = 0; i < lines.length; i++) {
      const router = lines[i].match(routerPattern);
      if(router !== null) { routers.push({name: router[2], path: '', contents: '', baseRoute: router[1] });}
    }
    return routers;
  }

  findRouterPath(router: Router) {
    const pathPattern = new RegExp(router.name + '\\s*=\\s*require\\((.+)\\)');
    const lines = this.serverFile.contents.split('\n');
    for(let i = 0; i < lines.length; i++) {
      const path = lines[i].match(pathPattern);
      if(path !== null) {
        const relativePath = lines[i].match(/path\.join\(__dirname,\s*['"`](.*)['"`]\)/);
        if (relativePath !== null) { 
          const serverDirectory = this.serverFile.path.match(/(.*\/)/);
          if (serverDirectory !== null) {
            return serverDirectory[1].concat(relativePath[1]); 
          }
        }
        else { return path[1]; }
      } 
    }
    return '';
  }

  parseRouterFile(router: Router) {
    console.log(router.path);
    if (fs.existsSync(router.path)) {
      return fs.readFileSync(router.path, { encoding:'utf8', flag:'r' });
    }
    return '';
  }
};

export default FileParser;