import type { ChartConfiguration, ChartData, ChartDataSets } from "chart.js";
import { Chart } from "chart.js";
// import "chartjs-plugin-annotation";
import annotationPlugin from "chartjs-plugin-annotation";

import type {
  GraphDatasetSpec,
  GraphSpec,
  OutputVarId,
  Series,
  StringKey,
} from "@core";

import { config as coreConfig } from "@core";

import enStrings from "@core-strings/en";

/**
 * Return the base (English) string for the given key.
 */
function str(key) {
  return enStrings[key];
}

/** View model for a graph. */
export interface GraphViewModel {
  /** The spec that describes the graph datasets and visuals. */
  spec: GraphSpec;

  /**
   * Optional callback to customize graph line width.  If defined,
   * this will be called after layout events (e.g. after the browser
   * window is resized.)
   *
   * @return The graph line width in pixels.
   */
  getLineWidth?(): number;

  /**
   * Optional callback to customize graph scale label font size.
   * If defined, this will be called after layout events (e.g. after
   * the browser window is resized.)
   *
   * @return The graph scale label font size in pixels.
   */
  getScaleLabelFontSize?(): number;

  /**
   * Optional callback to customize graph axis label font size.
   * If defined, this will be called after layout events (e.g. after
   * the browser window is resized.)
   *
   * @return The graph axis label font size in pixels.
   */
  getAxisLabelFontSize?(): number;

  /**
   * Optional callback to filter the datasets that are displayed in the graph.
   * If not defined, all datasets from the graph spec will be displayed.
   *
   * @return The subset of datasets to display.
   */
  getDatasets?(): GraphDatasetSpec[];

  /**
   * Return the series data for the given model output variable.
   *
   * @param varId The output variable ID associated with the data.
   * @param sourceName The external data source name (e.g. "Ref"), or
   * undefined to use the latest model output data.
   */
  getSeriesForVar(varId: OutputVarId, sourceName?: string): Series | undefined;

  /**
   * Return the translated string for the given key.
   *
   * @param key The string key.
   * @param values The optional map of values to substitute into the template string.
   */
  getStringForKey(key: StringKey, values?: { [key: string]: string }): string;

  /**
   * Return a formatted string for the given y-axis tick value.
   *
   * @param value The number value.
   */
  formatYAxisTickValue(value: number): string;
}

/**
 * Options for graph view styling.
 */
export interface GraphViewOptions {
  /** CSS-style font family string (can include comma-separated fallbacks). */
  fontFamily?: string;
  /** CSS-style font style. */
  fontStyle?: string;
  /** CSS-style hex color. */
  fontColor?: string;
}

/**
 * Wraps a native chart element.
 */

// is this necessary (?)
Chart.pluginService.register(annotationPlugin);
// ^^

export class GraphView {
  private chart: Chart;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly viewModel: GraphViewModel,
    options: GraphViewOptions
  ) {
    this.chart = createChart(canvas, viewModel, options);
  }

  /**
   * Update the chart to reflect the latest data from the model.
   * This should be called after the model has produced new outputs.
   *
   * @param animated Whether to animate the data when it is updated.
   */
  updateData(animated = true) {
    if (this.chart) {
      // Update the chart data
      updateLineChartJsData(this.viewModel, this.chart.data);

      // Refresh the chart view
      this.chart.update(animated ? undefined : { duration: 0 });
    }
  }

  /**
   * Destroy the chart and any associated resources.
   */
  destroy() {
    this.chart?.destroy();
    this.chart = undefined;
  }
}

function createChart(
  canvas: HTMLCanvasElement,
  viewModel: GraphViewModel,
  options: GraphViewOptions
): Chart {
  // Create the chart data and config depending on the given style
  /*
   * If viewModel.spec.scenarioDisplay === "combined", then
   * I want to give createLineChartJsData two specs:
   * a) the viewModel.spec,
   * b) the viewModel.spec with the same str(viewModel.spec.titleKey) as the current viewModel.spec
   */
  let chartData;
  if (viewModel.spec.scenarioDisplay === "combined") {
    const title = str(viewModel.spec.titleKey);
    // Search in coreConfig.graphs for a different spec with the same title
    const matchingSpec = Array.from(coreConfig.graphs.values()).find(
      (spec) => spec !== viewModel.spec && str(spec.titleKey) === title
    );
    if (matchingSpec) {
      // console.log("found MATCHING title");
      chartData = createLineChartJsData(viewModel.spec, matchingSpec);
    } else {
      console.warn(
        "Combined scenario display requested but no matching spec found."
      );
      chartData = createLineChartJsData(viewModel.spec, null); // fallback
    }
  } else {
    chartData = createLineChartJsData(viewModel.spec, null);
  }

  /*
   * The above chartData has BOTH datasets
   * when "scenario display" is combined.
   */

  const chartJsConfig = lineChartJsConfig(viewModel, chartData);
  updateLineChartJsData(viewModel, chartData);

  // Use built-in responsive resizing support.  Note that for this to work
  // correctly, the canvas parent must be a container with a fixed size
  // (in `px` or `vw` units) and `position: relative`.  For more information:
  //   https://www.chartjs.org/docs/latest/general/responsive.html
  chartJsConfig.options.responsive = true;
  chartJsConfig.options.maintainAspectRatio = false;

  // Disable the built-in title and legend
  chartJsConfig.options.title = { display: false };
  chartJsConfig.options.legend = { display: false };

  // Don't show points
  chartJsConfig.options.elements = {
    point: {
      radius: 0,
    },
  };

  // Set the initial (translated) axis labels
  const graphSpec = viewModel.spec;
  const xAxisLabel = stringForKey(viewModel, graphSpec.xAxisLabelKey);
  const yAxisLabel = stringForKey(viewModel, graphSpec.yAxisLabelKey);
  chartJsConfig.options.scales.xAxes[0].scaleLabel.labelString = xAxisLabel;
  chartJsConfig.options.scales.yAxes[0].scaleLabel.labelString = yAxisLabel;

  // Apply the font options for labels and ticks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFontOptions(obj: any | undefined) {
    if (obj) {
      obj.fontFamily = options.fontFamily;
      obj.fontStyle = options.fontStyle;
      obj.fontColor = options.fontColor;
    }
  }
  applyFontOptions(chartJsConfig.options.scales.xAxes[0].scaleLabel);
  applyFontOptions(chartJsConfig.options.scales.yAxes[0].scaleLabel);
  applyFontOptions(chartJsConfig.options.scales.xAxes[0].ticks);
  applyFontOptions(chartJsConfig.options.scales.yAxes[0].ticks);

  return new Chart(canvas, chartJsConfig);
}

// TODO: Perhaps use this function instead of the imported str()
function stringForKey(
  viewModel: GraphViewModel,
  key?: StringKey
): string | undefined {
  if (key) {
    return viewModel.getStringForKey(key);
  } else {
    return undefined;
  }
}

function lineChartJsConfig(
  viewModel: GraphViewModel,
  data: ChartData
): ChartConfiguration {
  const spec = viewModel.spec;

  /*
   * Please read for "annotations" property (vertical dotted line in graphs)
   *
   * When putting "annotations:" inside "options" inside "ChartConfiguration", I got
   * the following error:
   *
   * Object literal may only specify known properties, but 'annotation'
   * does not exist in type 'ChartOptions'.
   * Did you mean to write 'rotation'?ts(2561)
   * index.d.ts(296, 9): The expected type comes from property 'options'
   * which is declared here on type 'ChartConfiguration'
   *
   * Fixed this by creating a new file in "src" folder called
   * "chartjs-plugin-annotation.d.ts" with this new option
   */

  const chartConfig: ChartConfiguration = {
    type: "line",
    data,
    options: {
      scales: {
        xAxes: [
          {
            type: "linear",
            position: "bottom",
            scaleLabel: {
              display: spec.xAxisLabelKey !== undefined,
              padding: {
                top: 0,
                bottom: 5,
              },
            },
            ticks: {
              maxTicksLimit: 6,
              maxRotation: 0,
              min: spec.xMin,
              max: spec.xMax,
            },
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
            },
            ticks: {
              beginAtZero: true,
              min: spec.yMin,
              max: spec.yMax,
              suggestedMax: spec.ySoftMax,
              callback: (value) => {
                return viewModel.formatYAxisTickValue(value as number);
              },
            },
            stacked: isStacked(spec),
          },
        ],
      },
      annotation: {
        drawTime: "afterDraw",
        annotations: [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: 2020,
            borderColor: "#666",
            borderWidth: 1,
            borderDash: [5, 5],
            borderDashOffset: 0,
            label: {
              enabled: false,
            },
          },
        ],
      },
      tooltips: { 
        // Show numbers when hovering over the graph, and 
        // make sure they're fixed to two decimal places.
        enabled: true,
        callbacks: {
          label: function (tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const value = Number(tooltipItem.yLabel); // Ensure it's a number
            const label = dataset.label || '';
            return `${label}: ${value.toFixed(2)}`;
          },
        },
      },
    },
  };
  return chartConfig;
}

function createLineChartJsData(spec1: GraphSpec, spec2: GraphSpec): ChartData {
  const chartDatasets: ChartDataSets[] = [];
  // function to process a single spec
  const processSpec = (spec: GraphSpec) => {
    // console.log(spec.levels);
    for (let varIndex = 0; varIndex < spec.datasets.length; varIndex++) {
      const chartDataset: ChartDataSets = {};

      const color = spec.datasets[varIndex].color;

      const lineStyle = spec.datasets[varIndex].lineStyle;
      const lineStyleModifiers =
        spec.datasets[varIndex].lineStyleModifiers || [];
      if (isStacked(spec) && lineStyle === "area") {
        // This is an area section of a stacked chart; display it with fill style
        // and disable the border (which would otherwise make the section appear
        // larger than it should be, and would cause misalignment with the ref line).
        chartDataset.fill = true;
        chartDataset.borderColor = "rgba(0, 0, 0, 0)";
        chartDataset.backgroundColor = color;
      } else if (lineStyle === "scatter") {
        // This is a scatter plot.  We configure the chart type and dot color here,
        // but the point radius will be configured in `applyScaleFactors`.
        chartDataset.type = "scatter";
        chartDataset.fill = false;
        chartDataset.borderColor = "rgba(0, 0, 0, 0)";
        chartDataset.backgroundColor = color;
      } else {
        // This is a line plot. Always specify a background color even if fill is
        // disabled; this ensures that the color square is correct for tooltips.
        chartDataset.backgroundColor = color;
        // This is a normal line plot; no fill
        chartDataset.fill = false;
        if (lineStyle === "none") {
          // Make the line transparent (typically only used for confidence intervals)
          chartDataset.borderColor = "rgba(0, 0, 0, 0)";
        } else {
          // Use the specified color for the line
          chartDataset.borderColor = color;
          chartDataset.borderCapStyle = "round";
        }
      }

      chartDataset.pointHitRadius = 3;
      chartDataset.pointHoverRadius = 0;
      // console.log("ONE chartDataset INSIDE PROCESSING: ", chartDataset);
      chartDatasets.push(chartDataset);
    }
  };

  /*
   * If "combined" is true, then I have to go through
   * the first spec's variables, but also the second spec's variables.
   * This is how to get the second graphSpec's
   * colours and styles for the second graphSpec's graph lines if
   * "scenario display" is "combined".
   */
  processSpec(spec1);
  // If combined, also process spec2
  // ! We also check whether spec2 exists before processing
  // ! for the cases that "scenario display" = "combined"
  // ! but no matching title is found in another spec.
  if (isCombined(spec1) && spec2) {
    processSpec(spec2);
  }
  // console.log("ALL chartDatasets OUTSIDE PROCESSING: ", chartDatasets);
  return {
    datasets: chartDatasets,
  };
}

function updateLineChartJsData(
  viewModel: GraphViewModel,
  chartData: ChartData
): void {
  // Read per-graph scale multiplier. The CSV generator may not emit a `modes` field.
  // Fallbacks: allow numeric values to be placed in `subClassification` or `graphType`.
  type MaybeScaleCarrier = { modes?: unknown; subClassification?: unknown; graphType?: unknown };
  const specAny = viewModel.spec as unknown as MaybeScaleCarrier;

  function coerceToNumber(value: unknown): number | undefined {
    if (value == null) return undefined;
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string") {
      // Extract first numeric token, supporting scientific notation (e.g., 1e-06)
      // Matches: -12, 3.45, -0.001, 1e6, -2.5e-03, etc.
      const match = value.match(/(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
      if (match) {
        const n = Number(match[1]);
        if (Number.isFinite(n)) return n;
      }
    }
    return undefined;
  }

  const rawScale =
    specAny?.modes ?? specAny?.subClassification ?? specAny?.graphType ?? undefined;
  const candidate = coerceToNumber(rawScale);
  const scaleMultiplier = candidate != null ? candidate : 1;

  function applyScale(points: unknown): unknown {
    if (!points || scaleMultiplier === 1) return points;
    // Support both number[] and ChartPoint[] shapes defensively
    if (Array.isArray(points)) {
      return points.map((p) => {
        if (typeof p === "number") return p * scaleMultiplier;
        if (p && typeof p === "object") {
          const pt = p as { x?: number; y?: number };
          if (typeof pt.y === "number") {
            return { ...pt, y: pt.y * scaleMultiplier };
          }
        }
        return p;
      });
    }
    return points;
  }
  function getSeries(
    varId: OutputVarId,
    sourceName?: string
  ): Series | undefined {
    const series = viewModel.getSeriesForVar(varId, sourceName);
    if (!series) {
      console.error(
        `ERROR: No data available for ${varId} (source=${
          sourceName || "model"
        })`
      );
    }
    return series;
  }

  const visibleDatasetSpecs =
    viewModel.getDatasets?.() || viewModel.spec.datasets;
  /*
   * Changed this to varCount = viewModel.spec.datasets.length;
   * and I only loop over this for the FIRST viewModel.
   */
  const varCount = viewModel.spec.datasets.length;

  for (let varIndex = 0; varIndex < varCount; varIndex++) {
    const specDataset = viewModel.spec.datasets[varIndex];
    const varId = specDataset.varId;
    const sourceName = specDataset.externalSourceName;
    const series = getSeries(varId, sourceName);
    if (series) {
      if (viewModel.spec.datasets.length !== chartData.datasets.length) {
        // ! this means (implicitly) that "scenario display" = "combined".
        // ! because viewModel.spec has less datasets than chartData.
        // TODO: Right now, I assume that it is half, but it is not always half.
        // TODO: change to a better "if statement"

        // series.points has both seriesA, seriesB data. (eg. 402 total)
        const allPoints = applyScale(series.points || []) as unknown[];
        const mid = Math.floor(allPoints.length / 2); // (eg. 201)
        const firstHalf = allPoints.slice(0, mid); // modelA's points
        const secondHalf = allPoints.slice(mid); // modelB's points

        // Calculate base index for modelB's dataset
        // This is where the data for modelB will be "injected".
        // ! This assumes that the same amount of variables exist for both rows
        // ! in graphs.csv that have "scenario display" = "combined".
        // TODO: Change this so that the above assumption isn't needed.
        // TODO: This will also fix the two BAUs being seen in the graphs.
        const modelBOffset = chartData.datasets.length / 2;
        const modelBIndex = varIndex + modelBOffset;

        // Ensure both datasets exist
        chartData.datasets[varIndex] = chartData.datasets[varIndex] || {};
        // TODO: More thorough tests here
        chartData.datasets[modelBIndex] = chartData.datasets[modelBIndex] || {};

        // Assign the split data
        /*
         * Here, the data is updated for both models when
         * "scenario display" = "combined"
         */
        chartData.datasets[varIndex].data = firstHalf; // Model A
        chartData.datasets[modelBIndex].data = secondHalf; // Model B
        // console.log("Model A Dataset:", chartData.datasets[varIndex]);
        // console.log("Model B Dataset:", chartData.datasets[modelBIndex]);
      } else {
        // Here "scenario display" is not "combined"
        chartData.datasets[varIndex].data = applyScale(series.points) as
          | number[]
          | { x: number; y: number }[];
      }
    }
    const visible = visibleDatasetSpecs.find(
      (d) => d.varId === varId && d.externalSourceName === sourceName
    );
    chartData.datasets[varIndex].hidden = visible === undefined;
  }
}

function isStacked(spec: GraphSpec): boolean {
  // A graph that includes a plot with a line style of area is a stacked graph.
  // Note that other plot line styles are ignored, except for the special case
  // where a ref line is specified (with a line style other than 'area').
  return spec.kind === "stacked-line";
}

function isCombined(spec: GraphSpec): boolean {
  // Check whether the graphSpec's "scenario display" column is set
  // to "combined".
  return spec.scenarioDisplay === "combined";
}
