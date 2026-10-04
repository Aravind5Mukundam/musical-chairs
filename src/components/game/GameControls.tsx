"use client";

import { useState } from "react";

interface GameControlsProps {
  code: string;

  /**
   * Overall game status
   *
   * WAITING
   * PLAYING
   * PAUSED
   * COMPLETED
   */
  gameStatus: string;

  /**
   * Current round status
   *
   * WAITING
   * PLAYING
   * PAUSED
   * SEATING
   * ELIMINATED
   * COMPLETED
   */
  roundStatus: string;

  /**
   * Called after a successful API request
   * so the parent can refresh the game state.
   */
  onStateChange: () => void | Promise<void>;
}

type GameAction =
  | "pause"
  | "resume"
  | "restart";

export default function GameControls({
  code,
  gameStatus,
  roundStatus,
  onStateChange,
}: GameControlsProps) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* -------------------------------- */
  /* Handle API action                 */
  /* -------------------------------- */

  const handleAction = async (
    action: GameAction
  ) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/games/${code}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${action} game`
        );
      }

      /*
       * Tell GameContainer/page
       * to fetch the latest state.
       */
      await onStateChange();
    } catch (error) {
      console.error(
        `${action.toUpperCase()}_GAME_ERROR:`,
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------- */
  /* Don't render controls while       */
  /* waiting/completed                 */
  /* -------------------------------- */

  if (gameStatus === "WAITING") {
    return null;
  }

  /* -------------------------------- */
  /* Seating / evaluation              */
  /* -------------------------------- */

  if (
    roundStatus === "SEATING" ||
    roundStatus === "ELIMINATED"
  ) {
    return (
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-2xl border bg-white px-6 py-3 shadow-xl">
        <span className="text-sm font-medium text-gray-600">
          {roundStatus === "SEATING"
            ? "Players are finding their chairs..."
            : "Eliminating player..."}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 shadow-lg">
          {error}
        </div>
      )}

      {/* Controls */}

      <div className="flex gap-3 rounded-2xl border bg-white p-3 shadow-xl">
        {/* ------------------------------ */}
        {/* Pause                           */}
        {/* ------------------------------ */}

        {roundStatus === "PLAYING" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleAction("pause")
            }
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Pausing..."
              : "⏸ Pause"}
          </button>
        )}

        {/* ------------------------------ */}
        {/* Resume                          */}
        {/* ------------------------------ */}

        {roundStatus === "PAUSED" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleAction("resume")
            }
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Resuming..."
              : "▶ Resume"}
          </button>
        )}

        {/* ------------------------------ */}
        {/* Restart                         */}
        {/* ------------------------------ */}

        {roundStatus === "COMPLETED" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleAction("restart")
            }
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Restarting..."
              : "🔄 Restart"}
          </button>
        )}
      </div>
    </div>
  );
}
