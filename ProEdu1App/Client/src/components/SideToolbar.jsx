// ============================================================
// SideToolbar.jsx — แถบเครื่องมือด้านซ้าย (EClass-style)
// ============================================================
//
// แถบแนวตั้งลอยด้านซ้ายของจอ ประกอบด้วย:
//  - 📱 QR Share
//  - ℹ️ Info / Help
//  - 📷 Screenshot (capture หน้านี้)
//  - ⚙️ Settings
//
// ============================================================

import { useState } from "react";

function SideToolbar({ onScreenshot }) {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="side-toolbar">
            {/* Info / Help */}
            <button
                className="side-btn"
                onClick={() => setShowInfo((v) => !v)}
                title="ช่วยเหลือ"
            >
                ℹ️
            </button>

            {/* Screenshot */}
            <button
                className="side-btn"
                onClick={onScreenshot}
                title="บันทึกหน้าจอ"
            >
                📷
            </button>

            {/* Info popup */}
            {showInfo && (
                <div className="side-info-popup">
                    <div className="side-info-header">
                        <span>📌 คีย์ลัด</span>
                        <button onClick={() => setShowInfo(false)}>✕</button>
                    </div>
                    <ul className="side-info-list">
                        <li><kbd>B</kbd> ปากกา</li>
                        <li><kbd>H</kbd> ปากกาเน้น</li>
                        <li><kbd>E</kbd> ยางลบ</li>
                        <li><kbd>T</kbd> ข้อความ</li>
                        <li><kbd>V</kbd> เลือก/ย้าย</li>
                        <li><kbd>L</kbd> เส้นตรง</li>
                        <li><kbd>R</kbd> สี่เหลี่ยม</li>
                        <li><kbd>C</kbd> วงกลม</li>
                        <li><kbd>P</kbd> เลเซอร์</li>
                        <li><kbd>Ctrl+Z</kbd> เลิกทำ</li>
                        <li><kbd>Ctrl+Y</kbd> ทำซ้ำ</li>
                        <li><kbd>Ctrl+S</kbd> บันทึก</li>
                        <li><kbd>Ctrl+O</kbd> เปิดไฟล์</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default SideToolbar;
