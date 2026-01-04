#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

// Create directories if needed
const dirsToCreate = [
  path.join(publicDir, 'icons'),
  path.join(publicDir, 'screenshots'),
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Check if sharp is available for PNG generation
let sharpAvailable = false;
try {
  await import('sharp');
  sharpAvailable = true;
} catch {
  console.log('Sharp not available, will create SVG-based fallback icons');
}

if (sharpAvailable) {
  const sharp = (await import('sharp')).default;
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate standard icons
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    console.log(`Generated: icon-${size}.png`);
  }

  // Generate maskable icons (with padding for safe zone)
  for (const size of sizes) {
    const padding = Math.floor(size * 0.1); // 10% padding for safe zone
    const innerSize = size - (padding * 2);
    
    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 16, g: 185, b: 129, alpha: 1 } // Emerald 500
      })
      .png()
      .toFile(path.join(publicDir, `icon-maskable-${size}.png`));
    console.log(`Generated: icon-maskable-${size}.png`);
  }

  // Generate shortcut icons (96x96)
  const shortcutIcons = ['dashboard', 'tasks', 'add', 'leaderboard', 'profile'];
  for (const name of shortcutIcons) {
    await sharp(svgBuffer)
      .resize(96, 96)
      .png()
      .toFile(path.join(publicDir, `icons/${name}.png`));
    console.log(`Generated: icons/${name}.png`);
  }

  console.log('✅ All PNG icons generated from SVG!');
} else {
  // Create inline SVG data URL versions in manifest as fallback
  console.log('⚠️  Install sharp for PNG generation: npm install sharp');
  console.log('   For now, the app will use SVG icons which work on most modern browsers.');
  
  // Create placeholder PNGs that are valid (minimal transparent)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  const filesToCreate = [
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-192.png',
    'icon-maskable-512.png',
    'icons/dashboard.png',
    'icons/tasks.png',
    'icons/add.png',
    'icons/leaderboard.png',
    'icons/profile.png',
  ];

  filesToCreate.forEach(file => {
    const filePath = path.join(publicDir, file);
    fs.writeFileSync(filePath, minimalPNG);
    console.log(`Created placeholder: ${file}`);
  });
}

console.log('✅ Icon generation complete!');
