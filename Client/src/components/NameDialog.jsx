// ============================================================
// NameDialog.jsx — ป๊อปอัปตั้งชื่อ (Auto Role)
// ============================================================
//
// Role ถูกกำหนดอัตโนมัติ:
//  - ถ้ายังไม่มี host → เป็นครู (host) โดยอัตโนมัติ
//  - ถ้ามี host อยู่แล้ว → เป็นนักเรียน (viewer) โดยอัตโนมัติ
//
// Props:
//  - onSubmit(name, role)  → callback
//  - hostExists            → boolean
//
// ============================================================

import { useState, useRef, useEffect } from "react";

function NameDialog({ onSubmit, hostExists }) {
    const [name, setName] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // กำหนด role อัตโนมัติ
    const autoRole = hostExists ? "viewer" : "host";

    const handleSubmit = () => {
        const trimmed = name.trim();
        const finalName = trimmed || (autoRole === "host"
            ? `ครู ${Math.floor(100 + Math.random() * 900)}`
            : `นักเรียน ${Math.floor(1000 + Math.random() * 9000)}`);
        onSubmit(finalName, autoRole);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="name-dialog-overlay">
            <div className="name-dialog">
                {/* หัวข้อ */}
                <h2 className="name-dialog-title">
                    {hostExists ? "เข้าร่วมกระดาน" : "สร้างกระดาน"}
                </h2>
                <p className="name-dialog-subtitle">ใส่ชื่อของคุณเพื่อเริ่มใช้งาน</p>

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
                    เข้าร่วม
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
