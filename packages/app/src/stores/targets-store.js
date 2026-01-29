import { atom } from "nanostores";

// Store to track whether targets are visible on graphs
// Default to true so targets show by default
export const targetsVisible = atom(true);
