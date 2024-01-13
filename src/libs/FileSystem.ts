import localForage from "localforage";

// TODO: change to interface? I should learn the difference sometime
type FileSystemDataBlock = {
  type: "file",
  path: string,
  data: Uint8Array
}

type FileSystemNode = {
  type: "file" | "folder",
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

const fsLocks: string[] = [];

export class FileSystem {
  private fileSystemName: string;
  private localWorkingCopy: FileSystemStruct;
  private localFileSystemEntries: FileSystemDataBlock[];

  public hasInitialized: boolean;

  constructor(fileSystemName: string) {
    if (fsLocks.find((i: string) => fileSystemName == i)) {
      throw new Error("Filesystem already mounted");
    }

    fsLocks.push(fileSystemName);

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
    const entry: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == fileName && i.type == "file");
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

  async write(fileName: string, contents: Uint8Array): Promise<void> {
    const entry: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == fileName && i.type == "file");
    
    if (!entry) {
      const entryAsFolder: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == fileName && i.type == "folder");
      if (entryAsFolder) throw new Error("File as folder already exists!");

      const folderName: string = fileName.substring(0, fileName.lastIndexOf("/"));
      const parentFolder: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == folderName && i.type == "folder");

      if (!parentFolder) throw new Error("Parent folder missing!");

      this.localWorkingCopy.nodes.push({
        type: "file",
        path: fileName
      });
      
      await this.syncToDisk();
    }

    localForage.setItem(this.fileSystemName + "_" + fileName, contents);

    const attemptedCacheHit: FileSystemDataBlock | undefined = this.localFileSystemEntries.find((i) => i.path == fileName);
    if (attemptedCacheHit) {
      const cacheIndex: number = this.localFileSystemEntries.indexOf(attemptedCacheHit);
      
      this.localFileSystemEntries.splice(cacheIndex, 1);
      this.localFileSystemEntries.push({
        type: "file",
        path: fileName,
        data: contents
      });
    }
  }

  async mkdir(dirName: string): Promise<void> {
    await this.syncToDisk();
  }

  async rm(fileName: string): Promise<void> {
    // TODO: We only use entry for checking. Maybe change into a better way?
    const entry: FileSystemNode | undefined = this.localWorkingCopy.nodes.find((i: FileSystemNode) => i.path == fileName);
    if (!entry) throw new Error("Entry not found");

    const allOtherEntries: FileSystemNode[] = this.localWorkingCopy.nodes.filter((i: FileSystemNode) => i.path.startsWith(fileName));

    for (const entry of allOtherEntries) {
      const entryIndex: number = this.localWorkingCopy.nodes.indexOf(entry);
      this.localWorkingCopy.nodes.splice(entryIndex, 1);

      if (entry.type == "file") {
        // There's a lot more clean up work involved for files
        const attemptedCacheHit: FileSystemDataBlock | undefined = this.localFileSystemEntries.find((i) => i.path == fileName);

        if (attemptedCacheHit) {
          const cacheIndex: number = this.localFileSystemEntries.indexOf(attemptedCacheHit);
          this.localFileSystemEntries.splice(cacheIndex, 1);
        }

        await localForage.removeItem(this.fileSystemName + "_" + fileName);
      }
    }
  }
  
  async ls(dirName: string, includeFiles?: boolean): Promise<FileSystemNode[]> {
    const allOtherEntries: FileSystemNode[] = this.localWorkingCopy.nodes.filter((i: FileSystemNode) => i.path.startsWith(dirName) && (includeFiles ? true : i.type == "folder"));
    return allOtherEntries;
  }

  /**
   * This syncs the current data to disk
   */
  async syncToDisk(): Promise<void> {
    await localForage.setItem(this.fileSystemName, this.localWorkingCopy);
  }
}