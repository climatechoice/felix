/**
 * LayoutControls.js
 * Extracted from NavBar.js - handles graph layout selection and reset
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { selectedGraphCount, layoutConfig } from "../../stores/layout-store.js";
import { categoryLayouts } from "../../stores/category-layout-store.js";
import { initGraphsUI } from "../GraphsUI.js";

/**
 * Handle graph layout selection change
 */
export function handleLayoutChange(e) {
  const chosen = parseInt(e.target.value, 10);
  if (!layoutConfig[chosen]) {
    console.error(
      `Unsupported layout "${chosen}". Supported: ${Object.keys(
        layoutConfig
      ).join(", ")}.`
    );
    // Fallback to 4 if unsupported
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
}

/**
 * Reset graphs view to default layout for current category
 */
export function resetGraphsView() {
  // Get currently selected category
  const $selectedCategory = $(".graph-category-selector-option.selected");
  const currentCategoryName = $selectedCategory.data("value");
  
  if (currentCategoryName) {
    // Get default graph count for the CURRENT category (exclude HIDDEN graphs)
    const graphInCategory = Array.from(coreConfig.graphs.values()).find(
      (spec) => spec.graphCategory === currentCategoryName && spec.maingraph !== "HIDDEN"
    );
    const defaultGraphCount = graphInCategory && graphInCategory.graphType 
      ? parseInt(graphInCategory.graphType, 10) 
      : 4;
    
    // Remove the saved preference for this category
    const layouts = categoryLayouts.get();
    const newLayouts = { ...layouts };
    delete newLayouts[currentCategoryName];
    categoryLayouts.set(newLayouts);
    
    // Update the selected graph count and dropdown
    selectedGraphCount.set(defaultGraphCount);
    $("#layout-select").val(defaultGraphCount);
    
    // Reinitialize graphs with the default count
    initGraphsUI(currentCategoryName, defaultGraphCount);
    
    console.log(`Reset ${currentCategoryName} to default layout: ${defaultGraphCount} graphs`);
  }
}
