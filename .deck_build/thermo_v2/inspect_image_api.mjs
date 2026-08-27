import { FileBlob, PresentationFile } from "@oai/artifact-tool";
const deck = await PresentationFile.importPptx(await FileBlob.load("C:/Users/User/Desktop/celestial-labv1/.deck_build/thermo_v2/template-starter.pptx"));
const slide = deck.slides.getItem(16);
const image = slide.images.items[0];
console.log(JSON.stringify({
  imageOwn: Object.getOwnPropertyNames(image),
  imageProto: Object.getOwnPropertyNames(Object.getPrototypeOf(image)),
  collectionOwn: Object.getOwnPropertyNames(slide.images),
  collectionProto: Object.getOwnPropertyNames(Object.getPrototypeOf(slide.images)),
  shapesProto: Object.getOwnPropertyNames(Object.getPrototypeOf(slide.shapes)),
}, null, 2));
