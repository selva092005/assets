import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUsers } from "../../services/users_service";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ keyword = "", page = 0, size = 10, role } = {}, { rejectWithValue }) => {
    try {
      const params = { name: keyword || undefined, page, size };
      if (role) params.role = role;

      const data = await getUsers(params);
      return {
        content:    data.data?.content    || data.content    || [],
        totalPages: data.data?.totalPages || data.totalPages || 0,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    items:      [],
    totalPages: 0,
    page:       0,
    search:     "",
    filterRole: "",
    loading:    false,
    error:      null,
  },
  reducers: {
    setUserPage(state, { payload })   { state.page       = payload; },
    setUserSearch(state, { payload }) { state.search     = payload; },
    setUserFilter(state, { payload }) { state.filterRole = payload; },
    resetUserFilters(state)           { state.page = 0; state.search = ""; state.filterRole = ""; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,   (s)              => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload.content; s.totalPages = payload.totalPages; })
      .addCase(fetchUsers.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; });
  },
});

export const { setUserPage, setUserSearch, setUserFilter, resetUserFilters } = userSlice.actions;
export default userSlice.reducer;