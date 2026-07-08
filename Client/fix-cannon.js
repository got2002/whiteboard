import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function processImage() {
  console.log('Loading cannon image...');
  const img = await loadImage('./public/cannon.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Remove near-white and light gray background pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    // If pixel is very light (near white background)
    if (r > 230 && g > 230 && b > 230) {
      data[i+3] = 0;
    } else if (r > 210 && g > 210 && b > 210) {
      data[i+3] = Math.floor(((255 - Math.max(r,g,b)) / 45) * 255);
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/cannon.png', buffer);
  console.log('Done fixing cannon.png!');
}

processImage().catch(console.error);
