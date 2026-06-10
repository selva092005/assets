import { createSlice } from "@reduxjs/toolkit";

const assetSlice = createSlice({
  name: "assets",
  initialState: {
    page:        0,
    search:      "",
    filterType:  "",
    filterStatus:"",
  },
  reducers: {
    setAssetPage(state, { payload })        { state.page        = payload; },
    setAssetSearch(state, { payload })      { state.search      = payload; },
    setAssetFilter(state, { payload })      { state.filterType  = payload; },
    setAssetStatusFilter(state, { payload }){ state.filterStatus = payload; },
    resetAssetFilters(state)                { state.page = 0; state.search = ""; state.filterType = ""; state.filterStatus = ""; },
  },
});

export const { setAssetPage, setAssetSearch, setAssetFilter, setAssetStatusFilter, resetAssetFilters } = assetSlice.actions;
export default assetSlice.reducer;