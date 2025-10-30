import $ from "jquery";
import { config as coreConfig } from "@core";

import { addedSliderIds } from "../stores/inputs-store.js";
import { activeModel } from "../stores/model-store.js";

import { addSliderItem } from "./inputs/SliderInput.js";
import { addSwitchItem, setRenderInputGroup } from "./inputs/SwitchInput.js";
import { addSegmentedItem } from "./inputs/SegmentedButton.js";
import { addDropdownListItem } from "./inputs/DropdownList.js";
import { addCombinedSlider } from "./inputs/CombinedSlider.js";
import { addCombined2Slider } from "./inputs/Combined2Slider.js";
import { addSimpleLabelItem } from "./inputs/SimpleLabelInput.js";
import { addTextboxItem } from "./inputs/TextboxInput.js";
import { createDropdownGroup, initDropdownGroup } from "./inputs/DropdownGroup.js";

initDropdownGroup({
  addSliderItem,
  addSwitchItem,
  addSegmentedItem,
  addDropdownListItem,
  addSimpleLabelItem,
  addTextboxItem,
  addCombinedSlider,
  addCombined2Slider,
});

$("#input-category-selector-container").on(
  "click",
  ".input-category-selector-option",
  function () {
    if ($(this).hasClass("selected")) return;
    $(".input-category-selector-option").removeClass("selected");
    $(this).addClass("selected");
    const selectedCategory = $(this).data("value");
    initInputsUI(selectedCategory);
  }
);

function renderStandaloneInput(inputSpec) {
  if (inputSpec.viewId === "HIDDEN") {
    return; // Skip hidden inputs
  }
  const input = activeModel.get().getInputForId(inputSpec.id);
  const itemType = inputSpec.itemType;
  
  // Check for segmented buttons/lists first (can have itemType="SLIDER" but isSegmented="button" or "list")
  if (inputSpec.isSegmented === "button") {
    addSegmentedItem(input, $("#inputs-content"));
  } else if (inputSpec.isSegmented === "list") {
    addDropdownListItem(input, $("#inputs-content"));
  } else if (itemType === "SLIDER") {
    addSliderItem(input, $("#inputs-content"));
  } else if (itemType === "SWITCH") {
    addSwitchItem(input, $("#inputs-content"));
  } else if (itemType === "SIMPLE_LABEL") {
    addSimpleLabelItem(input, $("#inputs-content"));
  } else if (itemType === "TEXTBOX") {
    addTextboxItem(input, $("#inputs-content"));
  } else if (itemType === "SEGMENTED_BUTTON") {
    // Fallback for itemType=SEGMENTED_BUTTON (though typically handled above via isSegmented)
    addSegmentedItem(input, $("#inputs-content"));
  }
}

function renderInputGroup(
  groupName,
  groupInputs,
  container = $("#inputs-content")
) {
  const combinedTypeCheckPattern = /^(?:dropdown )?combined(?: \((.*?)\))?$/;

  const firstInputSecondaryType = groupInputs[0]?.secondaryType;
  if (firstInputSecondaryType && combinedTypeCheckPattern.test(firstInputSecondaryType)) {
    if (!firstInputSecondaryType.startsWith("dropdown ")) {
      addCombinedSlider(groupInputs, container);
      return;
    }
  }

  if (groupInputs[0]?.secondaryType?.startsWith("dropdown combined2")) {
    const titleMatch = groupInputs[0].secondaryType.match(
      /dropdown combined2 \((.*?)\)/
    );
    if (titleMatch) {
      const combinedTitle = titleMatch[1];
      const combinedInputs = groupInputs.filter(
        (input) =>
          input.secondaryType === `dropdown combined2 (${combinedTitle})`
      );
      if (combinedInputs.length >= 2) {
        addCombined2Slider(combinedInputs, container);
        return;
      }
    }
  }

  const standaloneInputs = [];
  let mainInput = null;
  const assumptionInputs = [];
  const assumptionCombinedSliders = [];
  const assumptionCombined2Sliders = [];

  groupInputs.forEach((inputSpec) => {
    if (inputSpec.secondaryType === "without" || inputSpec.secondaryType === "textbox") {
      standaloneInputs.push(inputSpec);
    } else if (
      inputSpec.secondaryType === "dropdown main" ||
      inputSpec.secondaryType === "dropdown main label"
    ) {
      mainInput = inputSpec;
    } else if (inputSpec.secondaryType === "dropdown assumptions" || 
               (inputSpec.secondaryType && inputSpec.secondaryType.includes("dropdown assumptions"))) {
      assumptionInputs.push(inputSpec);
    } else if (inputSpec.secondaryType === "dropdown combined" || 
               (inputSpec.secondaryType?.startsWith("dropdown combined (") && 
                !inputSpec.secondaryType?.startsWith("dropdown combined2"))) {
      assumptionCombinedSliders.push(inputSpec);
    } else if (inputSpec.secondaryType?.startsWith("dropdown combined2")) {
      assumptionCombined2Sliders.push(inputSpec);
    }
  });

  if (mainInput) {
    createDropdownGroup(
      mainInput,
      assumptionInputs,
      assumptionCombinedSliders,
      assumptionCombined2Sliders,
      container
    );
  }

  standaloneInputs.forEach((inputSpec) => {
    renderStandaloneInput(inputSpec, container);
  });
}

setRenderInputGroup(renderInputGroup);

export function initInputsUI(category) {
  $("#inputs-content").empty();
  addedSliderIds.set([]);

  const dynamicInputCategories = {};
  for (const inputSpec of coreConfig.inputs.values()) {
    if (inputSpec.viewId === "HIDDEN") {
      continue;
    }
    
    const inputCategory = inputSpec.categoryId;
    const inputGroup = inputSpec.inputGroup;
    if (!inputCategory || !inputGroup) continue;

    if (!dynamicInputCategories[inputCategory]) {
      dynamicInputCategories[inputCategory] = {};
    }
    if (!dynamicInputCategories[inputCategory][inputGroup]) {
      dynamicInputCategories[inputCategory][inputGroup] = [];
    }
    dynamicInputCategories[inputCategory][inputGroup].push(inputSpec);
  }

  const categoryGroups = dynamicInputCategories[category] || {};

  if (coreConfig.inputs.size > 0) {
    Object.entries(categoryGroups).forEach(([groupName, groupInputs]) => {
      renderInputGroup(groupName, groupInputs);
    });
  } else {
    const msg = `No sliders configured. Edit ''config/inputs.csv'' to get started.`;
    $("#inputs-content").html(`<div style="padding-top: 10px">${msg}</div>`);
  }
}
