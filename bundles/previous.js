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
  ms = function(w, E) {
    E = E || {};
    var l = typeof w;
    if (l === "string" && w.length > 0)
      return B(w);
    if (l === "number" && isFinite(w))
      return E.long ? a(w) : s(w);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(w)
    );
  };
  function B(w) {
    if (w = String(w), !(w.length > 100)) {
      var E = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        w
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
  function s(w) {
    var E = Math.abs(w);
    return E >= o ? Math.round(w / o) + "d" : E >= r ? Math.round(w / r) + "h" : E >= e ? Math.round(w / e) + "m" : E >= A ? Math.round(w / A) + "s" : w + "ms";
  }
  function a(w) {
    var E = Math.abs(w);
    return E >= o ? g(w, E, o, "day") : E >= r ? g(w, E, r, "hour") : E >= e ? g(w, E, e, "minute") : E >= A ? g(w, E, A, "second") : w + " ms";
  }
  function g(w, E, l, f) {
    var m = E >= l * 1.5;
    return Math.round(w / l) + " " + f + (m ? "s" : "");
  }
  return ms;
}
var common, hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function A(e) {
    o.debug = o, o.default = o, o.coerce = g, o.disable = s, o.enable = Q, o.enabled = a, o.humanize = requireMs(), o.destroy = w, Object.keys(e).forEach((E) => {
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
      function n(...C) {
        if (!n.enabled)
          return;
        const t = n, D = Number(/* @__PURE__ */ new Date()), c = D - (l || D);
        t.diff = c, t.prev = l, t.curr = D, l = D, C[0] = o.coerce(C[0]), typeof C[0] != "string" && C.unshift("%O");
        let d = 0;
        C[0] = C[0].replace(/%([a-zA-Z%])/g, (h, N) => {
          if (h === "%%")
            return "%";
          d++;
          const O = o.formatters[N];
          if (typeof O == "function") {
            const F = C[d];
            h = O.call(t, F), C.splice(d, 1), d--;
          }
          return h;
        }), o.formatArgs.call(t, C), (t.log || o.log).apply(t, C);
      }
      return n.namespace = E, n.useColors = o.useColors(), n.color = o.selectColor(E), n.extend = i, n.destroy = o.destroy, Object.defineProperty(n, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (m !== o.namespaces && (m = o.namespaces, I = o.enabled(E)), I),
        set: (C) => {
          f = C;
        }
      }), typeof o.init == "function" && o.init(n), n;
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
      let f = 0, m = 0, I = -1, n = 0;
      for (; f < E.length; )
        if (m < l.length && (l[m] === E[f] || l[m] === "*"))
          l[m] === "*" ? (I = m, n = f, m++) : (f++, m++);
        else if (I !== -1)
          m = I + 1, n++, f = n;
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
    function g(E) {
      return E instanceof Error ? E.stack || E.message : E;
    }
    function w() {
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
      const g = "color: " + this.color;
      a.splice(1, 0, g, "color: inherit");
      let w = 0, E = 0;
      a[0].replace(/%[a-zA-Z%]/g, (l) => {
        l !== "%%" && (w++, l === "%c" && (E = w));
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
        const g = !Q;
        if (Q = !0, !g || i)
          try {
            B = e(B, a);
          } catch (w) {
            return s.error(w);
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
            } catch (w) {
              return o.error(w);
            }
          else
            a = s;
          const g = r.from(a).subscribe({
            next(w) {
              o.next(w);
            },
            error(w) {
              o.error(w);
            },
            complete() {
              const w = i.indexOf(g);
              w >= 0 && i.splice(w, 1), B();
            }
          });
          i.push(g);
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
      const a = (w) => {
        if (!Q) {
          Q = !0;
          try {
            B(i(w));
          } catch (E) {
            s(E);
          }
        }
      }, g = (w) => {
        try {
          B(o(w));
        } catch (E) {
          a(E);
        }
      };
      if (this.initHasRun || this.subscribe({ error: a }), this.state === "fulfilled")
        return B(o(this.firstValue));
      if (this.state === "rejected")
        return Q = !0, B(i(this.rejection));
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
    function s(w) {
      try {
        g(o.next(w));
      } catch (E) {
        B(E);
      }
    }
    function a(w) {
      try {
        g(o.throw(w));
      } catch (E) {
        B(E);
      }
    }
    function g(w) {
      w.done ? Q(w.value) : i(w.value).then(s, a);
    }
    g((o = o.apply(A, e || [])).next());
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
    function s(w) {
      try {
        g(o.next(w));
      } catch (E) {
        B(E);
      }
    }
    function a(w) {
      try {
        g(o.throw(w));
      } catch (E) {
        B(E);
      }
    }
    function g(w) {
      w.done ? Q(w.value) : i(w.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
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
  function s(g) {
    return function(w) {
      return a([g, w]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = g[0] & 2 ? i.return : g[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, g[1])).done) return Q;
      switch (i = 0, Q && (g = [g[0] & 2, Q.value]), g[0]) {
        case 0:
        case 1:
          Q = g;
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
    } catch (w) {
      g = [6, w], i = 0;
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
    var g;
    a !== o && (o = a, (g = i.onSet) == null || g.call(i));
  };
  return { varId: A, get: Q, set: B, reset: () => {
    B(e);
  }, callbacks: i };
}
var Series = class wA {
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
    return new wA(this.varId, e);
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
    for (let g = 0; g < a; g++)
      e[o++] = s[g];
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
    const g = A[o++], w = A[o++], E = {
      varIndex: B,
      subscriptIndices: a
    };
    let l;
    g >= 0 ? e ? l = e.slice(g, g + w) : l = new Float64Array(0) : l = void 0, r.push({
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
          for (const w of s)
            a.push(w.subscripts);
          const g = cartesianProductOf(a);
          for (const w of g) {
            const E = w.map((m) => m.id).join(","), l = w.map((m) => m.index), f = `${Q}[${E}]`;
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
    let g = 0;
    function w(M, h) {
      const N = g, O = M === "float64" ? Float64Array.BYTES_PER_ELEMENT : Int32Array.BYTES_PER_ELEMENT, F = Math.round(h * O), q = Math.ceil(F / 8) * 8;
      return g += q, N;
    }
    const E = w("int32", headerLengthInElements), l = w("float64", extrasLengthInElements), f = w("float64", o), m = w("float64", i), I = w("int32", Q), n = w("float64", s), C = w("int32", a), t = g;
    if (this.encoded === void 0 || this.encoded.byteLength < t) {
      const M = Math.ceil(t * 1.2);
      this.encoded = new ArrayBuffer(M), this.header.update(this.encoded, E, headerLengthInElements);
    }
    const D = this.header.view;
    let c = 0;
    D[c++] = l, D[c++] = extrasLengthInElements, D[c++] = f, D[c++] = o, D[c++] = m, D[c++] = i, D[c++] = I, D[c++] = Q, D[c++] = n, D[c++] = s, D[c++] = C, D[c++] = a, this.inputs.update(this.encoded, f, o), this.extras.update(this.encoded, l, extrasLengthInElements), this.outputs.update(this.encoded, m, i), this.outputIndices.update(this.encoded, I, Q), this.lookups.update(this.encoded, n, s), this.lookupIndices.update(this.encoded, C, a);
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
    const Q = o[i++], B = o[i++], s = o[i++], a = o[i++], g = o[i++], w = o[i++], E = o[i++], l = o[i++], f = o[i++], m = o[i++], I = o[i++], n = o[i++], C = B * Float64Array.BYTES_PER_ELEMENT, t = a * Float64Array.BYTES_PER_ELEMENT, D = w * Float64Array.BYTES_PER_ELEMENT, c = l * Int32Array.BYTES_PER_ELEMENT, d = m * Float64Array.BYTES_PER_ELEMENT, M = n * Int32Array.BYTES_PER_ELEMENT, h = e + C + t + D + c + d + M;
    if (A.byteLength < h)
      throw new Error("Buffer must be long enough to contain sections declared in header");
    this.extras.update(this.encoded, Q, B), this.inputs.update(this.encoded, s, a), this.outputs.update(this.encoded, g, w), this.outputIndices.update(this.encoded, E, l), this.lookups.update(this.encoded, f, m), this.lookupIndices.update(this.encoded, I, n);
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
    runModel: async (s, a, g) => {
      if (B)
        throw new Error("Async model runner has already been terminated");
      if (Q)
        throw new Error("Async model runner only supports one `runModel` call at a time");
      Q = !0, i.updateFromParams(s, a, g);
      let w;
      try {
        w = await e.runModel(Transfer(i.getEncodedBuffer()));
      } finally {
        Q = !1;
      }
      return i.updateFromEncodedBuffer(w), i.finalizeOutputs(a), a;
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
    function w(C, t) {
      return t.emptyStr() ? C : C.emptyStr() ? t : B`${C}${t}`;
    }
    A.strConcat = w;
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
    function n(C) {
      return new o(C.toString());
    }
    A.regexpCode = n;
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
    class i {
      constructor({ prefixes: g, parent: w } = {}) {
        this._names = {}, this._prefixes = g, this._parent = w;
      }
      toName(g) {
        return g instanceof e.Name ? g : this.name(g);
      }
      name(g) {
        return new e.Name(this._newName(g));
      }
      _newName(g) {
        const w = this._names[g] || this._nameGroup(g);
        return `${g}${w.index++}`;
      }
      _nameGroup(g) {
        var w, E;
        if (!((E = (w = this._parent) === null || w === void 0 ? void 0 : w._prefixes) === null || E === void 0) && E.has(g) || this._prefixes && !this._prefixes.has(g))
          throw new Error(`CodeGen: prefix "${g}" is not allowed in this scope`);
        return this._names[g] = { prefix: g, index: 0 };
      }
    }
    A.Scope = i;
    class Q extends e.Name {
      constructor(g, w) {
        super(w), this.prefix = g;
      }
      setValue(g, { property: w, itemIndex: E }) {
        this.value = g, this.scopePath = (0, e._)`.${new e.Name(w)}[${E}]`;
      }
    }
    A.ValueScopeName = Q;
    const B = (0, e._)`\n`;
    class s extends i {
      constructor(g) {
        super(g), this._values = {}, this._scope = g.scope, this.opts = { ...g, _n: g.lines ? B : e.nil };
      }
      get() {
        return this._scope;
      }
      name(g) {
        return new Q(g, this._newName(g));
      }
      value(g, w) {
        var E;
        if (w.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const l = this.toName(g), { prefix: f } = l, m = (E = w.key) !== null && E !== void 0 ? E : w.ref;
        let I = this._values[f];
        if (I) {
          const t = I.get(m);
          if (t)
            return t;
        } else
          I = this._values[f] = /* @__PURE__ */ new Map();
        I.set(m, l);
        const n = this._scope[f] || (this._scope[f] = []), C = n.length;
        return n[C] = w.ref, l.setValue(w, { property: f, itemIndex: C }), l;
      }
      getValue(g, w) {
        const E = this._values[g];
        if (E)
          return E.get(w);
      }
      scopeRefs(g, w = this._values) {
        return this._reduceValues(w, (E) => {
          if (E.scopePath === void 0)
            throw new Error(`CodeGen: name "${E}" has no value`);
          return (0, e._)`${g}${E.scopePath}`;
        });
      }
      scopeCode(g = this._values, w, E) {
        return this._reduceValues(g, (l) => {
          if (l.value === void 0)
            throw new Error(`CodeGen: name "${l}" has no value`);
          return l.value.code;
        }, w, E);
      }
      _reduceValues(g, w, E = {}, l) {
        let f = e.nil;
        for (const m in g) {
          const I = g[m];
          if (!I)
            continue;
          const n = E[m] = E[m] || /* @__PURE__ */ new Map();
          I.forEach((C) => {
            if (n.has(C))
              return;
            n.set(C, o.Started);
            let t = w(C);
            if (t) {
              const D = this.opts.es5 ? A.varKinds.var : A.varKinds.const;
              f = (0, e._)`${f}${D} ${C} = ${t};${this.opts._n}`;
            } else if (t = l?.(C))
              f = (0, e._)`${f}${t}${this.opts._n}`;
            else
              throw new r(C);
            n.set(C, o.Completed);
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
      constructor(u, K, G) {
        super(), this.varKind = u, this.name = K, this.rhs = G;
      }
      render({ es5: u, _n: K }) {
        const G = u ? r.varKinds.var : this.varKind, z = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${G} ${this.name}${z};` + K;
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
      constructor(u, K, G) {
        super(), this.lhs = u, this.rhs = K, this.sideEffects = G;
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
      constructor(u, K, G, z) {
        super(u, G, z), this.op = K;
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
    class w extends Q {
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
        return this.nodes.reduce((K, G) => K + G.render(u), "");
      }
      optimizeNodes() {
        const { nodes: u } = this;
        let K = u.length;
        for (; K--; ) {
          const G = u[K].optimizeNodes();
          Array.isArray(G) ? u.splice(K, 1, ...G) : G ? u[K] = G : u.splice(K, 1);
        }
        return u.length > 0 ? this : void 0;
      }
      optimizeNames(u, K) {
        const { nodes: G } = this;
        let z = G.length;
        for (; z--; ) {
          const b = G[z];
          b.optimizeNames(u, K) || (V(u, b.names), G.splice(z, 1));
        }
        return G.length > 0 ? this : void 0;
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
    class n extends m {
    }
    n.kind = "else";
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
          const G = K.optimizeNodes();
          K = this.else = Array.isArray(G) ? new n(G) : G;
        }
        if (K)
          return u === !1 ? K instanceof C ? K : K.nodes : this.nodes.length ? this : new C(rA(u), K instanceof C ? [K] : K.nodes);
        if (!(u === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(u, K) {
        var G;
        if (this.else = (G = this.else) === null || G === void 0 ? void 0 : G.optimizeNames(u, K), !!(super.optimizeNames(u, K) || this.else))
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
      constructor(u, K, G, z) {
        super(), this.varKind = u, this.name = K, this.from = G, this.to = z;
      }
      render(u) {
        const K = u.es5 ? r.varKinds.var : this.varKind, { name: G, from: z, to: b } = this;
        return `for(${K} ${G}=${z}; ${G}<${b}; ${G}++)` + super.render(u);
      }
      get names() {
        const u = U(super.names, this.from);
        return U(u, this.to);
      }
    }
    class d extends t {
      constructor(u, K, G, z) {
        super(), this.loop = u, this.varKind = K, this.name = G, this.iterable = z;
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
      constructor(u, K, G) {
        super(), this.name = u, this.args = K, this.async = G;
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
    class N extends m {
      render(u) {
        let K = "try" + super.render(u);
        return this.catch && (K += this.catch.render(u)), this.finally && (K += this.finally.render(u)), K;
      }
      optimizeNodes() {
        var u, K;
        return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (K = this.finally) === null || K === void 0 || K.optimizeNodes(), this;
      }
      optimizeNames(u, K) {
        var G, z;
        return super.optimizeNames(u, K), (G = this.catch) === null || G === void 0 || G.optimizeNames(u, K), (z = this.finally) === null || z === void 0 || z.optimizeNames(u, K), this;
      }
      get names() {
        const u = super.names;
        return this.catch && S(u, this.catch.names), this.finally && S(u, this.finally.names), u;
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
        const G = this._extScope.value(u, K);
        return (this._values[G.prefix] || (this._values[G.prefix] = /* @__PURE__ */ new Set())).add(G), G;
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
      _def(u, K, G, z) {
        const b = this._scope.toName(K);
        return G !== void 0 && z && (this._constants[b.str] = G), this._leafNode(new B(u, b, G)), b;
      }
      // `const` declaration (`var` in es5 mode)
      const(u, K, G) {
        return this._def(r.varKinds.const, u, K, G);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(u, K, G) {
        return this._def(r.varKinds.let, u, K, G);
      }
      // `var` declaration with optional assignment
      var(u, K, G) {
        return this._def(r.varKinds.var, u, K, G);
      }
      // assignment code
      assign(u, K, G) {
        return this._leafNode(new s(u, K, G));
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
        for (const [G, z] of u)
          K.length > 1 && K.push(","), K.push(G), (G !== z || this.opts.es5) && (K.push(":"), (0, e.addCodeArg)(K, z));
        return K.push("}"), new e._Code(K);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(u, K, G) {
        if (this._blockNode(new C(u)), K && G)
          this.code(K).else().code(G).endIf();
        else if (K)
          this.code(K).endIf();
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
        return this._elseNode(new n());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(C, n);
      }
      _for(u, K) {
        return this._blockNode(u), K && this.code(K).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(u, K) {
        return this._for(new D(u), K);
      }
      // `for` statement for a range of values
      forRange(u, K, G, z, b = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
        const J = this._scope.toName(u);
        return this._for(new c(b, J, K, G), () => z(J));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(u, K, G, z = r.varKinds.const) {
        const b = this._scope.toName(u);
        if (this.opts.es5) {
          const J = K instanceof e.Name ? K : this.var("_arr", K);
          return this.forRange("_i", 0, (0, e._)`${J}.length`, (Z) => {
            this.var(b, (0, e._)`${J}[${Z}]`), G(b);
          });
        }
        return this._for(new d("of", z, b, K), () => G(b));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(u, K, G, z = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(u, (0, e._)`Object.keys(${K})`, G);
        const b = this._scope.toName(u);
        return this._for(new d("in", z, b, K), () => G(b));
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
        return this._leafNode(new w(u));
      }
      // `return` statement
      return(u) {
        const K = new h();
        if (this._blockNode(K), this.code(u), K.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(h);
      }
      // `try` statement
      try(u, K, G) {
        if (!K && !G)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const z = new N();
        if (this._blockNode(z), this.code(u), K) {
          const b = this.name("e");
          this._currNode = z.catch = new O(b), K(b);
        }
        return G && (this._currNode = z.finally = new F(), this.code(G)), this._endBlockNode(O, F);
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
        const G = this._nodes.length - K;
        if (G < 0 || u !== void 0 && G !== u)
          throw new Error(`CodeGen: wrong number of nodes: ${G} vs ${u} expected`);
        return this._nodes.length = K, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(u, K = e.nil, G, z) {
        return this._blockNode(new M(u, K, G)), z && this.code(z).endFunc(), this;
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
        const G = this._currNode;
        if (G instanceof u || K && G instanceof K)
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
    A.CodeGen = q;
    function S(y, u) {
      for (const K in u)
        y[K] = (y[K] || 0) + (u[K] || 0);
      return y;
    }
    function U(y, u) {
      return u instanceof e._CodeOrName ? S(y, u.names) : y;
    }
    function Y(y, u, K) {
      if (y instanceof e.Name)
        return G(y);
      if (!z(y))
        return y;
      return new e._Code(y._items.reduce((b, J) => (J instanceof e.Name && (J = G(J)), J instanceof e._Code ? b.push(...J._items) : b.push(J), b), []));
      function G(b) {
        const J = K[b.str];
        return J === void 0 || u[b.str] !== 1 ? b : (delete u[b.str], J);
      }
      function z(b) {
        return b instanceof e._Code && b._items.some((J) => J instanceof e.Name && u[J.str] === 1 && K[J.str] !== void 0);
      }
    }
    function V(y, u) {
      for (const K in u)
        y[K] = (y[K] || 0) - (u[K] || 0);
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
      return (u, K) => u === e.nil ? K : K === e.nil ? u : (0, e._)`${v(u)} ${y} ${v(K)}`;
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
    const { opts: h, self: N } = d;
    if (!h.strictSchema || typeof M == "boolean")
      return;
    const O = N.RULES.keywords;
    for (const F in M)
      O[F] || c(d, `unknown keyword: "${F}"`);
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
  function s({ topSchemaRef: d, schemaPath: M }, h, N, O) {
    if (!O) {
      if (typeof h == "number" || typeof h == "boolean")
        return h;
      if (typeof h == "string")
        return (0, A._)`${h}`;
    }
    return (0, A._)`${d}${M}${(0, A.getProperty)(N)}`;
  }
  util.schemaRefOrVal = s;
  function a(d) {
    return E(decodeURIComponent(d));
  }
  util.unescapeFragment = a;
  function g(d) {
    return encodeURIComponent(w(d));
  }
  util.escapeFragment = g;
  function w(d) {
    return typeof d == "number" ? `${d}` : d.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  util.escapeJsonPointer = w;
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
  function f({ mergeNames: d, mergeToName: M, mergeValues: h, resultToName: N }) {
    return (O, F, q, S) => {
      const U = q === void 0 ? F : q instanceof A.Name ? (F instanceof A.Name ? d(O, F, q) : M(O, F, q), q) : F instanceof A.Name ? (M(O, q, F), F) : h(F, q);
      return S === A.Name && !(U instanceof A.Name) ? N(O, U) : U;
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
    Object.keys(h).forEach((N) => d.assign((0, A._)`${M}${(0, A.getProperty)(N)}`, !0));
  }
  util.setEvaluated = I;
  const n = {};
  function C(d, M) {
    return d.scopeValue("func", {
      ref: M,
      code: n[M.code] || (n[M.code] = new e._Code(M.code))
    });
  }
  util.useFunc = C;
  var t;
  (function(d) {
    d[d.Num = 0] = "Num", d[d.Str = 1] = "Str";
  })(t || (util.Type = t = {}));
  function D(d, M, h) {
    if (d instanceof A.Name) {
      const N = M === t.Num;
      return h ? N ? (0, A._)`"[" + ${d} + "]"` : (0, A._)`"['" + ${d} + "']"` : N ? (0, A._)`"/" + ${d}` : (0, A._)`"/" + ${d}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return h ? (0, A.getProperty)(d).toString() : "/" + w(d);
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
    const e = requireCodegen(), r = requireUtil(), o = requireNames();
    A.keywordError = {
      message: ({ keyword: n }) => (0, e.str)`must pass "${n}" keyword validation`
    }, A.keyword$DataError = {
      message: ({ keyword: n, schemaType: C }) => C ? (0, e.str)`"${n}" keyword must be ${C} ($data)` : (0, e.str)`"${n}" keyword is invalid ($data)`
    };
    function i(n, C = A.keywordError, t, D) {
      const { it: c } = n, { gen: d, compositeRule: M, allErrors: h } = c, N = E(n, C, t);
      D ?? (M || h) ? a(d, N) : g(c, (0, e._)`[${N}]`);
    }
    A.reportError = i;
    function Q(n, C = A.keywordError, t) {
      const { it: D } = n, { gen: c, compositeRule: d, allErrors: M } = D, h = E(n, C, t);
      a(c, h), d || M || g(D, o.default.vErrors);
    }
    A.reportExtraError = Q;
    function B(n, C) {
      n.assign(o.default.errors, C), n.if((0, e._)`${o.default.vErrors} !== null`, () => n.if(C, () => n.assign((0, e._)`${o.default.vErrors}.length`, C), () => n.assign(o.default.vErrors, null)));
    }
    A.resetErrorsCount = B;
    function s({ gen: n, keyword: C, schemaValue: t, data: D, errsCount: c, it: d }) {
      if (c === void 0)
        throw new Error("ajv implementation error");
      const M = n.name("err");
      n.forRange("i", c, o.default.errors, (h) => {
        n.const(M, (0, e._)`${o.default.vErrors}[${h}]`), n.if((0, e._)`${M}.instancePath === undefined`, () => n.assign((0, e._)`${M}.instancePath`, (0, e.strConcat)(o.default.instancePath, d.errorPath))), n.assign((0, e._)`${M}.schemaPath`, (0, e.str)`${d.errSchemaPath}/${C}`), d.opts.verbose && (n.assign((0, e._)`${M}.schema`, t), n.assign((0, e._)`${M}.data`, D));
      });
    }
    A.extendErrors = s;
    function a(n, C) {
      const t = n.const("err", C);
      n.if((0, e._)`${o.default.vErrors} === null`, () => n.assign(o.default.vErrors, (0, e._)`[${t}]`), (0, e._)`${o.default.vErrors}.push(${t})`), n.code((0, e._)`${o.default.errors}++`);
    }
    function g(n, C) {
      const { gen: t, validateName: D, schemaEnv: c } = n;
      c.$async ? t.throw((0, e._)`new ${n.ValidationError}(${C})`) : (t.assign((0, e._)`${D}.errors`, C), t.return(!1));
    }
    const w = {
      keyword: new e.Name("keyword"),
      schemaPath: new e.Name("schemaPath"),
      // also used in JTD errors
      params: new e.Name("params"),
      propertyName: new e.Name("propertyName"),
      message: new e.Name("message"),
      schema: new e.Name("schema"),
      parentSchema: new e.Name("parentSchema")
    };
    function E(n, C, t) {
      const { createErrors: D } = n.it;
      return D === !1 ? (0, e._)`{}` : l(n, C, t);
    }
    function l(n, C, t = {}) {
      const { gen: D, it: c } = n, d = [
        f(c, t),
        m(n, t)
      ];
      return I(n, C, d), D.object(...d);
    }
    function f({ errorPath: n }, { instancePath: C }) {
      const t = C ? (0, e.str)`${n}${(0, r.getErrorPath)(C, r.Type.Str)}` : n;
      return [o.default.instancePath, (0, e.strConcat)(o.default.instancePath, t)];
    }
    function m({ keyword: n, it: { errSchemaPath: C } }, { schemaPath: t, parentSchema: D }) {
      let c = D ? C : (0, e.str)`${C}/${n}`;
      return t && (c = (0, e.str)`${c}${(0, r.getErrorPath)(t, r.Type.Str)}`), [w.schemaPath, c];
    }
    function I(n, { params: C, message: t }, D) {
      const { keyword: c, data: d, schemaValue: M, it: h } = n, { opts: N, propertyName: O, topSchemaRef: F, schemaPath: q } = h;
      D.push([w.keyword, c], [w.params, typeof C == "function" ? C(n) : C || (0, e._)`{}`]), N.messages && D.push([w.message, typeof t == "function" ? t(n) : t]), N.verbose && D.push([w.schema, M], [w.parentSchema, (0, e._)`${F}${q}`], [o.default.data, d]), O && D.push([w.propertyName, O]);
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
    const { gen: a, schema: g, validateName: w } = s;
    g === !1 ? B(s, !1) : typeof g == "object" && g.$async === !0 ? a.return(r.default.data) : (a.assign((0, e._)`${w}.errors`, null), a.return(!0));
  }
  boolSchema.topBoolOrEmptySchema = i;
  function Q(s, a) {
    const { gen: g, schema: w } = s;
    w === !1 ? (g.var(a, !1), B(s)) : g.var(a, !0);
  }
  boolSchema.boolOrEmptySchema = Q;
  function B(s, a) {
    const { gen: g, data: w } = s, E = {
      gen: g,
      keyword: "false schema",
      data: w,
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
    const { gen: c, data: d, opts: M } = t, h = w(D, M.coerceTypes), N = D.length > 0 && !(h.length === 0 && D.length === 1 && (0, e.schemaHasRulesForType)(t, D[0]));
    if (N) {
      const O = m(D, d, M.strictNumbers, Q.Wrong);
      c.if(O, () => {
        h.length ? E(t, D, h) : n(t);
      });
    }
    return N;
  }
  dataType.coerceAndCheckDataType = a;
  const g = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function w(t, D) {
    return D ? t.filter((c) => g.has(c) || D === "array" && c === "array") : [];
  }
  function E(t, D, c) {
    const { gen: d, data: M, opts: h } = t, N = d.let("dataType", (0, o._)`typeof ${M}`), O = d.let("coerced", (0, o._)`undefined`);
    h.coerceTypes === "array" && d.if((0, o._)`${N} == 'object' && Array.isArray(${M}) && ${M}.length == 1`, () => d.assign(M, (0, o._)`${M}[0]`).assign(N, (0, o._)`typeof ${M}`).if(m(D, M, h.strictNumbers), () => d.assign(O, M))), d.if((0, o._)`${O} !== undefined`);
    for (const q of c)
      (g.has(q) || q === "array" && h.coerceTypes === "array") && F(q);
    d.else(), n(t), d.endIf(), d.if((0, o._)`${O} !== undefined`, () => {
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
    let h;
    switch (t) {
      case "null":
        return (0, o._)`${D} ${M} null`;
      case "array":
        h = (0, o._)`Array.isArray(${D})`;
        break;
      case "object":
        h = (0, o._)`${D} && typeof ${D} == "object" && !Array.isArray(${D})`;
        break;
      case "integer":
        h = N((0, o._)`!(${D} % 1) && !isNaN(${D})`);
        break;
      case "number":
        h = N();
        break;
      default:
        return (0, o._)`typeof ${D} ${M} ${t}`;
    }
    return d === Q.Correct ? h : (0, o.not)(h);
    function N(O = o.nil) {
      return (0, o.and)((0, o._)`typeof ${D} == "number"`, O, c ? (0, o._)`isFinite(${D})` : o.nil);
    }
  }
  dataType.checkDataType = f;
  function m(t, D, c, d) {
    if (t.length === 1)
      return f(t[0], D, c, d);
    let M;
    const h = (0, i.toHash)(t);
    if (h.array && h.object) {
      const N = (0, o._)`typeof ${D} != "object"`;
      M = h.null ? N : (0, o._)`!${D} || ${N}`, delete h.null, delete h.array, delete h.object;
    } else
      M = o.nil;
    h.number && delete h.integer;
    for (const N in h)
      M = (0, o.and)(M, f(N, D, c, d));
    return M;
  }
  dataType.checkDataTypes = m;
  const I = {
    message: ({ schema: t }) => `must be ${t}`,
    params: ({ schema: t, schemaValue: D }) => typeof t == "string" ? (0, o._)`{type: ${t}}` : (0, o._)`{type: ${D}}`
  };
  function n(t) {
    const D = C(t);
    (0, r.reportError)(D, I);
  }
  dataType.reportTypeError = n;
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
    else Q === "array" && Array.isArray(s) && s.forEach((a, g) => o(i, g, a.default));
  }
  defaults.assignDefaults = r;
  function o(i, Q, B) {
    const { gen: s, compositeRule: a, data: g, opts: w } = i;
    if (B === void 0)
      return;
    const E = (0, A._)`${g}${(0, A.getProperty)(Q)}`;
    if (a) {
      (0, e.checkStrictMode)(i, `default is ignored for: ${E}`);
      return;
    }
    let l = (0, A._)`${E} === undefined`;
    w.useDefaults === "empty" && (l = (0, A._)`${l} || ${E} === null || ${E} === ""`), s.if(l, (0, A._)`${E} = ${(0, A.stringify)(B)}`);
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
    c.if(w(c, d, D, M.opts.ownProperties), () => {
      t.setParams({ missingProperty: (0, A._)`${D}` }, !0), t.error();
    });
  }
  code.checkReportMissingProp = i;
  function Q({ gen: t, data: D, it: { opts: c } }, d, M) {
    return (0, A.or)(...d.map((h) => (0, A.and)(w(t, D, h, c.ownProperties), (0, A._)`${M} = ${h}`)));
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
  function g(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} !== undefined`;
    return d ? (0, A._)`${M} && ${a(t, D, c)}` : M;
  }
  code.propertyInData = g;
  function w(t, D, c, d) {
    const M = (0, A._)`${D}${(0, A.getProperty)(c)} === undefined`;
    return d ? (0, A.or)(M, (0, A.not)(a(t, D, c))) : M;
  }
  code.noPropertyInData = w;
  function E(t) {
    return t ? Object.keys(t).filter((D) => D !== "__proto__") : [];
  }
  code.allSchemaProperties = E;
  function l(t, D) {
    return E(D).filter((c) => !(0, e.alwaysValidSchema)(t, D[c]));
  }
  code.schemaProperties = l;
  function f({ schemaCode: t, data: D, it: { gen: c, topSchemaRef: d, schemaPath: M, errorPath: h }, it: N }, O, F, q) {
    const S = q ? (0, A._)`${t}, ${D}, ${d}${M}` : D, U = [
      [r.default.instancePath, (0, A.strConcat)(r.default.instancePath, h)],
      [r.default.parentData, N.parentData],
      [r.default.parentDataProperty, N.parentDataProperty],
      [r.default.rootData, r.default.rootData]
    ];
    N.opts.dynamicRef && U.push([r.default.dynamicAnchors, r.default.dynamicAnchors]);
    const Y = (0, A._)`${S}, ${c.object(...U)}`;
    return F !== A.nil ? (0, A._)`${O}.call(${F}, ${Y})` : (0, A._)`${O}(${Y})`;
  }
  code.callValidateCode = f;
  const m = (0, A._)`new RegExp`;
  function I({ gen: t, it: { opts: D } }, c) {
    const d = D.unicodeRegExp ? "u" : "", { regExp: M } = D.code, h = M(c, d);
    return t.scopeValue("pattern", {
      key: h.toString(),
      ref: h,
      code: (0, A._)`${M.code === "new RegExp" ? m : (0, o.useFunc)(t, M)}(${c}, ${d})`
    });
  }
  code.usePattern = I;
  function n(t) {
    const { gen: D, data: c, keyword: d, it: M } = t, h = D.name("valid");
    if (M.allErrors) {
      const O = D.let("valid", !0);
      return N(() => D.assign(O, !1)), O;
    }
    return D.var(h, !0), N(() => D.break()), h;
    function N(O) {
      const F = D.const("len", (0, A._)`${c}.length`);
      D.forRange("i", 0, F, (q) => {
        t.subschema({
          keyword: d,
          dataProp: q,
          dataPropType: e.Type.Num
        }, h), D.if((0, A.not)(h), O);
      });
    }
  }
  code.validateArray = n;
  function C(t) {
    const { gen: D, schema: c, keyword: d, it: M } = t;
    if (!Array.isArray(c))
      throw new Error("ajv implementation error");
    if (c.some((F) => (0, e.alwaysValidSchema)(M, F)) && !M.opts.unevaluated)
      return;
    const N = D.let("valid", !1), O = D.name("_valid");
    D.block(() => c.forEach((F, q) => {
      const S = t.subschema({
        keyword: d,
        schemaProp: q,
        compositeRule: !0
      }, O);
      D.assign(N, (0, A._)`${N} || ${O}`), t.mergeValidEvaluated(S, O) || D.if((0, A.not)(N));
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
    const { gen: m, keyword: I, schema: n, parentSchema: C, it: t } = l, D = f.macro.call(t.self, n, C, t), c = g(m, I, D);
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
    const { gen: I, keyword: n, schema: C, parentSchema: t, $data: D, it: c } = l;
    a(c, f);
    const d = !D && f.compile ? f.compile.call(c.self, C, t, c) : f.validate, M = g(I, n, d), h = I.let("valid");
    l.block$data(h, N), l.ok((m = f.valid) !== null && m !== void 0 ? m : h);
    function N() {
      if (f.errors === !1)
        q(), f.modifying && B(l), S(() => l.error());
      else {
        const U = f.async ? O() : F();
        f.modifying && B(l), S(() => s(l, U));
      }
    }
    function O() {
      const U = I.let("ruleErrs", null);
      return I.try(() => q((0, A._)`await `), (Y) => I.assign(h, !1).if((0, A._)`${Y} instanceof ${c.ValidationError}`, () => I.assign(U, (0, A._)`${Y}.errors`), () => I.throw(Y))), U;
    }
    function F() {
      const U = (0, A._)`${M}.errors`;
      return I.assign(U, null), q(A.nil), U;
    }
    function q(U = f.async ? (0, A._)`await ` : A.nil) {
      const Y = c.opts.passContext ? e.default.this : e.default.self, V = !("compile" in f && !D || f.schema === !1);
      I.assign(h, (0, A._)`${U}${(0, r.callValidateCode)(l, M, Y, V)}`, f.modifying);
    }
    function S(U) {
      var Y;
      I.if((0, A.not)((Y = f.valid) !== null && Y !== void 0 ? Y : h), U);
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
  function g(l, f, m) {
    if (m === void 0)
      throw new Error(`keyword "${f}" failed to compile`);
    return l.scopeValue("keyword", typeof m == "function" ? { ref: m } : { ref: m, code: (0, A.stringify)(m) });
  }
  function w(l, f, m = !1) {
    return !f.length || f.some((I) => I === "array" ? Array.isArray(l) : I === "object" ? l && typeof l == "object" && !Array.isArray(l) : typeof l == I || m && typeof l > "u");
  }
  keyword.validSchemaType = w;
  function E({ schema: l, opts: f, self: m, errSchemaPath: I }, n, C) {
    if (Array.isArray(n.keyword) ? !n.keyword.includes(C) : n.keyword !== C)
      throw new Error("ajv implementation error");
    const t = n.dependencies;
    if (t?.some((D) => !Object.prototype.hasOwnProperty.call(l, D)))
      throw new Error(`parent schema must have dependencies of ${C}: ${t.join(",")}`);
    if (n.validateSchema && !n.validateSchema(l[C])) {
      const c = `keyword "${C}" value is invalid at path "${I}": ` + m.errorsText(n.validateSchema.errors);
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
  function r(Q, { keyword: B, schemaProp: s, schema: a, schemaPath: g, errSchemaPath: w, topSchemaRef: E }) {
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
      if (g === void 0 || w === void 0 || E === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: a,
        schemaPath: g,
        topSchemaRef: E,
        errSchemaPath: w
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  subschema.getSubschema = r;
  function o(Q, B, { dataProp: s, dataPropType: a, data: g, dataTypes: w, propertyName: E }) {
    if (g !== void 0 && s !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: l } = B;
    if (s !== void 0) {
      const { errorPath: m, dataPathArr: I, opts: n } = B, C = l.let("data", (0, A._)`${B.data}${(0, A.getProperty)(s)}`, !0);
      f(C), Q.errorPath = (0, A.str)`${m}${(0, e.getErrorPath)(s, a, n.jsPropertySyntax)}`, Q.parentDataProperty = (0, A._)`${s}`, Q.dataPathArr = [...I, Q.parentDataProperty];
    }
    if (g !== void 0) {
      const m = g instanceof A.Name ? g : l.let("data", g, !0);
      f(m), E !== void 0 && (Q.propertyName = E);
    }
    w && (Q.dataTypes = w);
    function f(m) {
      Q.data = m, Q.dataLevel = B.dataLevel + 1, Q.dataTypes = [], B.definedProperties = /* @__PURE__ */ new Set(), Q.parentData = B.data, Q.dataNames = [...B.dataNames, m];
    }
  }
  subschema.extendSubschemaData = o;
  function i(Q, { jtdDiscriminator: B, jtdMetadata: s, compositeRule: a, createErrors: g, allErrors: w }) {
    a !== void 0 && (Q.compositeRule = a), g !== void 0 && (Q.createErrors = g), w !== void 0 && (Q.allErrors = w), Q.jtdDiscriminator = B, Q.jtdMetadata = s;
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
  function e(o, i, Q, B, s, a, g, w, E, l) {
    if (B && typeof B == "object" && !Array.isArray(B)) {
      i(B, s, a, g, w, E, l);
      for (var f in B) {
        var m = B[f];
        if (Array.isArray(m)) {
          if (f in A.arrayKeywords)
            for (var I = 0; I < m.length; I++)
              e(o, i, Q, m[I], s + "/" + f + "/" + I, a, s, f, B, I);
        } else if (f in A.propsKeywords) {
          if (m && typeof m == "object")
            for (var n in m)
              e(o, i, Q, m[n], s + "/" + f + "/" + r(n), a, s, f, B, n);
        } else (f in A.keywords || o.allKeys && !(f in A.skipKeywords)) && e(o, i, Q, m, s + "/" + f, a, s, f, B);
      }
      Q(B, s, a, g, w, E, l);
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
  function i(I, n = !0) {
    return typeof I == "boolean" ? !0 : n === !0 ? !B(I) : n ? s(I) <= n : !1;
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
    for (const n in I) {
      if (Q.has(n))
        return !0;
      const C = I[n];
      if (Array.isArray(C) && C.some(B) || typeof C == "object" && B(C))
        return !0;
    }
    return !1;
  }
  function s(I) {
    let n = 0;
    for (const C in I) {
      if (C === "$ref")
        return 1 / 0;
      if (n++, !o.has(C) && (typeof I[C] == "object" && (0, A.eachItem)(I[C], (t) => n += s(t)), n === 1 / 0))
        return 1 / 0;
    }
    return n;
  }
  function a(I, n = "", C) {
    C !== !1 && (n = E(n));
    const t = I.parse(n);
    return g(I, t);
  }
  resolve.getFullPath = a;
  function g(I, n) {
    return I.serialize(n).split("#")[0] + "#";
  }
  resolve._getFullPath = g;
  const w = /#\/?$/;
  function E(I) {
    return I ? I.replace(w, "") : "";
  }
  resolve.normalizeId = E;
  function l(I, n, C) {
    return C = E(C), I.resolve(n, C);
  }
  resolve.resolveUrl = l;
  const f = /^[a-z_][-a-z0-9._]*$/i;
  function m(I, n) {
    if (typeof I == "boolean")
      return {};
    const { schemaId: C, uriResolver: t } = this.opts, D = E(I[C] || n), c = { "": D }, d = a(t, D, !1), M = {}, h = /* @__PURE__ */ new Set();
    return r(I, { allKeys: !0 }, (F, q, S, U) => {
      if (U === void 0)
        return;
      const Y = d + q;
      let V = c[U];
      typeof F[C] == "string" && (V = rA.call(this, F[C])), oA.call(this, F.$anchor), oA.call(this, F.$dynamicAnchor), c[q] = V;
      function rA(T) {
        const QA = this.opts.uriResolver.resolve;
        if (T = E(V ? QA(V, T) : T), h.has(T))
          throw O(T);
        h.add(T);
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
    function N(F, q, S) {
      if (q !== void 0 && !e(F, q))
        throw O(S);
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
  const A = requireBoolSchema(), e = requireDataType(), r = requireApplicability(), o = requireDataType(), i = requireDefaults(), Q = requireKeyword(), B = requireSubschema(), s = requireCodegen(), a = requireNames(), g = requireResolve(), w = requireUtil(), E = requireErrors();
  function l(k) {
    if (d(k) && (h(k), c(k))) {
      n(k);
      return;
    }
    f(k, () => (0, A.topBoolOrEmptySchema)(k));
  }
  validate.validateFunctionCode = l;
  function f({ gen: k, validateName: p, schema: H, schemaEnv: j, opts: L }, R) {
    L.code.es5 ? k.func(p, (0, s._)`${a.default.data}, ${a.default.valCxt}`, j.$async, () => {
      k.code((0, s._)`"use strict"; ${t(H, L)}`), I(k, L), k.code(R);
    }) : k.func(p, (0, s._)`${a.default.data}, ${m(L)}`, j.$async, () => k.code(t(H, L)).code(R));
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
  function n(k) {
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
    if (d(k) && (h(k), c(k))) {
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
    const { schema: H, gen: j, opts: L } = k;
    L.$comment && H.$comment && U(k), q(k), S(k);
    const R = j.const("_errs", a.default.errors);
    N(k, R), j.var(p, (0, s._)`${R} === ${a.default.errors}`);
  }
  function h(k) {
    (0, w.checkUnknownRules)(k), O(k);
  }
  function N(k, p) {
    if (k.opts.jtd)
      return rA(k, [], !1, p);
    const H = (0, e.getSchemaTypes)(k.schema), j = (0, e.coerceAndCheckDataType)(k, H);
    rA(k, H, !j, p);
  }
  function O(k) {
    const { schema: p, errSchemaPath: H, opts: j, self: L } = k;
    p.$ref && j.ignoreKeywordsWithRef && (0, w.schemaHasRulesButRef)(p, L.RULES) && L.logger.warn(`$ref: keywords ignored in schema at path "${H}"`);
  }
  function F(k) {
    const { schema: p, opts: H } = k;
    p.default !== void 0 && H.useDefaults && H.strictSchema && (0, w.checkStrictMode)(k, "default is ignored in the schema root");
  }
  function q(k) {
    const p = k.schema[k.opts.schemaId];
    p && (k.baseId = (0, g.resolveUrl)(k.opts.uriResolver, k.baseId, p));
  }
  function S(k) {
    if (k.schema.$async && !k.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function U({ gen: k, schemaEnv: p, schema: H, errSchemaPath: j, opts: L }) {
    const R = H.$comment;
    if (L.$comment === !0)
      k.code((0, s._)`${a.default.self}.logger.log(${R})`);
    else if (typeof L.$comment == "function") {
      const x = (0, s.str)`${j}/$comment`, eA = k.scopeValue("root", { ref: p.root });
      k.code((0, s._)`${a.default.self}.opts.$comment(${R}, ${x}, ${eA}.schema)`);
    }
  }
  function Y(k) {
    const { gen: p, schemaEnv: H, validateName: j, ValidationError: L, opts: R } = k;
    H.$async ? p.if((0, s._)`${a.default.errors} === 0`, () => p.return(a.default.data), () => p.throw((0, s._)`new ${L}(${a.default.vErrors})`)) : (p.assign((0, s._)`${j}.errors`, a.default.vErrors), R.unevaluated && V(k), p.return((0, s._)`${a.default.errors} === 0`));
  }
  function V({ gen: k, evaluated: p, props: H, items: j }) {
    H instanceof s.Name && k.assign((0, s._)`${p}.props`, H), j instanceof s.Name && k.assign((0, s._)`${p}.items`, j);
  }
  function rA(k, p, H, j) {
    const { gen: L, schema: R, data: x, allErrors: eA, opts: W, self: $ } = k, { RULES: X } = $;
    if (R.$ref && (W.ignoreKeywordsWithRef || !(0, w.schemaHasRulesButRef)(R, X))) {
      L.block(() => z(k, "$ref", X.all.$ref.definition));
      return;
    }
    W.jtd || T(k, p), L.block(() => {
      for (const AA of X.rules)
        iA(AA);
      iA(X.post);
    });
    function iA(AA) {
      (0, r.shouldUseGroup)(R, AA) && (AA.type ? (L.if((0, o.checkDataType)(AA.type, x, W.strictNumbers)), oA(k, AA), p.length === 1 && p[0] === AA.type && H && (L.else(), (0, o.reportTypeError)(k)), L.endIf()) : oA(k, AA), eA || L.if((0, s._)`${a.default.errors} === ${j || 0}`));
    }
  }
  function oA(k, p) {
    const { gen: H, schema: j, opts: { useDefaults: L } } = k;
    L && (0, i.assignDefaults)(k, p.type), H.block(() => {
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
        y(k.dataTypes, H) || K(k, `type "${H}" not allowed by context "${k.dataTypes.join(",")}"`);
      }), u(k, p);
    }
  }
  function _(k, p) {
    p.length > 1 && !(p.length === 2 && p.includes("null")) && K(k, "use allowUnionTypes to allow union type keyword");
  }
  function P(k, p) {
    const H = k.self.RULES.all;
    for (const j in H) {
      const L = H[j];
      if (typeof L == "object" && (0, r.shouldUseRule)(k.schema, L)) {
        const { type: R } = L.definition;
        R.length && !R.some((x) => v(p, x)) && K(k, `missing type "${R.join(",")}" for keyword "${j}"`);
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
  function K(k, p) {
    const H = k.schemaEnv.baseId + k.errSchemaPath;
    p += ` at "${H}" (strictTypes)`, (0, w.checkStrictMode)(k, p, k.opts.strictTypes);
  }
  class G {
    constructor(p, H, j) {
      if ((0, Q.validateKeywordUsage)(p, H, j), this.gen = p.gen, this.allErrors = p.allErrors, this.keyword = j, this.data = p.data, this.schema = p.schema[j], this.$data = H.$data && p.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, w.schemaRefOrVal)(p, this.schema, j, this.$data), this.schemaType = H.schemaType, this.parentSchema = p.schema, this.params = {}, this.it = p, this.def = H, this.$data)
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
      const { gen: j, schemaCode: L, schemaType: R, def: x } = this;
      j.if((0, s.or)((0, s._)`${L} === undefined`, H)), p !== s.nil && j.assign(p, !0), (R.length || x.validateSchema) && (j.elseIf(this.invalid$data()), this.$dataError(), p !== s.nil && j.assign(p, !1)), j.else();
    }
    invalid$data() {
      const { gen: p, schemaCode: H, schemaType: j, def: L, it: R } = this;
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
        if (L.validateSchema) {
          const W = p.scopeValue("validate$data", { ref: L.validateSchema });
          return (0, s._)`!${W}(${H})`;
        }
        return s.nil;
      }
    }
    subschema(p, H) {
      const j = (0, B.getSubschema)(this.it, p);
      (0, B.extendSubschemaData)(j, this.it, p), (0, B.extendSubschemaMode)(j, p);
      const L = { ...this.it, ...j, items: void 0, props: void 0 };
      return D(L, H), L;
    }
    mergeEvaluated(p, H) {
      const { it: j, gen: L } = this;
      j.opts.unevaluated && (j.props !== !0 && p.props !== void 0 && (j.props = w.mergeEvaluated.props(L, p.props, j.props, H)), j.items !== !0 && p.items !== void 0 && (j.items = w.mergeEvaluated.items(L, p.items, j.items, H)));
    }
    mergeValidEvaluated(p, H) {
      const { it: j, gen: L } = this;
      if (j.opts.unevaluated && (j.props !== !0 || j.items !== !0))
        return L.if(H, () => this.mergeEvaluated(p, s.Name)), !0;
    }
  }
  validate.KeywordCxt = G;
  function z(k, p, H, j) {
    const L = new G(k, H, p);
    "code" in H ? H.code(L, j) : L.$data && H.validate ? (0, Q.funcKeywordCode)(L, H) : "macro" in H ? (0, Q.macroKeywordCode)(L, H) : (H.compile || H.validate) && (0, Q.funcKeywordCode)(L, H);
  }
  const b = /^\/(?:[^~]|~0|~1)*$/, J = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function Z(k, { dataLevel: p, dataNames: H, dataPathArr: j }) {
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
      const X = +$[1];
      if (L = $[2], L === "#") {
        if (X >= p)
          throw new Error(W("property/index", X));
        return j[p - X];
      }
      if (X > p)
        throw new Error(W("data", X));
      if (R = H[p - X], !L)
        return R;
    }
    let x = R;
    const eA = L.split("/");
    for (const $ of eA)
      $ && (R = (0, s._)`${R}${(0, s.getProperty)((0, w.unescapeJsonPointer)($))}`, x = (0, s._)`${x} && ${R}`);
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
  function s(n) {
    const C = w.call(this, n);
    if (C)
      return C;
    const t = (0, o.getFullPath)(this.opts.uriResolver, n.root.baseId), { es5: D, lines: c } = this.opts.code, { ownProperties: d } = this.opts, M = new A.CodeGen(this.scope, { es5: D, lines: c, ownProperties: d });
    let h;
    n.$async && (h = M.scopeValue("Error", {
      ref: e.default,
      code: (0, A._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const N = M.scopeName("validate");
    n.validateName = N;
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
      topSchemaRef: M.scopeValue("schema", this.opts.code.source === !0 ? { ref: n.schema, code: (0, A.stringify)(n.schema) } : { ref: n.schema }),
      validateName: N,
      ValidationError: h,
      schema: n.schema,
      schemaEnv: n,
      rootId: t,
      baseId: n.baseId || t,
      schemaPath: A.nil,
      errSchemaPath: n.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, A._)`""`,
      opts: this.opts,
      self: this
    };
    let F;
    try {
      this._compilations.add(n), (0, Q.validateFunctionCode)(O), M.optimize(this.opts.code.optimize);
      const q = M.toString();
      F = `${M.scopeRefs(r.default.scope)}return ${q}`, this.opts.code.process && (F = this.opts.code.process(F, n));
      const U = new Function(`${r.default.self}`, `${r.default.scope}`, F)(this, this.scope.get());
      if (this.scope.value(N, { ref: U }), U.errors = null, U.schema = n.schema, U.schemaEnv = n, n.$async && (U.$async = !0), this.opts.code.source === !0 && (U.source = { validateName: N, validateCode: q, scopeValues: M._values }), this.opts.unevaluated) {
        const { props: Y, items: V } = O;
        U.evaluated = {
          props: Y instanceof A.Name ? void 0 : Y,
          items: V instanceof A.Name ? void 0 : V,
          dynamicProps: Y instanceof A.Name,
          dynamicItems: V instanceof A.Name
        }, U.source && (U.source.evaluated = (0, A.stringify)(U.evaluated));
      }
      return n.validate = U, n;
    } catch (q) {
      throw delete n.validate, delete n.validateName, F && this.logger.error("Error compiling schema, function code:", F), q;
    } finally {
      this._compilations.delete(n);
    }
  }
  compile.compileSchema = s;
  function a(n, C, t) {
    var D;
    t = (0, o.resolveUrl)(this.opts.uriResolver, C, t);
    const c = n.refs[t];
    if (c)
      return c;
    let d = l.call(this, n, t);
    if (d === void 0) {
      const M = (D = n.localRefs) === null || D === void 0 ? void 0 : D[t], { schemaId: h } = this.opts;
      M && (d = new B({ schema: M, schemaId: h, root: n, baseId: C }));
    }
    if (d !== void 0)
      return n.refs[t] = g.call(this, d);
  }
  compile.resolveRef = a;
  function g(n) {
    return (0, o.inlineRef)(n.schema, this.opts.inlineRefs) ? n.schema : n.validate ? n : s.call(this, n);
  }
  function w(n) {
    for (const C of this._compilations)
      if (E(C, n))
        return C;
  }
  compile.getCompilingSchema = w;
  function E(n, C) {
    return n.schema === C.schema && n.root === C.root && n.baseId === C.baseId;
  }
  function l(n, C) {
    let t;
    for (; typeof (t = this.refs[C]) == "string"; )
      C = t;
    return t || this.schemas[C] || f.call(this, n, C);
  }
  function f(n, C) {
    const t = this.opts.uriResolver.parse(C), D = (0, o._getFullPath)(this.opts.uriResolver, t);
    let c = (0, o.getFullPath)(this.opts.uriResolver, n.baseId, void 0);
    if (Object.keys(n.schema).length > 0 && D === c)
      return I.call(this, t, n);
    const d = (0, o.normalizeId)(D), M = this.refs[d] || this.schemas[d];
    if (typeof M == "string") {
      const h = f.call(this, n, M);
      return typeof h?.schema != "object" ? void 0 : I.call(this, t, h);
    }
    if (typeof M?.schema == "object") {
      if (M.validate || s.call(this, M), d === (0, o.normalizeId)(C)) {
        const { schema: h } = M, { schemaId: N } = this.opts, O = h[N];
        return O && (c = (0, o.resolveUrl)(this.opts.uriResolver, c, O)), new B({ schema: h, schemaId: N, root: n, baseId: c });
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
  function I(n, { baseId: C, schema: t, root: D }) {
    var c;
    if (((c = n.fragment) === null || c === void 0 ? void 0 : c[0]) !== "/")
      return;
    for (const h of n.fragment.slice(1).split("/")) {
      if (typeof t == "boolean")
        return;
      const N = t[(0, i.unescapeFragment)(h)];
      if (N === void 0)
        return;
      t = N;
      const O = typeof t == "object" && t[this.opts.schemaId];
      !m.has(h) && O && (C = (0, o.resolveUrl)(this.opts.uriResolver, C, O));
    }
    let d;
    if (typeof t != "boolean" && t.$ref && !(0, i.schemaHasRulesButRef)(t, this.RULES)) {
      const h = (0, o.resolveUrl)(this.opts.uriResolver, C, t.$ref);
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
    const n = I.match(e) || [], [C] = n;
    return C ? { host: B(C, "."), isIPV4: !0 } : { host: I, isIPV4: !1 };
  }
  function o(I, n = !1) {
    let C = "", t = !0;
    for (const D of I) {
      if (A[D] === void 0) return;
      D !== "0" && t === !0 && (t = !1), t || (C += D);
    }
    return n && C.length === 0 && (C = "0"), C;
  }
  function i(I) {
    let n = 0;
    const C = { error: !1, address: "", zone: "" }, t = [], D = [];
    let c = !1, d = !1, M = !1;
    function h() {
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
          if (d === !0 && (M = !0), !h())
            break;
          if (n++, t.push(":"), n > 7) {
            C.error = !0;
            break;
          }
          N - 1 >= 0 && I[N - 1] === ":" && (d = !0);
          continue;
        } else if (O === "%") {
          if (!h())
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
    const n = i(I);
    if (n.error)
      return { host: I, isIPV6: !1 };
    {
      let C = n.address, t = n.address;
      return n.zone && (C += "%" + n.zone, t += "%25" + n.zone), { host: C, escapedHost: t, isIPV6: !0 };
    }
  }
  function B(I, n) {
    let C = "", t = !0;
    const D = I.length;
    for (let c = 0; c < D; c++) {
      const d = I[c];
      d === "0" && t ? (c + 1 <= D && I[c + 1] === n || c + 1 === D) && (C += d, t = !1) : (d === n ? t = !0 : t = !1, C += d);
    }
    return C;
  }
  function s(I, n) {
    let C = 0;
    for (let t = 0; t < I.length; t++)
      I[t] === n && C++;
    return C;
  }
  const a = /^\.\.?\//u, g = /^\/\.(?:\/|$)/u, w = /^\/\.\.(?:\/|$)/u, E = /^\/?(?:.|\n)*?(?=\/|$)/u;
  function l(I) {
    const n = [];
    for (; I.length; )
      if (I.match(a))
        I = I.replace(a, "");
      else if (I.match(g))
        I = I.replace(g, "/");
      else if (I.match(w))
        I = I.replace(w, "/"), n.pop();
      else if (I === "." || I === "..")
        I = "";
      else {
        const C = I.match(E);
        if (C) {
          const t = C[0];
          I = I.slice(t.length), n.push(t);
        } else
          throw new Error("Unexpected dot segment condition");
      }
    return n.join("");
  }
  function f(I, n) {
    const C = n !== !0 ? escape : unescape;
    return I.scheme !== void 0 && (I.scheme = C(I.scheme)), I.userinfo !== void 0 && (I.userinfo = C(I.userinfo)), I.host !== void 0 && (I.host = C(I.host)), I.path !== void 0 && (I.path = C(I.path)), I.query !== void 0 && (I.query = C(I.query)), I.fragment !== void 0 && (I.fragment = C(I.fragment)), I;
  }
  function m(I) {
    const n = [];
    if (I.userinfo !== void 0 && (n.push(I.userinfo), n.push("@")), I.host !== void 0) {
      let C = unescape(I.host);
      const t = r(C);
      if (t.isIPV4)
        C = t.host;
      else {
        const D = Q(t.host);
        D.isIPV6 === !0 ? C = `[${D.escapedHost}]` : C = I.host;
      }
      n.push(C);
    }
    return (typeof I.port == "number" || typeof I.port == "string") && (n.push(":"), n.push(String(I.port))), n.length ? n.join("") : void 0;
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
      const M = `${d}:${D.nid || t.nid}`, h = C[M];
      t.path = void 0, h && (t = h.parse(t, D));
    } else
      t.error = t.error || "URN can not be parsed.";
    return t;
  }
  function a(t, D) {
    const c = D.scheme || t.scheme || "urn", d = t.nid.toLowerCase(), M = `${c}:${D.nid || d}`, h = C[M];
    h && (t = h.serialize(t, D));
    const N = t, O = t.nss;
    return N.path = `${d || D.nid}:${O}`, D.skipEscape = !0, N;
  }
  function g(t, D) {
    const c = t;
    return c.uuid = c.nss, c.nss = void 0, !D.tolerant && (!c.uuid || !A.test(c.uuid)) && (c.error = c.error || "UUID is not valid."), c;
  }
  function w(t) {
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
      parse: g,
      serialize: w,
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
  function B(n, C) {
    return typeof n == "string" ? n = w(m(n, C), C) : typeof n == "object" && (n = m(w(n, C), C)), n;
  }
  function s(n, C, t) {
    const D = Object.assign({ scheme: "null" }, t), c = a(m(n, D), m(C, D), D, !0);
    return w(c, { ...D, skipEscape: !0 });
  }
  function a(n, C, t, D) {
    const c = {};
    return D || (n = m(w(n, t), t), C = m(w(C, t), t)), t = t || {}, !t.tolerant && C.scheme ? (c.scheme = C.scheme, c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.userinfo !== void 0 || C.host !== void 0 || C.port !== void 0 ? (c.userinfo = C.userinfo, c.host = C.host, c.port = C.port, c.path = r(C.path || ""), c.query = C.query) : (C.path ? (C.path.charAt(0) === "/" ? c.path = r(C.path) : ((n.userinfo !== void 0 || n.host !== void 0 || n.port !== void 0) && !n.path ? c.path = "/" + C.path : n.path ? c.path = n.path.slice(0, n.path.lastIndexOf("/") + 1) + C.path : c.path = C.path, c.path = r(c.path)), c.query = C.query) : (c.path = n.path, C.query !== void 0 ? c.query = C.query : c.query = n.query), c.userinfo = n.userinfo, c.host = n.host, c.port = n.port), c.scheme = n.scheme), c.fragment = C.fragment, c;
  }
  function g(n, C, t) {
    return typeof n == "string" ? (n = unescape(n), n = w(i(m(n, t), !0), { ...t, skipEscape: !0 })) : typeof n == "object" && (n = w(i(n, !0), { ...t, skipEscape: !0 })), typeof C == "string" ? (C = unescape(C), C = w(i(m(C, t), !0), { ...t, skipEscape: !0 })) : typeof C == "object" && (C = w(i(C, !0), { ...t, skipEscape: !0 })), n.toLowerCase() === C.toLowerCase();
  }
  function w(n, C) {
    const t = {
      host: n.host,
      scheme: n.scheme,
      userinfo: n.userinfo,
      port: n.port,
      path: n.path,
      query: n.query,
      nid: n.nid,
      nss: n.nss,
      uuid: n.uuid,
      fragment: n.fragment,
      reference: n.reference,
      resourceName: n.resourceName,
      secure: n.secure,
      error: ""
    }, D = Object.assign({}, C), c = [], d = Q[(D.scheme || t.scheme || "").toLowerCase()];
    d && d.serialize && d.serialize(t, D), t.path !== void 0 && (D.skipEscape ? t.path = unescape(t.path) : (t.path = escape(t.path), t.scheme !== void 0 && (t.path = t.path.split("%3A").join(":")))), D.reference !== "suffix" && t.scheme && c.push(t.scheme, ":");
    const M = o(t);
    if (M !== void 0 && (D.reference !== "suffix" && c.push("//"), c.push(M), t.path && t.path.charAt(0) !== "/" && c.push("/")), t.path !== void 0) {
      let h = t.path;
      !D.absolutePath && (!d || !d.absolutePath) && (h = r(h)), M === void 0 && (h = h.replace(/^\/\//u, "/%2F")), c.push(h);
    }
    return t.query !== void 0 && c.push("?", t.query), t.fragment !== void 0 && c.push("#", t.fragment), c.join("");
  }
  const E = Array.from({ length: 127 }, (n, C) => /[^!"$&'()*+,\-.;=_`a-z{}~]/u.test(String.fromCharCode(C)));
  function l(n) {
    let C = 0;
    for (let t = 0, D = n.length; t < D; ++t)
      if (C = n.charCodeAt(t), C > 126 || E[C])
        return !0;
    return !1;
  }
  const f = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function m(n, C) {
    const t = Object.assign({}, C), D = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    }, c = n.indexOf("%") !== -1;
    let d = !1;
    t.reference === "suffix" && (n = (t.scheme ? t.scheme + ":" : "") + "//" + n);
    const M = n.match(f);
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
      const h = Q[(t.scheme || D.scheme || "").toLowerCase()];
      if (!t.unicodeSupport && (!h || !h.unicodeSupport) && D.host && (t.domainHost || h && h.domainHost) && d === !1 && l(D.host))
        try {
          D.host = URL.domainToASCII(D.host.toLowerCase());
        } catch (N) {
          D.error = D.error || "Host's domain name can not be converted to ASCII: " + N;
        }
      (!h || h && !h.skipNormalize) && (c && D.scheme !== void 0 && (D.scheme = unescape(D.scheme)), c && D.host !== void 0 && (D.host = unescape(D.host)), D.path && D.path.length && (D.path = escape(unescape(D.path))), D.fragment && D.fragment.length && (D.fragment = encodeURI(decodeURIComponent(D.fragment)))), h && h.parse && h.parse(D, t);
    } else
      D.error = D.error || "URI can not be parsed.";
    return D;
  }
  const I = {
    SCHEMES: Q,
    normalize: B,
    resolve: s,
    resolveComponents: a,
    equal: g,
    serialize: w,
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
    const o = requireValidation_error(), i = requireRef_error(), Q = requireRules(), B = requireCompile(), s = requireCodegen(), a = requireResolve(), g = requireDataType(), w = requireUtil(), E = require$$9, l = requireUri(), f = (_, P) => new RegExp(_, P);
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
    ]), n = {
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
      var P, v, y, u, K, G, z, b, J, Z, k, p, H, j, L, R, x, eA, W, $, X, iA, AA, tA, sA;
      const BA = _.strict, aA = (P = _.code) === null || P === void 0 ? void 0 : P.optimize, gA = aA === !0 || aA === void 0 ? 1 : aA || 0, nA = (y = (v = _.code) === null || v === void 0 ? void 0 : v.regExp) !== null && y !== void 0 ? y : f, DA = (u = _.uriResolver) !== null && u !== void 0 ? u : l.default;
      return {
        strictSchema: (G = (K = _.strictSchema) !== null && K !== void 0 ? K : BA) !== null && G !== void 0 ? G : !0,
        strictNumbers: (b = (z = _.strictNumbers) !== null && z !== void 0 ? z : BA) !== null && b !== void 0 ? b : !0,
        strictTypes: (Z = (J = _.strictTypes) !== null && J !== void 0 ? J : BA) !== null && Z !== void 0 ? Z : "log",
        strictTuples: (p = (k = _.strictTuples) !== null && k !== void 0 ? k : BA) !== null && p !== void 0 ? p : "log",
        strictRequired: (j = (H = _.strictRequired) !== null && H !== void 0 ? H : BA) !== null && j !== void 0 ? j : !1,
        code: _.code ? { ..._.code, optimize: gA, regExp: nA } : { optimize: gA, regExp: nA },
        loopRequired: (L = _.loopRequired) !== null && L !== void 0 ? L : t,
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
        this.scope = new s.ValueScope({ scope: {}, prefixes: I, es5: v, lines: y }), this.logger = S(P.logger);
        const u = P.validateFormats;
        P.validateFormats = !1, this.RULES = (0, Q.getRules)(), d.call(this, n, P, "NOT SUPPORTED"), d.call(this, C, P, "DEPRECATED", "warn"), this._metaOpts = F.call(this), P.formats && N.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), P.keywords && O.call(this, P.keywords), typeof P.meta == "object" && this.addMetaSchema(P.meta), h.call(this), P.validateFormats = u;
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
          await K.call(this, Z.$schema);
          const p = this._addSchema(Z, k);
          return p.validate || G.call(this, p);
        }
        async function K(Z) {
          Z && !this.getSchema(Z) && await u.call(this, { $ref: Z }, !0);
        }
        async function G(Z) {
          try {
            return this._compileSchemaEnv(Z);
          } catch (k) {
            if (!(k instanceof i.default))
              throw k;
            return z.call(this, k), await b.call(this, k.missingSchema), G.call(this, Z);
          }
        }
        function z({ missingSchema: Z, missingRef: k }) {
          if (this.refs[Z])
            throw new Error(`AnySchema ${Z} is loaded but ${k} cannot be resolved`);
        }
        async function b(Z) {
          const k = await J.call(this, Z);
          this.refs[Z] || await K.call(this, k.$schema), this.refs[Z] || this.addSchema(k, Z, v);
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
        let K;
        if (typeof P == "object") {
          const { schemaId: G } = this.opts;
          if (K = P[G], K !== void 0 && typeof K != "string")
            throw new Error(`schema ${G} must be string`);
        }
        return v = (0, a.normalizeId)(v || K), this._checkUnique(v), this.schemas[v] = this._addSchema(P, y, v, u, !0), this;
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
          return (0, w.eachItem)(y, (K) => V.call(this, K)), this;
        oA.call(this, v);
        const u = {
          ...v,
          type: (0, g.getJSONTypes)(v.type),
          schemaType: (0, g.getJSONTypes)(v.schemaType)
        };
        return (0, w.eachItem)(y, u.type.length === 0 ? (K) => V.call(this, K, u) : (K) => u.type.forEach((G) => V.call(this, K, u, G))), this;
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
          const u = y.rules.findIndex((K) => K.keyword === P);
          u >= 0 && y.rules.splice(u, 1);
        }
        return this;
      }
      // Add format
      addFormat(P, v) {
        return typeof v == "string" && (v = new RegExp(v)), this.formats[P] = v, this;
      }
      errorsText(P = this.errors, { separator: v = ", ", dataVar: y = "data" } = {}) {
        return !P || P.length === 0 ? "No errors" : P.map((u) => `${y}${u.instancePath} ${u.message}`).reduce((u, K) => u + v + K);
      }
      $dataMetaSchema(P, v) {
        const y = this.RULES.all;
        P = JSON.parse(JSON.stringify(P));
        for (const u of v) {
          const K = u.split("/").slice(1);
          let G = P;
          for (const z of K)
            G = G[z];
          for (const z in y) {
            const b = y[z];
            if (typeof b != "object")
              continue;
            const { $data: J } = b.definition, Z = G[z];
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
      _addSchema(P, v, y, u = this.opts.validateSchema, K = this.opts.addUsedSchema) {
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
        let b = this._cache.get(P);
        if (b !== void 0)
          return b;
        y = (0, a.normalizeId)(G || y);
        const J = a.getSchemaRefs.call(this, P, y);
        return b = new B.SchemaEnv({ schema: P, schemaId: z, meta: v, baseId: y, localRefs: J }), this._cache.set(b.schema, b), K && !y.startsWith("#") && (y && this._checkUnique(y), this.refs[y] = b), u && this.validateSchema(P, !0), b;
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
        const K = u;
        K in P && this.logger[y](`${v}: option ${u}. ${_[K]}`);
      }
    }
    function M(_) {
      return _ = (0, a.normalizeId)(_), this.schemas[_] || this.refs[_];
    }
    function h() {
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
    function S(_) {
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
      if ((0, w.eachItem)(_, (y) => {
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
      const { RULES: K } = this;
      let G = u ? K.post : K.rules.find(({ type: b }) => b === v);
      if (G || (G = { type: v, rules: [] }, K.rules.push(G)), K.keywords[_] = !0, !P)
        return;
      const z = {
        keyword: _,
        definition: {
          ...P,
          type: (0, g.getJSONTypes)(P.type),
          schemaType: (0, g.getJSONTypes)(P.schemaType)
        }
      };
      P.before ? rA.call(this, G, z, P.before) : G.rules.push(z), K.all[_] = z, (y = P.implements) === null || y === void 0 || y.forEach((b) => this.addKeyword(b));
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
    code(g) {
      const { gen: w, schema: E, it: l } = g, { baseId: f, schemaEnv: m, validateName: I, opts: n, self: C } = l, { root: t } = m;
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
          return a(g, I, m, m.$async);
        const h = w.scopeValue("root", { ref: t });
        return a(g, (0, r._)`${h}.validate`, t, t.$async);
      }
      function d(h) {
        const N = s(g, h);
        a(g, N, h, h.$async);
      }
      function M(h) {
        const N = w.scopeValue("schema", n.code.source === !0 ? { ref: h, code: (0, r.stringify)(h) } : { ref: h }), O = w.name("valid"), F = g.subschema({
          schema: h,
          dataTypes: [],
          schemaPath: r.nil,
          topSchemaRef: N,
          errSchemaPath: E
        }, O);
        g.mergeEvaluated(F), g.ok(O);
      }
    }
  };
  function s(g, w) {
    const { gen: E } = g;
    return w.validate ? E.scopeValue("validate", { ref: w.validate }) : (0, r._)`${E.scopeValue("wrapper", { ref: w })}.validate`;
  }
  ref.getValidate = s;
  function a(g, w, E, l) {
    const { gen: f, it: m } = g, { allErrors: I, schemaEnv: n, opts: C } = m, t = C.passContext ? o.default.this : r.nil;
    l ? D() : c();
    function D() {
      if (!n.$async)
        throw new Error("async schema referenced by sync schema");
      const h = f.let("valid");
      f.try(() => {
        f.code((0, r._)`await ${(0, e.callValidateCode)(g, w, t)}`), M(w), I || f.assign(h, !0);
      }, (N) => {
        f.if((0, r._)`!(${N} instanceof ${m.ValidationError})`, () => f.throw(N)), d(N), I || f.assign(h, !1);
      }), g.ok(h);
    }
    function c() {
      g.result((0, e.callValidateCode)(g, w, t), () => M(w), () => d(w));
    }
    function d(h) {
      const N = (0, r._)`${h}.errors`;
      f.assign(o.default.vErrors, (0, r._)`${o.default.vErrors} === null ? ${N} : ${o.default.vErrors}.concat(${N})`), f.assign(o.default.errors, (0, r._)`${o.default.vErrors}.length`);
    }
    function M(h) {
      var N;
      if (!m.opts.unevaluated)
        return;
      const O = (N = E?.validate) === null || N === void 0 ? void 0 : N.evaluated;
      if (m.props !== !0)
        if (O && !O.dynamicProps)
          O.props !== void 0 && (m.props = Q.mergeEvaluated.props(f, O.props, m.props));
        else {
          const F = f.var("props", (0, r._)`${h}.evaluated.props`);
          m.props = Q.mergeEvaluated.props(f, F, m.props, r.Name);
        }
      if (m.items !== !0)
        if (O && !O.dynamicItems)
          O.items !== void 0 && (m.items = Q.mergeEvaluated.items(f, O.items, m.items));
        else {
          const F = f.var("items", (0, r._)`${h}.evaluated.items`);
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
      const { gen: i, data: Q, schemaCode: B, it: s } = o, a = s.opts.multipleOfPrecision, g = i.let("res"), w = a ? (0, A._)`Math.abs(Math.round(${g}) - ${g}) > 1e-${a}` : (0, A._)`${g} !== parseInt(${g})`;
      o.fail$data((0, A._)`(${B} === 0 || (${g} = ${Q}/${B}, ${w}))`);
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
      const { keyword: B, data: s, schemaCode: a, it: g } = Q, w = B === "maxLength" ? A.operators.GT : A.operators.LT, E = g.opts.unicode === !1 ? (0, A._)`${s}.length` : (0, A._)`${(0, e.useFunc)(Q.gen, r.default)}(${s})`;
      Q.fail$data((0, A._)`${E} ${w} ${a}`);
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
      const { data: Q, $data: B, schema: s, schemaCode: a, it: g } = i, w = g.opts.unicodeRegExp ? "u" : "", E = B ? (0, e._)`(new RegExp(${a}, ${w}))` : (0, A.usePattern)(i, s);
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
      const { gen: B, schema: s, schemaCode: a, data: g, $data: w, it: E } = Q, { opts: l } = E;
      if (!w && s.length === 0)
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
        if (f || w)
          Q.block$data(e.nil, n);
        else
          for (const t of s)
            (0, A.checkReportMissingProp)(Q, t);
      }
      function I() {
        const t = B.let("missing");
        if (f || w) {
          const D = B.let("valid", !0);
          Q.block$data(D, () => C(t, D)), Q.ok(D);
        } else
          B.if((0, A.checkMissingProp)(Q, s, t)), (0, A.reportMissingProp)(Q, t), B.else();
      }
      function n() {
        B.forOf("prop", a, (t) => {
          Q.setParams({ missingProperty: t }), B.if((0, A.noPropertyInData)(B, g, t, l.ownProperties), () => Q.error());
        });
      }
      function C(t, D) {
        Q.setParams({ missingProperty: t }), B.forOf(t, a, () => {
          B.assign(D, (0, A.propertyInData)(B, g, t, l.ownProperties)), B.if((0, e.not)(D), () => {
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
      const { gen: s, data: a, $data: g, schema: w, parentSchema: E, schemaCode: l, it: f } = B;
      if (!g && !w)
        return;
      const m = s.let("valid"), I = E.items ? (0, A.getSchemaTypes)(E.items) : [];
      B.block$data(m, n, (0, e._)`${l} === false`), B.ok(m);
      function n() {
        const c = s.let("i", (0, e._)`${a}.length`), d = s.let("j");
        B.setParams({ i: c, j: d }), s.assign(m, !0), s.if((0, e._)`${c} > 1`, () => (C() ? t : D)(c, d));
      }
      function C() {
        return I.length > 0 && !I.some((c) => c === "object" || c === "array");
      }
      function t(c, d) {
        const M = s.name("item"), h = (0, A.checkDataTypes)(I, M, f.opts.strictNumbers, A.DataType.Wrong), N = s.const("indices", (0, e._)`{}`);
        s.for((0, e._)`;${c}--;`, () => {
          s.let(M, (0, e._)`${a}[${c}]`), s.if(h, (0, e._)`continue`), I.length > 1 && s.if((0, e._)`typeof ${M} == "string"`, (0, e._)`${M} += "_"`), s.if((0, e._)`typeof ${N}[${M}] == "number"`, () => {
            s.assign(d, (0, e._)`${N}[${M}]`), B.error(), s.assign(m, !1).break();
          }).code((0, e._)`${N}[${M}] = ${c}`);
        });
      }
      function D(c, d) {
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
      const { gen: B, data: s, $data: a, schemaCode: g, schema: w } = Q;
      a || w && typeof w == "object" ? Q.fail$data((0, A._)`!${(0, e.useFunc)(B, r.default)}(${s}, ${g})`) : Q.fail((0, A._)`${w} !== ${s}`);
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
      const { gen: B, data: s, $data: a, schema: g, schemaCode: w, it: E } = Q;
      if (!a && g.length === 0)
        throw new Error("enum must have non-empty array");
      const l = g.length >= E.opts.loopEnum;
      let f;
      const m = () => f ?? (f = (0, e.useFunc)(B, r.default));
      let I;
      if (l || a)
        I = B.let("valid"), Q.block$data(I, n);
      else {
        if (!Array.isArray(g))
          throw new Error("ajv implementation error");
        const t = B.const("vSchema", w);
        I = (0, A.or)(...g.map((D, c) => C(t, c)));
      }
      Q.pass(I);
      function n() {
        B.assign(I, !1), B.forOf("v", w, (t) => B.if((0, A._)`${m()}(${s}, ${t})`, () => B.assign(I, !0).break()));
      }
      function C(t, D) {
        const c = g[D];
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
  const A = requireLimitNumber(), e = requireMultipleOf(), r = requireLimitLength(), o = requirePattern(), i = requireLimitProperties(), Q = requireRequired(), B = requireLimitItems(), s = requireUniqueItems(), a = require_const(), g = require_enum(), w = [
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
    g.default
  ];
  return validation.default = w, validation;
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
    const { gen: s, schema: a, data: g, keyword: w, it: E } = Q;
    E.items = !0;
    const l = s.const("len", (0, A._)`${g}.length`);
    if (a === !1)
      Q.setParams({ len: B.length }), Q.pass((0, A._)`${l} <= ${B.length}`);
    else if (typeof a == "object" && !(0, e.alwaysValidSchema)(E, a)) {
      const m = s.var("valid", (0, A._)`${l} <= ${B.length}`);
      s.if((0, A.not)(m), () => f(m)), Q.ok(m);
    }
    function f(m) {
      s.forRange("i", B.length, l, (I) => {
        Q.subschema({ keyword: w, dataProp: I, dataPropType: e.Type.Num }, m), E.allErrors || s.if((0, A.not)(m), () => s.break());
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
    const { gen: a, parentSchema: g, data: w, keyword: E, it: l } = Q;
    I(g), l.opts.unevaluated && s.length && l.items !== !0 && (l.items = e.mergeEvaluated.items(a, s.length, l.items));
    const f = a.name("valid"), m = a.const("len", (0, A._)`${w}.length`);
    s.forEach((n, C) => {
      (0, e.alwaysValidSchema)(l, n) || (a.if((0, A._)`${m} > ${C}`, () => Q.subschema({
        keyword: E,
        schemaProp: C,
        dataProp: C
      }, f)), Q.ok(f));
    });
    function I(n) {
      const { opts: C, errSchemaPath: t } = l, D = s.length, c = D === n.minItems && (D === n.maxItems || n[B] === !1);
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
      const { schema: s, parentSchema: a, it: g } = B, { prefixItems: w } = a;
      g.items = !0, !(0, e.alwaysValidSchema)(g, s) && (w ? (0, o.validateAdditionalItems)(B, w) : B.ok((0, r.validateArray)(B)));
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
      const { gen: Q, schema: B, parentSchema: s, data: a, it: g } = i;
      let w, E;
      const { minContains: l, maxContains: f } = s;
      g.opts.next ? (w = l === void 0 ? 1 : l, E = f) : w = 1;
      const m = Q.const("len", (0, A._)`${a}.length`);
      if (i.setParams({ min: w, max: E }), E === void 0 && w === 0) {
        (0, e.checkStrictMode)(g, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (E !== void 0 && w > E) {
        (0, e.checkStrictMode)(g, '"minContains" > "maxContains" is always invalid'), i.fail();
        return;
      }
      if ((0, e.alwaysValidSchema)(g, B)) {
        let D = (0, A._)`${m} >= ${w}`;
        E !== void 0 && (D = (0, A._)`${D} && ${m} <= ${E}`), i.pass(D);
        return;
      }
      g.items = !0;
      const I = Q.name("valid");
      E === void 0 && w === 1 ? C(I, () => Q.if(I, () => Q.break())) : w === 0 ? (Q.let(I, !0), E !== void 0 && Q.if((0, A._)`${a}.length > 0`, n)) : (Q.let(I, !1), n()), i.result(I, () => i.reset());
      function n() {
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
        Q.code((0, A._)`${D}++`), E === void 0 ? Q.if((0, A._)`${D} >= ${w}`, () => Q.assign(I, !0).break()) : (Q.if((0, A._)`${D} > ${E}`, () => Q.assign(I, !1).break()), w === 1 ? Q.assign(I, !0) : Q.if((0, A._)`${D} >= ${w}`, () => Q.assign(I, !0)));
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
      message: ({ params: { property: a, depsCount: g, deps: w } }) => {
        const E = g === 1 ? "property" : "properties";
        return (0, e.str)`must have ${E} ${w} when property ${a} is present`;
      },
      params: ({ params: { property: a, depsCount: g, deps: w, missingProperty: E } }) => (0, e._)`{property: ${a},
    missingProperty: ${E},
    depsCount: ${g},
    deps: ${w}}`
      // TODO change to reference
    };
    const i = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: A.error,
      code(a) {
        const [g, w] = Q(a);
        B(a, g), s(a, w);
      }
    };
    function Q({ schema: a }) {
      const g = {}, w = {};
      for (const E in a) {
        if (E === "__proto__")
          continue;
        const l = Array.isArray(a[E]) ? g : w;
        l[E] = a[E];
      }
      return [g, w];
    }
    function B(a, g = a.schema) {
      const { gen: w, data: E, it: l } = a;
      if (Object.keys(g).length === 0)
        return;
      const f = w.let("missing");
      for (const m in g) {
        const I = g[m];
        if (I.length === 0)
          continue;
        const n = (0, o.propertyInData)(w, E, m, l.opts.ownProperties);
        a.setParams({
          property: m,
          depsCount: I.length,
          deps: I.join(", ")
        }), l.allErrors ? w.if(n, () => {
          for (const C of I)
            (0, o.checkReportMissingProp)(a, C);
        }) : (w.if((0, e._)`${n} && (${(0, o.checkMissingProp)(a, I, f)})`), (0, o.reportMissingProp)(a, f), w.else());
      }
    }
    A.validatePropertyDeps = B;
    function s(a, g = a.schema) {
      const { gen: w, data: E, keyword: l, it: f } = a, m = w.name("valid");
      for (const I in g)
        (0, r.alwaysValidSchema)(f, g[I]) || (w.if(
          (0, o.propertyInData)(w, E, I, f.opts.ownProperties),
          () => {
            const n = a.subschema({ keyword: l, schemaProp: I }, m);
            a.mergeValidEvaluated(n, m);
          },
          () => w.var(m, !0)
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
      const g = Q.name("valid");
      Q.forIn("key", s, (w) => {
        i.setParams({ propertyName: w }), i.subschema({
          keyword: "propertyNames",
          data: w,
          dataTypes: ["string"],
          propertyName: w,
          compositeRule: !0
        }, g), Q.if((0, A.not)(g), () => {
          i.error(!0), a.allErrors || Q.break();
        });
      }), i.ok(g);
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
      const { gen: s, schema: a, parentSchema: g, data: w, errsCount: E, it: l } = B;
      if (!E)
        throw new Error("ajv implementation error");
      const { allErrors: f, opts: m } = l;
      if (l.props = !0, m.removeAdditional !== "all" && (0, o.alwaysValidSchema)(l, a))
        return;
      const I = (0, A.allSchemaProperties)(g.properties), n = (0, A.allSchemaProperties)(g.patternProperties);
      C(), B.ok((0, e._)`${E} === ${r.default.errors}`);
      function C() {
        s.forIn("key", w, (M) => {
          !I.length && !n.length ? c(M) : s.if(t(M), () => c(M));
        });
      }
      function t(M) {
        let h;
        if (I.length > 8) {
          const N = (0, o.schemaRefOrVal)(l, g.properties, "properties");
          h = (0, A.isOwnProperty)(s, N, M);
        } else I.length ? h = (0, e.or)(...I.map((N) => (0, e._)`${M} === ${N}`)) : h = e.nil;
        return n.length && (h = (0, e.or)(h, ...n.map((N) => (0, e._)`${(0, A.usePattern)(B, N)}.test(${M})`))), (0, e.not)(h);
      }
      function D(M) {
        s.code((0, e._)`delete ${w}[${M}]`);
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
          const h = s.name("valid");
          m.removeAdditional === "failing" ? (d(M, h, !1), s.if((0, e.not)(h), () => {
            B.reset(), D(M);
          })) : (d(M, h), f || s.if((0, e.not)(h), () => s.break()));
        }
      }
      function d(M, h, N) {
        const O = {
          keyword: "additionalProperties",
          dataProp: M,
          dataPropType: o.Type.Str
        };
        N === !1 && Object.assign(O, {
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
      const { gen: B, schema: s, parentSchema: a, data: g, it: w } = Q;
      w.opts.removeAdditional === "all" && a.additionalProperties === void 0 && o.default.code(new A.KeywordCxt(w, o.default, "additionalProperties"));
      const E = (0, e.allSchemaProperties)(s);
      for (const n of E)
        w.definedProperties.add(n);
      w.opts.unevaluated && E.length && w.props !== !0 && (w.props = r.mergeEvaluated.props(B, (0, r.toHash)(E), w.props));
      const l = E.filter((n) => !(0, r.alwaysValidSchema)(w, s[n]));
      if (l.length === 0)
        return;
      const f = B.name("valid");
      for (const n of l)
        m(n) ? I(n) : (B.if((0, e.propertyInData)(B, g, n, w.opts.ownProperties)), I(n), w.allErrors || B.else().var(f, !0), B.endIf()), Q.it.definedProperties.add(n), Q.ok(f);
      function m(n) {
        return w.opts.useDefaults && !w.compositeRule && s[n].default !== void 0;
      }
      function I(n) {
        Q.subschema({
          keyword: "properties",
          schemaProp: n,
          dataProp: n
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
      const { gen: B, schema: s, data: a, parentSchema: g, it: w } = Q, { opts: E } = w, l = (0, A.allSchemaProperties)(s), f = l.filter((c) => (0, r.alwaysValidSchema)(w, s[c]));
      if (l.length === 0 || f.length === l.length && (!w.opts.unevaluated || w.props === !0))
        return;
      const m = E.strictSchema && !E.allowMatchingProperties && g.properties, I = B.name("valid");
      w.props !== !0 && !(w.props instanceof e.Name) && (w.props = (0, o.evaluatedPropsToName)(B, w.props));
      const { props: n } = w;
      C();
      function C() {
        for (const c of l)
          m && t(c), w.allErrors ? D(c) : (B.var(I, !0), D(c), B.if(I));
      }
      function t(c) {
        for (const d in m)
          new RegExp(c).test(d) && (0, r.checkStrictMode)(w, `property ${d} matches pattern ${c} (use allowMatchingProperties)`);
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
            }, I), w.opts.unevaluated && n !== !0 ? B.assign((0, e._)`${n}[${d}]`, !0) : !M && !w.allErrors && B.if((0, e.not)(I), () => B.break());
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
      const g = B, w = Q.let("valid", !1), E = Q.let("passing", null), l = Q.name("_valid");
      i.setParams({ passing: E }), Q.block(f), i.result(w, () => i.reset(), () => i.error(!0));
      function f() {
        g.forEach((m, I) => {
          let n;
          (0, e.alwaysValidSchema)(a, m) ? Q.var(l, !0) : n = i.subschema({
            keyword: "oneOf",
            schemaProp: I,
            compositeRule: !0
          }, l), I > 0 && Q.if((0, A._)`${l} && ${w}`).assign(w, !1).assign(E, (0, A._)`[${E}, ${I}]`).else(), Q.if(l, () => {
            Q.assign(w, !0), Q.assign(E, I), n && i.mergeEvaluated(n, A.Name);
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
      message: ({ params: Q }) => (0, A.str)`must match "${Q.ifClause}" schema`,
      params: ({ params: Q }) => (0, A._)`{failingKeyword: ${Q.ifClause}}`
    },
    code(Q) {
      const { gen: B, parentSchema: s, it: a } = Q;
      s.then === void 0 && s.else === void 0 && (0, e.checkStrictMode)(a, '"if" without "then" and "else" is ignored');
      const g = i(a, "then"), w = i(a, "else");
      if (!g && !w)
        return;
      const E = B.let("valid", !0), l = B.name("_valid");
      if (f(), Q.reset(), g && w) {
        const I = B.let("ifClause");
        Q.setParams({ ifClause: I }), B.if(l, m("then", I), m("else", I));
      } else g ? B.if(l, m("then")) : B.if((0, A.not)(l), m("else"));
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
      function m(I, n) {
        return () => {
          const C = Q.subschema({ keyword: I }, l);
          B.assign(E, l), Q.mergeValidEvaluated(C, E), n ? B.assign(n, (0, A._)`${I}`) : Q.setParams({ ifClause: I });
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
  const A = requireAdditionalItems(), e = requirePrefixItems(), r = requireItems(), o = requireItems2020(), i = requireContains(), Q = requireDependencies(), B = requirePropertyNames(), s = requireAdditionalProperties(), a = requireProperties(), g = requirePatternProperties(), w = requireNot(), E = requireAnyOf(), l = requireOneOf(), f = requireAllOf(), m = require_if(), I = requireThenElse();
  function n(C = !1) {
    const t = [
      // any
      w.default,
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
      g.default
    ];
    return C ? t.push(e.default, o.default) : t.push(A.default, r.default), t.push(i.default), t;
  }
  return applicator.default = n, applicator;
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
      const { gen: Q, data: B, $data: s, schema: a, schemaCode: g, it: w } = o, { opts: E, errSchemaPath: l, schemaEnv: f, self: m } = w;
      if (!E.validateFormats)
        return;
      s ? I() : n();
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
          const h = f.$async ? (0, A._)`(${t}.async ? await ${c}(${B}) : ${c}(${B}))` : (0, A._)`${c}(${B})`, N = (0, A._)`(typeof ${c} == "function" ? ${h} : ${c}.test(${B}))`;
          return (0, A._)`${c} && ${c} !== true && ${D} === ${i} && !${N}`;
        }
      }
      function n() {
        const C = m.formats[a];
        if (!C) {
          d();
          return;
        }
        if (C === !0)
          return;
        const [t, D, c] = M(C);
        t === i && o.pass(h());
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
      params: ({ params: { discrError: s, tag: a, tagName: g } }) => (0, A._)`{error: ${s}, tag: ${g}, tagValue: ${a}}`
    },
    code(s) {
      const { gen: a, data: g, schema: w, parentSchema: E, it: l } = s, { oneOf: f } = E;
      if (!l.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const m = w.propertyName;
      if (typeof m != "string")
        throw new Error("discriminator: requires propertyName");
      if (w.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!f)
        throw new Error("discriminator: requires oneOf keyword");
      const I = a.let("valid", !1), n = a.const("tag", (0, A._)`${g}${(0, A.getProperty)(m)}`);
      a.if((0, A._)`typeof ${n} == "string"`, () => C(), () => s.error(!1, { discrError: e.DiscrError.Tag, tag: n, tagName: m })), s.ok(I);
      function C() {
        const c = D();
        a.if(!1);
        for (const d in c)
          a.elseIf((0, A._)`${n} === ${d}`), a.assign(I, t(c[d]));
        a.else(), s.error(!1, { discrError: e.DiscrError.Mapping, tag: n, tagName: m }), a.endIf();
      }
      function t(c) {
        const d = a.name("valid"), M = s.subschema({ keyword: "oneOf", schemaProp: c }, d);
        return s.mergeEvaluated(M, A.Name), d;
      }
      function D() {
        var c;
        const d = {}, M = N(E);
        let h = !0;
        for (let q = 0; q < f.length; q++) {
          let S = f[q];
          if (S?.$ref && !(0, i.schemaHasRulesButRef)(S, l.self.RULES)) {
            const Y = S.$ref;
            if (S = r.resolveRef.call(l.self, l.schemaEnv.root, l.baseId, Y), S instanceof r.SchemaEnv && (S = S.schema), S === void 0)
              throw new o.default(l.opts.uriResolver, l.baseId, Y);
          }
          const U = (c = S?.properties) === null || c === void 0 ? void 0 : c[m];
          if (typeof U != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${m}"`);
          h = h && (M || N(S)), O(U, q);
        }
        if (!h)
          throw new Error(`discriminator: "${m}" must be required`);
        return d;
        function N({ required: q }) {
          return Array.isArray(q) && q.includes(m);
        }
        function O(q, S) {
          if (q.const)
            F(q.const, S);
          else if (q.enum)
            for (const U of q.enum)
              F(U, S);
          else
            throw new Error(`discriminator: "properties/${m}" must have "const" or "enum"`);
        }
        function F(q, S) {
          if (typeof q != "string" || q in d)
            throw new Error(`discriminator: "${m}" values must be unique strings`);
          d[q] = S;
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
    var g = requireValidate();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return g.KeywordCxt;
    } });
    var w = requireCodegen();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return w._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return w.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return w.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return w.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return w.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return w.CodeGen;
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
    function s(w) {
      try {
        g(o.next(w));
      } catch (E) {
        B(E);
      }
    }
    function a(w) {
      try {
        g(o.throw(w));
      } catch (E) {
        B(E);
      }
    }
    function g(w) {
      w.done ? Q(w.value) : i(w.value).then(s, a);
    }
    g((o = o.apply(A, [])).next());
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
  function s(g) {
    return function(w) {
      return a([g, w]);
    };
  }
  function a(g) {
    if (o) throw new TypeError("Generator is already executing.");
    for (; r; ) try {
      if (o = 1, i && (Q = g[0] & 2 ? i.return : g[0] ? i.throw || ((Q = i.return) && Q.call(i), 0) : i.next) && !(Q = Q.call(i, g[1])).done) return Q;
      switch (i = 0, Q && (g = [g[0] & 2, Q.value]), g[0]) {
        case 0:
        case 1:
          Q = g;
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
    } catch (w) {
      g = [6, w], i = 0;
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
      for (const { count: a, res: g } of B.anchors.values())
        i(g, a);
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
  let g = findTagObject(A, e, B.tags);
  if (!g) {
    if (A && typeof A.toJSON == "function" && (A = A.toJSON()), !A || typeof A != "object") {
      const E = new Scalar(A);
      return a && (a.node = E), E;
    }
    g = A instanceof Map ? B[MAP] : Symbol.iterator in Object(A) ? B[SEQ] : B[MAP];
  }
  Q && (Q(g), delete r.onTagObj);
  const w = g?.createNode ? g.createNode(r.schema, A, r) : typeof g?.nodeClass?.from == "function" ? g.nodeClass.from(r.schema, A, r) : new Scalar(A);
  return g.default || (w.tag = g.tag), a && (a.node = w), w;
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
  const g = [], w = {};
  let E = i - e.length;
  typeof o == "number" && (o > i - Math.max(2, Q) ? g.push(0) : E = i - o);
  let l, f, m = !1, I = -1, n = -1, C = -1;
  r === FOLD_BLOCK && (I = consumeMoreIndentedLines(A, I, e.length), I !== -1 && (E = I + a));
  for (let D; D = A[I += 1]; ) {
    if (r === FOLD_QUOTED && D === "\\") {
      switch (n = I, A[I + 1]) {
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
          const c = I > C + 1 ? I - 2 : n - 1;
          if (w[c])
            return A;
          g.push(c), w[c] = !0, E = c + a, l = void 0;
        } else
          m = !0;
    }
    f = D;
  }
  if (m && s && s(), g.length === 0)
    return A;
  B && B();
  let t = A.slice(0, g[0]);
  for (let D = 0; D < g.length; ++D) {
    const c = g[D], d = g[D + 1] || A.length;
    c === 0 ? t = `
${e}${A.slice(0, d)}` : (r === FOLD_QUOTED && w[c] && (t += `${A[c]}\\`), t += `
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
  for (let a = 0, g = r[a]; g; g = r[++a])
    if (g === " " && r[a + 1] === "\\" && r[a + 2] === "n" && (B += r.slice(s, a) + "\\ ", a += 1, s = a, g = "\\"), g === "\\")
      switch (r[a + 1]) {
        case "u":
          {
            B += r.slice(s, a);
            const w = r.substr(a + 2, 4);
            switch (w) {
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
                w.substr(0, 2) === "00" ? B += "\\x" + w.substr(2) : B += r.substr(a, 6);
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
  const g = o.indent || (o.forceBlockIndent || containsDocumentMarker(r) ? "  " : ""), w = B === "literal" ? !0 : B === "folded" || e === Scalar.BLOCK_FOLDED ? !1 : e === Scalar.BLOCK_LITERAL ? !0 : !lineLengthOverLimit(r, a, g.length);
  if (!r)
    return w ? `|
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
  let I = !1, n, C = -1;
  for (n = 0; n < r.length; ++n) {
    const d = r[n];
    if (d === " ")
      I = !0;
    else if (d === `
`)
      C = n;
    else
      break;
  }
  let t = r.substring(0, C < n ? C + 1 : n);
  t && (r = r.substring(t.length), t = t.replace(/\n+/g, `$&${g}`));
  let c = (I ? g ? "2" : "1" : "") + E;
  if (A && (c += " " + s(A.replace(/ ?[\r\n]+/g, " ")), i && i()), !w) {
    const d = r.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${g}`);
    let M = !1;
    const h = getFoldOptions(o, !0);
    B !== "folded" && e !== Scalar.BLOCK_FOLDED && (h.onOverflow = () => {
      M = !0;
    });
    const N = foldFlowLines(`${t}${d}${f}`, g, FOLD_BLOCK, h);
    if (!M)
      return `>${c}
${g}${N}`;
  }
  return r = r.replace(/\n+/g, `$&${g}`), `|${c}
${g}${t}${r}${f}`;
}
function plainString(A, e, r, o) {
  const { type: i, value: Q } = A, { actualString: B, implicitKey: s, indent: a, indentStep: g, inFlow: w } = e;
  if (s && Q.includes(`
`) || w && /[[\]{},]/.test(Q))
    return quotedString(Q, e);
  if (!Q || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(Q))
    return s || w || !Q.includes(`
`) ? quotedString(Q, e) : blockString(A, e, r, o);
  if (!s && !w && i !== Scalar.PLAIN && Q.includes(`
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
  const a = (w) => {
    switch (w) {
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
  let g = a(s);
  if (g === null) {
    const { defaultKeyType: w, defaultStringType: E } = e.options, l = i && w || E;
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
  const { allNullValues: Q, doc: B, indent: s, indentStep: a, options: { commentString: g, indentSeq: w, simpleKeys: E } } = r;
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
  let m = !1, I = !1, n = stringify(A, r, () => m = !0, () => I = !0);
  if (!f && !r.inFlow && n.length > 1024) {
    if (E)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    f = !0;
  }
  if (r.inFlow) {
    if (Q || e == null)
      return m && o && o(), n === "" ? "?" : f ? `? ${n}` : n;
  } else if (Q && !E || e == null && f)
    return n = `? ${n}`, l && !m ? n += lineComment(n, r.indent, g(l)) : I && i && i(), n;
  m && (l = null), f ? (l && (n += lineComment(n, r.indent, g(l))), n = `? ${n}
${s}:`) : (n = `${n}:`, l && (n += lineComment(n, r.indent, g(l))));
  let C, t, D;
  isNode(e) ? (C = !!e.spaceBefore, t = e.commentBefore, D = e.comment) : (C = !1, t = null, D = null, e && typeof e == "object" && (e = B.createNode(e))), r.implicitKey = !1, !f && !l && isScalar(e) && (r.indentAtStart = n.length + 1), I = !1, !w && a.length >= 2 && !r.inFlow && !f && isSeq(e) && !e.flow && !e.tag && !e.anchor && (r.indent = r.indent.substring(2));
  let c = !1;
  const d = stringify(e, r, () => c = !0, () => I = !0);
  let M = " ";
  if (l || C || t) {
    if (M = C ? `
` : "", t) {
      const h = g(t);
      M += `
${indentComment(h, r.indent)}`;
    }
    d === "" && !r.inFlow ? M === `
` && (M = `

`) : M += `
${r.indent}`;
  } else if (!f && isCollection(e)) {
    const h = d[0], N = d.indexOf(`
`), O = N !== -1, F = r.inFlow ?? e.flow ?? e.items.length === 0;
    if (O || !F) {
      let q = !1;
      if (O && (h === "&" || h === "!")) {
        let S = d.indexOf(" ");
        h === "&" && S !== -1 && S < N && d[S + 1] === "!" && (S = d.indexOf(" ", S + 1)), (S === -1 || N < S) && (q = !0);
      }
      q || (M = `
${r.indent}`);
    }
  } else (d === "" || d[0] === `
`) && (M = "");
  return n += M + d, r.inFlow ? c && o && o() : D && !c ? n += lineComment(n, r.indent, g(D)) : I && i && i(), n;
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
  const { indent: a, options: { commentString: g } } = r, w = Object.assign({}, r, { indent: Q, type: null });
  let E = !1;
  const l = [];
  for (let m = 0; m < e.length; ++m) {
    const I = e[m];
    let n = null;
    if (isNode(I))
      !E && I.spaceBefore && l.push(""), addCommentBefore(r, l, I.commentBefore, E), I.comment && (n = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (!E && t.spaceBefore && l.push(""), addCommentBefore(r, l, t.commentBefore, E));
    }
    E = !1;
    let C = stringify(I, w, () => n = null, () => E = !0);
    n && (C += lineComment(C, Q, g(n))), E && n && (E = !1), l.push(o + C);
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
` + indentComment(g(A), a), s && s()) : E && B && B(), f;
}
function stringifyFlowCollection({ items: A }, e, { flowChars: r, itemIndent: o }) {
  const { indent: i, indentStep: Q, flowCollectionPadding: B, options: { commentString: s } } = e;
  o += Q;
  const a = Object.assign({}, e, {
    indent: o,
    inFlow: !0,
    type: null
  });
  let g = !1, w = 0;
  const E = [];
  for (let m = 0; m < A.length; ++m) {
    const I = A[m];
    let n = null;
    if (isNode(I))
      I.spaceBefore && E.push(""), addCommentBefore(e, E, I.commentBefore, !1), I.comment && (n = I.comment);
    else if (isPair(I)) {
      const t = isNode(I.key) ? I.key : null;
      t && (t.spaceBefore && E.push(""), addCommentBefore(e, E, t.commentBefore, !1), t.comment && (g = !0));
      const D = isNode(I.value) ? I.value : null;
      D ? (D.comment && (n = D.comment), D.commentBefore && (g = !0)) : I.value == null && t?.comment && (n = t.comment);
    }
    n && (g = !0);
    let C = stringify(I, a, () => n = null);
    m < A.length - 1 && (C += ","), n && (C += lineComment(C, o, s(n))), !g && (E.length > w || C.includes(`
`)) && (g = !0), E.push(C), w = E.length;
  }
  const { start: l, end: f } = r;
  if (E.length === 0)
    return l + f;
  if (!g) {
    const m = E.reduce((I, n) => I + n.length + 2, 2);
    g = e.options.lineWidth > 0 && m > e.options.lineWidth;
  }
  if (g) {
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
    const { keepUndefined: i, replacer: Q } = o, B = new this(e), s = (a, g) => {
      if (typeof Q == "function")
        g = Q.call(r, a, g);
      else if (Array.isArray(Q) && !Q.includes(a))
        return;
      (g !== void 0 || i) && B.items.push(createPair(a, g, o));
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
      let a = s.i, g = s.n;
      if (Q.length > 2) {
        const E = [], l = [], f = (Q.length - 2) / 2, m = Q.slice(2, 2 + f);
        for (const I of m) {
          const n = A.subscripts[I];
          E.push(n.i), l.push(n.n);
        }
        a += `[${E.join(",")}]`, g += `[${l.join(",")}]`;
      }
      const w = {
        varId: a,
        varName: g,
        varType: B,
        varIndex: s.x,
        subscriptIndices: Q.length > 2 ? Q.slice(2 + (Q.length - 2) / 2) : void 0
      };
      i.push(w);
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
      const w = `ModelImpl_${a.varId}`;
      r.set(w, a), s.push(w);
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
  function r(g, w) {
    w < g.minValue ? (console.warn(
      `WARNING: Scenario input value ${w} is < min value (${g.minValue}) for input '${g.varName}'`
    ), w = g.minValue) : w > g.maxValue && (console.warn(
      `WARNING: Scenario input value ${w} is > max value (${g.maxValue}) for input '${g.varName}'`
    ), w = g.maxValue), g.value.set(w);
  }
  function o(g) {
    g.value.reset();
  }
  function i(g) {
    g.value.set(g.minValue);
  }
  function Q(g) {
    g.value.set(g.maxValue);
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
      for (const g of e.settings) {
        const w = A.get(g.inputVarId);
        if (w)
          switch (g.kind) {
            case "position":
              switch (g.position) {
                case "at-default":
                  o(w);
                  break;
                case "at-minimum":
                  i(w);
                  break;
                case "at-maximum":
                  Q(w);
                  break;
                default:
                  assertNeverExports.assertNever(g.position);
              }
              break;
            case "value":
              r(w, g.value);
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
const inputSpecs = [{ inputId: "a_dc", varId: "_global_diet_composition_switch", varName: "Global Diet Composition Switch", defaultValue: 2, minValue: -1, maxValue: 5 }, { inputId: "a_dc_1", varId: "_custom_global_diet_decomposition_multiplier[_pasmeat]", varName: "Custom global diet decomposition multiplier[PasMeat]", defaultValue: 37.9, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_2", varId: "_custom_global_diet_decomposition_multiplier[_cropmeat]", varName: "Custom global diet decomposition multiplier[CropMeat]", defaultValue: 118.4, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_3", varId: "_custom_global_diet_decomposition_multiplier[_dairy]", varName: "Custom global diet decomposition multiplier[Dairy]", defaultValue: 138.7, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_4", varId: "_custom_global_diet_decomposition_multiplier[_eggs]", varName: "Custom global diet decomposition multiplier[Eggs]", defaultValue: 24.6, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_5", varId: "_custom_global_diet_decomposition_multiplier[_pulses]", varName: "Custom global diet decomposition multiplier[Pulses]", defaultValue: 48.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_6", varId: "_custom_global_diet_decomposition_multiplier[_grains]", varName: "Custom global diet decomposition multiplier[Grains]", defaultValue: 980.2, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_7", varId: "_custom_global_diet_decomposition_multiplier[_vegfruits]", varName: "Custom global diet decomposition multiplier[VegFruits]", defaultValue: 169.1, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_8", varId: "_custom_global_diet_decomposition_multiplier[_othercrops]", varName: "Custom global diet decomposition multiplier[OtherCrops]", defaultValue: 533.3, minValue: 0, maxValue: 2e3 }, { inputId: "a_dc_9", varId: "_iam_diet_switch", varName: "IAM Diet Switch", defaultValue: 0, minValue: 0, maxValue: 4 }, { inputId: "a_flw", varId: "_fwl_multiplier", varName: "FWL Multiplier", defaultValue: 1e-4, minValue: -50, maxValue: 100 }, { inputId: "a_flw_1", varId: "_fwl_fraction_variation_by_supply_chain[_primaryproduction]", varName: "FWL Fraction Variation by Supply Chain[PrimaryProduction]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_2", varId: "_fwl_fraction_variation_by_supply_chain[_postharvest]", varName: "FWL Fraction Variation by Supply Chain[PostHarvest]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_3", varId: "_fwl_fraction_variation_by_supply_chain[_processing]", varName: "FWL Fraction Variation by Supply Chain[Processing]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_4", varId: "_fwl_fraction_variation_by_supply_chain[_distribution]", varName: "FWL Fraction Variation by Supply Chain[Distribution]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_flw_5", varId: "_fwl_fraction_variation_by_supply_chain[_consumption]", varName: "FWL Fraction Variation by Supply Chain[Consumption]", defaultValue: 100, minValue: 0, maxValue: 120 }, { inputId: "a_ap", varId: "_market_share_ap_multiplier", varName: "Market share AP multiplier", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "a_ap_1", varId: "_custom_scenario_market_share_of_alternative_proteins[_altpasmeat]", varName: "Custom scenario market share of alternative proteins[AltPasMeat]", defaultValue: 15, minValue: 0, maxValue: 100 }, { inputId: "a_ap_2", varId: "_custom_scenario_market_share_of_alternative_proteins[_altcropmeat]", varName: "Custom scenario market share of alternative proteins[AltCropMeat]", defaultValue: 25, minValue: 0, maxValue: 100 }, { inputId: "a_ap_3", varId: "_custom_scenario_market_share_of_alternative_proteins[_altdairy]", varName: "Custom scenario market share of alternative proteins[AltDairy]", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "a_ap_4", varId: "_custom_scenario_market_share_of_alternative_proteins[_eggs]", varName: "Custom scenario market share of alternative proteins[Eggs]", defaultValue: 5, minValue: 0, maxValue: 100 }, { inputId: "u_dc", varId: "_fake_value_1", varName: "Fake Value 1", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_1", varId: "_global_diet_scenario_switch", varName: "Global Diet Scenario Switch", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dc_2", varId: "_self_efficacy_aggregated_multiplier", varName: "Self efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_3", varId: "_response_efficacy_aggregated_multiplier", varName: "Response efficacy aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_4", varId: "_perceived_risk_aggregated_multiplier", varName: "Perceived risk aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_5", varId: "_subjective_norm_aggregated_multiplier", varName: "Subjective norm aggregated multiplier", defaultValue: 100, minValue: 0, maxValue: 200 }, { inputId: "u_dc_6", varId: "_meat_diet_composition_switch_scenario", varName: "Meat Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dc_7", varId: "_vegetarian_diet_composition_switch_scenario", varName: "Vegetarian Diet Composition Switch Scenario", defaultValue: 0, minValue: 0, maxValue: 1 }, { inputId: "u_dis", varId: "_fake_value_21", varName: "Fake Value 21", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_dis_1", varId: "_sigma_variation", varName: "Sigma Variation", defaultValue: 1, minValue: 0.6, maxValue: 2 }, { inputId: "u_dis_2", varId: "_alpha_variation", varName: "Alpha Variation", defaultValue: 0, minValue: -2, maxValue: 2 }, { inputId: "u_flw", varId: "_fake_value_2", varName: "Fake Value 2", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "u_flw_1", varId: "_recovered_waste_destination_variation", varName: "Recovered Waste Destination Variation", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "u_flw_2", varId: "_recovered_loss_destination_variation", varName: "Recovered Loss Destination Variation", defaultValue: 50, minValue: 0, maxValue: 100 }, { inputId: "u_ap", varId: "_fake_value_6", varName: "Fake Value 6", defaultValue: 2050, minValue: 2e3, maxValue: 2100 }, { inputId: "u_ap_1a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltPasMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_1c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altpasmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltPasMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_plant]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Plant]", defaultValue: 80, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_precferm]", varName: "Fraction of alternative protein types in the market[AltCropMeat, PrecFerm]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_2c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altcropmeat,_cult]", varName: "Fraction of alternative protein types in the market[AltCropMeat, Cult]", defaultValue: 10, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3a", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_plant]", varName: "Fraction of alternative protein types in the market[AltDairy, Plant]", defaultValue: 33, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3b", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_precferm]", varName: "Fraction of alternative protein types in the market[AltDairy, PrecFerm]", defaultValue: 67, minValue: 0, maxValue: 100 }, { inputId: "u_ap_3c", varId: "_fraction_of_alternative_protein_types_in_the_market[_altdairy,_cult]", varName: "Fraction of alternative protein types in the market[AltDairy, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4a", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_plant]", varName: "Fraction of alternative protein types in the market[AltEggs, Plant]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4b", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_precferm]", varName: "Fraction of alternative protein types in the market[AltEggs, PrecFerm]", defaultValue: 100, minValue: 0, maxValue: 100 }, { inputId: "u_ap_4c", varId: "_fraction_of_alternative_protein_types_in_the_market[_alteggs,_cult]", varName: "Fraction of alternative protein types in the market[AltEggs, Cult]", defaultValue: 0, minValue: 0, maxValue: 100 }, { inputId: "ed", varId: "_fake_value_4", varName: "Fake Value 4", defaultValue: 0, minValue: 0, maxValue: 2 }, { inputId: "ed1", varId: "_start_year_of_global_diet", varName: "Start Year of Global Diet", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed2", varId: "_end_year_of_global_diet", varName: "End Year of Global Diet", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed3", varId: "_start_year_of_fwl_switch", varName: "Start Year of FWL Switch", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed4", varId: "_end_year_of_fwl_switch", varName: "End Year of FWL Switch", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed5", varId: "_start_year_of_ap", varName: "Start Year of AP", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed6", varId: "_end_year_of_ap", varName: "End Year of AP", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed9", varId: "_start_year_of_sigma_variation", varName: "Start Year of Sigma Variation", defaultValue: 2025, minValue: 2e3, maxValue: 2100 }, { inputId: "ed10", varId: "_end_year_of_sigma_variation", varName: "End Year of Sigma Variation", defaultValue: 2040, minValue: 2e3, maxValue: 2100 }, { inputId: "ed8", varId: "_fake_value_3", varName: "Fake Value 3", defaultValue: 1, minValue: 0, maxValue: 2 }, { inputId: "ed_ext_1", varId: "_annual_change_in_oil_reserves_variation", varName: "Annual Change in Oil Reserves Variation", defaultValue: 21e9, minValue: 7875e6, maxValue: 39375e6 }, { inputId: "ed_ext_2", varId: "_annual_growth_in_gas_reserves_variation", varName: "Annual Growth in Gas Reserves Variation", defaultValue: 5e3, minValue: 2350, maxValue: 7150 }, { inputId: "ed_ext_3", varId: "_birth_gender_fraction_variation", varName: "Birth Gender Fraction Variation", defaultValue: 0.515, minValue: 0.5075746, maxValue: 0.5182594 }, { inputId: "ed_ext_4", varId: "_ccs_scenario_variation", varName: "CCS Scenario Variation", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_5", varId: "_climate_mortality_switch", varName: "CLIMATE MORTALITY SWITCH", defaultValue: 0, minValue: -1, maxValue: 1 }, { inputId: "ed_ext_6", varId: "_capital_elasticity_output_variation", varName: "Capital Elasticity Output Variation", defaultValue: 0.425, minValue: 0.4121916, maxValue: 0.5658924 }, { inputId: "ed_ext_7", varId: "_carbon_price_slope", varName: "Carbon Price Slope", defaultValue: 5, minValue: -0.6, maxValue: 6.6 }, { inputId: "ed_ext_8", varId: "_climate_action_year", varName: "Climate Action Year", defaultValue: 2020, minValue: 2018, maxValue: 2042 }, { inputId: "ed_ext_9", varId: "_climate_damage_function_switch", varName: "Climate Damage Function SWITCH", defaultValue: 4, minValue: 3.6, maxValue: 4.4 }, { inputId: "ed_ext_10", varId: "_climate_policy_scenario", varName: "Climate Policy Scenario", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_11", varId: "_desired_total_c_emission_from_fossil_fuels_variation", varName: "Desired Total C Emission from Fossil Fuels Variation", defaultValue: 75e8, minValue: -1e9, maxValue: 11e9 }, { inputId: "ed_ext_12", varId: "_effect_of_gdp_on_urban_land_requirement_l_variation", varName: "Effect of GDP on Urban Land Requirement l Variation", defaultValue: 1.25, minValue: 1.05, maxValue: 1.95 }, { inputId: "ed_ext_13", varId: "_effect_of_gdp_on_urban_land_requirement_x0_variation", varName: "Effect of GDP on Urban Land Requirement x0 Variation", defaultValue: 5, minValue: 2.2, maxValue: 5.8 }, { inputId: "ed_ext_14", varId: "_effectiveness_of_investment_in_coal_recovery_technology_variation", varName: "Effectiveness of Investment in Coal Recovery Technology Variation", defaultValue: 13e-13, minValue: 877e-15, maxValue: 205e-14 }, { inputId: "ed_ext_15", varId: "_effectiveness_of_investment_in_gas_recovery_technology_variation", varName: "Effectiveness of Investment in Gas Recovery Technology Variation", defaultValue: 3e-11, minValue: 141e-13, maxValue: 429e-13 }, { inputId: "ed_ext_16", varId: "_effectiveness_of_investment_in_oil_recovery_technology_variation", varName: "Effectiveness of Investment in Oil Recovery Technology Variation", defaultValue: 28e-12, minValue: 12e-12, maxValue: 356e-13 }, { inputId: "ed_ext_17", varId: "_fwl_fraction_variation[_cropmeat]", varName: "FWL Fraction Variation[CropMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_18", varId: "_fwl_fraction_variation[_dairy]", varName: "FWL Fraction Variation[Dairy]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_19", varId: "_fwl_fraction_variation[_eggs]", varName: "FWL Fraction Variation[Eggs]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_20", varId: "_fwl_fraction_variation[_grains]", varName: "FWL Fraction Variation[Grains]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_21", varId: "_fwl_fraction_variation[_othercrops]", varName: "FWL Fraction Variation[OtherCrops]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_22", varId: "_fwl_fraction_variation[_pasmeat]", varName: "FWL Fraction Variation[PasMeat]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_23", varId: "_fwl_fraction_variation[_pulses]", varName: "FWL Fraction Variation[Pulses]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_24", varId: "_fwl_fraction_variation[_vegfruits]", varName: "FWL Fraction Variation[VegFruits]", defaultValue: 1, minValue: 0.88, maxValue: 1.12 }, { inputId: "ed_ext_25", varId: "_feed_share_of_grains_variation", varName: "Feed Share of Grains Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_26", varId: "_forest_to_agriculture_land_allocation_time_variation", varName: "Forest to Agriculture Land Allocation Time Variation", defaultValue: 5, minValue: 4.95, maxValue: 5.55 }, { inputId: "ed_ext_27", varId: "_fraction_for_wind_and_solar_learning_curve_strength_variation", varName: "Fraction for Wind and Solar Learning Curve Strength Variation", defaultValue: 0.2, minValue: 0.197, maxValue: 0.233 }, { inputId: "ed_ext_28", varId: "_fraction_of_agricultural_land_conversion_from_forest_variation", varName: "Fraction of Agricultural Land Conversion from Forest Variation", defaultValue: 0.95, minValue: 0.89775, maxValue: 0.95475 }, { inputId: "ed_ext_29", varId: "_fraction_of_coal_revenues_invested_in_technology_variation", varName: "Fraction of Coal Revenues Invested in Technology Variation", defaultValue: 0.35, minValue: 0.23625, maxValue: 0.55125 }, { inputId: "ed_ext_30", varId: "_fraction_of_gas_revenues_invested_in_technology_variation", varName: "Fraction of Gas Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0282, maxValue: 0.0498 }, { inputId: "ed_ext_31", varId: "_fraction_of_oil_revenues_invested_in_technology_variation", varName: "Fraction of Oil Revenues Invested in Technology Variation", defaultValue: 0.04, minValue: 0.0172, maxValue: 0.0508 }, { inputId: "ed_ext_32", varId: "_investment_in_fossil_fuel_exploration_and_production_delay_variation", varName: "Investment in Fossil Fuel Exploration and Production Delay Variation", defaultValue: 5, minValue: 2.125, maxValue: 6.625 }, { inputId: "ed_ext_33", varId: "_land_mitigation_policy_multiplier", varName: "Land Mitigation Policy Multiplier", defaultValue: 0.5, minValue: -0.05, maxValue: 0.55 }, { inputId: "ed_ext_34", varId: "_life_expectancy_variation", varName: "Life Expectancy Variation", defaultValue: 65.68, minValue: 57.01263, maxValue: 67.54587 }, { inputId: "ed_ext_35", varId: "_max_energy_demand_per_capita_variation", varName: "Max Energy Demand per Capita Variation", defaultValue: 48e-7, minValue: 293e-8, maxValue: 811e-8 }, { inputId: "ed_ext_36", varId: "_meat_diet_composition_switch", varName: "Meat Diet Composition Switch", defaultValue: 0, minValue: -0.2, maxValue: 2.2 }, { inputId: "ed_ext_37", varId: "_normal_fertility_variation", varName: "Normal Fertility Variation", defaultValue: 2.63, minValue: 1.52438, maxValue: 3.5027 }, { inputId: "ed_ext_38", varId: "_normal_fraction_intended_to_change_diet_variation", varName: "Normal Fraction Intended to Change Diet Variation", defaultValue: 0.04, minValue: 0.0398, maxValue: 0.0422 }, { inputId: "ed_ext_39", varId: "_normal_shift_fraction_from_meat_to_vegetarianism_variation", varName: "Normal Shift Fraction from Meat to Vegetarianism Variation", defaultValue: 3e-3, minValue: 2025e-6, maxValue: 4725e-6 }, { inputId: "ed_ext_40", varId: "_normal_shift_fraction_from_vegetarianism_to_meat_variation", varName: "Normal Shift Fraction from Vegetarianism to Meat Variation", defaultValue: 0.01, minValue: 425e-5, maxValue: 0.01325 }, { inputId: "ed_ext_41", varId: "_persistence_tertiary_variation[_female]", varName: "Persistence Tertiary Variation[female]", defaultValue: 0.829103, minValue: 0.7682496, maxValue: 1.0200864 }, { inputId: "ed_ext_42", varId: "_persistence_tertiary_variation[_male]", varName: "Persistence Tertiary Variation[male]", defaultValue: 0.805835, minValue: 0.6773132, maxValue: 0.8984468 }, { inputId: "ed_ext_43", varId: "_price_elasticity_of_demand_biomass_variation", varName: "Price Elasticity of Demand Biomass Variation", defaultValue: 0.8, minValue: 0.796, maxValue: 0.844 }, { inputId: "ed_ext_44", varId: "_price_elasticity_of_demand_coal_variation", varName: "Price Elasticity of Demand Coal Variation", defaultValue: 0.89, minValue: 0.76985, maxValue: 1.14365 }, { inputId: "ed_ext_45", varId: "_price_elasticity_of_demand_gas_variation", varName: "Price Elasticity of Demand Gas Variation", defaultValue: 0.54, minValue: 0.4995, maxValue: 0.9855 }, { inputId: "ed_ext_46", varId: "_price_elasticity_of_demand_oil_variation", varName: "Price Elasticity of Demand Oil Variation", defaultValue: 0.6, minValue: 0.432, maxValue: 0.648 }, { inputId: "ed_ext_47", varId: "_price_elasticity_of_demand_wind_and_solar_variation", varName: "Price Elasticity of Demand Wind and Solar Variation", defaultValue: 1, minValue: 0.975, maxValue: 1.275 }, { inputId: "ed_ext_48", varId: "_rcp_scenario", varName: "RCP Scenario", defaultValue: 3, minValue: 0.6, maxValue: 5.4 }, { inputId: "ed_ext_49", varId: "_reference_co2_removal_rate", varName: "Reference CO2 Removal Rate", defaultValue: 37e6, minValue: -37e5, maxValue: 407e5 }, { inputId: "ed_ext_50", varId: "_reference_change_in_fossil_fuel_market_share_variation", varName: "Reference Change in Fossil Fuel Market Share Variation", defaultValue: 1, minValue: 0.92, maxValue: 1.88 }, { inputId: "ed_ext_51", varId: "_reference_change_in_market_share_biomass_variation", varName: "Reference Change in Market Share Biomass Variation", defaultValue: 3.25, minValue: 3.05, maxValue: 5.45 }, { inputId: "ed_ext_52", varId: "_reference_change_in_market_share_solar_variation", varName: "Reference Change in Market Share Solar Variation", defaultValue: 8, minValue: 7.84, maxValue: 9.76 }, { inputId: "ed_ext_53", varId: "_reference_change_in_market_share_wind_variation", varName: "Reference Change in Market Share Wind Variation", defaultValue: 6, minValue: 1.875, maxValue: 6.375 }, { inputId: "ed_ext_54", varId: "_reference_cost_of_biomass_energy_production_final_change_rate_variation", varName: "Reference Cost of Biomass Energy Production Final Change Rate Variation", defaultValue: 3e7, minValue: 855e4, maxValue: 3195e4 }, { inputId: "ed_ext_55", varId: "_reference_cost_of_solar_energy_production_final_change_rate_variation", varName: "Reference Cost of Solar Energy Production Final Change Rate Variation", defaultValue: 10, minValue: 5.6, maxValue: 10.4 }, { inputId: "ed_ext_56", varId: "_reference_daily_caloric_intake_variation", varName: "Reference Daily Caloric Intake Variation", defaultValue: 1655.8, minValue: 1530.429, maxValue: 1831.497 }, { inputId: "ed_ext_57", varId: "_reference_input_neutral_tc_in_agriculture_variation", varName: "Reference Input Neutral TC in Agriculture Variation", defaultValue: 0.3, minValue: 0.2955, maxValue: 0.3495 }, { inputId: "ed_ext_58", varId: "_reference_other_technology_variation", varName: "Reference Other Technology Variation", defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_59", varId: "_reference_meat_yield_variation", varName: "Reference meat yield Variation", defaultValue: 0.07, minValue: 0.06825, maxValue: 0.08925 }, { inputId: "ed_ext_60", varId: "_relative_productivity_of_investment_in_coal_exploration_variation", varName: "Relative Productivity of Investment in Coal Exploration Variation", defaultValue: 0.15, minValue: 0.10125, maxValue: 0.23625 }, { inputId: "ed_ext_61", varId: "_relative_productivity_of_investment_in_fossil_fuel_production_compared_to_exploration_variation", varName: "Relative Productivity of Investment in Fossil Fuel Production Compared to Exploration Variation", defaultValue: 10, minValue: 9, maxValue: 11 }, { inputId: "ed_ext_62", varId: "_relative_productivity_of_investment_in_gas_exploration_variation", varName: "Relative Productivity of Investment in Gas Exploration Variation", defaultValue: 1.25, minValue: 0.84375, maxValue: 1.96875 }, { inputId: "ed_ext_63", varId: "_relative_productivity_of_investment_in_oil_exploration_variation", varName: "Relative Productivity of Investment in Oil Exploration Variation", defaultValue: 1, minValue: 0.43, maxValue: 1.27 }, { inputId: "ed_ext_64", varId: "_renewable_cost_reduction_and_technology_improvement_ramp_period_variation", varName: "Renewable Cost Reduction and Technology Improvement Ramp Period Variation", defaultValue: 50, minValue: 41.75, maxValue: 50.75 }, { inputId: "ed_ext_65", varId: "_ssp_demographic_variation_time", varName: "SSP Demographic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_66", varId: "_ssp_economic_variation_time", varName: "SSP Economic Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_67", varId: "_ssp_energy_demand_variation_time", varName: "SSP Energy Demand Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_68", varId: "_ssp_energy_production_variation_time", varName: "SSP Energy Production Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_69", varId: "_ssp_energy_technology_variation_time", varName: "SSP Energy Technology Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_70", varId: "_ssp_food_and_diet_variation_time", varName: "SSP Food and Diet Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_71", varId: "_ssp_land_use_change_variation_time", varName: "SSP Land Use Change Variation Time", defaultValue: 5, minValue: 4.5, maxValue: 10.5 }, { inputId: "ed_ext_72", varId: "_secondary_education_enrollment_variation[_female,__10_14_]", varName: 'Secondary education enrollment Variation[female,"10-14"]', defaultValue: 0.9, minValue: 0.4549566, maxValue: 1.0495494 }, { inputId: "ed_ext_73", varId: "_secondary_education_enrollment_variation[_female,__15_19_]", varName: 'Secondary education enrollment Variation[female,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_74", varId: "_secondary_education_enrollment_variation[_male,__10_14_]", varName: 'Secondary education enrollment Variation[male,"10-14"]', defaultValue: 1, minValue: 0.45, maxValue: 1.05 }, { inputId: "ed_ext_75", varId: "_secondary_education_enrollment_variation[_male,__15_19_]", varName: 'Secondary education enrollment Variation[male,"15-19"]', defaultValue: 0.85, minValue: 0.34, maxValue: 1.06 }, { inputId: "ed_ext_76", varId: "_self_efficacy_multiplier_female_variation", varName: "Self Efficacy Multiplier Female Variation", defaultValue: 1.2, minValue: 1.038, maxValue: 1.542 }, { inputId: "ed_ext_77", varId: "_solar_conversion_efficiency_factor_final_change_rate_variation", varName: "Solar Conversion Efficiency Factor Final Change Rate Variation", defaultValue: 2, minValue: 1.97, maxValue: 2.33 }, { inputId: "ed_ext_78", varId: "_tertiary_education_enrollment_variation[_female]", varName: "Tertiary education enrollment Variation[female]", defaultValue: 0.4, minValue: 0.1641501, maxValue: 0.5294289 }, { inputId: "ed_ext_79", varId: "_tertiary_education_enrollment_variation[_male]", varName: "Tertiary education enrollment Variation[male]", defaultValue: 0.39, minValue: 0.227726, maxValue: 0.732194 }, { inputId: "ed_ext_80", varId: "_undiscovered_coal_resources_variation", varName: "Undiscovered Coal Resources Variation", defaultValue: 9e5, minValue: 607500, maxValue: 1417500 }, { inputId: "ed_ext_81", varId: "_vegetarian_diet_composition_switch", varName: "Vegetarian Diet Composition Switch", defaultValue: 0, minValue: -0.1, maxValue: 1.1 }, { inputId: "ed_ext_82", varId: "_n2o_agriculture_abatement_maximum_fraction", varName: "N2O Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_83", varId: "_ch4_agriculture_abatement_maximum_fraction", varName: "CH4 Agriculture Abatement Maximum Fraction", defaultValue: 0.45, minValue: 0.05, maxValue: 0.6 }, { inputId: "ed_ext_84", varId: "_n2o_iw_abatement_maximum_fraction", varName: "N2O IW Abatement Maximum Fraction", defaultValue: 0.9, minValue: 0.8, maxValue: 0.97 }, { inputId: "ed_ext_85", varId: "_ch4_waste_abatement_maximum_fraction", varName: "CH4 Waste Abatement Maximum Fraction", defaultValue: 0.8, minValue: 0.2, maxValue: 0.8 }, { inputId: "ed_ext_86", varId: "_ch4_energy_abatement_maximum_fraction", varName: "CH4 Energy Abatement Maximum Fraction", defaultValue: 0.5, minValue: 0.2, maxValue: 0.8 }], outputSpecs = [{ varId: "___data__agriculture_land_", varName: '"(data) Agriculture Land"' }, { varId: "___data__fat_supply_quantity_from_animal_products_fao_", varName: '"(data) Fat supply quantity from Animal Products FAO"' }, { varId: "___data__fat_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Fat supply quantity from Vegetal Products FAO"' }, { varId: "___data__food_supply_quantity_from_animal_products_fao_", varName: '"(data) Food supply quantity from Animal Products FAO"' }, { varId: "___data__food_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Food supply quantity from Vegetal Products FAO"' }, { varId: "___data__forest_land_", varName: '"(data) Forest Land"' }, { varId: "___data__other_land_", varName: '"(data) Other Land"' }, { varId: "___data__pou_fao_", varName: '"(data) PoU FAO"' }, { varId: "___data__protein_supply_quantity_from_animal_products_fao_", varName: '"(data) Protein supply quantity from Animal Products FAO"' }, { varId: "___data__protein_supply_quantity_from_vegetal_products_fao_", varName: '"(data) Protein supply quantity from Vegetal Products FAO"' }, { varId: "___data__commerical_n_", varName: '"(data) commerical N"' }, { varId: "___data__commerical_p_", varName: '"(data) commerical P"' }, { varId: "___data__ghg_ch4_in_co2eq_", varName: '"(data) ghg ch4 in CO2eq"' }, { varId: "___data__ghg_co2_", varName: '"(data) ghg co2"' }, { varId: "___data__ghg_n2o_in_co2eq_", varName: '"(data) ghg n2o in CO2eq"' }, { varId: "___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_", varName: '"(data) global agriculture freshwater withdrawal rate AQUASTAT Billion Cubic Metres"' }, { varId: "__stress_weighted_water_use_for_food_[_cropmeat]", varName: '"Stress-weighted Water Use for Food"[CropMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_dairy]", varName: '"Stress-weighted Water Use for Food"[Dairy]' }, { varId: "__stress_weighted_water_use_for_food_[_eggs]", varName: '"Stress-weighted Water Use for Food"[Eggs]' }, { varId: "__stress_weighted_water_use_for_food_[_grains]", varName: '"Stress-weighted Water Use for Food"[Grains]' }, { varId: "__stress_weighted_water_use_for_food_[_othercrops]", varName: '"Stress-weighted Water Use for Food"[OtherCrops]' }, { varId: "__stress_weighted_water_use_for_food_[_pasmeat]", varName: '"Stress-weighted Water Use for Food"[PasMeat]' }, { varId: "__stress_weighted_water_use_for_food_[_pulses]", varName: '"Stress-weighted Water Use for Food"[Pulses]' }, { varId: "__stress_weighted_water_use_for_food_[_vegfruits]", varName: '"Stress-weighted Water Use for Food"[VegFruits]' }, { varId: "__stress_weighted_water_use_per_calorie_", varName: '"Stress-weighted Water Use per Calorie"' }, { varId: "__stress_weighted_water_use_per_protein_", varName: '"Stress-weighted Water Use per Protein"' }, { varId: "__total_stress_weighted_water_use_for_food_", varName: '"Total Stress-weighted Water Use for Food"' }, { varId: "_agricultral_land_erosion", varName: "Agricultral Land Erosion" }, { varId: "_agricultural_land", varName: "Agricultural Land" }, { varId: "_agricultural_land_conversion", varName: "Agricultural Land Conversion" }, { varId: "_alpha_ln_pou", varName: "Alpha ln PoU" }, { varId: "_annual_caloric_demand_from_conventional_food[_cropmeat]", varName: "Annual Caloric Demand from Conventional Food [CropMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_dairy]", varName: "Annual Caloric Demand from Conventional Food [Dairy]" }, { varId: "_annual_caloric_demand_from_conventional_food[_eggs]", varName: "Annual Caloric Demand from Conventional Food [Eggs]" }, { varId: "_annual_caloric_demand_from_conventional_food[_grains]", varName: "Annual Caloric Demand from Conventional Food [Grains]" }, { varId: "_annual_caloric_demand_from_conventional_food[_othercrops]", varName: "Annual Caloric Demand from Conventional Food [OtherCrops]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pasmeat]", varName: "Annual Caloric Demand from Conventional Food [PasMeat]" }, { varId: "_annual_caloric_demand_from_conventional_food[_pulses]", varName: "Annual Caloric Demand from Conventional Food [Pulses]" }, { varId: "_annual_caloric_demand_from_conventional_food[_vegfruits]", varName: "Annual Caloric Demand from Conventional Food [VegFruits]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [CropMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Dairy]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Eggs]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Grains]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]", varName: "Annual Caloric Demand inc Waste per Capita per Day [OtherCrops]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]", varName: "Annual Caloric Demand inc Waste per Capita per Day [PasMeat]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]", varName: "Annual Caloric Demand inc Waste per Capita per Day [Pulses]" }, { varId: "_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]", varName: "Annual Caloric Demand inc Waste per Capita per Day [VegFruits]" }, { varId: "_annual_total_crop_demand_for_aps[_grains]", varName: "Annual Total Crop Demand for APs [Grains]" }, { varId: "_annual_total_crop_demand_for_aps[_othercrops]", varName: "Annual Total Crop Demand for APs [OtherCrops]" }, { varId: "_annual_total_crop_demand_for_aps[_pulses]", varName: "Annual Total Crop Demand for APs [Pulses]" }, { varId: "_annual_total_crop_demand_for_aps[_vegfruits]", varName: "Annual Total Crop Demand for APs [VegFruits]" }, { varId: "_ch4_afolu_in_co2eq", varName: "CH4 AFOLU in CO2eq" }, { varId: "_ch4_radiative_forcing", varName: "CH4 Radiative Forcing" }, { varId: "_ch4_from_burning_biomass_in_co2eq", varName: "CH4 from Burning Biomass in CO2eq" }, { varId: "_ch4_from_livestocks_and_manure_in_co2eq", varName: "CH4 from Livestocks and Manure in CO2eq" }, { varId: "_ch4_from_rice_cultivation_in_co2eq", varName: "CH4 from Rice Cultivation in CO2eq" }, { varId: "_co2_afolu_in_co2eq", varName: "CO2 AFOLU in CO2eq" }, { varId: "_co2_radiative_forcing", varName: "CO2 Radiative Forcing" }, { varId: "_co2_from_burning_biomass", varName: "CO2 from Burning Biomass" }, { varId: "_co2_from_drained_organic_soils", varName: "CO2 from Drained Organic Soils" }, { varId: "_co2_from_net_forest_land_emissions_and_removals", varName: "CO2 from Net Forest Land Emissions and Removals" }, { varId: "_caloric_availability_per_capita_per_day_from_animal_food", varName: "Caloric Availability per Capita per Day from Animal Food" }, { varId: "_caloric_availability_per_capita_per_day_from_plant_food", varName: "Caloric Availability per Capita per Day from Plant Food" }, { varId: "_commercial_n_application_for_agriculture", varName: "Commercial N application for agriculture" }, { varId: "_commercial_n_application_for_each_category[_grains]", varName: "Commercial N application for each category [Grains]" }, { varId: "_commercial_n_application_for_each_category[_othercrops]", varName: "Commercial N application for each category [OtherCrops]" }, { varId: "_commercial_n_application_for_each_category[_pasmeat]", varName: "Commercial N application for each category [PasMeat]" }, { varId: "_commercial_n_application_for_each_category[_pulses]", varName: "Commercial N application for each category [Pulses]" }, { varId: "_commercial_n_application_for_each_category[_vegfruits]", varName: "Commercial N application for each category [VegFruits]" }, { varId: "_commercial_p_application_for_agriculture", varName: "Commercial P application for agriculture" }, { varId: "_commercial_p_application_for_each_category[_grains]", varName: "Commercial P application for each category [Grains]" }, { varId: "_commercial_p_application_for_each_category[_othercrops]", varName: "Commercial P application for each category [OtherCrops]" }, { varId: "_commercial_p_application_for_each_category[_pasmeat]", varName: "Commercial P application for each category [PasMeat]" }, { varId: "_commercial_p_application_for_each_category[_pulses]", varName: "Commercial P application for each category [Pulses]" }, { varId: "_commercial_p_application_for_each_category[_vegfruits]", varName: "Commercial P application for each category [VegFruits]" }, { varId: "_cropland_needed", varName: "Cropland Needed" }, { varId: "_cropland_yield", varName: "Cropland Yield" }, { varId: "_cropland_yield_indicator", varName: "Cropland Yield Indicator" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altcropmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltCropMeat]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altdairy]", varName: "Daily Caloric Demand from Alternative Proteins [AltDairy]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_alteggs]", varName: "Daily Caloric Demand from Alternative Proteins [AltEggs]" }, { varId: "_daily_caloric_demand_from_alternative_proteins[_altpasmeat]", varName: "Daily Caloric Demand from Alternative Proteins [AltPasMeat]" }, { varId: "_deforestation_as_percentage_of_initial_forest_land", varName: "Deforestation as Percentage of Initial Forest Land" }, { varId: "_diet_composition_percentage[_cropmeat]", varName: "Diet Composition Percentage[CropMeat]" }, { varId: "_diet_composition_percentage[_dairy]", varName: "Diet Composition Percentage[Dairy]" }, { varId: "_diet_composition_percentage[_eggs]", varName: "Diet Composition Percentage[Eggs]" }, { varId: "_diet_composition_percentage[_grains]", varName: "Diet Composition Percentage[Grains]" }, { varId: "_diet_composition_percentage[_othercrops]", varName: "Diet Composition Percentage[OtherCrops]" }, { varId: "_diet_composition_percentage[_pasmeat]", varName: "Diet Composition Percentage[PasMeat]" }, { varId: "_diet_composition_percentage[_pulses]", varName: "Diet Composition Percentage[Pulses]" }, { varId: "_diet_composition_percentage[_vegfruits]", varName: "Diet Composition Percentage[VegFruits]" }, { varId: "_dietary_energy_supply", varName: "Dietary Energy Supply" }, { varId: "_fwl_fractions_by_food_categories[_cropmeat]", varName: "FWL Fractions by Food Categories[CropMeat]" }, { varId: "_fwl_fractions_by_food_categories[_dairy]", varName: "FWL Fractions by Food Categories[Dairy]" }, { varId: "_fwl_fractions_by_food_categories[_eggs]", varName: "FWL Fractions by Food Categories[Eggs]" }, { varId: "_fwl_fractions_by_food_categories[_grains]", varName: "FWL Fractions by Food Categories[Grains]" }, { varId: "_fwl_fractions_by_food_categories[_othercrops]", varName: "FWL Fractions by Food Categories[OtherCrops]" }, { varId: "_fwl_fractions_by_food_categories[_pasmeat]", varName: "FWL Fractions by Food Categories[PasMeat]" }, { varId: "_fwl_fractions_by_food_categories[_pulses]", varName: "FWL Fractions by Food Categories[Pulses]" }, { varId: "_fwl_fractions_by_food_categories[_vegfruits]", varName: "FWL Fractions by Food Categories[VegFruits]" }, { varId: "_forest_land", varName: "Forest Land" }, { varId: "_freshwater_withdrawal_for_food[_cropmeat]", varName: "Freshwater Withdrawal for Food[CropMeat]" }, { varId: "_freshwater_withdrawal_for_food[_dairy]", varName: "Freshwater Withdrawal for Food[Dairy]" }, { varId: "_freshwater_withdrawal_for_food[_eggs]", varName: "Freshwater Withdrawal for Food[Eggs]" }, { varId: "_freshwater_withdrawal_for_food[_grains]", varName: "Freshwater Withdrawal for Food[Grains]" }, { varId: "_freshwater_withdrawal_for_food[_othercrops]", varName: "Freshwater Withdrawal for Food[OtherCrops]" }, { varId: "_freshwater_withdrawal_for_food[_pasmeat]", varName: "Freshwater Withdrawal for Food[PasMeat]" }, { varId: "_freshwater_withdrawal_for_food[_pulses]", varName: "Freshwater Withdrawal for Food[Pulses]" }, { varId: "_freshwater_withdrawal_for_food[_vegfruits]", varName: "Freshwater Withdrawal for Food[VegFruits]" }, { varId: "_freshwater_withdrawal_per_calorie", varName: "Freshwater Withdrawal per Calorie" }, { varId: "_freshwater_withdrawal_per_protein", varName: "Freshwater Withdrawal per Protein" }, { varId: "_healthy_life_expectancy[_male,__0_4_]", varName: 'Healthy life expectancy[male,"0-4"]' }, { varId: "_impact_of_biomass_production_on_biodiversity", varName: "Impact of Biomass Production on Biodiversity" }, { varId: "_impact_of_climate_damage_on_biodiversity", varName: "Impact of Climate Damage on Biodiversity" }, { varId: "_impact_of_fertilizer_consumption_on_biodiversity", varName: "Impact of Fertilizer Consumption on Biodiversity" }, { varId: "_impact_of_land_use_change_on_biodiversity", varName: "Impact of Land Use Change on Biodiversity" }, { varId: "_land_allocated_for_animal_calories", varName: "Land Allocated for Animal Calories" }, { varId: "_land_allocated_for_energy_crops", varName: "Land Allocated for Energy Crops" }, { varId: "_land_allocated_for_food_crops", varName: "Land Allocated for Food Crops" }, { varId: "_land_use_per_calorie_of_food", varName: "Land Use per Calorie of Food" }, { varId: "_life_expectancy[_male,__0_4_]", varName: 'Life expectancy[male,"0-4"]' }, { varId: "_mean_species_abundance", varName: "Mean Species Abundance" }, { varId: "_minimum_dietary_energy_requirement", varName: "Minimum Dietary Energy Requirement" }, { varId: "_n2o_afolu_in_co2eq", varName: "N2O AFOLU in CO2eq" }, { varId: "_n2o_radiative_forcing", varName: "N2O Radiative Forcing" }, { varId: "_n2o_from_agriculture_soils_in_co2eq", varName: "N2O from Agriculture Soils in CO2eq" }, { varId: "_n2o_from_burning_biomass_in_co2eq", varName: "N2O from Burning Biomass in CO2eq" }, { varId: "_n2o_from_livestocks_and_manure_in_co2eq", varName: "N2O from Livestocks and Manure in CO2eq" }, { varId: "_negative_species_extinction_rate", varName: "Negative Species Extinction Rate" }, { varId: "_nitrogen", varName: "Nitrogen" }, { varId: "_nitrogen_from_application_with_manure", varName: "Nitrogen from Application with Manure" }, { varId: "_nitrogen_from_commerical_application", varName: "Nitrogen from Commerical Application" }, { varId: "_nitrogen_from_denitrification", varName: "Nitrogen from Denitrification" }, { varId: "_nitrogen_from_runoff", varName: "Nitrogen from Runoff" }, { varId: "_nitrogen_from_uptake_rate", varName: "Nitrogen from Uptake Rate" }, { varId: "_number_of_undernourished_people", varName: "Number of Undernourished People" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_fat]", varName: "Nutrient Availability per Capita per Day from Animal Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_animal_food[_protein]", varName: "Nutrient Availability per Capita per Day from Animal Food[Protein]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_fat]", varName: "Nutrient Availability per Capita per Day from Plant Food[Fat]" }, { varId: "_nutrient_availability_per_capita_per_day_from_plant_food[_protein]", varName: "Nutrient Availability per Capita per Day from Plant Food[Protein]" }, { varId: "_other_land", varName: "Other Land" }, { varId: "_percentage_of_agriculture_land", varName: "Percentage of Agriculture Land" }, { varId: "_percentage_of_forest_land", varName: "Percentage of Forest Land" }, { varId: "_percentage_of_other_land", varName: "Percentage of Other Land" }, { varId: "_percentage_of_urban_and_industrial_land", varName: "Percentage of Urban and Industrial Land" }, { varId: "_phosphorus", varName: "Phosphorus" }, { varId: "_phosphorus_from_application_with_manure", varName: "Phosphorus from Application with Manure" }, { varId: "_phosphorus_from_commerical_application", varName: "Phosphorus from Commerical Application" }, { varId: "_phosphorus_from_runoff", varName: "Phosphorus from Runoff" }, { varId: "_phosphorus_from_uptake_rate", varName: "Phosphorus from Uptake Rate" }, { varId: "_population", varName: "Population" }, { varId: "_prevalence_of_undernourishment", varName: "Prevalence of Undernourishment" }, { varId: "_recovered_food_losses_and_waste_consumed[_cropmeat]", varName: "Recovered Food Losses and Waste Consumed[CropMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_dairy]", varName: "Recovered Food Losses and Waste Consumed[Dairy]" }, { varId: "_recovered_food_losses_and_waste_consumed[_eggs]", varName: "Recovered Food Losses and Waste Consumed[Eggs]" }, { varId: "_recovered_food_losses_and_waste_consumed[_grains]", varName: "Recovered Food Losses and Waste Consumed[Grains]" }, { varId: "_recovered_food_losses_and_waste_consumed[_othercrops]", varName: "Recovered Food Losses and Waste Consumed[OtherCrops]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pasmeat]", varName: "Recovered Food Losses and Waste Consumed[PasMeat]" }, { varId: "_recovered_food_losses_and_waste_consumed[_pulses]", varName: "Recovered Food Losses and Waste Consumed[Pulses]" }, { varId: "_recovered_food_losses_and_waste_consumed[_vegfruits]", varName: "Recovered Food Losses and Waste Consumed[VegFruits]" }, { varId: "_sigma_ln_pou", varName: "Sigma ln PoU" }, { varId: "_species_regeneration_rate", varName: "Species Regeneration Rate" }, { varId: "_temperature_change_from_preindustrial", varName: "Temperature Change from Preindustrial" }, { varId: "_total_agricultural_land_demand", varName: "Total Agricultural Land Demand" }, { varId: "_total_anthropogenic_ch4_emissions_in_co2eq", varName: "Total Anthropogenic CH4 Emissions in CO2eq" }, { varId: "_total_anthropogenic_co2_emissions", varName: "Total Anthropogenic CO2 Emissions" }, { varId: "_total_anthropogenic_co2_emissions_in_co2eq", varName: "Total Anthropogenic CO2 Emissions in CO2eq" }, { varId: "_total_anthropogenic_n2o_emissions_in_co2eq", varName: "Total Anthropogenic N2O Emissions in CO2eq" }, { varId: "_total_ch4_from_agriculture_in_co2eq", varName: "Total CH4 from Agriculture in CO2eq" }, { varId: "_total_ch4_from_energy_in_co2eq", varName: "Total CH4 from Energy in CO2eq" }, { varId: "_total_ch4_from_lulucf_in_co2eq", varName: "Total CH4 from LULUCF in CO2eq" }, { varId: "_total_ch4_from_waste_in_co2eq", varName: "Total CH4 from Waste in CO2eq" }, { varId: "_total_co2_from_energy", varName: "Total CO2 from Energy" }, { varId: "_total_co2_from_lulucf", varName: "Total CO2 from LULUCF" }, { varId: "_total_change_in_cropland_ecosystem_value", varName: "Total Change in Cropland Ecosystem Value" }, { varId: "_total_change_in_forest_ecosystem_value", varName: "Total Change in Forest Ecosystem Value" }, { varId: "_total_change_in_other_land_ecosystem_value", varName: "Total Change in Other Land Ecosystem Value" }, { varId: "_total_freshwater_withdrawal_for_food", varName: "Total Freshwater Withdrawal for Food" }, { varId: "_total_ghg_emissions_from_afolu", varName: "Total GHG Emissions from AFOLU" }, { varId: "_total_ghg_emissions_from_agriculture", varName: "Total GHG Emissions from Agriculture" }, { varId: "_total_ghg_emissions_from_energy", varName: "Total GHG Emissions from Energy" }, { varId: "_total_ghg_emissions_from_industry_and_waste", varName: "Total GHG Emissions from Industry and Waste" }, { varId: "_total_ghg_emissions_from_lulucf", varName: "Total GHG Emissions from LULUCF" }, { varId: "_total_grassland_needed", varName: "Total Grassland Needed" }, { varId: "_total_lost_value_of_ecosystems", varName: "Total Lost Value of Ecosystems" }, { varId: "_total_meat_eaters", varName: "Total Meat Eaters" }, { varId: "_total_n2o_from_agriculture_in_co2eq", varName: "Total N2O from Agriculture in CO2eq" }, { varId: "_total_n2o_from_energy_in_co2eq", varName: "Total N2O from Energy in CO2eq" }, { varId: "_total_n2o_from_industry_and_waste_in_co2eq", varName: "Total N2O from Industry and Waste in CO2eq" }, { varId: "_total_n2o_from_lulucf_in_co2eq", varName: "Total N2O from LULUCF in CO2eq" }, { varId: "_total_supply_of_animal_calories", varName: "Total Supply of Animal Calories" }, { varId: "_total_supply_of_vegetal_calories", varName: "Total Supply of Vegetal Calories" }, { varId: "_total_vegetarians", varName: "Total Vegetarians" }, { varId: "_yogl[_male,__0_4_]", varName: 'YoGL[male,"0-4"]' }], encodedImplVars = { subscripts: [], variables: [], varTypes: [], varInstances: {} }, modelSizeInBytes = 464672, dataSizeInBytes = 0, modelWorkerJs = '(function(){"use strict";var commonjsGlobal=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function getDefaultExportFromCjs(A){return A&&A.__esModule&&Object.prototype.hasOwnProperty.call(A,"default")?A.default:A}var worker={},isObservable,hasRequiredIsObservable;function requireIsObservable(){return hasRequiredIsObservable||(hasRequiredIsObservable=1,isObservable=A=>A?typeof Symbol.observable=="symbol"&&typeof A[Symbol.observable]=="function"?A===A[Symbol.observable]():typeof A["@@observable"]=="function"?A===A["@@observable"]():!1:!1),isObservable}var common={},serializers={},hasRequiredSerializers;function requireSerializers(){if(hasRequiredSerializers)return serializers;hasRequiredSerializers=1,Object.defineProperty(serializers,"__esModule",{value:!0}),serializers.DefaultSerializer=serializers.extendSerializer=void 0;function A(B,w){const I=B.deserialize.bind(B),E=B.serialize.bind(B);return{deserialize(o){return w.deserialize(o,I)},serialize(o){return w.serialize(o,E)}}}serializers.extendSerializer=A;const D={deserialize(B){return Object.assign(Error(B.message),{name:B.name,stack:B.stack})},serialize(B){return{__error_marker:"$$error",message:B.message,name:B.name,stack:B.stack}}},Q=B=>B&&typeof B=="object"&&"__error_marker"in B&&B.__error_marker==="$$error";return serializers.DefaultSerializer={deserialize(B){return Q(B)?D.deserialize(B):B},serialize(B){return B instanceof Error?D.serialize(B):B}},serializers}var hasRequiredCommon;function requireCommon(){if(hasRequiredCommon)return common;hasRequiredCommon=1,Object.defineProperty(common,"__esModule",{value:!0}),common.serialize=common.deserialize=common.registerSerializer=void 0;const A=requireSerializers();let D=A.DefaultSerializer;function Q(I){D=A.extendSerializer(D,I)}common.registerSerializer=Q;function B(I){return D.deserialize(I)}common.deserialize=B;function w(I){return D.serialize(I)}return common.serialize=w,common}var transferable={},symbols={},hasRequiredSymbols;function requireSymbols(){return hasRequiredSymbols||(hasRequiredSymbols=1,Object.defineProperty(symbols,"__esModule",{value:!0}),symbols.$worker=symbols.$transferable=symbols.$terminate=symbols.$events=symbols.$errors=void 0,symbols.$errors=Symbol("thread.errors"),symbols.$events=Symbol("thread.events"),symbols.$terminate=Symbol("thread.terminate"),symbols.$transferable=Symbol("thread.transferable"),symbols.$worker=Symbol("thread.worker")),symbols}var hasRequiredTransferable;function requireTransferable(){if(hasRequiredTransferable)return transferable;hasRequiredTransferable=1,Object.defineProperty(transferable,"__esModule",{value:!0}),transferable.Transfer=transferable.isTransferDescriptor=void 0;const A=requireSymbols();function D(w){return!(!w||typeof w!="object")}function Q(w){return w&&typeof w=="object"&&w[A.$transferable]}transferable.isTransferDescriptor=Q;function B(w,I){if(!I){if(!D(w))throw Error();I=[w]}return{[A.$transferable]:!0,send:w,transferables:I}}return transferable.Transfer=B,transferable}var messages={},hasRequiredMessages;function requireMessages(){return hasRequiredMessages||(hasRequiredMessages=1,(function(A){Object.defineProperty(A,"__esModule",{value:!0}),A.WorkerMessageType=A.MasterMessageType=void 0,(function(D){D.cancel="cancel",D.run="run"})(A.MasterMessageType||(A.MasterMessageType={})),(function(D){D.error="error",D.init="init",D.result="result",D.running="running",D.uncaughtError="uncaughtError"})(A.WorkerMessageType||(A.WorkerMessageType={}))})(messages)),messages}var implementation={},implementation_browser={},hasRequiredImplementation_browser;function requireImplementation_browser(){if(hasRequiredImplementation_browser)return implementation_browser;hasRequiredImplementation_browser=1,Object.defineProperty(implementation_browser,"__esModule",{value:!0});const A=function(){const w=typeof self<"u"&&typeof Window<"u"&&self instanceof Window;return!!(typeof self<"u"&&self.postMessage&&!w)},D=function(w,I){self.postMessage(w,I)},Q=function(w){const I=o=>{w(o.data)},E=()=>{self.removeEventListener("message",I)};return self.addEventListener("message",I),E};return implementation_browser.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:Q},implementation_browser}var implementation_tinyWorker={},hasRequiredImplementation_tinyWorker;function requireImplementation_tinyWorker(){if(hasRequiredImplementation_tinyWorker)return implementation_tinyWorker;hasRequiredImplementation_tinyWorker=1,Object.defineProperty(implementation_tinyWorker,"__esModule",{value:!0}),typeof self>"u"&&(commonjsGlobal.self=commonjsGlobal);const A=function(){return!!(typeof self<"u"&&self.postMessage)},D=function(E){self.postMessage(E)};let Q=!1;const B=new Set,w=function(E){return Q||(self.addEventListener("message",(K=>{B.forEach(i=>i(K.data))})),Q=!0),B.add(E),()=>B.delete(E)};return implementation_tinyWorker.default={isWorkerRuntime:A,postMessageToMaster:D,subscribeToMasterMessages:w},implementation_tinyWorker}var implementation_worker_threads={},worker_threads={},hasRequiredWorker_threads;function requireWorker_threads(){if(hasRequiredWorker_threads)return worker_threads;hasRequiredWorker_threads=1,Object.defineProperty(worker_threads,"__esModule",{value:!0});let implementation;function selectImplementation(){return typeof __non_webpack_require__=="function"?__non_webpack_require__("worker_threads"):eval("require")("worker_threads")}function getImplementation(){return implementation||(implementation=selectImplementation()),implementation}return worker_threads.default=getImplementation,worker_threads}var hasRequiredImplementation_worker_threads;function requireImplementation_worker_threads(){if(hasRequiredImplementation_worker_threads)return implementation_worker_threads;hasRequiredImplementation_worker_threads=1;var A=implementation_worker_threads&&implementation_worker_threads.__importDefault||function(o){return o&&o.__esModule?o:{default:o}};Object.defineProperty(implementation_worker_threads,"__esModule",{value:!0});const D=A(requireWorker_threads());function Q(o){if(!o)throw Error("Invariant violation: MessagePort to parent is not available.");return o}const B=function(){return!D.default().isMainThread},w=function(K,i){Q(D.default().parentPort).postMessage(K,i)},I=function(K){const i=D.default().parentPort;if(!i)throw Error("Invariant violation: MessagePort to parent is not available.");const c=O=>{K(O)},P=()=>{Q(i).off("message",c)};return Q(i).on("message",c),P};function E(){D.default()}return implementation_worker_threads.default={isWorkerRuntime:B,postMessageToMaster:w,subscribeToMasterMessages:I,testImplementation:E},implementation_worker_threads}var hasRequiredImplementation;function requireImplementation(){if(hasRequiredImplementation)return implementation;hasRequiredImplementation=1;var A=implementation&&implementation.__importDefault||function(E){return E&&E.__esModule?E:{default:E}};Object.defineProperty(implementation,"__esModule",{value:!0});const D=A(requireImplementation_browser()),Q=A(requireImplementation_tinyWorker()),B=A(requireImplementation_worker_threads()),w=typeof process<"u"&&process.arch!=="browser"&&"pid"in process;function I(){try{return B.default.testImplementation(),B.default}catch{return Q.default}}return implementation.default=w?I():D.default,implementation}var hasRequiredWorker;function requireWorker(){return hasRequiredWorker||(hasRequiredWorker=1,(function(A){var D=worker&&worker.__awaiter||function(M,G,t,L){function q(y){return y instanceof t?y:new t(function(b){b(y)})}return new(t||(t=Promise))(function(y,b){function _(p){try{T(L.next(p))}catch(X){b(X)}}function $(p){try{T(L.throw(p))}catch(X){b(X)}}function T(p){p.done?y(p.value):q(p.value).then(_,$)}T((L=L.apply(M,G||[])).next())})},Q=worker&&worker.__importDefault||function(M){return M&&M.__esModule?M:{default:M}};Object.defineProperty(A,"__esModule",{value:!0}),A.expose=A.isWorkerRuntime=A.Transfer=A.registerSerializer=void 0;const B=Q(requireIsObservable()),w=requireCommon(),I=requireTransferable(),E=requireMessages(),o=Q(requireImplementation());var K=requireCommon();Object.defineProperty(A,"registerSerializer",{enumerable:!0,get:function(){return K.registerSerializer}});var i=requireTransferable();Object.defineProperty(A,"Transfer",{enumerable:!0,get:function(){return i.Transfer}}),A.isWorkerRuntime=o.default.isWorkerRuntime;let c=!1;const P=new Map,O=M=>M&&M.type===E.MasterMessageType.cancel,N=M=>M&&M.type===E.MasterMessageType.run,n=M=>B.default(M)||f(M);function f(M){return M&&typeof M=="object"&&typeof M.subscribe=="function"}function U(M){return I.isTransferDescriptor(M)?{payload:M.send,transferables:M.transferables}:{payload:M,transferables:void 0}}function Z(){const M={type:E.WorkerMessageType.init,exposed:{type:"function"}};o.default.postMessageToMaster(M)}function F(M){const G={type:E.WorkerMessageType.init,exposed:{type:"module",methods:M}};o.default.postMessageToMaster(G)}function H(M,G){const{payload:t,transferables:L}=U(G),q={type:E.WorkerMessageType.error,uid:M,error:w.serialize(t)};o.default.postMessageToMaster(q,L)}function a(M,G,t){const{payload:L,transferables:q}=U(t),y={type:E.WorkerMessageType.result,uid:M,complete:G?!0:void 0,payload:L};o.default.postMessageToMaster(y,q)}function J(M,G){const t={type:E.WorkerMessageType.running,uid:M,resultType:G};o.default.postMessageToMaster(t)}function u(M){try{const G={type:E.WorkerMessageType.uncaughtError,error:w.serialize(M)};o.default.postMessageToMaster(G)}catch(G){console.error(`Not reporting uncaught error back to master thread as it occured while reporting an uncaught error already.\nLatest error:`,G,`\nOriginal error:`,M)}}function m(M,G,t){return D(this,void 0,void 0,function*(){let L;try{L=G(...t)}catch(y){return H(M,y)}const q=n(L)?"observable":"promise";if(J(M,q),n(L)){const y=L.subscribe(b=>a(M,!1,w.serialize(b)),b=>{H(M,w.serialize(b)),P.delete(M)},()=>{a(M,!0),P.delete(M)});P.set(M,y)}else try{const y=yield L;a(M,!0,w.serialize(y))}catch(y){H(M,w.serialize(y))}})}function l(M){if(!o.default.isWorkerRuntime())throw Error("expose() called in the master thread.");if(c)throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.");if(c=!0,typeof M=="function")o.default.subscribeToMasterMessages(G=>{N(G)&&!G.method&&m(G.uid,M,G.args.map(w.deserialize))}),Z();else if(typeof M=="object"&&M){o.default.subscribeToMasterMessages(t=>{N(t)&&t.method&&m(t.uid,M[t.method],t.args.map(w.deserialize))});const G=Object.keys(M).filter(t=>typeof M[t]=="function");F(G)}else throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${M}`);o.default.subscribeToMasterMessages(G=>{if(O(G)){const t=G.uid,L=P.get(t);L&&(L.unsubscribe(),P.delete(t))}})}A.expose=l,typeof self<"u"&&typeof self.addEventListener=="function"&&o.default.isWorkerRuntime()&&(self.addEventListener("error",M=>{setTimeout(()=>u(M.error||M),250)}),self.addEventListener("unhandledrejection",M=>{const G=M.reason;G&&typeof G.message=="string"&&setTimeout(()=>u(G),250)})),typeof process<"u"&&typeof process.on=="function"&&o.default.isWorkerRuntime()&&(process.on("uncaughtException",M=>{setTimeout(()=>u(M),250)}),process.on("unhandledRejection",M=>{M&&typeof M.message=="string"&&setTimeout(()=>u(M),250)}))})(worker)),worker}var workerExports=requireWorker();const WorkerContext=getDefaultExportFromCjs(workerExports),expose=WorkerContext.expose;WorkerContext.registerSerializer;const Transfer=WorkerContext.Transfer;function getEncodedVarIndicesLength(A){var D;let Q=1;for(const B of A){Q+=2;const w=((D=B.subscriptIndices)==null?void 0:D.length)||0;Q+=w}return Q}function encodeVarIndices(A,D){let Q=0;D[Q++]=A.length;for(const B of A){D[Q++]=B.varIndex;const w=B.subscriptIndices,I=w?.length||0;D[Q++]=I;for(let E=0;E<I;E++)D[Q++]=w[E]}}function getEncodedLookupBufferLengths(A){var D,Q;let B=1,w=0;for(const I of A){const E=I.varRef.varSpec;if(E===void 0)throw new Error("Cannot compute lookup buffer lengths until all lookup var specs are defined");B+=2;const o=((D=E.subscriptIndices)==null?void 0:D.length)||0;B+=o,B+=2,w+=((Q=I.points)==null?void 0:Q.length)||0}return{lookupIndicesLength:B,lookupsLength:w}}function encodeLookups(A,D,Q){let B=0;D[B++]=A.length;let w=0;for(const I of A){const E=I.varRef.varSpec;D[B++]=E.varIndex;const o=E.subscriptIndices,K=o?.length||0;D[B++]=K;for(let i=0;i<K;i++)D[B++]=o[i];I.points!==void 0?(D[B++]=w,D[B++]=I.points.length,Q?.set(I.points,w),w+=I.points.length):(D[B++]=-1,D[B++]=0)}}function decodeLookups(A,D){const Q=[];let B=0;const w=A[B++];for(let I=0;I<w;I++){const E=A[B++],o=A[B++],K=o>0?Array(o):void 0;for(let N=0;N<o;N++)K[N]=A[B++];const i=A[B++],c=A[B++],P={varIndex:E,subscriptIndices:K};let O;i>=0?D?O=D.slice(i,i+c):O=new Float64Array(0):O=void 0,Q.push({varRef:{varSpec:P},points:O})}return Q}function resolveVarRef(A,D,Q){if(!D.varSpec){if(A===void 0)throw new Error(`Unable to resolve ${Q} variable references by name or identifier when model listing is unavailable`);if(D.varId){const B=A?.getSpecForVarId(D.varId);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varId=${D.varId}`)}else{const B=A?.getSpecForVarName(D.varName);if(B)D.varSpec=B;else throw new Error(`Failed to resolve ${Q} variable reference for varName=\'${D.varId}\'`)}}}var headerLengthInElements=16,extrasLengthInElements=1,Int32Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Int32Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},Float64Section=class{constructor(){this.offsetInBytes=0,this.lengthInElements=0}update(A,D,Q){this.view=Q>0?new Float64Array(A,D,Q):void 0,this.offsetInBytes=D,this.lengthInElements=Q}},BufferedRunModelParams=class{constructor(A){this.listing=A,this.header=new Int32Section,this.extras=new Float64Section,this.inputs=new Float64Section,this.outputs=new Float64Section,this.outputIndices=new Int32Section,this.lookups=new Float64Section,this.lookupIndices=new Int32Section}getEncodedBuffer(){return this.encoded}getInputs(){return this.inputs.view}copyInputs(A,D){this.inputs.lengthInElements!==0&&((A===void 0||A.length<this.inputs.lengthInElements)&&(A=D(this.inputs.lengthInElements)),A.set(this.inputs.view))}getOutputIndicesLength(){return this.outputIndices.lengthInElements}getOutputIndices(){return this.outputIndices.view}copyOutputIndices(A,D){this.outputIndices.lengthInElements!==0&&((A===void 0||A.length<this.outputIndices.lengthInElements)&&(A=D(this.outputIndices.lengthInElements)),A.set(this.outputIndices.view))}getOutputsLength(){return this.outputs.lengthInElements}getOutputs(){return this.outputs.view}getOutputsObject(){}storeOutputs(A){this.outputs.view!==void 0&&(A.length>this.outputs.view.length?this.outputs.view.set(A.subarray(0,this.outputs.view.length)):this.outputs.view.set(A))}getLookups(){if(this.lookupIndices.lengthInElements!==0)return decodeLookups(this.lookupIndices.view,this.lookups.view)}getElapsedTime(){return this.extras.view[0]}storeElapsedTime(A){this.extras.view[0]=A}finalizeOutputs(A){this.outputs.view&&A.updateFromBuffer(this.outputs.view,A.seriesLength),A.runTimeInMillis=this.getElapsedTime()}updateFromParams(A,D,Q){const B=A.length,w=D.varIds.length*D.seriesLength;let I;const E=D.varSpecs;E!==void 0&&E.length>0?I=getEncodedVarIndicesLength(E):I=0;let o,K;if(Q?.lookups!==void 0&&Q.lookups.length>0){for(const m of Q.lookups)resolveVarRef(this.listing,m.varRef,"lookup");const u=getEncodedLookupBufferLengths(Q.lookups);o=u.lookupsLength,K=u.lookupIndicesLength}else o=0,K=0;let i=0;function c(u,m){const l=i,M=u==="float64"?Float64Array.BYTES_PER_ELEMENT:Int32Array.BYTES_PER_ELEMENT,G=Math.round(m*M),t=Math.ceil(G/8)*8;return i+=t,l}const P=c("int32",headerLengthInElements),O=c("float64",extrasLengthInElements),N=c("float64",B),n=c("float64",w),f=c("int32",I),U=c("float64",o),Z=c("int32",K),F=i;if(this.encoded===void 0||this.encoded.byteLength<F){const u=Math.ceil(F*1.2);this.encoded=new ArrayBuffer(u),this.header.update(this.encoded,P,headerLengthInElements)}const H=this.header.view;let a=0;H[a++]=O,H[a++]=extrasLengthInElements,H[a++]=N,H[a++]=B,H[a++]=n,H[a++]=w,H[a++]=f,H[a++]=I,H[a++]=U,H[a++]=o,H[a++]=Z,H[a++]=K,this.inputs.update(this.encoded,N,B),this.extras.update(this.encoded,O,extrasLengthInElements),this.outputs.update(this.encoded,n,w),this.outputIndices.update(this.encoded,f,I),this.lookups.update(this.encoded,U,o),this.lookupIndices.update(this.encoded,Z,K);const J=this.inputs.view;for(let u=0;u<A.length;u++){const m=A[u];typeof m=="number"?J[u]=m:J[u]=m.get()}this.outputIndices.view&&encodeVarIndices(E,this.outputIndices.view),K>0&&encodeLookups(Q.lookups,this.lookupIndices.view,this.lookups.view)}updateFromEncodedBuffer(A){const D=headerLengthInElements*Int32Array.BYTES_PER_ELEMENT;if(A.byteLength<D)throw new Error("Buffer must be long enough to contain header section");this.encoded=A,this.header.update(this.encoded,0,headerLengthInElements);const B=this.header.view;let w=0;const I=B[w++],E=B[w++],o=B[w++],K=B[w++],i=B[w++],c=B[w++],P=B[w++],O=B[w++],N=B[w++],n=B[w++],f=B[w++],U=B[w++],Z=E*Float64Array.BYTES_PER_ELEMENT,F=K*Float64Array.BYTES_PER_ELEMENT,H=c*Float64Array.BYTES_PER_ELEMENT,a=O*Int32Array.BYTES_PER_ELEMENT,J=n*Float64Array.BYTES_PER_ELEMENT,u=U*Int32Array.BYTES_PER_ELEMENT,m=D+Z+F+H+a+J+u;if(A.byteLength<m)throw new Error("Buffer must be long enough to contain sections declared in header");this.extras.update(this.encoded,I,E),this.inputs.update(this.encoded,o,K),this.outputs.update(this.encoded,i,c),this.outputIndices.update(this.encoded,P,O),this.lookups.update(this.encoded,N,n),this.lookupIndices.update(this.encoded,f,U)}},_NA_=-Number.MAX_VALUE,JsModelLookup=class{constructor(A,D){if(D&&D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);this.originalData=D,this.originalSize=A,this.dynamicData=void 0,this.dynamicSize=0,this.activeData=this.originalData,this.activeSize=this.originalSize,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}setData(A,D){if(D){if(D.length<A*2)throw new Error(`Lookup data array length must be >= 2*size (length=${D.length} size=${A}`);const Q=A*2;if((this.dynamicData===void 0||Q>this.dynamicData.length)&&(this.dynamicData=new Float64Array(Q)),this.dynamicSize=A,A>0){const B=D.subarray(0,Q);this.dynamicData.set(B)}this.activeData=this.dynamicData,this.activeSize=this.dynamicSize}else this.activeData=this.originalData,this.activeSize=this.originalSize;this.invertedData=void 0,this.lastInput=Number.MAX_VALUE,this.lastHitIndex=0}getValueForX(A,D){return this.getValue(A,!1,D)}getValueForY(A){if(this.invertedData===void 0){const D=this.activeSize*2,Q=this.activeData,B=Array(D);for(let w=0;w<D;w+=2)B[w]=Q[w+1],B[w+1]=Q[w];this.invertedData=B}return this.getValue(A,!0,"interpolate")}getValue(A,D,Q){if(this.activeSize===0)return _NA_;const B=D?this.invertedData:this.activeData,w=this.activeSize*2,I=!D;let E;I&&A>=this.lastInput?E=this.lastHitIndex:E=0;for(let o=E;o<w;o+=2){const K=B[o];if(K>=A){if(I&&(this.lastInput=A,this.lastHitIndex=o),o===0||K===A)return B[o+1];switch(Q){default:case"interpolate":{const i=B[o-2],c=B[o-1],P=B[o+1],O=K-i,N=P-c;return c+N/O*(A-i)}case"forward":return B[o+1];case"backward":return B[o-1]}}}return I&&(this.lastInput=A,this.lastHitIndex=w),B[w-1]}getValueForGameTime(A,D){if(this.activeSize<=0)return D;const Q=this.activeData[0];return A<Q?D:this.getValue(A,!1,"backward")}getValueBetweenTimes(A,D){if(this.activeSize===0)return _NA_;const Q=this.activeData,B=this.activeSize*2;switch(D){case"forward":{A=Math.floor(A);for(let w=0;w<B;w+=2)if(Q[w]>=A)return Q[w+1];return Q[B-1]}case"backward":{A=Math.floor(A);for(let w=2;w<B;w+=2)if(Q[w]>=A)return Q[w-1];return B>=4?Q[B-3]:Q[1]}default:{if(A-Math.floor(A)>0){let w=`GET DATA BETWEEN TIMES was called with an input value (${A}) that has a fractional part. `;throw w+="When mode is 0 (interpolate) and the input value is not a whole number, Vensim produces unexpected ",w+="results that may differ from those produced by SDEverywhere.",new Error(w)}for(let w=2;w<B;w+=2){const I=Q[w];if(I>=A){const E=Q[w-2],o=Q[w-1],K=Q[w+1],i=I-E,c=K-o;return o+c/i*(A-E)}}return Q[B-1]}}}},EPSILON=1e-6;function getJsModelFunctions(){let A;const D=new Map,Q=new Map;return{setContext(B){A=B},ABS(B){return Math.abs(B)},ARCCOS(B){return Math.acos(B)},ARCSIN(B){return Math.asin(B)},ARCTAN(B){return Math.atan(B)},COS(B){return Math.cos(B)},EXP(B){return Math.exp(B)},GAME(B,w){return B?B.getValueForGameTime(A.currentTime,w):w},INTEG(B,w){return B+w*A.timeStep},INTEGER(B){return Math.trunc(B)},LN(B){return Math.log(B)},MAX(B,w){return Math.max(B,w)},MIN(B,w){return Math.min(B,w)},MODULO(B,w){return B%w},POW(B,w){return Math.pow(B,w)},POWER(B,w){return Math.pow(B,w)},PULSE(B,w){return pulse(A,B,w)},PULSE_TRAIN(B,w,I,E){const o=Math.floor((E-B)/I);for(let K=0;K<=o;K++)if(A.currentTime<=E&&pulse(A,B+K*I,w))return 1;return 0},QUANTUM(B,w){return w<=0?B:w*Math.trunc(B/w)},RAMP(B,w,I){return A.currentTime>w?A.currentTime<I||w>I?B*(A.currentTime-w):B*(I-w):0},SIN(B){return Math.sin(B)},SQRT(B){return Math.sqrt(B)},STEP(B,w){return A.currentTime+A.timeStep/2>w?B:0},TAN(B){return Math.tan(B)},VECTOR_SORT_ORDER(B,w,I){if(w>B.length)throw new Error(`VECTOR SORT ORDER input vector length (${B.length}) must be >= size (${w})`);let E=Q.get(w);if(E===void 0){E=Array(w);for(let i=0;i<w;i++)E[i]={x:0,ind:0};Q.set(w,E)}let o=D.get(w);o===void 0&&(o=Array(w),D.set(w,o));for(let i=0;i<w;i++)E[i].x=B[i],E[i].ind=i;const K=I>0?1:-1;E.sort((i,c)=>{let P;return i.x<c.x?P=-1:i.x>c.x?P=1:P=0,P*K});for(let i=0;i<w;i++)o[i]=E[i].ind;return o},XIDZ(B,w,I){return Math.abs(w)<EPSILON?I:B/w},ZIDZ(B,w){return Math.abs(w)<EPSILON?0:B/w},createLookup(B,w){return new JsModelLookup(B,w)},LOOKUP(B,w){return B?B.getValueForX(w,"interpolate"):_NA_},LOOKUP_FORWARD(B,w){return B?B.getValueForX(w,"forward"):_NA_},LOOKUP_BACKWARD(B,w){return B?B.getValueForX(w,"backward"):_NA_},LOOKUP_INVERT(B,w){return B?B.getValueForY(w):_NA_},WITH_LOOKUP(B,w){return w?w.getValueForX(B,"interpolate"):_NA_},GET_DATA_BETWEEN_TIMES(B,w,I){let E;return I>=1?E="forward":I<=-1?E="backward":E="interpolate",B?B.getValueBetweenTimes(w,E):_NA_}}}function pulse(A,D,Q){const B=A.currentTime+A.timeStep/2;return Q===0&&(Q=A.timeStep),B>D&&B<D+Q?1:0}var isWeb;function perfNow(){return isWeb===void 0&&(isWeb=typeof self<"u"&&self?.performance!==void 0),isWeb?self.performance.now():process==null?void 0:process.hrtime()}function perfElapsed(A){if(isWeb)return self.performance.now()-A;{const D=process.hrtime(A);return(D[0]*1e9+D[1])/1e6}}var BaseRunnableModel=class{constructor(A){this.startTime=A.startTime,this.endTime=A.endTime,this.saveFreq=A.saveFreq,this.numSavePoints=A.numSavePoints,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.onRunModel=A.onRunModel}runModel(A){var D;let Q=A.getInputs();Q===void 0&&(A.copyInputs(this.inputs,K=>(this.inputs=new Float64Array(K),this.inputs)),Q=this.inputs);let B=A.getOutputIndices();B===void 0&&A.getOutputIndicesLength()>0&&(A.copyOutputIndices(this.outputIndices,K=>(this.outputIndices=new Int32Array(K),this.outputIndices)),B=this.outputIndices);const w=A.getOutputsLength();(this.outputs===void 0||this.outputs.length<w)&&(this.outputs=new Float64Array(w));const I=this.outputs,E=perfNow();(D=this.onRunModel)==null||D.call(this,Q,I,{outputIndices:B,lookups:A.getLookups()});const o=perfElapsed(E);A.storeOutputs(I),A.storeElapsedTime(o)}terminate(){}};function initJsModel(A){let D=A.getModelFunctions();D===void 0&&(D=getJsModelFunctions(),A.setModelFunctions(D));const Q=A.getInitialTime(),B=A.getFinalTime(),w=A.getTimeStep(),I=A.getSaveFreq(),E=Math.round((B-Q)/I)+1;return new BaseRunnableModel({startTime:Q,endTime:B,saveFreq:I,numSavePoints:E,outputVarIds:A.outputVarIds,modelListing:A.modelListing,onRunModel:(o,K,i)=>{runJsModel(A,Q,B,w,I,E,o,K,i?.outputIndices,i?.lookups)}})}function runJsModel(A,D,Q,B,w,I,E,o,K,i,c){let P=D;A.setTime(P);const O={timeStep:B,currentTime:P};if(A.getModelFunctions().setContext(O),A.initConstants(),i!==void 0)for(const F of i)A.setLookup(F.varRef.varSpec,F.points);E?.length>0&&A.setInputs(F=>E[F]),A.initLevels();const N=Math.round((Q-D)/B),n=Q;let f=0,U=0,Z=0;for(;f<=N;){if(A.evalAux(),P%w<1e-6){Z=0;const F=H=>{const a=Z*I+U;o[a]=P<=n?H:void 0,Z++};if(K!==void 0){let H=0;const a=K[H++];for(let J=0;J<a;J++){const u=K[H++],m=K[H++];let l;m>0&&(l=K.subarray(H,H+m),H+=m);const M={varIndex:u,subscriptIndices:l};A.storeOutput(M,F)}}else A.storeOutputs(F);U++}if(f===N)break;A.evalLevels(),P+=B,A.setTime(P),O.currentTime=P,f++}}var WasmBuffer=class{constructor(A,D,Q,B){this.wasmModule=A,this.numElements=D,this.byteOffset=Q,this.heapArray=B}getArrayView(){return this.heapArray}getAddress(){return this.byteOffset}dispose(){var A,D;this.heapArray&&((D=(A=this.wasmModule)._free)==null||D.call(A,this.byteOffset),this.numElements=void 0,this.heapArray=void 0,this.byteOffset=void 0)}};function createInt32WasmBuffer(A,D){const B=D*4,w=A._malloc(B),I=w/4,E=A.HEAP32.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}function createFloat64WasmBuffer(A,D){const B=D*8,w=A._malloc(B),I=w/8,E=A.HEAPF64.subarray(I,I+D);return new WasmBuffer(A,D,w,E)}var WasmModel=class{constructor(A){this.wasmModule=A;function D(Q){return A.cwrap(Q,"number",[])()}this.startTime=D("getInitialTime"),this.endTime=D("getFinalTime"),this.saveFreq=D("getSaveper"),this.numSavePoints=Math.round((this.endTime-this.startTime)/this.saveFreq)+1,this.outputVarIds=A.outputVarIds,this.modelListing=A.modelListing,this.wasmSetLookup=A.cwrap("setLookup",null,["number","number","number","number"]),this.wasmRunModel=A.cwrap("runModelWithBuffers",null,["number","number","number"])}runModel(A){var D,Q,B,w,I,E,o;const K=A.getLookups();if(K!==void 0)for(const N of K){const n=N.varRef.varSpec,f=((D=n.subscriptIndices)==null?void 0:D.length)||0;let U;f>0?((this.lookupSubIndicesBuffer===void 0||this.lookupSubIndicesBuffer.numElements<f)&&((Q=this.lookupSubIndicesBuffer)==null||Q.dispose(),this.lookupSubIndicesBuffer=createInt32WasmBuffer(this.wasmModule,f)),this.lookupSubIndicesBuffer.getArrayView().set(n.subscriptIndices),U=this.lookupSubIndicesBuffer.getAddress()):U=0;let Z,F;if(N.points){const a=N.points.length;(this.lookupDataBuffer===void 0||this.lookupDataBuffer.numElements<a)&&((B=this.lookupDataBuffer)==null||B.dispose(),this.lookupDataBuffer=createFloat64WasmBuffer(this.wasmModule,a)),this.lookupDataBuffer.getArrayView().set(N.points),Z=this.lookupDataBuffer.getAddress(),F=a/2}else Z=0,F=0;const H=n.varIndex;this.wasmSetLookup(H,U,Z,F)}A.copyInputs((w=this.inputsBuffer)==null?void 0:w.getArrayView(),N=>{var n;return(n=this.inputsBuffer)==null||n.dispose(),this.inputsBuffer=createFloat64WasmBuffer(this.wasmModule,N),this.inputsBuffer.getArrayView()});let i;A.getOutputIndicesLength()>0?(A.copyOutputIndices((I=this.outputIndicesBuffer)==null?void 0:I.getArrayView(),N=>{var n;return(n=this.outputIndicesBuffer)==null||n.dispose(),this.outputIndicesBuffer=createInt32WasmBuffer(this.wasmModule,N),this.outputIndicesBuffer.getArrayView()}),i=this.outputIndicesBuffer):i=void 0;const c=A.getOutputsLength();(this.outputsBuffer===void 0||this.outputsBuffer.numElements<c)&&((E=this.outputsBuffer)==null||E.dispose(),this.outputsBuffer=createFloat64WasmBuffer(this.wasmModule,c));const P=perfNow();this.wasmRunModel(((o=this.inputsBuffer)==null?void 0:o.getAddress())||0,this.outputsBuffer.getAddress(),i?.getAddress()||0);const O=perfElapsed(P);A.storeOutputs(this.outputsBuffer.getArrayView()),A.storeElapsedTime(O)}terminate(){var A,D,Q;(A=this.inputsBuffer)==null||A.dispose(),this.inputsBuffer=void 0,(D=this.outputsBuffer)==null||D.dispose(),this.outputsBuffer=void 0,(Q=this.outputIndicesBuffer)==null||Q.dispose(),this.outputIndicesBuffer=void 0}};function initWasmModel(A){return new WasmModel(A)}function createRunnableModel(A){switch(A.kind){case"js":return initJsModel(A);case"wasm":return initWasmModel(A);default:throw new Error("Unable to identify generated model kind")}}var initGeneratedModel,runnableModel,params=new BufferedRunModelParams,modelWorker={async initModel(){if(runnableModel)throw new Error("RunnableModel was already initialized");const A=await initGeneratedModel();return runnableModel=createRunnableModel(A),{outputVarIds:runnableModel.outputVarIds,modelListing:runnableModel.modelListing,startTime:runnableModel.startTime,endTime:runnableModel.endTime,saveFreq:runnableModel.saveFreq,outputRowLength:runnableModel.numSavePoints}},runModel(A){if(!runnableModel)throw new Error("RunnableModel must be initialized before running the model in worker");return params.updateFromEncodedBuffer(A),runnableModel.runModel(params),Transfer(A)}};function exposeModelWorker(A){initGeneratedModel=A,expose(modelWorker)}var Module=(function(){var A=typeof document<"u"&&document.currentScript?document.currentScript.src:void 0;return(function(Q){Q=Q||{};var Q=typeof Q<"u"?Q:{},B,w;Q.ready=new Promise(function(g,C){B=g,w=C}),Q.kind="wasm",Q.outputVarIds=["___data__agriculture_land_","___data__fat_supply_quantity_from_animal_products_fao_","___data__fat_supply_quantity_from_vegetal_products_fao_","___data__food_supply_quantity_from_animal_products_fao_","___data__food_supply_quantity_from_vegetal_products_fao_","___data__forest_land_","___data__other_land_","___data__pou_fao_","___data__protein_supply_quantity_from_animal_products_fao_","___data__protein_supply_quantity_from_vegetal_products_fao_","___data__commerical_n_","___data__commerical_p_","___data__ghg_ch4_in_co2eq_","___data__ghg_co2_","___data__ghg_n2o_in_co2eq_","___data__global_agriculture_freshwater_withdrawal_rate_aquastat_billion_cubic_metres_","__stress_weighted_water_use_for_food_[_cropmeat]","__stress_weighted_water_use_for_food_[_dairy]","__stress_weighted_water_use_for_food_[_eggs]","__stress_weighted_water_use_for_food_[_grains]","__stress_weighted_water_use_for_food_[_othercrops]","__stress_weighted_water_use_for_food_[_pasmeat]","__stress_weighted_water_use_for_food_[_pulses]","__stress_weighted_water_use_for_food_[_vegfruits]","__stress_weighted_water_use_per_calorie_","__stress_weighted_water_use_per_protein_","__total_stress_weighted_water_use_for_food_","_agricultral_land_erosion","_agricultural_land","_agricultural_land_conversion","_alpha_ln_pou","_annual_caloric_demand_from_conventional_food[_cropmeat]","_annual_caloric_demand_from_conventional_food[_dairy]","_annual_caloric_demand_from_conventional_food[_eggs]","_annual_caloric_demand_from_conventional_food[_grains]","_annual_caloric_demand_from_conventional_food[_othercrops]","_annual_caloric_demand_from_conventional_food[_pasmeat]","_annual_caloric_demand_from_conventional_food[_pulses]","_annual_caloric_demand_from_conventional_food[_vegfruits]","_annual_caloric_demand_inc_waste_per_capita_per_day[_cropmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_dairy]","_annual_caloric_demand_inc_waste_per_capita_per_day[_eggs]","_annual_caloric_demand_inc_waste_per_capita_per_day[_grains]","_annual_caloric_demand_inc_waste_per_capita_per_day[_othercrops]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pasmeat]","_annual_caloric_demand_inc_waste_per_capita_per_day[_pulses]","_annual_caloric_demand_inc_waste_per_capita_per_day[_vegfruits]","_annual_total_crop_demand_for_aps[_grains]","_annual_total_crop_demand_for_aps[_othercrops]","_annual_total_crop_demand_for_aps[_pulses]","_annual_total_crop_demand_for_aps[_vegfruits]","_ch4_afolu_in_co2eq","_ch4_radiative_forcing","_ch4_from_burning_biomass_in_co2eq","_ch4_from_livestocks_and_manure_in_co2eq","_ch4_from_rice_cultivation_in_co2eq","_co2_afolu_in_co2eq","_co2_radiative_forcing","_co2_from_burning_biomass","_co2_from_drained_organic_soils","_co2_from_net_forest_land_emissions_and_removals","_caloric_availability_per_capita_per_day_from_animal_food","_caloric_availability_per_capita_per_day_from_plant_food","_commercial_n_application_for_agriculture","_commercial_n_application_for_each_category[_grains]","_commercial_n_application_for_each_category[_othercrops]","_commercial_n_application_for_each_category[_pasmeat]","_commercial_n_application_for_each_category[_pulses]","_commercial_n_application_for_each_category[_vegfruits]","_commercial_p_application_for_agriculture","_commercial_p_application_for_each_category[_grains]","_commercial_p_application_for_each_category[_othercrops]","_commercial_p_application_for_each_category[_pasmeat]","_commercial_p_application_for_each_category[_pulses]","_commercial_p_application_for_each_category[_vegfruits]","_cropland_needed","_cropland_yield","_cropland_yield_indicator","_daily_caloric_demand_from_alternative_proteins[_altcropmeat]","_daily_caloric_demand_from_alternative_proteins[_altdairy]","_daily_caloric_demand_from_alternative_proteins[_alteggs]","_daily_caloric_demand_from_alternative_proteins[_altpasmeat]","_deforestation_as_percentage_of_initial_forest_land","_diet_composition_percentage[_cropmeat]","_diet_composition_percentage[_dairy]","_diet_composition_percentage[_eggs]","_diet_composition_percentage[_grains]","_diet_composition_percentage[_othercrops]","_diet_composition_percentage[_pasmeat]","_diet_composition_percentage[_pulses]","_diet_composition_percentage[_vegfruits]","_dietary_energy_supply","_fwl_fractions_by_food_categories[_cropmeat]","_fwl_fractions_by_food_categories[_dairy]","_fwl_fractions_by_food_categories[_eggs]","_fwl_fractions_by_food_categories[_grains]","_fwl_fractions_by_food_categories[_othercrops]","_fwl_fractions_by_food_categories[_pasmeat]","_fwl_fractions_by_food_categories[_pulses]","_fwl_fractions_by_food_categories[_vegfruits]","_forest_land","_freshwater_withdrawal_for_food[_cropmeat]","_freshwater_withdrawal_for_food[_dairy]","_freshwater_withdrawal_for_food[_eggs]","_freshwater_withdrawal_for_food[_grains]","_freshwater_withdrawal_for_food[_othercrops]","_freshwater_withdrawal_for_food[_pasmeat]","_freshwater_withdrawal_for_food[_pulses]","_freshwater_withdrawal_for_food[_vegfruits]","_freshwater_withdrawal_per_calorie","_freshwater_withdrawal_per_protein","_healthy_life_expectancy[_male,__0_4_]","_impact_of_biomass_production_on_biodiversity","_impact_of_climate_damage_on_biodiversity","_impact_of_fertilizer_consumption_on_biodiversity","_impact_of_land_use_change_on_biodiversity","_land_allocated_for_animal_calories","_land_allocated_for_energy_crops","_land_allocated_for_food_crops","_land_use_per_calorie_of_food","_life_expectancy[_male,__0_4_]","_mean_species_abundance","_minimum_dietary_energy_requirement","_n2o_afolu_in_co2eq","_n2o_radiative_forcing","_n2o_from_agriculture_soils_in_co2eq","_n2o_from_burning_biomass_in_co2eq","_n2o_from_livestocks_and_manure_in_co2eq","_negative_species_extinction_rate","_nitrogen","_nitrogen_from_application_with_manure","_nitrogen_from_commerical_application","_nitrogen_from_denitrification","_nitrogen_from_runoff","_nitrogen_from_uptake_rate","_number_of_undernourished_people","_nutrient_availability_per_capita_per_day_from_animal_food[_fat]","_nutrient_availability_per_capita_per_day_from_animal_food[_protein]","_nutrient_availability_per_capita_per_day_from_plant_food[_fat]","_nutrient_availability_per_capita_per_day_from_plant_food[_protein]","_other_land","_percentage_of_agriculture_land","_percentage_of_forest_land","_percentage_of_other_land","_percentage_of_urban_and_industrial_land","_phosphorus","_phosphorus_from_application_with_manure","_phosphorus_from_commerical_application","_phosphorus_from_runoff","_phosphorus_from_uptake_rate","_population","_prevalence_of_undernourishment","_recovered_food_losses_and_waste_consumed[_cropmeat]","_recovered_food_losses_and_waste_consumed[_dairy]","_recovered_food_losses_and_waste_consumed[_eggs]","_recovered_food_losses_and_waste_consumed[_grains]","_recovered_food_losses_and_waste_consumed[_othercrops]","_recovered_food_losses_and_waste_consumed[_pasmeat]","_recovered_food_losses_and_waste_consumed[_pulses]","_recovered_food_losses_and_waste_consumed[_vegfruits]","_sigma_ln_pou","_species_regeneration_rate","_temperature_change_from_preindustrial","_total_agricultural_land_demand","_total_anthropogenic_ch4_emissions_in_co2eq","_total_anthropogenic_co2_emissions","_total_anthropogenic_co2_emissions_in_co2eq","_total_anthropogenic_n2o_emissions_in_co2eq","_total_ch4_from_agriculture_in_co2eq","_total_ch4_from_energy_in_co2eq","_total_ch4_from_lulucf_in_co2eq","_total_ch4_from_waste_in_co2eq","_total_co2_from_energy","_total_co2_from_lulucf","_total_change_in_cropland_ecosystem_value","_total_change_in_forest_ecosystem_value","_total_change_in_other_land_ecosystem_value","_total_freshwater_withdrawal_for_food","_total_ghg_emissions_from_afolu","_total_ghg_emissions_from_agriculture","_total_ghg_emissions_from_energy","_total_ghg_emissions_from_industry_and_waste","_total_ghg_emissions_from_lulucf","_total_grassland_needed","_total_lost_value_of_ecosystems","_total_meat_eaters","_total_n2o_from_agriculture_in_co2eq","_total_n2o_from_energy_in_co2eq","_total_n2o_from_industry_and_waste_in_co2eq","_total_n2o_from_lulucf_in_co2eq","_total_supply_of_animal_calories","_total_supply_of_vegetal_calories","_total_vegetarians","_yogl[_male,__0_4_]"],Q.modelListing=void 0;var I={},E;for(E in Q)Q.hasOwnProperty(E)&&(I[E]=Q[E]);var o=typeof window=="object",K=typeof importScripts=="function";typeof process=="object"&&typeof process.versions=="object"&&process.versions.node;var i="";function c(g){return Q.locateFile?Q.locateFile(g,i):i+g}var P,O;(o||K)&&(K?i=self.location.href:typeof document<"u"&&document.currentScript&&(i=document.currentScript.src),A&&(i=A),i.indexOf("blob:")!==0?i=i.substr(0,i.replace(/[?#].*/,"").lastIndexOf("/")+1):i="",K&&(O=function(g){try{var C=new XMLHttpRequest;return C.open("GET",g,!1),C.responseType="arraybuffer",C.send(null),new Uint8Array(C.response)}catch(r){var s=DA(g);if(s)return s;throw r}}),P=function(g,C,s){var r=new XMLHttpRequest;r.open("GET",g,!0),r.responseType="arraybuffer",r.onload=function(){if(r.status==200||r.status==0&&r.response){C(r.response);return}var h=DA(g);if(h){C(h.buffer);return}s()},r.onerror=s,r.send(null)});var N=Q.print||console.log.bind(console),n=Q.printErr||console.warn.bind(console);for(E in I)I.hasOwnProperty(E)&&(Q[E]=I[E]);I=null,Q.arguments&&Q.arguments,Q.thisProgram&&Q.thisProgram,Q.quit&&Q.quit;var f;Q.wasmBinary&&(f=Q.wasmBinary),Q.noExitRuntime,typeof WebAssembly!="object"&&W("no native wasm support detected");var U,Z=!1;function F(g,C){g||W("Assertion failed: "+C)}function H(g){var C=Q["_"+g];return F(C,"Cannot call unknown function "+g+", make sure it is exported"),C}function a(g,C,s,r,h){var z={string:function(Y){var x=0;if(Y!=null&&Y!==0){var rA=(Y.length<<2)+1;x=gA(rA),G(Y,x,rA)}return x},array:function(Y){var x=gA(Y.length);return t(Y,x),x}};function k(Y){return C==="string"?l(Y):C==="boolean"?!!Y:Y}var e=H(g),j=[],S=0;if(r)for(var R=0;R<r.length;R++){var eA=z[s[R]];eA?(S===0&&(S=sA()),j[R]=eA(r[R])):j[R]=r[R]}var IA=e.apply(null,j);function mA(Y){return S!==0&&KA(S),k(Y)}return IA=mA(IA),IA}function J(g,C,s,r){s=s||[];var h=s.every(function(k){return k==="number"}),z=C!=="string";return z&&h&&!r?H(g):function(){return a(g,C,s,arguments)}}var u=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function m(g,C,s){for(var r=C+s,h=C;g[h]&&!(h>=r);)++h;if(h-C>16&&g.subarray&&u)return u.decode(g.subarray(C,h));for(var z="";C<h;){var k=g[C++];if(!(k&128)){z+=String.fromCharCode(k);continue}var e=g[C++]&63;if((k&224)==192){z+=String.fromCharCode((k&31)<<6|e);continue}var j=g[C++]&63;if((k&240)==224?k=(k&15)<<12|e<<6|j:k=(k&7)<<18|e<<12|j<<6|g[C++]&63,k<65536)z+=String.fromCharCode(k);else{var S=k-65536;z+=String.fromCharCode(55296|S>>10,56320|S&1023)}}return z}function l(g,C){return g?m(q,g,C):""}function M(g,C,s,r){if(!(r>0))return 0;for(var h=s,z=s+r-1,k=0;k<g.length;++k){var e=g.charCodeAt(k);if(e>=55296&&e<=57343){var j=g.charCodeAt(++k);e=65536+((e&1023)<<10)|j&1023}if(e<=127){if(s>=z)break;C[s++]=e}else if(e<=2047){if(s+1>=z)break;C[s++]=192|e>>6,C[s++]=128|e&63}else if(e<=65535){if(s+2>=z)break;C[s++]=224|e>>12,C[s++]=128|e>>6&63,C[s++]=128|e&63}else{if(s+3>=z)break;C[s++]=240|e>>18,C[s++]=128|e>>12&63,C[s++]=128|e>>6&63,C[s++]=128|e&63}}return C[s]=0,s-h}function G(g,C,s){return M(g,q,C,s)}function t(g,C){L.set(g,C)}var L,q,y;function b(g){Q.HEAP8=L=new Int8Array(g),Q.HEAP16=new Int16Array(g),Q.HEAP32=y=new Int32Array(g),Q.HEAPU8=q=new Uint8Array(g),Q.HEAPU16=new Uint16Array(g),Q.HEAPU32=new Uint32Array(g),Q.HEAPF32=new Float32Array(g),Q.HEAPF64=new Float64Array(g)}Q.INITIAL_MEMORY;var _,$=[],T=[],p=[];function X(){if(Q.preRun)for(typeof Q.preRun=="function"&&(Q.preRun=[Q.preRun]);Q.preRun.length;)GA(Q.preRun.shift());wA($)}function kA(){wA(T)}function PA(){if(Q.postRun)for(typeof Q.postRun=="function"&&(Q.postRun=[Q.postRun]);Q.postRun.length;)HA(Q.postRun.shift());wA(p)}function GA(g){$.unshift(g)}function cA(g){T.unshift(g)}function HA(g){p.unshift(g)}var v=0,V=null;function aA(g){v++,Q.monitorRunDependencies&&Q.monitorRunDependencies(v)}function NA(g){if(v--,Q.monitorRunDependencies&&Q.monitorRunDependencies(v),v==0&&V){var C=V;V=null,C()}}Q.preloadedImages={},Q.preloadedAudios={};function W(g){Q.onAbort&&Q.onAbort(g),g="Aborted("+g+")",n(g),Z=!0,g+=". Build with -s ASSERTIONS=1 for more info.";var C=new WebAssembly.RuntimeError(g);throw w(C),C}var EA="data:application/octet-stream;base64,";function BA(g){return g.startsWith(EA)}function oA(g){return g.startsWith("file://")}var d;d="data:application/octet-stream;base64,AGFzbQEAAAABjQEXYAF/AX9gA39/fwF/YAJ8fAF8YAF8AXxgA39/fwBgAABgAnx/AXxgAn9/AGABfwBgAAF8YAR/f39/AX9gAn9/AX9gBn98f39/fwF/YAV/f39/fwF/YAF8AGACf3wBfGADfHx8AXxgBX9/f39/AGACfn8Bf2ADf3x8AX9gAAF/YAN/fn8BfmAEf39/fwACHwUBYQFhAAoBYQFiAA0BYQFjAAEBYQFkAAABYQFlAAADOzoOAgIDDxACCwQEAwERAgYAEgYTAAUBAQAACgIDBQQHCAQABQYLAgUDAwUJCQkACBQIAAEVFgABBwwEBAUBcAEHBwUGAQGAAoACBgkBfwFBsIrOAgsHNQ0BZgIAAWcAIQFoADkBaQAxAWoAMAFrAC8BbAA+AW0ANgFuADUBbwEAAXAANAFxADMBcgAyCQwBAEEBCwY6Nzg9PDsK++IOOsEFAgt/AXwjAEEQayIGJAACQEHA/w0oAgAiAgRAIAJByP8NKAIAIgFBzP8NKAIAbEEDdGpB0P8NKAIAQQN0aiAAOQMAQcj/DSABQQFqNgIADAELQbj/DSgCACIBRQRAAn9BsOUFKwMAQcifBisDAKFBkJ8HKwMAoxAgIgyZRAAAAAAAAOBBYwRAIAyqDAELQYCAgIB4CyEBQbj/DUGACCgCACABQQFqbEEObEEBchAUIgE2AgALIAYgADkDACABQbz/DSgCAGohBSMAQRBrIgckACAHIAY2AgwjAEGgAWsiBCQAIARBCGoiAUHAJ0GQARANIAQgBTYCNCAEIAU2AhwgBEF+IAVrIgJBDyACQQ9JGyIINgI4IAQgBSAIaiICNgIkIAQgAjYCGCMAQdABayIDJAAgAyAGNgLMASADQaABaiICQQBBKBAQGiADIAMoAswBNgLIAQJAQQAgA0HIAWogA0HQAGogAhAeQQBIBEBBfyEBDAELIAEoAkxBAE4hCiABKAIAIQIgASwASkEATARAIAEgAkFfcTYCAAsgAkEgcSELAn8gASgCMARAIAEgA0HIAWogA0HQAGogA0GgAWoQHgwBCyABQdAANgIwIAEgA0HQAGoiAjYCECABIAM2AhwgASADNgIUIAEoAiwhCSABIAM2AiwgASADQcgBaiACIANBoAFqEB4iBSAJRQ0AGiABQQBBACABKAIkEQEAGiABQQA2AjAgASAJNgIsIAFBADYCHCABQQA2AhAgASgCFCECIAFBADYCFCAFQX8gAhsLIQIgASABKAIAIgEgC3I2AgBBfyACIAFBIHEbIQEgCkUNAAsgA0HQAWokACABIQIgCARAIAQoAhwiASABIAQoAhhGa0EAOgAACyAEQaABaiQAIAdBEGokAEG8/w1BvP8NKAIAIAJqNgIACyAGQRBqJAALQwAgACAAIAGkIAG9Qv///////////wCDQoCAgICAgID4/wBWGyABIAC9Qv///////////wCDQoCAgICAgID4/wBYGwtDACAAIAAgAaUgAb1C////////////AINCgICAgICAgPj/AFYbIAEgAL1C////////////AINCgICAgICAgPj/AFgbC68DAwJ8An8BfiAAvSIFQj+IpyEDAkACQAJ8AkAgAAJ/AkACQCAFQiCIp0H/////B3EiBEGrxpiEBE8EQCAAvUL///////////8Ag0KAgICAgICA+P8AVgRAIAAPCyAARO85+v5CLoZAZARAIABEAAAAAAAA4H+iDwsgAETSvHrdKyOGwGNFIABEUTAt1RBJh8BjRXINAQwGCyAEQcPc2P4DSQ0DIARBssXC/wNJDQELIABE/oIrZUcV9z+iIANBA3RB8AxqKwMAoCIAmUQAAAAAAADgQWMEQCAAqgwCC0GAgICAeAwBCyADRSADawsiA7ciAUQAAOD+Qi7mv6KgIgAgAUR2PHk17znqPaIiAqEMAQsgBEGAgMDxA00NAkEAIQMgAAshASAAIAEgASABIAGiIgAgACAAIAAgAETQpL5yaTdmPqJE8WvSxUG9u76gokQs3iWvalYRP6CiRJO9vhZswWa/oKJEPlVVVVVVxT+goqEiAKJEAAAAAAAAAEAgAKGjIAKhoEQAAAAAAADwP6AhASADRQ0AIAEgAxATIQELIAEPCyAARAAAAAAAAPA/oAvnAQIDfwJ8RP///////+//IQUCQAJAIABFDQAgACgCBCIDRQ0AIANBAXQhAyAAKAIAIQQgASAAKwMoZgRAIAAoAjAhAgsgAiADSQRAA0AgASAEIAJBA3RqKwMAIgVlBEAgACACNgIwIAAgATkDKCACQQAgASAFYhtFDQQgAkEDdCAEaiIAQQhrKwMAIgYgASAAQRBrKwMAIgGhIAArAwggBqEgBSABoaOioA8LIAJBAmoi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AABBIHFFBEAgASACIAAQGhoLC5sDAwJ8AX4DfwJAAkACQCAAvSIDQiCIpyIEQYCAwABPIANCAFlxRQRAIANC////////////AINQBEBEAAAAAAAA8L8gACAAoqMPCyADQgBZDQEgACAAoUQAAAAAAAAAAKMPCyAEQf//v/8HSw0CQYCAwP8DIQVBgXghBiAEQYCAwP8DRwRAIAQhBQwCCyADpw0BRAAAAAAAAAAADwsgAEQAAAAAAABQQ6K9IgNCIIinIQVBy3chBgsgBiAFQeK+JWoiBEEUdmq3IgFEAADg/kIu5j+iIANC/////w+DIARB//8/cUGewZr/A2qtQiCGhL9EAAAAAAAA8L+gIgAgAUR2PHk17znqPaIgACAARAAAAAAAAABAoKMiASAAIABEAAAAAAAA4D+ioiICIAEgAaIiASABoiIAIAAgAESfxnjQCZrDP6JEr3iOHcVxzD+gokQE+peZmZnZP6CiIAEgACAAIABERFI+3xLxwj+iRN4Dy5ZkRsc/oKJEWZMilCRJ0j+gokSTVVVVVVXlP6CioKCioCACoaCgIQALIAAL8gICAn8BfgJAIAJFDQAgACACaiIDQQFrIAE6AAAgACABOgAAIAJBA0kNACADQQJrIAE6AAAgACABOgABIANBA2sgAToAACAAIAE6AAIgAkEHSQ0AIANBBGsgAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALbQEBfyMAQYACayIFJAAgBEGAwARxIAIgA0xyRQRAIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgEbEBAaIAFFBEADQCAAIAVBgAIQDiACQYACayICQf8BSw0ACwsgACAFIAIQDgsgBUGAAmokAAscAEQAAAAAAAAAACAAIAGjQaC3BSsDACABmWQbC6gBAAJAIAFBgAhOBEAgAEQAAAAAAADgf6IhACABQf8PSQRAIAFB/wdrIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdJG0H+D2shAQwBCyABQYF4Sg0AIABEAAAAAAAAEACiIQAgAUGDcEsEQCABQf4HaiEBDAELIABEAAAAAAAAEACiIQAgAUGGaCABQYZoSxtB/A9qIQELIAAgAUH/B2qtQjSGv6ILqAQCB38CfkEIIQUCQAJAIABBR0sNAANAIAVBCCAFQQhLGyEFQaiKDikDACIIAn8gAEEDakF8cUEIIABBCEsbIgBB/wBNBEAgAEEDdkEBawwBCyAAQR0gAGciAWt2QQRzIAFBAnRrQe4AaiAAQf8fTQ0AGiAAQR4gAWt2QQJzIAFBAXRrQccAaiIBQT8gAUE/SRsLIgOtiCIJUEUEQANAIAkgCXoiCYghCAJ+IAMgCadqIgNBBHQiBkGogg5qKAIAIgQgBkGggg5qIgJHBEAgBCAFIAAQGyIHDQUgBCgCBCIBIAQoAgg2AgggBCgCCCABNgIEIAQgAjYCCCAEIAZBpIIOaiIBKAIANgIEIAEgBDYCACAEKAIEIAQ2AgggA0EBaiEDIAhCAYgMAQtBqIoOQaiKDikDAEJ+IAOtiYM3AwAgCEIBhQsiCUIAUg0AC0Goig4pAwAhCAsCQCAIUEUEQEE/IAh5p2siBkEEdCIBQaiCDmooAgAhAgJAIAhCgICAgARUDQBB4wAhAyACIAFBoIIOaiIBRg0AA0AgA0UNASACIAUgABAbIgcNBSADQQFrIQMgAigCCCICIAFHDQALIAEhAgsgAEEwahAcDQEgAkUNBCACIAZBBHRBoIIOaiIBRg0EA0AgAiAFIAAQGyIHDQQgAigCCCICIAFHDQALDAQLIABBMGoQHEUNAwtBACEHIAUgBUEBa3ENASAAQUdNDQALCyAHDwtBAAuDAQIDfwF+AkAgAEKAgICAEFQEQCAAIQUMAQsDQCABQQFrIgEgACAAQgqAIgVCCn59p0EwcjoAACAAQv////+fAVYhAiAFIQAgAg0ACwsgBaciAgRAA0AgAUEBayIBIAIgAkEKbiIDQQpsa0EwcjoAACACQQlLIQQgAyECIAQNAAsLIAELcAEDfyABKAIEIgMEfCABKAIAIgQgASgCCCICQQN0aiAAOQMAIAEgAkEBaiADcCICNgIIIAFBEGogBCACQQN0akHg/w0rAwBByJ8GKwMAQaClBysDACADQQFruKKgRI3ttaD3xrC+oGMbKwMABSAACwuFAQECfwJ/IAFBoKUHKwMAo5siAUQAAAAAAADwQWMgAUQAAAAAAAAAAGZxBEAgAasMAQtBAAsiA0EDdCEEAkAgAEUEQEEYEBQiACAEEBQ2AgAMAQsgACgCBCADRg0AIAAoAgAQJCAAIAQQFDYCAAsgACACOQMQIABBADYCCCAAIAM2AgQgAAsKACAAQTBrQQpJCyoAQdj/DS0AAEUEQBAuECtB4P8NQcifBisDADkDABAnQdj/DUEBOgAACwuWAgEDfwJAIAEgAigCECIDBH8gAwUCfyACIgMgAy0ASiIEQQFrIARyOgBKIAMoAgAiBEEIcQRAIAMgBEEgcjYCAEF/DAELIANCADcCBCADIAMoAiwiBDYCHCADIAQ2AhQgAyAEIAMoAjBqNgIQQQALDQEgAigCEAsgAigCFCIEa0sEQCACIAAgASACKAIkEQEADwsCQCACLABLQQBIBEBBACEDDAELIAEhBQNAIAUiA0UEQEEAIQMMAgsgACADQQFrIgVqLQAAQQpHDQALIAIgACADIAIoAiQRAQAiBSADSQ0BIAAgA2ohACABIANrIQEgAigCFCEECyAEIAAgARANIAIgAigCFCABajYCFCABIANqIQULIAULpAMBA38gASAAQQRqIgRqQQFrQQAgAWtxIgUgAmogACAAKAIAIgFqQQRrTQR/IAAoAgQiAyAAKAIINgIIIAAoAgggAzYCBCAEIAVHBEAgACAAQQRrKAIAQX5xayIDIAUgBGsiBCADKAIAaiIFNgIAIAVBfHEgA2pBBGsgBTYCACAAIARqIgAgASAEayIBNgIACwJAIAEgAkEYak8EQCAAIAJqQQhqIgMgASACa0EIayIBNgIAIAFBfHEgA2pBBGsgAUEBcjYCACADAn8gAygCAEEIayIBQf8ATQRAIAFBA3ZBAWsMAQsgAWchBCABQR0gBGt2QQRzIARBAnRrQe4AaiABQf8fTQ0AGiABQR4gBGt2QQJzIARBAXRrQccAaiIBQT8gAUE/SRsLIgFBBHQiBEGggg5qNgIEIAMgBEGogg5qIgQoAgA2AgggBCADNgIAIAMoAgggAzYCBEGoig5BqIoOKQMAQgEgAa2GhDcDACAAIAJBCGoiATYCACABQXxxIABqQQRrIAE2AgAMAQsgACABakEEayABNgIACyAAQQRqBSADCwvvAwEFfwJ/Qbi4BSgCACIBIABBA2pBfHEiA2ohAgJAIANBACABIAJPGw0AIAI/AEEQdEsEQCACEANFDQELQbi4BSACNgIAIAEMAQtB8P8NQTA2AgBBfwsiAkF/RwRAIAAgAmoiA0EQayIBQRA2AgwgAUEQNgIAAkACf0Ggig4oAgAiAAR/IAAoAggFQQALIAJGBEAgAiACQQRrKAIAQX5xayIEQQRrKAIAIQUgACADNgIIQXAgBCAFQX5xayIAIAAoAgBqQQRrLQAAQQFxRQ0BGiAAKAIEIgMgACgCCDYCCCAAKAIIIAM2AgQgACABIABrIgE2AgAMAgsgAkEQNgIMIAJBEDYCACACIAM2AgggAiAANgIEQaCKDiACNgIAQRALIAJqIgAgASAAayIBNgIACyABQXxxIABqQQRrIAFBAXI2AgAgAAJ/IAAoAgBBCGsiAUH/AE0EQCABQQN2QQFrDAELIAFBHSABZyIDa3ZBBHMgA0ECdGtB7gBqIAFB/x9NDQAaIAFBHiADa3ZBAnMgA0EBdGtBxwBqIgFBPyABQT9JGwsiAUEEdCIDQaCCDmo2AgQgACADQaiCDmoiAygCADYCCCADIAA2AgAgACgCCCAANgIEQaiKDkGoig4pAwBCASABrYaENwMACyACQX9HCxYAIABFBEBBAA8LQfD/DSAANgIAQX8LmhMCEH8BfiMAQdAAayIGJAAgBkHrDDYCTCAGQTdqIRMgBkE4aiEQAkADQAJAIA1BAEgNAEH/////ByANayAESARAQfD/DUE9NgIAQX8hDQwBCyAEIA1qIQ0LIAYoAkwiCCEEAkACQAJAIAgtAAAiBQRAA0ACQAJAIAVB/wFxIgVFBEAgBCEFDAELIAVBJUcNASAEIQUDQCAELQABQSVHDQEgBiAEQQJqIgk2AkwgBUEBaiEFIAQtAAIhByAJIQQgB0ElRg0ACwsgBSAIayEEIAAEQCAAIAggBBAOCyAEDQZBfyEPQQEhBSAGKAJMLAABEBghCSAGKAJMIQQCQCAJRQ0AIAQtAAJBJEcNACAELAABQTBrIQ9BASERQQMhBQsgBiAEIAVqIgQ2AkxBACEKAkAgBCwAACIOQSBrIglBH0sEQCAEIQUMAQsgBCEFQQEgCXQiCUGJ0QRxRQ0AA0AgBiAEQQFqIgU2AkwgCSAKciEKIAQsAAEiDkEgayIJQSBPDQEgBSEEQQEgCXQiCUGJ0QRxDQALCwJAIA5BKkYEQCAGAn8CQCAFLAABEBhFDQAgBigCTCIELQACQSRHDQAgBCwAAUECdCADakHAAWtBCjYCACAELAABQQN0IAJqQYADaygCACELQQEhESAEQQNqDAELIBENBkEAIRFBACELIAAEQCABIAEoAgAiBEEEajYCACAEKAIAIQsLIAYoAkxBAWoLIgQ2AkwgC0EATg0BQQAgC2shCyAKQYDAAHIhCgwBCyAGQcwAahAmIgtBAEgNBCAGKAJMIQQLQX8hBwJAIAQtAABBLkcNACAELQABQSpGBEACQCAELAACEBhFDQAgBigCTCIELQADQSRHDQAgBCwAAkECdCADakHAAWtBCjYCACAELAACQQN0IAJqQYADaygCACEHIAYgBEEEaiIENgJMDAILIBENBSAABH8gASABKAIAIgRBBGo2AgAgBCgCAAVBAAshByAGIAYoAkxBAmoiBDYCTAwBCyAGIARBAWo2AkwgBkHMAGoQJiEHIAYoAkwhBAtBACEFA0AgBSESQX8hDCAELAAAQcEAa0E5Sw0IIAYgBEEBaiIONgJMIAQsAAAhBSAOIQQgBSASQTpsakGfI2otAAAiBUEBa0EISQ0ACwJAAkAgBUETRwRAIAVFDQogD0EATgRAIAMgD0ECdGogBTYCACAGIAIgD0EDdGopAwA3A0AMAgsgAEUNCCAGQUBrIAUgARAlIAYoAkwhDgwCCyAPQQBODQkLQQAhBCAARQ0HCyAKQf//e3EiCSAKIApBgMAAcRshBUEAIQxB4AkhDyAQIQoCQAJAAkACfwJAAkACQAJAAn8CQAJAAkACQAJAAkACQCAOQQFrLAAAIgRBX3EgBCAEQQ9xQQNGGyAEIBIbIgRB2ABrDiEEFBQUFBQUFBQOFA8GDg4OFAYUFBQUAgUDFBQJFAEUFAQACwJAIARBwQBrDgcOFAsUDg4OAAsgBEHTAEYNCQwTCyAGKQNAIRRB4AkMBQtBACEEAkACQAJAAkACQAJAAkAgEkH/AXEOCAABAgMEGgUGGgsgBigCQCANNgIADBkLIAYoAkAgDTYCAAwYCyAGKAJAIA2sNwMADBcLIAYoAkAgDTsBAAwWCyAGKAJAIA06AAAMFQsgBigCQCANNgIADBQLIAYoAkAgDaw3AwAMEwsgB0EIIAdBCEsbIQcgBUEIciEFQfgAIQQLIBAhCCAEQSBxIQkgBikDQCIUUEUEQANAIAhBAWsiCCAUp0EPcUGwJ2otAAAgCXI6AAAgFEIPViEOIBRCBIghFCAODQALCyAFQQhxRSAGKQNAUHINAyAEQQR2QeAJaiEPQQIhDAwDCyAQIQQgBikDQCIUUEUEQANAIARBAWsiBCAUp0EHcUEwcjoAACAUQgdWIQggFEIDiCEUIAgNAAsLIAQhCCAFQQhxRQ0CIAcgECAIayIEQQFqIAQgB0gbIQcMAgsgBikDQCIUQgBTBEAgBkIAIBR9IhQ3A0BBASEMQeAJDAELIAVBgBBxBEBBASEMQeEJDAELQeIJQeAJIAVBAXEiDBsLIQ8gFCAQEBUhCAsgBUH//3txIAUgB0EAThshBSAGKQNAIhRCAFIgB3JFBEBBACEHIBAhCAwMCyAHIBRQIBAgCGtqIgQgBCAHSBshBwwLCwJ/IAciBEEARyEKAkACQAJAIAYoAkAiBUGPCiAFGyIIIgVBA3FFIARFcg0AA0AgBS0AAEUNAiAEQQFrIgRBAEchCiAFQQFqIgVBA3FFDQEgBA0ACwsgCkUNAQsCQCAFLQAARSAEQQRJcg0AA0AgBSgCACIKQX9zIApBgYKECGtxQYCBgoR4cQ0BIAVBBGohBSAEQQRrIgRBA0sNAAsLIARFDQADQCAFIAUtAABFDQIaIAVBAWohBSAEQQFrIgQNAAsLQQALIgQgByAIaiAEGyEKIAkhBSAEIAhrIAcgBBshBwwKCyAHBEAgBigCQAwCC0EAIQQgAEEgIAtBACAFEBEMAgsgBkEANgIMIAYgBikDQD4CCCAGIAZBCGoiBDYCQEF/IQcgBAshCUEAIQQCQANAIAkoAgAiCEUNASAGQQRqIAgQKSIIQQBIIgogCCAHIARrS3JFBEAgCUEEaiEJIAcgBCAIaiIESw0BDAILC0F/IQwgCg0LCyAAQSAgCyAEIAUQESAERQRAQQAhBAwBC0EAIQkgBigCQCEOA0AgDigCACIIRQ0BIAZBBGogCBApIgggCWoiCSAESg0BIAAgBkEEaiAIEA4gDkEEaiEOIAQgCUsNAAsLIABBICALIAQgBUGAwABzEBEgCyAEIAQgC0gbIQQMCAsgACAGKwNAIAsgByAFIARBBBEMACEEDAcLIAYgBikDQDwAN0EBIQcgEyEIIAkhBQwECyAGIARBAWoiCTYCTCAELQABIQUgCSEEDAALAAsgDSEMIAANBCARRQ0CQQEhBANAIAMgBEECdGooAgAiAARAIAIgBEEDdGogACABECVBASEMIARBAWoiBEEKRw0BDAYLC0EBIQwgBEEKTw0EA0AgAyAEQQJ0aigCAA0BIARBAWoiBEEKRw0ACwwEC0F/IQwMAwsgAEEgIAwgCiAIayIKIAcgByAKSBsiB2oiCSALIAkgC0obIgQgCSAFEBEgACAPIAwQDiAAQTAgBCAJIAVBgIAEcxARIABBMCAHIApBABARIAAgCCAKEA4gAEEgIAQgCSAFQYDAAHMQEQwBCwtBACEMCyAGQdAAaiQAIAwLkgEBA3xEAAAAAAAA8D8gACAAoiICRAAAAAAAAOA/oiIDoSIERAAAAAAAAPA/IAShIAOhIAIgAiACIAJEkBXLGaAB+j6iRHdRwRZswVa/oKJETFVVVVVVpT+goiACIAKiIgMgA6IgAiACRNQ4iL7p+qi9okTEsbS9nu4hPqCiRK1SnIBPfpK+oKKgoiAAIAGioaCgC6wBAwF8AX4BfyAAvSICQjSIp0H/D3EiA0GyCE0EfCADQf0HTQRAIABEAAAAAAAAAACiDwsCfCAAIACaIAJCAFkbIgBEAAAAAAAAMEOgRAAAAAAAADDDoCAAoSIBRAAAAAAAAOA/ZARAIAAgAaBEAAAAAAAA8L+gDAELIAAgAaAiACABRAAAAAAAAOC/ZUUNABogAEQAAAAAAADwP6ALIgAgAJogAkIAWRsFIAALC1EBA38DQCAAQQR0IgFBpIIOaiABQaCCDmoiAjYCACABQaiCDmogAjYCACAAQQFqIgBBwABHDQALQTAQHBpB3IEOQZyADjYCAEHYgA5BKjYCAAs3AQF/IAEhAyADAn8gAigCTEEASARAIAAgAyACEBoMAQsgACADIAIQGgsiAEYEQA8LIAAgAW4aCxAAQboLQbABQdAjKAIAECIL0gIBBH8gAARAIABBBGsiASgCACIEIQIgASEDIABBCGsoAgAiACAAQX5xIgBHBEAgASAAayIDKAIEIgIgAygCCDYCCCADKAIIIAI2AgQgACAEaiECCyABIARqIgAoAgAiASAAIAFqQQRrKAIARwRAIAAoAgQiBCAAKAIINgIIIAAoAgggBDYCBCABIAJqIQILIAMgAjYCACACQXxxIANqQQRrIAJBAXI2AgAgAwJ/IAMoAgBBCGsiAEH/AE0EQCAAQQN2QQFrDAELIABnIQEgAEEdIAFrdkEEcyABQQJ0a0HuAGogAEH/H00NABogAEEeIAFrdkECcyABQQF0a0HHAGoiAEE/IABBP0kbCyICQQR0IgBBoIIOajYCBCADIABBqIIOaiIAKAIANgIIIAAgAzYCACADKAIIIAM2AgRBqIoOQaiKDikDAEIBIAKthoQ3AwALC7sCAAJAIAFBFEsNAAJAAkACQAJAAkACQAJAAkACQAJAIAFBCWsOCgABAgMEBQYHCAkKCyACIAIoAgAiAUEEajYCACAAIAEoAgA2AgAPCyACIAIoAgAiAUEEajYCACAAIAE0AgA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE1AgA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAEpAwA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEyAQA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEzAQA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEwAAA3AwAPCyACIAIoAgAiAUEEajYCACAAIAExAAA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAErAwA5AwAPCyAAIAJBBREHAAsLQgEDfyAAKAIALAAAEBgEQANAIAAoAgAiAiwAACEDIAAgAkEBajYCACADIAFBCmxqQTBrIQEgAiwAARAYDQALCyABC+r9BAIOfAh/QbCkDEHQuQUoAgBB4P8NKwMAEAk5AwBBuKQMQYi6BSgCAEHg/w0rAwAQCTkDAEHApAxBjLoFKAIAQeD/DSsDABAJOQMAQcikDEGQugUoAgBB4P8NKwMAEAk5AwBB0KQMQZS6BSgCAEHg/w0rAwAQCTkDAEHYpAxBoLoFKAIAQeD/DSsDABAJOQMAQeCkDEHouQUoAgBB4P8NKwMAEAk5AwBB6KQMQey5BSgCAEHg/w0rAwAQCTkDAEHwpAxB8LkFKAIAQeD/DSsDABAJOQMAQfikDEH0uQUoAgBB4P8NKwMAEAk5AwBBgKUMQfi5BSgCAEHg/w0rAwAQCTkDAEGIpQxBgLoFKAIAQeD/DSsDABAJOQMAQZClDEHcuQUoAgBB4P8NKwMAEAk5AwBBmKUMQeS5BSgCAEHg/w0rAwAQCTkDAANAQQAhDwNAIA5BBXQgD0EDdGpB4JQJaiAPQagBbEGQuwVqIA5BA3RqKwMAOQMAIA9BAWoiD0EERw0ACyAOQQFqIg5BFUcNAAtBACEOA0BBACEPA0AgDkEFdEHAjwlqIA9BA3RqIA9BqAFsQbDABWogDkEDdGorAwA5AwAgD0EBaiIPQQRHDQALIA5BAWoiDkEVRw0AC0GgpQxBwNQFKwMAQZidDCsDAKI5AwBByKUMAnxB4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZEUEQEHApQxCmrPmzJmz5uQ/NwMAQbilDEKAgICAgICA4D83AwBBsKUMQpqz5syZs+bcPzcDAERVVVVVVVXVPwwBC0GwpQxByNQFKwMAQbC6BSsDACIAo0SamZmZmZm5v6BEmpmZmZmZuT+gOQMAQbilDEHQ1AUrAwAgAKNEAAAAAAAAwL+gRAAAAAAAAMA/oDkDAEHApQxB2NQFKwMAIACjRJqZmZmZmcm/oESamZmZmZnJP6A5AwBB4NQFKwMAIACjRFVVVVVVVdW/oERVVVVVVVXVP6ALOQMAQQAhDkGwkghBqJIIKwMAIgBB+MIGKwMAojkDAEHAkgggAEGAwwYrAwCiOQMAQYiTCEGAkwgrAwBB6NAFKwMAo0HomgYrAwCiOQMAQdClDEHQnQYrAwAiAUHouQsrAwChRAAAAAAAAAAAEAcgAaNEAAAAAAAAWUCiOQMAQfDQBSsDACEBQYiSCCsDAEGA3gYrAwCjEA8hAkHwkghB2KMGKwMAIAEgAqJEAAAAAAAA8D+gojkDAEHQkgggAEGIwwYrAwCiOQMAQeCSCCAAQZDDBisDAKI5AwADQEEAIQ8DQCAOQQV0IA9BA3RqQfCjCGogD0GoAWxBwK4GaiAOQQN0aisDADkDACAPQQFqIg9BBEcNAAsgDkEBaiIOQRVHDQALQQAhDgNAQQAhDwNAIA5BBXRB0J4IaiAPQQN0aiAPQagBbEHgswZqIA5BA3RqKwMAOQMAIA9BAWoiD0EERw0ACyAOQQFqIg5BFUcNAAtB2KUMQYi5BisDADkDAEGgzgZBwNgHKwMAQaC5BisDACIAozkDAEHIzwZB6NkHKwMAIACjOQMAQajOBkHI2AcrAwAgAKM5AwBB2M4GQfjYBysDACAAozkDAEHgzgZBgNkHKwMAIACjOQMAQdDPBkHw2QcrAwAgAKM5AwBBgNAGQaDaBysDACAAozkDAEGI0AZBqNoHKwMAIACjOQMAQejOBkGI2QcrAwAgAKM5AwBBkNAGQbDaBysDACAAozkDAEHwzgZBkNkHKwMAIACjOQMAQZjQBkG42gcrAwAgAKM5AwBB+M4GQZjZBysDACAAozkDAEGg0AZBwNoHKwMAIACjOQMAQYDPBkGg2QcrAwAgAKM5AwBBqNAGQcjaBysDACAAozkDAEGIzwZBqNkHKwMAIACjOQMAQbDQBkHQ2gcrAwAgAKM5AwBBkM8GQbDZBysDACAAozkDAEG40AZB2NoHKwMAIACjOQMAQZjPBkG42QcrAwAgAKM5AwBBwNAGQeDaBysDACAAozkDAEGgzwZBwNkHKwMAIACjOQMAQcjQBkHo2gcrAwAgAKM5AwBBqM8GQcjZBysDACAAozkDAEHQ0AZB8NoHKwMAIACjOQMAQbDPBkHQ2QcrAwAgAKM5AwBB2NAGQfjaBysDACAAozkDAEG4zwZB2NkHKwMAIACjOQMAQeDQBkGA2wcrAwAgAKM5AwBB8KUMQeDnBysDACAAozkDAEGYpwxBiOkHKwMAIACjOQMAQfilDEHo5wcrAwAgAKM5AwBBoKcMQZDpBysDACAAozkDAEGApgxB8OcHKwMAIACjOQMAQainDEGY6QcrAwAgAKM5AwBBiKYMQfjnBysDACAAozkDAEGwpwxBoOkHKwMAIACjOQMAQZCmDEGA6AcrAwAgAKM5AwBBuKcMQajpBysDACAAozkDAEGYpgxBiOgHKwMAIACjOQMAQcCnDEGw6QcrAwAgAKM5AwBBoKYMQZDoBysDACAAozkDAEHIpwxBuOkHKwMAIACjOQMAQaimDEGY6AcrAwAgAKM5AwBB0KcMQcDpBysDACAAozkDAEGwpgxBoOgHKwMAIACjOQMAQdinDEHI6QcrAwAgAKM5AwBBuKYMQajoBysDACAAozkDAEHgpwxB0OkHKwMAIACjOQMAQcCmDEGw6AcrAwAgAKM5AwBB6KcMQdjpBysDACAAozkDAEHIpgxBuOgHKwMAIACjOQMAQfCnDEHg6QcrAwAgAKM5AwBB0KYMQcDoBysDACAAozkDAEH4pwxB6OkHKwMAIACjOQMAQdimDEHI6AcrAwAgAKM5AwBBgKgMQfDpBysDACAAozkDAEGApwxCADcDAEGoqAxCADcDAEHgpgxB0OgHKwMAQaC5BisDACIAozkDAEHopgxB2OgHKwMAIACjOQMAQfCmDEHg6AcrAwAgAKM5AwBB+KYMQejoBysDACAAozkDAEGIqAxB+OkHKwMAIACjOQMAQZCoDEGA6gcrAwAgAKM5AwBBmKgMQYjqBysDACAAozkDAEGgqAxBkOoHKwMAIACjOQMAQcioDEG44gcrAwAgAKM5AwBB8KkMQeDjBysDACAAozkDAEHQqAxBwOIHKwMAIACjOQMAQfipDEHo4wcrAwAgAKM5AwBB2KgMQcjiBysDACAAozkDAEGAqgxB8OMHKwMAIACjOQMAQeCoDEHQ4gcrAwAgAKM5AwBBiKoMQfjjBysDACAAozkDAEHoqAxB2OIHKwMAIACjOQMAQZCqDEGA5AcrAwAgAKM5AwBB8KgMQeDiBysDACAAozkDAEGYqgxBiOQHKwMAIACjOQMAQfioDEHo4gcrAwAgAKM5AwBBoKoMQZDkBysDACAAozkDAEGAqQxB8OIHKwMAIACjOQMAQaiqDEGY5AcrAwAgAKM5AwBBiKkMQfjiBysDACAAozkDAEGwqgxBoOQHKwMAIACjOQMAQZCpDEGA4wcrAwAgAKM5AwBBuKoMQajkBysDACAAozkDAEGYqQxBiOMHKwMAIACjOQMAQcCqDEGw5AcrAwAgAKM5AwBBoKkMQZDjBysDACAAozkDAEHIqgxBuOQHKwMAIACjOQMAQaipDEGY4wcrAwAgAKM5AwBB0KoMQcDkBysDACAAozkDAEGwqQxBoOMHKwMAIACjOQMAQdiqDEHI5AcrAwAgAKM5AwBBuKkMQajjBysDACAAozkDAEHgqgxB0OQHKwMAIACjOQMAQcCpDEGw4wcrAwAgAKM5AwBB6KoMQdjkBysDACAAozkDAEHIqQxBuOMHKwMAIACjOQMAQeDkBysDACEBQdCpDEIANwMAQfiqDEIANwMAQfCqDCABIACjOQMAQaCrDEGQ7QcrAwAgAKM5AwBByKwMQbjuBysDACAAozkDAEGoqwxBmO0HKwMAIACjOQMAQdCsDEHA7gcrAwAgAKM5AwBBsKsMQaDtBysDACAAozkDAEHYrAxByO4HKwMAIACjOQMAQbirDEGo7QcrAwAgAKM5AwBB4KwMQdDuBysDACAAozkDAEHAqwxBsO0HKwMAIACjOQMAQeisDEHY7gcrAwAgAKM5AwBByKsMQbjtBysDACAAozkDAEHwrAxB4O4HKwMAIACjOQMAQdCrDEHA7QcrAwAgAKM5AwBB+KwMQejuBysDACAAozkDAEEAIQ5EAAAAAAAAAAAhAUHYqwxByO0HKwMAQaC5BisDACIAozkDAEHgqwxB0O0HKwMAIACjOQMAQeirDEHY7QcrAwAgAKM5AwBB8KsMQeDtBysDACAAozkDAEGArQxB8O4HKwMAIACjOQMAQYitDEH47gcrAwAgAKM5AwBBkK0MQYDvBysDACAAozkDAEGYrQxBiO8HKwMAIACjOQMAQfirDEHo7QcrAwAgAKM5AwBBoK0MQZDvBysDACAAozkDAEGArAxB8O0HKwMAIACjOQMAQaitDEGY7wcrAwAgAKM5AwBBiKwMQfjtBysDACAAozkDAEGwrQxBoO8HKwMAIACjOQMAQZCsDEGA7gcrAwAgAKM5AwBBuK0MQajvBysDACAAozkDAEGYrAxBiO4HKwMAIACjOQMAQbDvBysDACECQaCsDEIANwMAQcitDEIANwMAQcCtDCACIACjOQMAA0BBACEPA0AgASAPQQN0IhAgDkGoAWwiEUGA0gZqaisDACARQcDYB2ogEGorAwCioCEBIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtEAAAAAAAAAAAhAkEAIQ4DQEEAIQ8DQCACIA5BqAFsQcDYB2ogD0EDdGorAwCgIQIgD0EBaiIPQRVHDQALIA5BAWoiDkECRw0AC0EAIQ5B2K0MQdiiDCsDADkDAEHQrQwgAUHYyQYrAwCiIAKjOQMAQaCkDEGA1wUrAwBEAAAAAAAAJMCgRAAAAAAAACRAoEQAAAAAAAAkQEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiAUQAAAAAAJCfQGQbOQMAA0BBACERA0AgEUEDdCIPIA5BqAFsIhBB4K0MamogEEHQ5wdqIA9qKwMAIBBBoOIHaiAPaisDAKAgEEHw7AdqIA9qKwMAoCAQQcDYB2ogD2orAwCjOQMAIBFBAWoiEUEVRw0ACyAOQQFqIg5BAkcNAAtBACEPQQEhDgNAIA9BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAPQagBbEHwmQxqKwOYASAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDmAFBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAOQagBbEHwmQxqKwOQASAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDkAFBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAPQagBbEHwmQxqKwOIASAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDiAFBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAOQagBbEHwmQxqKwOAASAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDgAFBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAPQagBbEHwmQxqKwN4IACjBUQAAAAAAAAAAAtEAAAAAAAAAACgOQN4QQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbEHQywZqIAFEAAAAAABAn0BkBHwgDkGoAWxB8JkMaisDcCAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDcEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWxB0MsGaiABRAAAAAAAQJ9AZAR8IA9BqAFsQfCZDGorA2ggAKMFRAAAAAAAAAAAC0QAAAAAAAAAAKA5A2hBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAOQagBbEHwmQxqKwNgIACjBUQAAAAAAAAAAAtEAAAAAAAAAACgOQNgQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEHQywZqIAFEAAAAAABAn0BkBHwgD0GoAWxB8JkMaisDCCAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDCEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxB0MsGaiABRAAAAAAAQJ9AZAR8IA5BqAFsQfCZDGorA1ggAKMFRAAAAAAAAAAAC0QAAAAAAAAAAKA5A1hBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAPQagBbEHwmQxqKwNQIACjBUQAAAAAAAAAAAtEAAAAAAAAAACgOQNQQQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbEHQywZqIAFEAAAAAABAn0BkBHwgDkGoAWxB8JkMaisDSCAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDSEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWxB0MsGaiABRAAAAAAAQJ9AZAR8IA9BqAFsQfCZDGorA0AgAKMFRAAAAAAAAAAAC0QAAAAAAAAAAKA5A0BBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQdDLBmogAUQAAAAAAECfQGQEfCAOQagBbEHwmQxqKwM4IACjBUQAAAAAAAAAAAtEAAAAAAAAAACgOQM4QQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEHQywZqIAFEAAAAAABAn0BkBHwgD0GoAWxB8JkMaisDMCAAowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDMEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxB0MsGaiABRAAAAAAAQJ9AZAR8IA5BqAFsQfCZDGorAyggAKMFRAAAAAAAAAAAC0QAAAAAAAAAAKA5AyhBASEOIA9BAXEhEEEAIQ8gEA0AC0EAIQ5B4P8NKwMAIgNBoKUHKwMARAAAAAAAAOA/oqAhAEGguQYrAwAhAUEBIQ8DQCAOQagBbEHQywZqIABEAAAAAABAn0BkBHwgDkGoAWxB8JkMaisDICABowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDIEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWxB0MsGaiAARAAAAAAAQJ9AZAR8IA9BqAFsQfCZDGorAxggAaMFRAAAAAAAAAAAC0QAAAAAAAAAAKA5AxhBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQdDLBmogAEQAAAAAAECfQGQEfCAOQagBbEHwmQxqKwMQIAGjBUQAAAAAAAAAAAtEAAAAAAAAAACgOQMQQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEHQywZqIABEAAAAAABAn0BkBHwgD0GoAWxB8JkMaisDACABowVEAAAAAAAAAAALRAAAAAAAAAAAoDkDAEEBIQ8gDkEBcSEQQQAhDiAQDQALQQAhD0GwsAxEAAAAAAAA8D9BuKIMKwMAQbC6BSsDACICo0QAAAAAAADwP6CjOQMAQbiwDEH4mwcrAwBEAAAAAABAn8CgRAAAAAAAQJ9AoEQAAAAAAECfQCAARAAAAAAAkJ9AZBs5AwADQEQAAAAAAAAAACEBQQAhDgNAIAEgD0GoAWxBwNgHaiAOQQN0aisDAKAhASAOQQFqIg5BFUcNAAsgD0EDdEGQ2wdqIAE5AwAgD0EBaiIPQQJHDQALQQAhDkGg2wdBkNsHKwMARAAAAAAAAAAAoEGY2wcrAwCgOQMAQZieBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IABEAAAAAACQn0BkGyEBA0AgDkEDdCIPQcCcCGogD0Hw0gVqKwMAIAGiOQMAIA5BAWoiDkEIRw0AC0EAIQ5BgJ0IAnxBqN8FKwMAIgRBoKQHKwMAIgGhIgVEAAAAAAAAAABkBEBEAAAAAAAA8D9EAAAAAAAAJMAgBaMgAyAEIAGgRAAAAAAAAOC/oqCiEAhEAAAAAAAA8D+gowwBC0QAAAAAAADwP0QAAAAAAAAAACAAIAFkGwsiADkDACACQZjLBisDACIBIAFEAAAAAAAA8L9hIg8bIQFBsNYFQaDLBiAPGyEPIAAgAqMhAANAIA5BA3QiEEGQnQhqIAAgASAPIBBqKwMAoqI5AwAgDkEBaiIOQQRHDQALQQAhDkHAkAhBuJAIKwMAIgA5AwBB8JkIIABBkOYGKwMAoyIAOQMAQbCdCEHMuAUoAgAgABAJOQMAQbidCEGo0gUrAwAiAEG44wYrAwAgAKFEAAAAAACAU0CjRAAAAAAAmJ9ARAAAAAAAaKBAEAqgIgA5AwBBwJ0IIABBsJ0IKwMAoiIAOQMAA0AgDkEDdCIPQdCdCGogACAPQdCBBmorAwCiRAAAAAAAAFlAozkDACAOQQFqIg5BCEcNAAtBACEQQdjWBSsDACEBQYjSBysDACECQaDbBysDACEAQQAhDgNAIA5BA3QiD0GQnghqIA9B0J0IaisDACAAoiACoiABojkDACAOQQFqIg5BCEcNAAsDQEQAAAAAAAAAACEBQQAhDwNAQQAhDgNAIAEgEEGgBWxBkKkIaiAPQQV0aiAOQQN0aisDAKAhASAOQQFqIg5BBEcNAAsgD0EBaiIPQRVHDQALIBBBA3RB0LMIaiABOQMAIBBBAWoiEEECRw0AC0EAIQ9B4LMIQdCzCCsDAEQAAAAAAAAAAKBB2LMIKwMAoCIBOQMAQeizCCABIACjIgA5AwBB8LMIIABEAAAAAAAAAABB4McHKwMARAAAAAAAAABAYRs5AwBB+LMIRAAAAAAAAPA/RAAAAAAAACTAQdjfBSsDACIAQdCkBysDACIBoaNB4P8NKwMAIAAgAaBEAAAAAAAA4L+ioKIQCEQAAAAAAADwP6CjOQMAQYC0CEH8uQUoAgBB8JkIKwMAEAkiADkDAEGQtAhBiLQIKwMARHsUrkfheoQ/oCIBOQMAQaC0CCABQZi0CCsDAKAiATkDAEGotAggACABoiIAOQMAA0BBACEQA0BBACEOA0AgDkEDdCIRIBBBBXQiEiAPQaAFbCITQbC0CGpqaiAAIBNBkKkIaiASaiARaisDAKI5AwAgDkEBaiIOQQRHDQALIBBBAWoiEEEVRw0ACyAPQQFqIg9BAkcNAAtB+L4IAnxB4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZEUEQEHwvghCmrPmzJmz5vQ/NwMARDMzMzMzM/M/DAELQfC+CEH4ogcrAwBBsLoFKwMAIgCjRJqZmZmZmem/oESamZmZmZnpP6A5AwBB8KIHKwMAIACjRDMzMzMzM/O/oEQzMzMzMzPzP6ALOQMAQQAhDkEAIRBBgL8IAnxB4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZEUEQEGQvwhCgICAgICAgPg/NwMAQZi/CEKz5syZs+bM+T83AwBBiL8IQs2Zs+bMmbP2PzcDAESamZmZmZnpPwwBC0GYvwhB+JcHKwMAQbC6BSsDACIAo0QzMzMzMzPzv6BEMzMzMzMz8z+gOQMAQZC/CEHwlwcrAwAgAKNEAAAAAAAA8L+gRAAAAAAAAPA/oDkDAEGIvwhB6JcHKwMAIACjRM3MzMzMzOy/oETNzMzMzMzsP6A5AwBB4JcHKwMAIACjRJqZmZmZmem/oESamZmZmZnpP6ALOQMAA0AgDkEGdCIPQbD6CGogD0Hw7whqQcAAEA0gDkEBaiIOQRVHDQALQfiECUHwhAkrAwBE+n5qvHSTaD+gIgA5AwBBgKMHKwMAQbC6BSsDACIBoyECQYCYBysDACABoyEBA0AgEEEDdEHwvghqKwMAIQNBACERA0BBACEOA0AgDkEDdCIPIBBBoAVsQYCFCWogEUEFdGpqIAAgAyARQQZ0QbD6CGogEEEFdGogD2orAwAgD0GAvwhqKwMAoiABoqIgAqKgOQMAIA5BAWoiDkEERw0ACyARQQFqIhFBFUcNAAsgEEEBaiIQQQJHDQALQQAhDgNAIA5BoAVsIg9BwKQJaiAPQYCaCWpBoAUQDSAOQQFqIg5BAkcNAAtBACEOA0AgDkGgBWwiD0GArwlqIA9BwKQJakGgBRANIA5BAWoiDkECRw0AC0EAIQ8DQEEAIRADQEEAIQ4DQCAOQQN0IhEgEEEFdCISIA9BoAVsIhNBwLkJampqIBNBgK8JaiASaiARaisDACATQYCFCWogEmogEWorAwCiOQMAIA5BAWoiDkEERw0ACyAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhDgNAIA9BoAVsQZDDCGogDkEFdGogD0GoAWxB8OwHaiAOQQN0aisDADkDGCAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhDgNAIA9BoAVsQZDDCGogDkEFdGogD0GoAWxBoOIHaiAOQQN0aisDADkDECAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhDgNAIA9BoAVsQZDDCGogDkEFdGogD0GoAWxB0OcHaiAOQQN0aisDADkDCCAOQQFqIg5BFUcNAAtBASEOIA9BAWoiD0ECRw0AC0EAIQ8DQCAPQagBbCIPQcDvB2ogD0HA2AdqKwOYASAPQdDnB2orA5gBoSAPQaDiB2orA5gBoSAPQfDsB2orA5gBoUQAAAAAAAAAABAHOQOYAUEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWwiDkHA7wdqIA5BwNgHaisDkAEgDkHQ5wdqKwOQAaEgDkGg4gdqKwOQAaEgDkHw7AdqKwOQAaFEAAAAAAAAAAAQBzkDkAFBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsIg9BwO8HaiAPQcDYB2orA4gBIA9B0OcHaisDiAGhIA9BoOIHaisDiAGhIA9B8OwHaisDiAGhRAAAAAAAAAAAEAc5A4gBQQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbCIOQcDvB2ogDkHA2AdqKwOAASAOQdDnB2orA4ABoSAOQaDiB2orA4ABoSAOQfDsB2orA4ABoUQAAAAAAAAAABAHOQOAAUEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWwiD0HA7wdqIA9BwNgHaisDeCAPQdDnB2orA3ihIA9BoOIHaisDeKEgD0Hw7AdqKwN4oUQAAAAAAAAAABAHOQN4QQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbCIOQcDvB2ogDkHA2AdqKwNwIA5B0OcHaisDcKEgDkGg4gdqKwNwoSAOQfDsB2orA3ChRAAAAAAAAAAAEAc5A3BBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsIg9BwO8HaiAPQcDYB2orA2ggD0HQ5wdqKwNooSAPQaDiB2orA2ihIA9B8OwHaisDaKFEAAAAAAAAAAAQBzkDaEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWwiDkHA7wdqIA5BwNgHaisDYCAOQdDnB2orA2ChIA5BoOIHaisDYKEgDkHw7AdqKwNgoUQAAAAAAAAAABAHOQNgQQEhDiAPQQFxIRBBACEPIBANAAtByO8HQcjYBysDADkDAEHw8AdB8NkHKwMAOQMAQQAhDkEBIQ9BASEQQQAhEQNAIBFBqAFsIhFBwO8HaiARQcDYB2orA1ggEUHQ5wdqKwNYoSARQaDiB2orA1ihIBFB8OwHaisDWKFEAAAAAAAAAAAQBzkDWCAQQQFxIRJBACEQQQEhESASDQALA0AgDkGoAWwiDkHA7wdqIA5BwNgHaisDUCAOQdDnB2orA1ChIA5BoOIHaisDUKEgDkHw7AdqKwNQoUQAAAAAAAAAABAHOQNQQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbCIPQcDvB2ogD0HA2AdqKwNIIA9B0OcHaisDSKEgD0Gg4gdqKwNIoSAPQfDsB2orA0ihRAAAAAAAAAAAEAc5A0hBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsIg5BwO8HaiAOQcDYB2orA0AgDkHQ5wdqKwNAoSAOQaDiB2orA0ChIA5B8OwHaisDQKFEAAAAAAAAAAAQBzkDQEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWwiD0HA7wdqIA9BwNgHaisDOCAPQdDnB2orAzihIA9BoOIHaisDOKEgD0Hw7AdqKwM4oUQAAAAAAAAAABAHOQM4QQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbCIOQcDvB2ogDkHA2AdqKwMwIA5B0OcHaisDMKEgDkGg4gdqKwMwoSAOQfDsB2orAzChRAAAAAAAAAAAEAc5AzBBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsIg9BwO8HaiAPQcDYB2orAyggD0HQ5wdqKwMooSAPQaDiB2orAyihIA9B8OwHaisDKKFEAAAAAAAAAAAQBzkDKEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWwiDkHA7wdqIA5BwNgHaisDICAOQdDnB2orAyChIA5BoOIHaisDIKEgDkHw7AdqKwMgoUQAAAAAAAAAABAHOQMgQQEhDiAPQQFxIRBBACEPIBANAAtBACEOQQEhDwNAIA5BqAFsIg5BwO8HaiAOQcDYB2orAxggDkHQ5wdqKwMYoSAOQaDiB2orAxihRAAAAAAAAAAAEAc5AxggD0EBcSEQQQAhD0EBIQ4gEA0AC0HQ7wdB0NgHKwMAQeDnBysDAKFEAAAAAAAAAAAQBzkDAEH48AdB+NkHKwMAQYjpBysDAKFEAAAAAAAAAAAQBzkDAEEAIQ5BASEPA0AgDkGoAWwiDkHA7wdqIA5BwNgHaisDoAEgDkHQ5wdqKwOgAaEgDkGg4gdqKwOgAaEgDkHw7AdqKwOgAaFEAAAAAAAAAAAQBzkDoAEgD0EBcSEQQQAhD0EBIQ4gEA0AC0HA7wdBwNgHKwMARAAAAAAAAAAAEAc5AwBB6PAHQejZBysDAEQAAAAAAAAAABAHOQMAA0BBACEOA0AgD0GgBWxBkMMIaiAOQQV0aiAPQagBbEHA7wdqIA5BA3RqKwMAOQMAIA5BAWoiDkEVRw0ACyAPQQFqIg9BAkcNAAtBACEQA0BBACEPA0BBACERA0AgEUEDdCIOIA9BBXQiEiAQQaAFbCITQcC5CWpqaisDACEAIBNBgMQJaiASaiAOaiATQZDDCGogEmogDmorAwAgE0GQqQhqIBJqIA5qKwMAoUQAAAAAAAAAABAHIABEAAAAAAAAAACioCATQbC0CGogEmogDmorAwBEAAAAAAAAAACioDkDACARQQFqIhFBBEcNAAsgD0EBaiIPQRVHDQALIBBBAWoiEEECRw0AC0EAIRADQEQAAAAAAAAAACEAQQAhDwNAQQAhDgNAIAAgEEGgBWxBgMQJaiAPQQV0aiAOQQN0aisDAKAhACAOQQFqIg5BBEcNAAsgD0EBaiIPQRVHDQALIBBBA3RBwM4JaiAAOQMAIBBBAWoiEEECRw0AC0EAIQ5B0M4JQcDOCSsDAEQAAAAAAAAAAKBByM4JKwMAoCIAOQMAQdjOCSAAQaDbBysDAKMiADkDAEHgzgkgAEQAAAAAAAAAAEGw0QYrAwAiA0QAAAAAAADwP2EbOQMAQejOCUQAAAAAAADwP0QAAAAAAAAkwEHI3wUrAwAiAEHApAcrAwAiAaGjQeD/DSsDACIEIAAgAaBEAAAAAAAA4L+ioKIQCEQAAAAAAADwP6CjIgU5AwBBACEPA0AgD0HQAmxB8M4JaiAPQagBbEHA8gVqQagBEA0gD0EBaiIPQQhHDQALA0AgDkHQAmxBmNAJaiAOQagBbEGA6AVqQagBEA0gDkEBaiIOQQhHDQALQQAhDgNAIA5B0AJsQfDjCWogDkGoAWxBoL0HakGoARANIA5BAWoiDkEIRw0AC0EAIQ4DQCAOQdACbEGY5QlqIA5BqAFsQeCyB2pBqAEQDSAOQQFqIg5BCEcNAAtBACEOQfD4CUHgxwdB6McHQdiCBisDACICRAAAAAAAAAAAYRsrAwAiADkDAEEAIQ8DQCAPQdACbEGA+QlqIA9BqAFsQfCLB2pBqAEQDSAPQQFqIg9BCEcNAAsDQCAOQdACbEGo+glqIA5BqAFsQbCBB2pBqAEQDSAOQQFqIg5BCEcNAAsgAEQAAAAAAADwP2EiDiAARAAAAAAAAABAYXIgAEQAAAAAAAAAAGJxIRRB8OMJQfDOCSAOGyEVQQAhEEH4swgrAwAhAQNAQQAhDwNAQQAhDgNAIA5BA3QiESAPQagBbCISIBBB0AJsIhNBgPkJampqKwMAIgAhBiATQYCOCmogEmogEWogACABIBQEfCATIBVqIBJqIBFqKwMABSAGCyAAoaKgOQMAIA5BAWoiDkEVRw0ACyAPQQFqIg9BAkcNAAsgEEEBaiIQQQhHDQALQQAhEEHAnQgrAwAhAQNAQQAhDwNAQQAhDgNAIA5BA3QiESAPQagBbCISIBBB0AJsIhNBgKMKampqIAEgE0GAjgpqIBJqIBFqKwMAojkDACAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALIBBBAWoiEEEIRw0AC0EAIQ4DQCAOQdACbEGAuApqIA5BqAFsQZCQBmpBqAEQDSAOQQFqIg5BCEcNAAtBACEOA0AgDkHQAmxBqLkKaiAOQagBbEHQhQZqQagBEA0gDkEBaiIOQQhHDQALQQAhDkGAzQogA0G40QYrAwAgAkQAAAAAAAAAAGEbIgA5AwBBACEPA0AgD0HQAmxBkM0KaiAPQagBbEHg8wZqQagBEA0gD0EBaiIPQQhHDQALA0AgDkHQAmxBuM4KaiAOQagBbEGg6QZqQagBEA0gDkEBaiIOQQhHDQALIABEAAAAAAAA8D9hIg4gAEQAAAAAAAAAQGFyIABEAAAAAAAAAABicSEUQYC4CkHwzgkgDhshFUEAIRADQEEAIQ8DQEEAIQ4DQCAOQQN0IhEgD0GoAWwiEiAQQdACbCITQZDNCmpqaisDACIAIQMgE0GQ4gpqIBJqIBFqIAAgBSAUBHwgEyAVaiASaiARaisDAAUgAwsgAKGioDkDACAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALIBBBAWoiEEEIRw0AC0EAIRADQEEAIQ8DQEEAIQ4DQCAOQQN0IhEgD0GoAWwiEiAQQdACbCITQZD3CmpqaiABIBNBkOIKaiASaiARaisDAKI5AwAgDkEBaiIOQRVHDQALIA9BAWoiD0ECRw0ACyAQQQFqIhBBCEcNAAtBACEQQdjWBSsDAEGI0gcrAwCiIQMDQEEAIQ8DQEEAIREDQEQAAAAAAAAAACEAQQAhDkQAAAAAAAAAACEBA0AgASARQQV0IhIgD0GgBWwiE0GAxAlqaiAOQQN0aisDAKAhASAOQQFqIg5BBEcNAAtBACEOA0AgACATQZCpCGogEmogDkEDdGorAwCgIQAgDkEBaiIOQQRHDQALIBFBA3QiDiAPQagBbCISIBBB0AJsIhNBkIwLampqIAMgASATQZD3CmogEmogDmorAwCiIAAgE0GAowpqIBJqIA5qKwMAoqCiOQMAIBFBAWoiEUEVRw0ACyAPQQFqIg9BAkcNAAsgEEEBaiIQQQhHDQALQQAhEANARAAAAAAAAAAAIQBBACEPA0BBACEOA0AgACAQQdACbEGQjAtqIA9BqAFsaiAOQQN0aisDAKAhACAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALIBBBA3RBkKELaiAAOQMAIBBBAWoiEEEIRw0AC0EAIQ4gAkQAAAAAAADwP2EgBEG4pAcrAwBjciEQA0AgDkEDdCIPQZChC2orAwAhACAPQbClC2ogEAR8IAAFIAAgD0HwpAtqKwMAoAs5AwAgDkEBaiIOQQhHDQALQQAhDkHozgkrAwBB4M4JKwMAokH4swgrAwBB8LMIKwMAoqAhAANAIA5BA3QiD0HwpQtqIA9BsKULaisDACIBIAAgD0GQnghqKwMAIAGhoqA5AwAgDkEBaiIOQQhHDQALQQAhD0GwpgtB8KULKwMAIgRBkJ0IKwMAokGwugUrAwAiAaMiADkDAEHIpgtBiKYLKwMAQaidCCsDAKIgAaM5AwBBwKYLQYCmCysDAEGgnQgrAwCiIAGjOQMAQbimC0H4pQsrAwBBmJ0IKwMAoiABozkDAEHQpgsgAEHAnAgrAwCjOQMAQQEhDgNAIA5BA3QiEEHQpgtqIBBBsKYLaisDACAOQQJ0QdAJaigCAEEDdEHAnAhqKwMAozkDACAOQQFqIg5BBEcNAAsDQCAPQQN0QdCmC2orAwAhAkEAIRADQEQAAAAAAAAAACEAQQAhDgNAIAAgD0EYbCIRQdD+BWoiEiAOQQN0aisDAKAhACAOQQFqIg5BA0cNAAsgEEEDdCIOIBFB8KYLamogDkGw1QVqKwMAIAIgDiASaisDAKIgAKOiOQMAIBBBAWoiEEEDRw0ACyAPQQFqIg9BBEcNAAtBACEPA0BBACEOA0AgDkEGdCIQIA9BwAFsIhFB0KcLamogD0EYbEHwpgtqIA5BA3RqKwMAIBFBwKwHaiAQaisDMKI5AzAgDkEBaiIOQQNHDQALIA9BAWoiD0EERw0AC0QAAAAAAAAAACEAQQAhDwNAQQAhDgNAIAAgD0HAAWxB0KcLaiAOQQZ0aisDMKAhACAOQQFqIg5BA0cNAAsgD0EBaiIPQQRHDQALQaDNBSAAOQMAQQAhD0HQrQtEAAAAAAAAWUBB4OIGKwMAoSABoyIFOQMARAAAAAAAAPA/QbDmBSsDACIAIAGjoSECA0BBACEOA0AgD0EobEHgrQtqIA5BA3RqAnwgAEQAAAAAAADwv2EEQCAOQQN0IhBBwOUFaisDACAPQShsQdDjBmogEGorAwCiIAGjDAELIAIgD0EobEHQ4wZqIA5BA3RqKwMAogs5AwAgDkEBaiIOQQVHDQALIA9BAWoiD0EIRw0AC0EAIQ8DQCAPQQN0QfDlBWorAwAhAEEAIQ4DQCAOQQN0IhAgD0EobCIRQaCwC2pqIBFB4K0LaiAQaisDACAAojkDACAOQQFqIg5BBUcNAAsgD0EBaiIPQQhHDQALQQAhDwNARAAAAAAAAAAAIQBBACEOA0AgACAOQQN0IhAgD0EobEGgsAtqaisDACAQQaDZBmorAwCioCEAIA5BAWoiDkEFRw0ACyAPQQN0QeCyC2ogADkDACAPQQFqIg9BCEcNAAtBACEOQaCzCwJ8QbjfBSsDACIDQbCkBysDACIAoSICRAAAAAAAAAAAZARARAAAAAAAAPA/RAAAAAAAACTAIAKjQeD/DSsDACICIAMgAKBEAAAAAAAA4L+ioKIQCEQAAAAAAADwP6CjDAELRAAAAAAAAPA/RAAAAAAAAAAAQeD/DSsDACICQaClBysDAEQAAAAAAADgP6KgIABkGwsiAzkDAEEAIQ8DQCAPQQN0IhBBsLMLaiAQQdDmBmorAwAiACAFIAMgEEHgsgtqKwMAIAChoqKgOQMAIA9BAWoiD0EIRw0ACwNAIA5BA3QiD0HwswtqIA9BsLMLaisDAEQAAAAAAADwPyAPQcDnBmorAwChozkDACAOQQFqIg5BCEcNAAtBACEPQbC0C0QAAAAAAABZQEHo4gYrAwChIAGjIgE5AwADQEQAAAAAAAAAACEAQQAhDgNAIAAgDkEDdCIQIA9BKGxBoLALamorAwAgEEHQ2QZqKwMAoqAhACAOQQFqIg5BBUcNAAsgD0EDdEHAtAtqIAA5AwAgD0EBaiIPQQhHDQALQQAhDgNAIA5BA3QiD0GAtQtqIA9BwOcGaisDACIAIAEgAyAPQcC0C2orAwAgAKGioqA5AwAgDkEBaiIOQQhHDQALQQAhD0HAtQsgBEQAAAAAAADwP0GAtQsrAwChozkDAEEBIQ4DQCAOQQN0IhBBwLULaiAQQfClC2orAwBEAAAAAAAA8D8gEEGAtQtqKwMAoaM5AwAgDkEBaiIOQQhHDQALA0AgD0EDdCIOQYC2C2ogDkHAtQtqKwMAIA5BwJwIaisDAKNEAAAAAAAA8D8gDkHwswtqKwMAoaM5AwAgD0EBaiIPQQhHDQALQfC2C0GwtgsrAwBBoNsGKwMAojkDAEGAtwtB2LkFKAIAIAIQCSIAOQMAQcC3C0HA5wUrAwBBiLcLKwMARAAAAAAAAPA/oKIiATkDAEGAuAsgAEGItgsrAwAgAaKiIgE5AwBBoJEIQZDKBisDACIAQejIBisDACAAoUHAkAgrAwAiACAAQcDmBisDAKCjoqAiAjkDAEHAuAtBsLYLKwMAIgMgAaBB8LYLKwMAoEGgzQUrAwCgIgE5AwBBsJEIQaiRCCsDACACRAAAAAAAAFnAo0QAAAAAAADwP6CiOQMAQfCwDCADIAGjOQMAQbiRCEHwyQYrAwAiAUHYyAYrAwAgAaEgACAAQaDmBisDAKCjoqA5AwBB2JkIQdCZCCsDAEHw0QYrAwCjIgA5AwBBwJEIQaiRCCsDAEGgkQgrAwCiRAAAAAAAAFlAoyIBOQMAQciRCEHoyQYrAwAiAkHQyAYrAwAgAqFBwJAIKwMAIgIgAkGY5gYrAwCgo6KgIgI5AwBB0JEIIAEgAqJBmKQHKwMAIgGjQbiRCCsDAEGwkQgrAwCiIAGjoCIBOQMAQeCZCEQAAAAAAAAAQCAAIAGjQbDMBSsDAJqiEAhEAAAAAAAA8D+go0QAAAAAAADwv6AiADkDAEHomQggADkDAEGAkghB2M0FKwMAQeCCBisDAKJBsNIHKwMAoiIAOQMAQciaCEGIkggrAwAgAKMiATkDAEGwmghBsJ4HKwMARAAAAAAAAAAAoEQAAAAAAAAAAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiA0QAAAAAAJCfQGQiDhsiBDkDAEG4mghBiJ4HKwMARAAAAAAAAAAAoEQAAAAAAAAAACAOGyICOQMAQcCaCEGgngcrAwBEAAAAAAAA+L+gRAAAAAAAAPg/oEQAAAAAAAD4PyAOGyIAOQMAQdiaCAJ8IAAgAWYEQCACIAFBsNMFKwMAIgGhoiAAIAGho0QAAAAAAADwP6AMAQsgAkQAAAAAAADwP6AiAiACIAShIAEgAKGiQdDTBSsDACAAoaOhCyIAOQMAQdCaCCAAOQMAQYCaCEG4ngcrAwBEAAAAAAAAAACgRAAAAAAAAAAAIANEAAAAAACQn0BkIg4bIgM5AwBB2NsHQcDLBisDAEGAyAcrAwCiQbjSBysDAKNB+NYFKwMAoiIAOQMAQeDbB0G4zQUrAwAiAUHgwgYrAwAiAkHwwgYrAwCiRAAAAAAAAPA/IAKhQeDUBisDAKKgoiICOQMAQejbByAAIAKiIAGjIgA5AwBB+NsHQfDbBysDACAAoyIAOQMAQYiaCEGQngcrAwBEAAAAAAAAAACgRAAAAAAAAAAAIA4bIgI5AwBBkJoIQaieBysDAEQAAAAAAAD4v6BEAAAAAAAA+D+gRAAAAAAAAPg/IA4bIgE5AwBBmJoIAnwgACABZQRAIAIgAEHIywcrAwAiAqGiIAEgAqGjRAAAAAAAAPA/oAwBCyACRAAAAAAAAPA/oCICIAIgA6EgACABoaJBiMwHKwMAIAGho6ELIgE5AwBBoJoIIAFB1LgFKAIAIAAQCaIiATkDAEGQwgtB0MELKwMAOQMAQfCbCEGwmwgrAwAiADkDAEGwnAggADkDAEGwsQxBwOgGKwMAQcDPBSsDAKI5AwBBqJoIIAFEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwP0Hg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bOQMAQfiZCEHovwYrAwBB8JkIKwMAQYjPBysDAJqiEAihOQMAQdDUB0HwngcrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwPyAOGzkDAEGAuQtBwLgLKwMAIACjOQMAQQAhDkQAAAAAAAAAACEAQeCbCEGgmwgrAwAiATkDAEGgnAggATkDAANAQQAhDwNAIA9BBnQiECAOQcABbCIRQdCnC2pqIA5BGGxB8KYLaiAPQQN0aisDACARQcCsB2ogEGorAyCiOQMgIA9BAWoiD0EDRw0ACyAOQQFqIg5BBEcNAAtBACEOA0BBACEPA0AgACAOQcABbEHQpwtqIA9BBnRqKwMgoCEAIA9BAWoiD0EDRw0ACyAOQQFqIg5BBEcNAAtBkM0FIAA5AwBB+JsIQbibCCsDACICOQMAQbicCCACOQMAQeC2C0GgtgsrAwAiBUGQ2wYrAwCiIgY5AwBBACEOQbC3C0Gw5wUrAwBBkLkLKwMARAAAAAAAAPA/oKIiBDkDAEHwtwtBiLYLKwMAIgMgBKJBgLcLKwMAIgSiIgc5AwBBsLgLIAAgBiAFIAegoKAiADkDAEHwuAsgACABozkDAANAQQAhDwNAIA9BBnQiECAOQcABbCIRQdCnC2pqIA5BGGxB8KYLaiAPQQN0aisDACARQcCsB2ogEGorAziiOQM4IA9BAWoiD0EDRw0ACyAOQQFqIg5BBEcNAAtEAAAAAAAAAAAhAEEAIQ4DQEEAIQ8DQCAAIA5BwAFsQdCnC2ogD0EGdGorAzigIQAgD0EBaiIPQQNHDQALIA5BAWoiDkEERw0AC0GozQUgADkDAEHomwhBqJsIKwMAIgE5AwBBqJwIIAE5AwBB+LYLQbi2CysDACIFQajbBisDAKIiBjkDAEEAIQ5ByLcLQcjnBSsDAEGYuQsrAwBEAAAAAAAA8D+goiIHOQMAQYi4CyAEIAMgB6KiIgc5AwBByLgLIAAgBiAFIAegoKAiADkDAEGIuQsgACACozkDAANAQQAhDwNAIA9BBnQiECAOQcABbCIRQdCnC2pqIA5BGGxB8KYLaiAPQQN0aisDACARQcCsB2ogEGorAyiiOQMoIA9BAWoiD0EDRw0ACyAOQQFqIg5BBEcNAAtEAAAAAAAAAAAhAEEAIQ4DQEEAIQ8DQCAAIA5BwAFsQdCnC2ogD0EGdGorAyigIQAgD0EBaiIPQQNHDQALIA5BAWoiDkEERw0AC0GYzQUgADkDAEHotgtBqLYLKwMAIgJBmNsGKwMAoiIFOQMAQbi3C0G45wUrAwBBoLkLKwMARAAAAAAAAPA/oKIiBjkDAEH4twsgBCADIAaioiIDOQMAQYiZCEGA3AUrAwBEDGc1X1CfV76gRAxnNV9Qn1c+oEQMZzVfUJ9XPkHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bOQMAQZCZCEGQ3AUrAwBEAAAAAAAAScCgRAAAAAAAAElAoEQAAAAAAABJQCAOGyIEOQMAQZiZCEGA4AYrAwAgBKA5AwBBuLgLIAAgBSACIAOgoKAiADkDAEH4uAsgACABozkDAEQAAAAAAAAAACEAQQAhDkGgmQhBgOAGKwMAIgE5AwBBqJkIQYjcBSsDAEQAAAAAAAAkwKBEAAAAAAAAJECgRAAAAAAAACRAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCICRAAAAAAAkJ9AZBsiAzkDAEGg2AdEAAAAAAAA8D9EAAAAAAAAAAAgAkQAAAAAAGifQGQbIgI5AwBBsJkIIANBuKMGKwMAIgOhmUGQmQgrAwCjIgQ5AwAgBCABQZiZCCsDABAKIQRB4JgIQcjfBisDACIBOQMAQcCZCCADIAIgBKKgIgI5AwBBuJkIIAI5AwBB4JoIQfjWBisDAEQAAAAAAAApwKBEAAAAAAAAKUCgRAAAAAAAAClAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDxsiBDkDAEHQmAhBgJcHKwMARAAAAAAAAEnAoEQAAAAAAABJQKBEAAAAAAAASUAgDxsiAzkDAEHYmAggASADoCIFOQMAQciZCCACRAAAAAAAAPA/QcCQCCsDACICIAJBiJkIKwMAmqKiEAihokQAAAAAAADwP6AiAjkDAEHomgggAkHomQgrAwBB+JkIKwMAQaiaCCsDAEHYmggrAwAgBKKioqKiOQMAQeiYCEHQ0AUrAwBEthd4vgRGlb6gRLYXeL4ERpU+oES2F3i+BEaVPiAPGyICOQMAQfCYCCACQYCjBisDACICoZkgA6MiAzkDAEGAmQggAkGg2AcrAwAgAyABIAUQCqKgIgE5AwBB+JgIIAE5AwBBoJgIQZiYCCsDAER2gw309SHUPqAiAjkDAEGAmAhB+JcIKwMAQbCXCCsDAKBB6JYIKwMAoEGIlggrAwCgQcCVCCsDAKBB6JQIKwMAIgOgIgQ5AwBBsOYGKwMAIQVBwJAIKwMAIQZBkJgIRAAAAAAAAPA/QYCgBisDAEGIoAYrAwAiBxALIgggCCAGIAWjIAcQC6CjoSIFOQMAQYiYCCADIASjIgM5AwBBqLkLIANEAAAAAAAA8D9BkMsGKwMAoaIiAzkDAEGwmAggAkGomAgrAwCgIgI5AwBBuJgIIAIgBaIiAjkDAEHAmAggAkGg2wcrAwCiIgI5AwBBsLkLIAMgAqIgAaMiATkDAEG4uQsgAUHomggrAwCjIgE5AwADQCAAIA5BAnRBkAlqKAIAQQN0QdC4C2orAwCgIQAgDkEBaiIOQQRHDQALQcC5CyABIACgIgA5AwBB8JoIQaiRCCsDAEGwzQUrAwCiRAAAAAAAAAAAoCIBOQMAQaDCCyABIAAQBiIAOQMAQeDCCyAAQZDCCysDAKI5AwBEAAAAAAAAAAAhAEEAIQ5BoNwGQeDbBisDAEGwmwcrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwP0Hg/w0rAwAiAUGgpQcrAwBEAAAAAAAA4D+ioCICRAAAAAAAkJ9AZCIPG6I5AwBBuNwGQfjbBisDAEHImwcrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwPyAPG6I5AwBBqNwGQejbBisDAEG4mwcrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwPyAPG6I5AwBBsNwGQfDbBisDAEHAmwcrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwPyAPG6IiAzkDAANAIAAgDkECdEGQCWooAgBBA3RBgNwGaisDAKAhACAOQQFqIg5BBEcNAAtBiLIMQYCkDCsDACIEOQMAQZCyDCAEQcDjBisDAKMiBDkDAEHwsQwgAyAAQYDcBisDAKCjOQMAQYCyDEGAnwcrAwBEFK5H4XoU8r+gRBSuR+F6FPI/oEQUrkfhehTyPyACRAAAAAAAkJ9AZCIOGyIAOQMAQZiyDEHQnAcrAwBEmpmZmZmZ+b+gRJqZmZmZmfk/oESamZmZmZn5PyAOGyICOQMAQaCyDEGAmQcrAwBEmpmZmZmZAcCgRJqZmZmZmQFAoESamZmZmZkBQCAOGyIDOQMAQaiyDCADIAQgAKEgApqiEAhEAAAAAAAA8D+goyICOQMARAAAAAAAAPA/IQAgAUQAAAAAAJCfQGNFBEAgAUQAAAAAAJCfwKBB0NcHKwMAoUHw0QcrAwCaohAIIQBBgMAGKwMAIABEAAAAAAAA8D+goyEAC0GwsgwgADkDAEHQsgxBuNsGKwMAQcDcBisDAKJBiKMMKwMAoiIBOQMAQdiyDCABQajnBisDAKMiATkDAEHwmQgrAwBB8NQHKwMAoUGYzwcrAwCaohAIIQNBuLIMQfi/BisDACADRAAAAAAAAPA/oKMiAzkDAEHAsgwgAiAAQbj+BisDACADoqKiIgA5AwBByLIMIABBgN0GKwMAoyIAOQMAQeiyDCAAQaDLBysDACABQeDLBysDAJqiEAiiIgCiIgE5AwBB4LIMIAA5AwBB8LIMIAFBiN0GKwMAoyIAOQMAQfiyDEGEugUoAgBB8KIMKwMAIACjEAkiADkDAEGAswwgAEHwsgwrAwCiIgA5AwBBiLMMIABBiN0GKwMAoiIAOQMAQZCzDCAAQYDdBisDAKIiADkDAEGYswxBwLIMKwMAIAAQBiIAOQMAQaCzDCAAQZDdBisDAKIiADkDAEHgswwgAEHwsQwrAwCiIgA5AwBBoLQMIABB4MILKwMAoyIAOQMAQeC0DCAAQbCxDCsDAKM5AwBB8M4HQcCcBysDAEQAAAAAAADQv6BEAAAAAAAA0D+gRAAAAAAAANA/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQbOQMARAAAAAAAAAAAIQBBACEOQeC1DEHA6AYrAwAiA0GAzwUrAwCiIgQ5AwBB0L8GQfCYBysDAEQAAAAAAAD4v6BEAAAAAAAA+D+gRAAAAAAAAPg/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCIBRAAAAAAAkJ9AZCIPGyICOQMAQaC1DCACQeC0DCsDAEHQ1AcrAwAiBaFB8M4HKwMAmiIGohAIRAAAAAAAAPA/oKMiBzkDAEGA1gZBwNUGKwMAQeCaBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IA8bojkDAEGY1gZB2NUGKwMAQfiaBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IA8bojkDAEGI1gZByNUGKwMAQeiaBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IA8bojkDAEGQ1gZB0NUGKwMAQfCaBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IA8boiIIOQMAA0AgACAOQQJ0QZAJaigCAEEDdEHg1QZqKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5BoLYMIAggAEHg1QYrAwCgoyIAOQMAQbC2DEGw/gYrAwBBuLIMKwMAokGwsgwrAwCiQaiyDCsDAKIiCDkDAEHwtgwgACAIoiIAOQMAQbC3DCAAQeDDCysDAKMiADkDAEHwtwwgACAEoyIAOQMAQbC4DCACIAAgBaEgBqIQCEQAAAAAAADwP6CjIgA5AwBB8LgMIAAgBxAGIgA5AwBBsLkMIAMgAKIiADkDAEHomQgrAwAhAkHYmggrAwAhA0GomggrAwAhBEH4mQgrAwAhBUGAwgtBwMELKwMAIgY5AwBB4LAMQaC2CysDAEGwuAsrAwCjOQMAQaCxDEGw6AYrAwBBsM8FKwMAoiIHOQMAQfC5DCACIAMgBCAFIACioqKiIgA5AwBBwNQHQeCeBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IAFEAAAAAACQn0BkGzkDAEGwugxBwLgLKwMAQeDCCysDACAAohAGIgA5AwBB8LoMIAA5AwBBsLsMIABB8LAMKwMAojkDAEHQwgsgBkGgwgsrAwCiIgI5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RBgNwGaisDAKAhACAOQQFqIg5BBEcNAAtB4LEMQaDcBisDACAAQYDcBisDAKCjIgA5AwBB0LMMQaCzDCsDACAAoiIAOQMAQeDOB0GwnAcrAwBEmpmZmZmZyb+gRJqZmZmZmck/oESamZmZmZnJPyABRAAAAAAAkJ9AZCIOGzkDAEHAvwZB4JgHKwMARPYoXI/C9fi/oET2KFyPwvX4P6BE9ihcj8L1+D8gDhs5AwBBkLQMIAAgAqMiADkDAEHQtAwgACAHozkDAEEAIQ5B0LUMQbDoBisDACICQfDOBSsDAKIiAzkDAEHQtAwrAwBBwNQHKwMAIgShQeDOBysDAJoiBaIQCCEAQZC1DEHAvwYrAwAiBiAARAAAAAAAAPA/oKMiBzkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEHg1QZqKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5BkLYMQYDWBisDACAAQeDVBisDACIBoKMiADkDAEHgtgxBsLYMKwMAIgggAKIiADkDAEGgtwwgAEHQwwsrAwCjIgA5AwBB4LcMIAAgA6MiADkDAEGguAwgBiAAIAShIAWiEAhEAAAAAAAA8D+goyIAOQMAQeC4DCAAIAcQBiIAOQMAQaC5DCACIACiIgA5AwBB4LkMQeiZCCsDACIEQdiaCCsDACIFQaiaCCsDACIGQfiZCCsDACIHIACioqKiIgA5AwBBoLoMQbC4CysDAEHQwgsrAwAgAKIQBiIAOQMAQeC6DCAAOQMAQaC7DCAAQeCwDCsDAKI5AwBBgLEMQaD+BisDACICQZDPBSsDAKIiCTkDAEHAuwxB0J4MKwMAIgM5AwBEAAAAAAAAAAAhAEHIuwxBqJEIKwMAQaDRBisDAKJEAAAAAAAAAACgIgo5AwBB0LsMIAogAxAGIgM5AwADQCAAIA5BAnRBkAlqKAIAQQN0QYDcBmorAwCgIQAgDkEBaiIOQQRHDQALQQAhDkGwtQwgAkHQzgUrAwCiIgo5AwBBwLEMQYDcBisDACILIAAgC6CjIgA5AwBBsLMMQaCzDCsDACAAoiIAOQMAQfCzDCAAIAOjIgA5AwBBsLQMIAAgCaMiADkDACAAQaDUBysDACIJoUHAzgcrAwCaIguiEAghAEHwtAxBoL8GKwMAIgwgAEQAAAAAAADwP6CjIg05AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RB4NUGaisDAKAhACAOQQFqIg5BBEcNAAtB8LUMIAEgASAAoKMiADkDAEHAtgwgCCAAoiIAOQMAQYC3DCAAIAOjIgA5AwBBwLcMIAAgCqMiADkDAEGAuAwgDCAAIAmhIAuiEAhEAAAAAAAA8D+goyIAOQMAQcC4DCAAIA0QBiIAOQMAQdi7DCAEIAAgBSAGIAcgAqKioqKiOQMAQQAhDkHguwxB4J8MKwMAIgA5AwBB+LAMQbi2CysDAEHIuAsrAwAiBaMiBjkDAEGgvAwgAEHQuwwrAwCiQdi7DCsDAKJBgLYLKwMAEAYiADkDAEHgvAwgADkDAEHAugwgADkDAEGAuwwgADkDAEHY1AdB+J4HKwMARAAAAAAAAPC/oEQAAAAAAADwP6BEAAAAAAAA8D9B4P8NKwMAQaClBysDAEQAAAAAAADgP6KgIgREAAAAAACQn0BkGyIBOQMAQbixDEHI6AYrAwAiAkHIzwUrAwCiIgc5AwBBmMILQdjBCysDACIAOQMAQejCCyAAQaDCCysDAKIiAzkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEGA3AZqKwMAoCEAIA5BAWoiDkEERw0AC0HotQwgAkGIzwUrAwCiIgg5AwBBACEOQfixDEG43AYrAwAgAEGA3AYrAwCgoyIAOQMAQeizDEGgswwrAwAgAKIiADkDAEH4zgdByJwHKwMARAAAAAAAAPC/oEQAAAAAAADwP6BEAAAAAAAA8D8gBEQAAAAAAJCfQGQiDxsiCTkDAEHYvwZB+JgHKwMARAAAAAAAAATAoEQAAAAAAAAEQKBEAAAAAAAABEAgDxsiBDkDAEGotAwgACADoyIAOQMAQei0DCAAIAejIgA5AwBBqLUMIAQgACABoSAJmiIHohAIRAAAAAAAAPA/oKMiCTkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEHg1QZqKwMAoCEAIA5BAWoiDkEERw0AC0GotgxBmNYGKwMAIABB4NUGKwMAoKMiADkDAEH4tgxBsLYMKwMAIACiIgA5AwBBuLcMIABB6MMLKwMAoyIAOQMAQfi3DCAAIAijIgA5AwBBuLgMIAQgACABoSAHohAIRAAAAAAAAPA/oKMiADkDAEH4uAwgACAJEAYiADkDAEG4uQwgAiAAoiIAOQMAQfi5DEHomQgrAwBB2JoIKwMAQaiaCCsDAEH4mQgrAwAgAKKioqIiADkDAEG4ugwgBSADIACiEAYiADkDAEH4ugwgADkDAEG4uwwgBiAAojkDAEHosAxBqLYLKwMAQbi4CysDAKM5AwBBACEOQYjCC0HIwQsrAwAiADkDAEGosQxBuOgGKwMAIgFBuM8FKwMAoiIFOQMAQdjCCyAAQaDCCysDAKIiAjkDAEHI1AdB6J4HKwMARAAAAAAAAPC/oEQAAAAAAADwP6BEAAAAAAAA8D9B4P8NKwMAQaClBysDAEQAAAAAAADgP6KgIgREAAAAAACQn0BkGyIDOQMARAAAAAAAAAAAIQADQCAAIA5BAnRBkAlqKAIAQQN0QYDcBmorAwCgIQAgDkEBaiIOQQRHDQALQdi1DCABQfjOBSsDAKIiBjkDAEEAIQ5B6LEMQajcBisDACAAQYDcBisDAKCjIgA5AwBB2LMMQaCzDCsDACAAoiIAOQMAQejOB0G4nAcrAwBEmpmZmZmZ6b+gRJqZmZmZmek/oESamZmZmZnpPyAERAAAAAAAkJ9AZCIPGyIHOQMAQci/BkHomAcrAwBEmpmZmZmZ+b+gRJqZmZmZmfk/oESamZmZmZn5PyAPGyIEOQMAQZi0DCAAIAKjIgA5AwBB2LQMIAAgBaMiADkDAEGYtQwgBCAAIAOhIAeaIgWiEAhEAAAAAAAA8D+goyIHOQMARAAAAAAAAAAAIQADQCAAIA5BAnRBkAlqKAIAQQN0QeDVBmorAwCgIQAgDkEBaiIOQQRHDQALQZi2DEGI1gYrAwAgAEHg1QYrAwCgoyIAOQMAQei2DEGwtgwrAwAgAKIiADkDAEGotwwgAEHYwwsrAwCjIgA5AwBB6LcMIAAgBqMiADkDAEGouAwgBCAAIAOhIAWiEAhEAAAAAAAA8D+goyIAOQMAQei4DCAAIAcQBiIAOQMAQai5DCABIACiIgA5AwBB6LkMQeiZCCsDAEHYmggrAwBBqJoIKwMAQfiZCCsDACAAoqKioiIAOQMAQai6DEG4uAsrAwAiASACIACiEAYiADkDAEHougwgADkDAEGouwwgAEHosAwrAwCiOQMAQdC9DEGAuAsrAwBBwLgLKwMAoyIAOQMAQZC+DCAAQbC6DCsDAKI5AwBBwL0MQfC3CysDAEGwuAsrAwCjIgA5AwBBgL4MIABBoLoMKwMAojkDAEHYvQxBiLgLKwMAQci4CysDAKMiADkDAEGYvgwgAEG4ugwrAwCiOQMAQci9DEH4twsrAwAgAaM5AwBEAAAAAAAAAAAhAEEAIQ5BACEPRAAAAAAAAAAAIQFBiL4MQai6DCsDAEHIvQwrAwCiOQMAQYC3CysDACECA0AgACAOQQJ0QZAJaigCAEEDdEHgvQxqKwMAIAKjoCEAIA5BAWoiDkEERw0AC0HwuwxBsJ8MKwMAIgM5AwBB6LwMQYi2CysDACAAEAYiADkDAEEAIQ5BoL4MQdi7DCsDAEHI0QYrAwCiIgQ5AwBByLoMIAA5AwBB+LwMIABBwNEGKwMAoiICOQMAQdi6DCACOQMAQZi7DCACOQMAQbC8DCAEIANB0LsMKwMAoqJBkLYLKwMAEAYiAjkDAEHwvAwgAjkDAEHQugwgAjkDAEGQuwwgAjkDAEGIuwwgADkDAANAIA9BA3QiEEGwvgxqIBBBwJwIaisDACAQQYC7DGorAwCiOQMAIA9BAWoiD0EIRw0AC0QAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEGwvgxqKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5B8L4MIAA5AwBB+L4MIABBoNsHKwMAQdjWBSsDAKJBiNIHKwMAoiICoyIDOQMARAAAAAAAAAAAIQADQCAAIA5BA3RBsL4MaisDAKAhACAOQQFqIg5BBEcNAAtBACEPQYC/DCAAOQMAQYi/DCAAIAKjIgA5AwBBkL8MIAMgAKAiADkDAEGYvwwgAEG4sAwrAwCjIgA5AwAgAEHg1AcrAwChQYDPBysDAJqiEAghAEGgvwxB4L8GKwMAIABEAAAAAAAA8D+goyIAOQMAQai/DCAAOQMAQdChDEHsuAUoAgBB4P8NKwMAEAkiBjkDAEHgoQxB2KEMKwMAIgU5AwBB8KEMQeihDCsDACICOQMARAAAAAAAAAAAIQADQEEAIQ4DQCAAIA9BqAFsQdDnB2ogDkECdEHACGooAgBBA3RqKwMAoCEAIA5BAWoiDkESRw0ACyAPQQFqIg9BAkcNAAtEAAAAAAAAAAAhA0EAIQ8DQEEAIQ4DQCADIA9BqAFsQaDiB2ogDkECdEHACGooAgBBA3RqKwMAoCEDIA5BAWoiDkESRw0ACyAPQQFqIg9BAkcNAAtEAAAAAAAAAAAhBEEAIQ8DQEEAIQ4DQCAEIA9BqAFsQfDsB2ogDkECdEHACGooAgBBA3RqKwMAoCEEIA5BAWoiDkESRw0ACyAPQQFqIg9BAkcNAAtBACEPA0BBACEOA0AgASAPQagBbEHA2AdqIA5BAnRBwAhqKAIAQQN0aisDAKAhASAOQQFqIg5BEkcNAAsgD0EBaiIPQQJHDQALQcC/DEGwoAwrAwA5AwBByL8MQZjDBisDAEHQowwrAwCgOQMAQfihDCACIACiIAUgAqAgA6KgIAYgBaAgAqAgBKKgIAGjIgA5AwBBsL8MIABBiMsGKwMAoyIAOQMAIABB4NIHKwMAoUGIzQcrAwCaohAIIQBBuL8MQYC7BisDACAARAAAAAAAAPA/oKM5AwBBACEOQdC/DEHIvwwrAwBBwL8MKwMAokG4vwwrAwCiQai/DCsDAKJBsLAMKwMAoiIAOQMAQdi/DCAAQaDDBisDAKMiADkDAANAQQAhDwNAIAAgD0EDdCIQIA5BqAFsIhFBgNUHamorAwChIBFBoM8HaiAQaisDAJqiEAghASARQeC/DGogEGogEUGAxgZqIBBqKwMAIBFBkLsGaiAQaisDACABRAAAAAAAAPA/oKOgOQMAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtBACEOQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCEAA0BBACEPA0AgDkGoAWxBsMIMaiAPQQN0aiAARAAAAAAAQJ9AZAR8IA9BA3QiECAOQagBbCIRQfCZDGpqKwMAIBFB4L8MaiAQaisDAKIFRAAAAAAAAAAACzkDACAPQQFqIg9BFUcNAAsgDkEBaiIOQQJHDQALQQAhDgNAQQAhDwNAIA9BA3QiECAOQagBbCIRQYDFDGpqIBFB8JkMaiAQaisDACARQbDCDGogEGorAwAgEUHQywZqIBBqKwMAoBASOQMAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtBACEOQaC5BisDACEAA0BBACEPA0AgD0EDdCIQIA5BqAFsIhFB0McMamogACARQeC/DGogEGorAwAiAaIgASAAIBFBgMUMaiAQaisDAKGiRAAAAAAAAPA/oKM5AwAgD0EBaiIPQRVHDQALIA5BAWoiDkECRw0AC0EAIQ9BoMoMQbDGBSsDADkDAEHIywxB2McFKwMAOQMAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCEAQQEhDgNAIA9BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAPQagBbCIPQaDKDGorAwBEAAAAAAAA8D8gD0HQxwxqKwMAoaIFRAAAAAAAAAAACzkDCEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA5BqAFsIg5BoMoMaisDCEQAAAAAAADwPyAOQdDHDGorAwihogVEAAAAAAAAAAALOQMQQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEGgygxqIABEAAAAAABAn0BkBHwgD0GoAWwiD0GgygxqKwMQRAAAAAAAAPA/IA9B0McMaisDEKGiBUQAAAAAAAAAAAs5AxhBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAOQagBbCIOQaDKDGorAxhEAAAAAAAA8D8gDkHQxwxqKwMYoaIFRAAAAAAAAAAACzkDIEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA9BqAFsIg9BoMoMaisDIEQAAAAAAADwPyAPQdDHDGorAyChogVEAAAAAAAAAAALOQMoQQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbEGgygxqIABEAAAAAABAn0BkBHwgDkGoAWwiDkGgygxqKwMoRAAAAAAAAPA/IA5B0McMaisDKKGiBUQAAAAAAAAAAAs5AzBBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAPQagBbCIPQaDKDGorAzBEAAAAAAAA8D8gD0HQxwxqKwMwoaIFRAAAAAAAAAAACzkDOEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA5BqAFsIg5BoMoMaisDOEQAAAAAAADwPyAOQdDHDGorAzihogVEAAAAAAAAAAALOQNAQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEGgygxqIABEAAAAAABAn0BkBHwgD0GoAWwiD0GgygxqKwNARAAAAAAAAPA/IA9B0McMaisDQKGiBUQAAAAAAAAAAAs5A0hBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAOQagBbCIOQaDKDGorA0hEAAAAAAAA8D8gDkHQxwxqKwNIoaIFRAAAAAAAAAAACzkDUEEBIQ4gD0EBcSEQQQAhDyAQDQALA0AgD0GoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA9BqAFsIg9BoMoMaisDUEQAAAAAAADwPyAPQdDHDGorA1ChogVEAAAAAAAAAAALOQNYQQEhDyAOQQFxIRBBACEOIBANAAsDQCAOQagBbEGgygxqIABEAAAAAABAn0BkBHwgDkGoAWwiDkGgygxqKwNYRAAAAAAAAPA/IA5B0McMaisDWKGiBUQAAAAAAAAAAAs5A2BBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAPQagBbCIPQaDKDGorA2BEAAAAAAAA8D8gD0HQxwxqKwNgoaIFRAAAAAAAAAAACzkDaEEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA5BqAFsIg5BoMoMaisDaEQAAAAAAADwPyAOQdDHDGorA2ihogVEAAAAAAAAAAALOQNwQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEGgygxqIABEAAAAAABAn0BkBHwgD0GoAWwiD0GgygxqKwNwRAAAAAAAAPA/IA9B0McMaisDcKGiBUQAAAAAAAAAAAs5A3hBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAOQagBbCIOQaDKDGorA3hEAAAAAAAA8D8gDkHQxwxqKwN4oaIFRAAAAAAAAAAACzkDgAFBASEOIA9BAXEhEEEAIQ8gEA0ACwNAIA9BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAPQagBbCIPQaDKDGorA4ABRAAAAAAAAPA/IA9B0McMaisDgAGhogVEAAAAAAAAAAALOQOIAUEBIQ8gDkEBcSEQQQAhDiAQDQALA0AgDkGoAWxBoMoMaiAARAAAAAAAQJ9AZAR8IA5BqAFsIg5BoMoMaisDiAFEAAAAAAAA8D8gDkHQxwxqKwOIAaGiBUQAAAAAAAAAAAs5A5ABQQEhDiAPQQFxIRBBACEPIBANAAsDQCAPQagBbEGgygxqIABEAAAAAABAn0BkBHwgD0GoAWwiD0GgygxqKwOQAUQAAAAAAADwPyAPQdDHDGorA5ABoaIFRAAAAAAAAAAACzkDmAFBASEPIA5BAXEhEEEAIQ4gEA0ACwNAIA5BqAFsQaDKDGogAEQAAAAAAECfQGQEfCAOQagBbCIOQaDKDGorA5gBRAAAAAAAAPA/IA5B0McMaisDmAGhogVEAAAAAAAAAAALOQOgAUEBIQ4gD0EBcSEQQQAhDyAQDQALQQAhDkHQvwwrAwAhAANAQQAhDwNAIA9BA3QiECAOQagBbCIRQfDMDGpqIAAgEUGwwwZqIBBqKwMAojkDACAPQQFqIg9BFUcNAAsgDkEBaiIOQQJHDQALQdDbB0Ho0wUrAwBBuNsHKwMAoDkDAEGw2wdB2NEGKwMAIgBBiNEGKwMAIAChQajbBysDAEHwngYrAwCjoqA5AwBBACEOQZjcB0GY1AUrAwBBgNwHKwMAoCIAOQMAQbjcB0GA1AUrAwBBoNwHKwMAoCIBOQMAQfjbBysDACICQdDbBysDAKEgAJqiEAghAEHA3AcgAUGwugUrAwCiIABEAAAAAAAA8D+gozkDAEHI3AdBxLgFKAIAIAJB0NIHKwMAoxAJOQMAQdDcB0HIuAUoAgBB+NsHKwMAQdDSBysDAKMQCSICOQMAQeDcB0GwugUrAwAiAUQAAAAAAADwP0QAAAAAAADwP0H42wcrAwAiAEHQywcrAwCiRAAAAAAAAPA/oCAAIACiQZDMBysDAKKgo6GiIgM5AwBB2NwHIAFEAAAAAAAA8D9EAAAAAAAA8D8gAEHAzAcrAwCjQdjMBysDABALRAAAAAAAAPA/oCAAQcjMBysDAKNB4MwHKwMAEAugo6GiIgQ5AwBB6NwHAnxEAAAAAAAAAABB4NMFKwMAIgBEAAAAAAAAAABhDQAaIAMgAEQAAAAAAADwP2ENABogBCAARAAAAAAAAABAYQ0AGiACIABEAAAAAAAACEBhDQAaQcjcB0HA3AcgAEQAAAAAAAAQQGEbKwMACyIAOQMAQfDcB0QAAAAAAADwPyAAIAGjoTkDAEGYwgZBkMIGKwMAOQMAQQEhDwNAIA5BqAFsIg5BgN0HakHA/wUrAwAgDkGQwAZqKwNgQejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQNgIA9BAXEhEEEAIQ9BASEOIBANAAtB0OUHQYDjBysDADkDAEGA6wdBsOgHKwMAOQMAQfjmB0Go5AcrAwA5AwBBACEOQcjnB0HYowcrAwBBwOcHKwMAoCIAOQMAQajsB0HY6QcrAwA5AwBBsOAHQYChBisDAEHg3QcrAwCiRAAAAAAAAPA/EAY5AwBBqKIGQeD/DSsDAEQAAAAAABSfwKBEoyO5/If01z+iRLx0kxgEZkFAoEQAAAAAAABPQBAGRAAAAAAAAFlAo0SamZmZmZm5PxAHIgE5AwBB2OEHIAFBiN8HKwMAokQAAAAAAADwPxAGOQMAQfDyB0Gg8AcrAwA5AwBBmPQHQcjxBysDADkDAEQAAAAAAADwPyAAoSEBQQEhDwNAIA5B0AJsQaj2B2ogDkGoAWwiDkGQ8gdqKwNgIA5BoOoHaisDYKAgASAOQfDkB2orA2CioDkDACAPQQFxIRBBACEPQQEhDiAQDQALQeD6B0HQ7QcrAwAiATkDAEGI/AdB+O4HKwMAIgI5AwBBoPYHIAEgAEHQ5QcrAwCioDkDAEHw+AcgAiAAQfjmBysDAKKgOQMAQQAhDgNAIA9B0AJsIhBB8IEIaiIRIBBB4PQHaiISKwPAASAQQdD8B2oiECsDwAGjOQPAASARIBIrA8gBIBArA8gBozkDyAEgD0EBaiIPQQJHDQALA0AgDkHQAmwiD0GQhwhqIhAgD0HwgQhqIg8rA8ABIA5BqAFsQdDfB2orA2AiAKI5A8ABIBAgACAPKwPIAaI5A8gBQQEhDyAOQQFqIg5BAkcNAAtBACEOA0AgDkGoAWwiDkGA3QdqQcD/BSsDACAOQZDABmorA1hB6NYFKwMAIgBB4NUFKwMAIgGhoyABIAAQCqA5A1hBASEOIA9BAXEhEEEAIQ8gEA0AC0HI5QdB+OIHKwMAOQMAQfjqB0Go6AcrAwA5AwBB6PIHQZjwBysDADkDAEHw5gdBoOQHKwMAOQMAQaDsB0HQ6QcrAwA5AwBBqOAHQfigBisDAEHY3QcrAwCiRAAAAAAAAPA/EAY5AwBBACEOQaCiBkHg/w0rAwBEAAAAAAAUn8CgRKMjufyH9Nc/okS8dJMYBGZBQKBEAAAAAAAAT0AQBkQAAAAAAABZQKNEmpmZmZmZuT8QByIAOQMAQdDhByAAQYDfBysDAKJEAAAAAAAA8D8QBjkDAEGQ9AdBwPEHKwMAOQMARAAAAAAAAPA/QcjnBysDAKEhAEEBIQ8DQCAOQdACbEGY9gdqIA5BqAFsIg5BkPIHaisDWCAOQaDqB2orA1igIAAgDkHw5AdqKwNYoqA5AwAgD0EBcSEQQQAhD0EBIQ4gEA0AC0HY+gdByO0HKwMAOQMAQYD8B0Hw7gcrAwA5AwBBACEOQZD2B0HI5wcrAwAiAEHI5QcrAwCiQdj6BysDAKA5AwBB4PgHIABB8OYHKwMAokGA/AcrAwCgOQMAA0AgD0HQAmwiEEHwgQhqIhEgEEHg9AdqIhIrA7ABIBBB0PwHaiIQKwOwAaM5A7ABIBEgEisDuAEgECsDuAGjOQO4ASAPQQFqIg9BAkcNAAsDQCAOQdACbCIPQZCHCGoiECAPQfCBCGoiDysDsAEgDkGoAWxB0N8HaisDWCIAojkDsAEgECAAIA8rA7gBojkDuAEgDkEBaiIOQQJHDQALQYjCBkHgwQYrAwA5AwBBASEOQQAhDwNAIA9BqAFsIg9BgN0HakHA/wUrAwAgD0GQwAZqKwNQQejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQNQIA5BAXEhEEEAIQ5BASEPIBANAAtBwOUHQfDiBysDADkDAEHw6gdBoOgHKwMAOQMAQeDyB0GQ8AcrAwA5AwBB6OYHQZjkBysDADkDAEGY7AdByOkHKwMAOQMAQaDgB0HwoAYrAwBB0N0HKwMAokQAAAAAAADwPxAGOQMAQcjhB0GYogYrAwBB+N4HKwMAokQAAAAAAADwPxAGOQMAQYj0B0G48QcrAwA5AwBEAAAAAAAA8D9ByOcHKwMAIgChIQEDQCAOQdACbEGI9gdqIA5BqAFsIg5BkPIHaisDUCAOQaDqB2orA1CgIAEgDkHw5AdqKwNQoqA5AwAgD0EBcSEQQQAhD0EBIQ4gEA0AC0HQ+gdBwO0HKwMAIgE5AwBB+PsHQejuBysDACICOQMAQYD2ByABIABBwOUHKwMAoqA5AwBB0PgHIAIgAEHo5gcrAwCioDkDAEEAIQ4DQCAPQdACbCIQQfCBCGoiESAQQeD0B2oiEisDoAEgEEHQ/AdqIhArA6ABozkDoAEgESASKwOoASAQKwOoAaM5A6gBIA9BAWoiD0ECRw0ACwNAIA5B0AJsIg9BkIcIaiIQIA9B8IEIaiIPKwOgASAOQagBbEHQ3wdqKwNQIgCiOQOgASAQIAAgDysDqAGiOQOoASAOQQFqIg5BAkcNAAtBgMIGQeDBBisDADkDAEEBIQ5BACEPA0AgD0GoAWwiD0GA3QdqQcD/BSsDACAPQZDABmorA0hB6NYFKwMAIgBB4NUFKwMAIgGhoyABIAAQCqA5A0ggDkEBcSEQQQAhDkEBIQ8gEA0AC0G45QdB6OIHKwMAOQMAQejqB0GY6AcrAwA5AwBB2PIHQYjwBysDADkDAEHg5gdBkOQHKwMAOQMAQZDsB0HA6QcrAwA5AwBBmOAHQeigBisDAEHI3QcrAwCiRAAAAAAAAPA/EAY5AwBBwOEHQZCiBisDAEHw3gcrAwCiRAAAAAAAAPA/EAY5AwBBgPQHQbDxBysDADkDAEQAAAAAAADwP0HI5wcrAwAiAKEhAQNAIA5B0AJsQfj1B2ogDkGoAWwiDkGQ8gdqKwNIIA5BoOoHaisDSKAgASAOQfDkB2orA0iioDkDACAPQQFxIRBBACEPQQEhDiAQDQALQcj6B0G47QcrAwAiATkDAEHw+wdB4O4HKwMAIgI5AwBB8PUHIAEgAEG45QcrAwCioDkDAEHA+AcgAiAAQeDmBysDAKKgOQMAQQAhDgNAIA9B0AJsIhBB8IEIaiIRIBBB4PQHaiISKwOQASAQQdD8B2oiECsDkAGjOQOQASARIBIrA5gBIBArA5gBozkDmAEgD0EBaiIPQQJHDQALA0AgDkHQAmwiD0GQhwhqIhAgD0HwgQhqIg8rA5ABIA5BqAFsQdDfB2orA0giAKI5A5ABIBAgACAPKwOYAaI5A5gBIA5BAWoiDkECRw0AC0H4wQZB4MEGKwMAOQMAQQEhDkEAIQ8DQCAPQagBbCIPQYDdB2pBwP8FKwMAIA9BkMAGaisDQEHo1gUrAwAiAEHg1QUrAwAiAaGjIAEgABAKoDkDQCAOQQFxIRBBACEOQQEhDyAQDQALQbDlB0Hg4gcrAwA5AwBB4OoHQZDoBysDADkDAEHY5gdBiOQHKwMAOQMAQYjsB0G46QcrAwA5AwBBkOAHQeCgBisDAEHA3QcrAwCiRAAAAAAAAPA/EAY5AwBBuOEHQYiiBisDAEHo3gcrAwCiRAAAAAAAAPA/EAY5AwBB0PIHQYDwBysDADkDAEH48wdBqPEHKwMAOQMARAAAAAAAAPA/QcjnBysDACIAoSEBA0AgDkHQAmxB6PUHaiAOQagBbCIOQZDyB2orA0AgDkGg6gdqKwNAoCABIA5B8OQHaisDQKKgOQMAIA9BAXEhEEEAIQ9BASEOIBANAAtBwPoHQbDtBysDACIBOQMAQej7B0HY7gcrAwAiAjkDAEHg9QcgASAAQbDlBysDAKKgOQMAQbD4ByACIABB2OYHKwMAoqA5AwBBACEOA0AgD0HQAmwiEEHwgQhqIhEgEEHg9AdqIhIrA4ABIBBB0PwHaiIQKwOAAaM5A4ABIBEgEisDiAEgECsDiAGjOQOIASAPQQFqIg9BAkcNAAsDQCAOQdACbCIPQZCHCGoiECAPQfCBCGoiDysDgAEgDkGoAWxB0N8HaisDQCIAojkDgAEgECAAIA8rA4gBojkDiAEgDkEBaiIOQQJHDQALQfDBBkHgwQYrAwA5AwBBASEOQQAhDwNAIA9BqAFsIg9BgN0HakHA/wUrAwAgD0GQwAZqKwM4QejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQM4IA5BAXEhEEEAIQ5BASEPIBANAAtBqOUHQdjiBysDADkDAEHY6gdBiOgHKwMAOQMAQcjyB0H47wcrAwA5AwBB0OYHQYDkBysDADkDAEGA7AdBsOkHKwMAOQMAQYjgB0HYoAYrAwBBuN0HKwMAokQAAAAAAADwPxAGOQMAQbDhB0GAogYrAwBB4N4HKwMAokQAAAAAAADwPxAGOQMAQfDzB0Gg8QcrAwA5AwBEAAAAAAAA8D9ByOcHKwMAIgChIQEDQCAOQdACbEHY9QdqIA5BqAFsIg5BkPIHaisDOCAOQaDqB2orAzigIAEgDkHw5AdqKwM4oqA5AwAgD0EBcSEQQQAhD0EBIQ4gEA0AC0G4+gdBqO0HKwMAIgE5AwBB4PsHQdDuBysDACICOQMAQdD1ByABIABBqOUHKwMAoqA5AwBBoPgHIAIgAEHQ5gcrAwCioDkDAEEAIQ4DQCAPQdACbCIQQfCBCGoiESAQQeD0B2oiEisDcCAQQdD8B2oiECsDcKM5A3AgESASKwN4IBArA3ijOQN4IA9BAWoiD0ECRw0ACwNAIA5B0AJsIg9BkIcIaiIQIA9B8IEIaiIPKwNwIA5BqAFsQdDfB2orAzgiAKI5A3AgECAAIA8rA3iiOQN4IA5BAWoiDkECRw0AC0HowQZB4MEGKwMAOQMAQQEhDkEAIQ8DQCAPQagBbCIPQYDdB2pBwP8FKwMAIA9BkMAGaisDMEHo1gUrAwAiAEHg1QUrAwAiAaGjIAEgABAKoDkDMCAOQQFxIRBBACEOQQEhDyAQDQALQaDlB0HQ4gcrAwA5AwBB0OoHQYDoBysDADkDAEHA8gdB8O8HKwMAOQMAQcjmB0H44wcrAwA5AwBB+OsHQajpBysDADkDAEGA4AdB0KAGKwMAQbDdBysDAKJEAAAAAAAA8D8QBjkDAEGo4QdB+KEGKwMAQdjeBysDAKJEAAAAAAAA8D8QBjkDAEHo8wdBmPEHKwMAOQMARAAAAAAAAPA/QcjnBysDACIAoSEBA0AgDkHQAmxByPUHaiAOQagBbCIOQZDyB2orAzAgDkGg6gdqKwMwoCABIA5B8OQHaisDMKKgOQMAIA9BAXEhEEEAIQ9BASEOIBANAAtBsPoHQaDtBysDACIBOQMAQdj7B0HI7gcrAwAiAjkDAEHA9QcgASAAQaDlBysDAKKgOQMAQZD4ByACIABByOYHKwMAoqA5AwBBACEOA0AgD0HQAmwiEEHwgQhqIhEgEEHg9AdqIhIrA2AgEEHQ/AdqIhArA2CjOQNgIBEgEisDaCAQKwNoozkDaCAPQQFqIg9BAkcNAAsDQCAOQdACbCIPQZCHCGoiECAPQfCBCGoiDysDYCAOQagBbEHQ3wdqKwMwIgCiOQNgIBAgACAPKwNoojkDaEEBIQ8gDkEBaiIOQQJHDQALQQAhDgNAIA5BqAFsIg5BgN0HakHA/wUrAwAgDkGQwAZqKwMoQejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQMoQQEhDiAPQQFxIRBBACEPIBANAAtB+N8HQcigBisDAEGo3QcrAwCiRAAAAAAAAPA/EAY5AwBBoOEHQfChBisDAEHQ3gcrAwCiRAAAAAAAAPA/EAY5AwBBACEOQZjlB0HI4gcrAwA5AwBByOoHQfjnBysDADkDAEG48gdB6O8HKwMAOQMAQcDmB0Hw4wcrAwA5AwBB8OsHQaDpBysDADkDAEHg8wdBkPEHKwMAOQMARAAAAAAAAPA/QcjnBysDACIAoSEBQQEhDwNAIA5B0AJsQbj1B2ogDkGoAWwiDkGQ8gdqKwMoIA5BoOoHaisDKKAgASAOQfDkB2orAyiioDkDACAPQQFxIRBBACEPQQEhDiAQDQALQaj6B0GY7QcrAwAiATkDAEHQ+wdBwO4HKwMAIgI5AwBBsPUHIAEgAEGY5QcrAwCioDkDAEGA+AcgAiAAQcDmBysDAKKgOQMAQQAhDgNAIA9B0AJsIhBB8IEIaiIRIBBB4PQHaiISKwNQIBBB0PwHaiIQKwNQozkDUCARIBIrA1ggECsDWKM5A1ggD0EBaiIPQQJHDQALA0AgDkHQAmwiD0GQhwhqIhAgD0HwgQhqIg8rA1AgDkGoAWxB0N8HaisDKCIAojkDUCAQIAAgDysDWKI5A1hBASEPIA5BAWoiDkECRw0AC0EAIQ4DQCAOQagBbCIOQYDdB2pBwP8FKwMAIA5BkMAGaisDIEHo1gUrAwAiAEHg1QUrAwAiAaGjIAEgABAKoDkDIEEBIQ4gD0EBcSEQQQAhDyAQDQALQZDlB0HA4gcrAwA5AwBBwOoHQfDnBysDADkDAEGw8gdB4O8HKwMAOQMAQbjmB0Ho4wcrAwA5AwBB6OsHQZjpBysDADkDAEHY8wdBiPEHKwMAOQMAQQAhDkHooQZB4P8NKwMARAAAAAAAFJ/AoCIARDj4wmSqYOK/okQSg8DKoYVIQKBEAAAAAAAAJEAQB0QAAAAAAABZQKNE16NwPQrX4z8QBiIBOQMAQcCgBiAARKW9wRcmU+O/okTByqFFtpNQQKBEAAAAAAAAJEAQB0QAAAAAAABZQKNEmpmZmZmZ6T8QBiIAOQMAQfDfByAAQaDdBysDAKJEAAAAAAAA8D8QBjkDAEGY4QcgAUHI3gcrAwCiRAAAAAAAAPA/EAY5AwBEAAAAAAAA8D9ByOcHKwMAIgChIQFBASEPA0AgDkHQAmxBqPUHaiAOQagBbCIOQZDyB2orAyAgDkGg6gdqKwMgoCABIA5B8OQHaisDIKKgOQMAIA9BAXEhEEEAIQ9BASEOIBANAAtBoPoHQZDtBysDACIBOQMAQcj7B0G47gcrAwAiAjkDAEGg9QcgASAAQZDlBysDAKKgOQMAQfD3ByACIABBuOYHKwMAoqA5AwBBACEOA0AgD0HQAmwiEEHwgQhqIhEgEEHg9AdqIhIrA0AgEEHQ/AdqIhArA0CjOQNAIBEgEisDSCAQKwNIozkDSCAPQQFqIg9BAkcNAAsDQCAOQdACbCIPQZCHCGoiECAPQfCBCGoiDysDQCAOQagBbEHQ3wdqKwMgIgCiOQNAIBAgACAPKwNIojkDSEEBIQ8gDkEBaiIOQQJHDQALQQAhDgNAIA5BqAFsIg5BgN0HakHA/wUrAwAgDkGQwAZqKwMYQejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQMYQQEhDiAPQQFxIRBBACEPIBANAAtBiOUHQbjiBysDADkDAEG46gdB6OcHKwMAOQMAQajyB0HY7wcrAwA5AwBBsOYHQeDjBysDADkDAEHg6wdBkOkHKwMAOQMAQdDzB0GA8QcrAwA5AwBBACEOQeChBkHg/w0rAwBEAAAAAAAUn8CgIgBEOPjCZKpg4r+iRBKDwMqhhUhAoEQAAAAAAAAkQBAHRAAAAAAAAFlAo0TXo3A9CtfjPxAGIgE5AwBBuKAGIABEpb3BFyZT47+iRMHKoUW2k1BAoEQAAAAAAAAkQBAHRAAAAAAAAFlAo0SamZmZmZnpPxAGIgA5AwBB6N8HIABBmN0HKwMAokQAAAAAAADwPxAGOQMAQZDhByABQcDeBysDAKJEAAAAAAAA8D8QBjkDAEQAAAAAAADwP0HI5wcrAwAiAKEhAUEBIQ8DQCAOQdACbEGY9QdqIA5BqAFsIg5BkPIHaisDGCAOQaDqB2orAxigIAEgDkHw5AdqKwMYoqA5AwAgD0EBcSEQQQAhD0EBIQ4gEA0AC0GY+gdBiO0HKwMAIgE5AwBBwPsHQbDuBysDACICOQMAQZD1ByABIABBiOUHKwMAoqA5AwBB4PcHIAIgAEGw5gcrAwCioDkDAEEAIQ4DQCAPQdACbCIQQfCBCGoiESAQQeD0B2oiEisDMCAQQdD8B2oiECsDMKM5AzAgESASKwM4IBArAzijOQM4IA9BAWoiD0ECRw0ACwNAIA5B0AJsIg9BkIcIaiIQIA9B8IEIaiIPKwMwIA5BqAFsQdDfB2orAxgiAKI5AzAgECAAIA8rAziiOQM4IA5BAWoiDkECRw0AC0GgjQhB8N8GKwMAIgA5AwBBuIwIQbCMCCsDAETZYOEkzR/BP6AiATkDAEHIjAggATkDAEHYjAhB0IwIKwMARE0uxsA6DuM/oCIBOQMAQcCMCCABOQMAQfCMCEHojAgrAwBECtgORuwTwD+gIgE5AwBBgI0IIAE5AwBBiI0IRAAAAAAAAPA/IAGhOQMAQZCNCEHY2gYrAwBEAAAAAAAAScCgRAAAAAAAAElAoEQAAAAAAABJQEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bIgE5AwBBmI0IIAAgAaAiAjkDAEGojQhB0NoGKwMARAAAAAAAABjAoEQAAAAAAAAYQKBEAAAAAAAAGEAgDhsiAzkDAEGwjQggA0GoowYrAwAiA6GZIAGjIgE5AwBBwI0IIANBoNgHKwMAIAEgACACEAqioCIAOQMAQbiNCCAAOQMAQciNCEHI2gYrAwBEAAAAAAAAWcCgRAAAAAAAAFlAoEQAAAAAAABZQEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkGzkDAEHQjQhBoOcGKwMAIgBBmOcGKwMAIAChQcjIBysDACIAQeDVBSsDACIBoaMgASAAEAqgIgA5AwBB6I0IQfDKBisDACIBQcjJBisDACICIAGhQeCNCCsDACIBIAFEAAAAAAAA8D+go6KgIgE5AwBB+I0IQejKBisDACIDQcDJBisDACIEIAOhQfCNCCsDACIDIANEAAAAAAAA8D+go6KgIgM5AwBByJ8GKwMAIQVB4P8NKwMAIQZBwMgHKwMAIQdB2I0IIABEAAAAAAAA8D9ByI0IKwMAQcCNCCsDACIAEAsiCCAIIAYgBaEgB6MgABALoKOhojkDAEGAjgggASACoyADIASjoEQAAAAAAADgP6I5AwBBkI4IQeDKBisDACIAQbjJBisDACIBIAChQYiOCCsDACIAIABEAAAAAAAA8D+go6KgIgA5AwBBoI4IQdjKBisDACICQbDJBisDACIDIAKhQZiOCCsDACICIAJEAAAAAAAA8D+go6KgIgI5AwBBuI4IQaDKBisDACIEQfjIBisDACIFIAShQbCOCCsDACIEIAREAAAAAAAA8D+go6KgIgQ5AwBByI4IQZjKBisDACIGQfDIBisDACIHIAahQcCOCCsDACIGIAZEAAAAAAAA8D+go6KgIgY5AwBBqI4IIAAgAaMgAiADo6BEAAAAAAAA4D+iOQMAQdCOCCAEIAWjIAYgB6OgRAAAAAAAAOA/ojkDAEHgjghBwMoGKwMAIgBBmMkGKwMAIAChQdiOCCsDACIAIABEAAAAAAAA8D+go6KgOQMAQfCOCEG4ygYrAwAiAEGQyQYrAwAgAKFB6I4IKwMAIgAgAEQAAAAAAADwP6CjoqA5AwBBACEPQfiOCEHwjggrAwBBkMkGKwMAo0HgjggrAwBBmMkGKwMAo6BEAAAAAAAA4D+iIgA5AwBBiI8IQbDKBisDACIBQYjJBisDACICIAGhQYCPCCsDACIBIAFEAAAAAAAA8D+go6KgIgE5AwBBmI8IQajKBisDACIDQYDJBisDACIEIAOhQZCPCCsDACIDIANEAAAAAAAA8D+go6KgIgM5AwBBoI8IIAEgAqMgAyAEo6BEAAAAAAAA4D+iIgE5AwBBsI8IQdDKBisDACICQajJBisDACIDIAKhQaiPCCsDACICIAJEAAAAAAAA8D+go6KgIgI5AwBBwI8IQcjKBisDACIEQaDJBisDACIFIAShQbiPCCsDACIEIAREAAAAAAAA8D+go6KgIgQ5AwBByI8IIAIgA6MgBCAFo6BEAAAAAAAA4D+iIgI5AwBB0I8IQYCOCCsDAEGojggrAwBB0I4IKwMAIAAgASACoKCgoKAiADkDAEHYjwhB2I0IKwMAIACgIgE5AwBB6I8IQeCPCCsDAES3zyozpfXsP6AiADkDAEHwjwggADkDAEH4jwhEAAAAAAAA8D8gAKE5AwBBgJAIQYjfBisDACIAOQMAQYiQCEQAAAAAAADwPyAAoTkDAEHgjAgrAwBBsJwGKwMAoyECQbDbBisDACEDA0BEAAAAAAAAAAAhAEEAIREDQEEAIQ4DQCAAIA9BA3QiECARQdACbEGQhwhqIA5BAnRBoAlqKAIAQQR0amorAwCgIQAgDkEBaiIOQQpHDQALIBFBAWoiEUECRw0ACyAQQYCQCGorAwAhBCAQQfCPCGorAwAhBSAQQYCNCGorAwAgAqIgEEHAjAhqKwMAIgYQCyEHIBBBkJAIaiAARAAAAAAAAPA/IAahEAsgByABIAUgBCADoqKioqI5AwAgD0EBaiIPQQJHDQALQQAhDkGgkAhBkJAIKwMARAAAAAAAAAAAoEGYkAgrAwCgIgA5AwBBqJAIIABB8NwHKwMAokGw2wcrAwCiIgA5AwBBsJAIIABBoNsHKwMAoyIAOQMAQaCgDCAAQej/BSsDAKM5AwBBwM8MQdj/BSsDAEQZOKClK1jvP6JEGTigpStY77+gRAAAAAAAgFNAo0QAAAAAAJifQEQAAAAAAGigQBAKRBk4oKUrWO8/oCIAOQMAQcjPDCAAQaCgDCsDAEHYywcrAwAQC6I5AwBB0M8MQYD9BSsDAESamZmZmVGEwKBEAAAAAACAU0CjRAAAAAAAmJ9ARAAAAAAAaKBAEApEmpmZmZlRhECgIgA5AwBBoNsHKwMAQdjWBSsDAKJBiNIHKwMAoiEBA0AgDkEDdCIPQeDPDGogD0GwvgxqKwMAIAGjOQMAIA5BAWoiDkEIRw0AC0EAIQ9BoNAMQZjQDCsDACAAoyIAOQMAQajQDEHguAUoAgAgABAJIgA5AwBBsNAMIABBkOkGKwMAokHIzwwrAwAiAaIiAjkDAEG40AwgASAAQZjpBisDAKKiIgA5AwBByNAMIABB0L8MKwMAIgCjOQMAQcDQDCACIACjIgE5AwBB0NAMIABB0LgFKAIAIAEQCaI5AwBB2NAMQdC/DCsDAEHQuAUoAgBByNAMKwMAEAmiOQMAA0AgD0EDdEHQ0AxqKwMAIQBBACEOA0AgDkEDdCIQIA9BqAFsIhFB4NAMamogACARQfCCBmogEGorAwCiOQMAIA5BAWoiDkEVRw0ACyAPQQFqIg9BAkcNAAtBACEPA0BBACEOA0AgDkEDdCIQIA9BqAFsIhFBsNMMamogEUHg0AxqIBBqKwMAIBFB8MwMaiAQaisDAKM5AwAgDkEBaiIOQRVHDQALIA9BAWoiD0ECRw0AC0EAIQ9ByOcHKwMAIQADQEEAIRADQCAQQQN0Ig4gD0GoAWwiEUGA1gxqaiARQfDsB2ogDmorAwAgACARQaDiB2ogDmorAwCioDkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhEANAIBBBA3QiDiAPQagBbCIRQdDYDGpqIBFBwNgHaiAOaisDACARQYDWDGogDmorAwChOQMAIBBBAWoiEEEVRw0ACyAPQQFqIg9BAkcNAAtBACEPQaDbDEH4lgcrAwBB2KMMKwMAoCIAOQMAA0BBACEQA0AgEEEDdCIOIA9BqAFsIhFBsNsMamogACARQZDJBWogDmorAwCiOQMAIBBBAWoiEEEVRw0ACyAPQQFqIg9BAkcNAAtBACEQA0AgEEEDdCIOQYDeDGogDkGgqAdqKwMAIA5BsNsMaisDAKE5AwAgEEEBaiIQQRVHDQALQQAhEANAIBBBA3QiDkGo3wxqIA5ByKkHaisDACAOQdjcDGorAwChOQMAIBBBAWoiEEEVRw0AC0EAIQ8DQEEAIREDQCARQQN0Ig4gD0GoAWwiEEHQ4AxqakQAAAAAAADwPyAQQYDWDGogDmorAwAgEEGw2wxqIA5qKwMAIgCiIAAgAKAgEEGA3gxqIA5qKwMAoCAQQdDYDGogDmorAwCioCAQQcDYB2ogDmorAwAgEEGgqAdqIA5qKwMAoqOhOQMAIBFBAWoiEUEVRw0ACyAPQQFqIg9BAkcNAAtBACEPA0BBACERA0AgEUEDdCIOIA9BqAFsIhBBoOMMampEAAAAAAAA8D8gEEHQ2AxqIA5qKwMAIBBBgN4MaiAOaisDACIAoiAAIACgIBBBsNsMaiAOaisDAKAgEEGA1gxqIA5qKwMAoqAgEEHA2AdqIA5qKwMAIBBBoKgHaiAOaisDAKKjoTkDACARQQFqIhFBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhEANAIBBBA3QiDiAPQagBbCIRQaDjDGpqKwMAIgBEAAAAAAAAAABkRQRAIBFB0OAMaiAOaisDACEACyARQfDlDGogDmogADkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhEANAIBBBA3QiDiAPQagBbCIRQcDoDGpqQdi4BSgCACARQfDlDGogDmorAwBEAAAAAAAA8D+gRAAAAAAAAOA/ohAJRM07f2aeoPY/ojkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhD0GwkAgrAwAhAANAQQAhEANAIBBBA3QiDiAPQagBbCIRQZDrDGpqIAAgEUGQ4AZqIA5qKwMAojkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhEANAIBBBA3QiDiAPQagBbCIRQcDoDGpqKwMAIQAgEUHg7QxqIA5qIBFBkOsMaiAOaisDABAPIAAgAKJEAAAAAAAA4L+ioDkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhD0Gw8AxBqNUFKwMAQdjWBSsDAKIiADkDACAAEA8hAANAQQAhEANAIBBBA3QiDiAPQagBbCIRQcDwDGpqIAAgEUHg7QxqIA5qKwMAoTkDACAQQQFqIhBBFUcNAAsgD0EBaiIPQQJHDQALQQAhDwNAQQAhEANAAnxEAAAAAAAA4D8gEEEDdCIOIA9BqAFsIhFBwOgMamorAwAiAEQAAAAAAAAAAGENABpBzLkFKAIAIRIgEUHA8AxqIA5qKwMAIgFEAAAAAAAAAABjBEBEAAAAAAAA8D8gEiABmiAAoxAJoQwBCyASIAEgAKMQCQshACARQZDzDGogDmogAEGwugUrAwAiAKI5AwAgEEEBaiIQQRVHDQALIA9BAWoiD0ECRw0AC0EAIQ8DQEEAIRADQCAQQQN0Ig4gD0GoAWwiEUHg9QxqaiAAIBFBkPMMaiAOaisDAKEgAKM5AwAgEEEBaiIQQRVHDQALIA9BAWoiD0ECRw0AC0EAIRADQCAQQagBbCIOQbD4DGogDkHgrQxqQagBEA0gEEEBaiIQQQJHDQALQQAhDwNAQQAhEQNAIBFBA3QiDiAPQagBbCIQQYD7DGpqIBBBsPgMaiAOaisDACAQQeD1DGogDmorAwCiIBBBsNMMaiAOaisDAKIgEEHQyAdqIA5qKwMAojkDACARQQFqIhFBFUcNAAsgD0EBaiIPQQJHDQALQQAhEANAIBBBqAFsIg5B0P0MaiAOQYD7DGpBqAEQDSAQQQFqIhBBAkcNAAtBACEPA0BBACEQA0AgEEEDdCIOIA9BqAFsIhFBoIANamogEUGgygxqIA5qKwMAIBFB0McMaiAOaisDAKI5AwAgEEEBaiIQQRVHDQALIA9BAWoiD0ECRw0AC0EAIRBBoLkGKwMAIQBBASEOQQEhD0EAIREDQCARQagBbCIRQfCCDWogEUGgygxqKwOgASAAoiARQaCADWorA5gBIBFBgMUMaisDmAGioDkDmAEgD0EBcSESQQAhD0EBIREgEg0ACwNAIBBBqAFsIg9B8IINaiAPQaDKDGorA5gBIACiIA9BoIANaisDkAEgD0GAxQxqKwOQAaKgOQOQAUEBIRAgDiEPQQAhDiAPDQALA0AgDkGoAWwiDkHwgg1qIA5BoMoMaisDkAEgAKIgDkGggA1qKwOIASAOQYDFDGorA4gBoqA5A4gBQQEhDiAQQQFxIQ9BACEQIA8NAAsDQCAQQagBbCIPQfCCDWogD0GgygxqKwOIASAAoiAPQaCADWorA4ABIA9BgMUMaisDgAGioDkDgAFBASEQIA4hD0EAIQ4gDw0ACwNAIA5BqAFsIg5B8IINaiAOQaDKDGorA4ABIACiIA5BoIANaisDeCAOQYDFDGorA3iioDkDeEEBIQ4gEEEBcSEPQQAhECAPDQALA0AgEEGoAWwiD0Hwgg1qIA9BoMoMaisDeCAAoiAPQaCADWorA3AgD0GAxQxqKwNwoqA5A3BBASEQIA4hD0EAIQ4gDw0ACwNAIA5BqAFsIg5B8IINaiAOQaDKDGorA3AgAKIgDkGggA1qKwNoIA5BgMUMaisDaKKgOQNoQQEhDiAQQQFxIQ9BACEQIA8NAAsDQCAQQagBbCIPQfCCDWogD0GgygxqKwNoIACiIA9BoIANaisDYCAPQYDFDGorA2CioDkDYEEBIRAgDiEPQQAhDiAPDQALA0AgDkGoAWwiDkHwgg1qIA5BoMoMaisDECAAoiAOQaCADWorAwggDkGAxQxqKwMIoqA5AwhBASEOIBBBAXEhD0EAIRAgDw0ACwNAIBBBqAFsIg9B8IINaiAPQaDKDGorA2AgAKIgD0GggA1qKwNYIA9BgMUMaisDWKKgOQNYQQEhECAOIQ9BACEOIA8NAAtBACEPQQAhEEGguQYrAwAhAEEBIQ4DQCAPQagBbCIPQfCCDWogD0GgygxqKwNYIACiIA9BoIANaisDUCAPQYDFDGorA1CioDkDUCARQQFxIRJBACERQQEhDyASDQALA0AgEEGoAWwiD0Hwgg1qIA9BoMoMaisDUCAAoiAPQaCADWorA0ggD0GAxQxqKwNIoqA5A0hBASEQIA4hD0EAIQ4gDw0ACwNAIA5BqAFsIg5B8IINaiAOQaDKDGorA0ggAKIgDkGggA1qKwNAIA5BgMUMaisDQKKgOQNAQQEhDiAQQQFxIQ9BACEQIA8NAAsDQCAQQagBbCIPQfCCDWogD0GgygxqKwNAIACiIA9BoIANaisDOCAPQYDFDGorAziioDkDOEEBIRAgDiEPQQAhDiAPDQALA0AgDkGoAWwiDkHwgg1qIA5BoMoMaisDOCAAoiAOQaCADWorAzAgDkGAxQxqKwMwoqA5AzBBASEOIBBBAXEhD0EAIRAgDw0ACwNAIBBBqAFsIg9B8IINaiAPQaDKDGorAzAgAKIgD0GggA1qKwMoIA9BgMUMaisDKKKgOQMoQQEhECAOIQ9BACEOIA8NAAsDQCAOQagBbCIOQfCCDWogDkGgygxqKwMoIACiIA5BoIANaisDICAOQYDFDGorAyCioDkDIEEBIQ4gEEEBcSEPQQAhECAPDQALA0AgEEGoAWwiD0Hwgg1qIA9BoMoMaisDICAAoiAPQaCADWorAxggD0GAxQxqKwMYoqA5AxhBASEQIA4hD0EAIQ4gDw0ACwNAIA5BqAFsIg5B8IINaiAOQaDKDGorAxggAKIgDkGggA1qKwMQIA5BgMUMaisDEKKgOQMQQQEhDiAQQQFxIQ9BACEQIA8NAAtBkIQNQcCBDSsDAEGgxgwrAwCiOQMAQbiFDUHogg0rAwBByMcMKwMAojkDAANAIBBBqAFsIg9B8IINaiAPQaDKDGorAwggAKIgD0GggA1qKwMAIA9BgMUMaisDAKKgOQMAIA4hD0EAIQ5BASEQIA8NAAsDQEEAIRADQCAQQQN0Ig4gEUGoAWwiD0HAhQ1qaiAPQfCCDWogDmorAwAgD0HQ/QxqIA5qKwMAojkDACAQQQFqIhBBFUcNAAsgEUEBaiIRQQJHDQALQbCJDUHghg0rAwAiADkDAEHYig1BiIgNKwMAIgE5AwBBqIkNIABB2IYNKwMAoCIAOQMAQdCKDSABQYCIDSsDAKAiATkDAEGgiQ1B0IYNKwMAIACgIgA5AwBByIoNQfiHDSsDACABoCIBOQMAQZiJDUHIhg0rAwAgAKAiADkDAEHAig1B8IcNKwMAIAGgIgE5AwBBkIkNQcCGDSsDACAAoCIAOQMAQbiKDUHohw0rAwAgAaAiATkDAEGIiQ1BuIYNKwMAIACgIgA5AwBBsIoNQeCHDSsDACABoCIBOQMAQYCJDUGwhg0rAwAgAKAiADkDAEGoig1B2IcNKwMAIAGgIgE5AwBB+IgNQaiGDSsDACAAoCIAOQMAQaCKDUHQhw0rAwAgAaAiATkDAEHwiA1BoIYNKwMAIACgIgA5AwBBmIoNQciHDSsDACABoCIBOQMAQeiIDUGYhg0rAwAgAKAiADkDAEGQig1BwIcNKwMAIAGgIgE5AwBB4IgNQZCGDSsDACAAoCIAOQMAQYiKDUG4hw0rAwAgAaAiATkDAEHYiA1BiIYNKwMAIACgIgA5AwBBgIoNQbCHDSsDACABoCIBOQMAQdCIDUGAhg0rAwAgAKAiADkDAEH4iQ1BqIcNKwMAIAGgIgE5AwBByIgNQfiFDSsDACAAoCIAOQMAQfCJDUGghw0rAwAgAaAiATkDAEHAiA1B8IUNKwMAIACgIgA5AwBB6IkNQZiHDSsDACABoCIBOQMAQbiIDUHohQ0rAwAgAKAiADkDAEHgiQ1BkIcNKwMAIAGgIgE5AwBBsIgNQeCFDSsDACAAoCIAOQMAQdiJDUGIhw0rAwAgAaAiATkDAEGoiA1B2IUNKwMAIACgOQMAQdCJDUGAhw0rAwAgAaA5AwBBACEOQaCIDUHQhQ0rAwBBqIgNKwMAoCIAOQMAQciJDUH4hg0rAwBB0IkNKwMAoCIBOQMAQZiIDUHIhQ0rAwAgAKAiADkDAEHAiQ1B8IYNKwMAIAGgIgE5AwBBkIgNQcCFDSsDACAAoDkDAEG4iQ1B6IYNKwMAIAGgOQMAA0BBACEPA0AgD0EDdCIQIA5BqAFsIhFB4IoNamogEUGQiA1qIBBqKwMAIBFBoMoMaiAQaisDABASOQMAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtBsI0NRAAAAAAAAPA/RAAAAAAAACTAQbDfBSsDACIAQaikBysDACICoaNB4P8NKwMAIgEgACACoEQAAAAAAADgv6KgohAIRAAAAAAAAPA/oKMiADkDAEG4jQ1B6M8FKwMAQdjMBSsDACAAoqAiADkDAEHAjQ0gACAAIACiRAAAAAAAAPA/oJ+jIgA5AwBBACEOQciNDQJ8QdDfBSsDACIDQcikBysDACICoSIERAAAAAAAAAAAZARARAAAAAAAAPA/RAAAAAAAACTAIASjIAEgAyACoEQAAAAAAADgv6KgohAIRAAAAAAAAPA/oKMMAQtEAAAAAAAA8D9EAAAAAAAAAAAgAUGgpQcrAwBEAAAAAAAA4D+ioCACZBsLIgE5AwBB0I0NQZDQBSsDACICIAEgAkHIowcrAwBEAAAAAAAA8L+goqKgIgE5AwBB2I0NIAEgACAAokQAAAAAAAAAwEHA3QYrAwCjokQAAAAAAADwP6CfozkDAEQAAAAAAAAAACEAA0BBACEPA0AgACAPQQN0IhAgDkGoAWwiEUHQ1wVqaisDACARQcDYB2ogEGorAwCioCEAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtB4I0NIAA5AwBBoI4NQaCmCysDACIAOQMAQeCODSAAOQMAQZCODUGQpgsrAwAiADkDAEHQjg0gADkDAEGojg1BqKYLKwMAIgA5AwBB6I4NIAA5AwBB6I0NQejiBisDAEGwugUrAwAiAKMiATkDAEHwjQ1B8KULKwMAIABBkJ0IKwMAoaIgAKMiAjkDAEGwjg1BsKYLKwMAIAKgIgI5AwBBmI4NQZimCysDACIDOQMAQdiODSADOQMAQYiODUGIpgsrAwAgAEGonQgrAwChoiAAoyIDOQMAQciODUHIpgsrAwAgA6A5AwBBgI4NQYCmCysDACAAQaCdCCsDAKGiIACjIgM5AwBBwI4NQcCmCysDACADoDkDAEH4jQ1B+KULKwMAIABBmJ0IKwMAoaIgAKMiAzkDAEG4jg1BuKYLKwMAIAOgOQMAQfCODSABIAJBoLMLKwMAIgKiQcDnBisDAEHAtAsrAwChoqI5AwBBASEOA0AgDkEDdCIPQfCODWogASAPQbCODWorAwAgAqIgD0HA5wZqKwMAIA9BwLQLaisDAKGiojkDACAOQQFqIg5BCEcNAAtBsI8NQeDiBisDACAAozkDAEEAIQ5BACEPQbCPDSsDACEAQaCzCysDACEBA0AgDkEDdCIQQcCPDWogACAQQbCODWorAwAgAaIgEEHQ5gZqKwMAIBBB4LILaisDAKGiojkDACAOQQFqIg5BCEcNAAsDQCAPQQN0Ig5BgJANaiAOQcCPDWorAwAgDkHwjg1qKwMAoDkDACAPQQFqIg9BCEcNAAtBACEPA0BEAAAAAAAAAAAhAEEAIQ4DQCAAIA9BKGxB0OMGaiAOQQN0aisDAKAhACAOQQFqIg5BBUcNAAsgD0EDdCIOQcCQDWogACAOQbCODWorAwCiOQMAIA9BAWoiD0EIRw0AC0EAIQ4DQCAOQQN0Ig9BgJENaiAPQYC7DGorAwAgD0HAnAhqKwMAojkDACAOQQFqIg5BCEcNAAtBACEPA0AgD0EDdCIOQcCRDWogDkGAkQ1qKwMAIA5BwJANaisDAKEgDkGAkA1qKwMAoDkDACAPQQFqIg9BCEcNAAtEAAAAAAAAAAAhAEEAIQ4DQCAAIA5BA3RBwJENaisDAKAhACAOQQFqIg5BCEcNAAtBACEPQYCSDSAAOQMAQYiSDSAAQeCNDSsDAKNB2NYFKwMAo0GI0gcrAwCjIgA5AwADQEEAIQ4DQCAOQQN0IhAgD0GoAWwiEUGQkg1qaiAAIBFB0NcFaiAQaisDAKI5AwAgDkEBaiIOQRVHDQALIA9BAWoiD0ECRw0AC0EAIQ9B8JsHKwMAIQADQEEAIQ4DQCAOQQN0IhAgD0GoAWwiEUHglA1qaiARQZCSDWogEGorAwAgAKI5AwAgDkEBaiIOQRVHDQALIA9BAWoiD0ECRw0AC0EAIQ4DQCAOQagBbCIPQbCXDWogD0HglA1qQagBEA0gDkEBaiIOQQJHDQALQQAhD0HYjQ0rAwBBwI0NKwMAokQAAAAAAAAAQEHA3QYrAwCjn6IhAANAQQAhDgNAIA5BA3QiECAPQagBbCIRQYCaDWpqIBFBsJcNaiAQaisDABAPIAChOQMAIA5BAWoiDkEVRw0ACyAPQQFqIg9BAkcNAAtBsMEIQbC6BSsDACIARLdt27Zt2/Y/ojkDAEHQwAggAERyHMdxHMcBQKI5AwBB8MAIIABEF1100UUX/T+iOQMAQcDACCAARKuqqqqqqvo/ojkDAEHYnA1BqP8LKwMAQbjIBysDAKM5AwBB2PwLQaD8CysDACIBQcDOBSsDAKIiAkH40QcrAwCiIgA5AwBB0JwNQZjbBSsDAEQAAAAAAAAUwKBEAAAAAAAAFECgRAAAAAAAABRAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCIDRAAAAAAAkJ9AZCIOGzkDAEHQ/AtEMzMzMzMz0z9EAAAAAAAAAAAgA0QAAAAAAECfQGQbIgM5AwBB4PwLIABBsMgHKwMAoyIEOQMAQcj8C0Hw5wUrAwBBgNIHKwMAIgCjOQMAQeCcDSABQZDIBysDAKM5AwBBsPwLQcCVCCsDAEGAmAgrAwCjIgE5AwBB6PwLIAQgA5oQCyIDOQMAQbj8CyABQcCYCCsDAKIiATkDAEHw/AsgA0GA6AYrAwCiIgM5AwBBiP0LQcCfBisDACIEQYj+BSsDACAEoUQAAAAAAAAAACAOG6A5AwBB+PwLIAMgAKM5AwBBqPwLIAAgAkH4jQgrAwCiQeCaBisDAKKiIgA5AwBB0P0LIAAgARAGOQMAQcD8C0G4/AsrAwBBqPwLKwMAo0G4owcrAwAQCyIAOQMAQZD9C0QAAAAAAADwP0GI/QsrAwChEA9E7zn6/kIu5j+jIgE5AwBBgP0LQZi5BisDACICIAJEAAAAAAAA8D+gQZDIBysDABALIgKiIAJEAAAAAAAA8L+goyICOQMAQZj9C0Hg/AsrAwAgARALIgE5AwBBoP0LIAFBqJ8GKwMAoiIBOQMAQaj9CyACIAGiQeCaBisDAEH4jQgrAwCioyIBOQMAQbD9CyABQYDSBysDAKMiATkDAEG4/QsgAUH4/AsrAwCgQcj8CysDAKAiATkDAEHA/QsgAUGo1wUrAwBEAAAAAAAA8D+goiIBOQMAQcj9CyAAIAGiOQMAQeCQCEHQ3wYrAwAiAEGw3wYrAwAiAaAiAjkDAEHokAggADkDAEHwkAhB2OcFKwMAQYijBisDACIDoSABoyIBOQMAQaDYBysDACEEIAEgACACEAohAUGQ2AdB2N8GKwMAIgA5AwBBgJEIIAMgBCABoqAiATkDAEH4kAggATkDAEGI2AcgAEG43wYrAwAiAqAiAzkDAEGY2AdB4OcFKwMAQZCjBisDACIEoSACoyICOQMAQYiRCEGIygYrAwAiBSABIAWhQcCQCCsDACIBIAFBuOYGKwMAoKOioCIBOQMAQZCRCCABOQMAQaDYBysDACEBIAIgACADEAohAEHYkAhB0JAIKwMAIgI5AwBBsNgHIAQgASAAoqAiADkDAEGo2AcgADkDAEHIkAhBgMoGKwMAIgEgACABoUHAkAgrAwAiACAAQajmBisDAKCjoqAiADkDAEGYkQggAiAAoiIAOQMAQdiRCEHQkQgrAwAgAKBBkJEIKwMAoCIAOQMAQeCRCCAAQfDRBisDAEHwxwcrAwCgoiIAOQMAQeicDSAAQdCZCCsDAKFB8M0FKwMAozkDAEHwnA1B4N8GKwMAIgBBwN8GKwMAoDkDAEH4nA0gADkDAEGAnQ1B6OcFKwMAQZijBisDACIAoZlBwN8GKwMAoyIBOQMAQZCdDSAAQaDYBysDACABQficDSsDAEHwnA0rAwAQCqKgIgA5AwBBiJ0NIAA5AwBBmJ0NIABByJwMKwMAoiIAOQMAQcCdDUHQkQgrAwBB4JkIKwMAokQAAAAAAADwP0GQ5QUrAwChoiIBOQMAQaCdDUQAAAAAAAAAQEHYmQgrAwAiAkGQkQgrAwAiA6NB8KIGKwMAmqIQCEQAAAAAAADwP6CjRAAAAAAAAPC/oCIEOQMAQbCdDUQAAAAAAAAAQCACQZiRCCsDACICo0G42gUrAwCaohAIRAAAAAAAAPA/oKNEAAAAAAAA8L+gIgU5AwBBqJ0NIAMgBKIiAzkDAEG4nQ0gAiAFoiICOQMAQcidDSADIAEgAqCgIAChIgA5AwBB0J0NQeicDSsDACAAoEQAAAAAAAAAABAHIgA5AwBBuLoLQfjfBisDADkDAEGQ7QtB6N8GKwMAOQMAQfCdDUGw3AUrAwBEAAAAAAAA8L+gRAAAAAAAAPA/oEQAAAAAAADwP0Hg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiAUQAAAAAAJCfQGQiDhsiAjkDAEHonQ1B0JwNKwMAIgNBwNwFKwMAIAOhRAAAAAAAAAAAIAFBsJ8HKwMARAAAAAAAkJ9AoGQiDxugIgE5AwBB2J0NRAAAAAAAAABAQeCZDCsDACAAo0H4xwcrAwCaohAIRAAAAAAAAPA/oKNEAAAAAAAA8L+gIgM5AwBB4J0NIAAgA6I5AwBB+J0NQZDbBSsDAEQAAAAAAAD0v6BEAAAAAAAA9D+gRAAAAAAAAPQ/IA4bIgA5AwBBgJ4NIABBuNwFKwMAIAChRAAAAAAAAAAAIA8boCIAOQMAQYieDSAAQfCZCCsDACABoSACmqIQCEQAAAAAAADwP6CjIgA5AwBBkJ4NQejXBisDACAAoiIAOQMAQZieDUGg2wcrAwAgAKI5AwBB2PkLQZi5BisDACIAIABEAAAAAAAA8D+gQeijBysDABALIgCiIABEAAAAAAAA8L+gozkDAEGY8AtByNMFKwMAQdjTBSsDAEHA0wUrAwAQCjkDAEHYnQxB0J0MKwMAIgA5AwBB4J0MIAA5AwBBuJ4MQbCeDCsDACIBOQMAQcCeDCABOQMAQYCeDEGQtgsrAwAgAKM5AwBB8J0MQYC2CysDACABozkDAEQAAAAAAAAAACEAQQAhDkEAIQ9ByJ4MQfCdDCsDAEGAngwrAwCgIgE5AwBB4KMMQaiRCCsDAEHQ3QYrAwCiIgI5AwADQCAAIA5BAnRBkAlqKAIAQQN0QdC4C2orAwCgIQAgDkEBaiIOQQRHDQALQQAhDkHoowwgAiAAoEG4uQsrAwCgIgA5AwBB8KMMIAEgAKAiADkDAEGgng0gAEGopAwrAwAiAKFBoKQMKwMAIACZohASOQMAQbC8C0GovAsrAwBBkLwLKwMAIgOgIgA5AwBBgPcLIABB+PYLKwMAoDkDAEGI0gcrAwAhBEHY1gUrAwAhAUGg2wcrAwAhAgNAIA9BA3QiEEGwng1qIBBBgJENaisDACACoyABoyAEozkDACAPQQFqIg9BCEcNAAsDQCAOQQN0Ig9B8J4NaiAPQYDYBmorAwAgD0Gwng1qKwMAojkDACAOQQFqIg5BCEcNAAtBACEOA0AgDkEDdCIPQbCfDWogD0HA2AZqKwMAIA9BsJ4NaisDAKI5AwAgDkEBaiIOQQhHDQALQQAhDwNAQQAhDgNAIA5BA3QiECAPQQZ0IhFB8J8NamogEUHwng1qIBBqKwMAIAGiIAKiOQMAIA5BAWoiDkEIRw0ACyAPQQFqIg9BAkcNAAtB4LwLQdi8CysDAEQAAAAAAAAkQKAiATkDAEHwoA1B4NwFKwMAQfjbBysDAKJEAAAAAAAA8D+gIgI5AwBBuLwLIABBsI8IKwMAoiADoSIAOQMAQfC8CyABQei8CysDAKAiATkDAEH4oA1BiNAFKwMAIAKiOQMAQcC8CyAAQdDXBisDAKMiADkDAEH4vAsgAUHQvAsrAwCiIgE5AwBBgL0LIAFByLwLKwMAokHA0gcrAwCjIgE5AwBBiL0LIAEgABAGIgA5AwBBmLwLQfiXCCsDAEGAmAgrAwCjIgE5AwBBoLwLIAFBwJgIKwMAoiIBOQMAQZC9CyABIAAQBiIAOQMAQZi9CyAAOQMAQYChDSAAQdDWBisDAKI5AwBB2L0LQdC9CysDAEG4vQsrAwAiAKAiATkDAEHgvQsgAUHgjggrAwCiIAChIgA5AwBB6L0LIABByNcGKwMAozkDAEGIvgtBgL4LKwMARDMzMzMzM9M/oCIAOQMAQZi+CyAAQZC+CysDAKA5AwBBoL4LQZi+CysDAEH4vQsrAwCiIgA5AwBBwL0LQbCXCCsDAEGAmAgrAwAiAaMiAjkDAEHIvQsgAkHAmAgrAwAiAqIiAzkDAEGovgsgAEHwvQsrAwCiQcDSBysDACIEoyIAOQMAQbC+CyAAQei9CysDABAGIgA5AwBBuL4LIAMgABAGIgA5AwBBwL4LIAA5AwBBiKENIABByNYGKwMAoiIDOQMAQYC/C0H4vgsrAwBB4L4LKwMAIgCgIgU5AwBBiL8LIAVBiI8IKwMAoiAAoSIAOQMAQZC/CyAAQaDXBisDAKMiADkDAEGwvwtBqL8LKwMARAAAAAAAACRAoCIFOQMAQcC/CyAFQbi/CysDAKAiBTkDAEHIvwsgBUGgvwsrAwCiIgU5AwBB0L8LIAVBmL8LKwMAoiAEoyIEOQMAQdi/CyAEIAAQBiIAOQMAQei+C0HolggrAwAgAaMiATkDAEHwvgsgAiABoiIBOQMAQeC/CyABIAAQBiIAOQMAQei/CyAAOQMAQZChDSAAQcDWBisDAKIiADkDAEGYoQ0gAyAAoEGAoQ0rAwCgIgA5AwBBoKENRDMzMzMzM8M/QYDYBysDAKEiATkDAEHg/w0rAwBBuNYGKwMAoSABmqIQCCEBQaihDUGw1gYrAwAgAUQAAAAAAADwP6CjIgE5AwBBsKENQaiQCCsDAEGg3wUrAwCiRAAAAAAAAPA/IAGhoiIBOQMAQbihDSAAIAGgOQMAQcChDUGokQgrAwBBwJsGKwMAoyIAOQMAQcihDSAAQZDRBSsDAKIiADkDAEHQoQ0gAEH43gUrAwCiIgA5AwBB2KENIAA5AwBBACEOQeChDUSamZmZmZm5P0H41wcrAwChIgA5AwBB8KENQaCsBysDAEHgvAwrAwBB8LwMKwMAoKIiATkDAEH4oQ1BmKwHKwMAQei8DCsDAEH4vAwrAwCgoiICOQMAQYCiDSABIAKgIgM5AwBB4P8NKwMAIgRBqNYGKwMAoSAAmqIQCCEAQeihDUGg1gYrAwAgAEQAAAAAAADwP6CjIgA5AwBBiKINRAAAAAAAAPA/IAChIgUgA0HQxQUrAwAiA0GIuwUrAwCioqIiBjkDAEHAog1B8LoMKwMAQZDGBSsDAKI5AwBBsKINQeC6DCsDAEGAxgUrAwCiOQMAQciiDUH4ugwrAwBBmMYFKwMAojkDAEG4og1B6LoMKwMAQYjGBSsDAKI5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3QiD0GQog1qKwMAIA9BwP0FaisDAKKgIQAgDkEBaiIOQQRHDQALQQAhDkHQog0gADkDAEHYog0gAEGA3wUrAwCiIgc5AwBB4KINQeCbBysDAES4HoXrUbjOv6BEuB6F61G4zj+gRLgehetRuM4/IARBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg8bIgA5AwBB8KINQdibBysDAET2KFyPwvXov6BE9ihcj8L16D+gRPYoXI/C9eg/IA8bIgQ5AwBBkKMNQYCbBysDAESamZmZmZnpv6BEmpmZmZmZ6T+gRJqZmZmZmek/IA8bIgg5AwBB6KINIAEgAKIiADkDAEH4og0gAiAEoiIBOQMAQYCjDSAAIAGgIgE5AwBBiKMNQZDfBSsDAEGwtgwrAwAiAkHwzAcrAwCiIAFB6MwHKwMAoqCiIgQ5AwBBmKMNQZD/CysDACAIoiIAOQMAQaCjDSAAQYjfBSsDAKIiCDkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdCIPQZCiDWorAwAgD0GglwdqKwMAoqAhACAOQQFqIg5BBEcNAAtBqKMNIAA5AwBBsKMNIAIgAaAgAKBB8N4FKwMAoiIAOQMAQeCjDUGA0AUrAwBB8NsFKwMAQZCoBysDAKNBiP8LKwMAoqAiATkDAEG4ow0gBSADIAQgCCAAoKCioiIAOQMAQcCjDUHY1gYrAwAgBiAHIACgoKAiADkDAEHIow1B2KENKwMAIACgIgA5AwBB0KMNQbihDSsDACAAoCIAOQMAQdijDUH4oA0rAwAgAKA5AwBB6KMNQeDWBisDACABQejWBisDAKMQCKI5AwBB8KMNQeijDSsDAEH4zwUrAwCiIgA5AwBB+KMNIAA5AwBBgKQNQYj/CysDACAAozkDAEGQpA1BoP8LKwMAQYCeBisDAKFBuNoGKwMAoiIAOQMAQYikDUH4ygYrAwBBgMsGKwMAQbCQCCsDAKJEAAAAAABAj0CjoCIBOQMAQZikDUGokQgrAwBBwJsGKwMAoUHI1QUrAwCiIgI5AwBBoKQNQei5CysDAEHQnQYrAwChQZD9BSsDAKIiAzkDAEGopA0gACACIAOgoJo5AwBBsKQNRDMzMzMzM8M/QfDXBysDAKEiADkDAEHg/w0rAwBBkNIFKwMAoSAAmqIQCCEAQbikDUGI0gUrAwAgAEQAAAAAAADwP6CjIgA5AwBBwKQNIAFBoNsHKwMAokHI0gcrAwCjQdjWBSsDAKIiATkDAEHIpA1EAAAAAAAA8D8gAKEgAUGY3wUrAwCioiIAOQMAQdCkDSAAQYC7BSsDAKIiADkDAEHYpA1B8NYGKwMAQbChDSsDAKIiATkDAEHgpA0gACABoDkDAEHQkwhB+MkGKwMAIgBB4MgGKwMAIAChQciTCCsDACIAIABEAAAAAAAA8D+go6KgIgA5AwBBgLwLQZjXBisDACIBOQMAQYi8CyABRAAAAAAAAPA/IAChIgCiIgE5AwBBoL0LQZi9CysDACABoiIBOQMAQai9C0GQ1wYrAwAiAjkDAEGwvQsgACACoiICOQMAQci+CyACQcC+CysDAKIiAjkDAEHQvgtBiNcGKwMAIgM5AwBB2L4LIAAgA6IiADkDAEHwvwsgAEHovwsrAwCiIgA5AwBB+L8LIAEgAiAAoKA5AwBB2P0LQdD9CysDACIAOQMAQeikDSAAQaDRBSsDAKI5AwBBwPkLQYiWCCsDAEGAmAgrAwCjIgA5AwBByPkLIABBwJgIKwMAojkDAEGo+QtBiMgHKwMAQeCaBisDAKIiADkDAEHYkwhEAAAAAAAA8D9B0JMIKwMAoUQAAAAA3BE3QaI5AwBBuPkLQYDSBysDAEGgjggrAwAgAEHgpAcrAwBBsPkLKwMAoqKioiIAOQMAQcj6CyAAQcj5CysDABAGIgA5AwBB0PoLIAA5AwBB8KQNIABBmNEFKwMAojkDAEHImAhBwJgIKwMAQYiYCCsDAKI5AwBByLkLQbi5CysDAEHAuQsrAwCjIgA5AwBBiLoLQYC6CysDAEHonQYrAwCjOQMAQdC5CyAAQfCaCCsDAKIiADkDAEHYuQsgAEHomggrAwCiOQMAQfC5C0GY/QUrAwBEAAAAAAAA4L+gRAAAAAAAAOA/oEQAAAAAAADgP0Hg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bIgA5AwBB+LkLIABB6LkLKwMAQeC5CysDAKFEAAAAAAAAAAAQB6I5AwBBkLoLQeDRBisDACIAQZDRBisDACAAoUGo2wcrAwBB8J4GKwMAo6KgOQMAQZi6C0Hw0AYrAwAiAEHQ0QYrAwAgAKFByJoIKwMARAAAAAAAAPC/oCIAIABBsN0FKwMAoKOioDkDAEGgugtBmNwFKwMARLN66gVdynK+oETBnXa+wCh4PqBEwZ12vsAoeD4gDhs5AwBBqLoLQajcBSsDAEQAAAAAAABJwKBEAAAAAAAASUCgRAAAAAAAAElAIA4bIgA5AwBBsLoLQfjfBisDACAAoCIBOQMAQcC6C0Gg3AUrAwBEAAAAAAAA+L+gRAAAAAAAAPg/oEQAAAAAAAD4PyAOGyICOQMAQci6CyACQbCjBisDACICoZkgAKMiADkDAEHYugsgAkGg2AcrAwAgAEG4ugsrAwAgARAKoqAiADkDAEHQugsgADkDAEHougtEAAAAAAAA8D9BuNQFKwMAQfjbBysDAEGw1AUrAwCjQajUBSsDABALoqEiATkDAEHgugsgAEQAAAAAAADwP0GwkAgrAwAiACAAQaC6CysDAJqiohAIoaJEAAAAAAAA8D+gIgA5AwBB8LoLQYi6CysDAEGQugsrAwBBmLoLKwMAIABBuNcGKwMAIAGioqKioiIAOQMAQfi6C0GA1wYrAwAgAKIiADkDAEGAuwsgAEH4uQsrAwCiRAAAAAAAAPA/QeDQBSsDAKGiIgA5AwBBiLsLQYiYCCsDAEGQywYrAwCiIgE5AwBBkLsLIAFBwJgIKwMAokGAmQgrAwCjIgE5AwBBmLsLIAEgAKM5AwBBoLsLQay5BSgCAEGYuwsrAwAQCTkDAEGouwtBsLkFKAIAQZi7CysDABAJIgA5AwBB2LsLQdC7CysDAEH4zQUrAwCiIgE5AwBBsLsLIABB+LoLKwMAokGguwsrAwCiIgA5AwBBuLsLQZC7CysDACAAQfi5CysDAKJEAAAAAAAA8D9B4NAFKwMAoaIQBiIAOQMAQcC7CyAAQdi5CysDAKAiADkDAEHIuwsgAEGAmQgrAwCiQciOCCsDAKIiADkDAEHguwsgASAAEAYiADkDAEHouwsgAEHImAgrAwAQBiIAOQMAQfC7CyAAOQMAQfi7CyAAQdiTCCsDAKIiATkDAEH4pA0gAUHwpA0rAwCgQeikDSsDAKAiATkDAEGApQ0gAUH4vwsrAwCgQdjSBSsDAKIiATkDAEGIpQ1EMzMzMzMzwz9B6NcHKwMAoSICOQMAQeD/DSsDAEHg0QUrAwChIAKaohAIIQJBkKUNQdjRBSsDACACRAAAAAAAAPA/oKMiAjkDAEGYpQ0gAEHo0QUrAwCiRAAAAAAAAPA/IAKhIgCiIgI5AwBBoKUNQZi9CysDAEGA0gUrAwCiIACiIgM5AwBBqKUNIABBwL4LKwMAQfjRBSsDAKKiIgQ5AwBBsKUNIABB6L8LKwMAQfDRBSsDAKKiIgA5AwBBuKUNIAIgAyAEIACgoKAiADkDAEHApQ1BoNIFKwMAIACiIgA5AwBByKUNQZihDSsDAEHw1gYrAwAiAqIiAzkDAEHQpQ0gASAAIAOgoDkDAEHYpQ0gAkHQoQ0rAwCiIgA5AwBB4KUNIAA5AwBB6KUNQcjeBSsDAEHIoQ0rAwAiAKIiATkDAEHwpQ0gAUGAuwUrAwCiIgE5AwBB+KUNIAE5AwBBgKYNIABB2N4FKwMAojkDAEGIpg1BwKENKwMAQeDeBSsDAKI5AwBBACEOQZCmDUHo3gUrAwBB6LkLKwMAIgCiIgE5AwBBmKYNIABB0J0GKwMAoyICOQMAQbimDUGIog0rAwBB8NYGKwMAIgCiIgM5AwBBoKYNRAAAAAAAAABAIAKhQcDeBSsDAKIiAjkDAEGopg0gASACoEGIpg0rAwCgQYCmDSsDAKAiATkDAEGwpg0gAUH4pQ0rAwCgQeClDSsDAKAiAjkDAEHApg0gAEG4ow0rAwCiIgE5AwBByKYNIABB2KINKwMAoiIAOQMAQdCmDSADIAEgAKCgIgM5AwBB2KYNRDMzMzMzM8M/QeDXBysDAKEiADkDAEHg/w0rAwBB0NEFKwMAoSAAmqIQCCEAQeCmDUHI0QUrAwAgAEQAAAAAAADwP6CjIgA5AwBB6KYNQcD+BSsDAEHougwrAwCiQajeBSsDAKJEAAAAAAAA8D8gAKEiBKIiADkDAEHwpg1BgLsFKwMAIgEgAKIiBTkDAEH4pg1BoP4GKwMAQdi7DCsDAKMiBjkDAEQAAAAAAAAAACEAA0AgACAGIA5BA3QiD0HA3QVqKwMAoiAPQcC6DGorAwCioCEAIA5BAWoiDkEERw0AC0GApw0gBCAAoiIAOQMAQYinDSABIACiIgA5AwBBkKcNQdCiDSsDAEHQ3gUrAwCiIgQ5AwBB+PMLQfDzCysDAEHYvQsrAwCgOQMAQbinDUGo1wYrAwBB0KIMKwMAoDkDAEHQ8AtByPALKwMAQYC/CysDAKA5AwBBmKcNIAEgBKIiATkDAEGgpw0gBSAAIAGgoCIAOQMAQainDSADIACgIgA5AwBBsKcNIAIgAKA5AwBBwKcNRAAAAAAAAPA/RAAAAAAAAPA/QdjcBSsDAEH42wcrAwCioaMiADkDAEHIpw1BuP8FKwMAQZiTCCsDACAAoqIiATkDAEHQpw0gAEGAkwgrAwCiQbD/BSsDAKIiADkDAEHYpw0gASAAoEGo0QUrAwCiOQMAQeCnDUG4pQ0rAwBByKQNKwMAoDkDAEHopw1B6KUNKwMAOQMAQZCoDUH4vwsrAwBB+KQNKwMAoEHY0gUrAwAiAaIiADkDAEHwpw1BkKcNKwMAQYCnDSsDAKBB6KYNKwMAoEGY0gUrAwCgIgI5AwBBmKgNIAAgAaMiATkDAEGgqA0gATkDAEH4pw0gAkHopw0rAwCgIgE5AwBBgKgNIAFB4KcNKwMAoCIBOQMAQYioDSABQdinDSsDAKA5AwBBsKgNQYClDSsDAEGopg0rAwAiAaA5AwBBuKgNIAFEAAAAAAAA8D9B2MUFKwMAoaMiATkDAEGoqA1B0KYNKwMAQdikDSsDAKBByKUNKwMAoEHgpQ0rAwCgOQMAQcioDUGgpw0rAwBB+KUNKwMAoEHApQ0rAwCgQdCkDSsDAKA5AwBBwKgNIABBwKMHKwMAIAGgoDkDAEGA4wtBoIEHKwMAQdDiCysDAKA5AwBBiOMLQaiBBysDAEHY4gsrAwCgOQMAQZjCCAJ8QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGRFBEBB8MIIQubMmbPmzJnzPzcDAEH4wghC5syZs+bMmfM/NwMAQejCCELmzJmz5syZ8z83AwBB4MIIQubMmbPmzJnzPzcDAEHYwghC5syZs+bMmfM/NwMAQdDCCELmzJmz5syZ8z83AwBByMIIQpqz5syZs+bwPzcDAEHAwghCmrPmzJmz5vA/NwMAQbjCCEKas+bMmbPm8D83AwBB6MEIQrPmzJmz5szxPzcDAEGwwghCmrPmzJmz5vA/NwMAQajCCEKas+bMmbPm8D83AwBEzczMzMzM3D8MAQtB+MIIRAAAAAAAAPA/QbDBCCsDAEGwugUrAwAiAaOjRGZmZmZmZua/oERmZmZmZmbmP6AiADkDAEHwwgggADkDAEHowgggADkDAEHgwgggADkDAEHYwgggADkDAEHQwgggADkDAEHIwghEAAAAAAAA8D9B8MAIKwMAIAGjo0SamZmZmZnhv6BEmpmZmZmZ4T+gIgA5AwBBwMIIIAA5AwBBuMIIIAA5AwBB6MEIRAAAAAAAAPA/QcDACCsDACABo6NEMzMzMzMz47+gRDMzMzMzM+M/oDkDAEGwwgggADkDAEGowgggADkDAEQAAAAAAADwP0HQwAgrAwAgAaOjRM3MzMzMzNy/oETNzMzMzMzcP6ALIgA5AwBBoMIIIAA5AwBBkMIIIAA5AwBBiMIIIAA5AwBBgMIIIAA5AwACfEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiAkQAAAAAAJCfQGRFBEBB8MEIQrPmzJmz5szxPzcDAEH4wQhCzZmz5syZs+4/NwMARDMzMzMzM+M/IQBEZmZmZmZm5j8MAQtB+MEIRAAAAAAAAPA/QdDACCsDAEGwugUrAwAiAaOjRM3MzMzMzNy/oETNzMzMzMzcP6A5AwBB8MEIRAAAAAAAAPA/QcDACCsDACABo6NEMzMzMzMz47+gRDMzMzMzM+M/oCIAOQMARAAAAAAAAPA/QbDBCCsDACABo6NEZmZmZmZm5r+gRGZmZmZmZuY/oAshAUHgwQggADkDAEGAwwggATkDAEGo2QhB4J0HKwMARAAAAAAAABTAoEQAAAAAAAAUQKBEAAAAAAAAFEAgAkQAAAAAAJCfQGQiDhsiADkDAEGg2QggADkDAEGY2QggADkDAEGQ2QggADkDAEGI2QggADkDAEGA2QggADkDAEH42AhBoJ0HKwMARAAAAAAAACDAoEQAAAAAAAAgQKBEAAAAAAAAIEAgDhsiATkDAEHw2AggATkDAEHo2AggATkDAEGY2AhB8JwHKwMARAAAAAAAABTAoEQAAAAAAAAUQKBEAAAAAAAAFEAgDhsiAjkDAEHg2AggATkDAEHY2AggATkDAEHQ2AhBgJ0HKwMARAAAAAAAACDAoEQAAAAAAAAgQKBEAAAAAAAAIEAgDhsiATkDAEHA2AggATkDAEHI2AggATkDAEG42AggATkDAEGw2AggATkDAEGo2AggATkDAEGg2AggAjkDAEGw2QggADkDAEGQ2AggAjkDAEHY2ghBkJoHKwMARDMzMzMzM/O/oEQzMzMzMzPzP6BEMzMzMzMz8z8gDhsiADkDAEHQ2gggADkDAEHI2gggADkDAEHA2gggADkDAEG42gggADkDAEEAIQ9BsNoIQZCaBysDAEQzMzMzMzPzv6BEMzMzMzMz8z+gRDMzMzMzM/M/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDhsiAjkDAEGo2ghB0JkHKwMARAAAAAAAAPi/oEQAAAAAAAD4P6BEAAAAAAAA+D8gDhsiADkDAEGg2gggADkDAEGY2gggADkDAEHI2QhBoJkHKwMARDMzMzMzM/O/oEQzMzMzMzPzP6BEMzMzMzMz8z8gDhsiATkDAEGQ2gggADkDAEGI2gggADkDAEGA2ghBsJkHKwMARAAAAAAAAPi/oEQAAAAAAAD4P6BEAAAAAAAA+D8gDhsiADkDAEH42QggADkDAEHw2QggADkDAEHo2QggADkDAEHg2QggADkDAEHQ2QggATkDAEHY2QggADkDAEHg2gggAjkDAEHA2QggATkDAANARAAAAAAAAAAAIQBBACEOA0AgACAPQQZ0QfCfDWogDkEDdGorAwCgIQAgDkEBaiIOQQhHDQALIA9BA3RB0KgNaiAAOQMAIA9BAWoiD0ECRw0AC0GQqQ1BsLoMKwMAQfC6BSsDAKJBkNIHKwMAIgGiQeDSBSsDACIAojkDAEGAqQ0gACABQaC6DCsDAEHgugUrAwCioqI5AwBB4KgNIAAgAUHgvAwrAwBBwLoFKwMAoqKiIgI5AwBBmKkNIAAgAUG4ugwrAwBB+LoFKwMAoqKiOQMAQYipDSAAIAFBqLoMKwMAQei6BSsDAKKiojkDAEH4qA0gACABQfi8DCsDAEHYugUrAwCioqI5AwBB8KgNIAAgAUHwvAwrAwBB0LoFKwMAoqKiOQMAQeioDSAAIAFB6LwMKwMAQci6BSsDAKKiojkDACACRAAAAAAAAAAAoCEAQQEhDgNAIAAgDkEDdEHgqA1qKwMAoCEAIA5BAWoiDkEIRw0AC0EAIQ5BoKkNIAA5AwBBqKkNIAAgAaNB0KgNKwMAo0H4zAcrAwCiQZjSBysDACIDojkDAEQAAAAAAAAAACECA0AgAiAOQQN0QbC+DGorAwCgIQIgDkEBaiIOQQhHDQALQbipDUGg/wsrAwBBgJ4GKwMAo0GQoAYrAwAQCzkDAEHAqQ1B6LkLKwMAQdCdBisDAKNB+J8GKwMAEAs5AwBBsKkNIAMgACACoyABo6JBiNIHKwMAojkDAEHIqQ1EAAAAAAAA8D9BqJEIKwMAQcCbBisDAKOjQfCfBisDABALIgA5AwBB2KkNQdCbBysDAEQzMzMzMzPTv6BEMzMzMzMz0z+gRDMzMzMzM9M/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDhsiATkDAEHQqQ0gAEHAqQ0rAwCiQbipDSsDAKIiADkDAEHgqQ1BsP8LKwMAIAGiIgE5AwBB6KkNQZijDSsDACABoCIBOQMAQbDQBSsDACECQajQBSsDACEDQbjQBSsDACEEQZiqDUGgwgsrAwBB4KMMKwMAoCIFOQMAQfCpDUQAAAAAAADwPyACIAEgBKMgAxALokQAAAAAAADwP6CjIgE5AwBBgKoNQbi7CysDAEQAAAAAAADwP0Hg0AUrAwCho0GwuwsrAwCjIgI5AwBBiKoNIAJB6LkLKwMAoyICOQMAQfipDUQAAAAAAADwP0Gg0AUrAwBB+NsHKwMAQcDQBSsDAKNBmNAFKwMAEAuiRAAAAAAAAPA/oKMiAzkDAEGQqg1EAAAAAAAA8D8gAqFBiP0FKwMAEAsiAjkDAEGgqg1B0LkLKwMAIgQ5AwBBqKoNIAQgBaMiBDkDAEGwqg1EAAAAAAAA8D8gBKFBuMwFKwMAEAsiBDkDAEG4qg0gAiAEoiICOQMAQcCqDSAAIAEgAyACQbDnBisDAKKioqIiADkDAEHIqg1BqNsHKwMAIgEgAKMiADkDACAARAAAAAAAAPC/oEQAAAAAAAAcwKIQCCECQdCqDUGwlgcrAwBEAAAAAAAA8L8gAkQAAAAAAADwP6CjRAAAAAAAAPA/oKIiAjkDAEHYqg0gASACojkDAEHgqg1BiOUFKwMAIAAgAKJEAAAAAAAA8D+gojkDAEGI+gtBgPoLKwMAIgA5AwBBkPoLIABB4J4GKwMAoiIAOQMAQZj6CyAAQdj5CysDAKJBoNUFKwMAokHgmgYrAwBBoI4IKwMAoiIAoyIBOQMAQaD6C0GIpAcrAwAgAKMiADkDAEGo+gsgASAAoDkDAEHg+QtB6J4GKwMAIgBBiP4FKwMAIAChRAAAAAAAAAAAIA4boCIAOQMAQej5C0QAAAAAAADwPyAAoRAPRO85+v5CLuY/ozkDAEHw+gtBkJcHKwMARLgehetRuJ6/oES4HoXrUbieP6BEuB6F61G4nj8gDhs5AwBB6KoNQbD5CysDAEHoowcrAwCjOQMAQdD5C0HI+QsrAwBBuPkLKwMAo0GwowcrAwAQCzkDAEEAIRBBsPoLQaj6CysDAEGA0gcrAwCjIgA5AwBBkKQMQYikDCsDAEQAAACilBpdQqA5AwBB0PYLQcj2CysDAERmZmZmZmb2P6A5AwBBwPMLQbjzCysDAEROKETAIdTxP6A5AwBB+O8LQfDvCysDAESamZmZmZm5P6A5AwBBuPoLIABBmNcFKwMARAAAAAAAAPA/oKIiADkDAEHA+gsgAEHQ+QsrAwCiOQMAQejPC0Ho/gYrAwBB+NoLKwMAoDkDAEGQ0QtBkIAHKwMAQaDcCysDAKA5AwBBASEOA0AgEEEDdCIPQeDSC2pBwP8FKwMAIA9BkKAHaisDAEHo1gUrAwAiAEHg1QUrAwAiAaGjIAEgABAKoDkDACAOIQ9BACEOQQEhECAPDQALQeiiDEHgogwrAwA5AwBB4M8LQeD+BisDAEHwxwsrAwCgOQMAQfDwC0Ho8AsrAwBEAAAAAAAA4D+gOQMAQYjRC0GIgAcrAwBBmMkLKwMAoDkDAEGA7QtBgJcHKwMARAAAAAAAAEnAoEQAAAAAAABJQKBEAAAAAAAASUBB4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZBsiADkDAEGI7QtB6N8GKwMAIACgIgE5AwBBoO0LQZjtCysDAEQAAAAAOJx8QaAiAjkDAEGw7QsgAkGo7QsrAwCgIgI5AwBBuO0LIAJBoKMGKwMAIgKhIACjIgA5AwBByO0LIAJBoNgHKwMAIABBkO0LKwMAIAEQCqKgIgA5AwBBwO0LIAA5AwBBqJUIQaCVCCsDAEQAAAAAAAAIQKA5AwBB8JUIQeiVCCsDAEQAAAAAAAASQKA5AwBB0JYIQciWCCsDAEQAAAAAAADwP6A5AwBB0JQIQciUCCsDAEQAAAAAAAD4P6A5AwBB2JwMQdCcDCsDAEQAAAAgX6DyQaAiADkDAEHw+QtBsPkLKwMAQeCkBysDAKJB+NEHKwMAoiIBOQMAQfj5CyABQZCkBysDAKM5AwBB8KoNIABB4JwMKwMAoEQAAAAAAAAAAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAABon0BkIg4bIgA5AwBB+KoNQYjVBisDACAAojkDAEHwnAxB6JwMKwMARAAAAAAAkKpAoCIAOQMAQYCrDSAAQficDCsDAKBEAAAAAAAAAAAgDhs5AwBBACEOQYirDUGAqw0rAwBBkNUGKwMAojkDAEHwxAtBpLoFKAIAQeD/DSsDABAJOQMAQfjEC0GougUoAgBB4P8NKwMAEAk5AwBBgPELQfDwCysDAEH48AsrAwCgOQMAQYDHC0HwxgsrAwBB4NYFKwMAIgCjOQMAQYjHC0H4xgsrAwAgAKM5AwBBkKsNRAAAAAAAAPA/QdC7CysDAEH44gYrAwCjoUQAAAAAAAAAABAHOQMAQZj3C0HglgcrAwBEmpmZmZmZqb+gRJqZmZmZmak/oESamZmZmZmpP0Hg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg8bOQMAQZD0C0HQlgcrAwBEmpmZmZmZub+gRJqZmZmZmbk/oESamZmZmZm5PyAPGzkDAEEBIQ8DQCAOQQN0Ig5B4MYLakHA/wUrAwAgDkHA3gZqKwMAQejWBSsDACIAQeDVBSsDACIBoaMgASAAEAqgOQMAIA9BAXEhEEEAIQ9BASEOIBANAAtBACEOQfiUCEHwlAgrAwBEAAAAAAAA8D+gOQMAQcCXCEG4lwgrAwBEMzMzMzMz4z+gOQMAQfiWCEHwlggrAwBESOF6FK5H4T+gOQMAQZiWCEGQlggrAwBEexSuR+F67D+gOQMAQeiTCEHgkwgrAwBEmpmZmZmZ6T+gOQMAQbCWCEQAAAAAAADwP0GgnwcrAwAiAKEgAEG45gUrAwBEAAAAAAAA8D+gRAAAAAAAAPA/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAGifQGQboqA5AwBBsJQIQaiUCCsDAEGglAgrAwCgQZiUCCsDAKBBkJQIKwMAoEGIlAgrAwCgQYCUCCsDAKBB8NcGKwMAozkDAEHYjQ0rAwAhAEHYyQYrAwAhAQNAQQAhDwNAIA9BA3QiECAOQagBbCIRQYCaDWpqKwMAIQIgEUGgqw1qIBBqIBFBgNIGaiAQaisDACABohAPIAKhIACjOQMAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtBACEOA0BBACEPA0AgD0EDdCIQIA5BqAFsIhFB8K0NampB8LgFKAIAIBFBoKsNaiAQaisDABAJOQMAIA9BAWoiD0EVRw0ACyAOQQFqIg5BAkcNAAtEAAAAAAAAAAAhAEEAIQ4DQEEAIQ8DQCAAIA9BA3QiECAOQagBbCIRQfCtDWpqKwMAIBFBwNgHaiAQaisDAKKgIQAgD0EBaiIPQRVHDQALIA5BAWoiDkECRw0AC0QAAAAAAAAAACEBQQAhDgNAQQAhDwNAIAEgDkGoAWxBwNgHaiAPQQN0aisDAKAhASAPQQFqIg9BFUcNAAsgDkEBaiIOQQJHDQALQQAhEEHAsA0gACABozkDAEGwkwhBqJMIKwMARAAAALCO8PtBoCIAOQMAQcCTCCAAQbiTCCsDAKAiADkDAEGAwAtEAAAAAAAA8D9EAAAAAAAAAABBsNEFKwMAIgFEAAAAAAAAAEBjG0QAAAAAAAAAACABRAAAAAAAAPA/ZhsiATkDAEGgkwhBqN0FKwMAROxRuB6F67G/oETsUbgeheuxP6BE7FG4HoXrsT9B4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZCIOGzkDAEGIwAsgAUQAAAAAAAAAAKBEAAAAAAAAAAAgDhsiATkDAEGQwAsgAUH4vwsrAwBB+LsLKwMAoCAAo0QAAAAAAADwv6BEAAAAAAAAAAAQB6I5AwADQEEAIREDQEEAIQ8DQCAPQQN0Ig4gEUEFdCISIBBBoAVsIhNB0M0IampqIBNBkKkIaiASaiAOaisDACATQZDDCGogEmogDmorAwAQEjkDACAPQQFqIg9BBEcNAAsgEUEBaiIRQRVHDQALIBBBAWoiEEECRw0AC0EAIRADQEEAIREDQEEAIQ4DQCAOQQN0Ig8gEUEFdCISIBBBoAVsIhNB0LANampqIBNBkMMIaiASaiAPaisDACATQYCKDGogEmogD2orAwChIBNB0M0IaiASaiAPaisDAKI5AwAgDkEBaiIOQQRHDQALIBFBAWoiEUEVRw0ACyAQQQFqIhBBAkcNAAtBkLsNQdC7DCsDADkDAEGguw1BkM8FKwMAQcC6DCsDAKI5AwBB0LsNQcDPBSsDAEHwugwrAwCiOQMARAAAAAAAAAAAIQBBACEOQcC7DUGwzwUrAwBB4LoMKwMAojkDAEHYuw1ByM8FKwMAQfi6DCsDAKI5AwBByLsNQbjPBSsDAEHougwrAwCiOQMAA0AgACAOQQJ0QZAJaigCAEEDdEGguw1qKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5B4LsNIABBoLsNKwMAoEGw/wsrAwBBoKUHKwMAoxAGIgA5AwBB6LsNIACaIgI5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RBsMILaisDAKAhACAOQQFqIg5BBEcNAAtBACEOQfi7DUHgqQ0rAwCaIgM5AwBB8LsNQcjSBysDACIBIAKiIABBkLsNKwMAIgKgozkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEGwwgtqKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5BgLwNIAEgA6IgAiAAoKM5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RBsMILaisDAKAhACAOQQFqIg5BBEcNAAtBACEOQYi8DSABQaCzDCsDAKIgAiAAoKM5AwBBkLwNQaisBysDAEHovAwrAwBB+LwMKwMAoKIiADkDAEGgvA1BsKwHKwMAQeC8DCsDAEHwvAwrAwCgoiIDOQMAQZi8DSAAQfCiDSsDAKIiADkDAEGovA0gA0Hgog0rAwCiIgM5AwBBsLwNIAAgA6AiAzkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEGwwgtqKwMAoCEAIA5BAWoiDkEERw0AC0G4vA0gASADoiACIACgozkDAEHAvA1BnLoFKAIAQeD/DSsDABAJOQMAQci8DUGYugUoAgBB4P8NKwMAEAk5AwBBgMULQdCyBysDAJ8iATkDAEHQvA1BgOUFKwMARAAAAAAAAOC/oEQAAAAAAADgP6BEAAAAAAAA4D9B4P8NKwMAIgJBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkGzkDAEGIxQtEAAAAAAAA8H9EAAAAAAAA8D9BwLIHKwMAoSIDEA9EAAAAAAAAAMCiIgCfmSAARAAAAAAAAPD/YRsiADkDAEGQxQsgACAARArbT8b4sOk/okSreCPzyB8EQKAgACAARD5d3bHYJoU/oqKgIABEzZIANbXs9j+iRAAAAAAAAPA/oCAAIABEk8SScvc5yD+ioqAgACAAIABEb2JITiZuVT+ioqKgo6EiADkDAEGYxQtBqNEGKwMAIAEgAKKgIgA5AwBBoMULIABB+NsHKwMAoSABoyIAOQMAIAAgAKIiBEQAAAAAAADgv6IQCCEFQajFC0QAAAAAAADwP0QAAAAAAAAAAEQAAAAAAADwP0HA3QYrAwAiASABoCIBn5mjIAFEAAAAAAAA8P9hGyAFIABEexSuR+F65D+iRCGwcmiR7cw/oCAERAAAAAAAAAhAoJ+ZRB+F61G4HtU/oqCjoqEiADkDAEGwxQtEAAAAAAAA8D8gAKEgA6MiADkDAEG4xQtBsKUHKwMAQcjjBisDACIDIACiokHQ1AYrAwAQByIAOQMAQcDFCyAARM3MzMzMzB5Ao0QAAAAAAAAAQKAiBDkDAEH4xAsrAwAQDyEFQcjFCyAAIAFB8MQLKwMAohAsIAVEAAAAAAAAAMCinyAEoqKgQdjUBisDABAHIgA5AwBB0MULIAA5AwBB2MULIAMgACACQdDnBSsDAGUbOQMAQdi8DUHYxQsrAwBB2JwNKwMAoSIAOQMAQeC8DSAAOQMAQei8DSAARAAAAAAAAAAAIABB0LwNKwMAZBs5AwBB8LwNQaiRCCsDACICQei5CysDACIDoEGg/wsrAwAiBKBBwJwMKwMAIgGgIgA5AwBB+LwNIAEgAKNBsLoFKwMAIgGiOQMAQYC9DSABIAQgAKOiOQMAQYi9DSABIAMgAKOiOQMAQZC9DSABIAIgAKOiOQMAQcDrC0GIpwcrAwBEAAAAAAAACECjOQMAQZi9DUGouQUoAgBB4P8NKwMAQbDXBSsDAKIQCTkDAEGgvQ1BpLkFKAIAQeD/DSsDAEGw1wUrAwCiEAk5AwBBqL0NQaC5BSgCAEHg/w0rAwBBsNcFKwMAohAJOQMAQbC9DUGcuQUoAgBB4P8NKwMAQbDXBSsDAKIQCTkDAEG4vQ1BmLkFKAIAQeD/DSsDAEGw1wUrAwCiEAk5AwBBwL0NQZS5BSgCAEHg/w0rAwBBsNcFKwMAohAJOQMAQci9DUGQuQUoAgBB4P8NKwMAQbDXBSsDAKIQCSIAOQMAAkBB4P8NKwMAIgFEAAAAAABon0BlDQBB+N4GKwMAIgBEAAAAAAAAAABhBEBBwL0NKwMAIQAMAQsgAEQAAAAAAADwP2EEQEG4vQ0rAwAhAAwBCyAARAAAAAAAAABAYQRAQbC9DSsDACEADAELIABEAAAAAAAACEBhBEBBqL0NKwMAIQAMAQtBoL0NQZi9DSAARAAAAAAAABBAYRsrAwAhAAtB0L0NIAA5AwBB2L0NQYy5BSgCACABQbDXBSsDAKIQCTkDAEHgvQ1BiLkFKAIAQeD/DSsDAEGw1wUrAwCiEAk5AwBB6L0NQYS5BSgCAEHg/w0rAwBBsNcFKwMAohAJOQMAQfC9DUGAuQUoAgBB4P8NKwMAQbDXBSsDAKIQCTkDAEH4vQ1B/LgFKAIAQeD/DSsDAEGw1wUrAwCiEAk5AwBBgL4NQfi4BSgCAEHg/w0rAwBBsNcFKwMAohAJOQMAQYi+DUH0uAUoAgBB4P8NKwMAQbDXBSsDAKIQCSIAOQMAAkBB4P8NKwMARAAAAAAAaJ9AZQ0AQfjeBisDACIARAAAAAAAAAAAYQRAQYC+DSsDACEADAELIABEAAAAAAAA8D9hBEBB+L0NKwMAIQAMAQsgAEQAAAAAAAAAQGEEQEHwvQ0rAwAhAAwBCyAARAAAAAAAAAhAYQRAQei9DSsDACEADAELQeC9DUHYvQ0gAEQAAAAAAAAQQGEbKwMAIQALQZC+DSAAOQMAQZi+DSAAQdC9DSsDAKA5AwBB4PYLQdD2CysDAEHY9gsrAwCgIgA5AwBB6PYLQcifBysDAEGgvAsrAwBBiL0LKwMAoyAAEAuiOQMAQfD2C0QAAAAAAADwP0H4vAsrAwCjQcDSBysDAKJBwNQFKwMAQcjSBSsDAKJBmPALKwMAoqA5AwBBiPcLQYD3CysDAEHAjwgrAwCiQbC8CysDAKE5AwBBACEOQQAhD0GQ9wtBiPcLKwMAQfieBisDAKMiADkDAEGY8QtBkPELKwMARAAAAABlzc1BoCIBOQMAQbD3CyABQaj3CysDAKAiAzkDAEQAAAAAAAAAACEBQaD3CyAAQZj3CysDAKJEAAAAAAAAAAAQByIAOQMAAkAgAEQAAAAAAAAAAGEEQEHA0gcrAwAhAgwBC0QAAAAAAADwPyAAo0HA0gcrAwAiAqIhAQtBuPcLIAMgARAGIgE5AwBBwPcLIAFB8PYLKwMAoCIBOQMAQcj3CyABQYjZBisDAEQAAAAAAADwP6CiIgE5AwBBoL4NIABBgMYLKwMAoiACoyICOQMAQai+DUGovAsrAwAiAEG4vAsrAwCjQdDXBisDAEGgvAsrAwCioiIDOQMAQdD3CyABQej2CysDAKI5AwBBsL4NIAMgAKFB6J8GKwMAoyIBOQMARAAAAAAAAAAAIQBBuL4NIAFBmL0LKwMAoEQAAAAAAAAAABAHIgE5AwBBwL4NIAEgAhAGIgE5AwBByL4NIAFEAAAAAAAAAAAQBzkDAEGQ9gtBiPYLKwMARAAAAAAAABhAoDkDAANAIAAgDkECdEGQCWooAgBBA3RB8J4NaisDAKAhACAOQQFqIg5BBEcNAAtBACEOQdC+DSAAOQMARAAAAAAAAAAAIQADQCAAIA5BAnRBkAlqKAIAQQN0QbCfDWorAwCgIQAgDkEBaiIOQQRHDQALQdi+DSAAOQMARAAAAAAAAAAAIQBBACEOA0AgACAOQQN0QfCeDWorAwCgIQAgDkEBaiIOQQRHDQALQQAhDkHgvg0gADkDAEQAAAAAAAAAACEAA0AgACAOQQN0QbCfDWorAwCgIQAgDkEBaiIOQQRHDQALQei+DSAAOQMAA0BBACEOA0AgDkEDdCIQIA9BqAFsIhFB8L4NamogEUHwrQ1qIBBqKwMAIBFBwNgHaiAQaisDAKI5AwAgDkEBaiIOQRVHDQALIA9BAWoiD0ECRw0AC0QAAAAAAAAAACEAQQAhDwNAQQAhDgNAIAAgD0GoAWxB8L4NaiAOQQN0aisDAKAhACAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALQQAhDkHAwQ0gADkDAEHQwQ1BwLoMKwMAQdDOBSsDAKIiATkDAEGAwg1BgM8FKwMAQfC6DCsDAKI5AwBB8MENQfDOBSsDAEHgugwrAwCiOQMAQcjBDUHInAwrAwBEAAAAAAAA8D9BkJ0NKwMAoaI5AwBBoL8IQcDXBisDAER7FK5H4Xqkv6BEexSuR+F6pD+gRHsUrkfheqQ/QeD/DSsDAEGgpQcrAwAiAkQAAAAAAADgP6KgRAAAAAAAkJ9AZBs5AwBBiMINQYjPBSsDAEH4ugwrAwCiOQMAQfjBDUH4zgUrAwBB6LoMKwMAojkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEHQwQ1qKwMAoCEAIA5BAWoiDkEERw0AC0GQwg0gASAAoEGQ/wsrAwAgAqMQBiIAOQMAQZjCDSAAmjkDAEQAAAAAAAAAACEAQQAhDgNAIAAgDkECdEGQCWooAgBBA3RBsMILaisDAKAhACAOQQFqIg5BBEcNAAtBACEOQajCDUGYow0rAwCaIgM5AwBBoMINQZjCDSsDAEHI0gcrAwAiAaIgAEGQuw0rAwAiAqCjOQMARAAAAAAAAAAAIQADQCAAIA5BAnRBkAlqKAIAQQN0QbDCC2orAwCgIQAgDkEBaiIOQQRHDQALQQAhDkGwwg0gASADoiACIACgozkDAEG4wg1BkP8LKwMAQfDWBSsDAKIiADkDAEHAwg0gAJoiAzkDAEQAAAAAAAAAACEAA0AgACAOQQJ0QZAJaigCAEEDdEGwwgtqKwMAoCEAIA5BAWoiDkEERw0AC0EAIQ5ByMINIAEgA6IgAiAAoKM5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RBsMILaisDAKAhACAOQQFqIg5BBEcNAAtBACEOQdDCDSABQbC2DCsDAKIgAiAAoKM5AwBEAAAAAAAAAAAhAANAIAAgDkECdEGQCWooAgBBA3RBsMILaisDAKAhACAOQQFqIg5BBEcNAAtB2MINIAFBgKMNKwMAoiACIACgozkDAEH4wg1BqNoGKwMARAAAAAAAAPA/QZj/CysDACIBQZDnBisDAKOhoiICOQMAQeDCDUQAAAAAAADwP0GQ1AUrAwBB+NsHKwMAQbjnBisDAKNB+NMFKwMAEAuiRAAAAAAAAPA/oKMiADkDAEHowg0gADkDAEHwwg1BgMkFKwMAQcCeBisDACAAoqJB4JkMKwMAoUHo0QYrAwCjOQMAQYDDDSABIAKiQZinBysDAKM5AwBB8P0LQcifBisDACIAOQMAQeD9C0HY/QsrAwBByP0LKwMAojkDAEGY7gtBuP4FKwMARAAAAAAAAFnAoEQAAAAAAABZQKBEAAAAAAAAWUBB4P8NKwMAQaClBysDAEQAAAAAAADgP6KgRAAAAAAAkJ9AZBsiATkDAEHo/QsgACABoCICOQMAQfj9C0GgyAcrAwBBqMgHKwMAoZkgAaMiATkDAEGA/gsgASAAIAIQCiIAOQMAQYj+CyAAQeD9CysDAKJB4P8FKwMAozkDAEGIww1B8OcFKwMAQeCaBisDAKJBkMgHKwMAokH4jQgrAwCiOQMAQZDDDUGo/AsrAwBBoPwLKwMAEBIiADkDAEGYww1BuPwLKwMAIACjIgA5AwBBoMMNQeCcDSsDACAAQaD8CysDACIAoUGopwcrAwCjoCIBOQMAQajDDUGYyAcrAwBEAAAAopQancKgRAAAAKKUGp1CoEQAAACilBqdQkHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkGyICOQMAQbDDDUQAAAAAAADwPyAAIAKjoUQAAAAAAAAAABAHIgA5AwBBuMMNIABB6I0IKwMAoiIAOQMAQcDDDSABIACiIgA5AwBByMMNQcDOBSsDACAAokGg/QsrAwBBiMMNKwMAoKJB4P8FKwMAozkDAEHY+gtB0PoLKwMAQcD6CysDAKI5AwBB6PoLQcifBisDACIAOQMAQeD6CyAAQZjuCysDACIBoCICOQMAQfj6C0Hw+gsrAwBB+KMHKwMAoZkgAaMiATkDAEGA+wsgASAAIAIQCiIBOQMAQdDDDUG4+QsrAwBBsPkLKwMAIgCjIgI5AwBB6MMNQZCkDCsDAEGYpAwrAwCgIgM5AwBBiPsLIAFB2PoLKwMAokHg/wUrAwAiAaM5AwBB2MMNQcj5CysDACACoyICOQMAQfDDDUQAAAAAAADwPyAAIAOjoUQAAAAAAAAAABAHIgM5AwBB4MMNQeiqDSsDACACIAChQaCnBysDAKOgIgA5AwBB+MMNIANBkI4IKwMAoiICOQMAQYDEDSAAIAKiIgA5AwBB+OwLQfC7CysDACICQdC7CysDACIDoyIEOQMAQfDsC0HImAgrAwBB4LsLKwMAo0GIowcrAwAQCyIFOQMAQdDtC0HI7QsrAwAgBKMiBDkDAEGIxA0gAEGQ+gsrAwCiQeCkBysDAKJBoNUFKwMAoiIAOQMAQZDEDSAAIAGjOQMAQdjtC0GA/gUrAwBEexSuR+F6hL+gRHsUrkfheoQ/oER7FK5H4XqEP0Hg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bIgA5AwBB4O0LRAAAAAAAAPA/IAChEA9E7zn6/kIu5j+jIgA5AwBB6O0LIANB8JsGKwMAoyAAEAsiADkDAEHw7QsgAEGAnwYrAwCiIgA5AwBB+O0LIAQgAKAiADkDAEGA7gsgAEGI1wUrAwBEAAAAAAAA8D+goiIAOQMAQYjuCyAFIACiIgA5AwBBkO4LIAIgAKI5AwBBoO4LQcifBisDACIAQZjuCysDACIBoCICOQMAQajuCyAAOQMAQbDuC0GQlwcrAwBEuB6F61G4nr+gRLgehetRuJ4/oES4HoXrUbiePyAOGyIDOQMAQbjuCyADQdjQBSsDAKGZIAGjIgE5AwBBwO4LIAEgACACEAo5AwBByO4LQcDuCysDAEGQ7gsrAwCiOQMAQZjEDUHYuwsrAwBB0LsLKwMAEBIiADkDAEGgxA1BkKsNKwMAQbiOCCsDAKIiATkDAEGoxA1ByJgIKwMAIACjIgI5AwBBsMQNQdC7CysDACIDQcjQBSsDACIEoyIFOQMAQdDzC0HA8wsrAwBByPMLKwMAoCIGOQMAQbjEDSAFIAIgA6FBgKcHKwMAo6AiAjkDAEHAxA0gASACokQAAAAAAAAAABAHIgE5AwBByMQNIAQgACABQfDtCysDAKKiojkDAEHY8wtBuJ8HKwMAQci9CysDACIAQbC+CysDAKMgBhALoiIDOQMAQejzC0GAuQYrAwBBkNUGKwMAoiICOQMAQYD0C0H48wsrAwBB8I4IKwMAokHYvQsrAwChIgQ5AwBB4PMLRAAAAAAAAPA/QaC+CysDACIFo0HA0gcrAwAiAaJBwNQFKwMAQdDSBSsDAKJBmPALKwMAoqAiBjkDAEGI9AsgBCACoyICOQMAQZj0CyACQZD0CysDAKJEAAAAAAAAAAAQByICOQMAQaj0C0GY8QsrAwBBoPQLKwMAoCIEOQMAQbD0CyAEIAFEAAAAAAAA8D8gAqOiRAAAAAAAAAAAIAJEAAAAAAAAAABiGxAGIgI5AwBBuPQLIAYgAqAiBDkDAEHg9AtB2PQLKwMARJqZmZmZmdk/oCIGOQMAQcD0CyAEQZDXBSsDAEQAAAAAAADwP6CiIgQ5AwBB8PQLIAZB6PQLKwMAoCIGOQMAQcj0CyADIASiIgM5AwBB0MQNIAFB6L0LKwMAIAAQBiAFo6IiATkDAEHYxA0gATkDAEHQ9AsgA0Gw8wsrAwCiIgE5AwBB+PQLIAEgBqI5AwBB4MQNQdC9CysDACIBQeC9CysDAKMgAEHI1wYrAwCioiIAOQMAQejEDSAAIAGhQeCfBisDAKMiADkDAEHwxA0gAEHAvgsrAwCgRAAAAAAAAAAAEAciADkDAEH4xA0gAiAAojkDAEGAxQ1B+MQNKwMAOQMAQYjwC0H47wsrAwBBgPALKwMAoCIAOQMAQbDwC0Go8AsrAwBEAAAAAEB3K0GgIgI5AwBBkPALQZifBysDAEHwvgsrAwAiAUHYvwsrAwCjIAAQC6IiAzkDAEGg8AtEAAAAAAAA8D9ByL8LKwMAIgSjQcDSBysDACIAokHA1AUrAwBBwNIFKwMAokGY8AsrAwCioCIFOQMAQcDwCyACQbjwCysDAKAiAjkDAEGo8QtBmPELKwMAQaDxCysDAKAiBjkDAEHY8AtB0PALKwMAQZiPCCsDAKJBgL8LKwMAoSIHOQMAQeDwCyAHIAKjIgI5AwBBiPELIAJBgPELKwMAokQAAAAAAAAAABAHIgI5AwBBsPELIAYgAEQAAAAAAADwPyACo6JEAAAAAAAAAAAgAkQAAAAAAAAAAGIbEAYiAjkDAEG48QsgBSACoCIFOQMAQeDxC0HY8QsrAwBEuB6F61G4nj+gIgY5AwBBwPELIAVBkNUFKwMARAAAAAAAAPA/oKIiBTkDAEHw8QsgBkHo8QsrAwCgIgY5AwBByPELIAMgBaIiAzkDAEGIxQ0gAEGQvwsrAwAgARAGIASjoiIEOQMAQZDFDSAEOQMAQdDxCyADQejvCysDAKIiAzkDAEH48QsgAyAGojkDAEGYxQ1B+L4LKwMAIgNBiL8LKwMAoyABQaDXBisDAKKiIgE5AwBBoMUNIAEgA6FB2J8GKwMAoyIBOQMAQajFDSABQei/CysDAKBEAAAAAAAAAAAQByIBOQMAQbDFDSACIAGiIgE5AwBBuMUNIAE5AwBB2PcLQdD3CysDAEHA9gsrAwCiIgE5AwBB6PcLQeD3CysDAER7FK5H4XqkP6AiAjkDAEH49wsgAkHw9wsrAwCgIgI5AwBBgPgLIAEgAqI5AwBB+LwLKwMAIQFBwMUNIABBwLwLKwMAQaC8CysDABAGIAGjojkDAEEAIQ5ByMUNQcDFDSsDACIBOQMAQdDFDUG4vg0rAwBBuPcLKwMAoiIAOQMAQdjFDSAAOQMAQeDFDSABIACgQYD4CysDAKBBuMUNKwMAoEGQxQ0rAwCgQfjxCysDAKBBgMUNKwMAoEHYxA0rAwCgQfj0CysDAKBByMQNKwMAoEHI7gsrAwCgQZDEDSsDAKBBiPsLKwMAoEHIww0rAwCgQYj+CysDAKAiADkDAEHoxQ0gAEGY/wsrAwCgIgA5AwBB8MUNIAA5AwBB+MUNQajbBysDAEHgqg0rAwCiIgA5AwBBgMYNIACaOQMAQcjAC0Go0gcrAwAiAEGAqAcrAwCiQfjUBisDAKNBmKgHKwMAIgKjIgE5AwBBiMYNIAFB2MALKwMAoiIDOQMAQfj+CyAAQYioBysDAKJBgNUGKwMAoyACoyICOQMAQZDGDUGI/wsrAwAgAqIiBDkDAEGYxg1BiJIIKwMAQeCCBisDAKNBsNIHKwMAoyIFOQMAQaDGDUGwzAcrAwBBoMwHKwMAIANBqNoFKwMAIgCin6JBuMsHKwMAIAVBsNoFKwMAop+iQfjLBysDACAEIACinyIDoqCgoCIEOQMAQajGDSAEIAMgAEHozQUrAwCin6GiOQMAQbDGDUHApg0rAwBB2KUNKwMAoEG4pg0rAwCgOQMARAAAAAAAAAAAIQADQCAAIA5BA3RBsL4MaisDAKAhACAOQQFqIg5BCEcNAAtBACEOQYChDEH4oAwrAwBEAAAAAAAAFECgOQMAQeCgDEHYoAwrAwBEAAAAAAAAFECgOQMAQcCgDEG4oAwrAwBEAAAAAAAAFECgOQMAQYD/C0HgzQUrAwAgAqM5AwBB0MALQcDNBSsDACABozkDAEG4xg1BkLsNKwMAQZiqDSsDAKAgAKM5AwADQCAOQaAFbCIPQcDGDWogD0GAxAlqQaAFEA0gDkEBaiIOQQJHDQALQZDHC0GAxwspAwA3AwBBmMcLQYjHCykDADcDAEHAxgtBsJAIKwMAQcCBBisDAKM5AwBBkMYLQdDcBisDAEQzMzMzMzPzv6BEMzMzMzMz8z+gRDMzMzMzM/M/QeDVBSsDAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBjIg4bOQMAQZjGC0HY3AYrAwBEAAAAAAAACMCgRAAAAAAAAAhAoEQAAAAAAAAIQCAOGzkDAEGgxgtB8NwGKwMARLgehetRuJ6/oES4HoXrUbieP6BEuB6F61G4nj8gDhs5AwBBqMYLQfjcBisDAES4HoXrUbiuv6BEuB6F61G4rj+gRLgehetRuK4/IA4bOQMAQbDGC0Hg3AYrAwBE16NwPQrX67+gRNejcD0K1+s/oETXo3A9CtfrPyAOGzkDAEEAIRBBuMYLQejcBisDAESscwzIXu/pv6BErHMMyF7v6T+gRKxzDMhe7+k/QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCIAQeDVBSsDAGQbOQMAQcDGCysDACEBQQEhDgNAIAEgEEEDdCIPQZDGC2orAwChIA9BoMYLaisDAJqiEAghAiAPQdDGC2ogD0GwxgtqKwMAIAJEAAAAAAAA8D+go0QAAAAAAAAAABAHOQMAIA4hD0EAIQ5BASEQIA8NAAtBACEQQcD/BSsDACEBQQEhDgNAIBBBA3QiD0GgxwtqIA9BwP4GaisDACAPQeDGC2orAwCiIA9B0MYLaisDAKIgARAGOQMAIA4hD0EAIQ5BASEQIA8NAAtBsMcLQaDHCysDAEHI2AcrAwBBkMcLKwMAoaI5AwBBuMcLQajHCysDAEHw2QcrAwBBmMcLKwMAoaI5AwBBuP4LQbifBisDACIBQZiXBysDACABoUQAAAAAAAAAACAARAAAAAAAkJ9AZCIOG6AiADkDAEGA0Q1BsMcLKQMANwMAQcD+CyAARAAAAAAAAAhAoyIAOQMAQYjRDUG4xwspAwA3AwBBkNENQfD+CysDACAAoyIBOQMAQZjRDSABOQMAQaDRDUHo/gsrAwAgAKMiADkDAEGo0Q0gADkDAEHI/gtBoN0FKwMARLu919nffNu9oES7vdfZ33zbPaBEu73X2d982z0gDhs5AwBBmPwLQci5BSgCAEHojQgrAwAQCSIAOQMAQdD+CyAAQYj+CysDACICoiIBOQMAQdj+CyABQcj+CysDAKIiATkDAEGw0Q0gATkDAEGA/AtBsJ8GKwMAIgFBiJcHKwMAIAGhRAAAAAAAAAAAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDhugIgE5AwBBiPwLIAFEAAAAAAAACECjIgE5AwBBuNENQbD+CysDACABoyIDOQMAQcDRDSADOQMAQcjRDUGo/gsrAwAgAaMiATkDAEHQ0Q0gATkDAEGY3QUrAwAhAUGQ/gsgAkQAAAAAAADwPyAAoaIiADkDAEGQ/AsgAUSV1iboCy4RvqBEldYm6AsuET6gRJXWJugLLhE+IA4bIgE5AwBBmP4LIAAgAaIiADkDAEHY0Q0gADkDAEHA+wtBmJcHKwMARAAAAAAAAFnAoEQAAAAAAABZQKBEAAAAAAAAWUAgDhsiADkDAEHI+wsgAEQAAAAAAAAIQKMiADkDAEHg0Q1B+PsLKwMAIACjIgA5AwBB6NENIAA5AwBB8NENQfD7CysDAEHI+wsrAwCjIgA5AwBB+NENIAA5AwBBoPkLQcS5BSgCAEGQjggrAwAQCSIAOQMAQdD7CyAAQYj7CysDACIBoiICOQMAQZD7CyABRAAAAAAAAPA/IAChoiIBOQMAQdj7C0Gg3QUrAwBEu73X2d98272gRLu919nffNs9oES7vdfZ33zbPUHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bIgA5AwBBkPkLQYiXBysDAEQAAAAAAABJwKBEAAAAAAAASUCgRAAAAAAAAElAIA4bIgM5AwBB4PsLIAIgAKIiADkDAEGA0g0gADkDAEGY+QsgA0QAAAAAAAAIQKMiADkDAEGI0g1BuPsLKwMAIACjIgI5AwBBkNINIAI5AwBBmNINQbD7CysDACAAoyIAOQMAQaDSDSAAOQMAQbj4C0GQ9gsrAwBBsPgLKwMAoCIAOQMAQdD4C0HI+AsrAwBEnlkQokzJvj2gIgI5AwBBwPgLIABEAAAAAAAACECjIgA5AwBB4PgLIAJB2PgLKwMAoDkDAEGY+wtBmN0FKwMARJXWJugLLhG+oESV1iboCy4RPqBEldYm6AsuET4gDhsiAjkDAEGw0g1BiPkLKwMAIACjIgM5AwBBuNINIAM5AwBBwNINQYD5CysDACAAoyIAOQMAQcjSDSAAOQMAQaD7CyABIAKiIgA5AwBBqNINIAA5AwBBuPYLQcC5BSgCAEHAjwgrAwAQCSIAOQMAQej4C0QAAAAAAADwPyAAoUGA+AsrAwCiIgA5AwBBoPYLQZD2CysDAEGY9gsrAwCgOQMAQfD4CyAAQeD4CysDAKIiADkDAEHQ0g0gADkDAEGo9gtBoPYLKwMARAAAAAAAAAhAoyIAOQMAQYj4C0GA+AsrAwBBuPYLKwMAoiIBOQMAQdjSDUGo+AsrAwAgAKMiAjkDAEHg0g0gAjkDAEHo0g1BoPgLKwMAIACjIgA5AwBB8NINIAA5AwBBsPYLQYjdBSsDAEQDOErlzz0zvqBEAzhK5c89Mz6gRAM4SuXPPTM+QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQbIgA5AwBBkPgLIAAgAaIiADkDAEH40g0gADkDAEGA8wtB+PILKwMARAAAAAAAABhAoCIAOQMAQbD1CyAAQaj1CysDAKAiADkDAEHI9QtBwPULKwMARHALG+kffsA9oCIBOQMAQbj1CyAARAAAAAAAAAhAoyIAOQMAQdj1CyABQdD1CysDAKA5AwBBgNMNQYD2CysDACAAoyIBOQMAQYjTDSABOQMAQZDTDUH49QsrAwAgAKMiADkDAEGY0w0gADkDAEGo8wtBvLkFKAIAQfCOCCsDABAJIgA5AwBB4PULRAAAAAAAAPA/IAChQfj0CysDACICoiIBOQMAQZDzC0GA8wsrAwBBiPMLKwMAoCIDOQMAQej1CyABQdj1CysDAKIiATkDAEGg0w0gATkDAEGY8wsgA0QAAAAAAAAIQKMiATkDAEGo0w1BoPULKwMAIAGjIgM5AwBBsNMNIAM5AwBBuNMNQZj1CysDACABoyIBOQMAQcDTDSABOQMAQeD/DSsDACEBQaClBysDACEDQfjcBSsDACEEQYD1CyAAIAKiOQMAQaDzCyAERClmpNNd9B++oEQpZqTTXfQfPqBEKWak0130Hz4gASADRAAAAAAAAOA/oqBEAAAAAACQn0BkGzkDAEGI9QtBgPULKwMAQaDzCysDAKIiADkDAEHI0w0gADkDAEHA7wtBuO8LKwMARAAAAAAAABhAoCIAOQMAQbjyCyAAQbDyCysDAKAiADkDAEHA8gsgAEQAAAAAAAAIQKMiADkDAEHQ0w1B8PILKwMAIACjIgE5AwBB2NMNIAE5AwBB4NMNQejyCysDACAAoyIAOQMAQejTDSAAOQMAQcjyC0Hw3AUrAwBESbC79K3edr2gREmwu/St3nY9oERJsLv0rd52PUHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkGzkDAEHg7wtBuLkFKAIAQZiPCCsDABAJIgA5AwBB0PILRAAAAAAAAPA/IAChQfjxCysDACIBoiICOQMAQdDvC0HA7wsrAwBByO8LKwMAoCIDOQMAQYDyCyAAIAGiIgE5AwBB2PILIAJByPILKwMAoiIAOQMAQfDTDSAAOQMAQdjvCyADRAAAAAAAAAhAoyIAOQMAQfjTDUGo8gsrAwAgAKMiAjkDAEGA1A0gAjkDAEGI1A1BoPILKwMAIACjIgA5AwBBkNQNIAA5AwBBiPILQejcBSsDAET+fP4F5c+xvaBE/nz+BeXPsT2gRP58/gXlz7E9QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQiDhsiADkDAEGQ8gsgASAAoiIAOQMAQZjUDSAAOQMAQfjuC0GYlwcrAwBEAAAAAAAAWcCgRAAAAAAAAFlAoEQAAAAAAABZQCAOGyIAOQMAQYDvCyAARAAAAAAAAAhAoyIAOQMAQaDUDUGw7wsrAwAgAKMiATkDAEGo1A0gATkDAEGw1A1BqO8LKwMAIACjIgA5AwBBuNQNIAA5AwBBiO8LQaDdBSsDAES7vdfZ33zbvaBEu73X2d982z2gRLu919nffNs9QeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioEQAAAAAAJCfQGQbOQMAQejsC0G0uQUoAgBBuI4IKwMAEAkiADkDAEGQ7wsgAEHI7gsrAwAiAqIiATkDAEGY7wsgAUGI7wsrAwCiIgE5AwBBwNQNIAE5AwBB0OwLQYiXBysDAEQAAAAAAABJwKBEAAAAAAAASUCgRAAAAAAAAElAQeD/DSsDAEGgpQcrAwBEAAAAAAAA4D+ioCIDRAAAAAAAkJ9AZCIOGyIBOQMAQeDsC0GY3QUrAwBEldYm6AsuEb6gRJXWJugLLhE+oESV1iboCy4RPiAOGyIEOQMAQdjsCyABRAAAAAAAAAhAoyIBOQMAQcjUDUHw7gsrAwAgAaMiBTkDAEHQ1A0gBTkDAEHY1A1B6O4LKwMAIAGjIgE5AwBB4NQNIAE5AwBB2O4LIAJEAAAAAAAA8D8gAKGiIgAgBKIiATkDAEHQ7gsgADkDAEHo1A0gATkDAEHY1Q1B+LkMKwMAOQMAQfDUDUHo6wsrAwBBwOsLKwMAIgCjIgE5AwBB+NQNIAE5AwBBgNUNQeDrCysDACAAoyIAOQMAQYjVDSAAOQMAQcjrC0Gg/QUrAwBEAAAAAAAA8D9B4LkLKwMAIgBBgNEGKwMAo6GiIgE5AwBB0OsLIAAgAaIiADkDAEGQ1Q0gADkDAEHQ1Q1B8LkMKwMAOQMAQcjVDUHouQwrAwA5AwBBwNUNQeC5DCsDADkDAEGQ4wtB8KQHKwMARGZmZmZmZva/oERmZmZmZmb2P6BEZmZmZmZm9j8gA0Hg1QUrAwBkIg4bOQMAQZjjC0H4pAcrAwBEAAAAAAAADMCgRAAAAAAAAAxAoEQAAAAAAAAMQCAOGzkDAEGg4wtBkKUHKwMARDMzMzMzM+O/oEQzMzMzMzPjP6BEMzMzMzMz4z8gDhs5AwBBqOMLQZilBysDAESamZmZmZnZv6BEmpmZmZmZ2T+gRJqZmZmZmdk/IA4bOQMAQQAhEEGw4wtBgKUHKwMARGZmZmZmZua/oERmZmZmZmbmP6BEZmZmZmZm5j9B4P8NKwMAQaClBysDAEQAAAAAAADgP6KgIgJB4NUFKwMAZCIPGyIBOQMAQbjjC0GIpQcrAwBEMzMzMzMz87+gRDMzMzMzM/M/oEQzMzMzMzPzPyAPGzkDAEHAxgsrAwAhAEEBIQ4DQCAQQQN0IhBBwOMLaiABIAAgEEGQ4wtqKwMAoSAQQaDjC2orAwCaohAIRAAAAAAAAPA/oKNEAAAAAAAAAAAQBzkDACAOBEAgEEG44wtqKwMAIQFBASEQQQAhDgwBCwtBACEQQfjjC0HA4wsrAwBBgOMLKwMAoiIBQeilBysDACIDoiIEOQMAQaDlCyADQcjjCysDAEGI4wsrAwCiIgOiIgU5AwBB8OMLIAFB4KUHKwMAIgGiIgY5AwBBmOULIAMgAaIiATkDAEHY4gUgBEHI4gcrAwCiIgM5AwBBgOQFIAVB8OMHKwMAoiIEOQMAQfDnCyAEOQMAQcjmCyADOQMAQdDiBSAGQcDiBysDAKIiAzkDAEHA5gsgAzkDAEH44wUgAUHo4wcrAwCiIgE5AwBB6OcLIAE5AwBB6OMLQcDjCysDAEGA4wsrAwCiQdilBysDACIBoiIDOQMAQZDlCyABQcjjCysDAEGI4wsrAwCioiIBOQMAQcjiBUG44gcrAwAgA6IiAzkDAEHw4wVB4OMHKwMAIAGiIgE5AwBBuOYLIAM5AwBB4OcLIAE5AwBBoNILQZCYBysDAERmZmZmZmb+v6BEZmZmZmZm/j+gRGZmZmZmZv4/IA8bIgE5AwBBqNILQZiYBysDAEQAAAAAAAD4v6BEAAAAAAAA+D+gRAAAAAAAAPg/IA8bIgM5AwBBsNILQbCYBysDAERmZmZmZmbyv6BEZmZmZmZm8j+gRGZmZmZmZvI/IA8bIgQ5AwBBuNILQbiYBysDAEQAAAAAAAD4v6BEAAAAAAAA+D+gRAAAAAAAAPg/IA8bIgU5AwBBwNILQaCYBysDAERmZmZmZmb2v6BEZmZmZmZm9j+gRGZmZmZmZvY/IA8bIgY5AwBByNILQaiYBysDAEQAAAAAAADwv6BEAAAAAAAA8D+gRAAAAAAAAPA/IA8bIgc5AwBB0NILIAYgACABoSAEmqIQCEQAAAAAAADwP6CjRAAAAAAAAAAAEAciATkDAEHY0gsgByAAIAOhIAWaohAIRAAAAAAAAPA/oKNEAAAAAAAAAAAQByIAOQMAQYjTCyABQejPCysDAEHg0gsrAwCioiIBOQMAQbDUCyAAQZDRCysDAEHo0gsrAwCioiIAOQMAQfjfBUHo5wcrAwAgAaIiATkDAEGg4QVBkOkHKwMAIACiIgA5AwBBgNcLIAA5AwBB2NULIAE5AwBBASEOA0AgEEGoAWwiD0Hw0gtqIA9B0M8LaisDECAQQQN0Ig9B4NILaisDAKIgD0HQ0gtqKwMAokQAAAAAAADwPxAGOQMQIA4hD0EAIQ5BASEQIA8NAAtBwMcLQbDHCykDADcDAEHg1Q1BoL4MKwMAOQMAQejVDUHYuwwrAwA5AwBB8N8FQeDnBysDAEGA0wsrAwCiIgA5AwBB0NULIAA5AwBByMcLQbjHCykDADcDAEGY4QVBiOkHKwMAQajUCysDAKIiADkDAEH41gsgADkDAEGgwAtB+KcHKwMARAAAAAAAACTAoEQAAAAAAAAkQKBEAAAAAAAAJEAgAkQAAAAAAJCfQGQbIgA5AwBBqMALIABEAAAAAAAACECjOQMAQQAhEEHw1Q1BwMALKwMAQajACysDACIAoyIBOQMAQfjVDSABOQMAQYDWDUG4wAsrAwAgAKMiADkDAEGI1g0gADkDAEGYwAtBkMALKwMAQaCTCCsDAKIiADkDAEGQ1g0gADkDAEGovwhBoL8IKwMARAAAAAAAAAAAoEQAAAAAAAAAAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAiAEQAAAAAAGifQGQbIgE5AwBEAAAAAAAAAEBB2KQHKwMAQbC6BSsDACICo6EhAwNAQQAhDwNAIAMgD0EDdCIOQZDYCGorAwCaoiEEIA5B4MEIaisDACEFIA5BwNkIaisDACEGQQAhDgNAIA5BA3QiESAPQQV0IhIgEEGgBWwiE0Hw2ghqamogBiAEIBNB0M0IaiASaiARaisDACAFoaIQCEQAAAAAAADwP6CjOQMAIA5BAWoiDkEERw0ACyAPQQFqIg9BFUcNAAsgEEEBaiIQQQJHDQALQQAhDkHgvwhBwL8IKQMANwMAQei/CEHIvwgpAwA3AwBB8L8IQdC/CCkDADcDAEH4vwhB2L8IKQMANwMAQbC/CEGInwcrAwBEAAAAAAAAFMCgRAAAAAAAABRAoEQAAAAAAAAUQCAARAAAAAAAkJ9AZCIPGyIAOQMAQYDACEHYnAcrAwBEzczMzMzM7L+gRM3MzMzMzOw/oETNzMzMzMzsPyAPGyIDOQMAQYjACEGImQcrAwBEAAAAAAAAAMCgRAAAAAAAAABAoEQAAAAAAAAAQCAPGyIEOQMAIAOaIQMDQCAOQQN0Ig9BkMAIaiAEIA9B4L8IaisDACAAoSADohAIRAAAAAAAAPA/oKM5AwAgDkEBaiIOQQRHDQALQQAhEEGAowcrAwAgAqMhAANAQQAhDwNAIA9BA3RB8L4IaisDACAAoiECQQAhDgNAIA5BA3QiESAQQQZ0QbDlCGogD0EFdGpqIAEgEUGQwAhqKwMAIA9BoAVsQfDaCGogEEEFdGogEWorAwAgAqKiojkDACAOQQFqIg5BBEcNAAsgD0EBaiIPQQJHDQALIBBBAWoiEEEVRw0AC0GY1g1B4P4LKwMAQcD+CysDAKMiADkDAEGg1g0gADkDAEGo1g1BoP4LKwMAQYj8CysDAKMiADkDAEGw1g0gADkDAEG41g1B6PsLKwMAQcj7CysDAKMiADkDAEHA1g0gADkDAEHI1g1BqPsLKwMAQZj5CysDAKMiADkDAEHQ1g0gADkDAEHY1g1B+PgLKwMAQcD4CysDAKMiADkDAEHg1g0gADkDAEHo1g1BmPgLKwMAQaj2CysDAKMiADkDAEHw1g0gADkDAEH41g1B8PULKwMAQbj1CysDAKMiADkDAEGA1w0gADkDAEGI1w1BkPULKwMAQZjzCysDAKMiADkDAEGQ1w0gADkDAEEAIQ5EAAAAAAAAAAAhAkEAIQ9BmNcNQeDyCysDAEHA8gsrAwCjIgA5AwBBoNcNIAA5AwBBqNcNQZjyCysDAEHY7wsrAwCjIgA5AwBBsNcNIAA5AwBBuNcNQaDvCysDAEGA7wsrAwCjIgA5AwBBwNcNIAA5AwBByNcNQeDuCysDAEHY7AsrAwCjIgA5AwBB0NcNIAA5AwBBoKAMKwMAQdjSBysDAKFBgM0HKwMAmqIQCCEAQaigDEH4ugYrAwAgAEQAAAAAAADwP6CjOQMAQdjXDUHI/wUrAwBEAAAAAACAU0CjRAAAAAAAmJ9ARAAAAAAAaKBAEApEmpmZmZmZ6T+gIgA5AwBBkM8HKwMAQbCQCCsDAEHo/wUrAwCjQejUBysDAKGiEAghAUHg1w0gAEHwvwYrAwAgAUQAAAAAAADwP6CjoDkDAEHo1w1B0P8FKwMARAAAAAAAgFNAo0QAAAAAAJifQEQAAAAAAGigQBAKRJqZmZmZmek/oCIAOQMAQfihDCsDACIDQYjLBisDAKNBmNQHKwMAoUG4zgcrAwCaohAIIQFB8NcNIABBmL8GKwMAIAFEAAAAAAAA8D+go6A5AwBEAAAAAAAAAAAhAEQAAAAAAAAAACEBA0AgASAPQQJ0QZAIaigCAEEDdEHI4wdqKwMAoCEBIA9BAWoiD0EERw0ACwNAIAAgDkECdEGQCGooAgBBA3RBmO4HaisDAKAhACAOQQFqIg5BBEcNAAtBACEOA0AgAiAOQQJ0QZAIaigCAEEDdEHo2QdqKwMAoCECIA5BAWoiDkEERw0AC0GQogwgASAAoCACoyIAOQMAQcihDEHw1AUrAwBBsKEMKwMAoDkDAEGIogxBgNUFKwMAQZihDCsDAKA5AwBBmKIMQZDaBisDAEGg2gYrAwBB+NsHKwMAIgGiIABBmNoGKwMAoqCgOQMAIAFBiNoGKwMAoiEAAkAgA0QAAAAAAAAhQGQEQCAAIANB+NkGKwMAoqAhAUGA2gYrAwAhAAwBC0GA2gYrAwAhAQtBoKIMIAAgAaA5AwBBgKIMQdy4BSgCACADEAkiADkDAEH42wcrAwBByKEMKwMAoSAAmqIQCCEAQaiiDEGwugUrAwBBiKIMKwMAIABEAAAAAAAA8D+go6JB2NcHKwMAoSIAOQMAAkBBsNIFKwMAIgFEAAAAAAAAAABhDQAgAUQAAAAAAADwP2EEQEGgogwrAwAhAAwBC0GYogwrAwBEAAAAAAAAAAAgAUQAAAAAAAAAQGEbIQALQbCiDCAAOQMAQfjXDUHA2wUrAwBB4NsFKwMAIgGiIgI5AwBBgNgNQYjDBisDACIDQZDDBisDACIAoEQAAAAAAADgP6IiBDkDAEG47AsgAEG4zQUrAwAiAEQAAAAAAADwP0HgwgYrAwChoiIFoiIGOQMAQaDsCyADIAWiIgM5AwBBiNgNQdiaBisDACAEoiACIAGjQdCaBisDACIBokQAAAAAAADwPyABoaCiOQMAQcDsC0HY2wcrAwAiASAGoiAAoyICOQMAQZDYDUHI7AsrAwAgAqM5AwBBqOwLIAEgA6IgAKMiADkDAEGY2A1BsOwLKwMAIACjOQMAQajYDUG42wUrAwBB2NsFKwMAIgCiIgU5AwBBsNgNQYDDBisDACIBQYjDBisDAKBEAAAAAAAA4D+iIgI5AwBBoNgNQZjYDSsDACIHQZDYDSsDAKFBiNgNKwMAokGA2A0rAwCjOQMAQYjsCyABQbjNBSsDACIDRAAAAAAAAPA/QeDCBisDAKGiIgiiIgY5AwBBuNgNQdiaBisDACIEIAKiIAUgAKNB0JoGKwMAIgCiRAAAAAAAAPA/IAChIgWgoiIJOQMAQZDsC0HY2wcrAwAiCiAGoiADoyIGOQMAQcDYDUGY7AsrAwAgBqMiBjkDAEHI2A0gCSAGIAehoiACozkDAEHQ2A1BsNsFKwMAQdDbBSsDACIHoiIJOQMAQdjYDSABQfjCBisDACIBoEQAAAAAAADgP6IiAjkDAEHg2A0gBSAAIAkgB6OioCAEIAKioiIHOQMAQfDrCyAIIAGiIgg5AwBB+OsLIAogCKIgA6MiAzkDAEHo2A1BgOwLKwMAIAOjIgM5AwBB8NgNIAcgAyAGoaIgAqM5AwBB+NgNQcjbBSsDAEHo2wUrAwAiAqIiBjkDAEGA2Q0gAUHg1AYrAwCgRAAAAAAAAOA/oiIBOQMAQYjZDSAFIAAgBiACo6KgIAQgAaKiIgA5AwBBkNkNQfjbBysDACADoSAAoiABozkDAEHQzgZB8NgHKwMAQaC5BisDACIAoyICOQMAQfjPBkGY2gcrAwAgAKMiAzkDAEHI2Q1BmOkLKwMAQeDPBSsDACIBoyIEOQMAQfDaDUHA6gsrAwAgAaMiBTkDAEHw2w1BwLwNKwMAQbCjDCsDAKAiBjkDAEH42w1ByLwNKwMAQbijDCsDAKAiBzkDAEGw3A0gBCAGoiACEAY5AwBB2N0NIAUgB6IgAxAGOQMAQcDZDUGQ6QsrAwAgAaMiAjkDAEHo2g1BuOoLKwMAIAGjIgM5AwBByM4GQejYBysDACAAoyIEOQMAQfDPBkGQ2gcrAwAgAKMiBTkDAEGo3A0gAkHw2w0rAwCiIAQQBjkDAEHQ3Q0gA0H42w0rAwCiIAUQBjkDAEG42Q1BiOkLKwMAIAGjIgI5AwBB4NoNQbDqCysDACABoyIBOQMAQcDOBkHg2AcrAwAgAKMiAzkDAEHozwZBiNoHKwMAIACjIgA5AwBBoNwNIAJB8NsNKwMAoiADEAY5AwBByN0NIAFB+NsNKwMAoiAAEAY5AwBB6N4NQajYCysDAEHYzwUrAwAiAKM5AwBBkOANQdDZCysDACAAozkDAEEAIQ5B4N4NQaDYCysDAEHYzwUrAwAiAaM5AwBBiOANQcjZCysDACABozkDAEHI4Q1B6N4NKwMAIAFBoLkGKwMAIgChIgKiIACjQcjOBisDABAGOQMAQfDiDUGQ4A0rAwAgAqIgAKNB8M8GKwMAEAY5AwAgACAAoCIHIAGhIQFBASEPA0AgDkGoAWwiDkGg4Q1qIA5B0N4NaiIQKwMQIAKiIACjIBArAxggAaIgAKOgIA5BoM4GaisDIBAGOQMgIA9BAXEhEEEAIQ9BASEOIBANAAtBuM4GQdjYBysDACAAoyIDOQMAQQAhDkHw4w1B0McLKwMAQdDPBSsDACICoyIEOQMAQfjjDUHYxwsrAwAgAqMiBTkDAEGwzgZB0NgHKwMAIACjIgg5AwBB4M8GQYDaBysDACAAoyIGOQMAQbjhDUHg3g0rAwAgAaIgAKMgAxAGOQMAQeDiDUGI4A0rAwAgAaIgAKMgBhAGOQMAQcDlDSAFIAIgAKEiAaIgAKMgBhAGOQMAQZjkDSAEIAGiIACjIAMQBjkDAEH42QcrAwAhAUGQ5A0gBCAHIAKhIgKiIACjIAgQBjkDAEHYzwYgASAAoyIBOQMAQbjlDSAFIAKiIACjIAEQBjkDAEHQqwdB0NoFQfiaBisDACIARAAAAAAAAPA/YSIPG0HAgAYgDyAARAAAAAAAAABAYXIiDxtBgIAGIA8gAEQAAAAAAAAIQGFyIg8bQYCBBiAPIABEAAAAAAAAEEBhciIPGyEQIA8gAEQAAAAAAAAUQGFyIQ8DQCAOQQN0QdChC2ogDwR8IBAgDkEDdGorAwAFRAAAAAAAAAAACzkDACAOQQFqIg5BCEcNAAtBACEOA0AgDkEDdCIPQZCiC2ogD0HQgQZqKwMARAAAAAAAAFlAozkDACAOQQFqIg5BCEcNAAtBACEOA0AgDkEDdCIPQdCiC2ogD0GQggZqKwMARAAAAAAAAFlAozkDACAOQQFqIg5BCEcNAAtBACEPQZCjCwJ8QcDfBSsDACIBQbikBysDACIAoSICRAAAAAAAAAAAZARARAAAAAAAAPA/RAAAAAAAACTAIAKjQeD/DSsDACABIACgRAAAAAAAAOC/oqCiEAhEAAAAAAAA8D+gowwBC0QAAAAAAADwP0QAAAAAAAAAAEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqAgAGQbCzkDAEHQ5g1B+MULKwMAQZj0CysDAKJBwNIHKwMAoyIAOQMAQdjmDUHwxA0rAwAgABAGIgA5AwBB4OYNIABEAAAAAAAAAAAQBzkDAANAQQAhDkQAAAAAAAAAACEAA0AgACAPQShsQaCwC2ogDkEDdGorAwCgIQAgDkEBaiIOQQVHDQALIA9BA3RB8OYNaiAAOQMAIA9BAWoiD0EIRw0AC0Hg5w1BsLoMKwMAQbDOBSsDAKJBkNIHKwMAIgGiQeDSBSsDACIAojkDAEHQ5w0gACABQaC6DCsDAEGgzgUrAwCioqI5AwBBsOcNIAAgAUHgvAwrAwBBgM4FKwMAoqKiIgI5AwBB6OcNIAAgAUG4ugwrAwBBuM4FKwMAoqKiOQMAQdjnDSAAIAFBqLoMKwMAQajOBSsDAKKiojkDAEHI5w0gACABQfi8DCsDAEGYzgUrAwCioqI5AwBBwOcNIAAgAUHwvAwrAwBBkM4FKwMAoqKiOQMAQbjnDSAAIAFB6LwMKwMAQYjOBSsDAKKiojkDACACRAAAAAAAAAAAoCEAQQEhDgNAIAAgDkEDdEGw5w1qKwMAoCEAIA5BAWoiDkEIRw0AC0EAIQ5B8OcNIAA5AwBB+OcNIAAgAaNB0KgNKwMAo0H4zAcrAwCiQZjSBysDACIDojkDAEQAAAAAAAAAACECA0AgAiAOQQN0QbC+DGorAwCgIQIgDkEBaiIOQQhHDQALQcCdDEG4nQwrAwBEZmZmZmZm7j+gIgQ5AwBBiOgNIARByJ0MKwMAoDkDAEGA6A0gAyAAIAKjIAGjokGI0gcrAwCiOQMAQbDoDUGQuwsrAwBEAAAAAAAA8D9B4NAFKwMAoaNBsLsLKwMAoyICOQMAQZDoDUGAnAcrAwBEAAAAAAAAAMCgRAAAAAAAAABAoEQAAAAAAAAAQEHg/w0rAwBBoKUHKwMAIgREAAAAAAAA4D+ioEQAAAAAAJCfQGQiDhsiAzkDAEGg6A1B4NoGKwMARAAAAAAAAETAoEQAAAAAAABEQKBEAAAAAAAAREAgDhsiADkDAEGo6A1BoP4FKwMARJqZmZmZmbm/oESamZmZmZm5P6BEmpmZmZmZuT8gDhsiATkDAEGY6A1BuL8IKwMAIAOjOQMAQbjoDSACQfi5CysDAKFEAAAAAAAAAAAQByICOQMAQcDoDUGg/wsrAwBBwNoGKwMAoSAAoyACRAAAAAAAAPA/IAGhoiAAoxAGOQMAQaidDEGgnQwrAwBEAAAAAAAAFECgOQMAQdjoDUHY6wsrAwBBwOsLKwMAoyIAOQMAQeDoDSAAOQMAQejoDUGIpg0rAwBB2NIFKwMAIgCjIgM5AwBB8OgNIAM5AwBB+OgNIANBmJMIKwMAQfCaBisDAKOgOQMAQcjoDUHIzAUrAwBEAAAAAADAYsCgRAAAAAAAwGJAoEQAAAAAAMBiQCAOGyIDOQMAQdDoDUGokQgrAwBBwMwFKwMAoSAEoyABIAKiIAOjEAY5AwBBgOkNQaCmDSsDACAAoyIBOQMAQYjpDUGQpg0rAwAgAKMiAjkDAEGQ6Q1BgKYNKwMAIACjIgA5AwBBmOkNIAEgAiAAoKBEAAAAAAAA8D9B2MUFKwMAoaMiADkDAEGg6Q0gAEGAkwgrAwBB6NAFKwMAo0QAAAAAAADwP0HomgYrAwChoqA5AwBB6JEIQYjeBisDAEHg1AYrAwCiIgA5AwBB+JEIQfDiBisDAEHwkQgrAwAiASAAo0GI0QUrAwAQC6IiAjkDAEGQkghEAAAAAAAA8D9BkKMHKwMAQfjbBysDAKKhIgM5AwBBmJIIIAAgA6JBiJIIKwMAQYDeBisDAKNEAAAAAAAA8D8gAqMQC6IiADkDAEGo6Q0gACABoUHo1AYrAwCjOQMAQbDpDUGYzAcrAwBBkMYNKwMAQajaBSsDAKKfoiIEOQMAQbjpDUHQzQUrAwAiAkHwywcrAwAiAEGwywcrAwAiASABoKOhIgU5AwBBwOkNAnwgBUGYxg0rAwAiA2MEQEGozAcrAwAgACAAoiABRAAAAAAAABDAoqOgDAELQajMBysDACIFIAIgA2QNABogACADIAKhIgCiIAEgACAAoqIgBaCgCyIAOQMAQcjpDSAEIACgIgA5AwBB0OkNIABE7zn6/kIu5j+iOQMAQdjpDUHQ6Q0rAwBB6NQFKwMAoyIAOQMAQaCSCEGYkggrAwBB4NQGKwMAozkDAEHg6Q0gAEH42wcrAwAiAqI5AwBB6OkNQbjMBysDAEHAywcrAwBBiMYNKwMAIgNBqNoFKwMAIgCinyIBokGAzAcrAwAgAEGQxg0rAwAiBKKfoqCgIgU5AwBB8OkNIAUgASAAQcjNBSsDACIFop+hoiIAOQMAQfjpDUHI6Q0rAwBBmMYNKwMAQdDNBSsDAKMQD6IiATkDAEGA6g0gAEGYvg0rAwBBqMYNKwMAIAGgoKAiADkDAEGI6g0gADkDAEH4ogxB8KIMKwMAQeiiDCsDAKMiADkDAEGAowxBqMsHKwMAIABB4KMGKwMAo0HoywcrAwCaohAIojkDAEGIlQhB+JQIKwMAIgFBgJUIKwMAoDkDAEGQlQhBiJQIKwMAQbCUCCsDACIAozkDAEHQlQggAUHIlQgrAwCgOQMAQdiVCEGQlAgrAwAgAKM5AwBB0JcIQcCXCCsDAEHIlwgrAwCgOQMAQdiXCEGwlggrAwAiAUGolAgrAwCiIACjOQMAQYiXCEH4lggrAwBBgJcIKwMAoDkDAEGQlwggAUGglAgrAwCiIACjOQMAQaiWCEGYlggrAwBBoJYIKwMAoDkDAEG4lgggAUGYlAgrAwCiIACjOQMAQfiTCEHokwgrAwBB8JMIKwMAoDkDAEG4lAhBgJQIKwMAIACjOQMAQZDqDSACQdDcBSsDAKIiADkDAEHozQUrAwAhAUHI3AUrAwAhAiADIAWhQfjbBSsDAKJEAAAAAAAA8D+gEA8hAyACIAQgAaGiRAAAAAAAAPA/oBAPIQFBmOoNQbDaBisDACADIAGgoCIBOQMAQaDqDSAAIAGgEAg5AwBBqOoNQdCRCCsDAEHgmQgrAwCiIgA5AwBBsOoNIABBwJ0NKwMAoTkDAEG46g1B6JIIKwMAQZDDBisDAKMiADkDAEHA6g1B2JIIKwMAQYjDBisDAKMiATkDAEHI6g0gASAAoUH41w0rAwCiQYDYDSsDAKM5AwBBACEPQdDqDUHIkggrAwBBgMMGKwMAoyIAOQMAQeDqDUG4kggrAwBB+MIGKwMAoyIBOQMAQfDqDUHwkQgrAwBB4NQGKwMAoyICOQMAQdjqDSAAQcDqDSsDAKFBqNgNKwMAokGw2A0rAwCjOQMAQejqDSABIAChQdDYDSsDAKJB2NgNKwMAozkDAEH46g0gAiABoUH42A0rAwCiQYDZDSsDAKM5AwBEAAAAAAAAAAAhAANAQQAhDgNAIAAgDkEDdCIQIA9BqAFsIhFB4JQNamorAwAgEUHA2AdqIBBqKwMAoqAhACAOQQFqIg5BFUcNAAsgD0EBaiIPQQJHDQALQQAhD0GA6w0gAEGg2wcrAwAiAKM5AwAgAEHY1gUrAwCiQYjSBysDAKIhAEEAIQ4DQCAOQQN0IhBBkOsNaiAQQbCODWorAwAgAKM5AwAgDkEBaiIOQQhHDQALA0BEAAAAAAAAAAAhAEEAIQ4DQCAAIA5BA3RBkOsNaisDAKAhACAOQQFqIg5BCEcNAAsgD0EDdCIOQdDrDWogDkGQ6w1qKwMAIACjOQMAIA9BAWoiD0EIRw0AC0GQ7A1BoJ4NKwMAIgA5AwBBmOwNIABBqJEIKwMAIgCiIgE5AwBB+KMMQfCjDCsDACAAozkDAEHgngxB8J0MKwMAQcieDCsDACIAozkDAEHwngxBgJ4MKwMAIACjOQMAQZjBC0GIuQsrAwBBwLkLKwMAIgCjOQMAQZDBC0GAuQsrAwAgAKM5AwBBiMELQfi4CysDACAAozkDAEGAwQtB8LgLKwMAIACjOQMAQcDsDSABQYjoDSsDAKIiAjkDAEHI7A1BqJ0MKwMAQbCdDCsDAKAiADkDAEGw7A1BmJ4NKwMAQcCcDCsDAKFEAAAAAAAAAAAQByIDOQMAQaDsDUGw/QUrAwBEAAAAAAAAJMCgRAAAAAAAACRAoEQAAAAAAAAkQEHg/w0rAwBBoKUHKwMARAAAAAAAAOA/oqBEAAAAAACQn0BkIg4bIgE5AwBBqOwNQcj+BSsDAETNzMzMzMzsv6BEzczMzMzM7D+gRM3MzMzMzOw/IA4bIgQ5AwBBuOwNIANEAAAAAAAA8D8gBKGiIAGjQei5CysDAEHguQsrAwChIgMgAaMQBjkDAEHQ7A0gAyAAoyACIACjEAY5AwBBgO4NQZDuBysDAEGAwQwrAwCiOQMAQajvDUG47wcrAwBBqMIMKwMAojkDAEH47Q1BiO4HKwMAQfjADCsDAKI5AwBBoO8NQbDvBysDAEGgwgwrAwCiOQMAQfDtDUGA7gcrAwBB8MAMKwMAojkDAEGY7w1BqO8HKwMAQZjCDCsDAKI5AwBB6O0NQfjtBysDAEHowAwrAwCiOQMAQZDvDUGg7wcrAwBBkMIMKwMAojkDAEHg7Q1B8O0HKwMAQeDADCsDAKI5AwBBiO8NQZjvBysDAEGIwgwrAwCiOQMAQdjtDUHo7QcrAwBB2MAMKwMAojkDAEHQ7Q1B4O0HKwMAQdDADCsDAKI5AwBByO0NQdjtBysDAEHIwAwrAwCiOQMAQYDvDUGQ7wcrAwBBgMIMKwMAojkDAEH47g1BiO8HKwMAQfjBDCsDAKI5AwBB8O4NQYDvBysDAEHwwQwrAwCiOQMAQcDtDUHQ7QcrAwBBwMAMKwMAojkDAEHo7g1B+O4HKwMAQejBDCsDAKI5AwBBuO0NQcjtBysDAEG4wAwrAwCiOQMAQeDuDUHw7gcrAwBB4MEMKwMAojkDAEGw7Q1BwO0HKwMAQbDADCsDAKI5AwBB2O4NQejuBysDAEHYwQwrAwCiOQMAQajtDUG47QcrAwBBqMAMKwMAojkDAEHQ7g1B4O4HKwMAQdDBDCsDAKI5AwBBoO0NQbDtBysDAEGgwAwrAwCiOQMAQcjuDUHY7gcrAwBByMEMKwMAojkDAEGY7Q1BqO0HKwMAQZjADCsDAKI5AwBBwO4NQdDuBysDAEHAwQwrAwCiOQMAQZDtDUGg7QcrAwBBkMAMKwMAojkDAEG47g1ByO4HKwMAQbjBDCsDAKI5AwBBiO0NQZjtBysDAEGIwAwrAwCiOQMAQbDuDUHA7gcrAwBBsMEMKwMAojkDAEGA7Q1BkO0HKwMAQYDADCsDAKI5AwBBqO4NQbjuBysDAEGowQwrAwCiOQMAQdDwDUHA4wcrAwBBgMEMKwMAojkDAEH48Q1B6OQHKwMAQajCDCsDAKI5AwBByPANQbjjBysDAEH4wAwrAwCiOQMAQfDxDUHg5AcrAwBBoMIMKwMAojkDAEHA8A1BsOMHKwMAQfDADCsDAKI5AwBB6PENQdjkBysDAEGYwgwrAwCiOQMAQbjwDUGo4wcrAwBB6MAMKwMAojkDAEHg8Q1B0OQHKwMAQZDCDCsDAKI5AwBBsPANQaDjBysDAEHgwAwrAwCiOQMAQdjxDUHI5AcrAwBBiMIMKwMAojkDAEGo8A1BmOMHKwMAQdjADCsDAKI5AwBB0PENQcDkBysDAEGAwgwrAwCiOQMAQaDwDUGQ4wcrAwBB0MAMKwMAojkDAEHI8Q1BuOQHKwMAQfjBDCsDAKI5AwBBmPANQYjjBysDAEHIwAwrAwCiOQMAQcDxDUGw5AcrAwBB8MEMKwMAojkDAEGQ8A1BgOMHKwMAQcDADCsDAKI5AwBBuPENQajkBysDAEHowQwrAwCiOQMAQYjwDUH44gcrAwBBuMAMKwMAojkDAEGw8Q1BoOQH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BUKAgICAgICKwMAANwMAQai8BUKAgICAgID20cAANwMAQZC+BUKAgICAqKnFrcEANwMAQYi+BUKAgICAwMvyr8EANwMAQYC+BUKAgICA+I2qscEANwMAQfi9BUKAgICAiOjassEANwMAQfC9BUKAgICAgICA+D83AwBB6L0FQoCAgICAgID4PzcDAEHYvQVCgICAgICA4LDAADcDAEHQvQVCgICAgICA4MLAADcDAEHIvQVCgICAgICA6NPAADcDAEHAvQVCgICAgIDg9OLAADcDAEG4vQVCgICAgICgivLAADcDAEGwvQVCgICAgICMov7AADcDAEGovQVCgICAgMDYoInBADcDAEGgvQVCgICAgKD+lZLBADcDAEGYvQVCgICAgID7zZnBADcDAEGQvQVCgICAgKDHyZ7BADcDAEGIvQVCgICAgID0iKLBADcDAEGAvQVCgICAgODJrqXBADcDAEH4vAVCgICAgPjTxqjBADcDAEHwvAVCgICAgMCszKrBADcDAEHovAVCgICAgKD94KzBADcDAEHgvAVCgICAgPjm/K7BADcDAEHYvAVCgICAgMD95LDBADcDAEHQvAVCgICAgKC6i7LBADcDAEHIvAVCgICAgOCGrrPBADcDAEHAvAVCgICAgICAgPg/NwMAQYi/BUKAgICAgICA+D83AwBBgMAFQoCAgICA2I7swAA3AwBB+L8FQoCAgICAgNz3wAA3AwBB8L8FQoCAgICAzNGAwQA3AwBB6L8FQoCAgICAt5SIwQA3AwBB4L8FQoCAgICAlLCMwQA3AwBB2L8FQoCAgICgvsaQwQA3AwBB0L8FQoCAgIDgxqyTwQA3AwBByL8FQoCAgIDAicOWwQA3AwBBwL8FQoCAgICA4f+YwQA3AwBBuL8FQoCAgIDA1OqawQA3AwBBsL8FQoCAgIDA1tucwQA3AwBBqL8FQoCAgIDgyfaewQA3AwBBoL8FQoCAgICAgID4PzcDAEGYvwVCgICAgICAgPg/NwMAQZC/BUKAgICAgICA+D83AwBBgL8FQoCAgICAgKixwAA3AwBB+L4FQoCAgICAgLTDwAA3AwBB8L4FQoCAgICAgMXUwAA3AwBB6L4FQoCAgICA0MrjwAA3AwBB4L4FQoCAgICAxNnywAA3AwBB2L4FQoCAgICAqJL/wAA3AwBB0L4FQoCAgICA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zZmz5syZs/o/NwMAQdjFBULmzJmz5syZ8z83AwBBoMYFQubMmbPmzJn3PzcDAEHYxwVCgICAwIGL9tjBADcDAEH4yAVCgICAgIDytoDBADcDAEHwyAVCgICAgIC3pJjBADcDAEHoyAVCgICAgLjS2qnBADcDAEHgyAVCgICAgNDG5bXBADcDAEHYyAVCgICAgMCsxrzBADcDAEHQyAVCgICAgOKEm8PBADcDAEHIyAVCgICAgMqx1sfBADcDAEHAyAVCgICAgOuNz8nBADcDAEG4yAVCgICAgK7pv8vBADcDAEGwyAVCgICAgP6Mx8zBADcDAEGoyAVCgICAgMDY8c/BADcDAEGgyAVCgICAgOya99HBADcDAEGYyAVCgICAgKmkhtPBADcDAEGQyAVCgICAgI+B19TBADcDAEGIyAVCgICAgPLNg9bBADcDAEGAyAVCgICAgMHY5tbBADcDAEH4xwVCgICAgM+UidfBADcDAEHwxwVCgICAgOmIrdjBADcDAEHoxwVCgICAwK+lhNnBADcDAEHgxwVCgICAwLay8djBADcDAEHAxgVCgICAgKufxdnBADcDAEG4xgVCgICAgJnGutnBADcDAEGwxgVCgICAgPuuxdnBADcDAEHQxwVCgICAgICwie/AADcDAEHIxwVCgICAgICVl4nBADcDAEHAxwVCgICAgOCcoZ7BADcDAEG4xwVCgICAgMiYma3BADcDAEGwxwVCgICAgPCwlbfBADcDAEGoxwVCgICAgIDY1L/BADcDAEGgxwVCgICAgMbo28TBADcDAEGYxwVCgICAgKyEw8jBADcDAEGQxwVCgICAgKPT3srBADcDAEGIxwVCgICAgKbgmczBADcDAEGAxwVCgICAgIqv28/BADcDAEH4xgVCgICAgOCe99HBADcDAEHwxgVCgICAgLqVl9PBADcDAEHoxgVCgICAgPbS9tTBADcDAEHgxgVCgICAgNq/tNbBADcDAEHYxgVCgICAgOWJptfBADcDAEHQxgVCgICAgIni2NfBADcDAEHIxgVCgICAwPCo4NjBADcDAEGAyQVCgICAgICAgPg/NwMAQaDLBULNmbPmzJmz+D83AwBBmMsFQp+Kro+F18f4PzcDAEGQywVCn4quj4XXx/g/NwMAQYjLBUKfiq6PhdfH+D83AwBBgMsFQp+Kro+F18f4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vPrKspnEg4HAADcDAEHw0wVCvPrKspnEg4HAADcDAEH40wVCgICAgICAgIDAADcDAEGA1AVCirjr3fnUjvQ/NwMAQYjUBUKKuOvd+dSO9D83AwBBkNQFQrnoorbn96fFPzcDAEGY1AVC6YyLzc6dufs/NwMAQaDUBULpjIvNzp25+z83AwBBqNQFQoCAgICAgICAwAA3AwBBsNQFQoCAgICAgICEwAA3AwBBuNQFQrnoorbn96fFPzcDAEHA1AVCADcDAEHI1AVCgICAgICAgJLAADcDAEHQ1AVCgICAgICAwJTAADcDAEHY1AVCgICAgICAgJrAADcDAEHg1AVCqtWq1arVqqDAADcDAEHo1AVCgICAgICAgITAADcDAEHw1AVCyvaN/MLJwY/AADcDAEH41AVCyvaN/MLJwY/AADcDAEGA1QVCr6vC7qXi+fI/NwMAQYjVBUKvq8LupeL58j83AwBBkNUFQpqz5syZs+bkPzcDAEGY1QVCgICAgICAgIzAADcDAEGg1QVC+v2p48vupPg/NwMAQajVBUKz5syZs+bMgMAANwMAQbjVBULcnoquj4XX8z83AwBBsNUFQoCAgICAgID4PzcDAEHI1QVCgICAgICAoKvAADcDAEHA1QVCgICAgICAgPg/NwMAQdDVBULN3JiGrMfD8T83AwBB2NUFQtnBhafS+cfgPzcDAEHg1QVCgICAgICA58/AADcDAEGo1gVCgICAgICAkMDAADcDAEGg1gVCv+r40puJprLAADcDAEGY1gVC5aGL2Z2f+cbAADcDAEGQ1gVCmcTjuvG25KPAADcDAEGI1gVCkPTZ2ern/ZvAADcDAEGA1gVCro+F18fCubDAADcDAEH41QVC+KeNr7qTt67AADcDAEHw1QVCxrnXpciPnKHAADcDAEHI1gVCgICAgICAgIrAADcDAEHA1gVCgICAgICAwKTAADcDAEG41gVCgICAgICAwJzAADcDAEGw1gVCgICAgICAgJfAADcDAEHQ1gVCgICAgOuR/P3BADcDAEHY1gVCgICAgICAtLvAADcDAEHg1gVCgICAgICAgPg/NwMAQejWBUKAgICAgIDuz8AANwMAQfDWBUKShoLWnLSR2z83AwBB+NYFQoCAgICAgNDHwAA3AwBBgNcFQoCAgICAgICSwAA3AwBBiNcFQpqz5syZs+bkPzcDAEGQ1wVCmrPmzJmz5uQ/NwMAQZjXBUKas+bMmbPm5D83AwBBoNcFQoCAgIDrkfz9wQA3AwBBqNcFQpqz5syZs+bkPzcDAEGw1wVCgICAgICAgPg/NwMAQcDXBUKAgICAgIDaz8AANwMAQbjXBUKAgICgsI29ksIANwMAQfjYBUKAgICAgID7ycAANwMAQZjaBUKAgICAgID4zsAANwMAQZDaBUKAgICAgID4zsAANwMAQYjaBUKAgICAgID4zsAANwMAQYDaBUKAgICAgID4zsAANwMAQfjZBUKAgICAgID4zsAANwMAQfDZBUKAgICAgID4zsAANwMAQejZBUKAgICAgID4zsAANwMAQeDZBUKAgICAgID4zsAANwMAQdjZBUKAgICAgID4zsAANwMAQdDZBUKAgICAgID4zsAANwMAQcjZBUKAgICAgID4zsAANwMAQcDZBUKAgICAgMCm0MAANwMAQbjZBUKAgICAgMCm0MAANwMAQbDZBUKAgICAgMCm0MAANwMAQajZBUKAgICAgMCm0MAANwMAQaDZBUKAgICAgMCm0MAANwMAQZjZBUKAgICAgMCQ0cAANwMAQZDZBUKAgICAgMC70MAANwMAQYjZBUKAgICAgID4z8AANwMAQYDZBUKAgICAgIDPzMAANwMAQYDYBUKAgICAgIDl0sAANwMAQfjXBUKAgICAgIDl0sAANwMAQfDXBUKAgICAgIDP08AANwMAQejXBUKAgICAgIC608AANwMAQeDXBUKAgICAgIDm0MAANwMAQdjXBUKAgICAgICkzcAANwMAQdDXBUKAgICAgIDCysAANwMAQfDYBUKAgICAgMCQ0cAANwMAQejYBUKAgICAgMCQ0cAANwMAQeDYBUKAgICAgMCQ0cAANwMAQdjYBUKAgICAgMCQ0cAANwMAQdDYBUKAgICAgMCQ0cAANwMAQcjYBUKAgICAgMCQ0cAANwMAQcDYBUKAgICAgMCQ0cAANwMAQbjYBUKAgICAgMCQ0cAANwMAQbDYBUKAgICAgMD60cAANwMAQajYBUKAgICAgMD60cAANwMAQaDYBUKAgICAgMD60cAANwMAQZjYBUKAgICAgMD60cAANwMAQZDYBUKAgICAgIDl0sAANwMAQYjYBUKAgICAgIDl0sAANwMAQaDaBUKAgICAgICA+D83AwBB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AwBB8KIGQoCAgICAgICAwAA3AwBB+KIGQgA3AwBBgKMGQoiHnamWgP/NPjcDAEGIowZCgICAzPf99MLCADcDAEGQowZCgICAgICA4LDAADcDAEGYogZC1MaX3cmYiPI/NwMAQZCiBkLUxpfdyZiI8j83AwBBiKIGQtTGl93JmIjyPzcDAEGAogZC1MaX3cmYiPI/NwMAQfihBkLUxpfdyZiI8j83AwBB8KEGQtTGl93JmIjyPzcDAEGYowZCmrPmzJmz5tw/NwMAQaCjBkKAgICAwPD1w8EANwMAQaijBkKAgICAgICAhMAANwMAQbCjBkKz5syZs+bM+T83AwBBuKMGQoCAgICAgICOwAA3AwBBwKMGQri9lNyeiq7HPzcDAEHIowZCzZmz5syZs+4/NwMAQdCjBkIANwMAQdijBkKAgIDgrJDnlMIANwMAQeCjBkKAgICAgICewMAANwMAQeijBkKAgICAgJChj8EANwMAQZilBkKAgICAmPSAzsEANwMAQbimBkKAgICAgICsyMAANwMAQbCmBkKAgICAgKCg2sAANwMAQaimBkKAgICAgMCi68AANwMAQaCmBkKAgICAgL60+sAANwMAQZimBkKAgICAgPHOicEANwMAQZCmBkKAgICA4IrOlcEANwMAQYimBkKAgICAsJjqoMEANwMAQYCmBkKAgICAmIvaqcEANwMAQfilBkKAgICA3K+VscEANwMAQfClBkKAgICAoN7ztcEANwMAQeilBkKAgICA7M3NucEANwMAQeClBkKAgICAoPHfvMEANwMAQdilBkKAgICA9qWUwMEANwMAQdClBkKAgICAsvmNwsEANwMAQcilBkKAgICAiu2VxMEANwMAQcClBkKAgICApM+kxsEANwMAQbilBkKAgICA7ZyxyMEANwMAQbClBkKAgICA4YXQycEANwMAQailBkKAgICA1ZPrysEANwMAQaClBkKAgICAmuSZzMEANwMAQbCkBkKAgICAwOGfwMEANwMAQaikBkKAgICA4JOcwsEANwMAQaCkBkKAgICAkvqmxMEANwMAQZikBkKAgICAmtm4xsEANwMAQZCkBkKAgICAh4G9yMEANwMAQYikBkKAgICAgcndycEANwMAQYCkBkKAgICA8bD6ysEANwMAQfijBkKAgICAwveqzMEANwMAQfCjBkKAgICA3MuUzsEANwMAQZClBkKAgICAgIC3yMAANwMAQYilBkKAgICAgOCu2sAANwMAQYClBkKAgICAgKiy68AANwMAQfikBkKAgICAgI7D+sAANwMAQfCkBkKAgICAgLPcicEANwMAQeikBkKAgICA4JrhlcEANwMAQeCkBkKAgICAwMz2oMEANwMAQdikBkKAgICAwNznqcEANwMAQdCkBkKAgICA0KCiscEANwMAQcikBkKAgICAoKKHtsEANwMAQcCkBkKAgICA/I3bucEANwMAQbikBkKAgICAnObxvMEANwMAQYCpBkLh9dHw+ui1ycAANwMAQfioBkKAgICAgNis2sAANwMAQfCoBkKAgICAgNzH6cAANwMAQeioBkLmzJmz5rTq+MAANwMAQeCoBkKAgICAgPC/hMEANwMAQdioBkKAgICAoPeNkMEANwMAQdCoBkKAgICA4Nj0mMEANwMAQcioBkKAgICAoMu1oMEANwMAQcCoBkKAgICAgLripMEANwMAQbioBkKAgICA8J3pqMEANwMAQbCoBkKAgICA2NXaq8EANwMAQaioBkKAgICAyIz+rsEANwMAQaCoBkKAgICAlKmkscEANwMAQZioBkKAgICAyNaWs8EANwMAQZCoBkKAgICAoKyPtcEANwMAQYioBkKAgICAmJ2zt8EANwMAQYCoBkKAgICAkLzruMEANwMAQfinBkKAgICA3PX5ucEANwMAQeCnBkKKro+F14eRu8AANwMAQdinBkL20fD6qLjUzcAANwMAQdCnBkKk4fXR8LqC38AANwMAQcinBkLmzJmz5uDv7cAANwMAQcCnBkKAgICAgKzo/MAANwMAQbinBkKAgICAwOaIicEANwMAQbCnBkKAgICAoJTik8EANwMAQainBkKAgICAgKP3nMEANwMAQaCnBkKAgICAsNqbpMEANwMAQZinBkKAgICA4PGhqcEANwMAQZCnBkKAgICA8NLmrMEANwMAQYinBkKAgICAuK+/sMEANwMAQYCnBkKAgICA+NfvssEANwMAQfimBkKAgICA8LG8tcEANwMAQfCmBkKAgICAxIWOuMEANwMAQeimBkKAgICApLvCucEANwMAQeCmBkKAgICAjJ+Wu8EANwMAQdimBkKAgICAwPLpvMEANwMAQdCmBkKAgICAjM24vsEANwMAQYipBkLNmbPmzJmqt8AANwMAQZirBkKAgICA8Ob3oMEANwMAQZCrBkKAgICAgPHGpcEANwMAQYirBkKAgICA4M+uqcEANwMAQYCrBkKAgICAmOG2rMEANwMAQfiqBkKAgICAkPvzr8EANwMAQfCqBkKAgICAyKvtscEANwMAQeiqBkKAgICA2Mvus8EANwMAQeCqBkKAgICA0MX2tcEANwMAQdiqBkKAgICA+JaWuMEANwMAQdCqBkKAgICArP+wucEANwMAQbCqBkLh9dHw+ui1ucAANwMAQaiqBkLmzJmz5qzNy8AANwMAQaCqBkKKro+F16fg3MAANwMAQZiqBkKAgICAgPDj68AANwMAQZCqBkKAgICAgPbw+sAANwMAQYiqBkKAgICAgLWzh8EANwMAQYCqBkKAgICA4Pv+kcEANwMAQfipBkKAgICAoMz9msEANwMAQfCpBkKAgICAwOqvosEANwMAQeipBkKAgICA4IHep8EANwMAQeCpBkKAgICAuLzvqsEANwMAQdipBkKAgICAwNm2rsEANwMAQdCpBkKAgICA+OGdscEANwMAQcipBkKAgICAkKS4s8EANwMAQcCpBkKAgICA2PbitcEANwMAQbipBkKAgICAwNWKuMEANwMAQbCpBkKAgICAoMC+ucEANwMAQaipBkKAgICA+JzyusEANwMAQdirBkLk9vz+1LGRuMAANwMAQdCrBkKKro+F1+f/ycAANwMAQcirBkKF18fC65v+2sAANwMAQcCrBkLmzJmz5vSS6sAANwMAQbirBkKAgICAgO+v+cAANwMAQbCrBkKAgICAgJiihcEANwMAQairBkKAgICAoNvNkMEANwMAQaCrBkKAgICAoOW6mcEANwMAQcCtBkKAgICAwJLin8EANwMAQbitBkKAgICAsPC+ocEANwMAQbCtBkKAgICA8IOSo8EANwMAQaitBkKAgICAwPGJpcEANwMAQYCtBkLoorbn96eJp8AANwMAQfisBkKvupOxkLClucAANwMAQfCsBkLmzJmz5uyZysAANwMAQeisBkLmzJmz5pS22cAANwMAQeCsBkLNmbPmzK3a6MAANwMAQdisBkKz5syZs46p9MAANwMAQdCsBkKAgICAgKz+/8AANwMAQcisBkKAgICAgL3kiMEANwMAQcCsBkKAgICAoKKmkMEANwMAQbisBkKAgICA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QcCyBkKAgICAgICA+D83AwBBsLIGQoCAgICAgKCiwAA3AwBBqLIGQoCAgICAgOC0wAA3AwBBoLIGQoCAgICAgP7FwAA3AwBBmLIGQoCAgICAgPXUwAA3AwBBgLQGQoCAgIDg7pqvwQA3AwBB+LMGQoCAgIDQs++xwQA3AwBB8LMGQoCAgIDQxcG2wQA3AwBB6LMGQoCAgICw6uC6wQA3AwBB4LMGQoCAgICIyqy8wQA3AwBBiLUGQoCAgICAgID4PzcDAEGAtQZCgICAgICAkK/AADcDAEH4tAZCgICAgICApsHAADcDAEHwtAZCgICAgIDAnNLAADcDAEHotAZCgICAgIDQuOHAADcDAEHgtAZCgICAgIC43PDAADcDAEHYtAZCgICAgICMrPzAADcDAEHQtAZCgICAgICNgYjBADcDAEHItAZCgICAgIDM5pDBADcDAEHAtAZCgICAgKCiqJjBADcDAEG4tAZCgICAgOCfzpzBADcDAEGwtAZCgICAgICj26DBADcDAEGotAZCgICAgOCSyKPBADcDAEGgtAZCgICAgKCx5qbBADcDAEGYtAZCgICAgIDRlanBADcDAEGQtAZCgICAgOD/hKvBADcDAEGItAZCgICAgLDL+qzBADcDAEHwtQZCgICAgMCxnYjBADcDAEHotQZCgICAgMCcxo/BADcDAEHgtQZCgICAgICt5ZPBADcDAEHYtQZCgICAgODmkpjBADcDAEHQtQZCgICAgMD755rBADcDAEHItQZCgICAgICl653BADcDAEHAtQZCgICAgJCvyaDBADcDAEG4tQZCgICAgKCXqaLBADcDAEGwtQZCgICAgODnjqTBADcDAEGotQZCgICAgNCtnKbBADcDAEGgtQZCgICAgLjvlKjBADcDAEGYtQZCgICAgPi0mKnBADcDAEGQtQZCgICAgICAgPg/NwMAQdi3BkKAgICAgICA+D83AwBBsLYGQoCAgICAgID4PzcDAEHgtwZCgICAgICAgPg/NwMAQdC3BkKAgICAgICApMAANwMAQci3BkKAgICAgIDgtsAANwMAQcC3BkKAgICAgICPyMAANwMAQbi3BkKAgICAgID/1sAANwMAQbC3BkKAgICAgPDs5cAANwMAQai3BkKAgICAgMjm8cAANwMAQaC3BkKAgICAgOjb/MAANwMAQZi3BkKAgICAgP78hcEANwMAQZC3BkKAgICAgIKajcEANwMAQYi3BkKAgICAgNeBksEANwMAQYC3BkKAgICAwIHrlcEANwMAQfi2BkKAgICAoJqXmcEANwMAQfC2BkKAgICAgI3gm8EANwMAQei2BkKAgICAoNfHnsEANwMAQeC2BkKAgICA8PHhoMEANwMAQdi2BkKAgICAoPGkosEANwMAQdC2BkKAgICA4OKJpMEANwMAQci2BkKAgICA4MLupcEANwMAQcC2BkKAgICAgICA+D83AwBBuLYGQoCAgICAgID4PzcDAEGotgZCgICAgICAoKbAADcDAEGgtgZCgICAgICA2LjAADcDAEGYtgZCgICAgICAx8nAADcDAEGQtgZCgICAgICA6tjAADcDAEGItgZCgICAgIDwk+jAADcDAEGAtgZCgICAgIC0xfPAADcDAEH4tQZCgICAgID+/P7AADcDAEH4uAZCgICAgICAgJLAADcDAEHwuAZCgICAgICA4KPAADcDAEHouAZCgICAgICAgLXAADcDAEHguAZCgICAgICAgMTAADcDAEHYuAZCgICAgIDAitPAADcDAEHQuAZCgICAgICg19/AADcDAEHIuAZCgICAgICglurAADcDAEHAuAZCgICAgICYl/PAADcDAEG4uAZCgICAgICCyPrAADcDAEGwuAZCgICAgICsgYDBADcDAEGouAZCgICAgIDoiIPBADcDAEGguAZCgICAgICq2IbBADcDAEGYuAZCgICAgMCks4nBADcDAEGQuAZCgICAgID50ovBADcDAEGIuAZCgICAgMCDg47BADcDAEGAuAZCgICAgKDBnZDBADcDAEH4twZCgICAgIDP1JHBADcDAEHwtwZCgICAgICAgPg/NwMAQei3BkKAgICAgICA+D83AwBBgLkGQoCAgICgmPuUwQA3AwBBiLkGQvzTxpfdyZioPzcDAEGQuQZCgICAgICAgITAADcDAEGYuQZC+6i4vZTcnto/NwMAQaC5BkKAgICAgICAisAANwMAQai5BkKAgICAgICAisAANwMAQbC5BkKAgICAgICAisAANwMAQbi5BkKAgICAgICAisAANwMAQcC5BkKAgICAgICAisAANwMAQfC5BkIANwMAQei5BkIANwMAQfi5BkEAQSgQEBpBgLsGQs/vz5re9Kb6PzcDAEH4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gICvwAA3AwBB+KIHQoCAgICAgICqwAA3AwBBgKMHQoCAgICAgMCswAA3AwBBiKMHQgA3AwBBkKMHQvr9qePL7qS0PzcDAEGYowdCmrPmzJmz5tw/NwMAQaCjB0LO0JCCnIT1+D83AwBBsKMHQgA3AwBBqKMHQubMmbPmzJn7PzcDAEG4owdCADcDAEHAowdCADcDAEHIowdCgICAgICAgPg/NwMAQdCjB0KAgICAgICA8D83AwBB2KMHQoCAgICAgIDwPzcDAEHgowdCgICAkMrSxq7CADcDAEHoowdCgICAgICAgJ/AADcDAEHwowdCgICAgICAgIDAADcDAEH4owdCADcDAEGApAdCgICAgICAgIDAADcDAEGIpAdCgICAgICAgI7AADcDAEGQpAdCgICAgICA5cnAADcDAEGYpAdCrYbx2K7cjY0/NwMAQaCkB0KAgICAgIDkz8AANwMAQaikB0KAgICAgIDkz8AANwMAQbCkB0KAgICAgIDkz8AANwMAQbikB0KAgICAgIDkz8AANwMAQcCkB0KAgICAgIDkz8AANwMAQcikB0KAgICAgIDkz8AANwMAQdCkB0KAgICAgIDkz8AANwMAQdikB0KAgICAgIDArMAANwMAQeCkB0LNmbPmzJmz+j83AwBB+KQHQoCAgICAgICGwAA3AwBB8KQHQubMmbPmzJn7PzcDAEGIpQdCs+bMmbPmzPk/NwMAQYClB0LmzJmz5syZ8z83AwBBmKUHQpqz5syZs+bsPzcDAEGQpQdCs+bMmbPmzPE/NwMAQQAhAEGopQdCgICAgICAwKzAADcDAEGgpQdCgICAgICAgOA/NwMAQbClB0KAgICAgICA+D83AwBB6KUHQo7o14/CgoDYPzcDAEHgpQdC5eygprLk2es/NwMAQdilB0Kdv4rHg97a8T83AwBB+KYHQpqz5syZs+bsPzcDAEHwpgdC9tHw+qi4vew/NwMAQYCnB0KAgICAgICAisAANwMAQYinB0KAgICAgICAgMAANwMAQZCnB0KAgICAgICAksAANwMAQZinB0KAgICAgICAmsAANwMAQaCnB0Kz5syZs+bMg8AANwMAQainB0KAgICAgICAg8AANwMAQbCnB0KAgICAgICA+D83AwBBuKcHQoCAgICAgID4PzcDAEHApwdCgICAgICAgPg/NwMAQcinB0KAgICAgICAmcAANwMAQdCnB0KAgICAgICAisAANwMAQdinB0KAgICAgICAisAANwMAQeCnB0KAgICAgICAisAANwMAQeinB0KAgICAgICAl8AANwMAQfCnB0KAgICAgICAmsAANwMAQfinB0KAgICAgICAksAANwMAQYCoB0KAgICAgJChl8EANwMAQYioB0KAgICAgJChl8EANwMAQZCoB0KAgICAgJChl8EANwMAQZioB0LI8LWjypfMkcQANwMAA0BBACEBA0AgAEGoAWxBoKgHaiABQQN0akKAgICAgIDArMAANwMAIAFBAWoiAUEVRw0ACyAAQQFqIgBBAkcNAAtB8KoHQrefq5nTtL32PzcDAEGAqwdCgICAgICApNXAADcDAEH4qgdCgICAgIDo3ZXBADcDAEGIqwdCgICAgPKLqPnBADcDAEHIqwdC0vD6qLi9lOQ/NwMAQcCrB0LD66Ph9dHw4j83AwBBuKsHQrPmzJmz5szpPzcDAEGwqwdC+v2p48vupNQ/NwMAQairB0L6/anjy+6kxD83AwBBoKsHQpqz5syZs+bcPzcDAEGYqwdCm970puKg4No/NwMAQZCrB0L6/anjy+6k3D83AwBBiKwHQrGQsOWhi9ndPzcDAEGArAdCz+/Pmt70puI/NwMAQfirB0K25/enja+64z83AwBB8KsHQvT708aX3cnYPzcDAEHoqwdCnImDgauO2sg/NwMAQeCrB0KF18fC66Ph5T83AwBB2KsHQuiituf3p43fPzcDAEHQqwdCyMLro+H10eA/NwMAQZCsB0KAgICAgOjdlcEANwMAQZisB0KNwLeBiZT+2D83AwBBoKwHQtLf/brgucbQPzcDAEGorAdCjo3At4GJlNY/NwMAQbCsB0LTrIbx2K7cvT83AwBBqK4HQgA3AwBBoK4HQuyj4fXR8PrgPzcDAEGwrgdCADcDAEHgrwdCADcDAEG4rgdC1MaX3cmYiPA/NwMAQeivB0IANwMAQQAhAEEAIQFB+KwHQuWhi9md35/tPzcDAEHwrAdCu76/6vjSm4PAADcDAEHorAdCADcDAEHgrAdCiq6PhdfHwus/NwMAQaCxB0IANwMAQfivB0Lwz5re9Kbi4D83AwBB8K8HQgA3AwBBqLEHQgA3AwBBsLEHQgA3AwBBuLEHQgA3AwADQCABQcABbEHo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IAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhAgAgwBCyAAQQA2AhwgAEIANwMQIAAgACgCAEEgcjYCAEEAIAdBAkYNABogAiABKAIEawshBCADQSBqJAAgBAtBAQF/IwBBEGsiAyQAIAAoAjwgAacgAUIgiKcgAkH/AXEgA0EIahABEB0hACADKQMIIQEgA0EQaiQAQn8gASAAGwsQAEGWCkGjAUHQIygCABAiCwkAIAAoAjwQBAsyAQF/IAAoAhQiAyABIAIgACgCECADayIBIAEgAksbIgEQDSAAIAAoAhQgAWo2AhQgAguTBQIGfgF/IAEgASgCAEEHakF4cSIBQRBqNgIAIAACfCABKQMAIQQgASkDCCEFIwBBIGsiASQAAkAgBUL///////////8AgyIDQoCAgICAgMCAPH0gA0KAgICAgIDA/8MAfVQEQCAFQgSGIARCPIiEIQMgBEL//////////w+DIgRCgYCAgICAgIAIWgRAIANCgYCAgICAgIDAAHwhAgwCCyADQoCAgICAgICAQH0hAiAEQoCAgICAgICACIVCAFINASACIANCAYN8IQIMAQsgBFAgA0KAgICAgIDA//8AVCADQoCAgICAgMD//wBRG0UEQCAFQgSGIARCPIiEQv////////8Dg0KAgICAgICA/P8AhCECDAELQoCAgICAgID4/wAhAiADQv///////7//wwBWDQBCACECIANCMIinIghBkfcASQ0AIAQhAiAFQv///////z+DQoCAgICAgMAAhCIDIQYCQCAIQYH3AGsiAEHAAHEEQCACIABBQGqthiEGQgAhAgwBCyAARQ0AIAYgAK0iB4YgAkHAACAAa62IhCEGIAIgB4YhAgsgASACNwMQIAEgBjcDGCABIQACQEGB+AAgCGsiCEHAAHEEQCADIAhBQGqtiCEEQgAhAwwBCyAIRQ0AIANBwAAgCGuthiAEIAitIgKIhCEEIAMgAoghAwsgACAENwMAIAAgAzcDCCABKQMIQgSGIAEpAwAiBEI8iIQhAiABKQMQIAEpAxiEQgBSrSAEQv//////////D4OEIgRCgYCAgICAgIAIWgRAIAJCAXwhAgwBCyAEQoCAgICAgICACIVCAFINACACQgGDIAJ8IQILIAFBIGokACACIAVCgICAgICAgICAf4OEvws5AwAL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2LMMKwMAEAVB6LMMKwMAEAVBsLMMKwMAEAVB0LMMKwMAEAVB4LMMKwMAEAVB6KMMKwMAEAVBwPcNKwMAEAVByPcNKwMAEAVBqPcNKwMAEAVBsPcNKwMAEAVBuPcNKwMAEAVBoPcNKwMAEAVB0KUMKwMAEAVB2OsNKwMAEAVB4OsNKwMAEAVB6OsNKwMAEAVB+OsNKwMAEAVBiOwNKwMAEAVB0OsNKwMAEAVB8OsNKwMAEAVBgOwNKwMAEAVBgOsNKwMAEAVB+OYNKwMAEAVBgOcNKwMAEAVBiOcNKwMAEAVBmOcNKwMAEAVBqOcNKwMAEAVB8OYNKwMAEAVBkOcNKwMAEAVBoOcNKwMAEAVB6LkLKwMAEAVBuOcNKwMAEAVBwOcNKwMAEAVByOcNKwMAEAVB2OcNKwMAEAVB6OcNKwMAEAVBsOcNKwMAEAVB0OcNKwMAEAVB4OcNKwMAEAVBgOgNKwMAEAVB+OcNKwMAEAVB4NAMKwMAEAVBuKoNKwMAEAVB+KkNKwMAEAVB8KkNKwMAEAVB0KkNKwMAEAVBkLsNKwMAEAVBoKoNKwMAEAVBmKoNKwMAEAVBuMYNKwMAEAVB8MwMKwMAEAVBqNsHKwMAEAVB0K0MKwMAEAVBsMYNKwMAEAVBqMYNKwMAEAVBwKYNKwMAEAVB2KUNKwMAEAVBuKYNKwMAEAVBgMYNKwMAEAVBkP8LKwMAEAVB2MINKwMAEAVB0MINKwMAEAVByMINKwMAEAVBsMINKwMAEAVBoMINKwMAEAVBwMENKwMAEAVB6L4NKwMAEAVB4L4NKwMAEAVB2L4NKwMAEAVB0L4NKwMAEAVBoP8LKwMAEAVBkL0NKwMAEAVBiL0NKwMAEAVBgL0NKwMAEAVB+LwNKwMAEAVBsP8LKwMAEAVBuLwNKwMAEAVBiLwNKwMAEAVBgLwNKwMAEAVB8LsNKwMAEAVBoNsHKwMAEAVBwLANKwMAEAVBiJANKwMAEAVBkJANKwMAEAVBmJANKwMAEAVBqJANKwMAEAVBuJANKwMAEAVBgJANKwMAEAVBoJANKwMAEAVBsJANKwMAEAVB0I0NKwMAEAVB2KoNKwMAEAVB+NsHKwMAEAVB8KMMKwMAEAVByKgNKwMAEAVBwKgNKwMAEAVBsKgNKwMAEAVBqKgNKwMAEAVBoKcNKwMAEAVBwKUNKwMAEAVB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IAENAAsDQCAKQagBbCIBQcDYB2oiACAAKwMIIAFBoM4GaiIAKwMAIAArAwihIAFB0PQNaisDCKEgA6KgOQMIQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMQIAFBoM4GaiIAKwMIIAArAxChIAFB0PQNaisDEKEgA6KgOQMQQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcDYB2oiACAAKwMYIAFBoM4GaiIAKwMQIAArAxihIAFB0PQNaisDGKEgA6KgOQMYQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMgIAFBoM4GaiIAKwMYIAArAyChIAFB0PQNaisDIKEgA6KgOQMgQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcDYB2oiACAAKwMoIAFBoM4GaiIAKwMgIAArAyihIAFB0PQNaisDKKEgA6KgOQMoQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwMwIAFBoM4GaiIAKwMoIAArAzChIAFB0PQNaisDMKEgA6KgOQMwQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcDYB2oiACAAKwM4IAFBoM4GaiIAKwMwIAArAzihIAFB0PQNaisDOKEgA6KgOQM4QQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwNAIAFBoM4GaiIAKwM4IAArA0ChIAFB0PQNaisDQKEgA6KgOQNAQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcDYB2oiACAAKwNIIAFBoM4GaiIAKwNAIAArA0ihIAFB0PQNaisDSKEgA6KgOQNIQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwNQIAFBoM4GaiIAKwNIIAArA1ChIAFB0PQNaisDUKEgA6KgOQNQQQEhAiAKQQFxIQBBACEKIAANAAsDQCAKQagBbCIBQcDYB2oiACAAKwNYIAFBoM4GaiIAKwNQIAArA1ihIAFB0PQNaisDWKEgA6KgOQNYQQEhCiACQQFxIQBBACECIAANAAsDQCACQagBbCIBQcDYB2oiACAAKwNgIAFBoM4GaiIAKwNYIAAr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QCAAQagBbCICQdDnB2oiACAAKwNYIAJB4KUMaiIAKwNQIAJBgPINaisDWKEgACsDWKEgBKKgOQNYQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwNgIAJB4KUMaiIBKwNYIAJBgPINaisDYKEgASsDYKEgBKKgOQNgQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdDnB2oiACAAKwNoIAJB4KUMaiIAKwNgIAJBgPINaisDaKEgACsDaKEgBKKgOQNoQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwNwIAJB4KUMaiIBKwNoIAJBgPINaisDcKEgASsDcKEgBKKgOQNwQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQdDnB2oiACAAKwN4IAJB4KUMaiIAKwNwIAJBgPINaisDeKEgACsDeKEgBKKgOQN4QQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwOAASACQeClDGoiASsDeCACQYDyDWorA4ABoSABKwOAAaEgBKKgOQOAAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHQ5wdqIgAgACsDiAEgAkHgpQxqIgArA4ABIAJBgPINaisDiAGhIAArA4gBoSAEoqA5A4gBQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQdDnB2oiASABKwOQASACQeClDGoiASsDiAEgAkGA8g1qKwOQAaEgASsDkAGhIASioDkDkAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB0OcHaiIAIAArA5gBIAJB4KUMaiIAKwOQASACQYDyDWorA5gBoSAAKwOYAaEgBKKgOQOYAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHQ5wdqIgEgASsDoAEgAkHgpQxqIgErA5gBIAJBgPINaisDoAGhIAErA6ABoSAEoqA5A6ABQQEhASAAIQJBACEAIAINAAtBkI8IQZCPCCsDAEGw1w0rAwAgBKKgOQMAQYCPCEGAjwgrAwAgBEGg1w0rAwCioDkDAEHojghB6I4IKwMAIARBkNcNKwMAoqA5AwBB2I4IQdiOCCsDACAEQYDXDSsDAKKgOQMAQfDGC0HwxgsrAwBBgNENKwMAQYDHCysDAKEg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mQxqIgogCisDACADIAtB0MsGaisDAJogC0GwwgxqKwMAoaKgOQMAIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfCZDGoiASABKwMIIAMgAkHQywZqIgErAwAgASsDCKEgAkGwwgxqKwMIoaKgOQMIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMQIAMgAkHQywZqIgArAwggACsDEKEgAkGwwgxqKwMQoaKgOQMQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwMYIAMgAkHQywZqIgErAxAgASsDGKEgAkGwwgxqKwMYoaKgOQMYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMgIAMgAkHQywZqIgArAxggACsDIKEgAkGwwgxqKwMgoaKgOQMgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwMoIAMgAkHQywZqIgErAyAgASsDKKEgAkGwwgxqKwMooaKgOQMoQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwMwIAMgAkHQywZqIgArAyggACsDMKEgAkGwwgxqKwMwoaKgOQMwQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwM4IAMgAkHQywZqIgErAzAgASsDOKEgAkGwwgxqKwM4oaKgOQM4QQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNAIAMgAkHQywZqIgArAzggACsDQKEgAkGwwgxqKwNAoaKgOQNAQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNIIAMgAkHQywZqIgErA0AgASsDSKEgAkGwwgxqKwNIoaKgOQNIQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNQIAMgAkHQywZqIgArA0ggACsDUKEgAkGwwgxqKwNQoaKgOQNQQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNYIAMgAkHQywZqIgErA1AgASsDWKEgAkGwwgxqKwNYoaKgOQNYQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfCZDGoiACAAKwNgIAMgAkHQywZqIgArA1ggACsDYKEgAkGwwgxqKwNgoaKgOQNgQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwNoIAMgAkHQywZqIgErA2AgASsDaKEgAkGwwgxqKwNooaKgOQNoQQEhASAAIQJBACEAIAINAAtBACEBQQAhDEGgpQcrAwAhBEEBIQBBASECA0AgDEGoAWwiC0HwmQxqIgogCisDcCALQdDLBmoiCisDaCAKKwNwoSALQbDCDGorA3ChIASioDkDcCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHwmQxqIgEgASsDeCACQdDLBmoiASsDcCABKwN4oSACQbDCDGorA3ihIASioDkDeEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmQxqIgAgACsDgAEgAkHQywZqIgArA3ggACsDgAGhIAJBsMIMaisDgAGhIASioDkDgAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJB8JkMaiIBIAErA4gBIAJB0MsGaiIBKwOAASABKwOIAaEgAkGwwgxqKwOIAaEgBKKgOQOIAUEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHwmQxqIgAgACsDkAEgAkHQywZqIgArA4gBIAArA5ABoSACQbDCDGorA5ABoSAEoqA5A5ABQQEhACABIQJBACEBIAINAAsDQCABQagBbCICQfCZDGoiASABKwOYASACQdDLBmoiASsDkAEgASsDmAGhIAJBsMIMaisDmAGhIASioDkDmAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8JkMaiIAIAArA6ABIAJB0MsGaiIAKwOYASAAKwOgAaEgAkGwwgxqKwOgAaEgBKKgOQOgAUEBIQAgASECQQAhASACDQALQfDsB0Hw7AcrAwAgBEQAAAAAAAAAAKIiA6A5AwBBmO4HQZjuBysDACADoDkDAEGA7QdBgO0HKwMAIAOgOQMAQYjtB0GI7QcrAwAgA6A5AwBBqO4HQajuBysDACADoDkDAEGw7gdBsO4HKwMAIAOgOQMAQQEhAkEAIQwDQCAMQagBbCILQfDsB2oiCiAKKwMgIAtBgNwNaisDICALQeDsDWorAyChIAtBgKsMaisDIKEgBKKgOQMgIAIhCkEAIQJBASEMIAoNAAsDQCABQagBbCICQfDsB2oiASABKwMoIAJBgNwNaisDKCACQeDsDWorAyihIAJBgKsMaiIBKwMooSABKwMgoCAEoqA5AyhBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8OwHaiIAIAArAzAgAkGA3A1qKwMwIAJB4OwNaisDMKEgAkGAqwxqIgArAzChIAArAyigIASioDkDMEEBIQAgASECQQAhASACDQALQfjsB0H47AcrAwAgA6A5AwBBoO4HQaDuBysDACADoDkDAEEBIQJBACEMA0AgDEGoAWwiC0Hw7AdqIgogCisDOCALQYCrDGoiCisDMCALQeDsDWorAzihIAorAzihIASioDkDOCACIQpBACECQQEhDCAKDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDQCACQYCrDGoiASsDOCACQeDsDWorA0ChIAErA0ChIASioDkDQEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDSCACQYCrDGoiACsDQCACQeDsDWorA0ihIAArA0ihIASioDkDSEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDUCACQYCrDGoiASsDSCACQeDsDWorA1ChIAErA1ChIASioDkDUEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDWCACQYCrDGoiACsDUCACQeDsDWorA1ihIAArA1ihIASioDkDWEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDYCACQYCrDGoiASsDWCACQeDsDWorA2ChIAErA2ChIASioDkDYEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDaCACQYCrDGoiACsDYCACQeDsDWorA2ihIAArA2ihIASioDkDaEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDcCACQYCrDGoiASsDaCACQeDsDWorA3ChIAErA3ChIASioDkDcEEBIQEgACECQQAhACACDQALA0AgAEGoAWwiAkHw7AdqIgAgACsDeCACQYCrDGoiACsDcCACQeDsDWorA3ihIAArA3ihIASioDkDeEEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDgAEgAkGAqwxqIgErA3ggAkHg7A1qKwOAAaEgASsDgAGhIASioDkDgAFBASEBIAAhAkEAIQAgAg0ACwNAIABBqAFsIgJB8OwHaiIAIAArA4gBIAJBgKsMaiIAKwOAASACQeDsDWorA4gBoSAAKwOIAaEgBKKgOQOIAUEBIQAgASECQQAhASACDQALA0AgAUGoAWwiAkHw7AdqIgEgASsDkAEgAkGAqwxqIgErA4gBIAJB4OwNaisDkAGhIAErA5ABoSAEoqA5A5ABQQEhASAAIQJBACEAIAINAAsDQCAAQagBbCICQfDsB2oiACAAKwOYASACQYCrDGoiACsDkAEgAkHg7A1qKwOYAaEgACsDmAGhIASioDkDmAFBASEAIAEhAkEAIQEgAg0ACwNAIAFBqAFsIgJB8OwHaiIBIAErA6ABIAJBgKsMaiIBKwOYASACQeDsDWorA6ABoSABKwOgAaEgBKKgOQOgAUEBIQEgACECQQAhACACDQALQcjwC0HI8AsrAwBB4PcNKwMAIASioTkDAEHw8wtB8PMLKwMAIARBiKsNKwMAQeDmDSsDAKGioDkDAEHwjQhB8I0IKwMAQaClBysDACIIQbDWDSsDAKKgOQMAQfj2C0H49gsrAwAgCEH4qg0rAwBByL4NKwMAoaKgOQMAQcCcDEHAnAwrAwAgCEH4/g0rAwBBuOwNKwMAoKKgOQMAQcicDEHInAwrAwAgCEHAnQ0rAwBBuJ0NKwMAoEGonQ0rAwCgQcjBDSsDAKFBmJ0NKwMAoaKgOQMAQeCNCEHgjQgrAwAgCEGg1g0rAwCioDkDAEGg/AtBoPwLKwMAIAhBwMMNKwMAQeCcDSsDAKGioDkDAEG4nQxBuJ0MKwMAIgMgCEGgxgUrAwBEZmZmZmZm7r+gRAAAAAAAAAAAIAhEAAAAAAAA4D+iQeD/DSsDAKAiBEQAAAAAAJCfQGQiABsgA6GioDkDAEGYtAhBmLQIKwMAIgMgCEHg1wYrAwBBkLQIKwMAoUQAAAAAAAAAACAEQeC9BisDAEQAAAAAAJCfQKBkGyADoUGAoAcrAwCjoqA5AwBBiPYLQYj2CysDACIDIAhBgNkGKwMARAAAAAAAABjAoEQAAAAAAAAAACAAGyADoaKgOQMAQZj2C0GY9gsrAwAiAyAIQZDZBisDAEGQ9gsrAwChRAAAAAAAAAAAIARBwNoFKwMARAAAAAAAkJ9AoGQbIgYgA6FB+J8HKwMAIgSjoqA5AwBBsPgLQbD4CysDACIDIAggBiADoSAEo6KgOQMAQdiiDCsDACEGQbjXBSsDACEEQcDXBSsDABAtIQNB2KIMIAZBoKUHKwMAIgYgBCADokHYogwrAwChRAAAAAAAAOA/oqKgOQMAQYijDEGIowwrAwAiAyAGQYCjDCsDACADoUQAAAAAAAAIQKOioDkDAEHgkwhB4JMIKwMAIgMgBkGY3QYrAwBEmpmZmZmZ6b+gRAAAAAAAAAAAIAZEAAAAAAAA4D+iQeD/DSsDAKAiBEQAAAAAAJCfQGQiABsgA6GioDkDAEGQlghBkJYIKwMAIgMgBkGg3QYrAwBEexSuR+F67L+gRAAAAAAAAAAAIAAbIAOhoqA5AwBB8JYIQfCWCCsDACIDIAZBqN0GKwMAREjhehSuR+G/oEQAAAAAAAAAACAAGyADoaKgOQMAQbiXCEG4lwgrAwAiAyAGQbDdBisDAEQzMzMzMzPjv6BEAAAAAAAAAAAgABsgA6GioDkDAEHwlAhB8JQIKwMAIgMgBkG43QYrAwBEAAAAAAAA8L+gRAAAAAAAAAAAIAAbIAOhoqA5AwBB8JMIQfCTCCsDACIDIAZBkN4GKwMAQeiTCCsDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZCIAGyADoUHonwcrAwAiBKOioDkDAEGglghBoJYIKwMAIgMgBkGY3gYrAwBBmJYIKwMAoUQAAAAAAAAAACAAGyADoSAEo6KgOQMAQYCXCEGAlwgrAwAiAyAGQaDeBisDAEH4lggrAwChRAAAAAAAAAAAIAAbIAOhIASjoqA5AwBByJcIQciXCCsDACIDIAZBqN4GKwMAQcCXCCsDAKFEAAAAAAAAAAAgABsgA6EgBKOioDkDAEHIlQhByJUIKwMAIgMgBkGw3gYrAwBB+JQIKwMAoUQAAAAAAAAAACAAGyADoSAEo6KgOQMAQZidDEGYnQwrAwBBgOMGKwMAQdjTBSsDAEQAAAAAAGigQBAKQZidDCsDAKFBuNEFKwMAo0GgpQcrAwAiBqKgOQMAQZjtC0GY7QsrAwAiAyAGQdDeBisDAEQAAAAAOJx8waBEAAAAAAAAAAAgBkQAAAAAAADgP6JB4P8NKwMAoCIERAAAAAAAkJ9AZCIAGyADoaKgOQMAQciUCEHIlAgrAwAiAyAGQdjeBisDAEQAAAAAAAD4v6BEAAAAAAAAAAAgABsgA6GioDkDAEHIlghByJYIKwMAIgMgBkHg3gYrAwBEAAAAAAAA8L+gRAAAAAAAAAAAIAAbIAOhoqA5AwBBgJUIQYCVCCsDACIDIAZBsN4GKwMAQfiUCCsDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZBsgA6FB6J8HKwMAo6KgOQMAQeiVCEHolQgrAwAiAyAGQejeBisDAEQAAAAAAAASwKBEAAAAAAAAAAAgABsgA6GioDkDAEGglQhBoJUIKwMAIgMgBkHw3gYrAwBEAAAAAAAACMCgRAAAAAAAAAAAIAAbIAOhoqA5AwBBuO8LQbjvCysDACIDQaClBysDACIHQcDRBSsDAEQAAAAAAAAYwKBEAAAAAAAAAABB4P8NKwMAIAdEAAAAAAAA4D+ioCIERAAAAAAAkJ9AZBsgA6GioDkDAEHojAhB6IwIKwMAIgMgB0GA3wYrAwBECtgORuwTwL+gRAAAAAAAAAAAIARB4NUFKwMAIgZkGyADoUGInAcrAwCjoqA5AwBB2JQIQdiUCCsDACIDIAdBkOMGKwMAQdCUCCsDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZCIAGyADoUHonwcrAwAiCKOioDkDAEHYlghB2JYIKwMAIgMgB0GI4wYrAwBB0JYIKwMAoUQAAAAAAAAAACAAGyIEIAOhIAijoqA5AwBBoJcIQaCXCCsDACIDIAcgBCADoSAIo6KgOQMAQeiXCEHolwgrAwAiAyAHIAQgA6EgCKOioDkDAEH4lQhB+JUIKwMAIgMgB0GY4wYrAwBB8JUIKwMAoUQAAAAAAAAAACAAGyADoSAIo6KgOQMAQbCVCEGwlQgrAwAiAyAHQaDjBisDAEGolQgrAwChRAAAAAAAAAAAIAAbIAOhIAijoqA5AwBB2KMMKwMAIQRB8JYHKwMAQfiWBysDAKFB6NYFKwMAIgMgBqGjIAYgAxAKIQNB2KMMIARBoKUHKwMAIgQgA0HYowwrAwChRAAAAAAAABRAo6KgOQMAQfjwC0H48AsrAwAiAyAEQbiWBysDAEHw8AsrAwChRAAAAAAAAAAAIAREAAAAAAAA4D+iQeD/DSsDAKBBwNoFKwMARAAAAAAAkJ9AoGQbIAOhQfifBysDAKOioDkDAEHg1wcrAwAhBER7FK5H4XpkP0QAAAAAAGifQEQAAAAAAOCfQBAKIQNB4NcHIARBoKUHKwMAIgYgA0Hg1wcrAwChRAAAAAAAAOA/oqKgOQMAQejwC0Ho8AsrAwAiAyAGQZDfBisDAEQAAAAAAADgv6BEAAAAAAAAAAAgBkQAAAAAAADgP6JB4P8NKwMAoCIERAAAAAAAkJ9AZCIBGyADoaKgOQMAQbi/C0G4vwsrAwAiAyAGQcCWBysDAEGwvwsrAwChRAAAAAAAAAAAIARBwNoFKwMARAAAAAAAkJ9AoGQiABsgA6FB+J8HKwMAIgSjoqA5AwBBkL4LQZC+CysDACIDIAZB2JYHKwMAQYi+CysDAKFEAAAAAAAAAAAgABsgA6EgBKOioDkDAEHovAtB6LwLKwMAIgMgBkHolgcrAwBB4LwLKwMAoUQAAAAAAAAAACAAGyADoSAEo6KgOQMAQai/C0GovwsrAwAiAyAGQZjfBisDAEQAAAAAAAAkwKBEAAAAAAAAAAAgARsgA6GioDkDAEGAvgtBgL4LKwMAIgMgBkGg3wYrAwBEMzMzMzMz07+gRAAAAAAAAAAAIAEbIAOhoqA5AwBB2LwLQdi8CysDACIDIAZBqN8GKwMARAAAAAAAACTAoEQAAAAAAAAAACABGyADoaKgOQMAQYikDEGIpAwrAwAiAyAGQeibBysDAEQAAACilBpdwqBEAAAAAAAAAAAgARsgA6GioDkDAEHo1wcrAwAhBER7FK5H4XpkP0QAAAAAAECfQEQAAAAAALifQBAKIQNB6NcHIARBoKUHKwMAIgYgA0Ho1wcrAwChRAAAAAAAAOA/oqKgOQMAQfDvC0Hw7wsrAwAiAyAGQaifBysDAESamZmZmZm5v6BEAAAAAAAAAAAgBkQAAAAAAADgP6JB4P8NKwMAoCIERAAAAAAAkJ9AZCIBGyADoaKgOQMAQYDwC0GA8AsrAwAiAyAGQZijBysDAEH47wsrAwChRAAAAAAAAAAAIARBwNoFKwMARAAAAAAAkJ9AoGQiABsgA6FB6J8HKwMAIgSjoqA5AwBByPMLQcjzCysDACIDIAZBoKMHKwMAQcDzCysDAKFEAAAAAAAAAAAgABsgA6EgBKOioDkDAEHY9gtB2PYLKwMAIgMgBkGoowcrAwBB0PYLKwMAoUQAAAAAAAAAACAAGyADoSAEo6KgOQMAQbjzC0G48wsrAwAiAyAGQcCfBysDAEROKETAIdTxv6BEAAAAAAAAAAAgARsgA6GioDkDAEGApAxBgKQMKwMAIgMgBkH4owwrAwAgA6FEAAAAAAAAJECjoqA5AwBBuJAIQbiQCCsDACIDIAZBsJAIKwMAIAOhQcDIBysDACIEo6KgOQMAQdCQCEHQkAgrAwAiAyAGQaDbBysDACADoSAEo6KgOQMAQcj2C0HI9gsrAwAiAyAGQdCfBysDAERmZmZmZmb2v6BEAAAAAAAAAAAgARsgA6GioDkDAEHw1wcrAwAhBER7FK5H4XpkP0QAAAAAAGifQEQAAAAAAOCfQBAKIQNB8NcHIARBoKUHKwMAIANB8NcHKwMAoUQAAAAAAADgP6KioDkDAEEAIQBBqKQMQaikDCsDACIDQaClBysDACIJQfCjDCsDACADoUGgpAwrAwCjoqA5AwBBqPALQajwCysDACIDIAlB+KoHKwMARAAAAABAdyvBoEQAAAAAAAAAAEHg/w0rAwAgCUQAAAAAAADgP6KgIgVEAAAAAACQn0BkIgEbIAOhoqA5AwBBmKQMQZikDCsDACIDIAlB4KMHKwMAQZCkDCsDAKFEAAAAAAAAAAAgBUHA2gUrAwBEAAAAAACQn0CgZCILGyADoUHwnwcrAwAiCKOioDkDAEHgjwhB4I8IKwMAIgMgCUHwqgcrAwBEt88qM6X17L+gRAAAAAAAAAAAIAVB4NUFKwMAZCIKGyADoUGInAcrAwAiBqOioDkDAEHonAxB6JwMKwMAIgMgCUGAqwcrAwBEAAAAAACQqsCgRAAAAAAAAAAAIAEbIAOhoqA5AwBB0JwMQdCcDCsDACIDIAlBiKsHKwMARAAAACBfoPLBoEQAAAAAAAAAACABGyADoaKgOQMAQYi0CEGItAgrAwAiAyAJQciyBysDAER7FK5H4XqEv6BEAAAAAAAAAAAgARsgA6GioDkDAEG4pAcrAwAhAwNAIABBA3QiAkHwpAtqIgErAwAhBCABIAQgCSADIAVjBHwgAkGwpAtqKwMAIAJBkKELaisDAKEFRAAAAAAAAAAACyAEoaKgOQMAIABBAWoiAEEIRw0AC0HgnAxB4JwMKwMAIgMgCUHgzAUrAwBB2JwMKwMAoUQAAAAAAAAAACALGyADoSAIo6KgOQMAQcjvC0HI7wsrAwAiAyAJQZjVBSsDAEHA7wsrAwChRAAAAAAAAAAAIAsbIgQgA6FB+J8HKwMAIgejoqA5AwBBsPILQbDyCysDACIDIAkgBCADoSAHo6KgOQMAQdCMCEHQjAgrAwAiAyAJQdDVBSsDAERNLsbAOg7jv6BEAAAAAAAAAAAgChsgA6EgBqOioDkDAEGwjAhBsIwIKwMAIgMgCUHY1QUrAwBE2WDhJM0fwb+gRAAAAAAAAAAAIAobIAOhIAajoqA5AwBBqJMIQaiTCCsDACIDIAlB0NYFKwMARAAAALCO8PvBoEQAAAAAAAAAACAFRAAAAAAAkJ9AZCIAGyADoaKgOQMAQbiTCEG4kwgrAwAiAyAJQaDXBSsDAEGwkwgrAwChRAAAAAAAAAAAIAsbIAOhIAijoqA5AwBB+JwMQficDCsDACIDIAlB6MwFKwMAQfCcDCsDAKFEAAAAAAAAAAAgCxsgA6EgCKOioDkDAEHQ9QtB0PULKwMAIgMgCUGA3QUrAwBByPULKwMAoUQAAAAAAAAAACALGyADoSAHo6KgOQMAQdj4C0HY+AsrAwAiAyAJQZDdBSsDAEHQ+AsrAwChRAAAAAAAAAAAIAsbIAOhIAejoqA5AwBBwPULQcD1CysDACIDIAlBoNsFKwMARHALG+kffsC9oEQAAAAAAAAAACAAGyADoaKgOQMAQcj4C0HI+AsrAwAiAyAJQajbBSsDAESeWRCiTMm+vaBEAAAAAAAAAAAgABsgA6GioDkDAEGgnQxBoJ0MKwMAIgMgCUGY5QUrAwBEAAAAAAAAFMCgRAAAAAAAAAAAIAAbIAOhoqA5AwBB2PELQdjxCysDACIDIAlBoOUFKwMARLgehetRuJ6/oEQAAAAAAAAAACAAGyADoaKgOQMAQaC5C0GguQsrAwAiAyAJQfDmBSsDAEQAAAAAAADwv6BEAAAAAAAAAAAgABsgA6FBgKAHKwMAIgSjoqA5AwBBmLkLQZi5CysDACIDIAlB+OYFKwMARAAAAAAAAPC/oEQAAAAAAAAAACAAGyADoSAEo6KgOQMAQZC5C0GQuQsrAwAiAyAJQYDnBSsDAEQAAAAAAADwv6BEAAAAAAAAAAAgABsgA6EgBKOioDkDAEGItwtBiLcLKwMAIgMgCUGI5wUrAwBEAAAAAAAA8L+gRAAAAAAAAAAAIAAbIAOhIASjoqA5AwBB2PQLQdj0CysDACIDIAlBqOUFKwMARJqZmZmZmdm/oEQAAAAAAAAAACAAGyADoaKgOQMAQajtC0Go7QsrAwAiAyAJQajjBisDAEGg7QsrAwChRAAAAAAAAAAAIAsbIAOhIAejoqA5AwBB4PcLQeD3CysDACIDIAlBuOUFKwMARHsUrkfheqS/oEQAAAAAAAAAACAAGyADoaKgOQMAQbCdDEGwnQwrAwAiAyAJQaj9BSsDAEGonQwrAwChRAAAAAAAAAAAIAVB4L0GKwMARAAAAAAAkJ9AoGQbIAOhQYigBysDAKOioDkDAEEAIQBB6KEMQeihDCsDAEHkuAUoAgBB4P8NKwMAEAlB6KEMKwMAoUGgpQcrAwAiBqKgOQMAQZC5BisDACEEA0BBACEBA0BBACECA0AgAkEDdCINIAFBBXQiDCAAQQZ0IgtB8O8IampqIgogCisDACIDIAYgC0Gw5QhqIAxqIA1qKwMAIAOhIASjoqA5AwAgAkEBaiICQQRHDQALIAFBAWoiAUECRw0ACyAAQQFqIgBBFUcNAAtByJ0MQcidDCsDACIDIAZBkP4FKwMAQcCdDCsDAKFEAAAAAAAAAAAgBkQAAAAAAADgP6JB4P8NKwMAoCIEQeC9BisDAEQAAAAAAJCfQKBkGyADoUGIoAcrAwCjoqA5AwBB6PELQejxCysDACIDIAZBmP4FKwMAQeDxCysDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZCIAGyADoUH4nwcrAwAiBKOioDkDAEHo9AtB6PQLKwMAIgMgBkGo/gUrAwBB4PQLKwMAoUQAAAAAAAAAACAAGyADoSAEo6KgOQMAQfD3C0Hw9wsrAwAiAyAGQbD+BSsDAEHo9wsrAwChRAAAAAAAAAAAIAAbIAOhIASjoqA5AwBBwOcHKwMAIQZB0KMHKwMAQdijBysDAKFB6NYFKwMAIgRB4NUFKwMAIgOhoyADIAQQCiEDQcDnByAGQaClBysDACIHIANBwOcHKwMAoUQAAAAAAAAUQKOioDkDAEHQngxB0J4MKwMAIgMgB0HIngwrAwAgA6FEAAAAAAAAFECjoqA5AwBB+PILQfjyCysDACIDIAdB8P8FKwMARAAAAAAAABjAoEQAAAAAAAAAACAHRAAAAAAAAOA/okHg/w0rAwAiCKAiBEQAAAAAAJCfQGQbIAOhoqA5AwBBiPMLQYjzCysDACIDIAdByIEGKwMAQYDzCysDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZBsiBiADoUH4nwcrAwAiBKOioDkDAEGo9QtBqPULKwMAIgMgByAGIAOhIASjoqA5AwBB2KEMQdihDCsDAEHouAUoAgAgCBAJQdihDCsDAKFBoKUHKwMAIgeioDkDAEGwnwxBsJ8MKwMAIgMgB0HwngwrAwAgA6FEAAAAAAAAFECjoqA5AwBB4J8MQeCfDCsDACIDIAdB4J4MKwMAIAOhRAAAAAAAABRAo6KgOQMAQbigDEG4oAwrAwAiAyAHQYCbBisDAEQAAAAAAAAUwKBEAAAAAAAAAAAgB0QAAAAAAADgP6JB4P8NKwMAoCIERAAAAAAAkJ9AZCIAGyADoaKgOQMAQdigDEHYoAwrAwAiAyAHQYibBisDAEQAAAAAAAAUwKBEAAAAAAAAAAAgABsgA6GioDkDAEGA+gtBgPoLKwMAIgMgB0H4+QsrAwBB6PkLKwMAEAsgA6FBgKQHKwMAo6KgOQMAQbCgDEGwoAwrAwAiAyAHQaigDCsDACADoUHAhQYrAwCjoqA5AwBBuPALQbjwCysDACIDIAdBkKwHKwMAQbDwCysDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZCIBGyADoUHwnwcrAwAiBqOioDkDAEHIoAxByKAMKwMAIgMgB0GouQYrAwBBwKAMKwMAoUQAAAAAAAAAACABGyIEIAOhQfifBysDACIIo6KgOQMAQeCiDEHgogwrAwAiAyAHQfCyDCsDACADoUQAAAAAAAAUQKOioDkDAEHQoAxB0KAMKwMAIgMgByAEIAOhIAijoqA5AwBB6KAMQeigDCsDACIDIAdBuLkGKwMAQeCgDCsDAKFEAAAAAAAAAAAgARsiBCADoSAIo6KgOQMAQfCgDEHwoAwrAwAiAyAHIAQgA6EgCKOioDkDAEGIoQxBiKEMKwMAIgMgB0HAuQYrAwBBgKEMKwMAoUQAAAAAAAAAACABGyIEIAOhIAijoqA5AwBBkKEMQZChDCsDACIDIAcgBCADoSAIo6KgOQMAQfigDEH4oAwrAwAiAyAHQdCfBisDAEQAAAAAAAAUwKBEAAAAAAAAAAAgABsgA6GioDkDAEG4ogxBuKIMKwMAIgMgB0GwogwrAwAgA6FEAAAAAAAA4D+ioqA5AwBBqJgIQaiYCCsDACIDIAdB+NAGKwMAQaCYCCsDAKFEAAAAAAAAAAAgARsgA6FB6J8HKwMAo6KgOQMAQaDxC0Gg8QsrAwAiAyAHQZjRBisDAEGY8QsrAwChRAAAAAAAAAAAIAEbIAOhIAajoqA5AwBBACECQZiYCEGYmAgrAwAiA0GgpQcrAwAiCEHQyQYrAwBEdoMN9PUh1L6gRAAAAAAAAAAAQeD/DSsDACAIRAAAAAAAAOA/oqAiBEQAAAAAAJCfQGQiABsgA6GioDkDAEGQ8QtBkPELKwMAIgMgCEHgyQYrAwBEAAAAAGXNzcGgRAAAAAAAAAAAIAAbIAOhoqA5AwBBoPQLQaD0CysDACIDIAhBmNEGKwMAQZjxCysDAKFEAAAAAAAAAAAgBEHA2gUrAwBEAAAAAACQn0CgZBsiBiADoUHwnwcrAwAiBKOioDkDAEGo9wtBqPcLKwMAIgMgCCAGIAOhIASjoqA5AwBB+NcHKwMAIQRE+n5qvHSTWD9EAAAAAACQn0BEAAAAAAAYoEAQCiEDQfjXByAEQaClBysDACADQfjXBysDAKFEAAAAAAAA4D+ioqA5AwBBgNgHKwMAIQREeekmMQisbD9EAAAAAADwnkBEAAAAAABon0AQCiEDQYDYByAEQaClBysDACIFIANBgNgHKwMAoUQAAAAAAADgP6KioDkDAEHIwQtByMELKwMAIgMgBUGIwQsrAwAgA6FEAAAAAAAAFECjoqA5AwBB2MELQdjBCysDACIDIAVBmMELKwMAIAOhRAAAAAAAABRAo6KgOQMAQcDBC0HAwQsrAwAiAyAFQYDBCysDACADoUQAAAAAAAAUQKOioDkDAEHQwQtB0MELKwMAIgMgBUGQwQsrAwAgA6FEAAAAAAAAFECjoqA5AwBB8IQJQfCECSsDACIDIAVB2NcGKwMARPp+arx0k2i/oEQAAAAAAAAAACAFRAAAAAAAAOA/okHg/w0rAwCgIgREAAAAAACQn0BkGyADoUGAoAcrAwCjoqA5AwBB0OILQdDiCysDACIDIAVB4OILKwMAIAOhQdifBysDAEQAAAAAAAAIQKMiB6OioDkDAEHY4gtB2OILKwMAIgMgBUHo4gsrAwAgA6EgB6OioDkDAEHg4gtB4OILKwMAIgMgBUHw4gsrAwAgA6EgB6OioDkDAEHo4gtB6OILKwMAIgMgBUH44gsrAwAgA6EgB6OioDkDAEHg1QUrAwAhA0EBIQADQCACQQN0IgJB8OILaiIBKwMAIQYgASAGIAUgAyAEYyIKBHwgAkHwpgdqKwMAIAJBoIEHaisDAKEFRAAAAAAAAAAACyAGoSAHo6KgOQMAQQEhAiAAIQFBACEAIAENAAtB+NoLQfjaCysDACIDIAVByN0LKwMAIgQgA6EgB6OioDkDAEHI3QsgBCAFQZjgCysDACAEoSAHo6KgOQMAQaDcC0Gg3AsrAwAiAyAFQfDeCysDACIEIAOhIAejoqA5AwBB8N4LIAQgBUHA4QsrAwAgBKEgB6OioDkDAEEAIQJBASEAA0AgAkGoAWwiAkGA4AtqIgEgASsDGCIDIAUgCgR8IAJBoKAHaisDGCACQdD+BmorAxihBUQAAAAAAAAAAAsgA6EgB6OioDkDGEEBIQIgACEBQQAhACABDQALQfDHC0HwxwsrAwAiAyAFQcDKCysDACIEIAOhIAejoqA5AwBBwMoLIAQgBUGQzQsrAwAgBKEgB6OioDkDAEGYyQtBmMkLKwMAIgMgBUHoywsrAwAiBCADoSAHo6KgOQMAQejLCyAEIAVBuM4LKwMAIAShIAejoqA5AwBBACECQQEhAANAIAJBqAFsIgJBgM0LaiIBIAErAxAiAyAFIAoEfCACQaCgB2orAxAgAkHQ/gZqKwMQoQVEAAAAAAAAAAALIAOhIAejoqA5AxBBASECIAAhAUEAIQAgAQ0AC0EAIQJB0KMMQdCjDCsDACIDIAVByKMMKwMAIgQgA6EgB6OioDkDAEHIowwgBCAFQcCjDCsDACIGIAShIAejoqA5AwBBsKMMQbCjDCsDACIDIAVBoKMMKwMAIgQgA6EgB6OioDkDAEGgowwgBCAFQZCjDCsDACAEoSAHo6KgOQMAQbijDEG4owwrAwAiAyAFQaijDCsDACIEIAOhIAejoqA5AwBBqKMMIAQgBUGYowwrAwAgBKEgB6OioDkDAEHAowwgBiAFQajDBisDAEGYwwYrAwChRAAAAAAAAAAAIAobIAahIAejoqA5AwBBASEAA0AgAkEDdCICQZCjDGoiASsDACEDIAEgAyAFIAoEfCACQfDdBmorAwAgAkHg3QZqKwMAoQVEAAAAAAAAAAALIAOhIAejoqA5AwBBASECIAAhAUEAIQAgAQ0AC0GwugUrAwAhBkHI3QYrAwAhBEG4vwgrAwAhCANAIABBA3QiAkHAvwhqIgEgASsDACIDIAUgCCADoUQAAAAAAADwPyACQbClDGorAwAgBKIgBqOjRPyp8dJNYlA/EAejoqA5AwAgAEEBaiIAQQRHDQALQbi/CCAIIAVB6LwNKwMAQZjoDSsDAKGioDkDAEHQogxB0KIMKwMAIgMgBUHIogwrAwAiBCADoSAHo6KgOQMAQciiDCAEIAVBwKIMKwMAIAShIAejoqA5AwBBmKEMQZihDCsDACIDQaClBysDACIFQaChDCsDACIEIAOhQYicBysDAEQAAAAAAAAIQKMiB6OioDkDAEGgoQwgBCAFQaihDCsDACIGIAShIAejoqA5AwBBsKEMQbChDCsDACIDIAVBuKEMKwMAIgQgA6EgB6OioDkDAEHAogxBwKIMKwMAIgMgBUGw1wYrAwBBqNcGKwMAoUQAAAAAAAAAAEHg1QUrAwBB4P8NKwMAIAVEAAAAAAAA4D+ioGMiABsgA6FB2J8HKwMARAAAAAAAAAhAoyIIo6KgOQMAQaihDCAGIAVBiNUFKwMAQYDVBSsDAKFEAAAAAAAAAAAgABsgBqEgB6OioDkDAEG4oQwgBCAFQcChDCsDACIDIAShIAejoqA5AwBBwKEMIAMgBUH41AUrAwBB8NQFKwMAoUQAAAAAAAAAACAAGyADoSAHo6KgOQMAQYDcB0GA3AcrAwAiAyAFQYjcBysDACIEIAOhIAejoqA5AwBBiNwHIAQgBUGQ3AcrAwAiAyAEoSAHo6KgOQMAQZDcByADIAVBoNQFKwMAQZjUBSsDAKFEAAAAAAAAAAAgABsgA6EgB6OioDkDAEGg3AdBoNwHKwMAIgMgBUGo3AcrAwAiBCADoSAHo6KgOQMAQajcByAEIAVBsNwHKwMAIgMgBKEgB6OioDkDAEGw3AcgAyAFQYjUBSsDAEGA1AUrAwChRAAAAAAAAAAAIAAbIAOhIAejoqA5AwBBuNsHQbjbBysDACIDIAVBwNsHKwMAIgQgA6EgB6OioDkDAEHA2wcgBCAFQcjbBysDACIDIAShIAejoqA5AwBByNsHIAMgBUHw0wUrAwBB6NMFKwMAoUQAAAAAAAAAACAAGyADoSAHo6KgOQMAQZCdDEGQnQwrAwAiAyAFQYidDCsDACIEIAOhIAijoqA5AwBBiJ0MIAQgBUGAnQwrAwAiAyAEoSAIo6KgOQMAQYCdDCADIAVBgNEFKwMAQfjQBSsDAKFEAAAAAAAAAAAgABsgA6EgCKOioDkDAEGo/wtBqP8LKwMAIAVB2MULKwMAIgNB4MULKwMAoaKgOQMAQeDFCyADQejFCygCABAWOQMAQeD/DUGgpQcrAwBB4P8NKwMAoDkDAEHU/w1B1P8NKAIAIgBBAWo2AgAgACAOSA0ACwtBxP8NQQA2AgBBwP8NQQA2AgALC4SsBSsAQYAICwHCAEGQCAt1BAAAAAUAAAAGAAAABwAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAAAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAEGQCQs1BAAAAAUAAAAGAAAABwAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAQdQJC8wDAQAAAAIAAAADAAAALSsgICAwWDB4AC0wWCswWCAwWC0weCsweCAweABuYW4AaW5mAE5BTgBJTkYALgAobnVsbCkAVGhlIHNldExvb2t1cCBmdW5jdGlvbiB3YXMgbm90IGVuYWJsZWQgZm9yIHRoZSBnZW5lcmF0ZWQgbW9kZWwuIFNldCB0aGUgY3VzdG9tTG9va3VwcyBwcm9wZXJ0eSBpbiB0aGUgc3BlYy9jb25maWcgZmlsZSB0byBhbGxvdyBmb3Igb3ZlcnJpZGluZyBsb29rdXBzIGF0IHJ1bnRpbWUuCgBUaGUgc3RvcmVPdXRwdXQgZnVuY3Rpb24gd2FzIG5vdCBlbmFibGVkIGZvciB0aGUgZ2VuZXJhdGVkIG1vZGVsLiBTZXQgdGhlIGN1c3RvbU91dHB1dHMgcHJvcGVydHkgaW4gdGhlIHNwZWMvY29uZmlnIGZpbGUgdG8gYWxsb3cgZm9yIGNhcHR1cmluZyBhcmJpdHJhcnkgdmFyaWFibGVzIGF0IHJ1bnRpbWUuCgAlZwkAAAAAAAAAAOA/AAAAAAAA4L8AAAAAAADwPwAAAAAAAPg/AAAAAAAAAAAG0M9D6/1MPgBBqw0L3BVAA7jiPwMAAAAEAAAABAAAAAYAAACD+aIARE5uAPwpFQDRVycA3TT1AGLbwAA8mZUAQZBDAGNR/gC73qsAt2HFADpuJADSTUIASQbgAAnqLgAcktEA6x3+ACmxHADoPqcA9TWCAES7LgCc6YQAtCZwAEF+XwDWkTkAU4M5AJz0OQCLX4QAKPm9APgfOwDe/5cAD5gFABEv7wAKWosAbR9tAM9+NgAJyycARk+3AJ5mPwAt6l8Auid1AOXrxwA9e/EA9zkHAJJSigD7a+oAH7FfAAhdjQAwA1YAe/xGAPCrawAgvM8ANvSaAOOpHQBeYZEACBvmAIWZZQCgFF8AjUBoAIDY/wAnc00ABgYxAMpWFQDJqHMAe+JgAGuMwAAZxEcAzWfDAAno3ABZgyoAi3bEAKYclgBEr90AGVfRAKU+BQAFB/8AM34/AMIy6ACYT94Au30yACY9wwAea+8An/heADUfOgB/8soA8YcdAHyQIQBqJHwA1W76ADAtdwAVO0MAtRTGAMMZnQCtxMIALE1BAAwAXQCGfUYA43EtAJvGmgAzYgAAtNJ8ALSnlwA3VdUA1z72AKMQGABNdvwAZJ0qAHDXqwBjfPgAerBXABcV5wDASVYAO9bZAKeEOAAkI8sA1op3AFpUIwAAH7kA8QobABnO3wCfMf8AZh5qAJlXYQCs+0cAfn/YACJltwAy6IkA5r9gAO/EzQBsNgkAXT/UABbe1wBYO94A3puSANIiKAAohugA4lhNAMbKMgAI4xYA4H3LABfAUADzHacAGOBbAC4TNACDEmIAg0gBAPWOWwCtsH8AHunyAEhKQwAQZ9MAqt3YAK5fQgBqYc4ACiikANOZtAAGpvIAXHd/AKPCgwBhPIgAinN4AK+MWgBv170ALaZjAPS/ywCNge8AJsFnAFXKRQDK2TYAKKjSAMJhjQASyXcABCYUABJGmwDEWcQAyMVEAE2ykQAAF/MA1EOtAClJ5QD91RAAAL78AB6UzABwzu4AEz71AOzxgACz58MAx/goAJMFlADBcT4ALgmzAAtF8wCIEpwAqyB7AC61nwBHksIAezIvAAxVbQByp5AAa+cfADHLlgB5FkoAQXniAPTfiQDolJcA4uaEAJkxlwCI7WsAX182ALv9DgBImrQAZ6RsAHFyQgCNXTIAnxW4ALzlCQCNMSUA93Q5ADAFHAANDAEASwhoACzuWABHqpAAdOcCAL3WJAD3faYAbkhyAJ8W7wCOlKYAtJH2ANFTUQDPCvIAIJgzAPVLfgCyY2gA3T5fAEBdAwCFiX8AVVIpADdkwABt2BAAMkgyAFtMdQBOcdQARVRuAAsJwQAq9WkAFGbVACcHnQBdBFAAtDvbAOp2xQCH+RcASWt9AB0nugCWaSkAxsysAK0UVACQ4moAiNmJACxyUAAEpL4AdweUAPMwcAAA/CcA6nGoAGbCSQBk4D0Al92DAKM/lwBDlP0ADYaMADFB3gCSOZ0A3XCMABe35wAI3zsAFTcrAFyAoABagJMAEBGSAA/o2ABsgK8A2/9LADiQDwBZGHYAYqUVAGHLuwDHibkAEEC9ANLyBABJdScA67b2ANsiuwAKFKoAiSYvAGSDdgAJOzMADpQaAFE6qgAdo8IAr+2uAFwmEgBtwk0ALXqcAMBWlwADP4MACfD2ACtAjABtMZkAObQHAAwgFQDYw1sA9ZLEAMatSwBOyqUApzfNAOapNgCrkpQA3UJoABlj3gB2jO8AaItSAPzbNwCuoasA3xUxAACuoQAM+9oAZE1mAO0FtwApZTAAV1a/AEf/OgBq+bkAdb7zACiT3wCrgDAAZoz2AATLFQD6IgYA2eQdAD2zpABXG48ANs0JAE5C6QATvqQAMyO1APCqGgBPZagA0sGlAAs/DwBbeM0AI/l2AHuLBACJF3IAxqZTAG9u4gDv6wAAm0pYAMTatwCqZroAds/PANECHQCx8S0AjJnBAMOtdwCGSNoA912gAMaA9ACs8C8A3eyaAD9cvADQ3m0AkMcfACrbtgCjJToAAK+aAK1TkwC2VwQAKS20AEuAfgDaB6cAdqoOAHtZoQAWEioA3LctAPrl/QCJ2/4Aib79AOR2bAAGqfwAPoBwAIVuFQD9h/8AKD4HAGFnMwAqGIYATb3qALPnrwCPbW4AlWc5ADG/WwCE10gAMN8WAMctQwAlYTUAyXDOADDLuAC/bP0ApACiAAVs5ABa3aAAIW9HAGIS0gC5XIQAcGFJAGtW4ACZUgEAUFU3AB7VtwAz8cQAE25fAF0w5ACFLqkAHbLDAKEyNgAIt6QA6rHUABb3IQCPaeQAJ/93AAwDgACNQC0AT82gACClmQCzotMAL10KALT5QgAR2ssAfb7QAJvbwQCrF70AyqKBAAhqXAAuVRcAJwBVAH8U8ADhB4YAFAtkAJZBjQCHvt4A2v0qAGsltgB7iTQABfP+ALm/ngBoak8ASiqoAE/EWgAt+LwA11qYAPTHlQANTY0AIDqmAKRXXwAUP7EAgDiVAMwgAQBx3YYAyd62AL9g9QBNZREAAQdrAIywrACywNAAUVVIAB77DgCVcsMAowY7AMBANQAG3HsA4EXMAE4p+gDWysgA6PNBAHxk3gCbZNgA2b4xAKSXwwB3WNQAaePFAPDaEwC6OjwARhhGAFV1XwDSvfUAbpLGAKwuXQAORO0AHD5CAGHEhwAp/ekA59bzACJ8ygBvkTUACODFAP/XjQBuauIAsP3GAJMIwQB8XXQAa62yAM1unQA+cnsAxhFqAPfPqQApc98Atcm6ALcAUQDisg0AdLokAOV9YAB02IoADRUsAIEYDAB+ZpQAASkWAJ96dgD9/b4AVkXvANl+NgDs2RMAi7q5AMSX/AAxqCcA8W7DAJTFNgDYqFYAtKi1AM/MDgASiS0Ab1c0ACxWiQCZzuMA1iC5AGteqgA+KpwAEV/MAP0LSgDh9PsAjjttAOKGLADp1IQA/LSpAO/u0QAuNckALzlhADghRAAb2cgAgfwKAPtKagAvHNgAU7SEAE6ZjABUIswAKlXcAMDG1gALGZYAGnC4AGmVZAAmWmAAP1LuAH8RDwD0tREA/Mv1ADS8LQA0vO4A6F3MAN1eYABnjpsAkjPvAMkXuABhWJsA4Ve8AFGDxgDYPhAA3XFIAC0c3QCvGKEAISxGAFnz1wDZepgAnlTAAE+G+gBWBvwA5XmuAIkiNgA4rSIAZ5PcAFXoqgCCJjgAyuebAFENpACZM7EAqdcOAGkFSABlsvAAf4inAIhMlwD50TYAIZKzAHuCSgCYzyEAQJ/cANxHVQDhdDoAZ+tCAP6d3wBe1F8Ae2ekALqsegBV9qIAK4gjAEG6VQBZbggAISqGADlHgwCJ4+YA5Z7UAEn7QAD/VukAHA/KAMVZigCU+isA08HFAA/FzwDbWq4AR8WGAIVDYgAhhjsALHmUABBhhwAqTHsAgCwaAEO/EgCIJpAAeDyJAKjE5ADl23sAxDrCACb06gD3Z4oADZK/AGWjKwA9k7EAvXwLAKRR3AAn3WMAaeHdAJqUGQCoKZUAaM4oAAnttABEnyAATpjKAHCCYwB+fCMAD7kyAKf1jgAUVucAIfEIALWdKgBvfk0ApRlRALX5qwCC39YAlt1hABY2AgDEOp8Ag6KhAHLtbQA5jXoAgripAGsyXABGJ1sAADTtANIAdwD89FUAAVlNAOBxgABBkyMLQED7Ifk/AAAAAC1EdD4AAACAmEb4PAAAAGBRzHg7AAAAgIMb8DkAAABAICV6OAAAAIAiguM2AAAAAB3zaTWoWwEAQeAjC0ERAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAAQAJCwsAAAkGCwAACwAGEQAAABEREQBBsSQLIQsAAAAAAAAAABEACgoREREACgAAAgAJCwAAAAkACwAACwBB6yQLAQwAQfckCxUMAAAAAAwAAAAACQwAAAAAAAwAAAwAQaUlCwEOAEGxJQsVDQAAAAQNAAAAAAkOAAAAAAAOAAAOAEHfJQsBEABB6yULHg8AAAAADwAAAAAJEAAAAAAAEAAAEAAAEgAAABISEgBBoiYLDhIAAAASEhIAAAAAAAAJAEHTJgsBCwBB3yYLFQoAAAAACgAAAAAJCwAAAAAACwAACwBBjScLAQwAQZknCycMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUYAQeQnCwEGAEGLKAsF//////8AQeYoC0rwPzMzMzMzMxlAAAAAAAAAAEAAAAAAAIBBQAAAAAAAAAhAAAAAAACAS0AAAAAAAAAQQM3MzMzMLFFAAAAAAAAAFEAAAAAAAABUQABBxikL2gHwPwAAAAAAAPA/AAAAAAAAAEAAAAAAAAAqQAAAAAAAAAhAAAAAAAAAM0AAAAAAAAAQQAAAAAAAgDRAAAAAAAAAFEAAAAAAAAA1QAAAAAAAAAAAmpmZmZmZ2T8AAAAAAADgP6RwPQrXo+A/AAAAAAAA8D8AAAAAAADwPwAAAAAAAPg/ZmZmZmZm8j8AAAAAAAAAQClcj8L1KPQ/AAAAAAAABEBI4XoUrkf1PwAAAAAAAAhAFK5H4XoU9j8AAAAAAAAMQGZmZmZmZvY/AAAAAAAAEEC4HoXrUbj2PwBBtisLki/gPwAAAAAAAOA/zczMzMzM7D/NzMzMzMzsP2ZmZmZmZu4/ZmZmZmZm7j/NzMzMzMzwPwAAAAAAAPA/mpmZmZmZ8T8AAAAAAADwPwAAAAAAAPQ/AAAAAAAA8D8AAAAAAAD4PwAAAAAAAPA/AAAAAAAAAEAAAAAAAADwPwAAAAAAAARAAAAAAAAA8D8AAAAAAAAIQAAAAAAAAPA/AAAAAAAA4D8AAAAAAAAAAFTjpZvEIOA/exSuR+F6hD+oxks3iUHgP3sUrkfhepQ//Knx0k1i4D+4HoXrUbieP1CNl24Sg+A/exSuR+F6pD/CFyZTBaPgP5qZmZmZmak/FvvL7snD4D+4HoXrUbiuP2recYqO5OA/7FG4HoXrsT++wRcmUwXhP3sUrkfherQ/EqW9wRcm4T8K16NwPQq3P4MvTKYKRuE/mpmZmZmZuT/XEvJBz2bhPylcj8L1KLw/K/aX3ZOH4T+4HoXrUbi+P52AJsKGp+E/pHA9CtejwD/xY8xdS8jhP+xRuB6F68E/Y+5aQj7o4T8zMzMzMzPDP7fRAN4CCeI/exSuR+F6xD8pXI/C9SjiP8P1KFyPwsU/m+Ydp+hI4j8K16NwPQrHPw1xrIvbaOI/UrgehetRyD9hVFInoIniP5qZmZmZmck/097gC5Op4j/hehSuR+HKP0Rpb/CFyeI/KVyPwvUozD+28/3UeOniP3E9CtejcM0/RiV1ApoI4z+4HoXrUbjOP7ivA+eMKOM/AAAAAAAA0D8qOpLLf0jjP6RwPQrXo9A/umsJ+aBn4z9I4XoUrkfRPyv2l92Th+M/7FG4HoXr0T+7Jw8LtabjP4/C9Shcj9I/S1mGONbF4z8zMzMzMzPTP9uK/WX35OM/16NwPQrX0z9qvHSTGATkP3sUrkfhetQ/+u3rwDkj5D8fhetRuB7VP4ofY+5aQuQ/w/UoXI/C1T84+MJkqmDkP2ZmZmZmZtY/xyk6kst/5D8K16NwPQrXP3UCmggbnuQ/rkfhehSu1z8j2/l+arzkP1K4HoXrUdg/0LNZ9bna5D/2KFyPwvXYP36MuWsJ+eQ/mpmZmZmZ2T8sZRniWBflPz0K16NwPdo/2T15WKg15T/hehSuR+HaP6W9wRcmU+U/hetRuB6F2z9xPQrXo3DlPylcj8L1KNw/PL1SliGO5T/NzMzMzMzcPwg9m1Wfq+U/cT0K16Nw3T/TvOMUHcnlPxSuR+F6FN4/nzws1Jrm5T+4HoXrUbjeP4hjXdxGA+Y/XI/C9Shc3z9U46WbxCDmPwAAAAAAAOA/PQrXo3A95j9SuB6F61HgPycxCKwcWuY/pHA9Ctej4D8u/yH99nXmP/YoXI/C9eA/GCZTBaOS5j9I4XoUrkfhPx/0bFZ9ruY/mpmZmZmZ4T8JG55eKcvmP+xRuB6F6+E/EOm3rwPn5j89CtejcD3iPzVeukkMAuc/j8L1KFyP4j89LNSa5h3nP+F6FK5H4eI/YqHWNO845z8zMzMzMzPjP2lv8IXJVOc/hetRuB6F4z+P5PIf0m/nP9ejcD0K1+M/tFn1udqK5z8pXI/C9SjkP/d14JwRpec/exSuR+F65D8c6+I2GsDnP83MzMzMzOQ/XwfOGVHa5z8fhetRuB7lP6MjufyH9Oc/cT0K16Nw5T8E54wo7Q3oP8P1KFyPwuU/RwN4CyQo6D8UrkfhehTmP6jGSzeJQeg/ZmZmZmZm5j8Jih9j7lroP7gehetRuOY/ak3zjlN06D8K16NwPQrnP8sQx7q4jeg/XI/C9Shc5z9Ke4MvTKboP65H4XoUruc/qz5XW7G/6D8AAAAAAADoPyqpE9BE2Og/UrgehetR6D+pE9BE2PDoP6RwPQrXo+g/RiV1ApoI6T/2KFyPwvXoP+M2GsBbIOk/SOF6FK5H6T+ASL99HTjpP5qZmZmZmek/HVpkO99P6T/sUbgehevpP7prCfmgZ+k/PQrXo3A96j90JJf/kH7pP4/C9Shcj+o/L90kBoGV6T/hehSuR+HqP+qVsgxxrOk/MzMzMzMz6z+lTkATYcPpP4XrUbgehes/fa62Yn/Z6T/Xo3A9CtfrPzhnRGlv8Ok/KVyPwvUo7D8Rx7q4jQbqP3sUrkfheuw/B84ZUdob6j/NzMzMzMzsP+AtkKD4Meo/H4XrUbge7T/XNO84RUfqP3E9CtejcO0/zTtO0ZFc6j/D9Shcj8LtP8RCrWneceo/FK5H4XoU7j/Y8PRKWYbqP2ZmZmZmZu4/I9v5fmq86j+4HoXrUbjuP+Olm8QgsOo/CtejcD0K7z/4U+Olm8TqP1yPwvUoXO8/KqkT0ETY6j+uR+F6FK7vP13+Q/rt6+o/AAAAAAAA8D9xrIvbaADrPylcj8L1KPA/waikTkAT6z9SuB6F61HwP/T91HjpJus/exSuR+F68D9E+u3rwDnrP6RwPQrXo/A/lPYGX5hM6z/NzMzMzMzwP+XyH9JvX+s/9ihcj8L18D817zhFR3LrPx+F61G4HvE/o5I6AU2E6z9I4XoUrkfxPxE2PL1Slus/cT0K16Nw8T9/2T15WKjrP5qZmZmZmfE/7nw/NV666z/D9Shcj8LxP3rHKTqSy+s/7FG4HoXr8T/oaiv2l93rPxSuR+F6FPI/dLUV+8vu6z89CtejcD3yPx6n6Egu/+s/ZmZmZmZm8j+q8dJNYhDsP4/C9Shcj/I/VOOlm8Qg7D+4HoXrUbjyP/7UeOkmMew/4XoUrkfh8j+oxks3iUHsPwrXo3A9CvM/cF8HzhlR7D8zMzMzMzPzPxpR2ht8Yew/XI/C9Shc8z/i6ZWyDHHsP4XrUbgehfM/qoJRSZ2A7D+uR+F6FK7zP4/C9Shcj+w/16NwPQrX8z9XW7G/7J7sPwAAAAAAAPQ/PZtVn6ut7D8pXI/C9Sj0PyPb+X5qvOw/UrgehetR9D8nwoanV8rsP3sUrkfhevQ/DAIrhxbZ7D+kcD0K16P0PxDpt68D5+w/zczMzMzM9D8U0ETY8PTsP/YoXI/C9fQ/F7fRAN4C7T8fhetRuB71PzlFR3L5D+0/SOF6FK5H9T89LNSa5h3tP3E9CtejcPU/XrpJDAIr7T+amZmZmZn1P4BIv30dOO0/w/UoXI/C9T+h1jTvOEXtP+xRuB6F6/U/4QuTqYJR7T8UrkfhehT2PyBB8WPMXe0/PQrXo3A99j9gdk8eFmrtP2ZmZmZmZvY/n6ut2F927T+PwvUoXI/2P9/gC5Opgu0/uB6F61G49j88vVKWIY7tP+F6FK5H4fY/fPKwUGua7T8K16NwPQr3P9nO91Pjpe0/MzMzMzMz9z82qz5XW7HtP1yPwvUoXPc/si5uowG87T+F61G4HoX3Pw8LtaZ5x+0/rkfhehSu9z+KjuTyH9LtP9ejcD0K1/c/BhIUP8bc7T8AAAAAAAD4P4GVQ4ts5+0/KVyPwvUo+D8awFsgQfHtP1K4HoXrUfg/lkOLbOf77T97FK5H4Xr4Py9uowG8Be4/pHA9Ctej+D/ImLuWkA/uP83MzMzMzPg/YcPTK2UZ7j/2KFyPwvX4P/rt68A5I+4/H4XrUbge+T+TGARWDi3uP0jhehSuR/k/S+oENBE27j9xPQrXo3D5PwK8BRIUP+4/mpmZmZmZ+T+5jQbwFkjuP8P1KFyPwvk/cF8HzhlR7j/sUbgehev5P0XY8PRKWe4/FK5H4XoU+j/8qfHSTWLuPz0K16NwPfo/0SLb+X5q7j9mZmZmZmb6P6abxCCwcu4/j8L1KFyP+j97FK5H4XruP7gehetRuPo/UI2XbhKD7j/hehSuR+H6P1CNl24Sg+4/CtejcD0K+z8YJlMFo5LuPzMzMzMzM/s/7Z48LNSa7j9cj8L1KFz7P+C+Dpwzou4/hetRuB6F+z/T3uALk6nuP65H4XoUrvs/xf6ye/Kw7j/Xo3A9Ctf7P9bFbTSAt+4/AAAAAAAA/D/J5T+k377uPylcj8L1KPw/2qz6XG3F7j9SuB6F61H8P83MzMzMzO4/exSuR+F6/D/ek4eFWtPuP6RwPQrXo/w/7lpCPujZ7j/NzMzMzMz8Px3J5T+k3+4/9ihcj8L1/D8ukKD4MebuPx+F61G4Hv0/P1dbsb/s7j9I4XoUrkf9P08eFmpN8+4/cT0K16Nw/T+cM6K0N/juP5qZmZmZmf0/rfpcbcX+7j/D9Shcj8L9P9xoAG+BBO8/7FG4HoXr/T8K16NwPQrvPxSuR+F6FP4/V+wvuycP7z89CtejcD3+P4Za07zjFO8/ZmZmZmZm/j/Sb18HzhnvP4/C9Shcj/4/Ad4CCYof7z+4HoXrUbj+P03zjlN0JO8/4XoUrkfh/j+aCBueXinvPwrXo3A9Cv8/5x2n6Egu7z8zMzMzMzP/PzMzMzMzM+8/XI/C9Shc/z+ASL99HTjvP4XrUbgehf8/zF1LyAc97z+uR+F6FK7/PzcawFsgQe8/16NwPQrX/z+h1jTvOEXvPwAAAAAAAABA7uvAOSNK7z8UrkfhehQAQFioNc07Tu8/KVyPwvUoAEDDZKpgVFLvPz0K16NwPQBALSEf9GxW7z9SuB6F61EAQJjdk4eFWu8/ZmZmZmZmAEACmggbnl7vP3sUrkfhegBAbVZ9rrZi7z+PwvUoXI8AQPW52or9Ze8/pHA9CtejAEBgdk8eFmrvP7gehetRuABA6Nms+lxt7z/NzMzMzMwAQFOWIY51ce8/4XoUrkfhAEDb+X5qvHTvP/YoXI/C9QBAZF3cRgN47z8K16NwPQoBQOzAOSNKe+8/H4XrUbgeAUB0JJf/kH7vPzMzMzMzMwFA/Yf029eB7z9I4XoUrkcBQIXrUbgehe8/XI/C9ShcAUAOT6+UZYjvP3E9CtejcAFAtFn1udqK7z+F61G4HoUBQDy9UpYhju8/mpmZmZmZAUDjx5i7lpDvP65H4XoUrgFAayv2l92T7z/D9Shcj8IBQBE2PL1Slu8/16NwPQrXAUC4QILix5jvP+xRuB6F6wFAQKTfvg6c7z8AAAAAAAACQOauJeSDnu8/FK5H4XoUAkCMuWsJ+aDvPylcj8L1KAJAM8SxLm6j7z89CtejcD0CQNnO91Pjpe8/UrgehetRAkB/2T15WKjvP2ZmZmZmZgJAJuSDns2q7z97FK5H4XoCQOqVsgxxrO8/j8L1KFyPAkCQoPgx5q7vP6RwPQrXowJANqs+V1ux7z+4HoXrUbgCQPtcbcX+su8/zczMzMzMAkChZ7Pqc7XvP+F6FK5H4QJAZRniWBe37z/2KFyPwvUCQCnLEMe6uO8/CtejcD0KA0DQ1VbsL7vvPx+F61G4HgNAlIeFWtO87z8zMzMzMzMDQFg5tMh2vu8/SOF6FK5HA0Ac6+I2GsDvP1yPwvUoXANAw/UoXI/C7z9xPQrXo3ADQIenV8oyxO8/hetRuB6FA0BLWYY41sXvP5qZmZmZmQNADwu1pnnH7z+uR+F6FK4DQPFjzF1LyO8/w/UoXI/CA0C1FfvL7snvP9ejcD0K1wNAescpOpLL7z/sUbgehesDQD55WKg1ze8/AAAAAAAABEACK4cW2c7vPxSuR+F6FARA5IOezarP7z8pXI/C9SgEQKg1zTtO0e8/PQrXo3A9BEBt5/up8dLvP1K4HoXrUQRAT0ATYcPT7z9mZmZmZmYEQBPyQc9m1e8/exSuR+F6BED1SlmGONbvP4/C9ShcjwRAufyH9NvX7z+kcD0K16MEQJtVn6ut2O8/uB6F61G4BEB9rrZif9nvP83MzMzMzARAQmDl0CLb7z/hehSuR+EEQCS5/If02+8/9ihcj8L1BEAGEhQ/xtzvPwrXo3A9CgVAysNCrWne7z8fhetRuB4FQKwcWmQ73+8/MzMzMzMzBUCOdXEbDeDvP0jhehSuRwVAcM6I0t7g7z9cj8L1KFwFQFInoImw4e8/cT0K16NwBUA0gLdAguLvP4XrUbgehQVAF9nO91Pj7z+amZmZmZkFQPkx5q4l5O8/rkfhehSuBUDbiv1l9+TvP8P1KFyPwgVAveMUHcnl7z/Xo3A9CtcFQJ88LNSa5u8/7FG4HoXrBUCBlUOLbOfvPwAAAAAAAAZAY+5aQj7o7z8UrkfhehQGQEVHcvkP6e8/KVyPwvUoBkAnoImw4envPz0K16NwPQZACfmgZ7Pq7z9SuB6F61EGQAn5oGez6u8/ZmZmZmZmBkDsUbgehevvP3sUrkfhegZAzqrP1Vbs7z+PwvUoXI8GQLAD54wo7e8/pHA9CtejBkCwA+eMKO3vP7gehetRuAZAklz+Q/rt7z/NzMzMzMwGQHS1FfvL7u8/4XoUrkfhBkB0tRX7y+7vP/YoXI/C9QZAVg4tsp3v7z8K16NwPQoHQDhnRGlv8O8/H4XrUbgeB0A4Z0Rpb/DvPzMzMzMzMwdAGsBbIEHx7z9I4XoUrkcHQBrAWyBB8e8/XI/C9ShcB0D8GHPXEvLvP3E9CtejcAdA3nGKjuTy7z+F61G4HoUHQN5xio7k8u8/mpmZmZmZB0DByqFFtvPvP65H4XoUrgdAwcqhRbbz7z/D9Shcj8IHQKMjufyH9O8/16NwPQrXB0CjI7n8h/TvP+xRuB6F6wdAhXzQs1n17z8AAAAAAAAIQCuHFtnO9+8/FK5H4XoUCEDRkVz+Q/rvPylcj8L1KAhAlkOLbOf77z89CtejcD0IQFr1udqK/e8/UrgehetRCEA8TtGRXP7vP2ZmZmZmZghAPE7RkVz+7z97FK5H4XoIQB6n6Egu/+8/j8L1KFyPCEAep+hILv/vP6RwPQrXowhAAAAAAAAA8D+4HoXrUbgIQAAAAAAAAPA/AAAAAAAAEEAAAAAAAADwPwAAAAAAABRAAAAAAAAAIUDyW3Sy1HrQPwAAAAAAACJA8lt0stR60D8AAAAAAAAkQPJbdLLUetA/AAAAAAAAJkDjp3FvfsPQPwAAAAAAAChAhpDz/j9O0T8AAAAAAAAqQFSsGoS53dE/AAAAAAAALEAHB3sTQ3LSPwAAAAAAAC5AipRm8zgM0z8K16NwPQq3P4/C9Shcj+o/UrgehetRyD8zMzMzMzPrP+xRuB6F69E/16NwPQrX6z+uR+F6FK7XP3sUrkfheuw/cT0K16Nw3T9xPQrXo3DtP+xRuB6F6+E/FK5H4XoU7j/NzMzMzMzkP7gehetRuO4/rkfhehSu5z+4HoXrUbjuP4/C9Shcj+o/uB6F61G47j/D9Shcj8LtP1yPwvUoXO8/UrgehetR8D9SuB6F61HwP8P1KFyPwvE/9ihcj8L18D8zMzMzMzPzP0jhehSuR/E/zczMzMzM9D9xPQrXo3DxPz0K16NwPfY/w/UoXI/C8T+uR+F6FK73P+xRuB6F6/E/H4XrUbge+T/sUbgehevxP7gehetRuPo/FK5H4XoU8j8pXI/C9Sj8P2ZmZmZmZvI/mpmZmZmZ/T+PwvUoXI/yPwrXo3A9Cv8/4XoUrkfh8j9SuB6F61EAQOF6FK5H4fI/CtejcD0KAUC4HoXrUbjyP8P1KFyPwgFAZmZmZmZm8j97FK5H4XoCQBSuR+F6FPI/SOF6FK5HA0CamZmZmZnxPwAAAAAAAARAH4XrUbge8T+4HoXrUbgEQHsUrkfhevA/hetRuB6FBUCuR+F6FK7vPz0K16NwPQZAZmZmZmZm7j/2KFyPwvUGQB+F61G4Hu0/rkfhehSuB0DXo3A9CtfrPwAAAAAAsJ1AAAAAAAAAAEAAAAAAAHieQAAAAAAAAAxAAAAAAABAn0AAAAAAAAAUQAAAAAAAkJ9AAAAAAAAAGEAAAAAAALCdQAAAAAAAAABAAAAAAAB4nkCamZmZmZkBQAAAAAAAQJ9AAAAAAAAAEEAAAAAAAJCfQAAAAAAAABZAAAAAAACwnUAAAAAAAAAAQAAAAAAAoJ5AAAAAAAAABEAAAAAAAJCfQAAAAAAAABBAAAAAAAAAGMAAAAAAAAAAAJqZmZmZmRfAAAAAAAAAAAAzMzMzMzMXwAAAAAAAAAAAzczMzMzMFsAAAAAAAAAAAGZmZmZmZhbAAEHW2gALQhbAAAAAAAAAAACamZmZmZkVwAAAAAAAAAAAMzMzMzMzFcAAAAAAAAAAAM3MzMzMzBTAAAAAAAAAAABmZmZmZmYUwABBptsAC0IUwAAAAAAAAAAAmpmZmZmZE8AAAAAAAAAAADMzMzMzMxPAAAAAAAAAAADNzMzMzMwSwAAAAAAAAAAAZmZmZmZmEsAAQfbbAAvKBRLAAAAAAAAAAACamZmZmZkRwPFo44i1+OQ+MzMzMzMzEcDxaOOItfjkPs3MzMzMzBDA8WjjiLX45D5mZmZmZmYQwPFo44i1+PQ+AAAAAAAAEMBpHVVNEHX/PjMzMzMzMw/ALUMc6+I2Cj9mZmZmZmYOwNL7xteeWRI/mpmZmZmZDcBLsDic+dUcP83MzMzMzAzA8WjjiLX4JD8AAAAAAAAMwNrmxvSEJS4/MzMzMzMzC8A4hCo1e6A1P2ZmZmZmZgrAaR1VTRB1Pz+amZmZmZkJwCMtlbcjnEY/zczMzMzMCMANq3gj88hPPwAAAAAAAAjArthfdk8eVj8zMzMzMzMHwE87/DVZo14/ZmZmZmZmBsDxaOOItfhkP5qZmZmZmQXAPj+MEB5tbD/NzMzMzMwEwIP6ljldFnM/AAAAAAAABMDI0ocuqG95PzMzMzMzMwPACRueXinLgD9mZmZmZmYCwNwRTgte9IU/mpmZmZmZAcDysFBrmneMP83MzMzMzADARFGgT+RJkj8AAAAAAAAAwLKd76fGS5c/ZmZmZmZm/r8p6PaSxmidP83MzMzMzPy/vfvjvWploj8zMzMzMzP7v+Dzwwjh0aY/mpmZmZmZ+b/mP6Tfvg6sPwAAAAAAAPi/7bYLzXUasT9mZmZmZmb2v5Qw0/avrLQ/zczMzMzM9L+At0CC4se4PzMzMzMzM/O/MC/APjp1vT+amZmZmZnxv1ovhnKiXcE/AAAAAAAA8L9XeJeL+E7EP83MzMzMzOy/rDlAMEePxz+amZmZmZnpv8pPqn06Hss/ZmZmZmZm5r8qV3iXi/jOPzMzMzMzM+O/WmQ730+N0T8AAAAAAADgv3OAYI4ev9M/mpmZmZmZ2b92w7ZFmQ3WPzMzMzMzM9O/ozuInSl02D+amZmZmZnJv1qeB3dn7do/mpmZmZmZub+laybfbHPdPwBBzuEAC8oG4D+amZmZmZm5Py7KbJBJRuE/mpmZmZmZyT/TMHxETIniPzMzMzMzM9M/LuI7MevF4z+amZmZmZnZP0WeJF0z+eQ/AAAAAAAA4D/Gv8+4cCDmPzMzMzMzM+M/001iEFg55z9mZmZmZmbmPzbqIRrdQeg/mpmZmZmZ6T8NbJVgcTjpP83MzMzMzOw/lfHvMy4c6j8AAAAAAADwP+ohGt1B7Oo/mpmZmZmZ8T8qdF5jl6jrPzMzMzMzM/M/GvonuFhR7D/NzMzMzMz0PxDpt68D5+w/ZmZmZmZm9j/tmSUBamrtPwAAAAAAAPg/IoleRrHc7T+amZmZmZn5PwK8BRIUP+4/MzMzMzMz+z/CwHPv4ZLuP83MzMzMzPw/RMAhVKnZ7j9mZmZmZmb+P79IaMu5FO8/AAAAAAAAAEASg8DKoUXvP83MzMzMzABAdv2C3bBt7z+amZmZmZkBQDy9UpYhju8/ZmZmZmZmAkC5x9KHLqjvPzMzMzMzMwNAlIeFWtO87z8AAAAAAAAEQFrwoq8gze8/zczMzMzMBEAL0oxF09nvP5qZmZmZmQVAwXPv4ZLj7z9mZmZmZmYGQJccd0oH6+8/MzMzMzMzB0DiAWVTrvDvPwAAAAAAAAhAFNBE2PD07z/NzMzMzMwIQNUhN8MN+O8/mpmZmZmZCUC1GhL3WPrvP2ZmZmZmZgpAXFX2XRH87z8zMzMzMzMLQK9amfBL/e8/AAAAAAAADECSs7CnHf7vP83MzMzMzAxAyXGndLD+7z+amZmZmZkNQDoeM1AZ/+8/ZmZmZmZmDkDIQQkzbf/vPzMzMzMzMw9Aj1N0JJf/7z8AAAAAAAAQQFZl3xXB/+8/ZmZmZmZmEEA57pQO1v/vP83MzMzMzBBAHXdKB+v/7z8zMzMzMzMRQB13Sgfr/+8/mpmZmZmZEUAdd0oH6//vPwAAAAAAABJAHXdKB+v/7z9mZmZmZmYSQAAAAAAAAPA/zczMzMzMEkAAAAAAAADwPzMzMzMzMxNAAAAAAAAA8D+amZmZmZkTQAAAAAAAAPA/AAAAAAAAFEAAAAAAAADwPwAAAAAAABZAAAAAAAAA8D8AAAAAAAAYQAAAAAAAAPA/AAAAAACwnUAAQaXoAAvzB3ieQPFo44i1+OQ+AAAAAABUn0CU2SCTjJyVPwAAAAAAaJ9AB/ZOu07Znz8AAAAAAGifQAf2TrtO2Z8/AAAAAACQn0Cys43kl2avPwAAAAAAuJ9AXljtUAO8sz8AAAAAAOCfQEpXVdQFYbM/AAAAAAAEoEBAA6BAjpyzPwAAAAAAGKBAzygCQSVTtD8AAAAAACygQOqP1VLlILU/AAAAAABAoECn8PuS6MC1PwAAAAAAVKBA0iXS7HAqtj8AAAAAAGigQHd677ldebY/AAAAAABon0AH9k67TtmfPwAAAAAAkJ9AQiPYuP5drz8AAAAAALifQGH6A4r9CrQ/AAAAAADgn0CoqWVrfZG0PwAAAAAABKBAZaZZRSSvtT8AAAAAABigQOUJhJ1i1bY/AAAAAAAsoEAqPpnarcC3PwAAAAAAQKBAr/mnCvyXuD8AAAAAAFSgQBOq5RjaSrk/AAAAAABooECB64oZ4e25PwAAAAAAaJ9AB/ZOu07Znz8AAAAAAJCfQOR2HstxXa8/AAAAAAC4n0Dd5jLaT2u1PwAAAAAA4J9AwvEhTWFKtz8AAAAAAASgQEJV8essH7g/AAAAAAAYoECZ4Ip6dxq5PwAAAAAALKBAwYwpWONsuj8AAAAAAECgQEg3wqIiTrs/AAAAAABUoEAXK2owDcO7PwAAAAAAaKBAodefxOdOvD8AAAAAAGifQAf2TrtO2Z8/AAAAAACQn0BeyUQAJl+vPwAAAAAAuJ9ADxoLVBBNtj8AAAAAAOCfQMZun1VmSrk/AAAAAAAEoEDqeqLrwg+6PwAAAAAAGKBAc6CH2jaMuj8AAAAAACygQII5evzeprs/AAAAAABAoEDPglDex9G8PwAAAAAAVKBAa2RXWkbqvT8AAAAAAGigQLt868N6o74/AAAAAABon0AH9k67TtmfPwAAAAAAkJ9A5fIf0m9frz8AAAAAALifQO8eoPtyZrc/AAAAAADgn0DOxkrMs5K+PwAAAAAABKBAzVfJx+4Cwz8AAAAAABigQLd/ZaVJKcY/AAAAAAAsoECe0OtP4nPHPwAAAAAAQKBAI2dhTzv8xT8AAAAAAFSgQFEtIorJG8Q/AAAAAABooEB0RSkhWFXDPwAAAAAAaJ9AB/ZOu07Znz8AAAAAAJCfQLg81owMcq8/AAAAAAC4n0Ae0fNdANC3PwAAAAAA4J9A78ouGFxzvz8AAAAAAASgQIP3VblQ+cM/AAAAAAAYoEB3ZKw2/6/IPwAAAAAALKBAzt+EQgQczj8AAAAAAECgQI0mF2NgHdI/AAAAAABUoEBCzvv/OGHVPwAAAAAAaKBA5+Jve4LE2D8AAAAAALCdQABBpfAAC6sIVJ9AR+NQvwvb4b8AAAAAAFSfQEfjUL8L2+G/AAAAAABon0DQ7Lq3IjHfvwAAAAAAkJ9AARdky/J12b8AAAAAALifQG9kHvmDgc2/AAAAAADgn0DqI/CHn//KvwAAAAAABKBAl1ZD4h5L0b8AAAAAABigQNDyPLg7a9S/AAAAAAAsoEAxXvOqzmrWvwAAAAAAQKBA++WTFcPV178AAAAAAFSgQG7DKAge39i/AAAAAABooECAfXTqymfZvwAAAAAAVJ9AR+NQvwvb4b8AAAAAAGifQJYjZCDPLt+/AAAAAACQn0DkTX6LTpbZvwAAAAAAuJ9AD4EjgQab078AAAAAAOCfQB9kWTDxR8+/AAAAAAAEoEDD8BExJZLRvwAAAAAAGKBAVJCfjVw31b8AAAAAACygQN2ZCYZzDdi/AAAAAABAoEBt409UNqzZvwAAAAAAVKBAhQt5BDdS2r8AAAAAAGigQKooXmVtU9q/AAAAAABUn0BH41C/C9vhvwAAAAAAaJ9AkpOJWwUx378AAAAAAJCfQLEzhc5r7Nm/AAAAAAC4n0CIvVDAdjDXvwAAAAAA4J9AW88Qjln2078AAAAAAASgQCu9NhsrMdW/AAAAAAAYoEBV203wTdPWvwAAAAAALKBA9dkB1xUz2L8AAAAAAECgQJnwS/28qdm/AAAAAABUoEBQHauUnunavwAAAAAAaKBAh78ma9RD278AAAAAAFSfQEfjUL8L2+G/AAAAAABon0A/OQoQBTPfvwAAAAAAkJ9Ax0YgXtcv2r8AAAAAALifQCQLmMCtu9m/AAAAAADgn0D+DkWBPpHXvwAAAAAABKBA/wkuVtRg2L8AAAAAABigQAt9sIwN3dm/AAAAAAAsoEDQ7SWN0TrbvwAAAAAAQKBADLH6IwwD3L8AAAAAAFSgQFdgyOpWz9u/AAAAAABooEBVhQZi2czbvwAAAAAAVJ9AR+NQvwvb4b8AAAAAAGifQNcyGY7nM9+/AAAAAACQn0BAFw0Zj1LavwAAAAAAuJ9AHhfVIqKY278AAAAAAOCfQAWHF0Skptq/AAAAAAAEoED3AUht4uTbvwAAAAAAGKBArOP4odKI3b8AAAAAACygQHO5wVCHFd6/AAAAAABAoED2CDVDqijfvwAAAAAAVKBAcjEG1nH8378AAAAAAGigQGVR2EXRA+C/AAAAAABUn0BH41C/C9vhvwAAAAAAaJ9AKxN+qZ83378AAAAAAJCfQIRnQpPEktq/AAAAAAC4n0CwjuOHSiPcvwAAAAAA4J9ARpc3h2u1278AAAAAAASgQJd1/1iIDt2/AAAAAAAYoEAAxF29iozevwAAAAAALKBAkpGzsKcd378AAAAAAECgQAEwnkFD/9+/AAAAAABUoECUhETaxh/gvwAAAAAAaKBArBvvjozV378AQd74AAuqAvA/mpmZmZmZ2T8AAAAAAADwPwAAAAAAAOA/XI/C9Shc7z8zMzMzMzPjP83MzMzMzOw/ZmZmZmZm5j9mZmZmZmbmP5qZmZmZmek/mpmZmZmZ2T/NzMzMzMzsPzMzMzMzM8M/AAAAAAAA8D/8qfHSTWJQPwAAAAAAAAAAMzMzMzMzwz+amZmZmZm5P83MzMzMzNw/mpmZmZmZyT8AAAAAAADoPzMzMzMzM9M/ZmZmZmZm7j+amZmZmZnZPwAAAAAAAPA/AAAAAAAA8D8AAAAAAADwPwAAAAAAAAAAmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQZj7AAtQmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQfj7AAtQmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQdj8AAtQmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQbj9AAtQmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQZj+AAtQmpmZmZmZ6T+amZmZmZnJP5qZmZmZmek/mpmZmZmZ2T9mZmZmZmbmPzMzMzMzM+M/AAAAAAAA4D+amZmZmZnpP5qZmZmZmck/AAAAAAAA8D8AQf7+AAvifeA/exSuR+F6hD9U46WbxCDgP3sUrkfhepQ/qMZLN4lB4D+4HoXrUbieP/yp8dJNYuA/exSuR+F6pD9QjZduEoPgP5qZmZmZmak/whcmUwWj4D+4HoXrUbiuPxb7y+7Jw+A/7FG4HoXrsT9q3nGKjuTgP3sUrkfherQ/vsEXJlMF4T8K16NwPQq3PxKlvcEXJuE/mpmZmZmZuT+DL0ymCkbhPylcj8L1KLw/1xLyQc9m4T+4HoXrUbi+Pyv2l92Th+E/pHA9CtejwD+dgCbChqfhP+xRuB6F68E/8WPMXUvI4T8zMzMzMzPDP2PuWkI+6OE/exSuR+F6xD+30QDeAgniP8P1KFyPwsU/KVyPwvUo4j8K16NwPQrHP5vmHafoSOI/UrgehetRyD8NcayL22jiP5qZmZmZmck/YVRSJ6CJ4j/hehSuR+HKP9Pe4AuTqeI/KVyPwvUozD9EaW/whcniP3E9CtejcM0/tvP91Hjp4j+4HoXrUbjOP0YldQKaCOM/AAAAAAAA0D+4rwPnjCjjP6RwPQrXo9A/KjqSy39I4z9I4XoUrkfRP7prCfmgZ+M/7FG4HoXr0T8r9pfdk4fjP4/C9Shcj9I/uycPC7Wm4z8zMzMzMzPTP0tZhjjWxeM/16NwPQrX0z/biv1l9+TjP3sUrkfhetQ/arx0kxgE5D8fhetRuB7VP/rt68A5I+Q/w/UoXI/C1T+KH2PuWkLkP2ZmZmZmZtY/OPjCZKpg5D8K16NwPQrXP8cpOpLLf+Q/rkfhehSu1z91ApoIG57kP1K4HoXrUdg/I9v5fmq85D/2KFyPwvXYP9CzWfW52uQ/mpmZmZmZ2T9+jLlrCfnkPz0K16NwPdo/LGUZ4lgX5T/hehSuR+HaP9k9eVioNeU/hetRuB6F2z+lvcEXJlPlPylcj8L1KNw/cT0K16Nw5T/NzMzMzMzcPzy9UpYhjuU/cT0K16Nw3T8IPZtVn6vlPxSuR+F6FN4/07zjFB3J5T+4HoXrUbjeP588LNSa5uU/XI/C9Shc3z+IY13cRgPmPwAAAAAAAOA/VOOlm8Qg5j9SuB6F61HgPz0K16NwPeY/pHA9Ctej4D8nMQisHFrmP/YoXI/C9eA/Lv8h/fZ15j9I4XoUrkfhPxgmUwWjkuY/mpmZmZmZ4T8f9GxWfa7mP+xRuB6F6+E/CRueXinL5j89CtejcD3iPxDpt68D5+Y/j8L1KFyP4j81XrpJDALnP+F6FK5H4eI/PSzUmuYd5z8zMzMzMzPjP2Kh1jTvOOc/hetRuB6F4z9pb/CFyVTnP9ejcD0K1+M/j+TyH9Jv5z8pXI/C9SjkP7RZ9bnaiuc/exSuR+F65D/3deCcEaXnP83MzMzMzOQ/HOviNhrA5z8fhetRuB7lP18HzhlR2uc/cT0K16Nw5T+jI7n8h/TnP8P1KFyPwuU/BOeMKO0N6D8UrkfhehTmP0cDeAskKOg/ZmZmZmZm5j+oxks3iUHoP7gehetRuOY/CYofY+5a6D8K16NwPQrnP2pN845TdOg/XI/C9Shc5z/LEMe6uI3oP65H4XoUruc/SnuDL0ym6D8AAAAAAADoP6s+V1uxv+g/UrgehetR6D8qqRPQRNjoP6RwPQrXo+g/qRPQRNjw6D/2KFyPwvXoP0YldQKaCOk/SOF6FK5H6T/jNhrAWyDpP5qZmZmZmek/gEi/fR046T/sUbgehevpPx1aZDvfT+k/PQrXo3A96j+6awn5oGfpP4/C9Shcj+o/dCSX/5B+6T/hehSuR+HqPy/dJAaBlek/MzMzMzMz6z/qlbIMcazpP4XrUbgehes/pU5AE2HD6T/Xo3A9CtfrP32utmJ/2ek/KVyPwvUo7D84Z0Rpb/DpP3sUrkfheuw/Ece6uI0G6j/NzMzMzMzsPwfOGVHaG+o/H4XrUbge7T/gLZCg+DHqP3E9CtejcO0/1zTvOEVH6j/D9Shcj8LtP807TtGRXOo/FK5H4XoU7j/EQq1p3nHqP2ZmZmZmZu4/2PD0SlmG6j+4HoXrUbjuPyPb+X5qvOo/CtejcD0K7z/jpZvEILDqP1yPwvUoXO8/+FPjpZvE6j+uR+F6FK7vPyqpE9BE2Oo/AAAAAAAA8D9d/kP67evqPylcj8L1KPA/cayL22gA6z9SuB6F61HwP8GopE5AE+s/exSuR+F68D/0/dR46SbrP6RwPQrXo/A/RPrt68A56z/NzMzMzMzwP5T2Bl+YTOs/9ihcj8L18D/l8h/Sb1/rPx+F61G4HvE/Ne84RUdy6z9I4XoUrkfxP6OSOgFNhOs/cT0K16Nw8T8RNjy9UpbrP5qZmZmZmfE/f9k9eVio6z/D9Shcj8LxP+58PzVeuus/7FG4HoXr8T96xyk6ksvrPxSuR+F6FPI/6Gor9pfd6z89CtejcD3yP3S1FfvL7us/ZmZmZmZm8j8ep+hILv/rP4/C9Shcj/I/qvHSTWIQ7D+4HoXrUbjyP1TjpZvEIOw/4XoUrkfh8j/+1HjpJjHsPwrXo3A9CvM/qMZLN4lB7D8zMzMzMzPzP3BfB84ZUew/XI/C9Shc8z8aUdobfGHsP4XrUbgehfM/4umVsgxx7D+uR+F6FK7zP6qCUUmdgOw/16NwPQrX8z+PwvUoXI/sPwAAAAAAAPQ/V1uxv+ye7D8pXI/C9Sj0Pz2bVZ+rrew/UrgehetR9D8j2/l+arzsP3sUrkfhevQ/J8KGp1fK7D+kcD0K16P0PwwCK4cW2ew/zczMzMzM9D8Q6bevA+fsP/YoXI/C9fQ/FNBE2PD07D8fhetRuB71Pxe30QDeAu0/SOF6FK5H9T85RUdy+Q/tP3E9CtejcPU/PSzUmuYd7T+amZmZmZn1P166SQwCK+0/w/UoXI/C9T+ASL99HTjtP+xRuB6F6/U/odY07zhF7T8UrkfhehT2P+ELk6mCUe0/PQrXo3A99j8gQfFjzF3tP2ZmZmZmZvY/YHZPHhZq7T+PwvUoXI/2P5+rrdhfdu0/uB6F61G49j/f4AuTqYLtP+F6FK5H4fY/PL1SliGO7T8K16NwPQr3P3zysFBrmu0/MzMzMzMz9z/ZzvdT46XtP1yPwvUoXPc/Nqs+V1ux7T+F61G4HoX3P7IubqMBvO0/rkfhehSu9z8PC7WmecftP9ejcD0K1/c/io7k8h/S7T8AAAAAAAD4PwYSFD/G3O0/KVyPwvUo+D+BlUOLbOftP1K4HoXrUfg/GsBbIEHx7T97FK5H4Xr4P5ZDi2zn++0/pHA9Ctej+D8vbqMBvAXuP83MzMzMzPg/yJi7lpAP7j/2KFyPwvX4P2HD0ytlGe4/H4XrUbge+T/67evAOSPuP0jhehSuR/k/kxgEVg4t7j9xPQrXo3D5P0vqBDQRNu4/mpmZmZmZ+T8CvAUSFD/uP8P1KFyPwvk/uY0G8BZI7j/sUbgehev5P3BfB84ZUe4/FK5H4XoU+j9F2PD0SlnuPz0K16NwPfo//Knx0k1i7j9mZmZmZmb6P9Ei2/l+au4/j8L1KFyP+j+mm8QgsHLuP7gehetRuPo/exSuR+F67j/hehSuR+H6P1CNl24Sg+4/CtejcD0K+z9QjZduEoPuPzMzMzMzM/s/GCZTBaOS7j9cj8L1KFz7P+2ePCzUmu4/hetRuB6F+z/gvg6cM6LuP65H4XoUrvs/097gC5Op7j/Xo3A9Ctf7P8X+snvysO4/AAAAAAAA/D/WxW00gLfuPylcj8L1KPw/yeU/pN++7j9SuB6F61H8P9qs+lxtxe4/exSuR+F6/D/NzMzMzMzuP6RwPQrXo/w/3pOHhVrT7j/NzMzMzMz8P+5aQj7o2e4/9ihcj8L1/D8dyeU/pN/uPx+F61G4Hv0/LpCg+DHm7j9I4XoUrkf9Pz9XW7G/7O4/cT0K16Nw/T9PHhZqTfPuP5qZmZmZmf0/nDOitDf47j/D9Shcj8L9P636XG3F/u4/7FG4HoXr/T/caABvgQTvPxSuR+F6FP4/CtejcD0K7z89CtejcD3+P1fsL7snD+8/ZmZmZmZm/j+GWtO84xTvP4/C9Shcj/4/0m9fB84Z7z+4HoXrUbj+PwHeAgmKH+8/4XoUrkfh/j9N845TdCTvPwrXo3A9Cv8/mggbnl4p7z8zMzMzMzP/P+cdp+hILu8/XI/C9Shc/z8zMzMzMzPvP4XrUbgehf8/gEi/fR047z+uR+F6FK7/P8xdS8gHPe8/16NwPQrX/z83GsBbIEHvPwAAAAAAAABAodY07zhF7z8UrkfhehQAQO7rwDkjSu8/KVyPwvUoAEBYqDXNO07vPz0K16NwPQBAw2SqYFRS7z9SuB6F61EAQC0hH/RsVu8/ZmZmZmZmAECY3ZOHhVrvP3sUrkfhegBAApoIG55e7z+PwvUoXI8AQG1Wfa62Yu8/pHA9CtejAED1udqK/WXvP7gehetRuABAYHZPHhZq7z/NzMzMzMwAQOjZrPpcbe8/4XoUrkfhAEBTliGOdXHvP/YoXI/C9QBA2/l+arx07z8K16NwPQoBQGRd3EYDeO8/H4XrUbgeAUDswDkjSnvvPzMzMzMzMwFAdCSX/5B+7z9I4XoUrkcBQP2H9NvXge8/XI/C9ShcAUCF61G4HoXvP3E9CtejcAFADk+vlGWI7z+F61G4HoUBQLRZ9bnaiu8/mpmZmZmZAUA8vVKWIY7vP65H4XoUrgFA48eYu5aQ7z/D9Shcj8IBQGsr9pfdk+8/16NwPQrXAUARNjy9UpbvP+xRuB6F6wFAuECC4seY7z8AAAAAAAACQECk374OnO8/FK5H4XoUAkDmriXkg57vPylcj8L1KAJAjLlrCfmg7z89CtejcD0CQDPEsS5uo+8/UrgehetRAkDZzvdT46XvP2ZmZmZmZgJAf9k9eVio7z97FK5H4XoCQCbkg57Nqu8/j8L1KFyPAkDqlbIMcazvP6RwPQrXowJAkKD4Meau7z+4HoXrUbgCQDarPldbse8/zczMzMzMAkD7XG3F/rLvP+F6FK5H4QJAoWez6nO17z/2KFyPwvUCQGUZ4lgXt+8/CtejcD0KA0ApyxDHurjvPx+F61G4HgNA0NVW7C+77z8zMzMzMzMDQJSHhVrTvO8/SOF6FK5HA0BYObTIdr7vP1yPwvUoXANAHOviNhrA7z9xPQrXo3ADQMP1KFyPwu8/hetRuB6FA0CHp1fKMsTvP5qZmZmZmQNAS1mGONbF7z+uR+F6FK4DQA8LtaZ5x+8/w/UoXI/CA0DxY8xdS8jvP9ejcD0K1wNAtRX7y+7J7z/sUbgehesDQHrHKTqSy+8/AAAAAAAABEA+eVioNc3vPxSuR+F6FARAAiuHFtnO7z8pXI/C9SgEQOSDns2qz+8/PQrXo3A9BECoNc07TtHvP1K4HoXrUQRAbef7qfHS7z9mZmZmZmYEQE9AE2HD0+8/exSuR+F6BEAT8kHPZtXvP4/C9ShcjwRA9UpZhjjW7z+kcD0K16MEQLn8h/Tb1+8/uB6F61G4BECbVZ+rrdjvP83MzMzMzARAfa62Yn/Z7z/hehSuR+EEQEJg5dAi2+8/9ihcj8L1BEAkufyH9NvvPwrXo3A9CgVABhIUP8bc7z8fhetRuB4FQMrDQq1p3u8/MzMzMzMzBUCsHFpkO9/vP0jhehSuRwVAjnVxGw3g7z9cj8L1KFwFQHDOiNLe4O8/cT0K16NwBUBSJ6CJsOHvP4XrUbgehQVANIC3QILi7z+amZmZmZkFQBfZzvdT4+8/rkfhehSuBUD5MeauJeTvP8P1KFyPwgVA24r9Zffk7z/Xo3A9CtcFQL3jFB3J5e8/7FG4HoXrBUCfPCzUmubvPwAAAAAAAAZAgZVDi2zn7z8UrkfhehQGQGPuWkI+6O8/KVyPwvUoBkBFR3L5D+nvPz0K16NwPQZAJ6CJsOHp7z9SuB6F61EGQAn5oGez6u8/ZmZmZmZmBkAJ+aBns+rvP3sUrkfhegZA7FG4HoXr7z+PwvUoXI8GQM6qz9VW7O8/pHA9CtejBkCwA+eMKO3vP7gehetRuAZAsAPnjCjt7z/NzMzMzMwGQJJc/kP67e8/4XoUrkfhBkB0tRX7y+7vP/YoXI/C9QZAdLUV+8vu7z8K16NwPQoHQFYOLbKd7+8/H4XrUbgeB0A4Z0Rpb/DvPzMzMzMzMwdAOGdEaW/w7z9I4XoUrkcHQBrAWyBB8e8/XI/C9ShcB0AawFsgQfHvP3E9CtejcAdA/Bhz1xLy7z+F61G4HoUHQN5xio7k8u8/mpmZmZmZB0DecYqO5PLvP65H4XoUrgdAwcqhRbbz7z/D9Shcj8IHQMHKoUW28+8/16NwPQrXB0CjI7n8h/TvP+xRuB6F6wdAoyO5/If07z8AAAAAAAAIQIV80LNZ9e8/FK5H4XoUCEArhxbZzvfvPylcj8L1KAhA0ZFc/kP67z89CtejcD0IQJZDi2zn++8/UrgehetRCEBa9bnaiv3vP2ZmZmZmZghAPE7RkVz+7z97FK5H4XoIQDxO0ZFc/u8/j8L1KFyPCEAep+hILv/vP6RwPQrXowhAHqfoSC7/7z+4HoXrUbgIQAAAAAAAAPA/AAAAAAAAEEAAAAAAAADwPwAAAAAAABRAAAAAAAAA8D8AAAAAAKSeQAAAAAZ2m/BBAAAAAAConkAAAAATHabwQQAAAAAArJ5AAAAAVyOx8EEAAAAAALCeQAAAALsGuvBBAAAAAAC0nkAAAAAOtMjwQQAAAAAAuJ5AAAAAcNPO8EEAAAAAALyeQAAAAOJs3PBBAAAAAADAnkAAAABv2+XwQQAAAAAAxJ5AAAAA1wr+8EEAAAAAAMieQAAAAJdQAvFBAAAAAADMnkAAAAAhewzxQQAAAAAA0J5AAAAAj/0W8UEAAAAAANSeQAAAAKH/KvFBAAAAAADYnkAAAACZdzPxQQAAAAAA3J5AAAAAaPM48UEAAAAAAOCeQAAAAG2KOPFBAAAAAADknkAAAACe8DfxQQAAAAAA6J5AAAAAG1Y88UEAAAAAAOyeQAAAAAHFRvFBAAAAAADwnkAAAAAbT1LxQQAAAAAA9J5AAAAApMRT8UEAAAAAAPieQAAAALioZfFBAAAAAAD8nkAAAABgXW3xQQAAAAAAAJ9AAAAAAwOJ8UEAAAAAAASfQAAAACqHpvFBAAAAAAAIn0AAAADnEL/xQQAAAAAADJ9AAAAAuKPO8UEAAAAAABCfQAAAAJNG4vFBAAAAAAAUn0AAAAAXWvDxQQAAAAAAGJ9AAAAAmnz/8UEAAAAAAByfQAAAALt/CPJBAAAAAAAgn0AAAACvDjDyQQAAAAAAJJ9AAAAAVWlN8kEAAAAAACifQAAAAOiyXPJBAAAAAAAsn0AAAAAGrlzyQQAAAAAAMJ9AAAAA0nRg8kEAAAAAADSfQAAAAFCPbfJBAAAAAAA4n0AAAABxIXTyQQAAAAAAPJ9AAAAA1c9w8kEAAAAAAECfQAAAAO8GdfJBAAAAAABEn0AAAAA9BnPyQQAAAAAASJ9AAAAA8MJn8kEAAAAAAEyfQAAAACADXPJBAAAAAABQn0AAAACMMmbyQQAAAAAAVJ9AAAAAyYpn8kEAAAAAAFifQAAAALdqWPJBAAAAAABcn0AAAADE3FbyQQAAAAAAYJ9AAAAA/g5U8kEAAAAAAGSfQAAAANx7J/JBAAAAAABon0AAAAAg3CPyQQAAAAAAbJ9AAAAA9iMu8kEAAAAAAHCfQAAAAEwzN/JBAAAAAAB0n0AAAAA/3zPyQQAAAAAAeJ9AAAAA6xtB8kEAAAAAALCdQAAAANB945RBAAAAAAC0nUAAAACA+BKVQQAAAAAAuJ1AAAAAQCtIlUEAAAAAALydQAAAADB+bpVBAAAAAADAnUAAAAAA+seVQQAAAAAAxJ1AAAAAULoHlkEAAAAAAMidQAAAAECHO5ZBAAAAAADMnUAAAACAiIuWQQAAAAAA0J1AAAAAQNLRlkEAAAAAANSdQAAAADDc/5ZBAAAAAADYnUAAAADwhU+XQQAAAAAA3J1AAAAAYKd3l0EAAAAAAOCdQAAAANC4qpdBAAAAAADknUAAAAAg7vyXQQAAAAAA6J1AAAAAgOtimEEAAAAAAOydQAAAAEApkphBAAAAAADwnUAAAACgFtGYQQAAAAAA9J1AAAAAAIwjmUEAAAAAAPidQAAAAEBCc5lBAAAAAAD8nUAAAABgmMWZQQAAAAAAAJ5AAAAAwAIFmkEAAAAAAASeQAAAAKA1LppBAAAAAAAInkAAAADAh1eaQQAAAAAADJ5AAAAAwHDDmkEAAAAAABCeQAAAAECi2ppBAAAAAAAUnkAAAADA3RmbQQAAAAAAGJ5AAAAAQFVPm0EAAAAAAByeQAAAAOCimJtBAAAAAAAgnkAAAACAqdibQQAAAAAAJJ5AAAAAgF4jnEEAAAAAACieQAAAAMATiJxBAAAAAAAsnkAAAACAmpacQQAAAAAAMJ5AAAAAwALznEEAAAAAADSeQAAAAABJK51BAAAAAAA4nkAAAACgfY2dQQAAAAAAPJ5AAAAAYPzGnUEAAAAAAECeQAAAAKDPJp5BAAAAAABEnkAAAADAklKeQQAAAAAASJ5AAAAAoLN+nkEAAAAAAEyeQAAAACAd4J5BAAAAAABQnkAAAABgzwafQQAAAAAAVJ5AAAAAQPKFn0EAAAAAAFieQAAAAKDmDqBBAAAAAABcnkAAAADgnUmgQQAAAAAAYJ5AAAAAcNaPoEEAAAAAAGSeQAAAADCuz6BBAAAAAABonkAAAACgCgOhQQAAAAAAbJ5AAAAAIMNCoUEAAAAAAHCeQAAAAIBijqFBAAAAAAB0nkAAAACAOuihQQAAAAAAeJ5AAAAAUM4kokEAAAAAAHyeQAAAAICGgqJBAAAAAACAnkAAAACQTCSjQQAAAAAAhJ5AAAAAoDbAo0EAAAAAAIieQAAAAHBPT6RBAAAAAACMnkAAAABApNSkQQAAAAAAkJ5AAAAAMKSJpUEAAAAAAJSeQAAAAID6LaZBAAAAAACYnkAAAACgFXWmQQAAAAAAnJ5AAAAAMFf4pkEAAAAAAKCeQAAAAJDtg6dBAAAAAACknkAAAACgUHSoQQAAAAAAqJ5AAAAAwJuzqEEAAAAAAKyeQAAAAACoxalBAAAAAACwnkAAAADAw9CpQQAAAAAAtJ5AAAAAIDqLqkEAAAAAALieQAAAALB2+qpBAAAAAAC8nkAAAACQPbKrQQAAAAAAwJ5AAAAAsNoNrEEAAAAAAMSeQAAAANBYg6xBAAAAAADInkAAAACgCyOtQQAAAAAAzJ5AAAAAILq3rUEAAAAAANCeQAAAACBtqa5BAAAAAADUnkAAAACwkgevQQAAAAAA2J5AAAAAAL81r0EAAAAAANyeQAAAAHDsW69BAAAAAADgnkAAAABgFBewQQAAAAAA5J5AAAAAsF1VsEEAAAAAAOieQAAAAMiBeLBBAAAAAADsnkAAAAAA4MiwQQAAAAAA8J5AAAAAUITjsEEAAAAAAPSeQAAAAMg9rbBBAAAAAAD4nkAAAAAIeyWxQQAAAAAA/J5AAAAAUCbJsEEAAAAAAACfQAAAAPjM/LBBAAAAAAAEn0AAAAD4DQexQQAAAAAACJ9AAAAAwGBVsUEAAAAAAAyfQAAAACgXlrFBAAAAAAAQn0AAAAAwls2xQQAAAAAAFJ9AAAAAIKgCskEAAAAAABifQAAAAKgYMrJBAAAAAAAcn0AAAAD4cv+yQQAAAAAAIJ9AAAAAEIPYsUEAAAAAACSfQAAAADgj2bFBAAAAAAAon0AAAADgEX6yQQAAAAAALJ9AAAAA0C80skEAAAAAADCfQAAAAHjjULJBAAAAAAA0n0AAAACoEb+zQQAAAAAAOJ9AAAAAiJnLskEAAAAAADyfQAAAAAAxcbJBAAAAAABAn0AAAAD4E32yQQAAAAAARJ9AAAAAAGqmskEAAAAAAEifQAAAAFiWNbNBAAAAAABMn0AAAABgxo6zQQAAAAAAUJ9AAAAAMNgztEEAAAAAAFSfQAAAAGCVpbRBAAAAAABYn0AAAADwTD+1QQAAAAAAXJ9AAAAAmDgptUEAAAAAAGCfQAAAAOCrfLVBAAAAAABkn0AAAABAQLW1QQAAAAAAaJ9AAAAAgGwbtkEAAAAAAGyfQAAAAFBPNrZBAAAAAABwn0AAAAAQs7K2QQAAAAAAdJ9AAAAAkKm+tkEAAAAAAHifQAAAANB8HrdBAAAAAACknkBmZmZmZmYpQAAAAAAAtJ5AUrgehevRKEAAAAAAANyeQHsUrkfh+iZAAAAAAADsnkCuR+F6FK4lQAAAAAAAAJ9AhetRuB6FI0AAAAAAABCfQOF6FK5HYSBAAAAAAAAsn0C4HoXrUbgaQAAAAAAAQJ9AzczMzMzMGEAAAAAAAFifQHE9CtejcBZAAAAAAABon0Bcj8L1KFwUQAAAAAAAfJ9AAAAAAAAAFEAAAAAAALCdQAAAAEQSo/BBAAAAAAC0nUAAAABY9cPxQQAAAAAAuJ1AAAAAYawD8kEAAAAAALydQAAAAG6sDvNBAAAAAADAnUAAAACLyInzQQAAAAAAxJ1AAAAACOhp9EEAAAAAAMidQAAAANp/RfVBAAAAAADMnUAAAAAa74X2QQAAAAAA0J1AAAAAsfNT9kEAAAAAANSdQAAAALn+x/ZBAAAAAADYnUAAAAAvhVz3QQAAAAAA3J1AAAAAR5rG9kEAAAAAAOCdQAAAAILyzvZBAAAAAADknUAAAAABgVf3QQAAAAAA6J1AAAAA99If9kEAAAAAAOydQAAAAFjh2PVBAAAAAADwnUAAAADRy7r2QQAAAAAA9J1AAAAARMIy90EAAAAAAPidQAAAADUEHvdBAAAAAAD8nUAAAACrnLv1QQAAAAAAAJ5AAAAAN+hu90EAAAAAAASeQAAAAIMtmPZBAAAAAAAInkAAAABiaiv3QQAAAAAADJ5AAAAAsPvb+EEAAAAAABCeQAAAAB5SF/lBAAAAAAAUnkAAAADVEFH5QQAAAAAAGJ5AAAAACeA0+UEAAAAAAByeQAAAAEM8H/tBAAAAAAAgnkAAAADC7Tn7QQAAAAAAJJ5AAAAAPYmz/EEAAAAAACieQAAAAEHFm/xBAAAAAAAsnkAAAACOrVP7QQAAAAAAMJ5AAAAA6MPH+EEAAAAAADSeQAAAACiJU/lBAAAAAAA4nkAAAAANUDj6QQAAAAAAPJ5AAAAAUQfi+kEAAAAAAECeQAAAACH9W/xBAAAAAABEnkAAAABaUif9QQAAAAAASJ5AAAAAQJ09/EEAAAAAAEyeQAAAAJhfMf1BAAAAAABQnkAAAACqBmP+QQAAAAAAVJ5AAAAAlhR9/kEAAAAAAFieQAAAANBIzf5BAAAAAABcnkAAAAC4jVT/QQAAAAAAYJ5AAAAAAao1/0EAAAAAAGSeQAAAAK0JZPxBAAAAAABonkAAAABU9BX/QQAAAAAAbJ5AAACAFaLQAEIAAAAAAHCeQAAAADFhfwFCAAAAAAB0nkAAAIAj8mIBQgAAAAAAeJ5AAAAAq6+1AkIAAAAAAHyeQAAAAEfTBwVCAAAAAACAnkAAAACEl3QFQgAAAAAAhJ5AAAAAs//NBUIAAAAAAIieQAAAAI7EggZCAAAAAACMnkAAAADbNhIIQgAAAAAAkJ5AAAAAWGGCCUIAAAAAAJSeQAAAAFe5XApCAAAAAACYnkAAAACE2UULQgAAAAAAnJ5AAAAA9ITUC0IAAAAAAKCeQAAAAF9PmQxCAAAAAACknkAAAAA2VzwNQgAAAAAAqJ5AAAAASU71DUIAAAAAAKyeQAAAAGPQJQ9CAAAAAACwnkAAAIBRmxQQQgAAAAAAtJ5AAACAqIixEEIAAAAAALieQAAAADsVPxFCAAAAAAC8nkAAAIDRKdIRQgAAAAAAwJ5AAACAzLtdEkIAAAAAAMSeQAAAAFEqIRNCAAAAAADInkAAAABZv/sTQgAAAAAAzJ5AAACAOHYwFEIAAAAAANCeQAAAAHo+lxRCAAAAAADUnkAAAAAN73oVQgAAAAAA2J5AAAAAH5VKFUIAAAAAANyeQAAAAAmTRBVCAAAAAADgnkAAAACz3DsWQgAAAAAA5J5AAAAArg3sFkIAAAAAAOieQAAAAOHRexdCAAAAAADsnkAAAACd5NQXQgAAAAAA8J5AAACA+wyIF0IAAAAAAPSeQAAAgIUeLhdCAAAAAAD4nkAAAIA1h/wWQgAAAAAA/J5AAAAAlmKaF0IAAAAAAACfQAAAgDvLKRhCAAAAAAAEn0AAAICCxH8YQgAAAAAACJ9AAAAAtW32GEIAAAAAAAyfQAAAgESfcxlCAAAAAAAQn0AAAAC9QBoaQgAAAAAAFJ9AAACAPw5tGkIAAAAAABifQAAAgOfHCxpCAAAAAAAcn0AAAADwObYaQgAAAAAAIJ9AAAAAZPG3GkIAAAAAACSfQAAAgHJWahpCAAAAAAAon0AAAIBRiG0aQgAAAAAALJ9AAACAVhrWGkIAAAAAADCfQAAAAEBEPRtCAAAAAAA0n0AAAAAQheMdQgAAAAAAOJ9AAAAAy3HAG0IAAAAAADyfQAAAAHyULhtCAAAAAABAn0AAAICz8p8bQgAAAAAARJ9AAACAeYAGG0IAAAAAAEifQAAAAL+t4BtCAAAAAABMn0AAAADK9WkcQgAAAAAAUJ9AAACAvb80HkIAAAAAAFSfQAAAAGcjHx9CAAAAAABYn0AAAMC2cSAgQgAAAAAAXJ9AAACAhk92IEIAAAAAAGCfQAAAADDnCiBCAAAAAABkn0AAAACj+N8fQgAAAAAAaJ9AAACAEHzTIEIAAAAAAGyfQAAAABF0WiFCAAAAAABwn0AAAMAbdawhQgAAAAAAdJ9AAADAud8MIkIAAAAAAHifQAAAQBZfdCJCAAAAAACwnUAAAAAAgLE0QQAAAAAAtJ1AAAAAAAzkNEEAAAAAALidQAAAAABIIDVBAAAAAAC8nUAAAAAAQFo1QQAAAAAAwJ1AAAAAALCZNUEAAAAAAMSdQAAAAADw2zVBAAAAAADInUAAAAAA3h82QQAAAAAAzJ1AAAAAAH5hNkEAAAAAANCdQAAAAABwoTZBAAAAAADUnUAAAAAA3N82QQAAAAAA2J1AAAAAAKQhN0EAAAAAANydQAAAAAAOZzdBAAAAAADgnUAAAAAAvso3QQAAAAAA5J1AAAAAAIA/OEEAAAAAAOidQAAAAAB0vjhBAAAAAADsnUAAAAAAgEg5QQAAAAAA8J1AAAAAALDWOUEAAAAAAPSdQAAAAACUYDpBAAAAAAD4nUAAAAAASuE6QQAAAAAA/J1AAAAAAO5VO0EAAAAAAACeQAAAAAC6wDtBAAAAAAAEnkAAAAAAmiE8QQAAAAAACJ5AAAAAANx/PEEAAAAAAAyeQAAAAAAs5DxBAAAAAAAQnkAAAAAAGE09QQAAAAAAFJ5AAAAAAK6sPUEAAAAAABieQAAAAACeBz5BAAAAAAAcnkAAAAAAfl4+QQAAAAAAIJ5AAAAAAGquPkEAAAAAACSeQAAAAAAm8j5BAAAAAAAonkAAAAAAviw/QQAAAAAALJ5AAAAAAFxXP0EAAAAAADCeQAAAAAAKgT9BAAAAAAA0nkAAAAAA2KM/QQAAAAAAOJ5AAAAAAGbKP0EAAAAAADyeQAAAAACe8T9BAAAAAABAnkAAAAAA8wtAQQAAAAAARJ5AAAAAAP4jQEEAAAAAAEieQAAAAABmPkBBAAAAAABMnkAAAAAATGJAQQAAAAAAUJ5AAAAAAHWJQEEAAAAAAFSeQAAAAAAkG0FBAAAAAABYnkAAAAAAdFZCQQAAAAAAXJ5AAAAAAIkcREEAAAAAAGCeQAAAAAB6OEZBAAAAAABknkAAAAAA/4hIQQAAAAAAaJ5AAAAAAJvgSkEAAAAAAGyeQAAAAACoHE1BAAAAAABwnkAAAAAArgpPQQAAAAAAdJ5AAAAAAClEUEEAAAAAAHieQAAAAADhs1BBAAAAAAB8nkAAAAAAV/dQQQAAAAAAgJ5AAAAAgNE4UUEAAAAAAISeQAAAAADffVFBAAAAAACInkAAAAAAusVRQQAAAAAAjJ5AAAAAgIITUkEAAAAAAJCeQAAAAADRYlJBAAAAAACUnkAAAACAUbdSQQAAAAAAmJ5AAAAAAJEVU0EAAAAAAJyeQAAAAAAIe1NBAAAAAACgnkAAAACA+OtTQQAAAAAApJ5AAAAAgLw/VUEAAAAAAKieQAAAAIBsDFZBAAAAAACsnkAAAAAANsxWQQAAAAAAsJ5AAAAAAAumV0EAAAAAALSeQAAAAAAGqlhBAAAAAAC4nkAAAACAwdZZQQAAAAAAvJ5AAAAAgHncWkEAAAAAAMCeQAAAAIDyrVtBAAAAAADEnkAAAAAAWV1cQQAAAAAAyJ5AAAAAgBNBXEEAAAAAAMyeQAAAAABV81tBAAAAAADQnkAAAAAAVY1dQQAAAAAA1J5AAAAAgJRFXkEAAAAAANieQAAAAIBnLF5BAAAAAADcnkAAAACA6jRfQQAAAAAA4J5AAAAAQB4KYEEAAAAAAOSeQAAAAAD3emBBAAAAAADonkAAAADAXdtgQQAAAAAA7J5AAAAAAPZmYUEAAAAAAPCeQAAAAIB/mWFBAAAAAAD0nkAAAAAArGVhQQAAAAAA+J5AAAAAAP8bYkEAAAAAAPyeQAAAAEB2LWJBAAAAAAAAn0AAAAAALfhhQQAAAAAABJ9AAAAAAFD4YUEAAAAAAAifQAAAAEB3WWJBAAAAAAAMn0AAAAAApAdjQQAAAAAAEJ9AAAAAAGyLYkEAAAAAABSfQAAAAMDkxWJBAAAAAAAYn0AAAACAk89iQQAAAAAAHJ9AAAAAgJYDY0EAAAAAACCfQAAAAAD4DWNBAAAAAAAkn0AAAABAWuliQQAAAAAAKJ9AAAAAAOVNY0EAAAAAACyfQAAAAACmfWNBAAAAAAAwn0AAAAAA8ppjQQAAAAAANJ9AAAAAAP8yZEEAAAAAADifQAAAAACCUWNBAAAAAAA8n0AAAADApdJiQQAAAAAAQJ9AAAAAwA5RYkEAAAAAAESfQAAAAEAxi2JBAAAAAABIn0AAAABAyw5jQQAAAAAATJ9AAAAAAItDY0EAAAAAAFCfQAAAAAD1v2NBAAAAAABUn0AAAAAADw9kQQAAAAAAWJ9AAAAAALWaZEEAAAAAAFyfQAAAAIBNxGNBAAAAAABgn0AAAACAoORjQQAAAAAAZJ9AAAAAgMEdZEEAAAAAAGifQAAAAABjGmRBAAAAAABsn0AAAAAAyOxjQQAAAAAAcJ9AAAAAgM00ZEEAAAAAAHSfQAAAAABrhWRBAAAAAAB4n0AAAACAz7lkQQAAAAAAeJ9Aj8L1KNxwpUAAAAAAAHyfQEjhehQuiaVAAAAAAACAn0D2KFyPQrqlQAAAAAAAhJ9AAAAAAIDapUAAAAAAAIifQHE9Ctcju6VAAAAAAACMn0CamZmZmbmlQAAAAAAAkJ9APQrXo3CWpUAAAAAAAJSfQOF6FK5HFaZAAAAAAAAYn0AAAADahKDuQQAAAAAAHJ9AAAAACMWb7kEAAAAAACCfQAAAAEpWBe5BAAAAAAAkn0AAAACYY9ftQQAAAAAAKJ9AAAAAEhvE7UEAAAAAACyfQAAAAMwr0e1BAAAAAAAwn0AAAAAAKdftQQAAAAAANJ9AAAAA2P/X7UEAAAAAADifQAAAANzD0+1BAAAAAAA8n0AAAABifentQQAAAAAAQJ9AAAAAjGrr7UEAAAAAAESfQAAAAOjj9+1BAAAAAABIn0AAAABQZhfuQQAAAAAATJ9AAAAA6rA37kEAAAAAAFCfQAAAAGYOLO5BAAAAAABUn0AAAAAkcjLuQQAAAAAAWJ9AAAAAeAlW7kEAAAAAAFyfQAAAAEz+X+5BAAAAAABgn0AAAADwfWnuQQAAAAAAZJ9AAAAAeMjI7kEAAAAAAGifQAAAAO4H1+5BAAAAAABsn0AAAAB6G8nuQQAAAAAAcJ9AAAAAPJ287kEAAAAAAHSfQAAAAIpCye5BAAAAAAB4n0AAAADQ3rTuQQAAAAAAQJ9AqMZLN4lBwD8AAAAAAESfQPyp8dJNYsA/AAAAAABIn0CkcD0K16PAPwAAAAAATJ9AqMZLN4lBwD8AAAAAAFCfQFTjpZvEIMA/AAAAAABUn0C4HoXrUbi+PwAAAAAAWJ9AKVyPwvUovD8AAAAAAFyfQJqZmZmZmbk/AAAAAABgn0ACK4cW2c63PwAAAAAAZJ9Asp3vp8ZLtz8AAAAAAGifQBKDwMqhRbY/AAAAAABsn0DLoUW28/20PwAAAAAAcJ9AI9v5fmq8tD8AAAAAAHSfQNNNYhBYObQ/AAAAAAB4n0AzMzMzMzOzPwAAAAAAfJ9Ag8DKoUW2sz8AAAAAAICfQNv5fmq8dLM/AAAAAACEn0CTGARWDi2yPwAAAAAAiJ9A46WbxCCwsj8AAAAAAIyfQDMzMzMzM7M/AAAAAACQn0DD9Shcj8K1PwAAAAAAlJ9AukkMAiuHtj8AAAAAAJifQBKDwMqhRbY/AAAAAACcn0DD9Shcj8K1PwAAAAAAoJ9Ay6FFtvP9tD8AAAAAAKSeQClcj8L1qDNAAAAAAAConkDD9ShcjwI0QAAAAAAArJ5AexSuR+F6NEAAAAAAALCeQPYoXI/CdTRAAAAAAAC0nkD2KFyPwrU0QAAAAAAAuJ5AFK5H4XoUNUAAAAAAALyeQClcj8L1aDVAAAAAAADAnkA9CtejcL01QAAAAAAAxJ5AcT0K16OwNUAAAAAAAMieQEjhehSuxzVAAAAAAADMnkD2KFyPwvU1QAAAAAAA0J5ApHA9CtcjNkAAAAAAANSeQArXo3A9CjZAAAAAAADYnkDsUbgehWs2QAAAAAAA3J5AAAAAAACANkAAAAAAAOCeQEjhehSuxzZAAAAAAADknkBI4XoUrsc2QAAAAAAA6J5AXI/C9SgcN0AAAAAAAOyeQFK4HoXrUTdAAAAAAADwnkB7FK5H4Xo3QAAAAAAA9J5AhetRuB6FN0AAAAAAAPieQHE9CtejcDdAAAAAAAD8nkBmZmZmZqY3QAAAAAAAAJ9AuB6F61H4N0AAAAAAAASfQLgehetReDhAAAAAAAAIn0CuR+F6FK44QAAAAAAADJ9ArkfhehTuOEAAAAAAABCfQArXo3A9CjlAAAAAAAAUn0AfhetRuB45QAAAAAAAGJ9AexSuR+E6OUAAAAAAAByfQEjhehSuBzlAAAAAAAAgn0Bcj8L1KNw4QAAAAAAAJJ9AH4XrUbgeOUAAAAAAACifQMP1KFyPwjlAAAAAAAAsn0CkcD0K12M6QAAAAAAAMJ9AUrgeheuROkAAAAAAADSfQMP1KFyPwjpAAAAAAAA4n0D2KFyPwjU7QAAAAAAAPJ9AXI/C9SicO0AAAAAAAECfQOF6FK5H4TtAAAAAAABEn0BmZmZmZuY7QAAAAAAASJ9AhetRuB5FPEAAAAAAAEyfQKRwPQrXozxAAAAAAABQn0AfhetRuN48QAAAAAAAVJ9ASOF6FK5HPUAAAAAAAFifQM3MzMzMzD1AAAAAAABcn0BI4XoUroc+QAAAAAAAYJ9AKVyPwvXoPkAAAAAAAGSfQBSuR+F6FD9AAAAAAABon0CF61G4HoU/QAAAAAAAbJ9Aw/UoXI/CP0AAAAAAAHCfQM3MzMzMDEBAAAAAAAB0n0BxPQrXoxBAQAAAAAAApJ5AZmZmZmbmREAAAAAAAKieQGZmZmZmRkVAAAAAAACsnkDNzMzMzCxFQAAAAAAAsJ5A7FG4HoVrRUAAAAAAALSeQKRwPQrXY0VAAAAAAAC4nkD2KFyPwlVFQAAAAAAAvJ5APQrXo3A9RUAAAAAAAMCeQIXrUbgeJUVAAAAAAADEnkBxPQrXoxBFQAAAAAAAyJ5AMzMzMzNzRUAAAAAAAMyeQOF6FK5HIUVAAAAAAADQnkCF61G4HuVEQAAAAAAA1J5AKVyPwvVIRUAAAAAAANieQHsUrkfh+kRAAAAAAADcnkCamZmZmTlFQAAAAAAA4J5ArkfhehTuREAAAAAAAOSeQMP1KFyPIkVAAAAAAADonkDXo3A9CrdFQAAAAAAA7J5A4XoUrkehRUAAAAAAAPCeQAAAAAAAoEVAAAAAAAD0nkCPwvUoXO9FQAAAAAAA+J5AuB6F61EYRkAAAAAAAPyeQD0K16NwnUZAAAAAAAAAn0CuR+F6FI5GQAAAAAAABJ9AH4XrUbh+RkAAAAAAAAifQBSuR+F6lEZAAAAAAAAMn0CPwvUoXK9GQAAAAAAAEJ9AmpmZmZnZRkAAAAAAABSfQKRwPQrX40ZAAAAAAAAYn0AAAAAAAKBGQAAAAAAAHJ9AUrgeheuRRkAAAAAAACCfQFyPwvUonEZAAAAAAAAkn0AzMzMzM9NGQAAAAAAAKJ9AFK5H4XoUR0AAAAAAACyfQB+F61G4HkdAAAAAAAAwn0DD9Shcj0JHQAAAAAAANJ9AMzMzMzNTR0AAAAAAADifQD0K16NwXUdAAAAAAAA8n0AUrkfhenRHQAAAAAAAQJ9AFK5H4XqUR0AAAAAAAESfQGZmZmZmhkdAAAAAAABIn0BI4XoUrmdHQAAAAAAATJ9Aw/UoXI9iR0AAAAAAAFCfQOF6FK5HYUdAAAAAAABUn0CF61G4HmVHQAAAAAAAWJ9AAAAAAACAR0AAAAAAAFyfQArXo3A9ykdAAAAAAABgn0BI4XoUrudHQAAAAAAAZJ9AZmZmZmbmR0AAAAAAAGifQIXrUbgeRUhAAAAAAABsn0A9CtejcF1IQAAAAAAAcJ9A16NwPQpXSEAAAAAAAHSfQM3MzMzMjEhAAAAAAACknkAAAACADhpmQQAAAAAAqJ5AAAAAgJkOaUEAAAAAAKyeQAAAAADWJmxBAAAAAACwnkAAAACA/mtvQQAAAAAAtJ5AAAAAgHM2ckEAAAAAALieQAAAAEDeJnVBAAAAAAC8nkAAAAAAjBZ3QQAAAAAAwJ5AAAAAwBQIeUEAAAAAAMSeQAAAAADhJntBAAAAAADInkAAAACA+kh+QQAAAAAAzJ5AAAAAgHP7f0EAAAAAANCeQAAAAAAcPIFBAAAAAADUnkAAAACgm7GCQQAAAAAA2J5AAAAAwJlSgkEAAAAAANyeQAAAAKBTLoVBAAAAAADgnkAAAABAOJWFQQAAAAAA5J5AAAAAIBtsh0EAAAAAAOieQAAAACCS3olBAAAAAADsnkAAAACANEmLQQAAAAAA8J5AAAAAoOj6jEEAAAAAAPSeQAAAAKBb04xBAAAAAAD4nkAAAACgWCuNQQAAAAAA/J5AAAAAYIUAkEEAAAAAAACfQAAAABB+45BBAAAAAAAEn0AAAACAF8aQQQAAAAAACJ9AAAAAwOZHkUEAAAAAAAyfQAAAAMAfE5JBAAAAAAAQn0AAAADQ6faSQQAAAAAAFJ9AAAAAsDPNkkEAAAAAABifQAAAAIBmZpJBAAAAAAAcn0AAAABQSgiSQQAAAAAAIJ9AAAAAwK2PkUEAAAAAACSfQAAAAIA2QpFBAAAAAAAon0AAAAAQwkSRQQAAAAAALJ9AAAAAYI6ukkEAAAAAADCfQAAAAODnsJNBAAAAAAA0n0AAAACwM2OTQQAAAAAAOJ9AAAAAwJC+k0EAAAAAADyfQAAAAODlPpRBAAAAAABAn0AAAAAw1EKTQQAAAAAARJ9AAAAAULSXk0EAAAAAAEifQAAAAHB+KpRBAAAAAABMn0AAAABQW6SUQQAAAAAAUJ9AAAAAMJA5lUEAAAAAAFSfQAAAAPCDU5VBAAAAAABYn0AAAACwAe2VQQAAAAAAXJ9AAAAAkHXolkEAAAAAAGCfQAAAABD3yJZBAAAAAABkn0AAAABQ2EeXQQAAAAAAaJ9AAAAAYMsHmEEAAAAAAGyfQAAAAMD7o5hBAAAAAABwn0AAAADgTF+ZQQAAAAAAdJ9AAAAAIPXamUEAAAAAAHifQAAAAGCwPppBAAAAAAAAAACamZmZmZnZPwAAAAAAANA/FK5H4XoU3j8AAAAAAADgPz0K16NwPeI/AAAAAAAA6D9SuB6F61HoPwAAAAAAAPA/AAAAAAAA8D8AAAAAAAD0P9ejcD0K1/M/AAAAAAAA+D/hehSuR+H2PwAAAAAAAPw/exSuR+F6+D8AAAAAAAAAQLgehetRuPo/AAAAAAAAAkAfhetRuB79PwAAAAAAAARA7FG4HoXr/T8AAAAAAAAGQGZmZmZmZv4/AAAAAAAACEC4HoXrUbj+PwAAAAAApJ5AAAAAAGYyUkEAAAAAAKieQAAAAADAVFNBAAAAAACsnkAAAACA7oVVQQAAAAAAsJ5AAAAAgC8fWEEAAAAAALSeQAAAAIA2TVpBAAAAAAC4nkAAAAAAhv1cQQAAAAAAvJ5AAAAAANcyXkEAAAAAAMCeQAAAAADzsF9BAAAAAADEnkAAAAAAVntgQQAAAAAAyJ5AAAAAAKaTYUEAAAAAAMyeQAAAAMCPrGJBAAAAAADQnkAAAACA9/tjQQAAAAAA1J5AAAAAAJmIZUEAAAAAANieQAAAAIAV92NBAAAAAADcnkAAAACA+1BlQQAAAAAA4J5AAAAAACu+ZkEAAAAAAOSeQAAAAIByw2dBAAAAAADonkAAAAAAWAJpQQAAAAAA7J5AAAAAAF33aUEAAAAAAPCeQAAAAIC8YmpBAAAAAAD0nkAAAAAAPcJpQQAAAAAA+J5AAAAAgBLgaUEAAAAAAPyeQAAAAIB7nWtBAAAAAAAAn0AAAAAAEKtsQQAAAAAABJ9AAAAAgITaa0EAAAAAAAifQAAAAIC98GxBAAAAAAAMn0AAAAAAGzVuQQAAAAAAEJ9AAAAAgIBOb0EAAAAAABSfQAAAAABGRW9BAAAAAAAYn0AAAAAAv/BtQQAAAAAAHJ9AAAAAAHlVbUEAAAAAACCfQAAAAIAk9mlBAAAAAAAkn0AAAACAVhtoQQAAAAAAKJ9AAAAAAACcaEEAAAAAACyfQAAAAIDvhWlBAAAAAAAwn0AAAACAyONpQQAAAAAANJ9AAAAAAFa2a0EAAAAAADifQAAAAAA+umtBAAAAAAA8n0AAAACAT7VrQQAAAAAAQJ9AAAAAgLf9akEAAAAAAESfQAAAAAD/hWtBAAAAAABIn0AAAAAA8eNrQQAAAAAATJ9AAAAAgJHKbkEAAAAAAFCfQAAAAIDED3BBAAAAAABUn0AAAACARyhwQQAAAAAAWJ9AAAAAABaOcEEAAAAAAFyfQAAAAIBIWHFBAAAAAABgn0AAAACAPFFvQQAAAAAAZJ9AAAAAgPPub0EAAAAAAGifQAAAAMDz33FBAAAAAABsn0AAAABAgOZyQQAAAAAAcJ9AAAAAwKDrckEAAAAAAHSfQAAAAED4NnNBAAAAAAB4n0AAAAAAXtRzQQBB9vwBC7O6A+A/AAAAAAAA4D8AAAAAAADwP83MzMzMzOw/AAAAAAAA+D9mZmZmZmbuPwAAAAAAAABAAAAAAAAA8D8AAAAAAKSeQLgehetRuDhAAAAAAAConkBmZmZmZiY5QAAAAAAArJ5AAAAAAADAOUAAAAAAALCeQJqZmZmZ2TlAAAAAAAC0nkBxPQrXozA6QAAAAAAAuJ5AMzMzMzNzOkAAAAAAALyeQMP1KFyPwjpAAAAAAADAnkCuR+F6FC47QAAAAAAAxJ5AzczMzMzMOkAAAAAAAMieQM3MzMzMzDpAAAAAAADMnkBSuB6F6xE7QAAAAAAA0J5AhetRuB5FO0AAAAAAANSeQEjhehSuxzpAAAAAAADYnkDXo3A9Chc7QAAAAAAA3J5AcT0K16PwOkAAAAAAAOCeQPYoXI/CNTtAAAAAAADknkCamZmZmRk7QAAAAAAA6J5AXI/C9SicO0AAAAAAAOyeQNejcD0KVzxAAAAAAADwnkDsUbgehas8QAAAAAAA9J5Aj8L1KFyPPEAAAAAAAPieQClcj8L1aDxAAAAAAAD8nkBxPQrXo/A8QAAAAAAAAJ9AXI/C9ShcPUAAAAAAAASfQFK4HoXrET5AAAAAAAAIn0BI4XoUrsc9QAAAAAAADJ9AzczMzMwMPkAAAAAAABCfQClcj8L1aD5AAAAAAAAUn0DXo3A9Cpc+QAAAAAAAGJ9ApHA9CtejPkAAAAAAAByfQI/C9ShcTz5AAAAAAAAgn0CuR+F6FG4+QAAAAAAAJJ9Aw/UoXI+CPkAAAAAAACifQFyPwvUoHD9AAAAAAAAsn0CuR+F6FG4/QAAAAAAAMJ9ACtejcD1KP0AAAAAAADSfQAAAAAAAgD9AAAAAAAA4n0A9CtejcB1AQAAAAAAAPJ9AUrgehetRQEAAAAAAAECfQOxRuB6Fi0BAAAAAAABEn0CPwvUoXG9AQAAAAAAASJ9ArkfhehSuQEAAAAAAAEyfQHE9Ctej8EBAAAAAAABQn0CkcD0K1wNBQAAAAAAAVJ9A9ihcj8I1QUAAAAAAAFifQEjhehSuh0FAAAAAAABcn0AzMzMzM9NBQAAAAAAAYJ9ApHA9CtcDQkAAAAAAAGSfQOF6FK5HIUJAAAAAAABon0DhehSuR2FCQAAAAAAAbJ9A16NwPQp3QkAAAAAAAHCfQK5H4XoUrkJAAAAAAAB0n0BmZmZmZsZCQAAAAAAApJ5AzczMzMzMNkAAAAAAAKieQDMzMzMzszdAAAAAAACsnkBmZmZmZiY4QAAAAAAAsJ5AexSuR+G6OEAAAAAAALSeQM3MzMzMDDlAAAAAAAC4nkBxPQrXo3A5QAAAAAAAvJ5ApHA9CtejOUAAAAAAAMCeQM3MzMzMzDlAAAAAAADEnkCkcD0K1+M5QAAAAAAAyJ5AcT0K16OwOkAAAAAAAMyeQHsUrkfhejpAAAAAAADQnkBI4XoUroc6QAAAAAAA1J5ApHA9CtcjO0AAAAAAANieQLgehetReDtAAAAAAADcnkDXo3A9Cpc7QAAAAAAA4J5AH4XrUbgePEAAAAAAAOSeQPYoXI/CtTxAAAAAAADonkCamZmZmdk9QAAAAAAA7J5A9ihcj8L1PUAAAAAAAPCeQFK4HoXr0T5AAAAAAAD0nkCamZmZmdk/QAAAAAAA+J5Aw/UoXI9CQEAAAAAAAPyeQArXo3A9akBAAAAAAAAAn0CkcD0K16NAQAAAAAAABJ9AmpmZmZn5QEAAAAAAAAifQPYoXI/CVUFAAAAAAAAMn0AK16NwPYpBQAAAAAAAEJ9AAAAAAAAAQkAAAAAAABSfQFyPwvUoPEJAAAAAAAAYn0B7FK5H4VpCQAAAAAAAHJ9AhetRuB5FQkAAAAAAACCfQEjhehSuR0JAAAAAAAAkn0CkcD0K12NCQAAAAAAAKJ9AmpmZmZm5QkAAAAAAACyfQPYoXI/C9UJAAAAAAAAwn0AzMzMzMzNDQAAAAAAANJ9AMzMzMzNzQ0AAAAAAADifQArXo3A9ikNAAAAAAAA8n0AfhetRuN5DQAAAAAAAQJ9AXI/C9Sg8REAAAAAAAESfQIXrUbgeRURAAAAAAABIn0AAAAAAAIBEQAAAAAAATJ9AKVyPwvWIREAAAAAAAFCfQIXrUbge5URAAAAAAABUn0Bcj8L1KFxFQAAAAAAAWJ9AUrgeheuxRUAAAAAAAFyfQPYoXI/CFUZAAAAAAABgn0CuR+F6FA5GQAAAAAAAZJ9AMzMzMzNTRkAAAAAAAGifQD0K16NwfUZAAAAAAABsn0A9CtejcL1GQAAAAAAAcJ9AXI/C9Si8RkAAAAAAAHSfQJqZmZmZmUZAAAAAAACknkAAAAAAACB1QAAAAAAAqJ5AAAAAAABwdUAAAAAAAKyeQAAAAAAA8HVAAAAAAACwnkAAAAAAAPB1QAAAAAAAtJ5AAAAAAAAwdkAAAAAAALieQAAAAAAAcHZAAAAAAAC8nkAAAAAAAMB2QAAAAAAAwJ5AAAAAAAAQd0AAAAAAAMSeQAAAAAAA4HZAAAAAAADInkAAAAAAAOB2QAAAAAAAzJ5AAAAAAAAQd0AAAAAAANCeQAAAAAAAMHdAAAAAAADUnkAAAAAAANB2QAAAAAAA2J5AAAAAAAAgd0AAAAAAANyeQAAAAAAAEHdAAAAAAADgnkAAAAAAAFB3QAAAAAAA5J5AAAAAAABAd0AAAAAAAOieQAAAAAAAoHdAAAAAAADsnkAAAAAAACB4QAAAAAAA8J5AAAAAAABQeEAAAAAAAPSeQAAAAAAAQHhAAAAAAAD4nkAAAAAAACB4QAAAAAAA/J5AAAAAAACAeEAAAAAAAACfQAAAAAAA0HhAAAAAAAAEn0AAAAAAAHB5QAAAAAAACJ9AAAAAAABQeUAAAAAAAAyfQAAAAAAAgHlAAAAAAAAQn0AAAAAAALB5QAAAAAAAFJ9AAAAAAADQeUAAAAAAABifQAAAAAAA4HlAAAAAAAAcn0AAAAAAAKB5QAAAAAAAIJ9AAAAAAACgeUAAAAAAACSfQAAAAAAAwHlAAAAAAAAon0AAAAAAAFB6QAAAAAAALJ9AAAAAAADAekAAAAAAADCfQAAAAAAAsHpAAAAAAAA0n0AAAAAAAOB6QAAAAAAAOJ9AAAAAAABwe0AAAAAAADyfQAAAAAAA0HtAAAAAAABAn0AAAAAAACB8QAAAAAAARJ9AAAAAAAAAfEAAAAAAAEifQAAAAAAAcHxAAAAAAABMn0AAAAAAANB8QAAAAAAAUJ9AAAAAAAAAfUAAAAAAAFSfQAAAAAAAYH1AAAAAAABYn0AAAAAAAPB9QAAAAAAAXJ9AAAAAAACAfkAAAAAAAGCfQAAAAAAA4H5AAAAAAABkn0AAAAAAABB/QAAAAAAAaJ9AAAAAAACAf0AAAAAAAGyfQAAAAAAAsH9AAAAAAABwn0AAAAAAAAiAQAAAAAAAdJ9AAAAAAAAQgEAAAAAAAKSeQAAAAAAACJ1AAAAAAAConkAAAAAAALCdQAAAAAAArJ5AAAAAAAC8nUAAAAAAALCeQAAAAAAAPJ5AAAAAAAC0nkAAAAAAAIyeQAAAAAAAuJ5AAAAAAADAnkAAAAAAALyeQAAAAAAAuJ5AAAAAAADAnkAAAAAAALSeQAAAAAAAxJ5AAAAAAADknkAAAAAAAMieQAAAAAAAnJ9AAAAAAADMnkAAAAAAADCfQAAAAAAA0J5AAAAAAAD0nkAAAAAAANSeQAAAAAAAoJ9AAAAAAADYnkAAAAAAAGyfQAAAAAAA3J5AAAAAAACsn0AAAAAAAOCeQAAAAAAAgJ9AAAAAAADknkAAAAAAAPifQAAAAAAA6J5AAAAAAABmoEAAAAAAAOyeQAAAAAAAVqBAAAAAAADwnkAAAAAAAGigQAAAAAAA9J5AAAAAAACCoEAAAAAAAPieQAAAAAAAwqBAAAAAAAD8nkAAAAAAAA6hQAAAAAAAAJ9AAAAAAAAUoUAAAAAAAASfQAAAAAAACKFAAAAAAAAIn0AAAAAAABChQAAAAAAADJ9AAAAAAAAuoUAAAAAAABCfQAAAAAAASKFAAAAAAAAUn0AAAAAAAFqhQAAAAAAAGJ9AAAAAAAA+oUAAAAAAAByfQAAAAAAAHKFAAAAAAAAgn0AAAAAAADChQAAAAAAAJJ9AAAAAAAA4oUAAAAAAACifQAAAAAAAVKFAAAAAAAAsn0AAAAAAAHihQAAAAAAAMJ9AAAAAAACMoUAAAAAAADSfQAAAAAAAoqFAAAAAAAA4n0AAAAAAAK6hQAAAAAAAPJ9AAAAAAAC8oUAAAAAAAECfQAAAAAAAzKFAAAAAAABEn0AAAAAAAMqhQAAAAAAASJ9AAAAAAADEoUAAAAAAAEyfQAAAAAAAxKFAAAAAAABQn0AAAAAAANahQAAAAAAAVJ9AAAAAAADmoUAAAAAAAFifQAAAAAAA+KFAAAAAAABcn0AAAAAAAB6iQAAAAAAAYJ9AAAAAAAA4okAAAAAAAGSfQAAAAAAAMqJAAAAAAABon0AAAAAAAFSiQAAAAAAAbJ9AAAAAAAB0okAAAAAAAHCfQAAAAAAAdKJAAAAAAAB0n0AAAAAAAISiQAAAAAAAyJ5ADi+ISE275T8AAAAAAMyeQDRHVn4ZjOU/AAAAAADQnkAmHHqLh3flPwAAAAAA1J5Az4HlCBlI5T8AAAAAANieQLpqniPyXeU/AAAAAADcnkDF46JaRJTlPwAAAAAA4J5ArMjogCTs5T8AAAAAAOSeQH+JeOv8W+Y/AAAAAADonkBVbMzriEPmPwAAAAAA7J5A6zao/dZO5j8AAAAAAPCeQDUNiuYBLOY/AAAAAAD0nkBeEmdF1ETmPwAAAAAA+J5Amj+mtWls5j8AAAAAAPyeQPVnP1JEhuY/AAAAAAAAn0Bi2GFM+nvmPwAAAAAABJ9Ao1pEFJO35j8AAAAAAAifQEW3XtODAuc/AAAAAAAMn0DROxVwz3PnPwAAAAAAEJ9AutqK/WV35z8AAAAAABSfQM8xIHu9e+c/AAAAAAAYn0BrY+yEl+DnPwAAAAAAHJ9APxpOmZvv5z8AAAAAACCfQLXf2omSEOg/AAAAAAAkn0ANVMa/zzjoPwAAAAAAKJ9AgzC3e7lP6D8AAAAAACyfQPrt68A5o+g/AAAAAAAwn0ASpb3BF6boPwAAAAAANJ9ADf5+MVuy6D8AAAAAADifQP8fJ0wYzeg/AAAAAAA8n0CEnPf/ccLoPwAAAAAAQJ9ADJBoAkWs6D8AAAAAAESfQJVgcTjzK+k/AAAAAABIn0BZpfRML7HoPwAAAAAATJ9AuDoA4q5e6D8AAAAAAFCfQEUr9wKzQug/AAAAAABUn0A0TG2pgzzoPwAAAAAAWJ9A73IR34lZ6D8AAAAAAFyfQF0ZVBuciOg/AAAAAABgn0CpL0s7NRfpPwAAAAAAZJ9AKes3E9MF6T8AAAAAAGifQPZ8zXLZ6Og/AAAAAABsn0DhQEgWMAHpPwAAAAAAcJ9ASMMpc/ON6D8AAAAAAHSfQIOkT6voj+g/AAAAAAB4n0AktVAyOTXqPwAAAAAAfJ9A3J+LhoxH6j8AAAAAAICfQC4aMh6lEuo/AAAAAACEn0DhfsADA4jqPwAAAAAAyJ5Age1gxD6B5T8AAAAAAMyeQNZz0vvGV+U/AAAAAADQnkA5Yi0+BUDlPwAAAAAA1J5AG6A01Cgk5T8AAAAAANieQPxQacTMPuU/AAAAAADcnkDQCgxZ3WrlPwAAAAAA4J5AprkVwmqs5T8AAAAAAOSeQKRt/InKBuY/AAAAAADonkCkqZ7MP/rlPwAAAAAA7J5ACiyAKQMH5j8AAAAAAPCeQJROJJhq5uU/AAAAAAD0nkDxRXu8kA7mPwAAAAAA+J5AVOHP8GYN5j8AAAAAAPyeQHRBfcucLuY/AAAAAAAAn0CzmUNSCyXmPwAAAAAABJ9AZeHra11q5j8AAAAAAAifQKdB0TyAxeY/AAAAAAAMn0ADmDJwQEvnPwAAAAAAEJ9AcM6I0t5g5z8AAAAAABSfQBFWYwlrY+c/AAAAAAAYn0A3xeOiWsTnPwAAAAAAHJ9Aatyb3zDR5z8AAAAAACCfQPLtXYO+9Oc/AAAAAAAkn0Cz7bQ1IhjoPwAAAAAAKJ9AZVQZxt0g6D8AAAAAACyfQO5D3nL1Y+g/AAAAAAAwn0AxB0FHq1roPwAAAAAANJ9AfQT+8PNf6D8AAAAAADifQIo8Sbpmcug/AAAAAAA8n0BngAuyZXnoPwAAAAAAQJ9ATfbP04BB6D8AAAAAAESfQOdvQiECjug/AAAAAABIn0BEaW/whUnoPwAAAAAATJ9ANQhzu5f75z8AAAAAAFCfQB+8dmnD4ec/AAAAAABUn0DoEaPnFrrnPwAAAAAAWJ9Auf5dnznr5z8AAAAAAFyfQICbxYuFIeg/AAAAAABgn0Djpgaaz7noPwAAAAAAZJ9AD9b/OcyX6D8AAAAAAGifQHB87Zklgeg/AAAAAABsn0Dh7NYyGY7oPwAAAAAAcJ9AjQ5Iwr4d6D8AAAAAAHSfQP96hQX3A+g/AAAAAAB4n0AQ7PgvEITpPwAAAAAAfJ9AZr6DnziA6T8AAAAAAICfQAmnBS/6iuk/AAAAAACEn0DvG197ZsnpPwAAAAAAGJ9AAAAA1gzC7kEAAAAAAByfQAAAAAgvtO5BAAAAAAAgn0AAAAAcVqbuQQAAAAAAJJ9AAAAATniY7kEAAAAAACifQAAAAICaiu5BAAAAAAAsn0AAAACUwXzuQQAAAAAAMJ9AAAAAxuNu7kEAAAAAADSfQAAAAPgFYe5BAAAAAAA4n0AAAAAMLVPuQQAAAAAAPJ9AAAAAPk9F7kEAAAAAAECfQAAAAHBxN+5BAAAAAABEn0AAAAD+uS7uQQAAAAAASJ9AAAAAjAIm7kEAAAAAAEyfQAAAABpLHe5BAAAAAABQn0AAAADGjhTuQQAAAAAAVJ9AAAAAVNcL7kEAAAAAAFifQAAAAEpWBe5BAAAAAABcn0AAAABe0P7tQQAAAAAAYJ9AAAAAVE/47UEAAAAAAGSfQAAAAErO8e1BAAAAAABon0AAAABeSOvtQQAAAAAAbJ9AAAAACv3k7UEAAAAAAHCfQAAAANSs3u1BAAAAAAB0n0AAAACeXNjtQQAAAAAAeJ9AAAAAaAzS7UEAAAAAALCdQLJIE+8AT+Y/FK5H4XqwnUDQ1VbsLzvqPwAAAAAAsZ1AveKpRxrc0j/sUbgehbGdQAdeLXdmgtE/AAAAAACynUA+yogLQCPrPxSuR+F6sp1AsU0qGmt/0T8AAAAAALOdQHC044bfzeg/7FG4HoWznUAM6lvmdNnmPwAAAAAAtJ1AdGIP7WMF1D8UrkfherSdQErOiT20D+U/AAAAAAC1nUChgO1gxD69P+xRuB6FtZ1A/FI/bypS2z8AAAAAALadQBSX4xWIntY/FK5H4Xq2nUCnXOFdLuLFPwAAAAAAt51AdvwXCAJk4T/sUbgehbedQE2jycUYWNY/AAAAAAC4nUD0ixL0F/rqPxSuR+F6uJ1A+vIC7KNT6z8AAAAAALmdQOI9B5YjZO4/7FG4HoW5nUDaci7FVeXvPwAAAAAAup1AGf7TDRT44j8UrkfherqdQCj0+pP4XOk/AAAAAAC7nUDMme0KfTDgP+xRuB6Fu51ACAWlaOVe7T8AAAAAALydQNHP1OsWAeA/FK5H4Xq8nUBU/yCSIcfMPwAAAAAAvZ1AVvDbEOM1uz/sUbgehb2dQBYvFobI6eU/AAAAAAC+nUDusl93uvPEPxSuR+F6vp1ApUxqaAOw2T8AAAAAAL+dQPG8VGzM69s/7FG4HoW/nUAHzhlR2hvdPwAAAAAAwJ1ApP0PsFZt5z8UrkfhesCdQPiKbr2mB8k/AAAAAADBnUDXxQoKxU5vP+xRuB6FwZ1A3nGKjuTy3z8AAAAAAMKdQFN2+kFdJOY/FK5H4XrCnUB5hyUvfI65PwAAAAAAw51A/Io1XOSe6j/sUbgehcOdQB4X1SKiGOI/AAAAAADEnUAGuYswRbnhPxSuR+F6xJ1A4nSSrS4n5j8AAAAAAMWdQIy8rIkFvtU/7FG4HoXFnUAoUlBAydOkPwAAAAAAxp1AXW+bqRCP0T8UrkfhesadQOG4jJsaaOk/AAAAAADHnUBxOV6B6EnvP+xRuB6Fx51AdNNmnIaovj8AAAAAAMidQI8YPbfQFeA/FK5H4XrInUDZXgt6bwzWPwAAAAAAyZ1A6xnCMcse5D/sUbgehcmdQIxkj1AzJOk/AAAAAADKnUC63ct9chTaPxSuR+F6yp1A5KPFGcOc3T8AAAAAAMudQA9/Tdaoh+c/7FG4HoXLnUCoxeBh2jfBPwAAAAAAzJ1AzVZe8j/50j8UrkfhesydQHk6V5QSguo/AAAAAADNnUD0a+un/6zPP+xRuB6FzZ1A4J18emzLzD8AAAAAAM6dQOm5ha5EoMo/FK5H4XrOnUBRZ+4h4XvTPwAAAAAAz51A01CjkGTW4j/sUbgehc+dQKzI6IAk7NE/AAAAAADQnUCKr3YU5yjmPxSuR+F60J1ANlzknq7u4T8AAAAAANGdQNvEyf0ORek/7FG4HoXRnUDeyDzyBwO/PwAAAAAA0p1AyH2rdeJy3z8UrkfhetKdQG/2B8pt+9o/AAAAAADTnUAAyAkTRrPrP+xRuB6F051AYwtBDkoY5z8AAAAAANSdQGvY74l1qto/FK5H4XrUnUCYaJCCp5DnPwAAAAAA1Z1Axy+8kuS57z/sUbgehdWdQCP1nsppT5E/AAAAAADWnUBdhv90A4XoPxSuR+F61p1Agem0boPa4T8AAAAAANedQF6iemtgq+4/7FG4HoXXnUBMGw5LA7/uPwAAAAAA2J1AOKEQAYdQ4j8UrkfhetidQI6yfjMx3eA/AAAAAADZnUDrH0Qy5NjRP+xRuB6F2Z1AuJOI8C+C2z8AAAAAANqdQFXRaSeUz7I/FK5H4XranUByv0NRoM/pPwAAAAAA251AWkbqPZVT7j/sUbgehdudQG3GaYgqfOs/AAAAAADcnUDkTX6LTpbOPxSuR+F63J1AqWdBKO9j4T8AAAAAAN2dQBZod0gxQMo/7FG4HoXdnUDjT1Q2rCnnPwAAAAAA3p1AKA01Cklm1z8Urkfhet6dQLY0EvzK3p0/AAAAAADfnUCxv+yePCzUP+xRuB6F351AoyB4fHvXxj8AAAAAAOCdQBL8yt6th7Y/FK5H4XrgnUBNTBdi9UfsPwAAAAAA4Z1ACFirdk1IyT/sUbgeheGdQIlA9Q8imeI/AAAAAADinUAuGjIepZLtPxSuR+F64p1Awoh9AijG6T8AAAAAAOOdQHjRV5BmLNY/7FG4HoXjnUDaU3JO7KHlPwAAAAAA5J1Ai269pgcF5j8UrkfheuSdQBrba0HvjcE/AAAAAADlnUCkbfyJyobZP+xRuB6F5Z1AwTqOHyqN6T8AAAAAAOadQMnnFU890u4/FK5H4XrmnUD3rkFfevvWPwAAAAAA551As14M5US7uj/sUbgeheedQHcQO1PovO8/AAAAAADonUDMs5JWfEPiPxSuR+F66J1ARBmqYir94D8AAAAAAOmdQLKchNIXwus/7FG4HoXpnUAcz2dAvZnqPwAAAAAA6p1AdIEmHUAauT8UrkfheuqdQAD/lCpRduc/AAAAAADrnUDtEWqGVFHdP+xRuB6F651AJ4bkZOJWkT8AAAAAAOydQK2nVl9dFcA/FK5H4XrsnUDkTulg/Z/QPwAAAAAA7Z1ATFEujV941D/sUbgehe2dQO2cZoF2B+M/AAAAAADunUCuLNFZZhHrPxSuR+F67p1AbK+qA8U0sD8AAAAAAO+dQC0uRD0zd7E/7FG4HoXvnUBlxXB1AMTtPwAAAAAA8J1Ab5upEI/E2D8UrkfhevCdQKX3ja89s9I/AAAAAADxnUBClC9oIQHLP+xRuB6F8Z1A7PoFu2Fb4z8AAAAAAPKdQDv/dtmvO80/FK5H4XrynUARNjy9Upa9PwAAAAAA851ABhIUP8bc4z/sUbgehfOdQN9M8V3vo6c/AAAAAAD0nUDrp/+s+XHnPxSuR+F69J1AjSjtDb6w5T8AAAAAAPWdQJj4o6gz98A/7FG4HoX1nUD8q8d9q/XpPwAAAAAA9p1AhlW8kXlk7D8UrkfhevadQD+PUZ55uew/AAAAAAD3nUCciH5t/fTUP+xRuB6F951AiWGHMenv1z8AAAAAAPidQPPB13wBYq8/FK5H4Xr4nUAr3PKRlPTXPwAAAAAA+Z1Af2d79Ib7xD/sUbgehfmdQK32sBcK2NY/AAAAAAD6nUDnq+RjdwHkPxSuR+F6+p1A/mK2ZFUE5D8AAAAAAPudQGyyRj1EI+4/7FG4HoX7nUAG2ngLf+GsPwAAAAAA/J1AYCLeOv922D8UrkfhevydQOeqeY7Id8c/AAAAAAD9nUD/rs+c9SniP+xRuB6F/Z1AD0JAvoQK3T8AAAAAAP6dQA5qv7UTpeI/FK5H4Xr+nUCV8IRefxLqPwAAAAAA/51A95LGaB1Vyz/sUbgehf+dQJhtp60RwdA/AAAAAAAAnkA3/dmPFJHiPxSuR+F6AJ5AO8PUljrI7z8AAAAAAAGeQGggls0cEuA/7FG4HoUBnkB6pwLuef7IPwAAAAAAAp5ALPUsCOX94D8UrkfhegKeQJFHcCNli+g/AAAAAAADnkAf9GxWfa7vP+xRuB6FA55AQX+hR4ye3D8AAAAAAASeQGiULv1LUuc/FK5H4XoEnkAi/mFLj6bgPwAAAAAABZ5AiL1QwHaw5j/sUbgehQWeQMVyS6shcd0/AAAAAAAGnkAcy2Axj6GyPxSuR+F6Bp5AwVPIlXoW1D8AAAAAAAeeQFRt3AfF+7Y/7FG4HoUHnkALJ2n+mNbvPwAAAAAACJ5AYabtX1lp7j8UrkfhegieQMfZdARws8g/AAAAAAAJnkAZQim1coqzP+xRuB6FCZ5ABI4EGmzq3T8AAAAAAAqeQAAAAAAAgOU/FK5H4XoKnkAgnE8dq5TAPwAAAAAAC55AG5/J/nkazj/sUbgehQueQAtD5PT1/Oc/AAAAAAAMnkCg/x68dmnDPxSuR+F6DJ5AbJVgcTjzuz8AAAAAAA2eQLadtkYE49o/7FG4HoUNnkDWUkDa/wDVPwAAAAAADp5AnLS65p8qkD8Urkfheg6eQOKS407pYMU/AAAAAAAPnkAX9UnusInQP+xRuB6FD55AgIKLFTWYuj8AAAAAABCeQJQWLquwGdA/FK5H4XoQnkDgERWqm4vQPwAAAAAAEZ5AaCWt+IbC2T/sUbgehRGeQJ54zhYQ2uc/AAAAAAASnkAD7Q4pBkjWPxSuR+F6Ep5Ao3kAi/x65z8AAAAAABOeQPLuyFht/t0/7FG4HoUTnkABLzNslHXmPwAAAAAAFJ5Aiz7V16mopD8UrkfhehSeQKDhzRq8r9U/AAAAAAAVnkBAwFq1a0LrP+xRuB6FFZ5AgzEiUWhZ0j8AAAAAABaeQJbP8jy4u+8/FK5H4XoWnkDOVfMcke/tPwAAAAAAF55As5dtp60R3T/sUbgehReeQD7L8+DuLOk/AAAAAAAYnkDnN0w0SEHgPxSuR+F6GJ5A3CxeLAwR4z8AAAAAABmeQPF/R1SobuI/7FG4HoUZnkCMoDGTqBfQPwAAAAAAGp5AxOqPMAxY4j8UrkfhehqeQPd2S3LArtM/AAAAAAAbnkB6/Ul87gS7P+xRuB6FG55AGaw41VqY3j8AAAAAAByeQJiKjXkdceM/FK5H4XocnkBw0clS6/3XPwAAAAAAHZ5AmwEuyJbl2z/sUbgehR2eQDKvIw7ZQOU/AAAAAAAenkAH8BZIUPzGPxSuR+F6Hp5AuHh4z4Hl5j8AAAAAAB+eQNz0Zz9SRNw/7FG4HoUfnkCoRvmTQmqoPwAAAAAAIJ5AJvxSP2+q7T8UrkfheiCeQKs97IUCtuY/AAAAAAAhnkAGLLmKxe/pP+xRuB6FIZ5Ah2u1h73Q5j8AAAAAACKeQL9FJ0ut99Y/FK5H4XoinkCSeeQPBp7iPwAAAAAAI55AnFPJAFDF0z/sUbgehSOeQG9JDtjVZOU/AAAAAAAknkDl0CLb+X7ePxSuR+F6JJ5ApRKe0OtP3D8AAAAAACWeQJPIPsiyYLo/7FG4HoUlnkClg/V/DvPWPwAAAAAAJp5ASrIOR1fp4j8UrkfheiaeQHUg66nVV9Q/AAAAAAAnnkDul09WDFfNP+xRuB6FJ55A5SZqaW4F5z8AAAAAACieQINqgxPRL+E/FK5H4XoonkBqUDQPYBHkPwAAAAAAKZ5AYd14d2Ss6D/sUbgehSmeQPJ5xVOPtOg/AAAAAAAqnkCDpbqAlxnkPxSuR+F6Kp5AmrZ/ZaVJwT8AAAAAACueQDImWHeHb7A/7FG4HoUrnkCdg2dCk8TGPwAAAAAALJ5AVwT/W8mOjT8UrkfheiyeQBzRPesarew/AAAAAAAtnkA2IhgHl47lP+xRuB6FLZ5AVoFaDB6m4T8AAAAAAC6eQOS6KeW1EuY/FK5H4XounkDbNSGtMejsPwAAAAAAL55AiSe7mdGP2D/sUbgehS+eQDHT9q+sNNk/AAAAAAAwnkA0kB0KVSCZPxSuR+F6MJ5AkZp2Mc10yT8AAAAAADGeQKZjzjP2Jdo/7FG4HoUxnkCdSgaAKu7rPwAAAAAAMp5Aq8spATEJ6z8UrkfhejKeQLSPFfw2ROU/AAAAAAAznkCBQj19BP7EP+xRuB6FM55ANNL3v8hwsz8AAAAAADSeQNFXkGYsmsw/FK5H4Xo0nkAr1D8tq1WgPwAAAAAANZ5AByXMtP0rxz/sUbgehTWeQJzCSgUVVdw/AAAAAAA2nkB6jzNN2H7GPxSuR+F6Np5A41C/C1sz4T8AAAAAADeeQBrBxvXv+u4/7FG4HoU3nkCca5ih8cTvPwAAAAAAOJ5AMSzad6Cpcj8UrkfhejieQL2L9+P2y9c/AAAAAAA5nkCjI7n8h3TuP+xRuB6FOZ5AJzEIrBxa6z8AAAAAADqeQGZWpeMg17Y/FK5H4Xo6nkDZl2w82OLlPwAAAAAAO55A+b8jKlQ33z/sUbgehTueQJ8dcF0xI9Q/AAAAAAA8nkCjk6XW+42qPxSuR+F6PJ5ADFacai3M7j8AAAAAAD2eQH6P+usVlu0/7FG4HoU9nkDLEwg7xarWPwAAAAAAPp5AEqnE0EWelz8Urkfhej6eQKD+s+bHX9c/AAAAAAA/nkBo6Qq2EU/fP+xRuB6FP55AiiE5mbhV4T8AAAAAAECeQEMDsWzmEOU/FK5H4XpAnkBinSrfMxLqPwAAAAAAQZ5Aho4dVOK65D/sUbgehUGeQDpbQGg9fMc/AAAAAABCnkDZzvdT4yXgPxSuR+F6Qp5AJ2a9GMoJ7j8AAAAAAEOeQIZ1492RsdM/7FG4HoVDnkAuceSByCLYPwAAAAAARJ5AptB5jV2i7D8UrkfhekSeQGrBi76CtOg/AAAAAABFnkBGlzeHa7XkP+xRuB6FRZ5AylTBqKTO4z8AAAAAAEaeQMzR4/c2/dA/FK5H4XpGnkA+/+K+eoGwPwAAAAAAR55AQZ3y6EZYvD/sUbgehUeeQAhb7PZZZe8/AAAAAABInkCLh/ccWI7nPxSuR+F6SJ5AOdIZGHnZ5z8AAAAAAEmeQMLaGDvhJcQ/7FG4HoVJnkCbxvZa0HvuPwAAAAAASp5ArnXznhT3pT8UrkfhekqeQJ6zBYTWw+I/AAAAAABLnkATQ3IycavvP+xRuB6FS55A4PJYMzJI6D8AAAAAAEyeQAH20akrn80/FK5H4XpMnkB9Ik+SrpnqPwAAAAAATZ5AzuDvF7Ml2D/sUbgehU2eQPnAjv8CQdc/AAAAAABOnkB6GFqdnCHoPxSuR+F6Tp5AkwA1tWyt0T8AAAAAAE+eQATltn2PeuA/7FG4HoVPnkC5pA8Cl2ypPwAAAAAAUJ5AwFsgQfFj3D8UrkfhelCeQM4AF2TL8ug/AAAAAABRnkBPkNjuHqDaP+xRuB6FUZ5AHekMjLyskT8AAAAAAFKeQL/VOnE5XtA/FK5H4XpSnkCbdcb3xSXsPwAAAAAAU55AnL8JhQg42D/sUbgehVOeQJI9Qs2QKsI/AAAAAABUnkCqSIWxhaDsPxSuR+F6VJ5A8bc9QWI77j8AAAAAAFWeQJgTtMnhk9c/7FG4HoVVnkDec2A5QoboPwAAAAAAVp5AebEwRE5f5z8UrkfhelaeQHVZTGw+rsM/AAAAAABXnkAJ3/sbtFfdP+xRuB6FV55Ac51GWipvwT8AAAAAAFieQIofY+5awu8/FK5H4XpYnkBr8pTVdL3mPwAAAAAAWZ5A6dUApaHG5T/sUbgehVmeQH41Bwjm6Mc/AAAAAABankAdkloomZzCPxSuR+F6Wp5AI7pnXaPl1j8AAAAAAFueQFzGTQ00n+Y/7FG4HoVbnkAbutkfKDfjPwAAAAAAXJ5A3lflQuVf6D8UrkfhelyeQFMj9DP1utg/AAAAAABdnkCfVWZK62/aP+xRuB6FXZ5ALlVpi2t81j8AAAAAAF6eQPROqiKBq7U/FK5H4XpenkAnwLD8+bbTPwAAAAAAX55AggNauoJt7j/sUbgehV+eQOElOPWB5Og/AAAAAABgnkBan3JMFnfkPxSuR+F6YJ5AxhnDnKBN2z8AAAAAAGGeQLJ/ngYMkuQ/7FG4HoVhnkB5Wn7gKs/oPwAAAAAAYp5A5l31gHlI6j8UrkfhemKeQOyjU1c+y9c/AAAAAABjnkBlxAWgUTrsP+xRuB6FY55AQkP/BBer7D8AAAAAAGSeQBCU2/Y96rE/FK5H4XpknkDvVSsTfqmjPwAAAAAAZZ5AHeihtg0j4D/sUbgehWWeQBpQb0bNV8c/AAAAAABmnkDs2t5uSY7jPxSuR+F6Zp5A7fKtD+uN1j8AAAAAAGeeQLMkQE0tW+w/7FG4HoVnnkCL/WX35GHYPwAAAAAAaJ5AlzfJh4fNgz8UrkfhemieQH+/mC1ZFec/AAAAAABpnkAY6xuY3CjfP+xRuB6FaZ5A+KqVCb/UxT8AAAAAAGqeQOOpRxrc1uU/FK5H4XpqnkBb7WEvFLDgPwAAAAAAa55As12hD5ax1T/sUbgehWueQIS6SKEsfOU/AAAAAABsnkAoZVJDG4DpPxSuR+F6bJ5A5qxPOSaL4j8AAAAAAG2eQAxzgjY5/OE/7FG4HoVtnkBWn6ut2N/vPwAAAAAAbp5AUvAUcqWe1T8Urkfhem6eQIQOuoRDb+c/AAAAAABvnkA4feKlQAuyP+xRuB6Fb55ASb4SSIldwz8AAAAAAHCeQFFsBU1LLOA/FK5H4XpwnkB7EW3H1F3QPwAAAAAAcZ5AxK9Yw0XuuT/sUbgehXGeQPbrTnee+OA/AAAAAABynkA0D2CRXz/WPxSuR+F6cp5A+dwJ9l/n3z8AAAAAAHOeQObPtwVLdec/7FG4HoVznkDfiy/a44XMPwAAAAAAdJ5AmNpSB3k9zj8UrkfhenSeQMgG0sWmle0/AAAAAAB1nkAAHebLCzDkP+xRuB6FdZ5Avma5bHTO6z8AAAAAAHaeQKOutfepqu0/FK5H4Xp2nkAyHqUSnlDgPwAAAAAAd55A1SMNbmsL6D/sUbgehXeeQBL7BFCMrO8/AAAAAAB4nkCRt1z92CThPxSuR+F6eJ5ArkfhehSu1D8AAAAAAHmeQLuA8tKoG7U/7FG4HoV5nkCSeeQPBp7nPwAAAAAAep5A598u+3Wn0T8UrkfhenqeQFW/0vnwrOs/AAAAAAB7nkBznNuEe2XYP+xRuB6Fe55AbOo8Kv7vxj8AAAAAAHyeQPrUsUrpmcI/FK5H4Xp8nkDiV6zhInfvPwAAAAAAfZ5AopxoVyHl1T/sUbgehX2eQCld+pekMss/AAAAAAB+nkCw/s9hvrzmPxSuR+F6fp5AKpVLPtHQWj8AAAAAAH+eQCyf5Xlw9+Y/7FG4HoV/nkBCJa5jXPHjPwAAAAAAgJ5A+dnIdVPKuz8UrkfheoCeQICfceFAyOY/AAAAAACBnkBzZOWXwRjNP+xRuB6FgZ5Ai+JV1jZF4z8AAAAAAIKeQNibGJKTieE/FK5H4XqCnkDW4lMAjGfjPwAAAAAAg55AWixF8pXA7T/sUbgehYOeQINMMnIWdu8/AAAAAACEnkCyTL9EvHXkPxSuR+F6hJ5AowG8BRIU3D8AAAAAAIWeQAxbs5WX/Mc/7FG4HoWFnkDhlo+kpAfjPwAAAAAAhp5A7X+AtWrXxD8UrkfheoaeQJOnrKbridU/AAAAAACHnkBAahMn97voP+xRuB6Fh55As7YpHhfVxD8AAAAAAIieQG9GzVfJR+c/FK5H4XqInkBTPC6qRUTJPwAAAAAAiZ5A5Gcj102p6j/sUbgehYmeQKIL6lvmdL0/AAAAAACKnkDWXvpNFxi4PxSuR+F6ip5ABP7w89+Dwz8AAAAAAIueQOQTsvM2Nrc/7FG4HoWLnkDC2OfWEMGlPwAAAAAAjJ5AkzmWd9WD6j8UrkfheoyeQD0Og/kr5OI/AAAAAACNnkC8BRIUP8bbP+xRuB6FjZ5AjBNf7SjOvT8AAAAAAI6eQH9pUZ/kjuY/FK5H4XqOnkBiX/x+e+icPwAAAAAAj55AdytLdJbZ6T/sUbgehY+eQDv7yoP0FOw/AAAAAACQnkA6RaIrbGGzPxSuR+F6kJ5AKZMa2gBs6D8AAAAAAJGeQBsOSwM/qss/7FG4HoWRnkAxlumXiLfnPwAAAAAAkp5ApbxWQndJxD8UrkfhepKeQMPvplt2iNU/AAAAAACTnkCJtmPqruzGP+xRuB6Fk55AJVzII7iR3z8AAAAAAJSeQPCkhcsqbMA/FK5H4XqUnkD/QSRDjq3bPwAAAAAAlZ5AIO7qVWR07j/sUbgehZWeQOPfZ1w4kOI/AAAAAACWnkAMyjSaXAzvPxSuR+F6lp5AnUgw1cxa1z8AAAAAAJeeQHTOT3EceNQ/7FG4HoWXnkCC5QgZyLPgPwAAAAAAmJ5A7/54r1qZ4T8UrkfhepieQEn0Morllu4/AAAAAACZnkBLW1zjM9nkP+xRuB6FmZ5A/plBfGDH7D8AAAAAAJqeQMG8ESdBybg/FK5H4XqankA26Etvfy7TPwAAAAAAm55AKSDtf4C10T/sUbgehZueQOHs1jIZjuw/AAAAAACcnkAD7+TTY1vKPxSuR+F6nJ5Af8LZrWUy1D8AAAAAAJ2eQMAg6dMq+tU/7FG4HoWdnkAUXRd+cD7XPwAAAAAAnp5Ag4qqX+l84j8Urkfhep6eQNqu0AfLWOQ/AAAAAACfnkCRRgVOtoHdP+xRuB6Fn55Ake9S6pLx4j8AAAAAAKCeQOqURzfCoug/FK5H4XqgnkDOF3svvmjJPwAAAAAAoZ5Ae0563/jawT/sUbgehaGeQKcf1EUK5ek/AAAAAACinkDikA2ki03pPxSuR+F6op5AFEAxsmSOzT8AAAAAAKOeQOpA1lOrr+k/7FG4HoWjnkBxr8xbdR2mPwAAAAAApJ5A/U0oRMAh3j8UrkfheqSeQOINH8fFB5Q/AAAAAAClnkB5A8x8Bz/LP+xRuB6FpZ5A3qtWJvxSwz8AAAAAAKaeQBtIF5tWCsE/FK5H4XqmnkAWokPgSCDnPwAAAAAAp55AP19pzxvdsz/sUbgehaeeQF2XK833nbQ/AAAAAAConkBj7ISX4NTDPxSuR+F6qJ5AGyrG+ZtQ7z8AAAAAAKmeQGB15Ehn4Oo/7FG4HoWpnkBWmpSCbq/pPwAAAAAAqp5AQxzr4jYawj8UrkfheqqeQPHXZI16iOU/AAAAAACrnkCRD3o2qz7UP+xRuB6Fq55A5APxcPGmrT8AAAAAAKyeQGOXqN4a2NM/FK5H4XqsnkBosKnzqPirPwAAAAAArZ5AN6rTgayn6T/sUbgeha2eQM+fNqrTgcY/AAAAAACunkAjpG5nX3ngPxSuR+F6rp5AAkuuYvEb5D8AAAAAAK+eQH+ismFNZdk/7FG4HoWvnkAZHvtZLEXKPwAAAAAAsJ5AeQH20akryz8UrkfherCeQIDXZ876FOo/AAAAAACxnkDezOhHw6ngP+xRuB6FsZ5Au/JZngd37T8AAAAAALKeQJwZ/Wg45eY/FK5H4XqynkDeglstZjqaPwAAAAAAs55AdnCwNzEk4z/sUbgehbOeQI3w9iAE5NY/AAAAAAC0nkCtaklHOZjePxSuR+F6tJ5ArkhMUMO31j8AAAAAALWeQFWjVwOUhtU/7FG4HoW1nkBSfHxCdl7rPwAAAAAAtp5AXw1QGmoUwD8UrkfheraeQAltOZfiqso/AAAAAAC3nkDfNehLb3/hP+xRuB6Ft55A2NR5VPzftT8AAAAAALieQBSuR+F6lOE/FK5H4Xq4nkCBlUOLbOfSPwAAAAAAuZ5AcvxQacRM5j/sUbgehbmeQMx8Bz9xAM8/AAAAAAC6nkBK1As+zcnlPxSuR+F6up5AhGdCk8SSzD8AAAAAALueQGfxYmGInMY/7FG4HoW7nkAkXp7OFSXpPwAAAAAAvJ5A/b0UHjQ75j8UrkfheryeQCuGqwMg7ro/AAAAAAC9nkDxuRPsv87sP+xRuB6FvZ5AMSQnE7cK4T8AAAAAAL6eQCkHswkwLNo/FK5H4Xq+nkAD7KNTVz7QPwAAAAAAv55Arg6AuKvX5T/sUbgehb+eQF0ZVBuciNY/AAAAAADAnkCwjXiymxnuPxSuR+F6wJ5AFRvzOuKQ2T8AAAAAAMGeQFvEwe/w6Kg/7FG4HoXBnkB5lEp4Qq/UPwAAAAAAwp5AihQUUPI0qj8UrkfhesKeQKX2ItqOqdI/AAAAAADDnkDipUALrl6aP+xRuB6Fw55A9iSwOQfPvD8AAAAAAMSeQMqUB9CM0Ww/FK5H4XrEnkBkzjP2JZvtPwAAAAAAxZ5AJPJdSl0y1j/sUbgehcWeQOKt82+Xfe0/AAAAAADGnkAPYmcKndfbPxSuR+F6xp5Awf2ABwYQwj8AAAAAAMeeQCnQJ/Ik6eE/7FG4HoXHnkCFC9S9qaOOPwAAAAAAyJ5AoWgewCI/5D8UrkfhesieQFLTLqaZ7tM/AAAAAADJnkAj+hCvRtGiP+xRuB6FyZ5AwAevXdpwzD8AAAAAAMqeQLdDw2LUNeE/FK5H4XrKnkCIHBFC9jCiPwAAAAAAy55A3zMSoRFs6T/sUbgehcueQL9GkiBcgeQ/AAAAAADMnkA7rHDLR1LVPxSuR+F6zJ5AYXTULCuomz8AAAAAAM2eQDFgyVUsftU/7FG4HoXNnkCYaftXVprtPwAAAAAAzp5AyHvVyoRf4z8Urkfhes6eQE/QgUDCi4E/AAAAAADPnkAplltaDQniP+xRuB6Fz55AQWSRJt6B7T8AAAAAANCeQCbD8XwG1OA/FK5H4XrQnkBNMJxrmCHgPwAAAAAA0Z5AYK+w4H7Asz/sUbgehdGeQIKsp1ZfXcU/AAAAAADSnkAWM8LbgxDqPxSuR+F60p5Azo3pCUs8yD8AAAAAANOeQEmBBTBl4NQ/7FG4HoXTnkCIg4QoX9DOPwAAAAAA1J5APnlYqDVN5D8UrkfhetSeQBwj2SPUDNM/AAAAAADVnkBvRs1XycfoP+xRuB6F1Z5ARUjdzr7y4D8AAAAAANaeQETgSKDBJuA/FK5H4XrWnkAmUprN4zDKPwAAAAAA155An3WNlgM90z/sUbgehdeeQJ4pdF5jl9o/AAAAAADYnkDA6siRzsDGPxSuR+F62J5At7JEZ5lFzD8AAAAAANmeQK0Tl+MViN4/7FG4HoXZnkCeew+XHPfmPwAAAAAA2p5Aui2RC87g2T8UrkfhetqeQAPtDikGyOM/AAAAAADbnkC1w1+TNerhP+xRuB6F255A/MIrSZ7r3z8AAAAAANyeQIs0MyvC6ls/FK5H4XrcnkB7gy9MpgrfPwAAAAAA3Z5AjQjGwaVj3T/sUbgehd2eQFDG+DB72d4/AAAAAADenkDgERWqm4vDPxSuR+F63p5AqHAEqRS77D8AAAAAAN+eQDnThO0nY9s/7FG4HoXfnkBBg02dR8XhPwAAAAAA4J5AsMivH2ID6D8UrkfheuCeQCapTDEHQeM/AAAAAADhnkAR3y6gvDSmP+xRuB6F4Z5AaLJ/ngYM3j8AAAAAAOKeQGQHlbiO8eM/FK5H4XrinkAGZoUi3c/vPwAAAAAA455An+V5cHfW7T/sUbgeheOeQNWVz/I8uOs/AAAAAADknkDGaYgq/BnkPxSuR+F65J5AsW8nEeFfvD8AAAAAAOWeQGozTkNUYeI/7FG4HoXlnkANuzmmOFitPwAAAAAA5p5AJe2h2GVTqT8UrkfheuaeQEiMnlvoSuc/AAAAAADnnkDeOv922a+1P+xRuB6F555Ar3yW58Hd1z8AAAAAAOieQCsWvyms1Ow/FK5H4XronkCLMhtkkhHuPwAAAAAA6Z5AXalnQSjv2j/sUbgehemeQAfsavKUVe4/AAAAAADqnkBETIkkehmtPxSuR+F66p5AgehJmdRQ7D8AAAAAAOueQIsbt5ifG8A/7FG4HoXrnkDJA5FFmnjJPwAAAAAA7J5AjzUjg9xF3T8UrkfheuyeQFm/mZguxOI/AAAAAADtnkDTvrm/etzeP+xRuB6F7Z5A5q+QuTKo4D8AAAAAAO6eQFGlZg+0AsM/FK5H4XrunkB4YtaLoZzYPwAAAAAA755ALPUsCOV9zj/sUbgehe+eQBGsqpffaeM/AAAAAADwnkDB4nDmV/PhPxSuR+F68J5AwOszZ33K1j8AAAAAAPGeQI/ecB+5NdE/7FG4HoXxnkDx8QnZeRvoPwAAAAAA8p5AtqFinL8Jzz8UrkfhevKeQEhPkUPETes/AAAAAADznkBh4o+iztzaP+xRuB6F855Ag92wbVHm4z8AAAAAAPSeQATI0LGDyuU/FK5H4Xr0nkD7sUl+xK/mPwAAAAAA9Z5AIcoXtJCA5T/sUbgehfWeQOSfGcQHdtQ/AAAAAAD2nkA7i96pgHvOPxSuR+F69p5AVaUtrvEZ4D8AAAAAAPeeQDc2O1J958k/7FG4HoX3nkAexqS/l8LDPwAAAAAA+J5A/67PnPUp0D8UrkfhevieQM+8HHbfse4/AAAAAAD5nkBehCnKpfHtP+xRuB6F+Z5Av2TjwRa7zT8AAAAAAPqeQKJCdXPxt8s/FK5H4Xr6nkCDh2nf3N/nPwAAAAAA+55AsC64MBwZnT/sUbgehfueQH+/mC1ZFdk/AAAAAAD8nkD2l92Th4XKPxSuR+F6/J5AjGfQ0D9B7j8AAAAAAP2eQNpTF5V5ULU/7FG4HoX9nkA7qpog6r7qPwAAAAAA/p5AhCo1e6AV1z8Urkfhev6eQFtU1RV9T7Y/AAAAAAD/nkAIdZFCWfjIP+xRuB6F/55Axyx7Eticwz8AAAAAAACfQIJy275H/eA/FK5H4XoAn0BehZSfVPvpPwAAAAAAAZ9A9u6P96qV4j/sUbgehQGfQKeVQiCXOOU/AAAAAAACn0B40Oy6t6LhPxSuR+F6Ap9AvcgE/BpJ6z8AAAAAAAOfQMx+3enOE+U/7FG4HoUDn0Ag0m9fB87kPwAAAAAABJ9A88zLYfcd1D8UrkfhegSfQC5weawZGdA/AAAAAAAFn0Bo4y38hcO1P+xRuB6FBZ9AzcggdxGm3j8AAAAAAAafQJBN8iN+xeg/FK5H4XoGn0D6IduexfeiPwAAAAAAB59A+0DyzqGM5j/sUbgehQefQKYKRiV1AtQ/AAAAAAAIn0BhiJy+ni/oPxSuR+F6CJ9AJ2a9GMqJ5j8AAAAAAAmfQN9uSQ7Y1do/7FG4HoUJn0Albl9RWzS2PwAAAAAACp9Anj9tVKcD6j8UrkfhegqfQNBFQ8ajVLo/AAAAAAALn0CKzFzg8ljnP+xRuB6FC59AQIf58gJs7D8AAAAAAAyfQE/LD1zlieE/FK5H4XoMn0DSj4ZT5ubQPwAAAAAADZ9AiuYBLPJr4D/sUbgehQ2fQAHaVrPO+O0/AAAAAAAOn0BzuFZ72AvFPxSuR+F6Dp9AAFMGDmjp5z8AAAAAAA+fQB9mL9tO2+g/7FG4HoUPn0B2jCsujsrfPwAAAAAAEJ9AaccNv5tu6z8UrkfhehCfQIPBNXf0v9w/AAAAAAARn0CJJHoZxXLbP+xRuB6FEZ9AoMTnTrD/wD8AAAAAABKfQL5O6svSTt4/FK5H4XoSn0DKarqe6DroPwAAAAAAE59AWDhJ88e0yj/sUbgehROfQKeU10roLug/AAAAAAAUn0BOYhBYOTThPxSuR+F6FJ9AaOp1i8BY1D8AAAAAABWfQBppqbwd4dI/7FG4HoUVn0Dt8UI6PITmPwAAAAAAFp9Aca32sBcK4j8UrkfhehafQALC4sufyrY/AAAAAAAXn0CP/MHAc+/SP+xRuB6FF59Aez4UFiadtj8AAAAAABifQB1Z+WUwxuk/FK5H4XoYn0BTbuwjAbSfPwAAAAAAGZ9AxHsOLEdI5j/sUbgehRmfQN5zYDlCBsY/AAAAAAAan0DF5XgFoifoPxSuR+F6Gp9AQs77/zjh6T8AAAAAABufQBGQL6GCQ+U/7FG4HoUbn0D59NiWAefoPwAAAAAAHJ9Ad2nDYWlg7D8UrkfhehyfQKA3Fakwtso/AAAAAAAdn0CL4eoAiLvfP+xRuB6FHZ9ABAEydOwg5j8AAAAAAB6fQPHW+bfLfsM/FK5H4Xoen0DT25+LhozQPwAAAAAAH59Ax53Swfo/zz/sUbgehR+fQP0RhgFLrtA/AAAAAAAgn0DjxFc7inPgPxSuR+F6IJ9AQ6ooXmXt6T8AAAAAACGfQL0bCwqDsuo/7FG4HoUhn0AUW0HTEqvvPwAAAAAAIp9AOe//44QJ6j8UrkfheiKfQEVWbe0zHZA/AAAAAAAjn0BhqS7gZQbkP+xRuB6FI59Au3zrw3qjwj8AAAAAACSfQNk9eViote8/FK5H4Xokn0CsVbsmpDXuPwAAAAAAJZ9A7x01JsRc1D/sUbgehSWfQMqjG2FREew/AAAAAAAmn0BfmEwVjMroPxSuR+F6Jp9AFwyuuaN/6j8AAAAAACefQB8Q6EzaVNs/7FG4HoUnn0D+1eO+1brvPwAAAAAAKJ9AcLa5MT1h4z8UrkfheiifQKdZoN0hxd8/AAAAAAApn0DP91PjpZvRP+xRuB6FKZ9ApkdTPZl/wD8AAAAAACqfQH9EXbV8bqI/FK5H4Xoqn0BDyeTUzjDaPwAAAAAAK59AqKs7Ftuk6T/sUbgehSufQB7htOBFX9o/AAAAAAAsn0CVZYhjXdzmPxSuR+F6LJ9AmfT3UnjQ4D8AAAAAAC2fQGR2Fr1TAdg/7FG4HoUtn0AoQ1VMpR/pPwAAAAAALp9A3C+frBiu1T8Urkfhei6fQEPFOH8TiuI/AAAAAAAvn0BaZaa0/pbkP+xRuB6FL59AJEOOrWcI3D8AAAAAADCfQOOvJNRnYrE/FK5H4Xown0BblUT2QRbuPwAAAAAAMZ9AmRHeHoSA4j/sUbgehTGfQEJ23sZmR+I/AAAAAAAyn0AmxccnZOfcPxSuR+F6Mp9AUBg5sMFntD8AAAAAADOfQNZz0vvGV+4/7FG4HoUzn0CuDRXj/E3ZPwAAAAAANJ9AhCwLJv4o7z8UrkfhejSfQGaC4VzDjOI/AAAAAAA1n0CYNEbrqGrKP+xRuB6FNZ9Aj1Tf+UUJ5z8AAAAAADafQNKowMk2cO8/FK5H4Xo2n0DmxpnLssyzPwAAAAAAN59ALPLrh9hg0z/sUbgehTefQBAf2PFfIOU/AAAAAAA4n0DSx3xAoDPfPxSuR+F6OJ9A0bAYda096T8AAAAAADmfQI3ttaD3xrw/7FG4HoU5n0B1sP7PYb7kPwAAAAAAOp9A7fDXZI16yD8UrkfhejqfQKbxC68k+ek/AAAAAAA7n0BZox6i0Z3qP+xRuB6FO59AEK6AQj192j8AAAAAADyfQAU1fAvrRuA/FK5H4Xo8n0BCsoAJ3LrgPwAAAAAAPZ9AOdbFbTSA1T/sUbgehT2fQK0FrAsuDKs/AAAAAAA+n0AYWp2cobjnPxSuR+F6Pp9AVWthFto5yT8AAAAAAD+fQPM7TWa8LeQ/7FG4HoU/n0DSqpZ0lIPmPwAAAAAAQJ9AMEj6tIr+4D8UrkfhekCfQLTonQq45+s/AAAAAABBn0BvEK0VbY7UP+xRuB6FQZ9AgsmNImuN7T8AAAAAAEKfQJV87C5QUs4/FK5H4XpCn0AyqgzjbhDWPwAAAAAAQ59AjGZl+5C33T/sUbgehUOfQEEPtW0YBd4/AAAAAABEn0AjZvZ5jPLdPxSuR+F6RJ9A2xX6YBmb7T8AAAAAAEWfQPLTuDe/Yd0/7FG4HoVFn0C94qlHGtztPwAAAAAARp9AkbkyqDY45z8UrkfhekafQBhcc0f/y+c/AAAAAABHn0AyHTo970bsP+xRuB6FR59Ao4vycRLvoT8AAAAAAEifQCSBBps6j8Y/FK5H4XpIn0AMI72o3a/IPwAAAAAASZ9AuRyvQPQk5D/sUbgehUmfQOqVsgxxrOA/AAAAAABKn0C/8iA9RQ7fPxSuR+F6Sp9ABFq6gm3E3T8AAAAAAEufQPM+jubISuU/7FG4HoVLn0DCL/XzpiLJPwAAAAAATJ9AMJ+sGK4O1T8UrkfhekyfQGa9GMqJduY/AAAAAABNn0CYwK27earuP+xRuB6FTZ9AU+i8xi5R3D8AAAAAAE6fQPG5E+y/ztc/FK5H4XpOn0CO69/1mbOwPwAAAAAAT59AFR+fkJ23wT/sUbgehU+fQJW1TfG4KOw/AAAAAABQn0BzS6shcQ/iPxSuR+F6UJ9AuhCrP8Iw3D8AAAAAAFGfQPyp8dJNYu4/7FG4HoVRn0DPa+wS1VvBPwAAAAAAUp9AR1hUxOkk3D8UrkfhelKfQF1r71NVaN0/AAAAAABTn0BJoSx8fS3oP+xRuB6FU59AsD2zJEDN4D8AAAAAAFSfQCJy+nq+Zuo/FK5H4XpUn0DObcK9Mm/FPwAAAAAAVZ9AypqibUYXnT/sUbgehVWfQMbDew4sR9I/AAAAAABWn0A/UkSGVTzoPxSuR+F6Vp9AP+JXrOEizz8AAAAAAFefQFq4rMJmgME/7FG4HoVXn0BruTMTDGfkPwAAAAAAWJ9AdHrejQWF1z8UrkfhelifQMJoVrYP+eg/AAAAAABZn0AxmpXtQ17pP+xRuB6FWZ9AUWnEzD6P0j8AAAAAAFqfQJXXSuguie0/FK5H4Xpan0AcXaW762zVPwAAAAAAW59AitBC4TeudD/sUbgehVufQNfa+1QVGs4/AAAAAABcn0AB2lazzvjGPxSuR+F6XJ9A8IXJVMGo4j8AAAAAAF2fQK4upwTEJOA/7FG4HoVdn0B2GmmpvB3PPwAAAAAAXp9AiPVGrTD97D8Urkfhel6fQELO+/84Ydw/AAAAAABfn0CKITmZuFXXP+xRuB6FX59AK2wGuCBbuD8AAAAAAGCfQFkUdlH0QOI/FK5H4Xpgn0AMryR5ru/dPwAAAAAAYZ9ARIXq5uLv7D/sUbgehWGfQH9XunFBbJ8/AAAAAABin0Bd+SzPg7vsPxSuR+F6Yp9AAz4/jBCe5z8AAAAAAGOfQL5LqUvGseQ/7FG4HoVjn0CMKy6Oyk3ePwAAAAAAZJ9Ad0AjIkYZpz8UrkfhemSfQDDa44V0+Oc/AAAAAABln0D1Lt6P2y/fP+xRuB6FZZ9AjEtV2uKa7T8AAAAAAGafQHP0+L1N/+Y/FK5H4Xpmn0CcGmg+5+7kPwAAAAAAZ59AeDNZkvJJtz/sUbgehWefQF0VqMXg4eE/AAAAAABon0AKuIxAYfWoPxSuR+F6aJ9ASMSUSKKXyT8AAAAAAGmfQCUDQBU3btk/7FG4HoVpn0CKV1nbFI+5PwAAAAAAap9AAS8zbJT1vz8UrkfhemqfQJHtfD81XsY/AAAAAABrn0B551CGqpjcP+xRuB6Fa59A8Bt4GAdVgj8AAAAAAGyfQHi2R2+4j+8/FK5H4Xpsn0Bck25L5IKrPwAAAAAAbZ9ATfT5KCMu6z/sUbgehW2fQMuisIuiB+M/AAAAAABun0Dgn1Ilyt7kPxSuR+F6bp9AjQsHQrKA2j8AAAAAAG+fQKsGYW738uA/7FG4HoVvn0ArNBDLZg7XPwAAAAAAcJ9Ax1UbUvtjuD8UrkfhenCfQD5anDHMCc4/AAAAAABxn0B+iuPAq+XgP+xRuB6FcZ9AameY2lIH2j8AAAAAAHKfQHZxGw3gLdc/FK5H4Xpyn0A66X3ja0/gPwAAAAAAc59AVYSbjCrDxj/sUbgehXOfQH6s4Lchxtk/AAAAAAB0n0BqpKXydoTUPxSuR+F6dJ9A0SNGzy107T8AAAAAAHWfQGERaFXwgLk/7FG4HoV1n0AI6SlyiDjhPwAAAAAAdp9AyGDFqdbC6D8UrkfhenafQLbz/dR46do/AAAAAAB3n0B/L4UHza7iP+xRuB6Fd59A2sh1U8pr1T8AAAAAAHifQHrCEg8oG+w/FK5H4Xp4n0DBkUCDTZ3XPwAAAAAAeZ9Aa0jcY+nD4j/sUbgehXmfQEIIyJdQwdE/AAAAAAB6n0Cn6bMDrivgPxSuR+F6ep9AHZJaKJmcxD8AAAAAAHufQL2o3a8CfOY/7FG4HoV7n0C3tYXnpWLjPwAAAAAAfJ9AVYfcDDfg4D8UrkfhenyfQAc/cQD9Pu8/AAAAAAB9n0AHeqhtwyjiP+xRuB6FfZ9AiIVa07zj6z8AAAAAAH6fQDPhl/p50+4/FK5H4Xp+n0BSSZ2AJsLaPwAAAAAAf59AYZYs3RPapD/sUbgehX+fQJBnl2992Og/AAAAAACAn0CDwMqhRbbTPxSuR+F6gJ9A63O1FfvL2T8AAAAAAIGfQIFbd/NUB+o/7FG4HoWBn0DaxTTTvU7CPwAAAAAAgp9A+rZgqS7g5T8UrkfheoKfQD8e+u5WluY/AAAAAACDn0AcCwqDMg3gP+xRuB6Fg59AVKuvrgrU7j8AAAAAAISfQFgczvxqDtE/FK5H4XqEn0ATgH9KlajjPwAAAAAAhZ9AV0/3S9WHpz/sUbgehYWfQJQyqaENwNE/AAAAAACGn0DIfECgM2nePxSuR+F6hp9AKZSFr6915j8AAAAAAIefQOljPiDQmdI/7FG4HoWHn0A+d4L91znuPwAAAAAAiJ9AgLVq14S03T8UrkfheoifQMYwJ2iTw+c/AAAAAACJn0ATYi6p2m7ZP+xRuB6FiZ9A7ZqQ1hh07T8AAAAAAIqfQASqfxDJkOw/FK5H4XqKn0BN+RBUjV7ZPwAAAAAAi59Ajq1nCMcswT/sUbgehYufQKa1aWyvheM/AAAAAACMn0BW8rG7QEnBPxSuR+F6jJ9A9L9cixag5j8AAAAAAI2fQG8vaYzWUe0/7FG4HoWNn0AGZK93fzzuPwAAAAAAjp9A61VkdEAS7D8Urkfheo6fQE57Ss6JPe4/AAAAAACPn0ArM6X1twTnP+xRuB6Fj59AtrxyvW2m7j8AAAAAAJCfQGAX6lUJu7M/FK5H4XqQn0AsZK4Mqg3mPwAAAAAAkZ9ASwM/qmG/vz/sUbgehZGfQORLqODwAu0/AAAAAACSn0An3ZbIBWfIPxSuR+F6kp9AmlyMgXUc3D8AAAAAAJOfQJwXJ77aUeU/7FG4HoWTn0C3s688SE/TPwAAAAAAlJ9AAFgdOdKZ5D8UrkfhepSfQMdMol7wae4/AAAAAACVn0AiqvBneLPCP+xRuB6FlZ9AEr9iDRc57T8AAAAAAJafQCVMYlrlU6E/FK5H4XqWn0AjaMwk6gXHPwAAAAAAl59AeEFEatrF1j/sUbgehZefQBE0ZhL1AuU/AAAAAACYn0CqKck6HN3tPxSuR+F6mJ9Axty1hHzQ0T8AAAAAAJmfQGSw4lRrYdI/7FG4HoWZn0CYvWw7bY3jPwAAAAAAmp9AQ9AsZAnGpD8UrkfhepqfQDHSi9r9Ks4/AAAAAACbn0B32a873fngP+xRuB6Fm59AK/wZ3qzB1z8AAAAAAJyfQAb0wp0Lo+E/FK5H4Xqcn0D8GHPXEnLkPwAAAAAAnZ9AvXDnwkgvyD/sUbgehZ2fQF6CUx9I3rE/AAAAAACen0DfwyXHndLaPxSuR+F6np9Ah4bFqGvt5z8AAAAAAJ+fQPomTYOi+e0/7FG4HoWfn0B0Jm2q7pHvPwAAAAAAoJ9AaOkKthFP7D8UrkfheqCfQB0fLc4YZuM/AAAAAAChn0Bwe4LEdve8P+xRuB6FoZ9A/g5FgT6R7T8AAAAAAKKfQJet9UVCW9c/FK5H4Xqin0DSw9Dq5IzuPwAAAAAAo59Ayjfb3Jge4j/sUbgehaOfQCxJnuv7cMw/AAAAAACkn0CW6ZeIt07qPxSuR+F6pJ9Agxd9BWlG7T8AAAAAAKWfQNHKvcCsUNw/7FG4HoWln0B4X5ULlX/cPwAAAAAApp9A1QRR9wFI2D8UrkfheqafQGN6whIPKOg/AAAAAACnn0BEwvf+Bu3aP+xRuB6Fp59AsmX5ugz/vT8AAAAAAKifQJ2E0hdCzs0/FK5H4Xqon0B4KuCe58/uPwAAAAAAqZ9Aour8gKxMuT/sUbgehamfQDhorz4e+r4/AAAAAACqn0AAOPbsuUzjPxSuR+F6qp9AQQ+1bRgF4D8AAAAAAKufQKLvbmWJzso/7FG4HoWrn0BpjxfS4SHYPwAAAAAArJ9AUpj3ONOEwz8UrkfheqyfQE/nilJCsNU/AAAAAACtn0B7hJohVRTaP+xRuB6FrZ9AkKSkh6HV6j8AAAAAAK6fQIkuAykMJZY/FK5H4Xqun0DY1HlU/N/ZPwAAAAAAr59ADlJLzuT2hj/sUbgeha+fQHxgx3+BoOo/AAAAAACwn0BinpW04hvEPxSuR+F6sJ9Al4BO9/AbhT8AAAAAALGfQC7IluXrMt0/7FG4HoWxn0BMGqN1VDXePwAAAAAAsp9AqmOV0jO96z8UrkfherKfQOpBQSlaOe0/AAAAAACzn0BOQX42ct3IP+xRuB6Fs59ArIvbaADv5z8AAAAAALSfQB+GVidnKMY/FK5H4Xq0n0Dxf0dUqO7tPwAAAAAAtZ9AD3r8/7Qobj/sUbgehbWfQK8GKA01CtU/AAAAAAC2n0CGVbyReeTXPxSuR+F6tp9A85ApH4Kq6z8AAAAAALefQJVGzOzzGNs/7FG4HoW3n0CzmUNSCyXkPwAAAAAAuJ9AVyO70jJS5z8UrkfherifQIB+3795cbo/AAAAAAC5n0AKoYMu4VDoP+xRuB6FuZ9A7KaU10ro7j8AAAAAALqfQLGmsijsIu4/FK5H4Xq6n0DWARB39SrGPwAAAAAAu59AMQxYchUL5T/sUbgehbufQPhT46WbxOw/AAAAAAC8n0DedqG5TqPiPxSuR+F6vJ9Aox03/G467j8AAAAAAL2fQFddh2pKsso/7FG4HoW9n0CGAyFZwITmPwAAAAAAvp9ABtSbUfPV5D8Urkfher6fQEYGuYswReI/AAAAAAC/n0AaB00BH3KxP+xRuB6Fv59AbFopBHKJ7T8AAAAAAMCfQBFuMqoM474/FK5H4XrAn0BFLc2tEFbQPwAAAAAAwZ9AIm5OJQNAxz/sUbgehcGfQCeFeY8zTdM/AAAAAADCn0Cgh9o2jALkPxSuR+F6wp9AAG+BBMWP2j8AAAAAAMOfQImXp3NFKe8/7FG4HoXDn0B7vma5bPTnPwAAAAAAxJ9AqWkX00z31z8UrkfhesSfQI54spsZfew/AAAAAADFn0DA6PLmcK3tP+xRuB6FxZ9AoCQTpt4JpD8AAAAAAMafQInUtItppuY/FK5H4XrGn0CXOPJAZJHnPwAAAAAAx59AldQJaCLs6j/sUbgehcefQN4crtUe9uY/AAAAAADIn0CxUGuad5zuPxSuR+F6yJ9AqyAGuvYF4z8AAAAAAMmfQBsD/GTWnLc/7FG4HoXJn0BgzQGCOXrdPwAAAAAAyp9AyM9GrptS7D8UrkfhesqfQBDs+C8QBOA/AAAAAADLn0ALJ2n+mFbjP+xRuB6Fy59AjexKy0i9xT8AAAAAAMyfQKinj8AffuM/FK5H4XrMn0DIwsarYuC1PwAAAAAAzZ9AjLysiQW+1D/sUbgehc2fQMMoCB7f3sU/AAAAAADOn0B/h6JAn8jgPxSuR+F6zp9A+1jBb0OM1z8AAAAAAM+fQMobYOY7+OA/7FG4HoXPn0DVP4hkyLHFPwAAAAAA0J9AibFMv0Q84T8UrkfhetCfQCbl7nN8tOc/AAAAAADRn0Brup7ouvDDP+xRuB6F0Z9Age1gxD4B1z8AAAAAANKfQNemsb0WdOI/FK5H4XrSn0AuXLEaphGmPwAAAAAA059AnrMFhNZD4j/sUbgehdOfQH5xqUpb3Oc/AAAAAADUn0BNgczOovfmPxSuR+F61J9Ar+qsFtjj7j8AAAAAANWfQLqe6Lrwg+I/7FG4HoXVn0D4w89/D17RPwAAAAAA1p9AH0sfuqC+2z8UrkfhetafQCLhe3+D9tI/AAAAAADXn0Cuu3mqQ+7lP+xRuB6F159AFACIYMGinz8AAAAAANifQMK+nUSEf9w/FK5H4XrYn0BLI2b2eYzMPwAAAAAA2Z9AT8sPXOUJ3j/sUbgehdmfQCE/G7luSr0/AAAAAADan0DG4cyv5oDlPxSuR+F62p9AHT1+b9Of4z8AAAAAANufQPRSsTGvI9c/7FG4HoXbn0A7cTlegWjgPwAAAAAA3J9ALbEyGvm84T8UrkfhetyfQHBmT11U5rc/AAAAAADdn0A9C0J5H0fZP+xRuB6F3Z9Ah97i4T2H6j8AAAAAAN6fQDYgQlw5e8E/FK5H4Xren0DZlgFnKdniPwAAAAAA359AC7d8JCW97j/sUbgehd+fQNC4cCAki+c/AAAAAADgn0D4FtaNd0ftPxSuR+F64J9ARmEXRQ982j8AAAAAAOGfQPvlkxXDVec/7FG4HoXhn0B2xCEbSBfFPwAAAAAA4p9Ae2r11VWB0T8UrkfheuKfQNUiopi8Aco/AAAAAADjn0DWAKWhRiHqP+xRuB6F459A3h6EgHwJyT8AAAAAAOSfQK8LPzifOus/FK5H4Xrkn0CIg4QoX9C+PwAAAAAA5Z9ArgyqDU5E7T/sUbgeheWfQDwqozYWubA/AAAAAADmn0ClTdU9sjnrPxSuR+F65p9ArTQpBd1e2D8AAAAAAOefQDkqN1FLc+s/7FG4HoXnn0Cta7Qc6KHEPwAAAAAA6J9A78uZ7Qp96T8UrkfheuifQAIPDCB8KOc/AAAAAADpn0ClhGBVvXzhP+xRuB6F6Z9A2XxcGyrGwz8AAAAAAOqfQFQ57Sk5J+w/FK5H4Xrqn0AXR+UmamnsPwAAAAAA659AJTyh15/EzT/sUbgeheufQLlxi/m5ods/AAAAAADsn0DgnBGlvcG/PxSuR+F67J9AzJcXYB+d1T8AAAAAAO2fQBblLbL4qLI/7FG4HoXtn0C7RPXWwFa9PwAAAAAA7p9A41RrYRba2z8Urkfheu6fQG7DKAgeX+A/AAAAAADvn0ArNBDLZg7hP+xRuB6F759AEyf3OxQF7D8AAAAAAPCfQGOD4Eyn0Jw/FK5H4Xrwn0BtV+iDZezuPwAAAAAA8Z9AhQt5BDdS5z/sUbgehfGfQJ9y8VyEzqg/AAAAAADyn0DB4Jo7+l/rPxSuR+F68p9AbcmqCDcZ2T8AAAAAAPOfQP+SVKaYA+Q/7FG4HoXzn0Aa4e1BCMjvPwAAAAAA9J9AP6n26XhM7z8UrkfhevSfQMEffv578Nw/AAAAAAD1n0BBD7VtGAW9P+xRuB6F9Z9Aqfkq+dhdwj8AAAAAAPafQA4yychZ2Ls/FK5H4Xr2n0DSqSuf5XnuPwAAAAAA959AChFwCFVq4z/sUbgehfefQMjRHFn5ZdI/AAAAAAD4n0A18Q7wpIXTPxSuR+F6+J9AfR8OEqJ8wT8AAAAAAPmfQLiSHRuBeN8/7FG4HoX5n0BaETXR56PWPwAAAAAA+p9A98391eM+5j8UrkfhevqfQOQSRx6ILO8/AAAAAAD7n0B+rOC3IcbJP+xRuB6F+59AyD8ziA/swj8AAAAAAPyfQBAqJ5DILWw/FK5H4Xr8n0AFUmLX9vbjPwAAAAAA/Z9AtI8V/DbE5j/sUbgehf2fQMr5Yu/Fl+g/AAAAAAD+n0ANUvAUcqXWPxSuR+F6/p9AforjwKvlnj8AAAAAAP+fQO+s3XahuY4/7FG4HoX/n0AZAKq4cYvgPwAAAAAAAKBA3ncMj/0s2T8K16NwPQCgQN4KvO4IArE/AAAAAIAAoECd9L7xtefjP/YoXI/CAKBAh9uhYTFq7z8AAAAAAAGgQKnrmtpjM5k/CtejcD0BoEDMY83IIHfYPwAAAACAAaBAFR40u+4t7j/2KFyPwgGgQNTyA1d5AuI/AAAAAAACoEC4AZ8fRojnPwrXo3A9AqBA+DjThO0n7z8AAAAAgAKgQGOXqN4aWOI/9ihcj8ICoEA7Vb5nJELpPwAAAAAAA6BAOUayR6iZ6j8K16NwPQOgQL2Pozmy8tk/AAAAAIADoECKc9TRcTXaP/YoXI/CA6BAz4WRXtTu2j8AAAAAAASgQEq2upwSkOI/CtejcD0EoEBYyjLEsS7pPwAAAACABKBAPglszsEzxz/2KFyPwgSgQNv66T9rfsQ/AAAAAAAFoEAGRl7WxALrPwrXo3A9BaBAlV5A1CJHnz8AAAAAgAWgQC6SdqOP+ec/9ihcj8IFoEDUZvc/GxSgPwAAAAAABqBAvEG0VrS56j8K16NwPQagQLL0oQvqW+A/AAAAAIAGoED4jERoBBvLP/YoXI/CBqBArW2Kx0W16z8AAAAAAAegQA0zNJ4I4tM/CtejcD0HoEA0u+6tSMzvPwAAAACAB6BAKE8PwLy2sz/2KFyPwgegQHCaPjvguus/AAAAAAAIoEBvm6kQj0TpPwrXo3A9CKBA7KAS1zEu4z8AAAAAgAigQFhZNs4B3bY/9ihcj8IIoEBK8IY0KnDkPwAAAAAACaBAhNcubTgs5z8K16NwPQmgQGFsIchBieE/AAAAAIAJoECDE9GvrZ/XP/YoXI/CCaBAqRWm7zUE4j8AAAAAAAqgQIYEjC5vDtI/CtejcD0KoEBHdTqQ9dThPwAAAACACqBArHKh8q/l5z/2KFyPwgqgQLr7d9ifH5E/AAAAAAALoECGPIIbKVvAPwrXo3A9C6BA7s1vmGiQ7T8AAAAAgAugQC44g79fzNQ/9ihcj8ILoEDLTdTS3AraPwAAAAAADKBAJezbSUR46D8K16NwPQygQH4CKEaWzOU/AAAAAIAMoEB8tg4O9ibVP/YoXI/CDKBAkzmWd9UDwD8AAAAAAA2gQHMqGQCquNY/CtejcD0NoEAnFCLgEKrhPwAAAACADaBAiBIteTwtuz/2KFyPwg2gQCDvVSsTfrU/AAAAAAAOoEC8G7BQEOGEPwrXo3A9DqBAl/+Qfvs64z8AAAAAgA6gQDaSBOEKKNE/9ihcj8IOoEBV2uIan0nrPwAAAAAAD6BAggAZOnZQ1z8K16NwPQ+gQPd4IR0ewuo/AAAAAIAPoECPxwxUxr/oP/YoXI/CD6BA1uWUgJiEzz8AAAAAABCgQHe8yW/Rydw/CtejcD0QoECCkCxgAjfiPwAAAACAEKBAAyfbwB0o5j/2KFyPwhCgQMUgsHJoEeI/AAAAAAARoEC0X9JzZhaUPwrXo3A9EaBAo61KIvsgyz8AAAAAgBGgQF+zXDY6Z+s/9ihcj8IRoEAjEK/rF+zlPwAAAAAAEqBAwAevXdpw6T8K16NwPRKgQKVA8hC+3lo/AAAAAIASoEAMycnErYK2P/YoXI/CEqBAptJPOLu15D8AAAAAABOgQDUNiuYBLN0/CtejcD0ToEBd8/Rbhd62PwAAAACAE6BA63B0le6u2j/2KFyPwhOgQCPajqm7sr8/AAAAAAAUoEBgBmNEotDdPwrXo3A9FKBAmuyfpwED5z8AAAAAgBSgQExPWOIBZd0/9ihcj8IUoEBB9KRMaujtPwAAAAAAFaBAS+92GO63tz8K16NwPRWgQJ7RViWRfd8/AAAAAIAVoEAXt9EA3gLQP/YoXI/CFaBAryXkg57N1T8AAAAAABagQALwT6kSZe4/CtejcD0WoEA5DOavkLnkPwAAAACAFqBAqtVXVwXq7z/2KFyPwhagQJ8dcF0xI+4/AAAAAAAXoEC+v0F79fHnPwrXo3A9F6BAPDCA8KFE7D8AAAAAgBegQJShKqbSz+c/9ihcj8IXoEAzMQLPYs6yPwAAAAAAGKBAa4Ko+wAk5T8K16NwPRigQOGsLeF1ook/AAAAAIAYoEBvRzgteFHmP/YoXI/CGKBAk/3zNGCQ6z8AAAAAABmgQH2yYrg6AN8/CtejcD0ZoEAu5ueGpuygPwAAAACAGaBAe2tgqwQL7D/2KFyPwhmgQBmPUglP6Ng/AAAAAAAaoEAnR6bo7XSyPwrXo3A9GqBArTB9ryE44D8AAAAAgBqgQBVVv9L58Mo/9ihcj8IaoEDDnQsjvajWPwAAAAAAG6BAxTcUPlsH2j8K16NwPRugQPSJPEm6ZuU/AAAAAIAboEBxfQ7iua23P/YoXI/CG6BAZcbbSq/Nwj8AAAAAABygQC6RC87g7+4/CtejcD0coEAY0XZM3RXgPwAAAACAHKBA8656wDxk1T/2KFyPwhygQKLw2To42Oc/AAAAAAAdoECazeMwmL/TPwrXo3A9HaBAr7X3qSo05j8AAAAAgB2gQIUIOIQqtek/9ihcj8IdoEDhfyvZsRHXPwAAAAAAHqBAkSkfgqrR4T8K16NwPR6gQDm3CffKvNc/AAAAAIAeoEDfxftx++XfP/YoXI/CHqBAokEKnkKu3D8AAAAAAB+gQPFV4YVjTKA/CtejcD0foEBKJNHLKJa/PwAAAACAH6BAz2dAvRm16T/2KFyPwh+gQGmNQSeEjuE/AAAAAAAgoEA7NgLxun7rPwrXo3A9IKBAx3+BIECG0z8AAAAAgCCgQAgPiTGfYrE/9ihcj8IgoEDO+pRjsrjqPwAAAAAAIaBAhleSPNf3vT8K16NwPSGgQM/b2OxIdek/AAAAAIAhoEAl6gWf5uTpP/YoXI/CIaBAMA4uHXMe7j8AAAAAACKgQHRcjexKy9c/CtejcD0ioED+ZffkYaHUPwAAAACAIqBAwJKrWPym2D/2KFyPwiKgQCwrTUpBt8E/AAAAAAAjoEA90uC2tvDgPwrXo3A9I6BAeXk6V5QSvj8AAAAAgCOgQKnTJvM0BZ8/9ihcj8IjoED1IblGFQ+lPwAAAAAAJKBA5GpkV1pG7D8K16NwPSSgQEs9C0J5H8s/AAAAAIAkoED9+EuL+iTHP/YoXI/CJKBArkhMUMM34D8AAAAAACWgQMJM27+y0uA/CtejcD0loEDghhivedXnPwAAAACAJaBADqDf92/e4T/2KFyPwiWgQOLwOPu5V7A/AAAAAAAmoECt/DIYI5LkPwrXo3A9JqBA8L+V7NgI4j8AAAAAgCagQOvgYG9iSKI/9ihcj8ImoEAIWKt2TUjDPwAAAAAAJ6BAmwEuyJbluz8K16NwPSegQCbhQh7Bjdg/AAAAAIAnoEABamrZWl/TP/YoXI/CJ6BA4Xmp2JhX4j8AAAAAACigQFg6H54lyNY/CtejcD0ooECHTzqRYCruPwAAAACAKKBAsWt7uyU50z/2KFyPwiigQP0Ux4FXy9w/AAAAAAApoEDwiArVzcXSPwrXo3A9KaBA1c+bilQY7D8AAAAAgCmgQCiZnNoZJu0/9ihcj8IpoECjOh3IemrpPwAAAAAAKqBAdQEvM2wU5T8K16NwPSqgQD5BYrt7AOQ/AAAAAIAqoEB/TGvT2N7tP/YoXI/CKqBAborHRbWI6T8AAAAAACugQB01ywrqALE/CtejcD0roEC5wVCHFe7tPwAAAACAK6BAHqSnyCFi6D/2KFyPwiugQDwzwXCuYcY/AAAAAAAsoEBbzxCOWXbuPwrXo3A9LKBACks8oGzK2j8AAAAAgCygQET3rGu0HNI/9ihcj8IsoEAGMGXggJbrPwAAAAAALaBAecn/5O/e5T8K16NwPS2gQMBd9utOd+s/AAAAAIAtoEDwbI/ecB/PP/YoXI/CLaBA2GFM+nspjD8AAAAAAC6gQCl3n+OjxdE/CtejcD0uoECdLSC0Hj7sPwAAAACALqBA8mCL3T4r5z/2KFyPwi6gQOxQTUnW4cQ/AAAAAAAvoEApB7MJMCzXPwrXo3A9L6BAKxTpfk5B5D8AAAAAgC+gQJII6BlWTKw/9ihcj8IvoEDMDBtl/WbjPwAAAAAAMKBAqMZLN4lBxD8K16NwPTCgQK2+uipQi70/AAAAAIAwoEANbmsLz8vhP/YoXI/CMKBAUaT7OQV54D8AAAAAADGgQBHhXwSNGeQ/CtejcD0xoEBMw/ARMSW6PwAAAACAMaBA9dpsrMQ84T/2KFyPwjGgQCefHtsy4Mw/AAAAAAAyoECI9UatMH3aPwrXo3A9MqBA5WA2AYblzT8AAAAAgDKgQDIDlfHvs+I/9ihcj8IyoEAzNnSzP1DCPwAAAAAAM6BANSpwsg3c1T8K16NwPTOgQP922a873dE/AAAAAIAzoED4bYjxmtfsP/YoXI/CM6BAKbFre7ul5D8AAAAAADSgQO7of7kWLdw/CtejcD00oECUhETaxp/GPwAAAACANKBAoWmJldHIhz/2KFyPwjSgQLq2XKIfsrU/AAAAAAA1oEDYnlkSoKbGPwrXo3A9NaBAaoe/JmvU7T8AAAAAgDWgQCTQYFPnUeE/9ihcj8I1oED0Fg/vObDnPwAAAAAANqBAPZtVn6ut3j8K16NwPTagQDbNO07Rkek/AAAAAIA2oEB1AMRdvQrrP/YoXI/CNqBAvAM8aeGyzD8AAAAAADegQPIJ2Xkbm+c/CtejcD03oED8Ny9OfDXpPwAAAACAN6BAUkfH1ciu5j/2KFyPwjegQPZ9OEiIcuM/AAAAAAA4oEBVTRB1H4DMPwrXo3A9OKBA9/djpCjhkz8AAAAAgDigQAU0ETY8vdU/9ihcj8I4oEDcRgN4C6TtPwAAAAAAOaBAmrFoOjsZ0T8K16NwPTmgQDAS2nIuxe4/AAAAAIA5oEADX9Gt1/TeP/YoXI/COaBAs12hD5ax0z8AAAAAADqgQPM8uDtrt9E/CtejcD06oEBgWz/9Z83cPwAAAACAOqBAJQSr6uV3yj/2KFyPwjqgQPdWJCao4e4/AAAAAAA7oEBI/fUKC+7UPwrXo3A9O6BARdrGn6hs3j8AAAAAgDugQAtD5PT1fNg/9ihcj8I7oEB2ptB5jV3kPwAAAAAAPKBAdqbQeY1d0T8K16NwPTygQMHFihpMQ+o/AAAAAIA8oEDIJY48EFnVP/YoXI/CPKBAenHiqx3F3T8AAAAAAD2gQIlDNpAutug/CtejcD09oEDgTEwXYvXVPwAAAACAPaBAsFjDRe5p7T/2KFyPwj2gQAq5Us+CUMg/AAAAAAA+oEDxETElkujqPwrXo3A9PqBA/mK2ZFWE3T8AAAAAgD6gQPtz0ZDxKNo/9ihcj8I+oEAykGeXb33fPwAAAAAAP6BAnStKCcGqwj8K16NwPT+gQHSV7q6zIdw/AAAAAIA/oEAKn62Dgz3kP/YoXI/CP6BApBmLprMT5D8AAAAAAECgQNjxXyAIkME/CtejcD1AoEA3x7lNuFfZPwAAAACAQKBAH54lyAio0D/2KFyPwkCgQCnOUUfH1dU/AAAAAABBoEA66ui4GlnvPwrXo3A9QaBAH7qgvmVO1T8AAAAAgEGgQMRcUrXdBMU/9ihcj8JBoEC3YKku4GXrPwAAAAAAQqBAaK8+Hvru4z8K16NwPUKgQJFGBU62gdM/AAAAAIBCoEBDjxg9t9DeP/YoXI/CQqBAgEdUqG4u1z8AAAAAAEOgQN1c/G1PkOU/CtejcD1DoEBksrj/yHTTPwAAAACAQ6BAfoy5awn5xD/2KFyPwkOgQGZ8qenEL7I/AAAAAABEoEBMiLmkarvDPwrXo3A9RKBAiMymbQ22oj8AAAAAgESgQMB4Bg39E9g/9ihcj8JEoEBup60RwTjpPwAAAAAARaBAZavLKQEx0j8K16NwPUWgQN7lIr4TM+0/AAAAAIBFoECXKZyTzQuqP/YoXI/CRaBAlYCYhAt5xj8AAAAAAEagQNdrelBQirg/CtejcD1GoEDUuDe/YaLnPwAAAACARqBAmnyzzY3p1T/2KFyPwkagQK/OMSB7veY/AAAAAABHoEA+Xd2x2CbXPwrXo3A9R6BAknU4ukp32T8AAAAAgEegQCyC/61kx84/9ihcj8JHoEApIO1/gDXnPwAAAAAASKBAjq1nCMcsyT8K16NwPUigQEXZW8r5Yss/AAAAAIBIoEAXuDzWjAzmP/YoXI/CSKBAZM+ey9Sk7T8AAAAAAEmgQOZd9YB5yOA/CtejcD1JoEBVppiDoKPhPwAAAACASaBAhcyVQbXB3T/2KFyPwkmgQHYNRGD2/LQ/AAAAAABKoECSlzWxwFfbPwrXo3A9SqBAGcdI9gi17j8AAAAAgEqgQAXTeglfqag/9ihcj8JKoEC+UMB2MGLmPwAAAAAAS6BAMe9xpgnb5z8K16NwPUugQApNEkvKXe4/AAAAAIBLoEC9VGzM64jaP/YoXI/CS6BA/wjDgCVX0z8AAAAAAEygQNnR9rcdfYA/CtejcD1MoEDxSScSTLXvPwAAAACATKBA1c3F3/aE6D/2KFyPwkygQLQB2IAIcds/AAAAAABNoEBPQBNhw9PnPwrXo3A9TaBAX3zRHi+k3T8AAAAAgE2gQDUIc7uXe+M/9ihcj8JNoEAuVWmLa/zjPwAAAAAATqBAeXk6V5QS6D8K16NwPU6gQIi7ehUZHcY/AAAAAIBOoECFQZlGk4vJP/YoXI/CTqBAfLlPjgJE0D8AAAAAAE+gQOULWkjA6N0/CtejcD1PoECiJY+n5YfmPwAAAACAT6BAjIUhcvr65j/2KFyPwk+gQFfPKOEyPIA/AAAAAABQoECiemtgqwTaPwrXo3A9UKBAINCZtKm6wT8AAAAAgFCgQCgqG9ZUFtY/9ihcj8JQoEBDG4ANiBDYPwAAAAAAUaBA7pdPVgxXyz8K16NwPVGgQN9gue9iq7c/AAAAAIBRoEDhz/BmDd7oP/YoXI/CUaBARQ4RN6eSyT8AAAAAAFKgQGN9A5MbRe8/CtejcD1SoEDsEtVbA1vrPwAAAACAUqBAklz+Q/pt4T/2KFyPwlKgQEfJq3MMyLI/AAAAAABToEB6UbtfBfjYPwrXo3A9U6BAyTuHMlTFhD8AAAAAgFOgQAexM4XO6+E/9ihcj8JToEBRweEFEanpPwAAAAAAVKBARl1r71NV7z8K16NwPVSgQFa45SMp6ew/AAAAAIBUoECGOxdGetHmP/YoXI/CVKBAp7G9FvTe2T8AAAAAAFWgQKzrqwa8J6Y/CtejcD1VoEAKKxVUVP3WPwAAAACAVaBA1bDfE+vU6j/2KFyPwlWgQPxUFRqI5e8/AAAAAABWoECCdLFppRDUPwrXo3A9VqBAJgD/lCpR5z8AAAAAgFagQPaaHhSUIuA/9ihcj8JWoEAgGbz5V6CxPwAAAAAAV6BAa5vicVEtwD8K16NwPVegQJBlwcQfRdk/AAAAAIBXoEALmwEuyJbrP/YoXI/CV6BA0y8Rb51/6T8AAAAAAFigQFfuBWaFIuw/CtejcD1YoEAWMlcG1QbpPwAAAACAWKBAD9O+ub96vD/2KFyPwligQFyTbkvkgt0/AAAAAABZoEA4hgDg2LPYPwrXo3A9WaBAHRFC9jBqlT8AAAAAgFmgQF/waU5eZOk/9ihcj8JZoECEud3LfXLAPwAAAAAAWqBATntKzok96T8K16NwPVqgQECgM2lTdeg/AAAAAIBaoEC7Ngr/2NqRP/YoXI/CWqBAe2ZJgJra6T8AAAAAAFugQEQIfgo2ZJo/CtejcD1boEC2SNqNPmbhPwAAAACAW6BAfxR15h6S6j/2KFyPwlugQGISLuQRXOQ/AAAAAABcoECtpuuJrovuPwrXo3A9XKBAiXjr/Ntl3j8AAAAAgFygQNehmpKsw+E/9ihcj8JcoEBSmzi53yHlPwAAAAAAXaBALIGU2LW93z8K16NwPV2gQGtHcY46Otk/AAAAAIBdoECscTYdAdzrP/YoXI/CXaBAVBuciH5t1z8AAAAAAF6gQB6LbVLRWN4/CtejcD1eoED9oZkn1xTCPwAAAACAXqBA1TxH5LuU6z/2KFyPwl6gQM5xbhPuldM/AAAAAABfoEBO7KF9rODkPwrXo3A9X6BAUkXxKmub5z8AAAAAgF+gQOOKi6NyE9E/9ihcj8JfoECnkgGgipvrPwAAAAAAYKBAOSuiJvp8xj8K16NwPWCgQNdrelBQiuY/AAAAAIBgoED/JalMMYfiP/YoXI/CYKBAEOZ2L/fJ2D8AAAAAAGGgQA1xrIvbaMI/CtejcD1hoEBV3SObq+bWPwAAAACAYaBAqio0EMtm1j/2KFyPwmGgQGtdD8sLVZ4/AAAAAABioEDcLjTXaaTjPwrXo3A9YqBAYFs//WdN5T8AAAAAgGKgQOrwa3/CNJ8/9ihcj8JioEDdBrXf2onSPwAAAAAAY6BAJ71vfO0Z4T8K16NwPWOgQPN0riglBL8/AAAAAIBjoED8VYDvNu/vP/YoXI/CY6BAEeLK2Tuj0z8AAAAAAGSgQOblVUIckLc/CtejcD1koEAt0sQ7wBPpPwAAAACAZKBA5ZmXw+675z/2KFyPwmSgQO+WPzrQnqY/AAAAAABloECIn/8evHbLPwrXo3A9ZaBADeTZ5VsfyD8AAAAAgGWgQOJzJ9h/nac/9ihcj8JloEDj4T0HliPoPwAAAAAAZqBAP+YDAp1J1j8K16NwPWagQBHGT+Pe/NI/AAAAAIBmoEBmoDL+fcbtP/YoXI/CZqBADXGsi9vo5D8AAAAAAGegQBBYObTI9uE/CtejcD1noEAAWB050pntPwAAAACAZ6BAO8eA7PXu4z/2KFyPwmegQJG6nX3lweg/AAAAAABooEDfUzntKbnuPwAAAAAAsJ1AECTvHMrQ4T8UrkfherCdQOtwdJXurtY/AAAAAACxnUBHADeLFwvmP+xRuB6FsZ1AUkSGVbyRvT8AAAAAALKdQGTo2EElrsE/FK5H4XqynUCnb18o3AJkPwAAAAAAs51AQ3QIHAk00T/sUbgehbOdQOvE5XgFou0/AAAAAAC0nUDDRe7p6o7WPxSuR+F6tJ1A6+Oh725lyT8AAAAAALWdQHi13JkJhtk/7FG4HoW1nUCj6exkcJTYPwAAAAAAtp1Af6FHjJ5b5D8UrkfheradQAt+G2K85tg/AAAAAAC3nUAk0jb+RGXjP+xRuB6Ft51AMBAEyNCx0z8AAAAAALidQOI9B5YjZLw/FK5H4Xq4nUDbEyS2uwfePwAAAAAAuZ1A44v2eCEd2D/sUbgehbmdQB2Txf1HprU/AAAAAAC6nUDSwmUVNgPcPxSuR+F6up1A6WUUyy0t5z8AAAAAALudQCL6tfXTf9M/7FG4HoW7nUCl9EwvMZbXPwAAAAAAvJ1Akx6GVifn6j8UrkfherydQOlGWFTE6eY/AAAAAAC9nUCvdU5Yh0i4P+xRuB6FvZ1ADtqrj4c+5D8AAAAAAL6dQKa3PxcNmec/FK5H4Xq+nUBaSwFp/wPcPwAAAAAAv51AmUnUCz5N7z/sUbgehb+dQJRKeEKvP9k/AAAAAADAnUBBKsWOxqHVPxSuR+F6wJ1ALgH4p1SJ5T8AAAAAAMGdQGOZfol468o/7FG4HoXBnUBHsHH9uz7HPwAAAAAAwp1AJo+n5Qcu5j8UrkfhesKdQDj3V4/7Vs0/AAAAAADDnUAJ3pBGBU7iP+xRuB6Fw51A3MMUm0XerD8AAAAAAMSdQN83vvbMktY/FK5H4XrEnUC45o7+l2vgPwAAAAAAxZ1Asn+eBgyS3j/sUbgehcWdQN5y9WOT/OA/AAAAAADGnUDgnBGlvcHPPxSuR+F6xp1A6KZJAGnFWD8AAAAAAMedQEKz696KxO4/7FG4HoXHnUA1lxsMdVjLPwAAAAAAyJ1AVZedj3xvpT8UrkfhesidQOiDZWzoZuk/AAAAAADJnUBKCiyAKYPlP+xRuB6FyZ1AOZhNgGH53j8AAAAAAMqdQMueBDbn4O0/FK5H4XrKnUBpb/CFyVThPwAAAAAAy51AIAw89x4u5z/sUbgehcudQLk4KjdRS8k/AAAAAADMnUD6Y1qbxvbkPxSuR+F6zJ1ATvBN02eH6D8AAAAAAM2dQOEJvf4kPt4/7FG4HoXNnUAZHZCEfTvrPwAAAAAAzp1AvY3NjlTf1j8Urkfhes6dQIidKXReY+k/AAAAAADPnUAMA5ZcxeLNP+xRuB6Fz51AahK8IY0K3z8AAAAAANCdQGuBPSZSmtM/FK5H4XrQnUCaeXJNgczSPwAAAAAA0Z1ARxzTj13UZD/sUbgehdGdQMtHUtLD0N4/AAAAAADSnUCQ+YBAZ9LRPxSuR+F60p1Agqlm1lJAwj8AAAAAANOdQKfMzTei++E/7FG4HoXTnUAyHxDoTNrcPwAAAAAA1J1A76oHzEMm5T8UrkfhetSdQGPt72yP3sA/AAAAAADVnUBaYmU08nnUP+xRuB6F1Z1AIv32deAc5D8AAAAAANadQHKkMzDystM/FK5H4XrWnUA/xXHg1XLkPwAAAAAA151AejVAaahR1T/sUbgehdedQDC6vDlcq8U/AAAAAADYnUDltn2P+uvkPxSuR+F62J1ANGd9yjFZ0z8AAAAAANmdQEseT8sPXNw/7FG4HoXZnUDXwFYJFgfpPwAAAAAA2p1AzVZe8j955z8UrkfhetqdQKEsfH2tS8c/AAAAAADbnUCZ02UxsfnfP+xRuB6F251AjpHsEWoG6D8AAAAAANydQE4mbhXEwOk/FK5H4XrcnUBwXTEjvL3rPwAAAAAA3Z1ASzlf7L144T/sUbgehd2dQNbm/1VHjtU/AAAAAADenUCu9NpsrETnPxSuR+F63p1A48PsZdtp0T8AAAAAAN+dQCLZyBqaV7I/7FG4HoXfnUCpoQ3ABkTgPwAAAAAA4J1ADEM/rmjOsT8UrkfheuCdQEwXYvVHmOo/AAAAAADhnUBnDd5X5ULjP+xRuB6F4Z1AcNBefTz06T8AAAAAAOKdQF2o/Gt55ds/FK5H4XrinUAplfCEXn/ePwAAAAAA451ADr+bbtkh4j/sUbgeheOdQBBB1ejVAN4/AAAAAADknUA9FcuIZvmdPxSuR+F65J1AD9WUZB0O4j8AAAAAAOWdQK99Ab1wZ+Y/7FG4HoXlnUDiXMMMjSfvPwAAAAAA5p1AI9v5fmq81T8UrkfheuadQOj3/ZsXJ8w/AAAAAADnnUDQiIhRxq61P+xRuB6F551A2BGHbCDd5T8AAAAAAOidQJNvtrkxPdQ/FK5H4XronUAQeGAA4UPZPwAAAAAA6Z1AnRA66BIO0z/sUbgehemdQDKSPULNEOM/AAAAAADqnUAonUgw1czePxSuR+F66p1A1ULJ5NTO5D8AAAAAAOudQPTDCOHRxtc/7FG4HoXrnUD75v7qcV/nPwAAAAAA7J1AqvBneLMG5T8UrkfheuydQMmbsomCz6U/AAAAAADtnUCLVHMUe8OsP+xRuB6F7Z1AYaku4GWG4T8AAAAAAO6dQL75DRMN0uM/FK5H4XrunUCgFRiyutXLPwAAAAAA751APNujN9zH4j/sUbgehe+dQEzBGmfTEdM/AAAAAADwnUCrsYS1MXbOPxSuR+F68J1AlnmrrkM15j8AAAAAAPGdQNArnnqkQek/7FG4HoXxnUC4zr9d9uviPwAAAAAA8p1AHk/LD1zlwz8UrkfhevKdQCwujspN1Os/AAAAAADznUCOPBBZpAnsP+xRuB6F851AQrCqXn6n7j8AAAAAAPSdQJYdh2ZDo6w/FK5H4Xr0nUB+HThnRGm7PwAAAAAA9Z1A6gWf5uTF7T/sUbgehfWdQJ2cobjjzeY/AAAAAAD2nUBTQNr/AGvTPxSuR+F69p1AgVziyAMR4D8AAAAAAPedQNOlf0kq0+A/7FG4HoX3nUB+GvfmN8zmPwAAAAAA+J1AHcpQFVNp6T8UrkfhevidQNrLttPWiOA/AAAAAAD5nUCVnBN7aJ/pP+xRuB6F+Z1AkeHCyx1HsT8AAAAAAPqdQKSLTSuFwOs/FK5H4Xr6nUCJJeXuc3zWPwAAAAAA+51A6jwq/u+I5z/sUbgehfudQDv8NVmjHto/AAAAAAD8nUDzk2qfjsfMPxSuR+F6/J1A8Q9bejTV5T8AAAAAAP2dQH+8V61M+Nc/7FG4HoX9nUCIRncQO1PvPwAAAAAA/p1A3bHYJhWN6T8Urkfhev6dQC/3yVGAKOQ/AAAAAAD/nUAeM1AZ/z6rP+xRuB6F/51Ad4L917lp2D8AAAAAAACeQI7pCUs8oOs/FK5H4XoAnkAAUwYOaOnEPwAAAAAAAZ5Agxd9BWnG0z/sUbgehQGeQMkfDDz3Hs4/AAAAAAACnkA6JLVQMjncPxSuR+F6Ap5A8G5lic4y1T8AAAAAAAOeQH6NJEG4guw/7FG4HoUDnkCRKopXWdvKPwAAAAAABJ5AsB9ig4WT2T8UrkfhegSeQLeYnxuasuI/AAAAAAAFnkBbXrneNtPlP+xRuB6FBZ5AC12JQPUP1z8AAAAAAAaeQKIkJNI2fuE/FK5H4XoGnkCNXg1QGmqcPwAAAAAAB55ASghW1cvv3j/sUbgehQeeQLoP5bCg1aY/AAAAAAAInkBdwqG3eHjRPxSuR+F6CJ5ACyjU00fg0D8AAAAAAAmeQEn1nV+UoL8/7FG4HoUJnkDnG9E965rgPwAAAAAACp5AB+3Vx0Pf1j8UrkfhegqeQG+4j9yadNY/AAAAAAALnkAbhSSzeofkP+xRuB6FC55AhCnKpfEL2z8AAAAAAAyeQHXo9Lwbi+0/FK5H4XoMnkBagSGrWz3aPwAAAAAADZ5AnZ0MjpJX0D/sUbgehQ2eQIup9BPObto/AAAAAAAOnkBbmfBL/TzpPxSuR+F6Dp5AzGJi83Ft2T8AAAAAAA+eQJqBJbJqa58/7FG4HoUPnkAB9zx/2ijnPwAAAAAAEJ5AMJ+sGK4OtD8UrkfhehCeQA8O9iaGZOU/AAAAAAARnkBB8s6hDFXBP+xRuB6FEZ5ATioaa39nzT8AAAAAABKeQBA//z147eI/FK5H4XoSnkBl4etrXWrdPwAAAAAAE55AiC6ob5nTxT/sUbgehROeQFO0ci8wq+I/AAAAAAAUnkD6QzNPrinfPxSuR+F6FJ5APZ6WH7jK6z8AAAAAABWeQCidSDDVzO0/7FG4HoUVnkDSx3xAoLPvPwAAAAAAFp5A17/rM2f95T8UrkfhehaeQJKSHoZWJ9M/AAAAAAAXnkCynlp9ddXgP+xRuB6FF55ApGyRtBv94z8AAAAAABieQJwZ/Wg4Zdw/FK5H4XoYnkDpt68D5wztPwAAAAAAGZ5AJ4dPOpFg5T/sUbgehRmeQIWxhSAHpeE/AAAAAAAankDHAhVEk3q3PxSuR+F6Gp5AY2TJHMu72D8AAAAAABueQMyYgjXOpuw/7FG4HoUbnkB1AS8zbJTBPwAAAAAAHJ5ASicSTDWzqj8UrkfhehyeQPJgi90+q+8/AAAAAAAdnkB6w33k1qTRP+xRuB6FHZ5AhUTaxp8o7T8AAAAAAB6eQKCLhoxHqeg/FK5H4XoenkAOTkS/tn7XPwAAAAAAH55AJoxmZfuQ4D/sUbgehR+eQDF6bqErEdQ/AAAAAAAgnkBuhhvw+WHjPxSuR+F6IJ5ANSbEXFK14D8AAAAAACGeQPuSjQdb7Mg/7FG4HoUhnkA89x4uOe7RPwAAAAAAIp5AqKlla32Rwj8UrkfheiKeQB0EHa1qyew/AAAAAAAjnkB4uB0aFqPMP+xRuB6FI55AcbvhiP+Fnz8AAAAAACSeQF6+9WG9Uck/FK5H4XoknkAwE0VI3c7nPwAAAAAAJZ5AgT/8/Pfgzz/sUbgehSWeQAEZOnZQCeI/AAAAAAAmnkAw1GGFWz7SPxSuR+F6Jp5AduCcEaW91D8AAAAAACeeQDW0AdiACOc/7FG4HoUnnkC6aMh4lMruPwAAAAAAKJ5AJxdjYB3H7T8UrkfheiieQGcKndfYJcA/AAAAAAApnkApWyTtRh/bP+xRuB6FKZ5AhnE3iNaK5D8AAAAAACqeQOaRPxh47tk/FK5H4XoqnkBdp5GWytvlPwAAAAAAK55A58Qe2seK5D/sUbgehSueQGx2pPrOL9s/AAAAAAAsnkCkq3R3nQ3DPxSuR+F6LJ5AV2DI6lZP4D8AAAAAAC2eQKQzMPKyJuQ/7FG4HoUtnkCFl+DUB5LWPwAAAAAALp5AeGLWi6Gc6D8Urkfhei6eQBdcvdQZKak/AAAAAAAvnkAFb0ijAifbP+xRuB6FL55AZmoSvCGN3z8AAAAAADCeQHmUSnhCr58/FK5H4XownkC9GqA01CjnPwAAAAAAMZ5Ai2zn+6nx2D/sUbgehTGeQP/qcd9qneo/AAAAAAAynkD+uP3yyYrYPxSuR+F6Mp5AdqimJOtw0z8AAAAAADOeQPvL7snDQuI/7FG4HoUznkB1IOup1Ve7PwAAAAAANJ5Am5FB7iLM7z8UrkfhejSeQGFsIchBiek/AAAAAAA1nkCdL/ZefNHdP+xRuB6FNZ5AhPOpY5XS3j8AAAAAADaeQHb7rDJT2uM/FK5H4Xo2nkDg2/RnP9LrPwAAAAAAN55AM4rlllZD5D/sUbgehTeeQKXY0TjUb+k/AAAAAAA4nkCQ3svYK4eZPxSuR+F6OJ5A8u1dg7507D8AAAAAADmeQFCpEmVvqeM/7FG4HoU5nkADs0KR7ufiPwAAAAAAOp5A5KPFGcOc5T8UrkfhejqeQIJWYMjqVtI/AAAAAAA7nkAJ2LOMecK3P+xRuB6FO55ASWO0jqom2z8AAAAAADyeQN9U/3tLlLI/FK5H4Xo8nkBoQL0ZNV/vPwAAAAAAPZ5AS7A4nPnV1D/sUbgehT2eQA3eV+VC5es/AAAAAAA+nkCqDU5Ev7bKPxSuR+F6Pp5A39416Etv2D8AAAAAAD+eQDgsDfyohtY/7FG4HoU/nkCX/brTnSe+PwAAAAAAQJ5A7kJznUZawD8UrkfhekCeQHjt0obD0uw/AAAAAABBnkDF/rJ78rDZP+xRuB6FQZ5ADAOWXMVi4D8AAAAAAEKeQMnKL4MxIu4/FK5H4XpCnkD0pbc/F43tPwAAAAAAQ55Af4XMlUG1zz/sUbgehUOeQHzRHi+kw90/AAAAAABEnkBNzMS+rnCsPxSuR+F6RJ5Au+zXne485z8AAAAAAEWeQN5Wem02VsY/7FG4HoVFnkABp3fxflziPwAAAAAARp5Ayt+9o8aEyD8UrkfhekaeQJM4K6Im+sI/AAAAAABHnkCaIsDpXbzZP+xRuB6FR55AnAGJgQk3tj8AAAAAAEieQLn+XZ8569k/FK5H4XpInkAuxysQPSnLPwAAAAAASZ5AhGbXvRWJzz/sUbgehUmeQA+Z8iGoGt4/AAAAAABKnkA4h2u1hz3rPxSuR+F6Sp5AOdbFbTSA7T8AAAAAAEueQM+goX+Ci8E/7FG4HoVLnkCQ6K+h5YqgPwAAAAAATJ5AfhOvV/22pD8UrkfhekyeQAU25+CZ0Lw/AAAAAABNnkC8WYP3VbnuP+xRuB6FTZ5ATJBsCVRaoj8AAAAAAE6eQEI/U69bhOU/FK5H4XpOnkDWOnE5XoHVPwAAAAAAT55AuJVem42V0z/sUbgehU+eQEhRZ+4h4eY/AAAAAABQnkCC5QgZyLPgPxSuR+F6UJ5AT3gJTn0g2T8AAAAAAFGeQK6tTLaJrHg/7FG4HoVRnkAvv9NkxtvdPwAAAAAAUp5AzsEzoUli6z8UrkfhelKeQMtIvady2qM/AAAAAABTnkAgDDz3Hi7pP+xRuB6FU55AG/LPDOID4D8AAAAAAFSeQJX0MLQ6ues/FK5H4XpUnkCob5nTZTHQPwAAAAAAVZ5ADk+vlGWI7j/sUbgehVWeQDsA4q5exeU/AAAAAABWnkBg56bNOA3JPxSuR+F6Vp5AaomV0chn7D8AAAAAAFeeQGKFWz6SEuM/7FG4HoVXnkC5xJEHIovmPwAAAAAAWJ5AJ6CJsOHp7D8UrkfhelieQALxun7Bbuk/AAAAAABZnkDZsnxdhv/OP+xRuB6FWZ5AKo9uhEVF3T8AAAAAAFqeQE57Ss6JPew/FK5H4XpankBiTWVR2MXpPwAAAAAAW55AaqFkcmpn3j/sUbgehVueQEfH1ciutNQ/AAAAAABcnkCi725liU7pPxSuR+F6XJ5A6GhVSzrK1D8AAAAAAF2eQFvOpbiq7OI/7FG4HoVdnkBawjXSrTKmPwAAAAAAXp5AgpGXNbHA1T8Urkfhel6eQEyIuaRqu8E/AAAAAABfnkB8t3njpDDTP+xRuB6FX55AvD/eq1Ymwj8AAAAAAGCeQPpYZrbQOqc/FK5H4XpgnkBRacTMPo/rPwAAAAAAYZ5ABRps6jwqxj/sUbgehWGeQIQQkC+hgtQ/AAAAAABinkB7T+W0p2TqPxSuR+F6Yp5A+IpuvaYH2j8AAAAAAGOeQMK9Mm/V9es/7FG4HoVjnkDjUwCMZ9DrPwAAAAAAZJ5AOSaL+49Mwz8UrkfhemSeQGL2su20NbY/AAAAAABlnkBU4jrGFRfPP+xRuB6FZZ5AvYv34/bL1z8AAAAAAGaeQFEVU+knnOY/FK5H4XpmnkBkzF1LyIfpPwAAAAAAZ55AhGVs6GZ/zj/sUbgehWeeQI/iHHV0XN0/AAAAAABonkAcDHVY4ZbTPxSuR+F6aJ5Atm1zvjM1sj8AAAAAAGmeQAdcV8wIb+0/7FG4HoVpnkAz+WabG9PbPwAAAAAAap5A3zR9dsB1lT8UrkfhemqeQMf2WtB7Y9I/AAAAAABrnkCJfQIoRhblP+xRuB6Fa55Anb6er1mu5D8AAAAAAGyeQKHWNO84RdM/FK5H4XpsnkDA4U+ew8a4PwAAAAAAbZ5AwsBz7+GS5z/sUbgehW2eQIuKOJ1kq9M/AAAAAABunkAzF7g81gzvPxSuR+F6bp5AUMO3sG485D8AAAAAAG+eQD9vKlJhbOY/7FG4HoVvnkCjWG5pNSTlPwAAAAAAcJ5Aobskzooo5z8UrkfhenCeQGvSbYlccOA/AAAAAABxnkAM6lvmdFnYP+xRuB6FcZ5AAma+g5+47j8AAAAAAHKeQJynOuRmuNI/FK5H4XpynkDizK/mAMHXPwAAAAAAc55A4KC9+nho5D/sUbgehXOeQDsYsU8AxdQ/AAAAAAB0nkBbQ6m9iLa7PxSuR+F6dJ5AwOldvB+35j8AAAAAAHWeQIvFbworFds/7FG4HoV1nkAyIlFoWXfkPwAAAAAAdp5A4ba28LzU7z8UrkfhenaeQBGN7iB2JuU/AAAAAAB3nkAvMgG/RhLqP+xRuB6Fd55AzLVoAdpW0j8AAAAAAHieQF8NUBpqFOg/FK5H4Xp4nkAmjdE6qprTPwAAAAAAeZ5AaD9SRIZV7D/sUbgehXmeQE6/+i5bobI/AAAAAAB6nkCUbeAO1CnNPxSuR+F6ep5A3p4x3TUypT8AAAAAAHueQPS/XIsWIOk/7FG4HoV7nkA11CgkmVXlPwAAAAAAfJ5AP8QGCydpwD8UrkfhenyeQNDRqpZ0lOQ/AAAAAAB9nkDmz7cFS3XkP+xRuB6FfZ5Ag1FJnYAm0T8AAAAAAH6eQPFmDd5X5d8/FK5H4Xp+nkD59q5BX3rVPwAAAAAAf55AS6yMRj6v2D/sUbgehX+eQPOv5ZXrbeo/AAAAAACAnkB/3H75ZMXgPxSuR+F6gJ5Arrw/OWXJtz8AAAAAAIGeQCf6fJQRl+g/7FG4HoWBnkAH0O/7Ny/qPwAAAAAAgp5A1h9hGLDk2D8UrkfheoKeQAzNdRppqec/AAAAAACDnkDOiNLe4AvtP+xRuB6Fg55AsmMjEK/r5j8AAAAAAISeQKkSZW8p59Y/FK5H4XqEnkCfmFAcm3i2PwAAAAAAhZ5ADmlU4GSb5j/sUbgehYWeQKLtmLorO+g/AAAAAACGnkCDhv4JLlaEPxSuR+F6hp5ALqnaboJv1j8AAAAAAIeeQJzAdFq3QeA/7FG4HoWHnkDUjiyqj9G1PwAAAAAAiJ5Ap60RwTi41T8UrkfheoieQBRZayi1F9I/AAAAAACJnkAQeGAA4cPmP+xRuB6FiZ5AeXWOAdnr4z8AAAAAAIqeQP3W89oR860/FK5H4XqKnkAk0jb+RGXaPwAAAAAAi55AiujX1k//5T/sUbgehYueQGCrBIvDmek/AAAAAACMnkCyDdyBOmXkPxSuR+F6jJ5AN+VEmvw/bD8AAAAAAI2eQGX9ZmK6EJs/7FG4HoWNnkA6o/fXPFisPwAAAAAAjp5AbOun/6z54z8Urkfheo6eQA/wpIXLKtI/AAAAAACPnkBjJlEv+LTqP+xRuB6Fj55ACVG+oIUE2j8AAAAAAJCeQJJaKJmc2uc/FK5H4XqQnkD9hR4xeu7qPwAAAAAAkZ5AyR8MPPce4T/sUbgehZGeQEM6PITx08Q/AAAAAACSnkBiSiTRyyjaPxSuR+F6kp5AMZkqGJXU1D8AAAAAAJOeQMGopE5AE9c/7FG4HoWTnkDzyvW2mQrDPwAAAAAAlJ5A/3dEhepm7z8UrkfhepSeQObo8Xub/tU/AAAAAACVnkB9BWnGoundP+xRuB6FlZ5A8YRefxKf5z8AAAAAAJaeQEAziA/s+NY/FK5H4XqWnkCmlDp1o5eCPwAAAAAAl55ALh9JSQ9D1j/sUbgehZeeQFdjZCTWPZ0/AAAAAACYnkACKhxBKsXOPxSuR+F6mJ5A0uC2tvC8zj8AAAAAAJmeQHvBpzl5keI/7FG4HoWZnkBB176AXjjtPwAAAAAAmp5A0jdpGhTN7z8UrkfhepqeQAGiYMYUrNI/AAAAAACbnkCMTSuFQK7vP+xRuB6Fm55AHTnSGRh52j8AAAAAAJyeQEDBxYoazOw/FK5H4XqcnkBK0F/oEaPHPwAAAAAAnZ5A1v1jIToE0j/sUbgehZ2eQKpIhbGFIME/AAAAAACenkCs4LchxuvrPxSuR+F6np5A8gpET8qk6T8AAAAAAJ+eQBVVv9L58OE/7FG4HoWfnkBY42w6ArjNPwAAAAAAoJ5AxGD+Cpmr4D8UrkfheqCeQJJc/kP67cE/AAAAAAChnkDqswOuK2bfP+xRuB6FoZ5AVlzB2yhXuT8AAAAAAKKeQKwCtRg8TOE/FK5H4XqinkBfuHNhpJfjPwAAAAAAo55A84++SdMg7j/sUbgehaOeQHpyTYHMTuM/AAAAAACknkCp9ul4zEDmPxSuR+F6pJ5ApcACmDJw5z8AAAAAAKWeQAd8fhghPOA/7FG4HoWlnkCgwabOo+LfPwAAAAAApp5A4xsKn62DwT8UrkfheqaeQAbaHVIMEOI/AAAAAACnnkDVdhN803TqP+xRuB6Fp55ApvELryR51T8AAAAAAKieQIjyBS0kYOg/FK5H4XqonkBU5BBxcyrdPwAAAAAAqZ5ASPsfYK3a7j/sUbgehameQCr/Wl653uc/AAAAAACqnkCh1jTvOEXJPxSuR+F6qp5APnrDfeRW5j8AAAAAAKueQHb/WIgOgdc/7FG4HoWrnkByjGSPUDPnPwAAAAAArJ5AsMbZdARw6j8UrkfheqyeQB0dVyO70u4/AAAAAACtnkDd6c4Tz1nvP+xRuB6FrZ5AAwr19BH44j8AAAAAAK6eQBam7zUEx+Y/FK5H4XqunkBUceMW83PvPwAAAAAAr55At7bwvFRs2T/sUbgeha+eQLM/UG7b99I/AAAAAACwnkDHEtbG2IntPxSuR+F6sJ5A3+ALk6mC7D8AAAAAALGeQNvAHahTHuo/7FG4HoWxnkBhNCvbhzzvPwAAAAAAsp5AzeUGQx1W5D8UrkfherKeQO4h4Xt/g+w/AAAAAACznkDPu7GgMCjsP+xRuB6Fs55ABUaoY99fsD8AAAAAALSeQDZ0sz9Q7uQ/FK5H4Xq0nkBf8GlOXmTSPwAAAAAAtZ5AECGunL0z4z/sUbgehbWeQJ2gTQ6fdNE/AAAAAAC2nkCsqME0DB/rPxSuR+F6tp5AsRnggmzZ6z8AAAAAALeeQLe3W5ID9uc/7FG4HoW3nkBEherm4u/qPwAAAAAAuJ5AyAp+G2I87j8UrkfherieQDHSi9r9Kt4/AAAAAAC5nkDb+uk/a37QP+xRuB6FuZ5A4GdcOBCS3D8AAAAAALqeQD83NGWnH98/FK5H4Xq6nkDWpxyTxf3rPwAAAAAAu55AZHeBkgIL1D/sUbgehbueQNOkFHR7SdA/AAAAAAC8nkCTNeohGl3hPxSuR+F6vJ5AJCpUNxd/vz8AAAAAAL2eQKq2m+CbJuk/7FG4HoW9nkD4iJgSSfTuPwAAAAAAvp5AGuw84HDVrz8Urkfher6eQGg9fJkoQuo/AAAAAAC/nkD5LqUuGcfaP+xRuB6Fv55AQE0tW+uL3z8AAAAAAMCeQAwiUtMupuw/FK5H4XrAnkCf5uRFJuC/PwAAAAAAwZ5AJTSTuUPUtj/sUbgehcGeQAn6Cz1idOs/AAAAAADCnkDww0FClC/KPxSuR+F6wp5ADCB8KNGSxz8AAAAAAMOeQLtgcM0d/e4/7FG4HoXDnkBf61Ij9DPnPwAAAAAAxJ5A+ptQiIBD6j8UrkfhesSeQK2cYnpnWaA/AAAAAADFnkA2I4PcRZjiP+xRuB6FxZ5AiUFg5dAi3T8AAAAAAMaeQC4e3nNgueA/FK5H4XrGnkCiRbbz/dTSPwAAAAAAx55A6Po+HCRE5z/sUbgehceeQCXs20lE+OU/AAAAAADInkC0cP7LWq+ePxSuR+F6yJ5AorPMIhRb6z8AAAAAAMmeQFNA2v8A6+I/7FG4HoXJnkDQO1/96VC1PwAAAAAAyp5AObaeIRyzzD8UrkfhesqeQMWOxqF+F94/AAAAAADLnkARAYdQpWa7P+xRuB6Fy55AtcGJ6NfW3D8AAAAAAMyeQBUZHZCE/e0/FK5H4XrMnkBQcodNZObMPwAAAAAAzZ5AlugsswjF7D/sUbgehc2eQAVpxqLp7NY/AAAAAADOnkDKiAtAo/TlPxSuR+F6zp5A9+Y3TDRI6j8AAAAAAM+eQFFqL6LtmOU/7FG4HoXPnkAzh6QWSibqPwAAAAAA0J5AOwFNhA1P2T8UrkfhetCeQDawVYLF4d4/AAAAAADRnkAUsvM2NrvqP+xRuB6F0Z5A3GeVmdJ66T8AAAAAANKeQH6QZcHEH7U/FK5H4XrSnkCiuONNfgvvPwAAAAAA055AKbAApgyc5j/sUbgehdOeQEyndRvUftA/AAAAAADUnkD9BcyNM5etPxSuR+F61J5Ah1J7EW3H4j8AAAAAANWeQPm6DP/pBt0/7FG4HoXVnkBWD5iHTPnkPwAAAAAA1p5AILJIE+8A0z8UrkfhetaeQIs4nWSry+Q/AAAAAADXnkCJ00m2upzSP+xRuB6F155A/nvw2qUNvz8AAAAAANieQBhDOdGuQt4/FK5H4XrYnkCTHoZWJ2fEPwAAAAAA2Z5A7UeKyLCK6D/sUbgehdmeQPLqHAOy1+A/AAAAAADankBcBMb6BibqPxSuR+F62p5ATS8xlumX6T8AAAAAANueQJrRj4ZT5uI/7FG4HoXbnkAQO1PovMauPwAAAAAA3J5AWtpnnQobUj8UrkfhetyeQDgQkgVM4Ns/AAAAAADdnkCVKeYg6GjkP+xRuB6F3Z5AwSeMHNjgpz8AAAAAAN6eQFjjbDoCuNc/FK5H4XrenkBTl4xjJPvjPwAAAAAA355A+rMfKSLDwj/sUbgehd+eQKSK4lXWNug/AAAAAADgnkD0qPi/I6rlPxSuR+F64J5A+Wncm98w6D8AAAAAAOGeQKKakqzD0e8/7FG4HoXhnkDCFyZTBSPvPwAAAAAA4p5ALc4Y5gTt4j8UrkfheuKeQPCGNCpwMuo/AAAAAADjnkD3ViQmqOHlP+xRuB6F455AzjY3pies6j8AAAAAAOSeQEVI3c6+8t4/FK5H4XrknkB63/jaM8vuPwAAAAAA5Z5ACVG+oIUE2D/sUbgeheWeQBdGelG73+4/AAAAAADmnkDmywuwj07aPxSuR+F65p5ALSeh9IWQ3D8AAAAAAOeeQChHAaJgxtU/7FG4HoXnnkD+Q/rt68DTPwAAAAAA6J5AIVZ/hGFA6D8UrkfheuieQEYnS633G+c/AAAAAADpnkCp3a8CfLfdP+xRuB6F6Z5AIxYx7DCm6D8AAAAAAOqeQB6ILNLEO8Q/FK5H4XrqnkAqkUQvo1jkPwAAAAAA655AKH6MuWsJ0D/sUbgeheueQMx+3enOE8c/AAAAAADsnkADste7P17gPxSuR+F67J5Af6SIDKt47z8AAAAAAO2eQM4bJ4V5D+c/7FG4HoXtnkCrWz0nvW/XPwAAAAAA7p5AlpLlJJS+1D8Urkfheu6eQIielEkNbe8/AAAAAADvnkBJ88e0No3HP+xRuB6F755AHNDSFWyj7T8AAAAAAPCeQCOD3EWYotY/FK5H4XrwnkBe8j/5u3fcPwAAAAAA8Z5Ad4L917np5z/sUbgehfGeQDTY1HlUfOo/AAAAAADynkD/lZUmpSDmPxSuR+F68p5AglZgyOpWuz8AAAAAAPOeQNT3dTtWhLQ/7FG4HoXznkA+JlKazePvPwAAAAAA9J5ABlyhWSPMsD8UrkfhevSeQFOynITSF94/AAAAAAD1nkAg0m9fB87JP+xRuB6F9Z5A12mkpfJ2xj8AAAAAAPaeQC0mNh/XhuQ/FK5H4Xr2nkDcZirEI/HrPwAAAAAA955AZd8Vwf/W4j/sUbgehfeeQKUUdHtJY+M/AAAAAAD4nkCxhovc09XQPxSuR+F6+J5AKqc9JefE7T8AAAAAAPmeQI2ar5KP3eI/7FG4HoX5nkBPBHEeTuDrPwAAAAAA+p5AAmN9A5Mb2z8UrkfhevqeQJoLXB5rRtw/AAAAAAD7nkBV2XdF8D/uP+xRuB6F+55AVkRN9Pko4j8AAAAAAPyeQPvOL0rQ3+M/FK5H4Xr8nkCWBn5Uw/7tPwAAAAAA/Z5AvvVhvVErzj/sUbgehf2eQH8XtmYrL9A/AAAAAAD+nkB9sffii/bhPxSuR+F6/p5AFR40u+6t0z8AAAAAAP+eQHTqymd5HtI/7FG4HoX/nkAQzNHj9zbuPwAAAAAAAJ9ABeM7jKQ4sj8UrkfhegCfQE0QdR+A1OY/AAAAAAABn0BhcTjzqzntP+xRuB6FAZ9ARpbMsbyrrj8AAAAAAAKfQFjk1w+xQeI/FK5H4XoCn0Akm6vmOSLNPwAAAAAAA59AU+xoHOp36T/sUbgehQOfQBcoKbAAJuk/AAAAAAAEn0BFoPoHkQy5PxSuR+F6BJ9ABMb6Bia35D8AAAAAAAWfQLH7juGxn9o/7FG4HoUFn0DSxaaVQqDoPwAAAAAABp9AkIe+u5Ul1z8UrkfhegafQKZG6Gfqdck/AAAAAAAHn0BiLqnaboLhP+xRuB6FB59A+YctPZrq4T8AAAAAAAifQB9kWTDxR+Q/FK5H4XoIn0Dle0YiNIK9PwAAAAAACZ9AF87aEl4nuD/sUbgehQmfQPSLEvQXesA/AAAAAAAKn0BihsYTQZzrPxSuR+F6Cp9AoxxxbU1flD8AAAAAAAufQL+5v3rct+s/7FG4HoULn0DQl97+XDTVPwAAAAAADJ9AwQEtXcG24T8UrkfhegyfQKQZi6azk8U/AAAAAAANn0BWKT3TS4zvP+xRuB6FDZ9AX5fhP91A3T8AAAAAAA6fQFZ9rrZi/+Y/FK5H4XoOn0APQ6uTM5ToPwAAAAAAD59A0QMfgxWn0T/sUbgehQ+fQGlfLwOExaM/AAAAAAAQn0Ddek0PCkrWPxSuR+F6EJ9AfAqA8Qya5j8AAAAAABGfQC2xMhr5POQ/7FG4HoURn0CE2JlC5zXvPwAAAAAAEp9A2+BE9Gvruz8UrkfhehKfQOPD7GXbabE/AAAAAAATn0DYD7HBwknKP+xRuB6FE59AnyEcs+xJ2z8AAAAAABSfQM/4vrhUJe4/FK5H4XoUn0B6UbtfBXjkPwAAAAAAFZ9AW3475MFxrD/sUbgehRWfQHMqGQCquNU/AAAAAAAWn0BrZFdaRmrqPxSuR+F6Fp9ALbDHREqzwT8AAAAAABefQHpQUIpWbu0/7FG4HoUXn0AVPIVcqefqPwAAAAAAGJ9AwvuqXKj87z8UrkfhehifQNjTDn9N1uM/AAAAAAAZn0DCZLLRnGlwP+xRuB6FGZ9ArOEi93R17j8AAAAAABqfQDeLFwtD5Og/FK5H4Xoan0Do9pLGaB3FPwAAAAAAG59Aq5MzFHe8wT/sUbgehRufQIUn9PqT+N8/AAAAAAAcn0BRirGneLe1PxSuR+F6HJ9A3uhjPiDQ1D8AAAAAAB2fQBtGQfD49uc/7FG4HoUdn0BqiCr8Gd7mPwAAAAAAHp9AgQpHkEox4z8Urkfheh6fQIBjz57LVOA/AAAAAAAfn0C78IPzqePoP+xRuB6FH59ApN5TOe2p5j8AAAAAACCfQHkgskgT7+w/FK5H4Xogn0CbjZWYZ6XhPwAAAAAAIZ9AHqUSntBr7D/sUbgehSGfQJUsJ6H0hdg/AAAAAAAin0CIug9AahPfPxSuR+F6Ip9An3djQWFQ2D8AAAAAACOfQL0d4bTgRcE/7FG4HoUjn0ADBd7Jp0flPwAAAAAAJJ9AxvmbUIgA6z8UrkfheiSfQHJPV3csttA/AAAAAAAln0CwAny3eePZP+xRuB6FJZ9AAB+8dmnD6z8AAAAAACafQE0QdR+A1O4/FK5H4Xomn0Be/TPesTOoPwAAAAAAJ59A3UCBd/Lp5j/sUbgehSefQDXTvU7qy+0/AAAAAAAon0BTr1sExvrSPxSuR+F6KJ9AkJYUaSyrpj8AAAAAACmfQDSg3oyar74/7FG4HoUpn0AfuTXptsTgPwAAAAAAKp9AKGTnbWz27z8UrkfheiqfQImXp3NFKew/AAAAAAArn0AOhjqscMvpP+xRuB6FK59Ayol2FVL+6D8AAAAAACyfQH2tS43Qz9k/FK5H4Xosn0CfdY2WAz3QPwAAAAAALZ9AHuBJC5fV5z/sUbgehS2fQBEBh1ClZuQ/AAAAAAAun0AYzF8hc2XSPxSuR+F6Lp9A5ueGpux06D8AAAAAAC+fQA8KStHKveA/7FG4HoUvn0DVWpiFds7gPwAAAAAAMJ9A2o8UkWGV5z8UrkfhejCfQEuohTcQN6w/AAAAAAAxn0ATtp+M8WHfP+xRuB6FMZ9AKuW1ErrL7T8AAAAAADKfQG9JDtjV5NE/FK5H4Xoyn0A9CtejcL3vPwAAAAAAM59AZjOHpBZK0z/sUbgehTOfQErwhjQqcLQ/AAAAAAA0n0CimLwBZr6zPxSuR+F6NJ9A4IEBhA8l1j8AAAAAADWfQP1P/u4dNes/7FG4HoU1n0CHU+bmG9HFPwAAAAAANp9AnpW04hsK4z8UrkfhejafQMPX17rUCMU/AAAAAAA3n0DDuYYZGk/sP+xRuB6FN59A1dAGYAMi3j8AAAAAADifQOAUViqoqOc/FK5H4Xo4n0CGPIIbKVvIPwAAAAAAOZ9AOey+Y3hs4T/sUbgehTmfQGpN845T9O8/AAAAAAA6n0DxDYXP1sHZPxSuR+F6Op9Als/yPLg71z8AAAAAADufQE7QJodPOr0/7FG4HoU7n0A7qpog6r7mPwAAAAAAPJ9Aa0lHOZhNyj8UrkfhejyfQBw/VBoxs+o/AAAAAAA9n0BqEyf3OxTJP+xRuB6FPZ9AXALwT6kS0j8AAAAAAD6fQFwhrMYSVuc/FK5H4Xo+n0DQ9ypkdGFwPwAAAAAAP59AwCSVKeYg1T/sUbgehT+fQOHUB5J3DsE/AAAAAABAn0A4SfPHtDblPxSuR+F6QJ9Ams+52/XS4z8AAAAAAEGfQLt7gO7Lmd0/7FG4HoVBn0DoRv2aUZiyPwAAAAAAQp9AI2k3+pgP1D8UrkfhekKfQP58W7BUF+Q/AAAAAABDn0Dfpj/7kSLCP+xRuB6FQ59AUS0iiskb3z8AAAAAAESfQEROX8/XLOo/FK5H4XpEn0B0QuigSzjsPwAAAAAARZ9AyR6hZkgV4T/sUbgehUWfQEsjZvZ5jOM/AAAAAABGn0BYWwx5X/C2PxSuR+F6Rp9A1CmPboRF7z8AAAAAAEefQHiAJy1cVs0/7FG4HoVHn0ANqg1ORD/sPwAAAAAASJ9A6/1GO2547z8UrkfhekifQBxfe2ZJAOM/AAAAAABJn0C/KEF/oUfsP+xRuB6FSZ9APwJ/+Pnv2T8AAAAAAEqfQKTjamRXWtA/FK5H4XpKn0DxuRPsv869PwAAAAAAS59AtTaN7bWgxT/sUbgehUufQALU1LK1Pu8/AAAAAABMn0ALem8MAUDvPxSuR+F6TJ9Aj3hoDv+fmT8AAAAAAE2fQBiUaTS5GNE/7FG4HoVNn0DpJ5zdWibBPwAAAAAATp9A2XvxRXs85j8Urkfhek6fQGzp0VRP5u4/AAAAAABPn0D5npEIjeDlP+xRuB6FT59Abtxifm5o1D8AAAAAAFCfQL1uERjrG+o/FK5H4XpQn0AW+mAZG7rYPwAAAAAAUZ9ATgmISbgQ5D/sUbgehVGfQI3FgDaDCaU/AAAAAABSn0Bt/l915MjgPxSuR+F6Up9AFmwjnuxm5T8AAAAAAFOfQNC1L6AX7uo/7FG4HoVTn0C+ZyRCI9jpPwAAAAAAVJ9AwCMqVDeX7z8UrkfhelSfQEcAN4sXi+g/AAAAAABVn0DZB1kWTPzUP+xRuB6FVZ9AYK5FC9C22T8AAAAAAFafQIDz4sRXO8o/FK5H4XpWn0CTOZZ31QPYPwAAAAAAV59AuOUjKelh7T/sUbgehVefQDZc5J6u7to/AAAAAABYn0DvrN12obnZPxSuR+F6WJ9AlIlbBTHQ7T8AAAAAAFmfQGcng6PkVeo/7FG4HoVZn0CjVpi+1xDpPwAAAAAAWp9A/Z/DfHmB6T8UrkfhelqfQIWxhSAHJeg/AAAAAABbn0B798d71crEP+xRuB6FW59AX9Gt1/Sg7T8AAAAAAFyfQMIVUKinj+4/FK5H4Xpcn0DMKmwGuKDtPwAAAAAAXZ9AnZs24zTE7z/sUbgehV2fQBdky/J1Ge0/AAAAAABen0COsn4zMV3fPxSuR+F6Xp9AeLMG76tyqT8AAAAAAF+fQP/KSpNS0Mk/7FG4HoVfn0B6HXHIBtLVPwAAAAAAYJ9ALzIBv0aS4T8UrkfhemCfQGZrfZHQlto/AAAAAABhn0CJqxRMRt+yP+xRuB6FYZ9A2gxHwoTyaj8AAAAAAGKfQAFHp1PDI54/FK5H4Xpin0B2G9R+ayfMPwAAAAAAY59AR8hAnl2+7j/sUbgehWOfQJ0rSgnBKuQ/AAAAAABkn0C9UwH3PP/mPxSuR+F6ZJ9AS3UBLzNswD8AAAAAAGWfQLa5MT1hCe8/7FG4HoVln0Ajh4ibU8nkPwAAAAAAZp9ATrSrkPIT5j8UrkfhemafQPUsCOV9HNg/AAAAAABnn0CQSrGjcSjnP+xRuB6FZ59ANh/Xhopxwj8AAAAAAGifQPJAZJEmXuk/FK5H4Xpon0ASa/EpAMbTPwAAAAAAaZ9AWivaHOc24D/sUbgehWmfQA3gLZCg+Ow/AAAAAABqn0CWsaGb/YHbPxSuR+F6ap9A9u6P96qV3D8AAAAAAGufQKvRqwFKQ90/7FG4HoVrn0DONczQeCLiPwAAAAAAbJ9At7QaEvdY4D8UrkfhemyfQKqc9pSck+k/AAAAAABtn0AtBg/TvrnuP+xRuB6FbZ9ABYwubw7X5T8AAAAAAG6fQMXGvI44ZOs/FK5H4Xpun0CjI7n8h3TiPwAAAAAAb59AfhmMEYlC2j/sUbgehW+fQPerAN9t3u4/AAAAAABwn0DVBFH3AUidPxSuR+F6cJ9Aza0QVmMJ7D8AAAAAAHGfQGq932jHje4/7FG4HoVxn0Dtt3aiJCTrPwAAAAAAcp9AhSUeUDbl3j8UrkfhenKfQMtMaf0tAeo/AAAAAABzn0D7rDJTWn/ZP+xRuB6Fc59A7bnpIsfOgj8AAAAAAHSfQCRh304iQus/FK5H4Xp0n0CSrS6nBETiPwAAAAAAdZ9ASS9q96sA3T/sUbgehXWfQGjmyTUFsu0/AAAAAAB2n0CRnEzcKojhPxSuR+F6dp9AbqRskbQb5z8AAAAAAHefQKGd0yzQbuw/7FG4HoV3n0CwOQfPhCbfPwAAAAAAeJ9AxQQ1fAvr6z8UrkfhenifQP0Ux4FXy+c/AAAAAAB5n0B0eXO4VvvuP+xRuB6FeZ9AHooCfSJP4z8AAAAAAHqfQBYVcTrJVus/FK5H4Xp6n0DHYkCbwYSePwAAAAAAe59AcLTjht9N4j/sUbgehXufQNx++WTFcJ0/AAAAAAB8n0CeNYmL7f+VPxSuR+F6fJ9A1NFxNbKr4j8AAAAAAH2fQMfyrnrAvOU/7FG4HoV9n0CkF7X7VYDmPwAAAAAAfp9AIqZEEr0M6T8Urkfhen6fQBWL3xRWKtI/AAAAAAB/n0CfWKfK9wzvP+xRuB6Ff59AqyFxj6UP4D8AAAAAAICfQAAAAAAAAMQ/FK5H4XqAn0Chn6nXLQLVPwAAAAAAgZ9AGejaF9AL7j/sUbgehYGfQOWitf2G5K8/AAAAAACCn0A5RNycSgbuPxSuR+F6gp9Af9sTJLY75T8AAAAAAIOfQGWKOQg6WuY/7FG4HoWDn0BkzF1LyAfgPwAAAAAAhJ9AdqT6zi9K6D8UrkfheoSfQHImtzcJ77A/AAAAAACFn0AMHqZ9c3/RP+xRuB6FhZ9AMQvtnGaB4z8AAAAAAIafQLWHvVDAdtQ/FK5H4XqGn0DIJ2TnbWzqPwAAAAAAh59ANtFCXf8JtT/sUbgehYefQOi8xi5Rveg/AAAAAACIn0BUc7nBUIfvPxSuR+F6iJ9A73VSX5Z22T8AAAAAAImfQDEnaJPDJ+k/7FG4HoWJn0BBCwkYXd7TPwAAAAAAip9AnYAmwoan1z8UrkfheoqfQKmG/Z5Yp8g/AAAAAACLn0AMzuDvF7PfP+xRuB6Fi59Aw5/hzRq82D8AAAAAAIyfQBcplIWvr+E/FK5H4XqMn0DUnSeeswXePwAAAAAAjZ9Af6SIDKt44j/sUbgehY2fQLEzhc5r7MQ/AAAAAACOn0Dw+WGE8OjkPxSuR+F6jp9AbeNPVDas3D8AAAAAAI+fQOOmBprPudU/7FG4HoWPn0DEQq1p3nHAPwAAAAAAkJ9Apb4s7dTc7D8UrkfhepCfQOIi93R1x8w/AAAAAACRn0C9FpklprCfP+xRuB6FkZ9AfT7KiAtAxT8AAAAAAJKfQItUGFsIcuU/FK5H4XqSn0CoxHWMKy7lPwAAAAAAk59As2Dij6JO4j/sUbgehZOfQNrlWx/WG+I/AAAAAACUn0D7B5EMObbOPxSuR+F6lJ9A8o6dAT/0jj8AAAAAAJWfQPBN02cHXNc/7FG4HoWVn0DIztvY7MjgPwAAAAAAlp9ARZ+PMuIC4D8UrkfhepafQBP0F3rEaOM/AAAAAACXn0CEfqZetwjfP+xRuB6Fl59AxVVl3xXB1D8AAAAAAJifQJQxPsxets0/FK5H4XqYn0AVNgNckC3UPwAAAAAAmZ9AjIF1HD9UzD/sUbgehZmfQOjYQSWuY8Y/AAAAAACan0B7TKQ0m8fmPxSuR+F6mp9A+MQ6Vb5n7D8AAAAAAJufQHkhHR7CeO8/7FG4HoWbn0BvoMA7+fTpPwAAAAAAnJ9AC5jArbt5wD8UrkfhepyfQC6RC87g79g/AAAAAACdn0Cuug7VlOTvP+xRuB6FnZ9ADUIvkiwWoT8AAAAAAJ6fQLFR1m8mpus/FK5H4Xqen0D7sN6oFabpPwAAAAAAn59A2lNyTuyh5T/sUbgehZ+fQFvSUQ5mk+o/AAAAAACgn0BSLLe0GhLDPxSuR+F6oJ9AwmwCDMuf4T8AAAAAAKGfQJOnrKbridw/7FG4HoWhn0A8AD1o0ZaOPwAAAAAAop9AGf7TDRT47j8UrkfheqKfQKa4quy7ItU/AAAAAACjn0B2M6MfDafXP+xRuB6Fo59AHk/LD1xl7j8AAAAAAKSfQBqIZTOHJOU/FK5H4Xqkn0AKvf4kPvflPwAAAAAApZ9ApMSu7e2Wwj/sUbgehaWfQPEtrBvvjuw/AAAAAACmn0DLaU/JObHdPxSuR+F6pp9Am/9XHTnS4T8AAAAAAKefQFBxHHi1XO8/7FG4HoWnn0AFwePbuwbQPwAAAAAAqJ9AnfLoRlhU1z8UrkfheqifQIfhI2JKJNI/AAAAAACpn0Dv6xvzlZu1P+xRuB6FqZ9AcO6vHvct7j8AAAAAAKqfQFAYlGk0ucg/FK5H4Xqqn0DY8V8gCJDNPwAAAAAAq59A8fYgBOTL7T/sUbgehaufQD9xAP2+f+U/AAAAAACsn0BdNc8R+S7hPxSuR+F6rJ9AclMDzefc2z8AAAAAAK2fQHlb6bXZWNo/7FG4HoWtn0DYutQI/czvPwAAAAAArp9A4A8//z144j8Urkfheq6fQIrKhjWVReE/AAAAAACvn0CPG3433bLcP+xRuB6Fr59AtMu3Pqw3wj8AAAAAALCfQBgkfVpFf+E/FK5H4Xqwn0BKCFbVy+/iPwAAAAAAsZ9A/P7NixPf7z/sUbgehbGfQDZ39L9ci+A/AAAAAACyn0BmEvWCT3PfPxSuR+F6sp9Am1d1Vgvs5j8AAAAAALOfQDf+RGXDmtE/7FG4HoWzn0DfMTz2s1jpPwAAAAAAtJ9A31M57Sk5zz8UrkfherSfQGvXhLTGoOA/AAAAAAC1n0Boyk4/qAvsP+xRuB6FtZ9AO8JpwYu+1j8AAAAAALafQMO5hhkaT+0/FK5H4Xq2n0Amp3aGqS3gPwAAAAAAt59Aa7jIPV3d2T/sUbgehbefQHQprir7Lu4/AAAAAAC4n0CAft+/eXHCPxSuR+F6uJ9AAmISLuQR2j8AAAAAALmfQIYcW88Qjss/7FG4HoW5n0BMqODwgojIPwAAAAAAup9A9l580R6v4z8UrkfherqfQMcS1sbYCeM/AAAAAAC7n0A4g79fzJbZP+xRuB6Fu59ARE5fz9cs7j8AAAAAALyfQK8Hk+Ljk+I/FK5H4Xq8n0AkXp7OFaW8PwAAAAAAvZ9Ag8KgTKPJ0T/sUbgehb2fQGaGjbJ+M8U/AAAAAAC+n0C0keumlNfKPxSuR+F6vp9A860P643a4D8AAAAAAL+fQDHT9q+stO4/7FG4HoW/n0B8D5ccd0rFPwAAAAAAwJ9Ac0wW9x+Z1D8UrkfhesCfQKjDCrd8JNM/AAAAAADBn0C9qN2vAvzsP+xRuB6FwZ9AKH/3jhoT4D8AAAAAAMKfQLgxh+6jZKM/FK5H4XrCn0BWYp6VtOLrPwAAAAAAw59Am+PcJtyr4z/sUbgehcOfQDM2dLM/UNw/AAAAAADEn0DOst3zstysPxSuR+F6xJ9Ahq3Zykv+7T8AAAAAAMWfQLMJMCx/vtA/7FG4HoXFn0AnRAqvbgapPwAAAAAAxp9A1ZelnZrL4T8UrkfhesafQF7WxAJfUes/AAAAAADHn0AwgzEiUWjUP+xRuB6Fx59A0RLYWmeVbD8AAAAAAMifQDiFlQoqKuE/FK5H4XrIn0D9v+rIkc7TPwAAAAAAyZ9A73Tniefs4z/sUbgehcmfQFCKVu4FZs8/AAAAAADKn0Bx5IHIIs3jPxSuR+F6yp9AijfX1YlwiD8AAAAAAMufQLiVXpuNldM/7FG4HoXLn0A+PEuQEVDLPwAAAAAAzJ9ACHO7l/vkzD8UrkfhesyfQLPPY5Rn3u0/AAAAAADNn0AfwH148dm1P+xRuB6FzZ9Ac2iR7Xw/5D8AAAAAAM6fQNLlzeFa7dw/FK5H4XrOn0Dkg57Nqs/LPwAAAAAAz59AHjUmxFzS5j/sUbgehc+fQO+P96qVCck/AAAAAADQn0Dc9dIUAU7uPxSuR+F60J9AQIf58gJs6T8AAAAAANGfQF/ObFfog8s/7FG4HoXRn0DxSScSTDXRPwAAAAAA0p9Af/eOGhNi6T8UrkfhetKfQNC2mnXG98s/AAAAAADTn0BMVdriGp/hP+xRuB6F059AUDS0ph4OsT8AAAAAANSfQOo8Kv7viOo/FK5H4XrUn0BRMc7fhELRPwAAAAAA1Z9AAB+8dmlD6j/sUbgehdWfQOQPBp57D+k/AAAAAADWn0AZOKClK9i6PxSuR+F61p9A628JwD+lzj8AAAAAANefQNlfdk8eFtI/7FG4HoXXn0DV6NUApaHaPwAAAAAA2J9AZ341Bwjm4T8UrkfhetifQAKaCBueXu8/AAAAAADZn0CWQ4ts53vsP+xRuB6F2Z9AAFeyYyMQuz8AAAAAANqfQLTjht9Nt+o/FK5H4Xran0BYO4pz1NHnPwAAAAAA259AMEllijkI5j/sUbgehdufQGula4GY37g/AAAAAADcn0Cuug7VlGTtPxSuR+F63J9Ad4L917lp2T8AAAAAAN2fQFTFVPoJ5+A/7FG4HoXdn0AOFHgnn57oPwAAAAAA3p9AigYpeAq5wD8Urkfhet6fQPw5BfnZyOc/AAAAAADfn0Bxx5v8Fp3iP+xRuB6F359AFVPpJ5xd7D8AAAAAAOCfQHoaMEj6tMw/FK5H4Xrgn0Af9GxWfS7hPwAAAAAA4Z9AqWqCqPuA7D/sUbgeheGfQJZEUfsIV7E/AAAAAADin0Ae4EkLl9XsPxSuR+F64p9AJ6JfWz/91D8AAAAAAOOfQLq9pDFaR+w/7FG4HoXjn0C+hXXj3ZHRPwAAAAAA5J9ASKeufJbnyz8UrkfheuSfQHDurx73re4/AAAAAADln0BortNIS+XaP+xRuB6F5Z9A0GG+vAD7wj8AAAAAAOafQDUIc7uX++8/FK5H4Xrmn0DFrYIY6FrtPwAAAAAA559AQj9Tr1uE7T/sUbgeheefQIEKR5BKMeA/AAAAAADon0ArMGR1q+fEPxSuR+F66J9AowT9hR6x6z8AAAAAAOmfQBMNUvAUctg/7FG4HoXpn0AAHebLCzDqPwAAAAAA6p9AzlFHx9VI4T8UrkfheuqfQOM2GsBbIMk/AAAAAADrn0C8P96rVibRP+xRuB6F659AyJkmbD8Zuz8AAAAAAOyfQP4qwHebt+Q/FK5H4Xrsn0BcAYV6+ojlPwAAAAAA7Z9AYvNxbaiY7z/sUbgehe2fQKw3aoXp++o/AAAAAADun0AogGJkyRzsPxSuR+F67p9AxjapaKz94D8AAAAAAO+fQFhwP+CBgeQ/7FG4HoXvn0C70jJS7ynuPwAAAAAA8J9AntMs0O6Q3z8UrkfhevCfQF4Ou+8YHuk/AAAAAADxn0D83xEVqpvNP+xRuB6F8Z9Ae/fHe9VK6z8AAAAAAPKfQFytE5fjFeo/FK5H4Xryn0C1No3ttaCnPwAAAAAA859A16axvRb00D/sUbgehfOfQANDVrd6zu8/AAAAAAD0n0A3IQjrWtasPxSuR+F69J9AEf5F0JhJ3j8AAAAAAPWfQPQc7KjFO7c/7FG4HoX1n0Dw7327NmWYPwAAAAAA9p9AYpaHloYrkT8UrkfhevafQO9Czla5q6Y/AAAAAAD3n0C78IPzqWPkP+xRuB6F959ALxfxnZj1yD8AAAAAAPifQN9RY0LMJe8/FK5H4Xr4n0Cy8zY2O1LHPwAAAAAA+Z9A9YJPc/Ii1j/sUbgehfmfQMqK4eoAiNg/AAAAAAD6n0Bmu0IfLGPtPxSuR+F6+p9AfF9cqtKW6j8AAAAAAPufQHY4ukp31+I/7FG4HoX7n0B4msx4W2nlPwAAAAAA/J9A2CrB4nDmzT8UrkfhevyfQCFblq/L8Nc/AAAAAAD9n0Bp4Ec17PfSP+xRuB6F/Z9ACTVDqihexT8AAAAAAP6fQKOx9ne2R+A/FK5H4Xr+n0B/g/bq4yHrPwAAAAAA/59A74/3qpUJyz/sUbgehf+fQGkCRSxi2Ms/AAAAAAAAoECHiQYpeArWPwrXo3A9AKBA2ZWWkXpP5T8AAAAAgACgQLA8SE+RQ+g/9ihcj8IAoEBHOC140dfvPwAAAAAAAaBAhzJUxVT65D8K16NwPQGgQKM9XkiHh+o/AAAAAIABoEC6v3rct9rgP/YoXI/CAaBAoDcVqTC25j8AAAAAAAKgQHDQXn089Os/CtejcD0CoEC9/bloyHi8PwAAAACAAqBA6q7sgsG15j/2KFyPwgKgQPbTf9b8eOY/AAAAAAADoECl2NE41O/fPwrXo3A9A6BA8RExJZLowz8AAAAAgAOgQDAS2nIuReU/9ihcj8IDoEAsoKsIktKfPwAAAAAABKBAO6sF9phI7j8K16NwPQSgQFxy3CkdrN8/AAAAAIAEoEAudvusMlPZP/YoXI/CBKBA7WZGPxpO6T8AAAAAAAWgQFGHFW75yOg/CtejcD0FoEA83uS36GTtPwAAAACABaBAMNgN2xZlnj/2KFyPwgWgQIoGKXgKue0/AAAAAAAGoECDE9GvrR/iPwrXo3A9BqBA3L3cJ0cB1D8AAAAAgAagQGGlgoqqX8c/9ihcj8IGoEBWvJF55A/gPwAAAAAAB6BAhZfg1AeSuz8K16NwPQegQDfEeM2rOt4/AAAAAIAHoECFzmvsEtXnP/YoXI/CB6BAQQ5KmGn72z8AAAAAAAigQMkgdxGmKNc/CtejcD0IoED8cfvlkxXiPwAAAACACKBAJEc6AyMv4D/2KFyPwgigQCpwsg3cgdY/AAAAAAAJoEAAUps4ud/QPwrXo3A9CaBA3Vz8bU8Q5T8AAAAAgAmgQBYwgVt389k/9ihcj8IJoEB/Tdaoh+jtPwAAAAAACqBAZqTeUznt1D8K16NwPQqgQM09JHzv7+c/AAAAAIAKoEAQejarPlfWP/YoXI/CCqBAUtFY+zvb7D8AAAAAAAugQIi6D0Bqk+s/CtejcD0LoECqmbUUkHbkPwAAAACAC6BAsI7jh0qj7T/2KFyPwgugQKYJ20/GeOg/AAAAAAAMoEBGJXUCmgjSPwrXo3A9DKBA5BQdyeU/1D8AAAAAgAygQM4ZUdobfN8/9ihcj8IMoEB4uB0aFqPgPwAAAAAADaBArFj8prBS6D8K16NwPQ2gQGaH+IctPeI/AAAAAIANoECYySavhKStP/YoXI/CDaBAwCSVKeag5D8AAAAAAA6gQADGM2jon84/CtejcD0OoEBMN4lBYOXiPwAAAACADqBAFHe8yW/RuT/2KFyPwg6gQDIBv0aSINU/AAAAAAAPoEDcaABvgYTtPwrXo3A9D6BA5zbhXpm34T8AAAAAgA+gQKTi/46oUNU/9ihcj8IPoEDXbOUl/5OjPwAAAAAAEKBArYcvE0VIyT8K16NwPRCgQP2FHjF6buo/AAAAAIAQoEA4wCcxY2WfP/YoXI/CEKBAsJEkCFdA3T8AAAAAABGgQOBIoMGmzrs/CtejcD0RoEDlCYSdYtXgPwAAAACAEaBAZvZ5jPJM7D/2KFyPwhGgQL6lnC/2Xtk/AAAAAAASoEDAtKhPcofJPwrXo3A9EqBARYR/ETRmzD8AAAAAgBKgQJuQ1hh0QtA/9ihcj8ISoEBTtHIvMCvTPwAAAAAAE6BAguUIGciz3j8K16NwPROgQKnAyTZwB8w/AAAAAIAToEAd5ssLsI/MP/YoXI/CE6BAWDhJ88e03z8AAAAAABSgQAJk6NhBJe8/CtejcD0UoEDNPSR872/KPwAAAACAFKBAiSR6GcVyvz/2KFyPwhSgQL+ByY0ia9s/AAAAAAAVoEB0Jm2q7pGlPwrXo3A9FaBAB84ZUdqb5z8AAAAAgBWgQKSMuAA0yuU/9ihcj8IVoECuYvGbwkrBPwAAAAAAFqBAuOnPfqSIxD8K16NwPRagQC13ZoLh3O4/AAAAAIAWoECY32ky423UP/YoXI/CFqBAZaa0/paA6D8AAAAAABegQMOedvhrsuo/CtejcD0XoEDDuYYZGs/qPwAAAACAF6BAhlrTvOMU2j/2KFyPwhegQPabielCrN8/AAAAAAAYoEBYq3ZNSGvtPwrXo3A9GKBADjLJyFnY1j8AAAAAgBigQCGyo8xhUrE/9ihcj8IYoECXyAVn8Pe3PwAAAAAAGaBA8BmJ0Ag23j8K16NwPRmgQDgsDfyohuA/AAAAAIAZoEDpfeNrz6zsP/YoXI/CGaBAbY5zm3Cv0D8AAAAAABqgQLRzmgXaHcw/CtejcD0aoECdK0oJwaruPwAAAACAGqBAUg5mE2BY2T/2KFyPwhqgQA9j0t9LYeA/AAAAAAAboEDGiEShZd3DPwrXo3A9G6BA3LxxUpj31z8AAAAAgBugQCWzeofbodA/9ihcj8IboEBt5SX/kz/lPwAAAAAAHKBA8ppXdVYL3D8K16NwPRygQLL2d7ZHb9M/AAAAAIAcoEAzMshdhCnKP/YoXI/CHKBABDxp4bKK5T8AAAAAAB2gQB6oUx7dCOM/CtejcD0doEBrEOZ2L/fNPwAAAACAHaBAcHfWbrvQ3D/2KFyPwh2gQHm404z7RbE/AAAAAAAeoEAhkiHH1jPGPwrXo3A9HqBAUduGURA8xj8AAAAAgB6gQM138BMH0NY/9ihcj8IeoEBE96xrtJzjPwAAAAAAH6BAdA0zNJ4I6D8K16NwPR+gQAbYR6eufN0/AAAAAIAfoEBP33w05r+xP/YoXI/CH6BAlBKCVfXy2T8AAAAAACCgQI0qw7gbROU/CtejcD0goEAY7lwY6UXcPwAAAACAIKBATHDqA8m75z/2KFyPwiCgQNdoOdBDbec/AAAAAAAhoEDvkjgroibbPwrXo3A9IaBAIPDAAMKH5D8AAAAAgCGgQIbj+QyoN68/9ihcj8IhoEAqqKj6lc7BPwAAAAAAIqBAGvonuFhRyz8K16NwPSKgQIeHMH4ad+Y/AAAAAIAioEC8WYP3VbnWP/YoXI/CIqBAmrUUkPY/7D8AAAAAACOgQLbZWIl51uo/CtejcD0joED7OnDOiNLQPwAAAACAI6BA/fPZph2jkT/2KFyPwiOgQI+M1eb/VeY/AAAAAAAkoEB7+gj84WfkPwrXo3A9JKBAoaF/gosVzz8AAAAAgCSgQOTXD7HBQus/9ihcj8IkoEB95xcl6K/hPwAAAAAAJaBAGan3VE572z8K16NwPSWgQO4hhsIMMrY/AAAAAIAloECeQUP/BBfUP/YoXI/CJaBAgV1NnrIa6D8AAAAAACagQIfddwyP/dU/CtejcD0moEA7G/LPDGLsPwAAAACAJqBA9FMcB14t4T/2KFyPwiagQGjsSzYebNE/AAAAAAAnoEDy0He3skTbPwrXo3A9J6BAhbAaS1gb0D8AAAAAgCegQGbAWUqWE+8/9ihcj8InoEBaEMr7OJrTPwAAAAAAKKBACMpt+x71hz8K16NwPSigQNnNjH40nMQ/AAAAAIAooEDX5e85C9aTP/YoXI/CKKBAms+52/VS6z8AAAAAACmgQBNFSN3OPug/CtejcD0poEASa/EpAEbqPwAAAACAKaBApaDbSxoj7D/2KFyPwimgQKA4gH7fv+w/AAAAAAAqoEAJUil2NI7lPwrXo3A9KqBA0ZSdflCX4z8AAAAAgCqgQPoq+dhdoOE/9ihcj8IqoEAdKRGX0umzPwAAAAAAK6BAyoy3lV6b3D8K16NwPSugQG6LMhtkkt4/AAAAAIAroEAjn1c89UjeP/YoXI/CK6BA9MDHYMWp2T8AAAAAACygQPeOGhNiLt4/CtejcD0soEC1xTU+k/3SPwAAAACALKBAm3CvzFt13T/2KFyPwiygQHtP5bSnZOk/AAAAAAAtoEAJh97i4T3oPwrXo3A9LaBAiA/s+C8Q4z8AAAAAgC2gQGHhJM0f094/9ihcj8ItoECM9nghHZ7jPwAAAAAALqBAxJPdzOjH5z8K16NwPS6gQOmBj8GKU94/AAAAAIAuoECw52uWy8bnP/YoXI/CLqBAF1ADYQISsD8AAAAAAC+gQMGtu3mqQ+0/CtejcD0voECEnziAft/pPwAAAACAL6BA0AoMWd3q5T/2KFyPwi+gQIPBNXf0v+w/AAAAAAAwoEA9m1Wfq63QPwrXo3A9MKBATwZHyatzsD8AAAAAgDCgQJRqn47HDNY/9ihcj8IwoEBblNkgk4zvPwAAAAAAMaBAZ2X7kLfc4j8K16NwPTGgQL1SliGOddw/AAAAAIAxoEBVL7/TZMbrP/YoXI/CMaBAzaylgLT/yT8AAAAAADKgQFn8prBSQeQ/CtejcD0yoEBcBMb6BibkPwAAAACAMqBA6Qq2EU/24T/2KFyPwjKgQIqryr4rgt8/AAAAAAAzoEAnZyjueJPdPwrXo3A9M6BAiQj/ImjM3j8AAAAAgDOgQFWjVwOUhso/9ihcj8IzoEDF4jeFlQrePwAAAAAANKBAb57qkJvh6T8K16NwPTSgQDKuuDgqN+w/AAAAAIA0oECyDkdX6e7gP/YoXI/CNKBAKa4q+64I1D8AAAAAADWgQOYhUz4EVeQ/CtejcD01oEDJTLOKSF6rPwAAAACANaBA73N8tDhj3z/2KFyPwjWgQIUn9PqT+Nc/AAAAAAA2oECh9fBlogjHPwrXo3A9NqBACcA/pUqU5D8AAAAAgDagQCMnuP2XELg/9ihcj8I2oEC5+xwfLU7mPwAAAAAAN6BAA5ZcxeK35T8K16NwPTegQNP4hVeSPNs/AAAAAIA3oECuKZDZWfTVP/YoXI/CN6BA2CyXjc757D8AAAAAADigQEBpqFFIMtc/CtejcD04oEAgX0IFhxe8PwAAAACAOKBAXgIBfAEHrj/2KFyPwjigQMXnTrD/OuY/AAAAAAA5oEC7C5QUWIDjPwrXo3A9OaBAz7pGy4Eevj8AAAAAgDmgQEqWk1D6QtQ/9ihcj8I5oEBUOlj/5zC7PwAAAAAAOqBAg4qqX+l83z8K16NwPTqgQDze5LfoZIk/AAAAAIA6oEBubkxPWGLnP/YoXI/COqBAkLxzKENV5T8AAAAAADugQML2kzE+zNw/CtejcD07oEApzlFHx9XVPwAAAACAO6BAY6V6GWJIYD/2KFyPwjugQH1BCwkY3ew/AAAAAAA8oEA9npYfuMrbPwrXo3A9PKBAe9rhr8ka7T8AAAAAgDygQD/pnzscuKI/9ihcj8I8oECQEOULWkjdPwAAAAAAPaBA0Xe3skRn6D8K16NwPT2gQEEQIEPHDtw/AAAAAIA9oECPVN/5RYntP/YoXI/CPaBAMnbCS3Dq4T8AAAAAAD6gQGyWy0bnfOk/CtejcD0+oEB24QfnU0fuPwAAAACAPqBA0y8Rb51/7T/2KFyPwj6gQHmSdM3km9c/AAAAAAA/oECbIOo+AKnPPwrXo3A9P6BAbm5MT1ji1j8AAAAAgD+gQH+/mC1ZFdo/9ihcj8I/oECpvYi2Y+rqPwAAAAAAQKBAnKc65Ga42j8K16NwPUCgQJ90IsFUM9I/AAAAAIBAoEC+aI8X0uHiP/YoXI/CQKBA+WcG8YEd1z8AAAAAAEGgQMfYCS/Bqb8/CtejcD1BoECw52uWy8buPwAAAACAQaBARL+2fvpP4j/2KFyPwkGgQDvHgOz1buo/AAAAAABCoEDLhjWVReHqPwrXo3A9QqBAyXN9Hw4S3z8AAAAAgEKgQM7BM6FJYsc/9ihcj8JCoECmRBK9jOLtPwAAAAAAQ6BAS6R+KOK+nz8K16NwPUOgQMhESrN5HLo/AAAAAIBDoEANHNDSFezkP/YoXI/CQ6BA0Iw0p4HVtz8AAAAAAESgQCHNWDSdHe0/CtejcD1EoECE8GjjiDXvPwAAAACARKBA+64I/rcS4T/2KFyPwkSgQKlOB7KeWu4/AAAAAABFoEALfEW3XtPBPwrXo3A9RaBA3xtDAHDsxT8AAAAAgEWgQISDvYkhOe8/9ihcj8JFoECJeOv822XdPwAAAAAARqBAoYLDCyJS3j8K16NwPUagQFG2kmeom6U/AAAAAIBGoEDFxryOOGTDP/YoXI/CRqBAv/IgPUUOzz8AAAAAAEegQI39G2rKBLg/CtejcD1HoECeJ56zBYTuPwAAAACAR6BAzA2GOqxw6T/2KFyPwkegQDoIOlrVkuk/AAAAAABIoEAWFAZlGk3iPwrXo3A9SKBAFTqvsUtUyT8AAAAAgEigQOUl/5O/e9Y/9ihcj8JIoEBd4V0u4jvNPwAAAAAASaBAscHCSZq/5T8K16NwPUmgQC8Whsjp6+o/AAAAAIBJoEAdlDDT9q/lP/YoXI/CSaBAeLgdGhaj0j8AAAAAAEqgQLGnHf6aLO8/CtejcD1KoEDD9L2G4LjcPwAAAACASqBAqhid4ifEtD/2KFyPwkqgQPzfERWqG+k/AAAAAABLoEAPfAxWnGrQPwrXo3A9S6BA5Zgs7j8yyz8AAAAAgEugQC9023S64qw/9ihcj8JLoEAPXru04TDhPwAAAAAATKBAAH/nzZfNpj8K16NwPUygQMqK4eoACOw/AAAAAIBMoEAEHEKVmj3GP/YoXI/CTKBAweEFEalp6T8AAAAAAE2gQNy93CdHgeo/CtejcD1NoEAykGeXb33OPwAAAACATaBAIjgu46YG0D/2KFyPwk2gQPMd/MQBdOM/AAAAAABOoEAiHLPsSeDqPwrXo3A9TqBA5SoWvyms3D8AAAAAgE6gQD19BP7w8+s/9ihcj8JOoEBjDKzj+KHhPwAAAAAAT6BAesN95Nak1D8K16NwPU+gQJ87wf7r3Ng/AAAAAIBPoED8FwgCZOjXP/YoXI/CT6BAXB0AcVev0j8AAAAAAFCgQE/o9SfxudI/CtejcD1QoEBwVSMFYE2fPwAAAACAUKBAAOphwy7lpz/2KFyPwlCgQNREn48y4ug/AAAAAABRoED6er5muWzsPwrXo3A9UaBAggGEDyVayD8AAAAAgFGgQOxrXWqEfso/9ihcj8JRoEBk5ZfBGJHUPwAAAAAAUqBAUtxM4DGXsz8K16NwPVKgQDoDIy9rYu8/AAAAAIBSoECrX+l8eBbjP/YoXI/CUqBANPj7xWzJwD8AAAAAAFOgQE637BD/sL0/CtejcD1ToEAP1CmPboTsPwAAAACAU6BAiiKkbmff6T/2KFyPwlOgQJRGcTOBx7I/AAAAAABUoED/PA0YJH3qPwrXo3A9VKBA8G5lic6y6j8AAAAAgFSgQGNEotCy7uo/9ihcj8JUoEDNPLmmQOboPwAAAAAAVaBATDPd66S+wD8K16NwPVWgQFopBHKJI+4/AAAAAIBVoEBoz2VqErztP/YoXI/CVaBAcsKE0axs6T8AAAAAAFagQLe0GhL3WOM/CtejcD1WoEBuawvPS8XGPwAAAACAVqBA91YkJqjh2D/2KFyPwlagQBa/KaxUUMM/AAAAAABXoEAct5ifG5rMPwrXo3A9V6BAPhwLp1h3hD8AAAAAgFegQN14d2SsNuw/9ihcj8JXoEA5RUdy+Q/BPwAAAAAAWKBA/7EQHQJH1z8K16NwPVigQHu/0Y4bfuQ/AAAAAIBYoECCNjl80onEP/YoXI/CWKBAuVSlLa5x4j8AAAAAAFmgQJFEL6NYbtE/CtejcD1ZoECyTL9EvHXdPwAAAACAWaBAVq4BW2/lsj/2KFyPwlmgQP8mkOk7hX0/AAAAAABaoEDsvmN47GfsPwrXo3A9WqBAOSo3UUvz7z8AAAAAgFqgQP1P/u4dNeE/9ihcj8JaoEA5fNKJBNPtPwAAAAAAW6BAknh5OleUmj8K16NwPVugQF49OOnHcLA/AAAAAIBboEDQmEnUCz7hP/YoXI/CW6BA46jcRC1N4j8AAAAAAFygQEwceSCyyOs/CtejcD1coEBd4V0u4ju9PwAAAACAXKBATWpoA7CB7D/2KFyPwlygQC/CFOXSeO4/AAAAAABdoEBTWRR2UfTAPwrXo3A9XaBA5iSUvhBy7D8AAAAAgF2gQL2MYrml1aQ/9ihcj8JdoECQ+YBAZ9LbPwAAAAAAXqBAHEXWGkrt6D8K16NwPV6gQD7ONGH7yds/AAAAAIBeoEAlW11OCYjSP/YoXI/CXqBAVRNE3Qeg5z8AAAAAAF+gQFcG1QYnoqM/CtejcD1foECG6GvxhLmoPwAAAACAX6BAw3pInSVtrz/2KFyPwl+gQB+BP/z897g/AAAAAABgoEBRFr6+1qXZPwrXo3A9YKBAi6VIvhJI5D8AAAAAgGCgQG2pg7weTNw/9ihcj8JgoECiwVxBiYW0PwAAAAAAYaBAPuyFAraD6z8K16NwPWGgQPHVjuIcdco/AAAAAIBhoEDoFU890uDqP/YoXI/CYaBAM25qoPmcwz8AAAAAAGKgQLddaK7TSMM/CtejcD1ioEBqbRrba0HZPwAAAACAYqBAJa/OMSB70D/2KFyPwmKgQFWi7C3lfN8/AAAAAABjoEDaOjjYmxi4PwrXo3A9Y6BAYMd/gSBAuj8AAAAAgGOgQFkTC3xFt9k/9ihcj8JjoEAOoN/3b17cPwAAAAAAZKBAXXrqR3mcoD8K16NwPWSgQE2espqup+c/AAAAAIBkoEBnR6rv/CLpP/YoXI/CZKBAR60wfa8h4D8AAAAAAGWgQL5KPnYXqOI/CtejcD1loECOBvAWSFDtPwAAAACAZaBAGof6XdiaxT/2KFyPwmWgQEPnNXaJ6us/AAAAAABmoEClhcsqbAbYPwrXo3A9ZqBA20yFeCRe2z8AAAAAgGagQDij5qvk4+4/9ihcj8JmoEDK4Ch5dY7lPwAAAAAAZ6BAKPG5E+y/6T8K16NwPWegQIZY/RGGgeY/AAAAAIBnoEC3RgTj4FLmP/YoXI/CZ6BAwcb17/rM6j8AAAAAAGigQMk88gcDT+c/je21oPfGsD4FAEG0twULAQEAQcy3BQsLAgAAAAMAAADwfwMAQeS3BQsBAgBB87cFCwX//////wBBuLgFCwMwhVM=",BA(d)||(d=c(d));function MA(g){try{if(g==d&&f)return new Uint8Array(f);var C=DA(g);if(C)return C;if(O)return O(g);throw"both async and sync fetching of the wasm failed"}catch(s){W(s)}}function nA(){if(!f&&(o||K)){if(typeof fetch=="function"&&!oA(d))return fetch(d,{credentials:"same-origin"}).then(function(g){if(!g.ok)throw"failed to load wasm binary file at \'"+d+"\'";return g.arrayBuffer()}).catch(function(){return MA(d)});if(P)return new Promise(function(g,C){P(d,function(s){g(new Uint8Array(s))},C)})}return Promise.resolve().then(function(){return MA(d)})}function tA(){var g={a:LA};function C(k,e){var j=k.exports;Q.asm=j,U=Q.asm.f,b(U.buffer),_=Q.asm.o,cA(Q.asm.g),NA()}aA();function s(k){C(k.instance)}function r(k){return nA().then(function(e){return WebAssembly.instantiate(e,g)}).then(function(e){return e}).then(k,function(e){n("failed to asynchronously prepare wasm: "+e),W(e)})}function h(){return!f&&typeof WebAssembly.instantiateStreaming=="function"&&!BA(d)&&!oA(d)&&typeof fetch=="function"?fetch(d,{credentials:"same-origin"}).then(function(k){var e=WebAssembly.instantiateStreaming(k,g);return e.then(s,function(j){return n("wasm streaming compile failed: "+j),n("falling back to ArrayBuffer instantiation"),r(s)})}):r(s)}if(Q.instantiateWasm)try{var z=Q.instantiateWasm(g,C);return z}catch(k){return n("Module.instantiateWasm callback failed with error: "+k),!1}return h().catch(w),{}}function wA(g){for(;g.length>0;){var C=g.shift();if(typeof C=="function"){C(Q);continue}var s=C.func;typeof s=="number"?C.arg===void 0?iA(s)():iA(s)(C.arg):s(C.arg===void 0?null:C.arg)}}function iA(g){return _.get(g)}function OA(g,C,s){q.copyWithin(g,C,C+s)}function uA(g){W("OOM")}function hA(g){q.length,uA()}var AA={mappings:{},buffers:[null,[],[]],printChar:function(g,C){var s=AA.buffers[g];C===0||C===10?((g===1?N:n)(m(s,0)),s.length=0):s.push(C)},varargs:void 0,get:function(){AA.varargs+=4;var g=y[AA.varargs-4>>2];return g},getStr:function(g){var C=l(g);return C},get64:function(g,C){return g}};function zA(g){return 0}function yA(g,C,s,r,h){}function jA(g,C,s,r){for(var h=0,z=0;z<s;z++){var k=y[C>>2],e=y[C+4>>2];C+=8;for(var j=0;j<e;j++)AA.printChar(g,q[k+j]);h+=e}return y[r>>2]=h,0}var fA=typeof atob=="function"?atob:function(g){var C="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",s="",r,h,z,k,e,j,S,R=0;g=g.replace(/[^A-Za-z0-9\\+\\/\\=]/g,"");do k=C.indexOf(g.charAt(R++)),e=C.indexOf(g.charAt(R++)),j=C.indexOf(g.charAt(R++)),S=C.indexOf(g.charAt(R++)),r=k<<2|e>>4,h=(e&15)<<4|j>>2,z=(j&3)<<6|S,s=s+String.fromCharCode(r),j!==64&&(s=s+String.fromCharCode(h)),S!==64&&(s=s+String.fromCharCode(z));while(R<g.length);return s};function FA(g){try{for(var C=fA(g),s=new Uint8Array(C.length),r=0;r<C.length;++r)s[r]=C.charCodeAt(r);return s}catch{throw new Error("Converting base64 string to bytes failed.")}}function DA(g){if(BA(g))return FA(g.slice(EA.length))}var LA={c:OA,d:hA,e:zA,b:yA,a:jA};tA(),Q.___wasm_call_ctors=function(){return(Q.___wasm_call_ctors=Q.asm.g).apply(null,arguments)},Q._setLookup=function(){return(Q._setLookup=Q.asm.h).apply(null,arguments)},Q._getInitialTime=function(){return(Q._getInitialTime=Q.asm.i).apply(null,arguments)},Q._getFinalTime=function(){return(Q._getFinalTime=Q.asm.j).apply(null,arguments)},Q._getSaveper=function(){return(Q._getSaveper=Q.asm.k).apply(null,arguments)},Q._runModelWithBuffers=function(){return(Q._runModelWithBuffers=Q.asm.l).apply(null,arguments)},Q._malloc=function(){return(Q._malloc=Q.asm.m).apply(null,arguments)},Q._free=function(){return(Q._free=Q.asm.n).apply(null,arguments)};var sA=Q.stackSave=function(){return(sA=Q.stackSave=Q.asm.p).apply(null,arguments)},KA=Q.stackRestore=function(){return(KA=Q.stackRestore=Q.asm.q).apply(null,arguments)},gA=Q.stackAlloc=function(){return(gA=Q.stackAlloc=Q.asm.r).apply(null,arguments)};Q.cwrap=J;var QA;V=function g(){QA||CA(),QA||(V=g)};function CA(g){if(v>0||(X(),v>0))return;function C(){QA||(QA=!0,Q.calledRun=!0,!Z&&(kA(),B(Q),Q.onRuntimeInitialized&&Q.onRuntimeInitialized(),PA()))}Q.setStatus?(Q.setStatus("Running..."),setTimeout(function(){setTimeout(function(){Q.setStatus("")},1),C()},1)):C()}if(Q.run=CA,Q.preInit)for(typeof Q.preInit=="function"&&(Q.preInit=[Q.preInit]);Q.preInit.length>0;)Q.preInit.pop()();return CA(),Q.ready})})();exposeModelWorker(Module)})();\n';
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
    for (const g of e) {
      const w = this.modelSpec.implVars.get(g);
      w && r.push(w);
    }
    const o = this.outputs.startTime, i = this.outputs.endTime, Q = this.outputs.saveFreq;
    let B = createImplOutputs(r, o, i, Q);
    B = await this.modelRunner.runModel(this.inputs, B);
    const s = B.runTimeInMillis, a = /* @__PURE__ */ new Map();
    for (const g of e) {
      const w = this.modelSpec.implVars.get(g), E = B.getSeriesForVar(w.varId);
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
