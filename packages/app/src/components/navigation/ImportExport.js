/**
 * ImportExport.js
 * Extracted from NavBar.js - handles CSV import/export of scenario inputs
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { model, modelB, activeModel } from "../../stores/model-store.js";
import { isMultiScenarioMode } from "../../stores/scenario-mode-store.js";
import { initInputsUI } from "../InputsUI.js";

/**
 * Export the active model's inputs to a CSV file
 */
export function exportInputsToCSV() {
  const activeModelInstance = activeModel.get();
  
  if (!activeModelInstance) {
    alert("No model loaded. Please refresh the page.");
    return;
  }

  const rows = [["VarName", "Value"]];

  coreConfig.inputs.forEach((spec) => {
    const input = activeModelInstance.getInputForId(spec.id);
    if (!input) return;

    const varName = spec.varName;
    const value = input.get();

    rows.push([varName, value]);
  });

  const csvContent = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scenario_inputs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Handle import button click - shows scenario selection in multi-mode
 */
export function handleImportClick() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.onchange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If in multi-scenario mode, show popup to select which scenario to import into
    if (isMultiScenarioMode.get()) {
      showScenarioSelectionPopup(file);
    } else {
      // In single scenario mode, import directly into model 1
      processCSVFile(file, 1);
    }
  };

  fileInput.click();
}

/**
 * Show popup to select which scenario to import into (multi-scenario mode only)
 */
function showScenarioSelectionPopup(file) {
  // Remove any existing popup
  $(".popup-overlay, .popup").remove();

  const popup = $('<div class="popup popup-middle" style="max-width: 400px;">');
  
  const content = $('<div style="padding: 20px; text-align: center;">').html(`
    <h2 style="margin-top: 0;">Import Scenario</h2>
    <p style="color: #666; margin-bottom: 30px;">Which scenario would you like to import this file into?</p>
    
    <div style="display: flex; gap: 15px; justify-content: center;">
      <button class="import-scenario-choice" data-model="1" style="
        padding: 15px 30px;
        background: #6a3d9a;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 1
      </button>
      <button class="import-scenario-choice" data-model="2" style="
        padding: 15px 30px;
        background: #e66100;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
      ">
        Scenario 2
      </button>
    </div>
    
    <button class="import-cancel-btn" style="
      margin-top: 20px;
      padding: 8px 20px;
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Cancel</button>
  `);

  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);

  const overlay = $('<div class="popup-overlay">');
  
  const closePopup = () => {
    popup.remove();
    overlay.remove();
  };

  closeBtn.on("click", closePopup);
  content.find('.import-cancel-btn').on('click', closePopup);
  
  // Handle scenario selection
  content.find('.import-scenario-choice').on('click', function() {
    const modelNumber = parseInt($(this).data('model'));
    closePopup();
    processCSVFile(file, modelNumber);
  });

  // Hover effects
  content.find('.import-scenario-choice').on('mouseenter', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#552f7a' : '#cc5500');
  }).on('mouseleave', function() {
    const model = $(this).data('model');
    $(this).css('background', model === 1 ? '#6a3d9a' : '#e66100');
  });

  popup.append(closeBtn, content);
  overlay.append(popup);
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) closePopup();
  });
  
  $("body").append(overlay);
}

/**
 * Process and import a CSV file into the specified model
 */
function processCSVFile(file, modelNumber = 1) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const csvText = e.target.result;
    const rows = parseCSV(csvText);
    if (!rows.length) {
      console.error("CSV file appears to be empty.");
      alert("Error: CSV file appears to be empty.");
      return;
    }

    // Strip BOM from first header cell if present
    if (rows[0] && rows[0][0]) rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");

    const headers = rows[0].map((h) => (h || "").trim());
    console.log('CSV headers:', headers);
    
    const varNameIdx = headers.indexOf("VarName");
    const valueIdx = headers.indexOf("Value");

    console.log('Column indices - VarName:', varNameIdx, 'Value:', valueIdx);

    if (varNameIdx === -1 || valueIdx === -1) {
      console.error("CSV must contain 'VarName' and 'Value' columns.");
      alert("Error: CSV must contain 'VarName' and 'Value' columns.");
      return;
    }

    const targetModelInstance = modelNumber === 2 ? modelB.get() : model.get();
    const targetModelLabel = `Scenario ${modelNumber}`;
    
    console.log(`Loading CSV into ${targetModelLabel}`, targetModelInstance);
    
    if (!targetModelInstance) {
      console.error(`${targetModelLabel} instance not available`);
      alert(`Error: ${targetModelLabel} not loaded. Please refresh the page.`);
      return;
    }

    let applied = 0;
    let warnings = 0;

    console.log(`Processing ${rows.length - 1} data rows...`);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const varName = (row[varNameIdx] ?? "").trim();
      const rawValue = (row[valueIdx] ?? "").trim();
      
      console.log(`Row ${r}: VarName="${varName}", Value="${rawValue}"`);
      
      if (!varName) continue;

      const spec = getSpecByVarName(varName);
      console.log(`  Spec found:`, spec ? `ID: ${spec.id}` : 'null');
      
      if (!spec) {
        console.warn(
          `Input not found for VarName "${varName}" at row ${r + 1}`
        );
        warnings++;
        continue;
      }

      const input = targetModelInstance.getInputForId(spec.id);
      console.log(`  Input found:`, input ? 'yes' : 'no');
      
      if (!input) {
        console.warn(
          `Input id "${spec.id}" not present on ${targetModelLabel} for VarName "${varName}"`
        );
        warnings++;
        continue;
      }

      try {
        const coerced = coerceValueForSpec(rawValue, spec);
        console.log(`  Setting value to:`, coerced);
        input.set(coerced);
        applied++;
      } catch (err) {
        console.error(
          `Failed to set value for VarName "${varName}" in ${targetModelLabel}:`,
          err
        );
        warnings++;
      }
    }

    // Refresh Inputs UI so changes are visible
    const selectedCategory = $(".input-category-selector-option.selected").data(
      "value"
    );
    initInputsUI(selectedCategory);

    console.log(`Import to ${targetModelLabel} finished. Applied: ${applied}. Warnings: ${warnings}.`);
    
    alert(
      `Imported ${applied} value(s) into ${targetModelLabel}.${
        warnings ? `\n${warnings} warning(s) - check console.` : ""
      }`
    );
  };

  reader.readAsText(file);
}

// ============ Helper Functions ============

/**
 * Escape a single cell value for CSV format
 */
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Parse CSV text into array of rows
 */
function parseCSV(text) {
  const s = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < s.length) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Coerce CSV string value to the type expected by the input spec
 */
function coerceValueForSpec(raw, spec) {
  const dv = spec?.defaultValue;
  if (typeof dv === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : dv;
  }
  if (typeof dv === "boolean") {
    const t = String(raw).trim().toLowerCase();
    return t === "true" || t === "1" || t === "yes";
  }
  return raw; // strings and everything else
}

/**
 * Find input spec by variable name
 */
function getSpecByVarName(varName) {
  let found = null;
  coreConfig.inputs.forEach((spec) => {
    if (!found && spec.varName === varName) found = spec;
  });
  return found;
}
