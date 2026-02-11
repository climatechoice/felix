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
    constructor(o, B) {
      var Q, i;
      typeof o == "string" && B && B._baseURL ? o = new URL(o, B._baseURL) : typeof o == "string" && !isAbsoluteURL(o) && getBundleURLCached().match(/^file:\/\//i) && (o = new URL(o, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((Q = B?.CORSWorkaround) !== null && Q !== void 0) || Q) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`))), typeof o == "string" && isAbsoluteURL(o) && (!((i = B?.CORSWorkaround) !== null && i !== void 0) || i) && (o = createSourceBlobURL(`importScripts(${JSON.stringify(o)});`)), super(o, B);
    }
  }
  class e extends A {
    constructor(o, B) {
      const Q = window.URL.createObjectURL(o);
      super(Q, B);
    }
    static fromText(o, B) {
      const Q = new window.Blob([o], { type: "text/javascript" });
      return new e(Q, B);
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
  const r = getCallsites().find((i) => {
    const s = i.getFileName();
    return !!(s && !s.match(e) && !s.match(/[\/\\]master[\/\\]implementation/) && !s.match(/^internal\/process/));
  }), o = r ? r.getFileName() : null;
  let B = o || null;
  return B && B.startsWith("file:") && (B = fileURLToPath(B)), B ? path.join(path.dirname(B), A) : A;
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
        const B = e;
        super(B, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(e, r) {
      const o = (B) => {
        r({ data: B });
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
    constructor(i, s) {
      const a = s && s.fromSource ? null : process.platform === "win32" ? `file:///${resolveScriptPath(i).replace(/\\/g, "/")}` : resolveScriptPath(i);
      if (a)
        a.match(/\.tsx?$/i) && detectTsNode() ? super(new Function(createTsNodeModule(resolveScriptPath(i))), [], { esm: !0 }) : a.match(/\.asar[\/\\]/) ? super(a.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), [], { esm: !0 }) : super(a, [], { esm: !0 });
      else {
        const g = i;
        super(new Function(g), [], { esm: !0 });
      }
      e.push(this), this.emitter = new EventEmitter(), this.onerror = (g) => this.emitter.emit("error", g), this.onmessage = (g) => this.emitter.emit("message", g);
    }
    addEventListener(i, s) {
      this.emitter.addListener(i, s);
    }
    removeEventListener(i, s) {
      this.emitter.removeListener(i, s);
    }
    terminate() {
      return e = e.filter((i) => i !== this), super.terminate();
    }
  }
  const o = () => {
    Promise.all(e.map((Q) => Q.terminate())).then(() => process.exit(0), () => process.exit(1)), e = [];
  };
  process.on("SIGINT", () => o()), process.on("SIGTERM", () => o());
  class B extends r {
    constructor(i, s) {
      super(Buffer.from(i).toString("utf-8"), Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
    static fromText(i, s) {
      return new r(i, Object.assign(Object.assign({}, s), { fromSource: !0 }));
    }
  }
  return {
    blob: B,
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
  var A = 1e3, e = A * 60, r = e * 60, o = r * 24, B = o * 7, Q = o * 365.25;
  ms = function(n, E) {
    E = E || {};
    var l = typeof n;
    if (l === "string" && n.length > 0)
      return i(n);
    if (l === "number" && isFinite(n))
      return E.long ? a(n) : s(n);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(n)
    );
  };
  function i(n) {
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
            return l * B;
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
    o.debug = o, o.default = o, o.coerce = g, o.disable = s, o.enable = Q, o.enabled = a, o.humanize = requireMs(), o.destroy = n, Object.keys(e).forEach((E) => {
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
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (K, G) => {
          if (K === "%%")
            return "%";
          d++;
          const H = o.formatters[G];
          if (typeof H == "function") {
            const q = C[d];
            K = H.call(t, q), C.splice(d, 1), d--;
          }
          return K;
        }), o.formatArgs.call(t, C), (t.log || o.log).apply(t, C);
      }
      return w.namespace = E, w.useColors = o.useColors(), w.color = o.selectColor(E), w.extend = B, w.destroy = o.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (m !== o.namespaces && (m = o.namespaces, I = o.enabled(E)), I),
        set: (C) => {
          f = C;
        }
      }), typeof o.init == "function" && o.init(w), w;
    }
    function B(E, l) {
      const f = o(this.namespace + (typeof l > "u" ? ":" : l) + E);
      return f.log = this.log, f;
    }
    function Q(E) {
      o.save(E), o.namespaces = E, o.names = [], o.skips = [];
      const l = (typeof E == "string" ? E : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? o.skips.push(f.slice(1)) : o.names.push(f);
    }
    function i(E, l) {
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
        if (i(E, l))
          return !1;
      for (const l of o.names)
        if (i(E, l))
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
    e.formatArgs = o, e.save = B, e.load = Q, e.useColors = r, e.storage = i(), e.destroy = /* @__PURE__ */ (() => {
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
    function B(a) {
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
    function i() {
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
    const B = o ? getMethod(o, e) : void 0;
    switch (e) {
      case "next":
        B && B.call(o, r);
        break;
      case "error":
        if (closeSubscription(A), B)
          B.call(o, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(A), B && B.call(o);
        break;
    }
  } catch (B) {
    hostReportError(B);
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
    } catch (B) {
      o.error(B);
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
    for (const B of [e, ...r])
      o = B(o);
    return o;
  }
  tap(e, r, o) {
    const B = typeof e != "object" || e === null ? {
      next: e,
      error: r,
      complete: o
    } : e;
    return new Observable((Q) => this.subscribe({
      next(i) {
        B.next && B.next(i), Q.next(i);
      },
      error(i) {
        B.error && B.error(i), Q.error(i);
      },
      complete() {
        B.complete && B.complete(), Q.complete();
      },
      start(i) {
        B.start && B.start(i);
      }
    }));
  }
  forEach(e) {
    return new Promise((r, o) => {
      if (typeof e != "function") {
        o(new TypeError(e + " is not a function"));
        return;
      }
      function B() {
        Q.unsubscribe(), r(void 0);
      }
      const Q = this.subscribe({
        next(i) {
          try {
            e(i, B);
          } catch (s) {
            o(s), Q.unsubscribe();
          }
        },
        error(i) {
          o(i);
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
      next(B) {
        let Q = B;
        try {
          Q = e(B);
        } catch (i) {
          return o.error(i);
        }
        o.next(Q);
      },
      error(B) {
        o.error(B);
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
      next(B) {
        try {
          if (!e(B))
            return;
        } catch (Q) {
          return o.error(Q);
        }
        o.next(B);
      },
      error(B) {
        o.error(B);
      },
      complete() {
        o.complete();
      }
    }));
  }
  reduce(e, r) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const o = getSpecies(this), B = arguments.length > 1;
    let Q = !1, i = r;
    return new o((s) => this.subscribe({
      next(a) {
        const g = !Q;
        if (Q = !0, !g || B)
          try {
            i = e(i, a);
          } catch (n) {
            return s.error(n);
          }
        else
          i = a;
      },
      error(a) {
        s.error(a);
      },
      complete() {
        if (!Q && !B)
          return s.error(new TypeError("Cannot reduce an empty sequence"));
        s.next(i), s.complete();
      }
    }));
  }
  concat(...e) {
    const r = getSpecies(this);
    return new r((o) => {
      let B, Q = 0;
      function i(s) {
        B = s.subscribe({
          next(a) {
            o.next(a);
          },
          error(a) {
            o.error(a);
          },
          complete() {
            Q === e.length ? (B = void 0, o.complete()) : i(r.from(e[Q++]));
          }
        });
      }
      return i(this), () => {
        B && (B.unsubscribe(), B = void 0);
      };
    });
  }
  flatMap(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((o) => {
      const B = [], Q = this.subscribe({
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
              const n = B.indexOf(g);
              n >= 0 && B.splice(n, 1), i();
            }
          });
          B.push(g);
        },
        error(s) {
          o.error(s);
        },
        complete() {
          i();
        }
      });
      function i() {
        Q.closed && B.length === 0 && o.complete();
      }
      return () => {
        B.forEach((s) => s.unsubscribe()), Q.unsubscribe();
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
      const B = o.call(e);
      if (Object(B) !== B)
        throw new TypeError(B + " is not an object");
      return isObservable(B) && B.constructor === r ? B : new r((Q) => B.subscribe(Q));
    }
    if (hasSymbol("iterator")) {
      const B = getMethod(e, SymbolIterator);
      if (B)
        return new r((Q) => {
          enqueue(() => {
            if (!Q.closed) {
              for (const i of B.call(e))
                if (Q.next(i), Q.closed)
                  return;
              Q.complete();
            }
          });
        });
    }
    if (Array.isArray(e))
      return new r((B) => {
        enqueue(() => {
          if (!B.closed) {
            for (const Q of e)
              if (B.next(Q), B.closed)
                return;
            B.complete();
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
          for (const B of e)
            if (o.next(B), o.closed)
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
  return new Observable((B) => {
    r || (r = A.subscribe(e));
    const Q = e.subscribe(B);
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
      const o = this, B = Object.assign(Object.assign({}, r), {
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
        return this.initHasRun = !0, e(B);
      } catch (Q) {
        B.error(Q);
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
    const o = e || returnInput, B = r || fail;
    let Q = !1;
    return new Promise((i, s) => {
      const a = (n) => {
        if (!Q) {
          Q = !0;
          try {
            i(B(n));
          } catch (E) {
            s(E);
          }
        }
      }, g = (n) => {
        try {
          i(o(n));
        } catch (E) {
          a(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: a }), this.state === "fulfilled")
        return i(o(this.firstValue));
      if (this.state === "rejected")
        return Q = !0, i(B(this.rejection));
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
      const o = (Q) => {
        r.next(Q), r.complete();
      }, B = (Q) => {
        r.error(Q);
      };
      e.then(o, B);
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
    const B = ((Q) => {
      if (debugMessages$1("Message from worker:", Q.data), !(!Q.data || Q.data.uid !== e)) {
        if (isJobStartMessage(Q.data))
          o = Q.data.resultType;
        else if (isJobResultMessage(Q.data))
          o === "promise" ? (typeof Q.data.payload < "u" && r.next(deserialize(Q.data.payload)), r.complete(), A.removeEventListener("message", B)) : (Q.data.payload && r.next(deserialize(Q.data.payload)), Q.data.complete && (r.complete(), A.removeEventListener("message", B)));
        else if (isJobErrorMessage(Q.data)) {
          const i = deserialize(Q.data.error);
          r.error(i), A.removeEventListener("message", B);
        }
      }
    });
    return A.addEventListener("message", B), () => {
      if (o === "observable" || !o) {
        const Q = {
          type: MasterMessageType.cancel,
          uid: e
        };
        A.postMessage(Q);
      }
      A.removeEventListener("message", B);
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
    const o = nextJobUID++, { args: B, transferables: Q } = prepareArguments(r), i = {
      type: MasterMessageType.run,
      uid: o,
      method: e,
      args: B
    };
    debugMessages$1("Sending command to run function to worker:", i);
    try {
      A.postMessage(i, Q);
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
  function B(Q) {
    return Q instanceof r ? Q : new r(function(i) {
      i(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, i) {
    function s(n) {
      try {
        g(o.next(n));
      } catch (E) {
        i(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        i(E);
      }
    }
    function g(n) {
      n.done ? Q(n.value) : B(n.value).then(s, a);
    }
    g((o = o.apply(A, e || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (A) => A && A.type === "init", isUncaughtErrorMessage = (A) => A && A.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(A, e, r) {
  return __awaiter$2(this, void 0, void 0, function* () {
    let o;
    const B = new Promise((i, s) => {
      o = setTimeout(() => s(Error(r)), e);
    }), Q = yield Promise.race([
      A,
      B
    ]);
    return clearTimeout(o), Q;
  });
}
function receiveInitMessage(A) {
  return new Promise((e, r) => {
    const o = ((B) => {
      debugMessages("Message from worker before finishing initialization:", B.data), isInitMessage(B.data) ? (A.removeEventListener("message", o), e(B.data)) : isUncaughtErrorMessage(B.data) && (A.removeEventListener("message", o), r(deserialize(B.data.error)));
    });
    A.addEventListener("message", o);
  });
}
function createEventObservable(A, e) {
  return new Observable((r) => {
    const o = ((Q) => {
      const i = {
        type: WorkerEventType.message,
        data: Q.data
      };
      r.next(i);
    }), B = ((Q) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", Q);
      const i = {
        type: WorkerEventType.internalError,
        error: Error(Q.reason)
      };
      r.next(i);
    });
    A.addEventListener("message", o), A.addEventListener("unhandledrejection", B), e.then(() => {
      const Q = {
        type: WorkerEventType.termination
      };
      A.removeEventListener("message", o), A.removeEventListener("unhandledrejection", B), r.next(Q), r.complete();
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
  const B = r.filter((Q) => Q.type === WorkerEventType.internalError).map((Q) => Q.error);
  return Object.assign(A, {
    [$errors]: B,
    [$events]: r,
    [$terminate]: o,
    [$worker]: e
  });
}
function spawn(A, e) {
  return __awaiter$2(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, B = (yield withTimeout(receiveInitMessage(A), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: Q, terminate: i } = createTerminator(A), s = createEventObservable(A, Q);
    if (B.type === "function") {
      const a = createProxyFunction(A);
      return setPrivateThreadProps(a, A, s, i);
    } else if (B.type === "module") {
      const a = createProxyModule(A, B.methods);
      return setPrivateThreadProps(a, A, s, i);
    } else {
      const a = B.type;
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
  const r = (B) => {
    e(B.data);
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
    messageHandlers.forEach((B) => B(o.data));
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
  }, B = () => {
    assertMessagePort(r).off("message", o);
  };
  return assertMessagePort(r).on("message", o), B;
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
      this.value = e, this.match = function(o, B) {
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
      this.error = e, this.match = function(o, B) {
        return B(r.error);
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
  function B(Q) {
    return Q instanceof r ? Q : new r(function(i) {
      i(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, i) {
    function s(n) {
      try {
        g(o.next(n));
      } catch (E) {
        i(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        i(E);
      }
    }
    function g(n) {
      n.done ? Q(n.value) : B(n.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
  });
}
function __generator$1(A, e) {
  var r = { label: 0, sent: function() {
    if (Q[0] & 1) throw Q[1];
    return Q[1];
  }, trys: [], ops: [] }, o, B, Q, i;
  return i = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (i[Symbol.iterator] = function() {
    return this;
  }), i;
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, B && (Q = g[0] & 2 ? B.return : g[0] ? B.throw || ((Q = B.return) && Q.call(B), 0) : B.next) && !(Q = Q.call(B, g[1])).done) return Q;
      switch (B = 0, Q && (g = [g[0] & 2, Q.value]), g[0]) {
        case 0:
        case 1:
          Q = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, B = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!Q || g[1] > Q[0] && g[1] < Q[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = g;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(g);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], B = 0;
    } finally {
      o = Q = 0;
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
      var o = e.then(function(Q) {
        return new Ok$1(Q);
      });
      if (r)
        o = o.catch(function(Q) {
          return new Err$1(r(Q));
        });
      else {
        var B = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(B);
      }
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var B;
          return __generator$1(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isErr() ? [2, new Err$1(o.error)] : (B = Ok$1.bind, [4, e(o.value)]);
              case 1:
                return [2, new (B.apply(Ok$1, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter$1(r, void 0, void 0, function() {
          var B;
          return __generator$1(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isOk() ? [2, new Ok$1(o.value)] : (B = Err$1.bind, [4, e(o.error)]);
              case 1:
                return [2, new (B.apply(Err$1, [void 0, Q.sent()]))()];
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
  const B = {}, Q = () => o, i = (a) => {
    var g;
    a !== o && (o = a, (g = B.onSet) == null || g.call(B));
  };
  return { varId: A, get: Q, set: i, reset: () => {
    i(e);
  }, callbacks: B };
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
    for (let B = 0; B < A.length; B++) {
      const Q = new Array(this.seriesLength);
      for (let s = 0; s < this.seriesLength; s++)
        Q[s] = { x: e + s * o, y: 0 };
      const i = A[B];
      this.varSeries[B] = new Series(i, Q);
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
  const o = r.varIds.length, B = r.seriesLength;
  if (e < B || A.length < o * B)
    return err$1("invalid-point-count");
  for (let Q = 0; Q < o; Q++) {
    const i = r.varSeries[Q];
    let s = e * Q;
    for (let a = 0; a < B; a++)
      i.points[a].y = validateNumber(A[s]), s++;
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
    const B = ((e = o.subscriptIndices) == null ? void 0 : e.length) || 0;
    r += B;
  }
  return r;
}
function encodeVarIndices(A, e) {
  let r = 0;
  e[r++] = A.length;
  for (const o of A) {
    e[r++] = o.varIndex;
    const B = o.subscriptIndices, Q = B?.length || 0;
    e[r++] = Q;
    for (let i = 0; i < Q; i++)
      e[r++] = B[i];
  }
}
function getEncodedLookupBufferLengths(A) {
  var e, r;
  let o = 1, B = 0;
  for (const Q of A) {
    const i = Q.varRef.varSpec;
    if (i === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    o += 2;
    const s = ((e = i.subscriptIndices) == null ? void 0 : e.length) || 0;
    o += s, o += 2, B += ((r = Q.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: o,
    lookupsLength: B
  };
}
function encodeLookups(A, e, r) {
  let o = 0;
  e[o++] = A.length;
  let B = 0;
  for (const Q of A) {
    const i = Q.varRef.varSpec;
    e[o++] = i.varIndex;
    const s = i.subscriptIndices, a = s?.length || 0;
    e[o++] = a;
    for (let g = 0; g < a; g++)
      e[o++] = s[g];
    Q.points !== void 0 ? (e[o++] = B, e[o++] = Q.points.length, r?.set(Q.points, B), B += Q.points.length) : (e[o++] = -1, e[o++] = 0);
  }
}
function decodeLookups(A, e) {
  const r = [];
  let o = 0;
  const B = A[o++];
  for (let Q = 0; Q < B; Q++) {
    const i = A[o++], s = A[o++], a = s > 0 ? Array(s) : void 0;
    for (let f = 0; f < s; f++)
      a[f] = A[o++];
    const g = A[o++], n = A[o++], E = {
      varIndex: i,
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
    for (const B of A.dimensions) {
      const Q = B.id, i = [];
      for (let s = 0; s < B.subIds.length; s++)
        i.push({
          id: B.subIds[s],
          index: s
        });
      e.set(Q, {
        id: Q,
        subscripts: i
      });
    }
    function r(B) {
      const Q = e.get(B);
      if (Q === void 0)
        throw new Error(`No dimension info found for id=${B}`);
      return Q;
    }
    const o = /* @__PURE__ */ new Set();
    for (const B of A.variables) {
      const Q = varIdWithoutSubscripts(B.id);
      if (!o.has(Q)) {
        const s = (B.dimIds || []).map(r);
        if (s.length > 0) {
          const a = [];
          for (const n of s)
            a.push(n.subscripts);
          const g = cartesianProductOf(a);
          for (const n of g) {
            const E = n.map((m) => m.id).join(","), l = n.map((m) => m.index), f = `${Q}[${E}]`;
            this.varSpecs.set(f, {
              varIndex: B.index,
              subscriptIndices: l
            });
          }
        } else
          this.varSpecs.set(Q, {
            varIndex: B.index
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
    for (const B of e) {
      const Q = this.varSpecs.get(B);
      Q !== void 0 ? r.push(Q) : console.warn(`WARNING: No output var spec found for id=${B}`);
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
    (e, r) => e.map((o) => r.map((B) => o.concat([B]))).reduce((o, B) => o.concat(B), []),
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
    const o = e[2].split(",").map((B) => sdeVarIdForVensimName(B));
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
    const o = A.length, B = e.varIds.length * e.seriesLength;
    let Q;
    const i = e.varSpecs;
    i !== void 0 && i.length > 0 ? Q = getEncodedVarIndicesLength(i) : Q = 0;
    let s, a;
    if (r?.lookups !== void 0 && r.lookups.length > 0) {
      for (const K of r.lookups)
        resolveVarRef(this.listing, K.varRef, "lookup");
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, a = M.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let g = 0;
    function n(M, K) {
      const G = g, H = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, q = Math.round(K * H), F = Math.ceil(q / 8) * 8;
      return g += F, G;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", o), m = n("float64", B), I = n("int32", Q), w = n("float64", s), C = n("int32", a), t = g;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const D = this.header.view;
    let c = 0;
    D[c++] = l, D[c++] = extrasLengthInElements, D[c++] = f, D[c++] = o, D[c++] = m, D[c++] = B, D[c++] = I, D[c++] = Q, D[c++] = w, D[c++] = s, D[c++] = C, D[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, B), this.outputIndices.update(this.encoded, I, Q), this.lookups.update(this.encoded, w, s), this.lookupIndices.update(this.encoded, C, a);
    const d = this.inputs.view;
    for (let M = 0; M < A.length; M++) {
      const K = A[M];
      typeof K == "number" ? d[M] = K : d[M] = K.get();
    }
    this.outputIndices.view && encodeVarIndices(i, this.outputIndices.view), a > 0 && encodeLookups(r.lookups, this.lookupIndices.view, this.lookups.view);
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
    let B = 0;
    const Q = o[B++], i = o[B++], s = o[B++], a = o[B++], g = o[B++], n = o[B++], E = o[B++], l = o[B++], f = o[B++], m = o[B++], I = o[B++], w = o[B++], C = i * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, D = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, M = w * Int32Array.BYTES_PER_ELEMENT, K = e + C + t + D + c + d + M;
    if (A.byteLength < K)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, Q, i), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, g, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, m), this.lookupIndices.update(this.encoded, I, w);
  }
};
async function spawnAsyncModelRunner(A) {
  return A.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(A.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(A.source));
}
async function spawnAsyncModelRunnerWithWorker(A) {
  const e = await spawn(A), r = await e.initModel(), o = r.modelListing ? new ModelListing(r.modelListing) : void 0, B = new BufferedRunModelParams(o);
  let Q = !1, i = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (s, a, g) => {
      if (i)
        throw new Error("Async model runner has already been terminated");
      if (Q)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      Q = !0, B.updateFromParams(s, a, g);
      let n;
      try {
        n = await e.runModel(Transfer(B.getEncodedBuffer()));
      } finally {
        Q = !1;
      }
      return B.updateFromEncodedBuffer(n), B.finalizeOutputs(a), a;
    },
    terminate: () => i ? Promise.resolve() : (i = !0, Thread.terminate(e))
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
    function B(C, ...t) {
      const D = [C[0]];
      let c = 0;
      for (; c < t.length; )
        s(D, t[c]), D.push(C[++c]);
      return new o(D);
    }
    A._ = B;
    const Q = new o("+");
    function i(C, ...t) {
      const D = [f(C[0])];
      let c = 0;
      for (; c < t.length; )
        D.push(Q), s(D, t[c]), D.push(Q, f(C[++c]));
      return a(D), new o(D);
    }
    A.str = i;
    function s(C, t) {
      t instanceof o ? C.push(...t._items) : t instanceof r ? C.push(t) : C.push(E(t));
    }
    A.addCodeArg = s;
    function a(C) {
      let t = 1;
      for (; t < C.length - 1; ) {
        if (C[t] === Q) {
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
      return t.emptyStr() ? C : C.emptyStr() ? t : i`${C}${t}`;
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
    function m(C) {
      return typeof C == "string" && A.IDENTIFIER.test(C) ? new o(`.${C}`) : B`[${C}]`;
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
    class B {
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
    A.Scope = B;
    class Q extends e.Name {
      constructor(g, n) {
        super(n), this.prefix = g;
      }
      setValue(g, { property: n, itemIndex: E }) {
        this.value = g, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = Q;
    const i = (0, e._)`\n`;
    class s extends B {
      constructor(g) {
        super(g), this._values = {}, this._scope = g.scope, this.opts = { ...g, _n: g.lines ? i : e.nil };
      }
      get() {
        return this._scope;
      }
      name(g) {
        return new Q(g, this._newName(g));
      }
      value(g, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(g), { prefix: f } = l, m = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let I = this._values[f];
        if (I) {
          const t = I.get(m);
          if (t)
            return t;
        } else
          I = this._values[f] = /* @__PURE__ */ new Map();
        I.set(m, l);
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
        for (const m in g) {
          const I = g[m];
          if (!I)
            continue;
          const w = E[m] = E[m] || /* @__PURE__ */ new Map();
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
    var B = requireScope();
    Object.defineProperty(A, "Scope", { enumerable: !0, get: function() {
      return B.Scope;
    } }), Object.defineProperty(A, "ValueScope", { enumerable: !0, get: function() {
      return B.ValueScope;
    } }), Object.defineProperty(A, "ValueScopeName", { enumerable: !0, get: function() {
      return B.ValueScopeName;
    } }), Object.defineProperty(A, "varKinds", { enumerable: !0, get: function() {
      return B.varKinds;
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
    class i extends Q {
      constructor(u, h, N) {
        super(), this.varKind = u, this.name = h, this.rhs = N;
      }
      render({ es5: u, _n: h }) {
        const N = u ? r.varKinds.var : this.varKind, L = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${N} ${this.name}${L};` + h;
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
      constructor(u, h, N) {
        super(), this.lhs = u, this.rhs = h, this.sideEffects = N;
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
      constructor(u, h, N, L) {
        super(u, N, L), this.op = h;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class g extends Q {
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
        return this.nodes.reduce((h, N) => h + N.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let h = u.length;
        for (; h--; ) {
          const N = u[h].optimizeNodes();
          Array.isArray(N) ? u.splice(h, 1, ...N) : N ? u[h] = N : u.splice(h, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, h) {
        const { nodes: N } = this;
        let L = N.length;
        for (; L--; ) {
          const z = N[L];
          z.optimizeNames(u, h) || (V(u, z.names), N.splice(L, 1));
        }
        return N.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, h) => S(u, h.names), {});
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
          const N = h.optimizeNodes();
          h = this.else = Array.isArray(N) ? new w(N) : N;
        }
        if (h)
          return u === !1 ? h instanceof C ? h : h.nodes : this.nodes.length ? this : new C(rA(u), h instanceof C ? [h] : h.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, h) {
        var N;
        if (this.else = (N = this.else) === null || N === void 0 ? void 0 : N.optimizeNames(u, h), !!(super.optimizeNames(u, h) || this.else))
          return this.condition = Y(this.condition, u, h), this;
      }
      get names() {
        const u = super.names;
        return U(u, this.condition), this.else && S(u, this.else.names), u;
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
        return S(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, h, N, L) {
        super(), this.varKind = u, this.name = h, this.from = N, this.to = L;
      }
      render(u) {
        const h = u.es5 ? r.varKinds.var : this.varKind, { name: N, from: L, to: z } = this;
        return `for(${h} ${N}=${L}; ${N}<${z}; ${N}++)` + super.render(u);
      }
      get names() {
        const u = U(super.names, this.from);
        return U(u, this.to);
      }
    }
    class d extends t {
      constructor(u, h, N, L) {
        super(), this.loop = u, this.varKind = h, this.name = N, this.iterable = L;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, h) {
        if (super.optimizeNames(u, h))
          return this.iterable = Y(this.iterable, u, h), this;
      }
      get names() {
        return S(super.names, this.iterable.names);
      }
    }
    class M extends m {
      constructor(u, h, N) {
        super(), this.name = u, this.args = h, this.async = N;
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
    class G extends m {
      render(u) {
        let h = "try" + super.render(u);
        return this.catch && (h += this.catch.render(u)), this.finally && (h += this.finally.render(u)), h;
      }
      optimizeNodes() {
        var u, h;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (h = this.finally) === null || h === void 0 || h.optimizeNodes(), this;
      }
      optimizeNames(u, h) {
        var N, L;
        return super.optimizeNames(u, h), (N = this.catch) === null || N === void 0 || N.optimizeNames(u, h), (L = this.finally) === null || L === void 0 || L.optimizeNames(u, h), this;
      }
      get names() {
        const u = super.names;
        return this.catch && S(u, this.catch.names), this.finally && S(u, this.finally.names), u;
      }
    }
    class H extends m {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    H.kind = "catch";
    class q extends m {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    q.kind = "finally";
    class F {
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
        const N = this._extScope.value(u, h);
        return (this._values[N.prefix] || (this._values[N.prefix] = /* @__PURE__ */ new Set())).add(N), N;
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
      _def(u, h, N, L) {
        const z = this._scope.toName(h);
        return N !== void 0 && L && (this._constants[z.str] = N), this._leafNode(new i(u, z, N)), z;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, h, N) {
        return this._def(r.varKinds.const, u, h, N);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, h, N) {
        return this._def(r.varKinds.let, u, h, N);
      }
      // `var` declaration with optional assignment
      var(u, h, N) {
        return this._def(r.varKinds.var, u, h, N);
      }
      // assignment code
      assign(u, h, N) {
        return this._leafNode(new s(u, h, N));
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
        for (const [N, L] of u)
          h.length > 1 && h.push(","), h.push(N), (N !== L || this.opts.es5) && (h.push(":"), (0, e.addCodeArg)(h, L));
        return h.push("}"), new e._Code(h);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, h, N) {
        if (this._blockNode(new C(u)), h && N)
          this.code(h).else().code(N).endIf();
        else if (h)
          this.code(h).endIf();
        else if (N)
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
      forRange(u, h, N, L, z = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(z, J, h, N), () => L(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, h, N, L = r.varKinds.const) {
        const z = this._scope.toName(u);
        if (this.opts.es5) {
          const J = h instanceof e.Name ? h : this.var("_arr", h);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(z, (0, e._)`${J}[${Z}]`), N(z);
          });
        }
        return this._for(new d("of", L, z, h), () => N(z));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, h, N, L = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${h})`, N);
        const z = this._scope.toName(u);
        return this._for(new d("in", L, z, h), () => N(z));
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
        const h = new K();
        if (this._blockNode(h), this.code(u), h.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(K);
      }
      // `try` statement
      try(u, h, N) {
        if (!h && !N)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const L = new G();
        if (this._blockNode(L), this.code(u), h) {
          const z = this.name("e");
          this._currNode = L.catch = new H(z), h(z);
        }
        return N && (this._currNode = L.finally = new q(), this.code(N)), this._endBlockNode(H, q);
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
        const N = this._nodes.length - h;
        if (N < 0 || u !== void 0 && N !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${N} vs ${u} expected`);
        return this._nodes.length = h, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, h = e.nil, N, L) {
        return this._blockNode(new M(u, h, N)), L && this.code(L).endFunc(), this;
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
        const N = this._currNode;
        if (N instanceof u || h && N instanceof h)
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
    A.CodeGen = F;
    function S(y, u) {
      for (const h in u)
        y[h] = (y[h] || 0) + (u[h] || 0);
      return y;
    }
    function U(y, u) {
      return u instanceof e._CodeOrName ? S(y, u.names) : y;
    }
    function Y(y, u, h) {
      if (y instanceof e.Name)
        return N(y);
      if (!L(y))
        return y;
      return new e._Code(y._items.reduce((z, J) => (J instanceof e.Name && (J = N(J)), J instanceof e._Code ? z.push(...J._items) : z.push(J), z), []));
      function N(z) {
        const J = h[z.str];
        return J === void 0 || u[z.str] !== 1 ? z : (delete u[z.str], J);
      }
      function L(z) {
        return z instanceof e._Code && z._items.some((J) => J instanceof e.Name && u[J.str] === 1 && h[J.str] !== void 0);
      }
    }
    function V(y, u) {
      for (const h in u)
        y[h] = (y[h] || 0) - (u[h] || 0);
    }
    function rA(y) {
      return typeof y == "boolean" || typeof y == "number" || y === null ? !y : (0, e._)`!${_(y)}`;
    }
    A.not = rA;
    const oA = P(A.operators.AND);
    function T(...y) {
      return y.reduce(oA);
    }
    A.and = T;
    const QA = P(A.operators.OR);
    function v(...y) {
      return y.reduce(QA);
    }
    A.or = v;
    function P(y) {
      return (u, h) => u === e.nil ? h : h === e.nil ? u : (0, e._)`${_(u)} ${y} ${_(h)}`;
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
    for (const K of d)
      M[K] = !0;
    return M;
  }
  util.toHash = r;
  function o(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (B(d, M), !Q(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = o;
  function B(d, M = d.schema) {
    const { opts: K, self: G } = d;
    if (!K.strictSchema || typeof M == "boolean")
      return;
    const H = G.RULES.keywords;
    for (const q in M)
      H[q] || c(d, `unknown keyword: "${q}"`);
  }
  util.checkUnknownRules = B;
  function Q(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (M[K])
        return !0;
    return !1;
  }
  util.schemaHasRules = Q;
  function i(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (K !== "$ref" && M.all[K])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = i;
  function s({ topSchemaRef: d, schemaPath: M }, K, G, H) {
    if (!H) {
      if (typeof K == "number" || typeof K == "boolean")
        return K;
      if (typeof K == "string")
        return (0, A._)`${K}`;
    }
    return (0, A._)`${d}${M}${(0, A.getProperty)(G)}`;
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
      for (const K of d)
        M(K);
    else
      M(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: M, mergeValues: K, resultToName: G }) {
    return (H, q, F, S) => {
      const U = F === void 0 ? q : F instanceof A.Name ? (q instanceof A.Name ? d(H, q, F) : M(H, q, F), F) : q instanceof A.Name ? (M(H, F, q), q) : K(q, F);
      return S === A.Name && !(U instanceof A.Name) ? G(H, U) : U;
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
    Object.keys(K).forEach((G) => d.assign((0, A._)`${M}${(0, A.getProperty)(G)}`, !0));
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
      const G = M === t.Num;
      return K ? G ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : G ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return K ? (0, A.getProperty)(d).toString() : "/" + n(d);
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
    function B(w, C = A.keywordError, t, D) {
      const { it: c } = w, { gen: d, compositeRule: M, allErrors: K } = c, G = E(w, C, t);
      D ?? (M || K) ? a(d, G) : g(c, (0, e._)`[${G}]`);
    }
    A.reportError = B;
    function Q(w, C = A.keywordError, t) {
      const { it: D } = w, { gen: c, compositeRule: d, allErrors: M } = D, K = E(w, C, t);
      a(c, K), d || M || g(D, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function i(w, C) {
      w.assign(o.default.errors, C), w.if((0, e._)`${o.default.vErrors} !== null`, () => w.if(C, () => w.assign((0, e._)`${o.default.vErrors}.length`, C), () => w.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = i;
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
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function I(w, { params: C, message: t }, D) {
      const { keyword: c, data: d, schemaValue: M, it: K } = w, { opts: G, propertyName: H, topSchemaRef: q, schemaPath: F } = K;
      D.push([n.keyword, c], [n.params, typeof C == "function" ? C(w) : C || (0, e._)`{}`]), G.messages && D.push([n.message, typeof t == "function" ? t(w) : t]), G.verbose && D.push([n.schema, M], [n.parentSchema, (0, e._)`${q}${F}`], [o.default.data, d]), H && D.push([n.propertyName, H]);
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
  function B(s) {
    const { gen: a, schema: g, validateName: n } = s;
    g === !1 ? i(s, !1) : typeof g == "object" && g.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = B;
  function Q(s, a) {
    const { gen: g, schema: n } = s;
    n === !1 ? (g.var(a, !1), i(s)) : g.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = Q;
  function i(s, a) {
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
  function r(B) {
    return typeof B == "string" && e.has(B);
  }
  rules.isJSONType = r;
  function o() {
    const B = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...B, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, B.number, B.string, B.array, B.object],
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
  function A({ schema: o, self: B }, Q) {
    const i = B.RULES.types[Q];
    return i && i !== !0 && e(o, i);
  }
  applicability.schemaHasRulesForType = A;
  function e(o, B) {
    return B.rules.some((Q) => r(o, Q));
  }
  applicability.shouldUseGroup = e;
  function r(o, B) {
    var Q;
    return o[B.keyword] !== void 0 || ((Q = B.definition.implements) === null || Q === void 0 ? void 0 : Q.some((i) => o[i] !== void 0));
  }
  return applicability.shouldUseRule = r, applicability;
}
var hasRequiredDataType;
function requireDataType() {
  if (hasRequiredDataType) return dataType;
  hasRequiredDataType = 1, Object.defineProperty(dataType, "__esModule", { value: !0 }), dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
  const A = requireRules(), e = requireApplicability(), r = requireErrors(), o = requireCodegen(), B = requireUtil();
  var Q;
  (function(t) {
    t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
  })(Q || (dataType.DataType = Q = {}));
  function i(t) {
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
  dataType.getSchemaTypes = i;
  function s(t) {
    const D = Array.isArray(t) ? t : t ? [t] : [];
    if (D.every(A.isJSONType))
      return D;
    throw new Error("type must be JSONType or JSONType[]: " + D.join(","));
  }
  dataType.getJSONTypes = s;
  function a(t, D) {
    const { gen: c, data: d, opts: M } = t, K = n(D, M.coerceTypes), G = D.length > 0 && !(K.length === 0 && D.length === 1 && (0, e.schemaHasRulesForType)(t, D[0]));
    if (G) {
      const H = m(D, d, M.strictNumbers, Q.Wrong);
      c.if(H, () => {
        K.length ? E(t, D, K) : w(t);
      });
    }
    return G;
  }
  dataType.coerceAndCheckDataType = a;
  const g = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, D) {
    return D ? t.filter((c) => g.has(c) || D === "array" && c === "array") : [];
  }
  function E(t, D, c) {
    const { gen: d, data: M, opts: K } = t, G = d.let("dataType", (0, o._)`typeof ${M}`), H = d.let("coerced", (0, o._)`undefined`);
    K.coerceTypes === "array" && d.if((0, o._)`${G} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(G, (0, o._)`typeof ${M}`).if(m(D, M, K.strictNumbers), () => d.assign(H, M))), d.if((0, o._)`${H} !== undefined`);
    for (const F of c)
      (g.has(F) || F === "array" && K.coerceTypes === "array") && q(F);
    d.else(), w(t), d.endIf(), d.if((0, o._)`${H} !== undefined`, () => {
      d.assign(M, H), l(t, H);
    });
    function q(F) {
      switch (F) {
        case "string":
          d.elseIf((0, o._)`${G} == "number" || ${G} == "boolean"`).assign(H, (0, o._)`"" + ${M}`).elseIf((0, o._)`${M} === null`).assign(H, (0, o._)`""`);
          return;
        case "number":
          d.elseIf((0, o._)`${G} == "boolean" || ${M} === null
              || (${G} == "string" && ${M} && ${M} == +${M})`).assign(H, (0, o._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, o._)`${G} === "boolean" || ${M} === null
              || (${G} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(H, (0, o._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, o._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(H, !1).elseIf((0, o._)`${M} === "true" || ${M} === 1`).assign(H, !0);
          return;
        case "null":
          d.elseIf((0, o._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(H, null);
          return;
        case "array":
          d.elseIf((0, o._)`${G} === "string" || ${G} === "number"
              || ${G} === "boolean" || ${M} === null`).assign(H, (0, o._)`[${M}]`);
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
        K = G((0, o._)`!(${D} % 1) && !isNaN(${D})`);
        break;
      case "number":
        K = G();
        break;
      default:
        return (0, o._)`typeof ${D} ${M} ${t}`;
    }
    return d === Q.Correct ? K : (0, o.not)(K);
    function G(H = o.nil) {
      return (0, o.and)((0, o._)`typeof ${D} == "number"`, H, c ? (0, o._)`isFinite(${D})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function m(t, D, c, d) {
    if (t.length === 1)
      return f(t[0], D, c, d);
    let M;
    const K = (0, B.toHash)(t);
    if (K.array && K.object) {
      const G = (0, o._)`typeof ${D} != "object"`;
      M = K.null ? G : (0, o._)`!${D} || ${G}`, delete K.null, delete K.array, delete K.object;
    } else
      M = o.nil;
    K.number && delete K.integer;
    for (const G in K)
      M = (0, o.and)(M, f(G, D, c, d));
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
    const { gen: D, data: c, schema: d } = t, M = (0, B.schemaRefOrVal)(t, d, "type");
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
  function r(B, Q) {
    const { properties: i, items: s } = B.schema;
    if (Q === "object" && i)
      for (const a in i)
        o(B, a, i[a].default);
    else Q === "array" && Array.isArray(s) && s.forEach((a, g) => o(B, g, a.default));
  }
  defaults.assignDefaults = r;
  function o(B, Q, i) {
    const { gen: s, compositeRule: a, data: g, opts: n } = B;
    if (i === void 0)
      return;
    const E = (0, A._)`${g}${(0, A.getProperty)(Q)}`;
    if (a) {
      (0, e.checkStrictMode)(B, `default is ignored for: ${E}`);
      return;
    }
    let l = (0, A._)`${E} === undefined`;
    n.useDefaults === "empty" && (l = (0, A._)`${l} || ${E} === null || ${E} === ""`), s.if(l, (0, A._)`${E} = ${(0, A.stringify)(i)}`);
  }
  return defaults;
}
var keyword = {}, code = {}, hasRequiredCode;
function requireCode() {
  if (hasRequiredCode) return code;
  hasRequiredCode = 1, Object.defineProperty(code, "__esModule", { value: !0 }), code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
  const A = requireCodegen(), e = requireUtil(), r = requireNames(), o = requireUtil();
  function B(t, D) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, D, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${D}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = B;
  function Q({ gen: t, data: D, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((K) => (0, A.and)(n(t, D, K, c.ownProperties), (0, A._)`${M} = ${K}`)));
  }
  code.checkMissingProp = Q;
  function i(t, D) {
    t.setParams({ missingProperty: D }, !0), t.error();
  }
  code.reportMissingProp = i;
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
  function f({ schemaCode: t, data: D, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: K }, it: G }, H, q, F) {
    const S = F ? (0, A._)`${t}, ${D}, ${d}${M}` : D, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, K)],
      [r.default.parentData, G.parentData],
      [r.default.parentDataProperty, G.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    G.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...U)}`;
    return q !== A.nil ? (0, A._)`${H}.call(${q}, ${Y})` : (0, A._)`${H}(${Y})`;
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
      const H = D.let("valid", !0);
      return G(() => D.assign(H, !1)), H;
    }
    return D.var(K, !0), G(() => D.break()), K;
    function G(H) {
      const q = D.const("len", (0, A._)`${c}.length`);
      D.forRange("i", 0, q, (F) => {
        t.subschema({
          keyword: d,
          dataProp: F,
          dataPropType: e.Type.Num
        }, K), D.if((0, A.not)(K), H);
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
    const G = D.let("valid", !1), H = D.name("_valid");
    D.block(() => c.forEach((q, F) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: F,
        compositeRule: !0
      }, H);
      D.assign(G, (0, A._)`${G} || ${H}`), t.mergeValidEvaluated(S, H) || D.if((0, A.not)(G));
    })), t.result(G, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = C, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), o = requireErrors();
  function B(l, f) {
    const { gen: m, keyword: I, schema: w, parentSchema: C, it: t } = l, D = f.macro.call(t.self, w, C, t), c = g(m, I, D);
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
  keyword.macroKeywordCode = B;
  function Q(l, f) {
    var m;
    const { gen: I, keyword: w, schema: C, parentSchema: t, $data: D, it: c } = l;
    a(c, f);
    const d = !D && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = g(I, w, d), K = I.let("valid");
    l.block$data(K, G), l.ok((m = f.valid) !== null && m !== void 0 ? m : K);
    function G() {
      if (f.errors === !1)
        F(), f.modifying && i(l), S(() => l.error());
      else {
        const U = f.async ? H() : q();
        f.modifying && i(l), S(() => s(l, U));
      }
    }
    function H() {
      const U = I.let("ruleErrs", null);
      return I.try(() => F((0, A._)`await `), (Y) => I.assign(K, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => I.assign(U, (0, A._)`${Y}.errors`), () => I.throw(Y))), U;
    }
    function q() {
      const U = (0, A._)`${M}.errors`;
      return I.assign(U, null), F(A.nil), U;
    }
    function F(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, V = !("compile" in f && !D || f.schema === !1);
      I.assign(K, (0, A._)`${U}${(0, r.callValidateCode)(l, M, Y, V)}`, f.modifying);
    }
    function S(U) {
      var Y;
      I.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : K), U);
    }
  }
  keyword.funcKeywordCode = Q;
  function i(l) {
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
  function g(l, f, m) {
    if (m === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof m == "function" ? { ref: m } : { ref: m, code: (0, A.stringify)(m) });
  }
  function n(l, f, m = !1) {
    return !f.length || f.some((I) => I === "array" ? Array.isArray(l) : I === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == I || m && typeof l > "u");
  }
  keyword.validSchemaType = n;
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
  function r(Q, { keyword: i, schemaProp: s, schema: a, schemaPath: g, errSchemaPath: n, topSchemaRef: E }) {
    if (i !== void 0 && a !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (i !== void 0) {
      const l = Q.schema[i];
      return s === void 0 ? {
        schema: l,
        schemaPath: (0, A._)`${Q.schemaPath}${(0, A.getProperty)(i)}`,
        errSchemaPath: `${Q.errSchemaPath}/${i}`
      } : {
        schema: l[s],
        schemaPath: (0, A._)`${Q.schemaPath}${(0, A.getProperty)(i)}${(0, A.getProperty)(s)}`,
        errSchemaPath: `${Q.errSchemaPath}/${i}/${(0, e.escapeFragment)(s)}`
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
  function o(Q, i, { dataProp: s, dataPropType: a, data: g, dataTypes: n, propertyName: E }) {
    if (g !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = i;
    if (s !== void 0) {
      const { errorPath: m, dataPathArr: I, opts: w } = i, C = l.let("data", (0, A._)`${i.data}${(0, A.getProperty)(s)}`, !0);
      f(C), Q.errorPath = (0, A.str)`${m}${(0, e.getErrorPath)(s, a, w.jsPropertySyntax)}`, Q.parentDataProperty = (0, A._)`${s}`, Q.dataPathArr = [...I, Q.parentDataProperty];
    }
    if (g !== void 0) {
      const m = g instanceof A.Name ? g : l.let("data", g, !0);
      f(m), E !== void 0 && (Q.propertyName = E);
    }
    n && (Q.dataTypes = n);
    function f(m) {
      Q.data = m, Q.dataLevel = i.dataLevel + 1, Q.dataTypes = [], i.definedProperties = /* @__PURE__ */ new Set(), Q.parentData = i.data, Q.dataNames = [...i.dataNames, m];
    }
  }
  subschema.extendSubschemaData = o;
  function B(Q, { jtdDiscriminator: i, jtdMetadata: s, compositeRule: a, createErrors: g, allErrors: n }) {
    a !== void 0 && (Q.compositeRule = a), g !== void 0 && (Q.createErrors = g), n !== void 0 && (Q.allErrors = n), Q.jtdDiscriminator = i, Q.jtdMetadata = s;
  }
  return subschema.extendSubschemaMode = B, subschema;
}
var resolve = {}, fastDeepEqual, hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  return hasRequiredFastDeepEqual || (hasRequiredFastDeepEqual = 1, fastDeepEqual = function A(e, r) {
    if (e === r) return !0;
    if (e && r && typeof e == "object" && typeof r == "object") {
      if (e.constructor !== r.constructor) return !1;
      var o, B, Q;
      if (Array.isArray(e)) {
        if (o = e.length, o != r.length) return !1;
        for (B = o; B-- !== 0; )
          if (!A(e[B], r[B])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
      if (Q = Object.keys(e), o = Q.length, o !== Object.keys(r).length) return !1;
      for (B = o; B-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, Q[B])) return !1;
      for (B = o; B-- !== 0; ) {
        var i = Q[B];
        if (!A(e[i], r[i])) return !1;
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
  var A = jsonSchemaTraverse.exports = function(o, B, Q) {
    typeof B == "function" && (Q = B, B = {}), Q = B.cb || Q;
    var i = typeof Q == "function" ? Q : Q.pre || function() {
    }, s = Q.post || function() {
    };
    e(B, i, s, o, "", o);
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
  function e(o, B, Q, i, s, a, g, n, E, l) {
    if (i && typeof i == "object" && !Array.isArray(i)) {
      B(i, s, a, g, n, E, l);
      for (var f in i) {
        var m = i[f];
        if (Array.isArray(m)) {
          if (f in A.arrayKeywords)
            for (var I = 0; I < m.length; I++)
              e(o, B, Q, m[I], s + "/" + f + "/" + I, a, s, f, i, I);
        } else if (f in A.propsKeywords) {
          if (m && typeof m == "object")
            for (var w in m)
              e(o, B, Q, m[w], s + "/" + f + "/" + r(w), a, s, f, i, w);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, B, Q, m, s + "/" + f, a, s, f, i);
      }
      Q(i, s, a, g, n, E, l);
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
  function B(I, w = !0) {
    return typeof I == "boolean" ? !0 : w === !0 ? !i(I) : w ? s(I) <= w : !1;
  }
  resolve.inlineRef = B;
  const Q = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function i(I) {
    for (const w in I) {
      if (Q.has(w))
        return !0;
      const C = I[w];
      if (Array.isArray(C) && C.some(i) || typeof C == "object" && i(C))
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
  function m(I, w) {
    if (typeof I == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, D = E(I[C] || w), c = { "": D }, d = a(t, D, !1), M = {}, K = /* @__PURE__ */ new Set();
    return r(I, { allKeys: !0 }, (q, F, S, U) => {
      if (U === void 0)
        return;
      const Y = d + F;
      let V = c[U];
      typeof q[C] == "string" && (V = rA.call(this, q[C])), oA.call(this, q.$anchor), oA.call(this, q.$dynamicAnchor), c[F] = V;
      function rA(T) {
        const QA = this.opts.uriResolver.resolve;
        if (T = E(V ? QA(V, T) : T), K.has(T))
          throw H(T);
        K.add(T);
        let v = this.refs[T];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? G(q, v.schema, T) : T !== E(Y) && (T[0] === "#" ? (G(q, M[T], T), M[T] = q) : this.refs[T] = Y), T;
      }
      function oA(T) {
        if (typeof T == "string") {
          if (!f.test(T))
            throw new Error(`invalid anchor "${T}"`);
          rA.call(this, `#${T}`);
        }
      }
    }), M;
    function G(q, F, S) {
      if (F !== void 0 && !e(q, F))
        throw H(S);
    }
    function H(q) {
      return new Error(`reference "${q}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = m, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), B = requireDefaults(), Q = requireKeyword(), i = requireSubschema(), s = requireCodegen(), a = requireNames(), g = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (K(k), c(k))) {
      w(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: p, schema: O, schemaEnv: j, opts: b }, R) {
    b.code.es5 ? k.func(p, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(O, b)}`), I(k, b), k.code(R);
    }) : k.func(p, (0, s._)`${a.default.data}, ${m(b)}`, j.$async, () => k.code(t(O, b)).code(R));
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
    const { schema: p, opts: O, gen: j } = k;
    f(k, () => {
      O.$comment && p.$comment && U(k), q(k), j.let(a.default.vErrors, null), j.let(a.default.errors, 0), O.unevaluated && C(k), G(k), Y(k);
    });
  }
  function C(k) {
    const { gen: p, validateName: O } = k;
    k.evaluated = p.const("evaluated", (0, s._)`${O}.evaluated`), p.if((0, s._)`${k.evaluated}.dynamicProps`, () => p.assign((0, s._)`${k.evaluated}.props`, (0, s._)`undefined`)), p.if((0, s._)`${k.evaluated}.dynamicItems`, () => p.assign((0, s._)`${k.evaluated}.items`, (0, s._)`undefined`));
  }
  function t(k, p) {
    const O = typeof k == "object" && k[p.schemaId];
    return O && (p.code.source || p.code.process) ? (0, s._)`/*# sourceURL=${O} */` : s.nil;
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
    for (const O in k)
      if (p.RULES.all[O])
        return !0;
    return !1;
  }
  function d(k) {
    return typeof k.schema != "boolean";
  }
  function M(k, p) {
    const { schema: O, gen: j, opts: b } = k;
    b.$comment && O.$comment && U(k), F(k), S(k);
    const R = j.const("_errs", a.default.errors);
    G(k, R), j.var(p, (0, s._)`${R} === ${a.default.errors}`);
  }
  function K(k) {
    (0, n.checkUnknownRules)(k), H(k);
  }
  function G(k, p) {
    if (k.opts.jtd)
      return rA(k, [], !1, p);
    const O = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, O);
    rA(k, O, !j, p);
  }
  function H(k) {
    const { schema: p, errSchemaPath: O, opts: j, self: b } = k;
    p.$ref && j.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(p, b.RULES) && b.logger.warn(`$ref: keywords ignored in schema at path "${O}"`);
  }
  function q(k) {
    const { schema: p, opts: O } = k;
    p.default !== void 0 && O.useDefaults && O.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function F(k) {
    const p = k.schema[k.opts.schemaId];
    p && (k.baseId = (0, g.resolveUrl)(k.opts.uriResolver, k.baseId, p));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: p, schema: O, errSchemaPath: j, opts: b }) {
    const R = O.$comment;
    if (b.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof b.$comment == "function") {
      const x = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: p.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${x}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: p, schemaEnv: O, validateName: j, ValidationError: b, opts: R } = k;
    O.$async ? p.if((0, s._)`${a.default.errors} === 0`, () => p.return(a.default.data), () => p.throw((0, s._)`new ${b}(${a.default.vErrors})`)) : (p.assign((0, s._)`${j}.errors`, a.default.vErrors), R.unevaluated && V(k), p.return((0, s._)`${a.default.errors} === 0`));
  }
  function V({ gen: k, evaluated: p, props: O, items: j }) {
    O instanceof s.Name && k.assign((0, s._)`${p}.props`, O), j instanceof s.Name && k.assign((0, s._)`${p}.items`, j);
  }
  function rA(k, p, O, j) {
    const { gen: b, schema: R, data: x, allErrors: eA, opts: W, self: $ } = k, { RULES: X } = $;
    if (R.$ref && (W.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(R, X))) {
      b.block(() => L(k, "$ref", X.all.$ref.definition));
      return;
    }
    W.jtd || T(k, p), b.block(() => {
      for (const AA of X.rules)
        BA(AA);
      BA(X.post);
    });
    function BA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (b.if((0, o.checkDataType)(AA.type, x, W.strictNumbers)), oA(k, AA), p.length === 1 && p[0] === AA.type && O && (b.else(), (0, o.reportTypeError)(k)), b.endIf()) : oA(k, AA), eA || b.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function oA(k, p) {
    const { gen: O, schema: j, opts: { useDefaults: b } } = k;
    b && (0, B.assignDefaults)(k, p.type), O.block(() => {
      for (const R of p.rules)
        (0, r.shouldUseRule)(j, R) && L(k, R.keyword, R.definition, p.type);
    });
  }
  function T(k, p) {
    k.schemaEnv.meta || !k.opts.strictTypes || (QA(k, p), k.opts.allowUnionTypes || v(k, p), P(k, k.dataTypes));
  }
  function QA(k, p) {
    if (p.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = p;
        return;
      }
      p.forEach((O) => {
        y(k.dataTypes, O) || h(k, `type "${O}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, p);
    }
  }
  function v(k, p) {
    p.length > 1 && !(p.length === 2 && p.includes("null")) && h(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, p) {
    const O = k.self.RULES.all;
    for (const j in O) {
      const b = O[j];
      if (typeof b == "object" && (0, r.shouldUseRule)(k.schema, b)) {
        const { type: R } = b.definition;
        R.length && !R.some((x) => _(p, x)) && h(k, `missing type "${R.join(",")}" for keyword "${j}"`);
      }
    }
  }
  function _(k, p) {
    return k.includes(p) || p === "number" && k.includes("integer");
  }
  function y(k, p) {
    return k.includes(p) || p === "integer" && k.includes("number");
  }
  function u(k, p) {
    const O = [];
    for (const j of k.dataTypes)
      y(p, j) ? O.push(j) : p.includes("integer") && j === "number" && O.push("integer");
    k.dataTypes = O;
  }
  function h(k, p) {
    const O = k.schemaEnv.baseId + k.errSchemaPath;
    p += ` at "${O}" (strictTypes)`, (0, n.checkStrictMode)(k, p, k.opts.strictTypes);
  }
  class N {
    constructor(p, O, j) {
      if ((0, Q.validateKeywordUsage)(p, O, j), this.gen = p.gen, this.allErrors = p.allErrors, this.keyword = j, this.data = p.data, this.schema = p.schema[j], this.$data = O.$data && p.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(p, this.schema, j, this.$data), this.schemaType = O.schemaType, this.parentSchema = p.schema, this.params = {}, this.it = p, this.def = O, this.$data)
        this.schemaCode = p.gen.const("vSchema", Z(this.$data, p));
      else if (this.schemaCode = this.schemaValue, !(0, Q.validSchemaType)(this.schema, O.schemaType, O.allowUndefined))
        throw new Error(`${j} value must be ${JSON.stringify(O.schemaType)}`);
      ("code" in O ? O.trackErrors : O.errors !== !1) && (this.errsCount = p.gen.const("_errs", a.default.errors));
    }
    result(p, O, j) {
      this.failResult((0, s.not)(p), O, j);
    }
    failResult(p, O, j) {
      this.gen.if(p), j ? j() : this.error(), O ? (this.gen.else(), O(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(p, O) {
      this.failResult((0, s.not)(p), void 0, O);
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
      const { schemaCode: O } = this;
      this.fail((0, s._)`${O} !== undefined && (${(0, s.or)(this.invalid$data(), p)})`);
    }
    error(p, O, j) {
      if (O) {
        this.setParams(O), this._error(p, j), this.setParams({});
        return;
      }
      this._error(p, j);
    }
    _error(p, O) {
      (p ? E.reportExtraError : E.reportError)(this, this.def.error, O);
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
    setParams(p, O) {
      O ? Object.assign(this.params, p) : this.params = p;
    }
    block$data(p, O, j = s.nil) {
      this.gen.block(() => {
        this.check$data(p, j), O();
      });
    }
    check$data(p = s.nil, O = s.nil) {
      if (!this.$data)
        return;
      const { gen: j, schemaCode: b, schemaType: R, def: x } = this;
      j.if((0, s.or)((0, s._)`${b} === undefined`, O)), p !== s.nil && j.assign(p, !0), (R.length || x.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), p !== s.nil && j.assign(p, !1)), j.else();
    }
    invalid$data() {
      const { gen: p, schemaCode: O, schemaType: j, def: b, it: R } = this;
      return (0, s.or)(x(), eA());
      function x() {
        if (j.length) {
          if (!(O instanceof s.Name))
            throw new Error("ajv implementation error");
          const W = Array.isArray(j) ? j : [j];
          return (0, s._)`${(0, o.checkDataTypes)(W, O, R.opts.strictNumbers, o.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (b.validateSchema) {
          const W = p.scopeValue("validate$data", { ref: b.validateSchema });
          return (0, s._)`!${W}(${O})`;
        }
        return s.nil;
      }
    }
    subschema(p, O) {
      const j = (0, i.getSubschema)(this.it, p);
      (0, i.extendSubschemaData)(j, this.it, p), (0, i.extendSubschemaMode)(j, p);
      const b = { ...this.it, ...j, items: void 0, props: void 0 };
      return D(b, O), b;
    }
    mergeEvaluated(p, O) {
      const { it: j, gen: b } = this;
      j.opts.unevaluated && (j.props !== !0 && p.props !== void 0 && (j.props = n.mergeEvaluated.props(b, p.props, j.props, O)), j.items !== !0 && p.items !== void 0 && (j.items = n.mergeEvaluated.items(b, p.items, j.items, O)));
    }
    mergeValidEvaluated(p, O) {
      const { it: j, gen: b } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return b.if(O, () => this.mergeEvaluated(p, s.Name)), !0;
    }
  }
  validate.KeywordCxt = N;
  function L(k, p, O, j) {
    const b = new N(k, O, p);
    "code" in O ? O.code(b, j) : b.$data && O.validate ? (0, Q.funcKeywordCode)(b, O) : "macro" in O ? (0, Q.macroKeywordCode)(b, O) : (O.compile || O.validate) && (0, Q.funcKeywordCode)(b, O);
  }
  const z = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: p, dataNames: O, dataPathArr: j }) {
    let b, R;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!z.test(k))
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
      if (R = O[p - X], !b)
        return R;
    }
    let x = R;
    const eA = b.split("/");
    for (const $ of eA)
      $ && (R = (0, s._)`${R}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, x = (0, s._)`${x} && ${R}`);
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
    constructor(o, B, Q, i) {
      super(i || `can't resolve reference ${Q} from id ${B}`), this.missingRef = (0, A.resolveUrl)(o, B, Q), this.missingSchema = (0, A.normalizeId)((0, A.getFullPath)(o, this.missingRef));
    }
  }
  return ref_error.default = e, ref_error;
}
var compile = {}, hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1, Object.defineProperty(compile, "__esModule", { value: !0 }), compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
  const A = requireCodegen(), e = requireValidation_error(), r = requireNames(), o = requireResolve(), B = requireUtil(), Q = requireValidate();
  class i {
    constructor(C) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let D;
      typeof C.schema == "object" && (D = C.schema), this.schema = C.schema, this.schemaId = C.schemaId, this.root = C.root || this, this.baseId = (t = C.baseId) !== null && t !== void 0 ? t : (0, o.normalizeId)(D?.[C.schemaId || "$id"]), this.schemaPath = C.schemaPath, this.localRefs = C.localRefs, this.meta = C.meta, this.$async = D?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = i;
  function s(w) {
    const C = n.call(this, w);
    if (C)
      return C;
    const t = (0, o.getFullPath)(this.opts.uriResolver, w.root.baseId), { es5: D, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: D, lines: c, ownProperties: d });
    let K;
    w.$async && (K = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const G = M.scopeName("validate");
    w.validateName = G;
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
      validateName: G,
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
    let q;
    try {
      this._compilations.add(w), (0, Q.validateFunctionCode)(H), M.optimize(this.opts.code.optimize);
      const F = M.toString();
      q = `${M.scopeRefs(r.default.scope)}return ${F}`, this.opts.code.process && (q = this.opts.code.process(q, w));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, q)(this, this.scope.get());
      if (this.scope.value(G, { ref: U }), U.errors = null, U.schema = w.schema, U.schemaEnv = w, w.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: G, validateCode: F, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: V } = H;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: V instanceof A.Name ? void 0 : V,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: V instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return w.validate = U, w;
    } catch (F) {
      throw delete w.validate, delete w.validateName, q && this.logger.error("Error compiling schema, function code:", q), F;
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
      M && (d = new i({ schema: M, schemaId: K, root: w, baseId: C }));
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
      const K = f.call(this, w, M);
      return typeof K?.schema != "object" ? void 0 : I.call(this, t, K);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(C)) {
        const { schema: K } = M, { schemaId: G } = this.opts, H = K[G];
        return H && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, H)), new i({ schema: K, schemaId: G, root: w, baseId: c });
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
      const G = t[(0, B.unescapeFragment)(K)];
      if (G === void 0)
        return;
      t = G;
      const H = typeof t == "object" && t[this.opts.schemaId];
      !m.has(K) && H && (C = (0, o.resolveUrl)(this.opts.uriResolver, C, H));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, B.schemaHasRulesButRef)(t, this.RULES)) {
      const K = (0, o.resolveUrl)(this.opts.uriResolver, C, t.$ref);
      d = f.call(this, D, K);
    }
    const { schemaId: M } = this.opts;
    if (d = d || new i({ schema: t, schemaId: M, root: D, baseId: C }), d.schema !== d.root.schema)
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
    return C ? { host: i(C, "."), isIPV4: !0 } : { host: I, isIPV4: !1 };
  }
  function o(I, w = !1) {
    let C = "", t = !0;
    for (const D of I) {
      if (A[D] === void 0) return;
      D !== "0" && t === !0 && (t = !1), t || (C += D);
    }
    return w && C.length === 0 && (C = "0"), C;
  }
  function B(I) {
    let w = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], D = [];
    let c = !1, d = !1, M = !1;
    function K() {
      if (D.length) {
        if (c === !1) {
          const G = o(D);
          if (G !== void 0)
            t.push(G);
          else
            return C.error = !0, !1;
        }
        D.length = 0;
      }
      return !0;
    }
    for (let G = 0; G < I.length; G++) {
      const H = I[G];
      if (!(H === "[" || H === "]"))
        if (H === ":") {
          if (d === !0 && (M = !0), !K())
            break;
          if (w++, t.push(":"), w > 7) {
            C.error = !0;
            break;
          }
          G - 1 >= 0 && I[G - 1] === ":" && (d = !0);
          continue;
        } else if (H === "%") {
          if (!K())
            break;
          c = !0;
        } else {
          D.push(H);
          continue;
        }
    }
    return D.length && (c ? C.zone = D.join("") : M ? t.push(D.join("")) : t.push(o(D))), C.address = t.join(""), C;
  }
  function Q(I) {
    if (s(I, ":") < 2)
      return { host: I, isIPV6: !1 };
    const w = B(I);
    if (w.error)
      return { host: I, isIPV6: !1 };
    {
      let C = w.address, t = w.address;
      return w.zone && (C += "%" + w.zone, t += "%25" + w.zone), { host: C, escapedHost: t, isIPV6: !0 };
    }
  }
  function i(I, w) {
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
  function B(t) {
    const D = String(t.scheme).toLowerCase() === "https";
    return (t.port === (D ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function Q(t) {
    return t.secure = r(t), t.resourceName = (t.path || "/") + (t.query ? "?" + t.query : ""), t.path = void 0, t.query = void 0, t;
  }
  function i(t) {
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
    const G = t, H = t.nss;
    return G.path = `${d || D.nid}:${H}`, D.skipEscape = !0, G;
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
    serialize: B
  }, l = {
    scheme: "https",
    domainHost: E.domainHost,
    parse: o,
    serialize: B
  }, f = {
    scheme: "ws",
    domainHost: !0,
    parse: Q,
    serialize: i
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
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: o, normalizeComponentEncoding: B } = requireUtils(), Q = requireSchemes();
  function i(w, C) {
    return typeof w == "string" ? w = n(m(w, C), C) : typeof w == "object" && (w = m(n(w, C), C)), w;
  }
  function s(w, C, t) {
    const D = Object.assign({ scheme: "null" }, t), c = a(m(w, D), m(C, D), D, !0);
    return n(c, { ...D, skipEscape: !0 });
  }
  function a(w, C, t, D) {
    const c = {};
    return D || (w = m(n(w, t), t), C = m(n(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((w.userinfo !== void 0 || w.host !== void 0 || w.port !== void 0) && !w.path ? c.path = "/" + C.path : w.path ? c.path = w.path.slice(0, w.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = w.path, C.query !== void 0 ? c.query = C.query : c.query = w.query), c.userinfo = w.userinfo, c.host = w.host, c.port = w.port), c.scheme = w.scheme), c.fragment = C.fragment, c;
  }
  function g(w, C, t) {
    return typeof w == "string" ? (w = unescape(w), w = n(B(m(w, t), !0), { ...t, skipEscape: !0 })) : typeof w == "object" && (w = n(B(w, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = n(B(m(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = n(B(C, !0), { ...t, skipEscape: !0 })), w.toLowerCase() === C.toLowerCase();
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
        const G = e(D.host);
        if (G.isIPV4 === !1) {
          const H = A(G.host);
          D.host = H.host.toLowerCase(), d = H.isIPV6;
        } else
          D.host = G.host, d = !0;
      }
      D.scheme === void 0 && D.userinfo === void 0 && D.host === void 0 && D.port === void 0 && !D.path && D.query === void 0 ? D.reference = "same-document" : D.scheme === void 0 ? D.reference = "relative" : D.fragment === void 0 ? D.reference = "absolute" : D.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== D.reference && (D.error = D.error || "URI is not a " + t.reference + " reference.");
      const K = Q[(t.scheme || D.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!K || !K.unicodeSupport) && D.host && (t.domainHost || K && K.domainHost) && d === !1 && l(D.host))
        try {
          D.host = URL.domainToASCII(D.host.toLowerCase());
        } catch (G) {
          D.error = D.error || "Host's domain name can not be converted to ASCII: " + G;
        }
      (!K || K && !K.skipNormalize) && (c && D.scheme !== void 0 && (D.scheme = unescape(D.scheme)), c && D.host !== void 0 && (D.host = unescape(D.host)), D.path && D.path.length && (D.path = escape(unescape(D.path))), D.fragment && D.fragment.length && (D.fragment = encodeURI(decodeURIComponent(D.fragment)))), K && K.parse && K.parse(D, t);
    } else
      D.error = D.error || "URI can not be parsed.";
    return D;
  }
  const I = {
    SCHEMES: Q,
    normalize: i,
    resolve: s,
    resolveComponents: a,
    equal: g,
    serialize: n,
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
    const o = requireValidation_error(), B = requireRef_error(), Q = requireRules(), i = requireCompile(), s = requireCodegen(), a = requireResolve(), g = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, P) => new RegExp(v, P);
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
    function D(v) {
      var P, _, y, u, h, N, L, z, J, Z, k, p, O, j, b, R, x, eA, W, $, X, BA, AA, tA, sA;
      const iA = v.strict, aA = (P = v.code) === null || P === void 0 ? void 0 : P.optimize, gA = aA === !0 || aA === void 0 ? 1 : aA || 0, wA = (y = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && y !== void 0 ? y : f, DA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (N = (h = v.strictSchema) !== null && h !== void 0 ? h : iA) !== null && N !== void 0 ? N : !0,
        strictNumbers: (z = (L = v.strictNumbers) !== null && L !== void 0 ? L : iA) !== null && z !== void 0 ? z : !0,
        strictTypes: (Z = (J = v.strictTypes) !== null && J !== void 0 ? J : iA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (p = (k = v.strictTuples) !== null && k !== void 0 ? k : iA) !== null && p !== void 0 ? p : "log",
        strictRequired: (j = (O = v.strictRequired) !== null && O !== void 0 ? O : iA) !== null && j !== void 0 ? j : !1,
        code: v.code ? { ...v.code, optimize: gA, regExp: wA } : { optimize: gA, regExp: wA },
        loopRequired: (b = v.loopRequired) !== null && b !== void 0 ? b : t,
        loopEnum: (R = v.loopEnum) !== null && R !== void 0 ? R : t,
        meta: (x = v.meta) !== null && x !== void 0 ? x : !0,
        messages: (eA = v.messages) !== null && eA !== void 0 ? eA : !0,
        inlineRefs: (W = v.inlineRefs) !== null && W !== void 0 ? W : !0,
        schemaId: ($ = v.schemaId) !== null && $ !== void 0 ? $ : "$id",
        addUsedSchema: (X = v.addUsedSchema) !== null && X !== void 0 ? X : !0,
        validateSchema: (BA = v.validateSchema) !== null && BA !== void 0 ? BA : !0,
        validateFormats: (AA = v.validateFormats) !== null && AA !== void 0 ? AA : !0,
        unicodeRegExp: (tA = v.unicodeRegExp) !== null && tA !== void 0 ? tA : !0,
        int32range: (sA = v.int32range) !== null && sA !== void 0 ? sA : !0,
        uriResolver: DA
      };
    }
    class c {
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...D(P) };
        const { es5: _, lines: y } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: I, es5: _, lines: y }), this.logger = S(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, w, P, "NOT SUPPORTED"), d.call(this, C, P, "DEPRECATED", "warn"), this._metaOpts = q.call(this), P.formats && G.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && H.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), K.call(this), P.validateFormats = u;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: P, meta: _, schemaId: y } = this.opts;
        let u = E;
        y === "id" && (u = { ...E }, u.id = u.$id, delete u.$id), _ && P && this.addMetaSchema(u, u[y], !1);
      }
      defaultMeta() {
        const { meta: P, schemaId: _ } = this.opts;
        return this.opts.defaultMeta = typeof P == "object" ? P[_] || P : void 0;
      }
      validate(P, _) {
        let y;
        if (typeof P == "string") {
          if (y = this.getSchema(P), !y)
            throw new Error(`no schema with key or ref "${P}"`);
        } else
          y = this.compile(P);
        const u = y(_);
        return "$async" in y || (this.errors = y.errors), u;
      }
      compile(P, _) {
        const y = this._addSchema(P, _);
        return y.validate || this._compileSchemaEnv(y);
      }
      compileAsync(P, _) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: y } = this.opts;
        return u.call(this, P, _);
        async function u(Z, k) {
          await h.call(this, Z.$schema);
          const p = this._addSchema(Z, k);
          return p.validate || N.call(this, p);
        }
        async function h(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function N(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof B.default))
              throw k;
            return L.call(this, k), await z.call(this, k.missingSchema), N.call(this, Z);
          }
        }
        function L({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function z(Z) {
          const k = await J.call(this, Z);
          this.refs[Z] || await h.call(this, k.$schema), this.refs[Z] || this.addSchema(k, Z, _);
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
      addSchema(P, _, y, u = this.opts.validateSchema) {
        if (Array.isArray(P)) {
          for (const N of P)
            this.addSchema(N, void 0, y, u);
          return this;
        }
        let h;
        if (typeof P == "object") {
          const { schemaId: N } = this.opts;
          if (h = P[N], h !== void 0 && typeof h != "string")
            throw new Error(`schema ${N} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || h), this._checkUnique(_), this.schemas[_] = this._addSchema(P, y, _, u, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(P, _, y = this.opts.validateSchema) {
        return this.addSchema(P, _, !0, y), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(P, _) {
        if (typeof P == "boolean")
          return !0;
        let y;
        if (y = P.$schema, y !== void 0 && typeof y != "string")
          throw new Error("$schema must be a string");
        if (y = y || this.opts.defaultMeta || this.defaultMeta(), !y)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const u = this.validate(y, P);
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
          const { schemaId: y } = this.opts, u = new i.SchemaEnv({ schema: {}, schemaId: y });
          if (_ = i.resolveSchema.call(this, u, P), !_)
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
            let y = P[this.opts.schemaId];
            return y && (y = (0, a.normalizeId)(y), delete this.schemas[y], delete this.refs[y]), this;
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
        let y;
        if (typeof P == "string")
          y = P, typeof _ == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), _.keyword = y);
        else if (typeof P == "object" && _ === void 0) {
          if (_ = P, y = _.keyword, Array.isArray(y) && !y.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (Y.call(this, y, _), !_)
          return (0, n.eachItem)(y, (h) => V.call(this, h)), this;
        oA.call(this, _);
        const u = {
          ..._,
          type: (0, g.getJSONTypes)(_.type),
          schemaType: (0, g.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(y, u.type.length === 0 ? (h) => V.call(this, h, u) : (h) => u.type.forEach((N) => V.call(this, h, u, N))), this;
      }
      getKeyword(P) {
        const _ = this.RULES.all[P];
        return typeof _ == "object" ? _.definition : !!_;
      }
      // Remove keyword
      removeKeyword(P) {
        const { RULES: _ } = this;
        delete _.keywords[P], delete _.all[P];
        for (const y of _.rules) {
          const u = y.rules.findIndex((h) => h.keyword === P);
          u >= 0 && y.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[P] = _, this;
      }
      errorsText(P = this.errors, { separator: _ = ", ", dataVar: y = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${y}${u.instancePath} ${u.message}`).reduce((u, h) => u + _ + h);
      }
      $dataMetaSchema(P, _) {
        const y = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of _) {
          const h = u.split("/").slice(1);
          let N = P;
          for (const L of h)
            N = N[L];
          for (const L in y) {
            const z = y[L];
            if (typeof z != "object")
              continue;
            const { $data: J } = z.definition, Z = N[L];
            J && Z && (N[L] = QA(Z));
          }
        }
        return P;
      }
      _removeAllSchemas(P, _) {
        for (const y in P) {
          const u = P[y];
          (!_ || _.test(y)) && (typeof u == "string" ? delete P[y] : u && !u.meta && (this._cache.delete(u.schema), delete P[y]));
        }
      }
      _addSchema(P, _, y, u = this.opts.validateSchema, h = this.opts.addUsedSchema) {
        let N;
        const { schemaId: L } = this.opts;
        if (typeof P == "object")
          N = P[L];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof P != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let z = this._cache.get(P);
        if (z !== void 0)
          return z;
        y = (0, a.normalizeId)(N || y);
        const J = a.getSchemaRefs.call(this, P, y);
        return z = new i.SchemaEnv({ schema: P, schemaId: L, meta: _, baseId: y, localRefs: J }), this._cache.set(z.schema, z), h && !y.startsWith("#") && (y && this._checkUnique(y), this.refs[y] = z), u && this.validateSchema(P, !0), z;
      }
      _checkUnique(P) {
        if (this.schemas[P] || this.refs[P])
          throw new Error(`schema with key or id "${P}" already exists`);
      }
      _compileSchemaEnv(P) {
        if (P.meta ? this._compileMetaSchema(P) : i.compileSchema.call(this, P), !P.validate)
          throw new Error("ajv implementation error");
        return P.validate;
      }
      _compileMetaSchema(P) {
        const _ = this.opts;
        this.opts = this._metaOpts;
        try {
          i.compileSchema.call(this, P);
        } finally {
          this.opts = _;
        }
      }
    }
    c.ValidationError = o.default, c.MissingRefError = B.default, A.default = c;
    function d(v, P, _, y = "error") {
      for (const u in v) {
        const h = u;
        h in P && this.logger[y](`${_}: option ${u}. ${v[h]}`);
      }
    }
    function M(v) {
      return v = (0, a.normalizeId)(v), this.schemas[v] || this.refs[v];
    }
    function K() {
      const v = this.opts.schemas;
      if (v)
        if (Array.isArray(v))
          this.addSchema(v);
        else
          for (const P in v)
            this.addSchema(v[P], P);
    }
    function G() {
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
      for (const P of m)
        delete v[P];
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
    function Y(v, P) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (y) => {
        if (_.keywords[y])
          throw new Error(`Keyword ${y} is already defined`);
        if (!U.test(y))
          throw new Error(`Keyword ${y} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function V(v, P, _) {
      var y;
      const u = P?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: h } = this;
      let N = u ? h.post : h.rules.find(({ type: z }) => z === _);
      if (N || (N = { type: _, rules: [] }, h.rules.push(N)), h.keywords[v] = !0, !P)
        return;
      const L = {
        keyword: v,
        definition: {
          ...P,
          type: (0, g.getJSONTypes)(P.type),
          schemaType: (0, g.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, N, L, P.before) : N.rules.push(L), h.all[v] = L, (y = P.implements) === null || y === void 0 || y.forEach((z) => this.addKeyword(z));
    }
    function rA(v, P, _) {
      const y = v.rules.findIndex((u) => u.keyword === _);
      y >= 0 ? v.rules.splice(y, 0, P) : (v.rules.push(P), this.logger.warn(`rule ${_} is not defined`));
    }
    function oA(v) {
      let { metaSchema: P } = v;
      P !== void 0 && (v.$data && this.opts.$data && (P = QA(P)), v.validateSchema = this.compile(P, !0));
    }
    const T = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function QA(v) {
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
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), o = requireNames(), B = requireCompile(), Q = requireUtil(), i = {
    keyword: "$ref",
    schemaType: "string",
    code(g) {
      const { gen: n, schema: E, it: l } = g, { baseId: f, schemaEnv: m, validateName: I, opts: w, self: C } = l, { root: t } = m;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const D = B.resolveRef.call(C, t, f, E);
      if (D === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (D instanceof B.SchemaEnv)
        return d(D);
      return M(D);
      function c() {
        if (m === t)
          return a(g, I, m, m.$async);
        const K = n.scopeValue("root", { ref: t });
        return a(g, (0, r._)`${K}.validate`, t, t.$async);
      }
      function d(K) {
        const G = s(g, K);
        a(g, G, K, K.$async);
      }
      function M(K) {
        const G = n.scopeValue("schema", w.code.source === !0 ? { ref: K, code: (0, r.stringify)(K) } : { ref: K }), H = n.name("valid"), q = g.subschema({
          schema: K,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: G,
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
    const { gen: f, it: m } = g, { allErrors: I, schemaEnv: w, opts: C } = m, t = C.passContext ? o.default.this : r.nil;
    l ? D() : c();
    function D() {
      if (!w.$async)
        throw new Error("async schema referenced by sync schema");
      const K = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(g, n, t)}`), M(n), I || f.assign(K, !0);
      }, (G) => {
        f.if((0, r._)`!(${G} instanceof ${m.ValidationError})`, () => f.throw(G)), d(G), I || f.assign(K, !1);
      }), g.ok(K);
    }
    function c() {
      g.result((0, e.callValidateCode)(g, n, t), () => M(n), () => d(n));
    }
    function d(K) {
      const G = (0, r._)`${K}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${G} : ${o.default.vErrors}.concat(${G})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(K) {
      var G;
      if (!m.opts.unevaluated)
        return;
      const H = (G = E?.validate) === null || G === void 0 ? void 0 : G.evaluated;
      if (m.props !== !0)
        if (H && !H.dynamicProps)
          H.props !== void 0 && (m.props = Q.mergeEvaluated.props(f, H.props, m.props));
        else {
          const q = f.var("props", (0, r._)`${K}.evaluated.props`);
          m.props = Q.mergeEvaluated.props(f, q, m.props, r.Name);
        }
      if (m.items !== !0)
        if (H && !H.dynamicItems)
          H.items !== void 0 && (m.items = Q.mergeEvaluated.items(f, H.items, m.items));
        else {
          const q = f.var("items", (0, r._)`${K}.evaluated.items`);
          m.items = Q.mergeEvaluated.items(f, q, m.items, r.Name);
        }
    }
  }
  return ref.callRef = a, ref.default = i, ref;
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
    message: ({ keyword: Q, schemaCode: i }) => (0, A.str)`must be ${r[Q].okStr} ${i}`,
    params: ({ keyword: Q, schemaCode: i }) => (0, A._)`{comparison: ${r[Q].okStr}, limit: ${i}}`
  }, B = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: o,
    code(Q) {
      const { keyword: i, data: s, schemaCode: a } = Q;
      Q.fail$data((0, A._)`${s} ${r[i].fail} ${a} || isNaN(${s})`);
    }
  };
  return limitNumber.default = B, limitNumber;
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
      const { gen: B, data: Q, schemaCode: i, it: s } = o, a = s.opts.multipleOfPrecision, g = B.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${g}) - ${g}) > 1e-${a}` : (0, A._)`${g} !== parseInt(${g})`;
      o.fail$data((0, A._)`(${i} === 0 || (${g} = ${Q}/${i}, ${n}))`);
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
    let o = 0, B = 0, Q;
    for (; B < r; )
      o++, Q = e.charCodeAt(B++), Q >= 55296 && Q <= 56319 && B < r && (Q = e.charCodeAt(B), (Q & 64512) === 56320 && B++);
    return o;
  }
  return ucs2length.default = A, A.code = 'require("ajv/dist/runtime/ucs2length").default', ucs2length;
}
var hasRequiredLimitLength;
function requireLimitLength() {
  if (hasRequiredLimitLength) return limitLength;
  hasRequiredLimitLength = 1, Object.defineProperty(limitLength, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireUcs2length(), B = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: Q, schemaCode: i }) {
        const s = Q === "maxLength" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${s} than ${i} characters`;
      },
      params: ({ schemaCode: Q }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { keyword: i, data: s, schemaCode: a, it: g } = Q, n = i === "maxLength" ? A.operators.GT : A.operators.LT, E = g.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(Q.gen, r.default)}(${s})`;
      Q.fail$data((0, A._)`${E} ${n} ${a}`);
    }
  };
  return limitLength.default = B, limitLength;
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
      message: ({ schemaCode: B }) => (0, e.str)`must match pattern "${B}"`,
      params: ({ schemaCode: B }) => (0, e._)`{pattern: ${B}}`
    },
    code(B) {
      const { data: Q, $data: i, schema: s, schemaCode: a, it: g } = B, n = g.opts.unicodeRegExp ? "u" : "", E = i ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(B, s);
      B.fail$data((0, e._)`!${E}.test(${Q})`);
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
      message({ keyword: o, schemaCode: B }) {
        const Q = o === "maxProperties" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${Q} than ${B} properties`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: B, data: Q, schemaCode: i } = o, s = B === "maxProperties" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`Object.keys(${Q}).length ${s} ${i}`);
    }
  };
  return limitProperties.default = r, limitProperties;
}
var required = {}, hasRequiredRequired;
function requireRequired() {
  if (hasRequiredRequired) return required;
  hasRequiredRequired = 1, Object.defineProperty(required, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), B = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: Q } }) => (0, e.str)`must have required property '${Q}'`,
      params: ({ params: { missingProperty: Q } }) => (0, e._)`{missingProperty: ${Q}}`
    },
    code(Q) {
      const { gen: i, schema: s, schemaCode: a, data: g, $data: n, it: E } = Q, { opts: l } = E;
      if (!n && s.length === 0)
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
        if (f || n)
          Q.block$data(e.nil, w);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(Q, t);
      }
      function I() {
        const t = i.let("missing");
        if (f || n) {
          const D = i.let("valid", !0);
          Q.block$data(D, () => C(t, D)), Q.ok(D);
        } else
          i.if((0, A.checkMissingProp)(Q, s, t)), (0, A.reportMissingProp)(Q, t), i.else();
      }
      function w() {
        i.forOf("prop", a, (t) => {
          Q.setParams({ missingProperty: t }), i.if((0, A.noPropertyInData)(i, g, t, l.ownProperties), () => Q.error());
        });
      }
      function C(t, D) {
        Q.setParams({ missingProperty: t }), i.forOf(t, a, () => {
          i.assign(D, (0, A.propertyInData)(i, g, t, l.ownProperties)), i.if((0, e.not)(D), () => {
            Q.error(), i.break();
          });
        }, e.nil);
      }
    }
  };
  return required.default = B, required;
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
      message({ keyword: o, schemaCode: B }) {
        const Q = o === "maxItems" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${Q} than ${B} items`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: B, data: Q, schemaCode: i } = o, s = B === "maxItems" ? A.operators.GT : A.operators.LT;
      o.fail$data((0, A._)`${Q}.length ${s} ${i}`);
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
      message: ({ params: { i, j: s } }) => (0, e.str)`must NOT have duplicate items (items ## ${s} and ${i} are identical)`,
      params: ({ params: { i, j: s } }) => (0, e._)`{i: ${i}, j: ${s}}`
    },
    code(i) {
      const { gen: s, data: a, $data: g, schema: n, parentSchema: E, schemaCode: l, it: f } = i;
      if (!g && !n)
        return;
      const m = s.let("valid"), I = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      i.block$data(m, w, (0, e._)`${l} === false`), i.ok(m);
      function w() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        i.setParams({ i: c, j: d }), s.assign(m, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : D)(c, d));
      }
      function C() {
        return I.length > 0 && !I.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), K = (0, A.checkDataTypes)(I, M, f.opts.strictNumbers, A.DataType.Wrong), G = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(K, (0, e._)`continue`), I.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${G}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${G}[${M}]`), i.error(), s.assign(m, !1).break();
          }).code((0, e._)`${G}[${M}] = ${c}`);
        });
      }
      function D(c, d) {
        const M = (0, r.useFunc)(s, o.default), K = s.name("outer");
        s.label(K).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          i.error(), s.assign(m, !1).break(K);
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
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), B = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: Q }) => (0, A._)`{allowedValue: ${Q}}`
    },
    code(Q) {
      const { gen: i, data: s, $data: a, schemaCode: g, schema: n } = Q;
      a || n && typeof n == "object" ? Q.fail$data((0, A._)`!${(0, e.useFunc)(i, r.default)}(${s}, ${g})`) : Q.fail((0, A._)`${n} !== ${s}`);
    }
  };
  return _const.default = B, _const;
}
var _enum = {}, hasRequired_enum;
function require_enum() {
  if (hasRequired_enum) return _enum;
  hasRequired_enum = 1, Object.defineProperty(_enum, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), r = requireEqual(), B = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: Q }) => (0, A._)`{allowedValues: ${Q}}`
    },
    code(Q) {
      const { gen: i, data: s, $data: a, schema: g, schemaCode: n, it: E } = Q;
      if (!a && g.length === 0)
        throw new Error("enum must have non-empty array");
      const l = g.length >= E.opts.loopEnum;
      let f;
      const m = () => f ?? (f = (0, e.useFunc)(i, r.default));
      let I;
      if (l || a)
        I = i.let("valid"), Q.block$data(I, w);
      else {
        if (!Array.isArray(g))
          throw new Error("ajv implementation error");
        const t = i.const("vSchema", n);
        I = (0, A.or)(...g.map((D, c) => C(t, c)));
      }
      Q.pass(I);
      function w() {
        i.assign(I, !1), i.forOf("v", n, (t) => i.if((0, A._)`${m()}(${s}, ${t})`, () => i.assign(I, !0).break()));
      }
      function C(t, D) {
        const c = g[D];
        return typeof c == "object" && c !== null ? (0, A._)`${m()}(${s}, ${t}[${D}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = B, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), B = requireLimitProperties(), Q = requireRequired(), i = requireLimitItems(), s = requireUniqueItems(), a = require_const(), g = require_enum(), n = [
    // number
    A.default,
    e.default,
    // string
    r.default,
    o.default,
    // object
    B.default,
    Q.default,
    // array
    i.default,
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
      message: ({ params: { len: Q } }) => (0, A.str)`must NOT have more than ${Q} items`,
      params: ({ params: { len: Q } }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { parentSchema: i, it: s } = Q, { items: a } = i;
      if (!Array.isArray(a)) {
        (0, e.checkStrictMode)(s, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      B(Q, a);
    }
  };
  function B(Q, i) {
    const { gen: s, schema: a, data: g, keyword: n, it: E } = Q;
    E.items = !0;
    const l = s.const("len", (0, A._)`${g}.length`);
    if (a === !1)
      Q.setParams({ len: i.length }), Q.pass((0, A._)`${l} <= ${i.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const m = s.var("valid", (0, A._)`${l} <= ${i.length}`);
      s.if((0, A.not)(m), () => f(m)), Q.ok(m);
    }
    function f(m) {
      s.forRange("i", i.length, l, (I) => {
        Q.subschema({ keyword: n, dataProp: I, dataPropType: e.Type.Num }, m), E.allErrors || s.if((0, A.not)(m), () => s.break());
      });
    }
  }
  return additionalItems.validateAdditionalItems = B, additionalItems.default = o, additionalItems;
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
      const { schema: i, it: s } = Q;
      if (Array.isArray(i))
        return B(Q, "additionalItems", i);
      s.items = !0, !(0, e.alwaysValidSchema)(s, i) && Q.ok((0, r.validateArray)(Q));
    }
  };
  function B(Q, i, s = Q.schema) {
    const { gen: a, parentSchema: g, data: n, keyword: E, it: l } = Q;
    I(g), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), m = a.const("len", (0, A._)`${n}.length`);
    s.forEach((w, C) => {
      (0, e.alwaysValidSchema)(l, w) || (a.if((0, A._)`${m} > ${C}`, () => Q.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), Q.ok(f));
    });
    function I(w) {
      const { opts: C, errSchemaPath: t } = l, D = s.length, c = D === w.minItems && (D === w.maxItems || w[i] === !1);
      if (C.strictTuples && !c) {
        const d = `"${E}" is ${D}-tuple, but minItems or maxItems/${i} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, C.strictTuples);
      }
    }
  }
  return items.validateTuple = B, items.default = o, items;
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
      message: ({ params: { len: i } }) => (0, A.str)`must NOT have more than ${i} items`,
      params: ({ params: { len: i } }) => (0, A._)`{limit: ${i}}`
    },
    code(i) {
      const { schema: s, parentSchema: a, it: g } = i, { prefixItems: n } = a;
      g.items = !0, !(0, e.alwaysValidSchema)(g, s) && (n ? (0, o.validateAdditionalItems)(i, n) : i.ok((0, r.validateArray)(i)));
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
      message: ({ params: { min: B, max: Q } }) => Q === void 0 ? (0, A.str)`must contain at least ${B} valid item(s)` : (0, A.str)`must contain at least ${B} and no more than ${Q} valid item(s)`,
      params: ({ params: { min: B, max: Q } }) => Q === void 0 ? (0, A._)`{minContains: ${B}}` : (0, A._)`{minContains: ${B}, maxContains: ${Q}}`
    },
    code(B) {
      const { gen: Q, schema: i, parentSchema: s, data: a, it: g } = B;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      g.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const m = Q.const("len", (0, A._)`${a}.length`);
      if (B.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(g, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(g, '"minContains" > "maxContains" is always invalid'), B.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(g, i)) {
        let D = (0, A._)`${m} >= ${n}`;
        E !== void 0 && (D = (0, A._)`${D} && ${m} <= ${E}`), B.pass(D);
        return;
      }
      g.items = !0;
      const I = Q.name("valid");
      E === void 0 && n === 1 ? C(I, () => Q.if(I, () => Q.break())) : n === 0 ? (Q.let(I, !0), E !== void 0 && Q.if((0, A._)`${a}.length > 0`, w)) : (Q.let(I, !1), w()), B.result(I, () => B.reset());
      function w() {
        const D = Q.name("_valid"), c = Q.let("count", 0);
        C(D, () => Q.if(D, () => t(c)));
      }
      function C(D, c) {
        Q.forRange("i", 0, m, (d) => {
          B.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, D), c();
        });
      }
      function t(D) {
        Q.code((0, A._)`${D}++`), E === void 0 ? Q.if((0, A._)`${D} >= ${n}`, () => Q.assign(I, !0).break()) : (Q.if((0, A._)`${D} > ${E}`, () => Q.assign(I, !1).break()), n === 1 ? Q.assign(I, !0) : Q.if((0, A._)`${D} >= ${n}`, () => Q.assign(I, !0)));
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
    const B = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [g, n] = Q(a);
        i(a, g), s(a, n);
      }
    };
    function Q({ schema: a }) {
      const g = {}, n = {};
      for (const E in a) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(a[E]) ? g : n;
        l[E] = a[E];
      }
      return [g, n];
    }
    function i(a, g = a.schema) {
      const { gen: n, data: E, it: l } = a;
      if (Object.keys(g).length === 0)
        return;
      const f = n.let("missing");
      for (const m in g) {
        const I = g[m];
        if (I.length === 0)
          continue;
        const w = (0, o.propertyInData)(n, E, m, l.opts.ownProperties);
        a.setParams({
          property: m,
          depsCount: I.length,
          deps: I.join(", ")
        }), l.allErrors ? n.if(w, () => {
          for (const C of I)
            (0, o.checkReportMissingProp)(a, C);
        }) : (n.if((0, e._)`${w} && (${(0, o.checkMissingProp)(a, I, f)})`), (0, o.reportMissingProp)(a, f), n.else());
      }
    }
    A.validatePropertyDeps = i;
    function s(a, g = a.schema) {
      const { gen: n, data: E, keyword: l, it: f } = a, m = n.name("valid");
      for (const I in g)
        (0, r.alwaysValidSchema)(f, g[I]) || (n.if(
          (0, o.propertyInData)(n, E, I, f.opts.ownProperties),
          () => {
            const w = a.subschema({ keyword: l, schemaProp: I }, m);
            a.mergeValidEvaluated(w, m);
          },
          () => n.var(m, !0)
          // TODO var
        ), a.ok(m));
    }
    A.validateSchemaDeps = s, A.default = B;
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
      params: ({ params: B }) => (0, A._)`{propertyName: ${B.propertyName}}`
    },
    code(B) {
      const { gen: Q, schema: i, data: s, it: a } = B;
      if ((0, e.alwaysValidSchema)(a, i))
        return;
      const g = Q.name("valid");
      Q.forIn("key", s, (n) => {
        B.setParams({ propertyName: n }), B.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, g), Q.if((0, A.not)(g), () => {
          B.error(!0), a.allErrors || Q.break();
        });
      }), B.ok(g);
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
      params: ({ params: i }) => (0, e._)`{additionalProperty: ${i.additionalProperty}}`
    },
    code(i) {
      const { gen: s, schema: a, parentSchema: g, data: n, errsCount: E, it: l } = i;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: m } = l;
      if (l.props = !0, m.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const I = (0, A.allSchemaProperties)(g.properties), w = (0, A.allSchemaProperties)(g.patternProperties);
      C(), i.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", n, (M) => {
          !I.length && !w.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let K;
        if (I.length > 8) {
          const G = (0, o.schemaRefOrVal)(l, g.properties, "properties");
          K = (0, A.isOwnProperty)(s, G, M);
        } else I.length ? K = (0, e.or)(...I.map((G) => (0, e._)`${M} === ${G}`)) : K = e.nil;
        return w.length && (K = (0, e.or)(K, ...w.map((G) => (0, e._)`${(0, A.usePattern)(i, G)}.test(${M})`))), (0, e.not)(K);
      }
      function D(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (m.removeAdditional === "all" || m.removeAdditional && a === !1) {
          D(M);
          return;
        }
        if (a === !1) {
          i.setParams({ additionalProperty: M }), i.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, o.alwaysValidSchema)(l, a)) {
          const K = s.name("valid");
          m.removeAdditional === "failing" ? (d(M, K, !1), s.if((0, e.not)(K), () => {
            i.reset(), D(M);
          })) : (d(M, K), f || s.if((0, e.not)(K), () => s.break()));
        }
      }
      function d(M, K, G) {
        const H = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: o.Type.Str
        };
        G === !1 && Object.assign(H, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), i.subschema(H, K);
      }
    }
  };
  return additionalProperties.default = Q, additionalProperties;
}
var properties$1 = {}, hasRequiredProperties;
function requireProperties() {
  if (hasRequiredProperties) return properties$1;
  hasRequiredProperties = 1, Object.defineProperty(properties$1, "__esModule", { value: !0 });
  const A = requireValidate(), e = requireCode(), r = requireUtil(), o = requireAdditionalProperties(), B = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(Q) {
      const { gen: i, schema: s, parentSchema: a, data: g, it: n } = Q;
      n.opts.removeAdditional === "all" && a.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(n, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const w of E)
        n.definedProperties.add(w);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(i, (0, r.toHash)(E), n.props));
      const l = E.filter((w) => !(0, r.alwaysValidSchema)(n, s[w]));
      if (l.length === 0)
        return;
      const f = i.name("valid");
      for (const w of l)
        m(w) ? I(w) : (i.if((0, e.propertyInData)(i, g, w, n.opts.ownProperties)), I(w), n.allErrors || i.else().var(f, !0), i.endIf()), Q.it.definedProperties.add(w), Q.ok(f);
      function m(w) {
        return n.opts.useDefaults && !n.compositeRule && s[w].default !== void 0;
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
  return properties$1.default = B, properties$1;
}
var patternProperties = {}, hasRequiredPatternProperties;
function requirePatternProperties() {
  if (hasRequiredPatternProperties) return patternProperties;
  hasRequiredPatternProperties = 1, Object.defineProperty(patternProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), o = requireUtil(), B = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(Q) {
      const { gen: i, schema: s, data: a, parentSchema: g, it: n } = Q, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const m = E.strictSchema && !E.allowMatchingProperties && g.properties, I = i.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, o.evaluatedPropsToName)(i, n.props));
      const { props: w } = n;
      C();
      function C() {
        for (const c of l)
          m && t(c), n.allErrors ? D(c) : (i.var(I, !0), D(c), i.if(I));
      }
      function t(c) {
        for (const d in m)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function D(c) {
        i.forIn("key", a, (d) => {
          i.if((0, e._)`${(0, A.usePattern)(Q, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || Q.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: o.Type.Str
            }, I), n.opts.unevaluated && w !== !0 ? i.assign((0, e._)`${w}[${d}]`, !0) : !M && !n.allErrors && i.if((0, e.not)(I), () => i.break());
          });
        });
      }
    }
  };
  return patternProperties.default = B, patternProperties;
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
      const { gen: o, schema: B, it: Q } = r;
      if ((0, A.alwaysValidSchema)(Q, B)) {
        r.fail();
        return;
      }
      const i = o.name("valid");
      r.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, i), r.failResult(i, () => r.reset(), () => r.error());
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
      params: ({ params: B }) => (0, A._)`{passingSchemas: ${B.passing}}`
    },
    code(B) {
      const { gen: Q, schema: i, parentSchema: s, it: a } = B;
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      if (a.opts.discriminator && s.discriminator)
        return;
      const g = i, n = Q.let("valid", !1), E = Q.let("passing", null), l = Q.name("_valid");
      B.setParams({ passing: E }), Q.block(f), B.result(n, () => B.reset(), () => B.error(!0));
      function f() {
        g.forEach((m, I) => {
          let w;
          (0, e.alwaysValidSchema)(a, m) ? Q.var(l, !0) : w = B.subschema({
            keyword: "oneOf",
            schemaProp: I,
            compositeRule: !0
          }, l), I > 0 && Q.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${I}]`).else(), Q.if(l, () => {
            Q.assign(n, !0), Q.assign(E, I), w && B.mergeEvaluated(w, A.Name);
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
      const { gen: o, schema: B, it: Q } = r;
      if (!Array.isArray(B))
        throw new Error("ajv implementation error");
      const i = o.name("valid");
      B.forEach((s, a) => {
        if ((0, A.alwaysValidSchema)(Q, s))
          return;
        const g = r.subschema({ keyword: "allOf", schemaProp: a }, i);
        r.ok(i), r.mergeEvaluated(g);
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
      const { gen: i, parentSchema: s, it: a } = Q;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const g = B(a, "then"), n = B(a, "else");
      if (!g && !n)
        return;
      const E = i.let("valid", !0), l = i.name("_valid");
      if (f(), Q.reset(), g && n) {
        const I = i.let("ifClause");
        Q.setParams({ ifClause: I }), i.if(l, m("then", I), m("else", I));
      } else g ? i.if(l, m("then")) : i.if((0, A.not)(l), m("else"));
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
          i.assign(E, l), Q.mergeValidEvaluated(C, E), w ? i.assign(w, (0, A._)`${I}`) : Q.setParams({ ifClause: I });
        };
      }
    }
  };
  function B(Q, i) {
    const s = Q.schema[i];
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
    code({ keyword: r, parentSchema: o, it: B }) {
      o.if === void 0 && (0, A.checkStrictMode)(B, `"${r}" without "if" is ignored`);
    }
  };
  return thenElse.default = e, thenElse;
}
var hasRequiredApplicator;
function requireApplicator() {
  if (hasRequiredApplicator) return applicator;
  hasRequiredApplicator = 1, Object.defineProperty(applicator, "__esModule", { value: !0 });
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), B = requireContains(), Q = requireDependencies(), i = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), g = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), m = require_if(), I = requireThenElse();
  function w(C = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      m.default,
      I.default,
      // object
      i.default,
      s.default,
      Q.default,
      a.default,
      g.default
    ];
    return C ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(B.default), t;
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
    code(o, B) {
      const { gen: Q, data: i, $data: s, schema: a, schemaCode: g, it: n } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: m } = n;
      if (!E.validateFormats)
        return;
      s ? I() : w();
      function I() {
        const C = Q.scopeValue("formats", {
          ref: m.formats,
          code: E.code.formats
        }), t = Q.const("fDef", (0, A._)`${C}[${g}]`), D = Q.let("fType"), c = Q.let("format");
        Q.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => Q.assign(D, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => Q.assign(D, (0, A._)`"string"`).assign(c, t)), o.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${g} && !${c}`;
        }
        function M() {
          const K = f.$async ? (0, A._)`(${t}.async ? await ${c}(${i}) : ${c}(${i}))` : (0, A._)`${c}(${i})`, G = (0, A._)`(typeof ${c} == "function" ? ${K} : ${c}.test(${i}))`;
          return (0, A._)`${c} && ${c} !== true && ${D} === ${B} && !${G}`;
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
        t === B && o.pass(K());
        function d() {
          if (E.strictSchema === !1) {
            m.logger.warn(G());
            return;
          }
          throw new Error(G());
          function G() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function M(G) {
          const H = G instanceof RegExp ? (0, A.regexpCode)(G) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, q = Q.scopeValue("formats", { key: a, ref: G, code: H });
          return typeof G == "object" && !(G instanceof RegExp) ? [G.type || "string", G.validate, (0, A._)`${q}.validate`] : ["string", G, q];
        }
        function K() {
          if (typeof C == "object" && !(C instanceof RegExp) && C.async) {
            if (!f.$async)
              throw new Error("async format in sync schema");
            return (0, A._)`await ${c}(${i})`;
          }
          return typeof D == "function" ? (0, A._)`${c}(${i})` : (0, A._)`${c}.test(${i})`;
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
  const A = requireCore(), e = requireValidation(), r = requireApplicator(), o = requireFormat(), B = requireMetadata(), Q = [
    A.default,
    e.default,
    (0, r.default)(),
    o.default,
    B.metadataVocabulary,
    B.contentVocabulary
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
  const A = requireCodegen(), e = requireTypes(), r = requireCompile(), o = requireRef_error(), B = requireUtil(), i = {
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
      const m = n.propertyName;
      if (typeof m != "string")
        throw new Error("discriminator: requires propertyName");
      if (n.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const I = a.let("valid", !1), w = a.const("tag", (0, A._)`${g}${(0, A.getProperty)(m)}`);
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
        const d = {}, M = G(E);
        let K = !0;
        for (let F = 0; F < f.length; F++) {
          let S = f[F];
          if (S?.$ref && !(0, B.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = S?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          K = K && (M || G(S)), H(U, F);
        }
        if (!K)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function G({ required: F }) {
          return Array.isArray(F) && F.includes(m);
        }
        function H(F, S) {
          if (F.const)
            q(F.const, S);
          else if (F.enum)
            for (const U of F.enum)
              q(U, S);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function q(F, S) {
          if (typeof F != "string" || F in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[F] = S;
        }
      }
    }
  };
  return discriminator.default = i, discriminator;
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
    const r = requireCore$1(), o = requireDraft7(), B = requireDiscriminator(), Q = require$$3, i = ["/properties"], s = "http://json-schema.org/draft-07/schema";
    class a extends r.default {
      _addVocabularies() {
        super._addVocabularies(), o.default.forEach((m) => this.addVocabulary(m)), this.opts.discriminator && this.addKeyword(B.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const m = this.opts.$data ? this.$dataMetaSchema(Q, i) : Q;
        this.addMetaSchema(m, s, !1), this.refs["http://json-schema.org/schema"] = s;
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
  function B(Q) {
    return Q instanceof r ? Q : new r(function(i) {
      i(Q);
    });
  }
  return new (r || (r = Promise))(function(Q, i) {
    function s(n) {
      try {
        g(o.next(n));
      } catch (E) {
        i(E);
      }
    }
    function a(n) {
      try {
        g(o.throw(n));
      } catch (E) {
        i(E);
      }
    }
    function g(n) {
      n.done ? Q(n.value) : B(n.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
  });
}
function __generator(A, e) {
  var r = { label: 0, sent: function() {
    if (Q[0] & 1) throw Q[1];
    return Q[1];
  }, trys: [], ops: [] }, o, B, Q, i;
  return i = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (i[Symbol.iterator] = function() {
    return this;
  }), i;
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, B && (Q = g[0] & 2 ? B.return : g[0] ? B.throw || ((Q = B.return) && Q.call(B), 0) : B.next) && !(Q = Q.call(B, g[1])).done) return Q;
      switch (B = 0, Q && (g = [g[0] & 2, Q.value]), g[0]) {
        case 0:
        case 1:
          Q = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, B = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (Q = r.trys, !(Q = Q.length > 0 && Q[Q.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!Q || g[1] > Q[0] && g[1] < Q[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < Q[1]) {
            r.label = Q[1], Q = g;
            break;
          }
          if (Q && r.label < Q[2]) {
            r.label = Q[2], r.ops.push(g);
            break;
          }
          Q[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], B = 0;
    } finally {
      o = Q = 0;
    }
    if (g[0] & 5) throw g[1];
    return { value: g[0] ? g[1] : void 0, done: !0 };
  }
}
function __read(A, e) {
  var r = typeof Symbol == "function" && A[Symbol.iterator];
  if (!r) return A;
  var o = r.call(A), B, Q = [], i;
  try {
    for (; (e === void 0 || e-- > 0) && !(B = o.next()).done; ) Q.push(B.value);
  } catch (s) {
    i = { error: s };
  } finally {
    try {
      B && !B.done && (r = o.return) && r.call(o);
    } finally {
      if (i) throw i.error;
    }
  }
  return Q;
}
function __spreadArray(A, e, r) {
  if (arguments.length === 2) for (var o = 0, B = e.length, Q; o < B; o++)
    (Q || !(o in e)) && (Q || (Q = Array.prototype.slice.call(e, 0, o)), Q[o] = e[o]);
  return A.concat(Q || Array.prototype.slice.call(e));
}
var defaultErrorConfig = {
  withStackTrace: !1
}, createNeverThrowError = function(A, e, r) {
  r === void 0 && (r = defaultErrorConfig);
  var o = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, B = r.withStackTrace ? new Error().stack : void 0;
  return {
    data: o,
    message: A,
    stack: B
  };
}, Result;
(function(A) {
  function e(r, o) {
    return function() {
      for (var B = [], Q = 0; Q < arguments.length; Q++)
        B[Q] = arguments[Q];
      try {
        var i = r.apply(void 0, __spreadArray([], __read(B), !1));
        return ok(i);
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
      var o = e.then(function(B) {
        return new Ok(B);
      }).catch(function(B) {
        return new Err(r(B));
      });
      return new A(o);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var B;
          return __generator(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isErr() ? [2, new Err(o.error)] : (B = Ok.bind, [4, e(o.value)]);
              case 1:
                return [2, new (B.apply(Ok, [void 0, Q.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(o) {
        return __awaiter(r, void 0, void 0, function() {
          var B;
          return __generator(this, function(Q) {
            switch (Q.label) {
              case 0:
                return o.isOk() ? [2, new Ok(o.value)] : (B = Err.bind, [4, e(o.error)]);
              case 1:
                return [2, new (B.apply(Err, [void 0, Q.sent()]))()];
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
          return __generator(this, function(B) {
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
  const B = callVisitor(A, e, r, o);
  if (isNode(B) || isPair(B))
    return replaceNode(A, o, B), visit_(A, B, r, o);
  if (typeof B != "symbol") {
    if (isCollection(e)) {
      o = Object.freeze(o.concat(e));
      for (let Q = 0; Q < e.items.length; ++Q) {
        const i = visit_(Q, e.items[Q], r, o);
        if (typeof i == "number")
          Q = i - 1;
        else {
          if (i === BREAK)
            return BREAK;
          i === REMOVE && (e.items.splice(Q, 1), Q -= 1);
        }
      }
    } else if (isPair(e)) {
      o = Object.freeze(o.concat(e));
      const Q = visit_("key", e.key, r, o);
      if (Q === BREAK)
        return BREAK;
      Q === REMOVE && (e.key = null);
      const i = visit_("value", e.value, r, o);
      if (i === BREAK)
        return BREAK;
      i === REMOVE && (e.value = null);
    }
  }
  return B;
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
    const B = isAlias(o) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${B} parent`);
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
      for (let B = 0, Q = o.length; B < Q; ++B) {
        const i = o[B], s = applyReviver(A, o, String(B), i);
        s === void 0 ? delete o[B] : s !== i && (o[B] = s);
      }
    else if (o instanceof Map)
      for (const B of Array.from(o.keys())) {
        const Q = o.get(B), i = applyReviver(A, o, B, Q);
        i === void 0 ? o.delete(B) : i !== Q && o.set(B, i);
      }
    else if (o instanceof Set)
      for (const B of Array.from(o)) {
        const Q = applyReviver(A, o, B, B);
        Q === void 0 ? o.delete(B) : Q !== B && (o.delete(B), o.add(Q));
      }
    else
      for (const [B, Q] of Object.entries(o)) {
        const i = applyReviver(A, o, B, Q);
        i === void 0 ? delete o[B] : i !== Q && (o[B] = i);
      }
  return A.call(e, r, o);
}
function toJS(A, e, r) {
  if (Array.isArray(A))
    return A.map((o, B) => toJS(o, String(B), r));
  if (A && typeof A.toJSON == "function") {
    if (!r || !hasAnchor(A))
      return A.toJSON(e, r);
    const o = { aliasCount: 0, count: 1, res: void 0 };
    r.anchors.set(A, o), r.onCreate = (Q) => {
      o.res = Q, delete r.onCreate;
    };
    const B = A.toJSON(e, r);
    return r.onCreate && r.onCreate(B), B;
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
  toJS(e, { mapAsMap: r, maxAliasCount: o, onAnchor: B, reviver: Q } = {}) {
    if (!isDocument(e))
      throw new TypeError("A document argument is required");
    const i = {
      anchors: /* @__PURE__ */ new Map(),
      doc: e,
      keep: !0,
      mapAsMap: r === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof o == "number" ? o : 100
    }, s = toJS(this, "", i);
    if (typeof B == "function")
      for (const { count: a, res: g } of i.anchors.values())
        B(g, a);
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
      Node: (o, B) => {
        if (B === this)
          return visit.BREAK;
        B.anchor === this.source && (r = B);
      }
    }), r;
  }
  toJSON(e, r) {
    if (!r)
      return { source: this.source };
    const { anchors: o, doc: B, maxAliasCount: Q } = r, i = this.resolve(B);
    if (!i) {
      const a = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(a);
    }
    let s = o.get(i);
    if (s || (toJS(i, null, r), s = o.get(i)), !s || s.res === void 0) {
      const a = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(a);
    }
    if (Q >= 0 && (s.count += 1, s.aliasCount === 0 && (s.aliasCount = getAliasCount(B, i, o)), s.count * s.aliasCount > Q)) {
      const a = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(a);
    }
    return s.res;
  }
  toString(e, r, o) {
    const B = `*${this.source}`;
    if (e) {
      if (anchorIsValid(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const Q = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(Q);
      }
      if (e.implicitKey)
        return `${B} `;
    }
    return B;
  }
}
function getAliasCount(A, e, r) {
  if (isAlias(e)) {
    const o = e.resolve(A), B = r && o && r.get(o);
    return B ? B.count * B.aliasCount : 0;
  } else if (isCollection(e)) {
    let o = 0;
    for (const B of e.items) {
      const Q = getAliasCount(A, B, r);
      Q > o && (o = Q);
    }
    return o;
  } else if (isPair(e)) {
    const o = getAliasCount(A, e.key, r), B = getAliasCount(A, e.value, r);
    return Math.max(o, B);
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
  const { aliasDuplicateObjects: o, onAnchor: B, onTagObj: Q, schema: i, sourceObjects: s } = r;
  let a;
  if (o && A && typeof A == "object") {
    if (a = s.get(A), a)
      return a.anchor || (a.anchor = B(A)), new Alias(a.anchor);
    a = { anchor: null, node: null }, s.set(A, a);
  }
  let g = findTagObject(A, e, i.tags);
  if (!g) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    g = A instanceof Map ? i[MAP] : Symbol.iterator in Object(A) ? i[SEQ] : i[MAP];
  }
  Q && (Q(g), delete r.onTagObj);
  const n = g?.createNode ? g.createNode(r.schema, A, r) : typeof g?.nodeClass?.from == "function" ? g.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return g.default || (n.tag = g.tag), a && (a.node = n), n;
}
function collectionFromPath(A, e, r) {
  let o = r;
  for (let B = e.length - 1; B >= 0; --B) {
    const Q = e[B];
    if (typeof Q == "number" && Number.isInteger(Q) && Q >= 0) {
      const i = [];
      i[Q] = o, o = i;
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
      const [o, ...B] = e, Q = this.get(o, !0);
      if (isCollection(Q))
        Q.addIn(B, r);
      else if (Q === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, B, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${B}`);
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
    const B = this.get(r, !0);
    if (isCollection(B))
      return B.deleteIn(o);
    throw new Error(`Expected YAML collection at ${r}. Remaining path: ${o}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, r) {
    const [o, ...B] = e, Q = this.get(o, !0);
    return B.length === 0 ? !r && isScalar(Q) ? Q.value : Q : isCollection(Q) ? Q.getIn(B, r) : void 0;
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
    const B = this.get(r, !0);
    return isCollection(B) ? B.hasIn(o) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, r) {
    const [o, ...B] = e;
    if (B.length === 0)
      this.set(o, r);
    else {
      const Q = this.get(o, !0);
      if (isCollection(Q))
        Q.setIn(B, r);
      else if (Q === void 0 && this.schema)
        this.set(o, collectionFromPath(this.schema, B, r));
      else
        throw new Error(`Expected YAML collection at ${o}. Remaining path: ${B}`);
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
function foldFlowLines(A, e, r = "flow", { indentAtStart: o, lineWidth: B = 80, minContentWidth: Q = 20, onFold: i, onOverflow: s } = {}) {
  if (!B || B < 0)
    return A;
  B < Q && (Q = 0);
  const a = Math.max(1 + Q, 1 + B - e.length);
  if (A.length <= a)
    return A;
  const g = [], n = {};
  let E = B - e.length;
  typeof o == "number" && (o > B - Math.max(2, Q) ? g.push(0) : E = B - o);
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
          g.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = D, D = A[I += 1], m = !0;
          const c = I > C + 1 ? I - 2 : w - 1;
          if (n[c])
            return A;
          g.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          m = !0;
    }
    f = D;
  }
  if (m && s && s(), g.length === 0)
    return A;
  i && i();
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
  let o = e, B = e + 1, Q = A[B];
  for (; Q === " " || Q === "	"; )
    if (e < B + r)
      Q = A[++e];
    else {
      do
        Q = A[++e];
      while (Q && Q !== `
`);
      o = e, B = e + 1, Q = A[B];
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
  const o = e - r, B = A.length;
  if (B <= o)
    return !1;
  for (let Q = 0, i = 0; Q < B; ++Q)
    if (A[Q] === `
`) {
      if (Q - i > o)
        return !0;
      if (i = Q + 1, B - i <= o)
        return !1;
    }
  return !0;
}
function doubleQuotedString(A, e) {
  const r = JSON.stringify(A);
  if (e.options.doubleQuotedAsJSON)
    return r;
  const { implicitKey: o } = e, B = e.options.doubleQuotedMinMultiLineLength, Q = e.indent || (containsDocumentMarker(A) ? "  " : "");
  let i = "", s = 0;
  for (let a = 0, g = r[a]; g; g = r[++a])
    if (g === " " && r[a + 1] === "\\" && r[a + 2] === "n" && (i += r.slice(s, a) + "\\ ", a += 1, s = a, g = "\\"), g === "\\")
      switch (r[a + 1]) {
        case "u":
          {
            i += r.slice(s, a);
            const n = r.substr(a + 2, 4);
            switch (n) {
              case "0000":
                i += "\\0";
                break;
              case "0007":
                i += "\\a";
                break;
              case "000b":
                i += "\\v";
                break;
              case "001b":
                i += "\\e";
                break;
              case "0085":
                i += "\\N";
                break;
              case "00a0":
                i += "\\_";
                break;
              case "2028":
                i += "\\L";
                break;
              case "2029":
                i += "\\P";
                break;
              default:
                n.substr(0, 2) === "00" ? i += "\\x" + n.substr(2) : i += r.substr(a, 6);
            }
            a += 5, s = a + 1;
          }
          break;
        case "n":
          if (o || r[a + 2] === '"' || r.length < B)
            a += 1;
          else {
            for (i += r.slice(s, a) + `

`; r[a + 2] === "\\" && r[a + 3] === "n" && r[a + 4] !== '"'; )
              i += `
`, a += 2;
            i += Q, r[a + 2] === " " && (i += "\\"), a += 1, s = a + 1;
          }
          break;
        default:
          a += 1;
      }
  return i = s ? i + r.slice(s) : r, o ? i : foldFlowLines(i, Q, FOLD_QUOTED, getFoldOptions(e, !1));
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
    const B = A.includes('"'), Q = A.includes("'");
    B && !Q ? o = singleQuotedString : Q && !B ? o = doubleQuotedString : o = r ? singleQuotedString : doubleQuotedString;
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
function blockString({ comment: A, type: e, value: r }, o, B, Q) {
  const { blockQuote: i, commentString: s, lineWidth: a } = o.options;
  if (!i || /\n[\t ]+$/.test(r) || /^\s*$/.test(r))
    return quotedString(r, o);
  const g = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = i === "literal" ? !0 : i === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, g.length);
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
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), B && B()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${g}`);
    let M = !1;
    const K = getFoldOptions(o, !0);
    i !== "folded" && e !== Scalar.BLOCK_FOLDED && (K.onOverflow = () => {
      M = !0;
    });
    const G = foldFlowLines(`${t}${d}${f}`, g, FOLD_BLOCK, K);
    if (!M)
      return `>${c}
${g}${G}`;
  }
  return r = r.replace(/\n+/g, `$&${g}`), `|${c}
${g}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: B, value: Q } = A, { actualString: i, implicitKey: s, indent: a, indentStep: g, inFlow: n } = e;
  if (s && Q.includes(`
`) || n && /[[\]{},]/.test(Q))
    return quotedString(Q, e);
  if (!Q || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(Q))
    return s || n || !Q.includes(`
`) ? quotedString(Q, e) : blockString(A, e, r, o);
  if (!s && !n && B !== Scalar.PLAIN && Q.includes(`
`))
    return blockString(A, e, r, o);
  if (containsDocumentMarker(Q)) {
    if (a === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, o);
    if (s && a === g)
      return quotedString(Q, e);
  }
  const E = Q.replace(/\n+/g, `$&
${a}`);
  if (i) {
    const l = (I) => I.default && I.tag !== "tag:yaml.org,2002:str" && I.test?.test(E), { compat: f, tags: m } = e.doc.schema;
    if (m.some(l) || f?.some(l))
      return quotedString(Q, e);
  }
  return s ? E : foldFlowLines(E, a, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, o) {
  const { implicitKey: B, inFlow: Q } = e, i = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(i.value) && (s = Scalar.QUOTE_DOUBLE);
  const a = (n) => {
    switch (n) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return B || Q ? quotedString(i.value, e) : blockString(i, e, r, o);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(i.value, e);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(i.value, e);
      case Scalar.PLAIN:
        return plainString(i, e, r, o);
      default:
        return null;
    }
  };
  let g = a(s);
  if (g === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = B && n || E;
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
    const B = A.filter((Q) => Q.tag === e.tag);
    if (B.length > 0)
      return B.find((Q) => Q.format === e.format) ?? B[0];
  }
  let r, o;
  if (isScalar(e)) {
    o = e.value;
    let B = A.filter((Q) => Q.identify?.(o));
    if (B.length > 1) {
      const Q = B.filter((i) => i.test);
      Q.length > 0 && (B = Q);
    }
    r = B.find((Q) => Q.format === e.format) ?? B.find((Q) => !Q.format);
  } else
    o = e, r = A.find((B) => B.nodeClass && o instanceof B.nodeClass);
  if (!r) {
    const B = o?.constructor?.name ?? typeof o;
    throw new Error(`Tag not resolved for ${B} value`);
  }
  return r;
}
function stringifyProps(A, e, { anchors: r, doc: o }) {
  if (!o.directives)
    return "";
  const B = [], Q = (isScalar(A) || isCollection(A)) && A.anchor;
  Q && anchorIsValid(Q) && (r.add(Q), B.push(`&${Q}`));
  const i = A.tag ? A.tag : e.default ? null : e.tag;
  return i && B.push(o.directives.tagString(i)), B.join(" ");
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
  let B;
  const Q = isNode(A) ? A : e.doc.createNode(A, { onTagObj: (a) => B = a });
  B || (B = getTagObject(e.doc.schema.tags, Q));
  const i = stringifyProps(Q, B, e);
  i.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + i.length + 1);
  const s = typeof B.stringify == "function" ? B.stringify(Q, e, r, o) : isScalar(Q) ? stringifyString(Q, e, r, o) : Q.toString(e, r, o);
  return i ? isScalar(Q) || s[0] === "{" || s[0] === "[" ? `${i} ${s}` : `${i}
${e.indent}${s}` : s;
}
function stringifyPair({ key: A, value: e }, r, o, B) {
  const { allNullValues: Q, doc: i, indent: s, indentStep: a, options: { commentString: g, indentSeq: n, simpleKeys: E } } = r;
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
    return w = `? ${w}`, l && !m ? w += lineComment(w, r.indent, g(l)) : I && B && B(), w;
  m && (l = null), f ? (l && (w += lineComment(w, r.indent, g(l))), w = `? ${w}
${s}:`) : (w = `${w}:`, l && (w += lineComment(w, r.indent, g(l))));
  let C, t, D;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, D = e.comment) : (C = !1, t = null, D = null, e && typeof e == "object" && (e = i.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = w.length + 1), I = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => I = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
` : "", t) {
      const K = g(t);
      M += `
${indentComment(K, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const K = d[0], G = d.indexOf(`
`), H = G !== -1, q = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (H || !q) {
      let F = !1;
      if (H && (K === "&" || K === "!")) {
        let S = d.indexOf(" ");
        K === "&" && S !== -1 && S < G && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || G < S) && (F = !0);
      }
      F || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return w += M + d, r.inFlow ? c && o && o() : D && !c ? w += lineComment(w, r.indent, g(D)) : I && B && B(), w;
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
  const B = o.toJSON(null, A, Map);
  for (const [Q, i] of B)
    e instanceof Map ? e.has(Q) || e.set(Q, i) : e instanceof Set ? e.add(Q) : Object.prototype.hasOwnProperty.call(e, Q) || Object.defineProperty(e, Q, {
      value: i,
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
    const B = toJS(r, "", A);
    if (e instanceof Map)
      e.set(B, toJS(o, B, A));
    else if (e instanceof Set)
      e.add(B);
    else {
      const Q = stringifyKey(r, B, A), i = toJS(o, Q, A);
      Q in e ? Object.defineProperty(e, Q, {
        value: i,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : e[Q] = i;
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
    const B = A.toString(o);
    if (!r.mapKeyWarned) {
      let Q = JSON.stringify(B);
      Q.length > 40 && (Q = Q.substring(0, 36) + '..."'), warn(r.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${Q}. Set mapAsMap: true to use object keys.`), r.mapKeyWarned = !0;
    }
    return B;
  }
  return JSON.stringify(e);
}
function createPair(A, e, r) {
  const o = createNode(A, void 0, r), B = createNode(e, void 0, r);
  return new Pair(o, B);
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
function stringifyBlockCollection({ comment: A, items: e }, r, { blockItemPrefix: o, flowChars: B, itemIndent: Q, onChompKeep: i, onComment: s }) {
  const { indent: a, options: { commentString: g } } = r, n = Object.assign({}, r, { indent: Q, type: null });
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
    let C = stringify(I, n, () => w = null, () => E = !0);
    w && (C += lineComment(C, Q, g(w))), E && w && (E = !1), l.push(o + C);
  }
  let f;
  if (l.length === 0)
    f = B.start + B.end;
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
` + indentComment(g(A), a), s && s()) : E && i && i(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: B, indentStep: Q, flowCollectionPadding: i, options: { commentString: s } } = e;
  o += Q;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let g = !1, n = 0;
  const E = [];
  for (let m = 0; m < A.length; ++m) {
    const I = A[m];
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
    m < A.length - 1 && (C += ","), w && (C += lineComment(C, o, s(w))), !g && (E.length > n || C.includes(`
`)) && (g = !0), E.push(C), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!g) {
    const m = E.reduce((I, w) => I + w.length + 2, 2);
    g = e.options.lineWidth > 0 && m > e.options.lineWidth;
  }
  if (g) {
    let m = l;
    for (const I of E)
      m += I ? `
${Q}${B}${I}` : `
`;
    return `${m}
${B}${f}`;
  } else
    return `${l}${i}${E.join(" ")}${i}${f}`;
}
function addCommentBefore({ indent: A, options: { commentString: e } }, r, o, B) {
  if (o && B && (o = o.replace(/^\n+/, "")), o) {
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
    const { keepUndefined: B, replacer: Q } = o, i = new this(e), s = (a, g) => {
      if (typeof Q == "function")
        g = Q.call(r, a, g);
      else if (Array.isArray(Q) && !Q.includes(a))
        return;
      (g !== void 0 || B) && i.items.push(createPair(a, g, o));
    };
    if (r instanceof Map)
      for (const [a, g] of r)
        s(a, g);
    else if (r && typeof r == "object")
      for (const a of Object.keys(r))
        s(a, r[a]);
    return typeof e.sortMapEntries == "function" && i.items.sort(e.sortMapEntries), i;
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
    const B = findPair(this.items, o.key), Q = this.schema?.sortMapEntries;
    if (B) {
      if (!r)
        throw new Error(`Key ${o.key} already set`);
      isScalar(B.value) && isScalarValue(o.value) ? B.value.value = o.value : B.value = o.value;
    } else if (Q) {
      const i = this.items.findIndex((s) => Q(o, s) < 0);
      i === -1 ? this.items.push(o) : this.items.splice(i, 0, o);
    } else
      this.items.push(o);
  }
  delete(e) {
    const r = findPair(this.items, e);
    return r ? this.items.splice(this.items.indexOf(r), 1).length > 0 : !1;
  }
  get(e, r) {
    const B = findPair(this.items, e)?.value;
    return (!r && isScalar(B) ? B.value : B) ?? void 0;
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
    const B = o ? new o() : r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    r?.onCreate && r.onCreate(B);
    for (const Q of this.items)
      addPairToJSMap(r, B, Q);
    return B;
  }
  toString(e, r, o) {
    if (!e)
      return JSON.stringify(this);
    for (const B of this.items)
      if (!isPair(B))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(B)} instead`);
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
    const B = this.items[o];
    return !r && isScalar(B) ? B.value : B;
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
    const B = this.items[o];
    isScalar(B) && isScalarValue(r) ? B.value = r : this.items[o] = r;
  }
  toJSON(e, r) {
    const o = [];
    r?.onCreate && r.onCreate(o);
    let B = 0;
    for (const Q of this.items)
      o.push(toJS(Q, String(B++), r));
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
    const { replacer: B } = o, Q = new this(e);
    if (r && Symbol.iterator in Object(r)) {
      let i = 0;
      for (let s of r) {
        if (typeof B == "function") {
          const a = r instanceof Set ? s : String(i++);
          s = B.call(r, a, s);
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
  const { replacer: o } = r, B = new YAMLSeq(A);
  B.tag = "tag:yaml.org,2002:pairs";
  let Q = 0;
  if (e && Symbol.iterator in Object(e))
    for (let i of e) {
      typeof o == "function" && (i = o.call(e, String(Q++), i));
      let s, a;
      if (Array.isArray(i))
        if (i.length === 2)
          s = i[0], a = i[1];
        else
          throw new TypeError(`Expected [key, value] tuple: ${i}`);
      else if (i && i instanceof Object) {
        const g = Object.keys(i);
        if (g.length === 1)
          s = g[0], a = i[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${g.length} keys`);
      } else
        s = i;
      B.items.push(createPair(s, a, r));
    }
  return B;
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
    for (const B of this.items) {
      let Q, i;
      if (isPair(B) ? (Q = toJS(B.key, "", r), i = toJS(B.value, Q, r)) : Q = toJS(B, "", r), o.has(Q))
        throw new Error("Ordered maps must not include duplicate keys");
      o.set(Q, i);
    }
    return o;
  }
  static from(e, r, o) {
    const B = createPairs(e, r, o), Q = new this();
    return Q.items = B.items, Q;
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
    const { replacer: B } = o, Q = new this(e);
    if (r && Symbol.iterator in Object(r))
      for (let i of r)
        typeof B == "function" && (i = B.call(r, i, i)), Q.items.push(createPair(i, null, o));
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
    const B = [];
    for (const Q of o) {
      const i = A.varTypes[Q[0]], s = A.variables[Q[1]];
      let a = s.i, g = s.n;
      if (Q.length > 2) {
        const E = [], l = [], f = (Q.length - 2) / 2, m = Q.slice(2, 2 + f);
        for (const I of m) {
          const w = A.subscripts[I];
          E.push(w.i), l.push(w.n);
        }
        a += `[${E.join(",")}]`, g += `[${l.join(",")}]`;
      }
      const n = {
        varId: a,
        varName: g,
        varType: i,
        varIndex: s.x,
        subscriptIndices: Q.length > 2 ? Q.slice(2 + (Q.length - 2) / 2) : void 0
      };
      B.push(n);
    }
    e[r] = B;
  }
  return e;
}
function getImplVars(A) {
  const e = decodeImplVars(A), r = /* @__PURE__ */ new Map(), o = [];
  function B(Q, i) {
    const s = [];
    for (const a of i) {
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
  return B("initConstants", e.constants || []), B("initLevels", e.initVars || []), B("evalLevels", e.levelVars || []), B("evalAux", e.auxVars || []), {
    implVars: r,
    implVarGroups: o
  };
}
function getInputVars(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A) {
    const o = r.varId, B = {
      inputId: r.inputId,
      varId: o,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(o, r.defaultValue)
    };
    e.set(o, B);
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
  function B(g) {
    g.value.set(g.minValue);
  }
  function Q(g) {
    g.value.set(g.maxValue);
  }
  function i() {
    A.forEach(o);
  }
  function s() {
    A.forEach(B);
  }
  function a() {
    A.forEach(Q);
  }
  switch (e.kind) {
    case "all-inputs": {
      switch (e.position) {
        case "at-default":
          i();
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
      i();
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
                  B(n);
                  break;
                case "at-maximum":
                  Q(n);
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
    const o = r.varId, B = datasetKeyForOutputVar(void 0, o);
    e.set(B, {
      datasetKey: B,
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 5 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_3", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_36", varId: "_meat_diet_composition_switch", varName: "Meat Diet Composition Switch", defaultValue: 0, minValue: -0.2, maxValue: 2.2 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_81", varId: "_vegetarian_diet_composition_switch", varName: "Vegetarian Diet Composition Switch", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_average_caloric_availability_per_capita_per_day", varName: "Average Caloric Availability per Capita per Day" }, { varId: "_average_caloric_consumption_per_capita_per_day", varName: "Average Caloric Consumption per Capita per Day" }, { varId: "_average_total_daily_calorie_intake", varName: "Average Total Daily Calorie Intake" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_calories_per_capita_per_day", varName: "Desired Food Production in Calories per Capita Per Day" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effective_food_demand_per_capita_per_day", varName: "Effective Food Demand per Capita per Day" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_allocated_for_animal_calories", varName: "Land Allocated for Animal Calories" }, { varId: "_land_allocated_for_energy_crops", varName: "Land Allocated for Energy Crops" }, { varId: "_land_allocated_for_food_crops", varName: "Land Allocated for Food Crops" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen", varName: "Nitrogen" }, { varId: "_nitrogen_from_application_with_manure", varName: "Nitrogen from Application with Manure" }, { varId: "_nitrogen_from_commerical_application", varName: "Nitrogen from Commerical Application" }, { varId: "_nitrogen_from_denitrification", varName: "Nitrogen from Denitrification" }, { varId: "_nitrogen_from_runoff", varName: "Nitrogen from Runoff" }, { varId: "_nitrogen_from_uptake_rate", varName: "Nitrogen from Uptake Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus", varName: "Phosphorus" }, { varId: "_phosphorus_from_application_with_manure", varName: "Phosphorus from Application with Manure" }, { varId: "_phosphorus_from_commerical_application", varName: "Phosphorus from Commerical Application" }, { varId: "_phosphorus_from_runoff", varName: "Phosphorus from Runoff" }, { varId: "_phosphorus_from_uptake_rate", varName: "Phosphorus from Uptake Rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_daily_calorie_supply_per_capita", varName: "Total Daily Calorie Supply per Capita" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 475026, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return w.deserialize(o,I)},serialize(o){return w.serialize(o,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(I){D=A.extendSerializer(D,I)}common.registerSerializer=Q;function B(I){return D.deserialize(I)}common.deserialize=B;function w(I){return D.serialize(I)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,I){if(!I){if(!D(w))throw Error();I=[w]}return{[A.$transferable]:!0,send:w,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,I){self.postMessage(w,I)},Q=function(w){const I=o=>{w(o.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!D.default().isMainThread},w=function(K,i){Q(D.default().parentPort).postMessage(K,i)},I=function(K){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const H=t=>{K(t)},G=()=>{Q(i).off("message",H)};return Q(i).on("message",H),G};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?I():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(M,P,N,m){function Z(j){return j instanceof N?j:new N(function(b){b(j)})}return new(N||(N=Promise))(function(j,b){function _(p){try{T(m.next(p))}catch(X){b(X)}}function $(p){try{T(m.throw(p))}catch(X){b(X)}}function T(p){p.done?j(p.value):Z(p.value).then(_,$)}T((m=m.apply(M,P||[])).next())})},Q=worker&&worker.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),I=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let H=!1;const G=new Map,t=M=>M&&M.type===E.MasterMessageType.cancel,O=M=>M&&M.type===E.MasterMessageType.run,n=M=>B.default(M)||f(M);function f(M){return M&&typeof M=="object"&&typeof M.subscribe=="function"}function U(M){return I.isTransferDescriptor(M)?{payload:M.send,transferables:M.transferables}:{payload:M,transferables:void 0}}function q(){const M={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(M)}function L(M){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:M}};o.default.postMessageToMaster(P)}function c(M,P){const{payload:N,transferables:m}=U(P),Z={type:E.WorkerMessageType.error,uid:M,error:w.serialize(N)};o.default.postMessageToMaster(Z,m)}function a(M,P,N){const{payload:m,transferables:Z}=U(N),j={type:E.WorkerMessageType.result,uid:M,complete:P?!0:void 0,payload:m};o.default.postMessageToMaster(j,Z)}function J(M,P){const N={type:E.WorkerMessageType.running,uid:M,resultType:P};o.default.postMessageToMaster(N)}function u(M){try{const P={type:E.WorkerMessageType.uncaughtError,error:w.serialize(M)};o.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,M)}}function F(M,P,N){return D(this,void 0,void 0,function*(){let m;try{m=P(...N)}catch(j){return c(M,j)}const Z=n(m)?"observable":"promise";if(J(M,Z),n(m)){const j=m.subscribe(b=>a(M,!1,w.serialize(b)),b=>{c(M,w.serialize(b)),G.delete(M)},()=>{a(M,!0),G.delete(M)});G.set(M,j)}else try{const j=yield m;a(M,!0,w.serialize(j))}catch(j){c(M,w.serialize(j))}})}function l(M){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(H)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(H=!0,typeof M=="function")o.default.subscribeToMasterMessages(P=>{O(P)&&!P.method&&F(P.uid,M,P.args.map(w.deserialize))}),q();else if(typeof M=="object"&&M){o.default.subscribeToMasterMessages(N=>{O(N)&&N.method&&F(N.uid,M[N.method],N.args.map(w.deserialize))});const P=Object.keys(M).filter(N=>typeof M[N]=="function");L(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${M}`);o.default.subscribeToMasterMessages(P=>{if(t(P)){const N=P.uid,m=G.get(N);m&&(m.unsubscribe(),G.delete(N))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",M=>{setTimeout(()=>u(M.error||M),250)}),self.addEventListener("unhandledrejection",M=>{const P=M.reason;P&&typeof P.message=="string"&&setTimeout(()=>u(P),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",M=>{setTimeout(()=>u(M),250)}),process.on("unhandledRejection",M=>{M&&typeof M.message=="string"&&setTimeout(()=>u(M),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,I=w?.length||0;D[Q++]=I;for(let E=0;E<I;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=o,B+=2,w+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const I of A){const E=I.varRef.varSpec;D[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;D[B++]=K;for(let i=0;i<K;i++)D[B++]=o[i];I.points!==void 0?(D[B++]=w,D[B++]=I.points.length,Q?.set(I.points,w),w+=I.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let I=0;I<w;I++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let O=0;O<o;O++)K[O]=A[B++];const i=A[B++],H=A[B++],G={varIndex:E,subscriptIndices:K};let t;i>=0?D?t=D.slice(i,i+H):t=new Float64Array(0):t=void 0,Q.push({varRef:{varSpec:G},points:t})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let I;const E=D.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const F of Q.lookups)resolveVarRef(this.listing,F.varRef,"lookup");const u=getEncodedLookupBufferLengths(Q.lookups);o=u.lookupsLength,K=u.lookupIndicesLength}else o=0,K=0;let i=0;function H(u,F){const l=i,M=u==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(F*M),N=Math.ceil(P/8)*8;return i+=N,l}const G=H("int32",headerLengthInElements),t=H("float64",extrasLengthInElements),O=H("float64",B),n=H("float64",w),f=H("int32",I),U=H("float64",o),q=H("int32",K),L=i;if(this.encoded===void 0||this.encoded.byteLength<L){const u=Math.ceil(L*1.2);this.encoded=new ArrayBuffer(u),this.header.update(this.encoded,G,headerLengthInElements)}const c=this.header.view;let a=0;c[a++]=t,c[a++]=extrasLengthInElements,c[a++]=O,c[a++]=B,c[a++]=n,c[a++]=w,c[a++]=f,c[a++]=I,c[a++]=U,c[a++]=o,c[a++]=q,c[a++]=K,this.inputs.update(this.encoded,O,B),this.extras.update(this.encoded,t,extrasLengthInElements),this.outputs.update(this.encoded,n,w),this.outputIndices.update(this.encoded,f,I),this.lookups.update(this.encoded,U,o),this.lookupIndices.update(this.encoded,q,K);const J=this.inputs.view;for(let u=0;u<A.length;u++){const F=A[u];typeof F=="number"?J[u]=F:J[u]=F.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const I=B[w++],E=B[w++],o=B[w++],K=B[w++],i=B[w++],H=B[w++],G=B[w++],t=B[w++],O=B[w++],n=B[w++],f=B[w++],U=B[w++],q=E*Float64Array.BYTES_PER_ELEMENT,L=K*Float64Array.BYTES_PER_ELEMENT,c=H*Float64Array.BYTES_PER_ELEMENT,a=t*Int32Array.BYTES_PER_ELEMENT,J=n*Float64Array.BYTES_PER_ELEMENT,u=U*Int32Array.BYTES_PER_ELEMENT,F=D+q+L+c+a+J+u;if(A.byteLength<F)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,i,H),this.outputIndices.update(this.encoded,G,t),this.lookups.update(this.encoded,O,n),this.lookupIndices.update(this.encoded,f,U)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,I=!D;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<w;o+=2){const K=B[o];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const i=B[o-2],H=B[o-1],G=B[o+1],t=K-i,O=G-H;return H+O/t*(A-i)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const I=Q[w];if(I>=A){const E=Q[w-2],o=Q[w-1],K=Q[w+1],i=I-E,H=K-o;return o+H/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,I,E){const o=Math.floor((E-B)/I);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*I,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,I){return A.currentTime>w?A.currentTime<I||w>I?B*(A.currentTime-w):B*(I-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,I){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let o=D.get(w);o===void 0&&(o=Array(w),D.set(w,o));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=I>0?1:-1;E.sort((i,H)=>{let G;return i.x<H.x?G=-1:i.x>H.x?G=1:G=0,G*K});for(let i=0;i<w;i++)o[i]=E[i].ind;return o},XIDZ(B,w,I){return Math.abs(w)<EPSILON?I:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const I=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,i)=>{runJsModel(A,Q,B,w,I,E,o,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,I,E,o,K,i,H){let G=D;A.setTime(G);const t={timeStep:B,currentTime:G};if(A.getModelFunctions().setContext(t),A.initConstants(),i!==void 0)for(const L of i)A.setLookup(L.varRef.varSpec,L.points);E?.length>0&&A.setInputs(L=>E[L]),A.initLevels();const O=Math.round((Q-D)/B),n=Q;let f=0,U=0,q=0;for(;f<=O;){if(A.evalAux(),G%w<1e-6){q=0;const L=c=>{const a=q*I+U;o[a]=G<=n?c:void 0,q++};if(K!==void 0){let c=0;const a=K[c++];for(let J=0;J<a;J++){const u=K[c++],F=K[c++];let l;F>0&&(l=K.subarray(c,c+F),c+=F);const M={varIndex:u,subscriptIndices:l};A.storeOutput(M,L)}}else A.storeOutputs(L);U++}if(f===O)break;A.evalLevels(),G+=B,A.setTime(G),t.currentTime=G,f++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),I=w/4,E=A.HEAP32.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),I=w/8,E=A.HEAPF64.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,I,E,o;const K=A.getLookups();if(K!==void 0)for(const O of K){const n=O.varRef.varSpec,f=((D=n.subscriptIndices)==null?void 0:D.length)||0;let U;f>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<f)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,f)),this.lookupSubIndicesBuffer.getArrayView().set(n.subscriptIndices),U=this.lookupSubIndicesBuffer.getAddress()):U=0;let q,L;if(O.points){const a=O.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<a)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,a)),this.lookupDataBuffer.getArrayView().set(O.points),q=this.lookupDataBuffer.getAddress(),L=a/2}else q=0,L=0;const c=n.varIndex;this.wasmSetLookup(c,U,q,L)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),O=>{var n;return(n=this.inputsBuffer)==null||n.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,O),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),O=>{var n;return(n=this.outputIndicesBuffer)==null||n.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,O),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const H=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<H)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,H));const G=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const t=perfElapsed(G);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(t)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(g,C){B=g,w=C}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_average_caloric_availability_per_capita_per_day","_average_caloric_consumption_per_capita_per_day","_average_total_daily_calorie_intake","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_calories_per_capita_per_day","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effective_food_demand_per_capita_per_day","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_allocated_for_animal_calories","_land_allocated_for_energy_crops","_land_allocated_for_food_crops","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen","_nitrogen_from_application_with_manure","_nitrogen_from_commerical_application","_nitrogen_from_denitrification","_nitrogen_from_runoff","_nitrogen_from_uptake_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus","_phosphorus_from_application_with_manure","_phosphorus_from_commerical_application","_phosphorus_from_runoff","_phosphorus_from_uptake_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_daily_calorie_supply_per_capita","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function H(g){return Q.locateFile?Q.locateFile(g,i):i+g}var G,t;(o||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(t=function(g){try{var C=new XMLHttpRequest;return C.open("GET",g,!1),C.responseType="arraybuffer",C.send(null),new Uint8Array(C.response)}catch(e){var s=DA(g);if(s)return s;throw e}}),G=function(g,C,s){var e=new XMLHttpRequest;e.open("GET",g,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){C(e.response);return}var h=DA(g);if(h){C(h.buffer);return}s()},e.onerror=s,e.send(null)});var O=Q.print||console.log.bind(console),n=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var f;Q.wasmBinary&&(f=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&W("no native wasm support detected");var U,q=!1;function L(g,C){g||W("Assertion failed: "+C)}function c(g){var C=Q["_"+g];return L(C,"Cannot call unknown function "+g+", make sure it is exported"),C}function a(g,C,s,e,h){var y={string:function(R){var x=0;if(R!=null&&R!==0){var eA=(R.length<<2)+1;x=gA(eA),P(R,x,eA)}return x},array:function(R){var x=gA(R.length);return N(R,x),x}};function k(R){return C==="string"?l(R):C==="boolean"?!!R:R}var r=c(g),z=[],S=0;if(e)for(var Y=0;Y<e.length;Y++){var rA=y[s[Y]];rA?(S===0&&(S=sA()),z[Y]=rA(e[Y])):z[Y]=e[Y]}var IA=r.apply(null,z);function FA(R){return S!==0&&KA(S),k(R)}return IA=FA(IA),IA}function J(g,C,s,e){s=s||[];var h=s.every(function(k){return k==="number"}),y=C!=="string";return y&&h&&!e?c(g):function(){return a(g,C,s,arguments)}}var u=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function F(g,C,s){for(var e=C+s,h=C;g[h]&&!(h>=e);)++h;if(h-C>16&&g.subarray&&u)return u.decode(g.subarray(C,h));for(var y="";C<h;){var k=g[C++];if(!(k&128)){y+=String.fromCharCode(k);continue}var r=g[C++]&63;if((k&224)==192){y+=String.fromCharCode((k&31)<<6|r);continue}var z=g[C++]&63;if((k&240)==224?k=(k&15)<<12|r<<6|z:k=(k&7)<<18|r<<12|z<<6|g[C++]&63,k<65536)y+=String.fromCharCode(k);else{var S=k-65536;y+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return y}function l(g,C){return g?F(Z,g,C):""}function M(g,C,s,e){if(!(e>0))return 0;for(var h=s,y=s+e-1,k=0;k<g.length;++k){var r=g.charCodeAt(k);if(r>=55296&&r<=57343){var z=g.charCodeAt(++k);r=65536+((r&1023)<<10)|z&1023}if(r<=127){if(s>=y)break;C[s++]=r}else if(r<=2047){if(s+1>=y)break;C[s++]=192|r>>6,C[s++]=128|r&63}else if(r<=65535){if(s+2>=y)break;C[s++]=224|r>>12,C[s++]=128|r>>6&63,C[s++]=128|r&63}else{if(s+3>=y)break;C[s++]=240|r>>18,C[s++]=128|r>>12&63,C[s++]=128|r>>6&63,C[s++]=128|r&63}}return C[s]=0,s-h}function P(g,C,s){return M(g,Z,C,s)}function N(g,C){m.set(g,C)}var m,Z,j;function b(g){Q.HEAP8=m=new Int8Array(g),Q.HEAP16=new Int16Array(g),Q.HEAP32=j=new Int32Array(g),Q.HEAPU8=Z=new Uint8Array(g),Q.HEAPU16=new Uint16Array(g),Q.HEAPU32=new Uint32Array(g),Q.HEAPF32=new Float32Array(g),Q.HEAPF64=new Float64Array(g)}Q.INITIAL_MEMORY;var _,$=[],T=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());wA($)}function kA(){wA(T)}function GA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());wA(p)}function PA(g){$.unshift(g)}function HA(g){T.unshift(g)}function cA(g){p.unshift(g)}var v=0,V=null;function aA(g){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function OA(g){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&V){var C=V;V=null,C()}}Q.preloadedImages={},Q.preloadedAudios={};function W(g){Q.onAbort&&Q.onAbort(g),g="Aborted("+g+")",n(g),q=!0,g+=". Build with -s ASSERTIONS=1 for more info.";var C=new WebAssembly.RuntimeError(g);throw w(C),C}var EA="data:application/octet-stream;base64,";function BA(g){return g.startsWith(EA)}function oA(g){return g.startsWith("file://")}var d;d="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAxEBAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBsIzOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKnJwPOsEFAgt/AXwjAEEQayIGJAACQEHAgQ4oAgAiAgRAIAJByIEOKAIAIgFBzIEOKAIAbEEDdGpB0IEOKAIAQQN0aiAAOQMAQciBDiABQQFqNgIADAELQbiBDigCACIBRQRAAn9BoOUFKwMAQbifBisDAKFBkJ8HKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQbiBDkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQbyBDigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBARGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEG8gQ5BvIEOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBEaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAFIAIQDgsgBUGAAmokAAvyAgICfwF+AkAgAkUNACAAIAJqIgNBAWsgAToAACAAIAE6AAAgAkEDSQ0AIANBAmsgAToAACAAIAE6AAEgA0EDayABOgAAIAAgAToAAiACQQdJDQAgA0EEayABOgAAIAAgAToAAyACQQlJDQAgAEEAIABrQQNxIgRqIgMgAUH/AXFBgYKECGwiATYCACADIAIgBGtBfHEiBGoiAkEEayABNgIAIARBCUkNACADIAE2AgggAyABNgIEIAJBCGsgATYCACACQQxrIAE2AgAgBEEZSQ0AIAMgATYCGCADIAE2AhQgAyABNgIQIAMgATYCDCACQRBrIAE2AgAgAkEUayABNgIAIAJBGGsgATYCACACQRxrIAE2AgAgBCADQQRxQRhyIgRrIgJBIEkNACABrUKBgICAEH4hBSADIARqIQEDQCABIAU3AxggASAFNwMQIAEgBTcDCCABIAU3AwAgAUEgaiEBIAJB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ojkDAEHI8A1B+O4HKwMAQZjFDCsDAKI5AwBBmO8NQcjtBysDAEHowwwrAwCiOQMAQcDwDUHw7gcrAwBBkMUMKwMAojkDAEGQ7w1BwO0HKwMAQeDDDCsDAKI5AwBBuPANQejuBysDAEGIxQwrAwCiOQMAQYjvDUG47QcrAwBB2MMMKwMAojkDAEGw8A1B4O4HKwMAQYDFDCsDAKI5AwBBgO8NQbDtBysDAEHQwwwrAwCiOQMAQajwDUHY7gcrAwBB+MQMKwMAojkDAEH47g1BqO0HKwMAQcjDDCsDAKI5AwBBoPANQdDuBysDAEHwxAwrAwCiOQMAQfDuDUGg7QcrAwBBwMMMKwMAojkDAEGY8A1ByO4HKwMAQejEDCsDAKI5AwBB6O4NQZjtBysDAEG4wwwrAwCiOQMAQZDwDUHA7gcrAwBB4MQMKwMAojkDAEHg7g1BkO0HKwMAQbDDDCsDAKI5AwBBiPANQbjuBysDAEHYxAwrAwCiOQMAQbDyDUHA4wcrAwBBsMQMKwMAojkDAEHY8w1B6OQHKwMAQdjFDCsDAKI5AwBBqPINQbjjBysDAEGoxAwrAwCiOQMAQdDzDUHg5AcrAwBB0MUMKwMAojkDAEGg8g1BsOMHKwMAQaDEDCsDAKI5AwBByPMNQdjkBysDAEHIxQwrAwCiOQMAQZjyDUGo4wcrAwBBmMQMKwMAojkDAEHA8w1B0OQHKwMAQcDFDCsDAKI5AwBBkPINQaDjBysDAEGQxAwrAwCiOQMAQbjzDUHI5AcrAwBBuMUMKwMAojkDAEGI8g1BmOMHKwMAQYjEDCsDAKI5AwBBgPINQZDjBysDAEGAxAwrAwCiOQMAQfjxDUGI4wcrAwBB+MMMKwMAojkDAEGw8w1BwOQHKwMAQbDFDCsDAKI5AwBBqPMNQbjkBysDAEGoxQwrAwCiOQMAQaDzDUGw5AcrAwBBoMUMKwMAojkDAEHw8Q1BgOMHKwMAQfDDDCsDAKI5AwBBmPMNQajkBysDAEGYxQwrAwCiOQMAQejxDUH44gcrAwBB6MMMKwMAojkDAEGQ8w1BoOQHKwMAQZDFDCsDAKI5AwBB4PENQfDiBysDAEHgwwwrAwCiOQMAQYjzDUGY5AcrAwBBiMUMKwMAojkDAEHY8Q1B6OIHKwMAQdjDDCsDAKI5AwBBgPMNQZDkBysDAEGAxQwr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Qai9BUKAgICAwNigicEANwMAQaC9BUKAgICAoP6VksEANwMAQZi9BUKAgICAgPvNmcEANwMAQZC9BUKAgICAoMfJnsEANwMAQYi9BUKAgICAgPSIosEANwMAQYC9BUKAgICA4MmupcEANwMAQfi8BUKAgICA+NPGqMEANwMAQfC8BUKAgICAwKzMqsEANwMAQei8BUKAgICAoP3grMEANwMAQeC8BUKAgICA+Ob8rsEANwMAQdi8BUKAgICAwP3ksMEANwMAQdC8BUKAgICAoLqLssEANwMAQci8BUKAgICA4Iaus8EANwMAQcC8BUKAgICAgICA+D83AwBBiL8FQoCAgICAgID4PzcDAEGAwAVCgICAgIDYjuzAADcDAEH4vwVCgICAgICA3PfAADcDAEHwvwVCgICAgIDM0YDBADcDAEHovwVCgICAgIC3lIjBADcDAEHgvwVCgICAgICUsIzBADcDAEHYvwVCgICAgKC+xpDBADcDAEHQvwVCgICAgODGrJPBADcDAEHIvwVCgICAgMCJw5bBADcDAEHAvwVCgICAgIDh/5jBADcDAEG4vwVCgICAgMDU6prBADcDAEGwvwVCgICAgMDW25zBADcDAEGovwVCgICAgODJ9p7BADcDAEGgvwVCgICAgICAgPg/NwMAQZi/BUKAgICAgICA+D83AwBBkL8FQoCAgICAgID4PzcDAEGAvwVCgICAgICAqLHAADcDAEH4vgVCgICAgICAtMPAADcDAEHwvgVCgICAgICAxdTAADcDAEHovgVCgICAgIDQyuPAADcDAEHgvgVCgICAgIDE2fLAADcDAEHYvgVCgICAgICokv/AADcDAEHQvgVCgICAgIC/6YnBADcDAEHIvgVCgICAgOD+5ZLBADcDAEHAvgVCgICAgODEmZrBADcDAEG4vgVCgICAgICZvJ/BADcDAEGwvgVCgICAgMCN2KLBADcDAEGovgVCgICAgODYl6bBADcDAEGgvgVCgICAgPj1ianBADcDAEGYvgVCgICAgPjYn6vBADcDAEHYwQVCgICAgICAgPg/NwMAQdDBBUKAgICAgIDIvcAANwMAQcjBBUKAgICAgMCr0MAANwMAQcDBBUKAgICAgKCV4cAANwMAQbjBBUKAgICAgOy78MAANwMAQbDBBUKAgICAgLTS/8AANwMAQajBBUKAgICAgIKJi8EANwMAQaDBBUKAgICAoM2ulsEANwMAQZjBBUKAgICAoNHkn8EANwMAQZDBBUKAgICAwOz0psEANwMAQYjBBUKAgICA6NGnq8EANwMAQYDBBUKAgICAwKrQr8EANwMAQfjABUKAgICA2LCvssEANwMAQfDABUKAgICA2O6itcEANwMAQejABUKAgICAqMCcuMEANwMAQeDABUKAgICA8JTzucEANwMAQdjABUKAgICAwLPPu8EANwMAQdDABUKAgICA9PbRvcEANwMAQcjABUKAgICAnIDtwMEANwMAQcDABUKAgICAluqBxcEANwMAQbjABUKAgICAj93SycEANwMAQbDABUKAgICAmrmJy8EANwMAQajABUKAgICAgICAn8AANwMAQaDABUKAgICAgICQscAANwMAQZjABUKAgICAgICEwsAANwMAQZDABUKAgICAgICi0cAANwMAQYjABUKAgICAgNDH4MAANwMAQfDBBUKAgICA2IfStsEANwMAQejBBUKAgICAiP+euMEANwMAQeDBBUKAgICAgICA+D83AwBBgMMFQoCAgICAgID4PzcDAEHgwwVCgICAgIDL65vBADcDAEHYwwVCgICAgMCy/aDBADcDAEHQwwVCgICAgMCctKTBADcDAEHIwwVCgICAgND0najBADcDAEHAwwVCgICAgNjuxKrBADcDAEG4wwVCgICAgICqh63BADcDAEGwwwVCgICAgMiZ3K/BADcDAEGowwVCgICAgPT7nLHBADcDAEGgwwVCgICAgMCd6rLBADcDAEGYwwVCgICAgKivt7TBADcDAEGQwwVCgICAgICAgPg/NwMAQYjDBUKAgICAgICA+D83AwBB+MIFQoCAgICAgNi0wAA3AwBB8MIFQoCAgICAgMzHwAA3AwBB6MIFQoCAgICAoMnYwAA3AwBB4MIFQoCAgICA8OrnwAA3AwBB2MIFQoCAgICApND2wAA3AwBB0MIFQoCAgICA+KyCwQA3AwBByMIFQoCAgICAkLeNwQA3AwBBwMIFQoCAgICgquGWwQA3AwBBuMIFQoCAgICA5/idwQA3AwBBsMIFQoCAgIDwyMmiwQA3AwBBqMIFQoCAgICArc6mwQA3AwBBoMIFQoCAgIDgj9mpwQA3AwBBmMIFQoCAgICwvLSswQA3AwBBkMIFQoCAgIDwm7CvwQA3AwBBiMIFQoCAgIDw6KCxwQA3AwBBgMIFQoCAgIDQ3+6ywQA3AwBB+MEFQoCAgICgvOC0wQA3AwBBqMQFQoCAgICAgID4PzcDAEHIxQVCgICAgICAwKDAADcDAEHAxQVCgICAgICA0LLAADcDAEG4xQVCgICAgICA0sPAADcDAEGwxQVCgICAgIDA4NLAADcDAEGoxQVCgICAgIDw9+HAADcDAEGgxQVCgICAgICQiO7AADcDAEGYxQVCgICAgIDsj/nAADcDAEGQxQVCgICAgIC9g4LBADcDAEGIxQVCgICAgIC8vInBADcDAEGAxQVCgICAgMCEr47BADcDAEH4xAVCgICAgIDK9pHBADcDAEHwxAVCgICAgOCglpXBADcDAEHoxAVCgICAgOCLt5jBADcDAEHgxAVCgICAgOCHuZrBADcDAEHYxAVCgICAgODgyZzBADcDAEHQxAVCgICAgMDG4Z7BADcDAEHIxAVCgICAgID+1KDBADcDAEHAxAVCgICAgICAgPg/NwMAQbjEBUKAgICAgICA+D83AwBBsMQFQoCAgICAgID4PzcDAEGgxAVCgICAgICA4LLAADcDAEGYxAVCgICAgICAoMXAADcDAEGQxAVCgICAgICAx9bAADcDAEGIxAVCgICAgICQueXAADcDAEGAxAVCgICAgIDwtfTAADcDAEH4wwVCgICAgICL5YDBADcDAEHwwwVCgICAgIDos4vBADcDAEHowwVCgICAgOCrxJTBADcDAEHQxQVCyaSSyaSSyfw/NwMAQZjGBUKz5syZs+bM8T83AwBBkMYFQrPmzJmz5szpPzcDAEGIxgVCgICAgICAgPQ/NwMAQYDGBULNmbPmzJmz+j83AwBB2MUFQubMmbPmzJnzPzcDAEGgxgVC5syZs+bMmfc/NwMAQdjHBUKAgIDAgYv22MEANwMAQfjIBUKAgICAgPK2gMEANwMAQfDIBUKAgICAgLekmMEANwMAQejIBUKAgICAuNLaqcEANwMAQeDIBUKAgICA0MbltcEANwMAQdjIBUKAgICAwKzGvMEANwMAQdDIBUKAgICA4oSbw8EANwMAQcjIBUKAgICAyrHWx8EANwMAQcDIBUKAgICA643PycEANwMAQbjIBUKAgICArum/y8EANwMAQbDIBUKAgICA/ozHzMEANwMAQajI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QqjhttX/1onbPzcDAEHAmgZCgICAgICAgPg/NwMAQciaBkKuj4XXx8Lr+T83AwBB0JoGQoCAgICAgMfgwAA3AwBB2JoGQrPmzJmz5szpPzcDAEHgmgZCgICAgICA8KvAADcDAEHomgZCgICAgICAgPg/NwMAQfCaBkKAgICAgICAisAANwMAQfiaBkKAgICAgICAisAANwMAQYCbBkKAgICAgIDQv8AANwMAQYibBkKAgICAgICAiMAANwMAQZCbBkKAgICAgMCa9MAANwMAQZibBkKAgICAgIDgoMAANwMAQaCbBkKAgICAgMCa9MAANwMAQaibBkKAgICAgMCa9MAANwMAQbCbBkKAgICArIWZ+MEANwMAQZCZBkLC/sz6uouB4D83AwBBiJkGQsL+zPq6i4HgPzcDAEGAmQZCwv7M+rqLgeA/NwMAQfiYBkLC/sz6uouB4D83AwBBuJsGQgA3AwBBwJsGQrDloYvZnfuzwAA3AwBByJsGQtucl8Wrlfv+PzcDAEHQmwZC2Z3fn7W8iY3AADcDAEHYmwZCADcDAEHgmwZCgICAgICAgKLAADcDAEHomwZCADcDAEHwmwZCgICA+u/dj7XCADcDAEH4mwZCgICAgID4l/HAADcDAEGAnAZCADcDAEGInAZCADcDAEGYnAZCjPyo+4n6uK8/NwMAQZCcBkIANwMAQaCcBkKAgIDkidy6ucIANwMAQaicBkIANwMAQeicBkLso+H10fD6g8AANwMAQeCcBkKPhdfHwuvjicAANwMAQdicBkKKro+F18fC9z83AwBB0JwGQsPro+H10fDqPzcDAEHwnAZCADcDAEH4nAZCADcDAEGAnQZCADcDAEGInQZCADcDAEGQnQZCgICA/Jve6JvCADcDAEGYnQZCgICAqOCcuoHCADcDAEGgnQZCgICAgOTf6crBADcDAEGonQZCgICAgOTM1LDBADcDAEGwnQZCgICAgPPeqOnBADcDAEG4nQZCgICAgLix9M7BADcDAEHAnQZCgICAgKyFmfjBADcDAEHInQZCgICAgIDHzojBADcDAEHQnQZCr6fZv+rTxco/NwMAQdidBkKAgICAgICA+D83AwBB4J0GQvuouL2U3J7CPzcDAEHonQZCgICAgPKLqJHCADcDAEHwnQZCgICAgJKEo/fBADcDAEH4nQZCgICAgNCs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wAA3AwBB8K0GQs2Zs+bMx87ywAA3AwBB6K0GQoCAgICA3uL9wAA3AwBB4K0GQoCAgICAopGHwQA3AwBB2K0GQoCAgICAi6aOwQA3AwBB0K0GQoCAgICA9OuSwQA3AwBByK0GQoCAgICA5v2WwQA3AwBBwK0GQoCAgIDgzfiZwQA3AwBBoK4GQvuouL2U3J7CPzcDAEHYrwZCgICAgICAgPg/NwMAQdCvBkKAgICAgICAscAANwMAQcivBkKAgICAgICIw8AANwMAQcCvBkKAgICAgMCV1MAANwMAQbivBkKAgICAgMCe48AANwMAQbCvBkKAgICAgOyw8sAANwMAQaivBkKAgICAgNzY/sAANwMAQaCvBkKAgICAwJDEicEANwMAQZivBkKAgICAgPe8ksEANwMAQZCvBkKAgICA4N/ymcEANwMAQYivBkKAgICA4K2Bn8EANwMAQYCvBkKAgICAsLqvosEANwMAQfiuBkKAgICAkN/hpcEANwMAQfCuBkKAgICA8LLnqMEANwMAQeiuBkKAgICA0PX0qsEANwMAQeCuBkKAgICAkOmRrcEANwMAQdiuBkKAgICA2JG2r8EANwMAQdCuBkKAgICA2NCGscEANwMAQciuBkKAgICAiOOvs8EANwMAQcCuBkKAgICA8Ovdt8EANwMAQbiuBkKAgICAqPDRusEANwMAQbCuBkKAgICAmLWbvMEANwMAQZiwBkKAgICAwNLEmcEANwMAQZCwBkKAgICA4Lnom8EANwMAQYiwBkKAgICAwPWcnsEANwMAQYCwBkKAgICAsNqsoMEANwMAQfivBkKAgICAgLrmocEANwMAQfCvBkKAgICA8Iugo8EANwMAQeivBkKAgICAkLLVpMEANwMAQeCvBkKAgICAgICA+D83AwBBgLEGQoCAgICAgID4PzcDAEGIsgZCgICAgICA9dTAADcDAEGAsgZCgICAgICQ9+PAADcDAEH4sQZCgICAgIDYuPDAADcDAEHwsQZCgICAgICc+vrAADcDAEHosQZCgICAgICGhYTBADcDAEHgsQZCgICAgIDlr4vBADcDAEHYsQZCgICAgICG0JDBADcDAEHQsQZCgICAgODH9ZPBADcDAEHIsQZCgICAgIDT6JfBADcDAEHAsQZCgICAgMDSj5rBADcDAEG4sQZCgICAgICyxZzBADcDAEGwsQZCgICAgIDojJ/BADcDAEGosQZCgICAgICw7qDBADcDAEGgsQZCgICAgPDEs6LBADcDAEGYsQZCgICAgODK+KPBADcDAEGQsQZCgICAgICAgPg/NwMAQYixBkKAgICAgICA+D83AwBB+LAGQoCAgICAgOChwAA3AwBB8LAGQoCAgICAgIC0wAA3AwBB6LAGQoCAgICAgJbFwAA3AwBB4LAGQoCAgICAwJXUwAA3AwBB2LAGQoCAgICA4J7jwAA3AwBB0LAGQoCAgICAoPTvwAA3AwBByLAGQoCAgICAhqn6wAA3AwBBwLAGQoCAgICA6quDwQA3AwBBuLAGQoCAgIDAwduKwQA3AwBBsLAGQoCAgICAkZCQwQA3AwBBqLAGQoCAgICgn52TwQA3AwBBoLAGQoCAgIDAufOWwQA3AwBBqLIGQoCAgICAgID4PzcDAEHIswZCgICAgICAgJDAADcDAEHAswZCgICAgICAoKLAADcDAEG4swZCgICAgICAmLPAADcDAEGwswZCgICAgICAqsLAADcDAEGoswZCgICAgIDAxdHAADcDAEGgswZCgICAgICAwd3AADcDAEGYswZCgICAgIDg4ejAADcDAEGQswZCgICAgIDs0PHAADcDAEGIswZCgICAgIDQjPnAADcDAEGAswZCgICAgIC85v3AADcDAEH4sgZCgICAgIC5xIHBADcDAEHwsgZCgICAgIDd04TBADcDAEHosgZCgICAgIDCjIjBADcDAEHgsgZCgICAgMCnhIrBADcDAEHYsgZCgICAgMCfiozBADcDAEHQsgZCgICAgICAl47BADcDAEHIsgZCgICAgMCdqZDBADcDAEHAsgZCgICAgICAgPg/NwMAQbiyBkKAgICAgICA+D83AwBBsLIGQoCAgICAgID4PzcDAEGgsgZCgICAgICAoKLAADcDAEGYsgZCgICAgICA4LTAADcDAEGQsgZCgICAgICA/sXAADcDAEH4swZCgICAgLDL+qzBADcDAEHwswZCgICAgODumq/BADcDAEHoswZCgICAgNCz77HBADcDAEHgswZCgICAgNDFwbbBADcDAEHYswZCgICAgLDq4LrBADcDAEHQswZCgICAgIjKrLzBADcDAEH4tAZCgICAgICAgPg/NwMAQfC0BkKAgICAgICQr8AANwMAQei0BkKAgICAgICmwcAANwMAQeC0BkKAgICAgMCc0sAANwMAQdi0BkKAgICAgNC44cAANwMAQdC0BkKAgICAgLjc8MAANwMAQci0BkKAgICAgIys/MAANwMAQcC0BkKAgICAgI2BiMEANwMAQbi0BkKAgICAgMzmkMEANwMAQbC0BkKAgICAoKKomMEANwMAQai0BkKAgICA4J/OnMEANwMAQaC0BkKAgICAgKPboMEANwMAQZi0BkKAgICA4JLIo8EANwMAQZC0BkKAgICAoLHmpsEANwMAQYi0BkKAgICAgNGVqcEANwMAQYC0BkKAgICA4P+Eq8EANwMAQei1BkKAgICAgP78/sAANwMAQeC1BkKAgICAwLGdiMEANwMAQdi1BkKAgICAwJzGj8EANwMAQdC1BkKAgICAgK3lk8EANwMAQci1BkKAgICA4OaSmMEANwMAQcC1BkKAgICAwPvnmsEANwMAQbi1BkKAgICAgKXrncEANwMAQbC1BkKAgICAkK/JoMEANwMAQai1BkKAgICAoJeposEANwMAQaC1BkKAgICA4OeOpMEANwMAQZi1BkKAgICA0K2cpsEANwMAQZC1BkKAgICAuO+UqMEANwMAQYi1BkKAgICA+LSYqcEANwMAQYC1BkKAgICAgICA+D83AwBByLcGQoCAgICAgID4PzcDAEGgtgZCgICAgICAgPg/NwMAQdi3BkKAgICAgICA+D83AwBB0LcGQoCAgICAgID4PzcDAEHAtwZCgICAgICAgKTAADcDAEG4twZCgICAgICA4LbAADcDAEGwtwZCgICAgICAj8jAADcDAEGotwZCgICAgICA/9bAADcDAEGgtwZCgICAgIDw7OXAADcDAEGYtwZCgICAgIDI5vHAADcDAEGQtwZCgICAgIDo2/zAADcDAEGItwZCgICAgID+/IXBADcDAEGAtwZCgICAgICCmo3BADcDAEH4tgZCgICAgIDXgZLBADcDAEHwtgZCgICAgMCB65XBADcDAEHotgZCgICAgKCal5nBADcDAEHgtgZCgICAgICN4JvBADcDAEHYtgZCgICAgKDXx57BADcDAEHQtgZCgICAgPDx4aDBADcDAEHItgZCgICAgKDxpKLBADcDAEHAtgZCgICAgODiiaTBADcDAEG4tgZCgICAgODC7qXBADcDAEGwtgZCgICAgICAgPg/NwMAQai2BkKAgICAgICA+D83AwBBmLYGQoCAgICAgKCmwAA3AwBBkLYGQoCAgICAgNi4wAA3AwBBiLYGQoCAgICAgMfJwAA3AwBBgLYGQoCAgICAgOrYwAA3AwBB+LUGQoCAgICA8JPowAA3AwBB8LUGQoCAgICAtMXzwAA3AwBB8LgGQoCAgICgmPuUwQA3AwBB6LgGQoCAgICAgICSwAA3AwBB4LgGQoCAgICAgOCjwAA3AwBB2LgGQoCAgICAgIC1wAA3AwBB0LgGQoCAgICAgIDEwAA3AwBByLgGQoCAgICAwIrTwAA3AwBBwLgGQoCAgICAoNffwAA3AwBBuLgGQoCAgICAoJbqwAA3AwBBsLgGQoCAgICAmJfzwAA3AwBBqLgGQoCAgICAgsj6wAA3AwBBoLgGQoCAgICArIGAwQA3AwBBmLgGQoCAgICA6IiDwQA3AwBBkLgGQoCAgICAqtiGwQA3AwBBiLgGQoCAgIDApLOJwQA3AwBBgLgGQoCAgICA+dKLwQA3AwBB+LcGQoCAgIDAg4OOwQA3AwBB8LcGQoCAgICgwZ2QwQA3AwBB6LcGQoCAgICAz9SRwQA3AwBB4LcGQoCAgICAgID4PzcDAEH4uAZC/NPGl93JmKg/NwMAQYC5BkKAgICAgICAhMAANwMAQYi5BkL7qLi9lNye2j83AwBBkLkGQoCAgICAgICKwAA3AwBBmLkGQoCAgICAgICKwAA3AwBBoLkGQoCAgICAgICKwAA3AwBBqLkGQoCAgICAgICKwAA3AwBBsLkGQoCAgICAgICKwAA3AwBB6LkGQgA3AwBB4LkGQgA3AwBB2LkGQgA3AwBB8LkGQgA3AwBB6LoGQoCAgICAgID8PzcDAEHwugZCz+/Pmt70pvo/NwMAQai8BkL3z7Ca57CP2T83AwBBiLoGQgA3AwBBgLoGQgA3AwBB+LkGQgA3AwBByL0GQr2U3J6KvvTTwAA3AwBBwL0GQpqz5syZs5XowAA3AwBBuL0GQpqz5syZg5nkwAA3AwBBsL0GQri9lNyeurzbwAA3AwBBqL0GQs2Zs+bMyaDqwAA3AwBBoL0GQpTcnoqut6bhwAA3AwBBmL0GQri9lNyeoufYwAA3AwBBkL0GQtfHwuuj0d3TwAA3AwBBiL0GQp+Kro+F16DQwAA3AwBBgL0GQqTh9dHwitvQwAA3AwBB+LwGQpTcnoqu77zQwAA3AwBB8LwGQsjC66PhtfbJwAA3AwBB6LwGQsjC66Ph9dbJwAA3AwBB4LwGQo+F18fC64bLwAA3AwBB2LwGQvzTxpfdiafGwAA3AwBB0LwGQp20kdvzu+LDwAA3AwBByLwGQt70puKgwI3FwAA3AwBBwLwGQuiituf3p8zGwAA3AwBBuLwGQuKg4MrD9r7DwAA3AwBBsLwGQtrI7fn9iYzFwAA3AwBBkLsGQtactJHbk6HGwAA3AwBBiLsGQomDgauOmre+wAA3AwBBgLsGQt+bgvPD1rrXPzcDAEGgvAZC4fXR8PqQ9ODAADcDAEGYvAZCgICAgIDg8+TAADcDAEGQvAZC0vD6qLjV893AADcDAEGIvAZCgICAgICQ5tTAADcDAEGAvAZC5syZs+a8v+XAADcDAEH4uwZC+dKbiYPhvMbAADcDAEHwuwZCpOH10fC69s7AADcDAEHouwZCvZTcnoru4M/AADcDAEHguwZCgICAgICQ+dXAADcDAEHYuwZC5syZs+asuNfAADcDAEHQuwZCro+F18eyn9PAADcDAEHIuwZC18fC66PxntHAADcDAEHAuwZCiq6PhdeHnMvAADcDAEG4uwZC9tHw+qiY8MvAADcDAEGwuwZCro+F18fCl87AADcDAEGouwZCyMLro+G1iczAADcDAEGguwZC0vD6qLj9xcvAADcDAEGYuwZChdfHwuujy8rAADcDAEHQvQZCADcDAEGovgZC1Krrncybqds/NwMAQaC+BkKi/4nc2KLN+D83AwBBmL4GQs3J7+zmjZOKwAA3AwBBkL4GQv+a2cb6kJKKwAA3AwBBiL4GQp/c5PHO0sP8PzcDAEGAvgZC0Jre9KbiwPk/NwMAQfi9BkLiiMLHtpzi7D83AwBBiL8GQt/2mcuE0Ob1PzcDAEGQvwZCzZmz5syZs/4/NwMAQdC/BkKAgICAgICAgMAANwMAQdi/BkKz5syZs+bM+z83AwBB6L8GQv+mqIiBjoL6PzcDAEHgvwZC7vn9qePL7vA/NwMAQfC/BkKAgICAgICAgMAANwMAQYDCBkIANwMAQZjABkEAQdAAEBEaQdDBBkIANwMAQcjBBkIANwMAQcDBBkIANwMAQdDCBkLjy+6kjISs6T83AwBB2MIGQoCAgICAgIDwPzcDAEHgwgZCzZmz5syZs5DAADcDAEHowgZCgICAgICAsLnAADcDAEHwwgZCgICAgICAsLnAADcDAEH4wgZCgICAgICAlMrAADcDAEGAwwZCgICAgICAiM7AADcDAEGIwwZC7KPh9dHwmqjAADcDAEGQwwZCqbi9lNyesp7AADcDAEGYwwZC7KPh9dHwmqjAADcDAEHoxAZCu76/6vjSm/U/NwMAQeDEBkLP78+a3vSm9j83AwBB2MQGQoyErLnoorb3PzcDAEHQxAZC0Jre9KbioPg/NwMAQcjEBkK0kdvz+9PG+D83AwBBiMQGQomDgauO2sjlPzcDAEGAxAZCpOH10fD6qOg/NwMAQfjDBkLV8aW3koaC6j83AwBB8MMGQq6PhdfHwuvrPzcDAEHowwZChdfHwuuj4e0/NwMAQeDDBkKGgtactJHb7z83AwBB2MMGQsPro+H10fDwPzcDAEHQwwZC18fC66Ph9fE/NwMAQcjDBkLBlYet5Pb88j83AwBBwMMGQqrjy+6kjIT0PzcDAEG4wwZCvZTcnoquj/U/NwMAQbDDBkKmt5KGgtac9j83AwBBqMMGQrnoorbn96f3PzcDAEGgwwZCrLnoorbn9/c/NwMAQejFBkKk4fXR8Pqo2D83AwBB4MUGQqTh9dHw+qjYPzcDAEHYxQZCpOH10fD6qNg/NwMAQdDFBkK6k7GQsOWh2z83AwBByMUGQpCw5aGL2Z3fPzcDAEHAxQZC/9TxpbeShuI/NwMAQbjFBkLCwJWHreT25D83AwBBsMUGQv6p48vupIzoPzcDAEGoxQZCreT2/P7U8ek/NwMAQaDFBkLayO35/anj6z83AwBBmMUGQtvz+9PGl93tPzcDAEGQxQZC2sjt+f2p4+8/NwMAQYjFBkLCwJWHreT28D83AwBBgMUGQquO2sjt+f3xPzcDAEH4xAZC6c3EwcCVh/M/NwMAQfDEBkKoja+6k7GQ9D83AwBBwMQGQpmI2PLQxezWPzcDAEG4xAZCmYjY8tDF7NY/NwMAQbDEBkKZiNjy0MXs1j83AwBBqMQGQovZnd+ftbzZPzcDAEGgxAZC8qW3koaC1tw/NwMAQZjEBkL4p42vupOx4D83AwBBkMQGQu+kjISsuejiPzcDAEGYxwZC9uTH8p3Yqoe/fzcDAEG4yAZCiM+lkKPAyvK/fzcDAEGwyAZCm6WynZy6leO/fzcDAEGoyAZCja+6k7GQsOG/fzcDAEGgyAZC6YbR5fDkx9i/fzcDAEGYyAZCyZ/ir7GNrsQ/NwMAQZDIBkKR8bPf7tDjvD83AwBBiMgGQvGorKyajfO1PzcDAEGAyAZCyozrivGN37A/NwMAQfjHBkLik+iina31qj83AwBB8McGQu2Q97fhtvKqPzcDAEHoxwZCop7ugdCH2qg/NwMAQeDHBkKY8p7wgY30oT83AwBB2McGQt2dt9uapO+ePzcDAEHQxwZC3JXbmdb7uZI/NwMAQcjHBkKprLjJxaj9g79/NwMAQcDHBkLjs5PbnaH+k79/NwMAQbjHBkK119nf3KOumb9/NwMAQbDHBkLQxLKQ78D2mr9/NwMAQajHBkKswJj72Onemr9/NwMAQaDHBkL11ezd4q//o79/NwMAQfjFBkLf9OK686WZlL9/NwMAQfDFBkK27Lqd0LW4nz83AwBBkMcGQvX44p2Ur/XIv383AwBBiMcGQoCJzcCirMTlv383AwBBgMcGQva/nbfamc7qv383AwBB+MYGQpXekfOR/+Div383AwBB8MYGQpeT1LvU1s/Jv383AwBB6MYGQr3014iyxavQv383AwBB4MYGQu2wuZXx8PHEv383AwBB2MYGQsaoqMPr0eS5v383AwBB0MYGQrSe68GH7Lepv383AwBByMYGQvOuw679raKoPzcDAEHAxgZCrf3b/82Yz6Y/NwMAQbjGBkLkrOOC+56XoT83AwBBsMYGQvLK4fKNt86hPzcDAEGoxgZCw5DVtZCe654/NwMAQaDGBkLb8a2L3+Gqmz83AwBBmMYGQoXh4uOb64aaPzcDAEGQxgZCg9nt1I2ggps/NwMAQYjGBkKGhIPJ96/bkD83AwBBgMYGQo2jldHGzYmKv383AwBBwMgGQpqz5syZs+bUPzcDAEHIyAZCmrPmzJmz5tw/NwMAQdDIBkKAgICAgICA+D83AwBB2MgGQoCAgICAgMCswAA3AwBB4MgGQoCAgICAgID4PzcDAEHoyAZCgICAgICAgPg/NwMAQfDIBkKAgICAgICA+D83AwBB+MgGQoCAgICAgID4PzcDAEGAyQZCgICAgICAgPg/NwMAQYjJBkKAgICAgICA+D83AwBBkMkGQoCAgICAgID4PzcDAEGgyQZCgICAgICAgOg/NwMAQZjJBkKAgICAgICA+D83AwBBqMkGQoCAgICAgID4PzcDAEGwyQZCgICAgICAgPA/NwMAQbjJBkKAgICAgICA+D83AwBBwMkGQvaGtqDfvojqPjcDAEHIyQZCgICAgICAgPg/NwMAQdDJBkKAgICA0Kzz5sEANwMAQdjJBkL7qLi9lNyeuj83AwBB4MkGQvuouL2U3J66PzcDAEHoyQZCADcDAEHwyQZCgICAgICAgIrAADcDAEH4yQZCgICAgICA0M/AADcDAEGAygZCADcDAEGIygZCmrPmzJmz5uw/NwMAQZDKBkKAgICAgICA8D83AwBBmMoGQoCAgICAgIDwPzcDAEGgygZCs+bMmbPmzOE/NwMAQajKBkL7qLi9lNyeyj83AwBBsMoGQvzTxpfdyZjAPzcDAEG4ygZC+6i4vZTcnso/NwMAQcDKBkKas+bMmbPm3D83AwBByMoGQri9lNyeiq7XPzcDAEHQygZC+6i4vZTcnsI/NwMAQdjKBkKKro+F18fC4z83AwBB4MoGQvuouL2U3J7CPzcDAEHoygZC05uJg4GrjvE/NwMAQfDKBkLZnd+ftbzpzT83AwBB+MoGQoXXx8Lro+GOwAA3AwBBgMsGQubMmbPmzJnzPzcDAEGoywZCgICAgICAgIrAADcDAEGgywZCgICAgICAwKTAADcDAEGYywZCgICAgICAwJzAADcDAEGQywZCgICAgICAgJfAADcDAEGIywZCADcDAEGwywZCgICAgIDAltjAADcDAEHgzAZCADcDAEGwzwZCADcDAEHg0AZCgICAgICAgPg/NwMAQejQBkL2hrag376I6j43AwBB8NAGQoCAgIDQrPPewQA3AwBB+NAGQoCAgICAgID4PzcDAEGA0QZCgICAgICAgPg/NwMAQYjRBkKAgICA0Kzz5sEANwMAQZDRBkK/6vjSm4mD8z83AwBBmNEGQoCAgICAgICEwAA3AwBBoNEGQgA3AwBBiM4GQgA3AwBB2NAGQgA3AwBBqNEGQgA3AwBBsNEGQo+F18fC66PpPzcDAEG40QZCgICAgICAgJ/AADcDAEHA0QZCgICAgICAgIDAADcDAEHI0QZC3J6Kro+F1/c/NwMAQdDRBkKas+bMmbPm3D83AwBB2NEGQoCAgICAgID4PzcDAEHg0QZCgICAgICAgPg/NwMAQbjTBkLx+qi4vbSYzsAANwMAQbDTBkKz5syZs4bbzsAANwMAQajTBkLmzJmz5oy4zcAANwMAQaDTBkLcnoquj6WyzMAANwMAQZjTBkLgysOWspurx8AANwMAQdjSBkK9lNyeis6sz8AANwMAQdDSBkK9lNyeis6sz8AANwMAQcjSBkK9lNyeit6o0cAANwMAQcDSBkK9lNyeit6o0cAANwMAQbjSBkK9lNyeit6o0cAANwMAQbDSBkK9lNyeit6o0cAANwMAQajSBkK9lNyeit6o0cAANwMAQaDSBkK9lNyeit6o0cAANwMAQZjSBkL20fD6qOi90cAANwMAQZDSBkL20fD6qOi90cAANwMAQYjSBkLIwuuj4fXD0cAANwMAQYDSBkLD66Ph9fGAz8AANwMAQfjRBkK9lNyeio6rzcAANwMAQfDRBkK9lNyeis6fyMAANwMAQbjUBkL20fD6qNiHzcAANwMAQbDUBkL20fD6qNiHzcAANwMAQajUBkL20fD6qNiHzcAANwMAQaDUBkL20fD6qNiHzcAANwMAQZjUBkL20fD6qNiHzcAANwMAQZDUBkL20fD6qNiHzcAANwMAQYjUBkL20fD6qNiHzcAANwMAQYDUBkL20fD6qNiHzcAANwMAQfjTBkL20fD6qNiHzcAANwMAQfDTBkLx+qi4vZTlzsAANwMAQejTBkLx+qi4vZTlzsAANwMAQeDTBkLx+qi4vZTlzsAANwMAQdjTBkLx+qi4vZTlzsAANwMAQdDTBkLx+qi4vZTlzsAANwMAQcjTBkLx+qi4vZTlzsAANwMAQcDTBkLx+qi4vbSYzsAANwMAQZDTBkK9lNyeis6sz8AANwMAQYjTBkK9lNyeis6sz8AANwMAQYDTBkK9lNyeis6sz8AANwMAQfjSBkK9lNyeis6sz8AANwMAQfDSBkK9lNyeis6sz8AANwMAQejSBkK9lNyeis6sz8AANwMAQeDSBkK9lNyeis6sz8AANwMAQcDUBkKas+bMmbPm3D83AwBByNQGQgA3AwBB0NQGQoCAgICAgMCswAA3AwBB2NQGQoCAgICAgID4PzcDAEHg1AZChdfHwuujgZTAADcDAEHo1AZCiq6PhdfHgpjAADcDAEHw1AZCi9md35+1gKPAADcDAEH41AZC3d/YtLHVk8E+NwMAQYDVBkKF18fC66Ph9T83AwBByNUGQtfHwuuj4fXhPzcDAEHA1QZC18fC66Ph9eE/NwMAQbjVBkKXsru+v+r48D83AwBBsNUGQvPQxezO78/aPzcDAEGQ1QZCquPL7qSMhNQ/NwMAQdDVBkKq48vupIyE1D83AwBBkNYGQs2Zs+bMmbPuPzcDAEGY1gZCgICAgIDAg9DAADcDAEGg1gZCzZmz5syZs/Y/NwMAQajWBkKAgICAgIDQz8AANwMAQbDWBkKas+bMmbPmzD83AwBBuNYGQpWYqtLOgM24PzcDAEHA1gZCueiituf3p8U/NwMAQcjWBkKAgICAgPCEjsEANwMAQdjWBkL18+rW2L/foMAANwMAQdDWBkKas+bMmbPm5D83AwBB4NYGQoCAgICAgMS4wAA3AwBB6NYGQoCAgICAgMCUwAA3AwBB8NYGQoCAgICAgMCkwAA3AwBB+NYGQoCAgICA2J6YwQA3AwBBgNcGQoCAgICAgOKRwQA3AwBBiNcGQoCAgICA5eGUwQA3AwBBkNcGQoCAgICAgICSwAA3AwBBmNcGQoquj4XXx8KCwAA3AwBBoNcGQoquj4XXx8KCwAA3AwBBqNcGQoCAgICAgID4PzcDAEGw1wZC+6i4vZTcntI/NwMAQbjXBkKAgICAgICAisAANwMAQcDXBkKAgICAgICAgMAANwMAQcjXBkL6/anjy+6ktD83AwBB0NcGQvuouL2U3J7CPzcDAEHY1wZC+6i4vZTcnso/NwMAQeDXBkKAgICAgICAjMAANwMAQejYBkK56KK25/en1T83AwBB4NgGQufgypan24y6PzcDAEHY2AZCu76/6vjSm7k/NwMAQdDYBkKlqaPswLqMwD83AwBByNgGQqm4vZTcnorWPzcDAEHA2AZCw+uj4fXR8No/NwMAQbjYBkL7qLi9lNye2j83AwBBsNgGQoquj4XXx8LbPzcDAEGA2AZCiq6PhdfHwtM/NwMAQfjXBkLk1ZG7pcuR2z83AwBB8NcGQomDgauO2sjdPzcDAEGo2AZCu76/6vjSm7k/NwMAQaDYBkK6k7GQsOWhyz83AwBBmNgGQtijrbznxqbNPzcDAEGQ2AZCtp/k29z649g/NwMAQYjYBkK4vZTcnoqu1z83AwBB8NgGQoCAgICAgICMwAA3AwBB+NgGQpqz5syZs+bkPzcDAEGA2QZCgICAgICAgIzAADcDAEGw2QZCgICAgICAgPg/NwMAQajZBkKAgICAgICA+D83AwBBoNkGQoCAgICAgID4PzcDAEGY2QZCgICAgICAgPg/NwMAQZDZBkIANwMAQcjZBkIANwMAQcDZBkKAgICAgICA+D83AwBB0NkGQgA3AwBB2NkGQgA3AwBB4NkGQgA3AwBB6NkGQrW86c3EwcDtv383AwBB8NkGQs2Zs+bMmfOJwAA3AwBB+NkGQrSR2/P704aCwAA3AwBBgNoGQt70puKg4KqIwAA3AwBBiNoGQr2U3J6Kro+JQDcDAEGQ2gZCwZWHreT2/IHAADcDAEGY2gZCwOCc+vj7tvM/NwMAQaDaBkL+leTcstDa5L9/NwMAQajaBkKAgICAgICwtsAANwMAQbDaBkKAgICA0Kzz3sEANwMAQbjaBkKAgICAgIDArMAANwMAQcDaBkKAgICAgICAjMAANwMAQdDaBkKAgICAgICAosAANwMAQcjaBkKAgICAgIDApMAANwMAQZjbBkL7qLi9lNye2j83AwBBkNsGQvuouL2U3J7iPzcDAEGI2wZCuL2U3J6Kruc/NwMAQYDbBkLS8PqouL2U5D83AwBBoNsGQoCAgOSJ3Lq5wgA3AwBBqNsGQoCAgICAgICnwAA3AwBB6NsGQpTcnoquj4XnPzcDAEHg2wZCiYOBq47ayOU/NwMAQdjbBkKljISsueii7j83AwBB0NsGQvT708aX3cnYPzcDAEGw2wZC+6i4vZTcntI/NwMAQfDbBkL7qLi9lNye0j83AwBBsNwGQpqz5syZs+b4PzcDAEHI3AZCgICAgICAgITAADcDAEHA3AZCs+bMmbPmzPk/NwMAQdjcBkKs57HA7Ov79D83AwBB0NwGQtfHwuuj4fX1PzcDAEHo3AZCuL2U3J6Krtc/NwMAQeDcBkK4vZTcnoquzz83AwBB8NwGQs2Zs+bMmbP2PzcDAEH43AZCr7qTsZCw5ek/NwMAQYDdBkKSufmfpL/77T83AwBBiN0GQpqz5syZs+b0PzcDAEGQ3QZC+6i4vZTcnvY/NwMAQZjdBkLIwuuj4fXR8D83AwBBoN0GQrPmzJmz5szxPzcDAEGo3QZCgICAgICAgPg/NwMAQbDdBkLujO6An7/IhMAANwMAQcDdBkKas+bMmbPm1D83AwBBuN0GQoCAgICAgMCswAA3AwBB2N0GQuH9gZ6wgKL1PzcDAEHQ3QZC77f82ues8vQ/NwMAQejdBkLh/YGesICi9T83AwBB4N0GQu+3/NrnrPL0PzcDAEHw3QZCgICAjPv6yrDCADcDAEH43QZCgICAgI3xsIDCADcDAEGA3gZCmrPmzJmz5vQ/NwMAQYjeBkL7qLi9lNye9j83AwBBkN4GQsjC66Ph9dHwPzcDAEGY3gZCs+bMmbPmzPE/NwMAQaDeBkKAgICAgICA+D83AwBBqN4GQoCAgICAgID4PzcDAEGw3gZCs+bMmbPmzOk/NwMAQbjeBkKAgICAgICAgMAANwMAQcDeBkIANwMAQcjeBkIANwMAQdDeBkKAgICAgICAjsAANwMAQdjeBkKAgICAgIenvsEANwMAQeDeBkKAgICAgICA/D83AwBB6N4GQoCAgICAgID4PzcDAEHw3gZCgICAgICAgInAADcDAEH43gZCgICAgICAgITAADcDAEGA3wZCgICAgICAgITAADcDAEGI3wZCirC7sMT9hOA/NwMAQZDfBkLsrK629Jy/5T83AwBBmN8GQoCAgICAgIDwPzcDAEGg3wZCgICAgICAgJLAADcDAEGo3wZCs+bMmbPmzOk/NwMAQbjfBkKAgICAgIDApMAANwMAQbDfBkKAgICAgICAksAANwMAQcDfBkKAgICAgIDApMAANwMAQcjfBkKAgICAgIDApMAANwMAQdDfBkKAgICAgIDkz8AANwMAQdjfBkKAgICAgIDkz8AANwMAQeDfBkKAgICAgIDkz8AANwMAQejfBkKAgICAgIDkz8AANwMAQfDfBkKAgICAgIDkz8AANwMAQfjfBkKAgICAgIDkz8AANwMAQYDgBkKAgICAgIDkz8AANwMAQYjgBkKAgICAgIDkz8AANwMAQdjiBkL7qLi9lNye4j83AwBB0OIGQvuouL2U3J7iPzcDAEHI4gZC+6i4vZTcnuI/NwMAQcDiBkL7qLi9lNye4j83AwBBuOIGQvuouL2U3J7iPzcDAEGw4gZC+6i4vZTcnuI/NwMAQajiBkL7qLi9lNye4j83AwBBoOIGQvuouL2U3J7iPzcDAEGY4gZCxq2I5MGSzOM/NwMAQZDiBkLGrYjkwZLM4z83AwBBiOIGQsatiOTBkszjPzcDAEGA4gZCxq2I5MGSzOM/NwMAQfjhBkLGrYjkwZLM4z83AwBB8OEGQs6I/bXrz/7hPzcDAEHo4QZCzoj9tevP/uE/NwMAQeDhBkLOiP2168/+4T83AwBB2OEGQs6I/bXrz/7hPzcDAEHQ4QZCzoj9tevP/uE/NwMAQbjhBkKKro+F18fC4z83AwBBsOEGQtLw+qi4vZTkPzcDAEGo4QZC0vD6qLi9lOQ/NwMAQaDhBkLS8PqouL2U5D83AwBBmOEGQtLw+qi4vZTkPzcDAEGQ4QZC0vD6qLi9lOQ/NwMAQYjhBkLS8PqouL2U5D83AwBBgOEGQtLw+qi4vZTkPzcDAEH44AZC0vD6qLi9lOQ/NwMAQfDgBkLh9dHw+qi45T83AwBB6OAGQuH10fD6qLjlPzcDAEHg4AZC4fXR8PqouOU/NwMAQdjgBkLh9dHw+qi45T83AwBB0OAGQuH10fD6qLjlPzcDAEHI4AZC9tHw+qi4veQ/NwMAQcDgBkL20fD6qLi95D83AwBBuOAGQvbR8PqouL3kPzcDAEGw4AZC9tHw+qi4veQ/NwMAQajgBkL20fD6qLi95D83AwBByOEGQoquj4XXx8LjPzcDAEHA4QZCiq6PhdfHwuM/NwMAQaDgBkLnjdOn2MSH5D83AwBBmOAGQueN06fYxIfkPzcDAEGQ4AZC543Tp9jEh+Q/NwMAQeDiBkKAgICAgIDgqMAANwMAQejiBkKAgICAgIDgqMAANwMAQfDiBkLmzJmz5szZkcAANwMAQfjiBkKAgICQytLGrsIANwMAQYDjBkKAgICAoJPpwMEANwMAQYjjBkKAgICAgICA+D83AwBBmOMGQoCAgICAgICQwAA3AwBBkOMGQoCAgICAgICFwAA3AwBBoOMGQoCAgICAgICMwAA3AwBBqOMGQoCAgICAh6e+wQA3AwBBsOMGQoCAgICAgICSwAA3AwBBuOMGQrPmzJmz5vfMwAA3AwBBwOMGQvbR8PqouL3wPzcDAEHI4wZCgICAgICAgJrAADcDAEHw5AZC2/P708aX3dk/NwMAQcjkBkKq48vupIyE1D83AwBBoOQGQqrjy+6kjITUPzcDAEH44wZC+6i4vZTcntI/NwMAQfDjBkLY8tDF7M7vzz83AwBB6OMGQri9lNyeiq7XPzcDAEHg4wZCquPL7qSMhNQ/NwMAQdjjBkK6k7GQsOWhwz83AwBB0OMGQunNxMHAlYfVPzcDAEH45AZC2/P708aX3dE/NwMAQejkBkKTsZCw5aGL2T83AwBB4OQGQqrjy+6kjITUPzcDAEHY5AZC+v2p48vupMQ/NwMAQdDkBkLayO35/anjyz83AwBBwOQGQpOxkLDloYvZPzcDAEG45AZCquPL7qSMhNQ/NwMAQbDkBkL6/anjy+6kxD83AwBBqOQGQtrI7fn9qePLPzcDAEGY5AZCuL2U3J6Krs8/NwMAQZDkBkLso+H10fD62D83AwBBiOQGQpqz5syZs+bUPzcDAEGA5AZC+6i4vZTcnsI/NwMAQejlBkKL2Z3fn7W82T83AwBBwOUGQuyj4fXR8PrgPzcDAEGY5QZCy8OWsru+v9I/NwMAQZDmBkKAgICAgIDQ18AANwMAQYjmBkLb8/vTxpfdyT83AwBBgOYGQtvz+9PGl93JPzcDAEH45QZC2sjt+f2p49M/NwMAQfDlBkKb3vSm4qDg0j83AwBB4OUGQoquj4XXx8LbPzcDAEHY5QZCuL2U3J6Krtc/NwMAQdDlBkKKro+F18fC2z83AwBByOUGQuyj4fXR8PrYPzcDAEG45QZCj4XXx8Lro+E/NwMAQbDlBkKb3vSm4qDgyj83AwBBqOUGQsvDlrK7vr/SPzcDAEGg5QZCueiituf3p9U/NwMAQZDlBkLb8/vTxpfdyT83AwBBiOUGQtvz+9PGl93JPzcDAEGA5QZC+v2p48vupNQ/NwMAQZjmBkKAgICAgIDW1cAANwMAQaDmBkKAgICAgIDW3cAANwMAQajmBkKAgICAgIDl4MAANwMAQbDmBkKAgICAgIDQ58AANwMAQbjmBkKAgICAgMCm6MAANwMAQcDmBkKAgICAgIDT/sAANwMAQcjmBkKz5syZs+bM6T83AwBB6OYGQq+6k7GQsOXhPzcDAEHg5gZCr7qTsZCw5eE/NwMAQdjmBkL7qLi9lNye4j83AwBB0OYGQt+ftbzpzcThPzcDAEGI5wZC1MaX3cmYiOA/NwMAQYDnBkLXx8Lro+H16T83AwBB+OYGQvr9qePL7qToPzcDAEHw5gZC2PLQxezO798/NwMAQZDnBkKAgNCx0v6ahsMANwMAQZjnBkKAgICAgICA+D83AwBBoOcGQoCAgICAgID4PzcDAEGo5wZCgICAgICA8KrAADcDAEGw5wZCgICAgICAkKrAADcDAEG45wZCgICAgICAgITAADcDAEH45wZCi9md35+1vNk/NwMAQfDnBkLso+H10fD64D83AwBB6OcGQsvDlrK7vr/SPzcDAEHg5wZC2/P708aX3dk/NwMAQdjnBkKq48vupIyE1D83AwBB0OcGQqrjy+6kjITUPzcDAEHI5wZC+6i4vZTcntI/NwMAQcDnBkLpzcTBwJWH1T83AwBBgOgGQuyj4fXR8PrQPzcDAEHI6AZCj4XXx8Lrg5HAADcDAEHA6AZCw+uj4fXRkJfAADcDAEG46AZCw+uj4fXR8IfAADcDAEGw6AZCro+F18fC6/c/NwMAQajoBkKas+bMmbPm9D83AwBBoOgGQq6PhdfHwuuMwAA3AwBBmOgGQs2Zs+bMmbPyPzcDAEGQ6AZC+6i4vZTcnvo/NwMAQeDoBkLHtITswZTT2D83AwBB2OgGQquci5v3w/LWPzcDAEHQ6AZCso+Q9cCHwsk/NwMAQYjpBkKk4fXR8Pqo6D83AwBBgOkGQvPe9r7YucTaPzcDAEH46AZCqd+s2tPmpe8/NwMAQfDoBkL1xbXu9oyBzD83AwBB6OgGQtf/06yooZrEPzcDAEGY6QZC7KPh9dHw+qbAADcDAEGQ6QZCzZmz5syZq6bAADcDAEHw6wZCxczK2fex+tE/NwMAQcjqBkLy+fSSiL/Z0j83AwBB+OsGQrP15/aHnc7UPzcDAEHo6wZCtduXjqaPg9g/NwMAQeDrBkK125eOpo+D2D83AwBB2OsGQrXbl46mj4PYPzcDAEHQ6wZCtduXjqaPg9g/NwMAQcjrBkK125eOpo+D2D83AwBBwOsGQrXbl46mj4PYPzcDAEG46wZCtduXjqaPg9g/NwMAQbDrBkK125eOpo+D2D83AwBBqOsGQrXbl46mj4PYPzcDAEGg6wZCtduXjqaPg9g/NwMAQZjrBkK125eOpo+D2D83AwBBkOsGQvS64Y+cn/XYPzcDAEGI6wZC9Lrhj5yf9dg/NwMAQYDrBkL0uuGPnJ/12D83AwBB+OoGQvS64Y+cn/XYPzcDAEHw6gZC9Lrhj5yf9dg/NwMAQejqBkKzmquRkq/n2T83AwBB4OoGQpKKpMfhiIzZPzcDAEHY6gZCuZzcoJHMx9g/NwMAQdDqBkL4upG7ytjG1T83AwBBmO0GQrLhmeiz1PG7PzcDAEHo7QZC9Lrhj5yf9cA/NwMAQeDtBkK/5uqWq4b0wT83AwBB2O0GQr/m6parhvTBPzcDAEHQ7QZCv+bqlquG9ME/NwMAQcjtBkK/5uqWq4b0wT83AwBBwO0GQr/m6parhvTBPzcDAEG47QZCipL0nbrt8sI/NwMAQbDtBkK1ooblx7SNwj83AwBBqO0GQtXus/rxqcHBPzcDAEGg7QZCw+eJ0tK3h78/NwMAQZDtBkK8n7Pa2Mr31j83AwBBiO0GQryfs9rYyvfWPzcDAEGA7QZCvJ+z2tjK99Y/NwMAQfjsBkK8n7Pa2Mr31j83AwBB8OwGQryfs9rYyvfWPzcDAEHo7AZCvJ+z2tjK99Y/NwMAQeDsBkK8n7Pa2Mr31j83AwBB2OwGQryfs9rYyvfWPzcDAEHQ7AZCvJ+z2tjK99Y/NwMAQcjsBkK8n7Pa2Mr31j83AwBBwOwGQryfs9rYyvfWPzcDAEG47AZCq/mpkfD+pdg/NwMAQbDsBkKr+amR8P6l2D83AwBBqOwGQqv5qZHw/qXYPzcDAEGg7AZCq/mpkfD+pdg/NwMAQZjsBkKr+amR8P6l2D83AwBBkOwGQviiuvWzmJDZPzcDAEGI7AZC3fiS7s+du9g/NwMAQYDsBkKP9a+v4YL31z83AwBB6O8GQtmvsuOD29joPzcDAEGA8QZC85eD44iJhe0/NwMAQfjwBkLzl4PjiImF7T83AwBB8PAGQvOXg+OIiYXtPzcDAEHo8AZC85eD44iJhe0/NwMAQeDwBkLzl4PjiImF7T83AwBB2PAGQvOXg+OIiYXtPzcDAEHQ8AZC85eD44iJhe0/NwMAQcjwBkLzl4PjiImF7T83AwBBwPAGQvOXg+OIiYXtPzcDAEG48AZC85eD44iJhe0/NwMAQbDwBkLdr87Z3cK+7j83AwBBqPAGQt2vztndwr7uPzcDAEGg8AZC3a/O2d3Cvu4/NwMAQZjwBkLdr87Z3cK+7j83AwBBkPAGQt2vztndwr7uPzcDAEGI8AZC9ZeR3vX89+8/NwMAQYDwBkKc8au7lM7j7j83AwBB+O8GQt6sk5bwq/TtPzcDAEHw7wZC3KyFm4O4ges/NwMAQbjuBkL0uuGPnJ/1wD83AwBBsO4GQvS64Y+cn/XAPzcDAEGo7gZC9Lrhj5yf9cA/NwMAQaDuBkL0uuGPnJ/1wD83AwBBmO4GQvS64Y+cn/XAPzcDAEGQ7gZC9Lrhj5yf9cA/NwMAQYjuBkL0uuGPnJ/1wD83AwBBgO4GQvS64Y+cn/XAPzcDAEH47QZC9Lrhj5yf9cA/NwMAQfDtBkL0uuGPnJ/1wD83AwBBuPIGQvWUj92RrNThPzcDAEHY8wZC3a/O2d3CvuY/NwMAQdDzBkLdr87Z3cK+5j83AwBByPMGQt2vztndwr7mPzcDAEHA8wZC3a/O2d3CvuY/NwMAQbjzBkLdr87Z3cK+5j83AwBBsPMGQt2vztndwr7mPzcDAEGo8wZC3a/O2d3CvuY/NwMAQaDzBkLdr87Z3cK+5j83AwBBmPMGQt2vztndwr7mPzcDAEGQ8wZC3a/O2d3CvuY/NwMAQYjzBkLdr87Z3cK+5j83AwBBgPMGQuShxJunpYboPzcDAEH48gZC5KHEm6elhug/NwMAQfDyBkLkocSbp6WG6D83AwBB6PIGQuShxJunpYboPzcDAEHg8gZC5KHEm6elhug/NwMAQdjyBkKt26m83Kjt6D83AwBB0PIGQov9w+a88proPzcDAEHI8gZC+ZSr0+uTuuc/NwMAQcDyBkL9jaa0kIWe5D83AwBBiPEGQvOXg+OIiYXtPzcDAEHY6QZCmMG/icygsss/NwMAQdDpBkKYwb+JzKCyyz83AwBByOkGQpjBv4nMoLLLPzcDAEHA6QZCzcXhsPaKxMw/NwMAQbjpBkK/8NfHrrbPyz83AwBBsOkGQqn98+zd9vfKPzcDAEGo6QZC7sGizvSi1Mg/NwMAQaDpBkKkr574yfPVxT83AwBBwO4GQqbwivXd0/HDPzcDAEHA6gZCk4qQko23oMo/NwMAQbjqBkKTipCSjbegyj83AwBBsOoGQpOKkJKNt6DKPzcDAEGo6gZCk4qQko23oMo/NwMAQaDqBkKTipCSjbegyj83AwBBmOoGQpOKkJKNt6DKPzcDAEGQ6gZCk4qQko23oMo/NwMAQYjqBkKTipCSjbegyj83AwBBgOoGQpOKkJKNt6DKPzcDAEH46QZCk4qQko23oMo/NwMAQfDpBkKTipCSjbegyj83AwBB6OkGQpjBv4nMoLLLPzcDAEHg6QZCmMG/icygsss/NwMAQcDvBkL0uuGPnJ/1yD83AwBBuO8GQvS64Y+cn/XIPzcDAEGw7wZC9Lrhj5yf9cg/NwMAQajvBkL0uuGPnJ/1yD83AwBBoO8GQvS64Y+cn/XIPzcDAEGY7wZC9Lrhj5yf9cg/NwMAQZDvBkL0uuGPnJ/1yD83AwBBiO8GQr/m6parhvTJPzcDAEGA7wZCv+bqlquG9Mk/NwMAQfjuBkK/5uqWq4b0yT83AwBB8O4GQr/m6parhvTJPzcDAEHo7gZCv+bqlquG9Mk/NwMAQeDuBkKKkvSduu3yyj83AwBB2O4GQtj+6aHdtI3KPzcDAEHQ7gZCjrbsgMepwck/NwMAQcjuBkLP2JjFqLiHxz83AwBBkPEGQv6WhM2T1PHTPzcDAEGw8gZC9Lrhj5yf9dg/NwMAQajyBkL0uuGPnJ/12D83AwBBoPIGQvS64Y+cn/XYPzcDAEGY8gZC9Lrhj5yf9dg/NwMAQZDyBkL0uuGPnJ/12D83AwBBiPIGQvS64Y+cn/XYPzcDAEGA8gZC9Lrhj5yf9dg/NwMAQfjxBkL0uuGPnJ/12D83AwBB8PEGQvS64Y+cn/XYPzcDAEHo8QZC9Lrhj5yf9dg/NwMAQeDxBkL0uuGPnJ/12D83AwBB2PEGQr/m6parhvTZPzcDAEHQ8QZCv+bqlquG9Nk/NwMAQcjxBkK/5uqWq4b02T83AwBBwPEGQr/m6parhvTZPzcDAEG48QZCv+bqlquG9Nk/NwMAQbDxBkLfvvexn+3y2j83AwBBqPEGQqyr7bXCtI3aPzcDAEGg8QZC5tzl2Pypwdk/NwMAQZjxBkKgi6aVvbeH1z83AwBB4O8GQvS64Y+cn/XIPzcDAEHY7wZC9Lrhj5yf9cg/NwMAQdDvBkL0uuGPnJ/1yD83AwBByO8GQvS64Y+cn/XIPzcDAEGo9QZC8LiIlvTevdw/NwMAQaD1BkLS6cXervWm3D83AwBBmPUGQvj7paKH3LnZPzcDAEGQ9QZC7febmeD+odY/NwMAQYj1BkLkm/nb6Mml0z83AwBBsPYGQtywgv+SmMHSPzcDAEGY9wZC+KK69bOYkNk/NwMAQZD3BkLFzMrZ97H62T83AwBBiPcGQsXMytn3sfrZPzcDAEGA9wZCxczK2fex+tk/NwMAQfj2BkLFzMrZ97H62T83AwBB8PYGQuei3tGgy+TaPzcDAEHo9gZC56Le0aDL5No/NwMAQeD2BkLnot7RoMvk2j83AwBB2PYGQuei3tGgy+TaPzcDAEHQ9gZCtMzuteTkzts/NwMAQcj2BkKCzYXZhMa52z83AwBBwPYGQpWk6Lv02uXYPzcDAEG49gZCosySktGXo9U/NwMAQaj2BkKzmquRkq/n2T83AwBBoPYGQrOaq5GSr+fZPzcDAEGY9gZCs5qrkZKv59k/NwMAQZD2BkKzmquRkq/n2T83AwBBiPYGQrOaq5GSr+fZPzcDAEGA9gZCs5qrkZKv59k/NwMAQfj1BkKzmquRkq/n2T83AwBB8PUGQrOaq5GSr+fZPzcDAEHo9QZC8vn0koi/2do/NwMAQeD1BkLy+fSSiL/Z2j83AwBB2PUGQvL59JKIv9naPzcDAEHQ9QZC8vn0koi/2do/NwMAQcj1BkKx2b6U/s7L2z83AwBBwPUGQrHZvpT+zsvbPzcDAEG49QZCsdm+lP7Oy9s/NwMAQbD1BkKx2b6U/s7L2z83AwBBqPoGQtSymO6NxJbpPzcDAEHY9wZCopaI74SZxrw/NwMAQbD6BkLbr8De8M7L6z83AwBB+PgGQoqS9J267fLCPzcDAEHw+AZCipL0nbrt8sI/NwMAQej4BkKKkvSduu3ywj83AwBB4PgGQoqS9J267fLCPzcDAEHY+AZCipL0nbrt8sI/NwMAQdD4BkKKkvSduu3ywj83AwBByPgGQoqS9J267fLCPzcDAEHA+AZCipL0nbrt8sI/NwMAQbj4BkKm8Ir13dPxwz83AwBBsPgGQqbwivXd0/HDPzcDAEGo+AZCpvCK9d3T8cM/NwMAQaD4BkKm8Ir13dPxwz83AwBBmPgGQqHphqzYu/DEPzcDAEGQ+AZCoemGrNi78MQ/NwMAQYj4BkKh6Yas2LvwxD83AwBBgPgGQqHphqzYu/DEPzcDAEH49wZCvMedg/yh78U/NwMAQfD3BkKkr574yfPVxT83AwBB6PcGQtrh9YfWkMDCPzcDAEHg9wZCmdf3isXw7L8/NwMAQdD3BkL4orr1s5iQ2T83AwBByPcGQviiuvWzmJDZPzcDAEHA9wZC+KK69bOYkNk/NwMAQbj3BkL4orr1s5iQ2T83AwBBsPcGQviiuvWzmJDZPzcDAEGo9wZC+KK69bOYkNk/NwMAQaD3BkL4orr1s5iQ2T83AwBB+PwGQuL7nLC5hJniPzcDAEHI/QZCouWG69Ss1Ok/NwMAQcD9BkKi5Ybr1KzU6T83AwBBuP0GQuue7IuKsLvqPzcDAEGw/QZC657si4qwu+o/NwMAQaj9BkLrnuyLirC76j83AwBBoP0GQuue7IuKsLvqPzcDAEGY/QZC4ajJuoK0ous/NwMAQZD9BkKN/dHhqeaN6z83AwBBiP0GQrLUspjujcToPzcDAEGA/QZC8ZuU/Oy68OQ/NwMAQcj7BkL1l5He9fz37z83AwBBwPsGQvWXkd71/PfvPzcDAEG4+wZC9ZeR3vX89+8/NwMAQbD7BkL1l5He9fz37z83AwBBqPsGQvWXkd71/PfvPzcDAEGg+wZC9ZeR3vX89+8/NwMAQZj7BkL1l5He9fz37z83AwBBkPsGQvWXkd71/PfvPzcDAEGI+wZC8JeuqqXb2PA/NwMAQYD7BkLwl66qpdvY8D83AwBB+PoGQvCXrqql29jwPzcDAEHw+gZC8JeuqqXb2PA/NwMAQej6BkLl49Plj7i18T83AwBB4PoGQuXj0+WPuLXxPzcDAEHY+gZC5ePT5Y+4tfE/NwMAQdD6BkLl49Plj7i18T83AwBByPoGQvGX9eeblZLyPzcDAEHA+gZCkbeGt8DP//E/NwMAQbj6BkLJxN6MxeWt7z83AwBB+PQGQs3F4bD2isTMPzcDAEHw9AZCzcXhsPaKxMw/NwMAQej0BkLNxeGw9orEzD83AwBB4PQGQs3F4bD2isTMPzcDAEHY9AZCzcXhsPaKxMw/NwMAQdD0BkLNxeGw9orEzD83AwBByPQGQs3F4bD2isTMPzcDAEHA9AZC0/yQqLX01c0/NwMAQbj0BkLT/JCotfTVzT83AwBBsPQGQtP8kKi19NXNPzcDAEGo9AZC0/yQqLX01c0/NwMAQaD0BkLZs8Cf9N3nzj83AwBBmPQGQtmzwJ/03efOPzcDAEGQ9AZC2bPAn/Td584/NwMAQYj0BkLZs8Cf9N3nzj83AwBBgPQGQt/q75azx/nPPzcDAEH48wZC54jKiLyy3M8/NwMAQfDzBkKvtKPknOCJzD83AwBB6PMGQo3T4JrOzY7JPzcDAEHg8wZC/dPox56Pt8Y/NwMAQZj+BkKt26m83Kjt6D83AwBBkP4GQq3bqbzcqO3oPzcDAEGI/gZCrdupvNyo7eg/NwMAQYD+BkKt26m83Kjt6D83AwBB+P0GQq3bqbzcqO3oPzcDAEHw/QZCrdupvNyo7eg/NwMAQej9BkKt26m83Kjt6D83AwBB4P0GQq3bqbzcqO3oPzcDAEHY/QZCouWG69Ss1Ok/NwMAQdD9BkKi5Ybr1KzU6T83AwBB0PsGQqKWiO+EmcbUPzcDAEGA+QZCopaI74SZxsQ/NwMAQYD1BkLNxeGw9orEzD83AwBBiPwGQvGblPzsuvDcPzcDAEGA/AZC8ZuU/Oy68Nw/NwMAQfj7BkLxm5T87Lrw3D83AwBB8PsGQuyUkLPnou/dPzcDAEHo+wZC0/yQqLX01d0/NwMAQeD7BkKFtfLz8JDA2j83AwBB2PsGQqrFqenP8OzXPzcDAEGg+gZCipL0nbrt8so/NwMAQZj6BkKKkvSduu3yyj83AwBBkPoGQoqS9J267fLKPzcDAEGI+gZCipL0nbrt8so/NwMAQYD6BkKKkvSduu3yyj83AwBB+PkGQoqS9J267fLKPzcDAEHw+QZCipL0nbrt8so/NwMAQej5BkKKkvSduu3yyj83AwBB4PkGQtW9/aTJ1PHLPzcDAEHY+QZC1b39pMnU8cs/NwMAQdD5BkLVvf2kydTxyz83AwBByPkGQtW9/aTJ1PHLPzcDAEHA+QZCoemGrNi78Mw/NwMAQbj5BkKh6Yas2LvwzD83AwBBsPkGQqHphqzYu/DMPzcDAEGo+QZCoemGrNi78Mw/NwMAQaD5BkLslJCz56LvzT83AwBBmPkGQtP8kKi19NXNPzcDAEGQ+QZC2uH1h9aQwMo/NwMAQYj5BkLTnrCRmvDsxz83AwBBoP4GQpGO68Xb0YHkPzcDAEGo/gZC7KPh9dHw+tg/NwMAQbD+BkKAgICAwPD1y8EANwMAQbj+BkKAgICAkJqdwsEANwMAQcj+BkLmzJmz5syZ9z83AwBBwP4GQoCAgICAgID4PzcDAEHw/AZC3773sZ/t8to/NwMAQej8BkLfvvexn+3y2j83AwBB4PwGQt++97Gf7fLaPzcDAEHY/AZC3773sZ/t8to/NwMAQdD8BkLfvvexn+3y2j83AwBByPwGQt++97Gf7fLaPzcDAEHA/AZC3773sZ/t8to/NwMAQbj8BkLfvvexn+3y2j83AwBBsPwGQqrqgLmu1PHbPzcDAEGo/AZCquqAua7U8ds/NwMAQaD8BkKq6oC5rtTx2z83AwBBmPwGQqrqgLmu1PHbPzcDAEGQ/AZC8ZuU/Oy68Nw/NwMAQYiAB0LNmbPmzJmz9j83AwBB4P4GQoCAgICAgID4PzcDAEGQgAdCs+bMmbPmzPU/NwMAQej+BkKz5syZs+bM9T83AwBBqIEHQpqz5syZs+bsPzcDAEGggQdC9tHw+qi4vew/NwMAQdiCB0EAQagBEBEaQZiEB0KXtc6XhN7r2D83AwBBkIQHQq7s2bLWlKnYPzcDAEGIhAdC7qbM5O3AltU/NwMAQYCEB0KlvK/a8rmz0j83AwBBqIUHQqbwivXd0/HDPzcDAEGIhgdC9Lrhj5yf9cg/NwMAQYCGB0L0uuGPnJ/1yD83AwBB+IUHQvS64Y+cn/XIPzcDAEHwhQdCv+bqlquG9Mk/NwMAQeiFB0K/5uqWq4b0yT83AwBB4IUHQr/m6parhvTJPzcDAEHYhQdCv+bqlquG9Mk/NwMAQdCFB0K/5uqWq4b0yT83AwBByIUHQoqS9J267fLKPzcDAEHAhQdC2P7pod20jco/NwMAQbiFB0KOtuyAx6nByT83AwBBsIUHQs/YmMWouIfHPzcDAEGghQdCjMfKm9GWzdc/NwMAQZiFB0KMx8qb0ZbN1z83AwBBkIUHQozHypvRls3XPzcDAEGIhQdCjMfKm9GWzdc/NwMAQYCFB0KMx8qb0ZbN1z83AwBB+IQHQozHypvRls3XPzcDAEHwhAdCjMfKm9GWzdc/NwMAQeiEB0KMx8qb0ZbN1z83AwBB4IQHQozHypvRls3XPzcDAEHYhAdCjMfKm9GWzdc/NwMAQdCEB0KMx8qb0ZbN1z83AwBByIQHQoKQ/624xdXYPzcDAEHAhAdCgpD/rbjF1dg/NwMAQbiEB0KCkP+tuMXV2D83AwBBsIQHQoKQ/624xdXYPzcDAEGohAdCgpD/rbjF1dg/NwMAQaCEB0K9/JiOyL/E2T83AwBByIoHQvWUj92RrNThPzcDAEH4hwdCouWG69Ss1Ok/NwMAQZiJB0Ldr87Z3cK+7j83AwBBkIkHQt2vztndwr7uPzcDAEGIiQdC3a/O2d3Cvu4/NwMAQYCJB0Ldr87Z3cK+7j83AwBB+IgHQt2vztndwr7uPzcDAEHwiAdC3a/O2d3Cvu4/NwMAQeiIB0Ldr87Z3cK+7j83AwBB4IgHQt2vztndwr7uPzcDAEHYiAdC3a/O2d3Cvu4/NwMAQdCIB0Ldr87Z3cK+7j83AwBByIgHQt2vztndwr7uPzcDAEHAiAdCzrnI1IWlhvA/NwMAQbiIB0LOucjUhaWG8D83AwBBsIgHQs65yNSFpYbwPzcDAEGoiAdCzrnI1IWlhvA/NwMAQaCIB0LOucjUhaWG8D83AwBBmIgHQq3bqbzcqO3wPzcDAEGQiAdCoeW/rd7ymvA/NwMAQYiIB0L5lKvT65O67z83AwBBgIgHQv2NprSQhZ7sPzcDAEHIhgdC9Lrhj5yf9cg/NwMAQcCGB0L0uuGPnJ/1yD83AwBBuIYHQvS64Y+cn/XIPzcDAEGwhgdC9Lrhj5yf9cg/NwMAQaiGB0L0uuGPnJ/1yD83AwBBoIYHQvS64Y+cn/XIPzcDAEGYhgdC9Lrhj5yf9cg/NwMAQZCGB0L0uuGPnJ/1yD83AwBB6IsHQt2vztndwr7mPzcDAEHgiwdC3a/O2d3CvuY/NwMAQdiLB0Ldr87Z3cK+5j83AwBB0IsHQt2vztndwr7mPzcDAEHIiwdC3a/O2d3CvuY/NwMAQcCLB0Ldr87Z3cK+5j83AwBBuIsHQt2vztndwr7mPzcDAEGwiwdC3a/O2d3CvuY/NwMAQaiLB0Ldr87Z3cK+5j83AwBBoIsHQt2vztndwr7mPzcDAEGYiwdC3a/O2d3CvuY/NwMAQZCLB0LkocSbp6WG6D83AwBBiIsHQuShxJunpYboPzcDAEGAiwdC5KHEm6elhug/NwMAQfiKB0LkocSbp6WG6D83AwBB8IoHQuShxJunpYboPzcDAEHoigdCrdupvNyo7eg/NwMAQeCKB0KL/cPmvPKa6D83AwBB2IoHQvmUq9Prk7rnPzcDAEHQigdC/Y2mtJCFnuQ/NwMAQbCBB0EAQagBEBEiAELakKbT49K00T83A+AFIABC2pCm0+PStNE/NwPYBSAAQtqQptPj0rTRPzcD0AUgAELakKbT49K00T83A8gFIABCn9bPl6aOrdI/NwPABSAAQouuxers3szRPzcDuAUgAELQ/OD8hruE0T83A7AFIABCjOOb6IOIp84/NwOoBSAAQoz1/4OzyaXLPzcDoAVBoIkHQvzVl9D/89XVPzcDAEGoigdCk4qQko23oNo/NwMAQaCKB0KTipCSjbeg2j83AwBBmIoHQpOKkJKNt6DaPzcDAEGQigdCk4qQko23oNo/NwMAQYiKB0KTipCSjbeg2j83AwBBgIoHQpOKkJKNt6DaPzcDAEH4iQdCk4qQko23oNo/NwMAQfCJB0KTipCSjbeg2j83AwBB6IkHQsSUvPXmoLLbPzcDAEHgiQdCxJS89eagsts/NwMAQdiJB0LElLz15qCy2z83AwBB0IkHQsSUvPXmoLLbPzcDAEHIiQdCxJS89eagsts/NwMAQcCJB0L2nujYwIrE3D83AwBBuIkHQujJ3u/4tc/bPzcDAEGwiQdC/an3gMP299o/NwMAQaiJB0KalZ+6j6PU2D83AwBB8IcHQpXL/I6hl7zQPzcDAEHohwdClcv8jqGXvNA/NwMAQeCHB0KVy/yOoZe80D83AwBB2IcHQpXL/I6hl7zQPzcDAEHQhwdClcv8jqGXvNA/NwMAQciHB0KVy/yOoZe80D83AwBBwIcHQpXL/I6hl7zQPzcDAEG4hwdClcv8jqGXvNA/NwMAQbCHB0KVy/yOoZe80D83AwBBqIcHQpXL/I6hl7zQPzcDAEGghwdClcv8jqGXvNA/NwMAQZiHB0LakKbT49K00T83AwBBwIoHQpOKkJKNt6DaPzcDAEG4igdCk4qQko23oNo/NwMAQbCKB0KTipCSjbeg2j83AwBBmI0HQQBBqAEQERpBiJAHQuyUkLPnou/NPzcDAEGAkAdC0/yQqLX01c0/NwMAQfiPB0La4fWH1pDAyj83AwBB8I8HQtOesJGa8OzHPzcDAEHojwdCopaI74SZxsQ/NwMAQeCPB0K9/JiOyL/E2T83AwBB2I8HQr38mI7Iv8TZPzcDAEHQjwdCvfyYjsi/xNk/NwMAQciPB0K9/JiOyL/E2T83AwBBwI8HQr38mI7Iv8TZPzcDAEG4jwdCvfyYjsi/xNk/NwMAQbCPB0K9/JiOyL/E2T83AwBBqI8HQr38mI7Iv8TZPzcDAEGgjwdCpbyv2vK5s9o/NwMAQZiPB0KlvK/a8rmz2j83AwBBkI8HQqW8r9ryubPaPzcDAEGIjwdCpbyv2vK5s9o/NwMAQYCPB0LhqMm6grSi2z83AwBB+I4HQuGoybqCtKLbPzcDAEHwjgdC4ajJuoK0ots/NwMAQeiOB0LhqMm6grSi2z83AwBB4I4HQpyV45qSrpHcPzcDAEHYjgdCs8OQneGV+9s/NwMAQdCOB0Lq2POS5o6Y2T83AwBByI4HQpTultuxou/VPzcDAEHAjgdCksCatdm1/dI/NwMAQbiSB0Li+5ywuYSZ6j83AwBBoJMHQq3bqbzcqO3wPzcDAEGYkwdCjP2KpLOs1PE/NwMAQZCTB0KM/Yqks6zU8T83AwBBiJMHQoz9iqSzrNTxPzcDAEGAkwdCjP2KpLOs1PE/NwMAQfiSB0KCh+jSq7C78j83AwBB8JIHQoKH6NKrsLvyPzcDAEHokgdCgofo0quwu/I/NwMAQeCSB0KCh+jSq7C78j83AwBB2JIHQuGoybqCtKLzPzcDAEHQkgdCjf3R4anmjfM/NwMAQciSB0Ky1LKY7o3E8D83AwBBwJIHQp/si4qwu/DsPzcDAEGIkQdCipL0nbrt8so/NwMAQYCRB0KKkvSduu3yyj83AwBB+JAHQoqS9J267fLKPzcDAEHwkAdCipL0nbrt8so/NwMAQeiQB0KKkvSduu3yyj83AwBB4JAHQoqS9J267fLKPzcDAEHYkAdCipL0nbrt8so/NwMAQdCQB0KKkvSduu3yyj83AwBByJAHQtW9/aTJ1PHLPzcDAEHAkAdC1b39pMnU8cs/NwMAQbiQB0LVvf2kydTxyz83AwBBsJAHQtW9/aTJ1PHLPzcDAEGokAdCoemGrNi78Mw/NwMAQaCQB0Kh6Yas2LvwzD83AwBBmJAHQqHphqzYu/DMPzcDAEGQkAdCoemGrNi78Mw/NwMAQYiVB0Li+5ywuYSZ4j83AwBBqJYHQq3bqbzcqO3oPzcDAEGglgdCrdupvNyo7eg/NwMAQZiWB0Kt26m83Kjt6D83AwBBkJYHQq3bqbzcqO3oPzcDAEGIlgdCrdupvNyo7eg/NwMAQYCWB0Kt26m83Kjt6D83AwBB+JUHQq3bqbzcqO3oPzcDAEHwlQdCrdupvNyo7eg/NwMAQeiVB0Ki5Ybr1KzU6T83AwBB4JUHQqLlhuvUrNTpPzcDAEHYlQdCouWG69Ss1Ok/NwMAQdCVB0Ki5Ybr1KzU6T83AwBByJUHQuue7IuKsLvqPzcDAEHAlQdC657si4qwu+o/NwMAQbiVB0LrnuyLirC76j83AwBBsJUHQuue7IuKsLvqPzcDAEGolQdC4ajJuoK0ous/NwMAQaCVB0KN/dHhqeaN6z83AwBBmJUHQrLUspjujcToPzcDAEGQlQdC8ZuU/Oy68OQ/NwMAQdiTB0Kt26m83Kjt8D83AwBB0JMHQq3bqbzcqO3wPzcDAEHIkwdCrdupvNyo7fA/NwMAQcCTB0Kt26m83Kjt8D83AwBBuJMHQq3bqbzcqO3wPzcDAEGwkwdCrdupvNyo7fA/NwMAQaiTB0Kt26m83Kjt8D83AwBB8IsHQQBBqAEQEUKvrL3R0fH1yz83A6AFQeCTB0Ksodv3iZC31j83AwBBqJQHQtP8kKi19NXdPzcDAEGglAdCqubN74jd594/NwMAQZiUB0Kq5s3viN3n3j83AwBBkJQHQqrmze+I3efePzcDAEGIlAdCqubN74jd594/NwMAQYCUB0K2kenu6Mf53z83AwBB+JMHQr+vw+DxstzfPzcDAEHwkwdCr7Sj5Jzgidw/NwMAQeiTB0Lh/+Ous82O2T83AwBBsJIHQp/Wz5emjq3SPzcDAEGokgdCn9bPl6aOrdI/NwMAQaCSB0Kf1s+Xpo6t0j83AwBBmJIHQp/Wz5emjq3SPzcDAEGQkgdCn9bPl6aOrdI/NwMAQYiSB0Kf1s+Xpo6t0j83AwBBgJIHQp/Wz5emjq3SPzcDAEH4kQdCn9bPl6aOrdI/NwMAQfCRB0Lkm/nb6Mml0z83AwBB6JEHQuSb+dvoyaXTPzcDAEHgkQdC5Jv52+jJpdM/NwMAQdiRB0Lkm/nb6Mml0z83AwBB0JEHQqnhoqCrhZ7UPzcDAEHIkQdCqeGioKuFntQ/NwMAQcCRB0Kp4aKgq4We1D83AwBBuJEHQqnhoqCrhZ7UPzcDAEGwkQdC7qbM5O3AltU/NwMAQaiRB0K9ia3N5LT+1D83AwBBoJEHQpXCisHJ9vzRPzcDAEGYkQdCoIumlb23h88/NwMAQbCWB0L7qLi9lNye0j83AwBBuJYHQrPmzJmz5szhPzcDAEHAlgdCgICAgICAgJLAADcDAEHIlgdCgICAgICAgJLAADcDAEHQlgdCgICAgICAgPo/NwMAQdiWB0Kz5syZs+bM6T83AwBB4JYHQoCAgICAgID4PzcDAEHolgdCgICAgICAgJLAADcDAEGAlQdC9p7o2MCKxNw/NwMAQfiUB0L2nujYwIrE3D83AwBB8JQHQvae6NjAisTcPzcDAEHolAdC9p7o2MCKxNw/NwMAQeCUB0L2nujYwIrE3D83AwBB2JQHQvae6NjAisTcPzcDAEHQlAdC9p7o2MCKxNw/NwMAQciUB0L2nujYwIrE3D83AwBBwJQHQtP8kKi19NXdPzcDAEG4lAdC0/yQqLX01d0/NwMAQbCUB0LT/JCotfTV3T83AwBB8JYHQoCAgICAgJCowAA3AwBB+JYHQoCAgICAgJCowAA3AwBBgJcHQoCAgICAgMCkwAA3AwBBiJcHQoCAgICAgOCawAA3AwBBkJcHQri9lNyeiq7PPzcDAEGYlwdCgICAgICAwKTAADcDAEHYlwdC/NPGl93JmMA/NwMAQdCXB0K56KK25/enxT83AwBByJcHQvzTxpfdyZjIPzcDAEHAlwdC+v2p48vupLw/NwMAQeCXB0KAgICAgICAqsAANwMAQfCXB0KAgICAgIDArMAANwMAQeiXB0KAgICAgICgq8AANwMAQfiXB0KAgICAgICAr8AANwMAQYCYB0KAgICAgIDArMAANwMAQZiYB0KAgICAgICA/D83AwBBkJgHQubMmbPmzJn/PzcDAEGomAdCgICAgICAgPg/NwMAQaCYB0LmzJmz5syZ+z83AwBBuJgHQoCAgICAgID8PzcDAEGwmAdC5syZs+bMmfk/NwMAQfiYB0KAgICAgICAgsAANwMAQfCYB0KAgICAgICA/D83AwBB6JgHQpqz5syZs+b8PzcDAEHgmAdC9tHw+qi4vfw/NwMAQcCYB0LNmbPmzJmz/j83AwBBgJkHQpqz5syZs+aAwAA3AwBBiJkHQoCAgICAgICAwAA3AwBBkJoHQrPmzJmz5sz5PzcDAEHQmQdCgICAgICAgPw/NwMAQbCZB0KAgICAgICA/D83AwBBoJkHQrPmzJmz5sz5PzcDAEH4mgdCgICAgICAgPg/NwMAQfCaB0KAgICAgICA+D83AwBB6JoHQoCAgICAgID4PzcDAEHgmgdCgICAgICAgPg/NwMAQYCbB0Kas+bMmbPm9D83AwBBwJsHQoCAgICAgID4PzcDAEG4mwdCgICAgICAgPg/NwMAQbCbB0KAgICAgICA+D83AwBBkJsHQvuouL2U3J7SPzcDAEHQmwdCs+bMmbPmzOk/NwMAQcibB0KAgICAgICA+D83AwBB2JsHQvbR8PqouL30PzcDAEHgmwdCuL2U3J6Kruc/NwMAQeibB0KAgICQytLGrsIANwMAQfCbB0Kas+bMmbPm+j83AwBB+JsHQoCAgICAgNDPwAA3AwBBgJwHQoCAgICAgICAwAA3AwBBiJwHQoCAgICAgICfwAA3AwBByJwHQoCAgICAgID4PzcDAEHAnAdCgICAgICAgOg/NwMAQbicB0Kas+bMmbPm9D83AwBBsJwHQpqz5syZs+bkPzcDAEGQnAdCgICAgICAgPg/NwMAQdCcB0Kas+bMmbPm/D83AwBB2JwHQs2Zs+bMmbP2PzcDAEHgnQdCgICAgICAgIrAADcDAEGgnQdCgICAgICAgJDAADcDAEGAnQdCgICAgICAgJDAADcDAEHwnAdCgICAgICAgIrAADcDAEGIngdCADcDAEGQngdCADcDAEGYngdCgICAgICAgPg/NwMAQaCeB0KAgICAgICA/D83AwBBqJ4HQoCAgICAgID8PzcDAEGwngdCgICAgICAgPg/NwMAQbieB0KAgICAgICA+D83AwBB6J4HQoCAgICAgID4PzcDAEHgngdCgICAgICAgPg/NwMAQcCeB0KAgICAgICA+D83AwBB+J4HQoCAgICAgID4PzcDAEHwngdCgICAgICAgPg/NwMAQYCfB0KU3J6Kro+F+T83AwBBiJ8HQoCAgICAgICKwAA3AwBBkJ8HQoCAgICAgID4PzcDAEGYnwdCgICAgICAgIDAADcDAEGgnwdCADcDAEGonwdCmrPmzJmz5tw/NwMAQbCfB0IANwMAQbifB0Kas+bMmbPm1D83AwBBwJ8HQs7QkIKchPX4PzcDAEHInwdC0vD6qLi9lNw/NwMAQdCfB0LmzJmz5syZ+z83AwBB2J8HQoCAgICAgICKwAA3AwBB4J8HQoCAgICAgICKwAA3AwBB6J8HQoCAgICAgICKwAA3AwBB8J8HQoCAgICAgICKwAA3AwBB+J8HQoCAgICAgICKwAA3AwBBgKAHQoCAgICAgICKwAA3AwBBiKAHQoCAgICAgICKwAA3AwBBkKAHQgA3AwBBmKAHQgA3AwBBsKAHQoCAgICAgID4PzcDAEHYoQdCzZmz5syZs/Y/NwMAQeChB0Kz5syZs+bM9T83AwBBuKAHQrPmzJmz5sz1PzcDAEHwogdCgICAgICAgK/AADcDAEH4ogdCgICAgICAgKrAADcDAEGAowdCgICAgICAwKzAADcDAEGIowdCADcDAEGYowdCmrPmzJmz5tw/NwMAQZCjB0L6/anjy+6ktD83AwBBoKMHQs7QkIKchPX4PzcDAEGoowdC5syZs+bMmfs/NwMAQbCjB0IANwMAQbijB0IANwMAQcCjB0IANwMAQcijB0KAgICAgICA+D83AwBB0KMHQoCAgICAgIDwPzcDAEHYowdCgICAgICAgPA/NwMAQeCjB0KAgICQytLGrsIANwMAQeijB0KAgICAgICAn8AANwMAQfCjB0KAgICAgICAgMAANwMAQfijB0IANwMAQYCkB0KAgICAgICAgMAANwMAQYikB0KAgICAgICAjsAANwMAQZCkB0KAgICAgIDlycAANwMAQZikB0KthvHYrtyNjT83AwBBoKQHQoCAgICAgOTPwAA3AwBBqKQHQoCAgICAgOTPwAA3AwBBsKQHQoCAgICAgOTPwAA3AwBBuKQHQoCAgICAgOTPwAA3AwBBwKQHQoCAgICAgOTPwAA3AwBByKQHQoCAgICAgOTPwAA3AwBB0KQHQoCAgICAgOTPwAA3AwBB2KQHQoCAgICAgMCswAA3AwBB4KQHQs2Zs+bMmbP6PzcDAEH4pAdCgICAgICAgIbAADcDAEHwpAdC5syZs+bMmfs/NwMAQYClB0LmzJmz5syZ8z83AwBBmKUHQpqz5syZs+bsPzcDAEGQpQdCs+bMmbPmzPE/NwMAQYilB0Kz5syZs+bM+T83AwBBoKUHQoCAgICAgIDgPzcDAEGopQdCgICAgICAwKzAADcDAEGwpQdCgICAgICAgPg/NwMAQeilB0KO6NePwoKA2D83AwBB4KUHQuXsoKay5NnrPzcDAEHYpQdCnb+Kx4Pe2vE/NwMAQfimB0Kas+bMmbPm7D83AwBB8KYHQvbR8PqouL3sPzcDAEGApwdCgICAgICAgIrAADcDAEGIpwdCgICAgICAgIDAADcDAEGQpwdCgICAgICAgJLAADcDAEGYpwdCgICAgICAgJrAADcDAEGgpwdCs+bMmbPmzIPAADcDAEGopwdCgICAgICAgIPAADcDAEGwpwdCgICAgICAgPg/NwMAQbinB0KAgICAgICA+D83AwBBwKcHQoCAgICAgID4PzcDAEHIpwdCgICAgICAgJnAADcDAEHQpwdCgICAgICAgIrAADcDAEHYpwdCgICAgICAgIrAADcDAEHgpwdCgICAgICAgIrAADcDAEHopwdCgICAgICAgJfAADcDAEHwpwdCgICAgICAgJrAADcDAEH4pwdCgICAgICA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JAAgACgCPCABpyABQiCIpyACQf8BcSADQQhqEAEQHSEAIAMpAwghASADQRBqJABCfyABIAAbCxAAQZYKQaMBQdAjKAIAECILCQAgACgCPBAECzIBAX8gACgCFCIDIAEgAiAAKAIQIANrIgEgASACSxsiARANIAAgACgCFCABajYCFCACC5MFAgZ+AX8gASABKAIAQQdqQXhxIgFBEGo2AgAgAAJ8IAEpAwAhBCABKQMIIQUjAEEgayIBJAACQCAFQv///////////wCDIgNCgICAgICAwIA8fSADQoCAgICAgMD/wwB9VARAIAVCBIYgBEI8iIQhAyAEQv//////////D4MiBEKBgICAgICAgAhaBEAgA0KBgICAgICAgMAAfCECDAILIANCgICAgICAgIBAfSECIARCgICAgICAgIAIhUIAUg0BIAIgA0IBg3whAgwBCyAEUCADQoCAgICAgMD//wBUIANCgICAgICAwP//AFEbRQRAIAVCBIYgBEI8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIANC////////v//DAFYNAEIAIQIgA0IwiKciCEGR9wBJDQAgBCECIAVC////////P4NCgICAgICAwACEIgMhBgJAIAhBgfcAayIAQcAAcQRAIAIgAEFAaq2GIQZCACECDAELIABFDQAgBiAArSIHhiACQcAAIABrrYiEIQYgAiAHhiECCyABIAI3AxAgASAGNwMYIAEhAAJAQYH4ACAIayIIQcAAcQRAIAMgCEFAaq2IIQRCACEDDAELIAhFDQAgA0HAACAIa62GIAQgCK0iAoiEIQQgAyACiCEDCyAAIAQ3AwAgACADNwMIIAEpAwhCBIYgASkDACIEQjyIhCECIAEpAxAgASkDGIRCAFKtIARC//////////8Pg4QiBEKBgICAgICAgAhaBEAgAkIBfCECDAELIARCgICAgICAgIAIhUIAUg0AIAJCAYMgAnwhAgsgAUEgaiQAIAIgBUKAgICAgICAgIB/g4S/CzkDAAvgFgMSfwF8An4jAEGwBGsiCSQAIAlBADYCLAJAIAG9IhlCAFMEQEEBIRFB6gkhEiABmiIBvSEZDAELIARBgBBxBEBBASERQe0JIRIMAQtB8AlB6wkgBEEBcSIRGyESIBFFIRYLAkAgGUKA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iKAHIAArA4gIOQMAQdihByAAKwOQCDkDAEHgoQcgACsDmAg5AwBBsKAHIAArA6AIOQMAQbigByAAKwOoCDkDAEHwogcgACsDsAg5AwBB8KMHIAArA7gIOQMAQfimByAAKwPACDkDAEHwpgcgACsDyAg5AwBBkKwHIAArA9AIOQMAQeDHByAAKwPYCDkDAEGQ1gYgACsD4Ag5AwBBwNEFIAArA+gIOQMAQaDWBiAAKwPwCDkDAEGA0gUgACsD+Ag5AwBB0NEFIAArA4AJOQMAECtB4IEOQbifBisDACIDOQMAQbyBDkEANgIAQdCBDkEANgIAQdSBDkEANgIAAkACf0Gg5QUrAwAgA6FBoKUHKwMAoxAgIgOZRAAAAAAAAOBBYwRAIAOqDAELQYCAgIB4CyIPQQBIDQADQBAnAnxB4IEOKwMAIQcCQEGQnwcrAwAiBCIDvSITQgGGIhJQIBNC////////////AINCgICAgICAgPj/AFZyRQRAIAe9IhRCNIinQf8PcSIAQf8PRw0BCyAHIAOiIgMgA6MMAQsgEiAUQgGGIhFaBEAgB0QAAAAAAAAAAKIgByARIBJRGwwBCyATQjSIp0H/D3EhAQJ+IABFBEBBACEAIBRCDIYiEUIAWQRAA0AgAEEBayEAIBFCAYYiEUIAWQ0ACwsgFEEBIABrrYYMAQsgFEL/////////B4NCgICAgICAgAiECyERAn4gAUUEQEEAIQEgE0IMhiISQgBZBEADQCABQQFrIQEgEkIBhiISQgBZDQALCyATQQEgAWuthgwBCyATQv////////8Hg0KAgICAgICACIQLIRMgACABSgRAA0ACQCARIBN9IhJCAFMNACASIhFCAFINACAHRAAAAAAAAAAAogwDCyARQgGGIREgAEEBayIAIAFKDQALIAEhAAsCQCARIBN9IhJCAFMNACASIhFCAFINACAHRAAAAAAAAAAAogwBCwJAIBFC/////////wdWBEAgESESDAELA0AgAEEBayEAIBFCgICAgICAgARUIQEgEUIBhiISIREgAQ0ACwsgFEKAgICAgICAgIB/gyASQoCAgICAgIAIfSAArUI0hoQgEkEBIABrrYggAEEAShuEvwtEje21oPfGsD5jBEBBzIEOKAIARQRAQcyBDgJ/QaDlBSsDAEG4nwYrAwChIASjECAiA0QAAAAAAADwQWMgA0QAAAAAAAAAAGZxBEAgA6sMAQtBAAtBAWo2AgALQciBDkEANgIAAkBBxIEOKAIAIgAEQCAAKAIAIgxFDQEgACgCBCAAQQxqQQAgACgCCCIBGxAjQQEhC0EDIQAgDEEBRg0BA0BBxIEOKAIAIgIgACABaiIAQQJ0aiIBKAIAIAIgAEECaiIAQQJ0akEAIAEoAgQiARsQIyALQQFqIgsgDEcNAAsMAQtB2LUMKwMAEAVB4LUMKwMAEAVB6LUMKwMAEAVB8LUMKwMAEAVB+LUMKwMAEAVBgLYMKwMAEAVBiLYMKwMAEAVBkLYMKwMAEAVBmLYMKwMAEAVBoLYMKwMAEAVBqLYMKwMAEAVBsLYMKwMAEAVBsIEOKwMAEAVBuLYMKwMAEAVBoIEOKwMAEAVBwLYMKwMAEAVB2KkNKwMAEAVB4KkNKwMAEAVB6KkNKwMAEAVB+KkNKwMAEAVBiKoNKwMAEAVB0KkNKwMAEAVB8KkNKwMAEAVBgKoNKwMAEAVBoKoNKwMAEAVBmKoNKwMAEAVBkKoNKwMAEAVBkIEOKwMAEAVBqJEIKwMAEAVBgIEOKwMAEAVB6JANKwMAEAVBuMIMKwMAEAVBuJwMKwMAEAVBwJwMKwMAEAVByJwMKwMAEAVB2JwMKwMAEAVB6JwMKwMAEAVBsJwMKwMAEAVB0JwMKwMAEAVB4JwMKwMAEAVBmIAOKwMAEAVBoIAOKwMAEAVBqIAOKwMAEAVBuIAOKwMAEAVByIAOKwMAEAVBkIAOKwMAEAVBsIAOKwMAEAVBwIAOKwMAEAVBmM0FKwMAEAVBqM0FKwMAEAVBkM0FKwMAEAVBoM0FKwMAEAVBgIAOKwMAEAVB8P8NKwMAEAVBwJ0IKwMAEAVBuPwNKwMAEAVB0OsNKwMAEAVB4KYNKwMAEAVB+KcNKwMAEAVB4KcNKwMAEAVB0PkNKwMAEAVB2OsNKwMAEAVB8KYNKwMAEAVB+KYNKwMAEAVByPkNKwMAEAVB2PwNKwMAEAVB0PwNKwMAEAVB0KYMKwMAEAVBiKcMKwMAEAVBmKcMKwMAEAVB4KYMKwMAEAVBgKcMKwMAEAVBkKcMKwMAEAVB4KIMKwMAEAVBmKMMKwMAEAVBqKMMKwMAEAVB8KIMKwMAEAVBkKMMKwMAEAVBoKMMKwMAEAVB+KAMKwMAEAVBoPkNKwMAEAVBqPkNKwMAEAVBiPkNKwMAEAVBkPkNKwMAEAVBmPkNKwMAEAVBgPkNKwMAEAVB8LYMKwMAEAVB8O0NKwMAEAVBuOoNKwMAEAVBoOoNKwMAEAVBuO0NKwMAEAVBwO0NKwMAEAVByO0NKwMAEAVB2O0NKwMAEAVB6O0NKwMAEAVBsO0NKwMAEAVB0O0NKwMAEAVB4O0NKwMAEAVB6OwNKwMAEAVBgJENKwMAEAVB8OsNKwMAEAVBqOgNKwMAEAVBsOgNKwMAEAVBuOgNKwMAEAVByOgNKwMAEAVB2OgNKwMAEAVBoOgNKwMAEAVBwOgNKwMAEAVB0OgNKwMAEAVBwOoNKwMAEAVBqOoNKwMAEAVBsOoNKwMAEAVBmOoNKwMAEAVBqLoLKwMAEAVB6OgNKwMAEAVB8OgNKwMAEAVB+OgNKwMAEAVBiOkNKwMAEAVBmOkNKwMAEAVB4OgNKwMAEAVBgOkNKwMAEAVBkOkNKwMAEAVBsOkNKwMAEAVBqOkNKwMAEAVBkNQMKwMAEAVBqKsNKwMAEAVB6KoNKwMAEAVB4KoNKwMAEAVBwKoNKwMAEAVBwLwNKwMAEAVBkKsNKwMAEAVBiKsNKwMAEAVB6McNKwMAEAVBoNAMKwMAEAVBqNsHKwMAEAVB8L4MKwMAEAVB4McNKwMAEAVB2McNKwMAEAVBsKcNKwMAEAVByKYNKwMAEAVBqKcNKwMAEAVBsMcNKwMAEAVBmP4LKwMAEAVBiMQNKwMAEAVBgMQNKwMAEAVB+MMNKwMAEAVB4MMNKwMAEAVB0MMNKwMAEAVB8MINKwMAEAVBmMANKwMAEAVBkMANKwMAEAVBiMANKwMAEAVBgMANKwMAEAVBqP4LKwMAEAVBwL4NKwMAEAVBuL4NKwMAEAVBsL4NKwMAEAVBqL4NKwMAEAVBuP4LKwMAEAVB6L0NKwMAEAVBuL0NKwMAEAVBsL0NKwMAEAVBoL0NKwMAEAVBoNsHKwMAEAVB8LENKwMAEAVB6KsNKwMAEAVB8KsNKwMAEAVB+KsNKwMAEAVBiKwNKwMAEAVBmKwNKwMAEAVB4KsNKwMAEAVBgKwNKwMAEAVBkKwNKwMAEAVBkJENKwMAEAVByKsNKwMAEAVBwLEMKwMAEAVB+NsHKwMAEAVBgKEMKwMAEAVBuKkNKwMAEAVBsKkNKwMAEAVBoKkN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AwChIAxBsPYNaisDAKEgA6KgOQMAIAAhAUEAIQBBASENIAENAAsDQCALQagBbCIBQcDYB2oiACAAKwMIIAFBkM4GaiIAKwMAIAArAwihIAFBsPYNaisDCKEgA6KgOQMIQQEhCyACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMQIAFBkM4GaiIAKwMIIAArAxChIAFBsPYNaisDEKEgA6KgOQMQQQEhAiALQQFxIQBBACELIAANAAsDQCALQagBbCIBQcDYB2oiACAAKwMYIAFBkM4GaiIAKwMQIAArAxihIAFBsPYNaisDGKEgA6KgOQMYQQEhCyACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMgIAFBkM4GaiIAKwMYIAArAyChIAFBsPYNaisDIKEgA6KgOQMgQQEhAiALQQFxIQBBACELIAANAAsDQCALQagBbCIBQcDYB2oiACAAKwMoIAFBkM4GaiIAKwMgIAArAyihIAFBsPYNaisDKKEgA6KgOQMoQQEhCyACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMwIAFBkM4GaiIAKwMoIAArAzChIAFBsPYNaisDMKEgA6KgOQMwQQEhAiALQQFxIQBBACELIAANAAsDQCALQagBbCIBQcDYB2oiACAAKwM4IAFBkM4GaiIAKwMwIAArAzihIAFBsPYNaisDOKEgA6KgOQM4QQEhCyACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwNAIAFBkM4GaiIAKwM4IAArA0ChIAFBsPYNaisDQKEgA6KgOQNAQQEhAiALQQFxIQBBACELIAANAAsDQCALQagBbCIBQcDYB2oiACAAKwNIIAFBkM4GaiIAKwNAIAArA0ihIAFBsPYNaisDSKEgA6KgOQNIQQEhCyACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwNQIAFBkM4GaiIAKwNIIAArA1ChIAFBsPYNaisDUKEgA6KgOQNQQQEhAiALQQFxIQBBACELIAANAAsDQCALQagBbCIBQcDYB2oiACAAKwNYIAFBkM4GaiIAKwNQIAArA1ihIAFBsPYNaisDWKEgA6KgOQNYQQEhCyACQQFxIQBBACECIAANAAsDQCAC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KwNQIAJB0LkMaiIAKwNIIAJBkPENaisDUKEgACsDUKEgA6KgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQaDiB2oiASABKwNYIAJB0LkMaiIBKwNQIAJBkPENaisDWKEgASsDWKEgA6KgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQaDiB2oiACAAKwNgIAJB0LkMaiIAKwNYIAJBkPENaisDYKEgACsDYKEgA6KgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQaDiB2oiASABKwNoIAJB0LkMaiIBKwNgIAJBkPENaisDaKEgASsDaKEgA6KgOQNoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQaDiB2oiACAAKwNwIAJB0LkMaiIAKwNoIAJBkPENaisDcKEgACsDcKEgA6KgOQNwQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQaDiB2oiASABKwN4IAJB0LkMaiIBKwNwIAJBkPENaisDeKEgASsDeKEgA6KgOQN4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQaDiB2oiACAAKwOAASACQdC5DGoiACsDeCACQZDxDWorA4ABoSAAKwOAAaEgA6KgOQOAAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkGg4gdqIgEgASsDiAEgAkHQuQxqIgErA4ABIAJBkPENaisDiAGhIAErA4gBoSADoqA5A4gBQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQaDiB2oiACAAKwOQASACQdC5DGoiACsDiAEgAkGQ8Q1qKwOQAaEgACsDkAGhIAOioDkDkAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJBoOIHaiIBIAErA5gBIAJB0LkMaiIBKwOQASACQZDxDWorA5gBoSABKwOYAaEgA6KgOQOYAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkGg4gdqIgAgACsDoAEgAkHQuQxqIgArA5gBIAJBkPENaisDoAGhIAArA6ABoSADoqA5A6ABQQEhACABIQJBACEBIAINAAtBmI4IQZiOCCsDAEGA2A0rAwAgA6KgOQMAQYiOCEGIjggrAwAgA0Hw1w0rAwCioDkDAEHg9QtB4PULKwMAIANBsMUNKwMAQdirDSsDAKGioDkDAEEBIQJBACENA0AgDUGoAWwiDEHwmAxqIgsgCysDACADIAxBwMsGaisDAJogDEHgxQxqKwMAoaKgOQMAIAIhC0EAIQJBASENIAsNAAsDQCABQagBbCICQfCYDGoiASABKwMIIAMgAkHAywZqIgErAwAgASsDCKEgAkHgxQxqKwMIoaKgOQMIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwMQIAMgAkHAywZqIgArAwggACsDEKEgAkHgxQxqKwMQoaKgOQMQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwMYIAMgAkHAywZqIgErAxAgASsDGKEgAkHgxQxqKwMYoaKgOQMYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwMgIAMgAkHAywZqIgArAxggACsDIKEgAkHgxQxqKwMgoaKgOQMgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwMoIAMgAkHAywZqIgErAyAgASsDKKEgAkHgxQxqKwMooaKgOQMoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwMwIAMgAkHAywZqIgArAyggACsDMKEgAkHgxQxqKwMwoaKgOQMwQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwM4IAMgAkHAywZqIgErAzAgASsDOKEgAkHgxQxqKwM4oaKgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwNAIAMgAkHAywZqIgArAzggACsDQKEgAkHgxQxqKwNAoaKgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwNIIAMgAkHAywZqIgErA0AgASsDSKEgAkHgxQxqKwNIoaKgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwNQIAMgAkHAywZqIgArA0ggACsDUKEgAkHgxQxqKwNQoaKgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwNYIAMgAkHAywZqIgErA1AgASsDWKEgAkHgxQxqKwNYoaKgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCYDGoiACAAKwNgIAMgAkHAywZqIgArA1ggACsDYKEgAkHgxQxqKwNgoaKgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwNoIAMgAkHAywZqIgErA2AgASsDaKEgAkHgxQxqKwNooaKgOQNoQQEhASAAIQJBACEAIAINAAtBACEBQQAhDUGgpQcrAwAhBEEBIQBBASECA0AgDUGoAWwiDEHwmAxqIgsgCysDcCAMQcDLBmoiCysDaCALKwNwoSAMQeDFDGorA3ChIASioDkDcCACIQtBACECQQEhDSALDQALA0AgAUGoAWwiAkHwmAxqIgEgASsDeCACQcDLBmoiASsDcCABKwN4oSACQeDFDGorA3ihIASioDkDeEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmAxqIgAgACsDgAEgAkHAywZqIgArA3ggACsDgAGhIAJB4MUMaisDgAGhIASioDkDgAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJB8JgMaiIBIAErA4gBIAJBwMsGaiIBKwOAASABKwOIAaEgAkHgxQxqKwOIAaEgBKKgOQOIAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmAxqIgAgACsDkAEgAkHAywZqIgArA4gBIAArA5ABoSACQeDFDGorA5ABoSAEoqA5A5ABQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCYDGoiASABKwOYASACQcDLBmoiASsDkAEgASsDmAGhIAJB4MUMaisDmAGhIASioDkDmAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8JgMaiIAIAArA6ABIAJBwMsGaiIAKwOYASAAKwOgAaEgAkHgxQxqKwOgAaEgBKKgOQOgAUEBIQAgASECQQAhASACDQALQfDsB0Hw7AcrAwAgBEQAAAAAAAAAAKIiA6A5AwBBmO4HQZjuBysDACADoDkDAEGA7QdBgO0HKwMAIAOgOQMAQYjtB0GI7QcrAwAgA6A5AwBBqO4HQajuBysDACADoDkDAEGw7gdBsO4HKwMAIAOgOQMAQQEhAkEAIQ0DQCANQagBbCIMQfDsB2oiCyALKwMgIAxBsN0NaisDICAMQcDuDWorAyChIAxBoLwMaisDIKEgBKKgOQMgIAIhC0EAIQJBASENIAsNAAsDQCABQagBbCICQfDsB2oiASABKwMoIAJBsN0NaisDKCACQcDuDWorAyihIAJBoLwMaiIBKwMooSABKwMgoCAEoqA5AyhBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8OwHaiIAIAArAzAgAkGw3Q1qKwMwIAJBwO4NaisDMKEgAkGgvAxqIgArAzChIAArAyigIASioDkDMEEBIQAgASECQQAhASACDQALQfjsB0H47AcrAwAgA6A5AwBBoO4HQaDuBysDACADoDkDAEEBIQJBACENA0AgDUGoAWwiDEHw7AdqIgsgCysDOCAMQaC8DGoiCysDMCAMQcDuDWorAzihIAsrAzihIASioDkDOCACIQtBACECQQEhDSALDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDQCACQaC8DGoiASsDOCACQcDuDWorA0ChIAErA0ChIASioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDSCACQaC8DGoiACsDQCACQcDuDWorA0ihIAArA0ihIASioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDUCACQaC8DGoiASsDSCACQcDuDWorA1ChIAErA1ChIASioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDWCACQaC8DGoiACsDUCACQcDuDWorA1ihIAArA1ihIASioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDYCACQaC8DGoiASsDWCACQcDuDWorA2ChIAErA2ChIASioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDaCACQaC8DGoiACsDYCACQcDuDWorA2ihIAArA2ihIASioDkDaEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDcCACQaC8DGoiASsDaCACQcDuDWorA3ChIAErA3ChIASioDkDcEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDeCACQaC8DGoiACsDcCACQcDuDWorA3ihIAAr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",BA(d)||(d=H(d));function MA(g){try{if(g==d&&f)return new Uint8Array(f);var C=DA(g);if(C)return C;if(t)return t(g);throw"both async and sync fetching of the wasm failed"}catch(s){W(s)}}function nA(){if(!f&&(o||K)){if(typeof fetch=="function"&&!oA(d))return fetch(d,{credentials:"same-origin"}).then(function(g){if(!g.ok)throw"failed to load wasm binary file at \'"+d+"\'";return g.arrayBuffer()}).catch(function(){return MA(d)});if(G)return new Promise(function(g,C){G(d,function(s){g(new Uint8Array(s))},C)})}return Promise.resolve().then(function(){return MA(d)})}function NA(){var g={a:mA};function C(k,r){var z=k.exports;Q.asm=z,U=Q.asm.f,b(U.buffer),_=Q.asm.o,HA(Q.asm.g),OA()}aA();function s(k){C(k.instance)}function e(k){return nA().then(function(r){return WebAssembly.instantiate(r,g)}).then(function(r){return r}).then(k,function(r){n("failed to asynchronously prepare wasm: "+r),W(r)})}function h(){return!f&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(d)&&!oA(d)&&typeof fetch=="function"?fetch(d,{credentials:"same-origin"}).then(function(k){var r=WebAssembly.instantiateStreaming(k,g);return r.then(s,function(z){return n("wasm streaming compile failed: "+z),n("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var y=Q.instantiateWasm(g,C);return y}catch(k){return n("Module.instantiateWasm callback failed with error: "+k),!1}return h().catch(w),{}}function wA(g){for(;g.length>0;){var C=g.shift();if(typeof C=="function"){C(Q);continue}var s=C.func;typeof s=="number"?C.arg===void 0?iA(s)():iA(s)(C.arg):s(C.arg===void 0?null:C.arg)}}function iA(g){return _.get(g)}function tA(g,C,s){Z.copyWithin(g,C,C+s)}function uA(g){W("OOM")}function hA(g){Z.length,uA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(g,C){var s=AA.buffers[g];C===0||C===10?((g===1?O:n)(F(s,0)),s.length=0):s.push(C)},varargs:void 0,get:function(){AA.varargs+=4;var g=j[AA.varargs-4>>2];return g},getStr:function(g){var C=l(g);return C},get64:function(g,C){return g}};function yA(g){return 0}function jA(g,C,s,e,h){}function zA(g,C,s,e){for(var h=0,y=0;y<s;y++){var k=j[C>>2],r=j[C+4>>2];C+=8;for(var z=0;z<r;z++)AA.printChar(g,Z[k+z]);h+=r}return j[e>>2]=h,0}var fA=typeof atob=="function"?atob:function(g){var C="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,h,y,k,r,z,S,Y=0;g=g.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do k=C.indexOf(g.charAt(Y++)),r=C.indexOf(g.charAt(Y++)),z=C.indexOf(g.charAt(Y++)),S=C.indexOf(g.charAt(Y++)),e=k<<2|r>>4,h=(r&15)<<4|z>>2,y=(z&3)<<6|S,s=s+String.fromCharCode(e),z!==64&&(s=s+String.fromCharCode(h)),S!==64&&(s=s+String.fromCharCode(y));while(Y<g.length);return s};function LA(g){try{for(var C=fA(g),s=new Uint8Array(C.length),e=0;e<C.length;++e)s[e]=C.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(g){if(BA(g))return LA(g.slice(EA.length))}var mA={c:tA,d:hA,e:yA,b:jA,a:zA};NA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},gA=Q.stackAlloc=function(){return(gA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=J;var QA;V=function g(){QA||CA(),QA||(V=g)};function CA(g){if(v>0||(X(),v>0))return;function C(){QA||(QA=!0,Q.calledRun=!0,!q&&(kA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),GA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),C()},1)):C()}if(Q.run=CA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return CA(),Q.ready})})();exposeModelWorker(Module)})();\n';
class BundleModelRunner {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(e, r, o) {
    this.modelSpec = e, this.inputMap = r, this.modelRunner = o, this.inputs = [...r.values()].map((B) => B.value), this.outputs = o.createOutputs();
  }
  async runModelForScenario(e, r) {
    return setInputsForScenario(this.inputMap, e), r[0]?.startsWith("ModelImpl") ? this.runModelWithImplOutputs(r) : this.runModelWithNormalOutputs(r);
  }
  async runModelWithNormalOutputs(e) {
    this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const r = this.outputs.runTimeInMillis, o = /* @__PURE__ */ new Map();
    for (const B of e) {
      const Q = this.modelSpec.outputVars.get(B);
      if (Q)
        if (Q.sourceName === void 0) {
          const i = this.outputs.getSeriesForVar(Q.varId);
          i && o.set(B, datasetFromPoints(i.points));
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
    const o = this.outputs.startTime, B = this.outputs.endTime, Q = this.outputs.saveFreq;
    let i = createImplOutputs(r, o, B, Q);
    i = await this.modelRunner.runModel(this.inputs, i);
    const s = i.runTimeInMillis, a = /* @__PURE__ */ new Map();
    for (const g of e) {
      const n = this.modelSpec.implVars.get(g), E = i.getSeriesForVar(n.varId);
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
  const B = [], Q = [];
  for (const s of A)
    B.push(s.varId), Q.push({
      varIndex: s.varIndex,
      subscriptIndices: s.subscriptIndices
    });
  const i = new Outputs(B, e, r, o);
  return i.varSpecs = Q, i;
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
  const A = getInputVars(inputSpecs), e = getOutputVars(outputSpecs), { implVars: r, implVarGroups: o } = getImplVars(encodedImplVars), B = {
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
    modelSpec: B,
    initModel: () => initBundleModel(B, A)
  };
}
export {
  createBundle
};
