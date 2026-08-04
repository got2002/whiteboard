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

import { useI18n } from "../i18n/i18n";
import { useState } from "react";

function SideToolbar({ onScreenshot }) {
  const { t } = useI18n();
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="side-toolbar">
            {/* Info / Help */}
            <button
                className="side-btn"
                onClick={() => setShowInfo((v) => !v)}
                title={t("deepCleanup.tooltipHelp")}
            >
                ℹ️
            </button>

            {/* Screenshot */}
            <button
                className="side-btn"
                onClick={onScreenshot}
                title={t("deepCleanup.tooltipRecordStart")}
            >
                📷
            </button>

            {/* Info popup */}
            {showInfo && (
                <div className="side-info-popup">
                    <div className="side-info-header">
                        <span>📌 {t("deepCleanup.shortcuts") || "คีย์ลัด"}</span>
                        <button onClick={() => setShowInfo(false)}>✕</button>
                    </div>
                    <ul className="side-info-list">
                        <li><kbd>B</kbd> {t("deepCleanup.tooltipPen")}</li>
                        <li><kbd>H</kbd> {t("deepCleanup.tooltipHighlighter")}</li>
                        <li><kbd>E</kbd> {t("deepCleanup.tooltipEraser")}</li>
                        <li><kbd>T</kbd> {t("deepCleanup.tooltipText")}</li>
                        <li><kbd>V</kbd> {t("deepCleanup.tooltipSelect")}</li>
                        <li><kbd>L</kbd> {t("deepCleanup.tooltipLine")}</li>
                        <li><kbd>R</kbd> {t("deepCleanup.tooltipRect")}</li>
                        <li><kbd>C</kbd> {t("deepCleanup.tooltipCircle")}</li>
                        <li><kbd>P</kbd> {t("deepCleanup.tooltipLaser")}</li>
                        <li><kbd>Ctrl+Z</kbd> {t("deepCleanup.tooltipUndo")}</li>
                        <li><kbd>Ctrl+Y</kbd> {t("deepCleanup.tooltipRedo")}</li>
                        <li><kbd>Ctrl+S</kbd> {t("deepCleanup.tooltipSave")}</li>
                        <li><kbd>Ctrl+O</kbd> {t("deepCleanup.tooltipOpen")}</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default SideToolbar;
