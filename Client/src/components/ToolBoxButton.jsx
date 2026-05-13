// ============================================================
// ToolBoxButton.jsx — ToolBox Panel (คล้าย ClassPoint)
// ============================================================
// ปุ่ม ToolBox ที่กดแล้วเปิด Panel แสดงเครื่องมือต่างๆ
// วางไว้ใน HeaderBar
// ============================================================

import { useState, useRef, useEffect } from "react";

// ── Tool Items ──
const TOOLBOX_ITEMS = [
    {
        id: "calculator",
        label: "Calculator",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M8 6h8" />
                <circle cx="8" cy="11" r="0.8" fill="currentColor" />
                <circle cx="12" cy="11" r="0.8" fill="currentColor" />
                <circle cx="16" cy="11" r="0.8" fill="currentColor" />
                <circle cx="8" cy="15" r="0.8" fill="currentColor" />
                <circle cx="12" cy="15" r="0.8" fill="currentColor" />
                <circle cx="16" cy="15" r="0.8" fill="currentColor" />
                <circle cx="8" cy="19" r="0.8" fill="currentColor" />
                <circle cx="12" cy="19" r="0.8" fill="currentColor" />
                <circle cx="16" cy="19" r="0.8" fill="currentColor" />
            </svg>
        ),
        category: "gadgets",
    },
    {
        id: "spotlight",
        label: "Spotlight",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" fill="rgba(250, 204, 21, 0.25)" stroke="currentColor" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M4.93 19.07l1.41-1.41" />
                <path d="M17.66 6.34l1.41-1.41" />
            </svg>
        ),
        category: "gadgets",
    },
    {
        id: "table",
        label: "Table",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
            </svg>
        ),
        category: "gadgets",
    },
    {
        id: "graph",
        label: "Chart",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="5" width="4" height="16" rx="1" />
                <rect x="17" y="8" width="4" height="13" rx="1" />
            </svg>
        ),
        category: "gadgets",
    },
    {
        id: "periodic",
        label: "Periodic Table",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                {/* Mini periodic table grid */}
                <rect x="2" y="3" width="5" height="5" rx="0.8" fill="rgba(79,195,247,0.25)" stroke="rgba(79,195,247,0.7)" />
                <text x="4.5" y="7" textAnchor="middle" fill="currentColor" fontSize="4" fontWeight="bold" stroke="none">H</text>
                <rect x="17" y="3" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.4" />
                <rect x="2" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.4" />
                <rect x="7.5" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.4" />
                <rect x="17" y="9.5" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.4" />
                <rect x="2" y="16" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.3" />
                <rect x="7.5" y="16" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.3" />
                <rect x="12.5" y="16" width="4" height="5" rx="0.8" stroke="currentColor" opacity="0.3" />
                <rect x="17" y="16" width="5" height="5" rx="0.8" stroke="currentColor" opacity="0.3" />
            </svg>
        ),
        category: "gadgets",
    },
    {
        id: "curtain",
        label: "Curtain",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="2" width="18" height="4" rx="1" fill="rgba(168,85,247,0.2)" />
                <path d="M3 6h18" />
                <path d="M3 10h18" strokeDasharray="2 2" opacity="0.5" />
                <path d="M3 14h18" strokeDasharray="2 2" opacity="0.3" />
                <rect x="9" y="6" width="6" height="2" rx="1" fill="currentColor" opacity="0.3" />
                <path d="M12 8v4" opacity="0.4" />
                <path d="M10 12l2 2 2-2" opacity="0.4" />
            </svg>
        ),
        category: "gadgets",
    },
    // ── Future tools will be added here ──
    // { id: "timer", label: "Timer", icon: ..., category: "gadgets" },
    // { id: "stopwatch", label: "Stopwatch", icon: ..., category: "gadgets" },
    // { id: "ruler", label: "Ruler", icon: ..., category: "math" },
    // { id: "protractor", label: "Protractor", icon: ..., category: "math" },
];

const CATEGORIES = [
    { id: "gadgets", label: "Gadgets" },
    // { id: "math", label: "Math Tools" },
    // { id: "science", label: "Science" },
];

export default function ToolBoxButton({ onToolSelect, activeTools = {} }) {
    const [showPanel, setShowPanel] = useState(false);
    const [activeCategory, setActiveCategory] = useState("gadgets");
    const panelRef = useRef(null);

    // Close panel on outside click
    useEffect(() => {
        if (!showPanel) return;
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowPanel(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showPanel]);

    const filteredItems = TOOLBOX_ITEMS.filter(item => item.category === activeCategory);

    return (
        <div className="toolbox-wrap" ref={panelRef}>
            {/* ── Trigger Button ── */}
            <button
                className={`header-btn toolbox-trigger ${showPanel ? "header-btn-active" : ""}`}
                onClick={() => setShowPanel(v => !v)}
                title="ToolBox — เครื่องมือเสริม"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="toolbox-label">ToolBox</span>
            </button>

            {/* ── Panel Popup ── */}
            {showPanel && (
                <div className="toolbox-panel">
                    {/* Category Tabs */}
                    <div className="toolbox-tabs">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`toolbox-tab ${activeCategory === cat.id ? "active" : ""}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Tool Grid */}
                    <div className="toolbox-grid">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                className={`toolbox-item ${activeTools[item.id] ? "active" : ""}`}
                                onClick={() => {
                                    onToolSelect(item.id);
                                    setShowPanel(false);
                                }}
                                title={item.label}
                            >
                                <span className="toolbox-item-icon">{item.icon}</span>
                                <span className="toolbox-item-label">{item.label}</span>
                            </button>
                        ))}

                        {/* Placeholder for future tools */}
                        {filteredItems.length < 6 && Array.from({ length: Math.max(0, 3 - filteredItems.length) }).map((_, i) => (
                            <div key={`ph-${i}`} className="toolbox-item toolbox-placeholder">
                                <span className="toolbox-item-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
                                        <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                                        <path d="M12 8v8M8 12h8" opacity="0.3" />
                                    </svg>
                                </span>
                                <span className="toolbox-item-label" style={{ opacity: 0.3 }}>เร็วๆ นี้</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
