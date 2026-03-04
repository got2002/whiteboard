// ============================================================
// NameDialog.jsx — ป๊อปอัปตั้งชื่อผู้ใช้
// ============================================================
//
// แสดงตอนเข้าใช้ครั้งแรก ให้พิมพ์ชื่อก่อนเริ่มวาด
// ดีไซน์ glassmorphism เข้ากับ UI หลัก
//
// Props:
//  - onSubmit(name) → callback เมื่อกรอกชื่อแล้วกด "เข้าร่วม"
//
// ============================================================

import { useState, useRef, useEffect } from "react";

function NameDialog({ onSubmit }) {
    // ──────────────────────────────────────────────────────────
    // State & Refs
    // ──────────────────────────────────────────────────────────
    const [name, setName] = useState("");       // ชื่อที่ user พิมพ์
    const inputRef = useRef(null);               // ref สำหรับ auto-focus

    // Auto-focus ช่องพิมพ์เมื่อ dialog แสดง
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // ──────────────────────────────────────────────────────────
    // Handlers
    // ──────────────────────────────────────────────────────────

    /** จัดการส่งชื่อ — ถ้าไม่พิมพ์ให้ใช้ชื่อ default */
    const handleSubmit = () => {
        const trimmed = name.trim();
        // สร้างชื่อ default: "ผู้ใช้ XXXX" (เลข 4 หลักสุ่ม)
        const finalName = trimmed || `ผู้ใช้ ${Math.floor(1000 + Math.random() * 9000)}`;
        onSubmit(finalName);
    };

    /** กด Enter = ส่งชื่อ */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    // ──────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────
    return (
        <div className="name-dialog-overlay">
            <div className="name-dialog">
                {/* หัวข้อ */}
                <div className="name-dialog-icon">✏️</div>
                <h2 className="name-dialog-title">ยินดีต้อนรับ!</h2>
                <p className="name-dialog-subtitle">ใส่ชื่อของคุณเพื่อเข้าร่วมกระดาน</p>

                {/* ช่องพิมพ์ชื่อ */}
                <input
                    ref={inputRef}
                    type="text"
                    className="name-dialog-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ชื่อของคุณ..."
                    maxLength={20}
                />

                {/* ปุ่มเข้าร่วม */}
                <button className="name-dialog-btn" onClick={handleSubmit}>
                    🚀 เข้าร่วม
                </button>

                {/* คำแนะนำ */}
                <p className="name-dialog-hint">
                    ถ้าไม่ใส่ชื่อ จะใช้ชื่อสุ่มอัตโนมัติ
                </p>
            </div>
        </div>
    );
}

export default NameDialog;
