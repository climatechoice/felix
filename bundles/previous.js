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
    constructor(Q, i) {
      var o, B;
      typeof Q == "string" && i && i._baseURL ? Q = new URL(Q, i._baseURL) : typeof Q == "string" && !isAbsoluteURL(Q) && getBundleURLCached().match(/^file:\/\//i) && (Q = new URL(Q, getBundleURLCached().replace(/\/[^\/]+$/, "/")), (!((o = i?.CORSWorkaround) !== null && o !== void 0) || o) && (Q = createSourceBlobURL(`importScripts(${JSON.stringify(Q)});`))), typeof Q == "string" && isAbsoluteURL(Q) && (!((B = i?.CORSWorkaround) !== null && B !== void 0) || B) && (Q = createSourceBlobURL(`importScripts(${JSON.stringify(Q)});`)), super(Q, i);
    }
  }
  class e extends A {
    constructor(Q, i) {
      const o = window.URL.createObjectURL(Q);
      super(o, i);
    }
    static fromText(Q, i) {
      const o = new window.Blob([Q], { type: "text/javascript" });
      return new e(o, i);
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
  }), Q = r ? r.getFileName() : null;
  let i = Q || null;
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
      const Q = r && r.fromSource ? null : resolveScriptPath(e, (r || {})._baseURL);
      if (Q)
        Q.match(/\.tsx?$/i) && detectTsNode() ? super(createTsNodeModule(Q), Object.assign(Object.assign({}, r), { eval: !0 })) : Q.match(/\.asar[\/\\]/) ? super(Q.replace(/\.asar([\/\\])/, ".asar.unpacked$1"), r) : super(Q, r);
      else {
        const i = e;
        super(i, Object.assign(Object.assign({}, r), { eval: !0 }));
      }
      this.mappedEventListeners = /* @__PURE__ */ new WeakMap(), allWorkers.push(this);
    }
    addEventListener(e, r) {
      const Q = (i) => {
        r({ data: i });
      };
      this.mappedEventListeners.set(r, Q), this.on(e, Q);
    }
    removeEventListener(e, r) {
      const Q = this.mappedEventListeners.get(r) || r;
      this.off(e, Q);
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
  const Q = () => {
    Promise.all(e.map((o) => o.terminate())).then(() => process.exit(0), () => process.exit(1)), e = [];
  };
  process.on("SIGINT", () => Q()), process.on("SIGTERM", () => Q());
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
  var A = 1e3, e = A * 60, r = e * 60, Q = r * 24, i = Q * 7, o = Q * 365.25;
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
            return l * o;
          case "weeks":
          case "week":
          case "w":
            return l * i;
          case "days":
          case "day":
          case "d":
            return l * Q;
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
    return E >= Q ? Math.round(n / Q) + "d" : E >= r ? Math.round(n / r) + "h" : E >= e ? Math.round(n / e) + "m" : E >= A ? Math.round(n / A) + "s" : n + "ms";
  }
  function a(n) {
    var E = Math.abs(n);
    return E >= Q ? w(n, E, Q, "day") : E >= r ? w(n, E, r, "hour") : E >= e ? w(n, E, e, "minute") : E >= A ? w(n, E, A, "second") : n + " ms";
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
    Q.debug = Q, Q.default = Q, Q.coerce = w, Q.disable = s, Q.enable = o, Q.enabled = a, Q.humanize = requireMs(), Q.destroy = n, Object.keys(e).forEach((E) => {
      Q[E] = e[E];
    }), Q.names = [], Q.skips = [], Q.formatters = {};
    function r(E) {
      let l = 0;
      for (let f = 0; f < E.length; f++)
        l = (l << 5) - l + E.charCodeAt(f), l |= 0;
      return Q.colors[Math.abs(l) % Q.colors.length];
    }
    Q.selectColor = r;
    function Q(E) {
      let l, f = null, m, I;
      function g(...C) {
        if (!g.enabled)
          return;
        const t = g, D = Number(/* @__PURE__ */ new Date()), c = D - (l || D);
        t.diff = c, t.prev = l, t.curr = D, l = D, C[0] = Q.coerce(C[0]), typeof C[0] != "string" && C.unshift("%O");
        let d = 0;
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (h, P) => {
          if (h === "%%")
            return "%";
          d++;
          const H = Q.formatters[P];
          if (typeof H == "function") {
            const j = C[d];
            h = H.call(t, j), C.splice(d, 1), d--;
          }
          return h;
        }), Q.formatArgs.call(t, C), (t.log || Q.log).apply(t, C);
      }
      return g.namespace = E, g.useColors = Q.useColors(), g.color = Q.selectColor(E), g.extend = i, g.destroy = Q.destroy, Object.defineProperty(g, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (m !== Q.namespaces && (m = Q.namespaces, I = Q.enabled(E)), I),
        set: (C) => {
          f = C;
        }
      }), typeof Q.init == "function" && Q.init(g), g;
    }
    function i(E, l) {
      const f = Q(this.namespace + (typeof l > "u" ? ":" : l) + E);
      return f.log = this.log, f;
    }
    function o(E) {
      Q.save(E), Q.namespaces = E, Q.names = [], Q.skips = [];
      const l = (typeof E == "string" ? E : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const f of l)
        f[0] === "-" ? Q.skips.push(f.slice(1)) : Q.names.push(f);
    }
    function B(E, l) {
      let f = 0, m = 0, I = -1, g = 0;
      for (; f < E.length; )
        if (m < l.length && (l[m] === E[f] || l[m] === "*"))
          l[m] === "*" ? (I = m, g = f, m++) : (f++, m++);
        else if (I !== -1)
          m = I + 1, g++, f = g;
        else
          return !1;
      for (; m < l.length && l[m] === "*"; )
        m++;
      return m === l.length;
    }
    function s() {
      const E = [
        ...Q.names,
        ...Q.skips.map((l) => "-" + l)
      ].join(",");
      return Q.enable(""), E;
    }
    function a(E) {
      for (const l of Q.skips)
        if (B(E, l))
          return !1;
      for (const l of Q.names)
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
    return Q.enable(Q.load()), Q;
  }
  return common = A, common;
}
var hasRequiredBrowser;
function requireBrowser() {
  return hasRequiredBrowser || (hasRequiredBrowser = 1, (function(A, e) {
    e.formatArgs = Q, e.save = i, e.load = o, e.useColors = r, e.storage = B(), e.destroy = /* @__PURE__ */ (() => {
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
    function Q(a) {
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
    function o() {
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
  const Q = A._observer;
  try {
    const i = Q ? getMethod(Q, e) : void 0;
    switch (e) {
      case "next":
        i && i.call(Q, r);
        break;
      case "error":
        if (closeSubscription(A), i)
          i.call(Q, r);
        else
          throw r;
        break;
      case "complete":
        closeSubscription(A), i && i.call(Q);
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
    const Q = new SubscriptionObserver(this);
    try {
      this._cleanup = r.call(void 0, Q);
    } catch (i) {
      Q.error(i);
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
  subscribe(e, r, Q) {
    return (typeof e != "object" || e === null) && (e = {
      next: e,
      error: r,
      complete: Q
    }), new Subscription(e, this._subscriber);
  }
  pipe(e, ...r) {
    let Q = this;
    for (const i of [e, ...r])
      Q = i(Q);
    return Q;
  }
  tap(e, r, Q) {
    const i = typeof e != "object" || e === null ? {
      next: e,
      error: r,
      complete: Q
    } : e;
    return new Observable((o) => this.subscribe({
      next(B) {
        i.next && i.next(B), o.next(B);
      },
      error(B) {
        i.error && i.error(B), o.error(B);
      },
      complete() {
        i.complete && i.complete(), o.complete();
      },
      start(B) {
        i.start && i.start(B);
      }
    }));
  }
  forEach(e) {
    return new Promise((r, Q) => {
      if (typeof e != "function") {
        Q(new TypeError(e + " is not a function"));
        return;
      }
      function i() {
        o.unsubscribe(), r(void 0);
      }
      const o = this.subscribe({
        next(B) {
          try {
            e(B, i);
          } catch (s) {
            Q(s), o.unsubscribe();
          }
        },
        error(B) {
          Q(B);
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
    return new r((Q) => this.subscribe({
      next(i) {
        let o = i;
        try {
          o = e(i);
        } catch (B) {
          return Q.error(B);
        }
        Q.next(o);
      },
      error(i) {
        Q.error(i);
      },
      complete() {
        Q.complete();
      }
    }));
  }
  filter(e) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const r = getSpecies(this);
    return new r((Q) => this.subscribe({
      next(i) {
        try {
          if (!e(i))
            return;
        } catch (o) {
          return Q.error(o);
        }
        Q.next(i);
      },
      error(i) {
        Q.error(i);
      },
      complete() {
        Q.complete();
      }
    }));
  }
  reduce(e, r) {
    if (typeof e != "function")
      throw new TypeError(e + " is not a function");
    const Q = getSpecies(this), i = arguments.length > 1;
    let o = !1, B = r;
    return new Q((s) => this.subscribe({
      next(a) {
        const w = !o;
        if (o = !0, !w || i)
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
        if (!o && !i)
          return s.error(new TypeError("Cannot reduce an empty sequence"));
        s.next(B), s.complete();
      }
    }));
  }
  concat(...e) {
    const r = getSpecies(this);
    return new r((Q) => {
      let i, o = 0;
      function B(s) {
        i = s.subscribe({
          next(a) {
            Q.next(a);
          },
          error(a) {
            Q.error(a);
          },
          complete() {
            o === e.length ? (i = void 0, Q.complete()) : B(r.from(e[o++]));
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
    return new r((Q) => {
      const i = [], o = this.subscribe({
        next(s) {
          let a;
          if (e)
            try {
              a = e(s);
            } catch (n) {
              return Q.error(n);
            }
          else
            a = s;
          const w = r.from(a).subscribe({
            next(n) {
              Q.next(n);
            },
            error(n) {
              Q.error(n);
            },
            complete() {
              const n = i.indexOf(w);
              n >= 0 && i.splice(n, 1), B();
            }
          });
          i.push(w);
        },
        error(s) {
          Q.error(s);
        },
        complete() {
          B();
        }
      });
      function B() {
        o.closed && i.length === 0 && Q.complete();
      }
      return () => {
        i.forEach((s) => s.unsubscribe()), o.unsubscribe();
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
    const Q = getMethod(e, SymbolObservable);
    if (Q) {
      const i = Q.call(e);
      if (Object(i) !== i)
        throw new TypeError(i + " is not an object");
      return isObservable(i) && i.constructor === r ? i : new r((o) => i.subscribe(o));
    }
    if (hasSymbol("iterator")) {
      const i = getMethod(e, SymbolIterator);
      if (i)
        return new r((o) => {
          enqueue(() => {
            if (!o.closed) {
              for (const B of i.call(e))
                if (o.next(B), o.closed)
                  return;
              o.complete();
            }
          });
        });
    }
    if (Array.isArray(e))
      return new r((i) => {
        enqueue(() => {
          if (!i.closed) {
            for (const o of e)
              if (i.next(o), i.closed)
                return;
            i.complete();
          }
        });
      });
    throw new TypeError(e + " is not observable");
  }
  static of(...e) {
    const r = typeof this == "function" ? this : Observable;
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
  let r, Q = 0;
  return new Observable((i) => {
    r || (r = A.subscribe(e));
    const o = e.subscribe(i);
    return Q++, () => {
      Q--, o.unsubscribe(), Q === 0 && (unsubscribe(r), r = void 0);
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
  return [new Promise((o) => {
    A ? o(e) : r = o;
  }), (o) => {
    A = !0, e = o, r(e);
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
      const Q = this, i = Object.assign(Object.assign({}, r), {
        complete() {
          r.complete(), Q.onCompletion();
        },
        error(o) {
          r.error(o), Q.onError(o);
        },
        next(o) {
          r.next(o), Q.onNext(o);
        }
      });
      try {
        return this.initHasRun = !0, e(i);
      } catch (o) {
        i.error(o);
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
    const Q = e || returnInput, i = r || fail;
    let o = !1;
    return new Promise((B, s) => {
      const a = (n) => {
        if (!o) {
          o = !0;
          try {
            B(i(n));
          } catch (E) {
            s(E);
          }
        }
      }, w = (n) => {
        try {
          B(Q(n));
        } catch (E) {
          a(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: a }), this.state === "fulfilled")
        return B(Q(this.firstValue));
      if (this.state === "rejected")
        return o = !0, B(i(this.rejection));
      this.fulfillmentCallbacks.push(w), this.rejectionCallbacks.push(a);
    });
  }
  catch(e) {
    return this.then(void 0, e);
  }
  finally(e) {
    const r = e || doNothing;
    return this.then((Q) => (r(), Q), () => r());
  }
  static from(e) {
    return isThenable(e) ? new ObservablePromise((r) => {
      const Q = (o) => {
        r.next(o), r.complete();
      }, i = (o) => {
        r.error(o);
      };
      e.then(Q, i);
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
    let Q;
    const i = ((o) => {
      if (debugMessages$1("Message from worker:", o.data), !(!o.data || o.data.uid !== e)) {
        if (isJobStartMessage(o.data))
          Q = o.data.resultType;
        else if (isJobResultMessage(o.data))
          Q === "promise" ? (typeof o.data.payload < "u" && r.next(deserialize(o.data.payload)), r.complete(), A.removeEventListener("message", i)) : (o.data.payload && r.next(deserialize(o.data.payload)), o.data.complete && (r.complete(), A.removeEventListener("message", i)));
        else if (isJobErrorMessage(o.data)) {
          const B = deserialize(o.data.error);
          r.error(B), A.removeEventListener("message", i);
        }
      }
    });
    return A.addEventListener("message", i), () => {
      if (Q === "observable" || !Q) {
        const o = {
          type: MasterMessageType.cancel,
          uid: e
        };
        A.postMessage(o);
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
  for (const Q of A)
    isTransferDescriptor(Q) ? (e.push(serialize(Q.send)), r.push(...Q.transferables)) : e.push(serialize(Q));
  return {
    args: e,
    transferables: r.length === 0 ? r : dedupe(r)
  };
}
function createProxyFunction(A, e) {
  return ((...r) => {
    const Q = nextJobUID++, { args: i, transferables: o } = prepareArguments(r), B = {
      type: MasterMessageType.run,
      uid: Q,
      method: e,
      args: i
    };
    debugMessages$1("Sending command to run function to worker:", B);
    try {
      A.postMessage(B, o);
    } catch (s) {
      return ObservablePromise.from(Promise.reject(s));
    }
    return ObservablePromise.from(multicast(createObservableForJob(A, Q)));
  });
}
function createProxyModule(A, e) {
  const r = {};
  for (const Q of e)
    r[Q] = createProxyFunction(A, Q);
  return r;
}
var __awaiter$2 = function(A, e, r, Q) {
  function i(o) {
    return o instanceof r ? o : new r(function(B) {
      B(o);
    });
  }
  return new (r || (r = Promise))(function(o, B) {
    function s(n) {
      try {
        w(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    w((Q = Q.apply(A, e || [])).next());
  });
};
const debugMessages = DebugLogger("threads:master:messages"), debugSpawn = DebugLogger("threads:master:spawn"), debugThreadUtils = DebugLogger("threads:master:thread-utils"), isInitMessage = (A) => A && A.type === "init", isUncaughtErrorMessage = (A) => A && A.type === "uncaughtError", initMessageTimeout = typeof process < "u" && process.env.THREADS_WORKER_INIT_TIMEOUT ? Number.parseInt(process.env.THREADS_WORKER_INIT_TIMEOUT, 10) : 1e4;
function withTimeout(A, e, r) {
  return __awaiter$2(this, void 0, void 0, function* () {
    let Q;
    const i = new Promise((B, s) => {
      Q = setTimeout(() => s(Error(r)), e);
    }), o = yield Promise.race([
      A,
      i
    ]);
    return clearTimeout(Q), o;
  });
}
function receiveInitMessage(A) {
  return new Promise((e, r) => {
    const Q = ((i) => {
      debugMessages("Message from worker before finishing initialization:", i.data), isInitMessage(i.data) ? (A.removeEventListener("message", Q), e(i.data)) : isUncaughtErrorMessage(i.data) && (A.removeEventListener("message", Q), r(deserialize(i.data.error)));
    });
    A.addEventListener("message", Q);
  });
}
function createEventObservable(A, e) {
  return new Observable((r) => {
    const Q = ((o) => {
      const B = {
        type: WorkerEventType.message,
        data: o.data
      };
      r.next(B);
    }), i = ((o) => {
      debugThreadUtils("Unhandled promise rejection event in thread:", o);
      const B = {
        type: WorkerEventType.internalError,
        error: Error(o.reason)
      };
      r.next(B);
    });
    A.addEventListener("message", Q), A.addEventListener("unhandledrejection", i), e.then(() => {
      const o = {
        type: WorkerEventType.termination
      };
      A.removeEventListener("message", Q), A.removeEventListener("unhandledrejection", i), r.next(o), r.complete();
    });
  });
}
function createTerminator(A) {
  const [e, r] = createPromiseWithResolver();
  return { terminate: () => __awaiter$2(this, void 0, void 0, function* () {
    debugThreadUtils("Terminating worker"), yield A.terminate(), r();
  }), termination: e };
}
function setPrivateThreadProps(A, e, r, Q) {
  const i = r.filter((o) => o.type === WorkerEventType.internalError).map((o) => o.error);
  return Object.assign(A, {
    [$errors]: i,
    [$events]: r,
    [$terminate]: Q,
    [$worker]: e
  });
}
function spawn(A, e) {
  return __awaiter$2(this, void 0, void 0, function* () {
    debugSpawn("Initializing new thread");
    const r = initMessageTimeout, i = (yield withTimeout(receiveInitMessage(A), r, `Timeout: Did not receive an init message from worker after ${r}ms. Make sure the worker calls expose().`)).exposed, { termination: o, terminate: B } = createTerminator(A), s = createEventObservable(A, o);
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
  }, Q = () => {
    self.removeEventListener("message", r);
  };
  return self.addEventListener("message", r), Q;
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
  return muxingHandlerSetUp || (self.addEventListener("message", ((Q) => {
    messageHandlers.forEach((i) => i(Q.data));
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
  const Q = (o) => {
    e(o);
  }, i = () => {
    assertMessagePort(r).off("message", Q);
  };
  return assertMessagePort(r).on("message", Q), i;
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
      this.value = e, this.match = function(Q, i) {
        return Q(r.value);
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
      this.error = e, this.match = function(Q, i) {
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
function __awaiter$1(A, e, r, Q) {
  function i(o) {
    return o instanceof r ? o : new r(function(B) {
      B(o);
    });
  }
  return new (r || (r = Promise))(function(o, B) {
    function s(n) {
      try {
        w(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    w((Q = Q.apply(A, [])).next());
  });
}
function __generator$1(A, e) {
  var r = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, Q, i, o, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (Q) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (Q = 1, i && (o = w[0] & 2 ? i.return : w[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, w[1])).done) return o;
      switch (i = 0, o && (w = [w[0] & 2, o.value]), w[0]) {
        case 0:
        case 1:
          o = w;
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
          if (o = r.trys, !(o = o.length > 0 && o[o.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!o || w[1] > o[0] && w[1] < o[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < o[1]) {
            r.label = o[1], o = w;
            break;
          }
          if (o && r.label < o[2]) {
            r.label = o[2], r.ops.push(w);
            break;
          }
          o[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], i = 0;
    } finally {
      Q = o = 0;
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
      var Q = e.then(function(o) {
        return new Ok$1(o);
      });
      if (r)
        Q = Q.catch(function(o) {
          return new Err$1(r(o));
        });
      else {
        var i = [
          "`fromPromise` called without a promise rejection handler",
          "Ensure that you are catching promise rejections yourself, or pass a second argument to `fromPromise` to convert a caught exception into an `Err` instance"
        ].join(" - ");
        logWarning(i);
      }
      return new A(Q);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(Q) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(o) {
            switch (o.label) {
              case 0:
                return Q.isErr() ? [2, new Err$1(Q.error)] : (i = Ok$1.bind, [4, e(Q.value)]);
              case 1:
                return [2, new (i.apply(Ok$1, [void 0, o.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(Q) {
        return __awaiter$1(r, void 0, void 0, function() {
          var i;
          return __generator$1(this, function(o) {
            switch (o.label) {
              case 0:
                return Q.isOk() ? [2, new Ok$1(Q.value)] : (i = Err$1.bind, [4, e(Q.error)]);
              case 1:
                return [2, new (i.apply(Err$1, [void 0, o.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.andThen = function(e) {
      return new A(this._promise.then(function(r) {
        if (r.isErr())
          return new Err$1(r.error);
        var Q = e(r.value);
        return Q instanceof A ? Q._promise : Q;
      }));
    }, A.prototype.match = function(e, r) {
      return this._promise.then(function(Q) {
        return Q.match(e, r);
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
  let Q = e;
  const i = {}, o = () => Q, B = (a) => {
    var w;
    a !== Q && (Q = a, (w = i.onSet) == null || w.call(i));
  };
  return { varId: A, get: o, set: B, reset: () => {
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
    return (r = this.points.find((Q) => Q.x === e)) == null ? void 0 : r.y;
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
  constructor(A, e, r, Q = 1) {
    this.varIds = A, this.startTime = e, this.endTime = r, this.saveFreq = Q, this.seriesLength = Math.round((r - e) / Q) + 1, this.varSeries = new Array(A.length);
    for (let i = 0; i < A.length; i++) {
      const o = new Array(this.seriesLength);
      for (let s = 0; s < this.seriesLength; s++)
        o[s] = { x: e + s * Q, y: 0 };
      const B = A[i];
      this.varSeries[i] = new Series(B, o);
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
  const Q = r.varIds.length, i = r.seriesLength;
  if (e < i || A.length < Q * i)
    return err$1("invalid-point-count");
  for (let o = 0; o < Q; o++) {
    const B = r.varSeries[o];
    let s = e * o;
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
  for (const Q of A) {
    r += 2;
    const i = ((e = Q.subscriptIndices) == null ? void 0 : e.length) || 0;
    r += i;
  }
  return r;
}
function encodeVarIndices(A, e) {
  let r = 0;
  e[r++] = A.length;
  for (const Q of A) {
    e[r++] = Q.varIndex;
    const i = Q.subscriptIndices, o = i?.length || 0;
    e[r++] = o;
    for (let B = 0; B < o; B++)
      e[r++] = i[B];
  }
}
function getEncodedLookupBufferLengths(A) {
  var e, r;
  let Q = 1, i = 0;
  for (const o of A) {
    const B = o.varRef.varSpec;
    if (B === void 0)
      throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");
    Q += 2;
    const s = ((e = B.subscriptIndices) == null ? void 0 : e.length) || 0;
    Q += s, Q += 2, i += ((r = o.points) == null ? void 0 : r.length) || 0;
  }
  return {
    lookupIndicesLength: Q,
    lookupsLength: i
  };
}
function encodeLookups(A, e, r) {
  let Q = 0;
  e[Q++] = A.length;
  let i = 0;
  for (const o of A) {
    const B = o.varRef.varSpec;
    e[Q++] = B.varIndex;
    const s = B.subscriptIndices, a = s?.length || 0;
    e[Q++] = a;
    for (let w = 0; w < a; w++)
      e[Q++] = s[w];
    o.points !== void 0 ? (e[Q++] = i, e[Q++] = o.points.length, r?.set(o.points, i), i += o.points.length) : (e[Q++] = -1, e[Q++] = 0);
  }
}
function decodeLookups(A, e) {
  const r = [];
  let Q = 0;
  const i = A[Q++];
  for (let o = 0; o < i; o++) {
    const B = A[Q++], s = A[Q++], a = s > 0 ? Array(s) : void 0;
    for (let f = 0; f < s; f++)
      a[f] = A[Q++];
    const w = A[Q++], n = A[Q++], E = {
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
      const o = i.id, B = [];
      for (let s = 0; s < i.subIds.length; s++)
        B.push({
          id: i.subIds[s],
          index: s
        });
      e.set(o, {
        id: o,
        subscripts: B
      });
    }
    function r(i) {
      const o = e.get(i);
      if (o === void 0)
        throw new Error(`No dimension info found for id=${i}`);
      return o;
    }
    const Q = /* @__PURE__ */ new Set();
    for (const i of A.variables) {
      const o = varIdWithoutSubscripts(i.id);
      if (!Q.has(o)) {
        const s = (i.dimIds || []).map(r);
        if (s.length > 0) {
          const a = [];
          for (const n of s)
            a.push(n.subscripts);
          const w = cartesianProductOf(a);
          for (const n of w) {
            const E = n.map((m) => m.id).join(","), l = n.map((m) => m.index), f = `${o}[${E}]`;
            this.varSpecs.set(f, {
              varIndex: i.index,
              subscriptIndices: l
            });
          }
        } else
          this.varSpecs.set(o, {
            varIndex: i.index
          });
        Q.add(o);
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
      const o = this.varSpecs.get(i);
      o !== void 0 ? r.push(o) : console.warn(`WARNING: No output var spec found for id=${i}`);
    }
    const Q = new Outputs(e, A.startTime, A.endTime, A.saveFreq);
    return Q.varSpecs = r, Q;
  }
};
function varIdWithoutSubscripts(A) {
  const e = A.indexOf("[");
  return e >= 0 ? A.substring(0, e) : A;
}
function cartesianProductOf(A) {
  return A.reduce(
    (e, r) => e.map((Q) => r.map((i) => Q.concat([i]))).reduce((Q, i) => Q.concat(i), []),
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
    const Q = e[2].split(",").map((i) => sdeVarIdForVensimName(i));
    r += `[${Q.join(",")}]`;
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
      const Q = A?.getSpecForVarId(e.varId);
      if (Q)
        e.varSpec = Q;
      else
        throw new Error(`Failed to resolve ${r} variable reference for varId=${e.varId}`);
    } else {
      const Q = A?.getSpecForVarName(e.varName);
      if (Q)
        e.varSpec = Q;
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
    const Q = A.length, i = e.varIds.length * e.seriesLength;
    let o;
    const B = e.varSpecs;
    B !== void 0 && B.length > 0 ? o = getEncodedVarIndicesLength(B) : o = 0;
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
      const P = w, H = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, j = Math.round(h * H), L = Math.ceil(j / 8) * 8;
      return w += L, P;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", Q), m = n("float64", i), I = n("int32", o), g = n("float64", s), C = n("int32", a), t = w;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const D = this.header.view;
    let c = 0;
    D[c++] = l, D[c++] = extrasLengthInElements, D[c++] = f, D[c++] = Q, D[c++] = m, D[c++] = i, D[c++] = I, D[c++] = o, D[c++] = g, D[c++] = s, D[c++] = C, D[c++] = a, this.inputs.update(this.encoded, f, Q), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, i), this.outputIndices.update(this.encoded, I, o), this.lookups.update(this.encoded, g, s), this.lookupIndices.update(this.encoded, C, a);
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
    const Q = this.header.view;
    let i = 0;
    const o = Q[i++], B = Q[i++], s = Q[i++], a = Q[i++], w = Q[i++], n = Q[i++], E = Q[i++], l = Q[i++], f = Q[i++], m = Q[i++], I = Q[i++], g = Q[i++], C = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, D = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, M = g * Int32Array.BYTES_PER_ELEMENT, h = e + C + t + D + c + d + M;
    if (A.byteLength < h)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, o, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, w, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, m), this.lookupIndices.update(this.encoded, I, g);
  }
};
async function spawnAsyncModelRunner(A) {
  return A.path ? spawnAsyncModelRunnerWithWorker(new Worker$1(A.path)) : spawnAsyncModelRunnerWithWorker(BlobWorker.fromText(A.source));
}
async function spawnAsyncModelRunnerWithWorker(A) {
  const e = await spawn(A), r = await e.initModel(), Q = r.modelListing ? new ModelListing(r.modelListing) : void 0, i = new BufferedRunModelParams(Q);
  let o = !1, B = !1;
  return {
    createOutputs: () => new Outputs(r.outputVarIds, r.startTime, r.endTime, r.saveFreq),
    runModel: async (s, a, w) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (o)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      o = !0, i.updateFromParams(s, a, w);
      let n;
      try {
        n = await e.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        o = !1;
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
    class Q extends e {
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
    A._Code = Q, A.nil = new Q("");
    function i(C, ...t) {
      const D = [C[0]];
      let c = 0;
      for (; c < t.length; )
        s(D, t[c]), D.push(C[++c]);
      return new Q(D);
    }
    A._ = i;
    const o = new Q("+");
    function B(C, ...t) {
      const D = [f(C[0])];
      let c = 0;
      for (; c < t.length; )
        D.push(o), s(D, t[c]), D.push(o, f(C[++c]));
      return a(D), new Q(D);
    }
    A.str = B;
    function s(C, t) {
      t instanceof Q ? C.push(...t._items) : t instanceof r ? C.push(t) : C.push(E(t));
    }
    A.addCodeArg = s;
    function a(C) {
      let t = 1;
      for (; t < C.length - 1; ) {
        if (C[t] === o) {
          const D = w(C[t - 1], C[t + 1]);
          if (D !== void 0) {
            C.splice(t - 1, 3, D);
            continue;
          }
          C[t++] = "+";
        }
        t++;
      }
    }
    function w(C, t) {
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
      return new Q(f(C));
    }
    A.stringify = l;
    function f(C) {
      return JSON.stringify(C).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    A.safeStringify = f;
    function m(C) {
      return typeof C == "string" && A.IDENTIFIER.test(C) ? new Q(`.${C}`) : i`[${C}]`;
    }
    A.getProperty = m;
    function I(C) {
      if (typeof C == "string" && A.IDENTIFIER.test(C))
        return new Q(`${C}`);
      throw new Error(`CodeGen: invalid export name: ${C}, use explicit $id name mapping`);
    }
    A.getEsmExportName = I;
    function g(C) {
      return new Q(C.toString());
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
    var Q;
    (function(a) {
      a[a.Started = 0] = "Started", a[a.Completed = 1] = "Completed";
    })(Q || (A.UsedValueState = Q = {})), A.varKinds = {
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
    class o extends e.Name {
      constructor(w, n) {
        super(n), this.prefix = w;
      }
      setValue(w, { property: n, itemIndex: E }) {
        this.value = w, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = o;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(w) {
        super(w), this._values = {}, this._scope = w.scope, this.opts = { ...w, _n: w.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(w) {
        return new o(w, this._newName(w));
      }
      value(w, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(w), { prefix: f } = l, m = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let I = this._values[f];
        if (I) {
          const t = I.get(m);
          if (t)
            return t;
        } else
          I = this._values[f] = /* @__PURE__ */ new Map();
        I.set(m, l);
        const g = this._scope[f] || (this._scope[f] = []), C = g.length;
        return g[C] = n.ref, l.setValue(n, { property: f, itemIndex: C }), l;
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
          const I = w[m];
          if (!I)
            continue;
          const g = E[m] = E[m] || /* @__PURE__ */ new Map();
          I.forEach((C) => {
            if (g.has(C))
              return;
            g.set(C, Q.Started);
            let t = n(C);
            if (t) {
              const D = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${D} ${C} = ${t};${this.opts._n}`;
            } else if (t = l?.(C))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(C);
            g.set(C, Q.Completed);
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
    var Q = requireCode$1();
    Object.defineProperty(A, "_", { enumerable: !0, get: function() {
      return Q._;
    } }), Object.defineProperty(A, "str", { enumerable: !0, get: function() {
      return Q.str;
    } }), Object.defineProperty(A, "strConcat", { enumerable: !0, get: function() {
      return Q.strConcat;
    } }), Object.defineProperty(A, "nil", { enumerable: !0, get: function() {
      return Q.nil;
    } }), Object.defineProperty(A, "getProperty", { enumerable: !0, get: function() {
      return Q.getProperty;
    } }), Object.defineProperty(A, "stringify", { enumerable: !0, get: function() {
      return Q.stringify;
    } }), Object.defineProperty(A, "regexpCode", { enumerable: !0, get: function() {
      return Q.regexpCode;
    } }), Object.defineProperty(A, "Name", { enumerable: !0, get: function() {
      return Q.Name;
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
    class o {
      optimizeNodes() {
        return this;
      }
      optimizeNames(u, K) {
        return this;
      }
    }
    class B extends o {
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
    class s extends o {
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
    class w extends o {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `${this.label}:` + u;
      }
    }
    class n extends o {
      constructor(u) {
        super(), this.label = u, this.names = {};
      }
      render({ _n: u }) {
        return `break${this.label ? ` ${this.label}` : ""};` + u;
      }
    }
    class E extends o {
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
    class l extends o {
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
    class f extends o {
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
          const b = y[F];
          b.optimizeNames(u, K) || (T(u, b.names), y.splice(F, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, K) => S(u, K.names), {});
      }
    }
    class m extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class I extends f {
    }
    class g extends m {
    }
    g.kind = "else";
    class C extends m {
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
        const K = u.es5 ? r.varKinds.var : this.varKind, { name: y, from: F, to: b } = this;
        return `for(${K} ${y}=${F}; ${y}<${b}; ${y}++)` + super.render(u);
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
    class P extends m {
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
    class H extends m {
      constructor(u) {
        super(), this.error = u;
      }
      render(u) {
        return `catch(${this.error})` + super.render(u);
      }
    }
    H.kind = "catch";
    class j extends m {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    j.kind = "finally";
    class L {
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
        const b = this._scope.toName(K);
        return y !== void 0 && F && (this._constants[b.str] = y), this._leafNode(new B(u, b, y)), b;
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
        return this._for(new D(u), K);
      }
      // `for` statement for a range of values
      forRange(u, K, y, F, b = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(b, J, K, y), () => F(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, K, y, F = r.varKinds.const) {
        const b = this._scope.toName(u);
        if (this.opts.es5) {
          const J = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(b, (0, e._)`${J}[${Z}]`), y(b);
          });
        }
        return this._for(new d("of", F, b, K), () => y(b));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, K, y, F = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${K})`, y);
        const b = this._scope.toName(u);
        return this._for(new d("in", F, b, K), () => y(b));
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
        const F = new P();
        if (this._blockNode(F), this.code(u), K) {
          const b = this.name("e");
          this._currNode = F.catch = new H(b), K(b);
        }
        return y && (this._currNode = F.finally = new j(), this.code(y)), this._endBlockNode(H, j);
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
    A.CodeGen = L;
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
      return new e._Code(N._items.reduce((b, J) => (J instanceof e.Name && (J = y(J)), J instanceof e._Code ? b.push(...J._items) : b.push(J), b), []));
      function y(b) {
        const J = K[b.str];
        return J === void 0 || u[b.str] !== 1 ? b : (delete u[b.str], J);
      }
      function F(b) {
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
    const QA = G(A.operators.AND);
    function x(...N) {
      return N.reduce(QA);
    }
    A.and = x;
    const oA = G(A.operators.OR);
    function v(...N) {
      return N.reduce(oA);
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
  function Q(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (i(d, M), !o(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = Q;
  function i(d, M = d.schema) {
    const { opts: h, self: P } = d;
    if (!h.strictSchema || typeof M == "boolean")
      return;
    const H = P.RULES.keywords;
    for (const j in M)
      H[j] || c(d, `unknown keyword: "${j}"`);
  }
  util.checkUnknownRules = i;
  function o(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (M[h])
        return !0;
    return !1;
  }
  util.schemaHasRules = o;
  function B(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const h in d)
      if (h !== "$ref" && M.all[h])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: M }, h, P, H) {
    if (!H) {
      if (typeof h == "number" || typeof h == "boolean")
        return h;
      if (typeof h == "string")
        return (0, A._)`${h}`;
    }
    return (0, A._)`${d}${M}${(0, A.getProperty)(P)}`;
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
  function f({ mergeNames: d, mergeToName: M, mergeValues: h, resultToName: P }) {
    return (H, j, L, S) => {
      const U = L === void 0 ? j : L instanceof A.Name ? (j instanceof A.Name ? d(H, j, L) : M(H, j, L), L) : j instanceof A.Name ? (M(H, L, j), j) : h(j, L);
      return S === A.Name && !(U instanceof A.Name) ? P(H, U) : U;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, h) => d.if((0, A._)`${h} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(h, !0), () => d.assign(h, (0, A._)`${h} || {}`).code((0, A._)`Object.assign(${h}, ${M})`));
      }),
      mergeToName: (d, M, h) => d.if((0, A._)`${h} !== true`, () => {
        M === !0 ? d.assign(h, !0) : (d.assign(h, (0, A._)`${h} || {}`), I(d, h, M));
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
    return M !== void 0 && I(d, h, M), h;
  }
  util.evaluatedPropsToName = m;
  function I(d, M, h) {
    Object.keys(h).forEach((P) => d.assign((0, A._)`${M}${(0, A.getProperty)(P)}`, !0));
  }
  util.setEvaluated = I;
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
  function D(d, M, h) {
    if (d instanceof A.Name) {
      const P = M === t.Num;
      return h ? P ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : P ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return h ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = D;
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
    const e = requireCodegen(), r = requireUtil(), Q = requireNames();
    A.keywordError = {
      message: ({ keyword: g }) => (0, e.str)`must pass "${g}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: g, schemaType: C }) => C ? (0, e.str)`"${g}" keyword must be ${C} ($data)` : (0, e.str)`"${g}" keyword is invalid ($data)`
    };
    function i(g, C = A.keywordError, t, D) {
      const { it: c } = g, { gen: d, compositeRule: M, allErrors: h } = c, P = E(g, C, t);
      D ?? (M || h) ? a(d, P) : w(c, (0, e._)`[${P}]`);
    }
    A.reportError = i;
    function o(g, C = A.keywordError, t) {
      const { it: D } = g, { gen: c, compositeRule: d, allErrors: M } = D, h = E(g, C, t);
      a(c, h), d || M || w(D, Q.default.vErrors);
    }
    A.reportExtraError = o;
    function B(g, C) {
      g.assign(Q.default.errors, C), g.if((0, e._)`${Q.default.vErrors} !== null`, () => g.if(C, () => g.assign((0, e._)`${Q.default.vErrors}.length`, C), () => g.assign(Q.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: g, keyword: C, schemaValue: t, data: D, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = g.name("err");
      g.forRange("i", c, Q.default.errors, (h) => {
        g.const(M, (0, e._)`${Q.default.vErrors}[${h}]`), g.if((0, e._)`${M}.instancePath === undefined`, () => g.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(Q.default.instancePath, d.errorPath))), g.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${C}`), d.opts.verbose && (g.assign((0, e._)`${M}.schema`, t), g.assign((0, e._)`${M}.data`, D));
      });
    }
    A.extendErrors = s;
    function a(g, C) {
      const t = g.const("err", C);
      g.if((0, e._)`${Q.default.vErrors} === null`, () => g.assign(Q.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${Q.default.vErrors}.push(${t})`), g.code((0, e._)`${Q.default.errors}++`);
    }
    function w(g, C) {
      const { gen: t, validateName: D, schemaEnv: c } = g;
      c.$async ? t.throw((0, e._)`new ${g.ValidationError}(${C})`) : (t.assign((0, e._)`${D}.errors`, C), t.return(!1));
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
      const { createErrors: D } = g.it;
      return D === !1 ? (0, e._)`{}` : l(g, C, t);
    }
    function l(g, C, t = {}) {
      const { gen: D, it: c } = g, d = [
        f(c, t),
        m(g, t)
      ];
      return I(g, C, d), D.object(...d);
    }
    function f({ errorPath: g }, { instancePath: C }) {
      const t = C ? (0, e.str)`${g}${(0, r.getErrorPath)(C, r.Type.Str)}` : g;
      return [Q.default.instancePath, (0, e.strConcat)(Q.default.instancePath, t)];
    }
    function m({ keyword: g, it: { errSchemaPath: C } }, { schemaPath: t, parentSchema: D }) {
      let c = D ? C : (0, e.str)`${C}/${g}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function I(g, { params: C, message: t }, D) {
      const { keyword: c, data: d, schemaValue: M, it: h } = g, { opts: P, propertyName: H, topSchemaRef: j, schemaPath: L } = h;
      D.push([n.keyword, c], [n.params, typeof C == "function" ? C(g) : C || (0, e._)`{}`]), P.messages && D.push([n.message, typeof t == "function" ? t(g) : t]), P.verbose && D.push([n.schema, M], [n.parentSchema, (0, e._)`${j}${L}`], [Q.default.data, d]), H && D.push([n.propertyName, H]);
    }
  })(errors)), errors;
}
var hasRequiredBoolSchema;
function requireBoolSchema() {
  if (hasRequiredBoolSchema) return boolSchema;
  hasRequiredBoolSchema = 1, Object.defineProperty(boolSchema, "__esModule", { value: !0 }), boolSchema.boolOrEmptySchema = boolSchema.topBoolOrEmptySchema = void 0;
  const A = requireErrors(), e = requireCodegen(), r = requireNames(), Q = {
    message: "boolean schema is false"
  };
  function i(s) {
    const { gen: a, schema: w, validateName: n } = s;
    w === !1 ? B(s, !1) : typeof w == "object" && w.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function o(s, a) {
    const { gen: w, schema: n } = s;
    n === !1 ? (w.var(a, !1), B(s)) : w.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = o;
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
    (0, A.reportError)(E, Q, void 0, a);
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
  function Q() {
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
  return rules.getRules = Q, rules;
}
var applicability = {}, hasRequiredApplicability;
function requireApplicability() {
  if (hasRequiredApplicability) return applicability;
  hasRequiredApplicability = 1, Object.defineProperty(applicability, "__esModule", { value: !0 }), applicability.shouldUseRule = applicability.shouldUseGroup = applicability.schemaHasRulesForType = void 0;
  function A({ schema: Q, self: i }, o) {
    const B = i.RULES.types[o];
    return B && B !== !0 && e(Q, B);
  }
  applicability.schemaHasRulesForType = A;
  function e(Q, i) {
    return i.rules.some((o) => r(Q, o));
  }
  applicability.shouldUseGroup = e;
  function r(Q, i) {
    var o;
    return Q[i.keyword] !== void 0 || ((o = i.definition.implements) === null || o === void 0 ? void 0 : o.some((B) => Q[B] !== void 0));
  }
  return applicability.shouldUseRule = r, applicability;
}
var hasRequiredDataType;
function requireDataType() {
  if (hasRequiredDataType) return dataType;
  hasRequiredDataType = 1, Object.defineProperty(dataType, "__esModule", { value: !0 }), dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
  const A = requireRules(), e = requireApplicability(), r = requireErrors(), Q = requireCodegen(), i = requireUtil();
  var o;
  (function(t) {
    t[t.Correct = 0] = "Correct", t[t.Wrong = 1] = "Wrong";
  })(o || (dataType.DataType = o = {}));
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
    const { gen: c, data: d, opts: M } = t, h = n(D, M.coerceTypes), P = D.length > 0 && !(h.length === 0 && D.length === 1 && (0, e.schemaHasRulesForType)(t, D[0]));
    if (P) {
      const H = m(D, d, M.strictNumbers, o.Wrong);
      c.if(H, () => {
        h.length ? E(t, D, h) : g(t);
      });
    }
    return P;
  }
  dataType.coerceAndCheckDataType = a;
  const w = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, D) {
    return D ? t.filter((c) => w.has(c) || D === "array" && c === "array") : [];
  }
  function E(t, D, c) {
    const { gen: d, data: M, opts: h } = t, P = d.let("dataType", (0, Q._)`typeof ${M}`), H = d.let("coerced", (0, Q._)`undefined`);
    h.coerceTypes === "array" && d.if((0, Q._)`${P} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, Q._)`${M}[0]`).assign(P, (0, Q._)`typeof ${M}`).if(m(D, M, h.strictNumbers), () => d.assign(H, M))), d.if((0, Q._)`${H} !== undefined`);
    for (const L of c)
      (w.has(L) || L === "array" && h.coerceTypes === "array") && j(L);
    d.else(), g(t), d.endIf(), d.if((0, Q._)`${H} !== undefined`, () => {
      d.assign(M, H), l(t, H);
    });
    function j(L) {
      switch (L) {
        case "string":
          d.elseIf((0, Q._)`${P} == "number" || ${P} == "boolean"`).assign(H, (0, Q._)`"" + ${M}`).elseIf((0, Q._)`${M} === null`).assign(H, (0, Q._)`""`);
          return;
        case "number":
          d.elseIf((0, Q._)`${P} == "boolean" || ${M} === null
              || (${P} == "string" && ${M} && ${M} == +${M})`).assign(H, (0, Q._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, Q._)`${P} === "boolean" || ${M} === null
              || (${P} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(H, (0, Q._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, Q._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(H, !1).elseIf((0, Q._)`${M} === "true" || ${M} === 1`).assign(H, !0);
          return;
        case "null":
          d.elseIf((0, Q._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(H, null);
          return;
        case "array":
          d.elseIf((0, Q._)`${P} === "string" || ${P} === "number"
              || ${P} === "boolean" || ${M} === null`).assign(H, (0, Q._)`[${M}]`);
      }
    }
  }
  function l({ gen: t, parentData: D, parentDataProperty: c }, d) {
    t.if((0, Q._)`${D} !== undefined`, () => t.assign((0, Q._)`${D}[${c}]`, d));
  }
  function f(t, D, c, d = o.Correct) {
    const M = d === o.Correct ? Q.operators.EQ : Q.operators.NEQ;
    let h;
    switch (t) {
      case "null":
        return (0, Q._)`${D} ${M} null`;
      case "array":
        h = (0, Q._)`Array.isArray(${D})`;
        break;
      case "object":
        h = (0, Q._)`${D} && typeof ${D} == "object" && !Array.isArray(${D})`;
        break;
      case "integer":
        h = P((0, Q._)`!(${D} % 1) && !isNaN(${D})`);
        break;
      case "number":
        h = P();
        break;
      default:
        return (0, Q._)`typeof ${D} ${M} ${t}`;
    }
    return d === o.Correct ? h : (0, Q.not)(h);
    function P(H = Q.nil) {
      return (0, Q.and)((0, Q._)`typeof ${D} == "number"`, H, c ? (0, Q._)`isFinite(${D})` : Q.nil);
    }
  }
  dataType.checkDataType = f;
  function m(t, D, c, d) {
    if (t.length === 1)
      return f(t[0], D, c, d);
    let M;
    const h = (0, i.toHash)(t);
    if (h.array && h.object) {
      const P = (0, Q._)`typeof ${D} != "object"`;
      M = h.null ? P : (0, Q._)`!${D} || ${P}`, delete h.null, delete h.array, delete h.object;
    } else
      M = Q.nil;
    h.number && delete h.integer;
    for (const P in h)
      M = (0, Q.and)(M, f(P, D, c, d));
    return M;
  }
  dataType.checkDataTypes = m;
  const I = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: D }) => typeof t == "string" ? (0, Q._)`{type: ${t}}` : (0, Q._)`{type: ${D}}`
  };
  function g(t) {
    const D = C(t);
    (0, r.reportError)(D, I);
  }
  dataType.reportTypeError = g;
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
  function r(i, o) {
    const { properties: B, items: s } = i.schema;
    if (o === "object" && B)
      for (const a in B)
        Q(i, a, B[a].default);
    else o === "array" && Array.isArray(s) && s.forEach((a, w) => Q(i, w, a.default));
  }
  defaults.assignDefaults = r;
  function Q(i, o, B) {
    const { gen: s, compositeRule: a, data: w, opts: n } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${w}${(0, A.getProperty)(o)}`;
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
  const A = requireCodegen(), e = requireUtil(), r = requireNames(), Q = requireUtil();
  function i(t, D) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, D, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${D}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function o({ gen: t, data: D, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((h) => (0, A.and)(n(t, D, h, c.ownProperties), (0, A._)`${M} = ${h}`)));
  }
  code.checkMissingProp = o;
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
  function w(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, D, c)}` : M;
  }
  code.propertyInData = w;
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
  function f({ schemaCode: t, data: D, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: h }, it: P }, H, j, L) {
    const S = L ? (0, A._)`${t}, ${D}, ${d}${M}` : D, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, h)],
      [r.default.parentData, P.parentData],
      [r.default.parentDataProperty, P.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    P.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...U)}`;
    return j !== A.nil ? (0, A._)`${H}.call(${j}, ${Y})` : (0, A._)`${H}(${Y})`;
  }
  code.callValidateCode = f;
  const m = (0, A._)`new RegExp`;
  function I({ gen: t, it: { opts: D } }, c) {
    const d = D.unicodeRegExp ? "u" : "", { regExp: M } = D.code, h = M(c, d);
    return t.scopeValue("pattern", {
      key: h.toString(),
      ref: h,
      code: (0, A._)`${M.code === "new RegExp" ? m : (0, Q.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = I;
  function g(t) {
    const { gen: D, data: c, keyword: d, it: M } = t, h = D.name("valid");
    if (M.allErrors) {
      const H = D.let("valid", !0);
      return P(() => D.assign(H, !1)), H;
    }
    return D.var(h, !0), P(() => D.break()), h;
    function P(H) {
      const j = D.const("len", (0, A._)`${c}.length`);
      D.forRange("i", 0, j, (L) => {
        t.subschema({
          keyword: d,
          dataProp: L,
          dataPropType: e.Type.Num
        }, h), D.if((0, A.not)(h), H);
      });
    }
  }
  code.validateArray = g;
  function C(t) {
    const { gen: D, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((j) => (0, e.alwaysValidSchema)(M, j)) && !M.opts.unevaluated)
      return;
    const P = D.let("valid", !1), H = D.name("_valid");
    D.block(() => c.forEach((j, L) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: L,
        compositeRule: !0
      }, H);
      D.assign(P, (0, A._)`${P} || ${H}`), t.mergeValidEvaluated(S, H) || D.if((0, A.not)(P));
    })), t.result(P, () => t.reset(), () => t.error(!0));
  }
  return code.validateUnion = C, code;
}
var hasRequiredKeyword;
function requireKeyword() {
  if (hasRequiredKeyword) return keyword;
  hasRequiredKeyword = 1, Object.defineProperty(keyword, "__esModule", { value: !0 }), keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
  const A = requireCodegen(), e = requireNames(), r = requireCode(), Q = requireErrors();
  function i(l, f) {
    const { gen: m, keyword: I, schema: g, parentSchema: C, it: t } = l, D = f.macro.call(t.self, g, C, t), c = w(m, I, D);
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
  function o(l, f) {
    var m;
    const { gen: I, keyword: g, schema: C, parentSchema: t, $data: D, it: c } = l;
    a(c, f);
    const d = !D && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = w(I, g, d), h = I.let("valid");
    l.block$data(h, P), l.ok((m = f.valid) !== null && m !== void 0 ? m : h);
    function P() {
      if (f.errors === !1)
        L(), f.modifying && B(l), S(() => l.error());
      else {
        const U = f.async ? H() : j();
        f.modifying && B(l), S(() => s(l, U));
      }
    }
    function H() {
      const U = I.let("ruleErrs", null);
      return I.try(() => L((0, A._)`await `), (Y) => I.assign(h, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => I.assign(U, (0, A._)`${Y}.errors`), () => I.throw(Y))), U;
    }
    function j() {
      const U = (0, A._)`${M}.errors`;
      return I.assign(U, null), L(A.nil), U;
    }
    function L(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, T = !("compile" in f && !D || f.schema === !1);
      I.assign(h, (0, A._)`${U}${(0, r.callValidateCode)(l, M, Y, T)}`, f.modifying);
    }
    function S(U) {
      var Y;
      I.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : h), U);
    }
  }
  keyword.funcKeywordCode = o;
  function B(l) {
    const { gen: f, data: m, it: I } = l;
    f.if(I.parentData, () => f.assign(m, (0, A._)`${I.parentData}[${I.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: m } = l;
    m.if((0, A._)`Array.isArray(${f})`, () => {
      m.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, Q.extendErrors)(l);
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
    return !f.length || f.some((I) => I === "array" ? Array.isArray(l) : I === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == I || m && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: m, errSchemaPath: I }, g, C) {
    if (Array.isArray(g.keyword) ? !g.keyword.includes(C) : g.keyword !== C)
      throw new Error("ajv implementation error");
    const t = g.dependencies;
    if (t?.some((D) => !Object.prototype.hasOwnProperty.call(l, D)))
      throw new Error(`parent schema must have dependencies of ${C}: ${t.join(",")}`);
    if (g.validateSchema && !g.validateSchema(l[C])) {
      const c = `keyword "${C}" value is invalid at path "${I}": ` + m.errorsText(g.validateSchema.errors);
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
  function r(o, { keyword: B, schemaProp: s, schema: a, schemaPath: w, errSchemaPath: n, topSchemaRef: E }) {
    if (B !== void 0 && a !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (B !== void 0) {
      const l = o.schema[B];
      return s === void 0 ? {
        schema: l,
        schemaPath: (0, A._)`${o.schemaPath}${(0, A.getProperty)(B)}`,
        errSchemaPath: `${o.errSchemaPath}/${B}`
      } : {
        schema: l[s],
        schemaPath: (0, A._)`${o.schemaPath}${(0, A.getProperty)(B)}${(0, A.getProperty)(s)}`,
        errSchemaPath: `${o.errSchemaPath}/${B}/${(0, e.escapeFragment)(s)}`
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
  function Q(o, B, { dataProp: s, dataPropType: a, data: w, dataTypes: n, propertyName: E }) {
    if (w !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: m, dataPathArr: I, opts: g } = B, C = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(C), o.errorPath = (0, A.str)`${m}${(0, e.getErrorPath)(s, a, g.jsPropertySyntax)}`, o.parentDataProperty = (0, A._)`${s}`, o.dataPathArr = [...I, o.parentDataProperty];
    }
    if (w !== void 0) {
      const m = w instanceof A.Name ? w : l.let("data", w, !0);
      f(m), E !== void 0 && (o.propertyName = E);
    }
    n && (o.dataTypes = n);
    function f(m) {
      o.data = m, o.dataLevel = B.dataLevel + 1, o.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), o.parentData = B.data, o.dataNames = [...B.dataNames, m];
    }
  }
  subschema.extendSubschemaData = Q;
  function i(o, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: w, allErrors: n }) {
    a !== void 0 && (o.compositeRule = a), w !== void 0 && (o.createErrors = w), n !== void 0 && (o.allErrors = n), o.jtdDiscriminator = B, o.jtdMetadata = s;
  }
  return subschema.extendSubschemaMode = i, subschema;
}
var resolve = {}, fastDeepEqual, hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  return hasRequiredFastDeepEqual || (hasRequiredFastDeepEqual = 1, fastDeepEqual = function A(e, r) {
    if (e === r) return !0;
    if (e && r && typeof e == "object" && typeof r == "object") {
      if (e.constructor !== r.constructor) return !1;
      var Q, i, o;
      if (Array.isArray(e)) {
        if (Q = e.length, Q != r.length) return !1;
        for (i = Q; i-- !== 0; )
          if (!A(e[i], r[i])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === r.source && e.flags === r.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === r.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === r.toString();
      if (o = Object.keys(e), Q = o.length, Q !== Object.keys(r).length) return !1;
      for (i = Q; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(r, o[i])) return !1;
      for (i = Q; i-- !== 0; ) {
        var B = o[i];
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
  var A = jsonSchemaTraverse.exports = function(Q, i, o) {
    typeof i == "function" && (o = i, i = {}), o = i.cb || o;
    var B = typeof o == "function" ? o : o.pre || function() {
    }, s = o.post || function() {
    };
    e(i, B, s, Q, "", Q);
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
  function e(Q, i, o, B, s, a, w, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, a, w, n, E, l);
      for (var f in B) {
        var m = B[f];
        if (Array.isArray(m)) {
          if (f in A.arrayKeywords)
            for (var I = 0; I < m.length; I++)
              e(Q, i, o, m[I], s + "/" + f + "/" + I, a, s, f, B, I);
        } else if (f in A.propsKeywords) {
          if (m && typeof m == "object")
            for (var g in m)
              e(Q, i, o, m[g], s + "/" + f + "/" + r(g), a, s, f, B, g);
        } else (f in A.keywords || Q.allKeys && !(f in A.skipKeywords)) && e(Q, i, o, m, s + "/" + f, a, s, f, B);
      }
      o(B, s, a, w, n, E, l);
    }
  }
  function r(Q) {
    return Q.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return jsonSchemaTraverse.exports;
}
var hasRequiredResolve;
function requireResolve() {
  if (hasRequiredResolve) return resolve;
  hasRequiredResolve = 1, Object.defineProperty(resolve, "__esModule", { value: !0 }), resolve.getSchemaRefs = resolve.resolveUrl = resolve.normalizeId = resolve._getFullPath = resolve.getFullPath = resolve.inlineRef = void 0;
  const A = requireUtil(), e = requireFastDeepEqual(), r = requireJsonSchemaTraverse(), Q = /* @__PURE__ */ new Set([
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
  function i(I, g = !0) {
    return typeof I == "boolean" ? !0 : g === !0 ? !B(I) : g ? s(I) <= g : !1;
  }
  resolve.inlineRef = i;
  const o = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(I) {
    for (const g in I) {
      if (o.has(g))
        return !0;
      const C = I[g];
      if (Array.isArray(C) && C.some(B) || typeof C == "object" && B(C))
        return !0;
    }
    return !1;
  }
  function s(I) {
    let g = 0;
    for (const C in I) {
      if (C === "$ref")
        return 1 / 0;
      if (g++, !Q.has(C) && (typeof I[C] == "object" && (0, A.eachItem)(I[C], (t) => g += s(t)), g === 1 / 0))
        return 1 / 0;
    }
    return g;
  }
  function a(I, g = "", C) {
    C !== !1 && (g = E(g));
    const t = I.parse(g);
    return w(I, t);
  }
  resolve.getFullPath = a;
  function w(I, g) {
    return I.serialize(g).split("#")[0] + "#";
  }
  resolve._getFullPath = w;
  const n = /#\/?$/;
  function E(I) {
    return I ? I.replace(n, "") : "";
  }
  resolve.normalizeId = E;
  function l(I, g, C) {
    return C = E(C), I.resolve(g, C);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function m(I, g) {
    if (typeof I == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, D = E(I[C] || g), c = { "": D }, d = a(t, D, !1), M = {}, h = /* @__PURE__ */ new Set();
    return r(I, { allKeys: !0 }, (j, L, S, U) => {
      if (U === void 0)
        return;
      const Y = d + L;
      let T = c[U];
      typeof j[C] == "string" && (T = rA.call(this, j[C])), QA.call(this, j.$anchor), QA.call(this, j.$dynamicAnchor), c[L] = T;
      function rA(x) {
        const oA = this.opts.uriResolver.resolve;
        if (x = E(T ? oA(T, x) : x), h.has(x))
          throw H(x);
        h.add(x);
        let v = this.refs[x];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? P(j, v.schema, x) : x !== E(Y) && (x[0] === "#" ? (P(j, M[x], x), M[x] = j) : this.refs[x] = Y), x;
      }
      function QA(x) {
        if (typeof x == "string") {
          if (!f.test(x))
            throw new Error(`invalid anchor "${x}"`);
          rA.call(this, `#${x}`);
        }
      }
    }), M;
    function P(j, L, S) {
      if (L !== void 0 && !e(j, L))
        throw H(S);
    }
    function H(j) {
      return new Error(`reference "${j}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = m, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), Q = requireDataType(), i = requireDefaults(), o = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), w = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (h(k), c(k))) {
      g(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: p, schema: O, schemaEnv: q, opts: z }, R) {
    z.code.es5 ? k.func(p, (0, s._)`${a.default.data}, ${a.default.valCxt}`, q.$async, () => {
      k.code((0, s._)`"use strict"; ${t(O, z)}`), I(k, z), k.code(R);
    }) : k.func(p, (0, s._)`${a.default.data}, ${m(z)}`, q.$async, () => k.code(t(O, z)).code(R));
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
  function g(k) {
    const { schema: p, opts: O, gen: q } = k;
    f(k, () => {
      O.$comment && p.$comment && U(k), j(k), q.let(a.default.vErrors, null), q.let(a.default.errors, 0), O.unevaluated && C(k), P(k), Y(k);
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
    if (d(k) && (h(k), c(k))) {
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
    const { schema: O, gen: q, opts: z } = k;
    z.$comment && O.$comment && U(k), L(k), S(k);
    const R = q.const("_errs", a.default.errors);
    P(k, R), q.var(p, (0, s._)`${R} === ${a.default.errors}`);
  }
  function h(k) {
    (0, n.checkUnknownRules)(k), H(k);
  }
  function P(k, p) {
    if (k.opts.jtd)
      return rA(k, [], !1, p);
    const O = (0, e.getSchemaTypes)(k.schema), q = (0, e.coerceAndCheckDataType)(k, O);
    rA(k, O, !q, p);
  }
  function H(k) {
    const { schema: p, errSchemaPath: O, opts: q, self: z } = k;
    p.$ref && q.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(p, z.RULES) && z.logger.warn(`$ref: keywords ignored in schema at path "${O}"`);
  }
  function j(k) {
    const { schema: p, opts: O } = k;
    p.default !== void 0 && O.useDefaults && O.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function L(k) {
    const p = k.schema[k.opts.schemaId];
    p && (k.baseId = (0, w.resolveUrl)(k.opts.uriResolver, k.baseId, p));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: p, schema: O, errSchemaPath: q, opts: z }) {
    const R = O.$comment;
    if (z.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof z.$comment == "function") {
      const V = (0, s.str)`${q}/$comment`, eA = k.scopeValue("root", { ref: p.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${V}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: p, schemaEnv: O, validateName: q, ValidationError: z, opts: R } = k;
    O.$async ? p.if((0, s._)`${a.default.errors} === 0`, () => p.return(a.default.data), () => p.throw((0, s._)`new ${z}(${a.default.vErrors})`)) : (p.assign((0, s._)`${q}.errors`, a.default.vErrors), R.unevaluated && T(k), p.return((0, s._)`${a.default.errors} === 0`));
  }
  function T({ gen: k, evaluated: p, props: O, items: q }) {
    O instanceof s.Name && k.assign((0, s._)`${p}.props`, O), q instanceof s.Name && k.assign((0, s._)`${p}.items`, q);
  }
  function rA(k, p, O, q) {
    const { gen: z, schema: R, data: V, allErrors: eA, opts: X, self: $ } = k, { RULES: W } = $;
    if (R.$ref && (X.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(R, W))) {
      z.block(() => F(k, "$ref", W.all.$ref.definition));
      return;
    }
    X.jtd || x(k, p), z.block(() => {
      for (const AA of W.rules)
        iA(AA);
      iA(W.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (z.if((0, Q.checkDataType)(AA.type, V, X.strictNumbers)), QA(k, AA), p.length === 1 && p[0] === AA.type && O && (z.else(), (0, Q.reportTypeError)(k)), z.endIf()) : QA(k, AA), eA || z.if((0, s._)`${a.default.errors} === ${q || 0}`));
    }
  }
  function QA(k, p) {
    const { gen: O, schema: q, opts: { useDefaults: z } } = k;
    z && (0, i.assignDefaults)(k, p.type), O.block(() => {
      for (const R of p.rules)
        (0, r.shouldUseRule)(q, R) && F(k, R.keyword, R.definition, p.type);
    });
  }
  function x(k, p) {
    k.schemaEnv.meta || !k.opts.strictTypes || (oA(k, p), k.opts.allowUnionTypes || v(k, p), G(k, k.dataTypes));
  }
  function oA(k, p) {
    if (p.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = p;
        return;
      }
      p.forEach((O) => {
        N(k.dataTypes, O) || K(k, `type "${O}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, p);
    }
  }
  function v(k, p) {
    p.length > 1 && !(p.length === 2 && p.includes("null")) && K(k, "use allowUnionTypes to allow union type keyword");
  }
  function G(k, p) {
    const O = k.self.RULES.all;
    for (const q in O) {
      const z = O[q];
      if (typeof z == "object" && (0, r.shouldUseRule)(k.schema, z)) {
        const { type: R } = z.definition;
        R.length && !R.some((V) => _(p, V)) && K(k, `missing type "${R.join(",")}" for keyword "${q}"`);
      }
    }
  }
  function _(k, p) {
    return k.includes(p) || p === "number" && k.includes("integer");
  }
  function N(k, p) {
    return k.includes(p) || p === "integer" && k.includes("number");
  }
  function u(k, p) {
    const O = [];
    for (const q of k.dataTypes)
      N(p, q) ? O.push(q) : p.includes("integer") && q === "number" && O.push("integer");
    k.dataTypes = O;
  }
  function K(k, p) {
    const O = k.schemaEnv.baseId + k.errSchemaPath;
    p += ` at "${O}" (strictTypes)`, (0, n.checkStrictMode)(k, p, k.opts.strictTypes);
  }
  class y {
    constructor(p, O, q) {
      if ((0, o.validateKeywordUsage)(p, O, q), this.gen = p.gen, this.allErrors = p.allErrors, this.keyword = q, this.data = p.data, this.schema = p.schema[q], this.$data = O.$data && p.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(p, this.schema, q, this.$data), this.schemaType = O.schemaType, this.parentSchema = p.schema, this.params = {}, this.it = p, this.def = O, this.$data)
        this.schemaCode = p.gen.const("vSchema", Z(this.$data, p));
      else if (this.schemaCode = this.schemaValue, !(0, o.validSchemaType)(this.schema, O.schemaType, O.allowUndefined))
        throw new Error(`${q} value must be ${JSON.stringify(O.schemaType)}`);
      ("code" in O ? O.trackErrors : O.errors !== !1) && (this.errsCount = p.gen.const("_errs", a.default.errors));
    }
    result(p, O, q) {
      this.failResult((0, s.not)(p), O, q);
    }
    failResult(p, O, q) {
      this.gen.if(p), q ? q() : this.error(), O ? (this.gen.else(), O(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
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
    error(p, O, q) {
      if (O) {
        this.setParams(O), this._error(p, q), this.setParams({});
        return;
      }
      this._error(p, q);
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
    block$data(p, O, q = s.nil) {
      this.gen.block(() => {
        this.check$data(p, q), O();
      });
    }
    check$data(p = s.nil, O = s.nil) {
      if (!this.$data)
        return;
      const { gen: q, schemaCode: z, schemaType: R, def: V } = this;
      q.if((0, s.or)((0, s._)`${z} === undefined`, O)), p !== s.nil && q.assign(p, !0), (R.length || V.validateSchema) && (q.elseIf(this.invalid$data()), this.$dataError(), p !== s.nil && q.assign(p, !1)), q.else();
    }
    invalid$data() {
      const { gen: p, schemaCode: O, schemaType: q, def: z, it: R } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (q.length) {
          if (!(O instanceof s.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(q) ? q : [q];
          return (0, s._)`${(0, Q.checkDataTypes)(X, O, R.opts.strictNumbers, Q.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (z.validateSchema) {
          const X = p.scopeValue("validate$data", { ref: z.validateSchema });
          return (0, s._)`!${X}(${O})`;
        }
        return s.nil;
      }
    }
    subschema(p, O) {
      const q = (0, B.getSubschema)(this.it, p);
      (0, B.extendSubschemaData)(q, this.it, p), (0, B.extendSubschemaMode)(q, p);
      const z = { ...this.it, ...q, items: void 0, props: void 0 };
      return D(z, O), z;
    }
    mergeEvaluated(p, O) {
      const { it: q, gen: z } = this;
      q.opts.unevaluated && (q.props !== !0 && p.props !== void 0 && (q.props = n.mergeEvaluated.props(z, p.props, q.props, O)), q.items !== !0 && p.items !== void 0 && (q.items = n.mergeEvaluated.items(z, p.items, q.items, O)));
    }
    mergeValidEvaluated(p, O) {
      const { it: q, gen: z } = this;
      if (q.opts.unevaluated && (q.props !== !0 || q.items !== !0))
        return z.if(O, () => this.mergeEvaluated(p, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function F(k, p, O, q) {
    const z = new y(k, O, p);
    "code" in O ? O.code(z, q) : z.$data && O.validate ? (0, o.funcKeywordCode)(z, O) : "macro" in O ? (0, o.macroKeywordCode)(z, O) : (O.compile || O.validate) && (0, o.funcKeywordCode)(z, O);
  }
  const b = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: p, dataNames: O, dataPathArr: q }) {
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
        if (W >= p)
          throw new Error(X("property/index", W));
        return q[p - W];
      }
      if (W > p)
        throw new Error(X("data", W));
      if (R = O[p - W], !z)
        return R;
    }
    let V = R;
    const eA = z.split("/");
    for (const $ of eA)
      $ && (R = (0, s._)`${R}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${R}`);
    return V;
    function X($, W) {
      return `Cannot access ${$} ${W} levels up, current level is ${p}`;
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
    constructor(Q, i, o, B) {
      super(B || `can't resolve reference ${o} from id ${i}`), this.missingRef = (0, A.resolveUrl)(Q, i, o), this.missingSchema = (0, A.normalizeId)((0, A.getFullPath)(Q, this.missingRef));
    }
  }
  return ref_error.default = e, ref_error;
}
var compile = {}, hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1, Object.defineProperty(compile, "__esModule", { value: !0 }), compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
  const A = requireCodegen(), e = requireValidation_error(), r = requireNames(), Q = requireResolve(), i = requireUtil(), o = requireValidate();
  class B {
    constructor(C) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let D;
      typeof C.schema == "object" && (D = C.schema), this.schema = C.schema, this.schemaId = C.schemaId, this.root = C.root || this, this.baseId = (t = C.baseId) !== null && t !== void 0 ? t : (0, Q.normalizeId)(D?.[C.schemaId || "$id"]), this.schemaPath = C.schemaPath, this.localRefs = C.localRefs, this.meta = C.meta, this.$async = D?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(g) {
    const C = n.call(this, g);
    if (C)
      return C;
    const t = (0, Q.getFullPath)(this.opts.uriResolver, g.root.baseId), { es5: D, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: D, lines: c, ownProperties: d });
    let h;
    g.$async && (h = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const P = M.scopeName("validate");
    g.validateName = P;
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
      topSchemaRef: M.scopeValue("schema", this.opts.code.source === !0 ? { ref: g.schema, code: (0, A.stringify)(g.schema) } : { ref: g.schema }),
      validateName: P,
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
      this._compilations.add(g), (0, o.validateFunctionCode)(H), M.optimize(this.opts.code.optimize);
      const L = M.toString();
      j = `${M.scopeRefs(r.default.scope)}return ${L}`, this.opts.code.process && (j = this.opts.code.process(j, g));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, j)(this, this.scope.get());
      if (this.scope.value(P, { ref: U }), U.errors = null, U.schema = g.schema, U.schemaEnv = g, g.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: P, validateCode: L, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: T } = H;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: T instanceof A.Name ? void 0 : T,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: T instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return g.validate = U, g;
    } catch (L) {
      throw delete g.validate, delete g.validateName, j && this.logger.error("Error compiling schema, function code:", j), L;
    } finally {
      this._compilations.delete(g);
    }
  }
  compile.compileSchema = s;
  function a(g, C, t) {
    var D;
    t = (0, Q.resolveUrl)(this.opts.uriResolver, C, t);
    const c = g.refs[t];
    if (c)
      return c;
    let d = l.call(this, g, t);
    if (d === void 0) {
      const M = (D = g.localRefs) === null || D === void 0 ? void 0 : D[t], { schemaId: h } = this.opts;
      M && (d = new B({ schema: M, schemaId: h, root: g, baseId: C }));
    }
    if (d !== void 0)
      return g.refs[t] = w.call(this, d);
  }
  compile.resolveRef = a;
  function w(g) {
    return (0, Q.inlineRef)(g.schema, this.opts.inlineRefs) ? g.schema : g.validate ? g : s.call(this, g);
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
    const t = this.opts.uriResolver.parse(C), D = (0, Q._getFullPath)(this.opts.uriResolver, t);
    let c = (0, Q.getFullPath)(this.opts.uriResolver, g.baseId, void 0);
    if (Object.keys(g.schema).length > 0 && D === c)
      return I.call(this, t, g);
    const d = (0, Q.normalizeId)(D), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const h = f.call(this, g, M);
      return typeof h?.schema != "object" ? void 0 : I.call(this, t, h);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, Q.normalizeId)(C)) {
        const { schema: h } = M, { schemaId: P } = this.opts, H = h[P];
        return H && (c = (0, Q.resolveUrl)(this.opts.uriResolver, c, H)), new B({ schema: h, schemaId: P, root: g, baseId: c });
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
  function I(g, { baseId: C, schema: t, root: D }) {
    var c;
    if (((c = g.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const h of g.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const P = t[(0, i.unescapeFragment)(h)];
      if (P === void 0)
        return;
      t = P;
      const H = typeof t == "object" && t[this.opts.schemaId];
      !m.has(h) && H && (C = (0, Q.resolveUrl)(this.opts.uriResolver, C, H));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const h = (0, Q.resolveUrl)(this.opts.uriResolver, C, t.$ref);
      d = f.call(this, D, h);
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
    const g = I.match(e) || [], [C] = g;
    return C ? { host: B(C, "."), isIPV4: !0 } : { host: I, isIPV4: !1 };
  }
  function Q(I, g = !1) {
    let C = "", t = !0;
    for (const D of I) {
      if (A[D] === void 0) return;
      D !== "0" && t === !0 && (t = !1), t || (C += D);
    }
    return g && C.length === 0 && (C = "0"), C;
  }
  function i(I) {
    let g = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], D = [];
    let c = !1, d = !1, M = !1;
    function h() {
      if (D.length) {
        if (c === !1) {
          const P = Q(D);
          if (P !== void 0)
            t.push(P);
          else
            return C.error = !0, !1;
        }
        D.length = 0;
      }
      return !0;
    }
    for (let P = 0; P < I.length; P++) {
      const H = I[P];
      if (!(H === "[" || H === "]"))
        if (H === ":") {
          if (d === !0 && (M = !0), !h())
            break;
          if (g++, t.push(":"), g > 7) {
            C.error = !0;
            break;
          }
          P - 1 >= 0 && I[P - 1] === ":" && (d = !0);
          continue;
        } else if (H === "%") {
          if (!h())
            break;
          c = !0;
        } else {
          D.push(H);
          continue;
        }
    }
    return D.length && (c ? C.zone = D.join("") : M ? t.push(D.join("")) : t.push(Q(D))), C.address = t.join(""), C;
  }
  function o(I) {
    if (s(I, ":") < 2)
      return { host: I, isIPV6: !1 };
    const g = i(I);
    if (g.error)
      return { host: I, isIPV6: !1 };
    {
      let C = g.address, t = g.address;
      return g.zone && (C += "%" + g.zone, t += "%25" + g.zone), { host: C, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(I, g) {
    let C = "", t = !0;
    const D = I.length;
    for (let c = 0; c < D; c++) {
      const d = I[c];
      d === "0" && t ? (c + 1 <= D && I[c + 1] === g || c + 1 === D) && (C += d, t = !1) : (d === g ? t = !0 : t = !1, C += d);
    }
    return C;
  }
  function s(I, g) {
    let C = 0;
    for (let t = 0; t < I.length; t++)
      I[t] === g && C++;
    return C;
  }
  const a = /^\.\.?\//u, w = /^\/\.(?:\/|$)/u, n = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(I) {
    const g = [];
    for (; I.length; )
      if (I.match(a))
        I = I.replace(a, "");
      else if (I.match(w))
        I = I.replace(w, "/");
      else if (I.match(n))
        I = I.replace(n, "/"), g.pop();
      else if (I === "." || I === "..")
        I = "";
      else {
        const C = I.match(E);
        if (C) {
          const t = C[0];
          I = I.slice(t.length), g.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return g.join("");
  }
  function f(I, g) {
    const C = g !== !0 ? escape : unescape;
    return I.scheme !== void 0 && (I.scheme = C(I.scheme)), I.userinfo !== void 0 && (I.userinfo = C(I.userinfo)), I.host !== void 0 && (I.host = C(I.host)), I.path !== void 0 && (I.path = C(I.path)), I.query !== void 0 && (I.query = C(I.query)), I.fragment !== void 0 && (I.fragment = C(I.fragment)), I;
  }
  function m(I) {
    const g = [];
    if (I.userinfo !== void 0 && (g.push(I.userinfo), g.push("@")), I.host !== void 0) {
      let C = unescape(I.host);
      const t = r(C);
      if (t.isIPV4)
        C = t.host;
      else {
        const D = o(t.host);
        D.isIPV6 === !0 ? C = `[${D.escapedHost}]` : C = I.host;
      }
      g.push(C);
    }
    return (typeof I.port == "number" || typeof I.port == "string") && (g.push(":"), g.push(String(I.port))), g.length ? g.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: m,
    normalizeComponentEncoding: f,
    removeDotSegments: l,
    normalizeIPv4: r,
    normalizeIPv6: o,
    stringArrayToHexStripped: Q
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
  function Q(t) {
    return t.host || (t.error = t.error || "HTTP URIs must have a host."), t;
  }
  function i(t) {
    const D = String(t.scheme).toLowerCase() === "https";
    return (t.port === (D ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function o(t) {
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
      const M = `${d}:${D.nid || t.nid}`, h = C[M];
      t.path = void 0, h && (t = h.parse(t, D));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, D) {
    const c = D.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${D.nid || d}`, h = C[M];
    h && (t = h.serialize(t, D));
    const P = t, H = t.nss;
    return P.path = `${d || D.nid}:${H}`, D.skipEscape = !0, P;
  }
  function w(t, D) {
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
    parse: Q,
    serialize: i
  }, l = {
    scheme: "https",
    domainHost: E.domainHost,
    parse: Q,
    serialize: i
  }, f = {
    scheme: "ws",
    domainHost: !0,
    parse: o,
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
      parse: w,
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
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: Q, normalizeComponentEncoding: i } = requireUtils(), o = requireSchemes();
  function B(g, C) {
    return typeof g == "string" ? g = n(m(g, C), C) : typeof g == "object" && (g = m(n(g, C), C)), g;
  }
  function s(g, C, t) {
    const D = Object.assign({ scheme: "null" }, t), c = a(m(g, D), m(C, D), D, !0);
    return n(c, { ...D, skipEscape: !0 });
  }
  function a(g, C, t, D) {
    const c = {};
    return D || (g = m(n(g, t), t), C = m(n(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((g.userinfo !== void 0 || g.host !== void 0 || g.port !== void 0) && !g.path ? c.path = "/" + C.path : g.path ? c.path = g.path.slice(0, g.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = g.path, C.query !== void 0 ? c.query = C.query : c.query = g.query), c.userinfo = g.userinfo, c.host = g.host, c.port = g.port), c.scheme = g.scheme), c.fragment = C.fragment, c;
  }
  function w(g, C, t) {
    return typeof g == "string" ? (g = unescape(g), g = n(i(m(g, t), !0), { ...t, skipEscape: !0 })) : typeof g == "object" && (g = n(i(g, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = n(i(m(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = n(i(C, !0), { ...t, skipEscape: !0 })), g.toLowerCase() === C.toLowerCase();
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
    }, D = Object.assign({}, C), c = [], d = o[(D.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, D), t.path !== void 0 && (D.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), D.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = Q(t);
    if (M !== void 0 && (D.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let h = t.path;
      !D.absolutePath && (!d || !d.absolutePath) && (h = r(h)), M === void 0 && (h = h.replace(/^\/\//u, "/%2F")), c.push(h);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (g, C) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(C)));
  function l(g) {
    let C = 0;
    for (let t = 0, D = g.length; t < D; ++t)
      if (C = g.charCodeAt(t), C > 126 || E[C])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function m(g, C) {
    const t = Object.assign({}, C), D = {
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
      if (D.scheme = M[1], D.userinfo = M[3], D.host = M[4], D.port = parseInt(M[5], 10), D.path = M[6] || "", D.query = M[7], D.fragment = M[8], isNaN(D.port) && (D.port = M[5]), D.host) {
        const P = e(D.host);
        if (P.isIPV4 === !1) {
          const H = A(P.host);
          D.host = H.host.toLowerCase(), d = H.isIPV6;
        } else
          D.host = P.host, d = !0;
      }
      D.scheme === void 0 && D.userinfo === void 0 && D.host === void 0 && D.port === void 0 && !D.path && D.query === void 0 ? D.reference = "same-document" : D.scheme === void 0 ? D.reference = "relative" : D.fragment === void 0 ? D.reference = "absolute" : D.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== D.reference && (D.error = D.error || "URI is not a " + t.reference + " reference.");
      const h = o[(t.scheme || D.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!h || !h.unicodeSupport) && D.host && (t.domainHost || h && h.domainHost) && d === !1 && l(D.host))
        try {
          D.host = URL.domainToASCII(D.host.toLowerCase());
        } catch (P) {
          D.error = D.error || "Host's domain name can not be converted to ASCII: " + P;
        }
      (!h || h && !h.skipNormalize) && (c && D.scheme !== void 0 && (D.scheme = unescape(D.scheme)), c && D.host !== void 0 && (D.host = unescape(D.host)), D.path && D.path.length && (D.path = escape(unescape(D.path))), D.fragment && D.fragment.length && (D.fragment = encodeURI(decodeURIComponent(D.fragment)))), h && h.parse && h.parse(D, t);
    } else
      D.error = D.error || "URI can not be parsed.";
    return D;
  }
  const I = {
    SCHEMES: o,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: w,
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
    const Q = requireValidation_error(), i = requireRef_error(), o = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), w = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, G) => new RegExp(v, G);
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
    function D(v) {
      var G, _, N, u, K, y, F, b, J, Z, k, p, O, q, z, R, V, eA, X, $, W, iA, AA, tA, sA;
      const BA = v.strict, aA = (G = v.code) === null || G === void 0 ? void 0 : G.optimize, wA = aA === !0 || aA === void 0 ? 1 : aA || 0, gA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, DA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (y = (K = v.strictSchema) !== null && K !== void 0 ? K : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (b = (F = v.strictNumbers) !== null && F !== void 0 ? F : BA) !== null && b !== void 0 ? b : !0,
        strictTypes: (Z = (J = v.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (p = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && p !== void 0 ? p : "log",
        strictRequired: (q = (O = v.strictRequired) !== null && O !== void 0 ? O : BA) !== null && q !== void 0 ? q : !1,
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
        uriResolver: DA
      };
    }
    class c {
      constructor(G = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), G = this.opts = { ...G, ...D(G) };
        const { es5: _, lines: N } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: I, es5: _, lines: N }), this.logger = S(G.logger);
        const u = G.validateFormats;
        G.validateFormats = !1, this.RULES = (0, o.getRules)(), d.call(this, g, G, "NOT SUPPORTED"), d.call(this, C, G, "DEPRECATED", "warn"), this._metaOpts = j.call(this), G.formats && P.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), G.keywords && H.call(this, G.keywords), typeof G.meta == "object" && this.addMetaSchema(G.meta), h.call(this), G.validateFormats = u;
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
          const p = this._addSchema(Z, k);
          return p.validate || y.call(this, p);
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
            return F.call(this, k), await b.call(this, k.missingSchema), y.call(this, Z);
          }
        }
        function F({ missingSchema: Z, missingRef: k }) {
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
        QA.call(this, _);
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
          for (const F of K)
            y = y[F];
          for (const F in N) {
            const b = N[F];
            if (typeof b != "object")
              continue;
            const { $data: J } = b.definition, Z = y[F];
            J && Z && (y[F] = oA(Z));
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
        const { schemaId: F } = this.opts;
        if (typeof G == "object")
          y = G[F];
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
        return b = new B.SchemaEnv({ schema: G, schemaId: F, meta: _, baseId: N, localRefs: J }), this._cache.set(b.schema, b), K && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = b), u && this.validateSchema(G, !0), b;
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
    c.ValidationError = Q.default, c.MissingRefError = i.default, A.default = c;
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
    function P() {
      for (const v in this.opts.formats) {
        const G = this.opts.formats[v];
        G && this.addFormat(v, G);
      }
    }
    function H(v) {
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
    const L = { log() {
    }, warn() {
    }, error() {
    } };
    function S(v) {
      if (v === !1)
        return L;
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
      const u = G?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: K } = this;
      let y = u ? K.post : K.rules.find(({ type: b }) => b === _);
      if (y || (y = { type: _, rules: [] }, K.rules.push(y)), K.keywords[v] = !0, !G)
        return;
      const F = {
        keyword: v,
        definition: {
          ...G,
          type: (0, w.getJSONTypes)(G.type),
          schemaType: (0, w.getJSONTypes)(G.schemaType)
        }
      };
      G.before ? rA.call(this, y, F, G.before) : y.rules.push(F), K.all[v] = F, (N = G.implements) === null || N === void 0 || N.forEach((b) => this.addKeyword(b));
    }
    function rA(v, G, _) {
      const N = v.rules.findIndex((u) => u.keyword === _);
      N >= 0 ? v.rules.splice(N, 0, G) : (v.rules.push(G), this.logger.warn(`rule ${_} is not defined`));
    }
    function QA(v) {
      let { metaSchema: G } = v;
      G !== void 0 && (v.$data && this.opts.$data && (G = oA(G)), v.validateSchema = this.compile(G, !0));
    }
    const x = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function oA(v) {
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
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), Q = requireNames(), i = requireCompile(), o = requireUtil(), B = {
    keyword: "$ref",
    schemaType: "string",
    code(w) {
      const { gen: n, schema: E, it: l } = w, { baseId: f, schemaEnv: m, validateName: I, opts: g, self: C } = l, { root: t } = m;
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
          return a(w, I, m, m.$async);
        const h = n.scopeValue("root", { ref: t });
        return a(w, (0, r._)`${h}.validate`, t, t.$async);
      }
      function d(h) {
        const P = s(w, h);
        a(w, P, h, h.$async);
      }
      function M(h) {
        const P = n.scopeValue("schema", g.code.source === !0 ? { ref: h, code: (0, r.stringify)(h) } : { ref: h }), H = n.name("valid"), j = w.subschema({
          schema: h,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: P,
          errSchemaPath: E
        }, H);
        w.mergeEvaluated(j), w.ok(H);
      }
    }
  };
  function s(w, n) {
    const { gen: E } = w;
    return n.validate ? E.scopeValue("validate", { ref: n.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: n })}.validate`;
  }
  ref.getValidate = s;
  function a(w, n, E, l) {
    const { gen: f, it: m } = w, { allErrors: I, schemaEnv: g, opts: C } = m, t = C.passContext ? Q.default.this : r.nil;
    l ? D() : c();
    function D() {
      if (!g.$async)
        throw new Error("async schema referenced by sync schema");
      const h = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(w, n, t)}`), M(n), I || f.assign(h, !0);
      }, (P) => {
        f.if((0, r._)`!(${P} instanceof ${m.ValidationError})`, () => f.throw(P)), d(P), I || f.assign(h, !1);
      }), w.ok(h);
    }
    function c() {
      w.result((0, e.callValidateCode)(w, n, t), () => M(n), () => d(n));
    }
    function d(h) {
      const P = (0, r._)`${h}.errors`;
      f.assign(Q.default.vErrors, (0, r._)`${Q.default.vErrors} === null ? ${P} : ${Q.default.vErrors}.concat(${P})`), f.assign(Q.default.errors, (0, r._)`${Q.default.vErrors}.length`);
    }
    function M(h) {
      var P;
      if (!m.opts.unevaluated)
        return;
      const H = (P = E?.validate) === null || P === void 0 ? void 0 : P.evaluated;
      if (m.props !== !0)
        if (H && !H.dynamicProps)
          H.props !== void 0 && (m.props = o.mergeEvaluated.props(f, H.props, m.props));
        else {
          const j = f.var("props", (0, r._)`${h}.evaluated.props`);
          m.props = o.mergeEvaluated.props(f, j, m.props, r.Name);
        }
      if (m.items !== !0)
        if (H && !H.dynamicItems)
          H.items !== void 0 && (m.items = o.mergeEvaluated.items(f, H.items, m.items));
        else {
          const j = f.var("items", (0, r._)`${h}.evaluated.items`);
          m.items = o.mergeEvaluated.items(f, j, m.items, r.Name);
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
  }, Q = {
    message: ({ keyword: o, schemaCode: B }) => (0, A.str)`must be ${r[o].okStr} ${B}`,
    params: ({ keyword: o, schemaCode: B }) => (0, A._)`{comparison: ${r[o].okStr}, limit: ${B}}`
  }, i = {
    keyword: Object.keys(r),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: Q,
    code(o) {
      const { keyword: B, data: s, schemaCode: a } = o;
      o.fail$data((0, A._)`${s} ${r[B].fail} ${a} || isNaN(${s})`);
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
      message: ({ schemaCode: Q }) => (0, A.str)`must be multiple of ${Q}`,
      params: ({ schemaCode: Q }) => (0, A._)`{multipleOf: ${Q}}`
    },
    code(Q) {
      const { gen: i, data: o, schemaCode: B, it: s } = Q, a = s.opts.multipleOfPrecision, w = i.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${w}) - ${w}) > 1e-${a}` : (0, A._)`${w} !== parseInt(${w})`;
      Q.fail$data((0, A._)`(${B} === 0 || (${w} = ${o}/${B}, ${n}))`);
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
    let Q = 0, i = 0, o;
    for (; i < r; )
      Q++, o = e.charCodeAt(i++), o >= 55296 && o <= 56319 && i < r && (o = e.charCodeAt(i), (o & 64512) === 56320 && i++);
    return Q;
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
      message({ keyword: o, schemaCode: B }) {
        const s = o === "maxLength" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${s} than ${B} characters`;
      },
      params: ({ schemaCode: o }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { keyword: B, data: s, schemaCode: a, it: w } = o, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = w.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(o.gen, r.default)}(${s})`;
      o.fail$data((0, A._)`${E} ${n} ${a}`);
    }
  };
  return limitLength.default = i, limitLength;
}
var pattern = {}, hasRequiredPattern;
function requirePattern() {
  if (hasRequiredPattern) return pattern;
  hasRequiredPattern = 1, Object.defineProperty(pattern, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), Q = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: i }) => (0, e.str)`must match pattern "${i}"`,
      params: ({ schemaCode: i }) => (0, e._)`{pattern: ${i}}`
    },
    code(i) {
      const { data: o, $data: B, schema: s, schemaCode: a, it: w } = i, n = w.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(i, s);
      i.fail$data((0, e._)`!${E}.test(${o})`);
    }
  };
  return pattern.default = Q, pattern;
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
      message({ keyword: Q, schemaCode: i }) {
        const o = Q === "maxProperties" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${o} than ${i} properties`;
      },
      params: ({ schemaCode: Q }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { keyword: i, data: o, schemaCode: B } = Q, s = i === "maxProperties" ? A.operators.GT : A.operators.LT;
      Q.fail$data((0, A._)`Object.keys(${o}).length ${s} ${B}`);
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
      message: ({ params: { missingProperty: o } }) => (0, e.str)`must have required property '${o}'`,
      params: ({ params: { missingProperty: o } }) => (0, e._)`{missingProperty: ${o}}`
    },
    code(o) {
      const { gen: B, schema: s, schemaCode: a, data: w, $data: n, it: E } = o, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? m() : I(), l.strictRequired) {
        const t = o.parentSchema.properties, { definedProperties: D } = o.it;
        for (const c of s)
          if (t?.[c] === void 0 && !D.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function m() {
        if (f || n)
          o.block$data(e.nil, g);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(o, t);
      }
      function I() {
        const t = B.let("missing");
        if (f || n) {
          const D = B.let("valid", !0);
          o.block$data(D, () => C(t, D)), o.ok(D);
        } else
          B.if((0, A.checkMissingProp)(o, s, t)), (0, A.reportMissingProp)(o, t), B.else();
      }
      function g() {
        B.forOf("prop", a, (t) => {
          o.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, w, t, l.ownProperties), () => o.error());
        });
      }
      function C(t, D) {
        o.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(D, (0, A.propertyInData)(B, w, t, l.ownProperties)), B.if((0, e.not)(D), () => {
            o.error(), B.break();
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
      message({ keyword: Q, schemaCode: i }) {
        const o = Q === "maxItems" ? "more" : "fewer";
        return (0, A.str)`must NOT have ${o} than ${i} items`;
      },
      params: ({ schemaCode: Q }) => (0, A._)`{limit: ${Q}}`
    },
    code(Q) {
      const { keyword: i, data: o, schemaCode: B } = Q, s = i === "maxItems" ? A.operators.GT : A.operators.LT;
      Q.fail$data((0, A._)`${o}.length ${s} ${B}`);
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
  const A = requireDataType(), e = requireCodegen(), r = requireUtil(), Q = requireEqual(), o = {
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
      const m = s.let("valid"), I = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(m, g, (0, e._)`${l} === false`), B.ok(m);
      function g() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(m, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : D)(c, d));
      }
      function C() {
        return I.length > 0 && !I.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), h = (0, A.checkDataTypes)(I, M, f.opts.strictNumbers, A.DataType.Wrong), P = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(h, (0, e._)`continue`), I.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${P}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${P}[${M}]`), B.error(), s.assign(m, !1).break();
          }).code((0, e._)`${P}[${M}] = ${c}`);
        });
      }
      function D(c, d) {
        const M = (0, r.useFunc)(s, Q.default), h = s.name("outer");
        s.label(h).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(m, !1).break(h);
        })));
      }
    }
  };
  return uniqueItems.default = o, uniqueItems;
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
      params: ({ schemaCode: o }) => (0, A._)`{allowedValue: ${o}}`
    },
    code(o) {
      const { gen: B, data: s, $data: a, schemaCode: w, schema: n } = o;
      a || n && typeof n == "object" ? o.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${w})`) : o.fail((0, A._)`${n} !== ${s}`);
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
      params: ({ schemaCode: o }) => (0, A._)`{allowedValues: ${o}}`
    },
    code(o) {
      const { gen: B, data: s, $data: a, schema: w, schemaCode: n, it: E } = o;
      if (!a && w.length === 0)
        throw new Error("enum must have non-empty array");
      const l = w.length >= E.opts.loopEnum;
      let f;
      const m = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let I;
      if (l || a)
        I = B.let("valid"), o.block$data(I, g);
      else {
        if (!Array.isArray(w))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        I = (0, A.or)(...w.map((D, c) => C(t, c)));
      }
      o.pass(I);
      function g() {
        B.assign(I, !1), B.forOf("v", n, (t) => B.if((0, A._)`${m()}(${s}, ${t})`, () => B.assign(I, !0).break()));
      }
      function C(t, D) {
        const c = w[D];
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
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), Q = requirePattern(), i = requireLimitProperties(), o = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), w = require_enum(), n = [
    // number
    A.default,
    e.default,
    // string
    r.default,
    Q.default,
    // object
    i.default,
    o.default,
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
  const A = requireCodegen(), e = requireUtil(), Q = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: o } }) => (0, A.str)`must NOT have more than ${o} items`,
      params: ({ params: { len: o } }) => (0, A._)`{limit: ${o}}`
    },
    code(o) {
      const { parentSchema: B, it: s } = o, { items: a } = B;
      if (!Array.isArray(a)) {
        (0, e.checkStrictMode)(s, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      i(o, a);
    }
  };
  function i(o, B) {
    const { gen: s, schema: a, data: w, keyword: n, it: E } = o;
    E.items = !0;
    const l = s.const("len", (0, A._)`${w}.length`);
    if (a === !1)
      o.setParams({ len: B.length }), o.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const m = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(m), () => f(m)), o.ok(m);
    }
    function f(m) {
      s.forRange("i", B.length, l, (I) => {
        o.subschema({ keyword: n, dataProp: I, dataPropType: e.Type.Num }, m), E.allErrors || s.if((0, A.not)(m), () => s.break());
      });
    }
  }
  return additionalItems.validateAdditionalItems = i, additionalItems.default = Q, additionalItems;
}
var prefixItems = {}, items = {}, hasRequiredItems;
function requireItems() {
  if (hasRequiredItems) return items;
  hasRequiredItems = 1, Object.defineProperty(items, "__esModule", { value: !0 }), items.validateTuple = void 0;
  const A = requireCodegen(), e = requireUtil(), r = requireCode(), Q = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(o) {
      const { schema: B, it: s } = o;
      if (Array.isArray(B))
        return i(o, "additionalItems", B);
      s.items = !0, !(0, e.alwaysValidSchema)(s, B) && o.ok((0, r.validateArray)(o));
    }
  };
  function i(o, B, s = o.schema) {
    const { gen: a, parentSchema: w, data: n, keyword: E, it: l } = o;
    I(w), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), m = a.const("len", (0, A._)`${n}.length`);
    s.forEach((g, C) => {
      (0, e.alwaysValidSchema)(l, g) || (a.if((0, A._)`${m} > ${C}`, () => o.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), o.ok(f));
    });
    function I(g) {
      const { opts: C, errSchemaPath: t } = l, D = s.length, c = D === g.minItems && (D === g.maxItems || g[B] === !1);
      if (C.strictTuples && !c) {
        const d = `"${E}" is ${D}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, C.strictTuples);
      }
    }
  }
  return items.validateTuple = i, items.default = Q, items;
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
  const A = requireCodegen(), e = requireUtil(), r = requireCode(), Q = requireAdditionalItems(), o = {
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
      w.items = !0, !(0, e.alwaysValidSchema)(w, s) && (n ? (0, Q.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
    }
  };
  return items2020.default = o, items2020;
}
var contains = {}, hasRequiredContains;
function requireContains() {
  if (hasRequiredContains) return contains;
  hasRequiredContains = 1, Object.defineProperty(contains, "__esModule", { value: !0 });
  const A = requireCodegen(), e = requireUtil(), Q = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: i, max: o } }) => o === void 0 ? (0, A.str)`must contain at least ${i} valid item(s)` : (0, A.str)`must contain at least ${i} and no more than ${o} valid item(s)`,
      params: ({ params: { min: i, max: o } }) => o === void 0 ? (0, A._)`{minContains: ${i}}` : (0, A._)`{minContains: ${i}, maxContains: ${o}}`
    },
    code(i) {
      const { gen: o, schema: B, parentSchema: s, data: a, it: w } = i;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      w.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const m = o.const("len", (0, A._)`${a}.length`);
      if (i.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(w, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(w, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(w, B)) {
        let D = (0, A._)`${m} >= ${n}`;
        E !== void 0 && (D = (0, A._)`${D} && ${m} <= ${E}`), i.pass(D);
        return;
      }
      w.items = !0;
      const I = o.name("valid");
      E === void 0 && n === 1 ? C(I, () => o.if(I, () => o.break())) : n === 0 ? (o.let(I, !0), E !== void 0 && o.if((0, A._)`${a}.length > 0`, g)) : (o.let(I, !1), g()), i.result(I, () => i.reset());
      function g() {
        const D = o.name("_valid"), c = o.let("count", 0);
        C(D, () => o.if(D, () => t(c)));
      }
      function C(D, c) {
        o.forRange("i", 0, m, (d) => {
          i.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, D), c();
        });
      }
      function t(D) {
        o.code((0, A._)`${D}++`), E === void 0 ? o.if((0, A._)`${D} >= ${n}`, () => o.assign(I, !0).break()) : (o.if((0, A._)`${D} > ${E}`, () => o.assign(I, !1).break()), n === 1 ? o.assign(I, !0) : o.if((0, A._)`${D} >= ${n}`, () => o.assign(I, !0)));
      }
    }
  };
  return contains.default = Q, contains;
}
var dependencies = {}, hasRequiredDependencies;
function requireDependencies() {
  return hasRequiredDependencies || (hasRequiredDependencies = 1, (function(A) {
    Object.defineProperty(A, "__esModule", { value: !0 }), A.validateSchemaDeps = A.validatePropertyDeps = A.error = void 0;
    const e = requireCodegen(), r = requireUtil(), Q = requireCode();
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
        const [w, n] = o(a);
        B(a, w), s(a, n);
      }
    };
    function o({ schema: a }) {
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
        const I = w[m];
        if (I.length === 0)
          continue;
        const g = (0, Q.propertyInData)(n, E, m, l.opts.ownProperties);
        a.setParams({
          property: m,
          depsCount: I.length,
          deps: I.join(", ")
        }), l.allErrors ? n.if(g, () => {
          for (const C of I)
            (0, Q.checkReportMissingProp)(a, C);
        }) : (n.if((0, e._)`${g} && (${(0, Q.checkMissingProp)(a, I, f)})`), (0, Q.reportMissingProp)(a, f), n.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, w = a.schema) {
      const { gen: n, data: E, keyword: l, it: f } = a, m = n.name("valid");
      for (const I in w)
        (0, r.alwaysValidSchema)(f, w[I]) || (n.if(
          (0, Q.propertyInData)(n, E, I, f.opts.ownProperties),
          () => {
            const g = a.subschema({ keyword: l, schemaProp: I }, m);
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
  const A = requireCodegen(), e = requireUtil(), Q = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: i }) => (0, A._)`{propertyName: ${i.propertyName}}`
    },
    code(i) {
      const { gen: o, schema: B, data: s, it: a } = i;
      if ((0, e.alwaysValidSchema)(a, B))
        return;
      const w = o.name("valid");
      o.forIn("key", s, (n) => {
        i.setParams({ propertyName: n }), i.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, w), o.if((0, A.not)(w), () => {
          i.error(!0), a.allErrors || o.break();
        });
      }), i.ok(w);
    }
  };
  return propertyNames.default = Q, propertyNames;
}
var additionalProperties = {}, hasRequiredAdditionalProperties;
function requireAdditionalProperties() {
  if (hasRequiredAdditionalProperties) return additionalProperties;
  hasRequiredAdditionalProperties = 1, Object.defineProperty(additionalProperties, "__esModule", { value: !0 });
  const A = requireCode(), e = requireCodegen(), r = requireNames(), Q = requireUtil(), o = {
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
      if (l.props = !0, m.removeAdditional !== "all" && (0, Q.alwaysValidSchema)(l, a))
        return;
      const I = (0, A.allSchemaProperties)(w.properties), g = (0, A.allSchemaProperties)(w.patternProperties);
      C(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", n, (M) => {
          !I.length && !g.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let h;
        if (I.length > 8) {
          const P = (0, Q.schemaRefOrVal)(l, w.properties, "properties");
          h = (0, A.isOwnProperty)(s, P, M);
        } else I.length ? h = (0, e.or)(...I.map((P) => (0, e._)`${M} === ${P}`)) : h = e.nil;
        return g.length && (h = (0, e.or)(h, ...g.map((P) => (0, e._)`${(0, A.usePattern)(B, P)}.test(${M})`))), (0, e.not)(h);
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
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, Q.alwaysValidSchema)(l, a)) {
          const h = s.name("valid");
          m.removeAdditional === "failing" ? (d(M, h, !1), s.if((0, e.not)(h), () => {
            B.reset(), D(M);
          })) : (d(M, h), f || s.if((0, e.not)(h), () => s.break()));
        }
      }
      function d(M, h, P) {
        const H = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: Q.Type.Str
        };
        P === !1 && Object.assign(H, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(H, h);
      }
    }
  };
  return additionalProperties.default = o, additionalProperties;
}
var properties$1 = {}, hasRequiredProperties;
function requireProperties() {
  if (hasRequiredProperties) return properties$1;
  hasRequiredProperties = 1, Object.defineProperty(properties$1, "__esModule", { value: !0 });
  const A = requireValidate(), e = requireCode(), r = requireUtil(), Q = requireAdditionalProperties(), i = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(o) {
      const { gen: B, schema: s, parentSchema: a, data: w, it: n } = o;
      n.opts.removeAdditional === "all" && a.additionalProperties === void 0 && Q.default.code(new A.KeywordCxt(n, Q.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const g of E)
        n.definedProperties.add(g);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), n.props));
      const l = E.filter((g) => !(0, r.alwaysValidSchema)(n, s[g]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const g of l)
        m(g) ? I(g) : (B.if((0, e.propertyInData)(B, w, g, n.opts.ownProperties)), I(g), n.allErrors || B.else().var(f, !0), B.endIf()), o.it.definedProperties.add(g), o.ok(f);
      function m(g) {
        return n.opts.useDefaults && !n.compositeRule && s[g].default !== void 0;
      }
      function I(g) {
        o.subschema({
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
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), Q = requireUtil(), i = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(o) {
      const { gen: B, schema: s, data: a, parentSchema: w, it: n } = o, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const m = E.strictSchema && !E.allowMatchingProperties && w.properties, I = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, Q.evaluatedPropsToName)(B, n.props));
      const { props: g } = n;
      C();
      function C() {
        for (const c of l)
          m && t(c), n.allErrors ? D(c) : (B.var(I, !0), D(c), B.if(I));
      }
      function t(c) {
        for (const d in m)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function D(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(o, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || o.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: Q.Type.Str
            }, I), n.opts.unevaluated && g !== !0 ? B.assign((0, e._)`${g}[${d}]`, !0) : !M && !n.allErrors && B.if((0, e.not)(I), () => B.break());
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
      const { gen: Q, schema: i, it: o } = r;
      if ((0, A.alwaysValidSchema)(o, i)) {
        r.fail();
        return;
      }
      const B = Q.name("valid");
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
  const A = requireCodegen(), e = requireUtil(), Q = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: i }) => (0, A._)`{passingSchemas: ${i.passing}}`
    },
    code(i) {
      const { gen: o, schema: B, parentSchema: s, it: a } = i;
      if (!Array.isArray(B))
        throw new Error("ajv implementation error");
      if (a.opts.discriminator && s.discriminator)
        return;
      const w = B, n = o.let("valid", !1), E = o.let("passing", null), l = o.name("_valid");
      i.setParams({ passing: E }), o.block(f), i.result(n, () => i.reset(), () => i.error(!0));
      function f() {
        w.forEach((m, I) => {
          let g;
          (0, e.alwaysValidSchema)(a, m) ? o.var(l, !0) : g = i.subschema({
            keyword: "oneOf",
            schemaProp: I,
            compositeRule: !0
          }, l), I > 0 && o.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${I}]`).else(), o.if(l, () => {
            o.assign(n, !0), o.assign(E, I), g && i.mergeEvaluated(g, A.Name);
          });
        });
      }
    }
  };
  return oneOf.default = Q, oneOf;
}
var allOf = {}, hasRequiredAllOf;
function requireAllOf() {
  if (hasRequiredAllOf) return allOf;
  hasRequiredAllOf = 1, Object.defineProperty(allOf, "__esModule", { value: !0 });
  const A = requireUtil(), e = {
    keyword: "allOf",
    schemaType: "array",
    code(r) {
      const { gen: Q, schema: i, it: o } = r;
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      const B = Q.name("valid");
      i.forEach((s, a) => {
        if ((0, A.alwaysValidSchema)(o, s))
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
  const A = requireCodegen(), e = requireUtil(), Q = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: o }) => (0, A.str)`must match "${o.ifClause}" schema`,
      params: ({ params: o }) => (0, A._)`{failingKeyword: ${o.ifClause}}`
    },
    code(o) {
      const { gen: B, parentSchema: s, it: a } = o;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const w = i(a, "then"), n = i(a, "else");
      if (!w && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), o.reset(), w && n) {
        const I = B.let("ifClause");
        o.setParams({ ifClause: I }), B.if(l, m("then", I), m("else", I));
      } else w ? B.if(l, m("then")) : B.if((0, A.not)(l), m("else"));
      o.pass(E, () => o.error(!0));
      function f() {
        const I = o.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        o.mergeEvaluated(I);
      }
      function m(I, g) {
        return () => {
          const C = o.subschema({ keyword: I }, l);
          B.assign(E, l), o.mergeValidEvaluated(C, E), g ? B.assign(g, (0, A._)`${I}`) : o.setParams({ ifClause: I });
        };
      }
    }
  };
  function i(o, B) {
    const s = o.schema[B];
    return s !== void 0 && !(0, e.alwaysValidSchema)(o, s);
  }
  return _if.default = Q, _if;
}
var thenElse = {}, hasRequiredThenElse;
function requireThenElse() {
  if (hasRequiredThenElse) return thenElse;
  hasRequiredThenElse = 1, Object.defineProperty(thenElse, "__esModule", { value: !0 });
  const A = requireUtil(), e = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: r, parentSchema: Q, it: i }) {
      Q.if === void 0 && (0, A.checkStrictMode)(i, `"${r}" without "if" is ignored`);
    }
  };
  return thenElse.default = e, thenElse;
}
var hasRequiredApplicator;
function requireApplicator() {
  if (hasRequiredApplicator) return applicator;
  hasRequiredApplicator = 1, Object.defineProperty(applicator, "__esModule", { value: !0 });
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), Q = requireItems2020(), i = requireContains(), o = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), w = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), m = require_if(), I = requireThenElse();
  function g(C = !1) {
    const t = [
      // any
      n.default,
      E.default,
      l.default,
      f.default,
      m.default,
      I.default,
      // object
      B.default,
      s.default,
      o.default,
      a.default,
      w.default
    ];
    return C ? t.push(e.default, Q.default) : t.push(A.default, r.default), t.push(i.default), t;
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
      message: ({ schemaCode: Q }) => (0, A.str)`must match format "${Q}"`,
      params: ({ schemaCode: Q }) => (0, A._)`{format: ${Q}}`
    },
    code(Q, i) {
      const { gen: o, data: B, $data: s, schema: a, schemaCode: w, it: n } = Q, { opts: E, errSchemaPath: l, schemaEnv: f, self: m } = n;
      if (!E.validateFormats)
        return;
      s ? I() : g();
      function I() {
        const C = o.scopeValue("formats", {
          ref: m.formats,
          code: E.code.formats
        }), t = o.const("fDef", (0, A._)`${C}[${w}]`), D = o.let("fType"), c = o.let("format");
        o.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => o.assign(D, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => o.assign(D, (0, A._)`"string"`).assign(c, t)), Q.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${w} && !${c}`;
        }
        function M() {
          const h = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, P = (0, A._)`(typeof ${c} == "function" ? ${h} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${D} === ${i} && !${P}`;
        }
      }
      function g() {
        const C = m.formats[a];
        if (!C) {
          d();
          return;
        }
        if (C === !0)
          return;
        const [t, D, c] = M(C);
        t === i && Q.pass(h());
        function d() {
          if (E.strictSchema === !1) {
            m.logger.warn(P());
            return;
          }
          throw new Error(P());
          function P() {
            return `unknown format "${a}" ignored in schema at path "${l}"`;
          }
        }
        function M(P) {
          const H = P instanceof RegExp ? (0, A.regexpCode)(P) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, j = o.scopeValue("formats", { key: a, ref: P, code: H });
          return typeof P == "object" && !(P instanceof RegExp) ? [P.type || "string", P.validate, (0, A._)`${j}.validate`] : ["string", P, j];
        }
        function h() {
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
  const A = requireCore(), e = requireValidation(), r = requireApplicator(), Q = requireFormat(), i = requireMetadata(), o = [
    A.default,
    e.default,
    (0, r.default)(),
    Q.default,
    i.metadataVocabulary,
    i.contentVocabulary
  ];
  return draft7.default = o, draft7;
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
  const A = requireCodegen(), e = requireTypes(), r = requireCompile(), Q = requireRef_error(), i = requireUtil(), B = {
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
      const I = a.let("valid", !1), g = a.const("tag", (0, A._)`${w}${(0, A.getProperty)(m)}`);
      a.if((0, A._)`typeof ${g} == "string"`, () => C(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: g, tagName: m })), s.ok(I);
      function C() {
        const c = D();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${g} === ${d}`), a.assign(I, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: g, tagName: m }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function D() {
        var c;
        const d = {}, M = P(E);
        let h = !0;
        for (let L = 0; L < f.length; L++) {
          let S = f[L];
          if (S?.$ref && !(0, i.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new Q.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = S?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          h = h && (M || P(S)), H(U, L);
        }
        if (!h)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function P({ required: L }) {
          return Array.isArray(L) && L.includes(m);
        }
        function H(L, S) {
          if (L.const)
            j(L.const, S);
          else if (L.enum)
            for (const U of L.enum)
              j(U, S);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function j(L, S) {
          if (typeof L != "string" || L in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[L] = S;
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
    const r = requireCore$1(), Q = requireDraft7(), i = requireDiscriminator(), o = require$$3, B = ["/properties"], s = "http://json-schema.org/draft-07/schema";
    class a extends r.default {
      _addVocabularies() {
        super._addVocabularies(), Q.default.forEach((m) => this.addVocabulary(m)), this.opts.discriminator && this.addKeyword(i.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const m = this.opts.$data ? this.$dataMetaSchema(o, B) : o;
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
function __awaiter(A, e, r, Q) {
  function i(o) {
    return o instanceof r ? o : new r(function(B) {
      B(o);
    });
  }
  return new (r || (r = Promise))(function(o, B) {
    function s(n) {
      try {
        w(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        w(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function w(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    w((Q = Q.apply(A, [])).next());
  });
}
function __generator(A, e) {
  var r = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, Q, i, o, B;
  return B = { next: s(0), throw: s(1), return: s(2) }, typeof Symbol == "function" && (B[Symbol.iterator] = function() {
    return this;
  }), B;
  function s(w) {
    return function(n) {
      return a([w, n]);
    };
  }
  function a(w) {
    if (Q) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (Q = 1, i && (o = w[0] & 2 ? i.return : w[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, w[1])).done) return o;
      switch (i = 0, o && (w = [w[0] & 2, o.value]), w[0]) {
        case 0:
        case 1:
          o = w;
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
          if (o = r.trys, !(o = o.length > 0 && o[o.length - 1]) && (w[0] === 6 || w[0] === 2)) {
            r = 0;
            continue;
          }
          if (w[0] === 3 && (!o || w[1] > o[0] && w[1] < o[3])) {
            r.label = w[1];
            break;
          }
          if (w[0] === 6 && r.label < o[1]) {
            r.label = o[1], o = w;
            break;
          }
          if (o && r.label < o[2]) {
            r.label = o[2], r.ops.push(w);
            break;
          }
          o[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      w = e.call(A, r);
    } catch (n) {
      w = [6, n], i = 0;
    } finally {
      Q = o = 0;
    }
    if (w[0] & 5) throw w[1];
    return { value: w[0] ? w[1] : void 0, done: !0 };
  }
}
function __read(A, e) {
  var r = typeof Symbol == "function" && A[Symbol.iterator];
  if (!r) return A;
  var Q = r.call(A), i, o = [], B;
  try {
    for (; (e === void 0 || e-- > 0) && !(i = Q.next()).done; ) o.push(i.value);
  } catch (s) {
    B = { error: s };
  } finally {
    try {
      i && !i.done && (r = Q.return) && r.call(Q);
    } finally {
      if (B) throw B.error;
    }
  }
  return o;
}
function __spreadArray(A, e, r) {
  if (arguments.length === 2) for (var Q = 0, i = e.length, o; Q < i; Q++)
    (o || !(Q in e)) && (o || (o = Array.prototype.slice.call(e, 0, Q)), o[Q] = e[Q]);
  return A.concat(o || Array.prototype.slice.call(e));
}
var defaultErrorConfig = {
  withStackTrace: !1
}, createNeverThrowError = function(A, e, r) {
  r === void 0 && (r = defaultErrorConfig);
  var Q = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, i = r.withStackTrace ? new Error().stack : void 0;
  return {
    data: Q,
    message: A,
    stack: i
  };
}, Result;
(function(A) {
  function e(r, Q) {
    return function() {
      for (var i = [], o = 0; o < arguments.length; o++)
        i[o] = arguments[o];
      try {
        var B = r.apply(void 0, __spreadArray([], __read(i), !1));
        return ok(B);
      } catch (s) {
        return err(Q ? Q(s) : s);
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
      var r = e.then(function(Q) {
        return new Ok(Q);
      });
      return new A(r);
    }, A.fromPromise = function(e, r) {
      var Q = e.then(function(i) {
        return new Ok(i);
      }).catch(function(i) {
        return new Err(r(i));
      });
      return new A(Q);
    }, A.prototype.map = function(e) {
      var r = this;
      return new A(this._promise.then(function(Q) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(o) {
            switch (o.label) {
              case 0:
                return Q.isErr() ? [2, new Err(Q.error)] : (i = Ok.bind, [4, e(Q.value)]);
              case 1:
                return [2, new (i.apply(Ok, [void 0, o.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.mapErr = function(e) {
      var r = this;
      return new A(this._promise.then(function(Q) {
        return __awaiter(r, void 0, void 0, function() {
          var i;
          return __generator(this, function(o) {
            switch (o.label) {
              case 0:
                return Q.isOk() ? [2, new Ok(Q.value)] : (i = Err.bind, [4, e(Q.error)]);
              case 1:
                return [2, new (i.apply(Err, [void 0, o.sent()]))()];
            }
          });
        });
      }));
    }, A.prototype.andThen = function(e) {
      return new A(this._promise.then(function(r) {
        if (r.isErr())
          return new Err(r.error);
        var Q = e(r.value);
        return Q instanceof A ? Q._promise : Q;
      }));
    }, A.prototype.orElse = function(e) {
      var r = this;
      return new A(this._promise.then(function(Q) {
        return __awaiter(r, void 0, void 0, function() {
          return __generator(this, function(i) {
            return Q.isErr() ? [2, e(Q.error)] : [2, new Ok(Q.value)];
          });
        });
      }));
    }, A.prototype.match = function(e, r) {
      return this._promise.then(function(Q) {
        return Q.match(e, r);
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
function visit_(A, e, r, Q) {
  const i = callVisitor(A, e, r, Q);
  if (isNode(i) || isPair(i))
    return replaceNode(A, Q, i), visit_(A, i, r, Q);
  if (typeof i != "symbol") {
    if (isCollection(e)) {
      Q = Object.freeze(Q.concat(e));
      for (let o = 0; o < e.items.length; ++o) {
        const B = visit_(o, e.items[o], r, Q);
        if (typeof B == "number")
          o = B - 1;
        else {
          if (B === BREAK)
            return BREAK;
          B === REMOVE && (e.items.splice(o, 1), o -= 1);
        }
      }
    } else if (isPair(e)) {
      Q = Object.freeze(Q.concat(e));
      const o = visit_("key", e.key, r, Q);
      if (o === BREAK)
        return BREAK;
      o === REMOVE && (e.key = null);
      const B = visit_("value", e.value, r, Q);
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
function callVisitor(A, e, r, Q) {
  if (typeof r == "function")
    return r(A, e, Q);
  if (isMap(e))
    return r.Map?.(A, e, Q);
  if (isSeq(e))
    return r.Seq?.(A, e, Q);
  if (isPair(e))
    return r.Pair?.(A, e, Q);
  if (isScalar(e))
    return r.Scalar?.(A, e, Q);
  if (isAlias(e))
    return r.Alias?.(A, e, Q);
}
function replaceNode(A, e, r) {
  const Q = e[e.length - 1];
  if (isCollection(Q))
    Q.items[A] = r;
  else if (isPair(Q))
    A === "key" ? Q.key = r : Q.value = r;
  else if (isDocument(Q))
    Q.contents = r;
  else {
    const i = isAlias(Q) ? "alias" : "scalar";
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
function applyReviver(A, e, r, Q) {
  if (Q && typeof Q == "object")
    if (Array.isArray(Q))
      for (let i = 0, o = Q.length; i < o; ++i) {
        const B = Q[i], s = applyReviver(A, Q, String(i), B);
        s === void 0 ? delete Q[i] : s !== B && (Q[i] = s);
      }
    else if (Q instanceof Map)
      for (const i of Array.from(Q.keys())) {
        const o = Q.get(i), B = applyReviver(A, Q, i, o);
        B === void 0 ? Q.delete(i) : B !== o && Q.set(i, B);
      }
    else if (Q instanceof Set)
      for (const i of Array.from(Q)) {
        const o = applyReviver(A, Q, i, i);
        o === void 0 ? Q.delete(i) : o !== i && (Q.delete(i), Q.add(o));
      }
    else
      for (const [i, o] of Object.entries(Q)) {
        const B = applyReviver(A, Q, i, o);
        B === void 0 ? delete Q[i] : B !== o && (Q[i] = B);
      }
  return A.call(e, r, Q);
}
function toJS(A, e, r) {
  if (Array.isArray(A))
    return A.map((Q, i) => toJS(Q, String(i), r));
  if (A && typeof A.toJSON == "function") {
    if (!r || !hasAnchor(A))
      return A.toJSON(e, r);
    const Q = { aliasCount: 0, count: 1, res: void 0 };
    r.anchors.set(A, Q), r.onCreate = (o) => {
      Q.res = o, delete r.onCreate;
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
  toJS(e, { mapAsMap: r, maxAliasCount: Q, onAnchor: i, reviver: o } = {}) {
    if (!isDocument(e))
      throw new TypeError("A document argument is required");
    const B = {
      anchors: /* @__PURE__ */ new Map(),
      doc: e,
      keep: !0,
      mapAsMap: r === !0,
      mapKeyWarned: !1,
      maxAliasCount: typeof Q == "number" ? Q : 100
    }, s = toJS(this, "", B);
    if (typeof i == "function")
      for (const { count: a, res: w } of B.anchors.values())
        i(w, a);
    return typeof o == "function" ? applyReviver(o, { "": s }, "", s) : s;
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
      Node: (Q, i) => {
        if (i === this)
          return visit.BREAK;
        i.anchor === this.source && (r = i);
      }
    }), r;
  }
  toJSON(e, r) {
    if (!r)
      return { source: this.source };
    const { anchors: Q, doc: i, maxAliasCount: o } = r, B = this.resolve(i);
    if (!B) {
      const a = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(a);
    }
    let s = Q.get(B);
    if (s || (toJS(B, null, r), s = Q.get(B)), !s || s.res === void 0) {
      const a = "This should not happen: Alias anchor was not resolved?";
      throw new ReferenceError(a);
    }
    if (o >= 0 && (s.count += 1, s.aliasCount === 0 && (s.aliasCount = getAliasCount(i, B, Q)), s.count * s.aliasCount > o)) {
      const a = "Excessive alias count indicates a resource exhaustion attack";
      throw new ReferenceError(a);
    }
    return s.res;
  }
  toString(e, r, Q) {
    const i = `*${this.source}`;
    if (e) {
      if (anchorIsValid(this.source), e.options.verifyAliasOrder && !e.anchors.has(this.source)) {
        const o = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(o);
      }
      if (e.implicitKey)
        return `${i} `;
    }
    return i;
  }
}
function getAliasCount(A, e, r) {
  if (isAlias(e)) {
    const Q = e.resolve(A), i = r && Q && r.get(Q);
    return i ? i.count * i.aliasCount : 0;
  } else if (isCollection(e)) {
    let Q = 0;
    for (const i of e.items) {
      const o = getAliasCount(A, i, r);
      o > Q && (Q = o);
    }
    return Q;
  } else if (isPair(e)) {
    const Q = getAliasCount(A, e.key, r), i = getAliasCount(A, e.value, r);
    return Math.max(Q, i);
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
  return r.find((Q) => Q.identify?.(A) && !Q.format);
}
function createNode(A, e, r) {
  if (isDocument(A) && (A = A.contents), isNode(A))
    return A;
  if (isPair(A)) {
    const E = r.schema[MAP].createNode?.(r.schema, null, r);
    return E.items.push(A), E;
  }
  (A instanceof String || A instanceof Number || A instanceof Boolean || typeof BigInt < "u" && A instanceof BigInt) && (A = A.valueOf());
  const { aliasDuplicateObjects: Q, onAnchor: i, onTagObj: o, schema: B, sourceObjects: s } = r;
  let a;
  if (Q && A && typeof A == "object") {
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
  o && (o(w), delete r.onTagObj);
  const n = w?.createNode ? w.createNode(r.schema, A, r) : typeof w?.nodeClass?.from == "function" ? w.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return w.default || (n.tag = w.tag), a && (a.node = n), n;
}
function collectionFromPath(A, e, r) {
  let Q = r;
  for (let i = e.length - 1; i >= 0; --i) {
    const o = e[i];
    if (typeof o == "number" && Number.isInteger(o) && o >= 0) {
      const B = [];
      B[o] = Q, Q = B;
    } else
      Q = /* @__PURE__ */ new Map([[o, Q]]);
  }
  return createNode(Q, void 0, {
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
    return e && (r.schema = e), r.items = r.items.map((Q) => isNode(Q) || isPair(Q) ? Q.clone(e) : Q), this.range && (r.range = this.range.slice()), r;
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
      const [Q, ...i] = e, o = this.get(Q, !0);
      if (isCollection(o))
        o.addIn(i, r);
      else if (o === void 0 && this.schema)
        this.set(Q, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${Q}. Remaining path: ${i}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(e) {
    const [r, ...Q] = e;
    if (Q.length === 0)
      return this.delete(r);
    const i = this.get(r, !0);
    if (isCollection(i))
      return i.deleteIn(Q);
    throw new Error(`Expected YAML collection at ${r}. Remaining path: ${Q}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(e, r) {
    const [Q, ...i] = e, o = this.get(Q, !0);
    return i.length === 0 ? !r && isScalar(o) ? o.value : o : isCollection(o) ? o.getIn(i, r) : void 0;
  }
  hasAllNullValues(e) {
    return this.items.every((r) => {
      if (!isPair(r))
        return !1;
      const Q = r.value;
      return Q == null || e && isScalar(Q) && Q.value == null && !Q.commentBefore && !Q.comment && !Q.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(e) {
    const [r, ...Q] = e;
    if (Q.length === 0)
      return this.has(r);
    const i = this.get(r, !0);
    return isCollection(i) ? i.hasIn(Q) : !1;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(e, r) {
    const [Q, ...i] = e;
    if (i.length === 0)
      this.set(Q, r);
    else {
      const o = this.get(Q, !0);
      if (isCollection(o))
        o.setIn(i, r);
      else if (o === void 0 && this.schema)
        this.set(Q, collectionFromPath(this.schema, i, r));
      else
        throw new Error(`Expected YAML collection at ${Q}. Remaining path: ${i}`);
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
function foldFlowLines(A, e, r = "flow", { indentAtStart: Q, lineWidth: i = 80, minContentWidth: o = 20, onFold: B, onOverflow: s } = {}) {
  if (!i || i < 0)
    return A;
  i < o && (o = 0);
  const a = Math.max(1 + o, 1 + i - e.length);
  if (A.length <= a)
    return A;
  const w = [], n = {};
  let E = i - e.length;
  typeof Q == "number" && (Q > i - Math.max(2, o) ? w.push(0) : E = i - Q);
  let l, f, m = !1, I = -1, g = -1, C = -1;
  r === FOLD_BLOCK && (I = consumeMoreIndentedLines(A, I, e.length), I !== -1 && (E = I + a));
  for (let D; D = A[I += 1]; ) {
    if (r === FOLD_QUOTED && D === "\\") {
      switch (g = I, A[I + 1]) {
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
          w.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = D, D = A[I += 1], m = !0;
          const c = I > C + 1 ? I - 2 : g - 1;
          if (n[c])
            return A;
          w.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          m = !0;
    }
    f = D;
  }
  if (m && s && s(), w.length === 0)
    return A;
  B && B();
  let t = A.slice(0, w[0]);
  for (let D = 0; D < w.length; ++D) {
    const c = w[D], d = w[D + 1] || A.length;
    c === 0 ? t = `
${e}${A.slice(0, d)}` : (r === FOLD_QUOTED && n[c] && (t += `${A[c]}\\`), t += `
${e}${A.slice(c + 1, d)}`);
  }
  return t;
}
function consumeMoreIndentedLines(A, e, r) {
  let Q = e, i = e + 1, o = A[i];
  for (; o === " " || o === "	"; )
    if (e < i + r)
      o = A[++e];
    else {
      do
        o = A[++e];
      while (o && o !== `
`);
      Q = e, i = e + 1, o = A[i];
    }
  return Q;
}
const getFoldOptions = (A, e) => ({
  indentAtStart: e ? A.indent.length : A.indentAtStart,
  lineWidth: A.options.lineWidth,
  minContentWidth: A.options.minContentWidth
}), containsDocumentMarker = (A) => /^(%|---|\.\.\.)/m.test(A);
function lineLengthOverLimit(A, e, r) {
  if (!e || e < 0)
    return !1;
  const Q = e - r, i = A.length;
  if (i <= Q)
    return !1;
  for (let o = 0, B = 0; o < i; ++o)
    if (A[o] === `
`) {
      if (o - B > Q)
        return !0;
      if (B = o + 1, i - B <= Q)
        return !1;
    }
  return !0;
}
function doubleQuotedString(A, e) {
  const r = JSON.stringify(A);
  if (e.options.doubleQuotedAsJSON)
    return r;
  const { implicitKey: Q } = e, i = e.options.doubleQuotedMinMultiLineLength, o = e.indent || (containsDocumentMarker(A) ? "  " : "");
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
          if (Q || r[a + 2] === '"' || r.length < i)
            a += 1;
          else {
            for (B += r.slice(s, a) + `

`; r[a + 2] === "\\" && r[a + 3] === "n" && r[a + 4] !== '"'; )
              B += `
`, a += 2;
            B += o, r[a + 2] === " " && (B += "\\"), a += 1, s = a + 1;
          }
          break;
        default:
          a += 1;
      }
  return B = s ? B + r.slice(s) : r, Q ? B : foldFlowLines(B, o, FOLD_QUOTED, getFoldOptions(e, !1));
}
function singleQuotedString(A, e) {
  if (e.options.singleQuote === !1 || e.implicitKey && A.includes(`
`) || /[ \t]\n|\n[ \t]/.test(A))
    return doubleQuotedString(A, e);
  const r = e.indent || (containsDocumentMarker(A) ? "  " : ""), Q = "'" + A.replace(/'/g, "''").replace(/\n+/g, `$&
${r}`) + "'";
  return e.implicitKey ? Q : foldFlowLines(Q, r, FOLD_FLOW, getFoldOptions(e, !1));
}
function quotedString(A, e) {
  const { singleQuote: r } = e.options;
  let Q;
  if (r === !1)
    Q = doubleQuotedString;
  else {
    const i = A.includes('"'), o = A.includes("'");
    i && !o ? Q = singleQuotedString : o && !i ? Q = doubleQuotedString : Q = r ? singleQuotedString : doubleQuotedString;
  }
  return Q(A, e);
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
function blockString({ comment: A, type: e, value: r }, Q, i, o) {
  const { blockQuote: B, commentString: s, lineWidth: a } = Q.options;
  if (!B || /\n[\t ]+$/.test(r) || /^\s*$/.test(r))
    return quotedString(r, Q);
  const w = Q.indent || (Q.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, w.length);
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
  m === -1 ? E = "-" : r === f || m !== f.length - 1 ? (E = "+", o && o()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${w}`));
  let I = !1, g, C = -1;
  for (g = 0; g < r.length; ++g) {
    const d = r[g];
    if (d === " ")
      I = !0;
    else if (d === `
`)
      C = g;
    else
      break;
  }
  let t = r.substring(0, C < g ? C + 1 : g);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${w}`));
  let c = (I ? w ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${w}`);
    let M = !1;
    const h = getFoldOptions(Q, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (h.onOverflow = () => {
      M = !0;
    });
    const P = foldFlowLines(`${t}${d}${f}`, w, FOLD_BLOCK, h);
    if (!M)
      return `>${c}
${w}${P}`;
  }
  return r = r.replace(/\n+/g, `$&${w}`), `|${c}
${w}${t}${r}${f}`;
}
function plainString(A, e, r, Q) {
  const { type: i, value: o } = A, { actualString: B, implicitKey: s, indent: a, indentStep: w, inFlow: n } = e;
  if (s && o.includes(`
`) || n && /[[\]{},]/.test(o))
    return quotedString(o, e);
  if (!o || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(o))
    return s || n || !o.includes(`
`) ? quotedString(o, e) : blockString(A, e, r, Q);
  if (!s && !n && i !== Scalar.PLAIN && o.includes(`
`))
    return blockString(A, e, r, Q);
  if (containsDocumentMarker(o)) {
    if (a === "")
      return e.forceBlockIndent = !0, blockString(A, e, r, Q);
    if (s && a === w)
      return quotedString(o, e);
  }
  const E = o.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (I) => I.default && I.tag !== "tag:yaml.org,2002:str" && I.test?.test(E), { compat: f, tags: m } = e.doc.schema;
    if (m.some(l) || f?.some(l))
      return quotedString(o, e);
  }
  return s ? E : foldFlowLines(E, a, FOLD_FLOW, getFoldOptions(e, !1));
}
function stringifyString(A, e, r, Q) {
  const { implicitKey: i, inFlow: o } = e, B = typeof A.value == "string" ? A : Object.assign({}, A, { value: String(A.value) });
  let { type: s } = A;
  s !== Scalar.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(B.value) && (s = Scalar.QUOTE_DOUBLE);
  const a = (n) => {
    switch (n) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return i || o ? quotedString(B.value, e) : blockString(B, e, r, Q);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(B.value, e);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(B.value, e);
      case Scalar.PLAIN:
        return plainString(B, e, r, Q);
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
  let Q;
  switch (r.collectionStyle) {
    case "block":
      Q = !1;
      break;
    case "flow":
      Q = !0;
      break;
    default:
      Q = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc: A,
    flowCollectionPadding: r.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof r.indent == "number" ? " ".repeat(r.indent) : "  ",
    inFlow: Q,
    options: r
  };
}
function getTagObject(A, e) {
  if (e.tag) {
    const i = A.filter((o) => o.tag === e.tag);
    if (i.length > 0)
      return i.find((o) => o.format === e.format) ?? i[0];
  }
  let r, Q;
  if (isScalar(e)) {
    Q = e.value;
    let i = A.filter((o) => o.identify?.(Q));
    if (i.length > 1) {
      const o = i.filter((B) => B.test);
      o.length > 0 && (i = o);
    }
    r = i.find((o) => o.format === e.format) ?? i.find((o) => !o.format);
  } else
    Q = e, r = A.find((i) => i.nodeClass && Q instanceof i.nodeClass);
  if (!r) {
    const i = Q?.constructor?.name ?? typeof Q;
    throw new Error(`Tag not resolved for ${i} value`);
  }
  return r;
}
function stringifyProps(A, e, { anchors: r, doc: Q }) {
  if (!Q.directives)
    return "";
  const i = [], o = (isScalar(A) || isCollection(A)) && A.anchor;
  o && anchorIsValid(o) && (r.add(o), i.push(`&${o}`));
  const B = A.tag ? A.tag : e.default ? null : e.tag;
  return B && i.push(Q.directives.tagString(B)), i.join(" ");
}
function stringify(A, e, r, Q) {
  if (isPair(A))
    return A.toString(e, r, Q);
  if (isAlias(A)) {
    if (e.doc.directives)
      return A.toString(e);
    if (e.resolvedAliases?.has(A))
      throw new TypeError("Cannot stringify circular structure without alias nodes");
    e.resolvedAliases ? e.resolvedAliases.add(A) : e.resolvedAliases = /* @__PURE__ */ new Set([A]), A = A.resolve(e.doc);
  }
  let i;
  const o = isNode(A) ? A : e.doc.createNode(A, { onTagObj: (a) => i = a });
  i || (i = getTagObject(e.doc.schema.tags, o));
  const B = stringifyProps(o, i, e);
  B.length > 0 && (e.indentAtStart = (e.indentAtStart ?? 0) + B.length + 1);
  const s = typeof i.stringify == "function" ? i.stringify(o, e, r, Q) : isScalar(o) ? stringifyString(o, e, r, Q) : o.toString(e, r, Q);
  return B ? isScalar(o) || s[0] === "{" || s[0] === "[" ? `${B} ${s}` : `${B}
${e.indent}${s}` : s;
}
function stringifyPair({ key: A, value: e }, r, Q, i) {
  const { allNullValues: o, doc: B, indent: s, indentStep: a, options: { commentString: w, indentSeq: n, simpleKeys: E } } = r;
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
    implicitKey: !f && (E || !o),
    indent: s + a
  });
  let m = !1, I = !1, g = stringify(A, r, () => m = !0, () => I = !0);
  if (!f && !r.inFlow && g.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (o || e == null)
      return m && Q && Q(), g === "" ? "?" : f ? `? ${g}` : g;
  } else if (o && !E || e == null && f)
    return g = `? ${g}`, l && !m ? g += lineComment(g, r.indent, w(l)) : I && i && i(), g;
  m && (l = null), f ? (l && (g += lineComment(g, r.indent, w(l))), g = `? ${g}
${s}:`) : (g = `${g}:`, l && (g += lineComment(g, r.indent, w(l))));
  let C, t, D;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, D = e.comment) : (C = !1, t = null, D = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = g.length + 1), I = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => I = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
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
    const h = d[0], P = d.indexOf(`
`), H = P !== -1, j = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (H || !j) {
      let L = !1;
      if (H && (h === "&" || h === "!")) {
        let S = d.indexOf(" ");
        h === "&" && S !== -1 && S < P && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || P < S) && (L = !0);
      }
      L || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return g += M + d, r.inFlow ? c && Q && Q() : D && !c ? g += lineComment(g, r.indent, w(D)) : I && i && i(), g;
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
    for (const Q of r.items)
      mergeValue(A, e, Q);
  else if (Array.isArray(r))
    for (const Q of r)
      mergeValue(A, e, Q);
  else
    mergeValue(A, e, r);
}
function mergeValue(A, e, r) {
  const Q = A && isAlias(r) ? r.resolve(A.doc) : r;
  if (!isMap(Q))
    throw new Error("Merge sources must be maps or map aliases");
  const i = Q.toJSON(null, A, Map);
  for (const [o, B] of i)
    e instanceof Map ? e.has(o) || e.set(o, B) : e instanceof Set ? e.add(o) : Object.prototype.hasOwnProperty.call(e, o) || Object.defineProperty(e, o, {
      value: B,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  return e;
}
function addPairToJSMap(A, e, { key: r, value: Q }) {
  if (isNode(r) && r.addToJSMap)
    r.addToJSMap(A, e, Q);
  else if (isMergeKey(A, r))
    addMergeToJSMap(A, e, Q);
  else {
    const i = toJS(r, "", A);
    if (e instanceof Map)
      e.set(i, toJS(Q, i, A));
    else if (e instanceof Set)
      e.add(i);
    else {
      const o = stringifyKey(r, i, A), B = toJS(Q, o, A);
      o in e ? Object.defineProperty(e, o, {
        value: B,
        writable: !0,
        enumerable: !0,
        configurable: !0
      }) : e[o] = B;
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
    const Q = createStringifyContext(r.doc, {});
    Q.anchors = /* @__PURE__ */ new Set();
    for (const o of r.anchors.keys())
      Q.anchors.add(o.anchor);
    Q.inFlow = !0, Q.inStringifyKey = !0;
    const i = A.toString(Q);
    if (!r.mapKeyWarned) {
      let o = JSON.stringify(i);
      o.length > 40 && (o = o.substring(0, 36) + '..."'), warn(r.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${o}. Set mapAsMap: true to use object keys.`), r.mapKeyWarned = !0;
    }
    return i;
  }
  return JSON.stringify(e);
}
function createPair(A, e, r) {
  const Q = createNode(A, void 0, r), i = createNode(e, void 0, r);
  return new Pair(Q, i);
}
class Pair {
  constructor(e, r = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR }), this.key = e, this.value = r;
  }
  clone(e) {
    let { key: r, value: Q } = this;
    return isNode(r) && (r = r.clone(e)), isNode(Q) && (Q = Q.clone(e)), new Pair(r, Q);
  }
  toJSON(e, r) {
    const Q = r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(r, Q, this);
  }
  toString(e, r, Q) {
    return e?.doc ? stringifyPair(this, e, r, Q) : JSON.stringify(this);
  }
}
function stringifyCollection(A, e, r) {
  return (e.inFlow ?? A.flow ? stringifyFlowCollection : stringifyBlockCollection)(A, e, r);
}
function stringifyBlockCollection({ comment: A, items: e }, r, { blockItemPrefix: Q, flowChars: i, itemIndent: o, onChompKeep: B, onComment: s }) {
  const { indent: a, options: { commentString: w } } = r, n = Object.assign({}, r, { indent: o, type: null });
  let E = !1;
  const l = [];
  for (let m = 0; m < e.length; ++m) {
    const I = e[m];
    let g = null;
    if (isNode(I))
      !E && I.spaceBefore && l.push(""), addCommentBefore(r, l, I.commentBefore, E), I.comment && (g = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let C = stringify(I, n, () => g = null, () => E = !0);
    g && (C += lineComment(C, o, w(g))), E && g && (E = !1), l.push(Q + C);
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
` + indentComment(w(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: Q }) {
  const { indent: i, indentStep: o, flowCollectionPadding: B, options: { commentString: s } } = e;
  Q += o;
  const a = Object.assign({}, e, {
    indent: Q,
    inFlow: !0,
    type: null
  });
  let w = !1, n = 0;
  const E = [];
  for (let m = 0; m < A.length; ++m) {
    const I = A[m];
    let g = null;
    if (isNode(I))
      I.spaceBefore && E.push(""), addCommentBefore(e, E, I.commentBefore, !1), I.comment && (g = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (w = !0));
      const D = isNode(I.value) ? I.value : null;
      D ? (D.comment && (g = D.comment), D.commentBefore && (w = !0)) : I.value == null && t?.comment && (g = t.comment);
    }
    g && (w = !0);
    let C = stringify(I, a, () => g = null);
    m < A.length - 1 && (C += ","), g && (C += lineComment(C, Q, s(g))), !w && (E.length > n || C.includes(`
`)) && (w = !0), E.push(C), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!w) {
    const m = E.reduce((I, g) => I + g.length + 2, 2);
    w = e.options.lineWidth > 0 && m > e.options.lineWidth;
  }
  if (w) {
    let m = l;
    for (const I of E)
      m += I ? `
${o}${i}${I}` : `
`;
    return `${m}
${i}${f}`;
  } else
    return `${l}${B}${E.join(" ")}${B}${f}`;
}
function addCommentBefore({ indent: A, options: { commentString: e } }, r, Q, i) {
  if (Q && i && (Q = Q.replace(/^\n+/, "")), Q) {
    const o = indentComment(e(Q), A);
    r.push(o.trimStart());
  }
}
function findPair(A, e) {
  const r = isScalar(e) ? e.value : e;
  for (const Q of A)
    if (isPair(Q) && (Q.key === e || Q.key === r || isScalar(Q.key) && Q.key.value === r))
      return Q;
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
  static from(e, r, Q) {
    const { keepUndefined: i, replacer: o } = Q, B = new this(e), s = (a, w) => {
      if (typeof o == "function")
        w = o.call(r, a, w);
      else if (Array.isArray(o) && !o.includes(a))
        return;
      (w !== void 0 || i) && B.items.push(createPair(a, w, Q));
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
    let Q;
    isPair(e) ? Q = e : !e || typeof e != "object" || !("key" in e) ? Q = new Pair(e, e?.value) : Q = new Pair(e.key, e.value);
    const i = findPair(this.items, Q.key), o = this.schema?.sortMapEntries;
    if (i) {
      if (!r)
        throw new Error(`Key ${Q.key} already set`);
      isScalar(i.value) && isScalarValue(Q.value) ? i.value.value = Q.value : i.value = Q.value;
    } else if (o) {
      const B = this.items.findIndex((s) => o(Q, s) < 0);
      B === -1 ? this.items.push(Q) : this.items.splice(B, 0, Q);
    } else
      this.items.push(Q);
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
  toJSON(e, r, Q) {
    const i = Q ? new Q() : r?.mapAsMap ? /* @__PURE__ */ new Map() : {};
    r?.onCreate && r.onCreate(i);
    for (const o of this.items)
      addPairToJSMap(r, i, o);
    return i;
  }
  toString(e, r, Q) {
    if (!e)
      return JSON.stringify(this);
    for (const i of this.items)
      if (!isPair(i))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(i)} instead`);
    return !e.allNullValues && this.hasAllNullValues(!1) && (e = Object.assign({}, e, { allNullValues: !0 })), stringifyCollection(this, e, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: e.indent || "",
      onChompKeep: Q,
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
    const Q = asItemIndex(e);
    if (typeof Q != "number")
      return;
    const i = this.items[Q];
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
    const Q = asItemIndex(e);
    if (typeof Q != "number")
      throw new Error(`Expected a valid index, not ${e}.`);
    const i = this.items[Q];
    isScalar(i) && isScalarValue(r) ? i.value = r : this.items[Q] = r;
  }
  toJSON(e, r) {
    const Q = [];
    r?.onCreate && r.onCreate(Q);
    let i = 0;
    for (const o of this.items)
      Q.push(toJS(o, String(i++), r));
    return Q;
  }
  toString(e, r, Q) {
    return e ? stringifyCollection(this, e, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (e.indent || "") + "  ",
      onChompKeep: Q,
      onComment: r
    }) : JSON.stringify(this);
  }
  static from(e, r, Q) {
    const { replacer: i } = Q, o = new this(e);
    if (r && Symbol.iterator in Object(r)) {
      let B = 0;
      for (let s of r) {
        if (typeof i == "function") {
          const a = r instanceof Set ? s : String(B++);
          s = i.call(r, a, s);
        }
        o.items.push(createNode(s, void 0, Q));
      }
    }
    return o;
  }
}
function asItemIndex(A) {
  let e = isScalar(A) ? A.value : A;
  return e && typeof e == "string" && (e = Number(e)), typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
}
function createPairs(A, e, r) {
  const { replacer: Q } = r, i = new YAMLSeq(A);
  i.tag = "tag:yaml.org,2002:pairs";
  let o = 0;
  if (e && Symbol.iterator in Object(e))
    for (let B of e) {
      typeof Q == "function" && (B = Q.call(e, String(o++), B));
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
    const Q = /* @__PURE__ */ new Map();
    r?.onCreate && r.onCreate(Q);
    for (const i of this.items) {
      let o, B;
      if (isPair(i) ? (o = toJS(i.key, "", r), B = toJS(i.value, o, r)) : o = toJS(i, "", r), Q.has(o))
        throw new Error("Ordered maps must not include duplicate keys");
      Q.set(o, B);
    }
    return Q;
  }
  static from(e, r, Q) {
    const i = createPairs(e, r, Q), o = new this();
    return o.items = i.items, o;
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
    const Q = findPair(this.items, e);
    return !r && isPair(Q) ? isScalar(Q.key) ? Q.key.value : Q.key : Q;
  }
  set(e, r) {
    if (typeof r != "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof r}`);
    const Q = findPair(this.items, e);
    Q && !r ? this.items.splice(this.items.indexOf(Q), 1) : !Q && r && this.items.push(new Pair(e));
  }
  toJSON(e, r) {
    return super.toJSON(e, r, Set);
  }
  toString(e, r, Q) {
    if (!e)
      return JSON.stringify(this);
    if (this.hasAllNullValues(!0))
      return super.toString(Object.assign({}, e, { allNullValues: !0 }), r, Q);
    throw new Error("Set items must all have null values");
  }
  static from(e, r, Q) {
    const { replacer: i } = Q, o = new this(e);
    if (r && Symbol.iterator in Object(r))
      for (let B of r)
        typeof i == "function" && (B = i.call(r, B, B)), o.items.push(createPair(B, null, Q));
    return o;
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
  for (const [r, Q] of Object.entries(A.varInstances)) {
    const i = [];
    for (const o of Q) {
      const B = A.varTypes[o[0]], s = A.variables[o[1]];
      let a = s.i, w = s.n;
      if (o.length > 2) {
        const E = [], l = [], f = (o.length - 2) / 2, m = o.slice(2, 2 + f);
        for (const I of m) {
          const g = A.subscripts[I];
          E.push(g.i), l.push(g.n);
        }
        a += `[${E.join(",")}]`, w += `[${l.join(",")}]`;
      }
      const n = {
        varId: a,
        varName: w,
        varType: B,
        varIndex: s.x,
        subscriptIndices: o.length > 2 ? o.slice(2 + (o.length - 2) / 2) : void 0
      };
      i.push(n);
    }
    e[r] = i;
  }
  return e;
}
function getImplVars(A) {
  const e = decodeImplVars(A), r = /* @__PURE__ */ new Map(), Q = [];
  function i(o, B) {
    const s = [];
    for (const a of B) {
      if (a.varType === "lookup" || a.varType === "data")
        continue;
      const n = `ModelImpl_${a.varId}`;
      r.set(n, a), s.push(n);
    }
    Q.push({
      title: o,
      fn: o,
      datasetKeys: s
    });
  }
  return i("initConstants", e.constants || []), i("initLevels", e.initVars || []), i("evalLevels", e.levelVars || []), i("evalAux", e.auxVars || []), {
    implVars: r,
    implVarGroups: Q
  };
}
function getInputVars(A) {
  const e = /* @__PURE__ */ new Map();
  for (const r of A) {
    const Q = r.varId, i = {
      inputId: r.inputId,
      varId: Q,
      varName: r.varName,
      defaultValue: r.defaultValue,
      minValue: r.minValue,
      maxValue: r.maxValue,
      value: createInputValue(Q, r.defaultValue)
    };
    e.set(Q, i);
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
  function Q(w) {
    w.value.reset();
  }
  function i(w) {
    w.value.set(w.minValue);
  }
  function o(w) {
    w.value.set(w.maxValue);
  }
  function B() {
    A.forEach(Q);
  }
  function s() {
    A.forEach(i);
  }
  function a() {
    A.forEach(o);
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
                  Q(n);
                  break;
                case "at-minimum":
                  i(n);
                  break;
                case "at-maximum":
                  o(n);
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
    const Q = r.varId, i = datasetKeyForOutputVar(void 0, Q);
    e.set(i, {
      datasetKey: i,
      sourceName: void 0,
      varId: Q,
      varName: r.varName
    });
  }
  return e;
}
function datasetKeyForOutputVar(A, e) {
  return `Model_${e}`;
}
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 134 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "a_fi", varId: "_fertiliser_multiplier", varName: "Fertiliser Multiplier", defaultValue: 1.0001, minValue: 0.8, maxValue: 1.2 }, { inputId: "a_af", varId: "_feed_switch", varName: "Feed Switch", defaultValue: 1, minValue: -1, maxValue: 3 }, { inputId: "a_af_1", varId: "_feed_share_of_crop_types_custom[_pulses]", varName: "Feed Share of crop types Custom[Pulses]", defaultValue: 0.014, minValue: 0, maxValue: 1 }, { inputId: "a_af_2", varId: "_feed_share_of_crop_types_custom[_grains]", varName: "Feed Share of crop types Custom[Grains]", defaultValue: 0.715, minValue: 0, maxValue: 1 }, { inputId: "a_af_3", varId: "_feed_share_of_crop_types_custom[_vegfruits]", varName: "Feed Share of crop types Custom[VegFruits]", defaultValue: 0.223, minValue: 0, maxValue: 1 }, { inputId: "a_af_4", varId: "_feed_share_of_crop_types_custom[_othercrops]", varName: "Feed Share of crop types Custom[OtherCrops]", defaultValue: 0.048, minValue: 0, maxValue: 1 }, { inputId: "a_af_5", varId: "_feed_conversion_ratio", varName: "Feed Conversion Ratio", defaultValue: 100, minValue: 90, maxValue: 110 }, { inputId: "a_sap", varId: "_yield_multiplier_switch", varName: "Yield Multiplier Switch", defaultValue: 2, minValue: -1, maxValue: 4 }, { inputId: "a_sap_1", varId: "_yield_custom[_pulses]", varName: "Yield Custom[Pulses]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_2", varId: "_yield_custom[_grains]", varName: "Yield Custom[Grains]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_3", varId: "_yield_custom[_vegfruits]", varName: "Yield Custom[VegFruits]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "a_sap_4", varId: "_yield_custom[_othercrops]", varName: "Yield Custom[OtherCrops]", defaultValue: 100, minValue: 50, maxValue: 150 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_3", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "u_dis_4", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_5", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed_p", varId: "_fake_value_16", varName: "Fake Value 16", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed_p_1", varId: "_start_year_of_yield", varName: "Start Year of Yield", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_2", varId: "_end_year_of_yield", varName: "End Year of Yield", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_3", varId: "_start_year_of_feed_switch", varName: "Start Year of Feed Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_4", varId: "_end_year_of_feed_switch", varName: "End Year of Feed Switch", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_5", varId: "_start_year_of_fertiliser", varName: "Start Year of Fertiliser", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_p_6", varId: "_end_year_of_fertiliser", varName: "End Year of Fertiliser", defaultValue: 2035, minValue: 2e3, maxValue: 2100 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_26", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_27", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_28", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_29", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_30", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_31", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_32", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_33", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_34", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_35", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_36", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_37", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_38", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_39", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_40", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_41", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_42", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_46", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_47", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_48", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_49", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_50", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_52", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_53", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_54", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_55", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_56", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_57", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_58", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_59", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_62", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_63", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_64", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_65", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_pou_sigma_variation", varName: "SSP PoU Sigma Variation", defaultValue: 1, minValue: 0.8, maxValue: 1.2 }, { inputId: "ed_ext_70", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_75", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_76", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_77", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_79", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_80", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_81", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_82", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_83", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_84", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day[OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day[PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day[Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day[VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_arable_land_needed[_grains]", varName: "Arable Land Needed[Grains]" }, { varId: "_arable_land_needed[_othercrops]", varName: "Arable Land Needed[OtherCrops]" }, { varId: "_arable_land_needed[_pulses]", varName: "Arable Land Needed[Pulses]" }, { varId: "_arable_land_needed[_vegfruits]", varName: "Arable Land Needed[VegFruits]" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_conversion", varName: "CO2 from Net Forest Conversion" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_by_food_category[_cropmeat]", varName: "Caloric Availability by Food Category[CropMeat]" }, { varId: "_caloric_availability_by_food_category[_dairy]", varName: "Caloric Availability by Food Category[Dairy]" }, { varId: "_caloric_availability_by_food_category[_eggs]", varName: "Caloric Availability by Food Category[Eggs]" }, { varId: "_caloric_availability_by_food_category[_grains]", varName: "Caloric Availability by Food Category[Grains]" }, { varId: "_caloric_availability_by_food_category[_othercrops]", varName: "Caloric Availability by Food Category[OtherCrops]" }, { varId: "_caloric_availability_by_food_category[_pasmeat]", varName: "Caloric Availability by Food Category[PasMeat]" }, { varId: "_caloric_availability_by_food_category[_pulses]", varName: "Caloric Availability by Food Category[Pulses]" }, { varId: "_caloric_availability_by_food_category[_vegfruits]", varName: "Caloric Availability by Food Category[VegFruits]" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_caloric_intake_per_capita_per_day_from_animal_food", varName: "Caloric Intake per Capita per Day from Animal Food" }, { varId: "_caloric_intake_per_capita_per_day_from_plant_food", varName: "Caloric Intake per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_crop_yield_for_each_category[_grains]", varName: "Crop yield for each category [Grains]" }, { varId: "_crop_yield_for_each_category[_othercrops]", varName: "Crop yield for each category [OtherCrops]" }, { varId: "_crop_yield_for_each_category[_pulses]", varName: "Crop yield for each category [Pulses]" }, { varId: "_crop_yield_for_each_category[_vegfruits]", varName: "Crop yield for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation", varName: "Deforestation" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effect_of_sustainable_agricultural_productivity[_othercrops]", varName: "Effect of Sustainable Agricultural Productivity [OtherCrops]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_grains]", varName: "Effect of Sustainable Agricultural Productivity[Grains]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_pulses]", varName: "Effect of Sustainable Agricultural Productivity[Pulses]" }, { varId: "_effect_of_sustainable_agricultural_productivity[_vegfruits]", varName: "Effect of Sustainable Agricultural Productivity[VegFruits]" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_final_feed_share[_othercrops]", varName: "Final Feed Share [OtherCrops]" }, { varId: "_final_feed_share[_grains]", varName: "Final Feed Share[Grains]" }, { varId: "_final_feed_share[_pulses]", varName: "Final Feed Share[Pulses]" }, { varId: "_final_feed_share[_vegfruits]", varName: "Final Feed Share[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_shortage_in_tonnes[_cropmeat]", varName: "Food shortage in tonnes[CropMeat]" }, { varId: "_food_shortage_in_tonnes[_dairy]", varName: "Food shortage in tonnes[Dairy]" }, { varId: "_food_shortage_in_tonnes[_eggs]", varName: "Food shortage in tonnes[Eggs]" }, { varId: "_food_shortage_in_tonnes[_grains]", varName: "Food shortage in tonnes[Grains]" }, { varId: "_food_shortage_in_tonnes[_othercrops]", varName: "Food shortage in tonnes[OtherCrops]" }, { varId: "_food_shortage_in_tonnes[_pasmeat]", varName: "Food shortage in tonnes[PasMeat]" }, { varId: "_food_shortage_in_tonnes[_pulses]", varName: "Food shortage in tonnes[Pulses]" }, { varId: "_food_shortage_in_tonnes[_vegfruits]", varName: "Food shortage in tonnes[VegFruits]" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_grassland_needed[_dairy]", varName: "Grassland Needed[Dairy]" }, { varId: "_grassland_needed[_pasmeat]", varName: "Grassland Needed[PasMeat]" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_animal_and_crop_production[_cropmeat]", varName: "Total Animal and Crop Production[CropMeat]" }, { varId: "_total_animal_and_crop_production[_dairy]", varName: "Total Animal and Crop Production[Dairy]" }, { varId: "_total_animal_and_crop_production[_eggs]", varName: "Total Animal and Crop Production[Eggs]" }, { varId: "_total_animal_and_crop_production[_grains]", varName: "Total Animal and Crop Production[Grains]" }, { varId: "_total_animal_and_crop_production[_othercrops]", varName: "Total Animal and Crop Production[OtherCrops]" }, { varId: "_total_animal_and_crop_production[_pasmeat]", varName: "Total Animal and Crop Production[PasMeat]" }, { varId: "_total_animal_and_crop_production[_pulses]", varName: "Total Animal and Crop Production[Pulses]" }, { varId: "_total_animal_and_crop_production[_vegfruits]", varName: "Total Animal and Crop Production[VegFruits]" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 489326, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,D){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(M){return D.deserialize(M,I)},serialize(M){return D.serialize(M,E)}}}serializers.extendSerializer=A;const w={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?w.deserialize(B):B},serialize(B){return B instanceof Error?w.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let w=A.DefaultSerializer;function Q(I){w=A.extendSerializer(w,I)}common.registerSerializer=Q;function B(I){return w.deserialize(I)}common.deserialize=B;function D(I){return w.serialize(I)}return common.serialize=D,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function w(D){return!(!D||typeof D!="object")}function Q(D){return D&&typeof D=="object"&&D[A.$transferable]}transferable.isTransferDescriptor=Q;function B(D,I){if(!I){if(!w(D))throw Error();I=[D]}return{[A.$transferable]:!0,send:D,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(w){w.cancel="cancel",w.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(w){w.error="error",w.init="init",w.result="result",w.running="running",w.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const D=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!D)},w=function(D,I){self.postMessage(D,I)},Q=function(D){const I=M=>{D(M.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},w=function(E){self.postMessage(E)};let Q=!1;const B=new Set,D=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:D},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const w=A(requireWorker_threads());function Q(M){if(!M)throw Error("Invariant violation: MessagePort to parent is not available.");return M}const B=function(){return!w.default().isMainThread},D=function(K,i){Q(w.default().parentPort).postMessage(K,i)},I=function(K){const i=w.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const a=O=>{K(O)},k=()=>{Q(i).off("message",a)};return Q(i).on("message",a),k};function E(){w.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:D,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const w=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),D=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=D?I():w.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var w=worker&&worker.__awaiter||function(o,P,n,F){function Z(j){return j instanceof n?j:new n(function(b){b(j)})}return new(n||(n=Promise))(function(j,b){function V(l){try{v(F.next(l))}catch(X){b(X)}}function $(l){try{v(F.throw(l))}catch(X){b(X)}}function v(l){l.done?j(l.value):Z(l.value).then(V,$)}v((F=F.apply(o,P||[])).next())})},Q=worker&&worker.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),D=requireCommon(),I=requireTransferable(),E=requireMessages(),M=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=M.default.isWorkerRuntime;let a=!1;const k=new Map,O=o=>o&&o.type===E.MasterMessageType.cancel,t=o=>o&&o.type===E.MasterMessageType.run,N=o=>B.default(o)||f(o);function f(o){return o&&typeof o=="object"&&typeof o.subscribe=="function"}function y(o){return I.isTransferDescriptor(o)?{payload:o.send,transferables:o.transferables}:{payload:o,transferables:void 0}}function U(){const o={type:E.WorkerMessageType.init,exposed:{type:"function"}};M.default.postMessageToMaster(o)}function m(o){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:o}};M.default.postMessageToMaster(P)}function c(o,P){const{payload:n,transferables:F}=y(P),Z={type:E.WorkerMessageType.error,uid:o,error:D.serialize(n)};M.default.postMessageToMaster(Z,F)}function H(o,P,n){const{payload:F,transferables:Z}=y(n),j={type:E.WorkerMessageType.result,uid:o,complete:P?!0:void 0,payload:F};M.default.postMessageToMaster(j,Z)}function J(o,P){const n={type:E.WorkerMessageType.running,uid:o,resultType:P};M.default.postMessageToMaster(n)}function h(o){try{const P={type:E.WorkerMessageType.uncaughtError,error:D.serialize(o)};M.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,o)}}function q(o,P,n){return w(this,void 0,void 0,function*(){let F;try{F=P(...n)}catch(j){return c(o,j)}const Z=N(F)?"observable":"promise";if(J(o,Z),N(F)){const j=F.subscribe(b=>H(o,!1,D.serialize(b)),b=>{c(o,D.serialize(b)),k.delete(o)},()=>{H(o,!0),k.delete(o)});k.set(o,j)}else try{const j=yield F;H(o,!0,D.serialize(j))}catch(j){c(o,D.serialize(j))}})}function x(o){if(!M.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(a)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(a=!0,typeof o=="function")M.default.subscribeToMasterMessages(P=>{t(P)&&!P.method&&q(P.uid,o,P.args.map(D.deserialize))}),U();else if(typeof o=="object"&&o){M.default.subscribeToMasterMessages(n=>{t(n)&&n.method&&q(n.uid,o[n.method],n.args.map(D.deserialize))});const P=Object.keys(o).filter(n=>typeof o[n]=="function");m(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${o}`);M.default.subscribeToMasterMessages(P=>{if(O(P)){const n=P.uid,F=k.get(n);F&&(F.unsubscribe(),k.delete(n))}})}A.expose=x,typeof self<"u"&&typeof self.addEventListener=="function"&&M.default.isWorkerRuntime()&&(self.addEventListener("error",o=>{setTimeout(()=>h(o.error||o),250)}),self.addEventListener("unhandledrejection",o=>{const P=o.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&M.default.isWorkerRuntime()&&(process.on("uncaughtException",o=>{setTimeout(()=>h(o),250)}),process.on("unhandledRejection",o=>{o&&typeof o.message=="string"&&setTimeout(()=>h(o),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var w;let Q=1;for(const B of A){Q+=2;const D=((w=B.subscriptIndices)==null?void 0:w.length)||0;Q+=D}return Q}function encodeVarIndices(A,w){let Q=0;w[Q++]=A.length;for(const B of A){w[Q++]=B.varIndex;const D=B.subscriptIndices,I=D?.length||0;w[Q++]=I;for(let E=0;E<I;E++)w[Q++]=D[E]}}function getEncodedLookupBufferLengths(A){var w,Q;let B=1,D=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const M=((w=E.subscriptIndices)==null?void 0:w.length)||0;B+=M,B+=2,D+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:D}}function encodeLookups(A,w,Q){let B=0;w[B++]=A.length;let D=0;for(const I of A){const E=I.varRef.varSpec;w[B++]=E.varIndex;const M=E.subscriptIndices,K=M?.length||0;w[B++]=K;for(let i=0;i<K;i++)w[B++]=M[i];I.points!==void 0?(w[B++]=D,w[B++]=I.points.length,Q?.set(I.points,D),D+=I.points.length):(w[B++]=-1,w[B++]=0)}}function decodeLookups(A,w){const Q=[];let B=0;const D=A[B++];for(let I=0;I<D;I++){const E=A[B++],M=A[B++],K=M>0?Array(M):void 0;for(let t=0;t<M;t++)K[t]=A[B++];const i=A[B++],a=A[B++],k={varIndex:E,subscriptIndices:K};let O;i>=0?w?O=w.slice(i,i+a):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:k},points:O})}return Q}function resolveVarRef(A,w,Q){if(!w.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(w.varId){const B=A?.getSpecForVarId(w.varId);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${w.varId}`)}else{const B=A?.getSpecForVarName(w.varName);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${w.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Int32Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Float64Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,w){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=w(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,w){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=w(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,w,Q){const B=A.length,D=w.varIds.length*w.seriesLength;let I;const E=w.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let M,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const q of Q.lookups)resolveVarRef(this.listing,q.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);M=h.lookupsLength,K=h.lookupIndicesLength}else M=0,K=0;let i=0;function a(h,q){const x=i,o=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(q*o),n=Math.ceil(P/8)*8;return i+=n,x}const k=a("int32",headerLengthInElements),O=a("float64",extrasLengthInElements),t=a("float64",B),N=a("float64",D),f=a("int32",I),y=a("float64",M),U=a("int32",K),m=i;if(this.encoded===void 0||this.encoded.byteLength<m){const h=Math.ceil(m*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,k,headerLengthInElements)}const c=this.header.view;let H=0;c[H++]=O,c[H++]=extrasLengthInElements,c[H++]=t,c[H++]=B,c[H++]=N,c[H++]=D,c[H++]=f,c[H++]=I,c[H++]=y,c[H++]=M,c[H++]=U,c[H++]=K,this.inputs.update(this.encoded,t,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,N,D),this.outputIndices.update(this.encoded,f,I),this.lookups.update(this.encoded,y,M),this.lookupIndices.update(this.encoded,U,K);const J=this.inputs.view;for(let h=0;h<A.length;h++){const q=A[h];typeof q=="number"?J[h]=q:J[h]=q.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const w=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<w)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let D=0;const I=B[D++],E=B[D++],M=B[D++],K=B[D++],i=B[D++],a=B[D++],k=B[D++],O=B[D++],t=B[D++],N=B[D++],f=B[D++],y=B[D++],U=E*Float64Array.BYTES_PER_ELEMENT,m=K*Float64Array.BYTES_PER_ELEMENT,c=a*Float64Array.BYTES_PER_ELEMENT,H=O*Int32Array.BYTES_PER_ELEMENT,J=N*Float64Array.BYTES_PER_ELEMENT,h=y*Int32Array.BYTES_PER_ELEMENT,q=w+U+m+c+H+J+h;if(A.byteLength<q)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,M,K),this.outputs.update(this.encoded,i,a),this.outputIndices.update(this.encoded,k,O),this.lookups.update(this.encoded,t,N),this.lookupIndices.update(this.encoded,f,y)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,w){if(w&&w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);this.originalData=w,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,w){if(w){if(w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=w.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,w){return this.getValue(A,!1,w)}getValueForY(A){if(this.invertedData===void 0){const w=this.activeSize*2,Q=this.activeData,B=Array(w);for(let D=0;D<w;D+=2)B[D]=Q[D+1],B[D+1]=Q[D];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,w,Q){if(this.activeSize===0)return _NA_;const B=w?this.invertedData:this.activeData,D=this.activeSize*2,I=!w;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let M=E;M<D;M+=2){const K=B[M];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=M),M===0||K===A)return B[M+1];switch(Q){default:case"interpolate":{const i=B[M-2],a=B[M-1],k=B[M+1],O=K-i,t=k-a;return a+t/O*(A-i)}case"forward":return B[M+1];case"backward":return B[M-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=D),B[D-1]}getValueForGameTime(A,w){if(this.activeSize<=0)return w;const Q=this.activeData[0];return A<Q?w:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,w){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(w){case"forward":{A=Math.floor(A);for(let D=0;D<B;D+=2)if(Q[D]>=A)return Q[D+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let D=2;D<B;D+=2)if(Q[D]>=A)return Q[D-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let D=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw D+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",D+="results that may differ from those produced by SDEverywhere.",new Error(D)}for(let D=2;D<B;D+=2){const I=Q[D];if(I>=A){const E=Q[D-2],M=Q[D-1],K=Q[D+1],i=I-E,a=K-M;return M+a/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const w=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,D){return B?B.getValueForGameTime(A.currentTime,D):D},INTEG(B,D){return B+D*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,D){return Math.max(B,D)},MIN(B,D){return Math.min(B,D)},MODULO(B,D){return B%D},POW(B,D){return Math.pow(B,D)},POWER(B,D){return Math.pow(B,D)},PULSE(B,D){return pulse(A,B,D)},PULSE_TRAIN(B,D,I,E){const M=Math.floor((E-B)/I);for(let K=0;K<=M;K++)if(A.currentTime<=E&&pulse(A,B+K*I,D))return 1;return 0},QUANTUM(B,D){return D<=0?B:D*Math.trunc(B/D)},RAMP(B,D,I){return A.currentTime>D?A.currentTime<I||D>I?B*(A.currentTime-D):B*(I-D):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,D){return A.currentTime+A.timeStep/2>D?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,D,I){if(D>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${D})`);let E=Q.get(D);if(E===void 0){E=Array(D);for(let i=0;i<D;i++)E[i]={x:0,ind:0};Q.set(D,E)}let M=w.get(D);M===void 0&&(M=Array(D),w.set(D,M));for(let i=0;i<D;i++)E[i].x=B[i],E[i].ind=i;const K=I>0?1:-1;E.sort((i,a)=>{let k;return i.x<a.x?k=-1:i.x>a.x?k=1:k=0,k*K});for(let i=0;i<D;i++)M[i]=E[i].ind;return M},XIDZ(B,D,I){return Math.abs(D)<EPSILON?I:B/D},ZIDZ(B,D){return Math.abs(D)<EPSILON?0:B/D},createLookup(B,D){return new JsModelLookup(B,D)},LOOKUP(B,D){return B?B.getValueForX(D,"interpolate"):_NA_},LOOKUP_FORWARD(B,D){return B?B.getValueForX(D,"forward"):_NA_},LOOKUP_BACKWARD(B,D){return B?B.getValueForX(D,"backward"):_NA_},LOOKUP_INVERT(B,D){return B?B.getValueForY(D):_NA_},WITH_LOOKUP(B,D){return D?D.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,D,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(D,E):_NA_}}}function pulse(A,w,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>w&&B<w+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const w=process.hrtime(A);return(w[0]*1e9+w[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var w;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const D=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<D)&&(this.outputs=new Float64Array(D));const I=this.outputs,E=perfNow();(w=this.onRunModel)==null||w.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const M=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(M)}terminate(){}};function initJsModel(A){let w=A.getModelFunctions();w===void 0&&(w=getJsModelFunctions(),A.setModelFunctions(w));const Q=A.getInitialTime(),B=A.getFinalTime(),D=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(M,K,i)=>{runJsModel(A,Q,B,D,I,E,M,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,w,Q,B,D,I,E,M,K,i,a){let k=w;A.setTime(k);const O={timeStep:B,currentTime:k};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const m of i)A.setLookup(m.varRef.varSpec,m.points);E?.length>0&&A.setInputs(m=>E[m]),A.initLevels();const t=Math.round((Q-w)/B),N=Q;let f=0,y=0,U=0;for(;f<=t;){if(A.evalAux(),k%D<1e-6){U=0;const m=c=>{const H=U*I+y;M[H]=k<=N?c:void 0,U++};if(K!==void 0){let c=0;const H=K[c++];for(let J=0;J<H;J++){const h=K[c++],q=K[c++];let x;q>0&&(x=K.subarray(c,c+q),c+=q);const o={varIndex:h,subscriptIndices:x};A.storeOutput(o,m)}}else A.storeOutputs(m);y++}if(f===t)break;A.evalLevels(),k+=B,A.setTime(k),O.currentTime=k,f++}}var WasmBuffer=class{constructor(A,w,Q,B){this.wasmModule=A,this.numElements=w,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,w;this.heapArray&&((w=(A=this.wasmModule)._free)==null||w.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,w){const B=w*4,D=A._malloc(B),I=D/4,E=A.HEAP32.subarray(I,I+w);return new WasmBuffer(A,w,D,E)}function createFloat64WasmBuffer(A,w){const B=w*8,D=A._malloc(B),I=D/8,E=A.HEAPF64.subarray(I,I+w);return new WasmBuffer(A,w,D,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function w(Q){return A.cwrap(Q,"number",[])()}this.startTime=w("getInitialTime"),this.endTime=w("getFinalTime"),this.saveFreq=w("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var w,Q,B,D,I,E,M;const K=A.getLookups();if(K!==void 0)for(const t of K){const N=t.varRef.varSpec,f=((w=N.subscriptIndices)==null?void 0:w.length)||0;let y;f>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<f)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,f)),this.lookupSubIndicesBuffer.getArrayView().set(N.subscriptIndices),y=this.lookupSubIndicesBuffer.getAddress()):y=0;let U,m;if(t.points){const H=t.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<H)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,H)),this.lookupDataBuffer.getArrayView().set(t.points),U=this.lookupDataBuffer.getAddress(),m=H/2}else U=0,m=0;const c=N.varIndex;this.wasmSetLookup(c,y,U,m)}A.copyInputs((D=this.inputsBuffer)==null?void 0:D.getArrayView(),t=>{var N;return(N=this.inputsBuffer)==null||N.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,t),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),t=>{var N;return(N=this.outputIndicesBuffer)==null||N.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,t),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const a=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<a)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,a));const k=perfNow();this.wasmRunModel(((M=this.inputsBuffer)==null?void 0:M.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(k);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,w,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(w=this.outputsBuffer)==null||w.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,D;Q.ready=new Promise(function(C,g){B=C,D=g}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_arable_land_needed[_grains]","_arable_land_needed[_othercrops]","_arable_land_needed[_pulses]","_arable_land_needed[_vegfruits]","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_conversion","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_by_food_category[_cropmeat]","_caloric_availability_by_food_category[_dairy]","_caloric_availability_by_food_category[_eggs]","_caloric_availability_by_food_category[_grains]","_caloric_availability_by_food_category[_othercrops]","_caloric_availability_by_food_category[_pasmeat]","_caloric_availability_by_food_category[_pulses]","_caloric_availability_by_food_category[_vegfruits]","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_caloric_intake_per_capita_per_day_from_animal_food","_caloric_intake_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_crop_yield_for_each_category[_grains]","_crop_yield_for_each_category[_othercrops]","_crop_yield_for_each_category[_pulses]","_crop_yield_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effect_of_sustainable_agricultural_productivity[_othercrops]","_effect_of_sustainable_agricultural_productivity[_grains]","_effect_of_sustainable_agricultural_productivity[_pulses]","_effect_of_sustainable_agricultural_productivity[_vegfruits]","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_final_feed_share[_othercrops]","_final_feed_share[_grains]","_final_feed_share[_pulses]","_final_feed_share[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_shortage_in_tonnes[_cropmeat]","_food_shortage_in_tonnes[_dairy]","_food_shortage_in_tonnes[_eggs]","_food_shortage_in_tonnes[_grains]","_food_shortage_in_tonnes[_othercrops]","_food_shortage_in_tonnes[_pasmeat]","_food_shortage_in_tonnes[_pulses]","_food_shortage_in_tonnes[_vegfruits]","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_grassland_needed[_dairy]","_grassland_needed[_pasmeat]","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_animal_and_crop_production[_cropmeat]","_total_animal_and_crop_production[_dairy]","_total_animal_and_crop_production[_eggs]","_total_animal_and_crop_production[_grains]","_total_animal_and_crop_production[_othercrops]","_total_animal_and_crop_production[_pasmeat]","_total_animal_and_crop_production[_pulses]","_total_animal_and_crop_production[_vegfruits]","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var M=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function a(C){return Q.locateFile?Q.locateFile(C,i):i+C}var k,O;(M||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(C){try{var g=new XMLHttpRequest;return g.open("GET",C,!1),g.responseType="arraybuffer",g.send(null),new Uint8Array(g.response)}catch(e){var s=wA(C);if(s)return s;throw e}}),k=function(C,g,s){var e=new XMLHttpRequest;e.open("GET",C,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){g(e.response);return}var u=wA(C);if(u){g(u.buffer);return}s()},e.onerror=s,e.send(null)});var t=Q.print||console.log.bind(console),N=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var f;Q.wasmBinary&&(f=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&_("no native wasm support detected");var y,U=!1;function m(C,g){C||_("Assertion failed: "+g)}function c(C){var g=Q["_"+C];return m(g,"Cannot call unknown function "+C+", make sure it is exported"),g}function H(C,g,s,e,u){var z={string:function(Y){var T=0;if(Y!=null&&Y!==0){var eA=(Y.length<<2)+1;T=CA(eA),P(Y,T,eA)}return T},array:function(Y){var T=CA(Y.length);return n(Y,T),T}};function G(Y){return g==="string"?x(Y):g==="boolean"?!!Y:Y}var r=c(C),L=[],S=0;if(e)for(var R=0;R<e.length;R++){var rA=z[s[R]];rA?(S===0&&(S=sA()),L[R]=rA(e[R])):L[R]=e[R]}var IA=r.apply(null,L);function qA(Y){return S!==0&&KA(S),G(Y)}return IA=qA(IA),IA}function J(C,g,s,e){s=s||[];var u=s.every(function(G){return G==="number"}),z=g!=="string";return z&&u&&!e?c(C):function(){return H(C,g,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function q(C,g,s){for(var e=g+s,u=g;C[u]&&!(u>=e);)++u;if(u-g>16&&C.subarray&&h)return h.decode(C.subarray(g,u));for(var z="";g<u;){var G=C[g++];if(!(G&128)){z+=String.fromCharCode(G);continue}var r=C[g++]&63;if((G&224)==192){z+=String.fromCharCode((G&31)<<6|r);continue}var L=C[g++]&63;if((G&240)==224?G=(G&15)<<12|r<<6|L:G=(G&7)<<18|r<<12|L<<6|C[g++]&63,G<65536)z+=String.fromCharCode(G);else{var S=G-65536;z+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return z}function x(C,g){return C?q(Z,C,g):""}function o(C,g,s,e){if(!(e>0))return 0;for(var u=s,z=s+e-1,G=0;G<C.length;++G){var r=C.charCodeAt(G);if(r>=55296&&r<=57343){var L=C.charCodeAt(++G);r=65536+((r&1023)<<10)|L&1023}if(r<=127){if(s>=z)break;g[s++]=r}else if(r<=2047){if(s+1>=z)break;g[s++]=192|r>>6,g[s++]=128|r&63}else if(r<=65535){if(s+2>=z)break;g[s++]=224|r>>12,g[s++]=128|r>>6&63,g[s++]=128|r&63}else{if(s+3>=z)break;g[s++]=240|r>>18,g[s++]=128|r>>12&63,g[s++]=128|r>>6&63,g[s++]=128|r&63}}return g[s]=0,s-u}function P(C,g,s){return o(C,Z,g,s)}function n(C,g){F.set(C,g)}var F,Z,j;function b(C){Q.HEAP8=F=new Int8Array(C),Q.HEAP16=new Int16Array(C),Q.HEAP32=j=new Int32Array(C),Q.HEAPU8=Z=new Uint8Array(C),Q.HEAPU16=new Uint16Array(C),Q.HEAPU32=new Uint32Array(C),Q.HEAPF32=new Float32Array(C),Q.HEAPF64=new Float64Array(C)}Q.INITIAL_MEMORY;var V,$=[],v=[],l=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());DA($)}function GA(){DA(v)}function kA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());DA(l)}function PA(C){$.unshift(C)}function aA(C){v.unshift(C)}function cA(C){l.unshift(C)}var p=0,W=null;function HA(C){p++,Q.monitorRunDependencies&&Q.monitorRunDependencies(p)}function tA(C){if(p--,Q.monitorRunDependencies&&Q.monitorRunDependencies(p),p==0&&W){var g=W;W=null,g()}}Q.preloadedImages={},Q.preloadedAudios={};function _(C){Q.onAbort&&Q.onAbort(C),C="Aborted("+C+")",N(C),U=!0,C+=". Build with -s ASSERTIONS=1 for more info.";var g=new WebAssembly.RuntimeError(C);throw D(g),g}var EA="data:application/octet-stream;base64,";function BA(C){return C.startsWith(EA)}function MA(C){return C.startsWith("file://")}var d;d="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBsLLOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsKzdEPOsEFAgt/AXwjAEEQayIGJAACQEHIpw4oAgAiAgRAIAJB0KcOKAIAIgFB1KcOKAIAbEEDdGpB2KcOKAIAQQN0aiAAOQMAQdCnDiABQQFqNgIADAELQcCnDigCACIBRQRAAn9BoP0FKwMAQfi5BisDAKFB4LoHKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQcCnDkGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQcSnDigCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEHEpw5BxKcOKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoiAiADSQ0ACwsgACADNgIwIAAgATkDKCADQQN0IARqQQhrKwMAIQULIAUPCyACQQN0IARqKwMICzcBAnwgAUHopw4rAwAiA2MEfEEBIAIgA2QgASACZBsEQCADIAGhIACiDwsgAiABoSAAogUgBAsLxA8DBXwIfwJ+RAAAAAAAAPA/IQICQAJAAkAgAb0iD0IgiKciDEH/////B3EiByAPpyIKckUNACAAvSIQpyENQQAgEEIgiKciDkGAgMD/A0YgDRsNACAOQf////8HcSIIQYCAwP8HSyAIQYCAwP8HRiANQQBHcXIgB0GAgMD/B0tyRSAKRSAHQYCAwP8HR3JxRQRAIAAgAaAPCwJAAkACfwJAIBBCAFkNAEECIAdB////mQRLDQEaIAdBgIDA/wNJDQAgB0EUdiELIAdBgICAigRPBEBBACAKQbMIIAtrIgl2IgsgCXQgCkcNAhpBAiALQQFxawwCCyAKDQMgB0GTCCALayIKdiILIAp0IAdHDQJBAiALQQFxayEJDAILQQALIQkgCg0BCyAHQYCAwP8HRgRAIAhBgIDA/wNrIA1yRQ0CIAhBgIDA/wNPBEAgAUQAAAAAAAAAACAPQgBZGw8LRAAAAAAAAAAAIAGaIA9CAFkbDwsgB0GAgMD/A0YEQCAPQgBZBEAgAA8LRAAAAAAAAPA/IACjDwsgDEGAgICABEYEQCAAIACiDwsgDEGAgID/A0cgEEIAU3INACAAnw8LIACZIQIgDkH/////A3FBgIDA/wNHQQAgCBsgDXJFBEBEAAAAAAAA8D8gAqMgAiAPQgBTGyECIBBCAFkNASAJIAhBgIDA/wNrckUEQCACIAKhIgAgAKMPCyACmiACIAlBAUYbDwtEAAAAAAAA8D8hBAJAIBBCAFkNAAJAAkAgCQ4CAAECCyAAIAChIgAgAKMPC0QAAAAAAADwvyEECwJ8IAdBgYCAjwRPBEAgB0GBgMCfBE8EQCAIQf//v/8DTQRARAAAAAAAAPB/RAAAAAAAAAAAIA9CAFMbDwtEAAAAAAAA8H9EAAAAAAAAAAAgDEEAShsPCyAIQf7/v/8DTQRAIAREnHUAiDzkN36iRJx1AIg85Dd+oiAERFnz+MIfbqUBokRZ8/jCH26lAaIgD0IAUxsPCyAIQYGAwP8DTwRAIAREnHUAiDzkN36iRJx1AIg85Dd+oiAERFnz+MIfbqUBokRZ8/jCH26lAaIgDEEAShsPCyACRAAAAAAAAPC/oCIARETfXfgLrlQ+oiAAIACiRAAAAAAAAOA/IAAgAEQAAAAAAADQv6JEVVVVVVVV1T+goqGiRP6CK2VHFfe/oqAiAiACIABEAAAAYEcV9z+iIgKgvUKAgICAcIO/IgAgAqGhDAELIAJEAAAAAAAAQEOiIgAgAiAIQYCAwABJIgcbIQIgAL1CIIinIAggBxsiCkH//z9xIghBgIDA/wNyIQkgCkEUdUHMd0GBeCAHG2ohCkEAIQcCQCAIQY+xDkkNACAIQfrsLkkEQEEBIQcMAQsgCEGAgID/A3IhCSAKQQFqIQoLIAdBA3QiCEGQDWorAwBEAAAAAAAA8D8gCEGADWorAwAiACACvUL/////D4MgCa1CIIaEvyIFoKMiAiAFIAChIgMgB0ESdCAJQQF2akGAgKCAAmqtQiCGvyIGIAMgAqIiA71CgICAgHCDvyICoqEgBSAGIAChoSACoqGiIgAgAiACoiIFRAAAAAAAAAhAoCAAIAMgAqCiIAMgA6IiACAAoiAAIAAgACAAIABE705FSih+yj+iRGXbyZNKhs0/oKJEAUEdqWB00T+gokRNJo9RVVXVP6CiRP+rb9u2bds/oKJEAzMzMzMz4z+goqAiBqC9QoCAgIBwg78iAKIgAyAGIABEAAAAAAAACMCgIAWhoaKgIgMgAyACIACiIgKgvUKAgICAcIO/IgAgAqGhRP0DOtwJx+4/oiAARPUBWxTgLz6+oqCgIgIgCEGgDWorAwAiAyACIABEAAAA4AnH7j+iIgKgoCAKtyIFoL1CgICAgHCDvyIAIAWhIAOhIAKhoQshAyAAIA9CgICAgHCDvyIFoiICIAMgAaIgASAFoSAAoqAiAKAiAb0iD6chBwJAIA9CIIinIghBgIDAhAROBEAgCEGAgMCEBGsgB3INAyAARP6CK2VHFZc8oCABIAKhZEUNAQwDCyAIQYD4//8HcUGAmMOEBEkNACAIQYDovPsDaiAHcg0DIAAgASACoWVFDQAMAwtBACEHIAQCfCAIQf////8HcSIJQYGAgP8DTwR+QQBBgIDAACAJQRR2Qf4Ha3YgCGoiCEH//z9xQYCAwAByQZMIIAhBFHZB/w9xIglrdiIHayAHIA9CAFMbIQcgACACQYCAQCAJQf8Ha3UgCHGtQiCGv6EiAqC9BSAPC0KAgICAcIO/IgFEAAAAAEMu5j+iIgQgACABIAKhoUTvOfr+Qi7mP6IgAUQ5bKgMYVwgvqKgIgKgIgAgACAAIAAgAKIiASABIAEgASABRNCkvnJpN2Y+okTxa9LFQb27vqCiRCzeJa9qVhE/oKJEk72+FmzBZr+gokQ+VVVVVVXFP6CioSIBoiABRAAAAAAAAADAoKMgAiAAIAShoSIBIAAgAaKgoaFEAAAAAAAA8D+gIgC9Ig9CIIinIAdBFHRqIghB//8/TARAIAAgBxATDAELIA9C/////w+DIAitQiCGhL8LoiECCyACDwsgBEScdQCIPOQ3fqJEnHUAiDzkN36iDwsgBERZ8/jCH26lAaJEWfP4wh9upQGiC1IBAX9BOBAUIgJBADoAECACIAA2AgwgAiABNgIIIAJCADcCFCACIAA2AgQgAiABNgIAIAJBADYCMCACQv/////////3/wA3AyggAkIANwIcIAIL/QMBAn8gAkGABE8EQCAAIAEgAhACGg8LIAAgAmohAwJAIAAgAXNBA3FFBEACQCAAQQNxRQRAIAAhAgwBCyACRQRAIAAhAgwBCyAAIQIDQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAkEDcUUNASACIANJDQALCwJAIANBfHEiAEHAAEkNACACIABBQGoiBEsNAANAIAIgASgCADYCACACIAEoAgQ2AgQgAiABKAIINgIIIAIgASgCDDYCDCACIAEoAhA2AhAgAiABKAIUNgIUIAIgASgCGDYCGCACIAEoAhw2AhwgAiABKAIgNgIgIAIgASgCJDYCJCACIAEoAig2AiggAiABKAIsNgIsIAIgASgCMDYCMCACIAEoAjQ2AjQgAiABKAI4NgI4IAIgASgCPDYCPCABQUBrIQEgAkFAayICIARNDQALCyAAIAJNDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAASQ0ACwwBCyADQQRJBEAgACECDAELIAAgA0EEayIESwRAIAAhAgwBCyAAIQIDQCACIAEtAAA6AAAgAiABLQABOgABIAIgAS0AAjoAAiACIAEtAAM6AAMgAUEEaiEBIAJBBGoiAiAETQ0ACwsgAiADSQRAA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA0cNAAsLCxcAIAAtAABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAF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AEGA5wwrAwCiOQMAQeiXDkHogggrAwBB+OYMKwMAojkDAEG4lg5BuIEIKwMAQcjlDCsDAKI5AwBB4JcOQeCCCCsDAEHw5gwrAwCiOQMAQbCWDkGwgQgrAwBBwOUMKwMAojkDAEHYlw5B2IIIKwMAQejmDCsDAKI5AwBBqJYOQaiBCCsDAEG45QwrAwCiOQMAQdCXDkHQgggrAwBB4OYMKwMAojkDAEGglg5BoIEIKwMAQbDlDCsDAKI5AwBByJcOQciCCCsDAEHY5gwrAwCiOQMAQZiWDkGYgQgrAwBBqOUMKwMAojkDAEHAlw5BwIIIKwMAQdDmDCsDAKI5AwBBkJYOQZCBCCsDAEGg5QwrAwCiOQMAQbiXDkG4gggrAwBByOYMKwMAojkDAEGIlg5BiIEIKwMAQZjlDCsDAKI5AwBBsJcOQbCCCCsDAEHA5gwrAwCiOQMAQYCWDkGAgQgrAwBBkOUMKwMAojkDAEGolw5BqIIIKwMAQbjmDCsDAKI5AwBB+JUOQfiACCsDAEGI5QwrAwCiOQMAQaCXDkGggggrAwBBsOYMKwMAojkDAEHQmQ5BsIcIKwMAQZDmDCsDAKI5AwBB+JoOQdiICCsDAEG45wwrAwCiOQMAQciZDkGohwgrAwBBiOYMKwMAojkDAEHwmg5B0IgIKwMAQbDnDCsDAKI5AwBBwJkOQaCHCCsDAEGA5gwrAwCiOQMAQeiaDkHIiAgrAwBBqOcMKwMAojkDAEG4mQ5BmIcIKwMAQfjlDCsDAKI5AwBB4JoOQcCICCsDAEGg5wwrAwCiOQMAQbCZDkGQhwgrAwBB8OUMKwMAojkDAEHYmg5BuIgIKwMAQZjnDCsDAKI5AwBBqJkOQYiHCCsDAEHo5QwrAwCiOQMAQdCaDkGwiAgrAwBBkOcMKwMAojkDAEGgmQ5BgIcIKwMAQeDlDCsDAKI5AwBByJoOQaiICCsDAEGI5wwrAwCiOQMAQZiZDkH4hggrAwBB2OUMKwMAojkDAEHAmg5BoIgIKwMAQYDnDCsDAKI5AwBBkJkOQfCGCCsDAEHQ5QwrAwCiOQMAQbiaDkGYiAgrAwBB+OYMKwMAojkDAEGImQ5B6IYIKwMAQcjlDCsDAKI5AwBBsJoOQZCICCsDAEHw5gwrAwCiOQMAQYCZDkHghggrAwBBwOUMKwMAojkDAEGomg5BiIgI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NwMAQbDUBUKAgICAoLqLssEANwMAQajUBUKAgICA4Iaus8EANwMAQaDUBUKAgICAgICA+D83AwBB6NYFQoCAgICAgID4PzcDAEHY1wVCgICAgICA3PfAADcDAEHQ1wVCgICAgIDM0YDBADcDAEHI1wVCgICAgIC3lIjBADcDAEHA1wVCgICAgICUsIzBADcDAEG41wVCgICAgKC+xpDBADcDAEGw1wVCgICAgODGrJPBADcDAEGo1wVCgICAgMCJw5bBADcDAEGg1wVCgICAgIDh/5jBADcDAEGY1wVCgICAgMDU6prBADcDAEGQ1wVCgICAgMDW25zBADcDAEGI1wVCgICAgODJ9p7BADcDAEGA1wVCgICAgICAgPg/NwMAQfjWBUKAgICAgICA+D83AwBB8NYFQoCAgICAgID4PzcDAEHg1gVCgICAgICAqLHAADcDAEHY1gVCgICAgICAtMPAADcDAEHQ1gVCgICAgICAxdTAADcDAEHI1gVCgICAgIDQyuPAADcDAEHA1gVCgICAgIDE2fLAADcDAEG41gVCgICAgICokv/AADcDAEGw1gVCgICAgIC/6YnBADcDAEGo1gVCgICAgOD+5ZLBADcDAEGg1gVCgICAgODEmZrBADcDAEGY1gVCgICAgICZvJ/BADcDAEGQ1gVCgICAgMCN2KLBADcDAEGI1gVCgICAgODYl6bBADcDAEGA1gVCgICAgPj1ianBADcDAEH41QVCgICAgPjYn6vBADcDAEHw1QVCgICAgKipxa3BADcDAEG42QVCgICAgICAgPg/NwMAQbDZBUKAgICAgIDIvcAANwMAQajZBUKAgICAgMCr0MAANwMAQaDZBUKAgICAgKCV4cAANwMAQZjZBUKAgICAgOy78MAANwMAQZDZBUKAgICAgLTS/8AANwMAQYjZBUKAgICAgIKJi8EANwMAQYDZBUKAgICAoM2ulsEANwMAQfjYBUKAgICAoNHkn8EANwMAQfDYBUKAgICAwOz0psEANwMAQejYBUKAgICA6NGnq8EANwMAQeDYBUKAgICAwKrQr8EANwMAQdjYBUKAgICA2LCvssEANwMAQdDYBUKAgICA2O6itcEANwMAQcjYBUKAgICAqMCcuMEANwMAQcDYBUKAgICA8JTzucEANwMAQbjYBUKAgICAwLPPu8EANwMAQbDYBUKAgICA9PbRvcEANwMAQajYBUKAgICAnIDtwMEANwMAQaDYBUKAgICAluqBxcEANwMAQZjYBUKAgICAj93SycEANwMAQZDYBUKAgICAmrmJy8EANwMAQYjYBUKAgICAgICAn8AANwMAQYDYBUKAgICAgICQscAANwMAQfjXBUKAgICAgICEwsAANwMAQfDXBUKAgICAgICi0cAANwMAQejXBUKAgICAgNDH4MAANwMAQeDXBUKAgICAgNiO7MAANwMAQcjZBUKAgICAiP+euMEANwMAQcDZBUKAgICAgICA+D83AwBB4NoFQoCAgICAgID4PzcDAEG42wVCgICAgMCy/aDBADcDAEGw2wVCgICAgMCctKTBADcDAEGo2wVCgICAgND0najBADcDAEGg2wVCgICAgNjuxKrBADcDAEGY2wVCgICAgICqh63BADcDAEGQ2wVCgICAgMiZ3K/BADcDAEGI2wVCgICAgPT7nLHBADcDAEGA2wVCgICAgMCd6rLBADcDAEH42gVCgICAgKivt7TBADcDAEHw2gVCgICAgICAgPg/NwMAQejaBUKAgICAgICA+D83AwBB2NoFQoCAgICAgNi0wAA3AwBB0NoFQoCAgICAgMzHwAA3AwBByNoFQoCAgICAoMnYwAA3AwBBwNoFQoCAgICA8OrnwAA3AwBBuNoFQoCAgICApND2wAA3AwBBsNoFQoCAgICA+KyCwQA3AwBBqNoFQoCAgICAkLeNwQA3AwBBoNoFQoCAgICgquGWwQA3AwBBmNoFQoCAgICA5/idwQA3AwBBkNoFQoCAgIDwyMmiwQA3AwBBiNoFQoCAgICArc6mwQA3AwBBgNoFQoCAgIDgj9mpwQA3AwBB+NkFQoCAgICwvLSswQA3AwBB8NkFQoCAgIDwm7CvwQA3AwBB6NkFQoCAgIDw6KCxwQA3AwBB4NkFQoCAgIDQ3+6ywQA3AwBB2NkFQoCAgICgvOC0wQA3AwBB0NkFQoCAgIDYh9K2wQA3AwBBiNwFQoCAgICAgID4PzcDAEGo3QVCgICAgICAwKDAADcDAEGg3QVCgICAgICA0LLAADcDAEGY3QVCgICAgICA0sPAADcDAEGQ3QVCgICAgIDA4NLAADcDAEGI3QVCgICAgIDw9+HAADcDAEGA3QVCgICAgICQiO7AADcDAEH43AVCgICAgIDsj/nAADcDAEHw3AVCgICAgIC9g4LBADcDAEHo3AVCgICAgIC8vInBADcDAEHg3AVCgICAgMCEr47BADcDAEHY3AVCgICAgIDK9pHBADcDAEHQ3AVCgICAgOCglpXBADcDAEHI3AVCgICAgOCLt5jBADcDAEHA3AVCgICAgOCHuZrBADcDAEG43AVCgICAgODgyZzBADcDAEGw3AVCgICAgMDG4Z7BADcDAEGo3AVCgICAgID+1KDBADcDAEGg3AVCgICAgICAgPg/NwMAQZjcBUKAgICAgICA+D83AwBBkNwFQoCAgICAgID4PzcDAEGA3AVCgICAgICA4LLAADcDAEH42wVCgICAgICAoMXAADcDAEHw2wVCgICAgICAx9bAADcDAEHo2wVCgICAgICQueXAADcDAEHg2wVCgICAgIDwtfTAADcDAEHY2wVCgICAgICL5YDBADcDAEHQ2wVCgICAgIDos4vBADcDAEHI2wVCgICAgOCrxJTBADcDAEHA2wVCgICAgIDL65vBADcDAEG43QVC5syZs+bMmfM/NwMAQbDdBULJpJLJpJLJ/D83AwBB+N0FQrPmzJmz5szxPzcDAEHw3QVCs+bMmbPmzOk/NwMAQejdBUKAgICAgICA9D83AwBB4N0FQs2Zs+bMmbP6PzcDAEGA3gVC5syZs+bMmfc/NwMAQbjfBUKAgIDAgYv22MEANwMAQdjgBUKAgICAgPK2gMEANwMAQdDgBUKAgICAgLekmMEANwMAQcjgBUKAgICAuNLaqcEANwMAQcDgBUKAgICA0MbltcEANwMAQbjgBUKAgICAwKzGvMEANwMAQbDgBUKAgICA4oSbw8EANwMAQajgBUKAgICAyrHWx8EANwMAQaDgBUKAgICA643PycEANwMAQZjgBUKAgICArum/y8EANwMAQZDgBUKAgICA/ozHzMEANwMAQYjgBUKAgICAwNjxz8EANwMAQYDgBUKAgICA7Jr30cEANwMAQfjfBUKAgICAqaSG08EANwMAQfDfBUKAgICAj4HX1MEANwMAQejfBUKAgICA8s2D1sEANwMAQeDfBUKAgICAwdjm1sEANwMAQdjfBUKAgICAz5SJ18EANwMAQdDfBUKAgICA6Yit2MEANwMAQcjfBUKAgIDAr6WE2cEANwMAQcDfBUKAgIDAtrLx2MEANwMA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ptDAADcDAEHY8QVCgICAgIDAptDAADcDAEHQ8QVCgICAgIDAptDAADcDAEHI8QVCgICAgIDAptDAADcDAEHA8QVCgICAgIDAptDAADcDAEG48QVCgICAgIDAkNHAADcDAEGw8QVCgICAgIDAu9DAADcDAEGo8QVCgICAgICA+M/AADcDAEGg8QVCgICAgICAz8zAADcDAEGQ8QVCgICAgIDAkNHAADcDAEGI8QVCgICAgIDAkNHAADcDAEGA8QVCgICAgIDAkNHAADcDAEH48AVCgICAgIDAkNHAADcDAEHw8AVCgICAgIDAkNHAADcDAEHo8AVCgICAgIDAkNHAADcDAEHg8AVCgICAgIDAkNHAADcDAEHY8AVCgICAgIDAkNHAADcDAEHQ8AVCgICAgIDA+tHAADcDAEHI8AVCgICAgIDA+tHAADcDAEHA8AVCgICAgIDA+tHAADcDAEG48AVCgICAgIDA+tHAADcDAEGw8AVCgICAgICA5dLAADcDAEGo8AVCgICAgICA5dLAADcDAEGg8AVCgICAgICA5dLAADcDAEGY8AVCgICAgICA5dLAADcDAEGQ8AVCgICAgICAz9PAADcDAEGI8AVCgICAgICAutPAADcDAEGA8AVCgICAgICA5tDAADcDAEH47wVCgICAgICApM3AADcDAEHw7wVCgICAgICAwsrAADcDAEHA8gVCgICAgICAgPg/NwMAQcjyBUKAgICAgICA+D83AwBB0PIFQoCAgICAgID4PzcDAEHY8gVCmrPmzJmz5vQ/NwMAQeDyBUIANwMAQejyBUKAgICAgICA+j83AwBB8PIFQoCAgICAgICKwAA3AwBB+PIFQvCW7Mj+w5/gPTcDAEGA8wVCnrPBkMqpst89NwMAQZDzBUKAgICAgICA+D83AwBBiPMFQoCAgICAgID4PzcDAEGY8wVCgICAgICAgPg/NwMAQaDzBUKAgICAgICA+D83AwBBqPMFQoCAgICAgMzYwAA3AwBBsPMFQoCAgICAgMzYwAA3AwBBuPMFQoCAgICAgMzYwAA3AwBBwPMFQoCAgICAgMzYwAA3AwBByPMFQrnoorbn96e9v383AwBB0PMFQoG68tH7uPSEPzcDAEHY8wVCjM7V+YXq56s+NwMAQeDzBUKAgICAgICAksAANwMAQejzBUKAgICAgIDApMAA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sNqsoMEANwMAQbjKBkKAgICAgLrmocEANwMAQbDKBkKAgICA8Iugo8EANwMAQajKBkKAgICAkLLVpMEANwMAQaDKBkKAgICAgICA+D83AwBBwMsGQoCAgICAgID4PzcDAEHgzAZCgICAgICAoKLAADcDAEHYzAZCgICAgICA4LTAADcDAEHQzAZCgICAgICA/sXAADcDAEHIzAZCgICAgICA9dTAADcDAEHAzAZCgICAgICQ9+PAADcDAEG4zAZCgICAgIDYuPDAADcDAEGwzAZCgICAgICc+vrAADcDAEGozAZCgICAgICGhYTBADcDAEGgzAZCgICAgIDlr4vBADcDAEGYzAZCgICAgICG0JDBADcDAEGQzAZCgICAgODH9ZPBADcDAEGIzAZCgICAgIDT6JfBADcDAEGAzAZCgICAgMDSj5rBADcDAEH4ywZCgICAgICyxZzBADcDAEHwywZCgICAgIDojJ/BADcDAEHoywZCgICAgICw7qDBADcDAEHgywZCgICAgPDEs6LBADcDAEHYywZCgICAgODK+KPBADcDAEHQywZCgICAgICAgPg/NwMAQcjLBkKAgICAgICA+D83AwBBuMsGQoCAgICAgOChwAA3AwBBsMsGQoCAgICAgIC0wAA3AwBBqMsGQoCAgICAgJbFwAA3AwBBoMsGQoCAgICAwJXUwAA3AwBBmMsGQoCAgICA4J7jwAA3AwBBkMsGQoCAgICAoPTvwAA3AwBBiMsGQoCAgICAhqn6wAA3AwBBgMsGQoCAgICA6quDwQA3AwBB+MoGQoCAgIDAwduKwQA3AwBB6MwGQoCAgICAgID4PzcDAEGIzgZCgICAgICAgJDAADcDAEGAzgZCgICAgICAoKLAADcDAEH4zQZCgICAgICAmLPAADcDAEHwzQZCgICAgICAqsLAADcDAEHozQZCgICAgIDAxdHAADcDAEHgzQZCgICAgICAwd3AADcDAEHYzQZCgICAgIDg4ejAADcDAEHQzQZCgICAgIDs0PHAADcDAEHIzQZCgICAgIDQjPnAADcDAEHAzQZCgICAgIC85v3AADcDAEG4zQZCgICAgIC5xIHBADcDAEGwzQZCgICAgIDd04TBADcDAEGozQZCgICAgIDCjIjBADcDAEGgzQZCgICAgMCnhIrBADcDAEGYzQZCgICAgMCfiozBADcDAEGQzQZCgICAgICAl47BADcDAEGIzQZCgICAgMCdqZDBADcDAEGAzQZCgICAgICAgPg/NwMAQfjMBkKAgICAgICA+D83AwBB8MwGQoCAgICAgID4PzcDAEHQzgZCgICAgKCx5qbBADcDAEHIzgZCgICAgIDRlanBADcDAEHAzgZCgICAgOD/hKvBADcDAEG4zgZCgICAgLDL+qzBADcDAEGwzgZCgICAgODumq/BADcDAEGozgZCgICAgNCz77HBADcDAEGgzgZCgICAgNDFwbbBADcDAEGYzgZCgICAgLDq4LrBADcDAEGQzgZCgICAgIjKrLzBADcDAEG4zwZCgICAgICAgPg/NwMAQbDPBkKAgICAgICQr8AANwMAQajPBkKAgICAgICmwcAANwMAQaDPBkKAgICAgMCc0sAANwMAQZjPBkKAgICAgNC44cAANwMAQZDPBkKAgICAgLjc8MAANwMAQYjPBkKAgICAgIys/MAANwMAQYDPBkKAgICAgI2BiMEANwMAQfjOBkKAgICAgMzmkMEANwMAQfDOBkKAgICAoKKomMEANwMAQejOBkKAgICA4J/OnMEANwMAQeDOBkKAgICAgKPboMEANwMAQdjOBkKAgICA4JLIo8EANwMAQcDQBkKAgICAgIDq2MAANwMAQbjQBkKAgICAgPCT6MAANwMAQbDQBkKAgICAgLTF88AANwMAQajQBkKAgICAgP78/sAANwMAQaDQBkKAgICAwLGdiMEANwMAQZjQBkKAgICAwJzGj8EANwMAQZDQBkKAgICAgK3lk8EANwMAQYjQBkKAgICA4OaSmMEANwMAQYDQBkKAgICAwPvnmsEANwMAQfjPBkKAgICAgKXrncEANwMAQfDPBkKAgICAkK/JoMEANwMAQejPBkKAgICAoJeposEANwMAQeDPBkKAgICA4OeOpMEANwMAQdjPBkKAgICA0K2cpsEANwMAQdDPBkKAgICAuO+UqMEANwMAQcjPBkKAgICA+LSYqcEANwMAQcDPBkKAgICAgICA+D83AwBBiNIGQoCAgICAgID4PzcDAEHg0AZCgICAgICAgPg/NwMAQbDSBkKAgICAoMGdkMEANwMAQajSBkKAgICAgM/UkcEANwMAQaDSBkKAgICAgICA+D83AwBBmNIGQoCAgICAgID4PzcDAEGQ0gZCgICAgICAgPg/NwMAQYDSBkKAgICAgICApMAANwMAQfjRBkKAgICAgIDgtsAANwMAQfDRBkKAgICAgICPyMAANwMAQejRBkKAgICAgID/1sAANwMAQeDRBkKAgICAgPDs5cAANwMAQdjRBkKAgICAgMjm8cAANwMAQdDRBkKAgICAgOjb/MAANwMAQcjRBkKAgICAgP78hcEANwMAQcDRBkKAgICAgIKajcEANwMAQbjRBkKAgICAgNeBksEANwMAQbDRBkKAgICAwIHrlcEANwMAQajRBkKAgICAoJqXmcEANwMAQaDRBkKAgICAgI3gm8EANwMAQZjRBkKAgICAoNfHnsEANwMAQZDRBkKAgICA8PHhoMEANwMAQYjRBkKAgICAoPGkosEANwMAQYDRBkKAgICA4OKJpMEANwMAQfjQBkKAgICA4MLupcEANwMAQfDQBkKAgICAgICA+D83AwBB6NAGQoCAgICAgID4PzcDAEHY0AZCgICAgICAoKbAADcDAEHQ0AZCgICAgICA2LjAADcDAEHI0AZCgICAgICAx8nAADcDAEGw0wZCgICAgKCY+5TBADcDAEG40wZC/NPGl93JmKg/NwMAQcDTBkKAgICAgICAhMAANwMAQcjTBkL7qLi9lNye2j83AwBBqNMGQoCAgICAgICSwAA3AwBBoNMGQoCAgICAgOCjwAA3AwBBmNMGQoCAgICAgIC1wAA3AwBBkNMGQoCAgICAgIDEwAA3AwBBiNMGQoCAgICAwIrTwAA3AwBBgNMGQoCAgICAoNffwAA3AwBB+NIGQoCAgICAoJbqwAA3AwBB8NIGQoCAgICAmJfzwAA3AwBB6NIGQoCAgICAgsj6wAA3AwBB4NIGQoCAgICArIGAwQA3AwBB2NIGQoCAgICA6IiDwQA3AwBB0NIGQoCAgICAqtiGwQA3AwBByNIGQoCAgIDApLOJwQA3AwBBwNIGQoCAgICA+dKLwQA3AwBBuNIGQoCAgIDAg4OOwQA3AwBB0NMGQoCAgICAgICKwAA3AwBB2NMGQoCAgICAgICKwAA3AwBB4NMGQoCAgICAgICKwAA3AwBB6NMGQoCAgICAgICKwAA3AwBB8NMGQoCAgICAgICKwAA3AwBBmNQGQQBBMBAQGkGo1QZCgICAgICAgPw/NwMAQcjUBkIANwMAQbDVBkLP78+a3vSm+j83AwBB6NYGQvfPsJrnsI/ZPzcDAEGI2AZCvZTcnoq+9NPAADcDAEGA2AZCmrPmzJmzlejAADcDAEH41wZCmrPmzJmDmeTAADcDAEHw1wZCuL2U3J66vNvAADcDAEHo1wZCzZmz5szJoOrAADcDAEHg1wZClNyeiq63puHAADcDAEHY1wZCuL2U3J6i59jAADcDAEHQ1wZC18fC66PR3dPAADcDAEHI1wZCn4quj4XXoNDAADcDAEHA1wZCpOH10fCK29DAADcDAEG41wZClNyeiq7vvNDAADcDAEGw1wZCyMLro+G19snAADcDAEGo1wZCyMLro+H11snAADcDAEGg1wZCj4XXx8LrhsvAADcDAEGY1wZC/NPGl92Jp8bAADcDAEGQ1wZCnbSR2/O74sPAADcDAEGI1wZC3vSm4qDAjcXAADcDAEGA1wZC6KK25/enzMbAADcDAEH41gZC4qDgysP2vsPAADcDAEHw1gZC2sjt+f2JjMXAADcDAEHo1QZCyMLro+G1iczAADcDAEHg1QZC0vD6qLj9xcvAADcDAEHY1QZChdfHwuujy8rAADcDAEHQ1QZC1py0kduTocbAADcDAEHI1QZCiYOBq46at77AADcDAEHA1QZC35uC88PWutc/NwMAQeDWBkLh9dHw+pD04MAANwMAQdjWBkKAgICAgODz5MAANwMAQdDWBkLS8PqouNXz3cAANwMAQcjWBkKAgICAgJDm1MAANwMAQcDWBkLmzJmz5ry/5cAANwMAQbjWBkL50puJg+G8xsAANwMAQbDWBkKk4fXR8Lr2zsAANwMAQajWBkK9lNyeiu7gz8AANwMAQaDWBkKAgICAgJD51cAANwMAQZjWBkLmzJmz5qy418AANwMAQZDWBkKuj4XXx7Kf08AANwMAQYjWBkLXx8Lro/Ge0cAANwMAQYDWBkKKro+F14ecy8AANwMAQfjVBkL20fD6qJjwy8AANwMAQfDVBkKuj4XXx8KXzsAANwMAQZDYBkIANwMAQejYBkLUquudzJup2z83AwBB4NgGQqL/idzYos34PzcDAEHY2AZCzcnv7OaNk4rAADcDAEHQ2AZC/5rZxvqQkorAADcDAEHI2AZCn9zk8c7Sw/w/NwMAQcDYBkLQmt70puLA+T83AwBBuNgGQuKIwse2nOLsPzcDAEHI2QZC3/aZy4TQ5vU/NwMAQdDZBkLNmbPmzJmz/j83AwBBkNoGQoCAgICAgICAwAA3AwBBmNoGQrPmzJmz5sz7PzcDAEGg2gZC7vn9qePL7vA/NwMAQajaBkL/pqiIgY6C+j83AwBBsNoGQoCAgICAgICAwAA3AwBBwNwGQgA3AwBB2NoGQQBB0AAQEBpBkNwGQgA3AwBBiNwGQgA3AwBBgNwGQgA3AwBBkN0GQuPL7qSMhKzpPzcDAEGY3QZCgICAgICAgPA/NwMAQaDdBkLNmbPmzJmzkMAANwMAQajdBkKAgICAgICwucAANwMAQbDdBkKAgICAgICwucAANwMAQbjdBkKAgICAgICUysAANwMAQcDdBkKAgICAgICIzsAANwMAQcjdBkLso+H10fCaqMAANwMAQdDdBkKpuL2U3J6ynsAANwMAQdjdBkLso+H10fCaqMAANwMAQcDfBkKrjtrI7fn98T83AwBBuN8GQunNxMHAlYfzPzcDAEGw3wZCqI2vupOxkPQ/NwMAQajfBkK7vr/q+NKb9T83AwBBoN8GQs/vz5re9Kb2PzcDAEGY3wZCjISsueiitvc/NwMAQZDfBkLQmt70puKg+D83AwBBiN8GQrSR2/P708b4PzcDAEHg3gZC8qW3koaC1tw/NwMAQdjeBkL4p42vupOx4D83AwBB0N4GQu+kjISsuejiPzcDAEHI3gZCiYOBq47ayOU/NwMAQcDeBkKk4fXR8Pqo6D83AwBBuN4GQtXxpbeShoLqPzcDAEGw3gZCro+F18fC6+s/NwMAQajeBkKF18fC66Ph7T83AwBBoN4GQoaC1py0kdvvPzcDAEGY3gZCw+uj4fXR8PA/NwMAQZDeBkLXx8Lro+H18T83AwBBiN4GQsGVh63k9vzyPzcDAEGA3gZCquPL7qSMhPQ/NwMAQfjdBkK9lNyeiq6P9T83AwBB8N0GQqa3koaC1pz2PzcDAEHo3QZCueiituf3p/c/NwMAQeDdBkKsueiituf39z83AwBBqOAGQqTh9dHw+qjYPzcDAEGg4AZCpOH10fD6qNg/NwMAQZjgBkKk4fXR8Pqo2D83AwBBkOAGQrqTsZCw5aHbPzcDAEGI4AZCkLDloYvZnd8/NwMAQYDgBkL/1PGlt5KG4j83AwBB+N8GQsLAlYet5PbkPzcDAEHw3wZC/qnjy+6kjOg/NwMAQejfBkKt5Pb8/tTx6T83AwBB4N8GQtrI7fn9qePrPzcDAEHY3wZC2/P708aX3e0/NwMAQdDfBkLayO35/anj7z83AwBByN8GQsLAlYet5PbwPzcDAEGA3wZCmYjY8tDF7NY/NwMAQfjeBkKZiNjy0MXs1j83AwBB8N4GQpmI2PLQxezWPzcDAEHo3gZCi9md35+1vNk/NwMAQdjhBkL25Mfyndiqh79/NwMAQfjiBkKIz6WQo8DK8r9/NwMAQfDiBkKbpbKdnLqV479/NwMAQejiBkKNr7qTsZCw4b9/NwMAQeDiBkLphtHl8OTH2L9/NwMAQdjiBkLJn+KvsY2uxD83AwBB0OIGQpHxs9/u0OO8PzcDAEHI4gZC8aisrJqN87U/NwMAQcDiBkLKjOuK8Y3fsD83AwBBuOIGQuKT6KKdrfWqPzcDAEGw4gZC7ZD3t+G28qo/NwMAQajiBkKinu6B0IfaqD83AwBBoOIGQpjynvCBjfShPzcDAEGY4gZC3Z2325qk754/NwMAQZDiBkLclduZ1vu5kj83AwBBiOIGQqmsuMnFqP2Dv383AwBBgOIGQuOzk9udof6Tv383AwBB+OEGQrXX2d/co66Zv383AwBB8OEGQtDEspDvwPaav383AwBB6OEGQqzAmPvY6d6av383AwBB4OEGQvXV7N3ir/+jv383AwBB0OAGQoPZ7dSNoIKbPzcDAEHI4AZChoSDyfev25A/NwMAQcDgBkKNo5XRxs2Jir9/NwMAQbjgBkLf9OK686WZlL9/NwMAQbDgBkK27Lqd0LW4nz83AwBB0OEGQvX44p2Ur/XIv383AwBByOEGQoCJzcCirMTlv383AwBBwOEGQva/nbfamc7qv383AwBBuOEGQpXekfOR/+Div383AwBBsOEGQpeT1LvU1s/Jv383AwBBqOEGQr3014iyxavQv383AwBBoOEGQu2wuZXx8PHEv383AwBBmOEGQsaoqMPr0eS5v383AwBBkOEGQrSe68GH7Lepv383AwBBiOEGQvOuw679raKoPzcDAEGA4QZCrf3b/82Yz6Y/NwMAQfjgBkLkrOOC+56XoT83AwBB8OAGQvLK4fKNt86hPzcDAEHo4AZCw5DVtZCe654/NwMAQeDgBkLb8a2L3+Gqmz83AwBB2OAGQoXh4uOb64aaPzcDAEGA4wZCmrPmzJmz5tQ/NwMAQYjjBkKas+bMmbPm3D83AwBBkOMGQoCAgICAgID4PzcDAEGY4wZCgICAgICAwKzAADcDAEGg4wZCgICAgICAgPg/NwMAQajjBkKAgICAgICA+D83AwBBsOMGQoCAgICAgID4PzcDAEG44wZCgICAgICAgPg/NwMAQcDjBkKAgICAgICA+D83AwBByOMGQoCAgICAgID4PzcDAEHQ4wZCgICAgICAgPg/NwMAQdjjBkKAgICAgICA+D83AwBB4OMGQoCAgICAgIDoPzcDAEHo4wZCgICAgICAgPg/NwMAQfjjBkKAgICAgICA+D83AwBB8OMGQoCAgICAgIDwPzcDAEGA5AZC9oa2oN++iOo+NwMAQYjkBkKAgICAgICA+D83AwBBkOQGQoCAgIDQrPPmwQA3AwBBmOQGQvuouL2U3J66PzcDAEGg5AZC+6i4vZTcnro/NwMAQajkBkIANwMAQbDkBkKAgICAgICAisAANwMAQbjkBkKAgICAgIDQz8AANwMAQcDkBkIANwMAQcjkBkKas+bMmbPm7D83AwBB0OQGQoCAgICAgIDwPzcDAEHY5AZCgICAgICAgPA/NwMAQeDkBkKz5syZs+bM4T83AwBB6OQGQvuouL2U3J7KPzcDAEHw5AZC/NPGl93JmMA/NwMAQfjkBkL7qLi9lNyeyj83AwBBgOUGQpqz5syZs+bcPzcDAEGI5QZCuL2U3J6Krtc/NwMAQZDlBkL7qLi9lNyewj83AwBBmOUGQoquj4XXx8LjPzcDAEGg5QZC+6i4vZTcnsI/NwMAQajlBkLTm4mDgauO8T83AwBBsOUGQtmd35+1vOnNPzcDAEG45QZChdfHwuuj4Y7AADcDAEHA5QZC5syZs+bMmfM/NwMAQcjlBkIANwMAQdjlBkKAgICAgIDAnMAANwMAQdDlBkKAgICAgICAl8AANwMAQejlBkKAgICAgICAisAANwMAQeDlBkKAgICAgIDApMAANwMAQfDlBkKAgICAgMCW2MAANwMAQaDnBkIANwMAQfDpBkIANwMAQaDrBkKAgICAgICA+D83AwBBqOsGQvaGtqDfvojqPjcDAEGw6wZCgICAgNCs897BADcDAEG46wZCgICAgICAgPg/NwMAQcDrBkKAgICAgICA+D83AwBByOsGQgA3AwBB0OsGQoCAgIDQrPPmwQA3AwBB2OsGQr/q+NKbiYPzPzcDAEHg6wZCgICAgICAgITAADcDAEHo6wZCADcDAEHw6wZCADcDAEH46wZCj4XXx8Lro+k/NwMAQcjoBkIANwMAQZjrBkIANwMAQYDsBkKAgICAgICAn8AANwMAQYjsBkKAgICAgICAgMAANwMAQZDsBkLcnoquj4XX9z83AwBBmOwGQpqz5syZs+bcPzcDAEGg7AZCgICAgICAgPg/NwMAQajsBkKAgICAgICA+D83AwBBiO4GQvH6qLi9lOXOwAA3AwBBgO4GQvH6qLi9tJjOwAA3AwBB+O0GQvH6qLi9tJjOwAA3AwBB8O0GQrPmzJmzhtvOwAA3AwBB6O0GQubMmbPmjLjNwAA3AwBB4O0GQtyeiq6PpbLMwAA3AwBB2O0GQuDKw5aym6vHwAA3AwBBqO0GQr2U3J6KzqzPwAA3AwBBoO0GQr2U3J6KzqzPwAA3AwBBmO0GQr2U3J6KzqzPwAA3AwBBkO0GQr2U3J6KzqzPwAA3AwBBiO0GQr2U3J6K3qjRwAA3AwBBgO0GQr2U3J6K3qjRwAA3AwBB+OwGQr2U3J6K3qjRwAA3AwBB8OwGQr2U3J6K3qjRwAA3AwBB6OwGQr2U3J6K3qjRwAA3AwBB4OwGQr2U3J6K3qjRwAA3AwBB2OwGQvbR8Pqo6L3RwAA3AwBB0OwGQvbR8Pqo6L3RwAA3AwBByOwGQsjC66Ph9cPRwAA3AwBBwOwGQsPro+H18YDPwAA3AwBBuOwGQr2U3J6KjqvNwAA3AwBBsOwGQr2U3J6Kzp/IwAA3AwBB+O4GQvbR8Pqo2IfNwAA3AwBB8O4GQvbR8Pqo2IfNwAA3AwBB6O4GQvbR8Pqo2IfNwAA3AwBB4O4GQvbR8Pqo2IfNwAA3AwBB2O4GQvbR8Pqo2IfNwAA3AwBB0O4GQvbR8Pqo2IfNwAA3AwBByO4GQvbR8Pqo2IfNwAA3AwBBwO4GQvbR8Pqo2IfNwAA3AwBBuO4GQvbR8Pqo2IfNwAA3AwBBsO4GQvH6qLi9lOXOwAA3AwBBqO4GQvH6qLi9lOXOwAA3AwBBoO4GQvH6qLi9lOXOwAA3AwBBmO4GQvH6qLi9lOXOwAA3AwBBkO4GQvH6qLi9lOXOwAA3AwBB0O0GQr2U3J6KzqzPwAA3AwBByO0GQr2U3J6KzqzPwAA3AwBBwO0GQr2U3J6KzqzPwAA3AwBBuO0GQr2U3J6KzqzPwAA3AwBBsO0GQr2U3J6KzqzPwAA3AwBBgO8GQpqz5syZs+bcPzcDAEGI7wZCADcDAEGQ7wZCgICAgICAwKzAADcDAEGY7wZCgICAgICAgPg/NwMAQaDvBkKF18fC66OBlMAANwMAQajvBkKKro+F18eCmMAANwMAQbDvBkKL2Z3fn7WAo8AANwMAQbjvBkLd39i0sdWTwT43AwBBwO8GQoXXx8Lro+H1PzcDAEGI8AZC18fC66Ph9eE/NwMAQYDwBkLXx8Lro+H14T83AwBB+O8GQpeyu76/6vjwPzcDAEHw7wZC89DF7M7vz9o/NwMAQdDvBkKq48vupIyE1D83AwBBkPAGQqrjy+6kjITUPzcDAEHQ8AZCzZmz5syZs+4/NwMAQdjwBkKAgICAgMCD0MAANwMAQeDwBkLNmbPmzJmz9j83AwBB6PAGQoCAgICAgNDPwAA3AwBB8PAGQpqz5syZs+bMPzcDAEH48AZClZiq0s6Azbg/NwMAQYDxBkK56KK25/enxT83AwBBiPEGQoCAgICA8ISOwQA3AwBBkPEGQpqz5syZs+bkPzcDAEGY8QZC9fPq1ti/36DAADcDAEGo8QZCgICAgICAwJTAADcDAEGg8QZCgICAgICAxLjAADcDAEGw8QZCgICAgICAwKTAADcDAEG48QZCgICAgIDYnpjBADcDAEHA8QZCgICAgICA4pHBADcDAEHI8QZCgICAgIDl4ZTBADcDAEHQ8QZCgICAgICAgJLAADcDAEHY8QZCiq6PhdfHwoLAADcDAEHg8QZCiq6PhdfHwoLAADcDAEHo8QZCgICAgICAgPg/NwMAQfDxBkL7qLi9lNye0j83AwBB+PEGQoCAgICAgICKwAA3AwBBgPIGQoCAgICAgICAwAA3AwBBiPIGQvr9qePL7qS0PzcDAEGQ8gZC+6i4vZTcnsI/NwMAQZjyBkL7qLi9lNyeyj83AwBBoPIGQoCAgICAgICMwAA3AwBB8PIGQoquj4XXx8LbPzcDAEGo8wZCueiituf3p9U/NwMAQaDzBkLn4MqWp9uMuj83AwBBmPMGQru+v+r40pu5PzcDAEGQ8wZCpamj7MC6jMA/NwMAQYjzBkKpuL2U3J6K1j83AwBBgPMGQsPro+H10fDaPzcDAEH48gZC+6i4vZTcnto/NwMAQdDyBkK2n+Tb3Prj2D83AwBByPIGQri9lNyeiq7XPzcDAEHA8gZCiq6PhdfHwtM/NwMAQbjyBkLk1ZG7pcuR2z83AwBBsPIGQomDgauO2sjdPzcDAEHo8gZCu76/6vjSm7k/NwMAQeDyBkK6k7GQsOWhyz83AwBB2PIGQtijrbznxqbNPzcDAEGw8wZCgICAgICAgIzAADcDAEG48wZCmrPmzJmz5uQ/NwMAQcDzBkKAgICAgICAjMAANwMAQfDzBkKAgICAgICA+D83AwBB6PMGQoCAgICAgID4PzcDAEHg8wZCgICAgICAgPg/NwMAQdjzBkKAgICAgICA+D83AwBB0PMGQgA3AwBBiPQGQgA3AwBBgPQGQoCAgICAgID4PzcDAEGw9AZCADcDAEGQ9AZCADcDAEGY9AZCADcDAEGg9AZCADcDAEG49AZCADcDAEHA9AZCADcDAEHI9AZCADcDAEHo9AZCgICAgICAgPg/NwMAQeD0BkKAgICAgICA+D83AwBB2PQGQoCAgICAgID4PzcDAEHQ9AZCgICAgICAgPg/NwMAQfD0BkK1vOnNxMHA7b9/NwMAQfj0BkLNmbPmzJnzicAANwMAQYD1BkK0kdvz+9OGgsAANwMAQYj1BkLe9KbioOCqiMAANwMAQZD1BkK9lNyeiq6PiUA3AwBBmPUGQsGVh63k9vyBwAA3AwBBqPUGQv6V5Nyy0Nrkv383AwBBoPUGQsDgnPr4+7bzPzcDAEGw9QZCgICAgICAsLbAADcDAEG49QZCgICAgNCs897BADcDAEHA9QZCgICAgICAwKzAADcDAEHI9QZCgICAgICAgIzAADcDAEHQ9QZCgICAgICAwKTAADcDAEHY9QZCgICAgICAgKLAADcDAEGY9gZC+6i4vZTcnto/NwMAQZD2BkL7qLi9lNye4j83AwBBiPYGQri9lNyeiq7nPzcDAEGA9gZC0vD6qLi9lOQ/NwMAQaD2BkKAgIDkidy6ucIANwMAQaj2BkKAgICAgICAp8AANwMAQej2BkKU3J6Kro+F5z83AwBB4PYGQomDgauO2sjlPzcDAEHY9gZCpYyErLnoou4/NwMAQdD2BkL0+9PGl93J2D83AwBBsPYGQvuouL2U3J7SPzcDAEHw9gZC+6i4vZTcntI/NwMAQbD3BkKas+bMmbPm+D83AwBByPcGQoCAgICAgICEwAA3AwBBwPcGQrPmzJmz5sz5PzcDAEHY9wZCrOexwOzr+/Q/NwMAQdD3BkLXx8Lro+H19T83AwBB6PcGQri9lNyeiq7XPzcDAEHg9wZCuL2U3J6Krs8/NwMAQfD3BkLNmbPmzJmz9j83AwBB+PcGQq+6k7GQsOXpPzcDAEGA+AZCkrn5n6S/++0/NwMAQZD4BkL7qLi9lNye9j83AwBBiPgGQpqz5syZs+b0PzcDAEGY+AZCyMLro+H10fA/NwMAQaD4BkKz5syZs+bM8T83AwBBqPgGQoCAgICAgID4PzcDAEGw+AZC7ozugJ+/yITAADcDAEG4+AZCgICAgICAwKzAADcDAEHA+AZCADcDAEHI+AZCADcDAEHQ+AZCmrPmzJmz5tQ/NwMAQej4BkLh/YGesICi9T83AwBB4PgGQu+3/NrnrPL0PzcDAEH4+AZC4f2BnrCAovU/NwMAQfD4BkLvt/za56zy9D83AwBBgPkGQoCAgIz7+sqwwgA3AwBBiPkGQoCAgICN8bCAwgA3AwBBkPkGQpqz5syZs+b0PzcDAEGY+QZC+6i4vZTcnvY/NwMAQaD5BkLIwuuj4fXR8D83AwBBqPkGQrPmzJmz5szxPzcDAEGw+QZCgICAgICAgPg/NwMAQbj5BkKAgICAgICA+D83AwBBwPkGQrPmzJmz5szpPzcDAEHI+QZCgICAgICAgIDAADcDAEHY+QZCADcDAEHQ+QZCADcDAEHg+QZCgICAgICAgI7AADcDAEHo+QZCgICAgICHp77BADcDAEHw+QZCgICAgICAgPw/NwMAQfj5BkKAgICAgICA+D83AwBBiPoGQoCAgICAgICEwAA3AwBBgPoGQoCAgICAgICJwAA3AwBBkPoGQoCAgICAgICEwAA3AwBBmPoGQoqwu7DE/YTgPzcDAEGg+gZC7KyutvScv+U/NwMAQaj6BkKz5syZs+bM8T83AwBBsPoGQoCAgICAgIDwPzcDAEG4+gZCgICAgICAgJLAADcDAEHA+gZCs+bMmbPmzOk/NwMAQcj6BkKAgICAgICAksAANwMAQdD6BkKAgICAgIDApMAANwMAQdj6BkKAgICAgIDApMAANwMAQeD6BkKAgICAgIDApMAANwMAQej6BkKAgICAgIDkz8AANwMAQfD6BkKAgICAgIDkz8AANwMAQfj6BkKAgICAgIDkz8AANwMAQYD7BkKAgICAgIDkz8AANwMAQYj7BkKAgICAgIDkz8AANwMAQZD7BkKAgICAgIDkz8AANwMAQZj7BkKAgICAgIDkz8AANwMAQaD7BkKAgICAgIDkz8AANwMAQbD9BkLGrYjkwZLM4z83AwBBqP0GQsatiOTBkszjPzcDAEGg/QZCxq2I5MGSzOM/NwMAQZj9BkLGrYjkwZLM4z83AwBBkP0GQs6I/bXrz/7hPzcDAEGI/QZCzoj9tevP/uE/NwMAQYD9BkLOiP2168/+4T83AwBB+PwGQs6I/bXrz/7hPzcDAEHw/AZCzoj9tevP/uE/NwMAQdj8BkKKro+F18fC4z83AwBB0PwGQtLw+qi4vZTkPzcDAEHI/AZC0vD6qLi9lOQ/NwMAQcD8BkLS8PqouL2U5D83AwBBuPwGQtLw+qi4vZTkPzcDAEGw/AZC0vD6qLi9lOQ/NwMAQaj8BkLS8PqouL2U5D83AwBBoPwGQtLw+qi4vZTkPzcDAEGY/AZC0vD6qLi9lOQ/NwMAQZD8BkLh9dHw+qi45T83AwBBiPwGQuH10fD6qLjlPzcDAEGA/AZC4fXR8PqouOU/NwMAQfj7BkLh9dHw+qi45T83AwBB8PsGQuH10fD6qLjlPzcDAEHo+wZC9tHw+qi4veQ/NwMAQeD7BkL20fD6qLi95D83AwBB2PsGQvbR8PqouL3kPzcDAEHQ+wZC9tHw+qi4veQ/NwMAQcj7BkL20fD6qLi95D83AwBB+P0GQvuouL2U3J7iPzcDAEHw/QZC+6i4vZTcnuI/NwMAQej9BkL7qLi9lNye4j83AwBB4P0GQvuouL2U3J7iPzcDAEHY/QZC+6i4vZTcnuI/NwMAQdD9BkL7qLi9lNye4j83AwBByP0GQvuouL2U3J7iPzcDAEHA/QZC+6i4vZTcnuI/NwMAQbj9BkLGrYjkwZLM4z83AwBB6PwGQoquj4XXx8LjPzcDAEHg/AZCiq6PhdfHwuM/NwMAQcD7BkLnjdOn2MSH5D83AwBBuPsGQueN06fYxIfkPzcDAEGw+wZC543Tp9jEh+Q/NwMAQYD+BkKAgICAgIDgqMAANwMAQYj+BkKAgICAgIDgqMAANwMAQZD+BkLmzJmz5szZkcAANwMAQZj+BkKAgICQytLGrsIANwMAQaD+BkKAgICAoJPpwMEANwMAQaj+BkKAgICAgICA+D83AwBBsP4GQoCAgICAgICFwAA3AwBBuP4GQoCAgICAgICQwAA3AwBBwP4GQoCAgICAgICMwAA3AwBByP4GQoCAgICAh6e+wQA3AwBB0P4GQoCAgICAgICSwAA3AwBB2P4GQrPmzJmz5vfMwAA3AwBB4P4GQvbR8PqouL3wPzcDAEHo/gZCgICAgICAgJrAADcDAEHA/wZCquPL7qSMhNQ/NwMAQZj/BkL7qLi9lNye0j83AwBBkP8GQtjy0MXszu/PPzcDAEGI/wZCuL2U3J6Krtc/NwMAQYD/BkKq48vupIyE1D83AwBB+P4GQrqTsZCw5aHDPzcDAEHw/gZC6c3EwcCVh9U/NwMAQdD/BkL6/anjy+6kxD83AwBByP8GQtrI7fn9qePLPzcDAEG4/wZCuL2U3J6Krs8/NwMAQbD/BkLso+H10fD62D83AwBBqP8GQpqz5syZs+bUPzcDAEGg/wZC+6i4vZTcnsI/NwMAQYiBB0KL2Z3fn7W82T83AwBB4IAHQuyj4fXR8PrgPzcDAEG4gAdCy8OWsru+v9I/NwMAQZCAB0Lb8/vTxpfd2T83AwBB6P8GQqrjy+6kjITUPzcDAEGogQdC2/P708aX3ck/NwMAQaCBB0Lb8/vTxpfdyT83AwBBmIEHQtrI7fn9qePTPzcDAEGQgQdCm970puKg4NI/NwMAQYCBB0KKro+F18fC2z83AwBB+IAHQri9lNyeiq7XPzcDAEHwgAdCiq6PhdfHwts/NwMAQeiAB0Lso+H10fD62D83AwBB2IAHQo+F18fC66PhPzcDAEHQgAdCm970puKg4Mo/NwMAQciAB0LLw5ayu76/0j83AwBBwIAHQrnoorbn96fVPzcDAEGwgAdC2/P708aX3ck/NwMAQaiAB0Lb8/vTxpfdyT83AwBBoIAHQvr9qePL7qTUPzcDAEGYgAdC2/P708aX3dE/NwMAQYiAB0KTsZCw5aGL2T83AwBBgIAHQqrjy+6kjITUPzcDAEH4/wZC+v2p48vupMQ/NwMAQfD/BkLayO35/anjyz83AwBB4P8GQpOxkLDloYvZPzcDAEHY/wZCquPL7qSMhNQ/NwMAQbCBB0KAgICAgIDQ18AANwMAQbiBB0KAgICAgIDW1cAANwMAQcCBB0KAgICAgIDW3cAANwMAQdCBB0KAgICAgIDQ58AANwMAQciBB0KAgICAgIDl4MAANwMAQdiBB0KAgICAgMCm6MAANwMAQeCBB0KAgICAgIDT/sAANwMAQeiBB0Kz5syZs+bM6T83AwBBqIIHQtTGl93JmIjgPzcDAEGgggdC18fC66Ph9ek/NwMAQZiCB0L6/anjy+6k6D83AwBBkIIHQtjy0MXszu/fPzcDAEGIggdCr7qTsZCw5eE/NwMAQYCCB0KvupOxkLDl4T83AwBB+IEHQvuouL2U3J7iPzcDAEHwgQdC35+1vOnNxOE/NwMAQbCCB0KAgNCx0v6ahsMANwMAQbiCB0KAgICAgICA+D83AwBBwIIHQoCAgICAgID4PzcDAEHIggdCgICAgICA8KrAADcDAEHQggdC9fPq1ti/2ek/NwMAQdiCB0KAgICAgICQqsAANwMAQeCCB0KAgICAgICAhMAANwMAQaiDB0KL2Z3fn7W82T83AwBBoIMHQuyj4fXR8PrgPzcDAEGYgwdCy8OWsru+v9I/NwMAQZCDB0Lb8/vTxpfd2T83AwBBiIMHQqrjy+6kjITUPzcDAEGAgwdCquPL7qSMhNQ/NwMAQfiCB0L7qLi9lNye0j83AwBB8IIHQunNxMHAlYfVPzcDAEGwgwdC7KPh9dHw+tA/NwMAQcCDB0L7qLi9lNye+j83AwBB+IMHQo+F18fC64ORwAA3AwBB8IMHQsPro+H10ZCXwAA3AwBB6IMHQsPro+H10fCHwAA3AwBB4IMHQq6PhdfHwuv3PzcDAEHYgwdCmrPmzJmz5vQ/NwMAQdCDB0Kuj4XXx8LrjMAANwMAQciDB0LNmbPmzJmz8j83AwBBuIQHQqTh9dHw+qjoPzcDAEGwhAdC8972vti5xNo/NwMAQaiEB0Kp36za0+al7z83AwBBoIQHQvXFte72jIHMPzcDAEGYhAdC1//TrKihmsQ/NwMAQZCEB0LHtITswZTT2D83AwBBiIQHQquci5v3w/LWPzcDAEGAhAdCso+Q9cCHwsk/NwMAQciEB0Lso+H10fD6psAANwMAQcCEB0LNmbPmzJmrpsAANwMAQfiFB0Ly+fSSiL/Z0j83AwBB2IYHQrXbl46mj4PYPzcDAEHQhgdCtduXjqaPg9g/NwMAQciGB0K125eOpo+D2D83AwBBwIYHQvS64Y+cn/XYPzcDAEG4hgdC9Lrhj5yf9dg/NwMAQbCGB0L0uuGPnJ/12D83AwBBqIYHQvS64Y+cn/XYPzcDAEGghgdC9Lrhj5yf9dg/NwMAQZiGB0KzmquRkq/n2T83AwBBkIYHQpKKpMfhiIzZPzcDAEGIhgdCuZzcoJHMx9g/NwMAQYCGB0L4upG7ytjG1T83AwBByIgHQrLhmeiz1PG7PzcDAEGghwdCxczK2fex+tE/NwMAQcCIB0K8n7Pa2Mr31j83AwBBuIgHQryfs9rYyvfWPzcDAEGwiAdCvJ+z2tjK99Y/NwMAQaiIB0K8n7Pa2Mr31j83AwBBoIgHQryfs9rYyvfWPzcDAEGYiAdCvJ+z2tjK99Y/NwMAQZCIB0K8n7Pa2Mr31j83AwBBiIgHQryfs9rYyvfWPzcDAEGAiAdCvJ+z2tjK99Y/NwMAQfiHB0K8n7Pa2Mr31j83AwBB8IcHQryfs9rYyvfWPzcDAEHohwdCq/mpkfD+pdg/NwMAQeCHB0Kr+amR8P6l2D83AwBB2IcHQqv5qZHw/qXYPzcDAEHQhwdCq/mpkfD+pdg/NwMAQciHB0Kr+amR8P6l2D83AwBBwIcHQviiuvWzmJDZPzcDAEG4hwdC3fiS7s+du9g/NwMAQbCHB0KP9a+v4YL31z83AwBBqIcHQrP15/aHnc7UPzcDAEGYhwdCtduXjqaPg9g/NwMAQZCHB0K125eOpo+D2D83AwBBiIcHQrXbl46mj4PYPzcDAEGAhwdCtduXjqaPg9g/NwMAQfiGB0K125eOpo+D2D83AwBB8IYHQrXbl46mj4PYPzcDAEHohgdCtduXjqaPg9g/NwMAQeCGB0K125eOpo+D2D83AwBBmIsHQtmvsuOD29joPzcDAEHgiwdC3a/O2d3Cvu4/NwMAQdiLB0Ldr87Z3cK+7j83AwBB0IsHQt2vztndwr7uPzcDAEHIiwdC3a/O2d3Cvu4/NwMAQcCLB0Ldr87Z3cK+7j83AwBBuIsHQvWXkd71/PfvPzcDAEGwiwdCnPGru5TO4+4/NwMAQaiLB0LerJOW8Kv07T83AwBBoIsHQtyshZuDuIHrPzcDAEHoiQdC9Lrhj5yf9cA/NwMAQeCJB0L0uuGPnJ/1wD83AwBB2IkHQvS64Y+cn/XAPzcDAEHQiQdC9Lrhj5yf9cA/NwMAQciJB0L0uuGPnJ/1wD83AwBBwIkHQvS64Y+cn/XAPzcDAEG4iQdC9Lrhj5yf9cA/NwMAQbCJB0L0uuGPnJ/1wD83AwBBqIkHQvS64Y+cn/XAPzcDAEGgiQdC9Lrhj5yf9cA/NwMAQZiJB0L0uuGPnJ/1wD83AwBBkIkHQr/m6parhvTBPzcDAEGIiQdCv+bqlquG9ME/NwMAQYCJB0K/5uqWq4b0wT83AwBB+IgHQr/m6parhvTBPzcDAEHwiAdCv+bqlquG9ME/NwMAQeiIB0KKkvSduu3ywj83AwBB4IgHQrWihuXHtI3CPzcDAEHYiAdC1e6z+vGpwcE/NwMAQdCIB0LD54nS0reHvz83AwBB6I0HQvWUj92RrNThPzcDAEH4jgdC3a/O2d3CvuY/NwMAQfCOB0Ldr87Z3cK+5j83AwBB6I4HQt2vztndwr7mPzcDAEHgjgdC3a/O2d3CvuY/NwMAQdiOB0Ldr87Z3cK+5j83AwBB0I4HQt2vztndwr7mPzcDAEHIjgdC3a/O2d3CvuY/NwMAQcCOB0Ldr87Z3cK+5j83AwBBuI4HQt2vztndwr7mPzcDAEGwjgdC5KHEm6elhug/NwMAQaiOB0LkocSbp6WG6D83AwBBoI4HQuShxJunpYboPzcDAEGYjgdC5KHEm6elhug/NwMAQZCOB0LkocSbp6WG6D83AwBBiI4HQq3bqbzcqO3oPzcDAEGAjgdCi/3D5rzymug/NwMAQfiNB0L5lKvT65O65z83AwBB8I0HQv2NprSQhZ7kPzcDAEG4jAdC85eD44iJhe0/NwMAQbCMB0Lzl4PjiImF7T83AwBBqIwHQvOXg+OIiYXtPzcDAEGgjAdC85eD44iJhe0/NwMAQZiMB0Lzl4PjiImF7T83AwBBkIwHQvOXg+OIiYXtPzcDAEGIjAdC85eD44iJhe0/NwMAQYCMB0Lzl4PjiImF7T83AwBB+IsHQvOXg+OIiYXtPzcDAEHwiwdC85eD44iJhe0/NwMAQeiLB0Lzl4PjiImF7T83AwBB8IkHQqbwivXd0/HDPzcDAEHwhQdCk4qQko23oMo/NwMAQeiFB0KTipCSjbegyj83AwBB4IUHQpOKkJKNt6DKPzcDAEHYhQdCk4qQko23oMo/NwMAQdCFB0KTipCSjbegyj83AwBByIUHQpOKkJKNt6DKPzcDAEHAhQdCk4qQko23oMo/NwMAQbiFB0KTipCSjbegyj83AwBBsIUHQpOKkJKNt6DKPzcDAEGohQdCk4qQko23oMo/NwMAQaCFB0KTipCSjbegyj83AwBBmIUHQpjBv4nMoLLLPzcDAEGQhQdCmMG/icygsss/NwMAQYiFB0KYwb+JzKCyyz83AwBBgIUHQpjBv4nMoLLLPzcDAEH4hAdCmMG/icygsss/NwMAQfCEB0LNxeGw9orEzD83AwBB6IQHQr/w18euts/LPzcDAEHghAdCqf3z7N3298o/NwMAQdiEB0LuwaLO9KLUyD83AwBB0IQHQqSvnvjJ89XFPzcDAEGIjwdC3a/O2d3CvuY/NwMAQYCPB0Ldr87Z3cK+5j83AwBBoIoHQr/m6parhvTJPzcDAEGYigdCv+bqlquG9Mk/NwMAQZCKB0KKkvSduu3yyj83AwBBiIoHQtj+6aHdtI3KPzcDAEGAigdCjrbsgMepwck/NwMAQfiJB0LP2JjFqLiHxz83AwBBwIwHQv6WhM2T1PHTPzcDAEG4jQdC9Lrhj5yf9dg/NwMAQbCNB0L0uuGPnJ/12D83AwBBqI0HQvS64Y+cn/XYPzcDAEGgjQdC9Lrhj5yf9dg/NwMAQZiNB0L0uuGPnJ/12D83AwBBkI0HQvS64Y+cn/XYPzcDAEGIjQdCv+bqlquG9Nk/NwMAQYCNB0K/5uqWq4b02T83AwBB+IwHQr/m6parhvTZPzcDAEHwjAdCv+bqlquG9Nk/NwMAQeiMB0K/5uqWq4b02T83AwBB4IwHQt++97Gf7fLaPzcDAEHYjAdCrKvttcK0jdo/NwMAQdCMB0Lm3OXY/KnB2T83AwBByIwHQqCLppW9t4fXPzcDAEGQiwdC9Lrhj5yf9cg/NwMAQYiLB0L0uuGPnJ/1yD83AwBBgIsHQvS64Y+cn/XIPzcDAEH4igdC9Lrhj5yf9cg/NwMAQfCKB0L0uuGPnJ/1yD83AwBB6IoHQvS64Y+cn/XIPzcDAEHgigdC9Lrhj5yf9cg/NwMAQdiKB0L0uuGPnJ/1yD83AwBB0IoHQvS64Y+cn/XIPzcDAEHIigdC9Lrhj5yf9cg/NwMAQcCKB0L0uuGPnJ/1yD83AwBBuIoHQr/m6parhvTJPzcDAEGwigdCv+bqlquG9Mk/NwMAQaiKB0K/5uqWq4b0yT83AwBB4JEHQtywgv+SmMHSPzcDAEG4kAdC5Jv52+jJpdM/NwMAQeCNB0L0uuGPnJ/12D83AwBB2I0HQvS64Y+cn/XYPzcDAEHQjQdC9Lrhj5yf9dg/NwMAQciNB0L0uuGPnJ/12D83AwBBwI0HQvS64Y+cn/XYPzcDAEH4kQdCgs2F2YTGuds/NwMAQfCRB0KVpOi79Nrl2D83AwBB6JEHQqLMkpLRl6PVPzcDAEHYkQdCs5qrkZKv59k/NwMAQdCRB0KzmquRkq/n2T83AwBByJEHQrOaq5GSr+fZPzcDAEHAkQdCs5qrkZKv59k/NwMAQbiRB0KzmquRkq/n2T83AwBBsJEHQrOaq5GSr+fZPzcDAEGokQdCs5qrkZKv59k/NwMAQaCRB0KzmquRkq/n2T83AwBBmJEHQvL59JKIv9naPzcDAEGQkQdC8vn0koi/2do/NwMAQYiRB0Ly+fSSiL/Z2j83AwBBgJEHQvL59JKIv9naPzcDAEH4kAdCsdm+lP7Oy9s/NwMAQfCQB0Kx2b6U/s7L2z83AwBB6JAHQrHZvpT+zsvbPzcDAEHgkAdCsdm+lP7Oy9s/NwMAQdiQB0LwuIiW9N693D83AwBB0JAHQtLpxd6u9abcPzcDAEHIkAdC+Puloofcudk/NwMAQcCQB0Lt95uZ4P6h1j83AwBBiJMHQqKWiO+Emca8PzcDAEHokwdCpvCK9d3T8cM/NwMAQeCTB0Km8Ir13dPxwz83AwBB2JMHQqbwivXd0/HDPzcDAEHQkwdCpvCK9d3T8cM/NwMAQciTB0Kh6Yas2LvwxD83AwBBwJMHQqHphqzYu/DEPzcDAEG4kwdCoemGrNi78MQ/NwMAQbCTB0Kh6Yas2LvwxD83AwBBqJMHQrzHnYP8oe/FPzcDAEGgkwdCpK+e+Mnz1cU/NwMAQZiTB0La4fWH1pDAwj83AwBBkJMHQpnX94rF8Oy/PzcDAEGAkwdC+KK69bOYkNk/NwMAQfiSB0L4orr1s5iQ2T83AwBB8JIHQviiuvWzmJDZPzcDAEHokgdC+KK69bOYkNk/NwMAQeCSB0L4orr1s5iQ2T83AwBB2JIHQviiuvWzmJDZPzcDAEHQkgdC+KK69bOYkNk/NwMAQciSB0L4orr1s5iQ2T83AwBBwJIHQsXMytn3sfrZPzcDAEG4kgdCxczK2fex+tk/NwMAQbCSB0LFzMrZ97H62T83AwBBqJIHQsXMytn3sfrZPzcDAEGgkgdC56Le0aDL5No/NwMAQZiSB0Lnot7RoMvk2j83AwBBkJIHQuei3tGgy+TaPzcDAEGIkgdC56Le0aDL5No/NwMAQYCSB0K0zO615OTO2z83AwBBqJgHQuL7nLC5hJniPzcDAEHYlQdC1LKY7o3Eluk/NwMAQfiWB0L1l5He9fz37z83AwBB8JYHQvWXkd71/PfvPzcDAEHolgdC9ZeR3vX89+8/NwMAQeCWB0L1l5He9fz37z83AwBB2JYHQvWXkd71/PfvPzcDAEHQlgdC9ZeR3vX89+8/NwMAQciWB0L1l5He9fz37z83AwBBwJYHQvWXkd71/PfvPzcDAEG4lgdC8JeuqqXb2PA/NwMAQbCWB0Lwl66qpdvY8D83AwBBqJYHQvCXrqql29jwPzcDAEGglgdC8JeuqqXb2PA/NwMAQZiWB0Ll49Plj7i18T83AwBBkJYHQuXj0+WPuLXxPzcDAEGIlgdC5ePT5Y+4tfE/NwMAQYCWB0Ll49Plj7i18T83AwBB+JUHQvGX9eeblZLyPzcDAEHwlQdCkbeGt8DP//E/NwMAQeiVB0LJxN6MxeWt7z83AwBB4JUHQtuvwN7wzsvrPzcDAEGolAdCipL0nbrt8sI/NwMAQaCUB0KKkvSduu3ywj83AwBBmJQHQoqS9J267fLCPzcDAEGQlAdCipL0nbrt8sI/NwMAQYiUB0KKkvSduu3ywj83AwBBgJQHQoqS9J267fLCPzcDAEH4kwdCipL0nbrt8sI/NwMAQfCTB0KKkvSduu3ywj83AwBByJkHQq3bqbzcqO3oPzcDAEHAmQdCrdupvNyo7eg/NwMAQbiZB0Kt26m83Kjt6D83AwBBsJkHQq3bqbzcqO3oPzcDAEGomQdCrdupvNyo7eg/NwMAQaCZB0Kt26m83Kjt6D83AwBBmJkHQq3bqbzcqO3oPzcDAEGQmQdCrdupvNyo7eg/NwMAQYiZB0Ki5Ybr1KzU6T83AwBBgJkHQqLlhuvUrNTpPzcDAEH4mAdCouWG69Ss1Ok/NwMAQfCYB0Ki5Ybr1KzU6T83AwBB6JgHQuue7IuKsLvqPzcDAEHgmAdC657si4qwu+o/NwMAQdiYB0LrnuyLirC76j83AwBB0JgHQuue7IuKsLvqPzcDAEHImAdC4ajJuoK0ous/NwMAQcCYB0KN/dHhqeaN6z83AwBBuJgHQrLUspjujcToPzcDAEGwmAdC8ZuU/Oy68OQ/NwMAQdiPB0LT/JCotfTVzT83AwBB0I8HQtmzwJ/03efOPzcDAEHIjwdC2bPAn/Td584/NwMAQcCPB0LZs8Cf9N3nzj83AwBBuI8HQtmzwJ/03efOPzcDAEGwjwdC3+rvlrPH+c8/NwMAQaiPB0LniMqIvLLczz83AwBBoI8HQq+0o+Sc4InMPzcDAEGYjwdCjdPgms7Njsk/NwMAQZCPB0L90+jHno+3xj83AwBBsJQHQqKWiO+EmcbEPzcDAEGwkAdCzcXhsPaKxMw/NwMAQaiQB0LNxeGw9orEzD83AwBBoJAHQs3F4bD2isTMPzcDAEGYkAdCzcXhsPaKxMw/NwMAQZCQB0LNxeGw9orEzD83AwBBiJAHQs3F4bD2isTMPzcDAEGAkAdCzcXhsPaKxMw/NwMAQfiPB0LNxeGw9orEzD83AwBB8I8HQtP8kKi19NXNPzcDAEHojwdC0/yQqLX01c0/NwMAQeCPB0LT/JCotfTVzT83AwBBwJUHQoqS9J267fLKPzcDAEG4lQdCipL0nbrt8so/NwMAQbCVB0KKkvSduu3yyj83AwBBqJUHQoqS9J267fLKPzcDAEGglQdCipL0nbrt8so/NwMAQZiVB0KKkvSduu3yyj83AwBBkJUHQtW9/aTJ1PHLPzcDAEGIlQdC1b39pMnU8cs/NwMAQYCVB0LVvf2kydTxyz83AwBB+JQHQtW9/aTJ1PHLPzcDAEHwlAdCoemGrNi78Mw/NwMAQeiUB0Kh6Yas2LvwzD83AwBB4JQHQqHphqzYu/DMPzcDAEHYlAdCoemGrNi78Mw/NwMAQdCUB0LslJCz56LvzT83AwBByJQHQtP8kKi19NXNPzcDAEHAlAdC2uH1h9aQwMo/NwMAQbiUB0LTnrCRmvDsxz83AwBBgJcHQqKWiO+EmcbUPzcDAEGgmAdC3773sZ/t8to/NwMAQZiYB0Lfvvexn+3y2j83AwBBkJgHQt++97Gf7fLaPzcDAEGImAdC3773sZ/t8to/NwMAQYCYB0Lfvvexn+3y2j83AwBB+JcHQt++97Gf7fLaPzcDAEHwlwdC3773sZ/t8to/NwMAQeiXB0Lfvvexn+3y2j83AwBB4JcHQqrqgLmu1PHbPzcDAEHYlwdCquqAua7U8ds/NwMAQdCXB0Kq6oC5rtTx2z83AwBByJcHQqrqgLmu1PHbPzcDAEHAlwdC8ZuU/Oy68Nw/NwMAQbiXB0Lxm5T87Lrw3D83AwBBsJcHQvGblPzsuvDcPzcDAEGolwdC8ZuU/Oy68Nw/NwMAQaCXB0LslJCz56Lv3T83AwBBmJcHQtP8kKi19NXdPzcDAEGQlwdChbXy8/CQwNo/NwMAQYiXB0Kqxanpz/Ds1z83AwBB0JUHQoqS9J267fLKPzcDAEHIlQdCipL0nbrt8so/NwMAQdCZB0KRjuvF29GB5D83AwBB2JkHQuyj4fXR8PrYPzcDAEHgmQdCgICAgMDw9cvBADcDAEHomQdCgICAgJCancLBADcDAEH4mQdC5syZs+bMmfc/NwMAQfCZB0KAgICAgICA+D83AwBBkJoHQoCAgICAgID4PzcDAEGYmgdCs+bMmbPmzPU/NwMAQdicB0Kas+bMmbPm7D83AwBB0JwHQvbR8PqouL3sPzcDAEHAmwdCs+bMmbPmzPU/NwMAQbibB0LNmbPmzJmz9j83AwBBiJ4HQQBBqAEQEBpB6KAHQo627IDHqcHJPzcDAEHgoAdCz9iYxai4h8c/NwMAQdigB0Km8Ir13dPxwz83AwBB0KAHQozHypvRls3XPzcDAEHIoAdCjMfKm9GWzdc/NwMAQcCgB0KMx8qb0ZbN1z83AwBBuKAHQozHypvRls3XPzcDAEGwoAdCjMfKm9GWzdc/NwMAQaigB0KMx8qb0ZbN1z83AwBBoKAHQozHypvRls3XPzcDAEGYoAdCjMfKm9GWzdc/NwMAQZCgB0KMx8qb0ZbN1z83AwBBiKAHQozHypvRls3XPzcDAEGAoAdCjMfKm9GWzdc/NwMAQfifB0KCkP+tuMXV2D83AwBB8J8HQoKQ/624xdXYPzcDAEHonwdCgpD/rbjF1dg/NwMAQeCfB0KCkP+tuMXV2D83AwBB2J8HQoKQ/624xdXYPzcDAEHQnwdCvfyYjsi/xNk/NwMAQcifB0KXtc6XhN7r2D83AwBBwJ8HQq7s2bLWlKnYPzcDAEG4nwdC7qbM5O3AltU/NwMAQbCfB0KlvK/a8rmz0j83AwBBqKMHQqLlhuvUrNTpPzcDAEGApAdC3a/O2d3Cvu4/NwMAQfijB0Ldr87Z3cK+7j83AwBB8KMHQs65yNSFpYbwPzcDAEHoowdCzrnI1IWlhvA/NwMAQeCjB0LOucjUhaWG8D83AwBB2KMHQs65yNSFpYbwPzcDAEHQowdCzrnI1IWlhvA/NwMAQcijB0Kt26m83Kjt8D83AwBBwKMHQqHlv63e8prwPzcDAEG4owdC+ZSr0+uTuu8/NwMAQbCjB0L9jaa0kIWe7D83AwBB+KEHQvS64Y+cn/XIPzcDAEHwoQdC9Lrhj5yf9cg/NwMAQeihB0L0uuGPnJ/1yD83AwBB4KEHQvS64Y+cn/XIPzcDAEHYoQdC9Lrhj5yf9cg/NwMAQdChB0L0uuGPnJ/1yD83AwBByKEHQvS64Y+cn/XIPzcDAEHAoQdC9Lrhj5yf9cg/NwMAQbihB0L0uuGPnJ/1yD83AwBBsKEHQvS64Y+cn/XIPzcDAEGooQdC9Lrhj5yf9cg/NwMAQaChB0K/5uqWq4b0yT83AwBBmKEHQr/m6parhvTJPzcDAEGQoQdCv+bqlquG9Mk/NwMAQYihB0K/5uqWq4b0yT83AwBBgKEHQr/m6parhvTJPzcDAEH4oAdCipL0nbrt8so/NwMAQfCgB0LY/umh3bSNyj83AwBB+KUHQvWUj92RrNThPzcDAEGYpwdC3a/O2d3CvuY/NwMAQZCnB0Ldr87Z3cK+5j83AwBBiKcHQt2vztndwr7mPzcDAEGApwdC3a/O2d3CvuY/NwMAQfimB0Ldr87Z3cK+5j83AwBB8KYHQt2vztndwr7mPzcDAEHopgdC3a/O2d3CvuY/NwMAQeCmB0Ldr87Z3cK+5j83AwBB2KYHQt2vztndwr7mPzcDAEHQpgdC3a/O2d3CvuY/NwMAQcimB0Ldr87Z3cK+5j83AwBBwKYHQuShxJunpYboPzcDAEG4pgdC5KHEm6elhug/NwMAQbCmB0LkocSbp6WG6D83AwBBqKYHQuShxJunpYboPzcDAEGgpgdC5KHEm6elhug/NwMAQZimB0Kt26m83Kjt6D83AwBBkKYHQov9w+a88proPzcDAEGIpgdC+ZSr0+uTuuc/NwMAQYCmB0L9jaa0kIWe5D83AwBByKQHQt2vztndwr7uPzcDAEHApAdC3a/O2d3Cvu4/NwMAQbikB0Ldr87Z3cK+7j83AwBBsKQHQt2vztndwr7uPzcDAEGopAdC3a/O2d3Cvu4/NwMAQaCkB0Ldr87Z3cK+7j83AwBBmKQHQt2vztndwr7uPzcDAEGQpAdC3a/O2d3Cvu4/NwMAQYikB0Ldr87Z3cK+7j83AwBB4JwHQQBBqAEQECIAQagIakLElLz15qCy2z83AwAgAEGgCGpCxJS89eagsts/NwMAIABBmAhqQsSUvPXmoLLbPzcDACAAQZAIakL2nujYwIrE3D83AwAgAEGICGpC6Mne7/i1z9s/NwMAIABBgAhqQv2p94DD9vfaPzcDACAAQpqVn7qPo9TYPzcD+AcgAEL81ZfQ//PV1T83A/AHIABClcv8jqGXvNA/NwPABiAAQpXL/I6hl7zQPzcDuAYgAEKVy/yOoZe80D83A7AGIABClcv8jqGXvNA/NwOoBiAAQpXL/I6hl7zQPzcDoAYgAEKVy/yOoZe80D83A5gGIABClcv8jqGXvNA/NwOQBiAAQpXL/I6hl7zQPzcDiAYgAEKVy/yOoZe80D83A4AGIABClcv8jqGXvNA/NwP4BSAAQpXL/I6hl7zQPzcD8AUgAELakKbT49K00T83A+gFIABC2pCm0+PStNE/NwPgBSAAQtqQptPj0rTRPzcD2AUgAELakKbT49K00T83A9AFIABC2pCm0+PStNE/NwPIBSAAQp/Wz5emjq3SPzcDwAUgAEKLrsXq7N7M0T83A7gFIABC0Pzg/Ia7hNE/NwOwBSAAQozjm+iDiKfOPzcDqAUgAEKM9f+Ds8mlyz83A6AFQfClB0KTipCSjbeg2j83AwBB6KUHQpOKkJKNt6DaPzcDAEHgpQdCk4qQko23oNo/NwMAQdilB0KTipCSjbeg2j83AwBB0KUHQpOKkJKNt6DaPzcDAEHIpQdCk4qQko23oNo/NwMAQcClB0KTipCSjbeg2j83AwBBuKUHQpOKkJKNt6DaPzcDAEGwpQdCk4qQko23oNo/NwMAQailB0KTipCSjbeg2j83AwBBoKUHQpOKkJKNt6DaPzcDAEGYpQdCxJS89eagsts/NwMAQZClB0LElLz15qCy2z83AwBByKgHQQBBqAEQEBpB6KoHQr38mI7Iv8TZPzcDAEHgqgdCvfyYjsi/xNk/NwMAQdiqB0K9/JiOyL/E2T83AwBB0KoHQqW8r9ryubPaPzcDAEHIqgdCpbyv2vK5s9o/NwMAQcCqB0KlvK/a8rmz2j83AwBBuKoHQqW8r9ryubPaPzcDAEGwqgdC4ajJuoK0ots/NwMAQaiqB0LhqMm6grSi2z83AwBBoKoHQuGoybqCtKLbPzcDAEGYqgdC4ajJuoK0ots/NwMAQZCqB0KcleOakq6R3D83AwBBiKoHQrPDkJ3hlfvbPzcDAEGAqgdC6tjzkuaOmNk/NwMAQfipB0KU7pbbsaLv1T83AwBB8KkHQpLAmrXZtf3SPzcDAEHorQdC4vucsLmEmeo/NwMAQZirB0KilojvhJnGxD83AwBBgK4HQo390eGp5o3zPzcDAEH4rQdCstSymO6NxPA/NwMAQfCtB0Kf7IuKsLvw7D83AwBBuKwHQoqS9J267fLKPzcDAEGwrAdCipL0nbrt8so/NwMAQaisB0KKkvSduu3yyj83AwBBoKwHQoqS9J267fLKPzcDAEGYrAdCipL0nbrt8so/NwMAQZCsB0KKkvSduu3yyj83AwBBiKwHQoqS9J267fLKPzcDAEGArAdCipL0nbrt8so/NwMAQfirB0LVvf2kydTxyz83AwBB8KsHQtW9/aTJ1PHLPzcDAEHoqwdC1b39pMnU8cs/NwMAQeCrB0LVvf2kydTxyz83AwBB2KsHQqHphqzYu/DMPzcDAEHQqwdCoemGrNi78Mw/NwMAQcirB0Kh6Yas2LvwzD83AwBBwKsHQqHphqzYu/DMPzcDAEG4qwdC7JSQs+ei780/NwMAQbCrB0LT/JCotfTVzT83AwBBqKsHQtrh9YfWkMDKPzcDAEGgqwdC056wkZrw7Mc/NwMAQZCrB0K9/JiOyL/E2T83AwBBiKsHQr38mI7Iv8TZPzcDAEGAqwdCvfyYjsi/xNk/NwMAQfiqB0K9/JiOyL/E2T83AwBB8KoHQr38mI7Iv8TZPzcDAEG4sAdC4vucsLmEmeI/NwMAQZixB0Ki5Ybr1KzU6T83AwBBkLEHQqLlhuvUrNTpPzcDAEGIsQdCouWG69Ss1Ok/NwMAQYCxB0Ki5Ybr1KzU6T83AwBB+LAHQuue7IuKsLvqPzcDAEHwsAdC657si4qwu+o/NwMAQeiwB0LrnuyLirC76j83AwBB4LAHQuue7IuKsLvqPzcDAEHYsAdC4ajJuoK0ous/NwMAQdCwB0KN/dHhqeaN6z83AwBByLAHQrLUspjujcToPzcDAEHAsAdC8ZuU/Oy68OQ/NwMAQYivB0Kt26m83Kjt8D83AwBBgK8HQq3bqbzcqO3wPzcDAEH4rgdCrdupvNyo7fA/NwMAQfCuB0Kt26m83Kjt8D83AwBB6K4HQq3bqbzcqO3wPzcDAEHgrgdCrdupvNyo7fA/NwMAQdiuB0Kt26m83Kjt8D83AwBB0K4HQq3bqbzcqO3wPzcDAEHIrgdCjP2KpLOs1PE/NwMAQcCuB0KM/Yqks6zU8T83AwBBuK4HQoz9iqSzrNTxPzcDAEGwrgdCjP2KpLOs1PE/NwMAQaiuB0KCh+jSq7C78j83AwBBoK4HQoKH6NKrsLvyPzcDAEGYrgdCgofo0quwu/I/NwMAQZCuB0KCh+jSq7C78j83AwBBiK4HQuGoybqCtKLzPzcDAEHYsQdCrdupvNyo7eg/NwMAQdCxB0Kt26m83Kjt6D83AwBByLEHQq3bqbzcqO3oPzcDAEHAsQdCrdupvNyo7eg/NwMAQbixB0Kt26m83Kjt6D83AwBBsLEHQq3bqbzcqO3oPzcDAEGosQdCrdupvNyo7eg/NwMAQaCxB0Kt26m83Kjt6D83AwBBoKcHQQBBqAEQECIAQp/Wz5emjq3SPzcDwAYgAEKf1s+Xpo6t0j83A7gGIABCn9bPl6aOrdI/NwOwBiAAQp/Wz5emjq3SPzcDqAYgAEKf1s+Xpo6t0j83A6AGIABCn9bPl6aOrdI/NwOYBiAAQp/Wz5emjq3SPzcDkAYgAEKf1s+Xpo6t0j83A4gGIABC5Jv52+jJpdM/NwOABiAAQuSb+dvoyaXTPzcD+AUgAELkm/nb6Mml0z83A/AFIABC5Jv52+jJpdM/NwPoBSAAQqnhoqCrhZ7UPzcD4AUgAEKp4aKgq4We1D83A9gFIABCqeGioKuFntQ/NwPQBSAAQqnhoqCrhZ7UPzcDyAUgAELupszk7cCW1T83A8AFIABCvYmtzeS0/tQ/NwO4BSAAQpXCisHJ9vzRPzcDsAUgAEKgi6aVvbeHzz83A6gFIABCr6y90dHx9cs/NwOgBUGQrwdCrKHb94mQt9Y/NwMAQbCwB0L2nujYwIrE3D83AwBBqLAHQvae6NjAisTcPzcDAEGgsAdC9p7o2MCKxNw/NwMAQZiwB0L2nujYwIrE3D83AwBBkLAHQvae6NjAisTcPzcDAEGIsAdC9p7o2MCKxNw/NwMAQYCwB0L2nujYwIrE3D83AwBB+K8HQvae6NjAisTcPzcDAEHwrwdC0/yQqLX01d0/NwMAQeivB0LT/JCotfTV3T83AwBB4K8HQtP8kKi19NXdPzcDAEHYrwdC0/yQqLX01d0/NwMAQdCvB0Kq5s3viN3n3j83AwBByK8HQqrmze+I3efePzcDAEHArwdCqubN74jd594/NwMAQbivB0Kq5s3viN3n3j83AwBBsK8HQraR6e7ox/nfPzcDAEGorwdCv6/D4PGy3N8/NwMAQaCvB0KvtKPknOCJ3D83AwBBmK8HQuH/466zzY7ZPzcDAEHgsQdC+6i4vZTcntI/NwMAQeixB0Kz5syZs+bM4T83AwBB8LEHQoCAgICAgICSwAA3AwBB+LEHQoCAgICAgICSwAA3AwBBgLIHQoCAgICAgID6PzcDAEGIsgdCs+bMmbPmzOk/NwMAQZCyB0KAgICAgICA+D83AwBBmLIHQoCAgICAgICSwAA3AwBBoLIHQoCAgICAgJCowAA3AwBBsLIHQoCAgICAgMCkwAA3AwBBqLIHQoCAgICAgJCowAA3AwBBuLIHQoCAgICAgOCawAA3AwBBwLIHQri9lNyeiq7PPzcDAEHIsgdCgICAgICAwKTAADcDAEGIswdC/NPGl93JmMA/NwMAQYCzB0K56KK25/enxT83AwBB+LIHQvzTxpfdyZjIPzcDAEHwsgdC+v2p48vupLw/NwMAQZCzB0KAgICAgICAqsAANwMAQZizB0KAgICAgICgq8AANwMAQaCzB0KAgICAgIDArMAANwMAQaizB0KAgICAgICAr8AANwMAQbCzB0KAgICAgIDArMAANwMAQcizB0KAgICAgICA/D83AwBBwLMHQubMmbPmzJn/PzcDAEHYswdCgICAgICAgPg/NwMAQdCzB0LmzJmz5syZ+z83AwBB6LMHQoCAgICAgID8PzcDAEHgswdC5syZs+bMmfk/NwMAQfCzB0KAgICAgICA+D83AwBB+LMHQoCAgICAgID4PzcDAEG4tAdCgICAgICAgILAADcDAEGwtAdCgICAgICAgPw/NwMAQai0B0Kas+bMmbPm/D83AwBBoLQHQvbR8PqouL38PzcDAEGAtAdCzZmz5syZs/4/NwMAQcC0B0Kas+bMmbPmgMAANwMAQci0B0KAgICAgICAgMAANwMAQeC0B0Kz5syZs+bM+T83AwBB0LUHQrPmzJmz5sz5PzcDAEGQtQdCgICAgICAgPw/NwMAQfC0B0KAgICAgICA/D83AwBB+LUHQpTcnoquj4X3PzcDAEGAtgdCgICAgICAgPg/NwMAQYi2B0KAgICAgICA+D83AwBByLYHQoCAgICAgID4PzcDAEHAtgdCgICAgICAgPg/NwMAQbi2B0KAgICAgICA+D83AwBBsLYHQoCAgICAgID4PzcDAEHQtgdCmrPmzJmz5vQ/NwMAQZi3B0KAgICAgICA+D83AwBBkLcHQoCAgICAgID4PzcDAEGItwdCgICAgICAgPg/NwMAQYC3B0KAgICAgICA+D83AwBB4LYHQvuouL2U3J7SPzcDAEGgtwdCs+bMmbPmzOk/NwMAQai3B0L20fD6qLi99D83AwBBsLcHQri9lNyeiq7nPzcDAEG4twdCgICAkMrSxq7CADcDAEHAtwdCmrPmzJmz5vo/NwMAQci3B0KAgICAgIDQz8AANwMAQdC3B0KAgICAgICAgMAANwMAQdi3B0KAgICAgICAn8AANwMAQZi4B0KAgICAgICA+D83AwBBkLgHQoCAgICAgIDoPzcDAEGIuAdCmrPmzJmz5vQ/NwMAQYC4B0Kas+bMmbPm5D83AwBB4LcHQoCAgICAgID4PzcDAEGguAdCmrPmzJmz5vw/NwMAQbC5B0KAgICAgICAisAANwMAQfC4B0KAgICAgICAkMAANwMAQdC4B0KAgICAgICAkMAANwMAQcC4B0KAgICAgICAisAANwMAQai4B0LNmbPmzJmz9j83AwBB2LkHQgA3AwBB4LkHQgA3AwBB6LkHQoCAgICAgID4PzcDAEHwuQdCgICAgICAgPw/NwMAQfi5B0KAgICAgICA/D83AwBBgLoHQoCAgICAgID4PzcDAEGIugdCgICAgICAgPg/NwMAQci6B0KAgICAgICA+D83AwBBwLoHQoCAgICAgID4PzcDAEG4ugdCgICAgICAgPg/NwMAQbC6B0KAgICAgICA+D83AwBBkLoHQoCAgICAgID4PzcDAEHQugdClNyeiq6Phfk/NwMAQdi6B0KAgICAgICAisAANwMAQeC6B0KAgICAgICA+D83AwBB6LoHQoCAgICAgICAwAA3AwBB8LoHQgA3AwBB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PzcDAEG46wdCgICAgICAwKzAADcDAEHA6wdCgICAgICAgITAADcDAEHI6wdCqbi9lNyeiu4/NwMAQejrB0KTiPW+gKTdgMAANwMAQZjsB0L3oOyZhZ2P+T83AwBBkOwHQr6f1YqakPbxPzcDAEGI7AdChbSw087Hiuw/NwMAQYDsB0LqucXShMGV6T83AwBB+OsHQr6s+qGXqN/yPzcDAEHw6wdC28+Oj7Ogpf0/NwMAQfjsB0L20fD6qLi9/L9/NwMAQYDtB0KAgICAgICA+D83AwBBwO0HQpqz5syZs+bkPzcDAEHI7QdC7c7vz5re9O4/NwMAQdDtB0KAgICAgICAisAANwMAQdjtB0LNmbPmzJmzh8AANwMAQYjvB0K/ru2K+5frhUA3AwBBkPAHQqukzKCNvqv1v383AwBBiPAHQpnV4KjJuuL+v383AwBBgPAHQqSW4ITc9c7+v383AwBB+O8HQsD2x5Sihsv+v383AwBB8O8HQpPkh/rsrNX+v383AwBB6O8HQv6ukfi/q9L+v383AwBB4O8HQqbs/Ljt0IL/v383AwBB2O8HQpDvq62Z4Y//v383AwBB0O8HQvOAgvPo4+/+v383AwBByO8HQoyOiJKLsIL/v383AwBBwO8HQrLA7Ou7/7j+v383AwBBuO8HQo7rxdvRgfj9v383AwBBsO8HQs3Cztexl9H9v383AwBBqO8HQsvssaOgvL39v383AwBBoO8HQt2DseeU9Pz8v383AwBBmO8HQrfY7aKZm8j8v383AwBBkO8HQrfAz5+Mobj8v383AwBBgO8HQvGBys3yip7vv383AwBB+O4HQrTn6aygu4fwv383AwBB8O4HQufx3M3w3rLvv383AwBB6O4HQs2Rg7mXwqnyv383AwBB4O4HQsmus/Kb27n6v383AwBB2O4HQpyFq6rQovX3v383AwBB0O4HQvqJ+aTS68z5v383AwBByO4HQpqR7PDpq+r6v383AwBBwO4HQrDBtMbFpof8v383AwBBuO4HQuaQjuvF29H9v383AwBBsO4HQona5bmp3Kr+v383AwBBqO4HQtKS9YToxLD+v383AwBBoO4HQviWkMHij4P/v383AwBBmO4HQufTusibw/v+v383AwBBkO4HQuCE3PXuvOr+v383AwBBiO4HQvv1wPOM0fT+v383AwBBgO4HQrjJ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aiQAQn8gASAAGwsQAEGWCkGjAUHQIygCABAiCwkAIAAoAjwQBAsyAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQDSAAIAAoAhQgAWo2AhQgAguTBQIGfgF/IAEgASgCAEEHakF4cSIBQRBqNgIAIAACfCABKQMAIQQgASkDCCEFIwBBIGsiASQAAkAgBUL///////////8AgyIDQoCAgICAgMCAPH0gA0KAgICAgIDA/8MAfVQEQCAFQgSGIARCPIiEIQMgBEL//////////w+DIgRCgYCAgICAgIAIWgRAIANCgYCAgICAgIDAAHwhAgwCCyADQoCAgICAgICAQH0hAiAEQoCAgICAgICACIVCAFINASACIANCAYN8IQIMAQsgBFAgA0KAgICAgIDA//8AVCADQoCAgICAgMD//wBRG0UEQCAFQgSGIARCPIiEQv////////8Dg0KAgICAgICA/P8AhCECDAELQoCAgICAgID4/wAhAiADQv///////7//wwBWDQBCACECIANCMIinIghBkfcASQ0AIAQhAiAFQv///////z+DQoCAgICAgMAAhCIDIQYCQCAIQYH3AGsiAEHAAHEEQCACIABBQGqthiEGQgAhAgwBCyAARQ0AIAYgAK0iB4YgAkHAACAAa62IhCEGIAIgB4YhAgsgASACNwMQIAEgBjcDGCABIQACQEGB+AAgCGsiCEHAAHEEQCADIAhBQGqtiCEEQgAhAwwBCyAIRQ0AIANBwAAgCGuthiAEIAitIgKIhCEEIAMgAoghAwsgACAENwMAIAAgAzcDCCABKQMIQgSGIAEpAwAiBEI8iIQhAiABKQMQIAEpAxiEQgBSrSAEQv//////////D4OEIgRCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyAEQoCAgICAgICACIVCAFINACACQgGDIAJ8IQILIAFBIGokACACIAVCgICAgICAgICAf4OEvws5AwAL4BYDEn8BfAJ+IwBBsARrIgkkACAJQQA2AiwCQCABvSIZQgBTBEBBASERQeoJIRIgAZoiAb0hGQwBCyAEQYAQcQRAQQEhEUHtCSESDAELQfAJQesJIARBAXEiERshEiARRSEWCwJAIBlCgICAgICAgPj/AINCgICAgICAgPj/AFEEQCAAQSAgAiARQQNqIgsgBEH//3tx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DQAgECIPQgBSDQAgA0QAAAAAAAAAAKIMAQsCQCAPQv////////8HVgRAIA8hEAwBCwNAIABBAWshACAPQoCAgICAgIAEVCEBIA9CAYYiECEPIAENAAsLIBJCgICAgICAgICAf4MgEEKAgICAgICACH0gAK1CNIaEIBBBASAAa62IIABBAEobhL8LRI3ttaD3xrA+YwRAQdSnDigCAEUEQEHUpw4Cf0Gg/QUrAwBB+LkGKwMAoSAEoxAgIgNEAAAAAAAA8EFjIANEAAAAAAAAAABmcQRAIAOrDAELQQALQQFqNgIAC0HQpw5BADYCAAJAQcynDigCACIABEAgACgCACICRQ0BIAAoAgQgAEEMakEAIAAoAggiARsQI0EBIQpBAyEAIAJBAUYNAQNAQcynDigCACILIAAgAWoiAEECdGoiASgCACALIABBAmoiAEECdGpBACABKAIEIgEbECMgCkEBaiIKIAJHDQALDAELQcDXDCsDABAFQcjXDCsDABAFQdDXDCsDABAFQdjXDCsDABAFQeDXDCsDABAFQejXDCsDABAFQfDXDCsDABAFQfjXDCsDABAFQbinDisDABAFQYDYDCsDABAFQainDisDABAFQYjYDCsDABAFQajPDSsDABAFQbDPDSsDABAFQbjPDSsDABAFQcjPDSsDABAFQdjPDSsDABAFQaDPDSsDABAFQcDPDSsDABAFQdDPDSsDABAFQfDPDSsDABAFQejPDSsDABAFQeDPDSsDABAFQZCmDisDABAFQeivCCsDABAFQYCmDisDABAFQciyDSsDABAFQZjkDCsDABAFQcjVCysDABAFQdDVCysDABAFQdjVCysDABAFQejVCysDABAFQfjVCysDABAFQcDVCysDABAFQeDVCysDABAFQfDVCysDABAFQZilDisDABAFQaClDisDABAFQailDisDABAFQbilDisDABAFQcilDisDABAFQZClDisDABAFQbClDisDABAFQcClDisDABAFQfjkBSsDABAFQYjlBSsDABAFQfDkBSsDABAFQYDlBSsDABAFQbjZCysDABAFQcjZCysDABAFQbDZCysDABAFQcDZCysDABAFQYihDisDABAFQaCQDisDABAFQdDLDSsDABAFQejMDSsDABAFQdDMDSsDABAFQaCeDisDABAFQaiQDisDABAFQeDLDSsDABAFQejLDSsDABAFQYDMDSsDABAFQZieDisDABAFQejSDCsDABAFQfDSDCsDABAFQfjSDCsDABAFQYjTDCsDABAFQZjTDCsDABAFQeDSDCsDABAFQYDTDCsDABAFQZDTDCsDABAFQfihDisDABAFQfChDisDABAFQeihDisDABAFQeChDisDABAFQaDIDCsDABAFQdjIDCsDABAFQejIDCsDABAFQbDIDCsDABAFQdDIDCsDABAFQeDIDCsDABAFQbjEDCsDABAFQejEDCsDABAFQfjEDCsDABAFQcDEDCsDABAFQeDEDCsDABAFQfDEDCsDABAFQdjLDCsDABAFQejLDCsDABAFQdDLDCsDABAFQeDLDCsDABAFQdDCDCsDABAFQfCdDisDABAFQfidDisDABAFQdidDisDABAFQeCdDisDABAFQeidDisDABAFQdCdDisDABAFQYiTDisDABAFQcDYDCsDABAFQYiPDisDABAFQfCODisDABAFQYiSDisDABAFQZCSDisDABAFQZiSDisDABAFQaiSDisDABAFQbiSDisDABAFQYCSDisDABAFQaCSDisDABAFQbCSDisDABAFQbCRDisDABAFQbi0DSsDABAFQajBDCsDABAFQZjBDCsDABAFQZDBDCsDABAFQaDBDCsDABAFQfiMDisDABAFQYCNDisDABAFQYiNDisDABAFQZiNDisDABAFQaiNDisDABAFQfCMDisDABAFQZCNDisDABAFQaCNDisDABAFQYjYCysDABAFQfjXCysDABAFQfDXCysDABAFQYDYCysDABAFQZCPDisDABAFQfiODisDABAFQbjRDSsDABAFQcDRDSsDABAFQcjRDSsDABAFQdjRDSsDABAFQejRDSsDABAFQbDRDSsDABAFQdDRDSsDABAFQeDRDSsDABAFQYCPDisDABAFQeiODisDABAFQeDbCysDABAFQbiNDisDABAFQcCNDisDABAFQciNDisDABAFQdiNDisDABAFQeiNDisDABAFQbCNDisDABAFQdCNDisDABAFQeCNDisDABAFQYCODisDABAFQfiNDisDABAFQbDaCysDABAFQaDaCysDABAFQfD1DCsDABAFQfDQDSsDABAFQbjQDSsDABAFQbDQDSsDABAFQZDQDSsDABAFQbDsDSsDABAFQYDyDCsDABAFQej5BysDABAFQdDgDCsDABAFQdDrDSsDABAFQcjrDSsDABAFQaDMDSsDABAFQbjLDSsDABAFQZjMDSsDABAFQaDrDSsDABAFQfjIDSsDABAFQfDnDSsDABAFQZjlDSsDABAFQZDlDSsDABAFQYjlDSsDABAFQYDlDSsDABAFQdifDCsDABAFQaDQDSsDABAFQeD5BysDABAFQZDYDSsDABAFQYjSDSsDABAFQZDSDSsDABAFQZjSDSsDABAFQajSDSsDABAFQbjSDSsDABAFQYDSDSsDABAFQaDSDSsDABAFQbDSDSsDABAFQci0DSsDABAFQZDRDSsDABAFQaDTDCsDABAFQbj6BysDABAFQdjCDCsDABAFQcDODSsDABAFQdjODSsDABAFQeDODSsDABAFQejODSsDABAFQfjODSsDABAFQYjPDSsDABAFQdDODSsDABAFQfDODSsDABAFQYDPDSsDABAFQbjODSsDABAFQbDODSsDABAFQajODSsDABAFQZjODSsDABAFQZDODSsDABAFQYDNDSsDABAFQaDLDSsDABAFQdjLDSsDABAFQbDKDSsDABAFQeDKDSsDABAFQYjMDSsDABAFQfjJDSsDABAFQYDKDSsDABAFQfDJDSsDABAFQaDNDSsDABAFQdjCDSsDABAFQfCNDisDABAFQZDNDSsDABAFQYjNDSsDABAFQbDLDSsDABAFQcDKDSsDABAFQZDMDSsDABAFQfjaCysDABAFQYjKDSsDABAFQdDLCysDABAFQbDMDSsDABAFQajLDSsDABAFQbjKDSsDABAFQcDLDSsDABAFQeDCDSsDABAFQfDLCysDABAFQYjkDCsDABAFQfCvDSsDABAFC0HYpw5B2KcOKAIAQQFqNgIAC0Hcpw4oAgAgDkYNAUEAIQBByI0MQciNDCsDAEGQwQcrAwAiA0HYoA4rAwCioDkDAEHorwhB6K8IKwMAIANBiKYOKwMAmkHQjg4rAwChQfilDisDAKFB6JIOKwMAoEHopQ4rAwCgoqA5AwBBkLgIQZC4CCsDACADQcjBDSsDAEGQwg0rAwCgQfDBDSsDAKFB6MENKwMAoUHYwQ0rAwChQeCQDisDAKGioDkDAEGQkQxBkJEMKwMAIANB0KAOKwMAoqA5AwBBoJQMQaCUDCsDACADQcigDisDAKKg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iAGhIABBgJsOaisDiAGhoqA5A4gBQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIAQYD3B2oiASABKwOQASADIABB0OgGaiIBKwOIASABKwOQAaEgAEGAmw5qKwOQAaGioDkDkAFBASECIApBAXEhAEEAIQogAA0ACwNAIApBqAFsIgBBgPcHaiIBIAErA5gBIAMgAEHQ6AZqIgErA5ABIAErA5gBoSAAQYCbDmorA5gBoaKgOQOYAUEBIQogAkEBcSEAQQAhAiAADQALA0AgAkGoAWwiAEGA9wdqIgEgASsDoAEgAyAAQdDoBmoiASsDmAEgASsDoAGhIABBgJsOaisDoAGhoqA5A6ABQQEhAiAKQQFxIQBBACEKIAANAAsDQEEAIQADQEEAIQIDQCACQQN0IgEgAEEFdCILIApBoAVsIgxB4KkKampqIg0gDSsDACADIAxBwOwNaiALaiABaisDACAMQaC0CmogC2ogAWorAwChoqA5AwAgAkEBaiICQQRHDQALIABBAWoiAEEVRw0ACyAKQQFqIgpBAkcNAAtBACEKA0BBACELA0BBACECA0AgAkEDdCIAIAtBBXQiASAKQaAFbCIMQbCqDGpqaiAMQfDSCWogAWogAGorAwAgCkHQAmxB8LQMaiALQQR0aiACQQJ0aigCABAWOQMAIAJBAWoiAkEERw0ACyALQQFqIgtBFUcNAAsgCkEBaiIKQQJHDQALQQAhC0GQhghBkIYIKwMAQZDBBysDACIDRAAAAAAAAAAAoiIEoDkDAEG4hwhBuIcIKwMAIASgOQMAQQEhCkEBIQBBACECA0AgAkGoAWwiAUGQhghqIgIgAisDECABQYCKDmorAxAgAUGwmA5qKwMQoSABQeDYDGorAxChIAFB0PcFaisDEKEgA6KgOQMQIAAhAUEAIQBBASECIAENAAsDQCALQagBbCIAQZCGCGoiASABKwMYIABBgIoOaisDGCAAQbCYDmorAxihIABB4NgMaisDGKEgAEHQ9wVqKwMYoSADoqA5AxhBASELIApBAXEhAEEAIQogAA0AC0GYhghBmIYIKwMAIASgOQMAQcCHCEHAhwgrAwAgBKA5AwBBACELQQEhCkEBIQBBACECA0AgAkGoAWwiAUGQhghqIgIgAisDICABQeDYDGoiAisDGCABQbCYDmorAyChIAIrAyChIAOioDkDICAAIQFBACEAQQEhAiABDQALA0AgC0GoAWwiAEGQhghqIgEgASsDKCAAQeDYDGoiASsDICAAQbCYDmorAyihIAErAyihIAOioDkDKEEBIQsgCkEBcSEAQQAhCiAADQALQQAhAUGQwQcrAwAhA0EBIQADQCAKQagBbCIKQZCGCGoiCyALKwMwIApB4NgMaiILKwMoIApBsJgOaisDMKEgCysDMKEgA6KgOQMwIAIhC0EAIQJBASEKIAsNAAsDQCABQagBbCIBQZCGCGoiAiACKwM4IAFB4NgMaiICKwMwIAFBsJgOaisDOKEgAisDOKEgA6KgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwNAIABB4NgMaiICKwM4IABBsJgOaisDQKEgAisDQKEgA6KgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCGCGoiAiACKwNIIAFB4NgMaiICKwNAIAFBsJgOaisDSKEgAisDSKEgA6KgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwNQIABB4NgMaiICKwNIIABBsJgOaisDUKEgAisDUKEgA6KgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCGCGoiAiACKwNYIAFB4NgMaiICKwNQIAFBsJgOaisDWKEgAisDWKEgA6KgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwNgIABB4NgMaiICKwNYIABBsJgOaisDYKEgAisDYKEgA6KgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCGCGoiAiACKwNoIAFB4NgMaiICKwNgIAFBsJgOaisDaKEgAisDaKEgA6KgOQNoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwNwIABB4NgMaiICKwNoIABBsJgOaisDcKEgAisDcKEgA6KgOQNwQQEhACABIQJBACEBIAINAAsDQCABQagBbCIBQZCGCGoiAiACKwN4IAFB4NgMaiICKwNwIAFBsJgOaisDeKEgAisDeKEgA6KgOQN4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwOAASAAQeDYDGoiAisDeCAAQbCYDmorA4ABoSACKwOAAaEgA6KgOQOAAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUGQhghqIgIgAisDiAEgAUHg2AxqIgIrA4ABIAFBsJgOaisDiAGhIAIrA4gBoSADoqA5A4gBQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCIAQZCGCGoiAiACKwOQASAAQeDYDGoiAisDiAEgAEGwmA5qKwOQAaEgAisDkAGhIAOioDkDkAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgFBkIYIaiICIAIrA5gBIAFB4NgMaiICKwOQASABQbCYDmorA5gBoSACKwOYAaEgA6KgOQOYAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEGQhghqIgIgAisDoAEgAEHg2AxqIgIrA5gBIABBsJgOaisDoAGhIAIrA6ABoSADoqA5A6ABQQEhACABIQJBACEBIAINAAtBACEAQdCtCEHQrQgrAwBBsP0NKwMAIAOioDkDAEHArQhBwK0IKwMAIANBoP0NKwMAoqA5AwBBqK0IQaitCCsDACADQZD9DSsDAKKgOQMAQZitCEGYrQgrAwAgA0GA/Q0rAwCioDkDAEHQ5AtB0OQLKwMAQYD3DSsDAEHg5AsrAwChIAOioDkDAEHY5AtB2OQLKwMAQYj3DSsDAEHo5AsrAwChIAOioDkDAEH4rQhB+K0IKwMAIANB8PwNKwMAoqA5AwBB6K0IQeitCCsDACADQeD8DSsDAKKgOQMAQZC6DEGQugwrAwAgA0GQ6A0rAwCioDkDAEHggAggA0QAAAAAAAAAAKIiBEHggAgrAwCgOQMAQYiCCCAEQYiCCCsDAKA5AwBB8IAIIARB8IAIKwMAoDkDAEGYggggBEGYgggrAwCgOQMAQQEhAgNAIAFBqAFsIgFB4IAIaiILIAsrAxggAyABQaCHDmorAxggAUHglQ5qKwMYoSABQbDbDGorAxihIAFBoPoFaisDGKGioDkDGCACIQtBACECQQEhASALDQALA0AgAEGoAWwiAEHggAhqIgEgASsDICADIABBoIcOaisDICAAQeCVDmorAyChIABBsNsMaiIBKwMgoSAAQaD6BWorAyChIAErAxigoqA5AyBBASEAIAohAUEAIQogAQ0ACwNAIApBqAFsIgFB4IAIaiICIAIrAyggAyABQaCHDmorAyggAUGg+gVqKwMooSABQeCVDmorAyihIAFBsNsMaiIBKwMooSABKwMgoKKgOQMoQQEhCiAAIQFBACEAIAENAAtB6IAIIARB6IAIKwMAoDkDAEGQggggBEGQgggrAwCgOQMAQQAhAUEBIQADQCABQagBbCIBQeCACGoiAiACKwMwIAMgAUGw2wxqIgIrAyggAUHglQ5qKwMwoSACKwMwoaKgOQMwIAAhAkEAIQBBASEBIAINAAtBACEBQQAhC0GQwQcrAwAhA0EBIQBBASECA0AgC0GoAWwiCkHggAhqIgsgCysDOCAKQbDbDGoiCysDMCAKQeCVDmorAzihIAsrAzihIAOioDkDOCACIQpBACECQQEhCyAKDQALA0AgAUGoAWwiAUHggAhqIgIgAisDQCABQbDbDGoiAisDOCABQeCVDmorA0ChIAIrA0ChIAOioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHggAhqIgIgAisDSCAAQbDbDGoiAisDQCAAQeCVDmorA0ihIAIrA0ihIAOioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHggAhqIgIgAisDUCABQbDbDGoiAisDSCABQeCVDmorA1ChIAIrA1ChIAOioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHggAhqIgIgAisDWCAAQbDbDGoiAisDUCAAQeCVDmorA1ihIAIrA1ihIAOioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHggAhqIgIgAisDYCABQbDbDGoiAisDWCABQeCVDmorA2ChIAIrA2ChIAOioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHggAhqIgIgAisDaCAAQbDbDGoiAisDYCAAQeCVDmorA2ihIAIrA2ihIAOioDkDaEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAUHggAhqIgIgAisDcCABQbDbDGoiAisDaCABQeCVDmorA3ChIAIrA3ChIAOioDkDcEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAEHggAhqIgIgAisDeCAAQbDbDGoiAisDcCAAQeCVDmorA3ihIAIrA3ihIAOioDkDeEEBIQAgASECQQAhASACDQAL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",BA(d)||(d=a(d));function oA(C){try{if(C==d&&f)return new Uint8Array(f);var g=wA(C);if(g)return g;if(O)return O(C);throw"both async and sync fetching of the wasm failed"}catch(s){_(s)}}function NA(){if(!f&&(M||K)){if(typeof fetch=="function"&&!MA(d))return fetch(d,{credentials:"same-origin"}).then(function(C){if(!C.ok)throw"failed to load wasm binary file at \'"+d+"\'";return C.arrayBuffer()}).catch(function(){return oA(d)});if(k)return new Promise(function(C,g){k(d,function(s){C(new Uint8Array(s))},g)})}return Promise.resolve().then(function(){return oA(d)})}function nA(){var C={a:FA};function g(G,r){var L=G.exports;Q.asm=L,y=Q.asm.f,b(y.buffer),V=Q.asm.o,aA(Q.asm.g),tA()}HA();function s(G){g(G.instance)}function e(G){return NA().then(function(r){return WebAssembly.instantiate(r,C)}).then(function(r){return r}).then(G,function(r){N("failed to asynchronously prepare wasm: "+r),_(r)})}function u(){return!f&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(d)&&!MA(d)&&typeof fetch=="function"?fetch(d,{credentials:"same-origin"}).then(function(G){var r=WebAssembly.instantiateStreaming(G,C);return r.then(s,function(L){return N("wasm streaming compile failed: "+L),N("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(C,g);return z}catch(G){return N("Module.instantiateWasm callback failed with error: "+G),!1}return u().catch(D),{}}function DA(C){for(;C.length>0;){var g=C.shift();if(typeof g=="function"){g(Q);continue}var s=g.func;typeof s=="number"?g.arg===void 0?iA(s)():iA(s)(g.arg):s(g.arg===void 0?null:g.arg)}}function iA(C){return V.get(C)}function OA(C,g,s){Z.copyWithin(C,g,g+s)}function hA(C){_("OOM")}function uA(C){Z.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(C,g){var s=AA.buffers[C];g===0||g===10?((C===1?t:N)(q(s,0)),s.length=0):s.push(g)},varargs:void 0,get:function(){AA.varargs+=4;var C=j[AA.varargs-4>>2];return C},getStr:function(C){var g=x(C);return g},get64:function(C,g){return C}};function zA(C){return 0}function jA(C,g,s,e,u){}function LA(C,g,s,e){for(var u=0,z=0;z<s;z++){var G=j[g>>2],r=j[g+4>>2];g+=8;for(var L=0;L<r;L++)AA.printChar(C,Z[G+L]);u+=r}return j[e>>2]=u,0}var fA=typeof atob=="function"?atob:function(C){var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,z,G,r,L,S,R=0;C=C.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do G=g.indexOf(C.charAt(R++)),r=g.indexOf(C.charAt(R++)),L=g.indexOf(C.charAt(R++)),S=g.indexOf(C.charAt(R++)),e=G<<2|r>>4,u=(r&15)<<4|L>>2,z=(L&3)<<6|S,s=s+String.fromCharCode(e),L!==64&&(s=s+String.fromCharCode(u)),S!==64&&(s=s+String.fromCharCode(z));while(R<C.length);return s};function mA(C){try{for(var g=fA(C),s=new Uint8Array(g.length),e=0;e<g.length;++e)s[e]=g.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function wA(C){if(BA(C))return mA(C.slice(EA.length))}var FA={c:OA,d:uA,e:zA,b:jA,a:LA};nA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},CA=Q.stackAlloc=function(){return(CA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=J;var QA;W=function C(){QA||gA(),QA||(W=C)};function gA(C){if(p>0||(X(),p>0))return;function g(){QA||(QA=!0,Q.calledRun=!0,!U&&(GA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),kA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),g()},1)):g()}if(Q.run=gA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return gA(),Q.ready})})();exposeModelWorker(Module)})();\n';
class BundleModelRunner {
  /**
   * @param modelSpec The spec for the bundled model.
   * @param inputMap The model inputs.
   * @param modelRunner The model runner.
   */
  constructor(e, r, Q) {
    this.modelSpec = e, this.inputMap = r, this.modelRunner = Q, this.inputs = [...r.values()].map((i) => i.value), this.outputs = Q.createOutputs();
  }
  async runModelForScenario(e, r) {
    return setInputsForScenario(this.inputMap, e), r[0]?.startsWith("ModelImpl") ? this.runModelWithImplOutputs(r) : this.runModelWithNormalOutputs(r);
  }
  async runModelWithNormalOutputs(e) {
    this.outputs = await this.modelRunner.runModel(this.inputs, this.outputs);
    const r = this.outputs.runTimeInMillis, Q = /* @__PURE__ */ new Map();
    for (const i of e) {
      const o = this.modelSpec.outputVars.get(i);
      if (o)
        if (o.sourceName === void 0) {
          const B = this.outputs.getSeriesForVar(o.varId);
          B && Q.set(i, datasetFromPoints(B.points));
        } else
          console.error("Static data sources not yet handled in default model check bundle");
    }
    return {
      datasetMap: Q,
      modelRunTime: r
    };
  }
  async runModelWithImplOutputs(e) {
    const r = [];
    for (const w of e) {
      const n = this.modelSpec.implVars.get(w);
      n && r.push(n);
    }
    const Q = this.outputs.startTime, i = this.outputs.endTime, o = this.outputs.saveFreq;
    let B = createImplOutputs(r, Q, i, o);
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
function createImplOutputs(A, e, r, Q) {
  const i = [], o = [];
  for (const s of A)
    i.push(s.varId), o.push({
      varIndex: s.varIndex,
      subscriptIndices: s.subscriptIndices
    });
  const B = new Outputs(i, e, r, Q);
  return B.varSpecs = o, B;
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
  const r = await spawnAsyncModelRunner({ source: modelWorkerJs }), Q = new BundleModelRunner(A, e, r);
  return new BundleModel(A, Q);
}
function createBundle() {
  const A = getInputVars(inputSpecs), e = getOutputVars(outputSpecs), { implVars: r, implVarGroups: Q } = getImplVars(encodedImplVars), i = {
    modelSizeInBytes,
    dataSizeInBytes,
    inputVars: A,
    outputVars: e,
    implVars: r,
    implVarGroups: Q
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
