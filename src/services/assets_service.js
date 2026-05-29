import API from "../config/api";

// Unwrap ApiResponse { status, message, data } or plain response
const unwrap = (res) => res.data?.data ?? res.data;

// Trigger file download from blob
const download = (blob, fileName) => {
  const url  = window.URL.createObjectURL(new Blob([blob]));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getAssets = async (params = {}) => {
  const { keyword, type, location, status, page, size } = params;
  const res = await API.get("/api/assets/search", {
    params: {
      keyword:  keyword || undefined,
      type:     type || undefined,
      location: location || undefined,
      status:   status || undefined,
      page,
      size,
      expiringWarrantyInDays: params.expiringWarrantyInDays || undefined,
    },
  });
  return res.data;
};

export const getDashboard = async () => {
  const res = await API.get("/api/assets/dashboard");
  return unwrap(res);
};

export const getAssetById = async (id) => {
  const res = await API.get(`/api/assets/${id}`);
  return res.data;
};

export const addAsset = async (data) => {
  const res = await API.post("/api/assets", data);
  return res.data;
};

export const updateAsset = async (id, data) => {
  const res = await API.put(`/api/assets/${id}`, data);
  return res.data;
};

export const deleteAsset = async (id) => {
  const res = await API.delete(`/api/assets/${id}`);
  return res.data;
};

export const getAssetTypes = async () => {
  const res = await API.get("/api/types");
  const raw = res.data;
  return Array.isArray(raw)       ? raw
       : Array.isArray(raw?.data) ? raw.data
       : raw?.data?.content       ? raw.data.content
       : raw?.content             ? raw.content
       : [];
};

export const uploadAssetImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/api/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data || res.data;
};

export const getImageUrl = (imagePath) =>
  imagePath ? `${import.meta.env.VITE_BASE_URL}/api/files/${imagePath}` : null;

// POST /api/assets/bulk-excel — returns BulkUploadResultDTO inside ApiResponse
export const bulkUploadExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/api/assets/bulk-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// GET /api/assets/export → blob download
export const exportAssets = async () => {
  const res = await API.get("/api/assets/export", { responseType: "blob" });
  download(res.data, "assets_export.xlsx");
};

// GET /api/assets/template → blob download
export const downloadTemplate = async () => {
  const res = await API.get("/api/assets/template", { responseType: "blob" });
  download(res.data, "asset_upload_template.xlsx");
};

// POST /api/types → create new asset type
export const createAssetType = async (typeName) => {
  const res = await API.post("/api/types", { typeName });
  return res.data;
};

// GET /api/assets/upload-history → returns list of upload histories
export const getBulkUploadHistory = async () => {
  const res = await API.get("/api/assets/upload-history");
  return res.data?.data ?? res.data;
};
