import { useCallback, useEffect, useState } from "react";

// Fetches data on mount (and whenever `deps` changes), tracking loading/error
// state the same way every page in this app was doing by hand. `refetch` lets
// a page silently reload data (e.g. after an action) without resetting `data`.
export const useAsyncData = (
  fetcher,
  deps = [],
  { initialValue = null, errorMessage = "Failed to load data." } = {}
) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, setError, refetch };
};
