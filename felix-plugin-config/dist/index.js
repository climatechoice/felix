// src/processor.ts
import { existsSync } from "fs";
import { join as joinPath2 } from "path";

// src/context.ts
import { readFileSync } from "fs";
import { join as joinPath, relative } from "path";
import { parse as parseCsv } from "csv-parse/sync";

// src/strings.ts
import sanitizeHtml from "sanitize-html";
var Strings = class {
  constructor() {
    this.records = /* @__PURE__ */ new Map();
  }
  add(key, str, layout2, context, grouping, appendedStringKeys) {
    checkInvisibleCharacters(str || "");
    if (!key) {
      throw new Error(`Must provide a key for the string: ${str}`);
    }
    const validKey = /^[0-9a-z_]+$/.test(key);
    if (!validKey) {
      throw new Error(`String key contains undesirable characters: ${key}`);
    }
    if (!layout2) {
      throw new Error(`Must provide a layout (e.g., 'layout1' or 'not-translated')`);
    }
    if (!context) {
      throw new Error(`Must provide a context string: key=${key}, string=${str}`);
    }
    if (context === "Core") {
      context = void 0;
    }
    if (!grouping) {
      grouping = "primary";
    }
    if (str) {
      str = str.trim();
      str = htmlToUtf8(str);
    }
    if (!str) {
      return "";
    }
    if (this.records.has(key)) {
      const prefix = key.substring(0, key.indexOf("__"));
      switch (prefix) {
        case "graph_dataset_label":
        case "graph_xaxis_label":
        case "graph_yaxis_label":
        case "input_group_title":
        case "input_range":
        case "input_units":
          break;
        default:
          throw new Error(`More than one string with key=${key}`);
      }
    }
    this.records.set(key, {
      key,
      str,
      layout: layout2,
      context,
      grouping,
      appendedStringKeys
    });
    return key;
  }
  /**
   * Write a `<lang>.js` file containing translated strings for each supported language.
   *
   * @param context The build context.
   * @param dstDir The `strings` directory in the core package.
   * @param xlatLangs The set of languages that are configured for translation.
   */
  writeJsFiles(context, dstDir) {
    writeLangJsFiles(
      context,
      dstDir,
      this.records
      /*, xlatLangs*/
    );
  }
};
function getSortedRecords(records) {
  return Array.from(records.values()).sort((a, b) => {
    return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
  });
}
function checkInvisibleCharacters(s) {
  if (s.includes("\xA0")) {
    const e = s.replace(/\u00a0/g, "HERE");
    throw new Error(
      `String contains one or more non-breaking space characters (to fix, replace "HERE" with a normal space):
  ${e}`
    );
  }
}
function utf8SubscriptToHtml(key, s) {
  if (key.includes("graph_yaxis_label")) {
    s = s.replace(/₂/gi, "2");
    s = s.replace(/₃/gi, "3");
    s = s.replace(/₄/gi, "4");
    s = s.replace(/₆/gi, "6");
    return s;
  }
  s = s.replace(/₂/gi, "<sub>2</sub>");
  s = s.replace(/₃/gi, "<sub>3</sub>");
  s = s.replace(/₄/gi, "<sub>4</sub>");
  s = s.replace(/₆/gi, "<sub>6</sub>");
  s = s.replace(/<\/sub> /gi, "</sub>&nbsp;");
  return s;
}
function htmlSubscriptAndSuperscriptToUtf8(s) {
  s = s.replace(/<sub>(\d)<\/sub>/gi, (_match, p1) => String.fromCharCode(8320 + Number(p1)));
  s = s.replace(/<sup>6<\/sup>/gi, "\u2076");
  s = s.replace(/<sup>9<\/sup>/gi, "\u2079");
  return s;
}
function htmlToUtf8(orig) {
  let s = orig;
  s = htmlSubscriptAndSuperscriptToUtf8(s);
  let clean = sanitizeHtml(s, {
    allowedTags: ["a", "b", "br", "i", "em", "li", "p", "strong", "sub", "sup", "ul"],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    }
  });
  clean = clean.replace(/\u00a0/gi, "&nbsp;");
  return clean;
}
function genStringKey(prefix, s) {
  checkInvisibleCharacters(s);
  let key = s.toLowerCase();
  key = key.replace(/ – /g, "_");
  key = key.replace(/ \/ /g, "_per_");
  key = key.replace(/ /g, "_");
  key = key.replace("\u2082", "2");
  key = key.replace("<sub>2</sub>", "2");
  key = key.replace(/\$\//g, "dollars_per_");
  key = key.replace(/%\//g, "pct_per_");
  key = key.replace(/\//g, "_per_");
  key = key.replace(/º/g, "degrees_");
  key = key.replace(/\*/g, "_");
  key = key.replace(/%/g, "pct");
  key = key.replace(/\$/g, "dollars");
  key = key.replace(/&/g, "and");
  key = key.replace(/\//g, "per");
  key = key.replace(/:/g, "");
  key = key.replace(/\./g, "");
  key = key.replace(/-/g, "_");
  key = key.replace(/—/g, "_");
  key = key.replace(/–/g, "_");
  key = key.replace(/,/g, "");
  key = key.replace(/\(/g, "");
  key = key.replace(/\)/g, "");
  key = key.replace(/\\n/g, "");
  key = key.replace(/<br>/g, "_");
  return `${prefix}__${key}`;
}
function writeLangJsFiles(context, dstDir, records) {
  const xlatMap = /* @__PURE__ */ new Map();
  const sortedRecords = getSortedRecords(records);
  const enStrings = /* @__PURE__ */ new Map();
  for (const record of sortedRecords) {
    const s = record.str;
    enStrings.set(record.key, utf8SubscriptToHtml(record.key, s));
  }
  xlatMap.set("en", enStrings);
  for (const lang of xlatMap.keys()) {
    const stringsForLang = xlatMap.get(lang);
    const stringsObj = Object.fromEntries(stringsForLang);
    const json = JSON.stringify(stringsObj, null, 2);
    context.writeStagedFile("strings", dstDir, `${lang}.js`, `export default ${json}`);
  }
}

// src/context.ts
var ConfigContext = class {
  constructor(buildContext, configDir, strings, colorMap, modelOptions) {
    this.buildContext = buildContext;
    this.configDir = configDir;
    this.strings = strings;
    this.colorMap = colorMap;
    this.modelOptions = modelOptions;
    this.inputSpecs = /* @__PURE__ */ new Map();
    this.outputVarNames = /* @__PURE__ */ new Map();
    this.staticVarNames = /* @__PURE__ */ new Map();
  }
  /**
   * Read a CSV file of the given name from the config directory.
   *
   * @param name The base name of the CSV file.
   */
  readConfigCsvFile(name) {
    return readConfigCsvFile(this.configDir, name);
  }
  /**
   * Log a message to the console and/or the in-browser overlay panel.
   *
   * @param level The log level (verbose, info, error).
   * @param msg The message.
   */
  log(level, msg) {
    this.buildContext.log(level, msg);
  }
  /**
   * Format a (subscripted or non-subscripted) model variable name into a canonical
   * identifier (with special characters converted to underscore, and subscript/dimension
   * parts separated by commas).
   *
   * @param name The name of the variable in the source model, e.g., `Variable name[DimA, B2]`.
   * @returns The canonical identifier for the given name, e.g., `_variable_name[_dima,_b2]`.
   */
  canonicalVarId(name) {
    return this.buildContext.canonicalVarId(name);
  }
  /**
   * Write a file to the staged directory.
   *
   * This file will be copied (along with other staged files) into the destination
   * directory only after the build process has completed.  Copying all staged files
   * at once helps improve the local development experience by making it so that
   * live reloading tools only need to refresh once instead of every time a build
   * file is written.
   *
   * @param srcDir The directory underneath the configured `staged` directory where
   * the file will be written (this must be a relative path).
   * @param dstDir The absolute path to the destination directory where the staged
   * file will be copied when the build has completed.
   * @param filename The name of the file.
   * @param content The file content.
   */
  writeStagedFile(srcDir, dstDir, filename, content) {
    this.buildContext.writeStagedFile(srcDir, dstDir, filename, content);
  }
  addInputVariable(inputId, inputVarName, defaultValue, minValue, maxValue) {
    const varId = this.buildContext.canonicalVarId(inputVarName);
    if (this.inputSpecs.get(varId)) {
      console.error(`ERROR: Input variable ${inputVarName} was already added`);
    }
    this.inputSpecs.set(varId, {
      inputId,
      varName: inputVarName,
      defaultValue,
      minValue,
      maxValue
    });
  }
  addOutputVariable(outputVarName) {
    const varId = this.buildContext.canonicalVarId(outputVarName);
    this.outputVarNames.set(varId, outputVarName);
  }
  addStaticVariable(sourceName, varName) {
    const sourceVarNames = this.staticVarNames.get(sourceName);
    if (sourceVarNames) {
      sourceVarNames.add(varName);
    } else {
      const varNames = /* @__PURE__ */ new Set();
      varNames.add(varName);
      this.staticVarNames.set(sourceName, varNames);
    }
  }
  getHexColorForId(colorId) {
    return this.colorMap.get(colorId);
  }
  getOrderedInputs() {
    return Array.from(this.inputSpecs.values());
  }
  getOrderedOutputs() {
    const alphabetical = (a, b) => a > b ? 1 : b > a ? -1 : 0;
    const varNames = Array.from(this.outputVarNames.values()).sort(alphabetical);
    return varNames.map((varName) => {
      return {
        varName
      };
    });
  }
  writeStringsFiles(dstDir) {
    this.strings.writeJsFiles(
      this.buildContext,
      dstDir
      /*, xlatLangs*/
    );
  }
};
function createConfigContext(buildContext, configDir) {
  const modelCsv = readConfigCsvFile(configDir, "model")[0];
  const graphDefaultMinTime = Number(modelCsv["graph default min time"]);
  const graphDefaultMaxTime = Number(modelCsv["graph default max time"]);
  const datFilesString = modelCsv["model dat files"];
  const origDatFiles = datFilesString.length > 0 ? datFilesString.split(";") : [];
  const prepDir = buildContext.config.prepDir;
  const projDir = buildContext.config.rootDir;
  const datFiles = origDatFiles.map((f) => joinPath(relative(prepDir, projDir), f));
  const bundleListing = modelCsv["bundle listing"] === "true";
  const customLookups = modelCsv["custom lookups"] === "true";
  const customOutputs = modelCsv["custom outputs"] === "true";
  const modelOptions = {
    graphDefaultMinTime,
    graphDefaultMaxTime,
    datFiles,
    bundleListing,
    customLookups,
    customOutputs
  };
  const strings = readStringsCsv(configDir);
  const colorsCsv = readConfigCsvFile(configDir, "colors");
  const colors = /* @__PURE__ */ new Map();
  for (const row of colorsCsv) {
    const colorId = row["id"];
    const hexColor = row["hex code"];
    colors.set(colorId, hexColor);
  }
  return new ConfigContext(buildContext, configDir, strings, colors, modelOptions);
}
function configFilePath(configDir, name, ext) {
  return joinPath(configDir, `${name}.${ext}`);
}
function readCsvFile(path) {
  const data = readFileSync(path, "utf8");
  return parseCsv(data, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    skip_records_with_empty_values: true
  });
}
function readConfigCsvFile(configDir, name) {
  return readCsvFile(configFilePath(configDir, name, "csv"));
}
function readStringsCsv(configDir) {
  const strings = new Strings();
  const layout2 = "default";
  const context = "Core";
  const rows = readConfigCsvFile(configDir, "strings");
  for (const row of rows) {
    const key = row["id"];
    let str = row["string"];
    str = str ? str.trim() : "";
    if (str) {
      strings.add(key, str, layout2, context);
    }
  }
  return strings;
}

// src/gen-model-spec.ts
function writeModelSpec(context, dstDir) {
  const inputVarIds = context.getOrderedInputs().map((i) => context.canonicalVarId(i.varName));
  const outputVarIds = context.getOrderedOutputs().map((o) => context.canonicalVarId(o.varName));
  let tsContent = "";
  function emit(s) {
    tsContent += s + "\n";
  }
  emit("// This file is generated by `@sdeverywhere/plugin-config`; do not edit manually!");
  emit(`export const inputVarIds: string[] = ${JSON.stringify(inputVarIds, null, 2)}`);
  emit(`export const outputVarIds: string[] = ${JSON.stringify(outputVarIds, null, 2)}`);
  context.writeStagedFile("model", dstDir, "model-spec.ts", tsContent);
}

// src/gen-config-specs.ts
import { readFileSync as readFileSync2 } from "fs";
import { dirname, resolve as resolvePath } from "path";
import { fileURLToPath } from "url";

// src/read-config.ts
function optionalString(stringValue) {
  if (stringValue !== void 0 && stringValue.length > 0) {
    return stringValue;
  } else {
    return void 0;
  }
}
function optionalNumber(stringValue) {
  if (stringValue !== void 0 && stringValue.length > 0) {
    return Number(stringValue);
  } else {
    return void 0;
  }
}

// src/gen-graphs.ts
function generateGraphSpecs(context) {
  const graphsCsv = context.readConfigCsvFile("graphs");
  const graphSpecs = /* @__PURE__ */ new Map();
  for (const row of graphsCsv) {
    const spec = graphSpecFromCsv(row, context);
    if (spec) {
      graphSpecs.set(spec.id, spec);
    }
  }
  return graphSpecs;
}
function graphSpecFromCsv(g, context) {
  const strings = context.strings;
  const layout2 = "default";
  function requiredString(key2) {
    const value = g[key2];
    if (value === void 0 || typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Must specify '${key2}' for graph ${g.id}`);
    }
    return value;
  }
  const graphIdParts = requiredString("id").split(";");
  const graphId = graphIdParts[0];
  const graphIdBaseParts = graphId.split("-");
  const graphBaseId = graphIdBaseParts[0];
  const title = requiredString("graph title");
  const menuTitle = optionalString(g["menu title"]);
  const miniTitle = optionalString(g["mini title"]);
  const parentMenu = optionalString(g["parent menu"]);
  const description = optionalString(g["description"]);
  const kindString = optionalString(g["kind"]);
  const graphLayout = optionalString(g["graph layout"]) || "";
  const graphCategory = requiredString("graph category");
  const scenarioMode = optionalString(g["scenario mode"]) || "";
  const classification = optionalString(g["classification"]) || "";
  const levels = optionalString(g["levels"]) || "";
  const scenarioDisplay = optionalString(g["scenario display"]) || "";
  const scale = optionalString(g["scale"]) || "";
  const extensiveDescription = optionalString(g["extensive description"]) || "";
  if (!parentMenu) {
    context.log("info", `Skipping graph ${graphId} (${title})`);
    return void 0;
  }
  const key = (kind2) => `graph_${graphBaseId.padStart(3, "0")}_${kind2}`;
  const strCtxt = (kind2) => {
    const parent = htmlToUtf8(parentMenu).replace("&amp;", "&");
    const displayTitle = htmlToUtf8(menuTitle || title).replace("&amp;", "&");
    return `Graph ${kind2}: ${parent} > ${displayTitle}`;
  };
  const titleKey = strings.add(key("title"), title, layout2, strCtxt("Title"));
  let menuTitleKey;
  if (menuTitle) {
    menuTitleKey = strings.add(key("menu_title"), menuTitle, layout2, strCtxt("Menu Item"));
  }
  let miniTitleKey;
  if (miniTitle) {
    miniTitleKey = strings.add(key("mini_title"), miniTitle, layout2, strCtxt("Title (for Mini View)"));
  }
  let descriptionKey;
  if (description) {
    descriptionKey = strings.add(key("description"), description, layout2, strCtxt("Description"), "graph-descriptions");
  }
  const kind = kindString;
  const sideString = optionalString(g["side"]);
  const side = sideString;
  const unitsString = optionalString(g["units"]);
  const altIdString = optionalString(g["alternate"]);
  let unitSystem;
  let alternates;
  if (unitsString && altIdString) {
    if (unitsString === "metric") {
      unitSystem = "metric";
      alternates = [
        {
          id: altIdString,
          unitSystem: "us"
        }
      ];
    } else if (unitsString === "us") {
      unitSystem = "us";
      alternates = [
        {
          id: altIdString,
          unitSystem: "metric"
        }
      ];
    }
  }
  const modelOptions = context.modelOptions;
  const xMin = optionalNumber(g["x axis min"]) || modelOptions.graphDefaultMinTime;
  const xMax = optionalNumber(g["x axis max"]) || modelOptions.graphDefaultMaxTime;
  const xAxisLabel = optionalString(g["x axis label"]);
  let xAxisLabelKey;
  if (xAxisLabel) {
    xAxisLabelKey = strings.add(genStringKey("graph_xaxis_label", xAxisLabel), xAxisLabel, layout2, "Graph X-Axis Label");
  }
  const yMin = optionalNumber(g["y axis min"]) || 0;
  const yMax = optionalNumber(g["y axis max"]);
  const ySoftMax = optionalNumber(g["y axis soft max"]);
  const yFormat = optionalString(g["y axis format"]) || ".0f";
  const yAxisLabel = optionalString(g["y axis label"]);
  let yAxisLabelKey;
  if (yAxisLabel) {
    yAxisLabelKey = strings.add(genStringKey("graph_yaxis_label", yAxisLabel), yAxisLabel, layout2, "Graph Y-Axis Label");
  }
  const datasets = [];
  function addDataset(index, overrides) {
    const plotKey = (name) => `plot ${index} ${name}`;
    const varName = g[plotKey("variable")];
    if (!varName) {
      return;
    }
    const varId = context.canonicalVarId(varName);
    const externalSourceName = overrides?.sourceName || optionalString(g[plotKey("source")]);
    const datasetLabel = optionalString(g[plotKey("label")]);
    let labelKey;
    if (datasetLabel) {
      labelKey = strings.add(
        genStringKey("graph_dataset_label", datasetLabel),
        datasetLabel,
        layout2,
        "Graph Dataset Label"
      );
    }
    const colorId = overrides?.colorId || requiredString(plotKey("color"));
    const hexColor = context.getHexColorForId(colorId);
    if (!hexColor) {
      throw new Error(`Graph ${graphId} references an unknown color ${colorId}`);
    }
    const lineStyleAndModString = optionalString(g[plotKey("style")]) || "line";
    const lineStyleParts = lineStyleAndModString.split(";");
    const lineStyleString = lineStyleParts[0];
    const lineStyleModifierString = lineStyleParts.length > 1 ? lineStyleParts[1] : void 0;
    const lineStyle = lineStyleString;
    let lineStyleModifiers;
    if (lineStyleModifierString) {
      lineStyleModifiers = [lineStyleModifierString];
    }
    if (externalSourceName === void 0 || externalSourceName.startsWith("Scenario") || externalSourceName === "Ref") {
      context.addOutputVariable(varName);
    } else {
      context.addStaticVariable(externalSourceName, varName);
    }
    const datasetSpec = {
      varId,
      varName,
      externalSourceName,
      labelKey,
      color: hexColor,
      lineStyle,
      lineStyleModifiers
    };
    datasets.push(datasetSpec);
  }
  for (let i = 1; i <= 11; i++) {
    addDataset(i);
  }
  const legendItems = datasets.filter((dataset) => dataset.labelKey?.length > 0).map((dataset) => {
    return {
      color: dataset.color,
      labelKey: dataset.labelKey
    };
  });
  const graphSpec = {
    id: graphId,
    kind,
    titleKey,
    miniTitleKey,
    menuTitleKey,
    descriptionKey,
    side,
    unitSystem,
    alternates,
    xMin,
    xMax,
    xAxisLabelKey,
    yMin,
    yMax,
    ySoftMax,
    yAxisLabelKey,
    yFormat,
    datasets,
    legendItems,
    graphCategory,
    graphLayout,
    scenarioMode,
    classification,
    levels,
    scenarioDisplay,
    scale,
    extensiveDescription
  };
  return graphSpec;
}

// src/gen-inputs.ts
var layout = "default";
function generateInputsConfig(context) {
  const inputsCsv = context.readConfigCsvFile("inputs");
  const inputSpecs = /* @__PURE__ */ new Map();
  for (const row of inputsCsv) {
    const spec = inputSpecFromCsv(row, context);
    if (spec) {
      inputSpecs.set(spec.id, spec);
    }
  }
  return inputSpecs;
}
function inputSpecFromCsv(r, context) {
  const strings = context.strings;
  function requiredString(key2) {
    const value = r[key2];
    if (value === void 0 || typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Must specify '${key2}' for input ${r.id}`);
    }
    return value;
  }
  function requiredNumber(key2) {
    const stringValue = requiredString(key2);
    const numValue = Number(stringValue);
    if (numValue === void 0) {
      throw new Error(`Must specify numeric '${key2}' for input ${r.id}`);
    }
    return numValue;
  }
  const inputIdParts = requiredString("id").split(";");
  const inputId = inputIdParts[0];
  const viewId = optionalString(r["viewid"]);
  const label = optionalString(r["label"]) || "";
  const inputType = requiredString("input type");
  if (!viewId) {
    context.log("info", `Skipping input ${inputId} (${label})`);
    return void 0;
  }
  const description = optionalString(r["description"]);
  const hoverDescription = optionalString(r["hover description"]);
  const viewLevel = optionalString(r["view level"]) || "";
  const categoryId = requiredString("categoryid");
  const inputGroup = optionalString(r["input group"]) || "";
  const secondaryType = optionalString(r["secondary type"]) || "";
  const secondLabel = optionalString(r["second label"]) || "";
  const muiIcon = optionalString(r["mui icon"]) || "";
  const isSegmented = optionalString(r["segmented"]) || "";
  const extensiveDescription = optionalString(r["extensive description"]) || "";
  const key = (kind) => `input_${inputId.padStart(3, "0")}_${kind}`;
  const groupTitle = optionalString(r["group name"]);
  if (!groupTitle) {
    throw new Error(`Must specify 'group name' for input ${inputId}`);
  }
  const groupTitleKey = genStringKey("input_group_title", groupTitle);
  strings.add(groupTitleKey, groupTitle, layout, "Input Group Title");
  let typeLabel;
  switch (inputType) {
    case "slider":
      typeLabel = "Slider";
      break;
    case "switch":
      typeLabel = "Switch";
      break;
    case "checkbox":
      typeLabel = "Checkbox";
      break;
    case "checkbox group":
      typeLabel = "Checkbox Group";
      break;
    default:
      throw new Error(`Unexpected input type ${inputType}`);
  }
  const strCtxt = (kind) => {
    const labelText = htmlToUtf8(label).replace("&amp;", "&");
    return `${typeLabel} ${kind}: ${groupTitle} > ${labelText}`;
  };
  const labelKey = strings.add(key("label"), label, layout, strCtxt("Label"));
  const listingLabel = optionalString(r["listing label"]);
  let listingLabelKey;
  if (listingLabel) {
    listingLabelKey = strings.add(key("action_label"), listingLabel, layout, strCtxt("Action Label"));
  }
  let descriptionKey;
  if (description) {
    descriptionKey = strings.add(key("description"), description, layout, strCtxt("Description"), "input-descriptions");
  }
  function sliderSpecFromCsv() {
    const varName = requiredString("varname");
    const varId = context.canonicalVarId(varName);
    const defaultValue = requiredNumber("slider/switch default");
    const minValue = requiredNumber("slider min");
    const maxValue = requiredNumber("slider max");
    const step = requiredNumber("slider step");
    const reversed = optionalString(r["reversed"]) === "yes";
    if (defaultValue < minValue || defaultValue > maxValue) {
      let e = `Default value for slider ${inputId} is out of range: `;
      e += `default=${defaultValue} min=${minValue} max=${maxValue}`;
      throw new Error(e);
    }
    context.addInputVariable(inputId, varName, defaultValue, minValue, maxValue);
    const format = optionalString(r["format"]) || ".0f";
    const units = optionalString(r["units"]);
    let unitsKey;
    if (units) {
      unitsKey = strings.add(genStringKey("input_units", units), units, layout, "Slider Units");
    }
    const rangeInfo = getSliderRangeInfo(r, maxValue, context);
    const rangeLabelKeys = rangeInfo.labelKeys;
    const rangeDividers = rangeInfo.dividers;
    return {
      kind: "slider",
      id: inputId,
      varId,
      varName,
      defaultValue,
      minValue,
      maxValue,
      step,
      reversed,
      labelKey,
      listingLabelKey,
      descriptionKey,
      unitsKey,
      rangeLabelKeys,
      rangeDividers,
      format,
      viewLevel,
      viewId,
      categoryId,
      inputGroup,
      secondaryType,
      hoverDescription,
      extensiveDescription,
      isSegmented,
      muiIcon
    };
  }
  function switchSpecFromCsv() {
    const varName = requiredString("varname");
    const varId = context.canonicalVarId(varName);
    const onValue = requiredNumber("enabled value");
    const offValue = requiredNumber("disabled value");
    const defaultValue = requiredNumber("slider/switch default");
    if (defaultValue !== onValue && defaultValue !== offValue) {
      throw new Error(
        `Invalid default value for switch ${inputId}: off=${offValue} on=${onValue} default=${defaultValue}`
      );
    }
    const minValue = Math.min(offValue, onValue);
    const maxValue = Math.max(offValue, onValue);
    context.addInputVariable(inputId, varName, defaultValue, minValue, maxValue);
    const controlledInputIds = requiredString("controlled input ids");
    const controlledParts = controlledInputIds.split("|");
    const rowsActiveWhenOff = controlledParts[0].split(";").filter((id) => id.trim().length > 0);
    const rowsActiveWhenOn = controlledParts[1].split(";").filter((id) => id.trim().length > 0);
    return {
      kind: "switch",
      id: inputId,
      varId,
      varName,
      labelKey,
      listingLabelKey,
      descriptionKey,
      defaultValue,
      offValue,
      onValue,
      slidersActiveWhenOff: rowsActiveWhenOff,
      slidersActiveWhenOn: rowsActiveWhenOn,
      viewLevel,
      viewId,
      categoryId,
      inputGroup,
      secondaryType,
      hoverDescription,
      secondLabel,
      extensiveDescription
    };
  }
  let inputSpec;
  switch (inputType) {
    case "slider": {
      inputSpec = sliderSpecFromCsv();
      break;
    }
    case "switch":
    case "checkbox": {
      inputSpec = switchSpecFromCsv();
      break;
    }
    case "checkbox group":
      break;
    default:
      throw new Error(`Unexpected input type ${inputType}`);
  }
  return inputSpec;
}
function getSliderRangeInfo(r, maxValue, context) {
  const strings = context.strings;
  const labelKeys = [];
  const dividers = [];
  let rangeNum = 1;
  while (rangeNum <= 10) {
    const label = optionalString(r[`range ${rangeNum} label`]);
    if (!label) {
      break;
    }
    const labelKey = strings.add(genStringKey("input_range", label), label, layout, "Slider Range Label");
    if (!labelKey) {
      break;
    }
    labelKeys.push(labelKey);
    rangeNum++;
  }
  const numRanges = rangeNum - 1;
  for (rangeNum = 1; rangeNum <= numRanges; rangeNum++) {
    let divider = optionalNumber(r[`range ${rangeNum} start`]);
    if (divider === void 0) {
      // If the first-range start is missing, skip it so we keep
      // legacy behavior where `rangeDividers` contains starts for
      // ranges 2..N. For later ranges, fall back to maxValue.
      if (rangeNum === 1) {
        continue;
      }
      divider = maxValue;
    }
    dividers.push(divider);
  }
  return {
    labelKeys,
    dividers
  };
}

// src/gen-config-specs.ts
var __dirname2 = dirname(fileURLToPath(import.meta.url));
function generateConfigSpecs(context) {
  context.log("verbose", "  Reading graph specs");
  const graphSpecs = generateGraphSpecs(context);
  context.log("verbose", "  Reading input specs");
  const inputSpecs = generateInputsConfig(context);
  context.log("verbose", "  Reading extra output variables");
  const extraOutputsCsv = context.readConfigCsvFile("outputs");
  for (const row of extraOutputsCsv) {
    const varName = row["variable name"];
    if (varName) {
      context.addOutputVariable(varName);
    }
  }
  return {
    graphSpecs,
    inputSpecs
  };
}
function writeConfigSpecs(context, config, dstDir) {
  let tsContent = "";
  function emit(s) {
    tsContent += s + "\n";
  }
  emit("// This file is generated by `@sdeverywhere/plugin-config`; do not edit manually!");
  emit("");
  emit(`import type { GraphSpec, InputSpec } from './spec-types'`);
  function emitArray(type, values) {
    const varName = type.charAt(0).toLowerCase() + type.slice(1) + "s";
    const array = Array.from(values);
    const json = JSON.stringify(array, null, 2);
    emit("");
    emit(`export const ${varName}: ${type}[] = ${json}`);
  }
  emitArray("GraphSpec", config.graphSpecs.values());
  emitArray("InputSpec", config.inputSpecs.values());
  context.writeStagedFile("config", dstDir, "config-specs.ts", tsContent);
}
function writeSpecTypes(context, dstDir) {
  const tsFile = "spec-types.ts";
  const tsPath = resolvePath(__dirname2, tsFile);
  const tsContent = readFileSync2(tsPath, "utf8");
  context.writeStagedFile("config", dstDir, tsFile, tsContent);
}

// src/processor.ts
function configProcessor(options) {
  return (buildContext) => {
    return processModelConfig(buildContext, options);
  };
}
async function processModelConfig(buildContext, options) {
  const t0 = performance.now();
  if (!existsSync(options.config)) {
    throw new Error(`The provided config dir '${options.config}' does not exist`);
  }
  let outModelSpecsDir;
  if (options.out) {
    if (typeof options.out === "string") {
      outModelSpecsDir = joinPath2(options.out, "src", "model", "generated");
    } else {
      outModelSpecsDir = options.out.modelSpecsDir;
    }
  }
  let outConfigSpecsDir;
  if (options.out) {
    if (typeof options.out === "string") {
      outConfigSpecsDir = joinPath2(options.out, "src", "config", "generated");
    } else {
      outConfigSpecsDir = options.out.configSpecsDir;
    }
  }
  let outStringsDir;
  if (options.out) {
    if (typeof options.out === "string") {
      outStringsDir = joinPath2(options.out, "strings");
    } else {
      outStringsDir = options.out.stringsDir;
    }
  }
  const context = createConfigContext(buildContext, options.config);
  const modelOptions = context.modelOptions;
  context.log("info", "Generating files...");
  const configSpecs = generateConfigSpecs(context);
  if (outConfigSpecsDir) {
    context.log("verbose", "  Writing config specs");
    writeConfigSpecs(context, configSpecs, outConfigSpecsDir);
    writeSpecTypes(context, outConfigSpecsDir);
  }
  if (outModelSpecsDir) {
    context.log("verbose", "  Writing model specs");
    writeModelSpec(context, outModelSpecsDir);
  }
  if (outStringsDir) {
    context.log("verbose", "  Writing strings");
    context.writeStringsFiles(outStringsDir);
  }
  const t1 = performance.now();
  const elapsed = ((t1 - t0) / 1e3).toFixed(1);
  context.log("info", `Done generating files (${elapsed}s)`);
  return {
    inputs: context.getOrderedInputs(),
    outputs: context.getOrderedOutputs(),
    datFiles: modelOptions.datFiles,
    bundleListing: modelOptions.bundleListing,
    customLookups: modelOptions.customLookups,
    customOutputs: modelOptions.customOutputs,
    options: options.spec
  };
}
export {
  configProcessor
};
//# sourceMappingURL=index.js.map