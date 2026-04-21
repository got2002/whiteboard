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
                if (saved) return JSON.parse(saved);
            } catch {}
        }
        return defaultPosition; // null means "use CSS default"
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    const handleRef = useRef(null);

    const clampPosition = useCallback((x, y) => {
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        return {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY)),
        };
    }, []);

    const handlePointerDown = useCallback((e) => {
        // Only handle left mouse button or touch
        if (e.type === "mousedown" && e.button !== 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Get the parent container's current position
        const container = handleRef.current?.closest("[data-draggable]");
        if (!container) return;

        const rect = container.getBoundingClientRect();

        dragStartRef.current = {
            mouseX: clientX,
            mouseY: clientY,
            elemX: rect.left,
            elemY: rect.top,
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

            const newPos = clampPosition(
                dragStartRef.current.elemX + deltaX,
                dragStartRef.current.elemY + deltaY
            );

            setPosition(newPos);
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
    }, [isDragging, clampPosition, storageKey]);

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
