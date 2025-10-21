import { atom } from "nanostores";

// Store for tracking if we're in multi-scenario mode
// false = single-scenario mode, true = multi-scenario mode
export const isMultiScenarioMode = atom(false);
