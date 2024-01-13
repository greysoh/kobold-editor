import { FileSystem } from "./libs/FileSystem";

import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { edit } from "ace-builds";

console.log("INFO: Initializing core...");

const editorContainer: HTMLElement | null = document.getElementById("editor");
if (!editorContainer) throw new Error("App container not found!");

const editor = edit("editor", {
  value: "const test123 = 'Hello, world!';"
});

const fs = new FileSystem("koboldfs");

async function main() {
  await fs.init();
}

main();