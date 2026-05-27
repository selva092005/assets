import API from "../config/api";

// Dispose an asset
export const disposeAsset = async (data) => {
  const res = await API.post("/api/disposals", data);
  return res.data;
};

// Get all disposal records
export const getAllDisposals = async (params) => {
  const res = await API.get("/api/disposals", { params });
  return res.data;
};

// Get single disposal record
export const getDisposalById = async (id) => {
  const res = await API.get(`/api/disposals/${id}`);
  return res.data;
};
