/**
 * Combined2Slider.js
 * Extracted from InputsUI.js - handles multiple segment sliders with inline labels
 * Used for distributing 100% across 2+ inputs (e.g., dietary composition)
 */

import $ from "jquery";
import Slider from "bootstrap-slider";
import { str, createInfoIcon } from "../../lib/utils.js";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { activeModel } from "../../stores/model-store.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Creates a single range slider with multiple knobs to distribute 100% across multiple inputs.
 * Each segment represents one input, with inline labels above and values below.
 * 
 * @param {Array} groupInputs - Array of spec objects (min 2 required)
 * @param {jQuery} container - Container element to append to
 */
export function addCombined2Slider(groupInputs, container = $("#inputs-content")) {
  if (groupInputs.length < 2) {
    console.error("Combined2 slider group must contain at least 2 sliders");
    return;
  }

  // Check for duplicates
  if (groupInputs.some((spec) => addedSliderIds.get().includes(spec.id))) {
    return;
  }
  groupInputs.forEach((spec) =>
    addedSliderIds.set([...addedSliderIds.get(), spec.id])
  );

  // Get input instances
  const inputs = groupInputs.map((spec) =>
    activeModel.get().getInputForId(spec.id)
  );

  // Get hover description and normal description from first spec that has it
  const hoverDescription = groupInputs.find(
    (spec) => spec.hoverDescription
  )?.hoverDescription;
  const description = groupInputs.find(
    (spec) => spec.descriptionKey
  )?.descriptionKey;

  const infoIcon = createInfoIcon(hoverDescription);

  // Create container
  const div = $(`<div class="input-item combined2-slider-group"/>`);

  // Extract title from secondaryType
  const titleMatch = groupInputs[0].secondaryType.match(
    /dropdown combined2 \((.*?)\)/
  );
  const title = titleMatch ? titleMatch[1] : groupInputs[0].inputGroup;

  // Create title row using the extracted title
  const titleRow = $(`
    <div class="input-title-row">
      <div class="slider-title-and-info-container">
        <div class="input-title">${title}</div>
      </div>
    </div>
  `);

  // Add info icon to title container
  titleRow.find(".slider-title-and-info-container").append(infoIcon);

  // Create the single range slider with inline labels
  const sliderId = `combined2-${groupInputs[0].id}`;
  const sliderContainer = $(`
    <div class="combined2-slider-container">
      <div class="slider-with-labels">
        <div class="inline-labels names">
          ${groupInputs
            .map((spec, i) => {
              const position = (i * 100) / (groupInputs.length - 1);
              return `
              <div class="inline-label" data-index="${i}" style="top: 0; left: ${position}%">
                <span class="label-text">${str(spec.labelKey)}</span>
              </div>
            `;
            })
            .join("")}
        </div>
        <div class="input-slider-row">
          <input id="${sliderId}" class="slider" type="text"/>
        </div>
        <div class="inline-labels values">
          ${groupInputs
            .map((spec, i) => {
              const position = (i * 100) / (groupInputs.length - 1);
              return `
              <div class="inline-label" data-index="${i}" style="bottom: 0; left: ${position}%">
                <span class="label-value">${inputs[i].get()}%</span>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `);

  // Add description if available
  const descRow = $(
    `<div class="input-desc">${description ? str(description) : ""}</div>`
  );

  // Assemble the UI
  div.append(titleRow, sliderContainer, descRow);
  container.append(div);

  // Initialize the range slider
  const slider = new Slider(`#${sliderId}`, {
    min: 0,
    max: 100,
    value: groupInputs.slice(0, -1).map((_, i) => {
      // Calculate cumulative values for the knobs
      return inputs
        .slice(0, i + 1)
        .reduce((sum, input) => sum + input.get(), 0);
    }),
    range: true,
    tooltip: "hide",
    step: 1,
    selection: "none",
  });

  // Function to update segment values and display
  function updateSegments(values) {
    // Calculate segment values
    const segments = [];
    let lastValue = 0;
    values.forEach((value) => {
      segments.push(value - lastValue);
      lastValue = value;
    });
    segments.push(100 - lastValue); // Last segment

    // Update model values
    segments.forEach((value, i) => {
      inputs[i].set(value);
    });

    // Update segment labels
    segments.forEach((value, i) => {
      sliderContainer
        .find(
          `.inline-labels.values .inline-label[data-index="${i}"] .label-value`
        )
        .text(`${value}%`);
    });
  }

  // Track values when drag starts for undo history
  let dragStartValues = inputs.map(input => input.get());
  
  slider.on("slideStart", () => {
    dragStartValues = inputs.map(input => input.get());
  });

  // Add change handler - updates model and UI during drag
  slider.on("change", (change) => {
    updateSegments(change.newValue);
  });
  
  // Only record to undo stack when drag ends (performance optimization)
  slider.on("slideStop", () => {
    const newValues = inputs.map(input => input.get());
    
    // Check if any value changed
    const hasChanged = newValues.some((val, i) => val !== dragStartValues[i]);
    if (hasChanged) {
      const undoArr = [...undoStack.get()];
      const ids = groupInputs.map(spec => spec.id);
      undoArr.push({ ids, prevValues: dragStartValues, newValues });
      undoStack.set(undoArr);
      redoStack.set([]);
      updateUndoRedoButtons();
    }
  });

  // Initial update
  updateSegments(slider.getValue());
}
