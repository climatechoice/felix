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
    return E >= Q ? g(n, E, Q, "day") : E >= r ? g(n, E, r, "hour") : E >= e ? g(n, E, e, "minute") : E >= A ? g(n, E, A, "second") : n + " ms";
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
    Q.debug = Q, Q.default = Q, Q.coerce = g, Q.disable = s, Q.enable = o, Q.enabled = a, Q.humanize = requireMs(), Q.destroy = n, Object.keys(e).forEach((E) => {
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
      let l, f = null, h, D;
      function w(...I) {
        if (!w.enabled)
          return;
        const t = w, C = Number(/* @__PURE__ */ new Date()), c = C - (l || C);
        t.diff = c, t.prev = l, t.curr = C, l = C, I[0] = Q.coerce(I[0]), typeof I[0] != "string" && I.unshift("%O");
        let d = 0;
        I[0] = I[0].replace(/%([a-zA-Z%])/g, (K, p) => {
          if (K === "%%")
            return "%";
          d++;
          const O = Q.formatters[p];
          if (typeof O == "function") {
            const q = I[d];
            K = O.call(t, q), I.splice(d, 1), d--;
          }
          return K;
        }), Q.formatArgs.call(t, I), (t.log || Q.log).apply(t, I);
      }
      return w.namespace = E, w.useColors = Q.useColors(), w.color = Q.selectColor(E), w.extend = i, w.destroy = Q.destroy, Object.defineProperty(w, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (h !== Q.namespaces && (h = Q.namespaces, D = Q.enabled(E)), D),
        set: (I) => {
          f = I;
        }
      }), typeof Q.init == "function" && Q.init(w), w;
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
      let f = 0, h = 0, D = -1, w = 0;
      for (; f < E.length; )
        if (h < l.length && (l[h] === E[f] || l[h] === "*"))
          l[h] === "*" ? (D = h, w = f, h++) : (f++, h++);
        else if (D !== -1)
          h = D + 1, w++, f = w;
        else
          return !1;
      for (; h < l.length && l[h] === "*"; )
        h++;
      return h === l.length;
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
    function g(E) {
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
      const g = "color: " + this.color;
      a.splice(1, 0, g, "color: inherit");
      let n = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (n++, l === "%c" && (E = n));
      }), a.splice(E, 0, g);
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
        const g = !o;
        if (o = !0, !g || i)
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
          const g = r.from(a).subscribe({
            next(n) {
              Q.next(n);
            },
            error(n) {
              Q.error(n);
            },
            complete() {
              const n = i.indexOf(g);
              n >= 0 && i.splice(n, 1), B();
            }
          });
          i.push(g);
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
      }, g = (n) => {
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
      this.fulfillmentCallbacks.push(g), this.rejectionCallbacks.push(a);
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
        g(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    g((Q = Q.apply(A, e || [])).next());
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
        g(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    g((Q = Q.apply(A, [])).next());
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
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (Q) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (Q = 1, i && (o = g[0] & 2 ? i.return : g[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, g[1])).done) return o;
      switch (i = 0, o && (g = [g[0] & 2, o.value]), g[0]) {
        case 0:
        case 1:
          o = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, i = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (o = r.trys, !(o = o.length > 0 && o[o.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!o || g[1] > o[0] && g[1] < o[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < o[1]) {
            r.label = o[1], o = g;
            break;
          }
          if (o && r.label < o[2]) {
            r.label = o[2], r.ops.push(g);
            break;
          }
          o[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], i = 0;
    } finally {
      Q = o = 0;
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
    var g;
    a !== Q && (Q = a, (g = i.onSet) == null || g.call(i));
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
    for (let g = 0; g < a; g++)
      e[Q++] = s[g];
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
    const g = A[Q++], n = A[Q++], E = {
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
          const g = cartesianProductOf(a);
          for (const n of g) {
            const E = n.map((h) => h.id).join(","), l = n.map((h) => h.index), f = `${o}[${E}]`;
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
      for (const K of r.lookups)
        resolveVarRef(this.listing, K.varRef, "lookup");
      const M = getEncodedLookupBufferLengths(r.lookups);
      s = M.lookupsLength, a = M.lookupIndicesLength;
    } else
      s = 0, a = 0;
    let g = 0;
    function n(M, K) {
      const p = g, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, q = Math.round(K * O), z = Math.ceil(q / 8) * 8;
      return g += z, p;
    }
    const E = n("int32", headerLengthInElements), l = n("float64", extrasLengthInElements), f = n("float64", Q), h = n("float64", i), D = n("int32", o), w = n("float64", s), I = n("int32", a), t = g;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const C = this.header.view;
    let c = 0;
    C[c++] = l, C[c++] = extrasLengthInElements, C[c++] = f, C[c++] = Q, C[c++] = h, C[c++] = i, C[c++] = D, C[c++] = o, C[c++] = w, C[c++] = s, C[c++] = I, C[c++] = a, this.inputs.update(this.encoded, f, Q), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, h, i), this.outputIndices.update(this.encoded, D, o), this.lookups.update(this.encoded, w, s), this.lookupIndices.update(this.encoded, I, a);
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
    const Q = this.header.view;
    let i = 0;
    const o = Q[i++], B = Q[i++], s = Q[i++], a = Q[i++], g = Q[i++], n = Q[i++], E = Q[i++], l = Q[i++], f = Q[i++], h = Q[i++], D = Q[i++], w = Q[i++], I = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, C = n * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = h * Float64Array.BYTES_PER_ELEMENT, M = w * Int32Array.BYTES_PER_ELEMENT, K = e + I + t + C + c + d + M;
    if (A.byteLength < K)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, o, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, g, n), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, h), this.lookupIndices.update(this.encoded, D, w);
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
    runModel: async (s, a, g) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (o)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      o = !0, i.updateFromParams(s, a, g);
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
        return (t = this._str) !== null && t !== void 0 ? t : this._str = this._items.reduce((C, c) => `${C}${c}`, "");
      }
      get names() {
        var t;
        return (t = this._names) !== null && t !== void 0 ? t : this._names = this._items.reduce((C, c) => (c instanceof r && (C[c.str] = (C[c.str] || 0) + 1), C), {});
      }
    }
    A._Code = Q, A.nil = new Q("");
    function i(I, ...t) {
      const C = [I[0]];
      let c = 0;
      for (; c < t.length; )
        s(C, t[c]), C.push(I[++c]);
      return new Q(C);
    }
    A._ = i;
    const o = new Q("+");
    function B(I, ...t) {
      const C = [f(I[0])];
      let c = 0;
      for (; c < t.length; )
        C.push(o), s(C, t[c]), C.push(o, f(I[++c]));
      return a(C), new Q(C);
    }
    A.str = B;
    function s(I, t) {
      t instanceof Q ? I.push(...t._items) : t instanceof r ? I.push(t) : I.push(E(t));
    }
    A.addCodeArg = s;
    function a(I) {
      let t = 1;
      for (; t < I.length - 1; ) {
        if (I[t] === o) {
          const C = g(I[t - 1], I[t + 1]);
          if (C !== void 0) {
            I.splice(t - 1, 3, C);
            continue;
          }
          I[t++] = "+";
        }
        t++;
      }
    }
    function g(I, t) {
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
      return new Q(f(I));
    }
    A.stringify = l;
    function f(I) {
      return JSON.stringify(I).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    A.safeStringify = f;
    function h(I) {
      return typeof I == "string" && A.IDENTIFIER.test(I) ? new Q(`.${I}`) : i`[${I}]`;
    }
    A.getProperty = h;
    function D(I) {
      if (typeof I == "string" && A.IDENTIFIER.test(I))
        return new Q(`${I}`);
      throw new Error(`CodeGen: invalid export name: ${I}, use explicit $id name mapping`);
    }
    A.getEsmExportName = D;
    function w(I) {
      return new Q(I.toString());
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
    var Q;
    (function(a) {
      a[a.Started = 0] = "Started", a[a.Completed = 1] = "Completed";
    })(Q || (A.UsedValueState = Q = {})), A.varKinds = {
      const: new e.Name("const"),
      let: new e.Name("let"),
      var: new e.Name("var")
    };
    class i {
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
    A.Scope = i;
    class o extends e.Name {
      constructor(g, n) {
        super(n), this.prefix = g;
      }
      setValue(g, { property: n, itemIndex: E }) {
        this.value = g, this.scopePath = (0, e._)`.${new e.Name(n)}[${E}]`;
      }
    }
    A.ValueScopeName = o;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(g) {
        super(g), this._values = {}, this._scope = g.scope, this.opts = { ...g, _n: g.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(g) {
        return new o(g, this._newName(g));
      }
      value(g, n) {
        var E;
        if (n.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(g), { prefix: f } = l, h = (E = n.key) !== null && E !== void 0 ? E : n.ref;
        let D = this._values[f];
        if (D) {
          const t = D.get(h);
          if (t)
            return t;
        } else
          D = this._values[f] = /* @__PURE__ */ new Map();
        D.set(h, l);
        const w = this._scope[f] || (this._scope[f] = []), I = w.length;
        return w[I] = n.ref, l.setValue(n, { property: f, itemIndex: I }), l;
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
          const D = g[h];
          if (!D)
            continue;
          const w = E[h] = E[h] || /* @__PURE__ */ new Map();
          D.forEach((I) => {
            if (w.has(I))
              return;
            w.set(I, Q.Started);
            let t = n(I);
            if (t) {
              const C = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${C} ${I} = ${t};${this.opts._n}`;
            } else if (t = l?.(I))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(I);
            w.set(I, Q.Completed);
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
      optimizeNames(u, m) {
        return this;
      }
    }
    class B extends o {
      constructor(u, m, y) {
        super(), this.varKind = u, this.name = m, this.rhs = y;
      }
      render({ es5: u, _n: m }) {
        const y = u ? r.varKinds.var : this.varKind, b = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${y} ${this.name}${b};` + m;
      }
      optimizeNames(u, m) {
        if (u[this.name.str])
          return this.rhs && (this.rhs = Y(this.rhs, u, m)), this;
      }
      get names() {
        return this.rhs instanceof e._CodeOrName ? this.rhs.names : {};
      }
    }
    class s extends o {
      constructor(u, m, y) {
        super(), this.lhs = u, this.rhs = m, this.sideEffects = y;
      }
      render({ _n: u }) {
        return `${this.lhs} = ${this.rhs};` + u;
      }
      optimizeNames(u, m) {
        if (!(this.lhs instanceof e.Name && !u[this.lhs.str] && !this.sideEffects))
          return this.rhs = Y(this.rhs, u, m), this;
      }
      get names() {
        const u = this.lhs instanceof e.Name ? {} : { ...this.lhs.names };
        return L(u, this.rhs);
      }
    }
    class a extends s {
      constructor(u, m, y, b) {
        super(u, y, b), this.op = m;
      }
      render({ _n: u }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + u;
      }
    }
    class g extends o {
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
      optimizeNames(u, m) {
        return this.code = Y(this.code, u, m), this;
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
        return this.nodes.reduce((m, y) => m + y.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let m = u.length;
        for (; m--; ) {
          const y = u[m].optimizeNodes();
          Array.isArray(y) ? u.splice(m, 1, ...y) : y ? u[m] = y : u.splice(m, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, m) {
        const { nodes: y } = this;
        let b = y.length;
        for (; b--; ) {
          const F = y[b];
          F.optimizeNames(u, m) || (x(u, F.names), y.splice(b, 1));
        }
        return y.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((u, m) => S(u, m.names), {});
      }
    }
    class h extends f {
      render(u) {
        return "{" + u._n + super.render(u) + "}" + u._n;
      }
    }
    class D extends f {
    }
    class w extends h {
    }
    w.kind = "else";
    class I extends h {
      constructor(u, m) {
        super(m), this.condition = u;
      }
      render(u) {
        let m = `if(${this.condition})` + super.render(u);
        return this.else && (m += "else " + this.else.render(u)), m;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const u = this.condition;
        if (u === !0)
          return this.nodes;
        let m = this.else;
        if (m) {
          const y = m.optimizeNodes();
          m = this.else = Array.isArray(y) ? new w(y) : y;
        }
        if (m)
          return u === !1 ? m instanceof I ? m : m.nodes : this.nodes.length ? this : new I(rA(u), m instanceof I ? [m] : m.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, m) {
        var y;
        if (this.else = (y = this.else) === null || y === void 0 ? void 0 : y.optimizeNames(u, m), !!(super.optimizeNames(u, m) || this.else))
          return this.condition = Y(this.condition, u, m), this;
      }
      get names() {
        const u = super.names;
        return L(u, this.condition), this.else && S(u, this.else.names), u;
      }
    }
    I.kind = "if";
    class t extends h {
    }
    t.kind = "for";
    class C extends t {
      constructor(u) {
        super(), this.iteration = u;
      }
      render(u) {
        return `for(${this.iteration})` + super.render(u);
      }
      optimizeNames(u, m) {
        if (super.optimizeNames(u, m))
          return this.iteration = Y(this.iteration, u, m), this;
      }
      get names() {
        return S(super.names, this.iteration.names);
      }
    }
    class c extends t {
      constructor(u, m, y, b) {
        super(), this.varKind = u, this.name = m, this.from = y, this.to = b;
      }
      render(u) {
        const m = u.es5 ? r.varKinds.var : this.varKind, { name: y, from: b, to: F } = this;
        return `for(${m} ${y}=${b}; ${y}<${F}; ${y}++)` + super.render(u);
      }
      get names() {
        const u = L(super.names, this.from);
        return L(u, this.to);
      }
    }
    class d extends t {
      constructor(u, m, y, b) {
        super(), this.loop = u, this.varKind = m, this.name = y, this.iterable = b;
      }
      render(u) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
      }
      optimizeNames(u, m) {
        if (super.optimizeNames(u, m))
          return this.iterable = Y(this.iterable, u, m), this;
      }
      get names() {
        return S(super.names, this.iterable.names);
      }
    }
    class M extends h {
      constructor(u, m, y) {
        super(), this.name = u, this.args = m, this.async = y;
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
    class p extends h {
      render(u) {
        let m = "try" + super.render(u);
        return this.catch && (m += this.catch.render(u)), this.finally && (m += this.finally.render(u)), m;
      }
      optimizeNodes() {
        var u, m;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (m = this.finally) === null || m === void 0 || m.optimizeNodes(), this;
      }
      optimizeNames(u, m) {
        var y, b;
        return super.optimizeNames(u, m), (y = this.catch) === null || y === void 0 || y.optimizeNames(u, m), (b = this.finally) === null || b === void 0 || b.optimizeNames(u, m), this;
      }
      get names() {
        const u = super.names;
        return this.catch && S(u, this.catch.names), this.finally && S(u, this.finally.names), u;
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
    class q extends h {
      render(u) {
        return "finally" + super.render(u);
      }
    }
    q.kind = "finally";
    class z {
      constructor(u, m = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...m, _n: m.lines ? `
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
      scopeValue(u, m) {
        const y = this._extScope.value(u, m);
        return (this._values[y.prefix] || (this._values[y.prefix] = /* @__PURE__ */ new Set())).add(y), y;
      }
      getScopeValue(u, m) {
        return this._extScope.getValue(u, m);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(u) {
        return this._extScope.scopeRefs(u, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(u, m, y, b) {
        const F = this._scope.toName(m);
        return y !== void 0 && b && (this._constants[F.str] = y), this._leafNode(new B(u, F, y)), F;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, m, y) {
        return this._def(r.varKinds.const, u, m, y);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, m, y) {
        return this._def(r.varKinds.let, u, m, y);
      }
      // `var` declaration with optional assignment
      var(u, m, y) {
        return this._def(r.varKinds.var, u, m, y);
      }
      // assignment code
      assign(u, m, y) {
        return this._leafNode(new s(u, m, y));
      }
      // `+=` code
      add(u, m) {
        return this._leafNode(new a(u, A.operators.ADD, m));
      }
      // appends passed SafeExpr to code or executes Block
      code(u) {
        return typeof u == "function" ? u() : u !== e.nil && this._leafNode(new l(u)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...u) {
        const m = ["{"];
        for (const [y, b] of u)
          m.length > 1 && m.push(","), m.push(y), (y !== b || this.opts.es5) && (m.push(":"), (0, e.addCodeArg)(m, b));
        return m.push("}"), new e._Code(m);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, m, y) {
        if (this._blockNode(new I(u)), m && y)
          this.code(m).else().code(y).endIf();
        else if (m)
          this.code(m).endIf();
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
        return this._elseNode(new w());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(I, w);
      }
      _for(u, m) {
        return this._blockNode(u), m && this.code(m).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, m) {
        return this._for(new C(u), m);
      }
      // `for` statement for a range of values
      forRange(u, m, y, b, F = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(F, J, m, y), () => b(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, m, y, b = r.varKinds.const) {
        const F = this._scope.toName(u);
        if (this.opts.es5) {
          const J = m instanceof e.Name ? m : this.var("_arr", m);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (U) => {
            this.var(F, (0, e._)`${J}[${U}]`), y(F);
          });
        }
        return this._for(new d("of", b, F, m), () => y(F));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, m, y, b = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${m})`, y);
        const F = this._scope.toName(u);
        return this._for(new d("in", b, F, m), () => y(F));
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
        const m = new K();
        if (this._blockNode(m), this.code(u), m.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(K);
      }
      // `try` statement
      try(u, m, y) {
        if (!m && !y)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const b = new p();
        if (this._blockNode(b), this.code(u), m) {
          const F = this.name("e");
          this._currNode = b.catch = new O(F), m(F);
        }
        return y && (this._currNode = b.finally = new q(), this.code(y)), this._endBlockNode(O, q);
      }
      // `throw` statement
      throw(u) {
        return this._leafNode(new E(u));
      }
      // start self-balancing block
      block(u, m) {
        return this._blockStarts.push(this._nodes.length), u && this.code(u).endBlock(m), this;
      }
      // end the current self-balancing block
      endBlock(u) {
        const m = this._blockStarts.pop();
        if (m === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const y = this._nodes.length - m;
        if (y < 0 || u !== void 0 && y !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${y} vs ${u} expected`);
        return this._nodes.length = m, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, m = e.nil, y, b) {
        return this._blockNode(new M(u, m, y)), b && this.code(b).endFunc(), this;
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
      _endBlockNode(u, m) {
        const y = this._currNode;
        if (y instanceof u || m && y instanceof m)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${m ? `${u.kind}/${m.kind}` : u.kind}"`);
      }
      _elseNode(u) {
        const m = this._currNode;
        if (!(m instanceof I))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = m.else = u, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const u = this._nodes;
        return u[u.length - 1];
      }
      set _currNode(u) {
        const m = this._nodes;
        m[m.length - 1] = u;
      }
    }
    A.CodeGen = z;
    function S(N, u) {
      for (const m in u)
        N[m] = (N[m] || 0) + (u[m] || 0);
      return N;
    }
    function L(N, u) {
      return u instanceof e._CodeOrName ? S(N, u.names) : N;
    }
    function Y(N, u, m) {
      if (N instanceof e.Name)
        return y(N);
      if (!b(N))
        return N;
      return new e._Code(N._items.reduce((F, J) => (J instanceof e.Name && (J = y(J)), J instanceof e._Code ? F.push(...J._items) : F.push(J), F), []));
      function y(F) {
        const J = m[F.str];
        return J === void 0 || u[F.str] !== 1 ? F : (delete u[F.str], J);
      }
      function b(F) {
        return F instanceof e._Code && F._items.some((J) => J instanceof e.Name && u[J.str] === 1 && m[J.str] !== void 0);
      }
    }
    function x(N, u) {
      for (const m in u)
        N[m] = (N[m] || 0) - (u[m] || 0);
    }
    function rA(N) {
      return typeof N == "boolean" || typeof N == "number" || N === null ? !N : (0, e._)`!${_(N)}`;
    }
    A.not = rA;
    const QA = P(A.operators.AND);
    function T(...N) {
      return N.reduce(QA);
    }
    A.and = T;
    const oA = P(A.operators.OR);
    function v(...N) {
      return N.reduce(oA);
    }
    A.or = v;
    function P(N) {
      return (u, m) => u === e.nil ? m : m === e.nil ? u : (0, e._)`${_(u)} ${N} ${_(m)}`;
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
    for (const K of d)
      M[K] = !0;
    return M;
  }
  util.toHash = r;
  function Q(d, M) {
    return typeof M == "boolean" ? M : Object.keys(M).length === 0 ? !0 : (i(d, M), !o(M, d.self.RULES.all));
  }
  util.alwaysValidSchema = Q;
  function i(d, M = d.schema) {
    const { opts: K, self: p } = d;
    if (!K.strictSchema || typeof M == "boolean")
      return;
    const O = p.RULES.keywords;
    for (const q in M)
      O[q] || c(d, `unknown keyword: "${q}"`);
  }
  util.checkUnknownRules = i;
  function o(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (M[K])
        return !0;
    return !1;
  }
  util.schemaHasRules = o;
  function B(d, M) {
    if (typeof d == "boolean")
      return !d;
    for (const K in d)
      if (K !== "$ref" && M.all[K])
        return !0;
    return !1;
  }
  util.schemaHasRulesButRef = B;
  function s({ topSchemaRef: d, schemaPath: M }, K, p, O) {
    if (!O) {
      if (typeof K == "number" || typeof K == "boolean")
        return K;
      if (typeof K == "string")
        return (0, A._)`${K}`;
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
      for (const K of d)
        M(K);
    else
      M(d);
  }
  util.eachItem = l;
  function f({ mergeNames: d, mergeToName: M, mergeValues: K, resultToName: p }) {
    return (O, q, z, S) => {
      const L = z === void 0 ? q : z instanceof A.Name ? (q instanceof A.Name ? d(O, q, z) : M(O, q, z), z) : q instanceof A.Name ? (M(O, z, q), q) : K(q, z);
      return S === A.Name && !(L instanceof A.Name) ? p(O, L) : L;
    };
  }
  util.mergeEvaluated = {
    props: f({
      mergeNames: (d, M, K) => d.if((0, A._)`${K} !== true && ${M} !== undefined`, () => {
        d.if((0, A._)`${M} === true`, () => d.assign(K, !0), () => d.assign(K, (0, A._)`${K} || {}`).code((0, A._)`Object.assign(${K}, ${M})`));
      }),
      mergeToName: (d, M, K) => d.if((0, A._)`${K} !== true`, () => {
        M === !0 ? d.assign(K, !0) : (d.assign(K, (0, A._)`${K} || {}`), D(d, K, M));
      }),
      mergeValues: (d, M) => d === !0 ? !0 : { ...d, ...M },
      resultToName: h
    }),
    items: f({
      mergeNames: (d, M, K) => d.if((0, A._)`${K} !== true && ${M} !== undefined`, () => d.assign(K, (0, A._)`${M} === true ? true : ${K} > ${M} ? ${K} : ${M}`)),
      mergeToName: (d, M, K) => d.if((0, A._)`${K} !== true`, () => d.assign(K, M === !0 ? !0 : (0, A._)`${K} > ${M} ? ${K} : ${M}`)),
      mergeValues: (d, M) => d === !0 ? !0 : Math.max(d, M),
      resultToName: (d, M) => d.var("items", M)
    })
  };
  function h(d, M) {
    if (M === !0)
      return d.var("props", !0);
    const K = d.var("props", (0, A._)`{}`);
    return M !== void 0 && D(d, K, M), K;
  }
  util.evaluatedPropsToName = h;
  function D(d, M, K) {
    Object.keys(K).forEach((p) => d.assign((0, A._)`${M}${(0, A.getProperty)(p)}`, !0));
  }
  util.setEvaluated = D;
  const w = {};
  function I(d, M) {
    return d.scopeValue("func", {
      ref: M,
      code: w[M.code] || (w[M.code] = new e._Code(M.code))
    });
  }
  util.useFunc = I;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function C(d, M, K) {
    if (d instanceof A.Name) {
      const p = M === t.Num;
      return K ? p ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : p ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return K ? (0, A.getProperty)(d).toString() : "/" + n(d);
  }
  util.getErrorPath = C;
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
    const e = requireCodegen(), r = requireUtil(), Q = requireNames();
    A.keywordError = {
      message: ({ keyword: w }) => (0, e.str)`must pass "${w}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: w, schemaType: I }) => I ? (0, e.str)`"${w}" keyword must be ${I} ($data)` : (0, e.str)`"${w}" keyword is invalid ($data)`
    };
    function i(w, I = A.keywordError, t, C) {
      const { it: c } = w, { gen: d, compositeRule: M, allErrors: K } = c, p = E(w, I, t);
      C ?? (M || K) ? a(d, p) : g(c, (0, e._)`[${p}]`);
    }
    A.reportError = i;
    function o(w, I = A.keywordError, t) {
      const { it: C } = w, { gen: c, compositeRule: d, allErrors: M } = C, K = E(w, I, t);
      a(c, K), d || M || g(C, Q.default.vErrors);
    }
    A.reportExtraError = o;
    function B(w, I) {
      w.assign(Q.default.errors, I), w.if((0, e._)`${Q.default.vErrors} !== null`, () => w.if(I, () => w.assign((0, e._)`${Q.default.vErrors}.length`, I), () => w.assign(Q.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: w, keyword: I, schemaValue: t, data: C, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = w.name("err");
      w.forRange("i", c, Q.default.errors, (K) => {
        w.const(M, (0, e._)`${Q.default.vErrors}[${K}]`), w.if((0, e._)`${M}.instancePath === undefined`, () => w.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(Q.default.instancePath, d.errorPath))), w.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${I}`), d.opts.verbose && (w.assign((0, e._)`${M}.schema`, t), w.assign((0, e._)`${M}.data`, C));
      });
    }
    A.extendErrors = s;
    function a(w, I) {
      const t = w.const("err", I);
      w.if((0, e._)`${Q.default.vErrors} === null`, () => w.assign(Q.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${Q.default.vErrors}.push(${t})`), w.code((0, e._)`${Q.default.errors}++`);
    }
    function g(w, I) {
      const { gen: t, validateName: C, schemaEnv: c } = w;
      c.$async ? t.throw((0, e._)`new ${w.ValidationError}(${I})`) : (t.assign((0, e._)`${C}.errors`, I), t.return(!1));
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
    function E(w, I, t) {
      const { createErrors: C } = w.it;
      return C === !1 ? (0, e._)`{}` : l(w, I, t);
    }
    function l(w, I, t = {}) {
      const { gen: C, it: c } = w, d = [
        f(c, t),
        h(w, t)
      ];
      return D(w, I, d), C.object(...d);
    }
    function f({ errorPath: w }, { instancePath: I }) {
      const t = I ? (0, e.str)`${w}${(0, r.getErrorPath)(I, r.Type.Str)}` : w;
      return [Q.default.instancePath, (0, e.strConcat)(Q.default.instancePath, t)];
    }
    function h({ keyword: w, it: { errSchemaPath: I } }, { schemaPath: t, parentSchema: C }) {
      let c = C ? I : (0, e.str)`${I}/${w}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [n.schemaPath, c];
    }
    function D(w, { params: I, message: t }, C) {
      const { keyword: c, data: d, schemaValue: M, it: K } = w, { opts: p, propertyName: O, topSchemaRef: q, schemaPath: z } = K;
      C.push([n.keyword, c], [n.params, typeof I == "function" ? I(w) : I || (0, e._)`{}`]), p.messages && C.push([n.message, typeof t == "function" ? t(w) : t]), p.verbose && C.push([n.schema, M], [n.parentSchema, (0, e._)`${q}${z}`], [Q.default.data, d]), O && C.push([n.propertyName, O]);
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
    const { gen: a, schema: g, validateName: n } = s;
    g === !1 ? B(s, !1) : typeof g == "object" && g.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${n}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function o(s, a) {
    const { gen: g, schema: n } = s;
    n === !1 ? (g.var(a, !1), B(s)) : g.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = o;
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
    const { gen: c, data: d, opts: M } = t, K = n(C, M.coerceTypes), p = C.length > 0 && !(K.length === 0 && C.length === 1 && (0, e.schemaHasRulesForType)(t, C[0]));
    if (p) {
      const O = h(C, d, M.strictNumbers, o.Wrong);
      c.if(O, () => {
        K.length ? E(t, C, K) : w(t);
      });
    }
    return p;
  }
  dataType.coerceAndCheckDataType = a;
  const g = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function n(t, C) {
    return C ? t.filter((c) => g.has(c) || C === "array" && c === "array") : [];
  }
  function E(t, C, c) {
    const { gen: d, data: M, opts: K } = t, p = d.let("dataType", (0, Q._)`typeof ${M}`), O = d.let("coerced", (0, Q._)`undefined`);
    K.coerceTypes === "array" && d.if((0, Q._)`${p} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, Q._)`${M}[0]`).assign(p, (0, Q._)`typeof ${M}`).if(h(C, M, K.strictNumbers), () => d.assign(O, M))), d.if((0, Q._)`${O} !== undefined`);
    for (const z of c)
      (g.has(z) || z === "array" && K.coerceTypes === "array") && q(z);
    d.else(), w(t), d.endIf(), d.if((0, Q._)`${O} !== undefined`, () => {
      d.assign(M, O), l(t, O);
    });
    function q(z) {
      switch (z) {
        case "string":
          d.elseIf((0, Q._)`${p} == "number" || ${p} == "boolean"`).assign(O, (0, Q._)`"" + ${M}`).elseIf((0, Q._)`${M} === null`).assign(O, (0, Q._)`""`);
          return;
        case "number":
          d.elseIf((0, Q._)`${p} == "boolean" || ${M} === null
              || (${p} == "string" && ${M} && ${M} == +${M})`).assign(O, (0, Q._)`+${M}`);
          return;
        case "integer":
          d.elseIf((0, Q._)`${p} === "boolean" || ${M} === null
              || (${p} === "string" && ${M} && ${M} == +${M} && !(${M} % 1))`).assign(O, (0, Q._)`+${M}`);
          return;
        case "boolean":
          d.elseIf((0, Q._)`${M} === "false" || ${M} === 0 || ${M} === null`).assign(O, !1).elseIf((0, Q._)`${M} === "true" || ${M} === 1`).assign(O, !0);
          return;
        case "null":
          d.elseIf((0, Q._)`${M} === "" || ${M} === 0 || ${M} === false`), d.assign(O, null);
          return;
        case "array":
          d.elseIf((0, Q._)`${p} === "string" || ${p} === "number"
              || ${p} === "boolean" || ${M} === null`).assign(O, (0, Q._)`[${M}]`);
      }
    }
  }
  function l({ gen: t, parentData: C, parentDataProperty: c }, d) {
    t.if((0, Q._)`${C} !== undefined`, () => t.assign((0, Q._)`${C}[${c}]`, d));
  }
  function f(t, C, c, d = o.Correct) {
    const M = d === o.Correct ? Q.operators.EQ : Q.operators.NEQ;
    let K;
    switch (t) {
      case "null":
        return (0, Q._)`${C} ${M} null`;
      case "array":
        K = (0, Q._)`Array.isArray(${C})`;
        break;
      case "object":
        K = (0, Q._)`${C} && typeof ${C} == "object" && !Array.isArray(${C})`;
        break;
      case "integer":
        K = p((0, Q._)`!(${C} % 1) && !isNaN(${C})`);
        break;
      case "number":
        K = p();
        break;
      default:
        return (0, Q._)`typeof ${C} ${M} ${t}`;
    }
    return d === o.Correct ? K : (0, Q.not)(K);
    function p(O = Q.nil) {
      return (0, Q.and)((0, Q._)`typeof ${C} == "number"`, O, c ? (0, Q._)`isFinite(${C})` : Q.nil);
    }
  }
  dataType.checkDataType = f;
  function h(t, C, c, d) {
    if (t.length === 1)
      return f(t[0], C, c, d);
    let M;
    const K = (0, i.toHash)(t);
    if (K.array && K.object) {
      const p = (0, Q._)`typeof ${C} != "object"`;
      M = K.null ? p : (0, Q._)`!${C} || ${p}`, delete K.null, delete K.array, delete K.object;
    } else
      M = Q.nil;
    K.number && delete K.integer;
    for (const p in K)
      M = (0, Q.and)(M, f(p, C, c, d));
    return M;
  }
  dataType.checkDataTypes = h;
  const D = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: C }) => typeof t == "string" ? (0, Q._)`{type: ${t}}` : (0, Q._)`{type: ${C}}`
  };
  function w(t) {
    const C = I(t);
    (0, r.reportError)(C, D);
  }
  dataType.reportTypeError = w;
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
  function r(i, o) {
    const { properties: B, items: s } = i.schema;
    if (o === "object" && B)
      for (const a in B)
        Q(i, a, B[a].default);
    else o === "array" && Array.isArray(s) && s.forEach((a, g) => Q(i, g, a.default));
  }
  defaults.assignDefaults = r;
  function Q(i, o, B) {
    const { gen: s, compositeRule: a, data: g, opts: n } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${g}${(0, A.getProperty)(o)}`;
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
  function i(t, C) {
    const { gen: c, data: d, it: M } = t;
    c.if(n(c, d, C, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${C}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function o({ gen: t, data: C, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((K) => (0, A.and)(n(t, C, K, c.ownProperties), (0, A._)`${M} = ${K}`)));
  }
  code.checkMissingProp = o;
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
  function g(t, C, c, d) {
    const M = (0, A._)`${C}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, C, c)}` : M;
  }
  code.propertyInData = g;
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
  function f({ schemaCode: t, data: C, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: K }, it: p }, O, q, z) {
    const S = z ? (0, A._)`${t}, ${C}, ${d}${M}` : C, L = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, K)],
      [r.default.parentData, p.parentData],
      [r.default.parentDataProperty, p.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    p.opts.dynamicRef && L.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...L)}`;
    return q !== A.nil ? (0, A._)`${O}.call(${q}, ${Y})` : (0, A._)`${O}(${Y})`;
  }
  code.callValidateCode = f;
  const h = (0, A._)`new RegExp`;
  function D({ gen: t, it: { opts: C } }, c) {
    const d = C.unicodeRegExp ? "u" : "", { regExp: M } = C.code, K = M(c, d);
    return t.scopeValue("pattern", {
      key: K.toString(),
      ref: K,
      code: (0, A._)`${M.code === "new RegExp" ? h : (0, Q.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = D;
  function w(t) {
    const { gen: C, data: c, keyword: d, it: M } = t, K = C.name("valid");
    if (M.allErrors) {
      const O = C.let("valid", !0);
      return p(() => C.assign(O, !1)), O;
    }
    return C.var(K, !0), p(() => C.break()), K;
    function p(O) {
      const q = C.const("len", (0, A._)`${c}.length`);
      C.forRange("i", 0, q, (z) => {
        t.subschema({
          keyword: d,
          dataProp: z,
          dataPropType: e.Type.Num
        }, K), C.if((0, A.not)(K), O);
      });
    }
  }
  code.validateArray = w;
  function I(t) {
    const { gen: C, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((q) => (0, e.alwaysValidSchema)(M, q)) && !M.opts.unevaluated)
      return;
    const p = C.let("valid", !1), O = C.name("_valid");
    C.block(() => c.forEach((q, z) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: z,
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
  const A = requireCodegen(), e = requireNames(), r = requireCode(), Q = requireErrors();
  function i(l, f) {
    const { gen: h, keyword: D, schema: w, parentSchema: I, it: t } = l, C = f.macro.call(t.self, w, I, t), c = g(h, D, C);
    t.opts.validateSchema !== !1 && t.self.validateSchema(C, !0);
    const d = h.name("valid");
    l.subschema({
      schema: C,
      schemaPath: A.nil,
      errSchemaPath: `${t.errSchemaPath}/${D}`,
      topSchemaRef: c,
      compositeRule: !0
    }, d), l.pass(d, () => l.error(!0));
  }
  keyword.macroKeywordCode = i;
  function o(l, f) {
    var h;
    const { gen: D, keyword: w, schema: I, parentSchema: t, $data: C, it: c } = l;
    a(c, f);
    const d = !C && f.compile ? f.compile.call(c.self, I, t, c) : f.validate, M = g(D, w, d), K = D.let("valid");
    l.block$data(K, p), l.ok((h = f.valid) !== null && h !== void 0 ? h : K);
    function p() {
      if (f.errors === !1)
        z(), f.modifying && B(l), S(() => l.error());
      else {
        const L = f.async ? O() : q();
        f.modifying && B(l), S(() => s(l, L));
      }
    }
    function O() {
      const L = D.let("ruleErrs", null);
      return D.try(() => z((0, A._)`await `), (Y) => D.assign(K, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => D.assign(L, (0, A._)`${Y}.errors`), () => D.throw(Y))), L;
    }
    function q() {
      const L = (0, A._)`${M}.errors`;
      return D.assign(L, null), z(A.nil), L;
    }
    function z(L = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, x = !("compile" in f && !C || f.schema === !1);
      D.assign(K, (0, A._)`${L}${(0, r.callValidateCode)(l, M, Y, x)}`, f.modifying);
    }
    function S(L) {
      var Y;
      D.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : K), L);
    }
  }
  keyword.funcKeywordCode = o;
  function B(l) {
    const { gen: f, data: h, it: D } = l;
    f.if(D.parentData, () => f.assign(h, (0, A._)`${D.parentData}[${D.parentDataProperty}]`));
  }
  function s(l, f) {
    const { gen: h } = l;
    h.if((0, A._)`Array.isArray(${f})`, () => {
      h.assign(e.default.vErrors, (0, A._)`${e.default.vErrors} === null ? ${f} : ${e.default.vErrors}.concat(${f})`).assign(e.default.errors, (0, A._)`${e.default.vErrors}.length`), (0, Q.extendErrors)(l);
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
    return !f.length || f.some((D) => D === "array" ? Array.isArray(l) : D === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == D || h && typeof l > "u");
  }
  keyword.validSchemaType = n;
  function E({ schema: l, opts: f, self: h, errSchemaPath: D }, w, I) {
    if (Array.isArray(w.keyword) ? !w.keyword.includes(I) : w.keyword !== I)
      throw new Error("ajv implementation error");
    const t = w.dependencies;
    if (t?.some((C) => !Object.prototype.hasOwnProperty.call(l, C)))
      throw new Error(`parent schema must have dependencies of ${I}: ${t.join(",")}`);
    if (w.validateSchema && !w.validateSchema(l[I])) {
      const c = `keyword "${I}" value is invalid at path "${D}": ` + h.errorsText(w.validateSchema.errors);
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
  function r(o, { keyword: B, schemaProp: s, schema: a, schemaPath: g, errSchemaPath: n, topSchemaRef: E }) {
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
  function Q(o, B, { dataProp: s, dataPropType: a, data: g, dataTypes: n, propertyName: E }) {
    if (g !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: h, dataPathArr: D, opts: w } = B, I = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(I), o.errorPath = (0, A.str)`${h}${(0, e.getErrorPath)(s, a, w.jsPropertySyntax)}`, o.parentDataProperty = (0, A._)`${s}`, o.dataPathArr = [...D, o.parentDataProperty];
    }
    if (g !== void 0) {
      const h = g instanceof A.Name ? g : l.let("data", g, !0);
      f(h), E !== void 0 && (o.propertyName = E);
    }
    n && (o.dataTypes = n);
    function f(h) {
      o.data = h, o.dataLevel = B.dataLevel + 1, o.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), o.parentData = B.data, o.dataNames = [...B.dataNames, h];
    }
  }
  subschema.extendSubschemaData = Q;
  function i(o, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: g, allErrors: n }) {
    a !== void 0 && (o.compositeRule = a), g !== void 0 && (o.createErrors = g), n !== void 0 && (o.allErrors = n), o.jtdDiscriminator = B, o.jtdMetadata = s;
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
  function e(Q, i, o, B, s, a, g, n, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, a, g, n, E, l);
      for (var f in B) {
        var h = B[f];
        if (Array.isArray(h)) {
          if (f in A.arrayKeywords)
            for (var D = 0; D < h.length; D++)
              e(Q, i, o, h[D], s + "/" + f + "/" + D, a, s, f, B, D);
        } else if (f in A.propsKeywords) {
          if (h && typeof h == "object")
            for (var w in h)
              e(Q, i, o, h[w], s + "/" + f + "/" + r(w), a, s, f, B, w);
        } else (f in A.keywords || Q.allKeys && !(f in A.skipKeywords)) && e(Q, i, o, h, s + "/" + f, a, s, f, B);
      }
      o(B, s, a, g, n, E, l);
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
  function i(D, w = !0) {
    return typeof D == "boolean" ? !0 : w === !0 ? !B(D) : w ? s(D) <= w : !1;
  }
  resolve.inlineRef = i;
  const o = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function B(D) {
    for (const w in D) {
      if (o.has(w))
        return !0;
      const I = D[w];
      if (Array.isArray(I) && I.some(B) || typeof I == "object" && B(I))
        return !0;
    }
    return !1;
  }
  function s(D) {
    let w = 0;
    for (const I in D) {
      if (I === "$ref")
        return 1 / 0;
      if (w++, !Q.has(I) && (typeof D[I] == "object" && (0, A.eachItem)(D[I], (t) => w += s(t)), w === 1 / 0))
        return 1 / 0;
    }
    return w;
  }
  function a(D, w = "", I) {
    I !== !1 && (w = E(w));
    const t = D.parse(w);
    return g(D, t);
  }
  resolve.getFullPath = a;
  function g(D, w) {
    return D.serialize(w).split("#")[0] + "#";
  }
  resolve._getFullPath = g;
  const n = /#\/?$/;
  function E(D) {
    return D ? D.replace(n, "") : "";
  }
  resolve.normalizeId = E;
  function l(D, w, I) {
    return I = E(I), D.resolve(w, I);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function h(D, w) {
    if (typeof D == "boolean")
      return {};
    const { schemaId: I, uriResolver: t } = this.opts, C = E(D[I] || w), c = { "": C }, d = a(t, C, !1), M = {}, K = /* @__PURE__ */ new Set();
    return r(D, { allKeys: !0 }, (q, z, S, L) => {
      if (L === void 0)
        return;
      const Y = d + z;
      let x = c[L];
      typeof q[I] == "string" && (x = rA.call(this, q[I])), QA.call(this, q.$anchor), QA.call(this, q.$dynamicAnchor), c[z] = x;
      function rA(T) {
        const oA = this.opts.uriResolver.resolve;
        if (T = E(x ? oA(x, T) : T), K.has(T))
          throw O(T);
        K.add(T);
        let v = this.refs[T];
        return typeof v == "string" && (v = this.refs[v]), typeof v == "object" ? p(q, v.schema, T) : T !== E(Y) && (T[0] === "#" ? (p(q, M[T], T), M[T] = q) : this.refs[T] = Y), T;
      }
      function QA(T) {
        if (typeof T == "string") {
          if (!f.test(T))
            throw new Error(`invalid anchor "${T}"`);
          rA.call(this, `#${T}`);
        }
      }
    }), M;
    function p(q, z, S) {
      if (z !== void 0 && !e(q, z))
        throw O(S);
    }
    function O(q) {
      return new Error(`reference "${q}" resolves to more than one schema`);
    }
  }
  return resolve.getSchemaRefs = h, resolve;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1, Object.defineProperty(validate, "__esModule", { value: !0 }), validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), Q = requireDataType(), i = requireDefaults(), o = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), g = requireResolve(), n = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (K(k), c(k))) {
      w(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: G, schema: H, schemaEnv: j, opts: R }, Z) {
    R.code.es5 ? k.func(G, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, R)}`), D(k, R), k.code(Z);
    }) : k.func(G, (0, s._)`${a.default.data}, ${h(R)}`, j.$async, () => k.code(t(H, R)).code(Z));
  }
  function h(k) {
    return (0, s._)`{${a.default.instancePath}="", ${a.default.parentData}, ${a.default.parentDataProperty}, ${a.default.rootData}=${a.default.data}${k.dynamicRef ? (0, s._)`, ${a.default.dynamicAnchors}={}` : s.nil}}={}`;
  }
  function D(k, G) {
    k.if(a.default.valCxt, () => {
      k.var(a.default.instancePath, (0, s._)`${a.default.valCxt}.${a.default.instancePath}`), k.var(a.default.parentData, (0, s._)`${a.default.valCxt}.${a.default.parentData}`), k.var(a.default.parentDataProperty, (0, s._)`${a.default.valCxt}.${a.default.parentDataProperty}`), k.var(a.default.rootData, (0, s._)`${a.default.valCxt}.${a.default.rootData}`), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`${a.default.valCxt}.${a.default.dynamicAnchors}`);
    }, () => {
      k.var(a.default.instancePath, (0, s._)`""`), k.var(a.default.parentData, (0, s._)`undefined`), k.var(a.default.parentDataProperty, (0, s._)`undefined`), k.var(a.default.rootData, a.default.data), G.dynamicRef && k.var(a.default.dynamicAnchors, (0, s._)`{}`);
    });
  }
  function w(k) {
    const { schema: G, opts: H, gen: j } = k;
    f(k, () => {
      H.$comment && G.$comment && L(k), q(k), j.let(a.default.vErrors, null), j.let(a.default.errors, 0), H.unevaluated && I(k), p(k), Y(k);
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
    if (d(k) && (K(k), c(k))) {
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
    const { schema: H, gen: j, opts: R } = k;
    R.$comment && H.$comment && L(k), z(k), S(k);
    const Z = j.const("_errs", a.default.errors);
    p(k, Z), j.var(G, (0, s._)`${Z} === ${a.default.errors}`);
  }
  function K(k) {
    (0, n.checkUnknownRules)(k), O(k);
  }
  function p(k, G) {
    if (k.opts.jtd)
      return rA(k, [], !1, G);
    const H = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !j, G);
  }
  function O(k) {
    const { schema: G, errSchemaPath: H, opts: j, self: R } = k;
    G.$ref && j.ignoreKeywordsWithRef && (0, n.schemaHasRulesButRef)(G, R.RULES) && R.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function q(k) {
    const { schema: G, opts: H } = k;
    G.default !== void 0 && H.useDefaults && H.strictSchema && (0, n.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function z(k) {
    const G = k.schema[k.opts.schemaId];
    G && (k.baseId = (0, g.resolveUrl)(k.opts.uriResolver, k.baseId, G));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function L({ gen: k, schemaEnv: G, schema: H, errSchemaPath: j, opts: R }) {
    const Z = H.$comment;
    if (R.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${Z})`);
    else if (typeof R.$comment == "function") {
      const V = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: G.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${Z}, ${V}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: G, schemaEnv: H, validateName: j, ValidationError: R, opts: Z } = k;
    H.$async ? G.if((0, s._)`${a.default.errors} === 0`, () => G.return(a.default.data), () => G.throw((0, s._)`new ${R}(${a.default.vErrors})`)) : (G.assign((0, s._)`${j}.errors`, a.default.vErrors), Z.unevaluated && x(k), G.return((0, s._)`${a.default.errors} === 0`));
  }
  function x({ gen: k, evaluated: G, props: H, items: j }) {
    H instanceof s.Name && k.assign((0, s._)`${G}.props`, H), j instanceof s.Name && k.assign((0, s._)`${G}.items`, j);
  }
  function rA(k, G, H, j) {
    const { gen: R, schema: Z, data: V, allErrors: eA, opts: X, self: $ } = k, { RULES: W } = $;
    if (Z.$ref && (X.ignoreKeywordsWithRef || !(0, n.schemaHasRulesButRef)(Z, W))) {
      R.block(() => b(k, "$ref", W.all.$ref.definition));
      return;
    }
    X.jtd || T(k, G), R.block(() => {
      for (const AA of W.rules)
        iA(AA);
      iA(W.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(Z, AA) && (AA.type ? (R.if((0, Q.checkDataType)(AA.type, V, X.strictNumbers)), QA(k, AA), G.length === 1 && G[0] === AA.type && H && (R.else(), (0, Q.reportTypeError)(k)), R.endIf()) : QA(k, AA), eA || R.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function QA(k, G) {
    const { gen: H, schema: j, opts: { useDefaults: R } } = k;
    R && (0, i.assignDefaults)(k, G.type), H.block(() => {
      for (const Z of G.rules)
        (0, r.shouldUseRule)(j, Z) && b(k, Z.keyword, Z.definition, G.type);
    });
  }
  function T(k, G) {
    k.schemaEnv.meta || !k.opts.strictTypes || (oA(k, G), k.opts.allowUnionTypes || v(k, G), P(k, k.dataTypes));
  }
  function oA(k, G) {
    if (G.length) {
      if (!k.dataTypes.length) {
        k.dataTypes = G;
        return;
      }
      G.forEach((H) => {
        N(k.dataTypes, H) || m(k, `type "${H}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, G);
    }
  }
  function v(k, G) {
    G.length > 1 && !(G.length === 2 && G.includes("null")) && m(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, G) {
    const H = k.self.RULES.all;
    for (const j in H) {
      const R = H[j];
      if (typeof R == "object" && (0, r.shouldUseRule)(k.schema, R)) {
        const { type: Z } = R.definition;
        Z.length && !Z.some((V) => _(G, V)) && m(k, `missing type "${Z.join(",")}" for keyword "${j}"`);
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
    for (const j of k.dataTypes)
      N(G, j) ? H.push(j) : G.includes("integer") && j === "number" && H.push("integer");
    k.dataTypes = H;
  }
  function m(k, G) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    G += ` at "${H}" (strictTypes)`, (0, n.checkStrictMode)(k, G, k.opts.strictTypes);
  }
  class y {
    constructor(G, H, j) {
      if ((0, o.validateKeywordUsage)(G, H, j), this.gen = G.gen, this.allErrors = G.allErrors, this.keyword = j, this.data = G.data, this.schema = G.schema[j], this.$data = H.$data && G.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, n.schemaRefOrVal)(G, this.schema, j, this.$data), this.schemaType = H.schemaType, this.parentSchema = G.schema, this.params = {}, this.it = G, this.def = H, this.$data)
        this.schemaCode = G.gen.const("vSchema", U(this.$data, G));
      else if (this.schemaCode = this.schemaValue, !(0, o.validSchemaType)(this.schema, H.schemaType, H.allowUndefined))
        throw new Error(`${j} value must be ${JSON.stringify(H.schemaType)}`);
      ("code" in H ? H.trackErrors : H.errors !== !1) && (this.errsCount = G.gen.const("_errs", a.default.errors));
    }
    result(G, H, j) {
      this.failResult((0, s.not)(G), H, j);
    }
    failResult(G, H, j) {
      this.gen.if(G), j ? j() : this.error(), H ? (this.gen.else(), H(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
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
    error(G, H, j) {
      if (H) {
        this.setParams(H), this._error(G, j), this.setParams({});
        return;
      }
      this._error(G, j);
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
    block$data(G, H, j = s.nil) {
      this.gen.block(() => {
        this.check$data(G, j), H();
      });
    }
    check$data(G = s.nil, H = s.nil) {
      if (!this.$data)
        return;
      const { gen: j, schemaCode: R, schemaType: Z, def: V } = this;
      j.if((0, s.or)((0, s._)`${R} === undefined`, H)), G !== s.nil && j.assign(G, !0), (Z.length || V.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), G !== s.nil && j.assign(G, !1)), j.else();
    }
    invalid$data() {
      const { gen: G, schemaCode: H, schemaType: j, def: R, it: Z } = this;
      return (0, s.or)(V(), eA());
      function V() {
        if (j.length) {
          if (!(H instanceof s.Name))
            throw new Error("ajv implementation error");
          const X = Array.isArray(j) ? j : [j];
          return (0, s._)`${(0, Q.checkDataTypes)(X, H, Z.opts.strictNumbers, Q.DataType.Wrong)}`;
        }
        return s.nil;
      }
      function eA() {
        if (R.validateSchema) {
          const X = G.scopeValue("validate$data", { ref: R.validateSchema });
          return (0, s._)`!${X}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(G, H) {
      const j = (0, B.getSubschema)(this.it, G);
      (0, B.extendSubschemaData)(j, this.it, G), (0, B.extendSubschemaMode)(j, G);
      const R = { ...this.it, ...j, items: void 0, props: void 0 };
      return C(R, H), R;
    }
    mergeEvaluated(G, H) {
      const { it: j, gen: R } = this;
      j.opts.unevaluated && (j.props !== !0 && G.props !== void 0 && (j.props = n.mergeEvaluated.props(R, G.props, j.props, H)), j.items !== !0 && G.items !== void 0 && (j.items = n.mergeEvaluated.items(R, G.items, j.items, H)));
    }
    mergeValidEvaluated(G, H) {
      const { it: j, gen: R } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return R.if(H, () => this.mergeEvaluated(G, s.Name)), !0;
    }
  }
  validate.KeywordCxt = y;
  function b(k, G, H, j) {
    const R = new y(k, H, G);
    "code" in H ? H.code(R, j) : R.$data && H.validate ? (0, o.funcKeywordCode)(R, H) : "macro" in H ? (0, o.macroKeywordCode)(R, H) : (H.compile || H.validate) && (0, o.funcKeywordCode)(R, H);
  }
  const F = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function U(k, { dataLevel: G, dataNames: H, dataPathArr: j }) {
    let R, Z;
    if (k === "")
      return a.default.rootData;
    if (k[0] === "/") {
      if (!F.test(k))
        throw new Error(`Invalid JSON-pointer: ${k}`);
      R = k, Z = a.default.rootData;
    } else {
      const $ = J.exec(k);
      if (!$)
        throw new Error(`Invalid JSON-pointer: ${k}`);
      const W = +$[1];
      if (R = $[2], R === "#") {
        if (W >= G)
          throw new Error(X("property/index", W));
        return j[G - W];
      }
      if (W > G)
        throw new Error(X("data", W));
      if (Z = H[G - W], !R)
        return Z;
    }
    let V = Z;
    const eA = R.split("/");
    for (const $ of eA)
      $ && (Z = (0, s._)`${Z}${(0, s.getProperty)((0, n.unescapeJsonPointer)($))}`, V = (0, s._)`${V} && ${Z}`);
    return V;
    function X($, W) {
      return `Cannot access ${$} ${W} levels up, current level is ${G}`;
    }
  }
  return validate.getData = U, validate;
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
    constructor(I) {
      var t;
      this.refs = {}, this.dynamicAnchors = {};
      let C;
      typeof I.schema == "object" && (C = I.schema), this.schema = I.schema, this.schemaId = I.schemaId, this.root = I.root || this, this.baseId = (t = I.baseId) !== null && t !== void 0 ? t : (0, Q.normalizeId)(C?.[I.schemaId || "$id"]), this.schemaPath = I.schemaPath, this.localRefs = I.localRefs, this.meta = I.meta, this.$async = C?.$async, this.refs = {};
    }
  }
  compile.SchemaEnv = B;
  function s(w) {
    const I = n.call(this, w);
    if (I)
      return I;
    const t = (0, Q.getFullPath)(this.opts.uriResolver, w.root.baseId), { es5: C, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: C, lines: c, ownProperties: d });
    let K;
    w.$async && (K = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const p = M.scopeName("validate");
    w.validateName = p;
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
      validateName: p,
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
      this._compilations.add(w), (0, o.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const z = M.toString();
      q = `${M.scopeRefs(r.default.scope)}return ${z}`, this.opts.code.process && (q = this.opts.code.process(q, w));
      const L = new Function(`${r.default.self}`, `${r.default.scope}`, q)(this, this.scope.get());
      if (this.scope.value(p, { ref: L }), L.errors = null, L.schema = w.schema, L.schemaEnv = w, w.$async && (L.$async = !0), this.opts.code.source === !0 && (L.source = { validateName: p, validateCode: z, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: x } = O;
        L.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: x instanceof A.Name ? void 0 : x,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: x instanceof A.Name
        }, L.source && (L.source.evaluated = (0, A.stringify)(L.evaluated));
      }
      return w.validate = L, w;
    } catch (z) {
      throw delete w.validate, delete w.validateName, q && this.logger.error("Error compiling schema, function code:", q), z;
    } finally {
      this._compilations.delete(w);
    }
  }
  compile.compileSchema = s;
  function a(w, I, t) {
    var C;
    t = (0, Q.resolveUrl)(this.opts.uriResolver, I, t);
    const c = w.refs[t];
    if (c)
      return c;
    let d = l.call(this, w, t);
    if (d === void 0) {
      const M = (C = w.localRefs) === null || C === void 0 ? void 0 : C[t], { schemaId: K } = this.opts;
      M && (d = new B({ schema: M, schemaId: K, root: w, baseId: I }));
    }
    if (d !== void 0)
      return w.refs[t] = g.call(this, d);
  }
  compile.resolveRef = a;
  function g(w) {
    return (0, Q.inlineRef)(w.schema, this.opts.inlineRefs) ? w.schema : w.validate ? w : s.call(this, w);
  }
  function n(w) {
    for (const I of this._compilations)
      if (E(I, w))
        return I;
  }
  compile.getCompilingSchema = n;
  function E(w, I) {
    return w.schema === I.schema && w.root === I.root && w.baseId === I.baseId;
  }
  function l(w, I) {
    let t;
    for (; typeof (t = this.refs[I]) == "string"; )
      I = t;
    return t || this.schemas[I] || f.call(this, w, I);
  }
  function f(w, I) {
    const t = this.opts.uriResolver.parse(I), C = (0, Q._getFullPath)(this.opts.uriResolver, t);
    let c = (0, Q.getFullPath)(this.opts.uriResolver, w.baseId, void 0);
    if (Object.keys(w.schema).length > 0 && C === c)
      return D.call(this, t, w);
    const d = (0, Q.normalizeId)(C), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const K = f.call(this, w, M);
      return typeof K?.schema != "object" ? void 0 : D.call(this, t, K);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, Q.normalizeId)(I)) {
        const { schema: K } = M, { schemaId: p } = this.opts, O = K[p];
        return O && (c = (0, Q.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: K, schemaId: p, root: w, baseId: c });
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
  function D(w, { baseId: I, schema: t, root: C }) {
    var c;
    if (((c = w.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const K of w.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const p = t[(0, i.unescapeFragment)(K)];
      if (p === void 0)
        return;
      t = p;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !h.has(K) && O && (I = (0, Q.resolveUrl)(this.opts.uriResolver, I, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const K = (0, Q.resolveUrl)(this.opts.uriResolver, I, t.$ref);
      d = f.call(this, C, K);
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
    const w = D.match(e) || [], [I] = w;
    return I ? { host: B(I, "."), isIPV4: !0 } : { host: D, isIPV4: !1 };
  }
  function Q(D, w = !1) {
    let I = "", t = !0;
    for (const C of D) {
      if (A[C] === void 0) return;
      C !== "0" && t === !0 && (t = !1), t || (I += C);
    }
    return w && I.length === 0 && (I = "0"), I;
  }
  function i(D) {
    let w = 0;
    const I = { error: !1, address: "", zone: "" }, t = [], C = [];
    let c = !1, d = !1, M = !1;
    function K() {
      if (C.length) {
        if (c === !1) {
          const p = Q(C);
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
          if (d === !0 && (M = !0), !K())
            break;
          if (w++, t.push(":"), w > 7) {
            I.error = !0;
            break;
          }
          p - 1 >= 0 && D[p - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!K())
            break;
          c = !0;
        } else {
          C.push(O);
          continue;
        }
    }
    return C.length && (c ? I.zone = C.join("") : M ? t.push(C.join("")) : t.push(Q(C))), I.address = t.join(""), I;
  }
  function o(D) {
    if (s(D, ":") < 2)
      return { host: D, isIPV6: !1 };
    const w = i(D);
    if (w.error)
      return { host: D, isIPV6: !1 };
    {
      let I = w.address, t = w.address;
      return w.zone && (I += "%" + w.zone, t += "%25" + w.zone), { host: I, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(D, w) {
    let I = "", t = !0;
    const C = D.length;
    for (let c = 0; c < C; c++) {
      const d = D[c];
      d === "0" && t ? (c + 1 <= C && D[c + 1] === w || c + 1 === C) && (I += d, t = !1) : (d === w ? t = !0 : t = !1, I += d);
    }
    return I;
  }
  function s(D, w) {
    let I = 0;
    for (let t = 0; t < D.length; t++)
      D[t] === w && I++;
    return I;
  }
  const a = /^\.\.?\//u, g = /^\/\.(?:\/|$)/u, n = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(D) {
    const w = [];
    for (; D.length; )
      if (D.match(a))
        D = D.replace(a, "");
      else if (D.match(g))
        D = D.replace(g, "/");
      else if (D.match(n))
        D = D.replace(n, "/"), w.pop();
      else if (D === "." || D === "..")
        D = "";
      else {
        const I = D.match(E);
        if (I) {
          const t = I[0];
          D = D.slice(t.length), w.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return w.join("");
  }
  function f(D, w) {
    const I = w !== !0 ? escape : unescape;
    return D.scheme !== void 0 && (D.scheme = I(D.scheme)), D.userinfo !== void 0 && (D.userinfo = I(D.userinfo)), D.host !== void 0 && (D.host = I(D.host)), D.path !== void 0 && (D.path = I(D.path)), D.query !== void 0 && (D.query = I(D.query)), D.fragment !== void 0 && (D.fragment = I(D.fragment)), D;
  }
  function h(D) {
    const w = [];
    if (D.userinfo !== void 0 && (w.push(D.userinfo), w.push("@")), D.host !== void 0) {
      let I = unescape(D.host);
      const t = r(I);
      if (t.isIPV4)
        I = t.host;
      else {
        const C = o(t.host);
        C.isIPV6 === !0 ? I = `[${C.escapedHost}]` : I = D.host;
      }
      w.push(I);
    }
    return (typeof D.port == "number" || typeof D.port == "string") && (w.push(":"), w.push(String(D.port))), w.length ? w.join("") : void 0;
  }
  return utils = {
    recomposeAuthority: h,
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
    const C = String(t.scheme).toLowerCase() === "https";
    return (t.port === (C ? 443 : 80) || t.port === "") && (t.port = void 0), t.path || (t.path = "/"), t;
  }
  function o(t) {
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
      const M = `${d}:${C.nid || t.nid}`, K = I[M];
      t.path = void 0, K && (t = K.parse(t, C));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, C) {
    const c = C.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${C.nid || d}`, K = I[M];
    K && (t = K.serialize(t, C));
    const p = t, O = t.nss;
    return p.path = `${d || C.nid}:${O}`, C.skipEscape = !0, p;
  }
  function g(t, C) {
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
  }, h = {
    scheme: "wss",
    domainHost: f.domainHost,
    parse: f.parse,
    serialize: f.serialize
  }, I = {
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
  return schemes = I, schemes;
}
var hasRequiredFastUri;
function requireFastUri() {
  if (hasRequiredFastUri) return fastUri.exports;
  hasRequiredFastUri = 1;
  const { normalizeIPv6: A, normalizeIPv4: e, removeDotSegments: r, recomposeAuthority: Q, normalizeComponentEncoding: i } = requireUtils(), o = requireSchemes();
  function B(w, I) {
    return typeof w == "string" ? w = n(h(w, I), I) : typeof w == "object" && (w = h(n(w, I), I)), w;
  }
  function s(w, I, t) {
    const C = Object.assign({ scheme: "null" }, t), c = a(h(w, C), h(I, C), C, !0);
    return n(c, { ...C, skipEscape: !0 });
  }
  function a(w, I, t, C) {
    const c = {};
    return C || (w = h(n(w, t), t), I = h(n(I, t), t)), t = t || {}, !t.tolerant && I.scheme ? (c.scheme = I.scheme, c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.userinfo !== void 0 || I.host !== void 0 || I.port !== void 0 ? (c.userinfo = I.userinfo, c.host = I.host, c.port = I.port, c.path = r(I.path || ""), c.query = I.query) : (I.path ? (I.path.charAt(0) === "/" ? c.path = r(I.path) : ((w.userinfo !== void 0 || w.host !== void 0 || w.port !== void 0) && !w.path ? c.path = "/" + I.path : w.path ? c.path = w.path.slice(0, w.path.lastIndexOf("/") + 1) + I.path : c.path = I.path, c.path = r(c.path)), c.query = I.query) : (c.path = w.path, I.query !== void 0 ? c.query = I.query : c.query = w.query), c.userinfo = w.userinfo, c.host = w.host, c.port = w.port), c.scheme = w.scheme), c.fragment = I.fragment, c;
  }
  function g(w, I, t) {
    return typeof w == "string" ? (w = unescape(w), w = n(i(h(w, t), !0), { ...t, skipEscape: !0 })) : typeof w == "object" && (w = n(i(w, !0), { ...t, skipEscape: !0 })), typeof I == "string" ? (I = unescape(I), I = n(i(h(I, t), !0), { ...t, skipEscape: !0 })) : typeof I == "object" && (I = n(i(I, !0), { ...t, skipEscape: !0 })), w.toLowerCase() === I.toLowerCase();
  }
  function n(w, I) {
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
    }, C = Object.assign({}, I), c = [], d = o[(C.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, C), t.path !== void 0 && (C.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), C.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = Q(t);
    if (M !== void 0 && (C.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let K = t.path;
      !C.absolutePath && (!d || !d.absolutePath) && (K = r(K)), M === void 0 && (K = K.replace(/^\/\//u, "/%2F")), c.push(K);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (w, I) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(I)));
  function l(w) {
    let I = 0;
    for (let t = 0, C = w.length; t < C; ++t)
      if (I = w.charCodeAt(t), I > 126 || E[I])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function h(w, I) {
    const t = Object.assign({}, I), C = {
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
      if (C.scheme = M[1], C.userinfo = M[3], C.host = M[4], C.port = parseInt(M[5], 10), C.path = M[6] || "", C.query = M[7], C.fragment = M[8], isNaN(C.port) && (C.port = M[5]), C.host) {
        const p = e(C.host);
        if (p.isIPV4 === !1) {
          const O = A(p.host);
          C.host = O.host.toLowerCase(), d = O.isIPV6;
        } else
          C.host = p.host, d = !0;
      }
      C.scheme === void 0 && C.userinfo === void 0 && C.host === void 0 && C.port === void 0 && !C.path && C.query === void 0 ? C.reference = "same-document" : C.scheme === void 0 ? C.reference = "relative" : C.fragment === void 0 ? C.reference = "absolute" : C.reference = "uri", t.reference && t.reference !== "suffix" && t.reference !== C.reference && (C.error = C.error || "URI is not a " + t.reference + " reference.");
      const K = o[(t.scheme || C.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!K || !K.unicodeSupport) && C.host && (t.domainHost || K && K.domainHost) && d === !1 && l(C.host))
        try {
          C.host = URL.domainToASCII(C.host.toLowerCase());
        } catch (p) {
          C.error = C.error || "Host's domain name can not be converted to ASCII: " + p;
        }
      (!K || K && !K.skipNormalize) && (c && C.scheme !== void 0 && (C.scheme = unescape(C.scheme)), c && C.host !== void 0 && (C.host = unescape(C.host)), C.path && C.path.length && (C.path = escape(unescape(C.path))), C.fragment && C.fragment.length && (C.fragment = encodeURI(decodeURIComponent(C.fragment)))), K && K.parse && K.parse(C, t);
    } else
      C.error = C.error || "URI can not be parsed.";
    return C;
  }
  const D = {
    SCHEMES: o,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: g,
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
    const Q = requireValidation_error(), i = requireRef_error(), o = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), g = requireDataType(), n = requireUtil(), E = require$$9, l = requireUri(), f = (v, P) => new RegExp(v, P);
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
    }, I = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, t = 200;
    function C(v) {
      var P, _, N, u, m, y, b, F, J, U, k, G, H, j, R, Z, V, eA, X, $, W, iA, AA, tA, sA;
      const BA = v.strict, aA = (P = v.code) === null || P === void 0 ? void 0 : P.optimize, gA = aA === !0 || aA === void 0 ? 1 : aA || 0, wA = (N = (_ = v.code) === null || _ === void 0 ? void 0 : _.regExp) !== null && N !== void 0 ? N : f, CA = (u = v.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (y = (m = v.strictSchema) !== null && m !== void 0 ? m : BA) !== null && y !== void 0 ? y : !0,
        strictNumbers: (F = (b = v.strictNumbers) !== null && b !== void 0 ? b : BA) !== null && F !== void 0 ? F : !0,
        strictTypes: (U = (J = v.strictTypes) !== null && J !== void 0 ? J : BA) !== null && U !== void 0 ? U : "log",
        strictTuples: (G = (k = v.strictTuples) !== null && k !== void 0 ? k : BA) !== null && G !== void 0 ? G : "log",
        strictRequired: (j = (H = v.strictRequired) !== null && H !== void 0 ? H : BA) !== null && j !== void 0 ? j : !1,
        code: v.code ? { ...v.code, optimize: gA, regExp: wA } : { optimize: gA, regExp: wA },
        loopRequired: (R = v.loopRequired) !== null && R !== void 0 ? R : t,
        loopEnum: (Z = v.loopEnum) !== null && Z !== void 0 ? Z : t,
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
      constructor(P = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), P = this.opts = { ...P, ...C(P) };
        const { es5: _, lines: N } = this.opts.code;
        this.scope = new s.ValueScope({ scope: {}, prefixes: D, es5: _, lines: N }), this.logger = S(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, o.getRules)(), d.call(this, w, P, "NOT SUPPORTED"), d.call(this, I, P, "DEPRECATED", "warn"), this._metaOpts = q.call(this), P.formats && p.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && O.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), K.call(this), P.validateFormats = u;
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
        async function u(U, k) {
          await m.call(this, U.$schema);
          const G = this._addSchema(U, k);
          return G.validate || y.call(this, G);
        }
        async function m(U) {
          U && !this.getSchema(U) && await u.call(this, { $ref: U }, !0);
        }
        async function y(U) {
          try {
            return this._compileSchemaEnv(U);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return b.call(this, k), await F.call(this, k.missingSchema), y.call(this, U);
          }
        }
        function b({ missingSchema: U, missingRef: k }) {
          if (this.refs[U])
            throw new Error(`AnySchema ${U} is loaded but ${k} cannot be resolved`);
        }
        async function F(U) {
          const k = await J.call(this, U);
          this.refs[U] || await m.call(this, k.$schema), this.refs[U] || this.addSchema(k, U, _);
        }
        async function J(U) {
          const k = this._loading[U];
          if (k)
            return k;
          try {
            return await (this._loading[U] = N(U));
          } finally {
            delete this._loading[U];
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
        let m;
        if (typeof P == "object") {
          const { schemaId: y } = this.opts;
          if (m = P[y], m !== void 0 && typeof m != "string")
            throw new Error(`schema ${y} must be string`);
        }
        return _ = (0, a.normalizeId)(_ || m), this._checkUnique(_), this.schemas[_] = this._addSchema(P, N, _, u, !0), this;
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
          const m = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(m);
          else
            throw new Error(m);
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
          return (0, n.eachItem)(N, (m) => x.call(this, m)), this;
        QA.call(this, _);
        const u = {
          ..._,
          type: (0, g.getJSONTypes)(_.type),
          schemaType: (0, g.getJSONTypes)(_.schemaType)
        };
        return (0, n.eachItem)(N, u.type.length === 0 ? (m) => x.call(this, m, u) : (m) => u.type.forEach((y) => x.call(this, m, u, y))), this;
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
          const u = N.rules.findIndex((m) => m.keyword === P);
          u >= 0 && N.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, _) {
        return typeof _ == "string" && (_ = new RegExp(_)), this.formats[P] = _, this;
      }
      errorsText(P = this.errors, { separator: _ = ", ", dataVar: N = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${N}${u.instancePath} ${u.message}`).reduce((u, m) => u + _ + m);
      }
      $dataMetaSchema(P, _) {
        const N = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of _) {
          const m = u.split("/").slice(1);
          let y = P;
          for (const b of m)
            y = y[b];
          for (const b in N) {
            const F = N[b];
            if (typeof F != "object")
              continue;
            const { $data: J } = F.definition, U = y[b];
            J && U && (y[b] = oA(U));
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
      _addSchema(P, _, N, u = this.opts.validateSchema, m = this.opts.addUsedSchema) {
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
        let F = this._cache.get(P);
        if (F !== void 0)
          return F;
        N = (0, a.normalizeId)(y || N);
        const J = a.getSchemaRefs.call(this, P, N);
        return F = new B.SchemaEnv({ schema: P, schemaId: b, meta: _, baseId: N, localRefs: J }), this._cache.set(F.schema, F), m && !N.startsWith("#") && (N && this._checkUnique(N), this.refs[N] = F), u && this.validateSchema(P, !0), F;
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
    c.ValidationError = Q.default, c.MissingRefError = i.default, A.default = c;
    function d(v, P, _, N = "error") {
      for (const u in v) {
        const m = u;
        m in P && this.logger[N](`${_}: option ${u}. ${v[m]}`);
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
    function q() {
      const v = { ...this.opts };
      for (const P of h)
        delete v[P];
      return v;
    }
    const z = { log() {
    }, warn() {
    }, error() {
    } };
    function S(v) {
      if (v === !1)
        return z;
      if (v === void 0)
        return console;
      if (v.log && v.warn && v.error)
        return v;
      throw new Error("logger must implement log, warn and error methods");
    }
    const L = /^[a-z_$][a-z0-9_$:-]*$/i;
    function Y(v, P) {
      const { RULES: _ } = this;
      if ((0, n.eachItem)(v, (N) => {
        if (_.keywords[N])
          throw new Error(`Keyword ${N} is already defined`);
        if (!L.test(N))
          throw new Error(`Keyword ${N} has invalid name`);
      }), !!P && P.$data && !("code" in P || "validate" in P))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function x(v, P, _) {
      var N;
      const u = P?.post;
      if (_ && u)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: m } = this;
      let y = u ? m.post : m.rules.find(({ type: F }) => F === _);
      if (y || (y = { type: _, rules: [] }, m.rules.push(y)), m.keywords[v] = !0, !P)
        return;
      const b = {
        keyword: v,
        definition: {
          ...P,
          type: (0, g.getJSONTypes)(P.type),
          schemaType: (0, g.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, y, b, P.before) : y.rules.push(b), m.all[v] = b, (N = P.implements) === null || N === void 0 || N.forEach((F) => this.addKeyword(F));
    }
    function rA(v, P, _) {
      const N = v.rules.findIndex((u) => u.keyword === _);
      N >= 0 ? v.rules.splice(N, 0, P) : (v.rules.push(P), this.logger.warn(`rule ${_} is not defined`));
    }
    function QA(v) {
      let { metaSchema: P } = v;
      P !== void 0 && (v.$data && this.opts.$data && (P = oA(P)), v.validateSchema = this.compile(P, !0));
    }
    const T = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function oA(v) {
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
  const A = requireRef_error(), e = requireCode(), r = requireCodegen(), Q = requireNames(), i = requireCompile(), o = requireUtil(), B = {
    keyword: "$ref",
    schemaType: "string",
    code(g) {
      const { gen: n, schema: E, it: l } = g, { baseId: f, schemaEnv: h, validateName: D, opts: w, self: I } = l, { root: t } = h;
      if ((E === "#" || E === "#/") && f === t.baseId)
        return c();
      const C = i.resolveRef.call(I, t, f, E);
      if (C === void 0)
        throw new A.default(l.opts.uriResolver, f, E);
      if (C instanceof i.SchemaEnv)
        return d(C);
      return M(C);
      function c() {
        if (h === t)
          return a(g, D, h, h.$async);
        const K = n.scopeValue("root", { ref: t });
        return a(g, (0, r._)`${K}.validate`, t, t.$async);
      }
      function d(K) {
        const p = s(g, K);
        a(g, p, K, K.$async);
      }
      function M(K) {
        const p = n.scopeValue("schema", w.code.source === !0 ? { ref: K, code: (0, r.stringify)(K) } : { ref: K }), O = n.name("valid"), q = g.subschema({
          schema: K,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: p,
          errSchemaPath: E
        }, O);
        g.mergeEvaluated(q), g.ok(O);
      }
    }
  };
  function s(g, n) {
    const { gen: E } = g;
    return n.validate ? E.scopeValue("validate", { ref: n.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: n })}.validate`;
  }
  ref.getValidate = s;
  function a(g, n, E, l) {
    const { gen: f, it: h } = g, { allErrors: D, schemaEnv: w, opts: I } = h, t = I.passContext ? Q.default.this : r.nil;
    l ? C() : c();
    function C() {
      if (!w.$async)
        throw new Error("async schema referenced by sync schema");
      const K = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(g, n, t)}`), M(n), D || f.assign(K, !0);
      }, (p) => {
        f.if((0, r._)`!(${p} instanceof ${h.ValidationError})`, () => f.throw(p)), d(p), D || f.assign(K, !1);
      }), g.ok(K);
    }
    function c() {
      g.result((0, e.callValidateCode)(g, n, t), () => M(n), () => d(n));
    }
    function d(K) {
      const p = (0, r._)`${K}.errors`;
      f.assign(Q.default.vErrors, (0, r._)`${Q.default.vErrors} === null ? ${p} : ${Q.default.vErrors}.concat(${p})`), f.assign(Q.default.errors, (0, r._)`${Q.default.vErrors}.length`);
    }
    function M(K) {
      var p;
      if (!h.opts.unevaluated)
        return;
      const O = (p = E?.validate) === null || p === void 0 ? void 0 : p.evaluated;
      if (h.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (h.props = o.mergeEvaluated.props(f, O.props, h.props));
        else {
          const q = f.var("props", (0, r._)`${K}.evaluated.props`);
          h.props = o.mergeEvaluated.props(f, q, h.props, r.Name);
        }
      if (h.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (h.items = o.mergeEvaluated.items(f, O.items, h.items));
        else {
          const q = f.var("items", (0, r._)`${K}.evaluated.items`);
          h.items = o.mergeEvaluated.items(f, q, h.items, r.Name);
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
      const { gen: i, data: o, schemaCode: B, it: s } = Q, a = s.opts.multipleOfPrecision, g = i.let("res"), n = a ? (0, A._)`Math.abs(Math.round(${g}) - ${g}) > 1e-${a}` : (0, A._)`${g} !== parseInt(${g})`;
      Q.fail$data((0, A._)`(${B} === 0 || (${g} = ${o}/${B}, ${n}))`);
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
      const { keyword: B, data: s, schemaCode: a, it: g } = o, n = B === "maxLength" ? A.operators.GT : A.operators.LT, E = g.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(o.gen, r.default)}(${s})`;
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
      const { data: o, $data: B, schema: s, schemaCode: a, it: g } = i, n = g.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${n}))` : (0, A.usePattern)(i, s);
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
      const { gen: B, schema: s, schemaCode: a, data: g, $data: n, it: E } = o, { opts: l } = E;
      if (!n && s.length === 0)
        return;
      const f = s.length >= l.loopRequired;
      if (E.allErrors ? h() : D(), l.strictRequired) {
        const t = o.parentSchema.properties, { definedProperties: C } = o.it;
        for (const c of s)
          if (t?.[c] === void 0 && !C.has(c)) {
            const d = E.schemaEnv.baseId + E.errSchemaPath, M = `required property "${c}" is not defined at "${d}" (strictRequired)`;
            (0, r.checkStrictMode)(E, M, E.opts.strictRequired);
          }
      }
      function h() {
        if (f || n)
          o.block$data(e.nil, w);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(o, t);
      }
      function D() {
        const t = B.let("missing");
        if (f || n) {
          const C = B.let("valid", !0);
          o.block$data(C, () => I(t, C)), o.ok(C);
        } else
          B.if((0, A.checkMissingProp)(o, s, t)), (0, A.reportMissingProp)(o, t), B.else();
      }
      function w() {
        B.forOf("prop", a, (t) => {
          o.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, g, t, l.ownProperties), () => o.error());
        });
      }
      function I(t, C) {
        o.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(C, (0, A.propertyInData)(B, g, t, l.ownProperties)), B.if((0, e.not)(C), () => {
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
      const { gen: s, data: a, $data: g, schema: n, parentSchema: E, schemaCode: l, it: f } = B;
      if (!g && !n)
        return;
      const h = s.let("valid"), D = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(h, w, (0, e._)`${l} === false`), B.ok(h);
      function w() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(h, !0), s.if((0, e._)`${c} > 1`, () => (I() ? t : C)(c, d));
      }
      function I() {
        return D.length > 0 && !D.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), K = (0, A.checkDataTypes)(D, M, f.opts.strictNumbers, A.DataType.Wrong), p = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(K, (0, e._)`continue`), D.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${p}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${p}[${M}]`), B.error(), s.assign(h, !1).break();
          }).code((0, e._)`${p}[${M}] = ${c}`);
        });
      }
      function C(c, d) {
        const M = (0, r.useFunc)(s, Q.default), K = s.name("outer");
        s.label(K).for((0, e._)`;${c}--;`, () => s.for((0, e._)`${d} = ${c}; ${d}--;`, () => s.if((0, e._)`${M}(${a}[${c}], ${a}[${d}])`, () => {
          B.error(), s.assign(h, !1).break(K);
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
      const { gen: B, data: s, $data: a, schemaCode: g, schema: n } = o;
      a || n && typeof n == "object" ? o.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${g})`) : o.fail((0, A._)`${n} !== ${s}`);
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
      const { gen: B, data: s, $data: a, schema: g, schemaCode: n, it: E } = o;
      if (!a && g.length === 0)
        throw new Error("enum must have non-empty array");
      const l = g.length >= E.opts.loopEnum;
      let f;
      const h = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let D;
      if (l || a)
        D = B.let("valid"), o.block$data(D, w);
      else {
        if (!Array.isArray(g))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", n);
        D = (0, A.or)(...g.map((C, c) => I(t, c)));
      }
      o.pass(D);
      function w() {
        B.assign(D, !1), B.forOf("v", n, (t) => B.if((0, A._)`${h()}(${s}, ${t})`, () => B.assign(D, !0).break()));
      }
      function I(t, C) {
        const c = g[C];
        return typeof c == "object" && c !== null ? (0, A._)`${h()}(${s}, ${t}[${C}])` : (0, A._)`${s} === ${c}`;
      }
    }
  };
  return _enum.default = i, _enum;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation;
  hasRequiredValidation = 1, Object.defineProperty(validation, "__esModule", { value: !0 });
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), Q = requirePattern(), i = requireLimitProperties(), o = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), g = require_enum(), n = [
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
    g.default
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
    const { gen: s, schema: a, data: g, keyword: n, it: E } = o;
    E.items = !0;
    const l = s.const("len", (0, A._)`${g}.length`);
    if (a === !1)
      o.setParams({ len: B.length }), o.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const h = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(h), () => f(h)), o.ok(h);
    }
    function f(h) {
      s.forRange("i", B.length, l, (D) => {
        o.subschema({ keyword: n, dataProp: D, dataPropType: e.Type.Num }, h), E.allErrors || s.if((0, A.not)(h), () => s.break());
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
    const { gen: a, parentSchema: g, data: n, keyword: E, it: l } = o;
    D(g), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), h = a.const("len", (0, A._)`${n}.length`);
    s.forEach((w, I) => {
      (0, e.alwaysValidSchema)(l, w) || (a.if((0, A._)`${h} > ${I}`, () => o.subschema({
        keyword: E,
        schemaProp: I,
        dataProp: I
      }, f)), o.ok(f));
    });
    function D(w) {
      const { opts: I, errSchemaPath: t } = l, C = s.length, c = C === w.minItems && (C === w.maxItems || w[B] === !1);
      if (I.strictTuples && !c) {
        const d = `"${E}" is ${C}-tuple, but minItems or maxItems/${B} are not specified or different at path "${t}"`;
        (0, e.checkStrictMode)(l, d, I.strictTuples);
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
      const { schema: s, parentSchema: a, it: g } = B, { prefixItems: n } = a;
      g.items = !0, !(0, e.alwaysValidSchema)(g, s) && (n ? (0, Q.validateAdditionalItems)(B, n) : B.ok((0, r.validateArray)(B)));
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
      const { gen: o, schema: B, parentSchema: s, data: a, it: g } = i;
      let n, E;
      const { minContains: l, maxContains: f } = s;
      g.opts.next ? (n = l === void 0 ? 1 : l, E = f) : n = 1;
      const h = o.const("len", (0, A._)`${a}.length`);
      if (i.setParams({ min: n, max: E }), E === void 0 && n === 0) {
        (0, e.checkStrictMode)(g, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && n > E) {
        (0, e.checkStrictMode)(g, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(g, B)) {
        let C = (0, A._)`${h} >= ${n}`;
        E !== void 0 && (C = (0, A._)`${C} && ${h} <= ${E}`), i.pass(C);
        return;
      }
      g.items = !0;
      const D = o.name("valid");
      E === void 0 && n === 1 ? I(D, () => o.if(D, () => o.break())) : n === 0 ? (o.let(D, !0), E !== void 0 && o.if((0, A._)`${a}.length > 0`, w)) : (o.let(D, !1), w()), i.result(D, () => i.reset());
      function w() {
        const C = o.name("_valid"), c = o.let("count", 0);
        I(C, () => o.if(C, () => t(c)));
      }
      function I(C, c) {
        o.forRange("i", 0, h, (d) => {
          i.subschema({
            keyword: "contains",
            dataProp: d,
            dataPropType: e.Type.Num,
            compositeRule: !0
          }, C), c();
        });
      }
      function t(C) {
        o.code((0, A._)`${C}++`), E === void 0 ? o.if((0, A._)`${C} >= ${n}`, () => o.assign(D, !0).break()) : (o.if((0, A._)`${C} > ${E}`, () => o.assign(D, !1).break()), n === 1 ? o.assign(D, !0) : o.if((0, A._)`${C} >= ${n}`, () => o.assign(D, !0)));
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
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [g, n] = o(a);
        B(a, g), s(a, n);
      }
    };
    function o({ schema: a }) {
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
        const D = g[h];
        if (D.length === 0)
          continue;
        const w = (0, Q.propertyInData)(n, E, h, l.opts.ownProperties);
        a.setParams({
          property: h,
          depsCount: D.length,
          deps: D.join(", ")
        }), l.allErrors ? n.if(w, () => {
          for (const I of D)
            (0, Q.checkReportMissingProp)(a, I);
        }) : (n.if((0, e._)`${w} && (${(0, Q.checkMissingProp)(a, D, f)})`), (0, Q.reportMissingProp)(a, f), n.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, g = a.schema) {
      const { gen: n, data: E, keyword: l, it: f } = a, h = n.name("valid");
      for (const D in g)
        (0, r.alwaysValidSchema)(f, g[D]) || (n.if(
          (0, Q.propertyInData)(n, E, D, f.opts.ownProperties),
          () => {
            const w = a.subschema({ keyword: l, schemaProp: D }, h);
            a.mergeValidEvaluated(w, h);
          },
          () => n.var(h, !0)
          // TODO var
        ), a.ok(h));
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
      const g = o.name("valid");
      o.forIn("key", s, (n) => {
        i.setParams({ propertyName: n }), i.subschema({
          keyword: "propertyNames",
          data: n,
          dataTypes: ["string"],
          propertyName: n,
          compositeRule: !0
        }, g), o.if((0, A.not)(g), () => {
          i.error(!0), a.allErrors || o.break();
        });
      }), i.ok(g);
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
      const { gen: s, schema: a, parentSchema: g, data: n, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: h } = l;
      if (l.props = !0, h.removeAdditional !== "all" && (0, Q.alwaysValidSchema)(l, a))
        return;
      const D = (0, A.allSchemaProperties)(g.properties), w = (0, A.allSchemaProperties)(g.patternProperties);
      I(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function I() {
        s.forIn("key", n, (M) => {
          !D.length && !w.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let K;
        if (D.length > 8) {
          const p = (0, Q.schemaRefOrVal)(l, g.properties, "properties");
          K = (0, A.isOwnProperty)(s, p, M);
        } else D.length ? K = (0, e.or)(...D.map((p) => (0, e._)`${M} === ${p}`)) : K = e.nil;
        return w.length && (K = (0, e.or)(K, ...w.map((p) => (0, e._)`${(0, A.usePattern)(B, p)}.test(${M})`))), (0, e.not)(K);
      }
      function C(M) {
        s.code((0, e._)`delete ${n}[${M}]`);
      }
      function c(M) {
        if (h.removeAdditional === "all" || h.removeAdditional && a === !1) {
          C(M);
          return;
        }
        if (a === !1) {
          B.setParams({ additionalProperty: M }), B.error(), f || s.break();
          return;
        }
        if (typeof a == "object" && !(0, Q.alwaysValidSchema)(l, a)) {
          const K = s.name("valid");
          h.removeAdditional === "failing" ? (d(M, K, !1), s.if((0, e.not)(K), () => {
            B.reset(), C(M);
          })) : (d(M, K), f || s.if((0, e.not)(K), () => s.break()));
        }
      }
      function d(M, K, p) {
        const O = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: Q.Type.Str
        };
        p === !1 && Object.assign(O, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), B.subschema(O, K);
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
      const { gen: B, schema: s, parentSchema: a, data: g, it: n } = o;
      n.opts.removeAdditional === "all" && a.additionalProperties === void 0 && Q.default.code(new A.KeywordCxt(n, Q.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const w of E)
        n.definedProperties.add(w);
      n.opts.unevaluated && E.length && n.props !== !0 && (n.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), n.props));
      const l = E.filter((w) => !(0, r.alwaysValidSchema)(n, s[w]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const w of l)
        h(w) ? D(w) : (B.if((0, e.propertyInData)(B, g, w, n.opts.ownProperties)), D(w), n.allErrors || B.else().var(f, !0), B.endIf()), o.it.definedProperties.add(w), o.ok(f);
      function h(w) {
        return n.opts.useDefaults && !n.compositeRule && s[w].default !== void 0;
      }
      function D(w) {
        o.subschema({
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
  const A = requireCode(), e = requireCodegen(), r = requireUtil(), Q = requireUtil(), i = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(o) {
      const { gen: B, schema: s, data: a, parentSchema: g, it: n } = o, { opts: E } = n, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(n, s[c]));
      if (l.length === 0 || f.length === l.length && (!n.opts.unevaluated || n.props === !0))
        return;
      const h = E.strictSchema && !E.allowMatchingProperties && g.properties, D = B.name("valid");
      n.props !== !0 && !(n.props instanceof e.Name) && (n.props = (0, Q.evaluatedPropsToName)(B, n.props));
      const { props: w } = n;
      I();
      function I() {
        for (const c of l)
          h && t(c), n.allErrors ? C(c) : (B.var(D, !0), C(c), B.if(D));
      }
      function t(c) {
        for (const d in h)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(n, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
      }
      function C(c) {
        B.forIn("key", a, (d) => {
          B.if((0, e._)`${(0, A.usePattern)(o, c)}.test(${d})`, () => {
            const M = f.includes(c);
            M || o.subschema({
              keyword: "patternProperties",
              schemaProp: c,
              dataProp: d,
              dataPropType: Q.Type.Str
            }, D), n.opts.unevaluated && w !== !0 ? B.assign((0, e._)`${w}[${d}]`, !0) : !M && !n.allErrors && B.if((0, e.not)(D), () => B.break());
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
      const g = B, n = o.let("valid", !1), E = o.let("passing", null), l = o.name("_valid");
      i.setParams({ passing: E }), o.block(f), i.result(n, () => i.reset(), () => i.error(!0));
      function f() {
        g.forEach((h, D) => {
          let w;
          (0, e.alwaysValidSchema)(a, h) ? o.var(l, !0) : w = i.subschema({
            keyword: "oneOf",
            schemaProp: D,
            compositeRule: !0
          }, l), D > 0 && o.if((0, A._)`${l} && ${n}`).assign(n, !1).assign(E, (0, A._)`[${E}, ${D}]`).else(), o.if(l, () => {
            o.assign(n, !0), o.assign(E, D), w && i.mergeEvaluated(w, A.Name);
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
      const g = i(a, "then"), n = i(a, "else");
      if (!g && !n)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), o.reset(), g && n) {
        const D = B.let("ifClause");
        o.setParams({ ifClause: D }), B.if(l, h("then", D), h("else", D));
      } else g ? B.if(l, h("then")) : B.if((0, A.not)(l), h("else"));
      o.pass(E, () => o.error(!0));
      function f() {
        const D = o.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, l);
        o.mergeEvaluated(D);
      }
      function h(D, w) {
        return () => {
          const I = o.subschema({ keyword: D }, l);
          B.assign(E, l), o.mergeValidEvaluated(I, E), w ? B.assign(w, (0, A._)`${D}`) : o.setParams({ ifClause: D });
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
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), Q = requireItems2020(), i = requireContains(), o = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), g = requirePatternProperties(), n = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), h = require_if(), D = requireThenElse();
  function w(I = !1) {
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
      o.default,
      a.default,
      g.default
    ];
    return I ? t.push(e.default, Q.default) : t.push(A.default, r.default), t.push(i.default), t;
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
      message: ({ schemaCode: Q }) => (0, A.str)`must match format "${Q}"`,
      params: ({ schemaCode: Q }) => (0, A._)`{format: ${Q}}`
    },
    code(Q, i) {
      const { gen: o, data: B, $data: s, schema: a, schemaCode: g, it: n } = Q, { opts: E, errSchemaPath: l, schemaEnv: f, self: h } = n;
      if (!E.validateFormats)
        return;
      s ? D() : w();
      function D() {
        const I = o.scopeValue("formats", {
          ref: h.formats,
          code: E.code.formats
        }), t = o.const("fDef", (0, A._)`${I}[${g}]`), C = o.let("fType"), c = o.let("format");
        o.if((0, A._)`typeof ${t} == "object" && !(${t} instanceof RegExp)`, () => o.assign(C, (0, A._)`${t}.type || "string"`).assign(c, (0, A._)`${t}.validate`), () => o.assign(C, (0, A._)`"string"`).assign(c, t)), Q.fail$data((0, A.or)(d(), M()));
        function d() {
          return E.strictSchema === !1 ? A.nil : (0, A._)`${g} && !${c}`;
        }
        function M() {
          const K = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, p = (0, A._)`(typeof ${c} == "function" ? ${K} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${C} === ${i} && !${p}`;
        }
      }
      function w() {
        const I = h.formats[a];
        if (!I) {
          d();
          return;
        }
        if (I === !0)
          return;
        const [t, C, c] = M(I);
        t === i && Q.pass(K());
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
          const O = p instanceof RegExp ? (0, A.regexpCode)(p) : E.code.formats ? (0, A._)`${E.code.formats}${(0, A.getProperty)(a)}` : void 0, q = o.scopeValue("formats", { key: a, ref: p, code: O });
          return typeof p == "object" && !(p instanceof RegExp) ? [p.type || "string", p.validate, (0, A._)`${q}.validate`] : ["string", p, q];
        }
        function K() {
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
      const D = a.let("valid", !1), w = a.const("tag", (0, A._)`${g}${(0, A.getProperty)(h)}`);
      a.if((0, A._)`typeof ${w} == "string"`, () => I(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: w, tagName: h })), s.ok(D);
      function I() {
        const c = C();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${w} === ${d}`), a.assign(D, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: w, tagName: h }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function C() {
        var c;
        const d = {}, M = p(E);
        let K = !0;
        for (let z = 0; z < f.length; z++) {
          let S = f[z];
          if (S?.$ref && !(0, i.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new Q.default(l.opts.uriResolver, l.baseId, Y);
          }
          const L = (c = S?.properties) === null || c === void 0 ? void 0 : c[h];
          if (typeof L != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${h}"`);
          K = K && (M || p(S)), O(L, z);
        }
        if (!K)
          throw new Error(`discriminator: "${h}" must be required`);
        return d;
        function p({ required: z }) {
          return Array.isArray(z) && z.includes(h);
        }
        function O(z, S) {
          if (z.const)
            q(z.const, S);
          else if (z.enum)
            for (const L of z.enum)
              q(L, S);
          else
            throw new Error(`discriminator: "properties/${h}" must have "const" or "enum"`);
        }
        function q(z, S) {
          if (typeof z != "string" || z in d)
            throw new Error(`discriminator: "${h}" values must be unique strings`);
          d[z] = S;
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
        super._addVocabularies(), Q.default.forEach((h) => this.addVocabulary(h)), this.opts.discriminator && this.addKeyword(i.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const h = this.opts.$data ? this.$dataMetaSchema(o, B) : o;
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
function __awaiter(A, e, r, Q) {
  function i(o) {
    return o instanceof r ? o : new r(function(B) {
      B(o);
    });
  }
  return new (r || (r = Promise))(function(o, B) {
    function s(n) {
      try {
        g(Q.next(n));
      } catch (E) {
        B(E);
      }
    }
    function a(n) {
      try {
        g(Q.throw(n));
      } catch (E) {
        B(E);
      }
    }
    function g(n) {
      n.done ? o(n.value) : i(n.value).then(s, a);
    }
    g((Q = Q.apply(A, [])).next());
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
  function s(g) {
    return function(n) {
      return a([g, n]);
    };
  }
  function a(g) {
    if (Q) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (Q = 1, i && (o = g[0] & 2 ? i.return : g[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, g[1])).done) return o;
      switch (i = 0, o && (g = [g[0] & 2, o.value]), g[0]) {
        case 0:
        case 1:
          o = g;
          break;
        case 4:
          return r.label++, { value: g[1], done: !1 };
        case 5:
          r.label++, i = g[1], g = [0];
          continue;
        case 7:
          g = r.ops.pop(), r.trys.pop();
          continue;
        default:
          if (o = r.trys, !(o = o.length > 0 && o[o.length - 1]) && (g[0] === 6 || g[0] === 2)) {
            r = 0;
            continue;
          }
          if (g[0] === 3 && (!o || g[1] > o[0] && g[1] < o[3])) {
            r.label = g[1];
            break;
          }
          if (g[0] === 6 && r.label < o[1]) {
            r.label = o[1], o = g;
            break;
          }
          if (o && r.label < o[2]) {
            r.label = o[2], r.ops.push(g);
            break;
          }
          o[2] && r.ops.pop(), r.trys.pop();
          continue;
      }
      g = e.call(A, r);
    } catch (n) {
      g = [6, n], i = 0;
    } finally {
      Q = o = 0;
    }
    if (g[0] & 5) throw g[1];
    return { value: g[0] ? g[1] : void 0, done: !0 };
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
      for (const { count: a, res: g } of B.anchors.values())
        i(g, a);
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
  let g = findTagObject(A, e, B.tags);
  if (!g) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    g = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  o && (o(g), delete r.onTagObj);
  const n = g?.createNode ? g.createNode(r.schema, A, r) : typeof g?.nodeClass?.from == "function" ? g.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return g.default || (n.tag = g.tag), a && (a.node = n), n;
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
  const g = [], n = {};
  let E = i - e.length;
  typeof Q == "number" && (Q > i - Math.max(2, o) ? g.push(0) : E = i - Q);
  let l, f, h = !1, D = -1, w = -1, I = -1;
  r === FOLD_BLOCK && (D = consumeMoreIndentedLines(A, D, e.length), D !== -1 && (E = D + a));
  for (let C; C = A[D += 1]; ) {
    if (r === FOLD_QUOTED && C === "\\") {
      switch (w = D, A[D + 1]) {
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
          g.push(l), E = l + a, l = void 0;
        else if (r === FOLD_QUOTED) {
          for (; f === " " || f === "	"; )
            f = C, C = A[D += 1], h = !0;
          const c = D > I + 1 ? D - 2 : w - 1;
          if (n[c])
            return A;
          g.push(c), n[c] = !0, E = c + a, l = void 0;
        } else
          h = !0;
    }
    f = C;
  }
  if (h && s && s(), g.length === 0)
    return A;
  B && B();
  let t = A.slice(0, g[0]);
  for (let C = 0; C < g.length; ++C) {
    const c = g[C], d = g[C + 1] || A.length;
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
  const g = Q.indent || (Q.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), n = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, g.length);
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
  h === -1 ? E = "-" : r === f || h !== f.length - 1 ? (E = "+", o && o()) : E = "", f && (r = r.slice(0, -f.length), f[f.length - 1] === `
` && (f = f.slice(0, -1)), f = f.replace(blockEndNewlines, `$&${g}`));
  let D = !1, w, I = -1;
  for (w = 0; w < r.length; ++w) {
    const d = r[w];
    if (d === " ")
      D = !0;
    else if (d === `
`)
      I = w;
    else
      break;
  }
  let t = r.substring(0, I < w ? I + 1 : w);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${g}`));
  let c = (D ? g ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !n) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${g}`);
    let M = !1;
    const K = getFoldOptions(Q, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (K.onOverflow = () => {
      M = !0;
    });
    const p = foldFlowLines(`${t}${d}${f}`, g, FOLD_BLOCK, K);
    if (!M)
      return `>${c}
${g}${p}`;
  }
  return r = r.replace(/\n+/g, `$&${g}`), `|${c}
${g}${t}${r}${f}`;
}
function plainString(A, e, r, Q) {
  const { type: i, value: o } = A, { actualString: B, implicitKey: s, indent: a, indentStep: g, inFlow: n } = e;
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
    if (s && a === g)
      return quotedString(o, e);
  }
  const E = o.replace(/\n+/g, `$&
${a}`);
  if (B) {
    const l = (D) => D.default && D.tag !== "tag:yaml.org,2002:str" && D.test?.test(E), { compat: f, tags: h } = e.doc.schema;
    if (h.some(l) || f?.some(l))
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
  let g = a(s);
  if (g === null) {
    const { defaultKeyType: n, defaultStringType: E } = e.options, l = i && n || E;
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
  const { allNullValues: o, doc: B, indent: s, indentStep: a, options: { commentString: g, indentSeq: n, simpleKeys: E } } = r;
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
    implicitKey: !f && (E || !o),
    indent: s + a
  });
  let h = !1, D = !1, w = stringify(A, r, () => h = !0, () => D = !0);
  if (!f && !r.inFlow && w.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (o || e == null)
      return h && Q && Q(), w === "" ? "?" : f ? `? ${w}` : w;
  } else if (o && !E || e == null && f)
    return w = `? ${w}`, l && !h ? w += lineComment(w, r.indent, g(l)) : D && i && i(), w;
  h && (l = null), f ? (l && (w += lineComment(w, r.indent, g(l))), w = `? ${w}
${s}:`) : (w = `${w}:`, l && (w += lineComment(w, r.indent, g(l))));
  let I, t, C;
  isNode(e) ? (I = !!e.spaceBefore, t = e.commentBefore, C = e.comment) : (I = !1, t = null, C = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = w.length + 1), D = !1, !n && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => D = !0);
  let M = " ";
  if (l || I || t) {
    if (M = I ? `
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
    const K = d[0], p = d.indexOf(`
`), O = p !== -1, q = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !q) {
      let z = !1;
      if (O && (K === "&" || K === "!")) {
        let S = d.indexOf(" ");
        K === "&" && S !== -1 && S < p && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || p < S) && (z = !0);
      }
      z || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return w += M + d, r.inFlow ? c && Q && Q() : C && !c ? w += lineComment(w, r.indent, g(C)) : D && i && i(), w;
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
  const { indent: a, options: { commentString: g } } = r, n = Object.assign({}, r, { indent: o, type: null });
  let E = !1;
  const l = [];
  for (let h = 0; h < e.length; ++h) {
    const D = e[h];
    let w = null;
    if (isNode(D))
      !E && D.spaceBefore && l.push(""), addCommentBefore(r, l, D.commentBefore, E), D.comment && (w = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let I = stringify(D, n, () => w = null, () => E = !0);
    w && (I += lineComment(I, o, g(w))), E && w && (E = !1), l.push(Q + I);
  }
  let f;
  if (l.length === 0)
    f = i.start + i.end;
  else {
    f = l[0];
    for (let h = 1; h < l.length; ++h) {
      const D = l[h];
      f += D ? `
${a}${D}` : `
`;
    }
  }
  return A ? (f += `
` + indentComment(g(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: Q }) {
  const { indent: i, indentStep: o, flowCollectionPadding: B, options: { commentString: s } } = e;
  Q += o;
  const a = Object.assign({}, e, {
    indent: Q,
    inFlow: !0,
    type: null
  });
  let g = !1, n = 0;
  const E = [];
  for (let h = 0; h < A.length; ++h) {
    const D = A[h];
    let w = null;
    if (isNode(D))
      D.spaceBefore && E.push(""), addCommentBefore(e, E, D.commentBefore, !1), D.comment && (w = D.comment);
    else if (isPair(D)) {
      const t = isNode(D.key) ? D.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (g = !0));
      const C = isNode(D.value) ? D.value : null;
      C ? (C.comment && (w = C.comment), C.commentBefore && (g = !0)) : D.value == null && t?.comment && (w = t.comment);
    }
    w && (g = !0);
    let I = stringify(D, a, () => w = null);
    h < A.length - 1 && (I += ","), w && (I += lineComment(I, Q, s(w))), !g && (E.length > n || I.includes(`
`)) && (g = !0), E.push(I), n = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!g) {
    const h = E.reduce((D, w) => D + w.length + 2, 2);
    g = e.options.lineWidth > 0 && h > e.options.lineWidth;
  }
  if (g) {
    let h = l;
    for (const D of E)
      h += D ? `
${o}${i}${D}` : `
`;
    return `${h}
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
    const { keepUndefined: i, replacer: o } = Q, B = new this(e), s = (a, g) => {
      if (typeof o == "function")
        g = o.call(r, a, g);
      else if (Array.isArray(o) && !o.includes(a))
        return;
      (g !== void 0 || i) && B.items.push(createPair(a, g, Q));
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
        const g = Object.keys(B);
        if (g.length === 1)
          s = g[0], a = B[s];
        else
          throw new TypeError(`Expected tuple with one key, not ${g.length} keys`);
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
      let a = s.i, g = s.n;
      if (o.length > 2) {
        const E = [], l = [], f = (o.length - 2) / 2, h = o.slice(2, 2 + f);
        for (const D of h) {
          const w = A.subscripts[D];
          E.push(w.i), l.push(w.n);
        }
        a += `[${E.join(",")}]`, g += `[${l.join(",")}]`;
      }
      const n = {
        varId: a,
        varName: g,
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
  function r(g, n) {
    n < g.minValue ? (console.warn(
      `WARNING: Scenario input value ${n} is < min value (${g.minValue}) for input '${g.varName}'`
    ), n = g.minValue) : n > g.maxValue && (console.warn(
      `WARNING: Scenario input value ${n} is > max value (${g.maxValue}) for input '${g.varName}'`
    ), n = g.maxValue), g.value.set(n);
  }
  function Q(g) {
    g.value.reset();
  }
  function i(g) {
    g.value.set(g.minValue);
  }
  function o(g) {
    g.value.set(g.maxValue);
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
      for (const g of e.settings) {
        const n = A.get(g.inputVarId);
        if (n)
          switch (g.kind) {
            case "position":
              switch (g.position) {
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 5 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 1e-4, minValue: -1, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_price_responsiveness_on_caloric_distribution_below_1", varName: "Price Responsiveness on Caloric Distribution Below 1", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "u_dis_3", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_2", varId: "_recovered_loss_production_response_variation", varName: "Recovered Loss Production Response Variation", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_flw_1", varId: "_recovered_waste_production_response_variation", varName: "Recovered Waste Production Response Variation", defaultValue: 60, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed0", varId: "_fake_value_15", varName: "Fake Value 15", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed11", varId: "_target_percentage_for_change", varName: "Target Percentage for Change", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_36", varId: "_meat_diet_composition_switch", varName: "Meat Diet Composition Switch", defaultValue: 0, minValue: -0.2, maxValue: 2.2 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_81", varId: "_vegetarian_diet_composition_switch", varName: "Vegetarian Diet Composition Switch", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_animal_food_supply_kcal_capita_day", varName: "Animal Food Supply kcal capita day" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_average_caloric_availability_per_capita_per_day", varName: "Average Caloric Availability per Capita per Day" }, { varId: "_average_caloric_consumption_per_capita_per_day", varName: "Average Caloric Consumption per Capita per Day" }, { varId: "_average_total_daily_calorie_intake", varName: "Average Total Daily Calorie Intake" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_desired_food_production_in_calories_per_capita_per_day", varName: "Desired Food Production in Calories per Capita Per Day" }, { varId: "_desired_food_production_in_tonnes_animal", varName: "Desired food production in tonnes Animal" }, { varId: "_desired_food_production_in_tonnes_plant", varName: "Desired food production in tonnes Plant" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_effect_of_pricing_on_caloric_distribution", varName: "Effect of Pricing on Caloric Distribution" }, { varId: "_effective_food_demand_per_capita_per_day", varName: "Effective Food Demand per Capita per Day" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_food_shortage_in_tonnes_animal", varName: "Food shortage in tonnes Animal" }, { varId: "_food_shortage_in_tonnes_plant", varName: "Food shortage in tonnes Plant" }, { varId: "_food_supply_in_tonnes_animal", varName: "Food supply in tonnes Animal" }, { varId: "_food_supply_in_tonnes_plant", varName: "Food supply in tonnes Plant" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_allocated_for_animal_calories", varName: "Land Allocated for Animal Calories" }, { varId: "_land_allocated_for_energy_crops", varName: "Land Allocated for Energy Crops" }, { varId: "_land_allocated_for_food_crops", varName: "Land Allocated for Food Crops" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen_leaching_and_runoff_rate", varName: "Nitrogen Leaching and Runoff Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus_erosion_leaching_and_runoff_rate", varName: "Phosphorus erosion leaching and runoff rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_supply_demand_ratio_for_food", varName: "Supply Demand Ratio for Food" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_animal_food_production", varName: "Total Animal Food Production" }, { varId: "_total_annual_caloric_demand_from_alternative_proteins", varName: "Total Annual Caloric Demand from Alternative Proteins" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_daily_calorie_supply_per_capita", varName: "Total Daily Calorie Supply per Capita" }, { varId: "_total_feedstock_alternative_proteins", varName: "Total Feedstock Alternative Proteins" }, { varId: "_total_feedstock_production", varName: "Total Feedstock Production" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_plant_food_production", varName: "Total Plant Food Production" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_vegetal_food_supply_kcal_capita_day", varName: "Vegetal Food supply kcal capita day" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 482689, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,C){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return C.deserialize(o,I)},serialize(o){return C.serialize(o,E)}}}serializers.extendSerializer=A;const w={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?w.deserialize(B):B},serialize(B){return B instanceof Error?w.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let w=A.DefaultSerializer;function Q(I){w=A.extendSerializer(w,I)}common.registerSerializer=Q;function B(I){return w.deserialize(I)}common.deserialize=B;function C(I){return w.serialize(I)}return common.serialize=C,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function w(C){return!(!C||typeof C!="object")}function Q(C){return C&&typeof C=="object"&&C[A.$transferable]}transferable.isTransferDescriptor=Q;function B(C,I){if(!I){if(!w(C))throw Error();I=[C]}return{[A.$transferable]:!0,send:C,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(w){w.cancel="cancel",w.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(w){w.error="error",w.init="init",w.result="result",w.running="running",w.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const C=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!C)},w=function(C,I){self.postMessage(C,I)},Q=function(C){const I=o=>{C(o.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},w=function(E){self.postMessage(E)};let Q=!1;const B=new Set,C=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:w,subscribeToMasterMessages:C},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const w=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!w.default().isMainThread},C=function(K,i){Q(w.default().parentPort).postMessage(K,i)},I=function(K){const i=w.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const a=O=>{K(O)},G=()=>{Q(i).off("message",a)};return Q(i).on("message",a),G};function E(){w.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:C,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const w=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),C=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=C?I():w.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var w=worker&&worker.__awaiter||function(M,P,t,q){function Y(j){return j instanceof t?j:new t(function(S){S(j)})}return new(t||(t=Promise))(function(j,S){function _(p){try{x(q.next(p))}catch(X){S(X)}}function $(p){try{x(q.throw(p))}catch(X){S(X)}}function x(p){p.done?j(p.value):Y(p.value).then(_,$)}x((q=q.apply(M,P||[])).next())})},Q=worker&&worker.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),C=requireCommon(),I=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let a=!1;const G=new Map,O=M=>M&&M.type===E.MasterMessageType.cancel,n=M=>M&&M.type===E.MasterMessageType.run,N=M=>B.default(M)||y(M);function y(M){return M&&typeof M=="object"&&typeof M.subscribe=="function"}function d(M){return I.isTransferDescriptor(M)?{payload:M.send,transferables:M.transferables}:{payload:M,transferables:void 0}}function F(){const M={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(M)}function m(M){const P={type:E.WorkerMessageType.init,exposed:{type:"module",methods:M}};o.default.postMessageToMaster(P)}function c(M,P){const{payload:t,transferables:q}=d(P),Y={type:E.WorkerMessageType.error,uid:M,error:C.serialize(t)};o.default.postMessageToMaster(Y,q)}function H(M,P,t){const{payload:q,transferables:Y}=d(t),j={type:E.WorkerMessageType.result,uid:M,complete:P?!0:void 0,payload:q};o.default.postMessageToMaster(j,Y)}function U(M,P){const t={type:E.WorkerMessageType.running,uid:M,resultType:P};o.default.postMessageToMaster(t)}function h(M){try{const P={type:E.WorkerMessageType.uncaughtError,error:C.serialize(M)};o.default.postMessageToMaster(P)}catch(P){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,P,`\nOriginal error:`,M)}}function Z(M,P,t){return w(this,void 0,void 0,function*(){let q;try{q=P(...t)}catch(j){return c(M,j)}const Y=N(q)?"observable":"promise";if(U(M,Y),N(q)){const j=q.subscribe(S=>H(M,!1,C.serialize(S)),S=>{c(M,C.serialize(S)),G.delete(M)},()=>{H(M,!0),G.delete(M)});G.set(M,j)}else try{const j=yield q;H(M,!0,C.serialize(j))}catch(j){c(M,C.serialize(j))}})}function l(M){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(a)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(a=!0,typeof M=="function")o.default.subscribeToMasterMessages(P=>{n(P)&&!P.method&&Z(P.uid,M,P.args.map(C.deserialize))}),F();else if(typeof M=="object"&&M){o.default.subscribeToMasterMessages(t=>{n(t)&&t.method&&Z(t.uid,M[t.method],t.args.map(C.deserialize))});const P=Object.keys(M).filter(t=>typeof M[t]=="function");m(P)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${M}`);o.default.subscribeToMasterMessages(P=>{if(O(P)){const t=P.uid,q=G.get(t);q&&(q.unsubscribe(),G.delete(t))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",M=>{setTimeout(()=>h(M.error||M),250)}),self.addEventListener("unhandledrejection",M=>{const P=M.reason;P&&typeof P.message=="string"&&setTimeout(()=>h(P),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",M=>{setTimeout(()=>h(M),250)}),process.on("unhandledRejection",M=>{M&&typeof M.message=="string"&&setTimeout(()=>h(M),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var w;let Q=1;for(const B of A){Q+=2;const C=((w=B.subscriptIndices)==null?void 0:w.length)||0;Q+=C}return Q}function encodeVarIndices(A,w){let Q=0;w[Q++]=A.length;for(const B of A){w[Q++]=B.varIndex;const C=B.subscriptIndices,I=C?.length||0;w[Q++]=I;for(let E=0;E<I;E++)w[Q++]=C[E]}}function getEncodedLookupBufferLengths(A){var w,Q;let B=1,C=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((w=E.subscriptIndices)==null?void 0:w.length)||0;B+=o,B+=2,C+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:C}}function encodeLookups(A,w,Q){let B=0;w[B++]=A.length;let C=0;for(const I of A){const E=I.varRef.varSpec;w[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;w[B++]=K;for(let i=0;i<K;i++)w[B++]=o[i];I.points!==void 0?(w[B++]=C,w[B++]=I.points.length,Q?.set(I.points,C),C+=I.points.length):(w[B++]=-1,w[B++]=0)}}function decodeLookups(A,w){const Q=[];let B=0;const C=A[B++];for(let I=0;I<C;I++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let n=0;n<o;n++)K[n]=A[B++];const i=A[B++],a=A[B++],G={varIndex:E,subscriptIndices:K};let O;i>=0?w?O=w.slice(i,i+a):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:G},points:O})}return Q}function resolveVarRef(A,w,Q){if(!w.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(w.varId){const B=A?.getSpecForVarId(w.varId);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${w.varId}`)}else{const B=A?.getSpecForVarName(w.varName);if(B)w.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${w.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Int32Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,w,Q){this.view=Q>0?new Float64Array(A,w,Q):void 0,this.offsetInBytes=w,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,w){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=w(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,w){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=w(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,w,Q){const B=A.length,C=w.varIds.length*w.seriesLength;let I;const E=w.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const Z of Q.lookups)resolveVarRef(this.listing,Z.varRef,"lookup");const h=getEncodedLookupBufferLengths(Q.lookups);o=h.lookupsLength,K=h.lookupIndicesLength}else o=0,K=0;let i=0;function a(h,Z){const l=i,M=h==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,P=Math.round(Z*M),t=Math.ceil(P/8)*8;return i+=t,l}const G=a("int32",headerLengthInElements),O=a("float64",extrasLengthInElements),n=a("float64",B),N=a("float64",C),y=a("int32",I),d=a("float64",o),F=a("int32",K),m=i;if(this.encoded===void 0||this.encoded.byteLength<m){const h=Math.ceil(m*1.2);this.encoded=new ArrayBuffer(h),this.header.update(this.encoded,G,headerLengthInElements)}const c=this.header.view;let H=0;c[H++]=O,c[H++]=extrasLengthInElements,c[H++]=n,c[H++]=B,c[H++]=N,c[H++]=C,c[H++]=y,c[H++]=I,c[H++]=d,c[H++]=o,c[H++]=F,c[H++]=K,this.inputs.update(this.encoded,n,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,N,C),this.outputIndices.update(this.encoded,y,I),this.lookups.update(this.encoded,d,o),this.lookupIndices.update(this.encoded,F,K);const U=this.inputs.view;for(let h=0;h<A.length;h++){const Z=A[h];typeof Z=="number"?U[h]=Z:U[h]=Z.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const w=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<w)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let C=0;const I=B[C++],E=B[C++],o=B[C++],K=B[C++],i=B[C++],a=B[C++],G=B[C++],O=B[C++],n=B[C++],N=B[C++],y=B[C++],d=B[C++],F=E*Float64Array.BYTES_PER_ELEMENT,m=K*Float64Array.BYTES_PER_ELEMENT,c=a*Float64Array.BYTES_PER_ELEMENT,H=O*Int32Array.BYTES_PER_ELEMENT,U=N*Float64Array.BYTES_PER_ELEMENT,h=d*Int32Array.BYTES_PER_ELEMENT,Z=w+F+m+c+H+U+h;if(A.byteLength<Z)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,i,a),this.outputIndices.update(this.encoded,G,O),this.lookups.update(this.encoded,n,N),this.lookupIndices.update(this.encoded,y,d)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,w){if(w&&w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);this.originalData=w,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,w){if(w){if(w.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${w.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=w.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,w){return this.getValue(A,!1,w)}getValueForY(A){if(this.invertedData===void 0){const w=this.activeSize*2,Q=this.activeData,B=Array(w);for(let C=0;C<w;C+=2)B[C]=Q[C+1],B[C+1]=Q[C];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,w,Q){if(this.activeSize===0)return _NA_;const B=w?this.invertedData:this.activeData,C=this.activeSize*2,I=!w;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<C;o+=2){const K=B[o];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const i=B[o-2],a=B[o-1],G=B[o+1],O=K-i,n=G-a;return a+n/O*(A-i)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=C),B[C-1]}getValueForGameTime(A,w){if(this.activeSize<=0)return w;const Q=this.activeData[0];return A<Q?w:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,w){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(w){case"forward":{A=Math.floor(A);for(let C=0;C<B;C+=2)if(Q[C]>=A)return Q[C+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let C=2;C<B;C+=2)if(Q[C]>=A)return Q[C-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let C=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw C+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",C+="results that may differ from those produced by SDEverywhere.",new Error(C)}for(let C=2;C<B;C+=2){const I=Q[C];if(I>=A){const E=Q[C-2],o=Q[C-1],K=Q[C+1],i=I-E,a=K-o;return o+a/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const w=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,C){return B?B.getValueForGameTime(A.currentTime,C):C},INTEG(B,C){return B+C*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,C){return Math.max(B,C)},MIN(B,C){return Math.min(B,C)},MODULO(B,C){return B%C},POW(B,C){return Math.pow(B,C)},POWER(B,C){return Math.pow(B,C)},PULSE(B,C){return pulse(A,B,C)},PULSE_TRAIN(B,C,I,E){const o=Math.floor((E-B)/I);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*I,C))return 1;return 0},QUANTUM(B,C){return C<=0?B:C*Math.trunc(B/C)},RAMP(B,C,I){return A.currentTime>C?A.currentTime<I||C>I?B*(A.currentTime-C):B*(I-C):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,C){return A.currentTime+A.timeStep/2>C?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,C,I){if(C>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${C})`);let E=Q.get(C);if(E===void 0){E=Array(C);for(let i=0;i<C;i++)E[i]={x:0,ind:0};Q.set(C,E)}let o=w.get(C);o===void 0&&(o=Array(C),w.set(C,o));for(let i=0;i<C;i++)E[i].x=B[i],E[i].ind=i;const K=I>0?1:-1;E.sort((i,a)=>{let G;return i.x<a.x?G=-1:i.x>a.x?G=1:G=0,G*K});for(let i=0;i<C;i++)o[i]=E[i].ind;return o},XIDZ(B,C,I){return Math.abs(C)<EPSILON?I:B/C},ZIDZ(B,C){return Math.abs(C)<EPSILON?0:B/C},createLookup(B,C){return new JsModelLookup(B,C)},LOOKUP(B,C){return B?B.getValueForX(C,"interpolate"):_NA_},LOOKUP_FORWARD(B,C){return B?B.getValueForX(C,"forward"):_NA_},LOOKUP_BACKWARD(B,C){return B?B.getValueForX(C,"backward"):_NA_},LOOKUP_INVERT(B,C){return B?B.getValueForY(C):_NA_},WITH_LOOKUP(B,C){return C?C.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,C,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(C,E):_NA_}}}function pulse(A,w,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>w&&B<w+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const w=process.hrtime(A);return(w[0]*1e9+w[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var w;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const C=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<C)&&(this.outputs=new Float64Array(C));const I=this.outputs,E=perfNow();(w=this.onRunModel)==null||w.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let w=A.getModelFunctions();w===void 0&&(w=getJsModelFunctions(),A.setModelFunctions(w));const Q=A.getInitialTime(),B=A.getFinalTime(),C=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,i)=>{runJsModel(A,Q,B,C,I,E,o,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,w,Q,B,C,I,E,o,K,i,a){let G=w;A.setTime(G);const O={timeStep:B,currentTime:G};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const m of i)A.setLookup(m.varRef.varSpec,m.points);E?.length>0&&A.setInputs(m=>E[m]),A.initLevels();const n=Math.round((Q-w)/B),N=Q;let y=0,d=0,F=0;for(;y<=n;){if(A.evalAux(),G%C<1e-6){F=0;const m=c=>{const H=F*I+d;o[H]=G<=N?c:void 0,F++};if(K!==void 0){let c=0;const H=K[c++];for(let U=0;U<H;U++){const h=K[c++],Z=K[c++];let l;Z>0&&(l=K.subarray(c,c+Z),c+=Z);const M={varIndex:h,subscriptIndices:l};A.storeOutput(M,m)}}else A.storeOutputs(m);d++}if(y===n)break;A.evalLevels(),G+=B,A.setTime(G),O.currentTime=G,y++}}var WasmBuffer=class{constructor(A,w,Q,B){this.wasmModule=A,this.numElements=w,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,w;this.heapArray&&((w=(A=this.wasmModule)._free)==null||w.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,w){const B=w*4,C=A._malloc(B),I=C/4,E=A.HEAP32.subarray(I,I+w);return new WasmBuffer(A,w,C,E)}function createFloat64WasmBuffer(A,w){const B=w*8,C=A._malloc(B),I=C/8,E=A.HEAPF64.subarray(I,I+w);return new WasmBuffer(A,w,C,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function w(Q){return A.cwrap(Q,"number",[])()}this.startTime=w("getInitialTime"),this.endTime=w("getFinalTime"),this.saveFreq=w("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var w,Q,B,C,I,E,o;const K=A.getLookups();if(K!==void 0)for(const n of K){const N=n.varRef.varSpec,y=((w=N.subscriptIndices)==null?void 0:w.length)||0;let d;y>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<y)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,y)),this.lookupSubIndicesBuffer.getArrayView().set(N.subscriptIndices),d=this.lookupSubIndicesBuffer.getAddress()):d=0;let F,m;if(n.points){const H=n.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<H)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,H)),this.lookupDataBuffer.getArrayView().set(n.points),F=this.lookupDataBuffer.getAddress(),m=H/2}else F=0,m=0;const c=N.varIndex;this.wasmSetLookup(c,d,F,m)}A.copyInputs((C=this.inputsBuffer)==null?void 0:C.getArrayView(),n=>{var N;return(N=this.inputsBuffer)==null||N.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,n),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),n=>{var N;return(N=this.outputIndicesBuffer)==null||N.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,n),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const a=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<a)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,a));const G=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(G);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,w,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(w=this.outputsBuffer)==null||w.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,C;Q.ready=new Promise(function(g,D){B=g,C=D}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_animal_food_supply_kcal_capita_day","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_average_caloric_availability_per_capita_per_day","_average_caloric_consumption_per_capita_per_day","_average_total_daily_calorie_intake","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_desired_food_production_in_calories_per_capita_per_day","_desired_food_production_in_tonnes_animal","_desired_food_production_in_tonnes_plant","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_effect_of_pricing_on_caloric_distribution","_effective_food_demand_per_capita_per_day","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_food_shortage_in_tonnes_animal","_food_shortage_in_tonnes_plant","_food_supply_in_tonnes_animal","_food_supply_in_tonnes_plant","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_allocated_for_animal_calories","_land_allocated_for_energy_crops","_land_allocated_for_food_crops","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen_leaching_and_runoff_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus_erosion_leaching_and_runoff_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_supply_demand_ratio_for_food","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_animal_food_production","_total_annual_caloric_demand_from_alternative_proteins","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_daily_calorie_supply_per_capita","_total_feedstock_alternative_proteins","_total_feedstock_production","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_plant_food_production","_total_vegetarians","_vegetal_food_supply_kcal_capita_day","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function a(g){return Q.locateFile?Q.locateFile(g,i):i+g}var G,O;(o||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(g){try{var D=new XMLHttpRequest;return D.open("GET",g,!1),D.responseType="arraybuffer",D.send(null),new Uint8Array(D.response)}catch(e){var s=wA(g);if(s)return s;throw e}}),G=function(g,D,s){var e=new XMLHttpRequest;e.open("GET",g,!0),e.responseType="arraybuffer",e.onload=function(){if(e.status==200||e.status==0&&e.response){D(e.response);return}var u=wA(g);if(u){D(u.buffer);return}s()},e.onerror=s,e.send(null)});var n=Q.print||console.log.bind(console),N=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var y;Q.wasmBinary&&(y=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&V("no native wasm support detected");var d,F=!1;function m(g,D){g||V("Assertion failed: "+D)}function c(g){var D=Q["_"+g];return m(D,"Cannot call unknown function "+g+", make sure it is exported"),D}function H(g,D,s,e,u){var z={string:function(L){var T=0;if(L!=null&&L!==0){var eA=(L.length<<2)+1;T=gA(eA),P(L,T,eA)}return T},array:function(L){var T=gA(L.length);return t(L,T),T}};function k(L){return D==="string"?l(L):D==="boolean"?!!L:L}var r=c(g),f=[],b=0;if(e)for(var J=0;J<e.length;J++){var rA=z[s[J]];rA?(b===0&&(b=sA()),f[J]=rA(e[J])):f[J]=e[J]}var IA=r.apply(null,f);function ZA(L){return b!==0&&KA(b),k(L)}return IA=ZA(IA),IA}function U(g,D,s,e){s=s||[];var u=s.every(function(k){return k==="number"}),z=D!=="string";return z&&u&&!e?c(g):function(){return H(g,D,s,arguments)}}var h=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function Z(g,D,s){for(var e=D+s,u=D;g[u]&&!(u>=e);)++u;if(u-D>16&&g.subarray&&h)return h.decode(g.subarray(D,u));for(var z="";D<u;){var k=g[D++];if(!(k&128)){z+=String.fromCharCode(k);continue}var r=g[D++]&63;if((k&224)==192){z+=String.fromCharCode((k&31)<<6|r);continue}var f=g[D++]&63;if((k&240)==224?k=(k&15)<<12|r<<6|f:k=(k&7)<<18|r<<12|f<<6|g[D++]&63,k<65536)z+=String.fromCharCode(k);else{var b=k-65536;z+=String.fromCharCode(55296|b>>10,56320|b&1023)}}return z}function l(g,D){return g?Z(Y,g,D):""}function M(g,D,s,e){if(!(e>0))return 0;for(var u=s,z=s+e-1,k=0;k<g.length;++k){var r=g.charCodeAt(k);if(r>=55296&&r<=57343){var f=g.charCodeAt(++k);r=65536+((r&1023)<<10)|f&1023}if(r<=127){if(s>=z)break;D[s++]=r}else if(r<=2047){if(s+1>=z)break;D[s++]=192|r>>6,D[s++]=128|r&63}else if(r<=65535){if(s+2>=z)break;D[s++]=224|r>>12,D[s++]=128|r>>6&63,D[s++]=128|r&63}else{if(s+3>=z)break;D[s++]=240|r>>18,D[s++]=128|r>>12&63,D[s++]=128|r>>6&63,D[s++]=128|r&63}}return D[s]=0,s-u}function P(g,D,s){return M(g,Y,D,s)}function t(g,D){q.set(g,D)}var q,Y,j;function S(g){Q.HEAP8=q=new Int8Array(g),Q.HEAP16=new Int16Array(g),Q.HEAP32=j=new Int32Array(g),Q.HEAPU8=Y=new Uint8Array(g),Q.HEAPU16=new Uint16Array(g),Q.HEAPU32=new Uint32Array(g),Q.HEAPF32=new Float32Array(g),Q.HEAPF64=new Float64Array(g)}Q.INITIAL_MEMORY;var _,$=[],x=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)PA(Q.preRun.shift());CA($)}function kA(){CA(x)}function GA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)cA(Q.postRun.shift());CA(p)}function PA(g){$.unshift(g)}function aA(g){x.unshift(g)}function cA(g){p.unshift(g)}var v=0,W=null;function HA(g){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function nA(g){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&W){var D=W;W=null,D()}}Q.preloadedImages={},Q.preloadedAudios={};function V(g){Q.onAbort&&Q.onAbort(g),g="Aborted("+g+")",N(g),F=!0,g+=". Build with -s ASSERTIONS=1 for more info.";var D=new WebAssembly.RuntimeError(g);throw C(D),D}var EA="data:application/octet-stream;base64,";function BA(g){return g.startsWith(EA)}function oA(g){return g.startsWith("file://")}var R;R="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAAAYAF8AXxgA39/fwBgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAR/f39/AGADf35/AX4CHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADPDsOAgIEDxACCwUFBAERAgYAEgYTAAMBAQAACgIEAwcFCAMFAAYDCwIEAwQDCQkACBQVCAABFgABBwwFCQQFAXABBwcFBgEBgAKAAgYJAX8BQdC/zgILBzUNAWYCAAFnACEBaAA1AWkAMQFqADABawA/AWwAPgFtADcBbgA2AW8BAAFwADQBcQAzAXIAMgkMAQBBAQsGOjg5PTw7CpuXDzvBBQILfwF8IwBBEGsiBiQAAkBB4LQOKAIAIgIEQCACQei0DigCACIBQey0DigCAGxBA3RqQfC0DigCAEEDdGogADkDAEHotA4gAUEBajYCAAwBC0HYtA4oAgAiAUUEQAJ/QZCYBisDAEG40gYrAwChQZDSBysDAKMQICIMmUQAAAAAAADgQWMEQCAMqgwBC0GAgICAeAshAUHYtA5BgAgoAgAgAUEBamxBDmxBAXIQFCIBNgIACyAGIAA5AwAgAUHctA4oAgBqIQUjAEEQayIHJAAgByAGNgIMIwBBoAFrIgQkACAEQQhqIgFBwCdBkAEQDSAEIAU2AjQgBCAFNgIcIARBfiAFayICQQ8gAkEPSRsiCDYCOCAEIAUgCGoiAjYCJCAEIAI2AhgjAEHQAWsiAyQAIAMgBjYCzAEgA0GgAWoiAkEAQSgQEBogAyADKALMATYCyAECQEEAIANByAFqIANB0ABqIAIQHkEASARAQX8hAQwBCyABKAJMQQBOIQogASgCACECIAEsAEpBAEwEQCABIAJBX3E2AgALIAJBIHEhCwJ/IAEoAjAEQCABIANByAFqIANB0ABqIANBoAFqEB4MAQsgAUHQADYCMCABIANB0ABqIgI2AhAgASADNgIcIAEgAzYCFCABKAIsIQkgASADNgIsIAEgA0HIAWogAiADQaABahAeIgUgCUUNABogAUEAQQAgASgCJBEBABogAUEANgIwIAEgCTYCLCABQQA2AhwgAUEANgIQIAEoAhQhAiABQQA2AhQgBUF/IAIbCyECIAEgASgCACIBIAtyNgIAQX8gAiABQSBxGyEBIApFDQALIANB0AFqJAAgASECIAgEQCAEKAIcIgEgASAEKAIYRmtBADoAAAsgBEGgAWokACAHQRBqJABB3LQOQdy0DigCACACajYCAAsgBkEQaiQAC0MAIAAgACABpCABvUL///////////8Ag0KAgICAgICA+P8AVhsgASAAvUL///////////8Ag0KAgICAgICA+P8AWBsLQwAgACAAIAGlIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwuvAwMCfAJ/AX4gAL0iBUI/iKchAwJAAkACfAJAIAACfwJAAkAgBUIgiKdB/////wdxIgRBq8aYhARPBEAgAL1C////////////AINCgICAgICAgPj/AFYEQCAADwsgAETvOfr+Qi6GQGQEQCAARAAAAAAAAOB/og8LIABE0rx63SsjhsBjRSAARFEwLdUQSYfAY0VyDQEMBgsgBEHD3Nj+A0kNAyAEQbLFwv8DSQ0BCyAARP6CK2VHFfc/oiADQQN0QfAMaisDAKAiAJlEAAAAAAAA4EFjBEAgAKoMAgtBgICAgHgMAQsgA0UgA2sLIgO3IgFEAADg/kIu5r+ioCIAIAFEdjx5Ne856j2iIgKhDAELIARBgIDA8QNNDQJBACEDIAALIQEgACABIAEgASABoiIAIAAgACAAIABE0KS+cmk3Zj6iRPFr0sVBvbu+oKJELN4lr2pWET+gokSTvb4WbMFmv6CiRD5VVVVVVcU/oKKhIgCiRAAAAAAAAABAIAChoyACoaBEAAAAAAAA8D+gIQEgA0UNACABIAMQEyEBCyABDwsgAEQAAAAAAADwP6AL5wECA38CfET////////v/yEFAkACQCAARQ0AIAAoAgQiA0UNACADQQF0IQMgACgCACEEIAEgACsDKGYEQCAAKAIwIQILIAIgA0kEQANAIAEgBCACQQN0aisDACIFZQRAIAAgAjYCMCAAIAE5AyggAkEAIAEgBWIbRQ0EIAJBA3QgBGoiAEEIaysDACIGIAEgAEEQaysDACIBoSAAKwMIIAahIAUgAaGjoqAPCyACQQJq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BjkDAEHwog5BgKEIKwMAQfD3DCsDAKI5AwBBmKQOQaiiCCsDAEGY+QwrAwCiOQMAQeiiDkH4oAgrAwBB6PcMKwMAojkDAEGQpA5BoKIIKwMAQZD5DCsDAKI5AwBB4KIOQfCgCCsDAEHg9wwrAwCiOQMAQYikDkGYoggrAwBBiPkMKwMAojkDAEHYog5B6KAIKwMAQdj3DCsDAKI5AwBBgKQOQZCiCCsDAEGA+QwrAwCiOQMAQdCiDkHgoAgrAwBB0PcMKwMAojkDAEH4ow5BiKIIKwMAQfj4DCsDAKI5AwBByKIOQdigCCsDAEHI9wwrAwCiOQMAQfCjDkGAoggrAwBB8PgMKwMAojkDAEHAog5B0KAIKwMAQcD3DCsDAKI5AwBB6KMOQfihCCsDAEHo+AwrAwCiOQMAQbiiDkHIoAgrAwBBuPcMKwMAojkDAEHgow5B8KEIKwMAQeD4DCsDAKI5AwBBsKIOQcCgCCsDAEGw9wwrAwCiOQMAQdijDkHooQgrAwBB2PgMKwMAojkDAEGoog5BuKAIKwMAQaj3DCsDAKI5AwBB0KMOQeChCCsDAEHQ+AwrAwCiOQMAQaCiDkGwoAgrAwBBoPcMKwMAojkDAEHIow5B2KEIKwMAQcj4DCsDAKI5AwBBmKIOQaigCCsDAEGY9wwrAwCiOQMAQcCjDkHQoQgrAwBBwPgMKwMAojkDAEGQog5BoKAIKwMAQZD3DCsDAKI5AwBBuKMOQcihCCsDAEG4+AwrAwCiOQMAQYiiDkGYoAgrAwBBiPcMKwMAojkDAEGwow5BwKEIKwMAQbD4DCsDAKI5AwBBgKIOQZCgCCsDAEGA9wwrAwCiOQMAQaijDkG4oQgrAwBBqPgMKwMAojkDAEHQpQ5BwJYIKwMAQYD4DCsDAKI5AwBB+KYOQeiXCCsDAEGo+QwrAwCiOQMAQcilDkG4lggrAwBB+PcMKwMAojkDAEHwpg5B4JcIKwMAQaD5DCsDAKI5AwBBwKUOQbCWCCsDAEHw9wwrAwCiOQMAQeimDkHYlwgrAwBBmPkMKwMAojkDAEG4pQ5BqJYIKwMAQej3DCsDAKI5AwBB4KYOQdCXCCsDAEGQ+QwrAwCiOQMAQbClDkGglggrAwBB4PcMKwMAojkDAEHYpg5ByJcIKwMAQYj5DCsDAKI5AwBBqKUOQZiWCCsDAEHY9wwrAwCiOQMAQaClDkGQlggrAwBB0PcMKwMAojkDAEGYpQ5BiJYIKwMAQcj3DCsDAKI5AwBB0KYOQcCXCCsDAEGA+QwrAwCiOQMAQcimDkG4lwgrAwBB+PgMKwMAojkDAEHApg5BsJcIKwMAQfD4DCsDAKI5AwBBkKUOQYCWCCsDAEHA9wwrAwCiOQMAQbimDkGolwgrAwBB6PgMKwMAojkDAEGIpQ5B+JUIKwMAQbj3DCsDAKI5AwBBsKYOQaCXCCsDAEHg+AwrAwCiOQMAQYClDkHwlQgrAwBBsPcMKwMAojkDAEGopg5BmJcIKwMAQdj4DCsDAKI5AwBB+KQOQeiVCCsDAEGo9wwrAwCiOQMAQaCmDkGQlwgrAwBB0PgMKwMAojkDAEHwpA5B4JUIKwMAQaD3DCsDAKI5AwBBmKYOQYiXCCsDAEHI+AwrAwCiOQMAQeikDkHYlQgrAwBBmPcMKwMAojkDAEGQpg5BgJcIKwMAQcD4DCsDAKI5AwBB4KQOQdCVCCsDAEGQ9wwrAwCiOQMAQYimDkH4lggrAwBBuPgMKwMAojkDAEHYpA5ByJUIKwMAQYj3DCsDAKI5AwBBgKYOQfCWCCsDAEGw+AwrAwCiOQMAQdCkDkHAlQgrAwBBgPcMKwMAojkDAEH4pQ5B6JYIKwMAQaj4DCsDAKI5AwBByKQOQbiVCCsDAEH49gwrAwCiOQMAQfClDkHglggrAwBBoPgMKwMAojkDAEGgqA5B8JsIKwMAQYD4DCsDAKI5AwBByKkOQZidCCsDAEGo+QwrAwCiOQMAQZioDkHomwgrAwBB+PcMKwMAojkDAEHAqQ5BkJ0IKwMAQaD5DCsDAKI5AwBBkKgOQeCbCCsDAEHw9wwrAwCiOQMAQbipDkGInQgrAwBBmPkMKwMAojkDAEGIqA5B2JsIKwMAQej3DCsDAKI5AwBBsKkOQYCdCCsDAEGQ+QwrAwCiOQMAQYCoDkHQmwgrAwBB4PcMKwMAojkDAEGoqQ5B+JwIKwMAQYj5DCsDAKI5AwBB+KcOQcibCCsDAEHY9wwrAwCiOQMAQaCpDkHwnAgrAwBBgPkMKwMAojkDAEHwpw5BwJsIKwMAQdD3DCsDAKI5AwBBmKkOQeicCCsDAEH4+AwrAwCiOQMAQeinDkG4mwgrAwBByPcMKwMAojkDAEGQqQ5B4JwIKwMAQfD4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wQA3AwBBoPAFQoCAgICAgID4PzcDAEGY8AVCgICAgICAgPg/NwMAQYjwBUKAgICAgIDgsMAANwMAQYDwBUKAgICAgIDgwsAANwMAQfjvBUKAgICAgIDo08AANwMAQfDvBUKAgICAgOD04sAANwMAQejvBUKAgICAgKCK8sAANwMAQeDvBUKAgICAgIyi/sAANwMAQdjvBUKAgICAwNigicEANwMAQdDvBUKAgICAoP6VksEANwMAQcjvBUKAgICAgPvNmcEANwMAQcDvBUKAgICAoMfJnsEANwMAQbjvBUKAgICAgPSIosEANwMAQbDvBUKAgICA4MmupcEANwMAQajvBUKAgICA+NPGqMEANwMAQaDvBUKAgICAwKzMqsEANwMAQZjvBUKAgICAoP3grMEANwMAQZDvBUKAgICA+Ob8rsEANwMAQYjvBUKAgICAwP3ksMEANwMAQYDvBUKAgICAoLqLssEANwMAQfjuBUKAgICA4Iaus8EANwMAQfDuBUKAgICAgICA+D83AwBBuPEFQoCAgICAgID4PzcDAEGo8gVCgICAgICA3PfAADcDAEGg8gVCgICAgIDM0YDBADcDAEGY8gVCgICAgIC3lIjBADcDAEGQ8gVCgICAgICUsIzBADcDAEGI8gVCgICAgKC+xpDBADcDAEGA8gVCgICAgODGrJPBADcDAEH48QVCgICAgMCJw5bBADcDAEHw8QVCgICAgIDh/5jBADcDAEHo8QVCgICAgMDU6prBADcDAEHg8QVCgICAgMDW25zBADcDAEHY8QVCgICAgODJ9p7BADcDAEHQ8QVCgICAgICAgPg/NwMAQcjxBUKAgICAgICA+D83AwBBwPEFQoCAgICAgID4PzcDAEGw8QVCgICAgICAqLHAADcDAEGo8QVCgICAgICAtMPAADcDAEGg8QVCgICAgICAxdTAADcDAEGY8QVCgICAgIDQyuPAADcDAEGQ8QVCgICAgIDE2fLAADcDAEGI8QVCgICAgICokv/AADcDAEGA8QVCgICAgIC/6YnBADcDAEH48AVCgICAgOD+5ZLBADcDAEHw8AVCgICAgODEmZrBADcDAEHo8AVCgICAgICZvJ/BADcDAEHg8AVCgICAgMCN2KLBADcDAEHY8AVCgICAgODYl6bBADcDAEHQ8AVCgICAgPj1ianBADcDAEHI8AVCgICAgPjYn6vBADcDAEHA8AVCgICAgKipxa3BADcDAEGI9AVCgICAgICAgPg/NwMAQYD0BUKAgICAgIDIvcAANwMAQfjzBUKAgICAgMCr0MAANwMAQfDzBUKAgICAgKCV4cAANwMAQejzBUKAgICAgOy78MAANwMAQeDzBUKAgICAgLTS/8AANwMAQdjzBUKAgICAgIKJi8EANwMAQdDzBUKAgICAoM2ulsEANwMAQcjzBUKAgICAoNHkn8EANwMAQcDzBUKAgICAwOz0psEANwMAQbjzBUKAgICA6NGnq8EANwMAQbDzBUKAgICAwKrQr8EANwMAQajzBUKAgICA2LCvssEANwMAQaDzBUKAgICA2O6itcEANwMAQZjzBUKAgICAqMCcuMEANwMAQZDzBUKAgICA8JTzucEANwMAQYjzBUKAgICAwLPPu8EANwMAQYDzBUKAgICA9PbRvcEANwMAQfjyBUKAgICAnIDtwMEANwMAQfDyBUKAgICAluqBxcEANwMAQejyBUKAgICAj93SycEANwMAQeDyBUKAgICAmrmJy8EANwMAQdjyBUKAgICAgICAn8AANwMAQdDyBUKAgICAgICQscAANwMAQcjyBUKAgICAgICEwsAANwMAQcDyBUKAgICAgICi0cAANwMAQbjyBUKAgICAgNDH4MAANwMAQbDyBUKAgICAgNiO7MAANwMAQZj0BUKAgICAiP+euMEANwMAQZD0BUKAgICAgICA+D83AwBBsPUFQoCAgICAgID4PzcDAEGI9gVCgICAgMCy/aDBADcDAEGA9gVCgICAgMCctKTBADcDAEH49QVCgICAgND0najBADcDAEHw9QVCgICAgNjuxKrBADcDAEHo9QVCgICAgICqh63BADcDAEHg9QVCgICAgMiZ3K/BADcDAEHY9QVCgICAgPT7nLHBADcDAEHQ9QVCgICAgMCd6rLBADcDAEHI9QVCgICAgKivt7TBADcDAEHA9QVCgICAgICAgPg/NwMAQbj1BUKAgICAgICA+D83AwBBqPUFQoCAgICAgNi0wAA3AwBBoPUFQoCAgICAgMzHwAA3AwBBmPUFQoCAgICAoMnYwAA3AwBBkPUFQoCAgICA8OrnwAA3AwBBiPUFQoCAgICApND2wAA3AwBBgPUFQoCAgICA+KyCwQA3AwBB+PQFQoCAgICAkLeNwQA3AwBB8PQFQoCAgICgquGWwQA3AwBB6PQFQoCAgICA5/idwQA3AwBB4PQFQoCAgIDwyMmiwQA3AwBB2PQFQoCAgICArc6mwQA3AwBB0PQFQoCAgIDgj9mpwQA3AwBByPQFQoCAgICwvLSswQA3AwBBwPQFQoCAgIDwm7CvwQA3AwBBuPQFQoCAgIDw6KCxwQA3AwBBsPQFQoCAgIDQ3+6ywQA3AwBBqPQFQoCAgICgvOC0wQA3AwBBoPQFQoCAgIDYh9K2wQA3AwBB2PYFQoCAgICAgID4PzcDAEH49wVCgICAgICAwKDAADcDAEHw9wVCgICAgICA0LLAADcDAEHo9wVCgICAgICA0sPAADcDAEHg9wVCgICAgIDA4NLAADcDAEHY9wVCgICAgIDw9+HAADcDAEHQ9wVCgICAgICQiO7AADcDAEHI9wVCgICAgIDsj/nAADcDAEHA9wVCgICAgIC9g4LBADcDAEG49wVCgICAgIC8vInBADcDAEGw9wVCgICAgMCEr47BADcDAEGo9wVCgICAgIDK9pHBADcDAEGg9wVCgICAgOCglpXBADcDAEGY9wVCgICAgOCLt5jBADcDAEGQ9wVCgICAgOCHuZrBADcDAEGI9wVCgICAgODgyZzBADcDAEGA9wVCgICAgMDG4Z7BADcDAEH49gVCgICAgID+1KDBADcDAEHw9gVCgICAgICAgPg/NwMAQej2BUKAgICAgICA+D83AwBB4PYFQoCAgICAgID4PzcDAEHQ9gVCgICAgICA4LLAADcDAEHI9gVCgICAgICAoMXAADcDAEHA9gVCgICAgICAx9bAADcDAEG49gVCgICAgICQueXAADcDAEGw9gVCgICAgIDwtfTAADcDAEGo9gVCgICAgICL5YDBADcDAEGg9gVCgICAgIDos4vBADcDAEGY9gVCgICAgOCrxJTBADcDAEGQ9gVCgICAgIDL65vBADcDAEGI+AVC5syZs+bMmfM/NwMAQYD4BULJpJLJpJLJ/D83AwBByPgFQrPmzJmz5szxPzcDAEHA+AVCs+bMmbPmzOk/NwMAQbj4BUKAgICAgICA9D83AwBBsPgFQs2Zs+bMmbP6PzcDAEHQ+AVC5syZs+bMmfc/NwMAQYj6BUKAgIDAgYv22MEANwMAQaj7BUKAgICAgPK2gMEANwMAQaD7BUKAgICAgLekmMEANwMAQZj7BUKAgICAuNLaqcEANwMAQZD7BUKAgICA0MbltcEANwMAQYj7BUKAgICAwKzGvMEANwMAQYD7BUKAgICA4oSbw8EANwMAQfj6BUKAgICAyrHWx8EANwMAQfD6BUKAgICA643PycEANwMAQej6BUKAgICArum/y8EANwMAQeD6BUKAgICA/ozHzMEANwMAQdj6BUKAgICAwNjxz8EANwMAQdD6BUKAgICA7Jr30cEANwMAQcj6BUKAgICAqaSG08EANwMAQcD6BUKAgICAj4HX1MEANwMAQbj6BUKAgICA8s2D1sEANwMAQbD6BUKAgICAwdjm1sEANwMAQaj6BUKAgICAz5SJ18EANwMAQaD6BUKAgICA6Yit2MEANwMAQZj6BUKAgIDAr6WE2cEANwMAQZD6BUKAgIDAtrLx2MEANwMAQej4BUKAgICAmca62cEANwMAQeD4BUKAgICA+67F2cEANwMAQYD6BUKAgICAgLCJ78AANwMAQfj5BUKAgICAgJWXicEANwMAQfD5BUKAgICA4JyhnsEANwMAQej5BUKAgICAyJiZrcEANwMAQeD5BUKAgICA8LCVt8EANwMAQdj5BUKAgICAgNjUv8EANwMAQdD5BUKAgICAxujbxMEANwMAQcj5BUKAgICArITDyMEANwMAQcD5BUKAgICAo9PeysEANwMAQbj5BUKAgICApuCZzMEANwMAQbD5BUKAgICAiq/bz8EANwMAQaj5BUKAgICA4J730cEANwMAQaD5BUKAgICAupWX08EANwMAQZj5BUKAgICA9tL21MEANwMAQZD5BUKAgICA2r+01sEANwMAQYj5BUKAgICA5Ymm18EANwMAQYD5BUKAgICAieLY18EANwMAQfj4BUKAgIDA8Kjg2MEANwMAQfD4BUKAgICAq5/F2cEANwMAQbD7BUKAgICAgICA+D83AwBByP0FQp+Kro+F18f4PzcDAEHA/QVCn4quj4XXx/g/NwMAQbj9BUKfiq6PhdfH+D83AwBBsP0FQp+Kro+F18f4PzcDAEGo/QVCn4quj4XXx/g/NwMAQaD9BUKAgICAgICA+D83AwBBmP0FQoCAgICAgID4PzcDAEGQ/QVCgICAgICAgPg/NwMAQYj9BUKAgICAgICA+D83AwBBgP0FQoCAgICA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5syZs+bkPzcDAEGQigZCgICAgICAgPg/NwMAQZiKBkKAgICgsI29ksIANwMAQaCKBkKAgICAgIDaz8AANwMAQdiLBkKAgICAgID7ycAANwMAQfiMBkKAgICAgID4zsAANwMAQfCMBkKAgICAgID4zsAANwMAQeiMBkKAgICAgID4zsAANwMAQeCMBkKAgICAgID4zsAANwMAQdiMBkKAgICAgID4zsAANwMAQdCMBkKAgICAgID4zsAANwMAQciMBkKAgICAgID4zsAANwMAQcCMBkKAgICAgID4zsAANwMAQbiMBkKAgICAgID4zsAANwMAQbCMBkKAgICAgID4zsAANwMAQaiMBkKAgICAgID4zsAANwMAQaCMBkKAgICAgMCm0MAANwMAQZiMBkKAgICAgMCm0MAANwMAQZCMBkKAgICAgMCm0MAANwMAQYiMBkKAgICAgMCm0MAANwMAQYCMBkKAgICAgMCm0MAANwMAQfiLBkKAgICAgMCQ0cAANwMAQfCLBkKAgICAgMC70MAANwMAQeiLBkKAgICAgID4z8AANwMAQeCLBkKAgICAgIDPzMAANwMAQcCKBkKAgICAgIDm0MAANwMAQbiKBkKAgICAgICkzcAANwMAQbCKBkKAgICAgIDCysAANwMAQdCLBkKAgICAgMCQ0cAANwMAQciLBkKAgICAgMCQ0cAANwMAQcCLBkKAgICAgMCQ0cAANwMAQbiLBkKAgICAgMCQ0cAANwMAQbCLBkKAgICAgMCQ0cAANwMAQaiLBkKAgICAgMCQ0cAANwMAQaCLBkKAgICAgMCQ0cAANwMAQZiLBkKAgICAgMCQ0cAANwMAQZCLBkKAgICAgMD60cAANwMAQYiLBkKAgICAgMD60cAANwMAQYCLBkKAgICAgMD60cAANwMAQfiKBkKAgICAgMD60cAANwMAQfCKBkKAgICAgIDl0sAANwMAQeiKBkKAgICAgIDl0sAANwMAQeCKBkKAgICAgIDl0sAANwMAQdiKBkKAgICAgIDl0sAANwMAQdCKBkKAgICAgIDP08AANwMAQciKBkKAgICAgIC608AANwMAQYCNBkKAgICAgICA+D83AwBBiI0GQoCAgICAgID4PzcDAEGQjQZCgICAgICAgPg/NwMAQZiNBkKas+bMmbPm9D83AwBBoI0GQgA3AwBB4I0G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xpfdyZiI8j83AwBB8NQGQtTGl93JmIjyPzcDAEHo1AZC1MaX3cmYiPI/NwMAQeDUBkLUxpfdyZiI8j83AwBB4NUGQoCAgICAgICAwAA3AwBB6NUGQgA3AwBB8NUGQoiHnamWgP/NPjcDAEH41QZCgICAzPf99MLCADcDAEGA1gZCgICAgICA4LDAADcDAEGI1gZCmrPmzJmz5tw/NwMAQZDWBkKAgICAwPD1w8EANwMAQZjWBkKAgICAgICAhMAANwMAQaDWBkKz5syZs+bM+T83AwBBqNYGQoCAgICAgICOwAA3AwBBsNYGQri9lNyeiq7HPzcDAEHA1gZCADcDAEG41gZCzZmz5syZs+4/NwMAQcjWBkKAgIDgrJDnlMIANwMAQdDWBkKAgICAgICewMAANwMAQdjWBkKAgICAgJChj8EANwMAQYjYBkKAgICAmPSAzsEANwMAQajZBkKAgICAgICsyMAANwMAQaDZBkKAgICAgKCg2sAANwMAQZjZBkKAgICAgMCi68AANwMAQZDZBkKAgICAgL60+sAANwMAQYjZBkKAgICAgPHOicEANwMAQYDZBkKAgICA4IrOlcEANwMAQfjYBkKAgICAsJjqoMEANwMAQfDYBkKAgICAmIvaqcEANwMAQejYBkKAgICA3K+VscEANwMAQeDYBkKAgICAoN7ztcEANwMAQdjYBkKAgICA7M3NucEANwMAQdDYBkKAgICAoPHfvMEANwMAQcjYBkKAgICA9qWUwMEANwMAQcDYBkKAgICAsvmNwsEANwMAQbjYBkKAgICAiu2VxMEANwMAQbDYBkKAgICApM+kxsEANwMAQajYBkKAgICA7ZyxyMEANwMAQaDYBkKAgICA4YXQycEANwMAQZjYBkKAgICA1ZPrysEANwMAQZDYBkKAgICAmuSZzMEANwMAQfjWBkKAgICAgcndycEANwMAQfDWBkKAgICA8bD6ysEANwMAQejWBkKAgICAwveqzMEANwMAQeDWBkKAgICA3MuUzsEANwMAQYDYBkKAgICAgIC3yMAANwMAQfjXBkKAgICAgOCu2sAANwMAQfDXBkKAgICAgKiy68AANwMAQejXBkKAgICAgI7D+sAANwMAQeDXBkKAgICAgLPcicEANwMAQdjXBkKAgICA4JrhlcEANwMAQdDXBkKAgICAwMz2oMEANwMAQcjXBkKAgICAwNznqcEANwMAQcDXBkKAgICA0KCiscEANwMAQbjXBkKAgICAoKKHtsEANwMAQbDXBkKAgICA/I3bucEANwMAQajXBkKAgICAnObxvMEANwMAQaDXBkKAgICAwOGfwMEANwMAQZjXBkKAgICA4JOcwsEANwMAQZDXBkKAgICAkvqmxMEANwMAQYjXBkKAgICAmtm4xsEANwMAQYDXBkKAgICAh4G9yMEANwMAQcjbBkKAgICAoPeNkMEANwMAQcDbBkKAgICA4Nj0mMEANwMAQbjbBkKAgICAoMu1oMEANwMAQbDbBkKAgICAgLripMEANwMAQajbBkKAgICA8J3pqMEANwMAQaDbBkKAgICA2NXaq8EANwMAQZjbBkKAgICAyIz+rsEANwMAQZDbBkKAgICAlKmkscEANwMAQYjbBkKAgICAyNaWs8EANwMAQYDbBkKAgICAoKyPtcEANwMAQfjaBkKAgICAmJ2zt8EANwMAQfDaBkKAgICAkLzruMEANwMAQejaBkKAgICA3PX5ucEANwMAQdDaBkKKro+F14eRu8AANwMAQcjaBkL20fD6qLjUzcAANwMAQcDaBkKk4fXR8LqC38AANwMAQbjaBkLmzJmz5uDv7cAANwMAQbDaBkKAgICAgKzo/MAANwMAQajaBkKAgICAwOaIicEANwMAQaDaBkKAgICAoJTik8EANwMAQZjaBkKAgICAgKP3nMEANwMAQZDaBkKAgICAsNqbpMEANwMAQYjaBkKAgICA4PGhqcEANwMAQYDaBkKAgICA8NLmrMEANwMAQfjZBkKAgICAuK+/sMEANwMAQfDZBkKAgICA+NfvssEANwMAQejZBkKAgICA8LG8tcEANwMAQeDZBkKAgICAxIWOuMEANwMAQdjZBkKAgICApLvCucEANwMAQdDZBkKAgICAjJ+Wu8EANwMAQcjZBkKAgICAwPLpvMEANwMAQcDZBkKAgICAjM24vsEANwMAQfjbBkLNmbPmzJmqt8AANwMAQfDbBkLh9dHw+ui1ycAANwMAQejbBkKAgICAgNis2sAANwMAQeDbBkKAgICAgNzH6cAANwMAQdjbBkLmzJmz5rTq+MAANwMAQdDbBkKAgICAgPC/hMEANwMAQeDdBkKAgICAyKvtscEANwMAQdjdBkKAgICA2Mvus8EANwMAQdDdBkKAgICA0MX2tcEANwMAQcjdBkKAgICA+JaWuMEANwMAQcDdBkKAgICArP+wucEANwMAQZjdBkLmzJmz5qzNy8AANwMAQZDdBkKKro+F16fg3MAANwMAQYjdBkKAgICAgPDj68AANwMAQYDdBkKAgICAgPbw+sAANwMAQfjcBkKAgICAgLWzh8EANwMAQfDcBkKAgICA4Pv+kcEANwMAQejcBkKAgICAoMz9msEANwMAQeDcBkKAgICAwOqvosEANwMAQdjcBkKAgICA4IHep8EANwMAQdDcBkKAgICAuLzvqsEANwMAQcjcBkKAgICAwNm2rsEANwMAQcDcBkKAgICA+OGdscEANwMAQbjcBkKAgICAkKS4s8EANwMAQbDcBkKAgICA2PbitcEANwMAQajcBkKAgICAwNWKuMEANwMAQaDcBkKAgICAoMC+ucEANwMAQZjcBkKAgICA+JzyusEANwMAQcjeBkLk9vz+1LGRuMAANwMAQcDeBkKKro+F1+f/ycAANwMAQbjeBkKF18fC65v+2sAANwMAQbDeBkLmzJmz5vSS6sAANwMAQajeBkKAgICAgO+v+cAANwMAQaDeBkKAgICAgJiihcEANwMAQZjeBkKAgICAoNvNkMEANwMAQZDeBkKAgICAoOW6mcEANwMAQYjeBkKAgICA8Ob3oMEANwMAQYDeBkKAgICAgPHGpcEANwMAQfjdBkKAgICA4M+uqcEANwMAQfDdBkKAgICAmOG2rMEANwMAQejdBkKAgICAkPvzr8EANwMAQaDdBkLh9dHw+ui1ucAANwMAQcjfBkKz5syZs46p9MAANwMAQcDfBkKAgICAgKz+/8AANwMAQbjfBkKAgICAgL3kiMEANwMAQbDfBkKAgICAoKKmkMEANwMAQajfBkKAgICAoJvLlMEANwMAQaDfBkKAgICAoJbZmMEANwMAQZjfBkKAgICAwK7Fm8EANwMAQZDfBkKAgICAgOninsEANwMAQYjfBkKAgICAwLaTocEANwMAQYDfBkKAgICA4KuCo8EANwMAQfjeBkKAgICAgLz3pMEANwMAQfDeBkKAgICAgJqXp8EANwMAQZjhBkK3koaC1pyCpcAANwMAQZDhBkLvpIyErPmAuMAANwMAQYjhBkL7qLi9lPzkyMAANwMAQYDhBkKpuL2U3P6O2MAANwMAQfjgBkLmzJmz5tz/5sAANwMAQfDgBkLNmbPmzMfO8sAANwMAQejgBkKAgICAgN7i/cAANwMAQeDgBkKAgICAgKKRh8EANwMAQdjgBkKAgICAgIumjsEANwMAQdDgBkKAgICAgPTrksEANwMAQcjgBkKAgICAgOb9lsEANwMAQcDgBkKAgICA4M34mcEANwMAQbjgBkKAgICAwOLcnMEANwMAQbDgBkKAgICAwJLin8EANwMAQajgBkKAgICAsPC+ocEANwMAQaDgBkKAgICA8IOSo8EANwMAQZjgBkKAgICAwPGJpcEANwMAQfDfBkLoorbn96eJp8AANwMAQejfBkKvupOxkLClucAANwMAQeDfBkLmzJmz5uyZysAANwMAQdjfBkLmzJmz5pS22cAANwMAQdDfBkLNmbPmzK3a6MAANwMAQaDhBkL7qLi9lNyewj83AwBB2OIGQoCAgICAgID4PzcDAEHQ4gZCgICAgICAgLHAADcDAEHI4gZCgICAgICAiMPAADcDAEHA4gZCgICAgIDAldTAADcDAEG44gZCgICAgIDAnuPAADcDAEGw4gZCgICAgIDssPLAADcDAEGo4gZCgICAgIDc2P7AADcDAEGg4gZCgICAgMCQxInBADcDAEGY4gZCgICAgID3vJLBADcDAEGQ4gZCgICAgODf8pnBADcDAEGI4gZCgICAgOCtgZ/BADcDAEGA4gZCgICAgLC6r6LBADcDAEH44QZCgICAgJDf4aXBADcDAEHw4QZCgICAgPCy56jBADcDAEHo4QZCgICAgND19KrBADcDAEHg4QZCgICAgJDpka3BADcDAEHY4QZCgICAgNiRtq/BADcDAEHQ4QZCgICAgNjQhrHBADcDAEHI4QZCgICAgIjjr7PBADcDAEHA4QZCgICAgPDr3bfBADcDAEG44QZCgICAgKjw0brBADcDAEGw4QZCgICAgJi1m7zBADcDAEHo4gZCgICAgJCy1aTBADcDAEHg4gZCgICAgICAgPg/NwMAQYDkBkKAgICAgICA+D83AwBB2OQGQoCAgICAhtCQwQA3AwBB0OQGQoCAgIDgx/WTwQA3AwBByOQGQoCAgICA0+iXwQA3AwBBwOQGQoCAgIDA0o+awQA3AwBBuOQGQoCAgICAssWcwQA3AwBBsOQGQoCAgICA6IyfwQA3AwBBqOQGQoCAgICAsO6gwQA3AwBBoOQGQoCAgIDwxLOiwQA3AwBBmOQGQoCAgIDgyvijwQA3AwBBkOQGQoCAgICAgID4PzcDAEGI5AZCgICAgICAgPg/NwMAQfjjBkKAgICAgIDgocAANwMAQfDjBkKAgICAgICAtMAANwMAQejjBkKAgICAgICWxcAANwMAQeDjBkKAgICAgMCV1MAANwMAQdjjBkKAgICAgOCe48AANwMAQdDjBkKAgICAgKD078AANwMAQcjjBkKAgICAgIap+sAANwMAQcDjBkKAgICAgOqrg8EANwMAQbjjBkKAgICAwMHbisEANwMAQbDjBkKAgICAgJGQkMEANwMAQajjBkKAgICAoJ+dk8EANwMAQaDjBkKAgICAwLnzlsEANwMAQZjjBkKAgICAwNLEmcEANwMAQZDjBkKAgICA4Lnom8EANwMAQYjjBkKAgICAwPWcnsEANwMAQYDjBkKAgICAsNqsoMEANwMAQfjiBkKAgICAgLrmocEANwMAQfDiBkKAgICA8Iugo8EANwMAQajlBkKAgICAgICA+D83AwBByOYGQoCAgICAgICQwAA3AwBBwOYGQoCAgICAgKCiwAA3AwBBuOYGQoCAgICAgJizwAA3AwBBsOYGQoCAgICAgKrCwAA3AwBBqOYGQoCAgICAwMXRwAA3AwBBoOYGQoCAgICAgMHdwAA3AwBBmOYGQoCAgICA4OHowAA3AwBBkOYGQoCAgICA7NDxwAA3AwBBiOYGQoCAgICA0Iz5wAA3AwBBgOYGQoCAgICAvOb9wAA3AwBB+OUGQoCAgICAucSBwQA3AwBB8OUGQoCAgICA3dOEwQA3AwBB6OUGQoCAgICAwoyIwQA3AwBB4OUGQoCAgIDAp4SKwQA3AwBB2OUGQoCAgIDAn4qMwQA3AwBB0OUGQoCAgICAgJeOwQA3AwBByOUGQoCAgIDAnamQwQA3AwBBwOUGQoCAgICAgID4PzcDAEG45QZCgICAgICAgPg/NwMAQbDlBkKAgICAgICA+D83AwBBoOUGQoCAgICAgKCiwAA3AwBBmOUGQoCAgICAgOC0wAA3AwBBkOUGQoCAgICAgP7FwAA3AwBBiOUGQoCAgICAgPXUwAA3AwBBgOUGQoCAgICAkPfjwAA3AwBB+OQGQoCAgICA2LjwwAA3AwBB8OQGQoCAgICAnPr6wAA3AwBB6OQGQoCAgICAhoWEwQA3AwBB4OQGQoCAgICA5a+LwQA3AwBB+OcGQoCAgICAgID4PzcDAEHw5wZCgICAgICAkK/AADcDAEHo5wZCgICAgICApsHAADcDAEHg5wZCgICAgIDAnNLAADcDAEHY5wZCgICAgIDQuOHAADcDAEHQ5wZCgICAgIC43PDAADcDAEHI5wZCgICAgICMrPzAADcDAEHA5wZCgICAgICNgYjBADcDAEG45wZCgICAgIDM5pDBADcDAEGw5wZCgICAgKCiqJjBADcDAEGo5wZCgICAgOCfzpzBADcDAEGg5wZCgICAgICj26DBADcDAEGY5wZCgICAgOCSyKPBADcDAEGQ5wZCgICAgKCx5qbBADcDAEGI5wZCgICAgIDRlanBADcDAEGA5wZCgICAgOD/hKvBADcDAEH45gZCgICAgLDL+qzBADcDAEHw5gZCgICAgODumq/BADcDAEHo5gZCgICAgNCz77HBADcDAEHg5gZCgICAgNDFwbbBADcDAEHY5gZCgICAgLDq4LrBADcDAEHQ5gZCgICAgIjKrLzBADcDAEG46AZCgICAgICl653BADcDAEGw6AZCgICAgJCvyaDBADcDAEGo6AZCgICAgKCXqaLBADcDAEGg6AZCgICAgODnjqTBADcDAEGY6AZCgICAgNCtnKbBADcDAEGQ6AZCgICAgLjvlKjBADcDAEGI6AZCgICAgPi0mKnBADcDAEGA6AZCgICAgICAgPg/NwMAQaDpBkKAgICAgICA+D83AwBBqOoGQoCAgICAgP/WwAA3AwBBoOoGQoCAgICA8OzlwAA3AwBBmOoGQoCAgICAyObxwAA3AwBBkOoGQoCAgICA6Nv8wAA3AwBBiOoGQoCAgICA/vyFwQA3AwBBgOoGQoCAgICAgpqNwQA3AwBB+OkGQoCAgICA14GSwQA3AwBB8OkGQoCAgIDAgeuVwQA3AwBB6OkGQoCAgICgmpeZwQA3AwBB4OkGQoCAgICAjeCbwQA3AwBB2OkGQoCAgICg18eewQA3AwBB0OkGQoCAgIDw8eGgwQA3AwBByOkGQoCAgICg8aSiwQA3AwBBwOkGQoCAgIDg4omkwQA3AwBBuOkGQoCAgIDgwu6lwQA3AwBBsOkGQoCAgICAgID4PzcDAEGo6QZCgICAgICAgPg/NwMAQZjpBkKAgICAgICgpsAANwMAQZDpBkKAgICAgIDYuMAANwMAQYjpBkKAgICAgIDHycAANwMAQYDpBkKAgICAgIDq2MAANwMAQfjoBkKAgICAgPCT6MAANwMAQfDoBkKAgICAgLTF88AANwMAQejoBkKAgICAgP78/sAANwMAQeDoBkKAgICAwLGdiMEANwMAQdjoBkKAgICAwJzGj8EANwMAQdDoBkKAgICAgK3lk8EANwMAQcjoBkKAgICA4OaSmMEANwMAQcDoBkKAgICAwPvnmsEANwMAQcjqBkKAgICAgICA+D83AwBB6OsGQoCAgICAgICSwAA3AwBB4OsGQoCAgICAgOCjwAA3AwBB2OsGQoCAgICAgIC1wAA3AwBB0OsGQoCAgICAgIDEwAA3AwBByOsGQoCAgICAwIrTwAA3AwBBwOsGQoCAgICAoNffwAA3AwBBuOsGQoCAgICAoJbqwAA3AwBBsOsGQoCAgICAmJfzwAA3AwBBqOsGQoCAgICAgsj6wAA3AwBBoOsGQoCAgICArIGAwQA3AwBBmOsGQoCAgICA6IiDwQA3AwBBkOsGQoCAgICAqtiGwQA3AwBBiOsGQoCAgIDApLOJwQA3AwBBgOsGQoCAgICA+dKLwQA3AwBB+OoGQoCAgIDAg4OOwQA3AwBB8OoGQoCAgICgwZ2QwQA3AwBB6OoGQoCAgICAz9SRwQA3AwBB4OoGQoCAgICAgID4PzcDAEHY6gZCgICAgICAgPg/NwMAQdDqBkKAgICAgICA+D83AwBBwOoGQoCAgICAgICkwAA3AwBBuOoGQoCAgICAgOC2wAA3AwBBsOoGQoCAgICAgI/IwAA3AwBB8OsGQoCAgICgmPuUwQA3AwBB+OsGQvzTxpfdyZioPzcDAEGA7AZCgICAgICAgITAADcDAEGI7AZC+6i4vZTcnto/NwMAQZDsBkKAgICAgICAisAANwMAQZjsBkKAgICAgICAisAANwMAQajsBkKAgICAgICAisAANwMAQaDsBkKAgICAgICAisAANwMAQbDsBkKAgICAgICAisAANwMAQdjsBkEAQTgQEBpB8O0GQs/vz5re9Kb6PzcDAEHo7QZCgICAgICAgPw/NwMAQbDwBkK4vZTcnrq828AANwMAQajwBkLNmbPmzMmg6sAANwMAQaDwBkKU3J6Krrem4cAANwMAQZjwBkK4vZTcnqLn2MAANwMAQZDwBkLXx8Lro9Hd08AANwMAQYjwBkKfiq6Phdeg0MAANwMAQYDwBkKk4fXR8Irb0MAANwMAQfjvBkKU3J6Kru+80MAANwMAQfDvBkLIwuuj4bX2ycAANwMAQejvBkLIwuuj4fXWycAANwMAQeDvBkKPhdfHwuuGy8AANwMAQdjvBkL808aX3YmnxsAANwMAQdDvBkKdtJHb87viw8AANwMAQcjvBkLe9KbioMCNxcAANwMAQcDvBkLoorbn96fMxsAANwMAQbjvBkLioODKw/a+w8AANwMAQbDvBkLayO35/YmMxcAANwMAQajvBkL3z7Ca57CP2T83AwBBoO8GQuH10fD6kPTgwAA3AwBBmO8GQoCAgICA4PPkwAA3AwBBkO8GQtLw+qi41fPdwAA3AwBBiO8GQoCAgICAkObUwAA3AwBBgO8GQubMmbPmvL/lwAA3AwBB+O4GQvnSm4mD4bzGwAA3AwBB8O4GQqTh9dHwuvbOwAA3AwBB6O4GQr2U3J6K7uDPwAA3AwBB4O4GQoCAgICAkPnVwAA3AwBB2O4GQubMmbPmrLjXwAA3AwBB0O4GQq6PhdfHsp/TwAA3AwBByO4GQtfHwuuj8Z7RwAA3AwBBwO4GQoquj4XXh5zLwAA3AwBBuO4GQvbR8PqomPDLwAA3AwBBsO4GQq6PhdfHwpfOwAA3AwBBqO4GQsjC66PhtYnMwAA3AwBBoO4GQtLw+qi4/cXLwAA3AwBBmO4GQoXXx8Lro8vKwAA3AwBBkO4GQtactJHbk6HGwAA3AwBBiO4GQomDgauOmre+wAA3AwBBgO4GQt+bgvPD1rrXPzcDAEHI8AZCvZTcnoq+9NPAADcDAEHA8AZCmrPmzJmzlejAADcDAEG48AZCmrPmzJmDmeTAADcDAEHQ8AZCADcDAEGY8QZCzcnv7OaNk4rAADcDAEGQ8QZC/5rZxvqQkorAADcDAEGI8QZCn9zk8c7Sw/w/NwMAQYDxBkLQmt70puLA+T83AwBB+PAGQuKIwse2nOLsPzcDAEGo8QZC1Krrncybqds/NwMAQaDxBkKi/4nc2KLN+D83AwBBiPIGQt/2mcuE0Ob1PzcDAEGQ8gZCzZmz5syZs/4/NwMAQdDyBkKAgICAgICAgMAANwMAQdjyBkKz5syZs+bM+z83AwBB4PIGQu75/anjy+7wPzcDAEHo8gZC/6aoiIGOgvo/NwMAQfDyBkKAgICAgICAgMAANwMAQYD1BkIANwMAQZjzBkEAQdAAEBAaQdD0BkIANwMAQcj0BkIANwMAQcD0BkIANwMAQdD1BkLjy+6kjISs6T83AwBB2PUGQoCAgICAgIDwPzcDAEHg9QZCzZmz5syZs5DAADcDAEHo9QZCgICAgICAsLnAADcDAEHw9QZCgICAgICAsLnAADcDAEH49QZCgICAgICAlMrAADcDAEGA9gZCgICAgICAiM7AADcDAEGI9gZC7KPh9dHwmqjAADcDAEGQ9gZCqbi9lNyesp7AADcDAEHI9wZCtJHb8/vTxvg/NwMAQZj2BkLso+H10fCaqMAANwMAQej4BkKk4fXR8Pqo2D83AwBB4PgGQqTh9dHw+qjYPzcDAEHY+AZCpOH10fD6qNg/NwMAQdD4BkK6k7GQsOWh2z83AwBByPgGQpCw5aGL2Z3fPzcDAEHA+AZC/9TxpbeShuI/NwMAQbj4BkLCwJWHreT25D83AwBBsPgGQv6p48vupIzoPzcDAEGo+AZCreT2/P7U8ek/NwMAQaD4BkLayO35/anj6z83AwBBmPgGQtvz+9PGl93tPzcDAEGQ+AZC2sjt+f2p4+8/NwMAQYj4BkLCwJWHreT28D83AwBBgPgGQquO2sjt+f3xPzcDAEH49wZC6c3EwcCVh/M/NwMAQfD3BkKoja+6k7GQ9D83AwBB6PcGQru+v+r40pv1PzcDAEHg9wZCz+/Pmt70pvY/NwMAQdj3BkKMhKy56KK29z83AwBB0PcGQtCa3vSm4qD4PzcDAEHY9gZCw+uj4fXR8PA/NwMAQdD2BkLXx8Lro+H18T83AwBByPYGQsGVh63k9vzyPzcDAEHA9gZCquPL7qSMhPQ/NwMAQbj2BkK9lNyeiq6P9T83AwBBsPYGQqa3koaC1pz2PzcDAEGo9gZCueiituf3p/c/NwMAQaD2BkKsueiituf39z83AwBBwPcGQpmI2PLQxezWPzcDAEG49wZCmYjY8tDF7NY/NwMAQbD3BkKZiNjy0MXs1j83AwBBqPcGQovZnd+ftbzZPzcDAEGg9wZC8qW3koaC1tw/NwMAQZj3BkL4p42vupOx4D83AwBBkPcGQu+kjISsuejiPzcDAEGI9wZCiYOBq47ayOU/NwMAQYD3BkKk4fXR8Pqo6D83AwBB+PYGQtXxpbeShoLqPzcDAEHw9gZCro+F18fC6+s/NwMAQej2BkKF18fC66Ph7T83AwBB4PYGQoaC1py0kdvvPzcDAEGY+gZC9uTH8p3Yqoe/fzcDAEGY+wZCyZ/ir7GNrsQ/NwMAQZD7BkKR8bPf7tDjvD83AwBBiPsGQvGorKyajfO1PzcDAEGA+wZCyozrivGN37A/NwMAQfj6BkLik+iina31qj83AwBB8PoGQu2Q97fhtvKqPzcDAEHo+gZCop7ugdCH2qg/NwMAQeD6BkKY8p7wgY30oT83AwBB2PoGQt2dt9uapO+ePzcDAEHQ+gZC3JXbmdb7uZI/NwMAQcj6BkKprLjJxaj9g79/NwMAQcD6BkLjs5PbnaH+k79/NwMAQbj6BkK119nf3KOumb9/NwMAQbD6BkLQxLKQ78D2mr9/NwMAQaj6BkKswJj72Onemr9/NwMAQaD6BkL11ezd4q//o79/NwMAQZD6BkL1+OKdlK/1yL9/NwMAQYj6BkKAic3AoqzE5b9/NwMAQYD6BkL2v5232pnO6r9/NwMAQfj5BkKV3pHzkf/g4r9/NwMAQfD5BkKXk9S71NbPyb9/NwMAQej5BkK99NeIssWr0L9/NwMAQeD5BkLtsLmV8fDxxL9/NwMAQdj5BkLGqKjD69Hkub9/NwMAQdD5BkK0nuvBh+y3qb9/NwMAQcj5BkLzrsOu/a2iqD83AwBBwPkGQq392//NmM+mPzcDAEG4+QZC5Kzjgvuel6E/NwMAQbD5BkLyyuHyjbfOoT83AwBBqPkGQsOQ1bWQnuuePzcDAEGg+QZC2/Gti9/hqps/NwMAQZj5BkKF4eLjm+uGmj83AwBBkPkGQoPZ7dSNoIKbPzcDAEGI+QZChoSDyfev25A/NwMAQYD5BkKNo5XRxs2Jir9/NwMAQfj4BkLf9OK686WZlL9/NwMAQfD4BkK27Lqd0LW4nz83AwBBuPsGQojPpZCjwMryv383AwBBsPsGQpulsp2cupXjv383AwBBqPsGQo2vupOxkLDhv383AwBBoPsGQumG0eXw5MfYv383AwBBwPsGQpqz5syZs+bUPzcDAEHI+wZCmrPmzJmz5tw/NwMAQdD7BkKAgICAgICA+D83AwBB2PsGQoCAgICAgMCswAA3AwBB4PsGQoCAgICAgID4PzcDAEHw+wZCgICAgICAgPg/NwMAQej7BkKAgICAgICA+D83AwBB+PsGQoCAgICAgID4PzcDAEGA/AZCgICAgICAgPg/NwMAQYj8BkKAgICAgICA+D83AwBBkPwGQoCAgICAgID4PzcDAEGY/AZCgICAgICAgPg/NwMAQaD8BkKAgICAgICA6D83AwBBqPwGQoCAgICAgID4PzcDAEGw/AZCgICAgICAgPA/NwMAQbj8BkKAgICAgICA+D83AwBBwPwGQvaGtqDfvojqPjcDAEHI/AZCgICAgICAgPg/NwMAQdD8BkKAgICA0Kzz5sEANwMAQdj8BkL7qLi9lNyeuj83AwBB4PwGQvuouL2U3J66PzcDAEHo/AZCADcDAEHw/AZCgICAgICAgIrAADcDAEH4/AZCgICAgICA0M/AADcDAEGA/QZCADcDAEGI/QZCmrPmzJmz5uw/NwMAQZD9BkKAgICAgICA8D83AwBBmP0GQoCAgICAgIDwPzcDAEGg/QZCs+bMmbPmzOE/NwMAQaj9BkL7qLi9lNyeyj83AwBBsP0GQvzTxpfdyZjAPzcDAEG4/QZC+6i4vZTcnso/NwMAQcD9BkKas+bMmbPm3D83AwBByP0GQri9lNyeiq7XPzcDAEHQ/QZC+6i4vZTcnsI/NwMAQeD9BkL7qLi9lNyewj83AwBB2P0GQoquj4XXx8LjPzcDAEHo/QZC05uJg4GrjvE/NwMAQfD9BkLZnd+ftbzpzT83AwBB+P0GQoXXx8Lro+GOwAA3AwBBgP4GQubMmbPmzJnzPzcDAEGI/gZCADcDAEGo/gZCgICAgICAgIrAADcDAEGg/gZCgICAgICAwKTAADcDAEGY/gZCgICAgICAwJzAADcDAEGQ/gZCgICAgICAgJfAADcDAEGw/gZCgICAgIDAltjAADcDAEHg/wZCADcDAEGwggdCADcDAEHggwdCgICAgICAgPg/NwMAQeiDB0L2hrag376I6j43AwBB8IMHQoCAgIDQrPPewQA3AwBBiIEHQgA3AwBB2IMHQgA3AwBB+IMHQoCAgICAgID4PzcDAEGAhAdCgICAgICAgPg/NwMAQYiEB0KAgICA0Kzz5sEANwMAQZCEB0K/6vjSm4mD8z83AwBBmIQHQoCAgICAgICEwAA3AwBBoIQHQgA3AwBBqIQHQgA3AwBBsIQHQo+F18fC66PpPzcDAEG4hAdCgICAgICAgJ/AADcDAEHAhAdCgICAgICAgIDAADcDAEHIhAdC3J6Kro+F1/c/NwMAQdCEB0Kas+bMmbPm3D83AwBB2IQHQoCAgICAgID4PzcDAEGYhgdC4MrDlrKbq8fAADcDAEHghAdCgICAgICAgPg/NwMAQbiHB0L20fD6qNiHzcAANwMAQbCHB0L20fD6qNiHzcAANwMAQaiHB0L20fD6qNiHzcAANwMAQaCHB0L20fD6qNiHzcAANwMAQZiHB0L20fD6qNiHzcAANwMAQZCHB0L20fD6qNiHzcAANwMAQYiHB0L20fD6qNiHzcAANwMAQYCHB0L20fD6qNiHzcAANwMAQfiGB0L20fD6qNiHzcAANwMAQfCGB0Lx+qi4vZTlzsAANwMAQeiGB0Lx+qi4vZTlzsAANwMAQeCGB0Lx+qi4vZTlzsAANwMAQdiGB0Lx+qi4vZTlzsAANwMAQdCGB0Lx+qi4vZTlzsAANwMAQciGB0Lx+qi4vZTlzsAANwMAQcCGB0Lx+qi4vbSYzsAANwMAQbiGB0Lx+qi4vbSYzsAANwMAQbCGB0Kz5syZs4bbzsAANwMAQaiGB0LmzJmz5oy4zcAANwMAQaCGB0Lcnoquj6WyzMAANwMAQaiFB0K9lNyeit6o0cAANwMAQaCFB0K9lNyeit6o0cAANwMAQZiFB0L20fD6qOi90cAANwMAQZCFB0L20fD6qOi90cAANwMAQYiFB0LIwuuj4fXD0cAANwMAQYCFB0LD66Ph9fGAz8AANwMAQfiEB0K9lNyeio6rzcAANwMAQfCEB0K9lNyeis6fyMAANwMAQZCGB0K9lNyeis6sz8AANwMAQYiGB0K9lNyeis6sz8AANwMAQYCGB0K9lNyeis6sz8AANwMAQfiFB0K9lNyeis6sz8AANwMAQfCFB0K9lNyeis6sz8AANwMAQeiFB0K9lNyeis6sz8AANwMAQeCFB0K9lNyeis6sz8AANwMAQdiFB0K9lNyeis6sz8AANwMAQdCFB0K9lNyeis6sz8AANwMAQciFB0K9lNyeit6o0cAANwMAQcCFB0K9lNyeit6o0cAANwMAQbiFB0K9lNyeit6o0cAANwMAQbCFB0K9lNyeit6o0cAANwMAQcCHB0Kas+bMmbPm3D83AwBByIcHQgA3AwBB0IcHQoCAgICAgMCswAA3AwBB2IcHQoCAgICAgID4PzcDAEHghwdChdfHwuujgZTAADcDAEHohwdCiq6PhdfHgpjAADcDAEHwhwdCi9md35+1gKPAADcDAEH4hwdC3d/YtLHVk8E+NwMAQYCIB0KF18fC66Ph9T83AwBByIgHQtfHwuuj4fXhPzcDAEHAiAdC18fC66Ph9eE/NwMAQbiIB0KXsru+v+r48D83AwBBsIgHQvPQxezO78/aPzcDAEGQiAdCquPL7qSMhNQ/NwMAQdCIB0Kq48vupIyE1D83AwBBkIkHQs2Zs+bMmbPuPzcDAEGYiQdCgICAgIDAg9DAADcDAEGoiQdCgICAgICA0M/AADcDAEGgiQdCzZmz5syZs/Y/NwMAQbCJB0Kas+bMmbPmzD83AwBBuIkHQpWYqtLOgM24PzcDAEHAiQdCueiituf3p8U/NwMAQciJB0KAgICAgPCEjsEANwMAQdCJB0Kas+bMmbPm5D83AwBB2IkHQvXz6tbYv9+gwAA3AwBB4IkHQoCAgICAgMS4wAA3AwBB6IkHQoCAgICAgMCUwAA3AwBB8IkHQoCAgICAgMCkwAA3AwBB+IkHQoCAgICA2J6YwQA3AwBBgIoHQoCAgICAgOKRwQA3AwBBiIoHQoCAgICA5eGUwQA3AwBBkIoHQoCAgICAgICSwAA3AwBBmIoHQoquj4XXx8KCwAA3AwBBoIoHQoquj4XXx8KCwAA3AwBBqIoHQoCAgICAgID4PzcDAEGwigdC+6i4vZTcntI/NwMAQbiKB0KAgICAgICAisAANwMAQcCKB0KAgICAgICAgMAANwMAQciKB0L6/anjy+6ktD83AwBB0IoHQvuouL2U3J7CPzcDAEHYigdC+6i4vZTcnso/NwMAQeCKB0KAgICAgICAjMAANwMAQdCLB0KlqaPswLqMwD83AwBByIsHQqm4vZTcnorWPzcDAEHAiwdCw+uj4fXR8No/NwMAQbiLB0L7qLi9lNye2j83AwBBsIsHQoquj4XXx8LbPzcDAEGoiwdCu76/6vjSm7k/NwMAQaCLB0K6k7GQsOWhyz83AwBBmIsHQtijrbznxqbNPzcDAEGQiwdCtp/k29z649g/NwMAQYiLB0K4vZTcnoqu1z83AwBBgIsHQoquj4XXx8LTPzcDAEH4igdC5NWRu6XLkds/NwMAQfCKB0KJg4GrjtrI3T83AwBB8IsHQoCAgICAgICMwAA3AwBB+IsHQpqz5syZs+bkPzcDAEGAjAdCgICAgICAgIzAADcDAEGwjAdCgICAgICAgPg/NwMAQaiMB0KAgICAgICA+D83AwBBoIwHQoCAgICAgID4PzcDAEGYjAdCgICAgICAgPg/NwMAQZCMB0IANwMAQeiLB0K56KK25/en1T83AwBB4IsHQufgypan24y6PzcDAEHYiwdCu76/6vjSm7k/NwMAQciMB0IANwMAQcCMB0KAgICAgICA+D83AwBB0IwHQgA3AwBB2IwHQgA3AwBB4IwHQgA3AwBB6IwHQrW86c3EwcDtv383AwBB8IwHQs2Zs+bMmfOJwAA3AwBB+IwHQrSR2/P704aCwAA3AwBBgI0HQt70puKg4KqIwAA3AwBBiI0HQr2U3J6Kro+JQDcDAEGQjQdCwZWHreT2/IHAADcDAEGgjQdC/pXk3LLQ2uS/fzcDAEGYjQdCwOCc+vj7tvM/NwMAQaiNB0KAgICAgICwtsAANwMAQbCNB0KAgICA0Kzz3sEANwMAQbiNB0KAgICAgIDArMAANwMAQcCNB0KAgICAgICAjMAANwMAQciNB0KAgICAgIDApMAANwMAQdCNB0KAgICAgICAosAANwMAQZiOB0L7qLi9lNye2j83AwBBkI4HQvuouL2U3J7iPzcDAEGIjgdCuL2U3J6Kruc/NwMAQYCOB0LS8PqouL2U5D83AwBBoI4HQoCAgOSJ3Lq5wgA3AwBBqI4HQoCAgICAgICnwAA3AwBB6I4HQpTcnoquj4XnPzcDAEHgjgdCiYOBq47ayOU/NwMAQdiOB0KljISsueii7j83AwBB0I4HQvT708aX3cnYPzcDAEGwjgdC+6i4vZTcntI/NwMAQfCOB0L7qLi9lNye0j83AwBBsI8HQpqz5syZs+b4PzcDAEHIjwdCgICAgICAgITAADcDAEHAjwdCs+bMmbPmzPk/NwMAQdiPB0Ks57HA7Ov79D83AwBB0I8HQtfHwuuj4fX1PzcDAEHojwdCuL2U3J6Krtc/NwMAQeCPB0K4vZTcnoquzz83AwBB8I8HQs2Zs+bMmbP2PzcDAEH4jwdCr7qTsZCw5ek/NwMAQYCQB0KSufmfpL/77T83AwBBkJAHQvuouL2U3J72PzcDAEGIkAdCmrPmzJmz5vQ/NwMAQZiQB0LIwuuj4fXR8D83AwBBoJAHQrPmzJmz5szxPzcDAEGokAdCgICAgICAgPg/NwMAQbCQB0LujO6An7/IhMAANwMAQbiQB0KAgICAgIDArMAANwMAQcCQB0Kas+bMmbPm1D83AwBB2JAHQuH9gZ6wgKL1PzcDAEHQkAdC77f82ues8vQ/NwMAQeiQB0Lh/YGesICi9T83AwBB4JAHQu+3/NrnrPL0PzcDAEHwkAdCgICAjPv6yrDCADcDAEH4kAdCgICAgI3xsIDCADcDAEGAkQdCmrPmzJmz5vQ/NwMAQYiRB0L7qLi9lNye9j83AwBBkJEHQsjC66Ph9dHwPzcDAEGYkQdCs+bMmbPmzPE/NwMAQaCRB0KAgICAgICA+D83AwBBqJEHQoCAgICAgID4PzcDAEGwkQdCs+bMmbPmzOk/NwMAQbiRB0KAgICAgICAgMAANwMAQciRB0IANwMAQcCRB0IANwMAQdCRB0KAgICAgICAjsAANwMAQdiRB0KAgICAgIenvsEANwMAQeCRB0KAgICAgICA/D83AwBB6JEHQoCAgICAgID4PzcDAEHwkQdCgICAgICAgInAADcDAEH4kQdCgICAgICAgITAADcDAEGIkgdCirC7sMT9hOA/NwMAQYCSB0KAgICAgICAhMAANwMAQZCSB0LsrK629Jy/5T83AwBBmJIHQoCAgICAgIDwPzcDAEGgkgdCgICAgICAgJLAADcDAEGokgdCs+bMmbPmzOk/NwMAQbCSB0KAgICAgICAksAANwMAQbiSB0KAgICAgIDApMAANwMAQcCSB0KAgICAgIDApMAANwMAQciSB0KAgICAgIDApMAANwMAQdCSB0KAgICAgIDkz8AANwMAQdiSB0KAgICAgIDkz8AANwMAQeCSB0KAgICAgIDkz8AANwMAQeiSB0KAgICAgIDkz8AANwMAQfCSB0KAgICAgIDkz8AANwMAQfiSB0KAgICAgIDkz8AANwMAQYCTB0KAgICAgIDkz8AANwMAQYiTB0KAgICAgIDkz8AANwMAQaiVB0L7qLi9lNye4j83AwBBoJUHQvuouL2U3J7iPzcDAEGYlQdCxq2I5MGSzOM/NwMAQZCVB0LGrYjkwZLM4z83AwBBiJUHQsatiOTBkszjPzcDAEGAlQdCxq2I5MGSzOM/NwMAQfiUB0LGrYjkwZLM4z83AwBB8JQHQs6I/bXrz/7hPzcDAEHolAdCzoj9tevP/uE/NwMAQeCUB0LOiP2168/+4T83AwBB2JQHQs6I/bXrz/7hPzcDAEHQlAdCzoj9tevP/uE/NwMAQbiUB0KKro+F18fC4z83AwBBsJQHQtLw+qi4vZTkPzcDAEGolAdC0vD6qLi9lOQ/NwMAQaCUB0LS8PqouL2U5D83AwBBmJQHQtLw+qi4vZTkPzcDAEGQlAdC0vD6qLi9lOQ/NwMAQYiUB0LS8PqouL2U5D83AwBBgJQHQtLw+qi4vZTkPzcDAEH4kwdC0vD6qLi9lOQ/NwMAQfCTB0Lh9dHw+qi45T83AwBB6JMHQuH10fD6qLjlPzcDAEHgkwdC4fXR8PqouOU/NwMAQdiTB0Lh9dHw+qi45T83AwBB0JMHQuH10fD6qLjlPzcDAEHIkwdC9tHw+qi4veQ/NwMAQcCTB0L20fD6qLi95D83AwBBuJMHQvbR8PqouL3kPzcDAEGwkwdC9tHw+qi4veQ/NwMAQaiTB0L20fD6qLi95D83AwBB2JUHQvuouL2U3J7iPzcDAEHQlQdC+6i4vZTcnuI/NwMAQciVB0L7qLi9lNye4j83AwBBwJUHQvuouL2U3J7iPzcDAEG4lQdC+6i4vZTcnuI/NwMAQbCVB0L7qLi9lNye4j83AwBByJQHQoquj4XXx8LjPzcDAEHAlAdCiq6PhdfHwuM/NwMAQaCTB0LnjdOn2MSH5D83AwBBmJMHQueN06fYxIfkPzcDAEGQkwdC543Tp9jEh+Q/NwMAQeiVB0KAgICAgIDgqMAANwMAQeCVB0KAgICAgIDgqMAANwMAQfCVB0LmzJmz5szZkcAANwMAQfiVB0KAgICQytLGrsIANwMAQYCWB0KAgICAoJPpwMEANwMAQYiWB0KAgICAgICA+D83AwBBkJYHQoCAgICAgICFwAA3AwBBmJYHQoCAgICAgICQwAA3AwBBoJYHQoCAgICAgICMwAA3AwBBqJYHQoCAgICAh6e+wQA3AwBBsJYHQoCAgICAgICSwAA3AwBBuJYHQrPmzJmz5vfMwAA3AwBBwJYHQvbR8PqouL3wPzcDAEHIlgdCgICAgICAgJrAADcDAEHIlwdCquPL7qSMhNQ/NwMAQaCXB0Kq48vupIyE1D83AwBB+JYHQvuouL2U3J7SPzcDAEHwlgdC2PLQxezO788/NwMAQeiWB0K4vZTcnoqu1z83AwBB4JYHQqrjy+6kjITUPzcDAEHYlgdCupOxkLDlocM/NwMAQdCWB0LpzcTBwJWH1T83AwBBwJcHQpOxkLDloYvZPzcDAEG4lwdCquPL7qSMhNQ/NwMAQbCXB0L6/anjy+6kxD83AwBBqJcHQtrI7fn9qePLPzcDAEGYlwdCuL2U3J6Krs8/NwMAQZCXB0Lso+H10fD62D83AwBBiJcHQpqz5syZs+bUPzcDAEGAlwdC+6i4vZTcnsI/NwMAQeiYB0KL2Z3fn7W82T83AwBBwJgHQuyj4fXR8PrgPzcDAEGYmAdCy8OWsru+v9I/NwMAQfCXB0Lb8/vTxpfd2T83AwBBiJkHQtvz+9PGl93JPzcDAEGAmQdC2/P708aX3ck/NwMAQfiYB0LayO35/anj0z83AwBB8JgHQpve9KbioODSPzcDAEHgmAdCiq6PhdfHwts/NwMAQdiYB0K4vZTcnoqu1z83AwBB0JgHQoquj4XXx8LbPzcDAEHImAdC7KPh9dHw+tg/NwMAQbiYB0KPhdfHwuuj4T83AwBBsJgHQpve9KbioODKPzcDAEGomAdCy8OWsru+v9I/NwMAQaCYB0K56KK25/en1T83AwBBkJgHQtvz+9PGl93JPzcDAEGImAdC2/P708aX3ck/NwMAQYCYB0L6/anjy+6k1D83AwBB+JcHQtvz+9PGl93RPzcDAEHolwdCk7GQsOWhi9k/NwMAQeCXB0Kq48vupIyE1D83AwBB2JcHQvr9qePL7qTEPzcDAEHQlwdC2sjt+f2p48s/NwMAQZCZB0KAgICAgIDQ18AANwMAQZiZB0KAgICAgIDW1cAANwMAQaCZB0KAgICAgIDW3cAANwMAQaiZB0KAgICAgIDl4MAANwMAQbCZB0KAgICAgIDQ58AANwMAQbiZB0KAgICAgMCm6MAANwMAQciZB0Kz5syZs+bM6T83AwBBwJkHQoCAgICAgNP+wAA3AwBBiJoHQtTGl93JmIjgPzcDAEGAmgdC18fC66Ph9ek/NwMAQfiZB0L6/anjy+6k6D83AwBB8JkHQtjy0MXszu/fPzcDAEHomQdCr7qTsZCw5eE/NwMAQeCZB0KvupOxkLDl4T83AwBB2JkHQvuouL2U3J7iPzcDAEHQmQdC35+1vOnNxOE/NwMAQZCaB0KAgNCx0v6ahsMANwMAQZiaB0KAgICAgICA+D83AwBBoJoHQoCAgICAgID4PzcDAEGomgdCgICAgICA8KrAADcDAEGwmgdCgICAgICAkKrAADcDAEG4mgdCgICAgICAgITAADcDAEH4mgdCi9md35+1vNk/NwMAQfCaB0Lso+H10fD64D83AwBB6JoHQsvDlrK7vr/SPzcDAEHgmgdC2/P708aX3dk/NwMAQdiaB0Kq48vupIyE1D83AwBB0JoHQqrjy+6kjITUPzcDAEHImgdC+6i4vZTcntI/NwMAQcCaB0LpzcTBwJWH1T83AwBBgJsHQuyj4fXR8PrQPzcDAEGwmwdCro+F18fC6/c/NwMAQaibB0Kas+bMmbPm9D83AwBBoJsHQq6PhdfHwuuMwAA3AwBBmJsHQs2Zs+bMmbPyPzcDAEGQmwdC+6i4vZTcnvo/NwMAQcibB0KPhdfHwuuDkcAANwMAQcCbB0LD66Ph9dGQl8AANwMAQbibB0LD66Ph9dHwh8AANwMAQYicB0Kk4fXR8Pqo6D83AwBBgJwHQvPe9r7YucTaPzcDAEH4mwdCqd+s2tPmpe8/NwMAQfCbB0L1xbXu9oyBzD83AwBB6JsHQtf/06yooZrEPzcDAEHgmwdCx7SE7MGU09g/NwMAQdibB0KrnIub98Py1j83AwBB0JsHQrKPkPXAh8LJPzcDAEGYnAdC7KPh9dHw+qbAADcDAEGQnAdCzZmz5syZq6bAADcDAEHInQdC8vn0koi/2dI/NwMAQcieB0K125eOpo+D2D83AwBBwJ4HQrXbl46mj4PYPzcDAEG4ngdCtduXjqaPg9g/NwMAQbCeB0K125eOpo+D2D83AwBBqJ4HQrXbl46mj4PYPzcDAEGgngdCtduXjqaPg9g/NwMAQZieB0K125eOpo+D2D83AwBBkJ4HQvS64Y+cn/XYPzcDAEGIngdC9Lrhj5yf9dg/NwMAQYCeB0L0uuGPnJ/12D83AwBB+J0HQvS64Y+cn/XYPzcDAEHwnQdC9Lrhj5yf9dg/NwMAQeidB0KzmquRkq/n2T83AwBB4J0HQpKKpMfhiIzZPzcDAEHYnQdCuZzcoJHMx9g/NwMAQdCdB0L4upG7ytjG1T83AwBBmKAHQrLhmeiz1PG7PzcDAEHwngdCxczK2fex+tE/NwMAQbigB0KKkvSduu3ywj83AwBBsKAHQrWihuXHtI3CPzcDAEGooAdC1e6z+vGpwcE/NwMAQaCgB0LD54nS0reHvz83AwBBkKAHQryfs9rYyvfWPzcDAEGIoAdCvJ+z2tjK99Y/NwMAQYCgB0K8n7Pa2Mr31j83AwBB+J8HQryfs9rYyvfWPzcDAEHwnwdCvJ+z2tjK99Y/NwMAQeifB0K8n7Pa2Mr31j83AwBB4J8HQryfs9rYyvfWPzcDAEHYnwdCvJ+z2tjK99Y/NwMAQdCfB0K8n7Pa2Mr31j83AwBByJ8HQryfs9rYyvfWPzcDAEHAnwdCvJ+z2tjK99Y/NwMAQbifB0Kr+amR8P6l2D83AwBBsJ8HQqv5qZHw/qXYPzcDAEGonwdCq/mpkfD+pdg/NwMAQaCfB0Kr+amR8P6l2D83AwBBmJ8HQqv5qZHw/qXYPzcDAEGQnwdC+KK69bOYkNk/NwMAQYifB0Ld+JLuz5272D83AwBBgJ8HQo/1r6/hgvfXPzcDAEH4ngdCs/Xn9oedztQ/NwMAQeieB0K125eOpo+D2D83AwBB4J4HQrXbl46mj4PYPzcDAEHYngdCtduXjqaPg9g/NwMAQdCeB0K125eOpo+D2D83AwBB6KIHQtmvsuOD29joPzcDAEHQowdC85eD44iJhe0/NwMAQcijB0Lzl4PjiImF7T83AwBBwKMHQvOXg+OIiYXtPzcDAEG4owdC85eD44iJhe0/NwMAQbCjB0Ldr87Z3cK+7j83AwBBqKMHQt2vztndwr7uPzcDAEGgowdC3a/O2d3Cvu4/NwMAQZijB0Ldr87Z3cK+7j83AwBBkKMHQt2vztndwr7uPzcDAEGIowdC9ZeR3vX89+8/NwMAQYCjB0Kc8au7lM7j7j83AwBB+KIHQt6sk5bwq/TtPzcDAEHwogdC3KyFm4O4ges/NwMAQbihB0L0uuGPnJ/1wD83AwBBsKEHQvS64Y+cn/XAPzcDAEGooQdC9Lrhj5yf9cA/NwMAQaChB0L0uuGPnJ/1wD83AwBBmKEHQvS64Y+cn/XAPzcDAEGQoQdC9Lrhj5yf9cA/NwMAQYihB0L0uuGPnJ/1wD83AwBBgKEHQvS64Y+cn/XAPzcDAEH4oAdC9Lrhj5yf9cA/NwMAQfCgB0L0uuGPnJ/1wD83AwBB6KAHQvS64Y+cn/XAPzcDAEHgoAdCv+bqlquG9ME/NwMAQdigB0K/5uqWq4b0wT83AwBB0KAHQr/m6parhvTBPzcDAEHIoAdCv+bqlquG9ME/NwMAQcCgB0K/5uqWq4b0wT83AwBBuKUHQvWUj92RrNThPzcDAEHYpgdC3a/O2d3CvuY/NwMAQdCmB0Ldr87Z3cK+5j83AwBByKYHQt2vztndwr7mPzcDAEHApgdC3a/O2d3CvuY/NwMAQbimB0Ldr87Z3cK+5j83AwBBsKYHQt2vztndwr7mPzcDAEGopgdC3a/O2d3CvuY/NwMAQaCmB0Ldr87Z3cK+5j83AwBBmKYHQt2vztndwr7mPzcDAEGQpgdC3a/O2d3CvuY/NwMAQYimB0Ldr87Z3cK+5j83AwBBgKYHQuShxJunpYboPzcDAEH4pQdC5KHEm6elhug/NwMAQfClB0LkocSbp6WG6D83AwBB6KUHQuShxJunpYboPzcDAEHgpQdC5KHEm6elhug/NwMAQdilB0Kt26m83Kjt6D83AwBB0KUHQov9w+a88proPzcDAEHIpQdC+ZSr0+uTuuc/NwMAQcClB0L9jaa0kIWe5D83AwBBiKQHQvOXg+OIiYXtPzcDAEGApAdC85eD44iJhe0/NwMAQfijB0Lzl4PjiImF7T83AwBB8KMHQvOXg+OIiYXtPzcDAEHoowdC85eD44iJhe0/NwMAQeCjB0Lzl4PjiImF7T83AwBB2KMHQvOXg+OIiYXtPzcDAEGonAdC7sGizvSi1Mg/NwMAQaCcB0Kkr574yfPVxT83AwBBwKEHQqbwivXd0/HDPzcDAEHAnQdCk4qQko23oMo/NwMAQbidB0KTipCSjbegyj83AwBBsJ0HQpOKkJKNt6DKPzcDAEGonQdCk4qQko23oMo/NwMAQaCdB0KTipCSjbegyj83AwBBmJ0HQpOKkJKNt6DKPzcDAEGQnQdCk4qQko23oMo/NwMAQYidB0KTipCSjbegyj83AwBBgJ0HQpOKkJKNt6DKPzcDAEH4nAdCk4qQko23oMo/NwMAQfCcB0KTipCSjbegyj83AwBB6JwHQpjBv4nMoLLLPzcDAEHgnAdCmMG/icygsss/NwMAQdicB0KYwb+JzKCyyz83AwBB0JwHQpjBv4nMoLLLPzcDAEHInAdCmMG/icygsss/NwMAQcCcB0LNxeGw9orEzD83AwBBuJwHQr/w18euts/LPzcDAEGwnAdCqf3z7N3298o/NwMAQZCiB0L0uuGPnJ/1yD83AwBBiKIHQr/m6parhvTJPzcDAEGAogdCv+bqlquG9Mk/NwMAQfihB0K/5uqWq4b0yT83AwBB8KEHQr/m6parhvTJPzcDAEHooQdCv+bqlquG9Mk/NwMAQeChB0KKkvSduu3yyj83AwBB2KEHQtj+6aHdtI3KPzcDAEHQoQdCjrbsgMepwck/NwMAQcihB0LP2JjFqLiHxz83AwBBkKQHQv6WhM2T1PHTPzcDAEGopQdC9Lrhj5yf9dg/NwMAQaClB0L0uuGPnJ/12D83AwBBmKUHQvS64Y+cn/XYPzcDAEGQpQdC9Lrhj5yf9dg/NwMAQYilB0L0uuGPnJ/12D83AwBBgKUHQvS64Y+cn/XYPzcDAEH4pAdC9Lrhj5yf9dg/NwMAQfCkB0L0uuGPnJ/12D83AwBB6KQHQvS64Y+cn/XYPzcDAEHgpAdC9Lrhj5yf9dg/NwMAQdikB0K/5uqWq4b02T83AwBB0KQHQr/m6parhvTZPzcDAEHIpAdCv+bqlquG9Nk/NwMAQcCkB0K/5uqWq4b02T83AwBBuKQHQr/m6parhvTZPzcDAEGwpAdC3773sZ/t8to/NwMAQaikB0Ksq+21wrSN2j83AwBBoKQHQubc5dj8qcHZPzcDAEGYpAdCoIumlb23h9c/NwMAQeCiB0L0uuGPnJ/1yD83AwBB2KIHQvS64Y+cn/XIPzcDAEHQogdC9Lrhj5yf9cg/NwMAQciiB0L0uuGPnJ/1yD83AwBBwKIHQvS64Y+cn/XIPzcDAEG4ogdC9Lrhj5yf9cg/NwMAQbCiB0L0uuGPnJ/1yD83AwBBqKIHQvS64Y+cn/XIPzcDAEGgogdC9Lrhj5yf9cg/NwMAQZiiB0L0uuGPnJ/1yD83AwBBsKkHQtywgv+SmMHSPzcDAEGIqAdC5Jv52+jJpdM/NwMAQeipB0Lnot7RoMvk2j83AwBB4KkHQuei3tGgy+TaPzcDAEHYqQdC56Le0aDL5No/NwMAQdCpB0K0zO615OTO2z83AwBByKkHQoLNhdmExrnbPzcDAEHAqQdClaTou/Ta5dg/NwMAQbipB0KizJKS0Zej1T83AwBBqKkHQrOaq5GSr+fZPzcDAEGgqQdCs5qrkZKv59k/NwMAQZipB0KzmquRkq/n2T83AwBBkKkHQrOaq5GSr+fZPzcDAEGIqQdCs5qrkZKv59k/NwMAQYCpB0KzmquRkq/n2T83AwBB+KgHQrOaq5GSr+fZPzcDAEHwqAdCs5qrkZKv59k/NwMAQeioB0Ly+fSSiL/Z2j83AwBB4KgHQvL59JKIv9naPzcDAEHYqAdC8vn0koi/2do/NwMAQdCoB0Ly+fSSiL/Z2j83AwBByKgHQrHZvpT+zsvbPzcDAEHAqAdCsdm+lP7Oy9s/NwMAQbioB0Kx2b6U/s7L2z83AwBBsKgHQrHZvpT+zsvbPzcDAEGoqAdC8LiIlvTevdw/NwMAQaCoB0LS6cXervWm3D83AwBBmKgHQvj7paKH3LnZPzcDAEGQqAdC7febmeD+odY/NwMAQbClB0L0uuGPnJ/12D83AwBB2KoHQqKWiO+Emca8PzcDAEHYqwdCipL0nbrt8sI/NwMAQdCrB0KKkvSduu3ywj83AwBByKsHQoqS9J267fLCPzcDAEHAqwdCipL0nbrt8sI/NwMAQbirB0Km8Ir13dPxwz83AwBBsKsHQqbwivXd0/HDPzcDAEGoqwdCpvCK9d3T8cM/NwMAQaCrB0Km8Ir13dPxwz83AwBBmKsHQqHphqzYu/DEPzcDAEGQqwdCoemGrNi78MQ/NwMAQYirB0Kh6Yas2LvwxD83AwBBgKsHQqHphqzYu/DEPzcDAEH4qgdCvMedg/yh78U/NwMAQfCqB0Kkr574yfPVxT83AwBB6KoHQtrh9YfWkMDCPzcDAEHgqgdCmdf3isXw7L8/NwMAQdCqB0L4orr1s5iQ2T83AwBByKoHQviiuvWzmJDZPzcDAEHAqgdC+KK69bOYkNk/NwMAQbiqB0L4orr1s5iQ2T83AwBBsKoHQviiuvWzmJDZPzcDAEGoqgdC+KK69bOYkNk/NwMAQaCqB0L4orr1s5iQ2T83AwBBmKoHQviiuvWzmJDZPzcDAEGQqgdCxczK2fex+tk/NwMAQYiqB0LFzMrZ97H62T83AwBBgKoHQsXMytn3sfrZPzcDAEH4qQdCxczK2fex+tk/NwMAQfCpB0Lnot7RoMvk2j83AwBB+K8HQuL7nLC5hJniPzcDAEGorQdC1LKY7o3Eluk/NwMAQZiwB0LhqMm6grSi6z83AwBBkLAHQo390eGp5o3rPzcDAEGIsAdCstSymO6NxOg/NwMAQYCwB0Lxm5T87Lrw5D83AwBByK4HQvWXkd71/PfvPzcDAEHArgdC9ZeR3vX89+8/NwMAQbiuB0L1l5He9fz37z83AwBBsK4HQvWXkd71/PfvPzcDAEGorgdC9ZeR3vX89+8/NwMAQaCuB0L1l5He9fz37z83AwBBmK4HQvWXkd71/PfvPzcDAEGQrgdC9ZeR3vX89+8/NwMAQYiuB0Lwl66qpdvY8D83AwBBgK4HQvCXrqql29jwPzcDAEH4rQdC8JeuqqXb2PA/NwMAQfCtB0Lwl66qpdvY8D83AwBB6K0HQuXj0+WPuLXxPzcDAEHgrQdC5ePT5Y+4tfE/NwMAQditB0Ll49Plj7i18T83AwBB0K0HQuXj0+WPuLXxPzcDAEHIrQdC8Zf155uVkvI/NwMAQcCtB0KRt4a3wM//8T83AwBBuK0HQsnE3ozF5a3vPzcDAEGwrQdC26/A3vDOy+s/NwMAQfirB0KKkvSduu3ywj83AwBB8KsHQoqS9J267fLCPzcDAEHoqwdCipL0nbrt8sI/NwMAQeCrB0KKkvSduu3ywj83AwBByKcHQs3F4bD2isTMPzcDAEHApwdC0/yQqLX01c0/NwMAQbinB0LT/JCotfTVzT83AwBBsKcHQtP8kKi19NXNPzcDAEGopwdC0/yQqLX01c0/NwMAQaCnB0LZs8Cf9N3nzj83AwBBmKcHQtmzwJ/03efOPzcDAEGQpwdC2bPAn/Td584/NwMAQYinB0LZs8Cf9N3nzj83AwBBgKcHQt/q75azx/nPPzcDAEH4pgdC54jKiLyy3M8/NwMAQfCmB0KvtKPknOCJzD83AwBB6KYHQo3T4JrOzY7JPzcDAEHgpgdC/dPox56Pt8Y/NwMAQZixB0Kt26m83Kjt6D83AwBBkLEHQq3bqbzcqO3oPzcDAEGIsQdCrdupvNyo7eg/NwMAQYCxB0Kt26m83Kjt6D83AwBB+LAHQq3bqbzcqO3oPzcDAEHwsAdCrdupvNyo7eg/NwMAQeiwB0Kt26m83Kjt6D83AwBB4LAHQq3bqbzcqO3oPzcDAEHYsAdCouWG69Ss1Ok/NwMAQdCwB0Ki5Ybr1KzU6T83AwBByLAHQqLlhuvUrNTpPzcDAEHAsAdCouWG69Ss1Ok/NwMAQbiwB0LrnuyLirC76j83AwBBsLAHQuue7IuKsLvqPzcDAEGosAdC657si4qwu+o/NwMAQaCwB0LrnuyLirC76j83AwBB0K4HQqKWiO+EmcbUPzcDAEGArAdCopaI74SZxsQ/NwMAQYCoB0LNxeGw9orEzD83AwBB+KcHQs3F4bD2isTMPzcDAEHwpwdCzcXhsPaKxMw/NwMAQeinB0LNxeGw9orEzD83AwBB4KcHQs3F4bD2isTMPzcDAEHYpwdCzcXhsPaKxMw/NwMAQdCnB0LNxeGw9orEzD83AwBB2K4HQqrFqenP8OzXPzcDAEGgrQdCipL0nbrt8so/NwMAQZitB0KKkvSduu3yyj83AwBBkK0HQoqS9J267fLKPzcDAEGIrQdCipL0nbrt8so/NwMAQYCtB0KKkvSduu3yyj83AwBB+KwHQoqS9J267fLKPzcDAEHwrAdCipL0nbrt8so/NwMAQeisB0KKkvSduu3yyj83AwBB4KwHQtW9/aTJ1PHLPzcDAEHYrAdC1b39pMnU8cs/NwMAQdCsB0LVvf2kydTxyz83AwBByKwHQtW9/aTJ1PHLPzcDAEHArAdCoemGrNi78Mw/NwMAQbisB0Kh6Yas2LvwzD83AwBBsKwHQqHphqzYu/DMPzcDAEGorAdCoemGrNi78Mw/NwMAQaCsB0LslJCz56LvzT83AwBBmKwHQtP8kKi19NXNPzcDAEGQrAdC2uH1h9aQwMo/NwMAQYisB0LTnrCRmvDsxz83AwBB8K8HQt++97Gf7fLaPzcDAEHorwdC3773sZ/t8to/NwMAQeCvB0Lfvvexn+3y2j83AwBB2K8HQt++97Gf7fLaPzcDAEHQrwdC3773sZ/t8to/NwMAQcivB0Lfvvexn+3y2j83AwBBwK8HQt++97Gf7fLaPzcDAEG4rwdC3773sZ/t8to/NwMAQbCvB0Kq6oC5rtTx2z83AwBBqK8HQqrqgLmu1PHbPzcDAEGgrwdCquqAua7U8ds/NwMAQZivB0Kq6oC5rtTx2z83AwBBkK8HQvGblPzsuvDcPzcDAEGIrwdC8ZuU/Oy68Nw/NwMAQYCvB0Lxm5T87Lrw3D83AwBB+K4HQvGblPzsuvDcPzcDAEHwrgdC7JSQs+ei790/NwMAQeiuB0LT/JCotfTV3T83AwBB4K4HQoW18vPwkMDaPzcDAEGgsQdCkY7rxdvRgeQ/NwMAQaixB0Lso+H10fD62D83AwBBsLEHQoCAgIDA8PXLwQA3AwBBuLEHQoCAgICQmp3CwQA3AwBByLEHQubMmbPmzJn3PzcDAEHAsQdCgICAgICAgPg/NwMAQYizB0LNmbPmzJmz9j83AwBB4LEHQoCAgICAgID4PzcDAEGQswdCs+bMmbPmzPU/NwMAQeixB0Kz5syZs+bM9T83AwBBoLQHQvbR8PqouL3sPzcDAEGotAdCmrPmzJmz5uw/NwMAQdi1B0EAQagBEBAaQdi4B0K/5uqWq4b0yT83AwBB0LgHQr/m6parhvTJPzcDAEHIuAdCipL0nbrt8so/NwMAQcC4B0LY/umh3bSNyj83AwBBuLgHQo627IDHqcHJPzcDAEGwuAdCz9iYxai4h8c/NwMAQai4B0Km8Ir13dPxwz83AwBBoLgHQozHypvRls3XPzcDAEGYuAdCjMfKm9GWzdc/NwMAQZC4B0KMx8qb0ZbN1z83AwBBiLgHQozHypvRls3XPzcDAEGAuAdCjMfKm9GWzdc/NwMAQfi3B0KMx8qb0ZbN1z83AwBB8LcHQozHypvRls3XPzcDAEHotwdCjMfKm9GWzdc/NwMAQeC3B0KMx8qb0ZbN1z83AwBB2LcHQozHypvRls3XPzcDAEHQtwdCjMfKm9GWzdc/NwMAQci3B0KCkP+tuMXV2D83AwBBwLcHQoKQ/624xdXYPzcDAEG4twdCgpD/rbjF1dg/NwMAQbC3B0KCkP+tuMXV2D83AwBBqLcHQoKQ/624xdXYPzcDAEGgtwdCvfyYjsi/xNk/NwMAQZi3B0KXtc6XhN7r2D83AwBBkLcHQq7s2bLWlKnYPzcDAEGItwdC7qbM5O3AltU/NwMAQYC3B0KlvK/a8rmz0j83AwBB+LoHQqLlhuvUrNTpPzcDAEHwuwdC3a/O2d3Cvu4/NwMAQei7B0Ldr87Z3cK+7j83AwBB4LsHQt2vztndwr7uPzcDAEHYuwdC3a/O2d3Cvu4/NwMAQdC7B0Ldr87Z3cK+7j83AwBByLsHQt2vztndwr7uPzcDAEHAuwdCzrnI1IWlhvA/NwMAQbi7B0LOucjUhaWG8D83AwBBsLsHQs65yNSFpYbwPzcDAEGouwdCzrnI1IWlhvA/NwMAQaC7B0LOucjUhaWG8D83AwBBmLsHQq3bqbzcqO3wPzcDAEGQuwdCoeW/rd7ymvA/NwMAQYi7B0L5lKvT65O67z83AwBBgLsHQv2NprSQhZ7sPzcDAEHIuQdC9Lrhj5yf9cg/NwMAQcC5B0L0uuGPnJ/1yD83AwBBuLkHQvS64Y+cn/XIPzcDAEGwuQdC9Lrhj5yf9cg/NwMAQai5B0L0uuGPnJ/1yD83AwBBoLkHQvS64Y+cn/XIPzcDAEGYuQdC9Lrhj5yf9cg/NwMAQZC5B0L0uuGPnJ/1yD83AwBBiLkHQvS64Y+cn/XIPzcDAEGAuQdC9Lrhj5yf9cg/NwMAQfi4B0L0uuGPnJ/1yD83AwBB8LgHQr/m6parhvTJPzcDAEHouAdCv+bqlquG9Mk/NwMAQeC4B0K/5uqWq4b0yT83AwBByL0HQvWUj92RrNThPzcDAEHovgdC3a/O2d3CvuY/NwMAQeC+B0Ldr87Z3cK+5j83AwBB2L4HQt2vztndwr7mPzcDAEHQvgdC3a/O2d3CvuY/NwMAQci+B0Ldr87Z3cK+5j83AwBBwL4HQt2vztndwr7mPzcDAEG4vgdC3a/O2d3CvuY/NwMAQbC+B0Ldr87Z3cK+5j83AwBBqL4HQt2vztndwr7mPzcDAEGgvgdC3a/O2d3CvuY/NwMAQZi+B0Ldr87Z3cK+5j83AwBBkL4HQuShxJunpYboPzcDAEGIvgdC5KHEm6elhug/NwMAQYC+B0LkocSbp6WG6D83AwBB+L0HQuShxJunpYboPzcDAEHwvQdC5KHEm6elhug/NwMAQei9B0Kt26m83Kjt6D83AwBB4L0HQov9w+a88proPzcDAEHYvQdC+ZSr0+uTuuc/NwMAQdC9B0L9jaa0kIWe5D83AwBBmLwHQt2vztndwr7uPzcDAEGQvAdC3a/O2d3Cvu4/NwMAQYi8B0Ldr87Z3cK+7j83AwBBgLwHQt2vztndwr7uPzcDAEH4uwdC3a/O2d3Cvu4/NwMAQbC0B0EAQagBEBAiAELQ/OD8hruE0T83A7AFIABCjOOb6IOIp84/NwOoBSAAQoz1/4OzyaXLPzcDoAVBoLwHQvzVl9D/89XVPzcDAEH4vAdCk4qQko23oNo/NwMAQfC8B0KTipCSjbeg2j83AwBB6LwHQsSUvPXmoLLbPzcDAEHgvAdCxJS89eagsts/NwMAQdi8B0LElLz15qCy2z83AwBB0LwHQsSUvPXmoLLbPzcDAEHIvAdCxJS89eagsts/NwMAQcC8B0L2nujYwIrE3D83AwBBuLwHQujJ3u/4tc/bPzcDAEGwvAdC/an3gMP299o/NwMAQai8B0KalZ+6j6PU2D83AwBB8LoHQpXL/I6hl7zQPzcDAEHougdClcv8jqGXvNA/NwMAQeC6B0KVy/yOoZe80D83AwBB2LoHQpXL/I6hl7zQPzcDAEHQugdClcv8jqGXvNA/NwMAQci6B0KVy/yOoZe80D83AwBBwLoHQpXL/I6hl7zQPzcDAEG4ugdClcv8jqGXvNA/NwMAQbC6B0KVy/yOoZe80D83AwBBqLoHQpXL/I6hl7zQPzcDAEGgugdClcv8jqGXvNA/NwMAQZi6B0LakKbT49K00T83AwBBkLoHQtqQptPj0rTRPzcDAEGIugdC2pCm0+PStNE/NwMAQYC6B0LakKbT49K00T83AwBB+LkHQtqQptPj0rTRPzcDAEHwuQdCn9bPl6aOrdI/NwMAQei5B0KLrsXq7N7M0T83AwBBwL0HQpOKkJKNt6DaPzcDAEG4vQdCk4qQko23oNo/NwMAQbC9B0KTipCSjbeg2j83AwBBqL0HQpOKkJKNt6DaPzcDAEGgvQdCk4qQko23oNo/NwMAQZi9B0KTipCSjbeg2j83AwBBkL0HQpOKkJKNt6DaPzcDAEGIvQdCk4qQko23oNo/NwMAQYC9B0KTipCSjbeg2j83AwBBmMAHQQBBqAEQEBpB2MIHQr38mI7Iv8TZPzcDAEHQwgdCvfyYjsi/xNk/NwMAQcjCB0K9/JiOyL/E2T83AwBBwMIHQr38mI7Iv8TZPzcDAEG4wgdCvfyYjsi/xNk/NwMAQbDCB0K9/JiOyL/E2T83AwBBqMIHQr38mI7Iv8TZPzcDAEGgwgdCpbyv2vK5s9o/NwMAQZjCB0KlvK/a8rmz2j83AwBBkMIHQqW8r9ryubPaPzcDAEGIwgdCpbyv2vK5s9o/NwMAQYDCB0LhqMm6grSi2z83AwBB+MEHQuGoybqCtKLbPzcDAEHwwQdC4ajJuoK0ots/NwMAQejBB0LhqMm6grSi2z83AwBB4MEHQpyV45qSrpHcPzcDAEHYwQdCs8OQneGV+9s/NwMAQdDBB0Lq2POS5o6Y2T83AwBByMEHQpTultuxou/VPzcDAEHAwQdCksCatdm1/dI/NwMAQbjFB0Li+5ywuYSZ6j83AwBB6MIHQqKWiO+EmcbEPzcDAEHwxQdCgofo0quwu/I/NwMAQejFB0KCh+jSq7C78j83AwBB4MUHQoKH6NKrsLvyPzcDAEHYxQdC4ajJuoK0ovM/NwMAQdDFB0KN/dHhqeaN8z83AwBByMUHQrLUspjujcTwPzcDAEHAxQdCn+yLirC78Ow/NwMAQYjEB0KKkvSduu3yyj83AwBBgMQHQoqS9J267fLKPzcDAEH4wwdCipL0nbrt8so/NwMAQfDDB0KKkvSduu3yyj83AwBB6MMHQoqS9J267fLKPzcDAEHgwwdCipL0nbrt8so/NwMAQdjDB0KKkvSduu3yyj83AwBB0MMHQoqS9J267fLKPzcDAEHIwwdC1b39pMnU8cs/NwMAQcDDB0LVvf2kydTxyz83AwBBuMMHQtW9/aTJ1PHLPzcDAEGwwwdC1b39pMnU8cs/NwMAQajDB0Kh6Yas2LvwzD83AwBBoMMHQqHphqzYu/DMPzcDAEGYwwdCoemGrNi78Mw/NwMAQZDDB0Kh6Yas2LvwzD83AwBBiMMHQuyUkLPnou/NPzcDAEGAwwdC0/yQqLX01c0/NwMAQfjCB0La4fWH1pDAyj83AwBB8MIHQtOesJGa8OzHPzcDAEHgwgdCvfyYjsi/xNk/NwMAQYjIB0Li+5ywuYSZ4j83AwBBiMkHQq3bqbzcqO3oPzcDAEGAyQdCrdupvNyo7eg/NwMAQfjIB0Kt26m83Kjt6D83AwBB8MgHQq3bqbzcqO3oPzcDAEHoyAdCouWG69Ss1Ok/NwMAQeDIB0Ki5Ybr1KzU6T83AwBB2MgHQqLlhuvUrNTpPzcDAEHQyAdCouWG69Ss1Ok/NwMAQcjIB0LrnuyLirC76j83AwBBwMgHQuue7IuKsLvqPzcDAEG4yAdC657si4qwu+o/NwMAQbDIB0LrnuyLirC76j83AwBBqMgHQuGoybqCtKLrPzcDAEGgyAdCjf3R4anmjes/NwMAQZjIB0Ky1LKY7o3E6D83AwBBkMgHQvGblPzsuvDkPzcDAEHYxgdCrdupvNyo7fA/NwMAQdDGB0Kt26m83Kjt8D83AwBByMYHQq3bqbzcqO3wPzcDAEHAxgdCrdupvNyo7fA/NwMAQbjGB0Kt26m83Kjt8D83AwBBsMYHQq3bqbzcqO3wPzcDAEGoxgdCrdupvNyo7fA/NwMAQaDGB0Kt26m83Kjt8D83AwBBmMYHQoz9iqSzrNTxPzcDAEGQxgdCjP2KpLOs1PE/NwMAQYjGB0KM/Yqks6zU8T83AwBBgMYHQoz9iqSzrNTxPzcDAEH4xQdCgofo0quwu/I/NwMAQajJB0Kt26m83Kjt6D83AwBBoMkHQq3bqbzcqO3oPzcDAEGYyQdCrdupvNyo7eg/NwMAQZDJB0Kt26m83Kjt6D83AwBB8L4HQQBBqAEQECIAQYgIakK/r8Pg8bLc3z83AwAgAEGACGpCr7Sj5Jzgidw/NwMAIABC4f/jrrPNjtk/NwP4ByAAQqyh2/eJkLfWPzcD8AcgAEKf1s+Xpo6t0j83A8AGIABCn9bPl6aOrdI/NwO4BiAAQp/Wz5emjq3SPzcDsAYgAEKf1s+Xpo6t0j83A6gGIABCn9bPl6aOrdI/NwOgBiAAQp/Wz5emjq3SPzcDmAYgAEKf1s+Xpo6t0j83A5AGIABCn9bPl6aOrdI/NwOIBiAAQuSb+dvoyaXTPzcDgAYgAELkm/nb6Mml0z83A/gFIABC5Jv52+jJpdM/NwPwBSAAQuSb+dvoyaXTPzcD6AUgAEKp4aKgq4We1D83A+AFIABCqeGioKuFntQ/NwPYBSAAQqnhoqCrhZ7UPzcD0AUgAEKp4aKgq4We1D83A8gFIABC7qbM5O3AltU/NwPABSAAQr2Jrc3ktP7UPzcDuAUgAEKVworByfb80T83A7AFIABCoIumlb23h88/NwOoBSAAQq+svdHR8fXLPzcDoAVBsMkHQvuouL2U3J7SPzcDAEG4yQdCs+bMmbPmzOE/NwMAQYDIB0L2nujYwIrE3D83AwBB+McHQvae6NjAisTcPzcDAEHwxwdC9p7o2MCKxNw/NwMAQejHB0L2nujYwIrE3D83AwBB4McHQvae6NjAisTcPzcDAEHYxwdC9p7o2MCKxNw/NwMAQdDHB0L2nujYwIrE3D83AwBByMcHQvae6NjAisTcPzcDAEHAxwdC0/yQqLX01d0/NwMAQbjHB0LT/JCotfTV3T83AwBBsMcHQtP8kKi19NXdPzcDAEGoxwdC0/yQqLX01d0/NwMAQaDHB0Kq5s3viN3n3j83AwBBmMcHQqrmze+I3efePzcDAEGQxwdCqubN74jd594/NwMAQYjHB0Kq5s3viN3n3j83AwBBgMcHQraR6e7ox/nfPzcDAEHAyQdCgICAgICAgJLAADcDAEHIyQdCgICAgICAgJLAADcDAEHQyQdCgICAgICAgPo/NwMAQdjJB0Kz5syZs+bM6T83AwBB4MkHQoCAgICAgID4PzcDAEHoyQdCgICAgICAgJLAADcDAEHwyQdCgICAgICAkKjAADcDAEH4yQdCgICAgICAkKjAADcDAEGAygdCgICAgICAwKTAADcDAEGIygdCgICAgICA4JrAADcDAEGQygdCuL2U3J6Krs8/NwMAQdjKB0L808aX3cmYwD83AwBB0MoHQrnoorbn96fFPzcDAEHIygdC/NPGl93JmMg/NwMAQcDKB0L6/anjy+6kvD83AwBBmMoHQoCAgICAgMCkwAA3AwBB4MoHQoCAgICAgICqwAA3AwBB6MoHQoCAgICAgKCrwAA3AwBB8MoHQoCAgICAgMCswAA3AwBB+MoHQoCAgICAgICvwAA3AwBBgMsHQoCAgICAgMCswAA3AwBBmMsHQoCAgICAgID8PzcDAEGQywdC5syZs+bMmf8/NwMAQajLB0KAgICAgICA+D83AwBBoMsHQubMmbPmzJn7PzcDAEG4ywdCgICAgICAgPw/NwMAQbDLB0LmzJmz5syZ+T83AwBB+MsHQoCAgICAgICCwAA3AwBB8MsHQoCAgICAgID8PzcDAEHoywdCmrPmzJmz5vw/NwMAQeDLB0L20fD6qLi9/D83AwBBwMsHQs2Zs+bMmbP+PzcDAEGAzAdCmrPmzJmz5oDAADcDAEGIzAdCgICAgICAgIDAADcDAEGQzQdCs+bMmbPmzPk/NwMAQdDMB0KAgICAgICA/D83AwBBsMwHQoCAgICAgID8PzcDAEGgzAdCs+bMmbPmzPk/NwMAQfDNB0KAgICAgICA+D83AwBB6M0HQoCAgICAgID4PzcDAEHgzQdCgICAgICAgPg/NwMAQYDOB0Kas+bMmbPm9D83AwBB+M0HQoCAgICAgID4PzcDAEHIzgdCgICAgICAgPg/NwMAQcDOB0KAgICAgICA+D83AwBBuM4HQoCAgICAgID4PzcDAEGwzgdCgICAgICAgPg/NwMAQZDOB0L7qLi9lNye0j83AwBB0M4HQrPmzJmz5szpPzcDAEHYzgdC9tHw+qi4vfQ/NwMAQeDOB0K4vZTcnoqu5z83AwBB6M4HQoCAgJDK0sauwgA3AwBB8M4HQpqz5syZs+b6PzcDAEH4zgdCgICAgICA0M/AADcDAEGAzwdCgICAgICAgIDAADcDAEGIzwdCgICAgICAgJ/AADcDAEHIzwdCgICAgICAgPg/NwMAQcDPB0KAgICAgICA6D83AwBBuM8HQpqz5syZs+b0PzcDAEGwzwdCmrPmzJmz5uQ/NwMAQZDPB0KAgICAgICA+D83AwBB0M8HQpqz5syZs+b8PzcDAEHYzwdCzZmz5syZs/Y/NwMAQeDQB0KAgICAgICAisAANwMAQaDQB0KAgICAgICAkMAANwMAQYDQB0KAgICAgICAkMAANwMAQfDPB0KAgICAgICAisAANwMAQYjRB0IANwMAQZDRB0IANwMAQZjRB0KAgICAgICA+D83AwBBoNEHQoCAgICAgID8PzcDAEGw0QdCgICAgICAgPg/NwMAQajRB0KAgICAgICA/D83AwBBuNEHQoCAgICAgID4PzcDAEH40QdCgICAgICAgPg/NwMAQfDRB0KAgICAgICA+D83AwBB6NEHQoCAgICAgID4PzcDAEHg0QdCgICAgICAgPg/NwMAQcDRB0KAgICAgICA+D83AwBBgNIHQpTcnoquj4X5PzcDAEGI0gdCgICAgICAgIrAADcDAEGQ0gdCgICAgICAgPg/NwMAQZjSB0KAgICAgICAgMAANwMAQaDSB0IANwMAQajSB0Kas+bMmbPm3D83AwBBsNIHQgA3AwBBuNIHQpqz5syZs+bUPzcDAEHA0gdCztCQgpyE9fg/NwMAQcjSB0LS8PqouL2U3D83AwBB0NIHQubMmbPmzJn7PzcDAEHY0gdCgICAgICAgIrAADcDAEHg0gdCgICAgICAgIrAADcDAEHo0gdCgICAgICAgIrAADcDAEHw0gdCgICAgICAgIrAADcDAEH40gdCgICAgICAgIrAADcDAEGA0wdCgICAgICAgIrAADcDAEGI0wdCgICAgICAgIrAADcDAEGQ0wdCADcDAEGY0wdCADcDAEGw0wdCgICAgICAgPg/NwMAQdjUB0LNmbPmzJmz9j83AwBBuNMHQrPmzJmz5sz1PzcDAEHw1QdCgICAgICAgK/AADcDAEH41QdCgICAgICAgKrAADcDAEGA1gdCgICAgICAwKzAADcDAEGI1gdCADcDAEGQ1gdC+v2p48vupLQ/NwMAQZjWB0Kas+bMmbPm3D83AwBBoNYHQs7QkIKchPX4PzcDAEGo1gdC5syZs+bMmfs/NwMAQbDWB0IANwMAQbjWB0IANwMAQcDWB0IANwMAQcjWB0KAgICAgICA+D83AwBB0NYHQoCAgICAgIDwPzcDAEHY1gdCgICAgICAgPA/NwMAQeDWB0KAgICQytLGrsIANwMAQejWB0KAgICAgICAn8AANwMAQfDWB0KAgICAgICAgMAANwMAQeDUB0Kz5syZs+bM9T83AwBB+NYHQgA3AwBBgNcHQoCAgICAgICAwAA3AwBBiNcHQoCAgICAgICOwAA3AwBBkNcHQoCAgICAgOXJwAA3AwBBmNcHQq2G8diu3I2NPzcDAEGg1wdCgICAgICA5M/AADcDAEGo1wdCgICAgICA5M/AADcDAEGw1wdCgICAgICA5M/AADcDAEG41wdCgICAgICA5M/AADcDAEHA1wdCgICAgICA5M/AADcDAEHI1wdCgICAgICA5M/AADcDAEHY1wdCgICAgICAwKzAADcDAEHQ1wdCgICAgICA5M/AADcDAEHg1wdCzZmz5syZs/o/NwMAQfjXB0KAgICAgICAhsAANwMAQfDXB0LmzJmz5syZ+z83AwBBiNgHQrPmzJmz5sz5PzcDAEGA2AdC5syZs+bMmfM/NwMAQZjYB0Kas+bMmbPm7D83AwBBkNgHQrPmzJmz5szxPzcDAEGg2AdCgICAgICAgOA/NwMAQajYB0KAgICAgIDArMAANwMAQbDYB0KAgICAgICA+D83AwBB6NgHQo7o14/CgoDYPzcDAEHg2AdC5eygprLk2es/NwMAQdjYB0Kdv4rHg97a8T83AwBB+NkHQpqz5syZs+bsPzcDAEHw2QdC9tHw+qi4vew/NwMAQYDaB0KAgICAgICAisAANwMAQYjaB0KAgICAgICAgMAANwMAQZDaB0KAgICAgICAksAANwMAQZjaB0KAgICAgICAmsAANwMAQaDaB0Kz5syZs+bMg8AANwMAQajaB0KAgICAgICAg8AANwMAQbDaB0KAgICAgICA+D83AwBBuNoHQoCAgICAgID4PzcDAEHA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ACABQQxBBCAGG2oiCSAJKAIAIAhrNgIAIAQgBWshBCAAKAI8IAFBCGogASAGGyIBIAcgBmsiByADQQxqEAAQHUUNAAsLIARBf0cNAQsgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCECACDAELIABBADYCHCAAQgA3AxAgACAAKAIAQSByNgIAQQAgB0ECRg0AGiACIAEoAgRrCyEEIANBIGokACAEC0EBAX8jAEEQayIDJAAgACgCPCABpyABQiCIpyACQf8BcSADQQhqEAEQHSEAIAMpAwghASADQRBqJABCfyABIAAbCwkAIAAoAjwQBAsyAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQDSAAIAAoAhQgAWo2AhQgAguTBQIGfgF/IAEgASgCAEEHakF4cSIBQRBqNgIAIAACfCABKQMAIQQgASkDCCEFIwBBIGsiASQAAkAgBUL///////////8AgyIDQoCAgICAgMCAPH0gA0KAgICAgIDA/8MAfVQEQCAFQgSGIARCPIiEIQMgBEL//////////w+DIgRCgYCAgICAgIAIWgRAIANCgYCAgICAgIDAAHwhAgwCCyADQoCAgICAgICAQH0hAiAEQoCAgICAgICACIVCAFINASACIANCAYN8IQIMAQsgBFAgA0KAgICAgIDA//8AVCADQoCAgICAgMD//wBRG0UEQCAFQgSGIARCPIiEQv////////8Dg0KAgICAgICA/P8AhCECDAELQoCAgICAgID4/wAhAiADQv///////7//wwBWDQBCACECIANCMIinIghBkfcASQ0AIAQhAiAFQv///////z+DQoCAgICAgMAAhCIDIQYCQCAIQYH3AGsiAEHAAHEEQCACIABBQGqthiEGQgAhAgwBCyAARQ0AIAYgAK0iB4YgAkHAACAAa62IhCEGIAIgB4YhAgsgASACNwMQIAEgBjcDGCABIQACQEGB+AAgCGsiCEHAAHEEQCADIAhBQGqtiCEEQgAhAwwBCyAIRQ0AIANBwAAgCGuthiAEIAitIgKIhCEEIAMgAoghAwsgACAENwMAIAAgAzcDCCABKQMIQgSGIAEpAwAiBEI8iIQhAiABKQMQIAEpAxiEQgBSrSAEQv//////////D4OEIgRCgYCAgICAgIAIWgRAIAJCAXwhAgwB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4NwNKwMAEAVB8KwOKwMAEAVB+J4OKwMAEAVB8NsNKwMAEAVB+NsNKwMAEAVB6KwOKwMAEAVB+K8OKwMAEAVB8K8OKwMAEAVBkNoMKwMAEAVByNoMKwMAEAVB2NoMKwMAEAVBoNoMKwMAEAVBwNoMKwMAEAVB0NoMKwMAEAVBqNYMKwMAEAVB2NYMKwMAEAVB6NYMKwMAEAVBsNYMKwMAEAVB0NYMKwMAEAVB4NYMKwMAEAVBwNQMKwMAEAVBwKwOKwMAEAVByKwOKwMAEAVBqKwOKwMAEAVBsKwOKwMAEAVBuKwOKwMAEAVBoKwOKwMAEAVBsOoMKwMAEAVBkKEOKwMAEAVB2J0OKwMAEAVBwJ0OKwMAEAVB2KAOKwMAEAVB4KAOKwMAEAVB6KAOKwMAEAVB+KAOKwMAEAVBiKEOKwMAEAVB0KAOKwMAEAVB8KAOKwMAEAVBgKEOKwMAEAVBiKAOKwMAEAVB0MQNKwMAEAVBkJ8OKwMAEAVByJsOKwMAEAVB0JsOKwMAEAVB2JsOKwMAEAVB6JsOKwMAEAVB+JsOKwMAEAVBwJsOKwMAEAVB4JsOKwMAEAVB8JsOKwMAEAVB4J0OKwMAEAVByJ0OKwMAEAVB0J0OKwMAEAVBuJ0OKwMAEAVBsO8LKwMAEAVBiJwOKwMAEAVBkJwOKwMAEAVBmJwOKwMAEAVBqJwOKwMAEAVBuJwOKwMAEAVBgJwOKwMAEAVBoJwOKwMAEAVBsJwOKwMAEAVB0JwOKwMAEAVByJwOKwMAEAVB4IcNKwMAEAVByOANKwMAEAVBiOANKwMAEAVBgOANKwMAEAVB4N8NKwMAEAVB+PoNKwMAEAVBsOANKwMAEAVBqOANKwMAEAVBgPsNKwMAEAVB8IMNKwMAEAVBqI4IKwMAEAVBwPIMKwMAEAVB8PoNKwMAEAVB6PoNKwMAEAVBsNwNKwMAEAVByNsNKwMAEAVBqNwNKwMAEAVBwPoNKwMAEAVBiNkNKwMAEAVBkPcNKwMAEAVBuPQNKwMAEAVBsPQNKwMAEAVBqPQNKwMAEAVBoPQNKwMAEAVBqLMMKwMAEAVB4PINKwMAEAVB2PINKwMAEAVB0PINKwMAEAVByPINKwMAEAVB8N8NKwMAEAVBoI4IKwMAEAVBkOcNKwMAEAVBiOENKwMAEAVBkOENKwMAEAVBmOENKwMAEAVBqOENKwMAEAVBuOENKwMAEAVBgOENKwMAEAVBoOENKwMAEAVBsOENKwMAEAVB4MQNKwMAEAVB6OANKwMAEAVBgOUMKwMAEAVB+I4IKwMAEAVByNQMKwMAEAVB0N4NKwMAEAVByN4NKwMAEAVBwN4NKwMAEAVBuN4NKwMAEAVBqN4NKwMAEAVBoN4NKwMAEAVBkN0NKwMAEAVBsNsNKwMAEAVB6NsNKwMAEAVBwNoNKwMAEAVB8NoNKwMAEAVBmNwNKwMAEAVBiNoNKwMAEAVBkNoNKwMAEAVBgNoNKwMAEAVBkPYMKwMAEAVBsN0NKwMAEAVB6NINKwMAEAVBwJwOKwMAEAVBoN0NKwMAEAVBmN0NKwMAEAVBwNsNKwMAEAVB0NoNKwMAEAVBoNwNKwMAEAVByO4LKwMAEAVBmNoNKwMAEAVB0IEKKwMAEAVBwNwNKwMAEAVBuNsNKwMAEAVByNoNKwMAEAVB0NsNKwMAEAVB8NINKwMAEAVB4OYIKwMAEAVB+PUMKwMAEAVB4MENKwMAEAULQfC0DkHwtA4oAgBBAWo2AgALQfS0DigCACAORg0BQQAhAEGYoQxBmKEMKwMAQaDYBysDACIIQaivDisDAKKgOQMAQajECEGoxAgrAwAgCEGotA4rAwCaQaCdDisDAKFBmLQOKwMAoUHYoQ4rAwCgQYi0DisDAKCioDkDAEHQzAhB0MwIKwMAIAhB2NENKwMAQaDSDSsDAKBBgNINKwMAoUH40Q0rAwChQejRDSsDAKFBuJ8OKwMAoaKgOQMAQeCkDEHgpAwrAwAgCEGgrw4rAwCioDkDAEHwpwxB8KcMKwMAIAhBmK8OKwMAoqA5AwBBgMcIQYDHCCsDACAIQYCuDisDAKKgOQMAQZjHCEGYxwgrAwAgCEHwrQ4rAwCioDkDAEGgxwhBoMcIKwMAIAhB4K0OKwMAoqA5AwBBqMcIQajHCCsDACAIQdCtDisDAKKgOQMAQZDHCEGQxwgrAwAgCEHArQ4rAwCioDkDAEGIxwhBiMcIKwMAIAhBsK0OKwMAoqA5AwBBmPELQZjxCysDACAIQYD5DSsDAEHw+A0rAwChoqA5AwBBwMEIQcDBCCsDACAIQaCMDisDAKKgOQMAQbDBCEGwwQgrAwAgCEGQjA4rAwCioDkDAEGIxQhBiMUIKwMAIAhB0K8OKwMAQaCeDisDACIEoEH4nQ4rAwAiB6BBmN4NKwMAoEGI6gwrAwChQfDFCCsDACIDoUGong4rAwAiBaGioDkDAEGAxghBgMYIKwMAIAggAyAEoUHI3Q0rAwChQYjGCCsDACIGoaKgOQMAQbjFCEG4xQgrAwAgCEGAoA4rAwAiBEHwnw4rAwAiA6GioDkDAEHIxQhByMUIKwMAIAggA0Hgnw4rAwAiA6GioDkDAEHYxQhB2MUIKwMAIAggA0HQnw4rAwAiA6GioDkDAEHoxQggCCADokHoxQgrAwCgOQMAQZjGCEGYxggrAwAgCCAGIAehQcDdDSsDAKGioDkDAEHwxAggCCAFIAShokHwxAgrAwCgOQMAQcjGCEHIxggrAwAgCEHorw4rAwCioDkDAEGA9gtBgPYLKwMAIAhB4IoOKwMAQdCKDisDAKGioDkDAEGI9gtBiPYLKwMAIAhB2IoOKwMAQcCKDisDAKGioDkDAEH49QtB+PULKwMAIAhByIoOKwMAQeCvDisDAKGioDkDAEGg9gtBoPYLKwMAIAhBgN4NKwMAQcCvDisDAKGioDkDAEHgvwhB4L8IKwMAIAhBsPoNKwMAoqA5AwBB6PQLQej0CysDACAIQZCvDisDAKKgOQMAQaj0C0Go9AsrAwAgCEGw9QsrAwCioDkDAEGA8wtBgPMLKwMAQYj0CysDAEGg2AcrAwAiA6KgOQMAQdjxC0HY8QsrAwAgA0Hg8gsrAwCioDkDAEGQ2QxBoLIMKwMAQbDfDCgCABAWOQMAQZjZDEGosgwrAwBB5OIMKAIAEBY5AwBBoNkMQbCyDCsDAEHI2QwoAgAQFjkDAEGo2QxBuLIMKwMAQcziDCgCABAWOQMAQaj3C0Go9wsrAwBBgK8OKwMAQaDYBysDACIDoqA5AwBB4PQLQeD0CysDACADQfCuDisDAKKgOQMAQbD3C0Gw9wsrAwAgA0Hgrg4rAwCioDkDAEG48wtBuPMLKwMAIANB0K4OKwMAoqA5AwBBuPcLQbj3CysDACADQcCuDisDAKKgOQMAQZDyC0GQ8gsrAwAgA0Gwrg4rAwCioDkDAEGA+QtBgPkLKwMAIANB8PgLKwMAQcCYDisDAKGioDkDAEGI+QtBiPkLKwMAIANB+PgLKwMAQciYDisDAKGioDkDAEHQiQxB0IkMKwMAIANBgIcMKwMAQbCTDisDAKGioDkDAEH4igxB+IoMKwMAIANBqIgMKwMAQdiUDisDAKGioDkDAEHYiQxB2IkMKwMAIANBiIcMKwMAQbiTDisDAKGioDkDAEGAiwxBgIsMKwMAIANBsIgMKwMAQeCUDisDAKGioDkDAEG4mgxBuJoMKwMAIANB6JcMKwMAQYiODisDAKGioDkDAEHgmwxB4JsMKwMAIANBkJkMKwMAQbCPDisDAKGioDkDAEHAmgxBwJoMKwMAIANB8JcMKwMAQZCODisDAKGioDkDAEHomwxB6JsMKwMAIANBmJkMKwMAQbiPDisDAKGioDkDAEHImgxByJoMKwMAIANB+JcMKwMAQZiODisDAKGioDkDAEHwmwxB8JsMKwMAIANBoJkMKwMAQcCPDisDAKGioDkDAEGgzghBoM4IKwMAIANBkIoOKwMAQeDOCCsDAKGioDkDAEGozghBqM4IKwMAIANBmIoOKwMAQejOCCsDAKGioDkDAEGwzghBsM4IKwMAIANBoIoOKwMAQfDOCCsDAKGioDkDAEG4zghBuM4IKwMAIANBqIoOKwMAQfjOCCsDAKGioDkDAEGw7gtBsO4LKwMAIANBuIoOKwMAQbjuCysDAKGioDkDAEHY7QtB2O0LKwMAIANBsIoOKwMAQeDtCysDAKGioDkDAEGw7wtBsO8LKwMAIANBoJ0OKwMAQZCdDisDAKBB2KEOKwMAoUHAoQ4rAwChoqA5AwBBqO8LQajvCysDACADQbCdDisDAKKgOQMAQZCdDEGQnQwrAwAgA0HgiQ4rAwBB0IkOKwMAoaKgOQMAQZidDEGYnQwrAwAgA0HYiQ4rAwBBwIkOKwMAoaKgOQMAQYidDEGInQwrAwAgA0HIiQ4rAwBBqJ0OKwMAoaKgOQMAQcDzC0HA8wsrAwAgA0Ggrg4rAwCioDkDAEH4nQxBoNgHKwMAIgVB8IwOKwMAIgaiQfidDCsDAKA5AwBBsJ0MQbCdDCsDACAFQeCNDisDACIEQcCNDisDACIDoaKgOQMAQcidDEHInQwrAwAgBSADQZiNDisDACIDoaKgOQMAQeCdDEHgnQwrAwAgBSADIAahoqA5AwBB8I4IQfCOCCsDACAFQYifDisDAEHgng4rAwChIAShoqA5AwBBwPQLQcD0CysDACAFQeCsDisDAEGw9QsrAwChoqA5AwBBmPMLQZjzCysDACAFQbCbDisDAEGI9AsrAwChoqA5AwBB8PELQfDxCysDACAFQZj0DSsDAEHg8gsrAwChoqA5AwBBmKAMQZigDCsDACAFQbiJDisDAEGoiQ4rAwChoqA5AwBBoKAMQaCgDCsDACAFQbCJDisDAEGYiQ4rAwChoqA5AwBBkKAMQZCgDCsDACAFQaCJDisDAEGYjA4rAwChoqA5AwBB2KAMQdigDCsDACAFQZCJDisDAEGAiQ4rAwChoqA5AwBB4KAMQeCgDCsDACAFQYiJDisDAEHwiA4rAwChoqA5AwBB0KAMQdCgDCsDACAFQfiIDisDAEGIjA4rAwChoqA5AwBB0KMMQdCjDCsDACAFQeiIDisDAEHYiA4rAwChoqA5AwBB2KMMQdijDCsDACAFQeCIDisDAEHIiA4rAwChoqA5AwBByKMMQcijDCsDACAFQdCIDisDAEH4iw4rAwChoqA5AwBBmKQMQZikDCsDACAFQcCIDisDAEGwiA4rAwChoqA5AwBBoKQMQaCkDCsDACAFQbiIDisDAEGgiA4rAwChoqA5AwBBkKQMQZCkDCsDACAFQaiIDisDAEHoiw4rAwChoqA5AwBByKYMQcimDCsDACAFQZiIDisDAEGIiA4rAwChoqA5AwBB0KYMQdCmDCsDACAFQZCIDisDAEH4hw4rAwChoqA5AwBBwKYMQcCmDCsDACAFQYCIDisDAEHYiw4rAwChoqA5AwBBqKcMQainDCsDACAFQfCHDisDAEHghw4rAwChoqA5AwBBsKcMQbCnDCsDACAFQeiHDisDAEHQhw4rAwChoqA5AwBBoKcMQaCnDCsDACAFQdiHDisDAEHIiw4rAwChoqA5AwBB0KkMQdCpDCsDACAFQciHDisDAEG4hw4rAwChoqA5AwBB2KkMQdipDCsDACAFQcCHDisDAEGohw4rAwChoqA5AwBByKkMQcipDCsDACAFQbCHDisDAEG4iw4rAwChoqA5AwBBsKoMQbCqDCsDACAFQaCHDisDAEGQhw4rAwChoqA5AwBBuKoMQbiqDCsDAEGYhw4rAwBBgIcOKwMAoUGg2AcrAwAiA6KgOQMAQaiqDEGoqgwrAwAgA0GIhw4rAwBBqIsOKwMAoaKgOQMAQeCsDEHgrAwrAwAgA0H4hg4rAwBB6IYOKwMAoaKgOQMAQeisDEHorAwrAwAgA0Hwhg4rAwBB2IYOKwMAoaKgOQMAQdisDEHYrAwrAwAgA0Hghg4rAwBBmIsOKwMAoaKgOQMAQaCtDEGgrQwrAwAgA0HQhg4rAwBBwIYOKwMAoaKgOQMAQaitDEGorQwrAwAgA0HIhg4rAwBBsIYOKwMAoaKgOQMAQZitDEGYrQwrAwAgA0G4hg4rAwBBiIsOKwMAoaKgOQMAQdivDEHYrwwrAwAgA0Gohg4rAwBBmIYOKwMAoaKgOQMAQeCvDEHgrwwrAwAgA0Gghg4rAwBBiIYOKwMAoaKgOQMAQdCvDEHQrwwrAwAgA0GQhg4rAwBB+IoOKwMAoaKgOQMAQZiwDEGYsAwrAwAgA0GAhg4rAwBB8IUOKwMAoaKgOQMAQaCwDEGgsAwrAwAgA0H4hQ4rAwBB4IUOKwMAoaKgOQMAQZCwDEGQsAwrAwAgA0HohQ4rAwBB6IoOKwMAoaKgOQMAQejHCEHoxwgrAwAgA0GgrQ4rAwCioDkDAEHoyQhB6MkIKwMAIANBmK0OKwMAoqA5AwBBsMoIQbDKCCsDACADQZCtDisDAKKgOQMAQfjKCEH4yggrAwAgA0GIrQ4rAwCioDkDAEGIyQhBiMkIKwMAIANBgK0OKwMAoqA5AwBBwMgIQcDICCsDACADQfisDisDAKKgOQMAQcjvC0HI7wsrAwAgA0HA6gwrAwCioDkDAANAQQAhAQNAQQAhAgNAIAJBA3QiDSABQQV0IgwgAEGgBWwiC0GQ3AhqamoiCiAKKwMAIAMgC0HA7AlqIAxqIA1qKwMAIAtBsOcIaiAMaiANaisDAKEgC0Gg5w1qIAxqIA1qKwMAoKKgOQMAIAJBAWoiAkEERw0ACyABQQFqIgFBFUcNAAsgAEEBaiIAQQJHDQALQZjyC0GY8gsrAwAgA0GQrg4rAwCioDkDAEGojghBqI4IKwMAIANB6OANKwMAQbj6DSsDAKGioDkDAEGQswxBkLMMKwMAIANByNkNKwMAQfDZDSsDAKGioDkDAEGYswxBmLMMKwMAIANBkNoMKwMAQdD/BysDAKBBoIUIKwMAoEHw2A0rAwCgQbjqDCsDAKFBiNkNKwMAoUHQ1g0rAwChoqA5AwBBoLMMQaCzDCsDACADQcD3DSsDAKKgOQMAQaizDEGoswwrAwAgA0GotA4rAwBBiLQOKwMAoUGQnQ4rAwChoqA5AwBBuNUMQbjVDCsDACADQcjyDCsDAEGI1gwrAwChoqA5AwBBuLMMQbizDCsDACADQfDfDSsDAJpBwNMNKwMAoUGo1gwrAwCgQYDyDSsDAKCioDkDAEEAIQpBACEMQaDYBysDACEDQQEhAkEBIQADQCAMQagBbCILQcCLCGoiASABKwMAIAxBA3RBgLMOaisDACALQZCBB2orAwChIAtB0KkOaisDAKEgA6KgOQMAIAAhAUEAIQBBASEMIAENAAsDQCAKQagBbCIBQcCLCGoiACAAKwMIIAFBkIEHaiIAKwMAIAArAwihIAFB0KkOaisDCKEgA6KgOQMIQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwMQIAFBkIEHaiIAKwMIIAArAxChIAFB0KkOaisDEKEgA6KgOQMQQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwMYIAFBkIEHaiIAKwMQIAArAxihIAFB0KkOaisDGKEgA6KgOQMYQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwMgIAFBkIEHaiIAKwMYIAArAyChIAFB0KkOaisDIKEgA6KgOQMgQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwMoIAFBkIEHaiIAKwMgIAArAyihIAFB0KkOaisDKKEgA6KgOQMoQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwMwIAFBkIEHaiIAKwMoIAArAzChIAFB0KkOaisDMKEgA6KgOQMwQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwM4IAFBkIEHaiIAKwMwIAArAzihIAFB0KkOaisDOKEgA6KgOQM4QQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwNAIAFBkIEHaiIAKwM4IAArA0ChIAFB0KkOaisDQKEgA6KgOQNAQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwNIIAFBkIEHaiIAKwNAIAArA0ihIAFB0KkOaisDSKEgA6KgOQNIQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwNQIAFBkIEHaiIAKwNIIAArA1ChIAFB0KkOaisDUKEgA6KgOQNQQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwNYIAFBkIEHaiIAKwNQIAArA1ihIAFB0KkOaisDWKEgA6KgOQNYQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwNgIAFBkIEHaiIAKwNYIAArA2ChIAFB0KkOaisDYKEgA6KgOQNgQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwNoIAFBkIEHaiIAKwNgIAArA2ihIAFB0KkOaisDaKEgA6KgOQNoQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwNwIAFBkIEHaiIAKwNoIAArA3ChIAFB0KkOaisDcKEgA6KgOQNwQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcCLCGoiACAAKwN4IAFBkIEHaiIAKwNwIAArA3ihIAFB0KkOaisDeKEgA6KgOQN4QQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwOAASABQZCBB2oiACsDeCAAKwOAAaEgAUHQqQ5qKwOAAaEgA6KgOQOAAUEBIQIgCkEBcSEAQQAhCiAADQALA0AgCkGoAWwiAUHAiwhqIgAgACsDiAEgAUGQgQdqIgArA4ABIAArA4gBoSABQdCpDmorA4gBoSADoqA5A4gBQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcCLCGoiACAAKwOQASABQZCBB2oiACsDiAEgACsDkAGhIAFB0KkOaisDkAGhIAOioDkDkAFBASECIApBAXEhAEEAIQogAA0ACwNAIApBqAFsIgFBwIsIaiIAIAArA5gBIAFBkIEHaiIAKwOQASAAKwOYAaEgAUHQqQ5qKwOYAaEgA6KgOQOYAUEBIQogAkEBcSEAQQAhAiAADQALA0AgAkGoAWwiAUHAiwhqIgAgACsDoAEgAUGQgQdqIgArA5gBIAArA6ABoSABQdCpDmorA6ABoSADoqA5A6ABQQEhAiAKQQFxIQBBACEKIAANAAsDQEEAIQADQEEAIQIDQCACQQN0Ig0gAEEFdCIMIApBoAVsIgtBgM0JampqIgEgASsDACALQZD7DWogDGogDWorAwAgC0HA1wlqIAxqIA1qKwMAoSADoqA5AwAgAkEBaiICQQRHDQALIABBAWoiAEEVRw0ACyAKQQFqIgpBAkcNAAtBACEKA0BBACEMA0BBACECA0AgAkEDdCILIAxBBXQiASAKQaAFbCIAQYC+DGpqaiAAQZD2CGogAWogC2orAwAgCkHQAmxBwMgMaiAMQQR0aiACQQJ0aigCABAWOQMAIAJBAWoiAkEERw0ACyAMQQFqIgxBFUcNAAsgCkEBaiIKQQJHDQALQQAhDEHQmghB0JoIKwMAQaDYBysDACIERAAAAAAAAAAAoiIDoDkDAEH4mwhB+JsIKwMAIAOgOQMAQQEhCkEBIQBBACECA0AgAkGoAWwiAkHQmghqIgEgASsDECACQdCYDmorAxAgAkGApw5qKwMQoSACQdDqDGorAxChIAJBwJIGaisDEKEgBKKgOQMQIAAhAUEAIQBBASECIAENAAsDQCAMQagBbCIBQdCaCGoiACAAKwMYIAFB0JgOaisDGCABQYCnDmorAxihIAFB0OoMaisDGKEgAUHAkgZqKwMYoSAEoqA5AxhBASEMIApBAXEhAEEAIQogAA0AC0HYmghB2JoIKwMAIAOgOQMAQYCcCEGAnAgrAwAgA6A5AwBBACECQQEhAANAIApBqAFsIgpB0JoIaiIBIAErAyAgCkHQ6gxqIgErAxggCkGApw5qKwMgoSABKwMgoSAEoqA5AyAgACEBQQAhAEEBIQogAQ0ACwNAIAJBqAFsIgFB0JoIaiIAIAArAyggAUHQ6gxqIgArAyAgAUGApw5qKwMooSAAKwMooSAEoqA5AyhBASECIAxBAXEhAEEAIQwgAA0ACwNAIAxBqAFsIgFB0JoIaiIAIAArAzAgAUHQ6gxqIgArAyggAUGApw5qKwMwoSAAKwMwoSAEoqA5AzBBASEMIAJBAXEhAEEAIQIgAA0AC0EAIQFBACEKQaDYBysDACEEQQEhAEEBIQIDQCAKQagBbCILQdCaCGoiCiAKKwM4IAtB0OoMaiIKKwMwIAtBgKcOaisDOKEgCisDOKEgBKKgOQM4IAIhC0EAIQJBASEKIAsNAAsDQCABQagBbCICQdCaCGoiASABKwNAIAJB0OoMaiIBKwM4IAJBgKcOaisDQKEgASsDQKEgBKKgOQNAQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdCaCGoiACAAKwNIIAJB0OoMaiIAKwNAIAJBgKcOaisDSKEgACsDSKEgBKKgOQNIQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdCaCGoiASABKwNQIAJB0OoMaiIBKwNIIAJBgKcOaisDUKEgASsDUKEgBKKgOQNQQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdCaCGoiACAAKwNYIAJB0OoMaiIAKwNQIAJBgKcOaisDWKEgACsDWKEgBKKgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdCaCGoiASABKwNgIAJB0OoMaiIBKwNYIAJBgKcOaisDYKEgASsDYKEgBKKgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdCaCGoiACAAKwNoIAJB0OoMaiIAKwNgIAJBgKcOaisDaKEgACsDaKEgBKKgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdCaCGoiASABKwNwIAJB0OoMaiIBKwNoIAJBgKcOaisDcKEgASsDcKEgBKKgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdCaCGoiACAAKwN4IAJB0OoMaiIAKwNwIAJBgKcOaisDeKEgACsDeKEgBKKgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdCaCGoiASABKwOAASACQdDqDGoiASsDeCACQYCnDmorA4ABoSABKwOAAaEgBKKgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHQmghqIgAgACsDiAEgAkHQ6gxqIgArA4ABIAJBgKcOaisDiAGhIAArA4gBoSAEoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdCaCGoiASABKwOQASACQdDqDGoiASsDiAEgAkGApw5qKwOQAaEgASsDkAGhIASioDkDkAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB0JoIaiIAIAArA5gBIAJB0OoMaiIAKwOQASACQYCnDmorA5gBoSAAKwOYAaEgBKKgOQOYAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHQmghqIgEg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ACACDQALA0AgAEGoAWwiAkGglQhqIgAgACsDoAEgAkGg7QxqIgArA5gBIAJBsKQOaisDoAGhIAArA6ABoSADoqA5A6ABQQEhACABIQJBACEBIAINAAtBmMEIQZjBCCsDAEGgiw4rAwAgA6KgOQMAQYjBCEGIwQgrAwAgA0GQiw4rAwCioDkDAEHgqgxB4KoMKwMAIANBwPgNKwMAQfjgDSsDAKGioDkDAEEBIQJBACEMA0AgDEGoAWwiC0HwzQxqIgogCisDACADIAtBwP4GaisDAJogC0Gw+QxqKwMAoaKgOQMAIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfDNDGoiASABKwMIIAMgAkHA/gZqIgErAwAgASsDCKEgAkGw+QxqKwMIoaKgOQMIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwMQIAMgAkHA/gZqIgArAwggACsDEKEgAkGw+QxqKwMQoaKgOQMQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwMYIAMgAkHA/gZqIgErAxAgASsDGKEgAkGw+QxqKwMYoaKgOQMYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwMgIAMgAkHA/gZqIgArAxggACsDIKEgAkGw+QxqKwMgoaKgOQMgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwMoIAMgAkHA/gZqIgErAyAgASsDKKEgAkGw+QxqKwMooaKgOQMoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwMwIAMgAkHA/gZqIgArAyggACsDMKEgAkGw+QxqKwMwoaKgOQMwQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwM4IAMgAkHA/gZqIgErAzAgASsDOKEgAkGw+QxqKwM4oaKgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwNAIAMgAkHA/gZqIgArAzggACsDQKEgAkGw+QxqKwNAoaKgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwNIIAMgAkHA/gZqIgErA0AgASsDSKEgAkGw+QxqKwNIoaKgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwNQIAMgAkHA/gZqIgArA0ggACsDUKEgAkGw+QxqKwNQoaKgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwNYIAMgAkHA/gZqIgErA1AgASsDWKEgAkGw+QxqKwNYoaKgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDNDGoiACAAKwNgIAMgAkHA/gZqIgArA1ggACsDYKEgAkGw+QxqKwNgoaKgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwNoIAMgAkHA/gZqIgErA2AgASsDaKEgAkGw+QxqKwNooaKgOQNoQQEhASAAIQJBACEAIAINAAtBACEBQQAhDEGg2AcrAwAhBEEBIQBBASECA0AgDEGoAWwiC0HwzQxqIgogCisDcCALQcD+BmoiCisDaCAKKwNwoSALQbD5DGorA3ChIASioDkDcCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHwzQxqIgEgASsDeCACQcD+BmoiASsDcCABKwN4oSACQbD5DGorA3ihIASioDkDeEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwzQxqIgAgACsDgAEgAkHA/gZqIgArA3ggACsDgAGhIAJBsPkMaisDgAGhIASioDkDgAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJB8M0MaiIBIAErA4gBIAJBwP4GaiIBKwOAASABKwOIAaEgAkGw+QxqKwOIAaEgBKKgOQOIAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwzQxqIgAgACsDkAEgAkHA/gZqIgArA4gBIAArA5ABoSACQbD5DGorA5ABoSAEoqA5A5ABQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfDNDGoiASABKwOYASACQcD+BmoiASsDkAEgASsDmAGhIAJBsPkMaisDmAGhIASioDkDmAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8M0MaiIAIAArA6ABIAJBwP4GaiIAKwOYASAAKwOgAaEgAkGw+QxqKwOgAaEgBKKgOQOgAUEBIQAgASECQQAhASACDQALQfCfCEHwnwgrAwAgBEQAAAAAAAAAAKIiA6A5AwBBmKEIQZihCCsDACADoDkDAEGAoAhBgKAIKwMAIAOgOQMAQYigCEGIoAgrAwAgA6A5AwBBqKEIQaihCCsDACADoDkDAEGwoQhBsKEIKwMAIAOgOQMAQQEhAkEAIQwDQCAMQagBbCILQfCfCGoiCiAKKwMgIAtB0JAOaisDICALQeChDmorAyChIAtB8O8MaisDIKEgBKKgOQMgIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfCfCGoiASABKwMoIAJB0JAOaisDKCACQeChDmorAyihIAJB8O8MaiIBKwMooSABKwMgoCAEoqA5AyhBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8J8IaiIAIAArAzAgAkHQkA5qKwMwIAJB4KEOaisDMKEgAkHw7wxqIgArAzChIAArAyigIASioDkDMEEBIQAgASECQQAhASACDQALQfifCEH4nwgrAwAgA6A5AwBBoKEIQaChCCsDACADoDkDAEEBIQJBACEMA0AgDEGoAWwiC0HwnwhqIgogCisDOCALQfDvDGoiCisDMCALQeChDmorAzihIAorAzihIASioDkDOCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHwnwhqIgEgASsDQCACQfDvDGoiASsDOCACQeChDmorA0ChIAErA0ChIASioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwnwhqIgAgACsDSCACQfDvDGoiACsDQCACQeChDmorA0ihIAArA0ihIASioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHwnwhqIgEgASsDUCACQfDvDGoiASsDSCACQeChDmorA1ChIAErA1ChIASioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwnwhqIgAgACsDWCACQfDvDGoiACsDUCACQeChDmorA1ihIAArA1ihIASioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHwnwhqIgEgASsDYCACQfDvDGoiASsDWCACQeChDmorA2ChIAErA2ChIASioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwnwhqIgAgACsDaCACQfDvDGoiACsDYCACQeChDmor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",BA(R)||(R=a(R));function MA(g){try{if(g==R&&y)return new Uint8Array(y);var D=wA(g);if(D)return D;if(O)return O(g);throw"both async and sync fetching of the wasm failed"}catch(s){V(s)}}function NA(){if(!y&&(o||K)){if(typeof fetch=="function"&&!oA(R))return fetch(R,{credentials:"same-origin"}).then(function(g){if(!g.ok)throw"failed to load wasm binary file at \'"+R+"\'";return g.arrayBuffer()}).catch(function(){return MA(R)});if(G)return new Promise(function(g,D){G(R,function(s){g(new Uint8Array(s))},D)})}return Promise.resolve().then(function(){return MA(R)})}function tA(){var g={a:qA};function D(k,r){var f=k.exports;Q.asm=f,d=Q.asm.f,S(d.buffer),_=Q.asm.o,aA(Q.asm.g),nA()}HA();function s(k){D(k.instance)}function e(k){return NA().then(function(r){return WebAssembly.instantiate(r,g)}).then(function(r){return r}).then(k,function(r){N("failed to asynchronously prepare wasm: "+r),V(r)})}function u(){return!y&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(R)&&!oA(R)&&typeof fetch=="function"?fetch(R,{credentials:"same-origin"}).then(function(k){var r=WebAssembly.instantiateStreaming(k,g);return r.then(s,function(f){return N("wasm streaming compile failed: "+f),N("falling back to ArrayBuffer instantiation"),e(s)})}):e(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(g,D);return z}catch(k){return N("Module.instantiateWasm callback failed with error: "+k),!1}return u().catch(C),{}}function CA(g){for(;g.length>0;){var D=g.shift();if(typeof D=="function"){D(Q);continue}var s=D.func;typeof s=="number"?D.arg===void 0?iA(s)():iA(s)(D.arg):s(D.arg===void 0?null:D.arg)}}function iA(g){return _.get(g)}function OA(g,D,s){Y.copyWithin(g,D,D+s)}function hA(g){V("OOM")}function uA(g){Y.length,hA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(g,D){var s=AA.buffers[g];D===0||D===10?((g===1?n:N)(Z(s,0)),s.length=0):s.push(D)},varargs:void 0,get:function(){AA.varargs+=4;var g=j[AA.varargs-4>>2];return g},getStr:function(g){var D=l(g);return D},get64:function(g,D){return g}};function zA(g){return 0}function jA(g,D,s,e,u){}function fA(g,D,s,e){for(var u=0,z=0;z<s;z++){var k=j[D>>2],r=j[D+4>>2];D+=8;for(var f=0;f<r;f++)AA.printChar(g,Y[k+f]);u+=r}return j[e>>2]=u,0}var yA=typeof atob=="function"?atob:function(g){var D="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",e,u,z,k,r,f,b,J=0;g=g.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do k=D.indexOf(g.charAt(J++)),r=D.indexOf(g.charAt(J++)),f=D.indexOf(g.charAt(J++)),b=D.indexOf(g.charAt(J++)),e=k<<2|r>>4,u=(r&15)<<4|f>>2,z=(f&3)<<6|b,s=s+String.fromCharCode(e),f!==64&&(s=s+String.fromCharCode(u)),b!==64&&(s=s+String.fromCharCode(z));while(J<g.length);return s};function mA(g){try{for(var D=yA(g),s=new Uint8Array(D.length),e=0;e<D.length;++e)s[e]=D.charCodeAt(e);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function wA(g){if(BA(g))return mA(g.slice(EA.length))}var qA={c:OA,d:uA,e:zA,b:jA,a:fA};tA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},gA=Q.stackAlloc=function(){return(gA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=U;var QA;W=function g(){QA||DA(),QA||(W=g)};function DA(g){if(v>0||(X(),v>0))return;function D(){QA||(QA=!0,Q.calledRun=!0,!F&&(kA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),GA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),D()},1)):D()}if(Q.run=DA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return DA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
    for (const g of e) {
      const n = this.modelSpec.implVars.get(g);
      n && r.push(n);
    }
    const Q = this.outputs.startTime, i = this.outputs.endTime, o = this.outputs.saveFreq;
    let B = createImplOutputs(r, Q, i, o);
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
