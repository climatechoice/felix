/**
 * DropdownGroup.js
 * Extracted from InputsUI.js - collapsible dropdown groups with main input and assumptions
 * Used for organizing related inputs (e.g., a main scenario selector with detailed sub-options)
 */

import $ from "jquery";
import { addedSliderIds } from "../../stores/inputs-store.js";
import { activeModel } from "../../stores/model-store.js";

// Forward declarations - these will be provided by the parent component
let addSliderItem;
let addSwitchItem;
let addSegmentedItem;
let addSimpleLabelItem;
let addTextboxItem;
let addCombinedSlider;
let addCombined2Slider;

/**
 * Initialize dropdown group with required render functions
 */
export function initDropdownGroup(renderFunctions) {
  addSliderItem = renderFunctions.addSliderItem;
  addSwitchItem = renderFunctions.addSwitchItem;
  addSegmentedItem = renderFunctions.addSegmentedItem;
  addSimpleLabelItem = renderFunctions.addSimpleLabelItem;
  addTextboxItem = renderFunctions.addTextboxItem;
  addCombinedSlider = renderFunctions.addCombinedSlider;
  addCombined2Slider = renderFunctions.addCombined2Slider;
}

/**
 * Creates a collapsible dropdown group containing a main input and related assumption inputs.
 * The main input can be a slider, segmented button, textbox, or label.
 * Assumption inputs can include sliders, switches, combined sliders, and combined2 sliders.
 * 
 * @param {Object} mainInputSpec - Spec for the main (header) input
 * @param {Array} assumptionInputs - Array of assumption input specs
 * @param {Array} assumptionCombinedSliders - Array of combined slider specs (pairs of inputs)
 * @param {Array} assumptionCombined2Sliders - Array of combined2 slider specs (2+ inputs)
 * @param {jQuery} container - Container element to append to
 */
export function createDropdownGroup(
  mainInputSpec,
  assumptionInputs,
  assumptionCombinedSliders,
  assumptionCombined2Sliders,
  container = $("#inputs-content")
) {
  // Add main input
  const mainInputInstance = activeModel.get().getInputForId(mainInputSpec.id);
  
  // Check if already added
  if (addedSliderIds.get().includes(mainInputSpec.id)) {
    return; // Skip if duplicate
  }

  const dropdownContainer = $('<div class="input-dropdown-group">');
  const dropdownHeader = $('<div class="dropdown-header">');
  const dropdownContent = $(
    '<div class="dropdown-content" style="display: none;">'
  );
  const expandButton = $(`
    <button class="expand-button">
      <span class="material-icons">expand_more</span>
    </button>
  `);
  let allowArrowToggle = true;

  // Append dropdownContainer to DOM first
  container.append(dropdownContainer);
  dropdownContainer.append(dropdownHeader, dropdownContent);

  // Render main input based on type
  if (mainInputSpec.isSegmented !== "yes") {
    if (mainInputSpec.secondaryType === "dropdown main") {
      // Normal slider
      const sliderDiv = addSliderItem(mainInputInstance, dropdownHeader);
      if (sliderDiv) {
        sliderDiv.find(".input-title-row").prepend(expandButton);
      } else {
        console.error("Slider not created for:", mainInputSpec.id);
      }
    } else if (mainInputSpec.secondaryType === "dropdown main label") {
      // Label only (no control)
      const simpleLabelDiv = addSimpleLabelItem(
        mainInputInstance,
        dropdownHeader
      );
      if (simpleLabelDiv) {
        simpleLabelDiv.find(".input-title-row").prepend(expandButton);
      } else {
        console.error("Simple Label not created for:", mainInputSpec.id);
      }
    } else if (mainInputSpec.secondaryType === "dropdown main textbox" || 
               (mainInputSpec.secondaryType && mainInputSpec.secondaryType.includes("textbox"))) {
      // Textbox input
      const textboxDiv = addTextboxItem(mainInputInstance, dropdownHeader);
      if (textboxDiv) {
        textboxDiv.find(".input-title-row").prepend(expandButton);
        // Auto-expand dropdown so textbox is visible
        dropdownContent.show();
        expandButton.find('.material-icons').text('expand_less');
      } else {
        console.error("Textbox not created for:", mainInputSpec.id);
      }
    } else {
      console.warn("This secondary type is not yet supported:", mainInputSpec.secondaryType);
    }
  } else {
    // Segmented button
    const segmentedDiv = addSegmentedItem(mainInputInstance, dropdownHeader);
    if (!segmentedDiv) {
      console.error("segmentedDiv not created for:", mainInputSpec.id);
    } else {
      // Bind click handler: open on 'Custom', close on other segments
      segmentedDiv.find('.segmented-button').on('click', function (e) {
        e.stopPropagation();
        const isCustom = $(this).text().trim().toLowerCase() === 'custom';
        if (isCustom) {
          // Open this dropdown (if not already open)
          if (!dropdownContent.is(':visible')) {
            dropdownContent.slideDown(200);
            dropdownContainer.find('.expand-button .material-icons').text('expand_less');
          }
        } else {
          // Close if open and clicking non-Custom segment
          if (dropdownContent.is(':visible')) {
            dropdownContent.slideUp(150);
            dropdownContainer.find('.expand-button .material-icons').text('expand_more');
          }
        }
      });
      // Disable arrow toggle for segmented mains
      allowArrowToggle = false;
    }
  }

  // Add assumption inputs
  assumptionInputs.forEach((inputSpec) => {
    const input = activeModel.get().getInputForId(inputSpec.id);
    if (input.kind === "slider") {
      if (inputSpec.isSegmented === "yes") {
        addSegmentedItem(input, dropdownContent);
      } else {
        // Check if textbox type
        if (inputSpec.secondaryType && inputSpec.secondaryType.includes("textbox")) {
          addTextboxItem(input, dropdownContent);
        } else {
          addSliderItem(input, dropdownContent);
        }
      }
    } else if (input.kind === "switch") {
      addSwitchItem(input, dropdownContent);
    }
  });

  // Add assumption combined sliders (exactly 2 inputs each)
  if (assumptionCombinedSliders.length > 0) {
    // Group by title
    const combinedGroups = {};
    const combinedTitleRegex = /dropdown combined(?: \((.*?)\))?$/;
    assumptionCombinedSliders.forEach((inputSpec) => {
      const titleMatch = inputSpec.secondaryType.match(combinedTitleRegex);
      const titleKey = titleMatch && titleMatch[1] ? titleMatch[1] : inputSpec.inputGroup;
      if (!combinedGroups[titleKey]) {
        combinedGroups[titleKey] = [];
      }
      combinedGroups[titleKey].push(inputSpec);
    });

    // Add each group
    Object.values(combinedGroups).forEach((group) => {
      if (group.length === 2) {
        addCombinedSlider(group, dropdownContent);
      } else {
        console.warn("Combined slider group has unexpected number of inputs:", group);
      }
    });
  }

  // Add assumption combined2 sliders (2+ inputs each)
  if (assumptionCombined2Sliders.length > 0) {
    // Group by title
    const combined2Groups = {};
    assumptionCombined2Sliders.forEach((inputSpec) => {
      const titleMatch = inputSpec.secondaryType.match(
        /dropdown combined2 \((.*?)\)/
      );
      if (titleMatch) {
        const title = titleMatch[1];
        if (!combined2Groups[title]) {
          combined2Groups[title] = [];
        }
        combined2Groups[title].push(inputSpec);
      }
    });

    // Add each group
    Object.values(combined2Groups).forEach((group) => {
      if (group.length >= 2) {
        addCombined2Slider(group, dropdownContent);
      }
    });
  }

  // Toggle handler
  if (allowArrowToggle) {
    let isExpanded = false;
    expandButton.on("click", (e) => {
      e.stopPropagation();
      isExpanded = !dropdownContent.is(':visible');
      dropdownContent.slideToggle(200);
      expandButton
        .find(".material-icons")
        .text(isExpanded ? "expand_less" : "expand_more");
    });
  } else {
    // Prevent arrow toggle for segmented mains
    expandButton.on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  return dropdownContainer;
}
