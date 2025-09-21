import $ from "jquery";
import { config as coreConfig } from "@core";
import { str, format, createInfoIcon } from "../lib/utils.js";
import { GraphView } from "../graph-view";
import { selectedGraphCount, layoutConfig } from "../stores/layout-store.js";
import { model, modelB } from "../stores/model-store.js";
import { graphViews } from "../stores/graphs-store.js";

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

    // Call the function to update the graphs
    initGraphsUI(selectedCategory, selectedGraphCount.get());
  }
);

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
  const $expandIcon = $(
    '<span class="material-icons expand-icon">expand_more</span>'
  );
  const selectedOption = $('<div class="selected-option"></div>').append(
    $expandIcon
  );
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
      const infoIcon = createInfoIcon(str(spec.descriptionKey));
      option.append(title, infoIcon);
      dropdownMenu.append(option);

      // Set the initially selected graph
      if (spec.id === currentGraphId) {
        const selectedTitle = title.clone();
        const selectedInfoIcon = createInfoIcon(str(spec.descriptionKey));
        selectedOption.append(selectedTitle, selectedInfoIcon);
      }
    });
  });

  // Handle option selection
  dropdownMenu.on("click", ".dropdown-option", function () {
    const graphId = $(this).data("value");
    const graphSpec = coreConfig.graphs.get(graphId);
    if (!graphSpec) return;

    // Update selected option display
    const newTitle = $(
      `<span class="option-title">${str(graphSpec.titleKey)}</span>`
    );
    const newInfoIcon = createInfoIcon(str(graphSpec.descriptionKey));
    selectedOption.empty().append(newTitle, newInfoIcon);
    dropdownMenu.hide();

    // Trigger graph change callback
    if (onGraphChange) onGraphChange(graphId);
  });

  // Toggle dropdown visibility
  selectedOption.on("click", function (e) {
    e.stopPropagation();
    dropdownMenu.toggle();
  });

  // Close dropdown when clicking outside
  $(document).on("click", function (e) {
    // Only close if clicking outside the dropdown container
    if (
      !dropdownContainer.is(e.target) &&
      dropdownContainer.has(e.target).length === 0
    ) {
      dropdownMenu.hide();
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
      outerContainer.empty(); // Clear the current graph
      showGraph(newGraphSpec, outerContainer, category); // Render the new graph
    }
  });

  const titleContainer = $('<div class="title-container"></div>');
  titleContainer.append(selector);
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
  // ...until here

  // Show the legend items for the graph
  // Each canvas' parent container should have only the canvas as child.
  // https://github.com/chartjs/Chart.js/issues/5805

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
  const graphsContainer = $("#graphs-container")
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
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
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
    const outer = $(`<div class="outer-graph-container"></div>`);

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
