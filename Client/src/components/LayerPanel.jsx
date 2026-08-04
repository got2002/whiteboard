import React, { useState, useRef, useCallback } from 'react';
import { useI18n } from "../i18n/i18n";

const LAYER_TYPES = ["text", "image", "shape", "stamp"];

// ── Shape mini-previews ──
function ShapePreview({ shapeType, color }) {
    const { t } = useI18n();

    const c = color || "#3b82f6";
    const svgProps = { width: "100%", height: "100%", viewBox: "0 0 40 40" };
    switch (shapeType) {
        case "circle": return <svg {...svgProps}><circle cx="20" cy="20" r="16" fill="none" stroke={c} strokeWidth="2" /></svg>;
        case "triangle": return <svg {...svgProps}><polygon points="20,4 36,36 4,36" fill="none" stroke={c} strokeWidth="2" /></svg>;
        case "star": return <svg {...svgProps}><polygon points="20,2 25,15 38,15 27,23 31,37 20,28 9,37 13,23 2,15 15,15" fill="none" stroke={c} strokeWidth="2" /></svg>;
        case "arrow": return <svg {...svgProps}><line x1="4" y1="36" x2="36" y2="4" stroke={c} strokeWidth="2" /><polyline points="20,4 36,4 36,20" fill="none" stroke={c} strokeWidth="2" /></svg>;
        case "line": return <svg {...svgProps}><line x1="4" y1="36" x2="36" y2="4" stroke={c} strokeWidth="2" /></svg>;
        default: return <svg {...svgProps}><rect x="4" y="4" width="32" height="32" rx="2" fill="none" stroke={c} strokeWidth="2" /></svg>;
    }
}

// ── Thumbnail for each layer type ──
function LayerThumbnail({ stroke }) {
    const { t } = useI18n();

    if (stroke.type === "image" && stroke.dataURL) {
        return (
            <div className="layer-thumb">
                <img src={stroke.dataURL} alt="" draggable={false} />
            </div>
        );
    }
    if (stroke.type === "stamp") {
        return (
            <div className="layer-thumb layer-thumb-stamp">
                <span>{stroke.stamp}</span>
            </div>
        );
    }
    if (stroke.type === "text") {
        return (
            <div className="layer-thumb layer-thumb-text" style={{ color: stroke.color || "#333" }}>
                <span>{stroke.text ? stroke.text.substring(0, 8) : "T"}</span>
            </div>
        );
    }
    if (stroke.type === "shape") {
        return (
            <div className="layer-thumb layer-thumb-shape">
                <ShapePreview shapeType={stroke.shapeType} color={stroke.color} />
            </div>
        );
    }
    return <div className="layer-thumb" />;
}

// ── Label for each layer type ──
function getLabel(stroke, t) {
    if (stroke.type === 'text') return stroke.text ? stroke.text.substring(0, 20) : t('panel.text');
    if (stroke.type === 'shape') return `${stroke.shapeType || t('panel.shape')}`;
    if (stroke.type === 'image') return t('panel.image');
    if (stroke.type === 'stamp') return stroke.stamp || t('panel.sticker');
    return 'Object';
}

export default function LayerPanel({ 
    strokes = [], 
    selectedStrokeIds = [], 
    onSelect, 
    onReorder, 
    onDelete, 
    onClose 
}) {
    const layers = strokes
        .map((s, index) => ({ ...s, originalIndex: index }))
        .filter(s => s.type && LAYER_TYPES.includes(s.type))
        .reverse();

    // ── Drag state ──
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const holdTimerRef = useRef(null);
    const dragItemRef = useRef(null);

    // กดค้าง 300ms ถึงจะเริ่ม drag
    const handlePointerDown = useCallback((e, layer) => {
        e.preventDefault();
        dragItemRef.current = layer;
        holdTimerRef.current = setTimeout(() => {
            setDragId(layer.id);
            setIsDragging(true);
        }, 300);
    }, []);

    const handlePointerUp = useCallback(() => {
        clearTimeout(holdTimerRef.current);
        
        if (isDragging && dragId && dragOverId && dragId !== dragOverId) {
            const fromLayer = layers.find(l => l.id === dragId);
            const toLayer = layers.find(l => l.id === dragOverId);
            if (fromLayer && toLayer) {
                onReorder(fromLayer.id, fromLayer.originalIndex, toLayer.originalIndex);
            }
        }
        
        setDragId(null);
        setDragOverId(null);
        setIsDragging(false);
        dragItemRef.current = null;
    }, [isDragging, dragId, dragOverId, layers, onReorder]);

    const handlePointerEnter = useCallback((layerId) => {
        if (isDragging) {
            setDragOverId(layerId);
        }
    }, [isDragging]);

    const handlePointerCancel = useCallback(() => {
        clearTimeout(holdTimerRef.current);
        setDragId(null);
        setDragOverId(null);
        setIsDragging(false);
    }, []);

    return (
        <div className="layer-panel" onPointerUp={handlePointerUp} onPointerLeave={handlePointerCancel}>
            <div className="layer-panel-header">
                <span className="layer-panel-title">{t("panel.layers")}</span>
                <button className="layer-close-btn" onClick={onClose}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div className="layer-panel-body">
                {layers.length === 0 ? (
                    <div className="layer-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                        <span>{t("panel.noObjects")}</span>
                    </div>
                ) : (
                    layers.map((layer, idx) => {
                        const isSelected = selectedStrokeIds.includes(layer.id);
                        const isBeingDragged = dragId === layer.id;
                        const isDragTarget = dragOverId === layer.id && dragId !== layer.id;
                        
                        return (
                            <div 
                                key={layer.id} 
                                className={`layer-item ${isSelected ? 'active' : ''} ${isBeingDragged ? 'dragging' : ''} ${isDragTarget ? 'drag-over' : ''}`}
                                onClick={() => { if (!isDragging) onSelect(layer.id); }}
                                onPointerDown={(e) => handlePointerDown(e, layer)}
                                onPointerEnter={() => handlePointerEnter(layer.id)}
                            >
                                <div className="layer-grip">
                                    <svg width="10" height="16" viewBox="0 0 10 16" fill="#94a3b8">
                                        <circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/>
                                        <circle cx="3" cy="6" r="1.2"/><circle cx="7" cy="6" r="1.2"/>
                                        <circle cx="3" cy="10" r="1.2"/><circle cx="7" cy="10" r="1.2"/>
                                        <circle cx="3" cy="14" r="1.2"/><circle cx="7" cy="14" r="1.2"/>
                                    </svg>
                                </div>
                                <LayerThumbnail stroke={layer} />
                                <div className="layer-label">{getLabel(layer, t)}</div>
                                <button 
                                    className="layer-delete-btn" 
                                    title={t("panel.delete")}
                                    onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
