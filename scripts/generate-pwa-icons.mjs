#!/usr/bin/env node
/**
 * Generate PWA icons from the source SVG
 * Creates all required sizes for iOS, Android, and PWA installation
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the source SVG
const svgPath = join(publicDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes needed for comprehensive PWA support
const iconSizes = [
  // Standard PWA icons
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 167, name: 'icon-167.png' }, // iPad Pro
  { size: 180, name: 'icon-180.png' }, // iPhone retina
  { size: 192, name: 'icon-192.png' },
  { size: 256, name: 'icon-256.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' },
  
  // Apple Touch Icons (critical for iOS home screen)
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  
  // Maskable icons (Android adaptive icons with safe zone)
  { size: 192, name: 'icon-maskable-192.png', maskable: true },
  { size: 512, name: 'icon-maskable-512.png', maskable: true },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from icon.svg...\n');

  for (const { size, name, maskable } of iconSizes) {
    try {
      const outputPath = join(publicDir, name);
      
      // The current icon.svg already has built-in safe margins (~18-20%)
      // and a solid edge-to-edge background. We don't need additional 
      // padding which causes the "multiple boundaries" issue.
      
      if (maskable || name.startsWith('apple-touch-icon')) {
        // For maskable and Apple icons, we ensure they are high quality 
        // but keep the SVG's own background edge-to-edge.
        await sharp(svgBuffer)
          .resize(size, size)
          .png({ quality: 100, compressionLevel: 9 })
          .toFile(outputPath);
      } else {
        await sharp(svgBuffer)
          .resize(size, size)
          .png({ quality: 100, compressionLevel: 9 })
          .toFile(outputPath);
      }
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate favicon.ico (multi-size)
  try {
    const favicon16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
    const favicon48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
    
    // For a proper ICO file, we just use the 32x32 PNG as the base
    // Most browsers will accept this
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(publicDir, 'favicon.ico'));
    
    console.log(`✅ Generated favicon.ico`);
  } catch (error) {
    console.error(`❌ Failed to generate favicon.ico:`, error.message);
  }

  console.log('\n🎉 Icon generation complete!');
  console.log('\nGenerated icons:');
  console.log('  - Standard PWA icons (48-512px)');
  console.log('  - Apple Touch Icons (152-180px)');
  console.log('  - Maskable icons for Android');
  console.log('  - Favicons (16, 32, 48px + ico)');
}

generateIcons().catch(console.error);
