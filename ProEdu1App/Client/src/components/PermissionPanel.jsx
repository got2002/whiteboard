// ============================================================
// PermissionPanel.jsx — แผงจัดการสิทธิ์สำหรับครู (host)
// ============================================================
//
// แสดงเฉพาะเมื่อ role === "host"
// มี 2 ส่วน:
//  1. คำขอที่รออนุมัติ (pending requests)
//  2. นักเรียนที่ได้สิทธิ์แล้ว (contributors) — พร้อมปุ่มถอนสิทธิ์
//
// Props:
//  - show              → แสดง/ซ่อน panel
//  - onToggle          → callback ปิด panel
//  - pendingRequests   → [{ id, name, color }]
//  - contributors      → [{ id, name, color }]
//  - onApprove(id)     → callback อนุมัติ
//  - onDeny(id)        → callback ปฏิเสธ
//  - onRevoke(id)      → callback ถอนสิทธิ์
//
// ============================================================

function PermissionPanel({
    show, onToggle,
    pendingRequests, contributors,
    onApprove, onDeny, onRevoke,
}) {
    return (
        <div className={`permission-panel ${show ? "open" : ""}`}>
            {/* ─── Header ─── */}
            <div className="permission-panel-header">
                <h3>
                    🔐 จัดการสิทธิ์
                    {pendingRequests.length > 0 && (
                        <span className="permission-badge">{pendingRequests.length}</span>
                    )}
                </h3>
                <button className="permission-panel-close" onClick={onToggle}>✕</button>
            </div>

            {/* ─── คำขอที่รออนุมัติ ─── */}
            <div className="permission-section">
                <h4 className="permission-section-title">
                    ✋ คำขอรออนุมัติ ({pendingRequests.length})
                </h4>
                {pendingRequests.length === 0 ? (
                    <div className="permission-empty">ไม่มีคำขอ</div>
                ) : (
                    pendingRequests.map((req) => (
                        <div key={req.id} className="permission-request-item">
                            <span
                                className="permission-user-dot"
                                style={{ backgroundColor: req.color || "#888" }}
                            />
                            <span className="permission-user-name">{req.name}</span>
                            <div className="permission-actions">
                                <button
                                    className="permission-approve-btn"
                                    onClick={() => onApprove(req.id)}
                                    title="อนุมัติ"
                                >
                                    ✅
                                </button>
                                <button
                                    className="permission-deny-btn"
                                    onClick={() => onDeny(req.id)}
                                    title="ปฏิเสธ"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ─── นักเรียนที่ได้สิทธิ์แล้ว ─── */}
            <div className="permission-section">
                <h4 className="permission-section-title">
                    ✏️ ได้สิทธิ์เขียนแล้ว ({contributors.length})
                </h4>
                {contributors.length === 0 ? (
                    <div className="permission-empty">ยังไม่มี</div>
                ) : (
                    contributors.map((user) => (
                        <div key={user.id} className="permission-contributor-item">
                            <span
                                className="permission-user-dot"
                                style={{ backgroundColor: user.color || "#888" }}
                            />
                            <span className="permission-user-name">{user.name}</span>
                            <button
                                className="permission-revoke-btn"
                                onClick={() => onRevoke(user.id)}
                                title="ถอนสิทธิ์"
                            >
                                ↩️ ถอนสิทธิ์
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PermissionPanel;
