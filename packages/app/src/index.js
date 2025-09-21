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
}

// Initialize the app when this script is loaded
initApp();
