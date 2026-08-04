import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from "../i18n/i18n";

// ==========================================
// Planet Data (Thai & English)
// ==========================================
const PLANETS = [
  {
    id: 'mercury', nameTH: 'ดาวพุธ', nameEN: 'Mercury', emoji: '🪨',
    color: '#9ca3af', radius: 14, orbitRadius: 130, speed: 1.0,
    imageUrl: './planets/mercury.png',
    infoTH: { distance: '57.9 ล้าน กม.', diameter: '4,879 กม.', temp: '167°C', moons: 0, period: '88 วัน', type: 'ดาวเคราะห์หิน' },
    infoEN: { distance: '57.9 M km', diameter: '4,879 km', temp: '167°C', moons: 0, period: '88 days', type: 'Rocky Planet' },
    gradient: ['#b0b0b0', '#808080', '#5a5a5a'],
  },
  {
    id: 'venus', nameTH: 'ดาวศุกร์', nameEN: 'Venus', emoji: '🌕',
    color: '#f59e0b', radius: 19, orbitRadius: 200, speed: 0.4,
    imageUrl: './planets/venus.png',
    infoTH: { distance: '108.2 ล้าน กม.', diameter: '12,104 กม.', temp: '464°C', moons: 0, period: '225 วัน', type: 'ดาวเคราะห์หิน' },
    infoEN: { distance: '108.2 M km', diameter: '12,104 km', temp: '464°C', moons: 0, period: '225 days', type: 'Rocky Planet' },
    gradient: ['#fcd34d', '#f59e0b', '#d97706'],
  },
  {
    id: 'earth', nameTH: 'โลก', nameEN: 'Earth', emoji: '🌍',
    color: '#3b82f6', radius: 21, orbitRadius: 270, speed: 0.25,
    imageUrl: './planets/earth.png',
    infoTH: { distance: '149.6 ล้าน กม.', diameter: '12,756 กม.', temp: '15°C', moons: 1, period: '365.25 วัน', type: 'ดาวเคราะห์หิน' },
    infoEN: { distance: '149.6 M km', diameter: '12,756 km', temp: '15°C', moons: 1, period: '365.25 days', type: 'Rocky Planet' },
    gradient: ['#60a5fa', '#2563eb', '#1d4ed8'],
    hasMoon: true,
  },
  {
    id: 'mars', nameTH: 'ดาวอังคาร', nameEN: 'Mars', emoji: '🔴',
    color: '#ef4444', radius: 16, orbitRadius: 340, speed: 0.13,
    imageUrl: './planets/mars.png',
    infoTH: { distance: '227.9 ล้าน กม.', diameter: '6,792 กม.', temp: '-65°C', moons: 2, period: '687 วัน', type: 'ดาวเคราะห์หิน' },
    infoEN: { distance: '227.9 M km', diameter: '6,792 km', temp: '-65°C', moons: 2, period: '687 days', type: 'Rocky Planet' },
    gradient: ['#fca5a5', '#ef4444', '#b91c1c'],
  },
  {
    id: 'jupiter', nameTH: 'ดาวพฤหัสบดี', nameEN: 'Jupiter', emoji: '🟠',
    color: '#f97316', radius: 45, orbitRadius: 450, speed: 0.02,
    imageUrl: './planets/jupiter.png',
    infoTH: { distance: '778.6 ล้าน กม.', diameter: '142,984 กม.', temp: '-110°C', moons: 95, period: '11.86 ปี', type: 'ดาวเคราะห์แก๊ส' },
    infoEN: { distance: '778.6 M km', diameter: '142,984 km', temp: '-110°C', moons: 95, period: '11.86 years', type: 'Gas Giant' },
    gradient: ['#fdba74', '#f97316', '#c2410c'],
    hasStripes: true,
  },
  {
    id: 'saturn', nameTH: 'ดาวเสาร์', nameEN: 'Saturn', emoji: '🪐',
    color: '#eab308', radius: 38, orbitRadius: 560, speed: 0.008,
    imageUrl: './planets/saturn.png',
    infoTH: { distance: '1,433.5 ล้าน กม.', diameter: '120,536 กม.', temp: '-140°C', moons: 146, period: '29.46 ปี', type: 'ดาวเคราะห์แก๊ส' },
    infoEN: { distance: '1,433.5 M km', diameter: '120,536 km', temp: '-140°C', moons: 146, period: '29.46 years', type: 'Gas Giant' },
    gradient: ['#fef08a', '#eab308', '#a16207'],
  },
  {
    id: 'uranus', nameTH: 'ดาวยูเรนัส', nameEN: 'Uranus', emoji: '🔵',
    color: '#67e8f9', radius: 29, orbitRadius: 650, speed: 0.003,
    imageUrl: './planets/uranus.png',
    infoTH: { distance: '2,872.5 ล้าน กม.', diameter: '51,118 กม.', temp: '-195°C', moons: 28, period: '84.01 ปี', type: 'ดาวเคราะห์น้ำแข็ง' },
    infoEN: { distance: '2,872.5 M km', diameter: '51,118 km', temp: '-195°C', moons: 28, period: '84.01 years', type: 'Ice Giant' },
    gradient: ['#a5f3fc', '#67e8f9', '#06b6d4'],
  },
  {
    id: 'neptune', nameTH: 'ดาวเนปจูน', nameEN: 'Neptune', emoji: '💙',
    color: '#3b82f6', radius: 27, orbitRadius: 730, speed: 0.0015,
    imageUrl: './planets/neptune.png',
    infoTH: { distance: '4,495.1 ล้าน กม.', diameter: '49,528 กม.', temp: '-200°C', moons: 16, period: '164.8 ปี', type: 'ดาวเคราะห์น้ำแข็ง' },
    infoEN: { distance: '4,495.1 M km', diameter: '49,528 km', temp: '-200°C', moons: 16, period: '164.8 years', type: 'Ice Giant' },
    gradient: ['#93c5fd', '#3b82f6', '#1e40af'],
  },
  {
    id: 'pluto', nameTH: 'ดาวพลูโต', nameEN: 'Pluto', emoji: '⚪',
    color: '#d1d5db', radius: 10, orbitRadius: 800, speed: 0.001,
    imageUrl: './planets/pluto.png',
    infoTH: { distance: '5,906.4 ล้าน กม.', diameter: '2,377 กม.', temp: '-230°C', moons: 5, period: '248 ปี', type: 'ดาวเคราะห์แคระ' },
    infoEN: { distance: '5,906.4 M km', diameter: '2,377 km', temp: '-230°C', moons: 5, period: '248 years', type: 'Dwarf Planet' },
    gradient: ['#e5e7eb', '#d1d5db', '#9ca3af'],
    isDwarf: true,
  },
];



// ==========================================
// Star Background
// ==========================================
const StarField = React.memo(() => {
  const stars = useRef(
    Array.from({ length: 200 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 3 + 1,
    }))
  ).current;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: 'white', opacity: s.opacity, animation: `twinkle ${s.twinkle}s ease-in-out infinite alternate` }} />
      ))}
    </div>
  );
});

// ==========================================
// Planet SVG Component
// ==========================================
const PlanetSVG = ({ planet, x, y, angle = Math.PI * 1.25, onClick, isSelected }) => {
  const r = planet.radius;
  const fx = 50 - Math.cos(angle) * 50;
  const fy = 50 - Math.sin(angle) * 50;
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(planet.id); }} style={{ cursor: 'pointer' }}>
      <defs>
        <radialGradient id={`dynGrad-${planet.id}`} cx="50%" cy="50%" fx={`${fx}%`} fy={`${fy}%`}>
          <stop offset="20%" stopColor="transparent" />
          <stop offset="85%" stopColor="rgba(0,0,0,0.6)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.9)" />
        </radialGradient>
        {planet.id !== 'saturn' && (
          <clipPath id={`clip-${planet.id}-${Math.floor(x)}-${Math.floor(y)}`}>
            <circle cx={x} cy={y} r={r} />
          </clipPath>
        )}
      </defs>
      
      {isSelected && (
        <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 3" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Shadow */}
      <circle cx={x + (r*0.2)} cy={y + (r*0.2)} r={r} fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
      
      {/* Real Image */}
      {planet.id === 'saturn' ? (
        <image href={planet.imageUrl} x={x - r * 2.2} y={y - r * 1.1} width={r * 4.4} height={r * 2.2} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <image href={planet.imageUrl} x={x - r} y={y - r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${planet.id}-${Math.floor(x)}-${Math.floor(y)})`} />
      )}
      
      {/* 3D shading overlay on top of image */}
      {planet.id !== 'saturn' && (
        <circle cx={x} cy={y} r={r} fill={`url(#dynGrad-${planet.id})`} style={{ pointerEvents: 'none' }} />
      )}
      
      {planet.hasMoon && (
        <circle cx={x + Math.cos(angle * 8) * (r + 12)} cy={y + Math.sin(angle * 8) * (r + 12)} r={3} fill="#e2e8f0" boxShadow="0 0 5px white" />
      )}
      <circle cx={x} cy={y} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {planet.isDwarf && <text x={x} y={y - r - 5} textAnchor="middle" fontSize="8" fill="#a78bfa" fontWeight="bold">♦</text>}
    </g>
  );
};

// ==========================================
// Compare Mode
// ==========================================
const CompareMode = ({ lang }) => {
  const L = LABELS[lang];
  const sorted = [...PLANETS].sort((a, b) => b.radius - a.radius);
  const maxR = sorted[0].radius;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
      <h2 style={{ color: 'white', fontSize: 20, margin: 0 }}>🔍 {L.compare}</h2>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, padding: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
        {sorted.map(p => {
          const scale = (p.radius / maxR) * 120;
          return (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: Math.max(16, scale), height: Math.max(16, scale), position: 'relative' }}>
                {p.id === 'saturn' ? (
                  <img src={p.imageUrl} alt={p.nameEN} style={{ width: '220%', height: '110%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }} />
                ) : (
                  <img src={p.imageUrl} alt={p.nameEN} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                )}
              </div>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{lang === 'TH' ? p.nameTH : p.nameEN}</span>
              <span style={{ color: '#94a3b8', fontSize: 9 }}>{(lang === 'TH' ? p.infoTH : p.infoEN).diameter}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// Quiz Mode
// ==========================================
const QuizMode = ({ lang, onExit }) => {
  const L = LABELS[lang];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [shuffled] = useState(() => [...PLANETS].sort(() => Math.random() - 0.5));
  const currentPlanet = shuffled[questionIndex];
  const correctOrbitIndex = PLANETS.findIndex(p => p.id === currentPlanet?.id);

  const handleAnswer = (idx) => {
    if (feedback) return;
    if (idx === correctOrbitIndex) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setTimeout(() => {
      setFeedback(null);
      if (questionIndex < shuffled.length - 1) {
        setQuestionIndex(qi => qi + 1);
      } else {
        setFinished(true);
      }
    }, 1200);
  };

  if (finished) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ color: 'white', fontSize: 24, margin: 0 }}>{L.finish}</h2>
        <p style={{ color: '#fbbf24', fontSize: 28, fontWeight: 'bold', margin: 0 }}>{L.congrats} {score}/{shuffled.length}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setQuestionIndex(0); setScore(0); setFinished(false); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>{L.reset}</button>
          <button onClick={onExit} style={{ background: '#475569', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>{L.close}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <div style={{ color: '#94a3b8', fontSize: 14 }}>{L.score}: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{score}/{shuffled.length}</span> — {lang === 'TH' ? 'ข้อ' : 'Q'} {questionIndex + 1}/{shuffled.length}</div>
      <h2 style={{ color: 'white', fontSize: 18, margin: 0, textAlign: 'center' }}>{L.quizQ}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '8px 0' }}>
        <div style={{ width: 80, height: 80, position: 'relative' }}>
          {currentPlanet.id === 'saturn' ? (
            <img src={currentPlanet.imageUrl} alt={currentPlanet.nameEN} style={{ width: '220%', height: '110%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }} />
          ) : (
            <img src={currentPlanet.imageUrl} alt={currentPlanet.nameEN} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 420 }}>
        {PLANETS.map((p, i) => (
          <button key={p.id} onClick={() => handleAnswer(i)} style={{
            background: feedback && i === correctOrbitIndex ? '#22c55e' : feedback === 'wrong' ? '#334155' : '#1e293b',
            color: 'white', border: '2px solid #475569', borderRadius: 10, padding: '10px 8px',
            cursor: feedback ? 'default' : 'pointer', fontSize: 12, fontWeight: 'bold',
            transition: 'all 0.2s', opacity: feedback && i !== correctOrbitIndex ? 0.5 : 1,
          }}>
            {i + 1}. {lang === 'TH' ? p.nameTH : p.nameEN}
          </button>
        ))}
      </div>
      {feedback && (
        <div style={{ fontSize: 22, fontWeight: 'bold', color: feedback === 'correct' ? '#22c55e' : '#ef4444' }}>
          {feedback === 'correct' ? `✅ ${L.correct}` : `❌ ${L.wrong}`}
        </div>
      )}
    </div>
  );
};

// ==========================================
// Info Panel
// ==========================================
const InfoPanel = ({ planet, lang, onClose }) => {
  if (!planet) return null;
  const L = LABELS[lang];
  const info = lang === 'TH' ? planet.infoTH : planet.infoEN;
  const name = lang === 'TH' ? planet.nameTH : planet.nameEN;
  return (
    <div style={{ position: 'absolute', right: 15, top: 60, width: 250, background: 'rgba(15,23,42,0.95)', borderRadius: 16, padding: 18, zIndex: 15, border: '1px solid #334155', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}>✕</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, position: 'relative' }}>
          {planet.id === 'saturn' ? (
            <img src={planet.imageUrl} alt={planet.nameEN} style={{ width: '220%', height: '110%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }} />
          ) : (
            <img src={planet.imageUrl} alt={planet.nameEN} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          )}
        </div>
        <div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{name}</div>
          {planet.isDwarf && <span style={{ color: '#a78bfa', fontSize: 10, background: '#1e1b4b', padding: '1px 5px', borderRadius: 4 }}>{L.dwarf}</span>}
        </div>
      </div>
      {[
        { label: L.type, value: info.type, icon: '🏷️' },
        { label: L.distance, value: info.distance, icon: '📏' },
        { label: L.diameter, value: info.diameter, icon: '⭕' },
        { label: L.temp, value: info.temp, icon: '🌡️' },
        { label: L.moons, value: info.moons, icon: '🌙' },
        { label: L.period, value: info.period, icon: '🔄' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{item.icon} {item.label}</span>
          <span style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 'bold' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// CSS Injection
// ==========================================
const ssStyle = document.createElement('style');
ssStyle.innerText = `@keyframes twinkle { 0%{opacity:0.2} 100%{opacity:1} }`;
document.head.appendChild(ssStyle);

// ==========================================
// Main Component
// ==========================================
export default function CustomSolarSystemLab({ onClose }) {
  const { t } = useI18n();
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [mode, setMode] = useState('orbit');
  const [angles, setAngles] = useState(() => PLANETS.map(() => Math.random() * Math.PI * 2));
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);
  const L = LABELS[lang];
  const cx = 800;
  const cy = 800;

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    if (mode !== 'orbit') return;
    setZoom(z => Math.max(0.2, Math.min(5, z - e.deltaY * 0.002)));
  }, [mode]);

  const handleMouseDown = useCallback((e) => {
    if (mode !== 'orbit') return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [mode, pan.x, pan.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const animate = (time) => {
      if (!isPaused) {
        const dt = (time - lastTimeRef.current) / 1000;
        if (dt < 0.1) setAngles(prev => prev.map((a, i) => a + PLANETS[i].speed * speedMultiplier * dt * 0.5));
      }
      lastTimeRef.current = time;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPaused, speedMultiplier]);

  const handlePlanetClick = useCallback((id) => {
    setSelectedPlanet(prev => prev?.id === id ? null : PLANETS.find(p => p.id === id));
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#030712', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StarField />
      {/* Top Bar */}
      <div style={{ background: 'rgba(15,23,42,0.9)', padding: '8px 16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid #1e293b', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🌍 {L.title}</h2>
          <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? '#22c55e' : '#f59e0b', border: 'none', color: '#fff', padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
            {isPaused ? `▶ ${L.play}` : `⏸ ${L.pause}`}
          </button>
          <div style={{ display: 'flex', gap: 3, background: '#1e293b', borderRadius: 20, padding: '2px 4px' }}>
            {[0.5, 1, 2, 5, 10].map(s => (
              <button key={s} onClick={() => setSpeedMultiplier(s)} style={{ background: speedMultiplier === s ? '#3b82f6' : 'transparent', border: 'none', color: speedMultiplier === s ? 'white' : '#94a3b8', padding: '3px 8px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}>×{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, background: '#1e293b', borderRadius: 20, padding: '2px 4px' }}>
            {[['orbit', '🌌'], ['compare', '🔍'], ['quiz', '📝']].map(([m, icon]) => (
              <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? '#6366f1' : 'transparent', border: 'none', color: mode === m ? 'white' : '#94a3b8', padding: '3px 10px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}>{icon} {L[m]}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          <button onClick={onClose} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>{L.close}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 160, background: 'rgba(15,23,42,0.8)', borderRight: '1px solid #1e293b', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', zIndex: 10, flexShrink: 0 }}>
          <button onClick={() => setSelectedPlanet(null)} style={{ background: !selectedPlanet ? 'rgba(251,191,36,0.15)' : 'transparent', border: !selectedPlanet ? '1px solid #f59e0b' : '1px solid transparent', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <img src="./planets/sun.png" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'contain' }} />
            <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>☀ {L.sun}</span>
          </button>
          {PLANETS.map(p => (
            <button key={p.id} onClick={() => handlePlanetClick(p.id)} style={{ background: selectedPlanet?.id === p.id ? 'rgba(99,102,241,0.15)' : 'transparent', border: selectedPlanet?.id === p.id ? '1px solid #6366f1' : '1px solid transparent', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', transition: 'all 0.15s' }}>
              <div style={{ width: 14, height: 14, position: 'relative' }}>
                {p.id === 'saturn' ? (
                  <img src={p.imageUrl} style={{ width: '220%', height: '110%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }} />
                ) : (
                  <img src={p.imageUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                )}
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}>{lang === 'TH' ? p.nameTH : p.nameEN}</span>
              {p.isDwarf && <span style={{ color: '#a78bfa', fontSize: 8, marginLeft: 'auto' }}>♦</span>}
            </button>
          ))}
        </div>

        {/* Main Canvas */}
        <div 
          style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', cursor: mode === 'orbit' ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ width: '100%', height: '100%', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' }}>
            <svg viewBox="0 0 1600 1600" style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
            <defs>
              <radialGradient id="sunCorona" cx="50%" cy="50%"><stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" /><stop offset="100%" stopColor="#fbbf24" stopOpacity="0" /></radialGradient>
              <filter id="sunGlow"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            {/* Orbit paths */}
            {PLANETS.map(p => (
              <ellipse key={`orbit-${p.id}`} cx={cx} cy={cy} rx={p.orbitRadius} ry={p.orbitRadius * 0.55} fill="none" stroke={selectedPlanet?.id === p.id ? '#6366f1' : '#334155'} strokeWidth={selectedPlanet?.id === p.id ? 2 : 0.5} strokeDasharray="4 4" opacity={selectedPlanet?.id === p.id ? 0.8 : 0.4} />
            ))}
            
            {/* Planets in the BACK (Behind the sun) */}
            {PLANETS.map((p, i) => {
              const sin = Math.sin(angles[i]);
              if (sin > 0) return null; // Only draw planets behind the sun
              const px = cx + Math.cos(angles[i]) * p.orbitRadius;
              const py = cy + sin * p.orbitRadius * 0.55;
              return <PlanetSVG key={p.id} planet={p} x={px} y={py} angle={angles[i]} onClick={handlePlanetClick} isSelected={selectedPlanet?.id === p.id} />;
            })}
            {PLANETS.map((p, i) => {
              const sin = Math.sin(angles[i]);
              if (sin > 0) return null;
              const px = cx + Math.cos(angles[i]) * p.orbitRadius;
              const py = cy + sin * p.orbitRadius * 0.55;
              return <text key={`n-back-${p.id}`} x={px} y={py + p.radius + 12} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" opacity="0.7" style={{ pointerEvents: 'none' }}>{lang === 'TH' ? p.nameTH : p.nameEN}</text>;
            })}

            {/* Sun */}
            <g onClick={() => setSelectedPlanet(null)} style={{ cursor: 'pointer' }}>
              <image href="./planets/sun.png" x={cx - 100} y={cy - 100} width="200" height="200" preserveAspectRatio="xMidYMid slice" />
            </g>

            {/* Planets in the FRONT (In front of the sun) */}
            {PLANETS.map((p, i) => {
              const sin = Math.sin(angles[i]);
              if (sin <= 0) return null; // Only draw planets in front of the sun
              const px = cx + Math.cos(angles[i]) * p.orbitRadius;
              const py = cy + sin * p.orbitRadius * 0.55;
              return <PlanetSVG key={p.id} planet={p} x={px} y={py} angle={angles[i]} onClick={handlePlanetClick} isSelected={selectedPlanet?.id === p.id} />;
            })}
            {PLANETS.map((p, i) => {
              const sin = Math.sin(angles[i]);
              if (sin <= 0) return null;
              const px = cx + Math.cos(angles[i]) * p.orbitRadius;
              const py = cy + sin * p.orbitRadius * 0.55;
              return <text key={`n-front-${p.id}`} x={px} y={py + p.radius + 12} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" style={{ pointerEvents: 'none', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}>{lang === 'TH' ? p.nameTH : p.nameEN}</text>;
            })}
          </svg>
          </div>
          {selectedPlanet && mode === 'orbit' && <InfoPanel planet={selectedPlanet} lang={lang} onClose={() => setSelectedPlanet(null)} />}
          {mode === 'compare' && <CompareMode lang={lang} />}
          {mode === 'quiz' && <QuizMode lang={lang} onExit={() => setMode('orbit')} />}
        </div>
      </div>
    </div>
  );
}
