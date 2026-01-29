/**
 * Tutorial.js
 * Interactive tutorial system that highlights and explains interface elements
 */

import $ from "jquery";
import { initGraphsUI, getDefaultGraphCountForCategory } from "./GraphsUI.js";
import { initInputsUI } from "./InputsUI.js";
import { resetActiveModelInputs } from "./navigation/ResetButtons.js";
import { selectedGraphCount } from "../stores/layout-store.js";

const tutorialSteps = [
  {
    target: "#inputs-section",
    title: "Start Here: Your Food Choices",
    description: "Each button represents common behaviours. Choose one that best matches you!",
    position: "right"
  },
  {
    target: "button[title='Build Your First Scenario!']",
    title: "Optional: Quick Survey (1/2)",
    description: "Not sure where to start? Click this lightbulb to take a quick survey. We'll set everything up for you automatically.",
    position: "bottom",
    waitForSurvey: true
  },
  {
    target: ".survey-container",
    title: "Optional: Quick Survey (2/2)",
    description: "Answer a few questions about your food habits. Don't worry - there are no wrong answers!",
    position: "right"
  },
  {
    target: "#graphs-section",
    title: "View your Impact",
    description: "See what happens if everyone followed you - your actions have a wide range of impacts! Each graph shows a sustainability domain (e.g. climate, land, water), which compares <span style='background-color: #000000; color: #ffffff; padding: 2px 6px; border-radius: 3px;'>your scenario</span> to the <span style='background-color: #d3d3d3; color: #000000; padding: 2px 6px; border-radius: 3px;'>business-as-usual</span>.",
    position: "left",
    useHTML: true
  },
  {
    targets: ["#graphs-section", ".outer-graph-container"],
    title: "Want to Learn More?",
    description: "Click any graph to dive deeper into a sustainability domain and explore what is happening.",
    position: "left",
    highlightAll: true
  }
];

let currentStep = 0;
let $overlay = null;
let $tooltip = null;
let isActive = false;
let initialState = null;

export function startTutorial() {
  if (isActive) return;
  
  isActive = true;
  currentStep = 0;
  
  // Store initial complete state
  initialState = {
    graphCategory: $(".graph-category-selector-option.selected").data("value"),
    inputCategory: $(".input-category-selector-option.selected").data("value"),
    url: window.location.href
  };
  
  // Create overlay
  $overlay = $(`
    <div id="tutorial-overlay"></div>
  `);
  
  // Create tooltip
  $tooltip = $(`
    <div id="tutorial-tooltip">
      <div class="tutorial-content">
        <h3 class="tutorial-title"></h3>
        <p class="tutorial-description"></p>
      </div>
      <div class="tutorial-controls">
        <button class="tutorial-skip-btn">Skip Tutorial</button>
        <div class="tutorial-navigation">
          <span class="tutorial-step-indicator"></span>
          <button class="tutorial-prev-btn" style="display: none;">Previous</button>
          <button class="tutorial-next-btn">Next</button>
        </div>
      </div>
    </div>
  `);
  
  $("body").append($overlay).append($tooltip);
  
  // Event handlers
  $tooltip.find(".tutorial-next-btn").on("click", nextStep);
  $tooltip.find(".tutorial-prev-btn").on("click", prevStep);
  $tooltip.find(".tutorial-skip-btn").on("click", endTutorial);
  
  showStep(currentStep);
}

function showStep(stepIndex, direction = 'forward') {
  const step = tutorialSteps[stepIndex];
  
  // Support both single target and multiple targets
  const targets = step.targets || [step.target];
  const $target = $(targets[0]).first();
  
  // Check if target exists
  if ($target.length === 0) {
    // If this is the survey step and popup isn't open, skip it when going backward
    if (stepIndex === 2 && direction === 'backward') {
      currentStep--;
      setTimeout(() => showStep(currentStep, direction), 100);
      return;
    }
    // Try again or end
    if (stepIndex < tutorialSteps.length - 1) {
      currentStep++;
      setTimeout(() => showStep(currentStep), 100);
      return;
    } else {
      endTutorial();
      return;
    }
  }
  
  // Calculate display step number
  const displayStepNumber = stepIndex + 1;
  const totalDisplaySteps = tutorialSteps.length;
  
  // Update tooltip content
  $tooltip.find(".tutorial-title").text(step.title);
  
  // Use html() if step has HTML content, otherwise use text()
  if (step.useHTML) {
    $tooltip.find(".tutorial-description").html(step.description);
  } else {
    $tooltip.find(".tutorial-description").text(step.description);
  }
  
  $tooltip.find(".tutorial-step-indicator").text(`${displayStepNumber} / ${totalDisplaySteps}`);
  
  // Show/hide navigation buttons
  if (stepIndex === 0) {
    $tooltip.find(".tutorial-prev-btn").hide();
  } else {
    $tooltip.find(".tutorial-prev-btn").show();
  }
  
  if (stepIndex === tutorialSteps.length - 1) {
    $tooltip.find(".tutorial-next-btn").text("Finish");
  } else {
    $tooltip.find(".tutorial-next-btn").text("Next");
  }
  
  // Highlight target element(s)
  if (step.highlightAll && step.targets) {
    // Highlight all targets separately
    const $allTargets = $(targets.join(", "));
    highlightElement($allTargets, true);
  } else if (step.highlightAll) {
    highlightElement($(step.target), true);
  } else {
    highlightElement($target, false);
  }
  
  // Position tooltip (always use first element for positioning)
  positionTooltip($target, step.position);
  
  // If this step waits for survey, watch for it to appear
  if (step.waitForSurvey) {
    watchForSurvey();
  }
}

function watchForSurvey() {
  const checkInterval = setInterval(() => {
    if (!isActive || currentStep !== 1) {
      clearInterval(checkInterval);
      return;
    }
    
    const $survey = $(".survey-container");
    if ($survey.length > 0 && $survey.is(":visible")) {
      clearInterval(checkInterval);
      currentStep++;
      setTimeout(() => showStep(currentStep), 100);
    }
  }, 50);
}

function highlightElement($element, useColors = false) {
  // Remove previous highlights and reset colors
  $(".tutorial-highlight").each(function() {
    $(this).removeClass("tutorial-highlight");
    this.style.removeProperty("--highlight-color");
  });
  
  // Reset any popup z-index overrides
  $(".survey-popup, .popup-overlay").css("z-index", "");
  
  // Hardcoded colors for the 6 graphs (only used when useColors is true)
  const graphColors = [
    "#996633",  // Graph 1 - Land Use
    "#ED7014",  // Graph 2 - Climate
    "#FFD700",  // Graph 3 - Fertilizer
    "#228B22",  // Graph 4 - Biodiversity
    "#00BFFF",  // Graph 5 - Water
    "#FF6347"   // Graph 6 - Nutrition
  ];
  
  // Add highlight to all matched elements
  $element.each(function(index) {
    const $el = $(this);
    $el.addClass("tutorial-highlight");
    
    // Apply color based on index only if useColors is true
    if (useColors && index < graphColors.length) {
      this.style.setProperty("--highlight-color", graphColors[index]);
    }
  });
  
  // If highlighting survey container, elevate the popup and overlay above tutorial overlay
  if ($element.hasClass("survey-container")) {
    $(".survey-popup").css("z-index", "100000");
    $(".popup-overlay").css("z-index", "99999");
  }
  
  // Scroll to first element
  $element[0].scrollIntoView({ behavior: "smooth", block: "center" });
}

function positionTooltip($target, position) {
  const targetRect = $target[0].getBoundingClientRect();
  const tooltipWidth = 400;
  const tooltipHeight = $tooltip.outerHeight();
  const padding = 20;
  
  let top, left;
  
  switch (position) {
    case "right":
      left = targetRect.right + padding;
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      break;
    case "left":
      left = targetRect.left - tooltipWidth - padding;
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      break;
    case "top":
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      top = targetRect.top - tooltipHeight - padding;
      break;
    case "bottom":
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      top = targetRect.bottom + padding;
      break;
    default:
      left = targetRect.right + padding;
      top = targetRect.top;
  }
  
  // Keep tooltip within viewport
  const maxLeft = window.innerWidth - tooltipWidth - 20;
  const maxTop = window.innerHeight - tooltipHeight - 20;
  
  left = Math.max(20, Math.min(left, maxLeft));
  top = Math.max(20, Math.min(top, maxTop));
  
  $tooltip.css({ left: `${left}px`, top: `${top}px` });
}

function nextStep() {
  // Clear highlights before moving to next step
  $(".tutorial-highlight").each(function() {
    $(this).removeClass("tutorial-highlight");
    this.style.removeProperty("--highlight-color");
  });
  
  // Check if graph state has changed and reset if needed
  if (hasGraphStateChanged()) {
    resetGraphsToDefault();
    // Wait for reset to complete before proceeding
    setTimeout(() => proceedToNextStep(), 100);
  } else {
    proceedToNextStep();
  }
}

function proceedToNextStep() {
  // Close any open popups except when moving from step 1 to step 2 (survey step)
  if (!(currentStep === 1 && currentStep + 1 === 2)) {
    $(".popup-overlay, .popup").remove();
  }
  
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    showStep(currentStep);
  } else {
    endTutorial();
  }
}

function prevStep() {
  // Clear highlights before moving to previous step
  $(".tutorial-highlight").each(function() {
    $(this).removeClass("tutorial-highlight");
    this.style.removeProperty("--highlight-color");
  });
  
  // Check if graph state has changed and reset if needed
  if (hasGraphStateChanged()) {
    resetGraphsToDefault();
    // Wait for reset to complete before proceeding
    setTimeout(() => proceedToPrevStep(), 100);
  } else {
    proceedToPrevStep();
  }
}

function proceedToPrevStep() {
  // Close any open popups
  $(".popup-overlay, .popup").remove();
  
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep, 'backward');
  }
}

function hasStateChanged() {
  if (!initialState) return false;
  
  const currentGraphCategory = $(".graph-category-selector-option.selected").data("value");
  const currentInputCategory = $(".input-category-selector-option.selected").data("value");
  const currentUrl = window.location.href;
  
  // Only check for graph/input category changes and URL changes
  // Don't reset if inputs are modified (user is actively using the tool)
  return currentGraphCategory !== initialState.graphCategory || 
         currentInputCategory !== initialState.inputCategory ||
         currentUrl !== initialState.url;
}

function hasGraphStateChanged() {
  if (!initialState) return false;
  
  const currentGraphCategory = $(".graph-category-selector-option.selected").data("value");
  
  // Only check for graph category changes (layout changes)
  return currentGraphCategory !== initialState.graphCategory;
}

function resetGraphsToDefault() {
  // Reset to first graph category
  const $firstGraphCategory = $(".graph-category-selector-option").first();
  const defaultGraphCategory = $firstGraphCategory.data("value");
  
  if (defaultGraphCategory) {
    // Reset graph category selection
    $(".graph-category-selector-option").removeClass("selected");
    $firstGraphCategory.addClass("selected");
    
    // Get default graph count for this category
    const defaultGraphCount = getDefaultGraphCountForCategory(defaultGraphCategory);
    selectedGraphCount.set(defaultGraphCount);
    
    // Reinitialize graphs with default settings
    setTimeout(() => {
      initGraphsUI(defaultGraphCategory, defaultGraphCount);
    }, 50);
    
    // Update initial state
    initialState.graphCategory = defaultGraphCategory;
  }
}

function resetToDefaultView() {
  // Reset all inputs to default values
  resetActiveModelInputs();
  
  // Reset to first input category
  const $firstInputCategory = $(".input-category-selector-option").first();
  const defaultInputCategory = $firstInputCategory.data("value");
  if (defaultInputCategory) {
    $(".input-category-selector-option").removeClass("selected");
    $firstInputCategory.addClass("selected");
    initInputsUI(defaultInputCategory);
  }
  
  // Reset to first graph category
  const $firstGraphCategory = $(".graph-category-selector-option").first();
  const defaultGraphCategory = $firstGraphCategory.data("value");
  
  if (defaultGraphCategory) {
    // Reset graph category selection
    $(".graph-category-selector-option").removeClass("selected");
    $firstGraphCategory.addClass("selected");
    
    // Get default graph count for this category
    const defaultGraphCount = getDefaultGraphCountForCategory(defaultGraphCategory);
    selectedGraphCount.set(defaultGraphCount);
    
    // Reinitialize graphs with default settings
    setTimeout(() => {
      initGraphsUI(defaultGraphCategory, defaultGraphCount);
    }, 50);
  }
}

function endTutorial() {
  isActive = false;
  initialState = null;
  
  $(".tutorial-highlight").removeClass("tutorial-highlight");
  
  if ($overlay) {
    $overlay.fadeOut(200, () => $overlay.remove());
  }
  
  if ($tooltip) {
    $tooltip.fadeOut(200, () => $tooltip.remove());
  }
}
