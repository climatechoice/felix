/**
 * TextboxInput.js
 * Extracted from InputsUI.js - numeric textbox input control
 * Alternative to slider for precise numeric entry
 */

import $ from "jquery";
import { str, format, createInfoIcon, createGraphPreviewButton } from "../../lib/utils.js";
import { config as coreConfig } from "@core";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Renders a numeric textbox input instead of a slider.
 * Allows direct numeric entry with validation, min/max clamping, and step alignment.
 * 
 * @param {Object} textboxInput - Input instance with spec
 * @param {jQuery} container - Container element to append to
 */
export function addTextboxItem(textboxInput, container = $("#inputs-content")) {
  const spec = textboxInput.spec;

  // Prevent duplicates
  if (addedSliderIds.get().includes(spec.id)) return;
  addedSliderIds.set([...addedSliderIds.get(), spec.id]);

  const inputElemId = `input-${spec.id}`;
  const inputValue = $(`<div class="input-value"/>`);

  const infoIcon = createInfoIcon(spec.hoverDescription);

  let muiIconElem = null;
  if (spec.muiIcon) {
    muiIconElem = $(
      `<span class="material-icons-two-tone mui-icon">${spec.muiIcon}</span>`
    );
  }

  const sliderTitleAndInfoContainer = $(
    '<div class="slider-title-and-info-container"/>'
  ).append([
    muiIconElem,
    $(`<div class="input-title">${str(spec.labelKey)}</div>`),
    infoIcon,
  ].filter((el) => el !== null));
  // Append preview button if a matching graph exists (place before extensive/book icon if present)
  try {
    const graphSpec = coreConfig.graphs.get(spec.id);
    if (graphSpec) {
      const previewBtn = createGraphPreviewButton(spec.id);
      if (previewBtn) {
        if (typeof extensiveInfoIcon !== 'undefined' && extensiveInfoIcon && extensiveInfoIcon.before) {
          extensiveInfoIcon.before(previewBtn);
        } else if (infoIcon && infoIcon.after) {
          infoIcon.after(previewBtn);
        } else {
          sliderTitleAndInfoContainer.append(previewBtn);
        }
      }
    }
  } catch (e) {}

  // For textbox we don't want to repeat the numeric value on the right (the
  // value is already shown in the textbox). Only show units on the right.
  const valueUnitsContainer = $(`<div class="value-units-container"/>`);

  // Determine decimal precision from spec.format (preferred) or spec.step (fallback)
  const getDecimals = () => {
    try {
      if (spec.format && typeof spec.format === 'string') {
        const m = spec.format.match(/\.(0+)/);
        if (m && m[1]) return m[1].length;
      }
      if (spec.step !== undefined && spec.step !== null) {
        const s = String(spec.step);
        if (s.includes('.')) return s.split('.')[1].length;
      }
    } catch (e) {
      /* ignore */
    }
    return 0;
  };
  const decimals = getDecimals();

  // Create the numeric textbox element
  const stepAttr = spec.step !== undefined && spec.step !== null ? spec.step : 1;
  const $textboxInputElem = $(`<input id="${inputElemId}" class="textbox-input" type="number" step="${stepAttr}" />`);

  // Append textbox first, then units so both appear on the right
  valueUnitsContainer.append($textboxInputElem, $(`<div class="input-units">${str(spec.unitsKey)}</div>`));

  // Title row: left = title/info, middle = flexible spacer, right = valueUnitsContainer
  const spacer = $(`<div class="input-slider-spacer" style="flex:1;"></div>`);
  const titleRow = $(`<div class="input-title-row"/>`).append([
    sliderTitleAndInfoContainer,
    spacer,
    valueUnitsContainer,
  ]);

  const div = $(`<div class="input-item textbox-item"/>`).append([
    titleRow,
    $(`<div class="input-desc">${spec.descriptionKey ? str(spec.descriptionKey) : ""}</div>`),
  ]);

  container.append(div);

  // Initialize value (formatted according to spec.format)
  const currentValue = textboxInput.get();
  const $inputElem = $(`#${inputElemId}`);
  if (currentValue !== null && currentValue !== undefined && String(currentValue) !== "") {
    const n = Number(currentValue);
    if (!Number.isNaN(n)) {
      $inputElem.val(format(n, spec.format));
    } else {
      $inputElem.val(currentValue);
    }
  }

  const updateValueElement = (v) => {
    inputValue.text(format(v, spec.format));
  };
  updateValueElement(currentValue);

  // Parse and clamp value to spec constraints
  function parseAndClamp(val) {
    if (val === null || val === undefined || val === "") return null;
    let n = Number(val);
    if (Number.isNaN(n)) return null;
    if (spec.minValue !== undefined && n < spec.minValue) n = spec.minValue;
    if (spec.maxValue !== undefined && n > spec.maxValue) n = spec.maxValue;
    // Align to step if provided
    if (spec.step) {
      const step = spec.step;
      const base = spec.minValue !== undefined ? spec.minValue : 0;
      n = Math.round((n - base) / step) * step + base;
    }
    return n;
  }

  $inputElem.on("change", function () {
    const raw = $(this).val();
    const parsed = parseAndClamp(raw);
    if (parsed === null) {
      // restore previous valid value
      const prev = textboxInput.get();
      if (prev !== null && prev !== undefined && String(prev) !== "") {
        const pn = Number(prev);
        if (!Number.isNaN(pn)) $(this).val(format(pn, spec.format));
        else $(this).val(prev);
      } else {
        $(this).val("");
      }
      return;
    }
    // Round to the desired decimal places to avoid floating-point precision issues
    const rounded = typeof parsed === 'number' && Number.isFinite(parsed) 
      ? Number(parsed.toFixed(decimals)) 
      : parsed;
    // Format the committed value for display using spec.format
    const formatted = format(rounded, spec.format);
    $(this).val(formatted);
    updateValueElement(rounded);
    const prevValue = textboxInput.get();
    const newValue = rounded;
    const undoArr = [...undoStack.get()];
    undoArr.push({ id: spec.id, prevValue, newValue });
    undoStack.set(undoArr);
    redoStack.set([]);
    updateUndoRedoButtons();
    textboxInput.set(newValue);
  });

  // Handle Enter key to commit
  $inputElem.on("keydown", function (e) {
    if (e.key === "Enter") {
      $(this).trigger("change");
      $(this).blur();
    }
  });

  return div;
}
