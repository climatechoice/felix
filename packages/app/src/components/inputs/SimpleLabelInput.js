/**
 * SimpleLabelInput.js
 * Extracted from InputsUI.js - renders label-only display without slider
 * Used for informational headers or non-interactive items
 */

import $ from "jquery";
import { str, createInfoIcon } from "../../lib/utils.js";
import { addedSliderIds } from "../../stores/inputs-store.js";

/**
 * Creates a simple label item without any input control.
 * Just shows the title and optional description - no slider or interaction.
 * 
 * @param {Object} sliderInput - Input instance with spec
 * @param {jQuery} container - Container element to append to
 */
export function addSimpleLabelItem(sliderInput, container = $("#inputs-content")) {
  const spec = sliderInput.spec;

  if (addedSliderIds.get().includes(spec.id)) {
    return; // Skip if duplicate
  }
  addedSliderIds.set([...addedSliderIds.get(), spec.id]);

  // Create info icon if description exists
  const infoIcon = createInfoIcon(spec.hoverDescription);

  // Create Material Icon element if defined
  let muiIconElem = null;
  if (spec.muiIcon) {
    muiIconElem = $(
      `<span class="material-icons-two-tone mui-icon">${spec.muiIcon}</span>`
    );
  }

  // Title + Info Icon container
  const sliderTitleAndInfoContainer = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      muiIconElem,
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
    ].filter((el) => el !== null)
  );

  // No slider row - just title
  const titleRow = $(`<div class="input-title-row"/>`).append(
    sliderTitleAndInfoContainer
  );

  const div = $(`<div class="input-item"/>`).append([
    titleRow,
    $(
      `<div class="input-desc">${
        spec.descriptionKey ? str(spec.descriptionKey) : ""
      }</div>`
    ),
  ]);

  container.append(div);
  return div;
}
