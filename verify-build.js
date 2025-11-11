#!/usr/bin/env node

/**
 * סקריפט וידוא Build
 * בודק שכל הקבצים הנדרשים קיימים ב-dist
 */

import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'dist/index.html',
  'dist/.htaccess',
  'dist/manifest.json',
  'dist/service-worker.js',
  'dist/offline.html',
];

console.log('\n🔍 בודק את תיקיית dist...\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  const size = exists ? `(${(fs.statSync(file).size / 1024).toFixed(2)} KB)` : '';

  console.log(`${status} ${file} ${size}`);

  if (!exists) {
    allFilesExist = false;
  }
});

console.log('');

if (!allFilesExist) {
  console.error('❌ שגיאה: חלק מהקבצים חסרים ב-dist!');
  console.error('הרץ: npm run build:only');
  process.exit(1);
}

// בדיקה מיוחדת ל-.htaccess
const htaccessPath = 'dist/.htaccess';
const htaccessContent = fs.readFileSync(htaccessPath, 'utf-8');

if (!htaccessContent.includes('RewriteEngine On')) {
  console.error('❌ שגיאה: .htaccess לא מכיל RewriteEngine On');
  process.exit(1);
}

console.log('✅ כל הקבצים קיימים ותקינים!');
console.log('');
console.log('📦 dist/ מוכן להעלאה לשרת');
console.log('');
console.log('💡 טיפ: הרץ npm run deploy להעלאה אוטומטית');
console.log('');
