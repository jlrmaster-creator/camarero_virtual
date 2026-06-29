#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const svgContent = fs.readFileSync(path.resolve('public/icon.svg'), 'utf-8');

async function generatePng(size) {
  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(Buffer.from(reader.result));
        reader.readAsArrayBuffer(blob);
      });
    };
    img.src = url;
  });
}

// Note: Run this in browser console or use a tool like sharp/librsvg
console.log('Run this in a browser to generate PNG icons:');
console.log('1. Open public/icon.svg in browser');
console.log('2. Use canvas to export PNG at 192x192 and 512x512');
console.log('3. Save as public/icon-192.png and public/icon-512.png');
