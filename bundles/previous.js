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
        const g = B;
        super(new Function(g), [], { esm: !0 });
      }
      e.push(this), this.emitter = new EventEmitter(), this.onerror = (g) => this.emitter.emit("error", g), this.onmessage = (g) => this.emitter.emit("message", g);
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
    return E >= o ? g(n, E, o, "day") : E >= r ? g(n, E, r, "hour") : E >= e ? g(n, E, e, "minute") : E >= A ? g(n, E, A, "second") : n + " ms";
  }
  function g(n, E, l, f) {
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
    o.debug = o, o.default = o, o.coerce = g, o.disable = s, o.enable = i, o.enabled = a, o.humanize = requireMs(), o.destroy = n, Object.keys(e).forEach((E) => {
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
      let l, f = null, h, I;
      function w(...C) {
        if (!w.enabled)
          return;
        const t = w, D = Number(/* @__PURE__ */ new Date()), c = D - (l || D);
        t.diff = c, t.prev = l, t.curr = D, l = D, C[0] = o.coerce(C[0]), typeof C[0] != "string" && C.unshift("%O");
        let d = 0;
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (m, p) => {
          if (m === "%%")
            return "%";
          d++;
          const H = o.formatters[p];
          if (typeof H == "function") {
            const q = C[d];
            m = H.call(t, q), C.splice(d, 1), d--;
          }
          return m;
        }), o.formatArgs.call(t, C), (t.log || o.log).apply(t, C);
      }
      return w.namespace = E, w.useColors = o.useColors(), w.color = o.selectColor(E), w.extend = Q, w.destroy = o.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (h !== o.namespaces && (h = o.namespaces, I = o.enabled(E)), I),
        set: (C) => {
          f = C;
        }
      }), typeof o.init == "function" && o.init(w), w;
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
      let f = 0, h = 0, I = -1, w = 0;
      for (; f < E.length; )
        if (h < l.length && (l[h] === E[f] || l[h] === "*"))
          l[h] === "*" ? (I = h, w = f, h++) : (f++, h++);
        else if (I !== -1)
          h = I + 1, w++, f = w;
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
    function a(E) {
      for (const l of o.skips)
        if (B(E, l))
          return !1;
      for (const l of o.names)
        if (B(E, l))
          return !0;
      return !1;
    }
    function g(E) {
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
      const g = "color: " + this.color;
      a.splice(1, 0, g, "color: inherit");
      let n = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (n++, l === "%c" && (E = n));
      }), a.splice(E, 0, g);
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
      } catch (g) {
        return "[UnexpectedJSONParseError]: " + g.message;
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
        const g = !i;
        if (i = !0, !g || Q)
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
          const g = r.from(a).subscribe({
            next(n) {
              o.next(n);
            },
            error(n) {
              o.error(n);
            },
            complete() {
              const n = Q.indexOf(g);
              n >= 0 && Q.splice(n, 1), B();
            }
          });
          Q.push(g);
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
      }, g = (n) => {
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
      this.fulfillmentCallbacks.push(g), this.rejectionCallbacks.push(a);
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
        g(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    g((o = o.apply(A, e || [])).next());
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
        g(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
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
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, Q && (i = g[0] & 2 ? Q.return : g[0] ? Q.throw || ((i = Q.return) && i.call(Q), 0) : Q.next) && !(i = i.call(Q, g[1])).done) return i;
      switch (Q = 0, i && (g = [g[0] & 2, i.value]), g[0]) {
        case 0:
        case 1:
          i = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, Q = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (i = r.trys, !(i = i.length > 0 && i[i.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!i || g[1] > i[0] && g[1] < i[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < i[1]) {
            r.label = i[1], i = g;
            break;
          }
          if (i && r.label < i[2]) {
            r.label = i[2], r.ops.push(g);
            break;
          }
          i[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], Q = 0;
    } finally {
      o = i = 0;
    }
    if (g[0] & 5) throw g[1];
    return { value: g[0] ? g[1] : void 0, done: !0 };
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
    var g;
    a !== o && (o = a, (g = Q.onSet) == null || g.call(Q));
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
    for (let g = 0; g < a; g++)
      e[o++] = s[g];
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
    const g = A[o++], n = A[o++], E = {
      varIndex: B,
      subscriptIndices: a
    };
    let l;
    g >= 0 ? e ? l = e.slice(g, g + n) : l = new Float64Array(0) : l = void 0, r.push({
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
          const g = cartesianProductOf(a);
          for (const n of g) {
            const E = n.map((h) => h.id).join(","), l = n.map((h) => h.index), f = `${i}[${E}]`;
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
    let g = 0;
    function n(M, m) {
      const p = g, H = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, q = Math.round(m * H), b = Math.ceil(q / 8) * 8;
      return g += b, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), h = n("float64", Q), I = n("int32", i), w = n("float64", s), C = n("int32", a), t = g;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const D = this.header.view;
    let c = 0;
    D[c++] = l, D[c++] = extrasLengthInElements, D[c++] = f, D[c++] = o, D[c++] = h, D[c++] = Q, D[c++] = I, D[c++] = i, D[c++] = w, D[c++] = s, D[c++] = C, D[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, h, Q), this.outputIndices.update(this.encoded, I, i), this.lookups.update(this.encoded, w, s), this.lookupIndices.update(this.encoded, C, a);
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
    const i = o[Q++], B = o[Q++], s = o[Q++], a = o[Q++], g = o[Q++], n = o[Q++], E = o[Q++], l = o[Q++], f = o[Q++], h = o[Q++], I = o[Q++], w = o[Q++], C = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, D = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = h * Float64Array.BYTES_PER_ELEMENT, M = w * Int32Array.BYTES_PER_ELEMENT, m = e + C + t + D + c + d + M;
    if (A.byteLength < m)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, i, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, g, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, h), this.lookupIndices.update(this.encoded, I, w);
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
    runModel: async (s, a, g) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (i)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      i = !0, Q.updateFromParams(s, a, g);
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
        return (t = this._str) !== null && t !== void 0 ? t : this._str = this._items.reduce((D, c) => `${D}${c}`, "");
      }
      get names() {
        var t;
        return (t = this._names) !== null && t !== void 0 ? t : this._names = this._items.reduce((D, c) => (c instanceof r && (D[c.str] = (D[c.str] || 0) + 1), D), {});
      }
    }
    A._Code = o, A.nil = new o("");
    function Q(C, ...t) {
      const D = [C[0]];
      let c = 0;
      for (; c < t.length; )
        s(D, t[c]), D.push(C[++c]);
      return new o(D);
    }
    A._ = Q;
    const i = new o("+");
    function B(C, ...t) {
      const D = [f(C[0])];
      let c = 0;
      for (; c < t.length; )
        D.push(i), s(D, t[c]), D.push(i, f(C[++c]));
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
        if (C[t] === i) {
          const D = g(C[t - 1], C[t + 1]);
          if (D !== void 0) {
            C.splice(t - 1, 3, D);
            continue;
          }
          C[t++] = "+";
        }
        t++;
      }
    }
    function g(C, t) {
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
      return typeof C == "string" && A.IDENTIFIER.test(C) ? new o(`.${C}`) : Q`[${C}]`;
    }
    A.getProperty = h;
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
      constructor(g) {
        super(`CodeGen: "code" for ${g} not defined`), this.value = g.value;
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
      constructor({ prefixes: g, parent: n } = {}) {
        this._names = {}, this._prefixes = g, this._parent = n;
      }
      toName(g) {
        return g instanceof e.Name ? g : this.name(g);
      }
      name(g) {
        return new e.Name(this._newName(g));
      }
      _newName(g) {
        const n = this._names[g] || this._nameGroup(g);
        return `${g}${n.index++}`;
      }
      _nameGroup(g) {
        var n, E;
        if (!((E = (n = this._parent) === null || n === void 0 ? void 0 : n._prefixes) === null || E === void 0) && E.has(g) || this._prefixes && !this._prefixes.has(g))
          throw new Error(`CodeGen: prefix "${g}" is not allowed in this scope`);
        return this._names[g] = { prefix: g, index: 0 };
      }
    }
    A.Scope = Q;
    class i extends e.Name {
      constructor(g, n) {
        super(n), this.prefix = g;
      }
      setValue(g, { property: n, itemIndex: E }) {
        this.value = g, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = i;
    const B = (0, e._)`\n`;
    class s extends Q {
      constructor(g) {
        super(g), this._values = {}, this._scope = g.scope, this.opts = { ...g, _n: g.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(g) {
        return new i(g, this._newName(g));
      }
      value(g, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(g), { prefix: f } = l, h = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let I = this._values[f];
        if (I) {
          const t = I.get(h);
          if (t)
            return t;
        } else
          I = this._values[f] = /* @__PURE__ */ new Map();
        I.set(h, l);
        const w = this._scope[f] || (this._scope[f] = []), C = w.length;
        return w[C] = n.ref, l.setValue(n, { property: f, itemIndex: C }), l;
      }
      getValue(g, n) {
        const E = this._values[g];
        if (E)
          return E.get(n);
      }
      scopeRefs(g, n = this._values) {
        return this._reduceValues(n, (E) => {
          if (E.scopePath === void 0)
            throw new Error(`CodeGen: name "${E}" has no value`);
          return (0, e._)`${g}${E.scopePath}`;
        });
      }
      scopeCode(g = this._values, n, E) {
        return this._reduceValues(g, (l) => {
          if (l.value === void 0)
            throw new Error(`CodeGen: name "${l}" has no value`);
          return l.value.code;
        }, n, E);
      }
      _reduceValues(g, n, E = {}, l) {
        let f = e.nil;
        for (const h in g) {
          const I = g[h];
          if (!I)
            continue;
          const w = E[h] = E[h] || /* @__PURE__ */ new Map();
          I.forEach((C) => {
            if (w.has(C))
              return;
            w.set(C, o.Started);
            let t = n(C);
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
      optimizeNames(u, K) {
        return this;
      }
    }
    class B extends i {
      constructor(u, K, y) {
        super(), this.varKind = u, this.name = K, this.rhs = y;
      }
      render({ es5: u, _n: K }) {
        const y = u ? r.varKinds.var : this.varKind, F = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${y} ${this.name}${F};` + K;
      }
      optimizeNames(u, K) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = Y(this.rhs, u, K)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends i {
      constructor(u, K, y) {
        super(), this.lhs = u, this.rhs = K, this.sideEffects = y;
      }
      render({ _n: u }) {
        return `${this.lhs} = ${this.rhs};` + u;
      }
      optimizeNames(u, K) {
        if (!(this.lhs instanceof e.Name && !u[this.lhs.str] && !this.sideEffects))
          return this.rhs = Y(this.rhs, u, K), this;
      }
      get names() {
        const u = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return U(u, this.rhs);
      }
    }
    class a extends s {
      constructor(u, K, y, F) {
        super(u, y, F), this.op = K;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class g extends i {
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
      optimizeNames(u, K) {
        return this.code = Y(this.code, u, K), this;
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
        return this.nodes.reduce((K, y) => K + y.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let K = u.length;
        for (; K--; ) {
          const y = u[K].optimizeNodes();
          Array.isArray(y) ? u.splice(K, 1, ...y) : y ? u[K] = y : u.splice(K, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, K) {
        const { nodes: y } = this;
        let F = y.length;
        for (; F--; ) {
          const R = y[F];
          R.optimizeNames(u, K) || (x(u, R.names), y.splice(F, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, K) => S(u, K.names), {});
      }
    }
    class h extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class I extends f {
    }
    class w extends h {
    }
    w.kind = "else";
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
          const y = K.optimizeNodes();
          K = this.else = Array.isArray(y) ? new w(y) : y;
        }
        if (K)
          return u === !1 ? K instanceof C ? K : K.nodes : this.nodes.length ? this : new C(rA(u), K instanceof C ? [K] : K.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, K) {
        var y;
        if (this.else = (y = this.else) === null || y === void 0 ? void 0 : y.optimizeNames(u, K), !!(super.optimizeNames(u, K) || this.else))
          return this.condition = Y(this.condition, u, K), this;
      }
      get names() {
        const u = super.names;
        return U(u, this.condition), this.else && S(u, this.else.names), u;
      }
    }
    C.kind = "if";
    class t extends h {
    }
    t.kind = "for";
    class D extends t {
      constructor(u) {
        super(), this.iteration = u;
      }
      render(u) {
        return `for(${this.iteration})` + super.render(u);
      }
      optimizeNames(u, K) {
        if (super.optimizeNames(u, K))
          return this.iteration = Y(this.iteration, u, K), this;
      }
      get names() {
        return S(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, K, y, F) {
        super(), this.varKind = u, this.name = K, this.from = y, this.to = F;
      }
      render(u) {
        const K = u.es5 ? r.varKinds.var : this.varKind, { name: y, from: F, to: R } = this;
        return `for(${K} ${y}=${F}; ${y}<${R}; ${y}++)` + super.render(u);
      }
      get names() {
        const u = U(super.names, this.from);
        return U(u, this.to);
      }
    }
    class d extends t {
      constructor(u, K, y, F) {
        super(), this.loop = u, this.varKind = K, this.name = y, this.iterable = F;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, K) {
        if (super.optimizeNames(u, K))
          return this.iterable = Y(this.iterable, u, K), this;
      }
      get names() {
        return S(super.names, this.iterable.names);
      }
    }
    class M extends h {
      constructor(u, K, y) {
        super(), this.name = u, this.args = K, this.async = y;
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
        var y, F;
        return super.optimizeNames(u, K), (y = this.catch) === null || y === void 0 || y.optimizeNames(u, K), (F = this.finally) === null || F === void 0 || F.optimizeNames(u, K), this;
      }
      get names() {
        const u = super.names;
        return this.catch && S(u, this.catch.names), this.finally && S(u, this.finally.names), u;
      }
    }
    class H extends h {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    H.kind = "catch";
    class q extends h {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    q.kind = "finally";
    class b {
      constructor(u, K = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...K, _n: K.lines ? `
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
      scopeValue(u, K) {
        const y = this._extScope.value(u, K);
        return (this._values[y.prefix] || (this._values[y.prefix] = /* @__PURE__ */ new Set())).add(y), y;
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
      _def(u, K, y, F) {
        const R = this._scope.toName(K);
        return y !== void 0 && F && (this._constants[R.str] = y), this._leafNode(new B(u, R, y)), R;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, K, y) {
        return this._def(r.varKinds.const, u, K, y);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, K, y) {
        return this._def(r.varKinds.let, u, K, y);
      }
      // `var` declaration with optional assignment
      var(u, K, y) {
        return this._def(r.varKinds.var, u, K, y);
      }
      // assignment code
      assign(u, K, y) {
        return this._leafNode(new s(u, K, y));
      }
      // `+=` code
      add(u, K) {
        return this._leafNode(new a(u, A.operators.ADD, K));
      }
      // appends passed SafeExpr to code or executes Block
      code(u) {
        return typeof u == "function" ? u() : u !== e.nil && this._leafNode(new l(u)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...u) {
        const K = ["{"];
        for (const [y, F] of u)
          K.length > 1 && K.push(","), K.push(y), (y !== F || this.opts.es5) && (K.push(":"), (0, e.addCodeArg)(K, F));
        return K.push("}"), new e._Code(K);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, K, y) {
        if (this._blockNode(new C(u)), K && y)
          this.code(K).else().code(y).endIf();
        else if (K)
          this.code(K).endIf();
        else if (y)
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
      _for(u, K) {
        return this._blockNode(u), K && this.code(K).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, K) {
        return this._for(new D(u), K);
      }
      // `for` statement for a range of values
      forRange(u, K, y, F, R = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(R, J, K, y), () => F(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, K, y, F = r.varKinds.const) {
        const R = this._scope.toName(u);
        if (this.opts.es5) {
          const J = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(R, (0, e._)`${J}[${Z}]`), y(R);
          });
        }
        return this._for(new d("of", F, R, K), () => y(R));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, K, y, F = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${K})`, y);
        const R = this._scope.toName(u);
        return this._for(new d("in", F, R, K), () => y(R));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(t);
      }
      // `label` statement
      label(u) {
        return this._leafNode(new g(u));
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
      try(u, K, y) {
        if (!K && !y)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const F = new p();
        if (this._blockNode(F), this.code(u), K) {
          const R = this.name("e");
          this._currNode = F.catch = new H(R), K(R);
        }
        return y && (this._currNode = F.finally = new q(), this.code(y)), this._endBlockNode(H, q);
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
        const y = this._nodes.length - K;
        if (y < 0 || u !== void 0 && y !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${y} vs ${u} expected`);
        return this._nodes.length = K, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, K = e.nil, y, F) {
        return this._blockNode(new M(u, K, y)), F && this.code(F).endFunc(), this;
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
        const y = this._currNode;
        if (y instanceof u || K && y instanceof K)
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
    A.CodeGen = b;
    function S(N, u) {
      for (const K in u)
        N[K] = (N[K] || 0) + (u[K] || 0);
      return N;
    }
    function U(N, u) {
      return u instanceof e._CodeOrName ? S(N, u.names) : N;
    }
    function Y(N, u, K) {
      if (N instanceof e.Name)
        return y(N);
      if (!F(N))
        return N;
      return new e._Code(N._items.reduce((R, J) => (J instanceof e.Name && (J = y(J)), J instanceof e._Code ? R.push(...J._items) : R.push(J), R), []));
      function y(R) {
        const J = K[R.str];
        return J === void 0 || u[R.str] !== 1 ? R : (delete u[R.str], J);
      }
      function F(R) {
        return R instanceof e._Code && R._items.some((J) => J instanceof e.Name && u[J.str] === 1 && K[J.str] !== void 0);
      }
    }
    function x(N, u) {
      for (const K in u)
        N[K] = (N[K] || 0) - (u[K] || 0);
    }
    function rA(N) {
      return typeof N == "boolean" || typeof N == "number" || N === null ? !N : (0, e._)`!${_(N)}`;
    }
    A.not = rA;
    const oA = P(A.operators.AND);
    function T(...N) {
      return N.reduce(oA);
    }
    A.and = T;
    const iA = P(A.operators.OR);
    function v(...N) {
      return N.reduce(iA);
    }
    A.or = v;
    function P(N) {
      return (u, K) => u === e.nil ? K : K === e.nil ? u : (0, e._)`${_(u)} ${N} ${_(K)}`;
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
    const H = p.RULES.keywords;
    for (const q in M)
      H[q] || c(d, `unknown keyword: "${q}"`);
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
  function s({ topSchemaRef: d, schemaPath: M }, m, p, H) {
    if (!H) {
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
  function g(d) {
    return encodeURIComponent(n(d));
  }
  util.escapeFragment = g;
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
    return (H, q, b, S) => {
      const U = b === void 0 ? q : b instanceof A.Name ? (q instanceof A.Name ? d(H, q, b) : M(H, q, b), b) : q instanceof A.Name ? (M(H, b, q), q) : m(q, b);
      return S === A.Name && !(U instanceof A.Name) ? p(H, U) : U;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, m) => d.if((0, A._)`${m} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(m, !0), () => d.assign(m, (0, A._)`${m} || {}`).code((0, A._)`Object.assign(${m}, ${M})`));
      }),
      mergeToName: (d, M, m) => d.if((0, A._)`${m} !== true`, () => {
        M === !0 ? d.assign(m, !0) : (d.assign(m, (0, A._)`${m} || {}`), I(d, m, M));
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
    return M !== void 0 && I(d, m, M), m;
  }
  util.evaluatedPropsToName = h;
  function I(d, M, m) {
    Object.keys(m).forEach((p) => d.assign((0, A._)`${M}${(0, A.getProperty)(p)}`, !0));
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
  function D(d, M, m) {
    if (d instanceof A.Name) {
      const p = M === t.Num;
      return m ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return m ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = D;
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
      message: ({ keyword: w }) => (0, e.str)`must pass "${w}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: w, schemaType: C }) => C ? (0, e.str)`"${w}" keyword must be ${C} ($data)` : (0, e.str)`"${w}" keyword is invalid ($data)`
    };
    function Q(w, C = A.keywordError, t, D) {
      const { it: c } = w, { gen: d, compositeRule: M, allErrors: m } = c, p = E(w, C, t);
      D ?? (M || m) ? a(d, p) : g(c, (0, e._)`[${p}]`);
    }
    A.reportError = Q;
    function i(w, C = A.keywordError, t) {
      const { it: D } = w, { gen: c, compositeRule: d, allErrors: M } = D, m = E(w, C, t);
      a(c, m), d || M || g(D, o.default.vErrors);
    }
    A.reportExtraError = i;
    function B(w, C) {
      w.assign(o.default.errors, C), w.if((0, e._)`${o.default.vErrors} !== null`, () => w.if(C, () => w.assign((0, e._)`${o.default.vErrors}.length`, C), () => w.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: w, keyword: C, schemaValue: t, data: D, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = w.name("err");
      w.forRange("i", c, o.default.errors, (m) => {
        w.const(M, (0, e._)`${o.default.vErrors}[${m}]`), w.if((0, e._)`${M}.instancePath === undefined`, () => w.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), w.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${C}`), d.opts.verbose && (w.assign((0, e._)`${M}.schema`, t), w.assign((0, e._)`${M}.data`, D));
      });
    }
    A.extendErrors = s;
    function a(w, C) {
      const t = w.const("err", C);
      w.if((0, e._)`${o.default.vErrors} === null`, () => w.assign(o.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${o.default.vErrors}.push(${t})`), w.code((0, e._)`${o.default.errors}++`);
    }
    function g(w, C) {
      const { gen: t, validateName: D, schemaEnv: c } = w;
      c.$async ? t.throw((0, e._)`new ${w.ValidationError}(${C})`) : (t.assign((0, e._)`${D}.errors`, C), t.return(!1));
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
    function E(w, C, t) {
      const { createErrors: D } = w.it;
      return D === !1 ? (0, e._)`{}` : l(w, C, t);
    }
    function l(w, C, t = {}) {
      const { gen: D, it: c } = w, d = [
        f(c, t),
        h(w, t)
      ];
      return I(w, C, d), D.object(...d);
    }
    function f({ errorPath: w }, { instancePath: C }) {
      const t = C ? (0, e.str)`${w}${(0, r.getErrorPath)(C, r.Type.Str)}` : w;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function h({ keyword: w, it: { errSchemaPath: C } }, { schemaPath: t, parentSchema: D }) {
      let c = D ? C : (0, e.str)`${C}/${w}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function I(w, { params: C, message: t }, D) {
      const { keyword: c, data: d, schemaValue: M, it: m } = w, { opts: p, propertyName: H, topSchemaRef: q, schemaPath: b } = m;
      D.push([n.keyword, c], [n.params, typeof C == "function" ? C(w) : C || (0, e._)`{}`]), p.messages && D.push([n.message, typeof t == "function" ? t(w) : t]), p.verbose && D.push([n.schema, M], [n.parentSchema, (0, e._)`${q}${b}`], [o.default.data, d]), H && D.push([n.propertyName, H]);
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
    const { gen: a, schema: g, validateName: n } = s;
    g === !1 ? B(s, !1) : typeof g == "object" && g.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = Q;
  function i(s, a) {
    const { gen: g, schema: n } = s;
    n === !1 ? (g.var(a, !1), B(s)) : g.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = i;
  function B(s, a) {
    const { gen: g, data: n } = s, E = {
      gen: g,
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
    const { gen: c, data: d, opts: M } = t, m = n(D, M.coerceTypes), p = D.length > 0 && !(m.length === 0 && D.length === 1 && (0, e.schemaHasRulesForType)(t, D[0]));
    if (p) {
      const H = h(D, d, M.strictNumbers, i.Wrong);
      c.if(H, () => {
        m.length ? E(t, D, m) : w(t);
      });
    }
    return p;
  }
  dataType.coerceAndCheckDataType = a;
  const g = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, D) {
    return D ? t.filter((c) => g.has(c) || D === "array" && c === "array") : [];
  }
  function E(t, D, c) {
    const { gen: d, data: M, opts: m } = t, p = d.let("dataType", (0, o._)`typeof ${M}`), H = d.let("coerced", (0, o._)`undefined`);
    m.coerceTypes === "array" && d.if((0, o._)`${p} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(p, (0, o._)`typeof ${M}`).if(h(D, M, m.strictNumbers), () => d.assign(H, M))), d.if((0, o._)`${H} !== undefined`);
    for (const b of c)
      (g.has(b) || b === "array" && m.coerceTypes === "array") && q(b);
    d.else(), w(t), d.endIf(), d.if((0, o._)`${H} !== undefined`, () => {
      d.assign(M, H), l(t, H);
    });
    function q(b) {
      switch (b) {
        case "string":
          d.elseIf((0, o._)`${p} == "number" || ${p} == "boolean"`).assign(H, (0, o._)`"" + ${M}`).elseIf((0, o._)`${M} === null`).assign(H, (0, o._)`""`);
          return;
        case "number":
          d.elseIf((0, o._)`${p} == "boolean" || ${M} === null
              || (${p} == "string" && ${M} && ${M} == +${M})`).assign(H, (0, o._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, o._)`${p} === "boolean" || ${M} === null
              || (${p} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(H, (0, o._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, o._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(H, !1).elseIf((0, o._)`${M} === "true" || ${M} === 1`).assign(H, !0);
          return;
        case "null":
          d.elseIf((0, o._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(H, null);
          return;
        case "array":
          d.elseIf((0, o._)`${p} === "string" || ${p} === "number"
              || ${p} === "boolean" || ${M} === null`).assign(H, (0, o._)`[${M}]`);
      }
    }
  }
  function l({ gen: t, parentData: D, parentDataProperty: c }, d) {
    t.if((0, o._)`${D} !== undefined`, () => t.assign((0, o._)`${D}[${c}]`, d));
  }
  function f(t, D, c, d = i.Correct) {
    const M = d === i.Correct ? o.operators.EQ : o.operators.NEQ;
    let m;
    switch (t) {
      case "null":
        return (0, o._)`${D} ${M} null`;
      case "array":
        m = (0, o._)`Array.isArray(${D})`;
        break;
      case "object":
        m = (0, o._)`${D} && typeof ${D} == "object" && !Array.isArray(${D})`;
        break;
      case "integer":
        m = p((0, o._)`!(${D} % 1) && !isNaN(${D})`);
        break;
      case "number":
        m = p();
        break;
      default:
        return (0, o._)`typeof ${D} ${M} ${t}`;
    }
    return d === i.Correct ? m : (0, o.not)(m);
    function p(H = o.nil) {
      return (0, o.and)((0, o._)`typeof ${D} == "number"`, H, c ? (0, o._)`isFinite(${D})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function h(t, D, c, d) {
    if (t.length === 1)
      return f(t[0], D, c, d);
    let M;
    const m = (0, Q.toHash)(t);
    if (m.array && m.object) {
      const p = (0, o._)`typeof ${D} != "object"`;
      M = m.null ? p : (0, o._)`!${D} || ${p}`, delete m.null, delete m.array, delete m.object;
    } else
      M = o.nil;
    m.number && delete m.integer;
    for (const p in m)
      M = (0, o.and)(M, f(p, D, c, d));
    return M;
  }
  dataType.checkDataTypes = h;
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
    const { gen: D, data: c, schema: d } = t, M = (0, Q.schemaRefOrVal)(t, d, "type");
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
  function r(Q, i) {
    const { properties: B, items: s } = Q.schema;
    if (i === "object" && B)
      for (const a in B)
        o(Q, a, B[a].default);
    else i === "array" && Array.isArray(s) && s.forEach((a, g) => o(Q, g, a.default));
  }
  defaults.assignDefaults = r;
  function o(Q, i, B) {
    const { gen: s, compositeRule: a, data: g, opts: n } = Q;
    if (B === void 0)
      return;
    const E = (0, A._)`${g}${(0, A.getProperty)(i)}`;
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
  function Q(t, D) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, D, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${D}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = Q;
  function i({ gen: t, data: D, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((m) => (0, A.and)(n(t, D, m, c.ownProperties), (0, A._)`${M} = ${m}`)));
  }
  code.checkMissingProp = i;
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
  function g(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, D, c)}` : M;
  }
  code.propertyInData = g;
  function n(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(M, (0, A.not)(a(t, D, c))) : M;
  }
  code.noPropertyInData = n;
  function E(t) {
    return t ? Object.keys(t).filter((D) => D !== "__proto__") : [];
  }
  code.allSchemaProperties = E;
  function l(t, D) {
    return E(D).filter((c) => !(0, e.alwaysValidSchema)(t, D[c]));
  }
  code.schemaProperties = l;
  function f({ schemaCode: t, data: D, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: m }, it: p }, H, q, b) {
    const S = b ? (0, A._)`${t}, ${D}, ${d}${M}` : D, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, m)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...U)}`;
    return q !== A.nil ? (0, A._)`${H}.call(${q}, ${Y})` : (0, A._)`${H}(${Y})`;
  }
  code.callValidateCode = f;
  const h = (0, A._)`new RegExp`;
  function I({ gen: t, it: { opts: D } }, c) {
    const d = D.unicodeRegExp ? "u" : "", { regExp: M } = D.code, m = M(c, d);
    return t.scopeValue("pattern", {
      key: m.toString(),
      ref: m,
      code: (0, A._)`${M.code === "new RegExp" ? h : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = I;
  function w(t) {
    const { gen: D, data: c, keyword: d, it: M } = t, m = D.name("valid");
    if (M.allErrors) {
      const H = D.let("valid", !0);
      return p(() => D.assign(H, !1)), H;
    }
    return D.var(m, !0), p(() => D.break()), m;
    function p(H) {
      const q = D.const("len", (0, A._)`${c}.length`);
      D.forRange("i", 0, q, (b) => {
        t.subschema({
          keyword: d,
          dataProp: b,
          dataPropType: e.Type.Num
        }, m), D.if((0, A.not)(m), H);
      });
    }
  }
  code.validateArray = w;
  function C(t) {
    const { gen: D, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((q) => (0, e.alwaysValidSchema)(M, q)) && !M.opts.unevaluated)
      return;
    const p = D.let("valid", !1), H = D.name("_valid");
    D.block(() => c.forEach((q, b) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: b,
        compositeRule: !0
      }, H);
      D.assign(p, (0, A._)`${p} || ${H}`), t.mergeValidEvaluated(S, H) || D.if((0, A.not)(p));
    })), t.result(p, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = C, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function Q(l, f) {
    const { gen: h, keyword: I, schema: w, parentSchema: C, it: t } = l, D = f.macro.call(t.self, w, C, t), c = g(h, I, D);
    t.opts.validateSchema !== !1 && t.self.validateSchema(D, !0);
    const d = h.name("valid");
    l.subschema({
      schema: D,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${I}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = Q;
  function i(l, f) {
    var h;
    const { gen: I, keyword: w, schema: C, parentSchema: t, $data: D, it: c } = l;
    a(c, f);
    const d = !D && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = g(I, w, d), m = I.let("valid");
    l.block$data(m, p), l.ok((h = f.valid) !== null && h !== void 0 ? h : m);
    function p() {
      if (f.errors === !1)
        b(), f.modifying && B(l), S(() => l.error());
      else {
        const U = f.async ? H() : q();
        f.modifying && B(l), S(() => s(l, U));
      }
    }
    function H() {
      const U = I.let("ruleErrs", null);
      return I.try(() => b((0, A._)`await `), (Y) => I.assign(m, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => I.assign(U, (0, A._)`${Y}.errors`), () => I.throw(Y))), U;
    }
    function q() {
      const U = (0, A._)`${M}.errors`;
      return I.assign(U, null), b(A.nil), U;
    }
    function b(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, x = !("compile" in f && !D || f.schema === !1);
      I.assign(m, (0, A._)`${U}${(0, r.callValidateCode)(l, M, Y, x)}`, f.modifying);
    }
    function S(U) {
      var Y;
      I.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : m), U);
    }
  }
  keyword.funcKeywordCode = i;
  function B(l) {
    const { gen: f, data: h, it: I } = l;
    f.if(I.parentData, () => f.assign(h, (0, A._)`${I.parentData}[${I.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: h } = l;
    h.if((0, A._)`Array.isArray(${f})`, () => {
      h.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, o.extendErrors)(l);
    }, () => l.error());
  }
  function a({ schemaEnv: l }, f) {
    if (f.async && !l.$async)
      throw new Error("async keyword in sync schema");
  }
  function g(l, f, h) {
    if (h === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof h == "function" ? { ref: h } : { ref: h, code: (0, A.stringify)(h) });
  }
  function n(l, f, h = !1) {
    return !f.length || f.some((I) => I === "array" ? Array.isArray(l) : I === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == I || h && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: h, errSchemaPath: I }, w, C) {
    if (Array.isArray(w.keyword) ? !w.keyword.includes(C) : w.keyword !== C)
      throw new Error("ajv implementation error");
    const t = w.dependencies;
    if (t?.some((D) => !Object.prototype.hasOwnProperty.call(l, D)))
      throw new Error(`parent schema must have dependencies of ${C}: ${t.join(",")}`);
    if (w.validateSchema && !w.validateSchema(l[C])) {
      const c = `keyword "${C}" value is invalid at path "${I}": ` + h.errorsText(w.validateSchema.errors);
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
  function r(i, { keyword: B, schemaProp: s, schema: a, schemaPath: g, errSchemaPath: n, topSchemaRef: E }) {
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
      if (g === void 0 || n === void 0 || E === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: a,
        schemaPath: g,
        topSchemaRef: E,
        errSchemaPath: n
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function o(i, B, { dataProp: s, dataPropType: a, data: g, dataTypes: n, propertyName: E }) {
    if (g !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: h, dataPathArr: I, opts: w } = B, C = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(C), i.errorPath = (0, A.str)`${h}${(0, e.getErrorPath)(s, a, w.jsPropertySyntax)}`, i.parentDataProperty = (0, A._)`${s}`, i.dataPathArr = [...I, i.parentDataProperty];
    }
    if (g !== void 0) {
      const h = g instanceof A.Name ? g : l.let("data", g, !0);
      f(h), E !== void 0 && (i.propertyName = E);
    }
    n && (i.dataTypes = n);
    function f(h) {
      i.data = h, i.dataLevel = B.dataLevel + 1, i.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), i.parentData = B.data, i.dataNames = [...B.dataNames, h];
    }
  }
  subschema.extendSubschemaData = o;
  function Q(i, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: g, allErrors: n }) {
    a !== void 0 && (i.compositeRule = a), g !== void 0 && (i.createErrors = g), n !== void 0 && (i.allErrors = n), i.jtdDiscriminator = B, i.jtdMetadata = s;
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
  function e(o, Q, i, B, s, a, g, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      Q(B, s, a, g, n, E, l);
      for (var f in B) {
        var h = B[f];
        if (Array.isArray(h)) {
          if (f in A.arrayKeywords)
            for (var I = 0; I < h.length; I++)
              e(o, Q, i, h[I], s + "/" + f + "/" + I, a, s, f, B, I);
        } else if (f in A.propsKeywords) {
          if (h && typeof h == "object")
            for (var w in h)
              e(o, Q, i, h[w], s + "/" + f + "/" + r(w), a, s, f, B, w);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, Q, i, h, s + "/" + f, a, s, f, B);
      }
      i(B, s, a, g, n, E, l);
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
  function Q(I, w = !0) {
    return typeof I == "boolean" ? !0 : w === !0 ? !B(I) : w ? s(I) <= w : !1;
  }
  resolve.inlineRef = Q;
  const i = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(I) {
    for (const w in I) {
      if (i.has(w))
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
    return g(I, t);
  }
  resolve.getFullPath = a;
  function g(I, w) {
    return I.serialize(w).split("#")[0] + "#";
  }
  resolve._getFullPath = g;
  const n = /#\/?$/;
  function E(I) {
    return I ? I.replace(n, "") : "";
  }
  resolve.normalizeId = E;
  function l(I, w, C) {
    return C = E(C), I.resolve(w, C);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function h(I, w) {
    if (typeof I == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, D = E(I[C] || w), c = { "": D }, d = a(t, D, !1), M = {}, m = /* @__PURE__ */ new Set();
    return r(I, { allKeys: !0 }, (q, b, S, U) => {
      if (U === void 0)
        return;
      const Y = d + b;
      let x = c[U];
      typeof q[C] == "string" && (x = rA.call(this, q[C])), oA.call(this, q.$anchor), oA.call(this, q.$dynamicAnchor), c[b] = x;
      function rA(T) {
        const iA = this.opts.uriResolver.resolve;
        if (T = E(x ? iA(x, T) : T), m.has(T))
          throw H(T);
        m.add(T);
        let v = this.refs[T];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? p(q, v.schema, T) : T !== E(Y) && (T[0] === "#" ? (p(q, M[T], T), M[T] = q) : this.refs[T] = Y), T;
      }
      function oA(T) {
        if (typeof T == "string") {
          if (!f.test(T))
            throw new Error(`invalid anchor "${T}"`);
          rA.call(this, `#${T}`);
        }
      }
    }), M;
    function p(q, b, S) {
      if (b !== void 0 && !e(q, b))
        throw H(S);
    }
    function H(q) {
      return new Error(`reference "${q}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = h, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), Q = requireDefaults(), i = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), g = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (m(k), c(k))) {
      w(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: G, schema: O, schemaEnv: j, opts: z }, L) {
    z.code.es5 ? k.func(G, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(O, z)}`), I(k, z), k.code(L);
    }) : k.func(G, (0, s._)`${a.default.data}, ${h(z)}`, j.$async, () => k.code(t(O, z)).code(L));
  }
  function h(k) {
    return (0, s._)`{${a.default.instancePath}="", ${a.default.parentData}, ${a.default.parentDataProperty}, ${a.default.rootData}=${a.default.data}${k.dynamicRef ? (0, s._)`, ${a.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function I(k, G) {
    k.if(a.default.valCxt, () => {
      k.var(a.default.instancePath, (0, s._)`${a.default.valCxt}.${a.default.instancePath}`), k.var(a.default.parentData, (0, s._)`${a.default.valCxt}.${a.default.parentData}`), k.var(a.default.parentDataProperty, (0, s._)`${a.default.valCxt}.${a.default.parentDataProperty}`), k.var(a.default.rootData, (0, s._)`${a.default.valCxt}.${a.default.rootData}`), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`${a.default.valCxt}.${a.default.dynamicAnchors}`);
    }, () => {
      k.var(a.default.instancePath, (0, s._)`""`), k.var(a.default.parentData, (0, s._)`undefined`), k.var(a.default.parentDataProperty, (0, s._)`undefined`), k.var(a.default.rootData, a.default.data), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function w(k) {
    const { schema: G, opts: O, gen: j } = k;
    f(k, () => {
      O.$comment && G.$comment && U(k), q(k), j.let(a.default.vErrors, null), j.let(a.default.errors, 0), O.unevaluated && C(k), p(k), Y(k);
    });
  }
  function C(k) {
    const { gen: G, validateName: O } = k;
    k.evaluated = G.const("evaluated", (0, s._)`${O}.evaluated`), G.if((0, s._)`${k.evaluated}.dynamicProps`, () => G.assign((0, s._)`${k.evaluated}.props`, (0, s._)`undefined`)), G.if((0, s._)`${k.evaluated}.dynamicItems`, () => G.assign((0, s._)`${k.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(k, G) {
    const O = typeof k == "object" && k[G.schemaId];
    return O && (G.code.source || G.code.process) ? (0, s._)`/*# sourceURL=${O} */` : s.nil;
  }
  function D(k, G) {
    if (d(k) && (m(k), c(k))) {
      M(k, G);
      return;
    }
    (0, A.boolOrEmptySchema)(k, G);
  }
  function c({ schema: k, self: G }) {
    if (typeof k == "boolean")
      return !k;
    for (const O in k)
      if (G.RULES.all[O])
        return !0;
    return !1;
  }
  function d(k) {
    return typeof k.schema != "boolean";
  }
  function M(k, G) {
    const { schema: O, gen: j, opts: z } = k;
    z.$comment && O.$comment && U(k), b(k), S(k);
    const L = j.const("_errs", a.default.errors);
    p(k, L), j.var(G, (0, s._)`${L} === ${a.default.errors}`);
  }
  function m(k) {
    (0, n.checkUnknownRules)(k), H(k);
  }
  function p(k, G) {
    if (k.opts.jtd)
      return rA(k, [], !1, G);
    const O = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, O);
    rA(k, O, !j, G);
  }
  function H(k) {
    const { schema: G, errSchemaPath: O, opts: j, self: z } = k;
    G.$ref && j.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(G, z.RULES) && z.logger.warn(`$ref: keywords ignored in schema at path "${O}"`);
  }
  function q(k) {
    const { schema: G, opts: O } = k;
    G.default !== void 0 && O.useDefaults && O.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function b(k) {
    const G = k.schema[k.opts.schemaId];
    G && (k.baseId = (0, g.resolveUrl)(k.opts.uriResolver, k.baseId, G));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: G, schema: O, errSchemaPath: j, opts: z }) {
    const L = O.$comment;
    if (z.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${L})`);
    else if (typeof z.$comment == "function") {
      const V = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: G.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${L}, ${V}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: G, schemaEnv: O, validateName: j, ValidationError: z, opts: L } = k;
    O.$async ? G.if((0, s._)`${a.default.errors} === 0`, () => G.return(a.default.data), () => G.throw((0, s._)`new ${z}(${a.default.vErrors})`)) : (G.assign((0, s._)`${j}.errors`, a.default.vErrors), L.unevaluated && x(k), G.return((0, s._)`${a.default.errors} === 0`));
  }
  function x({ gen: k, evaluated: G, props: O, items: j }) {
    O instanceof s.Name && k.assign((0, s._)`${G}.props`, O), j instanceof s.Name && k.assign((0, s._)`${G}.items`, j);
  }
  function rA(k, G, O, j) {
    const { gen: z, schema: L, data: V, allErrors: eA, opts: X, self: $ } = k, { RULES: W } = $;
    if (L.$ref && (X.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(L, W))) {
      z.block(() => F(k, "$ref", W.all.$ref.definition));
      return;
    }
    X.jtd || T(k, G), z.block(() => {
      for (const AA of W.rules)
        QA(AA);
      QA(W.post);
    });
    function QA(AA) {
      (0, r.shouldUseGroup)(L, AA) && (AA.type ? (z.if((0, o.checkDataType)(AA.type, V, X.strictNumbers)), oA(k, AA), G.length === 1 && G[0] === AA.type && O && (z.else(), (0, o.reportTypeError)(k)), z.endIf()) : oA(k, AA), eA || z.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function oA(k, G) {
    const { gen: O, schema: j, opts: { useDefaults: z } } = k;
    z && (0, Q.assignDefaults)(k, G.type), O.block(() => {
      for (const L of G.rules)
        (0, r.shouldUseRule)(j, L) && F(k, L.keyword, L.definition, G.type);
    });
  }
  function T(k, G) {
    k.schemaEnv.meta || !k.opts.strictTypes || (iA(k, G), k.opts.allowUnionTypes || v(k, G), P(k, k.dataTypes));
  }
  function iA(k, G) {
    if (G.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = G;
        return;
      }
      G.forEach((O) => {
        N(k.dataTypes, O) || K(k, `type "${O}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, G);
    }
  }
  function v(k, G) {
    G.length > 1 && !(G.length === 2 && G.includes("null")) && K(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, G) {
    const O = k.self.RULES.all;
    for (const j in O) {
      const z = O[j];
      if (typeof z == "object" && (0, r.shouldUseRule)(k.schema, z)) {
        const { type: L } = z.definition;
        L.length && !L.some((V) => _(G, V)) && K(k, `missing type "${L.join(",")}" for keyword "${j}"`);
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
    const O = [];
    for (const j of k.dataTypes)
      N(G, j) ? O.push(j) : G.includes("integer") && j === "number" && O.push("integer");
    k.dataTypes = O;
  }
  function K(k, G) {
    const O = k.schemaEnv.baseId + k.errSchemaPath;
    G += ` at "${O}" (strictTypes)`, (0, n.checkStrictMode)(k, G, k.opts.strictTypes);
  }
  class y {
    constructor(G, O, j) {
      if ((0, i.validateKeywordUsage)(G, O, j), this.gen = G.gen, this.allErrors = G.allErrors, this.keyword = j, this.data = G.data, this.schema = G.schema[j], this.$data = O.$data && G.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(G, this.schema, j, this.$data), this.schemaType = O.schemaType, this.parentSchema = G.schema, this.params = {}, this.it = G, this.def = O, this.$data)
        this.schemaCode = G.gen.const("vSchema", Z(this.$data, G));
      else if (this.schemaCode = this.schemaValue, !(0, i.validSchemaType)(this.schema, O.schemaType, O.allowUndefined))
        throw new Error(`${j} value must be ${JSON.stringify(O.schemaType)}`);
      ("code" in O ? O.trackErrors : O.errors !== !1) && (this.errsCount = G.gen.const("_errs", a.default.errors));
    }
    result(G, O, j) {
      this.failResult((0, s.not)(G), O, j);
    }
    failResult(G, O, j) {
      this.gen.if(G), j ? j() : this.error(), O ? (this.gen.else(), O(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(G, O) {
      this.failResult((0, s.not)(G), void 0, O);
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
      const { schemaCode: O } = this;
      this.fail((0, s._)`${O} !== undefined && (${(0, s.or)(this.invalid$data(), G)})`);
    }
    error(G, O, j) {
      if (O) {
        this.setParams(O), this._error(G, j), this.setParams({});
        return;
      }
      this._error(G, j);
    }
    _error(G, O) {
      (G ? E.reportExtraError : E.reportError)(this, this.def.error, O);
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
    setParams(G, O) {
      O ? Object.assign(this.params, G) : this.params = G;
    }
    block$data(G, O, j = s.nil) {
      this.gen.block(() => {
        this.check$data(G, j), O();
      });
    }
    check$data(G = s.nil, O = s.nil) {
      if (!this.$data)
        return;
      const { gen: j, schemaCode: z, schemaType: L, def: V } = this;
      j.if((0, s.or)((0, s._)`${z} === undefined`, O)), G !== s.nil && j.assign(G, !0), (L.length || V.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), G !== s.nil && j.assign(G, !1)), j.else();
    }
    invalid$data() {
      const { gen: G, schemaCode: O, schemaType: j, def: z, it: L } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (j.length) {
          if (!(O instanceof s.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(j) ? j : [j];
          return (0, s._)`${(0, o.checkDataTypes)(X, O, L.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (z.validateSchema) {
          const X = G.scopeValue("validate$data", { ref: z.validateSchema });
          return (0, s._)`!${X}(${O})`;
        }
        return s.nil;
      }
    }
    subschema(G, O) {
      const j = (0, B.getSubschema)(this.it, G);
      (0, B.extendSubschemaData)(j, this.it, G), (0, B.extendSubschemaMode)(j, G);
      const z = { ...this.it, ...j, items: void 0, props: void 0 };
      return D(z, O), z;
    }
    mergeEvaluated(G, O) {
      const { it: j, gen: z } = this;
      j.opts.unevaluated && (j.props !== !0 && G.props !== void 0 && (j.props = n.mergeEvaluated.props(z, G.props, j.props, O)), j.items !== !0 && G.items !== void 0 && (j.items = n.mergeEvaluated.items(z, G.items, j.items, O)));
    }
    mergeValidEvaluated(G, O) {
      const { it: j, gen: z } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return z.if(O, () => this.mergeEvaluated(G, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function F(k, G, O, j) {
    const z = new y(k, O, G);
    "code" in O ? O.code(z, j) : z.$data && O.validate ? (0, i.funcKeywordCode)(z, O) : "macro" in O ? (0, i.macroKeywordCode)(z, O) : (O.compile || O.validate) && (0, i.funcKeywordCode)(z, O);
  }
  const R = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: G, dataNames: O, dataPathArr: j }) {
    let z, L;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!R.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      z = k, L = a.default.rootData;
    } else {
      const $ = J.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const W = +$[1];
      if (z = $[2], z === "#") {
        if (W >= G)
          throw new Error(X("property/index", W));
        return j[G - W];
      }
      if (W > G)
        throw new Error(X("data", W));
      if (L = O[G - W], !z)
        return L;
    }
    let V = L;
    const eA = z.split("/");
    for (const $ of eA)
      $ && (L = (0, s._)`${L}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${L}`);
    return V;
    function X($, W) {
      return `Cannot access ${$} ${W} levels up, current level is ${G}`;
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
    constructor(C) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let D;
      typeof C.schema == "object" && (D = C.schema), this.schema = C.schema, this.schemaId = C.schemaId, this.root = C.root || this, this.baseId = (t = C.baseId) !== null && t !== void 0 ? t : (0, o.normalizeId)(D?.[C.schemaId || "$id"]), this.schemaPath = C.schemaPath, this.localRefs = C.localRefs, this.meta = C.meta, this.$async = D?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(w) {
    const C = n.call(this, w);
    if (C)
      return C;
    const t = (0, o.getFullPath)(this.opts.uriResolver, w.root.baseId), { es5: D, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: D, lines: c, ownProperties: d });
    let m;
    w.$async && (m = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const p = M.scopeName("validate");
    w.validateName = p;
    const H = {
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
      validateName: p,
      ValidationError: m,
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
    let q;
    try {
      this._compilations.add(w), (0, i.validateFunctionCode)(H), M.optimize(this.opts.code.optimize);
      const b = M.toString();
      q = `${M.scopeRefs(r.default.scope)}return ${b}`, this.opts.code.process && (q = this.opts.code.process(q, w));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, q)(this, this.scope.get());
      if (this.scope.value(p, { ref: U }), U.errors = null, U.schema = w.schema, U.schemaEnv = w, w.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: p, validateCode: b, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: x } = H;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: x instanceof A.Name ? void 0 : x,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: x instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return w.validate = U, w;
    } catch (b) {
      throw delete w.validate, delete w.validateName, q && this.logger.error("Error compiling schema, function code:", q), b;
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
      const M = (D = w.localRefs) === null || D === void 0 ? void 0 : D[t], { schemaId: m } = this.opts;
      M && (d = new B({ schema: M, schemaId: m, root: w, baseId: C }));
    }
    if (d !== void 0)
      return w.refs[t] = g.call(this, d);
  }
  compile.resolveRef = a;
  function g(w) {
    return (0, o.inlineRef)(w.schema, this.opts.inlineRefs) ? w.schema : w.validate ? w : s.call(this, w);
  }
  function n(w) {
    for (const C of this._compilations)
      if (E(C, w))
        return C;
  }
  compile.getCompilingSchema = n;
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
      const m = f.call(this, w, M);
      return typeof m?.schema != "object" ? void 0 : I.call(this, t, m);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(C)) {
        const { schema: m } = M, { schemaId: p } = this.opts, H = m[p];
        return H && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, H)), new B({ schema: m, schemaId: p, root: w, baseId: c });
      }
      return I.call(this, t, M);
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
  function I(w, { baseId: C, schema: t, root: D }) {
    var c;
    if (((c = w.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const m of w.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const p = t[(0, Q.unescapeFragment)(m)];
      if (p === void 0)
        return;
      t = p;
      const H = typeof t == "object" && t[this.opts.schemaId];
      !h.has(m) && H && (C = (0, o.resolveUrl)(this.opts.uriResolver, C, H));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, Q.schemaHasRulesButRef)(t, this.RULES)) {
      const m = (0, o.resolveUrl)(this.opts.uriResolver, C, t.$ref);
      d = f.call(this, D, m);
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
  function Q(I) {
    let w = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], D = [];
    let c = !1, d = !1, M = !1;
    function m() {
      if (D.length) {
        if (c === !1) {
          const p = o(D);
          if (p !== void 0)
            t.push(p);
          else
            return C.error = !0, !1;
        }
        D.length = 0;
      }
      return !0;
    }
    for (let p = 0; p < I.length; p++) {
      const H = I[p];
      if (!(H === "[" || H === "]"))
        if (H === ":") {
          if (d === !0 && (M = !0), !m())
            break;
          if (w++, t.push(":"), w > 7) {
            C.error = !0;
            break;
          }
          p - 1 >= 0 && I[p - 1] === ":" && (d = !0);
          continue;
        } else if (H === "%") {
          if (!m())
            break;
          c = !0;
        } else {
          D.push(H);
          continue;
        }
    }
    return D.length && (c ? C.zone = D.join("") : M ? t.push(D.join("")) : t.push(o(D))), C.address = t.join(""), C;
  }
  function i(I) {
    if (s(I, ":") < 2)
      return { host: I, isIPV6: !1 };
    const w = Q(I);
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
  const a = /^\.\.?\//u, g = /^\/\.(?:\/|$)/u, n = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(I) {
    const w = [];
    for (; I.length; )
      if (I.match(a))
        I = I.replace(a, "");
      else if (I.match(g))
        I = I.replace(g, "/");
      else if (I.match(n))
        I = I.replace(n, "/"), w.pop();
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
  function h(I) {
    const w = [];
    if (I.userinfo !== void 0 && (w.push(I.userinfo), w.push("@")), I.host !== void 0) {
      let C = unescape(I.host);
      const t = r(C);
      if (t.isIPV4)
        C = t.host;
      else {
        const D = i(t.host);
        D.isIPV6 === !0 ? C = `[${D.escapedHost}]` : C = I.host;
      }
      w.push(C);
    }
    return (typeof I.port == "number" || typeof I.port == "string") && (w.push(":"), w.push(String(I.port))), w.length ? w.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: h,
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
    const D = String(t.scheme).toLowerCase() === "https";
    return (t.port === (D ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function i(t) {
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
      const M = `${d}:${D.nid || t.nid}`, m = C[M];
      t.path = void 0, m && (t = m.parse(t, D));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, D) {
    const c = D.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${D.nid || d}`, m = C[M];
    m && (t = m.serialize(t, D));
    const p = t, H = t.nss;
    return p.path = `${d || D.nid}:${H}`, D.skipEscape = !0, p;
  }
  function g(t, D) {
    const c = t;
    return c.uuid = c.nss, c.nss = void 0, !D.tolerant && (!c.uuid || !A.test(c.uuid)) && (c.error = c.error || "UUID is not valid."), c;
  }
  function n(t) {
    const D = t;
    return D.nss = (t.uuid || "").toLowerCase(), D;
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
      serialize: a,
      skipNormalize: !0
    },
    "urn:uuid": {
      scheme: "urn:uuid",
      parse: g,
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
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: o, normalizeComponentEncoding: Q } = requireUtils(), i = requireSchemes();
  function B(w, C) {
    return typeof w == "string" ? w = n(h(w, C), C) : typeof w == "object" && (w = h(n(w, C), C)), w;
  }
  function s(w, C, t) {
    const D = Object.assign({ scheme: "null" }, t), c = a(h(w, D), h(C, D), D, !0);
    return n(c, { ...D, skipEscape: !0 });
  }
  function a(w, C, t, D) {
    const c = {};
    return D || (w = h(n(w, t), t), C = h(n(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((w.userinfo !== void 0 || w.host !== void 0 || w.port !== void 0) && !w.path ? c.path = "/" + C.path : w.path ? c.path = w.path.slice(0, w.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = w.path, C.query !== void 0 ? c.query = C.query : c.query = w.query), c.userinfo = w.userinfo, c.host = w.host, c.port = w.port), c.scheme = w.scheme), c.fragment = C.fragment, c;
  }
  function g(w, C, t) {
    return typeof w == "string" ? (w = unescape(w), w = n(Q(h(w, t), !0), { ...t, skipEscape: !0 })) : typeof w == "object" && (w = n(Q(w, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = n(Q(h(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = n(Q(C, !0), { ...t, skipEscape: !0 })), w.toLowerCase() === C.toLowerCase();
  }
  function n(w, C) {
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
    }, D = Object.assign({}, C), c = [], d = i[(D.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, D), t.path !== void 0 && (D.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), D.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = o(t);
    if (M !== void 0 && (D.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let m = t.path;
      !D.absolutePath && (!d || !d.absolutePath) && (m = r(m)), M === void 0 && (m = m.replace(/^\/\//u, "/%2F")), c.push(m);
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
  function h(w, C) {
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
        const p = e(D.host);
        if (p.isIPV4 === !1) {
          const H = A(p.host);
          D.host = H.host.toLowerCase(), d = H.isIPV6;
        } else
          D.host = p.host, d = !0;
      }
      D.scheme === void 0 && D.userinfo === void 0 && D.host === void 0 && D.port === void 0 && !D.path && D.query === void 0 ? D.reference = "same-document" : D.scheme === void 0 ? D.reference = "relative" : D.fragment === void 0 ? D.reference = "absolute" : D.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== D.reference && (D.error = D.error || "URI is not a " + t.reference + " reference.");
      const m = i[(t.scheme || D.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!m || !m.unicodeSupport) && D.host && (t.domainHost || m && m.domainHost) && d === !1 && l(D.host))
        try {
          D.host = URL.domainToASCII(D.host.toLowerCase());
        } catch (p) {
          D.error = D.error || "Host's domain name can not be converted to ASCII: " + p;
        }
      (!m || m && !m.skipNormalize) && (c && D.scheme !== void 0 && (D.scheme = unescape(D.scheme)), c && D.host !== void 0 && (D.host = unescape(D.host)), D.path && D.path.length && (D.path = escape(unescape(D.path))), D.fragment && D.fragment.length && (D.fragment = encodeURI(decodeURIComponent(D.fragment)))), m && m.parse && m.parse(D, t);
    } else
      D.error = D.error || "URI can not be parsed.";
    return D;
  }
  const I = {
    SCHEMES: i,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: g,
    serialize: n,
    parse: h
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
    const o = requireValidation_error(), Q = requireRef_error(), i = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), g = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, P) => new RegExp(v, P);
    f.code = "new RegExp";
    const h = ["removeAdditional", "useDefaults", "coerceTypes"], I = /* @__PURE__ */ new Set([
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
    function D(v) {
      var P, _, N, u, K, y, F, R, J, Z, k, G, O, j, z, L, V, eA, X, $, W, QA, AA, tA, sA;
      const BA = v.strict, aA = (P = v.code) === null || P === void 0 ? void 0 : P.optimize, gA = aA === !0 || aA === void 0 ? 1 : aA || 0, wA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, DA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (y = (K = v.strictSchema) !== null && K !== void 0 ? K : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (R = (F = v.strictNumbers) !== null && F !== void 0 ? F : BA) !== null && R !== void 0 ? R : !0,
        strictTypes: (Z = (J = v.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (G = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && G !== void 0 ? G : "log",
        strictRequired: (j = (O = v.strictRequired) !== null && O !== void 0 ? O : BA) !== null && j !== void 0 ? j : !1,
        code: v.code ? { ...v.code, optimize: gA, regExp: wA } : { optimize: gA, regExp: wA },
        loopRequired: (z = v.loopRequired) !== null && z !== void 0 ? z : t,
        loopEnum: (L = v.loopEnum) !== null && L !== void 0 ? L : t,
        meta: (V = v.meta) !== null && V !== void 0 ? V : !0,
        messages: (eA = v.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (X = v.inlineRefs) !== null && X !== void 0 ? X : !0,
        schemaId: ($ = v.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (W = v.addUsedSchema) !== null && W !== void 0 ? W : !0,
        validateSchema: (QA = v.validateSchema) !== null && QA !== void 0 ? QA : !0,
        validateFormats: (AA = v.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = v.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = v.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: DA
      };
    }
    class c {
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...D(P) };
        const { es5: _, lines: N } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: I, es5: _, lines: N }), this.logger = S(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, i.getRules)(), d.call(this, w, P, "NOT SUPPORTED"), d.call(this, C, P, "DEPRECATED", "warn"), this._metaOpts = q.call(this), P.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && H.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), m.call(this), P.validateFormats = u;
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
          await K.call(this, Z.$schema);
          const G = this._addSchema(Z, k);
          return G.validate || y.call(this, G);
        }
        async function K(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function y(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof Q.default))
              throw k;
            return F.call(this, k), await R.call(this, k.missingSchema), y.call(this, Z);
          }
        }
        function F({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function R(Z) {
          const k = await J.call(this, Z);
          this.refs[Z] || await K.call(this, k.$schema), this.refs[Z] || this.addSchema(k, Z, _);
        }
        async function J(Z) {
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
        let K;
        if (typeof P == "object") {
          const { schemaId: y } = this.opts;
          if (K = P[y], K !== void 0 && typeof K != "string")
            throw new Error(`schema ${y} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || K), this._checkUnique(_), this.schemas[_] = this._addSchema(P, N, _, u, !0), this;
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
        if (Y.call(this, N, _), !_)
          return (0, n.eachItem)(N, (K) => x.call(this, K)), this;
        oA.call(this, _);
        const u = {
          ..._,
          type: (0, g.getJSONTypes)(_.type),
          schemaType: (0, g.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(N, u.type.length === 0 ? (K) => x.call(this, K, u) : (K) => u.type.forEach((y) => x.call(this, K, u, y))), this;
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
          const u = N.rules.findIndex((K) => K.keyword === P);
          u >= 0 && N.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[P] = _, this;
      }
      errorsText(P = this.errors, { separator: _ = ", ", dataVar: N = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${N}${u.instancePath} ${u.message}`).reduce((u, K) => u + _ + K);
      }
      $dataMetaSchema(P, _) {
        const N = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of _) {
          const K = u.split("/").slice(1);
          let y = P;
          for (const F of K)
            y = y[F];
          for (const F in N) {
            const R = N[F];
            if (typeof R != "object")
              continue;
            const { $data: J } = R.definition, Z = y[F];
            J && Z && (y[F] = iA(Z));
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
      _addSchema(P, _, N, u = this.opts.validateSchema, K = this.opts.addUsedSchema) {
        let y;
        const { schemaId: F } = this.opts;
        if (typeof P == "object")
          y = P[F];
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
        const J = a.getSchemaRefs.call(this, P, N);
        return R = new B.SchemaEnv({ schema: P, schemaId: F, meta: _, baseId: N, localRefs: J }), this._cache.set(R.schema, R), K && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = R), u && this.validateSchema(P, !0), R;
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
        const K = u;
        K in P && this.logger[N](`${_}: option ${u}. ${v[K]}`);
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
    function H(v) {
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
    function q() {
      const v = { ...this.opts };
      for (const P of h)
        delete v[P];
      return v;
    }
    const b = { log() {
    }, warn() {
    }, error() {
    } };
    function S(v) {
      if (v === !1)
        return b;
      if (v === void 0)
        return console;
      if (v.log && v.warn && v.error)
        return v;
      throw new Error("logger must implement log, warn and error methods");
    }
    const U = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Y(v, P) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (N) => {
        if (_.keywords[N])
          throw new Error(`Keyword ${N} is already defined`);
        if (!U.test(N))
          throw new Error(`Keyword ${N} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function x(v, P, _) {
      var N;
      const u = P?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: K } = this;
      let y = u ? K.post : K.rules.find(({ type: R }) => R === _);
      if (y || (y = { type: _, rules: [] }, K.rules.push(y)), K.keywords[v] = !0, !P)
        return;
      const F = {
        keyword: v,
        definition: {
          ...P,
          type: (0, g.getJSONTypes)(P.type),
          schemaType: (0, g.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, y, F, P.before) : y.rules.push(F), K.all[v] = F, (N = P.implements) === null || N === void 0 || N.forEach((R) => this.addKeyword(R));
    }
    function rA(v, P, _) {
      const N = v.rules.findIndex((u) => u.keyword === _);
      N >= 0 ? v.rules.splice(N, 0, P) : (v.rules.push(P), this.logger.warn(`rule ${_} is not defined`));
    }
    function oA(v) {
      let { metaSchema: P } = v;
      P !== void 0 && (v.$data && this.opts.$data && (P = iA(P)), v.validateSchema = this.compile(P, !0));
    }
    const T = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function iA(v) {
      return { anyOf: [v, T] };
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
    code(g) {
      const { gen: n, schema: E, it: l } = g, { baseId: f, schemaEnv: h, validateName: I, opts: w, self: C } = l, { root: t } = h;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const D = Q.resolveRef.call(C, t, f, E);
      if (D === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (D instanceof Q.SchemaEnv)
        return d(D);
      return M(D);
      function c() {
        if (h === t)
          return a(g, I, h, h.$async);
        const m = n.scopeValue("root", { ref: t });
        return a(g, (0, r._)`${m}.validate`, t, t.$async);
      }
      function d(m) {
        const p = s(g, m);
        a(g, p, m, m.$async);
      }
      function M(m) {
        const p = n.scopeValue("schema", w.code.source === !0 ? { ref: m, code: (0, r.stringify)(m) } : { ref: m }), H = n.name("valid"), q = g.subschema({
          schema: m,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: p,
          errSchemaPath: E
        }, H);
        g.mergeEvaluated(q), g.ok(H);
      }
    }
  };
  function s(g, n) {
    const { gen: E } = g;
    return n.validate ? E.scopeValue("validate", { ref: n.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: n })}.validate`;
  }
  ref.getValidate = s;
  function a(g, n, E, l) {
    const { gen: f, it: h } = g, { allErrors: I, schemaEnv: w, opts: C } = h, t = C.passContext ? o.default.this : r.nil;
    l ? D() : c();
    function D() {
      if (!w.$async)
        throw new Error("async schema referenced by sync schema");
      const m = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(g, n, t)}`), M(n), I || f.assign(m, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${h.ValidationError})`, () => f.throw(p)), d(p), I || f.assign(m, !1);
      }), g.ok(m);
    }
    function c() {
      g.result((0, e.callValidateCode)(g, n, t), () => M(n), () => d(n));
    }
    function d(m) {
      const p = (0, r._)`${m}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${p} : ${o.default.vErrors}.concat(${p})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(m) {
      var p;
      if (!h.opts.unevaluated)
        return;
      const H = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (h.props !== !0)
        if (H && !H.dynamicProps)
          H.props !== void 0 && (h.props = i.mergeEvaluated.props(f, H.props, h.props));
        else {
          const q = f.var("props", (0, r._)`${m}.evaluated.props`);
          h.props = i.mergeEvaluated.props(f, q, h.props, r.Name);
        }
      if (h.items !== !0)
        if (H && !H.dynamicItems)
          H.items !== void 0 && (h.items = i.mergeEvaluated.items(f, H.items, h.items));
        else {
          const q = f.var("items", (0, r._)`${m}.evaluated.items`);
          h.items = i.mergeEvaluated.items(f, q, h.items, r.Name);
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
      const { gen: Q, data: i, schemaCode: B, it: s } = o, a = s.opts.multipleOfPrecision, g = Q.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${g}) - ${g}) > 1e-${a}` : (0, A._)`${g} !== parseInt(${g})`;
      o.fail$data((0, A._)`(${B} === 0 || (${g} = ${i}/${B}, ${n}))`);
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
      const { keyword: B, data: s, schemaCode: a, it: g } = i, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = g.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(i.gen, r.default)}(${s})`;
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
      const { data: i, $data: B, schema: s, schemaCode: a, it: g } = Q, n = g.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(Q, s);
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
      const { gen: B, schema: s, schemaCode: a, data: g, $data: n, it: E } = i, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? h() : I(), l.strictRequired) {
        const t = i.parentSchema.properties, { definedProperties: D } = i.it;
        for (const c of s)
          if (t?.[c] === void 0 && !D.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function h() {
        if (f || n)
          i.block$data(e.nil, w);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(i, t);
      }
      function I() {
        const t = B.let("missing");
        if (f || n) {
          const D = B.let("valid", !0);
          i.block$data(D, () => C(t, D)), i.ok(D);
        } else
          B.if((0, A.checkMissingProp)(i, s, t)), (0, A.reportMissingProp)(i, t), B.else();
      }
      function w() {
        B.forOf("prop", a, (t) => {
          i.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, g, t, l.ownProperties), () => i.error());
        });
      }
      function C(t, D) {
        i.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(D, (0, A.propertyInData)(B, g, t, l.ownProperties)), B.if((0, e.not)(D), () => {
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
      const { gen: s, data: a, $data: g, schema: n, parentSchema: E, schemaCode: l, it: f } = B;
      if (!g && !n)
        return;
      const h = s.let("valid"), I = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(h, w, (0, e._)`${l} === false`), B.ok(h);
      function w() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(h, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : D)(c, d));
      }
      function C() {
        return I.length > 0 && !I.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), m = (0, A.checkDataTypes)(I, M, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(m, (0, e._)`continue`), I.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${p}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${M}]`), B.error(), s.assign(h, !1).break();
          }).code((0, e._)`${p}[${M}] = ${c}`);
        });
      }
      function D(c, d) {
        const M = (0, r.useFunc)(s, o.default), m = s.name("outer");
        s.label(m).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(h, !1).break(m);
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
      const { gen: B, data: s, $data: a, schemaCode: g, schema: n } = i;
      a || n && typeof n == "object" ? i.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${g})`) : i.fail((0, A._)`${n} !== ${s}`);
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
      const { gen: B, data: s, $data: a, schema: g, schemaCode: n, it: E } = i;
      if (!a && g.length === 0)
        throw new Error("enum must have non-empty array");
      const l = g.length >= E.opts.loopEnum;
      let f;
      const h = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let I;
      if (l || a)
        I = B.let("valid"), i.block$data(I, w);
      else {
        if (!Array.isArray(g))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        I = (0, A.or)(...g.map((D, c) => C(t, c)));
      }
      i.pass(I);
      function w() {
        B.assign(I, !1), B.forOf("v", n, (t) => B.if((0, A._)`${h()}(${s}, ${t})`, () => B.assign(I, !0).break()));
      }
      function C(t, D) {
        const c = g[D];
        return typeof c == "object" && c !== null ? (0, A._)`${h()}(${s}, ${t}[${D}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = Q, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), Q = requireLimitProperties(), i = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), g = require_enum(), n = [
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
    g.default
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
    const { gen: s, schema: a, data: g, keyword: n, it: E } = i;
    E.items = !0;
    const l = s.const("len", (0, A._)`${g}.length`);
    if (a === !1)
      i.setParams({ len: B.length }), i.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const h = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(h), () => f(h)), i.ok(h);
    }
    function f(h) {
      s.forRange("i", B.length, l, (I) => {
        i.subschema({ keyword: n, dataProp: I, dataPropType: e.Type.Num }, h), E.allErrors || s.if((0, A.not)(h), () => s.break());
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
    const { gen: a, parentSchema: g, data: n, keyword: E, it: l } = i;
    I(g), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), h = a.const("len", (0, A._)`${n}.length`);
    s.forEach((w, C) => {
      (0, e.alwaysValidSchema)(l, w) || (a.if((0, A._)`${h} > ${C}`, () => i.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), i.ok(f));
    });
    function I(w) {
      const { opts: C, errSchemaPath: t } = l, D = s.length, c = D === w.minItems && (D === w.maxItems || w[B] === !1);
      if (C.strictTuples && !c) {
        const d = `"${E}" is ${D}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, C.strictTuples);
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
      const { schema: s, parentSchema: a, it: g } = B, { prefixItems: n } = a;
      g.items = !0, !(0, e.alwaysValidSchema)(g, s) && (n ? (0, o.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
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
      const { gen: i, schema: B, parentSchema: s, data: a, it: g } = Q;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      g.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const h = i.const("len", (0, A._)`${a}.length`);
      if (Q.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(g, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(g, '"minContains" > "maxContains" is always invalid'), Q.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(g, B)) {
        let D = (0, A._)`${h} >= ${n}`;
        E !== void 0 && (D = (0, A._)`${D} && ${h} <= ${E}`), Q.pass(D);
        return;
      }
      g.items = !0;
      const I = i.name("valid");
      E === void 0 && n === 1 ? C(I, () => i.if(I, () => i.break())) : n === 0 ? (i.let(I, !0), E !== void 0 && i.if((0, A._)`${a}.length > 0`, w)) : (i.let(I, !1), w()), Q.result(I, () => Q.reset());
      function w() {
        const D = i.name("_valid"), c = i.let("count", 0);
        C(D, () => i.if(D, () => t(c)));
      }
      function C(D, c) {
        i.forRange("i", 0, h, (d) => {
          Q.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, D), c();
        });
      }
      function t(D) {
        i.code((0, A._)`${D}++`), E === void 0 ? i.if((0, A._)`${D} >= ${n}`, () => i.assign(I, !0).break()) : (i.if((0, A._)`${D} > ${E}`, () => i.assign(I, !1).break()), n === 1 ? i.assign(I, !0) : i.if((0, A._)`${D} >= ${n}`, () => i.assign(I, !0)));
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
      message: ({ params: { property: a, depsCount: g, deps: n } }) => {
        const E = g === 1 ? "property" : "properties";
        return (0, e.str)`must have ${E} ${n} when property ${a} is present`;
      },
      params: ({ params: { property: a, depsCount: g, deps: n, missingProperty: E } }) => (0, e._)`{property: ${a},
    missingProperty: ${E},
    depsCount: ${g},
    deps: ${n}}`
      // TODO change to reference
    };
    const Q = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [g, n] = i(a);
        B(a, g), s(a, n);
      }
    };
    function i({ schema: a }) {
      const g = {}, n = {};
      for (const E in a) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(a[E]) ? g : n;
        l[E] = a[E];
      }
      return [g, n];
    }
    function B(a, g = a.schema) {
      const { gen: n, data: E, it: l } = a;
      if (Object.keys(g).length === 0)
        return;
      const f = n.let("missing");
      for (const h in g) {
        const I = g[h];
        if (I.length === 0)
          continue;
        const w = (0, o.propertyInData)(n, E, h, l.opts.ownProperties);
        a.setParams({
          property: h,
          depsCount: I.length,
          deps: I.join(", ")
        }), l.allErrors ? n.if(w, () => {
          for (const C of I)
            (0, o.checkReportMissingProp)(a, C);
        }) : (n.if((0, e._)`${w} && (${(0, o.checkMissingProp)(a, I, f)})`), (0, o.reportMissingProp)(a, f), n.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, g = a.schema) {
      const { gen: n, data: E, keyword: l, it: f } = a, h = n.name("valid");
      for (const I in g)
        (0, r.alwaysValidSchema)(f, g[I]) || (n.if(
          (0, o.propertyInData)(n, E, I, f.opts.ownProperties),
          () => {
            const w = a.subschema({ keyword: l, schemaProp: I }, h);
            a.mergeValidEvaluated(w, h);
          },
          () => n.var(h, !0)
          // TODO var
        ), a.ok(h));
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
      const g = i.name("valid");
      i.forIn("key", s, (n) => {
        Q.setParams({ propertyName: n }), Q.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, g), i.if((0, A.not)(g), () => {
          Q.error(!0), a.allErrors || i.break();
        });
      }), Q.ok(g);
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
      const { gen: s, schema: a, parentSchema: g, data: n, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: h } = l;
      if (l.props = !0, h.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const I = (0, A.allSchemaProperties)(g.properties), w = (0, A.allSchemaProperties)(g.patternProperties);
      C(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", n, (M) => {
          !I.length && !w.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let m;
        if (I.length > 8) {
          const p = (0, o.schemaRefOrVal)(l, g.properties, "properties");
          m = (0, A.isOwnProperty)(s, p, M);
        } else I.length ? m = (0, e.or)(...I.map((p) => (0, e._)`${M} === ${p}`)) : m = e.nil;
        return w.length && (m = (0, e.or)(m, ...w.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${M})`))), (0, e.not)(m);
      }
      function D(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (h.removeAdditional === "all" || h.removeAdditional && a === !1) {
          D(M);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const m = s.name("valid");
          h.removeAdditional === "failing" ? (d(M, m, !1), s.if((0, e.not)(m), () => {
            B.reset(), D(M);
          })) : (d(M, m), f || s.if((0, e.not)(m), () => s.break()));
        }
      }
      function d(M, m, p) {
        const H = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: o.Type.Str
        };
        p === !1 && Object.assign(H, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(H, m);
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
      const { gen: B, schema: s, parentSchema: a, data: g, it: n } = i;
      n.opts.removeAdditional === "all" && a.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(n, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const w of E)
        n.definedProperties.add(w);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), n.props));
      const l = E.filter((w) => !(0, r.alwaysValidSchema)(n, s[w]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const w of l)
        h(w) ? I(w) : (B.if((0, e.propertyInData)(B, g, w, n.opts.ownProperties)), I(w), n.allErrors || B.else().var(f, !0), B.endIf()), i.it.definedProperties.add(w), i.ok(f);
      function h(w) {
        return n.opts.useDefaults && !n.compositeRule && s[w].default !== void 0;
      }
      function I(w) {
        i.subschema({
          keyword: "properties",
          schemaProp: w,
          dataProp: w
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
      const { gen: B, schema: s, data: a, parentSchema: g, it: n } = i, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const h = E.strictSchema && !E.allowMatchingProperties && g.properties, I = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, o.evaluatedPropsToName)(B, n.props));
      const { props: w } = n;
      C();
      function C() {
        for (const c of l)
          h && t(c), n.allErrors ? D(c) : (B.var(I, !0), D(c), B.if(I));
      }
      function t(c) {
        for (const d in h)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function D(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(i, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || i.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: o.Type.Str
            }, I), n.opts.unevaluated && w !== !0 ? B.assign((0, e._)`${w}[${d}]`, !0) : !M && !n.allErrors && B.if((0, e.not)(I), () => B.break());
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
      const g = B, n = i.let("valid", !1), E = i.let("passing", null), l = i.name("_valid");
      Q.setParams({ passing: E }), i.block(f), Q.result(n, () => Q.reset(), () => Q.error(!0));
      function f() {
        g.forEach((h, I) => {
          let w;
          (0, e.alwaysValidSchema)(a, h) ? i.var(l, !0) : w = Q.subschema({
            keyword: "oneOf",
            schemaProp: I,
            compositeRule: !0
          }, l), I > 0 && i.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${I}]`).else(), i.if(l, () => {
            i.assign(n, !0), i.assign(E, I), w && Q.mergeEvaluated(w, A.Name);
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
        const g = r.subschema({ keyword: "allOf", schemaProp: a }, B);
        r.ok(B), r.mergeEvaluated(g);
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
      const g = Q(a, "then"), n = Q(a, "else");
      if (!g && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), i.reset(), g && n) {
        const I = B.let("ifClause");
        i.setParams({ ifClause: I }), B.if(l, h("then", I), h("else", I));
      } else g ? B.if(l, h("then")) : B.if((0, A.not)(l), h("else"));
      i.pass(E, () => i.error(!0));
      function f() {
        const I = i.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        i.mergeEvaluated(I);
      }
      function h(I, w) {
        return () => {
          const C = i.subschema({ keyword: I }, l);
          B.assign(E, l), i.mergeValidEvaluated(C, E), w ? B.assign(w, (0, A._)`${I}`) : i.setParams({ ifClause: I });
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
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), Q = requireContains(), i = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), g = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), h = require_if(), I = requireThenElse();
  function w(C = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      h.default,
      I.default,
      // object
      B.default,
      s.default,
      i.default,
      a.default,
      g.default
    ];
    return C ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(Q.default), t;
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
    code(o, Q) {
      const { gen: i, data: B, $data: s, schema: a, schemaCode: g, it: n } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: h } = n;
      if (!E.validateFormats)
        return;
      s ? I() : w();
      function I() {
        const C = i.scopeValue("formats", {
          ref: h.formats,
          code: E.code.formats
        }), t = i.const("fDef", (0, A._)`${C}[${g}]`), D = i.let("fType"), c = i.let("format");
        i.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => i.assign(D, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => i.assign(D, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${g} && !${c}`;
        }
        function M() {
          const m = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, p = (0, A._)`(typeof ${c} == "function" ? ${m} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${D} === ${Q} && !${p}`;
        }
      }
      function w() {
        const C = h.formats[a];
        if (!C) {
          d();
          return;
        }
        if (C === !0)
          return;
        const [t, D, c] = M(C);
        t === Q && o.pass(m());
        function d() {
          if (E.strictSchema === !1) {
            h.logger.warn(p());
            return;
          }
          throw new Error(p());
          function p() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function M(p) {
          const H = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, q = i.scopeValue("formats", { key: a, ref: p, code: H });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${q}.validate`] : ["string", p, q];
        }
        function m() {
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
      params: ({ params: { discrError: s, tag: a, tagName: g } }) => (0, A._)`{error: ${s}, tag: ${g}, tagValue: ${a}}`
    },
    code(s) {
      const { gen: a, data: g, schema: n, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const h = n.propertyName;
      if (typeof h != "string")
        throw new Error("discriminator: requires propertyName");
      if (n.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const I = a.let("valid", !1), w = a.const("tag", (0, A._)`${g}${(0, A.getProperty)(h)}`);
      a.if((0, A._)`typeof ${w} == "string"`, () => C(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: w, tagName: h })), s.ok(I);
      function C() {
        const c = D();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${w} === ${d}`), a.assign(I, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: w, tagName: h }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function D() {
        var c;
        const d = {}, M = p(E);
        let m = !0;
        for (let b = 0; b < f.length; b++) {
          let S = f[b];
          if (S?.$ref && !(0, Q.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = S?.properties) === null || c === void 0 ? void 0 : c[h];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${h}"`);
          m = m && (M || p(S)), H(U, b);
        }
        if (!m)
          throw new Error(`discriminator: "${h}" must be required`);
        return d;
        function p({ required: b }) {
          return Array.isArray(b) && b.includes(h);
        }
        function H(b, S) {
          if (b.const)
            q(b.const, S);
          else if (b.enum)
            for (const U of b.enum)
              q(U, S);
          else
            throw new Error(`discriminator: "properties/${h}" must have "const" or "enum"`);
        }
        function q(b, S) {
          if (typeof b != "string" || b in d)
            throw new Error(`discriminator: "${h}" values must be unique strings`);
          d[b] = S;
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
        super._addVocabularies(), o.default.forEach((h) => this.addVocabulary(h)), this.opts.discriminator && this.addKeyword(Q.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const h = this.opts.$data ? this.$dataMetaSchema(i, B) : i;
        this.addMetaSchema(h, s, !1), this.refs["http://json-schema.org/schema"] = s;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(s) ? s : void 0);
      }
    }
    e.Ajv = a, A.exports = e = a, A.exports.Ajv = a, Object.defineProperty(e, "__esModule", { value: !0 }), e.default = a;
    var g = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return g.KeywordCxt;
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
        g(o.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? i(n.value) : Q(n.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
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
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, Q && (i = g[0] & 2 ? Q.return : g[0] ? Q.throw || ((i = Q.return) && i.call(Q), 0) : Q.next) && !(i = i.call(Q, g[1])).done) return i;
      switch (Q = 0, i && (g = [g[0] & 2, i.value]), g[0]) {
        case 0:
        case 1:
          i = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, Q = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (i = r.trys, !(i = i.length > 0 && i[i.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!i || g[1] > i[0] && g[1] < i[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < i[1]) {
            r.label = i[1], i = g;
            break;
          }
          if (i && r.label < i[2]) {
            r.label = i[2], r.ops.push(g);
            break;
          }
          i[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], Q = 0;
    } finally {
      o = i = 0;
    }
    if (g[0] & 5) throw g[1];
    return { value: g[0] ? g[1] : void 0, done: !0 };
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
      for (const { count: a, res: g } of B.anchors.values())
        Q(g, a);
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
  let g = findTagObject(A, e, B.tags);
  if (!g) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    g = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  i && (i(g), delete r.onTagObj);
  const n = g?.createNode ? g.createNode(r.schema, A, r) : typeof g?.nodeClass?.from == "function" ? g.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return g.default || (n.tag = g.tag), a && (a.node = n), n;
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
  const g = [], n = {};
  let E = Q - e.length;
  typeof o == "number" && (o > Q - Math.max(2, i) ? g.push(0) : E = Q - o);
  let l, f, h = !1, I = -1, w = -1, C = -1;
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
          g.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = D, D = A[I += 1], h = !0;
          const c = I > C + 1 ? I - 2 : w - 1;
          if (n[c])
            return A;
          g.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          h = !0;
    }
    f = D;
  }
  if (h && s && s(), g.length === 0)
    return A;
  B && B();
  let t = A.slice(0, g[0]);
  for (let D = 0; D < g.length; ++D) {
    const c = g[D], d = g[D + 1] || A.length;
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
  for (let a = 0, g = r[a]; g; g = r[++a])
    if (g === " " && r[a + 1] === "\\" && r[a + 2] === "n" && (B += r.slice(s, a) + "\\ ", a += 1, s = a, g = "\\"), g === "\\")
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
  const g = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, g.length);
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
  h === -1 ? E = "-" : r === f || h !== f.length - 1 ? (E = "+", i && i()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${g}`));
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
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${g}`));
  let c = (I ? g ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), Q && Q()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${g}`);
    let M = !1;
    const m = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (m.onOverflow = () => {
      M = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, g, FOLD_BLOCK, m);
    if (!M)
      return `>${c}
${g}${p}`;
  }
  return r = r.replace(/\n+/g, `$&${g}`), `|${c}
${g}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: Q, value: i } = A, { actualString: B, implicitKey: s, indent: a, indentStep: g, inFlow: n } = e;
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
    if (s && a === g)
      return quotedString(i, e);
  }
  const E = i.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (I) => I.default && I.tag !== "tag:yaml.org,2002:str" && I.test?.test(E), { compat: f, tags: h } = e.doc.schema;
    if (h.some(l) || f?.some(l))
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
  let g = a(s);
  if (g === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = Q && n || E;
    if (g = a(l), g === null)
      throw new Error(`Unsupported default string type ${l}`);
  }
  return g;
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
  const { allNullValues: i, doc: B, indent: s, indentStep: a, options: { commentString: g, indentSeq: n, simpleKeys: E } } = r;
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
  let h = !1, I = !1, w = stringify(A, r, () => h = !0, () => I = !0);
  if (!f && !r.inFlow && w.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (i || e == null)
      return h && o && o(), w === "" ? "?" : f ? `? ${w}` : w;
  } else if (i && !E || e == null && f)
    return w = `? ${w}`, l && !h ? w += lineComment(w, r.indent, g(l)) : I && Q && Q(), w;
  h && (l = null), f ? (l && (w += lineComment(w, r.indent, g(l))), w = `? ${w}
${s}:`) : (w = `${w}:`, l && (w += lineComment(w, r.indent, g(l))));
  let C, t, D;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, D = e.comment) : (C = !1, t = null, D = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = w.length + 1), I = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => I = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
` : "", t) {
      const m = g(t);
      M += `
${indentComment(m, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const m = d[0], p = d.indexOf(`
`), H = p !== -1, q = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (H || !q) {
      let b = !1;
      if (H && (m === "&" || m === "!")) {
        let S = d.indexOf(" ");
        m === "&" && S !== -1 && S < p && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || p < S) && (b = !0);
      }
      b || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return w += M + d, r.inFlow ? c && o && o() : D && !c ? w += lineComment(w, r.indent, g(D)) : I && Q && Q(), w;
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
  const { indent: a, options: { commentString: g } } = r, n = Object.assign({}, r, { indent: i, type: null });
  let E = !1;
  const l = [];
  for (let h = 0; h < e.length; ++h) {
    const I = e[h];
    let w = null;
    if (isNode(I))
      !E && I.spaceBefore && l.push(""), addCommentBefore(r, l, I.commentBefore, E), I.comment && (w = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let C = stringify(I, n, () => w = null, () => E = !0);
    w && (C += lineComment(C, i, g(w))), E && w && (E = !1), l.push(o + C);
  }
  let f;
  if (l.length === 0)
    f = Q.start + Q.end;
  else {
    f = l[0];
    for (let h = 1; h < l.length; ++h) {
      const I = l[h];
      f += I ? `
${a}${I}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(g(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: Q, indentStep: i, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += i;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let g = !1, n = 0;
  const E = [];
  for (let h = 0; h < A.length; ++h) {
    const I = A[h];
    let w = null;
    if (isNode(I))
      I.spaceBefore && E.push(""), addCommentBefore(e, E, I.commentBefore, !1), I.comment && (w = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (g = !0));
      const D = isNode(I.value) ? I.value : null;
      D ? (D.comment && (w = D.comment), D.commentBefore && (g = !0)) : I.value == null && t?.comment && (w = t.comment);
    }
    w && (g = !0);
    let C = stringify(I, a, () => w = null);
    h < A.length - 1 && (C += ","), w && (C += lineComment(C, o, s(w))), !g && (E.length > n || C.includes(`
`)) && (g = !0), E.push(C), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!g) {
    const h = E.reduce((I, w) => I + w.length + 2, 2);
    g = e.options.lineWidth > 0 && h > e.options.lineWidth;
  }
  if (g) {
    let h = l;
    for (const I of E)
      h += I ? `
${i}${Q}${I}` : `
`;
    return `${h}
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
    const { keepUndefined: Q, replacer: i } = o, B = new this(e), s = (a, g) => {
      if (typeof i == "function")
        g = i.call(r, a, g);
      else if (Array.isArray(i) && !i.includes(a))
        return;
      (g !== void 0 || Q) && B.items.push(createPair(a, g, o));
    };
    if (r instanceof Map)
      for (const [a, g] of r)
        s(a, g);
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
        const g = Object.keys(B);
        if (g.length === 1)
          s = g[0], a = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${g.length} keys`);
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
      let a = s.i, g = s.n;
      if (i.length > 2) {
        const E = [], l = [], f = (i.length - 2) / 2, h = i.slice(2, 2 + f);
        for (const I of h) {
          const w = A.subscripts[I];
          E.push(w.i), l.push(w.n);
        }
        a += `[${E.join(",")}]`, g += `[${l.join(",")}]`;
      }
      const n = {
        varId: a,
        varName: g,
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
  function r(g, n) {
    n < g.minValue ? (console.warn(
      `WARNING: Scenario input value ${n} is < min value (${g.minValue}) for input '${g.varName}'`
    ), n = g.minValue) : n > g.maxValue && (console.warn(
      `WARNING: Scenario input value ${n} is > max value (${g.maxValue}) for input '${g.varName}'`
    ), n = g.maxValue), g.value.set(n);
  }
  function o(g) {
    g.value.reset();
  }
  function Q(g) {
    g.value.set(g.minValue);
  }
  function i(g) {
    g.value.set(g.maxValue);
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
      for (const g of e.settings) {
        const n = A.get(g.inputVarId);
        if (n)
          switch (g.kind) {
            case "position":
              switch (g.position) {
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
                  assertNeverExports.assertNever(g.position);
              }
              break;
            case "value":
              r(n, g.value);
              break;
            default:
              assertNeverExports.assertNever(g);
          }
        else
          console.log(`No model input for scenario input ${g.inputVarId}`);
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_3", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed0", varId: "_fake_value_15", varName: "Fake Value 15", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_36", varId: "_ssp_pou_sigma_variation", varName: "SSP PoU Sigma Variation", defaultValue: 1, minValue: 0.8, maxValue: 1.2 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_average_caloric_availability_per_capita_per_day", varName: "Average Caloric Availability per Capita per Day" }, { varId: "_average_caloric_consumption_per_capita_per_day", varName: "Average Caloric Consumption per Capita per Day" }, { varId: "_average_total_daily_calorie_intake", varName: "Average Total Daily Calorie Intake" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_by_food_category[_cropmeat]", varName: "Caloric Availability by Food Category[CropMeat]" }, { varId: "_caloric_availability_by_food_category[_dairy]", varName: "Caloric Availability by Food Category[Dairy]" }, { varId: "_caloric_availability_by_food_category[_eggs]", varName: "Caloric Availability by Food Category[Eggs]" }, { varId: "_caloric_availability_by_food_category[_grains]", varName: "Caloric Availability by Food Category[Grains]" }, { varId: "_caloric_availability_by_food_category[_othercrops]", varName: "Caloric Availability by Food Category[OtherCrops]" }, { varId: "_caloric_availability_by_food_category[_pasmeat]", varName: "Caloric Availability by Food Category[PasMeat]" }, { varId: "_caloric_availability_by_food_category[_pulses]", varName: "Caloric Availability by Food Category[Pulses]" }, { varId: "_caloric_availability_by_food_category[_vegfruits]", varName: "Caloric Availability by Food Category[VegFruits]" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_caloric_intake_per_capita_per_day_from_animal_food", varName: "Caloric Intake per Capita per Day from Animal Food" }, { varId: "_caloric_intake_per_capita_per_day_from_plant_food", varName: "Caloric Intake per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_crop_yield_for_each_category[_grains]", varName: "Crop yield for each category [Grains]" }, { varId: "_crop_yield_for_each_category[_othercrops]", varName: "Crop yield for each category [OtherCrops]" }, { varId: "_crop_yield_for_each_category[_pulses]", varName: "Crop yield for each category [Pulses]" }, { varId: "_crop_yield_for_each_category[_vegfruits]", varName: "Crop yield for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_calories_per_capita_per_day", varName: "Desired Food Production in Calories per Capita Per Day" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effective_food_demand_per_capita_per_day", varName: "Effective Food Demand per Capita per Day" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_shortage_in_tonnes[_cropmeat]", varName: "Food shortage in tonnes[CropMeat]" }, { varId: "_food_shortage_in_tonnes[_dairy]", varName: "Food shortage in tonnes[Dairy]" }, { varId: "_food_shortage_in_tonnes[_eggs]", varName: "Food shortage in tonnes[Eggs]" }, { varId: "_food_shortage_in_tonnes[_grains]", varName: "Food shortage in tonnes[Grains]" }, { varId: "_food_shortage_in_tonnes[_othercrops]", varName: "Food shortage in tonnes[OtherCrops]" }, { varId: "_food_shortage_in_tonnes[_pasmeat]", varName: "Food shortage in tonnes[PasMeat]" }, { varId: "_food_shortage_in_tonnes[_pulses]", varName: "Food shortage in tonnes[Pulses]" }, { varId: "_food_shortage_in_tonnes[_vegfruits]", varName: "Food shortage in tonnes[VegFruits]" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_animal_and_crop_production[_cropmeat]", varName: "Total Animal and Crop Production[CropMeat]" }, { varId: "_total_animal_and_crop_production[_dairy]", varName: "Total Animal and Crop Production[Dairy]" }, { varId: "_total_animal_and_crop_production[_eggs]", varName: "Total Animal and Crop Production[Eggs]" }, { varId: "_total_animal_and_crop_production[_grains]", varName: "Total Animal and Crop Production[Grains]" }, { varId: "_total_animal_and_crop_production[_othercrops]", varName: "Total Animal and Crop Production[OtherCrops]" }, { varId: "_total_animal_and_crop_production[_pasmeat]", varName: "Total Animal and Crop Production[PasMeat]" }, { varId: "_total_animal_and_crop_production[_pulses]", varName: "Total Animal and Crop Production[Pulses]" }, { varId: "_total_animal_and_crop_production[_vegfruits]", varName: "Total Animal and Crop Production[VegFruits]" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_daily_calorie_supply_per_capita", varName: "Total Daily Calorie Supply per Capita" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 487850, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,D){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return D.deserialize(o,I)},serialize(o){return D.serialize(o,E)}}}serializers.extendSerializer=A;const w={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?w.deserialize(B):B},serialize(B){return B instanceof Error?w.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let w=A.DefaultSerializer;function Q(I){w=A.extendSerializer(w,I)}common.registerSerializer=Q;function B(I){return w.deserialize(I)}common.deserialize=B;function D(I){return w.serialize(I)}return common.serialize=D,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function w(D){return!(!D||typeof D!="object")}function Q(D){return D&&typeof D=="object"&&D[A.$transferable]}transferable.isTransferDescriptor=Q;function B(D,I){if(!I){if(!w(D))throw Error();I=[D]}return{[A.$transferable]:!0,send:D,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(w){w.cancel="cancel",w.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(w){w.error="error",w.init="init",w.result="result",w.running="running",w.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const D=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!D)},w=function(D,I){self.postMessage(D,I)},Q=function(D){const I=o=>{D(o.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},w=function(E){self.postMessage(E)};let Q=!1;const B=new Set,D=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(M=>M(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:D},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const w=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!w.default().isMainThread},D=function(K,M){Q(w.default().parentPort).postMessage(K,M)},I=function(K){const M=w.default().parentPort;if(!M)throw Error("Invariant violation: MessagePort to parent is not available.");const a=t=>{K(t)},G=()=>{Q(M).off("message",a)};return Q(M).on("message",a),G};function E(){w.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:D,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const w=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),D=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=D?I():w.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var w=worker&&worker.__awaiter||function(i,P,O,y){function Y(z){return z instanceof O?z:new O(function(S){S(z)})}return new(O||(O=Promise))(function(z,S){function V(p){try{x(y.next(p))}catch(X){S(X)}}function $(p){try{x(y.throw(p))}catch(X){S(X)}}function x(p){p.done?z(p.value):Y(p.value).then(V,$)}x((y=y.apply(i,P||[])).next())})},Q=worker&&worker.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),D=requireCommon(),I=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var M=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return M.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let a=!1;const G=new Map,t=i=>i&&i.type===E.MasterMessageType.cancel,N=i=>i&&i.type===E.MasterMessageType.run,n=i=>B.default(i)||q(i);function q(i){return i&&typeof i=="object"&&typeof i.subscribe=="function"}function d(i){return I.isTransferDescriptor(i)?{payload:i.send,transferables:i.transferables}:{payload:i,transferables:void 0}}function Z(){const i={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(i)}function m(i){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:i}};o.default.postMessageToMaster(P)}function H(i,P){const{payload:O,transferables:y}=d(P),Y={type:E.WorkerMessageType.error,uid:i,error:D.serialize(O)};o.default.postMessageToMaster(Y,y)}function c(i,P,O){const{payload:y,transferables:Y}=d(O),z={type:E.WorkerMessageType.result,uid:i,complete:P?!0:void 0,payload:y};o.default.postMessageToMaster(z,Y)}function R(i,P){const O={type:E.WorkerMessageType.running,uid:i,resultType:P};o.default.postMessageToMaster(O)}function h(i){try{const P={type:E.WorkerMessageType.uncaughtError,error:D.serialize(i)};o.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,i)}}function F(i,P,O){return w(this,void 0,void 0,function*(){let y;try{y=P(...O)}catch(z){return H(i,z)}const Y=n(y)?"observable":"promise";if(R(i,Y),n(y)){const z=y.subscribe(S=>c(i,!1,D.serialize(S)),S=>{H(i,D.serialize(S)),G.delete(i)},()=>{c(i,!0),G.delete(i)});G.set(i,z)}else try{const z=yield y;c(i,!0,D.serialize(z))}catch(z){H(i,D.serialize(z))}})}function l(i){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(a)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(a=!0,typeof i=="function")o.default.subscribeToMasterMessages(P=>{N(P)&&!P.method&&F(P.uid,i,P.args.map(D.deserialize))}),Z();else if(typeof i=="object"&&i){o.default.subscribeToMasterMessages(O=>{N(O)&&O.method&&F(O.uid,i[O.method],O.args.map(D.deserialize))});const P=Object.keys(i).filter(O=>typeof i[O]=="function");m(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${i}`);o.default.subscribeToMasterMessages(P=>{if(t(P)){const O=P.uid,y=G.get(O);y&&(y.unsubscribe(),G.delete(O))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",i=>{setTimeout(()=>h(i.error||i),250)}),self.addEventListener("unhandledrejection",i=>{const P=i.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",i=>{setTimeout(()=>h(i),250)}),process.on("unhandledRejection",i=>{i&&typeof i.message=="string"&&setTimeout(()=>h(i),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var w;let Q=1;for(const B of A){Q+=2;const D=((w=B.subscriptIndices)==null?void 0:w.length)||0;Q+=D}return Q}function encodeVarIndices(A,w){let Q=0;w[Q++]=A.length;for(const B of A){w[Q++]=B.varIndex;const D=B.subscriptIndices,I=D?.length||0;w[Q++]=I;for(let E=0;E<I;E++)w[Q++]=D[E]}}function getEncodedLookupBufferLengths(A){var w,Q;let B=1,D=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((w=E.subscriptIndices)==null?void 0:w.length)||0;B+=o,B+=2,D+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:D}}function encodeLookups(A,w,Q){let B=0;w[B++]=A.length;let D=0;for(const I of A){const E=I.varRef.varSpec;w[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;w[B++]=K;for(let M=0;M<K;M++)w[B++]=o[M];I.points!==void 0?(w[B++]=D,w[B++]=I.points.length,Q?.set(I.points,D),D+=I.points.length):(w[B++]=-1,w[B++]=0)}}function decodeLookups(A,w){const Q=[];let B=0;const D=A[B++];for(let I=0;I<D;I++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let N=0;N<o;N++)K[N]=A[B++];const M=A[B++],a=A[B++],G={varIndex:E,subscriptIndices:K};let t;M>=0?w?t=w.slice(M,M+a):t=new Float64Array(0):t=void 0,Q.push({varRef:{varSpec:G},points:t})}return Q}function resolveVarRef(A,w,Q){if(!w.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(w.varId){const B=A?.getSpecForVarId(w.varId);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${w.varId}`)}else{const B=A?.getSpecForVarName(w.varName);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${w.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Int32Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Float64Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,w){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=w(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,w){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=w(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,w,Q){const B=A.length,D=w.varIds.length*w.seriesLength;let I;const E=w.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const F of Q.lookups)resolveVarRef(this.listing,F.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);o=h.lookupsLength,K=h.lookupIndicesLength}else o=0,K=0;let M=0;function a(h,F){const l=M,i=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(F*i),O=Math.ceil(P/8)*8;return M+=O,l}const G=a("int32",headerLengthInElements),t=a("float64",extrasLengthInElements),N=a("float64",B),n=a("float64",D),q=a("int32",I),d=a("float64",o),Z=a("int32",K),m=M;if(this.encoded===void 0||this.encoded.byteLength<m){const h=Math.ceil(m*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,G,headerLengthInElements)}const H=this.header.view;let c=0;H[c++]=t,H[c++]=extrasLengthInElements,H[c++]=N,H[c++]=B,H[c++]=n,H[c++]=D,H[c++]=q,H[c++]=I,H[c++]=d,H[c++]=o,H[c++]=Z,H[c++]=K,this.inputs.update(this.encoded,N,B),this.extras.update(this.encoded,t,extrasLengthInElements),this.outputs.update(this.encoded,n,D),this.outputIndices.update(this.encoded,q,I),this.lookups.update(this.encoded,d,o),this.lookupIndices.update(this.encoded,Z,K);const R=this.inputs.view;for(let h=0;h<A.length;h++){const F=A[h];typeof F=="number"?R[h]=F:R[h]=F.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const w=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<w)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let D=0;const I=B[D++],E=B[D++],o=B[D++],K=B[D++],M=B[D++],a=B[D++],G=B[D++],t=B[D++],N=B[D++],n=B[D++],q=B[D++],d=B[D++],Z=E*Float64Array.BYTES_PER_ELEMENT,m=K*Float64Array.BYTES_PER_ELEMENT,H=a*Float64Array.BYTES_PER_ELEMENT,c=t*Int32Array.BYTES_PER_ELEMENT,R=n*Float64Array.BYTES_PER_ELEMENT,h=d*Int32Array.BYTES_PER_ELEMENT,F=w+Z+m+H+c+R+h;if(A.byteLength<F)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,M,a),this.outputIndices.update(this.encoded,G,t),this.lookups.update(this.encoded,N,n),this.lookupIndices.update(this.encoded,q,d)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,w){if(w&&w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);this.originalData=w,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,w){if(w){if(w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=w.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,w){return this.getValue(A,!1,w)}getValueForY(A){if(this.invertedData===void 0){const w=this.activeSize*2,Q=this.activeData,B=Array(w);for(let D=0;D<w;D+=2)B[D]=Q[D+1],B[D+1]=Q[D];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,w,Q){if(this.activeSize===0)return _NA_;const B=w?this.invertedData:this.activeData,D=this.activeSize*2,I=!w;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<D;o+=2){const K=B[o];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const M=B[o-2],a=B[o-1],G=B[o+1],t=K-M,N=G-a;return a+N/t*(A-M)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=D),B[D-1]}getValueForGameTime(A,w){if(this.activeSize<=0)return w;const Q=this.activeData[0];return A<Q?w:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,w){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(w){case"forward":{A=Math.floor(A);for(let D=0;D<B;D+=2)if(Q[D]>=A)return Q[D+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let D=2;D<B;D+=2)if(Q[D]>=A)return Q[D-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let D=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw D+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",D+="results that may differ from those produced by SDEverywhere.",new Error(D)}for(let D=2;D<B;D+=2){const I=Q[D];if(I>=A){const E=Q[D-2],o=Q[D-1],K=Q[D+1],M=I-E,a=K-o;return o+a/M*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const w=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,D){return B?B.getValueForGameTime(A.currentTime,D):D},INTEG(B,D){return B+D*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,D){return Math.max(B,D)},MIN(B,D){return Math.min(B,D)},MODULO(B,D){return B%D},POW(B,D){return Math.pow(B,D)},POWER(B,D){return Math.pow(B,D)},PULSE(B,D){return pulse(A,B,D)},PULSE_TRAIN(B,D,I,E){const o=Math.floor((E-B)/I);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*I,D))return 1;return 0},QUANTUM(B,D){return D<=0?B:D*Math.trunc(B/D)},RAMP(B,D,I){return A.currentTime>D?A.currentTime<I||D>I?B*(A.currentTime-D):B*(I-D):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,D){return A.currentTime+A.timeStep/2>D?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,D,I){if(D>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${D})`);let E=Q.get(D);if(E===void 0){E=Array(D);for(let M=0;M<D;M++)E[M]={x:0,ind:0};Q.set(D,E)}let o=w.get(D);o===void 0&&(o=Array(D),w.set(D,o));for(let M=0;M<D;M++)E[M].x=B[M],E[M].ind=M;const K=I>0?1:-1;E.sort((M,a)=>{let G;return M.x<a.x?G=-1:M.x>a.x?G=1:G=0,G*K});for(let M=0;M<D;M++)o[M]=E[M].ind;return o},XIDZ(B,D,I){return Math.abs(D)<EPSILON?I:B/D},ZIDZ(B,D){return Math.abs(D)<EPSILON?0:B/D},createLookup(B,D){return new JsModelLookup(B,D)},LOOKUP(B,D){return B?B.getValueForX(D,"interpolate"):_NA_},LOOKUP_FORWARD(B,D){return B?B.getValueForX(D,"forward"):_NA_},LOOKUP_BACKWARD(B,D){return B?B.getValueForX(D,"backward"):_NA_},LOOKUP_INVERT(B,D){return B?B.getValueForY(D):_NA_},WITH_LOOKUP(B,D){return D?D.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,D,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(D,E):_NA_}}}function pulse(A,w,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>w&&B<w+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const w=process.hrtime(A);return(w[0]*1e9+w[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var w;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const D=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<D)&&(this.outputs=new Float64Array(D));const I=this.outputs,E=perfNow();(w=this.onRunModel)==null||w.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let w=A.getModelFunctions();w===void 0&&(w=getJsModelFunctions(),A.setModelFunctions(w));const Q=A.getInitialTime(),B=A.getFinalTime(),D=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,M)=>{runJsModel(A,Q,B,D,I,E,o,K,M?.outputIndices,M?.lookups)}})}function runJsModel(A,w,Q,B,D,I,E,o,K,M,a){let G=w;A.setTime(G);const t={timeStep:B,currentTime:G};if(A.getModelFunctions().setContext(t),A.initConstants(),M!==void 0)for(const m of M)A.setLookup(m.varRef.varSpec,m.points);E?.length>0&&A.setInputs(m=>E[m]),A.initLevels();const N=Math.round((Q-w)/B),n=Q;let q=0,d=0,Z=0;for(;q<=N;){if(A.evalAux(),G%D<1e-6){Z=0;const m=H=>{const c=Z*I+d;o[c]=G<=n?H:void 0,Z++};if(K!==void 0){let H=0;const c=K[H++];for(let R=0;R<c;R++){const h=K[H++],F=K[H++];let l;F>0&&(l=K.subarray(H,H+F),H+=F);const i={varIndex:h,subscriptIndices:l};A.storeOutput(i,m)}}else A.storeOutputs(m);d++}if(q===N)break;A.evalLevels(),G+=B,A.setTime(G),t.currentTime=G,q++}}var WasmBuffer=class{constructor(A,w,Q,B){this.wasmModule=A,this.numElements=w,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,w;this.heapArray&&((w=(A=this.wasmModule)._free)==null||w.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,w){const B=w*4,D=A._malloc(B),I=D/4,E=A.HEAP32.subarray(I,I+w);return new WasmBuffer(A,w,D,E)}function createFloat64WasmBuffer(A,w){const B=w*8,D=A._malloc(B),I=D/8,E=A.HEAPF64.subarray(I,I+w);return new WasmBuffer(A,w,D,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function w(Q){return A.cwrap(Q,"number",[])()}this.startTime=w("getInitialTime"),this.endTime=w("getFinalTime"),this.saveFreq=w("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var w,Q,B,D,I,E,o;const K=A.getLookups();if(K!==void 0)for(const N of K){const n=N.varRef.varSpec,q=((w=n.subscriptIndices)==null?void 0:w.length)||0;let d;q>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<q)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,q)),this.lookupSubIndicesBuffer.getArrayView().set(n.subscriptIndices),d=this.lookupSubIndicesBuffer.getAddress()):d=0;let Z,m;if(N.points){const c=N.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<c)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,c)),this.lookupDataBuffer.getArrayView().set(N.points),Z=this.lookupDataBuffer.getAddress(),m=c/2}else Z=0,m=0;const H=n.varIndex;this.wasmSetLookup(H,d,Z,m)}A.copyInputs((D=this.inputsBuffer)==null?void 0:D.getArrayView(),N=>{var n;return(n=this.inputsBuffer)==null||n.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,N),this.inputsBuffer.getArrayView()});let M;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),N=>{var n;return(n=this.outputIndicesBuffer)==null||n.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,N),this.outputIndicesBuffer.getArrayView()}),M=this.outputIndicesBuffer):M=void 0;const a=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<a)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,a));const G=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),M?.getAddress()||0);const t=perfElapsed(G);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(t)}terminate(){var A,w,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(w=this.outputsBuffer)==null||w.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,D;Q.ready=new Promise(function(C,g){B=C,D=g}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_average_caloric_availability_per_capita_per_day","_average_caloric_consumption_per_capita_per_day","_average_total_daily_calorie_intake","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_by_food_category[_cropmeat]","_caloric_availability_by_food_category[_dairy]","_caloric_availability_by_food_category[_eggs]","_caloric_availability_by_food_category[_grains]","_caloric_availability_by_food_category[_othercrops]","_caloric_availability_by_food_category[_pasmeat]","_caloric_availability_by_food_category[_pulses]","_caloric_availability_by_food_category[_vegfruits]","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_caloric_intake_per_capita_per_day_from_animal_food","_caloric_intake_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_crop_yield_for_each_category[_grains]","_crop_yield_for_each_category[_othercrops]","_crop_yield_for_each_category[_pulses]","_crop_yield_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_calories_per_capita_per_day","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effective_food_demand_per_capita_per_day","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_shortage_in_tonnes[_cropmeat]","_food_shortage_in_tonnes[_dairy]","_food_shortage_in_tonnes[_eggs]","_food_shortage_in_tonnes[_grains]","_food_shortage_in_tonnes[_othercrops]","_food_shortage_in_tonnes[_pasmeat]","_food_shortage_in_tonnes[_pulses]","_food_shortage_in_tonnes[_vegfruits]","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_animal_and_crop_production[_cropmeat]","_total_animal_and_crop_production[_dairy]","_total_animal_and_crop_production[_eggs]","_total_animal_and_crop_production[_grains]","_total_animal_and_crop_production[_othercrops]","_total_animal_and_crop_production[_pasmeat]","_total_animal_and_crop_production[_pulses]","_total_animal_and_crop_production[_vegfruits]","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_daily_calorie_supply_per_capita","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var M="";function a(C){return Q.locateFile?Q.locateFile(C,M):M+C}var G,t;(o||K)&&(K?M=self.location.href:typeof document<"u"&&document.currentScript&&(M=document.currentScript.src),A&&(M=A),M.indexOf("blob:")!==0?M=M.substr(0,M.replace(/[?#].*/,"").lastIndexOf("/")+1):M="",K&&(t=function(C){try{var g=new XMLHttpRequest;return g.open("GET",C,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}catch(e){var s=wA(C);if(s)return s;throw e}}),G=function(C,g,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){g(e.response);return}var u=wA(C);if(u){g(u.buffer);return}s()},e.onerror=s,e.send(null)});var N=Q.print||console.log.bind(console),n=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var q;Q.wasmBinary&&(q=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&_("no native wasm support detected");var d,Z=!1;function m(C,g){C||_("Assertion failed: "+g)}function H(C){var g=Q["_"+C];return m(g,"Cannot call unknown function "+C+", make sure it is exported"),g}function c(C,g,s,e,u){var j={string:function(J){var T=0;if(J!=null&&J!==0){var eA=(J.length<<2)+1;T=CA(eA),P(J,T,eA)}return T},array:function(J){var T=CA(J.length);return O(J,T),T}};function k(J){return g==="string"?l(J):g==="boolean"?!!J:J}var r=H(C),f=[],b=0;if(e)for(var L=0;L<e.length;L++){var rA=j[s[L]];rA?(b===0&&(b=sA()),f[L]=rA(e[L])):f[L]=e[L]}var IA=r.apply(null,f);function FA(J){return b!==0&&KA(b),k(J)}return IA=FA(IA),IA}function R(C,g,s,e){s=s||[];var u=s.every(function(k){return k==="number"}),j=g!=="string";return j&&u&&!e?H(C):function(){return c(C,g,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function F(C,g,s){for(var e=g+s,u=g;C[u]&&!(u>=e);)++u;if(u-g>16&&C.subarray&&h)return h.decode(C.subarray(g,u));for(var j="";g<u;){var k=C[g++];if(!(k&128)){j+=String.fromCharCode(k);continue}var r=C[g++]&63;if((k&224)==192){j+=String.fromCharCode((k&31)<<6|r);continue}var f=C[g++]&63;if((k&240)==224?k=(k&15)<<12|r<<6|f:k=(k&7)<<18|r<<12|f<<6|C[g++]&63,k<65536)j+=String.fromCharCode(k);else{var b=k-65536;j+=String.fromCharCode(55296|b>>10,56320|b&1023)}}return j}function l(C,g){return C?F(Y,C,g):""}function i(C,g,s,e){if(!(e>0))return 0;for(var u=s,j=s+e-1,k=0;k<C.length;++k){var r=C.charCodeAt(k);if(r>=55296&&r<=57343){var f=C.charCodeAt(++k);r=65536+((r&1023)<<10)|f&1023}if(r<=127){if(s>=j)break;g[s++]=r}else if(r<=2047){if(s+1>=j)break;g[s++]=192|r>>6,g[s++]=128|r&63}else if(r<=65535){if(s+2>=j)break;g[s++]=224|r>>12,g[s++]=128|r>>6&63,g[s++]=128|r&63}else{if(s+3>=j)break;g[s++]=240|r>>18,g[s++]=128|r>>12&63,g[s++]=128|r>>6&63,g[s++]=128|r&63}}return g[s]=0,s-u}function P(C,g,s){return i(C,Y,g,s)}function O(C,g){y.set(C,g)}var y,Y,z;function S(C){Q.HEAP8=y=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=z=new Int32Array(C),Q.HEAPU8=Y=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var V,$=[],x=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());DA($)}function kA(){DA(x)}function GA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)HA(Q.postRun.shift());DA(p)}function PA(C){$.unshift(C)}function aA(C){x.unshift(C)}function HA(C){p.unshift(C)}var v=0,W=null;function cA(C){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function NA(C){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&W){var g=W;W=null,g()}}Q.preloadedImages={},Q.preloadedAudios={};function _(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",n(C),Z=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var g=new WebAssembly.RuntimeError(C);throw D(g),g}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function oA(C){return C.startsWith("file://")}var U;U="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAxEBAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBoMXOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKl64POsEFAgt/AXwjAEEQayIGJAACQEG4ug4oAgAiAgRAIAJBwLoOKAIAIgFBxLoOKAIAbEEDdGpByLoOKAIAQQN0aiAAOQMAQcC6DiABQQFqNgIADAELQbC6DigCACIBRQRAAn9BwJcGKwMAQejRBisDAKFBwNIHKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQbC6DkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQbS6DigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBARGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEG0ug5BtLoOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBEaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAFIAIQDgsgBUGAAmokAAvyAgICfwF+AkAgAkUNACAAIAJqIgNBAWsgAToAACAAIAE6AAAgAkEDSQ0AIANBAmsgAToAACAAIAE6AAEgA0EDayABOgAAIAAgAToAAiACQQdJDQAgA0EEayABOgAAIAAgAToAAyACQQlJDQAgAEEAIABrQQNxIgRqIgMgAUH/AXFBgYKECGwiATYCACADIAIgBGtBfHEiBGoiAkEEayABNgIAIARBCUkNACADIAE2AgggAyABNgIEIAJBCGsgATYCACACQQxrIAE2AgAgBEEZSQ0AIAMgATYCGCADIAE2AhQgAyABNgIQIAMgATYCDCACQRBrIAE2AgAgAkEUayABNgIAIAJBGGsgATYCACACQRxrIAE2AgAgBCADQQRxQRhyIgRrIgJBIEkNACABrUKBgICAEH4hBSADIARqIQEDQCABIAU3AxggASAFNwMQIAEgBTcDCCABIAU3AwAgAUEgaiEBIAJB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qA5BiJYIKwMAQZj5DCsDAKI5AwBBgKoOQbCXCCsDAEHA+gwrAwCiOQMAQdCoDkGAlggrAwBBkPkMKwMAojkDAEH4qQ5BqJcIKwMAQbj6DCsDAKI5AwBByKgOQfiVCCsDAEGI+QwrAwCiOQMAQfCpDkGglwgrAwBBsPoMKwMAojkDAEGgrA5BsJwIKwMAQZD6DCsDAKI5AwBByK0OQdidCCsDAEG4+wwrAwCiOQMAQZisDkGonAgrAwBBiPoMKwMAojkDAEHArQ5B0J0IKwMAQbD7DCsDAKI5AwBBkKwOQaCcCCsDAEGA+gwrAwCiOQMAQbitDkHInQgrAwBBqPsMKwMAojkDAEGIrA5BmJwIKwMAQfj5DCsDAKI5AwBBsK0OQcCdCCsDAEGg+wwrAwCiOQMAQYCsDkGQnAgrAwBB8PkMKwMAojkDAEGorQ5BuJ0IKwMAQZj7DCsDAKI5AwBB+KsOQYicCCsDAEHo+QwrAwCiOQMAQaCtDkGwnQgrAwBBkPsMKwMAojkDAEEAIQ5B8KsOQYCcCCsDAEHg+QwrAwCiOQMAQeirDkH4mwgrAwBB2PkMKwMAojkDAEHgqw5B8JsIKwMAQdD5DCsDAKI5AwBBmK0OQaidCCsDAEGI+wwrAwCiOQMAQZCtDkGgnQgrAwBBgPsMKwMAojkDAEGIrQ5BmJ0IKwMAQfj6DCsDAKI5AwBB2KsOQeibCCsDAEHI+QwrAwCiOQMAQYCtDkGQnQgrAwBB8PoMKwMAojkDAEHQqw5B4JsIKwMAQcD5DCsDAKI5AwBB+KwOQYidCCsDAEHo+gwrAwCiOQMAQcirDkHYmwgrAwBBuPkMKwMAojkDAEHwrA5BgJ0IKwMAQeD6DCsDAKI5AwBBwKsOQdCbCCsDAEGw+QwrAwCiOQMAQeisDkH4nAgrAwBB2PoMKwMAojkDAEG4qw5ByJsIKwMAQaj5DCsDAKI5AwBB4KwOQfCcCCsDAEHQ+gwrAwCiOQMAQbCrDkHAmwgrAwBBoPkMKwMAojkDAEHYrA5B6JwIKwMAQcj6DCsDAKI5AwBBqKsOQbibCCsDAEGY+QwrAwCiOQMAQdCsDkHgnAgrAwBBwPoMKwMAojkDAEGgqw5BsJsIKwMAQZD5DCsDAKI5AwBByKwOQdicCCsDAEG4+gwrAwCiOQMAQZirDkGomwgrAwBBiPkMKwMA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PzcDAEHI7gVCgICAgICIivLAADcDAEHA7gVCgICAgIDXp4HBADcDAEG47gVCgICAgIDNlo3BADcDAEGw7gVCgICAgMCZxpjBADcDAEGo7gVCgICAgODDsqHBADcDAEGg7gVCgICAgOCA8KjBADcDAEGY7gVCgICAgPiGu63BADcDAEGQ7gVCgICAgMC5prHBADcDAEGI7gVCgICAgJD0q7TBADcDAEGA7gVCgICAgMiK5rfBADcDAEH47QVCgICAgOTe5LnBADcDAEHw7QVCgICAgNie5LvBADcDAEHo7QVCgICAgLCx6r3BADcDAEHg7QVCgICAgIaGj8DBADcDAEHY7QVCgICAgLbDmcLBADcDAEHQ7QVCgICAgMr/jcbBADcDAEHI7QVCgICAgPSoxcnBADcDAEHA7QVCgICAgPKG+srBADcDAEGQ8AVCgICAgICAgPg/NwMAQejuBUKAgICAgICA+D83AwBB4O4FQoCAgICAgIrAwAA3AwBB2O4FQoCAgICAgPbRwAA3AwBB0O4FQoCAgICAwPTiwAA3AwBBuPAFQoCAgIDAy/KvwQA3AwBBsPAFQoCAgID4jaqxwQA3AwBBqPAFQoCAgICI6NqywQA3AwBBoPAFQoCAgICAgID4PzcDAEGY8AVCgICAgICAgPg/NwMAQYjwBUKAgICAgIDgsMAANwMAQYDwBUKAgICAgIDgwsAANwMAQfjvBUKAgICAgIDo08AANwMAQfDvBUKAgICAgOD04sAANwMAQejvBUKAgICAgKCK8sAANwMAQeDvBUKAgICAgIyi/sAANwMAQdjvBUKAgICAwNigicEANwMAQdDvBUKAgICAoP6VksEANwMAQcjvBUKAgICAgPvNmcEANwMAQcDvBUKAgICAoMfJnsEANwMAQbjvBUKAgICAgPSIosEANwMAQbDvBUKAgICA4MmupcEANwMAQajvBUKAgICA+NPGqMEANwMAQaDvBUKAgICAwKzMqsEANwMAQZjvBUKAgICAoP3grMEANwMAQZDvBUKAgICA+Ob8rsEANwMAQYjvBUKAgICAwP3ksMEANwMAQYDvBUKAgICAoLqLssEANwMAQfjuBUKAgICA4Iaus8EANwMAQfDuBUKAgICAgICA+D83AwBBuPEFQoCAgICAgID4PzcDAEGo8gVCgICAgICA3PfAADcDAEGg8gVCgICAgIDM0YDBADcDAEGY8gVCgICAgIC3lIjBADcDAEGQ8gVCgICAgICUsIzBADcDAEGI8gVCgICAgKC+xpDBADcDAEGA8gVCgICAgODGrJPBADcDAEH48QVCgICAgMCJw5bBADcDAEHw8QVCgICAgIDh/5jBADcDAEHo8QVCgICAgMDU6prBADcDAEHg8QVCgICAgMDW25zBADcDAEHY8QVCgICAgODJ9p7BADcDAEHQ8QVCgICAgICAgPg/NwMAQcjxBUKAgICAgICA+D83AwBBwPEFQoCAgICAgID4PzcDAEGw8QVCgICAgICAqLHAADcDAEGo8QVCgICAgICAtMPAADcDAEGg8QVCgICAgICAxdTAADcDAEGY8QVCgICAgIDQyuPAADcDAEGQ8QVCgICAgIDE2fLAADcDAEGI8QVCgICAgICokv/AADcDAEGA8QVCgICAgIC/6YnBADcDAEH48AVCgICAgOD+5ZLBADcDAEHw8AVCgICAgODEmZrBADcDAEHo8AVCgICAgICZvJ/BADcDAEHg8AVCgICAgMCN2KLBADcDAEHY8AVCgICAgODYl6bBADcDAEHQ8AVCgICAgPj1ianBADcDAEHI8AVCgICAgPjYn6vBADcDAEHA8AVCgICAgKipxa3BADcDAEGI9AVCgICAgICAgPg/NwMAQYD0BUKAgICAgIDIvcAANwMAQfjzBUKAgICAgMCr0MAANwMAQfDzBUKAgICAgKCV4cAANwMAQejzBUKAgICAgOy78MAANwMAQeDzBUKAgICAgLTS/8AANwMAQdjzBUKAgICAgIKJi8EANwMAQdDzBUKAgICAoM2ulsEANwMAQcjzBUKAgICAoNHkn8EANwMAQcDzBUKAgICAwOz0psEANwMAQbjzBUKAgICA6NGnq8EANwMAQbDzBUKAgICAwKrQr8EANwMAQajzBUKAgICA2LCvssEANwMAQaDzBUKAgICA2O6itcEANwMAQZjzBUKAgICAqMCcuMEANwMAQZDzBUKAgICA8JTzucEANwMAQYjzBUKAgICAwLPPu8EANwMAQYDzBUKAgICA9PbRvcEANwMAQfjyBUKAgICAnIDtwMEANwMAQfDyBUKAgICAluqBxcEANwMAQejyBUKAgICAj93SycEANwMAQeDyBUKAgICAmrmJy8EANwMAQdjyBUKAgICAgICAn8AANwMAQdDyBUKAgICAgICQscAANwMAQcjyBUKAgICAgICEwsAANwMAQcDyBUKAgICAgICi0cAANwMAQbjyBUKAgICAgNDH4MAANwMAQbDyBUKAgICAgNiO7MAANwMAQZj0BUKAgICAiP+euMEANwMAQZD0BUKAgICAgICA+D83AwBBsPUFQoCAgICAgID4PzcDAEGI9gVCgICAgMCy/aDBADcDAEGA9gVCgICAgMCctKTBADcDAEH49QVCgICAgND0najBADcDAEHw9QVCgICAgNjuxKrBADcDAEHo9QVCgICAgICqh63BADcDAEHg9QVCgICAgMiZ3K/BADcDAEHY9QVCgICAgPT7nLHBADcDAEHQ9QVCgICAgMCd6rLBADcDAEHI9QVCgICAgKivt7TBADcDAEHA9QVCgICAgICAgPg/NwMAQbj1BUKAgICAgICA+D83AwBBqPUFQoCAgICAgNi0wAA3AwBBoPUFQoCAgICAgMzHwAA3AwBBmPUFQoCAgICAoMnYwAA3AwBBkPUFQoCAgICA8OrnwAA3AwBBiPUFQoCAgICApND2wAA3AwBBgPUFQoCAgICA+KyCwQA3AwBB+PQFQoCAgICAkLeNwQA3AwBB8PQFQoCAgICgquGWwQA3AwBB6PQFQoCAgICA5/idwQA3AwBB4PQFQoCAgIDwyMmiwQA3AwBB2PQFQoCAgICArc6mwQA3AwBB0PQFQoCAgIDgj9mpwQA3AwBByPQFQoCAgICwvLSswQA3AwBBwPQFQoCAgIDwm7CvwQA3AwBBuPQFQoCAgIDw6KCxwQA3AwBBsPQFQoCAgIDQ3+6ywQA3AwBBqPQFQoCAgICgvOC0wQA3AwBBoPQFQoCAgIDYh9K2wQA3AwBB2PYFQoCAgICAgID4PzcDAEH49wVCgICAgICAwKDAADcDAEHw9wVCgICAgICA0LLAADcDAEHo9wVCgICAgICA0sPAADcDAEHg9wVCgICAgIDA4NLAADcDAEHY9wVCgICAgIDw9+HAADcDAEHQ9wVCgICAgICQiO7AADcDAEHI9wVCgICAgIDsj/nAADcDAEHA9wVCgICAgIC9g4LBADcDAEG49wVCgICAgIC8vInBADcDAEGw9wVCgICAgMCEr47BADcDAEGo9wVCgICAgIDK9pHBADcDAEGg9wVCgICAgOCglpXBADcDAEGY9wVCgICAgOCLt5jBADcDAEGQ9wVCgICAgOCHuZrBADcDAEGI9wVCgICAgODgyZzBADcDAEGA9wVCgICAgMDG4Z7BADcDAEH49gVCgICAgID+1KDBADcDAEHw9gVCgICAgICAgPg/NwMAQej2BUKAgICAgICA+D83AwBB4PYFQoCAgICAgID4PzcDAEHQ9gVCgICAgICA4LLAADcDAEHI9gVCgICAgICAoMXAADcDAEHA9gVCgICAgICAx9bAADcDAEG49gVCgICAgICQueXAADcDAEGw9gVCgICAgIDwtfTAADcDAEGo9gVCgICAgICL5YDBADcDAEGg9gVCgICAgIDos4vBADcDAEGY9gVCgICAgOCrxJTBADcDAEGQ9gVCgICAgIDL65vBADcDAEGI+AVC5syZs+bMmfM/NwMAQYD4BULJpJLJpJLJ/D83AwBByPgFQrPmzJmz5szxPzcDAEHA+AVCs+bMmbPmzOk/NwMAQbj4BUKAgICAgICA9D83AwBBsPgFQs2Zs+bMmbP6PzcDAEHQ+AVC5syZs+bMmfc/NwMAQYj6BUKAgIDAgYv22MEANwMAQaj7BUKAgICAgPK2gMEANwMAQaD7BUKAgICAgLekmMEANwMAQZj7BUKAgICAuNLaqcEANwMAQZD7BUKAgICA0MbltcEANwMAQYj7BUKAgICAwKzGvMEANwMAQYD7BUKAgICA4oSbw8EANwMAQfj6BUKAgICAyrHWx8EANwMAQfD6BUKAgICA643PycEANwMAQej6BUKAgICArum/y8EANwMAQeD6BUKAgICA/ozHzMEANwMAQdj6BUKAgICAwNjxz8EANwMAQdD6BUKAgICA7Jr30cEANwMAQcj6BUKAgICAqaSG08EANwMAQcD6BUKAgICAj4HX1MEANwMAQbj6BUKAgICA8s2D1sEANwMAQbD6BUKAgICAwdjm1sEANwMAQaj6BUKAgICAz5SJ18EANwMAQaD6BUKAgICA6Yit2MEANwMAQZj6BUKAgIDAr6WE2cEANwMAQZD6BUKAgIDAtrLx2MEANwMAQej4BUKAgICAmca62cEANwMAQeD4BUKAgICA+67F2cEANwMAQYD6BUKAgICAgLCJ78AANwMAQfj5BUKAgICAgJWXicEANwMAQfD5BUKAgICA4JyhnsEANwMAQej5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ADcDAEHoiwZCgICAgICA+M/AADcDAEHgiwZCgICAgICAz8zAADcDAEGwigZCgICAgICAwsrAADcDAEHQiwZCgICAgIDAkNHAADcDAEHIiwZCgICAgIDAkNHAADcDAEHAiwZCgICAgIDAkNHAADcDAEG4iwZCgICAgIDAkNHAADcDAEGwiwZCgICAgIDAkNHAADcDAEGoiwZCgICAgIDAkNHAADcDAEGgiwZCgICAgIDAkNHAADcDAEGYiwZCgICAgIDAkNHAADcDAEGQiwZCgICAgIDA+tHAADcDAEGIiwZCgICAgIDA+tHAADcDAEGAiwZCgICAgIDA+tHAADcDAEH4igZCgICAgIDA+tHAADcDAEHwigZCgICAgICA5dLAADcDAEHoigZCgICAgICA5dLAADcDAEHgigZCgICAgICA5dLAADcDAEHYigZCgICAgICA5dLAADcDAEHQigZCgICAgICAz9PAADcDAEHIigZCgICAgICAutPAADcDAEHAigZCgICAgICA5tDAADcDAEG4igZCgICAgICApM3AADcDAEGAjQZCgICAgICAgPg/NwMAQYiNBkKAgICAgICA+D83AwBBkI0GQoCAgICAgID4PzcDAEGYjQZCmrPmzJmz5vQ/NwMAQaCNBkIANwMAQaiNBkKAgICAgICA+j83AwBBsI0GQoCAgICAgICKwAA3AwBBuI0GQvCW7Mj+w5/gPTcDAEHAjQZCnrPBkMqpst89NwMAQciNBkKAgICAgICA+D83AwBB2I0GQoCAgICAgID4PzcDAEHQjQZCgICAgICAgPg/NwMAQeCNBkKAgICAgICA+D83AwBB6I0GQoCAgICAgMzYwAA3AwBB8I0GQoCAgICAgMzYwAA3AwBB+I0GQoCAgICAgMzYwAA3AwBBgI4GQoCAgICAgMzYwAA3AwBBiI4GQrnoorbn96e9v383AwBBkI4GQoG68tH7uPSEPzcDAEGYjgZCjM7V+YXq56s+NwMAQaCOBkKAgICAgICAksAANwMAQaiOBkKAgICAgIDApMAANwMAQbCOBkKz9amv0MuyuT43AwBBuI4GQoCAgICAgID8PzcDAEHAjgZCgICAgICAwKTAADcDAEHIjgZCgICAgICAgPg/NwMAQdCOBkKAgICAgICA+j83AwBB2I4GQoCAgICAgICKwAA3AwBB4I4G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wQA3AwBB2OQGQoCAgICAgID4PzcDAEH45QZCgICAgICAgJDAADcDAEHw5QZCgICAgICAoKLAADcDAEHo5QZCgICAgICAmLPAADcDAEHg5QZCgICAgICAqsLAADcDAEHY5QZCgICAgIDAxdHAADcDAEHQ5QZCgICAgICAwd3AADcDAEHI5QZCgICAgIDg4ejAADcDAEHA5QZCgICAgIDs0PHAADcDAEG45QZCgICAgIDQjPnAADcDAEGw5QZCgICAgIC85v3AADcDAEGo5QZCgICAgIC5xIHBADcDAEGg5QZCgICAgIDd04TBADcDAEGY5QZCgICAgIDCjIjBADcDAEGQ5QZCgICAgMCnhIrBADcDAEGI5QZCgICAgMCfiozBADcDAEGA5QZCgICAgICAl47BADcDAEH45AZCgICAgMCdqZDBADcDAEHw5AZCgICAgICAgPg/NwMAQejkBkKAgICAgICA+D83AwBB4OQGQoCAgICAgID4PzcDAEHQ5AZCgICAgICAoKLAADcDAEHI5AZCgICAgICA4LTAADcDAEHA5AZCgICAgICA/sXAADcDAEGo5gZCgICAgLDL+qzBADcDAEGg5gZCgICAgODumq/BADcDAEGY5gZCgICAgNCz77HBADcDAEGQ5gZCgICAgNDFwbbBADcDAEGI5gZCgICAgLDq4LrBADcDAEGA5gZCgICAgIjKrLzBADcDAEGo5wZCgICAgICAgPg/NwMAQaDnBkKAgICAgICQr8AANwMAQZjnBkKAgICAgICmwcAANwMAQZDnBkKAgICAgMCc0sAANwMAQYjnBkKAgICAgNC44cAANwMAQYDnBkKAgICAgLjc8MAANwMAQfjmBkKAgICAgIys/MAANwMAQfDmBkKAgICAgI2BiMEANwMAQejmBkKAgICAgMzmkMEANwMAQeDmBkKAgICAoKKomMEANwMAQdjmBkKAgICA4J/OnMEANwMAQdDmBkKAgICAgKPboMEANwMAQcjmBkKAgICA4JLIo8EANwMAQcDmBkKAgICAoLHmpsEANwMAQbjmBkKAgICAgNGVqcEANwMAQbDmBkKAgICA4P+Eq8EANwMAQZjoBkKAgICAgP78/sAANwMAQZDoBkKAgICAwLGdiMEANwMAQYjoBkKAgICAwJzGj8EANwMAQYDoBkKAgICAgK3lk8EANwMAQfjnBkKAgICA4OaSmMEANwMAQfDnBkKAgICAwPvnmsEANwMAQejnBkKAgICAgKXrncEANwMAQeDnBkKAgICAkK/JoMEANwMAQdjnBkKAgICAoJeposEANwMAQdDnBkKAgICA4OeOpMEANwMAQcjnBkKAgICA0K2cpsEANwMAQcDnBkKAgICAuO+UqMEANwMAQbjnBkKAgICA+LSYqcEANwMAQbDnBkKAgICAgICA+D83AwBB+OkGQoCAgICAgID4PzcDAEHQ6AZCgICAgICAgPg/NwMAQYjqBkKAgICAgICA+D83AwBBgOoGQoCAgICAgID4PzcDAEHw6QZCgICAgICAgKTAADcDAEHo6QZCgICAgICA4LbAADcDAEHg6QZCgICAgICAj8jAADcDAEHY6QZCgICAgICA/9bAADcDAEHQ6QZCgICAgIDw7OXAADcDAEHI6QZCgICAgIDI5vHAADcDAEHA6QZCgICAgIDo2/zAADcDAEG46QZCgICAgID+/IXBADcDAEGw6QZCgICAgICCmo3BADcDAEGo6QZCgICAgIDXgZLBADcDAEGg6QZCgICAgMCB65XBADcDAEGY6QZCgICAgKCal5nBADcDAEGQ6QZCgICAgICN4JvBADcDAEGI6QZCgICAgKDXx57BADcDAEGA6QZCgICAgPDx4aDBADcDAEH46AZCgICAgKDxpKLBADcDAEHw6AZCgICAgODiiaTBADcDAEHo6AZCgICAgODC7qXBADcDAEHg6AZCgICAgICAgPg/NwMAQdjoBkKAgICAgICA+D83AwBByOgGQoCAgICAgKCmwAA3AwBBwOgGQoCAgICAgNi4wAA3AwBBuOgGQoCAgICAgMfJwAA3AwBBsOgGQoCAgICAgOrYwAA3AwBBqOgGQoCAgICA8JPowAA3AwBBoOgGQoCAgICAtMXzwAA3AwBBoOsGQoCAgICgmPuUwQA3AwBBmOsGQoCAgICAgICSwAA3AwBBkOsGQoCAgICAgOCjwAA3AwBBiOsGQoCAgICAgIC1wAA3AwBBgOsGQoCAgICAgIDEwAA3AwBB+OoGQoCAgICAwIrTwAA3AwBB8OoGQoCAgICAoNffwAA3AwBB6OoGQoCAgICAoJbqwAA3AwBB4OoGQoCAgICAmJfzwAA3AwBB2OoGQoCAgICAgsj6wAA3AwBB0OoGQoCAgICArIGAwQA3AwBByOoGQoCAgICA6IiDwQA3AwBBwOoGQoCAgICAqtiGwQA3AwBBuOoGQoCAgIDApLOJwQA3AwBBsOoGQoCAgICA+dKLwQA3AwBBqOoGQoCAgIDAg4OOwQA3AwBBoOoGQoCAgICgwZ2QwQA3AwBBmOoGQoCAgICAz9SRwQA3AwBBkOoGQoCAgICAgID4PzcDAEGo6wZC/NPGl93JmKg/NwMAQbDrBkKAgICAgICAhMAANwMAQbjrBkL7qLi9lNye2j83AwBBwOsGQoCAgICAgICKwAA3AwBByOsGQoCAgICAgICKwAA3AwBB0OsGQoCAgICAgICKwAA3AwBB2OsGQoCAgICAgICKwAA3AwBB4OsGQoCAgICAgICKwAA3AwBBmOwGQgA3AwBBkOwGQgA3AwBBiOwGQgA3AwBBoOwGQgA3AwBBmO0GQoCAgICAgID8PzcDAEGg7QZCz+/Pmt70pvo/NwMAQdjuBkL3z7Ca57CP2T83AwBBuOwGQgA3AwBBsOwGQgA3AwBBqOwGQgA3AwBB+O8GQr2U3J6KvvTTwAA3AwBB8O8GQpqz5syZs5XowAA3AwBB6O8GQpqz5syZg5nkwAA3AwBB4O8GQri9lNyeurzbwAA3AwBB2O8GQs2Zs+bMyaDqwAA3AwBB0O8GQpTcnoqut6bhwAA3AwBByO8GQri9lNyeoufYwAA3AwBBwO8GQtfHwuuj0d3TwAA3AwBBuO8GQp+Kro+F16DQwAA3AwBBsO8GQqTh9dHwitvQwAA3AwBBqO8GQpTcnoqu77zQwAA3AwBBoO8GQsjC66PhtfbJwAA3AwBBmO8GQsjC66Ph9dbJwAA3AwBBkO8GQo+F18fC64bLwAA3AwBBiO8GQvzTxpfdiafGwAA3AwBBgO8GQp20kdvzu+LDwAA3AwBB+O4GQt70puKgwI3FwAA3AwBB8O4GQuiituf3p8zGwAA3AwBB6O4GQuKg4MrD9r7DwAA3AwBB4O4GQtrI7fn9iYzFwAA3AwBBwO0GQtactJHbk6HGwAA3AwBBuO0GQomDgauOmre+wAA3AwBBsO0GQt+bgvPD1rrXPzcDAEHQ7gZC4fXR8PqQ9ODAADcDAEHI7gZCgICAgIDg8+TAADcDAEHA7gZC0vD6qLjV893AADcDAEG47gZCgICAgICQ5tTAADcDAEGw7gZC5syZs+a8v+XAADcDAEGo7gZC+dKbiYPhvMbAADcDAEGg7gZCpOH10fC69s7AADcDAEGY7gZCvZTcnoru4M/AADcDAEGQ7gZCgICAgICQ+dXAADcDAEGI7gZC5syZs+asuNfAADcDAEGA7gZCro+F18eyn9PAADcDAEH47QZC18fC66PxntHAADcDAEHw7QZCiq6PhdeHnMvAADcDAEHo7QZC9tHw+qiY8MvAADcDAEHg7QZCro+F18fCl87AADcDAEHY7QZCyMLro+G1iczAADcDAEHQ7QZC0vD6qLj9xcvAADcDAEHI7QZChdfHwuujy8rAADcDAEGA8AZCADcDAEHY8AZC1Krrncybqds/NwMAQdDwBkKi/4nc2KLN+D83AwBByPAGQs3J7+zmjZOKwAA3AwBBwPAGQv+a2cb6kJKKwAA3AwBBuPAGQp/c5PHO0sP8PzcDAEGw8AZC0Jre9KbiwPk/NwMAQajwBkLiiMLHtpzi7D83AwBBuPEGQt/2mcuE0Ob1PzcDAEHA8QZCzZmz5syZs/4/NwMAQYDyBkKAgICAgICAgMAANwMAQYjyBkKz5syZs+bM+z83AwBBmPIGQv+mqIiBjoL6PzcDAEGQ8gZC7vn9qePL7vA/NwMAQaDyBkKAgICAgICAgMAANwMAQbD0BkIANwMAQcjyBkEAQdAAEBEaQYD0BkIANwMAQfjzBkIANwMAQfDzBkIANwMAQYD1BkLjy+6kjISs6T83AwBBiPUGQoCAgICAgIDwPzcDAEGQ9QZCzZmz5syZs5DAADcDAEGY9QZCgICAgICAsLnAADcDAEGg9QZCgICAgICAsLnAADcDAEGo9QZCgICAgICAlMrAADcDAEGw9QZCgICAgICAiM7AADcDAEG49QZC7KPh9dHwmqjAADcDAEHA9QZCqbi9lNyesp7AADcDAEHI9QZC7KPh9dHwmqjAADcDAEGY9wZCu76/6vjSm/U/NwMAQZD3BkLP78+a3vSm9j83AwBBiPcGQoyErLnoorb3PzcDAEGA9wZC0Jre9KbioPg/NwMAQfj2BkK0kdvz+9PG+D83AwBBuPYGQomDgauO2sjlPzcDAEGw9gZCpOH10fD6qOg/NwMAQaj2BkLV8aW3koaC6j83AwBBoPYGQq6PhdfHwuvrPzcDAEGY9gZChdfHwuuj4e0/NwMAQZD2BkKGgtactJHb7z83AwBBiPYGQsPro+H10fDwPzcDAEGA9gZC18fC66Ph9fE/NwMAQfj1BkLBlYet5Pb88j83AwBB8PUGQqrjy+6kjIT0PzcDAEHo9QZCvZTcnoquj/U/NwMAQeD1BkKmt5KGgtac9j83AwBB2PUGQrnoorbn96f3PzcDAEHQ9QZCrLnoorbn9/c/NwMAQZj4BkKk4fXR8Pqo2D83AwBBkPgGQqTh9dHw+qjYPzcDAEGI+AZCpOH10fD6qNg/NwMAQYD4BkK6k7GQsOWh2z83AwBB+PcGQpCw5aGL2Z3fPzcDAEHw9wZC/9TxpbeShuI/NwMAQej3BkLCwJWHreT25D83AwBB4PcGQv6p48vupIzoPzcDAEHY9wZCreT2/P7U8ek/NwMAQdD3BkLayO35/anj6z83AwBByPcGQtvz+9PGl93tPzcDAEHA9wZC2sjt+f2p4+8/NwMAQbj3BkLCwJWHreT28D83AwBBsPcGQquO2sjt+f3xPzcDAEGo9wZC6c3EwcCVh/M/NwMAQaD3BkKoja+6k7GQ9D83AwBB8PYGQpmI2PLQxezWPzcDAEHo9gZCmYjY8tDF7NY/NwMAQeD2BkKZiNjy0MXs1j83AwBB2PYGQovZnd+ftbzZPzcDAEHQ9gZC8qW3koaC1tw/NwMAQcj2BkL4p42vupOx4D83AwBBwPYGQu+kjISsuejiPzcDAEHI+QZC9uTH8p3Yqoe/fzcDAEHo+gZCiM+lkKPAyvK/fzcDAEHg+gZCm6WynZy6leO/fzcDAEHY+gZCja+6k7GQsOG/fzcDAEHQ+gZC6YbR5fDkx9i/fzcDAEHI+gZCyZ/ir7GNrsQ/NwMAQcD6BkKR8bPf7tDjvD83AwBBuPoGQvGorKyajfO1PzcDAEGw+gZCyozrivGN37A/NwMAQaj6BkLik+iina31qj83AwBBoPoGQu2Q97fhtvKqPzcDAEGY+gZCop7ugdCH2qg/NwMAQZD6BkKY8p7wgY30oT83AwBBiPoGQt2dt9uapO+ePzcDAEGA+gZC3JXbmdb7uZI/NwMAQfj5BkKprLjJxaj9g79/NwMAQfD5BkLjs5PbnaH+k79/NwMAQej5BkK119nf3KOumb9/NwMAQeD5BkLQxLKQ78D2mr9/NwMAQdj5BkKswJj72Onemr9/NwMAQdD5BkL11ezd4q//o79/NwMAQaj4BkLf9OK686WZlL9/NwMAQaD4BkK27Lqd0LW4nz83AwBBwPkGQvX44p2Ur/XIv383AwBBuPkGQoCJzcCirMTlv383AwBBsPkGQva/nbfamc7qv383AwBBqPkGQpXekfOR/+Div383AwBBoPkGQpeT1LvU1s/Jv383AwBBmPkGQr3014iyxavQv383AwBBkPkGQu2wuZXx8PHEv383AwBBiPkGQsaoqMPr0eS5v383AwBBgPkGQrSe68GH7Lepv383AwBB+PgGQvOuw679raKoPzcDAEHw+AZCrf3b/82Yz6Y/NwMAQej4BkLkrOOC+56XoT83AwBB4PgGQvLK4fKNt86hPzcDAEHY+AZCw5DVtZCe654/NwMAQdD4BkLb8a2L3+Gqmz83AwBByPgGQoXh4uOb64aaPzcDAEHA+AZCg9nt1I2ggps/NwMAQbj4BkKGhIPJ96/bkD83AwBBsPgGQo2jldHGzYmKv383AwBB8PoGQpqz5syZs+bUPzcDAEH4+gZCmrPmzJmz5tw/NwMAQYD7BkKAgICAgICA+D83AwBBiPsGQoCAgICAgMCswAA3AwBBkPsGQoCAgICAgID4PzcDAEGY+wZCgICAgICAgPg/NwMAQaD7BkKAgICAgICA+D83AwBBqPsGQoCAgICAgID4PzcDAEGw+wZCgICAgICAgPg/NwMAQbj7BkKAgICAgICA+D83AwBBwPsGQoCAgICAgID4PzcDAEHQ+wZCgICAgICAgOg/NwMAQcj7BkKAgICAgICA+D83AwBB2PsGQoCAgICAgID4PzcDAEHg+wZCgICAgICAgPA/NwMAQej7BkKAgICAgICA+D83AwBB8PsGQvaGtqDfvojqPjcDAEH4+wZCgICAgICAgPg/NwMAQYD8BkKAgICA0Kzz5sEANwMAQYj8BkL7qLi9lNyeuj83AwBBkPwGQvuouL2U3J66PzcDAEGY/AZCADcDAEGg/AZCgICAgICAgIrAADcDAEGo/AZCgICAgICA0M/AADcDAEGw/AZCADcDAEG4/AZCmrPmzJmz5uw/NwMAQcD8BkKAgICAgICA8D83AwBByPwGQoCAgICAgIDwPzcDAEHQ/AZCs+bMmbPmzOE/NwMAQdj8BkL7qLi9lNyeyj83AwBB4PwGQvzTxpfdyZjAPzcDAEHo/AZC+6i4vZTcnso/NwMAQfD8BkKas+bMmbPm3D83AwBB+PwGQri9lNyeiq7XPzcDAEGA/QZC+6i4vZTcnsI/NwMAQYj9BkKKro+F18fC4z83AwBBkP0GQvuouL2U3J7CPzcDAEGY/QZC05uJg4GrjvE/NwMAQaD9BkLZnd+ftbzpzT83AwBBqP0GQoXXx8Lro+GOwAA3AwBBsP0GQubMmbPmzJnzPzcDAEHY/QZCgICAgICAgIrAADcDAEHQ/QZCgICAgICAwKTAADcDAEHI/QZCgICAgICAwJzAADcDAEHA/QZCgICAgICAgJfAADcDAEG4/QZCADcDAEHg/QZCgICAgIDAltjAADcDAEGQ/wZCADcDAEHggQdCADcDAEGQgwdCgICAgICAgPg/NwMAQZiDB0L2hrag376I6j43AwBBoIMHQoCAgIDQrPPewQA3AwBBqIMHQoCAgICAgID4PzcDAEGwgwdCgICAgICAgPg/NwMAQbiDB0IANwMAQcCDB0KAgICA0Kzz5sEANwMAQciDB0K/6vjSm4mD8z83AwBB0IMHQoCAgICAgICEwAA3AwBBuIAHQgA3AwBBiIMHQgA3AwBB2IMHQgA3AwBB4IMHQgA3AwBB6IMHQo+F18fC66PpPzcDAEHwgwdCgICAgICAgJ/AADcDAEH4gwdCgICAgICAgIDAADcDAEGAhAdC3J6Kro+F1/c/NwMAQYiEB0Kas+bMmbPm3D83AwBBkIQHQoCAgICAgID4PzcDAEGYhAdCgICAgICAgPg/NwMAQeCFB0Kz5syZs4bbzsAANwMAQdiFB0LmzJmz5oy4zcAANwMAQdCFB0Lcnoquj6WyzMAANwMAQciFB0LgysOWspurx8AANwMAQYCFB0K9lNyeis6sz8AANwMAQfiEB0K9lNyeit6o0cAANwMAQfCEB0K9lNyeit6o0cAANwMAQeiEB0K9lNyeit6o0cAANwMAQeCEB0K9lNyeit6o0cAANwMAQdiEB0K9lNyeit6o0cAANwMAQdCEB0K9lNyeit6o0cAANwMAQciEB0L20fD6qOi90cAANwMAQcCEB0L20fD6qOi90cAANwMAQbiEB0LIwuuj4fXD0cAANwMAQbCEB0LD66Ph9fGAz8AANwMAQaiEB0K9lNyeio6rzcAANwMAQaCEB0K9lNyeis6fyMAANwMAQeiGB0L20fD6qNiHzcAANwMAQeCGB0L20fD6qNiHzcAANwMAQdiGB0L20fD6qNiHzcAANwMAQdCGB0L20fD6qNiHzcAANwMAQciGB0L20fD6qNiHzcAANwMAQcCGB0L20fD6qNiHzcAANwMAQbiGB0L20fD6qNiHzcAANwMAQbCGB0L20fD6qNiHzcAANwMAQaiGB0L20fD6qNiHzcAANwMAQaCGB0Lx+qi4vZTlzsAANwMAQZiGB0Lx+qi4vZTlzsAANwMAQZCGB0Lx+qi4vZTlzsAANwMAQYiGB0Lx+qi4vZTlzsAANwMAQYCGB0Lx+qi4vZTlzsAANwMAQfiFB0Lx+qi4vZTlzsAANwMAQfCFB0Lx+qi4vbSYzsAANwMAQeiFB0Lx+qi4vbSYzsAANwMAQcCFB0K9lNyeis6sz8AANwMAQbiFB0K9lNyeis6sz8AANwMAQbCFB0K9lNyeis6sz8AANwMAQaiFB0K9lNyeis6sz8AANwMAQaCFB0K9lNyeis6sz8AANwMAQZiFB0K9lNyeis6sz8AANwMAQZCFB0K9lNyeis6sz8AANwMAQYiFB0K9lNyeis6sz8AANwMAQfCGB0Kas+bMmbPm3D83AwBB+IYHQgA3AwBBgIcHQoCAgICAgMCswAA3AwBBiIcHQoCAgICAgID4PzcDAEGQhwdChdfHwuujgZTAADcDAEGYhwdCiq6PhdfHgpjAADcDAEGghwdCi9md35+1gKPAADcDAEGohwdC3d/YtLHVk8E+NwMAQbCHB0KF18fC66Ph9T83AwBB+IcHQtfHwuuj4fXhPzcDAEHwhwdC18fC66Ph9eE/NwMAQeiHB0KXsru+v+r48D83AwBB4IcHQvPQxezO78/aPzcDAEHAhwdCquPL7qSMhNQ/NwMAQYCIB0Kq48vupIyE1D83AwBBwIgHQs2Zs+bMmbPuPzcDAEHIiAdCgICAgIDAg9DAADcDAEHQiAdCzZmz5syZs/Y/NwMAQdiIB0KAgICAgIDQz8AANwMAQeCIB0Kas+bMmbPmzD83AwBB6IgHQpWYqtLOgM24PzcDAEHwiAdCueiituf3p8U/NwMAQYCJB0Kas+bMmbPm5D83AwBB+IgHQoCAgICA8ISOwQA3AwBBiIkHQvXz6tbYv9+gwAA3AwBBkIkHQoCAgICAgMS4wAA3AwBBmIkHQoCAgICAgMCUwAA3AwBBoIkHQoCAgICAgMCkwAA3AwBBqIkHQoCAgICA2J6YwQA3AwBBsIkHQoCAgICAgOKRwQA3AwBBuIkHQoCAgICA5eGUwQA3AwBBwIkHQoCAgICAgICSwAA3AwBByIkHQoquj4XXx8KCwAA3AwBB0IkHQoquj4XXx8KCwAA3AwBB2IkHQoCAgICAgID4PzcDAEHgiQdC+6i4vZTcntI/NwMAQeiJB0KAgICAgICAisAANwMAQfCJB0KAgICAgICAgMAANwMAQfiJB0L6/anjy+6ktD83AwBBgIoHQvuouL2U3J7CPzcDAEGIigdC+6i4vZTcnso/NwMAQZCKB0KAgICAgICAjMAANwMAQZiLB0K56KK25/en1T83AwBBkIsHQufgypan24y6PzcDAEGIiwdCu76/6vjSm7k/NwMAQYCLB0KlqaPswLqMwD83AwBB+IoHQqm4vZTcnorWPzcDAEHwigdCw+uj4fXR8No/NwMAQeiKB0L7qLi9lNye2j83AwBB4IoHQoquj4XXx8LbPzcDAEGoigdC5NWRu6XLkds/NwMAQaCKB0KJg4GrjtrI3T83AwBB2IoHQru+v+r40pu5PzcDAEHQigdCupOxkLDlocs/NwMAQciKB0LYo62858amzT83AwBBwIoHQraf5Nvc+uPYPzcDAEG4igdCuL2U3J6Krtc/NwMAQbCKB0KKro+F18fC0z83AwBBoIsHQoCAgICAgICMwAA3AwBBqIsHQpqz5syZs+bkPzcDAEGwiwdCgICAgICAgIzAADcDAEHgiwdCgICAgICAgPg/NwMAQdiLB0KAgICAgICA+D83AwBB0IsHQoCAgICAgID4PzcDAEHIiwdCgICAgICAgPg/NwMAQcCLB0IANwMAQfiLB0IANwMAQfCLB0KAgICAgICA+D83AwBBgIwHQgA3AwBBiIwHQgA3AwBBkIwHQgA3AwBBuIwHQgA3AwBBsIwHQgA3AwBBqIwHQgA3AwBBoIwHQgA3AwBBwIwHQoCAgICAgID4PzcDAEHIjAdCgICAgICAgPg/NwMAQdCMB0KAgICAgICA+D83AwBB2IwHQoCAgICAgID4PzcDAEHgjAdCtbzpzcTBwO2/fzcDAEHojAdCzZmz5syZ84nAADcDAEHwjAdCtJHb8/vThoLAADcDAEGAjQdCvZTcnoquj4lANwMAQfiMB0Le9KbioOCqiMAANwMAQYiNB0LBlYet5Pb8gcAANwMAQZCNB0LA4Jz6+Pu28z83AwBBmI0HQv6V5Nyy0Nrkv383AwBBoI0HQoCAgICAgLC2wAA3AwBBqI0HQoCAgIDQrPPewQA3AwBBsI0HQoCAgICAgMCswAA3AwBBuI0HQoCAgICAgICMwAA3AwBBwI0HQoCAgICAgMCkwAA3AwBByI0HQoCAgICAgICiwAA3AwBBiI4HQvuouL2U3J7aPzcDAEGAjgdC+6i4vZTcnuI/NwMAQfiNB0K4vZTcnoqu5z83AwBB8I0HQtLw+qi4vZTkPzcDAEGQjgdCgICA5IncurnCADcDAEGYjgdCgICAgICAgKfAADcDAEHYjgdClNyeiq6Phec/NwMAQdCOB0KJg4GrjtrI5T83AwBByI4HQqWMhKy56KLuPzcDAEHAjgdC9PvTxpfdydg/NwMAQaCOB0L7qLi9lNye0j83AwBB4I4HQvuouL2U3J7SPzcDAEGgjwdCmrPmzJmz5vg/NwMAQbiPB0KAgICAgICAhMAANwMAQbCPB0Kz5syZs+bM+T83AwBByI8HQqznscDs6/v0PzcDAEHAjwdC18fC66Ph9fU/NwMAQdiPB0K4vZTcnoqu1z83AwBB0I8HQri9lNyeiq7PPzcDAEHojwdCr7qTsZCw5ek/NwMAQeCPB0LNmbPmzJmz9j83AwBB8I8HQpK5+Z+kv/vtPzcDAEH4jwdCmrPmzJmz5vQ/NwMAQYCQB0L7qLi9lNye9j83AwBBiJAHQsjC66Ph9dHwPzcDAEGQkAdCs+bMmbPmzPE/NwMAQZiQB0KAgICAgICA+D83AwBBoJAHQu6M7oCfv8iEwAA3AwBBqJAHQoCAgICAgMCswAA3AwBBsJAHQgA3AwBBuJAHQgA3AwBBwJAHQpqz5syZs+bUPzcDAEHYkAdC4f2BnrCAovU/NwMAQdCQB0Lvt/za56zy9D83AwBB6JAHQuH9gZ6wgKL1PzcDAEHgkAdC77f82ues8vQ/NwMAQfCQB0KAgICM+/rKsMIANwMAQfiQB0KAgICAjfGwgMIANwMAQYCRB0Kas+bMmbPm9D83AwBBiJEHQvuouL2U3J72PzcDAEGQkQdCyMLro+H10fA/NwMAQZiRB0Kz5syZs+bM8T83AwBBoJEHQoCAgICAgID4PzcDAEGokQdCgICAgICAgPg/NwMAQbCRB0Kz5syZs+bM6T83AwBBuJEHQoCAgICAgICAwAA3AwBByJEHQgA3AwBBwJEHQgA3AwBB0JEHQoCAgICAgICOwAA3AwBB4JEHQoCAgICAgID8PzcDAEHYkQdCgICAgICHp77BADcDAEHokQdCgICAgICAgPg/NwMAQfCRB0KAgICAgICAicAANwMAQfiRB0KAgICAgICAhMAANwMAQYCSB0KAgICAgICAhMAANwMAQYiSB0KKsLuwxP2E4D83AwBBkJIHQuysrrb0nL/lPzcDAEGYkgdCgICAgICAgPA/NwMAQaCSB0KAgICAgICAksAANwMAQaiSB0Kz5syZs+bM6T83AwBBsJIHQoCAgICAgICSwAA3AwBBuJIHQoCAgICAgMCkwAA3AwBBwJIHQoCAgICAgMCkwAA3AwBByJIHQoCAgICAgMCkwAA3AwBB0JIHQoCAgICAgOTPwAA3AwBB2JIHQoCAgICAgOTPwAA3AwBB4JIHQoCAgICAgOTPwAA3AwBB6JIHQoCAgICAgOTPwAA3AwBB8JIHQoCAgICAgOTPwAA3AwBB+JIHQoCAgICAgOTPwAA3AwBBgJMHQoCAgICAgOTPwAA3AwBBiJMHQoCAgICAgOTPwAA3AwBBgJUHQsatiOTBkszjPzcDAEH4lAdCxq2I5MGSzOM/NwMAQfCUB0LOiP2168/+4T83AwBB6JQHQs6I/bXrz/7hPzcDAEHglAdCzoj9tevP/uE/NwMAQdiUB0LOiP2168/+4T83AwBB0JQHQs6I/bXrz/7hPzcDAEG4lAdCiq6PhdfHwuM/NwMAQaCUB0LS8PqouL2U5D83AwBBmJQHQtLw+qi4vZTkPzcDAEGQlAdC0vD6qLi9lOQ/NwMAQYiUB0LS8PqouL2U5D83AwBBgJQHQtLw+qi4vZTkPzcDAEH4kwdC0vD6qLi9lOQ/NwMAQfCTB0Lh9dHw+qi45T83AwBB6JMHQuH10fD6qLjlPzcDAEHgkwdC4fXR8PqouOU/NwMAQdiTB0Lh9dHw+qi45T83AwBB0JMHQuH10fD6qLjlPzcDAEHIkwdC9tHw+qi4veQ/NwMAQcCTB0L20fD6qLi95D83AwBBuJMHQvbR8PqouL3kPzcDAEGwkwdC9tHw+qi4veQ/NwMAQaiTB0L20fD6qLi95D83AwBB2JUHQvuouL2U3J7iPzcDAEHQlQdC+6i4vZTcnuI/NwMAQciVB0L7qLi9lNye4j83AwBBwJUHQvuouL2U3J7iPzcDAEG4lQdC+6i4vZTcnuI/NwMAQbCVB0L7qLi9lNye4j83AwBBqJUHQvuouL2U3J7iPzcDAEGglQdC+6i4vZTcnuI/NwMAQZiVB0LGrYjkwZLM4z83AwBBkJUHQsatiOTBkszjPzcDAEGIlQdCxq2I5MGSzOM/NwMAQciUB0KKro+F18fC4z83AwBBwJQHQoquj4XXx8LjPzcDAEGwlAdC0vD6qLi9lOQ/NwMAQaiUB0LS8PqouL2U5D83AwBBoJMHQueN06fYxIfkPzcDAEGYkwdC543Tp9jEh+Q/NwMAQZCTB0LnjdOn2MSH5D83AwBB4JUHQoCAgICAgOCowAA3AwBB6JUHQoCAgICAgOCowAA3AwBB8JUHQubMmbPmzNmRwAA3AwBB+JUHQoCAgJDK0sauwgA3AwBBgJYHQoCAgICgk+nAwQA3AwBBiJYHQoCAgICAgID4PzcDAEGQlgdCgICAgICAgIXAADcDAEGYlgdCgICAgICAgJDAADcDAEGglgdCgICAgICAgIzAADcDAEGolgdCgICAgICHp77BADcDAEGwlgdCgICAgICAgJLAADcDAEG4lgdCs+bMmbPm98zAADcDAEHAlgdC9tHw+qi4vfA/NwMAQciWB0KAgICAgICAmsAANwMAQaCXB0Kq48vupIyE1D83AwBBmJcHQri9lNyeiq7PPzcDAEGQlwdC7KPh9dHw+tg/NwMAQYiXB0Kas+bMmbPm1D83AwBBgJcHQvuouL2U3J7CPzcDAEH4lgdC+6i4vZTcntI/NwMAQfCWB0LY8tDF7M7vzz83AwBB6JYHQri9lNyeiq7XPzcDAEHglgdCquPL7qSMhNQ/NwMAQdiWB0K6k7GQsOWhwz83AwBB0JYHQunNxMHAlYfVPzcDAEHomAdCi9md35+1vNk/NwMAQcCYB0Lso+H10fD64D83AwBBmJgHQsvDlrK7vr/SPzcDAEHwlwdC2/P708aX3dk/NwMAQciXB0Kq48vupIyE1D83AwBBiJkHQtvz+9PGl93JPzcDAEGAmQdC2/P708aX3ck/NwMAQfiYB0LayO35/anj0z83AwBB8JgHQpve9KbioODSPzcDAEHgmAdCiq6PhdfHwts/NwMAQdiYB0K4vZTcnoqu1z83AwBB0JgHQoquj4XXx8LbPzcDAEHImAdC7KPh9dHw+tg/NwMAQbiYB0KPhdfHwuuj4T83AwBBsJgHQpve9KbioODKPzcDAEGomAdCy8OWsru+v9I/NwMAQaCYB0K56KK25/en1T83AwBBkJgHQtvz+9PGl93JPzcDAEGImAdC2/P708aX3ck/NwMAQYCYB0L6/anjy+6k1D83AwBB+JcHQtvz+9PGl93RPzcDAEHolwdCk7GQsOWhi9k/NwMAQeCXB0Kq48vupIyE1D83AwBB2JcHQvr9qePL7qTEPzcDAEHQlwdC2sjt+f2p48s/NwMAQcCXB0KTsZCw5aGL2T83AwBBuJcHQqrjy+6kjITUPzcDAEGwlwdC+v2p48vupMQ/NwMAQaiXB0LayO35/anjyz83AwBBkJkHQoCAgICAgNDXwAA3AwBBoJkHQoCAgICAgNbdwAA3AwBBmJkHQoCAgICAgNbVwAA3AwBBqJkHQoCAgICAgOXgwAA3AwBBsJkHQoCAgICAgNDnwAA3AwBBuJkHQoCAgICAwKbowAA3AwBBwJkHQoCAgICAgNP+wAA3AwBByJkHQrPmzJmz5szpPzcDAEGImgdC1MaX3cmYiOA/NwMAQYCaB0LXx8Lro+H16T83AwBB+JkHQvr9qePL7qToPzcDAEHwmQdC2PLQxezO798/NwMAQeiZB0KvupOxkLDl4T83AwBB4JkHQq+6k7GQsOXhPzcDAEHYmQdC+6i4vZTcnuI/NwMAQdCZB0Lfn7W86c3E4T83AwBBkJoHQoCA0LHS/pqGwwA3AwBBmJoHQoCAgICAgID4PzcDAEGgmgdCgICAgICAgPg/NwMAQaiaB0KAgICAgIDwqsAANwMAQbCaB0L18+rW2L/Z6T83AwBBuJoHQoCAgICAgJCqwAA3AwBBwJoHQoCAgICAgICEwAA3AwBBiJsHQovZnd+ftbzZPzcDAEGAmwdC7KPh9dHw+uA/NwMAQfiaB0LLw5ayu76/0j83AwBB8JoHQtvz+9PGl93ZPzcDAEHomgdCquPL7qSMhNQ/NwMAQeCaB0Kq48vupIyE1D83AwBB2JoHQvuouL2U3J7SPzcDAEHQmgdC6c3EwcCVh9U/NwMAQdibB0KPhdfHwuuDkcAANwMAQdCbB0LD66Ph9dGQl8AANwMAQcibB0LD66Ph9dHwh8AANwMAQcCbB0Kuj4XXx8Lr9z83AwBBuJsHQpqz5syZs+b0PzcDAEGwmwdCro+F18fC64zAADcDAEGomwdCzZmz5syZs/I/NwMAQaCbB0L7qLi9lNye+j83AwBBkJsHQuyj4fXR8PrQPzcDAEGYnAdCpOH10fD6qOg/NwMAQZCcB0Lz3va+2LnE2j83AwBBiJwHQqnfrNrT5qXvPzcDAEGAnAdC9cW17vaMgcw/NwMAQfibB0LX/9OsqKGaxD83AwBB8JsHQse0hOzBlNPYPzcDAEHomwdCq5yLm/fD8tY/NwMAQeCbB0Kyj5D1wIfCyT83AwBBqJwHQuyj4fXR8PqmwAA3AwBBoJwHQs2Zs+bMmaumwAA3AwBBqJ4HQrXbl46mj4PYPzcDAEGgngdC9Lrhj5yf9dg/NwMAQZieB0L0uuGPnJ/12D83AwBBkJ4HQvS64Y+cn/XYPzcDAEGIngdC9Lrhj5yf9dg/NwMAQYCeB0L0uuGPnJ/12D83AwBB+J0HQrOaq5GSr+fZPzcDAEHwnQdCkoqkx+GIjNk/NwMAQeidB0K5nNygkczH2D83AwBB4J0HQvi6kbvK2MbVPzcDAEHYnQdC8vn0koi/2dI/NwMAQYCfB0LFzMrZ97H60T83AwBBmKAHQryfs9rYyvfWPzcDAEGQoAdCvJ+z2tjK99Y/NwMAQYigB0K8n7Pa2Mr31j83AwBBgKAHQryfs9rYyvfWPzcDAEH4nwdCvJ+z2tjK99Y/NwMAQfCfB0K8n7Pa2Mr31j83AwBB6J8HQryfs9rYyvfWPzcDAEHgnwdCvJ+z2tjK99Y/NwMAQdifB0K8n7Pa2Mr31j83AwBB0J8HQryfs9rYyvfWPzcDAEHInwdCq/mpkfD+pdg/NwMAQcCfB0Kr+amR8P6l2D83AwBBuJ8HQqv5qZHw/qXYPzcDAEGwnwdCq/mpkfD+pdg/NwMAQaifB0Kr+amR8P6l2D83AwBBoJ8HQviiuvWzmJDZPzcDAEGYnwdC3fiS7s+du9g/NwMAQZCfB0KP9a+v4YL31z83AwBBiJ8HQrP15/aHnc7UPzcDAEH4ngdCtduXjqaPg9g/NwMAQfCeB0K125eOpo+D2D83AwBB6J4HQrXbl46mj4PYPzcDAEHgngdCtduXjqaPg9g/NwMAQdieB0K125eOpo+D2D83AwBB0J4HQrXbl46mj4PYPzcDAEHIngdCtduXjqaPg9g/NwMAQcCeB0K125eOpo+D2D83AwBBuJ4HQrXbl46mj4PYPzcDAEGwngdCtduXjqaPg9g/NwMAQfiiB0LZr7Ljg9vY6D83AwBBqKAHQrLhmeiz1PG7PzcDAEGwowdC3a/O2d3Cvu4/NwMAQaijB0Ldr87Z3cK+7j83AwBBoKMHQt2vztndwr7uPzcDAEGYowdC9ZeR3vX89+8/NwMAQZCjB0Kc8au7lM7j7j83AwBBiKMHQt6sk5bwq/TtPzcDAEGAowdC3KyFm4O4ges/NwMAQcihB0L0uuGPnJ/1wD83AwBBwKEHQvS64Y+cn/XAPzcDAEG4oQdC9Lrhj5yf9cA/NwMAQbChB0L0uuGPnJ/1wD83AwBBqKEHQvS64Y+cn/XAPzcDAEGgoQdC9Lrhj5yf9cA/NwMAQZihB0L0uuGPnJ/1wD83AwBBkKEHQvS64Y+cn/XAPzcDAEGIoQdC9Lrhj5yf9cA/NwMAQYChB0L0uuGPnJ/1wD83AwBB+KAHQvS64Y+cn/XAPzcDAEHwoAdCv+bqlquG9ME/NwMAQeigB0K/5uqWq4b0wT83AwBB4KAHQr/m6parhvTBPzcDAEHYoAdCv+bqlquG9ME/NwMAQdCgB0K/5uqWq4b0wT83AwBByKAHQoqS9J267fLCPzcDAEHAoAdCtaKG5ce0jcI/NwMAQbigB0LV7rP68anBwT83AwBBsKAHQsPnidLSt4e/PzcDAEGgoAdCvJ+z2tjK99Y/NwMAQcilB0L1lI/dkazU4T83AwBByKYHQt2vztndwr7mPzcDAEHApgdC3a/O2d3CvuY/NwMAQbimB0Ldr87Z3cK+5j83AwBBsKYHQt2vztndwr7mPzcDAEGopgdC3a/O2d3CvuY/NwMAQaCmB0Ldr87Z3cK+5j83AwBBmKYHQt2vztndwr7mPzcDAEGQpgdC5KHEm6elhug/NwMAQYimB0LkocSbp6WG6D83AwBBgKYHQuShxJunpYboPzcDAEH4pQdC5KHEm6elhug/NwMAQfClB0LkocSbp6WG6D83AwBB6KUHQq3bqbzcqO3oPzcDAEHgpQdCi/3D5rzymug/NwMAQdilB0L5lKvT65O65z83AwBB0KUHQv2NprSQhZ7kPzcDAEGYpAdC85eD44iJhe0/NwMAQZCkB0Lzl4PjiImF7T83AwBBiKQHQvOXg+OIiYXtPzcDAEGApAdC85eD44iJhe0/NwMAQfijB0Lzl4PjiImF7T83AwBB8KMHQvOXg+OIiYXtPzcDAEHoowdC85eD44iJhe0/NwMAQeCjB0Lzl4PjiImF7T83AwBB2KMHQvOXg+OIiYXtPzcDAEHQowdC85eD44iJhe0/NwMAQcijB0Lzl4PjiImF7T83AwBBwKMHQt2vztndwr7uPzcDAEG4owdC3a/O2d3Cvu4/NwMAQdChB0Km8Ir13dPxwz83AwBB0J0HQpOKkJKNt6DKPzcDAEHInQdCk4qQko23oMo/NwMAQcCdB0KTipCSjbegyj83AwBBuJ0HQpOKkJKNt6DKPzcDAEGwnQdCk4qQko23oMo/NwMAQaidB0KTipCSjbegyj83AwBBoJ0HQpOKkJKNt6DKPzcDAEGYnQdCk4qQko23oMo/NwMAQZCdB0KTipCSjbegyj83AwBBiJ0HQpOKkJKNt6DKPzcDAEGAnQdCk4qQko23oMo/NwMAQficB0KYwb+JzKCyyz83AwBB8JwHQpjBv4nMoLLLPzcDAEHonAdCmMG/icygsss/NwMAQeCcB0KYwb+JzKCyyz83AwBB2JwHQpjBv4nMoLLLPzcDAEHQnAdCzcXhsPaKxMw/NwMAQcicB0K/8NfHrrbPyz83AwBBwJwHQqn98+zd9vfKPzcDAEG4nAdC7sGizvSi1Mg/NwMAQbCcB0Kkr574yfPVxT83AwBB6KYHQt2vztndwr7mPzcDAEHgpgdC3a/O2d3CvuY/NwMAQdimB0Ldr87Z3cK+5j83AwBB0KYHQt2vztndwr7mPzcDAEHwoQdCipL0nbrt8so/NwMAQeihB0LY/umh3bSNyj83AwBB4KEHQo627IDHqcHJPzcDAEHYoQdCz9iYxai4h8c/NwMAQaCkB0L+loTNk9Tx0z83AwBBiKUHQvS64Y+cn/XYPzcDAEGApQdC9Lrhj5yf9dg/NwMAQfikB0L0uuGPnJ/12D83AwBB8KQHQvS64Y+cn/XYPzcDAEHopAdCv+bqlquG9Nk/NwMAQeCkB0K/5uqWq4b02T83AwBB2KQHQr/m6parhvTZPzcDAEHQpAdCv+bqlquG9Nk/NwMAQcikB0K/5uqWq4b02T83AwBBwKQHQt++97Gf7fLaPzcDAEG4pAdCrKvttcK0jdo/NwMAQbCkB0Lm3OXY/KnB2T83AwBBqKQHQqCLppW9t4fXPzcDAEHwogdC9Lrhj5yf9cg/NwMAQeiiB0L0uuGPnJ/1yD83AwBB4KIHQvS64Y+cn/XIPzcDAEHYogdC9Lrhj5yf9cg/NwMAQdCiB0L0uuGPnJ/1yD83AwBByKIHQvS64Y+cn/XIPzcDAEHAogdC9Lrhj5yf9cg/NwMAQbiiB0L0uuGPnJ/1yD83AwBBsKIHQvS64Y+cn/XIPzcDAEGoogdC9Lrhj5yf9cg/NwMAQaCiB0L0uuGPnJ/1yD83AwBBmKIHQr/m6parhvTJPzcDAEGQogdCv+bqlquG9Mk/NwMAQYiiB0K/5uqWq4b0yT83AwBBgKIHQr/m6parhvTJPzcDAEH4oQdCv+bqlquG9Mk/NwMAQcCpB0LcsIL/kpjB0j83AwBBmKgHQuSb+dvoyaXTPzcDAEHApQdC9Lrhj5yf9dg/NwMAQbilB0L0uuGPnJ/12D83AwBBsKUHQvS64Y+cn/XYPzcDAEGopQdC9Lrhj5yf9dg/NwMAQaClB0L0uuGPnJ/12D83AwBBmKUHQvS64Y+cn/XYPzcDAEGQpQdC9Lrhj5yf9dg/NwMAQcipB0KizJKS0Zej1T83AwBBuKkHQrOaq5GSr+fZPzcDAEGwqQdCs5qrkZKv59k/NwMAQaipB0KzmquRkq/n2T83AwBBoKkHQrOaq5GSr+fZPzcDAEGYqQdCs5qrkZKv59k/NwMAQZCpB0KzmquRkq/n2T83AwBBiKkHQrOaq5GSr+fZPzcDAEGAqQdCs5qrkZKv59k/NwMAQfioB0Ly+fSSiL/Z2j83AwBB8KgHQvL59JKIv9naPzcDAEHoqAdC8vn0koi/2do/NwMAQeCoB0Ly+fSSiL/Z2j83AwBB2KgHQrHZvpT+zsvbPzcDAEHQqAdCsdm+lP7Oy9s/NwMAQcioB0Kx2b6U/s7L2z83AwBBwKgHQrHZvpT+zsvbPzcDAEG4qAdC8LiIlvTevdw/NwMAQbCoB0LS6cXervWm3D83AwBBqKgHQvj7paKH3LnZPzcDAEGgqAdC7febmeD+odY/NwMAQeiqB0KilojvhJnGvD83AwBBuKsHQqbwivXd0/HDPzcDAEGwqwdCpvCK9d3T8cM/NwMAQairB0Kh6Yas2LvwxD83AwBBoKsHQqHphqzYu/DEPzcDAEGYqwdCoemGrNi78MQ/NwMAQZCrB0Kh6Yas2LvwxD83AwBBiKsHQrzHnYP8oe/FPzcDAEGAqwdCpK+e+Mnz1cU/NwMAQfiqB0La4fWH1pDAwj83AwBB8KoHQpnX94rF8Oy/PzcDAEHgqgdC+KK69bOYkNk/NwMAQdiqB0L4orr1s5iQ2T83AwBB0KoHQviiuvWzmJDZPzcDAEHIqgdC+KK69bOYkNk/NwMAQcCqB0L4orr1s5iQ2T83AwBBuKoHQviiuvWzmJDZPzcDAEGwqgdC+KK69bOYkNk/NwMAQaiqB0L4orr1s5iQ2T83AwBBoKoHQsXMytn3sfrZPzcDAEGYqgdCxczK2fex+tk/NwMAQZCqB0LFzMrZ97H62T83AwBBiKoHQsXMytn3sfrZPzcDAEGAqgdC56Le0aDL5No/NwMAQfipB0Lnot7RoMvk2j83AwBB8KkHQuei3tGgy+TaPzcDAEHoqQdC56Le0aDL5No/NwMAQeCpB0K0zO615OTO2z83AwBB2KkHQoLNhdmExrnbPzcDAEHQqQdClaTou/Ta5dg/NwMAQbitB0LUspjujcSW6T83AwBB0K4HQvWXkd71/PfvPzcDAEHIrgdC9ZeR3vX89+8/NwMAQcCuB0L1l5He9fz37z83AwBBuK4HQvWXkd71/PfvPzcDAEGwrgdC9ZeR3vX89+8/NwMAQaiuB0L1l5He9fz37z83AwBBoK4HQvWXkd71/PfvPzcDAEGYrgdC8JeuqqXb2PA/NwMAQZCuB0Lwl66qpdvY8D83AwBBiK4HQvCXrqql29jwPzcDAEGArgdC8JeuqqXb2PA/NwMAQfitB0Ll49Plj7i18T83AwBB8K0HQuXj0+WPuLXxPzcDAEHorQdC5ePT5Y+4tfE/NwMAQeCtB0Ll49Plj7i18T83AwBB2K0HQvGX9eeblZLyPzcDAEHQrQdCkbeGt8DP//E/NwMAQcitB0LJxN6MxeWt7z83AwBBwK0HQtuvwN7wzsvrPzcDAEGIrAdCipL0nbrt8sI/NwMAQYCsB0KKkvSduu3ywj83AwBB+KsHQoqS9J267fLCPzcDAEHwqwdCipL0nbrt8sI/NwMAQeirB0KKkvSduu3ywj83AwBB4KsHQoqS9J267fLCPzcDAEHYqwdCipL0nbrt8sI/NwMAQdCrB0KKkvSduu3ywj83AwBByKsHQqbwivXd0/HDPzcDAEHAqwdCpvCK9d3T8cM/NwMAQYiwB0Li+5ywuYSZ4j83AwBBqLEHQq3bqbzcqO3oPzcDAEGgsQdCrdupvNyo7eg/NwMAQZixB0Kt26m83Kjt6D83AwBBkLEHQq3bqbzcqO3oPzcDAEGIsQdCrdupvNyo7eg/NwMAQYCxB0Kt26m83Kjt6D83AwBB+LAHQq3bqbzcqO3oPzcDAEHwsAdCrdupvNyo7eg/NwMAQeiwB0Ki5Ybr1KzU6T83AwBB4LAHQqLlhuvUrNTpPzcDAEHYsAdCouWG69Ss1Ok/NwMAQdCwB0Ki5Ybr1KzU6T83AwBByLAHQuue7IuKsLvqPzcDAEHAsAdC657si4qwu+o/NwMAQbiwB0LrnuyLirC76j83AwBBsLAHQuue7IuKsLvqPzcDAEGosAdC4ajJuoK0ous/NwMAQaCwB0KN/dHhqeaN6z83AwBBmLAHQrLUspjujcToPzcDAEGQsAdC8ZuU/Oy68OQ/NwMAQdiuB0L1l5He9fz37z83AwBBqKcHQtmzwJ/03efOPzcDAEGgpwdC2bPAn/Td584/NwMAQZinB0LZs8Cf9N3nzj83AwBBkKcHQt/q75azx/nPPzcDAEGIpwdC54jKiLyy3M8/NwMAQYCnB0KvtKPknOCJzD83AwBB+KYHQo3T4JrOzY7JPzcDAEHwpgdC/dPox56Pt8Y/NwMAQZCsB0KilojvhJnGxD83AwBBkKgHQs3F4bD2isTMPzcDAEGIqAdCzcXhsPaKxMw/NwMAQYCoB0LNxeGw9orEzD83AwBB+KcHQs3F4bD2isTMPzcDAEHwpwdCzcXhsPaKxMw/NwMAQeinB0LNxeGw9orEzD83AwBB4KcHQs3F4bD2isTMPzcDAEHYpwdCzcXhsPaKxMw/NwMAQdCnB0LT/JCotfTVzT83AwBByKcHQtP8kKi19NXNPzcDAEHApwdC0/yQqLX01c0/NwMAQbinB0LT/JCotfTVzT83AwBBsKcHQtmzwJ/03efOPzcDAEGQrQdCipL0nbrt8so/NwMAQYitB0KKkvSduu3yyj83AwBBgK0HQoqS9J267fLKPzcDAEH4rAdCipL0nbrt8so/NwMAQfCsB0LVvf2kydTxyz83AwBB6KwHQtW9/aTJ1PHLPzcDAEHgrAdC1b39pMnU8cs/NwMAQdisB0LVvf2kydTxyz83AwBB0KwHQqHphqzYu/DMPzcDAEHIrAdCoemGrNi78Mw/NwMAQcCsB0Kh6Yas2LvwzD83AwBBuKwHQqHphqzYu/DMPzcDAEGwrAdC7JSQs+ei780/NwMAQaisB0LT/JCotfTVzT83AwBBoKwHQtrh9YfWkMDKPzcDAEGYrAdC056wkZrw7Mc/NwMAQeCuB0KilojvhJnG1D83AwBBgLAHQt++97Gf7fLaPzcDAEH4rwdC3773sZ/t8to/NwMAQfCvB0Lfvvexn+3y2j83AwBB6K8HQt++97Gf7fLaPzcDAEHgrwdC3773sZ/t8to/NwMAQdivB0Lfvvexn+3y2j83AwBB0K8HQt++97Gf7fLaPzcDAEHIrwdC3773sZ/t8to/NwMAQcCvB0Kq6oC5rtTx2z83AwBBuK8HQqrqgLmu1PHbPzcDAEGwrwdCquqAua7U8ds/NwMAQaivB0Kq6oC5rtTx2z83AwBBoK8HQvGblPzsuvDcPzcDAEGYrwdC8ZuU/Oy68Nw/NwMAQZCvB0Lxm5T87Lrw3D83AwBBiK8HQvGblPzsuvDcPzcDAEGArwdC7JSQs+ei790/NwMAQfiuB0LT/JCotfTV3T83AwBB8K4HQoW18vPwkMDaPzcDAEHorgdCqsWp6c/w7Nc/NwMAQbCtB0KKkvSduu3yyj83AwBBqK0HQoqS9J267fLKPzcDAEGgrQdCipL0nbrt8so/NwMAQZitB0KKkvSduu3yyj83AwBBsLEHQpGO68Xb0YHkPzcDAEG4sQdC7KPh9dHw+tg/NwMAQcCxB0KAgICAwPD1y8EANwMAQcixB0KAgICAkJqdwsEANwMAQdCxB0KAgICAgICA+D83AwBB8LEHQoCAgICAgID4PzcDAEHYsQdC5syZs+bMmfc/NwMAQfixB0Kz5syZs+bM9T83AwBBuLQHQpqz5syZs+bsPzcDAEGwtAdC9tHw+qi4vew/NwMAQZizB0LNmbPmzJmz9j83AwBBoLMHQrPmzJmz5sz1PzcDAEHotQdBAEGoARARGkG4uAdCpvCK9d3T8cM/NwMAQbC4B0KMx8qb0ZbN1z83AwBBqLgHQozHypvRls3XPzcDAEGguAdCjMfKm9GWzdc/NwMAQZi4B0KMx8qb0ZbN1z83AwBBkLgHQozHypvRls3XPzcDAEGIuAdCjMfKm9GWzdc/NwMAQYC4B0KMx8qb0ZbN1z83AwBB+LcHQozHypvRls3XPzcDAEHwtwdCjMfKm9GWzdc/NwMAQei3B0KMx8qb0ZbN1z83AwBB4LcHQozHypvRls3XPzcDAEHYtwdCgpD/rbjF1dg/NwMAQdC3B0KCkP+tuMXV2D83AwBByLcHQoKQ/624xdXYPzcDAEHAtwdCgpD/rbjF1dg/NwMAQbi3B0KCkP+tuMXV2D83AwBBsLcHQr38mI7Iv8TZPzcDAEGotwdCl7XOl4Te69g/NwMAQaC3B0Ku7Nmy1pSp2D83AwBBmLcHQu6mzOTtwJbVPzcDAEGQtwdCpbyv2vK5s9I/NwMAQYi7B0Ki5Ybr1KzU6T83AwBB0LsHQs65yNSFpYbwPzcDAEHIuwdCzrnI1IWlhvA/NwMAQcC7B0LOucjUhaWG8D83AwBBuLsHQs65yNSFpYbwPzcDAEGwuwdCzrnI1IWlhvA/NwMAQai7B0Kt26m83Kjt8D83AwBBoLsHQqHlv63e8prwPzcDAEGYuwdC+ZSr0+uTuu8/NwMAQZC7B0L9jaa0kIWe7D83AwBB2LkHQvS64Y+cn/XIPzcDAEHQuQdC9Lrhj5yf9cg/NwMAQci5B0L0uuGPnJ/1yD83AwBBwLkHQvS64Y+cn/XIPzcDAEG4uQdC9Lrhj5yf9cg/NwMAQbC5B0L0uuGPnJ/1yD83AwBBqLkHQvS64Y+cn/XIPzcDAEGguQdC9Lrhj5yf9cg/NwMAQZi5B0L0uuGPnJ/1yD83AwBBkLkHQvS64Y+cn/XIPzcDAEGIuQdC9Lrhj5yf9cg/NwMAQYC5B0K/5uqWq4b0yT83AwBB+LgHQr/m6parhvTJPzcDAEHwuAdCv+bqlquG9Mk/NwMAQei4B0K/5uqWq4b0yT83AwBB4LgHQr/m6parhvTJPzcDAEHYuAdCipL0nbrt8so/NwMAQdC4B0LY/umh3bSNyj83AwBByLgHQo627IDHqcHJPzcDAEHAuAdCz9iYxai4h8c/NwMAQdi9B0L1lI/dkazU4T83AwBB6L4HQt2vztndwr7mPzcDAEHgvgdC3a/O2d3CvuY/NwMAQdi+B0Ldr87Z3cK+5j83AwBB0L4HQt2vztndwr7mPzcDAEHIvgdC3a/O2d3CvuY/NwMAQcC+B0Ldr87Z3cK+5j83AwBBuL4HQt2vztndwr7mPzcDAEGwvgdC3a/O2d3CvuY/NwMAQai+B0Ldr87Z3cK+5j83AwBBoL4HQuShxJunpYboPzcDAEGYvgdC5KHEm6elhug/NwMAQZC+B0LkocSbp6WG6D83AwBBiL4HQuShxJunpYboPzcDAEGAvgdC5KHEm6elhug/NwMAQfi9B0Kt26m83Kjt6D83AwBB8L0HQov9w+a88proPzcDAEHovQdC+ZSr0+uTuuc/NwMAQeC9B0L9jaa0kIWe5D83AwBBqLwHQt2vztndwr7uPzcDAEGgvAdC3a/O2d3Cvu4/NwMAQZi8B0Ldr87Z3cK+7j83AwBBkLwHQt2vztndwr7uPzcDAEGIvAdC3a/O2d3Cvu4/NwMAQYC8B0Ldr87Z3cK+7j83AwBB+LsHQt2vztndwr7uPzcDAEHwuwdC3a/O2d3Cvu4/NwMAQei7B0Ldr87Z3cK+7j83AwBB4LsHQt2vztndwr7uPzcDAEHYuwdC3a/O2d3Cvu4/NwMAQfi+B0Ldr87Z3cK+5j83AwBB8L4HQt2vztndwr7mPzcDAEHAtAdBAEGoARARIgBBmAhqQsSUvPXmoLLbPzcDACAAQZAIakL2nujYwIrE3D83AwAgAEGICGpC6Mne7/i1z9s/NwMAIABBgAhqQv2p94DD9vfaPzcDACAAQpqVn7qPo9TYPzcD+AcgAEL81ZfQ//PV1T83A/AHIABClcv8jqGXvNA/NwPABiAAQpXL/I6hl7zQPzcDuAYgAEKVy/yOoZe80D83A7AGIABClcv8jqGXvNA/NwOoBiAAQpXL/I6hl7zQPzcDoAYgAEKVy/yOoZe80D83A5gGIABClcv8jqGXvNA/NwOQBiAAQpXL/I6hl7zQPzcDiAYgAEKVy/yOoZe80D83A4AGIABClcv8jqGXvNA/NwP4BSAAQpXL/I6hl7zQPzcD8AUgAELakKbT49K00T83A+gFIABC2pCm0+PStNE/NwPgBSAAQtqQptPj0rTRPzcD2AUgAELakKbT49K00T83A9AFIABC2pCm0+PStNE/NwPIBSAAQp/Wz5emjq3SPzcDwAUgAEKLrsXq7N7M0T83A7gFIABC0Pzg/Ia7hNE/NwOwBSAAQozjm+iDiKfOPzcDqAUgAEKM9f+Ds8mlyz83A6AFQdC9B0KTipCSjbeg2j83AwBByL0HQpOKkJKNt6DaPzcDAEHAvQdCk4qQko23oNo/NwMAQbi9B0KTipCSjbeg2j83AwBBsL0HQpOKkJKNt6DaPzcDAEGovQdCk4qQko23oNo/NwMAQaC9B0KTipCSjbeg2j83AwBBmL0HQpOKkJKNt6DaPzcDAEGQvQdCk4qQko23oNo/NwMAQYi9B0KTipCSjbeg2j83AwBBgL0HQpOKkJKNt6DaPzcDAEH4vAdCxJS89eagsts/NwMAQfC8B0LElLz15qCy2z83AwBB6LwHQsSUvPXmoLLbPzcDAEHgvAdCxJS89eagsts/NwMAQajAB0EAQagBEBEaQbjCB0K9/JiOyL/E2T83AwBBsMIHQqW8r9ryubPaPzcDAEGowgdCpbyv2vK5s9o/NwMAQaDCB0KlvK/a8rmz2j83AwBBmMIHQqW8r9ryubPaPzcDAEGQwgdC4ajJuoK0ots/NwMAQYjCB0LhqMm6grSi2z83AwBBgMIHQuGoybqCtKLbPzcDAEH4wQdC4ajJuoK0ots/NwMAQfDBB0KcleOakq6R3D83AwBB6MEHQrPDkJ3hlfvbPzcDAEHgwQdC6tjzkuaOmNk/NwMAQdjBB0KU7pbbsaLv1T83AwBB0MEHQpLAmrXZtf3SPzcDAEHIxQdC4vucsLmEmeo/NwMAQfjCB0KilojvhJnGxD83AwBB0MUHQp/si4qwu/DsPzcDAEGYxAdCipL0nbrt8so/NwMAQZDEB0KKkvSduu3yyj83AwBBiMQHQoqS9J267fLKPzcDAEGAxAdCipL0nbrt8so/NwMAQfjDB0KKkvSduu3yyj83AwBB8MMHQoqS9J267fLKPzcDAEHowwdCipL0nbrt8so/NwMAQeDDB0KKkvSduu3yyj83AwBB2MMHQtW9/aTJ1PHLPzcDAEHQwwdC1b39pMnU8cs/NwMAQcjDB0LVvf2kydTxyz83AwBBwMMHQtW9/aTJ1PHLPzcDAEG4wwdCoemGrNi78Mw/NwMAQbDDB0Kh6Yas2LvwzD83AwBBqMMHQqHphqzYu/DMPzcDAEGgwwdCoemGrNi78Mw/NwMAQZjDB0LslJCz56LvzT83AwBBkMMHQtP8kKi19NXNPzcDAEGIwwdC2uH1h9aQwMo/NwMAQYDDB0LTnrCRmvDsxz83AwBB8MIHQr38mI7Iv8TZPzcDAEHowgdCvfyYjsi/xNk/NwMAQeDCB0K9/JiOyL/E2T83AwBB2MIHQr38mI7Iv8TZPzcDAEHQwgdCvfyYjsi/xNk/NwMAQcjCB0K9/JiOyL/E2T83AwBBwMIHQr38mI7Iv8TZPzcDAEGYyAdC4vucsLmEmeI/NwMAQejIB0Ki5Ybr1KzU6T83AwBB4MgHQqLlhuvUrNTpPzcDAEHYyAdC657si4qwu+o/NwMAQdDIB0LrnuyLirC76j83AwBByMgHQuue7IuKsLvqPzcDAEHAyAdC657si4qwu+o/NwMAQbjIB0LhqMm6grSi6z83AwBBsMgHQo390eGp5o3rPzcDAEGoyAdCstSymO6NxOg/NwMAQaDIB0Lxm5T87Lrw5D83AwBB6MYHQq3bqbzcqO3wPzcDAEHgxgdCrdupvNyo7fA/NwMAQdjGB0Kt26m83Kjt8D83AwBB0MYHQq3bqbzcqO3wPzcDAEHIxgdCrdupvNyo7fA/NwMAQcDGB0Kt26m83Kjt8D83AwBBuMYHQq3bqbzcqO3wPzcDAEGwxgdCrdupvNyo7fA/NwMAQajGB0KM/Yqks6zU8T83AwBBoMYHQoz9iqSzrNTxPzcDAEGYxgdCjP2KpLOs1PE/NwMAQZDGB0KM/Yqks6zU8T83AwBBiMYHQoKH6NKrsLvyPzcDAEGAxgdCgofo0quwu/I/NwMAQfjFB0KCh+jSq7C78j83AwBB8MUHQoKH6NKrsLvyPzcDAEHoxQdC4ajJuoK0ovM/NwMAQeDFB0KN/dHhqeaN8z83AwBB2MUHQrLUspjujcTwPzcDAEG4yQdCrdupvNyo7eg/NwMAQbDJB0Kt26m83Kjt6D83AwBBqMkHQq3bqbzcqO3oPzcDAEGgyQdCrdupvNyo7eg/NwMAQZjJB0Kt26m83Kjt6D83AwBBkMkHQq3bqbzcqO3oPzcDAEGIyQdCrdupvNyo7eg/NwMAQYDJB0Kt26m83Kjt6D83AwBB+MgHQqLlhuvUrNTpPzcDAEHwyAdCouWG69Ss1Ok/NwMAQYC/B0EAQagBEBEiAEKf1s+Xpo6t0j83A7AGIABCn9bPl6aOrdI/NwOoBiAAQp/Wz5emjq3SPzcDoAYgAEKf1s+Xpo6t0j83A5gGIABCn9bPl6aOrdI/NwOQBiAAQp/Wz5emjq3SPzcDiAYgAELkm/nb6Mml0z83A4AGIABC5Jv52+jJpdM/NwP4BSAAQuSb+dvoyaXTPzcD8AUgAELkm/nb6Mml0z83A+gFIABCqeGioKuFntQ/NwPgBSAAQqnhoqCrhZ7UPzcD2AUgAEKp4aKgq4We1D83A9AFIABCqeGioKuFntQ/NwPIBSAAQu6mzOTtwJbVPzcDwAUgAEK9ia3N5LT+1D83A7gFIABClcKKwcn2/NE/NwOwBSAAQqCLppW9t4fPPzcDqAUgAEKvrL3R0fH1yz83A6AFQfDGB0Ksodv3iZC31j83AwBBkMgHQvae6NjAisTcPzcDAEGIyAdC9p7o2MCKxNw/NwMAQYDIB0L2nujYwIrE3D83AwBB+McHQvae6NjAisTcPzcDAEHwxwdC9p7o2MCKxNw/NwMAQejHB0L2nujYwIrE3D83AwBB4McHQvae6NjAisTcPzcDAEHYxwdC9p7o2MCKxNw/NwMAQdDHB0LT/JCotfTV3T83AwBByMcHQtP8kKi19NXdPzcDAEHAxwdC0/yQqLX01d0/NwMAQbjHB0LT/JCotfTV3T83AwBBsMcHQqrmze+I3efePzcDAEGoxwdCqubN74jd594/NwMAQaDHB0Kq5s3viN3n3j83AwBBmMcHQqrmze+I3efePzcDAEGQxwdCtpHp7ujH+d8/NwMAQYjHB0K/r8Pg8bLc3z83AwBBgMcHQq+0o+Sc4IncPzcDAEH4xgdC4f/jrrPNjtk/NwMAQcDFB0Kf1s+Xpo6t0j83AwBBuMUHQp/Wz5emjq3SPzcDAEHAyQdC+6i4vZTcntI/NwMAQcjJB0Kz5syZs+bM4T83AwBB0MkHQoCAgICAgICSwAA3AwBB2MkHQoCAgICAgICSwAA3AwBB4MkHQoCAgICAgID6PzcDAEHoyQdCs+bMmbPmzOk/NwMAQfDJB0KAgICAgICA+D83AwBBgMoHQoCAgICAgJCowAA3AwBB+MkHQoCAgICAgICSwAA3AwBBiMoHQoCAgICAgJCowAA3AwBBkMoHQoCAgICAgMCkwAA3AwBBmMoHQoCAgICAgOCawAA3AwBBoMoHQri9lNyeiq7PPzcDAEGoygdCgICAgICAwKTAADcDAEHoygdC/NPGl93JmMA/NwMAQeDKB0K56KK25/enxT83AwBB2MoHQvzTxpfdyZjIPzcDAEHQygdC+v2p48vupLw/NwMAQfDKB0KAgICAgICAqsAANwMAQfjKB0KAgICAgICgq8AANwMAQYDLB0KAgICAgIDArMAANwMAQYjLB0KAgICAgICAr8AANwMAQZDLB0KAgICAgIDArMAANwMAQajLB0KAgICAgICA/D83AwBBoMsHQubMmbPmzJn/PzcDAEG4ywdCgICAgICAgPg/NwMAQbDLB0LmzJmz5syZ+z83AwBByMsHQoCAgICAgID8PzcDAEHAywdC5syZs+bMmfk/NwMAQdDLB0KAgICAgICA+D83AwBB2MsHQoCAgICAgID4PzcDAEGYzAdCgICAgICAgILAADcDAEGQzAdCgICAgICAgPw/NwMAQYjMB0Kas+bMmbPm/D83AwBBgMwHQvbR8PqouL38PzcDAEHgywdCzZmz5syZs/4/NwMAQaDMB0Kas+bMmbPmgMAANwMAQbDNB0Kz5syZs+bM+T83AwBB8MwHQoCAgICAgID8PzcDAEHQzAdCgICAgICAgPw/NwMAQcDMB0Kz5syZs+bM+T83AwBBqMwHQoCAgICAgICAwAA3AwBB2M0HQpTcnoquj4X3PzcDAEHgzQdCgICAgICAgPg/NwMAQejNB0KAgICAgICA+D83AwBBqM4HQoCAgICAgID4PzcDAEGgzgdCgICAgICAgPg/NwMAQZjOB0KAgICAgICA+D83AwBBkM4HQoCAgICAgID4PzcDAEGwzgdCmrPmzJmz5vQ/NwMAQfjOB0KAgICAgICA+D83AwBB8M4HQoCAgICAgID4PzcDAEHozgdCgICAgICAgPg/NwMAQeDOB0KAgICAgICA+D83AwBBwM4HQvuouL2U3J7SPzcDAEGAzwdCs+bMmbPmzOk/NwMAQYjPB0L20fD6qLi99D83AwBBkM8HQri9lNyeiq7nPzcDAEGYzwdCgICAkMrSxq7CADcDAEGgzwdCmrPmzJmz5vo/NwMAQajPB0KAgICAgIDQz8AANwMAQbDPB0KAgICAgICAgMAANwMAQbjPB0KAgICAgICAn8AANwMAQfDPB0KAgICAgICA6D83AwBB6M8HQpqz5syZs+b0PzcDAEHgzwdCmrPmzJmz5uQ/NwMAQcDPB0KAgICAgICA+D83AwBBgNAHQpqz5syZs+b8PzcDAEH4zwdCgICAgICAgPg/NwMAQYjQB0LNmbPmzJmz9j83AwBBkNEHQoCAgICAgICKwAA3AwBB0NAHQoCAgICAgICQwAA3AwBBsNAHQoCAgICAgICQwAA3AwBBoNAHQoCAgICAgICKwAA3AwBBuNEHQgA3AwBBwNEHQgA3AwBByNEHQoCAgICAgID4PzcDAEHQ0QdCgICAgICAgPw/NwMAQdjRB0KAgICAgICA/D83AwBB4NEHQoCAgICAgID4PzcDAEHo0QdCgICAgICAgPg/NwMAQajSB0KAgICAgICA+D83AwBBoNIHQoCAgICAgID4PzcDAEGY0gdCgICAgICAgPg/NwMAQZDSB0KAgICAgICA+D83AwBB8NEHQoCAgICAgID4PzcDAEGw0gdClNyeiq6Phfk/NwMAQbjSB0KAgICAgICAisAANwMAQcDSB0KAgICAgICA+D83AwBByNIHQoCAgICAgICAwAA3AwBB0NIHQgA3AwBB2NIHQpqz5syZs+bcPzcDAEHg0gdCADcDAEHo0gdCmrPmzJmz5tQ/NwMAQfDSB0LO0JCCnIT1+D83AwBB+NIHQtLw+qi4vZTcPzcDAEGA0wdC5syZs+bMmfs/NwMAQZDTB0KAgICAgICAisAANwMAQYjTB0KAgICAgICAisAANwMAQZjTB0KAgICAgICAisAANwMAQaDTB0KAgICAgICAisAANwMAQajTB0KAgICAgICAisAANwMAQbDTB0KAgICAgICAisAANwMAQbjTB0KAgICAgICAisAANwMAQcDTB0KAgICAgICA+D83AwBB0NMHQgA3AwBB8NMHQoCAgICAgID4PzcDAEH40wdCs+bMmbPmzPU/NwMAQbDWB0KAgICAgICAr8AANwMAQbjWB0KAgICAgICAqsAANwMAQcDWB0KAgICAgIDArMAANwMAQcjWB0IANwMAQdjTB0IANwMAQZjVB0LNmbPmzJmz9j83AwBBoNUHQrPmzJmz5sz1PzcDAEHQ1gdC+v2p48vupLQ/NwMAQdjWB0Kas+bMmbPm3D83AwBB4NYHQs7QkIKchPX4PzcDAEHo1gdC5syZs+bMmfs/NwMAQfDWB0IANwMAQfjWB0IANwMAQYDXB0IANwMAQYjXB0KAgICAgICA+D83AwBBkNcHQoCAgICAgIDwPzcDAEGY1wdCgICAgICAgPA/NwMAQaDXB0KAgICQytLGrsIANwMAQajXB0KAgICAgICAn8AANwMAQbjXB0IANwMAQbDXB0KAgICAgICAgMAANwMAQcDXB0KAgICAgICAgMAANwMAQcjXB0KAgICAgICAjsAANwMAQdDXB0KAgICAgIDlycAANwMAQdjXB0KthvHYrtyNjT83AwBB4NcHQoCAgICAgOTPwAA3AwBB6NcHQoCAgICAgOTPwAA3AwBB8NcHQoCAgICAgOTPwAA3AwBB+NcHQoCAgICAgOTPwAA3AwBBgNgHQoCAgICAgOnPwAA3AwBBiNgHQoCAgICAgOTPwAA3AwBBkNgHQoCAgICAgOnPwAA3AwBBmNgHQoCAgICAgMCswAA3AwBBoNgHQs2Zs+bMmbP6PzcDAEG42AdCgICAgICAgIbAADcDAEGw2AdC5syZs+bMmfs/NwMAQcjYB0Kz5syZs+bM+T83AwBBwNgHQubMmbPmzJnzPzcDAEHY2AdCmrPmzJmz5uw/NwMAQdDYB0Kz5syZs+bM8T83AwBB4NgHQoCAgICAgIDgPzcDAEHo2AdCgICAgICAwKzAADcDAEHw2AdCgICAgICAgPg/NwMAQajZB0KO6NePwoKA2D83AwBBoNkHQuXsoKay5NnrPzcDAEGY2QdCnb+Kx4Pe2vE/NwMAQbjaB0Kas+bMmbPm7D83AwBBsNoHQvbR8PqouL3sPzcDAEHA2gdCgICAgICAgIrAADcDAEEAIQBB0NoHQoCAgICAgICSwAA3AwBByNoHQoCAgICAgICAwAA3AwBB2NoHQoCAgICAgICawAA3AwBB4NoHQrPmzJmz5syDwAA3AwBB6NoHQoCAgICAgICDwAA3AwBB8NoHQoCAgICAgID4PzcDAEH42gdCgICAgICAgPg/NwMAQYDbB0KAgICAgICA+D83AwBBiNsHQoCAgICAgICZwAA3AwBBkNsHQoCAgICAgICKwAA3AwBBmNsHQoCAgICAgICKwAA3AwBBoNsHQoCAgICAgICKwAA3AwBBqNsHQoCAgICAgICXwAA3AwBBsNsHQoCAgICAgICawAA3AwBBuNsHQoCAgICAgICSwAA3AwBBwNsHQoCAgICAkKGXwQA3AwBByNsHQoCAgICAkKGXwQA3AwBB0NsHQoCAgICAkKGXwQA3AwBB2NsHQsjwtaPKl8yRxAA3AwADQEEAIQEDQCAAQagBbEHg2wdqIAFBA3RqQoCAgICAgMCswAA3AwAgAUEBaiIBQRVHDQALIABBAWoiAEECRw0AC0G43gdCgICAgIDo3ZXBADcDAEGw3gdCt5+rmdO0vfY/NwMAQcDeB0KAgICAgICk1cAANwMAQcjeB0KAgICA8ouo+cEANwMAQfjeB0Kz5syZs+bM6T83AwBB8N4HQvr9qePL7qTUPzcDAEHo3gdC+v2p48vupMQ/NwMAQeDeB0Kas+bMmbPm3D83AwBB2N4HQpve9KbioODaPzcDAEHQ3gdC+v2p48vupNw/NwMAQYjfB0LS8PqouL2U5D83AwBBgN8HQsPro+H10fDiPzcDAEHI3wdCsZCw5aGL2d0/NwMAQcDfB0LP78+a3vSm4j83AwBBuN8HQrbn96eNr7rjPzcDAEGw3wdC9PvTxpfdydg/NwMAQajfB0KciYOBq47ayD83AwBBoN8HQoXXx8Lro+HlPzcDAEGY3wdC6KK25/enjd8/NwMAQZDfB0LIwuuj4fXR4D83AwBB0N8HQoCAgICA6N2VwQA3AwBB2N8HQo3At4GJlP7YPzcDAEHg3wdC0t/9uuC5xtA/NwMAQejfB0KOjcC3gYmU1j83AwBB8N8HQtOshvHYrty9PzcDAEHo4QdCADcDAEHg4QdC7KPh9dHw+uA/NwMAQfDhB0IANwMAQaDjB0IANwMAQfjhB0LUxpfdyZiI8D83AwBBqOMHQgA3AwBBsOMHQgA3AwBB4OQHQgA3AwBBuOMHQvDPmt70puLgPzcDAEHo5AdCADcDAEHw5AdCADcDAEH45AdCADcDAEGg4AdCiq6PhdfHwus/NwMAQajgB0IANwMAQbDgB0K7vr/q+NKbg8AANwMAQQAhAEEAIQFBuOAHQuWhi9md35/tPzcDAANAIAFBwAFsQajhB2pCtuf3p42vuu8/NwMAIAFBAWoiAUEERw0ACwNAIABBwAFsQbjhB2pCgICAgICAgPA/NwMAIABBAWoiAEEERw0AC0EAIQADQCAAQcABbEGg4QdqQgA3AwAgAEEBaiIAQQRHDQALQQAhAANAIABBwAFsQbDhB2pCADcDACAAQQFqIgBBBEcNAAtBACEAA0AgAEHAAWxB4OAHakIANwMAIABBAWoiAEEERw0AC0EAIQADQCAAQcABbEHo4AdqQgA3AwAgAEEBaiIAQQRHDQALQQAhAANAIABBwAFsQfDgB2pCADcDACAAQQFqIgBBBEcNAAtBgOYHQq6PhdfHwuv3PzcDAEGI5gdC+6i4vZTcnsI/NwMAQZDmB0KAgICAgICApMAANwMAQbjlB0LmzJmz5sy5icAANwMAQfjjB0LmzJmz5sy5icAANwMAQbjiB0LmzJmz5sy5icAANwMAQfjgB0LmzJmz5sy5icAANwMAQcjnB0EAQfgDEBEaQcDtB0Kdr+OuovWt6D83AwBBuO0HQp2v466i9a3oPzcDAEGw7QdC9ae49tblpOk/NwMAQajtB0L1p7j21uWk6T83AwBBoO0HQvWnuPbW5aTpPzcDAEGY7QdC9ae49tblpOk/NwMAQZDtB0L1p7j21uWk6T83AwBBiO0HQvrwhMzO1pvqPzcDAEGA7QdCzMbf8JXJvOk/NwMAQfjsB0L0uuGPnJ/16D83AwBB8OwHQq/y/+Tf+47mPzcDAEHo7AdC0enZk4PHkuM/NwMAQbjvB0KL7ZzO24nu5j83AwBB2PAHQtHp2ZODx5LrPzcDAEHQ8AdC0enZk4PHkus/NwMAQcjwB0LR6dmTg8eS6z83AwBBwPAHQtHp2ZODx5LrPzcDAEG48AdC0enZk4PHkus/NwMAQbDwB0LR6dmTg8eS6z83AwBBqPAHQtHp2ZODx5LrPzcDAEGg8AdC0enZk4PHkus/NwMAQZjwB0LR6dmTg8eS6z83AwBBkPAHQtHp2ZODx5LrPzcDAEGI8AdC0enZk4PHkus/NwMAQYDwB0KPwMX89Yex7D83AwBB+O8HQo/Axfz1h7HsPzcDAEHw7wdCj8DF/PWHsew/NwMAQejvB0KPwMX89Yex7D83AwBB4O8HQo/Axfz1h7HsPzcDAEHY7wdCzZax5ejIz+0/NwMAQdDvB0KA7qy8seHQ7D83AwBByO8HQoCU/+671PHrPzcDAEHA7wdChOenndbStOk/NwMAQYjuB0Kdr+OuovWt6D83AwBBgO4HQp2v466i9a3oPzcDAEH47QdCna/jrqL1reg/NwMAQfDtB0Kdr+OuovWt6D83AwBB6O0HQp2v466i9a3oPzcDAEHg7QdCna/jrqL1reg/NwMAQdjtB0Kdr+OuovWt6D83AwBB0O0HQp2v466i9a3oPzcDAEHI7QdCna/jrqL1reg/NwMAQaDmB0EAQagBEBEiAEGoCGpCj8DF/PWHseQ/NwMAIABBoAhqQo/Axfz1h7HkPzcDACAAQZgIakKPwMX89Yex5D83AwAgAEGQCGpCzZax5ejIz+U/NwMAIABBiAhqQq6+pMr04dDkPzcDACAAQYAIakLSw4fh+NPx4z83AwAgAEKxt5+rmdO04T83A/gHIABCsMytstWI7t4/NwPwByAAQtHp2ZODx5LbPzcDwAYgAELR6dmTg8eS2z83A7gGIABC0enZk4PHkts/NwOwBiAAQtHp2ZODx5LbPzcDqAYgAELR6dmTg8eS2z83A6AGIABC0enZk4PHkts/NwOYBiAAQtHp2ZODx5LbPzcDkAYgAELR6dmTg8eS2z83A4gGIABC0enZk4PHkts/NwOABiAAQtHp2ZODx5LbPzcD+AUgAELR6dmTg8eS2z83A/AFIABCtJ/W4O+Gsdw/NwPoBSAAQrSf1uDvhrHcPzcD4AUgAEK0n9bg74ax3D83A9gFIABCtJ/W4O+Gsdw/NwPQBSAAQrSf1uDvhrHcPzcDyAUgAELNlrHl6MjP3T83A8AFIABC0521ru7g0Nw/NwO4BSAAQq3k9vz+1PHbPzcDsAUgAEKxt5+rmdO02T83A6gFIABC5o2M6uGK7tY/NwOgBUGw7wdC0enZk4PHkuM/NwMAQajvB0LR6dmTg8eS4z83AwBBoO8HQtHp2ZODx5LjPzcDAEGY7wdC0enZk4PHkuM/NwMAQZDvB0LR6dmTg8eS4z83AwBBiO8HQtHp2ZODx5LjPzcDAEGA7wdC0enZk4PHkuM/NwMAQfjuB0LR6dmTg8eS4z83AwBB8O4HQtHp2ZODx5LjPzcDAEHo7gdC0enZk4PHkuM/NwMAQeDuB0LR6dmTg8eS4z83AwBB2O4HQo/Axfz1h7HkPzcDAEHQ7gdCj8DF/PWHseQ/NwMAQYjyB0EAQfgDEBEaQZD4B0L68ITMztab6j83AwBBiPgHQtHp2ZODx5LrPzcDAEGA+AdC0enZk4PHkus/NwMAQfj3B0LR6dmTg8eS6z83AwBB8PcHQtHp2ZODx5LrPzcDAEHo9wdCqeKu27e3iew/NwMAQeD3B0Kp4q7bt7eJ7D83AwBB2PcHQqnirtu3t4nsPzcDAEHQ9wdCqeKu27e3iew/NwMAQcj3B0Kuq/uwr6iA7T83AwBBwPcHQteM1LbwxOjsPzcDAEG49wdCzLO219CP7Ok/NwMAQbD3B0KL7ZzO24nu5j83AwBBqPcHQsOEmLr55uHjPzcDAEH4+QdC65vqiqbf1+c/NwMAQZj7B0LNlrHl6MjP7T83AwBBkPsHQs2WseXoyM/tPzcDAEGI+wdCzZax5ejIz+0/NwMAQYD7B0LNlrHl6MjP7T83AwBB+PoHQs2WseXoyM/tPzcDAEHw+gdCzZax5ejIz+0/NwMAQej6B0LNlrHl6MjP7T83AwBB4PoHQs2WseXoyM/tPzcDAEHY+gdC3ZylwJiJ7u4/NwMAQdD6B0LdnKXAmInu7j83AwBByPoHQt2cpcCYie7uPzcDAEHA+gdC3ZylwJiJ7u4/NwMAQbj6B0LOucjUhaWG8D83AwBBsPoHQs65yNSFpYbwPzcDAEGo+gdCzrnI1IWlhvA/NwMAQaD6B0LOucjUhaWG8D83AwBBmPoHQuyk/oi/xdXwPzcDAEGQ+gdC3eWO4r/YxfA/NwMAQYj6B0K96urXrpWQ7T83AwBBgPoHQpST7qqQhvTpPzcDAEHI+AdC+vCEzM7Wm+o/NwMAQcD4B0L68ITMztab6j83AwBBuPgHQvrwhMzO1pvqPzcDAEGw+AdC+vCEzM7Wm+o/NwMAQaj4B0L68ITMztab6j83AwBBoPgHQvrwhMzO1pvqPzcDAEGY+AdC+vCEzM7Wm+o/NwMAQeDwB0EAQagBEBFCtdqL05nd19c/NwOgBUHQ+AdC65vqiqbf198/NwMAQZj5B0KL7ZzO24nu5j83AwBBkPkHQuShxJunpYboPzcDAEGI+QdC5KHEm6elhug/NwMAQYD5B0LkocSbp6WG6D83AwBB+PgHQuShxJunpYboPzcDAEHw+AdCg436z+DF1eg/NwMAQej4B0L0zYqp4djF6D83AwBB4PgHQpCa88nrlJDlPzcDAEHY+AdClJPuqpCG9OE/NwMAQaD3B0LNlrHl6MjP3T83AwBBmPcHQs2WseXoyM/dPzcDAEGQ9wdCzZax5ejIz90/NwMAQYj3B0LNlrHl6MjP3T83AwBBgPcHQs2WseXoyM/dPzcDAEH49gdCzZax5ejIz90/NwMAQfD2B0LNlrHl6MjP3T83AwBB6PYHQs2WseXoyM/dPzcDAEHg9gdCsMytstWI7t4/NwMAQdj2B0KwzK2y1Yju3j83AwBB0PYHQrDMrbLViO7ePzcDAEHI9gdCsMytstWI7t4/NwMAQcD2B0LkocSbp6WG4D83AwBBuPYHQuShxJunpYbgPzcDAEGw9gdC5KHEm6elhuA/NwMAQaj2B0LkocSbp6WG4D83AwBBoPYHQta8gsKdxdXgPzcDAEGY9gdCxv2Sm57YxeA/NwMAQZD2B0KQmvPJ65SQ3T83AwBBiPYHQu+z3caWh/TZPzcDAEGg+wdCADcDAEGo+wdCADcDAEGw+wdCmrPmzJmz5tw/NwMAQbj7B0KAgICAgICAhMAANwMAQcD7B0KAgICAgICA+D83AwBByPsHQubMmbPmzJnzPzcDAEHQ+wdCgICAgICAwJzAADcDAEHY+wdCgICAkMrSxs7CADcDAEHw+QdCzZax5ejIz+U/NwMAQej5B0LNlrHl6MjP5T83AwBB4PkHQs2WseXoyM/lPzcDAEHY+QdCzZax5ejIz+U/NwMAQdD5B0LNlrHl6MjP5T83AwBByPkHQs2WseXoyM/lPzcDAEHA+QdCzZax5ejIz+U/NwMAQbj5B0LNlrHl6MjP5T83AwBBsPkHQovtnM7bie7mPzcDAEGo+QdCi+2cztuJ7uY/NwMAQaD5B0KL7ZzO24nu5j83AwBB4PsHQpqz5syZs+bUPzcDAEHo+wdCADcDAEHw+wdCgICAgICA0+bAADcDAEH4+wdCgICAgICAgPg/NwMAQYD8B0KAgICAgICA+D83AwBBiPwHQoCAgICAgJrQwAA3AwBB2P0HQvDXkcmguKX3PzcDAEHQ/QdC8NeRyaC4pfc/NwMAQcj9B0Lw15HJoLil9z83AwBBwP0HQvDXkcmguKX3PzcDAEG4/QdC8NeRyaC4pfc/NwMAQfj8B0KC0sTdtu+u9z83AwBB8PwHQurWkYLjwav3PzcDAEHo/AdC+OvIpJDcovc/NwMAQeD8B0L468ikkNyi9z83AwBB2PwHQv2P0t/9uqD3PzcDAEHQ/AdCsfDhtN+5n/c/NwMAQcj8B0KA1o65pOeg9z83AwBBwPwHQoHipLihnqL3PzcDAEG4/AdCpYyErLnoovc/NwMAQbD8B0K79queyJ6l9z83AwBBqPwHQrv2q57InqX3PzcDAEGg/AdCu/arnsiepfc/NwMAQZj8B0K79queyJ6l9z83AwBBkPwHQrv2q57InqX3PzcDAEHY/gdC7qTFxrX/7vY/NwMAQdD+B0LupMXGtf/u9j83AwBByP4HQu6kxca1/+72PzcDAEHA/gdC7qTFxrX/7vY/NwMAQbj+B0LZobf2j6ju9j83AwBBsP4HQvSox47Xxoz3PzcDAEGo/gdCue/8jaa0kPc/NwMAQaD+B0L+2diUkt+S9z83AwBBmP4HQovEgd32i5D3PzcDAEGQ/gdC7aidnZDrk/c/NwMAQYj+B0L9rfTk0taX9z83AwBBgP4HQtvH3uH9yJv3PzcDAEH4/QdCyKvqs8HQnPc/NwMAQfD9B0L1zdHm15Kf9z83AwBB6P0HQoOan+fd3Z73PzcDAEHg/QdC1vfw9tDhovc/NwMAQbD9B0KH69SslOzF9z83AwBBqP0HQofr1KyU7MX3PzcDAEGg/QdCh+vUrJTsxfc/NwMAQZj9B0KH69SslOzF9z83AwBBkP0HQs6/k5TEgMf3PzcDAEGI/QdC4tKBv9SGu/c/NwMAQYD9B0Kn3siJ8Nex9z83AwBB4P4HQoCAgICAgICAwAA3AwBB6P4HQoCAgICAgICEwAA3AwBB8P4HQqbnpJ/9wKjIvn83AwBB+P4HQrf85rrfqZqbv383AwBBgP8HQtSjo4z9pN+Lv383AwBBiP8HQoCAgICAgID6PzcDAEGQ/wdCvsnG0fWo1am/fzcDAEGY/wdCitjbvv3rhtg/NwMAQaD/B0LmzJmz5syZ6z83AwBBqP8HQoCAgICAgID8PzcDAEGw/wdCyv3bgM/ut6Q/NwMAQbj/B0KO5ebmvtSrmD83AwBBwP8HQqm67bDasZWQv383AwBByP8HQoCAgICAgICKwAA3AwBB0P8HQvXnm5XSwrGzPzcDAEHY/wdC16K1tq/m5rC/fzcDAEHg/wdCt6jr8qWb+5e/fzcDAEHo/wdCrfXz6tbYv4rAADcDAEHw/wdCqNjEh6i2yt8/NwMAQfj/B0LG1c3/r/XI0z83AwBBgIAIQubMmbPmzJmUwAA3AwBBiIAIQoCAgICAgICIwAA3AwBBkIAIQgA3AwBBoIAIQpTcnoquj4WOwAA3AwBBmIAIQoCAgICAgICAwAA3AwBBqIAIQpqz5syZs+bkPzcDAEGwgAhCmrPmzJmz5tw/NwMAQbiACEKAgICAgIDArMAANwMAQcCACEKAgICAgICAhMAANwMAQciACEKpuL2U3J6K7j83AwBBmIEIQveg7JmFnY/5PzcDAEGQgQhCvp/VipqQ9vE/NwMAQYiBCEKFtLDTzseK7D83AwBBgIEIQuq5xdKEwZXpPzcDAEH4gAhCvqz6oZeo3/I/NwMAQfCACELbz46Ps6Cl/T83AwBB6IAIQpOI9b6ApN2AwAA3AwBB+IEIQvbR8PqouL38v383AwBBgIIIQoCAgICAgID4PzcDAEHAgghCmrPmzJmz5uQ/NwMAQciCCELtzu/Pmt707j83AwBB0IIIQoCAgICAgICKwAA3AwBB2IIIQs2Zs+bMmbOHwAA3AwBB0IQIQvOAgvPo4+/+v383AwBByIQIQoyOiJKLsIL/v383AwBBwIQIQrLA7Ou7/7j+v383AwBBuIQIQo7rxdvRgfj9v383AwBBsIQIQs3Cztexl9H9v383AwBBqIQIQsvssaOgvL39v383AwBBoIQIQt2DseeU9Pz8v383AwBBmIQIQrfY7aKZm8j8v383AwBBkIQIQrfAz5+Mobj8v383AwBBiIQIQr+u7Yr7l+uFQDcDAEHwgwhC5/HczfDesu+/fzcDAEHogwhCzZGDuZfCqfK/fzcDAEHggwhCya6z8pvbufq/fzcDAEHYgwhCnIWrqtCi9fe/fzcDAEHQgwhC+on5pNLrzPm/fzcDAEHIgwhCmpHs8Omr6vq/fzcDAEHAgwhCsMG0xsWmh/y/fzcDAEG4gwhC5pCO68Xb0f2/fzcDAEGwgwhCidrluancqv6/fzcDAEGogwhC0pL1hOjEsP6/fzcDAEGggwhC+JaQweKPg/+/fzcDAEGYgwhC59O6yJvD+/6/fzcDAEGQgwhC4ITc9e686v6/fzcDAEGIgwhC+/XA84zR9P6/fzcDAEGAgwhCuMnjnaWHlv+/fzcDAEH4gghC/Nj0w67Q3v6/fzcDAEHwgghCkLWTztzfg/6/fzcDAEHogghC57bumL3Chf6/fzcDAEHggghCx9iWvoqA5oVANwMAQaiFCEKNmp6RiOeD6L9/NwMAQaCFCELOk/ah+7GF8b9/NwMAQZiFCEK8wYip09248r9/NwMAQZCFCEKrpMygjb6r9b9/NwMAQYiFCEKZ1eCoybri/r9/NwMAQYCFCEKkluCE3PXO/r9/NwMAQfiECELA9seUoobL/r9/NwMAQfCECEKT5If67KzV/r9/NwMAQeiECEL+rpH4v6vS/r9/NwMAQeCECEKm7Py47dCC/79/NwMAQdiECEKQ76utmeGP/79/NwMAQYCECELxgcrN8oqe779/NwMAQfiDCEK05+msoLuH8L9/NwMAQbCFCEIANwMAQbiFCEL808aX3cmYqD83AwBBwIUIQofl1qzk9ujrPTcDAEHIhQhCjdvXhfresdg+NwMAQdCFCEKVrZvBvsHLiD43AwBB2IUIQoCAgICAgNDHwAA3AwBB4IUIQgA3AwBB6IUIQoCAgIDQrPPmwQA3AwBB8IUIQoquj4XXx8KAwAA3AwBB+IUIQoCAgICA54S/wQA3AwBBgIYIQoCAgICAkKGXwQA3AwBBiIYIQoCAgICAgNDHwAA3AwBBkIYIQoCAgICAgID4PzcDAEGYhghCmrPmzJmz5tw/NwMAQaCGCELNmbPmzJmz7j83AwBB+IYIQrnoorbn94eGwAA3AwBB8IYIQvCJs72xqN6MwAA3AwBB6IYIQoCAgICAgICSwAA3AwBB4IYIQoCAgICAgICSwAA3AwBB2IYIQpLRl6OxuYuDwAA3AwBB0IYIQr6Wz4funYuBwAA3AwBByIYIQpSDx5KvnbeBwAA3AwBB2IcIQpP1hOjEsMPyPzcDAEHghwhCgICAgICAgPg/NwMAQaCICEKas+bMmbPm9D83AwBBqIgIQvH6qLi9lNz0PzcDAEGwiAhCueiituf3p/k/NwMAQeiJCELzqZ3kzeHN/T83AwBBiIsIQoec54il+8KeQDcDAEGAiwhC867LkJ/o+5dANwMAQfiKCELA2fvkw4XFlUA3AwBB8IoIQqOZm8jJjO2RQDcDAEHoighCwsCVh63k1ohANwMAQeCKCELzhbCfuuq9iEA3AwBB2IoIQr2U3J6KrpeIQDcDAEHQighC+LiKnZKXl4hANwMAQciKCEKF6MSww6eniEA3AwBBwIoIQvTq1ti/2cuIQDcDAEG4ighCqPDiirWw8ohANwMAQbCKCEKztpCTmfL0iEA3AwBBqIoIQrPVz6vb4oaJQDcDAEGgighCoaGEuIiq8YlANwMAQZiKCELW4puynvL/iUA3AwBBkIoIQp6x1peG5ZGKQDcDAEGIighCkouwgu66v4pANwMAQYCKCEKnl4uTtr60i0A3AwBB+IkIQomIr9ff4PaLQDcDAEHwiQhChMLkgszAu4tANwMAQYiJCELilJGJvZmyiUA3AwBBgIkIQuqTrOKDlNOIQDcDAEH4iAhC+KeNr7qTiYlANwMAQfCICELzit7Li/HLiUA3AwBB6IgIQpXLoZzWi7+JQDcDAEHgiAhC8tqhxfH8q4lANwMAQdiICELt2r6Rodv8iUA3AwBB0IgIQpuT39nNm8aKQDcDAEHIiAhCnODnj8aQnIlANwMAQcCICELtm/iFk9Pq/T83AwBB4IkIQtvz+9PGl4WZQDcDAEHYiQhCupOxkLDl2ZhANwMAQdCJCEKG8diu3I3BmEA3AwBByIkIQrCHnOeIpduTQDcDAEHAiQhCnOy20cyN3IxANwMAQbiJCEK8kPbMws6njUA3AwBBsIkIQtbK/a6R+KeMQDcDAEGoiQhCkqPOhfu0l4tANwMAQaCJCEL7l7vPvNj4ikA3AwBBmIkIQrnEtfHTgPCJQDcDAEGQiQhC7/GUuqSunolANwMAQZCLCEKAgICAgICAn8AANwMAQZiLCEKygabgrff2j8AANwMAQeDqBS0AAEUEQEHk6gVBBkHQKBAMNgIAQejqBUEGQbApEAw2AgBB7OoFQQlBkCoQDDYCAEHw6gVBBkGgKxAMNgIAQfTqBUEFQYAsEAw2AgBB+OoFQbgCQdAsEAw2AgBB/OoFQQhB0NMAEAw2AgBBgOsFQSBB0NQAEAw2AgBBhOsFQQRB0NgAEAw2AgBBiOsFQQRBkNkAEAw2AgBBjOsFQQNB0NkAEAw2AgBBkOsFQfEAQYDaABAMNgIAQZTrBUEEQZDoABAMNgIAQZjrBUEKQdDoABAMNgIAQZzrBUEKQfDpABAMNgIAQaDrBUEKQZDrABAMNgIAQaTrBUEKQbDsABAMNgIAQajrBUEKQdDtABAMNgIAQazrBUEKQfDuABAMNgIAQbDrBUECQZDwABAMNgIAQbTrBUELQbDwABAMNgIAQbjrBUELQeDxABAMNgIAQbzrBUELQZDzABAMNgIAQcDrBUELQcD0ABAMNgIAQcTrBUELQfD1ABAMNgIAQcjrBUELQaD3ABAMNgIAQczrBUEIQdD4ABAMNgIAQdDrBUEGQdD5ABAMNgIAQdTrBUEGQbD6ABAMNgIAQdjrBUEGQZD7ABAMNgIAQdzrBUEGQfD7ABAMNgIAQeDrBUEGQdD8ABAMNgIAQeTrBUEGQbD9ABAMNgIAQejrBUEGQZD+ABAMNgIAQezrBUG4AkHw/gAQDDYCAEHw6wVBNkHwpQEQDDYCAEH06wVB8wBB0KwBEAw2AgBB+OsFQckBQYC7ARAMNgIAQfzrBUELQZDUARAMNgIAQYDsBUHzAEHA1QEQDDYCAEGE7AVB8wBB8OMBEAw2AgBBiOwFQQhBoPIBEAw2AgBBjOwFQRlBoPMBEAw2AgBBkOwFQRlBsPYBEAw2AgBBlOwFQTVBwPkBEAw2AgBBmOwFQTVBkIACEAw2AgBBnOwFQTZB4IYCEAw2AgBBoOwFQQ1BwI0CEAw2AgBBpOwFQTZBkI8CEAw2AgBBqOwFQQVB8JUCEAw2AgBBrOwFQTVBwJYCEAw2AgBBsOwFQTVBkJ0CEAw2AgBBtOwFQTVB4KMCEAw2AgBBuOwFQTVBsKoCEAw2AgBBvOwFQTBBgLECEAw2AgBBwOwFQTBBgLcCEAw2AgBBxOwFQRlBgL0CEAw2AgBByOwFQcEMQZDAAhAMNgIAQczsBUHBDEGgiAQQDDYCAEHQ7AVByQFBsNAFEAw2AgBB4OoFQQE6AAALQeHqBS0AAEUEQEHh6gVBAToAAAsLCwAQGUHA0gcrAwALCwAQGUHAlwYrAwALCwAQGUHo0QYrAwALEAAjACAAa0FwcSIAJAAgAAsGACAAJAALBAAjAAsGACAAECQLBgAgABAUC9ECAQd/IwBBIGsiAyQAIAMgACgCHCIENgIQIAAoAhQhBSADIAI2AhwgAyABNgIYIAMgBSAEayIBNgIUIAEgAmohBEECIQcgA0EQaiIFIQECfwJAAkAgACgCPCAFQQIgA0EMahAAEB1FBEADQCAEIAMoAgwiBUYNAiAFQQBIDQMgASAFIAEoAgQiCEsiBkEDdGoiCSAFIAhBACAGG2siCCAJKAIAajYCACABQQxBBCAGG2oiCSAJKAIAIAhrNgIAIAQgBWshBCAAKAI8IAFBCGogASAGGyIBIAcgBmsiByADQQxqEAAQHUUNAAsLIARBf0cNAQsgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCECACDAELIABBADYCHCAAQgA3AxAgACAAKAIAQSByNgIAQQAgB0ECRg0AGiACIAEoAgRrCyEEIANBIGokACAEC0EBAX8jAEEQayIDJAAgACgCPCABpyABQiCIpyACQf8BcSADQQhqEAEQHSEAIAMpAwghASADQRBqJABCfyABIAAbCxAAQZYKQaMBQdAjKAIAECILCQAgACgCPBAECzIBAX8gACgCFCIDIAEgAiAAKAIQIANrIgEgASACSxsiARANIAAgACgCFCABajYCFCACC5MFAgZ+AX8gASABKAIAQQdqQXhxIgFBEGo2AgAgAAJ8IAEpAwAhBCABKQMIIQUjAEEgayIBJAACQCAFQv///////////wCDIgNCgICAgICAwIA8fSADQoCAgICAgMD/wwB9VARAIAVCBIYgBEI8iIQhAyAEQv//////////D4MiBEKBgICAgICAgAhaBEAgA0KBgICAgICAgMAAfCECDAILIANCgICAgICAgIBAfSECIARCgICAgICAgIAIhUIAUg0BIAIgA0IBg3whAgwBCyAEUCADQoCAgICAgMD//wBUIANCgICAgICAwP//AFEbRQRAIAVCBIYgBEI8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIANC////////v//DAFYNAEIAIQIgA0IwiKciCEGR9wBJDQAgBCECIAVC////////P4NCgICAgICAwACEIgMhBgJAIAhBgfcAayIAQcAAcQRAIAIgAEFAaq2GIQZCACECDAELIABFDQAgBiAArSIHhiACQcAAIABrrYiEIQYgAiAHhiECCyABIAI3AxAgASAGNwMYIAEhAAJAQYH4ACAIayIIQcAAcQRAIAMgCEFAaq2IIQRCACEDDAELIAhFDQAgA0HAACAIa62GIAQgCK0iAoiEIQQgAyACiCEDCyAAIAQ3AwAgACADNwMIIAEpAwhCBIYgASkDACIEQjyIhCECIAEpAxAgASkDGIRCAFKtIARC//////////8Pg4QiBEKBgICAgICAgAhaBEAgAkIBfCECDAELIARCgICAgICAgIAIhUIAUg0AIAJCAYMgAnwhAgsgAUEgaiQAIAIgBUKAgICAgICAgIB/g4S/CzkDAAvgFgMSfwF8An4jAEGwBGsiCSQAIAlBADYCLAJAIAG9IhlCAFMEQEEBIRFB6gkhEiABmiIBvSEZDAELIARBgBBxBEBBASERQe0JIRIMAQtB8AlB6wkgBEEBcSIRGyESIBFFIRYLAkAgGUKAgICAgICA+P8Ag0KAgICAgICA+P8AUQRAIABBICACIBFBA2oi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AwBBmNUHIAArA6AIOQMAQaDVByAAKwOoCDkDAEHw0wcgACsDsAg5AwBB+NMHIAArA7gIOQMAQbDWByAAKwPACDkDAEGw1wcgACsDyAg5AwBBuNoHIAArA9AIOQMAQbDaByAAKwPYCDkDAEHQ3wcgACsD4Ag5AwBBwIgHIAArA+gIOQMAQbCEBiAAKwPwCDkDAEHQiAcgACsD+Ag5AwBB8IQGIAArA4AJOQMAQcCEBiAAKwOICTkDABArQdi6DkHo0QYrAwAiAzkDAEG0ug5BADYCAEHIug5BADYCAEHMug5BADYCAAJAAn9BwJcGKwMAIAOhQeDYBysDAKMQICIDmUQAAAAAAADgQWMEQCADqgwBC0GAgICAeAsiDkEASA0AA0AQJwJ8Qdi6DisDACEDAkBBwNIHKwMAIgQiBb0iEkIBhiIQUCASQv///////////wCDQoCAgICAgID4/wBWckUEQCADvSITQjSIp0H/D3EiAEH/D0cNAQsgAyAFoiIDIAOjDAELIBAgE0IBhiIRWgRAIANEAAAAAAAAAACiIAMgECARURsMAQsgEkI0iKdB/w9xIQECfiAARQRAQQAhACATQgyGIhBCAFkEQANAIABBAWshACAQQgGGIhBCAFkNAAsLIBNBASAAa62GDAELIBNC/////////weDQoCAgICAgIAIhAshEAJ+IAFFBEBBACEBIBJCDIYiEUIAWQRAA0AgAUEBayEBIBFCAYYiEUIAWQ0ACwsgEkEBIAFrrYYMAQsgEkL/////////B4NCgICAgICAgAiECyESIAAgAUoEQANAAkAgECASfSIRQgBTDQAgESIQQgBSDQAgA0QAAAAAAAAAAKIMAwsgEEIBhiEQIABBAWsiACABSg0ACyABIQALAkAgECASfSIRQgBTDQAgESIQQgBSDQAgA0QAAAAAAAAAAKIMAQsCQCAQQv////////8HVgRAIBAhEQwBCwNAIABBAWshACAQQoCAgICAgIAEVCEBIBBCAYYiESEQIAENAAsLIBNCgICAgICAgICAf4MgEUKAgICAgICACH0gAK1CNIaEIBFBASAAa62IIABBAEobhL8LRI3ttaD3xrA+YwRAQcS6DigCAEUEQEHEug4Cf0HAlwYrAwBB6NEGKwMAoSAEoxAgIgNEAAAAAAAA8EFjIANEAAAAAAAAAABmcQRAIAOrDAELQQALQQFqNgIAC0HAug5BADYCAAJAQby6DigCACIABEAgACgCACICRQ0BIAAoAgQgAEEMakEAIAAoAggiARsQI0EBIQpBAyEAIAJBAUYNAQNAQby6DigCACILIAAgAWoiAEECdGoiASgCACALIABBAmoiAEECdGpBACABKAIEIgEbECMgCkEBaiIKIAJHDQALDAELQaDrDCsDABAFQajrDCsDABAFQbDrDCsDABAFQbjrDCsDABAFQcDrDCsDABAFQcjrDCsDABAFQdDrDCsDABAFQdjrDCsDABAFQeDrDCsDABAFQejrDCsDABAFQfDrDCsDABAFQfjrDCsDABAFQai6DisDABAFQYDsDCsDABAFQZi6DisDABAFQYjsDCsDABAFQdjhDSsDABAFQeDhDSsDABAFQejhDSsDABAFQfjhDSsDABAFQYjiDSsDABAFQdDhDSsDABAFQfDhDSsDABAFQYDiDSsDABAFQaDiDSsDABAFQZjiDSsDABAFQZDiDSsDABAFQYC5DisDABAFQejECCsDABAFQfC4DisDABAFQcjGDSsDABAFQZj4DCsDABAFQcjqCysDABAFQdDqCysDABAFQdjqCysDABAFQejqCysDABAFQfjqCysDABAFQcDqCysDABAFQeDqCysDABAFQfDqCysDABAFQYi4DisDABAFQZC4DisDABAFQZi4DisDABAFQai4DisDABAFQbi4DisDABAFQYC4DisDABAFQaC4DisDABAFQbC4DisDABAFQcj/BSsDABAFQdj/BSsDABAFQcD/BSsDABAFQdD/BSsDABAFQfC3DisDABAFQeC3DisDABAFQbDZCCsDABAFQdizDisDABAFQfCiDisDABAFQYDeDSsDABAFQZjfDSsDABAFQYDfDSsDABAFQfCwDisDABAFQfiiDisDABAFQZDeDSsDABAFQZjeDSsDABAFQeiwDisDABAFQcjmDCsDABAFQdDmDCsDABAFQdjmDCsDABAFQejmDCsDABAFQfjmDCsDABAFQcDmDCsDABAFQeDmDCsDABAFQfDmDCsDABAFQci0DisDABAFQcC0DisDABAFQbi0DisDABAFQbC0DisDABAFQZDcDCsDABAFQcjcDCsDABAFQdjcDCsDABAFQaDcDCsDABAFQcDcDCsDABAFQdDcDCsDABAFQajYDCsDABAFQdjYDCsDABAFQejYDCsDABAFQbDYDCsDABAFQdDYDCsDABAFQeDYDCsDABAFQcjfDCsDABAFQdjfDCsDABAFQcDfDCsDABAFQdDfDCsDABAFQcDWDCsDABAFQcCwDisDABAFQciwDisDABAFQaiwDisDABAFQbCwDisDABAFQbiwDisDABAFQaCwDisDABAFQcDsDCsDABAFQZClDisDABAFQdihDisDABAFQcChDisDABAFQdikDisDABAFQeCkDisDABAFQeikDisDABAFQfikDisDABAFQYilDisDABAFQdCkDisDABAFQfCkDisDABAFQYClDisDABAFQYikDisDABAFQejGDSsDABAFQZCjDisDABAFQcifDisDABAFQdCfDisDABAFQdifDisDABAFQeifDisDABAFQfifDisDABAFQcCfDisDABAFQeCfDisDABAFQfCfDisDABAFQeChDisDABAFQcihDisDABAFQejjDSsDABAFQfDjDSsDABAFQfjjDSsDABAFQYjkDSsDABAFQZjkDSsDABAFQeDjDSsDABAFQYDkDSsDABAFQZDkDSsDABAFQdChDisDABAFQbihDisDABAFQfDwCysDABAFQYigDisDABAFQZCgDisDABAFQZigDisDABAFQaigDisDABAFQbigDisDABAFQYCgDisDABAFQaCgDisDABAFQbCgDisDABAFQdCgDisDABAFQcigDisDABAFQfCJDSsDABAFQaDjDSsDABAFQejiDSsDABAFQeDiDSsDABAFQcDiDSsDABAFQYD/DSsDABAFQYCGDSsDABAFQeiOCCsDABAFQdD0DCsDABAFQaD+DSsDABAFQZj+DSsDABAFQdDeDSsDABAFQejdDSsDABAFQcjeDSsDABAFQfD9DSsDABAFQajbDSsDABAFQcD6DSsDABAFQej3DSsDABAFQeD3DSsDABAFQdj3DSsDABAFQdD3DSsDABAFQei0DCsDABAFQZD2DSsDABAFQYj2DSsDABAFQYD2DSsDABAFQfj1DSsDABAFQdDiDSsDABAFQeCOCCsDABAFQcDqDSsDABAFQbjkDSsDABAFQcDkDSsDABAFQcjkDSsDABAFQdjkDSsDABAFQejkDSsDABAFQbDkDSsDABAFQdDkDSsDABAFQeDkDSsDABAF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AyAAQcCAB2oiASsDmAEgASsDoAGhIABB0K0OaisDoAGhoqA5A6ABQQEhAiAKQQFxIQBBACEKIAANAAsDQEEAIQADQEEAIQIDQCACQQN0IgEgAEEFdCILIApBoAVsIgxB4L4KampqIg0gDSsDACADIAxBkP8NaiALaiABaisDACAMQaDJCmogC2ogAWorAwChoqA5AwAgAkEBaiICQQRHDQALIABBAWoiAEEVRw0ACyAKQQFqIgpBAkcNAAtBACEKA0BBACELA0BBACECA0AgAkEDdCIAIAtBBXQiASAKQaAFbCIMQcC/DGpqaiAMQfDnCWogAWogAGorAwAgCkHQAmxBgMoMaiALQQR0aiACQQJ0aigCABAWOQMAIAJBAWoiAkEERw0ACyALQQFqIgtBFUcNAAsgCkEBaiIKQQJHDQALQQAhC0GQmwhBkJsIKwMAQeDYBysDACIDRAAAAAAAAAAAoiIEoDkDAEG4nAhBuJwIKwMAIASgOQMAQQEhCkEBIQBBACECA0AgAkGoAWwiAUGQmwhqIgIgAisDECABQdCcDmorAxAgAUGAqw5qKwMQoSABQeDsDGorAxChIAFB8JEGaisDEKEgA6KgOQMQIAAhAUEAIQBBASECIAENAAsDQCALQagBbCIAQZCbCGoiASABKwMYIABB0JwOaisDGCAAQYCrDmorAxihIABB4OwMaisDGKEgAEHwkQZqKwMYoSADoqA5AxhBASELIApBAXEhAEEAIQogAA0AC0GYmwhBmJsIKwMAIASgOQMAQcCcCEHAnAgrAwAgBKA5AwBBACELQQEhCkEBIQBBACECA0AgAkGoAWwiAUGQmwhqIgIgAisDICABQeDsDGoiAisDGCABQYCrDmorAyChIAIrAyChIAOioDkDICAAIQFBACEAQQEhAiABDQALA0AgC0GoAWwiAEGQmwhqIgEgASsDKCAAQeDsDGoiASsDICAAQYCrDmorAyihIAErAyihIAOioDkDKEEBIQsgCkEBcSEAQQAhCiAADQALQQAhAUHg2AcrAwAhA0EBIQADQCAKQagBbCIKQZCbCGoiCyALKwMwIApB4OwMaiILKwMoIApBgKsOaisDMKEgCysDMKEgA6KgOQMwIAIhC0EAIQJBASEKIAsNAAsDQCABQagBbCIBQZCbCGoiAiACKwM4IAFB4OwMaiICKwMwIAFBgKsOaisDOKEgAisDOKEgA6KgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwNAIABB4OwMaiICKwM4IABBgKsOaisDQKEgAisDQKEgA6KgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCbCGoiAiACKwNIIAFB4OwMaiICKwNAIAFBgKsOaisDSKEgAisDSKEgA6KgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwNQIABB4OwMaiICKwNIIABBgKsOaisDUKEgAisDUKEgA6KgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCbCGoiAiACKwNYIAFB4OwMaiICKwNQIAFBgKsOaisDWKEgAisDWKEgA6KgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwNgIABB4OwMaiICKwNYIABBgKsOaisDYKEgAisDYKEgA6KgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCbCGoiAiACKwNoIAFB4OwMaiICKwNgIAFBgKsOaisDaKEgAisDaKEgA6KgOQNoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwNwIABB4OwMaiICKwNoIABBgKsOaisDcKEgAisDcKEgA6KgOQNwQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCbCGoiAiACKwN4IAFB4OwMaiICKwNwIAFBgKsOaisDeKEgAisDeKEgA6KgOQN4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwOAASAAQeDsDGoiAisDeCAAQYCrDmorA4ABoSACKwOAAaEgA6KgOQOAAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQmwhqIgIgAisDiAEgAUHg7AxqIgIrA4ABIAFBgKsOaisDiAGhIAIrA4gBoSADoqA5A4gBQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCbCGoiAiACKwOQASAAQeDsDGoiAisDiAEgAEGAqw5qKwOQAaEgAisDkAGhIAOioDkDkAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgFBkJsIaiICIAIrA5gBIAFB4OwMaiICKwOQASABQYCrDmorA5gBoSACKwOYAaEgA6KgOQOYAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQmwhqIgIgAisDoAEgAEHg7AxqIgIrA5gBIABBgKsOaisDoAGhIAIrA6ABoSADoqA5A6ABQQEhACABIQJBACEBIAINAAtBACEAQdDCCEHQwggrAwBBgJAOKwMAIAOioDkDAEHAwghBwMIIKwMAIANB8I8OKwMAoqA5AwBBqMIIQajCCCsDACADQeCPDisDAKKgOQMAQZjCCEGYwggrAwAgA0HQjw4rAwCioDkDAEHg+QtB4PkLKwMAQdCJDisDAEHw+QsrAwChIAOioDkDAEHo+QtB6PkLKwMAQdiJDisDAEH4+QsrAwChIAOioDkDAEH4wghB+MIIKwMAIANBwI8OKwMAoqA5AwBB6MIIQejCCCsDACADQbCPDisDAKKgOQMAQaDPDEGgzwwrAwAgA0Hg+g0rAwCioDkDAEHglQggA0QAAAAAAAAAAKIiBEHglQgrAwCgOQMAQYiXCCAEQYiXCCsDAKA5AwBB8JUIIARB8JUIKwMAoDkDAEGYlwggBEGYlwgrAwCgOQMAQQEhAgNAIAFBqAFsIgFB4JUIaiILIAsrAxggAyABQfCZDmorAxggAUGwqA5qKwMYoSABQbDvDGorAxihIAFBwJQGaisDGKGioDkDGCACIQtBACECQQEhASALDQALA0AgAEGoAWwiAEHglQhqIgEgASsDICADIABB8JkOaisDICAAQbCoDmorAyChIABBsO8MaiIBKwMgoSAAQcCUBmorAyChIAErAxigoqA5AyBBASEAIAohAUEAIQogAQ0ACwNAIApBqAFsIgFB4JUIaiICIAIrAyggAyABQfCZDmorAyggAUHAlAZqKwMooSABQbCoDmorAyihIAFBsO8MaiIBKwMooSABKwMgoKKgOQMoQQEhCiAAIQFBACEAIAENAAtB6JUIIARB6JUIKwMAoDkDAEGQlwggBEGQlwgrAwCgOQMAQQAhAUEBIQADQCABQagBbCIBQeCVCGoiAiACKwMwIAMgAUGw7wxqIgIrAyggAUGwqA5qKwMwoSACKwMwoaKgOQMwIAAhAkEAIQBBASEBIAINAAtBACEBQQAhC0Hg2AcrAwAhA0EBIQBBASECA0AgC0GoAWwiCkHglQhqIgsgCysDOCAKQbDvDGoiCysDMCAKQbCoDmorAzihIAsrAzihIAOioDkDOCACIQpBACECQQEhCyAKDQALA0AgAUGoAWwiAUHglQhqIgIgAisDQCABQbDvDGoiAisDOCABQbCoDmorA0ChIAIrA0ChIAOioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHglQhqIgIgAisDSCAAQbDvDGoiAisDQCAAQbCoDmorA0ihIAIrA0ihIAOioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHglQhqIgIgAisDUCABQbDvDGoiAisDSCABQbCoDmorA1ChIAIrA1ChIAOioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHglQhqIgIgAisDWCAAQbDvDGoiAisDUCAAQbCoDmorA1ihIAIrA1ihIAOioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHglQhqIgIgAisDYCABQbDvDGoiAisDWCABQbCoDmorA2ChIAIrA2ChIAOioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHglQhqIgIgAisDaCAAQbDvDGoiAisDYCAAQbCoDmorA2ihIAIrA2ihIAOioDkDaEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHglQhqIgIgAisDcCABQbDvDGoiAisDaCABQbCoDmorA3ChIAIrA3ChIAOioDkDcEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHglQhqIgIgAisDeCAAQbDvDGoiAisDcCAAQbCoDmorA3ihIAIrA3ihIAOioDkDeEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHglQhqIgIgAisDgAEgAUGw7wxqIgIrA3ggAUGwqA5qKwOAAaEgAisDgAGhIAOioDkDgAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgBB4JUIaiICIAIrA4gBIABBsO8MaiICKwOAASAAQbCoDmorA4gBoSACKwOIAaEgA6KgOQOIAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHglQhqIgIgAisDkAEgAUGw7wxqIgIrA4gBIAFBsKgOaisDkAGhIAIrA5ABoSADoqA5A5ABQQEhASAAIQJB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QagBbCIBQbDPDGoiAiACKwOgASABQfD9BmoiAisDmAEgAisDoAGhIAFBwPsMaisDoAGhIAOioDkDoAFBASEBIAAhAkEAIQAgAg0AC0EAIQFBsKAIQbCgCCsDACADRAAAAAAAAAAAoiIEoDkDAEHYoQhB2KEIKwMAIASgOQMAQcCgCEHAoAgrAwAgBKA5AwBByKAIQcigCCsDACAEoDkDAEHooQhB6KEIKwMAIASgOQMAQfChCEHwoQgrAwAgBKA5AwBBASEAQQEhAkEAIQsDQCALQagBbCIKQbCgCGoiCyALKwMgIApB0JQOaisDICAKQeClDmorAyChIApBgPIMaisDIKEgA6KgOQMgIAIhCkEAIQJBASELIAoNAAsDQCABQagBbCIBQbCgCGoiAiACKwMoIAFB0JQOaisDKCABQeClDmorAyihIAFBgPIMaiIBKwMooSABKwMgoCADoqA5AyhBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgBBsKAIaiICIAIrAzAgAEHQlA5qKwMwIABB4KUOaisDMKEgAEGA8gxqIgArAzChIAArAyigIAOioDkDMEEBIQAgASECQQAhASACDQALQbigCEG4oAgrAwAgBKA5AwBB4KEIQeChCCsDACAEoDkDAEEBIQJBACELA0AgC0GoAWwiCkGwoAhqIgsgCysDOCAKQYDyDGoiCysDMCAKQeClDmorAzihIAsrAzihIAOioDkDOCACIQpBACECQQEhCyAKDQALA0AgAUGoAWwiAUGwoAhqIgIgAisDQCABQYDyDGoiAisDOCABQeClDmorA0ChIAIrA0ChIAOioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGwoAhqIgIgAisDSCAAQYDyDGoiAisDQCAAQeClDmorA0ihIAIrA0ihIAOioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGwoAhqIgIgAisDUCABQYDyDGoiAisDSCABQeClDmorA1ChIAIrA1ChIAOioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGwoAhqIgIgAisDWCAAQYDyDGoiAisDUCAAQeClDmorA1ihIAIrA1ihIAOioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGwoAhqIgIgAisDYCABQYDy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",BA(U)||(U=a(U));function iA(C){try{if(C==U&&q)return new Uint8Array(q);var g=wA(C);if(g)return g;if(t)return t(C);throw"both async and sync fetching of the wasm failed"}catch(s){_(s)}}function nA(){if(!q&&(o||K)){if(typeof fetch=="function"&&!oA(U))return fetch(U,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+U+"\'";return C.arrayBuffer()}).catch(function(){return iA(U)});if(G)return new Promise(function(C,g){G(U,function(s){C(new Uint8Array(s))},g)})}return Promise.resolve().then(function(){return iA(U)})}function OA(){var C={a:yA};function g(k,r){var f=k.exports;Q.asm=f,d=Q.asm.f,S(d.buffer),V=Q.asm.o,aA(Q.asm.g),NA()}cA();function s(k){g(k.instance)}function e(k){return nA().then(function(r){return WebAssembly.instantiate(r,C)}).then(function(r){return r}).then(k,function(r){n("failed to asynchronously prepare wasm: "+r),_(r)})}function u(){return!q&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(U)&&!oA(U)&&typeof fetch=="function"?fetch(U,{credentials:"same-origin"}).then(function(k){var r=WebAssembly.instantiateStreaming(k,C);return r.then(s,function(f){return n("wasm streaming compile failed: "+f),n("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var j=Q.instantiateWasm(C,g);return j}catch(k){return n("Module.instantiateWasm callback failed with error: "+k),!1}return u().catch(D),{}}function DA(C){for(;C.length>0;){var g=C.shift();if(typeof g=="function"){g(Q);continue}var s=g.func;typeof s=="number"?g.arg===void 0?MA(s)():MA(s)(g.arg):s(g.arg===void 0?null:g.arg)}}function MA(C){return V.get(C)}function tA(C,g,s){Y.copyWithin(C,g,g+s)}function hA(C){_("OOM")}function uA(C){Y.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,g){var s=AA.buffers[C];g===0||g===10?((C===1?N:n)(F(s,0)),s.length=0):s.push(g)},varargs:void 0,get:function(){AA.varargs+=4;var C=z[AA.varargs-4>>2];return C},getStr:function(C){var g=l(C);return g},get64:function(C,g){return C}};function jA(C){return 0}function zA(C,g,s,e,u){}function fA(C,g,s,e){for(var u=0,j=0;j<s;j++){var k=z[g>>2],r=z[g+4>>2];g+=8;for(var f=0;f<r;f++)AA.printChar(C,Y[k+f]);u+=r}return z[e>>2]=u,0}var qA=typeof atob=="function"?atob:function(C){var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,j,k,r,f,b,L=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do k=g.indexOf(C.charAt(L++)),r=g.indexOf(C.charAt(L++)),f=g.indexOf(C.charAt(L++)),b=g.indexOf(C.charAt(L++)),e=k<<2|r>>4,u=(r&15)<<4|f>>2,j=(f&3)<<6|b,s=s+String.fromCharCode(e),f!==64&&(s=s+String.fromCharCode(u)),b!==64&&(s=s+String.fromCharCode(j));while(L<C.length);return s};function mA(C){try{for(var g=qA(C),s=new Uint8Array(g.length),e=0;e<g.length;++e)s[e]=g.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function wA(C){if(BA(C))return mA(C.slice(EA.length))}var yA={c:tA,d:uA,e:jA,b:zA,a:fA};OA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=R;var QA;W=function C(){QA||gA(),QA||(W=C)};function gA(C){if(v>0||(X(),v>0))return;function g(){QA||(QA=!0,Q.calledRun=!0,!Z&&(kA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),GA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),g()},1)):g()}if(Q.run=gA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return gA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
    for (const g of e) {
      const n = this.modelSpec.implVars.get(g);
      n && r.push(n);
    }
    const o = this.outputs.startTime, Q = this.outputs.endTime, i = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, Q, i);
    B = await this.modelRunner.runModel(this.inputs, B);
    const s = B.runTimeInMillis, a = /* @__PURE__ */ new Map();
    for (const g of e) {
      const n = this.modelSpec.implVars.get(g), E = B.getSeriesForVar(n.varId);
      E && a.set(g, datasetFromPoints(E.points));
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
