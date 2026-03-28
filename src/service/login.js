import axios from "axios";
import { ENDPOINTS } from "../config/Api";

export const login = async (empName, password) => {
  try {
    const response = await axios.post(ENDPOINTS.LOGIN, {
        empName: empName,
        password: password
    });

    return response.data; // return backend data
  } catch (error) {
    console.error("Login API Error:", error);
    throw error;
  }
};


// ASSET TABLE

// export const assettable=async () 

export const getAssets = async () => {
  const response = await axios.get(ASSET_TABLE);
  console.log(response.data.data);
  return response.data.data; 
};

//post
export const postAssets = async () => {
  const response = await axios.post(ASSET_TABLE);
  console.log(response.data.data);
  return response.data.data; 
};

