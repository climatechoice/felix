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
      const a = s && s.fromSource ? null : process.platform === "win32" ? `file:///${resolveScriptPath(B).replace(/\\/g, "/")}` : resolveScriptPath(B);
      if (a)
        a.match(/\.tsx?$/i) && detectTsNode() ? super(new Function(createTsNodeModule(resolveScriptPath(B))), [], { esm: !0 }) : a.match(/\.asar[\/\\]/) ? super(a.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), [], { esm: !0 }) : super(a, [], { esm: !0 });
      else {
        const n = B;
        super(new Function(n), [], { esm: !0 });
      }
      e.push(this), this.emitter = new EventEmitter(), this.onerror = (n) => this.emitter.emit("error", n), this.onmessage = (n) => this.emitter.emit("message", n);
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
  ms = function(g, E) {
    E = E || {};
    var l = typeof g;
    if (l === "string" && g.length > 0)
      return B(g);
    if (l === "number" && isFinite(g))
      return E.long ? a(g) : s(g);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(g)
    );
  };
  function B(g) {
    if (g = String(g), !(g.length > 100)) {
      var E = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        g
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
  function s(g) {
    var E = Math.abs(g);
    return E >= o ? Math.round(g / o) + "d" : E >= r ? Math.round(g / r) + "h" : E >= e ? Math.round(g / e) + "m" : E >= A ? Math.round(g / A) + "s" : g + "ms";
  }
  function a(g) {
    var E = Math.abs(g);
    return E >= o ? n(g, E, o, "day") : E >= r ? n(g, E, r, "hour") : E >= e ? n(g, E, e, "minute") : E >= A ? n(g, E, A, "second") : g + " ms";
  }
  function n(g, E, l, f) {
    var m = E >= l * 1.5;
    return Math.round(g / l) + " " + f + (m ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function A(e) {
    o.debug = o, o.default = o, o.coerce = n, o.disable = s, o.enable = Q, o.enabled = a, o.humanize = requireMs(), o.destroy = g, Object.keys(e).forEach((E) => {
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
      let l, f = null, m, I;
      function w(...C) {
        if (!w.enabled)
          return;
        const t = w, D = Number(/* @__PURE__ */ new Date()), c = D - (l || D);
        t.diff = c, t.prev = l, t.curr = D, l = D, C[0] = o.coerce(C[0]), typeof C[0] != "string" && C.unshift("%O");
        let d = 0;
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (K, N) => {
          if (K === "%%")
            return "%";
          d++;
          const O = o.formatters[N];
          if (typeof O == "function") {
            const F = C[d];
            K = O.call(t, F), C.splice(d, 1), d--;
          }
          return K;
        }), o.formatArgs.call(t, C), (t.log || o.log).apply(t, C);
      }
      return w.namespace = E, w.useColors = o.useColors(), w.color = o.selectColor(E), w.extend = i, w.destroy = o.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (m !== o.namespaces && (m = o.namespaces, I = o.enabled(E)), I),
        set: (C) => {
          f = C;
        }
      }), typeof o.init == "function" && o.init(w), w;
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
      let f = 0, m = 0, I = -1, w = 0;
      for (; f < E.length; )
        if (m < l.length && (l[m] === E[f] || l[m] === "*"))
          l[m] === "*" ? (I = m, w = f, m++) : (f++, m++);
        else if (I !== -1)
          m = I + 1, w++, f = w;
        else
          return !1;
      for (; m < l.length && l[m] === "*"; )
        m++;
      return m === l.length;
    }
    function s() {
      const E = [
        ...o.names,
        ...o.skips.map((l) => "-" + l)
      ].join(",");
      return o.enable(""), E;
    }
    function a(E) {
      for (const l of o.skips)
        if (B(E, l))
          return !1;
      for (const l of o.names)
        if (B(E, l))
          return !0;
      return !1;
    }
    function n(E) {
      return E instanceof Error ? E.stack || E.message : E;
    }
    function g() {
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
      let a = !1;
      return () => {
        a || (a = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
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
      let a;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (a = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(a[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function o(a) {
      if (a[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + a[0] + (this.useColors ? "%c " : " ") + "+" + A.exports.humanize(this.diff), !this.useColors)
        return;
      const n = "color: " + this.color;
      a.splice(1, 0, n, "color: inherit");
      let g = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (g++, l === "%c" && (E = g));
      }), a.splice(E, 0, n);
    }
    e.log = console.debug || console.log || (() => {
    });
    function i(a) {
      try {
        a ? e.storage.setItem("debug", a) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function Q() {
      let a;
      try {
        a = e.storage.getItem("debug");
      } catch {
      }
      return !a && typeof process < "u" && "env" in process && (a = process.env.DEBUG), a;
    }
    function B() {
      try {
        return localStorage;
      } catch {
      }
    }
    A.exports = requireCommon()(e);
    const { formatters: s } = A.exports;
    s.j = function(a) {
      try {
        return JSON.stringify(a);
      } catch (n) {
        return "[UnexpectedJSONParseError]: " + n.message;
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
      next(a) {
        const n = !Q;
        if (Q = !0, !n || i)
          try {
            B = e(B, a);
          } catch (g) {
            return s.error(g);
          }
        else
          B = a;
      },
      error(a) {
        s.error(a);
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
          next(a) {
            o.next(a);
          },
          error(a) {
            o.error(a);
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
          let a;
          if (e)
            try {
              a = e(s);
            } catch (g) {
              return o.error(g);
            }
          else
            a = s;
          const n = r.from(a).subscribe({
            next(g) {
              o.next(g);
            },
            error(g) {
              o.error(g);
            },
            complete() {
              const g = i.indexOf(n);
              g >= 0 && i.splice(g, 1), B();
            }
          });
          i.push(n);
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
      const a = (g) => {
        if (!Q) {
          Q = !0;
          try {
            B(i(g));
          } catch (E) {
            s(E);
          }
        }
      }, n = (g) => {
        try {
          B(o(g));
        } catch (E) {
          a(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: a }), this.state === "fulfilled")
        return B(o(this.firstValue));
      if (this.state === "rejected")
        return Q = !0, B(i(this.rejection));
      this.fulfillmentCallbacks.push(n), this.rejectionCallbacks.push(a);
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
    function s(g) {
      try {
        n(o.next(g));
      } catch (E) {
        B(E);
      }
    }
    function a(g) {
      try {
        n(o.throw(g));
      } catch (E) {
        B(E);
      }
    }
    function n(g) {
      g.done ? Q(g.value) : i(g.value).then(s, a);
    }
    n((o = o.apply(A, e || [])).next());
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
      const a = createProxyFunction(A);
      return setPrivateThreadProps(a, A, s, B);
    } else if (i.type === "module") {
      const a = createProxyModule(A, i.methods);
      return setPrivateThreadProps(a, A, s, B);
    } else {
      const a = i.type;
      throw Error(`Worker init message states unexpected type of expose(): ${a}`);
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
    function s(g) {
      try {
        n(o.next(g));
      } catch (E) {
        B(E);
      }
    }
    function a(g) {
      try {
        n(o.throw(g));
      } catch (E) {
        B(E);
      }
    }
    function n(g) {
      g.done ? Q(g.value) : i(g.value).then(s, a);
    }
    n((o = o.apply(A, [])).next());
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
  function s(n) {
    return function(g) {
      return a([n, g]);
    };
  }
  function a(n) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = n[0] & 2 ? i.return : n[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, n[1])).done) return Q;
      switch (i = 0, Q && (n = [n[0] & 2, Q.value]), n[0]) {
        case 0:
        case 1:
          Q = n;
          break;
        case 4:
          return r.label++, { value: n[1], done: !1 };
        case 5:
          r.label++, i = n[1], n = [0];
          continue;
        case 7:
          n = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (n[0] === 6 || n[0] === 2)) {
            r = 0;
            continue;
          }
          if (n[0] === 3 && (!Q || n[1] > Q[0] && n[1] < Q[3])) {
            r.label = n[1];
            break;
          }
          if (n[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = n;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(n);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      n = e.call(A, r);
    } catch (g) {
      n = [6, g], i = 0;
    } finally {
      o = Q = 0;
    }
    if (n[0] & 5) throw n[1];
    return { value: n[0] ? n[1] : void 0, done: !0 };
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
  const i = {}, Q = () => o, B = (a) => {
    var n;
    a !== o && (o = a, (n = i.onSet) == null || n.call(i));
  };
  return { varId: A, get: Q, set: B, reset: () => {
    B(e);
  }, callbacks: i };
}
var Series = class gA {
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
    return new gA(this.varId, e);
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
    for (let a = 0; a < i; a++)
      B.points[a].y = validateNumber(A[s]), s++;
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
    const s = B.subscriptIndices, a = s?.length || 0;
    e[o++] = a;
    for (let n = 0; n < a; n++)
      e[o++] = s[n];
    Q.points !== void 0 ? (e[o++] = i, e[o++] = Q.points.length, r?.set(Q.points, i), i += Q.points.length) : (e[o++] = -1, e[o++] = 0);
  }
}
function decodeLookups(A, e) {
  const r = [];
  let o = 0;
  const i = A[o++];
  for (let Q = 0; Q < i; Q++) {
    const B = A[o++], s = A[o++], a = s > 0 ? Array(s) : void 0;
    for (let f = 0; f < s; f++)
      a[f] = A[o++];
    const n = A[o++], g = A[o++], E = {
      varIndex: B,
      subscriptIndices: a
    };
    let l;
    n >= 0 ? e ? l = e.slice(n, n + g) : l = new Float64Array(0) : l = void 0, r.push({
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
          const a = [];
          for (const g of s)
            a.push(g.subscripts);
          const n = cartesianProductOf(a);
          for (const g of n) {
            const E = g.map((m) => m.id).join(","), l = g.map((m) => m.index), f = `${Q}[${E}]`;
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
    let s, a;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const K of r.lookups)
        resolveVarRef(this.listing, K.varRef, "lookup");
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, a = M.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let n = 0;
    function g(M, K) {
      const N = n, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, F = Math.round(K * O), q = Math.ceil(F / 8) * 8;
      return n += q, N;
    }
    const E = g("int32", headerLengthInElements), l = g("float64", extrasLengthInElements), f = g("float64", o), m = g("float64", i), I = g("int32", Q), w = g("float64", s), C = g("int32", a), t = n;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const D = this.header.view;
    let c = 0;
    D[c++] = l, D[c++] = extrasLengthInElements, D[c++] = f, D[c++] = o, D[c++] = m, D[c++] = i, D[c++] = I, D[c++] = Q, D[c++] = w, D[c++] = s, D[c++] = C, D[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, i), this.outputIndices.update(this.encoded, I, Q), this.lookups.update(this.encoded, w, s), this.lookupIndices.update(this.encoded, C, a);
    const d = this.inputs.view;
    for (let M = 0; M < A.length; M++) {
      const K = A[M];
      typeof K == "number" ? d[M] = K : d[M] = K.get();
    }
    this.outputIndices.view && encodeVarIndices(B, this.outputIndices.view), a > 0 && encodeLookups(r.lookups, this.lookupIndices.view, this.lookups.view);
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
    const Q = o[i++], B = o[i++], s = o[i++], a = o[i++], n = o[i++], g = o[i++], E = o[i++], l = o[i++], f = o[i++], m = o[i++], I = o[i++], w = o[i++], C = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, D = g * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, M = w * Int32Array.BYTES_PER_ELEMENT, K = e + C + t + D + c + d + M;
    if (A.byteLength < K)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, Q, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, n, g), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, m), this.lookupIndices.update(this.encoded, I, w);
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
    runModel: async (s, a, n) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (Q)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      Q = !0, i.updateFromParams(s, a, n);
      let g;
      try {
        g = await e.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        Q = !1;
      }
      return i.updateFromEncodedBuffer(g), i.finalizeOutputs(a), a;
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
        return (t = this._str) !== null && t !== void 0 ? t : this._str = this._items.reduce((D, c) => `${D}${c}`, "");
      }
      get names() {
        var t;
        return (t = this._names) !== null && t !== void 0 ? t : this._names = this._items.reduce((D, c) => (c instanceof r && (D[c.str] = (D[c.str] || 0) + 1), D), {});
      }
    }
    A._Code = o, A.nil = new o("");
    function i(C, ...t) {
      const D = [C[0]];
      let c = 0;
      for (; c < t.length; )
        s(D, t[c]), D.push(C[++c]);
      return new o(D);
    }
    A._ = i;
    const Q = new o("+");
    function B(C, ...t) {
      const D = [f(C[0])];
      let c = 0;
      for (; c < t.length; )
        D.push(Q), s(D, t[c]), D.push(Q, f(C[++c]));
      return a(D), new o(D);
    }
    A.str = B;
    function s(C, t) {
      t instanceof o ? C.push(...t._items) : t instanceof r ? C.push(t) : C.push(E(t));
    }
    A.addCodeArg = s;
    function a(C) {
      let t = 1;
      for (; t < C.length - 1; ) {
        if (C[t] === Q) {
          const D = n(C[t - 1], C[t + 1]);
          if (D !== void 0) {
            C.splice(t - 1, 3, D);
            continue;
          }
          C[t++] = "+";
        }
        t++;
      }
    }
    function n(C, t) {
      if (t === '""')
        return C;
      if (C === '""')
        return t;
      if (typeof C == "string")
        return t instanceof r || C[C.length - 1] !== '"' ? void 0 : typeof t != "string" ? `${C.slice(0, -1)}${t}"` : t[0] === '"' ? C.slice(0, -1) + t.slice(1) : void 0;
      if (typeof t == "string" && t[0] === '"' && !(C instanceof r))
        return `"${C}${t.slice(1)}`;
    }
    function g(C, t) {
      return t.emptyStr() ? C : C.emptyStr() ? t : B`${C}${t}`;
    }
    A.strConcat = g;
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
    function m(C) {
      return typeof C == "string" && A.IDENTIFIER.test(C) ? new o(`.${C}`) : i`[${C}]`;
    }
    A.getProperty = m;
    function I(C) {
      if (typeof C == "string" && A.IDENTIFIER.test(C))
        return new o(`${C}`);
      throw new Error(`CodeGen: invalid export name: ${C}, use explicit $id name mapping`);
    }
    A.getEsmExportName = I;
    function w(C) {
      return new o(C.toString());
    }
    A.regexpCode = w;
  })(code$1)), code$1;
}
var scope = {}, hasRequiredScope;
function requireScope() {
  return hasRequiredScope || (hasRequiredScope = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.ValueScope = A.ValueScopeName = A.Scope = A.varKinds = A.UsedValueState = void 0;
    const e = requireCode$1();
    class r extends Error {
      constructor(n) {
        super(`CodeGen: "code" for ${n} not defined`), this.value = n.value;
      }
    }
    var o;
    (function(a) {
      a[a.Started = 0] = "Started", a[a.Completed = 1] = "Completed";
    })(o || (A.UsedValueState = o = {})), A.varKinds = {
      const: new e.Name("const"),
      let: new e.Name("let"),
      var: new e.Name("var")
    };
    class i {
      constructor({ prefixes: n, parent: g } = {}) {
        this._names = {}, this._prefixes = n, this._parent = g;
      }
      toName(n) {
        return n instanceof e.Name ? n : this.name(n);
      }
      name(n) {
        return new e.Name(this._newName(n));
      }
      _newName(n) {
        const g = this._names[n] || this._nameGroup(n);
        return `${n}${g.index++}`;
      }
      _nameGroup(n) {
        var g, E;
        if (!((E = (g = this._parent) === null || g === void 0 ? void 0 : g._prefixes) === null || E === void 0) && E.has(n) || this._prefixes && !this._prefixes.has(n))
          throw new Error(`CodeGen: prefix "${n}" is not allowed in this scope`);
        return this._names[n] = { prefix: n, index: 0 };
      }
    }
    A.Scope = i;
    class Q extends e.Name {
      constructor(n, g) {
        super(g), this.prefix = n;
      }
      setValue(n, { property: g, itemIndex: E }) {
        this.value = n, this.scopePath = (0, e._)`.${new e.Name(g)}[${E}]`;
      }
    }
    A.ValueScopeName = Q;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(n) {
        super(n), this._values = {}, this._scope = n.scope, this.opts = { ...n, _n: n.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(n) {
        return new Q(n, this._newName(n));
      }
      value(n, g) {
        var E;
        if (g.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(n), { prefix: f } = l, m = (E = g.key) !== null && E !== void 0 ? E : g.ref;
        let I = this._values[f];
        if (I) {
          const t = I.get(m);
          if (t)
            return t;
        } else
          I = this._values[f] = /* @__PURE__ */ new Map();
        I.set(m, l);
        const w = this._scope[f] || (this._scope[f] = []), C = w.length;
        return w[C] = g.ref, l.setValue(g, { property: f, itemIndex: C }), l;
      }
      getValue(n, g) {
        const E = this._values[n];
        if (E)
          return E.get(g);
      }
      scopeRefs(n, g = this._values) {
        return this._reduceValues(g, (E) => {
          if (E.scopePath === void 0)
            throw new Error(`CodeGen: name "${E}" has no value`);
          return (0, e._)`${n}${E.scopePath}`;
        });
      }
      scopeCode(n = this._values, g, E) {
        return this._reduceValues(n, (l) => {
          if (l.value === void 0)
            throw new Error(`CodeGen: name "${l}" has no value`);
          return l.value.code;
        }, g, E);
      }
      _reduceValues(n, g, E = {}, l) {
        let f = e.nil;
        for (const m in n) {
          const I = n[m];
          if (!I)
            continue;
          const w = E[m] = E[m] || /* @__PURE__ */ new Map();
          I.forEach((C) => {
            if (w.has(C))
              return;
            w.set(C, o.Started);
            let t = g(C);
            if (t) {
              const D = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${D} ${C} = ${t};${this.opts._n}`;
            } else if (t = l?.(C))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(C);
            w.set(C, o.Completed);
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
      optimizeNames(u, h) {
        return this;
      }
    }
    class B extends Q {
      constructor(u, h, G) {
        super(), this.varKind = u, this.name = h, this.rhs = G;
      }
      render({ es5: u, _n: h }) {
        const G = u ? r.varKinds.var : this.varKind, z = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${G} ${this.name}${z};` + h;
      }
      optimizeNames(u, h) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = Y(this.rhs, u, h)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends Q {
      constructor(u, h, G) {
        super(), this.lhs = u, this.rhs = h, this.sideEffects = G;
      }
      render({ _n: u }) {
        return `${this.lhs} = ${this.rhs};` + u;
      }
      optimizeNames(u, h) {
        if (!(this.lhs instanceof e.Name && !u[this.lhs.str] && !this.sideEffects))
          return this.rhs = Y(this.rhs, u, h), this;
      }
      get names() {
        const u = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return U(u, this.rhs);
      }
    }
    class a extends s {
      constructor(u, h, G, z) {
        super(u, G, z), this.op = h;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class n extends Q {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `${this.label}:` + u;
      }
    }
    class g extends Q {
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
      optimizeNames(u, h) {
        return this.code = Y(this.code, u, h), this;
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
        return this.nodes.reduce((h, G) => h + G.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let h = u.length;
        for (; h--; ) {
          const G = u[h].optimizeNodes();
          Array.isArray(G) ? u.splice(h, 1, ...G) : G ? u[h] = G : u.splice(h, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, h) {
        const { nodes: G } = this;
        let z = G.length;
        for (; z--; ) {
          const S = G[z];
          S.optimizeNames(u, h) || (V(u, S.names), G.splice(z, 1));
        }
        return G.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, h) => L(u, h.names), {});
      }
    }
    class m extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class I extends f {
    }
    class w extends m {
    }
    w.kind = "else";
    class C extends m {
      constructor(u, h) {
        super(h), this.condition = u;
      }
      render(u) {
        let h = `if(${this.condition})` + super.render(u);
        return this.else && (h += "else " + this.else.render(u)), h;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const u = this.condition;
        if (u === !0)
          return this.nodes;
        let h = this.else;
        if (h) {
          const G = h.optimizeNodes();
          h = this.else = Array.isArray(G) ? new w(G) : G;
        }
        if (h)
          return u === !1 ? h instanceof C ? h : h.nodes : this.nodes.length ? this : new C(rA(u), h instanceof C ? [h] : h.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, h) {
        var G;
        if (this.else = (G = this.else) === null || G === void 0 ? void 0 : G.optimizeNames(u, h), !!(super.optimizeNames(u, h) || this.else))
          return this.condition = Y(this.condition, u, h), this;
      }
      get names() {
        const u = super.names;
        return U(u, this.condition), this.else && L(u, this.else.names), u;
      }
    }
    C.kind = "if";
    class t extends m {
    }
    t.kind = "for";
    class D extends t {
      constructor(u) {
        super(), this.iteration = u;
      }
      render(u) {
        return `for(${this.iteration})` + super.render(u);
      }
      optimizeNames(u, h) {
        if (super.optimizeNames(u, h))
          return this.iteration = Y(this.iteration, u, h), this;
      }
      get names() {
        return L(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, h, G, z) {
        super(), this.varKind = u, this.name = h, this.from = G, this.to = z;
      }
      render(u) {
        const h = u.es5 ? r.varKinds.var : this.varKind, { name: G, from: z, to: S } = this;
        return `for(${h} ${G}=${z}; ${G}<${S}; ${G}++)` + super.render(u);
      }
      get names() {
        const u = U(super.names, this.from);
        return U(u, this.to);
      }
    }
    class d extends t {
      constructor(u, h, G, z) {
        super(), this.loop = u, this.varKind = h, this.name = G, this.iterable = z;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, h) {
        if (super.optimizeNames(u, h))
          return this.iterable = Y(this.iterable, u, h), this;
      }
      get names() {
        return L(super.names, this.iterable.names);
      }
    }
    class M extends m {
      constructor(u, h, G) {
        super(), this.name = u, this.args = h, this.async = G;
      }
      render(u) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(u);
      }
    }
    M.kind = "func";
    class K extends f {
      render(u) {
        return "return " + super.render(u);
      }
    }
    K.kind = "return";
    class N extends m {
      render(u) {
        let h = "try" + super.render(u);
        return this.catch && (h += this.catch.render(u)), this.finally && (h += this.finally.render(u)), h;
      }
      optimizeNodes() {
        var u, h;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (h = this.finally) === null || h === void 0 || h.optimizeNodes(), this;
      }
      optimizeNames(u, h) {
        var G, z;
        return super.optimizeNames(u, h), (G = this.catch) === null || G === void 0 || G.optimizeNames(u, h), (z = this.finally) === null || z === void 0 || z.optimizeNames(u, h), this;
      }
      get names() {
        const u = super.names;
        return this.catch && L(u, this.catch.names), this.finally && L(u, this.finally.names), u;
      }
    }
    class O extends m {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    O.kind = "catch";
    class F extends m {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    F.kind = "finally";
    class q {
      constructor(u, h = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...h, _n: h.lines ? `
` : "" }, this._extScope = u, this._scope = new r.Scope({ parent: u }), this._nodes = [new I()];
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
      scopeValue(u, h) {
        const G = this._extScope.value(u, h);
        return (this._values[G.prefix] || (this._values[G.prefix] = /* @__PURE__ */ new Set())).add(G), G;
      }
      getScopeValue(u, h) {
        return this._extScope.getValue(u, h);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(u) {
        return this._extScope.scopeRefs(u, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(u, h, G, z) {
        const S = this._scope.toName(h);
        return G !== void 0 && z && (this._constants[S.str] = G), this._leafNode(new B(u, S, G)), S;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, h, G) {
        return this._def(r.varKinds.const, u, h, G);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, h, G) {
        return this._def(r.varKinds.let, u, h, G);
      }
      // `var` declaration with optional assignment
      var(u, h, G) {
        return this._def(r.varKinds.var, u, h, G);
      }
      // assignment code
      assign(u, h, G) {
        return this._leafNode(new s(u, h, G));
      }
      // `+=` code
      add(u, h) {
        return this._leafNode(new a(u, A.operators.ADD, h));
      }
      // appends passed SafeExpr to code or executes Block
      code(u) {
        return typeof u == "function" ? u() : u !== e.nil && this._leafNode(new l(u)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...u) {
        const h = ["{"];
        for (const [G, z] of u)
          h.length > 1 && h.push(","), h.push(G), (G !== z || this.opts.es5) && (h.push(":"), (0, e.addCodeArg)(h, z));
        return h.push("}"), new e._Code(h);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, h, G) {
        if (this._blockNode(new C(u)), h && G)
          this.code(h).else().code(G).endIf();
        else if (h)
          this.code(h).endIf();
        else if (G)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(u) {
        return this._elseNode(new C(u));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new w());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(C, w);
      }
      _for(u, h) {
        return this._blockNode(u), h && this.code(h).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, h) {
        return this._for(new D(u), h);
      }
      // `for` statement for a range of values
      forRange(u, h, G, z, S = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(S, J, h, G), () => z(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, h, G, z = r.varKinds.const) {
        const S = this._scope.toName(u);
        if (this.opts.es5) {
          const J = h instanceof e.Name ? h : this.var("_arr", h);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(S, (0, e._)`${J}[${Z}]`), G(S);
          });
        }
        return this._for(new d("of", z, S, h), () => G(S));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, h, G, z = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${h})`, G);
        const S = this._scope.toName(u);
        return this._for(new d("in", z, S, h), () => G(S));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(t);
      }
      // `label` statement
      label(u) {
        return this._leafNode(new n(u));
      }
      // `break` statement
      break(u) {
        return this._leafNode(new g(u));
      }
      // `return` statement
      return(u) {
        const h = new K();
        if (this._blockNode(h), this.code(u), h.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(K);
      }
      // `try` statement
      try(u, h, G) {
        if (!h && !G)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const z = new N();
        if (this._blockNode(z), this.code(u), h) {
          const S = this.name("e");
          this._currNode = z.catch = new O(S), h(S);
        }
        return G && (this._currNode = z.finally = new F(), this.code(G)), this._endBlockNode(O, F);
      }
      // `throw` statement
      throw(u) {
        return this._leafNode(new E(u));
      }
      // start self-balancing block
      block(u, h) {
        return this._blockStarts.push(this._nodes.length), u && this.code(u).endBlock(h), this;
      }
      // end the current self-balancing block
      endBlock(u) {
        const h = this._blockStarts.pop();
        if (h === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const G = this._nodes.length - h;
        if (G < 0 || u !== void 0 && G !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${G} vs ${u} expected`);
        return this._nodes.length = h, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, h = e.nil, G, z) {
        return this._blockNode(new M(u, h, G)), z && this.code(z).endFunc(), this;
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
      _endBlockNode(u, h) {
        const G = this._currNode;
        if (G instanceof u || h && G instanceof h)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${h ? `${u.kind}/${h.kind}` : u.kind}"`);
      }
      _elseNode(u) {
        const h = this._currNode;
        if (!(h instanceof C))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = h.else = u, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const u = this._nodes;
        return u[u.length - 1];
      }
      set _currNode(u) {
        const h = this._nodes;
        h[h.length - 1] = u;
      }
    }
    A.CodeGen = q;
    function L(y, u) {
      for (const h in u)
        y[h] = (y[h] || 0) + (u[h] || 0);
      return y;
    }
    function U(y, u) {
      return u instanceof e._CodeOrName ? L(y, u.names) : y;
    }
    function Y(y, u, h) {
      if (y instanceof e.Name)
        return G(y);
      if (!z(y))
        return y;
      return new e._Code(y._items.reduce((S, J) => (J instanceof e.Name && (J = G(J)), J instanceof e._Code ? S.push(...J._items) : S.push(J), S), []));
      function G(S) {
        const J = h[S.str];
        return J === void 0 || u[S.str] !== 1 ? S : (delete u[S.str], J);
      }
      function z(S) {
        return S instanceof e._Code && S._items.some((J) => J instanceof e.Name && u[J.str] === 1 && h[J.str] !== void 0);
      }
    }
    function V(y, u) {
      for (const h in u)
        y[h] = (y[h] || 0) - (u[h] || 0);
    }
    function rA(y) {
      return typeof y == "boolean" || typeof y == "number" || y === null ? !y : (0, e._)`!${v(y)}`;
    }
    A.not = rA;
    const oA = P(A.operators.AND);
    function T(...y) {
      return y.reduce(oA);
    }
    A.and = T;
    const QA = P(A.operators.OR);
    function _(...y) {
      return y.reduce(QA);
    }
    A.or = _;
    function P(y) {
      return (u, h) => u === e.nil ? h : h === e.nil ? u : (0, e._)`${v(u)} ${y} ${v(h)}`;
    }
    function v(y) {
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
    for (const K of d)
      M[K] = !0;
    return M;
  }
  util.toHash = r;
  function o(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (i(d, M), !Q(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function i(d, M = d.schema) {
    const { opts: K, self: N } = d;
    if (!K.strictSchema || typeof M == "boolean")
      return;
    const O = N.RULES.keywords;
    for (const F in M)
      O[F] || c(d, `unknown keyword: "${F}"`);
  }
  util.checkUnknownRules = i;
  function Q(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (M[K])
        return !0;
    return !1;
  }
  util.schemaHasRules = Q;
  function B(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (K !== "$ref" && M.all[K])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: M }, K, N, O) {
    if (!O) {
      if (typeof K == "number" || typeof K == "boolean")
        return K;
      if (typeof K == "string")
        return (0, A._)`${K}`;
    }
    return (0, A._)`${d}${M}${(0, A.getProperty)(N)}`;
  }
  util.schemaRefOrVal = s;
  function a(d) {
    return E(decodeURIComponent(d));
  }
  util.unescapeFragment = a;
  function n(d) {
    return encodeURIComponent(g(d));
  }
  util.escapeFragment = n;
  function g(d) {
    return typeof d == "number" ? `${d}` : d.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  util.escapeJsonPointer = g;
  function E(d) {
    return d.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  util.unescapeJsonPointer = E;
  function l(d, M) {
    if (Array.isArray(d))
      for (const K of d)
        M(K);
    else
      M(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: M, mergeValues: K, resultToName: N }) {
    return (O, F, q, L) => {
      const U = q === void 0 ? F : q instanceof A.Name ? (F instanceof A.Name ? d(O, F, q) : M(O, F, q), q) : F instanceof A.Name ? (M(O, q, F), F) : K(F, q);
      return L === A.Name && !(U instanceof A.Name) ? N(O, U) : U;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, K) => d.if((0, A._)`${K} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(K, !0), () => d.assign(K, (0, A._)`${K} || {}`).code((0, A._)`Object.assign(${K}, ${M})`));
      }),
      mergeToName: (d, M, K) => d.if((0, A._)`${K} !== true`, () => {
        M === !0 ? d.assign(K, !0) : (d.assign(K, (0, A._)`${K} || {}`), I(d, K, M));
      }),
      mergeValues: (d, M) => d === !0 ? !0 : { ...d, ...M },
      resultToName: m
    }),
    items: f({
      mergeNames: (d, M, K) => d.if((0, A._)`${K} !== true && ${M} !== undefined`, () => d.assign(K, (0, A._)`${M} === true ? true : ${K} > ${M} ? ${K} : ${M}`)),
      mergeToName: (d, M, K) => d.if((0, A._)`${K} !== true`, () => d.assign(K, M === !0 ? !0 : (0, A._)`${K} > ${M} ? ${K} : ${M}`)),
      mergeValues: (d, M) => d === !0 ? !0 : Math.max(d, M),
      resultToName: (d, M) => d.var("items", M)
    })
  };
  function m(d, M) {
    if (M === !0)
      return d.var("props", !0);
    const K = d.var("props", (0, A._)`{}`);
    return M !== void 0 && I(d, K, M), K;
  }
  util.evaluatedPropsToName = m;
  function I(d, M, K) {
    Object.keys(K).forEach((N) => d.assign((0, A._)`${M}${(0, A.getProperty)(N)}`, !0));
  }
  util.setEvaluated = I;
  const w = {};
  function C(d, M) {
    return d.scopeValue("func", {
      ref: M,
      code: w[M.code] || (w[M.code] = new e._Code(M.code))
    });
  }
  util.useFunc = C;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function D(d, M, K) {
    if (d instanceof A.Name) {
      const N = M === t.Num;
      return K ? N ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : N ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return K ? (0, A.getProperty)(d).toString() : "/" + g(d);
  }
  util.getErrorPath = D;
  function c(d, M, K = d.opts.strictSchema) {
    if (K) {
      if (M = `strict mode: ${M}`, K === !0)
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
      message: ({ keyword: w }) => (0, e.str)`must pass "${w}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: w, schemaType: C }) => C ? (0, e.str)`"${w}" keyword must be ${C} ($data)` : (0, e.str)`"${w}" keyword is invalid ($data)`
    };
    function i(w, C = A.keywordError, t, D) {
      const { it: c } = w, { gen: d, compositeRule: M, allErrors: K } = c, N = E(w, C, t);
      D ?? (M || K) ? a(d, N) : n(c, (0, e._)`[${N}]`);
    }
    A.reportError = i;
    function Q(w, C = A.keywordError, t) {
      const { it: D } = w, { gen: c, compositeRule: d, allErrors: M } = D, K = E(w, C, t);
      a(c, K), d || M || n(D, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function B(w, C) {
      w.assign(o.default.errors, C), w.if((0, e._)`${o.default.vErrors} !== null`, () => w.if(C, () => w.assign((0, e._)`${o.default.vErrors}.length`, C), () => w.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: w, keyword: C, schemaValue: t, data: D, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = w.name("err");
      w.forRange("i", c, o.default.errors, (K) => {
        w.const(M, (0, e._)`${o.default.vErrors}[${K}]`), w.if((0, e._)`${M}.instancePath === undefined`, () => w.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), w.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${C}`), d.opts.verbose && (w.assign((0, e._)`${M}.schema`, t), w.assign((0, e._)`${M}.data`, D));
      });
    }
    A.extendErrors = s;
    function a(w, C) {
      const t = w.const("err", C);
      w.if((0, e._)`${o.default.vErrors} === null`, () => w.assign(o.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${o.default.vErrors}.push(${t})`), w.code((0, e._)`${o.default.errors}++`);
    }
    function n(w, C) {
      const { gen: t, validateName: D, schemaEnv: c } = w;
      c.$async ? t.throw((0, e._)`new ${w.ValidationError}(${C})`) : (t.assign((0, e._)`${D}.errors`, C), t.return(!1));
    }
    const g = {
      keyword: new e.Name("keyword"),
      schemaPath: new e.Name("schemaPath"),
      // also used in JTD errors
      params: new e.Name("params"),
      propertyName: new e.Name("propertyName"),
      message: new e.Name("message"),
      schema: new e.Name("schema"),
      parentSchema: new e.Name("parentSchema")
    };
    function E(w, C, t) {
      const { createErrors: D } = w.it;
      return D === !1 ? (0, e._)`{}` : l(w, C, t);
    }
    function l(w, C, t = {}) {
      const { gen: D, it: c } = w, d = [
        f(c, t),
        m(w, t)
      ];
      return I(w, C, d), D.object(...d);
    }
    function f({ errorPath: w }, { instancePath: C }) {
      const t = C ? (0, e.str)`${w}${(0, r.getErrorPath)(C, r.Type.Str)}` : w;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function m({ keyword: w, it: { errSchemaPath: C } }, { schemaPath: t, parentSchema: D }) {
      let c = D ? C : (0, e.str)`${C}/${w}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [g.schemaPath, c];
    }
    function I(w, { params: C, message: t }, D) {
      const { keyword: c, data: d, schemaValue: M, it: K } = w, { opts: N, propertyName: O, topSchemaRef: F, schemaPath: q } = K;
      D.push([g.keyword, c], [g.params, typeof C == "function" ? C(w) : C || (0, e._)`{}`]), N.messages && D.push([g.message, typeof t == "function" ? t(w) : t]), N.verbose && D.push([g.schema, M], [g.parentSchema, (0, e._)`${F}${q}`], [o.default.data, d]), O && D.push([g.propertyName, O]);
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
    const { gen: a, schema: n, validateName: g } = s;
    n === !1 ? B(s, !1) : typeof n == "object" && n.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${g}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function Q(s, a) {
    const { gen: n, schema: g } = s;
    g === !1 ? (n.var(a, !1), B(s)) : n.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = Q;
  function B(s, a) {
    const { gen: n, data: g } = s, E = {
      gen: n,
      keyword: "false schema",
      data: g,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: s
    };
    (0, A.reportError)(E, o, void 0, a);
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
    const D = s(t.type);
    if (D.includes("null")) {
      if (t.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!D.length && t.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      t.nullable === !0 && D.push("null");
    }
    return D;
  }
  dataType.getSchemaTypes = B;
  function s(t) {
    const D = Array.isArray(t) ? t : t ? [t] : [];
    if (D.every(A.isJSONType))
      return D;
    throw new Error("type must be JSONType or JSONType[]: " + D.join(","));
  }
  dataType.getJSONTypes = s;
  function a(t, D) {
    const { gen: c, data: d, opts: M } = t, K = g(D, M.coerceTypes), N = D.length > 0 && !(K.length === 0 && D.length === 1 && (0, e.schemaHasRulesForType)(t, D[0]));
    if (N) {
      const O = m(D, d, M.strictNumbers, Q.Wrong);
      c.if(O, () => {
        K.length ? E(t, D, K) : w(t);
      });
    }
    return N;
  }
  dataType.coerceAndCheckDataType = a;
  const n = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function g(t, D) {
    return D ? t.filter((c) => n.has(c) || D === "array" && c === "array") : [];
  }
  function E(t, D, c) {
    const { gen: d, data: M, opts: K } = t, N = d.let("dataType", (0, o._)`typeof ${M}`), O = d.let("coerced", (0, o._)`undefined`);
    K.coerceTypes === "array" && d.if((0, o._)`${N} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(N, (0, o._)`typeof ${M}`).if(m(D, M, K.strictNumbers), () => d.assign(O, M))), d.if((0, o._)`${O} !== undefined`);
    for (const q of c)
      (n.has(q) || q === "array" && K.coerceTypes === "array") && F(q);
    d.else(), w(t), d.endIf(), d.if((0, o._)`${O} !== undefined`, () => {
      d.assign(M, O), l(t, O);
    });
    function F(q) {
      switch (q) {
        case "string":
          d.elseIf((0, o._)`${N} == "number" || ${N} == "boolean"`).assign(O, (0, o._)`"" + ${M}`).elseIf((0, o._)`${M} === null`).assign(O, (0, o._)`""`);
          return;
        case "number":
          d.elseIf((0, o._)`${N} == "boolean" || ${M} === null
              || (${N} == "string" && ${M} && ${M} == +${M})`).assign(O, (0, o._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, o._)`${N} === "boolean" || ${M} === null
              || (${N} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(O, (0, o._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, o._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(O, !1).elseIf((0, o._)`${M} === "true" || ${M} === 1`).assign(O, !0);
          return;
        case "null":
          d.elseIf((0, o._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(O, null);
          return;
        case "array":
          d.elseIf((0, o._)`${N} === "string" || ${N} === "number"
              || ${N} === "boolean" || ${M} === null`).assign(O, (0, o._)`[${M}]`);
      }
    }
  }
  function l({ gen: t, parentData: D, parentDataProperty: c }, d) {
    t.if((0, o._)`${D} !== undefined`, () => t.assign((0, o._)`${D}[${c}]`, d));
  }
  function f(t, D, c, d = Q.Correct) {
    const M = d === Q.Correct ? o.operators.EQ : o.operators.NEQ;
    let K;
    switch (t) {
      case "null":
        return (0, o._)`${D} ${M} null`;
      case "array":
        K = (0, o._)`Array.isArray(${D})`;
        break;
      case "object":
        K = (0, o._)`${D} && typeof ${D} == "object" && !Array.isArray(${D})`;
        break;
      case "integer":
        K = N((0, o._)`!(${D} % 1) && !isNaN(${D})`);
        break;
      case "number":
        K = N();
        break;
      default:
        return (0, o._)`typeof ${D} ${M} ${t}`;
    }
    return d === Q.Correct ? K : (0, o.not)(K);
    function N(O = o.nil) {
      return (0, o.and)((0, o._)`typeof ${D} == "number"`, O, c ? (0, o._)`isFinite(${D})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function m(t, D, c, d) {
    if (t.length === 1)
      return f(t[0], D, c, d);
    let M;
    const K = (0, i.toHash)(t);
    if (K.array && K.object) {
      const N = (0, o._)`typeof ${D} != "object"`;
      M = K.null ? N : (0, o._)`!${D} || ${N}`, delete K.null, delete K.array, delete K.object;
    } else
      M = o.nil;
    K.number && delete K.integer;
    for (const N in K)
      M = (0, o.and)(M, f(N, D, c, d));
    return M;
  }
  dataType.checkDataTypes = m;
  const I = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: D }) => typeof t == "string" ? (0, o._)`{type: ${t}}` : (0, o._)`{type: ${D}}`
  };
  function w(t) {
    const D = C(t);
    (0, r.reportError)(D, I);
  }
  dataType.reportTypeError = w;
  function C(t) {
    const { gen: D, data: c, schema: d } = t, M = (0, i.schemaRefOrVal)(t, d, "type");
    return {
      gen: D,
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
      for (const a in B)
        o(i, a, B[a].default);
    else Q === "array" && Array.isArray(s) && s.forEach((a, n) => o(i, n, a.default));
  }
  defaults.assignDefaults = r;
  function o(i, Q, B) {
    const { gen: s, compositeRule: a, data: n, opts: g } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${n}${(0, A.getProperty)(Q)}`;
    if (a) {
      (0, e.checkStrictMode)(i, `default is ignored for: ${E}`);
      return;
    }
    let l = (0, A._)`${E} === undefined`;
    g.useDefaults === "empty" && (l = (0, A._)`${l} || ${E} === null || ${E} === ""`), s.if(l, (0, A._)`${E} = ${(0, A.stringify)(B)}`);
  }
  return defaults;
}
var keyword = {}, code = {}, hasRequiredCode;
function requireCode() {
  if (hasRequiredCode) return code;
  hasRequiredCode = 1, Object.defineProperty(code, "__esModule", { value: !0 }), code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
  const A = requireCodegen(), e = requireUtil(), r = requireNames(), o = requireUtil();
  function i(t, D) {
    const { gen: c, data: d, it: M } = t;
    c.if(g(c, d, D, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${D}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function Q({ gen: t, data: D, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((K) => (0, A.and)(g(t, D, K, c.ownProperties), (0, A._)`${M} = ${K}`)));
  }
  code.checkMissingProp = Q;
  function B(t, D) {
    t.setParams({ missingProperty: D }, !0), t.error();
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
  function a(t, D, c) {
    return (0, A._)`${s(t)}.call(${D}, ${c})`;
  }
  code.isOwnProperty = a;
  function n(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, D, c)}` : M;
  }
  code.propertyInData = n;
  function g(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(M, (0, A.not)(a(t, D, c))) : M;
  }
  code.noPropertyInData = g;
  function E(t) {
    return t ? Object.keys(t).filter((D) => D !== "__proto__") : [];
  }
  code.allSchemaProperties = E;
  function l(t, D) {
    return E(D).filter((c) => !(0, e.alwaysValidSchema)(t, D[c]));
  }
  code.schemaProperties = l;
  function f({ schemaCode: t, data: D, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: K }, it: N }, O, F, q) {
    const L = q ? (0, A._)`${t}, ${D}, ${d}${M}` : D, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, K)],
      [r.default.parentData, N.parentData],
      [r.default.parentDataProperty, N.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    N.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${L}, ${c.object(...U)}`;
    return F !== A.nil ? (0, A._)`${O}.call(${F}, ${Y})` : (0, A._)`${O}(${Y})`;
  }
  code.callValidateCode = f;
  const m = (0, A._)`new RegExp`;
  function I({ gen: t, it: { opts: D } }, c) {
    const d = D.unicodeRegExp ? "u" : "", { regExp: M } = D.code, K = M(c, d);
    return t.scopeValue("pattern", {
      key: K.toString(),
      ref: K,
      code: (0, A._)`${M.code === "new RegExp" ? m : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = I;
  function w(t) {
    const { gen: D, data: c, keyword: d, it: M } = t, K = D.name("valid");
    if (M.allErrors) {
      const O = D.let("valid", !0);
      return N(() => D.assign(O, !1)), O;
    }
    return D.var(K, !0), N(() => D.break()), K;
    function N(O) {
      const F = D.const("len", (0, A._)`${c}.length`);
      D.forRange("i", 0, F, (q) => {
        t.subschema({
          keyword: d,
          dataProp: q,
          dataPropType: e.Type.Num
        }, K), D.if((0, A.not)(K), O);
      });
    }
  }
  code.validateArray = w;
  function C(t) {
    const { gen: D, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((F) => (0, e.alwaysValidSchema)(M, F)) && !M.opts.unevaluated)
      return;
    const N = D.let("valid", !1), O = D.name("_valid");
    D.block(() => c.forEach((F, q) => {
      const L = t.subschema({
        keyword: d,
        schemaProp: q,
        compositeRule: !0
      }, O);
      D.assign(N, (0, A._)`${N} || ${O}`), t.mergeValidEvaluated(L, O) || D.if((0, A.not)(N));
    })), t.result(N, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = C, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function i(l, f) {
    const { gen: m, keyword: I, schema: w, parentSchema: C, it: t } = l, D = f.macro.call(t.self, w, C, t), c = n(m, I, D);
    t.opts.validateSchema !== !1 && t.self.validateSchema(D, !0);
    const d = m.name("valid");
    l.subschema({
      schema: D,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${I}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = i;
  function Q(l, f) {
    var m;
    const { gen: I, keyword: w, schema: C, parentSchema: t, $data: D, it: c } = l;
    a(c, f);
    const d = !D && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = n(I, w, d), K = I.let("valid");
    l.block$data(K, N), l.ok((m = f.valid) !== null && m !== void 0 ? m : K);
    function N() {
      if (f.errors === !1)
        q(), f.modifying && B(l), L(() => l.error());
      else {
        const U = f.async ? O() : F();
        f.modifying && B(l), L(() => s(l, U));
      }
    }
    function O() {
      const U = I.let("ruleErrs", null);
      return I.try(() => q((0, A._)`await `), (Y) => I.assign(K, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => I.assign(U, (0, A._)`${Y}.errors`), () => I.throw(Y))), U;
    }
    function F() {
      const U = (0, A._)`${M}.errors`;
      return I.assign(U, null), q(A.nil), U;
    }
    function q(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, V = !("compile" in f && !D || f.schema === !1);
      I.assign(K, (0, A._)`${U}${(0, r.callValidateCode)(l, M, Y, V)}`, f.modifying);
    }
    function L(U) {
      var Y;
      I.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : K), U);
    }
  }
  keyword.funcKeywordCode = Q;
  function B(l) {
    const { gen: f, data: m, it: I } = l;
    f.if(I.parentData, () => f.assign(m, (0, A._)`${I.parentData}[${I.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: m } = l;
    m.if((0, A._)`Array.isArray(${f})`, () => {
      m.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, o.extendErrors)(l);
    }, () => l.error());
  }
  function a({ schemaEnv: l }, f) {
    if (f.async && !l.$async)
      throw new Error("async keyword in sync schema");
  }
  function n(l, f, m) {
    if (m === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof m == "function" ? { ref: m } : { ref: m, code: (0, A.stringify)(m) });
  }
  function g(l, f, m = !1) {
    return !f.length || f.some((I) => I === "array" ? Array.isArray(l) : I === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == I || m && typeof l > "u");
  }
  keyword.validSchemaType = g;
  function E({ schema: l, opts: f, self: m, errSchemaPath: I }, w, C) {
    if (Array.isArray(w.keyword) ? !w.keyword.includes(C) : w.keyword !== C)
      throw new Error("ajv implementation error");
    const t = w.dependencies;
    if (t?.some((D) => !Object.prototype.hasOwnProperty.call(l, D)))
      throw new Error(`parent schema must have dependencies of ${C}: ${t.join(",")}`);
    if (w.validateSchema && !w.validateSchema(l[C])) {
      const c = `keyword "${C}" value is invalid at path "${I}": ` + m.errorsText(w.validateSchema.errors);
      if (f.validateSchema === "log")
        m.logger.error(c);
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
  function r(Q, { keyword: B, schemaProp: s, schema: a, schemaPath: n, errSchemaPath: g, topSchemaRef: E }) {
    if (B !== void 0 && a !== void 0)
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
    if (a !== void 0) {
      if (n === void 0 || g === void 0 || E === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: a,
        schemaPath: n,
        topSchemaRef: E,
        errSchemaPath: g
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function o(Q, B, { dataProp: s, dataPropType: a, data: n, dataTypes: g, propertyName: E }) {
    if (n !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: m, dataPathArr: I, opts: w } = B, C = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(C), Q.errorPath = (0, A.str)`${m}${(0, e.getErrorPath)(s, a, w.jsPropertySyntax)}`, Q.parentDataProperty = (0, A._)`${s}`, Q.dataPathArr = [...I, Q.parentDataProperty];
    }
    if (n !== void 0) {
      const m = n instanceof A.Name ? n : l.let("data", n, !0);
      f(m), E !== void 0 && (Q.propertyName = E);
    }
    g && (Q.dataTypes = g);
    function f(m) {
      Q.data = m, Q.dataLevel = B.dataLevel + 1, Q.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), Q.parentData = B.data, Q.dataNames = [...B.dataNames, m];
    }
  }
  subschema.extendSubschemaData = o;
  function i(Q, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: n, allErrors: g }) {
    a !== void 0 && (Q.compositeRule = a), n !== void 0 && (Q.createErrors = n), g !== void 0 && (Q.allErrors = g), Q.jtdDiscriminator = B, Q.jtdMetadata = s;
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
  function e(o, i, Q, B, s, a, n, g, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, a, n, g, E, l);
      for (var f in B) {
        var m = B[f];
        if (Array.isArray(m)) {
          if (f in A.arrayKeywords)
            for (var I = 0; I < m.length; I++)
              e(o, i, Q, m[I], s + "/" + f + "/" + I, a, s, f, B, I);
        } else if (f in A.propsKeywords) {
          if (m && typeof m == "object")
            for (var w in m)
              e(o, i, Q, m[w], s + "/" + f + "/" + r(w), a, s, f, B, w);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, i, Q, m, s + "/" + f, a, s, f, B);
      }
      Q(B, s, a, n, g, E, l);
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
  function i(I, w = !0) {
    return typeof I == "boolean" ? !0 : w === !0 ? !B(I) : w ? s(I) <= w : !1;
  }
  resolve.inlineRef = i;
  const Q = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(I) {
    for (const w in I) {
      if (Q.has(w))
        return !0;
      const C = I[w];
      if (Array.isArray(C) && C.some(B) || typeof C == "object" && B(C))
        return !0;
    }
    return !1;
  }
  function s(I) {
    let w = 0;
    for (const C in I) {
      if (C === "$ref")
        return 1 / 0;
      if (w++, !o.has(C) && (typeof I[C] == "object" && (0, A.eachItem)(I[C], (t) => w += s(t)), w === 1 / 0))
        return 1 / 0;
    }
    return w;
  }
  function a(I, w = "", C) {
    C !== !1 && (w = E(w));
    const t = I.parse(w);
    return n(I, t);
  }
  resolve.getFullPath = a;
  function n(I, w) {
    return I.serialize(w).split("#")[0] + "#";
  }
  resolve._getFullPath = n;
  const g = /#\/?$/;
  function E(I) {
    return I ? I.replace(g, "") : "";
  }
  resolve.normalizeId = E;
  function l(I, w, C) {
    return C = E(C), I.resolve(w, C);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function m(I, w) {
    if (typeof I == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, D = E(I[C] || w), c = { "": D }, d = a(t, D, !1), M = {}, K = /* @__PURE__ */ new Set();
    return r(I, { allKeys: !0 }, (F, q, L, U) => {
      if (U === void 0)
        return;
      const Y = d + q;
      let V = c[U];
      typeof F[C] == "string" && (V = rA.call(this, F[C])), oA.call(this, F.$anchor), oA.call(this, F.$dynamicAnchor), c[q] = V;
      function rA(T) {
        const QA = this.opts.uriResolver.resolve;
        if (T = E(V ? QA(V, T) : T), K.has(T))
          throw O(T);
        K.add(T);
        let _ = this.refs[T];
        return typeof _ == "string" && (_ = this.refs[_]), typeof _ == "object" ? N(F, _.schema, T) : T !== E(Y) && (T[0] === "#" ? (N(F, M[T], T), M[T] = F) : this.refs[T] = Y), T;
      }
      function oA(T) {
        if (typeof T == "string") {
          if (!f.test(T))
            throw new Error(`invalid anchor "${T}"`);
          rA.call(this, `#${T}`);
        }
      }
    }), M;
    function N(F, q, L) {
      if (q !== void 0 && !e(F, q))
        throw O(L);
    }
    function O(F) {
      return new Error(`reference "${F}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = m, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), i = requireDefaults(), Q = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), n = requireResolve(), g = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (K(k), c(k))) {
      w(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: p, schema: H, schemaEnv: j, opts: b }, R) {
    b.code.es5 ? k.func(p, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, b)}`), I(k, b), k.code(R);
    }) : k.func(p, (0, s._)`${a.default.data}, ${m(b)}`, j.$async, () => k.code(t(H, b)).code(R));
  }
  function m(k) {
    return (0, s._)`{${a.default.instancePath}="", ${a.default.parentData}, ${a.default.parentDataProperty}, ${a.default.rootData}=${a.default.data}${k.dynamicRef ? (0, s._)`, ${a.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function I(k, p) {
    k.if(a.default.valCxt, () => {
      k.var(a.default.instancePath, (0, s._)`${a.default.valCxt}.${a.default.instancePath}`), k.var(a.default.parentData, (0, s._)`${a.default.valCxt}.${a.default.parentData}`), k.var(a.default.parentDataProperty, (0, s._)`${a.default.valCxt}.${a.default.parentDataProperty}`), k.var(a.default.rootData, (0, s._)`${a.default.valCxt}.${a.default.rootData}`), p.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`${a.default.valCxt}.${a.default.dynamicAnchors}`);
    }, () => {
      k.var(a.default.instancePath, (0, s._)`""`), k.var(a.default.parentData, (0, s._)`undefined`), k.var(a.default.parentDataProperty, (0, s._)`undefined`), k.var(a.default.rootData, a.default.data), p.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function w(k) {
    const { schema: p, opts: H, gen: j } = k;
    f(k, () => {
      H.$comment && p.$comment && U(k), F(k), j.let(a.default.vErrors, null), j.let(a.default.errors, 0), H.unevaluated && C(k), N(k), Y(k);
    });
  }
  function C(k) {
    const { gen: p, validateName: H } = k;
    k.evaluated = p.const("evaluated", (0, s._)`${H}.evaluated`), p.if((0, s._)`${k.evaluated}.dynamicProps`, () => p.assign((0, s._)`${k.evaluated}.props`, (0, s._)`undefined`)), p.if((0, s._)`${k.evaluated}.dynamicItems`, () => p.assign((0, s._)`${k.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(k, p) {
    const H = typeof k == "object" && k[p.schemaId];
    return H && (p.code.source || p.code.process) ? (0, s._)`/*# sourceURL=${H} */` : s.nil;
  }
  function D(k, p) {
    if (d(k) && (K(k), c(k))) {
      M(k, p);
      return;
    }
    (0, A.boolOrEmptySchema)(k, p);
  }
  function c({ schema: k, self: p }) {
    if (typeof k == "boolean")
      return !k;
    for (const H in k)
      if (p.RULES.all[H])
        return !0;
    return !1;
  }
  function d(k) {
    return typeof k.schema != "boolean";
  }
  function M(k, p) {
    const { schema: H, gen: j, opts: b } = k;
    b.$comment && H.$comment && U(k), q(k), L(k);
    const R = j.const("_errs", a.default.errors);
    N(k, R), j.var(p, (0, s._)`${R} === ${a.default.errors}`);
  }
  function K(k) {
    (0, g.checkUnknownRules)(k), O(k);
  }
  function N(k, p) {
    if (k.opts.jtd)
      return rA(k, [], !1, p);
    const H = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !j, p);
  }
  function O(k) {
    const { schema: p, errSchemaPath: H, opts: j, self: b } = k;
    p.$ref && j.ignoreKeywordsWithRef && (0, g.schemaHasRulesButRef)(p, b.RULES) && b.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function F(k) {
    const { schema: p, opts: H } = k;
    p.default !== void 0 && H.useDefaults && H.strictSchema && (0, g.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function q(k) {
    const p = k.schema[k.opts.schemaId];
    p && (k.baseId = (0, n.resolveUrl)(k.opts.uriResolver, k.baseId, p));
  }
  function L(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: p, schema: H, errSchemaPath: j, opts: b }) {
    const R = H.$comment;
    if (b.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof b.$comment == "function") {
      const x = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: p.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${x}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: p, schemaEnv: H, validateName: j, ValidationError: b, opts: R } = k;
    H.$async ? p.if((0, s._)`${a.default.errors} === 0`, () => p.return(a.default.data), () => p.throw((0, s._)`new ${b}(${a.default.vErrors})`)) : (p.assign((0, s._)`${j}.errors`, a.default.vErrors), R.unevaluated && V(k), p.return((0, s._)`${a.default.errors} === 0`));
  }
  function V({ gen: k, evaluated: p, props: H, items: j }) {
    H instanceof s.Name && k.assign((0, s._)`${p}.props`, H), j instanceof s.Name && k.assign((0, s._)`${p}.items`, j);
  }
  function rA(k, p, H, j) {
    const { gen: b, schema: R, data: x, allErrors: eA, opts: W, self: $ } = k, { RULES: X } = $;
    if (R.$ref && (W.ignoreKeywordsWithRef || !(0, g.schemaHasRulesButRef)(R, X))) {
      b.block(() => z(k, "$ref", X.all.$ref.definition));
      return;
    }
    W.jtd || T(k, p), b.block(() => {
      for (const AA of X.rules)
        iA(AA);
      iA(X.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (b.if((0, o.checkDataType)(AA.type, x, W.strictNumbers)), oA(k, AA), p.length === 1 && p[0] === AA.type && H && (b.else(), (0, o.reportTypeError)(k)), b.endIf()) : oA(k, AA), eA || b.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function oA(k, p) {
    const { gen: H, schema: j, opts: { useDefaults: b } } = k;
    b && (0, i.assignDefaults)(k, p.type), H.block(() => {
      for (const R of p.rules)
        (0, r.shouldUseRule)(j, R) && z(k, R.keyword, R.definition, p.type);
    });
  }
  function T(k, p) {
    k.schemaEnv.meta || !k.opts.strictTypes || (QA(k, p), k.opts.allowUnionTypes || _(k, p), P(k, k.dataTypes));
  }
  function QA(k, p) {
    if (p.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = p;
        return;
      }
      p.forEach((H) => {
        y(k.dataTypes, H) || h(k, `type "${H}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, p);
    }
  }
  function _(k, p) {
    p.length > 1 && !(p.length === 2 && p.includes("null")) && h(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, p) {
    const H = k.self.RULES.all;
    for (const j in H) {
      const b = H[j];
      if (typeof b == "object" && (0, r.shouldUseRule)(k.schema, b)) {
        const { type: R } = b.definition;
        R.length && !R.some((x) => v(p, x)) && h(k, `missing type "${R.join(",")}" for keyword "${j}"`);
      }
    }
  }
  function v(k, p) {
    return k.includes(p) || p === "number" && k.includes("integer");
  }
  function y(k, p) {
    return k.includes(p) || p === "integer" && k.includes("number");
  }
  function u(k, p) {
    const H = [];
    for (const j of k.dataTypes)
      y(p, j) ? H.push(j) : p.includes("integer") && j === "number" && H.push("integer");
    k.dataTypes = H;
  }
  function h(k, p) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    p += ` at "${H}" (strictTypes)`, (0, g.checkStrictMode)(k, p, k.opts.strictTypes);
  }
  class G {
    constructor(p, H, j) {
      if ((0, Q.validateKeywordUsage)(p, H, j), this.gen = p.gen, this.allErrors = p.allErrors, this.keyword = j, this.data = p.data, this.schema = p.schema[j], this.$data = H.$data && p.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, g.schemaRefOrVal)(p, this.schema, j, this.$data), this.schemaType = H.schemaType, this.parentSchema = p.schema, this.params = {}, this.it = p, this.def = H, this.$data)
        this.schemaCode = p.gen.const("vSchema", Z(this.$data, p));
      else if (this.schemaCode = this.schemaValue, !(0, Q.validSchemaType)(this.schema, H.schemaType, H.allowUndefined))
        throw new Error(`${j} value must be ${JSON.stringify(H.schemaType)}`);
      ("code" in H ? H.trackErrors : H.errors !== !1) && (this.errsCount = p.gen.const("_errs", a.default.errors));
    }
    result(p, H, j) {
      this.failResult((0, s.not)(p), H, j);
    }
    failResult(p, H, j) {
      this.gen.if(p), j ? j() : this.error(), H ? (this.gen.else(), H(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(p, H) {
      this.failResult((0, s.not)(p), void 0, H);
    }
    fail(p) {
      if (p === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(p), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(p) {
      if (!this.$data)
        return this.fail(p);
      const { schemaCode: H } = this;
      this.fail((0, s._)`${H} !== undefined && (${(0, s.or)(this.invalid$data(), p)})`);
    }
    error(p, H, j) {
      if (H) {
        this.setParams(H), this._error(p, j), this.setParams({});
        return;
      }
      this._error(p, j);
    }
    _error(p, H) {
      (p ? E.reportExtraError : E.reportError)(this, this.def.error, H);
    }
    $dataError() {
      (0, E.reportError)(this, this.def.$dataError || E.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, E.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(p) {
      this.allErrors || this.gen.if(p);
    }
    setParams(p, H) {
      H ? Object.assign(this.params, p) : this.params = p;
    }
    block$data(p, H, j = s.nil) {
      this.gen.block(() => {
        this.check$data(p, j), H();
      });
    }
    check$data(p = s.nil, H = s.nil) {
      if (!this.$data)
        return;
      const { gen: j, schemaCode: b, schemaType: R, def: x } = this;
      j.if((0, s.or)((0, s._)`${b} === undefined`, H)), p !== s.nil && j.assign(p, !0), (R.length || x.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), p !== s.nil && j.assign(p, !1)), j.else();
    }
    invalid$data() {
      const { gen: p, schemaCode: H, schemaType: j, def: b, it: R } = this;
      return (0, s.or)(x(), eA());
      function x() {
        if (j.length) {
          if (!(H instanceof s.Name))
            throw new Error("ajv implementation error");
          const W = Array.isArray(j) ? j : [j];
          return (0, s._)`${(0, o.checkDataTypes)(W, H, R.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (b.validateSchema) {
          const W = p.scopeValue("validate$data", { ref: b.validateSchema });
          return (0, s._)`!${W}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(p, H) {
      const j = (0, B.getSubschema)(this.it, p);
      (0, B.extendSubschemaData)(j, this.it, p), (0, B.extendSubschemaMode)(j, p);
      const b = { ...this.it, ...j, items: void 0, props: void 0 };
      return D(b, H), b;
    }
    mergeEvaluated(p, H) {
      const { it: j, gen: b } = this;
      j.opts.unevaluated && (j.props !== !0 && p.props !== void 0 && (j.props = g.mergeEvaluated.props(b, p.props, j.props, H)), j.items !== !0 && p.items !== void 0 && (j.items = g.mergeEvaluated.items(b, p.items, j.items, H)));
    }
    mergeValidEvaluated(p, H) {
      const { it: j, gen: b } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return b.if(H, () => this.mergeEvaluated(p, s.Name)), !0;
    }
  }
  validate.KeywordCxt = G;
  function z(k, p, H, j) {
    const b = new G(k, H, p);
    "code" in H ? H.code(b, j) : b.$data && H.validate ? (0, Q.funcKeywordCode)(b, H) : "macro" in H ? (0, Q.macroKeywordCode)(b, H) : (H.compile || H.validate) && (0, Q.funcKeywordCode)(b, H);
  }
  const S = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: p, dataNames: H, dataPathArr: j }) {
    let b, R;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!S.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      b = k, R = a.default.rootData;
    } else {
      const $ = J.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const X = +$[1];
      if (b = $[2], b === "#") {
        if (X >= p)
          throw new Error(W("property/index", X));
        return j[p - X];
      }
      if (X > p)
        throw new Error(W("data", X));
      if (R = H[p - X], !b)
        return R;
    }
    let x = R;
    const eA = b.split("/");
    for (const $ of eA)
      $ && (R = (0, s._)`${R}${(0, s.getProperty)((0, g.unescapeJsonPointer)($))}`, x = (0, s._)`${x} && ${R}`);
    return x;
    function W($, X) {
      return `Cannot access ${$} ${X} levels up, current level is ${p}`;
    }
  }
  return validate.getData = Z, validate;
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
      let D;
      typeof C.schema == "object" && (D = C.schema), this.schema = C.schema, this.schemaId = C.schemaId, this.root = C.root || this, this.baseId = (t = C.baseId) !== null && t !== void 0 ? t : (0, o.normalizeId)(D?.[C.schemaId || "$id"]), this.schemaPath = C.schemaPath, this.localRefs = C.localRefs, this.meta = C.meta, this.$async = D?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(w) {
    const C = g.call(this, w);
    if (C)
      return C;
    const t = (0, o.getFullPath)(this.opts.uriResolver, w.root.baseId), { es5: D, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: D, lines: c, ownProperties: d });
    let K;
    w.$async && (K = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const N = M.scopeName("validate");
    w.validateName = N;
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
      topSchemaRef: M.scopeValue("schema", this.opts.code.source === !0 ? { ref: w.schema, code: (0, A.stringify)(w.schema) } : { ref: w.schema }),
      validateName: N,
      ValidationError: K,
      schema: w.schema,
      schemaEnv: w,
      rootId: t,
      baseId: w.baseId || t,
      schemaPath: A.nil,
      errSchemaPath: w.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, A._)`""`,
      opts: this.opts,
      self: this
    };
    let F;
    try {
      this._compilations.add(w), (0, Q.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const q = M.toString();
      F = `${M.scopeRefs(r.default.scope)}return ${q}`, this.opts.code.process && (F = this.opts.code.process(F, w));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, F)(this, this.scope.get());
      if (this.scope.value(N, { ref: U }), U.errors = null, U.schema = w.schema, U.schemaEnv = w, w.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: N, validateCode: q, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: V } = O;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: V instanceof A.Name ? void 0 : V,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: V instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return w.validate = U, w;
    } catch (q) {
      throw delete w.validate, delete w.validateName, F && this.logger.error("Error compiling schema, function code:", F), q;
    } finally {
      this._compilations.delete(w);
    }
  }
  compile.compileSchema = s;
  function a(w, C, t) {
    var D;
    t = (0, o.resolveUrl)(this.opts.uriResolver, C, t);
    const c = w.refs[t];
    if (c)
      return c;
    let d = l.call(this, w, t);
    if (d === void 0) {
      const M = (D = w.localRefs) === null || D === void 0 ? void 0 : D[t], { schemaId: K } = this.opts;
      M && (d = new B({ schema: M, schemaId: K, root: w, baseId: C }));
    }
    if (d !== void 0)
      return w.refs[t] = n.call(this, d);
  }
  compile.resolveRef = a;
  function n(w) {
    return (0, o.inlineRef)(w.schema, this.opts.inlineRefs) ? w.schema : w.validate ? w : s.call(this, w);
  }
  function g(w) {
    for (const C of this._compilations)
      if (E(C, w))
        return C;
  }
  compile.getCompilingSchema = g;
  function E(w, C) {
    return w.schema === C.schema && w.root === C.root && w.baseId === C.baseId;
  }
  function l(w, C) {
    let t;
    for (; typeof (t = this.refs[C]) == "string"; )
      C = t;
    return t || this.schemas[C] || f.call(this, w, C);
  }
  function f(w, C) {
    const t = this.opts.uriResolver.parse(C), D = (0, o._getFullPath)(this.opts.uriResolver, t);
    let c = (0, o.getFullPath)(this.opts.uriResolver, w.baseId, void 0);
    if (Object.keys(w.schema).length > 0 && D === c)
      return I.call(this, t, w);
    const d = (0, o.normalizeId)(D), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const K = f.call(this, w, M);
      return typeof K?.schema != "object" ? void 0 : I.call(this, t, K);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(C)) {
        const { schema: K } = M, { schemaId: N } = this.opts, O = K[N];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: K, schemaId: N, root: w, baseId: c });
      }
      return I.call(this, t, M);
    }
  }
  compile.resolveSchema = f;
  const m = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function I(w, { baseId: C, schema: t, root: D }) {
    var c;
    if (((c = w.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const K of w.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const N = t[(0, i.unescapeFragment)(K)];
      if (N === void 0)
        return;
      t = N;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !m.has(K) && O && (C = (0, o.resolveUrl)(this.opts.uriResolver, C, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const K = (0, o.resolveUrl)(this.opts.uriResolver, C, t.$ref);
      d = f.call(this, D, K);
    }
    const { schemaId: M } = this.opts;
    if (d = d || new B({ schema: t, schemaId: M, root: D, baseId: C }), d.schema !== d.root.schema)
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
  function r(I) {
    if (s(I, ".") < 3)
      return { host: I, isIPV4: !1 };
    const w = I.match(e) || [], [C] = w;
    return C ? { host: B(C, "."), isIPV4: !0 } : { host: I, isIPV4: !1 };
  }
  function o(I, w = !1) {
    let C = "", t = !0;
    for (const D of I) {
      if (A[D] === void 0) return;
      D !== "0" && t === !0 && (t = !1), t || (C += D);
    }
    return w && C.length === 0 && (C = "0"), C;
  }
  function i(I) {
    let w = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], D = [];
    let c = !1, d = !1, M = !1;
    function K() {
      if (D.length) {
        if (c === !1) {
          const N = o(D);
          if (N !== void 0)
            t.push(N);
          else
            return C.error = !0, !1;
        }
        D.length = 0;
      }
      return !0;
    }
    for (let N = 0; N < I.length; N++) {
      const O = I[N];
      if (!(O === "[" || O === "]"))
        if (O === ":") {
          if (d === !0 && (M = !0), !K())
            break;
          if (w++, t.push(":"), w > 7) {
            C.error = !0;
            break;
          }
          N - 1 >= 0 && I[N - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!K())
            break;
          c = !0;
        } else {
          D.push(O);
          continue;
        }
    }
    return D.length && (c ? C.zone = D.join("") : M ? t.push(D.join("")) : t.push(o(D))), C.address = t.join(""), C;
  }
  function Q(I) {
    if (s(I, ":") < 2)
      return { host: I, isIPV6: !1 };
    const w = i(I);
    if (w.error)
      return { host: I, isIPV6: !1 };
    {
      let C = w.address, t = w.address;
      return w.zone && (C += "%" + w.zone, t += "%25" + w.zone), { host: C, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(I, w) {
    let C = "", t = !0;
    const D = I.length;
    for (let c = 0; c < D; c++) {
      const d = I[c];
      d === "0" && t ? (c + 1 <= D && I[c + 1] === w || c + 1 === D) && (C += d, t = !1) : (d === w ? t = !0 : t = !1, C += d);
    }
    return C;
  }
  function s(I, w) {
    let C = 0;
    for (let t = 0; t < I.length; t++)
      I[t] === w && C++;
    return C;
  }
  const a = /^\.\.?\//u, n = /^\/\.(?:\/|$)/u, g = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(I) {
    const w = [];
    for (; I.length; )
      if (I.match(a))
        I = I.replace(a, "");
      else if (I.match(n))
        I = I.replace(n, "/");
      else if (I.match(g))
        I = I.replace(g, "/"), w.pop();
      else if (I === "." || I === "..")
        I = "";
      else {
        const C = I.match(E);
        if (C) {
          const t = C[0];
          I = I.slice(t.length), w.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return w.join("");
  }
  function f(I, w) {
    const C = w !== !0 ? escape : unescape;
    return I.scheme !== void 0 && (I.scheme = C(I.scheme)), I.userinfo !== void 0 && (I.userinfo = C(I.userinfo)), I.host !== void 0 && (I.host = C(I.host)), I.path !== void 0 && (I.path = C(I.path)), I.query !== void 0 && (I.query = C(I.query)), I.fragment !== void 0 && (I.fragment = C(I.fragment)), I;
  }
  function m(I) {
    const w = [];
    if (I.userinfo !== void 0 && (w.push(I.userinfo), w.push("@")), I.host !== void 0) {
      let C = unescape(I.host);
      const t = r(C);
      if (t.isIPV4)
        C = t.host;
      else {
        const D = Q(t.host);
        D.isIPV6 === !0 ? C = `[${D.escapedHost}]` : C = I.host;
      }
      w.push(C);
    }
    return (typeof I.port == "number" || typeof I.port == "string") && (w.push(":"), w.push(String(I.port))), w.length ? w.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: m,
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
    const D = String(t.scheme).toLowerCase() === "https";
    return (t.port === (D ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function Q(t) {
    return t.secure = r(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
  }
  function B(t) {
    if ((t.port === (r(t) ? 443 : 80) || t.port === "") && (t.port = void 0), typeof t.secure == "boolean" && (t.scheme = t.secure ? "wss" : "ws", t.secure = void 0), t.resourceName) {
      const [D, c] = t.resourceName.split("?");
      t.path = D && D !== "/" ? D : void 0, t.query = c, t.resourceName = void 0;
    }
    return t.fragment = void 0, t;
  }
  function s(t, D) {
    if (!t.path)
      return t.error = "URN can not be parsed", t;
    const c = t.path.match(e);
    if (c) {
      const d = D.scheme || t.scheme || "urn";
      t.nid = c[1].toLowerCase(), t.nss = c[2];
      const M = `${d}:${D.nid || t.nid}`, K = C[M];
      t.path = void 0, K && (t = K.parse(t, D));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, D) {
    const c = D.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${D.nid || d}`, K = C[M];
    K && (t = K.serialize(t, D));
    const N = t, O = t.nss;
    return N.path = `${d || D.nid}:${O}`, D.skipEscape = !0, N;
  }
  function n(t, D) {
    const c = t;
    return c.uuid = c.nss, c.nss = void 0, !D.tolerant && (!c.uuid || !A.test(c.uuid)) && (c.error = c.error || "UUID is not valid."), c;
  }
  function g(t) {
    const D = t;
    return D.nss = (t.uuid || "").toLowerCase(), D;
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
  }, m = {
    scheme: "wss",
    domainHost: f.domainHost,
    parse: f.parse,
    serialize: f.serialize
  }, C = {
    http: E,
    https: l,
    ws: f,
    wss: m,
    urn: {
      scheme: "urn",
      parse: s,
      serialize: a,
      skipNormalize: !0
    },
    "urn:uuid": {
      scheme: "urn:uuid",
      parse: n,
      serialize: g,
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
  function B(w, C) {
    return typeof w == "string" ? w = g(m(w, C), C) : typeof w == "object" && (w = m(g(w, C), C)), w;
  }
  function s(w, C, t) {
    const D = Object.assign({ scheme: "null" }, t), c = a(m(w, D), m(C, D), D, !0);
    return g(c, { ...D, skipEscape: !0 });
  }
  function a(w, C, t, D) {
    const c = {};
    return D || (w = m(g(w, t), t), C = m(g(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((w.userinfo !== void 0 || w.host !== void 0 || w.port !== void 0) && !w.path ? c.path = "/" + C.path : w.path ? c.path = w.path.slice(0, w.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = w.path, C.query !== void 0 ? c.query = C.query : c.query = w.query), c.userinfo = w.userinfo, c.host = w.host, c.port = w.port), c.scheme = w.scheme), c.fragment = C.fragment, c;
  }
  function n(w, C, t) {
    return typeof w == "string" ? (w = unescape(w), w = g(i(m(w, t), !0), { ...t, skipEscape: !0 })) : typeof w == "object" && (w = g(i(w, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = g(i(m(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = g(i(C, !0), { ...t, skipEscape: !0 })), w.toLowerCase() === C.toLowerCase();
  }
  function g(w, C) {
    const t = {
      host: w.host,
      scheme: w.scheme,
      userinfo: w.userinfo,
      port: w.port,
      path: w.path,
      query: w.query,
      nid: w.nid,
      nss: w.nss,
      uuid: w.uuid,
      fragment: w.fragment,
      reference: w.reference,
      resourceName: w.resourceName,
      secure: w.secure,
      error: ""
    }, D = Object.assign({}, C), c = [], d = Q[(D.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, D), t.path !== void 0 && (D.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), D.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = o(t);
    if (M !== void 0 && (D.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let K = t.path;
      !D.absolutePath && (!d || !d.absolutePath) && (K = r(K)), M === void 0 && (K = K.replace(/^\/\//u, "/%2F")), c.push(K);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (w, C) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(C)));
  function l(w) {
    let C = 0;
    for (let t = 0, D = w.length; t < D; ++t)
      if (C = w.charCodeAt(t), C > 126 || E[C])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function m(w, C) {
    const t = Object.assign({}, C), D = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    }, c = w.indexOf("%") !== -1;
    let d = !1;
    t.reference === "suffix" && (w = (t.scheme ? t.scheme + ":" : "") + "//" + w);
    const M = w.match(f);
    if (M) {
      if (D.scheme = M[1], D.userinfo = M[3], D.host = M[4], D.port = parseInt(M[5], 10), D.path = M[6] || "", D.query = M[7], D.fragment = M[8], isNaN(D.port) && (D.port = M[5]), D.host) {
        const N = e(D.host);
        if (N.isIPV4 === !1) {
          const O = A(N.host);
          D.host = O.host.toLowerCase(), d = O.isIPV6;
        } else
          D.host = N.host, d = !0;
      }
      D.scheme === void 0 && D.userinfo === void 0 && D.host === void 0 && D.port === void 0 && !D.path && D.query === void 0 ? D.reference = "same-document" : D.scheme === void 0 ? D.reference = "relative" : D.fragment === void 0 ? D.reference = "absolute" : D.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== D.reference && (D.error = D.error || "URI is not a " + t.reference + " reference.");
      const K = Q[(t.scheme || D.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!K || !K.unicodeSupport) && D.host && (t.domainHost || K && K.domainHost) && d === !1 && l(D.host))
        try {
          D.host = URL.domainToASCII(D.host.toLowerCase());
        } catch (N) {
          D.error = D.error || "Host's domain name can not be converted to ASCII: " + N;
        }
      (!K || K && !K.skipNormalize) && (c && D.scheme !== void 0 && (D.scheme = unescape(D.scheme)), c && D.host !== void 0 && (D.host = unescape(D.host)), D.path && D.path.length && (D.path = escape(unescape(D.path))), D.fragment && D.fragment.length && (D.fragment = encodeURI(decodeURIComponent(D.fragment)))), K && K.parse && K.parse(D, t);
    } else
      D.error = D.error || "URI can not be parsed.";
    return D;
  }
  const I = {
    SCHEMES: Q,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: n,
    serialize: g,
    parse: m
  };
  return fastUri.exports = I, fastUri.exports.default = I, fastUri.exports.fastUri = I, fastUri.exports;
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
    const o = requireValidation_error(), i = requireRef_error(), Q = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), n = requireDataType(), g = requireUtil(), E = require$$9, l = requireUri(), f = (_, P) => new RegExp(_, P);
    f.code = "new RegExp";
    const m = ["removeAdditional", "useDefaults", "coerceTypes"], I = /* @__PURE__ */ new Set([
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
    ]), w = {
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
    function D(_) {
      var P, v, y, u, h, G, z, S, J, Z, k, p, H, j, b, R, x, eA, W, $, X, iA, AA, tA, sA;
      const BA = _.strict, aA = (P = _.code) === null || P === void 0 ? void 0 : P.optimize, nA = aA === !0 || aA === void 0 ? 1 : aA || 0, wA = (y = (v = _.code) === null || v === void 0 ? void 0 : v.regExp) !== null && y !== void 0 ? y : f, DA = (u = _.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (G = (h = _.strictSchema) !== null && h !== void 0 ? h : BA) !== null && G !== void 0 ? G : !0,
        strictNumbers: (S = (z = _.strictNumbers) !== null && z !== void 0 ? z : BA) !== null && S !== void 0 ? S : !0,
        strictTypes: (Z = (J = _.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (p = (k = _.strictTuples) !== null && k !== void 0 ? k : BA) !== null && p !== void 0 ? p : "log",
        strictRequired: (j = (H = _.strictRequired) !== null && H !== void 0 ? H : BA) !== null && j !== void 0 ? j : !1,
        code: _.code ? { ..._.code, optimize: nA, regExp: wA } : { optimize: nA, regExp: wA },
        loopRequired: (b = _.loopRequired) !== null && b !== void 0 ? b : t,
        loopEnum: (R = _.loopEnum) !== null && R !== void 0 ? R : t,
        meta: (x = _.meta) !== null && x !== void 0 ? x : !0,
        messages: (eA = _.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (W = _.inlineRefs) !== null && W !== void 0 ? W : !0,
        schemaId: ($ = _.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (X = _.addUsedSchema) !== null && X !== void 0 ? X : !0,
        validateSchema: (iA = _.validateSchema) !== null && iA !== void 0 ? iA : !0,
        validateFormats: (AA = _.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = _.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = _.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: DA
      };
    }
    class c {
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...D(P) };
        const { es5: v, lines: y } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: I, es5: v, lines: y }), this.logger = L(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, w, P, "NOT SUPPORTED"), d.call(this, C, P, "DEPRECATED", "warn"), this._metaOpts = F.call(this), P.formats && N.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && O.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), K.call(this), P.validateFormats = u;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: P, meta: v, schemaId: y } = this.opts;
        let u = E;
        y === "id" && (u = { ...E }, u.id = u.$id, delete u.$id), v && P && this.addMetaSchema(u, u[y], !1);
      }
      defaultMeta() {
        const { meta: P, schemaId: v } = this.opts;
        return this.opts.defaultMeta = typeof P == "object" ? P[v] || P : void 0;
      }
      validate(P, v) {
        let y;
        if (typeof P == "string") {
          if (y = this.getSchema(P), !y)
            throw new Error(`no schema with key or ref "${P}"`);
        } else
          y = this.compile(P);
        const u = y(v);
        return "$async" in y || (this.errors = y.errors), u;
      }
      compile(P, v) {
        const y = this._addSchema(P, v);
        return y.validate || this._compileSchemaEnv(y);
      }
      compileAsync(P, v) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: y } = this.opts;
        return u.call(this, P, v);
        async function u(Z, k) {
          await h.call(this, Z.$schema);
          const p = this._addSchema(Z, k);
          return p.validate || G.call(this, p);
        }
        async function h(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function G(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return z.call(this, k), await S.call(this, k.missingSchema), G.call(this, Z);
          }
        }
        function z({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function S(Z) {
          const k = await J.call(this, Z);
          this.refs[Z] || await h.call(this, k.$schema), this.refs[Z] || this.addSchema(k, Z, v);
        }
        async function J(Z) {
          const k = this._loading[Z];
          if (k)
            return k;
          try {
            return await (this._loading[Z] = y(Z));
          } finally {
            delete this._loading[Z];
          }
        }
      }
      // Adds schema to the instance
      addSchema(P, v, y, u = this.opts.validateSchema) {
        if (Array.isArray(P)) {
          for (const G of P)
            this.addSchema(G, void 0, y, u);
          return this;
        }
        let h;
        if (typeof P == "object") {
          const { schemaId: G } = this.opts;
          if (h = P[G], h !== void 0 && typeof h != "string")
            throw new Error(`schema ${G} must be string`);
        }
        return v = (0, a.normalizeId)(v || h), this._checkUnique(v), this.schemas[v] = this._addSchema(P, y, v, u, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(P, v, y = this.opts.validateSchema) {
        return this.addSchema(P, v, !0, y), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(P, v) {
        if (typeof P == "boolean")
          return !0;
        let y;
        if (y = P.$schema, y !== void 0 && typeof y != "string")
          throw new Error("$schema must be a string");
        if (y = y || this.opts.defaultMeta || this.defaultMeta(), !y)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const u = this.validate(y, P);
        if (!u && v) {
          const h = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(h);
          else
            throw new Error(h);
        }
        return u;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(P) {
        let v;
        for (; typeof (v = M.call(this, P)) == "string"; )
          P = v;
        if (v === void 0) {
          const { schemaId: y } = this.opts, u = new B.SchemaEnv({ schema: {}, schemaId: y });
          if (v = B.resolveSchema.call(this, u, P), !v)
            return;
          this.refs[P] = v;
        }
        return v.validate || this._compileSchemaEnv(v);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(P) {
        if (P instanceof RegExp)
          return this._removeAllSchemas(this.schemas, P), this._removeAllSchemas(this.refs, P), this;
        switch (typeof P) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const v = M.call(this, P);
            return typeof v == "object" && this._cache.delete(v.schema), delete this.schemas[P], delete this.refs[P], this;
          }
          case "object": {
            const v = P;
            this._cache.delete(v);
            let y = P[this.opts.schemaId];
            return y && (y = (0, a.normalizeId)(y), delete this.schemas[y], delete this.refs[y]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(P) {
        for (const v of P)
          this.addKeyword(v);
        return this;
      }
      addKeyword(P, v) {
        let y;
        if (typeof P == "string")
          y = P, typeof v == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), v.keyword = y);
        else if (typeof P == "object" && v === void 0) {
          if (v = P, y = v.keyword, Array.isArray(y) && !y.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (Y.call(this, y, v), !v)
          return (0, g.eachItem)(y, (h) => V.call(this, h)), this;
        oA.call(this, v);
        const u = {
          ...v,
          type: (0, n.getJSONTypes)(v.type),
          schemaType: (0, n.getJSONTypes)(v.schemaType)
        };
        return (0, g.eachItem)(y, u.type.length === 0 ? (h) => V.call(this, h, u) : (h) => u.type.forEach((G) => V.call(this, h, u, G))), this;
      }
      getKeyword(P) {
        const v = this.RULES.all[P];
        return typeof v == "object" ? v.definition : !!v;
      }
      // Remove keyword
      removeKeyword(P) {
        const { RULES: v } = this;
        delete v.keywords[P], delete v.all[P];
        for (const y of v.rules) {
          const u = y.rules.findIndex((h) => h.keyword === P);
          u >= 0 && y.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, v) {
        return typeof v == "string" && (v = new RegExp(v)), this.formats[P] = v, this;
      }
      errorsText(P = this.errors, { separator: v = ", ", dataVar: y = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${y}${u.instancePath} ${u.message}`).reduce((u, h) => u + v + h);
      }
      $dataMetaSchema(P, v) {
        const y = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of v) {
          const h = u.split("/").slice(1);
          let G = P;
          for (const z of h)
            G = G[z];
          for (const z in y) {
            const S = y[z];
            if (typeof S != "object")
              continue;
            const { $data: J } = S.definition, Z = G[z];
            J && Z && (G[z] = QA(Z));
          }
        }
        return P;
      }
      _removeAllSchemas(P, v) {
        for (const y in P) {
          const u = P[y];
          (!v || v.test(y)) && (typeof u == "string" ? delete P[y] : u && !u.meta && (this._cache.delete(u.schema), delete P[y]));
        }
      }
      _addSchema(P, v, y, u = this.opts.validateSchema, h = this.opts.addUsedSchema) {
        let G;
        const { schemaId: z } = this.opts;
        if (typeof P == "object")
          G = P[z];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof P != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let S = this._cache.get(P);
        if (S !== void 0)
          return S;
        y = (0, a.normalizeId)(G || y);
        const J = a.getSchemaRefs.call(this, P, y);
        return S = new B.SchemaEnv({ schema: P, schemaId: z, meta: v, baseId: y, localRefs: J }), this._cache.set(S.schema, S), h && !y.startsWith("#") && (y && this._checkUnique(y), this.refs[y] = S), u && this.validateSchema(P, !0), S;
      }
      _checkUnique(P) {
        if (this.schemas[P] || this.refs[P])
          throw new Error(`schema with key or id "${P}" already exists`);
      }
      _compileSchemaEnv(P) {
        if (P.meta ? this._compileMetaSchema(P) : B.compileSchema.call(this, P), !P.validate)
          throw new Error("ajv implementation error");
        return P.validate;
      }
      _compileMetaSchema(P) {
        const v = this.opts;
        this.opts = this._metaOpts;
        try {
          B.compileSchema.call(this, P);
        } finally {
          this.opts = v;
        }
      }
    }
    c.ValidationError = o.default, c.MissingRefError = i.default, A.default = c;
    function d(_, P, v, y = "error") {
      for (const u in _) {
        const h = u;
        h in P && this.logger[y](`${v}: option ${u}. ${_[h]}`);
      }
    }
    function M(_) {
      return _ = (0, a.normalizeId)(_), this.schemas[_] || this.refs[_];
    }
    function K() {
      const _ = this.opts.schemas;
      if (_)
        if (Array.isArray(_))
          this.addSchema(_);
        else
          for (const P in _)
            this.addSchema(_[P], P);
    }
    function N() {
      for (const _ in this.opts.formats) {
        const P = this.opts.formats[_];
        P && this.addFormat(_, P);
      }
    }
    function O(_) {
      if (Array.isArray(_)) {
        this.addVocabulary(_);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const P in _) {
        const v = _[P];
        v.keyword || (v.keyword = P), this.addKeyword(v);
      }
    }
    function F() {
      const _ = { ...this.opts };
      for (const P of m)
        delete _[P];
      return _;
    }
    const q = { log() {
    }, warn() {
    }, error() {
    } };
    function L(_) {
      if (_ === !1)
        return q;
      if (_ === void 0)
        return console;
      if (_.log && _.warn && _.error)
        return _;
      throw new Error("logger must implement log, warn and error methods");
    }
    const U = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Y(_, P) {
      const { RULES: v } = this;
      if ((0, g.eachItem)(_, (y) => {
        if (v.keywords[y])
          throw new Error(`Keyword ${y} is already defined`);
        if (!U.test(y))
          throw new Error(`Keyword ${y} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function V(_, P, v) {
      var y;
      const u = P?.post;
      if (v && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: h } = this;
      let G = u ? h.post : h.rules.find(({ type: S }) => S === v);
      if (G || (G = { type: v, rules: [] }, h.rules.push(G)), h.keywords[_] = !0, !P)
        return;
      const z = {
        keyword: _,
        definition: {
          ...P,
          type: (0, n.getJSONTypes)(P.type),
          schemaType: (0, n.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, G, z, P.before) : G.rules.push(z), h.all[_] = z, (y = P.implements) === null || y === void 0 || y.forEach((S) => this.addKeyword(S));
    }
    function rA(_, P, v) {
      const y = _.rules.findIndex((u) => u.keyword === v);
      y >= 0 ? _.rules.splice(y, 0, P) : (_.rules.push(P), this.logger.warn(`rule ${v} is not defined`));
    }
    function oA(_) {
      let { metaSchema: P } = _;
      P !== void 0 && (_.$data && this.opts.$data && (P = QA(P)), _.validateSchema = this.compile(P, !0));
    }
    const T = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function QA(_) {
      return { anyOf: [_, T] };
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
    code(n) {
      const { gen: g, schema: E, it: l } = n, { baseId: f, schemaEnv: m, validateName: I, opts: w, self: C } = l, { root: t } = m;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const D = i.resolveRef.call(C, t, f, E);
      if (D === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (D instanceof i.SchemaEnv)
        return d(D);
      return M(D);
      function c() {
        if (m === t)
          return a(n, I, m, m.$async);
        const K = g.scopeValue("root", { ref: t });
        return a(n, (0, r._)`${K}.validate`, t, t.$async);
      }
      function d(K) {
        const N = s(n, K);
        a(n, N, K, K.$async);
      }
      function M(K) {
        const N = g.scopeValue("schema", w.code.source === !0 ? { ref: K, code: (0, r.stringify)(K) } : { ref: K }), O = g.name("valid"), F = n.subschema({
          schema: K,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: N,
          errSchemaPath: E
        }, O);
        n.mergeEvaluated(F), n.ok(O);
      }
    }
  };
  function s(n, g) {
    const { gen: E } = n;
    return g.validate ? E.scopeValue("validate", { ref: g.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: g })}.validate`;
  }
  ref.getValidate = s;
  function a(n, g, E, l) {
    const { gen: f, it: m } = n, { allErrors: I, schemaEnv: w, opts: C } = m, t = C.passContext ? o.default.this : r.nil;
    l ? D() : c();
    function D() {
      if (!w.$async)
        throw new Error("async schema referenced by sync schema");
      const K = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(n, g, t)}`), M(g), I || f.assign(K, !0);
      }, (N) => {
        f.if((0, r._)`!(${N} instanceof ${m.ValidationError})`, () => f.throw(N)), d(N), I || f.assign(K, !1);
      }), n.ok(K);
    }
    function c() {
      n.result((0, e.callValidateCode)(n, g, t), () => M(g), () => d(g));
    }
    function d(K) {
      const N = (0, r._)`${K}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${N} : ${o.default.vErrors}.concat(${N})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(K) {
      var N;
      if (!m.opts.unevaluated)
        return;
      const O = (N = E?.validate) === null || N === void 0 ? void 0 : N.evaluated;
      if (m.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (m.props = Q.mergeEvaluated.props(f, O.props, m.props));
        else {
          const F = f.var("props", (0, r._)`${K}.evaluated.props`);
          m.props = Q.mergeEvaluated.props(f, F, m.props, r.Name);
        }
      if (m.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (m.items = Q.mergeEvaluated.items(f, O.items, m.items));
        else {
          const F = f.var("items", (0, r._)`${K}.evaluated.items`);
          m.items = Q.mergeEvaluated.items(f, F, m.items, r.Name);
        }
    }
  }
  return ref.callRef = a, ref.default = B, ref;
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
      const { keyword: B, data: s, schemaCode: a } = Q;
      Q.fail$data((0, A._)`${s} ${r[B].fail} ${a} || isNaN(${s})`);
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
      const { gen: i, data: Q, schemaCode: B, it: s } = o, a = s.opts.multipleOfPrecision, n = i.let("res"), g = a ? (0, A._)`Math.abs(Math.round(${n}) - ${n}) > 1e-${a}` : (0, A._)`${n} !== parseInt(${n})`;
      o.fail$data((0, A._)`(${B} === 0 || (${n} = ${Q}/${B}, ${g}))`);
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
      const { keyword: B, data: s, schemaCode: a, it: n } = Q, g = B === "maxLength" ? A.operators.GT : A.operators.LT, E = n.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(Q.gen, r.default)}(${s})`;
      Q.fail$data((0, A._)`${E} ${g} ${a}`);
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
      const { data: Q, $data: B, schema: s, schemaCode: a, it: n } = i, g = n.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${g}))` : (0, A.usePattern)(i, s);
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
      const { gen: B, schema: s, schemaCode: a, data: n, $data: g, it: E } = Q, { opts: l } = E;
      if (!g && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? m() : I(), l.strictRequired) {
        const t = Q.parentSchema.properties, { definedProperties: D } = Q.it;
        for (const c of s)
          if (t?.[c] === void 0 && !D.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function m() {
        if (f || g)
          Q.block$data(e.nil, w);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(Q, t);
      }
      function I() {
        const t = B.let("missing");
        if (f || g) {
          const D = B.let("valid", !0);
          Q.block$data(D, () => C(t, D)), Q.ok(D);
        } else
          B.if((0, A.checkMissingProp)(Q, s, t)), (0, A.reportMissingProp)(Q, t), B.else();
      }
      function w() {
        B.forOf("prop", a, (t) => {
          Q.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, n, t, l.ownProperties), () => Q.error());
        });
      }
      function C(t, D) {
        Q.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(D, (0, A.propertyInData)(B, n, t, l.ownProperties)), B.if((0, e.not)(D), () => {
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
      const { gen: s, data: a, $data: n, schema: g, parentSchema: E, schemaCode: l, it: f } = B;
      if (!n && !g)
        return;
      const m = s.let("valid"), I = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(m, w, (0, e._)`${l} === false`), B.ok(m);
      function w() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(m, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : D)(c, d));
      }
      function C() {
        return I.length > 0 && !I.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), K = (0, A.checkDataTypes)(I, M, f.opts.strictNumbers, A.DataType.Wrong), N = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(K, (0, e._)`continue`), I.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${N}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${N}[${M}]`), B.error(), s.assign(m, !1).break();
          }).code((0, e._)`${N}[${M}] = ${c}`);
        });
      }
      function D(c, d) {
        const M = (0, r.useFunc)(s, o.default), K = s.name("outer");
        s.label(K).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(m, !1).break(K);
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
      const { gen: B, data: s, $data: a, schemaCode: n, schema: g } = Q;
      a || g && typeof g == "object" ? Q.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${n})`) : Q.fail((0, A._)`${g} !== ${s}`);
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
      const { gen: B, data: s, $data: a, schema: n, schemaCode: g, it: E } = Q;
      if (!a && n.length === 0)
        throw new Error("enum must have non-empty array");
      const l = n.length >= E.opts.loopEnum;
      let f;
      const m = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let I;
      if (l || a)
        I = B.let("valid"), Q.block$data(I, w);
      else {
        if (!Array.isArray(n))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", g);
        I = (0, A.or)(...n.map((D, c) => C(t, c)));
      }
      Q.pass(I);
      function w() {
        B.assign(I, !1), B.forOf("v", g, (t) => B.if((0, A._)`${m()}(${s}, ${t})`, () => B.assign(I, !0).break()));
      }
      function C(t, D) {
        const c = n[D];
        return typeof c == "object" && c !== null ? (0, A._)`${m()}(${s}, ${t}[${D}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = i, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), i = requireLimitProperties(), Q = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), n = require_enum(), g = [
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
    a.default,
    n.default
  ];
  return validation.default = g, validation;
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
      const { parentSchema: B, it: s } = Q, { items: a } = B;
      if (!Array.isArray(a)) {
        (0, e.checkStrictMode)(s, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      i(Q, a);
    }
  };
  function i(Q, B) {
    const { gen: s, schema: a, data: n, keyword: g, it: E } = Q;
    E.items = !0;
    const l = s.const("len", (0, A._)`${n}.length`);
    if (a === !1)
      Q.setParams({ len: B.length }), Q.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const m = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(m), () => f(m)), Q.ok(m);
    }
    function f(m) {
      s.forRange("i", B.length, l, (I) => {
        Q.subschema({ keyword: g, dataProp: I, dataPropType: e.Type.Num }, m), E.allErrors || s.if((0, A.not)(m), () => s.break());
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
    const { gen: a, parentSchema: n, data: g, keyword: E, it: l } = Q;
    I(n), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), m = a.const("len", (0, A._)`${g}.length`);
    s.forEach((w, C) => {
      (0, e.alwaysValidSchema)(l, w) || (a.if((0, A._)`${m} > ${C}`, () => Q.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), Q.ok(f));
    });
    function I(w) {
      const { opts: C, errSchemaPath: t } = l, D = s.length, c = D === w.minItems && (D === w.maxItems || w[B] === !1);
      if (C.strictTuples && !c) {
        const d = `"${E}" is ${D}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
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
      const { schema: s, parentSchema: a, it: n } = B, { prefixItems: g } = a;
      n.items = !0, !(0, e.alwaysValidSchema)(n, s) && (g ? (0, o.validateAdditionalItems)(B, g) : B.ok((0, r.validateArray)(B)));
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
      const { gen: Q, schema: B, parentSchema: s, data: a, it: n } = i;
      let g, E;
      const { minContains: l, maxContains: f } = s;
      n.opts.next ? (g = l === void 0 ? 1 : l, E = f) : g = 1;
      const m = Q.const("len", (0, A._)`${a}.length`);
      if (i.setParams({ min: g, max: E }), E === void 0 && g === 0) {
        (0, e.checkStrictMode)(n, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && g > E) {
        (0, e.checkStrictMode)(n, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(n, B)) {
        let D = (0, A._)`${m} >= ${g}`;
        E !== void 0 && (D = (0, A._)`${D} && ${m} <= ${E}`), i.pass(D);
        return;
      }
      n.items = !0;
      const I = Q.name("valid");
      E === void 0 && g === 1 ? C(I, () => Q.if(I, () => Q.break())) : g === 0 ? (Q.let(I, !0), E !== void 0 && Q.if((0, A._)`${a}.length > 0`, w)) : (Q.let(I, !1), w()), i.result(I, () => i.reset());
      function w() {
        const D = Q.name("_valid"), c = Q.let("count", 0);
        C(D, () => Q.if(D, () => t(c)));
      }
      function C(D, c) {
        Q.forRange("i", 0, m, (d) => {
          i.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, D), c();
        });
      }
      function t(D) {
        Q.code((0, A._)`${D}++`), E === void 0 ? Q.if((0, A._)`${D} >= ${g}`, () => Q.assign(I, !0).break()) : (Q.if((0, A._)`${D} > ${E}`, () => Q.assign(I, !1).break()), g === 1 ? Q.assign(I, !0) : Q.if((0, A._)`${D} >= ${g}`, () => Q.assign(I, !0)));
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
      message: ({ params: { property: a, depsCount: n, deps: g } }) => {
        const E = n === 1 ? "property" : "properties";
        return (0, e.str)`must have ${E} ${g} when property ${a} is present`;
      },
      params: ({ params: { property: a, depsCount: n, deps: g, missingProperty: E } }) => (0, e._)`{property: ${a},
    missingProperty: ${E},
    depsCount: ${n},
    deps: ${g}}`
      // TODO change to reference
    };
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [n, g] = Q(a);
        B(a, n), s(a, g);
      }
    };
    function Q({ schema: a }) {
      const n = {}, g = {};
      for (const E in a) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(a[E]) ? n : g;
        l[E] = a[E];
      }
      return [n, g];
    }
    function B(a, n = a.schema) {
      const { gen: g, data: E, it: l } = a;
      if (Object.keys(n).length === 0)
        return;
      const f = g.let("missing");
      for (const m in n) {
        const I = n[m];
        if (I.length === 0)
          continue;
        const w = (0, o.propertyInData)(g, E, m, l.opts.ownProperties);
        a.setParams({
          property: m,
          depsCount: I.length,
          deps: I.join(", ")
        }), l.allErrors ? g.if(w, () => {
          for (const C of I)
            (0, o.checkReportMissingProp)(a, C);
        }) : (g.if((0, e._)`${w} && (${(0, o.checkMissingProp)(a, I, f)})`), (0, o.reportMissingProp)(a, f), g.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, n = a.schema) {
      const { gen: g, data: E, keyword: l, it: f } = a, m = g.name("valid");
      for (const I in n)
        (0, r.alwaysValidSchema)(f, n[I]) || (g.if(
          (0, o.propertyInData)(g, E, I, f.opts.ownProperties),
          () => {
            const w = a.subschema({ keyword: l, schemaProp: I }, m);
            a.mergeValidEvaluated(w, m);
          },
          () => g.var(m, !0)
          // TODO var
        ), a.ok(m));
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
      const { gen: Q, schema: B, data: s, it: a } = i;
      if ((0, e.alwaysValidSchema)(a, B))
        return;
      const n = Q.name("valid");
      Q.forIn("key", s, (g) => {
        i.setParams({ propertyName: g }), i.subschema({
          keyword: "propertyNames",
          data: g,
          dataTypes: ["string"],
          propertyName: g,
          compositeRule: !0
        }, n), Q.if((0, A.not)(n), () => {
          i.error(!0), a.allErrors || Q.break();
        });
      }), i.ok(n);
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
      const { gen: s, schema: a, parentSchema: n, data: g, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: m } = l;
      if (l.props = !0, m.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const I = (0, A.allSchemaProperties)(n.properties), w = (0, A.allSchemaProperties)(n.patternProperties);
      C(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", g, (M) => {
          !I.length && !w.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let K;
        if (I.length > 8) {
          const N = (0, o.schemaRefOrVal)(l, n.properties, "properties");
          K = (0, A.isOwnProperty)(s, N, M);
        } else I.length ? K = (0, e.or)(...I.map((N) => (0, e._)`${M} === ${N}`)) : K = e.nil;
        return w.length && (K = (0, e.or)(K, ...w.map((N) => (0, e._)`${(0, A.usePattern)(B, N)}.test(${M})`))), (0, e.not)(K);
      }
      function D(M) {
        s.code((0, e._)`delete ${g}[${M}]`);
      }
      function c(M) {
        if (m.removeAdditional === "all" || m.removeAdditional && a === !1) {
          D(M);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const K = s.name("valid");
          m.removeAdditional === "failing" ? (d(M, K, !1), s.if((0, e.not)(K), () => {
            B.reset(), D(M);
          })) : (d(M, K), f || s.if((0, e.not)(K), () => s.break()));
        }
      }
      function d(M, K, N) {
        const O = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: o.Type.Str
        };
        N === !1 && Object.assign(O, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(O, K);
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
      const { gen: B, schema: s, parentSchema: a, data: n, it: g } = Q;
      g.opts.removeAdditional === "all" && a.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(g, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const w of E)
        g.definedProperties.add(w);
      g.opts.unevaluated && E.length && g.props !== !0 && (g.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), g.props));
      const l = E.filter((w) => !(0, r.alwaysValidSchema)(g, s[w]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const w of l)
        m(w) ? I(w) : (B.if((0, e.propertyInData)(B, n, w, g.opts.ownProperties)), I(w), g.allErrors || B.else().var(f, !0), B.endIf()), Q.it.definedProperties.add(w), Q.ok(f);
      function m(w) {
        return g.opts.useDefaults && !g.compositeRule && s[w].default !== void 0;
      }
      function I(w) {
        Q.subschema({
          keyword: "properties",
          schemaProp: w,
          dataProp: w
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
      const { gen: B, schema: s, data: a, parentSchema: n, it: g } = Q, { opts: E } = g, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(g, s[c]));
      if (l.length === 0 || f.length === l.length && (!g.opts.unevaluated || g.props === !0))
        return;
      const m = E.strictSchema && !E.allowMatchingProperties && n.properties, I = B.name("valid");
      g.props !== !0 && !(g.props instanceof e.Name) && (g.props = (0, o.evaluatedPropsToName)(B, g.props));
      const { props: w } = g;
      C();
      function C() {
        for (const c of l)
          m && t(c), g.allErrors ? D(c) : (B.var(I, !0), D(c), B.if(I));
      }
      function t(c) {
        for (const d in m)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(g, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function D(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(Q, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || Q.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: o.Type.Str
            }, I), g.opts.unevaluated && w !== !0 ? B.assign((0, e._)`${w}[${d}]`, !0) : !M && !g.allErrors && B.if((0, e.not)(I), () => B.break());
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
      const { gen: Q, schema: B, parentSchema: s, it: a } = i;
      if (!Array.isArray(B))
        throw new Error("ajv implementation error");
      if (a.opts.discriminator && s.discriminator)
        return;
      const n = B, g = Q.let("valid", !1), E = Q.let("passing", null), l = Q.name("_valid");
      i.setParams({ passing: E }), Q.block(f), i.result(g, () => i.reset(), () => i.error(!0));
      function f() {
        n.forEach((m, I) => {
          let w;
          (0, e.alwaysValidSchema)(a, m) ? Q.var(l, !0) : w = i.subschema({
            keyword: "oneOf",
            schemaProp: I,
            compositeRule: !0
          }, l), I > 0 && Q.if((0, A._)`${l} && ${g}`).assign(g, !1).assign(E, (0, A._)`[${E}, ${I}]`).else(), Q.if(l, () => {
            Q.assign(g, !0), Q.assign(E, I), w && i.mergeEvaluated(w, A.Name);
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
      i.forEach((s, a) => {
        if ((0, A.alwaysValidSchema)(Q, s))
          return;
        const n = r.subschema({ keyword: "allOf", schemaProp: a }, B);
        r.ok(B), r.mergeEvaluated(n);
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
      const { gen: B, parentSchema: s, it: a } = Q;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const n = i(a, "then"), g = i(a, "else");
      if (!n && !g)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), Q.reset(), n && g) {
        const I = B.let("ifClause");
        Q.setParams({ ifClause: I }), B.if(l, m("then", I), m("else", I));
      } else n ? B.if(l, m("then")) : B.if((0, A.not)(l), m("else"));
      Q.pass(E, () => Q.error(!0));
      function f() {
        const I = Q.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        Q.mergeEvaluated(I);
      }
      function m(I, w) {
        return () => {
          const C = Q.subschema({ keyword: I }, l);
          B.assign(E, l), Q.mergeValidEvaluated(C, E), w ? B.assign(w, (0, A._)`${I}`) : Q.setParams({ ifClause: I });
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
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), i = requireContains(), Q = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), n = requirePatternProperties(), g = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), m = require_if(), I = requireThenElse();
  function w(C = !1) {
    const t = [
      // any
      g.default,
      E.default,
      l.default,
      f.default,
      m.default,
      I.default,
      // object
      B.default,
      s.default,
      Q.default,
      a.default,
      n.default
    ];
    return C ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(i.default), t;
  }
  return applicator.default = w, applicator;
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
      const { gen: Q, data: B, $data: s, schema: a, schemaCode: n, it: g } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: m } = g;
      if (!E.validateFormats)
        return;
      s ? I() : w();
      function I() {
        const C = Q.scopeValue("formats", {
          ref: m.formats,
          code: E.code.formats
        }), t = Q.const("fDef", (0, A._)`${C}[${n}]`), D = Q.let("fType"), c = Q.let("format");
        Q.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => Q.assign(D, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => Q.assign(D, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${n} && !${c}`;
        }
        function M() {
          const K = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, N = (0, A._)`(typeof ${c} == "function" ? ${K} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${D} === ${i} && !${N}`;
        }
      }
      function w() {
        const C = m.formats[a];
        if (!C) {
          d();
          return;
        }
        if (C === !0)
          return;
        const [t, D, c] = M(C);
        t === i && o.pass(K());
        function d() {
          if (E.strictSchema === !1) {
            m.logger.warn(N());
            return;
          }
          throw new Error(N());
          function N() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function M(N) {
          const O = N instanceof RegExp ? (0, A.regexpCode)(N) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, F = Q.scopeValue("formats", { key: a, ref: N, code: O });
          return typeof N == "object" && !(N instanceof RegExp) ? [N.type || "string", N.validate, (0, A._)`${F}.validate`] : ["string", N, F];
        }
        function K() {
          if (typeof C == "object" && !(C instanceof RegExp) && C.async) {
            if (!f.$async)
              throw new Error("async format in sync schema");
            return (0, A._)`await ${c}(${B})`;
          }
          return typeof D == "function" ? (0, A._)`${c}(${B})` : (0, A._)`${c}.test(${B})`;
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
      message: ({ params: { discrError: s, tagName: a } }) => s === e.DiscrError.Tag ? `tag "${a}" must be string` : `value of tag "${a}" must be in oneOf`,
      params: ({ params: { discrError: s, tag: a, tagName: n } }) => (0, A._)`{error: ${s}, tag: ${n}, tagValue: ${a}}`
    },
    code(s) {
      const { gen: a, data: n, schema: g, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const m = g.propertyName;
      if (typeof m != "string")
        throw new Error("discriminator: requires propertyName");
      if (g.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const I = a.let("valid", !1), w = a.const("tag", (0, A._)`${n}${(0, A.getProperty)(m)}`);
      a.if((0, A._)`typeof ${w} == "string"`, () => C(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: w, tagName: m })), s.ok(I);
      function C() {
        const c = D();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${w} === ${d}`), a.assign(I, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: w, tagName: m }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function D() {
        var c;
        const d = {}, M = N(E);
        let K = !0;
        for (let q = 0; q < f.length; q++) {
          let L = f[q];
          if (L?.$ref && !(0, i.schemaHasRulesButRef)(L, l.self.RULES)) {
            const Y = L.$ref;
            if (L = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), L instanceof r.SchemaEnv && (L = L.schema), L === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = L?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          K = K && (M || N(L)), O(U, q);
        }
        if (!K)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function N({ required: q }) {
          return Array.isArray(q) && q.includes(m);
        }
        function O(q, L) {
          if (q.const)
            F(q.const, L);
          else if (q.enum)
            for (const U of q.enum)
              F(U, L);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function F(q, L) {
          if (typeof q != "string" || q in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[q] = L;
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
    class a extends r.default {
      _addVocabularies() {
        super._addVocabularies(), o.default.forEach((m) => this.addVocabulary(m)), this.opts.discriminator && this.addKeyword(i.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const m = this.opts.$data ? this.$dataMetaSchema(Q, B) : Q;
        this.addMetaSchema(m, s, !1), this.refs["http://json-schema.org/schema"] = s;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(s) ? s : void 0);
      }
    }
    e.Ajv = a, A.exports = e = a, A.exports.Ajv = a, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = a;
    var n = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return n.KeywordCxt;
    } });
    var g = requireCodegen();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return g._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return g.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return g.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return g.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return g.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return g.CodeGen;
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
    function s(g) {
      try {
        n(o.next(g));
      } catch (E) {
        B(E);
      }
    }
    function a(g) {
      try {
        n(o.throw(g));
      } catch (E) {
        B(E);
      }
    }
    function n(g) {
      g.done ? Q(g.value) : i(g.value).then(s, a);
    }
    n((o = o.apply(A, [])).next());
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
  function s(n) {
    return function(g) {
      return a([n, g]);
    };
  }
  function a(n) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = n[0] & 2 ? i.return : n[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, n[1])).done) return Q;
      switch (i = 0, Q && (n = [n[0] & 2, Q.value]), n[0]) {
        case 0:
        case 1:
          Q = n;
          break;
        case 4:
          return r.label++, { value: n[1], done: !1 };
        case 5:
          r.label++, i = n[1], n = [0];
          continue;
        case 7:
          n = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (n[0] === 6 || n[0] === 2)) {
            r = 0;
            continue;
          }
          if (n[0] === 3 && (!Q || n[1] > Q[0] && n[1] < Q[3])) {
            r.label = n[1];
            break;
          }
          if (n[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = n;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(n);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      n = e.call(A, r);
    } catch (g) {
      n = [6, g], i = 0;
    } finally {
      o = Q = 0;
    }
    if (n[0] & 5) throw n[1];
    return { value: n[0] ? n[1] : void 0, done: !0 };
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
      for (const { count: a, res: n } of B.anchors.values())
        i(n, a);
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
      const a = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(a);
    }
    let s = o.get(B);
    if (s || (toJS(B, null, r), s = o.get(B)), !s || s.res === void 0) {
      const a = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(a);
    }
    if (Q >= 0 && (s.count += 1, s.aliasCount === 0 && (s.aliasCount = getAliasCount(i, B, o)), s.count * s.aliasCount > Q)) {
      const a = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(a);
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
  let a;
  if (o && A && typeof A == "object") {
    if (a = s.get(A), a)
      return a.anchor || (a.anchor = i(A)), new Alias(a.anchor);
    a = { anchor: null, node: null }, s.set(A, a);
  }
  let n = findTagObject(A, e, B.tags);
  if (!n) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    n = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  Q && (Q(n), delete r.onTagObj);
  const g = n?.createNode ? n.createNode(r.schema, A, r) : typeof n?.nodeClass?.from == "function" ? n.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return n.default || (g.tag = n.tag), a && (a.node = g), g;
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
  const a = Math.max(1 + Q, 1 + i - e.length);
  if (A.length <= a)
    return A;
  const n = [], g = {};
  let E = i - e.length;
  typeof o == "number" && (o > i - Math.max(2, Q) ? n.push(0) : E = i - o);
  let l, f, m = !1, I = -1, w = -1, C = -1;
  r === FOLD_BLOCK && (I = consumeMoreIndentedLines(A, I, e.length), I !== -1 && (E = I + a));
  for (let D; D = A[I += 1]; ) {
    if (r === FOLD_QUOTED && D === "\\") {
      switch (w = I, A[I + 1]) {
        case "x":
          I += 3;
          break;
        case "u":
          I += 5;
          break;
        case "U":
          I += 9;
          break;
        default:
          I += 1;
      }
      C = I;
    }
    if (D === `
`)
      r === FOLD_BLOCK && (I = consumeMoreIndentedLines(A, I, e.length)), E = I + e.length + a, l = void 0;
    else {
      if (D === " " && f && f !== " " && f !== `
` && f !== "	") {
        const c = A[I + 1];
        c && c !== " " && c !== `
` && c !== "	" && (l = I);
      }
      if (I >= E)
        if (l)
          n.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = D, D = A[I += 1], m = !0;
          const c = I > C + 1 ? I - 2 : w - 1;
          if (g[c])
            return A;
          n.push(c), g[c] = !0, E = c + a, l = void 0;
        } else
          m = !0;
    }
    f = D;
  }
  if (m && s && s(), n.length === 0)
    return A;
  B && B();
  let t = A.slice(0, n[0]);
  for (let D = 0; D < n.length; ++D) {
    const c = n[D], d = n[D + 1] || A.length;
    c === 0 ? t = `
${e}${A.slice(0, d)}` : (r === FOLD_QUOTED && g[c] && (t += `${A[c]}\\`), t += `
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
  for (let a = 0, n = r[a]; n; n = r[++a])
    if (n === " " && r[a + 1] === "\\" && r[a + 2] === "n" && (B += r.slice(s, a) + "\\ ", a += 1, s = a, n = "\\"), n === "\\")
      switch (r[a + 1]) {
        case "u":
          {
            B += r.slice(s, a);
            const g = r.substr(a + 2, 4);
            switch (g) {
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
                g.substr(0, 2) === "00" ? B += "\\x" + g.substr(2) : B += r.substr(a, 6);
            }
            a += 5, s = a + 1;
          }
          break;
        case "n":
          if (o || r[a + 2] === '"' || r.length < i)
            a += 1;
          else {
            for (B += r.slice(s, a) + `

`; r[a + 2] === "\\" && r[a + 3] === "n" && r[a + 4] !== '"'; )
              B += `
`, a += 2;
            B += Q, r[a + 2] === " " && (B += "\\"), a += 1, s = a + 1;
          }
          break;
        default:
          a += 1;
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
  const { blockQuote: B, commentString: s, lineWidth: a } = o.options;
  if (!B || /\n[\t ]+$/.test(r) || /^\s*$/.test(r))
    return quotedString(r, o);
  const n = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), g = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, n.length);
  if (!r)
    return g ? `|
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
  const m = f.indexOf(`
`);
  m === -1 ? E = "-" : r === f || m !== f.length - 1 ? (E = "+", Q && Q()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${n}`));
  let I = !1, w, C = -1;
  for (w = 0; w < r.length; ++w) {
    const d = r[w];
    if (d === " ")
      I = !0;
    else if (d === `
`)
      C = w;
    else
      break;
  }
  let t = r.substring(0, C < w ? C + 1 : w);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${n}`));
  let c = (I ? n ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !g) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${n}`);
    let M = !1;
    const K = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (K.onOverflow = () => {
      M = !0;
    });
    const N = foldFlowLines(`${t}${d}${f}`, n, FOLD_BLOCK, K);
    if (!M)
      return `>${c}
${n}${N}`;
  }
  return r = r.replace(/\n+/g, `$&${n}`), `|${c}
${n}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: i, value: Q } = A, { actualString: B, implicitKey: s, indent: a, indentStep: n, inFlow: g } = e;
  if (s && Q.includes(`
`) || g && /[[\]{},]/.test(Q))
    return quotedString(Q, e);
  if (!Q || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(Q))
    return s || g || !Q.includes(`
`) ? quotedString(Q, e) : blockString(A, e, r, o);
  if (!s && !g && i !== Scalar.PLAIN && Q.includes(`
`))
    return blockString(A, e, r, o);
  if (containsDocumentMarker(Q)) {
    if (a === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, o);
    if (s && a === n)
      return quotedString(Q, e);
  }
  const E = Q.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (I) => I.default && I.tag !== "tag:yaml.org,2002:str" && I.test?.test(E), { compat: f, tags: m } = e.doc.schema;
    if (m.some(l) || f?.some(l))
      return quotedString(Q, e);
  }
  return s ? E : foldFlowLines(E, a, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, o) {
  const { implicitKey: i, inFlow: Q } = e, B = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(B.value) && (s = Scalar.QUOTE_DOUBLE);
  const a = (g) => {
    switch (g) {
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
  let n = a(s);
  if (n === null) {
    const { defaultKeyType: g, defaultStringType: E } = e.options, l = i && g || E;
    if (n = a(l), n === null)
      throw new Error(`Unsupported default string type ${l}`);
  }
  return n;
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
  const Q = isNode(A) ? A : e.doc.createNode(A, { onTagObj: (a) => i = a });
  i || (i = getTagObject(e.doc.schema.tags, Q));
  const B = stringifyProps(Q, i, e);
  B.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + B.length + 1);
  const s = typeof i.stringify == "function" ? i.stringify(Q, e, r, o) : isScalar(Q) ? stringifyString(Q, e, r, o) : Q.toString(e, r, o);
  return B ? isScalar(Q) || s[0] === "{" || s[0] === "[" ? `${B} ${s}` : `${B}
${e.indent}${s}` : s;
}
function stringifyPair({ key: A, value: e }, r, o, i) {
  const { allNullValues: Q, doc: B, indent: s, indentStep: a, options: { commentString: n, indentSeq: g, simpleKeys: E } } = r;
  let l = isNode(A) && A.comment || null;
  if (E) {
    if (l)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (isCollection(A) || !isNode(A) && typeof A == "object") {
      const K = "With simple keys, collection cannot be used as a key value";
      throw new Error(K);
    }
  }
  let f = !E && (!A || l && e == null && !r.inFlow || isCollection(A) || (isScalar(A) ? A.type === Scalar.BLOCK_FOLDED || A.type === Scalar.BLOCK_LITERAL : typeof A == "object"));
  r = Object.assign({}, r, {
    allNullValues: !1,
    implicitKey: !f && (E || !Q),
    indent: s + a
  });
  let m = !1, I = !1, w = stringify(A, r, () => m = !0, () => I = !0);
  if (!f && !r.inFlow && w.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (Q || e == null)
      return m && o && o(), w === "" ? "?" : f ? `? ${w}` : w;
  } else if (Q && !E || e == null && f)
    return w = `? ${w}`, l && !m ? w += lineComment(w, r.indent, n(l)) : I && i && i(), w;
  m && (l = null), f ? (l && (w += lineComment(w, r.indent, n(l))), w = `? ${w}
${s}:`) : (w = `${w}:`, l && (w += lineComment(w, r.indent, n(l))));
  let C, t, D;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, D = e.comment) : (C = !1, t = null, D = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = w.length + 1), I = !1, !g && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => I = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
` : "", t) {
      const K = n(t);
      M += `
${indentComment(K, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const K = d[0], N = d.indexOf(`
`), O = N !== -1, F = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !F) {
      let q = !1;
      if (O && (K === "&" || K === "!")) {
        let L = d.indexOf(" ");
        K === "&" && L !== -1 && L < N && d[L + 1] === "!" && (L = d.indexOf(" ", L + 1)), (L === -1 || N < L) && (q = !0);
      }
      q || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return w += M + d, r.inFlow ? c && o && o() : D && !c ? w += lineComment(w, r.indent, n(D)) : I && i && i(), w;
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
  const { indent: a, options: { commentString: n } } = r, g = Object.assign({}, r, { indent: Q, type: null });
  let E = !1;
  const l = [];
  for (let m = 0; m < e.length; ++m) {
    const I = e[m];
    let w = null;
    if (isNode(I))
      !E && I.spaceBefore && l.push(""), addCommentBefore(r, l, I.commentBefore, E), I.comment && (w = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let C = stringify(I, g, () => w = null, () => E = !0);
    w && (C += lineComment(C, Q, n(w))), E && w && (E = !1), l.push(o + C);
  }
  let f;
  if (l.length === 0)
    f = i.start + i.end;
  else {
    f = l[0];
    for (let m = 1; m < l.length; ++m) {
      const I = l[m];
      f += I ? `
${a}${I}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(n(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: i, indentStep: Q, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += Q;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let n = !1, g = 0;
  const E = [];
  for (let m = 0; m < A.length; ++m) {
    const I = A[m];
    let w = null;
    if (isNode(I))
      I.spaceBefore && E.push(""), addCommentBefore(e, E, I.commentBefore, !1), I.comment && (w = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (n = !0));
      const D = isNode(I.value) ? I.value : null;
      D ? (D.comment && (w = D.comment), D.commentBefore && (n = !0)) : I.value == null && t?.comment && (w = t.comment);
    }
    w && (n = !0);
    let C = stringify(I, a, () => w = null);
    m < A.length - 1 && (C += ","), w && (C += lineComment(C, o, s(w))), !n && (E.length > g || C.includes(`
`)) && (n = !0), E.push(C), g = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!n) {
    const m = E.reduce((I, w) => I + w.length + 2, 2);
    n = e.options.lineWidth > 0 && m > e.options.lineWidth;
  }
  if (n) {
    let m = l;
    for (const I of E)
      m += I ? `
${Q}${i}${I}` : `
`;
    return `${m}
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
    const { keepUndefined: i, replacer: Q } = o, B = new this(e), s = (a, n) => {
      if (typeof Q == "function")
        n = Q.call(r, a, n);
      else if (Array.isArray(Q) && !Q.includes(a))
        return;
      (n !== void 0 || i) && B.items.push(createPair(a, n, o));
    };
    if (r instanceof Map)
      for (const [a, n] of r)
        s(a, n);
    else if (r && typeof r == "object")
      for (const a of Object.keys(r))
        s(a, r[a]);
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
          const a = r instanceof Set ? s : String(B++);
          s = i.call(r, a, s);
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
      let s, a;
      if (Array.isArray(B))
        if (B.length === 2)
          s = B[0], a = B[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${B}`);
      else if (B && B instanceof Object) {
        const n = Object.keys(B);
        if (n.length === 1)
          s = n[0], a = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${n.length} keys`);
      } else
        s = B;
      i.items.push(createPair(s, a, r));
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
      let a = s.i, n = s.n;
      if (Q.length > 2) {
        const E = [], l = [], f = (Q.length - 2) / 2, m = Q.slice(2, 2 + f);
        for (const I of m) {
          const w = A.subscripts[I];
          E.push(w.i), l.push(w.n);
        }
        a += `[${E.join(",")}]`, n += `[${l.join(",")}]`;
      }
      const g = {
        varId: a,
        varName: n,
        varType: B,
        varIndex: s.x,
        subscriptIndices: Q.length > 2 ? Q.slice(2 + (Q.length - 2) / 2) : void 0
      };
      i.push(g);
    }
    e[r] = i;
  }
  return e;
}
function getImplVars(A) {
  const e = decodeImplVars(A), r = /* @__PURE__ */ new Map(), o = [];
  function i(Q, B) {
    const s = [];
    for (const a of B) {
      if (a.varType === "lookup" || a.varType === "data")
        continue;
      const g = `ModelImpl_${a.varId}`;
      r.set(g, a), s.push(g);
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
  function r(n, g) {
    g < n.minValue ? (console.warn(
      `WARNING: Scenario input value ${g} is < min value (${n.minValue}) for input '${n.varName}'`
    ), g = n.minValue) : g > n.maxValue && (console.warn(
      `WARNING: Scenario input value ${g} is > max value (${n.maxValue}) for input '${n.varName}'`
    ), g = n.maxValue), n.value.set(g);
  }
  function o(n) {
    n.value.reset();
  }
  function i(n) {
    n.value.set(n.minValue);
  }
  function Q(n) {
    n.value.set(n.maxValue);
  }
  function B() {
    A.forEach(o);
  }
  function s() {
    A.forEach(i);
  }
  function a() {
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
          a();
          break;
      }
      break;
    }
    case "input-settings": {
      B();
      for (const n of e.settings) {
        const g = A.get(n.inputVarId);
        if (g)
          switch (n.kind) {
            case "position":
              switch (n.position) {
                case "at-default":
                  o(g);
                  break;
                case "at-minimum":
                  i(g);
                  break;
                case "at-maximum":
                  Q(g);
                  break;
                default:
                  assertNeverExports.assertNever(n.position);
              }
              break;
            case "value":
              r(g, n.value);
              break;
            default:
              assertNeverExports.assertNever(n);
          }
        else
          console.log(`No model input for scenario input ${n.inputVarId}`);
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_1", varId: "_recovered_waste_destination_variation", varName: "Recovered Waste Destination Variation", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "u_flw_2", varId: "_recovered_loss_destination_variation", varName: "Recovered Loss Destination Variation", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_36", varId: "_meat_diet_composition_switch", varName: "Meat Diet Composition Switch", defaultValue: 0, minValue: -0.2, maxValue: 2.2 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_81", varId: "_vegetarian_diet_composition_switch", varName: "Vegetarian Diet Composition Switch", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_allocated_for_animal_calories", varName: "Land Allocated for Animal Calories" }, { varId: "_land_allocated_for_energy_crops", varName: "Land Allocated for Energy Crops" }, { varId: "_land_allocated_for_food_crops", varName: "Land Allocated for Food Crops" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen", varName: "Nitrogen" }, { varId: "_nitrogen_from_application_with_manure", varName: "Nitrogen from Application with Manure" }, { varId: "_nitrogen_from_commerical_application", varName: "Nitrogen from Commerical Application" }, { varId: "_nitrogen_from_denitrification", varName: "Nitrogen from Denitrification" }, { varId: "_nitrogen_from_runoff", varName: "Nitrogen from Runoff" }, { varId: "_nitrogen_from_uptake_rate", varName: "Nitrogen from Uptake Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus", varName: "Phosphorus" }, { varId: "_phosphorus_from_application_with_manure", varName: "Phosphorus from Application with Manure" }, { varId: "_phosphorus_from_commerical_application", varName: "Phosphorus from Commerical Application" }, { varId: "_phosphorus_from_runoff", varName: "Phosphorus from Runoff" }, { varId: "_phosphorus_from_uptake_rate", varName: "Phosphorus from Uptake Rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_supply_of_animal_calories", varName: "Total Supply of Animal Calories" }, { varId: "_total_supply_of_vegetal_calories", varName: "Total Supply of Vegetal Calories" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 464776, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return w.deserialize(o,I)},serialize(o){return w.serialize(o,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(I){D=A.extendSerializer(D,I)}common.registerSerializer=Q;function B(I){return D.deserialize(I)}common.deserialize=B;function w(I){return D.serialize(I)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,I){if(!I){if(!D(w))throw Error();I=[w]}return{[A.$transferable]:!0,send:w,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,I){self.postMessage(w,I)},Q=function(w){const I=o=>{w(o.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!D.default().isMainThread},w=function(K,i){Q(D.default().parentPort).postMessage(K,i)},I=function(K){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const H=O=>{K(O)},P=()=>{Q(i).off("message",H)};return Q(i).on("message",H),P};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?I():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(M,G,t,m){function q(y){return y instanceof t?y:new t(function(b){b(y)})}return new(t||(t=Promise))(function(y,b){function _(p){try{x(m.next(p))}catch(X){b(X)}}function $(p){try{x(m.throw(p))}catch(X){b(X)}}function x(p){p.done?y(p.value):q(p.value).then(_,$)}x((m=m.apply(M,G||[])).next())})},Q=worker&&worker.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),I=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let H=!1;const P=new Map,O=M=>M&&M.type===E.MasterMessageType.cancel,N=M=>M&&M.type===E.MasterMessageType.run,n=M=>B.default(M)||f(M);function f(M){return M&&typeof M=="object"&&typeof M.subscribe=="function"}function L(M){return I.isTransferDescriptor(M)?{payload:M.send,transferables:M.transferables}:{payload:M,transferables:void 0}}function d(){const M={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(M)}function F(M){const G={type:E.WorkerMessageType.init,exposed:{type:"module",methods:M}};o.default.postMessageToMaster(G)}function c(M,G){const{payload:t,transferables:m}=L(G),q={type:E.WorkerMessageType.error,uid:M,error:w.serialize(t)};o.default.postMessageToMaster(q,m)}function a(M,G,t){const{payload:m,transferables:q}=L(t),y={type:E.WorkerMessageType.result,uid:M,complete:G?!0:void 0,payload:m};o.default.postMessageToMaster(y,q)}function J(M,G){const t={type:E.WorkerMessageType.running,uid:M,resultType:G};o.default.postMessageToMaster(t)}function u(M){try{const G={type:E.WorkerMessageType.uncaughtError,error:w.serialize(M)};o.default.postMessageToMaster(G)}catch(G){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,G,`\nOriginal error:`,M)}}function U(M,G,t){return D(this,void 0,void 0,function*(){let m;try{m=G(...t)}catch(y){return c(M,y)}const q=n(m)?"observable":"promise";if(J(M,q),n(m)){const y=m.subscribe(b=>a(M,!1,w.serialize(b)),b=>{c(M,w.serialize(b)),P.delete(M)},()=>{a(M,!0),P.delete(M)});P.set(M,y)}else try{const y=yield m;a(M,!0,w.serialize(y))}catch(y){c(M,w.serialize(y))}})}function l(M){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(H)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(H=!0,typeof M=="function")o.default.subscribeToMasterMessages(G=>{N(G)&&!G.method&&U(G.uid,M,G.args.map(w.deserialize))}),d();else if(typeof M=="object"&&M){o.default.subscribeToMasterMessages(t=>{N(t)&&t.method&&U(t.uid,M[t.method],t.args.map(w.deserialize))});const G=Object.keys(M).filter(t=>typeof M[t]=="function");F(G)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${M}`);o.default.subscribeToMasterMessages(G=>{if(O(G)){const t=G.uid,m=P.get(t);m&&(m.unsubscribe(),P.delete(t))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",M=>{setTimeout(()=>u(M.error||M),250)}),self.addEventListener("unhandledrejection",M=>{const G=M.reason;G&&typeof G.message=="string"&&setTimeout(()=>u(G),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",M=>{setTimeout(()=>u(M),250)}),process.on("unhandledRejection",M=>{M&&typeof M.message=="string"&&setTimeout(()=>u(M),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,I=w?.length||0;D[Q++]=I;for(let E=0;E<I;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=o,B+=2,w+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const I of A){const E=I.varRef.varSpec;D[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;D[B++]=K;for(let i=0;i<K;i++)D[B++]=o[i];I.points!==void 0?(D[B++]=w,D[B++]=I.points.length,Q?.set(I.points,w),w+=I.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let I=0;I<w;I++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let N=0;N<o;N++)K[N]=A[B++];const i=A[B++],H=A[B++],P={varIndex:E,subscriptIndices:K};let O;i>=0?D?O=D.slice(i,i+H):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:P},points:O})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let I;const E=D.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const U of Q.lookups)resolveVarRef(this.listing,U.varRef,"lookup");const u=getEncodedLookupBufferLengths(Q.lookups);o=u.lookupsLength,K=u.lookupIndicesLength}else o=0,K=0;let i=0;function H(u,U){const l=i,M=u==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,G=Math.round(U*M),t=Math.ceil(G/8)*8;return i+=t,l}const P=H("int32",headerLengthInElements),O=H("float64",extrasLengthInElements),N=H("float64",B),n=H("float64",w),f=H("int32",I),L=H("float64",o),d=H("int32",K),F=i;if(this.encoded===void 0||this.encoded.byteLength<F){const u=Math.ceil(F*1.2);this.encoded=new ArrayBuffer(u),this.header.update(this.encoded,P,headerLengthInElements)}const c=this.header.view;let a=0;c[a++]=O,c[a++]=extrasLengthInElements,c[a++]=N,c[a++]=B,c[a++]=n,c[a++]=w,c[a++]=f,c[a++]=I,c[a++]=L,c[a++]=o,c[a++]=d,c[a++]=K,this.inputs.update(this.encoded,N,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,n,w),this.outputIndices.update(this.encoded,f,I),this.lookups.update(this.encoded,L,o),this.lookupIndices.update(this.encoded,d,K);const J=this.inputs.view;for(let u=0;u<A.length;u++){const U=A[u];typeof U=="number"?J[u]=U:J[u]=U.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const I=B[w++],E=B[w++],o=B[w++],K=B[w++],i=B[w++],H=B[w++],P=B[w++],O=B[w++],N=B[w++],n=B[w++],f=B[w++],L=B[w++],d=E*Float64Array.BYTES_PER_ELEMENT,F=K*Float64Array.BYTES_PER_ELEMENT,c=H*Float64Array.BYTES_PER_ELEMENT,a=O*Int32Array.BYTES_PER_ELEMENT,J=n*Float64Array.BYTES_PER_ELEMENT,u=L*Int32Array.BYTES_PER_ELEMENT,U=D+d+F+c+a+J+u;if(A.byteLength<U)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,i,H),this.outputIndices.update(this.encoded,P,O),this.lookups.update(this.encoded,N,n),this.lookupIndices.update(this.encoded,f,L)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,I=!D;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<w;o+=2){const K=B[o];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const i=B[o-2],H=B[o-1],P=B[o+1],O=K-i,N=P-H;return H+N/O*(A-i)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const I=Q[w];if(I>=A){const E=Q[w-2],o=Q[w-1],K=Q[w+1],i=I-E,H=K-o;return o+H/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,I,E){const o=Math.floor((E-B)/I);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*I,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,I){return A.currentTime>w?A.currentTime<I||w>I?B*(A.currentTime-w):B*(I-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,I){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let o=D.get(w);o===void 0&&(o=Array(w),D.set(w,o));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=I>0?1:-1;E.sort((i,H)=>{let P;return i.x<H.x?P=-1:i.x>H.x?P=1:P=0,P*K});for(let i=0;i<w;i++)o[i]=E[i].ind;return o},XIDZ(B,w,I){return Math.abs(w)<EPSILON?I:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const I=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,i)=>{runJsModel(A,Q,B,w,I,E,o,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,I,E,o,K,i,H){let P=D;A.setTime(P);const O={timeStep:B,currentTime:P};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const F of i)A.setLookup(F.varRef.varSpec,F.points);E?.length>0&&A.setInputs(F=>E[F]),A.initLevels();const N=Math.round((Q-D)/B),n=Q;let f=0,L=0,d=0;for(;f<=N;){if(A.evalAux(),P%w<1e-6){d=0;const F=c=>{const a=d*I+L;o[a]=P<=n?c:void 0,d++};if(K!==void 0){let c=0;const a=K[c++];for(let J=0;J<a;J++){const u=K[c++],U=K[c++];let l;U>0&&(l=K.subarray(c,c+U),c+=U);const M={varIndex:u,subscriptIndices:l};A.storeOutput(M,F)}}else A.storeOutputs(F);L++}if(f===N)break;A.evalLevels(),P+=B,A.setTime(P),O.currentTime=P,f++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),I=w/4,E=A.HEAP32.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),I=w/8,E=A.HEAPF64.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,I,E,o;const K=A.getLookups();if(K!==void 0)for(const N of K){const n=N.varRef.varSpec,f=((D=n.subscriptIndices)==null?void 0:D.length)||0;let L;f>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<f)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,f)),this.lookupSubIndicesBuffer.getArrayView().set(n.subscriptIndices),L=this.lookupSubIndicesBuffer.getAddress()):L=0;let d,F;if(N.points){const a=N.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<a)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,a)),this.lookupDataBuffer.getArrayView().set(N.points),d=this.lookupDataBuffer.getAddress(),F=a/2}else d=0,F=0;const c=n.varIndex;this.wasmSetLookup(c,L,d,F)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),N=>{var n;return(n=this.inputsBuffer)==null||n.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,N),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),N=>{var n;return(n=this.outputIndicesBuffer)==null||n.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,N),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const H=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<H)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,H));const P=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(P);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(g,C){B=g,w=C}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_allocated_for_animal_calories","_land_allocated_for_energy_crops","_land_allocated_for_food_crops","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen","_nitrogen_from_application_with_manure","_nitrogen_from_commerical_application","_nitrogen_from_denitrification","_nitrogen_from_runoff","_nitrogen_from_uptake_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus","_phosphorus_from_application_with_manure","_phosphorus_from_commerical_application","_phosphorus_from_runoff","_phosphorus_from_uptake_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_supply_of_animal_calories","_total_supply_of_vegetal_calories","_total_vegetarians","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function H(g){return Q.locateFile?Q.locateFile(g,i):i+g}var P,O;(o||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(g){try{var C=new XMLHttpRequest;return C.open("GET",g,!1),C.responseType="arraybuffer",C.send(null),new Uint8Array(C.response)}catch(r){var s=DA(g);if(s)return s;throw r}}),P=function(g,C,s){var r=new XMLHttpRequest;r.open("GET",g,!0),r.responseType="arraybuffer",r.onload=function(){if(r.status==200||r.status==0&&r.response){C(r.response);return}var h=DA(g);if(h){C(h.buffer);return}s()},r.onerror=s,r.send(null)});var N=Q.print||console.log.bind(console),n=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var f;Q.wasmBinary&&(f=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&W("no native wasm support detected");var L,d=!1;function F(g,C){g||W("Assertion failed: "+C)}function c(g){var C=Q["_"+g];return F(C,"Cannot call unknown function "+g+", make sure it is exported"),C}function a(g,C,s,r,h){var z={string:function(Y){var T=0;if(Y!=null&&Y!==0){var rA=(Y.length<<2)+1;T=gA(rA),G(Y,T,rA)}return T},array:function(Y){var T=gA(Y.length);return t(Y,T),T}};function k(Y){return C==="string"?l(Y):C==="boolean"?!!Y:Y}var e=c(g),j=[],S=0;if(r)for(var R=0;R<r.length;R++){var eA=z[s[R]];eA?(S===0&&(S=sA()),j[R]=eA(r[R])):j[R]=r[R]}var IA=e.apply(null,j);function UA(Y){return S!==0&&KA(S),k(Y)}return IA=UA(IA),IA}function J(g,C,s,r){s=s||[];var h=s.every(function(k){return k==="number"}),z=C!=="string";return z&&h&&!r?c(g):function(){return a(g,C,s,arguments)}}var u=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function U(g,C,s){for(var r=C+s,h=C;g[h]&&!(h>=r);)++h;if(h-C>16&&g.subarray&&u)return u.decode(g.subarray(C,h));for(var z="";C<h;){var k=g[C++];if(!(k&128)){z+=String.fromCharCode(k);continue}var e=g[C++]&63;if((k&224)==192){z+=String.fromCharCode((k&31)<<6|e);continue}var j=g[C++]&63;if((k&240)==224?k=(k&15)<<12|e<<6|j:k=(k&7)<<18|e<<12|j<<6|g[C++]&63,k<65536)z+=String.fromCharCode(k);else{var S=k-65536;z+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return z}function l(g,C){return g?U(q,g,C):""}function M(g,C,s,r){if(!(r>0))return 0;for(var h=s,z=s+r-1,k=0;k<g.length;++k){var e=g.charCodeAt(k);if(e>=55296&&e<=57343){var j=g.charCodeAt(++k);e=65536+((e&1023)<<10)|j&1023}if(e<=127){if(s>=z)break;C[s++]=e}else if(e<=2047){if(s+1>=z)break;C[s++]=192|e>>6,C[s++]=128|e&63}else if(e<=65535){if(s+2>=z)break;C[s++]=224|e>>12,C[s++]=128|e>>6&63,C[s++]=128|e&63}else{if(s+3>=z)break;C[s++]=240|e>>18,C[s++]=128|e>>12&63,C[s++]=128|e>>6&63,C[s++]=128|e&63}}return C[s]=0,s-h}function G(g,C,s){return M(g,q,C,s)}function t(g,C){m.set(g,C)}var m,q,y;function b(g){Q.HEAP8=m=new Int8Array(g),Q.HEAP16=new Int16Array(g),Q.HEAP32=y=new Int32Array(g),Q.HEAPU8=q=new Uint8Array(g),Q.HEAPU16=new Uint16Array(g),Q.HEAPU32=new Uint32Array(g),Q.HEAPF32=new Float32Array(g),Q.HEAPF64=new Float64Array(g)}Q.INITIAL_MEMORY;var _,$=[],x=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)GA(Q.preRun.shift());wA($)}function kA(){wA(x)}function PA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());wA(p)}function GA(g){$.unshift(g)}function HA(g){x.unshift(g)}function cA(g){p.unshift(g)}var v=0,V=null;function aA(g){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function NA(g){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&V){var C=V;V=null,C()}}Q.preloadedImages={},Q.preloadedAudios={};function W(g){Q.onAbort&&Q.onAbort(g),g="Aborted("+g+")",n(g),d=!0,g+=". Build with -s ASSERTIONS=1 for more info.";var C=new WebAssembly.RuntimeError(g);throw w(C),C}var EA="data:application/octet-stream;base64,";function BA(g){return g.startsWith(EA)}function oA(g){return g.startsWith("file://")}var Z;Z="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBsIrOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKyuMOOsEFAgt/AXwjAEEQayIGJAACQEHA/w0oAgAiAgRAIAJByP8NKAIAIgFBzP8NKAIAbEEDdGpB0P8NKAIAQQN0aiAAOQMAQcj/DSABQQFqNgIADAELQbj/DSgCACIBRQRAAn9BsOUFKwMAQcifBisDAKFBkJ8HKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQbj/DUGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQbz/DSgCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEG8/w1BvP8NKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAF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KwMAojkDAEHY7Q1B6O0HKwMAQdjADCsDAKI5AwBB0O0NQeDtBysDAEHQwAwrAwCiOQMAQcjtDUHY7QcrAwBByMAMKwMAojkDAEGA7w1BkO8HKwMAQYDCDCsDAKI5AwBB+O4NQYjvBysDAEH4wQwrAwCiOQMAQfDuDUGA7wcrAwBB8MEMKwMAojkDAEHA7Q1B0O0HKwMAQcDADCsDAKI5AwBB6O4NQfjuBysDAEHowQwrAwCiOQMAQbjtDUHI7QcrAwBBuMAMKwMAojkDAEHg7g1B8O4HKwMAQeDBDCsDAKI5AwBBsO0NQcDtBysDAEGwwAwrAwCiOQMAQdjuDUHo7gcrAwBB2MEMKwMAojkDAEGo7Q1BuO0HKwMAQajADCsDAKI5AwBB0O4NQeDuBysDAEHQwQwrAwCiOQMAQaDtDUGw7QcrAwBBoMAMKwMAojkDAEHI7g1B2O4HKwMAQcjBDCsDAKI5AwBBmO0NQajtBysDAEGYwAwrAwCiOQMAQcDuDUHQ7gcrAwBBwMEMKwMAojkDAEGQ7Q1BoO0HKwMAQZDADCsDAKI5AwBBuO4NQcjuBysDAEG4wQwrAwCiOQMAQYjtDUGY7QcrAwBBiMAMKwMAojkDAEGw7g1BwO4HKwMAQbDBDCsDAKI5AwBBgO0NQZDtBysDAEGAwAwrAwCiOQMAQajuDUG47gcrAwBBqMEMKwMAojkDAEHQ8A1BwOMHKwMAQYDBDCsDAKI5AwBB+PENQejkBysDAEGowgwrAwCiOQMAQcjwDUG44wcrAwBB+MAMKwMAojkDAEHw8Q1B4OQHKwMAQaDCDCsDAKI5AwBBwPANQbDjBysDAEHwwAwrAwCiOQMAQejxDUHY5AcrAwBBmMIMKwMAojkDAEG48A1BqOMHKwMAQejADCsDAKI5AwBB4PENQdDkBysDAEGQwgwrAwCiOQMAQbDwDUGg4wcrAwBB4MAMKwMAojkDAEHY8Q1ByOQHKwMAQYjCDCsDAKI5AwBBqPANQZjjBysDAEHYwAwrAwCiOQMAQdDxDUHA5AcrAwBBgMIMKwMAojkDAEGg8A1BkOMHKwMAQdDADCsDAKI5AwBByPENQbjkBysDAEH4wQwrAwCiOQMAQZjwDUGI4wcrAwBByMAMKwMAojkDAEHA8Q1BsOQHKwMAQfDBDCsDAKI5AwBBkPANQYDjBysDAEHAwAwrAwCiOQMAQbjxDUGo5AcrAwBB6MEMKwMAojkDAEGI8A1B+OIHKwMAQbjADCsDAKI5AwBBsPENQaDkBysDAEHgwQwrAwCiOQMAQYDwDUHw4gcrAwBBsMAMKwMAojkDAEGo8Q1BmOQHKwMAQdjBDCsDAKI5AwBB+O8NQejiBysDAEGowAwrAwCiOQMAQaDxDUGQ5AcrAwBB0MEMKwMAojkDAEHw7w1B4OIHKwMAQaDADCsDAKI5AwBBmPENQYjkBysDAEHIwQwrAwCiOQMAQejvDUHY4gcrAwBBmMAMKwMAojkDAEGQ8Q1BgOQHKwMAQcDBDCsDAKI5AwBB4O8NQdDiBysDAEGQwAwrAwCiOQMAQYjxDUH44wcrAwBBuMEMKwMAojkDAEHY7w1ByOIHKwMAQYjADCsDAKI5AwBBgPENQfDjBysDAEGwwQwrAwCiOQMAQdDvDUHA4gcrAwBBgMAMKwMAojkDAEH48A1B6OMHKwMAQajBDCsDAKI5AwBByO8NQbjiBysDAEH4vwwrAwCiOQMAQfDwDUHg4wcrAwBBoMEMKwMAojkDAEEAIQ9BoPMNQfDoBysDAEGAwQwrAwCiOQMAQZjzDUHo6AcrAwBB+MAMKwMAojkDAEGQ8w1B4OgHKwMAQfDADCsDAKI5AwBByPQNQZjqBysDAEGowgwrAwCiOQMAQcD0DUGQ6gcrAwBBoMIMKwMAojkDAEG49A1BiOoHKwMAQZjCDCsDAKI5AwBBiPMNQdjoBysDAEHowAwrAwCiOQMAQbD0DUGA6gcrAwBBkMIMKwMAojkDAEGA8w1B0OgHKwMAQeDADCsDAKI5AwBBqPQNQfjpBysDAEGIwgwrAwCiOQMAQfjyDUHI6AcrAwBB2MAMKwMAojkDAEGg9A1B8OkHKwMAQYDCDCsDAKI5AwBB8PINQcDoBysDAEHQwAwrAwCiOQMAQZj0DUHo6QcrAwBB+MEMKwMAojkDAEHo8g1BuOgHKwMAQcjADCsDAKI5AwBBkPQNQeDpBysDAEHwwQwrAwCiOQMAQeDyDUGw6AcrAwBBwMAMKwMAojkDAEGI9A1B2OkHKwMAQejBDCsDAKI5AwBB2PINQajoBysDAEG4wAwrAwCiOQMAQYD0DUHQ6QcrAwBB4MEMKwMAojkDAEHQ8g1BoOgHKwMAQbDADCsDAKI5AwBB+PMNQcjp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IAEiA0EBayEBIAAgBkGgAWogA0EDdGorAwCgIQAgAw0ACwsgECAAmiAAIAwbOQMAIAYrA6ABIAChIQBBASEBIAJBAEoEQANAIAAgBkGgAWogAUEDdGorAwCgIQAgASACRyEDIAFBAWohASADDQALCyAQIACaIAAgDBs5AwggBkGwBGokACAIQQdxIQIgCisDACEAIBxCAFMEQCAEIACaOQMAIAQgCisDCJo5AwhBACACayECDAELIAQgADkDACAEIAorAwg5AwgLIApBMGokAAJAAkACQAJAIAJBA3EOAwABAgMLIAkrAwAgCSsDCBAfDAMLIAkrAwAgCSsDCBAqmgwCCyAJKwMAIAkrAwgQH5oMAQsgCSsDACAJKwMIECoLIQAgCUEQaiQAIAALTgEBfEQAAAAAAADwP0QAAAAAAAAAAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiASAARAAAAAAAAPA/oGMbRAAAAAAAAAAAIAAgAWMbC6DuAwECf0H4ugVCgICAgIDgyefAADcDAEHwugVCmrPmzJmDutfAADcDAEHougVCgICAgID8nuzAADcDAEHgugVCgICAgIDQvunAADcDAEHYugVCgICAgICYuujAADcDAEHQugVCzZmz5sy90OzAADcDAEHIugVCgICAgIDwuOnAADcDAEHAugVCmrPmzJnds/HAADcDAEGwugVCgICAgICAwKzAADcDAEGAuwVCgICAgICAwJ3AADcDAEGIuwVCuL2U3J6Krtc/NwMAQaC8BUKAgICAgMD04sAANwMAQZi8BUKAgICAgIiK8sAANwMAQZC8BUKAgICAgNengcEANwMAQYi8BUKAgICAgM2WjcEANwMAQYC8BUKAgICAwJnGmMEANwMAQfi7BUKAgICA4MOyocEANwMAQfC7BUKAgICA4IDwqMEANwMAQei7BUKAgICA+Ia7rcEANwMAQeC7BUKAgICAwLmmscEANwMAQdi7BUKAgICAkPSrtMEANwMAQdC7BUKAgICAyIrmt8EANwMAQci7BUKAgICA5N7kucEANwMAQcC7BUKAgICA2J7ku8EANwMAQbi7BUKAgICAsLHqvcEANwMAQbC7BUKAgICAhoaPwMEANwMAQai7BUKAgICAtsOZwsEANwMAQaC7BUKAgICAyv+NxsEANwMAQZi7BUKAgICA9KjFycEANwMAQZC7BUKAgICA8ob6ysEANwMAQeC9BUKAgICAgICA+D83AwBBuLwFQoCAgICAgID4PzcDAEGwvAVCgICAgICAisDAADcDAEGovAVCgICAgICA9tHAADcDAEGQvgVCgICAgKipxa3BADcDAEGIvgVCgICAgMDL8q/BADcDAEGAvgVCgICAgPiNqrHBADcDAEH4vQVCgICAgIjo2rLBADcDAEHwvQVCgICAgICAgPg/NwMAQei9BUKAgICAgICA+D83AwBB2L0FQoCAgICAgOCwwAA3AwBB0L0FQoCAgICAgODCwAA3AwBByL0FQoCAgICAgOjTwAA3AwBBwL0FQoCAgICA4PTiwAA3AwBBuL0FQoCAgICAoIrywAA3AwBBsL0FQoCAgICAjKL+wAA3AwBBqL0FQoCAgIDA2KCJwQA3AwBBoL0FQoCAgICg/pWSwQA3AwBBmL0FQoCAgICA+82ZwQA3AwBBkL0FQoCAgICgx8mewQA3AwBBiL0FQoCAgICA9IiiwQA3AwBBgL0FQoCAgIDgya6lwQA3AwBB+LwFQoCAgID408aowQA3AwBB8LwFQoCAgIDArMyqwQA3AwBB6LwFQoCAgICg/eCswQA3AwBB4LwFQoCAgID45vyuwQA3AwBB2LwFQoCAgIDA/eSwwQA3AwBB0LwFQoCAgICguouywQA3AwBByLwFQoCAgIDghq6zwQA3AwBBwLwFQoCAgICAgID4PzcDAEGIvwVCgICAgICAgPg/NwMAQYDABUKAgICAgNiO7MAANwMAQfi/BUKAgICAgIDc98AANwMAQfC/BUKAgICAgMzRgMEANwMAQei/BUKAgICAgLeUiMEANwMAQeC/BUKAgICAgJSwjMEANwMAQdi/BUKAgICAoL7GkMEANwMAQdC/BUKAgICA4Mask8EANwMAQci/BUKAgICAwInDlsEANwMAQcC/BUKAgICAgOH/mMEANwMAQbi/BUKAgICAwNTqmsEANwMAQbC/BUKAgICAwNbbnMEANwMAQai/BUKAgICA4Mn2nsEANwMAQaC/BUKAgICAgICA+D83AwBBmL8FQoCAgICAgID4PzcDAEGQvwVCgICAgICAgPg/NwMAQYC/BUKAgICAgICoscAANwMAQfi+BUKAgICAgIC0w8AANwMAQfC+BUKAgICAgIDF1MAANwMAQei+BUKAgICAgNDK48AANwMAQeC+BUKAgICAgMTZ8sAANwMAQdi+BUKAgICAgKiS/8AANwMAQdC+BUKAgICAgL/picEANwMAQci+BUKAgICA4P7lksEANwMAQcC+BUKAgICA4MSZmsEANwMAQbi+BUKAgICAgJm8n8EANwMAQbC+BUKAgICAwI3YosEANwMAQai+BUKAgICA4NiXpsEANwMAQaC+BUKAgICA+PWJqcEANwMAQZi+BUKAgICA+Nifq8EANwMAQdjBBUKAgICAgICA+D83AwBB0MEFQoCAgICAgMi9wAA3AwBByMEFQoCAgICAwKvQwAA3AwBBwMEFQoCAgICAoJXhwAA3AwBBuMEFQoCAgICA7LvwwAA3AwBBsMEFQoCAgICAtNL/wAA3AwBBqMEFQoCAgICAgomLwQA3AwBBoMEFQoCAgICgza6WwQA3AwBBmMEFQoCAgICg0eSfwQA3AwBBkMEFQoCAgIDA7PSmwQA3AwBBiMEFQoCAgIDo0aerwQA3AwBBgMEFQoCAgIDAqtCvwQA3AwBB+MAFQoCAgIDYsK+ywQA3AwBB8MAFQoCAgIDY7qK1wQA3AwBB6MAFQoCAgICowJy4wQA3AwBB4MAFQoCAgIDwlPO5wQA3AwBB2MAFQoCAgIDAs8+7wQA3AwBB0MAFQoCAgID09tG9wQA3AwBByMAFQoCAgICcgO3AwQA3AwBBwMAFQoCAgICW6oHFwQA3AwBBuMAFQoCAgICP3dLJwQA3AwBBsMAFQoCAgICauYnLwQA3AwBBqMAFQoCAgICAgICfwAA3AwBBoMAFQoCAgICAgJCxwAA3AwBBmMAFQoCAgICAgITCwAA3AwBBkMAFQoCAgICAgKLRwAA3AwBBiMAFQoCAgICA0MfgwAA3AwBB8MEFQoCAgIDYh9K2wQA3AwBB6MEFQoCAgICI/564wQA3AwBB4MEFQoCAgICAgID4PzcDAEGAwwVCgICAgICAgPg/NwMAQeDDBUKAgICAgMvrm8EANwMAQdjDBUKAgICAwLL9oMEANwMAQdDDBUKAgICAwJy0pMEANwMAQcjDBUKAgICA0PSdqMEANwMAQcDDBUKAgICA2O7EqsEANwMAQbjDBUKAgICAgKqHrcEANwMAQbDDBUKAgICAyJncr8EANwMAQajDBUKAgICA9PucscEANwMAQaDDBUKAgICAwJ3qssEANwMAQZjDBUKAgICAqK+3tMEANwMAQZDDBUKAgICAgICA+D83AwBBiMMFQoCAgICAgID4PzcDAEH4wgVCgICAgICA2LTAADcDAEHwwgVCgICAgICAzMfAADcDAEHowgVCgICAgICgydjAADcDAEHgwgVCgICAgIDw6ufAADcDAEHYwgVCgICAgICk0PbAADcDAEHQwgVCgICAgID4rILBADcDAEHIwgVCgICAgICQt43BADcDAEHAwgVCgICAgKCq4ZbBADcDAEG4wgVCgICAgIDn+J3BADcDAEGwwgVCgICAgPDIyaLBADcDAEGowgVCgICAgICtzqbBADcDAEGgwgVCgICAgOCP2anBADcDAEGYwgVCgICAgLC8tKzBADcDAEGQwgVCgICAgPCbsK/BADcDAEGIwgVCgICAgPDooLHBADcDAEGAwgVCgICAgNDf7rLBADcDAEH4wQVCgICAgKC84LTBADcDAEGoxAVCgICAgICAgPg/NwMAQcjFBUKAgICAgIDAoMAANwMAQcDFBUKAgICAgIDQssAANwMAQbjFBUKAgICAgIDSw8AANwMAQbDFBUKAgICAgMDg0sAANwMAQajFBUKAgICAgPD34cAANwMAQaDFBUKAgICAgJCI7sAANwMAQZjFBUKAgICAgOyP+cAANwMAQZDFBUKAgICAgL2DgsEANwMAQYjFBUKAgICAgLy8icEANwMAQYDFBUKAgICAwISvjsEANwMAQfjEBUKAgICAgMr2kcEANwMAQfDEBUKAgICA4KCWlcEANwMAQejEBUKAgICA4Iu3mMEANwMAQeDEBUKAgICA4Ie5msEANwMAQdjEBUKAgICA4ODJnMEANwMAQdDEBUKAgICAwMbhnsEANwMAQcjEBUKAgICAgP7UoMEANwMAQcDEBUKAgICAgICA+D83AwBBuMQFQoCAgICAgID4PzcDAEGwxAVCgICAgICAgPg/NwMAQaDEBUKAgICAgIDgssAANwMAQZjEBUKAgICAgICgxcAANwMAQZDEBUKAgICAgIDH1sAANwMAQYjEBUKAgICAgJC55cAANwMAQYDEBUKAgICAgPC19MAANwMAQfjDBUKAgICAgIvlgMEANwMAQfDDBUKAgICAgOizi8EANwMAQejDBUKAgICA4KvElMEANwMAQdDFBULJpJLJpJLJ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koaC1py0kds/NwMAQfjWBUKAgICAgIDQx8AANwMAQYDXBUKAgICAgICAksAANwMAQYjXBUKas+bMmbPm5D83AwBBkNcFQpqz5syZs+bkPzcDAEGY1wVCmrPmzJmz5uQ/NwMAQaDXBUKAgICA65H8/cEANwMAQajXBUKas+bMmbPm5D83AwBBsNcFQoCAgICAgID4PzcDAEHA1wVCgICAgICA2s/AADcDAEG41wVCgICAoLCNvZLCADcDAEH42AVCgICAgICA+8nAADcDAEGY2gVCgICAgICA+M7AADcDAEGQ2gVCgICAgICA+M7AADcDAEGI2gVCgICAgICA+M7AADcDAEGA2gVCgICAgICA+M7AADcDAEH42QVCgICAgICA+M7AADcDAEHw2QVCgICAgICA+M7AADcDAEHo2QVCgICAgICA+M7AADcDAEHg2QVCgICAgICA+M7AADcDAEHY2QVCgICAgICA+M7AADcDAEHQ2QVCgICAgICA+M7AADcDAEHI2QVCgICAgICA+M7AADcDAEHA2QVCgICAgIDAptDAADcDAEG42QVCgICAgIDAptDAADcDAEGw2QVCgICAgIDAptDAADcDAEGo2QVCgICAgIDAptDAADcDAEGg2QVCgICAgIDAptDAADcDAEGY2QVCgICAgIDAkNHAADcDAEGQ2QVCgICAgIDAu9DAADcDAEGI2QVCgICAgICA+M/AADcDAEGA2QVCgICAgICAz8zAADcDAEGA2AVCgICAgICA5dLAADcDAEH41wVCgICAgICA5dLAADcDAEHw1wVCgICAgICAz9PAADcDAEHo1wVCgICAgICAutPAADcDAEHg1wVCgICAgICA5tDAADcDAEHY1wVCgICAgICApM3AADcDAEHQ1wVCgICAgICAwsrAADcDAEHw2AVCgICAgIDAkNHAADcDAEHo2AVCgICAgIDAkNHAADcDAEHg2AVCgICAgIDAkNHAADcDAEHY2AVCgICAgIDAkNHAADcDAEHQ2AVCgICAgIDAkNHAADcDAEHI2AVCgICAgIDAkNHAADcDAEHA2AVCgICAgIDAkNHAADcDAEG42AVCgICAgIDAkNHAADcDAEGw2AVCgICAgIDA+tHAADcDAEGo2AVCgICAgIDA+tHAADcDAEGg2AVCgICAgIDA+tHAADcDAEGY2AVCgICAgIDA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NwMAQeCgBkLu+f2p48vu9j83AwBB2KAGQu75/anjy+72PzcDAEHQoAZC7vn9qePL7vY/NwMAQcigBkLu+f2p48vu9j83AwBB8KIGQoCAgICAgICAwAA3AwBB+KIGQgA3AwBBgKMGQoiHnamWgP/NPjcDAEGIowZCgICAzPf99MLCADcDAEGQowZCgICAgICA4LDAADcDAEGYogZC1MaX3cmYiPI/NwMAQZCiBkLUxpfdyZiI8j83AwBBiKIGQtTGl93JmIjyPzcDAEGAogZC1MaX3cmYiPI/NwMAQfihBkLUxpfdyZiI8j83AwBB8KEGQtTGl93JmIjyPzcDAEGYowZCmrPmzJmz5tw/NwMAQaCjBkKAgICAwPD1w8EANwMAQaijBkKAgICAgICAhMAANwMAQbCjBkKz5syZs+bM+T83AwBBuKMGQoCAgICAgICOwAA3AwBBwKMGQri9lNyeiq7HPzcDAEHIowZCzZmz5syZs+4/NwMAQdCjBkIANwMAQdijBkKAgIDgrJDnlMIANwMAQeCjBkKAgICAgICewMAANwMAQeijBkKAgICAgJChj8EANwMAQZilBkKAgICAmPSAzsEANwMAQbimBkKAgICAgICsyMAANwMAQbCmBkKAgICAgKCg2sAANwMAQaimBkKAgICAgMCi68AANwMAQaCmBkKAgICAgL60+sAANwMAQZimBkKAgICAgPHOicEANwMAQZCmBkKAgICA4IrOlcEANwMAQYimBkKAgICAsJjqoMEANwMAQYCmBkKAgICAmIvaqcEANwMAQfilBkKAgICA3K+VscEANwMAQfClBkKAgICAoN7ztcEANwMAQeilBkKAgICA7M3NucEANwMAQeClBkKAgICAoPHfvMEANwMAQdilBkKAgICA9qWUwMEANwMAQdClBkKAgICAsvmNwsEANwMAQcilBkKAgICAiu2VxMEANwMAQcClBkKAgICApM+kxsEANwMAQbilBkKAgICA7ZyxyMEANwMAQbClBkKAgICA4YXQycEANwMAQailBkKAgICA1ZPrysEANwMAQaClBkKAgICAmuSZzMEANwMAQbCkBkKAgICAwOGfwMEANwMAQaikBkKAgICA4JOcwsEANwMAQaCkBkKAgICAkvqmxMEANwMAQZikBkKAgICAmtm4xsEANwMAQZCkBkKAgICAh4G9yMEANwMAQYikBkKAgICAgcndycEANwMAQYCkBkKAgICA8bD6ysEANwMAQfijBkKAgICAwveqzMEANwMAQfCjBkKAgICA3MuUzsEANwMAQZClBkKAgICAgIC3yMAANwMAQYilBkKAgICAgOCu2sAANwMAQYClBkKAgICAgKiy68AANwMAQfikBkKAgICAgI7D+sAANwMAQfCkBkKAgICAgLPcicEANwMAQeikBkKAgICA4JrhlcEANwMAQeCkBkKAgICAwMz2oMEANwMAQdikBkKAgICAwNznqcEANwMAQdCkBkKAgICA0KCiscEANwMAQcikBkKAgICAoKKHtsEANwMAQcCkBkKAgICA/I3bucEANwMAQbikBkKAgICAnObxvMEANwMAQYCpBkLh9dHw+ui1ycAANwMAQfioBkKAgICAgNis2sAANwMAQfCoBkKAgICAgNzH6cAANwMAQeioBkLmzJmz5rTq+MAANwMAQeCoBkKAgICAgPC/hMEANwMAQdioBkKAgICAoPeNkMEANwMAQdCoBkKAgICA4Nj0mMEANwMAQcioBkKAgICAoMu1oMEANwMAQcCoBkKAgICAgLripMEANwMAQbioBkKAgICA8J3pqMEANwMAQbCoBkKAgICA2NXaq8EANwMAQaioBkKAgICAyIz+rsEANwMAQaCoBkKAgICAlKmkscEANwMAQZioBkKAgICAyNaWs8EANwMAQZCoBkKAgICAoKyPtcEANwMAQYioBkKAgICAmJ2zt8EANwMAQYCoBkKAgICAkLzruMEANwMAQfinBkKAgICA3PX5ucEANwMAQeCnBkKKro+F14eRu8AANwMAQdinBkL20fD6qLjUzcAANwMAQdCnBkKk4fXR8LqC38AANwMAQcinBkLmzJmz5uDv7cAANwMAQcCnBkKAgICAgKzo/MAANwMAQbinBkKAgICAwOaIicEANwMAQbCnBkKAgICAoJTik8EANwMAQainBkKAgICAgKP3nMEANwMAQaCnBkKAgICAsNqbpMEANwMAQZinBkKAgICA4PGhqcEANwMAQZCnBkKAgICA8NLmrMEANwMAQYinBkKAgICAuK+/sMEANwMAQYCnBkKAgICA+NfvssEANwMAQfimBkKAgICA8LG8tcEANwMAQfCmBkKAgICAxIWOuMEANwMAQeimBkKAgICApLvCucEANwMAQeCmBkKAgICAjJ+Wu8EANwMAQdimBkKAgICAwPLpvMEANwMAQdCmBkKAgICAjM24vsEANwMAQYipBkLNmbPmzJmqt8AANwMAQZirBkKAgICA8Ob3oMEANwMAQZCrBkKAgICAgPHGpcEANwMAQYirBkKAgICA4M+uqcEANwMAQYCrBkKAgICAmOG2rMEANwMAQfiqBkKAgICAkPvzr8EANwMAQfCqBkKAgICAyKvtscEANwMAQeiqBkKAgICA2Mvus8EANwMAQeCqBkKAgICA0MX2tcEANwMAQdiqBkKAgICA+JaWuMEANwMAQdCqBkKAgICArP+wucEANwMAQbCqBkLh9dHw+ui1ucAANwMAQaiqBkLmzJmz5qzNy8AANwMAQaCqBkKKro+F16fg3MAANwMAQZiqBkKAgICAgPDj68AANwMAQZCqBkKAgICAgPbw+sAANwMAQYiqBkKAgICAgLWzh8EANwMAQYCqBkKAgICA4Pv+kcEANwMAQfipBkKAgICAoMz9msEANwMAQfCpBkKAgICAwOqvosEANwMAQeipBkKAgICA4IHep8EANwMAQeCpBkKAgICAuLzvqsEANwMAQdipBkKAgICAwNm2rsEANwMAQdCpBkKAgICA+OGdscEANwMAQcipBkKAgICAkKS4s8EANwMAQcCpBkKAgICA2PbitcEANwMAQbipBkKAgICAwNWKuMEANwMAQbCpBkKAgICAoMC+ucEANwMAQaipBkKAgICA+JzyusEANwMAQdirBkLk9vz+1LGRuMAANwMAQdCrBkKKro+F1+f/ycAANwMAQcirBkKF18fC65v+2sAANwMAQcCrBkLmzJmz5vSS6sAANwMAQbirBkKAgICAgO+v+cAANwMAQbCrBkKAgICAgJiihcEANwMAQairBkKAgICAoNvNkMEANwMAQaCrBkKAgICAoOW6mcEANwMAQcCtBkKAgICAwJLin8EANwMAQbitBkKAgICAsPC+ocEANwMAQbCtBkKAgICA8IOSo8EANwMAQaitBkKAgICAwPGJpcEANwMAQYCtBkLoorbn96eJp8AANwMAQfisBkKvupOxkLClucAANwMAQfCsBkLmzJmz5uyZysAANwMAQeisBkLmzJmz5pS22cAANwMAQeCsBkLNmbPmzK3a6MAANwMAQdisBkKz5syZs46p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4LIGQoCAgICAgJeOwQA3AwBB2LIGQoCAgIDAnamQwQA3AwBB0LIGQoCAgICAgID4PzcDAEHIsgZCgICAgICAgPg/NwMAQcCyBkKAgICAgICA+D83AwBBsLIGQoCAgICAgKCiwAA3AwBBqLIGQoCAgICAgOC0wAA3AwBBoLIGQoCAgICAgP7FwAA3AwBBmLIGQoCAgICAgPXUwAA3AwBBgLQGQoCAgIDg7pqvwQA3AwBB+LMGQoCAgIDQs++xwQA3AwBB8LMGQoCAgIDQxcG2wQA3AwBB6LMGQoCAgICw6uC6wQA3AwBB4LMGQoCAgICIyqy8wQA3AwBBiLUGQoCAgICAgID4PzcDAEGAtQZCgICAgICAkK/AADcDAEH4tAZCgICAgICApsHAADcDAEHwtAZCgICAgIDAnNLAADcDAEHotAZCgICAgIDQuOHAADcDAEHgtAZCgICAgIC43PDAADcDAEHYtAZCgICAgICMrPzAADcDAEHQtAZCgICAgICNgYjBADcDAEHItAZCgICAgIDM5pDBADcDAEHAtAZCgICAgKCiqJjBADcDAEG4tAZCgICAgOCfzpzBADcDAEGwtAZCgICAgICj26DBADcDAEGotAZCgICAgOCSyKPBADcDAEGgtAZCgICAgKCx5qbBADcDAEGYtAZCgICAgIDRlanBADcDAEGQtAZCgICAgOD/hKvBADcDAEGItAZCgICAgLDL+qzBADcDAEHwtQZCgICAgMCxnYjBADcDAEHotQZCgICAgMCcxo/BADcDAEHgtQZCgICAgICt5ZPBADcDAEHYtQZCgICAgODmkpjBADcDAEHQtQZCgICAgMD755rBADcDAEHItQZCgICAgICl653BADcDAEHAtQZCgICAgJCvyaDBADcDAEG4tQZCgICAgKCXqaLBADcDAEGwtQZCgICAgODnjqTBADcDAEGotQZCgICAgNCtnKbBADcDAEGgtQZCgICAgLjvlKjBADcDAEGYtQZCgICAgPi0mKnBADcDAEGQtQZCgICAgICAgPg/NwMAQdi3BkKAgICAgICA+D83AwBBsLYGQoCAgICAgID4PzcDAEHgtwZCgICAgICAgPg/NwMAQdC3BkKAgICAgICApMAANwMAQci3BkKAgICAgIDgtsAANwMAQcC3BkKAgICAgICPyMAANwMAQbi3BkKAgICAgID/1sAANwMAQbC3BkKAgICAgPDs5cAANwMAQai3BkKAgICAgMjm8cAANwMAQaC3BkKAgICAgOjb/MAANwMAQZi3BkKAgICAgP78hcEANwMAQZC3BkKAgICAgIKajcEANwMAQYi3BkKAgICAgNeBksEANwMAQYC3BkKAgICAwIHrlcEANwMAQfi2BkKAgICAoJqXmcEANwMAQfC2BkKAgICAgI3gm8EANwMAQei2BkKAgICAoNfHnsEANwMAQeC2BkKAgICA8PHhoMEANwMAQdi2BkKAgICAoPGkosEANwMAQdC2BkKAgICA4OKJpMEANwMAQci2BkKAgICA4MLupcEANwMAQcC2BkKAgICAgICA+D83AwBBuLYGQoCAgICAgID4PzcDAEGotgZCgICAgICAoKbAADcDAEGgtgZCgICAgICA2LjAADcDAEGYtgZCgICAgICAx8nAADcDAEGQtgZCgICAgICA6tjAADcDAEGItgZCgICAgIDwk+jAADcDAEGAtgZCgICAgIC0xfPAADcDAEH4tQZCgICAgID+/P7AADcDAEH4uAZCgICAgICAgJLAADcDAEHwuAZCgICAgICA4KPAADcDAEHouAZCgICAgICAgLXAADcDAEHguAZCgICAgICAgMTAADcDAEHYuAZCgICAgIDAitPAADcDAEHQuAZCgICAgICg19/AADcDAEHIuAZCgICAgICglurAADcDAEHAuAZCgICAgICYl/PAADcDAEG4uAZCgICAgICCyPrAADcDAEGwuAZCgICAgICsgYDBADcDAEGouAZCgICAgIDoiIPBADcDAEGguAZCgICAgICq2IbBADcDAEGYuAZCgICAgMCks4nBADcDAEGQuAZCgICAgID50ovBADcDAEGIuAZCgICAgMCDg47BADcDAEGAuAZCgICAgKDBnZDBADcDAEH4twZCgICAgIDP1JHBADcDAEHwtwZCgICAgICAgPg/NwMAQei3BkKAgICAgICA+D83AwBBgLkGQoCAgICgmPuUwQA3AwBBiLkGQvzTxpfdyZioPzcDAEGQuQZCgICAgICAgITAADcDAEGYuQZC+6i4vZTcnto/NwMAQaC5BkKAgICAgICAisAANwMAQai5BkKAgICAgICAisAANwMAQbC5BkKAgICAgICAisAANwMAQbi5BkKAgICAgICAisAANwMAQcC5BkKAgICAgICAisAANwMAQfC5BkIANwMAQei5BkIANwMAQfi5BkEAQSgQEBpBgLsGQs/vz5re9Kb6PzcDAEH4ugZCgICAgICAgPw/NwMAQdi9BkK9lNyeir7008AANwMAQdC9BkKas+bMmbOV6MAANwMAQci9BkKas+bMmYOZ5MAANwMAQcC9BkK4vZTcnrq828AANwMAQbi9BkLNmbPmzMmg6sAANwMAQbC9BkKU3J6Krrem4cAANwMAQai9BkK4vZTcnqLn2MAANwMAQaC9BkLXx8Lro9Hd08AANwMAQZi9BkKfiq6Phdeg0MAANwMAQZC9BkKk4fXR8Irb0MAANwMAQYi9BkKU3J6Kru+80MAANwMAQYC9BkLIwuuj4bX2ycAANwMAQfi8BkLIwuuj4fXWycAANwMAQfC8BkKPhdfHwuuGy8AANwMAQei8BkL808aX3YmnxsAANwMAQeC8BkKdtJHb87viw8AANwMAQdi8BkLe9KbioMCNxcAANwMAQdC8BkLoorbn96fMxsAANwMAQci8BkLioODKw/a+w8AANwMAQcC8BkLayO35/YmMxcAANwMAQbi8BkL3z7Ca57CP2T83AwBBmLsGQomDgauOmre+wAA3AwBBkLsGQt+bgvPD1rrXPzcDAEGwvAZC4fXR8PqQ9ODAADcDAEGovAZCgICAgIDg8+TAADcDAEGgvAZC0vD6qLjV893AADcDAEGYvAZCgICAgICQ5tTAADcDAEGQvAZC5syZs+a8v+XAADcDAEGIvAZC+dKbiYPhvMbAADcDAEGAvAZCpOH10fC69s7AADcDAEH4uwZCvZTcnoru4M/AADcDAEHwuwZCgICAgICQ+dXAADcDAEHouwZC5syZs+asuNfAADcDAEHguwZCro+F18eyn9PAADcDAEHYuwZC18fC66PxntHAADcDAEHQuwZCiq6PhdeHnMvAADcDAEHIuwZC9tHw+qiY8MvAADcDAEHAuwZCro+F18fCl87AADcDAEG4uwZCyMLro+G1iczAADcDAEGwuwZC0vD6qLj9xcvAADcDAEGouwZChdfHwuujy8rAADcDAEGguwZC1py0kduTocbAADcDAEHgvQZCADcDAEG4vgZC1Krrncybqds/NwMAQbC+BkKi/4nc2KLN+D83AwBBqL4GQs3J7+zmjZOKwAA3AwBB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zJmz9j83AwBBsKAHQoCAgICAgID4PzcDAEHgoQdCs+bMmbPmzPU/NwMAQbigB0Kz5syZs+bM9T83AwBB8KIHQoCAgICAgICvwAA3AwBB+KIHQoCAgICAgICqwAA3AwBBgKMHQoCAgICAgMCswAA3AwBBiKMHQgA3AwBBkKMHQvr9qePL7qS0PzcDAEGYowdCmrPmzJmz5tw/NwMAQaCjB0LO0JCCnIT1+D83AwBBsKMHQgA3AwBBqKMHQubMmbPmzJn7PzcDAEG4owdCADcDAEHAowdCADcDAEHIowdCgICAgICAgPg/NwMAQdCjB0KAgICAgICA8D83AwBB2KMHQoCAgICAgIDwPzcDAEHgowdCgICAkMrSxq7CADcDAEHoowdCgICAgICAgJ/AADcDAEHwowdCgICAgICAgIDAADcDAEH4owdCADcDAEGApAdCgICAgICAgIDAADcDAEGIpAdCgICAgICAgI7AADcDAEGQpAdCgICAgICA5cnAADcDAEGYpAdCrYbx2K7cjY0/NwMAQaCkB0KAgICAgIDkz8AANwMAQaikB0KAgICAgIDkz8AANwMAQbCkB0KAgICAgIDkz8AANwMAQbikB0KAgICAgIDkz8AANwMAQcCkB0KAgICAgIDkz8AANwMAQcikB0KAgICAgIDkz8AANwMAQdCkB0KAgICAgIDkz8AANwMAQdikB0KAgICAgIDArMAANwMAQeCkB0LNmbPmzJmz+j83AwBB+KQHQoCAgICAgICGwAA3AwBB8KQHQubMmbPmzJn7PzcDAEGIpQdCs+bMmbPmzPk/NwMAQYClB0LmzJmz5syZ8z83AwBBmKUHQpqz5syZs+bsPzcDAEGQpQdCs+bMmbPmzPE/NwMAQQAhAEGopQdCgICAgICAwKzAADcDAEGgpQdCgICAgICAgOA/NwMAQbClB0KAgICAgICA+D83AwBB6KUHQo7o14/CgoDYPzcDAEHgpQdC5eygprLk2es/NwMAQdilB0Kdv4rHg97a8T83AwBB+KYHQpqz5syZs+bsPzcDAEHwpgdC9tHw+qi4vew/NwMAQYCnB0KAgICAgICAisAANwMAQYinB0KAgICAgICAgMAANwMAQZCnB0KAgICAgICAksAANwMAQZinB0KAgICAgICAmsAANwMAQaCnB0Kz5syZs+bMg8AANwMAQainB0KAgICAgICAg8AANwMAQbCnB0KAgICAgICA+D83AwBBuKcHQoCAgICAgID4PzcDAEHApwdCgICAgICAgPg/NwMAQcinB0KAgICAgICAmcAANwMAQdCnB0KAgICAgICAisAANwMAQdinB0KAgICAgICAisAANwMAQeCnB0KAgICAgICAisAANwMAQeinB0KAgICAgICAl8AANwMAQfCnB0KAgICAgICAmsAANwMAQfinB0KAgICAgICAksAANwMAQYCoB0KAgICAgJChl8EANwMAQYioB0KAgICAgJChl8EANwMAQZCoB0KAgICAgJChl8EANwMAQZioB0LI8LWjypfMkcQANwMAA0BBACEBA0AgAEGoAWxBoKgHaiABQQN0akKAgICAgIDArMAANwMAIAFBAWoiAUEVRw0ACyAAQQFqIgBBAkcNAAtB8KoHQrefq5nTtL32PzcDAEGAqwdCgICAgICApNXAADcDAEH4qgdCgICAgIDo3ZXBADcDAEGIqwdCgICAgPKLqPnBADcDAEHIqwdC0vD6qLi9lOQ/NwMAQcCrB0LD66Ph9dHw4j83AwBBuKsHQrPmzJmz5szpPzcDAEGwqwdC+v2p48vupNQ/NwMAQairB0L6/anjy+6kxD83AwBBoKsHQpqz5syZs+bcPzcDAEGYqwdCm970puKg4No/NwMAQZCrB0L6/anjy+6k3D83AwBBiKwHQrGQsOWhi9ndPzcDAEGArAdCz+/Pmt70puI/NwMAQfirB0K25/enja+64z83AwBB8KsHQvT708aX3cnYPzcDAEHoqwdCnImDgauO2sg/NwMAQeCrB0KF18fC66Ph5T83AwBB2KsHQuiituf3p43fPzcDAEHQqwdCyMLro+H10eA/NwMAQZCsB0KAgICAgOjdlcEANwMAQZisB0KNwLeBiZT+2D83AwBBoKwHQtLf/brgucbQPzcDAEGorAdCjo3At4GJlNY/NwMAQbCsB0LTrIbx2K7cvT83AwBBqK4HQgA3AwBBoK4HQuyj4fXR8PrgPzcDAEGwrgdCADcDAEHgrwdCADcDAEG4rgdC1MaX3cmYiPA/NwMAQeivB0IANwMAQQAhAEEAIQFB+KwHQuWhi9md35/tPzcDAEHwrAdCu76/6vjSm4PAADcDAEHorAdCADcDAEHgrAdCiq6PhdfHwus/NwMAQaCx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BhtqIgkgCSgCACAIazYCACAEIAVrIQQgACgCPCABQQhqIAEgBhsiASAHIAZrIgcgA0EMahAAEB1FDQALCyAEQX9HDQELIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhAgAgwBCyAAQQA2AhwgAEIANwMQIAAgACgCAEEgcjYCAEEAIAdBAkYNABogAiABKAIEawshBCADQSBqJAAgBAtBAQF/IwBBEGsiAyQAIAAoAjwgAacgAUIgiKcgAkH/AXEgA0EIahABEB0hACADKQMIIQEgA0EQaiQAQn8gASAAGwsQAEGWCkGjAUHQIygCABAiCwkAIAAoAjwQBAsyAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQDSAAIAAoAhQgAWo2AhQgAguTBQIGfgF/IAEgASgCAEEHakF4cSIBQRBqNgIAIAACfCABKQMAIQQgASkDCCEFIwBBIGsiASQAAkAgBUL///////////8AgyIDQoCAgICAgMCAPH0gA0KAgICAgIDA/8MAfVQEQCAFQgSGIARCPIiEIQMgBEL//////////w+DIgRCgYCAgICAgIAIWgRAIANCgYCAgICAgIDAAHwhAgwCCyADQoCAgICAgICAQH0hAiAEQoCAgICAgICACIVCAFINASACIANCAYN8IQIMAQsgBFAgA0KAgICAgIDA//8AVCADQoCAgICAgMD//wBRG0UEQCAFQgSGIARCPIiEQv////////8Dg0KAgICAgICA/P8AhCECDAELQoCAgICAgID4/wAhAiADQv///////7//wwBWDQBCACECIANCMIinIghBkfcASQ0AIAQhAiAFQv///////z+DQoCAgICAgMAAhCIDIQYCQCAIQYH3AGsiAEHAAHEEQCACIABBQGqthiEGQgAhAgwBCyAARQ0AIAYgAK0iB4YgAkHAACAAa62IhCEGIAIgB4YhAgsgASACNwMQIAEgBjcDGCABIQACQEGB+AAgCGsiCEHAAHEEQCADIAhBQGqtiCEEQgAhAwwBCyAIRQ0AIANBwAAgCGuthiAEIAitIgKIhCEEIAMgAoghAwsgACAENwMAIAAgAzcDCCABKQMIQgSGIAEpAwAiBEI8iIQhAiABKQMQIAEpAxiEQgBSrSAEQv//////////D4OEIgRCgYCAgICAgIAIWgRA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KwMAEAVBsLYMKwMAEAVB6LYMKwMAEAVB+LYMKwMAEAVBwLYMKwMAEAVB4LYMKwMAEAVB8LYMKwMAEAVBoLMMKwMAEAVB2LMMKwMAEAVB6LMMKwMAEAVBsLMMKwMAEAVB0LMMKwMAEAVB4LMMKwMAEAVB6KMMKwMAEAVBwPcNKwMAEAVByPcNKwMAEAVBqPcNKwMAEAVBsPcNKwMAEAVBuPcNKwMAEAVBoPcNKwMAEAVB0KUMKwMAEAVB2OsNKwMAEAVB4OsNKwMAEAVB6OsNKwMAEAVB+OsNKwMAEAVBiOwNKwMAEAVB0OsNKwMAEAVB8OsNKwMAEAVBgOwNKwMAEAVBgOsNKwMAEAVB+OYNKwMAEAVBgOcNKwMAEAVBiOcNKwMAEAVBmOcNKwMAEAVBqOcNKwMAEAVB8OYNKwMAEAVBkOcNKwMAEAVBoOcNKwMAEAVB6LkLKwMAEAVBuOcNKwMAEAVBwOcNKwMAEAVByOcNKwMAEAVB2OcNKwMAEAVB6OcNKwMAEAVBsOcNKwMAEAVB0OcNKwMAEAVB4OcNKwMAEAVBgOgNKwMAEAVB+OcNKwMAEAVB4NAMKwMAEAVBuKoNKwMAEAVB+KkNKwMAEAVB8KkNKwMAEAVB0KkNKwMAEAVBkLsNKwMAEAVBoKoNKwMAEAVBmKoNKwMAEAVBuMYNKwMAEAVB8MwMKwMAEAVBqNsHKwMAEAVB0K0MKwMAEAVBsMYNKwMAEAVBqMYNKwMAEAVBwKYNKwMAEAVB2KUNKwMAEAVBuKYNKwMAEAVBgMYNKwMAEAVBkP8LKwMAEAVB2MINKwMAEAVB0MINKwMAEAVByMINKwMAEAVBsMINKwMAEAVBoMINKwMAEAVBwMENKwMAEAVB6L4NKwMAEAVB4L4NKwMAEAVB2L4NKwMAEAVB0L4NKwMAEAVBoP8LKwMAEAVBkL0NKwMAEAVBiL0NKwMAEAVBgL0NKwMAEAVB+LwNKwMAEAVBsP8LKwMAEAVBuLwNKwMAEAVBiLwNKwMAEAVBgLwNKwMAEAVB8LsNKwMAEAVBoNsHKwMAEAVBwLANKwMAEAVBiJANKwMAEAVBkJANKwMAEAVBmJANKwMAEAVBqJANKwMAEAVBuJANKwMAEAVBgJANKwMAEAVBoJANKwMAEAVBsJANKwMAEAVB0I0NKwMAEAVB2KoNKwMAEAVB+NsH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bCICQdDnB2oiASABKwNQIAJB4KUMaiIBKwNIIAJBgPINaisDUKEgASsDUKEgBKKgOQNQQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdDnB2oiACAAKwNYIAJB4KUMaiIAKwNQIAJBgPINaisDWKEgACsDWKEgBKKgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwNgIAJB4KUMaiIBKwNYIAJBgPINaisDYKEgASsDYKEgBKKgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdDnB2oiACAAKwNoIAJB4KUMaiIAKwNgIAJBgPINaisDaKEgACsDaKEgBKKgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwNwIAJB4KUMaiIBKwNoIAJBgPINaisDcKEgASsDcKEgBKKgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdDnB2oiACAAKwN4IAJB4KUMaiIAKwNwIAJBgPINaisDeKEgACsDeKEgBKKgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwOAASACQeClDGoiASsDeCACQYDyDWorA4ABoSABKwOAAaEgBKKgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHQ5wdqIgAgACsDiAEgAkHgpQxqIgArA4ABIAJBgPINaisDiAGhIAArA4gBoSAEoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwOQASACQeClDGoiASsDiAEgAkGA8g1qKwOQAaEgASsDkAGhIASioDkDkAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB0OcHaiIAIAArA5gBIAJB4KUMaiIAKwOQASACQYDyDWorA5gBoSAAKwOYAaEgBKKgOQOYAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHQ5wdqIgEgASsDoAEgAkHgpQxqIgErA5gBIAJBgPINaisDoAGhIAErA6ABoSAEoqA5A6ABQQEhASAAIQJBACEAIAINAAtBkI8IQZCPCCsDAEGw1w0rAwAgBKKgOQMAQYCPCEGAjwgrAwAgBEGg1w0rAwCioDkDAEHojghB6I4I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AwAgA0HA1g0rAwCioDkDAEGw+QtBsPkLKwMAIANBgMQNKwMAQeiqDSsDAKGioDkDAEEBIQJBACEMA0AgDEGoAWwiC0HwmQxqIgogCisDACADIAtB0MsGaisDAJogC0GwwgxqKwMAoaKgOQMAIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfCZDGoiASABKwMIIAMgAkHQywZqIgErAwAgASsDCKEgAkGwwgxqKwMIoaKgOQMIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMQIAMgAkHQywZqIgArAwggACsDEKEgAkGwwgxqKwMQoaKgOQMQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwMYIAMgAkHQywZqIgErAxAgASsDGKEgAkGwwgxqKwMYoaKgOQMYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMgIAMgAkHQywZqIgArAxggACsDIKEgAkGwwgxqKwMgoaKgOQMgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwMoIAMgAkHQywZqIgErAyAgASsDKKEgAkGwwgxqKwMooaKgOQMoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMwIAMgAkHQywZqIgArAyggACsDMKEgAkGwwgxqKwMwoaKgOQMwQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwM4IAMgAkHQywZqIgErAzAgASsDOKEgAkGwwgxqKwM4oaKgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNAIAMgAkHQywZqIgArAzggACsDQKEgAkGwwgxqKwNAoaKgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNIIAMgAkHQywZqIgErA0AgASsDSKEgAkGwwgxqKwNIoaKgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNQIAMgAkHQywZqIgArA0ggACsDUKEgAkGwwgxqKwNQoaKgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNYIAMgAkHQywZqIgErA1AgASsDWKEgAkGwwgxqKwNYoaKgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNgIAMgAkHQywZqIgArA1ggACsDYKEgAkGwwgxqKwNgoaKgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNoIAMgAkHQywZqIgErA2AgASsDaKEgAkGwwgxqKwNooaKgOQNoQQEhASAAIQJBACEAIAINAAtBACEBQQAhDEGgpQcrAwAhBEEBIQBBASECA0AgDEGoAWwiC0HwmQxqIgogCisDcCALQdDLBmoiCisDaCAKKwNwoSALQbDCDGorA3ChIASioDkDcCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHwmQxqIgEgASsDeCACQdDLBmoiASsDcCABKwN4oSACQbDCDGorA3ihIASioDkDeEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmQxqIgAgACsDgAEgAkHQywZqIgArA3ggACsDgAGhIAJBsMIMaisDgAGhIASioDkDgAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJB8JkMaiIBIAErA4gBIAJB0MsGaiIBKwOAASABKwOIAaEgAkGwwgxqKwOIAaEgBKKgOQOIAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmQxqIgAgACsDkAEgAkHQywZqIgArA4gBIAArA5ABoSACQbDCDGorA5ABoSAEoqA5A5ABQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwOYASACQdDLBmoiASsDkAEgASsDmAGhIAJBsMIMaisDmAGhIASioDkDmAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8JkMaiIAIAArA6ABIAJB0MsGaiIAKwOYASAAKwOgAaEgAkGwwgxqKwOgAaEgBKKgOQOgAUEBIQAgASECQQAhASACDQALQfDsB0Hw7AcrAwAgBEQAAAAAAAAAAKIiA6A5AwBBmO4HQZjuBysDACADoDkDAEGA7QdBgO0HKwMAIAOgOQMAQYjtB0GI7QcrAwAgA6A5AwBBqO4HQajuBysDACADoDkDAEGw7gdBsO4HKwMAIAOgOQMAQQEhAkEAIQwDQCAMQagBbCILQfDsB2oiCiAKKwMgIAtBgNwNaisDICALQeDsDWorAyChIAtBgKsMaisDIKEgBKKgOQMgIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfDsB2oiASABKwMoIAJBgNwNaisDKCACQeDsDWorAyihIAJBgKsMaiIBKwMooSABKwMgoCAEoqA5AyhBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8OwHaiIAIAArAzAgAkGA3A1qKwMwIAJB4OwNaisDMKEgAkGAqwxqIgArAzChIAArAyigIASioDkDMEEBIQAgASECQQAhASACDQALQfjsB0H47AcrAwAgA6A5AwBBoO4HQaDuBysDACADoDkDAEEBIQJBACEMA0AgDEGoAWwiC0Hw7AdqIgogCisDOCALQYCrDGoiCisDMCALQeDsDWorAzihIAorAzihIASioDkDOCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDQCACQYCrDGoiASsDOCACQeDsDWorA0ChIAErA0ChIASioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDSCACQYCrDGoiACsDQCACQeDsDWorA0ihIAArA0ihIASioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDUCACQYCrDGoiASsDSCACQeDsDWorA1ChIAErA1ChIASioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDWCACQYCrDGoiACsDUCACQeDsDWorA1ihIAArA1ihIASioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDYCACQYCrDGoiASsDWCACQeDsDWorA2ChIAErA2ChIASioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDaCACQYCrDGoiACsDYCACQeDsDWorA2ihIAArA2ihIASioDkDaEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDcCACQYCrDGoiASsDaCACQeDsDWorA3ChIAErA3ChIASioDkDcEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw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",BA(Z)||(Z=H(Z));function MA(g){try{if(g==Z&&f)return new Uint8Array(f);var C=DA(g);if(C)return C;if(O)return O(g);throw"both async and sync fetching of the wasm failed"}catch(s){W(s)}}function nA(){if(!f&&(o||K)){if(typeof fetch=="function"&&!oA(Z))return fetch(Z,{credentials:"same-origin"}).then(function(g){if(!g.ok)throw"failed to load wasm binary file at \'"+Z+"\'";return g.arrayBuffer()}).catch(function(){return MA(Z)});if(P)return new Promise(function(g,C){P(Z,function(s){g(new Uint8Array(s))},C)})}return Promise.resolve().then(function(){return MA(Z)})}function tA(){var g={a:mA};function C(k,e){var j=k.exports;Q.asm=j,L=Q.asm.f,b(L.buffer),_=Q.asm.o,HA(Q.asm.g),NA()}aA();function s(k){C(k.instance)}function r(k){return nA().then(function(e){return WebAssembly.instantiate(e,g)}).then(function(e){return e}).then(k,function(e){n("failed to asynchronously prepare wasm: "+e),W(e)})}function h(){return!f&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(Z)&&!oA(Z)&&typeof fetch=="function"?fetch(Z,{credentials:"same-origin"}).then(function(k){var e=WebAssembly.instantiateStreaming(k,g);return e.then(s,function(j){return n("wasm streaming compile failed: "+j),n("falling back to ArrayBuffer instantiation"),r(s)})}):r(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(g,C);return z}catch(k){return n("Module.instantiateWasm callback failed with error: "+k),!1}return h().catch(w),{}}function wA(g){for(;g.length>0;){var C=g.shift();if(typeof C=="function"){C(Q);continue}var s=C.func;typeof s=="number"?C.arg===void 0?iA(s)():iA(s)(C.arg):s(C.arg===void 0?null:C.arg)}}function iA(g){return _.get(g)}function OA(g,C,s){q.copyWithin(g,C,C+s)}function uA(g){W("OOM")}function hA(g){q.length,uA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(g,C){var s=AA.buffers[g];C===0||C===10?((g===1?N:n)(U(s,0)),s.length=0):s.push(C)},varargs:void 0,get:function(){AA.varargs+=4;var g=y[AA.varargs-4>>2];return g},getStr:function(g){var C=l(g);return C},get64:function(g,C){return g}};function zA(g){return 0}function yA(g,C,s,r,h){}function jA(g,C,s,r){for(var h=0,z=0;z<s;z++){var k=y[C>>2],e=y[C+4>>2];C+=8;for(var j=0;j<e;j++)AA.printChar(g,q[k+j]);h+=e}return y[r>>2]=h,0}var fA=typeof atob=="function"?atob:function(g){var C="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",r,h,z,k,e,j,S,R=0;g=g.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do k=C.indexOf(g.charAt(R++)),e=C.indexOf(g.charAt(R++)),j=C.indexOf(g.charAt(R++)),S=C.indexOf(g.charAt(R++)),r=k<<2|e>>4,h=(e&15)<<4|j>>2,z=(j&3)<<6|S,s=s+String.fromCharCode(r),j!==64&&(s=s+String.fromCharCode(h)),S!==64&&(s=s+String.fromCharCode(z));while(R<g.length);return s};function FA(g){try{for(var C=fA(g),s=new Uint8Array(C.length),r=0;r<C.length;++r)s[r]=C.charCodeAt(r);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(g){if(BA(g))return FA(g.slice(EA.length))}var mA={c:OA,d:hA,e:zA,b:yA,a:jA};tA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},gA=Q.stackAlloc=function(){return(gA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=J;var QA;V=function g(){QA||CA(),QA||(V=g)};function CA(g){if(v>0||(X(),v>0))return;function C(){QA||(QA=!0,Q.calledRun=!0,!d&&(kA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),PA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),C()},1)):C()}if(Q.run=CA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return CA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
    for (const n of e) {
      const g = this.modelSpec.implVars.get(n);
      g && r.push(g);
    }
    const o = this.outputs.startTime, i = this.outputs.endTime, Q = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, i, Q);
    B = await this.modelRunner.runModel(this.inputs, B);
    const s = B.runTimeInMillis, a = /* @__PURE__ */ new Map();
    for (const n of e) {
      const g = this.modelSpec.implVars.get(n), E = B.getSeriesForVar(g.varId);
      E && a.set(n, datasetFromPoints(E.points));
    }
    return {
      datasetMap: a,
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
