import API from "../config/api";

const unwrap = (res) => res.data?.data ?? res.data;

export const getLogsByAsset = async (assetId) => {
  const res = await API.get(`/api/activity-logs/asset/${assetId}`);
  return unwrap(res);
};
