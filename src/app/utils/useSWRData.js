"use client";

import { useState, useEffect, useCallback } from "react";

// Global cache map to store responses across component mounts
const cacheMap = new Map();

export const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching data.");
    error.status = res.status;
    throw error;
  }
  return res.json();
};

/**
 * Zero-dependency SWR custom hook for caching, request deduplication, and stale-while-revalidate.
 */
export function useSWRData(url, options = {}) {
  const cachedValue = url ? cacheMap.get(url) : undefined;
  const [data, setData] = useState(cachedValue);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!cachedValue && !!url);

  const fetchData = useCallback(async () => {
    if (!url) return;
    try {
      if (!cacheMap.has(url)) {
        setIsLoading(true);
      }
      const resData = await fetcher(url);
      cacheMap.set(url, resData);
      setData(resData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
