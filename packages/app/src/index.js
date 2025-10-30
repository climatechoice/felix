import $ from "jquery";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "material-icons/iconfont/material-icons.css";
import "katex/dist/katex.min.css"; // Import KaTeX CSS
import "./index.css";
import { config as coreConfig, createModel } from "@core";
// Store imports
import { model, modelB, activeModel } from "./stores/model-store";
import { graphViews } from "./stores/graphs-store";
import { selectedGraphCount } from "./stores/layout-store";
// Component imports
import { initInputsUI } from "./components/InputsUI";
import { initGraphsUI, getDefaultGraphCountForCategory } from "./components/GraphsUI";
import { loadNavBar } from "./components/NavBar";
import { loadFloatingLogos } from "./components/FloatingLogos";
import { initScenarioSelectorUI } from "./components/ScenarioSelector";

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
  // Get unique categories, excluding HIDDEN graphs
  const graphCategories = new Set(
    Array.from(coreConfig.graphs.values())
      .filter((spec) => spec.maingraph !== "HIDDEN")
      .map((spec) => spec.graphCategory)
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

  // Get the default graph count for the default category
  const defaultGraphCount = getDefaultGraphCountForCategory(defaultGraphCategory);
  selectedGraphCount.set(defaultGraphCount);

  initScenarioSelectorUI(); // this is the side-bar on the left
  initGraphsUI(defaultGraphCategory, defaultGraphCount); // use category-specific default
  initInputsUI(defaultInputCategory);

  // initOverlay();

  // Also, mark the default buttons as "selected"
  $(
    `.input-category-selector-option[data-value='${defaultInputCategory}']`
  ).addClass("selected");
  $(
    `.graph-category-selector-option[data-value='${defaultGraphCategory}']`
  ).addClass("selected");
  $(
    "#scenario-selector-container .scenario-selector-option[data-value='Scenario 1']"
  ).addClass("selected");

  // Load the navigation bar
  loadNavBar();
  // Load the floating logos
  loadFloatingLogos();

  // console.log(coreConfig);

  // When the model outputs are updated, refresh all graphs
  model.get().onOutputsChanged = () => {
    graphViews.get().forEach((graphView) => graphView.updateData());
  };
  modelB.get().onOutputsChanged = () => {
    graphViews.get().forEach((graphView) => graphView.updateData());
  };
  
  // Set up state sync listeners for multi-scenario mode
  setupStateSyncListeners();
}

/**
 * Set up event listeners to track UI state changes for each scenario
 */
function setupStateSyncListeners() {
  const { captureScenarioState } = require("./stores/scenario-state-sync-store");
  
  // Helper to get current scenario number
  const getCurrentScenario = () => {
    return document.body.classList.contains("scenario-2") ? 2 : 1;
  };
  
  // Capture state when scrolling in inputs or graphs panels (throttled)
  let scrollTimeout;
  $("#inputs-container, #graphs-container").on("scroll", function() {
    if (!document.body.classList.contains("multi-scenario")) return;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      captureScenarioState(getCurrentScenario());
    }, 100); // Throttle to every 100ms
  });
  
  // Capture state when clicking category selectors
  $(".input-category-selector-option, .graph-category-selector-option").on("click", function() {
    if (!document.body.classList.contains("multi-scenario")) return;
    
    setTimeout(() => {
      captureScenarioState(getCurrentScenario());
    }, 50);
  });
  
  // Capture state when clicking dropdown expand/collapse buttons
  $(document).on("click", ".expand-button, .dropdown-header", function() {
    if (!document.body.classList.contains("multi-scenario")) return;
    
    setTimeout(() => {
      captureScenarioState(getCurrentScenario());
    }, 300); // Wait for animation to complete
  });
}

// Initialize the app when this script is loaded
initApp();
