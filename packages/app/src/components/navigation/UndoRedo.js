/**
 * UndoRedo.js
 * Extracted from NavBar.js - handles undo/redo functionality for input changes
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { format } from "../../lib/utils.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { activeModel } from "../../stores/model-store.js";
import { initInputsUI } from "../InputsUI.js";

/**
 * Update the undo/redo button states based on stack lengths
 */
export function updateUndoRedoButtons() {
  const $undoStack = undoStack.get();
  const $redoStack = redoStack.get();

  $("#undo-btn").prop("disabled", $undoStack.length === 0);
  $("#redo-btn").prop("disabled", $redoStack.length === 0);
}

/**
 * Undo the last input change (supports both single and multi-input changes)
 */
export function undoInputChange() {
  const stack = [...undoStack.get()];
  if (stack.length === 0) return;
  
  const last = stack.pop();
  const affectedIds = [];
  
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
      if (input) {
        input.set(last.prevValues[idx]);
        affectedIds.push(id);
      }
    });
  } else {
    // Single input undo
    const input = activeModel.get().getInputForId(last.id);
    if (input) {
      const redoArr = [...redoStack.get()];
      redoArr.push({ id: last.id, prevValue: input.get(), newValue: last.newValue });
      redoStack.set(redoArr);
      input.set(last.prevValue);
      affectedIds.push(last.id);
    }
  }
  
  undoStack.set(stack);
  updateUndoRedoButtons();
  
  // Refresh UI with proper state preservation
  refreshInputsUIForChangedInputs(affectedIds);
}

/**
 * Redo the last undone input change (supports both single and multi-input changes)
 */
export function redoInputChange() {
  const stack = [...redoStack.get()];
  if (stack.length === 0) return;
  
  const last = stack.pop();
  const affectedIds = [];
  
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
      if (input) {
        input.set(last.newValues[idx]);
        affectedIds.push(id);
      }
    });
  } else {
    // Single input redo
    const input = activeModel.get().getInputForId(last.id);
    if (input) {
      const undoArr = [...undoStack.get()];
      undoArr.push({ id: last.id, prevValue: input.get(), newValue: last.newValue });
      undoStack.set(undoArr);
      input.set(last.newValue);
      affectedIds.push(last.id);
    }
  }
  
  redoStack.set(stack);
  updateUndoRedoButtons();
  
  // Refresh UI with proper state preservation
  refreshInputsUIForChangedInputs(affectedIds);
}

/**
 * More robust approach: Re-render only the current category with proper state preservation
 * This handles ALL input types consistently without needing to know implementation details
 */
function refreshInputsUIForChangedInputs(affectedIds) {
  // Get the currently selected category
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
  
  // For SSP changes or large multi-input changes (>10 inputs), 
  // we need to refresh to ensure all affected inputs are updated
  const isLargeChange = affectedIds.length > 10;
  
  if (!isLargeChange) {
    // Check if any affected inputs are in the current category
    const affectedInCurrentCategory = affectedIds.some(id => {
      const spec = Array.from(coreConfig.inputs.values()).find(s => s.id === id);
      return spec && spec.categoryId === selectedCategory;
    });
    
    // Only refresh if the affected inputs are visible in current category
    if (!affectedInCurrentCategory) {
      return; // No need to refresh if affected inputs aren't visible
    }
  }
  
  // Record which dropdowns are open before refresh
  const openDropdowns = [];
  $(".input-dropdown-group .dropdown-content:visible").each(function() {
    const $group = $(this).closest('.input-dropdown-group');
    const mainId = $group.find('[id^="input-"]').attr('id');
    if (mainId) {
      openDropdowns.push(mainId);
    }
  });
  
  // Re-render the inputs for current category
  initInputsUI(selectedCategory);
  
  // Restore open dropdowns after a brief delay to allow DOM to settle
  requestAnimationFrame(() => {
    openDropdowns.forEach(inputId => {
      const $dropdown = $(`#${inputId}`).closest('.input-dropdown-group').find('.dropdown-content');
      if ($dropdown.length && !$dropdown.is(':visible')) {
        $dropdown.show();
        $(`#${inputId}`).closest('.input-dropdown-group').find('.expand-button .material-icons').text('expand_less');
      }
    });
  });
}

