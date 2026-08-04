import React, { useState, useEffect } from "react";
import { useI18n } from "../i18n/i18n";

const SUBSTANCES = [
  { id: 'water', ph: 7.0 },
  { id: 'lemon', ph: 2.2 },
  { id: 'coffee', ph: 5.0 },
  { id: 'milk', ph: 6.6 },
  { id: 'blood', ph: 7.4 },
  { id: 'soap', ph: 9.5 },
  { id: 'bleach', ph: 12.5 },
];

const CHALLENGES = [
  { 
    id: 1, substance: 'water', targetMin: 11, targetMax: 14,
    title: 'Level 1: Basic Solution',
    desc: 'Make the solution highly basic (pH > 11).'
  },
  { 
    id: 2, substance: 'lemon', targetMin: 6.8, targetMax: 7.2,
    title: 'Level 2: Neutralize Acid',
    desc: 'Neutralize the Lemon Juice to reach pH 7.0.'
  },
  { 
    id: 3, substance: 'soap', targetMin: 0, targetMax: 3,
    title: 'Level 3: Highly Acidic',
    desc: 'Turn the soap highly acidic (pH < 3).'
  },
  { 
    id: 4, substance: 'coffee', targetMin: 6.8, targetMax: 7.2,
    title: 'Level 4: Neutralize Coffee',
    desc: 'Neutralize the Coffee to reach pH 7.0.'
  },
  { 
    id: 5, substance: 'bleach', targetMin: 6.8, targetMax: 7.2,
    title: 'Level 5: Neutralize Base',
    desc: 'Neutralize the Bleach to reach pH 7.0.'
  },
];

export default function CustomPHLab({ onClose }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('free'); // 'free' or 'challenge'
  const [level, setLevel] = useState(0);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  const [currentSubstance, setCurrentSubstance] = useState('water');
  const [addedAcid, setAddedAcid] = useState(0);
  const [addedBase, setAddedBase] = useState(0);
  const [addedWater, setAddedWater] = useState(0);
  const [isDropping, setIsDropping] = useState(null);

  const initialVolume = 100;
  const maxVolume = 500;

  // Math
  const getSubstanceConc = (id) => {
      const sub = SUBSTANCES.find(s => s.id === id) || SUBSTANCES[0];
      const h = Math.pow(10, -sub.ph);
      const oh = Math.pow(10, -(14 - sub.ph));
      return { h, oh };
  };

  const initialConc = getSubstanceConc(currentSubstance);
  const initialMolesH = (initialVolume / 1000) * initialConc.h;
  const initialMolesOH = (initialVolume / 1000) * initialConc.oh;
  const addedMolesH = (addedAcid / 1000) * 0.1;
  const addedMolesOH = (addedBase / 1000) * 0.1;
  const totalMolesH = initialMolesH + addedMolesH;
  const totalMolesOH = initialMolesOH + addedMolesOH;

  const netH = totalMolesH - totalMolesOH;
  const totalVolML = initialVolume + addedAcid + addedBase + addedWater;
  const vTotal = totalVolML / 1000;

  let currentPH = 7.0;
  if (netH > 0) {
      const concH = (netH / vTotal) + 1e-7;
      currentPH = -Math.log10(concH);
  } else if (netH < 0) {
      const concOH = (-netH / vTotal) + 1e-7;
      currentPH = 14 + Math.log10(concOH);
  }
  currentPH = Math.max(0, Math.min(14, currentPH));

  // Check Challenge Success
  useEffect(() => {
    if (mode === 'challenge' && !challengeSuccess) {
      const c = CHALLENGES[level];
      if (currentPH >= c.targetMin && currentPH <= c.targetMax) {
        setChallengeSuccess(true);
      }
    }
  }, [currentPH, mode, level, challengeSuccess]);

  // Visuals
  const hue = (currentPH / 14) * 280;
  const liquidColor = `hsla(${hue}, 90%, 55%, 0.8)`;
  const liquidHeight = Math.min(100, (totalVolML / maxVolume) * 100);

  const handleAdd = (type) => {
    if (totalVolML >= maxVolume) return;
    setIsDropping(type);
    setTimeout(() => setIsDropping(null), 300);
    if (type === 'acid') setAddedAcid(v => v + 10);
    if (type === 'base') setAddedBase(v => v + 10);
    if (type === 'water') setAddedWater(v => v + 10);
  };

  const resetLab = () => {
    setAddedAcid(0);
    setAddedBase(0);
    setAddedWater(0);
  };

  const changeSubstance = (id) => {
    setCurrentSubstance(id);
    resetLab();
  };

  const loadChallenge = (lvl) => {
    setLevel(lvl);
    setChallengeSuccess(false);
    setCurrentSubstance(CHALLENGES[lvl].substance);
    resetLab();
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'challenge') {
      loadChallenge(0);
    } else {
      setChallengeSuccess(false);
      resetLab();
    }
  };

  const activeChallenge = CHALLENGES[level];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Inter", sans-serif', background: '#0f172a', color: 'white' }}>
      
      {/* Header */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧪</span> {t('lab.ph.title')}
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            {t('lab.ph.desc')}
          </p>
        </div>
        
        {/* Mode Toggle & Lang */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => toggleMode('free')} style={{ background: mode === 'free' ? '#3b82f6' : 'transparent', color: mode === 'free' ? 'white' : '#94a3b8', border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('lab.ph.modeFree')}
            </button>
            <button onClick={() => toggleMode('challenge')} style={{ background: mode === 'challenge' ? '#f59e0b' : 'transparent', color: mode === 'challenge' ? 'white' : '#94a3b8', border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('lab.ph.modeChallenge')}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', padding: '3px' }}>
            
            
          </div>
          
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '20px', overflow: 'hidden' }}>
        
        {/* Left Control Panel */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: '5px' }}>
          
          {mode === 'free' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#cbd5e1' }}>{t('lab.ph.substances')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {SUBSTANCES.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => changeSubstance(s.id)}
                    style={{
                      background: currentSubstance === s.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                      border: currentSubstance === s.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                      color: currentSubstance === s.id ? '#60a5fa' : '#cbd5e1',
                      padding: '8px 12px', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    {t('lab.ph.sub_' + s.id)} (pH ~{s.ph})
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'challenge' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '15px' }}>
              <div style={{ display: 'inline-block', background: '#f59e0b', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px', marginBottom: '8px', textTransform: 'uppercase' }}>
                {t('lab.ph.challenge_' + activeChallenge.id + '_title')}
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#fcd34d' }}>{t('lab.ph.challenge_' + activeChallenge.id + '_desc')}</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px dashed #f59e0b' }}>
                <span style={{ fontSize: '12px', color: '#fbbf24' }}>{t('lab.ph.targetPH')} </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{activeChallenge.targetMin} - {activeChallenge.targetMax}</span>
              </div>
            </div>
          )}

          {/* Add Liquids */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#cbd5e1' }}>{t('lab.ph.addLiquids')}</h3>
            
            <button onClick={() => handleAdd('acid')} disabled={totalVolML >= maxVolume || challengeSuccess} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', cursor: challengeSuccess ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '13px', opacity: (totalVolML >= maxVolume || challengeSuccess) ? 0.5 : 1 }}>
              {t('lab.ph.addAcid')}
            </button>
            <button onClick={() => handleAdd('water')} disabled={totalVolML >= maxVolume || challengeSuccess} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 'bold', cursor: challengeSuccess ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '13px', opacity: (totalVolML >= maxVolume || challengeSuccess) ? 0.5 : 1 }}>
              {t('lab.ph.addWater')}
            </button>
            <button onClick={() => handleAdd('base')} disabled={totalVolML >= maxVolume || challengeSuccess} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 'bold', cursor: challengeSuccess ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '13px', opacity: (totalVolML >= maxVolume || challengeSuccess) ? 0.5 : 1 }}>
              {t('lab.ph.addBase')}
            </button>

            <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('lab.ph.totalVol')}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{Math.round(totalVolML)} mL</span>
            </div>
            
            <button onClick={resetLab} style={{ width: '100%', padding: '10px', marginTop: '15px', borderRadius: '8px', border: 'none', background: '#334155', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
              {t('lab.ph.reset')}
            </button>
          </div>

          {/* pH Scale Legend */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#cbd5e1' }}>{t('lab.ph.indicator')}</h3>
            <div style={{ display: 'flex', height: '16px', borderRadius: '4px', background: 'linear-gradient(to right, #ff0000, #ff8c00, #ffd700, #00ff00, #00ced1, #0000ff, #8a2be2)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
              <span>0 ({t('lab.ph.acid')})</span>
              <span>7 ({t('lab.ph.neutral')})</span>
              <span>14 ({t('lab.ph.base')})</span>
            </div>
          </div>
        </div>

        {/* Right Lab Area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '30px', background: 'radial-gradient(circle at center, #1e293b, #0f172a)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          {/* Challenge Success Overlay */}
          {challengeSuccess && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
              <div style={{ background: '#1e293b', border: '2px solid #10b981', borderRadius: '16px', padding: '30px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxWidth: '400px' }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎉</div>
                <h2 style={{ color: '#10b981', margin: '0 0 10px 0' }}>{t('lab.ph.success')}</h2>
                <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
                  {lang === 'th' ? 'คุณผสมสารจนได้ค่า pH ที่ตรงตามเป้าหมายแล้ว!' : 'You successfully reached the target pH!'}
                </p>
                {level < CHALLENGES.length - 1 ? (
                  <button onClick={() => loadChallenge(level + 1)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                    {t('lab.ph.nextLevel')}
                  </button>
                ) : (
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '18px' }}>
                    {lang === 'th' ? 'คุณผ่านทุกด่านแล้ว ยอดเยี่ยมมาก! 🏆' : 'All challenges completed! Amazing! 🏆'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* pH Meter Display */}
          <div style={{ position: 'absolute', top: '20px', right: '30px', background: '#000', padding: '12px 20px', borderRadius: '10px', border: '2px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>pH METER</div>
            <div style={{ fontFamily: 'monospace', fontSize: '38px', color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)', fontWeight: 'bold' }}>
              {currentPH.toFixed(2)}
            </div>
          </div>

          {/* Beaker Info Label */}
          <div style={{ position: 'absolute', bottom: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#cbd5e1' }}>
              {lang === 'th' ? 'สารละลายในบีกเกอร์:' : 'Beaker Contents:'} 
              <span style={{ color: 'white', fontWeight: 'bold', marginLeft: '5px' }}>
                {SUBSTANCES.find(s => s.id === currentSubstance)?.name[lang]} (100mL)
                {addedAcid > 0 && ` + ${t('lab.ph.acid')} (${addedAcid}mL)`}
                {addedWater > 0 && ` + H₂O (${addedWater}mL)`}
                {addedBase > 0 && ` + ${t('lab.ph.base')} (${addedBase}mL)`}
              </span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', border: `1px solid ${liquidColor}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: liquidColor }}></div>
              {lang === 'th' ? 'สีน้ำเปลี่ยนตามค่า Universal Indicator (บอกค่า pH)' : 'Color changes based on Universal Indicator (pH)'}
            </div>
          </div>

          {/* pH Probe */}
          <div style={{ position: 'absolute', right: '50%', transform: 'translateX(90px)', bottom: '50px', width: '10px', height: '250px', background: 'linear-gradient(to right, #94a3b8, #cbd5e1)', borderRadius: '5px', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: '-100px', left: '3px', width: '4px', height: '100px', background: '#334155' }}></div>
            <div style={{ position: 'absolute', bottom: '-15px', left: '-3px', width: '16px', height: '30px', background: '#64748b', borderRadius: '8px' }}></div>
          </div>

          {/* Dropper Animation */}
          {isDropping && (
            <div style={{
              position: 'absolute',
              bottom: `${100 + (maxVolume / 500) * 180 + 40}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '20px',
              background: isDropping === 'acid' ? '#ef4444' : isDropping === 'base' ? '#8b5cf6' : '#3b82f6',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              animation: 'dropFall 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards',
              zIndex: 15
            }} />
          )}

          {/* Dropper Tip */}
          <div style={{ position: 'absolute', bottom: '310px', left: '50%', transform: 'translateX(-50%)', width: '18px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '0 0 8px 8px', border: '2px solid rgba(255,255,255,0.4)', borderTop: 'none' }}></div>

          {/* Beaker */}
          <div style={{ 
            position: 'relative', 
            width: '220px', 
            height: '260px', 
            background: 'rgba(255,255,255,0.02)',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: 'none',
            borderRadius: '0 0 30px 30px',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden',
            backdropFilter: 'blur(2px)'
          }}>
            {/* Liquid */}
            <div style={{
              width: '100%',
              height: `${liquidHeight}%`,
              background: liquidColor,
              transition: 'height 0.3s ease, background-color 0.5s ease',
              position: 'relative',
              boxShadow: 'inset 0 10px 20px rgba(255,255,255,0.15)',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'rgba(255,255,255,0.3)',
              }}></div>
            </div>

            {/* Beaker Markings */}
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: 0, bottom: `${(i+1)*20}%`, width: '25px', height: '2px', background: 'rgba(255,255,255,0.3)' }}>
                <span style={{ position: 'absolute', left: '30px', top: '-8px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{(i+1)*100}</span>
              </div>
            ))}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dropFall {
              0% { transform: translate(-50%, -20px); opacity: 1; height: 20px; }
              80% { opacity: 1; height: 25px; }
              100% { transform: translate(-50%, 150px); opacity: 0; height: 10px; }
            }
          `}} />

        </div>
      </div>
    </div>
  );
}
