import API from "../config/api";

const download = (blob, fileName) => {
  const url  = window.URL.createObjectURL(new Blob([blob]));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// GET /api/users/search/page?username=&role=&page=0&size=10
export const getUsers = async (params = {}) => {
  const { username, role, page, size } = params;
  const res = await API.get("/api/users/search/page", {
    params: { username: username || undefined, role: role || undefined, page, size },
  });
  return res.data;
};

export const getUserById = async (id) => {
  const res = await API.get(`/api/users/${id}`);
  return res.data;
};

export const addUser = async (data) => {
  const res = await API.post("/api/users", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await API.put(`/api/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/api/users/${id}`);
  return res.data;
};

// POST /api/users/bulk-excel — returns BulkUploadResultDTO inside ApiResponse
export const bulkUploadUsers = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post("/api/users/bulk-excel", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// GET /api/users/export → blob download
export const exportUsers = async () => {
  const res = await API.get("/api/users/export", { responseType: "blob" });
  download(res.data, "users_export.xlsx");
};

// GET /api/users/template → blob download
export const downloadUserTemplate = async () => {
  const res = await API.get("/api/users/template", { responseType: "blob" });
  download(res.data, "user_upload_template.xlsx");
};
