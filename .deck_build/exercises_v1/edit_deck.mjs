import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "C:/Users/User/Desktop/celestial-labv1/.deck_build/exercises_v1";
const starter = `${workspace}/template-starter.pptx`;
const output = "C:/Users/User/Desktop/celestial-labv1/Aula_Gases_Ideais_Termodinamica_80min_com_exercicios.pptx";
const renderDir = `${workspace}/final-render`;
const layoutDir = `${workspace}/final-layout/final`;

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

const presentation = await PresentationFile.importPptx(await FileBlob.load(starter));

function slideAt(number) {
  return presentation.slides.getItem(number - 1);
}

function shapeNamed(slideNumber, name) {
  const shape = slideAt(slideNumber).shapes.items.find((item) => item.name === name);
  if (!shape) throw new Error(`Shape ${name} not found on slide ${slideNumber}`);
  return shape;
}

function pageShape(slideNumber) {
  const shape = slideAt(slideNumber).shapes.items.find((item) => item.name?.startsWith("page-"));
  if (!shape) throw new Error(`Page marker not found on slide ${slideNumber}`);
  return shape;
}

function replaceShapeText(shape, oldText, newText) {
  shape.text.replace(oldText, newText);
}

function editExercise(slideNumber, content) {
  replaceShapeText(shapeNamed(slideNumber, "eyebrow"), "EXIT TICKET", "CÁLCULO-RELÂMPAGO • 2 MIN");
  replaceShapeText(shapeNamed(slideNumber, "slide-title"), "Saída: três respostas em quatro minutos", content.title);
  replaceShapeText(shapeNamed(slideNumber, "text-jaqzqbn"), "Em um recipiente rígido, por que aquecer o gás aumenta a pressão?", content.q1);
  replaceShapeText(shapeNamed(slideNumber, "text-2mfr9lt"), "Se o volume dobra com T e n constantes, o que ocorre com a pressão?", content.q2);
  replaceShapeText(shapeNamed(slideNumber, "text-nabcoc3"), "Um gás recebe 100 J de calor e realiza 40 J de trabalho. Qual é ΔU?", content.q3);
  replaceShapeText(shapeNamed(slideNumber, "text-5fnwh88"), "Explique com partículas, relações e energia.", "Preveja → calcule → confira no simulador.");
  replaceShapeText(shapeNamed(slideNumber, "source-footer"), "Síntese individual", "Trabalho em duplas");
}

editExercise(8, {
  title: "Volume fixo: pressão acompanha temperatura",
  q1: "Um gás está a 300 K e 100 kPa, em um recipiente rígido.",
  q2: "Aqueça até 450 K. Use P₁/T₁ = P₂/T₂ e calcule P₂.",
  q3: "Preveja o resultado e confira a tendência no Celestial Lab.",
});

editExercise(11, {
  title: "Temperatura fixa: volume maior, pressão menor",
  q1: "Um gás ocupa 4,0 L sob pressão de 120 kPa.",
  q2: "Expanda até 8,0 L. Use P₁V₁ = P₂V₂ e calcule P₂.",
  q3: "Desenhe a previsão no gráfico P × V e confira no simulador.",
});

editExercise(16, {
  title: "Calor recebido vira energia interna e trabalho",
  q1: "O gás recebe 180 J de calor e realiza 70 J de trabalho.",
  q2: "Use Q = ΔU + W e calcule a variação da energia interna.",
  q3: "A energia interna aumentou ou diminuiu? Justifique pelo sinal.",
});

const pageEdits = [
  [8, "15", "08"],
  [9, "08", "09"],
  [10, "09", "10"],
  [11, "15", "11"],
  [12, "10", "12"],
  [13, "11", "13"],
  [14, "12", "14"],
  [15, "13", "15"],
  [16, "15", "16"],
  [17, "14", "17"],
  [18, "15", "18"],
];
for (const [slideNumber, oldText, newText] of pageEdits) {
  replaceShapeText(pageShape(slideNumber), oldText, newText);
}

replaceShapeText(shapeNamed(6, "source-footer"), "Atividade prática • 8 minutos", "Atividade prática • 7 minutos");
replaceShapeText(shapeNamed(9, "source-footer"), "Atividade prática • 8 minutos", "Atividade prática • 7 minutos");
replaceShapeText(shapeNamed(13, "eyebrow"), "TRABALHO EM GRUPOS • 10 MINUTOS", "TRABALHO EM GRUPOS • 8 MINUTOS");

replaceShapeText(shapeNamed(15, "first-law"), "ΔU = Q − W", "Q = ΔU + W");
replaceShapeText(shapeNamed(15, "text-r4fsmis"), "variação da energia interna", "calor = energia interna + trabalho");

const notes = [
`Tempo: 2 min

Condução: Apresente a pergunta central: como prever o que acontece com um gás quando aquecemos, comprimimos ou deixamos expandir? Diga que a aula alternará previsões, testes no simulador, cálculos rápidos e explicações.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-laboratorio.png
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 4 min

Condução: Faça votação rápida com as mãos e peça duas justificativas. Não confirme ainda. Retome as respostas no slide 7, depois do experimento temperatura–pressão.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`,
`Tempo: 5 min

Condução: Conecte a animação à explicação: pressão é o efeito macroscópico de muitas colisões. Peça aos alunos que observem as cores/velocidades e formulem uma hipótese sobre o que muda ao aumentar T.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-laboratorio-full.png
- https://openstax.org/books/college-physics-2e/pages/13-4-kinetic-theory-atomic-and-molecular-explanation-of-pressure-and-temperature`,
`Tempo: 5 min

Condução: Dê significado a cada variável e às unidades usadas no Celestial Lab. Faça um teste oral: se V e n ficam constantes e T aumenta, qual lado da equação precisa acompanhar? Apresente as relações proporcionais como ferramentas de cálculo.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 4 min

Condução: Projete o Celestial Lab. Mostre as abas Laboratório e Transformações, o botão Resetar e os controles de T, V e Partículas. Reforce controle de variáveis: uma relação só fica clara quando as demais permanecem constantes.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-laboratorio-full.png
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 7 min

Condução: Organize duplas. Antes do primeiro ajuste, peça uma previsão escrita. Valores esperados no modelo: aproximadamente 110,9; 221,7; 332,6 kPa. Circule verificando se V e o número de partículas foram mantidos. Não forneça os valores antes da coleta.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`,
`Tempo: 3 min

Condução: Peça aos alunos que comparem seus dados com a tendência do gráfico. Retome o slide 2: num pneu, o volume varia pouco, portanto o aquecimento tende a elevar a pressão. Destaque que a proporcionalidade exige kelvin.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`,
`Tempo: 2 min

Condução: Dê 30 segundos para a previsão, 60 segundos para o cálculo e 30 segundos para a conferência coletiva. Cálculo: P₂ = 100 × 450/300 = 150 kPa. No simulador, compare a razão entre os valores, pois a escala depende da configuração de partículas e volume.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 7 min

Condução: Peça nova previsão antes de mover o pistão. Valores esperados: cerca de 332,6; 166,3; 110,9 kPa. O produto P×V deve permanecer próximo de 997,7 kPa·L. Aceite pequenas diferenças de leitura/arredondamento.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`,
`Tempo: 3 min

Condução: Faça os alunos dizerem em voz alta o padrão inverso. Diferencie reta decrescente de relação inversa: o gráfico P×V é uma curva. Relacione com o produto aproximadamente constante calculado no experimento.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`,
`Tempo: 2 min

Condução: Repita a rotina previsão–cálculo–conferência. Cálculo: P₂ = 120 × 4,0/8,0 = 60 kPa. Peça que apontem no gráfico onde estaria o novo ponto.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 6 min

Condução: Leia a tabela por linhas. Peça um exemplo oral para cada transformação. Mostre que as três leis são recortes da mesma equação PV=nRT, sempre para quantidade de gás constante.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 8 min

Condução: Divida a turma em três grupos ou fileiras. Cada grupo deve mover o controle livre, registrar a forma do gráfico e preparar uma fala de 30 segundos. Reserve 5 minutos para testar e cerca de 1 minuto para cada apresentação. Se houver poucos dispositivos, conduza coletivamente.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isotermica.png
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isobarica.png
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isocorica.png
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`,
`Tempo: 6 min

Condução: Defina o gás como sistema e o restante como vizinhança. Diferencie calor de temperatura: calor é transferência de energia devido a uma diferença de temperatura. Trabalho aparece quando o gás desloca o pistão. Evite dizer que o corpo tem calor.

[Sources]
- https://openstax.org/books/college-physics/pages/15-1-the-first-law-of-thermodynamics
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics`,
`Tempo: 6 min

Condução: Use a forma Q = ΔU + W: o calor recebido pelo gás se distribui entre aumento da energia interna e trabalho realizado pelo gás. Q positivo entra no sistema; W positivo sai como trabalho. Após explicar os sinais, reproduza Animacao_Primeira_Lei_Termodinamica.mp4 e pause no quadro final 100 J = 60 J + 40 J.

[Sources]
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics
- C:/Users/User/Desktop/celestial-labv1/Animacao_Primeira_Lei_Termodinamica.mp4`,
`Tempo: 2 min

Condução: Peça que identifiquem primeiro Q e W na equação Q = ΔU + W. Cálculo: ΔU = 180 − 70 = +110 J. O sinal positivo indica aumento da energia interna.

[Sources]
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics`,
`Tempo: 4 min

Condução: Conecte as linhas aos gráficos do desafio. Na isocórica não há deslocamento do pistão. Na isotérmica de um gás ideal, a energia interna não muda porque T não muda; durante expansão, calor recebido compensa o trabalho. Na isobárica, o calor recebido se divide entre aumento de U e trabalho.

[Sources]
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics
- https://openstax.org/books/college-physics-ap-courses/pages/15-2-the-first-law-of-thermodynamics-and-some-simple-processes`,
`Tempo: 4 min

Condução: Colete respostas individuais. Gabarito: (1) partículas mais rápidas colidem mais intensamente/frequentemente com as paredes; (2) a pressão cai à metade; (3) usando Q = ΔU + W, ΔU=100−40=60 J. Use as respostas para decidir a retomada da próxima aula.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics`,
];

if (notes.length !== presentation.slides.items.length) {
  throw new Error(`Expected ${presentation.slides.items.length} notes, received ${notes.length}`);
}
for (let i = 0; i < notes.length; i += 1) {
  const speakerNotes = presentation.slides.getItem(i).speakerNotes;
  speakerNotes.textFrame.setText(notes[i]);
  speakerNotes.setVisible(true);
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
  maxChars: 80000,
});
await fs.writeFile(`${workspace}/final-inspect.ndjson`, inspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);
console.log(JSON.stringify({ output, slides: presentation.slides.items.length }, null, 2));
