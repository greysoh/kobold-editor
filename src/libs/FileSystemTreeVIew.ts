import type { FileSystem, FileSystemNode } from "./FileSystem";

export async function renderTreeView(directory: string, fs: FileSystem, fileOpenCallback: Function, offset: string = ""): Promise<HTMLElement[]> {
  const elements: HTMLElement[] = [];
  const filesAndFolders: FileSystemNode[] = await fs.ls(directory, true);

  // Folders first!
  for (const folderEntry of filesAndFolders.filter((i) => i.type == "folder")) {
    const innerElements: HTMLDivElement = document.createElement("div");
    const rootElement: HTMLSpanElement = document.createElement("span");
    
    const trueFolderName: string = folderEntry.path.substring(folderEntry.path.lastIndexOf("/") + 1, folderEntry.path.length);
    if (trueFolderName == "") continue;
    
    rootElement.innerText = offset + "📁 " + trueFolderName;
    innerElements.style.display = "none";

    rootElement.addEventListener("click", async(): Promise<void> => {
      const isOpened: boolean = innerElements.childNodes.length > 1;

      if (isOpened) {
        rootElement.innerText = rootElement.innerText.replace("↓", "📁");
        innerElements.textContent = "";
        innerElements.style.display = "none";
      } else {
        rootElement.innerText = rootElement.innerText.replace("📁", "↓");
        innerElements.style.display = "initial";
        const elements = await renderTreeView(directory, fs, fileOpenCallback, offset + "  ");

        innerElements.append(...elements);
      }
    });

    elements.push(rootElement, innerElements);
  }

  for (const fileEntry of filesAndFolders.filter((i) => i.type == "file")) {
    const rootElement: HTMLSpanElement = document.createElement("span");
    rootElement.innerText = offset + fileEntry.path.substring(fileEntry.path.lastIndexOf("/") + 1, fileEntry.path.length);
    
    rootElement.addEventListener("click", () => {
      fileOpenCallback(fileEntry.path);
    });

    elements.push(rootElement);
  }

  return elements;
}