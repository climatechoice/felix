import $ from "jquery";
import { config as coreConfig } from "@core";
import { model, modelB } from "../stores/model-store";
import { isMultiScenarioMode } from "../stores/scenario-mode-store.js";
import { initInputsUI } from "./InputsUI";

/**
 * Shows an interactive survey popup that generates a scenario configuration
 * based on user responses. Once complete, it automatically imports the
 * generated scenario into the current model.
 */
export function showSurveyPopup() {
  // Remove any existing popup
  $(".popup-overlay, .popup").remove();

  // Check if multi-scenario mode is active
  const isMultiMode = isMultiScenarioMode.get();

  // Create the popup container
  const popup = $('<div class="popup popup-middle survey-popup">');
  
  // Create survey buttons based on mode
  const submitButtons = isMultiMode 
    ? `
      <button type="button" class="survey-submit-btn" data-model="1">Load to Scenario 1</button>
      <button type="button" class="survey-submit-btn" data-model="2">Load to Scenario 2</button>
    `
    : `<button type="submit" class="survey-submit-btn">Generate & Load Scenario</button>`;
  
  // Create survey content
  const surveyContent = $('<div class="survey-container">').html(`
    <h2>Build Your Own Scenario</h2>
    <p style="color: #666; margin-bottom: 20px;">Translating behaviors into quantitative inputs can be challenging. Answer these questions about consumer preferences to help determine appropriate scenario parameters${isMultiMode ? ' and select which model to load it into' : ''}.</p>
    
    <form id="survey-form">
      <div class="survey-question">
        <label><strong>1. Diet Change</strong></label>
        <div class="survey-options">
          <label><input type="radio" name="diet" value="0" required> Reference</label>
          <label><input type="radio" name="diet" value="1"> Healthy</label>
          <label><input type="radio" name="diet" value="2"> Mediterranean</label>
          <label><input type="radio" name="diet" value="3"> Flexitarian</label>
        </div>
      </div>

      <div class="survey-question">
        <label><strong>2. Food Loss and Waste</strong></label>
        <div class="survey-options">
          <label><input type="radio" name="waste" value="0" required> Reference</label>
          <label><input type="radio" name="waste" value="25"> -25%</label>
          <label><input type="radio" name="waste" value="50"> -50%</label>
          <label><input type="radio" name="waste" value="75"> -75%</label>
        </div>
      </div>

      <div class="survey-question">
        <label><strong>3. Alternative Proteins</strong></label>
        <div class="survey-options">
          <label><input type="radio" name="altproteins" value="0" required> Reference</label>
          <label><input type="radio" name="altproteins" value="33"> 10%</label>
          <label><input type="radio" name="altproteins" value="66"> 20%</label>
          <label><input type="radio" name="altproteins" value="100"> 30%</label>
        </div>
      </div>

      <div class="survey-buttons">
        <button type="button" class="survey-cancel-btn">Cancel</button>
        ${submitButtons}
      </div>
    </form>
  `);

  // Add close button
  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);
  
  // Create overlay first (needed for closePopup function)
  const overlay = $('<div class="popup-overlay">');
  
  const closePopup = () => {
    popup.remove();
    overlay.remove();
  };

  closeBtn.on("click", closePopup);
  surveyContent.find('.survey-cancel-btn').on('click', closePopup);

  // Function to handle scenario generation and loading
  const handleScenarioLoad = (modelNumber) => {
    const form = surveyContent.find('#survey-form')[0];
    
    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    try {
      // Collect survey responses
      const formData = new FormData(form);
      const responses = {
        diet: parseInt(formData.get('diet')),
        waste: parseInt(formData.get('waste')),
        altproteins: parseInt(formData.get('altproteins'))
      };
      
      console.log('Survey responses:', responses);
      
      // Generate scenario based on responses
      console.log('Calling generateScenarioFromSurvey...');
      const scenarioData = generateScenarioFromSurvey(responses);
      console.log('Generated scenario data:', scenarioData);
      
      if (!scenarioData || scenarioData.length === 0) {
        alert('Error: No scenario data generated!');
        return;
      }
      
      const modelLabel = modelNumber === 2 ? 'Model 2' : 'Model 1';
      
      // Show loading message
      surveyContent.html(`
        <div style="text-align: center; padding: 40px;">
          <h2>Generating Scenario...</h2>
          <p style="color: #666;">Processing your preferences and loading the scenario.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Generated ${scenarioData.length} input changes for ${modelLabel}</p>
        </div>
      `);
      
      // Apply the scenario immediately (no delay)
      console.log(`Applying scenario to ${modelLabel}...`);
      
      const result = applyGeneratedScenario(scenarioData, modelNumber);
      console.log('Apply result:', result);
      
      // Show success message
      surveyContent.html(`
        <div style="text-align: center; padding: 40px;">
          <span class="material-icons" style="font-size: 48px; color: #4caf50;">check_circle</span>
          <h2 style="margin-top: 10px;">Scenario Loaded!</h2>
          <p style="color: #666; margin-top: 10px;">Your custom scenario has been applied to ${modelLabel}.</p>
          <p style="color: #666; margin-top: 5px;">Check the inputs panel to see the changes.</p>
        </div>
      `);
      
      setTimeout(closePopup, 2000);
      
    } catch (error) {
      console.error('Error in scenario load:', error);
      alert('Error: ' + error.message);
      surveyContent.html(`
        <div style="text-align: center; padding: 40px;">
          <span class="material-icons" style="font-size: 48px; color: #f44336;">error</span>
          <h2 style="margin-top: 10px;">Error!</h2>
          <p style="color: #666; margin-top: 10px;">${error.message}</p>
        </div>
      `);
      setTimeout(closePopup, 3000);
    }
  };

  // Handle form submission (single scenario mode)
  surveyContent.find('#survey-form').on('submit', function(e) {
    e.preventDefault();
    handleScenarioLoad(1);
  });

  // Handle button clicks (multi scenario mode)
  surveyContent.find('.survey-submit-btn[data-model]').on('click', function(e) {
    e.preventDefault();
    const modelNumber = parseInt($(this).data('model'));
    handleScenarioLoad(modelNumber);
  });

  popup.append(closeBtn, surveyContent);

  // Configure overlay click behavior
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) {
      closePopup();
    }
  });

  overlay.append(popup);
  $("body").append(overlay);
}

/**
 * Generates scenario input values based on survey responses.
 * Maps user choices directly to the model's slider preset values.
 */
function generateScenarioFromSurvey(responses) {
  const scenarios = [];
  
  // Diet Change: 0=Reference, 1=Healthy, 2=Mediterranean, 3=Flexitarian, 4=Custom
  scenarios.push({ 
    varName: 'Global Diet Composition Switch', 
    value: responses.diet 
  });
  
  // Food Loss and Waste: 0=Reference, 25=-25%, 50=-50%, 75=-75%
  scenarios.push({ 
    varName: 'FWL Multiplier', 
    value: responses.waste 
  });
  
  // Alternative Proteins: 0=Reference, 33=10%, 66=20%, 100=30%
  scenarios.push({ 
    varName: 'Market share AP multiplier', 
    value: responses.altproteins 
  });
  
  return scenarios;
}

/**
 * Helper function to find input spec by VarName
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
 * Helper function to coerce value based on spec type
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
    throw new Error(`Cannot parse "${str}" as a number for input ${spec.id}`);
  return num;
}

/**
 * Applies the generated scenario data to the specified model.
 * Uses the same logic as processCSVFile but with generated data.
 * @param {Array} scenarioData - Array of {varName, value} objects
 * @param {number} modelNumber - 1 for Model 1, 2 for Model 2
 */
function applyGeneratedScenario(scenarioData, modelNumber = 1) {
  const modelInstance = modelNumber === 2 ? modelB.get() : model.get();
  const modelLabel = modelNumber === 2 ? 'Model 2' : 'Model 1';
  
  if (!modelInstance) {
    console.error(`${modelLabel} instance not available`);
    alert(`Error: ${modelLabel} not loaded. Please refresh the page.`);
    return;
  }

  console.log(`Applying scenario to ${modelLabel} with data:`, scenarioData);

  let applied = 0;
  let warnings = 0;

  scenarioData.forEach((item) => {
    console.log(`Processing: ${item.varName} = ${item.value}`);
    
    const spec = getSpecByVarName(item.varName);
    if (!spec) {
      console.warn(`Input not found for VarName "${item.varName}"`);
      warnings++;
      return;
    }

    console.log(`Found spec for ${item.varName}:`, spec.id);

    const input = modelInstance.getInputForId(spec.id);
    if (!input) {
      console.warn(`Input id "${spec.id}" not present for VarName "${item.varName}"`);
      warnings++;
      return;
    }

    try {
      const coerced = coerceValueForSpec(item.value, spec);
      console.log(`Setting ${spec.id} to ${coerced} on ${modelLabel}`);
      input.set(coerced);
      applied++;
    } catch (err) {
      console.error(`Failed to set value for VarName "${item.varName}":`, err);
      warnings++;
    }
  });

  console.log(`Survey scenario applied to ${modelLabel}. Changes: ${applied}. Warnings: ${warnings}.`);

  // Refresh Inputs UI so changes are visible
  const selectedCategory = $(".input-category-selector-option.selected").data("value");
  if (selectedCategory) {
    initInputsUI(selectedCategory);
  } else {
    console.warn('No category selected, refreshing with first category');
    initInputsUI('Consumer Choices'); // Fallback to a default category
  }
}
