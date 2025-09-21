import $ from "jquery";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "material-icons/iconfont/material-icons.css";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

import "./index.css";

import choiceLogo from "./imgs/choice-png.png";
import iiasaLogo from "./imgs/iiasa-png.png";
import felixLogo from "./imgs/felix-png.png";

import { config as coreConfig, createModel } from "@core";
// TODO: REMOVE createPopupBox from here, when NavBar.js has been completed.
import { str, createPopupBox } from "./lib/utils.js";

// TODO: All store imports will go here:
import { selectedGraphCount, layoutConfig } from "./stores/layout-store";
import { model, modelB, activeModel } from "./stores/model-store";

// TODO: import necessary components for initialization here:
import { initInputsUI } from "./components/InputsUI";

import { initGraphsUI } from "./components/GraphsUI";
import { graphViews } from "./stores/graphs-store";

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

  // ! THE FOLLOWING NEEDS THE STORE graph-store.js:
  // TODO:  Is this wise, or should I split this too?
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

  // Change handler updates the STORE variable "selectedGraphCount"
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
    const input = activeModel.get().getInputForId(spec.id);
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
  [model.get(), modelB.get()].forEach((modelInstance) => {
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
  const modelInstances = [model.get(), modelB.get()];
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

/**
 * Emptied this
 */

/*
 * SIDE BAR
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
    activeModel.set(
      selectedScenario === "Scenario 2" ? modelB.get() : model.get()
    );

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

/*
 * GRAPHS
 */

/**
 * Emptied this
 */

/*
 * INITIALIZATION
 */

/**
 * Initialize the web app. This will load the wasm model asynchronously,
 * and upon completion will initialize the user interface.
 */
async function initApp() {
  try {
    // 1) Load both models
    const mA = await createModel();
    const mB = await createModel();

    // 2) Push them into the model-store.js
    model.set(mA);
    modelB.set(mB);

    // 3) Set the "active" one
    activeModel.set(mA);
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
  // TODO: Is this .get() correct?
  model.get().onOutputsChanged = () => {
    graphViews.get().forEach((graphView) => graphView.updateData());
  };
  modelB.get().onOutputsChanged = () => {
    graphViews.get().forEach((graphView) => graphView.updateData());
  };
}

// Initialize the app when this script is loaded
initApp();
