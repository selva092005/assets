import API from "../config/api";

// Move asset to a new location (saves history row + updates asset)
export const moveAsset = async (data) => {
  const res = await API.post("/api/asset-history/move", data);
  return res.data;
};

// Get full location history for one asset (newest first)
export const getAssetHistory = async (assetId) => {
  const res = await API.get(`/api/asset-history/${assetId}`);
  return res.data;
};
