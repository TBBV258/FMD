// camera-ocr.js — lightweight shim to avoid 404 when referenced from index.html
// This file intentionally minimal: if you later implement camera OCR as a module,
// replace the contents with the real implementation.

console.info('camera-ocr.js shim loaded');

export function initCameraOCR() {
  console.info('initCameraOCR called (shim)');
  // no-op
}

export default { initCameraOCR };
