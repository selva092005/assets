import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "users",
  initialState: {
    page:       0,
    search:     "",
    filterRole: "",
  },
  reducers: {
    setUserPage(state, { payload })   { state.page       = payload; },
    setUserSearch(state, { payload }) { state.search     = payload; },
    setUserFilter(state, { payload }) { state.filterRole = payload; },
    resetUserFilters(state)           { state.page = 0; state.search = ""; state.filterRole = ""; },
  },
});

export const { setUserPage, setUserSearch, setUserFilter, resetUserFilters } = userSlice.actions;
export default userSlice.reducer;