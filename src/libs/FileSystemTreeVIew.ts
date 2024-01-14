import type { FileSystem, FileSystemNode } from "./FileSystem";

export async function renderTreeView(directory: string, fs: FileSystem, fileOpenCallback: Function, offset: string = ""): Promise<HTMLElement[]> {
  const elements: HTMLElement[] = [];
  const filesAndFolders: FileSystemNode[] = await fs.ls(directory, true);

  // Folders first!
  for (const folderEntry of filesAndFolders.filter((i) => i.type == "folder")) {
    // I'm sorry.
    // TODO: This is real nasty!

    const realTextElement: HTMLSpanElement = document.createElement("span");
    const spaceElement: HTMLSpanElement = document.createElement("span");
    const innerElements: HTMLDivElement = document.createElement("div");
    const rootElement: HTMLSpanElement = document.createElement("span");
    const iconElement: HTMLElement = document.createElement("i");
    
    const trueFolderName: string = folderEntry.path.substring(folderEntry.path.lastIndexOf("/") + 1, folderEntry.path.length);
    if (trueFolderName == "") continue;

    spaceElement.innerText = offset;
    iconElement.className = "clickable fa-solid fa-folder";
    
    realTextElement.innerText = trueFolderName;
    rootElement.className = "clickable";

    rootElement.appendChild(spaceElement);
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
        iconElement.className = "clickable fa-solid fa-folder";
        innerElements.style.display = "initial";
        const elements = await renderTreeView(directory, fs, fileOpenCallback, offset + "&nbsp;");

        innerElements.append(...elements);
      }
    });

    elements.push(rootElement, innerElements);
  }

  for (const fileEntry of filesAndFolders.filter((i) => i.type == "file")) {
    const rootElement: HTMLSpanElement = document.createElement("span");
    rootElement.className = "clickable";

    rootElement.innerText = offset + fileEntry.path.substring(fileEntry.path.lastIndexOf("/") + 1, fileEntry.path.length);
    
    rootElement.addEventListener("click", () => {
      fileOpenCallback(fileEntry.path);
    });

    elements.push(rootElement);
  }

  return elements;
}