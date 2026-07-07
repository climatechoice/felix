import type { GraphViewModel } from "./graph-view";
import { getTargetById } from "../../lib/utils";


/**
 * Colour the cell background based on how far the scenario has moved
 * relative to the target for that variable.
 *
 * t = pct / targetPct  (clamped to [-1.5, 1.5])
 *   t = 0  → grey   (no change from reference)
 *   t = 1  → full green  (scenario has reached the target)
 *   t = -1 → full red    (same distance, wrong direction)
 *
 * Falls back to flat sign-based colour when no target is available.
 */
function getSquareBgColor(pct: number, targetPct: number | null): string {
  let t: number;
  if (targetPct !== null && Math.abs(targetPct) > 0.01) {
    t = Math.max(-1.5, Math.min(1.5, pct / targetPct));
  } else {
    // No target — flat sign-based fallback
    t = pct > 0.5 ? 1 : pct < -0.5 ? -1 : 0;
  }

  // Boost small values so even modest changes are clearly visible,
  // then saturate quickly — full colour well before t = 1.
  const intensity = Math.min(1, Math.pow(Math.abs(t), 0.4));

  // Resting grey (semi-transparent so the panel bg shows through subtly)
  const gR = 215, gG = 215, gB = 215;
  // Grey fades from 0.4 opacity at rest to 0 at full colour
  // so the final colour is fully opaque and saturated at intensity = 1.
  const gA = 0.4 * (1 - intensity);

  if (t >= 0) {
    const r = Math.round(gR + (22  - gR) * intensity);
    const g = Math.round(gG + (163 - gG) * intensity);
    const b = Math.round(gB + (74  - gB) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${(gA + intensity).toFixed(2)})`;
  } else {
    const r = Math.round(gR + (220 - gR) * intensity);
    const g = Math.round(gG + (38  - gG) * intensity);
    const b = Math.round(gB + (38  - gB) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${(gA + intensity).toFixed(2)})`;
  }
}

/** Try common reference-source names until one returns data. */
function findReferenceSeries(viewModel: GraphViewModel, varId: string): any {
  for (const src of ['bau', 'Ref', 'BAU', 'ref', 'reference', 'baseline', 'base']) {
    const s = viewModel.getSeriesForVar(varId, src);
    if (s) return s;
  }
  return null;
}

/** Calculate % change between scenario and reference at the target year. */
function calcPctChange(
  scenarioPoints: any[],
  refPoints: any[],
  targetYear: number
): number {
  let scenarioValue = 0, refValue = 0, found = false;
  for (const pt of scenarioPoints) {
    if ((pt as any).x === targetYear) { scenarioValue = (pt as any).y; found = true; break; }
  }
  if (!found) return 0;
  for (const pt of refPoints) {
    if ((pt as any).x === targetYear) { refValue = (pt as any).y; break; }
  }
  return refValue !== 0 ? ((scenarioValue - refValue) / Math.abs(refValue)) * 100 : 0;
}

/** Calculate absolute change (scenario − reference) × unitScale at the target year. */
function calcAbsChange(
  scenarioPoints: any[],
  refPoints: any[],
  targetYear: number,
  unitScale: number
): number {
  let scenarioValue = 0, refValue = 0, found = false;
  for (const pt of scenarioPoints) {
    if ((pt as any).x === targetYear) { scenarioValue = (pt as any).y; found = true; break; }
  }
  if (!found) return 0;
  for (const pt of refPoints) {
    if ((pt as any).x === targetYear) { refValue = (pt as any).y; break; }
  }
  return (scenarioValue - refValue) * unitScale;
}

interface SquareItem {
  label: string;
  color: string;       // variable's theme colour (from spec)
  pct: number;         // S1 (or single-scenario) % change after scale
  pctS2?: number;      // S2 % change after scale — only in combined mode
  absChange: number;   // S1 absolute change (scenario − ref) × unitScale
  absChangeS2?: number;// S2 absolute change — only in combined mode
  targetPct: number | null; // % change required to hit the target (unit-scaled), or null
  unitScale: number;   // multiplier used to convert raw model values to target units
  unitLabel: string;   // display unit string (e.g. 'Billion ha')
}

/** Derive one SquareItem per dataset in the spec. */
function computeItems(viewModel: GraphViewModel): SquareItem[] {
  const spec = viewModel.spec;
  const targetYear = spec.xMax || 2050;
  const isCombined = spec.scenarioDisplay === "combined";

  // scale field format for kind=square:
  //   "u1,u2,u3,u4,u5,u6;t1,t2,t3,t4,t5,t6"
  //   Part before ';' → unit-scale multipliers (convert raw model values to target units)
  //   Part after  ';' → target IDs from targets.csv
  type MaybeScale = { scale?: unknown };
  const rawScale = (spec as unknown as MaybeScale)?.scale;
  const unitScales: number[] = [];
  const targetIds: string[] = [];
  const unitLabels: string[] = [];
  if (typeof rawScale === 'string') {
    const halves = rawScale.split(';');
    for (const p of halves[0].split(',').map(s => s.trim())) {
      const n = parseFloat(p);
      unitScales.push(Number.isFinite(n) && n !== 0 ? n : 1);
    }
    if (halves[1]) {
      for (const p of halves[1].split(',').map(s => s.trim())) {
        targetIds.push(p);
      }
    }
    // halves[2+] are unit labels (one per variable); strip leading ' (Excel escape)
    for (let j = 2; j < halves.length; j++) {
      unitLabels.push(halves[j].trim().replace(/^'/, ''));
    }
  }

  const items: SquareItem[] = [];

  for (let i = 0; i < spec.datasets.length; i++) {
    const ds = spec.datasets[i];
    const varId = ds.varId;

    let scenarioSeries = viewModel.getSeriesForVar(varId, undefined);
    if (!scenarioSeries) scenarioSeries = viewModel.getSeriesForVar(varId, "cust");

    const refSeries = ds.externalSourceName
      ? viewModel.getSeriesForVar(varId, ds.externalSourceName)
      : findReferenceSeries(viewModel, varId);

    if (!scenarioSeries || !refSeries || scenarioSeries.points.length === 0) continue;

    const label = viewModel.getStringForKey(ds.labelKey) || (ds.labelKey as string) || varId;
    const color = ds.color || '#555555';
    const unitScale = unitScales[i] ?? 1;

    // Look up target by ID; apply unit scale to convert raw reference to target units.
    let targetPct: number | null = null;
    const targetId = targetIds[i];
    const target = targetId ? getTargetById(targetId) : null;
    if (target && target.targetValue !== null && !isNaN(target.targetValue)) {
      let refAtYear = 0;
      for (const pt of refSeries.points) {
        if ((pt as any).x === targetYear) { refAtYear = (pt as any).y; break; }
      }
      const refScaled = refAtYear * unitScale;
      if (refScaled !== 0) {
        // targetValue is in target units; refScaled is reference in same units.
        // Sign naturally encodes direction: no explicit multiplier needed.
        targetPct = ((target.targetValue - refScaled) / Math.abs(refScaled)) * 100;
      }
    }

    const unitLabel = unitLabels[i] ?? '';
    if (isCombined) {
      const mid = Math.floor(scenarioSeries.points.length / 2);
      const refMid = Math.floor(refSeries.points.length / 2);
      const s1Points = scenarioSeries.points.slice(0, mid);
      const s2Points = scenarioSeries.points.slice(mid);
      const r1Points = refSeries.points.slice(0, refMid);
      const r2Points = refSeries.points.slice(refMid);
      const pct = calcPctChange(s1Points, r1Points, targetYear);
      const pctS2 = calcPctChange(s2Points, r2Points, targetYear);
      const absChange = calcAbsChange(s1Points, r1Points, targetYear, unitScale);
      const absChangeS2 = calcAbsChange(s2Points, r2Points, targetYear, unitScale);
      items.push({ label, color, pct, pctS2, absChange, absChangeS2, targetPct, unitScale, unitLabel });
    } else {
      const pct = calcPctChange(scenarioSeries.points, refSeries.points, targetYear);
      const absChange = calcAbsChange(scenarioSeries.points, refSeries.points, targetYear, unitScale);
      items.push({ label, color, pct, absChange, targetPct, unitScale, unitLabel });
    }
  }

  return items;
}

// ─── DOM helpers ────────────────────────────────────────────────────────────

/** Small filled circle in the variable's theme colour. */
function makeDotEl(color: string, size = '11px'): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: ${size};
    height: ${size};
    border-radius: 50%;
    background-color: ${color};
    flex-shrink: 0;
    border: 1.5px solid white;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.18);
  `;
  return el;
}

/** Primary label — the most visually prominent element. */
function makeLabelEl(text: string, extraStyle = ''): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    font-size: 1.2em;
    font-weight: 700;
    text-align: center;
    color: #111;
    line-height: 1.25;
    letter-spacing: 0.01em;
    ${extraStyle}
  `;
  el.textContent = text;
  return el;
}

/** Format an absolute (unit-scaled) value compactly. */
function formatAbsValue(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1000) return v.toFixed(0);
  if (a >= 100) return v.toFixed(1);
  if (a >= 10) return v.toFixed(2);
  if (a >= 1) return v.toFixed(3);
  return v.toPrecision(3);
}

/** Value block: absolute change as hero, % change small in brackets below. */
function makeValueEl(absChange: number, unitLabel: string, pct: number): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
  `;

  // Big absolute value
  const sign = absChange >= 0 ? '+' : '';
  const absEl = document.createElement('div');
  absEl.style.cssText = `
    font-size: 1.05em;
    font-weight: 700;
    color: rgba(0,0,0,0.75);
    line-height: 1;
    text-align: center;
  `;
  absEl.textContent = unitLabel
    ? `${sign}${formatAbsValue(absChange)} ${unitLabel}`
    : `${sign}${formatAbsValue(absChange)}`;
  wrap.appendChild(absEl);

  // Small % change in brackets
  const pctEl = document.createElement('div');
  pctEl.style.cssText = `
    font-size: 0.72em;
    font-weight: 500;
    color: rgba(0,0,0,0.45);
    line-height: 1;
    text-align: center;
  `;
  pctEl.textContent = `(${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
  wrap.appendChild(pctEl);

  return wrap;
}

/** Build a single colored square cell for one scenario. */
function makeCell(
  pct: number,
  targetPct: number | null,
  unitScale: number,
  absChange: number,
  unitLabel: string,
  label: string,
  titleColor: string,
  scenarioLabel: string,
  isCombined: boolean
): HTMLDivElement {
  const cell = document.createElement('div');
  cell.style.cssText = `
    background-color: ${getSquareBgColor(pct, targetPct)};
    border-radius: ${isCombined ? '6px' : '10px'};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: ${isCombined ? '8px 6px' : '14px 10px'};
    height: 100%;
    min-height: 0;
    border: 1px solid rgba(0,0,0,0.08);
    box-sizing: border-box;
  `;

  // Coloured dot — uses the variable's theme colour
  cell.appendChild(makeDotEl(titleColor, isCombined ? '14px' : '22px'));

  if (!isCombined) {
    // Label is the hero text
    cell.appendChild(makeLabelEl(label));
    cell.appendChild(makeValueEl(absChange, unitLabel, pct));
  } else {
    const scenEl = document.createElement('div');
    scenEl.style.cssText = `font-size: 0.6em; color: rgba(0,0,0,0.55); font-weight: 700; letter-spacing: 0.04em;`;
    scenEl.textContent = scenarioLabel;
    cell.appendChild(scenEl);
    cell.appendChild(makeValueEl(absChange, unitLabel, pct));
  }

  return cell;
}

// ─── Main render function ───────────────────────────────────────────────────

function renderSquareGrid(container: HTMLElement, viewModel: GraphViewModel): void {
  const spec = viewModel.spec;
  const isCombined = spec.scenarioDisplay === "combined";

  const items = computeItems(viewModel);

  // Arrange into rows of 3 columns (e.g. 6 items → 2 rows × 3 cols)
  const cols = items.length <= 3 ? items.length : 3;
  const rows = Math.ceil(items.length / cols);

  // Clear and set up the outer grid
  container.innerHTML = '';
  container.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    gap: 8px;
    padding: 8px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
  `;

  for (const item of items) {
    if (isCombined) {
      // Wrapper: title on top, then two side-by-side sub-cells
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 3px;
      `;

      wrapper.appendChild(makeLabelEl(item.label, 'margin-bottom: 2px;'));

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 4px;';
      row.appendChild(makeCell(item.pct, item.targetPct, item.unitScale, item.absChange, item.unitLabel, item.label, item.color, 'S1', true));
      row.appendChild(makeCell(item.pctS2 ?? 0, item.targetPct, item.unitScale, item.absChangeS2 ?? 0, item.unitLabel, item.label, item.color, 'S2', true));

      wrapper.appendChild(row);
      container.appendChild(wrapper);
    } else {
      container.appendChild(makeCell(item.pct, item.targetPct, item.unitScale, item.absChange, item.unitLabel, item.label, item.color, '', false));
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Create a square-grid trade-off chart inside the given container div.
 * The container should already be sized (e.g. via CSS); its contents will
 * be replaced by the grid of colored squares.
 */
export function createSquareChart(container: HTMLElement, viewModel: GraphViewModel): void {
  renderSquareGrid(container, viewModel);
}

/**
 * Refresh the square chart to reflect the latest model data.
 * Replaces the grid in-place without touching the container's dimensions.
 */
export function updateSquareChartData(container: HTMLElement, viewModel: GraphViewModel): void {
  renderSquareGrid(container, viewModel);
}
