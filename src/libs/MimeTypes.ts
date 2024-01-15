const mimeList = {
  "ts": "typescript",
  "tsx": "typescript",

  "js": "javascript",
  "mjs": "javascript",
  "jsx": "javascript",

  "json": "json",
  
  "css": "css",
  "html": "html",

  "rs": "rust",
  "py": "python",

  "cpp": "c++",
  "hpp": "c++",

  "c": "c",
  "h": "c"
}

export function lookup(file: string): string | false {
  // FIXME: Make typescript actually happy instead of this madness
  // @ts-ignore
  return mimeList[file.substring(file.lastIndexOf(".") + 1, file.length)] ?? false;
}