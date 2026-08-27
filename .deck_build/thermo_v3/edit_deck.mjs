import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "C:/Users/User/Desktop/celestial-labv1/.deck_build/thermo_v3";
const starter = `${workspace}/template-starter.pptx`;
const output = "C:/Users/User/Desktop/celestial-labv1/Aula_Gases_Ideais_Termodinamica_80min_animacoes_incorporadas.pptx";
const renderDir = `${workspace}/final-render`;
const layoutDir = `${workspace}/final-layout/final`;
const animation1 = `${workspace}/animacao1_embutida.gif`;
const animation2 = `${workspace}/animacao2_embutida.gif`;

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function getShape(slide, name) {
  const shape = slide.shapes.items.find((item) => item.name === name);
  if (!shape) throw new Error(`Shape '${name}' not found`);
  return shape;
}

function setText(slide, name, text) {
  getShape(slide, name).text = text;
}

function setPage(slide, shapeName, page) {
  setText(slide, shapeName, String(page).padStart(2, "0"));
}

function ensureBlankLabels(slide) {
  for (const name of ["eyebrow", "source-footer"]) {
    const shape = slide.shapes.items.find((item) => item.name === name);
    if (shape) shape.text = "";
  }
}

async function replaceOnlyImageWithGif(slide, imagePath, alt, position) {
  if (slide.images.items.length !== 1) {
    throw new Error(`Expected exactly one image, found ${slide.images.items.length}`);
  }
  slide.images.items[0].delete();
  const bytes = new Uint8Array(await fs.readFile(imagePath));
  slide.images.add({
    blob: bytes,
    contentType: "image/gif",
    alt,
    fit: "contain",
    position,
    geometry: "roundRect",
    borderRadius: "rounded-xl",
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
  });
}

function setNotes(slide, text) {
  slide.speakerNotes.textFrame.setText(text);
  slide.speakerNotes.setVisible(true);
}

const presentation = await PresentationFile.importPptx(await FileBlob.load(starter));

if (presentation.slides.items.length !== 18) {
  throw new Error(`Expected 18 slides, found ${presentation.slides.items.length}`);
}

// Slide 14 — capa da Primeira Lei e animação 1 no próprio arquivo.
{
  const slide = presentation.slides.getItem(13);
  setText(slide, "cover-eyebrow", "");
  setText(slide, "cover-title", "1ª Lei da\nTermodinâmica");
  setText(slide, "cover-subtitle", "Calor, energia interna e trabalho");
  setText(slide, "cover-kicker", "Observe o sistema: para onde vai a energia que entra?");
  setPage(slide, "text-utgdpr5", 14);
  await replaceOnlyImageWithGif(
    slide,
    animation1,
    "Animação do gás sob um pistão recebendo calor e realizando trabalho",
    { left: 650, top: 183, width: 574, height: 323 },
  );
  setNotes(slide,
    "Tempo: 5 min\n\n" +
    "Condução: Inicie a animação no modo apresentação. Primeiro, delimite o sistema: o gás sob o pistão. Pergunte o que muda quando o calor entra. Ao final, conecte a cena a Q = ΔU + W, sem introduzir nomes de transformações gasosas.\n\n" +
    "[Sources]\n" +
    "- C:/Users/User/Desktop/celestial-labv1/Animacao_1_Primeira_Lei_Termodinamica.mp4\n" +
    "- C:/Users/User/Desktop/Celestial Equations - Códigos/primeira_lei_termodinamica_16x9.py\n" +
    "- https://pt.khanacademy.org/science/chemistry/thermodynamics-chemistry/internal-energy-sal/v/work-from-expansion"
  );
}

// Slide 15 — sistema e três grandezas; apenas ajuste de tempo e condução.
{
  const slide = presentation.slides.getItem(14);
  ensureBlankLabels(slide);
  setPage(slide, "page-12", 15);
  setNotes(slide,
    "Tempo: 4 min\n\n" +
    "Condução: Use o desenho para nomear somente três grandezas. Q é energia transferida por calor; W é energia transferida por trabalho; ΔU é a mudança da energia interna do gás.\n\n" +
    "[Sources]\n" +
    "- https://pt.khanacademy.org/science/chemistry/thermodynamics-chemistry/internal-energy-sal/v/work-from-expansion"
  );
}

// Slide 16 — Primeira Lei com sinais positivos e negativos.
{
  const slide = presentation.slides.getItem(15);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "A convenção de sinais completa a 1ª Lei");
  setText(slide, "text-3n7bmqn", "Q < 0: calor sai do sistema.");
  setText(slide, "text-5g2b4um", "W < 0: trabalho realizado sobre o gás.");
  setPage(slide, "page-13", 16);
  setNotes(slide,
    "Tempo: 5 min\n\n" +
    "Condução: Leia Q = ΔU + W em voz alta. Nesta convenção, W é o trabalho realizado pelo gás. Portanto: Q > 0 quando o calor entra; Q < 0 quando sai; W > 0 quando o gás realiza trabalho; W < 0 quando o trabalho é realizado sobre o gás. ΔU é positivo quando a energia interna aumenta e negativo quando diminui.\n\n" +
    "[Sources]\n" +
    "- https://pt.khanacademy.org/science/chemistry/thermodynamics-chemistry/internal-energy-sal/v/work-from-expansion"
  );
}

// Slide 17 — compressão com a animação 2 revisada e incorporada.
{
  const slide = presentation.slides.getItem(16);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Compressão: trabalho realizado sobre o gás");
  setText(slide, "text-0h7s5jw", "Observe a compressão");
  setText(slide, "text-7vayxig", "O pistão desce e as partículas se agitam mais.");
  setText(slide, "text-dy89sif", "Convenção desta aula");
  setText(slide, "text-y09sok9", "W < 0: trabalho realizado sobre o gás.");
  setText(slide, "text-ce347ry", "O sinal negativo registra o sentido da transferência de energia.");
  setPage(slide, "page-03", 17);
  await replaceOnlyImageWithGif(
    slide,
    animation2,
    "Animação do pistão comprimindo o gás com destaque para W negativo",
    { left: 56, top: 235, width: 570, height: 321 },
  );
  setNotes(slide,
    "Tempo: 5 min\n\n" +
    "Condução: Inicie a animação no modo apresentação. Peça que a turma observe o sentido do movimento do pistão. Quando W < 0 aparecer, destaque: pela convenção Q = ΔU + W, o sinal negativo indica trabalho realizado sobre o gás. A animação não usa a hipótese Q = 0 e não introduz transformações.\n\n" +
    "[Sources]\n" +
    "- C:/Users/User/Desktop/celestial-labv1/Animacao_2_Compressao_Convencao_Sinais.mp4\n" +
    "- C:/Users/User/Desktop/celestial-labv1/animacao2_compressao_sinais.py\n" +
    "- https://pt.khanacademy.org/science/chemistry/thermodynamics-chemistry/internal-energy-sal/v/work-from-expansion"
  );
}

// Slide 18 — fechamento reduzido: duas ideias e uma conta curta.
{
  const slide = presentation.slides.getItem(17);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Saída — duas ideias e uma conta");
  setPage(slide, "page-15", 18);
  setNotes(slide,
    "Tempo: 3 min\n\n" +
    "Condução: Colete respostas individuais. Gabarito: (1) a pressão aumenta; (2) Q é calor transferido, ΔU é a mudança da energia interna e W é o trabalho realizado pelo gás; (3) 0 = ΔU − 40, portanto ΔU = 40 J.\n\n" +
    "[Sources]\n" +
    "- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law\n" +
    "- https://pt.khanacademy.org/science/chemistry/thermodynamics-chemistry/internal-energy-sal/v/work-from-expansion"
  );
}

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
  maxChars: 160000,
});
await fs.writeFile(`${workspace}/final-inspect.ndjson`, inspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);
console.log(JSON.stringify({ output, slides: presentation.slides.items.length }, null, 2));
