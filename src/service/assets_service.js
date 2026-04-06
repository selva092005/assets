import API from "../config/api";

export const getAssets = async () => {
  try {
    const res = await API.get("/api/assets");
    return res.data;
  } catch (err) {
    console.error("Get Assets Error:", err);
    throw err;
  }
};


// ✅ ADD
export const addAsset = async (data) => {
  const res = await API.post("/api/assets", data);
  return res.data;
};

// ✅ GET BY ID (VIEW)
export const getAssetById = async (id) => {
  const res = await API.get(`/api/assets/${id}`);
  return res.data;
};

// ✅ UPDATE
export const updateAsset = async (id, data) => {
  const payload = {
    ...data,
    id: id,   // 🔥 ensure id is present
  };

  const res = await API.put(`/api/assets/${id}`, payload);
  return res.data;
};

// ✅ DELETE
export const deleteAsset = async (id) => {
  const res = await API.delete(`/api/assets/${id}`);
  return res.data;
};