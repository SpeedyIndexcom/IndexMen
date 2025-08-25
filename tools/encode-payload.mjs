#!/usr/bin/env node

/**
 * encode-payload.mjs
 * 
 * Encrypts JavaScript code using XOR + Base64 with the SALT "idx|2025|v1"
 * for use in the encrypted IndexMen game.
 */

import fs from 'fs';
import path from 'path';

const SALT = 'idx|2025|v1';

/**
 * XOR encrypt/decrypt a string with a key
 */
function xorCrypt(data, key) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
  }
  return result.join('');
}

/**
 * Encrypt JavaScript code
 */
function encryptCode(jsCode) {
  // XOR with SALT
  const xored = xorCrypt(jsCode, SALT);
  // Base64 encode
  return Buffer.from(xored, 'binary').toString('base64');
}

/**
 * Extract JavaScript from index.html between specified script tags
 */
function extractJavaScript(htmlPath) {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const lines = content.split('\n');
  
  // Find the main script tag starting at line 261 (0-based: 260)
  let startLine = -1;
  let endLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '<script>' && i > 50) { // Skip the domain-lock script
      startLine = i + 1; // Skip the opening script tag
    }
    if (lines[i].trim() === '</script>' && startLine !== -1) {
      endLine = i; // Don't include the closing script tag
      break;
    }
  }
  
  if (startLine === -1 || endLine === -1) {
    throw new Error('Could not find main script tags in HTML file');
  }
  
  // Extract the JavaScript code
  const jsLines = lines.slice(startLine, endLine);
  return jsLines.join('\n');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node encode-payload.mjs <input-file>');
    console.log('       node encode-payload.mjs --extract-from-html <html-file>');
    process.exit(1);
  }
  
  let jsCode;
  
  if (args[0] === '--extract-from-html') {
    if (args.length < 2) {
      console.error('Please provide HTML file path');
      process.exit(1);
    }
    
    const htmlPath = args[1];
    if (!fs.existsSync(htmlPath)) {
      console.error(`File not found: ${htmlPath}`);
      process.exit(1);
    }
    
    console.log(`Extracting JavaScript from ${htmlPath}...`);
    jsCode = extractJavaScript(htmlPath);
  } else {
    const inputFile = args[0];
    if (!fs.existsSync(inputFile)) {
      console.error(`File not found: ${inputFile}`);
      process.exit(1);
    }
    
    console.log(`Reading JavaScript from ${inputFile}...`);
    jsCode = fs.readFileSync(inputFile, 'utf8');
  }
  
  console.log(`JavaScript code length: ${jsCode.length} characters`);
  
  // Encrypt the code
  const encrypted = encryptCode(jsCode);
  console.log(`Encrypted payload length: ${encrypted.length} characters`);
  
  // Output the encrypted payload
  console.log('\n=== ENCRYPTED PAYLOAD ===');
  console.log(encrypted);
  console.log('=== END PAYLOAD ===\n');
  
  // Optionally save to file
  const outputFile = 'encrypted-payload.txt';
  fs.writeFileSync(outputFile, encrypted);
  console.log(`Encrypted payload saved to: ${outputFile}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { encryptCode, xorCrypt, extractJavaScript };