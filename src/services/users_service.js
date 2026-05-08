import API from "../config/api";

export const getUsers = async (params = {}) => {
  const res = await API.get("/api/users/search/page", { params });
  return res.data;
};

export const getUserById = async (id) => {
  const res = await API.get(`/api/users/${id}`);
  return res.data;
};

export const addUser = async (data) => {
  const res = await API.post("/api/users", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await API.put(`/api/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/api/users/${id}`);
  return res.data;
};
