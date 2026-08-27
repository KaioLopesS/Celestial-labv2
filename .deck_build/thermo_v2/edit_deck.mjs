import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "C:/Users/User/Desktop/celestial-labv1/.deck_build/thermo_v2";
const starter = `${workspace}/template-starter.pptx`;
const output = "C:/Users/User/Desktop/celestial-labv1/Aula_Gases_Ideais_Termodinamica_80min_com_animacoes.pptx";
const renderDir = `${workspace}/final-render`;
const layoutDir = `${workspace}/final-layout/final`;
const posterSystem = `${workspace}/poster_anim1_system.png`;
const posterEnergy = `${workspace}/poster_anim1_energy.png`;
const posterCompression = `${workspace}/poster_anim2_compression.png`;

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

async function replaceOnlyImage(slide, imagePath, fit, alt, position) {
  if (slide.images.items.length !== 1) {
    throw new Error(`Expected exactly one image, found ${slide.images.items.length}`);
  }
  const image = slide.images.items[0];
  const bytes = new Uint8Array(await fs.readFile(imagePath));
  image.delete();
  slide.images.add({
    blob: bytes,
    contentType: "image/png",
    alt,
    fit,
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

if (presentation.slides.items.length !== 20) {
  throw new Error(`Expected 20 slides, found ${presentation.slides.items.length}`);
}

// Slide 14 — visual transition into thermodynamics and first view of the system.
{
  const slide = presentation.slides.getItem(13);
  setText(slide, "cover-eyebrow", "");
  setText(slide, "cover-title", "Termodinâmica");
  setText(slide, "cover-subtitle", "Calor, energia interna e trabalho");
  setText(slide, "cover-kicker", "Agora seguimos o caminho da energia.");
  setPage(slide, "text-utgdpr5", 14);
  await replaceOnlyImage(
    slide,
    posterSystem,
    "cover",
    "Gás confinado sob um pistão: o sistema da animação 1",
    { left: 650, top: 42, width: 574, height: 606 },
  );
  setNotes(slide,
    "Tempo: 2 min\n\n" +
    "Condução: Faça uma pausa clara entre as duas partes da aula. Mostre apenas o sistema da animação 1 antes de apresentar qualquer equação. Pergunte: qual parte vamos chamar de sistema? Delimite o gás dentro do pistão; tudo que está fora é a vizinhança.\n\n" +
    "[Sources]\n" +
    "- C:/Users/User/Desktop/Celestial Equations - Códigos/primeira_lei_termodinamica_16x9.py\n" +
    "- C:/Users/User/Desktop/celestial-labv1/Animacao_1_Primeira_Lei_Termodinamica.mp4\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 15 — system, heat, internal-energy change, and work.
{
  const slide = presentation.slides.getItem(14);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "O gás dentro do pistão é o sistema");
  setText(slide, "text-9pvnr3q", "energia que entra ou sai\ndo sistema");
  setText(slide, "text-s381127", "mudança: ΔU");
  setText(slide, "text-br3a57l", "energia transferida pelo\nmovimento do pistão");
  setText(slide, "text-lhibmuz", "Q e W transferem energia; ΔU mede a mudança da energia interna.");
  setPage(slide, "page-12", 15);
  setNotes(slide,
    "Tempo: 4 min\n\n" +
    "Condução: Use o desenho para nomear somente três grandezas. Q é a energia transferida por calor; W é a energia transferida por trabalho; ΔU é a mudança da energia interna do gás. Evite falar de transformações gasosas nesta parte.\n\n" +
    "[Sources]\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 16 — First Law and the adopted work-sign convention.
{
  const slide = presentation.slides.getItem(15);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "A 1ª Lei acompanha Q, ΔU e W");
  setText(slide, "text-r4fsmis", "calor = mudança interna + trabalho");
  setText(slide, "text-ua6emk4", "calor entra no sistema");
  setText(slide, "text-zpbfhj3", "o gás realiza trabalho");
  setText(slide, "text-3n7bmqn", "A energia se conserva: os sinais mostram para onde ela foi.");
  setText(slide, "text-5g2b4um", "Aqui, W é o trabalho realizado pelo gás.");
  setPage(slide, "page-13", 16);
  setNotes(slide,
    "Tempo: 4 min\n\n" +
    "Condução: Leia Q = ΔU + W em voz alta. Nesta aula, W representa o trabalho realizado pelo gás. Assim, Q > 0 quando o calor entra; W > 0 quando o gás realiza trabalho; ΔU > 0 quando a energia interna aumenta. A Khan Academy também apresenta a convenção equivalente em que o trabalho sobre o sistema é positivo; não misture as duas durante a resolução.\n\n" +
    "[Sources]\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 17 — guided viewing of animation 1.
{
  const slide = presentation.slides.getItem(16);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Animação 1 — calor entra no sistema");
  setText(slide, "text-0h7s5jw", "Observe o sistema");
  setText(slide, "text-7vayxig", "Q entra no gás e as partículas se agitam mais.");
  setText(slide, "text-dy89sif", "Pergunta durante a animação");
  setText(slide, "text-y09sok9", "O que muda no gás e no pistão?");
  setText(slide, "text-ce347ry", "O calor recebido se distribui entre ΔU e W.");
  setPage(slide, "page-03", 17);
  await replaceOnlyImage(
    slide,
    posterEnergy,
    "contain",
    "Quadro da animação 1 com calor, trabalho e variação da energia interna",
    { left: 56, top: 178, width: 570, height: 435 },
  );
  setNotes(slide,
    "Tempo: 4 min\n\n" +
    "Condução: Reproduza Animacao_1_Primeira_Lei_Termodinamica.mp4. Antes da equação aparecer, peça que a turma descreva o que observa: calor entrando, partículas mais agitadas e pistão subindo. No quadro final, conecte a cena a Q = ΔU + W.\n\n" +
    "[Sources]\n" +
    "- C:/Users/User/Desktop/celestial-labv1/Animacao_1_Primeira_Lei_Termodinamica.mp4\n" +
    "- C:/Users/User/Desktop/Celestial Equations - Códigos/primeira_lei_termodinamica_16x9.py\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 18 — one-step calculation.
{
  const slide = presentation.slides.getItem(17);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Conta rápida — para onde foram 100 J?");
  setText(slide, "text-5fnwh88", "20 segundos em dupla → depois, explique.");
  setPage(slide, "page-15", 18);
  setNotes(slide,
    "Tempo: 2 min\n\n" +
    "Condução: Dê cerca de 20 segundos para a tentativa. Identifique Q = 100 J e W = 40 J. Em Q = ΔU + W, ΔU = 100 − 40 = 60 J. A conta tem uma única etapa: 40 J aparecem como trabalho e 60 J aumentam a energia interna.\n\n" +
    "[Sources]\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 19 — guided viewing of animation 2 and negative work.
{
  const slide = presentation.slides.getItem(18);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Animação 2 — compressão e sinais");
  setText(slide, "text-0h7s5jw", "Observe a compressão");
  setText(slide, "text-7vayxig", "Quem realiza trabalho sobre quem?");
  setText(slide, "text-dy89sif", "Convenção desta aula");
  setText(slide, "text-y09sok9", "W < 0: trabalho realizado sobre o gás.");
  setText(slide, "text-ce347ry", "Com Q = 0: ΔU = −W > 0; a energia interna aumenta.");
  setPage(slide, "page-03", 19);
  await replaceOnlyImage(
    slide,
    posterCompression,
    "contain",
    "Quadro da animação 2 com o pistão comprimindo o gás e W negativo",
    { left: 56, top: 178, width: 570, height: 435 },
  );
  setNotes(slide,
    "Tempo: 4 min\n\n" +
    "Condução: Reproduza Animacao_2_Compressao_Convencao_Sinais.mp4. Pare depois que W < 0 aparecer e pergunte quem realiza trabalho sobre quem. No exemplo isolado, Q = 0. Como Q = ΔU + W, temos ΔU = −W > 0: o trabalho feito sobre o gás aumenta sua energia interna. Não introduza PΔV nem nomes de transformações.\n\n" +
    "[Sources]\n" +
    "- C:/Users/User/Desktop/celestial-labv1/Animacao_2_Compressao_Convencao_Sinais.mp4\n" +
    "- C:/Users/User/Desktop/celestial-labv1/.deck_build/thermo_v2/animacao2_compressao_sinais.py\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
  );
}

// Slide 20 — short exit ticket.
{
  const slide = presentation.slides.getItem(19);
  ensureBlankLabels(slide);
  setText(slide, "slide-title", "Saída — três respostas curtas");
  setText(slide, "text-2mfr9lt", "Em Q = ΔU + W, o que Q, ΔU e W representam?");
  setText(slide, "text-nabcoc3", "Se Q = 0 e W = −40 J, qual é ΔU?");
  setText(slide, "text-5fnwh88", "Poucas palavras e uma conta.");
  setPage(slide, "page-15", 20);
  setNotes(slide,
    "Tempo: 2 min\n\n" +
    "Condução: Colete respostas individuais. Gabarito: (1) P sobe; (2) Q é calor transferido, ΔU é a mudança da energia interna e W é o trabalho realizado pelo gás; (3) 0 = ΔU − 40, portanto ΔU = 40 J.\n\n" +
    "[Sources]\n" +
    "- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law\n" +
    "- https://pt.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-the-first-law-of-thermodynamics"
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
