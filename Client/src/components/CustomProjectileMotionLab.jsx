import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from "../i18n/i18n";

// ==========================================
// Labels (Thai & English)
// ==========================================


const GRAVITY_PRESETS = [
  { id: 'earth', g: 9.81, emoji: '🌍' },
  { id: 'moon', g: 1.62, emoji: '🌙' },
  { id: 'mars', g: 3.72, emoji: '🔴' },
  { id: 'jupiter', g: 24.79, emoji: '🟠' },
  { id: 'noGravity', g: 0.1, emoji: '🚀' },
];

const QUIZ_DATA_TH = [
  { q: 'ถ้ายิงด้วยมุม 45° ความเร็ว 50 m/s บนโลก (g=9.81) ระยะจะอยู่ประมาณเท่าไร?', options: ['~128 ม.', '~255 ม.', '~510 ม.', '~64 ม.'], correct: 1 },
  { q: 'มุมยิงใดให้ระยะไกลที่สุด? (ไม่มีแรงต้านอากาศ)', options: ['30°', '45°', '60°', '90°'], correct: 1 },
  { q: 'ถ้าเพิ่มความเร็วต้นเป็น 2 เท่า ระยะจะเพิ่มเป็นกี่เท่า?', options: ['2 เท่า', '3 เท่า', '4 เท่า', '8 เท่า'], correct: 2 },
  { q: 'แรงโน้มถ่วงมีผลต่อการเคลื่อนที่ในแนวใด?', options: ['แนวนอนเท่านั้น', 'แนวตั้งเท่านั้น', 'ทั้งสองแนว', 'ไม่มีผล'], correct: 1 },
  { q: 'มุม 30° กับ 60° ให้ระยะเท่ากัน เพราะอะไร?', options: ['sin(2×30°)=sin(2×60°)', 'cos(30°)=cos(60°)', 'tan(30°)=tan(60°)', 'ไม่เท่ากัน'], correct: 0 },
  { q: 'ที่จุดสูงสุดของวิถี ความเร็วในแนวตั้งเท่ากับเท่าไร?', options: ['เท่ากับความเร็วต้น', 'เท่ากับ 0', 'เท่ากับ g', 'ไม่แน่นอน'], correct: 1 },
];

const QUIZ_DATA_EN = [
  { q: 'If launched at 45° with 50 m/s on Earth (g=9.81), what is the approximate range?', options: ['~128 m', '~255 m', '~510 m', '~64 m'], correct: 1 },
  { q: 'Which launch angle gives maximum range? (no air resistance)', options: ['30°', '45°', '60°', '90°'], correct: 1 },
  { q: 'If initial velocity is doubled, the range increases by?', options: ['2x', '3x', '4x', '8x'], correct: 2 },
  { q: 'Gravity affects motion in which direction?', options: ['Horizontal only', 'Vertical only', 'Both', 'None'], correct: 1 },
  { q: 'Angles 30° and 60° give the same range because?', options: ['sin(2×30°)=sin(2×60°)', 'cos(30°)=cos(60°)', 'tan(30°)=tan(60°)', 'They don\'t'], correct: 0 },
  { q: 'At the highest point, the vertical velocity is?', options: ['Equal to initial velocity', 'Zero', 'Equal to g', 'Uncertain'], correct: 1 },
];

// ==========================================
// Star Background
// ==========================================
const StarField = React.memo(() => {
  const stars = useRef(
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.5 + 0.1,
      twinkle: Math.random() * 3 + 2,
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
// Formula Panel
// ==========================================
const FormulaPanel = ({ lang }) => {
  return (
    <div style={{ position: 'absolute', right: 15, bottom: 15, width: 280, background: 'rgba(15,23,42,0.95)', borderRadius: 16, padding: 16, zIndex: 15, border: '1px solid #334155', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <h3 style={{ color: '#fbbf24', fontSize: 14, margin: '0 0 12px 0' }}>📐 {lang === 'TH' ? 'สูตรการเคลื่อนที่แบบโปรเจกไทล์' : 'Projectile Motion Formulas'}</h3>
      {[
        { label: lang === 'TH' ? 'ตำแหน่งแนวนอน' : 'Horizontal Position', formula: 'x = v₀ cos(θ) × t' },
        { label: lang === 'TH' ? 'ตำแหน่งแนวตั้ง' : 'Vertical Position', formula: 'y = v₀ sin(θ) × t - ½gt²' },
        { label: lang === 'TH' ? 'ระยะไกลสุด' : 'Range', formula: 'R = v₀² sin(2θ) / g' },
        { label: lang === 'TH' ? 'ความสูงสูงสุด' : 'Max Height', formula: 'H = v₀² sin²(θ) / 2g' },
        { label: lang === 'TH' ? 'เวลาบิน' : 'Flight Time', formula: 'T = 2v₀ sin(θ) / g' },
      ].map(item => (
        <div key={item.label} style={{ marginBottom: 8 }}>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>{item.label}</div>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', background: 'rgba(30,41,59,0.8)', padding: '4px 8px', borderRadius: 6, marginTop: 2 }}>{item.formula}</div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// Quiz Mode
// ==========================================
const QuizMode = ({ lang, onExit }) => {
  const L = LABELS[lang];
  const quizData = lang === 'TH' ? QUIZ_DATA_TH : QUIZ_DATA_EN;
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (idx) => {
    if (feedback !== null) return;
    const isCorrect = idx === quizData[qi].correct;
    if (isCorrect) setScore(s => s + 1);
    setFeedback({ isCorrect, correctIdx: quizData[qi].correct });
  };

  const nextQuestion = () => {
    if (qi < quizData.length - 1) {
      setQi(q => q + 1);
      setFeedback(null);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ color: 'white', fontSize: 24, margin: 0 }}>{L.finish}</h2>
        <p style={{ color: '#fbbf24', fontSize: 28, fontWeight: 'bold', margin: 0 }}>{L.congrats} {score}/{quizData.length}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setQi(0); setScore(0); setFinished(false); setFeedback(null); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>{L.reset}</button>
          <button onClick={onExit} style={{ background: '#475569', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>{L.close}</button>
        </div>
      </div>
    );
  }

  const current = quizData[qi];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <div style={{ color: '#94a3b8', fontSize: 14 }}>{L.score}: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{score}/{quizData.length}</span> — {lang === 'TH' ? 'ข้อ' : 'Q'} {qi + 1}/{quizData.length}</div>
      <h2 style={{ color: 'white', fontSize: 16, margin: 0, textAlign: 'center', maxWidth: 500, lineHeight: 1.5 }}>{current.q}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 420, marginTop: 10 }}>
        {current.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} style={{
            background: feedback ? (i === feedback.correctIdx ? '#22c55e' : (feedback.isCorrect ? '#334155' : '#334155')) : '#1e293b',
            color: 'white', border: feedback && i === feedback.correctIdx ? '2px solid #22c55e' : '2px solid #475569', borderRadius: 10, padding: '12px 16px',
            cursor: feedback ? 'default' : 'pointer', fontSize: 13, fontWeight: 'bold',
            transition: 'all 0.2s', opacity: feedback && i !== feedback.correctIdx ? 0.5 : 1,
          }}>
            {opt}
          </button>
        ))}
      </div>
      {feedback && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: feedback.isCorrect ? '#22c55e' : '#ef4444', marginBottom: 10 }}>
            {feedback.isCorrect ? L.correct : `${L.wrong} "${current.options[feedback.correctIdx]}"`}
          </div>
          <button onClick={nextQuestion} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
            {qi < quizData.length - 1 ? L.nextQ : L.finish}
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CSS Injection
// ==========================================
const projStyle = document.createElement('style');
projStyle.innerText = `@keyframes twinkle { 0%{opacity:0.2} 100%{opacity:1} } @keyframes cannonFlash { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(2)} }`;
document.head.appendChild(projStyle);

// ==========================================
// Main Component
// ==========================================
export default function CustomProjectileMotionLab({ onClose }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('free'); // free, challenge, quiz
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(50);
  const [gravityPreset, setGravityPreset] = useState('earth');
  const [isPaused, setIsPaused] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showTrail, setShowTrail] = useState(true);

  // Simulation state
  const [isFlying, setIsFlying] = useState(false);
  const [projectilePos, setProjectilePos] = useState(null);
  const [trail, setTrail] = useState([]);
  const [measurements, setMeasurements] = useState(null);
  const [flashFire, setFlashFire] = useState(false);

  // Challenge mode
  const [targetX, setTargetX] = useState(300);
  const [challengeFeedback, setChallengeFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const L = LABELS[lang];
  const g = GRAVITY_PRESETS.find(p => p.id === gravityPreset)?.g || 9.81;

  // Canvas dimensions (SVG viewBox)
  const W = 1200;
  const H = 600;
  const groundY = H - 80;
  const launchX = 80;
  const launchY = groundY;
  const scale = 1.8; // pixels per meter

  // Calculate theoretical values
  const angleRad = (angle * Math.PI) / 180;
  const theoreticalRange = (velocity * velocity * Math.sin(2 * angleRad)) / g;
  const theoreticalMaxHeight = (velocity * velocity * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * g);
  const theoreticalFlightTime = (2 * velocity * Math.sin(angleRad)) / g;

  // Generate random target for challenge
  const newTarget = useCallback(() => {
    const maxRange = (100 * 100 * Math.sin(2 * Math.PI / 4)) / g;
    setTargetX(100 + Math.random() * Math.min(maxRange * scale * 0.7, W - 300));
    setChallengeFeedback(null);
    setAttempts(0);
  }, [g]);

  useEffect(() => {
    if (mode === 'challenge') newTarget();
  }, [mode, newTarget]);

  // Fire the projectile
  const fire = useCallback(() => {
    if (isFlying) return;
    setIsFlying(true);
    setTrail([]);
    setProjectilePos(null);
    setMeasurements(null);
    setChallengeFeedback(null);
    setFlashFire(true);
    setTimeout(() => setFlashFire(false), 300);
    if (mode === 'challenge') setAttempts(a => a + 1);

    startTimeRef.current = performance.now();
    pausedTimeRef.current = 0;

    const angleR = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleR);
    const vy = velocity * Math.sin(angleR);
    let maxH = 0;
    let trailPts = [];
    let lastPauseCheck = performance.now();

    const step = (now) => {
      const elapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      const t = elapsed * 1.5; // speed up simulation

      const x = vx * t;
      const y = vy * t - 0.5 * g * t * t;

      if (y > maxH) maxH = y;

      const px = launchX + x * scale;
      const py = launchY - y * scale;

      if (y < 0 && t > 0.01) {
        // Landed
        const landT = (2 * vy) / g;
        const landX = vx * landT;
        const landPx = launchX + landX * scale;
        
        setProjectilePos({ x: landPx, y: launchY });
        trailPts.push({ x: landPx, y: launchY });
        setTrail([...trailPts]);
        setIsFlying(false);
        setMeasurements({
          maxHeight: maxH,
          range: landX,
          flightTime: landT,
          finalX: landPx,
          finalY: launchY,
        });

        // Challenge check
        if (mode === 'challenge') {
          const targetMeters = (targetX - launchX) / scale;
          if (Math.abs(landX - targetMeters) < 15) {
            setChallengeFeedback('hit');
          } else {
            setChallengeFeedback('miss');
          }
        }
        return;
      }

      if (px > W + 50 || py < -100) {
        setIsFlying(false);
        return;
      }

      setProjectilePos({ x: px, y: py });
      trailPts.push({ x: px, y: py });
      if (trailPts.length % 2 === 0) setTrail([...trailPts]);

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
  }, [angle, velocity, g, isFlying, mode, targetX]);

  const resetSim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsFlying(false);
    setProjectilePos(null);
    setTrail([]);
    setMeasurements(null);
    setChallengeFeedback(null);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Draw cannon direction
  const cannonLen = 40;
  const cannonEndX = launchX + Math.cos(angleRad) * cannonLen;
  const cannonEndY = launchY - Math.sin(angleRad) * cannonLen;

  // Predicted trajectory (dashed)
  const predictedPath = [];
  if (!isFlying) {
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    for (let t = 0; t < theoreticalFlightTime * 1.05; t += theoreticalFlightTime / 40) {
      const x = vx * t;
      const y = vy * t - 0.5 * g * t * t;
      if (y < 0 && t > 0) break;
      predictedPath.push({ x: launchX + x * scale, y: launchY - y * scale });
    }
    // Add landing point
    const landX = vx * theoreticalFlightTime;
    predictedPath.push({ x: launchX + landX * scale, y: launchY });
  }
  const predictedD = predictedPath.length > 1 ? `M ${predictedPath.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  // Trail path
  const trailD = trail.length > 1 ? `M ${trail.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  // Draw grid lines
  const gridLines = [];
  for (let i = 0; i <= 10; i++) {
    const x = launchX + i * ((W - launchX - 40) / 10);
    gridLines.push({ x1: x, y1: groundY, x2: x, y2: 30, label: `${Math.round((x - launchX) / scale)}m` });
  }
  for (let i = 0; i <= 5; i++) {
    const y = groundY - i * ((groundY - 30) / 5);
    gridLines.push({ x1: launchX, y1: y, x2: W - 20, y2: y, labelY: `${Math.round((groundY - y) / scale)}m`, isH: true });
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#030712', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StarField />

      {/* Top Bar */}
      <div style={{ background: 'rgba(15,23,42,0.9)', padding: '6px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid #1e293b', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 14, background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎯 {L.title}</h2>
          <div style={{ display: 'flex', gap: 3, background: '#1e293b', borderRadius: 20, padding: '2px 4px' }}>
            {[['free', '🎮'], ['challenge', '🎯'], ['quiz', '📝']].map(([m, icon]) => (
              <button key={m} onClick={() => { setMode(m); resetSim(); }} style={{ background: mode === m ? '#f97316' : 'transparent', border: 'none', color: mode === m ? 'white' : '#94a3b8', padding: '3px 10px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}>
                {icon} {L[`mode_${m}`]?.replace(/[^\w\s\u0E00-\u0E7F]/g, '').trim()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowFormulas(!showFormulas)} style={{ background: showFormulas ? '#6366f1' : '#334155', border: 'none', color: 'white', padding: '4px 10px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}>
            {showFormulas ? L.hideFormulas : L.showFormulas}
          </button>
          
          <button onClick={onClose} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '4px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>{L.close}</button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Control Panel */}
        {mode !== 'quiz' && (
          <div style={{ width: 200, background: 'rgba(15,23,42,0.8)', borderRight: '1px solid #1e293b', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', zIndex: 10, flexShrink: 0 }}>
            {/* Angle */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>{L.angle}: <span style={{ color: '#f97316', fontWeight: 'bold' }}>{angle}{L.deg}</span></label>
              <input type="range" min="5" max="85" value={angle} onChange={e => { setAngle(+e.target.value); resetSim(); }}
                style={{ width: '100%', accentColor: '#f97316' }} disabled={isFlying} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 9 }}>
                <span>5°</span><span>45°</span><span>85°</span>
              </div>
            </div>

            {/* Velocity */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 4 }}>{L.velocity}: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{velocity} {L.ms}</span></label>
              <input type="range" min="10" max="100" value={velocity} onChange={e => { setVelocity(+e.target.value); resetSim(); }}
                style={{ width: '100%', accentColor: '#3b82f6' }} disabled={isFlying} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 9 }}>
                <span>10</span><span>55</span><span>100</span>
              </div>
            </div>

            {/* Gravity Presets */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: 11, display: 'block', marginBottom: 6 }}>{L.gravity}: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{g} m/s²</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {GRAVITY_PRESETS.map(p => (
                  <button key={p.id} onClick={() => { setGravityPreset(p.id); resetSim(); }}
                    disabled={isFlying}
                    style={{
                      background: gravityPreset === p.id ? '#22c55e' : '#1e293b',
                      border: gravityPreset === p.id ? '1px solid #22c55e' : '1px solid #334155',
                      color: 'white', padding: '3px 8px', borderRadius: 12, cursor: isFlying ? 'default' : 'pointer',
                      fontSize: 10, fontWeight: 'bold', opacity: isFlying ? 0.5 : 1,
                    }}>
                    {p.emoji} {L[p.id]}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '4px 0' }} />

            {/* Fire & Reset */}
            <button onClick={fire} disabled={isFlying}
              style={{
                background: isFlying ? '#475569' : 'linear-gradient(135deg, #f97316, #ef4444)',
                border: 'none', color: 'white', padding: '10px', borderRadius: 12,
                cursor: isFlying ? 'default' : 'pointer', fontSize: 14, fontWeight: 'bold',
                boxShadow: isFlying ? 'none' : '0 4px 15px rgba(249,115,22,0.4)',
                transition: 'all 0.2s',
              }}>
              {L.fire}
            </button>
            <button onClick={resetSim}
              style={{ background: '#334155', border: 'none', color: 'white', padding: '6px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
              {L.reset}
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '4px 0' }} />

            {/* Measurements */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 6, fontWeight: 'bold' }}>{lang === 'TH' ? '📊 ค่าที่คำนวณ (ทฤษฎี)' : '📊 Calculated (Theory)'}</div>
              {[
                { label: L.maxHeight, value: `${theoreticalMaxHeight.toFixed(1)} ${L.m}`, color: '#a78bfa' },
                { label: L.range, value: `${theoreticalRange.toFixed(1)} ${L.m}`, color: '#34d399' },
                { label: L.flightTime, value: `${theoreticalFlightTime.toFixed(2)} ${L.s}`, color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#64748b', fontSize: 10 }}>{item.label}</span>
                  <span style={{ color: item.color, fontSize: 11, fontWeight: 'bold' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {measurements && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: 10 }}>
                <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 6, fontWeight: 'bold' }}>{lang === 'TH' ? '✅ ค่าจริง (จำลอง)' : '✅ Actual (Simulated)'}</div>
                {[
                  { label: L.maxHeight, value: `${measurements.maxHeight.toFixed(1)} ${L.m}`, color: '#a78bfa' },
                  { label: L.range, value: `${measurements.range.toFixed(1)} ${L.m}`, color: '#34d399' },
                  { label: L.flightTime, value: `${measurements.flightTime.toFixed(2)} ${L.s}`, color: '#fbbf24' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: '#64748b', fontSize: 10 }}>{item.label}</span>
                    <span style={{ color: item.color, fontSize: 11, fontWeight: 'bold' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
            {/* Grid */}
            {gridLines.map((gl, i) => (
              <g key={i}>
                <line x1={gl.x1} y1={gl.y1} x2={gl.x2 || gl.x1} y2={gl.y2 || gl.y1} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" />
                {gl.label && <text x={gl.x1} y={groundY + 15} textAnchor="middle" fill="#475569" fontSize="8">{gl.label}</text>}
                {gl.labelY && <text x={launchX - 8} y={gl.y1 + 3} textAnchor="end" fill="#475569" fontSize="8">{gl.labelY}</text>}
              </g>
            ))}

            {/* Ground */}
            <rect x="0" y={groundY} width={W} height={H - groundY} fill="#1a2e1a" />
            <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#22c55e" strokeWidth="2" />
            {/* Grass tufts */}
            {Array.from({ length: 40 }, (_, i) => {
              const gx = i * (W / 40) + Math.random() * 10;
              return <line key={`grass-${i}`} x1={gx} y1={groundY} x2={gx + (Math.random() - 0.5) * 6} y2={groundY - 4 - Math.random() * 6} stroke="#4ade80" strokeWidth="1" opacity="0.5" />;
            })}

            {/* Predicted trajectory */}
            {!isFlying && predictedD && (
              <path d={predictedD} fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
            )}

            {/* Trail */}
            {showTrail && trailD && (
              <>
                <path d={trailD} fill="none" stroke="url(#trailGrad)" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </>
            )}

            {/* Target (challenge mode) */}
            {mode === 'challenge' && (
              <g>
                <rect x={targetX - 12} y={groundY - 40} width="24" height="40" fill="#ef4444" rx="3" opacity="0.8" />
                <circle cx={targetX} cy={groundY - 25} r="10" fill="white" stroke="#ef4444" strokeWidth="2" />
                <circle cx={targetX} cy={groundY - 25} r="6" fill="#ef4444" />
                <circle cx={targetX} cy={groundY - 25} r="3" fill="white" />
                <text x={targetX} y={groundY - 45} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
                  🎯 {Math.round((targetX - launchX) / scale)}{L.m}
                </text>
              </g>
            )}

            {/* Cannon / Launcher - Polished SVG */}
            <defs>
              <linearGradient id="barrelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="40%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="barrelInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <radialGradient id="wheelGrad" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </radialGradient>
              <radialGradient id="baseGrad" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#374151" />
              </radialGradient>
              <radialGradient id="flashGrad" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="30%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g>
              {/* Platform / Base plate */}
              <rect x={launchX - 22} y={launchY - 4} width="44" height="8" rx="3" fill="#4b5563" stroke="#6b7280" strokeWidth="1" />
              {/* Wheels */}
              <circle cx={launchX - 14} cy={launchY + 6} r="8" fill="url(#wheelGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx={launchX - 14} cy={launchY + 6} r="2" fill="#94a3b8" />
              <line x1={launchX - 14 - 5} y1={launchY + 6} x2={launchX - 14 + 5} y2={launchY + 6} stroke="#64748b" strokeWidth="1" />
              <line x1={launchX - 14} y1={launchY + 6 - 5} x2={launchX - 14} y2={launchY + 6 + 5} stroke="#64748b" strokeWidth="1" />
              <circle cx={launchX + 14} cy={launchY + 6} r="8" fill="url(#wheelGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx={launchX + 14} cy={launchY + 6} r="2" fill="#94a3b8" />
              <line x1={launchX + 14 - 5} y1={launchY + 6} x2={launchX + 14 + 5} y2={launchY + 6} stroke="#64748b" strokeWidth="1" />
              <line x1={launchX + 14} y1={launchY + 6 - 5} x2={launchX + 14} y2={launchY + 6 + 5} stroke="#64748b" strokeWidth="1" />
              {/* Pivot */}
              <circle cx={launchX} cy={launchY} r="12" fill="url(#baseGrad)" stroke="#94a3b8" strokeWidth="2" />
              {/* Barrel (rotates) */}
              <g transform={`rotate(${-angle}, ${launchX}, ${launchY})`}>
                {/* Outer barrel */}
                <rect x={launchX} y={launchY - 7} width={cannonLen + 10} height="14" rx="4" fill="url(#barrelGrad)" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Inner barrel */}
                <rect x={launchX + 4} y={launchY - 4} width={cannonLen + 2} height="8" rx="3" fill="url(#barrelInner)" />
                {/* Metal rings */}
                <rect x={launchX + 10} y={launchY - 7.5} width="3" height="15" rx="1" fill="#94a3b8" opacity="0.5" />
                <rect x={launchX + 25} y={launchY - 7.5} width="3" height="15" rx="1" fill="#94a3b8" opacity="0.5" />
                <rect x={launchX + 40} y={launchY - 7.5} width="3" height="15" rx="1" fill="#94a3b8" opacity="0.4" />
                {/* Muzzle ring */}
                <rect x={launchX + cannonLen + 5} y={launchY - 8.5} width="5" height="17" rx="2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.5" />
                {/* Shine line */}
                <line x1={launchX + 6} y1={launchY - 5} x2={launchX + cannonLen + 5} y2={launchY - 5} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              </g>
              {/* Pivot bolt */}
              <circle cx={launchX} cy={launchY} r="5" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx={launchX} cy={launchY} r="2" fill="#94a3b8" />
              {/* Muzzle flash */}
              {flashFire && (
                <circle cx={cannonEndX + 15} cy={cannonEndY} r="25" fill="url(#flashGrad)" style={{ animation: 'cannonFlash 0.3s ease-out forwards' }} />
              )}
            </g>
            {/* Angle arc */}
            {!isFlying && (
              <g>
                <path d={`M ${launchX + 30} ${launchY} A 30 30 0 0 0 ${launchX + 30 * Math.cos(angleRad)} ${launchY - 30 * Math.sin(angleRad)}`}
                  fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                <text x={launchX + 45 * Math.cos(angleRad / 2)} y={launchY - 45 * Math.sin(angleRad / 2)}
                  fill="#fbbf24" fontSize="13" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>
                  {angle}°
                </text>
              </g>
            )}

            {/* Projectile */}
            {projectilePos && (
              <g>
                {/* Glow */}
                <circle cx={projectilePos.x} cy={projectilePos.y} r="12" fill="#f97316" opacity="0.2" />
                <circle cx={projectilePos.x} cy={projectilePos.y} r="8" fill="#f97316" opacity="0.3" />
                {/* Ball */}
                <circle cx={projectilePos.x} cy={projectilePos.y} r="5" fill="#fbbf24" stroke="#f97316" strokeWidth="1.5" />
                {/* Highlight */}
                <circle cx={projectilePos.x - 1.5} cy={projectilePos.y - 1.5} r="2" fill="white" opacity="0.6" />
                {/* Label */}
                {!isFlying && measurements && (
                  <text x={projectilePos.x} y={projectilePos.y - 15} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
                    {measurements.range.toFixed(1)}{L.m}
                  </text>
                )}
              </g>
            )}

            {/* Max Height marker */}
            {measurements && (
              <g>
                <line x1={launchX} y1={launchY - measurements.maxHeight * scale} x2={launchX + measurements.range * scale} y2={launchY - measurements.maxHeight * scale}
                  stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
                <text x={launchX - 5} y={launchY - measurements.maxHeight * scale - 5} fill="#a78bfa" fontSize="9" textAnchor="end">
                  H={measurements.maxHeight.toFixed(1)}{L.m}
                </text>
              </g>
            )}

            {/* Velocity vectors (when not flying) */}
            {!isFlying && !projectilePos && (
              <g opacity="0.6">
                {/* Vx */}
                <line x1={launchX} y1={launchY - 2} x2={launchX + velocity * Math.cos(angleRad) * 0.8} y2={launchY - 2}
                  stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
                <text x={launchX + velocity * Math.cos(angleRad) * 0.4} y={launchY + 15} fill="#3b82f6" fontSize="9" textAnchor="middle">
                  Vx={Math.round(velocity * Math.cos(angleRad))}{L.ms}
                </text>
                {/* Vy */}
                <line x1={launchX + 2} y1={launchY} x2={launchX + 2} y2={launchY - velocity * Math.sin(angleRad) * 0.8}
                  stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrowRed)" />
                <text x={launchX + 20} y={launchY - velocity * Math.sin(angleRad) * 0.4} fill="#ef4444" fontSize="9">
                  Vy={Math.round(velocity * Math.sin(angleRad))}{L.ms}
                </text>
                <defs>
                  <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                  <marker id="arrowRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                </defs>
              </g>
            )}
          </svg>

          {/* Challenge feedback */}
          {challengeFeedback && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: challengeFeedback === 'hit' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
              padding: '20px 40px', borderRadius: 16, zIndex: 15,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                {challengeFeedback === 'hit' ? L.hit : L.miss}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                {L.attempts}: {attempts}
              </div>
              {challengeFeedback === 'hit' && (
                <button onClick={newTarget} style={{ display: 'block', margin: '12px auto 0', background: 'white', color: '#22c55e', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang === 'TH' ? '🎯 เป้าใหม่' : '🎯 New Target'}
                </button>
              )}
            </div>
          )}

          {/* Formula Panel */}
          {showFormulas && <FormulaPanel lang={lang} />}

          {/* Quiz Mode */}
          {mode === 'quiz' && <QuizMode lang={lang} onExit={() => setMode('free')} />}
        </div>
      </div>
    </div>
  );
}
