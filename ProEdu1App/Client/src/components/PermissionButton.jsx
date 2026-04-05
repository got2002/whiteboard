// ============================================================
// PermissionButton.jsx — ปุ่มขอสิทธิ์เขียนสำหรับนักเรียน (viewer)
// ============================================================
//
// แสดงเฉพาะเมื่อ role === "viewer"
// สถานะ: idle → pending → approved/denied
//
// Props:
//  - requestStatus → "idle" | "pending" | "denied"
//  - onRequestWrite() → callback ส่งคำขอ
//
// ============================================================

function PermissionButton({ requestStatus, onRequestWrite }) {
    return (
        <div className="permission-btn-container">
            {requestStatus === "idle" && (
                <button className="permission-btn" onClick={onRequestWrite}>
                    <span className="permission-btn-icon">✋</span>
                    <span className="permission-btn-text">ขอสิทธิ์เขียน</span>
                </button>
            )}

            {requestStatus === "pending" && (
                <div className="permission-btn permission-btn-pending">
                    <span className="permission-btn-spinner" />
                    <span className="permission-btn-text">กำลังรอครูอนุมัติ...</span>
                </div>
            )}

            {requestStatus === "denied" && (
                <div className="permission-btn-denied-container">
                    <div className="permission-btn permission-btn-denied-msg">
                        <span>❌ คำขอถูกปฏิเสธ</span>
                    </div>
                    <button className="permission-btn permission-btn-retry" onClick={onRequestWrite}>
                        🔄 ขอใหม่อีกครั้ง
                    </button>
                </div>
            )}
        </div>
    );
}

export default PermissionButton;
