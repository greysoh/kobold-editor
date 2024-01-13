import type { FileSystem } from "./FileSystem";

const encode = new TextEncoder();
const decode = new TextDecoder();

export async function testFileSystem(fs: FileSystem) {
  console.log("INFO: Testing persistance (also early dir list)");
  console.log(await fs.ls("/", true));

  console.log("INFO: Testing write...");
  await fs.write("/test.txt", encode.encode("Hello, world!"));
  
  console.log("INFO: Testing read...");
  console.log(decode.decode(await fs.read("/test.txt")));

  console.log("INFO: Testing mkdir...");
  console.log(await fs.mkdir("/kobold"));

  console.log("INFO: Testing directory listing...");
  console.log(await fs.ls("/", true));

  console.log("INFO: Testing writing in subdirectory...");
  console.log(await fs.write("/kobold/test.txt", encode.encode("Hello, world (in /kobold)!")));

  console.log("INFO: Testing read in subdirectory...");
  console.log(decode.decode(await fs.read("/kobold/test.txt")));

  console.log("INFO: Testing rm...");
  console.log(await fs.rm("/test.txt"));

  console.log("INFO: Testing directory listing...");
  console.log(await fs.ls("/", true));
}
