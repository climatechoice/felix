/**
 * SummaryView.js
 * Extracted from NavBar.js - displays summary of changed inputs in a popup
 */

import { config as coreConfig } from "@core";
import { model, modelB } from "../../stores/model-store.js";
import { str, createPopupBox } from "../../lib/utils.js";

/**
 * Show a popup with a summary of all changed inputs for both models
 */
export function showChangedInputs() {
  const modelInstances = [model.get(), modelB.get()];
  const allChanged = modelInstances.map((modelInstance, index) => {
    const changedInputs = [];

    coreConfig.inputs.forEach((spec) => {
      // Skip inputs with secondaryType 'hidden' from summary (external drivers)
      if (spec.secondaryType === "hidden") {
        return;
      }
      
      const input = modelInstance.getInputForId(spec.id);
      if (!input) return;

      const currentValue = input.get();
      const defaultValue = spec.defaultValue;

      if (currentValue !== defaultValue) {
        changedInputs.push(formatInputChange(spec, defaultValue, currentValue));
      }
    });

    return changedInputs;
  });

  const markdownTable = createSummaryMarkdownTable(
    allChanged[0],
    allChanged[1]
  );
  // Use position = left for this popup
  createPopupBox(markdownTable, "left");
}

/**
 * Format an input change for display (handles segmented buttons specially)
 */
function formatInputChange(spec, defaultValue, currentValue) {
  const label = `**${str(spec.labelKey)}**`;
  // If input is a segmented button or dropdown list, show the labels, not the numeric values
  if ((spec.isSegmented === "button" || spec.isSegmented === "list") && Array.isArray(spec.rangeLabelKeys)) {
    const segmentValues = buildSegmentValues(spec);
    const valueToLabel = segmentValues.reduce((acc, val, idx) => {
      acc[val] = str(spec.rangeLabelKeys[idx]);
      return acc;
    }, {});
    const formattedDefault = valueToLabel[defaultValue] ?? defaultValue;
    const formattedCurrent = valueToLabel[currentValue] ?? currentValue;
    return `${label}: ${formattedDefault} → ${formattedCurrent}`;
  }

  return `${label}: ${defaultValue} → ${currentValue}`;
}

/**
 * Build segment values array from spec (for segmented buttons)
 */
function buildSegmentValues(spec) {
  let values = [spec.minValue, ...spec.rangeDividers];
  if (values.length < spec.rangeLabelKeys.length) {
    values.push(spec.maxValue);
  }
  return values.slice(0, spec.rangeLabelKeys.length);
}

/**
 * Create markdown table with changed inputs for both models
 */
function createSummaryMarkdownTable(model1Changes, model2Changes) {
  const maxRows = Math.max(model1Changes.length, model2Changes.length);
  const lines = [];

  lines.push("## Summary of Scenario Inputs");

  lines.push("| Scenario 1 🟪 | Scenario 2 🟧 |");
  lines.push("| ------- | ------- |");

  for (let i = 0; i < maxRows; i++) {
    const cell1 = model1Changes[i] || "";
    const cell2 = model2Changes[i] || "";
    lines.push(`| ${cell1} | ${cell2} |`);
  }

  return lines.join("\n");
}
