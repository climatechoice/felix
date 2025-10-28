import type { ChartConfiguration, ChartData } from "chart.js";
import { Chart } from "chart.js";

import enStrings from "@core-strings/en";

import type { GraphViewModel } from "./graph-view";
import type { GraphViewOptions } from "./graph-view";

/**
 * Return the base (English) string for the given key.
 */
function str(key) {
  return enStrings[key];
}

/**
 * Update radar chart data with latest values from the model.
 */
export function updateRadarChartJsData(
  viewModel: GraphViewModel,
  chartData: ChartData
): void {
  const spec = viewModel.spec;
  const targetYear = spec.xMax || 2050;
  
  // Determine if this is a combined scenario display
  const isCombined = spec.scenarioDisplay === "combined";
  const datasetsPerScenario = spec.datasets.length;
  
  const dataPointsS1: number[] = [];
  const dataPointsS2: number[] = [];
  
  // Update data for each dataset (each axis of the radar)
  for (let i = 0; i < datasetsPerScenario; i++) {
    const datasetSpec = spec.datasets[i];
    const varId = datasetSpec.varId;
    const referenceSource = datasetSpec.externalSourceName;
    
    // Get scenario data (undefined = current model output)
    let scenarioSeries = viewModel.getSeriesForVar(varId, undefined);
    if (!scenarioSeries) {
      scenarioSeries = viewModel.getSeriesForVar(varId, "cust");
    }
    
    // Get reference data - use specified source or fallback
    let refSeries = referenceSource 
      ? viewModel.getSeriesForVar(varId, referenceSource)
      : findReferenceSeries(viewModel, varId);
    
    if (scenarioSeries && refSeries && scenarioSeries.points.length > 0) {
      if (isCombined) {
        // In combined mode, series.points contains both S1 and S2 concatenated
        const mid = Math.floor(scenarioSeries.points.length / 2);
        const s1Points = scenarioSeries.points.slice(0, mid);
        const s2Points = scenarioSeries.points.slice(mid);
        
        // Similarly for reference
        const refMid = Math.floor(refSeries.points.length / 2);
        const refS1Points = refSeries.points.slice(0, refMid);
        const refS2Points = refSeries.points.slice(refMid);
        
        // Calculate % change for S1
        const percentChangeS1 = calculatePercentChangeFromPoints(s1Points, refS1Points, targetYear);
        dataPointsS1.push(percentChangeS1);
        
        // Calculate % change for S2
        const percentChangeS2 = calculatePercentChangeFromPoints(s2Points, refS2Points, targetYear);
        dataPointsS2.push(percentChangeS2);
      } else {
        // Single scenario mode
        const percentChange = calculatePercentChange(scenarioSeries, refSeries, targetYear);
        dataPointsS1.push(percentChange);
      }
    } else {
      dataPointsS1.push(0);
      if (isCombined) dataPointsS2.push(0);
    }
  }
  
  // Update the chart data
  if (chartData.datasets && chartData.datasets.length > 0) {
    chartData.datasets[0].data = dataPointsS1;
    
    // If combined, update the second dataset with S2 data
    if (isCombined && chartData.datasets.length > 1) {
      chartData.datasets[1].data = dataPointsS2;
    }
  }
}

/**
 * Find reference series by trying common source names.
 */
function findReferenceSeries(viewModel: GraphViewModel, varId: string): any {
  const commonSources = ['bau', 'Ref', 'BAU', 'ref', 'reference', 'baseline', 'base'];
  for (const source of commonSources) {
    const series = viewModel.getSeriesForVar(varId, source);
    if (series) return series;
  }
  return null;
}

/**
 * Calculate percent change between scenario and reference at target year.
 */
function calculatePercentChange(scenarioSeries: any, refSeries: any, targetYear: number): number {
  return calculatePercentChangeFromPoints(scenarioSeries.points, refSeries.points, targetYear);
}

/**
 * Calculate percent change from point arrays at target year.
 */
function calculatePercentChangeFromPoints(scenarioPoints: any[], refPoints: any[], targetYear: number): number {
  let scenarioValue = 0;
  let refValue = 0;
  let found = false;
  
  // Find scenario value at target year
  for (let j = 0; j < scenarioPoints.length; j++) {
    const point = scenarioPoints[j] as any;
    if (point.x === targetYear) {
      scenarioValue = point.y;
      found = true;
      break;
    }
  }
  
  if (!found) return 0;
  
  // Find reference value at target year
  for (let j = 0; j < refPoints.length; j++) {
    const point = refPoints[j] as any;
    if (point.x === targetYear) {
      refValue = point.y;
      break;
    }
  }
  
  // Calculate % change
  if (refValue !== 0) {
    return ((scenarioValue - refValue) / Math.abs(refValue)) * 100;
  }
  
  return 0;
}

/**
 * Creates a radar chart showing % change between scenario and reference at a specified year.
 * The comparison year is determined by xMax in the spec (e.g., 2050).
 * Supports combined scenario display (showing both S1 and S2 on same chart).
 */
export function createRadarChart(
  canvas: HTMLCanvasElement,
  viewModel: GraphViewModel,
  options: GraphViewOptions
): Chart {
  const spec = viewModel.spec;
  const targetYear = spec.xMax || 2050;
  const isCombined = spec.scenarioDisplay === "combined";
  
  console.log('Creating radar chart for spec:', spec.id, spec.titleKey);
  console.log('Combined mode:', isCombined);
  console.log('Target year for comparison:', targetYear);
  
  // Extract labels and data for each variable
  const labels: string[] = [];
  const dataPointsS1: number[] = [];
  const dataPointsS2: number[] = [];
  const colors: string[] = [];
  
  // Process each dataset (each axis of the radar)
  for (let i = 0; i < spec.datasets.length; i++) {
    const datasetSpec = spec.datasets[i];
    const varId = datasetSpec.varId;
    const referenceSource = datasetSpec.externalSourceName;
    
    console.log(`Processing dataset ${i}:`, varId);
    console.log('  Reference source:', referenceSource || 'auto-detect');
    
    // Get scenario data
    let scenarioSeries = viewModel.getSeriesForVar(varId, undefined);
    if (!scenarioSeries) {
      scenarioSeries = viewModel.getSeriesForVar(varId, "cust");
    }
    
    // Get reference data - use specified source or fallback
    let refSeries = referenceSource 
      ? viewModel.getSeriesForVar(varId, referenceSource)
      : findReferenceSeries(viewModel, varId);
    
    console.log('  Scenario series:', scenarioSeries ? `${scenarioSeries.points.length} points` : 'NOT FOUND');
    console.log('  Ref series:', refSeries ? `found` : 'NOT FOUND');
    
    if (scenarioSeries && refSeries && scenarioSeries.points.length > 0) {
      const percentChange = calculatePercentChange(scenarioSeries, refSeries, targetYear);
      console.log('  Percent change:', percentChange);
      
      // Get the label
      const label = extractLabel(viewModel, datasetSpec.labelKey, varId);
      console.log('  Using label:', label);
      
      labels.push(label);
      dataPointsS1.push(percentChange);
      
      // For combined mode, S2 will have same data initially (will be updated in updateData)
      if (isCombined) {
        dataPointsS2.push(percentChange);
      }
      
      // Use the color from plot color column
      const color = datasetSpec.color || '#4169E1';
      colors.push(color);
    }
  }
  
  console.log('Final labels:', labels);
  console.log('Final S1 data points:', dataPointsS1);
  if (isCombined) console.log('Final S2 data points:', dataPointsS2);
  
  // If no data was collected, add placeholder
  if (labels.length === 0) {
    console.warn('No radar chart data collected');
    labels.push('No Data');
    dataPointsS1.push(0);
    if (isCombined) dataPointsS2.push(0);
    colors.push('#999');
  }
  
  // Build chart datasets
  const datasets: any[] = [{
    label: isCombined ? 'Scenario 1' : `Year ${targetYear} (% Change vs Reference)`,
    data: dataPointsS1,
    backgroundColor: isCombined ? 'rgba(106, 61, 154, 0.3)' : 'rgba(128, 128, 128, 0.2)', // Purple for S1 in combined mode, grey otherwise
    borderColor: isCombined ? 'rgb(106, 61, 154)' : 'rgb(128, 128, 128)', // Purple for S1 in combined mode, grey otherwise
    borderWidth: 2,
    pointBackgroundColor: colors,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: colors,
    pointRadius: 6,
    pointHoverRadius: 8
  }];
  
  // Add second dataset for combined mode
  if (isCombined) {
    datasets.push({
      label: 'Scenario 2',
      data: dataPointsS2,
      backgroundColor: 'rgba(230, 97, 0, 0.3)', // Orange for S2
      borderColor: 'rgb(230, 97, 0)', // Orange for S2
      borderWidth: 2,
      pointBackgroundColor: colors,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: colors,
      pointRadius: 6,
      pointHoverRadius: 8
    });
  }
  
  const chartData: ChartData = {
    labels: labels,
    datasets: datasets
  };
  
  const chartConfig: ChartConfiguration = {
    type: 'radar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: { display: false },
      legend: { display: false },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      scale: {
        ticks: {
          beginAtZero: true,
          min: spec.yMin !== undefined ? spec.yMin : -100,
          max: spec.yMax !== undefined ? spec.yMax : 100,
          stepSize: 50, // Show ticks at 100, 50, 0, -50, -100
          callback: (value) => {
            return Number(value).toFixed(0) + '%';
          },
          fontFamily: options.fontFamily,
          fontStyle: options.fontStyle,
          fontColor: options.fontColor,
          showLabelBackdrop: false, // Remove background from tick labels
          backdropPaddingY: 10 // Shift tick labels down
        },
        pointLabels: {
          fontFamily: options.fontFamily,
          fontStyle: options.fontStyle,
          fontSize: 14,
          fontColor: 'transparent' // Hide default labels since we'll draw custom ones
        }
      },
      tooltips: {
        enabled: true,
        callbacks: {
          label: function (tooltipItem, data) {
            const value = Number(tooltipItem.yLabel);
            return `${value.toFixed(2)}%`;
          }
        }
      }
    },
    // Register inline plugin for custom label rendering
    plugins: [{
      beforeDraw: (chart: any) => {
        const ctx = chart.ctx;
        const scale = chart.scale;
        
        if (!ctx || !scale) return;
        
        labels.forEach((label, i) => {
          // Position labels at the edge of the drawing area to maximize chart size
          const distance = scale.drawingArea + 25;
          const point = scale.getPointPosition(i, distance);
          
          // Set font
          ctx.font = `bold 13px ${options.fontFamily || 'Arial'}`;
          
          // Wrap text if it's too long (max 20 characters per line)
          const maxCharsPerLine = 20;
          const words = label.split(' ');
          const lines: string[] = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > maxCharsPerLine && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) {
            lines.push(currentLine);
          }
          
          // Calculate box dimensions based on multiline text
          const lineHeight = 16;
          let maxLineWidth = 0;
          lines.forEach(line => {
            const width = ctx.measureText(line).width;
            if (width > maxLineWidth) maxLineWidth = width;
          });
          
          const padding = 8;
          const boxWidth = maxLineWidth + padding * 2;
          const boxHeight = lines.length * lineHeight + padding * 2;
          
          // Draw colored background box with rounded corners
          const x = point.x - boxWidth / 2;
          const y = point.y - boxHeight / 2;
          const radius = 1;
          
          ctx.globalAlpha = 1.0; // Ensure full opacity
          ctx.fillStyle = colors[i] || '#999';
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + boxWidth - radius, y);
          ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
          ctx.lineTo(x + boxWidth, y + boxHeight - radius);
          ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
          ctx.lineTo(x + radius, y + boxHeight);
          ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
          
          // Draw white text on colored background (multiline)
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw each line
          const startY = point.y - ((lines.length - 1) * lineHeight) / 2;
          lines.forEach((line, lineIndex) => {
            ctx.fillText(line, point.x, startY + lineIndex * lineHeight);
          });
        });
      }
    }]
  };
  
  return new Chart(canvas, chartConfig);
}

/**
 * Extract a human-readable label from the labelKey.
 * The labelKey should be the actual text from the CSV.
 */
function extractLabel(viewModel: GraphViewModel, labelKey: string | undefined, fallback: string): string {
  if (!labelKey) {
    return fallback;
  }
  
  // Get the actual string value from the key
  const label = viewModel.getStringForKey(labelKey);
  return label || labelKey;
}
