// Copies the pdf.js worker into public/ and prepends polyfills so PDFs render on
// older iOS/Safari, where pdf.js v5 would otherwise throw inside the worker:
//   - Promise.withResolvers  (added in Safari/iOS 17.4)
//   - URL.parse              (added in Safari/iOS 18.4)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

const polyfill =
  'if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){var resolve,reject;var promise=new Promise(function(res,rej){resolve=res;reject=rej;});return{promise:promise,resolve:resolve,reject:reject};};}' +
  'if(typeof URL!=="undefined"&&typeof URL.parse!=="function"){URL.parse=function(u,b){try{return(b!==undefined&&b!==null)?new URL(u,b):new URL(u);}catch(e){return null;}};}' +
  "\n";

const workerSource = readFileSync(src, "utf8");
writeFileSync(dest, polyfill + workerSource, "utf8");

console.log("[build-pdf-worker] wrote polyfilled worker to public/pdf.worker.min.mjs");
