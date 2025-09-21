import $ from "jquery";
import { config as coreConfig } from "@core";
import { str, createPopupBox } from "../lib/utils.js";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store";
import { model, modelB, activeModel } from "../stores/model-store";
import { initInputsUI } from "./InputsUI";
import { initGraphsUI } from "./GraphsUI";

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
