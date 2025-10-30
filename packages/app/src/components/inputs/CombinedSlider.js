/**
 * CombinedSlider.js
 * Extracted from InputsUI.js - handles combined slider controls (2 values in one slider)
 */

import $ from "jquery";
import Slider from "bootstrap-slider";
import {
  str,
  format,
  createInfoIcon,
  createGraphPreviewButton,
} from "../../lib/utils.js";
import { config as coreConfig } from "@core";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { activeModel } from "../../stores/model-store.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Creates a combined slider with two handles for start and end values
 * @param {Array} groupInputs - Array of exactly 2 input specs
 * @param {jQuery} container - Container to append the slider to
 */
export function addCombinedSlider(groupInputs, container) {
  if (groupInputs.length !== 2) {
    console.error("Combined slider group must contain exactly 2 sliders");
    return;
  }

  const [startSpec, endSpec] = groupInputs;

  // ! Check if either slider has already been added
  if (
    addedSliderIds.get().includes(startSpec.id) ||
    addedSliderIds.get().includes(endSpec.id)
  ) {
    return; // ! Skip if either is a duplicate
  }
  // ! Mark both as added
  addedSliderIds.set([...addedSliderIds.get(), startSpec.id]);
  addedSliderIds.set([...addedSliderIds.get(), endSpec.id]);

  const startInput = activeModel.get().getInputForId(startSpec.id);
  const endInput = activeModel.get().getInputForId(endSpec.id);

  // Get hover description and normal description from first spec that has it
  const hoverDescription = [startSpec, endSpec].find(
    (spec) => spec.hoverDescription
  )?.hoverDescription;
  const description = [startSpec, endSpec].find(
    (spec) => spec.descriptionKey
  )?.descriptionKey;

  const infoIcon = createInfoIcon(hoverDescription);

  // Create container with existing input-item styling
  const div = $(`<div class="input-item combined-slider-group"/>`);

  // Slider row with existing styling
  const sliderId = `combined-${startSpec.id}-${endSpec.id}`;

  // Determine the title for the combined slider
  let title = `${str(startSpec.labelKey)} - ${str(endSpec.labelKey)}`; // Default title
  // Regex to match "combined (title)" or "dropdown combined (title)"
  const combinedTitleRegex = /(?:dropdown )?combined \((.*?)\)/;
  const titleMatch = startSpec.secondaryType?.match(combinedTitleRegex);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1];
  }

  // Title row matching existing style
  const titleRow = $(`
    <div class="input-title-row">
      <div class="slider-title-and-info-container">
        <div class="input-title">${title}</div>
      </div>
      <div class="input-slider-row">
      <input id="${sliderId}" class="slider" type="text"/>
    </div>
      <div class="value-units-container">
        <div class="input-value"></div>
        <div class="input-units">${str(startSpec.unitsKey)}</div>
      </div>
    </div>
  `);

  // Add info icon to the title container
  titleRow.find(".slider-title-and-info-container").append(infoIcon);
  // Append preview button if a graph exists for the combined slider title
  try {
    const graphSpec = coreConfig.graphs.get(startSpec.id) || coreConfig.graphs.get(endSpec.id);
    if (graphSpec) {
      const previewBtn = createGraphPreviewButton(graphSpec.id || startSpec.id);
      if (previewBtn) titleRow.find(".slider-title-and-info-container").append(previewBtn);
    }
  } catch (e) {}

  const descRow = $(
    `<div class="input-desc">${description ? str(description) : ""}</div>`
  );

  div.append(titleRow, descRow);
  container.append(div);

  // Initialize slider with existing styles
  const slider = new Slider(`#${sliderId}`, {
    min: Math.min(startSpec.minValue, endSpec.minValue),
    max: Math.max(startSpec.maxValue, endSpec.maxValue),
    value: [startInput.get(), endInput.get()],
    range: true,
    tooltip: "hide",
    reversed: startSpec.reversed,
    step: Math.min(startSpec.step, endSpec.step),
    selection: "none",
    rangeHighlights: [
      {
        start: startInput.get(),
        end: endInput.get(),
        class: "slider-rangeHighlight",
      },
    ],
  });

  // Show the initial value and update the value when the slider is changed
  const inputValueElement = titleRow.find(".input-value");
  const updateValueElement = (startVal, endVal) => {
    inputValueElement.text(`${format(startVal, startSpec.format)} - ${format(endVal, endSpec.format)}`);
  };
  updateValueElement(startInput.get(), endInput.get());

  // Track values when drag starts for undo history
  let dragStartValues = [startInput.get(), endInput.get()];
  
  slider.on("slideStart", () => {
    dragStartValues = [startInput.get(), endInput.get()];
  });

  // Update logic - handles real-time updates during drag
  slider.on("change", (change) => {
    const [startValue, endValue] = change.newValue;
    updateValueElement(startValue, endValue);

    // Update range highlight
    slider.setAttribute("rangeHighlights", [
      {
        start: startValue,
        end: endValue,
        class: "slider-rangeHighlight",
      },
    ]);

    // Update model values
    startInput.set(startValue);
    endInput.set(endValue);
  });
  
  // Only record to undo stack when drag ends (performance optimization)
  slider.on("slideStop", () => {
    const currentValues = [startInput.get(), endInput.get()];
    if (dragStartValues[0] !== currentValues[0] || dragStartValues[1] !== currentValues[1]) {
      const undoArr = [...undoStack.get()];
      undoArr.push({ ids: [startSpec.id, endSpec.id], prevValues: dragStartValues, newValues: currentValues });
      undoStack.set(undoArr);
      redoStack.set([]);
      updateUndoRedoButtons();
    }
  });
}
