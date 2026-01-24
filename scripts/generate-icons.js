/**
 * Icon Generation Script for PWA
 *
 * To generate icons, you need to:
 * 1. Install sharp: npm install sharp --save-dev
 * 2. Create a source icon at public/icons/icon-source.png (1024x1024)
 * 3. Run: node scripts/generate-icons.js
 *
 * Or use an online tool like:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

// For now, create placeholder icons using a simple approach
// In production, use the SVG or a proper icon

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Check if sharp is available
try {
  const sharp = require('sharp');

  const sourceIcon = path.join(iconsDir, 'icon.svg');

  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found at:', sourceIcon);
    process.exit(1);
  }

  async function generateIcons() {
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));

      console.log(`Generated icon-${size}.png`);
    }

    // Generate maskable icons (with padding)
    for (const size of [192, 512]) {
      const padding = Math.floor(size * 0.1);
      const innerSize = size - (padding * 2);

      await sharp(sourceIcon)
        .resize(innerSize, innerSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue background
        })
        .png()
        .toFile(path.join(iconsDir, `icon-maskable-${size}.png`));

      console.log(`Generated icon-maskable-${size}.png`);
    }

    console.log('All icons generated successfully!');
  }

  generateIcons().catch(console.error);

} catch (e) {
  console.log('Sharp not installed. Install with: npm install sharp --save-dev');
  console.log('Or use an online tool to generate icons from the SVG at public/icons/icon.svg');
  console.log('\nRecommended online tools:');
  console.log('- https://www.pwabuilder.com/imageGenerator');
  console.log('- https://realfavicongenerator.net/');
}
