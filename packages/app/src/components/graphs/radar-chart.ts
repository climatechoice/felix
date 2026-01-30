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
 * Get color for radar chart point based on value.
 * Returns gradient: white at 0, green at positive extreme, red at negative extreme.
 */
function getPointColor(value: number, min: number = -100, max: number = 100): string {
  // Normalize value to -1 to +1 range
  const range = Math.max(Math.abs(min), Math.abs(max));
  const normalized = Math.max(-1, Math.min(1, value / range));

  const d = 220;

  if (normalized >= 0) {
    // Positive: interpolate from white to green
    // White: rgb(d, d, d), Green: rgb(34, 197, 94)
    const t = normalized; // 0 = white, 1 = green
    const r = Math.round(d + (34 - d) * t);
    const g = Math.round(d + (197 - d) * t);
    const b = Math.round(d + (94 - d) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Negative: interpolate from white to red
    // White: rgb(d, d, d), Red: rgb(239, 68, 68)
    const t = -normalized; // 0 = white, 1 = red
    const r = Math.round(d + (239 - d) * t);
    const g = Math.round(d + (68 - d) * t);
    const b = Math.round(d + (68 - d) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
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
  // In combined mode, chartData has 2 datasets but spec.datasets is just the variable list
  const isCombined = spec.scenarioDisplay === "combined";
  const varCount = spec.datasets.length;
  
  // Read per-axis scale multipliers (same as in createRadarChart)
  type MaybeScaleCarrier = { modes?: unknown; scale?: unknown; graphLayout?: unknown };
  const specAny = spec as unknown as MaybeScaleCarrier;
  
  const scaleMultipliers: number[] = [];
  const rawScale = specAny?.scale ?? specAny?.modes ?? specAny?.graphLayout ?? undefined;
  
  if (typeof rawScale === 'string' && rawScale.includes(',')) {
    // Parse comma-separated scale values
    const parts = rawScale.split(',').map(s => s.trim());
    for (const part of parts) {
      const num = parseFloat(part);
      scaleMultipliers.push(Number.isFinite(num) ? num : 1);
    }
  }
  
  // Get chart limits for clamping
  const min = spec.yMin !== undefined ? spec.yMin : -100;
  const max = spec.yMax !== undefined ? spec.yMax : 100;
  
  // Update data for each variable (each axis of the radar)
  for (let varIndex = 0; varIndex < varCount; varIndex++) {
    const datasetSpec = spec.datasets[varIndex];
    const varId = datasetSpec.varId;
    const referenceSource = datasetSpec.externalSourceName;
    
    // Get the scale multiplier for this axis (default to 1 if not specified)
    const axisScale = scaleMultipliers[varIndex] ?? 1;
    
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
        
        // Calculate % change for S1 and apply scale
        const percentChangeS1 = calculatePercentChangeFromPoints(s1Points, refS1Points, targetYear) * axisScale;
        
        // Calculate % change for S2 and apply scale
        const percentChangeS2 = calculatePercentChangeFromPoints(s2Points, refS2Points, targetYear) * axisScale;
        
        // Update S1 dataset - store clamped value for display, actual for tooltip
        if (chartData.datasets[0] && chartData.datasets[0].data) {
          (chartData.datasets[0].data as number[])[varIndex] = Math.max(min, Math.min(max, percentChangeS1));
          if (!(chartData.datasets[0] as any).actualValues) {
            (chartData.datasets[0] as any).actualValues = [];
          }
          (chartData.datasets[0] as any).actualValues[varIndex] = percentChangeS1;
        }
        
        // Update S2 dataset - store clamped value for display, actual for tooltip
        if (chartData.datasets[1] && chartData.datasets[1].data) {
          (chartData.datasets[1].data as number[])[varIndex] = Math.max(min, Math.min(max, percentChangeS2));
          if (!(chartData.datasets[1] as any).actualValues) {
            (chartData.datasets[1] as any).actualValues = [];
          }
          (chartData.datasets[1] as any).actualValues[varIndex] = percentChangeS2;
        }
      } else {
        // Single scenario mode - apply scale
        const percentChange = calculatePercentChange(scenarioSeries, refSeries, targetYear) * axisScale;
        
        // Update S1 dataset - store clamped value for display, actual for tooltip
        if (chartData.datasets[0] && chartData.datasets[0].data) {
          (chartData.datasets[0].data as number[])[varIndex] = Math.max(min, Math.min(max, percentChange));
          if (!(chartData.datasets[0] as any).actualValues) {
            (chartData.datasets[0] as any).actualValues = [];
          }
          (chartData.datasets[0] as any).actualValues[varIndex] = percentChange;
        }
      }
    }
  }
  
  // Update point colors based on the actual values (use gradient)
  if (chartData.datasets[0] && chartData.datasets[0].data) {
    const actualValues0 = (chartData.datasets[0] as any).actualValues || chartData.datasets[0].data;
    chartData.datasets[0].pointBackgroundColor = (actualValues0 as number[]).map(value => getPointColor(value, min, max));
    chartData.datasets[0].pointHoverBorderColor = (actualValues0 as number[]).map(value => getPointColor(value, min, max));
  }
  
  if (isCombined && chartData.datasets[1] && chartData.datasets[1].data) {
    const actualValues1 = (chartData.datasets[1] as any).actualValues || chartData.datasets[1].data;
    chartData.datasets[1].pointBackgroundColor = (actualValues1 as number[]).map(value => getPointColor(value, min, max));
    chartData.datasets[1].pointHoverBorderColor = (actualValues1 as number[]).map(value => getPointColor(value, min, max));
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
  
  // Read per-axis scale multipliers from `scale` field
  // Format: comma-separated values, one per axis (e.g., "1,0.5,2,1,1.5,0.8")
  type MaybeScaleCarrier = { modes?: unknown; scale?: unknown; graphLayout?: unknown };
  const specAny = spec as unknown as MaybeScaleCarrier;
  
  const scaleMultipliers: number[] = [];
  const rawScale = specAny?.scale ?? specAny?.modes ?? specAny?.graphLayout ?? undefined;
  
  if (typeof rawScale === 'string' && rawScale.includes(',')) {
    // Parse comma-separated scale values
    const parts = rawScale.split(',').map(s => s.trim());
    for (const part of parts) {
      const num = parseFloat(part);
      scaleMultipliers.push(Number.isFinite(num) ? num : 1);
    }
  } else {
    // Single value or no value - use 1 for all axes
    const singleScale = typeof rawScale === 'number' ? rawScale : 
                        (typeof rawScale === 'string' ? parseFloat(rawScale) : NaN);
    const defaultScale = Number.isFinite(singleScale) ? singleScale : 1;
    // Will fill with default scale as we process each dataset
  }
  
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
    
    // Get scenario data
    let scenarioSeries = viewModel.getSeriesForVar(varId, undefined);
    if (!scenarioSeries) {
      scenarioSeries = viewModel.getSeriesForVar(varId, "cust");
    }
    
    // Get reference data - use specified source or fallback
    let refSeries = referenceSource 
      ? viewModel.getSeriesForVar(varId, referenceSource)
      : findReferenceSeries(viewModel, varId);
    
    if (scenarioSeries && refSeries && scenarioSeries.points.length > 0) {
      // Get the label from labelKey
      const label = viewModel.getStringForKey(datasetSpec.labelKey) || datasetSpec.labelKey || varId;
      labels.push(label);
      
      // Get the scale multiplier for this axis (default to 1 if not specified)
      const axisScale = scaleMultipliers[i] ?? 1;
      
      if (isCombined) {
        // In combined mode, split the series data for S1 and S2
        const mid = Math.floor(scenarioSeries.points.length / 2);
        const s1Points = scenarioSeries.points.slice(0, mid);
        const s2Points = scenarioSeries.points.slice(mid);
        
        // Similarly for reference
        const refMid = Math.floor(refSeries.points.length / 2);
        const refS1Points = refSeries.points.slice(0, refMid);
        const refS2Points = refSeries.points.slice(refMid);
        
        // Calculate % change for S1 and apply scale
        const percentChangeS1 = calculatePercentChangeFromPoints(s1Points, refS1Points, targetYear) * axisScale;
        dataPointsS1.push(percentChangeS1);
        
        // Calculate % change for S2 and apply scale
        const percentChangeS2 = calculatePercentChangeFromPoints(s2Points, refS2Points, targetYear) * axisScale;
        dataPointsS2.push(percentChangeS2);
      } else {
        // Single scenario mode - apply scale
        const percentChange = calculatePercentChange(scenarioSeries, refSeries, targetYear) * axisScale;
        dataPointsS1.push(percentChange);
      }
      
      // Use the color from plot color column
      const color = datasetSpec.color || '#4169E1';
      colors.push(color);
    }
  }
  
  // If no data was collected, add placeholder
  if (labels.length === 0) {
    labels.push('No Data');
    dataPointsS1.push(0);
    if (isCombined) dataPointsS2.push(0);
    colors.push('#999');
  }
  
  // Clamp values for visual display while preserving originals for tooltips
  const min = spec.yMin !== undefined ? spec.yMin : -100;
  const max = spec.yMax !== undefined ? spec.yMax : 100;
  const clampedS1 = dataPointsS1.map(v => Math.max(min, Math.min(max, v)));
  const clampedS2 = isCombined ? dataPointsS2.map(v => Math.max(min, Math.min(max, v))) : [];
  
  // Generate gradient point colors based on value magnitude (use original values)
  const pointColorsS1 = dataPointsS1.map(value => getPointColor(value, min, max));
  const pointColorsS2 = isCombined ? dataPointsS2.map(value => getPointColor(value, min, max)) : [];
  
  // Build chart datasets
  const datasets: any[] = [{
    label: isCombined ? 'S1' : `Year ${targetYear} (vs Ref)`,
    data: clampedS1, // Use clamped values for display
    actualValues: dataPointsS1, // Store actual values for tooltips
    backgroundColor: isCombined ? 'rgba(106, 61, 154, 0.3)' : 'rgba(128, 128, 128, 0.2)',
    borderColor: isCombined ? 'rgb(106, 61, 154)' : 'rgb(128, 128, 128)',
    borderWidth: 2,
    pointBackgroundColor: pointColorsS1,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: pointColorsS1,
    pointRadius: 6,
    pointHoverRadius: 8
  }];
  
  // Add second dataset for combined mode
  if (isCombined) {
    datasets.push({
      label: 'S2',
      data: clampedS2, // Use clamped values for display
      actualValues: dataPointsS2, // Store actual values for tooltips
      backgroundColor: 'rgba(230, 97, 0, 0.3)',
      borderColor: 'rgb(230, 97, 0)',
      borderWidth: 2,
      pointBackgroundColor: pointColorsS2,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: pointColorsS2,
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
          top: 40,
          right: 40,
          bottom: 40,
          left: 40
        }
      },
      scale: {
        ticks: {
          beginAtZero: true,
          min: spec.yMin !== undefined ? spec.yMin : -100,
          max: spec.yMax !== undefined ? spec.yMax : 100,
          stepSize: 25, // Show ticks at 100, 75, 50, 25, 0, -25, -50, -75, -100
          callback: (value) => {
            return Number(value).toFixed(0) + '%';
          },
          fontFamily: options.fontFamily,
          fontStyle: options.fontStyle,
          fontColor: options.fontColor,
          fontSize: 10, // Keep ticks small
          showLabelBackdrop: false, // Remove background from tick labels
          backdropPaddingY: 10 // Shift tick labels down
        },
        pointLabels: {
          fontFamily: options.fontFamily,
          fontStyle: options.fontStyle,
          fontSize: 1, // Minimal font size to reduce reserved space
          fontColor: 'transparent' // Hide default labels, we'll draw custom ones
        }
      },
      tooltips: {
        enabled: true,
        callbacks: {
          title: function (tooltipItems, data) {
            // Show the axis label as the title
            if (tooltipItems.length > 0) {
              const index = tooltipItems[0].index;
              return String(data.labels[index] || '');
            }
            return '';
          },
          label: function (tooltipItem, data) {
            // Show actual unclamped value from actualValues array
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const actualValues = (dataset as any).actualValues;
            const value = actualValues && actualValues[tooltipItem.index] !== undefined
              ? actualValues[tooltipItem.index]
              : Number(tooltipItem.yLabel);
            
            const datasetLabel = dataset.label || '';
            const sign = value >= 0 ? '+' : '';
            return `${datasetLabel}: ${sign}${value.toFixed(1)}%`;
          },
          labelColor: function (tooltipItem, chart) {
            if (isCombined) {
              // In combined mode:
              // - Small square shows scenario color (purple for S1, orange for S2)
              const datasetIndex = tooltipItem.datasetIndex;
              const scenarioColor = datasetIndex === 0 ? 'rgb(106, 61, 154)' : 'rgb(230, 97, 0)'; // Purple for S1, Orange for S2
              
              return {
                borderColor: scenarioColor,
                backgroundColor: scenarioColor
              };
            }
            // Single scenario mode - use default
            return {
              borderColor: 'rgb(128, 128, 128)',
              backgroundColor: 'rgb(128, 128, 128)'
            };
          }
        }
      }
    },
    // Register inline plugins for custom rendering
    plugins: [{
      // Plugin 1: Draw reference polygon at 0%
      beforeDatasetsDraw: (chart: any) => {
        const ctx = chart.ctx;
        const scale = chart.scale;
        
        if (!ctx || !scale) return;
        
        // Calculate the radius for 0% (middle of the scale)
        const min = spec.yMin !== undefined ? spec.yMin : -100;
        const max = spec.yMax !== undefined ? spec.yMax : 100;
        const zeroPercent = 0;
        
        // Calculate distance from center for 0%
        const range = max - min;
        const normalizedValue = (zeroPercent - min) / range;
        const distance = scale.drawingArea * normalizedValue;
        
        // Draw reference polygon following the radar axes
        const numPoints = labels.length;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // Black with 30% opacity
        ctx.fillStyle = 'rgba(156, 163, 175, 0.15)'; // Light gray fill
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        
        // Draw polygon connecting points at 0% on each axis
        for (let i = 0; i < numPoints; i++) {
          const point = scale.getPointPosition(i, distance);
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }, {
      // Plugin 2: Draw simple colored label boxes
      beforeDraw: (chart: any) => {
        const ctx = chart.ctx;
        const scale = chart.scale;
        
        if (!ctx || !scale) return;
        
        const chartLabels = chart.data.labels || [];
        
        // Calculate scale factor based on canvas WIDTH
        const canvasWidth = chart.width;
        
        // Scale font and dimensions based on canvas width
        // Base size at 600px width, scale proportionally
        const scaleFactor = Math.min(1, canvasWidth / 600);
        const fontSize = Math.max(7, Math.round(13 * scaleFactor)); // Min 7px, max 13px
        const padding = Math.max(3, Math.round(8 * scaleFactor));
        // Very aggressive scaling for width - cube the scale factor
        const widthScaleFactor = scaleFactor * scaleFactor * scaleFactor;
        const maxWidth = Math.max(40, Math.round(120 * widthScaleFactor));
        const lineHeight = Math.max(9, Math.round(16 * scaleFactor));
        // Scale the label distance based on canvas size
        const labelDistance = Math.max(15, Math.round(25 * scaleFactor));
        
        chartLabels.forEach((label, i) => {
          const distance = scale.drawingArea + labelDistance;
          const point = scale.getPointPosition(i, distance);
          
          // Set font with responsive size
          ctx.font = `bold ${fontSize}px ${options.fontFamily || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Split text into multiple lines if it exceeds maxWidth
          const words = label.split(' ');
          const lines: string[] = [];
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
          
          // Calculate box dimensions based on lines
          const boxHeight = lines.length * lineHeight + padding * 2;
          const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          const boxWidth = maxLineWidth + padding * 2;
          
          // Draw colored box
          const x = point.x - boxWidth / 2;
          const y = point.y - boxHeight / 2;
          
          ctx.fillStyle = colors[i] || '#999';
          ctx.fillRect(x, y, boxWidth, boxHeight);
          
          // Draw text lines
          ctx.fillStyle = '#fff';
          lines.forEach((line, lineIndex) => {
            const lineY = point.y - (lines.length - 1) * lineHeight / 2 + lineIndex * lineHeight;
            ctx.fillText(line, point.x, lineY);
          });
        });
      }
    }]
  };
  
  const chart = new Chart(canvas, chartConfig);
  
  return chart;
}
