import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/images/logo-2.png');
const outputDir = path.join(__dirname, '../public/images');

async function optimizeLogo() {
  console.log('🖼️ Optimizing logo-2.png...');
  
  // Create WebP versions at various sizes
  const sizes = [
    { name: 'logo-48', size: 48 },   // For navbar small
    { name: 'logo-64', size: 64 },   // For navbar medium
    { name: 'logo-128', size: 128 }, // For general use
    { name: 'logo-256', size: 256 }, // For hero/larger displays
  ];

  for (const { name, size } of sizes) {
    // WebP version (best compression)
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, `${name}.webp`));
    
    const webpStats = await sharp(path.join(outputDir, `${name}.webp`)).metadata();
    console.log(`✅ Created ${name}.webp (${size}x${size})`);
    
    // PNG version (fallback)
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, `${name}.png`));
    
    console.log(`✅ Created ${name}.png (${size}x${size})`);
  }

  // Also create optimized full-size versions
  await sharp(inputPath)
    .webp({ quality: 85 })
    .toFile(path.join(outputDir, 'logo-2.webp'));
  console.log('✅ Created logo-2.webp (full size, optimized)');

  // Check file sizes
  console.log('\n📊 File sizes:');
  const fs = await import('fs');
  
  const originalSize = fs.statSync(inputPath).size;
  console.log(`   Original logo-2.png: ${(originalSize / 1024).toFixed(1)} KB`);
  
  const webpFullSize = fs.statSync(path.join(outputDir, 'logo-2.webp')).size;
  console.log(`   logo-2.webp: ${(webpFullSize / 1024).toFixed(1)} KB (${((1 - webpFullSize/originalSize) * 100).toFixed(0)}% smaller)`);
  
  for (const { name, size } of sizes) {
    const webpSize = fs.statSync(path.join(outputDir, `${name}.webp`)).size;
    const pngSize = fs.statSync(path.join(outputDir, `${name}.png`)).size;
    console.log(`   ${name}.webp: ${(webpSize / 1024).toFixed(1)} KB | ${name}.png: ${(pngSize / 1024).toFixed(1)} KB`);
  }
  
  console.log('\n✨ Done! Update your components to use optimized images.');
}

optimizeLogo().catch(console.error);
