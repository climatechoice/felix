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
    constructor(o, Q) {
      var i, B;
      typeof o == "string" && Q && Q._baseURL ? o = new URL(o, Q._baseURL) : typeof o == "string" && !isAbsoluteURL(o) && getBundleURLCached().match(/^file:\/\//i) && (o = new URL(o, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((i = Q?.CORSWorkaround) !== null && i !== void 0) || i) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`))), typeof o == "string" && isAbsoluteURL(o) && (!((B = Q?.CORSWorkaround) !== null && B !== void 0) || B) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`)), super(o, Q);
    }
  }
  class e extends A {
    constructor(o, Q) {
      const i = window.URL.createObjectURL(o);
      super(i, Q);
    }
    static fromText(o, Q) {
      const i = new window.Blob([o], { type: "text/javascript" });
      return new e(i, Q);
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
  let Q = o || null;
  return Q && Q.startsWith("file:") && (Q = fileURLToPath(Q)), Q ? path.join(path.dirname(Q), A) : A;
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
        const Q = e;
        super(Q, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(e, r) {
      const o = (Q) => {
        r({ data: Q });
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
        const w = B;
        super(new Function(w), [], { esm: !0 });
      }
      e.push(this), this.emitter = new EventEmitter(), this.onerror = (w) => this.emitter.emit("error", w), this.onmessage = (w) => this.emitter.emit("message", w);
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
    Promise.all(e.map((i) => i.terminate())).then(() => process.exit(0), () => process.exit(1)), e = [];
  };
  process.on("SIGINT", () => o()), process.on("SIGTERM", () => o());
  class Q extends r {
    constructor(B, s) {
      super(Buffer.from(B).toString("utf-8"), Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
    static fromText(B, s) {
      return new r(B, Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
  }
  return {
    blob: Q,
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
  var A = 1e3, e = A * 60, r = e * 60, o = r * 24, Q = o * 7, i = o * 365.25;
  ms = function(n, E) {
    E = E || {};
    var l = typeof n;
    if (l === "string" && n.length > 0)
      return B(n);
    if (l === "number" && isFinite(n))
      return E.long ? a(n) : s(n);
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
            return l * i;
          case "weeks":
          case "week":
          case "w":
            return l * Q;
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
  function a(n) {
    var E = Math.abs(n);
    return E >= o ? w(n, E, o, "day") : E >= r ? w(n, E, r, "hour") : E >= e ? w(n, E, e, "minute") : E >= A ? w(n, E, A, "second") : n + " ms";
  }
  function w(n, E, l, f) {
    var K = E >= l * 1.5;
    return Math.round(n / l) + " " + f + (K ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function A(e) {
    o.debug = o, o.default = o, o.coerce = w, o.disable = s, o.enable = i, o.enabled = a, o.humanize = requireMs(), o.destroy = n, Object.keys(e).forEach((E) => {
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
      let l, f = null, K, D;
      function g(...I) {
        if (!g.enabled)
          return;
        const t = g, C = Number(/* @__PURE__ */ new Date()), c = C - (l || C);
        t.diff = c, t.prev = l, t.curr = C, l = C, I[0] = o.coerce(I[0]), typeof I[0] != "string" && I.unshift("%O");
        let d = 0;
        I[0] = I[0].replace(/%([a-zA-Z%])/g, (m, p) => {
          if (m === "%%")
            return "%";
          d++;
          const O = o.formatters[p];
          if (typeof O == "function") {
            const j = I[d];
            m = O.call(t, j), I.splice(d, 1), d--;
          }
          return m;
        }), o.formatArgs.call(t, I), (t.log || o.log).apply(t, I);
      }
      return g.namespace = E, g.useColors = o.useColors(), g.color = o.selectColor(E), g.extend = Q, g.destroy = o.destroy, Object.defineProperty(g, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (K !== o.namespaces && (K = o.namespaces, D = o.enabled(E)), D),
        set: (I) => {
          f = I;
        }
      }), typeof o.init == "function" && o.init(g), g;
    }
    function Q(E, l) {
      const f = o(this.namespace + (typeof l > "u" ? ":" : l) + E);
      return f.log = this.log, f;
    }
    function i(E) {
      o.save(E), o.namespaces = E, o.names = [], o.skips = [];
      const l = (typeof E == "string" ? E : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? o.skips.push(f.slice(1)) : o.names.push(f);
    }
    function B(E, l) {
      let f = 0, K = 0, D = -1, g = 0;
      for (; f < E.length; )
        if (K < l.length && (l[K] === E[f] || l[K] === "*"))
          l[K] === "*" ? (D = K, g = f, K++) : (f++, K++);
        else if (D !== -1)
          K = D + 1, g++, f = g;
        else
          return !1;
      for (; K < l.length && l[K] === "*"; )
        K++;
      return K === l.length;
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
    function w(E) {
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
    e.formatArgs = o, e.save = Q, e.load = i, e.useColors = r, e.storage = B(), e.destroy = /* @__PURE__ */ (() => {
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
      const w = "color: " + this.color;
      a.splice(1, 0, w, "color: inherit");
      let n = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (n++, l === "%c" && (E = n));
      }), a.splice(E, 0, w);
    }
    e.log = console.debug || console.log || (() => {
    });
    function Q(a) {
      try {
        a ? e.storage.setItem("debug", a) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function i() {
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
      } catch (w) {
        return "[UnexpectedJSONParseError]: " + w.message;
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
    const Q = o ? getMethod(o, e) : void 0;
    switch (e) {
      case "next":
        Q && Q.call(o, r);
        break;
      case "error":
        if (closeSubscription(A), Q)
          Q.call(o, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(A), Q && Q.call(o);
        break;
    }
  } catch (Q) {
    hostReportError(Q);
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
    } catch (Q) {
      o.error(Q);
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
    for (const Q of [e, ...r])
      o = Q(o);
    return o;
  }
  tap(e, r, o) {
    const Q = typeof e != "object" || e === null ? {
      next: e,
      error: r,
      complete: o
    } : e;
    return new Observable((i) => this.subscribe({
      next(B) {
        Q.next && Q.next(B), i.next(B);
      },
      error(B) {
        Q.error && Q.error(B), i.error(B);
      },
      complete() {
        Q.complete && Q.complete(), i.complete();
      },
      start(B) {
        Q.start && Q.start(B);
      }
    }));
  }
  forEach(e) {
    return new Promise((r, o) => {
      if (typeof e != "function") {
        o(new TypeError(e + " is not a function"));
        return;
      }
      function Q() {
        i.unsubscribe(), r(void 0);
      }
      const i = this.subscribe({
        next(B) {
          try {
            e(B, Q);
          } catch (s) {
            o(s), i.unsubscribe();
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
      next(Q) {
        let i = Q;
        try {
          i = e(Q);
        } catch (B) {
          return o.error(B);
        }
        o.next(i);
      },
      error(Q) {
        o.error(Q);
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
      next(Q) {
        try {
          if (!e(Q))
            return;
        } catch (i) {
          return o.error(i);
        }
        o.next(Q);
      },
      error(Q) {
        o.error(Q);
      },
      complete() {
        o.complete();
      }
    }));
  }
  reduce(e, r) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const o = getSpecies(this), Q = arguments.length > 1;
    let i = !1, B = r;
    return new o((s) => this.subscribe({
      next(a) {
        const w = !i;
        if (i = !0, !w || Q)
          try {
            B = e(B, a);
          } catch (n) {
            return s.error(n);
          }
        else
          B = a;
      },
      error(a) {
        s.error(a);
      },
      complete() {
        if (!i && !Q)
          return s.error(new TypeError("Cannot reduce an empty sequence"));
        s.next(B), s.complete();
      }
    }));
  }
  concat(...e) {
    const r = getSpecies(this);
    return new r((o) => {
      let Q, i = 0;
      function B(s) {
        Q = s.subscribe({
          next(a) {
            o.next(a);
          },
          error(a) {
            o.error(a);
          },
          complete() {
            i === e.length ? (Q = void 0, o.complete()) : B(r.from(e[i++]));
          }
        });
      }
      return B(this), () => {
        Q && (Q.unsubscribe(), Q = void 0);
      };
    });
  }
  flatMap(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((o) => {
      const Q = [], i = this.subscribe({
        next(s) {
          let a;
          if (e)
            try {
              a = e(s);
            } catch (n) {
              return o.error(n);
            }
          else
            a = s;
          const w = r.from(a).subscribe({
            next(n) {
              o.next(n);
            },
            error(n) {
              o.error(n);
            },
            complete() {
              const n = Q.indexOf(w);
              n >= 0 && Q.splice(n, 1), B();
            }
          });
          Q.push(w);
        },
        error(s) {
          o.error(s);
        },
        complete() {
          B();
        }
      });
      function B() {
        i.closed && Q.length === 0 && o.complete();
      }
      return () => {
        Q.forEach((s) => s.unsubscribe()), i.unsubscribe();
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
      const Q = o.call(e);
      if (Object(Q) !== Q)
        throw new TypeError(Q + " is not an object");
      return isObservable(Q) && Q.constructor === r ? Q : new r((i) => Q.subscribe(i));
    }
    if (hasSymbol("iterator")) {
      const Q = getMethod(e, SymbolIterator);
      if (Q)
        return new r((i) => {
          enqueue(() => {
            if (!i.closed) {
              for (const B of Q.call(e))
                if (i.next(B), i.closed)
                  return;
              i.complete();
            }
          });
        });
    }
    if (Array.isArray(e))
      return new r((Q) => {
        enqueue(() => {
          if (!Q.closed) {
            for (const i of e)
              if (Q.next(i), Q.closed)
                return;
            Q.complete();
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
          for (const Q of e)
            if (o.next(Q), o.closed)
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
  return new Observable((Q) => {
    r || (r = A.subscribe(e));
    const i = e.subscribe(Q);
    return o++, () => {
      o--, i.unsubscribe(), o === 0 && (unsubscribe(r), r = void 0);
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
  return [new Promise((i) => {
    A ? i(e) : r = i;
  }), (i) => {
    A = !0, e = i, r(e);
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
      const o = this, Q = Object.assign(Object.assign({}, r), {
        complete() {
          r.complete(), o.onCompletion();
        },
        error(i) {
          r.error(i), o.onError(i);
        },
        next(i) {
          r.next(i), o.onNext(i);
        }
      });
      try {
        return this.initHasRun = !0, e(Q);
      } catch (i) {
        Q.error(i);
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
    const o = e || returnInput, Q = r || fail;
    let i = !1;
    return new Promise((B, s) => {
      const a = (n) => {
        if (!i) {
          i = !0;
          try {
            B(Q(n));
          } catch (E) {
            s(E);
          }
        }
      }, w = (n) => {
        try {
          B(o(n));
        } catch (E) {
          a(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: a }), this.state === "fulfilled")
        return B(o(this.firstValue));
      if (this.state === "rejected")
        return i = !0, B(Q(this.rejection));
      this.fulfillmentCallbacks.push(w), this.rejectionCallbacks.push(a);
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
      const o = (i) => {
        r.next(i), r.complete();
      }, Q = (i) => {
        r.error(i);
      };
      e.then(o, Q);
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
    const Q = ((i) => {
      if (debugMessages$1("Message from worker:", i.data), !(!i.data || i.data.uid !== e)) {
        if (isJobStartMessage(i.data))
          o = i.data.resultType;
        else if (isJobResultMessage(i.data))
          o === "promise" ? (typeof i.data.payload < "u" && r.next(deserialize(i.data.payload)), r.complete(), A.removeEventListener("message", Q)) : (i.data.payload && r.next(deserialize(i.data.payload)), i.data.complete && (r.complete(), A.removeEventListener("message", Q)));
        else if (isJobErrorMessage(i.data)) {
          const B = deserialize(i.data.error);
          r.error(B), A.removeEventListener("message", Q);
        }
      }
    });
    return A.addEventListener("message", Q), () => {
      if (o === "observable" || !o) {
        const i = {
          type: MasterMessageType.cancel,
          uid: e
        };
        A.postMessage(i);
      }
      A.removeEventListener("message", Q);
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
    const o = nextJobUID++, { args: Q, transferables: i } = prepareArguments(r), B = {
      type: MasterMessageType.run,
      uid: o,
      method: e,
      args: Q
    };
    debugMessages$1("Sending command to run function to worker:", B);
    try {
      A.postMessage(B, i);
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
  function Q(i) {
    return i instanceof r ? i : new r(function(B) {
      B(i);
    });
  }
  return new (r || (r = Promise))(function(i, B) {
    function s(n) {
      try {
        w(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    w((o = o.apply(A, e || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (A) => A && A.type === "init", isUncaughtErrorMessage = (A) => A && A.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(A, e, r) {
  return __awaiter$2(this, void 0, void 0, function* () {
    let o;
    const Q = new Promise((B, s) => {
      o = setTimeout(() => s(Error(r)), e);
    }), i = yield Promise.race([
      A,
      Q
    ]);
    return clearTimeout(o), i;
  });
}
function receiveInitMessage(A) {
  return new Promise((e, r) => {
    const o = ((Q) => {
      debugMessages("Message from worker before finishing initialization:", Q.data), isInitMessage(Q.data) ? (A.removeEventListener("message", o), e(Q.data)) : isUncaughtErrorMessage(Q.data) && (A.removeEventListener("message", o), r(deserialize(Q.data.error)));
    });
    A.addEventListener("message", o);
  });
}
function createEventObservable(A, e) {
  return new Observable((r) => {
    const o = ((i) => {
      const B = {
        type: WorkerEventType.message,
        data: i.data
      };
      r.next(B);
    }), Q = ((i) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", i);
      const B = {
        type: WorkerEventType.internalError,
        error: Error(i.reason)
      };
      r.next(B);
    });
    A.addEventListener("message", o), A.addEventListener("unhandledrejection", Q), e.then(() => {
      const i = {
        type: WorkerEventType.termination
      };
      A.removeEventListener("message", o), A.removeEventListener("unhandledrejection", Q), r.next(i), r.complete();
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
  const Q = r.filter((i) => i.type === WorkerEventType.internalError).map((i) => i.error);
  return Object.assign(A, {
    [$errors]: Q,
    [$events]: r,
    [$terminate]: o,
    [$worker]: e
  });
}
function spawn(A, e) {
  return __awaiter$2(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, Q = (yield withTimeout(receiveInitMessage(A), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: i, terminate: B } = createTerminator(A), s = createEventObservable(A, i);
    if (Q.type === "function") {
      const a = createProxyFunction(A);
      return setPrivateThreadProps(a, A, s, B);
    } else if (Q.type === "module") {
      const a = createProxyModule(A, Q.methods);
      return setPrivateThreadProps(a, A, s, B);
    } else {
      const a = Q.type;
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
  const r = (Q) => {
    e(Q.data);
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
    messageHandlers.forEach((Q) => Q(o.data));
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
  const o = (i) => {
    e(i);
  }, Q = () => {
    assertMessagePort(r).off("message", o);
  };
  return assertMessagePort(r).on("message", o), Q;
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
      this.value = e, this.match = function(o, Q) {
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
      this.error = e, this.match = function(o, Q) {
        return Q(r.error);
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
  function Q(i) {
    return i instanceof r ? i : new r(function(B) {
      B(i);
    });
  }
  return new (r || (r = Promise))(function(i, B) {
    function s(n) {
      try {
        w(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    w((o = o.apply(A, [])).next());
  });
}
function __generator$1(A, e) {
  var r = { label: 0, sent: function() {
    if (i[0] & 1) throw i[1];
    return i[1];
  }, trys: [], ops: [] }, o, Q, i, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, Q && (i = w[0] & 2 ? Q.return : w[0] ? Q.throw || ((i = Q.return) && i.call(Q), 0) : Q.next) && !(i = i.call(Q, w[1])).done) return i;
      switch (Q = 0, i && (w = [w[0] & 2, i.value]), w[0]) {
        case 0:
        case 1:
          i = w;
          break;
        case 4:
          return r.label++, { value: w[1], done: !1 };
        case 5:
          r.label++, Q = w[1], w = [0];
          continue;
        case 7:
          w = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (i = r.trys, !(i = i.length > 0 && i[i.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!i || w[1] > i[0] && w[1] < i[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < i[1]) {
            r.label = i[1], i = w;
            break;
          }
          if (i && r.label < i[2]) {
            r.label = i[2], r.ops.push(w);
            break;
          }
          i[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], Q = 0;
    } finally {
      o = i = 0;
    }
    if (w[0] & 5) throw w[1];
    return { value: w[0] ? w[1] : void 0, done: !0 };
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
      var o = e.then(function(i) {
        return new Ok$1(i);
      });
      if (r)
        o = o.catch(function(i) {
          return new Err$1(r(i));
        });
      else {
        var Q = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(Q);
      }
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var Q;
          return __generator$1(this, function(i) {
            switch (i.label) {
              case 0:
                return o.isErr() ? [2, new Err$1(o.error)] : (Q = Ok$1.bind, [4, e(o.value)]);
              case 1:
                return [2, new (Q.apply(Ok$1, [void 0, i.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var Q;
          return __generator$1(this, function(i) {
            switch (i.label) {
              case 0:
                return o.isOk() ? [2, new Ok$1(o.value)] : (Q = Err$1.bind, [4, e(o.error)]);
              case 1:
                return [2, new (Q.apply(Err$1, [void 0, i.sent()]))()];
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
  const Q = {}, i = () => o, B = (a) => {
    var w;
    a !== o && (o = a, (w = Q.onSet) == null || w.call(Q));
  };
  return { varId: A, get: i, set: B, reset: () => {
    B(e);
  }, callbacks: Q };
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
    for (let Q = 0; Q < A.length; Q++) {
      const i = new Array(this.seriesLength);
      for (let s = 0; s < this.seriesLength; s++)
        i[s] = { x: e + s * o, y: 0 };
      const B = A[Q];
      this.varSeries[Q] = new Series(B, i);
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
  const o = r.varIds.length, Q = r.seriesLength;
  if (e < Q || A.length < o * Q)
    return err$1("invalid-point-count");
  for (let i = 0; i < o; i++) {
    const B = r.varSeries[i];
    let s = e * i;
    for (let a = 0; a < Q; a++)
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
    const Q = ((e = o.subscriptIndices) == null ? void 0 : e.length) || 0;
    r += Q;
  }
  return r;
}
function encodeVarIndices(A, e) {
  let r = 0;
  e[r++] = A.length;
  for (const o of A) {
    e[r++] = o.varIndex;
    const Q = o.subscriptIndices, i = Q?.length || 0;
    e[r++] = i;
    for (let B = 0; B < i; B++)
      e[r++] = Q[B];
  }
}
function getEncodedLookupBufferLengths(A) {
  var e, r;
  let o = 1, Q = 0;
  for (const i of A) {
    const B = i.varRef.varSpec;
    if (B === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    o += 2;
    const s = ((e = B.subscriptIndices) == null ? void 0 : e.length) || 0;
    o += s, o += 2, Q += ((r = i.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: o,
    lookupsLength: Q
  };
}
function encodeLookups(A, e, r) {
  let o = 0;
  e[o++] = A.length;
  let Q = 0;
  for (const i of A) {
    const B = i.varRef.varSpec;
    e[o++] = B.varIndex;
    const s = B.subscriptIndices, a = s?.length || 0;
    e[o++] = a;
    for (let w = 0; w < a; w++)
      e[o++] = s[w];
    i.points !== void 0 ? (e[o++] = Q, e[o++] = i.points.length, r?.set(i.points, Q), Q += i.points.length) : (e[o++] = -1, e[o++] = 0);
  }
}
function decodeLookups(A, e) {
  const r = [];
  let o = 0;
  const Q = A[o++];
  for (let i = 0; i < Q; i++) {
    const B = A[o++], s = A[o++], a = s > 0 ? Array(s) : void 0;
    for (let f = 0; f < s; f++)
      a[f] = A[o++];
    const w = A[o++], n = A[o++], E = {
      varIndex: B,
      subscriptIndices: a
    };
    let l;
    w >= 0 ? e ? l = e.slice(w, w + n) : l = new Float64Array(0) : l = void 0, r.push({
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
    for (const Q of A.dimensions) {
      const i = Q.id, B = [];
      for (let s = 0; s < Q.subIds.length; s++)
        B.push({
          id: Q.subIds[s],
          index: s
        });
      e.set(i, {
        id: i,
        subscripts: B
      });
    }
    function r(Q) {
      const i = e.get(Q);
      if (i === void 0)
        throw new Error(`No dimension info found for id=${Q}`);
      return i;
    }
    const o = /* @__PURE__ */ new Set();
    for (const Q of A.variables) {
      const i = varIdWithoutSubscripts(Q.id);
      if (!o.has(i)) {
        const s = (Q.dimIds || []).map(r);
        if (s.length > 0) {
          const a = [];
          for (const n of s)
            a.push(n.subscripts);
          const w = cartesianProductOf(a);
          for (const n of w) {
            const E = n.map((K) => K.id).join(","), l = n.map((K) => K.index), f = `${i}[${E}]`;
            this.varSpecs.set(f, {
              varIndex: Q.index,
              subscriptIndices: l
            });
          }
        } else
          this.varSpecs.set(i, {
            varIndex: Q.index
          });
        o.add(i);
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
    for (const Q of e) {
      const i = this.varSpecs.get(Q);
      i !== void 0 ? r.push(i) : console.warn(`WARNING: No output var spec found for id=${Q}`);
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
    (e, r) => e.map((o) => r.map((Q) => o.concat([Q]))).reduce((o, Q) => o.concat(Q), []),
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
    const o = e[2].split(",").map((Q) => sdeVarIdForVensimName(Q));
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
    const o = A.length, Q = e.varIds.length * e.seriesLength;
    let i;
    const B = e.varSpecs;
    B !== void 0 && B.length > 0 ? i = getEncodedVarIndicesLength(B) : i = 0;
    let s, a;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const m of r.lookups)
        resolveVarRef(this.listing, m.varRef, "lookup");
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, a = M.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let w = 0;
    function n(M, m) {
      const p = w, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, j = Math.round(m * O), z = Math.ceil(j / 8) * 8;
      return w += z, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), K = n("float64", Q), D = n("int32", i), g = n("float64", s), I = n("int32", a), t = w;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const C = this.header.view;
    let c = 0;
    C[c++] = l, C[c++] = extrasLengthInElements, C[c++] = f, C[c++] = o, C[c++] = K, C[c++] = Q, C[c++] = D, C[c++] = i, C[c++] = g, C[c++] = s, C[c++] = I, C[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, K, Q), this.outputIndices.update(this.encoded, D, i), this.lookups.update(this.encoded, g, s), this.lookupIndices.update(this.encoded, I, a);
    const d = this.inputs.view;
    for (let M = 0; M < A.length; M++) {
      const m = A[M];
      typeof m == "number" ? d[M] = m : d[M] = m.get();
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
    let Q = 0;
    const i = o[Q++], B = o[Q++], s = o[Q++], a = o[Q++], w = o[Q++], n = o[Q++], E = o[Q++], l = o[Q++], f = o[Q++], K = o[Q++], D = o[Q++], g = o[Q++], I = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, C = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = K * Float64Array.BYTES_PER_ELEMENT, M = g * Int32Array.BYTES_PER_ELEMENT, m = e + I + t + C + c + d + M;
    if (A.byteLength < m)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, i, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, w, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, K), this.lookupIndices.update(this.encoded, D, g);
  }
};
async function spawnAsyncModelRunner(A) {
  return A.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(A.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(A.source));
}
async function spawnAsyncModelRunnerWithWorker(A) {
  const e = await spawn(A), r = await e.initModel(), o = r.modelListing ? new ModelListing(r.modelListing) : void 0, Q = new BufferedRunModelParams(o);
  let i = !1, B = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (s, a, w) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (i)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      i = !0, Q.updateFromParams(s, a, w);
      let n;
      try {
        n = await e.runModel(Transfer(Q.getEncodedBuffer()));
      } finally {
        i = !1;
      }
      return Q.updateFromEncodedBuffer(n), Q.finalizeOutputs(a), a;
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
        return (t = this._str) !== null && t !== void 0 ? t : this._str = this._items.reduce((C, c) => `${C}${c}`, "");
      }
      get names() {
        var t;
        return (t = this._names) !== null && t !== void 0 ? t : this._names = this._items.reduce((C, c) => (c instanceof r && (C[c.str] = (C[c.str] || 0) + 1), C), {});
      }
    }
    A._Code = o, A.nil = new o("");
    function Q(I, ...t) {
      const C = [I[0]];
      let c = 0;
      for (; c < t.length; )
        s(C, t[c]), C.push(I[++c]);
      return new o(C);
    }
    A._ = Q;
    const i = new o("+");
    function B(I, ...t) {
      const C = [f(I[0])];
      let c = 0;
      for (; c < t.length; )
        C.push(i), s(C, t[c]), C.push(i, f(I[++c]));
      return a(C), new o(C);
    }
    A.str = B;
    function s(I, t) {
      t instanceof o ? I.push(...t._items) : t instanceof r ? I.push(t) : I.push(E(t));
    }
    A.addCodeArg = s;
    function a(I) {
      let t = 1;
      for (; t < I.length - 1; ) {
        if (I[t] === i) {
          const C = w(I[t - 1], I[t + 1]);
          if (C !== void 0) {
            I.splice(t - 1, 3, C);
            continue;
          }
          I[t++] = "+";
        }
        t++;
      }
    }
    function w(I, t) {
      if (t === '""')
        return I;
      if (I === '""')
        return t;
      if (typeof I == "string")
        return t instanceof r || I[I.length - 1] !== '"' ? void 0 : typeof t != "string" ? `${I.slice(0, -1)}${t}"` : t[0] === '"' ? I.slice(0, -1) + t.slice(1) : void 0;
      if (typeof t == "string" && t[0] === '"' && !(I instanceof r))
        return `"${I}${t.slice(1)}`;
    }
    function n(I, t) {
      return t.emptyStr() ? I : I.emptyStr() ? t : B`${I}${t}`;
    }
    A.strConcat = n;
    function E(I) {
      return typeof I == "number" || typeof I == "boolean" || I === null ? I : f(Array.isArray(I) ? I.join(",") : I);
    }
    function l(I) {
      return new o(f(I));
    }
    A.stringify = l;
    function f(I) {
      return JSON.stringify(I).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    A.safeStringify = f;
    function K(I) {
      return typeof I == "string" && A.IDENTIFIER.test(I) ? new o(`.${I}`) : Q`[${I}]`;
    }
    A.getProperty = K;
    function D(I) {
      if (typeof I == "string" && A.IDENTIFIER.test(I))
        return new o(`${I}`);
      throw new Error(`CodeGen: invalid export name: ${I}, use explicit $id name mapping`);
    }
    A.getEsmExportName = D;
    function g(I) {
      return new o(I.toString());
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
      constructor(w) {
        super(`CodeGen: "code" for ${w} not defined`), this.value = w.value;
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
    class Q {
      constructor({ prefixes: w, parent: n } = {}) {
        this._names = {}, this._prefixes = w, this._parent = n;
      }
      toName(w) {
        return w instanceof e.Name ? w : this.name(w);
      }
      name(w) {
        return new e.Name(this._newName(w));
      }
      _newName(w) {
        const n = this._names[w] || this._nameGroup(w);
        return `${w}${n.index++}`;
      }
      _nameGroup(w) {
        var n, E;
        if (!((E = (n = this._parent) === null || n === void 0 ? void 0 : n._prefixes) === null || E === void 0) && E.has(w) || this._prefixes && !this._prefixes.has(w))
          throw new Error(`CodeGen: prefix "${w}" is not allowed in this scope`);
        return this._names[w] = { prefix: w, index: 0 };
      }
    }
    A.Scope = Q;
    class i extends e.Name {
      constructor(w, n) {
        super(n), this.prefix = w;
      }
      setValue(w, { property: n, itemIndex: E }) {
        this.value = w, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = i;
    const B = (0, e._)`\n`;
    class s extends Q {
      constructor(w) {
        super(w), this._values = {}, this._scope = w.scope, this.opts = { ...w, _n: w.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(w) {
        return new i(w, this._newName(w));
      }
      value(w, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(w), { prefix: f } = l, K = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let D = this._values[f];
        if (D) {
          const t = D.get(K);
          if (t)
            return t;
        } else
          D = this._values[f] = /* @__PURE__ */ new Map();
        D.set(K, l);
        const g = this._scope[f] || (this._scope[f] = []), I = g.length;
        return g[I] = n.ref, l.setValue(n, { property: f, itemIndex: I }), l;
      }
      getValue(w, n) {
        const E = this._values[w];
        if (E)
          return E.get(n);
      }
      scopeRefs(w, n = this._values) {
        return this._reduceValues(n, (E) => {
          if (E.scopePath === void 0)
            throw new Error(`CodeGen: name "${E}" has no value`);
          return (0, e._)`${w}${E.scopePath}`;
        });
      }
      scopeCode(w = this._values, n, E) {
        return this._reduceValues(w, (l) => {
          if (l.value === void 0)
            throw new Error(`CodeGen: name "${l}" has no value`);
          return l.value.code;
        }, n, E);
      }
      _reduceValues(w, n, E = {}, l) {
        let f = e.nil;
        for (const K in w) {
          const D = w[K];
          if (!D)
            continue;
          const g = E[K] = E[K] || /* @__PURE__ */ new Map();
          D.forEach((I) => {
            if (g.has(I))
              return;
            g.set(I, o.Started);
            let t = n(I);
            if (t) {
              const C = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${C} ${I} = ${t};${this.opts._n}`;
            } else if (t = l?.(I))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(I);
            g.set(I, o.Completed);
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
    var Q = requireScope();
    Object.defineProperty(A, "Scope", { enumerable: !0, get: function() {
      return Q.Scope;
    } }), Object.defineProperty(A, "ValueScope", { enumerable: !0, get: function() {
      return Q.ValueScope;
    } }), Object.defineProperty(A, "ValueScopeName", { enumerable: !0, get: function() {
      return Q.ValueScopeName;
    } }), Object.defineProperty(A, "varKinds", { enumerable: !0, get: function() {
      return Q.varKinds;
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
    class i {
      optimizeNodes() {
        return this;
      }
      optimizeNames(u, h) {
        return this;
      }
    }
    class B extends i {
      constructor(u, h, y) {
        super(), this.varKind = u, this.name = h, this.rhs = y;
      }
      render({ es5: u, _n: h }) {
        const y = u ? r.varKinds.var : this.varKind, b = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${y} ${this.name}${b};` + h;
      }
      optimizeNames(u, h) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = J(this.rhs, u, h)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends i {
      constructor(u, h, y) {
        super(), this.lhs = u, this.rhs = h, this.sideEffects = y;
      }
      render({ _n: u }) {
        return `${this.lhs} = ${this.rhs};` + u;
      }
      optimizeNames(u, h) {
        if (!(this.lhs instanceof e.Name && !u[this.lhs.str] && !this.sideEffects))
          return this.rhs = J(this.rhs, u, h), this;
      }
      get names() {
        const u = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return L(u, this.rhs);
      }
    }
    class a extends s {
      constructor(u, h, y, b) {
        super(u, y, b), this.op = h;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class w extends i {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `${this.label}:` + u;
      }
    }
    class n extends i {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `break${this.label ? ` ${this.label}` : ""};` + u;
      }
    }
    class E extends i {
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
    class l extends i {
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
        return this.code = J(this.code, u, h), this;
      }
      get names() {
        return this.code instanceof e._CodeOrName ? this.code.names : {};
      }
    }
    class f extends i {
      constructor(u = []) {
        super(), this.nodes = u;
      }
      render(u) {
        return this.nodes.reduce((h, y) => h + y.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let h = u.length;
        for (; h--; ) {
          const y = u[h].optimizeNodes();
          Array.isArray(y) ? u.splice(h, 1, ...y) : y ? u[h] = y : u.splice(h, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, h) {
        const { nodes: y } = this;
        let b = y.length;
        for (; b--; ) {
          const R = y[b];
          R.optimizeNames(u, h) || (T(u, R.names), y.splice(b, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, h) => U(u, h.names), {});
      }
    }
    class K extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class D extends f {
    }
    class g extends K {
    }
    g.kind = "else";
    class I extends K {
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
          const y = h.optimizeNodes();
          h = this.else = Array.isArray(y) ? new g(y) : y;
        }
        if (h)
          return u === !1 ? h instanceof I ? h : h.nodes : this.nodes.length ? this : new I(rA(u), h instanceof I ? [h] : h.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, h) {
        var y;
        if (this.else = (y = this.else) === null || y === void 0 ? void 0 : y.optimizeNames(u, h), !!(super.optimizeNames(u, h) || this.else))
          return this.condition = J(this.condition, u, h), this;
      }
      get names() {
        const u = super.names;
        return L(u, this.condition), this.else && U(u, this.else.names), u;
      }
    }
    I.kind = "if";
    class t extends K {
    }
    t.kind = "for";
    class C extends t {
      constructor(u) {
        super(), this.iteration = u;
      }
      render(u) {
        return `for(${this.iteration})` + super.render(u);
      }
      optimizeNames(u, h) {
        if (super.optimizeNames(u, h))
          return this.iteration = J(this.iteration, u, h), this;
      }
      get names() {
        return U(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, h, y, b) {
        super(), this.varKind = u, this.name = h, this.from = y, this.to = b;
      }
      render(u) {
        const h = u.es5 ? r.varKinds.var : this.varKind, { name: y, from: b, to: R } = this;
        return `for(${h} ${y}=${b}; ${y}<${R}; ${y}++)` + super.render(u);
      }
      get names() {
        const u = L(super.names, this.from);
        return L(u, this.to);
      }
    }
    class d extends t {
      constructor(u, h, y, b) {
        super(), this.loop = u, this.varKind = h, this.name = y, this.iterable = b;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, h) {
        if (super.optimizeNames(u, h))
          return this.iterable = J(this.iterable, u, h), this;
      }
      get names() {
        return U(super.names, this.iterable.names);
      }
    }
    class M extends K {
      constructor(u, h, y) {
        super(), this.name = u, this.args = h, this.async = y;
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
    class p extends K {
      render(u) {
        let h = "try" + super.render(u);
        return this.catch && (h += this.catch.render(u)), this.finally && (h += this.finally.render(u)), h;
      }
      optimizeNodes() {
        var u, h;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (h = this.finally) === null || h === void 0 || h.optimizeNodes(), this;
      }
      optimizeNames(u, h) {
        var y, b;
        return super.optimizeNames(u, h), (y = this.catch) === null || y === void 0 || y.optimizeNames(u, h), (b = this.finally) === null || b === void 0 || b.optimizeNames(u, h), this;
      }
      get names() {
        const u = super.names;
        return this.catch && U(u, this.catch.names), this.finally && U(u, this.finally.names), u;
      }
    }
    class O extends K {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    O.kind = "catch";
    class j extends K {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    j.kind = "finally";
    class z {
      constructor(u, h = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...h, _n: h.lines ? `
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
      scopeValue(u, h) {
        const y = this._extScope.value(u, h);
        return (this._values[y.prefix] || (this._values[y.prefix] = /* @__PURE__ */ new Set())).add(y), y;
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
      _def(u, h, y, b) {
        const R = this._scope.toName(h);
        return y !== void 0 && b && (this._constants[R.str] = y), this._leafNode(new B(u, R, y)), R;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, h, y) {
        return this._def(r.varKinds.const, u, h, y);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, h, y) {
        return this._def(r.varKinds.let, u, h, y);
      }
      // `var` declaration with optional assignment
      var(u, h, y) {
        return this._def(r.varKinds.var, u, h, y);
      }
      // assignment code
      assign(u, h, y) {
        return this._leafNode(new s(u, h, y));
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
        for (const [y, b] of u)
          h.length > 1 && h.push(","), h.push(y), (y !== b || this.opts.es5) && (h.push(":"), (0, e.addCodeArg)(h, b));
        return h.push("}"), new e._Code(h);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, h, y) {
        if (this._blockNode(new I(u)), h && y)
          this.code(h).else().code(y).endIf();
        else if (h)
          this.code(h).endIf();
        else if (y)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(u) {
        return this._elseNode(new I(u));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new g());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(I, g);
      }
      _for(u, h) {
        return this._blockNode(u), h && this.code(h).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, h) {
        return this._for(new C(u), h);
      }
      // `for` statement for a range of values
      forRange(u, h, y, b, R = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const Y = this._scope.toName(u);
        return this._for(new c(R, Y, h, y), () => b(Y));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, h, y, b = r.varKinds.const) {
        const R = this._scope.toName(u);
        if (this.opts.es5) {
          const Y = h instanceof e.Name ? h : this.var("_arr", h);
          return this.forRange("_i", 0, (0, e._)`${Y}.length`, (Z) => {
            this.var(R, (0, e._)`${Y}[${Z}]`), y(R);
          });
        }
        return this._for(new d("of", b, R, h), () => y(R));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, h, y, b = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${h})`, y);
        const R = this._scope.toName(u);
        return this._for(new d("in", b, R, h), () => y(R));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(t);
      }
      // `label` statement
      label(u) {
        return this._leafNode(new w(u));
      }
      // `break` statement
      break(u) {
        return this._leafNode(new n(u));
      }
      // `return` statement
      return(u) {
        const h = new m();
        if (this._blockNode(h), this.code(u), h.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(m);
      }
      // `try` statement
      try(u, h, y) {
        if (!h && !y)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const b = new p();
        if (this._blockNode(b), this.code(u), h) {
          const R = this.name("e");
          this._currNode = b.catch = new O(R), h(R);
        }
        return y && (this._currNode = b.finally = new j(), this.code(y)), this._endBlockNode(O, j);
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
        const y = this._nodes.length - h;
        if (y < 0 || u !== void 0 && y !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${y} vs ${u} expected`);
        return this._nodes.length = h, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, h = e.nil, y, b) {
        return this._blockNode(new M(u, h, y)), b && this.code(b).endFunc(), this;
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
        const y = this._currNode;
        if (y instanceof u || h && y instanceof h)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${h ? `${u.kind}/${h.kind}` : u.kind}"`);
      }
      _elseNode(u) {
        const h = this._currNode;
        if (!(h instanceof I))
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
    A.CodeGen = z;
    function U(N, u) {
      for (const h in u)
        N[h] = (N[h] || 0) + (u[h] || 0);
      return N;
    }
    function L(N, u) {
      return u instanceof e._CodeOrName ? U(N, u.names) : N;
    }
    function J(N, u, h) {
      if (N instanceof e.Name)
        return y(N);
      if (!b(N))
        return N;
      return new e._Code(N._items.reduce((R, Y) => (Y instanceof e.Name && (Y = y(Y)), Y instanceof e._Code ? R.push(...Y._items) : R.push(Y), R), []));
      function y(R) {
        const Y = h[R.str];
        return Y === void 0 || u[R.str] !== 1 ? R : (delete u[R.str], Y);
      }
      function b(R) {
        return R instanceof e._Code && R._items.some((Y) => Y instanceof e.Name && u[Y.str] === 1 && h[Y.str] !== void 0);
      }
    }
    function T(N, u) {
      for (const h in u)
        N[h] = (N[h] || 0) - (u[h] || 0);
    }
    function rA(N) {
      return typeof N == "boolean" || typeof N == "number" || N === null ? !N : (0, e._)`!${_(N)}`;
    }
    A.not = rA;
    const oA = P(A.operators.AND);
    function x(...N) {
      return N.reduce(oA);
    }
    A.and = x;
    const iA = P(A.operators.OR);
    function v(...N) {
      return N.reduce(iA);
    }
    A.or = v;
    function P(N) {
      return (u, h) => u === e.nil ? h : h === e.nil ? u : (0, e._)`${_(u)} ${N} ${_(h)}`;
    }
    function _(N) {
      return N instanceof e.Name ? N : (0, e._)`(${N})`;
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
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (Q(d, M), !i(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function Q(d, M = d.schema) {
    const { opts: m, self: p } = d;
    if (!m.strictSchema || typeof M == "boolean")
      return;
    const O = p.RULES.keywords;
    for (const j in M)
      O[j] || c(d, `unknown keyword: "${j}"`);
  }
  util.checkUnknownRules = Q;
  function i(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const m in d)
      if (M[m])
        return !0;
    return !1;
  }
  util.schemaHasRules = i;
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
  function a(d) {
    return E(decodeURIComponent(d));
  }
  util.unescapeFragment = a;
  function w(d) {
    return encodeURIComponent(n(d));
  }
  util.escapeFragment = w;
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
      const L = z === void 0 ? j : z instanceof A.Name ? (j instanceof A.Name ? d(O, j, z) : M(O, j, z), z) : j instanceof A.Name ? (M(O, z, j), j) : m(j, z);
      return U === A.Name && !(L instanceof A.Name) ? p(O, L) : L;
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
      resultToName: K
    }),
    items: f({
      mergeNames: (d, M, m) => d.if((0, A._)`${m} !== true && ${M} !== undefined`, () => d.assign(m, (0, A._)`${M} === true ? true : ${m} > ${M} ? ${m} : ${M}`)),
      mergeToName: (d, M, m) => d.if((0, A._)`${m} !== true`, () => d.assign(m, M === !0 ? !0 : (0, A._)`${m} > ${M} ? ${m} : ${M}`)),
      mergeValues: (d, M) => d === !0 ? !0 : Math.max(d, M),
      resultToName: (d, M) => d.var("items", M)
    })
  };
  function K(d, M) {
    if (M === !0)
      return d.var("props", !0);
    const m = d.var("props", (0, A._)`{}`);
    return M !== void 0 && D(d, m, M), m;
  }
  util.evaluatedPropsToName = K;
  function D(d, M, m) {
    Object.keys(m).forEach((p) => d.assign((0, A._)`${M}${(0, A.getProperty)(p)}`, !0));
  }
  util.setEvaluated = D;
  const g = {};
  function I(d, M) {
    return d.scopeValue("func", {
      ref: M,
      code: g[M.code] || (g[M.code] = new e._Code(M.code))
    });
  }
  util.useFunc = I;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function C(d, M, m) {
    if (d instanceof A.Name) {
      const p = M === t.Num;
      return m ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return m ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = C;
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
      message: ({ keyword: g, schemaType: I }) => I ? (0, e.str)`"${g}" keyword must be ${I} ($data)` : (0, e.str)`"${g}" keyword is invalid ($data)`
    };
    function Q(g, I = A.keywordError, t, C) {
      const { it: c } = g, { gen: d, compositeRule: M, allErrors: m } = c, p = E(g, I, t);
      C ?? (M || m) ? a(d, p) : w(c, (0, e._)`[${p}]`);
    }
    A.reportError = Q;
    function i(g, I = A.keywordError, t) {
      const { it: C } = g, { gen: c, compositeRule: d, allErrors: M } = C, m = E(g, I, t);
      a(c, m), d || M || w(C, o.default.vErrors);
    }
    A.reportExtraError = i;
    function B(g, I) {
      g.assign(o.default.errors, I), g.if((0, e._)`${o.default.vErrors} !== null`, () => g.if(I, () => g.assign((0, e._)`${o.default.vErrors}.length`, I), () => g.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: g, keyword: I, schemaValue: t, data: C, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = g.name("err");
      g.forRange("i", c, o.default.errors, (m) => {
        g.const(M, (0, e._)`${o.default.vErrors}[${m}]`), g.if((0, e._)`${M}.instancePath === undefined`, () => g.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), g.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${I}`), d.opts.verbose && (g.assign((0, e._)`${M}.schema`, t), g.assign((0, e._)`${M}.data`, C));
      });
    }
    A.extendErrors = s;
    function a(g, I) {
      const t = g.const("err", I);
      g.if((0, e._)`${o.default.vErrors} === null`, () => g.assign(o.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${o.default.vErrors}.push(${t})`), g.code((0, e._)`${o.default.errors}++`);
    }
    function w(g, I) {
      const { gen: t, validateName: C, schemaEnv: c } = g;
      c.$async ? t.throw((0, e._)`new ${g.ValidationError}(${I})`) : (t.assign((0, e._)`${C}.errors`, I), t.return(!1));
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
    function E(g, I, t) {
      const { createErrors: C } = g.it;
      return C === !1 ? (0, e._)`{}` : l(g, I, t);
    }
    function l(g, I, t = {}) {
      const { gen: C, it: c } = g, d = [
        f(c, t),
        K(g, t)
      ];
      return D(g, I, d), C.object(...d);
    }
    function f({ errorPath: g }, { instancePath: I }) {
      const t = I ? (0, e.str)`${g}${(0, r.getErrorPath)(I, r.Type.Str)}` : g;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function K({ keyword: g, it: { errSchemaPath: I } }, { schemaPath: t, parentSchema: C }) {
      let c = C ? I : (0, e.str)`${I}/${g}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function D(g, { params: I, message: t }, C) {
      const { keyword: c, data: d, schemaValue: M, it: m } = g, { opts: p, propertyName: O, topSchemaRef: j, schemaPath: z } = m;
      C.push([n.keyword, c], [n.params, typeof I == "function" ? I(g) : I || (0, e._)`{}`]), p.messages && C.push([n.message, typeof t == "function" ? t(g) : t]), p.verbose && C.push([n.schema, M], [n.parentSchema, (0, e._)`${j}${z}`], [o.default.data, d]), O && C.push([n.propertyName, O]);
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
  function Q(s) {
    const { gen: a, schema: w, validateName: n } = s;
    w === !1 ? B(s, !1) : typeof w == "object" && w.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = Q;
  function i(s, a) {
    const { gen: w, schema: n } = s;
    n === !1 ? (w.var(a, !1), B(s)) : w.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = i;
  function B(s, a) {
    const { gen: w, data: n } = s, E = {
      gen: w,
      keyword: "false schema",
      data: n,
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
  function r(Q) {
    return typeof Q == "string" && e.has(Q);
  }
  rules.isJSONType = r;
  function o() {
    const Q = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...Q, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, Q.number, Q.string, Q.array, Q.object],
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
  function A({ schema: o, self: Q }, i) {
    const B = Q.RULES.types[i];
    return B && B !== !0 && e(o, B);
  }
  applicability.schemaHasRulesForType = A;
  function e(o, Q) {
    return Q.rules.some((i) => r(o, i));
  }
  applicability.shouldUseGroup = e;
  function r(o, Q) {
    var i;
    return o[Q.keyword] !== void 0 || ((i = Q.definition.implements) === null || i === void 0 ? void 0 : i.some((B) => o[B] !== void 0));
  }
  return applicability.shouldUseRule = r, applicability;
}
var hasRequiredDataType;
function requireDataType() {
  if (hasRequiredDataType) return dataType;
  hasRequiredDataType = 1, Object.defineProperty(dataType, "__esModule", { value: !0 }), dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
  const A = requireRules(), e = requireApplicability(), r = requireErrors(), o = requireCodegen(), Q = requireUtil();
  var i;
  (function(t) {
    t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
  })(i || (dataType.DataType = i = {}));
  function B(t) {
    const C = s(t.type);
    if (C.includes("null")) {
      if (t.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!C.length && t.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      t.nullable === !0 && C.push("null");
    }
    return C;
  }
  dataType.getSchemaTypes = B;
  function s(t) {
    const C = Array.isArray(t) ? t : t ? [t] : [];
    if (C.every(A.isJSONType))
      return C;
    throw new Error("type must be JSONType or JSONType[]: " + C.join(","));
  }
  dataType.getJSONTypes = s;
  function a(t, C) {
    const { gen: c, data: d, opts: M } = t, m = n(C, M.coerceTypes), p = C.length > 0 && !(m.length === 0 && C.length === 1 && (0, e.schemaHasRulesForType)(t, C[0]));
    if (p) {
      const O = K(C, d, M.strictNumbers, i.Wrong);
      c.if(O, () => {
        m.length ? E(t, C, m) : g(t);
      });
    }
    return p;
  }
  dataType.coerceAndCheckDataType = a;
  const w = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, C) {
    return C ? t.filter((c) => w.has(c) || C === "array" && c === "array") : [];
  }
  function E(t, C, c) {
    const { gen: d, data: M, opts: m } = t, p = d.let("dataType", (0, o._)`typeof ${M}`), O = d.let("coerced", (0, o._)`undefined`);
    m.coerceTypes === "array" && d.if((0, o._)`${p} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(p, (0, o._)`typeof ${M}`).if(K(C, M, m.strictNumbers), () => d.assign(O, M))), d.if((0, o._)`${O} !== undefined`);
    for (const z of c)
      (w.has(z) || z === "array" && m.coerceTypes === "array") && j(z);
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
  function l({ gen: t, parentData: C, parentDataProperty: c }, d) {
    t.if((0, o._)`${C} !== undefined`, () => t.assign((0, o._)`${C}[${c}]`, d));
  }
  function f(t, C, c, d = i.Correct) {
    const M = d === i.Correct ? o.operators.EQ : o.operators.NEQ;
    let m;
    switch (t) {
      case "null":
        return (0, o._)`${C} ${M} null`;
      case "array":
        m = (0, o._)`Array.isArray(${C})`;
        break;
      case "object":
        m = (0, o._)`${C} && typeof ${C} == "object" && !Array.isArray(${C})`;
        break;
      case "integer":
        m = p((0, o._)`!(${C} % 1) && !isNaN(${C})`);
        break;
      case "number":
        m = p();
        break;
      default:
        return (0, o._)`typeof ${C} ${M} ${t}`;
    }
    return d === i.Correct ? m : (0, o.not)(m);
    function p(O = o.nil) {
      return (0, o.and)((0, o._)`typeof ${C} == "number"`, O, c ? (0, o._)`isFinite(${C})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function K(t, C, c, d) {
    if (t.length === 1)
      return f(t[0], C, c, d);
    let M;
    const m = (0, Q.toHash)(t);
    if (m.array && m.object) {
      const p = (0, o._)`typeof ${C} != "object"`;
      M = m.null ? p : (0, o._)`!${C} || ${p}`, delete m.null, delete m.array, delete m.object;
    } else
      M = o.nil;
    m.number && delete m.integer;
    for (const p in m)
      M = (0, o.and)(M, f(p, C, c, d));
    return M;
  }
  dataType.checkDataTypes = K;
  const D = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: C }) => typeof t == "string" ? (0, o._)`{type: ${t}}` : (0, o._)`{type: ${C}}`
  };
  function g(t) {
    const C = I(t);
    (0, r.reportError)(C, D);
  }
  dataType.reportTypeError = g;
  function I(t) {
    const { gen: C, data: c, schema: d } = t, M = (0, Q.schemaRefOrVal)(t, d, "type");
    return {
      gen: C,
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
  function r(Q, i) {
    const { properties: B, items: s } = Q.schema;
    if (i === "object" && B)
      for (const a in B)
        o(Q, a, B[a].default);
    else i === "array" && Array.isArray(s) && s.forEach((a, w) => o(Q, w, a.default));
  }
  defaults.assignDefaults = r;
  function o(Q, i, B) {
    const { gen: s, compositeRule: a, data: w, opts: n } = Q;
    if (B === void 0)
      return;
    const E = (0, A._)`${w}${(0, A.getProperty)(i)}`;
    if (a) {
      (0, e.checkStrictMode)(Q, `default is ignored for: ${E}`);
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
  function Q(t, C) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, C, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${C}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = Q;
  function i({ gen: t, data: C, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((m) => (0, A.and)(n(t, C, m, c.ownProperties), (0, A._)`${M} = ${m}`)));
  }
  code.checkMissingProp = i;
  function B(t, C) {
    t.setParams({ missingProperty: C }, !0), t.error();
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
  function a(t, C, c) {
    return (0, A._)`${s(t)}.call(${C}, ${c})`;
  }
  code.isOwnProperty = a;
  function w(t, C, c, d) {
    const M = (0, A._)`${C}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, C, c)}` : M;
  }
  code.propertyInData = w;
  function n(t, C, c, d) {
    const M = (0, A._)`${C}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(M, (0, A.not)(a(t, C, c))) : M;
  }
  code.noPropertyInData = n;
  function E(t) {
    return t ? Object.keys(t).filter((C) => C !== "__proto__") : [];
  }
  code.allSchemaProperties = E;
  function l(t, C) {
    return E(C).filter((c) => !(0, e.alwaysValidSchema)(t, C[c]));
  }
  code.schemaProperties = l;
  function f({ schemaCode: t, data: C, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: m }, it: p }, O, j, z) {
    const U = z ? (0, A._)`${t}, ${C}, ${d}${M}` : C, L = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, m)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && L.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const J = (0, A._)`${U}, ${c.object(...L)}`;
    return j !== A.nil ? (0, A._)`${O}.call(${j}, ${J})` : (0, A._)`${O}(${J})`;
  }
  code.callValidateCode = f;
  const K = (0, A._)`new RegExp`;
  function D({ gen: t, it: { opts: C } }, c) {
    const d = C.unicodeRegExp ? "u" : "", { regExp: M } = C.code, m = M(c, d);
    return t.scopeValue("pattern", {
      key: m.toString(),
      ref: m,
      code: (0, A._)`${M.code === "new RegExp" ? K : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = D;
  function g(t) {
    const { gen: C, data: c, keyword: d, it: M } = t, m = C.name("valid");
    if (M.allErrors) {
      const O = C.let("valid", !0);
      return p(() => C.assign(O, !1)), O;
    }
    return C.var(m, !0), p(() => C.break()), m;
    function p(O) {
      const j = C.const("len", (0, A._)`${c}.length`);
      C.forRange("i", 0, j, (z) => {
        t.subschema({
          keyword: d,
          dataProp: z,
          dataPropType: e.Type.Num
        }, m), C.if((0, A.not)(m), O);
      });
    }
  }
  code.validateArray = g;
  function I(t) {
    const { gen: C, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((j) => (0, e.alwaysValidSchema)(M, j)) && !M.opts.unevaluated)
      return;
    const p = C.let("valid", !1), O = C.name("_valid");
    C.block(() => c.forEach((j, z) => {
      const U = t.subschema({
        keyword: d,
        schemaProp: z,
        compositeRule: !0
      }, O);
      C.assign(p, (0, A._)`${p} || ${O}`), t.mergeValidEvaluated(U, O) || C.if((0, A.not)(p));
    })), t.result(p, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = I, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function Q(l, f) {
    const { gen: K, keyword: D, schema: g, parentSchema: I, it: t } = l, C = f.macro.call(t.self, g, I, t), c = w(K, D, C);
    t.opts.validateSchema !== !1 && t.self.validateSchema(C, !0);
    const d = K.name("valid");
    l.subschema({
      schema: C,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${D}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = Q;
  function i(l, f) {
    var K;
    const { gen: D, keyword: g, schema: I, parentSchema: t, $data: C, it: c } = l;
    a(c, f);
    const d = !C && f.compile ? f.compile.call(c.self, I, t, c) : f.validate, M = w(D, g, d), m = D.let("valid");
    l.block$data(m, p), l.ok((K = f.valid) !== null && K !== void 0 ? K : m);
    function p() {
      if (f.errors === !1)
        z(), f.modifying && B(l), U(() => l.error());
      else {
        const L = f.async ? O() : j();
        f.modifying && B(l), U(() => s(l, L));
      }
    }
    function O() {
      const L = D.let("ruleErrs", null);
      return D.try(() => z((0, A._)`await `), (J) => D.assign(m, !1).if((0, A._)`${J} instanceof ${c.ValidationError}`, () => D.assign(L, (0, A._)`${J}.errors`), () => D.throw(J))), L;
    }
    function j() {
      const L = (0, A._)`${M}.errors`;
      return D.assign(L, null), z(A.nil), L;
    }
    function z(L = f.async ? (0, A._)`await ` : A.nil) {
      const J = c.opts.passContext ? e.default.this : e.default.self, T = !("compile" in f && !C || f.schema === !1);
      D.assign(m, (0, A._)`${L}${(0, r.callValidateCode)(l, M, J, T)}`, f.modifying);
    }
    function U(L) {
      var J;
      D.if((0, A.not)((J = f.valid) !== null && J !== void 0 ? J : m), L);
    }
  }
  keyword.funcKeywordCode = i;
  function B(l) {
    const { gen: f, data: K, it: D } = l;
    f.if(D.parentData, () => f.assign(K, (0, A._)`${D.parentData}[${D.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: K } = l;
    K.if((0, A._)`Array.isArray(${f})`, () => {
      K.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, o.extendErrors)(l);
    }, () => l.error());
  }
  function a({ schemaEnv: l }, f) {
    if (f.async && !l.$async)
      throw new Error("async keyword in sync schema");
  }
  function w(l, f, K) {
    if (K === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof K == "function" ? { ref: K } : { ref: K, code: (0, A.stringify)(K) });
  }
  function n(l, f, K = !1) {
    return !f.length || f.some((D) => D === "array" ? Array.isArray(l) : D === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == D || K && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: K, errSchemaPath: D }, g, I) {
    if (Array.isArray(g.keyword) ? !g.keyword.includes(I) : g.keyword !== I)
      throw new Error("ajv implementation error");
    const t = g.dependencies;
    if (t?.some((C) => !Object.prototype.hasOwnProperty.call(l, C)))
      throw new Error(`parent schema must have dependencies of ${I}: ${t.join(",")}`);
    if (g.validateSchema && !g.validateSchema(l[I])) {
      const c = `keyword "${I}" value is invalid at path "${D}": ` + K.errorsText(g.validateSchema.errors);
      if (f.validateSchema === "log")
        K.logger.error(c);
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
  function r(i, { keyword: B, schemaProp: s, schema: a, schemaPath: w, errSchemaPath: n, topSchemaRef: E }) {
    if (B !== void 0 && a !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (B !== void 0) {
      const l = i.schema[B];
      return s === void 0 ? {
        schema: l,
        schemaPath: (0, A._)`${i.schemaPath}${(0, A.getProperty)(B)}`,
        errSchemaPath: `${i.errSchemaPath}/${B}`
      } : {
        schema: l[s],
        schemaPath: (0, A._)`${i.schemaPath}${(0, A.getProperty)(B)}${(0, A.getProperty)(s)}`,
        errSchemaPath: `${i.errSchemaPath}/${B}/${(0, e.escapeFragment)(s)}`
      };
    }
    if (a !== void 0) {
      if (w === void 0 || n === void 0 || E === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: a,
        schemaPath: w,
        topSchemaRef: E,
        errSchemaPath: n
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function o(i, B, { dataProp: s, dataPropType: a, data: w, dataTypes: n, propertyName: E }) {
    if (w !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: K, dataPathArr: D, opts: g } = B, I = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(I), i.errorPath = (0, A.str)`${K}${(0, e.getErrorPath)(s, a, g.jsPropertySyntax)}`, i.parentDataProperty = (0, A._)`${s}`, i.dataPathArr = [...D, i.parentDataProperty];
    }
    if (w !== void 0) {
      const K = w instanceof A.Name ? w : l.let("data", w, !0);
      f(K), E !== void 0 && (i.propertyName = E);
    }
    n && (i.dataTypes = n);
    function f(K) {
      i.data = K, i.dataLevel = B.dataLevel + 1, i.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), i.parentData = B.data, i.dataNames = [...B.dataNames, K];
    }
  }
  subschema.extendSubschemaData = o;
  function Q(i, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: w, allErrors: n }) {
    a !== void 0 && (i.compositeRule = a), w !== void 0 && (i.createErrors = w), n !== void 0 && (i.allErrors = n), i.jtdDiscriminator = B, i.jtdMetadata = s;
  }
  return subschema.extendSubschemaMode = Q, subschema;
}
var resolve = {}, fastDeepEqual, hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  return hasRequiredFastDeepEqual || (hasRequiredFastDeepEqual = 1, fastDeepEqual = function A(e, r) {
    if (e === r) return !0;
    if (e && r && typeof e == "object" && typeof r == "object") {
      if (e.constructor !== r.constructor) return !1;
      var o, Q, i;
      if (Array.isArray(e)) {
        if (o = e.length, o != r.length) return !1;
        for (Q = o; Q-- !== 0; )
          if (!A(e[Q], r[Q])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
      if (i = Object.keys(e), o = i.length, o !== Object.keys(r).length) return !1;
      for (Q = o; Q-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, i[Q])) return !1;
      for (Q = o; Q-- !== 0; ) {
        var B = i[Q];
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
  var A = jsonSchemaTraverse.exports = function(o, Q, i) {
    typeof Q == "function" && (i = Q, Q = {}), i = Q.cb || i;
    var B = typeof i == "function" ? i : i.pre || function() {
    }, s = i.post || function() {
    };
    e(Q, B, s, o, "", o);
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
  function e(o, Q, i, B, s, a, w, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      Q(B, s, a, w, n, E, l);
      for (var f in B) {
        var K = B[f];
        if (Array.isArray(K)) {
          if (f in A.arrayKeywords)
            for (var D = 0; D < K.length; D++)
              e(o, Q, i, K[D], s + "/" + f + "/" + D, a, s, f, B, D);
        } else if (f in A.propsKeywords) {
          if (K && typeof K == "object")
            for (var g in K)
              e(o, Q, i, K[g], s + "/" + f + "/" + r(g), a, s, f, B, g);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, Q, i, K, s + "/" + f, a, s, f, B);
      }
      i(B, s, a, w, n, E, l);
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
  function Q(D, g = !0) {
    return typeof D == "boolean" ? !0 : g === !0 ? !B(D) : g ? s(D) <= g : !1;
  }
  resolve.inlineRef = Q;
  const i = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(D) {
    for (const g in D) {
      if (i.has(g))
        return !0;
      const I = D[g];
      if (Array.isArray(I) && I.some(B) || typeof I == "object" && B(I))
        return !0;
    }
    return !1;
  }
  function s(D) {
    let g = 0;
    for (const I in D) {
      if (I === "$ref")
        return 1 / 0;
      if (g++, !o.has(I) && (typeof D[I] == "object" && (0, A.eachItem)(D[I], (t) => g += s(t)), g === 1 / 0))
        return 1 / 0;
    }
    return g;
  }
  function a(D, g = "", I) {
    I !== !1 && (g = E(g));
    const t = D.parse(g);
    return w(D, t);
  }
  resolve.getFullPath = a;
  function w(D, g) {
    return D.serialize(g).split("#")[0] + "#";
  }
  resolve._getFullPath = w;
  const n = /#\/?$/;
  function E(D) {
    return D ? D.replace(n, "") : "";
  }
  resolve.normalizeId = E;
  function l(D, g, I) {
    return I = E(I), D.resolve(g, I);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function K(D, g) {
    if (typeof D == "boolean")
      return {};
    const { schemaId: I, uriResolver: t } = this.opts, C = E(D[I] || g), c = { "": C }, d = a(t, C, !1), M = {}, m = /* @__PURE__ */ new Set();
    return r(D, { allKeys: !0 }, (j, z, U, L) => {
      if (L === void 0)
        return;
      const J = d + z;
      let T = c[L];
      typeof j[I] == "string" && (T = rA.call(this, j[I])), oA.call(this, j.$anchor), oA.call(this, j.$dynamicAnchor), c[z] = T;
      function rA(x) {
        const iA = this.opts.uriResolver.resolve;
        if (x = E(T ? iA(T, x) : x), m.has(x))
          throw O(x);
        m.add(x);
        let v = this.refs[x];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? p(j, v.schema, x) : x !== E(J) && (x[0] === "#" ? (p(j, M[x], x), M[x] = j) : this.refs[x] = J), x;
      }
      function oA(x) {
        if (typeof x == "string") {
          if (!f.test(x))
            throw new Error(`invalid anchor "${x}"`);
          rA.call(this, `#${x}`);
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
  return resolve.getSchemaRefs = K, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), Q = requireDefaults(), i = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), w = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (m(k), c(k))) {
      g(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: G, schema: H, schemaEnv: q, opts: F }, S) {
    F.code.es5 ? k.func(G, (0, s._)`${a.default.data}, ${a.default.valCxt}`, q.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, F)}`), D(k, F), k.code(S);
    }) : k.func(G, (0, s._)`${a.default.data}, ${K(F)}`, q.$async, () => k.code(t(H, F)).code(S));
  }
  function K(k) {
    return (0, s._)`{${a.default.instancePath}="", ${a.default.parentData}, ${a.default.parentDataProperty}, ${a.default.rootData}=${a.default.data}${k.dynamicRef ? (0, s._)`, ${a.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function D(k, G) {
    k.if(a.default.valCxt, () => {
      k.var(a.default.instancePath, (0, s._)`${a.default.valCxt}.${a.default.instancePath}`), k.var(a.default.parentData, (0, s._)`${a.default.valCxt}.${a.default.parentData}`), k.var(a.default.parentDataProperty, (0, s._)`${a.default.valCxt}.${a.default.parentDataProperty}`), k.var(a.default.rootData, (0, s._)`${a.default.valCxt}.${a.default.rootData}`), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`${a.default.valCxt}.${a.default.dynamicAnchors}`);
    }, () => {
      k.var(a.default.instancePath, (0, s._)`""`), k.var(a.default.parentData, (0, s._)`undefined`), k.var(a.default.parentDataProperty, (0, s._)`undefined`), k.var(a.default.rootData, a.default.data), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function g(k) {
    const { schema: G, opts: H, gen: q } = k;
    f(k, () => {
      H.$comment && G.$comment && L(k), j(k), q.let(a.default.vErrors, null), q.let(a.default.errors, 0), H.unevaluated && I(k), p(k), J(k);
    });
  }
  function I(k) {
    const { gen: G, validateName: H } = k;
    k.evaluated = G.const("evaluated", (0, s._)`${H}.evaluated`), G.if((0, s._)`${k.evaluated}.dynamicProps`, () => G.assign((0, s._)`${k.evaluated}.props`, (0, s._)`undefined`)), G.if((0, s._)`${k.evaluated}.dynamicItems`, () => G.assign((0, s._)`${k.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(k, G) {
    const H = typeof k == "object" && k[G.schemaId];
    return H && (G.code.source || G.code.process) ? (0, s._)`/*# sourceURL=${H} */` : s.nil;
  }
  function C(k, G) {
    if (d(k) && (m(k), c(k))) {
      M(k, G);
      return;
    }
    (0, A.boolOrEmptySchema)(k, G);
  }
  function c({ schema: k, self: G }) {
    if (typeof k == "boolean")
      return !k;
    for (const H in k)
      if (G.RULES.all[H])
        return !0;
    return !1;
  }
  function d(k) {
    return typeof k.schema != "boolean";
  }
  function M(k, G) {
    const { schema: H, gen: q, opts: F } = k;
    F.$comment && H.$comment && L(k), z(k), U(k);
    const S = q.const("_errs", a.default.errors);
    p(k, S), q.var(G, (0, s._)`${S} === ${a.default.errors}`);
  }
  function m(k) {
    (0, n.checkUnknownRules)(k), O(k);
  }
  function p(k, G) {
    if (k.opts.jtd)
      return rA(k, [], !1, G);
    const H = (0, e.getSchemaTypes)(k.schema), q = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !q, G);
  }
  function O(k) {
    const { schema: G, errSchemaPath: H, opts: q, self: F } = k;
    G.$ref && q.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(G, F.RULES) && F.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function j(k) {
    const { schema: G, opts: H } = k;
    G.default !== void 0 && H.useDefaults && H.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function z(k) {
    const G = k.schema[k.opts.schemaId];
    G && (k.baseId = (0, w.resolveUrl)(k.opts.uriResolver, k.baseId, G));
  }
  function U(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function L({ gen: k, schemaEnv: G, schema: H, errSchemaPath: q, opts: F }) {
    const S = H.$comment;
    if (F.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${S})`);
    else if (typeof F.$comment == "function") {
      const V = (0, s.str)`${q}/$comment`, eA = k.scopeValue("root", { ref: G.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${S}, ${V}, ${eA}.schema)`);
    }
  }
  function J(k) {
    const { gen: G, schemaEnv: H, validateName: q, ValidationError: F, opts: S } = k;
    H.$async ? G.if((0, s._)`${a.default.errors} === 0`, () => G.return(a.default.data), () => G.throw((0, s._)`new ${F}(${a.default.vErrors})`)) : (G.assign((0, s._)`${q}.errors`, a.default.vErrors), S.unevaluated && T(k), G.return((0, s._)`${a.default.errors} === 0`));
  }
  function T({ gen: k, evaluated: G, props: H, items: q }) {
    H instanceof s.Name && k.assign((0, s._)`${G}.props`, H), q instanceof s.Name && k.assign((0, s._)`${G}.items`, q);
  }
  function rA(k, G, H, q) {
    const { gen: F, schema: S, data: V, allErrors: eA, opts: W, self: $ } = k, { RULES: X } = $;
    if (S.$ref && (W.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(S, X))) {
      F.block(() => b(k, "$ref", X.all.$ref.definition));
      return;
    }
    W.jtd || x(k, G), F.block(() => {
      for (const AA of X.rules)
        QA(AA);
      QA(X.post);
    });
    function QA(AA) {
      (0, r.shouldUseGroup)(S, AA) && (AA.type ? (F.if((0, o.checkDataType)(AA.type, V, W.strictNumbers)), oA(k, AA), G.length === 1 && G[0] === AA.type && H && (F.else(), (0, o.reportTypeError)(k)), F.endIf()) : oA(k, AA), eA || F.if((0, s._)`${a.default.errors} === ${q || 0}`));
    }
  }
  function oA(k, G) {
    const { gen: H, schema: q, opts: { useDefaults: F } } = k;
    F && (0, Q.assignDefaults)(k, G.type), H.block(() => {
      for (const S of G.rules)
        (0, r.shouldUseRule)(q, S) && b(k, S.keyword, S.definition, G.type);
    });
  }
  function x(k, G) {
    k.schemaEnv.meta || !k.opts.strictTypes || (iA(k, G), k.opts.allowUnionTypes || v(k, G), P(k, k.dataTypes));
  }
  function iA(k, G) {
    if (G.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = G;
        return;
      }
      G.forEach((H) => {
        N(k.dataTypes, H) || h(k, `type "${H}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, G);
    }
  }
  function v(k, G) {
    G.length > 1 && !(G.length === 2 && G.includes("null")) && h(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, G) {
    const H = k.self.RULES.all;
    for (const q in H) {
      const F = H[q];
      if (typeof F == "object" && (0, r.shouldUseRule)(k.schema, F)) {
        const { type: S } = F.definition;
        S.length && !S.some((V) => _(G, V)) && h(k, `missing type "${S.join(",")}" for keyword "${q}"`);
      }
    }
  }
  function _(k, G) {
    return k.includes(G) || G === "number" && k.includes("integer");
  }
  function N(k, G) {
    return k.includes(G) || G === "integer" && k.includes("number");
  }
  function u(k, G) {
    const H = [];
    for (const q of k.dataTypes)
      N(G, q) ? H.push(q) : G.includes("integer") && q === "number" && H.push("integer");
    k.dataTypes = H;
  }
  function h(k, G) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    G += ` at "${H}" (strictTypes)`, (0, n.checkStrictMode)(k, G, k.opts.strictTypes);
  }
  class y {
    constructor(G, H, q) {
      if ((0, i.validateKeywordUsage)(G, H, q), this.gen = G.gen, this.allErrors = G.allErrors, this.keyword = q, this.data = G.data, this.schema = G.schema[q], this.$data = H.$data && G.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(G, this.schema, q, this.$data), this.schemaType = H.schemaType, this.parentSchema = G.schema, this.params = {}, this.it = G, this.def = H, this.$data)
        this.schemaCode = G.gen.const("vSchema", Z(this.$data, G));
      else if (this.schemaCode = this.schemaValue, !(0, i.validSchemaType)(this.schema, H.schemaType, H.allowUndefined))
        throw new Error(`${q} value must be ${JSON.stringify(H.schemaType)}`);
      ("code" in H ? H.trackErrors : H.errors !== !1) && (this.errsCount = G.gen.const("_errs", a.default.errors));
    }
    result(G, H, q) {
      this.failResult((0, s.not)(G), H, q);
    }
    failResult(G, H, q) {
      this.gen.if(G), q ? q() : this.error(), H ? (this.gen.else(), H(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(G, H) {
      this.failResult((0, s.not)(G), void 0, H);
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
      const { schemaCode: H } = this;
      this.fail((0, s._)`${H} !== undefined && (${(0, s.or)(this.invalid$data(), G)})`);
    }
    error(G, H, q) {
      if (H) {
        this.setParams(H), this._error(G, q), this.setParams({});
        return;
      }
      this._error(G, q);
    }
    _error(G, H) {
      (G ? E.reportExtraError : E.reportError)(this, this.def.error, H);
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
    setParams(G, H) {
      H ? Object.assign(this.params, G) : this.params = G;
    }
    block$data(G, H, q = s.nil) {
      this.gen.block(() => {
        this.check$data(G, q), H();
      });
    }
    check$data(G = s.nil, H = s.nil) {
      if (!this.$data)
        return;
      const { gen: q, schemaCode: F, schemaType: S, def: V } = this;
      q.if((0, s.or)((0, s._)`${F} === undefined`, H)), G !== s.nil && q.assign(G, !0), (S.length || V.validateSchema) && (q.elseIf(this.invalid$data()), this.$dataError(), G !== s.nil && q.assign(G, !1)), q.else();
    }
    invalid$data() {
      const { gen: G, schemaCode: H, schemaType: q, def: F, it: S } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (q.length) {
          if (!(H instanceof s.Name))
            throw new Error("ajv implementation error");
          const W = Array.isArray(q) ? q : [q];
          return (0, s._)`${(0, o.checkDataTypes)(W, H, S.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (F.validateSchema) {
          const W = G.scopeValue("validate$data", { ref: F.validateSchema });
          return (0, s._)`!${W}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(G, H) {
      const q = (0, B.getSubschema)(this.it, G);
      (0, B.extendSubschemaData)(q, this.it, G), (0, B.extendSubschemaMode)(q, G);
      const F = { ...this.it, ...q, items: void 0, props: void 0 };
      return C(F, H), F;
    }
    mergeEvaluated(G, H) {
      const { it: q, gen: F } = this;
      q.opts.unevaluated && (q.props !== !0 && G.props !== void 0 && (q.props = n.mergeEvaluated.props(F, G.props, q.props, H)), q.items !== !0 && G.items !== void 0 && (q.items = n.mergeEvaluated.items(F, G.items, q.items, H)));
    }
    mergeValidEvaluated(G, H) {
      const { it: q, gen: F } = this;
      if (q.opts.unevaluated && (q.props !== !0 || q.items !== !0))
        return F.if(H, () => this.mergeEvaluated(G, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function b(k, G, H, q) {
    const F = new y(k, H, G);
    "code" in H ? H.code(F, q) : F.$data && H.validate ? (0, i.funcKeywordCode)(F, H) : "macro" in H ? (0, i.macroKeywordCode)(F, H) : (H.compile || H.validate) && (0, i.funcKeywordCode)(F, H);
  }
  const R = /^\/(?:[^~]|~0|~1)*$/, Y = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: G, dataNames: H, dataPathArr: q }) {
    let F, S;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!R.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      F = k, S = a.default.rootData;
    } else {
      const $ = Y.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const X = +$[1];
      if (F = $[2], F === "#") {
        if (X >= G)
          throw new Error(W("property/index", X));
        return q[G - X];
      }
      if (X > G)
        throw new Error(W("data", X));
      if (S = H[G - X], !F)
        return S;
    }
    let V = S;
    const eA = F.split("/");
    for (const $ of eA)
      $ && (S = (0, s._)`${S}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${S}`);
    return V;
    function W($, X) {
      return `Cannot access ${$} ${X} levels up, current level is ${G}`;
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
    constructor(o, Q, i, B) {
      super(B || `can't resolve reference ${i} from id ${Q}`), this.missingRef = (0, A.resolveUrl)(o, Q, i), this.missingSchema = (0, A.normalizeId)((0, A.getFullPath)(o, this.missingRef));
    }
  }
  return ref_error.default = e, ref_error;
}
var compile = {}, hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1, Object.defineProperty(compile, "__esModule", { value: !0 }), compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
  const A = requireCodegen(), e = requireValidation_error(), r = requireNames(), o = requireResolve(), Q = requireUtil(), i = requireValidate();
  class B {
    constructor(I) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let C;
      typeof I.schema == "object" && (C = I.schema), this.schema = I.schema, this.schemaId = I.schemaId, this.root = I.root || this, this.baseId = (t = I.baseId) !== null && t !== void 0 ? t : (0, o.normalizeId)(C?.[I.schemaId || "$id"]), this.schemaPath = I.schemaPath, this.localRefs = I.localRefs, this.meta = I.meta, this.$async = C?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(g) {
    const I = n.call(this, g);
    if (I)
      return I;
    const t = (0, o.getFullPath)(this.opts.uriResolver, g.root.baseId), { es5: C, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: C, lines: c, ownProperties: d });
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
      this._compilations.add(g), (0, i.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const z = M.toString();
      j = `${M.scopeRefs(r.default.scope)}return ${z}`, this.opts.code.process && (j = this.opts.code.process(j, g));
      const L = new Function(`${r.default.self}`, `${r.default.scope}`, j)(this, this.scope.get());
      if (this.scope.value(p, { ref: L }), L.errors = null, L.schema = g.schema, L.schemaEnv = g, g.$async && (L.$async = !0), this.opts.code.source === !0 && (L.source = { validateName: p, validateCode: z, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: J, items: T } = O;
        L.evaluated = {
          props: J instanceof A.Name ? void 0 : J,
          items: T instanceof A.Name ? void 0 : T,
          dynamicProps: J instanceof A.Name,
          dynamicItems: T instanceof A.Name
        }, L.source && (L.source.evaluated = (0, A.stringify)(L.evaluated));
      }
      return g.validate = L, g;
    } catch (z) {
      throw delete g.validate, delete g.validateName, j && this.logger.error("Error compiling schema, function code:", j), z;
    } finally {
      this._compilations.delete(g);
    }
  }
  compile.compileSchema = s;
  function a(g, I, t) {
    var C;
    t = (0, o.resolveUrl)(this.opts.uriResolver, I, t);
    const c = g.refs[t];
    if (c)
      return c;
    let d = l.call(this, g, t);
    if (d === void 0) {
      const M = (C = g.localRefs) === null || C === void 0 ? void 0 : C[t], { schemaId: m } = this.opts;
      M && (d = new B({ schema: M, schemaId: m, root: g, baseId: I }));
    }
    if (d !== void 0)
      return g.refs[t] = w.call(this, d);
  }
  compile.resolveRef = a;
  function w(g) {
    return (0, o.inlineRef)(g.schema, this.opts.inlineRefs) ? g.schema : g.validate ? g : s.call(this, g);
  }
  function n(g) {
    for (const I of this._compilations)
      if (E(I, g))
        return I;
  }
  compile.getCompilingSchema = n;
  function E(g, I) {
    return g.schema === I.schema && g.root === I.root && g.baseId === I.baseId;
  }
  function l(g, I) {
    let t;
    for (; typeof (t = this.refs[I]) == "string"; )
      I = t;
    return t || this.schemas[I] || f.call(this, g, I);
  }
  function f(g, I) {
    const t = this.opts.uriResolver.parse(I), C = (0, o._getFullPath)(this.opts.uriResolver, t);
    let c = (0, o.getFullPath)(this.opts.uriResolver, g.baseId, void 0);
    if (Object.keys(g.schema).length > 0 && C === c)
      return D.call(this, t, g);
    const d = (0, o.normalizeId)(C), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const m = f.call(this, g, M);
      return typeof m?.schema != "object" ? void 0 : D.call(this, t, m);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(I)) {
        const { schema: m } = M, { schemaId: p } = this.opts, O = m[p];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: m, schemaId: p, root: g, baseId: c });
      }
      return D.call(this, t, M);
    }
  }
  compile.resolveSchema = f;
  const K = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function D(g, { baseId: I, schema: t, root: C }) {
    var c;
    if (((c = g.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const m of g.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const p = t[(0, Q.unescapeFragment)(m)];
      if (p === void 0)
        return;
      t = p;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !K.has(m) && O && (I = (0, o.resolveUrl)(this.opts.uriResolver, I, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, Q.schemaHasRulesButRef)(t, this.RULES)) {
      const m = (0, o.resolveUrl)(this.opts.uriResolver, I, t.$ref);
      d = f.call(this, C, m);
    }
    const { schemaId: M } = this.opts;
    if (d = d || new B({ schema: t, schemaId: M, root: C, baseId: I }), d.schema !== d.root.schema)
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
    const g = D.match(e) || [], [I] = g;
    return I ? { host: B(I, "."), isIPV4: !0 } : { host: D, isIPV4: !1 };
  }
  function o(D, g = !1) {
    let I = "", t = !0;
    for (const C of D) {
      if (A[C] === void 0) return;
      C !== "0" && t === !0 && (t = !1), t || (I += C);
    }
    return g && I.length === 0 && (I = "0"), I;
  }
  function Q(D) {
    let g = 0;
    const I = { error: !1, address: "", zone: "" }, t = [], C = [];
    let c = !1, d = !1, M = !1;
    function m() {
      if (C.length) {
        if (c === !1) {
          const p = o(C);
          if (p !== void 0)
            t.push(p);
          else
            return I.error = !0, !1;
        }
        C.length = 0;
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
            I.error = !0;
            break;
          }
          p - 1 >= 0 && D[p - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!m())
            break;
          c = !0;
        } else {
          C.push(O);
          continue;
        }
    }
    return C.length && (c ? I.zone = C.join("") : M ? t.push(C.join("")) : t.push(o(C))), I.address = t.join(""), I;
  }
  function i(D) {
    if (s(D, ":") < 2)
      return { host: D, isIPV6: !1 };
    const g = Q(D);
    if (g.error)
      return { host: D, isIPV6: !1 };
    {
      let I = g.address, t = g.address;
      return g.zone && (I += "%" + g.zone, t += "%25" + g.zone), { host: I, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(D, g) {
    let I = "", t = !0;
    const C = D.length;
    for (let c = 0; c < C; c++) {
      const d = D[c];
      d === "0" && t ? (c + 1 <= C && D[c + 1] === g || c + 1 === C) && (I += d, t = !1) : (d === g ? t = !0 : t = !1, I += d);
    }
    return I;
  }
  function s(D, g) {
    let I = 0;
    for (let t = 0; t < D.length; t++)
      D[t] === g && I++;
    return I;
  }
  const a = /^\.\.?\//u, w = /^\/\.(?:\/|$)/u, n = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(D) {
    const g = [];
    for (; D.length; )
      if (D.match(a))
        D = D.replace(a, "");
      else if (D.match(w))
        D = D.replace(w, "/");
      else if (D.match(n))
        D = D.replace(n, "/"), g.pop();
      else if (D === "." || D === "..")
        D = "";
      else {
        const I = D.match(E);
        if (I) {
          const t = I[0];
          D = D.slice(t.length), g.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return g.join("");
  }
  function f(D, g) {
    const I = g !== !0 ? escape : unescape;
    return D.scheme !== void 0 && (D.scheme = I(D.scheme)), D.userinfo !== void 0 && (D.userinfo = I(D.userinfo)), D.host !== void 0 && (D.host = I(D.host)), D.path !== void 0 && (D.path = I(D.path)), D.query !== void 0 && (D.query = I(D.query)), D.fragment !== void 0 && (D.fragment = I(D.fragment)), D;
  }
  function K(D) {
    const g = [];
    if (D.userinfo !== void 0 && (g.push(D.userinfo), g.push("@")), D.host !== void 0) {
      let I = unescape(D.host);
      const t = r(I);
      if (t.isIPV4)
        I = t.host;
      else {
        const C = i(t.host);
        C.isIPV6 === !0 ? I = `[${C.escapedHost}]` : I = D.host;
      }
      g.push(I);
    }
    return (typeof D.port == "number" || typeof D.port == "string") && (g.push(":"), g.push(String(D.port))), g.length ? g.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: K,
    normalizeComponentEncoding: f,
    removeDotSegments: l,
    normalizeIPv4: r,
    normalizeIPv6: i,
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
  function Q(t) {
    const C = String(t.scheme).toLowerCase() === "https";
    return (t.port === (C ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function i(t) {
    return t.secure = r(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
  }
  function B(t) {
    if ((t.port === (r(t) ? 443 : 80) || t.port === "") && (t.port = void 0), typeof t.secure == "boolean" && (t.scheme = t.secure ? "wss" : "ws", t.secure = void 0), t.resourceName) {
      const [C, c] = t.resourceName.split("?");
      t.path = C && C !== "/" ? C : void 0, t.query = c, t.resourceName = void 0;
    }
    return t.fragment = void 0, t;
  }
  function s(t, C) {
    if (!t.path)
      return t.error = "URN can not be parsed", t;
    const c = t.path.match(e);
    if (c) {
      const d = C.scheme || t.scheme || "urn";
      t.nid = c[1].toLowerCase(), t.nss = c[2];
      const M = `${d}:${C.nid || t.nid}`, m = I[M];
      t.path = void 0, m && (t = m.parse(t, C));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, C) {
    const c = C.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${C.nid || d}`, m = I[M];
    m && (t = m.serialize(t, C));
    const p = t, O = t.nss;
    return p.path = `${d || C.nid}:${O}`, C.skipEscape = !0, p;
  }
  function w(t, C) {
    const c = t;
    return c.uuid = c.nss, c.nss = void 0, !C.tolerant && (!c.uuid || !A.test(c.uuid)) && (c.error = c.error || "UUID is not valid."), c;
  }
  function n(t) {
    const C = t;
    return C.nss = (t.uuid || "").toLowerCase(), C;
  }
  const E = {
    scheme: "http",
    domainHost: !0,
    parse: o,
    serialize: Q
  }, l = {
    scheme: "https",
    domainHost: E.domainHost,
    parse: o,
    serialize: Q
  }, f = {
    scheme: "ws",
    domainHost: !0,
    parse: i,
    serialize: B
  }, K = {
    scheme: "wss",
    domainHost: f.domainHost,
    parse: f.parse,
    serialize: f.serialize
  }, I = {
    http: E,
    https: l,
    ws: f,
    wss: K,
    urn: {
      scheme: "urn",
      parse: s,
      serialize: a,
      skipNormalize: !0
    },
    "urn:uuid": {
      scheme: "urn:uuid",
      parse: w,
      serialize: n,
      skipNormalize: !0
    }
  };
  return schemes = I, schemes;
}
var hasRequiredFastUri;
function requireFastUri() {
  if (hasRequiredFastUri) return fastUri.exports;
  hasRequiredFastUri = 1;
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: o, normalizeComponentEncoding: Q } = requireUtils(), i = requireSchemes();
  function B(g, I) {
    return typeof g == "string" ? g = n(K(g, I), I) : typeof g == "object" && (g = K(n(g, I), I)), g;
  }
  function s(g, I, t) {
    const C = Object.assign({ scheme: "null" }, t), c = a(K(g, C), K(I, C), C, !0);
    return n(c, { ...C, skipEscape: !0 });
  }
  function a(g, I, t, C) {
    const c = {};
    return C || (g = K(n(g, t), t), I = K(n(I, t), t)), t = t || {}, !t.tolerant && I.scheme ? (c.scheme = I.scheme, c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.userinfo !== void 0 || I.host !== void 0 || I.port !== void 0 ? (c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.path ? (I.path.charAt(0) === "/" ? c.path = r(I.path) : ((g.userinfo !== void 0 || g.host !== void 0 || g.port !== void 0) && !g.path ? c.path = "/" + I.path : g.path ? c.path = g.path.slice(0, g.path.lastIndexOf("/") + 1) + I.path : c.path = I.path, c.path = r(c.path)), c.query = I.query) : (c.path = g.path, I.query !== void 0 ? c.query = I.query : c.query = g.query), c.userinfo = g.userinfo, c.host = g.host, c.port = g.port), c.scheme = g.scheme), c.fragment = I.fragment, c;
  }
  function w(g, I, t) {
    return typeof g == "string" ? (g = unescape(g), g = n(Q(K(g, t), !0), { ...t, skipEscape: !0 })) : typeof g == "object" && (g = n(Q(g, !0), { ...t, skipEscape: !0 })), typeof I == "string" ? (I = unescape(I), I = n(Q(K(I, t), !0), { ...t, skipEscape: !0 })) : typeof I == "object" && (I = n(Q(I, !0), { ...t, skipEscape: !0 })), g.toLowerCase() === I.toLowerCase();
  }
  function n(g, I) {
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
    }, C = Object.assign({}, I), c = [], d = i[(C.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, C), t.path !== void 0 && (C.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), C.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = o(t);
    if (M !== void 0 && (C.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let m = t.path;
      !C.absolutePath && (!d || !d.absolutePath) && (m = r(m)), M === void 0 && (m = m.replace(/^\/\//u, "/%2F")), c.push(m);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (g, I) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(I)));
  function l(g) {
    let I = 0;
    for (let t = 0, C = g.length; t < C; ++t)
      if (I = g.charCodeAt(t), I > 126 || E[I])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function K(g, I) {
    const t = Object.assign({}, I), C = {
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
      if (C.scheme = M[1], C.userinfo = M[3], C.host = M[4], C.port = parseInt(M[5], 10), C.path = M[6] || "", C.query = M[7], C.fragment = M[8], isNaN(C.port) && (C.port = M[5]), C.host) {
        const p = e(C.host);
        if (p.isIPV4 === !1) {
          const O = A(p.host);
          C.host = O.host.toLowerCase(), d = O.isIPV6;
        } else
          C.host = p.host, d = !0;
      }
      C.scheme === void 0 && C.userinfo === void 0 && C.host === void 0 && C.port === void 0 && !C.path && C.query === void 0 ? C.reference = "same-document" : C.scheme === void 0 ? C.reference = "relative" : C.fragment === void 0 ? C.reference = "absolute" : C.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== C.reference && (C.error = C.error || "URI is not a " + t.reference + " reference.");
      const m = i[(t.scheme || C.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!m || !m.unicodeSupport) && C.host && (t.domainHost || m && m.domainHost) && d === !1 && l(C.host))
        try {
          C.host = URL.domainToASCII(C.host.toLowerCase());
        } catch (p) {
          C.error = C.error || "Host's domain name can not be converted to ASCII: " + p;
        }
      (!m || m && !m.skipNormalize) && (c && C.scheme !== void 0 && (C.scheme = unescape(C.scheme)), c && C.host !== void 0 && (C.host = unescape(C.host)), C.path && C.path.length && (C.path = escape(unescape(C.path))), C.fragment && C.fragment.length && (C.fragment = encodeURI(decodeURIComponent(C.fragment)))), m && m.parse && m.parse(C, t);
    } else
      C.error = C.error || "URI can not be parsed.";
    return C;
  }
  const D = {
    SCHEMES: i,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: w,
    serialize: n,
    parse: K
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
    const o = requireValidation_error(), Q = requireRef_error(), i = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), w = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, P) => new RegExp(v, P);
    f.code = "new RegExp";
    const K = ["removeAdditional", "useDefaults", "coerceTypes"], D = /* @__PURE__ */ new Set([
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
    }, I = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, t = 200;
    function C(v) {
      var P, _, N, u, h, y, b, R, Y, Z, k, G, H, q, F, S, V, eA, W, $, X, QA, AA, tA, sA;
      const BA = v.strict, aA = (P = v.code) === null || P === void 0 ? void 0 : P.optimize, wA = aA === !0 || aA === void 0 ? 1 : aA || 0, gA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, CA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (y = (h = v.strictSchema) !== null && h !== void 0 ? h : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (R = (b = v.strictNumbers) !== null && b !== void 0 ? b : BA) !== null && R !== void 0 ? R : !0,
        strictTypes: (Z = (Y = v.strictTypes) !== null && Y !== void 0 ? Y : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (G = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && G !== void 0 ? G : "log",
        strictRequired: (q = (H = v.strictRequired) !== null && H !== void 0 ? H : BA) !== null && q !== void 0 ? q : !1,
        code: v.code ? { ...v.code, optimize: wA, regExp: gA } : { optimize: wA, regExp: gA },
        loopRequired: (F = v.loopRequired) !== null && F !== void 0 ? F : t,
        loopEnum: (S = v.loopEnum) !== null && S !== void 0 ? S : t,
        meta: (V = v.meta) !== null && V !== void 0 ? V : !0,
        messages: (eA = v.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (W = v.inlineRefs) !== null && W !== void 0 ? W : !0,
        schemaId: ($ = v.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (X = v.addUsedSchema) !== null && X !== void 0 ? X : !0,
        validateSchema: (QA = v.validateSchema) !== null && QA !== void 0 ? QA : !0,
        validateFormats: (AA = v.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = v.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = v.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: CA
      };
    }
    class c {
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...C(P) };
        const { es5: _, lines: N } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: D, es5: _, lines: N }), this.logger = U(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, i.getRules)(), d.call(this, g, P, "NOT SUPPORTED"), d.call(this, I, P, "DEPRECATED", "warn"), this._metaOpts = j.call(this), P.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && O.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), m.call(this), P.validateFormats = u;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: P, meta: _, schemaId: N } = this.opts;
        let u = E;
        N === "id" && (u = { ...E }, u.id = u.$id, delete u.$id), _ && P && this.addMetaSchema(u, u[N], !1);
      }
      defaultMeta() {
        const { meta: P, schemaId: _ } = this.opts;
        return this.opts.defaultMeta = typeof P == "object" ? P[_] || P : void 0;
      }
      validate(P, _) {
        let N;
        if (typeof P == "string") {
          if (N = this.getSchema(P), !N)
            throw new Error(`no schema with key or ref "${P}"`);
        } else
          N = this.compile(P);
        const u = N(_);
        return "$async" in N || (this.errors = N.errors), u;
      }
      compile(P, _) {
        const N = this._addSchema(P, _);
        return N.validate || this._compileSchemaEnv(N);
      }
      compileAsync(P, _) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: N } = this.opts;
        return u.call(this, P, _);
        async function u(Z, k) {
          await h.call(this, Z.$schema);
          const G = this._addSchema(Z, k);
          return G.validate || y.call(this, G);
        }
        async function h(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function y(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof Q.default))
              throw k;
            return b.call(this, k), await R.call(this, k.missingSchema), y.call(this, Z);
          }
        }
        function b({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function R(Z) {
          const k = await Y.call(this, Z);
          this.refs[Z] || await h.call(this, k.$schema), this.refs[Z] || this.addSchema(k, Z, _);
        }
        async function Y(Z) {
          const k = this._loading[Z];
          if (k)
            return k;
          try {
            return await (this._loading[Z] = N(Z));
          } finally {
            delete this._loading[Z];
          }
        }
      }
      // Adds schema to the instance
      addSchema(P, _, N, u = this.opts.validateSchema) {
        if (Array.isArray(P)) {
          for (const y of P)
            this.addSchema(y, void 0, N, u);
          return this;
        }
        let h;
        if (typeof P == "object") {
          const { schemaId: y } = this.opts;
          if (h = P[y], h !== void 0 && typeof h != "string")
            throw new Error(`schema ${y} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || h), this._checkUnique(_), this.schemas[_] = this._addSchema(P, N, _, u, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(P, _, N = this.opts.validateSchema) {
        return this.addSchema(P, _, !0, N), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(P, _) {
        if (typeof P == "boolean")
          return !0;
        let N;
        if (N = P.$schema, N !== void 0 && typeof N != "string")
          throw new Error("$schema must be a string");
        if (N = N || this.opts.defaultMeta || this.defaultMeta(), !N)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const u = this.validate(N, P);
        if (!u && _) {
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
        let _;
        for (; typeof (_ = M.call(this, P)) == "string"; )
          P = _;
        if (_ === void 0) {
          const { schemaId: N } = this.opts, u = new B.SchemaEnv({ schema: {}, schemaId: N });
          if (_ = B.resolveSchema.call(this, u, P), !_)
            return;
          this.refs[P] = _;
        }
        return _.validate || this._compileSchemaEnv(_);
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
            const _ = M.call(this, P);
            return typeof _ == "object" && this._cache.delete(_.schema), delete this.schemas[P], delete this.refs[P], this;
          }
          case "object": {
            const _ = P;
            this._cache.delete(_);
            let N = P[this.opts.schemaId];
            return N && (N = (0, a.normalizeId)(N), delete this.schemas[N], delete this.refs[N]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(P) {
        for (const _ of P)
          this.addKeyword(_);
        return this;
      }
      addKeyword(P, _) {
        let N;
        if (typeof P == "string")
          N = P, typeof _ == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), _.keyword = N);
        else if (typeof P == "object" && _ === void 0) {
          if (_ = P, N = _.keyword, Array.isArray(N) && !N.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (J.call(this, N, _), !_)
          return (0, n.eachItem)(N, (h) => T.call(this, h)), this;
        oA.call(this, _);
        const u = {
          ..._,
          type: (0, w.getJSONTypes)(_.type),
          schemaType: (0, w.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(N, u.type.length === 0 ? (h) => T.call(this, h, u) : (h) => u.type.forEach((y) => T.call(this, h, u, y))), this;
      }
      getKeyword(P) {
        const _ = this.RULES.all[P];
        return typeof _ == "object" ? _.definition : !!_;
      }
      // Remove keyword
      removeKeyword(P) {
        const { RULES: _ } = this;
        delete _.keywords[P], delete _.all[P];
        for (const N of _.rules) {
          const u = N.rules.findIndex((h) => h.keyword === P);
          u >= 0 && N.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[P] = _, this;
      }
      errorsText(P = this.errors, { separator: _ = ", ", dataVar: N = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${N}${u.instancePath} ${u.message}`).reduce((u, h) => u + _ + h);
      }
      $dataMetaSchema(P, _) {
        const N = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of _) {
          const h = u.split("/").slice(1);
          let y = P;
          for (const b of h)
            y = y[b];
          for (const b in N) {
            const R = N[b];
            if (typeof R != "object")
              continue;
            const { $data: Y } = R.definition, Z = y[b];
            Y && Z && (y[b] = iA(Z));
          }
        }
        return P;
      }
      _removeAllSchemas(P, _) {
        for (const N in P) {
          const u = P[N];
          (!_ || _.test(N)) && (typeof u == "string" ? delete P[N] : u && !u.meta && (this._cache.delete(u.schema), delete P[N]));
        }
      }
      _addSchema(P, _, N, u = this.opts.validateSchema, h = this.opts.addUsedSchema) {
        let y;
        const { schemaId: b } = this.opts;
        if (typeof P == "object")
          y = P[b];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof P != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let R = this._cache.get(P);
        if (R !== void 0)
          return R;
        N = (0, a.normalizeId)(y || N);
        const Y = a.getSchemaRefs.call(this, P, N);
        return R = new B.SchemaEnv({ schema: P, schemaId: b, meta: _, baseId: N, localRefs: Y }), this._cache.set(R.schema, R), h && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = R), u && this.validateSchema(P, !0), R;
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
        const _ = this.opts;
        this.opts = this._metaOpts;
        try {
          B.compileSchema.call(this, P);
        } finally {
          this.opts = _;
        }
      }
    }
    c.ValidationError = o.default, c.MissingRefError = Q.default, A.default = c;
    function d(v, P, _, N = "error") {
      for (const u in v) {
        const h = u;
        h in P && this.logger[N](`${_}: option ${u}. ${v[h]}`);
      }
    }
    function M(v) {
      return v = (0, a.normalizeId)(v), this.schemas[v] || this.refs[v];
    }
    function m() {
      const v = this.opts.schemas;
      if (v)
        if (Array.isArray(v))
          this.addSchema(v);
        else
          for (const P in v)
            this.addSchema(v[P], P);
    }
    function p() {
      for (const v in this.opts.formats) {
        const P = this.opts.formats[v];
        P && this.addFormat(v, P);
      }
    }
    function O(v) {
      if (Array.isArray(v)) {
        this.addVocabulary(v);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const P in v) {
        const _ = v[P];
        _.keyword || (_.keyword = P), this.addKeyword(_);
      }
    }
    function j() {
      const v = { ...this.opts };
      for (const P of K)
        delete v[P];
      return v;
    }
    const z = { log() {
    }, warn() {
    }, error() {
    } };
    function U(v) {
      if (v === !1)
        return z;
      if (v === void 0)
        return console;
      if (v.log && v.warn && v.error)
        return v;
      throw new Error("logger must implement log, warn and error methods");
    }
    const L = /^[a-z_$][a-z0-9_$:-]*$/i;
    function J(v, P) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (N) => {
        if (_.keywords[N])
          throw new Error(`Keyword ${N} is already defined`);
        if (!L.test(N))
          throw new Error(`Keyword ${N} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function T(v, P, _) {
      var N;
      const u = P?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: h } = this;
      let y = u ? h.post : h.rules.find(({ type: R }) => R === _);
      if (y || (y = { type: _, rules: [] }, h.rules.push(y)), h.keywords[v] = !0, !P)
        return;
      const b = {
        keyword: v,
        definition: {
          ...P,
          type: (0, w.getJSONTypes)(P.type),
          schemaType: (0, w.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, y, b, P.before) : y.rules.push(b), h.all[v] = b, (N = P.implements) === null || N === void 0 || N.forEach((R) => this.addKeyword(R));
    }
    function rA(v, P, _) {
      const N = v.rules.findIndex((u) => u.keyword === _);
      N >= 0 ? v.rules.splice(N, 0, P) : (v.rules.push(P), this.logger.warn(`rule ${_} is not defined`));
    }
    function oA(v) {
      let { metaSchema: P } = v;
      P !== void 0 && (v.$data && this.opts.$data && (P = iA(P)), v.validateSchema = this.compile(P, !0));
    }
    const x = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function iA(v) {
      return { anyOf: [v, x] };
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
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), o = requireNames(), Q = requireCompile(), i = requireUtil(), B = {
    keyword: "$ref",
    schemaType: "string",
    code(w) {
      const { gen: n, schema: E, it: l } = w, { baseId: f, schemaEnv: K, validateName: D, opts: g, self: I } = l, { root: t } = K;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const C = Q.resolveRef.call(I, t, f, E);
      if (C === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (C instanceof Q.SchemaEnv)
        return d(C);
      return M(C);
      function c() {
        if (K === t)
          return a(w, D, K, K.$async);
        const m = n.scopeValue("root", { ref: t });
        return a(w, (0, r._)`${m}.validate`, t, t.$async);
      }
      function d(m) {
        const p = s(w, m);
        a(w, p, m, m.$async);
      }
      function M(m) {
        const p = n.scopeValue("schema", g.code.source === !0 ? { ref: m, code: (0, r.stringify)(m) } : { ref: m }), O = n.name("valid"), j = w.subschema({
          schema: m,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: p,
          errSchemaPath: E
        }, O);
        w.mergeEvaluated(j), w.ok(O);
      }
    }
  };
  function s(w, n) {
    const { gen: E } = w;
    return n.validate ? E.scopeValue("validate", { ref: n.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: n })}.validate`;
  }
  ref.getValidate = s;
  function a(w, n, E, l) {
    const { gen: f, it: K } = w, { allErrors: D, schemaEnv: g, opts: I } = K, t = I.passContext ? o.default.this : r.nil;
    l ? C() : c();
    function C() {
      if (!g.$async)
        throw new Error("async schema referenced by sync schema");
      const m = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(w, n, t)}`), M(n), D || f.assign(m, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${K.ValidationError})`, () => f.throw(p)), d(p), D || f.assign(m, !1);
      }), w.ok(m);
    }
    function c() {
      w.result((0, e.callValidateCode)(w, n, t), () => M(n), () => d(n));
    }
    function d(m) {
      const p = (0, r._)`${m}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${p} : ${o.default.vErrors}.concat(${p})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(m) {
      var p;
      if (!K.opts.unevaluated)
        return;
      const O = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (K.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (K.props = i.mergeEvaluated.props(f, O.props, K.props));
        else {
          const j = f.var("props", (0, r._)`${m}.evaluated.props`);
          K.props = i.mergeEvaluated.props(f, j, K.props, r.Name);
        }
      if (K.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (K.items = i.mergeEvaluated.items(f, O.items, K.items));
        else {
          const j = f.var("items", (0, r._)`${m}.evaluated.items`);
          K.items = i.mergeEvaluated.items(f, j, K.items, r.Name);
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
    message: ({ keyword: i, schemaCode: B }) => (0, A.str)`must be ${r[i].okStr} ${B}`,
    params: ({ keyword: i, schemaCode: B }) => (0, A._)`{comparison: ${r[i].okStr}, limit: ${B}}`
  }, Q = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: o,
    code(i) {
      const { keyword: B, data: s, schemaCode: a } = i;
      i.fail$data((0, A._)`${s} ${r[B].fail} ${a} || isNaN(${s})`);
    }
  };
  return limitNumber.default = Q, limitNumber;
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
      const { gen: Q, data: i, schemaCode: B, it: s } = o, a = s.opts.multipleOfPrecision, w = Q.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${w}) - ${w}) > 1e-${a}` : (0, A._)`${w} !== parseInt(${w})`;
      o.fail$data((0, A._)`(${B} === 0 || (${w} = ${i}/${B}, ${n}))`);
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
    let o = 0, Q = 0, i;
    for (; Q < r; )
      o++, i = e.charCodeAt(Q++), i >= 55296 && i <= 56319 && Q < r && (i = e.charCodeAt(Q), (i & 64512) === 56320 && Q++);
    return o;
  }
  return ucs2length.default = A, A.code = 'require("ajv/dist/runtime/ucs2length").default', ucs2length;
}
var hasRequiredLimitLength;
function requireLimitLength() {
  if (hasRequiredLimitLength) return limitLength;
  hasRequiredLimitLength = 1, Object.defineProperty(limitLength, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireUcs2length(), Q = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: i, schemaCode: B }) {
        const s = i === "maxLength" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${s} than ${B} characters`;
      },
      params: ({ schemaCode: i }) => (0, A._)`{limit: ${i}}`
    },
    code(i) {
      const { keyword: B, data: s, schemaCode: a, it: w } = i, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = w.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(i.gen, r.default)}(${s})`;
      i.fail$data((0, A._)`${E} ${n} ${a}`);
    }
  };
  return limitLength.default = Q, limitLength;
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
      message: ({ schemaCode: Q }) => (0, e.str)`must match pattern "${Q}"`,
      params: ({ schemaCode: Q }) => (0, e._)`{pattern: ${Q}}`
    },
    code(Q) {
      const { data: i, $data: B, schema: s, schemaCode: a, it: w } = Q, n = w.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(Q, s);
      Q.fail$data((0, e._)`!${E}.test(${i})`);
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
      message({ keyword: o, schemaCode: Q }) {
        const i = o === "maxProperties" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${i} than ${Q} properties`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: Q, data: i, schemaCode: B } = o, s = Q === "maxProperties" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`Object.keys(${i}).length ${s} ${B}`);
    }
  };
  return limitProperties.default = r, limitProperties;
}
var required = {}, hasRequiredRequired;
function requireRequired() {
  if (hasRequiredRequired) return required;
  hasRequiredRequired = 1, Object.defineProperty(required, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), Q = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: i } }) => (0, e.str)`must have required property '${i}'`,
      params: ({ params: { missingProperty: i } }) => (0, e._)`{missingProperty: ${i}}`
    },
    code(i) {
      const { gen: B, schema: s, schemaCode: a, data: w, $data: n, it: E } = i, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? K() : D(), l.strictRequired) {
        const t = i.parentSchema.properties, { definedProperties: C } = i.it;
        for (const c of s)
          if (t?.[c] === void 0 && !C.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function K() {
        if (f || n)
          i.block$data(e.nil, g);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(i, t);
      }
      function D() {
        const t = B.let("missing");
        if (f || n) {
          const C = B.let("valid", !0);
          i.block$data(C, () => I(t, C)), i.ok(C);
        } else
          B.if((0, A.checkMissingProp)(i, s, t)), (0, A.reportMissingProp)(i, t), B.else();
      }
      function g() {
        B.forOf("prop", a, (t) => {
          i.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, w, t, l.ownProperties), () => i.error());
        });
      }
      function I(t, C) {
        i.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(C, (0, A.propertyInData)(B, w, t, l.ownProperties)), B.if((0, e.not)(C), () => {
            i.error(), B.break();
          });
        }, e.nil);
      }
    }
  };
  return required.default = Q, required;
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
      message({ keyword: o, schemaCode: Q }) {
        const i = o === "maxItems" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${i} than ${Q} items`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: Q, data: i, schemaCode: B } = o, s = Q === "maxItems" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`${i}.length ${s} ${B}`);
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
  const A = requireDataType(), e = requireCodegen(), r = requireUtil(), o = requireEqual(), i = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: B, j: s } }) => (0, e.str)`must NOT have duplicate items (items ## ${s} and ${B} are identical)`,
      params: ({ params: { i: B, j: s } }) => (0, e._)`{i: ${B}, j: ${s}}`
    },
    code(B) {
      const { gen: s, data: a, $data: w, schema: n, parentSchema: E, schemaCode: l, it: f } = B;
      if (!w && !n)
        return;
      const K = s.let("valid"), D = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(K, g, (0, e._)`${l} === false`), B.ok(K);
      function g() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(K, !0), s.if((0, e._)`${c} > 1`, () => (I() ? t : C)(c, d));
      }
      function I() {
        return D.length > 0 && !D.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), m = (0, A.checkDataTypes)(D, M, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(m, (0, e._)`continue`), D.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${p}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${M}]`), B.error(), s.assign(K, !1).break();
          }).code((0, e._)`${p}[${M}] = ${c}`);
        });
      }
      function C(c, d) {
        const M = (0, r.useFunc)(s, o.default), m = s.name("outer");
        s.label(m).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(K, !1).break(m);
        })));
      }
    }
  };
  return uniqueItems.default = i, uniqueItems;
}
var _const = {}, hasRequired_const;
function require_const() {
  if (hasRequired_const) return _const;
  hasRequired_const = 1, Object.defineProperty(_const, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), Q = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: i }) => (0, A._)`{allowedValue: ${i}}`
    },
    code(i) {
      const { gen: B, data: s, $data: a, schemaCode: w, schema: n } = i;
      a || n && typeof n == "object" ? i.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${w})`) : i.fail((0, A._)`${n} !== ${s}`);
    }
  };
  return _const.default = Q, _const;
}
var _enum = {}, hasRequired_enum;
function require_enum() {
  if (hasRequired_enum) return _enum;
  hasRequired_enum = 1, Object.defineProperty(_enum, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), Q = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: i }) => (0, A._)`{allowedValues: ${i}}`
    },
    code(i) {
      const { gen: B, data: s, $data: a, schema: w, schemaCode: n, it: E } = i;
      if (!a && w.length === 0)
        throw new Error("enum must have non-empty array");
      const l = w.length >= E.opts.loopEnum;
      let f;
      const K = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let D;
      if (l || a)
        D = B.let("valid"), i.block$data(D, g);
      else {
        if (!Array.isArray(w))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        D = (0, A.or)(...w.map((C, c) => I(t, c)));
      }
      i.pass(D);
      function g() {
        B.assign(D, !1), B.forOf("v", n, (t) => B.if((0, A._)`${K()}(${s}, ${t})`, () => B.assign(D, !0).break()));
      }
      function I(t, C) {
        const c = w[C];
        return typeof c == "object" && c !== null ? (0, A._)`${K()}(${s}, ${t}[${C}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = Q, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), Q = requireLimitProperties(), i = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), w = require_enum(), n = [
    // number
    A.default,
    e.default,
    // string
    r.default,
    o.default,
    // object
    Q.default,
    i.default,
    // array
    B.default,
    s.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    a.default,
    w.default
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
      message: ({ params: { len: i } }) => (0, A.str)`must NOT have more than ${i} items`,
      params: ({ params: { len: i } }) => (0, A._)`{limit: ${i}}`
    },
    code(i) {
      const { parentSchema: B, it: s } = i, { items: a } = B;
      if (!Array.isArray(a)) {
        (0, e.checkStrictMode)(s, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      Q(i, a);
    }
  };
  function Q(i, B) {
    const { gen: s, schema: a, data: w, keyword: n, it: E } = i;
    E.items = !0;
    const l = s.const("len", (0, A._)`${w}.length`);
    if (a === !1)
      i.setParams({ len: B.length }), i.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const K = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(K), () => f(K)), i.ok(K);
    }
    function f(K) {
      s.forRange("i", B.length, l, (D) => {
        i.subschema({ keyword: n, dataProp: D, dataPropType: e.Type.Num }, K), E.allErrors || s.if((0, A.not)(K), () => s.break());
      });
    }
  }
  return additionalItems.validateAdditionalItems = Q, additionalItems.default = o, additionalItems;
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
    code(i) {
      const { schema: B, it: s } = i;
      if (Array.isArray(B))
        return Q(i, "additionalItems", B);
      s.items = !0, !(0, e.alwaysValidSchema)(s, B) && i.ok((0, r.validateArray)(i));
    }
  };
  function Q(i, B, s = i.schema) {
    const { gen: a, parentSchema: w, data: n, keyword: E, it: l } = i;
    D(w), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), K = a.const("len", (0, A._)`${n}.length`);
    s.forEach((g, I) => {
      (0, e.alwaysValidSchema)(l, g) || (a.if((0, A._)`${K} > ${I}`, () => i.subschema({
        keyword: E,
        schemaProp: I,
        dataProp: I
      }, f)), i.ok(f));
    });
    function D(g) {
      const { opts: I, errSchemaPath: t } = l, C = s.length, c = C === g.minItems && (C === g.maxItems || g[B] === !1);
      if (I.strictTuples && !c) {
        const d = `"${E}" is ${C}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, I.strictTuples);
      }
    }
  }
  return items.validateTuple = Q, items.default = o, items;
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
  const A = requireCodegen(), e = requireUtil(), r = requireCode(), o = requireAdditionalItems(), i = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: B } }) => (0, A.str)`must NOT have more than ${B} items`,
      params: ({ params: { len: B } }) => (0, A._)`{limit: ${B}}`
    },
    code(B) {
      const { schema: s, parentSchema: a, it: w } = B, { prefixItems: n } = a;
      w.items = !0, !(0, e.alwaysValidSchema)(w, s) && (n ? (0, o.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
    }
  };
  return items2020.default = i, items2020;
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
      message: ({ params: { min: Q, max: i } }) => i === void 0 ? (0, A.str)`must contain at least ${Q} valid item(s)` : (0, A.str)`must contain at least ${Q} and no more than ${i} valid item(s)`,
      params: ({ params: { min: Q, max: i } }) => i === void 0 ? (0, A._)`{minContains: ${Q}}` : (0, A._)`{minContains: ${Q}, maxContains: ${i}}`
    },
    code(Q) {
      const { gen: i, schema: B, parentSchema: s, data: a, it: w } = Q;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      w.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const K = i.const("len", (0, A._)`${a}.length`);
      if (Q.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(w, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(w, '"minContains" > "maxContains" is always invalid'), Q.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(w, B)) {
        let C = (0, A._)`${K} >= ${n}`;
        E !== void 0 && (C = (0, A._)`${C} && ${K} <= ${E}`), Q.pass(C);
        return;
      }
      w.items = !0;
      const D = i.name("valid");
      E === void 0 && n === 1 ? I(D, () => i.if(D, () => i.break())) : n === 0 ? (i.let(D, !0), E !== void 0 && i.if((0, A._)`${a}.length > 0`, g)) : (i.let(D, !1), g()), Q.result(D, () => Q.reset());
      function g() {
        const C = i.name("_valid"), c = i.let("count", 0);
        I(C, () => i.if(C, () => t(c)));
      }
      function I(C, c) {
        i.forRange("i", 0, K, (d) => {
          Q.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, C), c();
        });
      }
      function t(C) {
        i.code((0, A._)`${C}++`), E === void 0 ? i.if((0, A._)`${C} >= ${n}`, () => i.assign(D, !0).break()) : (i.if((0, A._)`${C} > ${E}`, () => i.assign(D, !1).break()), n === 1 ? i.assign(D, !0) : i.if((0, A._)`${C} >= ${n}`, () => i.assign(D, !0)));
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
      message: ({ params: { property: a, depsCount: w, deps: n } }) => {
        const E = w === 1 ? "property" : "properties";
        return (0, e.str)`must have ${E} ${n} when property ${a} is present`;
      },
      params: ({ params: { property: a, depsCount: w, deps: n, missingProperty: E } }) => (0, e._)`{property: ${a},
    missingProperty: ${E},
    depsCount: ${w},
    deps: ${n}}`
      // TODO change to reference
    };
    const Q = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [w, n] = i(a);
        B(a, w), s(a, n);
      }
    };
    function i({ schema: a }) {
      const w = {}, n = {};
      for (const E in a) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(a[E]) ? w : n;
        l[E] = a[E];
      }
      return [w, n];
    }
    function B(a, w = a.schema) {
      const { gen: n, data: E, it: l } = a;
      if (Object.keys(w).length === 0)
        return;
      const f = n.let("missing");
      for (const K in w) {
        const D = w[K];
        if (D.length === 0)
          continue;
        const g = (0, o.propertyInData)(n, E, K, l.opts.ownProperties);
        a.setParams({
          property: K,
          depsCount: D.length,
          deps: D.join(", ")
        }), l.allErrors ? n.if(g, () => {
          for (const I of D)
            (0, o.checkReportMissingProp)(a, I);
        }) : (n.if((0, e._)`${g} && (${(0, o.checkMissingProp)(a, D, f)})`), (0, o.reportMissingProp)(a, f), n.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, w = a.schema) {
      const { gen: n, data: E, keyword: l, it: f } = a, K = n.name("valid");
      for (const D in w)
        (0, r.alwaysValidSchema)(f, w[D]) || (n.if(
          (0, o.propertyInData)(n, E, D, f.opts.ownProperties),
          () => {
            const g = a.subschema({ keyword: l, schemaProp: D }, K);
            a.mergeValidEvaluated(g, K);
          },
          () => n.var(K, !0)
          // TODO var
        ), a.ok(K));
    }
    A.validateSchemaDeps = s, A.default = Q;
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
      params: ({ params: Q }) => (0, A._)`{propertyName: ${Q.propertyName}}`
    },
    code(Q) {
      const { gen: i, schema: B, data: s, it: a } = Q;
      if ((0, e.alwaysValidSchema)(a, B))
        return;
      const w = i.name("valid");
      i.forIn("key", s, (n) => {
        Q.setParams({ propertyName: n }), Q.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, w), i.if((0, A.not)(w), () => {
          Q.error(!0), a.allErrors || i.break();
        });
      }), Q.ok(w);
    }
  };
  return propertyNames.default = o, propertyNames;
}
var additionalProperties = {}, hasRequiredAdditionalProperties;
function requireAdditionalProperties() {
  if (hasRequiredAdditionalProperties) return additionalProperties;
  hasRequiredAdditionalProperties = 1, Object.defineProperty(additionalProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireNames(), o = requireUtil(), i = {
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
      const { gen: s, schema: a, parentSchema: w, data: n, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: K } = l;
      if (l.props = !0, K.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const D = (0, A.allSchemaProperties)(w.properties), g = (0, A.allSchemaProperties)(w.patternProperties);
      I(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function I() {
        s.forIn("key", n, (M) => {
          !D.length && !g.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let m;
        if (D.length > 8) {
          const p = (0, o.schemaRefOrVal)(l, w.properties, "properties");
          m = (0, A.isOwnProperty)(s, p, M);
        } else D.length ? m = (0, e.or)(...D.map((p) => (0, e._)`${M} === ${p}`)) : m = e.nil;
        return g.length && (m = (0, e.or)(m, ...g.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${M})`))), (0, e.not)(m);
      }
      function C(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (K.removeAdditional === "all" || K.removeAdditional && a === !1) {
          C(M);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const m = s.name("valid");
          K.removeAdditional === "failing" ? (d(M, m, !1), s.if((0, e.not)(m), () => {
            B.reset(), C(M);
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
  return additionalProperties.default = i, additionalProperties;
}
var properties$1 = {}, hasRequiredProperties;
function requireProperties() {
  if (hasRequiredProperties) return properties$1;
  hasRequiredProperties = 1, Object.defineProperty(properties$1, "__esModule", { value: !0 });
  const A = requireValidate(), e = requireCode(), r = requireUtil(), o = requireAdditionalProperties(), Q = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(i) {
      const { gen: B, schema: s, parentSchema: a, data: w, it: n } = i;
      n.opts.removeAdditional === "all" && a.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(n, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const g of E)
        n.definedProperties.add(g);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), n.props));
      const l = E.filter((g) => !(0, r.alwaysValidSchema)(n, s[g]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const g of l)
        K(g) ? D(g) : (B.if((0, e.propertyInData)(B, w, g, n.opts.ownProperties)), D(g), n.allErrors || B.else().var(f, !0), B.endIf()), i.it.definedProperties.add(g), i.ok(f);
      function K(g) {
        return n.opts.useDefaults && !n.compositeRule && s[g].default !== void 0;
      }
      function D(g) {
        i.subschema({
          keyword: "properties",
          schemaProp: g,
          dataProp: g
        }, f);
      }
    }
  };
  return properties$1.default = Q, properties$1;
}
var patternProperties = {}, hasRequiredPatternProperties;
function requirePatternProperties() {
  if (hasRequiredPatternProperties) return patternProperties;
  hasRequiredPatternProperties = 1, Object.defineProperty(patternProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), o = requireUtil(), Q = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(i) {
      const { gen: B, schema: s, data: a, parentSchema: w, it: n } = i, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const K = E.strictSchema && !E.allowMatchingProperties && w.properties, D = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, o.evaluatedPropsToName)(B, n.props));
      const { props: g } = n;
      I();
      function I() {
        for (const c of l)
          K && t(c), n.allErrors ? C(c) : (B.var(D, !0), C(c), B.if(D));
      }
      function t(c) {
        for (const d in K)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function C(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(i, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || i.subschema({
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
  return patternProperties.default = Q, patternProperties;
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
      const { gen: o, schema: Q, it: i } = r;
      if ((0, A.alwaysValidSchema)(i, Q)) {
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
      params: ({ params: Q }) => (0, A._)`{passingSchemas: ${Q.passing}}`
    },
    code(Q) {
      const { gen: i, schema: B, parentSchema: s, it: a } = Q;
      if (!Array.isArray(B))
        throw new Error("ajv implementation error");
      if (a.opts.discriminator && s.discriminator)
        return;
      const w = B, n = i.let("valid", !1), E = i.let("passing", null), l = i.name("_valid");
      Q.setParams({ passing: E }), i.block(f), Q.result(n, () => Q.reset(), () => Q.error(!0));
      function f() {
        w.forEach((K, D) => {
          let g;
          (0, e.alwaysValidSchema)(a, K) ? i.var(l, !0) : g = Q.subschema({
            keyword: "oneOf",
            schemaProp: D,
            compositeRule: !0
          }, l), D > 0 && i.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${D}]`).else(), i.if(l, () => {
            i.assign(n, !0), i.assign(E, D), g && Q.mergeEvaluated(g, A.Name);
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
      const { gen: o, schema: Q, it: i } = r;
      if (!Array.isArray(Q))
        throw new Error("ajv implementation error");
      const B = o.name("valid");
      Q.forEach((s, a) => {
        if ((0, A.alwaysValidSchema)(i, s))
          return;
        const w = r.subschema({ keyword: "allOf", schemaProp: a }, B);
        r.ok(B), r.mergeEvaluated(w);
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
      message: ({ params: i }) => (0, A.str)`must match "${i.ifClause}" schema`,
      params: ({ params: i }) => (0, A._)`{failingKeyword: ${i.ifClause}}`
    },
    code(i) {
      const { gen: B, parentSchema: s, it: a } = i;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const w = Q(a, "then"), n = Q(a, "else");
      if (!w && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), i.reset(), w && n) {
        const D = B.let("ifClause");
        i.setParams({ ifClause: D }), B.if(l, K("then", D), K("else", D));
      } else w ? B.if(l, K("then")) : B.if((0, A.not)(l), K("else"));
      i.pass(E, () => i.error(!0));
      function f() {
        const D = i.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        i.mergeEvaluated(D);
      }
      function K(D, g) {
        return () => {
          const I = i.subschema({ keyword: D }, l);
          B.assign(E, l), i.mergeValidEvaluated(I, E), g ? B.assign(g, (0, A._)`${D}`) : i.setParams({ ifClause: D });
        };
      }
    }
  };
  function Q(i, B) {
    const s = i.schema[B];
    return s !== void 0 && !(0, e.alwaysValidSchema)(i, s);
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
    code({ keyword: r, parentSchema: o, it: Q }) {
      o.if === void 0 && (0, A.checkStrictMode)(Q, `"${r}" without "if" is ignored`);
    }
  };
  return thenElse.default = e, thenElse;
}
var hasRequiredApplicator;
function requireApplicator() {
  if (hasRequiredApplicator) return applicator;
  hasRequiredApplicator = 1, Object.defineProperty(applicator, "__esModule", { value: !0 });
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), Q = requireContains(), i = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), w = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), K = require_if(), D = requireThenElse();
  function g(I = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      K.default,
      D.default,
      // object
      B.default,
      s.default,
      i.default,
      a.default,
      w.default
    ];
    return I ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(Q.default), t;
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
    code(o, Q) {
      const { gen: i, data: B, $data: s, schema: a, schemaCode: w, it: n } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: K } = n;
      if (!E.validateFormats)
        return;
      s ? D() : g();
      function D() {
        const I = i.scopeValue("formats", {
          ref: K.formats,
          code: E.code.formats
        }), t = i.const("fDef", (0, A._)`${I}[${w}]`), C = i.let("fType"), c = i.let("format");
        i.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => i.assign(C, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => i.assign(C, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${w} && !${c}`;
        }
        function M() {
          const m = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, p = (0, A._)`(typeof ${c} == "function" ? ${m} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${C} === ${Q} && !${p}`;
        }
      }
      function g() {
        const I = K.formats[a];
        if (!I) {
          d();
          return;
        }
        if (I === !0)
          return;
        const [t, C, c] = M(I);
        t === Q && o.pass(m());
        function d() {
          if (E.strictSchema === !1) {
            K.logger.warn(p());
            return;
          }
          throw new Error(p());
          function p() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function M(p) {
          const O = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, j = i.scopeValue("formats", { key: a, ref: p, code: O });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${j}.validate`] : ["string", p, j];
        }
        function m() {
          if (typeof I == "object" && !(I instanceof RegExp) && I.async) {
            if (!f.$async)
              throw new Error("async format in sync schema");
            return (0, A._)`await ${c}(${B})`;
          }
          return typeof C == "function" ? (0, A._)`${c}(${B})` : (0, A._)`${c}.test(${B})`;
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
  const A = requireCore(), e = requireValidation(), r = requireApplicator(), o = requireFormat(), Q = requireMetadata(), i = [
    A.default,
    e.default,
    (0, r.default)(),
    o.default,
    Q.metadataVocabulary,
    Q.contentVocabulary
  ];
  return draft7.default = i, draft7;
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
  const A = requireCodegen(), e = requireTypes(), r = requireCompile(), o = requireRef_error(), Q = requireUtil(), B = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: s, tagName: a } }) => s === e.DiscrError.Tag ? `tag "${a}" must be string` : `value of tag "${a}" must be in oneOf`,
      params: ({ params: { discrError: s, tag: a, tagName: w } }) => (0, A._)`{error: ${s}, tag: ${w}, tagValue: ${a}}`
    },
    code(s) {
      const { gen: a, data: w, schema: n, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const K = n.propertyName;
      if (typeof K != "string")
        throw new Error("discriminator: requires propertyName");
      if (n.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const D = a.let("valid", !1), g = a.const("tag", (0, A._)`${w}${(0, A.getProperty)(K)}`);
      a.if((0, A._)`typeof ${g} == "string"`, () => I(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: g, tagName: K })), s.ok(D);
      function I() {
        const c = C();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${g} === ${d}`), a.assign(D, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: g, tagName: K }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function C() {
        var c;
        const d = {}, M = p(E);
        let m = !0;
        for (let z = 0; z < f.length; z++) {
          let U = f[z];
          if (U?.$ref && !(0, Q.schemaHasRulesButRef)(U, l.self.RULES)) {
            const J = U.$ref;
            if (U = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, J), U instanceof r.SchemaEnv && (U = U.schema), U === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, J);
          }
          const L = (c = U?.properties) === null || c === void 0 ? void 0 : c[K];
          if (typeof L != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${K}"`);
          m = m && (M || p(U)), O(L, z);
        }
        if (!m)
          throw new Error(`discriminator: "${K}" must be required`);
        return d;
        function p({ required: z }) {
          return Array.isArray(z) && z.includes(K);
        }
        function O(z, U) {
          if (z.const)
            j(z.const, U);
          else if (z.enum)
            for (const L of z.enum)
              j(L, U);
          else
            throw new Error(`discriminator: "properties/${K}" must have "const" or "enum"`);
        }
        function j(z, U) {
          if (typeof z != "string" || z in d)
            throw new Error(`discriminator: "${K}" values must be unique strings`);
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
    const r = requireCore$1(), o = requireDraft7(), Q = requireDiscriminator(), i = require$$3, B = ["/properties"], s = "http://json-schema.org/draft-07/schema";
    class a extends r.default {
      _addVocabularies() {
        super._addVocabularies(), o.default.forEach((K) => this.addVocabulary(K)), this.opts.discriminator && this.addKeyword(Q.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const K = this.opts.$data ? this.$dataMetaSchema(i, B) : i;
        this.addMetaSchema(K, s, !1), this.refs["http://json-schema.org/schema"] = s;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(s) ? s : void 0);
      }
    }
    e.Ajv = a, A.exports = e = a, A.exports.Ajv = a, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = a;
    var w = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return w.KeywordCxt;
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
  function Q(i) {
    return i instanceof r ? i : new r(function(B) {
      B(i);
    });
  }
  return new (r || (r = Promise))(function(i, B) {
    function s(n) {
      try {
        w(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    w((o = o.apply(A, [])).next());
  });
}
function __generator(A, e) {
  var r = { label: 0, sent: function() {
    if (i[0] & 1) throw i[1];
    return i[1];
  }, trys: [], ops: [] }, o, Q, i, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, Q && (i = w[0] & 2 ? Q.return : w[0] ? Q.throw || ((i = Q.return) && i.call(Q), 0) : Q.next) && !(i = i.call(Q, w[1])).done) return i;
      switch (Q = 0, i && (w = [w[0] & 2, i.value]), w[0]) {
        case 0:
        case 1:
          i = w;
          break;
        case 4:
          return r.label++, { value: w[1], done: !1 };
        case 5:
          r.label++, Q = w[1], w = [0];
          continue;
        case 7:
          w = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (i = r.trys, !(i = i.length > 0 && i[i.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!i || w[1] > i[0] && w[1] < i[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < i[1]) {
            r.label = i[1], i = w;
            break;
          }
          if (i && r.label < i[2]) {
            r.label = i[2], r.ops.push(w);
            break;
          }
          i[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], Q = 0;
    } finally {
      o = i = 0;
    }
    if (w[0] & 5) throw w[1];
    return { value: w[0] ? w[1] : void 0, done: !0 };
  }
}
function __read(A, e) {
  var r = typeof Symbol == "function" && A[Symbol.iterator];
  if (!r) return A;
  var o = r.call(A), Q, i = [], B;
  try {
    for (; (e === void 0 || e-- > 0) && !(Q = o.next()).done; ) i.push(Q.value);
  } catch (s) {
    B = { error: s };
  } finally {
    try {
      Q && !Q.done && (r = o.return) && r.call(o);
    } finally {
      if (B) throw B.error;
    }
  }
  return i;
}
function __spreadArray(A, e, r) {
  if (arguments.length === 2) for (var o = 0, Q = e.length, i; o < Q; o++)
    (i || !(o in e)) && (i || (i = Array.prototype.slice.call(e, 0, o)), i[o] = e[o]);
  return A.concat(i || Array.prototype.slice.call(e));
}
var defaultErrorConfig = {
  withStackTrace: !1
}, createNeverThrowError = function(A, e, r) {
  r === void 0 && (r = defaultErrorConfig);
  var o = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, Q = r.withStackTrace ? new Error().stack : void 0;
  return {
    data: o,
    message: A,
    stack: Q
  };
}, Result;
(function(A) {
  function e(r, o) {
    return function() {
      for (var Q = [], i = 0; i < arguments.length; i++)
        Q[i] = arguments[i];
      try {
        var B = r.apply(void 0, __spreadArray([], __read(Q), !1));
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
      var o = e.then(function(Q) {
        return new Ok(Q);
      }).catch(function(Q) {
        return new Err(r(Q));
      });
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var Q;
          return __generator(this, function(i) {
            switch (i.label) {
              case 0:
                return o.isErr() ? [2, new Err(o.error)] : (Q = Ok.bind, [4, e(o.value)]);
              case 1:
                return [2, new (Q.apply(Ok, [void 0, i.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var Q;
          return __generator(this, function(i) {
            switch (i.label) {
              case 0:
                return o.isOk() ? [2, new Ok(o.value)] : (Q = Err.bind, [4, e(o.error)]);
              case 1:
                return [2, new (Q.apply(Err, [void 0, i.sent()]))()];
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
          return __generator(this, function(Q) {
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
  const Q = callVisitor(A, e, r, o);
  if (isNode(Q) || isPair(Q))
    return replaceNode(A, o, Q), visit_(A, Q, r, o);
  if (typeof Q != "symbol") {
    if (isCollection(e)) {
      o = Object.freeze(o.concat(e));
      for (let i = 0; i < e.items.length; ++i) {
        const B = visit_(i, e.items[i], r, o);
        if (typeof B == "number")
          i = B - 1;
        else {
          if (B === BREAK)
            return BREAK;
          B === REMOVE && (e.items.splice(i, 1), i -= 1);
        }
      }
    } else if (isPair(e)) {
      o = Object.freeze(o.concat(e));
      const i = visit_("key", e.key, r, o);
      if (i === BREAK)
        return BREAK;
      i === REMOVE && (e.key = null);
      const B = visit_("value", e.value, r, o);
      if (B === BREAK)
        return BREAK;
      B === REMOVE && (e.value = null);
    }
  }
  return Q;
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
    const Q = isAlias(o) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${Q} parent`);
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
      for (let Q = 0, i = o.length; Q < i; ++Q) {
        const B = o[Q], s = applyReviver(A, o, String(Q), B);
        s === void 0 ? delete o[Q] : s !== B && (o[Q] = s);
      }
    else if (o instanceof Map)
      for (const Q of Array.from(o.keys())) {
        const i = o.get(Q), B = applyReviver(A, o, Q, i);
        B === void 0 ? o.delete(Q) : B !== i && o.set(Q, B);
      }
    else if (o instanceof Set)
      for (const Q of Array.from(o)) {
        const i = applyReviver(A, o, Q, Q);
        i === void 0 ? o.delete(Q) : i !== Q && (o.delete(Q), o.add(i));
      }
    else
      for (const [Q, i] of Object.entries(o)) {
        const B = applyReviver(A, o, Q, i);
        B === void 0 ? delete o[Q] : B !== i && (o[Q] = B);
      }
  return A.call(e, r, o);
}
function toJS(A, e, r) {
  if (Array.isArray(A))
    return A.map((o, Q) => toJS(o, String(Q), r));
  if (A && typeof A.toJSON == "function") {
    if (!r || !hasAnchor(A))
      return A.toJSON(e, r);
    const o = { aliasCount: 0, count: 1, res: void 0 };
    r.anchors.set(A, o), r.onCreate = (i) => {
      o.res = i, delete r.onCreate;
    };
    const Q = A.toJSON(e, r);
    return r.onCreate && r.onCreate(Q), Q;
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
  toJS(e, { mapAsMap: r, maxAliasCount: o, onAnchor: Q, reviver: i } = {}) {
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
    if (typeof Q == "function")
      for (const { count: a, res: w } of B.anchors.values())
        Q(w, a);
    return typeof i == "function" ? applyReviver(i, { "": s }, "", s) : s;
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
      Node: (o, Q) => {
        if (Q === this)
          return visit.BREAK;
        Q.anchor === this.source && (r = Q);
      }
    }), r;
  }
  toJSON(e, r) {
    if (!r)
      return { source: this.source };
    const { anchors: o, doc: Q, maxAliasCount: i } = r, B = this.resolve(Q);
    if (!B) {
      const a = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(a);
    }
    let s = o.get(B);
    if (s || (toJS(B, null, r), s = o.get(B)), !s || s.res === void 0) {
      const a = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(a);
    }
    if (i >= 0 && (s.count += 1, s.aliasCount === 0 && (s.aliasCount = getAliasCount(Q, B, o)), s.count * s.aliasCount > i)) {
      const a = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(a);
    }
    return s.res;
  }
  toString(e, r, o) {
    const Q = `*${this.source}`;
    if (e) {
      if (anchorIsValid(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const i = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(i);
      }
      if (e.implicitKey)
        return `${Q} `;
    }
    return Q;
  }
}
function getAliasCount(A, e, r) {
  if (isAlias(e)) {
    const o = e.resolve(A), Q = r && o && r.get(o);
    return Q ? Q.count * Q.aliasCount : 0;
  } else if (isCollection(e)) {
    let o = 0;
    for (const Q of e.items) {
      const i = getAliasCount(A, Q, r);
      i > o && (o = i);
    }
    return o;
  } else if (isPair(e)) {
    const o = getAliasCount(A, e.key, r), Q = getAliasCount(A, e.value, r);
    return Math.max(o, Q);
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
  const { aliasDuplicateObjects: o, onAnchor: Q, onTagObj: i, schema: B, sourceObjects: s } = r;
  let a;
  if (o && A && typeof A == "object") {
    if (a = s.get(A), a)
      return a.anchor || (a.anchor = Q(A)), new Alias(a.anchor);
    a = { anchor: null, node: null }, s.set(A, a);
  }
  let w = findTagObject(A, e, B.tags);
  if (!w) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    w = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  i && (i(w), delete r.onTagObj);
  const n = w?.createNode ? w.createNode(r.schema, A, r) : typeof w?.nodeClass?.from == "function" ? w.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return w.default || (n.tag = w.tag), a && (a.node = n), n;
}
function collectionFromPath(A, e, r) {
  let o = r;
  for (let Q = e.length - 1; Q >= 0; --Q) {
    const i = e[Q];
    if (typeof i == "number" && Number.isInteger(i) && i >= 0) {
      const B = [];
      B[i] = o, o = B;
    } else
      o = /* @__PURE__ */ new Map([[i, o]]);
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
      const [o, ...Q] = e, i = this.get(o, !0);
      if (isCollection(i))
        i.addIn(Q, r);
      else if (i === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, Q, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${Q}`);
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
    const Q = this.get(r, !0);
    if (isCollection(Q))
      return Q.deleteIn(o);
    throw new Error(`Expected YAML collection at ${r}. Remaining path: ${o}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, r) {
    const [o, ...Q] = e, i = this.get(o, !0);
    return Q.length === 0 ? !r && isScalar(i) ? i.value : i : isCollection(i) ? i.getIn(Q, r) : void 0;
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
    const Q = this.get(r, !0);
    return isCollection(Q) ? Q.hasIn(o) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, r) {
    const [o, ...Q] = e;
    if (Q.length === 0)
      this.set(o, r);
    else {
      const i = this.get(o, !0);
      if (isCollection(i))
        i.setIn(Q, r);
      else if (i === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, Q, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${Q}`);
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
function foldFlowLines(A, e, r = "flow", { indentAtStart: o, lineWidth: Q = 80, minContentWidth: i = 20, onFold: B, onOverflow: s } = {}) {
  if (!Q || Q < 0)
    return A;
  Q < i && (i = 0);
  const a = Math.max(1 + i, 1 + Q - e.length);
  if (A.length <= a)
    return A;
  const w = [], n = {};
  let E = Q - e.length;
  typeof o == "number" && (o > Q - Math.max(2, i) ? w.push(0) : E = Q - o);
  let l, f, K = !1, D = -1, g = -1, I = -1;
  r === FOLD_BLOCK && (D = consumeMoreIndentedLines(A, D, e.length), D !== -1 && (E = D + a));
  for (let C; C = A[D += 1]; ) {
    if (r === FOLD_QUOTED && C === "\\") {
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
      I = D;
    }
    if (C === `
`)
      r === FOLD_BLOCK && (D = consumeMoreIndentedLines(A, D, e.length)), E = D + e.length + a, l = void 0;
    else {
      if (C === " " && f && f !== " " && f !== `
` && f !== "	") {
        const c = A[D + 1];
        c && c !== " " && c !== `
` && c !== "	" && (l = D);
      }
      if (D >= E)
        if (l)
          w.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = C, C = A[D += 1], K = !0;
          const c = D > I + 1 ? D - 2 : g - 1;
          if (n[c])
            return A;
          w.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          K = !0;
    }
    f = C;
  }
  if (K && s && s(), w.length === 0)
    return A;
  B && B();
  let t = A.slice(0, w[0]);
  for (let C = 0; C < w.length; ++C) {
    const c = w[C], d = w[C + 1] || A.length;
    c === 0 ? t = `
${e}${A.slice(0, d)}` : (r === FOLD_QUOTED && n[c] && (t += `${A[c]}\\`), t += `
${e}${A.slice(c + 1, d)}`);
  }
  return t;
}
function consumeMoreIndentedLines(A, e, r) {
  let o = e, Q = e + 1, i = A[Q];
  for (; i === " " || i === "	"; )
    if (e < Q + r)
      i = A[++e];
    else {
      do
        i = A[++e];
      while (i && i !== `
`);
      o = e, Q = e + 1, i = A[Q];
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
  const o = e - r, Q = A.length;
  if (Q <= o)
    return !1;
  for (let i = 0, B = 0; i < Q; ++i)
    if (A[i] === `
`) {
      if (i - B > o)
        return !0;
      if (B = i + 1, Q - B <= o)
        return !1;
    }
  return !0;
}
function doubleQuotedString(A, e) {
  const r = JSON.stringify(A);
  if (e.options.doubleQuotedAsJSON)
    return r;
  const { implicitKey: o } = e, Q = e.options.doubleQuotedMinMultiLineLength, i = e.indent || (containsDocumentMarker(A) ? "  " : "");
  let B = "", s = 0;
  for (let a = 0, w = r[a]; w; w = r[++a])
    if (w === " " && r[a + 1] === "\\" && r[a + 2] === "n" && (B += r.slice(s, a) + "\\ ", a += 1, s = a, w = "\\"), w === "\\")
      switch (r[a + 1]) {
        case "u":
          {
            B += r.slice(s, a);
            const n = r.substr(a + 2, 4);
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
                n.substr(0, 2) === "00" ? B += "\\x" + n.substr(2) : B += r.substr(a, 6);
            }
            a += 5, s = a + 1;
          }
          break;
        case "n":
          if (o || r[a + 2] === '"' || r.length < Q)
            a += 1;
          else {
            for (B += r.slice(s, a) + `

`; r[a + 2] === "\\" && r[a + 3] === "n" && r[a + 4] !== '"'; )
              B += `
`, a += 2;
            B += i, r[a + 2] === " " && (B += "\\"), a += 1, s = a + 1;
          }
          break;
        default:
          a += 1;
      }
  return B = s ? B + r.slice(s) : r, o ? B : foldFlowLines(B, i, FOLD_QUOTED, getFoldOptions(e, !1));
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
    const Q = A.includes('"'), i = A.includes("'");
    Q && !i ? o = singleQuotedString : i && !Q ? o = doubleQuotedString : o = r ? singleQuotedString : doubleQuotedString;
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
function blockString({ comment: A, type: e, value: r }, o, Q, i) {
  const { blockQuote: B, commentString: s, lineWidth: a } = o.options;
  if (!B || /\n[\t ]+$/.test(r) || /^\s*$/.test(r))
    return quotedString(r, o);
  const w = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, w.length);
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
  const K = f.indexOf(`
`);
  K === -1 ? E = "-" : r === f || K !== f.length - 1 ? (E = "+", i && i()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${w}`));
  let D = !1, g, I = -1;
  for (g = 0; g < r.length; ++g) {
    const d = r[g];
    if (d === " ")
      D = !0;
    else if (d === `
`)
      I = g;
    else
      break;
  }
  let t = r.substring(0, I < g ? I + 1 : g);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${w}`));
  let c = (D ? w ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), Q && Q()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${w}`);
    let M = !1;
    const m = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (m.onOverflow = () => {
      M = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, w, FOLD_BLOCK, m);
    if (!M)
      return `>${c}
${w}${p}`;
  }
  return r = r.replace(/\n+/g, `$&${w}`), `|${c}
${w}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: Q, value: i } = A, { actualString: B, implicitKey: s, indent: a, indentStep: w, inFlow: n } = e;
  if (s && i.includes(`
`) || n && /[[\]{},]/.test(i))
    return quotedString(i, e);
  if (!i || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(i))
    return s || n || !i.includes(`
`) ? quotedString(i, e) : blockString(A, e, r, o);
  if (!s && !n && Q !== Scalar.PLAIN && i.includes(`
`))
    return blockString(A, e, r, o);
  if (containsDocumentMarker(i)) {
    if (a === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, o);
    if (s && a === w)
      return quotedString(i, e);
  }
  const E = i.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (D) => D.default && D.tag !== "tag:yaml.org,2002:str" && D.test?.test(E), { compat: f, tags: K } = e.doc.schema;
    if (K.some(l) || f?.some(l))
      return quotedString(i, e);
  }
  return s ? E : foldFlowLines(E, a, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, o) {
  const { implicitKey: Q, inFlow: i } = e, B = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(B.value) && (s = Scalar.QUOTE_DOUBLE);
  const a = (n) => {
    switch (n) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return Q || i ? quotedString(B.value, e) : blockString(B, e, r, o);
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
  let w = a(s);
  if (w === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = Q && n || E;
    if (w = a(l), w === null)
      throw new Error(`Unsupported default string type ${l}`);
  }
  return w;
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
    const Q = A.filter((i) => i.tag === e.tag);
    if (Q.length > 0)
      return Q.find((i) => i.format === e.format) ?? Q[0];
  }
  let r, o;
  if (isScalar(e)) {
    o = e.value;
    let Q = A.filter((i) => i.identify?.(o));
    if (Q.length > 1) {
      const i = Q.filter((B) => B.test);
      i.length > 0 && (Q = i);
    }
    r = Q.find((i) => i.format === e.format) ?? Q.find((i) => !i.format);
  } else
    o = e, r = A.find((Q) => Q.nodeClass && o instanceof Q.nodeClass);
  if (!r) {
    const Q = o?.constructor?.name ?? typeof o;
    throw new Error(`Tag not resolved for ${Q} value`);
  }
  return r;
}
function stringifyProps(A, e, { anchors: r, doc: o }) {
  if (!o.directives)
    return "";
  const Q = [], i = (isScalar(A) || isCollection(A)) && A.anchor;
  i && anchorIsValid(i) && (r.add(i), Q.push(`&${i}`));
  const B = A.tag ? A.tag : e.default ? null : e.tag;
  return B && Q.push(o.directives.tagString(B)), Q.join(" ");
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
  let Q;
  const i = isNode(A) ? A : e.doc.createNode(A, { onTagObj: (a) => Q = a });
  Q || (Q = getTagObject(e.doc.schema.tags, i));
  const B = stringifyProps(i, Q, e);
  B.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + B.length + 1);
  const s = typeof Q.stringify == "function" ? Q.stringify(i, e, r, o) : isScalar(i) ? stringifyString(i, e, r, o) : i.toString(e, r, o);
  return B ? isScalar(i) || s[0] === "{" || s[0] === "[" ? `${B} ${s}` : `${B}
${e.indent}${s}` : s;
}
function stringifyPair({ key: A, value: e }, r, o, Q) {
  const { allNullValues: i, doc: B, indent: s, indentStep: a, options: { commentString: w, indentSeq: n, simpleKeys: E } } = r;
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
    implicitKey: !f && (E || !i),
    indent: s + a
  });
  let K = !1, D = !1, g = stringify(A, r, () => K = !0, () => D = !0);
  if (!f && !r.inFlow && g.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (i || e == null)
      return K && o && o(), g === "" ? "?" : f ? `? ${g}` : g;
  } else if (i && !E || e == null && f)
    return g = `? ${g}`, l && !K ? g += lineComment(g, r.indent, w(l)) : D && Q && Q(), g;
  K && (l = null), f ? (l && (g += lineComment(g, r.indent, w(l))), g = `? ${g}
${s}:`) : (g = `${g}:`, l && (g += lineComment(g, r.indent, w(l))));
  let I, t, C;
  isNode(e) ? (I = !!e.spaceBefore, t = e.commentBefore, C = e.comment) : (I = !1, t = null, C = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = g.length + 1), D = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => D = !0);
  let M = " ";
  if (l || I || t) {
    if (M = I ? `
` : "", t) {
      const m = w(t);
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
  return g += M + d, r.inFlow ? c && o && o() : C && !c ? g += lineComment(g, r.indent, w(C)) : D && Q && Q(), g;
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
  const Q = o.toJSON(null, A, Map);
  for (const [i, B] of Q)
    e instanceof Map ? e.has(i) || e.set(i, B) : e instanceof Set ? e.add(i) : Object.prototype.hasOwnProperty.call(e, i) || Object.defineProperty(e, i, {
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
    const Q = toJS(r, "", A);
    if (e instanceof Map)
      e.set(Q, toJS(o, Q, A));
    else if (e instanceof Set)
      e.add(Q);
    else {
      const i = stringifyKey(r, Q, A), B = toJS(o, i, A);
      i in e ? Object.defineProperty(e, i, {
        value: B,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : e[i] = B;
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
    for (const i of r.anchors.keys())
      o.anchors.add(i.anchor);
    o.inFlow = !0, o.inStringifyKey = !0;
    const Q = A.toString(o);
    if (!r.mapKeyWarned) {
      let i = JSON.stringify(Q);
      i.length > 40 && (i = i.substring(0, 36) + '..."'), warn(r.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${i}. Set mapAsMap: true to use object keys.`), r.mapKeyWarned = !0;
    }
    return Q;
  }
  return JSON.stringify(e);
}
function createPair(A, e, r) {
  const o = createNode(A, void 0, r), Q = createNode(e, void 0, r);
  return new Pair(o, Q);
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
function stringifyBlockCollection({ comment: A, items: e }, r, { blockItemPrefix: o, flowChars: Q, itemIndent: i, onChompKeep: B, onComment: s }) {
  const { indent: a, options: { commentString: w } } = r, n = Object.assign({}, r, { indent: i, type: null });
  let E = !1;
  const l = [];
  for (let K = 0; K < e.length; ++K) {
    const D = e[K];
    let g = null;
    if (isNode(D))
      !E && D.spaceBefore && l.push(""), addCommentBefore(r, l, D.commentBefore, E), D.comment && (g = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let I = stringify(D, n, () => g = null, () => E = !0);
    g && (I += lineComment(I, i, w(g))), E && g && (E = !1), l.push(o + I);
  }
  let f;
  if (l.length === 0)
    f = Q.start + Q.end;
  else {
    f = l[0];
    for (let K = 1; K < l.length; ++K) {
      const D = l[K];
      f += D ? `
${a}${D}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(w(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: Q, indentStep: i, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += i;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let w = !1, n = 0;
  const E = [];
  for (let K = 0; K < A.length; ++K) {
    const D = A[K];
    let g = null;
    if (isNode(D))
      D.spaceBefore && E.push(""), addCommentBefore(e, E, D.commentBefore, !1), D.comment && (g = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (w = !0));
      const C = isNode(D.value) ? D.value : null;
      C ? (C.comment && (g = C.comment), C.commentBefore && (w = !0)) : D.value == null && t?.comment && (g = t.comment);
    }
    g && (w = !0);
    let I = stringify(D, a, () => g = null);
    K < A.length - 1 && (I += ","), g && (I += lineComment(I, o, s(g))), !w && (E.length > n || I.includes(`
`)) && (w = !0), E.push(I), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!w) {
    const K = E.reduce((D, g) => D + g.length + 2, 2);
    w = e.options.lineWidth > 0 && K > e.options.lineWidth;
  }
  if (w) {
    let K = l;
    for (const D of E)
      K += D ? `
${i}${Q}${D}` : `
`;
    return `${K}
${Q}${f}`;
  } else
    return `${l}${B}${E.join(" ")}${B}${f}`;
}
function addCommentBefore({ indent: A, options: { commentString: e } }, r, o, Q) {
  if (o && Q && (o = o.replace(/^\n+/, "")), o) {
    const i = indentComment(e(o), A);
    r.push(i.trimStart());
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
    const { keepUndefined: Q, replacer: i } = o, B = new this(e), s = (a, w) => {
      if (typeof i == "function")
        w = i.call(r, a, w);
      else if (Array.isArray(i) && !i.includes(a))
        return;
      (w !== void 0 || Q) && B.items.push(createPair(a, w, o));
    };
    if (r instanceof Map)
      for (const [a, w] of r)
        s(a, w);
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
    const Q = findPair(this.items, o.key), i = this.schema?.sortMapEntries;
    if (Q) {
      if (!r)
        throw new Error(`Key ${o.key} already set`);
      isScalar(Q.value) && isScalarValue(o.value) ? Q.value.value = o.value : Q.value = o.value;
    } else if (i) {
      const B = this.items.findIndex((s) => i(o, s) < 0);
      B === -1 ? this.items.push(o) : this.items.splice(B, 0, o);
    } else
      this.items.push(o);
  }
  delete(e) {
    const r = findPair(this.items, e);
    return r ? this.items.splice(this.items.indexOf(r), 1).length > 0 : !1;
  }
  get(e, r) {
    const Q = findPair(this.items, e)?.value;
    return (!r && isScalar(Q) ? Q.value : Q) ?? void 0;
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
    const Q = o ? new o() : r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    r?.onCreate && r.onCreate(Q);
    for (const i of this.items)
      addPairToJSMap(r, Q, i);
    return Q;
  }
  toString(e, r, o) {
    if (!e)
      return JSON.stringify(this);
    for (const Q of this.items)
      if (!isPair(Q))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(Q)} instead`);
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
    const Q = this.items[o];
    return !r && isScalar(Q) ? Q.value : Q;
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
    const Q = this.items[o];
    isScalar(Q) && isScalarValue(r) ? Q.value = r : this.items[o] = r;
  }
  toJSON(e, r) {
    const o = [];
    r?.onCreate && r.onCreate(o);
    let Q = 0;
    for (const i of this.items)
      o.push(toJS(i, String(Q++), r));
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
    const { replacer: Q } = o, i = new this(e);
    if (r && Symbol.iterator in Object(r)) {
      let B = 0;
      for (let s of r) {
        if (typeof Q == "function") {
          const a = r instanceof Set ? s : String(B++);
          s = Q.call(r, a, s);
        }
        i.items.push(createNode(s, void 0, o));
      }
    }
    return i;
  }
}
function asItemIndex(A) {
  let e = isScalar(A) ? A.value : A;
  return e && typeof e == "string" && (e = Number(e)), typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
}
function createPairs(A, e, r) {
  const { replacer: o } = r, Q = new YAMLSeq(A);
  Q.tag = "tag:yaml.org,2002:pairs";
  let i = 0;
  if (e && Symbol.iterator in Object(e))
    for (let B of e) {
      typeof o == "function" && (B = o.call(e, String(i++), B));
      let s, a;
      if (Array.isArray(B))
        if (B.length === 2)
          s = B[0], a = B[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${B}`);
      else if (B && B instanceof Object) {
        const w = Object.keys(B);
        if (w.length === 1)
          s = w[0], a = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${w.length} keys`);
      } else
        s = B;
      Q.items.push(createPair(s, a, r));
    }
  return Q;
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
    for (const Q of this.items) {
      let i, B;
      if (isPair(Q) ? (i = toJS(Q.key, "", r), B = toJS(Q.value, i, r)) : i = toJS(Q, "", r), o.has(i))
        throw new Error("Ordered maps must not include duplicate keys");
      o.set(i, B);
    }
    return o;
  }
  static from(e, r, o) {
    const Q = createPairs(e, r, o), i = new this();
    return i.items = Q.items, i;
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
    const { replacer: Q } = o, i = new this(e);
    if (r && Symbol.iterator in Object(r))
      for (let B of r)
        typeof Q == "function" && (B = Q.call(r, B, B)), i.items.push(createPair(B, null, o));
    return i;
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
    const Q = [];
    for (const i of o) {
      const B = A.varTypes[i[0]], s = A.variables[i[1]];
      let a = s.i, w = s.n;
      if (i.length > 2) {
        const E = [], l = [], f = (i.length - 2) / 2, K = i.slice(2, 2 + f);
        for (const D of K) {
          const g = A.subscripts[D];
          E.push(g.i), l.push(g.n);
        }
        a += `[${E.join(",")}]`, w += `[${l.join(",")}]`;
      }
      const n = {
        varId: a,
        varName: w,
        varType: B,
        varIndex: s.x,
        subscriptIndices: i.length > 2 ? i.slice(2 + (i.length - 2) / 2) : void 0
      };
      Q.push(n);
    }
    e[r] = Q;
  }
  return e;
}
function getImplVars(A) {
  const e = decodeImplVars(A), r = /* @__PURE__ */ new Map(), o = [];
  function Q(i, B) {
    const s = [];
    for (const a of B) {
      if (a.varType === "lookup" || a.varType === "data")
        continue;
      const n = `ModelImpl_${a.varId}`;
      r.set(n, a), s.push(n);
    }
    o.push({
      title: i,
      fn: i,
      datasetKeys: s
    });
  }
  return Q("initConstants", e.constants || []), Q("initLevels", e.initVars || []), Q("evalLevels", e.levelVars || []), Q("evalAux", e.auxVars || []), {
    implVars: r,
    implVarGroups: o
  };
}
function getInputVars(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A) {
    const o = r.varId, Q = {
      inputId: r.inputId,
      varId: o,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(o, r.defaultValue)
    };
    e.set(o, Q);
  }
  return e;
}
function setInputsForScenario(A, e) {
  function r(w, n) {
    n < w.minValue ? (console.warn(
      `WARNING: Scenario input value ${n} is < min value (${w.minValue}) for input '${w.varName}'`
    ), n = w.minValue) : n > w.maxValue && (console.warn(
      `WARNING: Scenario input value ${n} is > max value (${w.maxValue}) for input '${w.varName}'`
    ), n = w.maxValue), w.value.set(n);
  }
  function o(w) {
    w.value.reset();
  }
  function Q(w) {
    w.value.set(w.minValue);
  }
  function i(w) {
    w.value.set(w.maxValue);
  }
  function B() {
    A.forEach(o);
  }
  function s() {
    A.forEach(Q);
  }
  function a() {
    A.forEach(i);
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
      for (const w of e.settings) {
        const n = A.get(w.inputVarId);
        if (n)
          switch (w.kind) {
            case "position":
              switch (w.position) {
                case "at-default":
                  o(n);
                  break;
                case "at-minimum":
                  Q(n);
                  break;
                case "at-maximum":
                  i(n);
                  break;
                default:
                  assertNeverExports.assertNever(w.position);
              }
              break;
            case "value":
              r(n, w.value);
              break;
            default:
              assertNeverExports.assertNever(w);
          }
        else
          console.log(`No model input for scenario input ${w.inputVarId}`);
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
    const o = r.varId, Q = datasetKeyForOutputVar(void 0, o);
    e.set(Q, {
      datasetKey: Q,
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 134 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "a_fi", varId: "_fertiliser_multiplier", varName: "Fertiliser Multiplier", defaultValue: 1.0001, minValue: 0.8, maxValue: 1.2 }, { inputId: "a_af", varId: "_feed_switch", varName: "Feed Switch", defaultValue: 1, minValue: -1, maxValue: 3 }, { inputId: "a_af_1", varId: "_feed_share_of_crop_types_custom[_pulses]", varName: "Feed Share of crop types Custom[Pulses]", defaultValue: 0.014, minValue: 0, maxValue: 1 }, { inputId: "a_af_2", varId: "_feed_share_of_crop_types_custom[_grains]", varName: "Feed Share of crop types Custom[Grains]", defaultValue: 0.715, minValue: 0, maxValue: 1 }, { inputId: "a_af_3", varId: "_feed_share_of_crop_types_custom[_vegfruits]", varName: "Feed Share of crop types Custom[VegFruits]", defaultValue: 0.223, minValue: 0, maxValue: 1 }, { inputId: "a_af_4", varId: "_feed_share_of_crop_types_custom[_othercrops]", varName: "Feed Share of crop types Custom[OtherCrops]", defaultValue: 0.048, minValue: 0, maxValue: 1 }, { inputId: "a_af_5", varId: "_feed_conversion_ratio", varName: "Feed Conversion Ratio", defaultValue: 100, minValue: 90, maxValue: 110 }, { inputId: "a_sap", varId: "_yield_multiplier_switch", varName: "Yield Multiplier Switch", defaultValue: 2, minValue: -1, maxValue: 4 }, { inputId: "a_sap_1", varId: "_yield_custom[_pulses]", varName: "Yield Custom[Pulses]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_2", varId: "_yield_custom[_grains]", varName: "Yield Custom[Grains]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_3", varId: "_yield_custom[_vegfruits]", varName: "Yield Custom[VegFruits]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_4", varId: "_yield_custom[_othercrops]", varName: "Yield Custom[OtherCrops]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_3", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_4", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_5", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed_p", varId: "_fake_value_16", varName: "Fake Value 16", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed_p_1", varId: "_start_year_of_yield", varName: "Start Year of Yield", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_2", varId: "_end_year_of_yield", varName: "End Year of Yield", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_3", varId: "_start_year_of_feed_switch", varName: "Start Year of Feed Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_4", varId: "_end_year_of_feed_switch", varName: "End Year of Feed Switch", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_5", varId: "_start_year_of_fertiliser", varName: "Start Year of Fertiliser", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_6", varId: "_end_year_of_fertiliser", varName: "End Year of Fertiliser", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_26", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_27", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_28", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_29", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_30", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_31", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_32", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_33", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_34", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_35", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_36", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_37", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_38", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_39", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_40", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_41", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_42", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_46", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_47", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_48", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_49", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_50", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_52", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_53", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_54", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_55", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_56", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_57", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_58", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_59", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_62", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_63", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_64", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_65", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_pou_sigma_variation", varName: "SSP PoU Sigma Variation", defaultValue: 1, minValue: 0.8, maxValue: 1.2 }, { inputId: "ed_ext_70", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_75", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_76", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_77", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_79", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_80", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_81", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_82", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_83", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_84", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_arable_land_needed[_grains]", varName: "Arable Land Needed[Grains]" }, { varId: "_arable_land_needed[_othercrops]", varName: "Arable Land Needed[OtherCrops]" }, { varId: "_arable_land_needed[_pulses]", varName: "Arable Land Needed[Pulses]" }, { varId: "_arable_land_needed[_vegfruits]", varName: "Arable Land Needed[VegFruits]" }, { varId: "_average_caloric_availability_per_capita_per_day", varName: "Average Caloric Availability per Capita per Day" }, { varId: "_average_caloric_consumption_per_capita_per_day", varName: "Average Caloric Consumption per Capita per Day" }, { varId: "_average_total_daily_calorie_intake", varName: "Average Total Daily Calorie Intake" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_by_food_category[_cropmeat]", varName: "Caloric Availability by Food Category[CropMeat]" }, { varId: "_caloric_availability_by_food_category[_dairy]", varName: "Caloric Availability by Food Category[Dairy]" }, { varId: "_caloric_availability_by_food_category[_eggs]", varName: "Caloric Availability by Food Category[Eggs]" }, { varId: "_caloric_availability_by_food_category[_grains]", varName: "Caloric Availability by Food Category[Grains]" }, { varId: "_caloric_availability_by_food_category[_othercrops]", varName: "Caloric Availability by Food Category[OtherCrops]" }, { varId: "_caloric_availability_by_food_category[_pasmeat]", varName: "Caloric Availability by Food Category[PasMeat]" }, { varId: "_caloric_availability_by_food_category[_pulses]", varName: "Caloric Availability by Food Category[Pulses]" }, { varId: "_caloric_availability_by_food_category[_vegfruits]", varName: "Caloric Availability by Food Category[VegFruits]" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_caloric_intake_per_capita_per_day_from_animal_food", varName: "Caloric Intake per Capita per Day from Animal Food" }, { varId: "_caloric_intake_per_capita_per_day_from_plant_food", varName: "Caloric Intake per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_crop_yield_for_each_category[_grains]", varName: "Crop yield for each category [Grains]" }, { varId: "_crop_yield_for_each_category[_othercrops]", varName: "Crop yield for each category [OtherCrops]" }, { varId: "_crop_yield_for_each_category[_pulses]", varName: "Crop yield for each category [Pulses]" }, { varId: "_crop_yield_for_each_category[_vegfruits]", varName: "Crop yield for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_calories_per_capita_per_day", varName: "Desired Food Production in Calories per Capita Per Day" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effect_of_sustainable_agricultural_productivity[_othercrops]", varName: "Effect of Sustainable Agricultural Productivity [OtherCrops]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_grains]", varName: "Effect of Sustainable Agricultural Productivity[Grains]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_pulses]", varName: "Effect of Sustainable Agricultural Productivity[Pulses]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_vegfruits]", varName: "Effect of Sustainable Agricultural Productivity[VegFruits]" }, { varId: "_effective_food_demand_per_capita_per_day", varName: "Effective Food Demand per Capita per Day" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_final_feed_share[_othercrops]", varName: "Final Feed Share [OtherCrops]" }, { varId: "_final_feed_share[_grains]", varName: "Final Feed Share[Grains]" }, { varId: "_final_feed_share[_pulses]", varName: "Final Feed Share[Pulses]" }, { varId: "_final_feed_share[_vegfruits]", varName: "Final Feed Share[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_shortage_in_tonnes[_cropmeat]", varName: "Food shortage in tonnes[CropMeat]" }, { varId: "_food_shortage_in_tonnes[_dairy]", varName: "Food shortage in tonnes[Dairy]" }, { varId: "_food_shortage_in_tonnes[_eggs]", varName: "Food shortage in tonnes[Eggs]" }, { varId: "_food_shortage_in_tonnes[_grains]", varName: "Food shortage in tonnes[Grains]" }, { varId: "_food_shortage_in_tonnes[_othercrops]", varName: "Food shortage in tonnes[OtherCrops]" }, { varId: "_food_shortage_in_tonnes[_pasmeat]", varName: "Food shortage in tonnes[PasMeat]" }, { varId: "_food_shortage_in_tonnes[_pulses]", varName: "Food shortage in tonnes[Pulses]" }, { varId: "_food_shortage_in_tonnes[_vegfruits]", varName: "Food shortage in tonnes[VegFruits]" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_grassland_needed[_dairy]", varName: "Grassland Needed[Dairy]" }, { varId: "_grassland_needed[_pasmeat]", varName: "Grassland Needed[PasMeat]" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_animal_and_crop_production[_cropmeat]", varName: "Total Animal and Crop Production[CropMeat]" }, { varId: "_total_animal_and_crop_production[_dairy]", varName: "Total Animal and Crop Production[Dairy]" }, { varId: "_total_animal_and_crop_production[_eggs]", varName: "Total Animal and Crop Production[Eggs]" }, { varId: "_total_animal_and_crop_production[_grains]", varName: "Total Animal and Crop Production[Grains]" }, { varId: "_total_animal_and_crop_production[_othercrops]", varName: "Total Animal and Crop Production[OtherCrops]" }, { varId: "_total_animal_and_crop_production[_pasmeat]", varName: "Total Animal and Crop Production[PasMeat]" }, { varId: "_total_animal_and_crop_production[_pulses]", varName: "Total Animal and Crop Production[Pulses]" }, { varId: "_total_animal_and_crop_production[_vegfruits]", varName: "Total Animal and Crop Production[VegFruits]" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_daily_calorie_supply_per_capita", varName: "Total Daily Calorie Supply per Capita" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 495185, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const g=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(M){return w.deserialize(M,g)},serialize(M){return w.serialize(M,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(g){D=A.extendSerializer(D,g)}common.registerSerializer=Q;function B(g){return D.deserialize(g)}common.deserialize=B;function w(g){return D.serialize(g)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,g){if(!g){if(!D(w))throw Error();g=[w]}return{[A.$transferable]:!0,send:w,transferables:g}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,g){self.postMessage(w,g)},Q=function(w){const g=M=>{w(M.data)},E=()=>{self.removeEventListener("message",g)};return self.addEventListener("message",g),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(M){if(!M)throw Error("Invariant violation: MessagePort to parent is not available.");return M}const B=function(){return!D.default().isMainThread},w=function(K,i){Q(D.default().parentPort).postMessage(K,i)},g=function(K){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const a=O=>{K(O)},k=()=>{Q(i).off("message",a)};return Q(i).on("message",a),k};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:g,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function g(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?g():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(o,P,t,d){function U(j){return j instanceof t?j:new t(function(S){S(j)})}return new(t||(t=Promise))(function(j,S){function V(p){try{v(d.next(p))}catch(X){S(X)}}function $(p){try{v(d.throw(p))}catch(X){S(X)}}function v(p){p.done?j(p.value):U(p.value).then(V,$)}v((d=d.apply(o,P||[])).next())})},Q=worker&&worker.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),g=requireTransferable(),E=requireMessages(),M=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=M.default.isWorkerRuntime;let a=!1;const k=new Map,O=o=>o&&o.type===E.MasterMessageType.cancel,N=o=>o&&o.type===E.MasterMessageType.run,n=o=>B.default(o)||m(o);function m(o){return o&&typeof o=="object"&&typeof o.subscribe=="function"}function F(o){return g.isTransferDescriptor(o)?{payload:o.send,transferables:o.transferables}:{payload:o,transferables:void 0}}function Z(){const o={type:E.WorkerMessageType.init,exposed:{type:"function"}};M.default.postMessageToMaster(o)}function q(o){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:o}};M.default.postMessageToMaster(P)}function c(o,P){const{payload:t,transferables:d}=F(P),U={type:E.WorkerMessageType.error,uid:o,error:w.serialize(t)};M.default.postMessageToMaster(U,d)}function H(o,P,t){const{payload:d,transferables:U}=F(t),j={type:E.WorkerMessageType.result,uid:o,complete:P?!0:void 0,payload:d};M.default.postMessageToMaster(j,U)}function R(o,P){const t={type:E.WorkerMessageType.running,uid:o,resultType:P};M.default.postMessageToMaster(t)}function h(o){try{const P={type:E.WorkerMessageType.uncaughtError,error:w.serialize(o)};M.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,o)}}function y(o,P,t){return D(this,void 0,void 0,function*(){let d;try{d=P(...t)}catch(j){return c(o,j)}const U=n(d)?"observable":"promise";if(R(o,U),n(d)){const j=d.subscribe(S=>H(o,!1,w.serialize(S)),S=>{c(o,w.serialize(S)),k.delete(o)},()=>{H(o,!0),k.delete(o)});k.set(o,j)}else try{const j=yield d;H(o,!0,w.serialize(j))}catch(j){c(o,w.serialize(j))}})}function x(o){if(!M.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(a)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(a=!0,typeof o=="function")M.default.subscribeToMasterMessages(P=>{N(P)&&!P.method&&y(P.uid,o,P.args.map(w.deserialize))}),Z();else if(typeof o=="object"&&o){M.default.subscribeToMasterMessages(t=>{N(t)&&t.method&&y(t.uid,o[t.method],t.args.map(w.deserialize))});const P=Object.keys(o).filter(t=>typeof o[t]=="function");q(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${o}`);M.default.subscribeToMasterMessages(P=>{if(O(P)){const t=P.uid,d=k.get(t);d&&(d.unsubscribe(),k.delete(t))}})}A.expose=x,typeof self<"u"&&typeof self.addEventListener=="function"&&M.default.isWorkerRuntime()&&(self.addEventListener("error",o=>{setTimeout(()=>h(o.error||o),250)}),self.addEventListener("unhandledrejection",o=>{const P=o.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&M.default.isWorkerRuntime()&&(process.on("uncaughtException",o=>{setTimeout(()=>h(o),250)}),process.on("unhandledRejection",o=>{o&&typeof o.message=="string"&&setTimeout(()=>h(o),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,g=w?.length||0;D[Q++]=g;for(let E=0;E<g;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const g of A){const E=g.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const M=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=M,B+=2,w+=((Q=g.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const g of A){const E=g.varRef.varSpec;D[B++]=E.varIndex;const M=E.subscriptIndices,K=M?.length||0;D[B++]=K;for(let i=0;i<K;i++)D[B++]=M[i];g.points!==void 0?(D[B++]=w,D[B++]=g.points.length,Q?.set(g.points,w),w+=g.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let g=0;g<w;g++){const E=A[B++],M=A[B++],K=M>0?Array(M):void 0;for(let N=0;N<M;N++)K[N]=A[B++];const i=A[B++],a=A[B++],k={varIndex:E,subscriptIndices:K};let O;i>=0?D?O=D.slice(i,i+a):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:k},points:O})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let g;const E=D.varSpecs;E!==void 0&&E.length>0?g=getEncodedVarIndicesLength(E):g=0;let M,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const y of Q.lookups)resolveVarRef(this.listing,y.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);M=h.lookupsLength,K=h.lookupIndicesLength}else M=0,K=0;let i=0;function a(h,y){const x=i,o=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(y*o),t=Math.ceil(P/8)*8;return i+=t,x}const k=a("int32",headerLengthInElements),O=a("float64",extrasLengthInElements),N=a("float64",B),n=a("float64",w),m=a("int32",g),F=a("float64",M),Z=a("int32",K),q=i;if(this.encoded===void 0||this.encoded.byteLength<q){const h=Math.ceil(q*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,k,headerLengthInElements)}const c=this.header.view;let H=0;c[H++]=O,c[H++]=extrasLengthInElements,c[H++]=N,c[H++]=B,c[H++]=n,c[H++]=w,c[H++]=m,c[H++]=g,c[H++]=F,c[H++]=M,c[H++]=Z,c[H++]=K,this.inputs.update(this.encoded,N,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,n,w),this.outputIndices.update(this.encoded,m,g),this.lookups.update(this.encoded,F,M),this.lookupIndices.update(this.encoded,Z,K);const R=this.inputs.view;for(let h=0;h<A.length;h++){const y=A[h];typeof y=="number"?R[h]=y:R[h]=y.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const g=B[w++],E=B[w++],M=B[w++],K=B[w++],i=B[w++],a=B[w++],k=B[w++],O=B[w++],N=B[w++],n=B[w++],m=B[w++],F=B[w++],Z=E*Float64Array.BYTES_PER_ELEMENT,q=K*Float64Array.BYTES_PER_ELEMENT,c=a*Float64Array.BYTES_PER_ELEMENT,H=O*Int32Array.BYTES_PER_ELEMENT,R=n*Float64Array.BYTES_PER_ELEMENT,h=F*Int32Array.BYTES_PER_ELEMENT,y=D+Z+q+c+H+R+h;if(A.byteLength<y)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,g,E),this.inputs.update(this.encoded,M,K),this.outputs.update(this.encoded,i,a),this.outputIndices.update(this.encoded,k,O),this.lookups.update(this.encoded,N,n),this.lookupIndices.update(this.encoded,m,F)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,g=!D;let E;g&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let M=E;M<w;M+=2){const K=B[M];if(K>=A){if(g&&(this.lastInput=A,this.lastHitIndex=M),M===0||K===A)return B[M+1];switch(Q){default:case"interpolate":{const i=B[M-2],a=B[M-1],k=B[M+1],O=K-i,N=k-a;return a+N/O*(A-i)}case"forward":return B[M+1];case"backward":return B[M-1]}}}return g&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const g=Q[w];if(g>=A){const E=Q[w-2],M=Q[w-1],K=Q[w+1],i=g-E,a=K-M;return M+a/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,g,E){const M=Math.floor((E-B)/g);for(let K=0;K<=M;K++)if(A.currentTime<=E&&pulse(A,B+K*g,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,g){return A.currentTime>w?A.currentTime<g||w>g?B*(A.currentTime-w):B*(g-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,g){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let M=D.get(w);M===void 0&&(M=Array(w),D.set(w,M));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=g>0?1:-1;E.sort((i,a)=>{let k;return i.x<a.x?k=-1:i.x>a.x?k=1:k=0,k*K});for(let i=0;i<w;i++)M[i]=E[i].ind;return M},XIDZ(B,w,g){return Math.abs(w)<EPSILON?g:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,g){let E;return g>=1?E="forward":g<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const g=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,g,{outputIndices:B,lookups:A.getLookups()});const M=perfElapsed(E);A.storeOutputs(g),A.storeElapsedTime(M)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),g=A.getSaveFreq(),E=Math.round((B-Q)/g)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:g,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(M,K,i)=>{runJsModel(A,Q,B,w,g,E,M,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,g,E,M,K,i,a){let k=D;A.setTime(k);const O={timeStep:B,currentTime:k};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const q of i)A.setLookup(q.varRef.varSpec,q.points);E?.length>0&&A.setInputs(q=>E[q]),A.initLevels();const N=Math.round((Q-D)/B),n=Q;let m=0,F=0,Z=0;for(;m<=N;){if(A.evalAux(),k%w<1e-6){Z=0;const q=c=>{const H=Z*g+F;M[H]=k<=n?c:void 0,Z++};if(K!==void 0){let c=0;const H=K[c++];for(let R=0;R<H;R++){const h=K[c++],y=K[c++];let x;y>0&&(x=K.subarray(c,c+y),c+=y);const o={varIndex:h,subscriptIndices:x};A.storeOutput(o,q)}}else A.storeOutputs(q);F++}if(m===N)break;A.evalLevels(),k+=B,A.setTime(k),O.currentTime=k,m++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),g=w/4,E=A.HEAP32.subarray(g,g+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),g=w/8,E=A.HEAPF64.subarray(g,g+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,g,E,M;const K=A.getLookups();if(K!==void 0)for(const N of K){const n=N.varRef.varSpec,m=((D=n.subscriptIndices)==null?void 0:D.length)||0;let F;m>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<m)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,m)),this.lookupSubIndicesBuffer.getArrayView().set(n.subscriptIndices),F=this.lookupSubIndicesBuffer.getAddress()):F=0;let Z,q;if(N.points){const H=N.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<H)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,H)),this.lookupDataBuffer.getArrayView().set(N.points),Z=this.lookupDataBuffer.getAddress(),q=H/2}else Z=0,q=0;const c=n.varIndex;this.wasmSetLookup(c,F,Z,q)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),N=>{var n;return(n=this.inputsBuffer)==null||n.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,N),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((g=this.outputIndicesBuffer)==null?void 0:g.getArrayView(),N=>{var n;return(n=this.outputIndicesBuffer)==null||n.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,N),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const a=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<a)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,a));const k=perfNow();this.wasmRunModel(((M=this.inputsBuffer)==null?void 0:M.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(k);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(C,I){B=C,w=I}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_arable_land_needed[_grains]","_arable_land_needed[_othercrops]","_arable_land_needed[_pulses]","_arable_land_needed[_vegfruits]","_average_caloric_availability_per_capita_per_day","_average_caloric_consumption_per_capita_per_day","_average_total_daily_calorie_intake","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_by_food_category[_cropmeat]","_caloric_availability_by_food_category[_dairy]","_caloric_availability_by_food_category[_eggs]","_caloric_availability_by_food_category[_grains]","_caloric_availability_by_food_category[_othercrops]","_caloric_availability_by_food_category[_pasmeat]","_caloric_availability_by_food_category[_pulses]","_caloric_availability_by_food_category[_vegfruits]","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_caloric_intake_per_capita_per_day_from_animal_food","_caloric_intake_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_crop_yield_for_each_category[_grains]","_crop_yield_for_each_category[_othercrops]","_crop_yield_for_each_category[_pulses]","_crop_yield_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_calories_per_capita_per_day","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effect_of_sustainable_agricultural_productivity[_othercrops]","_effect_of_sustainable_agricultural_productivity[_grains]","_effect_of_sustainable_agricultural_productivity[_pulses]","_effect_of_sustainable_agricultural_productivity[_vegfruits]","_effective_food_demand_per_capita_per_day","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_final_feed_share[_othercrops]","_final_feed_share[_grains]","_final_feed_share[_pulses]","_final_feed_share[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_shortage_in_tonnes[_cropmeat]","_food_shortage_in_tonnes[_dairy]","_food_shortage_in_tonnes[_eggs]","_food_shortage_in_tonnes[_grains]","_food_shortage_in_tonnes[_othercrops]","_food_shortage_in_tonnes[_pasmeat]","_food_shortage_in_tonnes[_pulses]","_food_shortage_in_tonnes[_vegfruits]","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_grassland_needed[_dairy]","_grassland_needed[_pasmeat]","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_animal_and_crop_production[_cropmeat]","_total_animal_and_crop_production[_dairy]","_total_animal_and_crop_production[_eggs]","_total_animal_and_crop_production[_grains]","_total_animal_and_crop_production[_othercrops]","_total_animal_and_crop_production[_pasmeat]","_total_animal_and_crop_production[_pulses]","_total_animal_and_crop_production[_vegfruits]","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_daily_calorie_supply_per_capita","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var g={},E;for(E in Q)Q.hasOwnProperty(E)&&(g[E]=Q[E]);var M=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function a(C){return Q.locateFile?Q.locateFile(C,i):i+C}var k,O;(M||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(C){try{var I=new XMLHttpRequest;return I.open("GET",C,!1),I.responseType="arraybuffer",I.send(null),new Uint8Array(I.response)}catch(e){var s=DA(C);if(s)return s;throw e}}),k=function(C,I,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){I(e.response);return}var u=DA(C);if(u){I(u.buffer);return}s()},e.onerror=s,e.send(null)});var N=Q.print||console.log.bind(console),n=Q.printErr||console.warn.bind(console);for(E in g)g.hasOwnProperty(E)&&(Q[E]=g[E]);g=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var m;Q.wasmBinary&&(m=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&_("no native wasm support detected");var F,Z=!1;function q(C,I){C||_("Assertion failed: "+I)}function c(C){var I=Q["_"+C];return q(I,"Cannot call unknown function "+C+", make sure it is exported"),I}function H(C,I,s,e,u){var z={string:function(Y){var T=0;if(Y!=null&&Y!==0){var eA=(Y.length<<2)+1;T=CA(eA),P(Y,T,eA)}return T},array:function(Y){var T=CA(Y.length);return t(Y,T),T}};function G(Y){return I==="string"?x(Y):I==="boolean"?!!Y:Y}var r=c(C),f=[],b=0;if(e)for(var L=0;L<e.length;L++){var rA=z[s[L]];rA?(b===0&&(b=sA()),f[L]=rA(e[L])):f[L]=e[L]}var gA=r.apply(null,f);function yA(Y){return b!==0&&KA(b),G(Y)}return gA=yA(gA),gA}function R(C,I,s,e){s=s||[];var u=s.every(function(G){return G==="number"}),z=I!=="string";return z&&u&&!e?c(C):function(){return H(C,I,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function y(C,I,s){for(var e=I+s,u=I;C[u]&&!(u>=e);)++u;if(u-I>16&&C.subarray&&h)return h.decode(C.subarray(I,u));for(var z="";I<u;){var G=C[I++];if(!(G&128)){z+=String.fromCharCode(G);continue}var r=C[I++]&63;if((G&224)==192){z+=String.fromCharCode((G&31)<<6|r);continue}var f=C[I++]&63;if((G&240)==224?G=(G&15)<<12|r<<6|f:G=(G&7)<<18|r<<12|f<<6|C[I++]&63,G<65536)z+=String.fromCharCode(G);else{var b=G-65536;z+=String.fromCharCode(55296|b>>10,56320|b&1023)}}return z}function x(C,I){return C?y(U,C,I):""}function o(C,I,s,e){if(!(e>0))return 0;for(var u=s,z=s+e-1,G=0;G<C.length;++G){var r=C.charCodeAt(G);if(r>=55296&&r<=57343){var f=C.charCodeAt(++G);r=65536+((r&1023)<<10)|f&1023}if(r<=127){if(s>=z)break;I[s++]=r}else if(r<=2047){if(s+1>=z)break;I[s++]=192|r>>6,I[s++]=128|r&63}else if(r<=65535){if(s+2>=z)break;I[s++]=224|r>>12,I[s++]=128|r>>6&63,I[s++]=128|r&63}else{if(s+3>=z)break;I[s++]=240|r>>18,I[s++]=128|r>>12&63,I[s++]=128|r>>6&63,I[s++]=128|r&63}}return I[s]=0,s-u}function P(C,I,s){return o(C,U,I,s)}function t(C,I){d.set(C,I)}var d,U,j;function S(C){Q.HEAP8=d=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=j=new Int32Array(C),Q.HEAPU8=U=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var V,$=[],v=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());wA($)}function GA(){wA(v)}function kA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());wA(p)}function PA(C){$.unshift(C)}function aA(C){v.unshift(C)}function cA(C){p.unshift(C)}var l=0,W=null;function HA(C){l++,Q.monitorRunDependencies&&Q.monitorRunDependencies(l)}function NA(C){if(l--,Q.monitorRunDependencies&&Q.monitorRunDependencies(l),l==0&&W){var I=W;W=null,I()}}Q.preloadedImages={},Q.preloadedAudios={};function _(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",n(C),Z=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var I=new WebAssembly.RuntimeError(C);throw w(I),I}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function MA(C){return C.startsWith("file://")}var J;J="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBoM3OAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsK8dUPOsEFAgt/AXwjAEEQayIGJAACQEG4wg4oAgAiAgRAIAJBwMIOKAIAIgFBxMIOKAIAbEEDdGpByMIOKAIAQQN0aiAAOQMAQcDCDiABQQFqNgIADAELQbDCDigCACIBRQRAAn9B8JcGKwMAQYjUBisDAKFB8NQHKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQbDCDkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQbTCDigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEG0wg5BtMIOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAF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FEAgAkQAAAAAAJCfQGQiDBsiADkDAEGQgwogADkDAEGIgwogADkDAEGAgwogADkDAEH4ggogADkDAEHwggogADkDAEHoggpBgNMHKwMARAAAAAAAACDAoEQAAAAAAAAgQKBEAAAAAAAAIEAgDBsiATkDAEHgggogATkDAEHYggogATkDAEGIggpB0NIHKwMARAAAAAAAABTAoEQAAAAAAAAUQKBEAAAAAAAAFEAgDBsiAjkDAEHQggogATkDAEHIggogATkDAEHAggpB4NIHKwMARAAAAAAAACDAoEQAAAAAAAAgQKBEAAAAAAAAIEAgDBsiATkDAEGwggogATkDAEG4ggogATkDAEGoggogATkDAEGgggogATkDAEGYggogATkDAEGQggogAjkDAEGggwogADkDAEGAggogAjkDAEHIhApB4M8HKwMARDMzMzMzM/O/oEQzMzMzMzPzP6BEMzMzMzMz8z8gDBsiADkDAEHAhAogADkDAEG4hAogADkDAEGwhAogADkDAEEAIQ1BqIQKQeDPBysDAEQzMzMzMzPzv6BEMzMzMzMz8z+gRDMzMzMzM/M/QdjCDisDAEGg2wcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDBsiATkDAEGghAogATkDAEGYhApBoM8HKwMARAAAAAAAAPi/oEQAAAAAAAD4P6BEAAAAAAAA+D8gDBsiADkDAEGQhAogADkDAEGIhAogADkDAEG4gwpB8M4HKwMARDMzMzMzM/O/oEQzMzMzMzPzP6BEMzMzMzMz8z8gDBsiAjkDAEGAhAogADkDAEH4gwogADkDAEHwgwpBgM8HKwMARAAAAAAAAPi/oEQAAAAAAAD4P6BEAAAAAAAA+D8gDBsiADkDAEHogwogADkDAEHggwogADkDAEHYgwogADkDAEHIgwogADkDAEHQgwogADkDAEHAgwogAjkDAEHQhAogATkDAEGwgwogAjkDAANARAAAAAAAAAAAIQBBACEMA0AgACANQQZ0QbDfDWogDEEDdGorAwCgIQAgDEEBaiIMQQhHDQALIA1BA3RBwOkNaiAAOQMAIA1BAWoiDUECRw0AC0GA6g1BsOYMKwMAQaDtBSsDAKJB4IoIKwMAIgGiQdCFBisDACIAojkDAEHw6Q0gACABQaDmDCsDAEGQ7QUrAwCioqI5AwBB0OkN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kPAFQoCAgICAgID4PzcDAEHo7gVCgICAgICAgPg/NwMAQeDuBUKAgICAgICKwMAANwMAQdjuBUKAgICAgID20cAANwMAQdDuBUKAgICAgMD04sAANwMAQbjwBUKAgICAwMvyr8EANwMAQbDwBUKAgICA+I2qscEANwMAQajwBUKAgICAiOjassEANwMAQaDwBUKAgICAgICA+D83AwBBmPAFQoCAgICAgID4PzcDAEGI8AVCgICAgICA4LDAADcDAEGA8AVCgICAgICA4MLAADcDAEH47wVCgICAgICA6NPAADcDAEHw7wVCgICAgIDg9OLAADcDAEHo7wVCgICAgICgivLAADcDAEHg7wVCgICAgICMov7AADcDAEHY7wVCgICAgMDYoInBADcDAEHQ7wVCgICAgKD+lZLBADcDAEHI7wVCgICAgID7zZnBADcDAEHA7wVCgICAgKDHyZ7BADcDAEG47wVCgICAgID0iKLBADcDAEGw7wVCgICAgODJrqXBADcDAEGo7wVCgICAgPjTxqjBADcDAEGg7wVCgICAgMCszKrBADcDAEGY7wVCgICAgKD94KzBADcDAEGQ7wVCgICAgPjm/K7BADcDAEGI7wVCgICAgMD95LDBADcDAEGA7wVCgICAgKC6i7LBADcDAEH47gVCgICAgOCGrrPBADcDAEHw7gVCgICAgICAgPg/NwMAQbjxBUKAgICAgICA+D83AwBBqPIFQoCAgICAgNz3wAA3AwBBoPIFQoCAgICAzNGAwQA3AwBBmPIFQoCAgICAt5SIwQA3AwBBkPIFQoCAgICAlLCMwQA3AwBBiPIFQoCAgICgvsaQwQA3AwBBgPIFQoCAgIDgxqyTwQA3AwBB+PEFQoCAgIDAicOWwQA3AwBB8PEFQoCAgICA4f+YwQA3AwBB6PEFQoCAgIDA1OqawQA3AwBB4PEFQoCAgIDA1tucwQA3AwBB2PEFQoCAgIDgyfaewQA3AwBB0PEFQoCAgICAgID4PzcDAEHI8QVCgICAgICAgPg/NwMAQcDxBUKAgICAgICA+D83AwBBsPEFQoCAgICAgKixwAA3AwBBqPEFQoCAgICAgLTDwAA3AwBBoPEFQoCAgICAgMXUwAA3AwBBmPEFQoCAgICA0MrjwAA3AwBBkPEFQoCAgICAxNnywAA3AwBBiPEFQoCAgICA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s+bMmbPmzO0/NwMAQbCGBkKAgICAgICa0MAANwMAQbiGBkKAgICAgICAisAANwMAQcCGBkKAgICAgICAisAANwMAQciGBkKAgICAgIDkz8AANwMAQdCGBkKAgICAgICAiMAANwMAQdiGBkK8+sqymcSDgcAANwMAQeCGBkK8+sqymcSDgcAANwMAQeiGBkKAgICAgICAgMAANwMAQfCGBkKKuOvd+dSO9D83AwBB+IYGQoq469351I70PzcDAEGAhwZCueiituf3p8U/NwMAQYiHBkLpjIvNzp25+z83AwBBkIcGQumMi83Onbn7PzcDAEGYhwZCgICAgICAgIDAADcDAEGghwZCgICAgICAgITAADcDAEGohwZCueiituf3p8U/NwMAQbCHBkIANwMAQbiHBkKAgICAgICAksAANwMAQcCHBkKAgICAgIDAlMAANwMAQciHBkKAgICAgICAmsAANwMAQdCHBkKq1arVqtWqoMAANwMAQdiHBkKAgICAgICAhMAANwMAQeCHBkLK9o38wsnBj8AANwMAQeiHBkLK9o38wsnBj8AANwMAQfCHBkKvq8LupeL58j83AwBB+IcGQq+rwu6l4vnyPzcDAEGIiAZCgICAgICAgIzAADcDAEGAiAZCmrPmzJmz5uQ/NwMAQZCIBkL6/anjy+6k+D83AwBBmIgGQrPmzJmz5syAwAA3AwBBsIgGQoCAgICAgID4PzcDAEGoiAZC3J6Kro+F1/M/NwMAQaCIBkKAgICAgICA+D83AwBBuIgGQoCAgICAgKCrwAA3AwBBwIgGQs3cmIasx8PxPzcDAEHIiAZC2cGFp9L5x+A/NwMAQdCIBkKAgICAgIDnz8AANwMAQZiJBkKAgICAgICQwMAANwMAQZCJBkK/6vjSm4mmssAANwMAQYiJBkLloYvZnZ/5xsAANwMAQYCJBkKZxOO68bbko8AANwMAQfiIBkKQ9NnZ6uf9m8AANwMAQfCIBkKuj4XXx8K5sMAANwMAQeiIBkL4p42vupO3rsAANwMAQeCIBkLGudelyI+cocAANwMAQbiJBkKAgICAgICAisAANwMAQbCJBkKAgICAgIDApMAANwMAQaiJBkKAgICAgIDAnMAANwMAQaCJBkKAgICAgICAl8AANwMAQcCJBkKAgICA65H8/cEANwMAQciJBkKAgICAgIC0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gKjw0brBADcDAEGA4wZCgICAgJi1m7zBADcDAEGo5AZCgICAgICAgPg/NwMAQaDkBkKAgICAgICAscAANwMAQZjkBkKAgICAgICIw8AANwMAQZDkBkKAgICAgMCV1MAANwMAQYjkBkKAgICAgMCe48AANwMAQYDkBkKAgICAgOyw8sAANwMAQfjjBkKAgICAgNzY/sAANwMAQfDjBkKAgICAwJDEicEANwMAQejjBkKAgICAgPe8ksEANwMAQeDjBkKAgICA4N/ymcEANwMAQdjjBkKAgICA4K2Bn8EANwMAQcDlBkKAgICAgICAtMAANwMAQbjlBkKAgICAgICWxcAANwMAQbDlBkKAgICAgMCV1MAANwMAQajlBkKAgICAgOCe48AANwMAQaDlBkKAgICAgKD078AANwMAQZjlBkKAgICAgIap+sAANwMAQZDlBkKAgICAgOqrg8EANwMAQYjlBkKAgICAwMHbisEANwMAQYDlBkKAgICAgJGQkMEANwMAQfjkBkKAgICAoJ+dk8EANwMAQfDkBkKAgICAwLnzlsEANwMAQejkBkKAgICAwNLEmcEANwMAQeDkBkKAgICA4Lnom8EANwMAQdjkBkKAgICAwPWcnsEANwMAQdDkBkKAgICAsNqsoMEANwMAQcjkBkKAgICAgLrmocEANwMAQcDkBkKAgICA8Iugo8EANwMAQbjkBkKAgICAkLLVpMEANwMAQbDkBkKAgICAgICA+D83AwBB+OYGQoCAgICAgID4PzcDAEHQ5QZCgICAgICAgPg/NwMAQbDnBkKAgICAwKeEisEANwMAQajnBkKAgICAwJ+KjMEANwMAQaDnBkKAgICAgICXjsEANwMAQZjnBkKAgICAwJ2pkMEANwMAQZDnBkKAgICAgICA+D83AwBBiOcGQoCAgICAgID4PzcDAEGA5wZCgICAgICAgPg/NwMAQfDmBkKAgICAgICgosAANwMAQejmBkKAgICAgIDgtMAANwMAQeDmBkKAgICAgID+xcAANwMAQdjmBkKAgICAgID11MAANwMAQdDmBkKAgICAgJD348AANwMAQcjmBkKAgICAgNi48MAANwMAQcDmBkKAgICAgJz6+sAANwMAQbjmBkKAgICAgIaFhMEANwMAQbDmBkKAgICAgOWvi8EANwMAQajmBkKAgICAgIbQkMEANwMAQaDmBkKAgICA4Mf1k8EANwMAQZjmBkKAgICAgNPol8EANwMAQZDmBkKAgICAwNKPmsEANwMAQYjmBkKAgICAgLLFnMEANwMAQYDmBkKAgICAgOiMn8EANwMAQfjlBkKAgICAgLDuoMEANwMAQfDlBkKAgICA8MSzosEANwMAQejlBkKAgICA4Mr4o8EANwMAQeDlBkKAgICAgICA+D83AwBB2OUGQoCAgICAgID4PzcDAEHI5QZCgICAgICA4KHAADcDAEGg6QZCgICAgIC43PDAADcDAEGY6QZCgICAgICMrPzAADcDAEGQ6QZCgICAgICNgYjBADcDAEGI6QZCgICAgIDM5pDBADcDAEGA6QZCgICAgKCiqJjBADcDAEH46AZCgICAgOCfzpzBADcDAEHw6AZCgICAgICj26DBADcDAEHo6AZCgICAgOCSyKPBADcDAEHg6AZCgICAgKCx5qbBADcDAEHY6AZCgICAgIDRlanBADcDAEHQ6AZCgICAgOD/hKvBADcDAEHI6AZCgICAgLDL+qzBADcDAEHA6AZCgICAgODumq/BADcDAEG46AZCgICAgNCz77HBADcDAEGw6AZCgICAgNDFwbbBADcDAEGo6AZCgICAgLDq4LrBADcDAEGg6AZCgICAgIjKrLzBADcDAEGY6AZCgICAgICAgJDAADcDAEGQ6AZCgICAgICAoKLAADcDAEGI6AZCgICAgICAmLPAADcDAEGA6AZCgICAgICAqsLAADcDAEH45wZCgICAgIDAxdHAADcDAEHw5wZCgICAgICAwd3AADcDAEHo5wZCgICAgIDg4ejAADcDAEHg5wZCgICAgIDs0PHAADcDAEHY5wZCgICAgIDQjPnAADcDAEHQ5wZCgICAgIC85v3AADcDAEHI5wZCgICAgIC5xIHBADcDAEHA5wZCgICAgIDd04TBADcDAEG45wZCgICAgIDCjIjBADcDAEHw6gZCgICAgICAgPg/NwMAQcjpBkKAgICAgICA+D83AwBBwOkGQoCAgICAgJCvwAA3AwBBuOkGQoCAgICAgKbBwAA3AwBBsOkGQoCAgICAwJzSwAA3AwBBqOkGQoCAgICA0LjhwAA3AwBBkOsGQoCAgIDg4omkwQA3AwBBiOsGQoCAgIDgwu6lwQA3AwBBgOsGQoCAgICAgID4PzcDAEH46gZCgICAgICAgPg/NwMAQejqBkKAgICAgICgpsAANwMAQeDqBkKAgICAgIDYuMAANwMAQdjqBkKAgICAgIDHycAANwMAQdDqBkKAgICAgIDq2MAANwMAQcjqBkKAgICAgPCT6MAANwMAQcDqBkKAgICAgLTF88AANwMAQbjqBkKAgICAgP78/sAANwMAQbDqBkKAgICAwLGdiMEANwMAQajqBkKAgICAwJzGj8EANwMAQaDqBkKAgICAgK3lk8EANwMAQZjqBkKAgICA4OaSmMEANwMAQZDqBkKAgICAwPvnmsEANwMAQYjqBkKAgICAgKXrncEANwMAQYDqBkKAgICAkK/JoMEANwMAQfjpBkKAgICAoJeposEANwMAQfDpBkKAgICA4OeOpMEANwMAQejpBkKAgICA0K2cpsEANwMAQeDpBkKAgICAuO+UqMEANwMAQdjpBkKAgICA+LSYqcEANwMAQdDpBkKAgICAgICA+D83AwBBmOwGQoCAgICAgID4PzcDAEGA7QZCgICAgICYl/PAADcDAEH47AZCgICAgICCyPrAADcDAEHw7AZCgICAgICsgYDBADcDAEHo7AZCgICAgIDoiIPBADcDAEHg7AZCgICAgICq2IbBADcDAEHY7AZCgICAgMCks4nBADcDAEHQ7AZCgICAgID50ovBADcDAEHI7AZCgICAgMCDg47BADcDAEHA7AZCgICAgKDBnZDBADcDAEG47AZCgICAgIDP1JHBADcDAEGw7AZCgICAgICAgPg/NwMAQajsBkKAgICAgICA+D83AwBBoOwGQoCAgICAgID4PzcDAEGQ7AZCgICAgICAgKTAADcDAEGI7AZCgICAgICA4LbAADcDAEGA7AZCgICAgICAj8jAADcDAEH46wZCgICAgICA/9bAADcDAEHw6wZCgICAgIDw7OXAADcDAEHo6wZCgICAgIDI5vHAADcDAEHg6wZCgICAgIDo2/zAADcDAEHY6wZCgICAgID+/IXBADcDAEHQ6wZCgICAgICCmo3BADcDAEHI6wZCgICAgIDXgZLBADcDAEHA6wZCgICAgMCB65XBADcDAEG46wZCgICAgKCal5nBADcDAEGw6wZCgICAgICN4JvBADcDAEGo6wZCgICAgKDXx57BADcDAEGg6wZCgICAgPDx4aDBADcDAEGY6wZCgICA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gICA+D83AwBBsNIHQpqz5syZs+b8PzcDAEG40gdCzZmz5syZs/Y/NwMAQcDTB0KAgICAgICAisAANwMAQYDTB0KAgICAgICAkMAANwMAQeDSB0KAgICAgICAkMAANwMAQdDSB0KAgICAgICAisAANwMAQejTB0IANwMAQfDTB0IANwMAQfjTB0KAgICAgICA+D83AwBBiNQHQoCAgICAgID8PzcDAEGA1AdCgICAgICAgPw/NwMAQZDUB0KAgICAgICA+D83AwBBmNQHQoCAgICAgID4PzcDAEHY1AdCgICAgICAgPg/NwMAQdDUB0KAgICAgICA+D83AwBByNQHQoCAgICAgID4PzcDAEHA1AdCgICAgICAgPg/NwMAQaDUB0KAgICAgICA+D83AwBB4NQHQpTcnoquj4X5PzcDAEHo1AdCgICAgICAgIrAADcDAEHw1AdCgICAgICAgPg/NwMAQfjUB0KAgICAgICAgMAANwMAQYDVB0IANwMAQYjVB0Kas+bMmbPm3D83AwBBkNUHQgA3AwBBmNUHQpqz5syZs+bUPzcDAEGg1QdCztCQgpyE9fg/NwMAQajVB0LS8PqouL2U3D83AwBBsNUHQubMmbPmzJn7PzcDAEG41QdCgICAgICAgIrAADcDAEHA1QdCgICAgICAgIrAADcDAEHI1QdCgICAgICAgIrAADcDAEHQ1QdCgICAgICAgIrAADcDAEHY1QdCgICAgICAgIrAADcDAEHg1QdCgICAgICAgIrAADcDAEHo1QdCgICAgICAgIrAADcDAEHw1QdCgICAgICAgPg/NwMAQYjWB0IANwMAQYDWB0IANwMAQaDWB0KAgICAgICA+D83AwBBqNYHQrPmzJmz5sz1PzcDAEHg2AdCgICAgICAgK/AADcDAEHo2AdCgICAgICAgKrAADcDAEHw2AdCgICAgICAwKzAADcDAEH42AdCADcDAEGA2QdC+v2p48vupLQ/NwMAQYjZB0Kas+bMmbPm3D83AwBBkNkHQs7QkIKchPX4PzcDAEGY2QdC5syZs+bMmfs/NwMAQaDZB0IANwMAQajZB0IANwMAQbDZB0IANwMAQbjZB0KAgICAgICA+D83AwBBwNkHQoCAgICAgIDwPzcDAEHI2QdCgICAgICAgPA/NwMAQdDZB0KAgICQytLGrsIANwMAQcjX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AwALEAAjACAAa0FwcSIAJAAgAAsGACAAJAALBAAjAAsGACAAECQLBgAgABAUC9ECAQd/IwBBIGsiAyQAIAMgACgCHCIENgIQIAAoAhQhBSADIAI2AhwgAyABNgIYIAMgBSAEayIBNgIUIAEgAmohBEECIQcgA0EQaiIFIQECfwJAAkAgACgCPCAFQQIgA0EMahAAEB1FBEADQCAEIAMoAgwiBUYNAiAFQQBIDQMgASAFIAEoAgQiCEsiBkEDdGoiCSAFIAhBACAGG2siCCAJKAIAajYCACABQQxBBCAGG2oiCSAJKAIAIAhrNgIAIAQgBWshBCAAKAI8IAFBCGogASAGGyIBIAcgBmsiByADQQxqEAAQHUUNAAsLIARBf0cNAQsgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCECACDAELIABBADYCHCAAQgA3AxAgACAAKAIAQSByNgIAQQAgB0ECRg0AGiACIAEoAgRrCyEEIANBIGokACAEC0EBAX8jAEEQayIDJAAgACgCPCABpyABQiCIpyACQf8BcSADQQhqEAEQHSEAIAMpAwghASADQRBqJABCfyABIAAbCxAAQZYKQaMBQdAjKAIAECILCQAgACgCPBAECzIBAX8gACgCFCIDIAEgAiAAKAIQIANrIgEgASACSxsiARANIAAgACgCFCABajYCFCACC5MFAgZ+AX8gASABKAIAQQdqQXhxIgFBEGo2AgAgAAJ8IAEpAwAhBCABKQMIIQUjAEEgayIBJAACQCAFQv///////////wCDIgNCgICAgICAwIA8fSADQoCAgICAgMD/wwB9VARAIAVCBIYgBEI8iIQhAyAEQv//////////D4MiBEKBgICAgICAgAhaBEAgA0KBgICAgICAgMAAfCECDAILIANCgICAgICAgIBAfSECIARCgICAgICAgIAIhUIAUg0BIAIgA0IBg3whAgwBCyAEUCADQoCAgICAgMD//wBUIANCgICAgICAwP//AFEbRQRAIAVCBIYgBEI8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIANC////////v//DAFYNAEIAIQIgA0IwiKciCEGR9wBJDQAgBCECIAVC////////P4NCgICAgICAwACEIgMhBgJAIAhBgfcAayIAQcAA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KwMAEAVBqPIMKwMAEAVBqMIOKwMAEAVBsPIMKwMAEAVBmMIOKwMAEAVBuPIMKwMAEAVB2OkNKwMAEAVB4OkNKwMAEAVB6OkNKwMAEAVB+OkNKwMAEAVBiOoNKwMAEAVB0OkNKwMAEAVB8OkNKwMAEAVBgOoNKwMAEAVBoOoNKwMAEAVBmOoNKwMAEAVBkOoNKwMAEAVBgMEOKwMAEAVB+MkIKwMAEAVB8MAOKwMAEAVB+MwNKwMAEAVByP4MKwMAEAVB2O8LKwMAEAVB4O8LKwMAEAVB6O8LKwMAEAVB+O8LKwMAEAVBiPALKwMAEAVB0O8LKwMAEAVB8O8LKwMAEAVBgPALKwMAEAVBiMAOKwMAEAVBkMAOKwMAEAVBmMAOKwMAEAVBqMAOKwMAEAVBuMAOKwMAEAVBgMAOKwMAEAVBoMAOKwMAEAVBsMAOKwMAEAVByP8FKwMAEAVB2P8FKwMAEAVBwP8FKwMAEAVB0P8FKwMAEAVByPMLKwMAEAVB2PMLKwMAEAVBwPMLKwMAEAVB0PMLKwMAEAVB8L8OKwMAEAVB4L8OKwMAEAVBwN4IKwMAEAVB2LsOKwMAEAVB8KoOKwMAEAVBgOYNKwMAEAVBmOcNKwMAEAVBgOcNKwMAEAVB8LgOKwMAEAVB+KoOKwMAEAVBkOYNKwMAEAVBmOYNKwMAEAVB6LgOKwMAEAVB+OwMKwMAEAVBgO0MKwMAEAVBiO0MKwMAEAVBmO0MKwMAEAVBqO0MKwMAEAVB8OwMKwMAEAVBkO0MKwMAEAVBoO0MKwMAEAVByLwOKwMAEAVBwLwOKwMAEAVBuLwOKwMAEAVBsLwOKwMAEAVBsOIMKwMAEAVB6OIMKwMAEAVB+OIMKwMAEAVBwOIMKwMAEAVB4OIMKwMAEAVB8OIMKwMAEAVByN4MKwMAEAVB+N4MKwMAEAVBiN8MKwMAEAVB0N4MKwMAEAVB8N4MKwMAEAVBgN8MKwMAEAVB6OUMKwMAEAVB+OUMKwMAEAVB4OUMKwMAEAVB8OUMKwMAEAVB4NwMKwMAEAVBwLgOKwMAEAVByLgOKwMAEAVBqLgOKwMAEAVBsLgOKwMAEAVBuLgOKwMAEAVBoLgOKwMAEAVB8PIMKwMAEAVBkK0OKwMAEAVB2KkOKwMAEAVBwKkOKwMAEAVB2KwOKwMAEAVB4KwOKwMAEAVB6KwOKwMAEAVB+KwOKwMAEAVBiK0OKwMAEAVB0KwOKwMAEAVB8KwOKwMAEAVBgK0OKwMAEAVBiKwOKwMAEAVB6M4NKwMAEAVBuNsMKwMAEAVBqNsMKwMAEAVBoNsMKwMAEAVBsNsMKwMAEAVBkKsOKwMAEAVByKcOKwMAEAVB0KcOKwMAEAVB2KcOKwMAEAVB6KcOKwMAEAVB+KcOKwMAEAVBwKcOKwMAEAVB4KcOKwMAEAVB8KcOKwMAEAVBmPILKwMAEAVBiPILKwMAEAVBgPILKwMAEAVBkPILKwMAEAVB4KkOKwMAEAVByKkOKwMAEAVB6OsNKwMAEAVB8OsNKwMAEAVB+OsNKwMAEAVBiOwNKwMAEAVBmOwNKwMAEAVB4OsNKwMAEAVBgOwNKwMAEAVBkOwNKwMAEAVB0KkOKwMAEAVBuKkOKwMAEAVB8PULKwMAEAVBiKgOKwMAEAVBkKgOKwMAEAVBmKgOKwMAEAVBqKgOKwMAEAVBuKgOKwMAEAVBgKgOKwMAEAVBoKgOKwMAEAVBsKgOKwMAEAVB0KgOKwMAEAVByKgOKwMAEAVBwPQLKwMAEAVBsPQLKwMAEAVBoJANKwMAEAVBoOsNKwMAEAVB6OoNKwMAEAVB4OoNKwMAEAVBwOoNKwMAEAVBgIcOKwMAEAVBsIwNKwMAEAVB+JMIKwMAEAVBgPsMKwMAEAVBoIYOKwMAEAVBmIYOKwMAEAVB0OYNKwMAEAVB6OUNKwMAEAVByOYNKwMAEAVB8IUOKwMAEAVBqOMNKwMAEAVBwIIOKwMAEAVB6P8NKwMAEAVB4P8NKwMAEAVB2P8NKwMAEAVB0P8NKwMAEAVB6LkMKwMAEAVBkP4NKwMAEAVBiP4NKwMAEAVBgP4NKwMAEAVB+P0NKwMAEAVB0OoNKwMAEAVB8JMIKwMAEAVBwPINKwMAEAVBuOwNKwMAEAVBwOwNKwMAEAVByOwNKwMAEAVB2OwNKwMAEAVB6OwNKwMAEAVBsOwNKwMAEAVB0OwNKwMAEAVB4OwNKwMAEAVB+M4NKwMAEAVBwOsNKwMAEAVBsO0MKwMAEAVByJQIKwMAEAVB6NwMKwMAEAVB8OgNKwMAEAVBiOkNKwMAEAVBkOkNKwMAEAVBmOkNKwMAEAVBqOkNKwMAEAVBuOkNKwMAEAVBgOkNKwMAEAVBoOkNKwMAEAVBsOkN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DSsDAEGg+QsrAwChoqA5AwBB2KYMQdimDCsDACADQbiVDisDAEGolQ4rAwChoqA5AwBB4KYMQeCmDCsDACADQbCVDisDAEGYlQ4rAwChoqA5AwBB0KYMQdCmDCsDACADQaCVDisDAEGYmA4rAwChoqA5AwBBmKcMQZinDCsDACADQZCVDisDAEGAlQ4rAwChoqA5AwBBoKcMQaCnDCsDACADQYiVDisDAEHwlA4rAwChoqA5AwBBkKcMQZCnDCsDACADQfiUDisDAEGImA4rAwChoqA5AwBBkKoMQZCqDCsDACADQeiUDisDAEHYlA4rAwChoqA5AwBBmKoMQZiqDCsDACADQeCUDisDAEHIlA4rAwChoqA5AwBBiKoMQYiqDCsDACADQdCUDisDAEH4lw4rAwChoqA5AwBB2KoMQdiqDCsDACADQcCUDisDAEGwlA4rAwChoqA5AwBB4KoMQeCqDCsDACADQbiUDisDAEGglA4rAwChoqA5AwBB0KoMQdCqDCsDACADQaiUDisDAEHolw4rAwChoqA5AwBBiK0MQYitDCsDACADQZiUDisDAEGIlA4rAwChoqA5AwBBkK0MQZCtDCsDACADQZCUDisDAEH4kw4rAwChoqA5AwBBgK0MQYCtDCsDACADQYCUDisDAEHYlw4rAwChoqA5AwBB6K0MQeitDCsDACADQfCTDisDAEHgkw4rAwChoqA5AwBB8K0MQfCtDCsDACADQeiTDisDAEHQkw4rAwChoqA5AwBB4K0MQeCtDCsDACADQdiTDisDAEHIlw4rAwChoqA5AwBBkLAMQZCwDCsDACADQciTDisDAEG4kw4rAwChoqA5AwBBmLAMQZiwDCsDACADQcCTDisDAEGokw4rAwChoqA5AwBBiLAMQYiwDCsDACADQbCTDisDAEG4lw4rAwChoqA5AwBBACEAQfCwDEHwsAwrAwBBoJMOKwMAQZCTDisDAKFBoNsHKwMAIgOioDkDAEH4sAxB+LAMKwMAIANBmJMOKwMAQYCTDisDAKGioDkDAEHosAxB6LAMKwMAIANBiJMOKwMAQaiXDisDAKGioDkDAEGgswxBoLMMKwMAIANB+JIOKwMAQeiSDisDAKGioDkDAEGoswxBqLMMKwMAIANB8JIOKwMAQdiSDisDAKGioDkDAEGYswxBmLMMKwMAIANB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A6KgOQNAQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCaCGoiAiACKwNIIABB4PUMaiICKwNAIABBsLAOaisDSKEgAisDSKEgA6KgOQNIQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCaCGoiAiACKwNQIAFB4PUMaiICKwNIIAFBsLAOaisDUKEgAisDUKEgA6KgOQNQQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCaCGoiAiACKwNYIABB4PUMaiICKwNQIABBsLAOaisDWKEgAisDWKEgA6KgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCaCGoiAiACKwNgIAFB4PUMaiICKwNYIAFBsLAOaisDYKEgAisDYKEgA6KgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCaCGoiAiACKwNoIABB4PUMaiICKwNgIABBsLAOaisDaKEgAisDaKEgA6KgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCaCGoiAiACKwNwIAFB4PUMaiICKwNoIAFBsLAOaisDcKEgAisDcKEgA6KgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCaCGoiAiACKwN4IABB4PUMaiICKwNwIABBsLAOaisDeKEgAisDeKEgA6KgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCaCGoiAiACKwOAASABQeD1DGoiAisDeCABQbCwDmorA4ABoSACKwOAAaEgA6KgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHwmghqIgIgAisDiAEgAEHg9QxqIgIrA4ABIABBsLAOaisDiAGhIAIrA4gBoSADoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCaCGoiAiACKwOQASABQeD1DGoiAisDiAEgAUGwsA5qKwOQAaEgAisDkAGhIAOioDkDkAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgBB8JoIaiICIAIrA5gBIABB4PUMaiICKwOQASAAQbCwDmorA5gBoSACKwOYAaEgA6KgOQOYAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHwmghqIgIgAisDoAEgAUHg9QxqIgIr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BKA5AwBB0KUIQdClCCsDACAEoDkDAEHYpQhB2KUIKwMAIASgOQMAQfimCEH4pggrAwAgBKA5AwBBgKcIQYCnCCsDACAEoDkDAEEBIQBBASECQQAhCwNAIAtBqAFsIgpBwKUIaiILIAsrAyAgCkHQnA5qKwMgIApB4K0OaisDIKEgCkGw+AxqKwMgoSADoqA5AyAgAiEKQQAhAkEBIQsgCg0ACwNAIAFBqAFsIgFBwKUIaiICIAIrAyggAUHQnA5qKwMoIAFB4K0OaisDKKEgAUGw+AxqIgErAyihIAErAyCgIAOioDkDKEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHApQhqIgIgAisDMCAAQdCcDmorAzAgAEHgrQ5qKwMwoSAAQbD4DGoiACsDMKEgACsDKKAgA6KgOQMwQQEhACABIQJBACEBIAINAAtByKUIQcilCCsDACAEoDkDAEHwpghB8KYIKwMAIASgOQMAQQEhAkEAIQsDQCALQagBbCIKQcClCGoiCyALKwM4IApBsPgMaiILKwMwIApB4K0OaisDOKEgCysDOKEgA6KgOQM4IAIhCkEAIQJBASELIAoNAAsDQCABQagBbCIBQcClCGoiAiACKwNAIAFBsPgMaiICKwM4IAFB4K0OaisDQKEgAisDQKEgA6KgOQNAQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQcClCGoiAiACKwNIIABBsPgMaiICKwNAIABB4K0OaisDSKEgAisDSKEgA6KgOQNIQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQcClCGoiAiACKwNQIAFBsPgMaiICKwNIIAFB4K0OaisDUKEgAisDUKEgA6KgOQNQQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQcClCGoiAiACKwNYIABBsPgMaiICKwNQIABB4K0OaisDWKEgAisDWKEgA6KgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQcClCGoiAiACKwNgIAFBsPgMaiICKwNYIAFB4K0OaisDYKEgAisDYKEgA6KgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQcClCGoiAiACKwNoIABBsPgMaiICKwNgIABB4K0OaisDaKEgAisDaKEgA6KgOQNoQQEhACABIQJBACEBIAIN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",BA(J)||(J=a(J));function oA(C){try{if(C==J&&m)return new Uint8Array(m);var I=DA(C);if(I)return I;if(O)return O(C);throw"both async and sync fetching of the wasm failed"}catch(s){_(s)}}function nA(){if(!m&&(M||K)){if(typeof fetch=="function"&&!MA(J))return fetch(J,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+J+"\'";return C.arrayBuffer()}).catch(function(){return oA(J)});if(k)return new Promise(function(C,I){k(J,function(s){C(new Uint8Array(s))},I)})}return Promise.resolve().then(function(){return oA(J)})}function tA(){var C={a:dA};function I(G,r){var f=G.exports;Q.asm=f,F=Q.asm.f,S(F.buffer),V=Q.asm.o,aA(Q.asm.g),NA()}HA();function s(G){I(G.instance)}function e(G){return nA().then(function(r){return WebAssembly.instantiate(r,C)}).then(function(r){return r}).then(G,function(r){n("failed to asynchronously prepare wasm: "+r),_(r)})}function u(){return!m&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(J)&&!MA(J)&&typeof fetch=="function"?fetch(J,{credentials:"same-origin"}).then(function(G){var r=WebAssembly.instantiateStreaming(G,C);return r.then(s,function(f){return n("wasm streaming compile failed: "+f),n("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(C,I);return z}catch(G){return n("Module.instantiateWasm callback failed with error: "+G),!1}return u().catch(w),{}}function wA(C){for(;C.length>0;){var I=C.shift();if(typeof I=="function"){I(Q);continue}var s=I.func;typeof s=="number"?I.arg===void 0?iA(s)():iA(s)(I.arg):s(I.arg===void 0?null:I.arg)}}function iA(C){return V.get(C)}function OA(C,I,s){U.copyWithin(C,I,I+s)}function hA(C){_("OOM")}function uA(C){U.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,I){var s=AA.buffers[C];I===0||I===10?((C===1?N:n)(y(s,0)),s.length=0):s.push(I)},varargs:void 0,get:function(){AA.varargs+=4;var C=j[AA.varargs-4>>2];return C},getStr:function(C){var I=x(C);return I},get64:function(C,I){return C}};function zA(C){return 0}function jA(C,I,s,e,u){}function fA(C,I,s,e){for(var u=0,z=0;z<s;z++){var G=j[I>>2],r=j[I+4>>2];I+=8;for(var f=0;f<r;f++)AA.printChar(C,U[G+f]);u+=r}return j[e>>2]=u,0}var mA=typeof atob=="function"?atob:function(C){var I="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,z,G,r,f,b,L=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do G=I.indexOf(C.charAt(L++)),r=I.indexOf(C.charAt(L++)),f=I.indexOf(C.charAt(L++)),b=I.indexOf(C.charAt(L++)),e=G<<2|r>>4,u=(r&15)<<4|f>>2,z=(f&3)<<6|b,s=s+String.fromCharCode(e),f!==64&&(s=s+String.fromCharCode(u)),b!==64&&(s=s+String.fromCharCode(z));while(L<C.length);return s};function qA(C){try{for(var I=mA(C),s=new Uint8Array(I.length),e=0;e<I.length;++e)s[e]=I.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(C){if(BA(C))return qA(C.slice(EA.length))}var dA={c:OA,d:uA,e:zA,b:jA,a:fA};tA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=R;var QA;W=function C(){QA||IA(),QA||(W=C)};function IA(C){if(l>0||(X(),l>0))return;function I(){QA||(QA=!0,Q.calledRun=!0,!Z&&(GA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),kA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),I()},1)):I()}if(Q.run=IA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return IA(),Q.ready})})();exposeModelWorker(Module)})();\n';
class BundleModelRunner {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(e, r, o) {
    this.modelSpec = e, this.inputMap = r, this.modelRunner = o, this.inputs = [...r.values()].map((Q) => Q.value), this.outputs = o.createOutputs();
  }
  async runModelForScenario(e, r) {
    return setInputsForScenario(this.inputMap, e), r[0]?.startsWith("ModelImpl") ? this.runModelWithImplOutputs(r) : this.runModelWithNormalOutputs(r);
  }
  async runModelWithNormalOutputs(e) {
    this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const r = this.outputs.runTimeInMillis, o = /* @__PURE__ */ new Map();
    for (const Q of e) {
      const i = this.modelSpec.outputVars.get(Q);
      if (i)
        if (i.sourceName === void 0) {
          const B = this.outputs.getSeriesForVar(i.varId);
          B && o.set(Q, datasetFromPoints(B.points));
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
    for (const w of e) {
      const n = this.modelSpec.implVars.get(w);
      n && r.push(n);
    }
    const o = this.outputs.startTime, Q = this.outputs.endTime, i = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, Q, i);
    B = await this.modelRunner.runModel(this.inputs, B);
    const s = B.runTimeInMillis, a = /* @__PURE__ */ new Map();
    for (const w of e) {
      const n = this.modelSpec.implVars.get(w), E = B.getSeriesForVar(n.varId);
      E && a.set(w, datasetFromPoints(E.points));
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
  const Q = [], i = [];
  for (const s of A)
    Q.push(s.varId), i.push({
      varIndex: s.varIndex,
      subscriptIndices: s.subscriptIndices
    });
  const B = new Outputs(Q, e, r, o);
  return B.varSpecs = i, B;
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
  const A = getInputVars(inputSpecs), e = getOutputVars(outputSpecs), { implVars: r, implVarGroups: o } = getImplVars(encodedImplVars), Q = {
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
    modelSpec: Q,
    initModel: () => initBundleModel(Q, A)
  };
}
export {
  createBundle
};
