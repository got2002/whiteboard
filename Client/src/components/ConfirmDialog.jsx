import { useI18n } from "../i18n/i18n";
// ============================================================
// ConfirmDialog.jsx — Custom Confirm Modal (แทน browser confirm)
// ============================================================

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        {/* Icon */}
        <div className="confirm-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        {/* Content */}
        <div className="confirm-title">{title || t("dialog.confirm")}</div>
        <div className="confirm-message">{message}</div>

        {/* Buttons */}
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            {t("dialog.cancel")}
          </button>
          <button className="confirm-btn confirm-btn-ok" onClick={onConfirm}>
            {t("dialog.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
