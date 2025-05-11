import $ from "jquery";
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "material-icons/iconfont/material-icons.css";
import "./index.css";

import choiceLogo from "./imgs/choice-png.png";

import { config as coreConfig, createModel } from "@core";
import enStrings from "@core-strings/en";

// import { initOverlay } from "./dev-overlay";
import { GraphView } from "./graph-view";

let model;
let modelB;
let activeModel;

let graphViews = [];

/*
 * This is a custom solution, because the initial addSwitchItem implementation of
 * SDEverywhere added the sliders Twice for each input. So, with this addedSliderIds Set,
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
  const tooltip = $(`<div class="tooltip">${hoverText}</div>`);

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
  $toggleSwitch.find("input").on("change", function () {
    const isOn = this.checked;
    $("#inputs-graphs-section").toggleClass("expanded", isOn);
    // console.log("sidebar expanded:", isOn);
    // update the label
    $modeLabel.text(isOn ? "Multi-scenario mode" : "Single-scenario mode");
  });
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

  /*
   * Section 2
   */
  const $sect2 = $('<div class="nav-section second"></div>');

  // Logo link + image
  const $logoLink = $(
    '<a href="https://www.climatechoice.eu/" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logoImg = $(
    `<img src="${choiceLogo}" alt="Choice Logo" style="height: 30px;">`
  );
  $logoLink.append($logoImg);
  $sect2.append($logoLink);

  /*
   * Section 3
   */
  const $sect3 = $('<div class="nav-section third"></div>');

  const $langSelect = $(`
    <select>
      <option value="en">English</option>
    </select>
  `);
  $langSelect.on("change", (e) => console.log(e.target.value));
  $sect3.append($langSelect);

  const $helpBtn = $("<button>Help</button>");
  $helpBtn.on("click", () => console.log("Help needed"));
  $sect3.append($helpBtn);

  const $bugBtn = $("<button>Submit a bug</button>");
  $bugBtn.on("click", () => {
    window.open("https://github.com/ntantaroudas/choice-web/issues", "_blank");
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

  // Title + Info Icon container. This should be in the far left.
  const sliderTitleAndInfoContainer = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
    ].filter((el) => el !== null)
  );

  // Value + Units container. This should be in the far right.
  const valueUnitsContainer = $('<div class="value-units-container"/>').append(
    [
      inputValue,
      $(`<div class="input-units">${str(spec.unitsKey)}</div>`),
    ].filter((el) => el !== null)
  );

  // TODO: sliderRow should be created below here, and appended as the second thing inside titleRow.

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
    spec.slidersActiveWhenOn.forEach((sliderId) => {
      const slider = activeModel.getInputForId(sliderId);
      addSliderItem(slider, onSlidersContainer);
    });
  }

  if (spec.slidersActiveWhenOff) {
    spec.slidersActiveWhenOff.forEach((sliderId) => {
      const slider = activeModel.getInputForId(sliderId);
      addSliderItem(slider, offSlidersContainer);
    });
  }
}

/**
 * Renders a “segmented control” (a row of mutually‐exclusive buttons)
 * in place of a slider, based on spec.rangeDividers and spec.rangeLabelKeys.
 *
 * @param inputInstance   — the model input instance
 * @param container       — a jQuery element to append into
 * @returns               — the root element of the segmented control
 */
function addSegmentedItem(inputInstance, container = $("#inputs-content")) {
  const spec = inputInstance.spec;
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

  // ——— Title + optional info icon ———
  const infoIcon = createInfoIcon(spec.hoverDescription);
  const titleAndIcon = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
    ].filter((el) => el) // drop the icon if null
  );
  const titleRow = $('<div class="input-title-row"/>').append(titleAndIcon);
  wrapper.append(titleRow);

  // ——— Segmented buttons ———
  const segmentsContainer = $('<div class="segmented-buttons"/>');
  spec.rangeLabelKeys.forEach((labelKey, idx) => {
    const targetValue = segmentValues[idx];
    const btn = $(
      `<button type="button" class="segmented-button">${str(labelKey)}</button>`
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

function createDropdownGroup(
  mainInputSpec,
  assumptionInputs,
  assumptionCombinedSliders
) {
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

  // Append container to DOM first
  $("#inputs-content").append(dropdownContainer);
  dropdownContainer.append(dropdownHeader, dropdownContent);

  // Add main input
  const mainInputInstance = activeModel.getInputForId(mainInputSpec.id);

  // Here, we check if input is Segmented Item OR just a Normal Slider
  if (mainInputSpec.isSegmented !== "yes") {
    // this is a normal slider
    const sliderDiv = addSliderItem(mainInputInstance, dropdownHeader);

    // Add expand button
    sliderDiv.find(".input-title-row").prepend(expandButton);
  } else {
    // this is a segmented button
    const segmentedDiv = addSegmentedItem(mainInputInstance, dropdownHeader);
    segmentedDiv.find(".input-title-row").prepend(expandButton);
  }

  // Add assumption inputs
  assumptionInputs.forEach((inputSpec) => {
    const input = activeModel.getInputForId(inputSpec.id);
    if (input.kind === "slider") addSliderItem(input, dropdownContent);
    else if (input.kind === "switch") addSwitchItem(input, dropdownContent);
  });

  // Add assumption combined sliders
  if (assumptionCombinedSliders.length > 0) {
    addCombinedSlider(assumptionCombinedSliders, dropdownContent);
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

$(function () {
  const $container = $("#scenario-selector-container");
  const maxScenarios = 4; // or whatever limit

  // 1) Inject the first scenario button on load
  addScenarioButton(1);

  // 2) “+” button handler
  $container.on("click", "#add-scenario", function () {
    const existing = $container.find(".scenario-selector-option").length;
    const next = existing + 1;
    if (next <= maxScenarios) {
      addScenarioButton(next);
    }
  });

  // 3) Delegate selection clicks
  $container.on("click", ".scenario-selector-option", function () {
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
    // if it’s the very first, select it
    if (n === 1) $btn.addClass("selected");
  }

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
});

// // Click event for selecting a scenario
// $("#scenario-selector-container").on(
//   "click",
//   ".scenario-selector-option",
//   function () {
//     // If the clicked button is already selected, do nothing
//     if ($(this).hasClass("selected")) return;

//     // Remove 'selected' class from all buttons
//     $(".scenario-selector-option").removeClass("selected");

//     // Add 'selected' class to the clicked button
//     $(this).addClass("selected");

//     // Get the selected scenario value
//     const selectedScenario = $(this).data("value");

//     // Call the function to update the UI based on the selected scenario
//     updateScenario(selectedScenario);
//   }
// );

// // Example function to handle scenario selection
// function updateScenario(selectedScenario) {
//   console.log("Selected scenario:", selectedScenario);
//   // The logic to handle the change in scenario
//   activeModel = selectedScenario === "Scenario 2" ? modelB : model;

//   // Green highlight for Scenario 1,
//   // Red highlight for Scenario 2
//   document.body.classList.toggle(
//     "scenario-2",
//     selectedScenario === "Scenario 2"
//   );

//   const selectedCategory = $(".input-category-selector-option.selected").data(
//     "value"
//   );
//   initInputsUI(selectedCategory);
// }

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

  if (coreConfig.inputs.size > 0) {
    Object.entries(categoryGroups).forEach(([groupName, groupInputs]) => {
      // Handle combined sliders first
      if (groupInputs[0]?.secondaryType === "combined") {
        addCombinedSlider(groupInputs, $("#inputs-content"));
        return;
      }

      // Handle dropdowns
      const standaloneInputs = [];
      let mainInput = null;
      const assumptionInputs = [];
      const assumptionCombinedSliders = [];

      groupInputs.forEach((inputSpec) => {
        if (inputSpec.secondaryType === "without") {
          standaloneInputs.push(inputSpec);
        } else if (inputSpec.secondaryType === "dropdown main") {
          mainInput = inputSpec;
        } else if (inputSpec.secondaryType === "dropdown assumptions") {
          assumptionInputs.push(inputSpec);
        } else if (inputSpec.secondaryType === "dropdown combined") {
          assumptionCombinedSliders.push(inputSpec);
        }
      });

      // Add standalone inputs first
      standaloneInputs.forEach((inputSpec) => {
        const input = activeModel.getInputForId(inputSpec.id);
        if (input.kind === "slider") {
          // TODO: Add here the case for standalone addSegmentedItem
          addSliderItem(input);
        } else if (input.kind === "switch") addSwitchItem(input);
      });

      // Process main input with dropdown
      if (mainInput) {
        createDropdownGroup(
          mainInput,
          assumptionInputs,
          assumptionCombinedSliders
        );
      }
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
    initGraphsUI(selectedCategory);
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

//fm - changed this to initialize graphs according to selected graph category
function initGraphsUI(category) {
  const graphsContainer = $("#graphs-container");
  graphsContainer.empty(); // Clear previous graphs
  graphViews = []; // Reset graphViews

  // Dynamically build graph categories based on coreConfig.graphs
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
    const graphCategory = spec.graphCategory;
    if (!graphCategory) continue; // Skip graphs without a category. (!) probably unecessary, since it's a required field.
    if (!dynamicGraphCategories[graphCategory]) {
      dynamicGraphCategories[graphCategory] = [];
    }
    dynamicGraphCategories[graphCategory].push(spec.id);
  }

  const categoryGraphIds = dynamicGraphCategories[category] || [];
  const topRowGraphIds = categoryGraphIds.slice(0, 2); // First two graphs for the top row
  const bottomRowGraphIds = categoryGraphIds.slice(2, 4); // Next two graphs for the bottom row

  // Create containers for the rows
  const topGraphRow = $('<div class="top-graph-row"></div>');
  const bottomGraphRow = $('<div class="bottom-graph-row"></div>');

  // (!) logs the coreConfig object, which contains inputs, graphs specifications. (!)
  console.log(coreConfig);

  if (coreConfig.graphs.size > 0) {
    for (const spec of coreConfig.graphs.values()) {
      if (categoryGraphIds.includes(spec.id)) {
        const outerGraphContainer = $(
          '<div class="outer-graph-container"></div>'
        );

        // Add the graph to the appropriate row
        if (topRowGraphIds.includes(spec.id)) {
          topGraphRow.append(outerGraphContainer);
        } else if (bottomRowGraphIds.includes(spec.id)) {
          bottomGraphRow.append(outerGraphContainer);
        }

        // Add the graph rendering after a delay, so that it always has animations
        setTimeout(() => {
          const graphView = showGraph(spec, outerGraphContainer, category);
          graphViews.push(graphView);
        }, 50);
      }
    }

    // Append the rows to the graphsContainer
    graphsContainer.append(topGraphRow).append(bottomGraphRow);
  } else {
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

  initGraphsUI(defaultGraphCategory);
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
