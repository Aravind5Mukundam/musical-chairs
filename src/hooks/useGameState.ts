"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useGameState(
  code: string
) {
  const [game, setGame] =
    useState<unknown>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const refresh =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              `/api/games/${code}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Failed to fetch game"
            );
          }

          setGame(data);

          setError(null);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to fetch game"
          );
        } finally {
          setLoading(false);
        }
      },
      [code]
    );

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh();
    }, 0);

    const interval =
      setInterval(
        refresh,
        1000
      );

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    game,
    loading,
    error,
    refresh,
  };
}