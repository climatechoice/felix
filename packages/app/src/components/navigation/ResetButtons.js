/**
 * ResetButtons.js
 * Extracted from NavBar.js - handles reset functionality for model inputs
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { model, modelB, activeModel } from "../../stores/model-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { initInputsUI } from "../InputsUI.js";
import { updateUndoRedoButtons } from "./UndoRedo.js";

/**
 * Reset all inputs for the currently active model to their default values
 */
export function resetActiveModelInputs() {
  coreConfig.inputs.forEach((spec) => {
    const input = activeModel.get().getInputForId(spec.id);
    if (input) {
      input.reset();
    }
  });
  
  // Clear undo/redo stacks since we're resetting
  undoStack.set([]);
  redoStack.set([]);
  updateUndoRedoButtons();
  
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

/**
 * Reset all inputs for BOTH model instances to their default values
 */
export function resetAllModelsInputs() {
  // Reset both models
  [model.get(), modelB.get()].forEach((modelInstance) => {
    coreConfig.inputs.forEach((spec) => {
      const input = modelInstance.getInputForId(spec.id);
      if (input) {
        input.reset();
      }
    });
  });

  // Clear undo/redo stacks since we're resetting
  undoStack.set([]);
  redoStack.set([]);
  updateUndoRedoButtons();

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
