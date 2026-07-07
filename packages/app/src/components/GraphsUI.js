/**
 * GraphsUI.js
 * Manages graph rendering, selection, and layout
 * 
 * HIDDEN GRAPHS FEATURE:
 * Graphs can be completely hidden from the UI by setting the "scenario mode" column 
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

// Persists the user's graph dropdown selections per category.
// key: category string, value: array of graphIds ordered by panel position
const categoryGraphSelections = {};

// Hardcoded lesson color overrides for specific graph IDs (user-provided hexes)
const LESSON_COLOR_OVERRIDES = {
  x1: '#000000',
  x2: '#00BFFF',
  x3: '#996633',
  x4: '#FFD700',
  x5: '#228B22',
  x6: '#ED7014',
  x7: '#FF6347'
};

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
 * This reads from the graphLayout field in the graph spec.
 * Falls back to 4 if not specified.
 */
export function getDefaultGraphCountForCategory(category) {
  // Find any graph in this category and get its graphLayout (repurposed for default count)
  // Exclude HIDDEN graphs
  const graphInCategory = Array.from(coreConfig.graphs.values()).find(
    (spec) => spec.graphCategory === category && (spec.scenarioMode || "").toUpperCase() !== "HIDDEN"
  );
  
  if (graphInCategory && graphInCategory.graphLayout) {
    const count = parseInt(graphInCategory.graphLayout, 10);
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
  // Cache model references once — getSeriesForVar is called on every chart render tick
  const modelAInstance = model.get();
  const modelBInstance = modelB.get();
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
        const seriesA = modelAInstance.getSeriesForVar(varId, sourceName);
        const seriesB = modelBInstance.getSeriesForVar(varId, sourceName);
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

// Single module-level handler: closes all graph-selector dropdowns when the user
// clicks anywhere outside a .custom-graph-selector. Replaces the per-dropdown
// document handlers that were registered (and leaked) on every initGraphsUI call.
$(document).on("click.graphDropdownClose", function (e) {
  if (!$(e.target).closest(".custom-graph-selector").length) {
    $(".custom-graph-selector .dropdown-menu").hide();
  }
});

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
    if ((spec.scenarioMode || "").toUpperCase() === "HIDDEN") return false; // Hide graphs with scenarioMode = "HIDDEN"
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

  // Add classification groups to the dropdown using a DocumentFragment to
  // batch all DOM insertions into a single reflow.
  const fragment = document.createDocumentFragment();
  Object.entries(groups).forEach(([classification, specs]) => {
    fragment.appendChild(
      $(`<div class="classification-header">${classification}</div>`)[0]
    );

    specs.forEach((spec) => {
      const option = $(
        `<div class="dropdown-option" data-value="${spec.id}"></div>`
      );
      const title = $(
        `<span class="option-title">${str(spec.titleKey)}</span>`
      );
      const infoIcon = createInfoIcon(str(spec.descriptionKey), { graph: true });
      option.append(title, infoIcon);
      fragment.appendChild(option[0]);

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
  dropdownMenu[0].appendChild(fragment);

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

  // Dropdown close-on-outside-click is handled by the module-level
  // "click.graphDropdownClose" handler above — no per-dropdown document handler needed.

  // Assemble the dropdown
  dropdownContainer.append(selectedOption, dropdownMenu);
  return dropdownContainer;
}

function showGraph(graphSpec, outerContainer, category, skipRegistration = false) {
  // Check if there's a previous GraphView in this container and remove it from graphViews
  const previousGraphView = outerContainer.data("graphView");
  if (previousGraphView) {
    try {
      // destroy the previous view to clean up Chart.js resources and listeners
      if (typeof previousGraphView.destroy === 'function') previousGraphView.destroy();
    } catch (e) {
      // ignore
    }
    const index = graphViews.get().indexOf(previousGraphView);
    if (index > -1) {
      const arr = graphViews.get().slice();
      arr.splice(index, 1);
      graphViews.set(arr);
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
        "background-color": `${highlightColor}1A`,
        "border": `1px solid ${highlightColor}4A`,
        "border-radius": "6px",
        "cursor": targetCategory.toLowerCase() === "empty" ? "default" : "pointer",
        "padding": "2px",
        "box-shadow": "none",
        "transform": "scale(0.95)" // Reduce size to 95%
      });
      
      // Add very subtle hover effect
      outerContainer.on("mouseenter", function() {
        $(this).css({
          "background-color": `${highlightColor}24`,
          "border": `1px solid ${highlightColor}88`,
          "box-shadow": `0 1px 4px ${highlightColor}55`
        });
      });
      
      outerContainer.on("mouseleave", function() {
        $(this).css({
          "background-color": `${highlightColor}1A`,
          "border": `1px solid ${highlightColor}4A`,
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
  // Mark which graph id is rendered into this outer container
  try {
    outerContainer.attr('data-graph-id', graphSpec.id);
  } catch (e) {
    // ignore if DOM isn't ready
  }

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
  // If this outer container is inside the lesson tooltip, do NOT register
  // the resulting GraphView in the global graphViews array. Lesson graphs
  // are transient and will be destroyed by the lesson cleanup.
  let registerGlobally = !skipRegistration;
  try {
    if (registerGlobally && outerContainer.closest && outerContainer.closest('#lesson-tooltip').length) {
      registerGlobally = false;
    }
  } catch (e) {
    // ignore
  }
  if (registerGlobally) {
    graphViews.set([...graphViews.get(), graphView]);
  }

  // Update target annotations if targets are currently visible.
  // When called in batch mode from initGraphsUI (skipRegistration=true),
  // the caller handles a single batched annotation update instead.
  if (registerGlobally && targetsVisible.get()) {
    setTimeout(() => {
      graphView.updateTargetAnnotations();
    }, 100);
  }
  // ...until here

  // Show the legend items for the graph (except for radar charts which have custom labels)
  // Each canvas' parent container should have only the canvas as child.
  // https://github.com/chartjs/Chart.js/issues/5805

  if (graphSpec.kind !== 'radar' && graphSpec.kind !== 'square') {
    const legendContainer = $('<div class="graph-legend"></div>');
    outerContainer.append(legendContainer);
    // Build all legend HTML in one string and set it in one DOM call to avoid per-item reflows
    const buildLegendHTML = (items) =>
      items.map(itemSpec =>
        `<div class="graph-legend-item" style="background-color: ${itemSpec.color}">${str(itemSpec.labelKey)}</div>`
      ).join('');
    let legendHTML = buildLegendHTML(graphSpec.legendItems);
    if (graphSpec.scenarioDisplay === "combined") {
      const matchingSpec = findMatchingGraphSpec(graphSpec);
      legendHTML += buildLegendHTML(matchingSpec.legendItems);
    }
    legendContainer.html(legendHTML);
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
 * Clear the saved graph selections for a given category (or all categories).
 * Used by the reset button to restore default graph choices.
 */
export function clearCategoryGraphSelections(category) {
  if (category) {
    delete categoryGraphSelections[category];
  } else {
    Object.keys(categoryGraphSelections).forEach(k => delete categoryGraphSelections[k]);
  }
}

/*
 * Initialize the graphs according to selected category and selected layout.
 * Default layout is 4 graphs.
 */
export function initGraphsUI(category, amountOfGraphs = 4, resetToDefaults = false) {
  // First, clear previous graphs,
  // then remove any old graphs-N class from #graphs-container
  // and then add e.g. "graphs-1" or "graphs-4"
  const graphsContainer = $("#graphs-container");

  // Save the currently-rendered selections before clearing, keyed by their category.
  // Skip this when resetting to defaults so stale selections aren't re-saved.
  if (!resetToDefaults) {
    const existingContainers = graphsContainer.find(".outer-graph-container");
    if (existingContainers.length > 0) {
      const renderingCategory = existingContainers.first().attr("data-category");
      if (renderingCategory) {
        const currentSelections = [];
        existingContainers.each(function () {
          const graphId = $(this).attr("data-graph-id");
          if (graphId) currentSelections.push(graphId);
        });
        if (currentSelections.length > 0) {
          categoryGraphSelections[renderingCategory] = currentSelections;
        }
      }
    }
  } else {
    // When resetting, clear any saved selections for this category
    delete categoryGraphSelections[category];
  }

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
  // ! Exclude graphs with scenarioMode = "HIDDEN"
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
    if ((spec.scenarioMode || "").toUpperCase() === "HIDDEN") continue; // Skip hidden graphs
    const cat = spec.graphCategory;
    (dynamicGraphCategories[cat] ||= []).push(spec.id);
  }
  const catIds = dynamicGraphCategories[category] || [];

  // This is the total amount of graphIds that we will render.
  // Restore saved selections for this category where available (unless resetting).
  const savedSelections = resetToDefaults ? [] : (categoryGraphSelections[category] || []);
  const graphIds = catIds.slice(0, amountOfGraphs).map((defaultId, index) => {
    const savedId = savedSelections[index];
    if (savedId) {
      const savedSpec = coreConfig.graphs.get(savedId);
      if (
        savedSpec &&
        savedSpec.graphCategory === category &&
        (savedSpec.scenarioMode || "").toUpperCase() !== "HIDDEN"
      ) {
        return savedId;
      }
    }
    return defaultId;
  });

  // Create as many rows as needed (according to layoutConfig)
  const rowDivs = [];
  for (let r = 0; r < rows; r++) {
    const row = $(`<div class="graph-row"></div>`);
    rowDivs.push(row);
    graphsContainer.append(row);
  }

  // ! For each selected graph, figure out which row it goes in.
  // Build all containers synchronously (so the DOM is laid out), then render
  // all charts in a SINGLE setTimeout — one event-loop turn, one paint cycle,
  // and one graphViews store notification instead of N each.
  const pendingRenders = graphIds.map((id, index) => {
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
    return { spec, outer };
  });

  setTimeout(() => {
    const newViews = [];
    pendingRenders.forEach(({ spec, outer }) => {
      // skipRegistration=true: we do ONE store update below instead of N
      const view = showGraph(spec, outer, category, true);
      if (view) newViews.push(view);
    });
    // Single store notification for all new views
    graphViews.set([...graphViews.get(), ...newViews]);
    // Single batched annotation update if targets are visible
    if (targetsVisible.get()) {
      setTimeout(() => {
        newViews.forEach(v => v.updateTargetAnnotations());
      }, 100);
    }
  }, 50);

  // Fallback if nothing to show
  if (graphIds.length === 0) {
    graphsContainer.text(
      `No graphs configured. You can edit 'config/graphs.csv' to get started.`
    );
  }
}

/*
 * Listen for lesson requests to show a specific graph.
 * The lesson dispatches a CustomEvent 'lesson:showGraph' with
 * detail: { graphId: string, stepIndex: number }
 */
try {
  window.addEventListener('lesson:showGraph', function (ev) {
    try {
      const detail = ev && ev.detail;
      const graphId = detail && detail.graphId;
      if (!graphId) return;
      const spec = coreConfig.graphs.get(graphId);
      if (!spec) {
        console.warn('lesson:showGraph - unknown graphId', graphId);
        return;
      }

      // 1) If a container already has this graph, re-render into it
      let outer = $(`#graphs-container .outer-graph-container[data-graph-id="${graphId}"]`).first();
      if (outer && outer.length) {
        outer.off(); outer.attr('style', ''); outer.empty();
        showGraph(spec, outer, spec.graphCategory);
        return;
      }

      // 2) Otherwise try to find a container in the same category and render there
      outer = $(`#graphs-container .outer-graph-container[data-category="${spec.graphCategory}"]`).first();
      if (outer && outer.length) {
        outer.off(); outer.attr('style', ''); outer.empty();
        showGraph(spec, outer, spec.graphCategory);
        return;
      }

      // 3) Fallback: initialize the UI for that category so the graph will be visible
      const defaultCount = getDefaultGraphCountForCategory(spec.graphCategory);
      initGraphsUI(spec.graphCategory, defaultCount);
    } catch (e) {
      console.warn('Error handling lesson:showGraph', e);
    }
  });
} catch (e) {
  // ignore if window unavailable (e.g., server-side)
}

// Also listen for lesson:showGraphInLesson which includes a container to render into
try {
  window.addEventListener('lesson:showGraphInLesson', function (ev) {
    try {
      const detail = ev && ev.detail;
      const graphId = detail && detail.graphId;
      const container = detail && detail.container;
      if (!graphId) return;
      const spec = coreConfig.graphs.get(graphId);
      if (!spec) return;

      if (container) {
        const $outer = $(container);
        // Ensure the container looks like an outer-graph-container so CSS applies
        try { $outer.addClass('outer-graph-container'); } catch (e) {}
        $outer.off(); $outer.attr('style','height: 100%; width: 100%;'); $outer.empty();
        // ensure data attributes
        try { $outer.attr('data-graph-id', graphId); $outer.attr('data-category', spec.graphCategory); } catch (e) {}
        // Render the graph into the lesson container
        showGraph(spec, $outer, spec.graphCategory);
        // Ensure the title is visible inside the lesson (some dropdowns may hide text)
        try {
          const titleText = str(spec.titleKey) || '';
          const $titleContainer = $outer.find('.title-container');
          if ($titleContainer && $titleContainer.length) {
            // Determine primary color: prefer hardcoded overrides, then legend, then scenarioDisplay
            let primaryColor = LESSON_COLOR_OVERRIDES[spec.id] || null;
            if (!primaryColor) {
              if (spec.legendItems && spec.legendItems.length && spec.legendItems[0].color) {
                primaryColor = spec.legendItems[0].color;
              } else if (spec.scenarioDisplay && typeof spec.scenarioDisplay === 'string') {
                const parts = spec.scenarioDisplay.split(';');
                if (parts.length >= 3 && parts[2]) primaryColor = parts[2];
              }
            }

            const safeText = titleText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Render title as a boxed label; use CSS variable --accent-color for a small dot accent
            const accentStyle = primaryColor ? `--accent-color: ${primaryColor};` : '';
            $titleContainer.empty().append(`<div class="lesson-graph-title" style="display:inline-block;padding:6px 10px;border-radius:6px;margin:4px 0;font-weight:600;${accentStyle}">${safeText}</div>`);

            // Apply the primaryColor as a highlight (CSS variable) rather than changing font color
            try {
              if (primaryColor) {
                const $lesson = $outer.closest('#lesson-tooltip');
                if ($lesson && $lesson.length) {
                  const $mainTitle = $lesson.find('.lesson-title');
                  if ($mainTitle && $mainTitle.length) {
                    $mainTitle.css('--lesson-highlight', primaryColor);
                    $mainTitle.addClass('lesson-highlighted');
                  }
                }
              }
            } catch (e) {
              // ignore highlighting errors
            }
          }
          // Highlight the lesson's main title using the graph's primary color.
          // Prefer the first legend item color, fall back to parsing `scenarioDisplay`.
          // (color applied above along with the title box)
        } catch (e) {
          // ignore
        }
        return;
      }
    } catch (e) {
      console.warn('Error handling lesson:showGraphInLesson', e);
    }
  });
} catch (e) {
  // ignore
}

/**
 * Programmatic render API: render a graph inside a given DOM element (jQuery or DOM node)
 */
export function renderGraphInElement(el, graphId) {
  if (!el || !graphId) return null;
  const spec = coreConfig.graphs.get(graphId);
  if (!spec) return null;
  const $outer = $(el);
  $outer.off(); $outer.attr('style', ''); $outer.empty();
  try { $outer.attr('data-graph-id', graphId); $outer.attr('data-category', spec.graphCategory); } catch (e) {}
  return showGraph(spec, $outer, spec.graphCategory);
}
