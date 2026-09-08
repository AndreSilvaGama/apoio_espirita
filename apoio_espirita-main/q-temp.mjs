import { readFile } from "node:fs/promises";
const arq = process.argv[2];
const texto = (await readFile(arq, "utf8")).replace(/\s+/g, " ");
for (const n of process.argv.slice(3)) {
  const idx = texto.indexOf(" " + n + ". ");
  console.log("\n=== " + n + " === (idx " + idx + ")");
  if (idx >= 0) console.log(texto.slice(idx, idx + 480));
}
