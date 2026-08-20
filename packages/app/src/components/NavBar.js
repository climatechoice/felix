import $ from "jquery";
import { config as coreConfig } from "@core";
import { str } from "../lib/utils.js";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store";
import { model, modelB, activeModel } from "../stores/model-store";
import { categoryLayouts } from "../stores/category-layout-store.js";
import { isMultiScenarioMode } from "../stores/scenario-mode-store.js";
import { initInputsUI } from "./InputsUI";
import { initGraphsUI } from "./GraphsUI";
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
import { startTutorial } from "./Tutorial.js";
import { startLesson8 } from "./Lesson8";
import { graphViews } from "../stores/graphs-store.js";
import { defaultMinYear, defaultMaxYear, presentYear, resetYearRangeSettings } from "../stores/year-range-store.js";

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

  /*
   * Section 2 - Title
   */
  const $sect2 = $('<div class="nav-section second"></div>');
  
  // Logo and title container
  const $titleContainer = $('<div class="title-container"></div>');
  const $logo = $(`<img src="${felixLogo}" alt="FeliX Logo" class="title-container-logo" />`);
  const $title = $('<div class="title-container-text">FeliXSim</div>');
  
  $titleContainer.append($logo, $title);
  
  // Make the entire container clickable to go to default page with ?app parameter
  // This resets to default state without showing the welcome screen
  $titleContainer.on("click", () => {
    window.location.href = window.location.pathname + '?app';
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
    <button title="Toggle Target Points" class="targets-toggle-btn active">
      <span class="material-icons">my_location</span>
    </button>
  `);
  
  // Load targets on initialization (targetsVisible is true by default in store)
  loadTargets();
  
  $bullseyeBtn.on("click", async () => {
    // Load targets on first click if not already loaded
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

  // Year range settings dropdown
  let currentMinYear, currentMaxYear, currentPresentYear;
  
  // Subscribe to stores to track current values
  defaultMinYear.subscribe(v => { currentMinYear = v; });
  defaultMaxYear.subscribe(v => { currentMaxYear = v; });
  presentYear.subscribe(v => { currentPresentYear = v; });

  const $yearDropdownContainer = $(`
    <div class="year-dropdown-wrapper">
      <button title="Year Range Settings" class="year-settings-btn">
        <span class="material-icons">event</span>
      </button>
      <div class="year-dropdown-menu">
        <div class="year-dropdown-header">Year Range Settings</div>
        <div class="year-dropdown-item">
          <label>Min Year</label>
          <input type="number" id="dropdown-min-year" min="1900" max="2100" step="1" value="${currentMinYear || 2000}" />
        </div>
        <div class="year-dropdown-item">
          <label>Max Year</label>
          <input type="number" id="dropdown-max-year" min="1900" max="2100" step="1" value="${currentMaxYear || 2050}" />
        </div>
        <div class="year-dropdown-item">
          <label>Reference Line</label>
          <input type="number" id="dropdown-present-year" min="1900" max="2100" step="1" value="${currentPresentYear || 2025}" />
        </div>
        <div class="year-dropdown-footer">
          <button class="year-dropdown-reset">Reset</button>
          <button class="year-dropdown-apply">Apply</button>
        </div>
      </div>
    </div>
  `);

  // Toggle dropdown on button click
  $yearDropdownContainer.find(".year-settings-btn").on("click", function(e) {
    e.stopPropagation();
    const $dropdown = $yearDropdownContainer.find(".year-dropdown-menu");
    
    // Update input values with current store values before showing
    $("#dropdown-min-year").val(currentMinYear || 2000);
    $("#dropdown-max-year").val(currentMaxYear || 2050);
    $("#dropdown-present-year").val(currentPresentYear || 2025);
    
    // Close other dropdowns
    $(".year-dropdown-menu").not($dropdown).removeClass("show");
    $(".docs-dropdown-menu").removeClass("show");
    $(".bug-dropdown-menu").removeClass("show");
    
    $dropdown.toggleClass("show");
  });

  // Close dropdown when clicking outside
  $(document).on("click", function(e) {
    if (!$(e.target).closest(".year-dropdown-wrapper").length) {
      $(".year-dropdown-menu").removeClass("show");
    }
    if (!$(e.target).closest(".docs-dropdown-wrapper").length) {
      $(".docs-dropdown-menu").removeClass("show");
    }
    if (!$(e.target).closest(".bug-dropdown-wrapper").length) {
      $(".bug-dropdown-menu").removeClass("show");
    }
  });

  // Handle Enter key on input fields to trigger apply
  $yearDropdownContainer.find("input[type=number]").on("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      $yearDropdownContainer.find(".year-dropdown-apply").click();
    }
  });

  // Reset button
  $yearDropdownContainer.find(".year-dropdown-reset").on("click", function(e) {
    e.stopPropagation();
    resetYearRangeSettings();
    
    // Update input fields to show reset values
    $("#dropdown-min-year").val(2000);
    $("#dropdown-max-year").val(2050);
    $("#dropdown-present-year").val(2025);
    
    // Immediately refresh graphs with reset values
    const selectedGraphCategory = $(".graph-category-selector-option.selected").data("value");
    if (selectedGraphCategory) {
      initGraphsUI(selectedGraphCategory, selectedGraphCount.get());
    }
    
    // Close the dropdown
    $(".year-dropdown-menu").removeClass("show");
  });

  // Apply button
  $yearDropdownContainer.find(".year-dropdown-apply").on("click", function(e) {
    e.stopPropagation();
    const minYr = parseInt($("#dropdown-min-year").val(), 10);
    const maxYr = parseInt($("#dropdown-max-year").val(), 10);
    const presentYr = parseInt($("#dropdown-present-year").val(), 10);

    // Validate year range
    if (minYr < 1900 || minYr > 2100) {
      alert("Min year must be between 1900 and 2100!");
      return;
    }
    
    if (maxYr < 1900 || maxYr > 2100) {
      alert("Max year must be between 1900 and 2100!");
      return;
    }
    
    if (presentYr < 1900 || presentYr > 2100) {
      alert("Reference line year must be between 1900 and 2100!");
      return;
    }

    if (minYr >= maxYr) {
      alert("Min year must be less than max year!");
      return;
    }

    defaultMinYear.set(minYr);
    defaultMaxYear.set(maxYr);
    presentYear.set(presentYr);

    // Refresh graphs
    const selectedGraphCategory = $(".graph-category-selector-option.selected").data("value");
    if (selectedGraphCategory) {
      initGraphsUI(selectedGraphCategory, selectedGraphCount.get());
    }

    $yearDropdownContainer.find(".year-dropdown-menu").removeClass("show");
  });
  
  $sect3.append($yearDropdownContainer);

  // Documentation dropdown with menu options
  const $documentationDropdownContainer = $(`
    <div class="docs-dropdown-wrapper">
      <button title="Documentation & Updates" class="docs-btn">
        <span class="material-icons">menu_book</span>
      </button>
      <div class="docs-dropdown-menu">
        <div class="docs-dropdown-header">Resources</div>
        <div class="docs-dropdown-item" data-action="documentation">
          <span class="material-icons">article</span>
          <span>Documentation</span>
        </div>
        <div class="docs-dropdown-item" data-action="quick-guide">
          <span class="material-icons">help_outline</span>
          <span>Quick Guide</span>
        </div>
        <!-- Interactive Lesson removed from Resources: use the nav button instead -->
        <div class="docs-dropdown-item" data-action="update-log">
          <span class="material-icons">update</span>
          <span>Release Notes</span>
        </div>
      </div>
    </div>
  `);

  // Toggle dropdown on button click
  $documentationDropdownContainer.find(".docs-btn").on("click", function(e) {
    e.stopPropagation();
    const $dropdown = $documentationDropdownContainer.find(".docs-dropdown-menu");
    
    // Close other dropdowns
    $(".docs-dropdown-menu").not($dropdown).removeClass("show");
    $(".year-dropdown-menu").removeClass("show");
    $(".bug-dropdown-menu").removeClass("show");
    
    $dropdown.toggleClass("show");
  });

  // Handle menu item clicks
  $documentationDropdownContainer.find(".docs-dropdown-item").on("click", function(e) {
    e.stopPropagation();
    const action = $(this).data("action");
    
    if (action === "documentation") {
      window.open("https://iiasa.github.io/felix_docs/", "_blank");
    } else if (action === "quick-guide") {
      startTutorial();
    } else if (action === "update-log") {
      window.open(__APP_VERSION_URL__ || "https://github.com/climatechoice/felix/releases", "_blank");
    }
    
    $documentationDropdownContainer.find(".docs-dropdown-menu").removeClass("show");
  });

  // Close dropdown when clicking outside
  $(document).on("click", function(e) {
    if (!$(e.target).closest(".docs-dropdown-wrapper").length) {
      $(".docs-dropdown-menu").removeClass("show");
    }
  });

  $sect3.append($documentationDropdownContainer);

  // Interactive lesson quick button (visible on nav)
  const $lessonBtn = $(
    `
    <button title="Interactive Lesson">
      <span class="material-icons">school</span>
    </button>
  `
  );
  $lessonBtn.on("click", () => {
    try {
      startLesson8();
    } catch (e) {
      console.error('Failed to start lesson', e);
    }
  });
  $sect3.append($lessonBtn);

  // Bug report / survey dropdown
  const $bugDropdownContainer = $(`
    <div class="bug-dropdown-wrapper">
      <button title="Feedback" class="bug-btn">
        <span class="material-icons">rate_review</span>
      </button>
      <div class="bug-dropdown-menu">
        <div class="bug-dropdown-header">Feedback</div>
        <div class="docs-dropdown-item" data-bug-action="survey">
          <span class="material-icons">poll</span>
          <span>Survey</span>
        </div>
        <div class="docs-dropdown-item" data-bug-action="report">
          <span class="material-icons">bug_report</span>
          <span>Report Bug</span>
        </div>
      </div>
    </div>
  `);

  $bugDropdownContainer.find(".bug-btn").on("click", function(e) {
    e.stopPropagation();
    const $dropdown = $bugDropdownContainer.find(".bug-dropdown-menu");
    // Close other dropdowns
    $(".year-dropdown-menu").removeClass("show");
    $(".docs-dropdown-menu").removeClass("show");
    $dropdown.toggleClass("show");
  });

  $bugDropdownContainer.find(".docs-dropdown-item").on("click", function(e) {
    e.stopPropagation();
    const action = $(this).data("bug-action");
    if (action === "survey") {
      window.open("https://forms.gle/L56w9mmtaaM6a9i5A", "_blank");
    } else if (action === "report") {
      window.open("https://github.com/climatechoice/felix/issues", "_blank");
    }
    $bugDropdownContainer.find(".bug-dropdown-menu").removeClass("show");
  });

  $(document).on("click", function(e) {
    if (!$(e.target).closest(".bug-dropdown-wrapper").length) {
      $(".bug-dropdown-menu").removeClass("show");
    }
  });

  $sect3.append($bugDropdownContainer);

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
