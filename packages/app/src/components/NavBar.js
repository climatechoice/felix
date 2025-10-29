import $ from "jquery";
import { config as coreConfig } from "@core";
import { str, createPopupBox } from "../lib/utils.js";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store";
import { model, modelB, activeModel } from "../stores/model-store";
import { categoryLayouts } from "../stores/category-layout-store.js";
import { isMultiScenarioMode } from "../stores/scenario-mode-store.js";
import { initInputsUI } from "./InputsUI";
import { initGraphsUI } from "./GraphsUI";
import { showSurveyPopup } from "./SurveyPopup";
import { undoInputChange, redoInputChange, updateUndoRedoButtons } from "./navigation/UndoRedo.js";
import { resetActiveModelInputs } from "./navigation/ResetButtons.js";
import { showChangedInputs } from "./navigation/SummaryView.js";
import { exportInputsToCSV, handleImportClick } from "./navigation/ImportExport.js";
import { handleModeToggle, filterGraphCategoriesByMode } from "./navigation/ModeToggle.js";
import { handleLayoutChange, resetGraphsView } from "./navigation/LayoutControls.js";

// Inject a 50px-tall nav bar split into three equal sections
export function loadNavBar() {
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


  // Undo button
  const $undoBtn = $(`
    <button id="undo-btn" title="Undo">
      <span class="material-icons">undo</span>
    </button>
  `);
  $undoBtn.on("click", () => undoInputChange());
  $sect1.append($undoBtn);

  // Redo button
  const $redoBtn = $(`
    <button id="redo-btn" title="Redo">
      <span class="material-icons">redo</span>
    </button>
  `);
  $redoBtn.on("click", () => redoInputChange());
  $sect1.append($redoBtn);

  // Reset current scenario button
  const $resetBtn = $(`
    <button title="Reset Current Scenario">
      <span class="material-icons">refresh</span>
    </button>
  `);
  $resetBtn.on("click", () => resetActiveModelInputs());
  $sect1.append($resetBtn);

  // Show input changes summary button
  const $showChangedInputsBtn = $(`
    <button title="Summary">
      <span class="material-icons">summarize</span>
    </button>
  `);
  $showChangedInputsBtn.on("click", () => showChangedInputs());
  $sect1.append($showChangedInputsBtn);

  // Export inputs to CSV file button
  const $exportInputsBtn = $(`
    <button title="Export Scenario">
      <span class="material-icons">download</span>
    </button>
  `);
  $exportInputsBtn.on("click", () => exportInputsToCSV());
  $sect1.append($exportInputsBtn);

  // Import inputs from CSV file button
  const $importInputsBtn = $(`
    <button title="Import Scenario">
      <span class="material-icons">upload</span>
    </button>
  `);
  $importInputsBtn.on("click", () => handleImportClick());
  $sect1.append($importInputsBtn);

  // Survey button - generates scenario from user choices
  const $surveyBtn = $(`
    <button title="Build Your First Scenario!">
      <span class="material-icons">quiz</span>
    </button>
  `);
  $surveyBtn.on("click", () => showSurveyPopup());
  $sect1.append($surveyBtn);

  /*
   * Section 2 - Title
   */
  const $sect2 = $('<div class="nav-section second"></div>');
  
  // Logo and title container
  const $titleContainer = $('<div class="title-container"></div>');
  const $logo = $('<img src="src/imgs/felix-png.png" alt="FeliX Logo" class="title-container-logo" />');
  const $title = $('<div class="title-container-text">FeliXSim</div>');
  
  $titleContainer.append($logo, $title);
  
  // Make the entire container clickable to refresh the page
  $titleContainer.on("click", () => {
    location.reload();
  });
  
  $sect2.append($titleContainer);

  /*
   * Section 3
   */
  const $sect3 = $('<div class="nav-section third"></div>');

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
      selectedGraphCount.set(4);
    } else {
      selectedGraphCount.set(chosen);
    }
    
    // Get current category and save the layout preference
    const selectedCategory = $(".graph-category-selector-option.selected").data(
      "value"
    );
    
    // Save this category's layout preference
    const layouts = categoryLayouts.get();
    categoryLayouts.set({
      ...layouts,
      [selectedCategory]: chosen
    });

    console.log(
      "Nanostore value of selectedGraphCount: ",
      selectedGraphCount.get()
    );
    initGraphsUI(selectedCategory, selectedGraphCount.get());
  });

  // Layout selector with icon
  const $layoutContainer = $('<div class="layout-selector-container"></div>');
  const $layoutIcon = $('<span class="material-icons layout-icon">dashboard</span>');
  $layoutContainer.append($layoutIcon, $layoutSelect);
  
  $sect3.append($layoutContainer);

  // Reset graphs button - right after layout selector
  const $resetGraphsBtn = $(`
    <button title="Reset Graph View" class="reset-graph-btn">
      <span class="material-icons">refresh</span>
      <span class="material-icons">bar_chart</span>
    </button>
  `);
  $resetGraphsBtn.on("click", () => resetGraphsView());
  $sect3.append($resetGraphsBtn);

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
  
  // Apply initial filter based on default mode (single-scenario)
  filterGraphCategoriesByMode(false);
  
  // Initialize button states
  updateUndoRedoButtons();
}
