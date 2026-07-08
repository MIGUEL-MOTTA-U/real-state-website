// Extracción de texto de fichas técnicas PDF con pdf.js (solo navegador).
// Este módulo se importa dinámicamente desde el formulario para que pdf.js
// no entre al bundle principal.
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PAGE_BREAK } from "./fichaParser";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extrae el texto de un PDF preservando los saltos de línea que reporta
 * pdf.js y separando páginas con PAGE_BREAK (el parser usa ese separador
 * para distinguir la descripción de la continuación de tags).
 */
export async function extractPdfText(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const pages: string[] = [];
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
    await doc.destroy();
  }
}
