import { FileSystem } from "./libs/FileSystem";

import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { edit } from "ace-builds";

import css from "./index.module.css";

console.log("INFO: Initializing core...");

const editorContainer: HTMLElement | null = document.getElementById("editor");
const termContainer: HTMLElement | null = document.getElementById("terminal");

if (!editorContainer) throw new Error("Editor container not found!");
if (!termContainer) throw new Error("Term container not found!");

editorContainer.className = css.editor;
termContainer.className = css.terminal;

const editor = edit("editor", {
  value: "const test123 = 'Hello, world!';"
});

const term = new Terminal();
term.open(document.getElementById("terminal") as HTMLElement); // TODO: Nuh uh

editor.setAutoScrollEditorIntoView(true);
const fs = new FileSystem("koboldfs");

async function main() {
  await fs.init();
  await fs.mkdir("/projects");
}

main();