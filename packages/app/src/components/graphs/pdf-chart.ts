import type { ChartConfiguration, ChartData } from "chart.js";
import type { GraphViewModel } from "./graph-view";
import type { GraphViewOptions } from "./graph-view";
import { Chart } from "chart.js";

/**
 * Calculate log-normal probability density function
 */
function logNormalPDF(x: number, mu: number, alphaLn: number, sigmaLn: number): number {
  if (x <= 0 || sigmaLn <= 0 || mu <= 0) return 0;
  
  const muLn = Math.log(mu); // Convert median to log-space mean
  const coefficient = alphaLn / (x * sigmaLn * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(Math.log(x) - muLn, 2) / (2 * Math.pow(sigmaLn, 2));
  
  return coefficient * Math.exp(exponent);
}

/**
 * Generate curve points
 */
function generateLogNormalCurve(
  mu: number,
  alphaLn: number,
  sigmaLn: number,
  xMin: number,
  xMax: number,
  numPoints: number = 200
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  
  // Ensure xMin is above 0 for log-normal distribution
  const safeXMin = Math.max(xMin, 0.001);
  
  for (let i = 0; i < numPoints; i++) {
    const ratio = i / (numPoints - 1);
    const x = safeXMin + (xMax - safeXMin) * ratio;
    const y = logNormalPDF(x, mu, alphaLn, sigmaLn);
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Parse PDF chart configuration from kind parameter
 * Format: "line-pdf (2050)" -> {year: 2050}
 * Only accepts single year parameter, not range parameters
 */
function parsePDFConfig(kind: string | undefined): { year: number } {
  let year = 2050;
  
  if (kind && typeof kind === 'string') {
    // Match only single number in parentheses: line-pdf (2050)
    const match = kind.match(/^line-pdf\s*\((\d+)\)$/);
    if (match) {
      year = parseInt(match[1], 10);
    }
  }
  
  return { year };
}

/**
 * Create a PDF chart with log-normal distribution
 */
export function createPDFChart(
  canvas: HTMLCanvasElement,
  viewModel: GraphViewModel,
  options: GraphViewOptions
): Chart {
  const spec = viewModel.spec;
  const config = parsePDFConfig(spec.kind);
  const datasets = spec.datasets || [];
  
  // Get x-axis range from CSV config
  const xMin = spec.xMin || 0;
  const xMax = spec.xMax || 100;
  
  // Extract parameters from model at specified year
  let mu = 1, alphaLn = 1, sigmaLn = 0.5, threshold = null;
  
  if (datasets[0]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[0].varId, datasets[0].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) mu = (point as any).y || 1;
  }
  
  if (datasets[1]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[1].varId, datasets[1].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) alphaLn = (point as any).y || 1;
  }
  
  if (datasets[2]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[2].varId, datasets[2].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) sigmaLn = (point as any).y || 0.5;
  }
  
  if (datasets[3]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[3].varId, datasets[3].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) threshold = (point as any).y;
  }
  
  console.log(`PDF Chart: year=${config.year}, range=[${xMin}, ${xMax}], Mu=${mu}, Alpha_ln=${alphaLn}, Sigma_ln=${sigmaLn}, threshold=${threshold}`);
  
  // Generate curve
  const curveData = generateLogNormalCurve(mu, alphaLn, sigmaLn, xMin, xMax);
  
  const chartData: ChartData = {
    datasets: [
      {
        label: 'Distribution',
        data: curveData,
        type: 'line',
        fill: true,
        backgroundColor: 'rgba(74, 158, 255, 0.2)',
        borderColor: 'rgba(74, 158, 255, 1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        lineTension: 0.4
      } as any
    ]
  };
  
  // Add threshold line if specified
  if (threshold !== null) {
    const maxY = Math.max(...curveData.map(p => p.y));
    chartData.datasets.push({
      label: 'Threshold',
      data: [
        { x: threshold, y: 0 },
        { x: threshold, y: maxY }
      ],
      type: 'line',
      fill: false,
      borderColor: 'rgba(255, 68, 68, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 0
    } as any);
  }
  
  const chartConfig: ChartConfiguration = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          type: 'linear',
          ticks: {
            min: xMin,
            max: xMax,
            fontFamily: options.fontFamily,
            fontStyle: options.fontStyle,
            fontColor: options.fontColor
          },
          scaleLabel: {
            display: spec.xAxisLabelKey !== undefined,
            labelString: spec.xAxisLabelKey ? viewModel.getStringForKey(spec.xAxisLabelKey) : '',
            fontFamily: options.fontFamily,
            fontStyle: options.fontStyle,
            fontColor: options.fontColor
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true,
            fontFamily: options.fontFamily,
            fontStyle: options.fontStyle,
            fontColor: options.fontColor
          },
          scaleLabel: {
            display: spec.yAxisLabelKey !== undefined,
            labelString: spec.yAxisLabelKey ? viewModel.getStringForKey(spec.yAxisLabelKey) : '',
            fontFamily: options.fontFamily,
            fontStyle: options.fontStyle,
            fontColor: options.fontColor
          }
        }]
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          fontFamily: options.fontFamily,
          fontStyle: options.fontStyle,
          fontColor: options.fontColor,
          boxWidth: 12,
          padding: 10
        }
      },
      tooltips: {
        enabled: true,
        callbacks: {
          label: function (tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const label = dataset.label || '';
            const value = Number(tooltipItem.yLabel);
            return `${label}: ${value.toFixed(4)}`;
          }
        }
      }
    }
  };
  
  return new Chart(canvas, chartConfig);
}

/**
 * Update PDF chart data when model changes
 */
export function updatePDFChartJsData(
  viewModel: GraphViewModel,
  chartData: ChartData
): void {
  const spec = viewModel.spec;
  const config = parsePDFConfig(spec.kind);
  const datasets = spec.datasets || [];
  
  // Get x-axis range from CSV config
  const xMin = spec.xMin || 0;
  const xMax = spec.xMax || 100;
  
  // Extract parameters
  let mu = 1, alphaLn = 1, sigmaLn = 0.5, threshold = null;
  
  if (datasets[0]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[0].varId, datasets[0].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) mu = (point as any).y || 1;
  }
  
  if (datasets[1]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[1].varId, datasets[1].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) alphaLn = (point as any).y || 1;
  }
  
  if (datasets[2]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[2].varId, datasets[2].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) sigmaLn = (point as any).y || 0.5;
  }
  
  if (datasets[3]?.varId) {
    const series = viewModel.getSeriesForVar(datasets[3].varId, datasets[3].externalSourceName);
    const point = series?.points.find((p: any) => p.x === config.year);
    if (point) threshold = (point as any).y;
  }
  
  console.log(`Updating PDF Chart: Mu=${mu}, Alpha_ln=${alphaLn}, Sigma_ln=${sigmaLn}, threshold=${threshold}`);
  
  // Regenerate curve
  const curveData = generateLogNormalCurve(mu, alphaLn, sigmaLn, xMin, xMax);
  
  // Update the distribution dataset
  if (chartData.datasets && chartData.datasets.length > 0) {
    chartData.datasets[0].data = curveData;
  }
  
  // Update threshold line if it exists
  if (threshold !== null && chartData.datasets && chartData.datasets.length > 1) {
    const maxY = Math.max(...curveData.map(p => p.y));
    chartData.datasets[1].data = [
      { x: threshold, y: 0 },
      { x: threshold, y: maxY }
    ];
  } else if (threshold === null && chartData.datasets && chartData.datasets.length > 1) {
    // Remove threshold dataset if threshold is null
    chartData.datasets.splice(1, 1);
  } else if (threshold !== null && chartData.datasets && chartData.datasets.length === 1) {
    // Add threshold dataset if it doesn't exist but threshold is set
    const maxY = Math.max(...curveData.map(p => p.y));
    chartData.datasets.push({
      label: 'Threshold',
      data: [
        { x: threshold, y: 0 },
        { x: threshold, y: maxY }
      ],
      type: 'line',
      fill: false,
      borderColor: 'rgba(255, 68, 68, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 0
    } as any);
  }
}
