import { renderTreeView } from "./libs/FileSystemTreeView";

import { FileSystem } from "./libs/FileSystem";
import { AutobahnFS } from "./libs/AutobahnFS";

import { textFiles } from "./libs/TestFiles";

import { WebContainer } from "@webcontainer/api";
import { FitAddon } from "xterm-addon-fit";
import { Terminal } from "xterm";
import { edit } from "ace-builds";

import mime from "mime-types";

// Fonts & themes
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';
import '@fortawesome/fontawesome-free/js/solid';

// This was the only way I could get stuff to load right
import "ace-builds/webpack-resolver";

import css from "./index.module.css";

console.log("INFO: Initializing core...");

const queryString: string = window.location.search;
const params: URLSearchParams = new URLSearchParams(queryString);

const encoder: TextEncoder = new TextEncoder();
const decoder: TextDecoder = new TextDecoder();

const sidebar: HTMLElement | null = document.getElementById("sidebar");

const editorContainer: HTMLElement | null = document.getElementById("editor");
const termContainer: HTMLElement | null = document.getElementById("terminal");

if (!sidebar) throw new Error("Sidebar not found!");

if (!editorContainer) throw new Error("Editor container not found!");
if (!termContainer) throw new Error("Term container not found!");

const projectNameElement: HTMLSpanElement = sidebar.getElementsByClassName("project-name")[0] as HTMLSpanElement;
const sidebarElements: HTMLDivElement = sidebar.getElementsByClassName("true-elements")[0] as HTMLDivElement;

const folderCreateElement: HTMLElement = document.getElementById("folder-create") as HTMLElement; // TODO: I'm lazy.
const fileCreateElement: HTMLElement = document.getElementById("file-create") as HTMLElement; // TODO: I'm lazy.

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
  // We hit proper initialization!
  let activeFile: string = "";
  let currentSaveTimerState: number = 0;

  async function fileCallback(file: string) {
    console.log("File opened:", file);
    activeFile = "";

    const mimeType: string | false = mime.lookup(file);
    if (mimeType) {
      // Epic hack
      const mode: string = `ace/mode/${mimeType.substring(mimeType.lastIndexOf("/") + 1, mimeType.length)}`;
      editor.setOption("mode", mode);
    } else {
      editor.setOption("mode", "");
    }
    
    const decodedFile: string = decoder.decode(await fs.read(file));
    editor.setValue(decodedFile);
    activeFile = file;
  }

  await fs.init();
  await fs.mkdir("/projects");

  if (!params.get("project")) {
    // TODO: maybe proper UI?
    editor.setValue(textFiles["welcome.txt"]);
    await new Promise((i) => setTimeout(i, 100));

    let projectName: string | null = prompt("Please give a project name:");
    if (projectName == null) return;

    while (!projectName || !(await fs.exists("/projects/" + projectName, "folder"))) {
      if (confirm("Project not found! Would you like to create it?")) {
        await fs.mkdir("/projects/" + projectName);
        break;
      } else {
        const localProjectName: string | null = prompt("Please give a project name:");
        if (localProjectName == null) return;
        if (!localProjectName) continue;
        
        projectName = localProjectName;
      }
    }

    window.location.href += "?project=" + projectName; // FIXME: can be buggy?
    return;
  }

  const project: string = params.get("project") as string; // Already checked it
  if (!(await fs.exists("/projects/" + project, "folder"))) window.location.replace("/");

  // Init base editor
  projectNameElement.innerText = project;

  const treeView = await renderTreeView("/projects/" + project, fs, fileCallback);
  sidebarElements.append(...treeView);

  // Init terminal/container
  term.write("Welcome to Kobold Editor v0.01\r\n - Booting container...");

  const webcontainerInstance = await WebContainer.boot({
    workdirName: "projects"
  });
  
  term.write(" [done]\r\n - Creating file system bridge... ");
  
  // FS/Delayed init tasks
  const autoFS: AutobahnFS = new AutobahnFS(fs, webcontainerInstance.fs);
  await autoFS.sync();
  
  // TODO: sa
  folderCreateElement.addEventListener("click", async() => {
    const folderName = prompt("Where would you like the folder to be created?");
    if (!folderName) return;

    const mkdirResult: void | boolean = await autoFS.mkdir(`/projects/${project}/${folderName}`).catch((e: Error) => {
      console.error(e);
      alert(e.message);

      return true;
    });
    
    if (mkdirResult) return;

    sidebarElements.textContent = "";
      
    const treeView = await renderTreeView("/projects/" + project, fs, fileCallback);
    sidebarElements.append(...treeView);
  });

  fileCreateElement.addEventListener("click", async() => {
    const fileName = prompt("Where would you like the file to be created?");
    if (!fileName) return;

    const createResult: void | boolean = await autoFS.write(`/projects/${project}/${fileName}`, new Uint8Array(0)).catch((e: Error) => {
      console.error(e);
      alert(e.message);

      return true;
    });

    if (createResult) return;

    sidebarElements.textContent = "";
      
    const treeView = await renderTreeView("/projects/" + project, fs, fileCallback);
    sidebarElements.append(...treeView);
  });

  await webcontainerInstance.fs.writeFile(".jshrc.sh", `cd "/home/projects/${project}/"\njsh`);

  term.write(" [done]\r\n");

  // Configure our terminal

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

  // Configure the text editor

  function saveTimer(): void {
    if (currentSaveTimerState != 0) currentSaveTimerState -= 100;
    if (currentSaveTimerState < 0) currentSaveTimerState = 0;
    
    setTimeout(saveTimer, 100);
  }
  
  editor.on("change", async() => {
    currentSaveTimerState = 2000;

    if (activeFile && currentSaveTimerState == 0) {
      console.log("Saving changes...");

      const text: string = editor.getValue();
      await autoFS.write(activeFile, encoder.encode(text));
    }
  });

  saveTimer();
}

main();