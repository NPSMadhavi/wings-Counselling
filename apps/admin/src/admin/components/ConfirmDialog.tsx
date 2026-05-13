import { useEffect } from "react";
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";

/* Styles */

const OVERLAY =
  "fixed inset-0 z-[999] flex items-center justify-center p-4";

const OVERLAY_BG =
  "rgba(15,23,42,0.55)";

const CARD =
  "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden";

/* ───────────────────────────── */
/* Confirm Dialog */
/* ───────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  confirmColor = "#ef4444",
  loading = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!open) return;

    const h = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", h);

    return () =>
      window.removeEventListener("keydown", h);

  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={OVERLAY}
      style={{ background: OVERLAY_BG }}
      onClick={onCancel}
    >
      <div
        className={CARD}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}

        <div className="flex items-center justify-between px-5 pt-5 pb-0">

          <div className="flex items-center gap-3">

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(239,68,68,0.1)"
              }}
            >
              <Trash2
                size={18}
                style={{ color: "#ef4444" }}
              />
            </div>

            <h2 className="text-base font-extrabold text-gray-900">
              {title}
            </h2>

          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X size={16} />
          </button>

        </div>

        {/* Body */}

        <p className="px-5 pt-3 pb-5 text-sm text-gray-500">
          {message}
        </p>

        <div className="h-px bg-gray-100" />

        {/* Actions */}

        <div className="flex justify-end gap-2 px-5 py-4">

          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2"
            style={{
              background: confirmColor
            }}
          >

            {loading && (
              <svg
                className="animate-spin h-3.5 w-3.5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
              </svg>
            )}

            {confirmLabel}

          </button>

        </div>

      </div>
    </div>
  );
}

/* ───────────────────────────── */
/* Alert Dialog */
/* ───────────────────────────── */

export function AlertDialog({
  open,
  title,
  message,
  type = "error",
  onClose
}) {
  useEffect(() => {
    if (!open) return;

    const h = (e) => {
      if (
        e.key === "Escape" ||
        e.key === "Enter"
      ) onClose();
    };

    window.addEventListener("keydown", h);

    return () =>
      window.removeEventListener("keydown", h);

  }, [open, onClose]);

  if (!open) return null;

  const cfg = {
    error: {
      icon: AlertCircle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      label: title || "Error"
    },

    warning: {
      icon: AlertTriangle,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      label: title || "Warning"
    },

    success: {
      icon: CheckCircle,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      label: title || "Success"
    },

    info: {
      icon: AlertCircle,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      label: title || "Info"
    }

  }[type];

  const Icon = cfg.icon;

  return (
    <div
      className={OVERLAY}
      style={{ background: OVERLAY_BG }}
      onClick={onClose}
    >
      <div
        className={CARD}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between px-5 pt-5">

          <div className="flex items-center gap-3">

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: cfg.bg
              }}
            >
              <Icon
                size={18}
                style={{
                  color: cfg.color
                }}
              />
            </div>

            <h2 className="text-base font-bold">
              {cfg.label}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X size={16} />
          </button>

        </div>

        <p className="px-5 pt-3 pb-5 text-sm text-gray-500">
          {message}
        </p>

        <div className="h-px bg-gray-100" />

        <div className="flex justify-end px-5 py-4">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{
              background: cfg.color
            }}
          >
            OK
          </button>

        </div>

      </div>
    </div>
  );
}