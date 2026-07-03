import API from "../config/api";

export const getCronJobs = async () => {
  const res = await API.get("/api/cron-jobs");
  return res.data;
};

export const updateCronJob = async (id, data) => {
  const res = await API.put(`/api/cron-jobs/${id}`, data);
  return res.data;
};

export const triggerCronJob = async (id) => {
  const res = await API.post(`/api/cron-jobs/${id}/trigger`);
  return res.data;
};

export const getCronLogs = async (params = {}) => {
  const res = await API.get("/api/cron-jobs/logs", { params });
  return res.data;
};
