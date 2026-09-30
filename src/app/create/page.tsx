"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGamePage() {
  const router = useRouter();

  const [maxPlayers, setMaxPlayers] =
    useState(6);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleCreateGame() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/games",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            maxPlayers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create game"
        );
      }

      router.push(
        `/game/${data.code}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="text-5xl">
            🪑
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            Create a Game
          </h1>

          <p className="mt-2 text-gray-500">
            Choose how many players can join.
          </p>
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium">
            Number of Players
          </label>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMaxPlayers(
                  Math.max(
                    2,
                    maxPlayers - 1
                  )
                )
              }
              className="h-12 w-12 rounded-lg border text-xl"
            >
              −
            </button>

            <div className="flex h-12 flex-1 items-center justify-center rounded-lg border bg-gray-50 text-xl font-semibold">
              {maxPlayers}
            </div>

            <button
              type="button"
              onClick={() =>
                setMaxPlayers(
                  Math.min(
                    50,
                    maxPlayers + 1
                  )
                )
              }
              className="h-12 w-12 rounded-lg border text-xl"
            >
              +
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-gray-500">
            Minimum 2 players · Maximum 50
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreateGame}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : "Create Game"}
        </button>
      </div>
    </main>
  );
}