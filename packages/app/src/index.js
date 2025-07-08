import $ from "jquery";
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "material-icons/iconfont/material-icons.css";
import { marked } from "marked";
import katexExtension from "marked-katex-extension";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

import "./index.css";

import choiceLogo from "./imgs/choice-png.png";
import iiasaLogo from "./imgs/iiasa-png.png";
import felixLogo from "./imgs/felix-png.png";

import { config as coreConfig, createModel } from "@core";
import enStrings from "@core-strings/en";

// import { initOverlay } from "./dev-overlay";
import { GraphView } from "./graph-view";

// TODO: All store imports will go here:
import { selectedGraphCount, layoutConfig } from "./stores/graph-store";

// Import markdown files (as raw files)
const markdownModules = import.meta.glob("./markdowns/*.md", {
  query: "?raw",
  import: "default",
});

// Import markdown diagrams as URLs (not raw)
const imageModules = import.meta.glob("./markdowns/diagrams/*", {
  eager: true,
  import: "default",
});

/*
 * Here, we tell marked to use KaTeX in order to
 * render latex equations in markdown files correctly.
 */
marked.use(katexExtension());

let model;
let modelB;
let activeModel;

let graphViews = [];

/*
 * This is a custom solution, because the initial addSwitchItem implementation of
 * SDEverywhere added the sliders Twice for each input.
 * a) It first adds the sliders defined INSIDE the switch row
 * b) It then adds the sliders defined in their own row in inputs.csv
 *
 * So, with this addedSliderIds Set,
 * I first check if this slider has already been added, to prevent duplicates.
 */
const addedSliderIds = new Set(); // Track which slider IDs have been added

/**
 * Return the base (English) string for the given key.
 */
function str(key) {
  return enStrings[key];
}

/**
 * Return a formatted string representation of the given number.
 */
function format(num, formatString) {
  switch (formatString) {
    case ".1f":
      return num.toFixed(1);
    case ".2f":
      return num.toFixed(2);
    default:
      return num.toString();
  }
}

/* Function to load markdown file dynamically by name */
async function loadMarkdownByName(name) {
  const filePath = `./markdowns/${name}.md`;
  const loader = markdownModules[filePath];
  if (!loader) {
    console.warn(`Markdown file "${name}.md" not found.`);
    return null;
  }
  return await loader(); // Loads and returns the content as string
}

/*
 * This function processes the markdown content and
 * replaces all the relative image paths with the final Vite asset URLs.
 */
function resolveLocalImages(mdContent) {
  // Replace src="diagrams/..." with resolved Vite asset paths
  return mdContent.replace(/src="diagrams\/([^"]+)"/g, (match, filename) => {
    const relativePath = `./markdowns/diagrams/${filename}`;
    const imageUrl = imageModules[relativePath];
    if (!imageUrl) {
      console.warn(`Image "${filename}" not found in diagrams folder.`);
      return match;
    }
    return `src="${imageUrl}"`;
  });
}

/*
 * fm - Function to position tooltip correctly
 */

function positionTooltip(tooltip) {
  const icon = tooltip.siblings(".info-icon");
  const iconRect = icon[0].getBoundingClientRect();
  const tooltipElem = tooltip[0];

  // Get tooltip dimensions
  const tooltipWidth = tooltipElem.offsetWidth;
  const tooltipHeight = tooltipElem.offsetHeight;

  // Default position: below the icon, centered
  let top = iconRect.bottom + 5;
  let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2;

  // Adjust for right edge
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 5;
  }

  // Adjust for left edge
  if (left < 0) {
    left = 5;
  }

  // Adjust for bottom edge
  if (top + tooltipHeight > window.innerHeight) {
    top = iconRect.top - tooltipHeight - 5;
  }

  // Apply corrected position
  tooltip.css({
    top: `${top}px`,
    left: `${left}px`,
  });
}

/*
 * Function for the creation of Info Icon
 */

function createInfoIcon(hoverText) {
  if (!hoverText) return null;

  const infoIconContainer = $('<div class="info-icon-container">');
  const icon = $('<div class="info-icon">i</div>');

  // Parse Markdown to HTML
  const parsedHTML = marked.parse(hoverText);
  const tooltip = $(`<div class="tooltip">${parsedHTML}</div>`);

  infoIconContainer.append(icon, tooltip);

  icon.on("mouseenter", function () {
    positionTooltip(tooltip);
    tooltip.css("visibility", "visible");
  });

  icon.on("mouseleave", function () {
    tooltip.css("visibility", "hidden");
  });

  return infoIconContainer;
}

/*
 * Function to add Popup Box w/ extensive Markdown Description
 * and position, which can be "left", "middle" (default), "right".
 * When position = "left", no popup-overlay is added.
 */
function createPopupBox(extensiveText, position = "middle") {
  if (!extensiveText) return null;

  // Remove any existing popup or overlay
  $(".popup-overlay, .popup").remove();

  // Parse Markdown to HTML
  const parsedHTML = marked.parse(extensiveText);

  // Create popup box, with "position" class added dynamically
  const popup = $(`<div class="popup popup-${position}">`).html(parsedHTML);

  // Add close button with Material Icon
  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);
  // Always remove the popup itself when X is clicked
  closeBtn.on("click", () => popup.remove());
  popup.prepend(closeBtn);

  // If "left", skip overlay entirely
  // TODO: perhaps add position === "right" here
  if (position === "left") {
    // Append the popup directly, no overlay, so clicks pass through
    $("body").append(popup);
    return popup;
  }

  // otherwise (middle/right popups) stay the same.

  // Create overlay
  const overlay = $('<div class="popup-overlay">');

  // Remove the overlay when clicking the X button
  closeBtn.on("click", () => overlay.remove());

  // Close on clicking outside the popup
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) {
      overlay.remove();
    }
  });

  // Assemble and show popup
  overlay.append(popup);
  $("body").append(overlay);

  return overlay;
}

/*
 * Function to add Scenario Info Icon
 */

function addScenarioInfoIcon() {
  // Create the info icon with tooltip text
  const scenarioInfo = createInfoIcon(
    "Switch between Scenario 1 and Scenario 2 inputs."
  );

  // Append the info icon to the scenario info container
  $("#scenario-info-container").append(scenarioInfo);

  // Get references to the icon and tooltip
  const scenarioIcon = $("#scenario-info-container .info-icon");
  const scenarioTooltip = $("#scenario-info-container .tooltip");

  // Add hover event listeners for tooltip positioning
  scenarioIcon
    .on("mouseenter", function () {
      positionTooltip(scenarioTooltip);
      scenarioTooltip.css("visibility", "visible");
    })
    .on("mouseleave", function () {
      scenarioTooltip.css("visibility", "hidden");
    });
}

/*
 * NAVIGATION BAR LOGIC
 */

// Inject a 50px-tall nav bar split into three equal sections
function loadNavBar() {
  const $navBar = $("#nav-bar");
  $navBar.empty(); // clear any existing content

  const $nav = $("<nav></nav>");
  $navBar.append($nav);

  /*
   * Section 1
   */
  const $sect1 = $('<div class="nav-section first"></div>');

  // Toggle switch
  const $toggleSwitch = $(`
  <label class="toggle-switch">
    <input type="checkbox">
    <span class="slider"></span>
  </label>
`);
  // Mode text
  const $modeLabel = $('<span class="mode-label">Single-scenario mode</span>');

  // Attach event listener
  $toggleSwitch
    .find("input")
    .on("change", (e) => handleModeToggle(e, $modeLabel));

  // Append to section
  $sect1.append($toggleSwitch, $modeLabel);

  // Reset current scenario button
  const $resetCurrentBtn = $(`
    <button>
      <span class="material-icons">refresh</span>
      <span>Current</span>
    </button>
  `);
  $resetCurrentBtn.on("click", () => resetActiveModelInputs());
  $sect1.append($resetCurrentBtn);

  // Reset all scenarios button
  const $resetAllBtn = $(`
    <button>
      <span class="material-icons">refresh</span>
      <span>All</span>
    </button>
  `);
  $resetAllBtn.on("click", () => resetAllModelsInputs());
  $sect1.append($resetAllBtn);

  // Show input changes summary button
  const $showChangedInputsBtn = $(`
    <button>
      <span class="material-icons">summarize</span>
      <span>Summary</span>
    </button>
  `);
  $showChangedInputsBtn.on("click", () => showChangedInputs());
  $sect1.append($showChangedInputsBtn);

  /*
   * Section 2 - Title
   */
  const $sect2 = $('<div class="nav-section second"></div>');
  const $title = $('<div class="app-title">FeliXSim</div>');
  $sect2.append($title);

  /*
   * Section 3
   */
  const $sect3 = $('<div class="nav-section third"></div>');

  // ! simply changed from selectedGraphCount to selectedGraphCount.get()
  // Layout selector (based on layoutConfig)
  const $layoutSelect = $(`
  <select id="layout-select" aria-label="Number of graphs to display">
    ${Object.keys(layoutConfig)
      .map(
        (n) => `<option value="${n}" ${
          n == selectedGraphCount.get() ? "selected" : ""
        }>
                   ${n} Graph${n > 1 ? "s" : ""}
                 </option>`
      )
      .join("")}
  </select>
`);

  // Change handler updates the global variable "selectedGraphCount"
  // ! IT NOW UPDATES THE STORE.
  $layoutSelect.on("change", (e) => {
    const chosen = parseInt(e.target.value, 10);
    if (!layoutConfig[chosen]) {
      console.error(
        `Unsupported layout "${chosen}". Supported: ${Object.keys(
          layoutConfig
        ).join(", ")}.`
      );
      // This shouldn't ever be needed, but
      // if selected option is unsupported, then fallback to 4.
      // ! changed to this for store:
      // // selectedGraphCount = 4;
      selectedGraphCount.set(4);
    } else {
      selectedGraphCount.set(chosen); // ! updates store
      // console.log("chosen layout: ", selectedGraphCount);
    }
    // Refresh graphs section to apply the selected graph layout
    const selectedCategory = $(".graph-category-selector-option.selected").data(
      "value"
    );

    console.log(
      "Nanostore value of selectedGraphCount: ",
      selectedGraphCount.get()
    );
    initGraphsUI(selectedCategory, selectedGraphCount.get());
  });

  $sect3.append(
    $('<label for="layout-select">Layout:&nbsp;</label>'),
    $layoutSelect
  );

  const $documentationBtn = $("<button>Documentation</button>");
  $documentationBtn.on("click", () => {
    window.open("https://iiasa.github.io/felix_docs/", "_blank");
  });
  $sect3.append($documentationBtn);

  const $bugBtn = $("<button>Submit a Bug</button>");
  $bugBtn.on("click", () => {
    window.open("https://github.com/climatechoice/felix/issues", "_blank");
  });
  $sect3.append($bugBtn);

  const $fsBtn = $(`
    <button>
      <span class="material-icons">fullscreen</span>
    </button>
  `);
  $fsBtn.on("click", () => {
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
  });
  $sect3.append($fsBtn);

  // Final assembly
  $nav.append($sect1, $sect2, $sect3);
}

function loadFloatingLogos() {
  // Add logos to bottom left
  const $logoContainer = $('<div class="logo-container"></div>');

  // Logos link + image
  const $logo1Link = $(
    '<a href="https://www.climatechoice.eu/" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo1Img = $(
    `<img src="${choiceLogo}" alt="Choice Logo" style="height: 20px;">`
  );

  const $logo2Link = $(
    '<a href="https://iiasa.ac.at/" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo2Img = $(
    `<img src="${iiasaLogo}" alt="IIASA Logo" style="height: 24px;">`
  );

  const $logo3Link = $(
    '<a href="https://iiasa.ac.at/models-tools-data/felix" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo3Img = $(
    `<img src="${felixLogo}" alt="FeliX Logo" style="height: 20px;">`
  );

  const $sdeLink = $(
    '<a href="https://github.com/climateinteractive/SDEverywhere" target="_blank" rel="noopener noreferrer" class="sde-link">Powered by SDEverywhere</a>'
  );

  $logo1Link.append($logo1Img);
  $logo2Link.append($logo2Img);
  $logo3Link.append($logo3Img);
  $logoContainer.append($logo1Link, $logo2Link, $logo3Link, $sdeLink);
  $("body").append($logoContainer);
}

// Function to switch from single to multi-scenario mode
function handleModeToggle(event, $labelEl) {
  const isOn = event.target.checked;

  $("#inputs-graphs-section").toggleClass("expanded", isOn);
  document.body.classList.toggle("multi-scenario", isOn);

  $labelEl.text(isOn ? "Multi-scenario mode" : "Single-scenario mode");

  // Refresh all sliders
  $(".slider").each(function () {
    const slider = $(this).data("slider");
    if (slider) {
      const currentValue = slider.getValue();
      const defaultValue = slider.options.rangeHighlights[0].start;
      slider.setAttribute("rangeHighlights", [
        { start: defaultValue, end: currentValue },
      ]);
    }
  });
}

// Function to reset all inputs of the active model
function resetActiveModelInputs() {
  coreConfig.inputs.forEach((spec) => {
    const input = activeModel.getInputForId(spec.id);
    if (input) {
      input.reset();
    }
  });
  // Refresh the inputs UI to show the default values
  const selectedCategory = $(".input-category-selector-option.selected").data(
    "value"
  );
  initInputsUI(selectedCategory);
}

// Function to reset all inputs for BOTH models
function resetAllModelsInputs() {
  // Reset both models
  [model, modelB].forEach((modelInstance) => {
    coreConfig.inputs.forEach((spec) => {
      const input = modelInstance.getInputForId(spec.id);
      if (input) {
        input.reset();
      }
    });
  });

  // Refresh the UI to show updated values
  const selectedCategory = $(".input-category-selector-option.selected").data(
    "value"
  );
  initInputsUI(selectedCategory);
}

/*
 * Finds which inputs have been changed for each model instance,
 * creates a markdown table with these changes and shows a popup
 * with the table.
 */
function showChangedInputs() {
  const modelInstances = [model, modelB];
  const allChanged = modelInstances.map((modelInstance, index) => {
    const changedInputs = [];

    coreConfig.inputs.forEach((spec) => {
      const input = modelInstance.getInputForId(spec.id);
      if (!input) return;

      const currentValue = input.get();
      const defaultValue = spec.defaultValue;

      if (currentValue !== defaultValue) {
        changedInputs.push(formatInputChange(spec, defaultValue, currentValue));
      }
    });

    return changedInputs;
  });

  const markdownTable = createSummaryMarkdownTable(
    allChanged[0],
    allChanged[1]
  );
  // we use the existing createPopupBox function
  // use position = left for this popup
  createPopupBox(markdownTable, "left");
}

// Function to handle the presentation format of the input change for all kinds of inputs.
function formatInputChange(spec, defaultValue, currentValue) {
  const label = `**${str(spec.labelKey)}**`;
  // if input slider is a segmented button, then show the labels, not the ranges' number values.
  if (spec.isSegmented === "yes" && Array.isArray(spec.rangeLabelKeys)) {
    const segmentValues = buildSegmentValues(spec);
    const valueToLabel = segmentValues.reduce((acc, val, idx) => {
      acc[val] = str(spec.rangeLabelKeys[idx]);
      return acc;
    }, {});
    const formattedDefault = valueToLabel[defaultValue] ?? defaultValue;
    const formattedCurrent = valueToLabel[currentValue] ?? currentValue;
    return `${label}: ${formattedDefault} → ${formattedCurrent}`;
  }

  return `${label}: ${defaultValue} → ${currentValue}`;
}

// Helper function to generate segment value list
function buildSegmentValues(spec) {
  let values = [spec.minValue, ...spec.rangeDividers];
  if (values.length < spec.rangeLabelKeys.length) {
    values.push(spec.maxValue);
  }
  return values.slice(0, spec.rangeLabelKeys.length);
}

/*
 * Function that creates and returns markdown which contains a table
 * with all the changed inputs for both models.
 */

function createSummaryMarkdownTable(model1Changes, model2Changes) {
  const maxRows = Math.max(model1Changes.length, model2Changes.length);
  const lines = [];

  lines.push("## Summary of Scenario Inputs");

  lines.push("| Scenario 1 🟪 | Scenario 2 🟧 |");
  lines.push("| ------- | ------- |");

  for (let i = 0; i < maxRows; i++) {
    const cell1 = model1Changes[i] || "";
    const cell2 = model2Changes[i] || "";
    lines.push(`| ${cell1} | ${cell2} |`);
  }

  return lines.join("\n");
}

/*
 * INPUTS
 */

function addSliderItem(sliderInput, container = $("#inputs-content")) {
  const spec = sliderInput.spec;

  /*
   * This is a custom solution, because the initial addSwitchItem implementation
   * added the sliders Twice for each input.
   * So, here I first check if this slider has already been added, to prevent duplicates.
   */
  if (addedSliderIds.has(spec.id)) {
    // Check if already added
    return; // Skip if duplicate
  }
  addedSliderIds.add(spec.id); // Mark as added

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
    const start = spec.defaultValue;
    const end = change.newValue;
    slider.setAttribute("rangeHighlights", [{ start, end }]);
    updateValueElement(change.newValue);
    sliderInput.set(change.newValue);
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
    switchInput.set(isOn ? spec.onValue : spec.offValue);
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
  if (addedSliderIds.has(spec.id)) {
    return;
  }
  // ! Mark as added
  addedSliderIds.add(spec.id);

  const currentValue = inputInstance.get();
  // console.log("initial value of segmented: ", currentValue);

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
      `<button type="button" class="segmented-button" data-value="${targetValue}" data-is-default="${isDefaultValue}">${str(
        labelKey
      )}</button>`
    );
    if (currentValue === targetValue) btn.addClass("active");

    btn.on("click", () => {
      inputInstance.set(targetValue);
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
  if (addedSliderIds.has(startSpec.id) || addedSliderIds.has(endSpec.id)) {
    return; // ! Skip if either is a duplicate
  }
  // ! Mark both as added
  addedSliderIds.add(startSpec.id);
  addedSliderIds.add(endSpec.id);

  const startInput = activeModel.getInputForId(startSpec.id);
  const endInput = activeModel.getInputForId(endSpec.id);

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

  // Title row matching existing style
  const titleRow = $(`
    <div class="input-title-row">
      <div class="slider-title-and-info-container">
        <div class="input-title">${str(startSpec.labelKey)} - ${str(
    endSpec.labelKey
  )}</div>
      </div>
      <div class="input-slider-row">
      <input id="${sliderId}" class="slider" type="text"/>
    </div>
      <div class="value-units-container">
        <div class="input-value">${startInput.get()} - ${endInput.get()}</div>
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

  // Update logic
  slider.on("change", (change) => {
    const [startValue, endValue] = change.newValue;
    titleRow.find(".input-value").text(`${startValue} - ${endValue}`);

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
}

function addCombined2Slider(groupInputs, container = $("#inputs-content")) {
  if (groupInputs.length < 2) {
    console.error("Combined2 slider group must contain at least 2 sliders");
    return;
  }

  // Check for duplicates
  if (groupInputs.some((spec) => addedSliderIds.has(spec.id))) {
    return;
  }
  groupInputs.forEach((spec) => addedSliderIds.add(spec.id));

  // Get input instances
  const inputs = groupInputs.map((spec) => activeModel.getInputForId(spec.id));

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
    updateSegments(change.newValue);
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

  if (addedSliderIds.has(spec.id)) {
    // Check if already added
    return; // Skip if duplicate
  }
  addedSliderIds.add(spec.id); // Mark as added

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

function createDropdownGroup(
  mainInputSpec,
  assumptionInputs,
  assumptionCombinedSliders,
  assumptionCombined2Sliders,
  container = $("#inputs-content")
) {
  // Add main input
  const mainInputInstance = activeModel.getInputForId(mainInputSpec.id);
  // ! For some reason
  // console.log("mainInputInstance: ", mainInputInstance);
  // ! check if already added
  if (addedSliderIds.has(mainInputSpec.id)) {
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
    } else {
      console.warn("this secondary type is not yet supported.");
    }
  } else {
    // this is a segmented button
    const segmentedDiv = addSegmentedItem(mainInputInstance, dropdownHeader);
    if (segmentedDiv) {
      segmentedDiv.find(".input-title-row").prepend(expandButton);
    } else {
      console.error("segmentedDiv not created for:", mainInputSpec.id);
    }
  }

  // Add assumption inputs
  assumptionInputs.forEach((inputSpec) => {
    const input = activeModel.getInputForId(inputSpec.id);
    if (input.kind === "slider") {
      if (inputSpec.isSegmented === "yes") {
        addSegmentedItem(input, dropdownContent);
      } else {
        addSliderItem(input, dropdownContent);
      }
    } else if (input.kind === "switch") addSwitchItem(input, dropdownContent);
  });

  // Add assumption combined sliders
  if (assumptionCombinedSliders.length > 0) {
    addCombinedSlider(assumptionCombinedSliders, dropdownContent);
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

  // Toggle handler
  let isExpanded = false;
  expandButton.on("click", () => {
    isExpanded = !isExpanded;
    dropdownContent.slideToggle(200);
    // expandButton.text(isExpanded ? "▼" : "▶");
    expandButton
      .find(".material-icons")
      .text(isExpanded ? "expand_less" : "expand_more");
  });

  return dropdownContainer;
}

/**
 * Initialize the UI for the inputs menu and panel.
 */

function initScenarioSelectorUI() {
  const $container = $("#scenario-selector-container");
  const maxScenarios = 2; // or whatever limit
  let isSingleScenarioMode = false; // Flag for single scenario mode

  // Create the "+" button
  const $addBtn = $(`
    <button id="add-scenario" class="add-scenario-btn">
      <span class="material-icons">add</span>
    </button>
  `);

  const $infoContainer = $('<div id="scenario-info-container"></div>'); // ! not being used at the moment

  // Append "+" button and info container to scenario container
  $container.append($addBtn, $infoContainer);

  // Function to check if we're in single scenario mode
  function checkSingleScenarioMode() {
    // You can modify this condition based on your requirements
    // For example, you might want to check a URL parameter, localStorage, or other conditions
    return isSingleScenarioMode;
  }

  // 1) Inject the first scenario button on load
  addScenarioButton(1);

  // 2) "+" button handler
  $container.on("click", "#add-scenario", function () {
    if (checkSingleScenarioMode()) return; // Don't allow adding scenarios in single mode
    const existing = $container.find(".scenario-selector-option").length;
    const next = existing + 1;
    if (next <= maxScenarios) {
      addScenarioButton(next);
    }
  });

  // 3) Delegate selection clicks
  $container.on("click", ".scenario-selector-option", function () {
    if (checkSingleScenarioMode()) return; // Don't allow changing scenarios in single mode
    const $btn = $(this);
    if ($btn.hasClass("selected")) return;
    $(".scenario-selector-option").removeClass("selected");
    $btn.addClass("selected");
    updateScenario($btn.data("value"));
  });

  // Helper to create & insert a scenario button
  function addScenarioButton(n) {
    const val = `Scenario ${n}`;
    const $btn = $(`
      <button 
        class="scenario-selector-option" 
        data-value="${val}">
        S${n}
      </button>
    `);
    // insert *before* the plus-button
    $("#add-scenario").before($btn);
    // if it's the very first, select it
    if (n === 1) $btn.addClass("selected");
  }

  // Function to set single scenario mode
  window.setSingleScenarioMode = function (enabled) {
    isSingleScenarioMode = enabled;
    if (enabled) {
      // Remove all scenario buttons except Scenario 1
      $(".scenario-selector-option").not("[data-value='Scenario 1']").remove();
      // Ensure Scenario 1 is selected
      $(".scenario-selector-option[data-value='Scenario 1']").addClass(
        "selected"
      );
      updateScenario("Scenario 1");
    }
  };

  // your existing scenario-change logic
  function updateScenario(selectedScenario) {
    console.log("Selected scenario:", selectedScenario);
    // The logic to handle the change in scenario
    activeModel = selectedScenario === "Scenario 2" ? modelB : model;

    // Green highlight for Scenario 1,
    // Red highlight for Scenario 2
    document.body.classList.toggle(
      "scenario-2",
      selectedScenario === "Scenario 2"
    );

    const selectedCategory = $(".input-category-selector-option.selected").data(
      "value"
    );
    initInputsUI(selectedCategory);
  }
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
  const input = activeModel.getInputForId(inputSpec.id);

  if (input.kind === "slider") {
    // both normal sliders and segmented buttons
    // are defined as sliders in inputs.csv
    if (inputSpec.isSegmented === "yes") {
      // slider as segmented button
      addSegmentedItem(input, container);
    } else {
      // normal slider
      addSliderItem(input, container);
    }
  } else if (input.kind === "switch") {
    // ! switch currently can only have as its container the #inputs-section
    addSwitchItem(input);
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
  // Handle "standalone" combined sliders first
  if (groupInputs[0]?.secondaryType === "combined") {
    // ! check what happens here when container is not $("#inputs-content")
    addCombinedSlider(groupInputs, container);
    return;
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
    if (inputSpec.secondaryType === "without") {
      standaloneInputs.push(inputSpec);
    } else if (
      inputSpec.secondaryType === "dropdown main" ||
      inputSpec.secondaryType === "dropdown main label"
    ) {
      mainInput = inputSpec;
    } else if (inputSpec.secondaryType === "dropdown assumptions") {
      assumptionInputs.push(inputSpec);
    } else if (inputSpec.secondaryType === "dropdown combined") {
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
function initInputsUI(category) {
  $("#inputs-content").empty();
  addedSliderIds.clear(); // Reset tracked slider IDs

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
  // console.log("categoryGroups: ", categoryGroups);

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

/*
 * GRAPHS
 */

// jquery Click event for Selecting Graph Category (Food, Climate, LandUse, Fertilizer)
$("#graph-category-selector-container").on(
  "click",
  ".graph-category-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".graph-category-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Call the function to update the graphs
    initGraphsUI(selectedCategory, selectedGraphCount.get());
  }
);

function createGraphViewModel(graphSpec, modelToUse) {
  /*
   * Here, I use the "isCombined" variable to know whether to return only the modelToUse's
   * series data for the varId, or BOTH models' series data.
   */
  const isCombined = graphSpec.scenarioDisplay === "combined";
  return {
    spec: graphSpec,
    model: modelToUse,
    style: "normal",
    getLineWidth: () => window.innerWidth * (0.5 / 100),
    getScaleLabelFontSize: () => window.innerWidth * (1.2 / 100),
    getAxisLabelFontSize: () => window.innerWidth * (1.0 / 100),
    getSeriesForVar: (varId, sourceName) => {
      if (isCombined) {
        // both models' series data are used here
        const seriesA = model.getSeriesForVar(varId, sourceName);
        const seriesB = modelB.getSeriesForVar(varId, sourceName);
        const mergedSeries = {
          ...seriesA,
          points: [...seriesA.points, ...seriesB.points], // concatenate points
        };
        // console.log(mergedSeries);
        return mergedSeries;
      } else {
        // only one modelToUse is used here.
        return modelToUse.getSeriesForVar(varId, sourceName);
      }
    },
    getStringForKey: (key) => {
      return str(key);
    },
    formatYAxisTickValue: (value) => {
      return format(value, graphSpec.yFormat);
    },
  };
}

/**
 * Create a dropdown selector for switching graphs.
 */
function createGraphSelector(category, currentGraphId, onGraphChange) {
  // Get all graphs for the current category and group by classification
  /*
   * seenTitles is used, so that the second graph that has "scenario display" = "combined"
   * doesn't show up in the graph selector.
   */
  const seenTitles = new Set();
  const graphs = Array.from(coreConfig.graphs.values()).filter((spec) => {
    if (spec.graphCategory !== category) return false;
    const title = str(spec.titleKey);
    if (seenTitles.has(title)) return false;
    seenTitles.add(title);
    return true;
  });
  const groups = {};
  graphs.forEach((spec) => {
    const classification = spec.classification || "Uncategorized";
    if (!groups[classification]) groups[classification] = [];
    groups[classification].push(spec);
  });

  // Create custom dropdown container
  const dropdownContainer = $('<div class="custom-graph-selector"></div>');
  const $expandIcon = $(
    '<span class="material-icons expand-icon">expand_more</span>'
  );
  const selectedOption = $('<div class="selected-option"></div>').append(
    $expandIcon
  );
  const dropdownMenu = $('<div class="dropdown-menu"></div>').hide();

  // Add classification groups to the dropdown
  Object.entries(groups).forEach(([classification, specs]) => {
    // Add classification header
    const header = $(
      `<div class="classification-header">${classification}</div>`
    );
    dropdownMenu.append(header);

    // Add each graph under the classification
    specs.forEach((spec) => {
      const option = $(
        `<div class="dropdown-option" data-value="${spec.id}"></div>`
      );
      const title = $(
        `<span class="option-title">${str(spec.titleKey)}</span>`
      );
      const infoIcon = createInfoIcon(str(spec.descriptionKey));
      option.append(title, infoIcon);
      dropdownMenu.append(option);

      // Set the initially selected graph
      if (spec.id === currentGraphId) {
        const selectedTitle = title.clone();
        const selectedInfoIcon = createInfoIcon(str(spec.descriptionKey));
        selectedOption.append(selectedTitle, selectedInfoIcon);
      }
    });
  });

  // Handle option selection
  dropdownMenu.on("click", ".dropdown-option", function () {
    const graphId = $(this).data("value");
    const graphSpec = coreConfig.graphs.get(graphId);
    if (!graphSpec) return;

    // Update selected option display
    const newTitle = $(
      `<span class="option-title">${str(graphSpec.titleKey)}</span>`
    );
    const newInfoIcon = createInfoIcon(str(graphSpec.descriptionKey));
    selectedOption.empty().append(newTitle, newInfoIcon);
    dropdownMenu.hide();

    // Trigger graph change callback
    if (onGraphChange) onGraphChange(graphId);
  });

  // Toggle dropdown visibility
  selectedOption.on("click", function (e) {
    e.stopPropagation();
    dropdownMenu.toggle();
  });

  // Close dropdown when clicking outside
  $(document).on("click", function (e) {
    // Only close if clicking outside the dropdown container
    if (
      !dropdownContainer.is(e.target) &&
      dropdownContainer.has(e.target).length === 0
    ) {
      dropdownMenu.hide();
    }
  });

  // Assemble the dropdown
  dropdownContainer.append(selectedOption, dropdownMenu);
  return dropdownContainer;
}

function showGraph(graphSpec, outerContainer, category) {
  // Check if there's a previous GraphView in this container and remove it from graphViews
  const previousGraphView = outerContainer.data("graphView");
  if (previousGraphView) {
    const index = graphViews.indexOf(previousGraphView);
    if (index > -1) {
      graphViews.splice(index, 1);
    }
  }

  // First, create the viewModel
  /*
   * modelToUse should still be used in this way
   * for the cases that scenarioDisplay = "separate" (or undefined)
   */
  const modelToUse = graphSpec.levels === "Scenario2" ? modelB : model;
  // ! now this either returns one "series" data, or "seriesA, seriesB" concatenated.
  const viewModel = createGraphViewModel(graphSpec, modelToUse);

  // Create the dropdown selector for switching graphs
  const selector = createGraphSelector(category, graphSpec.id, (newGraphId) => {
    const newGraphSpec = coreConfig.graphs.get(newGraphId);
    if (newGraphSpec) {
      outerContainer.empty(); // Clear the current graph
      showGraph(newGraphSpec, outerContainer, category); // Render the new graph
    }
  });

  const titleContainer = $('<div class="title-container"></div>');
  titleContainer.append(selector);
  outerContainer.append(titleContainer);

  // Show the canvas/graph
  const canvas = $("<canvas></canvas>")[0];
  // innerContainer has the canvas, and only that.
  // outerContainer is the "outer-graph-container"
  const innerContainer = $('<div class="graph-container"></div>');
  outerContainer.append(innerContainer);
  innerContainer.append(canvas);

  const options = {
    fontFamily: "Helvetica, sans-serif",
    fontStyle: "bold",
    fontColor: "#231f20",
  };
  const tooltipsEnabled = true;
  const xAxisLabel = graphSpec.xAxisLabelKey
    ? str(graphSpec.xAxisLabelKey)
    : undefined;
  const yAxisLabel = graphSpec.yAxisLabelKey
    ? str(graphSpec.yAxisLabelKey)
    : undefined;

  // Creation of a new GraphView
  // Maybe use setTimeout here...
  const graphView = new GraphView(
    canvas,
    viewModel,
    options,
    tooltipsEnabled,
    xAxisLabel,
    yAxisLabel
  );

  outerContainer.data("graphView", graphView);
  graphViews.push(graphView);
  // ...until here

  // Show the legend items for the graph
  // Each canvas' parent container should have only the canvas as child.
  // https://github.com/chartjs/Chart.js/issues/5805

  const legendContainer = $('<div class="graph-legend"></div>');
  outerContainer.append(legendContainer);
  for (const itemSpec of graphSpec.legendItems) {
    const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
    const label = str(itemSpec.labelKey);
    const itemElem = $(`<div ${attrs}>${label}</div>`);
    legendContainer.append(itemElem);
  }
  // If "scenario display" is "combined",
  // also get the second graphSpec's legends.
  if (graphSpec.scenarioDisplay === "combined") {
    // search and find the second graphSpec whose title is the same
    const matchingSpec = findMatchingGraphSpec(graphSpec);

    // now loop over this matchingSpec and get its graph legends
    for (const itemSpec of matchingSpec.legendItems) {
      const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
      const label = str(itemSpec.labelKey);
      const itemElem = $(`<div ${attrs}>${label}</div>`);
      legendContainer.append(itemElem);
    }
  }

  return graphView;
}

/*
 * Function to find the graphSpec with a matching title.
 * This is used in the case that "scenario display" = "combined"
 */
function findMatchingGraphSpec(graphSpec) {
  const title = str(graphSpec.titleKey);
  // Search in coreConfig.graphs for a different spec with the same titleKey
  return Array.from(coreConfig.graphs.values()).find(
    (spec) => spec !== graphSpec && str(spec.titleKey) === title
  );
}

/*
 * Initialize the graphs according to selected category and selected layout.
 * Default layout is 4 graphs.
 */
function initGraphsUI(category, amountOfGraphs = 4) {
  // First, clear previous graphs,
  // then remove any old graphs-N class from #graphs-container
  // and then add e.g. "graphs-1" or "graphs-4"
  const graphsContainer = $("#graphs-container")
    .empty()
    .removeClass((_, cls) => (cls.match(/graphs-\d+/g) || []).join(" "))
    .addClass(`graphs-${amountOfGraphs}`);

  graphViews = []; // Reset graphViews

  // Define the rows and columns from global layoutConfig
  // acording to the amountOfGraphs asked
  // ! Now, layoutConfig is from the STORE
  const { rows, cols } = layoutConfig[amountOfGraphs];

  // Dynamically build graph categories based on coreConfig.graphs
  // ! Build a flat list of the first N graph IDs in this category
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
    const cat = spec.graphCategory;
    (dynamicGraphCategories[cat] ||= []).push(spec.id);
  }
  const catIds = dynamicGraphCategories[category] || [];

  // This is the total amount of graphIds that we will render
  const graphIds = catIds.slice(0, amountOfGraphs);

  // Create as many rows as needed (according to layoutConfig)
  const rowDivs = [];
  for (let r = 0; r < rows; r++) {
    const row = $(`<div class="graph-row"></div>`);
    rowDivs.push(row);
    graphsContainer.append(row);
  }

  // ! For each selected graph, figure out which row it goes in
  graphIds.forEach((id, index) => {
    const spec = coreConfig.graphs.get(id);
    const outer = $(`<div class="outer-graph-container"></div>`);

    const rowIndex = Math.floor(index / cols);
    rowDivs[rowIndex].append(outer);

    // Add the graph rendering after a delay, so that it always has animations
    setTimeout(() => {
      const view = showGraph(spec, outer, category);
      graphViews.push(view);
    }, 50);
  });

  // Fallback if nothing to show
  if (graphIds.length === 0) {
    graphsContainer.text(
      `No graphs configured. You can edit 'config/graphs.csv' to get started.`
    );
  }
}

/*
 * INITIALIZATION
 */

/**
 * Initialize the web app. This will load the wasm model asynchronously,
 * and upon completion will initialize the user interface.
 */
async function initApp() {
  try {
    model = await createModel();
    modelB = await createModel();
    activeModel = model;
  } catch (e) {
    console.error(`ERROR: Failed to load model: ${e.message}`);
    return;
  }

  // Generate GRAPH category selector buttons
  const graphCategoryContainer = $("#graph-category-selector-container");
  const graphCategories = new Set( // Get unique categories
    Array.from(coreConfig.graphs.values()).map((spec) => spec.graphCategory)
  );

  graphCategories.forEach((graphCategory) => {
    graphCategoryContainer.append(
      `<button class="graph-category-selector-option" data-value="${graphCategory}">
        ${graphCategory}
      </button>`
    );
  });

  // Generate INPUT category selector buttons
  const inputCategoryContainer = $("#input-category-selector-container");
  const inputCategories = new Set(
    Array.from(coreConfig.inputs.values()).map((spec) => spec.categoryId)
  );

  inputCategories.forEach((inputCategory) => {
    inputCategoryContainer.append(
      `<button class="input-category-selector-option" data-value="${inputCategory}" data-label="${inputCategory}">${inputCategory}</button>`
    );
  });

  // Set default graph and input categories to first available
  const defaultGraphCategory = graphCategories.values().next().value || "Food";
  const defaultInputCategory =
    inputCategories.values().next().value || "Diet Change";

  initScenarioSelectorUI(); // this is the side-bar on the left
  initGraphsUI(defaultGraphCategory); // default layout contains 4 graphs
  initInputsUI(defaultInputCategory);

  // initOverlay();

  // Also, mark the default buttons as "selected"
  $(
    "#input-category-selector-container .input-category-selector-option[data-value='Diet Change']"
  ).addClass("selected");
  $(
    "#graph-category-selector-container .graph-category-selector-option[data-value='Food']"
  ).addClass("selected");
  $(
    "#scenario-selector-container .scenario-selector-option[data-value='Scenario 1']"
  ).addClass("selected");

  // Add scenario info icon and tooltip
  // TODO: still use this ?
  // addScenarioInfoIcon();

  // Load the navigation bar
  loadNavBar();
  // Load the floating logos
  loadFloatingLogos();

  console.log(coreConfig);

  // When the model outputs are updated, refresh all graphs
  model.onOutputsChanged = () => {
    graphViews.forEach((graphView) => graphView.updateData());
  };
  modelB.onOutputsChanged = () => {
    graphViews.forEach((graphView) => graphView.updateData());
  };
}

// Initialize the app when this script is loaded
initApp();
