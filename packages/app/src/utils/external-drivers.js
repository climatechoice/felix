/**
 * ExternalDriverLoader.js
 * 
 * Handles loading external driver variables from CSV files in config/ExternalDrivers/
 * These are SSP (Shared Socioeconomic Pathways) scenarios that affect multiple
 * model variables not exposed in the main inputs UI.
 */

import { config as coreConfig } from "@core";

/**
 * Parse CSV text into rows
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

  if (row.length > 0 || field) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Find input spec by VarName
 */
function getSpecByVarName(varName) {
  let found = null;
  if (coreConfig && coreConfig.inputs && coreConfig.inputs.forEach) {
    coreConfig.inputs.forEach((spec) => {
      if (!found && spec.varName === varName) found = spec;
    });
  }
  return found;
}

/**
 * Coerce value based on spec type
 */
function coerceValueForSpec(rawValue, spec) {
  if (typeof rawValue === "number") return rawValue;
  const str = String(rawValue).trim();
  if (str === "") return null;

  if (spec.inputType === "switch") {
    const lower = str.toLowerCase();
    if (lower === "true" || lower === "1" || lower === spec.enabledValue)
      return spec.enabledValue;
    if (lower === "false" || lower === "0" || lower === spec.disabledValue)
      return spec.disabledValue;
    return spec.disabledValue;
  }

  const num = Number(str);
  if (Number.isNaN(num))
    throw new Error(`Cannot parse "${str}" as a number for VarName ${spec.varName}`);
  
  // Validate that the value is within the min/max range
  if (spec.minValue !== undefined && num < spec.minValue) {
    console.warn(`Value ${num} for input ${spec.id} is below minimum ${spec.minValue}. Rejecting and using default value ${spec.defaultValue}.`);
    return spec.defaultValue;
  }
  
  if (spec.maxValue !== undefined && num > spec.maxValue) {
    console.warn(`Value ${num} for input ${spec.id} is above maximum ${spec.maxValue}. Rejecting and using default value ${spec.defaultValue}.`);
    return spec.defaultValue;
  }
  
  return num;
}

/**
 * Load external drivers from a CSV file
 * @param {string} scenario - "Reference", "Optimistic", or "Pessimistic"
 * @param {object} modelInstance - The model instance to apply values to
 * @returns {Promise<{applied: number, warnings: number}>}
 */
export async function loadExternalDrivers(scenario, modelInstance) {
  // Normalize the scenario name: strip trailing decorators (e.g. "*") that may
  // appear in button labels but are not part of the actual scenario identifier.
  scenario = scenario.replace(/[*\s]+$/, "").trim();

  const validScenarios = ["Reference", "Optimistic", "Pessimistic"];
  
  if (!validScenarios.includes(scenario)) {
    throw new Error(`Invalid scenario: ${scenario}. Must be one of: ${validScenarios.join(", ")}`);
  }

  if (!modelInstance) {
    throw new Error("Model instance is required");
  }

  try {
    // Fetch the CSV file from static directory
    const response = await fetch(`${scenario}.csv`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${scenario}.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      throw new Error("CSV file appears to be empty");
    }

    // Strip BOM from first cell if present
    if (rows[0] && rows[0][0]) {
      rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
    }


    let applied = 0;
    let warnings = 0;
    const notFoundVars = [];

    // For Reference scenario, set all external driver variables to their default from inputs.csv
    if (scenario === "Reference") {
      coreConfig.inputs.forEach((spec) => {
        // Only set for external drivers (secondaryType === "hidden")
        if (spec.secondaryType === "hidden") {
          const input = modelInstance.getInputForId(spec.id);
          if (!input) return;
          input.set(spec.defaultValue);
          applied++;
        }
      });
    } else {
      // For Optimistic/Pessimistic, set from scenario CSV
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const varName = (row[0] ?? "").trim();
        const rawValue = (row[1] ?? "").trim();

        if (!varName) continue;

        // Try to find the spec for this VarName
        const spec = getSpecByVarName(varName);

        if (!spec) {
          notFoundVars.push(varName);
          warnings++;
          continue;
        }

        // Try to get the input
        const input = modelInstance.getInputForId(spec.id);
        if (!input) {
          console.warn(`Input id \"${spec.id}\" not found on model for VarName \"${varName}\"`);
          warnings++;
          continue;
        }

        try {
          const coercedValue = coerceValueForSpec(rawValue, spec);
          input.set(coercedValue);
          applied++;
        } catch (err) {
          console.error(`Failed to set value for VarName \"${varName}\"`, err);
          warnings++;
        }
      }
    }

    if (notFoundVars.length > 0) {
      // keep a warning for missing vars but avoid verbose logging
      console.warn(`Variables not in inputs.csv (${notFoundVars.length}) - see console for details`);
    }

    return { applied, warnings, notFoundVars };
  } catch (error) {
    console.error(`Error loading external drivers (${scenario}):`, error);
    throw error;
  }
}
