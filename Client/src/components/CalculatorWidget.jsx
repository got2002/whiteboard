// ============================================================
// CalculatorWidget.jsx — Scientific Calculator (Floating Widget)
// ============================================================
// เครื่องคิดเลข Scientific ลอย ลากได้
// รองรับทั้งโหมด Standard และ Scientific
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ============================================================
// Calculator Logic
// ============================================================
function evaluate(expression) {
    try {
        // Sanitize: replace display symbols with JS operators
        let expr = expression
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/π/g, `(${Math.PI})`)
            .replace(/e(?!x)/g, `(${Math.E})`)
            .replace(/mod/g, "%");
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${expr})`)();
        if (!isFinite(result)) return "Error";
        return result;
    } catch {
        return "Error";
    }
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// ============================================================
// CalculatorWidget Component
// ============================================================
export default function CalculatorWidget({ onClose }) {
    const [display, setDisplay] = useState("0");
    const [expression, setExpression] = useState("");
    const [prevResult, setPrevResult] = useState(null);
    const [isNewInput, setIsNewInput] = useState(true);
    const [memory, setMemory] = useState(0);
    const [hasMemory, setHasMemory] = useState(false);
    const [isScientific, setIsScientific] = useState(false);
    const [history, setHistory] = useState([]);
    const [isDeg, setIsDeg] = useState(true); // degree vs radian
    const [isInv, setIsInv] = useState(false); // inverse trig functions
    const displayRef = useRef(null);

    // ── Draggable ──
    const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
        storageKey: "proedu1-calculator-pos",
        defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 160), y: Math.max(80, window.innerHeight / 2 - 240) },
    });

    // ── Helper: append to display ──
    const appendToDisplay = useCallback((value) => {
        setDisplay(prev => {
            if (isNewInput || prev === "0" || prev === "Error") {
                setIsNewInput(false);
                return value;
            }
            return prev + value;
        });
    }, [isNewInput]);

    // ── Number input ──
    const handleNumber = useCallback((num) => {
        appendToDisplay(num);
    }, [appendToDisplay]);

    // ── Operator input ──
    const handleOperator = useCallback((op) => {
        setDisplay(prev => {
            if (prev === "Error") return "0";
            const lastChar = prev.slice(-1);
            // If last char is already an operator, replace it
            if (["+", "-", "×", "÷"].includes(lastChar)) {
                return prev.slice(0, -1) + op;
            }
            setIsNewInput(false);
            return prev + op;
        });
    }, []);

    // ── Calculate result ──
    const handleEquals = useCallback(() => {
        const result = evaluate(display);
        if (result !== "Error") {
            setHistory(prev => [...prev.slice(-9), { expr: display, result: String(result) }]);
            setExpression(display + " =");
            setPrevResult(result);
            setDisplay(String(result));
            setIsNewInput(true);
        } else {
            setDisplay("Error");
            setIsNewInput(true);
        }
    }, [display]);

    // ── Clear ──
    const handleClear = useCallback(() => {
        setDisplay("0");
        setExpression("");
        setPrevResult(null);
        setIsNewInput(true);
    }, []);

    // ── Clear Entry ──
    const handleClearEntry = useCallback(() => {
        setDisplay("0");
        setIsNewInput(true);
    }, []);

    // ── Backspace ──
    const handleBackspace = useCallback(() => {
        setDisplay(prev => {
            if (prev.length <= 1 || prev === "Error") return "0";
            return prev.slice(0, -1);
        });
    }, []);

    // ── Decimal point ──
    const handleDecimal = useCallback(() => {
        setDisplay(prev => {
            if (isNewInput) {
                setIsNewInput(false);
                return "0.";
            }
            // Find the last number segment and check if it already has a dot
            const parts = prev.split(/[+\-×÷]/);
            const lastPart = parts[parts.length - 1];
            if (lastPart.includes(".")) return prev;
            return prev + ".";
        });
    }, [isNewInput]);

    // ── Toggle sign ──
    const handleToggleSign = useCallback(() => {
        setDisplay(prev => {
            if (prev === "0" || prev === "Error") return prev;
            const num = parseFloat(prev);
            if (!isNaN(num)) return String(-num);
            return prev;
        });
    }, []);

    // ── Percentage ──
    const handlePercent = useCallback(() => {
        setDisplay(prev => {
            const num = parseFloat(prev);
            if (isNaN(num)) return prev;
            return String(num / 100);
        });
    }, []);

    // ── Memory operations ──
    const handleMemoryClear = useCallback(() => { setMemory(0); setHasMemory(false); }, []);
    const handleMemoryRecall = useCallback(() => {
        setDisplay(String(memory));
        setIsNewInput(true);
    }, [memory]);
    const handleMemoryAdd = useCallback(() => {
        const num = parseFloat(display);
        if (!isNaN(num)) { setMemory(prev => prev + num); setHasMemory(true); }
    }, [display]);
    const handleMemorySubtract = useCallback(() => {
        const num = parseFloat(display);
        if (!isNaN(num)) { setMemory(prev => prev - num); setHasMemory(true); }
    }, [display]);

    // ── Scientific functions ──
    const handleScientific = useCallback((fn) => {
        const num = parseFloat(display);
        if (isNaN(num) && !["pi", "euler"].includes(fn)) {
            setDisplay("Error");
            setIsNewInput(true);
            return;
        }

        let result;
        const angle = isDeg ? (num * Math.PI / 180) : num;
        const invAngle = (val) => isDeg ? (val * 180 / Math.PI) : val;

        switch (fn) {
            case "sin": result = isInv ? invAngle(Math.asin(num)) : Math.sin(angle); break;
            case "cos": result = isInv ? invAngle(Math.acos(num)) : Math.cos(angle); break;
            case "tan": result = isInv ? invAngle(Math.atan(num)) : Math.tan(angle); break;
            case "log": result = Math.log10(num); break;
            case "ln": result = Math.log(num); break;
            case "sqrt": result = Math.sqrt(num); break;
            case "cbrt": result = Math.cbrt(num); break;
            case "square": result = num * num; break;
            case "cube": result = num * num * num; break;
            case "reciprocal": result = 1 / num; break;
            case "factorial": result = factorial(Math.floor(num)); break;
            case "pi": result = Math.PI; break;
            case "euler": result = Math.E; break;
            case "abs": result = Math.abs(num); break;
            case "exp": result = Math.exp(num); break;
            case "pow10": result = Math.pow(10, num); break;
            default: result = num;
        }

        if (!isFinite(result) || isNaN(result)) {
            setDisplay("Error");
        } else {
            // Format to avoid floating point display issues
            const formatted = parseFloat(result.toPrecision(12));
            setDisplay(String(formatted));
        }
        setIsNewInput(true);
    }, [display, isDeg, isInv]);

    // ── Parentheses ──
    const handleParenOpen = useCallback(() => {
        setDisplay(prev => {
            if (isNewInput || prev === "0" || prev === "Error") {
                setIsNewInput(false);
                return "(";
            }
            return prev + "(";
        });
    }, [isNewInput]);

    const handleParenClose = useCallback(() => {
        setDisplay(prev => prev + ")");
    }, []);

    // ── Power ──
    const handlePower = useCallback(() => {
        handleOperator("**");
    }, [handleOperator]);

    // ── Keyboard support ──
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't capture if user is typing in a text input elsewhere
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if (e.key >= "0" && e.key <= "9") handleNumber(e.key);
            else if (e.key === "+") handleOperator("+");
            else if (e.key === "-") handleOperator("-");
            else if (e.key === "*") handleOperator("×");
            else if (e.key === "/") { e.preventDefault(); handleOperator("÷"); }
            else if (e.key === "Enter" || e.key === "=") handleEquals();
            else if (e.key === "Escape") handleClear();
            else if (e.key === "Backspace") handleBackspace();
            else if (e.key === ".") handleDecimal();
            else if (e.key === "%") handlePercent();
            else if (e.key === "(") handleParenOpen();
            else if (e.key === ")") handleParenClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNumber, handleOperator, handleEquals, handleClear, handleBackspace, handleDecimal, handlePercent, handleParenOpen, handleParenClose]);

    // ── Auto-scroll display ──
    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollLeft = displayRef.current.scrollWidth;
        }
    }, [display]);

    // ── Format display number ──
    const formatDisplay = (val) => {
        if (val === "Error") return "Error";
        // If it's a simple number, format with commas
        const num = parseFloat(val);
        if (!isNaN(num) && val === String(num) && isFinite(num)) {
            if (Math.abs(num) >= 1e15) return num.toExponential(6);
            if (Number.isInteger(num)) return num.toLocaleString("en-US");
            // Show decimals
            const parts = val.split(".");
            return parseFloat(parts[0]).toLocaleString("en-US") + "." + (parts[1] || "");
        }
        return val;
    };

    // ── Standard buttons ──
    const standardButtons = [
        [
            { label: "%", action: handlePercent, className: "calc-fn" },
            { label: "CE", action: handleClearEntry, className: "calc-fn" },
            { label: "C", action: handleClear, className: "calc-fn calc-clear" },
            { label: "⌫", action: handleBackspace, className: "calc-fn" },
        ],
        [
            { label: "¹/ₓ", action: () => handleScientific("reciprocal"), className: "calc-fn" },
            { label: "x²", action: () => handleScientific("square"), className: "calc-fn" },
            { label: "√x", action: () => handleScientific("sqrt"), className: "calc-fn" },
            { label: "÷", action: () => handleOperator("÷"), className: "calc-op" },
        ],
        [
            { label: "7", action: () => handleNumber("7") },
            { label: "8", action: () => handleNumber("8") },
            { label: "9", action: () => handleNumber("9") },
            { label: "×", action: () => handleOperator("×"), className: "calc-op" },
        ],
        [
            { label: "4", action: () => handleNumber("4") },
            { label: "5", action: () => handleNumber("5") },
            { label: "6", action: () => handleNumber("6") },
            { label: "−", action: () => handleOperator("-"), className: "calc-op" },
        ],
        [
            { label: "1", action: () => handleNumber("1") },
            { label: "2", action: () => handleNumber("2") },
            { label: "3", action: () => handleNumber("3") },
            { label: "+", action: () => handleOperator("+"), className: "calc-op" },
        ],
        [
            { label: "±", action: handleToggleSign },
            { label: "0", action: () => handleNumber("0") },
            { label: ".", action: handleDecimal },
            { label: "=", action: handleEquals, className: "calc-equals" },
        ],
    ];

    // ── Scientific extra buttons ──
    const scientificButtons = [
        [
            { label: isInv ? "INV ✓" : "INV", action: () => setIsInv(v => !v), className: `calc-sci ${isInv ? "calc-active" : ""}` },
            { label: isDeg ? "DEG" : "RAD", action: () => setIsDeg(v => !v), className: "calc-sci" },
            { label: "π", action: () => handleScientific("pi"), className: "calc-sci" },
            { label: "e", action: () => handleScientific("euler"), className: "calc-sci" },
        ],
        [
            { label: isInv ? "sin⁻¹" : "sin", action: () => handleScientific("sin"), className: "calc-sci" },
            { label: isInv ? "cos⁻¹" : "cos", action: () => handleScientific("cos"), className: "calc-sci" },
            { label: isInv ? "tan⁻¹" : "tan", action: () => handleScientific("tan"), className: "calc-sci" },
            { label: "n!", action: () => handleScientific("factorial"), className: "calc-sci" },
        ],
        [
            { label: "log", action: () => handleScientific("log"), className: "calc-sci" },
            { label: "ln", action: () => handleScientific("ln"), className: "calc-sci" },
            { label: "(", action: handleParenOpen, className: "calc-sci" },
            { label: ")", action: handleParenClose, className: "calc-sci" },
        ],
        [
            { label: "xʸ", action: handlePower, className: "calc-sci" },
            { label: "10ˣ", action: () => handleScientific("pow10"), className: "calc-sci" },
            { label: "eˣ", action: () => handleScientific("exp"), className: "calc-sci" },
            { label: "|x|", action: () => handleScientific("abs"), className: "calc-sci" },
        ],
    ];

    return (
        <div
            className={`calculator-widget ${isDragging ? "is-dragging" : ""}`}
            data-draggable
            style={dragStyle}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* ── Title Bar (Drag Handle) ── */}
            <div
                className="calc-titlebar"
                ref={handleRef}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onDoubleClick={resetPosition}
            >
                <div className="calc-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <path d="M8 6h8" />
                        <path d="M8 10h2M14 10h2" />
                        <path d="M8 14h2M14 14h2" />
                        <path d="M8 18h2M14 18h2" />
                    </svg>
                    <span>Calculator</span>
                </div>
                <div className="calc-titlebar-actions">
                    {/* Toggle Scientific/Standard */}
                    <button
                        className={`calc-mode-toggle ${isScientific ? "active" : ""}`}
                        onClick={() => setIsScientific(v => !v)}
                        title={isScientific ? "Standard Mode" : "Scientific Mode"}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <text x="4" y="18" fontSize="16" fill="currentColor" stroke="none" fontStyle="italic" fontFamily="serif">fx</text>
                        </svg>
                    </button>
                    <button className="calc-close-btn" onClick={onClose} title="ปิดเครื่องคิดเลข">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Display ── */}
            <div className="calc-display-area">
                {expression && (
                    <div className="calc-expression">{expression}</div>
                )}
                <div className="calc-display" ref={displayRef}>
                    {formatDisplay(display)}
                </div>
                {hasMemory && (
                    <div className="calc-memory-indicator">M</div>
                )}
            </div>

            {/* ── Memory Buttons ── */}
            <div className="calc-memory-row">
                <button className="calc-mem-btn" onClick={handleMemoryClear} title="Memory Clear">MC</button>
                <button className="calc-mem-btn" onClick={handleMemoryRecall} title="Memory Recall">MR</button>
                <button className="calc-mem-btn" onClick={handleMemoryAdd} title="Memory Add">M+</button>
                <button className="calc-mem-btn" onClick={handleMemorySubtract} title="Memory Subtract">M−</button>
            </div>

            {/* ── Scientific Buttons (toggled) ── */}
            {isScientific && (
                <div className="calc-sci-section">
                    {scientificButtons.map((row, ri) => (
                        <div key={ri} className="calc-row">
                            {row.map((btn, bi) => (
                                <button
                                    key={bi}
                                    className={`calc-btn ${btn.className || ""}`}
                                    onClick={btn.action}
                                    title={btn.label}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Standard Buttons ── */}
            <div className="calc-buttons">
                {standardButtons.map((row, ri) => (
                    <div key={ri} className="calc-row">
                        {row.map((btn, bi) => (
                            <button
                                key={bi}
                                className={`calc-btn ${btn.className || ""}`}
                                onClick={btn.action}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* ── History (small, at bottom) ── */}
            {history.length > 0 && (
                <div className="calc-history">
                    <div className="calc-history-title">
                        <span>History</span>
                        <button onClick={() => setHistory([])} title="ล้างประวัติ">✕</button>
                    </div>
                    <div className="calc-history-list">
                        {history.slice().reverse().map((h, i) => (
                            <div key={i} className="calc-history-item" onClick={() => { setDisplay(h.result); setIsNewInput(true); }}>
                                <span className="calc-history-expr">{h.expr}</span>
                                <span className="calc-history-result">= {h.result}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
