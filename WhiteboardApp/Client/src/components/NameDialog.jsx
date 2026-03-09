// ============================================================
// NameDialog.jsx — ป๊อปอัปตั้งชื่อผู้ใช้ + เลือก Role
// ============================================================
//
// แสดงตอนเข้าใช้ครั้งแรก ให้พิมพ์ชื่อ + เลือก Role ก่อนเริ่ม
// ดีไซน์ glassmorphism เข้ากับ UI หลัก
//
// Props:
//  - onSubmit(name, role) → callback เมื่อกรอกชื่อแล้วกด "เข้าร่วม"
//
// ============================================================

import { useState, useRef, useEffect } from "react";

function NameDialog({ onSubmit }) {
    // ──────────────────────────────────────────────────────────
    // State & Refs
    // ──────────────────────────────────────────────────────────
    const [name, setName] = useState("");           // ชื่อที่ user พิมพ์
    const [role, setRole] = useState("contributor"); // role ที่เลือก
    const inputRef = useRef(null);                   // ref สำหรับ auto-focus

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
        onSubmit(finalName, role);
    };

    /** กด Enter = ส่งชื่อ */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    // ──────────────────────────────────────────────────────────
    // Role Options
    // ──────────────────────────────────────────────────────────
    const roles = [
        { id: "host", icon: "👨‍🏫", label: "Teacher", desc: "ควบคุมกระดานทั้งหมด" },
        { id: "contributor", icon: "✏️", label: "Contributor", desc: "วาดและแก้ไขได้" },
        { id: "viewer", icon: "👁️", label: "Viewer", desc: "ดูอย่างเดียว" },
    ];

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

                {/* Role Selector */}
                <div className="role-selector">
                    <p className="role-selector-label">เลือกบทบาท:</p>
                    <div className="role-selector-options">
                        {roles.map((r) => (
                            <button
                                key={r.id}
                                className={`role-option ${role === r.id ? "role-option-active" : ""}`}
                                onClick={() => setRole(r.id)}
                                type="button"
                            >
                                <span className="role-option-icon">{r.icon}</span>
                                <span className="role-option-label">{r.label}</span>
                                <span className="role-option-desc">{r.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

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
