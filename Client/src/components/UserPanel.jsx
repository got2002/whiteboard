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
    remoteUsers, myName, myColor, myPageIndex, myRole,
    followUserId, onFollow,
}) {

    // ──────────────────────────────────────────────────────────
    // จัดกลุ่มผู้ใช้ (ตัวเอง + คนอื่น) แบ่งเป็น Host และ Client
    // ──────────────────────────────────────────────────────────
    const me = {
        id: "me",
        name: myName,
        color: myColor,
        pageIndex: myPageIndex,
        role: myRole,
        isMe: true
    };

    const others = Object.entries(remoteUsers || {}).map(([id, data]) => ({
        id,
        ...data,
        isMe: false
    }));

    const allUsers = [me, ...others];

    const hosts = allUsers.filter(u => u.role === "host");
    const clients = allUsers.filter(u => u.role !== "host");

    const renderUserItem = (user) => (
        <div
            key={user.id}
            className={`user-panel-item ${user.isMe ? "me" : ""} ${followUserId === user.id ? "following" : ""}`}
        >
            {/* จุดสี */}
            <span className="user-dot-indicator" style={{ backgroundColor: user.color }} />

            {/* ชื่อ */}
            <span className="user-panel-name">
                {user.name} {user.isMe && "(คุณ)"}
            </span>

            {/* หน้าที่ดูอยู่ */}
            <span className="user-panel-page">หน้า {(user.pageIndex || 0) + 1}</span>

            {/* ปุ่ม Follow (ซ่อนสำหรับตัวเอง) */}
            {!user.isMe && (
                <button
                    className={`user-panel-follow ${followUserId === user.id ? "active" : ""}`}
                    onClick={() => onFollow(user.id)}
                    title={followUserId === user.id ? "เลิกตามดู" : "ตามดู"}
                >
                    {followUserId === user.id ? "👁️ กำลังตาม" : "👁️ ตามดู"}
                </button>
            )}
        </div>
    );

    // ──────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────
    return (
        <div className={`user-panel ${show ? "open" : ""}`}>

            {/* ─── Header ─── */}
            <div className="user-panel-header">
                <h3>👥 ผู้ใช้ออนไลน์ ({allUsers.length})</h3>
                <button className="user-panel-close" onClick={onToggle}>✕</button>
            </div>

            {/* ─── รายชื่อ ─── */}
            <div className="user-panel-list">

                {/* ─── กลุ่ม Host ─── */}
                {hosts.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "#64748b", 
                            marginBottom: "8px",
                            paddingBottom: "4px",
                            borderBottom: "1px solid #e2e8f0"
                        }}>
                            ผู้ดูแลกระดาน
                        </div>
                        {hosts.map(renderUserItem)}
                    </div>
                )}

                {/* ─── กลุ่ม Client ─── */}
                {clients.length > 0 && (
                    <div>
                        <div style={{ 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            color: "#64748b", 
                            marginBottom: "8px",
                            paddingBottom: "4px",
                            borderBottom: "1px solid #e2e8f0"
                        }}>
                            ผู้เข้าร่วม
                        </div>
                        {clients.map(renderUserItem)}
                    </div>
                )}

                {/* ไม่มีคนอื่น (แต่มีเราเสมอ เลยเช็คที่ others) */}
                {others.length === 0 && (
                    <div className="user-panel-empty">
                        ยังไม่มีผู้ใช้อื่น — แชร์ QR Code เพื่อเชิญ!
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPanel;
