import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspace = "C:/Users/User/Desktop/celestial-labv1/.deck_build/simplify_v1";
const starter = `${workspace}/template-starter.pptx`;
const output = "C:/Users/User/Desktop/celestial-labv1/Aula_Gases_Ideais_Termodinamica_80min_exercicios_simplificados.pptx";
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

function replaceText(slideNumber, name, oldText, newText) {
  shapeNamed(slideNumber, name).text.replace(oldText, newText);
}

function setNotes(slideNumber, text) {
  const notes = slideAt(slideNumber).speakerNotes;
  notes.textFrame.setText(text);
  notes.setVisible(true);
}

replaceText(5, "slide-title", "No laboratório, mude uma variável por vez", "Na demonstração, observe uma variável por vez");
replaceText(5, "step-1-text", "Escolha o que ficará constante.", "Observe o que ficará constante.");
replaceText(5, "step-2-text", "Preveja antes de mover o controle.", "Faça uma previsão curta.");
replaceText(5, "step-3-text", "Altere um único parâmetro.", "O professor move um controle.");
replaceText(5, "step-4-text", "Registre a pressão e explique com partículas.", "Registre: subiu, desceu ou ficou igual.");
replaceText(5, "text-qyz355l", "Use Resetar entre os experimentos.", "Vote antes de cada teste.");

replaceText(6, "slide-title", "Experimento 1: aquecer sem deixar expandir", "Demonstração 1: aquecer sem deixar expandir");
replaceText(6, "step-1-text", "Ajuste T para 200 K e anote P.", "Observe T = 200 K e anote P.");
replaceText(6, "step-2-text", "Repita em 400 K e 600 K.", "O professor muda para 400 K e 600 K.");
replaceText(6, "step-3-text", "Compare: dobrar T faz o quê com P?", "A turma responde: P sobe, desce ou fica igual?");
replaceText(6, "step-4-text", "Explique usando colisões nas paredes.", "Complete: quando T dobra, P __________.");
replaceText(6, "text-hkw0fcl", "Previsão: P aumenta em linha reta, em curva ou não muda?", "Sem construir gráfico: observe apenas a tendência.");
slideAt(6).tables.items[0].cells.set(0, 2, "Tendência");

replaceText(8, "slide-title", "Volume fixo: pressão acompanha temperatura", "Se T dobra, o que acontece com P?");
replaceText(8, "text-jaqzqbn", "Um gás está a 300 K e 100 kPa, em um recipiente rígido.", "V e n permanecem constantes.");
replaceText(8, "text-2mfr9lt", "Aqueça até 450 K. Use P₁/T₁ = P₂/T₂ e calcule P₂.", "T: 300 K → 600 K; P inicial = 100 kPa.");
replaceText(8, "text-nabcoc3", "Preveja o resultado e confira a tendência no Celestial Lab.", "A pressão final será 50, 100 ou 200 kPa?");
replaceText(8, "text-5fnwh88", "Preveja → calcule → confira no simulador.", "Escolha → justifique → confira no simulador.");

replaceText(9, "slide-title", "Experimento 2: comprimir sem aquecer", "Demonstração 2: expandir sem aquecer");
replaceText(9, "step-1-text", "Ajuste V para 3,0 L e anote P.", "Observe V = 3,0 L e anote P.");
replaceText(9, "step-2-text", "Repita em 6,0 L e 9,0 L.", "O professor muda para 6,0 L e 9,0 L.");
replaceText(9, "step-3-text", "Calcule P × V em cada linha.", "A turma responde: P sobe, desce ou fica igual?");
replaceText(9, "step-4-text", "Explique por que comprimir eleva P.", "Complete: quando V dobra, P __________.");
replaceText(9, "text-4u04m0c", "Previsão: ao triplicar V, o que acontece com P?", "Sem construir gráfico: observe apenas a tendência.");
slideAt(9).tables.items[0].cells.set(0, 2, "Tendência");

replaceText(11, "slide-title", "Temperatura fixa: volume maior, pressão menor", "Se V dobra, o que acontece com P?");
replaceText(11, "text-jaqzqbn", "Um gás ocupa 4,0 L sob pressão de 120 kPa.", "T e n permanecem constantes.");
replaceText(11, "text-2mfr9lt", "Expanda até 8,0 L. Use P₁V₁ = P₂V₂ e calcule P₂.", "V: 4,0 L → 8,0 L; P inicial = 120 kPa.");
replaceText(11, "text-nabcoc3", "Desenhe a previsão no gráfico P × V e confira no simulador.", "A pressão final será 240, 120 ou 60 kPa?");
replaceText(11, "text-5fnwh88", "Preveja → calcule → confira no simulador.", "Escolha → justifique → confira no simulador.");

replaceText(13, "eyebrow", "TRABALHO EM GRUPOS • 8 MINUTOS", "TESTE COLETIVO • 8 MINUTOS");
replaceText(13, "slide-title", "Desafio: produza uma evidência e uma explicação", "Três previsões; três testes no Celestial Lab");
replaceText(13, "text-kvsdpsd", "Grupo A • Isotérmica", "Isotérmica");
replaceText(13, "text-yeilbsy", "Mova V. Esboce P × V.", "Se V aumenta, P sobe,");
replaceText(13, "text-yeilbsy", "Explique por que a curva cai.", "desce ou fica igual?");
replaceText(13, "text-1eanlnu", "Grupo B • Isobárica", "Isobárica");
replaceText(13, "text-89glrhe", "Aumente T. Observe V × T.", "Se T aumenta, V sobe,");
replaceText(13, "text-89glrhe", "Explique a expansão.", "desce ou fica igual?");
replaceText(13, "text-mn0pupv", "Grupo C • Isocórica", "Isocórica");
replaceText(13, "text-uiax9ui", "Aumente T. Observe P × T.", "Se T aumenta, P sobe,");
replaceText(13, "text-uiax9ui", "Explique a pressão maior.", "desce ou fica igual?");
replaceText(13, "text-u1xrmv7", "Entrega: um gráfico + uma frase com partículas + a grandeza constante.", "A turma vota. O professor move o controle. O gráfico confirma.");

replaceText(16, "slide-title", "Calor recebido vira energia interna e trabalho", "Quanto do calor aumenta a energia interna?");
replaceText(16, "text-jaqzqbn", "O gás recebe 180 J de calor e realiza 70 J de trabalho.", "O gás recebe Q = 100 J.");
replaceText(16, "text-2mfr9lt", "Use Q = ΔU + W e calcule a variação da energia interna.", "O gás realiza W = 40 J.");
replaceText(16, "text-nabcoc3", "A energia interna aumentou ou diminuiu? Justifique pelo sinal.", "Em Q = ΔU + W, qual é o valor de ΔU?");
replaceText(16, "text-5fnwh88", "Preveja → calcule → confira no simulador.", "Tente a conta → explique o resultado.");

replaceText(18, "text-jaqzqbn", "Em um recipiente rígido, por que aquecer o gás aumenta a pressão?", "Com V fixo, se T aumenta, P sobe ou desce?");
replaceText(18, "text-2mfr9lt", "Se o volume dobra com T e n constantes, o que ocorre com a pressão?", "Com T fixo, se V dobra, P aumenta ou diminui?");
replaceText(18, "text-nabcoc3", "Um gás recebe 100 J de calor e realiza 40 J de trabalho. Qual é ΔU?", "Q = 100 J e W = 40 J. Qual é ΔU?");
replaceText(18, "text-5fnwh88", "Explique com partículas, relações e energia.", "Responda com poucas palavras e uma conta.");

setNotes(5, `Tempo: 4 min

Condução: Você controla o Celestial Lab. Em cada rodada, mostre o que ficará constante, peça uma votação rápida — sobe, desce ou fica igual —, altere um controle e só então discuta o resultado. Os alunos registram uma palavra ou frase curta.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-laboratorio-full.png
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`);

setNotes(6, `Tempo: 7 min

Condução: Mantenha V = 6,0 L e 40 partículas. Você ajusta T para 200 K, 400 K e 600 K. Antes de cada mudança, a turma prevê se P sobe, desce ou fica igual. Valores esperados no modelo: aproximadamente 110,9; 221,7; 332,6 kPa. Conclusão: quando T dobra, P dobra. Não peça a construção de gráfico.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`);

setNotes(8, `Tempo: 2 min

Condução: Peça a escolha antes de qualquer conta. Resposta: 200 kPa. Como V e n são constantes, P é diretamente proporcional à temperatura em kelvin; quando T dobra, P dobra. Convide um aluno a justificar e então confirme a tendência no simulador.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`);

setNotes(9, `Tempo: 7 min

Condução: Mantenha T = 300 K e 40 partículas. Você ajusta V para 3,0 L, 6,0 L e 9,0 L. Antes de cada mudança, a turma prevê a tendência de P. Valores esperados: aproximadamente 332,6; 166,3; 110,9 kPa. Conclusão: quando V dobra, P cai à metade. Não exija cálculo de P×V nem construção de gráfico.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law`);

setNotes(11, `Tempo: 2 min

Condução: Faça a votação entre 240, 120 e 60 kPa. Resposta: 60 kPa. Com T e n constantes, pressão e volume são inversamente proporcionais; quando V dobra, P cai à metade. A conta pode ser apenas 120 ÷ 2.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`);

setNotes(13, `Tempo: 8 min

Condução: Faça três rodadas coletivas na aba Transformações. Em cada uma, a turma vota antes de você mover o controle. Gabarito: isotérmica — V aumenta, P diminui; isobárica — T aumenta, V aumenta; isocórica — T aumenta, P aumenta. Use os gráficos prontos apenas para confirmar as previsões.

[Sources]
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isotermica.png
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isobarica.png
- C:/Users/User/Desktop/celestial-labv1/deck_assets/gases-transformacao-isocorica.png
- C:/Users/User/Desktop/celestial-labv1/simulations/IdealGasSim.tsx`);

setNotes(16, `Tempo: 2 min

Condução: Identifique Q = 100 J e W = 40 J em Q = ΔU + W. Resposta: ΔU = 100 − 40 = 60 J. Explique que, dos 100 J recebidos, 40 J saem como trabalho e 60 J aumentam a energia interna.

[Sources]
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics`);

setNotes(18, `Tempo: 4 min

Condução: Colete respostas individuais e curtas. Gabarito: (1) P sobe; (2) P diminui — se V dobra, P cai à metade; (3) ΔU = 100 − 40 = 60 J. Use as respostas para decidir a retomada da próxima aula.

[Sources]
- https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law
- https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics`);

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
console.log(JSON.stringify({ output, slides: presentation.slides.items.length }, null, 2));
