import { atom } from "nanostores";

// keep track of which sliders have been injected
/*
 * This is a custom solution, because the initial addSwitchItem implementation of
 * SDEverywhere added the sliders Twice for each input.
 * a) It first adds the sliders defined INSIDE the switch row
 * b) It then adds the sliders defined in their own row in inputs.csv
 *
 * So, with this addedSliderIds Set,
 * I first check if this slider has already been added, to prevent duplicates.
 */
export const addedSliderIds = atom([]);
