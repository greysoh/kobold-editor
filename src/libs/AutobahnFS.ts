import type { FileSystem, FileSystemNode } from "./FileSystem";
import type { FileSystemAPI } from "@webcontainer/api";

export class AutobahnFS {
  trueFS: FileSystem;
  webcontainerFS: FileSystemAPI;

  constructor(trueFS: FileSystem, webcFS: FileSystemAPI) {
    this.trueFS = trueFS;
    this.webcontainerFS = webcFS;
  }

  async read(fileName: string): Promise<Uint8Array> {
    return await this.trueFS.read(fileName);
  }

  async write(fileName: string, contents: Uint8Array): Promise<void> {
    await this.trueFS.write(fileName, contents);
    await this.webcontainerFS.writeFile(fileName, contents);
  }

  async mkdir(dirName: string): Promise<void> {
    await this.trueFS.mkdir(dirName);
    await this.webcontainerFS.mkdir(dirName);
  }

  async rm(fileName: string): Promise<void> {
    await this.trueFS.rm(fileName);
    await this.webcontainerFS.rm(fileName);
  }

  async ls(dirName: string, includeFiles?: boolean): Promise<FileSystemNode[]> {
    return await this.trueFS.ls(dirName, includeFiles);
  }

  async sync(directory: string = "/"): Promise<void> {
    for (const entry of await this.trueFS.ls(directory, true)) {
      if (directory == entry.path) continue;

      if (entry.type == "folder") {
        try {
          await this.webcontainerFS.mkdir(entry.path);
        } catch (e) {
          console.error("huh");
          console.error(e);
        }

        await this.sync(entry.path);
      } else if (entry.type == "file") {
        const fileContents: Uint8Array = await this.trueFS.read(entry.path);
        
        try {
          await this.webcontainerFS.writeFile(entry.path, fileContents);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}