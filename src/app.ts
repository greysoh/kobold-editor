// TypeScript code
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import * as ace from 'ace-builds';

import { FileSystem } from "./libs/FileSystem";

console.log("INFO: Initializing core...");

const editorContainer: HTMLElement | null = document.getElementById("editor");
if (!editorContainer) throw new Error("App container not found!");

const editor = ace.edit("editor", {
  value: "const test123 = 'Hello, world!';"
});

const fs = new FileSystem("fs");