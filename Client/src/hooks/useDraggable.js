// ============================================================
// useDraggable.js — Custom hook for making elements draggable
// ============================================================
// Supports both mouse and touch drag.
// Returns a ref for the drag handle and style to apply to the container.
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * @param {Object} options
 * @param {string} options.storageKey - localStorage key to persist position
 * @param {Object} options.defaultPosition - { x, y } default position (null = use CSS positioning)
 */
export function useDraggable({ storageKey, defaultPosition = null } = {}) {
    const [position, setPosition] = useState(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed.y === 'number' && parsed.y < 55) {
                        parsed.y = 55;
                    }
                    return parsed;
                }
            } catch {}
        }
        return defaultPosition; // null means "use CSS default"
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    const handleRef = useRef(null);

    const handlePointerDown = useCallback((e) => {
        // Only handle left mouse button or touch
        if (e.type === "mousedown" && e.button !== 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Get the parent container's current position and dimensions
        const container = handleRef.current?.closest("[data-draggable]");
        if (!container) return;

        const rect = container.getBoundingClientRect();

        dragStartRef.current = {
            mouseX: clientX,
            mouseY: clientY,
            elemX: rect.left,
            elemY: rect.top,
            elemW: rect.width,
            elemH: rect.height,
        };

        setIsDragging(true);
        e.preventDefault();
        e.stopPropagation();
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e) => {
            if (!dragStartRef.current) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - dragStartRef.current.mouseX;
            const deltaY = clientY - dragStartRef.current.mouseY;

            // Clamp position using actual element dimensions
            const elemW = dragStartRef.current.elemW;
            const elemH = dragStartRef.current.elemH;
            
            // Allow 10px padding from the right and bottom edges
            const maxX = Math.max(0, window.innerWidth - elemW - 10);
            const maxY = Math.max(0, window.innerHeight - elemH - 10);
            const minY = 55; // Prevent dragging behind top bar (height ~48px)
            const minX = 10; // Left padding

            const newX = Math.max(minX, Math.min(dragStartRef.current.elemX + deltaX, maxX));
            const newY = Math.max(minY, Math.min(dragStartRef.current.elemY + deltaY, maxY));

            setPosition({ x: newX, y: newY, ww: window.innerWidth, wh: window.innerHeight });
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;

            // Persist position
            if (storageKey) {
                setPosition((pos) => {
                    if (pos) {
                        try {
                            localStorage.setItem(storageKey, JSON.stringify(pos));
                        } catch {}
                    }
                    return pos;
                });
            }
        };

        document.addEventListener("mousemove", handlePointerMove);
        document.addEventListener("mouseup", handlePointerUp);
        document.addEventListener("touchmove", handlePointerMove, { passive: false });
        document.addEventListener("touchend", handlePointerUp);

        return () => {
            document.removeEventListener("mousemove", handlePointerMove);
            document.removeEventListener("mouseup", handlePointerUp);
            document.removeEventListener("touchmove", handlePointerMove);
            document.removeEventListener("touchend", handlePointerUp);
        };
    }, [isDragging, storageKey]);

    // Ensure element stays in bounds on mount, resize, and dimension changes
    useEffect(() => {
        // We delay slightly to ensure the DOM node is attached and sized
        const timer = setTimeout(() => {
            const container = handleRef.current?.closest("[data-draggable]");
            if (!container) return;

            const checkBounds = () => {
                const rect = container.getBoundingClientRect();
                const elemW = rect.width;
                const elemH = rect.height;

                if (elemW === 0 || elemH === 0) return;

                const maxX = Math.max(0, window.innerWidth - elemW - 10);
                const maxY = Math.max(0, window.innerHeight - elemH - 10);
                const minY = 55;
                const minX = 10;

                setPosition((prevPos) => {
                    if (!prevPos) return prevPos;

                    let newX = prevPos.x;
                    let newY = prevPos.y;

                    // Stick to the right edge if it was near it
                    if (prevPos.ww && prevPos.ww !== window.innerWidth) {
                        const dw = window.innerWidth - prevPos.ww;
                        if (prevPos.x >= prevPos.ww - elemW - 20) {
                            newX += dw;
                        }
                    }

                    newX = Math.max(minX, Math.min(newX, maxX));
                    newY = Math.max(minY, Math.min(newY, maxY));

                    if (newX !== prevPos.x || newY !== prevPos.y || prevPos.ww !== window.innerWidth || prevPos.wh !== window.innerHeight) {
                        const newState = { x: newX, y: newY, ww: window.innerWidth, wh: window.innerHeight };
                        if (storageKey) {
                            try { localStorage.setItem(storageKey, JSON.stringify(newState)); } catch {}
                        }
                        return newState;
                    }
                    return prevPos;
                });
            };

            checkBounds(); // Initial check

            const ro = new ResizeObserver(() => checkBounds());
            ro.observe(container);

            window.addEventListener("resize", checkBounds);

            // Store cleanup function on the ref so we can call it on unmount
            handleRef.current._cleanupBounds = () => {
                ro.disconnect();
                window.removeEventListener("resize", checkBounds);
            };
        }, 50);

        return () => {
            clearTimeout(timer);
            if (handleRef.current?._cleanupBounds) {
                handleRef.current._cleanupBounds();
            }
        };
    }, [storageKey]);

    // Reset position (double-click to reset)
    const resetPosition = useCallback(() => {
        setPosition(null);
        if (storageKey) {
            try { localStorage.removeItem(storageKey); } catch {}
        }
    }, [storageKey]);

    // Style to apply to the draggable container
    const dragStyle = position
        ? {
            position: "fixed",
            left: position.x + "px",
            top: position.y + "px",
            // Override CSS transforms that were used for centering
            transform: "none",
            right: "auto",
            bottom: "auto",
            transition: isDragging ? "none" : "box-shadow 0.2s ease",
        }
        : {};

    return {
        handleRef,
        dragStyle,
        isDragging,
        position,
        resetPosition,
        handlePointerDown,
    };
}
