/**
 * SegmentedButton.js
 * Extracted from InputsUI.js - handles segmented button controls (mutually exclusive buttons)
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import {
  str,
  loadMarkdownByName,
  resolveLocalImages,
  createPopupBox,
  createInfoIcon,
} from "../../lib/utils.js";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { activeModel } from "../../stores/model-store.js";
import { loadExternalDrivers } from "../../utils/external-drivers.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Renders a "segmented control" (a row of mutually-exclusive buttons)
 * in place of a slider, based on spec.rangeDividers and spec.rangeLabelKeys.
 */
export function addSegmentedItem(inputInstance, container = $("#inputs-content")) {
  const spec = inputInstance.spec;

  // ! Skip if this slider has already been added
  if (addedSliderIds.get().includes(spec.id)) {
    return;
  }
  // ! Mark as added
  addedSliderIds.set([...addedSliderIds.get(), spec.id]);

  const currentValue = inputInstance.get();

  // Build segment values array: first min, then dividers, then maybe max
  let segmentValues = [spec.minValue, ...spec.rangeDividers];
  if (segmentValues.length < spec.rangeLabelKeys.length) {
    segmentValues.push(spec.maxValue);
  }
  if (segmentValues.length > spec.rangeLabelKeys.length) {
    segmentValues = segmentValues.slice(0, spec.rangeLabelKeys.length);
  }

  // Outer wrapper
  const wrapper = $('<div class="input-segmented-item"/>');

  // Title + optional info icon + optional material icon
  const infoIcon = createInfoIcon(spec.hoverDescription);
  const extensiveInfoIcon = (function () {
    if (!spec.extensiveDescription) return null;

    const iconContainer = $('<div class="info-icon-container">');
    const bookIcon = $(`
    <span class="material-icons-two-tone book-popup-icon">menu_book</span>
  `);

    bookIcon.on("click", async function () {
      const mdContent = await loadMarkdownByName(spec.extensiveDescription);
      if (mdContent) {
        const resolvedContent = resolveLocalImages(mdContent);
        createPopupBox(resolvedContent);
      }
    });

    iconContainer.append(bookIcon);
    return iconContainer;
  })();
  
  // Create Material Icon element if defined
  let muiIconElem = null;
  if (spec.muiIcon) {
    muiIconElem = $(
      `<span class="material-icons-two-tone mui-icon">${spec.muiIcon}</span>`
    );
  }
  
  const titleAndIcon = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      muiIconElem,
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
      extensiveInfoIcon,
    ].filter((el) => el) // drop the icon if null
  );
  const titleRow = $('<div class="input-title-row"/>').append(titleAndIcon);
  wrapper.append(titleRow);

  // ——— Segmented buttons ———
  const segmentsContainer = $('<div class="segmented-buttons"/>');
  const defaultValue = spec.defaultValue || spec.minValue; // Get the actual default value
  spec.rangeLabelKeys.forEach((labelKey, idx) => {
    const targetValue = segmentValues[idx];
    const isDefaultValue = targetValue === defaultValue; // Check against actual default value
    const btn = $(
      `<button type="button" class="segmented-button" data-input-id="${spec.id}" data-value="${targetValue}" data-is-default="${isDefaultValue}">${str(
        labelKey
      )}</button>`
    );
    if (currentValue === targetValue) btn.addClass("active");

    btn.on("click", async () => {
      const prevValue = inputInstance.get();
      const newValue = targetValue;
      
      // Special handling for SSPs (ed8) - load external drivers
      if (spec.id === "ed8") {
        const scenarioName = str(labelKey); // "Optimistic", "Reference", or "Pessimistic"
        console.log(`Loading external drivers for SSP scenario: ${scenarioName}`);
        
        // Capture ALL input values before the change
        const allInputsBefore = {};
        coreConfig.inputs.forEach((inputSpec) => {
          const input = activeModel.get().getInputForId(inputSpec.id);
          if (input) {
            allInputsBefore[inputSpec.id] = input.get();
          }
        });
        
        // Change the SSP value
        inputInstance.set(newValue);
        segmentsContainer.find(".segmented-button").removeClass("active");
        btn.addClass("active");
        
        try {
          const result = await loadExternalDrivers(scenarioName, activeModel.get());
          console.log(`SSP ${scenarioName}: ${result.applied} variables applied, ${result.warnings} not found in inputs.csv`);
          
          // Capture ALL input values after the change
          const allInputsAfter = {};
          const affectedIds = [];
          coreConfig.inputs.forEach((inputSpec) => {
            const input = activeModel.get().getInputForId(inputSpec.id);
            if (input) {
              allInputsAfter[inputSpec.id] = input.get();
              // Track which inputs actually changed
              if (allInputsBefore[inputSpec.id] !== allInputsAfter[inputSpec.id]) {
                affectedIds.push(inputSpec.id);
              }
            }
          });
          
          // Create a compound undo record for ALL changed inputs
          if (affectedIds.length > 0) {
            const undoArr = [...undoStack.get()];
            const prevValues = affectedIds.map(id => allInputsBefore[id]);
            const newValues = affectedIds.map(id => allInputsAfter[id]);
            
            undoArr.push({ 
              ids: affectedIds, 
              prevValues, 
              newValues,
              isSSPChange: true // Mark this as a special SSP change
            });
            undoStack.set(undoArr);
            redoStack.set([]);
            updateUndoRedoButtons();
            
            console.log(`SSP change recorded: ${affectedIds.length} inputs changed`);
          }
          
          if (result.applied > 0) {
            console.log(`Successfully applied ${result.applied} external driver variables`);
          }
          
          if (result.warnings > 0) {
            console.warn(`${result.warnings} variables from ${scenarioName}.csv were not found in the model inputs`);
          }
        } catch (error) {
          console.error(`Failed to load SSP ${scenarioName}:`, error);
          // Still record the undo for the SSP button itself even if loading fails
          const undoArr = [...undoStack.get()];
          undoArr.push({ id: spec.id, prevValue, newValue });
          undoStack.set(undoArr);
          redoStack.set([]);
          updateUndoRedoButtons();
        }
      } else {
        // Normal segmented button (not SSP)
        const undoArr = [...undoStack.get()];
        undoArr.push({ id: spec.id, prevValue, newValue });
        undoStack.set(undoArr);
        redoStack.set([]);
        updateUndoRedoButtons();
        inputInstance.set(newValue);
        segmentsContainer.find(".segmented-button").removeClass("active");
        btn.addClass("active");
      }
    });

    segmentsContainer.append(btn);
  });
  wrapper.append(segmentsContainer);

  // ——— Optional description below ———
  if (spec.descriptionKey) {
    wrapper.append(
      $(`<div class="input-desc">${str(spec.descriptionKey)}</div>`)
    );
  }

  // Insert into DOM & return
  container.append(wrapper);
  return wrapper;
}
