// Undo/redo stack for input changes
// Each entry: { id, prevValue, newValue }
import { atom } from 'nanostores';
import { syncInputsToURL } from '../utils/url-state.js';

export const undoStack = atom([]); // stack of { id, prevValue, newValue }
export const redoStack = atom([]); // stack of { id, prevValue, newValue }

// Listen to undoStack changes and sync URL
let syncTimeout;
undoStack.subscribe(() => {
  // Debounce URL updates to avoid too many history entries
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncInputsToURL(true); // replaceState to avoid polluting browser history
  }, 500); // Wait 500ms after last change
});
