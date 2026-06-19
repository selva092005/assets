import API from "../config/api";

// GET /api/reports — full aggregated report
export const getFullReport = async () => {
  const res = await API.get("/api/reports");
  return res.data;
};

// Trigger file download from blob
const download = (blob, fileName) => {
  const url  = window.URL.createObjectURL(new Blob([blob]));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// GET /api/reports/allocations/export → blob download
export const exportAllocations = async () => {
  const res = await API.get("/api/reports/allocations/export", { responseType: "blob" });
  download(res.data, "allocations_report.xlsx");
};

// GET /api/reports/transfers/export → blob download
export const exportTransfers = async () => {
  const res = await API.get("/api/reports/transfers/export", { responseType: "blob" });
  download(res.data, "transfers_report.xlsx");
};

// GET /api/reports/disposals/export → blob download
export const exportDisposals = async () => {
  const res = await API.get("/api/reports/disposals/export", { responseType: "blob" });
  download(res.data, "disposals_report.xlsx");
};

// GET /api/reports/audits/export → blob download
export const exportAudits = async () => {
  const res = await API.get("/api/reports/audits/export", { responseType: "blob" });
  download(res.data, "audits_report.xlsx");
};

