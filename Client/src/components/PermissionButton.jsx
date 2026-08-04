// ============================================================
// PermissionButton.jsx — ปุ่ม{t("deepCleanup.permissionReqWrite")}สำหรับนักเรียน (viewer)
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
  const { t } = useI18n();
    return (
        <div className="permission-btn-container">
            {requestStatus === "idle" && (
                <button className="permission-btn" onClick={onRequestWrite}>
                    <span className="permission-btn-icon">✋</span>
                    <span className="permission-btn-text">{t("deepCleanup.permissionReqWrite")}</span>
                </button>
            )}

            {requestStatus === "pending" && (
                <div className="permission-btn permission-btn-pending">
                    <span className="permission-btn-spinner" />
                    <span className="permission-btn-text">{t("deepCleanup.permissionWaiting")}</span>
                </div>
            )}

            {requestStatus === "denied" && (
                <div className="permission-btn-denied-container">
                    <div className="permission-btn permission-btn-denied-msg">
                        <span>{t("deepCleanup.permissionDenied")}</span>
                    </div>
                    <button className="permission-btn permission-btn-retry" onClick={onRequestWrite}>
                        {t("deepCleanup.permissionRetry")}
                    </button>
                </div>
            )}
        </div>
    );
}

export default PermissionButton;
