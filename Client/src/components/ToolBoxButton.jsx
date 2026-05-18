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
    // ── Math Tools ──
    {
        id: "protractor",
        label: "Protractor",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 18 A10 10 0 0 1 22 18" fill="rgba(59,130,246,0.1)" />
                <path d="M2 18h20" />
                <path d="M12 18v-10" opacity="0.4" />
                <path d="M5.5 10.5l1 1" opacity="0.3" />
                <path d="M18.5 10.5l-1 1" opacity="0.3" />
                <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "full_protractor",
        label: "360° Protractor",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" fill="rgba(168,85,247,0.1)" />
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v3" opacity="0.4" />
                <path d="M12 18v3" opacity="0.4" />
                <path d="M3 12h3" opacity="0.4" />
                <path d="M18 12h3" opacity="0.4" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "ruler",
        label: "Ruler",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="8" width="22" height="8" rx="1.5" fill="rgba(234,179,8,0.1)" />
                <path d="M5 8v3" opacity="0.5" />
                <path d="M9 8v5" opacity="0.5" />
                <path d="M13 8v3" opacity="0.5" />
                <path d="M17 8v5" opacity="0.5" />
                <path d="M21 8v3" opacity="0.5" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "set_square_45",
        label: "Set Square 45°",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 20L3 4L21 20Z" fill="rgba(34,197,94,0.1)" />
                <rect x="3" y="16" width="4" height="4" opacity="0.3" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "set_square_60",
        label: "Set Square 30-60°",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 20L12 4L21 20Z" fill="rgba(6,182,212,0.1)" />
                <rect x="3" y="16" width="4" height="4" opacity="0.3" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "compass",
        label: "Compass",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="14" r="7" strokeDasharray="3 2" opacity="0.4" />
                <path d="M12 4l-2 10" />
                <path d="M12 4l2 10" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="12" cy="14" r="0.8" fill="currentColor" stroke="none" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "t_square",
        label: "T-Square",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6h20" />
                <path d="M12 6v16" />
                <rect x="2" y="4" width="20" height="4" rx="1" fill="rgba(100,116,139,0.15)" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "number_line",
        label: "Number Line",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20" />
                <path d="M22 12l-2-2M22 12l-2 2" />
                <path d="M6 10v4M12 10v4M18 10v4" opacity="0.6" />
                <text x="6" y="20" textAnchor="middle" fill="currentColor" fontSize="5" stroke="none">-1</text>
                <text x="12" y="20" textAnchor="middle" fill="currentColor" fontSize="5" stroke="none">0</text>
                <text x="18" y="20" textAnchor="middle" fill="currentColor" fontSize="5" stroke="none">1</text>
            </svg>
        ),
        category: "math",
    },
    {
        id: "coord_grid",
        label: "Coordinate Grid",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20" />
                <path d="M12 2v20" />
                <path d="M22 12l-2-1.5M22 12l-2 1.5" opacity="0.5" />
                <path d="M12 2l-1.5 2M12 2l1.5 2" opacity="0.5" />
                <path d="M8 8h8v8H8z" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "clock_face",
        label: "Clock",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="rgba(251,191,36,0.1)" />
                <path d="M12 6v6l4 2" />
                <path d="M12 2v2" opacity="0.4" />
                <path d="M12 20v2" opacity="0.4" />
                <path d="M2 12h2" opacity="0.4" />
                <path d="M20 12h2" opacity="0.4" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "fraction_circle",
        label: "Fraction Circle",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18" />
                <path d="M3 12h18" />
                <path d="M12 12L5.6 5.6" opacity="0.4" />
                <path fill="rgba(239,68,68,0.15)" d="M12 12L12 3A9 9 0 0 1 21 12Z" stroke="none" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "graph_paper",
        label: "Graph Paper",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
                <rect x="2" y="2" width="20" height="20" rx="1" strokeWidth="1.5" opacity="1" fill="rgba(59,130,246,0.05)" />
                <path d="M6 2v20M10 2v20M14 2v20M18 2v20" />
                <path d="M2 6h20M2 10h20M2 14h20M2 18h20" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "dice",
        label: "Dice",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(255,255,255,0.05)" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "spinner",
        label: "Spinner Wheel",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v9l6.36 3.64" />
                <path d="M12 12L5.64 15.64" />
                <path fill="rgba(34,197,94,0.15)" d="M12 12L12 3A9 9 0 0 1 18.36 15.64Z" stroke="none" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
        ),
        category: "math",
    },
    {
        id: "l_square",
        label: "L-Square",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v16h16" />
                <path d="M4 4h4v16" fill="rgba(100,116,139,0.1)" />
                <path d="M4 20h16v-4" fill="rgba(100,116,139,0.1)" />
                <path d="M8 6v2M8 10v2M8 14v2" opacity="0.4" />
                <path d="M10 16h2M14 16h2" opacity="0.4" />
                <rect x="4" y="16" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            </svg>
        ),
        category: "math",
    },
];

const CATEGORIES = [
    { id: "gadgets", label: "Gadgets" },
    { id: "math", label: "Math Tools" },
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
