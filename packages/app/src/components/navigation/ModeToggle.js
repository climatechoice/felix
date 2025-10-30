/**
 * ModeToggle.js
 * Extracted from NavBar.js - handles single/multi-scenario mode toggle
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { isMultiScenarioMode } from "../../stores/scenario-mode-store.js";
import { categoryLayouts } from "../../stores/category-layout-store.js";
import { selectedGraphCount } from "../../stores/layout-store.js";
import { initGraphsUI } from "../GraphsUI.js";
import { initInputsUI } from "../InputsUI.js";
import { captureScenarioState } from "../../stores/scenario-state-sync-store.js";

/**
 * Handle toggle between single and multi-scenario modes
 */
export function handleModeToggle(event, $labelEl) {
  const isOn = event.target.checked;

  $("#inputs-graphs-section").toggleClass("expanded", isOn);
  document.body.classList.toggle("multi-scenario", isOn);

  $labelEl.text(isOn ? "Multi-scenario mode" : "Single-scenario mode");

  // Update the mode store
  isMultiScenarioMode.set(isOn);
  
  // Update graph category buttons based on mode
  filterGraphCategoriesByMode(isOn);
  
  // When entering multi-scenario mode, re-render inputs to ensure proper connection to activeModel
  if (isOn) {
    const currentInputCategory = $(".input-category-selector-option.selected").data("value");
    if (currentInputCategory) {
      initInputsUI(currentInputCategory);
      // Capture initial state for Scenario 1 after re-render
      requestAnimationFrame(() => captureScenarioState(1));
    }
  }

  // Refresh all sliders to update highlights
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

/**
 * Filter and show/hide graph category buttons based on current mode
 */
export function filterGraphCategoriesByMode(isMultiMode) {
  const $buttons = $(".graph-category-selector-option");
  const currentSelected = $buttons.filter(".selected").data("value");
  let firstVisible = null;
  let currentStillVisible = false;
  
  $buttons.each(function() {
    const $btn = $(this);
    const category = $btn.data("value");
    
    // Find a graph in this category to check its mainGraphs value (exclude HIDDEN graphs)
    const graphInCategory = Array.from(coreConfig.graphs.values()).find(
      (spec) => spec.graphCategory === category && spec.maingraph !== "HIDDEN"
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
      // Get default from the first graph in this category (exclude HIDDEN graphs)
      const graphInCategory = Array.from(coreConfig.graphs.values()).find(
        (spec) => spec.graphCategory === firstVisible && spec.maingraph !== "HIDDEN"
      );
      graphCount = graphInCategory && graphInCategory.graphType ? parseInt(graphInCategory.graphType, 10) : 4;
    }
    selectedGraphCount.set(graphCount);
    $("#layout-select").val(graphCount);
    initGraphsUI(firstVisible, graphCount);
  }
}
