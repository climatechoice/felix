/**
 * DropdownList.js
 * Handles dropdown list controls (HTML select element for mutually exclusive options)
 * Similar to segmented buttons but uses a dropdown instead
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import {
  str,
  loadMarkdownByName,
  resolveLocalImages,
  createPopupBox,
  createInfoIcon,
  createGraphPreviewButton,
} from "../../lib/utils.js";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { undoStack, redoStack } from "../../stores/undo-redo-store.js";
import { activeModel } from "../../stores/model-store.js";
import { loadExternalDrivers } from "../../utils/external-drivers.js";
import { updateUndoRedoButtons } from "../navigation/UndoRedo.js";

/**
 * Renders a dropdown list (select element) with options
 * based on spec.rangeDividers and spec.rangeLabelKeys.
 */
export function addDropdownListItem(inputInstance, container = $("#inputs-content")) {
  const spec = inputInstance.spec;

  // ! Skip if this slider has already been added
  if (addedSliderIds.get().includes(spec.id)) {
    return;
  }
  // ! Mark as added
  addedSliderIds.set([...addedSliderIds.get(), spec.id]);

  const currentValue = inputInstance.get();

  // Build option values array: first min, then dividers, then maybe max
  let optionValues = [spec.minValue, ...spec.rangeDividers];
  if (optionValues.length < spec.rangeLabelKeys.length) {
    optionValues.push(spec.maxValue);
  }
  if (optionValues.length > spec.rangeLabelKeys.length) {
    optionValues = optionValues.slice(0, spec.rangeLabelKeys.length);
  }

  // Outer wrapper
  const wrapper = $('<div class="input-dropdown-list-item"/>');

  // Title + optional info icon + optional material icon
  const infoIcon = createInfoIcon(spec.hoverDescription);
  const extensiveInfoIcon = (function () {
    if (!spec.extensiveDescription) return null;

    const iconContainer = $('<div class="info-icon-container">');
    const bookIcon = $(`
    <span class="material-icons-two-tone book-popup-icon">menu_book</span>
  `);

    bookIcon.on("click", async function () {
      const mdContent = await loadMarkdownByName(spec.extensiveDescription);
      if (mdContent) {
        const resolvedContent = resolveLocalImages(mdContent);
        createPopupBox(resolvedContent);
      }
    });

    iconContainer.append(bookIcon);
    return iconContainer;
  })();
  
  // Create Material Icon element if defined
  let muiIconElem = null;
  if (spec.muiIcon) {
    muiIconElem = $(
      `<span class="material-icons-two-tone mui-icon">${spec.muiIcon}</span>`
    );
  }
  
  const titleAndIcon = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    muiIconElem,
    $(`<div class="input-title">${str(spec.labelKey)}</div>`),
    [
      infoIcon,
      extensiveInfoIcon,
    ].filter((el) => el) // drop the icon if null
  );
  // Append graph preview button if a graph exists with the same id as this input
  try {
    const graphSpec = coreConfig.graphs.get(spec.id);
    if (graphSpec) {
      const previewBtn = createGraphPreviewButton(spec.id);
      if (previewBtn) {
        if (extensiveInfoIcon && extensiveInfoIcon.before) {
          extensiveInfoIcon.before(previewBtn);
        } else if (infoIcon && infoIcon.after) {
          infoIcon.after(previewBtn);
        } else {
          titleAndIcon.append(previewBtn);
        }
      }
    }
  } catch (e) {
    // ignore if coreConfig isn't available
  }
  const titleRow = $('<div class="input-title-row"/>').append(titleAndIcon);
  wrapper.append(titleRow);

  // ——— Dropdown select element ———
  const selectId = `dropdown-list-${spec.id}`;
  const $select = $(`<select id="${selectId}" class="dropdown-list-select" data-input-id="${spec.id}"></select>`);
  
  const defaultValue = spec.defaultValue || spec.minValue; // Get the actual default value
  
  // Create options
  spec.rangeLabelKeys.forEach((labelKey, idx) => {
    const optionValue = optionValues[idx];
    const isDefaultValue = optionValue === defaultValue;
    const isSelected = currentValue === optionValue;
    
    const $option = $(`
      <option value="${optionValue}" data-is-default="${isDefaultValue}" ${isSelected ? 'selected' : ''}>
        ${str(labelKey)}
      </option>
    `);
    
    $select.append($option);
  });

  // Wrap select in a container for styling
  const selectContainer = $('<div class="dropdown-list-container"/>');
  selectContainer.append($select);
  wrapper.append(selectContainer);

  // Allow a segmented 'Custom' button to open this dropdown (if present).
  // Uses a delegated click handler scoped by spec.id to avoid coupling files.
  try {
    $(document).on(`click.dropdown_custom_${spec.id}`, `.segmented-button[data-input-id="${spec.id}"]`, function () {
      try {
        // Prefer an explicit data attribute set by the segmented button render
        const isCustom = $(this).attr('data-custom') === 'true';
        if (isCustom) {
          try {
            const sel = $select[0];
            if (sel) {
              // Focus first
              try { sel.focus(); } catch (e) {}

              // Try native click (works in some browsers)
              try { if (typeof sel.click === 'function') sel.click(); } catch (e) {}

              // As a fallback, temporarily set `size` on the select to show options
              try {
                const count = sel.options ? sel.options.length : 0;
                if (count > 1) {
                  const prev = sel.getAttribute('size');
                  sel.setAttribute('size', Math.min(6, count));
                  const restore = () => {
                    if (prev === null) sel.removeAttribute('size'); else sel.setAttribute('size', prev);
                    sel.removeEventListener('blur', restore);
                  };
                  sel.addEventListener('blur', restore);
                  // also auto-close after a short timeout
                  setTimeout(() => {
                    try { restore(); } catch (e) {}
                  }, 2500);
                }
              } catch (e) {}
            }
          } catch (e) {}
        }
      } catch (e) {}
    });
  } catch (e) {}

  // Handle change event
  $select.on("change", async function() {
    const newValue = parseFloat($(this).val());
    const prevValue = inputInstance.get();
    
    // Special handling for SSPs (ed8) - load external drivers
    if (spec.id === "ed8") {
      const selectedIndex = $(this).prop('selectedIndex');
      const scenarioName = str(spec.rangeLabelKeys[selectedIndex]); // "Optimistic", "Reference", or "Pessimistic"
    
      
      // Capture ALL input values before the change
      const allInputsBefore = {};
      coreConfig.inputs.forEach((inputSpec) => {
        const input = activeModel.get().getInputForId(inputSpec.id);
        if (input) {
          allInputsBefore[inputSpec.id] = input.get();
        }
      });
      
      // Change the SSP value
      inputInstance.set(newValue);
      
      try {
        const result = await loadExternalDrivers(scenarioName, activeModel.get());
        
        // Capture ALL input values after the change
        const allInputsAfter = {};
        const affectedIds = [];
        coreConfig.inputs.forEach((inputSpec) => {
          const input = activeModel.get().getInputForId(inputSpec.id);
          if (input) {
            allInputsAfter[inputSpec.id] = input.get();
            // Track which inputs actually changed
            if (allInputsBefore[inputSpec.id] !== allInputsAfter[inputSpec.id]) {
              affectedIds.push(inputSpec.id);
            }
          }
        });
        
        // Create a compound undo record for ALL changed inputs
        if (affectedIds.length > 0) {
          const undoArr = [...undoStack.get()];
          const prevValues = affectedIds.map(id => allInputsBefore[id]);
          const newValues = affectedIds.map(id => allInputsAfter[id]);
          
          undoArr.push({ 
            ids: affectedIds, 
            prevValues, 
            newValues,
            isSSPChange: true // Mark this as a special SSP change
          });
          undoStack.set(undoArr);
          redoStack.set([]);
          updateUndoRedoButtons();
          
          
        }
        
        
        
        if (result.warnings > 0) {
          console.warn(`${result.warnings} variables from ${scenarioName}.csv were not found in the model inputs`);
        }
      } catch (error) {
        console.error(`Failed to load SSP ${scenarioName}:`, error);
        // Still record the undo for the dropdown itself even if loading fails
        const undoArr = [...undoStack.get()];
        undoArr.push({ id: spec.id, prevValue, newValue });
        undoStack.set(undoArr);
        redoStack.set([]);
        updateUndoRedoButtons();
      }
    } else {
      // Normal dropdown (not SSP)
      const undoArr = [...undoStack.get()];
      undoArr.push({ id: spec.id, prevValue, newValue });
      undoStack.set(undoArr);
      redoStack.set([]);
      updateUndoRedoButtons();
      inputInstance.set(newValue);
    }
  });

  // ——— Optional description below ———
  if (spec.descriptionKey) {
    wrapper.append(
      $(`<div class="input-desc">${str(spec.descriptionKey)}</div>`)
    );
  }

  // Insert into DOM & return
  container.append(wrapper);
}
