import API from "../config/api";

// GET /api/locations — fetch all active locations
export const getAllLocations = async () => {
  const res = await API.get("/api/locations");
  return res.data;
};

// GET /api/locations/{id} — fetch location by ID
export const getLocationById = async (id) => {
  const res = await API.get(`/api/locations/${id}`);
  return res.data;
};

// POST /api/locations — create a manual location
export const saveLocation = async (data) => {
  const res = await API.post("/api/locations", data);
  return res.data;
};

// PUT /api/locations/{id} — update a location's details
export const updateLocation = async (id, data) => {
  const res = await API.put(`/api/locations/${id}`, data);
  return res.data;
};

// DELETE /api/locations/{id} — soft-delete location
export const deleteLocation = async (id) => {
  const res = await API.delete(`/api/locations/${id}`);
  return res.data;
};

// GET /api/locations/current — auto-detect location from IP
export const getCurrentLocation = async () => {
  const res = await API.get("/api/locations/current");
  return res.data;
};

// POST /api/locations/save-current — confirm and save auto-detected location
export const saveCurrentLocation = async (data) => {
  const res = await API.post("/api/locations/save-current", data);
  return res.data;
};
