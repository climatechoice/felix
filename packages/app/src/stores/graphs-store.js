import { atom } from "nanostores";

// Holds all live GraphView instances so other modules (e.g. index.js)
// can trigger updates when the model outputs change.
export const graphViews = atom([]);
