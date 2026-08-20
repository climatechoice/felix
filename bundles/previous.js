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
            const q = I[d];
            h = O.call(t, q), I.splice(d, 1), d--;
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
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, a = M.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let w = 0;
    function n(M, h) {
      const p = w, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, q = Math.round(h * O), F = Math.ceil(q / 8) * 8;
      return w += F, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), m = n("float64", i), D = n("int32", Q), g = n("float64", s), I = n("int32", a), t = w;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const C = this.header.view;
    let c = 0;
    C[c++] = l, C[c++] = extrasLengthInElements, C[c++] = f, C[c++] = o, C[c++] = m, C[c++] = i, C[c++] = D, C[c++] = Q, C[c++] = g, C[c++] = s, C[c++] = I, C[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, i), this.outputIndices.update(this.encoded, D, Q), this.lookups.update(this.encoded, g, s), this.lookupIndices.update(this.encoded, I, a);
    const d = this.inputs.view;
    for (let M = 0; M < A.length; M++) {
      const h = A[M];
      typeof h == "number" ? d[M] = h : d[M] = h.get();
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
    const Q = o[i++], B = o[i++], s = o[i++], a = o[i++], w = o[i++], n = o[i++], E = o[i++], l = o[i++], f = o[i++], m = o[i++], D = o[i++], g = o[i++], I = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, C = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, M = g * Int32Array.BYTES_PER_ELEMENT, h = e + I + t + C + c + d + M;
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
      optimizeNames(u, K) {
        return this;
      }
    }
    class B extends Q {
      constructor(u, K, y) {
        super(), this.varKind = u, this.name = K, this.rhs = y;
      }
      render({ es5: u, _n: K }) {
        const y = u ? r.varKinds.var : this.varKind, z = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${y} ${this.name}${z};` + K;
      }
      optimizeNames(u, K) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = Y(this.rhs, u, K)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends Q {
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
        return S(u, this.rhs);
      }
    }
    class a extends s {
      constructor(u, K, y, z) {
        super(u, y, z), this.op = K;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class w extends Q {
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
        return this.code = Y(this.code, u, K), this;
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
        let z = y.length;
        for (; z--; ) {
          const b = y[z];
          b.optimizeNames(u, K) || (T(u, b.names), y.splice(z, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, K) => U(u, K.names), {});
      }
    }
    class m extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class D extends f {
    }
    class g extends m {
    }
    g.kind = "else";
    class I extends m {
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
          K = this.else = Array.isArray(y) ? new g(y) : y;
        }
        if (K)
          return u === !1 ? K instanceof I ? K : K.nodes : this.nodes.length ? this : new I(rA(u), K instanceof I ? [K] : K.nodes);
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
        return S(u, this.condition), this.else && U(u, this.else.names), u;
      }
    }
    I.kind = "if";
    class t extends m {
    }
    t.kind = "for";
    class C extends t {
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
        return U(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, K, y, z) {
        super(), this.varKind = u, this.name = K, this.from = y, this.to = z;
      }
      render(u) {
        const K = u.es5 ? r.varKinds.var : this.varKind, { name: y, from: z, to: b } = this;
        return `for(${K} ${y}=${z}; ${y}<${b}; ${y}++)` + super.render(u);
      }
      get names() {
        const u = S(super.names, this.from);
        return S(u, this.to);
      }
    }
    class d extends t {
      constructor(u, K, y, z) {
        super(), this.loop = u, this.varKind = K, this.name = y, this.iterable = z;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, K) {
        if (super.optimizeNames(u, K))
          return this.iterable = Y(this.iterable, u, K), this;
      }
      get names() {
        return U(super.names, this.iterable.names);
      }
    }
    class M extends m {
      constructor(u, K, y) {
        super(), this.name = u, this.args = K, this.async = y;
      }
      render(u) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(u);
      }
    }
    M.kind = "func";
    class h extends f {
      render(u) {
        return "return " + super.render(u);
      }
    }
    h.kind = "return";
    class p extends m {
      render(u) {
        let K = "try" + super.render(u);
        return this.catch && (K += this.catch.render(u)), this.finally && (K += this.finally.render(u)), K;
      }
      optimizeNodes() {
        var u, K;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (K = this.finally) === null || K === void 0 || K.optimizeNodes(), this;
      }
      optimizeNames(u, K) {
        var y, z;
        return super.optimizeNames(u, K), (y = this.catch) === null || y === void 0 || y.optimizeNames(u, K), (z = this.finally) === null || z === void 0 || z.optimizeNames(u, K), this;
      }
      get names() {
        const u = super.names;
        return this.catch && U(u, this.catch.names), this.finally && U(u, this.finally.names), u;
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
    class q extends m {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    q.kind = "finally";
    class F {
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
      _def(u, K, y, z) {
        const b = this._scope.toName(K);
        return y !== void 0 && z && (this._constants[b.str] = y), this._leafNode(new B(u, b, y)), b;
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
        for (const [y, z] of u)
          K.length > 1 && K.push(","), K.push(y), (y !== z || this.opts.es5) && (K.push(":"), (0, e.addCodeArg)(K, z));
        return K.push("}"), new e._Code(K);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, K, y) {
        if (this._blockNode(new I(u)), K && y)
          this.code(K).else().code(y).endIf();
        else if (K)
          this.code(K).endIf();
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
      _for(u, K) {
        return this._blockNode(u), K && this.code(K).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, K) {
        return this._for(new C(u), K);
      }
      // `for` statement for a range of values
      forRange(u, K, y, z, b = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(b, J, K, y), () => z(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, K, y, z = r.varKinds.const) {
        const b = this._scope.toName(u);
        if (this.opts.es5) {
          const J = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(b, (0, e._)`${J}[${Z}]`), y(b);
          });
        }
        return this._for(new d("of", z, b, K), () => y(b));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, K, y, z = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${K})`, y);
        const b = this._scope.toName(u);
        return this._for(new d("in", z, b, K), () => y(b));
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
        const K = new h();
        if (this._blockNode(K), this.code(u), K.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(h);
      }
      // `try` statement
      try(u, K, y) {
        if (!K && !y)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const z = new p();
        if (this._blockNode(z), this.code(u), K) {
          const b = this.name("e");
          this._currNode = z.catch = new O(b), K(b);
        }
        return y && (this._currNode = z.finally = new q(), this.code(y)), this._endBlockNode(O, q);
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
      func(u, K = e.nil, y, z) {
        return this._blockNode(new M(u, K, y)), z && this.code(z).endFunc(), this;
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
        if (!(K instanceof I))
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
    A.CodeGen = F;
    function U(N, u) {
      for (const K in u)
        N[K] = (N[K] || 0) + (u[K] || 0);
      return N;
    }
    function S(N, u) {
      return u instanceof e._CodeOrName ? U(N, u.names) : N;
    }
    function Y(N, u, K) {
      if (N instanceof e.Name)
        return y(N);
      if (!z(N))
        return N;
      return new e._Code(N._items.reduce((b, J) => (J instanceof e.Name && (J = y(J)), J instanceof e._Code ? b.push(...J._items) : b.push(J), b), []));
      function y(b) {
        const J = K[b.str];
        return J === void 0 || u[b.str] !== 1 ? b : (delete u[b.str], J);
      }
      function z(b) {
        return b instanceof e._Code && b._items.some((J) => J instanceof e.Name && u[J.str] === 1 && K[J.str] !== void 0);
      }
    }
    function T(N, u) {
      for (const K in u)
        N[K] = (N[K] || 0) - (u[K] || 0);
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
    for (const h of d)
      M[h] = !0;
    return M;
  }
  util.toHash = r;
  function o(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (i(d, M), !Q(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function i(d, M = d.schema) {
    const { opts: h, self: p } = d;
    if (!h.strictSchema || typeof M == "boolean")
      return;
    const O = p.RULES.keywords;
    for (const q in M)
      O[q] || c(d, `unknown keyword: "${q}"`);
  }
  util.checkUnknownRules = i;
  function Q(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (M[h])
        return !0;
    return !1;
  }
  util.schemaHasRules = Q;
  function B(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (h !== "$ref" && M.all[h])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: M }, h, p, O) {
    if (!O) {
      if (typeof h == "number" || typeof h == "boolean")
        return h;
      if (typeof h == "string")
        return (0, A._)`${h}`;
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
      for (const h of d)
        M(h);
    else
      M(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: M, mergeValues: h, resultToName: p }) {
    return (O, q, F, U) => {
      const S = F === void 0 ? q : F instanceof A.Name ? (q instanceof A.Name ? d(O, q, F) : M(O, q, F), F) : q instanceof A.Name ? (M(O, F, q), q) : h(q, F);
      return U === A.Name && !(S instanceof A.Name) ? p(O, S) : S;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, h) => d.if((0, A._)`${h} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(h, !0), () => d.assign(h, (0, A._)`${h} || {}`).code((0, A._)`Object.assign(${h}, ${M})`));
      }),
      mergeToName: (d, M, h) => d.if((0, A._)`${h} !== true`, () => {
        M === !0 ? d.assign(h, !0) : (d.assign(h, (0, A._)`${h} || {}`), D(d, h, M));
      }),
      mergeValues: (d, M) => d === !0 ? !0 : { ...d, ...M },
      resultToName: m
    }),
    items: f({
      mergeNames: (d, M, h) => d.if((0, A._)`${h} !== true && ${M} !== undefined`, () => d.assign(h, (0, A._)`${M} === true ? true : ${h} > ${M} ? ${h} : ${M}`)),
      mergeToName: (d, M, h) => d.if((0, A._)`${h} !== true`, () => d.assign(h, M === !0 ? !0 : (0, A._)`${h} > ${M} ? ${h} : ${M}`)),
      mergeValues: (d, M) => d === !0 ? !0 : Math.max(d, M),
      resultToName: (d, M) => d.var("items", M)
    })
  };
  function m(d, M) {
    if (M === !0)
      return d.var("props", !0);
    const h = d.var("props", (0, A._)`{}`);
    return M !== void 0 && D(d, h, M), h;
  }
  util.evaluatedPropsToName = m;
  function D(d, M, h) {
    Object.keys(h).forEach((p) => d.assign((0, A._)`${M}${(0, A.getProperty)(p)}`, !0));
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
  function C(d, M, h) {
    if (d instanceof A.Name) {
      const p = M === t.Num;
      return h ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return h ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = C;
  function c(d, M, h = d.opts.strictSchema) {
    if (h) {
      if (M = `strict mode: ${M}`, h === !0)
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
    function i(g, I = A.keywordError, t, C) {
      const { it: c } = g, { gen: d, compositeRule: M, allErrors: h } = c, p = E(g, I, t);
      C ?? (M || h) ? a(d, p) : w(c, (0, e._)`[${p}]`);
    }
    A.reportError = i;
    function Q(g, I = A.keywordError, t) {
      const { it: C } = g, { gen: c, compositeRule: d, allErrors: M } = C, h = E(g, I, t);
      a(c, h), d || M || w(C, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function B(g, I) {
      g.assign(o.default.errors, I), g.if((0, e._)`${o.default.vErrors} !== null`, () => g.if(I, () => g.assign((0, e._)`${o.default.vErrors}.length`, I), () => g.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: g, keyword: I, schemaValue: t, data: C, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = g.name("err");
      g.forRange("i", c, o.default.errors, (h) => {
        g.const(M, (0, e._)`${o.default.vErrors}[${h}]`), g.if((0, e._)`${M}.instancePath === undefined`, () => g.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), g.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${I}`), d.opts.verbose && (g.assign((0, e._)`${M}.schema`, t), g.assign((0, e._)`${M}.data`, C));
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
      const { keyword: c, data: d, schemaValue: M, it: h } = g, { opts: p, propertyName: O, topSchemaRef: q, schemaPath: F } = h;
      C.push([n.keyword, c], [n.params, typeof I == "function" ? I(g) : I || (0, e._)`{}`]), p.messages && C.push([n.message, typeof t == "function" ? t(g) : t]), p.verbose && C.push([n.schema, M], [n.parentSchema, (0, e._)`${q}${F}`], [o.default.data, d]), O && C.push([n.propertyName, O]);
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
    const { gen: c, data: d, opts: M } = t, h = n(C, M.coerceTypes), p = C.length > 0 && !(h.length === 0 && C.length === 1 && (0, e.schemaHasRulesForType)(t, C[0]));
    if (p) {
      const O = m(C, d, M.strictNumbers, Q.Wrong);
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
    const { gen: d, data: M, opts: h } = t, p = d.let("dataType", (0, o._)`typeof ${M}`), O = d.let("coerced", (0, o._)`undefined`);
    h.coerceTypes === "array" && d.if((0, o._)`${p} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(p, (0, o._)`typeof ${M}`).if(m(C, M, h.strictNumbers), () => d.assign(O, M))), d.if((0, o._)`${O} !== undefined`);
    for (const F of c)
      (w.has(F) || F === "array" && h.coerceTypes === "array") && q(F);
    d.else(), g(t), d.endIf(), d.if((0, o._)`${O} !== undefined`, () => {
      d.assign(M, O), l(t, O);
    });
    function q(F) {
      switch (F) {
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
  function f(t, C, c, d = Q.Correct) {
    const M = d === Q.Correct ? o.operators.EQ : o.operators.NEQ;
    let h;
    switch (t) {
      case "null":
        return (0, o._)`${C} ${M} null`;
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
        return (0, o._)`typeof ${C} ${M} ${t}`;
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
    let M;
    const h = (0, i.toHash)(t);
    if (h.array && h.object) {
      const p = (0, o._)`typeof ${C} != "object"`;
      M = h.null ? p : (0, o._)`!${C} || ${p}`, delete h.null, delete h.array, delete h.object;
    } else
      M = o.nil;
    h.number && delete h.integer;
    for (const p in h)
      M = (0, o.and)(M, f(p, C, c, d));
    return M;
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
    const { gen: C, data: c, schema: d } = t, M = (0, i.schemaRefOrVal)(t, d, "type");
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
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, C, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${C}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function Q({ gen: t, data: C, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((h) => (0, A.and)(n(t, C, h, c.ownProperties), (0, A._)`${M} = ${h}`)));
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
  function f({ schemaCode: t, data: C, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: h }, it: p }, O, q, F) {
    const U = F ? (0, A._)`${t}, ${C}, ${d}${M}` : C, S = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, h)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && S.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${U}, ${c.object(...S)}`;
    return q !== A.nil ? (0, A._)`${O}.call(${q}, ${Y})` : (0, A._)`${O}(${Y})`;
  }
  code.callValidateCode = f;
  const m = (0, A._)`new RegExp`;
  function D({ gen: t, it: { opts: C } }, c) {
    const d = C.unicodeRegExp ? "u" : "", { regExp: M } = C.code, h = M(c, d);
    return t.scopeValue("pattern", {
      key: h.toString(),
      ref: h,
      code: (0, A._)`${M.code === "new RegExp" ? m : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = D;
  function g(t) {
    const { gen: C, data: c, keyword: d, it: M } = t, h = C.name("valid");
    if (M.allErrors) {
      const O = C.let("valid", !0);
      return p(() => C.assign(O, !1)), O;
    }
    return C.var(h, !0), p(() => C.break()), h;
    function p(O) {
      const q = C.const("len", (0, A._)`${c}.length`);
      C.forRange("i", 0, q, (F) => {
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
    const { gen: C, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((q) => (0, e.alwaysValidSchema)(M, q)) && !M.opts.unevaluated)
      return;
    const p = C.let("valid", !1), O = C.name("_valid");
    C.block(() => c.forEach((q, F) => {
      const U = t.subschema({
        keyword: d,
        schemaProp: F,
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
    const d = !C && f.compile ? f.compile.call(c.self, I, t, c) : f.validate, M = w(D, g, d), h = D.let("valid");
    l.block$data(h, p), l.ok((m = f.valid) !== null && m !== void 0 ? m : h);
    function p() {
      if (f.errors === !1)
        F(), f.modifying && B(l), U(() => l.error());
      else {
        const S = f.async ? O() : q();
        f.modifying && B(l), U(() => s(l, S));
      }
    }
    function O() {
      const S = D.let("ruleErrs", null);
      return D.try(() => F((0, A._)`await `), (Y) => D.assign(h, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => D.assign(S, (0, A._)`${Y}.errors`), () => D.throw(Y))), S;
    }
    function q() {
      const S = (0, A._)`${M}.errors`;
      return D.assign(S, null), F(A.nil), S;
    }
    function F(S = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, T = !("compile" in f && !C || f.schema === !1);
      D.assign(h, (0, A._)`${S}${(0, r.callValidateCode)(l, M, Y, T)}`, f.modifying);
    }
    function U(S) {
      var Y;
      D.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : h), S);
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
    const { schemaId: I, uriResolver: t } = this.opts, C = E(D[I] || g), c = { "": C }, d = a(t, C, !1), M = {}, h = /* @__PURE__ */ new Set();
    return r(D, { allKeys: !0 }, (q, F, U, S) => {
      if (S === void 0)
        return;
      const Y = d + F;
      let T = c[S];
      typeof q[I] == "string" && (T = rA.call(this, q[I])), oA.call(this, q.$anchor), oA.call(this, q.$dynamicAnchor), c[F] = T;
      function rA(x) {
        const QA = this.opts.uriResolver.resolve;
        if (x = E(T ? QA(T, x) : x), h.has(x))
          throw O(x);
        h.add(x);
        let v = this.refs[x];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? p(q, v.schema, x) : x !== E(Y) && (x[0] === "#" ? (p(q, M[x], x), M[x] = q) : this.refs[x] = Y), x;
      }
      function oA(x) {
        if (typeof x == "string") {
          if (!f.test(x))
            throw new Error(`invalid anchor "${x}"`);
          rA.call(this, `#${x}`);
        }
      }
    }), M;
    function p(q, F, U) {
      if (F !== void 0 && !e(q, F))
        throw O(U);
    }
    function O(q) {
      return new Error(`reference "${q}" resolves to more than one schema`);
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
  function f({ gen: k, validateName: P, schema: H, schemaEnv: j, opts: L }, R) {
    L.code.es5 ? k.func(P, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, L)}`), D(k, L), k.code(R);
    }) : k.func(P, (0, s._)`${a.default.data}, ${m(L)}`, j.$async, () => k.code(t(H, L)).code(R));
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
    const { schema: P, opts: H, gen: j } = k;
    f(k, () => {
      H.$comment && P.$comment && S(k), q(k), j.let(a.default.vErrors, null), j.let(a.default.errors, 0), H.unevaluated && I(k), p(k), Y(k);
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
      M(k, P);
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
  function M(k, P) {
    const { schema: H, gen: j, opts: L } = k;
    L.$comment && H.$comment && S(k), F(k), U(k);
    const R = j.const("_errs", a.default.errors);
    p(k, R), j.var(P, (0, s._)`${R} === ${a.default.errors}`);
  }
  function h(k) {
    (0, n.checkUnknownRules)(k), O(k);
  }
  function p(k, P) {
    if (k.opts.jtd)
      return rA(k, [], !1, P);
    const H = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !j, P);
  }
  function O(k) {
    const { schema: P, errSchemaPath: H, opts: j, self: L } = k;
    P.$ref && j.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(P, L.RULES) && L.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function q(k) {
    const { schema: P, opts: H } = k;
    P.default !== void 0 && H.useDefaults && H.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function F(k) {
    const P = k.schema[k.opts.schemaId];
    P && (k.baseId = (0, w.resolveUrl)(k.opts.uriResolver, k.baseId, P));
  }
  function U(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function S({ gen: k, schemaEnv: P, schema: H, errSchemaPath: j, opts: L }) {
    const R = H.$comment;
    if (L.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof L.$comment == "function") {
      const V = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: P.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${V}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: P, schemaEnv: H, validateName: j, ValidationError: L, opts: R } = k;
    H.$async ? P.if((0, s._)`${a.default.errors} === 0`, () => P.return(a.default.data), () => P.throw((0, s._)`new ${L}(${a.default.vErrors})`)) : (P.assign((0, s._)`${j}.errors`, a.default.vErrors), R.unevaluated && T(k), P.return((0, s._)`${a.default.errors} === 0`));
  }
  function T({ gen: k, evaluated: P, props: H, items: j }) {
    H instanceof s.Name && k.assign((0, s._)`${P}.props`, H), j instanceof s.Name && k.assign((0, s._)`${P}.items`, j);
  }
  function rA(k, P, H, j) {
    const { gen: L, schema: R, data: V, allErrors: eA, opts: X, self: $ } = k, { RULES: W } = $;
    if (R.$ref && (X.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(R, W))) {
      L.block(() => z(k, "$ref", W.all.$ref.definition));
      return;
    }
    X.jtd || x(k, P), L.block(() => {
      for (const AA of W.rules)
        iA(AA);
      iA(W.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (L.if((0, o.checkDataType)(AA.type, V, X.strictNumbers)), oA(k, AA), P.length === 1 && P[0] === AA.type && H && (L.else(), (0, o.reportTypeError)(k)), L.endIf()) : oA(k, AA), eA || L.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function oA(k, P) {
    const { gen: H, schema: j, opts: { useDefaults: L } } = k;
    L && (0, i.assignDefaults)(k, P.type), H.block(() => {
      for (const R of P.rules)
        (0, r.shouldUseRule)(j, R) && z(k, R.keyword, R.definition, P.type);
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
      }), u(k, P);
    }
  }
  function v(k, P) {
    P.length > 1 && !(P.length === 2 && P.includes("null")) && K(k, "use allowUnionTypes to allow union type keyword");
  }
  function G(k, P) {
    const H = k.self.RULES.all;
    for (const j in H) {
      const L = H[j];
      if (typeof L == "object" && (0, r.shouldUseRule)(k.schema, L)) {
        const { type: R } = L.definition;
        R.length && !R.some((V) => _(P, V)) && K(k, `missing type "${R.join(",")}" for keyword "${j}"`);
      }
    }
  }
  function _(k, P) {
    return k.includes(P) || P === "number" && k.includes("integer");
  }
  function N(k, P) {
    return k.includes(P) || P === "integer" && k.includes("number");
  }
  function u(k, P) {
    const H = [];
    for (const j of k.dataTypes)
      N(P, j) ? H.push(j) : P.includes("integer") && j === "number" && H.push("integer");
    k.dataTypes = H;
  }
  function K(k, P) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    P += ` at "${H}" (strictTypes)`, (0, n.checkStrictMode)(k, P, k.opts.strictTypes);
  }
  class y {
    constructor(P, H, j) {
      if ((0, Q.validateKeywordUsage)(P, H, j), this.gen = P.gen, this.allErrors = P.allErrors, this.keyword = j, this.data = P.data, this.schema = P.schema[j], this.$data = H.$data && P.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(P, this.schema, j, this.$data), this.schemaType = H.schemaType, this.parentSchema = P.schema, this.params = {}, this.it = P, this.def = H, this.$data)
        this.schemaCode = P.gen.const("vSchema", Z(this.$data, P));
      else if (this.schemaCode = this.schemaValue, !(0, Q.validSchemaType)(this.schema, H.schemaType, H.allowUndefined))
        throw new Error(`${j} value must be ${JSON.stringify(H.schemaType)}`);
      ("code" in H ? H.trackErrors : H.errors !== !1) && (this.errsCount = P.gen.const("_errs", a.default.errors));
    }
    result(P, H, j) {
      this.failResult((0, s.not)(P), H, j);
    }
    failResult(P, H, j) {
      this.gen.if(P), j ? j() : this.error(), H ? (this.gen.else(), H(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
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
    error(P, H, j) {
      if (H) {
        this.setParams(H), this._error(P, j), this.setParams({});
        return;
      }
      this._error(P, j);
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
    block$data(P, H, j = s.nil) {
      this.gen.block(() => {
        this.check$data(P, j), H();
      });
    }
    check$data(P = s.nil, H = s.nil) {
      if (!this.$data)
        return;
      const { gen: j, schemaCode: L, schemaType: R, def: V } = this;
      j.if((0, s.or)((0, s._)`${L} === undefined`, H)), P !== s.nil && j.assign(P, !0), (R.length || V.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), P !== s.nil && j.assign(P, !1)), j.else();
    }
    invalid$data() {
      const { gen: P, schemaCode: H, schemaType: j, def: L, it: R } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (j.length) {
          if (!(H instanceof s.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(j) ? j : [j];
          return (0, s._)`${(0, o.checkDataTypes)(X, H, R.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (L.validateSchema) {
          const X = P.scopeValue("validate$data", { ref: L.validateSchema });
          return (0, s._)`!${X}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(P, H) {
      const j = (0, B.getSubschema)(this.it, P);
      (0, B.extendSubschemaData)(j, this.it, P), (0, B.extendSubschemaMode)(j, P);
      const L = { ...this.it, ...j, items: void 0, props: void 0 };
      return C(L, H), L;
    }
    mergeEvaluated(P, H) {
      const { it: j, gen: L } = this;
      j.opts.unevaluated && (j.props !== !0 && P.props !== void 0 && (j.props = n.mergeEvaluated.props(L, P.props, j.props, H)), j.items !== !0 && P.items !== void 0 && (j.items = n.mergeEvaluated.items(L, P.items, j.items, H)));
    }
    mergeValidEvaluated(P, H) {
      const { it: j, gen: L } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return L.if(H, () => this.mergeEvaluated(P, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function z(k, P, H, j) {
    const L = new y(k, H, P);
    "code" in H ? H.code(L, j) : L.$data && H.validate ? (0, Q.funcKeywordCode)(L, H) : "macro" in H ? (0, Q.macroKeywordCode)(L, H) : (H.compile || H.validate) && (0, Q.funcKeywordCode)(L, H);
  }
  const b = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: P, dataNames: H, dataPathArr: j }) {
    let L, R;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!b.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      L = k, R = a.default.rootData;
    } else {
      const $ = J.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const W = +$[1];
      if (L = $[2], L === "#") {
        if (W >= P)
          throw new Error(X("property/index", W));
        return j[P - W];
      }
      if (W > P)
        throw new Error(X("data", W));
      if (R = H[P - W], !L)
        return R;
    }
    let V = R;
    const eA = L.split("/");
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
    const t = (0, o.getFullPath)(this.opts.uriResolver, g.root.baseId), { es5: C, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: C, lines: c, ownProperties: d });
    let h;
    g.$async && (h = M.scopeValue("Error", {
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
    let q;
    try {
      this._compilations.add(g), (0, Q.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const F = M.toString();
      q = `${M.scopeRefs(r.default.scope)}return ${F}`, this.opts.code.process && (q = this.opts.code.process(q, g));
      const S = new Function(`${r.default.self}`, `${r.default.scope}`, q)(this, this.scope.get());
      if (this.scope.value(p, { ref: S }), S.errors = null, S.schema = g.schema, S.schemaEnv = g, g.$async && (S.$async = !0), this.opts.code.source === !0 && (S.source = { validateName: p, validateCode: F, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: T } = O;
        S.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: T instanceof A.Name ? void 0 : T,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: T instanceof A.Name
        }, S.source && (S.source.evaluated = (0, A.stringify)(S.evaluated));
      }
      return g.validate = S, g;
    } catch (F) {
      throw delete g.validate, delete g.validateName, q && this.logger.error("Error compiling schema, function code:", q), F;
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
      const M = (C = g.localRefs) === null || C === void 0 ? void 0 : C[t], { schemaId: h } = this.opts;
      M && (d = new B({ schema: M, schemaId: h, root: g, baseId: I }));
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
      const h = f.call(this, g, M);
      return typeof h?.schema != "object" ? void 0 : D.call(this, t, h);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(I)) {
        const { schema: h } = M, { schemaId: p } = this.opts, O = h[p];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: h, schemaId: p, root: g, baseId: c });
      }
      return D.call(this, t, M);
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
  function i(D) {
    let g = 0;
    const I = { error: !1, address: "", zone: "" }, t = [], C = [];
    let c = !1, d = !1, M = !1;
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
          if (d === !0 && (M = !0), !h())
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
    return C.length && (c ? I.zone = C.join("") : M ? t.push(C.join("")) : t.push(o(C))), I.address = t.join(""), I;
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
      const M = `${d}:${C.nid || t.nid}`, h = I[M];
      t.path = void 0, h && (t = h.parse(t, C));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, C) {
    const c = C.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${C.nid || d}`, h = I[M];
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
    const M = o(t);
    if (M !== void 0 && (C.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let h = t.path;
      !C.absolutePath && (!d || !d.absolutePath) && (h = r(h)), M === void 0 && (h = h.replace(/^\/\//u, "/%2F")), c.push(h);
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
      var G, _, N, u, K, y, z, b, J, Z, k, P, H, j, L, R, V, eA, X, $, W, iA, AA, tA, sA;
      const BA = v.strict, aA = (G = v.code) === null || G === void 0 ? void 0 : G.optimize, wA = aA === !0 || aA === void 0 ? 1 : aA || 0, gA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, CA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (y = (K = v.strictSchema) !== null && K !== void 0 ? K : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (b = (z = v.strictNumbers) !== null && z !== void 0 ? z : BA) !== null && b !== void 0 ? b : !0,
        strictTypes: (Z = (J = v.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (P = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && P !== void 0 ? P : "log",
        strictRequired: (j = (H = v.strictRequired) !== null && H !== void 0 ? H : BA) !== null && j !== void 0 ? j : !1,
        code: v.code ? { ...v.code, optimize: wA, regExp: gA } : { optimize: wA, regExp: gA },
        loopRequired: (L = v.loopRequired) !== null && L !== void 0 ? L : t,
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
        this.scope = new s.ValueScope({ scope: {}, prefixes: D, es5: _, lines: N }), this.logger = U(G.logger);
        const u = G.validateFormats;
        G.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, g, G, "NOT SUPPORTED"), d.call(this, I, G, "DEPRECATED", "warn"), this._metaOpts = q.call(this), G.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), G.keywords && O.call(this, G.keywords), typeof G.meta == "object" && this.addMetaSchema(G.meta), h.call(this), G.validateFormats = u;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: G, meta: _, schemaId: N } = this.opts;
        let u = E;
        N === "id" && (u = { ...E }, u.id = u.$id, delete u.$id), _ && G && this.addMetaSchema(u, u[N], !1);
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
        const u = N(_);
        return "$async" in N || (this.errors = N.errors), u;
      }
      compile(G, _) {
        const N = this._addSchema(G, _);
        return N.validate || this._compileSchemaEnv(N);
      }
      compileAsync(G, _) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: N } = this.opts;
        return u.call(this, G, _);
        async function u(Z, k) {
          await K.call(this, Z.$schema);
          const P = this._addSchema(Z, k);
          return P.validate || y.call(this, P);
        }
        async function K(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function y(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return z.call(this, k), await b.call(this, k.missingSchema), y.call(this, Z);
          }
        }
        function z({ missingSchema: Z, missingRef: k }) {
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
      addSchema(G, _, N, u = this.opts.validateSchema) {
        if (Array.isArray(G)) {
          for (const y of G)
            this.addSchema(y, void 0, N, u);
          return this;
        }
        let K;
        if (typeof G == "object") {
          const { schemaId: y } = this.opts;
          if (K = G[y], K !== void 0 && typeof K != "string")
            throw new Error(`schema ${y} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || K), this._checkUnique(_), this.schemas[_] = this._addSchema(G, N, _, u, !0), this;
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
        const u = this.validate(N, G);
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
      getSchema(G) {
        let _;
        for (; typeof (_ = M.call(this, G)) == "string"; )
          G = _;
        if (_ === void 0) {
          const { schemaId: N } = this.opts, u = new B.SchemaEnv({ schema: {}, schemaId: N });
          if (_ = B.resolveSchema.call(this, u, G), !_)
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
            const _ = M.call(this, G);
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
        const u = {
          ..._,
          type: (0, w.getJSONTypes)(_.type),
          schemaType: (0, w.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(N, u.type.length === 0 ? (K) => T.call(this, K, u) : (K) => u.type.forEach((y) => T.call(this, K, u, y))), this;
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
          const u = N.rules.findIndex((K) => K.keyword === G);
          u >= 0 && N.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(G, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[G] = _, this;
      }
      errorsText(G = this.errors, { separator: _ = ", ", dataVar: N = "data" } = {}) {
        return !G || G.length === 0 ? "No errors" : G.map((u) => `${N}${u.instancePath} ${u.message}`).reduce((u, K) => u + _ + K);
      }
      $dataMetaSchema(G, _) {
        const N = this.RULES.all;
        G = JSON.parse(JSON.stringify(G));
        for (const u of _) {
          const K = u.split("/").slice(1);
          let y = G;
          for (const z of K)
            y = y[z];
          for (const z in N) {
            const b = N[z];
            if (typeof b != "object")
              continue;
            const { $data: J } = b.definition, Z = y[z];
            J && Z && (y[z] = QA(Z));
          }
        }
        return G;
      }
      _removeAllSchemas(G, _) {
        for (const N in G) {
          const u = G[N];
          (!_ || _.test(N)) && (typeof u == "string" ? delete G[N] : u && !u.meta && (this._cache.delete(u.schema), delete G[N]));
        }
      }
      _addSchema(G, _, N, u = this.opts.validateSchema, K = this.opts.addUsedSchema) {
        let y;
        const { schemaId: z } = this.opts;
        if (typeof G == "object")
          y = G[z];
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
        return b = new B.SchemaEnv({ schema: G, schemaId: z, meta: _, baseId: N, localRefs: J }), this._cache.set(b.schema, b), K && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = b), u && this.validateSchema(G, !0), b;
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
      for (const u in v) {
        const K = u;
        K in G && this.logger[N](`${_}: option ${u}. ${v[K]}`);
      }
    }
    function M(v) {
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
    function q() {
      const v = { ...this.opts };
      for (const G of m)
        delete v[G];
      return v;
    }
    const F = { log() {
    }, warn() {
    }, error() {
    } };
    function U(v) {
      if (v === !1)
        return F;
      if (v === void 0)
        return console;
      if (v.log && v.warn && v.error)
        return v;
      throw new Error("logger must implement log, warn and error methods");
    }
    const S = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Y(v, G) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (N) => {
        if (_.keywords[N])
          throw new Error(`Keyword ${N} is already defined`);
        if (!S.test(N))
          throw new Error(`Keyword ${N} has invalid name`);
      }), !!G && G.$data && !("code" in G || "validate" in G))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function T(v, G, _) {
      var N;
      const u = G?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: K } = this;
      let y = u ? K.post : K.rules.find(({ type: b }) => b === _);
      if (y || (y = { type: _, rules: [] }, K.rules.push(y)), K.keywords[v] = !0, !G)
        return;
      const z = {
        keyword: v,
        definition: {
          ...G,
          type: (0, w.getJSONTypes)(G.type),
          schemaType: (0, w.getJSONTypes)(G.schemaType)
        }
      };
      G.before ? rA.call(this, y, z, G.before) : y.rules.push(z), K.all[v] = z, (N = G.implements) === null || N === void 0 || N.forEach((b) => this.addKeyword(b));
    }
    function rA(v, G, _) {
      const N = v.rules.findIndex((u) => u.keyword === _);
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
      return M(C);
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
      function M(h) {
        const p = n.scopeValue("schema", g.code.source === !0 ? { ref: h, code: (0, r.stringify)(h) } : { ref: h }), O = n.name("valid"), q = w.subschema({
          schema: h,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: p,
          errSchemaPath: E
        }, O);
        w.mergeEvaluated(q), w.ok(O);
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
        f.code((0, r._)`await ${(0, e.callValidateCode)(w, n, t)}`), M(n), D || f.assign(h, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${m.ValidationError})`, () => f.throw(p)), d(p), D || f.assign(h, !1);
      }), w.ok(h);
    }
    function c() {
      w.result((0, e.callValidateCode)(w, n, t), () => M(n), () => d(n));
    }
    function d(h) {
      const p = (0, r._)`${h}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${p} : ${o.default.vErrors}.concat(${p})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(h) {
      var p;
      if (!m.opts.unevaluated)
        return;
      const O = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (m.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (m.props = Q.mergeEvaluated.props(f, O.props, m.props));
        else {
          const q = f.var("props", (0, r._)`${h}.evaluated.props`);
          m.props = Q.mergeEvaluated.props(f, q, m.props, r.Name);
        }
      if (m.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (m.items = Q.mergeEvaluated.items(f, O.items, m.items));
        else {
          const q = f.var("items", (0, r._)`${h}.evaluated.items`);
          m.items = Q.mergeEvaluated.items(f, q, m.items, r.Name);
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
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
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
        const M = s.name("item"), h = (0, A.checkDataTypes)(D, M, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(h, (0, e._)`continue`), D.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${p}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${M}]`), B.error(), s.assign(m, !1).break();
          }).code((0, e._)`${p}[${M}] = ${c}`);
        });
      }
      function C(c, d) {
        const M = (0, r.useFunc)(s, o.default), h = s.name("outer");
        s.label(h).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
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
        s.forIn("key", n, (M) => {
          !D.length && !g.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let h;
        if (D.length > 8) {
          const p = (0, o.schemaRefOrVal)(l, w.properties, "properties");
          h = (0, A.isOwnProperty)(s, p, M);
        } else D.length ? h = (0, e.or)(...D.map((p) => (0, e._)`${M} === ${p}`)) : h = e.nil;
        return g.length && (h = (0, e.or)(h, ...g.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${M})`))), (0, e.not)(h);
      }
      function C(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (m.removeAdditional === "all" || m.removeAdditional && a === !1) {
          C(M);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const h = s.name("valid");
          m.removeAdditional === "failing" ? (d(M, h, !1), s.if((0, e.not)(h), () => {
            B.reset(), C(M);
          })) : (d(M, h), f || s.if((0, e.not)(h), () => s.break()));
        }
      }
      function d(M, h, p) {
        const O = {
          keyword: "additionalProperties",
          dataProp: M,
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
        Q.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => Q.assign(C, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => Q.assign(C, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${w} && !${c}`;
        }
        function M() {
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
        const [t, C, c] = M(I);
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
        function M(p) {
          const O = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, q = Q.scopeValue("formats", { key: a, ref: p, code: O });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${q}.validate`] : ["string", p, q];
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
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function C() {
        var c;
        const d = {}, M = p(E);
        let h = !0;
        for (let F = 0; F < f.length; F++) {
          let U = f[F];
          if (U?.$ref && !(0, i.schemaHasRulesButRef)(U, l.self.RULES)) {
            const Y = U.$ref;
            if (U = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), U instanceof r.SchemaEnv && (U = U.schema), U === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const S = (c = U?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof S != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          h = h && (M || p(U)), O(S, F);
        }
        if (!h)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function p({ required: F }) {
          return Array.isArray(F) && F.includes(m);
        }
        function O(F, U) {
          if (F.const)
            q(F.const, U);
          else if (F.enum)
            for (const S of F.enum)
              q(S, U);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function q(F, U) {
          if (typeof F != "string" || F in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[F] = U;
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
    let M = !1;
    const h = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (h.onOverflow = () => {
      M = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, w, FOLD_BLOCK, h);
    if (!M)
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
  let M = " ";
  if (l || I || t) {
    if (M = I ? `
` : "", t) {
      const h = w(t);
      M += `
${indentComment(h, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const h = d[0], p = d.indexOf(`
`), O = p !== -1, q = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !q) {
      let F = !1;
      if (O && (h === "&" || h === "!")) {
        let U = d.indexOf(" ");
        h === "&" && U !== -1 && U < p && d[U + 1] === "!" && (U = d.indexOf(" ", U + 1)), (U === -1 || p < U) && (F = !0);
      }
      F || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return g += M + d, r.inFlow ? c && o && o() : C && !c ? g += lineComment(g, r.indent, w(C)) : D && i && i(), g;
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 134 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "a_fi", varId: "_fertiliser_multiplier", varName: "Fertiliser Multiplier", defaultValue: 1.0001, minValue: 0.8, maxValue: 1.2 }, { inputId: "a_af", varId: "_feed_switch", varName: "Feed Switch", defaultValue: 1, minValue: -1, maxValue: 3 }, { inputId: "a_af_1", varId: "_feed_share_of_crop_types_custom[_pulses]", varName: "Feed Share of crop types Custom[Pulses]", defaultValue: 0.014, minValue: 0, maxValue: 1 }, { inputId: "a_af_2", varId: "_feed_share_of_crop_types_custom[_grains]", varName: "Feed Share of crop types Custom[Grains]", defaultValue: 0.715, minValue: 0, maxValue: 1 }, { inputId: "a_af_3", varId: "_feed_share_of_crop_types_custom[_vegfruits]", varName: "Feed Share of crop types Custom[VegFruits]", defaultValue: 0.223, minValue: 0, maxValue: 1 }, { inputId: "a_af_4", varId: "_feed_share_of_crop_types_custom[_othercrops]", varName: "Feed Share of crop types Custom[OtherCrops]", defaultValue: 0.048, minValue: 0, maxValue: 1 }, { inputId: "a_af_5", varId: "_feed_conversion_ratio", varName: "Feed Conversion Ratio", defaultValue: 100, minValue: 90, maxValue: 110 }, { inputId: "a_sap", varId: "_yield_multiplier_switch", varName: "Yield Multiplier Switch", defaultValue: 2, minValue: -1, maxValue: 4 }, { inputId: "a_sap_1", varId: "_yield_custom[_pulses]", varName: "Yield Custom[Pulses]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_2", varId: "_yield_custom[_grains]", varName: "Yield Custom[Grains]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_3", varId: "_yield_custom[_vegfruits]", varName: "Yield Custom[VegFruits]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_4", varId: "_yield_custom[_othercrops]", varName: "Yield Custom[OtherCrops]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_3", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_4", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_5", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed_p", varId: "_fake_value_16", varName: "Fake Value 16", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed_p_1", varId: "_start_year_of_yield", varName: "Start Year of Yield", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_2", varId: "_end_year_of_yield", varName: "End Year of Yield", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_3", varId: "_start_year_of_feed_switch", varName: "Start Year of Feed Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_4", varId: "_end_year_of_feed_switch", varName: "End Year of Feed Switch", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_5", varId: "_start_year_of_fertiliser", varName: "Start Year of Fertiliser", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_6", varId: "_end_year_of_fertiliser", varName: "End Year of Fertiliser", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_26", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_27", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_28", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_29", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_30", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_31", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_32", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_33", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_34", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_35", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_36", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_37", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_38", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_39", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_40", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_41", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_42", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_46", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_47", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_48", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_49", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_50", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_52", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_53", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_54", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_55", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_56", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_57", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_58", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_59", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_62", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_63", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_64", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_65", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_pou_sigma_variation", varName: "SSP PoU Sigma Variation", defaultValue: 1, minValue: 0.8, maxValue: 1.2 }, { inputId: "ed_ext_70", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_75", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_76", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_77", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_79", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_80", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_81", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_82", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_83", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_84", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day[OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day[VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_arable_land_needed[_grains]", varName: "Arable Land Needed[Grains]" }, { varId: "_arable_land_needed[_othercrops]", varName: "Arable Land Needed[OtherCrops]" }, { varId: "_arable_land_needed[_pulses]", varName: "Arable Land Needed[Pulses]" }, { varId: "_arable_land_needed[_vegfruits]", varName: "Arable Land Needed[VegFruits]" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_by_food_category[_cropmeat]", varName: "Caloric Availability by Food Category[CropMeat]" }, { varId: "_caloric_availability_by_food_category[_dairy]", varName: "Caloric Availability by Food Category[Dairy]" }, { varId: "_caloric_availability_by_food_category[_eggs]", varName: "Caloric Availability by Food Category[Eggs]" }, { varId: "_caloric_availability_by_food_category[_grains]", varName: "Caloric Availability by Food Category[Grains]" }, { varId: "_caloric_availability_by_food_category[_othercrops]", varName: "Caloric Availability by Food Category[OtherCrops]" }, { varId: "_caloric_availability_by_food_category[_pasmeat]", varName: "Caloric Availability by Food Category[PasMeat]" }, { varId: "_caloric_availability_by_food_category[_pulses]", varName: "Caloric Availability by Food Category[Pulses]" }, { varId: "_caloric_availability_by_food_category[_vegfruits]", varName: "Caloric Availability by Food Category[VegFruits]" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_caloric_intake_per_capita_per_day_from_animal_food", varName: "Caloric Intake per Capita per Day from Animal Food" }, { varId: "_caloric_intake_per_capita_per_day_from_plant_food", varName: "Caloric Intake per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_crop_yield_for_each_category[_grains]", varName: "Crop yield for each category [Grains]" }, { varId: "_crop_yield_for_each_category[_othercrops]", varName: "Crop yield for each category [OtherCrops]" }, { varId: "_crop_yield_for_each_category[_pulses]", varName: "Crop yield for each category [Pulses]" }, { varId: "_crop_yield_for_each_category[_vegfruits]", varName: "Crop yield for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effect_of_sustainable_agricultural_productivity[_othercrops]", varName: "Effect of Sustainable Agricultural Productivity [OtherCrops]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_grains]", varName: "Effect of Sustainable Agricultural Productivity[Grains]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_pulses]", varName: "Effect of Sustainable Agricultural Productivity[Pulses]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_vegfruits]", varName: "Effect of Sustainable Agricultural Productivity[VegFruits]" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_final_feed_share[_othercrops]", varName: "Final Feed Share [OtherCrops]" }, { varId: "_final_feed_share[_grains]", varName: "Final Feed Share[Grains]" }, { varId: "_final_feed_share[_pulses]", varName: "Final Feed Share[Pulses]" }, { varId: "_final_feed_share[_vegfruits]", varName: "Final Feed Share[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_shortage_in_tonnes[_cropmeat]", varName: "Food shortage in tonnes[CropMeat]" }, { varId: "_food_shortage_in_tonnes[_dairy]", varName: "Food shortage in tonnes[Dairy]" }, { varId: "_food_shortage_in_tonnes[_eggs]", varName: "Food shortage in tonnes[Eggs]" }, { varId: "_food_shortage_in_tonnes[_grains]", varName: "Food shortage in tonnes[Grains]" }, { varId: "_food_shortage_in_tonnes[_othercrops]", varName: "Food shortage in tonnes[OtherCrops]" }, { varId: "_food_shortage_in_tonnes[_pasmeat]", varName: "Food shortage in tonnes[PasMeat]" }, { varId: "_food_shortage_in_tonnes[_pulses]", varName: "Food shortage in tonnes[Pulses]" }, { varId: "_food_shortage_in_tonnes[_vegfruits]", varName: "Food shortage in tonnes[VegFruits]" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_grassland_needed[_dairy]", varName: "Grassland Needed[Dairy]" }, { varId: "_grassland_needed[_pasmeat]", varName: "Grassland Needed[PasMeat]" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_animal_and_crop_production[_cropmeat]", varName: "Total Animal and Crop Production[CropMeat]" }, { varId: "_total_animal_and_crop_production[_dairy]", varName: "Total Animal and Crop Production[Dairy]" }, { varId: "_total_animal_and_crop_production[_eggs]", varName: "Total Animal and Crop Production[Eggs]" }, { varId: "_total_animal_and_crop_production[_grains]", varName: "Total Animal and Crop Production[Grains]" }, { varId: "_total_animal_and_crop_production[_othercrops]", varName: "Total Animal and Crop Production[OtherCrops]" }, { varId: "_total_animal_and_crop_production[_pasmeat]", varName: "Total Animal and Crop Production[PasMeat]" }, { varId: "_total_animal_and_crop_production[_pulses]", varName: "Total Animal and Crop Production[Pulses]" }, { varId: "_total_animal_and_crop_production[_vegfruits]", varName: "Total Animal and Crop Production[VegFruits]" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 489211, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(M){return w.deserialize(M,I)},serialize(M){return w.serialize(M,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(I){D=A.extendSerializer(D,I)}common.registerSerializer=Q;function B(I){return D.deserialize(I)}common.deserialize=B;function w(I){return D.serialize(I)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,I){if(!I){if(!D(w))throw Error();I=[w]}return{[A.$transferable]:!0,send:w,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,I){self.postMessage(w,I)},Q=function(w){const I=M=>{w(M.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(r=>{B.forEach(i=>i(r.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(M){if(!M)throw Error("Invariant violation: MessagePort to parent is not available.");return M}const B=function(){return!D.default().isMainThread},w=function(r,i){Q(D.default().parentPort).postMessage(r,i)},I=function(r){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const c=O=>{r(O)},k=()=>{Q(i).off("message",c)};return Q(i).on("message",c),k};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?I():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(o,P,n,f){function Z(z){return z instanceof n?z:new n(function(b){b(z)})}return new(n||(n=Promise))(function(z,b){function V(p){try{v(f.next(p))}catch(X){b(X)}}function $(p){try{v(f.throw(p))}catch(X){b(X)}}function v(p){p.done?z(p.value):Z(p.value).then(V,$)}v((f=f.apply(o,P||[])).next())})},Q=worker&&worker.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),I=requireTransferable(),E=requireMessages(),M=Q(requireImplementation());var r=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return r.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=M.default.isWorkerRuntime;let c=!1;const k=new Map,O=o=>o&&o.type===E.MasterMessageType.cancel,t=o=>o&&o.type===E.MasterMessageType.run,N=o=>B.default(o)||F(o);function F(o){return o&&typeof o=="object"&&typeof o.subscribe=="function"}function m(o){return I.isTransferDescriptor(o)?{payload:o.send,transferables:o.transferables}:{payload:o,transferables:void 0}}function q(){const o={type:E.WorkerMessageType.init,exposed:{type:"function"}};M.default.postMessageToMaster(o)}function y(o){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:o}};M.default.postMessageToMaster(P)}function a(o,P){const{payload:n,transferables:f}=m(P),Z={type:E.WorkerMessageType.error,uid:o,error:w.serialize(n)};M.default.postMessageToMaster(Z,f)}function H(o,P,n){const{payload:f,transferables:Z}=m(n),z={type:E.WorkerMessageType.result,uid:o,complete:P?!0:void 0,payload:f};M.default.postMessageToMaster(z,Z)}function R(o,P){const n={type:E.WorkerMessageType.running,uid:o,resultType:P};M.default.postMessageToMaster(n)}function h(o){try{const P={type:E.WorkerMessageType.uncaughtError,error:w.serialize(o)};M.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,o)}}function U(o,P,n){return D(this,void 0,void 0,function*(){let f;try{f=P(...n)}catch(z){return a(o,z)}const Z=N(f)?"observable":"promise";if(R(o,Z),N(f)){const z=f.subscribe(b=>H(o,!1,w.serialize(b)),b=>{a(o,w.serialize(b)),k.delete(o)},()=>{H(o,!0),k.delete(o)});k.set(o,z)}else try{const z=yield f;H(o,!0,w.serialize(z))}catch(z){a(o,w.serialize(z))}})}function x(o){if(!M.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(c)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(c=!0,typeof o=="function")M.default.subscribeToMasterMessages(P=>{t(P)&&!P.method&&U(P.uid,o,P.args.map(w.deserialize))}),q();else if(typeof o=="object"&&o){M.default.subscribeToMasterMessages(n=>{t(n)&&n.method&&U(n.uid,o[n.method],n.args.map(w.deserialize))});const P=Object.keys(o).filter(n=>typeof o[n]=="function");y(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${o}`);M.default.subscribeToMasterMessages(P=>{if(O(P)){const n=P.uid,f=k.get(n);f&&(f.unsubscribe(),k.delete(n))}})}A.expose=x,typeof self<"u"&&typeof self.addEventListener=="function"&&M.default.isWorkerRuntime()&&(self.addEventListener("error",o=>{setTimeout(()=>h(o.error||o),250)}),self.addEventListener("unhandledrejection",o=>{const P=o.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&M.default.isWorkerRuntime()&&(process.on("uncaughtException",o=>{setTimeout(()=>h(o),250)}),process.on("unhandledRejection",o=>{o&&typeof o.message=="string"&&setTimeout(()=>h(o),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,I=w?.length||0;D[Q++]=I;for(let E=0;E<I;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const M=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=M,B+=2,w+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const I of A){const E=I.varRef.varSpec;D[B++]=E.varIndex;const M=E.subscriptIndices,r=M?.length||0;D[B++]=r;for(let i=0;i<r;i++)D[B++]=M[i];I.points!==void 0?(D[B++]=w,D[B++]=I.points.length,Q?.set(I.points,w),w+=I.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let I=0;I<w;I++){const E=A[B++],M=A[B++],r=M>0?Array(M):void 0;for(let t=0;t<M;t++)r[t]=A[B++];const i=A[B++],c=A[B++],k={varIndex:E,subscriptIndices:r};let O;i>=0?D?O=D.slice(i,i+c):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:k},points:O})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let I;const E=D.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let M,r;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const U of Q.lookups)resolveVarRef(this.listing,U.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);M=h.lookupsLength,r=h.lookupIndicesLength}else M=0,r=0;let i=0;function c(h,U){const x=i,o=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(U*o),n=Math.ceil(P/8)*8;return i+=n,x}const k=c("int32",headerLengthInElements),O=c("float64",extrasLengthInElements),t=c("float64",B),N=c("float64",w),F=c("int32",I),m=c("float64",M),q=c("int32",r),y=i;if(this.encoded===void 0||this.encoded.byteLength<y){const h=Math.ceil(y*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,k,headerLengthInElements)}const a=this.header.view;let H=0;a[H++]=O,a[H++]=extrasLengthInElements,a[H++]=t,a[H++]=B,a[H++]=N,a[H++]=w,a[H++]=F,a[H++]=I,a[H++]=m,a[H++]=M,a[H++]=q,a[H++]=r,this.inputs.update(this.encoded,t,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,N,w),this.outputIndices.update(this.encoded,F,I),this.lookups.update(this.encoded,m,M),this.lookupIndices.update(this.encoded,q,r);const R=this.inputs.view;for(let h=0;h<A.length;h++){const U=A[h];typeof U=="number"?R[h]=U:R[h]=U.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),r>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const I=B[w++],E=B[w++],M=B[w++],r=B[w++],i=B[w++],c=B[w++],k=B[w++],O=B[w++],t=B[w++],N=B[w++],F=B[w++],m=B[w++],q=E*Float64Array.BYTES_PER_ELEMENT,y=r*Float64Array.BYTES_PER_ELEMENT,a=c*Float64Array.BYTES_PER_ELEMENT,H=O*Int32Array.BYTES_PER_ELEMENT,R=N*Float64Array.BYTES_PER_ELEMENT,h=m*Int32Array.BYTES_PER_ELEMENT,U=D+q+y+a+H+R+h;if(A.byteLength<U)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,M,r),this.outputs.update(this.encoded,i,c),this.outputIndices.update(this.encoded,k,O),this.lookups.update(this.encoded,t,N),this.lookupIndices.update(this.encoded,F,m)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,I=!D;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let M=E;M<w;M+=2){const r=B[M];if(r>=A){if(I&&(this.lastInput=A,this.lastHitIndex=M),M===0||r===A)return B[M+1];switch(Q){default:case"interpolate":{const i=B[M-2],c=B[M-1],k=B[M+1],O=r-i,t=k-c;return c+t/O*(A-i)}case"forward":return B[M+1];case"backward":return B[M-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const I=Q[w];if(I>=A){const E=Q[w-2],M=Q[w-1],r=Q[w+1],i=I-E,c=r-M;return M+c/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,I,E){const M=Math.floor((E-B)/I);for(let r=0;r<=M;r++)if(A.currentTime<=E&&pulse(A,B+r*I,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,I){return A.currentTime>w?A.currentTime<I||w>I?B*(A.currentTime-w):B*(I-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,I){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let M=D.get(w);M===void 0&&(M=Array(w),D.set(w,M));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const r=I>0?1:-1;E.sort((i,c)=>{let k;return i.x<c.x?k=-1:i.x>c.x?k=1:k=0,k*r});for(let i=0;i<w;i++)M[i]=E[i].ind;return M},XIDZ(B,w,I){return Math.abs(w)<EPSILON?I:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,r=>(this.inputs=new Float64Array(r),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,r=>(this.outputIndices=new Int32Array(r),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const I=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const M=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(M)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(M,r,i)=>{runJsModel(A,Q,B,w,I,E,M,r,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,I,E,M,r,i,c){let k=D;A.setTime(k);const O={timeStep:B,currentTime:k};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const y of i)A.setLookup(y.varRef.varSpec,y.points);E?.length>0&&A.setInputs(y=>E[y]),A.initLevels();const t=Math.round((Q-D)/B),N=Q;let F=0,m=0,q=0;for(;F<=t;){if(A.evalAux(),k%w<1e-6){q=0;const y=a=>{const H=q*I+m;M[H]=k<=N?a:void 0,q++};if(r!==void 0){let a=0;const H=r[a++];for(let R=0;R<H;R++){const h=r[a++],U=r[a++];let x;U>0&&(x=r.subarray(a,a+U),a+=U);const o={varIndex:h,subscriptIndices:x};A.storeOutput(o,y)}}else A.storeOutputs(y);m++}if(F===t)break;A.evalLevels(),k+=B,A.setTime(k),O.currentTime=k,F++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),I=w/4,E=A.HEAP32.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),I=w/8,E=A.HEAPF64.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,I,E,M;const r=A.getLookups();if(r!==void 0)for(const t of r){const N=t.varRef.varSpec,F=((D=N.subscriptIndices)==null?void 0:D.length)||0;let m;F>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<F)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,F)),this.lookupSubIndicesBuffer.getArrayView().set(N.subscriptIndices),m=this.lookupSubIndicesBuffer.getAddress()):m=0;let q,y;if(t.points){const H=t.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<H)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,H)),this.lookupDataBuffer.getArrayView().set(t.points),q=this.lookupDataBuffer.getAddress(),y=H/2}else q=0,y=0;const a=N.varIndex;this.wasmSetLookup(a,m,q,y)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),t=>{var N;return(N=this.inputsBuffer)==null||N.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,t),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),t=>{var N;return(N=this.outputIndicesBuffer)==null||N.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,t),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const c=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<c)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,c));const k=perfNow();this.wasmRunModel(((M=this.inputsBuffer)==null?void 0:M.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(k);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(C,g){B=C,w=g}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_arable_land_needed[_grains]","_arable_land_needed[_othercrops]","_arable_land_needed[_pulses]","_arable_land_needed[_vegfruits]","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_by_food_category[_cropmeat]","_caloric_availability_by_food_category[_dairy]","_caloric_availability_by_food_category[_eggs]","_caloric_availability_by_food_category[_grains]","_caloric_availability_by_food_category[_othercrops]","_caloric_availability_by_food_category[_pasmeat]","_caloric_availability_by_food_category[_pulses]","_caloric_availability_by_food_category[_vegfruits]","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_caloric_intake_per_capita_per_day_from_animal_food","_caloric_intake_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_crop_yield_for_each_category[_grains]","_crop_yield_for_each_category[_othercrops]","_crop_yield_for_each_category[_pulses]","_crop_yield_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effect_of_sustainable_agricultural_productivity[_othercrops]","_effect_of_sustainable_agricultural_productivity[_grains]","_effect_of_sustainable_agricultural_productivity[_pulses]","_effect_of_sustainable_agricultural_productivity[_vegfruits]","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_final_feed_share[_othercrops]","_final_feed_share[_grains]","_final_feed_share[_pulses]","_final_feed_share[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_shortage_in_tonnes[_cropmeat]","_food_shortage_in_tonnes[_dairy]","_food_shortage_in_tonnes[_eggs]","_food_shortage_in_tonnes[_grains]","_food_shortage_in_tonnes[_othercrops]","_food_shortage_in_tonnes[_pasmeat]","_food_shortage_in_tonnes[_pulses]","_food_shortage_in_tonnes[_vegfruits]","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_grassland_needed[_dairy]","_grassland_needed[_pasmeat]","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_animal_and_crop_production[_cropmeat]","_total_animal_and_crop_production[_dairy]","_total_animal_and_crop_production[_eggs]","_total_animal_and_crop_production[_grains]","_total_animal_and_crop_production[_othercrops]","_total_animal_and_crop_production[_pasmeat]","_total_animal_and_crop_production[_pulses]","_total_animal_and_crop_production[_vegfruits]","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var M=typeof window=="object",r=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function c(C){return Q.locateFile?Q.locateFile(C,i):i+C}var k,O;(M||r)&&(r?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",r&&(O=function(C){try{var g=new XMLHttpRequest;return g.open("GET",C,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}catch(e){var s=DA(C);if(s)return s;throw e}}),k=function(C,g,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){g(e.response);return}var u=DA(C);if(u){g(u.buffer);return}s()},e.onerror=s,e.send(null)});var t=Q.print||console.log.bind(console),N=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var F;Q.wasmBinary&&(F=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&_("no native wasm support detected");var m,q=!1;function y(C,g){C||_("Assertion failed: "+g)}function a(C){var g=Q["_"+C];return y(g,"Cannot call unknown function "+C+", make sure it is exported"),g}function H(C,g,s,e,u){var j={string:function(Y){var T=0;if(Y!=null&&Y!==0){var eA=(Y.length<<2)+1;T=CA(eA),P(Y,T,eA)}return T},array:function(Y){var T=CA(Y.length);return n(Y,T),T}};function G(Y){return g==="string"?x(Y):g==="boolean"?!!Y:Y}var K=a(C),L=[],S=0;if(e)for(var J=0;J<e.length;J++){var KA=j[s[J]];KA?(S===0&&(S=sA()),L[J]=KA(e[J])):L[J]=e[J]}var IA=K.apply(null,L);function UA(Y){return S!==0&&rA(S),G(Y)}return IA=UA(IA),IA}function R(C,g,s,e){s=s||[];var u=s.every(function(G){return G==="number"}),j=g!=="string";return j&&u&&!e?a(C):function(){return H(C,g,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function U(C,g,s){for(var e=g+s,u=g;C[u]&&!(u>=e);)++u;if(u-g>16&&C.subarray&&h)return h.decode(C.subarray(g,u));for(var j="";g<u;){var G=C[g++];if(!(G&128)){j+=String.fromCharCode(G);continue}var K=C[g++]&63;if((G&224)==192){j+=String.fromCharCode((G&31)<<6|K);continue}var L=C[g++]&63;if((G&240)==224?G=(G&15)<<12|K<<6|L:G=(G&7)<<18|K<<12|L<<6|C[g++]&63,G<65536)j+=String.fromCharCode(G);else{var S=G-65536;j+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return j}function x(C,g){return C?U(Z,C,g):""}function o(C,g,s,e){if(!(e>0))return 0;for(var u=s,j=s+e-1,G=0;G<C.length;++G){var K=C.charCodeAt(G);if(K>=55296&&K<=57343){var L=C.charCodeAt(++G);K=65536+((K&1023)<<10)|L&1023}if(K<=127){if(s>=j)break;g[s++]=K}else if(K<=2047){if(s+1>=j)break;g[s++]=192|K>>6,g[s++]=128|K&63}else if(K<=65535){if(s+2>=j)break;g[s++]=224|K>>12,g[s++]=128|K>>6&63,g[s++]=128|K&63}else{if(s+3>=j)break;g[s++]=240|K>>18,g[s++]=128|K>>12&63,g[s++]=128|K>>6&63,g[s++]=128|K&63}}return g[s]=0,s-u}function P(C,g,s){return o(C,Z,g,s)}function n(C,g){f.set(C,g)}var f,Z,z;function b(C){Q.HEAP8=f=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=z=new Int32Array(C),Q.HEAPU8=Z=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var V,$=[],v=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());wA($)}function GA(){wA(v)}function kA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)aA(Q.postRun.shift());wA(p)}function PA(C){$.unshift(C)}function cA(C){v.unshift(C)}function aA(C){p.unshift(C)}var l=0,W=null;function HA(C){l++,Q.monitorRunDependencies&&Q.monitorRunDependencies(l)}function tA(C){if(l--,Q.monitorRunDependencies&&Q.monitorRunDependencies(l),l==0&&W){var g=W;W=null,g()}}Q.preloadedImages={},Q.preloadedAudios={};function _(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",N(C),q=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var g=new WebAssembly.RuntimeError(C);throw w(g),g}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function MA(C){return C.startsWith("file://")}var d;d="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBsLLOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKm9EPOsEFAgt/AXwjAEEQayIGJAACQEHIpw4oAgAiAgRAIAJB0KcOKAIAIgFB1KcOKAIAbEEDdGpB2KcOKAIAQQN0aiAAOQMAQdCnDiABQQFqNgIADAELQcCnDigCACIBRQRAAn9BoP0FKwMAQfi5BisDAKFB4LoHKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQcCnDkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQcSnDigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEHEpw5BxKcOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAF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AKI5AwBB6JcOQeiCCCsDAEH45gwrAwCiOQMAQeCXDkHggggrAwBB8OYMKwMAojkDAEGwlg5BsIEIKwMAQcDlDCsDAKI5AwBB2JcOQdiCCCsDAEHo5gwrAwCiOQMAQaiWDkGogQgrAwBBuOUMKwMAojkDAEHQlw5B0IIIKwMAQeDmDCsDAKI5AwBBoJYOQaCBCCsDAEGw5QwrAwCiOQMAQciXDkHIgggrAwBB2OYMKwMAojkDAEGYlg5BmIEIKwMAQajlDCsDAKI5AwBBwJcOQcCCCCsDAEHQ5gwrAwCiOQMAQZCWDkGQgQgrAwBBoOUMKwMAojkDAEG4lw5BuIIIKwMAQcjmDCsDAKI5AwBBiJYOQYiBCCsDAEGY5QwrAwCiOQMAQbCXDkGwgggrAwBBwOYMKwMAojkDAEGAlg5BgIEIKwMAQZDlDCsDAKI5AwBBqJcOQaiCCCsDAEG45gwrAwCiOQMAQfiVDkH4gAgrAwBBiOUMKwMAojkDAEGglw5BoIIIKwMAQbDmDCsDAKI5AwBB0JkOQbCHCCsDAEGQ5gwrAwCiOQMAQfiaDkHYiAgrAwBBuOcMKwMAojkDAEHImQ5BqIcIKwMAQYjmDCsDAKI5AwBB8JoOQdCICCsDAEGw5wwrAwCiOQMAQcCZDkGghwgrAwBBgOYMKwMAojkDAEHomg5ByIgIKwMAQajnDCsDAKI5AwBBuJkOQZiHCCsDAEH45QwrAwCiOQMAQeCaDkHAiAgrAwBBoOcMKwMAojkDAEGwmQ5BkIcIKwMAQfDlDCsDAKI5AwBB2JoOQbiICCsDAEGY5wwrAwCiOQMAQaiZDkGIhwgrAwBB6OUMKwMAojkDAEHQmg5BsIgIKwMAQZDnDCsDAKI5AwBBoJkOQYCHCCsDAEHg5QwrAwCiOQMAQciaDkGoiAgrAwBBiOcMKwMAojkDAEGYmQ5B+IYIKwMAQdjlDCsDAKI5AwBBwJoOQaCICCsDAEGA5wwrAwCiOQMAQZCZDkHwhggrAwBB0OUMKwMAojkDAEG4mg5BmIgIKwMAQfjmDCsDAKI5AwBBiJkOQeiGCCsDAEHI5QwrAwCiOQMAQbCaDkGQiAgrAwBB8OYMKwMAojkDAEGAmQ5B4IYIKwMAQcDlDCsDAKI5AwBBqJoOQYiICCsDAEHo5gwrAwCiOQMAQfiYDkHYhggrAwBBuOUM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gP7gwAA3AwBBoOoFQoCAgICAgOXowAA3AwBBqOoFQpqz5syZs+b0PzcDAEGw6gVCgICAgICA7s/AADcDAEG46gVCgICAgOCW0KnBADcDAEHA6gVCzZmz5syZ857AADcDAEHI6gVC5syZs+bMiM3AADcDAEHQ6gVCADcDAEHw6gVC+6i4vdTDjKDBADcDAEHg6gVCzZmz5syDnafBADcDAEHo6gVC5syZs+a8iaPBADcDAEH46gVCnbSR2/P704bAADcDAEGA6wVC0vD6qLi9lPI/NwMAQYjrBUKz5syZs+bM8T83AwBBuOsFQo7ayO35/emEwAA3AwBBsOsFQvDPmt70puKFwAA3AwBBqOsFQuH10fD6qLj7PzcDAEGg6wVCs+bMmbPmzPE/NwMAQZjrBUKjtuf3p42v/D83AwBBkOsFQrPmzJmz5sz5PzcDAEHI6wVCmrPmzJmz5vQ/NwMAQcDrBUK25/enja+67z83AwBB0OsFQoCAgICAgID6PzcDAEHY6wVCs+bMmbPmzO0/NwMAQeDrBUKAgICAgICa0MAANwMAQejrBUKAgICAgICAisAANwMAQfDrBUKAgICAgICAisAANwMAQfjrBUKAgICAgIDkz8AANwMAQYDsBUKAgICAgICAiMAANwMAQYjsBUK8+sqymcSDgcAANwMAQZDsBUK8+sqymcSDgcAANwMAQZjsBUKAgICAgICAgMAANwMAQaDsBUKKuOvd+dSO9D83AwBBqOwFQoq469351I70PzcDAEGw7AVCueiituf3p8U/NwMAQbjsBULpjIvNzp25+z83AwBBwOwFQumMi83Onbn7PzcDAEHI7AVCgICAgICAgIDAADcDAEHQ7AVCgICAgICAgITAADcDAEHY7AVCueiituf3p8U/NwMAQeDsBUIANwMAQejsBUKAgICAgICAksAANwMAQfDsBUKAgICAgIDAlMAANwMAQfjsBUKAgICAgICAmsAANwMAQYDtBUKq1arVqtWqoMAANwMAQYjtBUKAgICAgICAhMAANwMAQZDtBULK9o38wsnBj8AANwMAQZjtBULK9o38wsnBj8AANwMAQaDtBUKvq8LupeL58j83AwBBqO0FQq+rwu6l4vnyPzcDAEG47QVCgICAgICAgIzAADcDAEGw7QVCmrPmzJmz5uQ/NwMAQcDtBUL6/anjy+6k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7vY/NwMAQYC7BkLu+f2p48vu9j83AwBB+LoGQu75/anjy+72PzcDAEGgvQZCgICAgICAgIDAADcDAEGovQZCADcDAEGwvQZCiIedqZaA/80+NwMAQbi9BkKAgIDM9/30wsIANwMAQcC9BkKAgICAgIDgsMAANwMAQci9BkKas+bMmbPm3D83AwBB0L0GQoCAgIDA8PXDwQA3AwBB2L0GQoCAgICAgICEwAA3AwBB4L0GQrPmzJmz5sz5PzcDAEHIvAZC1MaX3cmYiPI/NwMAQcC8BkLUxpfdyZiI8j83AwBB6L0GQoCAgICAgICOwAA3AwBB8L0GQri9lNyeiq7HPzcDAEH4vQZCzZmz5syZs+4/NwMAQYC+BkIANwMAQYi+BkKAgIDgrJDnlMIANwMAQZC+BkKAgICAgICewMAANwMAQZi+BkKAgICAgJChj8EANwMAQeC/BkKAgICA4YXQycEANwMAQdi/BkKAgICA1ZPrysEANwMAQdC/BkKAgICAmuSZzMEANwMAQci/BkKAgICAmPSAzsEANwMAQYC/BkKAgICA0KCiscEANwMAQfi+BkKAgICAoKKHtsEANwMAQfC+BkKAgICA/I3bucEANwMAQei+BkKAgICAnObxvMEANwMAQeC+BkKAgICAwOGfwMEANwMAQdi+BkKAgICA4JOcwsEANwMAQdC+BkKAgICAkvqmxMEANwMAQci+BkKAgICAmtm4xsEANwMAQcC+BkKAgICAh4G9yMEANwMAQbi+BkKAgICAgcndycEANwMAQbC+BkKAgICA8bD6ysEANwMAQai+BkKAgICAwveqzMEANwMAQaC+BkKAgICA3MuUzsEANwMAQejABkKAgICAgICsyMAANwMAQeDABkKAgICAgKCg2sAANwMAQdjABkKAgICAgMCi68AANwMAQdDABkKAgICAgL60+sAANwMAQcjABkKAgICAgPHOicEANwMAQcDABkKAgICA4IrOlcEANwMAQbjABkKAgICAsJjqoMEANwMAQbDABkKAgICAmIvaqcEANwMAQajABkKAgICA3K+VscEANwMAQaDABkKAgICAoN7ztcEANwMAQZjABkKAgICA7M3NucEANwMAQZDABkKAgICAoPHfvMEANwMAQYjABkKAgICA9qWUwMEANwMAQYDABkKAgICAsvmNwsEANwMAQfi/BkKAgICAiu2VxMEANwMAQfC/BkKAgICApM+kxsEANwMAQei/BkKAgICA7ZyxyMEANwMAQcC/BkKAgICAgIC3yMAANwMAQbi/BkKAgICAgOCu2sAANwMAQbC/BkKAgICAgKiy68AANwMAQai/BkKAgICAgI7D+sAANwMAQaC/BkKAgICAgLPcicEANwMAQZi/BkKAgICA4JrhlcEANwMAQZC/BkKAgICAwMz2oMEANwMAQYi/BkKAgICAwNznqcEANwMAQbjDBkLNmbPmzJmqt8AANwMAQbDDBkLh9dHw+ui1ycAANwMAQajDBkKAgICAgNis2sAANwMAQaDDBkKAgICAgNzH6cAANwMAQZjDBkLmzJmz5rTq+MAANwMAQZDDBkKAgICAgPC/hMEANwMAQYjDBkKAgICAoPeNkMEANwMAQYDDBkKAgICA4Nj0mMEANwMAQfjCBkKAgICAoMu1oMEANwMAQfDCBkKAgICAgLripMEANwMAQejCBkKAgICA8J3pqMEANwMAQeDCBkKAgICA2NXaq8EANwMAQdjCBkKAgICAyIz+rsEANwMAQdDCBkKAgICAlKmkscEANwMAQcjCBkKAgICAyNaWs8EANwMAQcDCBkKAgICAoKyPtcEANwMAQbjCBkKAgICAmJ2zt8EANwMAQbDCBkKAgICAkLzruMEANwMAQajCBkKAgICA3PX5ucEANwMAQZDBBkKAgICAjJ+Wu8EANwMAQYjBBkKAgICAwPLpvMEANwMAQYDBBkKAgICAjM24vsEANwMAQZDCBkKKro+F14eRu8AANwMAQYjCBkL20fD6qLjUzcAANwMAQYDCBkKk4fXR8LqC38AANwMAQfjBBkLmzJmz5uDv7cAANwMAQfDBBkKAgICAgKzo/MAANwMAQejBBkKAgICAwOaIicEANwMAQeDBBkKAgICAoJTik8EANwMAQdjBBkKAgICAgKP3nMEANwMAQdDBBkKAgICAsNqbpMEANwMAQcjBBkKAgICA4PGhqcEANwMAQcDBBkKAgICA8NLmrMEANwMAQbjBBkKAgICAuK+/sMEANwMAQbDBBkKAgICA+NfvssEANwMAQajBBkKAgICA8LG8tcEANwMAQaDBBkKAgICAxIWOuMEANwMAQZjBBkKAgICApLvCucEANwMAQejFBkKAgICAgO+v+cAANwMAQeDFBkKAgICAgJiihcEANwMAQdjFBkKAgICAoNvNkMEANwMAQdDFBkKAgICAoOW6mcEANwMAQcjFBkKAgICA8Ob3oMEANwMAQcDFBkKAgICAgPHGpcEANwMAQbjFBkKAgICA4M+uqcEANwMAQbDFBkKAgICAmOG2rMEANwMAQajFBkKAgICAkPvzr8EANwMAQaDFBkKAgICAyKvtscEANwMAQZjFBkKAgICA2Mvus8EANwMAQZDFBkKAgICA0MX2tcEANwMAQYjFBkKAgICA+JaWuMEANwMAQYDFBkKAgICArP+wucEANwMAQeDEBkLh9dHw+ui1ucAANwMAQdjEBkLmzJmz5qzNy8AANwMAQdDEBkKKro+F16fg3MAANwMAQcjEBkKAgICAgPDj68AANwMAQcDEBkKAgICAgPbw+sAANwMAQbjEBkKAgICAgLWzh8EANwMAQbDEBkKAgICA4Pv+kcEANwMAQajEBkKAgICAoMz9msEANwMAQaDEBkKAgICAwOqvosEANwMAQZjEBkKAgICA4IHep8EANwMAQZDEBkKAgICAuLzvqsEANwMAQYjEBkKAgICAwNm2rsEANwMAQYDEBkKAgICA+OGdscEANwMAQfjDBkKAgICAkKS4s8EANwMAQfDDBkKAgICA2PbitcEANwMAQejDBkKAgICAwNWKuMEANwMAQeDDBkKAgICAoMC+ucEANwMAQdjDBkKAgICA+JzyusEANwMAQYjGBkLk9vz+1LGRuMAANwMAQYDGBkKKro+F1+f/ycAANwMAQfjFBkKF18fC65v+2sAANwMAQfDFBkLmzJmz5vSS6sAANwMAQZDIBkKAgICAgPTrksEANwMAQYjIBkKAgICAgOb9lsEANwMAQYDIBkKAgICA4M34mcEANwMAQfjHBkKAgICAwOLcnMEANwMAQfDHBkKAgICAwJLin8EANwMAQejHBkKAgICAsPC+ocEANwMAQeDHBkKAgICA8IOSo8EANwMAQdjHBkKAgICAwPGJpcEANwMAQbDHBkLoorbn96eJp8AANwMAQajHBkKvupOxkLClucAANwMAQaDHBkLmzJmz5uyZysAANwMAQZjHBkLmzJmz5pS22cAANwMAQZDHBkLNmbPmzK3a6MAANwMAQYjHBkKz5syZs46p9MAANwMAQYDHBkKAgICAgKz+/8AANwMAQfjGBkKAgICAgL3kiMEANwMAQfDGBkKAgICAoKKmkMEANwMAQejGBkKAgICAoJvLlMEANwMAQeDGBkKAgICAoJbZmMEANwMAQdjGBkKAgICAwK7Fm8EANwMAQdDGBkKAgICAgOninsEANwMAQcjGBkKAgICAwLaTocEANwMAQcDGBkKAgICA4KuCo8EANwMAQbjGBkKAgICAgLz3pMEANwMAQbDGBkKAgICAgJqXp8EANwMAQdjIBkK3koaC1pyCpcAANwMAQdDIBkLvpIyErPmAuMAANwMAQcjIBkL7qLi9lPzkyMAANwMAQcDIBkKpuL2U3P6O2MAANwMAQbjIBkLmzJmz5tz/5sAANwMAQbDIBkLNmbPmzMfO8sAANwMAQajIBkKAgICAgN7i/cAANwMAQaDIBkKAgICAgKKRh8EANwMAQZjIBkKAgICAgIumjsEANwMAQeDIBkL7qLi9lNyewj83AwBBgMkGQoCAgIDw6923wQA3AwBB+MgGQoCAgICo8NG6wQA3AwBB8MgGQoCAgICYtZu8wQA3AwBBmMoGQoCAgICAgID4PzcDAEGQygZCgICAgICAgLHAADcDAEGIygZCgICAgICAiMPAADcDAEGAygZCgICAgIDAldTAADcDAEH4yQZCgICAgIDAnuPAADcDAEHwyQZCgICAgIDssPLAADcDAEHoyQZCgICAgIDc2P7AADcDAEHgyQZCgICAgMCQxInBADcDAEHYyQZCgICAgID3vJLBADcDAEHQyQZCgICAgODf8pnBADcDAEHIyQZCgICAgOCtgZ/BADcDAEHAyQZCgICAgLC6r6LBADcDAEG4yQZCgICAgJDf4aXBADcDAEGwyQZCgICAgPCy56jBADcDAEGoyQZCgICAgND19KrBADcDAEGgyQZCgICAgJDpka3BADcDAEGYyQZCgICAgNiRtq/BADcDAEGQyQZCgICAgNjQhrHBADcDAEGIyQZCgICAgIjjr7PBADcDAEHwygZCgICAgICRkJDBADcDAEHoygZCgICAgKCfnZPBADcDAEHgygZCgICAgMC585bBADcDAEHYygZCgICAgMDSxJnBADcDAEHQygZCgICAgOC56JvBADcDAEHIygZCgICAgMD1nJ7BADcDAEHAygZCgICAgLDarKDBADcDAEG4ygZCgICAgIC65qHBADcDAEGwygZCgICAgPCLoKPBADcDAEGoygZCgICAgJCy1aTBADcDAEGgygZCgICAgICAgPg/NwMAQcDLBkKAgICAgICA+D83AwBB4MwGQoCAgICAgKCiwAA3AwBB2MwGQoCAgICAgOC0wAA3AwBB0MwGQoCAgICAgP7FwAA3AwBByMwGQoCAgICAgPXUwAA3AwBBwMwGQoCAgICAkPfjwAA3AwBBuMwGQoCAgICA2LjwwAA3AwBBsMwGQoCAgICAnPr6wAA3AwBBqMwGQoCAgICAhoWEwQA3AwBBoMwGQoCAgICA5a+LwQA3AwBBmMwGQoCAgICAhtCQwQA3AwBBkMwGQoCAgIDgx/WTwQA3AwBBiMwGQoCAgICA0+iXwQA3AwBBgMwGQoCAgIDA0o+awQA3AwBB+MsGQoCAgICAssWcwQA3AwBB8MsGQoCAgICA6IyfwQA3AwBB6MsGQoCAgICAsO6gwQA3AwBB4MsGQoCAgIDwxLOiwQA3AwBB2MsGQoCAgIDgyvijwQA3AwBB0MsGQoCAgICAgID4PzcDAEHIywZCgICAgICAgPg/NwMAQbjLBkKAgICAgIDgocAANwMAQbDLBkKAgICAgICAtMAANwMAQajLBkKAgICAgICWxcAANwMAQaDLBkKAgICAgMCV1MAANwMAQZjLBkKAgICAgOCe48AANwMAQZDLBkKAgICAgKD078AANwMAQYjLBkKAgICAgIap+sAANwMAQYDLBkKAgICAgOqrg8EANwMAQfjKBkKAgICAwMHbisEANwMAQejMBkKAgICAgICA+D83AwBBiM4GQoCAgICAgICQwAA3AwBBgM4GQoCAgICAgKCiwAA3AwBB+M0GQoCAgICAgJizwAA3AwBB8M0GQoCAgICAgKrCwAA3AwBB6M0GQoCAgICAwMXRwAA3AwBB4M0GQoCAgICAgMHdwAA3AwBB2M0GQoCAgICA4OHowAA3AwBB0M0GQoCAgICA7NDxwAA3AwBByM0GQoCAgICA0Iz5wAA3AwBBwM0GQoCAgICAvOb9wAA3AwBBuM0GQoCAgICAucSBwQA3AwBBsM0GQoCAgICA3dOEwQA3AwBBqM0GQoCAgICAwoyIwQA3AwBBoM0GQoCAgIDAp4SKwQA3AwBBmM0GQoCAgIDAn4qMwQA3AwBBkM0GQoCAgICAgJeOwQA3AwBBiM0GQoCAgIDAnamQwQA3AwBBgM0GQoCAgICAgID4PzcDAEH4zAZCgICAgICAgPg/NwMAQfDMBkKAgICAgICA+D83AwBB0M4GQoCAgICgseamwQA3AwBByM4GQoCAgICA0ZWpwQA3AwBBwM4GQoCAgIDg/4SrwQA3AwBBuM4GQoCAgICwy/qswQA3AwBBsM4GQoCAgIDg7pqvwQA3AwBBqM4GQoCAgIDQs++xwQA3AwBBoM4GQoCAgIDQxcG2wQA3AwBBmM4GQoCAgICw6uC6wQA3AwBBkM4GQoCAgICIyqy8wQA3AwBBuM8GQoCAgICAgID4PzcDAEGwzwZCgICAgICAkK/AADcDAEGozwZCgICAgICApsHAADcDAEGgzwZCgICAgIDAnNLAADcDAEGYzwZCgICAgIDQuOHAADcDAEGQzwZCgICAgIC43PDAADcDAEGIzwZCgICAgICMrPzAADcDAEGAzwZCgICAgICNgYjBADcDAEH4zgZCgICAgIDM5pDBADcDAEHwzgZCgICAgKCiqJjBADcDAEHozgZCgICAgOCfzpzBADcDAEHgzgZCgICAgICj26DBADcDAEHYzgZCgICAgOCSyKPBADcDAEHA0AZCgICAgICA6tjAADcDAEG40AZCgICAgIDwk+jAADcDAEGw0AZCgICAgIC0xfPAADcDAEGo0AZCgICAgID+/P7AADcDAEGg0AZCgICAgMCxnYjBADcDAEGY0AZCgICAgMCcxo/BADcDAEGQ0AZCgICAgICt5ZPBADcDAEGI0AZCgICAgODmkpjBADcDAEGA0AZCgICAgMD755rBADcDAEH4zwZCgICAgICl653BADcDAEHwzwZCgICAgJCvyaDBADcDAEHozwZCgICAgKCXqaLBADcDAEHgzwZCgICAgODnjqTBADcDAEHYzwZCgICAgNCtnKbBADcDAEHQzwZCgICAgLjvlKjBADcDAEHIzwZCgICAgPi0mKnBADcDAEHAzwZCgICAgICAgPg/NwMAQYjSBkKAgICAgICA+D83AwBB4NAGQoCAgICAgID4PzcDAEGw0gZCgICAgKDBnZDBADcDAEGo0gZCgICAgIDP1JHBADcDAEGg0gZCgICAgICAgPg/NwMAQZjSBkKAgICAgICA+D83AwBBkNIGQoCAgICAgID4PzcDAEGA0gZCgICAgICAgKTAADcDAEH40QZCgICAgICA4LbAADcDAEHw0QZCgICAgICAj8jAADcDAEHo0QZCgICAgICA/9bAADcDAEHg0QZCgICAgIDw7OXAADcDAEHY0QZCgICAgIDI5vHAADcDAEHQ0QZCgICAgIDo2/zAADcDAEHI0QZCgICAgID+/IXBADcDAEHA0QZCgICAgICCmo3BADcDAEG40QZCgICAgIDXgZLBADcDAEGw0QZCgICAgMCB65XBADcDAEGo0QZCgICAgKCal5nBADcDAEGg0QZCgICAgICN4JvBADcDAEGY0QZCgICAgKDXx57BADcDAEGQ0QZCgICAgPDx4aDBADcDAEGI0QZCgICAgKDxpKLBADcDAEGA0QZCgICAgODiiaTBADcDAEH40AZCgICAgODC7qXBADcDAEHw0AZCgICAgICAgPg/NwMAQejQBkKAgICAgICA+D83AwBB2NAGQoCAgICAgKCmwAA3AwBB0NAGQoCAgICAgNi4wAA3AwBByNAGQoCAgICAgMfJwAA3AwBBsNMGQoCAgICgmPuUwQA3AwBBuNMGQvzTxpfdyZioPzcDAEHA0wZCgICAgICAgITAADcDAEHI0wZC+6i4vZTcnto/NwMAQajTBkKAgICAgICAksAANwMAQaDTBkKAgICAgIDgo8AANwMAQZjTBkKAgICAgICAtcAANwMAQZDTBkKAgICAgICAxMAANwMAQYjTBkKAgICAgMCK08AANwMAQYDTBkKAgICAgKDX38AANwMAQfjSBkKAgICAgKCW6sAANwMAQfDSBkKAgICAgJiX88AANwMAQejSBkKAgICAgILI+sAANwMAQeDSBkKAgICAgKyBgMEANwMAQdjSBkKAgICAgOiIg8EANwMAQdDSBkKAgICAgKrYhsEANwMAQcjSBkKAgICAwKSzicEANwMAQcDSBkKAgICAgPnSi8EANwMAQbjSBkKAgICAwIODjsEANwMAQdDTBkKAgICAgICAisAANwMAQdjTBkKAgICAgICAisAANwMAQeDTBkKAgICAgICAisAANwMAQejTBkKAgICAgICAisAANwMAQfDTBkKAgICAgICAisAANwMAQZjUBkEAQTAQEBpBqNUGQoCAgICAgID8PzcDAEHI1AZCADcDAEGw1QZCz+/Pmt70pvo/NwMAQejWBkL3z7Ca57CP2T83AwBBiNgGQr2U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B0L2nujYwIrE3D83AwBB8K8HQtP8kKi19NXdPzcDAEHorwdC0/yQqLX01d0/NwMAQeCvB0LT/JCotfTV3T83AwBB2K8HQtP8kKi19NXdPzcDAEHQrwdCqubN74jd594/NwMAQcivB0Kq5s3viN3n3j83AwBBwK8HQqrmze+I3efePzcDAEG4rwdCqubN74jd594/NwMAQbCvB0K2kenu6Mf53z83AwBBqK8HQr+vw+DxstzfPzcDAEGgrwdCr7Sj5Jzgidw/NwMAQZivB0Lh/+Ous82O2T83AwBB4LEHQvuouL2U3J7SPzcDAEHosQdCs+bMmbPmzOE/NwMAQfCxB0KAgICAgICAksAANwMAQfixB0KAgICAgICAksAANwMAQYCyB0KAgICAgICA+j83AwBBiLIHQrPmzJmz5szpPzcDAEGQsgdCgICAgICAgPg/NwMAQZiyB0KAgICAgICAksAANwMAQaCyB0KAgICAgICQqMAANwMAQbCyB0KAgICAgIDApMAANwMAQaiyB0KAgICAgICQqMAANwMAQbiyB0KAgICAgIDgmsAANwMAQcCyB0K4vZTcnoquzz83AwBByLIHQoCAgICAgMCkwAA3AwBBiLMHQvzTxpfdyZjAPzcDAEGAswdCueiituf3p8U/NwMAQfiyB0L808aX3cmYyD83AwBB8LIHQvr9qePL7qS8PzcDAEGQswdCgICAgICAgKrAADcDAEGYswdCgICAgICAoKvAADcDAEGgswdCgICAgICAwKzAADcDAEGoswdCgICAgICAgK/AADcDAEGwswdCgICAgICAwKzAADcDAEHIswdCgICAgICAgPw/NwMAQcCzB0LmzJmz5syZ/z83AwBB2LMHQoCAgICAgID4PzcDAEHQswdC5syZs+bMmfs/NwMAQeizB0KAgICAgICA/D83AwBB4LMHQubMmbPmzJn5PzcDAEHwswdCgICAgICAgPg/NwMAQfizB0KAgICAgICA+D83AwBBuLQHQoCAgICAgICCwAA3AwBBsLQHQoCAgICAgID8PzcDAEGotAdCmrPmzJmz5vw/NwMAQaC0B0L20fD6qLi9/D83AwBBgLQHQs2Zs+bMmbP+PzcDAEHAtAdCmrPmzJmz5oDAADcDAEHItAdCgICAgICAgIDAADcDAEHgtAdCs+bMmbPmzPk/NwMAQdC1B0Kz5syZs+bM+T83AwBBkLUHQoCAgICAgID8PzcDAEHwtAdCgICAgICAgPw/NwMAQfi1B0KU3J6Kro+F9z83AwBBgLYHQoCAgICAgID4PzcDAEGItgdCgICAgICAgPg/NwMAQci2B0KAgICAgICA+D83AwBBwLYHQoCAgICAgID4PzcDAEG4tgdCgICAgICAgPg/NwMAQbC2B0KAgICAgICA+D83AwBB0LYHQpqz5syZs+b0PzcDAEGYtwdCgICAgICAgPg/NwMAQZC3B0KAgICAgICA+D83AwBBiLcHQoCAgICAgID4PzcDAEGAtwdCgICAgICAgPg/NwMAQeC2B0L7qLi9lNye0j83AwBBoLcHQrPmzJmz5szpPzcDAEGotwdC9tHw+qi4vfQ/NwMAQbC3B0K4vZTcnoqu5z83AwBBuLcHQoCAgJDK0sauwgA3AwBBwLcHQpqz5syZs+b6PzcDAEHItwdCgICAgICA0M/AADcDAEHQtwdCgICAgICAgIDAADcDAEHYtwdCgICAgICAgJ/AADcDAEGYuAdCgICAgICAgPg/NwMAQZC4B0KAgICAgICA6D83AwBBiLgHQpqz5syZs+b0PzcDAEGAuAdCmrPmzJmz5uQ/NwMAQeC3B0KAgICAgICA+D83AwBBoLgHQpqz5syZs+b8PzcDAEGwuQdCgICAgICAgIrAADcDAEHwuAdCgICAgICAgJDAADcDAEHQuAdCgICAgICAgJDAADcDAEHAuAdCgICAgICAgIrAADcDAEGouAdCzZmz5syZs/Y/NwMAQdi5B0IANwMAQeC5B0IANwMAQei5B0KAgICAgICA+D83AwBB8LkHQoCAgICAgID8PzcDAEH4uQdCgICAgICAgPw/NwMAQYC6B0KAgICAgICA+D83AwBBiLoHQoCAgICAgID4PzcDAEHIugdCgICAgICAgPg/NwMAQcC6B0KAgICAgICA+D83AwBBuLoHQoCAgICAgID4PzcDAEGwugdCgICAgICAgPg/NwMAQZC6B0KAgICAgICA+D83AwBB0LoHQpTcnoquj4X5PzcDAEHYugdCgICAgICAgIrAADcDAEHgugdCgICAgICAgPg/NwMAQei6B0KAgICAgICAgMAANwMAQfC6B0IANwMAQfi6B0Kas+bMmbPm3D83AwBBgLsHQgA3AwBBiLsHQpqz5syZs+bUPzcDAEGQuwdCztCQgpyE9fg/NwMAQZi7B0LS8PqouL2U3D83AwBBoLsHQubMmbPmzJn7PzcDAEGouwdCgICAgICAgIrAADcDAEGwuwdCgICAgICAgIrAADcDAEHAuwdCgICAgICAgIrAADcDAEG4uwdCgICAgICAgIrAADcDAEHIuwdCgICAgICAgIrAADcDAEHQuwdCgICAgICAgIrAADcDAEHYuwdCgICAgICAgIrAADcDAEHguwdCgICAgICAgPg/NwMAQfC7B0IANwMAQZC8B0KAgICAgICA+D83AwBBmLwHQrPmzJmz5sz1PzcDAEHQvgdCgICAgICAgK/AADcDAEHYvgdCgICAgICAgKrAADcDAEHgvgdCgICAgICAwKzAADcDAEHovgdCADcDAEHwvgdC+v2p48vupLQ/NwMAQfi+B0Kas+bMmbPm3D83AwBB+LsHQgA3AwBBuL0HQs2Zs+bMmbP2PzcDAEHAvQdCs+bMmbPmzPU/NwMAQYC/B0LO0JCCnIT1+D83AwBBiL8HQubMmbPmzJn7PzcDAEGQvwdCADcDAEGYvwdCADcDAEGgvwdCADcDAEGovwdCgICAgICAgPg/NwMAQbC/B0KAgICAgICA8D83AwBBuL8HQoCAgICAgIDwPzcDAEHAvwdCgICAkMrSxq7CADcDAEHIvwdCgICAgICAgJ/AADcDAEHQvwdCgICAgICAgIDAADcDAEHYvwdCADcDAEHovwdCgICAgICAgI7AADcDAEHgvwdCgICAgICAgIDAADcDAEHwvwdCgICAgICA5cnAADcDAEH4vwdCrYbx2K7cjY0/NwMAQYDAB0KAgICAgIDkz8AANwMAQYjAB0KAgICAgIDkz8AANwMAQZDAB0KAgICAgIDkz8AANwMAQZjAB0KAgICAgIDkz8AANwMAQaDAB0KAgICAgIDpz8AANwMAQajAB0KAgICAgIDkz8AANwMAQbDAB0KAgICAgIDpz8AANwMAQbjAB0KAgICAgIDkz8AANwMAQcDAB0KAgICAgIDpz8AANwMAQcjAB0KAgICAgIDpz8AANwMAQdDAB0KAgICAgIDArMAANwMAQdjAB0LNmbPmzJmz+j83AwBB6MAHQoCAgICAgICGwAA3AwBB4MAHQubMmbPmzJn7PzcDAEH4wAdCs+bMmbPmzPk/NwMAQfDAB0LmzJmz5syZ8z83AwBBiMEHQpqz5syZs+bsPzcDAEGAwQdCs+bMmbPmzPE/NwMAQZDBB0KAgICAgICA4D83AwBBmMEHQoCAgICAgMCswAA3AwBBoMEHQoCAgICAgID4PzcDAEHYwQdCjujXj8KCgNg/NwMAQdDBB0Ll7KCmsuTZ6z83AwBByMEHQp2/iseD3trxPzcDAEHowgdCmrPmzJmz5uw/NwMAQeDCB0L20fD6qLi97D83AwBBACEAQfjCB0KAgICAgICAgMAANwMAQfDCB0KAgICAgICAisAANwMAQYDDB0KAgICAgICAksAANwMAQYjDB0KAgICAgICAmsAANwMAQZDDB0Kz5syZs+bMg8AANwMAQZjDB0KAgICAgICAg8AANwMAQaDDB0KAgICAgICA+D83AwBBqMMHQoCAgICAgID4PzcDAEGwwwdCgICAgICAgPg/NwMAQbjDB0KAgICAgICAmcAANwMAQcDDB0KAgICAgICAisAANwMAQcjDB0KAgICAgICAisAANwMAQdDDB0KAgICAgICAisAANwMAQdjDB0KAgICAgICAl8AANwMAQeDDB0KAgICAgICAmsAANwMAQejDB0KAgICAgICAksAANwMAQfDDB0KAgICAgJChl8EANwMAQfjDB0KAgICAgJChl8EANwMAQYDEB0KAgICAgJChl8EANwMAQYjEB0LI8LWjypfMkcQANwMAA0BBACEBA0AgAEGoAWxBkMQHaiABQQN0akKAgICAgIDArMAANwMAIAFBAWoiAUEVRw0ACyAAQQFqIgBBAkcNAAtB6MYHQoCAgICA6N2VwQA3AwBB4MYHQrefq5nTtL32PzcDAEHwxgdCgICAgICApNXAADcDAEH4xgdCgICAgPKLqPnBADcDAEGgxwdC+v2p48vupNQ/NwMAQZjHB0L6/anjy+6kxD83AwBBkMcHQpqz5syZs+bcPzcDAEGIxwdCm970puKg4No/NwMAQYDHB0L6/anjy+6k3D83AwBBuMcHQtLw+qi4vZTkPzcDAEGwxwdCw+uj4fXR8OI/NwMAQajHB0Kz5syZs+bM6T83AwBB+McHQrGQsOWhi9ndPzcDAEHwxwdCz+/Pmt70puI/NwMAQejHB0K25/enja+64z83AwBB4McHQvT708aX3cnYPzcDAEHYxwdCnImDgauO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KAI8EAQLMgEBfyAAKAIUIgMgASACIAAoAhAgA2siASABIAJLGyIBEA0gACAAKAIUIAFqNgIUIAILkwUCBn4BfyABIAEoAgBBB2pBeHEiAUEQajYCACAAAnwgASkDACEEIAEpAwghBSMAQSBrIgEkAAJAIAVC////////////AIMiA0KAgICAgIDAgDx9IANCgICAgICAwP/DAH1UBEAgBUIEhiAEQjyIhCEDIARC//////////8PgyIEQoGAgICAgICACFoEQCADQoGAgICAgICAwAB8IQIMAgsgA0KAgICAgICAgEB9IQIgBEKAgICAgICAgAiFQgBSDQEgAiADQgGDfCECDAELIARQIANCgICAgICAwP//AFQgA0KAgICAgIDA//8AURtFBEAgBUIEhiAEQjyIhEL/////////A4NCgICAgICAgPz/AIQhAgwBC0KAgICAgICA+P8AIQIgA0L///////+//8MAVg0AQgAhAiADQjCIpyIIQZH3AEkNACAEIQIgBUL///////8/g0KAgICAgIDAAIQiAyEGAkAgCEGB9wBrIgBBwABxBEAgAiAAQUBqrYYhBkIAIQIMAQsgAEUNACAGIACtIgeGIAJBwAAgAGutiIQhBiACIAeGIQILIAEgAjcDECABIAY3AxggASEAAkBBgfgAIAhrIghBwABxBEAgAyAIQUBqrYghBEIAIQMMAQsgCEUNACADQcAAIAhrrYYgBCAIrSICiIQhBCADIAKIIQMLIAAgBDcDACAAIAM3AwggASkDCEIEhiABKQMAIgRCPIiEIQIgASkDECABKQMYhEIAUq0gBEL//////////w+DhCIEQoGAgICAgICACFoEQCACQgF8IQIMAQsgBEKAgICAgICAgAiFQgBSDQAgAkIBgyACfCECCyABQSBqJAAgAiAFQoCAgICAgICAgH+DhL8LOQMAC+AWAxJ/AXwCfiMAQbAEayIJJAAgCUEANgIsAkAgAb0iGUIAUwRAQQEhEUHqCSESIAGaIgG9IRkMAQsgBEGAEHEEQEEBIRFB7QkhEgwBC0HwCUHrCSAEQQFxIhEbIRIgEUUhFgsCQCAZQoCAgICAgID4/wCDQoCAgICAgID4/wBRBEAgAEEgIAIgEUEDaiILIARB//97cRARIAAgEiAREA4gAEH9CUGFCiAFQSBxIgMbQYEKQYkK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BUHw0gwrAwAQBUH40gwrAwAQBUGI0wwrAwAQBUGY0wwrAwAQBUHg0gwrAwAQBUGA0wwrAwAQBUGQ0wwrAwAQBUH4oQ4rAwAQBUHwoQ4rAwAQBUHooQ4rAwAQBUHgoQ4rAwAQBUGgyAwrAwAQBUHYyAwrAwAQBUHoyAwrAwAQBUGwyAwrAwAQBUHQyAwrAwAQBUHgyAwrAwAQBUG4xAwrAwAQBUHoxAwrAwAQBUH4xAwrAwAQBUHAxAwrAwAQBUHgxAwrAwAQBUHwxAwrAwAQBUHYywwrAwAQBUHoywwrAwAQBUHQywwrAwAQBUHgywwrAwAQBUHQwgwrAwAQBUHwnQ4rAwAQBUH4nQ4rAwAQBUHYnQ4rAwAQBUHgnQ4rAwAQBUHonQ4rAwAQBUHQnQ4rAwAQBUHA2AwrAwAQBUGIjw4rAwAQBUHwjg4rAwAQBUGIkg4rAwAQBUGQkg4rAwAQBUGYkg4rAwAQBUGokg4rAwAQBUG4kg4rAwAQBUGAkg4rAwAQBUGgkg4rAwAQBUGwkg4rAwAQBUGwkQ4rAwAQBUG4tA0rAwAQBUGowQwrAwAQBUGYwQwrAwAQBUGQwQwrAwAQBUGgwQwrAwAQBUH4jA4rAwAQBUGAjQ4rAwAQBUGIjQ4rAwAQBUGYjQ4rAwAQBUGojQ4rAwAQBUHwjA4rAwAQBUGQjQ4rAwAQBUGgjQ4rAwAQBUGI2AsrAwAQBUH41wsrAwAQBUHw1wsrAwAQBUGA2AsrAwAQBUGQjw4rAwAQBUH4jg4rAwAQBUG40Q0rAwAQBUHA0Q0rAwAQBUHI0Q0rAwAQBUHY0Q0rAwAQBUHo0Q0rAwAQBUGw0Q0rAwAQBUHQ0Q0rAwAQBUHg0Q0rAwAQBUGAjw4rAwAQBUHojg4rAwAQBUHg2wsrAwAQBUG4jQ4rAwAQBUHAjQ4rAwAQBUHIjQ4rAwAQBUHYjQ4rAwAQBUHojQ4rAwAQBUGwjQ4rAwAQBUHQjQ4rAwAQBUHgjQ4rAwAQBUGAjg4rAwAQBUH4jQ4rAwAQBUGw2gsrAwAQBUGg2gsrAwAQBUHw9QwrAwAQBUHw0A0rAwAQBUG40A0rAwAQBUGw0A0rAwAQBUGQ0A0rAwAQBUGw7A0rAwAQBUGA8gwrAwAQBUHo+QcrAwAQBUHQ4AwrAwAQBUHQ6w0rAwAQBUHI6w0rAwAQBUGgzA0rAwAQ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AEHg2AxqIgErAyAgAEGwmA5qKwMooSABKwMooSADoqA5AyhBASELIApBAXEhAEEAIQogAA0AC0EAIQFBkMEHKwMAIQNBASEAA0AgCkGoAWwiCkGQhghqIgsgCysDMCAKQeDYDGoiCysDKCAKQbCYDmorAzChIAsrAzChIAOioDkDMCACIQtBACECQQEhCiALDQALA0AgAUGoAWwiAUGQhghqIgIgAisDOCABQeDYDGoiAisDMCABQbCYDmorAzihIAIrAzihIAOioDkDOEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDQCAAQeDYDGoiAisDOCAAQbCYDmorA0ChIAIrA0ChIAOioDkDQEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQhghqIgIgAisDSCABQeDYDGoiAisDQCABQbCYDmorA0ihIAIrA0ihIAOioDkDSEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDUCAAQeDYDGoiAisDSCAAQbCYDmorA1ChIAIrA1ChIAOioDkDUEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQhghqIgIgAisDWCABQeDYDGoiAisDUCABQbCYDmorA1ihIAIrA1ihIAOioDkDWEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDYCAAQeDYDGoiAisDWCAAQbCYDmorA2ChIAIrA2ChIAOioDkDYEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQhghqIgIgAisDaCABQeDYDGoiAisDYCABQbCYDmorA2ihIAIrA2ihIAOioDkDaEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDcCAAQeDYDGoiAisDaCAAQbCYDmorA3ChIAIrA3ChIAOioDkDcEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQhghqIgIgAisDeCABQeDYDGoiAisDcCABQbCYDmorA3ihIAIrA3ihIAOioDkDeEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDgAEgAEHg2AxqIgIrA3ggAEGwmA5qKwOAAaEgAisDgAGhIAOioDkDgAFBASEAIAEhAkEAIQEgAg0A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A4ABoSADoqA5A4ABQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQeCACGoiAiACKwOIASAAQbDbDGoiAisDgAEgAEHglQ5qKwOIAaEgAisDiAGhIAOioDkDiAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgFB4IAIaiICIAIrA5ABIAFBsNsMaiICKwOIASABQeCVDmorA5ABoSACKwOQAaEgA6KgOQOQAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHggAhqIgIgAisDmAEgAEGw2wxqIgIrA5ABIABB4JUOaisDmAGhIAIrA5gBoSADoqA5A5gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQeCACGoiAiACKwOgASABQbDbDGoiAisDmAEgAUHglQ5qKwOgAaEgAisDoAGhIAOioDkDoAFBASEBIAAhAkEAIQAgAg0AC0EAIQFB2KwIQdisCCsDAEHQ/A0rAwAgA6KgOQMAQcisCEHIrAgrAwAgA0HA/A0rAwCioDkDAEGQlwxBkJcMKwMAIANBoOkNKwMAQaDRDSsDAKGioDkDAEEBIQBBASECQQAhCwNAIAtBqAFsIgpBoLoMaiILIAsrAwAgAyAKQYDmBmorAwCaIApBwOcMaisDAKGioDkDACACIQpBACECQQEhCyAKDQALA0AgAUGoAWwiAUGgugxqIgIgAisDCCADIAFBgOYGaiICKwMAIAIrAwihIAFBwOcMaisDCKGioDkDCEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDECADIABBgOYGaiICKwMIIAIrAxChIABBwOcMaisDEKGioDkDEEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGgugxqIgIgAisDGCADIAFBgOYGaiICKwMQIAIrAxihIAFBwOcMaisDGKGioDkDGEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDICADIABBgOYGaiICKwMYIAIrAyChIABBwOcMaisDIKGioDkDIEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGgugxqIgIgAisDKCADIAFBgOYGaiICKwMgIAIrAyihIAFBwOcMaisDKKGioDkDKEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDMCADIABBgOYGaiICKwMoIAIrAzChIABBwOcMaisDMKGioDkDMEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGgugxqIgIgAisDOCADIAFBgOYGaiICKwMwIAIrAzihIAFBwOcMaisDOKGioDkDOEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDQCADIABBgOYGaiICKwM4IAIrA0ChIABBwOcMaisDQKGioDkDQEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGgugxqIgIgAisDSCADIAFBgOYGaiICKwNAIAIrA0ihIAFBwOcMaisDSKGioDkDSEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDUCADIABBgOYGaiICKwNIIAIrA1ChIABBwOcMaisDUKGioDkDUEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGgugxqIgIgAisDWCADIAFBgOYGaiICKwNQIAIrA1ihIAFBwOcMaisDWKGioDkDWEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDYCADIABBgOYGaiICKwNYIAIrA2ChIABBwOcMaisDYKGioDkDYEEBIQAgASECQQAhASACDQALQQAhC0GQwQcrAwAhA0EBIQIDQCALQagBbCIKQaC6DGoiCyALKwNoIApBgOYGaiILKwNgIAsrA2ihIApBwOcMaisDaKEgA6KgOQNoIAIhCkEAIQJBASELIAoNAAsDQCABQagBbCIBQaC6DGoiAiACKwNwIAFBgOYGaiICKwNoIAIrA3ChIAFBwOcMaisDcKEgA6KgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQaC6DGoiAiACKwN4IABBgOYGaiICKwNwIAIrA3ihIABBwOcMaisDeKEgA6KgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQaC6DGoiAiACKwOAASABQYDmBmoiAisDeCACKwOAAaEgAUHA5wxqKwOAAaEgA6KgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGgugxqIgIgAisDiAEgAEGA5gZqIgIrA4ABIAIrA4gBoSAAQcDnDGorA4gBoSADoqA5A4gB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",BA(d)||(d=c(d));function oA(C){try{if(C==d&&F)return new Uint8Array(F);var g=DA(C);if(g)return g;if(O)return O(C);throw"both async and sync fetching of the wasm failed"}catch(s){_(s)}}function NA(){if(!F&&(M||r)){if(typeof fetch=="function"&&!MA(d))return fetch(d,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+d+"\'";return C.arrayBuffer()}).catch(function(){return oA(d)});if(k)return new Promise(function(C,g){k(d,function(s){C(new Uint8Array(s))},g)})}return Promise.resolve().then(function(){return oA(d)})}function nA(){var C={a:fA};function g(G,K){var L=G.exports;Q.asm=L,m=Q.asm.f,b(m.buffer),V=Q.asm.o,cA(Q.asm.g),tA()}HA();function s(G){g(G.instance)}function e(G){return NA().then(function(K){return WebAssembly.instantiate(K,C)}).then(function(K){return K}).then(G,function(K){N("failed to asynchronously prepare wasm: "+K),_(K)})}function u(){return!F&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(d)&&!MA(d)&&typeof fetch=="function"?fetch(d,{credentials:"same-origin"}).then(function(G){var K=WebAssembly.instantiateStreaming(G,C);return K.then(s,function(L){return N("wasm streaming compile failed: "+L),N("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var j=Q.instantiateWasm(C,g);return j}catch(G){return N("Module.instantiateWasm callback failed with error: "+G),!1}return u().catch(w),{}}function wA(C){for(;C.length>0;){var g=C.shift();if(typeof g=="function"){g(Q);continue}var s=g.func;typeof s=="number"?g.arg===void 0?iA(s)():iA(s)(g.arg):s(g.arg===void 0?null:g.arg)}}function iA(C){return V.get(C)}function OA(C,g,s){Z.copyWithin(C,g,g+s)}function hA(C){_("OOM")}function uA(C){Z.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,g){var s=AA.buffers[C];g===0||g===10?((C===1?t:N)(U(s,0)),s.length=0):s.push(g)},varargs:void 0,get:function(){AA.varargs+=4;var C=z[AA.varargs-4>>2];return C},getStr:function(C){var g=x(C);return g},get64:function(C,g){return C}};function jA(C){return 0}function zA(C,g,s,e,u){}function LA(C,g,s,e){for(var u=0,j=0;j<s;j++){var G=z[g>>2],K=z[g+4>>2];g+=8;for(var L=0;L<K;L++)AA.printChar(C,Z[G+L]);u+=K}return z[e>>2]=u,0}var FA=typeof atob=="function"?atob:function(C){var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,j,G,K,L,S,J=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do G=g.indexOf(C.charAt(J++)),K=g.indexOf(C.charAt(J++)),L=g.indexOf(C.charAt(J++)),S=g.indexOf(C.charAt(J++)),e=G<<2|K>>4,u=(K&15)<<4|L>>2,j=(L&3)<<6|S,s=s+String.fromCharCode(e),L!==64&&(s=s+String.fromCharCode(u)),S!==64&&(s=s+String.fromCharCode(j));while(J<C.length);return s};function yA(C){try{for(var g=FA(C),s=new Uint8Array(g.length),e=0;e<g.length;++e)s[e]=g.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(C){if(BA(C))return yA(C.slice(EA.length))}var fA={c:OA,d:uA,e:jA,b:zA,a:LA};nA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},rA=Q.stackRestore=function(){return(rA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=R;var QA;W=function C(){QA||gA(),QA||(W=C)};function gA(C){if(l>0||(X(),l>0))return;function g(){QA||(QA=!0,Q.calledRun=!0,!q&&(GA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),kA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),g()},1)):g()}if(Q.run=gA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return gA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
