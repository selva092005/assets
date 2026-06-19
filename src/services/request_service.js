import API from "../config/api";

const unwrap = (res) => res.data?.data ?? res.data;

export const createRequest = async (data) => {
  const res = await API.post("/api/requests", data);
  return unwrap(res);
};

export const getRequests = async (params = {}) => {
  const { page, size, search, status, priority, requestType, username } = params;
  const res = await API.get("/api/requests", {
    params: {
      page: page ?? 0,
      size: size ?? 10,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      requestType: requestType || undefined,
      username: username || undefined,
    },
  });
  return res.data; // Return full response to get Page info
};

export const updateRequestStatus = async (requestId, params = {}) => {
  const { status, remarks, cost, adminUser } = params;
  const res = await API.put(`/api/requests/${requestId}/status`, null, {
    params: {
      status,
      remarks: remarks || undefined,
      cost: cost !== undefined ? cost : undefined,
      adminUser,
    },
  });
  return unwrap(res);
};

export const getRequestOverview = async (username) => {
  const res = await API.get("/api/requests/overview", {
    params: { username: username || undefined },
  });
  return unwrap(res);
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/api/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return unwrap(res);
};
