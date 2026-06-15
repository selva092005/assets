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

// POST /api/transfers/bulk — request bulk transfer (Manager + Admin)
export const requestBulkTransfer = async (data) => {
  const res = await API.post("/api/transfers/bulk", data);
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

// PUT /api/transfers/{id}/cancel — original requester or admin cancels
export const cancelTransfer = async (id, data) => {
  const res = await API.put(`/api/transfers/${id}/cancel`, data);
  return res.data;
};

// PUT /api/transfers/{id}/receive — confirm receipt (Admin + Manager)
export const receiveTransfer = async (id, data) => {
  const res = await API.put(`/api/transfers/${id}/receive`, data);
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

// PUT /api/transfers/bulk/approve
export const approveBulkTransfers = async (data) => {
  const res = await API.put("/api/transfers/bulk/approve", data);
  return res.data;
};

// PUT /api/transfers/bulk/reject
export const rejectBulkTransfers = async (data) => {
  const res = await API.put("/api/transfers/bulk/reject", data);
  return res.data;
};

// PUT /api/transfers/bulk/receive
export const receiveBulkTransfers = async (data) => {
  const res = await API.put("/api/transfers/bulk/receive", data);
  return res.data;
};

const downloadFile = (blob, fileName) => {
  const url  = window.URL.createObjectURL(new Blob([blob]));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// GET /api/transfers/export — download Excel file
export const exportTransfersToExcel = async () => {
  const res = await API.get("/api/transfers/export", {
    responseType: "blob",
  });
  downloadFile(res.data, "asset_transfers_log.xlsx");
};
