import $ from "jquery";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "material-icons/iconfont/material-icons.css";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

import "./index.css";

import { config as coreConfig, createModel } from "@core";

// Store imports
import { model, modelB, activeModel } from "./stores/model-store";
import { graphViews } from "./stores/graphs-store";

// Component imports
import { initInputsUI } from "./components/InputsUI";
import { initGraphsUI } from "./components/GraphsUI";
import { loadNavBar } from "./components/NavBar";
import { loadFloatingLogos } from "./components/FloatingLogos";

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
