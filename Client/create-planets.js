// Create SVG-based planet images for Uranus, Neptune, and Pluto
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public', 'planets');

const uranusSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="u" cx="35%" cy="35%">
      <stop offset="0%" stop-color="#b5f5fc"/>
      <stop offset="40%" stop-color="#67e8f9"/>
      <stop offset="80%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0e4f5c"/>
    </radialGradient>
    <radialGradient id="uh" cx="30%" cy="30%">
      <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="black"/>
  <circle cx="200" cy="200" r="170" fill="url(#u)"/>
  <circle cx="200" cy="200" r="170" fill="url(#uh)"/>
  <ellipse cx="200" cy="200" rx="190" ry="30" fill="none" stroke="rgba(180,240,255,0.3)" stroke-width="12" transform="rotate(98 200 200)"/>
</svg>`;

const neptuneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="n" cx="35%" cy="35%">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="30%" stop-color="#3b82f6"/>
      <stop offset="70%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#0c1445"/>
    </radialGradient>
    <radialGradient id="nh" cx="30%" cy="30%">
      <stop offset="0%" stop-color="white" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="black"/>
  <circle cx="200" cy="200" r="170" fill="url(#n)"/>
  <ellipse cx="195" cy="140" rx="120" ry="15" fill="rgba(100,160,255,0.2)" transform="rotate(-5 195 140)"/>
  <ellipse cx="210" cy="230" rx="100" ry="10" fill="rgba(60,100,200,0.2)" transform="rotate(3 210 230)"/>
  <circle cx="200" cy="200" r="170" fill="url(#nh)"/>
</svg>`;

const plutoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="p" cx="40%" cy="38%">
      <stop offset="0%" stop-color="#f5e6d3"/>
      <stop offset="30%" stop-color="#d4b896"/>
      <stop offset="60%" stop-color="#b09070"/>
      <stop offset="100%" stop-color="#4a3828"/>
    </radialGradient>
    <radialGradient id="ph" cx="30%" cy="30%">
      <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="black"/>
  <circle cx="200" cy="200" r="170" fill="url(#p)"/>
  <path d="M200,70 Q260,120 250,200 Q240,270 200,290 Q160,270 150,200 Q140,120 200,70Z" fill="rgba(245,230,210,0.5)"/>
  <circle cx="200" cy="200" r="170" fill="url(#ph)"/>
</svg>`;

fs.writeFileSync(path.join(dir, 'uranus.svg'), uranusSvg);
fs.writeFileSync(path.join(dir, 'neptune.svg'), neptuneSvg);
fs.writeFileSync(path.join(dir, 'pluto.svg'), plutoSvg);
console.log('Created 3 SVG planet images');
