import { atom } from "nanostores";
import $ from "jquery";
import { initInputsUI } from "../components/InputsUI";
import { initGraphsUI } from "../components/GraphsUI";
import { selectedGraphCount } from "./layout-store";
import { categoryLayouts } from "./category-layout-store";
import { activeModel } from "./model-store";

/**
 * Store for maintaining separate UI states for Scenario 1 and Scenario 2
 * in multi-scenario mode. Each scenario remembers its own page, scroll position,
 * and dropdown states.
 */

// Store separate UI states for each scenario
// Note: Scenarios stay on the same page/category, but each remembers its own scroll and dropdown states
export const scenarioStates = atom({
  scenario1: {
    inputScrollPosition: 0,
    graphScrollPosition: 0,
    dropdownStates: {},
  },
  scenario2: {
    inputScrollPosition: 0,
    graphScrollPosition: 0,
    dropdownStates: {},
  },
});

/**
 * Capture the current UI state for a specific scenario
 * Note: We only capture scroll positions and dropdown states, not the page/category
 * (scenarios always stay on the same page)
 * @param {number} scenarioNumber - 1 or 2
 */
export function captureScenarioState(scenarioNumber) {
  const inputScrollPosition = $("#inputs-container").scrollTop() || 0;
  const graphScrollPosition = $("#graphs-container").scrollTop() || 0;
  
  // Capture dropdown states
  const dropdownStates = {};
  $(".input-dropdown-group").each(function() {
    const $group = $(this);
    const $content = $group.find(".dropdown-content");
    const $mainInput = $group.find("[data-input-id]").first();
    const inputId = $mainInput.data("input-id");
    
    if (inputId) {
      dropdownStates[inputId] = $content.is(":visible");
    }
  });
  
  const states = scenarioStates.get();
  const scenarioKey = scenarioNumber === 1 ? "scenario1" : "scenario2";
  
  states[scenarioKey] = {
    inputScrollPosition,
    graphScrollPosition,
    dropdownStates,
  };
  
  scenarioStates.set(states);
}

/**
 * Restore the UI state for a specific scenario
 * @param {number} scenarioNumber - 1 or 2
 * @param {boolean} skipGraphRefresh - If true, don't refresh graphs (they auto-update via model callbacks)
 */
export function restoreScenarioState(scenarioNumber, skipGraphRefresh = true) {
  const states = scenarioStates.get();
  const scenarioKey = scenarioNumber === 1 ? "scenario1" : "scenario2";
  const state = states[scenarioKey];
  
  // Always use the current page/category (scenarios stay on same page)
  const currentInputCategory = $(".input-category-selector-option.selected").data("value");
  const currentGraphCategory = $(".graph-category-selector-option.selected").data("value");
  
  // CRITICAL: Re-render inputs with the current category to show the correct scenario's values
  if (currentInputCategory) {
    initInputsUI(currentInputCategory);
  }
  
  // Don't change graph category - graphs auto-update via model.onOutputsChanged
  // Just ensure button state is correct
  if (currentGraphCategory) {
    const $targetGraph = $(`.graph-category-selector-option[data-value="${currentGraphCategory}"]`);
    if ($targetGraph.length && !$targetGraph.hasClass("selected")) {
      $(".graph-category-selector-option").removeClass("selected");
      $targetGraph.addClass("selected");
    }
  }
  
  // Restore this scenario's scroll positions and dropdown states after DOM update
  requestAnimationFrame(() => {
    if (state) {
      if (state.inputScrollPosition !== undefined) {
        $("#inputs-container").scrollTop(state.inputScrollPosition);
      }
      if (state.graphScrollPosition !== undefined) {
        $("#graphs-container").scrollTop(state.graphScrollPosition);
      }
      
      // Restore dropdown states
      if (state.dropdownStates) {
        Object.entries(state.dropdownStates).forEach(([inputId, isOpen]) => {
          const $group = $(`[data-input-id="${inputId}"]`).closest(".input-dropdown-group");
          const $content = $group.find(".dropdown-content");
          const $expandIcon = $group.find(".expand-button .material-icons");
          
          if (isOpen && !$content.is(":visible")) {
            $content.show();
            $expandIcon.text("expand_less");
          } else if (!isOpen && $content.is(":visible")) {
            $content.hide();
            $expandIcon.text("expand_more");
          }
        });
      }
    }
  });
}
