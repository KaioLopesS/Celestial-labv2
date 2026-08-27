import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "C:/Users/User/Desktop/celestial-labv1/.deck_build/remove_footers_v1";
const starter = `${workspace}/template-starter.pptx`;
const output = "C:/Users/User/Desktop/celestial-labv1/Aula_Gases_Ideais_Termodinamica_80min_exercicios_simplificados_sem_rodapes.pptx";
const renderDir = `${workspace}/final-render`;
const layoutDir = `${workspace}/final-layout/final`;

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

const presentation = await PresentationFile.importPptx(await FileBlob.load(starter));

let cleared = 0;
for (const [index, slide] of presentation.slides.items.entries()) {
  const footer = slide.shapes.items.find((shape) => shape.name === "source-footer");
  if (index === 0) {
    if (footer) throw new Error("Slide 1 unexpectedly contains source-footer");
    continue;
  }
  if (!footer) throw new Error(`source-footer not found on slide ${index + 1}`);
  footer.text = "";
  cleared += 1;
}

if (cleared !== 17) throw new Error(`Expected 17 cleared footers, received ${cleared}`);

await fs.mkdir(renderDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (let i = 0; i < presentation.slides.items.length; i += 1) {
  const slide = presentation.slides.getItem(i);
  const stem = `slide-${String(i + 1).padStart(2, "0")}`;
  await writeBlob(`${renderDir}/${stem}.png`, await presentation.export({ slide, format: "png", scale: 1 }));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${layoutDir}/${stem}.layout.json`, await layout.text(), "utf8");
}

await writeBlob(`${workspace}/final-montage.webp`, await presentation.export({ format: "webp", montage: true, scale: 1 }));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 120000,
});
await fs.writeFile(`${workspace}/final-inspect.ndjson`, inspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);
console.log(JSON.stringify({ output, slides: presentation.slides.items.length, cleared }, null, 2));
