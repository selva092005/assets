// import axios from "axios";

// const API = axios.create({
//   baseURL: import.meta.env.VITE_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ✅ Attach token to every request
// API.interceptors.request.use((config) => {
//   let token = localStorage.getItem("token");

//   console.log("TOKEN:", token);

//   if (token && token !== "undefined" && token !== "null") {
//     token = token.replace(/^"|"$/g, "").trim();

//     // 🔥 Try BOTH formats (important)
//     config.headers.Authorization = `Bearer ${token}`;
//     // If backend expects raw token, uncomment below and comment above
//     // config.headers.Authorization = token;
//   }

//   return config;
// });

// // ✅ Handle only 401 (NOT 403)
// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const status = error.response?.status;

//     if (status === 401) {
//       console.log("Session expired. Logging out...");

//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//     }

//     return Promise.reject(error);
//   }
// );

// export const ENDPOINTS = {
//   LOGIN: "/api/auth/login",
//   ASSET_TABLE: "/api/assets",
// };

// export default API;

import axios from "axios";

const API = axios.create({
  baseURL: "https://0tv8np19-8081.inc1.devtunnels.ms",
});

// ✅ AUTO ATTACH TOKEN
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("TOKEN:", token); // 🔍 debug

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;