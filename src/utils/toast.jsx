import toast from "react-hot-toast";
import React from "react";
import { FaCheck, FaTimes, FaExclamation, FaInfo, FaSpinner, FaDownload, FaTrash } from "react-icons/fa";
import { FONT_FAMILIES } from "../theme/tokens";

// Inject keyframes for progress bar, spinner, elastic bounce, and icon pulse animation
if (typeof document !== "undefined") {
  const styleId = "toast-custom-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @keyframes toast-progress-anim {
        from { width: 100%; }
        to { width: 0%; }
      }
      @keyframes toast-spin-anim {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes toast-bounce-in-anim {
        0% { opacity: 0; transform: translateY(12px) scale(0.94); }
        70% { opacity: 0.9; transform: translateY(-2px) scale(1.02); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toast-fade-out-anim {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.92); }
      }
      @keyframes toast-icon-pulse-anim {
        0% { transform: scale(0.8); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      .toast-progress-bar {
        animation: toast-progress-anim 4s linear forwards;
      }
      .toast-spinner-icon {
        animation: toast-spin-anim 1s linear infinite;
      }
      .toast-icon-pulse {
        animation: toast-icon-pulse-anim 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
      }
    `;
    document.head.appendChild(style);
  }
}

// Configs featuring Light Glass Gradient theme with Glass Ring Icons
const configs = {
  success: {
    defaultTitle: "Changes saved",
    defaultMsg: "Your profile has been updated successfully.",
    borderColor: "rgba(76, 175, 80, 0.3)",
    iconColor: "#4caf50",
    titleColor: "#1b5e20",
    msgColor: "#2e7d32",
    progressColor: "#4caf50",
    rgb: "76, 175, 80",
    gradient: "linear-gradient(135deg, rgba(232, 245, 233, 0.95) 0%, rgba(200, 230, 201, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(76, 175, 80, 0.08), 0 2px 4px rgba(76, 175, 80, 0.02)",
    icon: <FaCheck size={7} className="toast-icon-pulse" />,
  },
  error: {
    defaultTitle: "Upload failed",
    defaultMsg: "File size exceeds 10MB. Please try a smaller file.",
    borderColor: "rgba(244, 67, 54, 0.3)",
    iconColor: "#f44336",
    titleColor: "#b71c1c",
    msgColor: "#c62828",
    progressColor: "#f44336",
    rgb: "244, 67, 54",
    gradient: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 205, 210, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(244, 67, 54, 0.08), 0 2px 4px rgba(244, 67, 54, 0.02)",
    icon: <FaTimes size={7} className="toast-icon-pulse" />,
  },
  warning: {
    defaultTitle: "Storage almost full",
    defaultMsg: "You have used 92% of your 5GB storage limit.",
    borderColor: "rgba(255, 152, 0, 0.3)",
    iconColor: "#ff9800",
    titleColor: "#e65100",
    msgColor: "#ef6c00",
    progressColor: "#ff9800",
    rgb: "255, 152, 0",
    gradient: "linear-gradient(135deg, rgba(255, 243, 224, 0.95) 0%, rgba(255, 224, 178, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(255, 152, 0, 0.08), 0 2px 4px rgba(255, 152, 0, 0.02)",
    icon: <FaExclamation size={7} className="toast-icon-pulse" />,
  },
  info: {
    defaultTitle: "New feature available",
    defaultMsg: "Try the redesigned settings panel in your account.",
    borderColor: "rgba(33, 150, 243, 0.3)",
    iconColor: "#2196f3",
    titleColor: "#01579b",
    msgColor: "#0277bd",
    progressColor: "#2196f3",
    rgb: "33, 150, 243",
    gradient: "linear-gradient(135deg, rgba(225, 245, 254, 0.95) 0%, rgba(187, 222, 251, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(33, 150, 243, 0.08), 0 2px 4px rgba(33, 150, 243, 0.02)",
    icon: <FaInfo size={7} className="toast-icon-pulse" />,
  },
  loading: {
    defaultTitle: "Processing request…",
    defaultMsg: "Please wait while we sync with the database.",
    borderColor: "rgba(156, 39, 176, 0.3)",
    iconColor: "#9c27b0",
    titleColor: "#4a148c",
    msgColor: "#6a1b9a",
    progressColor: "#9c27b0",
    rgb: "156, 39, 176",
    gradient: "linear-gradient(135deg, rgba(243, 229, 245, 0.95) 0%, rgba(225, 190, 231, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(156, 39, 176, 0.08), 0 2px 4px rgba(156, 39, 176, 0.02)",
    icon: <FaSpinner size={7} className="toast-spinner-icon" />,
  },
  message: {
    defaultTitle: "System Message",
    defaultMsg: "You have received a new background notification.",
    borderColor: "rgba(233, 30, 99, 0.3)",
    iconColor: "#e91e63",
    titleColor: "#880e4f",
    msgColor: "#ad1457",
    progressColor: "#e91e63",
    rgb: "233, 30, 99",
    gradient: "linear-gradient(135deg, rgba(252, 228, 236, 0.95) 0%, rgba(248, 187, 208, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(233, 30, 99, 0.08), 0 2px 4px rgba(233, 30, 99, 0.02)",
  },
  update: {
    defaultTitle: "Update ready",
    defaultMsg: "Version 4.2.1 is ready to install. Restart to apply.",
    borderColor: "rgba(96, 125, 139, 0.3)",
    iconColor: "#607d8b",
    titleColor: "#263238",
    msgColor: "#37474f",
    progressColor: "#607d8b",
    rgb: "96, 125, 139",
    gradient: "linear-gradient(135deg, rgba(236, 239, 241, 0.95) 0%, rgba(207, 216, 220, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(96, 125, 139, 0.08), 0 2px 4px rgba(96, 125, 139, 0.02)",
    icon: <FaDownload size={7} className="toast-icon-pulse" />,
  },
  deleted: {
    defaultTitle: "Conversation deleted",
    defaultMsg: "This action will be permanent in 5 seconds.",
    borderColor: "rgba(0, 150, 136, 0.3)",
    iconColor: "#009688",
    titleColor: "#004d40",
    msgColor: "#00695c",
    progressColor: "#009688",
    rgb: "0, 150, 136",
    gradient: "linear-gradient(135deg, rgba(224, 242, 241, 0.95) 0%, rgba(178, 223, 219, 0.9) 100%)",
    boxShadow: "0 8px 30px rgba(0, 150, 136, 0.08), 0 2px 4px rgba(0, 150, 136, 0.02)",
    icon: <FaTrash size={7} className="toast-icon-pulse" />,
  },
};

// Render helper for custom toast element
const createToast = (t, type, title, msg, duration = 4000, actionText = null, onActionClick = null, avatarText = null) => {
  const c = configs[type];
  const isProgressing = type !== "loading"; // Process animation unless loading/promise

  // Determine title and subtitle with fallback values
  let finalTitle = title;
  let finalMsg = msg;

  if (!title) {
    finalTitle = c.defaultTitle;
    finalMsg = c.defaultMsg;
  } else if (!msg && title === c.defaultTitle) {
    finalMsg = c.defaultMsg;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 24px 8px 12px", // Generous padding, leaving space on the right for close button
        minWidth: "260px",
        maxWidth: "340px",
        boxSizing: "border-box",
        borderRadius: "10px", // Professional rounded card
        border: `1.2px solid ${c.borderColor}`,
        fontSize: "11px",
        background: c.gradient,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
        boxShadow: c.boxShadow,
        fontFamily: FONT_FAMILIES.content,
        animation: t.visible
          ? "toast-bounce-in-anim 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both"
          : "toast-fade-out-anim 0.2s ease-in both",
      }}
    >
      {/* Light Gradient-Filled Glass Ring Icon Container */}
      {avatarText ? (
        <div
          className="toast-icon-pulse"
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1.2px solid ${c.iconColor}`,
            background: `linear-gradient(135deg, rgba(${c.rgb}, 0.2), rgba(${c.rgb}, 0.05))`,
            color: c.iconColor,
            fontWeight: 700,
            fontSize: "9px",
          }}
        >
          {avatarText}
        </div>
      ) : (
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1.2px solid ${c.iconColor}`,
            background: `linear-gradient(135deg, rgba(${c.rgb}, 0.2), rgba(${c.rgb}, 0.05))`,
            color: c.iconColor,
          }}
        >
          {c.icon}
        </div>
      )}

      {/* Body text styled for multi-line layout to prevent text clipping */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px", paddingRight: "6px" }}>
        <span style={{ fontWeight: 600, fontSize: "11px", color: c.titleColor, lineHeight: "1.2", wordBreak: "break-word" }}>
          {finalTitle}
        </span>
        {finalMsg && (
          <span
            style={{
              fontSize: "10px",
              color: c.msgColor,
              opacity: 0.9,
              lineHeight: "1.2",
              wordBreak: "break-word"
            }}
          >
            {finalMsg}
          </span>
        )}
      </div>

      {/* Inline Action Button Link */}
      {actionText && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (onActionClick) onActionClick();
            toast.dismiss(t.id);
          }}
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            color: c.iconColor,
            whiteSpace: "nowrap",
            marginLeft: "2px",
          }}
        >
          {actionText}
        </span>
      )}

      {/* Close button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "1px",
          opacity: 0.4,
          fontSize: "11px",
          fontWeight: 700,
          color: c.titleColor,
          display: "flex",
          alignItems: "center",
          position: "absolute",
          top: "50%",
          right: "6px",
          transform: "translateY(-50%)",
          transition: "opacity 0.15s",
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
        onMouseOut={(e) => e.currentTarget.style.opacity = 0.4}
      >
        ×
      </button>

      {/* Progress Bar indicator at the bottom */}
      {isProgressing && (
        <div
          className="toast-progress-bar"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "1.5px",
            background: c.progressColor,
            borderRadius: "0 0 10px 10px",
            animationDuration: `${duration}ms`,
          }}
        />
      )}
    </div>
  );
};

export const showToast = {
  success: (title, msg, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2000 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "success", title, finalMsg, opt.duration, opt.actionText, opt.onActionClick), opt);
  },

  error: (title, msg, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "error", title, finalMsg, opt.duration, opt.actionText, opt.onActionClick), opt);
  },

  warning: (title, msg, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "warning", title, finalMsg, opt.duration, opt.actionText, opt.onActionClick), opt);
  },

  info: (title, msg, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "info", title, finalMsg, opt.duration, opt.actionText, opt.onActionClick), opt);
  },

  loading: (title, msg, options = {}) => {
    let finalMsg = msg;
    let opt = { id: "loading-toast-id" };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "loading", title, finalMsg), opt);
  },

  message: (avatar, title, msg, actionText, onActionClick, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "message", title, finalMsg, opt.duration, actionText, onActionClick, avatar), opt);
  },

  update: (title, msg, actionText, onActionClick, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "update", title, finalMsg, opt.duration, actionText, onActionClick), opt);
  },

  deleted: (title, msg, actionText, onActionClick, options = {}) => {
    let finalMsg = msg;
    let opt = { duration: 2500 };
    if (typeof msg === "object" && msg !== null && !React.isValidElement(msg) && !(msg instanceof Error)) {
      opt = { ...opt, ...msg };
      finalMsg = "";
    }
    opt = { ...opt, ...options };
    return toast.custom((t) => createToast(t, "deleted", title, finalMsg, opt.duration, actionText, onActionClick), opt);
  },

  dismiss: (id) => {
    toast.dismiss(id || "loading-toast-id");
  },
};

export default showToast;
