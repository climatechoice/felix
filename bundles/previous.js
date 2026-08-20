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
  function a(n) {
    var E = Math.abs(n);
    return E >= o ? w(n, E, o, "day") : E >= r ? w(n, E, r, "hour") : E >= e ? w(n, E, e, "minute") : E >= A ? w(n, E, A, "second") : n + " ms";
  }
  function w(n, E, l, f) {
    var m = E >= l * 1.5;
    return Math.round(n / l) + " " + f + (m ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function A(e) {
    o.debug = o, o.default = o, o.coerce = w, o.disable = s, o.enable = Q, o.enabled = a, o.humanize = requireMs(), o.destroy = n, Object.keys(e).forEach((E) => {
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
      let l, f = null, m, D;
      function g(...I) {
        if (!g.enabled)
          return;
        const t = g, C = Number(/* @__PURE__ */ new Date()), c = C - (l || C);
        t.diff = c, t.prev = l, t.curr = C, l = C, I[0] = o.coerce(I[0]), typeof I[0] != "string" && I.unshift("%O");
        let d = 0;
        I[0] = I[0].replace(/%([a-zA-Z%])/g, (h, p) => {
          if (h === "%%")
            return "%";
          d++;
          const O = o.formatters[p];
          if (typeof O == "function") {
            const j = I[d];
            h = O.call(t, j), I.splice(d, 1), d--;
          }
          return h;
        }), o.formatArgs.call(t, I), (t.log || o.log).apply(t, I);
      }
      return g.namespace = E, g.useColors = o.useColors(), g.color = o.selectColor(E), g.extend = i, g.destroy = o.destroy, Object.defineProperty(g, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (m !== o.namespaces && (m = o.namespaces, D = o.enabled(E)), D),
        set: (I) => {
          f = I;
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
      let f = 0, m = 0, D = -1, g = 0;
      for (; f < E.length; )
        if (m < l.length && (l[m] === E[f] || l[m] === "*"))
          l[m] === "*" ? (D = m, g = f, m++) : (f++, m++);
        else if (D !== -1)
          m = D + 1, g++, f = g;
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
      const w = "color: " + this.color;
      a.splice(1, 0, w, "color: inherit");
      let n = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (n++, l === "%c" && (E = n));
      }), a.splice(E, 0, w);
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
        const w = !Q;
        if (Q = !0, !w || i)
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
              const n = i.indexOf(w);
              n >= 0 && i.splice(n, 1), B();
            }
          });
          i.push(w);
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
      const a = (n) => {
        if (!Q) {
          Q = !0;
          try {
            B(i(n));
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
        return Q = !0, B(i(this.rejection));
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
      n.done ? Q(n.value) : i(n.value).then(s, a);
    }
    w((o = o.apply(A, e || [])).next());
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
      n.done ? Q(n.value) : i(n.value).then(s, a);
    }
    w((o = o.apply(A, [])).next());
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
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = w[0] & 2 ? i.return : w[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, w[1])).done) return Q;
      switch (i = 0, Q && (w = [w[0] & 2, Q.value]), w[0]) {
        case 0:
        case 1:
          Q = w;
          break;
        case 4:
          return r.label++, { value: w[1], done: !1 };
        case 5:
          r.label++, i = w[1], w = [0];
          continue;
        case 7:
          w = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!Q || w[1] > Q[0] && w[1] < Q[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = w;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(w);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], i = 0;
    } finally {
      o = Q = 0;
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
    var w;
    a !== o && (o = a, (w = i.onSet) == null || w.call(i));
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
    for (let w = 0; w < a; w++)
      e[o++] = s[w];
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
          for (const n of s)
            a.push(n.subscripts);
          const w = cartesianProductOf(a);
          for (const n of w) {
            const E = n.map((m) => m.id).join(","), l = n.map((m) => m.index), f = `${Q}[${E}]`;
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
      for (const h of r.lookups)
        resolveVarRef(this.listing, h.varRef, "lookup");
      const u = getEncodedLookupBufferLengths(r.lookups);
      s = u.lookupsLength, a = u.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let w = 0;
    function n(u, h) {
      const p = w, O = u === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, j = Math.round(h * O), F = Math.ceil(j / 8) * 8;
      return w += F, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), m = n("float64", i), D = n("int32", Q), g = n("float64", s), I = n("int32", a), t = w;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const u = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(u), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const C = this.header.view;
    let c = 0;
    C[c++] = l, C[c++] = extrasLengthInElements, C[c++] = f, C[c++] = o, C[c++] = m, C[c++] = i, C[c++] = D, C[c++] = Q, C[c++] = g, C[c++] = s, C[c++] = I, C[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, i), this.outputIndices.update(this.encoded, D, Q), this.lookups.update(this.encoded, g, s), this.lookupIndices.update(this.encoded, I, a);
    const d = this.inputs.view;
    for (let u = 0; u < A.length; u++) {
      const h = A[u];
      typeof h == "number" ? d[u] = h : d[u] = h.get();
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
    const Q = o[i++], B = o[i++], s = o[i++], a = o[i++], w = o[i++], n = o[i++], E = o[i++], l = o[i++], f = o[i++], m = o[i++], D = o[i++], g = o[i++], I = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, C = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, u = g * Int32Array.BYTES_PER_ELEMENT, h = e + I + t + C + c + d + u;
    if (A.byteLength < h)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, Q, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, w, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, m), this.lookupIndices.update(this.encoded, D, g);
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
    runModel: async (s, a, w) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (Q)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      Q = !0, i.updateFromParams(s, a, w);
      let n;
      try {
        n = await e.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        Q = !1;
      }
      return i.updateFromEncodedBuffer(n), i.finalizeOutputs(a), a;
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
    function i(I, ...t) {
      const C = [I[0]];
      let c = 0;
      for (; c < t.length; )
        s(C, t[c]), C.push(I[++c]);
      return new o(C);
    }
    A._ = i;
    const Q = new o("+");
    function B(I, ...t) {
      const C = [f(I[0])];
      let c = 0;
      for (; c < t.length; )
        C.push(Q), s(C, t[c]), C.push(Q, f(I[++c]));
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
        if (I[t] === Q) {
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
    function m(I) {
      return typeof I == "string" && A.IDENTIFIER.test(I) ? new o(`.${I}`) : i`[${I}]`;
    }
    A.getProperty = m;
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
    class i {
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
    A.Scope = i;
    class Q extends e.Name {
      constructor(w, n) {
        super(n), this.prefix = w;
      }
      setValue(w, { property: n, itemIndex: E }) {
        this.value = w, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = Q;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(w) {
        super(w), this._values = {}, this._scope = w.scope, this.opts = { ...w, _n: w.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(w) {
        return new Q(w, this._newName(w));
      }
      value(w, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(w), { prefix: f } = l, m = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let D = this._values[f];
        if (D) {
          const t = D.get(m);
          if (t)
            return t;
        } else
          D = this._values[f] = /* @__PURE__ */ new Map();
        D.set(m, l);
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
        for (const m in w) {
          const D = w[m];
          if (!D)
            continue;
          const g = E[m] = E[m] || /* @__PURE__ */ new Map();
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
      optimizeNames(M, K) {
        return this;
      }
    }
    class B extends Q {
      constructor(M, K, y) {
        super(), this.varKind = M, this.name = K, this.rhs = y;
      }
      render({ es5: M, _n: K }) {
        const y = M ? r.varKinds.var : this.varKind, L = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${y} ${this.name}${L};` + K;
      }
      optimizeNames(M, K) {
        if (M[this.name.str])
          return this.rhs && (this.rhs = Y(this.rhs, M, K)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends Q {
      constructor(M, K, y) {
        super(), this.lhs = M, this.rhs = K, this.sideEffects = y;
      }
      render({ _n: M }) {
        return `${this.lhs} = ${this.rhs};` + M;
      }
      optimizeNames(M, K) {
        if (!(this.lhs instanceof e.Name && !M[this.lhs.str] && !this.sideEffects))
          return this.rhs = Y(this.rhs, M, K), this;
      }
      get names() {
        const M = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return U(M, this.rhs);
      }
    }
    class a extends s {
      constructor(M, K, y, L) {
        super(M, y, L), this.op = K;
      }
      render({ _n: M }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + M;
      }
    }
    class w extends Q {
      constructor(M) {
        super(), this.label = M, this.names = {};
      }
      render({ _n: M }) {
        return `${this.label}:` + M;
      }
    }
    class n extends Q {
      constructor(M) {
        super(), this.label = M, this.names = {};
      }
      render({ _n: M }) {
        return `break${this.label ? ` ${this.label}` : ""};` + M;
      }
    }
    class E extends Q {
      constructor(M) {
        super(), this.error = M;
      }
      render({ _n: M }) {
        return `throw ${this.error};` + M;
      }
      get names() {
        return this.error.names;
      }
    }
    class l extends Q {
      constructor(M) {
        super(), this.code = M;
      }
      render({ _n: M }) {
        return `${this.code};` + M;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(M, K) {
        return this.code = Y(this.code, M, K), this;
      }
      get names() {
        return this.code instanceof e._CodeOrName ? this.code.names : {};
      }
    }
    class f extends Q {
      constructor(M = []) {
        super(), this.nodes = M;
      }
      render(M) {
        return this.nodes.reduce((K, y) => K + y.render(M), "");
      }
      optimizeNodes() {
        const { nodes: M } = this;
        let K = M.length;
        for (; K--; ) {
          const y = M[K].optimizeNodes();
          Array.isArray(y) ? M.splice(K, 1, ...y) : y ? M[K] = y : M.splice(K, 1);
        }
        return M.length > 0 ? this : void 0;
      }
      optimizeNames(M, K) {
        const { nodes: y } = this;
        let L = y.length;
        for (; L--; ) {
          const b = y[L];
          b.optimizeNames(M, K) || (T(M, b.names), y.splice(L, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((M, K) => S(M, K.names), {});
      }
    }
    class m extends f {
      render(M) {
        return "{" + M._n + super.render(M) + "}" + M._n;
      }
    }
    class D extends f {
    }
    class g extends m {
    }
    g.kind = "else";
    class I extends m {
      constructor(M, K) {
        super(K), this.condition = M;
      }
      render(M) {
        let K = `if(${this.condition})` + super.render(M);
        return this.else && (K += "else " + this.else.render(M)), K;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const M = this.condition;
        if (M === !0)
          return this.nodes;
        let K = this.else;
        if (K) {
          const y = K.optimizeNodes();
          K = this.else = Array.isArray(y) ? new g(y) : y;
        }
        if (K)
          return M === !1 ? K instanceof I ? K : K.nodes : this.nodes.length ? this : new I(rA(M), K instanceof I ? [K] : K.nodes);
        if (!(M === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(M, K) {
        var y;
        if (this.else = (y = this.else) === null || y === void 0 ? void 0 : y.optimizeNames(M, K), !!(super.optimizeNames(M, K) || this.else))
          return this.condition = Y(this.condition, M, K), this;
      }
      get names() {
        const M = super.names;
        return U(M, this.condition), this.else && S(M, this.else.names), M;
      }
    }
    I.kind = "if";
    class t extends m {
    }
    t.kind = "for";
    class C extends t {
      constructor(M) {
        super(), this.iteration = M;
      }
      render(M) {
        return `for(${this.iteration})` + super.render(M);
      }
      optimizeNames(M, K) {
        if (super.optimizeNames(M, K))
          return this.iteration = Y(this.iteration, M, K), this;
      }
      get names() {
        return S(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(M, K, y, L) {
        super(), this.varKind = M, this.name = K, this.from = y, this.to = L;
      }
      render(M) {
        const K = M.es5 ? r.varKinds.var : this.varKind, { name: y, from: L, to: b } = this;
        return `for(${K} ${y}=${L}; ${y}<${b}; ${y}++)` + super.render(M);
      }
      get names() {
        const M = U(super.names, this.from);
        return U(M, this.to);
      }
    }
    class d extends t {
      constructor(M, K, y, L) {
        super(), this.loop = M, this.varKind = K, this.name = y, this.iterable = L;
      }
      render(M) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(M);
      }
      optimizeNames(M, K) {
        if (super.optimizeNames(M, K))
          return this.iterable = Y(this.iterable, M, K), this;
      }
      get names() {
        return S(super.names, this.iterable.names);
      }
    }
    class u extends m {
      constructor(M, K, y) {
        super(), this.name = M, this.args = K, this.async = y;
      }
      render(M) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(M);
      }
    }
    u.kind = "func";
    class h extends f {
      render(M) {
        return "return " + super.render(M);
      }
    }
    h.kind = "return";
    class p extends m {
      render(M) {
        let K = "try" + super.render(M);
        return this.catch && (K += this.catch.render(M)), this.finally && (K += this.finally.render(M)), K;
      }
      optimizeNodes() {
        var M, K;
        return super.optimizeNodes(), (M = this.catch) === null || M === void 0 || M.optimizeNodes(), (K = this.finally) === null || K === void 0 || K.optimizeNodes(), this;
      }
      optimizeNames(M, K) {
        var y, L;
        return super.optimizeNames(M, K), (y = this.catch) === null || y === void 0 || y.optimizeNames(M, K), (L = this.finally) === null || L === void 0 || L.optimizeNames(M, K), this;
      }
      get names() {
        const M = super.names;
        return this.catch && S(M, this.catch.names), this.finally && S(M, this.finally.names), M;
      }
    }
    class O extends m {
      constructor(M) {
        super(), this.error = M;
      }
      render(M) {
        return `catch(${this.error})` + super.render(M);
      }
    }
    O.kind = "catch";
    class j extends m {
      render(M) {
        return "finally" + super.render(M);
      }
    }
    j.kind = "finally";
    class F {
      constructor(M, K = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...K, _n: K.lines ? `
` : "" }, this._extScope = M, this._scope = new r.Scope({ parent: M }), this._nodes = [new D()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(M) {
        return this._scope.name(M);
      }
      // reserves unique name in the external scope
      scopeName(M) {
        return this._extScope.name(M);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(M, K) {
        const y = this._extScope.value(M, K);
        return (this._values[y.prefix] || (this._values[y.prefix] = /* @__PURE__ */ new Set())).add(y), y;
      }
      getScopeValue(M, K) {
        return this._extScope.getValue(M, K);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(M) {
        return this._extScope.scopeRefs(M, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(M, K, y, L) {
        const b = this._scope.toName(K);
        return y !== void 0 && L && (this._constants[b.str] = y), this._leafNode(new B(M, b, y)), b;
      }
      // `const` declaration (`var` in es5 mode)
      const(M, K, y) {
        return this._def(r.varKinds.const, M, K, y);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(M, K, y) {
        return this._def(r.varKinds.let, M, K, y);
      }
      // `var` declaration with optional assignment
      var(M, K, y) {
        return this._def(r.varKinds.var, M, K, y);
      }
      // assignment code
      assign(M, K, y) {
        return this._leafNode(new s(M, K, y));
      }
      // `+=` code
      add(M, K) {
        return this._leafNode(new a(M, A.operators.ADD, K));
      }
      // appends passed SafeExpr to code or executes Block
      code(M) {
        return typeof M == "function" ? M() : M !== e.nil && this._leafNode(new l(M)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...M) {
        const K = ["{"];
        for (const [y, L] of M)
          K.length > 1 && K.push(","), K.push(y), (y !== L || this.opts.es5) && (K.push(":"), (0, e.addCodeArg)(K, L));
        return K.push("}"), new e._Code(K);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(M, K, y) {
        if (this._blockNode(new I(M)), K && y)
          this.code(K).else().code(y).endIf();
        else if (K)
          this.code(K).endIf();
        else if (y)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(M) {
        return this._elseNode(new I(M));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new g());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(I, g);
      }
      _for(M, K) {
        return this._blockNode(M), K && this.code(K).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(M, K) {
        return this._for(new C(M), K);
      }
      // `for` statement for a range of values
      forRange(M, K, y, L, b = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(M);
        return this._for(new c(b, J, K, y), () => L(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(M, K, y, L = r.varKinds.const) {
        const b = this._scope.toName(M);
        if (this.opts.es5) {
          const J = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(b, (0, e._)`${J}[${Z}]`), y(b);
          });
        }
        return this._for(new d("of", L, b, K), () => y(b));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(M, K, y, L = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(M, (0, e._)`Object.keys(${K})`, y);
        const b = this._scope.toName(M);
        return this._for(new d("in", L, b, K), () => y(b));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(t);
      }
      // `label` statement
      label(M) {
        return this._leafNode(new w(M));
      }
      // `break` statement
      break(M) {
        return this._leafNode(new n(M));
      }
      // `return` statement
      return(M) {
        const K = new h();
        if (this._blockNode(K), this.code(M), K.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(h);
      }
      // `try` statement
      try(M, K, y) {
        if (!K && !y)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const L = new p();
        if (this._blockNode(L), this.code(M), K) {
          const b = this.name("e");
          this._currNode = L.catch = new O(b), K(b);
        }
        return y && (this._currNode = L.finally = new j(), this.code(y)), this._endBlockNode(O, j);
      }
      // `throw` statement
      throw(M) {
        return this._leafNode(new E(M));
      }
      // start self-balancing block
      block(M, K) {
        return this._blockStarts.push(this._nodes.length), M && this.code(M).endBlock(K), this;
      }
      // end the current self-balancing block
      endBlock(M) {
        const K = this._blockStarts.pop();
        if (K === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const y = this._nodes.length - K;
        if (y < 0 || M !== void 0 && y !== M)
          throw new Error(`CodeGen: wrong number of nodes: ${y} vs ${M} expected`);
        return this._nodes.length = K, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(M, K = e.nil, y, L) {
        return this._blockNode(new u(M, K, y)), L && this.code(L).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(u);
      }
      optimize(M = 1) {
        for (; M-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(M) {
        return this._currNode.nodes.push(M), this;
      }
      _blockNode(M) {
        this._currNode.nodes.push(M), this._nodes.push(M);
      }
      _endBlockNode(M, K) {
        const y = this._currNode;
        if (y instanceof M || K && y instanceof K)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${K ? `${M.kind}/${K.kind}` : M.kind}"`);
      }
      _elseNode(M) {
        const K = this._currNode;
        if (!(K instanceof I))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = K.else = M, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const M = this._nodes;
        return M[M.length - 1];
      }
      set _currNode(M) {
        const K = this._nodes;
        K[K.length - 1] = M;
      }
    }
    A.CodeGen = F;
    function S(N, M) {
      for (const K in M)
        N[K] = (N[K] || 0) + (M[K] || 0);
      return N;
    }
    function U(N, M) {
      return M instanceof e._CodeOrName ? S(N, M.names) : N;
    }
    function Y(N, M, K) {
      if (N instanceof e.Name)
        return y(N);
      if (!L(N))
        return N;
      return new e._Code(N._items.reduce((b, J) => (J instanceof e.Name && (J = y(J)), J instanceof e._Code ? b.push(...J._items) : b.push(J), b), []));
      function y(b) {
        const J = K[b.str];
        return J === void 0 || M[b.str] !== 1 ? b : (delete M[b.str], J);
      }
      function L(b) {
        return b instanceof e._Code && b._items.some((J) => J instanceof e.Name && M[J.str] === 1 && K[J.str] !== void 0);
      }
    }
    function T(N, M) {
      for (const K in M)
        N[K] = (N[K] || 0) - (M[K] || 0);
    }
    function rA(N) {
      return typeof N == "boolean" || typeof N == "number" || N === null ? !N : (0, e._)`!${_(N)}`;
    }
    A.not = rA;
    const oA = G(A.operators.AND);
    function x(...N) {
      return N.reduce(oA);
    }
    A.and = x;
    const QA = G(A.operators.OR);
    function v(...N) {
      return N.reduce(QA);
    }
    A.or = v;
    function G(N) {
      return (M, K) => M === e.nil ? K : K === e.nil ? M : (0, e._)`${_(M)} ${N} ${_(K)}`;
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
    const u = {};
    for (const h of d)
      u[h] = !0;
    return u;
  }
  util.toHash = r;
  function o(d, u) {
    return typeof u == "boolean" ? u : Object.keys(u).length === 0 ? !0 : (i(d, u), !Q(u, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function i(d, u = d.schema) {
    const { opts: h, self: p } = d;
    if (!h.strictSchema || typeof u == "boolean")
      return;
    const O = p.RULES.keywords;
    for (const j in u)
      O[j] || c(d, `unknown keyword: "${j}"`);
  }
  util.checkUnknownRules = i;
  function Q(d, u) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (u[h])
        return !0;
    return !1;
  }
  util.schemaHasRules = Q;
  function B(d, u) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (h !== "$ref" && u.all[h])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: u }, h, p, O) {
    if (!O) {
      if (typeof h == "number" || typeof h == "boolean")
        return h;
      if (typeof h == "string")
        return (0, A._)`${h}`;
    }
    return (0, A._)`${d}${u}${(0, A.getProperty)(p)}`;
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
  function l(d, u) {
    if (Array.isArray(d))
      for (const h of d)
        u(h);
    else
      u(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: u, mergeValues: h, resultToName: p }) {
    return (O, j, F, S) => {
      const U = F === void 0 ? j : F instanceof A.Name ? (j instanceof A.Name ? d(O, j, F) : u(O, j, F), F) : j instanceof A.Name ? (u(O, F, j), j) : h(j, F);
      return S === A.Name && !(U instanceof A.Name) ? p(O, U) : U;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, u, h) => d.if((0, A._)`${h} !== true && ${u} !== undefined`, () => {
        d.if((0, A._)`${u} === true`, () => d.assign(h, !0), () => d.assign(h, (0, A._)`${h} || {}`).code((0, A._)`Object.assign(${h}, ${u})`));
      }),
      mergeToName: (d, u, h) => d.if((0, A._)`${h} !== true`, () => {
        u === !0 ? d.assign(h, !0) : (d.assign(h, (0, A._)`${h} || {}`), D(d, h, u));
      }),
      mergeValues: (d, u) => d === !0 ? !0 : { ...d, ...u },
      resultToName: m
    }),
    items: f({
      mergeNames: (d, u, h) => d.if((0, A._)`${h} !== true && ${u} !== undefined`, () => d.assign(h, (0, A._)`${u} === true ? true : ${h} > ${u} ? ${h} : ${u}`)),
      mergeToName: (d, u, h) => d.if((0, A._)`${h} !== true`, () => d.assign(h, u === !0 ? !0 : (0, A._)`${h} > ${u} ? ${h} : ${u}`)),
      mergeValues: (d, u) => d === !0 ? !0 : Math.max(d, u),
      resultToName: (d, u) => d.var("items", u)
    })
  };
  function m(d, u) {
    if (u === !0)
      return d.var("props", !0);
    const h = d.var("props", (0, A._)`{}`);
    return u !== void 0 && D(d, h, u), h;
  }
  util.evaluatedPropsToName = m;
  function D(d, u, h) {
    Object.keys(h).forEach((p) => d.assign((0, A._)`${u}${(0, A.getProperty)(p)}`, !0));
  }
  util.setEvaluated = D;
  const g = {};
  function I(d, u) {
    return d.scopeValue("func", {
      ref: u,
      code: g[u.code] || (g[u.code] = new e._Code(u.code))
    });
  }
  util.useFunc = I;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function C(d, u, h) {
    if (d instanceof A.Name) {
      const p = u === t.Num;
      return h ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return h ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = C;
  function c(d, u, h = d.opts.strictSchema) {
    if (h) {
      if (u = `strict mode: ${u}`, h === !0)
        throw new Error(u);
      d.self.logger.warn(u);
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
    function i(g, I = A.keywordError, t, C) {
      const { it: c } = g, { gen: d, compositeRule: u, allErrors: h } = c, p = E(g, I, t);
      C ?? (u || h) ? a(d, p) : w(c, (0, e._)`[${p}]`);
    }
    A.reportError = i;
    function Q(g, I = A.keywordError, t) {
      const { it: C } = g, { gen: c, compositeRule: d, allErrors: u } = C, h = E(g, I, t);
      a(c, h), d || u || w(C, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function B(g, I) {
      g.assign(o.default.errors, I), g.if((0, e._)`${o.default.vErrors} !== null`, () => g.if(I, () => g.assign((0, e._)`${o.default.vErrors}.length`, I), () => g.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: g, keyword: I, schemaValue: t, data: C, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const u = g.name("err");
      g.forRange("i", c, o.default.errors, (h) => {
        g.const(u, (0, e._)`${o.default.vErrors}[${h}]`), g.if((0, e._)`${u}.instancePath === undefined`, () => g.assign((0, e._)`${u}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), g.assign((0, e._)`${u}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${I}`), d.opts.verbose && (g.assign((0, e._)`${u}.schema`, t), g.assign((0, e._)`${u}.data`, C));
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
        m(g, t)
      ];
      return D(g, I, d), C.object(...d);
    }
    function f({ errorPath: g }, { instancePath: I }) {
      const t = I ? (0, e.str)`${g}${(0, r.getErrorPath)(I, r.Type.Str)}` : g;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function m({ keyword: g, it: { errSchemaPath: I } }, { schemaPath: t, parentSchema: C }) {
      let c = C ? I : (0, e.str)`${I}/${g}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function D(g, { params: I, message: t }, C) {
      const { keyword: c, data: d, schemaValue: u, it: h } = g, { opts: p, propertyName: O, topSchemaRef: j, schemaPath: F } = h;
      C.push([n.keyword, c], [n.params, typeof I == "function" ? I(g) : I || (0, e._)`{}`]), p.messages && C.push([n.message, typeof t == "function" ? t(g) : t]), p.verbose && C.push([n.schema, u], [n.parentSchema, (0, e._)`${j}${F}`], [o.default.data, d]), O && C.push([n.propertyName, O]);
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
    const { gen: a, schema: w, validateName: n } = s;
    w === !1 ? B(s, !1) : typeof w == "object" && w.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function Q(s, a) {
    const { gen: w, schema: n } = s;
    n === !1 ? (w.var(a, !1), B(s)) : w.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = Q;
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
    const { gen: c, data: d, opts: u } = t, h = n(C, u.coerceTypes), p = C.length > 0 && !(h.length === 0 && C.length === 1 && (0, e.schemaHasRulesForType)(t, C[0]));
    if (p) {
      const O = m(C, d, u.strictNumbers, Q.Wrong);
      c.if(O, () => {
        h.length ? E(t, C, h) : g(t);
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
    const { gen: d, data: u, opts: h } = t, p = d.let("dataType", (0, o._)`typeof ${u}`), O = d.let("coerced", (0, o._)`undefined`);
    h.coerceTypes === "array" && d.if((0, o._)`${p} == 'object' && Array.isArray(${u}) && ${u}.length == 1`, () => d.assign(u, (0, o._)`${u}[0]`).assign(p, (0, o._)`typeof ${u}`).if(m(C, u, h.strictNumbers), () => d.assign(O, u))), d.if((0, o._)`${O} !== undefined`);
    for (const F of c)
      (w.has(F) || F === "array" && h.coerceTypes === "array") && j(F);
    d.else(), g(t), d.endIf(), d.if((0, o._)`${O} !== undefined`, () => {
      d.assign(u, O), l(t, O);
    });
    function j(F) {
      switch (F) {
        case "string":
          d.elseIf((0, o._)`${p} == "number" || ${p} == "boolean"`).assign(O, (0, o._)`"" + ${u}`).elseIf((0, o._)`${u} === null`).assign(O, (0, o._)`""`);
          return;
        case "number":
          d.elseIf((0, o._)`${p} == "boolean" || ${u} === null
              || (${p} == "string" && ${u} && ${u} == +${u})`).assign(O, (0, o._)`+${u}`);
          return;
        case "integer":
          d.elseIf((0, o._)`${p} === "boolean" || ${u} === null
              || (${p} === "string" && ${u} && ${u} == +${u} && !(${u} % 1))`).assign(O, (0, o._)`+${u}`);
          return;
        case "boolean":
          d.elseIf((0, o._)`${u} === "false" || ${u} === 0 || ${u} === null`).assign(O, !1).elseIf((0, o._)`${u} === "true" || ${u} === 1`).assign(O, !0);
          return;
        case "null":
          d.elseIf((0, o._)`${u} === "" || ${u} === 0 || ${u} === false`), d.assign(O, null);
          return;
        case "array":
          d.elseIf((0, o._)`${p} === "string" || ${p} === "number"
              || ${p} === "boolean" || ${u} === null`).assign(O, (0, o._)`[${u}]`);
      }
    }
  }
  function l({ gen: t, parentData: C, parentDataProperty: c }, d) {
    t.if((0, o._)`${C} !== undefined`, () => t.assign((0, o._)`${C}[${c}]`, d));
  }
  function f(t, C, c, d = Q.Correct) {
    const u = d === Q.Correct ? o.operators.EQ : o.operators.NEQ;
    let h;
    switch (t) {
      case "null":
        return (0, o._)`${C} ${u} null`;
      case "array":
        h = (0, o._)`Array.isArray(${C})`;
        break;
      case "object":
        h = (0, o._)`${C} && typeof ${C} == "object" && !Array.isArray(${C})`;
        break;
      case "integer":
        h = p((0, o._)`!(${C} % 1) && !isNaN(${C})`);
        break;
      case "number":
        h = p();
        break;
      default:
        return (0, o._)`typeof ${C} ${u} ${t}`;
    }
    return d === Q.Correct ? h : (0, o.not)(h);
    function p(O = o.nil) {
      return (0, o.and)((0, o._)`typeof ${C} == "number"`, O, c ? (0, o._)`isFinite(${C})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function m(t, C, c, d) {
    if (t.length === 1)
      return f(t[0], C, c, d);
    let u;
    const h = (0, i.toHash)(t);
    if (h.array && h.object) {
      const p = (0, o._)`typeof ${C} != "object"`;
      u = h.null ? p : (0, o._)`!${C} || ${p}`, delete h.null, delete h.array, delete h.object;
    } else
      u = o.nil;
    h.number && delete h.integer;
    for (const p in h)
      u = (0, o.and)(u, f(p, C, c, d));
    return u;
  }
  dataType.checkDataTypes = m;
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
    const { gen: C, data: c, schema: d } = t, u = (0, i.schemaRefOrVal)(t, d, "type");
    return {
      gen: C,
      keyword: "type",
      data: c,
      schema: d.type,
      schemaCode: u,
      schemaValue: u,
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
    else Q === "array" && Array.isArray(s) && s.forEach((a, w) => o(i, w, a.default));
  }
  defaults.assignDefaults = r;
  function o(i, Q, B) {
    const { gen: s, compositeRule: a, data: w, opts: n } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${w}${(0, A.getProperty)(Q)}`;
    if (a) {
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
  function i(t, C) {
    const { gen: c, data: d, it: u } = t;
    c.if(n(c, d, C, u.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${C}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function Q({ gen: t, data: C, it: { opts: c } }, d, u) {
    return (0, A.or)(...d.map((h) => (0, A.and)(n(t, C, h, c.ownProperties), (0, A._)`${u} = ${h}`)));
  }
  code.checkMissingProp = Q;
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
    const u = (0, A._)`${C}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${u} && ${a(t, C, c)}` : u;
  }
  code.propertyInData = w;
  function n(t, C, c, d) {
    const u = (0, A._)`${C}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(u, (0, A.not)(a(t, C, c))) : u;
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
  function f({ schemaCode: t, data: C, it: { gen: c, topSchemaRef: d, schemaPath: u, errorPath: h }, it: p }, O, j, F) {
    const S = F ? (0, A._)`${t}, ${C}, ${d}${u}` : C, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, h)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...U)}`;
    return j !== A.nil ? (0, A._)`${O}.call(${j}, ${Y})` : (0, A._)`${O}(${Y})`;
  }
  code.callValidateCode = f;
  const m = (0, A._)`new RegExp`;
  function D({ gen: t, it: { opts: C } }, c) {
    const d = C.unicodeRegExp ? "u" : "", { regExp: u } = C.code, h = u(c, d);
    return t.scopeValue("pattern", {
      key: h.toString(),
      ref: h,
      code: (0, A._)`${u.code === "new RegExp" ? m : (0, o.useFunc)(t, u)}(${c}, ${d})`
    });
  }
  code.usePattern = D;
  function g(t) {
    const { gen: C, data: c, keyword: d, it: u } = t, h = C.name("valid");
    if (u.allErrors) {
      const O = C.let("valid", !0);
      return p(() => C.assign(O, !1)), O;
    }
    return C.var(h, !0), p(() => C.break()), h;
    function p(O) {
      const j = C.const("len", (0, A._)`${c}.length`);
      C.forRange("i", 0, j, (F) => {
        t.subschema({
          keyword: d,
          dataProp: F,
          dataPropType: e.Type.Num
        }, h), C.if((0, A.not)(h), O);
      });
    }
  }
  code.validateArray = g;
  function I(t) {
    const { gen: C, schema: c, keyword: d, it: u } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((j) => (0, e.alwaysValidSchema)(u, j)) && !u.opts.unevaluated)
      return;
    const p = C.let("valid", !1), O = C.name("_valid");
    C.block(() => c.forEach((j, F) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: F,
        compositeRule: !0
      }, O);
      C.assign(p, (0, A._)`${p} || ${O}`), t.mergeValidEvaluated(S, O) || C.if((0, A.not)(p));
    })), t.result(p, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = I, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function i(l, f) {
    const { gen: m, keyword: D, schema: g, parentSchema: I, it: t } = l, C = f.macro.call(t.self, g, I, t), c = w(m, D, C);
    t.opts.validateSchema !== !1 && t.self.validateSchema(C, !0);
    const d = m.name("valid");
    l.subschema({
      schema: C,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${D}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = i;
  function Q(l, f) {
    var m;
    const { gen: D, keyword: g, schema: I, parentSchema: t, $data: C, it: c } = l;
    a(c, f);
    const d = !C && f.compile ? f.compile.call(c.self, I, t, c) : f.validate, u = w(D, g, d), h = D.let("valid");
    l.block$data(h, p), l.ok((m = f.valid) !== null && m !== void 0 ? m : h);
    function p() {
      if (f.errors === !1)
        F(), f.modifying && B(l), S(() => l.error());
      else {
        const U = f.async ? O() : j();
        f.modifying && B(l), S(() => s(l, U));
      }
    }
    function O() {
      const U = D.let("ruleErrs", null);
      return D.try(() => F((0, A._)`await `), (Y) => D.assign(h, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => D.assign(U, (0, A._)`${Y}.errors`), () => D.throw(Y))), U;
    }
    function j() {
      const U = (0, A._)`${u}.errors`;
      return D.assign(U, null), F(A.nil), U;
    }
    function F(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, T = !("compile" in f && !C || f.schema === !1);
      D.assign(h, (0, A._)`${U}${(0, r.callValidateCode)(l, u, Y, T)}`, f.modifying);
    }
    function S(U) {
      var Y;
      D.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : h), U);
    }
  }
  keyword.funcKeywordCode = Q;
  function B(l) {
    const { gen: f, data: m, it: D } = l;
    f.if(D.parentData, () => f.assign(m, (0, A._)`${D.parentData}[${D.parentDataProperty}]`));
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
  function w(l, f, m) {
    if (m === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof m == "function" ? { ref: m } : { ref: m, code: (0, A.stringify)(m) });
  }
  function n(l, f, m = !1) {
    return !f.length || f.some((D) => D === "array" ? Array.isArray(l) : D === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == D || m && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: m, errSchemaPath: D }, g, I) {
    if (Array.isArray(g.keyword) ? !g.keyword.includes(I) : g.keyword !== I)
      throw new Error("ajv implementation error");
    const t = g.dependencies;
    if (t?.some((C) => !Object.prototype.hasOwnProperty.call(l, C)))
      throw new Error(`parent schema must have dependencies of ${I}: ${t.join(",")}`);
    if (g.validateSchema && !g.validateSchema(l[I])) {
      const c = `keyword "${I}" value is invalid at path "${D}": ` + m.errorsText(g.validateSchema.errors);
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
  function r(Q, { keyword: B, schemaProp: s, schema: a, schemaPath: w, errSchemaPath: n, topSchemaRef: E }) {
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
  function o(Q, B, { dataProp: s, dataPropType: a, data: w, dataTypes: n, propertyName: E }) {
    if (w !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: m, dataPathArr: D, opts: g } = B, I = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(I), Q.errorPath = (0, A.str)`${m}${(0, e.getErrorPath)(s, a, g.jsPropertySyntax)}`, Q.parentDataProperty = (0, A._)`${s}`, Q.dataPathArr = [...D, Q.parentDataProperty];
    }
    if (w !== void 0) {
      const m = w instanceof A.Name ? w : l.let("data", w, !0);
      f(m), E !== void 0 && (Q.propertyName = E);
    }
    n && (Q.dataTypes = n);
    function f(m) {
      Q.data = m, Q.dataLevel = B.dataLevel + 1, Q.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), Q.parentData = B.data, Q.dataNames = [...B.dataNames, m];
    }
  }
  subschema.extendSubschemaData = o;
  function i(Q, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: w, allErrors: n }) {
    a !== void 0 && (Q.compositeRule = a), w !== void 0 && (Q.createErrors = w), n !== void 0 && (Q.allErrors = n), Q.jtdDiscriminator = B, Q.jtdMetadata = s;
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
  function e(o, i, Q, B, s, a, w, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, a, w, n, E, l);
      for (var f in B) {
        var m = B[f];
        if (Array.isArray(m)) {
          if (f in A.arrayKeywords)
            for (var D = 0; D < m.length; D++)
              e(o, i, Q, m[D], s + "/" + f + "/" + D, a, s, f, B, D);
        } else if (f in A.propsKeywords) {
          if (m && typeof m == "object")
            for (var g in m)
              e(o, i, Q, m[g], s + "/" + f + "/" + r(g), a, s, f, B, g);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, i, Q, m, s + "/" + f, a, s, f, B);
      }
      Q(B, s, a, w, n, E, l);
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
  function m(D, g) {
    if (typeof D == "boolean")
      return {};
    const { schemaId: I, uriResolver: t } = this.opts, C = E(D[I] || g), c = { "": C }, d = a(t, C, !1), u = {}, h = /* @__PURE__ */ new Set();
    return r(D, { allKeys: !0 }, (j, F, S, U) => {
      if (U === void 0)
        return;
      const Y = d + F;
      let T = c[U];
      typeof j[I] == "string" && (T = rA.call(this, j[I])), oA.call(this, j.$anchor), oA.call(this, j.$dynamicAnchor), c[F] = T;
      function rA(x) {
        const QA = this.opts.uriResolver.resolve;
        if (x = E(T ? QA(T, x) : x), h.has(x))
          throw O(x);
        h.add(x);
        let v = this.refs[x];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? p(j, v.schema, x) : x !== E(Y) && (x[0] === "#" ? (p(j, u[x], x), u[x] = j) : this.refs[x] = Y), x;
      }
      function oA(x) {
        if (typeof x == "string") {
          if (!f.test(x))
            throw new Error(`invalid anchor "${x}"`);
          rA.call(this, `#${x}`);
        }
      }
    }), u;
    function p(j, F, S) {
      if (F !== void 0 && !e(j, F))
        throw O(S);
    }
    function O(j) {
      return new Error(`reference "${j}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = m, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), i = requireDefaults(), Q = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), w = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (h(k), c(k))) {
      g(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: P, schema: H, schemaEnv: q, opts: z }, R) {
    z.code.es5 ? k.func(P, (0, s._)`${a.default.data}, ${a.default.valCxt}`, q.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, z)}`), D(k, z), k.code(R);
    }) : k.func(P, (0, s._)`${a.default.data}, ${m(z)}`, q.$async, () => k.code(t(H, z)).code(R));
  }
  function m(k) {
    return (0, s._)`{${a.default.instancePath}="", ${a.default.parentData}, ${a.default.parentDataProperty}, ${a.default.rootData}=${a.default.data}${k.dynamicRef ? (0, s._)`, ${a.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function D(k, P) {
    k.if(a.default.valCxt, () => {
      k.var(a.default.instancePath, (0, s._)`${a.default.valCxt}.${a.default.instancePath}`), k.var(a.default.parentData, (0, s._)`${a.default.valCxt}.${a.default.parentData}`), k.var(a.default.parentDataProperty, (0, s._)`${a.default.valCxt}.${a.default.parentDataProperty}`), k.var(a.default.rootData, (0, s._)`${a.default.valCxt}.${a.default.rootData}`), P.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`${a.default.valCxt}.${a.default.dynamicAnchors}`);
    }, () => {
      k.var(a.default.instancePath, (0, s._)`""`), k.var(a.default.parentData, (0, s._)`undefined`), k.var(a.default.parentDataProperty, (0, s._)`undefined`), k.var(a.default.rootData, a.default.data), P.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function g(k) {
    const { schema: P, opts: H, gen: q } = k;
    f(k, () => {
      H.$comment && P.$comment && U(k), j(k), q.let(a.default.vErrors, null), q.let(a.default.errors, 0), H.unevaluated && I(k), p(k), Y(k);
    });
  }
  function I(k) {
    const { gen: P, validateName: H } = k;
    k.evaluated = P.const("evaluated", (0, s._)`${H}.evaluated`), P.if((0, s._)`${k.evaluated}.dynamicProps`, () => P.assign((0, s._)`${k.evaluated}.props`, (0, s._)`undefined`)), P.if((0, s._)`${k.evaluated}.dynamicItems`, () => P.assign((0, s._)`${k.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(k, P) {
    const H = typeof k == "object" && k[P.schemaId];
    return H && (P.code.source || P.code.process) ? (0, s._)`/*# sourceURL=${H} */` : s.nil;
  }
  function C(k, P) {
    if (d(k) && (h(k), c(k))) {
      u(k, P);
      return;
    }
    (0, A.boolOrEmptySchema)(k, P);
  }
  function c({ schema: k, self: P }) {
    if (typeof k == "boolean")
      return !k;
    for (const H in k)
      if (P.RULES.all[H])
        return !0;
    return !1;
  }
  function d(k) {
    return typeof k.schema != "boolean";
  }
  function u(k, P) {
    const { schema: H, gen: q, opts: z } = k;
    z.$comment && H.$comment && U(k), F(k), S(k);
    const R = q.const("_errs", a.default.errors);
    p(k, R), q.var(P, (0, s._)`${R} === ${a.default.errors}`);
  }
  function h(k) {
    (0, n.checkUnknownRules)(k), O(k);
  }
  function p(k, P) {
    if (k.opts.jtd)
      return rA(k, [], !1, P);
    const H = (0, e.getSchemaTypes)(k.schema), q = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !q, P);
  }
  function O(k) {
    const { schema: P, errSchemaPath: H, opts: q, self: z } = k;
    P.$ref && q.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(P, z.RULES) && z.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function j(k) {
    const { schema: P, opts: H } = k;
    P.default !== void 0 && H.useDefaults && H.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function F(k) {
    const P = k.schema[k.opts.schemaId];
    P && (k.baseId = (0, w.resolveUrl)(k.opts.uriResolver, k.baseId, P));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: P, schema: H, errSchemaPath: q, opts: z }) {
    const R = H.$comment;
    if (z.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof z.$comment == "function") {
      const V = (0, s.str)`${q}/$comment`, eA = k.scopeValue("root", { ref: P.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${V}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: P, schemaEnv: H, validateName: q, ValidationError: z, opts: R } = k;
    H.$async ? P.if((0, s._)`${a.default.errors} === 0`, () => P.return(a.default.data), () => P.throw((0, s._)`new ${z}(${a.default.vErrors})`)) : (P.assign((0, s._)`${q}.errors`, a.default.vErrors), R.unevaluated && T(k), P.return((0, s._)`${a.default.errors} === 0`));
  }
  function T({ gen: k, evaluated: P, props: H, items: q }) {
    H instanceof s.Name && k.assign((0, s._)`${P}.props`, H), q instanceof s.Name && k.assign((0, s._)`${P}.items`, q);
  }
  function rA(k, P, H, q) {
    const { gen: z, schema: R, data: V, allErrors: eA, opts: X, self: $ } = k, { RULES: W } = $;
    if (R.$ref && (X.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(R, W))) {
      z.block(() => L(k, "$ref", W.all.$ref.definition));
      return;
    }
    X.jtd || x(k, P), z.block(() => {
      for (const AA of W.rules)
        iA(AA);
      iA(W.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (z.if((0, o.checkDataType)(AA.type, V, X.strictNumbers)), oA(k, AA), P.length === 1 && P[0] === AA.type && H && (z.else(), (0, o.reportTypeError)(k)), z.endIf()) : oA(k, AA), eA || z.if((0, s._)`${a.default.errors} === ${q || 0}`));
    }
  }
  function oA(k, P) {
    const { gen: H, schema: q, opts: { useDefaults: z } } = k;
    z && (0, i.assignDefaults)(k, P.type), H.block(() => {
      for (const R of P.rules)
        (0, r.shouldUseRule)(q, R) && L(k, R.keyword, R.definition, P.type);
    });
  }
  function x(k, P) {
    k.schemaEnv.meta || !k.opts.strictTypes || (QA(k, P), k.opts.allowUnionTypes || v(k, P), G(k, k.dataTypes));
  }
  function QA(k, P) {
    if (P.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = P;
        return;
      }
      P.forEach((H) => {
        N(k.dataTypes, H) || K(k, `type "${H}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), M(k, P);
    }
  }
  function v(k, P) {
    P.length > 1 && !(P.length === 2 && P.includes("null")) && K(k, "use allowUnionTypes to allow union type keyword");
  }
  function G(k, P) {
    const H = k.self.RULES.all;
    for (const q in H) {
      const z = H[q];
      if (typeof z == "object" && (0, r.shouldUseRule)(k.schema, z)) {
        const { type: R } = z.definition;
        R.length && !R.some((V) => _(P, V)) && K(k, `missing type "${R.join(",")}" for keyword "${q}"`);
      }
    }
  }
  function _(k, P) {
    return k.includes(P) || P === "number" && k.includes("integer");
  }
  function N(k, P) {
    return k.includes(P) || P === "integer" && k.includes("number");
  }
  function M(k, P) {
    const H = [];
    for (const q of k.dataTypes)
      N(P, q) ? H.push(q) : P.includes("integer") && q === "number" && H.push("integer");
    k.dataTypes = H;
  }
  function K(k, P) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    P += ` at "${H}" (strictTypes)`, (0, n.checkStrictMode)(k, P, k.opts.strictTypes);
  }
  class y {
    constructor(P, H, q) {
      if ((0, Q.validateKeywordUsage)(P, H, q), this.gen = P.gen, this.allErrors = P.allErrors, this.keyword = q, this.data = P.data, this.schema = P.schema[q], this.$data = H.$data && P.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(P, this.schema, q, this.$data), this.schemaType = H.schemaType, this.parentSchema = P.schema, this.params = {}, this.it = P, this.def = H, this.$data)
        this.schemaCode = P.gen.const("vSchema", Z(this.$data, P));
      else if (this.schemaCode = this.schemaValue, !(0, Q.validSchemaType)(this.schema, H.schemaType, H.allowUndefined))
        throw new Error(`${q} value must be ${JSON.stringify(H.schemaType)}`);
      ("code" in H ? H.trackErrors : H.errors !== !1) && (this.errsCount = P.gen.const("_errs", a.default.errors));
    }
    result(P, H, q) {
      this.failResult((0, s.not)(P), H, q);
    }
    failResult(P, H, q) {
      this.gen.if(P), q ? q() : this.error(), H ? (this.gen.else(), H(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(P, H) {
      this.failResult((0, s.not)(P), void 0, H);
    }
    fail(P) {
      if (P === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(P), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(P) {
      if (!this.$data)
        return this.fail(P);
      const { schemaCode: H } = this;
      this.fail((0, s._)`${H} !== undefined && (${(0, s.or)(this.invalid$data(), P)})`);
    }
    error(P, H, q) {
      if (H) {
        this.setParams(H), this._error(P, q), this.setParams({});
        return;
      }
      this._error(P, q);
    }
    _error(P, H) {
      (P ? E.reportExtraError : E.reportError)(this, this.def.error, H);
    }
    $dataError() {
      (0, E.reportError)(this, this.def.$dataError || E.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, E.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(P) {
      this.allErrors || this.gen.if(P);
    }
    setParams(P, H) {
      H ? Object.assign(this.params, P) : this.params = P;
    }
    block$data(P, H, q = s.nil) {
      this.gen.block(() => {
        this.check$data(P, q), H();
      });
    }
    check$data(P = s.nil, H = s.nil) {
      if (!this.$data)
        return;
      const { gen: q, schemaCode: z, schemaType: R, def: V } = this;
      q.if((0, s.or)((0, s._)`${z} === undefined`, H)), P !== s.nil && q.assign(P, !0), (R.length || V.validateSchema) && (q.elseIf(this.invalid$data()), this.$dataError(), P !== s.nil && q.assign(P, !1)), q.else();
    }
    invalid$data() {
      const { gen: P, schemaCode: H, schemaType: q, def: z, it: R } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (q.length) {
          if (!(H instanceof s.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(q) ? q : [q];
          return (0, s._)`${(0, o.checkDataTypes)(X, H, R.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (z.validateSchema) {
          const X = P.scopeValue("validate$data", { ref: z.validateSchema });
          return (0, s._)`!${X}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(P, H) {
      const q = (0, B.getSubschema)(this.it, P);
      (0, B.extendSubschemaData)(q, this.it, P), (0, B.extendSubschemaMode)(q, P);
      const z = { ...this.it, ...q, items: void 0, props: void 0 };
      return C(z, H), z;
    }
    mergeEvaluated(P, H) {
      const { it: q, gen: z } = this;
      q.opts.unevaluated && (q.props !== !0 && P.props !== void 0 && (q.props = n.mergeEvaluated.props(z, P.props, q.props, H)), q.items !== !0 && P.items !== void 0 && (q.items = n.mergeEvaluated.items(z, P.items, q.items, H)));
    }
    mergeValidEvaluated(P, H) {
      const { it: q, gen: z } = this;
      if (q.opts.unevaluated && (q.props !== !0 || q.items !== !0))
        return z.if(H, () => this.mergeEvaluated(P, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function L(k, P, H, q) {
    const z = new y(k, H, P);
    "code" in H ? H.code(z, q) : z.$data && H.validate ? (0, Q.funcKeywordCode)(z, H) : "macro" in H ? (0, Q.macroKeywordCode)(z, H) : (H.compile || H.validate) && (0, Q.funcKeywordCode)(z, H);
  }
  const b = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: P, dataNames: H, dataPathArr: q }) {
    let z, R;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!b.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      z = k, R = a.default.rootData;
    } else {
      const $ = J.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const W = +$[1];
      if (z = $[2], z === "#") {
        if (W >= P)
          throw new Error(X("property/index", W));
        return q[P - W];
      }
      if (W > P)
        throw new Error(X("data", W));
      if (R = H[P - W], !z)
        return R;
    }
    let V = R;
    const eA = z.split("/");
    for (const $ of eA)
      $ && (R = (0, s._)`${R}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${R}`);
    return V;
    function X($, W) {
      return `Cannot access ${$} ${W} levels up, current level is ${P}`;
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
    const t = (0, o.getFullPath)(this.opts.uriResolver, g.root.baseId), { es5: C, lines: c } = this.opts.code, { ownProperties: d } = this.opts, u = new A.CodeGen(this.scope, { es5: C, lines: c, ownProperties: d });
    let h;
    g.$async && (h = u.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const p = u.scopeName("validate");
    g.validateName = p;
    const O = {
      gen: u,
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
      topSchemaRef: u.scopeValue("schema", this.opts.code.source === !0 ? { ref: g.schema, code: (0, A.stringify)(g.schema) } : { ref: g.schema }),
      validateName: p,
      ValidationError: h,
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
      this._compilations.add(g), (0, Q.validateFunctionCode)(O), u.optimize(this.opts.code.optimize);
      const F = u.toString();
      j = `${u.scopeRefs(r.default.scope)}return ${F}`, this.opts.code.process && (j = this.opts.code.process(j, g));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, j)(this, this.scope.get());
      if (this.scope.value(p, { ref: U }), U.errors = null, U.schema = g.schema, U.schemaEnv = g, g.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: p, validateCode: F, scopeValues: u._values }), this.opts.unevaluated) {
        const { props: Y, items: T } = O;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: T instanceof A.Name ? void 0 : T,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: T instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return g.validate = U, g;
    } catch (F) {
      throw delete g.validate, delete g.validateName, j && this.logger.error("Error compiling schema, function code:", j), F;
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
      const u = (C = g.localRefs) === null || C === void 0 ? void 0 : C[t], { schemaId: h } = this.opts;
      u && (d = new B({ schema: u, schemaId: h, root: g, baseId: I }));
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
    const d = (0, o.normalizeId)(C), u = this.refs[d] || this.schemas[d];
    if (typeof u == "string") {
      const h = f.call(this, g, u);
      return typeof h?.schema != "object" ? void 0 : D.call(this, t, h);
    }
    if (typeof u?.schema == "object") {
      if (u.validate || s.call(this, u), d === (0, o.normalizeId)(I)) {
        const { schema: h } = u, { schemaId: p } = this.opts, O = h[p];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: h, schemaId: p, root: g, baseId: c });
      }
      return D.call(this, t, u);
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
  function D(g, { baseId: I, schema: t, root: C }) {
    var c;
    if (((c = g.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const h of g.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const p = t[(0, i.unescapeFragment)(h)];
      if (p === void 0)
        return;
      t = p;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !m.has(h) && O && (I = (0, o.resolveUrl)(this.opts.uriResolver, I, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const h = (0, o.resolveUrl)(this.opts.uriResolver, I, t.$ref);
      d = f.call(this, C, h);
    }
    const { schemaId: u } = this.opts;
    if (d = d || new B({ schema: t, schemaId: u, root: C, baseId: I }), d.schema !== d.root.schema)
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
  function i(D) {
    let g = 0;
    const I = { error: !1, address: "", zone: "" }, t = [], C = [];
    let c = !1, d = !1, u = !1;
    function h() {
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
          if (d === !0 && (u = !0), !h())
            break;
          if (g++, t.push(":"), g > 7) {
            I.error = !0;
            break;
          }
          p - 1 >= 0 && D[p - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!h())
            break;
          c = !0;
        } else {
          C.push(O);
          continue;
        }
    }
    return C.length && (c ? I.zone = C.join("") : u ? t.push(C.join("")) : t.push(o(C))), I.address = t.join(""), I;
  }
  function Q(D) {
    if (s(D, ":") < 2)
      return { host: D, isIPV6: !1 };
    const g = i(D);
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
  function m(D) {
    const g = [];
    if (D.userinfo !== void 0 && (g.push(D.userinfo), g.push("@")), D.host !== void 0) {
      let I = unescape(D.host);
      const t = r(I);
      if (t.isIPV4)
        I = t.host;
      else {
        const C = Q(t.host);
        C.isIPV6 === !0 ? I = `[${C.escapedHost}]` : I = D.host;
      }
      g.push(I);
    }
    return (typeof D.port == "number" || typeof D.port == "string") && (g.push(":"), g.push(String(D.port))), g.length ? g.join("") : void 0;
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
    const C = String(t.scheme).toLowerCase() === "https";
    return (t.port === (C ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function Q(t) {
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
      const u = `${d}:${C.nid || t.nid}`, h = I[u];
      t.path = void 0, h && (t = h.parse(t, C));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, C) {
    const c = C.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), u = `${c}:${C.nid || d}`, h = I[u];
    h && (t = h.serialize(t, C));
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
  }, I = {
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
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: o, normalizeComponentEncoding: i } = requireUtils(), Q = requireSchemes();
  function B(g, I) {
    return typeof g == "string" ? g = n(m(g, I), I) : typeof g == "object" && (g = m(n(g, I), I)), g;
  }
  function s(g, I, t) {
    const C = Object.assign({ scheme: "null" }, t), c = a(m(g, C), m(I, C), C, !0);
    return n(c, { ...C, skipEscape: !0 });
  }
  function a(g, I, t, C) {
    const c = {};
    return C || (g = m(n(g, t), t), I = m(n(I, t), t)), t = t || {}, !t.tolerant && I.scheme ? (c.scheme = I.scheme, c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.userinfo !== void 0 || I.host !== void 0 || I.port !== void 0 ? (c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.path ? (I.path.charAt(0) === "/" ? c.path = r(I.path) : ((g.userinfo !== void 0 || g.host !== void 0 || g.port !== void 0) && !g.path ? c.path = "/" + I.path : g.path ? c.path = g.path.slice(0, g.path.lastIndexOf("/") + 1) + I.path : c.path = I.path, c.path = r(c.path)), c.query = I.query) : (c.path = g.path, I.query !== void 0 ? c.query = I.query : c.query = g.query), c.userinfo = g.userinfo, c.host = g.host, c.port = g.port), c.scheme = g.scheme), c.fragment = I.fragment, c;
  }
  function w(g, I, t) {
    return typeof g == "string" ? (g = unescape(g), g = n(i(m(g, t), !0), { ...t, skipEscape: !0 })) : typeof g == "object" && (g = n(i(g, !0), { ...t, skipEscape: !0 })), typeof I == "string" ? (I = unescape(I), I = n(i(m(I, t), !0), { ...t, skipEscape: !0 })) : typeof I == "object" && (I = n(i(I, !0), { ...t, skipEscape: !0 })), g.toLowerCase() === I.toLowerCase();
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
    }, C = Object.assign({}, I), c = [], d = Q[(C.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, C), t.path !== void 0 && (C.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), C.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const u = o(t);
    if (u !== void 0 && (C.reference !== "suffix" && c.push("//"), c.push(u), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let h = t.path;
      !C.absolutePath && (!d || !d.absolutePath) && (h = r(h)), u === void 0 && (h = h.replace(/^\/\//u, "/%2F")), c.push(h);
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
  function m(g, I) {
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
    const u = g.match(f);
    if (u) {
      if (C.scheme = u[1], C.userinfo = u[3], C.host = u[4], C.port = parseInt(u[5], 10), C.path = u[6] || "", C.query = u[7], C.fragment = u[8], isNaN(C.port) && (C.port = u[5]), C.host) {
        const p = e(C.host);
        if (p.isIPV4 === !1) {
          const O = A(p.host);
          C.host = O.host.toLowerCase(), d = O.isIPV6;
        } else
          C.host = p.host, d = !0;
      }
      C.scheme === void 0 && C.userinfo === void 0 && C.host === void 0 && C.port === void 0 && !C.path && C.query === void 0 ? C.reference = "same-document" : C.scheme === void 0 ? C.reference = "relative" : C.fragment === void 0 ? C.reference = "absolute" : C.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== C.reference && (C.error = C.error || "URI is not a " + t.reference + " reference.");
      const h = Q[(t.scheme || C.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!h || !h.unicodeSupport) && C.host && (t.domainHost || h && h.domainHost) && d === !1 && l(C.host))
        try {
          C.host = URL.domainToASCII(C.host.toLowerCase());
        } catch (p) {
          C.error = C.error || "Host's domain name can not be converted to ASCII: " + p;
        }
      (!h || h && !h.skipNormalize) && (c && C.scheme !== void 0 && (C.scheme = unescape(C.scheme)), c && C.host !== void 0 && (C.host = unescape(C.host)), C.path && C.path.length && (C.path = escape(unescape(C.path))), C.fragment && C.fragment.length && (C.fragment = encodeURI(decodeURIComponent(C.fragment)))), h && h.parse && h.parse(C, t);
    } else
      C.error = C.error || "URI can not be parsed.";
    return C;
  }
  const D = {
    SCHEMES: Q,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: w,
    serialize: n,
    parse: m
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
    const o = requireValidation_error(), i = requireRef_error(), Q = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), w = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, G) => new RegExp(v, G);
    f.code = "new RegExp";
    const m = ["removeAdditional", "useDefaults", "coerceTypes"], D = /* @__PURE__ */ new Set([
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
      var G, _, N, M, K, y, L, b, J, Z, k, P, H, q, z, R, V, eA, X, $, W, iA, AA, tA, sA;
      const BA = v.strict, aA = (G = v.code) === null || G === void 0 ? void 0 : G.optimize, wA = aA === !0 || aA === void 0 ? 1 : aA || 0, gA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, CA = (M = v.uriResolver) !== null && M !== void 0 ? M : l.default;
      return {
        strictSchema: (y = (K = v.strictSchema) !== null && K !== void 0 ? K : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (b = (L = v.strictNumbers) !== null && L !== void 0 ? L : BA) !== null && b !== void 0 ? b : !0,
        strictTypes: (Z = (J = v.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (P = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && P !== void 0 ? P : "log",
        strictRequired: (q = (H = v.strictRequired) !== null && H !== void 0 ? H : BA) !== null && q !== void 0 ? q : !1,
        code: v.code ? { ...v.code, optimize: wA, regExp: gA } : { optimize: wA, regExp: gA },
        loopRequired: (z = v.loopRequired) !== null && z !== void 0 ? z : t,
        loopEnum: (R = v.loopEnum) !== null && R !== void 0 ? R : t,
        meta: (V = v.meta) !== null && V !== void 0 ? V : !0,
        messages: (eA = v.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (X = v.inlineRefs) !== null && X !== void 0 ? X : !0,
        schemaId: ($ = v.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (W = v.addUsedSchema) !== null && W !== void 0 ? W : !0,
        validateSchema: (iA = v.validateSchema) !== null && iA !== void 0 ? iA : !0,
        validateFormats: (AA = v.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = v.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = v.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: CA
      };
    }
    class c {
      constructor(G = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), G = this.opts = { ...G, ...C(G) };
        const { es5: _, lines: N } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: D, es5: _, lines: N }), this.logger = S(G.logger);
        const M = G.validateFormats;
        G.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, g, G, "NOT SUPPORTED"), d.call(this, I, G, "DEPRECATED", "warn"), this._metaOpts = j.call(this), G.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), G.keywords && O.call(this, G.keywords), typeof G.meta == "object" && this.addMetaSchema(G.meta), h.call(this), G.validateFormats = M;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: G, meta: _, schemaId: N } = this.opts;
        let M = E;
        N === "id" && (M = { ...E }, M.id = M.$id, delete M.$id), _ && G && this.addMetaSchema(M, M[N], !1);
      }
      defaultMeta() {
        const { meta: G, schemaId: _ } = this.opts;
        return this.opts.defaultMeta = typeof G == "object" ? G[_] || G : void 0;
      }
      validate(G, _) {
        let N;
        if (typeof G == "string") {
          if (N = this.getSchema(G), !N)
            throw new Error(`no schema with key or ref "${G}"`);
        } else
          N = this.compile(G);
        const M = N(_);
        return "$async" in N || (this.errors = N.errors), M;
      }
      compile(G, _) {
        const N = this._addSchema(G, _);
        return N.validate || this._compileSchemaEnv(N);
      }
      compileAsync(G, _) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: N } = this.opts;
        return M.call(this, G, _);
        async function M(Z, k) {
          await K.call(this, Z.$schema);
          const P = this._addSchema(Z, k);
          return P.validate || y.call(this, P);
        }
        async function K(Z) {
          Z && !this.getSchema(Z) && await M.call(this, { $ref: Z }, !0);
        }
        async function y(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return L.call(this, k), await b.call(this, k.missingSchema), y.call(this, Z);
          }
        }
        function L({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function b(Z) {
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
      addSchema(G, _, N, M = this.opts.validateSchema) {
        if (Array.isArray(G)) {
          for (const y of G)
            this.addSchema(y, void 0, N, M);
          return this;
        }
        let K;
        if (typeof G == "object") {
          const { schemaId: y } = this.opts;
          if (K = G[y], K !== void 0 && typeof K != "string")
            throw new Error(`schema ${y} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || K), this._checkUnique(_), this.schemas[_] = this._addSchema(G, N, _, M, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(G, _, N = this.opts.validateSchema) {
        return this.addSchema(G, _, !0, N), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(G, _) {
        if (typeof G == "boolean")
          return !0;
        let N;
        if (N = G.$schema, N !== void 0 && typeof N != "string")
          throw new Error("$schema must be a string");
        if (N = N || this.opts.defaultMeta || this.defaultMeta(), !N)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const M = this.validate(N, G);
        if (!M && _) {
          const K = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(K);
          else
            throw new Error(K);
        }
        return M;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(G) {
        let _;
        for (; typeof (_ = u.call(this, G)) == "string"; )
          G = _;
        if (_ === void 0) {
          const { schemaId: N } = this.opts, M = new B.SchemaEnv({ schema: {}, schemaId: N });
          if (_ = B.resolveSchema.call(this, M, G), !_)
            return;
          this.refs[G] = _;
        }
        return _.validate || this._compileSchemaEnv(_);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(G) {
        if (G instanceof RegExp)
          return this._removeAllSchemas(this.schemas, G), this._removeAllSchemas(this.refs, G), this;
        switch (typeof G) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const _ = u.call(this, G);
            return typeof _ == "object" && this._cache.delete(_.schema), delete this.schemas[G], delete this.refs[G], this;
          }
          case "object": {
            const _ = G;
            this._cache.delete(_);
            let N = G[this.opts.schemaId];
            return N && (N = (0, a.normalizeId)(N), delete this.schemas[N], delete this.refs[N]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(G) {
        for (const _ of G)
          this.addKeyword(_);
        return this;
      }
      addKeyword(G, _) {
        let N;
        if (typeof G == "string")
          N = G, typeof _ == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), _.keyword = N);
        else if (typeof G == "object" && _ === void 0) {
          if (_ = G, N = _.keyword, Array.isArray(N) && !N.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (Y.call(this, N, _), !_)
          return (0, n.eachItem)(N, (K) => T.call(this, K)), this;
        oA.call(this, _);
        const M = {
          ..._,
          type: (0, w.getJSONTypes)(_.type),
          schemaType: (0, w.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(N, M.type.length === 0 ? (K) => T.call(this, K, M) : (K) => M.type.forEach((y) => T.call(this, K, M, y))), this;
      }
      getKeyword(G) {
        const _ = this.RULES.all[G];
        return typeof _ == "object" ? _.definition : !!_;
      }
      // Remove keyword
      removeKeyword(G) {
        const { RULES: _ } = this;
        delete _.keywords[G], delete _.all[G];
        for (const N of _.rules) {
          const M = N.rules.findIndex((K) => K.keyword === G);
          M >= 0 && N.rules.splice(M, 1);
        }
        return this;
      }
      // Add format
      addFormat(G, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[G] = _, this;
      }
      errorsText(G = this.errors, { separator: _ = ", ", dataVar: N = "data" } = {}) {
        return !G || G.length === 0 ? "No errors" : G.map((M) => `${N}${M.instancePath} ${M.message}`).reduce((M, K) => M + _ + K);
      }
      $dataMetaSchema(G, _) {
        const N = this.RULES.all;
        G = JSON.parse(JSON.stringify(G));
        for (const M of _) {
          const K = M.split("/").slice(1);
          let y = G;
          for (const L of K)
            y = y[L];
          for (const L in N) {
            const b = N[L];
            if (typeof b != "object")
              continue;
            const { $data: J } = b.definition, Z = y[L];
            J && Z && (y[L] = QA(Z));
          }
        }
        return G;
      }
      _removeAllSchemas(G, _) {
        for (const N in G) {
          const M = G[N];
          (!_ || _.test(N)) && (typeof M == "string" ? delete G[N] : M && !M.meta && (this._cache.delete(M.schema), delete G[N]));
        }
      }
      _addSchema(G, _, N, M = this.opts.validateSchema, K = this.opts.addUsedSchema) {
        let y;
        const { schemaId: L } = this.opts;
        if (typeof G == "object")
          y = G[L];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof G != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let b = this._cache.get(G);
        if (b !== void 0)
          return b;
        N = (0, a.normalizeId)(y || N);
        const J = a.getSchemaRefs.call(this, G, N);
        return b = new B.SchemaEnv({ schema: G, schemaId: L, meta: _, baseId: N, localRefs: J }), this._cache.set(b.schema, b), K && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = b), M && this.validateSchema(G, !0), b;
      }
      _checkUnique(G) {
        if (this.schemas[G] || this.refs[G])
          throw new Error(`schema with key or id "${G}" already exists`);
      }
      _compileSchemaEnv(G) {
        if (G.meta ? this._compileMetaSchema(G) : B.compileSchema.call(this, G), !G.validate)
          throw new Error("ajv implementation error");
        return G.validate;
      }
      _compileMetaSchema(G) {
        const _ = this.opts;
        this.opts = this._metaOpts;
        try {
          B.compileSchema.call(this, G);
        } finally {
          this.opts = _;
        }
      }
    }
    c.ValidationError = o.default, c.MissingRefError = i.default, A.default = c;
    function d(v, G, _, N = "error") {
      for (const M in v) {
        const K = M;
        K in G && this.logger[N](`${_}: option ${M}. ${v[K]}`);
      }
    }
    function u(v) {
      return v = (0, a.normalizeId)(v), this.schemas[v] || this.refs[v];
    }
    function h() {
      const v = this.opts.schemas;
      if (v)
        if (Array.isArray(v))
          this.addSchema(v);
        else
          for (const G in v)
            this.addSchema(v[G], G);
    }
    function p() {
      for (const v in this.opts.formats) {
        const G = this.opts.formats[v];
        G && this.addFormat(v, G);
      }
    }
    function O(v) {
      if (Array.isArray(v)) {
        this.addVocabulary(v);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const G in v) {
        const _ = v[G];
        _.keyword || (_.keyword = G), this.addKeyword(_);
      }
    }
    function j() {
      const v = { ...this.opts };
      for (const G of m)
        delete v[G];
      return v;
    }
    const F = { log() {
    }, warn() {
    }, error() {
    } };
    function S(v) {
      if (v === !1)
        return F;
      if (v === void 0)
        return console;
      if (v.log && v.warn && v.error)
        return v;
      throw new Error("logger must implement log, warn and error methods");
    }
    const U = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Y(v, G) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (N) => {
        if (_.keywords[N])
          throw new Error(`Keyword ${N} is already defined`);
        if (!U.test(N))
          throw new Error(`Keyword ${N} has invalid name`);
      }), !!G && G.$data && !("code" in G || "validate" in G))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function T(v, G, _) {
      var N;
      const M = G?.post;
      if (_ && M)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: K } = this;
      let y = M ? K.post : K.rules.find(({ type: b }) => b === _);
      if (y || (y = { type: _, rules: [] }, K.rules.push(y)), K.keywords[v] = !0, !G)
        return;
      const L = {
        keyword: v,
        definition: {
          ...G,
          type: (0, w.getJSONTypes)(G.type),
          schemaType: (0, w.getJSONTypes)(G.schemaType)
        }
      };
      G.before ? rA.call(this, y, L, G.before) : y.rules.push(L), K.all[v] = L, (N = G.implements) === null || N === void 0 || N.forEach((b) => this.addKeyword(b));
    }
    function rA(v, G, _) {
      const N = v.rules.findIndex((M) => M.keyword === _);
      N >= 0 ? v.rules.splice(N, 0, G) : (v.rules.push(G), this.logger.warn(`rule ${_} is not defined`));
    }
    function oA(v) {
      let { metaSchema: G } = v;
      G !== void 0 && (v.$data && this.opts.$data && (G = QA(G)), v.validateSchema = this.compile(G, !0));
    }
    const x = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function QA(v) {
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
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), o = requireNames(), i = requireCompile(), Q = requireUtil(), B = {
    keyword: "$ref",
    schemaType: "string",
    code(w) {
      const { gen: n, schema: E, it: l } = w, { baseId: f, schemaEnv: m, validateName: D, opts: g, self: I } = l, { root: t } = m;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const C = i.resolveRef.call(I, t, f, E);
      if (C === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (C instanceof i.SchemaEnv)
        return d(C);
      return u(C);
      function c() {
        if (m === t)
          return a(w, D, m, m.$async);
        const h = n.scopeValue("root", { ref: t });
        return a(w, (0, r._)`${h}.validate`, t, t.$async);
      }
      function d(h) {
        const p = s(w, h);
        a(w, p, h, h.$async);
      }
      function u(h) {
        const p = n.scopeValue("schema", g.code.source === !0 ? { ref: h, code: (0, r.stringify)(h) } : { ref: h }), O = n.name("valid"), j = w.subschema({
          schema: h,
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
    const { gen: f, it: m } = w, { allErrors: D, schemaEnv: g, opts: I } = m, t = I.passContext ? o.default.this : r.nil;
    l ? C() : c();
    function C() {
      if (!g.$async)
        throw new Error("async schema referenced by sync schema");
      const h = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(w, n, t)}`), u(n), D || f.assign(h, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${m.ValidationError})`, () => f.throw(p)), d(p), D || f.assign(h, !1);
      }), w.ok(h);
    }
    function c() {
      w.result((0, e.callValidateCode)(w, n, t), () => u(n), () => d(n));
    }
    function d(h) {
      const p = (0, r._)`${h}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${p} : ${o.default.vErrors}.concat(${p})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function u(h) {
      var p;
      if (!m.opts.unevaluated)
        return;
      const O = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (m.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (m.props = Q.mergeEvaluated.props(f, O.props, m.props));
        else {
          const j = f.var("props", (0, r._)`${h}.evaluated.props`);
          m.props = Q.mergeEvaluated.props(f, j, m.props, r.Name);
        }
      if (m.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (m.items = Q.mergeEvaluated.items(f, O.items, m.items));
        else {
          const j = f.var("items", (0, r._)`${h}.evaluated.items`);
          m.items = Q.mergeEvaluated.items(f, j, m.items, r.Name);
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
      const { gen: i, data: Q, schemaCode: B, it: s } = o, a = s.opts.multipleOfPrecision, w = i.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${w}) - ${w}) > 1e-${a}` : (0, A._)`${w} !== parseInt(${w})`;
      o.fail$data((0, A._)`(${B} === 0 || (${w} = ${Q}/${B}, ${n}))`);
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
      const { keyword: B, data: s, schemaCode: a, it: w } = Q, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = w.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(Q.gen, r.default)}(${s})`;
      Q.fail$data((0, A._)`${E} ${n} ${a}`);
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
      const { data: Q, $data: B, schema: s, schemaCode: a, it: w } = i, n = w.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(i, s);
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
      const { gen: B, schema: s, schemaCode: a, data: w, $data: n, it: E } = Q, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? m() : D(), l.strictRequired) {
        const t = Q.parentSchema.properties, { definedProperties: C } = Q.it;
        for (const c of s)
          if (t?.[c] === void 0 && !C.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, u = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, u, E.opts.strictRequired);
          }
      }
      function m() {
        if (f || n)
          Q.block$data(e.nil, g);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(Q, t);
      }
      function D() {
        const t = B.let("missing");
        if (f || n) {
          const C = B.let("valid", !0);
          Q.block$data(C, () => I(t, C)), Q.ok(C);
        } else
          B.if((0, A.checkMissingProp)(Q, s, t)), (0, A.reportMissingProp)(Q, t), B.else();
      }
      function g() {
        B.forOf("prop", a, (t) => {
          Q.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, w, t, l.ownProperties), () => Q.error());
        });
      }
      function I(t, C) {
        Q.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(C, (0, A.propertyInData)(B, w, t, l.ownProperties)), B.if((0, e.not)(C), () => {
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
      const { gen: s, data: a, $data: w, schema: n, parentSchema: E, schemaCode: l, it: f } = B;
      if (!w && !n)
        return;
      const m = s.let("valid"), D = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(m, g, (0, e._)`${l} === false`), B.ok(m);
      function g() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(m, !0), s.if((0, e._)`${c} > 1`, () => (I() ? t : C)(c, d));
      }
      function I() {
        return D.length > 0 && !D.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const u = s.name("item"), h = (0, A.checkDataTypes)(D, u, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(u, (0, e._)`${a}[${c}]`), s.if(h, (0, e._)`continue`), D.length > 1 && s.if((0, e._)`typeof ${u} == "string"`, (0, e._)`${u} += "_"`), s.if((0, e._)`typeof ${p}[${u}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${u}]`), B.error(), s.assign(m, !1).break();
          }).code((0, e._)`${p}[${u}] = ${c}`);
        });
      }
      function C(c, d) {
        const u = (0, r.useFunc)(s, o.default), h = s.name("outer");
        s.label(h).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${u}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(m, !1).break(h);
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
      const { gen: B, data: s, $data: a, schemaCode: w, schema: n } = Q;
      a || n && typeof n == "object" ? Q.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${w})`) : Q.fail((0, A._)`${n} !== ${s}`);
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
      const { gen: B, data: s, $data: a, schema: w, schemaCode: n, it: E } = Q;
      if (!a && w.length === 0)
        throw new Error("enum must have non-empty array");
      const l = w.length >= E.opts.loopEnum;
      let f;
      const m = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let D;
      if (l || a)
        D = B.let("valid"), Q.block$data(D, g);
      else {
        if (!Array.isArray(w))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        D = (0, A.or)(...w.map((C, c) => I(t, c)));
      }
      Q.pass(D);
      function g() {
        B.assign(D, !1), B.forOf("v", n, (t) => B.if((0, A._)`${m()}(${s}, ${t})`, () => B.assign(D, !0).break()));
      }
      function I(t, C) {
        const c = w[C];
        return typeof c == "object" && c !== null ? (0, A._)`${m()}(${s}, ${t}[${C}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = i, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), i = requireLimitProperties(), Q = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), w = require_enum(), n = [
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
    const { gen: s, schema: a, data: w, keyword: n, it: E } = Q;
    E.items = !0;
    const l = s.const("len", (0, A._)`${w}.length`);
    if (a === !1)
      Q.setParams({ len: B.length }), Q.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const m = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(m), () => f(m)), Q.ok(m);
    }
    function f(m) {
      s.forRange("i", B.length, l, (D) => {
        Q.subschema({ keyword: n, dataProp: D, dataPropType: e.Type.Num }, m), E.allErrors || s.if((0, A.not)(m), () => s.break());
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
    const { gen: a, parentSchema: w, data: n, keyword: E, it: l } = Q;
    D(w), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), m = a.const("len", (0, A._)`${n}.length`);
    s.forEach((g, I) => {
      (0, e.alwaysValidSchema)(l, g) || (a.if((0, A._)`${m} > ${I}`, () => Q.subschema({
        keyword: E,
        schemaProp: I,
        dataProp: I
      }, f)), Q.ok(f));
    });
    function D(g) {
      const { opts: I, errSchemaPath: t } = l, C = s.length, c = C === g.minItems && (C === g.maxItems || g[B] === !1);
      if (I.strictTuples && !c) {
        const d = `"${E}" is ${C}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, I.strictTuples);
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
      const { schema: s, parentSchema: a, it: w } = B, { prefixItems: n } = a;
      w.items = !0, !(0, e.alwaysValidSchema)(w, s) && (n ? (0, o.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
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
      const { gen: Q, schema: B, parentSchema: s, data: a, it: w } = i;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      w.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const m = Q.const("len", (0, A._)`${a}.length`);
      if (i.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(w, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(w, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(w, B)) {
        let C = (0, A._)`${m} >= ${n}`;
        E !== void 0 && (C = (0, A._)`${C} && ${m} <= ${E}`), i.pass(C);
        return;
      }
      w.items = !0;
      const D = Q.name("valid");
      E === void 0 && n === 1 ? I(D, () => Q.if(D, () => Q.break())) : n === 0 ? (Q.let(D, !0), E !== void 0 && Q.if((0, A._)`${a}.length > 0`, g)) : (Q.let(D, !1), g()), i.result(D, () => i.reset());
      function g() {
        const C = Q.name("_valid"), c = Q.let("count", 0);
        I(C, () => Q.if(C, () => t(c)));
      }
      function I(C, c) {
        Q.forRange("i", 0, m, (d) => {
          i.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, C), c();
        });
      }
      function t(C) {
        Q.code((0, A._)`${C}++`), E === void 0 ? Q.if((0, A._)`${C} >= ${n}`, () => Q.assign(D, !0).break()) : (Q.if((0, A._)`${C} > ${E}`, () => Q.assign(D, !1).break()), n === 1 ? Q.assign(D, !0) : Q.if((0, A._)`${C} >= ${n}`, () => Q.assign(D, !0)));
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
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [w, n] = Q(a);
        B(a, w), s(a, n);
      }
    };
    function Q({ schema: a }) {
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
      for (const m in w) {
        const D = w[m];
        if (D.length === 0)
          continue;
        const g = (0, o.propertyInData)(n, E, m, l.opts.ownProperties);
        a.setParams({
          property: m,
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
      const { gen: n, data: E, keyword: l, it: f } = a, m = n.name("valid");
      for (const D in w)
        (0, r.alwaysValidSchema)(f, w[D]) || (n.if(
          (0, o.propertyInData)(n, E, D, f.opts.ownProperties),
          () => {
            const g = a.subschema({ keyword: l, schemaProp: D }, m);
            a.mergeValidEvaluated(g, m);
          },
          () => n.var(m, !0)
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
      const w = Q.name("valid");
      Q.forIn("key", s, (n) => {
        i.setParams({ propertyName: n }), i.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, w), Q.if((0, A.not)(w), () => {
          i.error(!0), a.allErrors || Q.break();
        });
      }), i.ok(w);
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
      const { gen: s, schema: a, parentSchema: w, data: n, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: m } = l;
      if (l.props = !0, m.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const D = (0, A.allSchemaProperties)(w.properties), g = (0, A.allSchemaProperties)(w.patternProperties);
      I(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function I() {
        s.forIn("key", n, (u) => {
          !D.length && !g.length ? c(u) : s.if(t(u), () => c(u));
        });
      }
      function t(u) {
        let h;
        if (D.length > 8) {
          const p = (0, o.schemaRefOrVal)(l, w.properties, "properties");
          h = (0, A.isOwnProperty)(s, p, u);
        } else D.length ? h = (0, e.or)(...D.map((p) => (0, e._)`${u} === ${p}`)) : h = e.nil;
        return g.length && (h = (0, e.or)(h, ...g.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${u})`))), (0, e.not)(h);
      }
      function C(u) {
        s.code((0, e._)`delete ${n}[${u}]`);
      }
      function c(u) {
        if (m.removeAdditional === "all" || m.removeAdditional && a === !1) {
          C(u);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: u }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const h = s.name("valid");
          m.removeAdditional === "failing" ? (d(u, h, !1), s.if((0, e.not)(h), () => {
            B.reset(), C(u);
          })) : (d(u, h), f || s.if((0, e.not)(h), () => s.break()));
        }
      }
      function d(u, h, p) {
        const O = {
          keyword: "additionalProperties",
          dataProp: u,
          dataPropType: o.Type.Str
        };
        p === !1 && Object.assign(O, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(O, h);
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
      const { gen: B, schema: s, parentSchema: a, data: w, it: n } = Q;
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
        m(g) ? D(g) : (B.if((0, e.propertyInData)(B, w, g, n.opts.ownProperties)), D(g), n.allErrors || B.else().var(f, !0), B.endIf()), Q.it.definedProperties.add(g), Q.ok(f);
      function m(g) {
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
      const { gen: B, schema: s, data: a, parentSchema: w, it: n } = Q, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const m = E.strictSchema && !E.allowMatchingProperties && w.properties, D = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, o.evaluatedPropsToName)(B, n.props));
      const { props: g } = n;
      I();
      function I() {
        for (const c of l)
          m && t(c), n.allErrors ? C(c) : (B.var(D, !0), C(c), B.if(D));
      }
      function t(c) {
        for (const d in m)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function C(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(Q, c)}.test(${d})`, () => {
            const u = f.includes(c);
            u || Q.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: o.Type.Str
            }, D), n.opts.unevaluated && g !== !0 ? B.assign((0, e._)`${g}[${d}]`, !0) : !u && !n.allErrors && B.if((0, e.not)(D), () => B.break());
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
      const w = B, n = Q.let("valid", !1), E = Q.let("passing", null), l = Q.name("_valid");
      i.setParams({ passing: E }), Q.block(f), i.result(n, () => i.reset(), () => i.error(!0));
      function f() {
        w.forEach((m, D) => {
          let g;
          (0, e.alwaysValidSchema)(a, m) ? Q.var(l, !0) : g = i.subschema({
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
      i.forEach((s, a) => {
        if ((0, A.alwaysValidSchema)(Q, s))
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
      message: ({ params: Q }) => (0, A.str)`must match "${Q.ifClause}" schema`,
      params: ({ params: Q }) => (0, A._)`{failingKeyword: ${Q.ifClause}}`
    },
    code(Q) {
      const { gen: B, parentSchema: s, it: a } = Q;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const w = i(a, "then"), n = i(a, "else");
      if (!w && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), Q.reset(), w && n) {
        const D = B.let("ifClause");
        Q.setParams({ ifClause: D }), B.if(l, m("then", D), m("else", D));
      } else w ? B.if(l, m("then")) : B.if((0, A.not)(l), m("else"));
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
      function m(D, g) {
        return () => {
          const I = Q.subschema({ keyword: D }, l);
          B.assign(E, l), Q.mergeValidEvaluated(I, E), g ? B.assign(g, (0, A._)`${D}`) : Q.setParams({ ifClause: D });
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
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), i = requireContains(), Q = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), w = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), m = require_if(), D = requireThenElse();
  function g(I = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      m.default,
      D.default,
      // object
      B.default,
      s.default,
      Q.default,
      a.default,
      w.default
    ];
    return I ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(i.default), t;
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
      const { gen: Q, data: B, $data: s, schema: a, schemaCode: w, it: n } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: m } = n;
      if (!E.validateFormats)
        return;
      s ? D() : g();
      function D() {
        const I = Q.scopeValue("formats", {
          ref: m.formats,
          code: E.code.formats
        }), t = Q.const("fDef", (0, A._)`${I}[${w}]`), C = Q.let("fType"), c = Q.let("format");
        Q.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => Q.assign(C, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => Q.assign(C, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), u()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${w} && !${c}`;
        }
        function u() {
          const h = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, p = (0, A._)`(typeof ${c} == "function" ? ${h} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${C} === ${i} && !${p}`;
        }
      }
      function g() {
        const I = m.formats[a];
        if (!I) {
          d();
          return;
        }
        if (I === !0)
          return;
        const [t, C, c] = u(I);
        t === i && o.pass(h());
        function d() {
          if (E.strictSchema === !1) {
            m.logger.warn(p());
            return;
          }
          throw new Error(p());
          function p() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function u(p) {
          const O = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, j = Q.scopeValue("formats", { key: a, ref: p, code: O });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${j}.validate`] : ["string", p, j];
        }
        function h() {
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
      params: ({ params: { discrError: s, tag: a, tagName: w } }) => (0, A._)`{error: ${s}, tag: ${w}, tagValue: ${a}}`
    },
    code(s) {
      const { gen: a, data: w, schema: n, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const m = n.propertyName;
      if (typeof m != "string")
        throw new Error("discriminator: requires propertyName");
      if (n.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const D = a.let("valid", !1), g = a.const("tag", (0, A._)`${w}${(0, A.getProperty)(m)}`);
      a.if((0, A._)`typeof ${g} == "string"`, () => I(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: g, tagName: m })), s.ok(D);
      function I() {
        const c = C();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${g} === ${d}`), a.assign(D, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: g, tagName: m }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), u = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(u, A.Name), d;
      }
      function C() {
        var c;
        const d = {}, u = p(E);
        let h = !0;
        for (let F = 0; F < f.length; F++) {
          let S = f[F];
          if (S?.$ref && !(0, i.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = S?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          h = h && (u || p(S)), O(U, F);
        }
        if (!h)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function p({ required: F }) {
          return Array.isArray(F) && F.includes(m);
        }
        function O(F, S) {
          if (F.const)
            j(F.const, S);
          else if (F.enum)
            for (const U of F.enum)
              j(U, S);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function j(F, S) {
          if (typeof F != "string" || F in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[F] = S;
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
  function i(Q) {
    return Q instanceof r ? Q : new r(function(B) {
      B(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, B) {
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
      n.done ? Q(n.value) : i(n.value).then(s, a);
    }
    w((o = o.apply(A, [])).next());
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
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = w[0] & 2 ? i.return : w[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, w[1])).done) return Q;
      switch (i = 0, Q && (w = [w[0] & 2, Q.value]), w[0]) {
        case 0:
        case 1:
          Q = w;
          break;
        case 4:
          return r.label++, { value: w[1], done: !1 };
        case 5:
          r.label++, i = w[1], w = [0];
          continue;
        case 7:
          w = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!Q || w[1] > Q[0] && w[1] < Q[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = w;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(w);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], i = 0;
    } finally {
      o = Q = 0;
    }
    if (w[0] & 5) throw w[1];
    return { value: w[0] ? w[1] : void 0, done: !0 };
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
      for (const { count: a, res: w } of B.anchors.values())
        i(w, a);
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
  let w = findTagObject(A, e, B.tags);
  if (!w) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    w = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  Q && (Q(w), delete r.onTagObj);
  const n = w?.createNode ? w.createNode(r.schema, A, r) : typeof w?.nodeClass?.from == "function" ? w.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return w.default || (n.tag = w.tag), a && (a.node = n), n;
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
  const w = [], n = {};
  let E = i - e.length;
  typeof o == "number" && (o > i - Math.max(2, Q) ? w.push(0) : E = i - o);
  let l, f, m = !1, D = -1, g = -1, I = -1;
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
            f = C, C = A[D += 1], m = !0;
          const c = D > I + 1 ? D - 2 : g - 1;
          if (n[c])
            return A;
          w.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          m = !0;
    }
    f = C;
  }
  if (m && s && s(), w.length === 0)
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
  const m = f.indexOf(`
`);
  m === -1 ? E = "-" : r === f || m !== f.length - 1 ? (E = "+", Q && Q()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
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
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${w}`);
    let u = !1;
    const h = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (h.onOverflow = () => {
      u = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, w, FOLD_BLOCK, h);
    if (!u)
      return `>${c}
${w}${p}`;
  }
  return r = r.replace(/\n+/g, `$&${w}`), `|${c}
${w}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: i, value: Q } = A, { actualString: B, implicitKey: s, indent: a, indentStep: w, inFlow: n } = e;
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
    if (a === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, o);
    if (s && a === w)
      return quotedString(Q, e);
  }
  const E = Q.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (D) => D.default && D.tag !== "tag:yaml.org,2002:str" && D.test?.test(E), { compat: f, tags: m } = e.doc.schema;
    if (m.some(l) || f?.some(l))
      return quotedString(Q, e);
  }
  return s ? E : foldFlowLines(E, a, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, o) {
  const { implicitKey: i, inFlow: Q } = e, B = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(B.value) && (s = Scalar.QUOTE_DOUBLE);
  const a = (n) => {
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
  let w = a(s);
  if (w === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = i && n || E;
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
  const { allNullValues: Q, doc: B, indent: s, indentStep: a, options: { commentString: w, indentSeq: n, simpleKeys: E } } = r;
  let l = isNode(A) && A.comment || null;
  if (E) {
    if (l)
      throw new Error("With simple keys, key nodes cannot have comments");
    if (isCollection(A) || !isNode(A) && typeof A == "object") {
      const h = "With simple keys, collection cannot be used as a key value";
      throw new Error(h);
    }
  }
  let f = !E && (!A || l && e == null && !r.inFlow || isCollection(A) || (isScalar(A) ? A.type === Scalar.BLOCK_FOLDED || A.type === Scalar.BLOCK_LITERAL : typeof A == "object"));
  r = Object.assign({}, r, {
    allNullValues: !1,
    implicitKey: !f && (E || !Q),
    indent: s + a
  });
  let m = !1, D = !1, g = stringify(A, r, () => m = !0, () => D = !0);
  if (!f && !r.inFlow && g.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (Q || e == null)
      return m && o && o(), g === "" ? "?" : f ? `? ${g}` : g;
  } else if (Q && !E || e == null && f)
    return g = `? ${g}`, l && !m ? g += lineComment(g, r.indent, w(l)) : D && i && i(), g;
  m && (l = null), f ? (l && (g += lineComment(g, r.indent, w(l))), g = `? ${g}
${s}:`) : (g = `${g}:`, l && (g += lineComment(g, r.indent, w(l))));
  let I, t, C;
  isNode(e) ? (I = !!e.spaceBefore, t = e.commentBefore, C = e.comment) : (I = !1, t = null, C = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = g.length + 1), D = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => D = !0);
  let u = " ";
  if (l || I || t) {
    if (u = I ? `
` : "", t) {
      const h = w(t);
      u += `
${indentComment(h, r.indent)}`;
    }
    d === "" && !r.inFlow ? u === `
` && (u = `

`) : u += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const h = d[0], p = d.indexOf(`
`), O = p !== -1, j = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !j) {
      let F = !1;
      if (O && (h === "&" || h === "!")) {
        let S = d.indexOf(" ");
        h === "&" && S !== -1 && S < p && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || p < S) && (F = !0);
      }
      F || (u = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (u = "");
  return g += u + d, r.inFlow ? c && o && o() : C && !c ? g += lineComment(g, r.indent, w(C)) : D && i && i(), g;
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
  const { indent: a, options: { commentString: w } } = r, n = Object.assign({}, r, { indent: Q, type: null });
  let E = !1;
  const l = [];
  for (let m = 0; m < e.length; ++m) {
    const D = e[m];
    let g = null;
    if (isNode(D))
      !E && D.spaceBefore && l.push(""), addCommentBefore(r, l, D.commentBefore, E), D.comment && (g = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let I = stringify(D, n, () => g = null, () => E = !0);
    g && (I += lineComment(I, Q, w(g))), E && g && (E = !1), l.push(o + I);
  }
  let f;
  if (l.length === 0)
    f = i.start + i.end;
  else {
    f = l[0];
    for (let m = 1; m < l.length; ++m) {
      const D = l[m];
      f += D ? `
${a}${D}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(w(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: i, indentStep: Q, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += Q;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let w = !1, n = 0;
  const E = [];
  for (let m = 0; m < A.length; ++m) {
    const D = A[m];
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
    m < A.length - 1 && (I += ","), g && (I += lineComment(I, o, s(g))), !w && (E.length > n || I.includes(`
`)) && (w = !0), E.push(I), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!w) {
    const m = E.reduce((D, g) => D + g.length + 2, 2);
    w = e.options.lineWidth > 0 && m > e.options.lineWidth;
  }
  if (w) {
    let m = l;
    for (const D of E)
      m += D ? `
${Q}${i}${D}` : `
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
    const { keepUndefined: i, replacer: Q } = o, B = new this(e), s = (a, w) => {
      if (typeof Q == "function")
        w = Q.call(r, a, w);
      else if (Array.isArray(Q) && !Q.includes(a))
        return;
      (w !== void 0 || i) && B.items.push(createPair(a, w, o));
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
        const w = Object.keys(B);
        if (w.length === 1)
          s = w[0], a = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${w.length} keys`);
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
      let a = s.i, w = s.n;
      if (Q.length > 2) {
        const E = [], l = [], f = (Q.length - 2) / 2, m = Q.slice(2, 2 + f);
        for (const D of m) {
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
    for (const a of B) {
      if (a.varType === "lookup" || a.varType === "data")
        continue;
      const n = `ModelImpl_${a.varId}`;
      r.set(n, a), s.push(n);
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
  function i(w) {
    w.value.set(w.minValue);
  }
  function Q(w) {
    w.value.set(w.maxValue);
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
                  i(n);
                  break;
                case "at-maximum":
                  Q(n);
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 134 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "a_fi", varId: "_fertiliser_multiplier", varName: "Fertiliser Multiplier", defaultValue: 1.0001, minValue: 0.8, maxValue: 1.2 }, { inputId: "a_af", varId: "_feed_switch", varName: "Feed Switch", defaultValue: 1, minValue: -1, maxValue: 3 }, { inputId: "a_af_1", varId: "_feed_share_of_crop_types_custom[_pulses]", varName: "Feed Share of crop types Custom[Pulses]", defaultValue: 0.014, minValue: 0, maxValue: 1 }, { inputId: "a_af_2", varId: "_feed_share_of_crop_types_custom[_grains]", varName: "Feed Share of crop types Custom[Grains]", defaultValue: 0.715, minValue: 0, maxValue: 1 }, { inputId: "a_af_3", varId: "_feed_share_of_crop_types_custom[_vegfruits]", varName: "Feed Share of crop types Custom[VegFruits]", defaultValue: 0.223, minValue: 0, maxValue: 1 }, { inputId: "a_af_4", varId: "_feed_share_of_crop_types_custom[_othercrops]", varName: "Feed Share of crop types Custom[OtherCrops]", defaultValue: 0.048, minValue: 0, maxValue: 1 }, { inputId: "a_af_5", varId: "_feed_conversion_ratio", varName: "Feed Conversion Ratio", defaultValue: 100, minValue: 90, maxValue: 110 }, { inputId: "a_sap", varId: "_yield_multiplier_switch", varName: "Yield Multiplier Switch", defaultValue: 2, minValue: -1, maxValue: 4 }, { inputId: "a_sap_1", varId: "_yield_custom[_pulses]", varName: "Yield Custom[Pulses]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_2", varId: "_yield_custom[_grains]", varName: "Yield Custom[Grains]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_3", varId: "_yield_custom[_vegfruits]", varName: "Yield Custom[VegFruits]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_4", varId: "_yield_custom[_othercrops]", varName: "Yield Custom[OtherCrops]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_3", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_4", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_5", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed_p", varId: "_fake_value_16", varName: "Fake Value 16", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed_p_1", varId: "_start_year_of_yield", varName: "Start Year of Yield", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_2", varId: "_end_year_of_yield", varName: "End Year of Yield", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_3", varId: "_start_year_of_feed_switch", varName: "Start Year of Feed Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_4", varId: "_end_year_of_feed_switch", varName: "End Year of Feed Switch", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_5", varId: "_start_year_of_fertiliser", varName: "Start Year of Fertiliser", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_6", varId: "_end_year_of_fertiliser", varName: "End Year of Fertiliser", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_26", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_27", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_28", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_29", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_30", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_31", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_32", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_33", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_34", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_35", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_36", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_37", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_38", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_39", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_40", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_41", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_42", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_46", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_47", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_48", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_49", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_50", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_52", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_53", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_54", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_55", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_56", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_57", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_58", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_59", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_62", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_63", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_64", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_65", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_pou_sigma_variation", varName: "SSP PoU Sigma Variation", defaultValue: 1, minValue: 0.8, maxValue: 1.2 }, { inputId: "ed_ext_70", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_75", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_76", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_77", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_79", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_80", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_81", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_82", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_83", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_84", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day[OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day[VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_arable_land_needed[_grains]", varName: "Arable Land Needed[Grains]" }, { varId: "_arable_land_needed[_othercrops]", varName: "Arable Land Needed[OtherCrops]" }, { varId: "_arable_land_needed[_pulses]", varName: "Arable Land Needed[Pulses]" }, { varId: "_arable_land_needed[_vegfruits]", varName: "Arable Land Needed[VegFruits]" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_by_food_category[_cropmeat]", varName: "Caloric Availability by Food Category[CropMeat]" }, { varId: "_caloric_availability_by_food_category[_dairy]", varName: "Caloric Availability by Food Category[Dairy]" }, { varId: "_caloric_availability_by_food_category[_eggs]", varName: "Caloric Availability by Food Category[Eggs]" }, { varId: "_caloric_availability_by_food_category[_grains]", varName: "Caloric Availability by Food Category[Grains]" }, { varId: "_caloric_availability_by_food_category[_othercrops]", varName: "Caloric Availability by Food Category[OtherCrops]" }, { varId: "_caloric_availability_by_food_category[_pasmeat]", varName: "Caloric Availability by Food Category[PasMeat]" }, { varId: "_caloric_availability_by_food_category[_pulses]", varName: "Caloric Availability by Food Category[Pulses]" }, { varId: "_caloric_availability_by_food_category[_vegfruits]", varName: "Caloric Availability by Food Category[VegFruits]" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_caloric_intake_per_capita_per_day_from_animal_food", varName: "Caloric Intake per Capita per Day from Animal Food" }, { varId: "_caloric_intake_per_capita_per_day_from_plant_food", varName: "Caloric Intake per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_crop_yield_for_each_category[_grains]", varName: "Crop yield for each category [Grains]" }, { varId: "_crop_yield_for_each_category[_othercrops]", varName: "Crop yield for each category [OtherCrops]" }, { varId: "_crop_yield_for_each_category[_pulses]", varName: "Crop yield for each category [Pulses]" }, { varId: "_crop_yield_for_each_category[_vegfruits]", varName: "Crop yield for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effect_of_sustainable_agricultural_productivity[_othercrops]", varName: "Effect of Sustainable Agricultural Productivity [OtherCrops]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_grains]", varName: "Effect of Sustainable Agricultural Productivity[Grains]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_pulses]", varName: "Effect of Sustainable Agricultural Productivity[Pulses]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_vegfruits]", varName: "Effect of Sustainable Agricultural Productivity[VegFruits]" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_final_feed_share[_othercrops]", varName: "Final Feed Share [OtherCrops]" }, { varId: "_final_feed_share[_grains]", varName: "Final Feed Share[Grains]" }, { varId: "_final_feed_share[_pulses]", varName: "Final Feed Share[Pulses]" }, { varId: "_final_feed_share[_vegfruits]", varName: "Final Feed Share[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_shortage_in_tonnes[_cropmeat]", varName: "Food shortage in tonnes[CropMeat]" }, { varId: "_food_shortage_in_tonnes[_dairy]", varName: "Food shortage in tonnes[Dairy]" }, { varId: "_food_shortage_in_tonnes[_eggs]", varName: "Food shortage in tonnes[Eggs]" }, { varId: "_food_shortage_in_tonnes[_grains]", varName: "Food shortage in tonnes[Grains]" }, { varId: "_food_shortage_in_tonnes[_othercrops]", varName: "Food shortage in tonnes[OtherCrops]" }, { varId: "_food_shortage_in_tonnes[_pasmeat]", varName: "Food shortage in tonnes[PasMeat]" }, { varId: "_food_shortage_in_tonnes[_pulses]", varName: "Food shortage in tonnes[Pulses]" }, { varId: "_food_shortage_in_tonnes[_vegfruits]", varName: "Food shortage in tonnes[VegFruits]" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_grassland_needed[_dairy]", varName: "Grassland Needed[Dairy]" }, { varId: "_grassland_needed[_pasmeat]", varName: "Grassland Needed[PasMeat]" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_animal_and_crop_production[_cropmeat]", varName: "Total Animal and Crop Production[CropMeat]" }, { varId: "_total_animal_and_crop_production[_dairy]", varName: "Total Animal and Crop Production[Dairy]" }, { varId: "_total_animal_and_crop_production[_eggs]", varName: "Total Animal and Crop Production[Eggs]" }, { varId: "_total_animal_and_crop_production[_grains]", varName: "Total Animal and Crop Production[Grains]" }, { varId: "_total_animal_and_crop_production[_othercrops]", varName: "Total Animal and Crop Production[OtherCrops]" }, { varId: "_total_animal_and_crop_production[_pasmeat]", varName: "Total Animal and Crop Production[PasMeat]" }, { varId: "_total_animal_and_crop_production[_pulses]", varName: "Total Animal and Crop Production[Pulses]" }, { varId: "_total_animal_and_crop_production[_vegfruits]", varName: "Total Animal and Crop Production[VegFruits]" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 489039, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const g=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(M){return w.deserialize(M,g)},serialize(M){return w.serialize(M,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(g){D=A.extendSerializer(D,g)}common.registerSerializer=Q;function B(g){return D.deserialize(g)}common.deserialize=B;function w(g){return D.serialize(g)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,g){if(!g){if(!D(w))throw Error();g=[w]}return{[A.$transferable]:!0,send:w,transferables:g}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,g){self.postMessage(w,g)},Q=function(w){const g=M=>{w(M.data)},E=()=>{self.removeEventListener("message",g)};return self.addEventListener("message",g),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(M){if(!M)throw Error("Invariant violation: MessagePort to parent is not available.");return M}const B=function(){return!D.default().isMainThread},w=function(K,i){Q(D.default().parentPort).postMessage(K,i)},g=function(K){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const a=O=>{K(O)},k=()=>{Q(i).off("message",a)};return Q(i).on("message",a),k};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:g,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function g(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?g():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(o,P,n,F){function d(z){return z instanceof n?z:new n(function(b){b(z)})}return new(n||(n=Promise))(function(z,b){function _(x){try{v(F.next(x))}catch(X){b(X)}}function $(x){try{v(F.throw(x))}catch(X){b(X)}}function v(x){x.done?z(x.value):d(x.value).then(_,$)}v((F=F.apply(o,P||[])).next())})},Q=worker&&worker.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),g=requireTransferable(),E=requireMessages(),M=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=M.default.isWorkerRuntime;let a=!1;const k=new Map,O=o=>o&&o.type===E.MasterMessageType.cancel,N=o=>o&&o.type===E.MasterMessageType.run,t=o=>B.default(o)||L(o);function L(o){return o&&typeof o=="object"&&typeof o.subscribe=="function"}function y(o){return g.isTransferDescriptor(o)?{payload:o.send,transferables:o.transferables}:{payload:o,transferables:void 0}}function U(){const o={type:E.WorkerMessageType.init,exposed:{type:"function"}};M.default.postMessageToMaster(o)}function q(o){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:o}};M.default.postMessageToMaster(P)}function c(o,P){const{payload:n,transferables:F}=y(P),d={type:E.WorkerMessageType.error,uid:o,error:w.serialize(n)};M.default.postMessageToMaster(d,F)}function H(o,P,n){const{payload:F,transferables:d}=y(n),z={type:E.WorkerMessageType.result,uid:o,complete:P?!0:void 0,payload:F};M.default.postMessageToMaster(z,d)}function R(o,P){const n={type:E.WorkerMessageType.running,uid:o,resultType:P};M.default.postMessageToMaster(n)}function h(o){try{const P={type:E.WorkerMessageType.uncaughtError,error:w.serialize(o)};M.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,o)}}function m(o,P,n){return D(this,void 0,void 0,function*(){let F;try{F=P(...n)}catch(z){return c(o,z)}const d=t(F)?"observable":"promise";if(R(o,d),t(F)){const z=F.subscribe(b=>H(o,!1,w.serialize(b)),b=>{c(o,w.serialize(b)),k.delete(o)},()=>{H(o,!0),k.delete(o)});k.set(o,z)}else try{const z=yield F;H(o,!0,w.serialize(z))}catch(z){c(o,w.serialize(z))}})}function p(o){if(!M.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(a)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(a=!0,typeof o=="function")M.default.subscribeToMasterMessages(P=>{N(P)&&!P.method&&m(P.uid,o,P.args.map(w.deserialize))}),U();else if(typeof o=="object"&&o){M.default.subscribeToMasterMessages(n=>{N(n)&&n.method&&m(n.uid,o[n.method],n.args.map(w.deserialize))});const P=Object.keys(o).filter(n=>typeof o[n]=="function");q(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${o}`);M.default.subscribeToMasterMessages(P=>{if(O(P)){const n=P.uid,F=k.get(n);F&&(F.unsubscribe(),k.delete(n))}})}A.expose=p,typeof self<"u"&&typeof self.addEventListener=="function"&&M.default.isWorkerRuntime()&&(self.addEventListener("error",o=>{setTimeout(()=>h(o.error||o),250)}),self.addEventListener("unhandledrejection",o=>{const P=o.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&M.default.isWorkerRuntime()&&(process.on("uncaughtException",o=>{setTimeout(()=>h(o),250)}),process.on("unhandledRejection",o=>{o&&typeof o.message=="string"&&setTimeout(()=>h(o),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,g=w?.length||0;D[Q++]=g;for(let E=0;E<g;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const g of A){const E=g.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const M=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=M,B+=2,w+=((Q=g.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const g of A){const E=g.varRef.varSpec;D[B++]=E.varIndex;const M=E.subscriptIndices,K=M?.length||0;D[B++]=K;for(let i=0;i<K;i++)D[B++]=M[i];g.points!==void 0?(D[B++]=w,D[B++]=g.points.length,Q?.set(g.points,w),w+=g.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let g=0;g<w;g++){const E=A[B++],M=A[B++],K=M>0?Array(M):void 0;for(let N=0;N<M;N++)K[N]=A[B++];const i=A[B++],a=A[B++],k={varIndex:E,subscriptIndices:K};let O;i>=0?D?O=D.slice(i,i+a):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:k},points:O})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let g;const E=D.varSpecs;E!==void 0&&E.length>0?g=getEncodedVarIndicesLength(E):g=0;let M,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const m of Q.lookups)resolveVarRef(this.listing,m.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);M=h.lookupsLength,K=h.lookupIndicesLength}else M=0,K=0;let i=0;function a(h,m){const p=i,o=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(m*o),n=Math.ceil(P/8)*8;return i+=n,p}const k=a("int32",headerLengthInElements),O=a("float64",extrasLengthInElements),N=a("float64",B),t=a("float64",w),L=a("int32",g),y=a("float64",M),U=a("int32",K),q=i;if(this.encoded===void 0||this.encoded.byteLength<q){const h=Math.ceil(q*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,k,headerLengthInElements)}const c=this.header.view;let H=0;c[H++]=O,c[H++]=extrasLengthInElements,c[H++]=N,c[H++]=B,c[H++]=t,c[H++]=w,c[H++]=L,c[H++]=g,c[H++]=y,c[H++]=M,c[H++]=U,c[H++]=K,this.inputs.update(this.encoded,N,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,t,w),this.outputIndices.update(this.encoded,L,g),this.lookups.update(this.encoded,y,M),this.lookupIndices.update(this.encoded,U,K);const R=this.inputs.view;for(let h=0;h<A.length;h++){const m=A[h];typeof m=="number"?R[h]=m:R[h]=m.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const g=B[w++],E=B[w++],M=B[w++],K=B[w++],i=B[w++],a=B[w++],k=B[w++],O=B[w++],N=B[w++],t=B[w++],L=B[w++],y=B[w++],U=E*Float64Array.BYTES_PER_ELEMENT,q=K*Float64Array.BYTES_PER_ELEMENT,c=a*Float64Array.BYTES_PER_ELEMENT,H=O*Int32Array.BYTES_PER_ELEMENT,R=t*Float64Array.BYTES_PER_ELEMENT,h=y*Int32Array.BYTES_PER_ELEMENT,m=D+U+q+c+H+R+h;if(A.byteLength<m)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,g,E),this.inputs.update(this.encoded,M,K),this.outputs.update(this.encoded,i,a),this.outputIndices.update(this.encoded,k,O),this.lookups.update(this.encoded,N,t),this.lookupIndices.update(this.encoded,L,y)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,g=!D;let E;g&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let M=E;M<w;M+=2){const K=B[M];if(K>=A){if(g&&(this.lastInput=A,this.lastHitIndex=M),M===0||K===A)return B[M+1];switch(Q){default:case"interpolate":{const i=B[M-2],a=B[M-1],k=B[M+1],O=K-i,N=k-a;return a+N/O*(A-i)}case"forward":return B[M+1];case"backward":return B[M-1]}}}return g&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const g=Q[w];if(g>=A){const E=Q[w-2],M=Q[w-1],K=Q[w+1],i=g-E,a=K-M;return M+a/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,g,E){const M=Math.floor((E-B)/g);for(let K=0;K<=M;K++)if(A.currentTime<=E&&pulse(A,B+K*g,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,g){return A.currentTime>w?A.currentTime<g||w>g?B*(A.currentTime-w):B*(g-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,g){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let M=D.get(w);M===void 0&&(M=Array(w),D.set(w,M));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=g>0?1:-1;E.sort((i,a)=>{let k;return i.x<a.x?k=-1:i.x>a.x?k=1:k=0,k*K});for(let i=0;i<w;i++)M[i]=E[i].ind;return M},XIDZ(B,w,g){return Math.abs(w)<EPSILON?g:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,g){let E;return g>=1?E="forward":g<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const g=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,g,{outputIndices:B,lookups:A.getLookups()});const M=perfElapsed(E);A.storeOutputs(g),A.storeElapsedTime(M)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),g=A.getSaveFreq(),E=Math.round((B-Q)/g)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:g,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(M,K,i)=>{runJsModel(A,Q,B,w,g,E,M,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,g,E,M,K,i,a){let k=D;A.setTime(k);const O={timeStep:B,currentTime:k};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const q of i)A.setLookup(q.varRef.varSpec,q.points);E?.length>0&&A.setInputs(q=>E[q]),A.initLevels();const N=Math.round((Q-D)/B),t=Q;let L=0,y=0,U=0;for(;L<=N;){if(A.evalAux(),k%w<1e-6){U=0;const q=c=>{const H=U*g+y;M[H]=k<=t?c:void 0,U++};if(K!==void 0){let c=0;const H=K[c++];for(let R=0;R<H;R++){const h=K[c++],m=K[c++];let p;m>0&&(p=K.subarray(c,c+m),c+=m);const o={varIndex:h,subscriptIndices:p};A.storeOutput(o,q)}}else A.storeOutputs(q);y++}if(L===N)break;A.evalLevels(),k+=B,A.setTime(k),O.currentTime=k,L++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),g=w/4,E=A.HEAP32.subarray(g,g+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),g=w/8,E=A.HEAPF64.subarray(g,g+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,g,E,M;const K=A.getLookups();if(K!==void 0)for(const N of K){const t=N.varRef.varSpec,L=((D=t.subscriptIndices)==null?void 0:D.length)||0;let y;L>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<L)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,L)),this.lookupSubIndicesBuffer.getArrayView().set(t.subscriptIndices),y=this.lookupSubIndicesBuffer.getAddress()):y=0;let U,q;if(N.points){const H=N.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<H)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,H)),this.lookupDataBuffer.getArrayView().set(N.points),U=this.lookupDataBuffer.getAddress(),q=H/2}else U=0,q=0;const c=t.varIndex;this.wasmSetLookup(c,y,U,q)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),N=>{var t;return(t=this.inputsBuffer)==null||t.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,N),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((g=this.outputIndicesBuffer)==null?void 0:g.getArrayView(),N=>{var t;return(t=this.outputIndicesBuffer)==null||t.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,N),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const a=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<a)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,a));const k=perfNow();this.wasmRunModel(((M=this.inputsBuffer)==null?void 0:M.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(k);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(C,I){B=C,w=I}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_arable_land_needed[_grains]","_arable_land_needed[_othercrops]","_arable_land_needed[_pulses]","_arable_land_needed[_vegfruits]","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_by_food_category[_cropmeat]","_caloric_availability_by_food_category[_dairy]","_caloric_availability_by_food_category[_eggs]","_caloric_availability_by_food_category[_grains]","_caloric_availability_by_food_category[_othercrops]","_caloric_availability_by_food_category[_pasmeat]","_caloric_availability_by_food_category[_pulses]","_caloric_availability_by_food_category[_vegfruits]","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_caloric_intake_per_capita_per_day_from_animal_food","_caloric_intake_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_crop_yield_for_each_category[_grains]","_crop_yield_for_each_category[_othercrops]","_crop_yield_for_each_category[_pulses]","_crop_yield_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effect_of_sustainable_agricultural_productivity[_othercrops]","_effect_of_sustainable_agricultural_productivity[_grains]","_effect_of_sustainable_agricultural_productivity[_pulses]","_effect_of_sustainable_agricultural_productivity[_vegfruits]","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_final_feed_share[_othercrops]","_final_feed_share[_grains]","_final_feed_share[_pulses]","_final_feed_share[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_shortage_in_tonnes[_cropmeat]","_food_shortage_in_tonnes[_dairy]","_food_shortage_in_tonnes[_eggs]","_food_shortage_in_tonnes[_grains]","_food_shortage_in_tonnes[_othercrops]","_food_shortage_in_tonnes[_pasmeat]","_food_shortage_in_tonnes[_pulses]","_food_shortage_in_tonnes[_vegfruits]","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_grassland_needed[_dairy]","_grassland_needed[_pasmeat]","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_animal_and_crop_production[_cropmeat]","_total_animal_and_crop_production[_dairy]","_total_animal_and_crop_production[_eggs]","_total_animal_and_crop_production[_grains]","_total_animal_and_crop_production[_othercrops]","_total_animal_and_crop_production[_pasmeat]","_total_animal_and_crop_production[_pulses]","_total_animal_and_crop_production[_vegfruits]","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var g={},E;for(E in Q)Q.hasOwnProperty(E)&&(g[E]=Q[E]);var M=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function a(C){return Q.locateFile?Q.locateFile(C,i):i+C}var k,O;(M||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(C){try{var I=new XMLHttpRequest;return I.open("GET",C,!1),I.responseType="arraybuffer",I.send(null),new Uint8Array(I.response)}catch(e){var s=DA(C);if(s)return s;throw e}}),k=function(C,I,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){I(e.response);return}var u=DA(C);if(u){I(u.buffer);return}s()},e.onerror=s,e.send(null)});var N=Q.print||console.log.bind(console),t=Q.printErr||console.warn.bind(console);for(E in g)g.hasOwnProperty(E)&&(Q[E]=g[E]);g=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var L;Q.wasmBinary&&(L=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&V("no native wasm support detected");var y,U=!1;function q(C,I){C||V("Assertion failed: "+I)}function c(C){var I=Q["_"+C];return q(I,"Cannot call unknown function "+C+", make sure it is exported"),I}function H(C,I,s,e,u){var j={string:function(Y){var T=0;if(Y!=null&&Y!==0){var eA=(Y.length<<2)+1;T=CA(eA),P(Y,T,eA)}return T},array:function(Y){var T=CA(Y.length);return n(Y,T),T}};function G(Y){return I==="string"?p(Y):I==="boolean"?!!Y:Y}var r=c(C),f=[],S=0;if(e)for(var J=0;J<e.length;J++){var rA=j[s[J]];rA?(S===0&&(S=sA()),f[J]=rA(e[J])):f[J]=e[J]}var gA=r.apply(null,f);function mA(Y){return S!==0&&KA(S),G(Y)}return gA=mA(gA),gA}function R(C,I,s,e){s=s||[];var u=s.every(function(G){return G==="number"}),j=I!=="string";return j&&u&&!e?c(C):function(){return H(C,I,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function m(C,I,s){for(var e=I+s,u=I;C[u]&&!(u>=e);)++u;if(u-I>16&&C.subarray&&h)return h.decode(C.subarray(I,u));for(var j="";I<u;){var G=C[I++];if(!(G&128)){j+=String.fromCharCode(G);continue}var r=C[I++]&63;if((G&224)==192){j+=String.fromCharCode((G&31)<<6|r);continue}var f=C[I++]&63;if((G&240)==224?G=(G&15)<<12|r<<6|f:G=(G&7)<<18|r<<12|f<<6|C[I++]&63,G<65536)j+=String.fromCharCode(G);else{var S=G-65536;j+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return j}function p(C,I){return C?m(d,C,I):""}function o(C,I,s,e){if(!(e>0))return 0;for(var u=s,j=s+e-1,G=0;G<C.length;++G){var r=C.charCodeAt(G);if(r>=55296&&r<=57343){var f=C.charCodeAt(++G);r=65536+((r&1023)<<10)|f&1023}if(r<=127){if(s>=j)break;I[s++]=r}else if(r<=2047){if(s+1>=j)break;I[s++]=192|r>>6,I[s++]=128|r&63}else if(r<=65535){if(s+2>=j)break;I[s++]=224|r>>12,I[s++]=128|r>>6&63,I[s++]=128|r&63}else{if(s+3>=j)break;I[s++]=240|r>>18,I[s++]=128|r>>12&63,I[s++]=128|r>>6&63,I[s++]=128|r&63}}return I[s]=0,s-u}function P(C,I,s){return o(C,d,I,s)}function n(C,I){F.set(C,I)}var F,d,z;function b(C){Q.HEAP8=F=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=z=new Int32Array(C),Q.HEAPU8=d=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var _,$=[],v=[],x=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());wA($)}function GA(){wA(v)}function kA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());wA(x)}function PA(C){$.unshift(C)}function aA(C){v.unshift(C)}function cA(C){x.unshift(C)}var l=0,W=null;function HA(C){l++,Q.monitorRunDependencies&&Q.monitorRunDependencies(l)}function NA(C){if(l--,Q.monitorRunDependencies&&Q.monitorRunDependencies(l),l==0&&W){var I=W;W=null,I()}}Q.preloadedImages={},Q.preloadedAudios={};function V(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",t(C),U=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var I=new WebAssembly.RuntimeError(C);throw w(I),I}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function MA(C){return C.startsWith("file://")}var Z;Z="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFB8LHOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKm9APOsEFAgt/AXwjAEEQayIGJAACQEGIpw4oAgAiAgRAIAJBkKcOKAIAIgFBlKcOKAIAbEEDdGpBmKcOKAIAQQN0aiAAOQMAQZCnDiABQQFqNgIADAELQYCnDigCACIBRQRAAn9BoP0FKwMAQbi5BisDAKFBoLoHKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQYCnDkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQYSnDigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEGEpw5BhKcOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAF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DkGggggrAwBBsOYMKwMAojkDAEHwlQ5B8IAIKwMAQYDlDCsDAKI5AwBBmJcOQZiCCCsDAEGo5gwrAwCiOQMAQeiVDkHogAgrAwBB+OQMKwMAojkDAEGQlw5BkIIIKwMAQaDmDCsDAKI5AwBB4JUOQeCACCsDAEHw5AwrAwCiOQMAQYiXDkGIgggrAwBBmOYMKwMAojkDAEHYlQ5B2IAIKwMAQejkDCsDAKI5AwBBgJcOQYCCCCsDAEGQ5gwrAwCiOQMAQdCVDkHQgAgrAwBB4OQMKwMAojkDAEH4lg5B+IEIKwMAQYjmDCsDAKI5AwBByJUOQciACCsDAEHY5AwrAwCiOQMAQfCWDkHwgQgrAwBBgOYMKwMAojkDAEHAlQ5BwIAIKwMAQdDkDCsDAKI5AwBB6JYOQeiBCCsDAEH45QwrAwCiOQMAQbiVDkG4gAgrAwBByOQMKwMAojkDAEHglg5B4IEIKwMAQfDlDCsDAKI5AwBBkJkOQfCGCCsDAEHQ5QwrAwCiOQMAQbiaDkGYiAgrAwBB+OYMKwMAojkDAEGImQ5B6IYIKwMAQcjlDCsDAKI5AwBBsJoOQZCICCsDAEHw5gwrAwCiOQMAQYCZDkHghggrAwBBwOUMKwMAojkDAEGomg5BiIgIKwMAQejmDCsDAKI5AwBB+JgOQdiGCCsDAEG45QwrAwCiOQMAQaCaDkGAiAgrAwBB4OYMKwMAojkDAEHwmA5B0IYIKwMAQbDlDCsDAKI5AwBBmJoOQfiHCCsDAEHY5gwrAwCiOQMAQeiYDkHIhggrAwBBqOUMKwMAojkDAEGQmg5B8IcIKwMAQdDmDCsDAKI5AwBB4JgOQcCGCCsDAEGg5QwrAwCiOQMAQYiaDkHohwgrAwBByOYMKwMAojkDAEHYmA5BuIYIKwMAQZjlDCsDAKI5AwBBgJoOQeCHCCsDAEHA5gwrAwCiOQMAQdCYDkGwhggrAwBBkOUMKwMAojkDAEH4mQ5B2IcIKwMAQbjmDCsDAKI5AwBByJgOQaiGCCsDAEGI5QwrAwCiOQMAQfCZDkHQhwgrAwBBsOYMKwMAojkDAEHAmA5BoIYIKwMAQYDlDCsDAKI5AwBB6JkOQciHCCsDAEGo5gwrAwCiOQMAQbiYDkGYhggrAwBB+OQMKwMAojkDAEHgmQ5BwIcIKwMAQaDmDCsDAKI5AwBB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Qpqz5syZs+b0PzcDAEGw6gVCgICAgICA7s/AADcDAEG46gVCgICAgOCW0KnBADcDAEHA6gVCzZmz5syZ857AADcDAEHI6gVC5syZs+bMiM3AADcDAEHQ6gVCADcDAEHw6gVC+6i4vdTDjKDBADcDAEHg6gVCzZmz5syDnafBADcDAEHo6gVC5syZs+a8iaPBADcDAEH46gVCnbSR2/P704bAADcDAEGA6wVC0vD6qLi9lPI/NwMAQYjrBUKz5syZs+bM8T83AwBBuOsFQo7ayO35/emEwAA3AwBBsOsFQvDPmt70puKFwAA3AwBBqOsFQuH10fD6qLj7PzcDAEGg6wVCs+bMmbPmzPE/NwMAQZjrBUKjtuf3p42v/D83AwBBkOsFQrPmzJmz5sz5PzcDAEHI6wVCmrPmzJmz5vQ/NwMAQcDrBUK25/enja+67z83AwBB0OsFQoCAgICAgID6PzcDAEHY6wVCs+bMmbPmzO0/NwMAQeDrBUKAgICAgICa0MAANwMAQejrBUKAgICAgICAisAANwMAQfDrBUKAgICAgICAisAANwMAQfjrBUKAgICAgIDkz8AANwMAQYDsBUKAgICAgICAiMAANwMAQYjsBUK8+sqymcSDgcAANwMAQZDsBUK8+sqymcSDgcAANwMAQZjsBUKAgICAgICAgMAANwMAQaDsBUKKuOvd+dSO9D83AwBBqOwFQoq469351I70PzcDAEGw7AVCueiituf3p8U/NwMAQbjsBULpjIvNzp25+z83AwBBwOwFQumMi83Onbn7PzcDAEHI7AVCgICAgICAgIDAADcDAEHQ7AVCgICAgICAgITAADcDAEHY7AVCueiituf3p8U/NwMAQeDsBUIANwMAQejsBUKAgICAgICAksAANwMAQfDsBUKAgICAgIDAlMAANwMAQfjsBUKAgICAgICAmsAANwMAQYDtBUKq1arVqtWqoMAANwMAQYjtBUKAgICAgICAhMAANwMAQZDtBULK9o38wsnBj8AANwMAQZjtBULK9o38wsnBj8AANwMAQaDtBUKvq8LupeL58j83AwBBqO0FQq+rwu6l4vnyPzcDAEG47QVCgICAgICAgIzAADcDAEGw7QVCmrPmzJmz5uQ/NwMAQcDtBUL6/anjy+6k+D83AwBByO0FQrPmzJmz5syAwAA3AwBB4O0FQoCAgICAgID4PzcDAEHY7QVC3J6Kro+F1/M/NwMAQdDtBUKAgICAgICA+D83AwBB6O0FQoCAgICAgKCrwAA3AwBB8O0FQs3cmIasx8PxPzcDAEH47QVC2cGFp9L5x+A/NwMAQYDuBUKAgICAgIDnz8AANwMAQcjuBUKAgICAgICQwMAANwMAQcDuBUK/6vjSm4mmssAANwMAQbjuBULloYvZnZ/5xsAANwMAQbDuBUKZxOO68bbko8AANwMAQajuBUKQ9NnZ6uf9m8AANwMAQaDuBUKuj4XXx8K5sMAANwMAQZjuBUL4p42vupO3rsAANwMAQZDuBULGudelyI+cocAANwMAQejuBUKAgICAgICAisAANwMAQeDuBUKAgICAgIDApMAANwMAQdjuBUKAgICAgIDAnMAANwMAQdDuBUKAgICAgICAl8AANwMAQfDuBUKAgICA65H8/cEANwMAQfjuBUKAgICAgIC0u8AANwMAQYDvBUKAgICAgICA+D83AwBBiO8FQoCAgICAgO7PwAA3AwBBkO8FQpKGgtactJHbPzcDAEGY7wVCgICAgICA0MfAADcDAEGg7wVCgICAgICAgJLAADcDAEGw7wVCmrPmzJmz5uQ/NwMAQajvBUKas+bMmbPm5D83AwBBuO8FQpqz5syZs+bkPzcDAEHA7wVCgICAgOuR/P3BADcDAEHI7wVCmrPmzJmz5uQ/NwMAQdDvBUKAgICAgICAmsAANwMAQdjvBUKAgICAgICA+D83AwBB4O8FQoCAgKCwjb2SwgA3AwBB6O8FQoCAgICAgNrPwAA3AwBBmPEFQoCAgICAgPvJwAA3AwBBuPIFQoCAgICAgPjOwAA3AwBBsPIFQoCAgICAgPjOwAA3AwBBqPIFQoCAgICAgPjOwAA3AwBBoPIFQoCAgICAgPjOwAA3AwBBmPIFQoCAgICAgPjOwAA3AwBBkPIFQoCAgICAgPjOwAA3AwBBiPIFQoCAgICAgPjOwAA3AwBBgPIFQoCAgICAgPjOwAA3AwBB+PEFQoCAgICAgPjOwAA3AwBB8PEFQoCAgICAgPjOwAA3AwBB6PEFQoCAgICAgPjOwAA3AwBB4PEFQoCAgICAwKbQwAA3AwBB2PEFQoCAgICAwKbQwAA3AwBB0PEFQoCAgICAwKbQwAA3AwBByPEFQoCAgICAwKbQwAA3AwBBwPEFQoCAgICAwKbQwAA3AwBBuPEFQoCAgICAwJDRwAA3AwBBsPEFQoCAgICAwLvQwAA3AwBBqPEFQoCAgICAgPjPwAA3AwBBoPEFQoCAgICAgM/MwAA3AwBBkPEFQoCAgICAwJDRwAA3AwBBiPEFQoCAgICAwJDRwAA3AwBBgPEFQoCAgICAwJDRwAA3AwBB+PAFQoCAgICAwJDRwAA3AwBB8PAFQoCAgICAwJDRwAA3AwBB6PAFQoCAgICAwJDRwAA3AwBB4PAFQoCAgICAwJDRwAA3AwBB2PAFQoCAgICAwJDRwAA3AwBB0PAFQoCAgICAwPrRwAA3AwBByPAFQoCAgICAwPrRwAA3AwBBwPAFQoCAgICAwPrRwAA3AwBBuPAFQoCAgICAwPrRwAA3AwBBsPAFQoCAgICAgOXSwAA3AwBBqPAFQoCAgICAgOXSwAA3AwBBoPAFQoCAgICAgOXSwAA3AwBBmPAFQoCAgICAgOXSwAA3AwBBkPAFQoCAgICAgM/TwAA3AwBBiPAFQoCAgICAgLrTwAA3AwBBgPAFQoCAgICAgObQwAA3AwBB+O8FQoCAgICAgKTNwAA3AwBB8O8FQoCAgICAgMLKwAA3AwBBwPIFQoCAgICAgID4PzcDAEHI8gVCgICAgICAgPg/NwMAQdDyBUKAgICAgICA+D83AwBB2PIFQpqz5syZs+b0PzcDAEHg8gVCADcDAEHo8gVCgICAgICAgPo/NwMAQfDyBUKAgICAgICAisAANwMAQfjyBULwluzI/sOf4D03AwBBgPMFQp6zwZDKqbLfPTcDAEGQ8wVCgICAgICAgPg/NwMAQYjzBUKAgICAgICA+D83AwBBmPMFQoCAgICAgID4PzcDAEGg8wVCgICAgICAgPg/NwMAQajzBUKAgICAgIDM2MAANwMAQbDzBUKAgICAgIDM2MAANwMAQbjzBUKAgICAgIDM2MAANwMAQcDzBUKAgICAgIDM2MAANwMAQcjzBUK56KK25/envb9/NwMAQdDzBUKBuvLR+7j0hD83AwBB2PMFQozO1fmF6uerPjcDAEHg8wVCgICAgICAgJLAADcDAEHo8wVCgICAgICAwKTAADcDAEHw8wVCs/Wpr9DLsrk+NwMAQfjzBUKAgICAgICA/D83AwBBgPQFQoCAgICAgMCkwAA3AwBBiPQFQoCAgICAgID4PzcDAEGQ9AVCgICAgICAgPo/NwMAQZj0BUKAgICAgICAisAANwMAQaD0BUKthvHYrtyNjb9/NwMAQaj0BUKA0Iq33MX5y79/NwMAQbD0BUL7qLi9lNyewj83AwBBuPQFQrji66v97bLQPzcDAEHA9AVC/vn5r9D889g9NwMAQcj0BULJ4O6l39W3uz03AwBB0PQFQqnMkZ3di/2PPjcDAEHY9AVC8JbsyP7Dn+A9NwMAQeD0BUKD8Kiq/rnPmT43AwBB6PQFQp6zwZDKqbLfPTcDAEHw9AVCla2bwb7By4g+NwMAQYD1BULso+H10fD62D83AwBB+PQFQrv73s79m9/tPTcDAEGI9QVCgICAgICAgPg/NwMAQaj1BUL6/anjy+6ktD83AwBBoPUFQri9lNyeiq7PPzcDAEGY9QVCuL2U3J6Krtc/NwMAQZD1BULmzJmz5syZ9z83AwBB+PUFQqrjy+6kjITUPzcDAEGQ9gVCgICAgIqm5PXBADcDAEGY9gVC+6i4vZTcnuo/NwMAQaD2BUL7qLi9lNyesj83AwBBqPYFQoCAgICAgICRwAA3AwBBsPYFQoCAgICIuIPjwQA3AwBBuPYFQrPmzJmz5sz1v383AwBBwPYFQvuouL2U3J7CPzcDAEHI9gVCnImDgauO2sg/NwMAQdD2BULS95u+7bOWiT83AwBB2PYFQri9lNyeiq6/PzcDAEHg9gVC+6i4vZTcnsI/NwMAQej2BULb8/vTxpfd0T83AwBB8PYFQsje8tWp/rW9PjcDAEH49gVCgICAgICAgdDAADcDAEGA9wVCgICAgICA+M/AADcDAEGI9wVCgICAgICA+M/AADcDAEGQ9wVCgICAgICA7s/AADcDAEGY9wVCgICAgICA7s/AADcDAEGg9wVCgICAgICAgdDAADcDAEGo9wVCgICAgICAgdDAADcDAEGw9wVCgICAgICA+M/AADcDAEG49wVCgICAgICAgdDAADcDAEHA9wVCgICAgICA7s/AADcDAEHw9wVBAEGIARAQGkGY+QVBAEGIARAQGkHQ+gVBAEHgABAQGkH4+wVBAEHgABAQGkGw+wVCADcDAEHw/AVCgICAgICAgPA/NwMAQfj8BUL7qLi9lNyewj83AwBBgP0FQgA3AwBBiP0FQoCAgICAgICKwAA3AwBBkP0FQri9lNyeiq7PPzcDAEGY/QVCmrPmzJmz5uw/NwMAQaD9BUKAgICAgICa0MAANwMAQaj9BUL7qLi9lNye0j83AwBB0P0FQoCAgICAgMCswAA3AwBByP0FQoCAgICAgMCswAA3AwBBwP0FQoCAgICAgMCswAA3AwBBuP0FQoCAgICAgMCswAA3AwBBsP0FQoCAgICAgMCswAA3AwBBwPsFQgA3AwBBuPsFQgA3AwBB2PwFQgA3AwBB4PwFQgA3AwBB6PwFQgA3AwBBmP4FQoCAgICAgID4PzcDAEGQ/gVCgICAgICAgPg/NwMAQYj+BUKAgICAgICA+D83AwBBgP4FQoCAgICAgID4PzcDAEH4/QVCgICAgICAgPg/NwMAQfD9BUKAgICAgICA+D83AwBB6P0FQoCAgICAgID4PzcDAEHg/QVCgICAgICAgPg/NwMAQaD+BUIANwMAQaj+BUKAgICAgICwrMAANwMAQbD+BUIANwMAQbj+BUIANwMAQcD+BUIANwMAQcj+BUIANwMAQdj+BUIANwMAQdD+BUIANwMAQeD+BUIANwMAQej+BUKAgICAgIDArMAANwMAQfD+BUKAgICAgICA+L9/NwMAQbj/BUKas+bMmbPm1D83AwBBsP8FQrPmzJmz5szhPzcDAEGo/wVCs+bMmbPmzPU/NwMAQaD/BUL7qLi9lNyewj83AwBB+P8FQvr9qePL7qTUPzcDAEHw/wVCpYyErLnoouY/NwMAQej/BULh9dHw+qi48z83AwBB4P8FQvnSm4mDgavGPzcDAEG4gAZC+v2p48vupNQ/NwMAQbCABkKljISsueii5j83AwBBqIAGQuH10fD6qLjzPzcDAEGggAZC+dKbiYOBq8Y/NwMAQfiABkKas+bMmbPm5D83AwBB8IAGQri9lNyeiq7fPzcDAEHogAZC5syZs+bMmes/NwMAQeCABkKKro+F18fC4z83AwBBuIEGQrPmzJmz5szpPzcDAEGwgQZCs+bMmbPmzOE/NwMAQaiBBkLh9dHw+qi47T83AwBBoIEGQri9lNyeiq7PPzcDAEHAgQZCgICAgICAgPg/NwMAQciBBkKAgICAgIDhz8AANwMAQdCBBkKAgICQytLGvsIANwMAQdiBBkKAgICAgICAr8AANwMAQeCBBkKas+bMmbPm5D83AwBBwIQGQp/N3cnO7e3TPzcDAEGYgwZCkoKZp+Gl/cY/NwMAQeiBBkKKro+F18fCyz83AwBB+IQGQrzzuvXE8PDZPzcDAEHwhAZCvPO69cTw8Nk/NwMAQeiEBkK887r1xPDw2T83AwBB4IQGQtj2zan8ru/aPzcDAEHYhAZC/YXAocWWito/NwMAQdCEBkKP+7OxqaS+2T83AwBByIQGQrHpm5L1zoLXPzcDAEG4hAZCnpTAzb37ncs/NwMAQbCEBkKelMDNvfudyz83AwBBqIQGQp6UwM29+53LPzcDAEGghAZCnpTAzb37ncs/NwMAQZiEBkKelMDNvfudyz83AwBBkIQGQp6UwM29+53LPzcDAEGIhAZCnpTAzb37ncs/NwMAQYCEBkKelMDNvfudyz83AwBB+IMGQp6UwM29+53LPzcDAEHwgwZCnpTAzb37ncs/NwMAQeiDBkKelMDNvfudyz83AwBB4IMGQvC4iJb03r3MPzcDAEHYgwZC8LiIlvTevcw/NwMAQdCDBkLwuIiW9N69zD83AwBByIMGQvC4iJb03r3MPzcDAEHAgwZC8LiIlvTevcw/NwMAQbiDBkLB3dDeqsLdzT83AwBBsIMGQubZ49eY2d3MPzcDAEGogwZCgvfRkqvq/cs/NwMAQaCDBkKP+7OxqaS+yT83AwBB6IUGQtD84PyGu4S5PzcDAEHohgZC1d6t/rTYxr0/NwMAQeCGBkLV3q3+tNjGvT83AwBB2IYGQtXerf602Ma9PzcDAEHQhgZC1d6t/rTYxr0/NwMAQciGBkLV3q3+tNjGvT83AwBBwIYGQtXerf602Ma9PzcDAEG4hgZC1d6t/rTYxr0/NwMAQbCGBkLD54nS0reHvz83AwBBqIYGQsPnidLSt4e/PzcDAEGghgZCw+eJ0tK3h78/NwMAQZiGBkLD54nS0reHvz83AwBBkIYGQsPnidLSt4e/PzcDAEGIhgZCmfjykriLpMA/NwMAQYCGBkKYkcHK6f2tvz83AwBB+IUGQpmUm+Gkq7q+PzcDAEHwhQZCvYLjuensuLs/NwMAQeCFBkKh8KfBjbLy2D83AwBB2IUGQqHwp8GNsvLYPzcDAEHQhQZCofCnwY2y8tg/NwMAQciFBkKh8KfBjbLy2D83AwBBwIUGQqHwp8GNsvLYPzcDAEG4hQZCofCnwY2y8tg/NwMAQbCFBkKh8KfBjbLy2D83AwBBqIUGQqHwp8GNsvLYPzcDAEGghQZCofCnwY2y8tg/NwMAQZiFBkKh8KfBjbLy2D83AwBBkIUGQqHwp8GNsvLYPzcDAEGIhQZCvPO69cTw8Nk/NwMAQYCFBkK887r1xPDw2T83AwBBiIsGQpXgvZ7/tKPmPzcDAEG4iAZC8vft9M/9keM/NwMAQaiLBkLkpZzygZGL7T83AwBBoIsGQqGt0/mOp5HsPzcDAEGYiwZCzfbitKb3tes/NwMAQZCLBkK9sajO6K6F6T83AwBB2IkGQqOKyoXfvq3oPzcDAEHQiQZCo4rKhd++reg/NwMAQciJBkKjisqF376t6D83AwBBwIkGQqOKyoXfvq3oPzcDAEG4iQZCo4rKhd++reg/NwMAQbCJBkKjisqF376t6D83AwBBqIkGQqOKyoXfvq3oPzcDAEGgiQZCo4rKhd++reg/NwMAQZiJBkKjisqF376t6D83AwBBkIkGQqOKyoXfvq3oPzcDAEGIiQZCo4rKhd++reg/NwMAQYCJBkLZvoOm7qik6T83AwBB+IgGQtm+g6buqKTpPzcDAEHwiAZC2b6Dpu6opOk/NwMAQeiIBkLZvoOm7qik6T83AwBB4IgGQtm+g6buqKTpPzcDAEHYiAZCvMO01MCTm+o/NwMAQdCIBkLVvLuEp4u86T83AwBByIgGQrzjgoWD5fToPzcDAEHAiAZC6rPB0LyfjuY/NwMAQYiHBkLV3q3+tNjGvT83AwBBgIcGQtXerf602Ma9PzcDAEH4hgZC1d6t/rTYxr0/NwMAQfCGBkLV3q3+tNjGvT83AwBB2IIGQrXbl46mj4O4PzcDAEHQggZCtduXjqaPg7g/NwMAQciCBkK125eOpo+DuD83AwBBwIIGQrXbl46mj4O4PzcDAEG4ggZC9Lrhj5yf9bg/NwMAQbCCBkL0uuGPnJ/1uD83AwBBqIIGQvS64Y+cn/W4PzcDAEGgggZC9Lrhj5yf9bg/NwMAQZiCBkL0uuGPnJ/1uD83AwBBkIIGQrOaq5GSr+e5PzcDAEGIggZCmoG99uaIjLk/NwMAQYCCBkKorqrChszHuD83AwBB+IEGQtXerf602Ma1PzcDAEHwgQZC8vn0koi/2bI/NwMAQaiMBkKnkOr9gMja6j83AwBBoIwGQqeQ6v2AyNrqPzcDAEGYjAZCp5Dq/YDI2uo/NwMAQZCMBkKnkOr9gMja6j83AwBBiIwGQqeQ6v2AyNrqPzcDAEGAjAZCp5Dq/YDI2uo/NwMAQfiLBkKnkOr9gMja6j83AwBB8IsGQqeQ6v2AyNrqPzcDAEHoiwZCp5Dq/YDI2uo/NwMAQeCLBkKnkOr9gMja6j83AwBB2IsGQqeQ6v2AyNrqPzcDAEHQiwZChZuDuMHs8us/NwMAQciLBkKFm4O4wezy6z83AwBBwIsGQoWbg7jB7PLrPzcDAEG4iwZChZuDuMHs8us/NwMAQbCLBkKFm4O4wezy6z83AwBB4IkGQp/nzIX+kfvYPzcDAEGQhwZCyY2P7OLuvtI/NwMAQZCDBkK125eOpo+DuD83AwBBiIMGQrXbl46mj4O4PzcDAEGAgwZCtduXjqaPg7g/NwMAQfiCBkK125eOpo+DuD83AwBB8IIGQrXbl46mj4O4PzcDAEHoggZCtduXjqaPg7g/NwMAQeCCBkK125eOpo+DuD83AwBB6IkGQpv92MzZha3bPzcDAEGwiAZC162dyt6l3tc/NwMAQaiIBkLXrZ3K3qXe1z83AwBBoIgGQtetncrepd7XPzcDAEGYiAZC162dyt6l3tc/NwMAQZCIBkLXrZ3K3qXe1z83AwBBiIgGQtetncrepd7XPzcDAEGAiAZC162dyt6l3tc/NwMAQfiHBkLXrZ3K3qXe1z83AwBB8IcGQtetncrepd7XPzcDAEHohwZC162dyt6l3tc/NwMAQeCHBkLXrZ3K3qXe1z83AwBB2IcGQovpjpLrht/YPzcDAEHQhwZCi+mOkuuG39g/NwMAQciHBkKL6Y6S64bf2D83AwBBwIcGQovpjpLrht/YPzcDAEG4hwZCi+mOkuuG39g/NwMAQbCHBkKq+47/5vrO2T83AwBBqIcGQsz+3PzFt/XYPzcDAEGghwZC3Or10Jqlstg/NwMAQZiHBkKSs+TF+/qk1T83AwBBgIsGQvCXrqql27jdPzcDAEH4igZC8JeuqqXbuN0/NwMAQfCKBkLwl66qpdu43T83AwBB6IoGQvCXrqql27jdPzcDAEHgigZC8JeuqqXbuN0/NwMAQdiKBkLwl66qpdu43T83AwBB0IoGQvCXrqql27jdPzcDAEHIigZC8JeuqqXbuN0/NwMAQcCKBkLwl66qpdu43T83AwBBuIoGQvCXrqql27jdPzcDAEGwigZC8JeuqqXbuN0/NwMAQaiKBkKVobDV+vL33j83AwBBoIoGQpWhsNX68vfePzcDAEGYigZClaGw1fry994/NwMAQZCKBkKVobDV+vL33j83AwBBiIoGQpWhsNX68vfePzcDAEGAigZC+LWInK7Gm+A/NwMAQfiJBkLAlt2C25Ge3z83AwBB8IkGQr221vq5tavePzcDAEGojgZC47Sm9/Wk/c4/NwMAQaCOBkLjtKb39aT9zj83AwBBmI4GQtqs95+WxI7QPzcDAEGQjgZC2qz3n5bEjtA/NwMAQYiOBkLarPeflsSO0D83AwBBgI4GQtqs95+WxI7QPzcDAEH4jQZCq5ii7Lu13tA/NwMAQfCNBkLH7q2j37jO0D83AwBB6I0GQtSbmtvhzZ3NPzcDAEHgjQZC/LzqtPKY/sk/NwMAQdiNBkK0s7DC9ubnxz83AwBBgI8GQob6lJeel8LUPzcDAEGYkAZC2PbNqfyu79o/NwMAQZCQBkLY9s2p/K7v2j83AwBBiJAGQtj2zan8ru/aPzcDAEGAkAZC2PbNqfyu79o/NwMAQfiPBkLY9s2p/K7v2j83AwBB8I8GQtj2zan8ru/aPzcDAEHojwZC2PbNqfyu79o/NwMAQeCPBkLz+eDds+3t2z83AwBB2I8GQvP54N2z7e3bPzcDAEHQjwZC8/ng3bPt7ds/NwMAQciPBkLz+eDds+3t2z83AwBBwI8GQpH36dW7rOzcPzcDAEG4jwZCkffp1bus7Nw/NwMAQbCPBkKR9+nVu6zs3D83AwBBqI8GQpH36dW7rOzcPzcDAEGgjwZC1dODsr3q6t0/NwMAQZiPBkKUwf6FvcTR3T83AwBBkI8GQqr+xuXg4rzaPzcDAEGIjwZCjNqpmqzn59c/NwMAQfiOBkLB3dDeqsLdzT83AwBB8I4GQsHd0N6qwt3NPzcDAEHojgZCwd3Q3qrC3c0/NwMAQeCOBkLB3dDeqsLdzT83AwBB2I4GQsHd0N6qwt3NPzcDAEHQjgZCwd3Q3qrC3c0/NwMAQciOBkLB3dDeqsLdzT83AwBBwI4GQsHd0N6qwt3NPzcDAEG4jgZC47Sm9/Wk/c4/NwMAQbCOBkLjtKb39aT9zj83AwBB+JIGQtKw3sezmuHjPzcDAEGokAZCxoTQx8naxLk/NwMAQbCTBkKDzZax5eiI7D83AwBBqJMGQoPNlrHl6IjsPzcDAEGgkwZCg82WseXoiOw/NwMAQZiTBkK5gdDR9NL/7D83AwBBkJMGQurTj4H/8OfsPzcDAEGIkwZC8pe8pZLP6+k/NwMAQYCTBkL/irKumajt5j83AwBByJEGQpn48pK4i6TAPzcDAEHAkQZCmfjykriLpMA/NwMAQbiRBkKZ+PKSuIukwD83AwBBsJEGQpn48pK4i6TAPzcDAEGokQZCmfjykriLpMA/NwMAQaCRBkKZ+PKSuIukwD83AwBBmJEGQpn48pK4i6TAPzcDAEGQkQZCmfjykriLpMA/NwMAQYiRBkLQ/OD8hruEwT83AwBBgJEGQtD84PyGu4TBPzcDAEH4kAZC0Pzg/Ia7hME/NwMAQfCQBkLQ/OD8hruEwT83AwBB6JAGQuSk66nA6uTBPzcDAEHgkAZC5KTrqcDq5ME/NwMAQdiQBkLkpOupwOrkwT83AwBB0JAGQuSk66nA6uTBPzcDAEHIkAZC+Mz11vmZxcI/NwMAQcCQBkK9xczK2fexwj83AwBBuJAGQsHkr7uXivu/PzcDAEGwkAZC5tXRqpf5hbw/NwMAQaCQBkLY9s2p/K7v2j83AwBByJUGQqrno8X/94jnPzcDAEHIlgZC5KWc8oGRi+0/NwMAQcCWBkLkpZzygZGL7T83AwBBuJYGQuSlnPKBkYvtPzcDAEGwlgZC5KWc8oGRi+0/NwMAQaiWBkLDsLWswrWj7j83AwBBoJYGQsOwtazCtaPuPzcDAEGYlgZCw7C1rMK1o+4/NwMAQZCWBkLDsLWswrWj7j83AwBBiJYGQqG7zuaC2rvvPzcDAEGAlgZCobvO5oLau+8/NwMAQfiVBkKhu87mgtq77z83AwBB8JUGQqG7zuaC2rvvPzcDAEHolQZCgOOz0KH/qfA/NwMAQeCVBkLy2cvv+uGa8D83AwBB2JUGQqyB/O7mm87sPzcDAEHQlQZCyIXRw8Cjwuk/NwMAQZiUBkK8w7TUwJOb6j83AwBBkJQGQrzDtNTAk5vqPzcDAEGIlAZCvMO01MCTm+o/NwMAQYCUBkK8w7TUwJOb6j83AwBB+JMGQrzDtNTAk5vqPzcDAEHwkwZCvMO01MCTm+o/NwMAQeiTBkK8w7TUwJOb6j83AwBB4JMGQrzDtNTAk5vqPzcDAEHYkwZCn8jlgpP+kes/NwMAQdCTBkKfyOWCk/6R6z83AwBByJMGQp/I5YKT/pHrPzcDAEHAkwZCn8jlgpP+kes/NwMAQbiTBkKDzZax5eiI7D83AwBB0JEGQpfi5uz4u4nTPzcDAEHQjQZCs5qrkZKv57k/NwMAQciNBkKzmquRkq/nuT83AwBBwI0GQrOaq5GSr+e5PzcDAEG4jQZCs5qrkZKv57k/NwMAQbCNBkKzmquRkq/nuT83AwBBqI0GQrOaq5GSr+e5PzcDAEGgjQZCs5qrkZKv57k/NwMAQZiNBkKzmquRkq/nuT83AwBBkI0GQvL59JKIv9m6PzcDAEGIjQZC8vn0koi/2bo/NwMAQYCNBkLy+fSSiL/Zuj83AwBB+IwGQvL59JKIv9m6PzcDAEHwjAZCsdm+lP7Oy7s/NwMAQeiMBkKx2b6U/s7Luz83AwBB4IwGQrHZvpT+zsu7PzcDAEHYjAZCsdm+lP7Oy7s/NwMAQdCMBkLwuIiW9N69vD83AwBByIwGQsnyrK+p9aa8PzcDAEHAjAZC5430w/zbubk/NwMAQbiMBkLt95uZ4P6htj83AwBBsIwGQvWJq7rzyaWzPzcDAEHolgZC5KWc8oGRi+0/NwMAQeCWBkLkpZzygZGL7T83AwBB2JYGQuSlnPKBkYvtPzcDAEHQlgZC5KWc8oGRi+0/NwMAQfCRBkKxi5bupNae3D83AwBB6JEGQu/1x4PKpYjcPzcDAEHgkQZC+/z1vZaZotk/NwMAQdiRBkLvr5bInL7+1T83AwBBoJQGQrvZ86O+77rZPzcDAEGIlQZC+LWInK7Gm+A/NwMAQYCVBkLKusnxmJL74D83AwBB+JQGQsq6yfGYkvvgPzcDAEHwlAZCyrrJ8ZiS++A/NwMAQeiUBkLKusnxmJL74D83AwBB4JQGQp2/iseD3trhPzcDAEHYlAZCnb+Kx4Pe2uE/NwMAQdCUBkKdv4rHg97a4T83AwBByJQGQp2/iseD3trhPzcDAEHAlAZC78PLnO6puuI/NwMAQbiUBkL1qeShxJun4j83AwBBsJQGQpiBt92bz+rfPzcDAEGolAZC8O2848nC+ds/NwMAQfCSBkKq+47/5vrO2T83AwBB6JIGQqr7jv/m+s7ZPzcDAEHgkgZCqvuO/+b6ztk/NwMAQdiSBkKq+47/5vrO2T83AwBB0JIGQqr7jv/m+s7ZPzcDAEHIkgZCqvuO/+b6ztk/NwMAQcCSBkKq+47/5vrO2T83AwBBuJIGQqr7jv/m+s7ZPzcDAEGwkgZCnrqSgMjuvto/NwMAQaiSBkKeupKAyO6+2j83AwBBoJIGQp66koDI7r7aPzcDAEGYkgZCnrqSgMjuvto/NwMAQZCSBkK9zJLtw+Ku2z83AwBBiJIGQr3Mku3D4q7bPzcDAEGAkgZCvcyS7cPirts/NwMAQfiRBkK9zJLtw+Ku2z83AwBB8JYGQpqz5syZs5TCwAA3AwBB+JYGQoCAgICAgICEwAA3AwBBgJcGQoCAgICAgPjCwAA3AwBBiJcGQoCAgICAgIDwPzcDAEGQlwZCmrPmzJmz5tw/NwMAQZiXBkKAgICAgICAisAANwMAQaCXBkKAgICAgICAksAANwMAQeiXBkKz5syZs+bM4T83AwBB4JcGQpqz5syZs+bUPzcDAEHYlwZCmrPmzJmz5tw/NwMAQdCXBkKz5syZs+bM6T83AwBB8JcGQvuouL2U3J7CPzcDAEHAlQZC+LWInK7Gm+A/NwMAQbiVBkL4tYicrsab4D83AwBBsJUGQvi1iJyuxpvgPzcDAEGolQZC+LWInK7Gm+A/NwMAQaCVBkL4tYicrsab4D83AwBBmJUGQvi1iJyuxpvgPzcDAEGQlQZC+LWInK7Gm+A/NwMAQfiXBkKAgICAgICA6D83AwBBgJgGQubMmbPmzJn3PzcDAEGImAZC5syZs+bMmes/NwMAQZCYBkKas+bMmbPm3D83AwBBmJgGQvuouL2U3J7SPzcDAEGgmAZC+6i4vZTcntI/NwMAQaiYBkKAgICAgIDArMAANwMAQbCYBkKz5syZs+bM6T83AwBBuJgGQs2Zs+bMmbP2PzcDAEHgmAZCgICAgICAgJLAADcDAEHYmAZCgICAgICAgKrAADcDAEHwmAZCgICAgICAoKDAADcDAEHQmAZCgICAgICAgJLAADcDAEHImAZCgICAgICAgJLAADcDAEHAmAZCgICAgICAgKrAADcDAEGgmQZCt7/5yZWG1+4+NwMAQaiZBkLL4OLhmb+1jj83AwBBsJkGQoCAgICAgID4PzcDAEG4mQZCADcDAEHAmQZCADcDAEHImQZCgICAgICAgPg/NwMAQdCZBkLXx8Lro+G18j83AwBB2JkGQoCAgICAgOzcwAA3AwBBgJkGQgA3AwBB+JgGQoCAgICAgLCowAA3AwBB6JgGQoCAgICAgICSwAA3AwBBiJkGQgA3AwBBmJkGQgA3AwBBkJkGQoCAgICAgMCswAA3AwBB4JkGQoCAgICAgICMwAA3AwBBqJoGQqLC7/u30L3kPzcDAEGgmgZCnvzr5Jrqw+A/NwMAQZiaBkK9gezHzrql7z83AwBBkJoGQt/hjqG8ycnKPzcDAEGImgZChfyWsKjN1ME/NwMAQYCaBkL++bedtdP72T83AwBB+JkGQq3Hz9rVyPbZPzcDAEHwmQZC6pLj89y+wMA/NwMAQcCaBkLpmuGsjdyI2D83AwBBuJoGQtXNk+XJmo/SPzcDAEGwmgZCgN2So8aj2bI/NwMAQeiaBkKZ3LqAiPfq5z83AwBB4JoGQtvMjI7Pz4HgPzcDAEHYmgZC8oSTjM2Vm+4/NwMAQdCaBkKZ3ZDW/pGM2T83AwBByJoGQqbe/drowK++PzcDAEGomwZCg+Te3vvH9+Q/NwMAQaCbBkL4sbDF09qW4T83AwBBmJsGQtm9rdD3jYPuPzcDAEGQmwZC1pTzi8X54so/NwMAQYibBkKo2oGL9o6cwz83AwBBgJsGQq/XqfvYmdHbPzcDAEH4mgZChsi9vfeP79o/NwMAQfCaBkLKr7fLhtPTwD83AwBBsJsGQqm4vZTc7uDawAA3AwBBuJsGQoCAgICAgICMwAA3AwBB+JsGQtfHwuuj4c2hwAA3AwBB8JsGQrnoorbn94eUwAA3AwBB6JsGQrDloYvZnf+ewAA3AwBB4JsGQr2U3J6Kro+OwAA3AwBB2JsGQtLw+qi4vZT0PzcDAEHQmwZC7KPh9dHw+o/AADcDAEHImwZCqbi9lNyeioLAADcDAEHAmwZCzZmz5syZs+4/NwMAQbCcBkKxkLDloYvhk8AANwMAQaicBkKljISsuejOnsAANwMAQaCcBkKF18fC66PhjcAANwMAQZicBkKuj4XXx8Lr8z83AwBBkJwGQp+Kro+F18ePwAA3AwBBiJwGQtyeiq6PhZeIwAA3AwBBgJwGQvH6qLi9lNz6PzcDAEHAnAZCgICAgICAgIDAADcDAEG4nAZCmrPmzJmzrqHAADcDAEHInAZCADcDAEHQnAZCgICAgNCs8+bBADcDAEGIngZCu76/6vjSm/g/NwMAQaifBkL808aX3cmY0D83AwBBoJ8GQvzTxpfdyZjQPzcDAEGYnwZC2sjt+f2p49M/NwMAQZCfBkL808aX3cmY2D83AwBBiJ8GQuKg4MrDlrLbPzcDAEGAnwZCiNjy0MXszt8/NwMAQfieBkLP78+a3vSm4j83AwBB8J4GQuWhi9md35/lPzcDAEHongZC0Jre9KbioOg/NwMAQeCeBkLV8aW3koaC6j83AwBB2J4GQoLWnLSR2/PrPzcDAEHQngZCg4GrjtrI7e0/NwMAQcieBkKC1py0kdvz7z83AwBBwJ4GQpaHreT2/P7wPzcDAEG4ngZC/9TxpbeShvI/NwMAQbCeBkKShoLWnLSR8z83AwBBqJ4GQtCa3vSm4qD0PzcDAEGgngZC4qDgysOWsvU/NwMAQZieBkLJ7fn9qePL9j83AwBBkJ4GQoXXx8Lro+H3PzcDAEGAnQZCqI2vupOxkPQ/NwMAQficBkKO2sjt+f2p9T83AwBB8JwGQp+Kro+F18f2PzcDAEHonAZCr7qTsZCw5fc/NwMAQeCcBkLQmt70puKg+D83AwBBgJ4GQszupIyErLnQPzcDAEH4nQZCzO6kjISsudA/NwMAQfCdBkK6k7GQsOWh0z83AwBB6J0GQpmI2PLQxezWPzcDAEHgnQZC+6i4vZTcnto/NwMAQdidBkKBq47ayO353T83AwBB0J0GQru+v+r40pvhPzcDAEHInQZCgtactJHb8+M/NwMAQcCdBkKU3J6Kro+F5z83AwBBuJ0GQru+v+r40pvpPzcDAEGwnQZC6KK25/enjes/NwMAQaidBkK9lNyeiq6P7T83AwBBoJ0GQubMmbPmzJnvPzcDAEGYnQZCx5fdyZiI2PA/NwMAQZCdBkKErLnoorbn8T83AwBBiJ0GQuyj4fXR8PryPzcDAEGwnwZCgICAgICAgPg/NwMAQeigBkLsiqOC5PKTzD83AwBByKEGQuXU3ZXw9Y7RPzcDAEHAoQZC5dTdlfD1jtE/NwMAQbihBkLl1N2V8PWO0T83AwBBsKEGQq+endeoypDSPzcDAEGooQZCr56d16jKkNI/NwMAQaChBkKvnp3XqMqQ0j83AwBBmKEGQq+endeoypDSPzcDAEGQoQZCr56d16jKkNI/NwMAQYihBkKiwePAq56S0z83AwBBgKEGQs+Bj6nYwarSPzcDAEH4oAZC7te5s8nb3NE/NwMAQfCgBkKTpNrAh+eyzz83AwBBuKMGQpn54aKxg+a4PzcDAEGQogZC+uieuYPox9M/NwMAQbCjBkKxuPWAkO7V2D83AwBBqKMGQrG49YCQ7tXYPzcDAEGgowZCsbj1gJDu1dg/NwMAQZijBkKxuPWAkO7V2D83AwBBkKMGQrG49YCQ7tXYPzcDAEGIowZCsbj1gJDu1dg/NwMAQYCjBkKxuPWAkO7V2D83AwBB+KIGQrG49YCQ7tXYPzcDAEHwogZCsbj1gJDu1dg/NwMAQeiiBkKxuPWAkO7V2D83AwBB4KIGQrG49YCQ7tXYPzcDAEHYogZCysjYk+GW0dk/NwMAQdCiBkLKyNiT4ZbR2T83AwBByKIGQsrI2JPhltHZPzcDAEHAogZCysjYk+GW0dk/NwMAQbiiBkLKyNiT4ZbR2T83AwBBsKIGQuLYu6ayv8zaPzcDAEGoogZC1t3thc3r6dk/NwMAQaCiBkKEy7HD7uyf2T83AwBBmKIGQqfV1ruYt9LWPzcDAEGIogZC5dTdlfD1jtE/NwMAQYCiBkLl1N2V8PWO0T83AwBB+KEGQuXU3ZXw9Y7RPzcDAEHwoQZC5dTdlfD1jtE/NwMAQeihBkLl1N2V8PWO0T83AwBB4KEGQuXU3ZXw9Y7RPzcDAEHYoQZC5dTdlfD1jtE/NwMAQdChBkLl1N2V8PWO0T83AwBBiKYGQrPnou+pge7iPzcDAEHQpgZCtLbX0I+shuk/NwMAQcimBkK0ttfQj6yG6T83AwBBwKYGQrS219CPrIbpPzcDAEG4pgZCtLbX0I+shuk/NwMAQbCmBkK0ttfQj6yG6T83AwBBqKYGQt2mgZm7lvrpPzcDAEGgpgZCkpDerr/Bnek/NwMAQZimBkL3gsqUsIHY6D83AwBBkKYGQpWDjtCl1+DlPzcDAEHYpAZCiNL2sJ+Fmb0/NwMAQdCkBkKI0vawn4WZvT83AwBByKQGQojS9rCfhZm9PzcDAEHApAZCiNL2sJ+Fmb0/NwMAQbikBkKI0vawn4WZvT83AwBBsKQGQojS9rCfhZm9PzcDAEGopAZCiNL2sJ+Fmb0/NwMAQaCkBkKI0vawn4WZvT83AwBBmKQGQojS9rCfhZm9PzcDAEGQpAZCiNL2sJ+Fmb0/NwMAQYikBkKI0vawn4WZvT83AwBBgKQGQtjv0rWZ29S+PzcDAEH4owZC2O/StZnb1L4/NwMAQfCjBkLY79K1mdvUvj83AwBB6KMGQtjv0rWZ29S+PzcDAEHgowZC2O/StZnb1L4/NwMAQdijBkLUxpfdyZiIwD83AwBB0KMGQsCdiuvCn/q+PzcDAEHIowZCh5TkysbSib4/NwMAQcCjBkLo2KvB0qaSuz83AwBB2KgGQvqVyObY6PTlPzcDAEHoqQZCpaj6haHOt+o/NwMAQeCpBkKlqPqFoc636j83AwBB2KkGQqWo+oWhzrfqPzcDAEHQqQZCpaj6haHOt+o/NwMAQcipBkKlqPqFoc636j83AwBBwKkGQqWo+oWhzrfqPzcDAEG4qQZCpaj6haHOt+o/NwMAQbCpBkKlqPqFoc636j83AwBBqKkGQqWo+oWhzrfqPzcDAEGgqQZCl6KUpt6BzOs/NwMAQZipBkKXopSm3oHM6z83AwBBkKkGQpeilKbegczrPzcDAEGIqQZCl6KUpt6BzOs/NwMAQYCpBkKXopSm3oHM6z83AwBB+KgGQoicrsabteDsPzcDAEHwqAZC8ZCbkN3Y6es/NwMAQeioBkLixIbS4NOQ6z83AwBB4KgGQv7Q0pHm7OfoPzcDAEGopwZC3fW1+qDBkug/NwMAQaCnBkLd9bX6oMGS6D83AwBBmKcGQt31tfqgwZLoPzcDAEGQpwZC3fW1+qDBkug/NwMAQYinBkLd9bX6oMGS6D83AwBBgKcGQt31tfqgwZLoPzcDAEH4pgZC3fW1+qDBkug/NwMAQfCmBkLd9bX6oMGS6D83AwBB6KYGQt31tfqgwZLoPzcDAEHgpgZC3fW1+qDBkug/NwMAQdimBkLd9bX6oMGS6D83AwBB4KQGQtyZ8LaS0JzSPzcDAEHgoAZCw569276i+cM/NwMAQdigBkLDnr3bvqL5wz83AwBB0KAGQsOevdu+ovnDPzcDAEHIoAZCw569276i+cM/NwMAQcCgBkLDnr3bvqL5wz83AwBBuKAGQsOevdu+ovnDPzcDAEGwoAZCw569276i+cM/NwMAQaigBkLDnr3bvqL5wz83AwBBoKAGQsOevdu+ovnDPzcDAEGYoAZCw569276i+cM/NwMAQZCgBkLDnr3bvqL5wz83AwBBiKAGQtGZhcK8mKPFPzcDAEGAoAZC0ZmFwryYo8U/NwMAQfifBkLRmYXCvJijxT83AwBB8J8GQtGZhcK8mKPFPzcDAEHonwZC0ZmFwryYo8U/NwMAQeCfBkKB+ufI44zNxj83AwBB2J8GQonQwqOQlcXFPzcDAEHQnwZCpve/v+eb38Q/NwMAQcifBkLcqobf7LCLwj83AwBBwJ8GQtat96iMg/e/PzcDAEH4qQZCpaj6haHOt+o/NwMAQfCpBkKlqPqFoc636j83AwBBkKUGQpux3NHtwsLYPzcDAEGIpQZCm7Hc0e3Cwtg/NwMAQYClBkK7paaEwMmv2T83AwBB+KQGQtX7t/XKqtjYPzcDAEHwpAZCqJylirPzltg/NwMAQeikBkLO56LKnMz51D83AwBBsKcGQvWYwqa3o97YPzcDAEGoqAZCrKvttcK0jd0/NwMAQaCoBkKsq+21wrSN3T83AwBBmKgGQqyr7bXCtI3dPzcDAEGQqAZCrKvttcK0jd0/NwMAQYioBkKsq+21wrSN3T83AwBBgKgGQqyr7bXCtI3dPzcDAEH4pwZCmNTDldzlx94/NwMAQfCnBkKY1MOV3OXH3j83AwBB6KcGQpjUw5Xc5cfePzcDAEHgpwZCmNTDldzlx94/NwMAQdinBkKY1MOV3OXH3j83AwBB0KcGQsL+zPq6i4HgPzcDAEHIpwZC1rWo6t6I7d4/NwMAQcCnBkKckfrr1p/93T83AwBBuKcGQse5w/DzvYjbPzcDAEGApgZC9fmkvrb4qtc/NwMAQfilBkL1+aS+tviq1z83AwBB8KUGQvX5pL62+KrXPzcDAEHopQZC9fmkvrb4qtc/NwMAQeClBkL1+aS+tviq1z83AwBB2KUGQvX5pL62+KrXPzcDAEHQpQZC9fmkvrb4qtc/NwMAQcilBkL1+aS+tviq1z83AwBBwKUGQvX5pL62+KrXPzcDAEG4pQZC9fmkvrb4qtc/NwMAQbClBkL1+aS+tviq1z83AwBBqKUGQpux3NHtwsLYPzcDAEGgpQZCm7Hc0e3Cwtg/NwMAQZilBkKbsdzR7cLC2D83AwBB0KwGQrWetvCOg5rUPzcDAEGoqwZCqIiBjsKq6sw/NwMAQdCoBkKsq+21wrSN3T83AwBByKgGQqyr7bXCtI3dPzcDAEHAqAZCrKvttcK0jd0/NwMAQbioBkKsq+21wrSN3T83AwBBsKgGQqyr7bXCtI3dPzcDAEHorAZCoe7FsIrlpd0/NwMAQeCsBkKc25TWv5Wb2j83AwBB2KwGQrLQpNz9irXXPzcDAEHIrAZCosHjwKuektM/NwMAQcCsBkKiwePAq56S0z83AwBBuKwGQqLB48CrnpLTPzcDAEGwrAZCosHjwKuektM/NwMAQaisBkKiwePAq56S0z83AwBBoKwGQqLB48CrnpLTPzcDAEGYrAZCosHjwKuektM/NwMAQZCsBkKiwePAq56S0z83AwBBiKwGQuyKo4Lk8pPUPzcDAEGArAZC7IqjguTyk9Q/NwMAQfirBkLsiqOC5PKT1D83AwBB8KsGQuyKo4Lk8pPUPzcDAEHoqwZC3q3p6+bGldU/NwMAQeCrBkLerenr5saV1T83AwBB2KsGQt6t6evmxpXVPzcDAEHQqwZC3q3p6+bGldU/NwMAQcirBkKo96itn5uX1j83AwBBwKsGQoiUt9vvo/3VPzcDAEG4qwZCuKH59IGw3tI/NwMAQbCrBkLysZes7aGN0D83AwBB+K0GQsvAmKLoyqS5PzcDAEHYrgZCvNXF38aD5sA/NwMAQdCuBkK81cXfxoPmwD83AwBByK4GQrzVxd/Gg+bAPzcDAEHArgZCvNXF38aD5sA/NwMAQbiuBkKk5PPhw+7DwT83AwBBsK4GQqTk8+HD7sPBPzcDAEGorgZCpOTz4cPuw8E/NwMAQaCuBkKk5PPhw+7DwT83AwBBmK4GQqPe9q2A2aHCPzcDAEGQrgZCmJzGiaz3jsI/NwMAQYiuBkLXscDPwKjFvz83AwBBgK4GQri0mqylr927PzcDAEHwrQZC4ti7prK/zNo/NwMAQeitBkLi2Lumsr/M2j83AwBB4K0GQuLYu6ayv8zaPzcDAEHYrQZC4ti7prK/zNo/NwMAQdCtBkLi2Lumsr/M2j83AwBByK0GQuLYu6ayv8zaPzcDAEHArQZC4ti7prK/zNo/NwMAQbitBkLi2Lumsr/M2j83AwBBsK0GQvronrmD6MfbPzcDAEGorQZC+uieuYPox9s/NwMAQaCtBkL66J65g+jH2z83AwBBmK0GQvronrmD6MfbPzcDAEGQrQZCvsz+t++Qw9w/NwMAQYitBkK+zP6375DD3D83AwBBgK0GQr7M/rfvkMPcPzcDAEH4rAZCvsz+t++Qw9w/NwMAQfCsBkKqieXepbm+3T83AwBBmLMGQsa82aas4NfmPzcDAEHIsAZC4PKIsqCeu+M/NwMAQeixBkLdpoGZu5b66T83AwBB4LEGQt2mgZm7lvrpPzcDAEHYsQZC3aaBmbuW+uk/NwMAQdCxBkLdpoGZu5b66T83AwBByLEGQt2mgZm7lvrpPzcDAEHAsQZC3aaBmbuW+uk/NwMAQbixBkLdpoGZu5b66T83AwBBsLEGQt2mgZm7lvrpPzcDAEGosQZCs+ei76mB7uo/NwMAQaCxBkKz56LvqYHu6j83AwBBmLEGQrPnou+pge7qPzcDAEGQsQZCs+ei76mB7uo/NwMAQYixBkKKqMTFmOzh6z83AwBBgLEGQoqoxMWY7OHrPzcDAEH4sAZCiqjExZjs4es/NwMAQfCwBkKKqMTFmOzh6z83AwBB6LAGQuDo5ZuH19XsPzcDAEHgsAZCgo/fvdfBvuw/NwMAQdiwBkLOw+vqnuzL6T83AwBB0LAGQo3qqMjkrL3mPzcDAEGYrwZC1MaX3cmYiMA/NwMAQZCvBkLUxpfdyZiIwD83AwBBiK8GQtTGl93JmIjAPzcDAEGArwZC1MaX3cmYiMA/NwMAQfiuBkLUxpfdyZiIwD83AwBB8K4GQtTGl93JmIjAPzcDAEHorgZC1MaX3cmYiMA/NwMAQeCuBkLUxpfdyZiIwD83AwBBuLQGQoicrsabteDsPzcDAEGwtAZCiJyuxpu14Ow/NwMAQai0BkKInK7Gm7Xg7D83AwBBoLQGQoicrsabteDsPzcDAEGYtAZCiJyuxpu14Ow/NwMAQZC0BkKInK7Gm7Xg7D83AwBBiLQGQoicrsabteDsPzcDAEGAtAZCiJyuxpu14Ow/NwMAQfizBkL6lcjm2Oj07T83AwBB8LMGQvqVyObY6PTtPzcDAEHoswZC+pXI5tjo9O0/NwMAQeCzBkL6lcjm2Oj07T83AwBB2LMGQr6/6vjSm4nvPzcDAEHQswZCvr/q+NKbie8/NwMAQcizBkK+v+r40puJ7z83AwBBwLMGQr6/6vjSm4nvPzcDAEG4swZC2JzCjMjnjvA/NwMAQbCzBkLWyv2ukfj/7z83AwBBqLMGQtS+oPKdh6XsPzcDAEGgswZCs67g5eOao+k/NwMAQciqBkKP9a+v4YL3xz83AwBBwKoGQo/4+8qvvNDIPzcDAEG4qgZCj/j7yq+80Mg/NwMAQbCqBkKP+PvKr7zQyD83AwBBqKoGQo/4+8qvvNDIPzcDAEGgqgZC1vWfvq63pck/NwMAQZiqBkKLzc6dmbiUyT83AwBBkKoGQrTyh6blkYnGPzcDAEGIqgZCtaP19MCsz8I/NwMAQYCqBkKW2s7lqJO0wD83AwBBoK8GQrnJ9PWFquXSPzcDAEGgqwZCgfrnyOOMzcY/NwMAQZirBkKB+ufI44zNxj83AwBBkKsGQoH658jjjM3GPzcDAEGIqwZCgfrnyOOMzcY/NwMAQYCrBkKB+ufI44zNxj83AwBB+KoGQoH658jjjM3GPzcDAEHwqgZCgfrnyOOMzcY/NwMAQeiqBkKB+ufI44zNxj83AwBB4KoGQo/1r6/hgvfHPzcDAEHYqgZCj/Wvr+GC98c/NwMAQdCqBkKP9a+v4YL3xz83AwBBsLAGQrulpoTAya/ZPzcDAEGosAZCu6WmhMDJr9k/NwMAQaCwBkK7paaEwMmv2T83AwBBmLAGQrulpoTAya/ZPzcDAEGQsAZCu6WmhMDJr9k/NwMAQYiwBkK7paaEwMmv2T83AwBBgLAGQtyZ8LaS0JzaPzcDAEH4rwZC3JnwtpLQnNo/NwMAQfCvBkLcmfC2ktCc2j83AwBB6K8GQtyZ8LaS0JzaPzcDAEHgrwZCqOG21f/Wids/NwMAQdivBkKo4bbV/9aJ2z83AwBB0K8GQqjhttX/1onbPzcDAEHIrwZCqOG21f/Wids/NwMAQcCvBkLI1YCI0t322z83AwBBuK8GQo6LpeT09eDbPzcDAEGwrwZCyJDvvIX6g9k/NwMAQaivBkK1kZHZkevQ1T83AwBB8LEGQpjTt9rPs5zZPzcDAEGQswZCwv7M+rqLgeA/NwMAQYizBkLC/sz6uouB4D83AwBBgLMGQsL+zPq6i4HgPzcDAEH4sgZCwv7M+rqLgeA/NwMAQfCyBkLC/sz6uouB4D83AwBB6LIGQsL+zPq6i4HgPzcDAEHgsgZCwv7M+rqLgeA/NwMAQdiyBkLC/sz6uouB4D83AwBB0LIGQp3yyM6Bo97gPzcDAEHIsgZCnfLIzoGj3uA/NwMAQcCyBkKd8sjOgaPe4D83AwBBuLIGQp3yyM6Bo97gPzcDAEGwsgZC04a0vs67u+E/NwMAQaiyBkLThrS+zru74T83AwBBoLIGQtOGtL7Ou7vhPzcDAEGYsgZC04a0vs67u+E/NwMAQZCyBkKKm5+um9SY4j83AwBBiLIGQqvq7IPagobiPzcDAEGAsgZC0vjxk+TOt98/NwMAQfixBkLH9oLeyYTT2z83AwBBwLAGQrulpoTAya/ZPzcDAEG4sAZCu6WmhMDJr9k/NwMAQcC0BkKAgICAgICA+D83AwBByLQGQq6PhdfHwuv5PzcDAEHQtAZCgICAgICAx+DAADcDAEHYtAZCs+bMmbPmzOk/NwMAQeC0BkKAgICAgIDwq8AANwMAQei0BkKAgICAgICA+D83AwBB8LQGQoCAgICAgICKwAA3AwBBgLUGQoCAgICAgNC/wAA3AwBB+LQGQoCAgICAgICKwAA3AwBBiLUGQoCAgICAgICIwAA3AwBBkLUGQoCAgICAwJr0wAA3AwBBmLUGQoCAgICAgOCgwAA3AwBBoLUGQoCAgICAwJr0wAA3AwBBqLUGQoCAgICAwJr0wAA3AwBBsLUGQoCAgICshZn4wQA3AwBBuLUGQgA3AwBBwLUGQrDloYvZnfuzwAA3AwBByLUGQtucl8Wrlfv+PzcDAEHQtQZC2Z3fn7W8iY3AADcDAEHYtQZCADcDAEHgtQZCgICAgICAgKLAADcDAEHotQZCADcDAEHwtQZCgICA+u/dj7XCADcDAEH4tQZCgICAgID4l/HAADcDAEGAtgZCADcDAEGItgZCADcDAEGQtgZCADcDAEGYtgZCjPyo+4n6uK8/NwMAQaC2BkKAgIDkidy6ucIANwMAQai2BkIANwMAQei2BkLso+H10fD6g8AANwMAQeC2BkKPhdfHwuvjicAANwMAQdi2BkKKro+F18fC9z83AwBB0LYGQsPro+H10fDqPzcDAEHwtgZCADcDAEH4tgZCADcDAEGAtwZCADcDAEGQtwZCgICA/Jve6JvCADcDAEGItwZCADcDAEGYtwZCgICAqOCcuoHCADcDAEGgtwZCgICAgOTf6crBADcDAEGotwZCgICAgOTM1LDBADcDAEGwtwZCgICAgPPeqOnBADcDAEG4twZCgICAgLix9M7BADcDAEHAtwZCgICAgKyFmfjBADcDAEHItwZCgICAgIDHzojBADcDAEHQtwZCr6fZv+rTxco/NwMAQdi3BkKAgICAgICA+D83AwBB4LcGQvuouL2U3J7CPzcDAEHotwZCgICAgPKLqJHCADcDAEHwtwZCgICAgJKEo/fBADcDAEH4twZCgICAgNCs84bCADcDAEGAuAZCADcDAEGIuAZCADcDAEGQuAZCs+bMmbPmzOE/NwMAQZi4BkIANwMAQaC4BkKas+bMmbPm5D83AwBBqLgGQpqz5syZs+bkPzcDAEGwuAZCgICAhMHjo8fCADcDAEG4uAZCADcDAEHAuAZCgICAgICAwLzAADcDAEHIuAZCADcDAEHQuAZCgICAgICA2eTAADcDAEHYuAZCgICAgICAgOg/NwMAQeC4BkKAgICAgIDQqsAANwMAQei4BkKAgICAgJChj8EANwMAQfC4BkKAgICAgJChn8EANwMAQYC5BkIANwMAQfi4BkKAgICAgJChp8EANwMAQYi5BkKAgICAgIDQ18AANwMAQZC5BkIANwMAQZi5BkKAgICAgIDf2sAANwMAQaC5BkKAgICAgIDArMAANwMAQai5BkKAgICAgICwqcAANwMAQbC5BkKas+bMmbPm5D83AwBBuLkGQoCAgICAgOzOwAA3AwBBwLkGQoCAgICAgICKwAA3AwBByLkGQoCAgICAgICSwAA3AwBB0LkGQoCAgICAgICKwAA3AwBB2LkGQoCAgICAgICAwAA3AwBB4LkGQpqz5syZs+b8PzcDAEHouQZCs+bMmbPmzPE/NwMAQfC5BkKas+bMmbPm+D83AwBB+LkGQuizs9XPq9v0PzcDAEGAugZCmrPmzJmz5uQ/NwMAQYi8BkLUxpfdyZiI8j83AwBBgLwGQtTGl93JmIjyPzcDAEH4uwZC1MaX3cmYiPI/NwMAQfC7BkLUxpfdyZiI8j83AwBB6LsGQtTGl93JmIjyPzcDAEHguwZC1MaX3cmYiPI/NwMAQeC6BkLu+f2p48vu9j83AwBB2LoGQu75/anjy+72PzcDAEHQugZC7vn9qePL7vY/NwMAQci6BkLu+f2p48vu9j83AwBBwLoGQu75/anjy+72PzcDAEG4ugZC7vn9qePL7vY/NwMAQfC6BkKKro+F18fC8z83AwBB6LoGQoquj4XXx8LzPzcDAEHgvAZCgICAgICAgIDAADcDAEHovAZCADcDAEHwvAZCiIedqZaA/80+NwMAQfi8BkKAgIDM9/30wsIANwMAQYC9BkKAgICAgIDgsMAANwMAQYi9BkKas+bMmbPm3D83AwBBkL0GQoCAgIDA8PXDwQA3AwBBmL0GQoCAgICAgICEwAA3AwBBoL0GQrPmzJmz5sz5PzcDAEGovQZCgICAgICAgI7AADcDAEGwvQZCuL2U3J6Krsc/NwMAQbi9BkLNmbPmzJmz7j83AwBBwL0GQgA3AwBByL0GQoCAgOCskOeUwgA3AwBB0L0GQoCAgICAgJ7AwAA3AwBB2L0GQoCAgICAkKGPwQA3AwBBiL8GQoCAgICY9IDOwQA3AwBB4L8GQoCAgICg3vO1wQA3AwBB2L8GQoCAgIDszc25wQA3AwBB0L8GQoCAgICg8d+8wQA3AwBByL8GQoCAgID2pZTAwQA3AwBBwL8GQoCAgICy+Y3CwQA3AwBBuL8GQoCAgICK7ZXEwQA3AwBBsL8GQoCAgICkz6TGwQA3AwBBqL8GQoCAgIDtnLHIwQA3AwBBoL8GQoCAgIDhhdDJwQA3AwBBmL8GQoCAgIDVk+vKwQA3AwBBkL8GQoCAgICa5JnMwQA3AwBBgL8GQoCAgICAgLfIwAA3AwBB+L4GQoCAgICA4K7awAA3AwBB8L4GQoCAgICAqLLrwAA3AwBB6L4GQoCAgICAjsP6wAA3AwBB4L4GQoCAgICAs9yJwQA3AwBB2L4GQoCAgIDgmuGVwQA3AwBB0L4GQoCAgIDAzPagwQA3AwBByL4GQoCAgIDA3OepwQA3AwBBwL4GQoCAgIDQoKKxwQA3AwBBuL4GQoCAgICgooe2wQA3AwBBsL4GQoCAgID8jdu5wQA3AwBBqL4GQoCAgICc5vG8wQA3AwBBoL4GQoCAgIDA4Z/AwQA3AwBBmL4GQoCAgIDgk5zCwQA3AwBBkL4GQoCAgICS+qbEwQA3AwBBiL4GQoCAgICa2bjGwQA3AwBBgL4GQoCAgICHgb3IwQA3AwBB+L0GQoCAgICByd3JwQA3AwBB8L0GQoCAgIDxsPrKwQA3AwBB6L0GQoCAgIDC96rMwQA3AwBB4L0GQoCAgIDcy5TOwQA3AwBBqMAGQoCAgICAgKzIwAA3AwBBoMAGQoCAgICAoKDawAA3AwBBmMAGQoCAgICAwKLrwAA3AwBBkMAGQoCAgICAvrT6wAA3AwBBiMAGQoCAgICA8c6JwQA3AwBBgMAGQoCAgIDgis6VwQA3AwBB+L8GQoCAgICwmOqgwQA3AwBB8L8GQoCAgICYi9qpwQA3AwBB6L8GQoCAgIDcr5WxwQA3AwBB+MIGQs2Zs+bMmaq3wAA3AwBB8MIGQuH10fD66LXJwAA3AwBB6MIGQoCAgICA2KzawAA3AwBB4MIGQoCAgICA3MfpwAA3AwBB2MIGQubMmbPmtOr4wAA3AwBB0MIGQoCAgICA8L+EwQA3AwBByMIGQoCAgICg942QwQA3AwBBwMIGQoCAgIDg2PSYwQA3AwBBuMIGQoCAgICgy7WgwQA3AwBBsMIGQoCAgICAuuKkwQA3AwBBqMIGQoCAgIDwnemowQA3AwBBoMIGQoCAgIDY1dqrwQA3AwBBmMIGQoCAgIDIjP6uwQA3AwBBkMIGQoCAgICUqaSxwQA3AwBBiMIGQoCAgIDI1pazwQA3AwBBgMIGQoCAgICgrI+1wQA3AwBB+MEGQoCAgICYnbO3wQA3AwBB8MEGQoCAgICQvOu4wQA3AwBB6MEGQoCAgIDc9fm5wQA3AwBBkMEGQoCAgICw2pukwQA3AwBBiMEGQoCAgIDg8aGpwQA3AwBBgMEGQoCAgIDw0uaswQA3AwBB+MAGQoCAgIC4r7+wwQA3AwBB8MAGQoCAgID41++ywQA3AwBB6MAGQoCAgIDwsby1wQA3AwBB4MAGQoCAgIDEhY64wQA3AwBB2MAGQoCAgICku8K5wQA3AwBB0MAGQoCAgICMn5a7wQA3AwBByMAGQoCAgIDA8um8wQA3AwBBwMAGQoCAgICMzbi+wQA3AwBB0MEGQoquj4XXh5G7wAA3AwBByMEGQvbR8PqouNTNwAA3AwBBwMEGQqTh9dHwuoLfwAA3AwBBuMEGQubMmbPm4O/twAA3AwBBsMEGQoCAgICArOj8wAA3AwBBqMEGQoCAgIDA5oiJwQA3AwBBoMEGQoCAgICglOKTwQA3AwBBmMEGQoCAgICAo/ecwQA3AwBByMUGQuT2/P7UsZG4wAA3AwBBwMUGQoquj4XX5//JwAA3AwBBuMUGQoXXx8Lrm/7awAA3AwBBsMUGQubMmbPm9JLqwAA3AwBBqMUGQoCAgICA76/5wAA3AwBBoMUGQoCAgICAmKKFwQA3AwBBmMUGQoCAgICg282QwQA3AwBBkMUGQoCAgICg5bqZwQA3AwBBiMUGQoCAgIDw5vegwQA3AwBBgMUGQoCAgICA8calwQA3AwBB+MQGQoCAgIDgz66pwQA3AwBB8MQGQoCAgICY4baswQA3AwBB6MQGQoCAgICQ+/OvwQA3AwBB4MQGQoCAgIDIq+2xwQA3AwBB2MQGQoCAgIDYy+6zwQA3AwBB0MQGQoCAgIDQxfa1wQA3AwBByMQGQoCAgID4lpa4wQA3AwBBwMQGQoCAgICs/7C5wQA3AwBBsMMGQoCAgIDY9uK1wQA3AwBBqMMGQoCAgIDA1Yq4wQA3AwBBoMMGQoCAgICgwL65wQA3AwBBmMMGQoCAgID4nPK6wQA3AwBBoMQGQuH10fD66LW5wAA3AwBBmMQGQubMmbPmrM3LwAA3AwBBkMQGQoquj4XXp+DcwAA3AwBBiMQGQoCAgICA8OPrwAA3AwBBgMQGQoCAgICA9vD6wAA3AwBB+MMGQoCAgICAtbOHwQA3AwBB8MMGQoCAgIDg+/6RwQA3AwBB6MMGQoCAgICgzP2awQA3AwBB4MMGQoCAgIDA6q+iwQA3AwBB2MMGQoCAgIDggd6nwQA3AwBB0MMGQoCAgIC4vO+qwQA3AwBByMMGQoCAgIDA2bauwQA3AwBBwMMGQoCAgID44Z2xwQA3AwBBuMMGQoCAgICQpLizwQA3AwBBkMgGQu+kjISs+YC4wAA3AwBBiMgGQvuouL2U/OTIwAA3AwBBgMgGQqm4vZTc/o7YwAA3AwBB+McGQubMmbPm3P/mwAA3AwBB8McGQs2Zs+bMx87ywAA3AwBB6McGQoCAgICA3uL9wAA3AwBB4McGQoCAgICAopGHwQA3AwBB2McGQoCAgICAi6aOwQA3AwBB0McGQoCAgICA9OuSwQA3AwBByMcGQoCAgICA5v2WwQA3AwBBwMcGQoCAgIDgzfiZwQA3AwBBuMcGQoCAgIDA4tycwQA3AwBBsMcGQoCAgIDAkuKfwQA3AwBBqMcGQoCAgICw8L6hwQA3AwBBoMcGQoCAgIDwg5KjwQA3AwBBmMcGQoCAgIDA8YmlwQA3AwBB8MYGQuiituf3p4mnwAA3AwBB6MYGQq+6k7GQsKW5wAA3AwBB4MYGQubMmbPm7JnKwAA3AwBB2MYGQubMmbPmlLbZwAA3AwBB0MYGQs2Zs+bMrdrowAA3AwBByMYGQrPmzJmzjqn0wAA3AwBBwMYGQoCAgICArP7/wAA3AwBBuMYGQoCAgICAveSIwQA3AwBBsMYGQoCAgICgoqaQwQA3AwBBqMYGQoCAgICgm8uUwQA3AwBBoMYGQoCAgICgltmYwQA3AwBBmMYGQoCAgIDArsWbwQA3AwBBkMYGQoCAgICA6eKewQA3AwBBiMYGQoCAgIDAtpOhwQA3AwBBgMYGQoCAgIDgq4KjwQA3AwBB+MUGQoCAgICAvPekwQA3AwBB8MUGQoCAgICAmpenwQA3AwBBoMgGQvuouL2U3J7CPzcDAEGYyAZCt5KGgtacgqXAADcDAEGAyQZCgICAgLC6r6LBADcDAEH4yAZCgICAgJDf4aXBADcDAEHwyAZCgICAgPCy56jBADcDAEHoyAZCgICAgND19KrBADcDAEHgyAZCgICAgJDpka3BADcDAEHYyAZCgICAgNiRtq/BADcDAEHQyAZCgICAgNjQhrHBADcDAEHIyAZCgICAgIjjr7PBADcDAEHAyAZCgICAgPDr3bfBADcDAEG4yAZCgICAgKjw0brBADcDAEGwyAZCgICAgJi1m7zBADcDAEHYyQZCgICAgICAgPg/NwMAQdDJBkKAgICAgICAscAANwMAQcjJBkKAgICAgICIw8AANwMAQcDJBkKAgICAgMCV1MAANwMAQbjJBkKAgICAgMCe48AANwMAQbDJBkKAgICAgOyw8sAANwMAQajJBkKAgICAgNzY/sAANwMAQaDJBkKAgICAwJDEicEANwMAQZjJBkKAgICAgPe8ksEANwMAQZDJBkKAgICA4N/ymcEANwMAQYjJBkKAgICA4K2Bn8EANwMAQfDKBkKAgICAgICAtMAANwMAQejKBkKAgICAgICWxcAANwMAQeDKBkKAgICAgMCV1MAANwMAQdjKBkKAgICAgOCe48AANwMAQdDKBkKAgICAgKD078AANwMAQcjKBkKAgICAgIap+sAANwMAQcDKBkKAgICAgOqrg8EANwMAQbjKBkKAgICAwMHbisEANwMAQbDKBkKAgICAgJGQkMEANwMAQajKBkKAgICAoJ+dk8EANwMAQaDKBkKAgICAwLnzlsEANwMAQZjKBkKAgICAwNLEmcEANwMAQZDKBkKAgICA4Lnom8EANwMAQYjKBkKAgICAwPWcnsEANwMAQYDKBkKAgICAsNqsoMEANwMAQfjJBkKAgICAgLrmocEANwMAQfDJBkKAgICA8Iugo8EANwMAQejJBkKAgICAkLLVpMEANwMAQeDJBkKAgICAgICA+D83AwBBqMwGQoCAgICAgID4PzcDAEGAywZCgICAgICAgPg/NwMAQeDMBkKAgICAwKeEisEANwMAQdjMBkKAgICAwJ+KjMEANwMAQdDMBkKAgICAgICXjsEANwMAQcjMBkKAgICAwJ2pkMEANwMAQcDMBkKAgICAgICA+D83AwBBuMwGQoCAgICAgID4PzcDAEGwzAZCgICAgICAgPg/NwMAQaDMBkKAgICAgICgosAANwMAQZjMBkKAgICAgIDgtMAANwMAQZDMBkKAgICAgID+xcAANwMAQYjMBkKAgICAgID11MAANwMAQYDMBkKAgICAgJD348AANwMAQfjLBkKAgICAgNi48MAANwMAQfDLBkKAgICAgJz6+sAANwMAQejLBkKAgICAgIaFhMEANwMAQeDLBkKAgICAgOWvi8EANwMAQdjLBkKAgICAgIbQkMEANwMAQdDLBkKAgICA4Mf1k8EANwMAQcjLBkKAgICAgNPol8EANwMAQcDLBkKAgICAwNKPmsEANwMAQbjLBkKAgICAgLLFnMEANwMAQbDLBkKAgICAgOiMn8EANwMAQajLBkKAgICAgLDuoMEANwMAQaDLBkKAgICA8MSzosEANwMAQZjLBkKAgICA4Mr4o8EANwMAQZDLBkKAgICAgICA+D83AwBBiMsGQoCAgICAgID4PzcDAEH4ygZCgICAgICA4KHAADcDAEHQzgZCgICAgIC43PDAADcDAEHIzgZCgICAgICMrPzAADcDAEHAzgZCgICAgICNgYjBADcDAEG4zgZCgICAgIDM5pDBADcDAEGwzgZCgICAgKCiqJjBADcDAEGozgZCgICAgOCfzpzBADcDAEGgzgZCgICAgICj26DBADcDAEGYzgZCgICAgOCSyKPBADcDAEGQzgZCgICAgKCx5qbBADcDAEGIzgZCgICAgIDRlanBADcDAEGAzgZCgICAgOD/hKvBADcDAEH4zQZCgICAgLDL+qzBADcDAEHwzQZCgICAgODumq/BADcDAEHozQZCgICAgNCz77HBADcDAEHgzQZCgICAgNDFwbbBADcDAEHYzQZCgICAgLDq4LrBADcDAEHQzQZCgICAgIjKrLzBADcDAEHIzQZCgICAgICAgJDAADcDAEHAzQZCgICAgICAoKLAADcDAEG4zQZCgICAgICAmLPAADcDAEGwzQZCgICAgICAqsLAADcDAEGozQZCgICAgIDAxdHAADcDAEGgzQZCgICAgICAwd3AADcDAEGYzQZCgICAgIDg4ejAADcDAEGQzQZCgICAgIDs0PHAADcDAEGIzQZCgICAgIDQjPnAADcDAEGAzQZCgICAgIC85v3AADcDAEH4zAZCgICAgIC5xIHBADcDAEHwzAZCgICAgIDd04TBADcDAEHozAZCgICAgIDCjIjBADcDAEGg0AZCgICAgICAgPg/NwMAQfjOBkKAgICAgICA+D83AwBB8M4GQoCAgICAgJCvwAA3AwBB6M4GQoCAgICAgKbBwAA3AwBB4M4GQoCAgICAwJzSwAA3AwBB2M4GQoCAgICA0LjhwAA3AwBBwNAGQoCAgIDg4omkwQA3AwBBuNAGQoCAgIDgwu6lwQA3AwBBsNAGQoCAgICAgID4PzcDAEGo0AZCgICAgICAgPg/NwMAQZjQBkKAgICAgICgpsAANwMAQZDQBkKAgICAgIDYuMAANwMAQYjQBkKAgICAgIDHycAANwMAQYDQBkKAgICAgIDq2MAANwMAQfjPBkKAgICAgPCT6MAANwMAQfDPBkKAgICAgLTF88AANwMAQejPBkKAgICAgP78/sAANwMAQeDPBkKAgICAwLGdiMEANwMAQdjPBkKAgICAwJzGj8EANwMAQdDPBkKAgICAgK3lk8EANwMAQcjPBkKAgICA4OaSmMEANwMAQcDPBkKAgICAwPvnmsEANwMAQbjPBkKAgICAgKXrncEANwMAQbDPBkKAgICAkK/JoMEANwMAQajPBkKAgICAoJeposEANwMAQaDPBkKAgICA4OeOpMEANwMAQZjPBkKAgICA0K2cpsEANwMAQZDPBkKAgICAuO+UqMEANwMAQYjPBkKAgICA+LSYqcEANwMAQYDPBkKAgICAgICA+D83AwBByNEGQoCAgICAgID4PzcDAEGw0gZCgICAgICYl/PAADcDAEGo0gZCgICAgICCyPrAADcDAEGg0gZCgICAgICsgYDBADcDAEGY0gZCgICAgIDoiIPBADcDAEGQ0gZCgICAgICq2IbBADcDAEGI0gZCgICAgMCks4nBADcDAEGA0gZCgICAgID50ovBADcDAEH40QZCgICAgMCDg47BADcDAEHw0QZC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gID4PzcDAEGItgdCgICAgICAgPg/NwMAQYC2B0KAgICAgICA+D83AwBBkLYHQpqz5syZs+b0PzcDAEHYtgdCgICAgICAgPg/NwMAQdC2B0KAgICAgICA+D83AwBByLYHQoCAgICAgID4PzcDAEHAtgdCgICAgICAgPg/NwMAQaC2B0L7qLi9lNye0j83AwBB4LYHQrPmzJmz5szpPzcDAEHotgdC9tHw+qi4vfQ/NwMAQfC2B0K4vZTcnoqu5z83AwBB+LYHQoCAgJDK0sauwgA3AwBBgLcHQpqz5syZs+b6PzcDAEGItwdCgICAgICA0M/AADcDAEGQtwdCgICAgICAgIDAADcDAEGYtwdCgICAgICAgJ/AADcDAEHYtwdCgICAgICAgPg/NwMAQdC3B0KAgICAgICA6D83AwBByLcHQpqz5syZs+b0PzcDAEHAtwdCmrPmzJmz5uQ/NwMAQaC3B0KAgICAgICA+D83AwBB4LcHQpqz5syZs+b8PzcDAEHotwdCzZmz5syZs/Y/NwMAQfC4B0KAgICAgICAisAANwMAQbC4B0KAgICAgICAkMAANwMAQZC4B0KAgICAgICAkMAANwMAQYC4B0KAgICAgICAisAANwMAQZi5B0IANwMAQaC5B0IANwMAQai5B0KAgICAgICA+D83AwBBuLkHQoCAgICAgID8PzcDAEGwuQdCgICAgICAgPw/NwMAQcC5B0KAgICAgICA+D83AwBByLkHQoCAgICAgID4PzcDAEGIugdCgICAgICAgPg/NwMAQYC6B0KAgICAgICA+D83AwBB+LkHQoCAgICAgID4PzcDAEHwuQdCgICAgICAgPg/NwMAQdC5B0KAgICAgICA+D83AwBBkLoHQpTcnoquj4X5PzcDAEGYugdCgICAgICAgIrAADcDAEGgugdCgICAgICAgPg/NwMAQai6B0KAgICAgICAgMAANwMAQbC6B0IANwMAQbi6B0Kas+bMmbPm3D83AwBBwLoHQgA3AwBByLoHQpqz5syZs+bUPzcDAEHQugdCztCQgpyE9fg/NwMAQdi6B0LS8PqouL2U3D83AwBB4LoHQubMmbPmzJn7PzcDAEHougdCgICAgICAgIrAADcDAEHwugdCgICAgICAgIrAADcDAEH4ugdCgICAgICAgIrAADcDAEGAuwdCgICAgICAgIrAADcDAEGIuwdCgICAgICAgIrAADcDAEGQuwdCgICAgICAgIrAADcDAEGYuwdCgICAgICAgIrAADcDAEGguwdCgICAgICAgPg/NwMAQbi7B0IANwMAQbC7B0IANwMAQdC7B0KAgICAgICA+D83AwBB2LsHQrPmzJmz5sz1PzcDAEGQvgdCgICAgICAgK/AADcDAEGYvgdCgICAgICAgKrAADcDAEGgvgdCgICAgICAwKzAADcDAEGovgdCADcDAEGwvgdC+v2p48vupLQ/NwMAQbi+B0Kas+bMmbPm3D83AwBBwL4HQs7QkIKchPX4PzcDAEHIvgdC5syZs+bMmfs/NwMAQdC+B0IANwMAQdi+B0IANwMAQeC+B0IANwMAQei+B0KAgICAgICA+D83AwBB8L4HQoCAgICAgIDwPzcDAEH4vgdCgICAgICAgPA/NwMAQYC/B0KAgICQytLGrsIANwMAQfi8B0LNmbPmzJmz9j83AwBBgL0HQrPmzJmz5sz1PzcDAEGIvwdCgICAgICAgJ/AADcDAEGQvwdCgICAgICAgIDAADcDAEGYvwdCADcDAEGgvwdCgICAgICAgIDAADcDAEGovwdCgICAgICAgI7AADcDAEGwvwdCgICAgICA5cnAADcDAEG4vwdCrYbx2K7cjY0/NwMAQcC/B0KAgICAgIDkz8AANwMAQci/B0KAgICAgIDkz8AANwMAQdC/B0KAgICAgIDkz8AANwMAQdi/B0KAgICAgIDkz8AANwMAQei/B0KAgICAgIDkz8AANwMAQeC/B0KAgICAgIDpz8AANwMAQfC/B0KAgICAgIDpz8AANwMAQfi/B0KAgICAgIDkz8AANwMAQYDAB0KAgICAgIDpz8AANwMAQYjAB0KAgICAgIDpz8AANwMAQZDAB0KAgICAgIDArMAANwMAQZjAB0LNmbPmzJmz+j83AwBBqMAHQoCAgICAgICGwAA3AwBBoMAHQubMmbPmzJn7PzcDAEG4wAdCs+bMmbPmzPk/NwMAQbDAB0LmzJmz5syZ8z83AwBByMAHQpqz5syZs+bsPzcDAEHAwAdCs+bMmbPmzPE/NwMAQdDAB0KAgICAgICA4D83AwBB2MAHQoCAgICAgMCswAA3AwBB4MAHQoCAgICAgID4PzcDAEGYwQdCjujXj8KCgNg/NwMAQZDBB0Ll7KCmsuTZ6z83AwBBiMEHQp2/iseD3trxPzcDAEGowgdCmrPmzJmz5uw/NwMAQaDCB0L20fD6qLi97D83AwBBsMIHQoCAgICAgICKwAA3AwBBuMIHQoCAgICAgICAwAA3AwBBwMIHQoCAgICAgICSwAA3AwBByMIHQoCAgICAgICawAA3AwBB0MIHQrPmzJmz5syDwAA3AwBB2MIHQoCAgICAgICDwAA3AwBB4MIHQoCAgICAgID4PzcDAEHowgdCgICAgICAgPg/NwMAQQAhAEH4wgdCgICAgICAgJnAADcDAEHwwgdCgICAgICAgPg/NwMAQYDDB0KAgICAgICAisAANwMAQYjDB0KAgICAgICAisAANwMAQZDDB0KAgICAgICAisAANwMAQZjDB0KAgICAgICAl8AANwMAQaDDB0KAgICAgICAmsAANwMAQajDB0KAgICAgICAksAANwMAQbDDB0KAgICAgJChl8EANwMAQbjDB0KAgICAgJChl8EANwMAQcDDB0KAgICAgJChl8EANwMAQcjDB0LI8LWjypfMkcQANwMAA0BBACEBA0AgAEGoAWxB0MMHaiABQQN0akKAgICAgIDArMAANwMAIAFBAWoiAUEVRw0ACyAAQQFqIgBBAkcNAAtBqMYHQoCAgICA6N2VwQA3AwBBoMYHQrefq5nTtL32PzcDAEGwxgdCgICAgICApNXAADcDAEG4xgdCgICAgPKLqPnBADcDAEH4xgdC0vD6qLi9lOQ/NwMAQfDGB0LD66Ph9dHw4j83AwBB6MYHQrPmzJmz5szpPzcDAEHgxgdC+v2p48vupNQ/NwMAQdjGB0L6/anjy+6kxD83AwBB0MYHQpqz5syZs+bcPzcDAEHIxgdCm970puKg4No/NwMAQcDGB0L6/anjy+6k3D83AwBBoMcHQvT708aX3cnYPzcDAEGYxwdCnImDgauO2sg/NwMAQZDHB0KF18fC66Ph5T83AwBBiMcHQuiituf3p43fPzcDAEGAxwdCyMLro+H10eA/NwMAQQAhAEEAIQFBuMcHQrGQsOWhi9ndPzcDAEGwxwdCz+/Pmt70puI/NwMAQajHB0K25/enja+64z83AwBBwMcHQoCAgICA6N2VwQA3AwBByMcHQo3At4GJlP7YPzcDAEHQxwdC0t/9uuC5xtA/NwMAQdjHB0KOjcC3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IgNCgICAgICAwIA8fSADQoCAgICAgMD/wwB9VARAIAVCBIYgBEI8iIQhAyAEQv//////////D4MiBEKBgICAgICAgAhaBEAgA0KBgICAgICAgMAAfCECDAILIANCgICAgICAgIBAfSECIARCgICAgICAgIAIhUIAUg0BIAIgA0IBg3whAgwBCyAEUCADQoCAgICAgMD//wBUIANCgICAgICAwP//AFEbRQRAIAVCBIYgBEI8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIANC////////v//DAFYNAEIAIQIgA0IwiKciCEGR9wBJDQAgBCECIAVC////////P4NCgICAgICAwACEIgMhBgJAIAhBgfcAayIAQcAAcQRAIAIgAEFAaq2GIQZCACECDAELIABFDQAgBiAArSIHhiACQcAAIABrrYiEIQYgAiAHhiECCyABIAI3AxAgASAGNwMYIAEhAAJAQYH4ACAIayIIQcAAcQRAIAMgCEFAaq2IIQRCACEDDAELIAhFDQAgA0HAACAIa62GIAQgCK0iAoiEIQQgAyACiCEDCyAAIAQ3AwAgACADNwMIIAEpAwhCBIYgASkDACIEQjyIhCECIAEpAxAgASkDGIRCAFKtIARC//////////8Pg4QiBEKBgICAgICAgAhaBEAgAkIBfCECDAELIARCgICAgICAgIAIhUIAUg0AIAJCAYMgAnwhAgsgAUEgaiQAIAIgBUKAgICAgICAgIB/g4S/CzkDAAvgFgMSfwF8An4jAEGwBGsiCSQAIAlBADYCLAJAIAG9IhlCAFMEQEEBIRFB6gkhEiABmiIBvSEZDAELIARBgBBxBEBBASERQe0JIRIMAQtB8AlB6wkgBEEBcSIRGyESIBFFIRYLAkAgGUKAgICAgICA+P8Ag0KAgICAgICA+P8AUQRAIABBICACIBFBA2oiCyAEQf//e3EQESAAIBIgERAOIABB/QlBhQogBUEgcSIDG0GBCkGJCiADGyABIAFiG0EDEA4MAQsgCUEQaiEPAkACfwJAIAEgCUEsahAoIgEgAaAiAUQAAAAAAAAAAGIEQCAJIAkoAiwiBkEBazYCLCAFQSByIg5B4QBHDQEMAwsgBUEgciIOQeEARg0CIAkoAiwhDEEGIAMgA0EASBsMAQsgCSAGQR1r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8McMKwMAEAVBkMgMKwMAEAVBoMgMKwMAEAVB+MMMKwMAEAVBqMQMKwMAEAVBuMQMKwMAEAVBgMQMKwMAEAVBoMQMKwMAEAVBsMQMKwMAEAVBmMsMKwMAEAVBqMsMKwMAEAVBkMsMKwMAEAVBoMsMKwMAEAVBkMIMKwMAEAVBsJ0OKwMAEAVBuJ0OKwMAEAVBmJ0OKwMAEAVBoJ0OKwMAEAVBqJ0OKwMAEAVBkJ0OKwMAEAVBgNgMKwMAEAVByI4OKwMAEAVBsI4OKwMAEAVByJEOKwMAEAVB0JEOKwMAEAVB2JEOKwMAEAVB6JEOKwMAEAVB+JEOKwMAEAVBwJEOKwMAEAVB4JEOKwMAEAVB8JEOKwMAEAVB8JAOKwMAEAVB+LMNKwMAEAVB6MAMKwMAEAVB2MAMKwMAEAVB0MAMKwMAEAVB4MAMKwMAEAVBuIwOKwMAEAVBwIwOKwMAEAVByIwOKwMAEAVB2IwOKwMAEAVB6IwOKwMAEAVBsIwOKwMAEAVB0IwOKwMAEAVB4IwOKwMAEAVByNcLKwMAEAVBuNcLKwMAEAVBsNcLKwMAEAVBwNcLKwMAEAVB0I4OKwMAEAVBuI4OKwMAEAVB+NANKwMAEAVBgNENKwMAEAVBiNENKwMAEAVBmNENKwMAEAVBqNENKwMAEAVB8NANKwMAEAVBkNENKwMAEAVBoNENKwMAEAVBwI4OKwMAEAVBqI4OKwMAEAVBoNsLKwMAEAVB+IwOKwMAEAVBgI0OKwMAEAVBiI0OKwMAEAVBmI0OKwMAEAVBqI0OKwMAEAVB8IwOKwMAEAVBkI0OKwMAEAVBoI0OKwMAEAVBwI0OKwMAEAVBuI0OKwMAEAVB8NkLKwMAEAVB4NkLKwMAEAVBsPUMKwMAEAVBsNANKwMAEAVB+M8NKwMAEAVB8M8NKwMAEAVB0M8NKwMAEAVB8OsNKwMAEAVBwPEMKwMAEAVBqPkHKwMAEAVBkOAMKwMAEAVBkOsNKwMAEAVBiOsNKwMAEAVB4MsNKwMAEAVB+MoNKwMAEAVB2MsNKwMAEAVB4OoNKwMAEAVBuMgNKwMAEAVBsOcNKwMAEAVB2OQNKwMAEAVB0OQNKwMAEAVByOQNKwMAEAVBwOQNKwMAEAVBmJ8MKwMAEAVB4M8NKwMAEAVBoPkHKwMAEAVB0NcNKwMAEAVByNENKwMAEAVB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oqA5AzAgACECQQAhAEEBIQEgAg0AC0EAIQFBACELQdDABysDACEDQQEhAEEBIQIDQCALQagBbCIKQaCACGoiCyALKwM4IApB8NoMaiILKwMwIApBoJUOaisDOKEgCysDOKEgA6KgOQM4IAIhCkEAIQJBASELIAoNAAsDQCABQagBbCIBQaCACGoiAiACKwNAIAFB8NoMaiICKwM4IAFBoJUOaisDQKEgAisDQKEgA6KgOQNAQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQaCACGoiAiACKwNIIABB8NoMaiICKwNAIABBoJUOaisDSKEgAisDSKEgA6KgOQNIQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaCACGoiAiACKwNQIAFB8NoMaiICKwNIIAFBoJUOaisDUKEgAisDUKEgA6KgOQNQQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQaCACGoiAiACKwNYIABB8NoMaiICKwNQIABBoJUOaisDWKEgAisDWKEgA6KgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaCACGoiAiACKwNgIAFB8NoMaiICKwNYIAFBoJUOaisDYKEgAisDYKEgA6KgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQaCACGoiAiACKwNoIABB8NoMaiICKwNgIABBoJUOaisDaKEgAisDaKEgA6KgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaCACGoiAiACKwNwIAFB8NoMaiICKwNoIAFBoJUOaisDcKEgAisDcKEgA6KgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQaCACGoiAiACKwN4IABB8NoMaiICKwNwIABBoJUOaisDeKEgAisDeKEgA6KgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaCACGoiAiACKwOAASABQfDaDGoiAisDeCABQaCVDmorA4ABoSACKwOAAaEgA6KgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGggAhqIgIgAisDiAEgAEHw2gxqIgIrA4ABIABBoJUOaisDiAGhIAIrA4gBoSADoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaCACGoiAiAC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WKEgA6KgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCKCGoiAiACKwNgIAFBwN0MaiICKwNYIAFB0JIOaisDYKEgAisDYKEgA6KgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCKCGoiAiACKwNoIABBwN0MaiICKwNgIABB0JIOaisDaKEgAisDaKEgA6KgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCKCGoiAiACKwNwIAFBwN0MaiICKwNoIAFB0JIOaisDcKEgAisDcKEgA6KgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQfCKCGoiAiACKwN4IABBwN0MaiICKwNwIABB0JIOaisDeKEgAisDeKEgA6KgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCKCGoiAiACKwOAASABQcDdDGoiAisDeCABQdCSDmorA4ABoSACKwOAAaEgA6KgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHwighqIgIgAisDiAEgAEHA3QxqIgIrA4ABIABB0JIOaisDiAGhIAIrA4gBoSADoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQfCKCGoiAiACKwOQASABQcDdDGoiAisDiAEgAUHQkg5qKwOQAaEgAisDkAGhIAOioDkDkAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgBB8IoIaiICIAIrA5gBIABBwN0MaiICKwOQASAAQdCSDmorA5gBoSACKwOYAaEgA6KgOQOYAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHwighqIgIgAisDoAEgAUHA3QxqIgIrA5gBIAFB0JIOaisDoAGhIAIrA6ABoSADoqA5A6ABQQEhASAAIQJBACEAIAINAAtB6I0MQeiNDCsDAEHQnQ4rAwAgA6KhOQMAQZCRDEGQkQwrAwBBmNINKwMAQaCMDisDAKFB0MAHKwMAIgOioDkDAEGYlAxBmJQMKwMAIANBiNINKwMAQbDkDSsDAKGioDkDAEGwvAxBsLwMKwMAIANBuKUOKwMAQaiSDisDAKCioDkDAEG4vAxBuLwMKwMAIANBsMENKwMAQajBDSsDAKBBmMENKwMAoEG45w0rAwCh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",BA(Z)||(Z=a(Z));function oA(C){try{if(C==Z&&L)return new Uint8Array(L);var I=DA(C);if(I)return I;if(O)return O(C);throw"both async and sync fetching of the wasm failed"}catch(s){V(s)}}function tA(){if(!L&&(M||K)){if(typeof fetch=="function"&&!MA(Z))return fetch(Z,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+Z+"\'";return C.arrayBuffer()}).catch(function(){return oA(Z)});if(k)return new Promise(function(C,I){k(Z,function(s){C(new Uint8Array(s))},I)})}return Promise.resolve().then(function(){return oA(Z)})}function nA(){var C={a:FA};function I(G,r){var f=G.exports;Q.asm=f,y=Q.asm.f,b(y.buffer),_=Q.asm.o,aA(Q.asm.g),NA()}HA();function s(G){I(G.instance)}function e(G){return tA().then(function(r){return WebAssembly.instantiate(r,C)}).then(function(r){return r}).then(G,function(r){t("failed to asynchronously prepare wasm: "+r),V(r)})}function u(){return!L&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(Z)&&!MA(Z)&&typeof fetch=="function"?fetch(Z,{credentials:"same-origin"}).then(function(G){var r=WebAssembly.instantiateStreaming(G,C);return r.then(s,function(f){return t("wasm streaming compile failed: "+f),t("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var j=Q.instantiateWasm(C,I);return j}catch(G){return t("Module.instantiateWasm callback failed with error: "+G),!1}return u().catch(w),{}}function wA(C){for(;C.length>0;){var I=C.shift();if(typeof I=="function"){I(Q);continue}var s=I.func;typeof s=="number"?I.arg===void 0?iA(s)():iA(s)(I.arg):s(I.arg===void 0?null:I.arg)}}function iA(C){return _.get(C)}function OA(C,I,s){d.copyWithin(C,I,I+s)}function hA(C){V("OOM")}function uA(C){d.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,I){var s=AA.buffers[C];I===0||I===10?((C===1?N:t)(m(s,0)),s.length=0):s.push(I)},varargs:void 0,get:function(){AA.varargs+=4;var C=z[AA.varargs-4>>2];return C},getStr:function(C){var I=p(C);return I},get64:function(C,I){return C}};function jA(C){return 0}function zA(C,I,s,e,u){}function fA(C,I,s,e){for(var u=0,j=0;j<s;j++){var G=z[I>>2],r=z[I+4>>2];I+=8;for(var f=0;f<r;f++)AA.printChar(C,d[G+f]);u+=r}return z[e>>2]=u,0}var LA=typeof atob=="function"?atob:function(C){var I="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,j,G,r,f,S,J=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do G=I.indexOf(C.charAt(J++)),r=I.indexOf(C.charAt(J++)),f=I.indexOf(C.charAt(J++)),S=I.indexOf(C.charAt(J++)),e=G<<2|r>>4,u=(r&15)<<4|f>>2,j=(f&3)<<6|S,s=s+String.fromCharCode(e),f!==64&&(s=s+String.fromCharCode(u)),S!==64&&(s=s+String.fromCharCode(j));while(J<C.length);return s};function qA(C){try{for(var I=LA(C),s=new Uint8Array(I.length),e=0;e<I.length;++e)s[e]=I.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(C){if(BA(C))return qA(C.slice(EA.length))}var FA={c:OA,d:uA,e:jA,b:zA,a:fA};nA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=R;var QA;W=function C(){QA||IA(),QA||(W=C)};function IA(C){if(l>0||(X(),l>0))return;function I(){QA||(QA=!0,Q.calledRun=!0,!U&&(GA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),kA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),I()},1)):I()}if(Q.run=IA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return IA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
    for (const w of e) {
      const n = this.modelSpec.implVars.get(w);
      n && r.push(n);
    }
    const o = this.outputs.startTime, i = this.outputs.endTime, Q = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, i, Q);
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
