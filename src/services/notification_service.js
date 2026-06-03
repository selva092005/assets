import API from "../config/api";

// GET /api/notifications
export const getNotifications = async () => {
  const res = await API.get("/api/notifications");
  return res.data;
};

// GET /api/notifications/unread-count
export const getUnreadCount = async () => {
  const res = await API.get("/api/notifications/unread-count");
  return res.data;
};

// PUT /api/notifications/{id}/read
export const markAsRead = async (id) => {
  const res = await API.put(`/api/notifications/${id}/read`);
  return res.data;
};

// PUT /api/notifications/read-all
export const markAllAsRead = async () => {
  const res = await API.put("/api/notifications/read-all");
  return res.data;
};
