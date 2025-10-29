/**
 * SwitchInput.js
 * Extracted from InputsUI.js - handles switch/toggle input controls with dependent sliders
 */

import $ from "jquery";
import {
  str,
  createInfoIcon,
} from "../../lib/utils.js";
import { config as coreConfig } from "@core";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

// Forward declaration - will be imported from main InputsUI
let renderInputGroup;

export function setRenderInputGroup(fn) {
  renderInputGroup = fn;
}

export function addSwitchItem(switchInput) {
  const spec = switchInput.spec;
  const inputElemId = `input-${spec.id}`;

  // Create info tooltip for this Switch
  const infoIcon = createInfoIcon(spec.hoverDescription);

  // Create button container
  const buttonContainer = $('<div class="switch-button-container"></div>');
  const onButton = $(
    `<button class="switch-button">${str(spec.labelKey)}</button>`
  );
  const offButton = $(
    `<button class="switch-button">${spec.secondLabel}</button>`
  );

  // Create slider containers
  const onSlidersContainer = $(
    '<div class="slider-group-container on-sliders"></div>'
  );
  const offSlidersContainer = $(
    '<div class="slider-group-container off-sliders"></div>'
  );

  function updateUI(isOn) {
    // Update button states
    onButton.toggleClass("active", isOn);
    offButton.toggleClass("active", !isOn);

    // Toggle slider visibility
    onSlidersContainer.toggle(isOn);
    offSlidersContainer.toggle(!isOn);

    // Update model value
    const prevValue = switchInput.get();
    const newValue = isOn ? spec.onValue : spec.offValue;
    const undoArr = [...undoStack.get()];
    undoArr.push({ id: spec.id, prevValue, newValue });
    undoStack.set(undoArr);
    redoStack.set([]);
    updateUndoRedoButtons();
    switchInput.set(newValue);
  }

  // Initial setup
  const initialValue = switchInput.get() === spec.onValue;
  updateUI(initialValue);

  // Button click handlers
  onButton.on("click", () => updateUI(true));
  offButton.on("click", () => updateUI(false));

  // Create switch UI
  const div = $(`<div class="input-item switch-item"/>`).append([
    buttonContainer.append(offButton, infoIcon, onButton),
    $(
      `<div class="input-desc">${
        spec.descriptionKey ? str(spec.descriptionKey) : ""
      }</div>`
    ),
    $('<div class="switch-sliders-container"/>').append(
      offSlidersContainer,
      onSlidersContainer
    ),
  ]);

  $("#inputs-content").append(div);

  // Add sliders to their respective containers
  if (spec.slidersActiveWhenOn) {
    const groupMap = {};
    spec.slidersActiveWhenOn.forEach((sliderId) => {
      const inputSpec = coreConfig.inputs.get(sliderId);
      if (!inputSpec || !inputSpec.inputGroup) return;

      if (!groupMap[inputSpec.inputGroup]) {
        groupMap[inputSpec.inputGroup] = [];
      }
      groupMap[inputSpec.inputGroup].push(inputSpec);
    });

    Object.entries(groupMap).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs, onSlidersContainer);
    });
  }

  if (spec.slidersActiveWhenOff) {
    const groupMap = {};
    spec.slidersActiveWhenOff.forEach((sliderId) => {
      const inputSpec = coreConfig.inputs.get(sliderId);
      if (!inputSpec || !inputSpec.inputGroup) return;

      if (!groupMap[inputSpec.inputGroup]) {
        groupMap[inputSpec.inputGroup] = [];
      }
      groupMap[inputSpec.inputGroup].push(inputSpec);
    });

    Object.entries(groupMap).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs, offSlidersContainer);
    });
  }
}
