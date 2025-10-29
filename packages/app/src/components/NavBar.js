import $ from "jquery";
import { config as coreConfig } from "@core";
import { str, createPopupBox } from "../lib/utils.js";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store";
import { model, modelB, activeModel } from "../stores/model-store";
import { undoStack, redoStack } from "../stores/undo-redo-store.js";
import { categoryLayouts } from "../stores/category-layout-store.js";
import { isMultiScenarioMode } from "../stores/scenario-mode-store.js";
import { initInputsUI } from "./InputsUI";
import { initGraphsUI } from "./GraphsUI";
import { showSurveyPopup } from "./SurveyPopup";

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
    <button title="Undo">
      <span class="material-icons">undo</span>
    </button>
  `);
  $undoBtn.on("click", () => undoInputChange());
  $sect1.append($undoBtn);

  // Redo button
  const $redoBtn = $(`
    <button title="Redo">
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
  $importInputsBtn.on("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";

    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Check if in multi-scenario mode
        if (isMultiScenarioMode.get()) {
          showScenarioSelectionPopup(file);
        } else {
          processCSVFile(file, 1); // Single mode always loads to Model 1
        }
      }
    };

    fileInput.click();
  });
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

// Function to switch from single to multi-scenario mode
function handleModeToggle(event, $labelEl) {
  const isOn = event.target.checked;

  $("#inputs-graphs-section").toggleClass("expanded", isOn);
  document.body.classList.toggle("multi-scenario", isOn);

  $labelEl.text(isOn ? "Multi-scenario mode" : "Single-scenario mode");

  // Update the mode store
  isMultiScenarioMode.set(isOn);
  
  // Update graph category buttons based on mode
  filterGraphCategoriesByMode(isOn);

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

// Filter and show/hide graph category buttons based on mode
function filterGraphCategoriesByMode(isMultiMode) {
  const $buttons = $(".graph-category-selector-option");
  const currentSelected = $buttons.filter(".selected").data("value");
  let firstVisible = null;
  let currentStillVisible = false;
  
  $buttons.each(function() {
    const $btn = $(this);
    const category = $btn.data("value");
    
    // Find a graph in this category to check its mainGraphs value
    const graphInCategory = Array.from(coreConfig.graphs.values()).find(
      (spec) => spec.graphCategory === category
    );
    
    if (graphInCategory) {
      const mainGraphs = (graphInCategory.mainGraphs || "").toLowerCase();
      const modes = mainGraphs.split(";").map(m => m.trim());
      const showInSingle = modes.includes("single") || mainGraphs === "";
      const showInMulti = modes.includes("multi") || mainGraphs === "";
      const showInBoth = mainGraphs === "" || mainGraphs.includes("single;multi") || mainGraphs.includes("multi;multi");
      
      const shouldShow = showInBoth || (isMultiMode ? showInMulti : showInSingle);
      
      if (shouldShow) {
        $btn.show();
        if (!firstVisible) firstVisible = category;
        if (category === currentSelected) currentStillVisible = true;
      } else {
        $btn.hide();
      }
    }
  });
  
  // If current selection is hidden, switch to first visible and reload graphs
  if (!currentStillVisible && firstVisible) {
    $buttons.removeClass("selected");
    const $firstVisibleBtn = $(`.graph-category-selector-option[data-value='${firstVisible}']`);
    $firstVisibleBtn.addClass("selected");
    
    // Reload graphs for the newly selected category
    const layouts = categoryLayouts.get();
    let graphCount;
    if (layouts[firstVisible] !== undefined) {
      graphCount = layouts[firstVisible];
    } else {
      // Get default from the first graph in this category
      const graphInCategory = Array.from(coreConfig.graphs.values()).find(
        (spec) => spec.graphCategory === firstVisible
      );
      graphCount = graphInCategory && graphInCategory.graphType ? parseInt(graphInCategory.graphType, 10) : 4;
    }
    selectedGraphCount.set(graphCount);
    $("#layout-select").val(graphCount);
    initGraphsUI(firstVisible, graphCount);
  }
}


// Reset graphs view to defaults
function resetGraphsView() {
  // Get currently selected category
  const $selectedCategory = $(".graph-category-selector-option.selected");
  const currentCategoryName = $selectedCategory.data("value");
  
  if (currentCategoryName) {
    // Get default graph count for the CURRENT category
    const graphInCategory = Array.from(coreConfig.graphs.values()).find(
      (spec) => spec.graphCategory === currentCategoryName
    );
    const defaultGraphCount = graphInCategory && graphInCategory.graphType 
      ? parseInt(graphInCategory.graphType, 10) 
      : 4;
    
    // Reset layout for this category
    const layouts = categoryLayouts.get();
    const { [currentCategoryName]: _, ...rest } = layouts; // Remove current category's saved layout
    categoryLayouts.set(rest);
    
    // Reset to default layout
    selectedGraphCount.set(defaultGraphCount);
    $("#layout-select").val(defaultGraphCount);
    
    // Reload graphs for the SAME category
    initGraphsUI(currentCategoryName, defaultGraphCount);
  }
}


// Multi-step undo

function undoInputChange() {
  const stack = [...undoStack.get()];
  if (stack.length === 0) return;
  
  const last = stack.pop();
  // Multi-input undo (combined/combo sliders)
  if (last.ids && Array.isArray(last.ids)) {
    const redoArr = [...redoStack.get()];
    // Gather current values for redo
    const currentValues = last.ids.map(id => {
      const input = activeModel.get().getInputForId(id);
      return input ? input.get() : undefined;
    });
    redoArr.push({ ids: last.ids, prevValues: currentValues, newValues: last.newValues });
    redoStack.set(redoArr);
    // Undo: set all prevValues
    last.ids.forEach((id, idx) => {
      const input = activeModel.get().getInputForId(id);
      if (input) input.set(last.prevValues[idx]);
    });
  } else {
    // Single input undo
    const input = activeModel.get().getInputForId(last.id);
    if (input) {
      const redoArr = [...redoStack.get()];
      redoArr.push({ id: last.id, prevValue: input.get(), newValue: last.newValue });
      redoStack.set(redoArr);
      input.set(last.prevValue);
    }
  }
  undoStack.set(stack);
  refreshInputsUI();
}

// Multi-step redo

function redoInputChange() {
  const stack = [...redoStack.get()];
  if (stack.length === 0) return;
  
  const last = stack.pop();
  // Multi-input redo (combined/combo sliders)
  if (last.ids && Array.isArray(last.ids)) {
    const undoArr = [...undoStack.get()];
    // Gather current values for undo
    const currentValues = last.ids.map(id => {
      const input = activeModel.get().getInputForId(id);
      return input ? input.get() : undefined;
    });
    undoArr.push({ ids: last.ids, prevValues: currentValues, newValues: last.newValues });
    undoStack.set(undoArr);
    // Redo: set all newValues
    last.ids.forEach((id, idx) => {
      const input = activeModel.get().getInputForId(id);
      if (input) input.set(last.newValues[idx]);
    });
  } else {
    // Single input redo
    const input = activeModel.get().getInputForId(last.id);
    if (input) {
      const undoArr = [...undoStack.get()];
      undoArr.push({ id: last.id, prevValue: input.get(), newValue: last.newValue });
      undoStack.set(undoArr);
      input.set(last.newValue);
    }
  }
  redoStack.set(stack);
  refreshInputsUI();
}

// Preserve open dropdowns after UI refresh (including combined and combined2)
function refreshInputsUI() {
  let selectedCategory = $(".input-category-selector-option.selected").data("value");
  if (!selectedCategory) {
    const $first = $("#input-category-selector-container .input-category-selector-option").first();
    if ($first && $first.length) {
      selectedCategory = $first.data("value");
      $(".input-category-selector-option").removeClass("selected");
      $first.addClass("selected");
    } else {
      selectedCategory = Array.from(coreConfig.inputs.values())[0]
        ? Array.from(coreConfig.inputs.values())[0].categoryId
        : "Diet Change";
    }
  }
  // Record which dropdowns are open (by unique group selector)
  const openDropdowns = [];
  $(".input-dropdown-group .dropdown-content:visible").each(function() {
    // Try to find a unique selector for the group
    let $group = $(this).closest('.input-dropdown-group');
    let selector = null;
    // Prefer a main input id if present
    const mainId = $group.find('[id^=\"input-\"]').attr('id');
    if (mainId) selector = `#${mainId}`;
    // Otherwise, try to use a combined/combo id
    else {
      const combinedId = $group.find('input.slider').attr('id');
      if (combinedId) selector = `#${combinedId}`;
    }
    if (selector) openDropdowns.push(selector);
  });
  initInputsUI(selectedCategory);
  // Use requestAnimationFrame for smoother UI updates
  requestAnimationFrame(() => {
    openDropdowns.forEach(selector => {
      const $dropdown = $(selector).closest('.input-dropdown-group').find('.dropdown-content');
      if ($dropdown.length && !$dropdown.is(':visible')) {
        $dropdown.show();
        $(selector).closest('.input-dropdown-group').find('.expand-button .material-icons').text('expand_less');
      }
    });
  });
}
}

// Function to reset all inputs for BOTH models
// Function to reset all inputs of the active model
function resetActiveModelInputs() {
  coreConfig.inputs.forEach((spec) => {
    const input = activeModel.get().getInputForId(spec.id);
    if (input) {
      input.reset();
    }
  });
  
  // Refresh the inputs UI to show the default values
  let selectedCategory = $(".input-category-selector-option.selected").data(
    "value"
  );
  if (!selectedCategory) {
    const $first = $(
      "#input-category-selector-container .input-category-selector-option"
    ).first();
    if ($first && $first.length) {
      selectedCategory = $first.data("value");
      $(".input-category-selector-option").removeClass("selected");
      $first.addClass("selected");
    } else {
      selectedCategory = Array.from(coreConfig.inputs.values())[0]
        ? Array.from(coreConfig.inputs.values())[0].categoryId
        : "Diet Change";
    }
  }
  initInputsUI(selectedCategory);
}

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
  let selectedCategory = $(".input-category-selector-option.selected").data(
    "value"
  );
  if (!selectedCategory) {
    const $first = $(
      "#input-category-selector-container .input-category-selector-option"
    ).first();
    if ($first && $first.length) {
      selectedCategory = $first.data("value");
      $(".input-category-selector-option").removeClass("selected");
      $first.addClass("selected");
    } else {
      selectedCategory = Array.from(coreConfig.inputs.values())[0]
        ? Array.from(coreConfig.inputs.values())[0].categoryId
        : "Diet Change";
    }
  }
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
      // Skip inputs with secondaryType 'hidden' from summary (external drivers)
      if (spec.secondaryType === "hidden") {
        return;
      }
      
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

// ---------------- helpers ----------------

// Escape a single cell for CSV
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Minimal CSV parser that supports quotes and double-quote escaping
function parseCSV(text) {
  const s = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < s.length) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Coerce CSV string to the type expected by the input (based on defaultValue)
function coerceValueForSpec(raw, spec) {
  const dv = spec?.defaultValue;
  if (typeof dv === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : dv;
  }
  if (typeof dv === "boolean") {
    const t = String(raw).trim().toLowerCase();
    return t === "true" || t === "1" || t === "yes";
  }
  return raw; // strings and everything else
}

// Since coreConfig.inputs may not be a plain Array (no .find), scan manually.
function getSpecByVarName(varName) {
  let found = null;
  coreConfig.inputs.forEach((spec) => {
    if (!found && spec.varName === varName) found = spec;
  });
  return found;
}

// ---------------- export ----------------

function exportInputsToCSV() {
  // Export only the active model's inputs
  const activeModelInstance = activeModel.get();
  
  if (!activeModelInstance) {
    alert("No model loaded. Please refresh the page.");
    return;
  }

  const rows = [["VarName", "Value"]];

  coreConfig.inputs.forEach((spec) => {
    const input = activeModelInstance.getInputForId(spec.id);
    if (!input) return;

    const varName = spec.varName;
    const value = input.get();

    rows.push([varName, value]);
  });

  const csvContent = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scenario_inputs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------- import ----------------

/**
 * Shows a popup to select which scenario to import into (multi-scenario mode only)
 */
function showScenarioSelectionPopup(file) {
  // Remove any existing popup
  $(".popup-overlay, .popup").remove();

  // Create the popup
  const popup = $('<div class="popup popup-middle" style="max-width: 400px;">');
  
  const content = $('<div style="padding: 20px; text-align: center;">').html(`
    <h2 style="margin-top: 0;">Import Scenario</h2>
    <p style="color: #666; margin-bottom: 30px;">Which scenario would you like to import this file into?</p>
    
    <div style="display: flex; gap: 15px; justify-content: center;">
      <button class="import-scenario-choice" data-model="1" style="
        padding: 15px 30px;
        background: #6a3d9a;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 1
      </button>
      <button class="import-scenario-choice" data-model="2" style="
        padding: 15px 30px;
        background: #e66100;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 2
      </button>
    </div>
    
    <button class="import-cancel-btn" style="
      margin-top: 20px;
      padding: 8px 20px;
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Cancel</button>
  `);

  // Close button
  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);

  // Create overlay
  const overlay = $('<div class="popup-overlay">');
  
  const closePopup = () => {
    popup.remove();
    overlay.remove();
  };

  closeBtn.on("click", closePopup);
  content.find('.import-cancel-btn').on('click', closePopup);
  
  // Handle scenario selection
  content.find('.import-scenario-choice').on('click', function() {
    const modelNumber = parseInt($(this).data('model'));
    closePopup();
    processCSVFile(file, modelNumber);
  });

  // Hover effects
  content.find('.import-scenario-choice').on('mouseenter', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#552f7a' : '#cc5500');
  }).on('mouseleave', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#6a3d9a' : '#e66100');
  });

  popup.append(closeBtn, content);
  overlay.append(popup);
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) closePopup();
  });
  
  $("body").append(overlay);
}

function processCSVFile(file, modelNumber = 1) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const csvText = e.target.result;
    const rows = parseCSV(csvText);
    if (!rows.length) {
      console.error("CSV file appears to be empty.");
      alert("Error: CSV file appears to be empty.");
      return;
    }

    // Strip BOM from first header cell if present
    if (rows[0] && rows[0][0]) rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");

    const headers = rows[0].map((h) => (h || "").trim());
    console.log('CSV headers:', headers);
    
    const varNameIdx = headers.indexOf("VarName");
    const valueIdx = headers.indexOf("Value");

    console.log('Column indices - VarName:', varNameIdx, 'Value:', valueIdx);

    if (varNameIdx === -1 || valueIdx === -1) {
      console.error("CSV must contain 'VarName' and 'Value' columns.");
      alert("Error: CSV must contain 'VarName' and 'Value' columns.");
      return;
    }

    // Use the specified model number for import
    const targetModelInstance = modelNumber === 2 ? modelB.get() : model.get();
    const targetModelLabel = `Scenario ${modelNumber}`;
    
    console.log(`Loading CSV into ${targetModelLabel}`, targetModelInstance);
    
    if (!targetModelInstance) {
      console.error(`${targetModelLabel} instance not available`);
      alert(`Error: ${targetModelLabel} not loaded. Please refresh the page.`);
      return;
    }

    let applied = 0;
    let warnings = 0;

    console.log(`Processing ${rows.length - 1} data rows...`);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const varName = (row[varNameIdx] ?? "").trim();
      const rawValue = (row[valueIdx] ?? "").trim();
      
      console.log(`Row ${r}: VarName="${varName}", Value="${rawValue}"`);
      
      if (!varName) continue;

      const spec = getSpecByVarName(varName);
      console.log(`  Spec found:`, spec ? `ID: ${spec.id}` : 'null');
      
      if (!spec) {
        console.warn(
          `Input not found for VarName "${varName}" at row ${r + 1}`
        );
        warnings++;
        continue;
      }

      const input = targetModelInstance.getInputForId(spec.id);
      console.log(`  Input found:`, input ? 'yes' : 'no');
      
      if (!input) {
        console.warn(
          `Input id "${spec.id}" not present on ${targetModelLabel} for VarName "${varName}"`
        );
        warnings++;
        continue;
      }

      try {
        const coerced = coerceValueForSpec(rawValue, spec);
        console.log(`  Setting value to:`, coerced);
        input.set(coerced);
        applied++;
      } catch (err) {
        console.error(
          `Failed to set value for VarName "${varName}" in ${targetModelLabel}:`,
          err
        );
        warnings++;
      }
    }

    // Refresh Inputs UI so changes are visible
    const selectedCategory = $(".input-category-selector-option.selected").data(
      "value"
    );
    initInputsUI(selectedCategory);

    console.log(`Import to ${targetModelLabel} finished. Applied: ${applied}. Warnings: ${warnings}.`);
    
    alert(
      `Imported ${applied} value(s) into ${targetModelLabel}.${
        warnings ? `\n${warnings} warning(s) - check console.` : ""
      }`
    );
  };

  reader.readAsText(file);
}
