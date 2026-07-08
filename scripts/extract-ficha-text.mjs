// Extrae el texto de las fichas técnicas PDF con el MISMO pdf.js del front
// (misma lógica que src/app/services/fichaPdf.ts) y lo guarda como fixtures
// para los tests del parser. Uso:
//   node scripts/extract-ficha-text.mjs "<carpeta-con-pdfs>"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const PAGE_BREAK = "\f";
const srcDir = process.argv[2];
const outDir = fileURLToPath(new URL("../src/app/services/__tests__/fixtures/", import.meta.url));

if (!srcDir) {
  console.error("Uso: node scripts/extract-ficha-text.mjs <carpeta-con-pdfs>");
  process.exit(1);
}

// Misma lógica de extracción que extractPdfText en fichaPdf.ts.
async function extractText(data) {
  const task = getDocument({ data: new Uint8Array(data) });
  const doc = await task.promise;
  try {
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if ("str" in item) {
          text += item.str;
          text += item.hasEOL ? "\n" : " ";
        }
      }
      pages.push(text);
    }
    return pages.join(`\n${PAGE_BREAK}\n`);
  } finally {
    await task.destroy();
  }
}

await mkdir(outDir, { recursive: true });
const files = (await readdir(srcDir)).filter((f) => f.toLowerCase().endsWith(".pdf"));
for (const file of files) {
  const data = await readFile(join(srcDir, file));
  const text = await extractText(data);
  const id = /\((\d+)\)/.exec(file)?.[1] ?? basename(file, ".pdf");
  const out = join(outDir, `ficha-${id}.txt`);
  await writeFile(out, text, "utf-8");
  console.log(`${file} -> ficha-${id}.txt (${text.length} chars)`);
}
