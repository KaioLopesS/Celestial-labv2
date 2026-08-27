import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const W = 1280;
const H = 720;
const FONT = "Arial";

const C = {
  white: "#FFFFFF",
  ink: "#10131A",
  muted: "#5D6470",
  panel: "#EEF1F3",
  rule: "#B8BCC4",
  cyan: "#16C8D8",
  cyanDark: "#087E8B",
  cyanSoft: "#DDF8FB",
  blue: "#3D8DFF",
  navy: "#0A1026",
  orange: "#F28C45",
  red: "#E95B65",
  green: "#3DBB91",
  purple: "#9366E8",
  yellow: "#F2C94C",
};

const ROOT = "C:/Users/User/Desktop/celestial-labv1";
const ASSET = `${ROOT}/deck_assets`;
const OUT = `${ROOT}/Aula_Gases_Ideais_Termodinamica_80min.pptx`;
const RENDER_DIR = `${ROOT}/.deck_build/rendered`;

async function bytes(path) {
  const b = await fs.readFile(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function addBox(slide, pos, fill = C.panel, lineFill = "none", radius = 0, name = "box") {
  const box = slide.shapes.add({
    geometry: radius > 0 ? "roundRect" : "rect",
    name,
    position: pos,
    fill,
    line: { style: "solid", fill: lineFill, width: lineFill === "none" ? 0 : 1 },
    ...(radius > 0 ? { borderRadius: radius } : {}),
  });
  return box;
}

function addText(slide, text, pos, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name: opts.name || `text-${Math.random().toString(36).slice(2, 9)}`,
    position: pos,
    fill: opts.fill || "none",
    line: { style: "solid", fill: opts.lineFill || "none", width: opts.lineFill ? 1 : 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: opts.fontSize ?? 24,
    typeface: FONT,
    color: opts.color || C.ink,
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    alignment: opts.align || "left",
    verticalAlignment: opts.vAlign || "top",
  };
  return shape;
}

function addRule(slide, x, y, width, color = C.rule, height = 2) {
  return addBox(slide, { left: x, top: y, width, height }, color, "none", 0, "rule");
}

function addHeader(slide, title, num, eyebrow = "GASES IDEAIS • CELESTIAL LAB") {
  addText(slide, eyebrow, { left: 56, top: 34, width: 650, height: 24 }, {
    fontSize: 16, bold: true, color: C.cyanDark, name: "eyebrow",
  });
  addText(slide, title, { left: 56, top: 72, width: 1130, height: 64 }, {
    fontSize: 46, bold: true, color: C.ink, name: "slide-title",
  });
  addRule(slide, 56, 142, 1168, C.rule, 1);
  addText(slide, String(num).padStart(2, "0"), { left: 1174, top: 656, width: 50, height: 32 }, {
    fontSize: 14, bold: true, color: C.muted, align: "center", vAlign: "middle", fill: C.panel,
    name: `page-${String(num).padStart(2, "0")}`,
  });
}

function addSmallSource(slide, text = "Modelo de gás ideal") {
  addText(slide, text, { left: 56, top: 667, width: 500, height: 20 }, {
    fontSize: 13, color: "#7A8089", name: "source-footer",
  });
}

function addNote(slide, timing, guidance, sources = []) {
  const sourceBlock = sources.length
    ? `\n\n[Sources]\n${sources.map((s) => `- ${s}`).join("\n")}`
    : "\n\n[Sources]\n- Conteúdo didático autoral; sem ativos externos.";
  slide.speakerNotes.textFrame.setText(`Tempo: ${timing}\n\nCondução: ${guidance}${sourceBlock}`);
  slide.speakerNotes.setVisible(true);
}

function addBulletList(slide, items, pos, opts = {}) {
  const gap = opts.gap ?? 74;
  items.forEach((item, i) => {
    const y = pos.top + i * gap;
    addText(slide, String(i + 1).padStart(2, "0"), { left: pos.left, top: y, width: 46, height: 30 }, {
      fontSize: 18, bold: true, color: opts.numberColor || C.cyanDark, name: `step-${i + 1}-number`,
    });
    addText(slide, item, { left: pos.left + 58, top: y - 2, width: pos.width - 58, height: gap - 4 }, {
      fontSize: opts.fontSize || 25, color: opts.color || C.ink, name: `step-${i + 1}-text`,
    });
  });
}

function styleTable(table, rows, columns, headerColor = C.navy) {
  table.borders.assign({ style: "solid", fill: C.rule, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: columns }).assign({
    fill: headerColor,
    textStyle: { fontSize: 20, bold: true, color: C.white, typeface: FONT },
    borders: { style: "solid", fill: headerColor, width: 1 },
    margins: { top: 8, right: 10, bottom: 8, left: 10 },
    anchor: "middle",
  });
  if (rows > 1) {
    table.cells.block({ row: 1, column: 0, rowCount: rows - 1, columnCount: columns }).assign({
      fill: C.white,
      textStyle: { fontSize: 20, color: C.ink, typeface: FONT },
      borders: { style: "solid", fill: C.rule, width: 1 },
      margins: { top: 7, right: 10, bottom: 7, left: 10 },
      anchor: "middle",
    });
  }
}

function addImageFrame(slide, blob, alt, pos, crop, fit = "cover") {
  addBox(slide, { left: pos.left - 3, top: pos.top - 3, width: pos.width + 6, height: pos.height + 6 }, C.navy, C.navy, 16, "image-backing");
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt,
    fit,
    position: pos,
    ...(crop ? { crop } : {}),
    geometry: "roundRect",
    borderRadius: 14,
  });
}

async function build() {
  await fs.mkdir(RENDER_DIR, { recursive: true });

  const labViewport = await bytes(`${ASSET}/gases-laboratorio.png`);
  const labFull = await bytes(`${ASSET}/gases-laboratorio-full.png`);
  const isoT = await bytes(`${ASSET}/gases-transformacao-isotermica.png`);
  const isoB = await bytes(`${ASSET}/gases-transformacao-isobarica.png`);
  const isoC = await bytes(`${ASSET}/gases-transformacao-isocorica.png`);

  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  // 01 — cover, Codex Grid slide-08 silhouette
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addText(slide, "FÍSICA • 1º ANO DO ENSINO MÉDIO", { left: 56, top: 50, width: 560, height: 28 }, {
      fontSize: 17, bold: true, color: C.cyanDark, name: "cover-eyebrow",
    });
    addText(slide, "Gases ideais e\ntermodinâmica", { left: 56, top: 145, width: 545, height: 190 }, {
      fontSize: 70, bold: true, color: C.ink, name: "cover-title",
    });
    addText(slide, "Do movimento das partículas à conservação de energia", { left: 56, top: 370, width: 520, height: 82 }, {
      fontSize: 28, color: C.muted, name: "cover-subtitle",
    });
    addRule(slide, 56, 510, 150, C.cyan, 8);
    addText(slide, "Aula investigativa com o Celestial Lab", { left: 56, top: 548, width: 470, height: 34 }, {
      fontSize: 22, bold: true, color: C.navy, name: "cover-kicker",
    });
    addImageFrame(slide, labViewport, "Partículas de gás no simulador Celestial Lab", { left: 650, top: 42, width: 574, height: 606 }, {
      left: 0.02, top: 0.07, right: 0.51, bottom: 0.05,
    });
    addText(slide, "01", { left: 1180, top: 670, width: 44, height: 20 }, { fontSize: 15, bold: true, color: C.muted, align: "right" });
    addNote(slide, "2 min", "Apresente a pergunta central: como prever o que acontece com um gás quando aquecemos, comprimimos ou deixamos expandir? Diga que a aula alternará previsões, testes no simulador e explicações.", [
      `${ASSET}/gases-laboratorio.png`,
      `${ROOT}/simulations/IdealGasSim.tsx`,
    ]);
  }

  // 02 — hook
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "O pneu muda sem ganhar nem perder ar?", 2, "COMECE COM UMA PREVISÃO");
    addText(slide, "Um carro sai cedo, com os pneus frios. Depois de rodar por uma hora, a temperatura do ar dentro deles aumenta.", {
      left: 86, top: 202, width: 1110, height: 76,
    }, { fontSize: 30, color: C.ink, align: "center", name: "hook-context" });
    addRule(slide, 182, 324, 916, C.cyan, 4);
    addText(slide, "A pressão tende a…", { left: 144, top: 366, width: 330, height: 45 }, {
      fontSize: 28, bold: true, color: C.muted, align: "center",
    });
    addText(slide, "diminuir", { left: 190, top: 446, width: 220, height: 58 }, { fontSize: 36, bold: true, color: C.blue, align: "center" });
    addText(slide, "ficar igual", { left: 530, top: 446, width: 220, height: 58 }, { fontSize: 36, bold: true, color: C.purple, align: "center" });
    addText(slide, "aumentar", { left: 870, top: 446, width: 220, height: 58 }, { fontSize: 36, bold: true, color: C.red, align: "center" });
    addText(slide, "Escolha uma opção e justifique com partículas.", { left: 275, top: 575, width: 730, height: 38 }, {
      fontSize: 25, color: C.ink, align: "center", italic: true,
    });
    addSmallSource(slide, "Situação-problema: gás confinado em volume quase constante");
    addNote(slide, "4 min", "Faça votação rápida com as mãos e peça duas justificativas. Não confirme ainda. Retome as respostas no slide 7, depois do experimento temperatura–pressão.", [
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
    ]);
  }

  // 03 — microscopic model
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "A pressão nasce de colisões com as paredes", 3, "MODELO MICROSCÓPICO");
    addImageFrame(slide, labFull, "Visão do recipiente com partículas do gás ideal", { left: 56, top: 178, width: 570, height: 435 }, {
      left: 0.00, top: 0.10, right: 0.50, bottom: 0.20,
    });
    addText(slide, "Partículas em movimento aleatório", { left: 690, top: 202, width: 500, height: 42 }, { fontSize: 28, bold: true, color: C.ink });
    addText(slide, "Elas se chocam entre si e com as paredes do recipiente.", { left: 690, top: 254, width: 490, height: 64 }, { fontSize: 24, color: C.muted });
    addRule(slide, 690, 338, 455, C.rule, 1);
    addText(slide, "Temperatura maior → partículas mais rápidas", { left: 690, top: 368, width: 490, height: 72 }, { fontSize: 30, bold: true, color: C.orange });
    addText(slide, "Colisões mais frequentes e intensas podem elevar a pressão.", { left: 690, top: 448, width: 490, height: 68 }, { fontSize: 24, color: C.muted });
    addRule(slide, 690, 538, 455, C.rule, 1);
    addText(slide, "No modelo ideal, as partículas ocupam volume desprezível e as colisões são elásticas.", { left: 690, top: 566, width: 490, height: 76 }, { fontSize: 21, color: C.ink });
    addSmallSource(slide);
    addNote(slide, "5 min", "Conecte a animação à explicação: pressão é o efeito macroscópico de muitas colisões. Peça aos alunos que observem as cores/velocidades e formulem uma hipótese sobre o que muda ao aumentar T.", [
      `${ASSET}/gases-laboratorio-full.png`,
      "https://openstax.org/books/college-physics-2e/pages/13-4-kinetic-theory-atomic-and-molecular-explanation-of-pressure-and-temperature",
    ]);
  }

  // 04 — state equation
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Quatro grandezas descrevem o estado do gás", 4, "EQUAÇÃO DE ESTADO");
    addText(slide, "PV = nRT", { left: 64, top: 192, width: 500, height: 108 }, { fontSize: 78, bold: true, color: C.navy, name: "ideal-gas-equation" });
    addText(slide, "A equação organiza as relações que vamos testar — não é uma lista de letras para decorar.", { left: 64, top: 316, width: 500, height: 95 }, { fontSize: 26, color: C.muted });
    addBox(slide, { left: 640, top: 184, width: 520, height: 382 }, C.panel, "none", 0, "variables-panel");
    const vars = [
      ["P", "pressão", "kPa", C.red],
      ["V", "volume", "L", C.blue],
      ["n", "quantidade de gás", "mol / partículas", C.green],
      ["T", "temperatura absoluta", "K", C.orange],
    ];
    vars.forEach((v, i) => {
      const y = 210 + i * 82;
      addText(slide, v[0], { left: 672, top: y, width: 64, height: 52 }, { fontSize: 38, bold: true, color: v[3], align: "center" });
      addText(slide, v[1], { left: 762, top: y + 2, width: 260, height: 32 }, { fontSize: 25, bold: true, color: C.ink });
      addText(slide, v[2], { left: 1020, top: y + 5, width: 112, height: 28 }, { fontSize: 19, color: C.muted, align: "right" });
    });
    addBox(slide, { left: 64, top: 492, width: 500, height: 74 }, C.cyanSoft, "none", 0, "kelvin-note");
    addText(slide, "Nas leis dos gases, use temperatura em kelvin.", { left: 86, top: 512, width: 460, height: 38 }, { fontSize: 25, bold: true, color: C.cyanDark });
    addText(slide, "R é a constante universal dos gases.", { left: 64, top: 594, width: 500, height: 30 }, { fontSize: 20, color: C.muted });
    addSmallSource(slide, "PV = nRT • estado macroscópico de um gás ideal");
    addNote(slide, "6 min", "Dê significado a cada variável e às unidades usadas no Celestial Lab. Faça um teste oral: se V e n ficam constantes e T aumenta, qual lado da equação precisa acompanhar? Evite cálculos longos neste momento.", [
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
      `${ROOT}/simulations/IdealGasSim.tsx`,
    ]);
  }

  // 05 — simulator orientation
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "No laboratório, mude uma variável por vez", 5, "COMO INVESTIGAR");
    addBulletList(slide, [
      "Escolha o que ficará constante.",
      "Preveja antes de mover o controle.",
      "Altere um único parâmetro.",
      "Registre a pressão e explique com partículas.",
    ], { left: 58, top: 194, width: 420, height: 400 }, { gap: 92, fontSize: 24 });
    addImageFrame(slide, labFull, "Controles do laboratório de gases ideais", { left: 518, top: 178, width: 706, height: 445 }, null, "contain");
    addText(slide, "Use Resetar entre os experimentos.", { left: 66, top: 590, width: 390, height: 34 }, { fontSize: 21, bold: true, color: C.red });
    addSmallSource(slide, "Interface real do Celestial Lab");
    addNote(slide, "4 min", "Projete o Celestial Lab. Mostre as abas Laboratório e Transformações, o botão Resetar e os controles de T, V e Partículas. Reforce controle de variáveis: uma relação só fica clara quando as demais permanecem constantes.", [
      `${ASSET}/gases-laboratorio-full.png`,
      `${ROOT}/simulations/IdealGasSim.tsx`,
    ]);
  }

  // 06 — experiment 1
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Experimento 1: aquecer sem deixar expandir", 6, "PREVER → TESTAR → REGISTRAR");
    addText(slide, "Mantenha V = 6,0 L e 40 partículas.", { left: 58, top: 184, width: 510, height: 42 }, { fontSize: 28, bold: true, color: C.navy });
    addBulletList(slide, [
      "Ajuste T para 200 K e anote P.",
      "Repita em 400 K e 600 K.",
      "Compare: dobrar T faz o quê com P?",
      "Explique usando colisões nas paredes.",
    ], { left: 58, top: 250, width: 500, height: 340 }, { gap: 78, fontSize: 23 });
    const table = slide.tables.add({
      rows: 4, columns: 3, left: 642, top: 210, width: 520, height: 304,
      columnWidths: [150, 180, 190],
      values: [
        ["T (K)", "P (kPa)", "P/T"],
        ["200", "________", "________"],
        ["400", "________", "________"],
        ["600", "________", "________"],
      ],
    });
    styleTable(table, 4, 3, C.orange);
    addBox(slide, { left: 642, top: 548, width: 520, height: 70 }, C.cyanSoft, "none", 0, "prediction-prompt");
    addText(slide, "Previsão: P aumenta em linha reta, em curva ou não muda?", { left: 664, top: 565, width: 478, height: 42 }, { fontSize: 22, bold: true, color: C.cyanDark, align: "center" });
    addSmallSource(slide, "Atividade prática • 8 minutos");
    addNote(slide, "8 min", "Organize duplas. Antes do primeiro ajuste, peça uma previsão escrita. Valores esperados no modelo: aproximadamente 110,9; 221,7; 332,6 kPa. Circule verificando se V e o número de partículas foram mantidos. Não forneça os valores antes da coleta.", [
      `${ROOT}/simulations/IdealGasSim.tsx`,
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
    ]);
  }

  // 07 — conclusion experiment 1
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Com volume constante, P acompanha T", 7, "RESULTADO: TRANSFORMAÇÃO ISOCÓRICA");
    slide.charts.add("line", {
      position: { left: 62, top: 180, width: 690, height: 420 },
      title: "Pressão × temperatura",
      titleTextStyle: { fontSize: 24, fill: C.ink, bold: true },
      categories: ["200", "400", "600"],
      series: [{ name: "P (kPa)", values: [110.9, 221.7, 332.6], line: { style: "solid", fill: C.orange, width: 4 }, marker: { symbol: "circle", size: 9 } }],
      hasLegend: false,
      lineOptions: { smooth: false },
      xAxis: { title: { text: "T (K)", textStyle: { fontSize: 18, fill: C.muted } }, textStyle: { fontSize: 16, fill: C.ink }, line: { style: "solid", fill: C.rule, width: 1 } },
      yAxis: { title: { text: "P (kPa)", textStyle: { fontSize: 18, fill: C.muted } }, min: 0, max: 360, majorUnit: 100, textStyle: { fontSize: 16, fill: C.ink }, majorGridlines: { style: "solid", fill: C.panel, width: 1 } },
      dataLabels: { showValue: true, position: "outEnd", textStyle: { fontSize: 15, fill: C.ink, bold: true } },
      chartFill: C.white,
      chartLine: { style: "solid", fill: C.white, width: 0 },
      plotAreaFill: { type: "none" },
      plotAreaLine: { style: "solid", fill: C.white, width: 0 },
    });
    addText(slide, "V e n constantes", { left: 820, top: 206, width: 330, height: 40 }, { fontSize: 26, bold: true, color: C.muted, align: "center" });
    addText(slide, "P / T = constante", { left: 800, top: 282, width: 370, height: 70 }, { fontSize: 42, bold: true, color: C.orange, align: "center" });
    addText(slide, "Temperatura maior → partículas mais rápidas → colisões mais intensas → pressão maior.", { left: 816, top: 390, width: 340, height: 120 }, { fontSize: 25, color: C.ink, align: "center" });
    addBox(slide, { left: 806, top: 544, width: 360, height: 70 }, C.panel, "none", 0, "hook-answer");
    addText(slide, "Voltando ao pneu: a pressão aumenta.", { left: 826, top: 562, width: 320, height: 42 }, { fontSize: 23, bold: true, color: C.red, align: "center" });
    addSmallSource(slide, "Dados calculados pelo mesmo modelo do simulador");
    addNote(slide, "3 min", "Peça aos alunos que comparem seus dados com a tendência do gráfico. Retome o slide 2: num pneu, o volume varia pouco, portanto o aquecimento tende a elevar a pressão. Destaque que a proporcionalidade exige kelvin.", [
      `${ROOT}/simulations/IdealGasSim.tsx`,
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
    ]);
  }

  // 08 — experiment 2
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Experimento 2: comprimir sem aquecer", 8, "PREVER → TESTAR → REGISTRAR");
    addText(slide, "Mantenha T = 300 K e 40 partículas.", { left: 58, top: 184, width: 510, height: 42 }, { fontSize: 28, bold: true, color: C.navy });
    addBulletList(slide, [
      "Ajuste V para 3,0 L e anote P.",
      "Repita em 6,0 L e 9,0 L.",
      "Calcule P × V em cada linha.",
      "Explique por que comprimir eleva P.",
    ], { left: 58, top: 250, width: 500, height: 340 }, { gap: 78, fontSize: 23, numberColor: C.blue });
    const table = slide.tables.add({
      rows: 4, columns: 3, left: 642, top: 210, width: 520, height: 304,
      columnWidths: [150, 180, 190],
      values: [
        ["V (L)", "P (kPa)", "P × V"],
        ["3,0", "________", "________"],
        ["6,0", "________", "________"],
        ["9,0", "________", "________"],
      ],
    });
    styleTable(table, 4, 3, C.blue);
    addBox(slide, { left: 642, top: 548, width: 520, height: 70 }, C.panel, "none", 0, "volume-prediction");
    addText(slide, "Previsão: ao triplicar V, o que acontece com P?", { left: 664, top: 565, width: 478, height: 42 }, { fontSize: 22, bold: true, color: C.blue, align: "center" });
    addSmallSource(slide, "Atividade prática • 8 minutos");
    addNote(slide, "8 min", "Peça nova previsão antes de mover o pistão. Valores esperados: cerca de 332,6; 166,3; 110,9 kPa. O produto P×V deve permanecer próximo de 997,7 kPa·L. Aceite pequenas diferenças de leitura/arredondamento.", [
      `${ROOT}/simulations/IdealGasSim.tsx`,
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
    ]);
  }

  // 09 — conclusion experiment 2
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "A T constante, aumentar V reduz P", 9, "RESULTADO: TRANSFORMAÇÃO ISOTÉRMICA");
    slide.charts.add("line", {
      position: { left: 62, top: 180, width: 700, height: 420 },
      title: "Pressão × volume",
      titleTextStyle: { fontSize: 24, fill: C.ink, bold: true },
      categories: ["3,0", "4,5", "6,0", "7,5", "9,0"],
      series: [{ name: "P (kPa)", values: [332.6, 221.7, 166.3, 133.0, 110.9], line: { style: "solid", fill: C.blue, width: 4 }, marker: { symbol: "circle", size: 8 } }],
      hasLegend: false,
      lineOptions: { smooth: true },
      xAxis: { title: { text: "V (L)", textStyle: { fontSize: 18, fill: C.muted } }, textStyle: { fontSize: 16, fill: C.ink }, line: { style: "solid", fill: C.rule, width: 1 } },
      yAxis: { title: { text: "P (kPa)", textStyle: { fontSize: 18, fill: C.muted } }, min: 0, max: 360, majorUnit: 100, textStyle: { fontSize: 16, fill: C.ink }, majorGridlines: { style: "solid", fill: C.panel, width: 1 } },
      dataLabels: { showValue: false },
      chartFill: C.white,
      chartLine: { style: "solid", fill: C.white, width: 0 },
      plotAreaFill: { type: "none" },
      plotAreaLine: { style: "solid", fill: C.white, width: 0 },
    });
    addText(slide, "T e n constantes", { left: 820, top: 206, width: 330, height: 40 }, { fontSize: 26, bold: true, color: C.muted, align: "center" });
    addText(slide, "P × V = constante", { left: 790, top: 282, width: 390, height: 70 }, { fontSize: 42, bold: true, color: C.blue, align: "center" });
    addText(slide, "Menos espaço → mais encontros com as paredes por intervalo de tempo → pressão maior.", { left: 816, top: 390, width: 340, height: 130 }, { fontSize: 25, color: C.ink, align: "center" });
    addBox(slide, { left: 806, top: 550, width: 360, height: 62 }, C.cyanSoft, "none", 0, "inverse-callout");
    addText(slide, "Dobrar V reduz P à metade.", { left: 826, top: 566, width: 320, height: 36 }, { fontSize: 23, bold: true, color: C.cyanDark, align: "center" });
    addSmallSource(slide, "Dados calculados pelo mesmo modelo do simulador");
    addNote(slide, "3 min", "Faça os alunos dizerem em voz alta o padrão inverso. Diferencie 'reta decrescente' de relação inversa: o gráfico P×V é uma curva. Relacione com o produto aproximadamente constante calculado no experimento.", [
      `${ROOT}/simulations/IdealGasSim.tsx`,
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
    ]);
  }

  // 10 — transformations table
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Cada transformação fixa uma grandeza", 10, "MAPA DAS TRANSFORMAÇÕES");
    const table = slide.tables.add({
      rows: 4, columns: 5, left: 56, top: 188, width: 1168, height: 386,
      columnWidths: [220, 170, 260, 250, 268],
      values: [
        ["Transformação", "Constante", "Controle livre", "Gráfico no Celestial", "Relação"],
        ["Isotérmica", "T", "Volume", "P × V", "P·V = constante"],
        ["Isobárica", "P", "Temperatura", "V × T", "V/T = constante"],
        ["Isocórica", "V", "Temperatura", "P × T", "P/T = constante"],
      ],
    });
    styleTable(table, 4, 5, C.navy);
    table.getCell(1, 0).fill = C.cyanSoft;
    table.getCell(2, 0).fill = "#FDE8EA";
    table.getCell(3, 0).fill = "#E4F6EF";
    addText(slide, "Regra de ouro: identifique primeiro o que permanece constante.", { left: 170, top: 606, width: 940, height: 38 }, { fontSize: 27, bold: true, color: C.cyanDark, align: "center" });
    addSmallSource(slide);
    addNote(slide, "6 min", "Leia a tabela por linhas. Peça um exemplo oral para cada transformação. Mostre que as três leis são recortes da mesma equação PV=nRT, sempre para quantidade de gás constante.", [
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
      `${ROOT}/simulations/IdealGasSim.tsx`,
    ]);
  }

  // 11 — group challenge, three unique screenshots
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Desafio: produza uma evidência e uma explicação", 11, "TRABALHO EM GRUPOS • 10 MINUTOS");
    const cols = [58, 446, 834];
    const shots = [isoT, isoB, isoC];
    const alts = ["Aba de transformação isotérmica", "Aba de transformação isobárica", "Aba de transformação isocórica"];
    const names = ["Grupo A • Isotérmica", "Grupo B • Isobárica", "Grupo C • Isocórica"];
    const tasks = [
      "Mova V. Esboce P × V.\nExplique por que a curva cai.",
      "Aumente T. Observe V × T.\nExplique a expansão.",
      "Aumente T. Observe P × T.\nExplique a pressão maior.",
    ];
    const colors = [C.cyan, C.red, C.green];
    for (let i = 0; i < 3; i++) {
      addText(slide, names[i], { left: cols[i], top: 180, width: 342, height: 34 }, { fontSize: 25, bold: true, color: colors[i], align: "center" });
      addImageFrame(slide, shots[i], alts[i], { left: cols[i], top: 226, width: 342, height: 225 }, { left: 0.40, top: 0.10, right: 0.01, bottom: 0.13 }, "cover");
      addText(slide, tasks[i], { left: cols[i] + 8, top: 478, width: 326, height: 90 }, { fontSize: 21, color: C.ink, align: "center" });
    }
    addRule(slide, 190, 594, 900, C.rule, 1);
    addText(slide, "Entrega: um gráfico + uma frase com partículas + a grandeza constante.", { left: 184, top: 614, width: 912, height: 36 }, { fontSize: 24, bold: true, color: C.navy, align: "center" });
    addSmallSource(slide, "Celestial Lab • aba Transformações");
    addNote(slide, "10 min", "Divida a turma em três grupos ou fileiras. Cada grupo deve mover o controle livre o suficiente para formar o gráfico e preparar uma fala de 30 segundos. Após 7 minutos, faça apresentações rápidas de 1 minuto por grupo. Se houver poucos dispositivos, conduza coletivamente e atribua a cada grupo a explicação.", [
      `${ASSET}/gases-transformacao-isotermica.png`,
      `${ASSET}/gases-transformacao-isobarica.png`,
      `${ASSET}/gases-transformacao-isocorica.png`,
      `${ROOT}/simulations/IdealGasSim.tsx`,
    ]);
  }

  // 12 — thermodynamic system
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Termodinâmica rastreia a energia do sistema", 12, "SISTEMA • VIZINHANÇA • ENERGIA");
    addText(slide, "CALOR (Q)", { left: 74, top: 268, width: 240, height: 42 }, { fontSize: 30, bold: true, color: C.orange, align: "center" });
    addText(slide, "energia por diferença\nde temperatura", { left: 74, top: 318, width: 240, height: 80 }, { fontSize: 22, color: C.muted, align: "center" });
    addText(slide, "→", { left: 308, top: 290, width: 100, height: 80 }, { fontSize: 64, bold: true, color: C.orange, align: "center" });
    addText(slide, "→", { left: 872, top: 290, width: 100, height: 80 }, { fontSize: 64, bold: true, color: C.blue, align: "center" });
    addBox(slide, { left: 408, top: 218, width: 464, height: 270 }, C.navy, C.navy, 20, "system-box");
    addText(slide, "GÁS", { left: 468, top: 258, width: 344, height: 64 }, { fontSize: 48, bold: true, color: C.white, align: "center" });
    addText(slide, "sistema", { left: 468, top: 330, width: 344, height: 38 }, { fontSize: 25, color: C.cyan, align: "center" });
    addText(slide, "energia interna U", { left: 468, top: 398, width: 344, height: 42 }, { fontSize: 28, bold: true, color: C.white, align: "center" });
    addText(slide, "TRABALHO W", { left: 966, top: 268, width: 240, height: 42 }, { fontSize: 28, bold: true, color: C.blue, align: "center" });
    addText(slide, "energia por força e\ndeslocamento do pistão", { left: 966, top: 318, width: 240, height: 80 }, { fontSize: 22, color: C.muted, align: "center" });
    addRule(slide, 166, 538, 948, C.rule, 1);
    addText(slide, "Calor e trabalho são energia em trânsito; o sistema armazena energia interna.", { left: 164, top: 574, width: 952, height: 50 }, { fontSize: 27, bold: true, color: C.cyanDark, align: "center" });
    addSmallSource(slide, "Convenção adotada: W > 0 quando o gás realiza trabalho");
    addNote(slide, "6 min", "Defina o gás como sistema e o restante como vizinhança. Diferencie calor de temperatura: calor é transferência de energia devido a uma diferença de temperatura. Trabalho aparece quando o gás desloca o pistão. Evite dizer que o corpo 'tem calor'.", [
      "https://openstax.org/books/college-physics/pages/15-1-the-first-law-of-thermodynamics",
      "https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics",
    ]);
  }

  // 13 — first law
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "A 1ª Lei é a conservação da energia no sistema", 13, "PRIMEIRA LEI DA TERMODINÂMICA");
    addText(slide, "ΔU = Q − W", { left: 80, top: 222, width: 560, height: 112 }, { fontSize: 76, bold: true, color: C.navy, align: "center", name: "first-law" });
    addText(slide, "variação da energia interna", { left: 138, top: 350, width: 444, height: 38 }, { fontSize: 23, color: C.muted, align: "center" });
    addRule(slide, 690, 210, 1, C.rule, 380);
    const signRows = [
      ["Q > 0", "o gás recebe energia por calor", C.orange],
      ["W > 0", "o gás realiza trabalho ao expandir", C.blue],
      ["ΔU > 0", "a energia interna aumenta", C.green],
    ];
    signRows.forEach((row, i) => {
      const y = 214 + i * 118;
      addText(slide, row[0], { left: 744, top: y, width: 176, height: 54 }, { fontSize: 34, bold: true, color: row[2], align: "center" });
      addText(slide, row[1], { left: 934, top: y + 2, width: 260, height: 70 }, { fontSize: 23, color: C.ink });
    });
    addBox(slide, { left: 104, top: 460, width: 520, height: 110 }, C.panel, "none", 0, "energy-balance");
    addText(slide, "Se Q > W, parte da energia recebida permanece no gás: ΔU aumenta.", { left: 136, top: 488, width: 456, height: 64 }, { fontSize: 25, bold: true, color: C.cyanDark, align: "center" });
    addText(slide, "Use sempre a convenção de sinais indicada.", { left: 744, top: 578, width: 450, height: 38 }, { fontSize: 22, bold: true, color: C.red, align: "center" });
    addSmallSource(slide);
    addNote(slide, "6 min", "Apresente a convenção adotada: Q positivo entra no sistema; W positivo é trabalho feito pelo gás. Faça dois exemplos mentais: (1) recipiente rígido aquecido: W=0, então ΔU=Q; (2) gás isolado expandindo: Q=0 e W>0, então ΔU diminui.", [
      "https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics",
    ]);
  }

  // 14 — transformations and energy
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Cada transformação conta uma história de energia", 14, "GASES IDEAIS + TERMODINÂMICA");
    const table = slide.tables.add({
      rows: 4, columns: 4, left: 56, top: 186, width: 1168, height: 390,
      columnWidths: [220, 280, 280, 388],
      values: [
        ["Processo", "O que não muda", "Trabalho / energia", "Leitura física"],
        ["Isocórico", "V constante", "W = 0; ΔU = Q", "Aquecer aumenta T, U e P"],
        ["Isotérmico", "T constante", "ΔU = 0; Q = W", "Energia recebida sustenta a expansão"],
        ["Isobárico", "P constante", "Q = ΔU + W", "Aquecer aumenta T e expande o gás"],
      ],
    });
    styleTable(table, 4, 4, C.cyanDark);
    table.getCell(1, 0).fill = "#E4F6EF";
    table.getCell(2, 0).fill = C.cyanSoft;
    table.getCell(3, 0).fill = "#FDE8EA";
    addText(slide, "Para um gás ideal, mudar a temperatura significa mudar a energia interna.", { left: 142, top: 610, width: 996, height: 42 }, { fontSize: 27, bold: true, color: C.navy, align: "center" });
    addSmallSource(slide, "Síntese conceitual • sem cálculo de áreas no 1º ano");
    addNote(slide, "5 min", "Conecte as linhas aos gráficos do desafio. Na isocórica não há deslocamento do pistão. Na isotérmica de um gás ideal, a energia interna não muda porque T não muda; durante expansão, calor recebido compensa o trabalho. Na isobárica, o calor recebido se divide entre aumento de U e trabalho.", [
      "https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics",
      "https://openstax.org/books/college-physics-ap-courses/pages/15-2-the-first-law-of-thermodynamics-and-some-simple-processes",
    ]);
  }

  // 15 — exit ticket
  {
    const slide = deck.slides.add();
    slide.background.fill = C.white;
    addHeader(slide, "Saída: três respostas em quatro minutos", 15, "EXIT TICKET");
    const questions = [
      ["01", "Em um recipiente rígido, por que aquecer o gás aumenta a pressão?"],
      ["02", "Se o volume dobra com T e n constantes, o que ocorre com a pressão?"],
      ["03", "Um gás recebe 100 J de calor e realiza 40 J de trabalho. Qual é ΔU?"],
    ];
    questions.forEach((q, i) => {
      const y = 190 + i * 132;
      addText(slide, q[0], { left: 84, top: y + 2, width: 72, height: 46 }, { fontSize: 26, bold: true, color: C.cyanDark, align: "center" });
      addText(slide, q[1], { left: 182, top: y, width: 980, height: 78 }, { fontSize: 29, bold: true, color: C.ink });
      if (i < 2) addRule(slide, 182, y + 100, 980, C.rule, 1);
    });
    addBox(slide, { left: 260, top: 594, width: 760, height: 58 }, C.navy, "none", 0, "closing-box");
    addText(slide, "Explique com partículas, relações e energia.", { left: 284, top: 607, width: 712, height: 36 }, { fontSize: 24, bold: true, color: C.white, align: "center" });
    addSmallSource(slide, "Síntese individual");
    addNote(slide, "4 min", "Colete respostas individuais. Gabarito: (1) partículas mais rápidas colidem mais intensamente/frequentemente com as paredes; (2) a pressão cai à metade; (3) ΔU=100−40=60 J. Use as respostas para decidir a retomada da próxima aula.", [
      "https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law",
      "https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics",
    ]);
  }

  // Render every slide and structural layouts before exporting.
  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(`${RENDER_DIR}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(`${RENDER_DIR}/${stem}.layout.json`, await layout.text());
  }

  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(`${RENDER_DIR}/montage.webp`, new Uint8Array(await montage.arrayBuffer()));

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);
  console.log(`Created ${OUT}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
