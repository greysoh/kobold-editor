import localForage from "localforage";

// TODO: change to interface? I should learn the difference sometime
type FileSystemDataBlock = {
  type: "file",
  path: string,
  data: Uint8Array
}

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
  private localFileSystemEntries: FileSystemDataBlock[];

  public hasInitialized: boolean;

  constructor(fileSystemName: string) {
    this.localFileSystemEntries = [];

    this.fileSystemName = fileSystemName;
    this.hasInitialized = false;

    this.localWorkingCopy = {
      nodes: [
        {
          type: "folder",
          path: "/"
        }
      ],

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

  async read(fileName: string): Promise<Uint8Array> {
    const entry: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == fileName);
    if (!entry) throw new Error("Entry not found");

    if (entry.type == "folder") throw new Error("Not a file!");

    // Attempt to do a cache hit first
    const attemptedCacheHit: FileSystemDataBlock | undefined = this.localFileSystemEntries.find((i) => i.path == fileName);
    
    if (attemptedCacheHit) {
      // Success!
      return attemptedCacheHit.data;
    } else {
      // Fine, we do a lookup in the real DB...
      const localData: Uint8Array | null = await localForage.getItem(this.fileSystemName + "_" + fileName);
      
      if (!localData) throw new Error("WTF? File should exist in true storage, but doesn't!");
      else if (!(localData instanceof Uint8Array)) throw new Error("WTF? File on disk is incorrect data type");

      // Now, let's put this in the bag
      this.localFileSystemEntries.push({
        type: "file",
        path: fileName,
        data: localData
      });

      return localData;
    }
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

  /**
   * This syncs the 
   */
  async syncToDisk(): Promise<void> {

  }
}