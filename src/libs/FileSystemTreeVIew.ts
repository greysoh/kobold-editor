import type { FileSystem, FileSystemNode } from "./FileSystem";

export async function renderTreeView(originalDirectory: string, fs: FileSystem, fileOpenCallback: Function, offset: string = "&nbsp;"): Promise<HTMLElement[]> {
  const elements: HTMLElement[] = [];
  const directory: string = originalDirectory.endsWith("/") ? originalDirectory.substring(0, originalDirectory.length - 1) : originalDirectory;

  const filesAndFolders: FileSystemNode[] = await fs.ls(directory, true);

  // Folders first!
  for (const folderEntry of filesAndFolders.filter((i) => i.type == "folder")) {
    if (folderEntry.path == directory || folderEntry.path == directory + "/") continue;
    
    const folderCheckString: string = folderEntry.path.substring(0, folderEntry.path.lastIndexOf("/", folderEntry.path.length - 2));
    if (folderCheckString != directory) continue;

    const trueFolderName: string = folderEntry.path.substring(folderEntry.path.lastIndexOf("/", folderEntry.path.length - 2) + 1, folderEntry.path.length);
    if (trueFolderName == "") continue;

    const realTextElement: HTMLSpanElement = document.createElement("span");
    const innerElements: HTMLDivElement = document.createElement("div");
    const rootElement: HTMLSpanElement = document.createElement("span");
    const iconElement: HTMLElement = document.createElement("i");

    iconElement.className = "fa-solid fa-folder";
    
    realTextElement.innerHTML = offset;
    realTextElement.innerText += trueFolderName;
    
    rootElement.className = "clickable kobold-fs-item fontawesome-i2svg-active";

    rootElement.appendChild(iconElement);
    rootElement.appendChild(realTextElement);

    innerElements.style.display = "none";

    rootElement.addEventListener("click", async(): Promise<void> => {
      const isOpened: boolean = innerElements.childNodes.length > 1;

      if (isOpened) {
        iconElement.className = "fa-solid fa-folder-open";
        
        // Remove all elements faster (if stack overflow isn't lying)
        innerElements.textContent = "";
        innerElements.style.display = "none";
      } else {
        const elements = await renderTreeView(folderEntry.path, fs, fileOpenCallback, offset + "&nbsp;&nbsp;&nbsp;&nbsp;");
        if (elements.length == 0) return;

        iconElement.className = "clickable fa-solid fa-folder";
        innerElements.style.display = "initial";

        innerElements.append(document.createElement("br"), ...elements.slice(0, elements.length-1));
      }
    });

    elements.push(rootElement, innerElements, document.createElement("br"));
  }

  for (const fileEntry of filesAndFolders.filter((i) => i.type == "file")) {
    if (fileEntry.path.substring(0, fileEntry.path.lastIndexOf("/")) != directory) continue;

    const rootElement: HTMLSpanElement = document.createElement("span");
    rootElement.className = "clickable kobold-fs-item";

    rootElement.innerHTML = offset;
    rootElement.innerText += fileEntry.path.substring(fileEntry.path.lastIndexOf("/") + 1, fileEntry.path.length);
    
    rootElement.addEventListener("click", () => {
      fileOpenCallback(fileEntry.path);
    });

    elements.push(rootElement, document.createElement("br"));
  }

  return elements;
}