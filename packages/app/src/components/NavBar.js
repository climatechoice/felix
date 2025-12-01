import $ from "jquery";
import { config as coreConfig } from "@core";
import { str } from "../lib/utils.js";
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
import { copyShareableURLToClipboard } from "../utils/url-state.js";
import felixLogo from "../imgs/felix-png.png";
import { loadTargets, updateAllGraphTargets } from "../lib/utils.js";
import { targetsVisible } from "../stores/targets-store.js";
import { graphViews } from "../stores/graphs-store.js";

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
  const $modeLabel = $('<span class="mode-label"><i>Single</i><br>Scenario</span>');

  // Attach event listener
  $toggleSwitch
    .find("input")
    .on("change", (e) => handleModeToggle(e, $modeLabel));

  // Append to section
  $sect1.append($toggleSwitch, $modeLabel);

  // Divider
  const $divider = $('<span class="nav-divider">|</span>');
  $sect1.append($divider);

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

  // Export inputs to clipboard button
  const $exportInputsBtn = $(`
    <button title="Copy Scenario">
      <span class="material-icons" style="font-size: 18px;">file_copy</span>
    </button>
  `);
  $exportInputsBtn.on("click", () => exportInputsToCSV());
  $sect1.append($exportInputsBtn);

  // Import inputs from clipboard button
  const $importInputsBtn = $(`
    <button title="Paste Scenario" class="paste-btn-single">
      <span class="material-icons">assignment</span>
    </button>
  `);
  $importInputsBtn.on("click", () => handleImportClick());
  $sect1.append($importInputsBtn);

  // Import to Scenario 1 button (multi-mode only)
  const $importScenario1Btn = $(`
    <button title="Paste to Scenario 1" class="paste-btn-multi paste-scenario-1" style="display: none; position: relative;">
      <span class="material-icons">assignment</span>
      <span class="scenario-badge" style="position: absolute; bottom: 2px; right: 2px; background: #6a3d9a; color: white; font-size: 10px; font-weight: bold; padding: 1px 3px; border-radius: 2px; line-height: 1;">1</span>
    </button>
  `);
  $importScenario1Btn.on("click", async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || clipboardText.trim() === '') {
        alert("Clipboard is empty.");
        return;
      }
      // Directly import into scenario 1
      const { processImportText } = await import("./navigation/ImportExport.js");
      processImportText(clipboardText, 1);
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      alert("Failed to read from clipboard. Please check browser permissions.");
    }
  });
  $sect1.append($importScenario1Btn);

  // Import to Scenario 2 button (multi-mode only)
  const $importScenario2Btn = $(`
    <button title="Paste to Scenario 2" class="paste-btn-multi paste-scenario-2" style="display: none; position: relative;">
      <span class="material-icons">assignment</span>
      <span class="scenario-badge" style="position: absolute; bottom: 2px; right: 2px; background: #e66100; color: white; font-size: 10px; font-weight: bold; padding: 1px 3px; border-radius: 2px; line-height: 1;">2</span>
    </button>
  `);
  $importScenario2Btn.on("click", async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || clipboardText.trim() === '') {
        alert("Clipboard is empty.");
        return;
      }
      // Directly import into scenario 2
      const { processImportText } = await import("./navigation/ImportExport.js");
      processImportText(clipboardText, 2);
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      alert("Failed to read from clipboard. Please check browser permissions.");
    }
  });
  $sect1.append($importScenario2Btn);

  // Share URL button - copy shareable URL to clipboard
  const $shareBtn = $(`
    <button title="Share Configuration URL">
      <span class="material-icons">share</span>
    </button>
  `);
  $shareBtn.on("click", async () => {
    const success = await copyShareableURLToClipboard();
    if (success) {
      // Show brief success feedback
      const originalTitle = $shareBtn.attr('title');
      $shareBtn.attr('title', 'Copied to clipboard!');
      $shareBtn.find('.material-icons').text('check');
      
      setTimeout(() => {
        $shareBtn.attr('title', originalTitle);
        $shareBtn.find('.material-icons').text('share');
      }, 2000);
    } else {
      alert('Failed to copy URL. Please copy manually from the address bar.');
    }
  });
  $sect1.append($shareBtn);

  // Show input changes summary button
  const $showChangedInputsBtn = $(`
    <button title="Summary">
      <span class="material-icons">ballot</span>
    </button>
  `);
  $showChangedInputsBtn.on("click", () => showChangedInputs());
  $sect1.append($showChangedInputsBtn);

  // Survey button - generates scenario from user choices
  const $surveyBtn = $(`
    <button title="Build Your First Scenario!">
      <span class="material-icons">lightbulb</span>
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
  const $logo = $(`<img src="${felixLogo}" alt="FeliX Logo" class="title-container-logo" />`);
  const $title = $('<div class="title-container-text">FeliXSim</div>');
  
  $titleContainer.append($logo, $title);
  
  // Make the entire container clickable to go to default page (without URL parameters)
  $titleContainer.on("click", () => {
    window.location.href = window.location.pathname;
  });
  
  $sect2.append($titleContainer);

  /*
   * Section 3
   */
  const $sect3 = $('<div class="nav-section third"></div>');

  // Reset graphs button - FIRST
  const $resetGraphsBtn = $(`
    <button title="Reset Graph View" class="reset-graph-btn">
      <span class="material-icons">refresh</span>
      <span class="material-icons">bar_chart</span>
    </button>
  `);
  $resetGraphsBtn.on("click", () => resetGraphsView());
  $sect3.append($resetGraphsBtn);

  // Layout selector (based on layoutConfig) - SECOND
  const $layoutSelect = $(`
  <select id="layout-select" aria-label="Graph Layout">
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
  const $layoutTooltip = $('<div class="layout-tooltip">Graph Layout</div>');
  $layoutContainer.append($layoutIcon, $layoutSelect, $layoutTooltip);
  $sect3.append($layoutContainer);

  // No custom tooltip logic: rely on native title attribute

  // Bulls-eye button - toggle target points on graphs
  const $bullseyeBtn = $(`
    <button title="Toggle Target Points" class="targets-toggle-btn">
      <span class="material-icons">adjust</span>
    </button>
  `);
  $bullseyeBtn.on("click", async () => {
    // Load targets on first click
    await loadTargets();
    
    // Toggle the targets visibility
    const isVisible = targetsVisible.get();
    targetsVisible.set(!isVisible);
    
    // Update button state
    if (!isVisible) {
      $bullseyeBtn.addClass('active');
    } else {
      $bullseyeBtn.removeClass('active');
    }
    
    // Update all active graph views to show/hide targets
    updateAllGraphTargets(graphViews.get());
  });
  $sect3.append($bullseyeBtn);

  // Year selector for present-day reference line - AFTER bulls-eye
  const $yearSelectorContainer = $('<div class="year-selector-container" title="Reference Year"></div>');
  const $yearIcon = $('<span class="material-icons year-icon">event</span>');
  const $yearInput = $(`
    <input 
      type="number" 
      id="present-year-input" 
      min="1950" 
      max="2100" 
      value="2025" 
      title="Reference Year"
    />
  `);
  
  $yearInput.on("change", function() {
    const year = parseInt($(this).val(), 10);
    if (year >= 1950 && year <= 2100) {
      // Update the reference line year in graph-view
      window.presentDayYear = year;
      // Refresh all graphs to show new reference line
      const selectedGraphCategory = $(".graph-category-selector-option.selected").data("value");
      if (selectedGraphCategory) {
        initGraphsUI(selectedGraphCategory, selectedGraphCount.get());
      }
    } else {
      // Reset to 2025 if invalid
      $(this).val(2025);
      window.presentDayYear = 2025;
    }
  });
  
  $yearSelectorContainer.append($yearIcon, $yearInput);
  $sect3.append($yearSelectorContainer);

  // Documentation button with icon
  const $documentationBtn = $(`
    <button title="Documentation">
      <span class="material-icons">menu_book</span>
    </button>
  `);
  $documentationBtn.on("click", () => {
    window.open("https://iiasa.github.io/felix_docs/", "_blank");
  });
  $sect3.append($documentationBtn);

  // Bug report button with icon
  const $bugBtn = $(`
    <button title="Submit A Bug">
      <span class="material-icons">bug_report</span>
    </button>
  `);
  $bugBtn.on("click", () => {
    window.open("https://github.com/climatechoice/felix/issues", "_blank");
  });
  $sect3.append($bugBtn);

  // Fullscreen button
  const $fsBtn = $(`
    <button title="Toggle Fullscreen">
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
