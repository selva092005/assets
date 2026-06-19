import API from "../config/api";

const unwrap = (res) => res.data?.data ?? res.data;

export const createAudit = async (data) => {
  const res = await API.post("/api/audits", data);
  return unwrap(res);
};

export const getAudits = async (params = {}) => {
  const { search, status, fromDate, toDate } = params;
  const res = await API.get("/api/audits", {
    params: {
      search: search || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
  });
  return unwrap(res);
};

export const getAuditsByAsset = async (assetId) => {
  const res = await API.get(`/api/audits/asset/${assetId}`);
  return unwrap(res);
};

export const getAuditOverview = async () => {
  const res = await API.get("/api/audits/overview");
  return unwrap(res);
};
