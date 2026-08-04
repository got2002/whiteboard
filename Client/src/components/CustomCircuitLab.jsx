import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useI18n } from "../i18n/i18n";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  ReactFlowProvider,
  getBezierPath,
  EdgeLabelRenderer,
  NodeResizeControl,
  BaseEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ==========================================
// 1. SVG Assets & Custom Nodes
// ==========================================

const terminalStyle = {
    background: '#fde047', 
    border: '2px solid #ca8a04', 
    width: 18, height: 18, 
    zIndex: 10,
    boxShadow: '0 0 5px rgba(234, 179, 8, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
};

// --- Universal Terminal Handle ---
const TerminalHandle = ({ id, position, style, polarity }) => (
    <>
        <Handle type="target" position={position} id={`${id}-target`} style={{ ...style, zIndex: 9 }} />
        <Handle type="source" position={position} id={`${id}-source`} style={{ ...style, zIndex: 10 }}>
            {polarity && <span style={{ pointerEvents: 'none', fontSize: '16px', fontWeight: 'bold', color: polarity === '+' ? '#b91c1c' : '#1d4ed8', lineHeight: 1, marginTop: '-2px' }}>{polarity}</span>}
        </Handle>
    </>
);

// ==========================================
// SVG Components
// ==========================================

const BatterySVG = ({ id = 'sidebar' }) => (
    <svg width="100%" height="100%" viewBox="0 0 120 48" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`batMetal-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" /><stop offset="30%" stopColor="#f1f5f9" />
          <stop offset="70%" stopColor="#cbd5e1" /><stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`batRed-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" /><stop offset="30%" stopColor="#ef4444" />
          <stop offset="70%" stopColor="#dc2626" /><stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id={`batBlack-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" /><stop offset="30%" stopColor="#64748b" />
          <stop offset="70%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x="12" y="4" width="96" height="40" rx="6" fill={`url(#batBlack-${id})`} />
      <rect x="12" y="4" width="30" height="40" rx="6" fill={`url(#batRed-${id})`} />
      <rect x="36" y="4" width="6" height="40" fill="#facc15" />
      <rect x="108" y="14" width="8" height="20" rx="3" fill={`url(#batMetal-${id})`} />
      <text x="24" y="30" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle">+</text>
      <text x="96" y="30" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle">-</text>
      <text x="65" y="30" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">SUPER CELL</text>
    </svg>
);

const BulbSVG = ({ id = 'sidebar', glowOpacity = 0, isBroken = false }) => {
    const glowRadius = 5 + (glowOpacity * 15);
    return (
        <svg width="100%" height="100%" viewBox="0 0 80 100" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id={`bulbGlow-${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity={glowOpacity} />
              <stop offset="40%" stopColor="#eab308" stopOpacity={glowOpacity * 0.8} />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
            </radialGradient>
            <filter id={`glowFilter-${id}`}>
               <feGaussianBlur stdDeviation={glowRadius} result="coloredBlur"/>
               <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <linearGradient id={`screwBase-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#64748b" /><stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          {!isBroken && glowOpacity > 0 && (
              <circle cx="40" cy="40" r="35" fill={`url(#bulbGlow-${id})`} filter={`url(#glowFilter-${id})`} />
          )}
          <path d="M 25 70 C 10 55 15 20 40 15 C 65 20 70 55 55 70 Z" 
                fill={isBroken ? "rgba(71, 85, 105, 0.4)" : "rgba(241, 245, 249, 0.2)"} 
                stroke={isBroken ? "#334155" : "#cbd5e1"} strokeWidth="2" />
          {isBroken && (
              <path d="M 30 25 L 50 45 M 50 25 L 30 45" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          )}
          <line x1="33" y1="50" x2="33" y2="70" stroke="#94a3b8" strokeWidth="2" />
          <line x1="47" y1="50" x2="47" y2="70" stroke="#94a3b8" strokeWidth="2" />
          <rect x="24" y="68" width="32" height="10" rx="2" fill={`url(#screwBase-${id})`} />
          <rect x="24" y="72" width="32" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
          <rect x="24" y="78" width="32" height="6" rx="3" fill="#475569" />
        </svg>
    );
};

const SwitchSVG = ({ id = 'sidebar', state = 'open' }) => {
    const isClosed = state === 'closed';
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 60" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`switchMetal-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id={`bladeMetal-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          
          {/* Base */}
          <rect x="10" y="30" width="80" height="20" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          
          {/* Left Post (Hinge Base) */}
          <circle cx="25" cy="40" r="7" fill={`url(#switchMetal-${id})`} stroke="#854d0e" strokeWidth="1.5" />
          <circle cx="25" cy="40" r="3" fill="#854d0e" />

          {/* Right Post (Contact Clip) */}
          <rect x="71" y="35" width="8" height="10" rx="1" fill={`url(#switchMetal-${id})`} stroke="#854d0e" strokeWidth="1" />
          <circle cx="75" cy="40" r="7" fill={`url(#switchMetal-${id})`} stroke="#854d0e" strokeWidth="1.5" />
          <circle cx="75" cy="40" r="3" fill="#854d0e" />

          {/* Blade and Handle */}
          <g style={{ 
              transformOrigin: '25px 40px', 
              transform: isClosed ? 'rotate(0deg)' : 'rotate(-40deg)', 
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}>
            <rect x="25" y="37" width="55" height="6" fill={`url(#bladeMetal-${id})`} stroke="#334155" strokeWidth="1" />
            <circle cx="25" cy="40" r="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <path d="M 80 34 L 95 36 L 95 44 L 80 46 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="76" y="34" width="6" height="12" rx="2" fill="#b91c1c" />
          </g>
          
          {/* Top of right clip (rendered over blade when closed) */}
          {isClosed && (
            <rect x="71" y="38" width="8" height="4" rx="1" fill={`url(#switchMetal-${id})`} stroke="#854d0e" strokeWidth="1" />
          )}
        </svg>
    );
};

// --- Resistor SVG ---
const ResistorSVG = ({ id = 'sidebar', resistance = 100 }) => {
    const bands = resistance <= 50 ? ['#22c55e', '#000', '#000', '#d4a574'] 
                : resistance <= 200 ? ['#8b4513', '#000', '#8b4513', '#d4a574'] 
                : ['#ef4444', '#000', '#ef4444', '#d4a574'];
    return (
        <svg width="100%" height="100%" viewBox="0 0 120 40" style={{ overflow: 'visible' }}>
          <line x1="0" y1="20" x2="25" y2="20" stroke="#94a3b8" strokeWidth="3" />
          <line x1="95" y1="20" x2="120" y2="20" stroke="#94a3b8" strokeWidth="3" />
          <rect x="25" y="6" width="70" height="28" rx="4" fill="#d2b48c" stroke="#8b7355" strokeWidth="1.5" />
          <rect x="25" y="6" width="70" height="14" rx="4" fill="#e8d5b7" opacity="0.5" />
          {bands.map((c, i) => <rect key={i} x={35 + i * 14} y="8" width="6" height="24" rx="1" fill={c} />)}
        </svg>
    );
};

// --- LED SVG ---
const LedSVG = ({ id = 'sidebar', color = '#ef4444', glowOpacity = 0 }) => (
    <svg width="100%" height="100%" viewBox="0 0 60 80" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`ledGlow-${id}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={glowOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {glowOpacity > 0 && <circle cx="30" cy="30" r="30" fill={`url(#ledGlow-${id})`} />}
      <path d="M 15 55 L 30 10 L 45 55 Z" fill={color} opacity={0.3 + glowOpacity * 0.7} stroke={color} strokeWidth="2" />
      <line x1="15" y1="55" x2="45" y2="55" stroke={color} strokeWidth="3" />
      <line x1="22" y1="55" x2="22" y2="75" stroke="#94a3b8" strokeWidth="3" />
      <line x1="38" y1="55" x2="38" y2="75" stroke="#94a3b8" strokeWidth="3" />
      <line x1="38" y1="70" x2="38" y2="75" stroke="#94a3b8" strokeWidth="5" />
      <text x="30" y="45" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
    </svg>
);

// --- Motor SVG ---
const MotorSVG = ({ id = 'sidebar', spinning = false, speed = 0 }) => {
    const duration = speed > 0 ? Math.max(0.1, 2 / speed) : 0;
    return (
        <svg width="100%" height="100%" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`motorBody-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" /><stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="35" fill={`url(#motorBody-${id})`} stroke="#334155" strokeWidth="3" />
          <circle cx="40" cy="40" r="28" fill="#1e293b" />
          <g style={{ transformOrigin: '40px 40px', animation: spinning ? `spin ${duration}s linear infinite` : 'none' }}>
            <line x1="40" y1="15" x2="40" y2="65" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            <line x1="15" y1="40" x2="65" y2="40" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            <line x1="22" y1="22" x2="58" y2="58" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <line x1="58" y1="22" x2="22" y2="58" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="40" cy="40" r="8" fill="#f59e0b" />
          <text x="40" y="44" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">M</text>
        </svg>
    );
};

// --- Ammeter SVG ---
const AmmeterSVG = ({ id = 'sidebar', current = 0 }) => {
    const maxAngle = 90;
    const angle = -45 + Math.min(1, current / 5) * maxAngle;
    return (
        <svg width="100%" height="100%" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
          <rect x="2" y="2" width="76" height="76" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <rect x="6" y="6" width="68" height="50" rx="4" fill="#f8fafc" />
          {[0,1,2,3,4,5].map(i => (
            <g key={i}>
              <line x1={14 + i*11} y1="48" x2={14 + i*11} y2="52" stroke="#334155" strokeWidth="1" />
              <text x={14 + i*11} y="47" fill="#334155" fontSize="7" textAnchor="middle">{i}</text>
            </g>
          ))}
          <line x1="40" y1="52" x2={40 + Math.cos(angle * Math.PI / 180) * 30} y2={52 + Math.sin(angle * Math.PI / 180) * -30} 
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" 
                style={{ transition: 'all 0.5s ease-out' }} />
          <circle cx="40" cy="52" r="3" fill="#ef4444" />
          <text x="40" y="70" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">A</text>
        </svg>
    );
};

// --- Wire Junction SVG ---
const WireJunctionSVG = () => (
    <svg width="100%" height="100%" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <line x1="20" y1="0" x2="20" y2="40" stroke="#94a3b8" strokeWidth="3" />
      <line x1="0" y1="20" x2="40" y2="20" stroke="#94a3b8" strokeWidth="3" />
      <circle cx="20" cy="20" r="6" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
    </svg>
);

// --- Capacitor SVG ---
const CapacitorSVG = ({ id = 'sidebar', chargeLevel = 0 }) => (
    <svg width="100%" height="100%" viewBox="0 0 80 60" style={{ overflow: 'visible' }}>
      <line x1="0" y1="30" x2="28" y2="30" stroke="#94a3b8" strokeWidth="3" />
      <line x1="52" y1="30" x2="80" y2="30" stroke="#94a3b8" strokeWidth="3" />
      <rect x="28" y="5" width="8" height="50" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
      <rect x="28" y={5 + 50 * (1 - chargeLevel)} width="8" height={50 * chargeLevel} rx="2" fill="#3b82f6" opacity="0.7" />
      <rect x="44" y="5" width="8" height="50" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
      <rect x="44" y={5 + 50 * (1 - chargeLevel)} width="8" height={50 * chargeLevel} rx="2" fill="#3b82f6" opacity="0.7" />
      <text x="32" y="2" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
      <text x="48" y="2" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">−</text>
    </svg>
);

// --- Breadboard Icon SVG ---
const BreadboardIconSVG = () => (
    <svg width="100%" height="100%" viewBox="0 0 60 40" style={{ overflow: 'visible' }}>
        <rect x="5" y="5" width="50" height="30" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="10" y1="12" x2="50" y2="12" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="10" y1="16" x2="50" y2="16" stroke="#3b82f6" strokeWidth="1.5" />
        {[...Array(6)].map((_, i) => <circle key={`r1-${i}`} cx={15 + i*6} cy="25" r="1.5" fill="#334155" />)}
        {[...Array(6)].map((_, i) => <circle key={`r2-${i}`} cx={15 + i*6} cy="30" r="1.5" fill="#334155" />)}
    </svg>
);

// ==========================================
// Node Components
// ==========================================

const BatteryNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', background: '#1e293b', padding: '2px 8px', borderRadius: '10px', color: 'white', fontSize: '12px', alignItems: 'center' }}>
            <button onClick={() => data.onChangeVoltage(id, -1.5)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ minWidth: '30px', textAlign: 'center', color: '#60a5fa' }}>{data.voltage}V</span>
            <button onClick={() => data.onChangeVoltage(id, 1.5)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
        </div>
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="neg" style={{ ...terminalStyle, left: -9, top: '50%' }} polarity="-" />
            <BatterySVG id={id} />
            <TerminalHandle position={Position.Right} id="pos" style={{ ...terminalStyle, right: -9, top: '50%' }} polarity="+" />
        </div>
        {data.isShortCircuited && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '30px', animation: 'shake 0.2s infinite' }}>🔥</div>
        )}
    </div>
);

const BulbNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        {data.isBroken && (
            <button onClick={() => data.onFixBulb(id)} style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', zIndex: 10 }}>🔧 Fix</button>
        )}
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '65%' }} polarity="+" />
            <BulbSVG id={id} glowOpacity={data.power > 30 ? 1 : data.power / 30} isBroken={data.isBroken} />
            <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '65%' }} polarity="-" />
        </div>
    </div>
);

const SwitchNode = ({ id, data }) => (
    <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }} onDoubleClick={() => data.onToggle(id)}>
        <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '65%' }} polarity="+" />
        <SwitchSVG id={id} state={data.state} />
        <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '65%' }} polarity="-" />
    </div>
);

const ResistorNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', background: '#1e293b', padding: '2px 8px', borderRadius: '10px', color: '#fcd34d', fontSize: '12px', alignItems: 'center' }}>
            <button onClick={() => data.onChangeResistance(id, -10)} style={{ background: 'transparent', border: 'none', color: '#fcd34d', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ minWidth: '40px', textAlign: 'center' }}>{data.resistance}Ω</span>
            <button onClick={() => data.onChangeResistance(id, 10)} style={{ background: 'transparent', border: 'none', color: '#fcd34d', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
        </div>
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '50%' }} polarity="+" />
            <ResistorSVG id={id} resistance={data.resistance || 100} />
            <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '50%' }} polarity="-" />
        </div>
    </div>
);

const LedNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', background: '#1e293b', padding: '2px', borderRadius: '10px', zIndex: 10 }}>
            {['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#a855f7'].map(c => (
                <div key={c} onClick={() => data.onChangeColor(id, c)} style={{ width: 12, height: 12, borderRadius: '50%', background: c, cursor: 'pointer', border: data.color === c ? '2px solid white' : 'none' }} />
            ))}
        </div>
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="anode" style={{ ...terminalStyle, left: -9, top: '75%' }} polarity="+" />
            <LedSVG id={id} color={data.color || '#ef4444'} glowOpacity={Math.min(1, data.power / 10)} />
            <TerminalHandle position={Position.Right} id="cathode" style={{ ...terminalStyle, right: -9, top: '75%' }} polarity="-" />
        </div>
    </div>
);

const MotorNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        {data.speed > 0 && (
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#f59e0b', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                ⚡ {(data.speed * 100).toFixed(0)} RPM
            </div>
        )}
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '50%' }} polarity="+" />
            <MotorSVG id={id} spinning={data.speed > 0} speed={data.speed || 0} />
            <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '50%' }} polarity="-" />
        </div>
    </div>
);

const AmmeterNode = ({ id, data }) => (
    <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%', position: 'relative' }}>
        <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '50%' }} polarity="+" />
        <AmmeterSVG id={id} current={data.current || 0} />
        <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '50%' }} polarity="-" />
    </div>
);

const WireJunctionNode = ({ id, data }) => (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <TerminalHandle position={Position.Top} id="top" style={{ ...terminalStyle, top: -9 }} />
        <TerminalHandle position={Position.Bottom} id="bottom" style={{ ...terminalStyle, bottom: -9 }} />
        <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9 }} />
        <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9 }} />
        <WireJunctionSVG />
    </div>
);

const CapacitorNode = ({ id, data }) => (
    <div style={{ position: 'relative' }}>
        {data.chargeLevel > 0 && (
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                ⚡ {(data.chargeLevel * 100).toFixed(0)}%
            </div>
        )}
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%' }}>
            <TerminalHandle position={Position.Left} id="left" style={{ ...terminalStyle, left: -9, top: '50%' }} polarity="+" />
            <CapacitorSVG id={id} chargeLevel={data.chargeLevel || 0} />
            <TerminalHandle position={Position.Right} id="right" style={{ ...terminalStyle, right: -9, top: '50%' }} polarity="-" />
        </div>
    </div>
);

// --- Breadboard Node ---
const holeStyle = { width: 12, height: 12, background: '#334155', border: '1px solid #94a3b8', borderRadius: '2px', zIndex: 10, position: 'absolute', transform: 'translate(-50%, -50%)' };
const sourceHoleStyle = { ...holeStyle, background: 'transparent', border: 'none', zIndex: 11, opacity: 0 };

const BreadboardNode = ({ id, data }) => {
    const cols = Array.from({length: 10}, (_, i) => i);
    const rows = [1, 2, 3, 4, 5];
    const letters = ['A','B','C','D','E','F','G','H','I','J'];

    return (
        <div style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))', width: '100%', height: '100%', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 340 200" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }} preserveAspectRatio="none">
               <rect x="0" y="0" width="340" height="200" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
               <line x1="20" y1="15" x2="320" y2="15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
               <line x1="20" y1="55" x2="320" y2="55" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
               <text x="10" y="20" fill="#ef4444" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>
               <text x="10" y="60" fill="#3b82f6" fontSize="18" fontWeight="bold" textAnchor="middle">-</text>
               <rect x="15" y="80" width="310" height="105" rx="4" fill="#f1f5f9" />
            </svg>
            
            {cols.map((col) => (
                <React.Fragment key={`power-${col}`}>
                    <Handle type="target" position={Position.Top} id={`red_${col}-target`} style={{ ...holeStyle, top: 25, left: 35 + col * 30 }} />
                    <Handle type="source" position={Position.Top} id={`red_${col}-source`} style={{ ...sourceHoleStyle, top: 25, left: 35 + col * 30 }} />
                    <Handle type="target" position={Position.Top} id={`blue_${col}-target`} style={{ ...holeStyle, top: 45, left: 35 + col * 30 }} />
                    <Handle type="source" position={Position.Top} id={`blue_${col}-source`} style={{ ...sourceHoleStyle, top: 45, left: 35 + col * 30 }} />
                </React.Fragment>
            ))}

            {cols.map((colIndex) => {
                const colLetter = letters[colIndex];
                return rows.map((row) => (
                    <React.Fragment key={`term-${colLetter}-${row}`}>
                        <Handle type="target" position={Position.Top} id={`${colLetter}_${row}-target`} style={{ ...holeStyle, top: 75 + row * 20, left: 35 + colIndex * 30 }} />
                        <Handle type="source" position={Position.Top} id={`${colLetter}_${row}-source`} style={{ ...sourceHoleStyle, top: 75 + row * 20, left: 35 + colIndex * 30 }} />
                    </React.Fragment>
                ));
            })}
        </div>
    );
};

// ==========================================
// Animated Edge
// ==========================================

const AnimatedFlowEdge = (props) => {
    const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, data } = props;
    const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const isFlowing = data?.isFlowing;
    const isShort = data?.isShortCircuited;
    return (
        <>
            <BaseEdge path={edgePath} style={{ ...style, stroke: isShort ? '#f87171' : '#94a3b8', strokeWidth: 6, strokeLinecap: 'round' }} />
            {isFlowing && (
                <path d={edgePath} fill="none" stroke={isShort ? '#ef4444' : '#fef08a'} strokeWidth={4} strokeLinecap="round"
                    style={{ animation: `flowAnimation ${isShort ? '0.2s' : '1s'} linear infinite`, strokeDasharray: '8 15',
                        filter: isShort ? 'drop-shadow(0 0 8px rgba(239,68,68,1))' : 'drop-shadow(0 0 5px rgba(250,204,21,0.8))' }} />
            )}
            <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all', zIndex: 2147483647 }}>
                    <button onClick={() => data?.onDeleteEdge(id)} style={{ background: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✕</button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

// ==========================================
// CSS Injections
// ==========================================
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes flowAnimation { from { stroke-dashoffset: 23; } to { stroke-dashoffset: 0; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes shake { 0%{transform:translateX(0)} 25%{transform:translateX(-2px) rotate(-1deg)} 50%{transform:translateX(2px) rotate(1deg)} 75%{transform:translateX(-2px) rotate(-1deg)} 100%{transform:translateX(0)} }
  .react-flow.is-connecting .react-flow__handle:not(.react-flow__handle-connecting) {
      animation: handlePulse 0.8s infinite alternate !important;
      border-color: #22c55e !important; box-shadow: 0 0 15px #22c55e !important;
  }
  @keyframes handlePulse {
      0% { transform: translate(-50%, -50%) scale(1) !important; background: #fde047 !important; }
      100% { transform: translate(-50%, -50%) scale(1.8) !important; background: #4ade80 !important; }
  }
`;
document.head.appendChild(styleSheet);

const withDeleteBtn = (WrappedComponent) => {
    return (props) => {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {props.selected && (
                    <NodeResizeControl minWidth={30} minHeight={30} style={{ background: 'transparent', border: 'none' }}>
                        <div style={{ position: 'absolute', right: -12, bottom: -12, width: 24, height: 24, cursor: 'nwse-resize', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22 Q22 22 22 12" />
                                <path d="M17 22 Q22 22 22 17" />
                            </svg>
                        </div>
                    </NodeResizeControl>
                )}
                {props.selected && (
                    <button onClick={() => props.data?.onDeleteNode && props.data.onDeleteNode(props.id)} style={{ position: 'absolute', top: -20, right: -20, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 100 }}>✕</button>
                )}
                <WrappedComponent {...props} />
            </div>
        );
    };
};

const nodeTypes = { 
    battery: withDeleteBtn(BatteryNode), 
    bulb: withDeleteBtn(BulbNode), 
    switch: withDeleteBtn(SwitchNode), 
    resistor: withDeleteBtn(ResistorNode), 
    led: withDeleteBtn(LedNode), 
    motor: withDeleteBtn(MotorNode), 
    ammeter: withDeleteBtn(AmmeterNode), 
    junction: withDeleteBtn(WireJunctionNode), 
    capacitor: withDeleteBtn(CapacitorNode),
    breadboard: withDeleteBtn(BreadboardNode)
};
const edgeTypes = { flowEdge: AnimatedFlowEdge };

// ==========================================
// 2. Circuit Engine (Upgraded)
// ==========================================
const evaluateAdvancedCircuit = (nodes, edges) => {
    const graph = {};
    const addG = (u, v, w) => {
        if (!graph[u]) graph[u] = [];
        if (!graph[v]) graph[v] = [];
        graph[u].push({ node: v, weight: w });
        graph[v].push({ node: u, weight: w });
    };

    edges.forEach(edge => {
        const sh = (edge.sourceHandle || 'def').replace('-source', '').replace('-target', '');
        const th = (edge.targetHandle || 'def').replace('-source', '').replace('-target', '');
        addG(`${edge.source}_${sh}`, `${edge.target}_${th}`, { type: 'wire' });
    });

    nodes.forEach(node => {
        const d = node.data;
        if (node.type === 'battery') addG(`${node.id}_neg`, `${node.id}_pos`, { type: 'battery', id: node.id, voltage: d.voltage });
        else if (node.type === 'bulb' && !d.isBroken) addG(`${node.id}_left`, `${node.id}_right`, { type: 'bulb', id: node.id, resistance: 10 });
        else if (node.type === 'switch' && d.state === 'closed') addG(`${node.id}_left`, `${node.id}_right`, { type: 'switch', id: node.id });
        else if (node.type === 'resistor') addG(`${node.id}_left`, `${node.id}_right`, { type: 'resistor', id: node.id, resistance: d.resistance || 100 });
        else if (node.type === 'led') addG(`${node.id}_anode`, `${node.id}_cathode`, { type: 'led', id: node.id, resistance: 5 });
        else if (node.type === 'motor') addG(`${node.id}_left`, `${node.id}_right`, { type: 'motor', id: node.id, resistance: 15 });
        else if (node.type === 'ammeter') addG(`${node.id}_left`, `${node.id}_right`, { type: 'ammeter', id: node.id, resistance: 0.001 });
        else if (node.type === 'capacitor' && (d.chargeLevel || 0) < 1) addG(`${node.id}_left`, `${node.id}_right`, { type: 'capacitor', id: node.id, resistance: 5 });
        else if (node.type === 'junction') {
            const handles = ['top', 'bottom', 'left', 'right'];
            for (let i = 0; i < handles.length; i++)
                for (let j = i + 1; j < handles.length; j++)
                    addG(`${node.id}_${handles[i]}`, `${node.id}_${handles[j]}`, { type: 'junction', id: node.id });
        }
        else if (node.type === 'breadboard') {
            for(let i=0; i<10; i++){
                addG(`${node.id}_red_${i}`, `${node.id}_red_bus`, { type: 'wire' });
                addG(`${node.id}_blue_${i}`, `${node.id}_blue_bus`, { type: 'wire' });
            }
            const columns = ['A','B','C','D','E','F','G','H','I','J'];
            columns.forEach(col => {
                for(let i=1; i<=5; i++){
                    addG(`${node.id}_${col}_${i}`, `${node.id}_${col}_bus`, { type: 'wire' });
                }
            });
        }
    });

    const batteries = nodes.filter(n => n.type === 'battery');
    let isLoopClosed = false, totalVoltage = 0, totalResistance = 0;
    const componentIds = { bulbs: [], resistors: [], leds: [], motors: [], ammeters: [], capacitors: [] };

    if (batteries.length > 0) {
        const start = `${batteries[0].id}_pos`;
        const target = `${batteries[0].id}_neg`;
        const visited = new Set();
        const path = [];

        const dfs = (curr) => {
            if (curr === target) return true;
            visited.add(curr);
            if (graph[curr]) {
                for (const neighbor of graph[curr]) {
                    // Prevent taking the internal edge of the starting battery directly
                    if (curr === start && neighbor.node === target && neighbor.weight.type === 'battery') {
                        continue;
                    }
                    if (!visited.has(neighbor.node)) {
                        path.push(neighbor);
                        if (dfs(neighbor.node)) return true;
                        path.pop();
                    }
                }
            }
            return false;
        };

        if (dfs(start)) {
            path.push({ node: start, weight: { type: 'battery', id: batteries[0].id, voltage: batteries[0].data.voltage } });
            path.forEach(p => {
                const w = p.weight;
                if (w.type === 'battery') totalVoltage += w.voltage;
                if (w.type === 'bulb') { componentIds.bulbs.push(w.id); totalResistance += (w.resistance || 10); }
                if (w.type === 'resistor') { componentIds.resistors.push(w.id); totalResistance += (w.resistance || 100); }
                if (w.type === 'led') { componentIds.leds.push(w.id); totalResistance += (w.resistance || 5); }
                if (w.type === 'motor') { componentIds.motors.push(w.id); totalResistance += (w.resistance || 15); }
                if (w.type === 'ammeter') { componentIds.ammeters.push(w.id); totalResistance += 0.001; }
                if (w.type === 'capacitor') { componentIds.capacitors.push(w.id); totalResistance += (w.resistance || 5); }
            });
            isLoopClosed = true;
        }
    }

    const hasLoad = componentIds.bulbs.length + componentIds.resistors.length + componentIds.leds.length + componentIds.motors.length + componentIds.capacitors.length > 0;
    const isShortCircuited = isLoopClosed && !hasLoad && totalVoltage > 0;
    if (isShortCircuited) totalResistance = 0.001;
    if (totalResistance === 0) totalResistance = 1;
    const current = totalVoltage / totalResistance;

    const bulbStatus = {};
    nodes.filter(n => n.type === 'bulb').forEach(n => {
        if (componentIds.bulbs.includes(n.id) && !isShortCircuited) {
            const power = current * current * 10;
            bulbStatus[n.id] = power > 30 ? { power: 0, isBroken: true } : { power, isBroken: n.data.isBroken };
        } else {
            bulbStatus[n.id] = { power: 0, isBroken: n.data.isBroken };
        }
    });

    const ledStatus = {};
    nodes.filter(n => n.type === 'led').forEach(n => {
        ledStatus[n.id] = { power: componentIds.leds.includes(n.id) && !isShortCircuited ? current * current * 5 : 0 };
    });

    const motorStatus = {};
    nodes.filter(n => n.type === 'motor').forEach(n => {
        motorStatus[n.id] = { speed: componentIds.motors.includes(n.id) && !isShortCircuited ? Math.min(5, current) : 0 };
    });

    const ammeterStatus = {};
    nodes.filter(n => n.type === 'ammeter').forEach(n => {
        ammeterStatus[n.id] = { current: componentIds.ammeters.includes(n.id) && !isShortCircuited ? current : 0 };
    });

    return {
        isClosed: isLoopClosed, bulbStatus, ledStatus, motorStatus, ammeterStatus,
        totalVoltage, current: isShortCircuited ? 999.99 : current,
        isShortCircuited, shortedBatteries: isShortCircuited ? batteries.map(b => b.id) : [],
        capacitorIds: componentIds.capacitors, isFlowing: isLoopClosed && current > 0
    };
};

// ==========================================
// 3. Main Component
// ==========================================
function FlowApp({ onClose }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [circuitStats, setCircuitStats] = useState({ v: 0, i: 0 });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const capacitorTimerRef = useRef(null);

    const toggleSwitch = useCallback((id) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, state: n.data.state === 'open' ? 'closed' : 'open' } } : n));
    }, [setNodes]);

    const changeVoltage = useCallback((id, delta) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, voltage: Math.max(1.5, Math.min(24, n.data.voltage + delta)) } } : n));
    }, [setNodes]);

    const fixBulb = useCallback((id) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, isBroken: false, power: 0 } } : n));
    }, [setNodes]);

    const changeResistance = useCallback((id, delta) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, resistance: Math.max(10, Math.min(1000, n.data.resistance + delta)) } } : n));
    }, [setNodes]);

    const changeLedColor = useCallback((id, color) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, color } } : n));
    }, [setNodes]);



    const deleteNode = useCallback((id) => {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    }, [setNodes, setEdges]);

    const deleteEdge = useCallback((id) => {
        setEdges(eds => eds.filter(e => e.id !== id));
    }, [setEdges]);

    useEffect(() => {
        setNodes([
            { id: 'bat1', type: 'battery', position: { x: 80, y: 200 }, style: { width: 120, height: 48 }, data: { voltage: 9, onChangeVoltage: changeVoltage, onDeleteNode: deleteNode } },
            { id: 'bulb1', type: 'bulb', position: { x: 400, y: 80 }, style: { width: 60, height: 75 }, data: { isBroken: false, power: 0, onFixBulb: fixBulb, onDeleteNode: deleteNode } },
            { id: 'sw1', type: 'switch', position: { x: 400, y: 350 }, style: { width: 100, height: 60 }, data: { state: 'open', onToggle: toggleSwitch, onDeleteNode: deleteNode } },
        ]);
    }, [changeVoltage, fixBulb, toggleSwitch, deleteNode]);

    const addNode = useCallback((type) => {
        const id = `${type}-${Date.now()}`;
        const config = {
            battery: { style: { width: 120, height: 48 }, data: { voltage: 9, onChangeVoltage: changeVoltage } },
            bulb: { style: { width: 60, height: 75 }, data: { isBroken: false, power: 0, onFixBulb: fixBulb } },
            switch: { style: { width: 100, height: 60 }, data: { state: 'open', onToggle: toggleSwitch } },
            resistor: { style: { width: 100, height: 30 }, data: { resistance: 100, onChangeResistance: changeResistance } },
            led: { style: { width: 60, height: 80 }, data: { color: '#ef4444', power: 0, onChangeColor: changeLedColor } },
            motor: { style: { width: 80, height: 80 }, data: { speed: 0 } },
            ammeter: { style: { width: 80, height: 80 }, data: { current: 0 } },
            junction: { style: { width: 40, height: 40 }, data: {} },
            capacitor: { style: { width: 80, height: 60 }, data: { chargeLevel: 0 } },
            breadboard: { style: { width: 340, height: 200 }, data: {} },
        };
        const nodeConfig = config[type];
        setNodes(nds => nds.concat({ id, type, position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 100 }, style: nodeConfig.style, data: { ...nodeConfig.data, onDeleteNode: deleteNode }, zIndex: type === 'breadboard' ? -1 : 1 }));
    }, [setNodes, changeVoltage, fixBulb, toggleSwitch, changeResistance, changeLedColor, deleteNode]);

    const onConnect = useCallback((params) => setEdges(eds => addEdge({ ...params, type: 'flowEdge', zIndex: 1000, data: { onDeleteEdge: deleteEdge } }, eds)), [setEdges, deleteEdge]);
    const onConnectStart = useCallback(() => setIsConnecting(true), []);
    const onConnectEnd = useCallback(() => setIsConnecting(false), []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const result = isPaused
                ? { isClosed: false, bulbStatus: {}, ledStatus: {}, motorStatus: {}, ammeterStatus: {}, totalVoltage: 0, current: 0, isShortCircuited: false, shortedBatteries: [], capacitorIds: [], isFlowing: false }
                : evaluateAdvancedCircuit(nodes, edges);

            setCircuitStats({ v: result.totalVoltage, i: result.current });

            let nodesChanged = false;
            const nextNodes = nodes.map(n => {
                if (n.type === 'battery') {
                    const isShorted = result.shortedBatteries.includes(n.id);
                    if (n.data.isShortCircuited !== isShorted) { nodesChanged = true; return { ...n, data: { ...n.data, isShortCircuited: isShorted } }; }
                }
                if (n.type === 'bulb') {
                    const s = result.bulbStatus[n.id] || { power: 0, isBroken: n.data.isBroken };
                    if (n.data.power !== s.power || n.data.isBroken !== s.isBroken) { nodesChanged = true; return { ...n, data: { ...n.data, ...s } }; }
                }
                if (n.type === 'led') {
                    const s = result.ledStatus[n.id] || { power: 0 };
                    if (n.data.power !== s.power) { nodesChanged = true; return { ...n, data: { ...n.data, power: s.power } }; }
                }
                if (n.type === 'motor') {
                    const s = result.motorStatus[n.id] || { speed: 0 };
                    if (n.data.speed !== s.speed) { nodesChanged = true; return { ...n, data: { ...n.data, speed: s.speed } }; }
                }
                if (n.type === 'ammeter') {
                    const s = result.ammeterStatus[n.id] || { current: 0 };
                    if (n.data.current !== s.current) { nodesChanged = true; return { ...n, data: { ...n.data, current: s.current } }; }
                }
                if (n.type === 'capacitor') {
                    const isCharging = result.capacitorIds.includes(n.id) && result.isFlowing && !result.isShortCircuited;
                    const newLevel = isCharging ? Math.min(1, (n.data.chargeLevel || 0) + 0.05) : (n.data.chargeLevel || 0);
                    if (n.data.chargeLevel !== newLevel) { nodesChanged = true; return { ...n, data: { ...n.data, chargeLevel: newLevel } }; }
                }
                return n;
            });
            if (nodesChanged) setNodes(nextNodes);

            let edgesChanged = false;
            const nextEdges = edges.map(e => {
                const isFlowing = result.isClosed && result.current > 0 && !result.isShortCircuited;
                const tBroken = nodes.find(n => n.id === e.target)?.type === 'bulb' && nodes.find(n => n.id === e.target)?.data.isBroken;
                const sBroken = nodes.find(n => n.id === e.source)?.type === 'bulb' && nodes.find(n => n.id === e.source)?.data.isBroken;
                const finalFlow = (isFlowing && !tBroken && !sBroken) || (result.isShortCircuited && result.isClosed);
                if (e.data?.isFlowing !== finalFlow || e.data?.isShortCircuited !== result.isShortCircuited) {
                    edgesChanged = true;
                    return { ...e, data: { ...e.data, isFlowing: finalFlow, isShortCircuited: result.isShortCircuited } };
                }
                return e;
            });
            if (edgesChanged) setEdges(nextEdges);
        }, 50);
        return () => clearTimeout(timeout);
    }, [edges, nodes.map(n => `${n.id}-${JSON.stringify(n.data)}`).join(','), isPaused]);

    const sidebarBtn = (type, icon, label) => (
        <button onClick={() => addNode(type)} style={{ padding: '8px 10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', transition: 'all 0.2s' }}>
            <div style={{ width: 45, height: 30, flexShrink: 0 }}>{icon}</div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{label}</span>
        </button>
    );

    return (
        <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#0f172a', padding: '10px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px' }}>⚡ Circuit Lab</h2>
                    <div style={{ background: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', border: '1px solid #334155', display: 'flex', gap: '12px' }}>
                        <span style={{ color: '#38bdf8' }}>V: <strong>{circuitStats.v.toFixed(1)}V</strong></span>
                        <span style={{ color: circuitStats.i > 100 ? '#ef4444' : '#facc15' }}>I: <strong>{circuitStats.i > 100 ? 'MAX' : circuitStats.i.toFixed(2) + 'A'}</strong></span>
                    </div>
                    <button onClick={() => setIsPaused(!isPaused)}
                        style={{ background: isPaused ? '#22c55e' : '#f59e0b', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        {isPaused ? '▶️ Play' : '⏸️ Pause'}
                    </button>
                </div>
                <button onClick={onClose} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ width: '200px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>⚡ Power</h3>
                    {sidebarBtn('battery', <BatterySVG />, 'Battery')}
                    
                    <h3 style={{ margin: '8px 0 5px 0', fontSize: '13px', color: '#64748b' }}>💡 Output</h3>
                    {sidebarBtn('bulb', <BulbSVG />, 'Light Bulb')}
                    {sidebarBtn('led', <LedSVG />, 'LED')}
                    {sidebarBtn('motor', <MotorSVG />, 'Motor')}

                    <h3 style={{ margin: '8px 0 5px 0', fontSize: '13px', color: '#64748b' }}>🔧 Control</h3>
                    {sidebarBtn('switch', <SwitchSVG state="open" />, 'Switch')}
                    {sidebarBtn('resistor', <ResistorSVG />, 'Resistor')}
                    {sidebarBtn('capacitor', <CapacitorSVG />, 'Capacitor')}

                    <h3 style={{ margin: '8px 0 5px 0', fontSize: '13px', color: '#64748b' }}>📊 Measure & Build</h3>
                    {sidebarBtn('ammeter', <AmmeterSVG />, 'Ammeter')}
                    {sidebarBtn('junction', <WireJunctionSVG />, 'Junction')}
                    {sidebarBtn('breadboard', <BreadboardIconSVG />, 'Mini Breadboard')}

                    <div style={{ marginTop: 'auto', padding: '10px', background: '#fef3c7', border: '1px solid #fde047', borderRadius: '8px', fontSize: '11px', color: '#854d0e' }}>
                        <strong>📖 Guide:</strong><br/>
                        • Double-click switch to toggle<br/>
                        • Use +/- to adjust values<br/>
                        • LED has polarity (+ side)<br/>
                        • Connect wire to junction for parallel circuits
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect} onConnectStart={onConnectStart} onConnectEnd={onConnectEnd}
                        nodeTypes={nodeTypes} edgeTypes={edgeTypes} className={isConnecting ? 'is-connecting' : ''} fitView>
                        <Background color="#94a3b8" gap={30} size={2} />
                        <Controls />
                        <MiniMap nodeColor="#cbd5e1" maskColor="rgba(241, 245, 249, 0.7)" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

export default function CustomCircuitLabWrapper(props) {
    return (
        <ReactFlowProvider>
            <FlowApp {...props} />
        </ReactFlowProvider>
    );
}
