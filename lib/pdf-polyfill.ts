// Promise.withResolvers polyfill for iOS/Safari < 17.4.
// pdf.js v5 calls Promise.withResolvers() on the MAIN thread (e.g. getDocument /
// PDFDocumentLoadingTask), so it must exist before pdf.js is imported. Importing this
// module *before* "pdfjs-dist" guarantees the polyfill runs first, regardless of how
// Next.js handles the inline <head> script.
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

// URL.parse static method — Safari/iOS 18.4+. pdf.js v5 calls URL.parse(url, base)
// and returns null on failure instead of throwing.
if (typeof URL !== "undefined" && typeof (URL as any).parse !== "function") {
  (URL as any).parse = function parse(url: string | URL, base?: string | URL) {
    try {
      return base !== undefined && base !== null ? new URL(url, base) : new URL(url);
    } catch {
      return null;
    }
  };
}

export {};
