// Polyfills for older iOS/Safari that pdf.js v5 requires on the MAIN thread.
// Import this module *before* "pdfjs-dist" so the polyfills run before pdf.js loads,
// regardless of how Next.js handles inline <head> scripts.
//
// Missing-API timeline (iOS Safari):
//   - Promise.withResolvers       17.4
//   - Promise.try                 18.2
//   - Uint8Array.fromBase64/.toBase64/.fromHex/.toHex  18.2
//   - URL.parse                   18.4
//   - ReadableStream async iteration (for await...of)  18.4
//   - Map/WeakMap.getOrInsertComputed  (very recent proposal; Safari 26)
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

// Uint8Array.prototype.toHex — 18.2+. pdf.js uses it for document fingerprints during load.
if (typeof Uint8Array !== "undefined" && typeof (Uint8Array.prototype as any).toHex !== "function") {
  (Uint8Array.prototype as any).toHex = function toHex() {
    let hex = "";
    const bytes = this as Uint8Array;
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  };
}

// Uint8Array.fromHex — 18.2+ (counterpart to toHex).
if (typeof Uint8Array !== "undefined" && typeof (Uint8Array as any).fromHex !== "function") {
  (Uint8Array as any).fromHex = function fromHex(str: string) {
    const length = str.length >> 1;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(str.substr(i * 2, 2), 16);
    }
    return bytes;
  };
}

// ReadableStream async iteration (for await...of / .values()) — 18.4+.
// pdf.js uses it in text-extraction and save paths.
if (
  typeof ReadableStream !== "undefined" &&
  typeof (ReadableStream.prototype as any)[Symbol.asyncIterator] !== "function"
) {
  const asyncIterator = function (this: ReadableStream, options?: { preventCancel?: boolean }) {
    const reader = this.getReader();
    const preventCancel = !!(options && options.preventCancel);
    return {
      next() {
        return reader.read().then(
          (result) => {
            if (result.done) reader.releaseLock();
            return result;
          },
          (err) => {
            reader.releaseLock();
            throw err;
          }
        );
      },
      return(value?: unknown) {
        if (!preventCancel) {
          const cancelPromise = reader.cancel(value);
          reader.releaseLock();
          return cancelPromise.then(() => ({ done: true, value }));
        }
        reader.releaseLock();
        return Promise.resolve({ done: true, value });
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = asyncIterator;
  if (typeof (ReadableStream.prototype as any).values !== "function") {
    (ReadableStream.prototype as any).values = asyncIterator;
  }
}

// Map / WeakMap getOrInsertComputed + getOrInsert — very recent "upsert" proposal
// (Safari 26). pdf.js v5 uses getOrInsertComputed for caching, including the render path.
{
  const defineGetOrInsert = (proto: any) => {
    if (proto && typeof proto.getOrInsertComputed !== "function") {
      proto.getOrInsertComputed = function (key: any, callbackFn: (key: any) => any) {
        if (this.has(key)) return this.get(key);
        const value = callbackFn(key);
        this.set(key, value);
        return value;
      };
    }
    if (proto && typeof proto.getOrInsert !== "function") {
      proto.getOrInsert = function (key: any, value: any) {
        if (this.has(key)) return this.get(key);
        this.set(key, value);
        return value;
      };
    }
  };
  if (typeof Map !== "undefined") defineGetOrInsert(Map.prototype);
  if (typeof WeakMap !== "undefined") defineGetOrInsert(WeakMap.prototype);
}

export {};
