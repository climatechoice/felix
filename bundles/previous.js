import * as worker_threads from "worker_threads";
import { EventEmitter } from "events";
import { cpus } from "os";
import * as path from "path";
import { fileURLToPath } from "url";
let __non_webpack_require__ = () => worker_threads;
const DefaultErrorSerializer = {
  deserialize(A) {
    return Object.assign(Error(A.message), {
      name: A.name,
      stack: A.stack
    });
  },
  serialize(A) {
    return {
      __error_marker: "$$error",
      message: A.message,
      name: A.name,
      stack: A.stack
    };
  }
}, isSerializedError = (A) => A && typeof A == "object" && "__error_marker" in A && A.__error_marker === "$$error", DefaultSerializer = {
  deserialize(A) {
    return isSerializedError(A) ? DefaultErrorSerializer.deserialize(A) : A;
  },
  serialize(A) {
    return A instanceof Error ? DefaultErrorSerializer.serialize(A) : A;
  }
};
let registeredSerializer = DefaultSerializer;
function deserialize(A) {
  return registeredSerializer.deserialize(A);
}
function serialize(A) {
  return registeredSerializer.serialize(A);
}
let bundleURL;
function getBundleURLCached() {
  return bundleURL || (bundleURL = getBundleURL()), bundleURL;
}
function getBundleURL() {
  try {
    throw new Error();
  } catch (A) {
    const e = ("" + A.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
    if (e)
      return getBaseURL(e[0]);
  }
  return "/";
}
function getBaseURL(A) {
  return ("" + A).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, "$1") + "/";
}
const isAbsoluteURL = (A) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(A);
function createSourceBlobURL(A) {
  const e = new Blob([A], { type: "application/javascript" });
  return URL.createObjectURL(e);
}
function selectWorkerImplementation$1() {
  if (typeof Worker > "u")
    return class {
      constructor() {
        throw Error("No web worker implementation available. You might have tried to spawn a worker within a worker in a browser that doesn't support workers in workers.");
      }
    };
  class A extends Worker {
    constructor(o, i) {
      var Q, B;
      typeof o == "string" && i && i._baseURL ? o = new URL(o, i._baseURL) : typeof o == "string" && !isAbsoluteURL(o) && getBundleURLCached().match(/^file:\/\//i) && (o = new URL(o, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((Q = i?.CORSWorkaround) !== null && Q !== void 0) || Q) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`))), typeof o == "string" && isAbsoluteURL(o) && (!((B = i?.CORSWorkaround) !== null && B !== void 0) || B) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`)), super(o, i);
    }
  }
  class e extends A {
    constructor(o, i) {
      const Q = window.URL.createObjectURL(o);
      super(Q, i);
    }
    static fromText(o, i) {
      const Q = new window.Blob([o], { type: "text/javascript" });
      return new e(Q, i);
    }
  }
  return {
    blob: e,
    default: A
  };
}
let implementation$3;
function getWorkerImplementation$2() {
  return implementation$3 || (implementation$3 = selectWorkerImplementation$1()), implementation$3;
}
const BrowserImplementation = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getWorkerImplementation: getWorkerImplementation$2
}, Symbol.toStringTag, { value: "Module" })), getCallsites = {};
let tsNodeAvailable;
cpus().length;
function detectTsNode() {
  if (typeof __non_webpack_require__ == "function")
    return !1;
  if (tsNodeAvailable)
    return tsNodeAvailable;
  try {
    eval("require").resolve("ts-node"), tsNodeAvailable = !0;
  } catch (A) {
    if (A && A.code === "MODULE_NOT_FOUND")
      tsNodeAvailable = !1;
    else
      throw A;
  }
  return tsNodeAvailable;
}
function createTsNodeModule(A) {
  return `
    require("ts-node/register/transpile-only");
    require(${JSON.stringify(A)});
  `;
}
function rebaseScriptPath(A, e) {
  const r = getCallsites().find((B) => {
    const s = B.getFileName();
    return !!(s && !s.match(e) && !s.match(/[\/\\]master[\/\\]implementation/) && !s.match(/^internal\/process/));
  }), o = r ? r.getFileName() : null;
  let i = o || null;
  return i && i.startsWith("file:") && (i = fileURLToPath(i)), i ? path.join(path.dirname(i), A) : A;
}
function resolveScriptPath(scriptPath, baseURL) {
  const makeRelative = (filePath) => path.isAbsolute(filePath) ? filePath : path.join(baseURL || eval("__dirname"), filePath), workerFilePath = typeof __non_webpack_require__ == "function" ? __non_webpack_require__.resolve(makeRelative(scriptPath)) : eval("require").resolve(makeRelative(rebaseScriptPath(scriptPath, /[\/\\]worker_threads[\/\\]/)));
  return workerFilePath;
}
function initWorkerThreadsWorker() {
  const NativeWorker = typeof __non_webpack_require__ == "function" ? __non_webpack_require__("worker_threads").Worker : eval("require")("worker_threads").Worker;
  let allWorkers = [];
  class Worker extends NativeWorker {
    constructor(e, r) {
      const o = r && r.fromSource ? null : resolveScriptPath(e, (r || {})._baseURL);
      if (o)
        o.match(/\.tsx?$/i) && detectTsNode() ? super(createTsNodeModule(o), Object.assign(Object.assign({}, r), { eval: !0 })) : o.match(/\.asar[\/\\]/) ? super(o.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), r) : super(o, r);
      else {
        const i = e;
        super(i, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(e, r) {
      const o = (i) => {
        r({ data: i });
      };
      this.mappedEventListeners.set(r, o), this.on(e, o);
    }
    removeEventListener(e, r) {
      const o = this.mappedEventListeners.get(r) || r;
      this.off(e, o);
    }
  }
  const terminateWorkersAndMaster = () => {
    Promise.all(allWorkers.map((A) => A.terminate())).then(() => process.exit(0), () => process.exit(1)), allWorkers = [];
  };
  process.on("SIGINT", () => terminateWorkersAndMaster()), process.on("SIGTERM", () => terminateWorkersAndMaster());
  class BlobWorker extends Worker {
    constructor(e, r) {
      super(Buffer.from(e).toString("utf-8"), Object.assign(Object.assign({}, r), { fromSource: !0 }));
    }
    static fromText(e, r) {
      return new Worker(e, Object.assign(Object.assign({}, r), { fromSource: !0 }));
    }
  }
  return {
    blob: BlobWorker,
    default: Worker
  };
}
function initTinyWorker() {
  const A = require("tiny-worker");
  let e = [];
  class r extends A {
    constructor(B, s) {
      const w = s && s.fromSource ? null : process.platform === "win32" ? `file:///${resolveScriptPath(B).replace(/\\/g, "/")}` : resolveScriptPath(B);
      if (w)
        w.match(/\.tsx?$/i) && detectTsNode() ? super(new Function(createTsNodeModule(resolveScriptPath(B))), [], { esm: !0 }) : w.match(/\.asar[\/\\]/) ? super(w.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), [], { esm: !0 }) : super(w, [], { esm: !0 });
      else {
        const a = B;
        super(new Function(a), [], { esm: !0 });
      }
      e.push(this), this.emitter = new EventEmitter(), this.onerror = (a) => this.emitter.emit("error", a), this.onmessage = (a) => this.emitter.emit("message", a);
    }
    addEventListener(B, s) {
      this.emitter.addListener(B, s);
    }
    removeEventListener(B, s) {
      this.emitter.removeListener(B, s);
    }
    terminate() {
      return e = e.filter((B) => B !== this), super.terminate();
    }
  }
  const o = () => {
    Promise.all(e.map((Q) => Q.terminate())).then(() => process.exit(0), () => process.exit(1)), e = [];
  };
  process.on("SIGINT", () => o()), process.on("SIGTERM", () => o());
  class i extends r {
    constructor(B, s) {
      super(Buffer.from(B).toString("utf-8"), Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
    static fromText(B, s) {
      return new r(B, Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
  }
  return {
    blob: i,
    default: r
  };
}
let implementation$2, isTinyWorker;
function selectWorkerImplementation() {
  try {
    return isTinyWorker = !1, initWorkerThreadsWorker();
  } catch {
    return console.debug("Node worker_threads not available. Trying to fall back to tiny-worker polyfill..."), isTinyWorker = !0, initTinyWorker();
  }
}
function getWorkerImplementation$1() {
  return implementation$2 || (implementation$2 = selectWorkerImplementation()), implementation$2;
}
const NodeImplementation = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getWorkerImplementation: getWorkerImplementation$1
}, Symbol.toStringTag, { value: "Module" })), runningInNode$1 = typeof process < "u" && process.arch !== "browser" && "pid" in process, implementation$1 = runningInNode$1 ? NodeImplementation : BrowserImplementation, getWorkerImplementation = implementation$1.getWorkerImplementation;
function getDefaultExportFromCjs(A) {
  return A && A.__esModule && Object.prototype.hasOwnProperty.call(A, "default") ? A.default : A;
}
var browser = { exports: {} }, ms, hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var A = 1e3, e = A * 60, r = e * 60, o = r * 24, i = o * 7, Q = o * 365.25;
  ms = function(n, E) {
    E = E || {};
    var l = typeof n;
    if (l === "string" && n.length > 0)
      return B(n);
    if (l === "number" && isFinite(n))
      return E.long ? w(n) : s(n);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(n)
    );
  };
  function B(n) {
    if (n = String(n), !(n.length > 100)) {
      var E = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        n
      );
      if (E) {
        var l = parseFloat(E[1]), f = (E[2] || "ms").toLowerCase();
        switch (f) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return l * Q;
          case "weeks":
          case "week":
          case "w":
            return l * i;
          case "days":
          case "day":
          case "d":
            return l * o;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return l * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return l * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return l * A;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return l;
          default:
            return;
        }
      }
    }
  }
  function s(n) {
    var E = Math.abs(n);
    return E >= o ? Math.round(n / o) + "d" : E >= r ? Math.round(n / r) + "h" : E >= e ? Math.round(n / e) + "m" : E >= A ? Math.round(n / A) + "s" : n + "ms";
  }
  function w(n) {
    var E = Math.abs(n);
    return E >= o ? a(n, E, o, "day") : E >= r ? a(n, E, r, "hour") : E >= e ? a(n, E, e, "minute") : E >= A ? a(n, E, A, "second") : n + " ms";
  }
  function a(n, E, l, f) {
    var h = E >= l * 1.5;
    return Math.round(n / l) + " " + f + (h ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function A(e) {
    o.debug = o, o.default = o, o.coerce = a, o.disable = s, o.enable = Q, o.enabled = w, o.humanize = requireMs(), o.destroy = n, Object.keys(e).forEach((E) => {
      o[E] = e[E];
    }), o.names = [], o.skips = [], o.formatters = {};
    function r(E) {
      let l = 0;
      for (let f = 0; f < E.length; f++)
        l = (l << 5) - l + E.charCodeAt(f), l |= 0;
      return o.colors[Math.abs(l) % o.colors.length];
    }
    o.selectColor = r;
    function o(E) {
      let l, f = null, h, D;
      function g(...C) {
        if (!g.enabled)
          return;
        const t = g, I = Number(/* @__PURE__ */ new Date()), c = I - (l || I);
        t.diff = c, t.prev = l, t.curr = I, l = I, C[0] = o.coerce(C[0]), typeof C[0] != "string" && C.unshift("%O");
        let d = 0;
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (m, p) => {
          if (m === "%%")
            return "%";
          d++;
          const O = o.formatters[p];
          if (typeof O == "function") {
            const j = C[d];
            m = O.call(t, j), C.splice(d, 1), d--;
          }
          return m;
        }), o.formatArgs.call(t, C), (t.log || o.log).apply(t, C);
      }
      return g.namespace = E, g.useColors = o.useColors(), g.color = o.selectColor(E), g.extend = i, g.destroy = o.destroy, Object.defineProperty(g, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (h !== o.namespaces && (h = o.namespaces, D = o.enabled(E)), D),
        set: (C) => {
          f = C;
        }
      }), typeof o.init == "function" && o.init(g), g;
    }
    function i(E, l) {
      const f = o(this.namespace + (typeof l > "u" ? ":" : l) + E);
      return f.log = this.log, f;
    }
    function Q(E) {
      o.save(E), o.namespaces = E, o.names = [], o.skips = [];
      const l = (typeof E == "string" ? E : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? o.skips.push(f.slice(1)) : o.names.push(f);
    }
    function B(E, l) {
      let f = 0, h = 0, D = -1, g = 0;
      for (; f < E.length; )
        if (h < l.length && (l[h] === E[f] || l[h] === "*"))
          l[h] === "*" ? (D = h, g = f, h++) : (f++, h++);
        else if (D !== -1)
          h = D + 1, g++, f = g;
        else
          return !1;
      for (; h < l.length && l[h] === "*"; )
        h++;
      return h === l.length;
    }
    function s() {
      const E = [
        ...o.names,
        ...o.skips.map((l) => "-" + l)
      ].join(",");
      return o.enable(""), E;
    }
    function w(E) {
      for (const l of o.skips)
        if (B(E, l))
          return !1;
      for (const l of o.names)
        if (B(E, l))
          return !0;
      return !1;
    }
    function a(E) {
      return E instanceof Error ? E.stack || E.message : E;
    }
    function n() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return o.enable(o.load()), o;
  }
  return common = A, common;
}
var hasRequiredBrowser;
function requireBrowser() {
  return hasRequiredBrowser || (hasRequiredBrowser = 1, (function(A, e) {
    e.formatArgs = o, e.save = i, e.load = Q, e.useColors = r, e.storage = B(), e.destroy = /* @__PURE__ */ (() => {
      let w = !1;
      return () => {
        w || (w = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let w;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (w = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(w[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function o(w) {
      if (w[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + w[0] + (this.useColors ? "%c " : " ") + "+" + A.exports.humanize(this.diff), !this.useColors)
        return;
      const a = "color: " + this.color;
      w.splice(1, 0, a, "color: inherit");
      let n = 0, E = 0;
      w[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (n++, l === "%c" && (E = n));
      }), w.splice(E, 0, a);
    }
    e.log = console.debug || console.log || (() => {
    });
    function i(w) {
      try {
        w ? e.storage.setItem("debug", w) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function Q() {
      let w;
      try {
        w = e.storage.getItem("debug");
      } catch {
      }
      return !w && typeof process < "u" && "env" in process && (w = process.env.DEBUG), w;
    }
    function B() {
      try {
        return localStorage;
      } catch {
      }
    }
    A.exports = requireCommon()(e);
    const { formatters: s } = A.exports;
    s.j = function(w) {
      try {
        return JSON.stringify(w);
      } catch (a) {
        return "[UnexpectedJSONParseError]: " + a.message;
      }
    };
  })(browser, browser.exports)), browser.exports;
}
var browserExports = requireBrowser();
const DebugLogger = /* @__PURE__ */ getDefaultExportFromCjs(browserExports), hasSymbols = () => typeof Symbol == "function", hasSymbol = (A) => hasSymbols() && !!Symbol[A], getSymbol = (A) => hasSymbol(A) ? Symbol[A] : "@@" + A;
hasSymbol("asyncIterator") || (Symbol.asyncIterator = Symbol.asyncIterator || /* @__PURE__ */ Symbol.for("Symbol.asyncIterator"));
const SymbolIterator = getSymbol("iterator"), SymbolObservable = getSymbol("observable"), SymbolSpecies = getSymbol("species");
function getMethod(A, e) {
  const r = A[e];
  if (r != null) {
    if (typeof r != "function")
      throw new TypeError(r + " is not a function");
    return r;
  }
}
function getSpecies(A) {
  let e = A.constructor;
  return e !== void 0 && (e = e[SymbolSpecies], e === null && (e = void 0)), e !== void 0 ? e : Observable;
}
function isObservable(A) {
  return A instanceof Observable;
}
function hostReportError(A) {
  hostReportError.log ? hostReportError.log(A) : setTimeout(() => {
    throw A;
  }, 0);
}
function enqueue(A) {
  Promise.resolve().then(() => {
    try {
      A();
    } catch (e) {
      hostReportError(e);
    }
  });
}
function cleanupSubscription(A) {
  const e = A._cleanup;
  if (e !== void 0 && (A._cleanup = void 0, !!e))
    try {
      if (typeof e == "function")
        e();
      else {
        const r = getMethod(e, "unsubscribe");
        r && r.call(e);
      }
    } catch (r) {
      hostReportError(r);
    }
}
function closeSubscription(A) {
  A._observer = void 0, A._queue = void 0, A._state = "closed";
}
function flushSubscription(A) {
  const e = A._queue;
  if (e) {
    A._queue = void 0, A._state = "ready";
    for (const r of e)
      if (notifySubscription(A, r.type, r.value), A._state === "closed")
        break;
  }
}
function notifySubscription(A, e, r) {
  A._state = "running";
  const o = A._observer;
  try {
    const i = o ? getMethod(o, e) : void 0;
    switch (e) {
      case "next":
        i && i.call(o, r);
        break;
      case "error":
        if (closeSubscription(A), i)
          i.call(o, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(A), i && i.call(o);
        break;
    }
  } catch (i) {
    hostReportError(i);
  }
  A._state === "closed" ? cleanupSubscription(A) : A._state === "running" && (A._state = "ready");
}
function onNotify(A, e, r) {
  if (A._state !== "closed") {
    if (A._state === "buffering") {
      A._queue = A._queue || [], A._queue.push({ type: e, value: r });
      return;
    }
    if (A._state !== "ready") {
      A._state = "buffering", A._queue = [{ type: e, value: r }], enqueue(() => flushSubscription(A));
      return;
    }
    notifySubscription(A, e, r);
  }
}
class Subscription {
  constructor(e, r) {
    this._cleanup = void 0, this._observer = e, this._queue = void 0, this._state = "initializing";
    const o = new SubscriptionObserver(this);
    try {
      this._cleanup = r.call(void 0, o);
    } catch (i) {
      o.error(i);
    }
    this._state === "initializing" && (this._state = "ready");
  }
  get closed() {
    return this._state === "closed";
  }
  unsubscribe() {
    this._state !== "closed" && (closeSubscription(this), cleanupSubscription(this));
  }
}
class SubscriptionObserver {
  constructor(e) {
    this._subscription = e;
  }
  get closed() {
    return this._subscription._state === "closed";
  }
  next(e) {
    onNotify(this._subscription, "next", e);
  }
  error(e) {
    onNotify(this._subscription, "error", e);
  }
  complete() {
    onNotify(this._subscription, "complete");
  }
}
class Observable {
  constructor(e) {
    if (!(this instanceof Observable))
      throw new TypeError("Observable cannot be called as a function");
    if (typeof e != "function")
      throw new TypeError("Observable initializer must be a function");
    this._subscriber = e;
  }
  subscribe(e, r, o) {
    return (typeof e != "object" || e === null) && (e = {
      next: e,
      error: r,
      complete: o
    }), new Subscription(e, this._subscriber);
  }
  pipe(e, ...r) {
    let o = this;
    for (const i of [e, ...r])
      o = i(o);
    return o;
  }
  tap(e, r, o) {
    const i = typeof e != "object" || e === null ? {
      next: e,
      error: r,
      complete: o
    } : e;
    return new Observable((Q) => this.subscribe({
      next(B) {
        i.next && i.next(B), Q.next(B);
      },
      error(B) {
        i.error && i.error(B), Q.error(B);
      },
      complete() {
        i.complete && i.complete(), Q.complete();
      },
      start(B) {
        i.start && i.start(B);
      }
    }));
  }
  forEach(e) {
    return new Promise((r, o) => {
      if (typeof e != "function") {
        o(new TypeError(e + " is not a function"));
        return;
      }
      function i() {
        Q.unsubscribe(), r(void 0);
      }
      const Q = this.subscribe({
        next(B) {
          try {
            e(B, i);
          } catch (s) {
            o(s), Q.unsubscribe();
          }
        },
        error(B) {
          o(B);
        },
        complete() {
          r(void 0);
        }
      });
    });
  }
  map(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((o) => this.subscribe({
      next(i) {
        let Q = i;
        try {
          Q = e(i);
        } catch (B) {
          return o.error(B);
        }
        o.next(Q);
      },
      error(i) {
        o.error(i);
      },
      complete() {
        o.complete();
      }
    }));
  }
  filter(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((o) => this.subscribe({
      next(i) {
        try {
          if (!e(i))
            return;
        } catch (Q) {
          return o.error(Q);
        }
        o.next(i);
      },
      error(i) {
        o.error(i);
      },
      complete() {
        o.complete();
      }
    }));
  }
  reduce(e, r) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const o = getSpecies(this), i = arguments.length > 1;
    let Q = !1, B = r;
    return new o((s) => this.subscribe({
      next(w) {
        const a = !Q;
        if (Q = !0, !a || i)
          try {
            B = e(B, w);
          } catch (n) {
            return s.error(n);
          }
        else
          B = w;
      },
      error(w) {
        s.error(w);
      },
      complete() {
        if (!Q && !i)
          return s.error(new TypeError("Cannot reduce an empty sequence"));
        s.next(B), s.complete();
      }
    }));
  }
  concat(...e) {
    const r = getSpecies(this);
    return new r((o) => {
      let i, Q = 0;
      function B(s) {
        i = s.subscribe({
          next(w) {
            o.next(w);
          },
          error(w) {
            o.error(w);
          },
          complete() {
            Q === e.length ? (i = void 0, o.complete()) : B(r.from(e[Q++]));
          }
        });
      }
      return B(this), () => {
        i && (i.unsubscribe(), i = void 0);
      };
    });
  }
  flatMap(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((o) => {
      const i = [], Q = this.subscribe({
        next(s) {
          let w;
          if (e)
            try {
              w = e(s);
            } catch (n) {
              return o.error(n);
            }
          else
            w = s;
          const a = r.from(w).subscribe({
            next(n) {
              o.next(n);
            },
            error(n) {
              o.error(n);
            },
            complete() {
              const n = i.indexOf(a);
              n >= 0 && i.splice(n, 1), B();
            }
          });
          i.push(a);
        },
        error(s) {
          o.error(s);
        },
        complete() {
          B();
        }
      });
      function B() {
        Q.closed && i.length === 0 && o.complete();
      }
      return () => {
        i.forEach((s) => s.unsubscribe()), Q.unsubscribe();
      };
    });
  }
  [SymbolObservable]() {
    return this;
  }
  static from(e) {
    const r = typeof this == "function" ? this : Observable;
    if (e == null)
      throw new TypeError(e + " is not an object");
    const o = getMethod(e, SymbolObservable);
    if (o) {
      const i = o.call(e);
      if (Object(i) !== i)
        throw new TypeError(i + " is not an object");
      return isObservable(i) && i.constructor === r ? i : new r((Q) => i.subscribe(Q));
    }
    if (hasSymbol("iterator")) {
      const i = getMethod(e, SymbolIterator);
      if (i)
        return new r((Q) => {
          enqueue(() => {
            if (!Q.closed) {
              for (const B of i.call(e))
                if (Q.next(B), Q.closed)
                  return;
              Q.complete();
            }
          });
        });
    }
    if (Array.isArray(e))
      return new r((i) => {
        enqueue(() => {
          if (!i.closed) {
            for (const Q of e)
              if (i.next(Q), i.closed)
                return;
            i.complete();
          }
        });
      });
    throw new TypeError(e + " is not observable");
  }
  static of(...e) {
    const r = typeof this == "function" ? this : Observable;
    return new r((o) => {
      enqueue(() => {
        if (!o.closed) {
          for (const i of e)
            if (o.next(i), o.closed)
              return;
          o.complete();
        }
      });
    });
  }
  static get [SymbolSpecies]() {
    return this;
  }
}
hasSymbols() && Object.defineProperty(Observable, /* @__PURE__ */ Symbol("extensions"), {
  value: {
    symbol: SymbolObservable,
    hostReportError
  },
  configurable: !0
});
function unsubscribe(A) {
  typeof A == "function" ? A() : A && typeof A.unsubscribe == "function" && A.unsubscribe();
}
class MulticastSubject extends Observable {
  constructor() {
    super((e) => (this._observers.add(e), () => this._observers.delete(e))), this._observers = /* @__PURE__ */ new Set();
  }
  next(e) {
    for (const r of this._observers)
      r.next(e);
  }
  error(e) {
    for (const r of this._observers)
      r.error(e);
  }
  complete() {
    for (const e of this._observers)
      e.complete();
  }
}
function multicast(A) {
  const e = new MulticastSubject();
  let r, o = 0;
  return new Observable((i) => {
    r || (r = A.subscribe(e));
    const Q = e.subscribe(i);
    return o++, () => {
      o--, Q.unsubscribe(), o === 0 && (unsubscribe(r), r = void 0);
    };
  });
}
const $errors = /* @__PURE__ */ Symbol("thread.errors"), $events = /* @__PURE__ */ Symbol("thread.events"), $terminate = /* @__PURE__ */ Symbol("thread.terminate"), $transferable = /* @__PURE__ */ Symbol("thread.transferable"), $worker = /* @__PURE__ */ Symbol("thread.worker");
function fail$1(A) {
  throw Error(A);
}
const Thread = {
  /** Return an observable that can be used to subscribe to all errors happening in the thread. */
  errors(A) {
    return A[$errors] || fail$1("Error observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
  },
  /** Return an observable that can be used to subscribe to internal events happening in the thread. Useful for debugging. */
  events(A) {
    return A[$events] || fail$1("Events observable not found. Make sure to pass a thread instance as returned by the spawn() promise.");
  },
  /** Terminate a thread. Remember to terminate every thread when you are done using it. */
  terminate(A) {
    return A[$terminate]();
  }
}, doNothing$1 = () => {
};
function createPromiseWithResolver() {
  let A = !1, e, r = doNothing$1;
  return [new Promise((Q) => {
    A ? Q(e) : r = Q;
  }), (Q) => {
    A = !0, e = Q, r(e);
  }];
}
var WorkerEventType;
(function(A) {
  A.internalError = "internalError", A.message = "message", A.termination = "termination";
})(WorkerEventType || (WorkerEventType = {}));
const doNothing = () => {
}, returnInput = (A) => A, runDeferred = (A) => Promise.resolve().then(A);
function fail(A) {
  throw A;
}
function isThenable(A) {
  return A && typeof A.then == "function";
}
class ObservablePromise extends Observable {
  constructor(e) {
    super((r) => {
      const o = this, i = Object.assign(Object.assign({}, r), {
        complete() {
          r.complete(), o.onCompletion();
        },
        error(Q) {
          r.error(Q), o.onError(Q);
        },
        next(Q) {
          r.next(Q), o.onNext(Q);
        }
      });
      try {
        return this.initHasRun = !0, e(i);
      } catch (Q) {
        i.error(Q);
      }
    }), this.initHasRun = !1, this.fulfillmentCallbacks = [], this.rejectionCallbacks = [], this.firstValueSet = !1, this.state = "pending";
  }
  onNext(e) {
    this.firstValueSet || (this.firstValue = e, this.firstValueSet = !0);
  }
  onError(e) {
    this.state = "rejected", this.rejection = e;
    for (const r of this.rejectionCallbacks)
      runDeferred(() => r(e));
  }
  onCompletion() {
    this.state = "fulfilled";
    for (const e of this.fulfillmentCallbacks)
      runDeferred(() => e(this.firstValue));
  }
  then(e, r) {
    const o = e || returnInput, i = r || fail;
    let Q = !1;
    return new Promise((B, s) => {
      const w = (n) => {
        if (!Q) {
          Q = !0;
          try {
            B(i(n));
          } catch (E) {
            s(E);
          }
        }
      }, a = (n) => {
        try {
          B(o(n));
        } catch (E) {
          w(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: w }), this.state === "fulfilled")
        return B(o(this.firstValue));
      if (this.state === "rejected")
        return Q = !0, B(i(this.rejection));
      this.fulfillmentCallbacks.push(a), this.rejectionCallbacks.push(w);
    });
  }
  catch(e) {
    return this.then(void 0, e);
  }
  finally(e) {
    const r = e || doNothing;
    return this.then((o) => (r(), o), () => r());
  }
  static from(e) {
    return isThenable(e) ? new ObservablePromise((r) => {
      const o = (Q) => {
        r.next(Q), r.complete();
      }, i = (Q) => {
        r.error(Q);
      };
      e.then(o, i);
    }) : super.from(e);
  }
}
function isTransferable(A) {
  return !(!A || typeof A != "object");
}
function isTransferDescriptor(A) {
  return A && typeof A == "object" && A[$transferable];
}
function Transfer(A, e) {
  if (!e) {
    if (!isTransferable(A))
      throw Error();
    e = [A];
  }
  return {
    [$transferable]: !0,
    send: A,
    transferables: e
  };
}
var MasterMessageType;
(function(A) {
  A.cancel = "cancel", A.run = "run";
})(MasterMessageType || (MasterMessageType = {}));
var WorkerMessageType;
(function(A) {
  A.error = "error", A.init = "init", A.result = "result", A.running = "running", A.uncaughtError = "uncaughtError";
})(WorkerMessageType || (WorkerMessageType = {}));
const debugMessages$1 = DebugLogger("threads:master:messages");
let nextJobUID = 1;
const dedupe = (A) => Array.from(new Set(A)), isJobErrorMessage = (A) => A && A.type === WorkerMessageType.error, isJobResultMessage = (A) => A && A.type === WorkerMessageType.result, isJobStartMessage = (A) => A && A.type === WorkerMessageType.running;
function createObservableForJob(A, e) {
  return new Observable((r) => {
    let o;
    const i = ((Q) => {
      if (debugMessages$1("Message from worker:", Q.data), !(!Q.data || Q.data.uid !== e)) {
        if (isJobStartMessage(Q.data))
          o = Q.data.resultType;
        else if (isJobResultMessage(Q.data))
          o === "promise" ? (typeof Q.data.payload < "u" && r.next(deserialize(Q.data.payload)), r.complete(), A.removeEventListener("message", i)) : (Q.data.payload && r.next(deserialize(Q.data.payload)), Q.data.complete && (r.complete(), A.removeEventListener("message", i)));
        else if (isJobErrorMessage(Q.data)) {
          const B = deserialize(Q.data.error);
          r.error(B), A.removeEventListener("message", i);
        }
      }
    });
    return A.addEventListener("message", i), () => {
      if (o === "observable" || !o) {
        const Q = {
          type: MasterMessageType.cancel,
          uid: e
        };
        A.postMessage(Q);
      }
      A.removeEventListener("message", i);
    };
  });
}
function prepareArguments(A) {
  if (A.length === 0)
    return {
      args: [],
      transferables: []
    };
  const e = [], r = [];
  for (const o of A)
    isTransferDescriptor(o) ? (e.push(serialize(o.send)), r.push(...o.transferables)) : e.push(serialize(o));
  return {
    args: e,
    transferables: r.length === 0 ? r : dedupe(r)
  };
}
function createProxyFunction(A, e) {
  return ((...r) => {
    const o = nextJobUID++, { args: i, transferables: Q } = prepareArguments(r), B = {
      type: MasterMessageType.run,
      uid: o,
      method: e,
      args: i
    };
    debugMessages$1("Sending command to run function to worker:", B);
    try {
      A.postMessage(B, Q);
    } catch (s) {
      return ObservablePromise.from(Promise.reject(s));
    }
    return ObservablePromise.from(multicast(createObservableForJob(A, o)));
  });
}
function createProxyModule(A, e) {
  const r = {};
  for (const o of e)
    r[o] = createProxyFunction(A, o);
  return r;
}
var __awaiter$2 = function(A, e, r, o) {
  function i(Q) {
    return Q instanceof r ? Q : new r(function(B) {
      B(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, B) {
    function s(n) {
      try {
        a(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      try {
        a(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      n.done ? Q(n.value) : i(n.value).then(s, w);
    }
    a((o = o.apply(A, e || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (A) => A && A.type === "init", isUncaughtErrorMessage = (A) => A && A.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(A, e, r) {
  return __awaiter$2(this, void 0, void 0, function* () {
    let o;
    const i = new Promise((B, s) => {
      o = setTimeout(() => s(Error(r)), e);
    }), Q = yield Promise.race([
      A,
      i
    ]);
    return clearTimeout(o), Q;
  });
}
function receiveInitMessage(A) {
  return new Promise((e, r) => {
    const o = ((i) => {
      debugMessages("Message from worker before finishing initialization:", i.data), isInitMessage(i.data) ? (A.removeEventListener("message", o), e(i.data)) : isUncaughtErrorMessage(i.data) && (A.removeEventListener("message", o), r(deserialize(i.data.error)));
    });
    A.addEventListener("message", o);
  });
}
function createEventObservable(A, e) {
  return new Observable((r) => {
    const o = ((Q) => {
      const B = {
        type: WorkerEventType.message,
        data: Q.data
      };
      r.next(B);
    }), i = ((Q) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", Q);
      const B = {
        type: WorkerEventType.internalError,
        error: Error(Q.reason)
      };
      r.next(B);
    });
    A.addEventListener("message", o), A.addEventListener("unhandledrejection", i), e.then(() => {
      const Q = {
        type: WorkerEventType.termination
      };
      A.removeEventListener("message", o), A.removeEventListener("unhandledrejection", i), r.next(Q), r.complete();
    });
  });
}
function createTerminator(A) {
  const [e, r] = createPromiseWithResolver();
  return { terminate: () => __awaiter$2(this, void 0, void 0, function* () {
    debugThreadUtils("Terminating worker"), yield A.terminate(), r();
  }), termination: e };
}
function setPrivateThreadProps(A, e, r, o) {
  const i = r.filter((Q) => Q.type === WorkerEventType.internalError).map((Q) => Q.error);
  return Object.assign(A, {
    [$errors]: i,
    [$events]: r,
    [$terminate]: o,
    [$worker]: e
  });
}
function spawn(A, e) {
  return __awaiter$2(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, i = (yield withTimeout(receiveInitMessage(A), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: Q, terminate: B } = createTerminator(A), s = createEventObservable(A, Q);
    if (i.type === "function") {
      const w = createProxyFunction(A);
      return setPrivateThreadProps(w, A, s, B);
    } else if (i.type === "module") {
      const w = createProxyModule(A, i.methods);
      return setPrivateThreadProps(w, A, s, B);
    } else {
      const w = i.type;
      throw Error(`Worker init message states unexpected type of expose(): ${w}`);
    }
  });
}
const BlobWorker = getWorkerImplementation().blob, Worker$1 = getWorkerImplementation().default, isWorkerRuntime$2 = function A() {
  const e = typeof self < "u" && typeof Window < "u" && self instanceof Window;
  return !!(typeof self < "u" && self.postMessage && !e);
}, postMessageToMaster$2 = function A(e, r) {
  self.postMessage(e, r);
}, subscribeToMasterMessages$2 = function A(e) {
  const r = (i) => {
    e(i.data);
  }, o = () => {
    self.removeEventListener("message", r);
  };
  return self.addEventListener("message", r), o;
}, WebWorkerImplementation = {
  isWorkerRuntime: isWorkerRuntime$2,
  postMessageToMaster: postMessageToMaster$2,
  subscribeToMasterMessages: subscribeToMasterMessages$2
};
typeof self > "u" && (global.self = global);
const isWorkerRuntime$1 = function A() {
  return !!(typeof self < "u" && self.postMessage);
}, postMessageToMaster$1 = function A(e) {
  self.postMessage(e);
};
let muxingHandlerSetUp = !1;
const messageHandlers = /* @__PURE__ */ new Set(), subscribeToMasterMessages$1 = function A(e) {
  return muxingHandlerSetUp || (self.addEventListener("message", ((o) => {
    messageHandlers.forEach((i) => i(o.data));
  })), muxingHandlerSetUp = !0), messageHandlers.add(e), () => messageHandlers.delete(e);
}, TinyWorkerImplementation = {
  isWorkerRuntime: isWorkerRuntime$1,
  postMessageToMaster: postMessageToMaster$1,
  subscribeToMasterMessages: subscribeToMasterMessages$1
};
let implementation;
function selectImplementation() {
  return typeof __non_webpack_require__ == "function" ? __non_webpack_require__("worker_threads") : eval("require")("worker_threads");
}
function getImplementation() {
  return implementation || (implementation = selectImplementation()), implementation;
}
function assertMessagePort(A) {
  if (!A)
    throw Error("Invariant violation: MessagePort to parent is not available.");
  return A;
}
const isWorkerRuntime = function A() {
  return !getImplementation().isMainThread;
}, postMessageToMaster = function A(e, r) {
  assertMessagePort(getImplementation().parentPort).postMessage(e, r);
}, subscribeToMasterMessages = function A(e) {
  const r = getImplementation().parentPort;
  if (!r)
    throw Error("Invariant violation: MessagePort to parent is not available.");
  const o = (Q) => {
    e(Q);
  }, i = () => {
    assertMessagePort(r).off("message", o);
  };
  return assertMessagePort(r).on("message", o), i;
};
function testImplementation() {
  getImplementation();
}
const WorkerThreadsImplementation = {
  isWorkerRuntime,
  postMessageToMaster,
  subscribeToMasterMessages,
  testImplementation
}, runningInNode = typeof process < "u" && process.arch !== "browser" && "pid" in process;
function selectNodeImplementation() {
  try {
    return WorkerThreadsImplementation.testImplementation(), WorkerThreadsImplementation;
  } catch {
    return TinyWorkerImplementation;
  }
}
const Implementation = runningInNode ? selectNodeImplementation() : WebWorkerImplementation;
Implementation.isWorkerRuntime;
function postUncaughtErrorMessage(A) {
  try {
    const e = {
      type: WorkerMessageType.uncaughtError,
      error: serialize(A)
    };
    Implementation.postMessageToMaster(e);
  } catch (e) {
    console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.
Latest error:`, e, `
Original error:`, A);
  }
}
typeof self < "u" && typeof self.addEventListener == "function" && Implementation.isWorkerRuntime() && (self.addEventListener("error", (A) => {
  setTimeout(() => postUncaughtErrorMessage(A.error || A), 250);
}), self.addEventListener("unhandledrejection", (A) => {
  const e = A.reason;
  e && typeof e.message == "string" && setTimeout(() => postUncaughtErrorMessage(e), 250);
}));
typeof process < "u" && typeof process.on == "function" && Implementation.isWorkerRuntime() && (process.on("uncaughtException", (A) => {
  setTimeout(() => postUncaughtErrorMessage(A), 250);
}), process.on("unhandledRejection", (A) => {
  A && typeof A.message == "string" && setTimeout(() => postUncaughtErrorMessage(A), 250);
}));
var ok$1 = function(A) {
  return new Ok$1(A);
}, err$1 = function(A) {
  return new Err$1(A);
}, Ok$1 = (
  /** @class */
  (function() {
    function A(e) {
      var r = this;
      this.value = e, this.match = function(o, i) {
        return o(r.value);
      };
    }
    return A.prototype.isOk = function() {
      return !0;
    }, A.prototype.isErr = function() {
      return !this.isOk();
    }, A.prototype.map = function(e) {
      return ok$1(e(this.value));
    }, A.prototype.mapErr = function(e) {
      return ok$1(this.value);
    }, A.prototype.andThen = function(e) {
      return e(this.value);
    }, A.prototype.asyncAndThen = function(e) {
      return e(this.value);
    }, A.prototype.asyncMap = function(e) {
      return ResultAsync$1.fromPromise(e(this.value));
    }, A.prototype.unwrapOr = function(e) {
      return this.value;
    }, A.prototype._unsafeUnwrap = function() {
      return this.value;
    }, A.prototype._unsafeUnwrapErr = function() {
      throw new Error("Called `_unsafeUnwrapErr` on an Ok");
    }, A;
  })()
), Err$1 = (
  /** @class */
  (function() {
    function A(e) {
      var r = this;
      this.error = e, this.match = function(o, i) {
        return i(r.error);
      };
    }
    return A.prototype.isOk = function() {
      return !1;
    }, A.prototype.isErr = function() {
      return !this.isOk();
    }, A.prototype.map = function(e) {
      return err$1(this.error);
    }, A.prototype.mapErr = function(e) {
      return err$1(e(this.error));
    }, A.prototype.andThen = function(e) {
      return err$1(this.error);
    }, A.prototype.asyncAndThen = function(e) {
      return errAsync$1(this.error);
    }, A.prototype.asyncMap = function(e) {
      return errAsync$1(this.error);
    }, A.prototype.unwrapOr = function(e) {
      return e;
    }, A.prototype._unsafeUnwrap = function() {
      throw new Error("Called `_unsafeUnwrap` on an Err");
    }, A.prototype._unsafeUnwrapErr = function() {
      return this.error;
    }, A;
  })()
);
function __awaiter$1(A, e, r, o) {
  function i(Q) {
    return Q instanceof r ? Q : new r(function(B) {
      B(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, B) {
    function s(n) {
      try {
        a(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      try {
        a(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      n.done ? Q(n.value) : i(n.value).then(s, w);
    }
    a((o = o.apply(A, [])).next());
  });
}
function __generator$1(A, e) {
  var r = { label: 0, sent: function() {
    if (Q[0] & 1) throw Q[1];
    return Q[1];
  }, trys: [], ops: [] }, o, i, Q, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(a) {
    return function(n) {
      return w([a, n]);
    };
  }
  function w(a) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = a[0] & 2 ? i.return : a[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, a[1])).done) return Q;
      switch (i = 0, Q && (a = [a[0] & 2, Q.value]), a[0]) {
        case 0:
        case 1:
          Q = a;
          break;
        case 4:
          return r.label++, { value: a[1], done: !1 };
        case 5:
          r.label++, i = a[1], a = [0];
          continue;
        case 7:
          a = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (a[0] === 6 || a[0] === 2)) {
            r = 0;
            continue;
          }
          if (a[0] === 3 && (!Q || a[1] > Q[0] && a[1] < Q[3])) {
            r.label = a[1];
            break;
          }
          if (a[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = a;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(a);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      a = e.call(A, r);
    } catch (n) {
      a = [6, n], i = 0;
    } finally {
      o = Q = 0;
    }
    if (a[0] & 5) throw a[1];
    return { value: a[0] ? a[1] : void 0, done: !0 };
  }
}
var logWarning = function(A) {
  if (typeof process != "object" || process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
    var e = "\x1B[33m%s\x1B[0m", r = ["[neverthrow]", A].join(" - ");
    console.warn(e, r);
  }
}, ResultAsync$1 = (
  /** @class */
  (function() {
    function A(e) {
      this._promise = e;
    }
    return A.fromPromise = function(e, r) {
      var o = e.then(function(Q) {
        return new Ok$1(Q);
      });
      if (r)
        o = o.catch(function(Q) {
          return new Err$1(r(Q));
        });
      else {
        var i = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(i);
      }
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isErr() ? [2, new Err$1(o.error)] : (i = Ok$1.bind, [4, e(o.value)]);
              case 1:
                return [2, new (i.apply(Ok$1, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isOk() ? [2, new Ok$1(o.value)] : (i = Err$1.bind, [4, e(o.error)]);
              case 1:
                return [2, new (i.apply(Err$1, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.andThen = function(e) {
      return new A(this._promise.then(function(r) {
        if (r.isErr())
          return new Err$1(r.error);
        var o = e(r.value);
        return o instanceof A ? o._promise : o;
      }));
    }, A.prototype.match = function(e, r) {
      return this._promise.then(function(o) {
        return o.match(e, r);
      });
    }, A.prototype.unwrapOr = function(e) {
      return this._promise.then(function(r) {
        return r.unwrapOr(e);
      });
    }, A.prototype.then = function(e) {
      return this._promise.then(e);
    }, A;
  })()
), errAsync$1 = function(A) {
  return new ResultAsync$1(Promise.resolve(new Err$1(A)));
}, __defProp = Object.defineProperty, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (A, e, r) => e in A ? __defProp(A, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : A[e] = r, __spreadValues = (A, e) => {
  for (var r in e || (e = {}))
    __hasOwnProp.call(e, r) && __defNormalProp(A, r, e[r]);
  if (__getOwnPropSymbols)
    for (var r of __getOwnPropSymbols(e))
      __propIsEnum.call(e, r) && __defNormalProp(A, r, e[r]);
  return A;
};
function createInputValue(A, e, r) {
  let o = e;
  const i = {}, Q = () => o, B = (w) => {
    var a;
    w !== o && (o = w, (a = i.onSet) == null || a.call(i));
  };
  return { varId: A, get: Q, set: B, reset: () => {
    B(e);
  }, callbacks: i };
}
var Series = class nA {
  /**
   * @param varId The ID for the output variable (as used by SDEverywhere).
   * @param points The data points for the variable, one point per time increment.
   */
  constructor(e, r) {
    this.varId = e, this.points = r;
  }
  /**
   * Return the Y value at the given time.  Note that this does not attempt to interpolate
   * if there is no data point defined for the given time and will return undefined in
   * that case.
   *
   * @param time The x (time) value.
   * @return The y value for the given time, or undefined if there is no data point defined
   * for the given time.
   */
  getValueAtTime(e) {
    var r;
    return (r = this.points.find((o) => o.x === e)) == null ? void 0 : r.y;
  }
  /**
   * Create a new `Series` instance that is a copy of this one.
   */
  copy() {
    const e = this.points.map((r) => __spreadValues({}, r));
    return new nA(this.varId, e);
  }
}, Outputs = class {
  /**
   * @param varIds The output variable identifiers.
   * @param startTime The start time for the model.
   * @param endTime The end time for the model.
   * @param saveFreq The frequency with which output values are saved (aka `SAVEPER`).
   */
  constructor(A, e, r, o = 1) {
    this.varIds = A, this.startTime = e, this.endTime = r, this.saveFreq = o, this.seriesLength = Math.round((r - e) / o) + 1, this.varSeries = new Array(A.length);
    for (let i = 0; i < A.length; i++) {
      const Q = new Array(this.seriesLength);
      for (let s = 0; s < this.seriesLength; s++)
        Q[s] = { x: e + s * o, y: 0 };
      const B = A[i];
      this.varSeries[i] = new Series(B, Q);
    }
  }
  /**
   * The optional set of specs that dictate which variables from the model will be
   * stored in this `Outputs` instance.  If undefined, the default set of outputs
   * will be stored (as configured in `varIds`).
   * @hidden This is not yet part of the public API; it is exposed here for use
   * in experimental testing tools.
   */
  setVarSpecs(A) {
    if (A.length !== this.varIds.length)
      throw new Error("Length of output varSpecs must match that of varIds");
    this.varSpecs = A;
  }
  /**
   * Parse the given raw float buffer (produced by the model) and store the values
   * into this `Outputs` instance.
   *
   * Note that the length of `outputsBuffer` must be greater than or equal to
   * the capacity of this `Outputs` instance.  The `Outputs` instance is allowed
   * to be smaller to support the case where you want to extract a subset of
   * the time range in the buffer produced by the model.
   *
   * @param outputsBuffer The raw outputs buffer produced by the model.
   * @param rowLength The number of elements per row (one element per save point).
   * @return An `ok` result if the buffer is valid, otherwise an `err` result.
   */
  updateFromBuffer(A, e) {
    const r = parseOutputsBuffer(A, e, this);
    return r.isOk() ? ok$1(void 0) : err$1(r.error);
  }
  /**
   * Return the series for the given output variable.
   *
   * @param varId The ID of the output variable (as used by SDEverywhere).
   */
  getSeriesForVar(A) {
    const e = this.varIds.indexOf(A);
    if (e >= 0)
      return this.varSeries[e];
  }
};
function parseOutputsBuffer(A, e, r) {
  const o = r.varIds.length, i = r.seriesLength;
  if (e < i || A.length < o * i)
    return err$1("invalid-point-count");
  for (let Q = 0; Q < o; Q++) {
    const B = r.varSeries[Q];
    let s = e * Q;
    for (let w = 0; w < i; w++)
      B.points[w].y = validateNumber(A[s]), s++;
  }
  return ok$1(r);
}
function validateNumber(A) {
  if (!isNaN(A) && A > -1e32)
    return A;
}
function getEncodedVarIndicesLength(A) {
  var e;
  let r = 1;
  for (const o of A) {
    r += 2;
    const i = ((e = o.subscriptIndices) == null ? void 0 : e.length) || 0;
    r += i;
  }
  return r;
}
function encodeVarIndices(A, e) {
  let r = 0;
  e[r++] = A.length;
  for (const o of A) {
    e[r++] = o.varIndex;
    const i = o.subscriptIndices, Q = i?.length || 0;
    e[r++] = Q;
    for (let B = 0; B < Q; B++)
      e[r++] = i[B];
  }
}
function getEncodedLookupBufferLengths(A) {
  var e, r;
  let o = 1, i = 0;
  for (const Q of A) {
    const B = Q.varRef.varSpec;
    if (B === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    o += 2;
    const s = ((e = B.subscriptIndices) == null ? void 0 : e.length) || 0;
    o += s, o += 2, i += ((r = Q.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: o,
    lookupsLength: i
  };
}
function encodeLookups(A, e, r) {
  let o = 0;
  e[o++] = A.length;
  let i = 0;
  for (const Q of A) {
    const B = Q.varRef.varSpec;
    e[o++] = B.varIndex;
    const s = B.subscriptIndices, w = s?.length || 0;
    e[o++] = w;
    for (let a = 0; a < w; a++)
      e[o++] = s[a];
    Q.points !== void 0 ? (e[o++] = i, e[o++] = Q.points.length, r?.set(Q.points, i), i += Q.points.length) : (e[o++] = -1, e[o++] = 0);
  }
}
function decodeLookups(A, e) {
  const r = [];
  let o = 0;
  const i = A[o++];
  for (let Q = 0; Q < i; Q++) {
    const B = A[o++], s = A[o++], w = s > 0 ? Array(s) : void 0;
    for (let f = 0; f < s; f++)
      w[f] = A[o++];
    const a = A[o++], n = A[o++], E = {
      varIndex: B,
      subscriptIndices: w
    };
    let l;
    a >= 0 ? e ? l = e.slice(a, a + n) : l = new Float64Array(0) : l = void 0, r.push({
      varRef: {
        varSpec: E
      },
      points: l
    });
  }
  return r;
}
var ModelListing = class {
  constructor(A) {
    this.varSpecs = /* @__PURE__ */ new Map();
    const e = /* @__PURE__ */ new Map();
    for (const i of A.dimensions) {
      const Q = i.id, B = [];
      for (let s = 0; s < i.subIds.length; s++)
        B.push({
          id: i.subIds[s],
          index: s
        });
      e.set(Q, {
        id: Q,
        subscripts: B
      });
    }
    function r(i) {
      const Q = e.get(i);
      if (Q === void 0)
        throw new Error(`No dimension info found for id=${i}`);
      return Q;
    }
    const o = /* @__PURE__ */ new Set();
    for (const i of A.variables) {
      const Q = varIdWithoutSubscripts(i.id);
      if (!o.has(Q)) {
        const s = (i.dimIds || []).map(r);
        if (s.length > 0) {
          const w = [];
          for (const n of s)
            w.push(n.subscripts);
          const a = cartesianProductOf(w);
          for (const n of a) {
            const E = n.map((h) => h.id).join(","), l = n.map((h) => h.index), f = `${Q}[${E}]`;
            this.varSpecs.set(f, {
              varIndex: i.index,
              subscriptIndices: l
            });
          }
        } else
          this.varSpecs.set(Q, {
            varIndex: i.index
          });
        o.add(Q);
      }
    }
  }
  /**
   * Return the `VarSpec` for the given variable ID, or undefined if there is no spec defined
   * in the listing for that variable.
   */
  getSpecForVarId(A) {
    return this.varSpecs.get(A);
  }
  /**
   * Return the `VarSpec` for the given variable name, or undefined if there is no spec defined
   * in the listing for that variable.
   */
  getSpecForVarName(A) {
    const e = sdeVarIdForVensimVarName(A);
    return this.varSpecs.get(e);
  }
  /**
   * Create a new `Outputs` instance that uses the same start/end years as the given "normal"
   * `Outputs` instance but is prepared for reading the specified internal variables from the model.
   *
   * @param normalOutputs The `Outputs` that is used to access normal output variables from the model.
   * @param varIds The variable IDs to include with the new `Outputs` instance.
   */
  deriveOutputs(A, e) {
    const r = [];
    for (const i of e) {
      const Q = this.varSpecs.get(i);
      Q !== void 0 ? r.push(Q) : console.warn(`WARNING: No output var spec found for id=${i}`);
    }
    const o = new Outputs(e, A.startTime, A.endTime, A.saveFreq);
    return o.varSpecs = r, o;
  }
};
function varIdWithoutSubscripts(A) {
  const e = A.indexOf("[");
  return e >= 0 ? A.substring(0, e) : A;
}
function cartesianProductOf(A) {
  return A.reduce(
    (e, r) => e.map((o) => r.map((i) => o.concat([i]))).reduce((o, i) => o.concat(i), []),
    [[]]
  );
}
function sdeVarIdForVensimName(A) {
  return "_" + A.trim().replace(/"/g, "_").replace(/\s+!$/g, "!").replace(/\s/g, "_").replace(/,/g, "_").replace(/-/g, "_").replace(/\./g, "_").replace(/\$/g, "_").replace(/'/g, "_").replace(/&/g, "_").replace(/%/g, "_").replace(/\//g, "_").replace(/\|/g, "_").toLowerCase();
}
function sdeVarIdForVensimVarName(A) {
  const e = A.match(/([^[]+)(?:\[([^\]]+)\])?/);
  if (!e)
    throw new Error(`Invalid Vensim name: ${A}`);
  let r = sdeVarIdForVensimName(e[1]);
  if (e[2]) {
    const o = e[2].split(",").map((i) => sdeVarIdForVensimName(i));
    r += `[${o.join(",")}]`;
  }
  return r;
}
function resolveVarRef(A, e, r) {
  if (!e.varSpec) {
    if (A === void 0)
      throw new Error(
        `Unable to resolve ${r} variable references by name or identifier when model listing is unavailable`
      );
    if (e.varId) {
      const o = A?.getSpecForVarId(e.varId);
      if (o)
        e.varSpec = o;
      else
        throw new Error(`Failed to resolve ${r} variable reference for varId=${e.varId}`);
    } else {
      const o = A?.getSpecForVarName(e.varName);
      if (o)
        e.varSpec = o;
      else
        throw new Error(`Failed to resolve ${r} variable reference for varName='${e.varId}'`);
    }
  }
}
var headerLengthInElements = 16, extrasLengthInElements = 1, Int32Section = class {
  constructor() {
    this.offsetInBytes = 0, this.lengthInElements = 0;
  }
  update(A, e, r) {
    this.view = r > 0 ? new Int32Array(A, e, r) : void 0, this.offsetInBytes = e, this.lengthInElements = r;
  }
}, Float64Section = class {
  constructor() {
    this.offsetInBytes = 0, this.lengthInElements = 0;
  }
  update(A, e, r) {
    this.view = r > 0 ? new Float64Array(A, e, r) : void 0, this.offsetInBytes = e, this.lengthInElements = r;
  }
}, BufferedRunModelParams = class {
  /**
   * @param listing The model listing that is used to locate a variable that is referenced by
   * name or identifier.  If undefined, variables cannot be referenced by name or identifier,
   * and can only be referenced using a valid `VarSpec`.
   */
  constructor(A) {
    this.listing = A, this.header = new Int32Section(), this.extras = new Float64Section(), this.inputs = new Float64Section(), this.outputs = new Float64Section(), this.outputIndices = new Int32Section(), this.lookups = new Float64Section(), this.lookupIndices = new Int32Section();
  }
  /**
   * Return the encoded buffer from this instance, which can be passed to `updateFromEncodedBuffer`.
   */
  getEncodedBuffer() {
    return this.encoded;
  }
  // from RunModelParams interface
  getInputs() {
    return this.inputs.view;
  }
  // from RunModelParams interface
  copyInputs(A, e) {
    this.inputs.lengthInElements !== 0 && ((A === void 0 || A.length < this.inputs.lengthInElements) && (A = e(this.inputs.lengthInElements)), A.set(this.inputs.view));
  }
  // from RunModelParams interface
  getOutputIndicesLength() {
    return this.outputIndices.lengthInElements;
  }
  // from RunModelParams interface
  getOutputIndices() {
    return this.outputIndices.view;
  }
  // from RunModelParams interface
  copyOutputIndices(A, e) {
    this.outputIndices.lengthInElements !== 0 && ((A === void 0 || A.length < this.outputIndices.lengthInElements) && (A = e(this.outputIndices.lengthInElements)), A.set(this.outputIndices.view));
  }
  // from RunModelParams interface
  getOutputsLength() {
    return this.outputs.lengthInElements;
  }
  // from RunModelParams interface
  getOutputs() {
    return this.outputs.view;
  }
  // from RunModelParams interface
  getOutputsObject() {
  }
  // from RunModelParams interface
  storeOutputs(A) {
    this.outputs.view !== void 0 && (A.length > this.outputs.view.length ? this.outputs.view.set(A.subarray(0, this.outputs.view.length)) : this.outputs.view.set(A));
  }
  // from RunModelParams interface
  getLookups() {
    if (this.lookupIndices.lengthInElements !== 0)
      return decodeLookups(this.lookupIndices.view, this.lookups.view);
  }
  // from RunModelParams interface
  getElapsedTime() {
    return this.extras.view[0];
  }
  // from RunModelParams interface
  storeElapsedTime(A) {
    this.extras.view[0] = A;
  }
  /**
   * Copy the outputs buffer to the given `Outputs` instance.  This should be called
   * after the `runModel` call has completed so that the output values are copied from
   * the internal buffer to the `Outputs` instance that was passed to `runModel`.
   *
   * @param outputs The `Outputs` instance into which the output values will be copied.
   */
  finalizeOutputs(A) {
    this.outputs.view && A.updateFromBuffer(this.outputs.view, A.seriesLength), A.runTimeInMillis = this.getElapsedTime();
  }
  /**
   * Update this instance using the parameters that are passed to a `runModel` call.
   *
   * @param inputs The model input values (must be in the same order as in the spec file).
   * @param outputs The structure into which the model outputs will be stored.
   * @param options Additional options that influence the model run.
   */
  updateFromParams(A, e, r) {
    const o = A.length, i = e.varIds.length * e.seriesLength;
    let Q;
    const B = e.varSpecs;
    B !== void 0 && B.length > 0 ? Q = getEncodedVarIndicesLength(B) : Q = 0;
    let s, w;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const m of r.lookups)
        resolveVarRef(this.listing, m.varRef, "lookup");
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, w = M.lookupIndicesLength;
    } else
      s = 0, w = 0;
    let a = 0;
    function n(M, m) {
      const p = a, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, j = Math.round(m * O), z = Math.ceil(j / 8) * 8;
      return a += z, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), h = n("float64", i), D = n("int32", Q), g = n("float64", s), C = n("int32", w), t = a;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const I = this.header.view;
    let c = 0;
    I[c++] = l, I[c++] = extrasLengthInElements, I[c++] = f, I[c++] = o, I[c++] = h, I[c++] = i, I[c++] = D, I[c++] = Q, I[c++] = g, I[c++] = s, I[c++] = C, I[c++] = w, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, h, i), this.outputIndices.update(this.encoded, D, Q), this.lookups.update(this.encoded, g, s), this.lookupIndices.update(this.encoded, C, w);
    const d = this.inputs.view;
    for (let M = 0; M < A.length; M++) {
      const m = A[M];
      typeof m == "number" ? d[M] = m : d[M] = m.get();
    }
    this.outputIndices.view && encodeVarIndices(B, this.outputIndices.view), w > 0 && encodeLookups(r.lookups, this.lookupIndices.view, this.lookups.view);
  }
  /**
   * Update this instance using the values contained in the encoded buffer from another
   * `BufferedRunModelParams` instance.
   *
   * @param buffer An encoded buffer returned by `getEncodedBuffer`.
   */
  updateFromEncodedBuffer(A) {
    const e = headerLengthInElements * Int32Array.BYTES_PER_ELEMENT;
    if (A.byteLength < e)
      throw new Error("Buffer must be long enough to contain header section");
    this.encoded = A, this.header.update(this.encoded, 0, headerLengthInElements);
    const o = this.header.view;
    let i = 0;
    const Q = o[i++], B = o[i++], s = o[i++], w = o[i++], a = o[i++], n = o[i++], E = o[i++], l = o[i++], f = o[i++], h = o[i++], D = o[i++], g = o[i++], C = B * Float64Array.BYTES_PER_ELEMENT, t = w * Float64Array.BYTES_PER_ELEMENT, I = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = h * Float64Array.BYTES_PER_ELEMENT, M = g * Int32Array.BYTES_PER_ELEMENT, m = e + C + t + I + c + d + M;
    if (A.byteLength < m)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, Q, B), this.inputs.update(this.encoded, s, w), this.outputs.update(this.encoded, a, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, h), this.lookupIndices.update(this.encoded, D, g);
  }
};
async function spawnAsyncModelRunner(A) {
  return A.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(A.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(A.source));
}
async function spawnAsyncModelRunnerWithWorker(A) {
  const e = await spawn(A), r = await e.initModel(), o = r.modelListing ? new ModelListing(r.modelListing) : void 0, i = new BufferedRunModelParams(o);
  let Q = !1, B = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (s, w, a) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (Q)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      Q = !0, i.updateFromParams(s, w, a);
      let n;
      try {
        n = await e.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        Q = !1;
      }
      return i.updateFromEncodedBuffer(n), i.finalizeOutputs(w), w;
    },
    terminate: () => B ? Promise.resolve() : (B = !0, Thread.terminate(e))
  };
}
var assertNever = {}, hasRequiredAssertNever;
function requireAssertNever() {
  if (hasRequiredAssertNever) return assertNever;
  hasRequiredAssertNever = 1, Object.defineProperty(assertNever, "__esModule", { value: !0 }), assertNever.assertNever = A;
  function A(e, r) {
    if (typeof r == "string")
      throw new Error(r);
    if (typeof r == "function")
      throw new Error(r(e));
    if (r)
      return e;
    throw new Error("Unhandled discriminated union member: ".concat(JSON.stringify(e)));
  }
  return assertNever.default = A, assertNever;
}
var assertNeverExports = requireAssertNever(), ajv = { exports: {} }, core$1 = {}, validate = {}, boolSchema = {}, errors = {}, codegen = {}, code$1 = {}, hasRequiredCode$1;
function requireCode$1() {
  return hasRequiredCode$1 || (hasRequiredCode$1 = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.regexpCode = A.getEsmExportName = A.getProperty = A.safeStringify = A.stringify = A.strConcat = A.addCodeArg = A.str = A._ = A.nil = A._Code = A.Name = A.IDENTIFIER = A._CodeOrName = void 0;
    class e {
    }
    A._CodeOrName = e, A.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class r extends e {
      constructor(t) {
        if (super(), !A.IDENTIFIER.test(t))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = t;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    A.Name = r;
    class o extends e {
      constructor(t) {
        super(), this._items = typeof t == "string" ? [t] : t;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const t = this._items[0];
        return t === "" || t === '""';
      }
      get str() {
        var t;
        return (t = this._str) !== null && t !== void 0 ? t : this._str = this._items.reduce((I, c) => `${I}${c}`, "");
      }
      get names() {
        var t;
        return (t = this._names) !== null && t !== void 0 ? t : this._names = this._items.reduce((I, c) => (c instanceof r && (I[c.str] = (I[c.str] || 0) + 1), I), {});
      }
    }
    A._Code = o, A.nil = new o("");
    function i(C, ...t) {
      const I = [C[0]];
      let c = 0;
      for (; c < t.length; )
        s(I, t[c]), I.push(C[++c]);
      return new o(I);
    }
    A._ = i;
    const Q = new o("+");
    function B(C, ...t) {
      const I = [f(C[0])];
      let c = 0;
      for (; c < t.length; )
        I.push(Q), s(I, t[c]), I.push(Q, f(C[++c]));
      return w(I), new o(I);
    }
    A.str = B;
    function s(C, t) {
      t instanceof o ? C.push(...t._items) : t instanceof r ? C.push(t) : C.push(E(t));
    }
    A.addCodeArg = s;
    function w(C) {
      let t = 1;
      for (; t < C.length - 1; ) {
        if (C[t] === Q) {
          const I = a(C[t - 1], C[t + 1]);
          if (I !== void 0) {
            C.splice(t - 1, 3, I);
            continue;
          }
          C[t++] = "+";
        }
        t++;
      }
    }
    function a(C, t) {
      if (t === '""')
        return C;
      if (C === '""')
        return t;
      if (typeof C == "string")
        return t instanceof r || C[C.length - 1] !== '"' ? void 0 : typeof t != "string" ? `${C.slice(0, -1)}${t}"` : t[0] === '"' ? C.slice(0, -1) + t.slice(1) : void 0;
      if (typeof t == "string" && t[0] === '"' && !(C instanceof r))
        return `"${C}${t.slice(1)}`;
    }
    function n(C, t) {
      return t.emptyStr() ? C : C.emptyStr() ? t : B`${C}${t}`;
    }
    A.strConcat = n;
    function E(C) {
      return typeof C == "number" || typeof C == "boolean" || C === null ? C : f(Array.isArray(C) ? C.join(",") : C);
    }
    function l(C) {
      return new o(f(C));
    }
    A.stringify = l;
    function f(C) {
      return JSON.stringify(C).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    A.safeStringify = f;
    function h(C) {
      return typeof C == "string" && A.IDENTIFIER.test(C) ? new o(`.${C}`) : i`[${C}]`;
    }
    A.getProperty = h;
    function D(C) {
      if (typeof C == "string" && A.IDENTIFIER.test(C))
        return new o(`${C}`);
      throw new Error(`CodeGen: invalid export name: ${C}, use explicit $id name mapping`);
    }
    A.getEsmExportName = D;
    function g(C) {
      return new o(C.toString());
    }
    A.regexpCode = g;
  })(code$1)), code$1;
}
var scope = {}, hasRequiredScope;
function requireScope() {
  return hasRequiredScope || (hasRequiredScope = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.ValueScope = A.ValueScopeName = A.Scope = A.varKinds = A.UsedValueState = void 0;
    const e = requireCode$1();
    class r extends Error {
      constructor(a) {
        super(`CodeGen: "code" for ${a} not defined`), this.value = a.value;
      }
    }
    var o;
    (function(w) {
      w[w.Started = 0] = "Started", w[w.Completed = 1] = "Completed";
    })(o || (A.UsedValueState = o = {})), A.varKinds = {
      const: new e.Name("const"),
      let: new e.Name("let"),
      var: new e.Name("var")
    };
    class i {
      constructor({ prefixes: a, parent: n } = {}) {
        this._names = {}, this._prefixes = a, this._parent = n;
      }
      toName(a) {
        return a instanceof e.Name ? a : this.name(a);
      }
      name(a) {
        return new e.Name(this._newName(a));
      }
      _newName(a) {
        const n = this._names[a] || this._nameGroup(a);
        return `${a}${n.index++}`;
      }
      _nameGroup(a) {
        var n, E;
        if (!((E = (n = this._parent) === null || n === void 0 ? void 0 : n._prefixes) === null || E === void 0) && E.has(a) || this._prefixes && !this._prefixes.has(a))
          throw new Error(`CodeGen: prefix "${a}" is not allowed in this scope`);
        return this._names[a] = { prefix: a, index: 0 };
      }
    }
    A.Scope = i;
    class Q extends e.Name {
      constructor(a, n) {
        super(n), this.prefix = a;
      }
      setValue(a, { property: n, itemIndex: E }) {
        this.value = a, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = Q;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(a) {
        super(a), this._values = {}, this._scope = a.scope, this.opts = { ...a, _n: a.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(a) {
        return new Q(a, this._newName(a));
      }
      value(a, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(a), { prefix: f } = l, h = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let D = this._values[f];
        if (D) {
          const t = D.get(h);
          if (t)
            return t;
        } else
          D = this._values[f] = /* @__PURE__ */ new Map();
        D.set(h, l);
        const g = this._scope[f] || (this._scope[f] = []), C = g.length;
        return g[C] = n.ref, l.setValue(n, { property: f, itemIndex: C }), l;
      }
      getValue(a, n) {
        const E = this._values[a];
        if (E)
          return E.get(n);
      }
      scopeRefs(a, n = this._values) {
        return this._reduceValues(n, (E) => {
          if (E.scopePath === void 0)
            throw new Error(`CodeGen: name "${E}" has no value`);
          return (0, e._)`${a}${E.scopePath}`;
        });
      }
      scopeCode(a = this._values, n, E) {
        return this._reduceValues(a, (l) => {
          if (l.value === void 0)
            throw new Error(`CodeGen: name "${l}" has no value`);
          return l.value.code;
        }, n, E);
      }
      _reduceValues(a, n, E = {}, l) {
        let f = e.nil;
        for (const h in a) {
          const D = a[h];
          if (!D)
            continue;
          const g = E[h] = E[h] || /* @__PURE__ */ new Map();
          D.forEach((C) => {
            if (g.has(C))
              return;
            g.set(C, o.Started);
            let t = n(C);
            if (t) {
              const I = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${I} ${C} = ${t};${this.opts._n}`;
            } else if (t = l?.(C))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(C);
            g.set(C, o.Completed);
          });
        }
        return f;
      }
    }
    A.ValueScope = s;
  })(scope)), scope;
}
var hasRequiredCodegen;
function requireCodegen() {
  return hasRequiredCodegen || (hasRequiredCodegen = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.or = A.and = A.not = A.CodeGen = A.operators = A.varKinds = A.ValueScopeName = A.ValueScope = A.Scope = A.Name = A.regexpCode = A.stringify = A.getProperty = A.nil = A.strConcat = A.str = A._ = void 0;
    const e = requireCode$1(), r = requireScope();
    var o = requireCode$1();
    Object.defineProperty(A, "_", { enumerable: !0, get: function() {
      return o._;
    } }), Object.defineProperty(A, "str", { enumerable: !0, get: function() {
      return o.str;
    } }), Object.defineProperty(A, "strConcat", { enumerable: !0, get: function() {
      return o.strConcat;
    } }), Object.defineProperty(A, "nil", { enumerable: !0, get: function() {
      return o.nil;
    } }), Object.defineProperty(A, "getProperty", { enumerable: !0, get: function() {
      return o.getProperty;
    } }), Object.defineProperty(A, "stringify", { enumerable: !0, get: function() {
      return o.stringify;
    } }), Object.defineProperty(A, "regexpCode", { enumerable: !0, get: function() {
      return o.regexpCode;
    } }), Object.defineProperty(A, "Name", { enumerable: !0, get: function() {
      return o.Name;
    } });
    var i = requireScope();
    Object.defineProperty(A, "Scope", { enumerable: !0, get: function() {
      return i.Scope;
    } }), Object.defineProperty(A, "ValueScope", { enumerable: !0, get: function() {
      return i.ValueScope;
    } }), Object.defineProperty(A, "ValueScopeName", { enumerable: !0, get: function() {
      return i.ValueScopeName;
    } }), Object.defineProperty(A, "varKinds", { enumerable: !0, get: function() {
      return i.varKinds;
    } }), A.operators = {
      GT: new e._Code(">"),
      GTE: new e._Code(">="),
      LT: new e._Code("<"),
      LTE: new e._Code("<="),
      EQ: new e._Code("==="),
      NEQ: new e._Code("!=="),
      NOT: new e._Code("!"),
      OR: new e._Code("||"),
      AND: new e._Code("&&"),
      ADD: new e._Code("+")
    };
    class Q {
      optimizeNodes() {
        return this;
      }
      optimizeNames(u, K) {
        return this;
      }
    }
    class B extends Q {
      constructor(u, K, H) {
        super(), this.varKind = u, this.name = K, this.rhs = H;
      }
      render({ es5: u, _n: K }) {
        const H = u ? r.varKinds.var : this.varKind, F = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${H} ${this.name}${F};` + K;
      }
      optimizeNames(u, K) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = Z(this.rhs, u, K)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends Q {
      constructor(u, K, H) {
        super(), this.lhs = u, this.rhs = K, this.sideEffects = H;
      }
      render({ _n: u }) {
        return `${this.lhs} = ${this.rhs};` + u;
      }
      optimizeNames(u, K) {
        if (!(this.lhs instanceof e.Name && !u[this.lhs.str] && !this.sideEffects))
          return this.rhs = Z(this.rhs, u, K), this;
      }
      get names() {
        const u = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return S(u, this.rhs);
      }
    }
    class w extends s {
      constructor(u, K, H, F) {
        super(u, H, F), this.op = K;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class a extends Q {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `${this.label}:` + u;
      }
    }
    class n extends Q {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `break${this.label ? ` ${this.label}` : ""};` + u;
      }
    }
    class E extends Q {
      constructor(u) {
        super(), this.error = u;
      }
      render({ _n: u }) {
        return `throw ${this.error};` + u;
      }
      get names() {
        return this.error.names;
      }
    }
    class l extends Q {
      constructor(u) {
        super(), this.code = u;
      }
      render({ _n: u }) {
        return `${this.code};` + u;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(u, K) {
        return this.code = Z(this.code, u, K), this;
      }
      get names() {
        return this.code instanceof e._CodeOrName ? this.code.names : {};
      }
    }
    class f extends Q {
      constructor(u = []) {
        super(), this.nodes = u;
      }
      render(u) {
        return this.nodes.reduce((K, H) => K + H.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let K = u.length;
        for (; K--; ) {
          const H = u[K].optimizeNodes();
          Array.isArray(H) ? u.splice(K, 1, ...H) : H ? u[K] = H : u.splice(K, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, K) {
        const { nodes: H } = this;
        let F = H.length;
        for (; F--; ) {
          const b = H[F];
          b.optimizeNames(u, K) || (x(u, b.names), H.splice(F, 1));
        }
        return H.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, K) => U(u, K.names), {});
      }
    }
    class h extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class D extends f {
    }
    class g extends h {
    }
    g.kind = "else";
    class C extends h {
      constructor(u, K) {
        super(K), this.condition = u;
      }
      render(u) {
        let K = `if(${this.condition})` + super.render(u);
        return this.else && (K += "else " + this.else.render(u)), K;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const u = this.condition;
        if (u === !0)
          return this.nodes;
        let K = this.else;
        if (K) {
          const H = K.optimizeNodes();
          K = this.else = Array.isArray(H) ? new g(H) : H;
        }
        if (K)
          return u === !1 ? K instanceof C ? K : K.nodes : this.nodes.length ? this : new C(rA(u), K instanceof C ? [K] : K.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, K) {
        var H;
        if (this.else = (H = this.else) === null || H === void 0 ? void 0 : H.optimizeNames(u, K), !!(super.optimizeNames(u, K) || this.else))
          return this.condition = Z(this.condition, u, K), this;
      }
      get names() {
        const u = super.names;
        return S(u, this.condition), this.else && U(u, this.else.names), u;
      }
    }
    C.kind = "if";
    class t extends h {
    }
    t.kind = "for";
    class I extends t {
      constructor(u) {
        super(), this.iteration = u;
      }
      render(u) {
        return `for(${this.iteration})` + super.render(u);
      }
      optimizeNames(u, K) {
        if (super.optimizeNames(u, K))
          return this.iteration = Z(this.iteration, u, K), this;
      }
      get names() {
        return U(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, K, H, F) {
        super(), this.varKind = u, this.name = K, this.from = H, this.to = F;
      }
      render(u) {
        const K = u.es5 ? r.varKinds.var : this.varKind, { name: H, from: F, to: b } = this;
        return `for(${K} ${H}=${F}; ${H}<${b}; ${H}++)` + super.render(u);
      }
      get names() {
        const u = S(super.names, this.from);
        return S(u, this.to);
      }
    }
    class d extends t {
      constructor(u, K, H, F) {
        super(), this.loop = u, this.varKind = K, this.name = H, this.iterable = F;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, K) {
        if (super.optimizeNames(u, K))
          return this.iterable = Z(this.iterable, u, K), this;
      }
      get names() {
        return U(super.names, this.iterable.names);
      }
    }
    class M extends h {
      constructor(u, K, H) {
        super(), this.name = u, this.args = K, this.async = H;
      }
      render(u) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(u);
      }
    }
    M.kind = "func";
    class m extends f {
      render(u) {
        return "return " + super.render(u);
      }
    }
    m.kind = "return";
    class p extends h {
      render(u) {
        let K = "try" + super.render(u);
        return this.catch && (K += this.catch.render(u)), this.finally && (K += this.finally.render(u)), K;
      }
      optimizeNodes() {
        var u, K;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (K = this.finally) === null || K === void 0 || K.optimizeNodes(), this;
      }
      optimizeNames(u, K) {
        var H, F;
        return super.optimizeNames(u, K), (H = this.catch) === null || H === void 0 || H.optimizeNames(u, K), (F = this.finally) === null || F === void 0 || F.optimizeNames(u, K), this;
      }
      get names() {
        const u = super.names;
        return this.catch && U(u, this.catch.names), this.finally && U(u, this.finally.names), u;
      }
    }
    class O extends h {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    O.kind = "catch";
    class j extends h {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    j.kind = "finally";
    class z {
      constructor(u, K = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...K, _n: K.lines ? `
` : "" }, this._extScope = u, this._scope = new r.Scope({ parent: u }), this._nodes = [new D()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(u) {
        return this._scope.name(u);
      }
      // reserves unique name in the external scope
      scopeName(u) {
        return this._extScope.name(u);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(u, K) {
        const H = this._extScope.value(u, K);
        return (this._values[H.prefix] || (this._values[H.prefix] = /* @__PURE__ */ new Set())).add(H), H;
      }
      getScopeValue(u, K) {
        return this._extScope.getValue(u, K);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(u) {
        return this._extScope.scopeRefs(u, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(u, K, H, F) {
        const b = this._scope.toName(K);
        return H !== void 0 && F && (this._constants[b.str] = H), this._leafNode(new B(u, b, H)), b;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, K, H) {
        return this._def(r.varKinds.const, u, K, H);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, K, H) {
        return this._def(r.varKinds.let, u, K, H);
      }
      // `var` declaration with optional assignment
      var(u, K, H) {
        return this._def(r.varKinds.var, u, K, H);
      }
      // assignment code
      assign(u, K, H) {
        return this._leafNode(new s(u, K, H));
      }
      // `+=` code
      add(u, K) {
        return this._leafNode(new w(u, A.operators.ADD, K));
      }
      // appends passed SafeExpr to code or executes Block
      code(u) {
        return typeof u == "function" ? u() : u !== e.nil && this._leafNode(new l(u)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...u) {
        const K = ["{"];
        for (const [H, F] of u)
          K.length > 1 && K.push(","), K.push(H), (H !== F || this.opts.es5) && (K.push(":"), (0, e.addCodeArg)(K, F));
        return K.push("}"), new e._Code(K);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, K, H) {
        if (this._blockNode(new C(u)), K && H)
          this.code(K).else().code(H).endIf();
        else if (K)
          this.code(K).endIf();
        else if (H)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(u) {
        return this._elseNode(new C(u));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new g());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(C, g);
      }
      _for(u, K) {
        return this._blockNode(u), K && this.code(K).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, K) {
        return this._for(new I(u), K);
      }
      // `for` statement for a range of values
      forRange(u, K, H, F, b = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const Y = this._scope.toName(u);
        return this._for(new c(b, Y, K, H), () => F(Y));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, K, H, F = r.varKinds.const) {
        const b = this._scope.toName(u);
        if (this.opts.es5) {
          const Y = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${Y}.length`, (J) => {
            this.var(b, (0, e._)`${Y}[${J}]`), H(b);
          });
        }
        return this._for(new d("of", F, b, K), () => H(b));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, K, H, F = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${K})`, H);
        const b = this._scope.toName(u);
        return this._for(new d("in", F, b, K), () => H(b));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(t);
      }
      // `label` statement
      label(u) {
        return this._leafNode(new a(u));
      }
      // `break` statement
      break(u) {
        return this._leafNode(new n(u));
      }
      // `return` statement
      return(u) {
        const K = new m();
        if (this._blockNode(K), this.code(u), K.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(m);
      }
      // `try` statement
      try(u, K, H) {
        if (!K && !H)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const F = new p();
        if (this._blockNode(F), this.code(u), K) {
          const b = this.name("e");
          this._currNode = F.catch = new O(b), K(b);
        }
        return H && (this._currNode = F.finally = new j(), this.code(H)), this._endBlockNode(O, j);
      }
      // `throw` statement
      throw(u) {
        return this._leafNode(new E(u));
      }
      // start self-balancing block
      block(u, K) {
        return this._blockStarts.push(this._nodes.length), u && this.code(u).endBlock(K), this;
      }
      // end the current self-balancing block
      endBlock(u) {
        const K = this._blockStarts.pop();
        if (K === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const H = this._nodes.length - K;
        if (H < 0 || u !== void 0 && H !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${H} vs ${u} expected`);
        return this._nodes.length = K, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, K = e.nil, H, F) {
        return this._blockNode(new M(u, K, H)), F && this.code(F).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(M);
      }
      optimize(u = 1) {
        for (; u-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(u) {
        return this._currNode.nodes.push(u), this;
      }
      _blockNode(u) {
        this._currNode.nodes.push(u), this._nodes.push(u);
      }
      _endBlockNode(u, K) {
        const H = this._currNode;
        if (H instanceof u || K && H instanceof K)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${K ? `${u.kind}/${K.kind}` : u.kind}"`);
      }
      _elseNode(u) {
        const K = this._currNode;
        if (!(K instanceof C))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = K.else = u, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const u = this._nodes;
        return u[u.length - 1];
      }
      set _currNode(u) {
        const K = this._nodes;
        K[K.length - 1] = u;
      }
    }
    A.CodeGen = z;
    function U(y, u) {
      for (const K in u)
        y[K] = (y[K] || 0) + (u[K] || 0);
      return y;
    }
    function S(y, u) {
      return u instanceof e._CodeOrName ? U(y, u.names) : y;
    }
    function Z(y, u, K) {
      if (y instanceof e.Name)
        return H(y);
      if (!F(y))
        return y;
      return new e._Code(y._items.reduce((b, Y) => (Y instanceof e.Name && (Y = H(Y)), Y instanceof e._Code ? b.push(...Y._items) : b.push(Y), b), []));
      function H(b) {
        const Y = K[b.str];
        return Y === void 0 || u[b.str] !== 1 ? b : (delete u[b.str], Y);
      }
      function F(b) {
        return b instanceof e._Code && b._items.some((Y) => Y instanceof e.Name && u[Y.str] === 1 && K[Y.str] !== void 0);
      }
    }
    function x(y, u) {
      for (const K in u)
        y[K] = (y[K] || 0) - (u[K] || 0);
    }
    function rA(y) {
      return typeof y == "boolean" || typeof y == "number" || y === null ? !y : (0, e._)`!${_(y)}`;
    }
    A.not = rA;
    const oA = k(A.operators.AND);
    function T(...y) {
      return y.reduce(oA);
    }
    A.and = T;
    const QA = k(A.operators.OR);
    function q(...y) {
      return y.reduce(QA);
    }
    A.or = q;
    function k(y) {
      return (u, K) => u === e.nil ? K : K === e.nil ? u : (0, e._)`${_(u)} ${y} ${_(K)}`;
    }
    function _(y) {
      return y instanceof e.Name ? y : (0, e._)`(${y})`;
    }
  })(codegen)), codegen;
}
var util = {}, hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1, Object.defineProperty(util, "__esModule", { value: !0 }), util.checkStrictMode = util.getErrorPath = util.Type = util.useFunc = util.setEvaluated = util.evaluatedPropsToName = util.mergeEvaluated = util.eachItem = util.unescapeJsonPointer = util.escapeJsonPointer = util.escapeFragment = util.unescapeFragment = util.schemaRefOrVal = util.schemaHasRulesButRef = util.schemaHasRules = util.checkUnknownRules = util.alwaysValidSchema = util.toHash = void 0;
  const A = requireCodegen(), e = requireCode$1();
  function r(d) {
    const M = {};
    for (const m of d)
      M[m] = !0;
    return M;
  }
  util.toHash = r;
  function o(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (i(d, M), !Q(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function i(d, M = d.schema) {
    const { opts: m, self: p } = d;
    if (!m.strictSchema || typeof M == "boolean")
      return;
    const O = p.RULES.keywords;
    for (const j in M)
      O[j] || c(d, `unknown keyword: "${j}"`);
  }
  util.checkUnknownRules = i;
  function Q(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const m in d)
      if (M[m])
        return !0;
    return !1;
  }
  util.schemaHasRules = Q;
  function B(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const m in d)
      if (m !== "$ref" && M.all[m])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: M }, m, p, O) {
    if (!O) {
      if (typeof m == "number" || typeof m == "boolean")
        return m;
      if (typeof m == "string")
        return (0, A._)`${m}`;
    }
    return (0, A._)`${d}${M}${(0, A.getProperty)(p)}`;
  }
  util.schemaRefOrVal = s;
  function w(d) {
    return E(decodeURIComponent(d));
  }
  util.unescapeFragment = w;
  function a(d) {
    return encodeURIComponent(n(d));
  }
  util.escapeFragment = a;
  function n(d) {
    return typeof d == "number" ? `${d}` : d.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  util.escapeJsonPointer = n;
  function E(d) {
    return d.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  util.unescapeJsonPointer = E;
  function l(d, M) {
    if (Array.isArray(d))
      for (const m of d)
        M(m);
    else
      M(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: M, mergeValues: m, resultToName: p }) {
    return (O, j, z, U) => {
      const S = z === void 0 ? j : z instanceof A.Name ? (j instanceof A.Name ? d(O, j, z) : M(O, j, z), z) : j instanceof A.Name ? (M(O, z, j), j) : m(j, z);
      return U === A.Name && !(S instanceof A.Name) ? p(O, S) : S;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, m) => d.if((0, A._)`${m} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(m, !0), () => d.assign(m, (0, A._)`${m} || {}`).code((0, A._)`Object.assign(${m}, ${M})`));
      }),
      mergeToName: (d, M, m) => d.if((0, A._)`${m} !== true`, () => {
        M === !0 ? d.assign(m, !0) : (d.assign(m, (0, A._)`${m} || {}`), D(d, m, M));
      }),
      mergeValues: (d, M) => d === !0 ? !0 : { ...d, ...M },
      resultToName: h
    }),
    items: f({
      mergeNames: (d, M, m) => d.if((0, A._)`${m} !== true && ${M} !== undefined`, () => d.assign(m, (0, A._)`${M} === true ? true : ${m} > ${M} ? ${m} : ${M}`)),
      mergeToName: (d, M, m) => d.if((0, A._)`${m} !== true`, () => d.assign(m, M === !0 ? !0 : (0, A._)`${m} > ${M} ? ${m} : ${M}`)),
      mergeValues: (d, M) => d === !0 ? !0 : Math.max(d, M),
      resultToName: (d, M) => d.var("items", M)
    })
  };
  function h(d, M) {
    if (M === !0)
      return d.var("props", !0);
    const m = d.var("props", (0, A._)`{}`);
    return M !== void 0 && D(d, m, M), m;
  }
  util.evaluatedPropsToName = h;
  function D(d, M, m) {
    Object.keys(m).forEach((p) => d.assign((0, A._)`${M}${(0, A.getProperty)(p)}`, !0));
  }
  util.setEvaluated = D;
  const g = {};
  function C(d, M) {
    return d.scopeValue("func", {
      ref: M,
      code: g[M.code] || (g[M.code] = new e._Code(M.code))
    });
  }
  util.useFunc = C;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function I(d, M, m) {
    if (d instanceof A.Name) {
      const p = M === t.Num;
      return m ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return m ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = I;
  function c(d, M, m = d.opts.strictSchema) {
    if (m) {
      if (M = `strict mode: ${M}`, m === !0)
        throw new Error(M);
      d.self.logger.warn(M);
    }
  }
  return util.checkStrictMode = c, util;
}
var names = {}, hasRequiredNames;
function requireNames() {
  if (hasRequiredNames) return names;
  hasRequiredNames = 1, Object.defineProperty(names, "__esModule", { value: !0 });
  const A = requireCodegen(), e = {
    // validation function arguments
    data: new A.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new A.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new A.Name("instancePath"),
    parentData: new A.Name("parentData"),
    parentDataProperty: new A.Name("parentDataProperty"),
    rootData: new A.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new A.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new A.Name("vErrors"),
    // null or array of validation errors
    errors: new A.Name("errors"),
    // counter of validation errors
    this: new A.Name("this"),
    // "globals"
    self: new A.Name("self"),
    scope: new A.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new A.Name("json"),
    jsonPos: new A.Name("jsonPos"),
    jsonLen: new A.Name("jsonLen"),
    jsonPart: new A.Name("jsonPart")
  };
  return names.default = e, names;
}
var hasRequiredErrors;
function requireErrors() {
  return hasRequiredErrors || (hasRequiredErrors = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.extendErrors = A.resetErrorsCount = A.reportExtraError = A.reportError = A.keyword$DataError = A.keywordError = void 0;
    const e = requireCodegen(), r = requireUtil(), o = requireNames();
    A.keywordError = {
      message: ({ keyword: g }) => (0, e.str)`must pass "${g}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: g, schemaType: C }) => C ? (0, e.str)`"${g}" keyword must be ${C} ($data)` : (0, e.str)`"${g}" keyword is invalid ($data)`
    };
    function i(g, C = A.keywordError, t, I) {
      const { it: c } = g, { gen: d, compositeRule: M, allErrors: m } = c, p = E(g, C, t);
      I ?? (M || m) ? w(d, p) : a(c, (0, e._)`[${p}]`);
    }
    A.reportError = i;
    function Q(g, C = A.keywordError, t) {
      const { it: I } = g, { gen: c, compositeRule: d, allErrors: M } = I, m = E(g, C, t);
      w(c, m), d || M || a(I, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function B(g, C) {
      g.assign(o.default.errors, C), g.if((0, e._)`${o.default.vErrors} !== null`, () => g.if(C, () => g.assign((0, e._)`${o.default.vErrors}.length`, C), () => g.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: g, keyword: C, schemaValue: t, data: I, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = g.name("err");
      g.forRange("i", c, o.default.errors, (m) => {
        g.const(M, (0, e._)`${o.default.vErrors}[${m}]`), g.if((0, e._)`${M}.instancePath === undefined`, () => g.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), g.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${C}`), d.opts.verbose && (g.assign((0, e._)`${M}.schema`, t), g.assign((0, e._)`${M}.data`, I));
      });
    }
    A.extendErrors = s;
    function w(g, C) {
      const t = g.const("err", C);
      g.if((0, e._)`${o.default.vErrors} === null`, () => g.assign(o.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${o.default.vErrors}.push(${t})`), g.code((0, e._)`${o.default.errors}++`);
    }
    function a(g, C) {
      const { gen: t, validateName: I, schemaEnv: c } = g;
      c.$async ? t.throw((0, e._)`new ${g.ValidationError}(${C})`) : (t.assign((0, e._)`${I}.errors`, C), t.return(!1));
    }
    const n = {
      keyword: new e.Name("keyword"),
      schemaPath: new e.Name("schemaPath"),
      // also used in JTD errors
      params: new e.Name("params"),
      propertyName: new e.Name("propertyName"),
      message: new e.Name("message"),
      schema: new e.Name("schema"),
      parentSchema: new e.Name("parentSchema")
    };
    function E(g, C, t) {
      const { createErrors: I } = g.it;
      return I === !1 ? (0, e._)`{}` : l(g, C, t);
    }
    function l(g, C, t = {}) {
      const { gen: I, it: c } = g, d = [
        f(c, t),
        h(g, t)
      ];
      return D(g, C, d), I.object(...d);
    }
    function f({ errorPath: g }, { instancePath: C }) {
      const t = C ? (0, e.str)`${g}${(0, r.getErrorPath)(C, r.Type.Str)}` : g;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function h({ keyword: g, it: { errSchemaPath: C } }, { schemaPath: t, parentSchema: I }) {
      let c = I ? C : (0, e.str)`${C}/${g}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function D(g, { params: C, message: t }, I) {
      const { keyword: c, data: d, schemaValue: M, it: m } = g, { opts: p, propertyName: O, topSchemaRef: j, schemaPath: z } = m;
      I.push([n.keyword, c], [n.params, typeof C == "function" ? C(g) : C || (0, e._)`{}`]), p.messages && I.push([n.message, typeof t == "function" ? t(g) : t]), p.verbose && I.push([n.schema, M], [n.parentSchema, (0, e._)`${j}${z}`], [o.default.data, d]), O && I.push([n.propertyName, O]);
    }
  })(errors)), errors;
}
var hasRequiredBoolSchema;
function requireBoolSchema() {
  if (hasRequiredBoolSchema) return boolSchema;
  hasRequiredBoolSchema = 1, Object.defineProperty(boolSchema, "__esModule", { value: !0 }), boolSchema.boolOrEmptySchema = boolSchema.topBoolOrEmptySchema = void 0;
  const A = requireErrors(), e = requireCodegen(), r = requireNames(), o = {
    message: "boolean schema is false"
  };
  function i(s) {
    const { gen: w, schema: a, validateName: n } = s;
    a === !1 ? B(s, !1) : typeof a == "object" && a.$async === !0 ? w.return(r.default.data) : (w.assign((0, e._)`${n}.errors`, null), w.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function Q(s, w) {
    const { gen: a, schema: n } = s;
    n === !1 ? (a.var(w, !1), B(s)) : a.var(w, !0);
  }
  boolSchema.boolOrEmptySchema = Q;
  function B(s, w) {
    const { gen: a, data: n } = s, E = {
      gen: a,
      keyword: "false schema",
      data: n,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: s
    };
    (0, A.reportError)(E, o, void 0, w);
  }
  return boolSchema;
}
var dataType = {}, rules = {}, hasRequiredRules;
function requireRules() {
  if (hasRequiredRules) return rules;
  hasRequiredRules = 1, Object.defineProperty(rules, "__esModule", { value: !0 }), rules.getRules = rules.isJSONType = void 0;
  const A = ["string", "number", "integer", "boolean", "null", "object", "array"], e = new Set(A);
  function r(i) {
    return typeof i == "string" && e.has(i);
  }
  rules.isJSONType = r;
  function o() {
    const i = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...i, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, i.number, i.string, i.array, i.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return rules.getRules = o, rules;
}
var applicability = {}, hasRequiredApplicability;
function requireApplicability() {
  if (hasRequiredApplicability) return applicability;
  hasRequiredApplicability = 1, Object.defineProperty(applicability, "__esModule", { value: !0 }), applicability.shouldUseRule = applicability.shouldUseGroup = applicability.schemaHasRulesForType = void 0;
  function A({ schema: o, self: i }, Q) {
    const B = i.RULES.types[Q];
    return B && B !== !0 && e(o, B);
  }
  applicability.schemaHasRulesForType = A;
  function e(o, i) {
    return i.rules.some((Q) => r(o, Q));
  }
  applicability.shouldUseGroup = e;
  function r(o, i) {
    var Q;
    return o[i.keyword] !== void 0 || ((Q = i.definition.implements) === null || Q === void 0 ? void 0 : Q.some((B) => o[B] !== void 0));
  }
  return applicability.shouldUseRule = r, applicability;
}
var hasRequiredDataType;
function requireDataType() {
  if (hasRequiredDataType) return dataType;
  hasRequiredDataType = 1, Object.defineProperty(dataType, "__esModule", { value: !0 }), dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
  const A = requireRules(), e = requireApplicability(), r = requireErrors(), o = requireCodegen(), i = requireUtil();
  var Q;
  (function(t) {
    t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
  })(Q || (dataType.DataType = Q = {}));
  function B(t) {
    const I = s(t.type);
    if (I.includes("null")) {
      if (t.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!I.length && t.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      t.nullable === !0 && I.push("null");
    }
    return I;
  }
  dataType.getSchemaTypes = B;
  function s(t) {
    const I = Array.isArray(t) ? t : t ? [t] : [];
    if (I.every(A.isJSONType))
      return I;
    throw new Error("type must be JSONType or JSONType[]: " + I.join(","));
  }
  dataType.getJSONTypes = s;
  function w(t, I) {
    const { gen: c, data: d, opts: M } = t, m = n(I, M.coerceTypes), p = I.length > 0 && !(m.length === 0 && I.length === 1 && (0, e.schemaHasRulesForType)(t, I[0]));
    if (p) {
      const O = h(I, d, M.strictNumbers, Q.Wrong);
      c.if(O, () => {
        m.length ? E(t, I, m) : g(t);
      });
    }
    return p;
  }
  dataType.coerceAndCheckDataType = w;
  const a = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, I) {
    return I ? t.filter((c) => a.has(c) || I === "array" && c === "array") : [];
  }
  function E(t, I, c) {
    const { gen: d, data: M, opts: m } = t, p = d.let("dataType", (0, o._)`typeof ${M}`), O = d.let("coerced", (0, o._)`undefined`);
    m.coerceTypes === "array" && d.if((0, o._)`${p} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(p, (0, o._)`typeof ${M}`).if(h(I, M, m.strictNumbers), () => d.assign(O, M))), d.if((0, o._)`${O} !== undefined`);
    for (const z of c)
      (a.has(z) || z === "array" && m.coerceTypes === "array") && j(z);
    d.else(), g(t), d.endIf(), d.if((0, o._)`${O} !== undefined`, () => {
      d.assign(M, O), l(t, O);
    });
    function j(z) {
      switch (z) {
        case "string":
          d.elseIf((0, o._)`${p} == "number" || ${p} == "boolean"`).assign(O, (0, o._)`"" + ${M}`).elseIf((0, o._)`${M} === null`).assign(O, (0, o._)`""`);
          return;
        case "number":
          d.elseIf((0, o._)`${p} == "boolean" || ${M} === null
              || (${p} == "string" && ${M} && ${M} == +${M})`).assign(O, (0, o._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, o._)`${p} === "boolean" || ${M} === null
              || (${p} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(O, (0, o._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, o._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(O, !1).elseIf((0, o._)`${M} === "true" || ${M} === 1`).assign(O, !0);
          return;
        case "null":
          d.elseIf((0, o._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(O, null);
          return;
        case "array":
          d.elseIf((0, o._)`${p} === "string" || ${p} === "number"
              || ${p} === "boolean" || ${M} === null`).assign(O, (0, o._)`[${M}]`);
      }
    }
  }
  function l({ gen: t, parentData: I, parentDataProperty: c }, d) {
    t.if((0, o._)`${I} !== undefined`, () => t.assign((0, o._)`${I}[${c}]`, d));
  }
  function f(t, I, c, d = Q.Correct) {
    const M = d === Q.Correct ? o.operators.EQ : o.operators.NEQ;
    let m;
    switch (t) {
      case "null":
        return (0, o._)`${I} ${M} null`;
      case "array":
        m = (0, o._)`Array.isArray(${I})`;
        break;
      case "object":
        m = (0, o._)`${I} && typeof ${I} == "object" && !Array.isArray(${I})`;
        break;
      case "integer":
        m = p((0, o._)`!(${I} % 1) && !isNaN(${I})`);
        break;
      case "number":
        m = p();
        break;
      default:
        return (0, o._)`typeof ${I} ${M} ${t}`;
    }
    return d === Q.Correct ? m : (0, o.not)(m);
    function p(O = o.nil) {
      return (0, o.and)((0, o._)`typeof ${I} == "number"`, O, c ? (0, o._)`isFinite(${I})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function h(t, I, c, d) {
    if (t.length === 1)
      return f(t[0], I, c, d);
    let M;
    const m = (0, i.toHash)(t);
    if (m.array && m.object) {
      const p = (0, o._)`typeof ${I} != "object"`;
      M = m.null ? p : (0, o._)`!${I} || ${p}`, delete m.null, delete m.array, delete m.object;
    } else
      M = o.nil;
    m.number && delete m.integer;
    for (const p in m)
      M = (0, o.and)(M, f(p, I, c, d));
    return M;
  }
  dataType.checkDataTypes = h;
  const D = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: I }) => typeof t == "string" ? (0, o._)`{type: ${t}}` : (0, o._)`{type: ${I}}`
  };
  function g(t) {
    const I = C(t);
    (0, r.reportError)(I, D);
  }
  dataType.reportTypeError = g;
  function C(t) {
    const { gen: I, data: c, schema: d } = t, M = (0, i.schemaRefOrVal)(t, d, "type");
    return {
      gen: I,
      keyword: "type",
      data: c,
      schema: d.type,
      schemaCode: M,
      schemaValue: M,
      parentSchema: d,
      params: {},
      it: t
    };
  }
  return dataType;
}
var defaults = {}, hasRequiredDefaults;
function requireDefaults() {
  if (hasRequiredDefaults) return defaults;
  hasRequiredDefaults = 1, Object.defineProperty(defaults, "__esModule", { value: !0 }), defaults.assignDefaults = void 0;
  const A = requireCodegen(), e = requireUtil();
  function r(i, Q) {
    const { properties: B, items: s } = i.schema;
    if (Q === "object" && B)
      for (const w in B)
        o(i, w, B[w].default);
    else Q === "array" && Array.isArray(s) && s.forEach((w, a) => o(i, a, w.default));
  }
  defaults.assignDefaults = r;
  function o(i, Q, B) {
    const { gen: s, compositeRule: w, data: a, opts: n } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${a}${(0, A.getProperty)(Q)}`;
    if (w) {
      (0, e.checkStrictMode)(i, `default is ignored for: ${E}`);
      return;
    }
    let l = (0, A._)`${E} === undefined`;
    n.useDefaults === "empty" && (l = (0, A._)`${l} || ${E} === null || ${E} === ""`), s.if(l, (0, A._)`${E} = ${(0, A.stringify)(B)}`);
  }
  return defaults;
}
var keyword = {}, code = {}, hasRequiredCode;
function requireCode() {
  if (hasRequiredCode) return code;
  hasRequiredCode = 1, Object.defineProperty(code, "__esModule", { value: !0 }), code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
  const A = requireCodegen(), e = requireUtil(), r = requireNames(), o = requireUtil();
  function i(t, I) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, I, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${I}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function Q({ gen: t, data: I, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((m) => (0, A.and)(n(t, I, m, c.ownProperties), (0, A._)`${M} = ${m}`)));
  }
  code.checkMissingProp = Q;
  function B(t, I) {
    t.setParams({ missingProperty: I }, !0), t.error();
  }
  code.reportMissingProp = B;
  function s(t) {
    return t.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, A._)`Object.prototype.hasOwnProperty`
    });
  }
  code.hasPropFunc = s;
  function w(t, I, c) {
    return (0, A._)`${s(t)}.call(${I}, ${c})`;
  }
  code.isOwnProperty = w;
  function a(t, I, c, d) {
    const M = (0, A._)`${I}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${w(t, I, c)}` : M;
  }
  code.propertyInData = a;
  function n(t, I, c, d) {
    const M = (0, A._)`${I}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(M, (0, A.not)(w(t, I, c))) : M;
  }
  code.noPropertyInData = n;
  function E(t) {
    return t ? Object.keys(t).filter((I) => I !== "__proto__") : [];
  }
  code.allSchemaProperties = E;
  function l(t, I) {
    return E(I).filter((c) => !(0, e.alwaysValidSchema)(t, I[c]));
  }
  code.schemaProperties = l;
  function f({ schemaCode: t, data: I, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: m }, it: p }, O, j, z) {
    const U = z ? (0, A._)`${t}, ${I}, ${d}${M}` : I, S = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, m)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && S.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Z = (0, A._)`${U}, ${c.object(...S)}`;
    return j !== A.nil ? (0, A._)`${O}.call(${j}, ${Z})` : (0, A._)`${O}(${Z})`;
  }
  code.callValidateCode = f;
  const h = (0, A._)`new RegExp`;
  function D({ gen: t, it: { opts: I } }, c) {
    const d = I.unicodeRegExp ? "u" : "", { regExp: M } = I.code, m = M(c, d);
    return t.scopeValue("pattern", {
      key: m.toString(),
      ref: m,
      code: (0, A._)`${M.code === "new RegExp" ? h : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = D;
  function g(t) {
    const { gen: I, data: c, keyword: d, it: M } = t, m = I.name("valid");
    if (M.allErrors) {
      const O = I.let("valid", !0);
      return p(() => I.assign(O, !1)), O;
    }
    return I.var(m, !0), p(() => I.break()), m;
    function p(O) {
      const j = I.const("len", (0, A._)`${c}.length`);
      I.forRange("i", 0, j, (z) => {
        t.subschema({
          keyword: d,
          dataProp: z,
          dataPropType: e.Type.Num
        }, m), I.if((0, A.not)(m), O);
      });
    }
  }
  code.validateArray = g;
  function C(t) {
    const { gen: I, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((j) => (0, e.alwaysValidSchema)(M, j)) && !M.opts.unevaluated)
      return;
    const p = I.let("valid", !1), O = I.name("_valid");
    I.block(() => c.forEach((j, z) => {
      const U = t.subschema({
        keyword: d,
        schemaProp: z,
        compositeRule: !0
      }, O);
      I.assign(p, (0, A._)`${p} || ${O}`), t.mergeValidEvaluated(U, O) || I.if((0, A.not)(p));
    })), t.result(p, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = C, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function i(l, f) {
    const { gen: h, keyword: D, schema: g, parentSchema: C, it: t } = l, I = f.macro.call(t.self, g, C, t), c = a(h, D, I);
    t.opts.validateSchema !== !1 && t.self.validateSchema(I, !0);
    const d = h.name("valid");
    l.subschema({
      schema: I,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${D}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = i;
  function Q(l, f) {
    var h;
    const { gen: D, keyword: g, schema: C, parentSchema: t, $data: I, it: c } = l;
    w(c, f);
    const d = !I && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = a(D, g, d), m = D.let("valid");
    l.block$data(m, p), l.ok((h = f.valid) !== null && h !== void 0 ? h : m);
    function p() {
      if (f.errors === !1)
        z(), f.modifying && B(l), U(() => l.error());
      else {
        const S = f.async ? O() : j();
        f.modifying && B(l), U(() => s(l, S));
      }
    }
    function O() {
      const S = D.let("ruleErrs", null);
      return D.try(() => z((0, A._)`await `), (Z) => D.assign(m, !1).if((0, A._)`${Z} instanceof ${c.ValidationError}`, () => D.assign(S, (0, A._)`${Z}.errors`), () => D.throw(Z))), S;
    }
    function j() {
      const S = (0, A._)`${M}.errors`;
      return D.assign(S, null), z(A.nil), S;
    }
    function z(S = f.async ? (0, A._)`await ` : A.nil) {
      const Z = c.opts.passContext ? e.default.this : e.default.self, x = !("compile" in f && !I || f.schema === !1);
      D.assign(m, (0, A._)`${S}${(0, r.callValidateCode)(l, M, Z, x)}`, f.modifying);
    }
    function U(S) {
      var Z;
      D.if((0, A.not)((Z = f.valid) !== null && Z !== void 0 ? Z : m), S);
    }
  }
  keyword.funcKeywordCode = Q;
  function B(l) {
    const { gen: f, data: h, it: D } = l;
    f.if(D.parentData, () => f.assign(h, (0, A._)`${D.parentData}[${D.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: h } = l;
    h.if((0, A._)`Array.isArray(${f})`, () => {
      h.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, o.extendErrors)(l);
    }, () => l.error());
  }
  function w({ schemaEnv: l }, f) {
    if (f.async && !l.$async)
      throw new Error("async keyword in sync schema");
  }
  function a(l, f, h) {
    if (h === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof h == "function" ? { ref: h } : { ref: h, code: (0, A.stringify)(h) });
  }
  function n(l, f, h = !1) {
    return !f.length || f.some((D) => D === "array" ? Array.isArray(l) : D === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == D || h && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: h, errSchemaPath: D }, g, C) {
    if (Array.isArray(g.keyword) ? !g.keyword.includes(C) : g.keyword !== C)
      throw new Error("ajv implementation error");
    const t = g.dependencies;
    if (t?.some((I) => !Object.prototype.hasOwnProperty.call(l, I)))
      throw new Error(`parent schema must have dependencies of ${C}: ${t.join(",")}`);
    if (g.validateSchema && !g.validateSchema(l[C])) {
      const c = `keyword "${C}" value is invalid at path "${D}": ` + h.errorsText(g.validateSchema.errors);
      if (f.validateSchema === "log")
        h.logger.error(c);
      else
        throw new Error(c);
    }
  }
  return keyword.validateKeywordUsage = E, keyword;
}
var subschema = {}, hasRequiredSubschema;
function requireSubschema() {
  if (hasRequiredSubschema) return subschema;
  hasRequiredSubschema = 1, Object.defineProperty(subschema, "__esModule", { value: !0 }), subschema.extendSubschemaMode = subschema.extendSubschemaData = subschema.getSubschema = void 0;
  const A = requireCodegen(), e = requireUtil();
  function r(Q, { keyword: B, schemaProp: s, schema: w, schemaPath: a, errSchemaPath: n, topSchemaRef: E }) {
    if (B !== void 0 && w !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (B !== void 0) {
      const l = Q.schema[B];
      return s === void 0 ? {
        schema: l,
        schemaPath: (0, A._)`${Q.schemaPath}${(0, A.getProperty)(B)}`,
        errSchemaPath: `${Q.errSchemaPath}/${B}`
      } : {
        schema: l[s],
        schemaPath: (0, A._)`${Q.schemaPath}${(0, A.getProperty)(B)}${(0, A.getProperty)(s)}`,
        errSchemaPath: `${Q.errSchemaPath}/${B}/${(0, e.escapeFragment)(s)}`
      };
    }
    if (w !== void 0) {
      if (a === void 0 || n === void 0 || E === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: w,
        schemaPath: a,
        topSchemaRef: E,
        errSchemaPath: n
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function o(Q, B, { dataProp: s, dataPropType: w, data: a, dataTypes: n, propertyName: E }) {
    if (a !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: h, dataPathArr: D, opts: g } = B, C = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(C), Q.errorPath = (0, A.str)`${h}${(0, e.getErrorPath)(s, w, g.jsPropertySyntax)}`, Q.parentDataProperty = (0, A._)`${s}`, Q.dataPathArr = [...D, Q.parentDataProperty];
    }
    if (a !== void 0) {
      const h = a instanceof A.Name ? a : l.let("data", a, !0);
      f(h), E !== void 0 && (Q.propertyName = E);
    }
    n && (Q.dataTypes = n);
    function f(h) {
      Q.data = h, Q.dataLevel = B.dataLevel + 1, Q.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), Q.parentData = B.data, Q.dataNames = [...B.dataNames, h];
    }
  }
  subschema.extendSubschemaData = o;
  function i(Q, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: w, createErrors: a, allErrors: n }) {
    w !== void 0 && (Q.compositeRule = w), a !== void 0 && (Q.createErrors = a), n !== void 0 && (Q.allErrors = n), Q.jtdDiscriminator = B, Q.jtdMetadata = s;
  }
  return subschema.extendSubschemaMode = i, subschema;
}
var resolve = {}, fastDeepEqual, hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  return hasRequiredFastDeepEqual || (hasRequiredFastDeepEqual = 1, fastDeepEqual = function A(e, r) {
    if (e === r) return !0;
    if (e && r && typeof e == "object" && typeof r == "object") {
      if (e.constructor !== r.constructor) return !1;
      var o, i, Q;
      if (Array.isArray(e)) {
        if (o = e.length, o != r.length) return !1;
        for (i = o; i-- !== 0; )
          if (!A(e[i], r[i])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
      if (Q = Object.keys(e), o = Q.length, o !== Object.keys(r).length) return !1;
      for (i = o; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, Q[i])) return !1;
      for (i = o; i-- !== 0; ) {
        var B = Q[i];
        if (!A(e[B], r[B])) return !1;
      }
      return !0;
    }
    return e !== e && r !== r;
  }), fastDeepEqual;
}
var jsonSchemaTraverse = { exports: {} }, hasRequiredJsonSchemaTraverse;
function requireJsonSchemaTraverse() {
  if (hasRequiredJsonSchemaTraverse) return jsonSchemaTraverse.exports;
  hasRequiredJsonSchemaTraverse = 1;
  var A = jsonSchemaTraverse.exports = function(o, i, Q) {
    typeof i == "function" && (Q = i, i = {}), Q = i.cb || Q;
    var B = typeof Q == "function" ? Q : Q.pre || function() {
    }, s = Q.post || function() {
    };
    e(i, B, s, o, "", o);
  };
  A.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, A.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, A.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, A.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function e(o, i, Q, B, s, w, a, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, w, a, n, E, l);
      for (var f in B) {
        var h = B[f];
        if (Array.isArray(h)) {
          if (f in A.arrayKeywords)
            for (var D = 0; D < h.length; D++)
              e(o, i, Q, h[D], s + "/" + f + "/" + D, w, s, f, B, D);
        } else if (f in A.propsKeywords) {
          if (h && typeof h == "object")
            for (var g in h)
              e(o, i, Q, h[g], s + "/" + f + "/" + r(g), w, s, f, B, g);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, i, Q, h, s + "/" + f, w, s, f, B);
      }
      Q(B, s, w, a, n, E, l);
    }
  }
  function r(o) {
    return o.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return jsonSchemaTraverse.exports;
}
var hasRequiredResolve;
function requireResolve() {
  if (hasRequiredResolve) return resolve;
  hasRequiredResolve = 1, Object.defineProperty(resolve, "__esModule", { value: !0 }), resolve.getSchemaRefs = resolve.resolveUrl = resolve.normalizeId = resolve._getFullPath = resolve.getFullPath = resolve.inlineRef = void 0;
  const A = requireUtil(), e = requireFastDeepEqual(), r = requireJsonSchemaTraverse(), o = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function i(D, g = !0) {
    return typeof D == "boolean" ? !0 : g === !0 ? !B(D) : g ? s(D) <= g : !1;
  }
  resolve.inlineRef = i;
  const Q = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(D) {
    for (const g in D) {
      if (Q.has(g))
        return !0;
      const C = D[g];
      if (Array.isArray(C) && C.some(B) || typeof C == "object" && B(C))
        return !0;
    }
    return !1;
  }
  function s(D) {
    let g = 0;
    for (const C in D) {
      if (C === "$ref")
        return 1 / 0;
      if (g++, !o.has(C) && (typeof D[C] == "object" && (0, A.eachItem)(D[C], (t) => g += s(t)), g === 1 / 0))
        return 1 / 0;
    }
    return g;
  }
  function w(D, g = "", C) {
    C !== !1 && (g = E(g));
    const t = D.parse(g);
    return a(D, t);
  }
  resolve.getFullPath = w;
  function a(D, g) {
    return D.serialize(g).split("#")[0] + "#";
  }
  resolve._getFullPath = a;
  const n = /#\/?$/;
  function E(D) {
    return D ? D.replace(n, "") : "";
  }
  resolve.normalizeId = E;
  function l(D, g, C) {
    return C = E(C), D.resolve(g, C);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function h(D, g) {
    if (typeof D == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, I = E(D[C] || g), c = { "": I }, d = w(t, I, !1), M = {}, m = /* @__PURE__ */ new Set();
    return r(D, { allKeys: !0 }, (j, z, U, S) => {
      if (S === void 0)
        return;
      const Z = d + z;
      let x = c[S];
      typeof j[C] == "string" && (x = rA.call(this, j[C])), oA.call(this, j.$anchor), oA.call(this, j.$dynamicAnchor), c[z] = x;
      function rA(T) {
        const QA = this.opts.uriResolver.resolve;
        if (T = E(x ? QA(x, T) : T), m.has(T))
          throw O(T);
        m.add(T);
        let q = this.refs[T];
        return typeof q == "string" && (q = this.refs[q]), typeof q == "object" ? p(j, q.schema, T) : T !== E(Z) && (T[0] === "#" ? (p(j, M[T], T), M[T] = j) : this.refs[T] = Z), T;
      }
      function oA(T) {
        if (typeof T == "string") {
          if (!f.test(T))
            throw new Error(`invalid anchor "${T}"`);
          rA.call(this, `#${T}`);
        }
      }
    }), M;
    function p(j, z, U) {
      if (z !== void 0 && !e(j, z))
        throw O(U);
    }
    function O(j) {
      return new Error(`reference "${j}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = h, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), i = requireDefaults(), Q = requireKeyword(), B = requireSubschema(), s = requireCodegen(), w = requireNames(), a = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(P) {
    if (d(P) && (m(P), c(P))) {
      g(P);
      return;
    }
    f(P, () => (0, A.topBoolOrEmptySchema)(P));
  }
  validate.validateFunctionCode = l;
  function f({ gen: P, validateName: G, schema: N, schemaEnv: v, opts: R }, L) {
    R.code.es5 ? P.func(G, (0, s._)`${w.default.data}, ${w.default.valCxt}`, v.$async, () => {
      P.code((0, s._)`"use strict"; ${t(N, R)}`), D(P, R), P.code(L);
    }) : P.func(G, (0, s._)`${w.default.data}, ${h(R)}`, v.$async, () => P.code(t(N, R)).code(L));
  }
  function h(P) {
    return (0, s._)`{${w.default.instancePath}="", ${w.default.parentData}, ${w.default.parentDataProperty}, ${w.default.rootData}=${w.default.data}${P.dynamicRef ? (0, s._)`, ${w.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function D(P, G) {
    P.if(w.default.valCxt, () => {
      P.var(w.default.instancePath, (0, s._)`${w.default.valCxt}.${w.default.instancePath}`), P.var(w.default.parentData, (0, s._)`${w.default.valCxt}.${w.default.parentData}`), P.var(w.default.parentDataProperty, (0, s._)`${w.default.valCxt}.${w.default.parentDataProperty}`), P.var(w.default.rootData, (0, s._)`${w.default.valCxt}.${w.default.rootData}`), G.dynamicRef && P.var(w.default.dynamicAnchors, (0, s._)`${w.default.valCxt}.${w.default.dynamicAnchors}`);
    }, () => {
      P.var(w.default.instancePath, (0, s._)`""`), P.var(w.default.parentData, (0, s._)`undefined`), P.var(w.default.parentDataProperty, (0, s._)`undefined`), P.var(w.default.rootData, w.default.data), G.dynamicRef && P.var(w.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function g(P) {
    const { schema: G, opts: N, gen: v } = P;
    f(P, () => {
      N.$comment && G.$comment && S(P), j(P), v.let(w.default.vErrors, null), v.let(w.default.errors, 0), N.unevaluated && C(P), p(P), Z(P);
    });
  }
  function C(P) {
    const { gen: G, validateName: N } = P;
    P.evaluated = G.const("evaluated", (0, s._)`${N}.evaluated`), G.if((0, s._)`${P.evaluated}.dynamicProps`, () => G.assign((0, s._)`${P.evaluated}.props`, (0, s._)`undefined`)), G.if((0, s._)`${P.evaluated}.dynamicItems`, () => G.assign((0, s._)`${P.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(P, G) {
    const N = typeof P == "object" && P[G.schemaId];
    return N && (G.code.source || G.code.process) ? (0, s._)`/*# sourceURL=${N} */` : s.nil;
  }
  function I(P, G) {
    if (d(P) && (m(P), c(P))) {
      M(P, G);
      return;
    }
    (0, A.boolOrEmptySchema)(P, G);
  }
  function c({ schema: P, self: G }) {
    if (typeof P == "boolean")
      return !P;
    for (const N in P)
      if (G.RULES.all[N])
        return !0;
    return !1;
  }
  function d(P) {
    return typeof P.schema != "boolean";
  }
  function M(P, G) {
    const { schema: N, gen: v, opts: R } = P;
    R.$comment && N.$comment && S(P), z(P), U(P);
    const L = v.const("_errs", w.default.errors);
    p(P, L), v.var(G, (0, s._)`${L} === ${w.default.errors}`);
  }
  function m(P) {
    (0, n.checkUnknownRules)(P), O(P);
  }
  function p(P, G) {
    if (P.opts.jtd)
      return rA(P, [], !1, G);
    const N = (0, e.getSchemaTypes)(P.schema), v = (0, e.coerceAndCheckDataType)(P, N);
    rA(P, N, !v, G);
  }
  function O(P) {
    const { schema: G, errSchemaPath: N, opts: v, self: R } = P;
    G.$ref && v.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(G, R.RULES) && R.logger.warn(`$ref: keywords ignored in schema at path "${N}"`);
  }
  function j(P) {
    const { schema: G, opts: N } = P;
    G.default !== void 0 && N.useDefaults && N.strictSchema && (0, n.checkStrictMode)(P, "default is ignored in the schema root");
  }
  function z(P) {
    const G = P.schema[P.opts.schemaId];
    G && (P.baseId = (0, a.resolveUrl)(P.opts.uriResolver, P.baseId, G));
  }
  function U(P) {
    if (P.schema.$async && !P.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function S({ gen: P, schemaEnv: G, schema: N, errSchemaPath: v, opts: R }) {
    const L = N.$comment;
    if (R.$comment === !0)
      P.code((0, s._)`${w.default.self}.logger.log(${L})`);
    else if (typeof R.$comment == "function") {
      const V = (0, s.str)`${v}/$comment`, eA = P.scopeValue("root", { ref: G.root });
      P.code((0, s._)`${w.default.self}.opts.$comment(${L}, ${V}, ${eA}.schema)`);
    }
  }
  function Z(P) {
    const { gen: G, schemaEnv: N, validateName: v, ValidationError: R, opts: L } = P;
    N.$async ? G.if((0, s._)`${w.default.errors} === 0`, () => G.return(w.default.data), () => G.throw((0, s._)`new ${R}(${w.default.vErrors})`)) : (G.assign((0, s._)`${v}.errors`, w.default.vErrors), L.unevaluated && x(P), G.return((0, s._)`${w.default.errors} === 0`));
  }
  function x({ gen: P, evaluated: G, props: N, items: v }) {
    N instanceof s.Name && P.assign((0, s._)`${G}.props`, N), v instanceof s.Name && P.assign((0, s._)`${G}.items`, v);
  }
  function rA(P, G, N, v) {
    const { gen: R, schema: L, data: V, allErrors: eA, opts: W, self: $ } = P, { RULES: X } = $;
    if (L.$ref && (W.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(L, X))) {
      R.block(() => F(P, "$ref", X.all.$ref.definition));
      return;
    }
    W.jtd || T(P, G), R.block(() => {
      for (const AA of X.rules)
        iA(AA);
      iA(X.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(L, AA) && (AA.type ? (R.if((0, o.checkDataType)(AA.type, V, W.strictNumbers)), oA(P, AA), G.length === 1 && G[0] === AA.type && N && (R.else(), (0, o.reportTypeError)(P)), R.endIf()) : oA(P, AA), eA || R.if((0, s._)`${w.default.errors} === ${v || 0}`));
    }
  }
  function oA(P, G) {
    const { gen: N, schema: v, opts: { useDefaults: R } } = P;
    R && (0, i.assignDefaults)(P, G.type), N.block(() => {
      for (const L of G.rules)
        (0, r.shouldUseRule)(v, L) && F(P, L.keyword, L.definition, G.type);
    });
  }
  function T(P, G) {
    P.schemaEnv.meta || !P.opts.strictTypes || (QA(P, G), P.opts.allowUnionTypes || q(P, G), k(P, P.dataTypes));
  }
  function QA(P, G) {
    if (G.length) {
      if (!P.dataTypes.length) {
        P.dataTypes = G;
        return;
      }
      G.forEach((N) => {
        y(P.dataTypes, N) || K(P, `type "${N}" not allowed by context "${P.dataTypes.join(",")}"`);
      }), u(P, G);
    }
  }
  function q(P, G) {
    G.length > 1 && !(G.length === 2 && G.includes("null")) && K(P, "use allowUnionTypes to allow union type keyword");
  }
  function k(P, G) {
    const N = P.self.RULES.all;
    for (const v in N) {
      const R = N[v];
      if (typeof R == "object" && (0, r.shouldUseRule)(P.schema, R)) {
        const { type: L } = R.definition;
        L.length && !L.some((V) => _(G, V)) && K(P, `missing type "${L.join(",")}" for keyword "${v}"`);
      }
    }
  }
  function _(P, G) {
    return P.includes(G) || G === "number" && P.includes("integer");
  }
  function y(P, G) {
    return P.includes(G) || G === "integer" && P.includes("number");
  }
  function u(P, G) {
    const N = [];
    for (const v of P.dataTypes)
      y(G, v) ? N.push(v) : G.includes("integer") && v === "number" && N.push("integer");
    P.dataTypes = N;
  }
  function K(P, G) {
    const N = P.schemaEnv.baseId + P.errSchemaPath;
    G += ` at "${N}" (strictTypes)`, (0, n.checkStrictMode)(P, G, P.opts.strictTypes);
  }
  class H {
    constructor(G, N, v) {
      if ((0, Q.validateKeywordUsage)(G, N, v), this.gen = G.gen, this.allErrors = G.allErrors, this.keyword = v, this.data = G.data, this.schema = G.schema[v], this.$data = N.$data && G.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(G, this.schema, v, this.$data), this.schemaType = N.schemaType, this.parentSchema = G.schema, this.params = {}, this.it = G, this.def = N, this.$data)
        this.schemaCode = G.gen.const("vSchema", J(this.$data, G));
      else if (this.schemaCode = this.schemaValue, !(0, Q.validSchemaType)(this.schema, N.schemaType, N.allowUndefined))
        throw new Error(`${v} value must be ${JSON.stringify(N.schemaType)}`);
      ("code" in N ? N.trackErrors : N.errors !== !1) && (this.errsCount = G.gen.const("_errs", w.default.errors));
    }
    result(G, N, v) {
      this.failResult((0, s.not)(G), N, v);
    }
    failResult(G, N, v) {
      this.gen.if(G), v ? v() : this.error(), N ? (this.gen.else(), N(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(G, N) {
      this.failResult((0, s.not)(G), void 0, N);
    }
    fail(G) {
      if (G === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(G), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(G) {
      if (!this.$data)
        return this.fail(G);
      const { schemaCode: N } = this;
      this.fail((0, s._)`${N} !== undefined && (${(0, s.or)(this.invalid$data(), G)})`);
    }
    error(G, N, v) {
      if (N) {
        this.setParams(N), this._error(G, v), this.setParams({});
        return;
      }
      this._error(G, v);
    }
    _error(G, N) {
      (G ? E.reportExtraError : E.reportError)(this, this.def.error, N);
    }
    $dataError() {
      (0, E.reportError)(this, this.def.$dataError || E.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, E.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(G) {
      this.allErrors || this.gen.if(G);
    }
    setParams(G, N) {
      N ? Object.assign(this.params, G) : this.params = G;
    }
    block$data(G, N, v = s.nil) {
      this.gen.block(() => {
        this.check$data(G, v), N();
      });
    }
    check$data(G = s.nil, N = s.nil) {
      if (!this.$data)
        return;
      const { gen: v, schemaCode: R, schemaType: L, def: V } = this;
      v.if((0, s.or)((0, s._)`${R} === undefined`, N)), G !== s.nil && v.assign(G, !0), (L.length || V.validateSchema) && (v.elseIf(this.invalid$data()), this.$dataError(), G !== s.nil && v.assign(G, !1)), v.else();
    }
    invalid$data() {
      const { gen: G, schemaCode: N, schemaType: v, def: R, it: L } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (v.length) {
          if (!(N instanceof s.Name))
            throw new Error("ajv implementation error");
          const W = Array.isArray(v) ? v : [v];
          return (0, s._)`${(0, o.checkDataTypes)(W, N, L.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (R.validateSchema) {
          const W = G.scopeValue("validate$data", { ref: R.validateSchema });
          return (0, s._)`!${W}(${N})`;
        }
        return s.nil;
      }
    }
    subschema(G, N) {
      const v = (0, B.getSubschema)(this.it, G);
      (0, B.extendSubschemaData)(v, this.it, G), (0, B.extendSubschemaMode)(v, G);
      const R = { ...this.it, ...v, items: void 0, props: void 0 };
      return I(R, N), R;
    }
    mergeEvaluated(G, N) {
      const { it: v, gen: R } = this;
      v.opts.unevaluated && (v.props !== !0 && G.props !== void 0 && (v.props = n.mergeEvaluated.props(R, G.props, v.props, N)), v.items !== !0 && G.items !== void 0 && (v.items = n.mergeEvaluated.items(R, G.items, v.items, N)));
    }
    mergeValidEvaluated(G, N) {
      const { it: v, gen: R } = this;
      if (v.opts.unevaluated && (v.props !== !0 || v.items !== !0))
        return R.if(N, () => this.mergeEvaluated(G, s.Name)), !0;
    }
  }
  validate.KeywordCxt = H;
  function F(P, G, N, v) {
    const R = new H(P, N, G);
    "code" in N ? N.code(R, v) : R.$data && N.validate ? (0, Q.funcKeywordCode)(R, N) : "macro" in N ? (0, Q.macroKeywordCode)(R, N) : (N.compile || N.validate) && (0, Q.funcKeywordCode)(R, N);
  }
  const b = /^\/(?:[^~]|~0|~1)*$/, Y = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function J(P, { dataLevel: G, dataNames: N, dataPathArr: v }) {
    let R, L;
    if (P === "")
      return w.default.rootData;
    if (P[0] === "/") {
      if (!b.test(P))
        throw new Error(`Invalid JSON-pointer: ${P}`);
      R = P, L = w.default.rootData;
    } else {
      const $ = Y.exec(P);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${P}`);
      const X = +$[1];
      if (R = $[2], R === "#") {
        if (X >= G)
          throw new Error(W("property/index", X));
        return v[G - X];
      }
      if (X > G)
        throw new Error(W("data", X));
      if (L = N[G - X], !R)
        return L;
    }
    let V = L;
    const eA = R.split("/");
    for (const $ of eA)
      $ && (L = (0, s._)`${L}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${L}`);
    return V;
    function W($, X) {
      return `Cannot access ${$} ${X} levels up, current level is ${G}`;
    }
  }
  return validate.getData = J, validate;
}
var validation_error = {}, hasRequiredValidation_error;
function requireValidation_error() {
  if (hasRequiredValidation_error) return validation_error;
  hasRequiredValidation_error = 1, Object.defineProperty(validation_error, "__esModule", { value: !0 });
  class A extends Error {
    constructor(r) {
      super("validation failed"), this.errors = r, this.ajv = this.validation = !0;
    }
  }
  return validation_error.default = A, validation_error;
}
var ref_error = {}, hasRequiredRef_error;
function requireRef_error() {
  if (hasRequiredRef_error) return ref_error;
  hasRequiredRef_error = 1, Object.defineProperty(ref_error, "__esModule", { value: !0 });
  const A = requireResolve();
  class e extends Error {
    constructor(o, i, Q, B) {
      super(B || `can't resolve reference ${Q} from id ${i}`), this.missingRef = (0, A.resolveUrl)(o, i, Q), this.missingSchema = (0, A.normalizeId)((0, A.getFullPath)(o, this.missingRef));
    }
  }
  return ref_error.default = e, ref_error;
}
var compile = {}, hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1, Object.defineProperty(compile, "__esModule", { value: !0 }), compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
  const A = requireCodegen(), e = requireValidation_error(), r = requireNames(), o = requireResolve(), i = requireUtil(), Q = requireValidate();
  class B {
    constructor(C) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let I;
      typeof C.schema == "object" && (I = C.schema), this.schema = C.schema, this.schemaId = C.schemaId, this.root = C.root || this, this.baseId = (t = C.baseId) !== null && t !== void 0 ? t : (0, o.normalizeId)(I?.[C.schemaId || "$id"]), this.schemaPath = C.schemaPath, this.localRefs = C.localRefs, this.meta = C.meta, this.$async = I?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(g) {
    const C = n.call(this, g);
    if (C)
      return C;
    const t = (0, o.getFullPath)(this.opts.uriResolver, g.root.baseId), { es5: I, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: I, lines: c, ownProperties: d });
    let m;
    g.$async && (m = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const p = M.scopeName("validate");
    g.validateName = p;
    const O = {
      gen: M,
      allErrors: this.opts.allErrors,
      data: r.default.data,
      parentData: r.default.parentData,
      parentDataProperty: r.default.parentDataProperty,
      dataNames: [r.default.data],
      dataPathArr: [A.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: M.scopeValue("schema", this.opts.code.source === !0 ? { ref: g.schema, code: (0, A.stringify)(g.schema) } : { ref: g.schema }),
      validateName: p,
      ValidationError: m,
      schema: g.schema,
      schemaEnv: g,
      rootId: t,
      baseId: g.baseId || t,
      schemaPath: A.nil,
      errSchemaPath: g.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, A._)`""`,
      opts: this.opts,
      self: this
    };
    let j;
    try {
      this._compilations.add(g), (0, Q.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const z = M.toString();
      j = `${M.scopeRefs(r.default.scope)}return ${z}`, this.opts.code.process && (j = this.opts.code.process(j, g));
      const S = new Function(`${r.default.self}`, `${r.default.scope}`, j)(this, this.scope.get());
      if (this.scope.value(p, { ref: S }), S.errors = null, S.schema = g.schema, S.schemaEnv = g, g.$async && (S.$async = !0), this.opts.code.source === !0 && (S.source = { validateName: p, validateCode: z, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Z, items: x } = O;
        S.evaluated = {
          props: Z instanceof A.Name ? void 0 : Z,
          items: x instanceof A.Name ? void 0 : x,
          dynamicProps: Z instanceof A.Name,
          dynamicItems: x instanceof A.Name
        }, S.source && (S.source.evaluated = (0, A.stringify)(S.evaluated));
      }
      return g.validate = S, g;
    } catch (z) {
      throw delete g.validate, delete g.validateName, j && this.logger.error("Error compiling schema, function code:", j), z;
    } finally {
      this._compilations.delete(g);
    }
  }
  compile.compileSchema = s;
  function w(g, C, t) {
    var I;
    t = (0, o.resolveUrl)(this.opts.uriResolver, C, t);
    const c = g.refs[t];
    if (c)
      return c;
    let d = l.call(this, g, t);
    if (d === void 0) {
      const M = (I = g.localRefs) === null || I === void 0 ? void 0 : I[t], { schemaId: m } = this.opts;
      M && (d = new B({ schema: M, schemaId: m, root: g, baseId: C }));
    }
    if (d !== void 0)
      return g.refs[t] = a.call(this, d);
  }
  compile.resolveRef = w;
  function a(g) {
    return (0, o.inlineRef)(g.schema, this.opts.inlineRefs) ? g.schema : g.validate ? g : s.call(this, g);
  }
  function n(g) {
    for (const C of this._compilations)
      if (E(C, g))
        return C;
  }
  compile.getCompilingSchema = n;
  function E(g, C) {
    return g.schema === C.schema && g.root === C.root && g.baseId === C.baseId;
  }
  function l(g, C) {
    let t;
    for (; typeof (t = this.refs[C]) == "string"; )
      C = t;
    return t || this.schemas[C] || f.call(this, g, C);
  }
  function f(g, C) {
    const t = this.opts.uriResolver.parse(C), I = (0, o._getFullPath)(this.opts.uriResolver, t);
    let c = (0, o.getFullPath)(this.opts.uriResolver, g.baseId, void 0);
    if (Object.keys(g.schema).length > 0 && I === c)
      return D.call(this, t, g);
    const d = (0, o.normalizeId)(I), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const m = f.call(this, g, M);
      return typeof m?.schema != "object" ? void 0 : D.call(this, t, m);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(C)) {
        const { schema: m } = M, { schemaId: p } = this.opts, O = m[p];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: m, schemaId: p, root: g, baseId: c });
      }
      return D.call(this, t, M);
    }
  }
  compile.resolveSchema = f;
  const h = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function D(g, { baseId: C, schema: t, root: I }) {
    var c;
    if (((c = g.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const m of g.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const p = t[(0, i.unescapeFragment)(m)];
      if (p === void 0)
        return;
      t = p;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !h.has(m) && O && (C = (0, o.resolveUrl)(this.opts.uriResolver, C, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const m = (0, o.resolveUrl)(this.opts.uriResolver, C, t.$ref);
      d = f.call(this, I, m);
    }
    const { schemaId: M } = this.opts;
    if (d = d || new B({ schema: t, schemaId: M, root: I, baseId: C }), d.schema !== d.root.schema)
      return d;
  }
  return compile;
}
const $id$1 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", description = "Meta-schema for $data reference (JSON AnySchema extension proposal)", type$1 = "object", required$1 = ["$data"], properties$2 = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, additionalProperties$1 = !1, require$$9 = {
  $id: $id$1,
  description,
  type: type$1,
  required: required$1,
  properties: properties$2,
  additionalProperties: additionalProperties$1
};
var uri = {}, fastUri = { exports: {} }, scopedChars, hasRequiredScopedChars;
function requireScopedChars() {
  return hasRequiredScopedChars || (hasRequiredScopedChars = 1, scopedChars = {
    HEX: {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      a: 10,
      A: 10,
      b: 11,
      B: 11,
      c: 12,
      C: 12,
      d: 13,
      D: 13,
      e: 14,
      E: 14,
      f: 15,
      F: 15
    }
  }), scopedChars;
}
var utils, hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  const { HEX: A } = requireScopedChars(), e = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u;
  function r(D) {
    if (s(D, ".") < 3)
      return { host: D, isIPV4: !1 };
    const g = D.match(e) || [], [C] = g;
    return C ? { host: B(C, "."), isIPV4: !0 } : { host: D, isIPV4: !1 };
  }
  function o(D, g = !1) {
    let C = "", t = !0;
    for (const I of D) {
      if (A[I] === void 0) return;
      I !== "0" && t === !0 && (t = !1), t || (C += I);
    }
    return g && C.length === 0 && (C = "0"), C;
  }
  function i(D) {
    let g = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], I = [];
    let c = !1, d = !1, M = !1;
    function m() {
      if (I.length) {
        if (c === !1) {
          const p = o(I);
          if (p !== void 0)
            t.push(p);
          else
            return C.error = !0, !1;
        }
        I.length = 0;
      }
      return !0;
    }
    for (let p = 0; p < D.length; p++) {
      const O = D[p];
      if (!(O === "[" || O === "]"))
        if (O === ":") {
          if (d === !0 && (M = !0), !m())
            break;
          if (g++, t.push(":"), g > 7) {
            C.error = !0;
            break;
          }
          p - 1 >= 0 && D[p - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!m())
            break;
          c = !0;
        } else {
          I.push(O);
          continue;
        }
    }
    return I.length && (c ? C.zone = I.join("") : M ? t.push(I.join("")) : t.push(o(I))), C.address = t.join(""), C;
  }
  function Q(D) {
    if (s(D, ":") < 2)
      return { host: D, isIPV6: !1 };
    const g = i(D);
    if (g.error)
      return { host: D, isIPV6: !1 };
    {
      let C = g.address, t = g.address;
      return g.zone && (C += "%" + g.zone, t += "%25" + g.zone), { host: C, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(D, g) {
    let C = "", t = !0;
    const I = D.length;
    for (let c = 0; c < I; c++) {
      const d = D[c];
      d === "0" && t ? (c + 1 <= I && D[c + 1] === g || c + 1 === I) && (C += d, t = !1) : (d === g ? t = !0 : t = !1, C += d);
    }
    return C;
  }
  function s(D, g) {
    let C = 0;
    for (let t = 0; t < D.length; t++)
      D[t] === g && C++;
    return C;
  }
  const w = /^\.\.?\//u, a = /^\/\.(?:\/|$)/u, n = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(D) {
    const g = [];
    for (; D.length; )
      if (D.match(w))
        D = D.replace(w, "");
      else if (D.match(a))
        D = D.replace(a, "/");
      else if (D.match(n))
        D = D.replace(n, "/"), g.pop();
      else if (D === "." || D === "..")
        D = "";
      else {
        const C = D.match(E);
        if (C) {
          const t = C[0];
          D = D.slice(t.length), g.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return g.join("");
  }
  function f(D, g) {
    const C = g !== !0 ? escape : unescape;
    return D.scheme !== void 0 && (D.scheme = C(D.scheme)), D.userinfo !== void 0 && (D.userinfo = C(D.userinfo)), D.host !== void 0 && (D.host = C(D.host)), D.path !== void 0 && (D.path = C(D.path)), D.query !== void 0 && (D.query = C(D.query)), D.fragment !== void 0 && (D.fragment = C(D.fragment)), D;
  }
  function h(D) {
    const g = [];
    if (D.userinfo !== void 0 && (g.push(D.userinfo), g.push("@")), D.host !== void 0) {
      let C = unescape(D.host);
      const t = r(C);
      if (t.isIPV4)
        C = t.host;
      else {
        const I = Q(t.host);
        I.isIPV6 === !0 ? C = `[${I.escapedHost}]` : C = D.host;
      }
      g.push(C);
    }
    return (typeof D.port == "number" || typeof D.port == "string") && (g.push(":"), g.push(String(D.port))), g.length ? g.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: h,
    normalizeComponentEncoding: f,
    removeDotSegments: l,
    normalizeIPv4: r,
    normalizeIPv6: Q,
    stringArrayToHexStripped: o
  }, utils;
}
var schemes, hasRequiredSchemes;
function requireSchemes() {
  if (hasRequiredSchemes) return schemes;
  hasRequiredSchemes = 1;
  const A = /^[\da-f]{8}\b-[\da-f]{4}\b-[\da-f]{4}\b-[\da-f]{4}\b-[\da-f]{12}$/iu, e = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  function r(t) {
    return typeof t.secure == "boolean" ? t.secure : String(t.scheme).toLowerCase() === "wss";
  }
  function o(t) {
    return t.host || (t.error = t.error || "HTTP URIs must have a host."), t;
  }
  function i(t) {
    const I = String(t.scheme).toLowerCase() === "https";
    return (t.port === (I ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function Q(t) {
    return t.secure = r(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
  }
  function B(t) {
    if ((t.port === (r(t) ? 443 : 80) || t.port === "") && (t.port = void 0), typeof t.secure == "boolean" && (t.scheme = t.secure ? "wss" : "ws", t.secure = void 0), t.resourceName) {
      const [I, c] = t.resourceName.split("?");
      t.path = I && I !== "/" ? I : void 0, t.query = c, t.resourceName = void 0;
    }
    return t.fragment = void 0, t;
  }
  function s(t, I) {
    if (!t.path)
      return t.error = "URN can not be parsed", t;
    const c = t.path.match(e);
    if (c) {
      const d = I.scheme || t.scheme || "urn";
      t.nid = c[1].toLowerCase(), t.nss = c[2];
      const M = `${d}:${I.nid || t.nid}`, m = C[M];
      t.path = void 0, m && (t = m.parse(t, I));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function w(t, I) {
    const c = I.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${I.nid || d}`, m = C[M];
    m && (t = m.serialize(t, I));
    const p = t, O = t.nss;
    return p.path = `${d || I.nid}:${O}`, I.skipEscape = !0, p;
  }
  function a(t, I) {
    const c = t;
    return c.uuid = c.nss, c.nss = void 0, !I.tolerant && (!c.uuid || !A.test(c.uuid)) && (c.error = c.error || "UUID is not valid."), c;
  }
  function n(t) {
    const I = t;
    return I.nss = (t.uuid || "").toLowerCase(), I;
  }
  const E = {
    scheme: "http",
    domainHost: !0,
    parse: o,
    serialize: i
  }, l = {
    scheme: "https",
    domainHost: E.domainHost,
    parse: o,
    serialize: i
  }, f = {
    scheme: "ws",
    domainHost: !0,
    parse: Q,
    serialize: B
  }, h = {
    scheme: "wss",
    domainHost: f.domainHost,
    parse: f.parse,
    serialize: f.serialize
  }, C = {
    http: E,
    https: l,
    ws: f,
    wss: h,
    urn: {
      scheme: "urn",
      parse: s,
      serialize: w,
      skipNormalize: !0
    },
    "urn:uuid": {
      scheme: "urn:uuid",
      parse: a,
      serialize: n,
      skipNormalize: !0
    }
  };
  return schemes = C, schemes;
}
var hasRequiredFastUri;
function requireFastUri() {
  if (hasRequiredFastUri) return fastUri.exports;
  hasRequiredFastUri = 1;
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: o, normalizeComponentEncoding: i } = requireUtils(), Q = requireSchemes();
  function B(g, C) {
    return typeof g == "string" ? g = n(h(g, C), C) : typeof g == "object" && (g = h(n(g, C), C)), g;
  }
  function s(g, C, t) {
    const I = Object.assign({ scheme: "null" }, t), c = w(h(g, I), h(C, I), I, !0);
    return n(c, { ...I, skipEscape: !0 });
  }
  function w(g, C, t, I) {
    const c = {};
    return I || (g = h(n(g, t), t), C = h(n(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((g.userinfo !== void 0 || g.host !== void 0 || g.port !== void 0) && !g.path ? c.path = "/" + C.path : g.path ? c.path = g.path.slice(0, g.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = g.path, C.query !== void 0 ? c.query = C.query : c.query = g.query), c.userinfo = g.userinfo, c.host = g.host, c.port = g.port), c.scheme = g.scheme), c.fragment = C.fragment, c;
  }
  function a(g, C, t) {
    return typeof g == "string" ? (g = unescape(g), g = n(i(h(g, t), !0), { ...t, skipEscape: !0 })) : typeof g == "object" && (g = n(i(g, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = n(i(h(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = n(i(C, !0), { ...t, skipEscape: !0 })), g.toLowerCase() === C.toLowerCase();
  }
  function n(g, C) {
    const t = {
      host: g.host,
      scheme: g.scheme,
      userinfo: g.userinfo,
      port: g.port,
      path: g.path,
      query: g.query,
      nid: g.nid,
      nss: g.nss,
      uuid: g.uuid,
      fragment: g.fragment,
      reference: g.reference,
      resourceName: g.resourceName,
      secure: g.secure,
      error: ""
    }, I = Object.assign({}, C), c = [], d = Q[(I.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, I), t.path !== void 0 && (I.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), I.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = o(t);
    if (M !== void 0 && (I.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let m = t.path;
      !I.absolutePath && (!d || !d.absolutePath) && (m = r(m)), M === void 0 && (m = m.replace(/^\/\//u, "/%2F")), c.push(m);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (g, C) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(C)));
  function l(g) {
    let C = 0;
    for (let t = 0, I = g.length; t < I; ++t)
      if (C = g.charCodeAt(t), C > 126 || E[C])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function h(g, C) {
    const t = Object.assign({}, C), I = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    }, c = g.indexOf("%") !== -1;
    let d = !1;
    t.reference === "suffix" && (g = (t.scheme ? t.scheme + ":" : "") + "//" + g);
    const M = g.match(f);
    if (M) {
      if (I.scheme = M[1], I.userinfo = M[3], I.host = M[4], I.port = parseInt(M[5], 10), I.path = M[6] || "", I.query = M[7], I.fragment = M[8], isNaN(I.port) && (I.port = M[5]), I.host) {
        const p = e(I.host);
        if (p.isIPV4 === !1) {
          const O = A(p.host);
          I.host = O.host.toLowerCase(), d = O.isIPV6;
        } else
          I.host = p.host, d = !0;
      }
      I.scheme === void 0 && I.userinfo === void 0 && I.host === void 0 && I.port === void 0 && !I.path && I.query === void 0 ? I.reference = "same-document" : I.scheme === void 0 ? I.reference = "relative" : I.fragment === void 0 ? I.reference = "absolute" : I.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== I.reference && (I.error = I.error || "URI is not a " + t.reference + " reference.");
      const m = Q[(t.scheme || I.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!m || !m.unicodeSupport) && I.host && (t.domainHost || m && m.domainHost) && d === !1 && l(I.host))
        try {
          I.host = URL.domainToASCII(I.host.toLowerCase());
        } catch (p) {
          I.error = I.error || "Host's domain name can not be converted to ASCII: " + p;
        }
      (!m || m && !m.skipNormalize) && (c && I.scheme !== void 0 && (I.scheme = unescape(I.scheme)), c && I.host !== void 0 && (I.host = unescape(I.host)), I.path && I.path.length && (I.path = escape(unescape(I.path))), I.fragment && I.fragment.length && (I.fragment = encodeURI(decodeURIComponent(I.fragment)))), m && m.parse && m.parse(I, t);
    } else
      I.error = I.error || "URI can not be parsed.";
    return I;
  }
  const D = {
    SCHEMES: Q,
    normalize: B,
    resolve: s,
    resolveComponents: w,
    equal: a,
    serialize: n,
    parse: h
  };
  return fastUri.exports = D, fastUri.exports.default = D, fastUri.exports.fastUri = D, fastUri.exports;
}
var hasRequiredUri;
function requireUri() {
  if (hasRequiredUri) return uri;
  hasRequiredUri = 1, Object.defineProperty(uri, "__esModule", { value: !0 });
  const A = requireFastUri();
  return A.code = 'require("ajv/dist/runtime/uri").default', uri.default = A, uri;
}
var hasRequiredCore$1;
function requireCore$1() {
  return hasRequiredCore$1 || (hasRequiredCore$1 = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.CodeGen = A.Name = A.nil = A.stringify = A.str = A._ = A.KeywordCxt = void 0;
    var e = requireValidate();
    Object.defineProperty(A, "KeywordCxt", { enumerable: !0, get: function() {
      return e.KeywordCxt;
    } });
    var r = requireCodegen();
    Object.defineProperty(A, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(A, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(A, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(A, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(A, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } }), Object.defineProperty(A, "CodeGen", { enumerable: !0, get: function() {
      return r.CodeGen;
    } });
    const o = requireValidation_error(), i = requireRef_error(), Q = requireRules(), B = requireCompile(), s = requireCodegen(), w = requireResolve(), a = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (q, k) => new RegExp(q, k);
    f.code = "new RegExp";
    const h = ["removeAdditional", "useDefaults", "coerceTypes"], D = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), g = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, C = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, t = 200;
    function I(q) {
      var k, _, y, u, K, H, F, b, Y, J, P, G, N, v, R, L, V, eA, W, $, X, iA, AA, tA, sA;
      const BA = q.strict, wA = (k = q.code) === null || k === void 0 ? void 0 : k.optimize, aA = wA === !0 || wA === void 0 ? 1 : wA || 0, gA = (y = (_ = q.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && y !== void 0 ? y : f, IA = (u = q.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (H = (K = q.strictSchema) !== null && K !== void 0 ? K : BA) !== null && H !== void 0 ? H : !0,
        strictNumbers: (b = (F = q.strictNumbers) !== null && F !== void 0 ? F : BA) !== null && b !== void 0 ? b : !0,
        strictTypes: (J = (Y = q.strictTypes) !== null && Y !== void 0 ? Y : BA) !== null && J !== void 0 ? J : "log",
        strictTuples: (G = (P = q.strictTuples) !== null && P !== void 0 ? P : BA) !== null && G !== void 0 ? G : "log",
        strictRequired: (v = (N = q.strictRequired) !== null && N !== void 0 ? N : BA) !== null && v !== void 0 ? v : !1,
        code: q.code ? { ...q.code, optimize: aA, regExp: gA } : { optimize: aA, regExp: gA },
        loopRequired: (R = q.loopRequired) !== null && R !== void 0 ? R : t,
        loopEnum: (L = q.loopEnum) !== null && L !== void 0 ? L : t,
        meta: (V = q.meta) !== null && V !== void 0 ? V : !0,
        messages: (eA = q.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (W = q.inlineRefs) !== null && W !== void 0 ? W : !0,
        schemaId: ($ = q.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (X = q.addUsedSchema) !== null && X !== void 0 ? X : !0,
        validateSchema: (iA = q.validateSchema) !== null && iA !== void 0 ? iA : !0,
        validateFormats: (AA = q.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = q.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = q.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: IA
      };
    }
    class c {
      constructor(k = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), k = this.opts = { ...k, ...I(k) };
        const { es5: _, lines: y } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: D, es5: _, lines: y }), this.logger = U(k.logger);
        const u = k.validateFormats;
        k.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, g, k, "NOT SUPPORTED"), d.call(this, C, k, "DEPRECATED", "warn"), this._metaOpts = j.call(this), k.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), k.keywords && O.call(this, k.keywords), typeof k.meta == "object" && this.addMetaSchema(k.meta), m.call(this), k.validateFormats = u;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: k, meta: _, schemaId: y } = this.opts;
        let u = E;
        y === "id" && (u = { ...E }, u.id = u.$id, delete u.$id), _ && k && this.addMetaSchema(u, u[y], !1);
      }
      defaultMeta() {
        const { meta: k, schemaId: _ } = this.opts;
        return this.opts.defaultMeta = typeof k == "object" ? k[_] || k : void 0;
      }
      validate(k, _) {
        let y;
        if (typeof k == "string") {
          if (y = this.getSchema(k), !y)
            throw new Error(`no schema with key or ref "${k}"`);
        } else
          y = this.compile(k);
        const u = y(_);
        return "$async" in y || (this.errors = y.errors), u;
      }
      compile(k, _) {
        const y = this._addSchema(k, _);
        return y.validate || this._compileSchemaEnv(y);
      }
      compileAsync(k, _) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: y } = this.opts;
        return u.call(this, k, _);
        async function u(J, P) {
          await K.call(this, J.$schema);
          const G = this._addSchema(J, P);
          return G.validate || H.call(this, G);
        }
        async function K(J) {
          J && !this.getSchema(J) && await u.call(this, { $ref: J }, !0);
        }
        async function H(J) {
          try {
            return this._compileSchemaEnv(J);
          } catch (P) {
            if (!(P instanceof i.default))
              throw P;
            return F.call(this, P), await b.call(this, P.missingSchema), H.call(this, J);
          }
        }
        function F({ missingSchema: J, missingRef: P }) {
          if (this.refs[J])
            throw new Error(`AnySchema ${J} is loaded but ${P} cannot be resolved`);
        }
        async function b(J) {
          const P = await Y.call(this, J);
          this.refs[J] || await K.call(this, P.$schema), this.refs[J] || this.addSchema(P, J, _);
        }
        async function Y(J) {
          const P = this._loading[J];
          if (P)
            return P;
          try {
            return await (this._loading[J] = y(J));
          } finally {
            delete this._loading[J];
          }
        }
      }
      // Adds schema to the instance
      addSchema(k, _, y, u = this.opts.validateSchema) {
        if (Array.isArray(k)) {
          for (const H of k)
            this.addSchema(H, void 0, y, u);
          return this;
        }
        let K;
        if (typeof k == "object") {
          const { schemaId: H } = this.opts;
          if (K = k[H], K !== void 0 && typeof K != "string")
            throw new Error(`schema ${H} must be string`);
        }
        return _ = (0, w.normalizeId)(_ || K), this._checkUnique(_), this.schemas[_] = this._addSchema(k, y, _, u, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(k, _, y = this.opts.validateSchema) {
        return this.addSchema(k, _, !0, y), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(k, _) {
        if (typeof k == "boolean")
          return !0;
        let y;
        if (y = k.$schema, y !== void 0 && typeof y != "string")
          throw new Error("$schema must be a string");
        if (y = y || this.opts.defaultMeta || this.defaultMeta(), !y)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const u = this.validate(y, k);
        if (!u && _) {
          const K = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(K);
          else
            throw new Error(K);
        }
        return u;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(k) {
        let _;
        for (; typeof (_ = M.call(this, k)) == "string"; )
          k = _;
        if (_ === void 0) {
          const { schemaId: y } = this.opts, u = new B.SchemaEnv({ schema: {}, schemaId: y });
          if (_ = B.resolveSchema.call(this, u, k), !_)
            return;
          this.refs[k] = _;
        }
        return _.validate || this._compileSchemaEnv(_);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(k) {
        if (k instanceof RegExp)
          return this._removeAllSchemas(this.schemas, k), this._removeAllSchemas(this.refs, k), this;
        switch (typeof k) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const _ = M.call(this, k);
            return typeof _ == "object" && this._cache.delete(_.schema), delete this.schemas[k], delete this.refs[k], this;
          }
          case "object": {
            const _ = k;
            this._cache.delete(_);
            let y = k[this.opts.schemaId];
            return y && (y = (0, w.normalizeId)(y), delete this.schemas[y], delete this.refs[y]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(k) {
        for (const _ of k)
          this.addKeyword(_);
        return this;
      }
      addKeyword(k, _) {
        let y;
        if (typeof k == "string")
          y = k, typeof _ == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), _.keyword = y);
        else if (typeof k == "object" && _ === void 0) {
          if (_ = k, y = _.keyword, Array.isArray(y) && !y.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (Z.call(this, y, _), !_)
          return (0, n.eachItem)(y, (K) => x.call(this, K)), this;
        oA.call(this, _);
        const u = {
          ..._,
          type: (0, a.getJSONTypes)(_.type),
          schemaType: (0, a.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(y, u.type.length === 0 ? (K) => x.call(this, K, u) : (K) => u.type.forEach((H) => x.call(this, K, u, H))), this;
      }
      getKeyword(k) {
        const _ = this.RULES.all[k];
        return typeof _ == "object" ? _.definition : !!_;
      }
      // Remove keyword
      removeKeyword(k) {
        const { RULES: _ } = this;
        delete _.keywords[k], delete _.all[k];
        for (const y of _.rules) {
          const u = y.rules.findIndex((K) => K.keyword === k);
          u >= 0 && y.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(k, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[k] = _, this;
      }
      errorsText(k = this.errors, { separator: _ = ", ", dataVar: y = "data" } = {}) {
        return !k || k.length === 0 ? "No errors" : k.map((u) => `${y}${u.instancePath} ${u.message}`).reduce((u, K) => u + _ + K);
      }
      $dataMetaSchema(k, _) {
        const y = this.RULES.all;
        k = JSON.parse(JSON.stringify(k));
        for (const u of _) {
          const K = u.split("/").slice(1);
          let H = k;
          for (const F of K)
            H = H[F];
          for (const F in y) {
            const b = y[F];
            if (typeof b != "object")
              continue;
            const { $data: Y } = b.definition, J = H[F];
            Y && J && (H[F] = QA(J));
          }
        }
        return k;
      }
      _removeAllSchemas(k, _) {
        for (const y in k) {
          const u = k[y];
          (!_ || _.test(y)) && (typeof u == "string" ? delete k[y] : u && !u.meta && (this._cache.delete(u.schema), delete k[y]));
        }
      }
      _addSchema(k, _, y, u = this.opts.validateSchema, K = this.opts.addUsedSchema) {
        let H;
        const { schemaId: F } = this.opts;
        if (typeof k == "object")
          H = k[F];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof k != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let b = this._cache.get(k);
        if (b !== void 0)
          return b;
        y = (0, w.normalizeId)(H || y);
        const Y = w.getSchemaRefs.call(this, k, y);
        return b = new B.SchemaEnv({ schema: k, schemaId: F, meta: _, baseId: y, localRefs: Y }), this._cache.set(b.schema, b), K && !y.startsWith("#") && (y && this._checkUnique(y), this.refs[y] = b), u && this.validateSchema(k, !0), b;
      }
      _checkUnique(k) {
        if (this.schemas[k] || this.refs[k])
          throw new Error(`schema with key or id "${k}" already exists`);
      }
      _compileSchemaEnv(k) {
        if (k.meta ? this._compileMetaSchema(k) : B.compileSchema.call(this, k), !k.validate)
          throw new Error("ajv implementation error");
        return k.validate;
      }
      _compileMetaSchema(k) {
        const _ = this.opts;
        this.opts = this._metaOpts;
        try {
          B.compileSchema.call(this, k);
        } finally {
          this.opts = _;
        }
      }
    }
    c.ValidationError = o.default, c.MissingRefError = i.default, A.default = c;
    function d(q, k, _, y = "error") {
      for (const u in q) {
        const K = u;
        K in k && this.logger[y](`${_}: option ${u}. ${q[K]}`);
      }
    }
    function M(q) {
      return q = (0, w.normalizeId)(q), this.schemas[q] || this.refs[q];
    }
    function m() {
      const q = this.opts.schemas;
      if (q)
        if (Array.isArray(q))
          this.addSchema(q);
        else
          for (const k in q)
            this.addSchema(q[k], k);
    }
    function p() {
      for (const q in this.opts.formats) {
        const k = this.opts.formats[q];
        k && this.addFormat(q, k);
      }
    }
    function O(q) {
      if (Array.isArray(q)) {
        this.addVocabulary(q);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const k in q) {
        const _ = q[k];
        _.keyword || (_.keyword = k), this.addKeyword(_);
      }
    }
    function j() {
      const q = { ...this.opts };
      for (const k of h)
        delete q[k];
      return q;
    }
    const z = { log() {
    }, warn() {
    }, error() {
    } };
    function U(q) {
      if (q === !1)
        return z;
      if (q === void 0)
        return console;
      if (q.log && q.warn && q.error)
        return q;
      throw new Error("logger must implement log, warn and error methods");
    }
    const S = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Z(q, k) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(q, (y) => {
        if (_.keywords[y])
          throw new Error(`Keyword ${y} is already defined`);
        if (!S.test(y))
          throw new Error(`Keyword ${y} has invalid name`);
      }), !!k && k.$data && !("code" in k || "validate" in k))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function x(q, k, _) {
      var y;
      const u = k?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: K } = this;
      let H = u ? K.post : K.rules.find(({ type: b }) => b === _);
      if (H || (H = { type: _, rules: [] }, K.rules.push(H)), K.keywords[q] = !0, !k)
        return;
      const F = {
        keyword: q,
        definition: {
          ...k,
          type: (0, a.getJSONTypes)(k.type),
          schemaType: (0, a.getJSONTypes)(k.schemaType)
        }
      };
      k.before ? rA.call(this, H, F, k.before) : H.rules.push(F), K.all[q] = F, (y = k.implements) === null || y === void 0 || y.forEach((b) => this.addKeyword(b));
    }
    function rA(q, k, _) {
      const y = q.rules.findIndex((u) => u.keyword === _);
      y >= 0 ? q.rules.splice(y, 0, k) : (q.rules.push(k), this.logger.warn(`rule ${_} is not defined`));
    }
    function oA(q) {
      let { metaSchema: k } = q;
      k !== void 0 && (q.$data && this.opts.$data && (k = QA(k)), q.validateSchema = this.compile(k, !0));
    }
    const T = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function QA(q) {
      return { anyOf: [q, T] };
    }
  })(core$1)), core$1;
}
var draft7 = {}, core = {}, id = {}, hasRequiredId;
function requireId() {
  if (hasRequiredId) return id;
  hasRequiredId = 1, Object.defineProperty(id, "__esModule", { value: !0 });
  const A = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return id.default = A, id;
}
var ref = {}, hasRequiredRef;
function requireRef() {
  if (hasRequiredRef) return ref;
  hasRequiredRef = 1, Object.defineProperty(ref, "__esModule", { value: !0 }), ref.callRef = ref.getValidate = void 0;
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), o = requireNames(), i = requireCompile(), Q = requireUtil(), B = {
    keyword: "$ref",
    schemaType: "string",
    code(a) {
      const { gen: n, schema: E, it: l } = a, { baseId: f, schemaEnv: h, validateName: D, opts: g, self: C } = l, { root: t } = h;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const I = i.resolveRef.call(C, t, f, E);
      if (I === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (I instanceof i.SchemaEnv)
        return d(I);
      return M(I);
      function c() {
        if (h === t)
          return w(a, D, h, h.$async);
        const m = n.scopeValue("root", { ref: t });
        return w(a, (0, r._)`${m}.validate`, t, t.$async);
      }
      function d(m) {
        const p = s(a, m);
        w(a, p, m, m.$async);
      }
      function M(m) {
        const p = n.scopeValue("schema", g.code.source === !0 ? { ref: m, code: (0, r.stringify)(m) } : { ref: m }), O = n.name("valid"), j = a.subschema({
          schema: m,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: p,
          errSchemaPath: E
        }, O);
        a.mergeEvaluated(j), a.ok(O);
      }
    }
  };
  function s(a, n) {
    const { gen: E } = a;
    return n.validate ? E.scopeValue("validate", { ref: n.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: n })}.validate`;
  }
  ref.getValidate = s;
  function w(a, n, E, l) {
    const { gen: f, it: h } = a, { allErrors: D, schemaEnv: g, opts: C } = h, t = C.passContext ? o.default.this : r.nil;
    l ? I() : c();
    function I() {
      if (!g.$async)
        throw new Error("async schema referenced by sync schema");
      const m = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(a, n, t)}`), M(n), D || f.assign(m, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${h.ValidationError})`, () => f.throw(p)), d(p), D || f.assign(m, !1);
      }), a.ok(m);
    }
    function c() {
      a.result((0, e.callValidateCode)(a, n, t), () => M(n), () => d(n));
    }
    function d(m) {
      const p = (0, r._)`${m}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${p} : ${o.default.vErrors}.concat(${p})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(m) {
      var p;
      if (!h.opts.unevaluated)
        return;
      const O = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (h.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (h.props = Q.mergeEvaluated.props(f, O.props, h.props));
        else {
          const j = f.var("props", (0, r._)`${m}.evaluated.props`);
          h.props = Q.mergeEvaluated.props(f, j, h.props, r.Name);
        }
      if (h.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (h.items = Q.mergeEvaluated.items(f, O.items, h.items));
        else {
          const j = f.var("items", (0, r._)`${m}.evaluated.items`);
          h.items = Q.mergeEvaluated.items(f, j, h.items, r.Name);
        }
    }
  }
  return ref.callRef = w, ref.default = B, ref;
}
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1, Object.defineProperty(core, "__esModule", { value: !0 });
  const A = requireId(), e = requireRef(), r = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    A.default,
    e.default
  ];
  return core.default = r, core;
}
var validation = {}, limitNumber = {}, hasRequiredLimitNumber;
function requireLimitNumber() {
  if (hasRequiredLimitNumber) return limitNumber;
  hasRequiredLimitNumber = 1, Object.defineProperty(limitNumber, "__esModule", { value: !0 });
  const A = requireCodegen(), e = A.operators, r = {
    maximum: { okStr: "<=", ok: e.LTE, fail: e.GT },
    minimum: { okStr: ">=", ok: e.GTE, fail: e.LT },
    exclusiveMaximum: { okStr: "<", ok: e.LT, fail: e.GTE },
    exclusiveMinimum: { okStr: ">", ok: e.GT, fail: e.LTE }
  }, o = {
    message: ({ keyword: Q, schemaCode: B }) => (0, A.str)`must be ${r[Q].okStr} ${B}`,
    params: ({ keyword: Q, schemaCode: B }) => (0, A._)`{comparison: ${r[Q].okStr}, limit: ${B}}`
  }, i = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: o,
    code(Q) {
      const { keyword: B, data: s, schemaCode: w } = Q;
      Q.fail$data((0, A._)`${s} ${r[B].fail} ${w} || isNaN(${s})`);
    }
  };
  return limitNumber.default = i, limitNumber;
}
var multipleOf = {}, hasRequiredMultipleOf;
function requireMultipleOf() {
  if (hasRequiredMultipleOf) return multipleOf;
  hasRequiredMultipleOf = 1, Object.defineProperty(multipleOf, "__esModule", { value: !0 });
  const A = requireCodegen(), r = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: o }) => (0, A.str)`must be multiple of ${o}`,
      params: ({ schemaCode: o }) => (0, A._)`{multipleOf: ${o}}`
    },
    code(o) {
      const { gen: i, data: Q, schemaCode: B, it: s } = o, w = s.opts.multipleOfPrecision, a = i.let("res"), n = w ? (0, A._)`Math.abs(Math.round(${a}) - ${a}) > 1e-${w}` : (0, A._)`${a} !== parseInt(${a})`;
      o.fail$data((0, A._)`(${B} === 0 || (${a} = ${Q}/${B}, ${n}))`);
    }
  };
  return multipleOf.default = r, multipleOf;
}
var limitLength = {}, ucs2length = {}, hasRequiredUcs2length;
function requireUcs2length() {
  if (hasRequiredUcs2length) return ucs2length;
  hasRequiredUcs2length = 1, Object.defineProperty(ucs2length, "__esModule", { value: !0 });
  function A(e) {
    const r = e.length;
    let o = 0, i = 0, Q;
    for (; i < r; )
      o++, Q = e.charCodeAt(i++), Q >= 55296 && Q <= 56319 && i < r && (Q = e.charCodeAt(i), (Q & 64512) === 56320 && i++);
    return o;
  }
  return ucs2length.default = A, A.code = 'require("ajv/dist/runtime/ucs2length").default', ucs2length;
}
var hasRequiredLimitLength;
function requireLimitLength() {
  if (hasRequiredLimitLength) return limitLength;
  hasRequiredLimitLength = 1, Object.defineProperty(limitLength, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireUcs2length(), i = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: Q, schemaCode: B }) {
        const s = Q === "maxLength" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${s} than ${B} characters`;
      },
      params: ({ schemaCode: Q }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { keyword: B, data: s, schemaCode: w, it: a } = Q, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = a.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(Q.gen, r.default)}(${s})`;
      Q.fail$data((0, A._)`${E} ${n} ${w}`);
    }
  };
  return limitLength.default = i, limitLength;
}
var pattern = {}, hasRequiredPattern;
function requirePattern() {
  if (hasRequiredPattern) return pattern;
  hasRequiredPattern = 1, Object.defineProperty(pattern, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), o = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: i }) => (0, e.str)`must match pattern "${i}"`,
      params: ({ schemaCode: i }) => (0, e._)`{pattern: ${i}}`
    },
    code(i) {
      const { data: Q, $data: B, schema: s, schemaCode: w, it: a } = i, n = a.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${w}, ${n}))` : (0, A.usePattern)(i, s);
      i.fail$data((0, e._)`!${E}.test(${Q})`);
    }
  };
  return pattern.default = o, pattern;
}
var limitProperties = {}, hasRequiredLimitProperties;
function requireLimitProperties() {
  if (hasRequiredLimitProperties) return limitProperties;
  hasRequiredLimitProperties = 1, Object.defineProperty(limitProperties, "__esModule", { value: !0 });
  const A = requireCodegen(), r = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: o, schemaCode: i }) {
        const Q = o === "maxProperties" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${Q} than ${i} properties`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: i, data: Q, schemaCode: B } = o, s = i === "maxProperties" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`Object.keys(${Q}).length ${s} ${B}`);
    }
  };
  return limitProperties.default = r, limitProperties;
}
var required = {}, hasRequiredRequired;
function requireRequired() {
  if (hasRequiredRequired) return required;
  hasRequiredRequired = 1, Object.defineProperty(required, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), i = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: Q } }) => (0, e.str)`must have required property '${Q}'`,
      params: ({ params: { missingProperty: Q } }) => (0, e._)`{missingProperty: ${Q}}`
    },
    code(Q) {
      const { gen: B, schema: s, schemaCode: w, data: a, $data: n, it: E } = Q, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? h() : D(), l.strictRequired) {
        const t = Q.parentSchema.properties, { definedProperties: I } = Q.it;
        for (const c of s)
          if (t?.[c] === void 0 && !I.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function h() {
        if (f || n)
          Q.block$data(e.nil, g);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(Q, t);
      }
      function D() {
        const t = B.let("missing");
        if (f || n) {
          const I = B.let("valid", !0);
          Q.block$data(I, () => C(t, I)), Q.ok(I);
        } else
          B.if((0, A.checkMissingProp)(Q, s, t)), (0, A.reportMissingProp)(Q, t), B.else();
      }
      function g() {
        B.forOf("prop", w, (t) => {
          Q.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, a, t, l.ownProperties), () => Q.error());
        });
      }
      function C(t, I) {
        Q.setParams({ missingProperty: t }), B.forOf(t, w, () => {
          B.assign(I, (0, A.propertyInData)(B, a, t, l.ownProperties)), B.if((0, e.not)(I), () => {
            Q.error(), B.break();
          });
        }, e.nil);
      }
    }
  };
  return required.default = i, required;
}
var limitItems = {}, hasRequiredLimitItems;
function requireLimitItems() {
  if (hasRequiredLimitItems) return limitItems;
  hasRequiredLimitItems = 1, Object.defineProperty(limitItems, "__esModule", { value: !0 });
  const A = requireCodegen(), r = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: o, schemaCode: i }) {
        const Q = o === "maxItems" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${Q} than ${i} items`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: i, data: Q, schemaCode: B } = o, s = i === "maxItems" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`${Q}.length ${s} ${B}`);
    }
  };
  return limitItems.default = r, limitItems;
}
var uniqueItems = {}, equal = {}, hasRequiredEqual;
function requireEqual() {
  if (hasRequiredEqual) return equal;
  hasRequiredEqual = 1, Object.defineProperty(equal, "__esModule", { value: !0 });
  const A = requireFastDeepEqual();
  return A.code = 'require("ajv/dist/runtime/equal").default', equal.default = A, equal;
}
var hasRequiredUniqueItems;
function requireUniqueItems() {
  if (hasRequiredUniqueItems) return uniqueItems;
  hasRequiredUniqueItems = 1, Object.defineProperty(uniqueItems, "__esModule", { value: !0 });
  const A = requireDataType(), e = requireCodegen(), r = requireUtil(), o = requireEqual(), Q = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: B, j: s } }) => (0, e.str)`must NOT have duplicate items (items ## ${s} and ${B} are identical)`,
      params: ({ params: { i: B, j: s } }) => (0, e._)`{i: ${B}, j: ${s}}`
    },
    code(B) {
      const { gen: s, data: w, $data: a, schema: n, parentSchema: E, schemaCode: l, it: f } = B;
      if (!a && !n)
        return;
      const h = s.let("valid"), D = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(h, g, (0, e._)`${l} === false`), B.ok(h);
      function g() {
        const c = s.let("i", (0, e._)`${w}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(h, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : I)(c, d));
      }
      function C() {
        return D.length > 0 && !D.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), m = (0, A.checkDataTypes)(D, M, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${w}[${c}]`), s.if(m, (0, e._)`continue`), D.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${p}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${M}]`), B.error(), s.assign(h, !1).break();
          }).code((0, e._)`${p}[${M}] = ${c}`);
        });
      }
      function I(c, d) {
        const M = (0, r.useFunc)(s, o.default), m = s.name("outer");
        s.label(m).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${w}[${c}], ${w}[${d}])`, () => {
          B.error(), s.assign(h, !1).break(m);
        })));
      }
    }
  };
  return uniqueItems.default = Q, uniqueItems;
}
var _const = {}, hasRequired_const;
function require_const() {
  if (hasRequired_const) return _const;
  hasRequired_const = 1, Object.defineProperty(_const, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), i = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: Q }) => (0, A._)`{allowedValue: ${Q}}`
    },
    code(Q) {
      const { gen: B, data: s, $data: w, schemaCode: a, schema: n } = Q;
      w || n && typeof n == "object" ? Q.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${a})`) : Q.fail((0, A._)`${n} !== ${s}`);
    }
  };
  return _const.default = i, _const;
}
var _enum = {}, hasRequired_enum;
function require_enum() {
  if (hasRequired_enum) return _enum;
  hasRequired_enum = 1, Object.defineProperty(_enum, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), i = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: Q }) => (0, A._)`{allowedValues: ${Q}}`
    },
    code(Q) {
      const { gen: B, data: s, $data: w, schema: a, schemaCode: n, it: E } = Q;
      if (!w && a.length === 0)
        throw new Error("enum must have non-empty array");
      const l = a.length >= E.opts.loopEnum;
      let f;
      const h = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let D;
      if (l || w)
        D = B.let("valid"), Q.block$data(D, g);
      else {
        if (!Array.isArray(a))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        D = (0, A.or)(...a.map((I, c) => C(t, c)));
      }
      Q.pass(D);
      function g() {
        B.assign(D, !1), B.forOf("v", n, (t) => B.if((0, A._)`${h()}(${s}, ${t})`, () => B.assign(D, !0).break()));
      }
      function C(t, I) {
        const c = a[I];
        return typeof c == "object" && c !== null ? (0, A._)`${h()}(${s}, ${t}[${I}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = i, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), i = requireLimitProperties(), Q = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), w = require_const(), a = require_enum(), n = [
    // number
    A.default,
    e.default,
    // string
    r.default,
    o.default,
    // object
    i.default,
    Q.default,
    // array
    B.default,
    s.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    w.default,
    a.default
  ];
  return validation.default = n, validation;
}
var applicator = {}, additionalItems = {}, hasRequiredAdditionalItems;
function requireAdditionalItems() {
  if (hasRequiredAdditionalItems) return additionalItems;
  hasRequiredAdditionalItems = 1, Object.defineProperty(additionalItems, "__esModule", { value: !0 }), additionalItems.validateAdditionalItems = void 0;
  const A = requireCodegen(), e = requireUtil(), o = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: Q } }) => (0, A.str)`must NOT have more than ${Q} items`,
      params: ({ params: { len: Q } }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { parentSchema: B, it: s } = Q, { items: w } = B;
      if (!Array.isArray(w)) {
        (0, e.checkStrictMode)(s, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      i(Q, w);
    }
  };
  function i(Q, B) {
    const { gen: s, schema: w, data: a, keyword: n, it: E } = Q;
    E.items = !0;
    const l = s.const("len", (0, A._)`${a}.length`);
    if (w === !1)
      Q.setParams({ len: B.length }), Q.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof w == "object" && !(0, e.alwaysValidSchema)(E, w)) {
      const h = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(h), () => f(h)), Q.ok(h);
    }
    function f(h) {
      s.forRange("i", B.length, l, (D) => {
        Q.subschema({ keyword: n, dataProp: D, dataPropType: e.Type.Num }, h), E.allErrors || s.if((0, A.not)(h), () => s.break());
      });
    }
  }
  return additionalItems.validateAdditionalItems = i, additionalItems.default = o, additionalItems;
}
var prefixItems = {}, items = {}, hasRequiredItems;
function requireItems() {
  if (hasRequiredItems) return items;
  hasRequiredItems = 1, Object.defineProperty(items, "__esModule", { value: !0 }), items.validateTuple = void 0;
  const A = requireCodegen(), e = requireUtil(), r = requireCode(), o = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(Q) {
      const { schema: B, it: s } = Q;
      if (Array.isArray(B))
        return i(Q, "additionalItems", B);
      s.items = !0, !(0, e.alwaysValidSchema)(s, B) && Q.ok((0, r.validateArray)(Q));
    }
  };
  function i(Q, B, s = Q.schema) {
    const { gen: w, parentSchema: a, data: n, keyword: E, it: l } = Q;
    D(a), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(w, s.length, l.items));
    const f = w.name("valid"), h = w.const("len", (0, A._)`${n}.length`);
    s.forEach((g, C) => {
      (0, e.alwaysValidSchema)(l, g) || (w.if((0, A._)`${h} > ${C}`, () => Q.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), Q.ok(f));
    });
    function D(g) {
      const { opts: C, errSchemaPath: t } = l, I = s.length, c = I === g.minItems && (I === g.maxItems || g[B] === !1);
      if (C.strictTuples && !c) {
        const d = `"${E}" is ${I}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, C.strictTuples);
      }
    }
  }
  return items.validateTuple = i, items.default = o, items;
}
var hasRequiredPrefixItems;
function requirePrefixItems() {
  if (hasRequiredPrefixItems) return prefixItems;
  hasRequiredPrefixItems = 1, Object.defineProperty(prefixItems, "__esModule", { value: !0 });
  const A = requireItems(), e = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (r) => (0, A.validateTuple)(r, "items")
  };
  return prefixItems.default = e, prefixItems;
}
var items2020 = {}, hasRequiredItems2020;
function requireItems2020() {
  if (hasRequiredItems2020) return items2020;
  hasRequiredItems2020 = 1, Object.defineProperty(items2020, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireCode(), o = requireAdditionalItems(), Q = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: B } }) => (0, A.str)`must NOT have more than ${B} items`,
      params: ({ params: { len: B } }) => (0, A._)`{limit: ${B}}`
    },
    code(B) {
      const { schema: s, parentSchema: w, it: a } = B, { prefixItems: n } = w;
      a.items = !0, !(0, e.alwaysValidSchema)(a, s) && (n ? (0, o.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
    }
  };
  return items2020.default = Q, items2020;
}
var contains = {}, hasRequiredContains;
function requireContains() {
  if (hasRequiredContains) return contains;
  hasRequiredContains = 1, Object.defineProperty(contains, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), o = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: i, max: Q } }) => Q === void 0 ? (0, A.str)`must contain at least ${i} valid item(s)` : (0, A.str)`must contain at least ${i} and no more than ${Q} valid item(s)`,
      params: ({ params: { min: i, max: Q } }) => Q === void 0 ? (0, A._)`{minContains: ${i}}` : (0, A._)`{minContains: ${i}, maxContains: ${Q}}`
    },
    code(i) {
      const { gen: Q, schema: B, parentSchema: s, data: w, it: a } = i;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      a.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const h = Q.const("len", (0, A._)`${w}.length`);
      if (i.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(a, B)) {
        let I = (0, A._)`${h} >= ${n}`;
        E !== void 0 && (I = (0, A._)`${I} && ${h} <= ${E}`), i.pass(I);
        return;
      }
      a.items = !0;
      const D = Q.name("valid");
      E === void 0 && n === 1 ? C(D, () => Q.if(D, () => Q.break())) : n === 0 ? (Q.let(D, !0), E !== void 0 && Q.if((0, A._)`${w}.length > 0`, g)) : (Q.let(D, !1), g()), i.result(D, () => i.reset());
      function g() {
        const I = Q.name("_valid"), c = Q.let("count", 0);
        C(I, () => Q.if(I, () => t(c)));
      }
      function C(I, c) {
        Q.forRange("i", 0, h, (d) => {
          i.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, I), c();
        });
      }
      function t(I) {
        Q.code((0, A._)`${I}++`), E === void 0 ? Q.if((0, A._)`${I} >= ${n}`, () => Q.assign(D, !0).break()) : (Q.if((0, A._)`${I} > ${E}`, () => Q.assign(D, !1).break()), n === 1 ? Q.assign(D, !0) : Q.if((0, A._)`${I} >= ${n}`, () => Q.assign(D, !0)));
      }
    }
  };
  return contains.default = o, contains;
}
var dependencies = {}, hasRequiredDependencies;
function requireDependencies() {
  return hasRequiredDependencies || (hasRequiredDependencies = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.validateSchemaDeps = A.validatePropertyDeps = A.error = void 0;
    const e = requireCodegen(), r = requireUtil(), o = requireCode();
    A.error = {
      message: ({ params: { property: w, depsCount: a, deps: n } }) => {
        const E = a === 1 ? "property" : "properties";
        return (0, e.str)`must have ${E} ${n} when property ${w} is present`;
      },
      params: ({ params: { property: w, depsCount: a, deps: n, missingProperty: E } }) => (0, e._)`{property: ${w},
    missingProperty: ${E},
    depsCount: ${a},
    deps: ${n}}`
      // TODO change to reference
    };
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(w) {
        const [a, n] = Q(w);
        B(w, a), s(w, n);
      }
    };
    function Q({ schema: w }) {
      const a = {}, n = {};
      for (const E in w) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(w[E]) ? a : n;
        l[E] = w[E];
      }
      return [a, n];
    }
    function B(w, a = w.schema) {
      const { gen: n, data: E, it: l } = w;
      if (Object.keys(a).length === 0)
        return;
      const f = n.let("missing");
      for (const h in a) {
        const D = a[h];
        if (D.length === 0)
          continue;
        const g = (0, o.propertyInData)(n, E, h, l.opts.ownProperties);
        w.setParams({
          property: h,
          depsCount: D.length,
          deps: D.join(", ")
        }), l.allErrors ? n.if(g, () => {
          for (const C of D)
            (0, o.checkReportMissingProp)(w, C);
        }) : (n.if((0, e._)`${g} && (${(0, o.checkMissingProp)(w, D, f)})`), (0, o.reportMissingProp)(w, f), n.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(w, a = w.schema) {
      const { gen: n, data: E, keyword: l, it: f } = w, h = n.name("valid");
      for (const D in a)
        (0, r.alwaysValidSchema)(f, a[D]) || (n.if(
          (0, o.propertyInData)(n, E, D, f.opts.ownProperties),
          () => {
            const g = w.subschema({ keyword: l, schemaProp: D }, h);
            w.mergeValidEvaluated(g, h);
          },
          () => n.var(h, !0)
          // TODO var
        ), w.ok(h));
    }
    A.validateSchemaDeps = s, A.default = i;
  })(dependencies)), dependencies;
}
var propertyNames = {}, hasRequiredPropertyNames;
function requirePropertyNames() {
  if (hasRequiredPropertyNames) return propertyNames;
  hasRequiredPropertyNames = 1, Object.defineProperty(propertyNames, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), o = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: i }) => (0, A._)`{propertyName: ${i.propertyName}}`
    },
    code(i) {
      const { gen: Q, schema: B, data: s, it: w } = i;
      if ((0, e.alwaysValidSchema)(w, B))
        return;
      const a = Q.name("valid");
      Q.forIn("key", s, (n) => {
        i.setParams({ propertyName: n }), i.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, a), Q.if((0, A.not)(a), () => {
          i.error(!0), w.allErrors || Q.break();
        });
      }), i.ok(a);
    }
  };
  return propertyNames.default = o, propertyNames;
}
var additionalProperties = {}, hasRequiredAdditionalProperties;
function requireAdditionalProperties() {
  if (hasRequiredAdditionalProperties) return additionalProperties;
  hasRequiredAdditionalProperties = 1, Object.defineProperty(additionalProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireNames(), o = requireUtil(), Q = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: B }) => (0, e._)`{additionalProperty: ${B.additionalProperty}}`
    },
    code(B) {
      const { gen: s, schema: w, parentSchema: a, data: n, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: h } = l;
      if (l.props = !0, h.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, w))
        return;
      const D = (0, A.allSchemaProperties)(a.properties), g = (0, A.allSchemaProperties)(a.patternProperties);
      C(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", n, (M) => {
          !D.length && !g.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let m;
        if (D.length > 8) {
          const p = (0, o.schemaRefOrVal)(l, a.properties, "properties");
          m = (0, A.isOwnProperty)(s, p, M);
        } else D.length ? m = (0, e.or)(...D.map((p) => (0, e._)`${M} === ${p}`)) : m = e.nil;
        return g.length && (m = (0, e.or)(m, ...g.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${M})`))), (0, e.not)(m);
      }
      function I(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (h.removeAdditional === "all" || h.removeAdditional && w === !1) {
          I(M);
          return;
        }
        if (w === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof w == "object" && !(0, o.alwaysValidSchema)(l, w)) {
          const m = s.name("valid");
          h.removeAdditional === "failing" ? (d(M, m, !1), s.if((0, e.not)(m), () => {
            B.reset(), I(M);
          })) : (d(M, m), f || s.if((0, e.not)(m), () => s.break()));
        }
      }
      function d(M, m, p) {
        const O = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: o.Type.Str
        };
        p === !1 && Object.assign(O, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(O, m);
      }
    }
  };
  return additionalProperties.default = Q, additionalProperties;
}
var properties$1 = {}, hasRequiredProperties;
function requireProperties() {
  if (hasRequiredProperties) return properties$1;
  hasRequiredProperties = 1, Object.defineProperty(properties$1, "__esModule", { value: !0 });
  const A = requireValidate(), e = requireCode(), r = requireUtil(), o = requireAdditionalProperties(), i = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(Q) {
      const { gen: B, schema: s, parentSchema: w, data: a, it: n } = Q;
      n.opts.removeAdditional === "all" && w.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(n, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const g of E)
        n.definedProperties.add(g);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), n.props));
      const l = E.filter((g) => !(0, r.alwaysValidSchema)(n, s[g]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const g of l)
        h(g) ? D(g) : (B.if((0, e.propertyInData)(B, a, g, n.opts.ownProperties)), D(g), n.allErrors || B.else().var(f, !0), B.endIf()), Q.it.definedProperties.add(g), Q.ok(f);
      function h(g) {
        return n.opts.useDefaults && !n.compositeRule && s[g].default !== void 0;
      }
      function D(g) {
        Q.subschema({
          keyword: "properties",
          schemaProp: g,
          dataProp: g
        }, f);
      }
    }
  };
  return properties$1.default = i, properties$1;
}
var patternProperties = {}, hasRequiredPatternProperties;
function requirePatternProperties() {
  if (hasRequiredPatternProperties) return patternProperties;
  hasRequiredPatternProperties = 1, Object.defineProperty(patternProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), o = requireUtil(), i = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(Q) {
      const { gen: B, schema: s, data: w, parentSchema: a, it: n } = Q, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const h = E.strictSchema && !E.allowMatchingProperties && a.properties, D = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, o.evaluatedPropsToName)(B, n.props));
      const { props: g } = n;
      C();
      function C() {
        for (const c of l)
          h && t(c), n.allErrors ? I(c) : (B.var(D, !0), I(c), B.if(D));
      }
      function t(c) {
        for (const d in h)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function I(c) {
        B.forIn("key", w, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(Q, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || Q.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: o.Type.Str
            }, D), n.opts.unevaluated && g !== !0 ? B.assign((0, e._)`${g}[${d}]`, !0) : !M && !n.allErrors && B.if((0, e.not)(D), () => B.break());
          });
        });
      }
    }
  };
  return patternProperties.default = i, patternProperties;
}
var not = {}, hasRequiredNot;
function requireNot() {
  if (hasRequiredNot) return not;
  hasRequiredNot = 1, Object.defineProperty(not, "__esModule", { value: !0 });
  const A = requireUtil(), e = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(r) {
      const { gen: o, schema: i, it: Q } = r;
      if ((0, A.alwaysValidSchema)(Q, i)) {
        r.fail();
        return;
      }
      const B = o.name("valid");
      r.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, B), r.failResult(B, () => r.reset(), () => r.error());
    },
    error: { message: "must NOT be valid" }
  };
  return not.default = e, not;
}
var anyOf = {}, hasRequiredAnyOf;
function requireAnyOf() {
  if (hasRequiredAnyOf) return anyOf;
  hasRequiredAnyOf = 1, Object.defineProperty(anyOf, "__esModule", { value: !0 });
  const e = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: requireCode().validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return anyOf.default = e, anyOf;
}
var oneOf = {}, hasRequiredOneOf;
function requireOneOf() {
  if (hasRequiredOneOf) return oneOf;
  hasRequiredOneOf = 1, Object.defineProperty(oneOf, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), o = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: i }) => (0, A._)`{passingSchemas: ${i.passing}}`
    },
    code(i) {
      const { gen: Q, schema: B, parentSchema: s, it: w } = i;
      if (!Array.isArray(B))
        throw new Error("ajv implementation error");
      if (w.opts.discriminator && s.discriminator)
        return;
      const a = B, n = Q.let("valid", !1), E = Q.let("passing", null), l = Q.name("_valid");
      i.setParams({ passing: E }), Q.block(f), i.result(n, () => i.reset(), () => i.error(!0));
      function f() {
        a.forEach((h, D) => {
          let g;
          (0, e.alwaysValidSchema)(w, h) ? Q.var(l, !0) : g = i.subschema({
            keyword: "oneOf",
            schemaProp: D,
            compositeRule: !0
          }, l), D > 0 && Q.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${D}]`).else(), Q.if(l, () => {
            Q.assign(n, !0), Q.assign(E, D), g && i.mergeEvaluated(g, A.Name);
          });
        });
      }
    }
  };
  return oneOf.default = o, oneOf;
}
var allOf = {}, hasRequiredAllOf;
function requireAllOf() {
  if (hasRequiredAllOf) return allOf;
  hasRequiredAllOf = 1, Object.defineProperty(allOf, "__esModule", { value: !0 });
  const A = requireUtil(), e = {
    keyword: "allOf",
    schemaType: "array",
    code(r) {
      const { gen: o, schema: i, it: Q } = r;
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      const B = o.name("valid");
      i.forEach((s, w) => {
        if ((0, A.alwaysValidSchema)(Q, s))
          return;
        const a = r.subschema({ keyword: "allOf", schemaProp: w }, B);
        r.ok(B), r.mergeEvaluated(a);
      });
    }
  };
  return allOf.default = e, allOf;
}
var _if = {}, hasRequired_if;
function require_if() {
  if (hasRequired_if) return _if;
  hasRequired_if = 1, Object.defineProperty(_if, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), o = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: Q }) => (0, A.str)`must match "${Q.ifClause}" schema`,
      params: ({ params: Q }) => (0, A._)`{failingKeyword: ${Q.ifClause}}`
    },
    code(Q) {
      const { gen: B, parentSchema: s, it: w } = Q;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(w, '"if" without "then" and "else" is ignored');
      const a = i(w, "then"), n = i(w, "else");
      if (!a && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), Q.reset(), a && n) {
        const D = B.let("ifClause");
        Q.setParams({ ifClause: D }), B.if(l, h("then", D), h("else", D));
      } else a ? B.if(l, h("then")) : B.if((0, A.not)(l), h("else"));
      Q.pass(E, () => Q.error(!0));
      function f() {
        const D = Q.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        Q.mergeEvaluated(D);
      }
      function h(D, g) {
        return () => {
          const C = Q.subschema({ keyword: D }, l);
          B.assign(E, l), Q.mergeValidEvaluated(C, E), g ? B.assign(g, (0, A._)`${D}`) : Q.setParams({ ifClause: D });
        };
      }
    }
  };
  function i(Q, B) {
    const s = Q.schema[B];
    return s !== void 0 && !(0, e.alwaysValidSchema)(Q, s);
  }
  return _if.default = o, _if;
}
var thenElse = {}, hasRequiredThenElse;
function requireThenElse() {
  if (hasRequiredThenElse) return thenElse;
  hasRequiredThenElse = 1, Object.defineProperty(thenElse, "__esModule", { value: !0 });
  const A = requireUtil(), e = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: r, parentSchema: o, it: i }) {
      o.if === void 0 && (0, A.checkStrictMode)(i, `"${r}" without "if" is ignored`);
    }
  };
  return thenElse.default = e, thenElse;
}
var hasRequiredApplicator;
function requireApplicator() {
  if (hasRequiredApplicator) return applicator;
  hasRequiredApplicator = 1, Object.defineProperty(applicator, "__esModule", { value: !0 });
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), i = requireContains(), Q = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), w = requireProperties(), a = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), h = require_if(), D = requireThenElse();
  function g(C = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      h.default,
      D.default,
      // object
      B.default,
      s.default,
      Q.default,
      w.default,
      a.default
    ];
    return C ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(i.default), t;
  }
  return applicator.default = g, applicator;
}
var format$1 = {}, format = {}, hasRequiredFormat$1;
function requireFormat$1() {
  if (hasRequiredFormat$1) return format;
  hasRequiredFormat$1 = 1, Object.defineProperty(format, "__esModule", { value: !0 });
  const A = requireCodegen(), r = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: o }) => (0, A.str)`must match format "${o}"`,
      params: ({ schemaCode: o }) => (0, A._)`{format: ${o}}`
    },
    code(o, i) {
      const { gen: Q, data: B, $data: s, schema: w, schemaCode: a, it: n } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: h } = n;
      if (!E.validateFormats)
        return;
      s ? D() : g();
      function D() {
        const C = Q.scopeValue("formats", {
          ref: h.formats,
          code: E.code.formats
        }), t = Q.const("fDef", (0, A._)`${C}[${a}]`), I = Q.let("fType"), c = Q.let("format");
        Q.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => Q.assign(I, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => Q.assign(I, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${a} && !${c}`;
        }
        function M() {
          const m = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, p = (0, A._)`(typeof ${c} == "function" ? ${m} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${I} === ${i} && !${p}`;
        }
      }
      function g() {
        const C = h.formats[w];
        if (!C) {
          d();
          return;
        }
        if (C === !0)
          return;
        const [t, I, c] = M(C);
        t === i && o.pass(m());
        function d() {
          if (E.strictSchema === !1) {
            h.logger.warn(p());
            return;
          }
          throw new Error(p());
          function p() {
            return `unknown format "${w}" ignored in schema at path "${l}"`;
          }
        }
        function M(p) {
          const O = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(w)}` : void 0, j = Q.scopeValue("formats", { key: w, ref: p, code: O });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${j}.validate`] : ["string", p, j];
        }
        function m() {
          if (typeof C == "object" && !(C instanceof RegExp) && C.async) {
            if (!f.$async)
              throw new Error("async format in sync schema");
            return (0, A._)`await ${c}(${B})`;
          }
          return typeof I == "function" ? (0, A._)`${c}(${B})` : (0, A._)`${c}.test(${B})`;
        }
      }
    }
  };
  return format.default = r, format;
}
var hasRequiredFormat;
function requireFormat() {
  if (hasRequiredFormat) return format$1;
  hasRequiredFormat = 1, Object.defineProperty(format$1, "__esModule", { value: !0 });
  const e = [requireFormat$1().default];
  return format$1.default = e, format$1;
}
var metadata = {}, hasRequiredMetadata;
function requireMetadata() {
  return hasRequiredMetadata || (hasRequiredMetadata = 1, Object.defineProperty(metadata, "__esModule", { value: !0 }), metadata.contentVocabulary = metadata.metadataVocabulary = void 0, metadata.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], metadata.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), metadata;
}
var hasRequiredDraft7;
function requireDraft7() {
  if (hasRequiredDraft7) return draft7;
  hasRequiredDraft7 = 1, Object.defineProperty(draft7, "__esModule", { value: !0 });
  const A = requireCore(), e = requireValidation(), r = requireApplicator(), o = requireFormat(), i = requireMetadata(), Q = [
    A.default,
    e.default,
    (0, r.default)(),
    o.default,
    i.metadataVocabulary,
    i.contentVocabulary
  ];
  return draft7.default = Q, draft7;
}
var discriminator = {}, types = {}, hasRequiredTypes;
function requireTypes() {
  if (hasRequiredTypes) return types;
  hasRequiredTypes = 1, Object.defineProperty(types, "__esModule", { value: !0 }), types.DiscrError = void 0;
  var A;
  return (function(e) {
    e.Tag = "tag", e.Mapping = "mapping";
  })(A || (types.DiscrError = A = {})), types;
}
var hasRequiredDiscriminator;
function requireDiscriminator() {
  if (hasRequiredDiscriminator) return discriminator;
  hasRequiredDiscriminator = 1, Object.defineProperty(discriminator, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireTypes(), r = requireCompile(), o = requireRef_error(), i = requireUtil(), B = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: s, tagName: w } }) => s === e.DiscrError.Tag ? `tag "${w}" must be string` : `value of tag "${w}" must be in oneOf`,
      params: ({ params: { discrError: s, tag: w, tagName: a } }) => (0, A._)`{error: ${s}, tag: ${a}, tagValue: ${w}}`
    },
    code(s) {
      const { gen: w, data: a, schema: n, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const h = n.propertyName;
      if (typeof h != "string")
        throw new Error("discriminator: requires propertyName");
      if (n.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const D = w.let("valid", !1), g = w.const("tag", (0, A._)`${a}${(0, A.getProperty)(h)}`);
      w.if((0, A._)`typeof ${g} == "string"`, () => C(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: g, tagName: h })), s.ok(D);
      function C() {
        const c = I();
        w.if(!1);
        for (const d in c)
          w.elseIf((0, A._)`${g} === ${d}`), w.assign(D, t(c[d]));
        w.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: g, tagName: h }), w.endIf();
      }
      function t(c) {
        const d = w.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function I() {
        var c;
        const d = {}, M = p(E);
        let m = !0;
        for (let z = 0; z < f.length; z++) {
          let U = f[z];
          if (U?.$ref && !(0, i.schemaHasRulesButRef)(U, l.self.RULES)) {
            const Z = U.$ref;
            if (U = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Z), U instanceof r.SchemaEnv && (U = U.schema), U === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Z);
          }
          const S = (c = U?.properties) === null || c === void 0 ? void 0 : c[h];
          if (typeof S != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${h}"`);
          m = m && (M || p(U)), O(S, z);
        }
        if (!m)
          throw new Error(`discriminator: "${h}" must be required`);
        return d;
        function p({ required: z }) {
          return Array.isArray(z) && z.includes(h);
        }
        function O(z, U) {
          if (z.const)
            j(z.const, U);
          else if (z.enum)
            for (const S of z.enum)
              j(S, U);
          else
            throw new Error(`discriminator: "properties/${h}" must have "const" or "enum"`);
        }
        function j(z, U) {
          if (typeof z != "string" || z in d)
            throw new Error(`discriminator: "${h}" values must be unique strings`);
          d[z] = U;
        }
      }
    }
  };
  return discriminator.default = B, discriminator;
}
const $schema = "http://json-schema.org/draft-07/schema#", $id = "http://json-schema.org/draft-07/schema#", title = "Core schema meta-schema", definitions = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, type = ["object", "boolean"], properties = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, require$$3 = {
  $schema,
  $id,
  title,
  definitions,
  type,
  properties,
  default: !0
};
var hasRequiredAjv;
function requireAjv() {
  return hasRequiredAjv || (hasRequiredAjv = 1, (function(A, e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.MissingRefError = e.ValidationError = e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = e.Ajv = void 0;
    const r = requireCore$1(), o = requireDraft7(), i = requireDiscriminator(), Q = require$$3, B = ["/properties"], s = "http://json-schema.org/draft-07/schema";
    class w extends r.default {
      _addVocabularies() {
        super._addVocabularies(), o.default.forEach((h) => this.addVocabulary(h)), this.opts.discriminator && this.addKeyword(i.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const h = this.opts.$data ? this.$dataMetaSchema(Q, B) : Q;
        this.addMetaSchema(h, s, !1), this.refs["http://json-schema.org/schema"] = s;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(s) ? s : void 0);
      }
    }
    e.Ajv = w, A.exports = e = w, A.exports.Ajv = w, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = w;
    var a = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return a.KeywordCxt;
    } });
    var n = requireCodegen();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return n._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return n.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return n.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return n.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return n.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return n.CodeGen;
    } });
    var E = requireValidation_error();
    Object.defineProperty(e, "ValidationError", { enumerable: !0, get: function() {
      return E.default;
    } });
    var l = requireRef_error();
    Object.defineProperty(e, "MissingRefError", { enumerable: !0, get: function() {
      return l.default;
    } });
  })(ajv, ajv.exports)), ajv.exports;
}
requireAjv();
function __awaiter(A, e, r, o) {
  function i(Q) {
    return Q instanceof r ? Q : new r(function(B) {
      B(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, B) {
    function s(n) {
      try {
        a(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      try {
        a(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      n.done ? Q(n.value) : i(n.value).then(s, w);
    }
    a((o = o.apply(A, [])).next());
  });
}
function __generator(A, e) {
  var r = { label: 0, sent: function() {
    if (Q[0] & 1) throw Q[1];
    return Q[1];
  }, trys: [], ops: [] }, o, i, Q, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(a) {
    return function(n) {
      return w([a, n]);
    };
  }
  function w(a) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = a[0] & 2 ? i.return : a[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, a[1])).done) return Q;
      switch (i = 0, Q && (a = [a[0] & 2, Q.value]), a[0]) {
        case 0:
        case 1:
          Q = a;
          break;
        case 4:
          return r.label++, { value: a[1], done: !1 };
        case 5:
          r.label++, i = a[1], a = [0];
          continue;
        case 7:
          a = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (a[0] === 6 || a[0] === 2)) {
            r = 0;
            continue;
          }
          if (a[0] === 3 && (!Q || a[1] > Q[0] && a[1] < Q[3])) {
            r.label = a[1];
            break;
          }
          if (a[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = a;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(a);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      a = e.call(A, r);
    } catch (n) {
      a = [6, n], i = 0;
    } finally {
      o = Q = 0;
    }
    if (a[0] & 5) throw a[1];
    return { value: a[0] ? a[1] : void 0, done: !0 };
  }
}
function __read(A, e) {
  var r = typeof Symbol == "function" && A[Symbol.iterator];
  if (!r) return A;
  var o = r.call(A), i, Q = [], B;
  try {
    for (; (e === void 0 || e-- > 0) && !(i = o.next()).done; ) Q.push(i.value);
  } catch (s) {
    B = { error: s };
  } finally {
    try {
      i && !i.done && (r = o.return) && r.call(o);
    } finally {
      if (B) throw B.error;
    }
  }
  return Q;
}
function __spreadArray(A, e, r) {
  if (arguments.length === 2) for (var o = 0, i = e.length, Q; o < i; o++)
    (Q || !(o in e)) && (Q || (Q = Array.prototype.slice.call(e, 0, o)), Q[o] = e[o]);
  return A.concat(Q || Array.prototype.slice.call(e));
}
var defaultErrorConfig = {
  withStackTrace: !1
}, createNeverThrowError = function(A, e, r) {
  r === void 0 && (r = defaultErrorConfig);
  var o = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, i = r.withStackTrace ? new Error().stack : void 0;
  return {
    data: o,
    message: A,
    stack: i
  };
}, Result;
(function(A) {
  function e(r, o) {
    return function() {
      for (var i = [], Q = 0; Q < arguments.length; Q++)
        i[Q] = arguments[Q];
      try {
        var B = r.apply(void 0, __spreadArray([], __read(i), !1));
        return ok(B);
      } catch (s) {
        return err(o ? o(s) : s);
      }
    };
  }
  A.fromThrowable = e;
})(Result || (Result = {}));
var ok = function(A) {
  return new Ok(A);
}, err = function(A) {
  return new Err(A);
}, Ok = (
  /** @class */
  (function() {
    function A(e) {
      this.value = e;
    }
    return A.prototype.isOk = function() {
      return !0;
    }, A.prototype.isErr = function() {
      return !this.isOk();
    }, A.prototype.map = function(e) {
      return ok(e(this.value));
    }, A.prototype.mapErr = function(e) {
      return ok(this.value);
    }, A.prototype.andThen = function(e) {
      return e(this.value);
    }, A.prototype.orElse = function(e) {
      return ok(this.value);
    }, A.prototype.asyncAndThen = function(e) {
      return e(this.value);
    }, A.prototype.asyncMap = function(e) {
      return ResultAsync.fromSafePromise(e(this.value));
    }, A.prototype.unwrapOr = function(e) {
      return this.value;
    }, A.prototype.match = function(e, r) {
      return e(this.value);
    }, A.prototype._unsafeUnwrap = function(e) {
      return this.value;
    }, A.prototype._unsafeUnwrapErr = function(e) {
      throw createNeverThrowError("Called `_unsafeUnwrapErr` on an Ok", this, e);
    }, A;
  })()
), Err = (
  /** @class */
  (function() {
    function A(e) {
      this.error = e;
    }
    return A.prototype.isOk = function() {
      return !1;
    }, A.prototype.isErr = function() {
      return !this.isOk();
    }, A.prototype.map = function(e) {
      return err(this.error);
    }, A.prototype.mapErr = function(e) {
      return err(e(this.error));
    }, A.prototype.andThen = function(e) {
      return err(this.error);
    }, A.prototype.orElse = function(e) {
      return e(this.error);
    }, A.prototype.asyncAndThen = function(e) {
      return errAsync(this.error);
    }, A.prototype.asyncMap = function(e) {
      return errAsync(this.error);
    }, A.prototype.unwrapOr = function(e) {
      return e;
    }, A.prototype.match = function(e, r) {
      return r(this.error);
    }, A.prototype._unsafeUnwrap = function(e) {
      throw createNeverThrowError("Called `_unsafeUnwrap` on an Err", this, e);
    }, A.prototype._unsafeUnwrapErr = function(e) {
      return this.error;
    }, A;
  })()
);
Result.fromThrowable;
var ResultAsync = (
  /** @class */
  (function() {
    function A(e) {
      this._promise = e;
    }
    return A.fromSafePromise = function(e) {
      var r = e.then(function(o) {
        return new Ok(o);
      });
      return new A(r);
    }, A.fromPromise = function(e, r) {
      var o = e.then(function(i) {
        return new Ok(i);
      }).catch(function(i) {
        return new Err(r(i));
      });
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isErr() ? [2, new Err(o.error)] : (i = Ok.bind, [4, e(o.value)]);
              case 1:
                return [2, new (i.apply(Ok, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isOk() ? [2, new Ok(o.value)] : (i = Err.bind, [4, e(o.error)]);
              case 1:
                return [2, new (i.apply(Err, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.andThen = function(e) {
      return new A(this._promise.then(function(r) {
        if (r.isErr())
          return new Err(r.error);
        var o = e(r.value);
        return o instanceof A ? o._promise : o;
      }));
    }, A.prototype.orElse = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          return __generator(this, function(i) {
            return o.isErr() ? [2, e(o.error)] : [2, new Ok(o.value)];
          });
        });
      }));
    }, A.prototype.match = function(e, r) {
      return this._promise.then(function(o) {
        return o.match(e, r);
      });
    }, A.prototype.unwrapOr = function(e) {
      return this._promise.then(function(r) {
        return r.unwrapOr(e);
      });
    }, A.prototype.then = function(e, r) {
      return this._promise.then(e, r);
    }, A;
  })()
), errAsync = function(A) {
  return new ResultAsync(Promise.resolve(new Err(A)));
};
ResultAsync.fromPromise;
ResultAsync.fromSafePromise;
const ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias"), DOC = /* @__PURE__ */ Symbol.for("yaml.document"), MAP = /* @__PURE__ */ Symbol.for("yaml.map"), PAIR = /* @__PURE__ */ Symbol.for("yaml.pair"), SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar"), SEQ = /* @__PURE__ */ Symbol.for("yaml.seq"), NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type"), isAlias = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === ALIAS, isDocument = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === DOC, isMap = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === MAP, isPair = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === PAIR, isScalar = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === SCALAR, isSeq = (A) => !!A && typeof A == "object" && A[NODE_TYPE] === SEQ;
function isCollection(A) {
  if (A && typeof A == "object")
    switch (A[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return !0;
    }
  return !1;
}
function isNode(A) {
  if (A && typeof A == "object")
    switch (A[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return !0;
    }
  return !1;
}
const hasAnchor = (A) => (isScalar(A) || isCollection(A)) && !!A.anchor, BREAK = /* @__PURE__ */ Symbol("break visit"), SKIP = /* @__PURE__ */ Symbol("skip children"), REMOVE = /* @__PURE__ */ Symbol("remove node");
function visit(A, e) {
  const r = initVisitor(e);
  isDocument(A) ? visit_(null, A.contents, r, Object.freeze([A])) === REMOVE && (A.contents = null) : visit_(null, A, r, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(A, e, r, o) {
  const i = callVisitor(A, e, r, o);
  if (isNode(i) || isPair(i))
    return replaceNode(A, o, i), visit_(A, i, r, o);
  if (typeof i != "symbol") {
    if (isCollection(e)) {
      o = Object.freeze(o.concat(e));
      for (let Q = 0; Q < e.items.length; ++Q) {
        const B = visit_(Q, e.items[Q], r, o);
        if (typeof B == "number")
          Q = B - 1;
        else {
          if (B === BREAK)
            return BREAK;
          B === REMOVE && (e.items.splice(Q, 1), Q -= 1);
        }
      }
    } else if (isPair(e)) {
      o = Object.freeze(o.concat(e));
      const Q = visit_("key", e.key, r, o);
      if (Q === BREAK)
        return BREAK;
      Q === REMOVE && (e.key = null);
      const B = visit_("value", e.value, r, o);
      if (B === BREAK)
        return BREAK;
      B === REMOVE && (e.value = null);
    }
  }
  return i;
}
function initVisitor(A) {
  return typeof A == "object" && (A.Collection || A.Node || A.Value) ? Object.assign({
    Alias: A.Node,
    Map: A.Node,
    Scalar: A.Node,
    Seq: A.Node
  }, A.Value && {
    Map: A.Value,
    Scalar: A.Value,
    Seq: A.Value
  }, A.Collection && {
    Map: A.Collection,
    Seq: A.Collection
  }, A) : A;
}
function callVisitor(A, e, r, o) {
  if (typeof r == "function")
    return r(A, e, o);
  if (isMap(e))
    return r.Map?.(A, e, o);
  if (isSeq(e))
    return r.Seq?.(A, e, o);
  if (isPair(e))
    return r.Pair?.(A, e, o);
  if (isScalar(e))
    return r.Scalar?.(A, e, o);
  if (isAlias(e))
    return r.Alias?.(A, e, o);
}
function replaceNode(A, e, r) {
  const o = e[e.length - 1];
  if (isCollection(o))
    o.items[A] = r;
  else if (isPair(o))
    A === "key" ? o.key = r : o.value = r;
  else if (isDocument(o))
    o.contents = r;
  else {
    const i = isAlias(o) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${i} parent`);
  }
}
function anchorIsValid(A) {
  if (/[\x00-\x19\s,[\]{}]/.test(A)) {
    const r = `Anchor must not contain whitespace or control characters: ${JSON.stringify(A)}`;
    throw new Error(r);
  }
  return !0;
}
function applyReviver(A, e, r, o) {
  if (o && typeof o == "object")
    if (Array.isArray(o))
      for (let i = 0, Q = o.length; i < Q; ++i) {
        const B = o[i], s = applyReviver(A, o, String(i), B);
        s === void 0 ? delete o[i] : s !== B && (o[i] = s);
      }
    else if (o instanceof Map)
      for (const i of Array.from(o.keys())) {
        const Q = o.get(i), B = applyReviver(A, o, i, Q);
        B === void 0 ? o.delete(i) : B !== Q && o.set(i, B);
      }
    else if (o instanceof Set)
      for (const i of Array.from(o)) {
        const Q = applyReviver(A, o, i, i);
        Q === void 0 ? o.delete(i) : Q !== i && (o.delete(i), o.add(Q));
      }
    else
      for (const [i, Q] of Object.entries(o)) {
        const B = applyReviver(A, o, i, Q);
        B === void 0 ? delete o[i] : B !== Q && (o[i] = B);
      }
  return A.call(e, r, o);
}
function toJS(A, e, r) {
  if (Array.isArray(A))
    return A.map((o, i) => toJS(o, String(i), r));
  if (A && typeof A.toJSON == "function") {
    if (!r || !hasAnchor(A))
      return A.toJSON(e, r);
    const o = { aliasCount: 0, count: 1, res: void 0 };
    r.anchors.set(A, o), r.onCreate = (Q) => {
      o.res = Q, delete r.onCreate;
    };
    const i = A.toJSON(e, r);
    return r.onCreate && r.onCreate(i), i;
  }
  return typeof A == "bigint" && !r?.keep ? Number(A) : A;
}
class NodeBase {
  constructor(e) {
    Object.defineProperty(this, NODE_TYPE, { value: e });
  }
  /** Create a copy of this node.  */
  clone() {
    const e = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return this.range && (e.range = this.range.slice()), e;
  }
  /** A plain JavaScript representation of this node. */
  toJS(e, { mapAsMap: r, maxAliasCount: o, onAnchor: i, reviver: Q } = {}) {
    if (!isDocument(e))
      throw new TypeError("A document argument is required");
    const B = {
      anchors: /* @__PURE__ */ new Map(),
      doc: e,
      keep: !0,
      mapAsMap: r === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof o == "number" ? o : 100
    }, s = toJS(this, "", B);
    if (typeof i == "function")
      for (const { count: w, res: a } of B.anchors.values())
        i(a, w);
    return typeof Q == "function" ? applyReviver(Q, { "": s }, "", s) : s;
  }
}
class Alias extends NodeBase {
  constructor(e) {
    super(ALIAS), this.source = e, Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(e) {
    let r;
    return visit(e, {
      Node: (o, i) => {
        if (i === this)
          return visit.BREAK;
        i.anchor === this.source && (r = i);
      }
    }), r;
  }
  toJSON(e, r) {
    if (!r)
      return { source: this.source };
    const { anchors: o, doc: i, maxAliasCount: Q } = r, B = this.resolve(i);
    if (!B) {
      const w = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(w);
    }
    let s = o.get(B);
    if (s || (toJS(B, null, r), s = o.get(B)), !s || s.res === void 0) {
      const w = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(w);
    }
    if (Q >= 0 && (s.count += 1, s.aliasCount === 0 && (s.aliasCount = getAliasCount(i, B, o)), s.count * s.aliasCount > Q)) {
      const w = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(w);
    }
    return s.res;
  }
  toString(e, r, o) {
    const i = `*${this.source}`;
    if (e) {
      if (anchorIsValid(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const Q = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(Q);
      }
      if (e.implicitKey)
        return `${i} `;
    }
    return i;
  }
}
function getAliasCount(A, e, r) {
  if (isAlias(e)) {
    const o = e.resolve(A), i = r && o && r.get(o);
    return i ? i.count * i.aliasCount : 0;
  } else if (isCollection(e)) {
    let o = 0;
    for (const i of e.items) {
      const Q = getAliasCount(A, i, r);
      Q > o && (o = Q);
    }
    return o;
  } else if (isPair(e)) {
    const o = getAliasCount(A, e.key, r), i = getAliasCount(A, e.value, r);
    return Math.max(o, i);
  }
  return 1;
}
const isScalarValue = (A) => !A || typeof A != "function" && typeof A != "object";
class Scalar extends NodeBase {
  constructor(e) {
    super(SCALAR), this.value = e;
  }
  toJSON(e, r) {
    return r?.keep ? this.value : toJS(this.value, e, r);
  }
  toString() {
    return String(this.value);
  }
}
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
function findTagObject(A, e, r) {
  return r.find((o) => o.identify?.(A) && !o.format);
}
function createNode(A, e, r) {
  if (isDocument(A) && (A = A.contents), isNode(A))
    return A;
  if (isPair(A)) {
    const E = r.schema[MAP].createNode?.(r.schema, null, r);
    return E.items.push(A), E;
  }
  (A instanceof String || A instanceof Number || A instanceof Boolean || typeof BigInt < "u" && A instanceof BigInt) && (A = A.valueOf());
  const { aliasDuplicateObjects: o, onAnchor: i, onTagObj: Q, schema: B, sourceObjects: s } = r;
  let w;
  if (o && A && typeof A == "object") {
    if (w = s.get(A), w)
      return w.anchor || (w.anchor = i(A)), new Alias(w.anchor);
    w = { anchor: null, node: null }, s.set(A, w);
  }
  let a = findTagObject(A, e, B.tags);
  if (!a) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return w && (w.node = E), E;
    }
    a = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  Q && (Q(a), delete r.onTagObj);
  const n = a?.createNode ? a.createNode(r.schema, A, r) : typeof a?.nodeClass?.from == "function" ? a.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return a.default || (n.tag = a.tag), w && (w.node = n), n;
}
function collectionFromPath(A, e, r) {
  let o = r;
  for (let i = e.length - 1; i >= 0; --i) {
    const Q = e[i];
    if (typeof Q == "number" && Number.isInteger(Q) && Q >= 0) {
      const B = [];
      B[Q] = o, o = B;
    } else
      o = /* @__PURE__ */ new Map([[Q, o]]);
  }
  return createNode(o, void 0, {
    aliasDuplicateObjects: !1,
    keepUndefined: !1,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: A,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
const isEmptyPath = (A) => A == null || typeof A == "object" && !!A[Symbol.iterator]().next().done;
class Collection extends NodeBase {
  constructor(e, r) {
    super(e), Object.defineProperty(this, "schema", {
      value: r,
      configurable: !0,
      enumerable: !1,
      writable: !0
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(e) {
    const r = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    return e && (r.schema = e), r.items = r.items.map((o) => isNode(o) || isPair(o) ? o.clone(e) : o), this.range && (r.range = this.range.slice()), r;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(e, r) {
    if (isEmptyPath(e))
      this.add(r);
    else {
      const [o, ...i] = e, Q = this.get(o, !0);
      if (isCollection(Q))
        Q.addIn(i, r);
      else if (Q === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${i}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(e) {
    const [r, ...o] = e;
    if (o.length === 0)
      return this.delete(r);
    const i = this.get(r, !0);
    if (isCollection(i))
      return i.deleteIn(o);
    throw new Error(`Expected YAML collection at ${r}. Remaining path: ${o}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, r) {
    const [o, ...i] = e, Q = this.get(o, !0);
    return i.length === 0 ? !r && isScalar(Q) ? Q.value : Q : isCollection(Q) ? Q.getIn(i, r) : void 0;
  }
  hasAllNullValues(e) {
    return this.items.every((r) => {
      if (!isPair(r))
        return !1;
      const o = r.value;
      return o == null || e && isScalar(o) && o.value == null && !o.commentBefore && !o.comment && !o.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(e) {
    const [r, ...o] = e;
    if (o.length === 0)
      return this.has(r);
    const i = this.get(r, !0);
    return isCollection(i) ? i.hasIn(o) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, r) {
    const [o, ...i] = e;
    if (i.length === 0)
      this.set(o, r);
    else {
      const Q = this.get(o, !0);
      if (isCollection(Q))
        Q.setIn(i, r);
      else if (Q === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${i}`);
    }
  }
}
const stringifyComment = (A) => A.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(A, e) {
  return /^\n+$/.test(A) ? A.substring(1) : e ? A.replace(/^(?! *$)/gm, e) : A;
}
const lineComment = (A, e, r) => A.endsWith(`
`) ? indentComment(r, e) : r.includes(`
`) ? `
` + indentComment(r, e) : (A.endsWith(" ") ? "" : " ") + r, FOLD_FLOW = "flow", FOLD_BLOCK = "block", FOLD_QUOTED = "quoted";
function foldFlowLines(A, e, r = "flow", { indentAtStart: o, lineWidth: i = 80, minContentWidth: Q = 20, onFold: B, onOverflow: s } = {}) {
  if (!i || i < 0)
    return A;
  i < Q && (Q = 0);
  const w = Math.max(1 + Q, 1 + i - e.length);
  if (A.length <= w)
    return A;
  const a = [], n = {};
  let E = i - e.length;
  typeof o == "number" && (o > i - Math.max(2, Q) ? a.push(0) : E = i - o);
  let l, f, h = !1, D = -1, g = -1, C = -1;
  r === FOLD_BLOCK && (D = consumeMoreIndentedLines(A, D, e.length), D !== -1 && (E = D + w));
  for (let I; I = A[D += 1]; ) {
    if (r === FOLD_QUOTED && I === "\\") {
      switch (g = D, A[D + 1]) {
        case "x":
          D += 3;
          break;
        case "u":
          D += 5;
          break;
        case "U":
          D += 9;
          break;
        default:
          D += 1;
      }
      C = D;
    }
    if (I === `
`)
      r === FOLD_BLOCK && (D = consumeMoreIndentedLines(A, D, e.length)), E = D + e.length + w, l = void 0;
    else {
      if (I === " " && f && f !== " " && f !== `
` && f !== "	") {
        const c = A[D + 1];
        c && c !== " " && c !== `
` && c !== "	" && (l = D);
      }
      if (D >= E)
        if (l)
          a.push(l), E = l + w, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = I, I = A[D += 1], h = !0;
          const c = D > C + 1 ? D - 2 : g - 1;
          if (n[c])
            return A;
          a.push(c), n[c] = !0, E = c + w, l = void 0;
        } else
          h = !0;
    }
    f = I;
  }
  if (h && s && s(), a.length === 0)
    return A;
  B && B();
  let t = A.slice(0, a[0]);
  for (let I = 0; I < a.length; ++I) {
    const c = a[I], d = a[I + 1] || A.length;
    c === 0 ? t = `
${e}${A.slice(0, d)}` : (r === FOLD_QUOTED && n[c] && (t += `${A[c]}\\`), t += `
${e}${A.slice(c + 1, d)}`);
  }
  return t;
}
function consumeMoreIndentedLines(A, e, r) {
  let o = e, i = e + 1, Q = A[i];
  for (; Q === " " || Q === "	"; )
    if (e < i + r)
      Q = A[++e];
    else {
      do
        Q = A[++e];
      while (Q && Q !== `
`);
      o = e, i = e + 1, Q = A[i];
    }
  return o;
}
const getFoldOptions = (A, e) => ({
  indentAtStart: e ? A.indent.length : A.indentAtStart,
  lineWidth: A.options.lineWidth,
  minContentWidth: A.options.minContentWidth
}), containsDocumentMarker = (A) => /^(%|---|\.\.\.)/m.test(A);
function lineLengthOverLimit(A, e, r) {
  if (!e || e < 0)
    return !1;
  const o = e - r, i = A.length;
  if (i <= o)
    return !1;
  for (let Q = 0, B = 0; Q < i; ++Q)
    if (A[Q] === `
`) {
      if (Q - B > o)
        return !0;
      if (B = Q + 1, i - B <= o)
        return !1;
    }
  return !0;
}
function doubleQuotedString(A, e) {
  const r = JSON.stringify(A);
  if (e.options.doubleQuotedAsJSON)
    return r;
  const { implicitKey: o } = e, i = e.options.doubleQuotedMinMultiLineLength, Q = e.indent || (containsDocumentMarker(A) ? "  " : "");
  let B = "", s = 0;
  for (let w = 0, a = r[w]; a; a = r[++w])
    if (a === " " && r[w + 1] === "\\" && r[w + 2] === "n" && (B += r.slice(s, w) + "\\ ", w += 1, s = w, a = "\\"), a === "\\")
      switch (r[w + 1]) {
        case "u":
          {
            B += r.slice(s, w);
            const n = r.substr(w + 2, 4);
            switch (n) {
              case "0000":
                B += "\\0";
                break;
              case "0007":
                B += "\\a";
                break;
              case "000b":
                B += "\\v";
                break;
              case "001b":
                B += "\\e";
                break;
              case "0085":
                B += "\\N";
                break;
              case "00a0":
                B += "\\_";
                break;
              case "2028":
                B += "\\L";
                break;
              case "2029":
                B += "\\P";
                break;
              default:
                n.substr(0, 2) === "00" ? B += "\\x" + n.substr(2) : B += r.substr(w, 6);
            }
            w += 5, s = w + 1;
          }
          break;
        case "n":
          if (o || r[w + 2] === '"' || r.length < i)
            w += 1;
          else {
            for (B += r.slice(s, w) + `

`; r[w + 2] === "\\" && r[w + 3] === "n" && r[w + 4] !== '"'; )
              B += `
`, w += 2;
            B += Q, r[w + 2] === " " && (B += "\\"), w += 1, s = w + 1;
          }
          break;
        default:
          w += 1;
      }
  return B = s ? B + r.slice(s) : r, o ? B : foldFlowLines(B, Q, FOLD_QUOTED, getFoldOptions(e, !1));
}
function singleQuotedString(A, e) {
  if (e.options.singleQuote === !1 || e.implicitKey && A.includes(`
`) || /[ \t]\n|\n[ \t]/.test(A))
    return doubleQuotedString(A, e);
  const r = e.indent || (containsDocumentMarker(A) ? "  " : ""), o = "'" + A.replace(/'/g, "''").replace(/\n+/g, `$&
${r}`) + "'";
  return e.implicitKey ? o : foldFlowLines(o, r, FOLD_FLOW, getFoldOptions(e, !1));
}
function quotedString(A, e) {
  const { singleQuote: r } = e.options;
  let o;
  if (r === !1)
    o = doubleQuotedString;
  else {
    const i = A.includes('"'), Q = A.includes("'");
    i && !Q ? o = singleQuotedString : Q && !i ? o = doubleQuotedString : o = r ? singleQuotedString : doubleQuotedString;
  }
  return o(A, e);
}
let blockEndNewlines;
try {
  blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
} catch {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment: A, type: e, value: r }, o, i, Q) {
  const { blockQuote: B, commentString: s, lineWidth: w } = o.options;
  if (!B || /\n[\t ]+$/.test(r) || /^\s*$/.test(r))
    return quotedString(r, o);
  const a = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, w, a.length);
  if (!r)
    return n ? `|
` : `>
`;
  let E, l;
  for (l = r.length; l > 0; --l) {
    const d = r[l - 1];
    if (d !== `
` && d !== "	" && d !== " ")
      break;
  }
  let f = r.substring(l);
  const h = f.indexOf(`
`);
  h === -1 ? E = "-" : r === f || h !== f.length - 1 ? (E = "+", Q && Q()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${a}`));
  let D = !1, g, C = -1;
  for (g = 0; g < r.length; ++g) {
    const d = r[g];
    if (d === " ")
      D = !0;
    else if (d === `
`)
      C = g;
    else
      break;
  }
  let t = r.substring(0, C < g ? C + 1 : g);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${a}`));
  let c = (D ? a ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${a}`);
    let M = !1;
    const m = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (m.onOverflow = () => {
      M = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, a, FOLD_BLOCK, m);
    if (!M)
      return `>${c}
${a}${p}`;
  }
  return r = r.replace(/\n+/g, `$&${a}`), `|${c}
${a}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: i, value: Q } = A, { actualString: B, implicitKey: s, indent: w, indentStep: a, inFlow: n } = e;
  if (s && Q.includes(`
`) || n && /[[\]{},]/.test(Q))
    return quotedString(Q, e);
  if (!Q || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(Q))
    return s || n || !Q.includes(`
`) ? quotedString(Q, e) : blockString(A, e, r, o);
  if (!s && !n && i !== Scalar.PLAIN && Q.includes(`
`))
    return blockString(A, e, r, o);
  if (containsDocumentMarker(Q)) {
    if (w === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, o);
    if (s && w === a)
      return quotedString(Q, e);
  }
  const E = Q.replace(/\n+/g, `$&
${w}`);
  if (B) {
    const l = (D) => D.default && D.tag !== "tag:yaml.org,2002:str" && D.test?.test(E), { compat: f, tags: h } = e.doc.schema;
    if (h.some(l) || f?.some(l))
      return quotedString(Q, e);
  }
  return s ? E : foldFlowLines(E, w, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, o) {
  const { implicitKey: i, inFlow: Q } = e, B = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(B.value) && (s = Scalar.QUOTE_DOUBLE);
  const w = (n) => {
    switch (n) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return i || Q ? quotedString(B.value, e) : blockString(B, e, r, o);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(B.value, e);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(B.value, e);
      case Scalar.PLAIN:
        return plainString(B, e, r, o);
      default:
        return null;
    }
  };
  let a = w(s);
  if (a === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = i && n || E;
    if (a = w(l), a === null)
      throw new Error(`Unsupported default string type ${l}`);
  }
  return a;
}
function createStringifyContext(A, e) {
  const r = Object.assign({
    blockQuote: !0,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: !1,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: !0,
    indentSeq: !0,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: !1,
    singleQuote: null,
    trueStr: "true",
    verifyAliasOrder: !0
  }, A.schema.toStringOptions, e);
  let o;
  switch (r.collectionStyle) {
    case "block":
      o = !1;
      break;
    case "flow":
      o = !0;
      break;
    default:
      o = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc: A,
    flowCollectionPadding: r.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof r.indent == "number" ? " ".repeat(r.indent) : "  ",
    inFlow: o,
    options: r
  };
}
function getTagObject(A, e) {
  if (e.tag) {
    const i = A.filter((Q) => Q.tag === e.tag);
    if (i.length > 0)
      return i.find((Q) => Q.format === e.format) ?? i[0];
  }
  let r, o;
  if (isScalar(e)) {
    o = e.value;
    let i = A.filter((Q) => Q.identify?.(o));
    if (i.length > 1) {
      const Q = i.filter((B) => B.test);
      Q.length > 0 && (i = Q);
    }
    r = i.find((Q) => Q.format === e.format) ?? i.find((Q) => !Q.format);
  } else
    o = e, r = A.find((i) => i.nodeClass && o instanceof i.nodeClass);
  if (!r) {
    const i = o?.constructor?.name ?? typeof o;
    throw new Error(`Tag not resolved for ${i} value`);
  }
  return r;
}
function stringifyProps(A, e, { anchors: r, doc: o }) {
  if (!o.directives)
    return "";
  const i = [], Q = (isScalar(A) || isCollection(A)) && A.anchor;
  Q && anchorIsValid(Q) && (r.add(Q), i.push(`&${Q}`));
  const B = A.tag ? A.tag : e.default ? null : e.tag;
  return B && i.push(o.directives.tagString(B)), i.join(" ");
}
function stringify(A, e, r, o) {
  if (isPair(A))
    return A.toString(e, r, o);
  if (isAlias(A)) {
    if (e.doc.directives)
      return A.toString(e);
    if (e.resolvedAliases?.has(A))
      throw new TypeError("Cannot stringify circular structure without alias nodes");
    e.resolvedAliases ? e.resolvedAliases.add(A) : e.resolvedAliases = /* @__PURE__ */ new Set([A]), A = A.resolve(e.doc);
  }
  let i;
  const Q = isNode(A) ? A : e.doc.createNode(A, { onTagObj: (w) => i = w });
  i || (i = getTagObject(e.doc.schema.tags, Q));
  const B = stringifyProps(Q, i, e);
  B.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + B.length + 1);
  const s = typeof i.stringify == "function" ? i.stringify(Q, e, r, o) : isScalar(Q) ? stringifyString(Q, e, r, o) : Q.toString(e, r, o);
  return B ? isScalar(Q) || s[0] === "{" || s[0] === "[" ? `${B} ${s}` : `${B}
${e.indent}${s}` : s;
}
function stringifyPair({ key: A, value: e }, r, o, i) {
  const { allNullValues: Q, doc: B, indent: s, indentStep: w, options: { commentString: a, indentSeq: n, simpleKeys: E } } = r;
  let l = isNode(A) && A.comment || null;
  if (E) {
    if (l)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (isCollection(A) || !isNode(A) && typeof A == "object") {
      const m = "With simple keys, collection cannot be used as a key value";
      throw new Error(m);
    }
  }
  let f = !E && (!A || l && e == null && !r.inFlow || isCollection(A) || (isScalar(A) ? A.type === Scalar.BLOCK_FOLDED || A.type === Scalar.BLOCK_LITERAL : typeof A == "object"));
  r = Object.assign({}, r, {
    allNullValues: !1,
    implicitKey: !f && (E || !Q),
    indent: s + w
  });
  let h = !1, D = !1, g = stringify(A, r, () => h = !0, () => D = !0);
  if (!f && !r.inFlow && g.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (Q || e == null)
      return h && o && o(), g === "" ? "?" : f ? `? ${g}` : g;
  } else if (Q && !E || e == null && f)
    return g = `? ${g}`, l && !h ? g += lineComment(g, r.indent, a(l)) : D && i && i(), g;
  h && (l = null), f ? (l && (g += lineComment(g, r.indent, a(l))), g = `? ${g}
${s}:`) : (g = `${g}:`, l && (g += lineComment(g, r.indent, a(l))));
  let C, t, I;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, I = e.comment) : (C = !1, t = null, I = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = g.length + 1), D = !1, !n && w.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => D = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
` : "", t) {
      const m = a(t);
      M += `
${indentComment(m, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const m = d[0], p = d.indexOf(`
`), O = p !== -1, j = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !j) {
      let z = !1;
      if (O && (m === "&" || m === "!")) {
        let U = d.indexOf(" ");
        m === "&" && U !== -1 && U < p && d[U + 1] === "!" && (U = d.indexOf(" ", U + 1)), (U === -1 || p < U) && (z = !0);
      }
      z || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return g += M + d, r.inFlow ? c && o && o() : I && !c ? g += lineComment(g, r.indent, a(I)) : D && i && i(), g;
}
function warn(A, e) {
  (A === "debug" || A === "warn") && console.warn(e);
}
const MERGE_KEY = "<<", merge = {
  identify: (A) => A === MERGE_KEY || typeof A == "symbol" && A.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
}, isMergeKey = (A, e) => (merge.identify(e) || isScalar(e) && (!e.type || e.type === Scalar.PLAIN) && merge.identify(e.value)) && A?.doc.schema.tags.some((r) => r.tag === merge.tag && r.default);
function addMergeToJSMap(A, e, r) {
  if (r = A && isAlias(r) ? r.resolve(A.doc) : r, isSeq(r))
    for (const o of r.items)
      mergeValue(A, e, o);
  else if (Array.isArray(r))
    for (const o of r)
      mergeValue(A, e, o);
  else
    mergeValue(A, e, r);
}
function mergeValue(A, e, r) {
  const o = A && isAlias(r) ? r.resolve(A.doc) : r;
  if (!isMap(o))
    throw new Error("Merge sources must be maps or map aliases");
  const i = o.toJSON(null, A, Map);
  for (const [Q, B] of i)
    e instanceof Map ? e.has(Q) || e.set(Q, B) : e instanceof Set ? e.add(Q) : Object.prototype.hasOwnProperty.call(e, Q) || Object.defineProperty(e, Q, {
      value: B,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  return e;
}
function addPairToJSMap(A, e, { key: r, value: o }) {
  if (isNode(r) && r.addToJSMap)
    r.addToJSMap(A, e, o);
  else if (isMergeKey(A, r))
    addMergeToJSMap(A, e, o);
  else {
    const i = toJS(r, "", A);
    if (e instanceof Map)
      e.set(i, toJS(o, i, A));
    else if (e instanceof Set)
      e.add(i);
    else {
      const Q = stringifyKey(r, i, A), B = toJS(o, Q, A);
      Q in e ? Object.defineProperty(e, Q, {
        value: B,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : e[Q] = B;
    }
  }
  return e;
}
function stringifyKey(A, e, r) {
  if (e === null)
    return "";
  if (typeof e != "object")
    return String(e);
  if (isNode(A) && r?.doc) {
    const o = createStringifyContext(r.doc, {});
    o.anchors = /* @__PURE__ */ new Set();
    for (const Q of r.anchors.keys())
      o.anchors.add(Q.anchor);
    o.inFlow = !0, o.inStringifyKey = !0;
    const i = A.toString(o);
    if (!r.mapKeyWarned) {
      let Q = JSON.stringify(i);
      Q.length > 40 && (Q = Q.substring(0, 36) + '..."'), warn(r.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${Q}. Set mapAsMap: true to use object keys.`), r.mapKeyWarned = !0;
    }
    return i;
  }
  return JSON.stringify(e);
}
function createPair(A, e, r) {
  const o = createNode(A, void 0, r), i = createNode(e, void 0, r);
  return new Pair(o, i);
}
class Pair {
  constructor(e, r = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR }), this.key = e, this.value = r;
  }
  clone(e) {
    let { key: r, value: o } = this;
    return isNode(r) && (r = r.clone(e)), isNode(o) && (o = o.clone(e)), new Pair(r, o);
  }
  toJSON(e, r) {
    const o = r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(r, o, this);
  }
  toString(e, r, o) {
    return e?.doc ? stringifyPair(this, e, r, o) : JSON.stringify(this);
  }
}
function stringifyCollection(A, e, r) {
  return (e.inFlow ?? A.flow ? stringifyFlowCollection : stringifyBlockCollection)(A, e, r);
}
function stringifyBlockCollection({ comment: A, items: e }, r, { blockItemPrefix: o, flowChars: i, itemIndent: Q, onChompKeep: B, onComment: s }) {
  const { indent: w, options: { commentString: a } } = r, n = Object.assign({}, r, { indent: Q, type: null });
  let E = !1;
  const l = [];
  for (let h = 0; h < e.length; ++h) {
    const D = e[h];
    let g = null;
    if (isNode(D))
      !E && D.spaceBefore && l.push(""), addCommentBefore(r, l, D.commentBefore, E), D.comment && (g = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let C = stringify(D, n, () => g = null, () => E = !0);
    g && (C += lineComment(C, Q, a(g))), E && g && (E = !1), l.push(o + C);
  }
  let f;
  if (l.length === 0)
    f = i.start + i.end;
  else {
    f = l[0];
    for (let h = 1; h < l.length; ++h) {
      const D = l[h];
      f += D ? `
${w}${D}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(a(A), w), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: i, indentStep: Q, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += Q;
  const w = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let a = !1, n = 0;
  const E = [];
  for (let h = 0; h < A.length; ++h) {
    const D = A[h];
    let g = null;
    if (isNode(D))
      D.spaceBefore && E.push(""), addCommentBefore(e, E, D.commentBefore, !1), D.comment && (g = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (a = !0));
      const I = isNode(D.value) ? D.value : null;
      I ? (I.comment && (g = I.comment), I.commentBefore && (a = !0)) : D.value == null && t?.comment && (g = t.comment);
    }
    g && (a = !0);
    let C = stringify(D, w, () => g = null);
    h < A.length - 1 && (C += ","), g && (C += lineComment(C, o, s(g))), !a && (E.length > n || C.includes(`
`)) && (a = !0), E.push(C), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!a) {
    const h = E.reduce((D, g) => D + g.length + 2, 2);
    a = e.options.lineWidth > 0 && h > e.options.lineWidth;
  }
  if (a) {
    let h = l;
    for (const D of E)
      h += D ? `
${Q}${i}${D}` : `
`;
    return `${h}
${i}${f}`;
  } else
    return `${l}${B}${E.join(" ")}${B}${f}`;
}
function addCommentBefore({ indent: A, options: { commentString: e } }, r, o, i) {
  if (o && i && (o = o.replace(/^\n+/, "")), o) {
    const Q = indentComment(e(o), A);
    r.push(Q.trimStart());
  }
}
function findPair(A, e) {
  const r = isScalar(e) ? e.value : e;
  for (const o of A)
    if (isPair(o) && (o.key === e || o.key === r || isScalar(o.key) && o.key.value === r))
      return o;
}
class YAMLMap extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(e) {
    super(MAP, e), this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(e, r, o) {
    const { keepUndefined: i, replacer: Q } = o, B = new this(e), s = (w, a) => {
      if (typeof Q == "function")
        a = Q.call(r, w, a);
      else if (Array.isArray(Q) && !Q.includes(w))
        return;
      (a !== void 0 || i) && B.items.push(createPair(w, a, o));
    };
    if (r instanceof Map)
      for (const [w, a] of r)
        s(w, a);
    else if (r && typeof r == "object")
      for (const w of Object.keys(r))
        s(w, r[w]);
    return typeof e.sortMapEntries == "function" && B.items.sort(e.sortMapEntries), B;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(e, r) {
    let o;
    isPair(e) ? o = e : !e || typeof e != "object" || !("key" in e) ? o = new Pair(e, e?.value) : o = new Pair(e.key, e.value);
    const i = findPair(this.items, o.key), Q = this.schema?.sortMapEntries;
    if (i) {
      if (!r)
        throw new Error(`Key ${o.key} already set`);
      isScalar(i.value) && isScalarValue(o.value) ? i.value.value = o.value : i.value = o.value;
    } else if (Q) {
      const B = this.items.findIndex((s) => Q(o, s) < 0);
      B === -1 ? this.items.push(o) : this.items.splice(B, 0, o);
    } else
      this.items.push(o);
  }
  delete(e) {
    const r = findPair(this.items, e);
    return r ? this.items.splice(this.items.indexOf(r), 1).length > 0 : !1;
  }
  get(e, r) {
    const i = findPair(this.items, e)?.value;
    return (!r && isScalar(i) ? i.value : i) ?? void 0;
  }
  has(e) {
    return !!findPair(this.items, e);
  }
  set(e, r) {
    this.add(new Pair(e, r), !0);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(e, r, o) {
    const i = o ? new o() : r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    r?.onCreate && r.onCreate(i);
    for (const Q of this.items)
      addPairToJSMap(r, i, Q);
    return i;
  }
  toString(e, r, o) {
    if (!e)
      return JSON.stringify(this);
    for (const i of this.items)
      if (!isPair(i))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(i)} instead`);
    return !e.allNullValues && this.hasAllNullValues(!1) && (e = Object.assign({}, e, { allNullValues: !0 })), stringifyCollection(this, e, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: e.indent || "",
      onChompKeep: o,
      onComment: r
    });
  }
}
class YAMLSeq extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(e) {
    super(SEQ, e), this.items = [];
  }
  add(e) {
    this.items.push(e);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(e) {
    const r = asItemIndex(e);
    return typeof r != "number" ? !1 : this.items.splice(r, 1).length > 0;
  }
  get(e, r) {
    const o = asItemIndex(e);
    if (typeof o != "number")
      return;
    const i = this.items[o];
    return !r && isScalar(i) ? i.value : i;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(e) {
    const r = asItemIndex(e);
    return typeof r == "number" && r < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(e, r) {
    const o = asItemIndex(e);
    if (typeof o != "number")
      throw new Error(`Expected a valid index, not ${e}.`);
    const i = this.items[o];
    isScalar(i) && isScalarValue(r) ? i.value = r : this.items[o] = r;
  }
  toJSON(e, r) {
    const o = [];
    r?.onCreate && r.onCreate(o);
    let i = 0;
    for (const Q of this.items)
      o.push(toJS(Q, String(i++), r));
    return o;
  }
  toString(e, r, o) {
    return e ? stringifyCollection(this, e, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (e.indent || "") + "  ",
      onChompKeep: o,
      onComment: r
    }) : JSON.stringify(this);
  }
  static from(e, r, o) {
    const { replacer: i } = o, Q = new this(e);
    if (r && Symbol.iterator in Object(r)) {
      let B = 0;
      for (let s of r) {
        if (typeof i == "function") {
          const w = r instanceof Set ? s : String(B++);
          s = i.call(r, w, s);
        }
        Q.items.push(createNode(s, void 0, o));
      }
    }
    return Q;
  }
}
function asItemIndex(A) {
  let e = isScalar(A) ? A.value : A;
  return e && typeof e == "string" && (e = Number(e)), typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
}
function createPairs(A, e, r) {
  const { replacer: o } = r, i = new YAMLSeq(A);
  i.tag = "tag:yaml.org,2002:pairs";
  let Q = 0;
  if (e && Symbol.iterator in Object(e))
    for (let B of e) {
      typeof o == "function" && (B = o.call(e, String(Q++), B));
      let s, w;
      if (Array.isArray(B))
        if (B.length === 2)
          s = B[0], w = B[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${B}`);
      else if (B && B instanceof Object) {
        const a = Object.keys(B);
        if (a.length === 1)
          s = a[0], w = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${a.length} keys`);
      } else
        s = B;
      i.items.push(createPair(s, w, r));
    }
  return i;
}
class YAMLOMap extends YAMLSeq {
  constructor() {
    super(), this.add = YAMLMap.prototype.add.bind(this), this.delete = YAMLMap.prototype.delete.bind(this), this.get = YAMLMap.prototype.get.bind(this), this.has = YAMLMap.prototype.has.bind(this), this.set = YAMLMap.prototype.set.bind(this), this.tag = YAMLOMap.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(e, r) {
    if (!r)
      return super.toJSON(e);
    const o = /* @__PURE__ */ new Map();
    r?.onCreate && r.onCreate(o);
    for (const i of this.items) {
      let Q, B;
      if (isPair(i) ? (Q = toJS(i.key, "", r), B = toJS(i.value, Q, r)) : Q = toJS(i, "", r), o.has(Q))
        throw new Error("Ordered maps must not include duplicate keys");
      o.set(Q, B);
    }
    return o;
  }
  static from(e, r, o) {
    const i = createPairs(e, r, o), Q = new this();
    return Q.items = i.items, Q;
  }
}
YAMLOMap.tag = "tag:yaml.org,2002:omap";
class YAMLSet extends YAMLMap {
  constructor(e) {
    super(e), this.tag = YAMLSet.tag;
  }
  add(e) {
    let r;
    isPair(e) ? r = e : e && typeof e == "object" && "key" in e && "value" in e && e.value === null ? r = new Pair(e.key, null) : r = new Pair(e, null), findPair(this.items, r.key) || this.items.push(r);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(e, r) {
    const o = findPair(this.items, e);
    return !r && isPair(o) ? isScalar(o.key) ? o.key.value : o.key : o;
  }
  set(e, r) {
    if (typeof r != "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof r}`);
    const o = findPair(this.items, e);
    o && !r ? this.items.splice(this.items.indexOf(o), 1) : !o && r && this.items.push(new Pair(e));
  }
  toJSON(e, r) {
    return super.toJSON(e, r, Set);
  }
  toString(e, r, o) {
    if (!e)
      return JSON.stringify(this);
    if (this.hasAllNullValues(!0))
      return super.toString(Object.assign({}, e, { allNullValues: !0 }), r, o);
    throw new Error("Set items must all have null values");
  }
  static from(e, r, o) {
    const { replacer: i } = o, Q = new this(e);
    if (r && Symbol.iterator in Object(r))
      for (let B of r)
        typeof i == "function" && (B = i.call(r, B, B)), Q.items.push(createPair(B, null, o));
    return Q;
  }
}
YAMLSet.tag = "tag:yaml.org,2002:set";
new Set("0123456789ABCDEFabcdef");
new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
new Set(",[]{}");
new Set(` ,[]{}
\r	`);
function decodeImplVars(A) {
  const e = {};
  for (const [r, o] of Object.entries(A.varInstances)) {
    const i = [];
    for (const Q of o) {
      const B = A.varTypes[Q[0]], s = A.variables[Q[1]];
      let w = s.i, a = s.n;
      if (Q.length > 2) {
        const E = [], l = [], f = (Q.length - 2) / 2, h = Q.slice(2, 2 + f);
        for (const D of h) {
          const g = A.subscripts[D];
          E.push(g.i), l.push(g.n);
        }
        w += `[${E.join(",")}]`, a += `[${l.join(",")}]`;
      }
      const n = {
        varId: w,
        varName: a,
        varType: B,
        varIndex: s.x,
        subscriptIndices: Q.length > 2 ? Q.slice(2 + (Q.length - 2) / 2) : void 0
      };
      i.push(n);
    }
    e[r] = i;
  }
  return e;
}
function getImplVars(A) {
  const e = decodeImplVars(A), r = /* @__PURE__ */ new Map(), o = [];
  function i(Q, B) {
    const s = [];
    for (const w of B) {
      if (w.varType === "lookup" || w.varType === "data")
        continue;
      const n = `ModelImpl_${w.varId}`;
      r.set(n, w), s.push(n);
    }
    o.push({
      title: Q,
      fn: Q,
      datasetKeys: s
    });
  }
  return i("initConstants", e.constants || []), i("initLevels", e.initVars || []), i("evalLevels", e.levelVars || []), i("evalAux", e.auxVars || []), {
    implVars: r,
    implVarGroups: o
  };
}
function getInputVars(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A) {
    const o = r.varId, i = {
      inputId: r.inputId,
      varId: o,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(o, r.defaultValue)
    };
    e.set(o, i);
  }
  return e;
}
function setInputsForScenario(A, e) {
  function r(a, n) {
    n < a.minValue ? (console.warn(
      `WARNING: Scenario input value ${n} is < min value (${a.minValue}) for input '${a.varName}'`
    ), n = a.minValue) : n > a.maxValue && (console.warn(
      `WARNING: Scenario input value ${n} is > max value (${a.maxValue}) for input '${a.varName}'`
    ), n = a.maxValue), a.value.set(n);
  }
  function o(a) {
    a.value.reset();
  }
  function i(a) {
    a.value.set(a.minValue);
  }
  function Q(a) {
    a.value.set(a.maxValue);
  }
  function B() {
    A.forEach(o);
  }
  function s() {
    A.forEach(i);
  }
  function w() {
    A.forEach(Q);
  }
  switch (e.kind) {
    case "all-inputs": {
      switch (e.position) {
        case "at-default":
          B();
          break;
        case "at-minimum":
          s();
          break;
        case "at-maximum":
          w();
          break;
      }
      break;
    }
    case "input-settings": {
      B();
      for (const a of e.settings) {
        const n = A.get(a.inputVarId);
        if (n)
          switch (a.kind) {
            case "position":
              switch (a.position) {
                case "at-default":
                  o(n);
                  break;
                case "at-minimum":
                  i(n);
                  break;
                case "at-maximum":
                  Q(n);
                  break;
                default:
                  assertNeverExports.assertNever(a.position);
              }
              break;
            case "value":
              r(n, a.value);
              break;
            default:
              assertNeverExports.assertNever(a);
          }
        else
          console.log(`No model input for scenario input ${a.inputVarId}`);
      }
      break;
    }
    default:
      assertNeverExports.assertNever(e);
  }
}
function getOutputVars(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A) {
    const o = r.varId, i = datasetKeyForOutputVar(void 0, o);
    e.set(i, {
      datasetKey: i,
      sourceName: void 0,
      varId: o,
      varName: r.varName
    });
  }
  return e;
}
function datasetKeyForOutputVar(A, e) {
  return `Model_${e}`;
}
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 5 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_3", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed0", varId: "_fake_value_15", varName: "Fake Value 15", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_36", varId: "_meat_diet_composition_switch", varName: "Meat Diet Composition Switch", defaultValue: 0, minValue: -0.2, maxValue: 2.2 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_81", varId: "_vegetarian_diet_composition_switch", varName: "Vegetarian Diet Composition Switch", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_average_caloric_availability_per_capita_per_day", varName: "Average Caloric Availability per Capita per Day" }, { varId: "_average_caloric_consumption_per_capita_per_day", varName: "Average Caloric Consumption per Capita per Day" }, { varId: "_average_total_daily_calorie_intake", varName: "Average Total Daily Calorie Intake" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_calories_per_capita_per_day", varName: "Desired Food Production in Calories per Capita Per Day" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effective_food_demand_per_capita_per_day", varName: "Effective Food Demand per Capita per Day" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_allocated_for_animal_calories", varName: "Land Allocated for Animal Calories" }, { varId: "_land_allocated_for_energy_crops", varName: "Land Allocated for Energy Crops" }, { varId: "_land_allocated_for_food_crops", varName: "Land Allocated for Food Crops" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_daily_calorie_supply_per_capita", varName: "Total Daily Calorie Supply per Capita" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 482717, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const D=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return w.deserialize(o,D)},serialize(o){return w.serialize(o,E)}}}serializers.extendSerializer=A;const I={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?I.deserialize(B):B},serialize(B){return B instanceof Error?I.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let I=A.DefaultSerializer;function Q(D){I=A.extendSerializer(I,D)}common.registerSerializer=Q;function B(D){return I.deserialize(D)}common.deserialize=B;function w(D){return I.serialize(D)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function I(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,D){if(!D){if(!I(w))throw Error();D=[w]}return{[A.$transferable]:!0,send:w,transferables:D}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(I){I.cancel="cancel",I.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(I){I.error="error",I.init="init",I.result="result",I.running="running",I.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},I=function(w,D){self.postMessage(w,D)},Q=function(w){const D=o=>{w(o.data)},E=()=>{self.removeEventListener("message",D)};return self.addEventListener("message",D),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:I,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},I=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:I,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const I=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!I.default().isMainThread},w=function(K,i){Q(I.default().parentPort).postMessage(K,i)},D=function(K){const i=I.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const H=O=>{K(O)},P=()=>{Q(i).off("message",H)};return Q(i).on("message",H),P};function E(){I.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:D,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const I=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function D(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?D():I.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var I=worker&&worker.__awaiter||function(M,k,N,y){function U(j){return j instanceof N?j:new N(function(b){b(j)})}return new(N||(N=Promise))(function(j,b){function V(p){try{x(y.next(p))}catch(X){b(X)}}function $(p){try{x(y.throw(p))}catch(X){b(X)}}function x(p){p.done?j(p.value):U(p.value).then(V,$)}x((y=y.apply(M,k||[])).next())})},Q=worker&&worker.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),D=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let H=!1;const P=new Map,O=M=>M&&M.type===E.MasterMessageType.cancel,n=M=>M&&M.type===E.MasterMessageType.run,t=M=>B.default(M)||q(M);function q(M){return M&&typeof M=="object"&&typeof M.subscribe=="function"}function d(M){return D.isTransferDescriptor(M)?{payload:M.send,transferables:M.transferables}:{payload:M,transferables:void 0}}function Z(){const M={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(M)}function m(M){const k={type:E.WorkerMessageType.init,exposed:{type:"module",methods:M}};o.default.postMessageToMaster(k)}function a(M,k){const{payload:N,transferables:y}=d(k),U={type:E.WorkerMessageType.error,uid:M,error:w.serialize(N)};o.default.postMessageToMaster(U,y)}function c(M,k,N){const{payload:y,transferables:U}=d(N),j={type:E.WorkerMessageType.result,uid:M,complete:k?!0:void 0,payload:y};o.default.postMessageToMaster(j,U)}function L(M,k){const N={type:E.WorkerMessageType.running,uid:M,resultType:k};o.default.postMessageToMaster(N)}function h(M){try{const k={type:E.WorkerMessageType.uncaughtError,error:w.serialize(M)};o.default.postMessageToMaster(k)}catch(k){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,k,`\nOriginal error:`,M)}}function F(M,k,N){return I(this,void 0,void 0,function*(){let y;try{y=k(...N)}catch(j){return a(M,j)}const U=t(y)?"observable":"promise";if(L(M,U),t(y)){const j=y.subscribe(b=>c(M,!1,w.serialize(b)),b=>{a(M,w.serialize(b)),P.delete(M)},()=>{c(M,!0),P.delete(M)});P.set(M,j)}else try{const j=yield y;c(M,!0,w.serialize(j))}catch(j){a(M,w.serialize(j))}})}function l(M){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(H)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(H=!0,typeof M=="function")o.default.subscribeToMasterMessages(k=>{n(k)&&!k.method&&F(k.uid,M,k.args.map(w.deserialize))}),Z();else if(typeof M=="object"&&M){o.default.subscribeToMasterMessages(N=>{n(N)&&N.method&&F(N.uid,M[N.method],N.args.map(w.deserialize))});const k=Object.keys(M).filter(N=>typeof M[N]=="function");m(k)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${M}`);o.default.subscribeToMasterMessages(k=>{if(O(k)){const N=k.uid,y=P.get(N);y&&(y.unsubscribe(),P.delete(N))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",M=>{setTimeout(()=>h(M.error||M),250)}),self.addEventListener("unhandledrejection",M=>{const k=M.reason;k&&typeof k.message=="string"&&setTimeout(()=>h(k),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",M=>{setTimeout(()=>h(M),250)}),process.on("unhandledRejection",M=>{M&&typeof M.message=="string"&&setTimeout(()=>h(M),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var I;let Q=1;for(const B of A){Q+=2;const w=((I=B.subscriptIndices)==null?void 0:I.length)||0;Q+=w}return Q}function encodeVarIndices(A,I){let Q=0;I[Q++]=A.length;for(const B of A){I[Q++]=B.varIndex;const w=B.subscriptIndices,D=w?.length||0;I[Q++]=D;for(let E=0;E<D;E++)I[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var I,Q;let B=1,w=0;for(const D of A){const E=D.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((I=E.subscriptIndices)==null?void 0:I.length)||0;B+=o,B+=2,w+=((Q=D.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,I,Q){let B=0;I[B++]=A.length;let w=0;for(const D of A){const E=D.varRef.varSpec;I[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;I[B++]=K;for(let i=0;i<K;i++)I[B++]=o[i];D.points!==void 0?(I[B++]=w,I[B++]=D.points.length,Q?.set(D.points,w),w+=D.points.length):(I[B++]=-1,I[B++]=0)}}function decodeLookups(A,I){const Q=[];let B=0;const w=A[B++];for(let D=0;D<w;D++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let n=0;n<o;n++)K[n]=A[B++];const i=A[B++],H=A[B++],P={varIndex:E,subscriptIndices:K};let O;i>=0?I?O=I.slice(i,i+H):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:P},points:O})}return Q}function resolveVarRef(A,I,Q){if(!I.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(I.varId){const B=A?.getSpecForVarId(I.varId);if(B)I.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${I.varId}`)}else{const B=A?.getSpecForVarName(I.varName);if(B)I.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${I.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,I,Q){this.view=Q>0?new Int32Array(A,I,Q):void 0,this.offsetInBytes=I,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,I,Q){this.view=Q>0?new Float64Array(A,I,Q):void 0,this.offsetInBytes=I,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,I){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=I(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,I){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=I(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,I,Q){const B=A.length,w=I.varIds.length*I.seriesLength;let D;const E=I.varSpecs;E!==void 0&&E.length>0?D=getEncodedVarIndicesLength(E):D=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const F of Q.lookups)resolveVarRef(this.listing,F.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);o=h.lookupsLength,K=h.lookupIndicesLength}else o=0,K=0;let i=0;function H(h,F){const l=i,M=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,k=Math.round(F*M),N=Math.ceil(k/8)*8;return i+=N,l}const P=H("int32",headerLengthInElements),O=H("float64",extrasLengthInElements),n=H("float64",B),t=H("float64",w),q=H("int32",D),d=H("float64",o),Z=H("int32",K),m=i;if(this.encoded===void 0||this.encoded.byteLength<m){const h=Math.ceil(m*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,P,headerLengthInElements)}const a=this.header.view;let c=0;a[c++]=O,a[c++]=extrasLengthInElements,a[c++]=n,a[c++]=B,a[c++]=t,a[c++]=w,a[c++]=q,a[c++]=D,a[c++]=d,a[c++]=o,a[c++]=Z,a[c++]=K,this.inputs.update(this.encoded,n,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,t,w),this.outputIndices.update(this.encoded,q,D),this.lookups.update(this.encoded,d,o),this.lookupIndices.update(this.encoded,Z,K);const L=this.inputs.view;for(let h=0;h<A.length;h++){const F=A[h];typeof F=="number"?L[h]=F:L[h]=F.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const I=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<I)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const D=B[w++],E=B[w++],o=B[w++],K=B[w++],i=B[w++],H=B[w++],P=B[w++],O=B[w++],n=B[w++],t=B[w++],q=B[w++],d=B[w++],Z=E*Float64Array.BYTES_PER_ELEMENT,m=K*Float64Array.BYTES_PER_ELEMENT,a=H*Float64Array.BYTES_PER_ELEMENT,c=O*Int32Array.BYTES_PER_ELEMENT,L=t*Float64Array.BYTES_PER_ELEMENT,h=d*Int32Array.BYTES_PER_ELEMENT,F=I+Z+m+a+c+L+h;if(A.byteLength<F)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,D,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,i,H),this.outputIndices.update(this.encoded,P,O),this.lookups.update(this.encoded,n,t),this.lookupIndices.update(this.encoded,q,d)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,I){if(I&&I.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${I.length} size=${A}`);this.originalData=I,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,I){if(I){if(I.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${I.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=I.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,I){return this.getValue(A,!1,I)}getValueForY(A){if(this.invertedData===void 0){const I=this.activeSize*2,Q=this.activeData,B=Array(I);for(let w=0;w<I;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,I,Q){if(this.activeSize===0)return _NA_;const B=I?this.invertedData:this.activeData,w=this.activeSize*2,D=!I;let E;D&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<w;o+=2){const K=B[o];if(K>=A){if(D&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const i=B[o-2],H=B[o-1],P=B[o+1],O=K-i,n=P-H;return H+n/O*(A-i)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return D&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,I){if(this.activeSize<=0)return I;const Q=this.activeData[0];return A<Q?I:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,I){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(I){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const D=Q[w];if(D>=A){const E=Q[w-2],o=Q[w-1],K=Q[w+1],i=D-E,H=K-o;return o+H/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const I=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,D,E){const o=Math.floor((E-B)/D);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*D,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,D){return A.currentTime>w?A.currentTime<D||w>D?B*(A.currentTime-w):B*(D-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,D){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let o=I.get(w);o===void 0&&(o=Array(w),I.set(w,o));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=D>0?1:-1;E.sort((i,H)=>{let P;return i.x<H.x?P=-1:i.x>H.x?P=1:P=0,P*K});for(let i=0;i<w;i++)o[i]=E[i].ind;return o},XIDZ(B,w,D){return Math.abs(w)<EPSILON?D:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,D){let E;return D>=1?E="forward":D<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,I,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>I&&B<I+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const I=process.hrtime(A);return(I[0]*1e9+I[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var I;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const D=this.outputs,E=perfNow();(I=this.onRunModel)==null||I.call(this,Q,D,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(D),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let I=A.getModelFunctions();I===void 0&&(I=getJsModelFunctions(),A.setModelFunctions(I));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),D=A.getSaveFreq(),E=Math.round((B-Q)/D)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:D,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,i)=>{runJsModel(A,Q,B,w,D,E,o,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,I,Q,B,w,D,E,o,K,i,H){let P=I;A.setTime(P);const O={timeStep:B,currentTime:P};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const m of i)A.setLookup(m.varRef.varSpec,m.points);E?.length>0&&A.setInputs(m=>E[m]),A.initLevels();const n=Math.round((Q-I)/B),t=Q;let q=0,d=0,Z=0;for(;q<=n;){if(A.evalAux(),P%w<1e-6){Z=0;const m=a=>{const c=Z*D+d;o[c]=P<=t?a:void 0,Z++};if(K!==void 0){let a=0;const c=K[a++];for(let L=0;L<c;L++){const h=K[a++],F=K[a++];let l;F>0&&(l=K.subarray(a,a+F),a+=F);const M={varIndex:h,subscriptIndices:l};A.storeOutput(M,m)}}else A.storeOutputs(m);d++}if(q===n)break;A.evalLevels(),P+=B,A.setTime(P),O.currentTime=P,q++}}var WasmBuffer=class{constructor(A,I,Q,B){this.wasmModule=A,this.numElements=I,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,I;this.heapArray&&((I=(A=this.wasmModule)._free)==null||I.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,I){const B=I*4,w=A._malloc(B),D=w/4,E=A.HEAP32.subarray(D,D+I);return new WasmBuffer(A,I,w,E)}function createFloat64WasmBuffer(A,I){const B=I*8,w=A._malloc(B),D=w/8,E=A.HEAPF64.subarray(D,D+I);return new WasmBuffer(A,I,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function I(Q){return A.cwrap(Q,"number",[])()}this.startTime=I("getInitialTime"),this.endTime=I("getFinalTime"),this.saveFreq=I("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var I,Q,B,w,D,E,o;const K=A.getLookups();if(K!==void 0)for(const n of K){const t=n.varRef.varSpec,q=((I=t.subscriptIndices)==null?void 0:I.length)||0;let d;q>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<q)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,q)),this.lookupSubIndicesBuffer.getArrayView().set(t.subscriptIndices),d=this.lookupSubIndicesBuffer.getAddress()):d=0;let Z,m;if(n.points){const c=n.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<c)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,c)),this.lookupDataBuffer.getArrayView().set(n.points),Z=this.lookupDataBuffer.getAddress(),m=c/2}else Z=0,m=0;const a=t.varIndex;this.wasmSetLookup(a,d,Z,m)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),n=>{var t;return(t=this.inputsBuffer)==null||t.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,n),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((D=this.outputIndicesBuffer)==null?void 0:D.getArrayView(),n=>{var t;return(t=this.outputIndicesBuffer)==null||t.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,n),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const H=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<H)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,H));const P=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(P);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,I,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(I=this.outputsBuffer)==null||I.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(C,g){B=C,w=g}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_average_caloric_availability_per_capita_per_day","_average_caloric_consumption_per_capita_per_day","_average_total_daily_calorie_intake","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_calories_per_capita_per_day","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effective_food_demand_per_capita_per_day","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_allocated_for_animal_calories","_land_allocated_for_energy_crops","_land_allocated_for_food_crops","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_daily_calorie_supply_per_capita","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var D={},E;for(E in Q)Q.hasOwnProperty(E)&&(D[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function H(C){return Q.locateFile?Q.locateFile(C,i):i+C}var P,O;(o||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(C){try{var g=new XMLHttpRequest;return g.open("GET",C,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}catch(e){var s=IA(C);if(s)return s;throw e}}),P=function(C,g,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){g(e.response);return}var u=IA(C);if(u){g(u.buffer);return}s()},e.onerror=s,e.send(null)});var n=Q.print||console.log.bind(console),t=Q.printErr||console.warn.bind(console);for(E in D)D.hasOwnProperty(E)&&(Q[E]=D[E]);D=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var q;Q.wasmBinary&&(q=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&_("no native wasm support detected");var d,Z=!1;function m(C,g){C||_("Assertion failed: "+g)}function a(C){var g=Q["_"+C];return m(g,"Cannot call unknown function "+C+", make sure it is exported"),g}function c(C,g,s,e,u){var z={string:function(J){var T=0;if(J!=null&&J!==0){var eA=(J.length<<2)+1;T=CA(eA),k(J,T,eA)}return T},array:function(J){var T=CA(J.length);return N(J,T),T}};function G(J){return g==="string"?l(J):g==="boolean"?!!J:J}var r=a(C),f=[],S=0;if(e)for(var Y=0;Y<e.length;Y++){var rA=z[s[Y]];rA?(S===0&&(S=sA()),f[Y]=rA(e[Y])):f[Y]=e[Y]}var DA=r.apply(null,f);function FA(J){return S!==0&&KA(S),G(J)}return DA=FA(DA),DA}function L(C,g,s,e){s=s||[];var u=s.every(function(G){return G==="number"}),z=g!=="string";return z&&u&&!e?a(C):function(){return c(C,g,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function F(C,g,s){for(var e=g+s,u=g;C[u]&&!(u>=e);)++u;if(u-g>16&&C.subarray&&h)return h.decode(C.subarray(g,u));for(var z="";g<u;){var G=C[g++];if(!(G&128)){z+=String.fromCharCode(G);continue}var r=C[g++]&63;if((G&224)==192){z+=String.fromCharCode((G&31)<<6|r);continue}var f=C[g++]&63;if((G&240)==224?G=(G&15)<<12|r<<6|f:G=(G&7)<<18|r<<12|f<<6|C[g++]&63,G<65536)z+=String.fromCharCode(G);else{var S=G-65536;z+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return z}function l(C,g){return C?F(U,C,g):""}function M(C,g,s,e){if(!(e>0))return 0;for(var u=s,z=s+e-1,G=0;G<C.length;++G){var r=C.charCodeAt(G);if(r>=55296&&r<=57343){var f=C.charCodeAt(++G);r=65536+((r&1023)<<10)|f&1023}if(r<=127){if(s>=z)break;g[s++]=r}else if(r<=2047){if(s+1>=z)break;g[s++]=192|r>>6,g[s++]=128|r&63}else if(r<=65535){if(s+2>=z)break;g[s++]=224|r>>12,g[s++]=128|r>>6&63,g[s++]=128|r&63}else{if(s+3>=z)break;g[s++]=240|r>>18,g[s++]=128|r>>12&63,g[s++]=128|r>>6&63,g[s++]=128|r&63}}return g[s]=0,s-u}function k(C,g,s){return M(C,U,g,s)}function N(C,g){y.set(C,g)}var y,U,j;function b(C){Q.HEAP8=y=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=j=new Int32Array(C),Q.HEAPU8=U=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var V,$=[],x=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)kA(Q.preRun.shift());wA($)}function GA(){wA(x)}function PA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)aA(Q.postRun.shift());wA(p)}function kA(C){$.unshift(C)}function HA(C){x.unshift(C)}function aA(C){p.unshift(C)}var v=0,W=null;function cA(C){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function nA(C){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&W){var g=W;W=null,g()}}Q.preloadedImages={},Q.preloadedAudios={};function _(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",t(C),Z=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var g=new WebAssembly.RuntimeError(C);throw w(g),g}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function oA(C){return C.startsWith("file://")}var R;R="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAAAYAF8AXxgA39/fwBgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAR/f39/AGADf35/AX4CHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADPDsOAgIEDxACCwUFBAERAgYAEgYTAAMBAQAACgIEAwcFCAMFAAYDCwIEAwQDCQkACBQVCAABFgABBwwFCQQFAXABBwcFBgEBgAKAAgYJAX8BQdC/zgILBzUNAWYCAAFnACEBaAA1AWkAMQFqADABawA/AWwAPgFtADcBbgA2AW8BAAFwADQBcQAzAXIAMgkMAQBBAQsGOjg5PTw7Cq+XDzvBBQILfwF8IwBBEGsiBiQAAkBB4LQOKAIAIgIEQCACQei0DigCACIBQey0DigCAGxBA3RqQfC0DigCAEEDdGogADkDAEHotA4gAUEBajYCAAwBC0HYtA4oAgAiAUUEQAJ/QZCYBisDAEG40gYrAwChQZDSBysDAKMQICIMmUQAAAAAAADgQWMEQCAMqgwBC0GAgICAeAshAUHYtA5BgAgoAgAgAUEBamxBDmxBAXIQFCIBNgIACyAGIAA5AwAgAUHctA4oAgBqIQUjAEEQayIHJAAgByAGNgIMIwBBoAFrIgQkACAEQQhqIgFBwCdBkAEQDSAEIAU2AjQgBCAFNgIcIARBfiAFayICQQ8gAkEPSRsiCDYCOCAEIAUgCGoiAjYCJCAEIAI2AhgjAEHQAWsiAyQAIAMgBjYCzAEgA0GgAWoiAkEAQSgQEBogAyADKALMATYCyAECQEEAIANByAFqIANB0ABqIAIQHkEASARAQX8hAQwBCyABKAJMQQBOIQogASgCACECIAEsAEpBAEwEQCABIAJBX3E2AgALIAJBIHEhCwJ/IAEoAjAEQCABIANByAFqIANB0ABqIANBoAFqEB4MAQsgAUHQADYCMCABIANB0ABqIgI2AhAgASADNgIcIAEgAzYCFCABKAIsIQkgASADNgIsIAEgA0HIAWogAiADQaABahAeIgUgCUUNABogAUEAQQAgASgCJBEBABogAUEANgIwIAEgCTYCLCABQQA2AhwgAUEANgIQIAEoAhQhAiABQQA2AhQgBUF/IAIbCyECIAEgASgCACIBIAtyNgIAQX8gAiABQSBxGyEBIApFDQALIANB0AFqJAAgASECIAgEQCAEKAIcIgEgASAEKAIYRmtBADoAAAsgBEGgAWokACAHQRBqJABB3LQOQdy0DigCACACajYCAAsgBkEQaiQAC0MAIAAgACABpCABvUL///////////8Ag0KAgICAgICA+P8AVhsgASAAvUL///////////8Ag0KAgICAgICA+P8AWBsLQwAgACAAIAGlIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwuvAwMCfAJ/AX4gAL0iBUI/iKchAwJAAkACfAJAIAACfwJAAkAgBUIgiKdB/////wdxIgRBq8aYhARPBEAgAL1C////////////AINCgICAgICAgPj/AFYEQCAADwsgAETvOfr+Qi6GQGQEQCAARAAAAAAAAOB/og8LIABE0rx63SsjhsBjRSAARFEwLdUQSYfAY0VyDQEMBgsgBEHD3Nj+A0kNAyAEQbLFwv8DSQ0BCyAARP6CK2VHFfc/oiADQQN0QfAMaisDAKAiAJlEAAAAAAAA4EFjBEAgAKoMAgtBgICAgHgMAQsgA0UgA2sLIgO3IgFEAADg/kIu5r+ioCIAIAFEdjx5Ne856j2iIgKhDAELIARBgIDA8QNNDQJBACEDIAALIQEgACABIAEgASABoiIAIAAgACAAIABE0KS+cmk3Zj6iRPFr0sVBvbu+oKJELN4lr2pWET+gokSTvb4WbMFmv6CiRD5VVVVVVcU/oKKhIgCiRAAAAAAAAABAIAChoyACoaBEAAAAAAAA8D+gIQEgA0UNACABIAMQEyEBCyABDwsgAEQAAAAAAADwP6AL5wECA38CfET////////v/yEFAkACQCAARQ0AIAAoAgQiA0UNACADQQF0IQMgACgCACEEIAEgACsDKGYEQCAAKAIwIQILIAIgA0kEQANAIAEgBCACQQN0aisDACIFZQRAIAAgAjYCMCAAIAE5AyggAkEAIAEgBWIbRQ0EIAJBA3QgBGoiAEEIaysDACIGIAEgAEEQaysDACIBoSAAKwMIIAahIAUgAaGjoqAPCyACQQJq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ASAAoyACIACjEAY5AwBB8KIOQYChCCsDAEHw9wwrAwCiOQMAQZikDkGooggrAwBBmPkMKwMAojkDAEHoog5B+KAIKwMAQej3DCsDAKI5AwBBkKQOQaCiCCsDAEGQ+QwrAwCiOQMAQeCiDkHwoAgrAwBB4PcMKwMAojkDAEGIpA5BmKIIKwMAQYj5DCsDAKI5AwBB2KIOQeigCCsDAEHY9wwrAwCiOQMAQYCkDkGQoggrAwBBgPkMKwMAojkDAEHQog5B4KAIKwMAQdD3DCsDAKI5AwBB+KMOQYiiCCsDAEH4+AwrAwCiOQMAQciiDkHYoAgrAwBByPcMKwMAojkDAEHwow5BgKIIKwMAQfD4DCsDAKI5AwBBwKIOQdCgCCsDAEHA9wwrAwCiOQMAQeijDkH4oQgrAwBB6PgMKwMAojkDAEG4og5ByKAIKwMAQbj3DCsDAKI5AwBB4KMOQfChCCsDAEHg+AwrAwCiOQMAQbCiDkHAoAgrAwBBsPcMKwMAojkDAEHYow5B6KEIKwMAQdj4DCsDAKI5AwBBqKIOQbigCCsDAEGo9wwrAwCiOQMAQdCjDkHgoQgrAwBB0PgMKwMAojkDAEGgog5BsKAIKwMAQaD3DCsDAKI5AwBByKMOQdihCCsDAEHI+AwrAwCiOQMAQZiiDkGooAgrAwBBmPcMKwMAojkDAEHAow5B0KEIKwMAQcD4DCsDAKI5AwBBkKIOQaCgCCsDAEGQ9wwrAwCiOQMAQbijDkHIoQgrAwBBuPgMKwMAojkDAEGIog5BmKAIKwMAQYj3DCsDAKI5AwBBsKMOQcChCCsDAEGw+AwrAwCiOQMAQYCiDkGQoAgrAwBBgPcMKwMAojkDAEGoow5BuKEIKwMAQaj4DCsDAKI5AwBB0KUOQcCWCCsDAEGA+AwrAwCiOQMAQfimDkHolwgrAwBBqPkMKwMAojkDAEHIpQ5BuJYIKwMAQfj3DCsDAKI5AwBB8KYOQeCXCCsDAEGg+QwrAwCiOQMAQcClDkGwlggrAwBB8PcMKwMAojkDAEHopg5B2JcIKwMAQZj5DCsDAKI5AwBBuKUOQaiWCCsDAEHo9wwrAwCiOQMAQeCmDkHQlwgrAwBBkPkMKwMAojkDAEGwpQ5BoJYIKwMAQeD3DCsDAKI5AwBB2KYOQciXCCsDAEGI+QwrAwCiOQMAQailDkGYlggrAwBB2PcMKwMAojkDAEGgpQ5BkJYIKwMAQdD3DCsDAKI5AwBBmKUOQYiWCCsDAEHI9wwrAwCiOQMAQdCmDkHAlwgrAwBBgPkMKwMAojkDAEHIpg5BuJcIKwMAQfj4DCsDAKI5AwBBwKYOQbCXCCsDAEHw+AwrAwCiOQMAQZClDkGAlggrAwBBwPcMKwMAojkDAEG4pg5BqJcIKwMAQej4DCsDAKI5AwBBiKUOQfiVCCsDAEG49wwrAwCiOQMAQbCmDkGglwgrAwBB4PgMKwMAojkDAEGApQ5B8JUIKwMAQbD3DCsDAKI5AwBBqKYOQZiXCCsDAEHY+AwrAwCiOQMAQfikDkHolQgrAwBBqPcMKwMAojkDAEGgpg5BkJcIKwMAQdD4DCsDAKI5AwBB8KQOQeCVCCsDAEGg9wwrAwCiOQMAQZimDkGIlwgrAwBByPgMKwMAojkDAEHopA5B2JUIKwMAQZj3DCsDAKI5AwBBkKYOQYCXCCsDAEHA+AwrAwCiOQMAQeCkDkHQlQgrAwBBkPcMKwMAojkDAEGIpg5B+JYIKwMAQbj4DCsDAKI5AwBB2KQOQciVCCsDAEGI9wwrAwCiOQMAQYCmDkHwlggrAwBBsPgMKwMAojkDAEHQpA5BwJUIKwMAQYD3DCsDAKI5AwBB+KUOQeiWCCsDAEGo+AwrAwCiOQMAQcikDkG4lQgrAwBB+PYMKwMAojkDAEHwpQ5B4JYIKwMAQaD4DCsDAKI5AwBBoKgOQfCbCCsDAEGA+AwrAwCiOQMAQcipDkGYnQgrAwBBqPkMKwMAojkDAEGYqA5B6JsIKwMAQfj3DCsDAKI5AwBBwKkOQZCdCCsDAEGg+QwrAwCiOQMAQZCoDkHgmwgrAwBB8PcMKwMAojkDAEG4qQ5BiJ0IKwMAQZj5DCsDAKI5AwBBiKgOQdibCCsDAEHo9wwrAwCiOQMAQbCpDkGAnQgrAwBBkPkMKwMAojkDAEGAqA5B0JsIKwMAQeD3DCsDAKI5AwBBqKkOQficCCsDAEGI+QwrAwCiOQMAQfinDkHImwgrAwBB2PcMKwMAojkDAEGgqQ5B8JwIKwMAQYD5DCsDAKI5AwBB8KcOQcCbCCsDAEHQ9wwrAwCiOQMAQZipDkHonAgrAwBB+PgMKwMAojkDAEHopw5BuJsIKwMAQcj3DCsDAKI5AwBBkKkO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gICAgID4rILBADcDAEH49AVCgICAgICQt43BADcDAEHw9AVCgICAgKCq4ZbBADcDAEHo9AVCgICAgIDn+J3BADcDAEHg9AVCgICAgPDIyaLBADcDAEHY9AVCgICAgICtzqbBADcDAEHQ9AVCgICAgOCP2anBADcDAEHI9AVCgICAgLC8tKzBADcDAEHA9AVCgICAgPCbsK/BADcDAEG49AVCgICAgPDooLHBADcDAEGw9AVCgICAgNDf7rLBADcDAEGo9AVCgICAgKC84LTBADcDAEGg9AVCgICAgNiH0rbBADcDAEHY9gVCgICAgICAgPg/NwMAQfj3BUKAgICAgIDAoMAANwMAQfD3BUKAgICAgIDQssAANwMAQej3BUKAgICAgIDSw8AANwMAQeD3BUKAgICAgMDg0sAANwMAQdj3BUKAgICAgPD34cAANwMAQdD3BUKAgICAgJCI7sAANwMAQcj3BUKAgICAgOyP+cAANwMAQcD3BUKAgICAgL2DgsEANwMAQbj3BUKAgICAgLy8icEANwMAQbD3BUKAgICAwISvjsEANwMAQaj3BUKAgICAgMr2kcEANwMAQaD3BUKAgICA4KCWlcEANwMAQZj3BUKAgICA4Iu3mMEANwMAQZD3BUKAgICA4Ie5msEANwMAQYj3BUKAgICA4ODJnMEANwMAQYD3BUKAgICAwMbhnsEANwMAQfj2BUKAgICAgP7UoMEANwMAQfD2BUKAgICAgICA+D83AwBB6PYFQoCAgICAgID4PzcDAEHg9gVCgICAgICAgPg/NwMAQdD2BUKAgICAgIDgssAANwMAQcj2BUKAgICAgICgxcAANwMAQcD2BUKAgICAgIDH1sAANwMAQbj2BUKAgICAgJC55cAANwMAQbD2BUKAgICAgPC19MAANwMAQaj2BUKAgICAgIvlgMEANwMAQaD2BUKAgICAgOizi8EANwMAQZj2BUKAgICA4KvElMEANwMAQZD2BUKAgICAgMvrm8EANwMAQYj4BULmzJmz5syZ8z83AwBBgPgFQsmkksmkksn8PzcDAEHI+AVCs+bMmbPmzPE/NwMAQcD4BUKz5syZs+bM6T83AwBBuPgFQoCAgICAgID0PzcDAEGw+AVCzZmz5syZs/o/NwMAQdD4BULmzJmz5syZ9z83AwBBiPoFQoCAgMCBi/bYwQA3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Qpqz5syZs+bkPzcDAEGIigZCmrPmzJmz5uQ/NwMAQZCKBkKAgICAgICA+D83AwBBmIoGQoCAgKCwjb2SwgA3AwBBoIoGQoCAgICAgNrPwAA3AwBB2IsGQoCAgICAgPvJwAA3AwBB+IwGQoCAgICAgPjOwAA3AwBB8IwGQoCAgICAgPjOwAA3AwBB6IwGQoCAgICAgPjOwAA3AwBB4IwGQoCAgICAgPjOwAA3AwBB2IwGQoCAgICAgPjOwAA3AwBB0IwGQoCAgICAgPjOwAA3AwBByIwGQoCAgICAgPjOwAA3AwBBwIwGQoCAgICAgPjOwAA3AwBBuIwGQoCAgICAgPjOwAA3AwBBsIwGQoCAgICAgPjOwAA3AwBBqIwGQoCAgICAgPjOwAA3AwBBoIwGQoCAgICAwKbQwAA3AwBBmIwGQoCAgICAwKbQwAA3AwBBkIwGQoCAgICAwKbQwAA3AwBBiIwGQoCAgICAwKbQwAA3AwBBgIwGQoCAgICAwKbQwAA3AwBB+IsGQoCAgICAwJDRwAA3AwBB8IsGQoCAgICAwLvQwAA3AwBB6IsGQoCAgICAgPjPwAA3AwBB4IsGQoCAgICAgM/MwAA3AwBBwIoGQoCAgICAgObQwAA3AwBBuIoGQoCAgICAgKTNwAA3AwBBsIoGQoCAgICAgMLKwAA3AwBB0IsGQoCAgICAwJDRwAA3AwBByIsGQoCAgICAwJDRwAA3AwBBwIsGQoCAgICAwJDRwAA3AwBBuIsGQoCAgICAwJDRwAA3AwBBsIsGQoCAgICAwJDRwAA3AwBBqIsGQoCAgICAwJDRwAA3AwBBoIsGQoCAgICAwJDRwAA3AwBBmIsGQoCAgICAwJDRwAA3AwBBkIsGQoCAgICAwPrRwAA3AwBBiIsGQoCAgICAwPrRwAA3AwBBgIsGQoCAgICAwPrRwAA3AwBB+IoGQoCAgICAwPrRwAA3AwBB8IoGQoCAgICAgOXSwAA3AwBB6IoGQoCAgICAgOXSwAA3AwBB4IoGQoCAgICAgOXSwAA3AwBB2IoGQoCAgICAgOXSwAA3AwBB0IoGQoCAgICAgM/TwAA3AwBByIoGQoCAgICAgLrTwAA3AwBBgI0GQoCAgICAgID4PzcDAEGIjQZCgICAgICAgPg/NwMAQZCNBkKAgICAgICA+D83AwBBmI0GQpqz5syZ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gICAgIDYuPDAADcDAEHw5AZCgICAgICc+vrAADcDAEHo5AZCgICAgICGhYTBADcDAEHg5AZCgICAgIDlr4vBADcDAEH45wZCgICAgICAgPg/NwMAQfDnBkKAgICAgICQr8AANwMAQejnBkKAgICAgICmwcAANwMAQeDnBkKAgICAgMCc0sAANwMAQdjnBkKAgICAgNC44cAANwMAQdDnBkKAgICAgLjc8MAANwMAQcjnBkKAgICAgIys/MAANwMAQcDnBkKAgICAgI2BiMEANwMAQbjnBkKAgICAgMzmkMEANwMAQbDnBkKAgICAoKKomMEANwMAQajnBkKAgICA4J/OnMEANwMAQaDnBkKAgICAgKPboMEANwMAQZjnBkKAgICA4JLIo8EANwMAQZDnBkKAgICAoLHmpsEANwMAQYjnBkKAgICAgNGVqcEANwMAQYDnBkKAgICA4P+Eq8EANwMAQfjmBkKAgICAsMv6rMEANwMAQfDmBkKAgICA4O6ar8EANwMAQejmBkKAgICA0LPvscEANwMAQeDmBkKAgICA0MXBtsEANwMAQdjmBkKAgICAsOrgusEANwMAQdDmBkKAgICAiMqsvMEANwMAQbjoBkKAgICAgKXrncEANwMAQbDoBkKAgICAkK/JoMEANwMAQajoBkKAgICAoJeposEANwMAQaDoBkKAgICA4OeOpMEANwMAQZjoBkKAgICA0K2cpsEANwMAQZDoBkKAgICAuO+UqMEANwMAQYjoBkKAgICA+LSYqcEANwMAQYDoBkKAgICAgICA+D83AwBBoOkGQoCAgICAgID4PzcDAEGo6gZCgICAgICA/9bAADcDAEGg6gZCgICAgIDw7OXAADcDAEGY6gZCgICAgIDI5vHAADcDAEGQ6gZCgICAgIDo2/zAADcDAEGI6gZCgICAgID+/IXBADcDAEGA6gZCgICAgICCmo3BADcDAEH46QZCgICAgIDXgZLBADcDAEHw6QZCgICAgMCB65XBADcDAEHo6QZCgICAgKCal5nBADcDAEHg6QZCgICAgICN4JvBADcDAEHY6QZCgICAgKDXx57BADcDAEHQ6QZCgICAgPDx4aDBADcDAEHI6QZCgICAgKDxpKLBADcDAEHA6QZCgICAgODiiaTBADcDAEG46QZCgICAgODC7qXBADcDAEGw6QZCgICAgICAgPg/NwMAQajpBkKAgICAgICA+D83AwBBmOkGQoCAgICAgKCmwAA3AwBBkOkGQoCAgICAgNi4wAA3AwBBiOkGQoCAgICAgMfJwAA3AwBBgOkGQoCAgICAgOrYwAA3AwBB+OgGQoCAgICA8JPowAA3AwBB8OgGQoCAgICAtMXzwAA3AwBB6OgGQoCAgICA/vz+wAA3AwBB4OgGQoCAgIDAsZ2IwQA3AwBB2OgGQoCAgIDAnMaPwQA3AwBB0OgGQoCAgICAreWTwQA3AwBByOgGQoCAgIDg5pKYwQA3AwBBwOgGQoCAgIDA++eawQA3AwBByOoGQoCAgICAgID4PzcDAEHo6wZCgICAgICAgJLAADcDAEHg6wZCgICAgICA4KPAADcDAEHY6wZCgICAgICAgLXAADcDAEHQ6wZCgICAgICAgMTAADcDAEHI6wZCgICAgIDAitPAADcDAEHA6wZCgICAgICg19/AADcDAEG46wZCgICAgICglurAADcDAEGw6wZCgICAgICYl/PAADcDAEGo6wZCgICAgICCyPrAADcDAEGg6wZCgICAgICsgYDBADcDAEGY6wZCgICAgIDoiIPBADcDAEGQ6wZCgICAgICq2IbBADcDAEGI6wZCgICAgMCks4nBADcDAEGA6wZCgICAgID50ovBADcDAEH46gZCgICAgMCDg47BADcDAEHw6gZCgICAgKDBnZDBADcDAEHo6gZCgICAgIDP1JHBADcDAEHg6gZCgICAgICAgPg/NwMAQdjqBkKAgICAgICA+D83AwBB0OoGQoCAgICAgID4PzcDAEHA6gZCgICAgICAgKTAADcDAEG46gZCgICAgICA4LbAADcDAEGw6gZCgICAgICAj8jAADcDAEHw6wZCgICAgKCY+5TBADcDAEH46wZC/NPGl93JmKg/NwMAQYDsBkKAgICAgICAhMAANwMAQYjsBkL7qLi9lNye2j83AwBBkOwGQoCAgICAgICKwAA3AwBBmOwGQoCAgICAgICKwAA3AwBBqOwGQoCAgICAgICKwAA3AwBBoOwGQoCAgICAgICKwAA3AwBBsOwGQoCAgICAgICKwAA3AwBB2OwGQQBBOBAQGkHw7QZCz+/Pmt70pvo/NwMAQejtBkKAgICAgICA/D83AwBBsPAGQri9lNyeurzbwAA3AwBBqPAGQs2Z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/JCotfTV3T83AwBBoMcHQqrmze+I3efePzcDAEGYxwdCqubN74jd594/NwMAQZDHB0Kq5s3viN3n3j83AwBBiMcHQqrmze+I3efePzcDAEGAxwdCtpHp7ujH+d8/NwMAQcDJB0KAgICAgICAksAANwMAQcjJB0KAgICAgICAksAANwMAQdDJB0KAgICAgICA+j83AwBB2MkHQrPmzJmz5szpPzcDAEHgyQdCgICAgICAgPg/NwMAQejJB0KAgICAgICAksAANwMAQfDJB0KAgICAgICQqMAANwMAQfjJB0KAgICAgICQqMAANwMAQYDKB0KAgICAgIDApMAANwMAQYjKB0KAgICAgIDgmsAANwMAQZDKB0K4vZTcnoquzz83AwBB2MoHQvzTxpfdyZjAPzcDAEHQygdCueiituf3p8U/NwMAQcjKB0L808aX3cmYyD83AwBBwMoHQvr9qePL7qS8PzcDAEGYygdCgICAgICAwKTAADcDAEHgygdCgICAgICAgKrAADcDAEHoygdCgICAgICAoKvAADcDAEHwygdCgICAgICAwKzAADcDAEH4ygdCgICAgICAgK/AADcDAEGAywdCgICAgICAwKzAADcDAEGYywdCgICAgICAgPw/NwMAQZDLB0LmzJmz5syZ/z83AwBBqMsHQoCAgICAgID4PzcDAEGgywdC5syZs+bMmfs/NwMAQbjLB0KAgICAgICA/D83AwBBsMsHQubMmbPmzJn5PzcDAEH4ywdCgICAgICAgILAADcDAEHwywdCgICAgICAgPw/NwMAQejLB0Kas+bMmbPm/D83AwBB4MsHQvbR8PqouL38PzcDAEHAywdCzZmz5syZs/4/NwMAQYDMB0Kas+bMmbPmgMAANwMAQYjMB0KAgICAgICAgMAANwMAQZDNB0Kz5syZs+bM+T83AwBB0MwHQoCAgICAgID8PzcDAEGwzAdCgICAgICAgPw/NwMAQaDMB0Kz5syZs+bM+T83AwBB8M0HQoCAgICAgID4PzcDAEHozQdCgICAgICAgPg/NwMAQeDNB0KAgICAgICA+D83AwBBgM4HQpqz5syZs+b0PzcDAEH4zQdCgICAgICAgPg/NwMAQcjOB0KAgICAgICA+D83AwBBwM4HQoCAgICAgID4PzcDAEG4zgdCgICAgICAgPg/NwMAQbDOB0KA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IAUgCEEAIAYbayIIIAkoAgBqNgIAIAFBDEEEIAYbaiIJIAkoAgAgCGs2AgAgBCAFayEEIAAoAjwgAUEIaiABIAYbIgEgByAGayIHIANBDGoQABAdRQ0ACwsgBEF/Rw0BCyAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQIAIMAQsgAEEANgIcIABCADcDECAAIAAoAgBBIHI2AgBBACAHQQJGDQAaIAIgASgCBGsLIQQgA0EgaiQAIAQLQQEBfyMAQRBrIgMkACAAKAI8IAGnIAFCIIinIAJB/wFxIANBCGoQARAdIQAgAykDCCEBIANBEGokAEJ/IAEgABsLCQAgACgCPBAECzIBAX8gACgCFCIDIAEgAiAAKAIQIANrIgEgASACSxsiARANIAAgACgCFCABajYCFCACC5MFAgZ+AX8gASABKAIAQQdqQXhxIgFBEGo2AgAgAAJ8IAEpAwAhBCABKQMIIQUjAEEgayIBJAACQCAFQv///////////wCDIgNCgICAgICAwIA8fSADQoCAgICAgMD/wwB9VARAIAVCBIYgBEI8iIQhAyAEQv//////////D4MiBEKBgICAgICAgAhaBEAgA0KBgICAgICAgMAAfCECDAILIANCgICAgICAgIBAfSECIARCgICAgICAgIAIhUIAUg0BIAIgA0IBg3whAgwBCyAEUCADQoCAgICAgMD//wBUIANCgICAgICAwP//AFEbRQRAIAVCBIYgBEI8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIANC////////v//DAFYNAEIAIQIgA0IwiKciCEGR9wBJDQAgBCECIAVC////////P4NCgICAgICAwACEIgMhBgJAIAhBgfcAayIAQcAAcQRAIAIgAEFAaq2GIQZCACECDAELIABFDQAgBiAArSIHhiACQcAAIABrrYiEIQYgAiAHhiECCyABIAI3AxAgASAGNwMYIAEhAAJAQYH4ACAIayIIQcAAcQRAIAMgCEFAaq2IIQRCACEDDAELIAhFDQAgA0HAACAIa62GIAQgCK0iAoiEIQQgAyACiCEDCyAAIAQ3AwAgACADNwMIIAEpAwhCBIYgASkDACIEQjyIhCECIAEpAxAgASkDGIRCAFKtIARC//////////8Pg4QiBEKB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BUHg2w0rAwAQBUH43A0rAwAQBUHg3A0rAwAQBUHwrA4rAwAQBUH4ng4rAwAQBUHw2w0rAwAQBUH42w0rAwAQBUHorA4rAwAQBUH4rw4rAwAQBUHwrw4rAwAQBUGQ2gwrAwAQBUHI2gwrAwAQBUHY2gwrAwAQBUGg2gwrAwAQBUHA2gwrAwAQBUHQ2gwrAwAQBUGo1gwrAwAQBUHY1gwrAwAQBUHo1gwrAwAQBUGw1gwrAwAQBUHQ1gwrAwAQBUHg1gwrAwAQBUHA1AwrAwAQBUHArA4rAwAQBUHIrA4rAwAQBUGorA4rAwAQBUGwrA4rAwAQBUG4rA4rAwAQBUGgrA4rAwAQBUGw6gwrAwAQBUGQoQ4rAwAQBUHYnQ4rAwAQBUHAnQ4rAwAQBUHYoA4rAwAQBUHgoA4rAwAQBUHooA4rAwAQBUH4oA4rAwAQBUGIoQ4rAwAQBUHQoA4rAwAQBUHwoA4rAwAQBUGAoQ4rAwAQBUGIoA4rAwAQBUHQxA0rAwAQBUGQnw4rAwAQBUHImw4rAwAQBUHQmw4rAwAQBUHYmw4rAwAQBUHomw4rAwAQBUH4mw4rAwAQBUHAmw4rAwAQBUHgmw4rAwAQBUHwmw4rAwAQBUHgnQ4rAwAQBUHInQ4rAwAQBUHQnQ4rAwAQBUG4nQ4rAwAQBUGw7wsrAwAQBUGInA4rAwAQBUGQnA4rAwAQBUGYnA4rAwAQBUGonA4rAwAQBUG4nA4rAwAQBUGAnA4rAwAQBUGgnA4rAwAQBUGwnA4rAwAQBUHQnA4rAwAQBUHInA4rAwAQBUHghw0rAwAQBUHI4A0rAwAQBUGI4A0rAwAQBUGA4A0rAwAQBUHg3w0rAwAQBUH4+g0rAwAQBUGw4A0rAwAQBUGo4A0rAwAQBUGA+w0rAwAQBUHwgw0rAwAQBUGojggrAwAQBUHA8gwrAwAQBUHw+g0rAwAQBUHo+g0rAwAQBUGw3A0rAwAQBUHI2w0rAwAQBUGo3A0rAwAQBUHA+g0rAwAQBUGI2Q0rAwAQBUGQ9w0rAwAQBUG49A0rAwAQBUGw9A0rAwAQBUGo9A0rAwAQBUGg9A0rAwAQBUGoswwrAwAQBUHg8g0rAwAQBUHY8g0rAwAQBUHQ8g0rAwAQBUHI8g0rAwAQBUHw3w0rAwAQBUGgjggrAwAQBUGQ5w0rAwAQBUGI4Q0rAwAQ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",BA(R)||(R=H(R));function MA(C){try{if(C==R&&q)return new Uint8Array(q);var g=IA(C);if(g)return g;if(O)return O(C);throw"both async and sync fetching of the wasm failed"}catch(s){_(s)}}function tA(){if(!q&&(o||K)){if(typeof fetch=="function"&&!oA(R))return fetch(R,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+R+"\'";return C.arrayBuffer()}).catch(function(){return MA(R)});if(P)return new Promise(function(C,g){P(R,function(s){C(new Uint8Array(s))},g)})}return Promise.resolve().then(function(){return MA(R)})}function NA(){var C={a:yA};function g(G,r){var f=G.exports;Q.asm=f,d=Q.asm.f,b(d.buffer),V=Q.asm.o,HA(Q.asm.g),nA()}cA();function s(G){g(G.instance)}function e(G){return tA().then(function(r){return WebAssembly.instantiate(r,C)}).then(function(r){return r}).then(G,function(r){t("failed to asynchronously prepare wasm: "+r),_(r)})}function u(){return!q&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(R)&&!oA(R)&&typeof fetch=="function"?fetch(R,{credentials:"same-origin"}).then(function(G){var r=WebAssembly.instantiateStreaming(G,C);return r.then(s,function(f){return t("wasm streaming compile failed: "+f),t("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(C,g);return z}catch(G){return t("Module.instantiateWasm callback failed with error: "+G),!1}return u().catch(w),{}}function wA(C){for(;C.length>0;){var g=C.shift();if(typeof g=="function"){g(Q);continue}var s=g.func;typeof s=="number"?g.arg===void 0?iA(s)():iA(s)(g.arg):s(g.arg===void 0?null:g.arg)}}function iA(C){return V.get(C)}function OA(C,g,s){U.copyWithin(C,g,g+s)}function hA(C){_("OOM")}function uA(C){U.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,g){var s=AA.buffers[C];g===0||g===10?((C===1?n:t)(F(s,0)),s.length=0):s.push(g)},varargs:void 0,get:function(){AA.varargs+=4;var C=j[AA.varargs-4>>2];return C},getStr:function(C){var g=l(C);return g},get64:function(C,g){return C}};function zA(C){return 0}function jA(C,g,s,e,u){}function fA(C,g,s,e){for(var u=0,z=0;z<s;z++){var G=j[g>>2],r=j[g+4>>2];g+=8;for(var f=0;f<r;f++)AA.printChar(C,U[G+f]);u+=r}return j[e>>2]=u,0}var qA=typeof atob=="function"?atob:function(C){var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,z,G,r,f,S,Y=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do G=g.indexOf(C.charAt(Y++)),r=g.indexOf(C.charAt(Y++)),f=g.indexOf(C.charAt(Y++)),S=g.indexOf(C.charAt(Y++)),e=G<<2|r>>4,u=(r&15)<<4|f>>2,z=(f&3)<<6|S,s=s+String.fromCharCode(e),f!==64&&(s=s+String.fromCharCode(u)),S!==64&&(s=s+String.fromCharCode(z));while(Y<C.length);return s};function mA(C){try{for(var g=qA(C),s=new Uint8Array(g.length),e=0;e<g.length;++e)s[e]=g.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function IA(C){if(BA(C))return mA(C.slice(EA.length))}var yA={c:OA,d:uA,e:zA,b:jA,a:fA};NA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=L;var QA;W=function C(){QA||gA(),QA||(W=C)};function gA(C){if(v>0||(X(),v>0))return;function g(){QA||(QA=!0,Q.calledRun=!0,!Z&&(GA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),PA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),g()},1)):g()}if(Q.run=gA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return gA(),Q.ready})})();exposeModelWorker(Module)})();\n';
class BundleModelRunner {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(e, r, o) {
    this.modelSpec = e, this.inputMap = r, this.modelRunner = o, this.inputs = [...r.values()].map((i) => i.value), this.outputs = o.createOutputs();
  }
  async runModelForScenario(e, r) {
    return setInputsForScenario(this.inputMap, e), r[0]?.startsWith("ModelImpl") ? this.runModelWithImplOutputs(r) : this.runModelWithNormalOutputs(r);
  }
  async runModelWithNormalOutputs(e) {
    this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const r = this.outputs.runTimeInMillis, o = /* @__PURE__ */ new Map();
    for (const i of e) {
      const Q = this.modelSpec.outputVars.get(i);
      if (Q)
        if (Q.sourceName === void 0) {
          const B = this.outputs.getSeriesForVar(Q.varId);
          B && o.set(i, datasetFromPoints(B.points));
        } else
          console.error("Static data sources not yet handled in default model check bundle");
    }
    return {
      datasetMap: o,
      modelRunTime: r
    };
  }
  async runModelWithImplOutputs(e) {
    const r = [];
    for (const a of e) {
      const n = this.modelSpec.implVars.get(a);
      n && r.push(n);
    }
    const o = this.outputs.startTime, i = this.outputs.endTime, Q = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, i, Q);
    B = await this.modelRunner.runModel(this.inputs, B);
    const s = B.runTimeInMillis, w = /* @__PURE__ */ new Map();
    for (const a of e) {
      const n = this.modelSpec.implVars.get(a), E = B.getSeriesForVar(n.varId);
      E && w.set(a, datasetFromPoints(E.points));
    }
    return {
      datasetMap: w,
      modelRunTime: s
    };
  }
}
function datasetFromPoints(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A)
    r.y !== void 0 && e.set(r.x, r.y);
  return e;
}
function createImplOutputs(A, e, r, o) {
  const i = [], Q = [];
  for (const s of A)
    i.push(s.varId), Q.push({
      varIndex: s.varIndex,
      subscriptIndices: s.subscriptIndices
    });
  const B = new Outputs(i, e, r, o);
  return B.varSpecs = Q, B;
}
const VERSION = 1;
class BundleModel {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param bundleModelRunner The bundle model runner.
   */
  constructor(e, r) {
    this.modelSpec = e, this.bundleModelRunner = r;
  }
  // from CheckBundleModel interface
  async getDatasetsForScenario(e, r) {
    return this.bundleModelRunner.runModelForScenario(e, r);
  }
}
async function initBundleModel(A, e) {
  const r = await spawnAsyncModelRunner({ source: modelWorkerJs }), o = new BundleModelRunner(A, e, r);
  return new BundleModel(A, o);
}
function createBundle() {
  const A = getInputVars(inputSpecs), e = getOutputVars(outputSpecs), { implVars: r, implVarGroups: o } = getImplVars(encodedImplVars), i = {
    modelSizeInBytes,
    dataSizeInBytes,
    inputVars: A,
    outputVars: e,
    implVars: r,
    implVarGroups: o
    // TODO: startTime and endTime are optional; the comparison graphs work OK if
    // they are undefined.  The main benefit of using these is to set a specific
    // range for the x-axis on the comparison graphs, so maybe we should find
    // another way to allow these to be defined.
    // startTime,
    // endTime
  };
  return {
    version: VERSION,
    modelSpec: i,
    initModel: () => initBundleModel(i, A)
  };
}
export {
  createBundle
};
