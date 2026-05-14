import API from "../config/api";

export const getCompanies = async () => {
  const res = await API.get("/api/companies");
  const raw = res.data;
  const list = Array.isArray(raw)       ? raw
             : Array.isArray(raw?.data) ? raw.data
             : raw?.data?.content       ? raw.data.content
             : raw?.content             ? raw.content
             : [];
  return list;
};