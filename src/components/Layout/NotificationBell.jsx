import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Divider,
  Tooltip,
  Typography
} from "@mui/material";
import {
  NotificationsNone as NotificationsNoneIcon,
  NotificationsActive as NotificationsActiveIcon
} from "@mui/icons-material";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
} from "../../services/notification_service";
import { FONT_FAMILIES } from "../../theme/tokens";
import toast from "../../utils/toast.jsx";

let lastFetchTime = 0;
const FETCH_THROTTLE_MS = 10000; // 10s throttle

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First Note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Second Note (Chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0.0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

const renderNotificationItemContent = (messageText) => {
  if (!messageText) return { title: "Notification", details: "", color: "#475569", icon: "💬", path: "/home" };
  const requestMatch = messageText.match(/New transfer request for asset '(.*?)' from '(.*?)' to '(.*?)' \(Priority: (.*?)\) requested by (.*?)\.?$/);
  const approveMatch = messageText.match(/Your transfer request for asset '(.*?)' was APPROVED by (.*?)\. Remarks: (.*?)\.?$/);
  const rejectMatch = messageText.match(/Your transfer request for asset '(.*?)' was REJECTED by (.*?)\. Remarks: (.*?)\.?$/);
  const newTicketMatch = messageText.match(/New Ticket: '(.*?)' request filed by (.*?) \(Priority: (.*?)\)/);
  const ticketUpdateMatch = messageText.match(/Your ticket request #(\d+) \((.*?)\) status has been updated to (.*?)\.?$/);

  if (requestMatch) {
    const [_, assetName, fromLoc, toLoc, priority, requestedBy] = requestMatch;
    return {
      title: "Transfer Request Received",
      details: (
        <span>
          <strong>{assetName}</strong>: {fromLoc} ➔ {toLoc}
          <br />
          <span style={{ fontSize: "9px", color: "#64748b" }}>
            Priority: {priority} • By {requestedBy}
          </span>
        </span>
      ),
      color: "#2563eb",
      icon: "🔹",
      path: "/home/transfer"
    };
  } else if (approveMatch) {
    const [_, assetName, resolvedBy, remarks] = approveMatch;
    return {
      title: "Transfer Approved",
      details: (
        <span>
          <strong>{assetName}</strong> was approved by {resolvedBy}
          {remarks && remarks !== "None" && (
            <>
              <br />
              <span style={{ fontSize: "9px", color: "#64748b" }}>Remarks: {remarks}</span>
            </>
          )}
        </span>
      ),
      color: "#16a34a",
      icon: "🟢",
      path: "/home/transfer"
    };
  } else if (rejectMatch) {
    const [_, assetName, resolvedBy, remarks] = rejectMatch;
    return {
      title: "Transfer Rejected",
      details: (
        <span>
          <strong>{assetName}</strong> was rejected by {resolvedBy}
          {remarks && remarks !== "None" && (
            <>
              <br />
              <span style={{ fontSize: "9px", color: "#64748b" }}>Remarks: {remarks}</span>
            </>
          )}
        </span>
      ),
      color: "#dc2626",
      icon: "🔴",
      path: "/home/transfer"
    };
  } else if (newTicketMatch) {
    const [_, requestType, requestedBy, priority] = newTicketMatch;
    return {
      title: "New Service Request",
      details: (
        <span>
          <strong>{requestType.replace("_", " ")}</strong> filed by {requestedBy}
          <br />
          <span style={{ fontSize: "9px", color: "#64748b" }}>Priority: {priority}</span>
        </span>
      ),
      color: "#ec4899",
      icon: "🛠️",
      path: "/home/requests"
    };
  } else if (ticketUpdateMatch) {
    const [_, ticketId, requestType, status] = ticketUpdateMatch;
    let color = "#3b82f6";
    let icon = "🔔";
    if (["APPROVED", "RESOLVED"].includes(status)) {
      color = "#16a34a";
      icon = "✅";
    } else if (["REJECTED", "LOST"].includes(status)) {
      color = "#dc2626";
      icon = "❌";
    }
    return {
      title: "Ticket Status Updated",
      details: (
        <span>
          Ticket <strong>#{ticketId}</strong> ({requestType}) is now <strong>{status}</strong>
        </span>
      ),
      color,
      icon,
      path: "/home/requests"
    };
  }

  return {
    title: "System Notification",
    details: messageText,
    color: "#475569",
    icon: "💬",
    path: "/home"
  };
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, userName } = useSelector((s) => s.auth);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifTab, setNotifTab] = useState("all");

  const fetchNotifications = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchTime < FETCH_THROTTLE_MS) {
      return;
    }
    lastFetchTime = now;
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      if (notifsRes && (notifsRes.httpStatus === 200 || notifsRes.success)) {
        setNotifications(notifsRes.data || []);
      }
      if (countRes && (countRes.httpStatus === 200 || countRes.success)) {
        setUnreadCount(countRes.data || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchNotifications(true);

    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8080";
    const wsProto = baseUrl.startsWith("https") ? "wss" : "ws";
    const cleanHost = baseUrl.replace(/^https?:\/\//, "");

    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      ws = new WebSocket(`${wsProto}://${cleanHost}/ws-notifications?email=${encodeURIComponent(userEmail || userName)}`);

      ws.onopen = () => {
        console.log("WebSocket connected for notifications");
      };

      ws.onmessage = (event) => {
        playNotificationSound();
        const rawMessage = event.data;

        const requestMatch = rawMessage.match(/New transfer request for asset '(.*?)' from '(.*?)' to '(.*?)' \(Priority: (.*?)\) requested by (.*?)\.?$/);
        const approveMatch = rawMessage.match(/Your transfer request for asset '(.*?)' was APPROVED by (.*?)\. Remarks: (.*?)\.?$/);
        const rejectMatch = rawMessage.match(/Your transfer request for asset '(.*?)' was REJECTED by (.*?)\. Remarks: (.*?)\.?$/);
        const newTicketMatch = rawMessage.match(/New Ticket: '(.*?)' request filed by (.*?) \(Priority: (.*?)\)/);
        const ticketUpdateMatch = rawMessage.match(/Your ticket request #(\d+) \((.*?)\) status has been updated to (.*?)\.?$/);

        if (requestMatch) {
          const [_, assetName, fromLoc, toLoc, priority, requestedBy] = requestMatch;
          toast.info(
            "Transfer Request Received",
            <div>
              <strong>{assetName}</strong>: {fromLoc} ➔ {toLoc}
              <div style={{ fontSize: "9.5px", opacity: 0.8, marginTop: "3px" }}>
                Priority: {priority} • By {requestedBy}
              </div>
            </div>,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home/transfer")
            }
          );
        } else if (approveMatch) {
          const [_, assetName, resolvedBy, remarks] = approveMatch;
          toast.success(
            "Transfer Request Approved",
            <div>
              <strong>{assetName}</strong> was approved by {resolvedBy}
              <div style={{ fontSize: "9.5px", opacity: 0.8, marginTop: "3px" }}>
                Remarks: {remarks || "None"}
              </div>
            </div>,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home/transfer")
            }
          );
        } else if (rejectMatch) {
          const [_, assetName, resolvedBy, remarks] = rejectMatch;
          toast.error(
            "Transfer Request Rejected",
            <div>
              <strong>{assetName}</strong> was rejected by {resolvedBy}
              <div style={{ fontSize: "9.5px", opacity: 0.8, marginTop: "3px" }}>
                Remarks: {remarks || "None"}
              </div>
            </div>,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home/transfer")
            }
          );
        } else if (newTicketMatch) {
          const [_, requestType, requestedBy, priority] = newTicketMatch;
          toast.info(
            "New Service Request",
            <div>
              <strong>{requestType.replace("_", " ")}</strong> filed by {requestedBy}
              <div style={{ fontSize: "9.5px", opacity: 0.8, marginTop: "3px" }}>
                Priority: {priority}
              </div>
            </div>,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home/requests")
            }
          );
        } else if (ticketUpdateMatch) {
          const [_, ticketId, requestType, status] = ticketUpdateMatch;
          const isPositive = ["APPROVED", "RESOLVED"].includes(status);
          const isNegative = ["REJECTED", "LOST"].includes(status);
          const toastFn = isPositive ? toast.success : (isNegative ? toast.error : toast.info);
          toastFn(
            "Ticket Status Updated",
            <div>
              Ticket <strong>#{ticketId}</strong> ({requestType}) is now <strong>{status}</strong>
            </div>,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home/requests")
            }
          );
        } else {
          toast.info(
            "New Notification",
            rawMessage,
            {
              duration: 8000,
              actionText: "View",
              onActionClick: () => navigate("/home")
            }
          );
        }
        fetchNotifications(true);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 5s...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    const fallbackInterval = setInterval(() => fetchNotifications(false), 60000);

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(fallbackInterval);
    };
  }, [isLoggedIn, userName]);

  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
    fetchNotifications(true);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      fetchNotifications(true);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications(true);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success("Notifications Cleared", "All notifications have been cleared.");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast.error("Error", "Failed to clear notifications.");
    }
  };

  const notifOpen = Boolean(notifAnchorEl);
  const notifId = notifOpen ? "notif-popover" : undefined;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          aria-describedby={notifId}
          onClick={handleNotifClick}
          sx={{
            width: 32,
            height: 32,
            border: "1px solid",
            borderColor: notifOpen ? "rgba(37, 99, 235, 0.25)" : "rgba(226, 232, 240, 0.8)",
            bgcolor: notifOpen ? "rgba(37, 99, 235, 0.08)" : "rgba(248, 250, 252, 0.6)",
            color: notifOpen || unreadCount > 0 ? "#2563eb" : "#64748b",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            boxShadow: notifOpen
              ? "0 0 12px rgba(37, 99, 235, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
              : "0 1px 2px rgba(0, 0, 0, 0.02)",
            "&:hover": {
              bgcolor: "rgba(37, 99, 235, 0.08)",
              borderColor: "rgba(37, 99, 235, 0.3)",
              color: "#2563eb",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)",
            },
            "&:active": {
              transform: "translateY(0px)",
            }
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsActiveIcon
              sx={{
                fontSize: 18,
                animation: "ring 2.5s ease-in-out infinite",
                transformOrigin: "50% 0",
                "@keyframes ring": {
                  "0%": { transform: "rotate(0)" },
                  "4%": { transform: "rotate(15deg)" },
                  "8%": { transform: "rotate(-12deg)" },
                  "12%": { transform: "rotate(10deg)" },
                  "16%": { transform: "rotate(-8deg)" },
                  "20%": { transform: "rotate(6deg)" },
                  "24%": { transform: "rotate(-4deg)" },
                  "28%": { transform: "rotate(2deg)" },
                  "32%": { transform: "rotate(-1deg)" },
                  "36%": { transform: "rotate(0)" },
                  "100%": { transform: "rotate(0)" }
                }
              }}
            />
          ) : (
            <NotificationsNoneIcon sx={{ fontSize: 18 }} />
          )}

          {unreadCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 15,
                height: 15,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#ffffff",
                fontSize: "8.5px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "4px",
                boxShadow: "0 0 0 2px #ffffff, 0 2px 6px rgba(239, 68, 68, 0.4)",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.5), 0 0 0 2px #ffffff" },
                  "70%": { boxShadow: "0 0 0 6px rgba(239, 68, 68, 0), 0 0 0 2px #ffffff" },
                  "100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0), 0 0 0 2px #ffffff" }
                }
              }}
            >
              {unreadCount}
            </Box>
          )}
        </IconButton>
      </Tooltip>

      <Popover
        id={notifId}
        open={notifOpen}
        anchorEl={notifAnchorEl}
        onClose={handleNotifClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: 320,
              maxHeight: 400,
              borderRadius: "10px",
              boxShadow: "0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 16px -6px rgba(15,23,42,0.04)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(10px)",
            },
          },
        }}
      >
        {/* Popover Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a", fontFamily: FONT_FAMILIES.header }}>
            Notifications
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                size="small"
                sx={{
                  fontSize: 10,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#2563eb",
                  p: 0,
                  minWidth: 0,
                  "&:hover": { bg: "transparent", textDecoration: "underline" },
                }}
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={handleClearAll}
                size="small"
                sx={{
                  fontSize: 10,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#64748b",
                  p: 0,
                  minWidth: 0,
                  "&:hover": { bg: "transparent", textDecoration: "underline", color: "#dc2626" },
                }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>
        <Divider />

        {/* Tabs Section */}
        <Box sx={{ display: "flex", gap: 1, px: 2, pb: 1, pt: 1, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Button
            onClick={() => setNotifTab("all")}
            sx={{
              fontSize: 9.5,
              textTransform: "none",
              fontWeight: 700,
              px: 1.5,
              py: 0.5,
              minWidth: 0,
              borderRadius: "12px",
              bgcolor: notifTab === "all" ? "rgba(37, 99, 235, 0.08)" : "transparent",
              color: notifTab === "all" ? "#2563eb" : "#64748b",
              "&:hover": { bgcolor: "rgba(37, 99, 235, 0.04)" }
            }}
          >
            All ({notifications.length})
          </Button>
          <Button
            onClick={() => setNotifTab("unread")}
            sx={{
              fontSize: 9.5,
              textTransform: "none",
              fontWeight: 700,
              px: 1.5,
              py: 0.5,
              minWidth: 0,
              borderRadius: "12px",
              bgcolor: notifTab === "unread" ? "rgba(37, 99, 235, 0.08)" : "transparent",
              color: notifTab === "unread" ? "#2563eb" : "#64748b",
              "&:hover": { bgcolor: "rgba(37, 99, 235, 0.04)" }
            }}
          >
            Unread ({unreadCount})
          </Button>
        </Box>

        {/* Popover Content */}
        <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
          {(() => {
            const filteredNotifications = notifTab === "unread"
              ? notifications.filter(n => !n.read)
              : notifications;

            return filteredNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography sx={{ color: "#64748b", fontSize: 11 }}>
                  {notifTab === "unread" ? "No unread notifications" : "No notifications"}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredNotifications.map((notif) => {
                  const parsed = renderNotificationItemContent(notif.message);
                  return (
                    <Box key={notif.id}>
                      <ListItemButton
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          navigate(parsed.path || "/home/transfer");
                          handleNotifClose();
                        }}
                        sx={{
                          px: 2,
                          py: 1.25,
                          alignItems: "flex-start",
                          bgcolor: notif.read ? "transparent" : "rgba(37,99,235,0.02)",
                          borderLeft: notif.read ? "none" : `3px solid ${parsed.color}`,
                          transition: "all 150ms ease",
                          "&:hover": {
                            bgcolor: "rgba(37,99,235,0.04)",
                          },
                        }}
                      >
                         <ListItemText
                          primaryTypographyProps={{ component: "div" }}
                          secondaryTypographyProps={{ component: "div" }}
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                              <Typography sx={{ fontSize: 10 }}>{parsed.icon}</Typography>
                              <Typography
                                sx={{
                                  fontSize: 11.5,
                                  fontWeight: notif.read ? 600 : 700,
                                  color: parsed.color,
                                  lineHeight: 1.2,
                                }}
                              >
                                {parsed.title}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                component="div"
                                sx={{
                                  fontSize: 11,
                                  color: notif.read ? "#64748b" : "#1e293b",
                                  lineHeight: 1.4,
                                  mt: 0.5,
                                }}
                              >
                                {parsed.details}
                              </Typography>
                              <Typography sx={{ fontSize: 8.5, color: "#94a3b8", mt: 0.75 }}>
                                {new Date(notif.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                      <Divider />
                    </Box>
                  );
                })}
              </List>
            );
          })()}
        </Box>
      </Popover>
    </>
  );
};
