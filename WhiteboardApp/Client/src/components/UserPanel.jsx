// ============================================================
// UserPanel.jsx — แผงรายชื่อผู้ใช้ออนไลน์
// ============================================================
//
// แสดงรายชื่อผู้ใช้ที่เชื่อมต่ออยู่ พร้อม:
//  - จุดสีประจำตัว
//  - ชื่อผู้ใช้
//  - หมายเลขหน้าที่กำลังดู
//  - ปุ่ม "ตามดู" (Follow Mode)
//
// Props:
//  - show           → แสดง/ซ่อนแผง (boolean)
//  - onToggle       → callback ปิดแผง
//  - remoteUsers    → Map ของผู้ใช้ { id: { name, color, pageIndex } }
//  - myName         → ชื่อตัวเอง
//  - myColor        → สีตัวเอง
//  - myPageIndex    → หน้าที่ตัวเองดูอยู่
//  - followUserId   → id ของผู้ใช้ที่กำลัง follow อยู่ (null = ไม่ follow ใคร)
//  - onFollow(id)   → callback เปิด/ปิด follow mode
//
// ============================================================

function UserPanel({
    show, onToggle,
    remoteUsers, myName, myColor, myPageIndex,
    followUserId, onFollow,
}) {

    // ──────────────────────────────────────────────────────────
    // แปลง remoteUsers object → array สำหรับ render
    // ──────────────────────────────────────────────────────────
    const userList = Object.entries(remoteUsers || {}).map(([id, data]) => ({
        id,
        ...data,
    }));

    // ──────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────
    return (
        <div className={`user-panel ${show ? "open" : ""}`}>

            {/* ─── Header ─── */}
            <div className="user-panel-header">
                <h3>👥 ผู้ใช้ออนไลน์ ({userList.length + 1})</h3>
                <button className="user-panel-close" onClick={onToggle}>✕</button>
            </div>

            {/* ─── รายชื่อ ─── */}
            <div className="user-panel-list">

                {/* ตัวเอง (แสดงบนสุดเสมอ) */}
                <div className="user-panel-item me">
                    <span className="user-dot-indicator" style={{ backgroundColor: myColor }} />
                    <span className="user-panel-name">{myName} (คุณ)</span>
                    <span className="user-panel-page">หน้า {myPageIndex + 1}</span>
                </div>

                {/* ผู้ใช้อื่น */}
                {userList.map((user) => (
                    <div
                        key={user.id}
                        className={`user-panel-item ${followUserId === user.id ? "following" : ""}`}
                    >
                        {/* จุดสี */}
                        <span className="user-dot-indicator" style={{ backgroundColor: user.color }} />

                        {/* ชื่อ */}
                        <span className="user-panel-name">{user.name}</span>

                        {/* หน้าที่ดูอยู่ */}
                        <span className="user-panel-page">หน้า {(user.pageIndex || 0) + 1}</span>

                        {/* ปุ่ม Follow */}
                        <button
                            className={`user-panel-follow ${followUserId === user.id ? "active" : ""}`}
                            onClick={() => onFollow(user.id)}
                            title={followUserId === user.id ? "เลิกตามดู" : "ตามดู"}
                        >
                            {followUserId === user.id ? "👁️ กำลังตาม" : "👁️ ตามดู"}
                        </button>
                    </div>
                ))}

                {/* ไม่มีคนอื่น */}
                {userList.length === 0 && (
                    <div className="user-panel-empty">
                        ยังไม่มีผู้ใช้อื่น — แชร์ QR Code เพื่อเชิญ!
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPanel;
