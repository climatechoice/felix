import $ from "jquery";
import { model, modelB, activeModel } from "../stores/model-store";
import { initInputsUI } from "./InputsUI";

/*
 * SIDE BAR
 */
export function initScenarioSelectorUI() {
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
