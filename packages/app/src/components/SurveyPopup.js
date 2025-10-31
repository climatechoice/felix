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
  
  // Create survey content container
  const surveyContent = $('<div class="survey-container">');
  
  // Store survey responses
  const surveyResponses = {
    diet: null,
    waste: null,
    altproteins: null
  };
  
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

  // Function to render a specific page
  const renderPage = (pageType, category = null) => {
    surveyContent.empty();
    
    if (pageType === 'intro') {
      // Check which categories are answered
      const dietAnswered = surveyResponses.diet !== null;
      const wasteAnswered = surveyResponses.waste !== null;
      const altproteinsAnswered = surveyResponses.altproteins !== null;
      const anyAnswered = dietAnswered || wasteAnswered || altproteinsAnswered;
      
      // Create submit buttons based on mode
      const submitButtons = isMultiMode 
        ? `
          <button type="button" class="survey-submit-btn" data-model="1">Load to Scenario 1</button>
          <button type="button" class="survey-submit-btn" data-model="2">Load to Scenario 2</button>
        `
        : `<button type="button" class="survey-submit-btn">Generate & Load Scenario</button>`;
      
      // Intro page
        surveyContent.html(`
          <h2>Build Your Own Scenario <span class="wip-badge" title="This feature is under active development">Work in progress</span></h2>
        <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">
          Experiencing difficulty understanding what all these numbers mean? Try out our survey questions which are more relatable to you as a consumer, and imagine the future if everyone adopts the same consumer behaviour as you.
        </p>
        
        <div class="survey-category-buttons">
          <button type="button" class="survey-category-btn ${dietAnswered ? 'answered' : ''}" data-category="diet">
            <div class="survey-category-header">
              <strong>Diet Change</strong>
              ${dietAnswered ? '<span class="material-icons survey-check">check_circle</span>' : ''}
            </div>
            <span>Choose your dietary preferences</span>
          </button>
          <button type="button" class="survey-category-btn ${wasteAnswered ? 'answered' : ''}" data-category="waste">
            <div class="survey-category-header">
              <strong>Food Waste and Loss</strong>
              ${wasteAnswered ? '<span class="material-icons survey-check">check_circle</span>' : ''}
            </div>
            <span>Set your waste reduction goals</span>
          </button>
          <button type="button" class="survey-category-btn ${altproteinsAnswered ? 'answered' : ''}" data-category="altproteins">
            <div class="survey-category-header">
              <strong>Alternative Proteins</strong>
              ${altproteinsAnswered ? '<span class="material-icons survey-check">check_circle</span>' : ''}
            </div>
            <span>Select alternative protein adoption</span>
          </button>
        </div>
        
        <div class="survey-buttons" style="margin-top: 30px;">
          <button type="button" class="survey-cancel-btn">Cancel</button>
          ${anyAnswered ? submitButtons : ''}
        </div>
      `);
      
      surveyContent.find('.survey-cancel-btn').on('click', closePopup);
      surveyContent.find('.survey-category-btn').on('click', function() {
        const category = $(this).data('category');
        renderPage('question', category);
      });
      
      // Handle scenario load from intro page
      const handleScenarioLoadFromIntro = (modelNumber) => {
        try {
          console.log('Survey responses:', surveyResponses);
          
          // Generate scenario based on responses (using defaults for unanswered)
          const responses = {
            diet: surveyResponses.diet !== null ? surveyResponses.diet : 0,
            waste: surveyResponses.waste !== null ? surveyResponses.waste : 0,
            altproteins: surveyResponses.altproteins !== null ? surveyResponses.altproteins : 0
          };
          
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
          
          // Apply the scenario immediately
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
      
      // Handle single scenario mode
      surveyContent.find('.survey-submit-btn:not([data-model])').on('click', () => {
        handleScenarioLoadFromIntro(1);
      });
      
      // Handle multi scenario mode
      surveyContent.find('.survey-submit-btn[data-model]').on('click', function() {
        const modelNumber = parseInt($(this).data('model'));
        handleScenarioLoadFromIntro(modelNumber);
      });
      
    } else if (pageType === 'question') {
      // Question page for specific category
      let questionHTML = '';
      let questionTitle = '';
      let questionName = '';
      
      if (category === 'diet') {
        questionTitle = 'Diet Change';
        questionName = 'diet';
        questionHTML = `
          <div class="survey-question">
            <label><strong>What dietary pattern would you prefer?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="diet" value="0" ${surveyResponses.diet === 0 ? 'checked' : ''}> Reference (Current diet)</label>
              <label><input type="radio" name="diet" value="1" ${surveyResponses.diet === 1 ? 'checked' : ''}> Healthy</label>
              <label><input type="radio" name="diet" value="2" ${surveyResponses.diet === 2 ? 'checked' : ''}> Mediterranean</label>
              <label><input type="radio" name="diet" value="3" ${surveyResponses.diet === 3 ? 'checked' : ''}> Flexitarian</label>
            </div>
          </div>
        `;
      } else if (category === 'waste') {
        questionTitle = 'Food Waste and Loss';
        questionName = 'waste';
        questionHTML = `
          <div class="survey-question">
            <label><strong>How much would you reduce food waste and loss?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="waste" value="0" ${surveyResponses.waste === 0 ? 'checked' : ''}> Reference (No reduction)</label>
              <label><input type="radio" name="waste" value="25" ${surveyResponses.waste === 25 ? 'checked' : ''}> -25%</label>
              <label><input type="radio" name="waste" value="50" ${surveyResponses.waste === 50 ? 'checked' : ''}> -50%</label>
              <label><input type="radio" name="waste" value="75" ${surveyResponses.waste === 75 ? 'checked' : ''}> -75%</label>
            </div>
          </div>
        `;
      } else if (category === 'altproteins') {
        questionTitle = 'Alternative Proteins';
        questionName = 'altproteins';
        questionHTML = `
          <div class="survey-question">
            <label><strong>What percentage of alternative proteins would you adopt?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="altproteins" value="0" ${surveyResponses.altproteins === 0 ? 'checked' : ''}> Reference (No alternative proteins)</label>
              <label><input type="radio" name="altproteins" value="33" ${surveyResponses.altproteins === 33 ? 'checked' : ''}> 10%</label>
              <label><input type="radio" name="altproteins" value="66" ${surveyResponses.altproteins === 66 ? 'checked' : ''}> 20%</label>
              <label><input type="radio" name="altproteins" value="100" ${surveyResponses.altproteins === 100 ? 'checked' : ''}> 30%</label>
            </div>
          </div>
        `;
      }
      
      surveyContent.html(`
        <h2>${questionTitle}</h2>
        <p style="color: #666; margin-bottom: 20px;">Select your preference for this category.</p>
        
        <form id="survey-question-form">
          ${questionHTML}
          
          <div class="survey-buttons">
            <button type="button" class="survey-back-btn">← Back</button>
            <button type="submit" class="survey-next-btn">Next →</button>
          </div>
        </form>
      `);
      
      surveyContent.find('.survey-back-btn').on('click', () => renderPage('intro'));
      
      surveyContent.find('#survey-question-form').on('submit', function(e) {
        e.preventDefault();
        
        // Save the response
        const selectedValue = parseInt($(`input[name="${questionName}"]:checked`).val());
        if (isNaN(selectedValue)) {
          alert('Please select an option');
          return;
        }
        
        surveyResponses[questionName] = selectedValue;
        
        // Return to intro page after answering
        renderPage('intro');
      });
      
    } else if (pageType === 'summary') {
      // Summary page with submit options
      const submitButtons = isMultiMode 
        ? `
          <button type="button" class="survey-submit-btn" data-model="1">Load to Scenario 1</button>
          <button type="button" class="survey-submit-btn" data-model="2">Load to Scenario 2</button>
        `
        : `<button type="button" class="survey-submit-btn">Generate & Load Scenario</button>`;
      
      const dietLabels = ['Reference', 'Healthy', 'Mediterranean', 'Flexitarian'];
      const wasteLabels = ['Reference', '-25%', '-50%', '-75%'];
      const altproteinLabels = ['Reference', '10%', '20%', '30%'];
      
      const getDietLabel = (val) => {
        if (val === 0) return dietLabels[0];
        if (val === 1) return dietLabels[1];
        if (val === 2) return dietLabels[2];
        if (val === 3) return dietLabels[3];
        return 'Unknown';
      };
      
      const getWasteLabel = (val) => {
        if (val === 0) return wasteLabels[0];
        if (val === 25) return wasteLabels[1];
        if (val === 50) return wasteLabels[2];
        if (val === 75) return wasteLabels[3];
        return 'Unknown';
      };
      
      const getAltProteinLabel = (val) => {
        if (val === 0) return altproteinLabels[0];
        if (val === 33) return altproteinLabels[1];
        if (val === 66) return altproteinLabels[2];
        if (val === 100) return altproteinLabels[3];
        return 'Unknown';
      };
      
      surveyContent.html(`
        <h2>Review Your Scenario</h2>
        <p style="color: #666; margin-bottom: 20px;">Please review your selections${isMultiMode ? ' and choose which model to load the scenario into' : ''}.</p>
        
        <div class="survey-summary">
          <div class="survey-summary-item">
            <strong>Diet Change:</strong> ${getDietLabel(surveyResponses.diet)}
          </div>
          <div class="survey-summary-item">
            <strong>Food Waste and Loss:</strong> ${getWasteLabel(surveyResponses.waste)}
          </div>
          <div class="survey-summary-item">
            <strong>Alternative Proteins:</strong> ${getAltProteinLabel(surveyResponses.altproteins)}
          </div>
        </div>
        
        <div class="survey-buttons">
          <button type="button" class="survey-back-btn">← Back</button>
          ${submitButtons}
        </div>
      `);
      
      surveyContent.find('.survey-back-btn').on('click', () => renderPage('intro'));
      
      // Handle scenario load
      const handleScenarioLoad = (modelNumber) => {
        try {
          console.log('Survey responses:', surveyResponses);
          
          // Generate scenario based on responses
          console.log('Calling generateScenarioFromSurvey...');
          const scenarioData = generateScenarioFromSurvey(surveyResponses);
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
          
          // Apply the scenario immediately
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
      
      // Handle single scenario mode
      surveyContent.find('.survey-submit-btn:not([data-model])').on('click', () => {
        handleScenarioLoad(1);
      });
      
      // Handle multi scenario mode
      surveyContent.find('.survey-submit-btn[data-model]').on('click', function() {
        const modelNumber = parseInt($(this).data('model'));
        handleScenarioLoad(modelNumber);
      });
    }
  };
  
  // Start with intro page
  renderPage('intro');

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
