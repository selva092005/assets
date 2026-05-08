import API from "../config/api";

export const getAssets = async (params = {}) => {
  const res = await API.get("/api/assets/search", { params });
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
  const res = await API.put(`/api/assets/${id}`, { ...data, id });
  return res.data;
};

export const deleteAsset = async (id) => {
  const res = await API.delete(`/api/assets/${id}`);
  return res.data;
};

// ✅ FIXED — normalizes all possible Spring Boot response shapes
export const getAssetTypes = async () => {
  const res = await API.get("/api/types");   // ✅ FIXED: was /api/asset-types, backend maps to /api/types
  // Spring Boot returns: { status, message, data: [ {typeId, typeName}, ... ] }
  const raw = res.data;
  const list = Array.isArray(raw)       ? raw        // bare array
             : Array.isArray(raw?.data) ? raw.data   // Apiresponse wrapper  ✅
             : raw?.data?.content       ? raw.data.content
             : raw?.content             ? raw.content
             : [];
  return list;
};