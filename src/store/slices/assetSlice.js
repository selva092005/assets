import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAssets } from "../../services/assets_service";

export const fetchAssets = createAsyncThunk(
  "assets/fetchAssets",
  async ({ keyword = "", page = 0, size = 10, type } = {}, { rejectWithValue }) => {
    try {
      const params = { name: keyword || undefined, type: type || undefined, page, size };

      const data = await getAssets(params);
      return {
        content:    data.data?.content    || data.content    || [],
        totalPages: data.data?.totalPages || data.totalPages || 0,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const assetSlice = createSlice({
  name: "assets",
  initialState: {
    items:      [],
    totalPages: 0,
    page:       0,
    search:     "",
    filterType: "",
    loading:    false,
    error:      null,
  },
  reducers: {
    setAssetPage(state, { payload })   { state.page       = payload; },
    setAssetSearch(state, { payload }) { state.search     = payload; },
    setAssetFilter(state, { payload }) { state.filterType = payload; },
    resetAssetFilters(state)           { state.page = 0; state.search = ""; state.filterType = ""; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending,   (s)              => { s.loading = true; s.error = null; })
      .addCase(fetchAssets.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload.content; s.totalPages = payload.totalPages; })
      .addCase(fetchAssets.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; });
  },
});

export const { setAssetPage, setAssetSearch, setAssetFilter, resetAssetFilters } = assetSlice.actions;
export default assetSlice.reducer;