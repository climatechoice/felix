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
        questionTitle = 'Diet Change - Quick Assessment';
        questionName = 'diet';
        
        // Store individual answers for diet assessment
        if (!surveyResponses.dietAnswers) {
          surveyResponses.dietAnswers = { q1: null, q2: null, q3: null };
        }
        
        questionHTML = `
          <div class="survey-question">
            <label><strong>Question 1: How often do you eat beef, lamb, or pork?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="diet_q1" value="daily" ${surveyResponses.dietAnswers.q1 === 'daily' ? 'checked' : ''}> Almost every day</label>
              <label><input type="radio" name="diet_q1" value="weekly" ${surveyResponses.dietAnswers.q1 === 'weekly' ? 'checked' : ''}> A few times a week</label>
              <label><input type="radio" name="diet_q1" value="occasional" ${surveyResponses.dietAnswers.q1 === 'occasional' ? 'checked' : ''}> Once or twice a week</label>
              <label><input type="radio" name="diet_q1" value="rarely" ${surveyResponses.dietAnswers.q1 === 'rarely' ? 'checked' : ''}> Rarely or never</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 2: How often do you eat fruits and vegetables?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="diet_q2" value="low" ${surveyResponses.dietAnswers.q2 === 'low' ? 'checked' : ''}> Not very often - maybe with one meal a day</label>
              <label><input type="radio" name="diet_q2" value="medium" ${surveyResponses.dietAnswers.q2 === 'medium' ? 'checked' : ''}> Regularly - with most meals</label>
              <label><input type="radio" name="diet_q2" value="high" ${surveyResponses.dietAnswers.q2 === 'high' ? 'checked' : ''}> Very often - with every meal</label>
              <label><input type="radio" name="diet_q2" value="very-high" ${surveyResponses.dietAnswers.q2 === 'very-high' ? 'checked' : ''}> A lot - fruits and vegetables are the main part of my meals</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 3: Where does most of your protein come from?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="diet_q3" value="meat-heavy" ${surveyResponses.dietAnswers.q3 === 'meat-heavy' ? 'checked' : ''}> Mainly meat (beef, pork, lamb)</label>
              <label><input type="radio" name="diet_q3" value="mixed" ${surveyResponses.dietAnswers.q3 === 'mixed' ? 'checked' : ''}> Mix of different things (meat, chicken, fish, beans)</label>
              <label><input type="radio" name="diet_q3" value="fish-poultry" ${surveyResponses.dietAnswers.q3 === 'fish-poultry' ? 'checked' : ''}> Mainly chicken and fish</label>
              <label><input type="radio" name="diet_q3" value="plant-based" ${surveyResponses.dietAnswers.q3 === 'plant-based' ? 'checked' : ''}> Mainly plants (beans, lentils, tofu, nuts)</label>
            </div>
          </div>
        `;
      } else if (category === 'waste') {
        questionTitle = 'Food Waste and Loss - Quick Assessment';
        questionName = 'waste';
        
        // Store individual answers for waste assessment
        if (!surveyResponses.wasteAnswers) {
          surveyResponses.wasteAnswers = { q1: null, q2: null, q3: null };
        }
        
        questionHTML = `
          <div class="survey-question">
            <label><strong>Question 1: How much food do you throw away?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="waste_q1" value="very-high" ${surveyResponses.wasteAnswers.q1 === 'very-high' ? 'checked' : ''}> A lot - I often throw out leftovers or spoiled food</label>
              <label><input type="radio" name="waste_q1" value="moderate" ${surveyResponses.wasteAnswers.q1 === 'moderate' ? 'checked' : ''}> Some - Once in a while I have to throw things out</label>
              <label><input type="radio" name="waste_q1" value="minimal" ${surveyResponses.wasteAnswers.q1 === 'minimal' ? 'checked' : ''}> Not much - I try to finish what I buy</label>
              <label><input type="radio" name="waste_q1" value="none" ${surveyResponses.wasteAnswers.q1 === 'none' ? 'checked' : ''}> Almost nothing - I'm careful not to waste food</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 2: Do you plan what you're going to eat before you shop?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="waste_q2" value="never" ${surveyResponses.wasteAnswers.q2 === 'never' ? 'checked' : ''}> No, I just buy what looks good</label>
              <label><input type="radio" name="waste_q2" value="sometimes" ${surveyResponses.wasteAnswers.q2 === 'sometimes' ? 'checked' : ''}> Sometimes</label>
              <label><input type="radio" name="waste_q2" value="often" ${surveyResponses.wasteAnswers.q2 === 'often' ? 'checked' : ''}> Usually, yes</label>
              <label><input type="radio" name="waste_q2" value="always" ${surveyResponses.wasteAnswers.q2 === 'always' ? 'checked' : ''}> Always - I plan meals ahead</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 3: What happens when food in your fridge is about to go bad?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="waste_q3" value="throw" ${surveyResponses.wasteAnswers.q3 === 'throw' ? 'checked' : ''}> I usually throw it away</label>
              <label><input type="radio" name="waste_q3" value="sometimes-save" ${surveyResponses.wasteAnswers.q3 === 'sometimes-save' ? 'checked' : ''}> Sometimes I use it, sometimes I don't</label>
              <label><input type="radio" name="waste_q3" value="creative" ${surveyResponses.wasteAnswers.q3 === 'creative' ? 'checked' : ''}> I cook it or freeze it before it goes bad</label>
              <label><input type="radio" name="waste_q3" value="proactive" ${surveyResponses.wasteAnswers.q3 === 'proactive' ? 'checked' : ''}> I keep track and use older items first</label>
            </div>
          </div>
        `;
      } else if (category === 'altproteins') {
        questionTitle = 'Alternative Proteins - Quick Assessment';
        questionName = 'altproteins';
        
        // Store individual answers for alternative proteins assessment
        if (!surveyResponses.altproteinsAnswers) {
          surveyResponses.altproteinsAnswers = { q1: null, q2: null, q3: null };
        }
        
        questionHTML = `
          <div class="survey-question">
            <label><strong>Question 1: Have you tried or would you eat plant-based meat (like Beyond Meat or Impossible)?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="altproteins_q1" value="no" ${surveyResponses.altproteinsAnswers.q1 === 'no' ? 'checked' : ''}> No, I prefer real meat</label>
              <label><input type="radio" name="altproteins_q1" value="curious" ${surveyResponses.altproteinsAnswers.q1 === 'curious' ? 'checked' : ''}> I'd try it if it tastes good</label>
              <label><input type="radio" name="altproteins_q1" value="occasional" ${surveyResponses.altproteinsAnswers.q1 === 'occasional' ? 'checked' : ''}> I eat it sometimes</label>
              <label><input type="radio" name="altproteins_q1" value="regular" ${surveyResponses.altproteinsAnswers.q1 === 'regular' ? 'checked' : ''}> I eat it often instead of meat</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 2: What do you think about lab-grown meat (real meat grown from cells)?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="altproteins_q2" value="against" ${surveyResponses.altproteinsAnswers.q2 === 'against' ? 'checked' : ''}> I don't like the idea</label>
              <label><input type="radio" name="altproteins_q2" value="skeptical" ${surveyResponses.altproteinsAnswers.q2 === 'skeptical' ? 'checked' : ''}> I'm not sure about it</label>
              <label><input type="radio" name="altproteins_q2" value="willing" ${surveyResponses.altproteinsAnswers.q2 === 'willing' ? 'checked' : ''}> I'd try it if it's safe and not too expensive</label>
              <label><input type="radio" name="altproteins_q2" value="eager" ${surveyResponses.altproteinsAnswers.q2 === 'eager' ? 'checked' : ''}> I'm interested - sounds good for the environment</label>
            </div>
          </div>
          
          <div class="survey-question">
            <label><strong>Question 3: Do you drink plant-based milk or eat plant-based cheese/yogurt?</strong></label>
            <div class="survey-options">
              <label><input type="radio" name="altproteins_q3" value="no" ${surveyResponses.altproteinsAnswers.q3 === 'no' ? 'checked' : ''}> No, I only use regular dairy</label>
              <label><input type="radio" name="altproteins_q3" value="some" ${surveyResponses.altproteinsAnswers.q3 === 'some' ? 'checked' : ''}> Sometimes I use plant-based milk</label>
              <label><input type="radio" name="altproteins_q3" value="half" ${surveyResponses.altproteinsAnswers.q3 === 'half' ? 'checked' : ''}> I use about half plant-based, half regular</label>
              <label><input type="radio" name="altproteins_q3" value="most" ${surveyResponses.altproteinsAnswers.q3 === 'most' ? 'checked' : ''}> I mostly or only use plant-based</label>
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
        
        // Handle diet question specially - calculate diet type from 3 questions
        if (questionName === 'diet') {
          const q1 = $('input[name="diet_q1"]:checked').val();
          const q2 = $('input[name="diet_q2"]:checked').val();
          const q3 = $('input[name="diet_q3"]:checked').val();
          
          if (!q1 || !q2 || !q3) {
            alert('Please answer all three questions');
            return;
          }
          
          // Save individual answers
          surveyResponses.dietAnswers = { q1, q2, q3 };
          
          // Calculate diet type based on answers
          // Reference (0): High meat consumption, low fruits/veg
          // Healthy (1): Moderate meat, good fruits/veg
          // Mediterranean (2): Less red meat, fish/poultry, high fruits/veg
          // Flexitarian (3): Rare meat, high plant-based
          
          let score = 0;
          
          // Q1: Red meat frequency (lower is better)
          if (q1 === 'rarely') score += 3;
          else if (q1 === 'occasional') score += 2;
          else if (q1 === 'weekly') score += 1;
          else score += 0; // daily
          
          // Q2: Fruits and vegetables (higher is better)
          if (q2 === 'very-high') score += 3;
          else if (q2 === 'high') score += 2;
          else if (q2 === 'medium') score += 1;
          else score += 0; // low
          
          // Q3: Protein sources (plant-based weighted higher)
          if (q3 === 'plant-based') score += 3;
          else if (q3 === 'fish-poultry') score += 2;
          else if (q3 === 'mixed') score += 1;
          else score += 0; // meat-heavy
          
          // Map score to diet type
          // 0-2: Reference, 3-4: Healthy, 5-6: Mediterranean, 7-9: Flexitarian
          let dietType;
          if (score <= 2) dietType = 0; // Reference
          else if (score <= 4) dietType = 1; // Healthy
          else if (score <= 6) dietType = 2; // Mediterranean
          else dietType = 3; // Flexitarian
          
          surveyResponses.diet = dietType;
          
          console.log('Diet assessment - Scores:', { q1, q2, q3, score, dietType });
          
          // Return to intro page
          renderPage('intro');
          return;
        }
        
        // Handle waste question - calculate waste reduction from 3 questions
        if (questionName === 'waste') {
          const q1 = $('input[name="waste_q1"]:checked').val();
          const q2 = $('input[name="waste_q2"]:checked').val();
          const q3 = $('input[name="waste_q3"]:checked').val();
          
          if (!q1 || !q2 || !q3) {
            alert('Please answer all three questions');
            return;
          }
          
          // Save individual answers
          surveyResponses.wasteAnswers = { q1, q2, q3 };
          
          // Calculate waste reduction level
          // 0: Reference (no reduction)
          // 25: -25% reduction
          // 50: -50% reduction
          // 75: -75% reduction (not used in original, using 50 as max)
          
          let score = 0;
          
          // Q1: Current waste level (less waste = higher score)
          if (q1 === 'none') score += 3;
          else if (q1 === 'minimal') score += 2;
          else if (q1 === 'moderate') score += 1;
          else score += 0; // very-high
          
          // Q2: Planning habits
          if (q2 === 'always') score += 3;
          else if (q2 === 'often') score += 2;
          else if (q2 === 'sometimes') score += 1;
          else score += 0; // never
          
          // Q3: Food management
          if (q3 === 'proactive') score += 3;
          else if (q3 === 'creative') score += 2;
          else if (q3 === 'sometimes-save') score += 1;
          else score += 0; // throw
          
          // Map score to waste reduction level
          // 0-2: 0 (Reference), 3-5: 25 (-25%), 6-9: 50 (-50%)
          let wasteLevel;
          if (score <= 2) wasteLevel = 0; // Reference
          else if (score <= 5) wasteLevel = 25; // -25%
          else wasteLevel = 50; // -50%
          
          surveyResponses.waste = wasteLevel;
          
          console.log('Waste assessment - Scores:', { q1, q2, q3, score, wasteLevel });
          
          // Return to intro page
          renderPage('intro');
          return;
        }
        
        // Handle alternative proteins question - calculate adoption from 3 questions
        if (questionName === 'altproteins') {
          const q1 = $('input[name="altproteins_q1"]:checked').val();
          const q2 = $('input[name="altproteins_q2"]:checked').val();
          const q3 = $('input[name="altproteins_q3"]:checked').val();
          
          if (!q1 || !q2 || !q3) {
            alert('Please answer all three questions');
            return;
          }
          
          // Save individual answers
          surveyResponses.altproteinsAnswers = { q1, q2, q3 };
          
          // Calculate alternative protein adoption level
          // 0: Reference (no adoption)
          // 33: 10% adoption
          // 66: 20% adoption
          // 100: 30% adoption
          
          let score = 0;
          
          // Q1: Plant-based meat willingness
          if (q1 === 'regular') score += 3;
          else if (q1 === 'occasional') score += 2;
          else if (q1 === 'curious') score += 1;
          else score += 0; // no
          
          // Q2: Lab-grown meat attitude
          if (q2 === 'eager') score += 3;
          else if (q2 === 'willing') score += 2;
          else if (q2 === 'skeptical') score += 1;
          else score += 0; // against
          
          // Q3: Dairy alternatives
          if (q3 === 'most') score += 3;
          else if (q3 === 'half') score += 2;
          else if (q3 === 'some') score += 1;
          else score += 0; // no
          
          // Map score to adoption level
          // 0-2: 0 (Reference), 3-4: 33 (10%), 5-6: 66 (20%), 7-9: 100 (30%)
          let adoptionLevel;
          if (score <= 2) adoptionLevel = 0; // Reference
          else if (score <= 4) adoptionLevel = 33; // 10%
          else if (score <= 6) adoptionLevel = 66; // 20%
          else adoptionLevel = 100; // 30%
          
          surveyResponses.altproteins = adoptionLevel;
          
          console.log('Alternative proteins assessment - Scores:', { q1, q2, q3, score, adoptionLevel });
          
          // Return to intro page
          renderPage('intro');
          return;
        }
        
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
