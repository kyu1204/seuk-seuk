// Polyfills for older iOS/Safari that pdf.js v5 requires on the MAIN thread.
// Import this module *before* "pdfjs-dist" so the polyfills run before pdf.js loads,
// regardless of how Next.js handles inline <head> scripts.
//
// Missing-API timeline (iOS Safari):
//   - Promise.withResolvers       17.4
//   - Promise.try                 18.2
//   - Uint8Array.fromBase64/.toBase64  18.2
//   - URL.parse                   18.4
// (Float16Array is feature-detected by pdf.js itself, so no polyfill is needed.)

// Promise.withResolvers — 17.4+
if (typeof Promise !== "undefined" && typeof (Promise as any).withResolvers !== "function") {
  (Promise as any).withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Promise.try — 18.2+. Runs fn synchronously, wrapping the result (and sync throws) in a Promise.
if (typeof Promise !== "undefined" && typeof (Promise as any).try !== "function") {
  (Promise as any).try = function tryFn(fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

// URL.parse — 18.4+. Returns a URL or null instead of throwing (standard behavior).
if (typeof URL !== "undefined" && typeof (URL as any).parse !== "function") {
  (URL as any).parse = function parse(url: string | URL, base?: string | URL) {
    try {
      return base !== undefined && base !== null ? new URL(url, base) : new URL(url);
    } catch {
      return null;
    }
  };
}

// Uint8Array.fromBase64 — 18.2+ (standard base64 alphabet).
if (typeof Uint8Array !== "undefined" && typeof (Uint8Array as any).fromBase64 !== "function") {
  (Uint8Array as any).fromBase64 = function fromBase64(str: string) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };
}

// Uint8Array.prototype.toBase64 — 18.2+ (standard base64 alphabet).
if (typeof Uint8Array !== "undefined" && typeof (Uint8Array.prototype as any).toBase64 !== "function") {
  (Uint8Array.prototype as any).toBase64 = function toBase64() {
    let binary = "";
    const bytes = this as Uint8Array;
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
}

export {};
