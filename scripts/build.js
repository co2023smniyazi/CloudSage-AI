#!/usr/bin/env node
/**
 * scripts/build.js
 * Inlines frontend assets (index.html, style.css, script.js) into application/worker.js
 * and outputs the standalone production bundle to dist/worker.js for Terraform deployment.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'application');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'worker.js');

console.log('--- Starting Student Task Manager Build Process ---');

// 1. Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log(`Created output directory: ${DIST_DIR}`);
}

// 2. Read source assets
const htmlPath = path.join(APP_DIR, 'index.html');
const cssPath = path.join(APP_DIR, 'style.css');
const jsPath = path.join(APP_DIR, 'script.js');
const workerPath = path.join(APP_DIR, 'worker.js');

if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath) || !fs.existsSync(jsPath) || !fs.existsSync(workerPath)) {
  console.error('Error: One or more required source files in application/ are missing.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');
const workerTemplate = fs.readFileSync(workerPath, 'utf8');

// 3. Inline CSS into HTML
let bundledHtml = htmlContent.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']style\.css["']\s*\/?>/i,
  `<style>\n${cssContent}\n</style>`
);

// 4. Inline JS into HTML
bundledHtml = bundledHtml.replace(
  /<script\s+src=["']script\.js["']\s*><\/script>/i,
  `<script>\n${jsContent}\n</script>`
);

// 5. Escape template literal syntax so it can safely sit inside backticks in worker.js
const escapedHtml = bundledHtml
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

// 6. Inject bundled HTML into Worker
const finalWorkerContent = workerTemplate.replace('__BUNDLED_HTML_CONTENT__', escapedHtml);

// 7. Write to dist/worker.js
fs.writeFileSync(OUTPUT_FILE, finalWorkerContent, 'utf8');

const stats = fs.statSync(OUTPUT_FILE);
console.log(`Successfully built: ${OUTPUT_FILE}`);
console.log(`Bundle Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log('--- Build Finished Successfully ---');

