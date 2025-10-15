import $ from "jquery";

import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";

// TODO: perhaps remove these, since I'm using them in lib/utils.js
import { marked } from "marked";
import katexExtension from "marked-katex-extension";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

import {
  str,
  format,
  loadMarkdownByName,
  resolveLocalImages,
  createPopupBox,
  createInfoIcon,
} from "../lib/utils.js";

// TODO: simply import coreConfig from @core instead.
import { config as coreConfig } from "@core";

import { addedSliderIds } from "../stores/inputs-store.js";
import { undoStack, redoStack } from "../stores/undo-redo-store.js";
/*
 * model and modelB are not used in the inputs.
 * Only activeModel is used.
 */
import { activeModel } from "../stores/model-store.js";

// TODO: should i put these or not ?
// resetActiveModelInputs,
// resetAllModelsInputs,

// ! nomizw OXI: formatInputChange, showChangedInputs,

/*
 *  EVERY ADD{X}ITEM
 */

function addSliderItem(sliderInput, container = $("#inputs-content")) {
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

  // Update the model input when the slider is dragged or the track is clicked
  slider.on("change", (change) => {
    const prevValue = sliderInput.get();
    const newValue = change.newValue;
    const start = spec.defaultValue;
    const end = newValue;
    slider.setAttribute("rangeHighlights", [{ start, end }]);
    updateValueElement(newValue);
    // Push to undo stack, clear redo stack
    const undoArr = [...undoStack.get()];
    undoArr.push({ id: spec.id, prevValue, newValue });
    undoStack.set(undoArr);
    redoStack.set([]);
    sliderInput.set(newValue);
  });
  return div; // fm
}

function addSwitchItem(switchInput) {
  const spec = switchInput.spec;
  const inputElemId = `input-${spec.id}`;

  // Create info tooltip for this Switch
  const infoIcon = createInfoIcon(spec.hoverDescription);

  // Create button container
  const buttonContainer = $('<div class="switch-button-container"></div>');
  const onButton = $(
    `<button class="switch-button">${str(spec.labelKey)}</button>`
  );
  const offButton = $(
    `<button class="switch-button">${spec.secondLabel}</button>`
  );

  // Create slider containers
  const onSlidersContainer = $(
    '<div class="slider-group-container on-sliders"></div>'
  );
  const offSlidersContainer = $(
    '<div class="slider-group-container off-sliders"></div>'
  );

  function updateUI(isOn) {
    // Update button states
    onButton.toggleClass("active", isOn);
    offButton.toggleClass("active", !isOn);

    // Toggle slider visibility
    onSlidersContainer.toggle(isOn);
    offSlidersContainer.toggle(!isOn);

    // Update model value
    const prevValue = switchInput.get();
    const newValue = isOn ? spec.onValue : spec.offValue;
    const undoArr = [...undoStack.get()];
    undoArr.push({ id: spec.id, prevValue, newValue });
    undoStack.set(undoArr);
    redoStack.set([]);
    switchInput.set(newValue);
  }

  // Initial setup
  const initialValue = switchInput.get() === spec.onValue;
  updateUI(initialValue);

  // Button click handlers
  onButton.on("click", () => updateUI(true));
  offButton.on("click", () => updateUI(false));

  // Create switch UI
  const div = $(`<div class="input-item switch-item"/>`).append([
    buttonContainer.append(offButton, infoIcon, onButton),
    $(
      `<div class="input-desc">${
        spec.descriptionKey ? str(spec.descriptionKey) : ""
      }</div>`
    ),
    $('<div class="switch-sliders-container"/>').append(
      offSlidersContainer,
      onSlidersContainer
    ),
  ]);

  $("#inputs-content").append(div);

  // Add sliders to their respective containers
  if (spec.slidersActiveWhenOn) {
    const groupMap = {};
    spec.slidersActiveWhenOn.forEach((sliderId) => {
      const inputSpec = coreConfig.inputs.get(sliderId);
      if (!inputSpec || !inputSpec.inputGroup) return;

      if (!groupMap[inputSpec.inputGroup]) {
        groupMap[inputSpec.inputGroup] = [];
      }
      groupMap[inputSpec.inputGroup].push(inputSpec);
    });

    // console.log("Switch On groups: ", groupMap);

    Object.entries(groupMap).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs, onSlidersContainer);
    });
  }

  if (spec.slidersActiveWhenOff) {
    const groupMap = {};
    spec.slidersActiveWhenOff.forEach((sliderId) => {
      const inputSpec = coreConfig.inputs.get(sliderId);
      if (!inputSpec || !inputSpec.inputGroup) return;

      if (!groupMap[inputSpec.inputGroup]) {
        groupMap[inputSpec.inputGroup] = [];
      }
      groupMap[inputSpec.inputGroup].push(inputSpec);
    });

    // console.log("Switch Off groups: ", groupMap);

    Object.entries(groupMap).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs, offSlidersContainer);
    });
  }
}

/*
 * Renders a "segmented control" (a row of mutually-exclusive buttons)
 * in place of a slider, based on spec.rangeDividers and spec.rangeLabelKeys.
 */
function addSegmentedItem(inputInstance, container = $("#inputs-content")) {
  const spec = inputInstance.spec;

  // ! Skip if this slider has already been added
  if (addedSliderIds.get().includes(spec.id)) {
    return;
  }
  // ! Mark as added
  addedSliderIds.set([...addedSliderIds.get(), spec.id]);

  const currentValue = inputInstance.get();
  // console.log("initial value of segmented: ", currentValue);

  // Build segment values array: first min, then dividers, then maybe max
  // TODO: check if this is the same as the buildSegmentValues function and replace.
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
      `<button type="button" class="segmented-button" data-value="${targetValue}" data-is-default="${isDefaultValue}">${str(
        labelKey
      )}</button>`
    );
    if (currentValue === targetValue) btn.addClass("active");

    btn.on("click", () => {
      const prevValue = inputInstance.get();
      const newValue = targetValue;
      const undoArr = [...undoStack.get()];
      undoArr.push({ id: spec.id, prevValue, newValue });
      undoStack.set(undoArr);
      redoStack.set([]);
      inputInstance.set(newValue);
      segmentsContainer.find(".segmented-button").removeClass("active");
      btn.addClass("active");
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

function addCombinedSlider(groupInputs, container) {
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

  // const sliderRow = $(`
  //   <div class="input-slider-row">
  //     <input id="${sliderId}" class="slider" type="text"/>
  //   </div>
  // `);
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

  // Update logic
  slider.on("change", (change) => {
    const prevValues = [startInput.get(), endInput.get()];
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

    // Push to undo stack, clear redo stack
    const undoArr = [...undoStack.get()];
    undoArr.push({ ids: [startSpec.id, endSpec.id], prevValues, newValues: [startValue, endValue] });
    undoStack.set(undoArr);
    redoStack.set([]);

    // Update model values
    startInput.set(startValue);
    endInput.set(endValue);
  });
}

function addCombined2Slider(groupInputs, container = $("#inputs-content")) {
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

  // Add change handler
  slider.on("change", (change) => {
    // Save previous values for all inputs
    const prevValues = inputs.map(input => input.get());
    updateSegments(change.newValue);
    // After update, get new values
    const newValues = inputs.map(input => input.get());
    // Push to undo stack, clear redo stack
    const undoArr = [...undoStack.get()];
    const ids = groupInputs.map(spec => spec.id);
    undoArr.push({ ids, prevValues, newValues });
    undoStack.set(undoArr);
    redoStack.set([]);
  });

  // Initial update
  updateSegments(slider.getValue());
}

/*
 * This is a makeshift solution for showing
 * a slider item as a plain label (without the slider).
 */
function addSimpleLabelItem(sliderInput, container = $("#inputs-content")) {
  const spec = sliderInput.spec;

  if (addedSliderIds.get().includes(spec.id)) {
    // Check if already added
    return; // Skip if duplicate
  }
  addedSliderIds.set([...addedSliderIds.get(), spec.id]); // Mark as added

  // Create info icon if description exists
  // and Position it correctly, inside the viewport (!).
  const infoIcon = createInfoIcon(spec.hoverDescription);

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
    ].filter((el) => el !== null)
  );

  // ! removed slider row from here
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
  return div; // fm
}

/**
 * Renders a numeric textbox input instead of a slider.
 * Behaves similarly to addSliderItem but uses an <input type="number"> allowing
 * the user to type values. It respects spec.minValue, spec.maxValue, spec.step
 * and spec.format for display. Works for standalone and dropdown contexts.
 */
function addTextboxItem(textboxInput, container = $("#inputs-content")) {
  const spec = textboxInput.spec;

  // Debug: log when attempting to add a textbox
  try {
    // debug log removed
  } catch (e) {
    /* ignore */
  }

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

  // For textbox we don't want to repeat the numeric value on the right (the
  // value is already shown in the textbox). Only show units on the right.
  // Create the right side container and append the textbox input into it so
  // the textbox is flushed to the right next to the units.
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

  // Create the numeric textbox element (compact). Use a subtle gray border instead of red.
  const stepAttr = spec.step !== undefined && spec.step !== null ? spec.step : 1;
  // Compact textbox: height ~20px per user's request
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

  // Initialize value (rounded to the computed decimals)
  const currentValue = textboxInput.get();
  const $inputElem = $(`#${inputElemId}`);
  if (currentValue !== null && currentValue !== undefined && String(currentValue) !== "") {
    const n = Number(currentValue);
    if (!Number.isNaN(n)) {
      $inputElem.val(n.toFixed(decimals));
    } else {
      $inputElem.val(currentValue);
    }
  }

  const updateValueElement = (v) => {
    inputValue.text(format(v, spec.format));
  };
  updateValueElement(currentValue);

  // When typing or changing the textbox, update the model and displayed value.
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
        if (!Number.isNaN(pn)) $(this).val(pn.toFixed(decimals));
        else $(this).val(prev);
      } else {
        $(this).val("");
      }
      return;
    }
    // Format the committed value to the desired decimal places
    const formatted = typeof parsed === 'number' && Number.isFinite(parsed) ? parsed.toFixed(decimals) : parsed;
    $(this).val(formatted);
    updateValueElement(parsed);
    const prevValue = textboxInput.get();
    const newValue = parsed;
    const undoArr = [...undoStack.get()];
    undoArr.push({ id: spec.id, prevValue, newValue });
    undoStack.set(undoArr);
    redoStack.set([]);
    textboxInput.set(newValue);
  });

  // Also handle Enter key to commit
  $inputElem.on("keydown", function (e) {
    if (e.key === "Enter") {
      $(this).trigger("change");
      // optional: blur to hide mobile keyboards
      $(this).blur();
    }
  });

  return div;
}

function createDropdownGroup(
  mainInputSpec,
  assumptionInputs,
  assumptionCombinedSliders,
  assumptionCombined2Sliders,
  container = $("#inputs-content")
) {
  // Add main input
  const mainInputInstance = activeModel.get().getInputForId(mainInputSpec.id);
  // ! For some reason
  // console.log("mainInputInstance: ", mainInputInstance);
  // ! check if already added
  if (addedSliderIds.get().includes(mainInputSpec.id)) {
    // Check if already added
    return; // ! Skip if duplicate
  }
  // addedSliderIds.add(mainInputSpec.id);

  const dropdownContainer = $('<div class="input-dropdown-group">');
  const dropdownHeader = $('<div class="dropdown-header">');
  const dropdownContent = $(
    '<div class="dropdown-content" style="display: none;">'
  );
  const expandButton = $(`
    <button class="expand-button">
      <span class="material-icons">expand_more</span>
    </button>
  `);
  let allowArrowToggle = true;

  // Append dropdownContainer to DOM first
  container.append(dropdownContainer);
  dropdownContainer.append(dropdownHeader, dropdownContent);

  // Here, we check if input is Segmented Item OR just a Normal Slider (! OR just a Label)
  // TODO: fix this makeshift solution for putting just a label in dropdown main
  if (mainInputSpec.isSegmented !== "yes") {
    if (mainInputSpec.secondaryType === "dropdown main") {
      // this is a normal slider
      // console.log("main input spec: ", mainInputSpec);
  const sliderDiv = addSliderItem(mainInputInstance, dropdownHeader);

      // Add expand button
      if (sliderDiv) {
        sliderDiv.find(".input-title-row").prepend(expandButton);
      } else {
        console.error("Slider not created for:", mainInputSpec.id);
      }
    } else if (mainInputSpec.secondaryType === "dropdown main label") {
      // TODO: fix this makeshift solution for putting just a label in dropdown main
      const simpleLabelDiv = addSimpleLabelItem(
        mainInputInstance,
        dropdownHeader
      );

      // Add expand button
      if (simpleLabelDiv) {
        simpleLabelDiv.find(".input-title-row").prepend(expandButton);
      } else {
        console.error("Simple Label not created for:", mainInputSpec.id);
      }
    } else if (mainInputSpec.secondaryType === "dropdown main textbox" || (mainInputSpec.secondaryType && mainInputSpec.secondaryType.includes("textbox"))) {
      // main is a textbox instead of a slider
      const textboxDiv = addTextboxItem(mainInputInstance, dropdownHeader);
      if (textboxDiv) {
        textboxDiv.find(".input-title-row").prepend(expandButton);
        // Auto-expand dropdown so textbox is visible for debugging
        dropdownContent.show();
        expandButton.find('.material-icons').text('expand_less');
      } else {
        console.error("Textbox not created for:", mainInputSpec.id);
      }
    } else {
      console.warn("this secondary type is not yet supported.");
    }
  } else {
    // this is a segmented button
    const segmentedDiv = addSegmentedItem(mainInputInstance, dropdownHeader);
    if (!segmentedDiv) {
      console.error("segmentedDiv not created for:", mainInputSpec.id);
    } else {
      // Bind click handler: open on 'Custom', close only if another segment (not Custom) in this group is clicked
      segmentedDiv.find('.segmented-button').on('click', function (e) {
        e.stopPropagation();
        const isCustom = $(this).text().trim().toLowerCase() === 'custom';
        if (isCustom) {
          // Open this dropdown (if not already open)
          if (!dropdownContent.is(':visible')) {
            dropdownContent.slideDown(200);
            dropdownContainer.find('.expand-button .material-icons').text('expand_less');
          }
        } else {
          // Only close if this dropdown is open and the click is for a non-Custom segment in this group
          if (dropdownContent.is(':visible')) {
            dropdownContent.slideUp(150);
            dropdownContainer.find('.expand-button .material-icons').text('expand_more');
          }
        }
      });
      // Disable arrow toggle for segmented mains and do not prepend the arrow
      allowArrowToggle = false;
    }
  }

  // Add assumption inputs
  assumptionInputs.forEach((inputSpec) => {
    const input = activeModel.get().getInputForId(inputSpec.id);
    if (input.kind === "slider") {
      if (inputSpec.isSegmented === "yes") {
        addSegmentedItem(input, dropdownContent);
      } else {
        // If this assumption is defined to be a textbox, render textbox
        if (inputSpec.secondaryType && inputSpec.secondaryType.includes("textbox")) {
          addTextboxItem(input, dropdownContent);
        } else {
          addSliderItem(input, dropdownContent);
        }
      }
    } else if (input.kind === "switch") addSwitchItem(input, dropdownContent);
  });

  // Add assumption combined sliders
  if (assumptionCombinedSliders.length > 0) {
    // Group combined sliders by their title (if specified)
    const combinedGroups = {};
    const combinedTitleRegex = /dropdown combined(?: \((.*?)\))?$/;
    assumptionCombinedSliders.forEach((inputSpec) => {
      const titleMatch = inputSpec.secondaryType.match(combinedTitleRegex);
      const titleKey = titleMatch && titleMatch[1] ? titleMatch[1] : inputSpec.inputGroup; // Use inputGroup as fallback key
      if (!combinedGroups[titleKey]) {
        combinedGroups[titleKey] = [];
      }
      combinedGroups[titleKey].push(inputSpec);
    });

    // Add each group of combined sliders
    Object.values(combinedGroups).forEach((group) => {
      if (group.length === 2) { // Combined sliders expect exactly 2 inputs
        addCombinedSlider(group, dropdownContent);
      } else {
        console.warn("Combined slider group in dropdown has an unexpected number of inputs:", group);
      }
    });
  }

  // Add assumption combined2 sliders
  if (assumptionCombined2Sliders.length > 0) {
    // Group combined2 sliders by their title
    const combined2Groups = {};
    assumptionCombined2Sliders.forEach((inputSpec) => {
      const titleMatch = inputSpec.secondaryType.match(
        /dropdown combined2 \((.*?)\)/
      );
      if (titleMatch) {
        const title = titleMatch[1];
        if (!combined2Groups[title]) {
          combined2Groups[title] = [];
        }
        combined2Groups[title].push(inputSpec);
      }
    });

    // Add each group of combined2 sliders
    Object.values(combined2Groups).forEach((group) => {
      if (group.length >= 2) {
        addCombined2Slider(group, dropdownContent);
      }
    });
  }

  // Toggle handler (disabled when main segmented requests custom toggle)
  if (allowArrowToggle) {
    let isExpanded = false;
    expandButton.on("click", (e) => {
      e.stopPropagation();
      isExpanded = !dropdownContent.is(':visible');
      dropdownContent.slideToggle(200);
      expandButton
        .find(".material-icons")
        .text(isExpanded ? "expand_less" : "expand_more");
    });
  } else {
    // Prevent arrow from toggling; keep icon static (still attached in DOM elsewhere)
    expandButton.on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  return dropdownContainer;
}

// jquery Click event for Selecting Input Category (Diet Change, Food Waste, Alternative Protein)
$("#input-category-selector-container").on(
  "click",
  ".input-category-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".input-category-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Call the function to update the graphs
    initInputsUI(selectedCategory);
  }
);


/*
 * Calls the appropriate add{X}Item function
 * according to the type of input.
 * These are not part of any dropdown nor combined sliders.
 */
function renderStandaloneInput(inputSpec, container = $("#inputs-content")) {
  const input = activeModel.get().getInputForId(inputSpec.id);
  // renderStandaloneInput called for debugging removed

  if (input.kind === "slider") {
    // both normal sliders and segmented buttons
    // are defined as sliders in inputs.csv
    if (inputSpec.isSegmented === "yes") {
      // segmented log removed
      // slider as segmented button
      addSegmentedItem(input, container);
    } else {
      // normal slider
      // If the spec requests a textbox UI instead of a slider, render textbox
      if (inputSpec.secondaryType && inputSpec.secondaryType.includes("textbox")) {
        addTextboxItem(input, container);
      } else {
        addSliderItem(input, container);
      }
    }
  } else if (input.kind === "switch") {
    // ! switch currently can only have as its container the #inputs-section
    addSwitchItem(input);
  } else if (input.kind === "textbox") {
    // Support explicit textbox kind (if defined elsewhere)
    addTextboxItem(input, container);
  } else {
    console.warn("This input kind is not supported.");
  }
}

/*
 * Function to prepare and render one "input group".
 * Each "input group" is either:
 * a) Two sliders which will be combined into one
 * b) A Dropdown, which contains a "secondary type" = "dropdown main" || "dropdown main label"
 *    and (optionally) one or more "secondary type" = "dropdown assumptions" || "dropdown combined"
 *
 * This function also renders the "standalone items" that are part of the group.
 */
function renderInputGroup(
  groupName,
  groupInputs,
  container = $("#inputs-content")
) {
  // Define the regex for combined types once
  const combinedTypeCheckPattern = /^(?:dropdown )?combined(?: \((.*?)\))?$/;

  // Handle "standalone" combined sliders first
  const firstInputSecondaryType = groupInputs[0]?.secondaryType;
  if (firstInputSecondaryType && combinedTypeCheckPattern.test(firstInputSecondaryType)) {
    // If it matches the combined pattern (e.g., "combined" or "combined (title)")
    // and it's not a dropdown combined (which is handled later)
    if (!firstInputSecondaryType.startsWith("dropdown ")) {
      addCombinedSlider(groupInputs, container);
      return;
    }
  }

  // TODO: These should be similar to the above, where we only check if secondaryType === "combined2".
  // Handle "standalone" combined2 sliders
  if (groupInputs[0]?.secondaryType?.startsWith("dropdown combined2")) {
    // Extract the title from secondaryType (format: "dropdown combined2 (title)")
    const titleMatch = groupInputs[0].secondaryType.match(
      /dropdown combined2 \((.*?)\)/
    );
    if (titleMatch) {
      const combinedTitle = titleMatch[1];
      // Find all inputs that share this title
      const combinedInputs = groupInputs.filter(
        (input) =>
          input.secondaryType === `dropdown combined2 (${combinedTitle})`
      );
      if (combinedInputs.length >= 2) {
        addCombined2Slider(combinedInputs, container);
        return;
      }
    }
  }

  // Handle dropdowns
  const standaloneInputs = [];
  let mainInput = null;
  const assumptionInputs = [];
  const assumptionCombinedSliders = [];
  const assumptionCombined2Sliders = [];

  groupInputs.forEach((inputSpec) => {
    // Treat explicit 'textbox' secondaryType as a standalone input
    if (inputSpec.secondaryType === "without" || inputSpec.secondaryType === "textbox") {
      if (inputSpec.secondaryType === "textbox") {
        // standalone textbox log removed
      }
      standaloneInputs.push(inputSpec);
    } else if (
      inputSpec.secondaryType === "dropdown main" ||
      inputSpec.secondaryType === "dropdown main label"
    ) {
      mainInput = inputSpec;
    } else if (inputSpec.secondaryType === "dropdown assumptions" || (inputSpec.secondaryType && inputSpec.secondaryType.includes("dropdown assumptions"))) {
      assumptionInputs.push(inputSpec);
    } else if (inputSpec.secondaryType === "dropdown combined" || 
               (inputSpec.secondaryType?.startsWith("dropdown combined (") && !inputSpec.secondaryType?.startsWith("dropdown combined2"))) {
      // This will catch "dropdown combined" and "dropdown combined (title)" but NOT "dropdown combined2"
      assumptionCombinedSliders.push(inputSpec);
    } else if (inputSpec.secondaryType?.startsWith("dropdown combined2")) {
      assumptionCombined2Sliders.push(inputSpec);
    }
  });

  // Process main input with dropdown
  if (mainInput) {
    createDropdownGroup(
      mainInput,
      assumptionInputs,
      assumptionCombinedSliders,
      assumptionCombined2Sliders,
      container
    );
  }

  // Add standalone inputs
  standaloneInputs.forEach((inputSpec) => {
    renderStandaloneInput(inputSpec, container);
  });
}

// Initialize the inputs section
export function initInputsUI(category) {
  $("#inputs-content").empty();
  addedSliderIds.set([]); // Reset tracked slider IDs

  // Group inputs by categoryId and input group
  const dynamicInputCategories = {};
  for (const inputSpec of coreConfig.inputs.values()) {
    const inputCategory = inputSpec.categoryId;
    const inputGroup = inputSpec.inputGroup;
    if (!inputCategory || !inputGroup) continue;

    if (!dynamicInputCategories[inputCategory]) {
      dynamicInputCategories[inputCategory] = {};
    }
    if (!dynamicInputCategories[inputCategory][inputGroup]) {
      dynamicInputCategories[inputCategory][inputGroup] = [];
    }
    dynamicInputCategories[inputCategory][inputGroup].push(inputSpec);
  }

  const categoryGroups = dynamicInputCategories[category] || {};
  // init logs removed

  if (coreConfig.inputs.size > 0) {
    // for each "input group", render a dropdown
    Object.entries(categoryGroups).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs);
    });
  } else {
    const msg = `No sliders configured. Edit 'config/inputs.csv' to get started.`;
    $("#inputs-content").html(`<div style="padding-top: 10px">${msg}</div>`);
  }
}
