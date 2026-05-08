import { useState, useCallback } from "react";

/**
 * usePaginatedList
 * Generic hook to manage local pagination + search state.
 * For pages that still manage state locally (not via Redux slices).
 *
 * @param {Function} fetchFn   – async (keyword, page) => { content, totalPages }
 * @param {number}   pageSize
 */
export default function usePaginatedList(fetchFn, pageSize = 10) {
  const [items,      setItems]      = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page,       setPage]       = useState(0);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(
    async (keyword = search, pg = page) => {
      setLoading(true);
      setError(null);
      try {
        const { content, totalPages: tp } = await fetchFn(keyword, pg);
        setItems(content);
        setTotalPages(tp);
      } catch (e) {
        setError(e.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, search, page]
  );

  const handleSearch = () => { setPage(0); load(search, 0); };
  const handleReset  = (extra = {}) => {
    const kw = "";
    setSearch(kw);
    setPage(0);
    Object.entries(extra).forEach(([set, val]) => set(val));
    load(kw, 0);
  };
  const handlePageChange = (pg) => { setPage(pg); load(search, pg); };

  return {
    items, totalPages, page, search, loading, error,
    setSearch, load, handleSearch, handleReset, handlePageChange,
  };
}
