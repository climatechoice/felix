/**
 * GraphsUI.js
 * Manages graph rendering, selection, and layout
 * 
 * HIDDEN GRAPHS FEATURE:
 * Graphs can be completely hidden from the UI by setting the "maingraph" column 
 * to "HIDDEN" in graphs.csv. Hidden graphs will:
 * - Not appear in graph category buttons
 * - Not appear in graph selector dropdowns
 * - Not be included in the default graph list for any category
 * - Not count toward category visibility checks
 */

import $ from "jquery";
import { config as coreConfig } from "@core";
import { str, format, createInfoIcon } from "../lib/utils.js";
import { GraphView } from "./graphs/graph-view";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store.js";
import { model, modelB } from "../stores/model-store.js";
import { graphViews } from "../stores/graphs-store.js";
import { categoryLayouts } from "../stores/category-layout-store.js";
import { targetsVisible } from "../stores/targets-store.js";

// jquery Click event for Selecting Graph Category (Food, Climate, LandUse, Fertilizer)
$("#graph-category-selector-container").on(
  "click",
  ".graph-category-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".graph-category-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Check if this category has a saved layout preference
    const layouts = categoryLayouts.get();
    let graphCount;
    
    if (layouts[selectedCategory] !== undefined) {
      // Use the saved layout for this category
      graphCount = layouts[selectedCategory];
    } else {
      // Use the default graph count for this category
      graphCount = getDefaultGraphCountForCategory(selectedCategory);
    }
    
    // Update the selected graph count and call the function to update the graphs
    selectedGraphCount.set(graphCount);
    
    // Update the navbar layout selector to match this category's layout
    $("#layout-select").val(graphCount);
    
    initGraphsUI(selectedCategory, graphCount);
  }
);

/*
 * Get the default number of graphs for a given category.
 * This reads from the graphType field in the graph spec.
 * Falls back to 4 if not specified.
 */
export function getDefaultGraphCountForCategory(category) {
  // Find any graph in this category and get its graphType (repurposed for default count)
  // Exclude HIDDEN graphs
  const graphInCategory = Array.from(coreConfig.graphs.values()).find(
    (spec) => spec.graphCategory === category && spec.maingraph !== "HIDDEN"
  );
  
  if (graphInCategory && graphInCategory.graphType) {
    const count = parseInt(graphInCategory.graphType, 10);
    // Ensure it's a valid layout option (1, 2, 4, 6, or 9)
    if (layoutConfig[count]) {
      return count;
    }
  }
  
  // Default to 4 graphs if not specified or invalid
  return 4;
}

function createGraphViewModel(graphSpec, modelToUse) {
  /*
   * Here, I use the "isCombined" variable to know whether to return only the modelToUse's
   * series data for the varId, or BOTH models' series data.
   */
  const isCombined = graphSpec.scenarioDisplay === "combined";
  return {
    spec: graphSpec,
    model: modelToUse,
    style: "normal",
    getLineWidth: () => window.innerWidth * (0.5 / 100),
    getScaleLabelFontSize: () => window.innerWidth * (1.2 / 100),
    getAxisLabelFontSize: () => window.innerWidth * (1.0 / 100),
    getSeriesForVar: (varId, sourceName) => {
      if (isCombined) {
        // both models' series data are used here
        const seriesA = model.get().getSeriesForVar(varId, sourceName);
        const seriesB = modelB.get().getSeriesForVar(varId, sourceName);
        const mergedSeries = {
          ...seriesA,
          points: [...seriesA.points, ...seriesB.points], // concatenate points
        };
        // console.log(mergedSeries);
        return mergedSeries;
      } else {
        // only one modelToUse is used here.
        return modelToUse.getSeriesForVar(varId, sourceName);
      }
    },
    getStringForKey: (key) => {
      return str(key);
    },
    formatYAxisTickValue: (value) => {
      return format(value, graphSpec.yFormat);
    },
  };
}

/**
 * Create a dropdown selector for switching graphs.
 */
function createGraphSelector(category, currentGraphId, onGraphChange) {
  // Get all graphs for the current category and group by classification
  /*
   * seenTitles is used, so that the second graph that has "scenario display" = "combined"
   * doesn't show up in the graph selector.
   */
  const seenTitles = new Set();
  const graphs = Array.from(coreConfig.graphs.values()).filter((spec) => {
    if (spec.graphCategory !== category) return false;
    if (spec.maingraph === "HIDDEN") return false; // Hide graphs with maingraph = "HIDDEN"
    const title = str(spec.titleKey);
    if (seenTitles.has(title)) return false;
    seenTitles.add(title);
    return true;
  });
  const groups = {};
  graphs.forEach((spec) => {
    const classification = spec.classification || "Uncategorized";
    if (!groups[classification]) groups[classification] = [];
    groups[classification].push(spec);
  });

  // Create custom dropdown container
  const dropdownContainer = $('<div class="custom-graph-selector"></div>');
  const selectedOption = $('<div class="selected-option"></div>');
  const dropdownMenu = $('<div class="dropdown-menu"></div>').hide();

  // Add classification groups to the dropdown
  Object.entries(groups).forEach(([classification, specs]) => {
    // Add classification header
    const header = $(
      `<div class="classification-header">${classification}</div>`
    );
    dropdownMenu.append(header);

    // Add each graph under the classification
    specs.forEach((spec) => {
      const option = $(
        `<div class="dropdown-option" data-value="${spec.id}"></div>`
      );
      const title = $(
        `<span class="option-title">${str(spec.titleKey)}</span>`
      );
  const infoIcon = createInfoIcon(str(spec.descriptionKey), { graph: true });
      option.append(title, infoIcon);
      dropdownMenu.append(option);

      // Set the initially selected graph
      if (spec.id === currentGraphId) {
        const $expandIcon = $(
          '<span class="material-icons expand-icon">expand_more</span>'
        );
        const selectedTitle = title.clone();
  const selectedInfoIcon = createInfoIcon(str(spec.descriptionKey), { graph: true });
        selectedOption.append($expandIcon, selectedTitle, selectedInfoIcon);
      }
    });
  });

  // Handle option selection
  dropdownMenu.on("click", ".dropdown-option", function (e) {
    e.stopPropagation(); // Prevent event from bubbling
    const graphId = $(this).data("value");
    const graphSpec = coreConfig.graphs.get(graphId);
    if (!graphSpec) return;

    // Update selected option display
    const $expandIcon = $(
      '<span class="material-icons expand-icon">expand_more</span>'
    );
    const newTitle = $(
      `<span class="option-title">${str(graphSpec.titleKey)}</span>`
    );
  const newInfoIcon = createInfoIcon(str(graphSpec.descriptionKey), { graph: true });
    selectedOption.empty().append($expandIcon, newTitle, newInfoIcon);
    dropdownMenu.hide();

    // Trigger graph change callback
    if (onGraphChange) onGraphChange(graphId);
  });

  // Toggle dropdown visibility
  selectedOption.on("click", function (e) {
    e.stopPropagation();
    const isVisible = dropdownMenu.is(":visible");
    
    // Close all other graph dropdowns first
    $(".custom-graph-selector .dropdown-menu").hide();
    
    // Toggle this dropdown
    if (!isVisible) {
      dropdownMenu.show();
    }
  });

  // Close dropdown when clicking outside - use event delegation to avoid multiple handlers
  // Only add this handler once per dropdown by using a unique namespace
  $(document).off("click.graphDropdown" + currentGraphId).on("click.graphDropdown" + currentGraphId, function (e) {
    // Only close if clicking outside the dropdown container
    if (
      !dropdownContainer.is(e.target) &&
      dropdownContainer.has(e.target).length === 0
    ) {
      dropdownMenu.hide();
      // Clean up the handler when dropdown is closed
      $(document).off("click.graphDropdown" + currentGraphId);
    }
  });

  // Assemble the dropdown
  dropdownContainer.append(selectedOption, dropdownMenu);
  return dropdownContainer;
}

function showGraph(graphSpec, outerContainer, category) {
  // Check if there's a previous GraphView in this container and remove it from graphViews
  const previousGraphView = outerContainer.data("graphView");
  if (previousGraphView) {
    const index = graphViews.get().indexOf(previousGraphView);
    if (index > -1) {
      graphViews.get().splice(index, 1);
    }
  }

  // First, create the viewModel
  /*
   * modelToUse should still be used in this way
   * for the cases that scenarioDisplay = "separate" (or undefined)
   */
  const modelToUse =
    graphSpec.levels === "Scenario2" ? modelB.get() : model.get();
  // ! now this either returns one "series" data, or "seriesA, seriesB" concatenated.
  const viewModel = createGraphViewModel(graphSpec, modelToUse);

  // Create the dropdown selector for switching graphs
  const selector = createGraphSelector(category, graphSpec.id, (newGraphId) => {
    const newGraphSpec = coreConfig.graphs.get(newGraphId);
    if (newGraphSpec) {
      // Clear the current graph and remove all styles and event handlers
      outerContainer.off(); // Remove all event handlers
      outerContainer.attr("style", ""); // Remove all inline styles
      outerContainer.empty(); // Clear the current graph
      showGraph(newGraphSpec, outerContainer, category); // Render the new graph
    }
  });

  const titleContainer = $('<div class="title-container"></div>');
  titleContainer.append(selector);
  
  // Parse scenarioDisplay for linked graph feature: "linked;CategoryName;#color"
  if (graphSpec.scenarioDisplay && graphSpec.scenarioDisplay.startsWith("linked;")) {
    const parts = graphSpec.scenarioDisplay.split(";");
    if (parts.length === 3) {
      const [_, targetCategory, highlightColor] = parts;
      
      // Add aesthetic highlight styling - default state matches mouseleave
      outerContainer.css({
        "background-color": `${highlightColor}12`,
        "border": `1px solid ${highlightColor}40`,
        "border-radius": "6px",
        "cursor": targetCategory.toLowerCase() === "empty" ? "default" : "pointer",
        "padding": "2px",
        "box-shadow": "none",
        "transform": "scale(0.95)" // Reduce size to 95%
      });
      
      // Add very subtle hover effect
      outerContainer.on("mouseenter", function() {
        $(this).css({
          "background-color": `${highlightColor}18`,
          "border": `1px solid ${highlightColor}80`,
          "box-shadow": `0 1px 4px ${highlightColor}50`
        });
      });
      
      outerContainer.on("mouseleave", function() {
        $(this).css({
          "background-color": `${highlightColor}12`,
          "border": `1px solid ${highlightColor}40`,
          "box-shadow": "none"
        });
      });
      
      // Add click handler to navigate to the target category (page/tab)
      // Skip navigation if targetCategory is "Empty"
      if (targetCategory.toLowerCase() !== "empty") {
        outerContainer.on("click", function(e) {
          // Don't trigger if clicking on the dropdown
          if ($(e.target).closest(".graph-dropdown-container").length > 0) {
            return;
          }
          
          // Simply trigger a click on the target category button
          // This reuses all the existing category selection logic
          $(`.graph-category-selector-option[data-value="${targetCategory}"]`).click();
        });
      }
    }
  }
  
  outerContainer.append(titleContainer);

  // Show the canvas/graph
  const canvas = $("<canvas></canvas>")[0];
  // innerContainer has the canvas, and only that.
  // outerContainer is the "outer-graph-container"
  const innerContainer = $('<div class="graph-container"></div>');
  outerContainer.append(innerContainer);
  innerContainer.append(canvas);

  const options = {
    fontFamily: "Helvetica, sans-serif",
    fontStyle: "bold",
    fontColor: "#231f20",
  };
  const tooltipsEnabled = true;
  const xAxisLabel = graphSpec.xAxisLabelKey
    ? str(graphSpec.xAxisLabelKey)
    : undefined;
  const yAxisLabel = graphSpec.yAxisLabelKey
    ? str(graphSpec.yAxisLabelKey)
    : undefined;

  // Creation of a new GraphView
  // Maybe use setTimeout here...
  const graphView = new GraphView(
    canvas,
    viewModel,
    options,
    tooltipsEnabled,
    xAxisLabel,
    yAxisLabel
  );

  outerContainer.data("graphView", graphView);
  graphViews.set([...graphViews.get(), graphView]);
  
  // Update target annotations if targets are currently visible
  if (targetsVisible.get()) {
    setTimeout(() => {
      graphView.updateTargetAnnotations();
    }, 100);
  }
  // ...until here

  // Show the legend items for the graph (except for radar charts which have custom labels)
  // Each canvas' parent container should have only the canvas as child.
  // https://github.com/chartjs/Chart.js/issues/5805

  if (graphSpec.kind !== 'radar') {
    const legendContainer = $('<div class="graph-legend"></div>');
    outerContainer.append(legendContainer);
    for (const itemSpec of graphSpec.legendItems) {
      const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
      const label = str(itemSpec.labelKey);
      const itemElem = $(`<div ${attrs}>${label}</div>`);
      legendContainer.append(itemElem);
    }
    // If "scenario display" is "combined",
    // also get the second graphSpec's legends.
    if (graphSpec.scenarioDisplay === "combined") {
      // search and find the second graphSpec whose title is the same
      const matchingSpec = findMatchingGraphSpec(graphSpec);

      // now loop over this matchingSpec and get its graph legends
      for (const itemSpec of matchingSpec.legendItems) {
        const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
        const label = str(itemSpec.labelKey);
        const itemElem = $(`<div ${attrs}>${label}</div>`);
        legendContainer.append(itemElem);
      }
    }
  }

  return graphView;
}

/*
 * Function to find the graphSpec with a matching title.
 * This is used in the case that "scenario display" = "combined"
 */
function findMatchingGraphSpec(graphSpec) {
  const title = str(graphSpec.titleKey);
  // Search in coreConfig.graphs for a different spec with the same titleKey
  return Array.from(coreConfig.graphs.values()).find(
    (spec) => spec !== graphSpec && str(spec.titleKey) === title
  );
}

/*
 * Initialize the graphs according to selected category and selected layout.
 * Default layout is 4 graphs.
 */
export function initGraphsUI(category, amountOfGraphs = 4) {
  // First, clear previous graphs,
  // then remove any old graphs-N class from #graphs-container
  // and then add e.g. "graphs-1" or "graphs-4"
  const graphsContainer = $("#graphs-container");
  
  // Remove all event handlers from graph containers before clearing
  graphsContainer.find(".outer-graph-container").off();
  
  graphsContainer
    .empty()
    .removeClass((_, cls) => (cls.match(/graphs-\d+/g) || []).join(" "))
    .addClass(`graphs-${amountOfGraphs}`);

  graphViews.set([]); // Reset graphViews

  // Define the rows and columns from global layoutConfig
  // acording to the amountOfGraphs asked
  // ! Now, layoutConfig is from the STORE
  const { rows, cols } = layoutConfig[amountOfGraphs];

  // Dynamically build graph categories based on coreConfig.graphs
  // ! Build a flat list of the first N graph IDs in this category
  // ! Exclude graphs with maingraph = "HIDDEN"
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
    if (spec.maingraph === "HIDDEN") continue; // Skip hidden graphs
    const cat = spec.graphCategory;
    (dynamicGraphCategories[cat] ||= []).push(spec.id);
  }
  const catIds = dynamicGraphCategories[category] || [];

  // This is the total amount of graphIds that we will render
  const graphIds = catIds.slice(0, amountOfGraphs);

  // Create as many rows as needed (according to layoutConfig)
  const rowDivs = [];
  for (let r = 0; r < rows; r++) {
    const row = $(`<div class="graph-row"></div>`);
    rowDivs.push(row);
    graphsContainer.append(row);
  }

  // ! For each selected graph, figure out which row it goes in
  graphIds.forEach((id, index) => {
    const spec = coreConfig.graphs.get(id);
    const outer = $(`<div class="outer-graph-container" data-category="${spec.graphCategory}"></div>`);
    
    // Explicitly clear any potential inherited styles
    outer.css({
      "background-color": "",
      "border": "",
      "border-radius": "",
      "box-shadow": "",
      "cursor": ""
    });

    const rowIndex = Math.floor(index / cols);
    rowDivs[rowIndex].append(outer);

    // Add the graph rendering after a delay, so that it always has animations
    setTimeout(() => {
      const view = showGraph(spec, outer, category);
      graphViews.set([...graphViews.get(), view]);
    }, 50);
  });

  // Fallback if nothing to show
  if (graphIds.length === 0) {
    graphsContainer.text(
      `No graphs configured. You can edit 'config/graphs.csv' to get started.`
    );
  }
}
