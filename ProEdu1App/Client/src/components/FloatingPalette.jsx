// ============================================================
// FloatingPalette.jsx — วงกลมเครื่องมือลอย (EClass-style)
// ============================================================
//
// วงกลมเครื่องมือที่ลอยอยู่บน canvas ลากย้ายได้
// กด toggle เพื่อเปิด/ปิดพาเลท
// แสดงเครื่องมือที่ใช้บ่อย 5 ตัว
//
// ============================================================

import { useState, useRef, useCallback } from "react";

// เครื่องมือที่แสดงในพาเลท
const PALETTE_TOOLS = [
    { id: "pen", icon: "✏️", title: "ปากกา" },
    { id: "highlighter", icon: "🖍️", title: "ปากกาเน้น" },
    { id: "eraser", icon: "🧹", title: "ยางลบ" },
    { id: "text", icon: "🔤", title: "ข้อความ" },
    { id: "select", icon: "👆", title: "เลือก/ย้าย" },
    { id: "pan", icon: "🖐️", title: "เลื่อนกระดาน" },
];

function FloatingPalette({ tool, onToolChange }) {
    // ── state ──
    const [isOpen, setIsOpen] = useState(false);     // เปิด/ปิดพาเลท
    const [pos, setPos] = useState({ x: 80, y: 200 }); // ตำแหน่งพาเลท
    const dragRef = useRef(null);

    // ── ลากย้ายพาเลท ──
    const handleDragStart = useCallback((e) => {
        e.preventDefault();
        const startX = (e.touches ? e.touches[0].clientX : e.clientX) - pos.x;
        const startY = (e.touches ? e.touches[0].clientY : e.clientY) - pos.y;

        const handleMove = (ev) => {
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
            setPos({ x: cx - startX, y: cy - startY });
        };
        const handleUp = () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleUp);
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchmove", handleMove);
        window.addEventListener("touchend", handleUp);
    }, [pos]);

    // ── มุมของแต่ละเครื่องมือ (กระจายรอบวงกลม) ──
    const getToolPosition = (index, total) => {
        // กระจาย 180° (ครึ่งวงกลมด้านขวา) เริ่มจากบน
        const angleStart = -90;  // เริ่มจากด้านบน
        const angleStep = 180 / (total - 1);
        const angle = (angleStart + angleStep * index) * (Math.PI / 180);
        const radius = 60;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    };

    return (
        <div
            className="floating-palette"
            style={{ left: pos.x + "px", top: pos.y + "px" }}
        >
            {/* ปุ่มกลาง: toggle เปิด/ปิด + ลากย้าย */}
            <button
                className={`fp-center ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen((v) => !v)}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                title="เครื่องมือด่วน"
            >
                🎯
            </button>

            {/* เครื่องมือรอบวง */}
            {isOpen && PALETTE_TOOLS.map((t, i) => {
                const offset = getToolPosition(i, PALETTE_TOOLS.length);
                return (
                    <button
                        key={t.id}
                        className={`fp-tool ${tool === t.id ? "active" : ""}`}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px)`,
                        }}
                        onClick={() => onToolChange(t.id)}
                        title={t.title}
                    >
                        {t.icon}
                    </button>
                );
            })}
        </div>
    );
}

export default FloatingPalette;
