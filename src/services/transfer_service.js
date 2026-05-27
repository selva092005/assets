import API from "../config/api";

// GET /api/locations — used by transfer form to populate destination picker
export const getAllLocations = async () => {
  const res = await API.get("/api/locations");
  return res.data;
};

// POST /api/transfers — request a transfer (Manager + Admin)
export const requestTransfer = async (data) => {
  const res = await API.post("/api/transfers", data);
  return res.data;
};

// PUT /api/transfers/{id}/approve — admin approves
export const approveTransfer = async (id, data) => {
  const res = await API.put(`/api/transfers/${id}/approve`, data);
  return res.data;
};

// PUT /api/transfers/{id}/reject — admin rejects
export const rejectTransfer = async (id, data) => {
  const res = await API.put(`/api/transfers/${id}/reject`, data);
  return res.data;
};

// GET /api/transfers — paginated, optional ?status=PENDING|APPROVED|REJECTED
export const getAllTransfers = async (params = {}) => {
  const res = await API.get("/api/transfers", { params });
  return res.data;
};

// GET /api/transfers/{id}
export const getTransferById = async (id) => {
  const res = await API.get(`/api/transfers/${id}`);
  return res.data;
};

// GET /api/transfers/overview — {total, pending, approved, rejected}
export const getTransferOverview = async () => {
  const res = await API.get("/api/transfers/overview");
  return res.data;
};

// GET /api/transfers/asset/{assetId}
export const getTransfersByAsset = async (assetId) => {
  const res = await API.get(`/api/transfers/asset/${assetId}`);
  return res.data;
};
