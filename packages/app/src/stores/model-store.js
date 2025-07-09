import { atom } from "nanostores";
// import { createModel } from "@core";

// Start empty; we'll populate these once createModel() resolves.
export const model = atom(null);
export const modelB = atom(null);
export const activeModel = atom(null);

// helper to switch active model
// TODO: remove this???
export function setActiveModel(which) {
  if (which === "A") activeModel.set(model.get());
  else if (which === "B") activeModel.set(modelB.get());
}
