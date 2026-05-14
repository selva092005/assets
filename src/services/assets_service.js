import API from "../config/api";

export const getAssets = async (params = {}) => {
  const { name, type, page, size } = params;
  const res = await API.get("/api/assets/search", {
    params: {
      name: name || undefined,
      type: type || undefined,
      page,
      size
    }
  });
  return res.data;
};

export const addAsset = async (data) => {
  const res = await API.post("/api/assets", data);
  return res.data;
};

export const getAssetById = async (id) => {
  const res = await API.get(`/api/assets/${id}`);
  return res.data;
};

export const updateAsset = async (id, data) => {
  const res = await API.put(`/api/assets/${id}`, data);
  return res.data;
};

export const deleteAsset = async (id, adminName = "admin") => {
  const res = await API.delete(`/api/assets/${id}`, { params: { adminName } });
  return res.data;
};

export const getAssetTypes = async () => {
  const res = await API.get("/api/types");
  const raw = res.data;
  const list = Array.isArray(raw)       ? raw
             : Array.isArray(raw?.data) ? raw.data
             : raw?.data?.content       ? raw.data.content
             : raw?.content             ? raw.content
             : [];
  return list;
};

/**
 * Upload an image file for an asset.
 * Returns the saved file name (e.g. "abc123.jpg")
 * which should be saved as asset.imagePath in the DB.
 */
export const uploadAssetImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/api/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // Returns: { status, message, data: "abc123.jpg" }
  return res.data?.data || res.data;
};

/**
 * Build the full image URL from the file name.
 * Usage: <img src={getImageUrl(asset.imagePath)} />
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `http://localhost:8080/api/files/${imagePath}`;
};