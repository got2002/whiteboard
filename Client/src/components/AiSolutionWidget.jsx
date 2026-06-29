// ============================================================
// AiSolutionWidget.jsx — AI Solution Panel (Floating Widget)
// ============================================================
// แผง AI สำหรับสร้างเนื้อหาและแปลภาษา (Host/Teacher only)
// รองรับ Generate + Translate + Canvas Capture
// ============================================================

import { useState, useCallback, useRef } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ============================================================
// Server URL — ใช้วิธีเดียวกับ socket.js
// ============================================================
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const serverUrl = isLocalhost ? "http://localhost:3000" : `http://${window.location.hostname}:3000`;

// ============================================================
// Quick Actions — คำสั่งด่วนสำหรับ Generate tab
// ============================================================
const QUICK_ACTIONS = [
    { id: "explain", label: "อธิบาย", prompt: "อธิบายเนื้อหาในภาพนี้อย่างละเอียด", promptNoImage: "อธิบายเรื่อง: " },
    { id: "summarize", label: "สรุป", prompt: "สรุปเนื้อหาในภาพนี้ให้กระชับ", promptNoImage: "สรุปเรื่อง: " },
    { id: "quiz", label: "สร้างคำถาม", prompt: "สร้างคำถาม 5 ข้อจากเนื้อหาในภาพนี้ พร้อมเฉลย", promptNoImage: "สร้างคำถาม 5 ข้อเกี่ยวกับ: " },
    { id: "suggest", label: "แนะนำ", prompt: "แนะนำแนวทางการสอนเนื้อหาในภาพนี้", promptNoImage: "แนะนำแนวทางสอนเรื่อง: " },
    { id: "analyze", label: "วิเคราะห์", prompt: "วิเคราะห์เนื้อหาในภาพนี้", promptNoImage: "วิเคราะห์เรื่อง: " },
    { id: "check", label: "ตรวจ", prompt: "ตรวจสอบความถูกต้องของเนื้อหาในภาพนี้", promptNoImage: "ตรวจสอบ: " },
];

// ============================================================
// Languages — ภาษาสำหรับ Translate tab
// ============================================================
const LANGUAGES = [
    { code: "en", flag: "🇬🇧", label: "English" },
    { code: "th", flag: "🇹🇭", label: "ไทย" },
    { code: "zh", flag: "🇨🇳", label: "中文" },
    { code: "ja", flag: "🇯🇵", label: "日本語" },
    { code: "ko", flag: "🇰🇷", label: "한국어" },
    { code: "fr", flag: "🇫🇷", label: "Français" },
    { code: "de", flag: "🇩🇪", label: "Deutsch" },
    { code: "es", flag: "🇪🇸", label: "Español" },
];

// ============================================================
// AiSolutionWidget Component
// ============================================================
export default function AiSolutionWidget({ onClose, canvasRef, onInsertText, onStartScreenshot, initialImage }) {
    // ── State ──
    const [activeTab, setActiveTab] = useState("generate"); // 'generate' | 'translate'
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState(initialImage || null); // base64 string
    const [targetLang, setTargetLang] = useState("en");
    const [isMinimized, setIsMinimized] = useState(false);
    const [copied, setCopied] = useState(false);

    const textareaRef = useRef(null);

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;
        setActiveTab(tab);
        setPrompt("");
        setResult("");
        setCapturedImage(null);
    };

    // ── Draggable — ใช้ useDraggable hook เหมือน CalculatorWidget ──
    const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
        storageKey: "proedu1-ai-widget-pos",
        defaultPosition: { x: Math.max(60, window.innerWidth - 440), y: Math.max(80, 100) },
    });

    // ============================================================
    // Canvas Capture — จับภาพจาก Canvas (bg + fg layers)
    // ============================================================
    const handleCaptureCanvas = useCallback(() => {
        if (onStartScreenshot) {
            onStartScreenshot();
        }
    }, [onStartScreenshot]);

    const handleUploadImage = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCapturedImage(ev.target.result);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // ============================================================
    // API: Generate — ส่งคำสั่งไปยัง AI
    // ============================================================
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() && !capturedImage) return;
        setIsLoading(true);
        setResult("");
        try {
            const body = { prompt };
            if (capturedImage) body.imageBase64 = capturedImage;
            const res = await fetch(`${serverUrl}/api/ai/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "AI request failed");
            }
            const data = await res.json();
            setResult(data.result);
        } catch (err) {
            console.error("AI Generation Error:", err);
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { message: "AI กำลังยุ่งหรือเซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ครับ", type: "error" } 
            }));
        } finally {
            setIsLoading(false);
        }
    }, [prompt, capturedImage]);

    // ============================================================
    // API: Translate — แปลภาษา
    // ============================================================
    const handleTranslate = useCallback(async () => {
        if (!prompt.trim() && !capturedImage) return;
        setIsLoading(true);
        setResult("");
        try {
            const body = { text: prompt, targetLang };
            if (capturedImage) body.imageBase64 = capturedImage;
            const res = await fetch(`${serverUrl}/api/ai/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Translation failed");
            }
            const data = await res.json();
            setResult(data.result);
        } catch (err) {
            console.error("AI Translation Error:", err);
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { message: "AI กำลังยุ่งหรือเซิร์ฟเวอร์แปลภาษามีปัญหา กรุณาลองใหม่ครับ", type: "error" } 
            }));
        } finally {
            setIsLoading(false);
        }
    }, [prompt, capturedImage, targetLang]);

    // ============================================================
    // Submit — เลือก generate หรือ translate ตาม tab
    // ============================================================
    const handleSubmit = useCallback(() => {
        if (activeTab === "generate") {
            handleGenerate();
        } else {
            handleTranslate();
        }
    }, [activeTab, handleGenerate, handleTranslate]);

    // ============================================================
    // Quick Action — ตั้งค่า prompt ด่วน
    // ============================================================
    const handleQuickAction = useCallback((action) => {
        const newPrompt = capturedImage ? action.prompt : action.promptNoImage;
        setPrompt(newPrompt);
        // Focus textarea
        if (textareaRef.current) {
            textareaRef.current.focus();
            // If no image, place cursor at end for user to type topic
            if (!capturedImage) {
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.selectionStart = newPrompt.length;
                        textareaRef.current.selectionEnd = newPrompt.length;
                    }
                }, 0);
            }
        }
    }, [capturedImage]);

    // ============================================================
    // Copy Result — คัดลอกผลลัพธ์
    // ============================================================
    const handleCopy = useCallback(() => {
        if (!result) return;
        navigator.clipboard.writeText(result).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            // Fallback
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [result]);

    // ============================================================
    // Insert to Board — วางผลลัพธ์ลงบอร์ด
    // ============================================================
    const handleInsertToBoard = useCallback(() => {
        if (onInsertText && result) {
            onInsertText(result);
            setIsMinimized(true);
        }
    }, [onInsertText, result]);

    // ============================================================
    // Clear captured image — ลบภาพที่จับ
    // ============================================================
    const handleClearCapture = useCallback(() => {
        setCapturedImage(null);
    }, []);

    // ============================================================
    // Render
    // ============================================================
    return (
        <div
            className={`ai-widget ${isMinimized ? "minimized" : ""} ${isDragging ? "is-dragging" : ""}`}
            data-draggable
            style={dragStyle}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* ── Header (Drag Handle) ── */}
            <div
                className="ai-widget-header"
                ref={handleRef}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onDoubleClick={resetPosition}
            >
                <div className="ai-widget-title" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <span>AI Solution</span>
                </div>
                <div className="ai-widget-header-actions">
                    {/* Minimize button */}
                    <button
                        className="ai-widget-header-btn"
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(v => !v); }}
                        title={isMinimized ? "ขยาย" : "ย่อ"}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            {isMinimized ? (
                                <path d="M4 14h6v6M20 10h-6V4M4 14l6-6M20 10l-6 6" />
                            ) : (
                                <path d="M4 12h16" />
                            )}
                        </svg>
                    </button>
                    {/* Close button */}
                    <button
                        className="ai-widget-header-btn ai-widget-close-btn"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        title="ปิด AI Solution"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Body (hidden when minimized) ── */}
            {!isMinimized && (
                <div className="ai-widget-body">
                    {/* ── Tabs ── */}
                    <div className="ai-widget-tabs">
                        <button
                            className={`ai-widget-tab ${activeTab === "generate" ? "active" : ""}`}
                            onClick={() => handleTabChange("generate")}
                        >
                            <span>สร้างเนื้อหา</span>
                        </button>
                        <button
                            className={`ai-widget-tab ${activeTab === "translate" ? "active" : ""}`}
                            onClick={() => handleTabChange("translate")}
                        >
                            <span>แปลภาษา</span>
                        </button>
                    </div>

                    {/* ── Canvas Capture Area ── */}
                    <div className="ai-widget-capture-area">
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                className="ai-widget-capture-btn"
                                style={{ flex: 1 }}
                                onClick={handleCaptureCanvas}
                                title="จับภาพจากกระดาน"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span>จับภาพกระดาน</span>
                            </button>
                            <button
                                className="ai-widget-capture-btn"
                                style={{ flex: 1 }}
                                onClick={handleUploadImage}
                                title="อัปโหลดรูปภาพ"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span>อัปโหลดรูป</span>
                            </button>
                        </div>
                        {capturedImage && (
                            <div className="ai-widget-capture-preview">
                                <img src={capturedImage} alt="captured canvas" />
                                <button
                                    className="ai-widget-capture-remove"
                                    onClick={handleClearCapture}
                                    title="ลบภาพ"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Text Input ── */}
                    <textarea
                        ref={textareaRef}
                        className="ai-widget-input"
                        rows={3}
                        placeholder={
                            activeTab === "generate"
                                ? "พิมพ์คำสั่ง... เช่น อธิบายเรื่องนี้, สร้างแบบฝึกหัด"
                                : "พิมพ์ข้อความที่ต้องการแปล..."
                        }
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />

                    {/* ── Quick Actions (Generate tab only) ── */}
                    {activeTab === "generate" && (
                        <div className="ai-widget-quick-actions">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.id}
                                    className="ai-widget-quick-btn"
                                    onClick={() => handleQuickAction(action)}
                                    title={action.prompt}
                                >
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Language Grid (Translate tab only) ── */}
                    {activeTab === "translate" && (
                        <div className="ai-widget-lang-grid">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    className={`ai-widget-lang-btn ${targetLang === lang.code ? "active" : ""}`}
                                    onClick={() => setTargetLang(lang.code)}
                                    title={lang.label}
                                >
                                    <span className="ai-widget-lang-flag">{lang.flag}</span>
                                    <span className="ai-widget-lang-label">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Submit Button ── */}
                    <button
                        className="ai-widget-submit"
                        onClick={handleSubmit}
                        disabled={isLoading || (!prompt.trim() && !capturedImage)}
                    >
                        {isLoading ? (
                            <>
                                <span>กำลังประมวลผล...</span>
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                <span>{activeTab === "generate" ? "ส่งคำสั่ง" : "แปลภาษา"}</span>
                            </>
                        )}
                    </button>

                    {/* ❌ Error Display removed in favor of Toast */}

                    {/* ── Result Section ── */}
                    {isLoading && (
                        <div className="ai-widget-loading">
                            <span className="ai-loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                            <span>กำลังประมวลผล... กรุณารอสักครู่</span>
                        </div>
                    )}
                    {!isLoading && result && (
                        <>
                            <div className="ai-widget-result-divider">
                                <span>ผลลัพธ์</span>
                            </div>
                            <div className="ai-widget-result">
                                {result.split("\n").map((line, i) => (
                                    <p key={i}>{line || "\u00A0"}</p>
                                ))}
                            </div>
                            <div className="ai-widget-result-actions">
                                <button
                                    className="ai-widget-action-btn"
                                    onClick={handleCopy}
                                    title="คัดลอกผลลัพธ์"
                                >
                                    {copied ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>คัดลอกแล้ว!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                            <span>คัดลอก</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    className="ai-widget-action-btn ai-widget-insert-btn"
                                    onClick={handleInsertToBoard}
                                    title="วางผลลัพธ์ลงบอร์ด"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>วางลงบอร์ด</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
