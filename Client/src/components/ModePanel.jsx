// ============================================================
// ModePanel.jsx — Overlay สำหรับ Mode พิเศษ (EClass-style)
// ============================================================
//
// Component นี้แสดง overlay ต่างๆ ตามโหมดที่เลือก:
//
//  🧮 Math Mode:
//     - ไม้บรรทัด (ลากย้ายได้ + scroll หมุนได้)
//     - ครึ่งวงกลมวัดมุม / โปรแทรกเตอร์ (ลากย้ายได้)
//
//  🔬 Science Mode:
//     - จานเลือก Stamp อุปกรณ์วิทย์ 16 ชิ้น (emoji)
//     - ตารางธาตุ popup (ธาตุลำดับ 1-20)
//
//  📖 Language Mode:
//     - แถบแนะนำให้ใช้กระดาษเส้น + เครื่องมือข้อความ
//
//  🎨 Standard Mode:
//     - ไม่แสดง overlay ใดๆ (return null)
//
// ============================================================

import { useState, useRef, useCallback } from "react";

// ============================================================
// ข้อมูล: Stamp อุปกรณ์วิทยาศาสตร์ (16 ชิ้น)
// ============================================================
const SCIENCE_STAMPS = [
    { emoji: "🧪", label: "หลอดทดลอง" },
    { emoji: "⚗️", label: "ขวดกลั่น" },
    { emoji: "🔬", label: "กล้องจุลทรรศน์" },
    { emoji: "🧲", label: "แม่เหล็ก" },
    { emoji: "⚛️", label: "อะตอม" },
    { emoji: "🧬", label: "DNA" },
    { emoji: "🌡️", label: "เทอร์โมมิเตอร์" },
    { emoji: "💡", label: "หลอดไฟ" },
    { emoji: "🔋", label: "แบตเตอรี่" },
    { emoji: "⚡", label: "ไฟฟ้า" },
    { emoji: "🌍", label: "โลก" },
    { emoji: "☀️", label: "ดวงอาทิตย์" },
    { emoji: "🌙", label: "ดวงจันทร์" },
    { emoji: "💧", label: "หยดน้ำ" },
    { emoji: "🔥", label: "ไฟ" },
    { emoji: "🧫", label: "จานเพาะเชื้อ" },
];

// ============================================================
// ข้อมูล: ตารางธาตุ (ธาตุลำดับ 1-20)
// ============================================================
// แต่ละธาตุมี: n=เลขอะตอม, sym=สัญลักษณ์, name=ชื่อ, group=หมู่
// group ใช้กำหนดสี CSS class เช่น group-alkali → สีแดง
const PERIODIC_ELEMENTS = [
    { n: 1, sym: "H", name: "Hydrogen", group: "nonmetal" },
    { n: 2, sym: "He", name: "Helium", group: "noble" },
    { n: 3, sym: "Li", name: "Lithium", group: "alkali" },
    { n: 4, sym: "Be", name: "Beryllium", group: "alkaline" },
    { n: 5, sym: "B", name: "Boron", group: "metalloid" },
    { n: 6, sym: "C", name: "Carbon", group: "nonmetal" },
    { n: 7, sym: "N", name: "Nitrogen", group: "nonmetal" },
    { n: 8, sym: "O", name: "Oxygen", group: "nonmetal" },
    { n: 9, sym: "F", name: "Fluorine", group: "halogen" },
    { n: 10, sym: "Ne", name: "Neon", group: "noble" },
    { n: 11, sym: "Na", name: "Sodium", group: "alkali" },
    { n: 12, sym: "Mg", name: "Magnesium", group: "alkaline" },
    { n: 13, sym: "Al", name: "Aluminium", group: "metal" },
    { n: 14, sym: "Si", name: "Silicon", group: "metalloid" },
    { n: 15, sym: "P", name: "Phosphorus", group: "nonmetal" },
    { n: 16, sym: "S", name: "Sulfur", group: "nonmetal" },
    { n: 17, sym: "Cl", name: "Chlorine", group: "halogen" },
    { n: 18, sym: "Ar", name: "Argon", group: "noble" },
    { n: 19, sym: "K", name: "Potassium", group: "alkali" },
    { n: 20, sym: "Ca", name: "Calcium", group: "alkaline" },
];

// ============================================================
// RulerOverlay — ไม้บรรทัดลากย้ายได้ + หมุนได้
// ============================================================
// - ลากย้ายด้วย pointer (mouse/touch)
// - หมุนด้วย scroll wheel (ทีละ 2 องศา)
// - มีขีด 31 ขีด (ขีดใหญ่ทุก 5)
function RulerOverlay() {
    const [pos, setPos] = useState({ x: 100, y: 100 });    // ตำแหน่งปัจจุบัน
    const [rotation, setRotation] = useState(0);              // มุมหมุน (องศา)
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // เริ่มลาก: จำตำแหน่ง offset ระหว่างเมาส์กับมุมซ้ายบน
    const handleDown = (e) => {
        e.stopPropagation(); // ไม่ให้ event ลงไปถึง canvas
        dragging.current = true;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
    };

    // ลาก: อัปเดตตำแหน่ง
    const handleMove = useCallback((e) => {
        if (!dragging.current) return;
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    }, []);

    // ปล่อย: หยุดลาก
    const handleUp = useCallback(() => {
        dragging.current = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
    }, [handleMove]);

    // Scroll: หมุนไม้บรรทัด
    const handleWheel = (e) => {
        e.stopPropagation();
        setRotation((r) => r + (e.deltaY > 0 ? 2 : -2));
    };

    return (
        <div
            className="ruler-overlay"
            style={{ left: pos.x + "px", top: pos.y + "px", transform: `rotate(${rotation}deg)` }}
            onPointerDown={handleDown}
            onWheel={handleWheel}
            title="ลากเพื่อย้าย • Scroll เพื่อหมุน"
        >
            <div className="ruler-body">
                {/* สร้างขีดบนไม้บรรทัด 31 ขีด (0-30) */}
                {Array.from({ length: 31 }, (_, i) => (
                    <div key={i} className={`ruler-tick ${i % 5 === 0 ? "major" : ""}`}>
                        {i % 5 === 0 && <span className="ruler-num">{i}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// ProtractorOverlay — ครึ่งวงกลมวัดมุม (โปรแทรกเตอร์)
// ============================================================
// - ลากย้ายได้ด้วย pointer
// - วาดด้วย SVG (arc + เส้นขีดมุม + ตัวเลของศา)
// - ขีดทุก 10° / ตัวเลขทุก 30°
function ProtractorOverlay() {
    const [pos, setPos] = useState({ x: 300, y: 200 });
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleDown = (e) => {
        e.stopPropagation();
        dragging.current = true;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
    };

    const handleMove = useCallback((e) => {
        if (!dragging.current) return;
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    }, []);

    const handleUp = useCallback(() => {
        dragging.current = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
    }, [handleMove]);

    // สร้างเส้นขีดมุม + ตัวเลของศา สำหรับ SVG
    const marks = [];
    for (let deg = 0; deg <= 180; deg += 10) {
        const rad = (deg * Math.PI) / 180;
        const r1 = 120; // ความยาวเส้นจากขอบ
        const r2 = deg % 30 === 0 ? 105 : 112; // ขีดใหญ่ทุก 30°

        // เส้นขีด
        marks.push(
            <line key={deg}
                x1={150 + r1 * Math.cos(Math.PI - rad)}
                y1={150 - r1 * Math.sin(Math.PI - rad)}
                x2={150 + r2 * Math.cos(Math.PI - rad)}
                y2={150 - r2 * Math.sin(Math.PI - rad)}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={deg % 30 === 0 ? 2 : 1}
            />
        );

        // ตัวเลของศา (แสดงทุก 30°)
        if (deg % 30 === 0) {
            marks.push(
                <text key={`t${deg}`}
                    x={150 + 95 * Math.cos(Math.PI - rad)}
                    y={150 - 95 * Math.sin(Math.PI - rad)}
                    fill="rgba(255,255,255,0.7)" fontSize="10"
                    textAnchor="middle" dominantBaseline="middle"
                >
                    {deg}°
                </text>
            );
        }
    }

    return (
        <div
            className="protractor-overlay"
            style={{ left: pos.x + "px", top: pos.y + "px" }}
            onPointerDown={handleDown}
            title="ลากเพื่อย้าย"
        >
            <svg width="300" height="160" viewBox="0 0 300 160">
                {/* ครึ่งวงกลม */}
                <path
                    d="M 30 150 A 120 120 0 0 1 270 150"
                    fill="rgba(99, 102, 241, 0.12)"
                    stroke="rgba(255,255,255,0.4)" strokeWidth="2"
                />
                {/* เส้นฐาน */}
                <line x1="30" y1="150" x2="270" y2="150" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                {/* ขีดมุม + ตัวเลข */}
                {marks}
            </svg>
        </div>
    );
}

// ============================================================
// ModePanel Component หลัก
// ============================================================
// Props:
//  mode          → โหมดปัจจุบัน ("standard" | "math" | "science" | "language")
//  activeStamp   → emoji stamp ที่เลือกไว้ (หรือ null)
//  onStampSelect → callback เมื่อเลือก stamp
function ModePanel({ mode, activeStamp, onStampSelect }) {
    const [showPeriodicTable, setShowPeriodicTable] = useState(false); // แสดงตารางธาตุ?
    const [showRuler, setShowRuler] = useState(false);                   // แสดงไม้บรรทัด?
    const [showProtractor, setShowProtractor] = useState(false);         // แสดงโปรแทรกเตอร์?

    // Standard mode → ไม่แสดง overlay ใดๆ
    if (mode === "standard") return null;

    return (
        <>
            {/* ════════════════════════════════════════════════════ */}
            {/* 🧮 Math Mode: ไม้บรรทัด + โปรแทรกเตอร์            */}
            {/* ════════════════════════════════════════════════════ */}
            {mode === "math" && (
                <>
                    {/* แถบเครื่องมือลอยด้านบน */}
                    <div className="mode-floating-bar math-bar">
                        <span className="mode-label">🧮 Math</span>
                        <button
                            className={`mode-tool-btn ${showRuler ? "active" : ""}`}
                            onClick={() => setShowRuler((v) => !v)}
                            title="ไม้บรรทัด"
                        >📏</button>
                        <button
                            className={`mode-tool-btn ${showProtractor ? "active" : ""}`}
                            onClick={() => setShowProtractor((v) => !v)}
                            title="โปรแทรกเตอร์"
                        >📐</button>
                    </div>

                    {/* Overlay: ไม้บรรทัด */}
                    {showRuler && <RulerOverlay />}

                    {/* Overlay: โปรแทรกเตอร์ */}
                    {showProtractor && <ProtractorOverlay />}
                </>
            )}

            {/* ════════════════════════════════════════════════════ */}
            {/* 🔬 Science Mode: Stamps + ตารางธาตุ                */}
            {/* ════════════════════════════════════════════════════ */}
            {mode === "science" && (
                <>
                    <div className="mode-floating-bar science-bar">
                        <span className="mode-label">🔬 Science</span>

                        {/* จาน Stamp: เลือก emoji อุปกรณ์วิทย์ */}
                        <div className="stamp-grid">
                            {SCIENCE_STAMPS.map((s) => (
                                <button
                                    key={s.emoji}
                                    className={`stamp-btn ${activeStamp === s.emoji ? "active" : ""}`}
                                    onClick={() => onStampSelect(s.emoji)}
                                    title={s.label}
                                >
                                    {s.emoji}
                                </button>
                            ))}
                        </div>

                        {/* ปุ่มเปิดตารางธาตุ */}
                        <button
                            className="mode-tool-btn periodic-btn"
                            onClick={() => setShowPeriodicTable((v) => !v)}
                            title="ตารางธาตุ"
                        >🔤 PT</button>
                    </div>

                    {/* Popup: ตารางธาตุ (ธาตุ 1-20) */}
                    {showPeriodicTable && (
                        <div className="periodic-popup">
                            <div className="periodic-header">
                                <h4>ตารางธาตุ (1–20)</h4>
                                <button className="periodic-close" onClick={() => setShowPeriodicTable(false)}>✕</button>
                            </div>
                            <div className="periodic-grid">
                                {PERIODIC_ELEMENTS.map((el) => (
                                    <div key={el.n} className={`element-card group-${el.group}`} title={el.name}>
                                        <span className="el-number">{el.n}</span>
                                        <span className="el-symbol">{el.sym}</span>
                                        <span className="el-name">{el.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ════════════════════════════════════════════════════ */}
            {/* 📖 Language Mode: แถบแนะนำ                         */}
            {/* ════════════════════════════════════════════════════ */}
            {mode === "language" && (
                <div className="mode-floating-bar language-bar">
                    <span className="mode-label">📖 Language</span>
                    <span className="mode-hint">แนะนำ: ใช้กระดาษเส้น + เครื่องมือข้อความ</span>
                </div>
            )}
        </>
    );
}

export default ModePanel;
