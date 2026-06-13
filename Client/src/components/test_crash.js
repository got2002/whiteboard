const params = { angle: 30, mass: 5, friction: 0.2, gravity: 9.8 };
const sim = { t: 0, trail: [], theta: 0, omega: 0, x: 0, v: 0, dotPhase: 0 };
const w = 800;
const h = 600;

function drawGround() {}
function drawArrow() {}

const ctx = {
  beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, closePath: () => {},
  fill: () => {}, stroke: () => {}, arc: () => {}, fillText: () => {},
  fillRect: () => {}, strokeRect: () => {}, save: () => {}, restore: () => {},
  translate: () => {}, rotate: () => {}
};

function renderInclinedPlane(ctx, w, h, sim, params) {
  const { angle, mass, friction, gravity } = params;
  const theta = angle * Math.PI / 180;
  
  const originX = w * 0.75;
  const originY = h * 0.8;
  const planeLength = w * 0.6;
  const topX = originX - planeLength * Math.cos(theta);
  const topY = originY - planeLength * Math.sin(theta);
  
  drawGround(ctx, w, originY);
  
  ctx.fillStyle = "rgba(100,116,139,0.3)";
  ctx.strokeStyle = "rgba(148,163,184,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(topX, topY); ctx.lineTo(topX, originY); ctx.closePath();
  ctx.fill(); ctx.stroke();

  if (angle > 5) {
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(originX, originY, 40, Math.PI, Math.PI + theta); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; 
    ctx.fillText(`${angle}°`, originX - 50, originY - 10);
  }

  const bw = 30 + mass;
  const bh = 20 + mass / 2;
  
  const W = mass * gravity;
  const W_x = W * Math.sin(theta);
  const W_y = W * Math.cos(theta);
  const N = W_y;
  let maxFriction = friction * N;
  
  let a = 0;
  let F_fric = 0;
  if (W_x > maxFriction) {
    a = (W_x - maxFriction) / mass;
    F_fric = maxFriction;
  } else {
    F_fric = W_x;
  }
  
  const displacement = 0.5 * a * sim.t * sim.t;
  const maxDisplacement = planeLength - bw;
  
  let currentD = displacement;
  if (currentD >= maxDisplacement) {
    currentD = maxDisplacement;
    sim.hitBottom = true;
  } else {
    sim.hitBottom = false;
  }

  const blockCenterX = topX + (bw/2 + currentD) * Math.cos(theta) + (bh/2) * Math.sin(theta);
  const blockCenterY = topY + (bw/2 + currentD) * Math.sin(theta) - (bh/2) * Math.cos(theta);
  
  ctx.save();
  ctx.translate(blockCenterX, blockCenterY);
  ctx.rotate(theta);

  ctx.fillStyle = "#f97316";
  ctx.fillRect(-bw/2, -bh/2, bw, bh);
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
  ctx.strokeRect(-bw/2, -bh/2, bw, bh);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText(`${mass}kg`, 0, 4);

  ctx.rotate(-theta);
  
  drawArrow(ctx, 0, 0, 0, W * 2, "#ef4444", 2);
  ctx.fillStyle = "#ef4444"; ctx.fillText("mg", 15, W * 2);
  
  const nx = N * 2 * Math.sin(theta);
  const ny = -N * 2 * Math.cos(theta);
  drawArrow(ctx, 0, 0, nx, ny, "#3b82f6", 2);
  ctx.fillStyle = "#3b82f6"; ctx.fillText("N", nx - 10, ny - 5);

  if (F_fric > 0.1) {
    const fx = -F_fric * 2 * Math.cos(theta);
    const fy = -F_fric * 2 * Math.sin(theta);
    drawArrow(ctx, 0, 0, fx, fy, "#22c55e", 2);
    ctx.fillStyle = "#22c55e"; ctx.fillText("f", fx - 10, fy - 5);
  }
  
  ctx.restore();
  
  return { a, N, f: F_fric, v: a * sim.t };
}

try {
  console.log("Testing inclined plane...");
  const result = renderInclinedPlane(ctx, w, h, sim, params);
  console.log("Result:", result);
  
  const info = result;
  const items = [
    { label: "ความเร่ง (a)", val: `${info.a !== undefined ? info.a.toFixed(2) : 0} m/s²`, color: "#f87171" },
    { label: "ความเร็ว (v)", val: `${info.v !== undefined ? info.v.toFixed(2) : 0} m/s`, color: "#34d399" },
    { label: "แรงตั้งฉาก (N)", val: `${info.N !== undefined ? info.N.toFixed(1) : 0} N`, color: "#60a5fa" },
    { label: "แรงเสียดทาน (f)", val: `${info.f !== undefined ? info.f.toFixed(1) : 0} N`, color: "#fbbf24" },
  ];
  console.log("Info items:", items);
  console.log("SUCCESS");
} catch (err) {
  console.error("ERROR:", err.message);
}
