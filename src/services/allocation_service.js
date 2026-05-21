import API from "../config/api";

export const getAllAllocations = async () => {
  const res = await API.get("/api/allocations");
  return res.data;
};

export const allocateAsset = async (data) => {
  const res = await API.post("/api/allocations", data);
  return res.data;
};

// PUT /api/allocations/{id}/return — return asset
export const returnAsset = async (allocationId) => {
  const res = await API.put(`/api/allocations/${allocationId}/return`);
  return res.data;
};