import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function processImage() {
  console.log('Loading image...');
  const img = await loadImage('./public/planets/saturn.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    const maxVal = Math.max(r, g, b);
    
    if (maxVal < 15) {
       data[i+3] = 0; // Transparent
    } else if (maxVal < 50) {
       data[i+3] = Math.floor(((maxVal - 15) / 35) * 255);
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/planets/saturn.png', buffer);
  console.log('Done fixing saturn.png!');
}

processImage().catch(console.error);
