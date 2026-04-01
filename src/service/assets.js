import API, { ENDPOINTS} from "../config/api";

// ✅ READ - Get all assets
export const getAssets = async () => {
  try {
    const res = await API.get("/api/assets");
    return res.data;
  } catch (err) {
    console.error("Get Assets Error:", err);
    throw err;
  }
};

// ✅ READ - Get single asset by ID
export const getAssetById = async (id) => {
  try {
    const response = await API.get(`${ENDPOINTS.ASSET_TABLE}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get Asset Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ CREATE - Add new asset
export const createAsset = async (assetData) => {
  try {
    const response = await API.post(ENDPOINTS.ASSET_TABLE, assetData);
    return response.data;
  } catch (error) {
    console.error("Create Asset Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ UPDATE - Update existing asset
export const updateAsset = async (id, assetData) => {
  try {
    const response = await API.put(`${ENDPOINTS.ASSET_TABLE}/${id}`, assetData);
    return response.data;
  } catch (error) {
    console.error("Update Asset Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ DELETE - Delete asset
export const deleteAsset = async (id) => {
  try {
    const response = await API.delete(`${ENDPOINTS.ASSET_TABLE}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete Asset Error:", error.response?.data || error.message);
    throw error;
  }
};