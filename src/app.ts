import { renderTreeView } from "./libs/FileSystemTreeVIew";

import { FileSystem } from "./libs/FileSystem";
import { AutobahnFS } from "./libs/AutobahnFS";

import { WebContainer } from "@webcontainer/api";
import { FitAddon } from "xterm-addon-fit";
import { Terminal } from "xterm";
import { edit } from "ace-builds";

import css from "./index.module.css";
import 'ace-builds/src-noconflict/theme-dracula';

console.log("INFO: Initializing core...");

const queryString: string = window.location.search;
const params: URLSearchParams = new URLSearchParams(queryString);

const sidebar: HTMLElement | null = document.getElementById("sidebar");

const editorContainer: HTMLElement | null = document.getElementById("editor");
const termContainer: HTMLElement | null = document.getElementById("terminal");

if (!sidebar) throw new Error("Sidebar not found!");

if (!editorContainer) throw new Error("Editor container not found!");
if (!termContainer) throw new Error("Term container not found!");

const projectNameElement: HTMLSpanElement = sidebar.getElementsByClassName("project-name")[0] as HTMLSpanElement;
const sidebarElements: HTMLDivElement = sidebar.getElementsByClassName("true-elements")[0] as HTMLDivElement;

if (!projectNameElement) throw new Error("Project name element not found!");
if (!sidebarElements) throw new Error("Sidebar elements not found!");

sidebar.className = css.sidebar;

editorContainer.className = css.editor;
termContainer.className = css.terminal;

const editor = edit("editor", {
  theme: "ace/theme/dracula"
});

const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById("terminal") as HTMLElement); // TODO: Nuh uh
fitAddon.fit();

editor.setAutoScrollEditorIntoView(true);
const fs = new FileSystem("koboldfs");

async function main() {
  await fs.init();
  await fs.mkdir("/projects");

  if (!params.get("project")) {
    // TODO: maybe proper UI?
    let projectName: string | null = prompt("Please give a project name:");

    while (!projectName || !(await fs.exists("/projects/" + projectName, "folder"))) {
      if (confirm("Project not found! Would you like to create it?")) {
        await fs.mkdir("/projects/" + projectName);
        break;
      } else {
        const localProjectName: string | null = prompt("Please give a project name:");
        if (!localProjectName) continue;
        
        projectName = localProjectName;
      }
    }

    window.location.href += "?project=" + projectName; // TODO: can be buggy?
    return;
  }

  const project: string = params.get("project") as string; // Already checked it
  if (!(await fs.exists("/projects/" + project, "folder"))) window.location.replace("/");

  // Init editor
  projectNameElement.innerText = project;

  const treeView = await renderTreeView("/projects/" + project, fs, (file: string) => {
    console.log("File opened:", file);
  });

  sidebarElements.append(...treeView);

  term.write("Welcome to Kobold Editor v0.01\r\n - Booting container...");

  const webcontainerInstance = await WebContainer.boot({
    workdirName: "projects"
  });
  
  term.write(" [done]\r\n - Creating file system bridge... ");
  
  const autoFS: AutobahnFS = new AutobahnFS(fs, webcontainerInstance.fs);
  await autoFS.sync();

  await webcontainerInstance.fs.writeFile(".jshrc.sh", `cd "/home/projects/${project}/"\njsh`);

  term.write("[done]\r\n");

  const shellProcess = await webcontainerInstance.spawn("jsh", ["/home/projects/.jshrc.sh"]);
  const input = shellProcess.input.getWriter();

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        term.write(data);
      },
    })
  );

  term.onData((data) => {
    input.write(data);
  });
}

main();