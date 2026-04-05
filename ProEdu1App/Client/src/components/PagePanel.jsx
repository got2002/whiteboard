// ============================================================
// PagePanel.jsx — แผงจัดการหน้ากระดาน (สไลด์จากซ้าย)
// ============================================================
//
// แสดงเมื่อกดปุ่ม 📄 ใน Toolbar:
//  - รายการ thumbnail ของทุกหน้า (แสดงพื้นหลัง + เลขหน้า)
//  - คลิก thumbnail → สลับไปหน้านั้น
//  - ปุ่ม × → ลบหน้า (แสดงเมื่อมีมากกว่า 1 หน้า)
//  - ปุ่ม "+ Add Page" → เพิ่มหน้าใหม่
//  - Backdrop overlay → คลิกด้านนอกเพื่อปิด
//
// Props:
//  pages            → รายการหน้าทั้งหมด
//  currentPageIndex → index หน้าที่กำลังแสดง
//  show             → แสดง panel หรือไม่
//  onToggle         → callback ปิด panel
//  onSelectPage     → callback เมื่อเลือกหน้า (ส่ง index)
//  onAddPage        → callback เพิ่มหน้าใหม่
//  onDeletePage     → callback ลบหน้า (ส่ง pageId)
//
// ============================================================

import { useState } from "react";

function PagePanel({
    pages,
    currentPageIndex,
    show,
    onToggle,
    onSelectPage,
    onAddPage,
    onDeletePage,
    onReorderPages,
}) {
    // State ควบคุม Drag and Drop
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // อนุญาตให้ drop
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorderPages(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // ไม่แสดงอะไรถ้า show = false
    if (!show) return null;

    return (
        <>
            {/* ─── Backdrop: พื้นหลังมืดด้านหลัง panel ─── */}
            {/* คลิกเพื่อปิด panel */}
            <div className="page-panel-backdrop" onClick={onToggle} />

            {/* ─── Panel หลัก ─── */}
            <div className="page-panel">

                {/* ─── Header: ชื่อ + ปุ่มปิด ─── */}
                <div className="page-panel-header">
                    <h3>📄 หน้ากระดาน</h3>
                    <button className="tool-btn panel-close" onClick={onToggle}>✕</button>
                </div>

                {/* ─── รายการหน้า (thumbnail) ─── */}
                <div className="page-list">
                    {pages.map((page, index) => {
                        let dropClass = "";
                        if (dragOverIndex === index) {
                            dropClass = draggedIndex < index ? "drag-over-bottom" : "drag-over-top";
                        }
                        return (
                            <div
                                key={page.id}
                                className={`page-item ${index === currentPageIndex ? "active" : ""} ${dropClass} ${draggedIndex === index ? "dragging" : ""}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, index)}
                                onClick={() => onSelectPage(index)}
                                title="ลากเพื่อสลับตำแหน่ง หรือคลิกเพื่อเปิดหน้า"
                            >
                                {/* Thumbnail: แสดงพื้นหลัง + เลขหน้า + จำนวน stroke */}
                                <div
                                    className={`page-thumb ${page.background.startsWith("color-") ? "" : `bg-${page.background}`}`}
                                    style={page.background.startsWith("color-") ? { backgroundColor: page.background.replace("color-", "") } : {}}
                                >
                                    <span className="page-number">{index + 1}</span>
                                    {page.strokes.length > 0 && (
                                        <span className="stroke-count">{page.strokes.length} เส้น</span>
                                    )}
                                </div>

                                {/* ปุ่มลบหน้า (แสดงเมื่อ hover, ซ่อนเมื่อเหลือหน้าเดียว) */}
                                {pages.length > 1 && (
                                    <button
                                        className="page-delete"
                                        onClick={(e) => {
                                            e.stopPropagation(); // ไม่ให้ event ไปเลือกหน้า
                                            onDeletePage(page.id);
                                        }}
                                        title="ลบหน้านี้"
                                    >×</button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ─── ปุ่มเพิ่มหน้าใหม่ ─── */}
                <button className="add-page-btn" onClick={onAddPage}>
                    + เพิ่มหน้า
                </button>
            </div>
        </>
    );
}

export default PagePanel;
