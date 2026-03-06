import $ from "jquery";

import { marked } from "marked";
import katexExtension from "marked-katex-extension";
import enStrings from "@core-strings/en";
import { config as coreConfig } from "@core";
import { model, modelB } from "../stores/model-store.js";
import { GraphView } from "../components/graphs/graph-view";

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

// Targets data - loaded from CSV
let targetsData = null;

/**
 * Load and parse targets.csv file
 */
export async function loadTargets() {
  if (targetsData !== null) {
    return targetsData;
  }

  try {
    // Resolve a URL that works both in dev and when deployed to a sub-path.
    // Prefer a path relative to the current document (works with or without <base>),
    // but fall back to the site-root `/targets.csv` if needed.
    let targetsUrl = '/targets.csv';
    if (typeof document !== 'undefined' && document.baseURI) {
      try {
        targetsUrl = new URL('./targets.csv', document.baseURI).toString();
      } catch (e) {
        targetsUrl = '/targets.csv';
      }
    }

    let response;
    try {
      console.info(`Loading targets.csv from: ${targetsUrl}`);
      response = await fetch(targetsUrl);
      console.info(`targets.csv fetch returned: ${response.status} ${response.statusText} (url: ${response.url})`);
      if (!response.ok && targetsUrl !== '/targets.csv') {
        // try fallback to root
        console.info('Falling back to /targets.csv');
        response = await fetch('/targets.csv');
        console.info(`Fallback fetch returned: ${response.status} ${response.statusText} (url: ${response.url})`);
      }
    } catch (err) {
      // network error; try the root fallback
      console.warn('Initial fetch failed, trying /targets.csv fallback', err);
      try {
        response = await fetch('/targets.csv');
        console.info(`Fallback fetch returned: ${response.status} ${response.statusText} (url: ${response.url})`);
      } catch (err2) {
        console.error('Both attempts to fetch targets.csv failed', err2);
        throw err2;
      }
    }

    const csvText = await response.text();
    
    // Parse CSV with proper handling of quoted fields
    const lines = csvText.trim().split('\n');
    
    // Function to parse a CSV line with quoted fields
    const parseCsvLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    targetsData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length >= 6) {
        const targetYear = values[5]?.trim();
        targetsData.push({
          targetId: values[0]?.trim(),
          graphId: values[1]?.trim(),
          variable: values[2]?.trim(),
          targetValue: parseFloat(values[3]?.trim()),
          unit: values[4]?.trim(),
          targetYear: (targetYear === '' || targetYear === '�' || targetYear === '?' || isNaN(parseInt(targetYear))) ? null : parseInt(targetYear),
          description: values[6]?.trim() || '',
          citation: values[7]?.trim() || '',
          direction: values[8]?.trim() || '>'
        });
      }
    }
    
    return targetsData;
  } catch (error) {
    console.error('Failed to load targets:', error);
    targetsData = [];
    return targetsData;
  }
}

/**
 * Get targets for a specific graph ID
 */
export function getTargetsForGraph(graphId) {
  if (!targetsData || targetsData.length === 0) {
    return [];
  }
  return targetsData.filter(t => t.graphId === graphId);
}

/**
 * Update target annotations on all active graphs
 */
export function updateAllGraphTargets(graphViewsArray) {
  if (graphViewsArray && graphViewsArray.length > 0) {
    graphViewsArray.forEach(graphView => {
      if (graphView && typeof graphView.updateTargetAnnotations === 'function') {
        graphView.updateTargetAnnotations();
      }
    });
  }
}

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
    const relativePath = `../markdowns/diagrams/${filename}`;
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

export function createInfoIcon(hoverText, opts = {}) {
  if (!hoverText) return null;

  const infoIconContainer = $('<div class="info-icon-container">');
  const icon = $('<div class="info-icon">i</div>');

  // Parse Markdown to HTML
  const parsedHTML = marked.parse(hoverText);

  // If opts.graph is true, use .graph-tooltip, else .tooltip
  const isGraph = opts.graph === true;
  const tooltip = $(`<div class="${isGraph ? 'graph-tooltip' : 'tooltip'}">${parsedHTML}</div>`);

  // Append only the icon to the inline container; keep the tooltip out of
  // the document flow by placing it on the body so it cannot affect menu
  // heights when hidden. This avoids strange layout shifts when hovering.
  infoIconContainer.append(icon);

  // Ensure graph tooltips are placed on the body and positioned fixed
  // so they do not influence parent container layout.
  if (isGraph) {
    if (!tooltip.parent().is(document.body)) {
      tooltip.appendTo(document.body);
    }
    tooltip.css({ position: 'fixed', visibility: 'hidden', zIndex: 10001 });
  } else {
    // input/tooltips remain inline and use positionTooltip
    infoIconContainer.append(tooltip);
  }

  if (isGraph) {
    // Tooltip already appended to body and hidden; just position and show it.
    icon.on("mouseenter", function () {
      // Determine the boundary container to keep the tooltip inside the graph layout
      const mainGraphContainer = icon.closest('#graphs-container, .all-graphs-container, .graphs-root, .main-graphs');
      const containerRect = mainGraphContainer.length
        ? mainGraphContainer[0].getBoundingClientRect()
        : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

      // tooltip is already on document.body and positioned fixed

      // Compute positions in viewport coordinates and clamp to containerRect
      const iconRect = icon[0].getBoundingClientRect();
      const tooltipElem = tooltip[0];
      const tooltipWidth = tooltipElem.offsetWidth;
      const tooltipHeight = tooltipElem.offsetHeight;

      // Default: centered under the icon
      let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2;
      let top = iconRect.bottom + 8;

      // Clamp horizontal position to the main graph container (viewport coords)
      const minLeft = containerRect.left + 8;
      const maxLeft = containerRect.right - tooltipWidth - 8;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;

      // If tooltip would overflow bottom of container, try showing above icon
      if (top + tooltipHeight > containerRect.bottom - 8) {
        const altTop = iconRect.top - tooltipHeight - 8;
        if (altTop >= containerRect.top + 8) {
          top = altTop;
        } else {
          // clamp to bottom of container
          top = Math.max(containerRect.bottom - tooltipHeight - 8, containerRect.top + 8);
        }
      }

      // Ensure tooltip stays within viewport as well
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
      if (top < 8) top = 8;
      if (top + tooltipHeight > window.innerHeight - 8) top = window.innerHeight - tooltipHeight - 8;

      tooltip.removeClass('tooltip').addClass('graph-tooltip');
      tooltip.css({ left: `${left}px`, top: `${top}px`, transform: 'none', visibility: 'visible' });
    });

    icon.on("mouseleave", function () {
      tooltip.css("visibility", "hidden");
    });
  } else {
    // InputUI: fixed window-based
    icon.on("mouseenter", function () {
      positionTooltip(tooltip);
      tooltip.css("visibility", "visible");
    });
    icon.on("mouseleave", function () {
      tooltip.css("visibility", "hidden");
    });
  }

  return infoIconContainer;
}

/*
 * Graph preview utilities
 * - createGraphPreviewButton(linkedGraphId, title)
 * - creates a shared preview pane and renders a compact GraphView
 */

let currentPreview = {
  pane: null,
  graphView: null,
  canvas: null,
  openForId: null,
};

// Small cache to avoid scanning graphs repeatedly when resolving graph ids
const graphIdCache = new Map();

/**
 * Try to resolve a graph id given an input id or a title.
 * Heuristics: direct lookup by id, match by titleKey, partial id match, or JSON-text search.
 */
function findGraphIdForInput(keyOrId) {
  if (!keyOrId) return null;
  // Return cached result when available
  if (graphIdCache.has(keyOrId)) return graphIdCache.get(keyOrId);
  try {
    // direct map lookup
    const direct = coreConfig.graphs.get(keyOrId);
    if (direct && direct.id) return direct.id;

    // try matching titleKey
    for (const g of Array.from(coreConfig.graphs.values())) {
      if (!g) continue;
      if (g.titleKey && g.titleKey === keyOrId) return g.id;
      if (g.titleKey && typeof keyOrId === 'string' && keyOrId === str(g.titleKey)) return g.id;
    }

    // try partial id match as a last resort
    for (const g of Array.from(coreConfig.graphs.values())) {
      if (!g) continue;
      if (g.id && String(g.id).includes(String(keyOrId))) {
        graphIdCache.set(keyOrId, g.id);
        return g.id;
      }
    }
  } catch (e) {
    // ignore
  }
  graphIdCache.set(keyOrId, null);
  return null;
}

function ensurePreviewPane() {
  if (currentPreview.pane) return currentPreview.pane;

  const pane = $(
    `<div id="graph-preview-pane" aria-hidden="true">
        <div class="preview-header">
          <button class="preview-close" aria-label="Close preview">×</button>
          <div class="preview-title"></div>
        </div>
        <div class="preview-body">
          <div class="preview-canvas"><canvas id="graph-preview-canvas"></canvas></div>
          <div class="preview-empty" style="display:none;">No graph available</div>
        </div>
     </div>`
  );
  $(document.body).append(pane);
  pane.find(".preview-close").on("click", () => closePreview());
  // close on Esc
  $(document).on("keydown.graphPreview", (e) => {
    if (e.key === "Escape") closePreview();
  });

  // Close the preview when clicking outside the preview pane or its toggle buttons.
  // Installed once per runtime to avoid duplicate handlers.
  if (!currentPreview._outsideClickInstalled) {
    $(document).on('mousedown.graphPreviewOutside', (e) => {
      try {
        if (!currentPreview.pane) return;
        // only act when preview is visible
        if (currentPreview.pane.attr('aria-hidden') === 'true') return;
        const paneEl = currentPreview.pane[0];
        if (paneEl && paneEl.contains(e.target)) return; // click inside pane -> ignore
        // ignore clicks on other preview buttons/icons so toggling still works
        if ($(e.target).closest('.graph-preview-btn, .graph-preview-icon').length) return;
        // If allowedRoots were recorded when opening the preview, ignore clicks
        // that happen inside any of those roots (anchor input, containing input
        // item, or enclosing dropdown group). This ensures interacting with
        // controls inside the same variable or dropdown doesn't close the preview.
        try {
          if (Array.isArray(currentPreview._allowedRoots) && currentPreview._allowedRoots.length) {
            for (const root of currentPreview._allowedRoots) {
              try {
                if (!root) continue;
                if (root.contains && root.contains(e.target)) return; // inside allowed root
              } catch (inner) {
                // ignore
              }
            }
          }
          // As a fallback, also check common input containers around the click target
          // and see if any contains a preview button (covers some markup variants).
          const clickedClosest = $(e.target).closest('.input-item, .input-title-row, .slider-title-and-info-container, .input-dropdown-group, .input-segmented-item');
          if (clickedClosest && clickedClosest.length) {
            const previewBtnInClosest = $(clickedClosest[0]).find('.graph-preview-btn, .graph-preview-icon');
            if (previewBtnInClosest && previewBtnInClosest.length) return;
          }
        } catch (err) {
          // non-fatal - fall through to close
        }
        // otherwise, close the preview
        closePreview();
      } catch (err) {
        // non-fatal
      }
    });
    currentPreview._outsideClickInstalled = true;
  }

  currentPreview.pane = pane;
  currentPreview.canvas = pane.find("#graph-preview-canvas")[0];
  return pane;
}

function openPreviewFor(graphId, title) {
  const pane = ensurePreviewPane();
  const graphSpec = coreConfig.graphs.get(graphId);
  // Use graph spec title (translated) when available; fall back to provided title
  const resolvedTitle = graphSpec ? (graphSpec.titleKey ? str(graphSpec.titleKey) : title) : (title || "Preview");
  pane.find(".preview-title").text(resolvedTitle);
  const canvas = currentPreview.canvas;

  if (!graphSpec) {
    pane.find('.preview-empty').show();
    $(canvas).hide();
    pane.attr('aria-hidden', 'false');
    currentPreview.openForId = null;
    return;
  }

  // Determine model to use like GraphsUI
  const modelToUse = graphSpec.levels === "Scenario2" ? modelB.get() : model.get();

  // Create a viewModel similar to GraphsUI.createGraphViewModel
  const isCombined = graphSpec.scenarioDisplay === "combined";
  const viewModel = {
    spec: graphSpec,
    model: modelToUse,
    getLineWidth: () => 2,
    getScaleLabelFontSize: () => 10,
    getAxisLabelFontSize: () => 10,
    getSeriesForVar: (varId, sourceName) => {
      if (isCombined) {
        const seriesA = model.get().getSeriesForVar(varId, sourceName);
        const seriesB = modelB.get().getSeriesForVar(varId, sourceName);
        return { ...seriesA, points: [...(seriesA?.points || []), ...(seriesB?.points || [])] };
      } else {
        return modelToUse.getSeriesForVar(varId, sourceName);
      }
    },
    getStringForKey: (k) => {
      return k ? str(k) : undefined;
    },
    formatYAxisTickValue: (v) => {
      return format(v, graphSpec.yFormat);
    },
  };

  // Destroy previous graphView if present
  if (currentPreview.graphView) {
    try {
      currentPreview.graphView.destroy();
    } catch (e) {}
    currentPreview.graphView = null;
  }

  // Show canvas and hide empty placeholder
  pane.find('.preview-empty').hide();
  $(canvas).show();

  // Instantiate GraphView with compact options
  const opts = { fontFamily: 'Helvetica, Arial', fontStyle: 'normal', fontColor: '#222' };
  try {
    currentPreview.graphView = new GraphView(canvas, viewModel, opts);
    currentPreview.openForId = graphId;
  } catch (err) {
    console.error('Preview GraphView creation failed', err);
    pane.find('.preview-empty').show();
    $(canvas).hide();
    currentPreview.openForId = null;
    return;
  }

  // Remove any existing legend in the pane and create one matching main graphs
  try {
    pane.find('.graph-legend').remove();
    if (graphSpec.kind !== 'radar' && Array.isArray(graphSpec.legendItems)) {
      const legendContainer = $('<div class="graph-legend"></div>');
      pane.find('.preview-body').append(legendContainer);
      for (const itemSpec of graphSpec.legendItems) {
        const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
        const label = str(itemSpec.labelKey);
        const itemElem = $(`<div ${attrs}>${label}</div>`);
        legendContainer.append(itemElem);
      }
    }
  } catch (e) {
    // non-fatal
  }

  // Position pane: prefer the previous behavior (to the right of inputs)
  // but nudge it slightly lower using the nav-bar bottom spacing when available
  const inputs = $('#inputs-container');
  const paneWidth = 360;

  if (inputs.length) {
    const r = inputs[0].getBoundingClientRect();
    const left = Math.min(window.innerWidth - paneWidth - 16, r.right + 8);

    // If an anchor rect was recorded (the variable box that triggered the preview),
    // align vertically with that anchor; otherwise, use the nav-bar-based offset.
    let top;
    if (currentPreview._anchorRect) {
      try {
        const a = currentPreview._anchorRect;
        // compute pane height (fallback)
        const paneHeight = pane[0].offsetHeight || 240;
  // Bottom-justify: align the preview TOP to slightly above the anchor's
  // BOTTOM so the preview doesn't overlap the graph title area. We nudge
  // it up by ~20px to leave room for the graph title/header.
  top = Math.round(a.bottom - 37); // move up ~20px
        top = Math.max(64, Math.min(top, window.innerHeight - paneHeight - 16));
      } catch (e) {
        top = null;
      }
    }

    if (typeof top !== 'number') {
      const nav = $('#nav-bar, #navBar, #nav, .navbar, .app-navbar').first();
      if (nav && nav.length) {
        try {
          const navRect = nav[0].getBoundingClientRect();
          // small gap after nav bar to visually separate (8px)
          top = Math.max(64, Math.round(navRect.bottom + 8));
        } catch (e) {
          top = Math.max(64, r.top + 16);
        }
      } else {
        top = Math.max(64, r.top + 16);
      }
    }

    pane.css({ position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${paneWidth}px`, zIndex: 10002 });
  } else {
    // final fallback to right side
    pane.css({ position: 'fixed', right: '16px', top: '80px', width: `${paneWidth}px`, zIndex: 10002 });
  }

  pane.attr('aria-hidden', 'false');
  // Wire up model onOutputsChanged to refresh preview dynamically.
  // We'll wrap the existing onOutputsChanged handler on the chosen model instance so
  // preview updates when model outputs change.
  const attachTo = graphSpec.levels === "Scenario2" ? modelB.get() : model.get();
  if (attachTo) {
    const marker = '____preview_onOutputsChanged_orig';
    if (!attachTo[marker]) {
      attachTo[marker] = attachTo.onOutputsChanged || null;
    }
    // Throttle updates to the preview to avoid rapid Chart.js re-renders.
    let rafHandle = null;
    if (!attachTo.__preview_wrapper_installed) {
      attachTo.onOutputsChanged = function() {
        try {
          if (typeof attachTo[marker] === 'function') attachTo[marker]();
        } catch (e) {}
        try {
          // schedule a single rAF update
          if (currentPreview.graphView) {
            if (rafHandle) return; // already scheduled
            rafHandle = window.requestAnimationFrame(() => {
              try {
                currentPreview.graphView && currentPreview.graphView.updateData();
              } catch (e) {}
              rafHandle = null;
            });
          }
        } catch (e) {}
      };
      attachTo.__preview_wrapper_installed = true;
      // store raf handle so we can cancel if needed on close
      currentPreview._rafHandleOwner = () => rafHandle;
    }
    // Store reference so we can restore on close
    currentPreview._attachedModel = attachTo;
    currentPreview._attachedMarker = marker;
  }
}

function closePreview() {
  if (currentPreview.graphView) {
    try {
      currentPreview.graphView.destroy();
    } catch (e) {}
    currentPreview.graphView = null;
  }
  if (currentPreview.pane) {
    currentPreview.pane.attr('aria-hidden', 'true');
  }
  // restore wrapped model handler if any
  if (currentPreview._attachedModel && currentPreview._attachedMarker) {
    const m = currentPreview._attachedModel;
    const k = currentPreview._attachedMarker;
    try {
      m.onOutputsChanged = m[k] || null;
    } catch (e) {}
    try { delete m[k]; } catch(e){}
    // remove the installed wrapper marker so reopening will re-install the wrapper
    try { delete m.__preview_wrapper_installed; } catch (e) {}
    currentPreview._attachedModel = null;
    currentPreview._attachedMarker = null;
  }
  // clear any stored anchor rect
  try { currentPreview._anchorRect = null; } catch(e) {}
    // clear allowedRoots on close along with anchor references
    try { currentPreview._allowedRoots = null; } catch(e) {}
  // cancel any scheduled rAF update
  try {
    if (currentPreview._rafHandleOwner) {
      const getHandle = currentPreview._rafHandleOwner;
      const handle = typeof getHandle === 'function' ? getHandle() : null;
      if (handle) window.cancelAnimationFrame(handle);
    }
  } catch (e) {}
  currentPreview._rafHandleOwner = null;
  currentPreview.openForId = null;
}

export function createGraphPreviewButton(linkedGraphId, title) {
  if (!linkedGraphId) return null;
  // Try to resolve a matching graph id using heuristics so previews appear even
  // when the input id doesn't exactly match the graph id.
  const resolvedGraphId = findGraphIdForInput(linkedGraphId) || findGraphIdForInput(title) || linkedGraphId;
  const resolvedSpec = coreConfig.graphs.get(resolvedGraphId);
  if (!resolvedSpec) return null;

  // Use the same icon/container pattern as other info icons so spacing matches.
  const iconContainer = $('<div class="info-icon-container graph-preview-btn"/>');
  // Use a different material icon for the preview — now 'pie_chart'
  const icon = $(`<span class="material-icons graph-preview-icon" role="button" tabindex="0" title="Show graph preview" aria-label="Show graph preview">pie_chart</span>`);

  // Click handler toggles preview for the resolved graph id
  const handler = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const targetId = resolvedGraphId;
    // Record an anchor rect based on the nearest input/variable container so
    // the preview can vertically align with the input that triggered it.
    try {
      const $t = $(e && e.target ? e.target : icon[0]);
      const anchor = $t.closest('.input-item, .input-title-row, .slider-title-and-info-container, .input-dropdown-group, .input-segmented-item');
      // reset allowed roots
      currentPreview._allowedRoots = [];
      if (anchor && anchor.length) {
        currentPreview._anchorRect = anchor[0].getBoundingClientRect();
        currentPreview._anchorEl = anchor[0];
        currentPreview._allowedRoots.push(anchor[0]);
        // also include the broader input-item if different
        const item = anchor.closest('.input-item');
        if (item && item.length && item[0] !== anchor[0]) currentPreview._allowedRoots.push(item[0]);
        // include enclosing dropdown group so any variable inside it is considered inside
        const dd = anchor.closest('.input-dropdown-group');
        if (dd && dd.length) currentPreview._allowedRoots.push(dd[0]);
      } else if ($t && $t.length) {
        currentPreview._anchorRect = $t[0].getBoundingClientRect();
        currentPreview._anchorEl = $t[0];
        currentPreview._allowedRoots.push($t[0]);
        const item = $t.closest('.input-item');
        if (item && item.length) currentPreview._allowedRoots.push(item[0]);
        const dd = $t.closest('.input-dropdown-group');
        if (dd && dd.length) currentPreview._allowedRoots.push(dd[0]);
      } else {
        currentPreview._anchorRect = null;
        currentPreview._anchorEl = null;
      }
      // dedupe allowedRoots
      if (Array.isArray(currentPreview._allowedRoots)) {
        const seen = new Set();
        currentPreview._allowedRoots = currentPreview._allowedRoots.filter((el) => {
          if (!el) return false;
          const id = el;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      }
    } catch (err) {
      currentPreview._anchorRect = null;
      currentPreview._anchorEl = null;
      currentPreview._allowedRoots = [];
    }

    if (currentPreview.openForId === targetId) {
      closePreview();
      return;
    }
    openPreviewFor(targetId, title || resolvedSpec.titleKey);
  };

  icon.on('click', handler);
  // keyboard activation
  icon.on('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  });

  iconContainer.append(icon);
  return iconContainer;
}

/*
 * Function to position tooltip correctly
 */

export function positionTooltip(tooltip) {
  // Only for inputUI: fixed window-based tooltips
  const icon = tooltip.siblings(".info-icon");
  const iconRect = icon[0].getBoundingClientRect();
  const tooltipElem = tooltip[0];

  // Get tooltip dimensions
  const tooltipWidth = tooltipElem.offsetWidth;
  const tooltipHeight = tooltipElem.offsetHeight;

  // Position below the icon, shifted right (20px right of icon center)
  let top = iconRect.bottom + 8;
  let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2 + 20;

  // Adjust for right edge
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 8;
  }
  // Adjust for left edge
  if (left < 0) {
    left = 8;
  }
  // Adjust for bottom edge
  if (top + tooltipHeight > window.innerHeight) {
    top = iconRect.top - tooltipHeight - 8;
  }
  // Adjust for top edge
  if (top < 0) {
    top = 8;
  }

  tooltip.css({
    top: `${top}px`,
    left: `${left}px`,
    transform: 'none'
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
