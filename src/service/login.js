import API from "../config/api";

export const login = async (email, password) => {
  try {
    const response = await API.post("/api/auth/login", {
      email,
      password,
    });

    console.log("FULL LOGIN RESPONSE:", response);
    console.log("LOGIN DATA:", response.data);

    // ✅ Flexible token extraction
    let token =
      response.data?.token ||
      response.data?.accessToken ||
      response.data?.data?.token;

    // 🔥 EXTRA FIX (sometimes token is inside headers)
    if (!token) {
      token = response.headers["authorization"]?.replace("Bearer ", "");
    }

    if (!token) {
      throw new Error("❌ Token not found in response");
    }

    // ✅ Save clean token
    localStorage.setItem("token", token.trim());

    // ✅ Save user
    localStorage.setItem("user", JSON.stringify(response.data));

    console.log("✅ Saved Token:", token);

    return response.data;
  } catch (error) {
    console.error("Login API Error:", error);
    throw error;
  }
};