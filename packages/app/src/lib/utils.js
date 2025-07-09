import $ from "jquery";

import { marked } from "marked";
import katexExtension from "marked-katex-extension";
import enStrings from "@core-strings/en";

// Import markdown files (as raw files)
export const markdownModules = import.meta.glob("../markdowns/*.md", {
  query: "?raw",
  import: "default",
});

// Import markdown diagrams as URLs (not raw)
export const imageModules = import.meta.glob("../markdowns/diagrams/*", {
  eager: true,
  import: "default",
});

/*
 * Here, we tell marked to use KaTeX in order to
 * render latex equations in markdown files correctly.
 */
marked.use(katexExtension());

/**
 * Return the base (English) string for the given key.
 */
export function str(key) {
  return enStrings[key];
}

/**
 * Return a formatted string representation of the given number.
 */
export function format(num, formatString) {
  switch (formatString) {
    case ".1f":
      return num.toFixed(1);
    case ".2f":
      return num.toFixed(2);
    default:
      return num.toString();
  }
}

/* Function to load markdown file dynamically by name */
export async function loadMarkdownByName(name) {
  const filePath = `../markdowns/${name}.md`;
  const loader = markdownModules[filePath];
  if (!loader) {
    console.warn(`Markdown file "${name}.md" not found.`);
    return null;
  }
  return await loader(); // Loads and returns the content as string
}

/*
 * This function processes the markdown content and
 * replaces all the relative image paths with the final Vite asset URLs.
 */
export function resolveLocalImages(mdContent) {
  // Replace src="diagrams/..." with resolved Vite asset paths
  return mdContent.replace(/src="diagrams\/([^"]+)"/g, (match, filename) => {
    const relativePath = `./markdowns/diagrams/${filename}`;
    const imageUrl = imageModules[relativePath];
    if (!imageUrl) {
      console.warn(`Image "${filename}" not found in diagrams folder.`);
      return match;
    }
    return `src="${imageUrl}"`;
  });
}

/*
 * Function for the creation of Info Icon
 */

export function createInfoIcon(hoverText) {
  if (!hoverText) return null;

  const infoIconContainer = $('<div class="info-icon-container">');
  const icon = $('<div class="info-icon">i</div>');

  // Parse Markdown to HTML
  const parsedHTML = marked.parse(hoverText);
  const tooltip = $(`<div class="tooltip">${parsedHTML}</div>`);

  infoIconContainer.append(icon, tooltip);

  icon.on("mouseenter", function () {
    positionTooltip(tooltip);
    tooltip.css("visibility", "visible");
  });

  icon.on("mouseleave", function () {
    tooltip.css("visibility", "hidden");
  });

  return infoIconContainer;
}

/*
 * Function to position tooltip correctly
 */

export function positionTooltip(tooltip) {
  const icon = tooltip.siblings(".info-icon");
  const iconRect = icon[0].getBoundingClientRect();
  const tooltipElem = tooltip[0];

  // Get tooltip dimensions
  const tooltipWidth = tooltipElem.offsetWidth;
  const tooltipHeight = tooltipElem.offsetHeight;

  // Default position: below the icon, centered
  let top = iconRect.bottom + 5;
  let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2;

  // Adjust for right edge
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 5;
  }

  // Adjust for left edge
  if (left < 0) {
    left = 5;
  }

  // Adjust for bottom edge
  if (top + tooltipHeight > window.innerHeight) {
    top = iconRect.top - tooltipHeight - 5;
  }

  // Apply corrected position
  tooltip.css({
    top: `${top}px`,
    left: `${left}px`,
  });
}

/*
 * Function to add Popup Box w/ extensive Markdown Description
 * and position, which can be "left", "middle" (default), "right".
 * When position = "left", no popup-overlay is added.
 */
export function createPopupBox(extensiveText, position = "middle") {
  if (!extensiveText) return null;

  // Remove any existing popup or overlay
  $(".popup-overlay, .popup").remove();

  // Parse Markdown to HTML
  const parsedHTML = marked.parse(extensiveText);

  // Create popup box, with "position" class added dynamically
  const popup = $(`<div class="popup popup-${position}">`).html(parsedHTML);

  // Add close button with Material Icon
  const closeBtn = $(`
    <button class="popup-close">
      <span class="material-icons">close</span>
    </button>
  `);
  // Always remove the popup itself when X is clicked
  closeBtn.on("click", () => popup.remove());
  popup.prepend(closeBtn);

  // If "left", skip overlay entirely
  // TODO: perhaps add position === "right" here
  if (position === "left") {
    // Append the popup directly, no overlay, so clicks pass through
    $("body").append(popup);
    return popup;
  }

  // otherwise (middle/right popups) stay the same.

  // Create overlay
  const overlay = $('<div class="popup-overlay">');

  // Remove the overlay when clicking the X button
  closeBtn.on("click", () => overlay.remove());

  // Close on clicking outside the popup
  overlay.on("click", (e) => {
    if (e.target === overlay[0]) {
      overlay.remove();
    }
  });

  // Assemble and show popup
  overlay.append(popup);
  $("body").append(overlay);

  return overlay;
}

/*
 * Function to add Scenario Info Icon
 */

export function addScenarioInfoIcon() {
  // Create the info icon with tooltip text
  const scenarioInfo = createInfoIcon(
    "Switch between Scenario 1 and Scenario 2 inputs."
  );

  // Append the info icon to the scenario info container
  $("#scenario-info-container").append(scenarioInfo);

  // Get references to the icon and tooltip
  const scenarioIcon = $("#scenario-info-container .info-icon");
  const scenarioTooltip = $("#scenario-info-container .tooltip");

  // Add hover event listeners for tooltip positioning
  scenarioIcon
    .on("mouseenter", function () {
      positionTooltip(scenarioTooltip);
      scenarioTooltip.css("visibility", "visible");
    })
    .on("mouseleave", function () {
      scenarioTooltip.css("visibility", "hidden");
    });
}
