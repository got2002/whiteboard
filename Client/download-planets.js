import fs from 'fs';
import path from 'path';

const PLANETS = {
  sun: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/400px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  mercury: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Mercury_in_color_-_Prockter07_centered.jpg/400px-Mercury_in_color_-_Prockter07_centered.jpg',
  venus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/400px-Venus-real_color.jpg',
  earth: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/400px-The_Earth_seen_from_Apollo_17.jpg',
  mars: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/400px-OSIRIS_Mars_true_color.jpg',
  jupiter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/400px-Jupiter.jpg',
  saturn: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Saturn_%28planet%29_large.png',
  uranus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/400px-Uranus2.jpg',
  neptune: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/400px-Neptune_Full.jpg',
  pluto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/400px-Pluto_in_True_Color_-_High-Res.jpg'
};

const targetDir = path.join(process.cwd(), 'public', 'planets');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImages() {
  for (const [name, url] of Object.entries(PLANETS)) {
    try {
      console.log(`Downloading ${name}...`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.error(`Failed to download ${name}: ${res.statusText}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      const ext = url.endsWith('.png') ? '.png' : '.jpg';
      const dest = path.join(targetDir, `${name}${ext}`);
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log(`Saved ${name}${ext}`);
    } catch (err) {
      console.error(`Error downloading ${name}: ${err.message}`);
    }
  }
}

downloadImages();
