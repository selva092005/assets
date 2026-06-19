import API from "../config/api";

const unwrap = (res) => res.data?.data ?? res.data;

export const logMaintenance = async (data, actionBy) => {
  const res = await API.post("/api/maintenance", data, {
    params: { actionBy },
  });
  return unwrap(res);
};

export const getAllMaintenance = async (params = {}) => {
  const { search, outcome } = params;
  const res = await API.get("/api/maintenance", {
    params: {
      search: search || undefined,
      outcome: outcome || undefined,
    },
  });
  return unwrap(res);
};

export const getMaintenanceByAsset = async (assetId) => {
  const res = await API.get(`/api/maintenance/asset/${assetId}`);
  return unwrap(res);
};
