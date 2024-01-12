import localForage from "localforage";

// TODO: change to interface? I should learn the difference sometime
type FileSystemNode = {
  type: "file" | "folder",
  data?: Uint8Array,
  path: string,
}

type FileSystemTelemetry = {
  vendor: string,
  fsRelease: string | number;
}

type FileSystemStruct = {
  nodes: FileSystemNode[],
  version: number,

  telemetry?: FileSystemTelemetry
}

export class FileSystem {
  private fileSystemName: string;
  private localWorkingCopy: FileSystemStruct;

  public hasInitialized: boolean;

  constructor(fileSystemName: string) {
    this.fileSystemName = fileSystemName;
    this.hasInitialized = false;

    this.localWorkingCopy = {
      nodes: [],
      version: 0,
      
      telemetry: {
        vendor: "kobold-dev",
        fsRelease: 1_12_24
      }
    };
  }
  
  async init(ignoreVersionErrors?: boolean) {
    if (!this.hasInitialized) throw new Error("Not initialized!");

    try {
      const localEntry: FileSystemStruct = await localForage.getItem(this.fileSystemName) as FileSystemStruct;
      if (localEntry.version > this.localWorkingCopy.version && !ignoreVersionErrors) throw new Error("File system is older than currently supported! Expect things to break!");
      if (localEntry.version < this.localWorkingCopy.version && !ignoreVersionErrors) throw new Error("File system is newer than currently supported! Expect things to break!");

      this.localWorkingCopy = localEntry;
    } catch (e) {
      // Just roll with the template that's there for now
    }

    this.hasInitialized = true;
  }

  // @ts-ignore
  async read(fileName: string): Promise<Uint8Array> {
    
  }

  // @ts-ignore
  async write(fileName: string, contents: Uint8Array): Promise<void> {

  }

  // @ts-ignore
  async mkdir(dirName: string): Promise<void> {

  }

  // @ts-ignore
  async ls(dirName: string): Promise<string[]> {

  }
}