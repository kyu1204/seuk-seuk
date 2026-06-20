// Copies the pdf.js worker into public/ and prepends a Promise.withResolvers
// polyfill so PDFs render on iOS/Safari < 17.4 (e.g. iOS 17.3.x), where pdf.js v5
// would otherwise throw "Promise.withResolvers is not a function" inside the worker.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

const polyfill =
  'if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){var resolve,reject;var promise=new Promise(function(res,rej){resolve=res;reject=rej;});return{promise:promise,resolve:resolve,reject:reject};};}\n';

const workerSource = readFileSync(src, "utf8");
writeFileSync(dest, polyfill + workerSource, "utf8");

console.log("[build-pdf-worker] wrote polyfilled worker to public/pdf.worker.min.mjs");
