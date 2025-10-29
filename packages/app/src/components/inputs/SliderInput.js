/**
 * SliderInput.js
 * Extracted from InputsUI.js - handles rendering of slider input controls
 */

import $ from "jquery";
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";

import {
  str,
  format,
  loadMarkdownByName,
  resolveLocalImages,
  createPopupBox,
  createInfoIcon,
} from "../../lib/utils.js";

import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Creates and adds a slider input item to the specified container
 * @param {Object} sliderInput - The input instance with spec and get/set methods
 * @param {jQuery} container - The container to append the slider to (default: #inputs-content)
 * @returns {jQuery} The created slider element
 */
export function addSliderItem(sliderInput, container = $("#inputs-content")) {
  const spec = sliderInput.spec;

  /*
   * This is a custom solution, because the initial addSwitchItem implementation
   * added the sliders Twice for each input.
   * So, here I first check if this slider has already been added, to prevent duplicates.
   */
  if (addedSliderIds.get().includes(spec.id)) {
    // Check if already added
    return; // Skip if duplicate
  }
  addedSliderIds.set([...addedSliderIds.get(), spec.id]); // Mark as added

  // console.log(spec);
  const inputElemId = `input-${spec.id}`;
  const inputValue = $(`<div class="input-value"/>`);

  // Create info icon if description exists
  // and Position it correctly, inside the viewport (!).
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

  // Title + Info Icon container. This should be in the far left.
  const sliderTitleAndInfoContainer = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      muiIconElem,
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
      extensiveInfoIcon,
    ].filter((el) => el !== null)
  );

  // Value + Units container. This should be in the far right.
  const valueUnitsContainer = $('<div class="value-units-container"/>').append(
    [
      inputValue,
      $(`<div class="input-units">${str(spec.unitsKey)}</div>`),
    ].filter((el) => el !== null)
  );

  let tickPos =
    (spec.defaultValue - spec.minValue) / (spec.maxValue - spec.minValue);
  if (spec.reversed) {
    tickPos = 1 - tickPos;
  }
  const sliderRow = $(`<div class="input-slider-row"/>`).append([
    $(`<div class="input-slider-tick" style="left:${tickPos * 100}%"></div>`),
    $(`<input id="${inputElemId}" class="slider" type="text"></input>`),
  ]);

  // Title row with left and right sections
  const titleRow = $(`<div class="input-title-row"/>`).append([
    sliderTitleAndInfoContainer,
    sliderRow,
    valueUnitsContainer,
  ]);

  const div = $(`<div class="input-item"/>`).append([
    titleRow,
    $(
      `<div class="input-desc">${
        spec.descriptionKey ? str(spec.descriptionKey) : ""
      }</div>`
    ),
  ]);

  container.append(div);

  const value = sliderInput.get();
  const slider = new Slider(`#${inputElemId}`, {
    value,
    min: spec.minValue,
    max: spec.maxValue,
    step: spec.step,
    reversed: spec.reversed,
    tooltip: "hide",
    selection: "none",
    rangeHighlights: [{ start: spec.defaultValue, end: value }],
  });

  // Show the initial value and update the value when the slider is changed
  const updateValueElement = (v) => {
    inputValue.text(format(v, spec.format));
  };
  updateValueElement(value);

  // Track the value when drag starts for undo history
  let dragStartValue = value;
  
  slider.on("slideStart", () => {
    dragStartValue = sliderInput.get();
  });

  // Update the model input when the slider is dragged or the track is clicked
  slider.on("change", (change) => {
    const newValue = change.newValue;
    const start = spec.defaultValue;
    const end = newValue;
    slider.setAttribute("rangeHighlights", [{ start, end }]);
    updateValueElement(newValue);
    sliderInput.set(newValue);
  });
  
  // Only record to undo stack when drag ends (performance optimization)
  slider.on("slideStop", (change) => {
    const newValue = change.newValue;
    if (dragStartValue !== newValue) {
      const undoArr = [...undoStack.get()];
      undoArr.push({ id: spec.id, prevValue: dragStartValue, newValue });
      undoStack.set(undoArr);
      redoStack.set([]);
      updateUndoRedoButtons();
    }
  });
  
  return div; // fm
}
