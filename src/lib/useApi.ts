/**
 * useApi.ts — Data fetching hooks
 * API is the ONLY source of truth. No localStorage fallback for data.
 */
import { useState, useEffect, useCallback } from "react";
import { ApiError } from "./apiClient";

type Status = "idle" | "loading" | "success" | "error";

interface ApiState<T> {
  data: T | null;
  status: Status;
  error: string | null;
  refetch: () => void;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setStatus("success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "تعذر الاتصال بالخادم";
      setError(msg);
      setStatus("error");
      setData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, status, error, refetch: fetch };
}

// Loading component helper
export function isLoading(status: Status) { return status === "loading" || status === "idle"; }
