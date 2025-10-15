// Undo/redo stack for input changes
// Each entry: { id, prevValue, newValue }
import { atom } from 'nanostores';

export const undoStack = atom([]); // stack of { id, prevValue, newValue }
export const redoStack = atom([]); // stack of { id, prevValue, newValue }
