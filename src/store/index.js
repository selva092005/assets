import { configureStore } from "@reduxjs/toolkit";
import authReducer  from "./slices/authSlice";
import assetReducer from "./slices/assetSlice";
import userReducer  from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    auth:   authReducer,
    assets: assetReducer,
    users:  userReducer,
  },
});

export default store;
