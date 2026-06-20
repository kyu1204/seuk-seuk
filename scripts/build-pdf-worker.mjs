// Copies the pdf.js worker into public/ and prepends polyfills so PDFs render on
// older iOS/Safari, where pdf.js v5 would otherwise throw inside the worker:
//   - Promise.withResolvers         (Safari/iOS 17.4)
//   - Promise.try                   (Safari/iOS 18.2)
//   - Uint8Array base64/hex methods (Safari/iOS 18.2)
//   - URL.parse                     (Safari/iOS 18.4)
//   - ReadableStream async iteration (Safari/iOS 18.4)
//   - Map/WeakMap.getOrInsertComputed (Safari 26)
// Keep this in sync with lib/pdf-polyfill.ts (the main-thread copy).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

const polyfill =
  'if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){var resolve,reject;var promise=new Promise(function(res,rej){resolve=res;reject=rej;});return{promise:promise,resolve:resolve,reject:reject};};}' +
  'if(typeof Promise.try!=="function"){Promise.try=function(fn){var args=Array.prototype.slice.call(arguments,1);return new Promise(function(resolve){resolve(fn.apply(null,args));});};}' +
  'if(typeof Uint8Array!=="undefined"&&typeof Uint8Array.fromBase64!=="function"){Uint8Array.fromBase64=function(s){var bin=atob(s);var b=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++){b[i]=bin.charCodeAt(i);}return b;};}' +
  'if(typeof Uint8Array!=="undefined"&&typeof Uint8Array.prototype.toBase64!=="function"){Uint8Array.prototype.toBase64=function(){var bin="";for(var i=0;i<this.length;i++){bin+=String.fromCharCode(this[i]);}return btoa(bin);};}' +
  'if(typeof Uint8Array!=="undefined"&&typeof Uint8Array.prototype.toHex!=="function"){Uint8Array.prototype.toHex=function(){var h="";for(var i=0;i<this.length;i++){h+=this[i].toString(16).padStart(2,"0");}return h;};}' +
  'if(typeof Uint8Array!=="undefined"&&typeof Uint8Array.fromHex!=="function"){Uint8Array.fromHex=function(s){var n=s.length>>1;var b=new Uint8Array(n);for(var i=0;i<n;i++){b[i]=parseInt(s.substr(i*2,2),16);}return b;};}' +
  'if(typeof URL!=="undefined"&&typeof URL.parse!=="function"){URL.parse=function(u,b){try{return(b!==undefined&&b!==null)?new URL(u,b):new URL(u);}catch(e){return null;}};}' +
  'if(typeof ReadableStream!=="undefined"&&typeof ReadableStream.prototype[Symbol.asyncIterator]!=="function"){var __rsai=function(o){var reader=this.getReader();var pc=!!(o&&o.preventCancel);return{next:function(){return reader.read().then(function(r){if(r.done){reader.releaseLock();}return r;},function(e){reader.releaseLock();throw e;});},return:function(v){if(!pc){var c=reader.cancel(v);reader.releaseLock();return c.then(function(){return{done:true,value:v};});}reader.releaseLock();return Promise.resolve({done:true,value:v});},[Symbol.asyncIterator]:function(){return this;}};};ReadableStream.prototype[Symbol.asyncIterator]=__rsai;if(typeof ReadableStream.prototype.values!=="function"){ReadableStream.prototype.values=__rsai;}}' +
  'var __goic=function(p){if(p&&typeof p.getOrInsertComputed!=="function"){p.getOrInsertComputed=function(k,f){if(this.has(k)){return this.get(k);}var v=f(k);this.set(k,v);return v;};}if(p&&typeof p.getOrInsert!=="function"){p.getOrInsert=function(k,v){if(this.has(k)){return this.get(k);}this.set(k,v);return v;};}};if(typeof Map!=="undefined"){__goic(Map.prototype);}if(typeof WeakMap!=="undefined"){__goic(WeakMap.prototype);}' +
  "\n";

const workerSource = readFileSync(src, "utf8");
writeFileSync(dest, polyfill + workerSource, "utf8");

console.log("[build-pdf-worker] wrote polyfilled worker to public/pdf.worker.min.mjs");
