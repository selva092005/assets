import API from "../config/api";

// GET /api/allocations — supports page, size, search, status, fromDate, toDate
export const getAllAllocations = async (params = {}) => {
  const res = await API.get("/api/allocations", { params });
  return res.data;
};

// GET /api/allocations/overview — returns total, active, returned, overdue, awaitingReturn
export const getAllocationOverview = async () => {
  const res = await API.get("/api/allocations/overview");
  return res.data;
};

// GET /api/allocations/{id}
export const getAllocationById = async (id) => {
  const res = await API.get(`/api/allocations/${id}`);
  return res.data;
};

// POST /api/allocations
export const allocateAsset = async (data) => {
  const res = await API.post("/api/allocations", data);
  return res.data;
};

// PUT /api/allocations/{id}/return
export const returnAsset = async (allocationId, returnDate) => {
  const params = returnDate ? { returnDate } : {};
  const res = await API.put(`/api/allocations/${allocationId}/return`, null, { params });
  return res.data;
};

// GET /api/allocations/asset/{assetId}
export const getAllocationsByAsset = async (assetId) => {
  const res = await API.get(`/api/allocations/asset/${assetId}`);
  return res.data;
};