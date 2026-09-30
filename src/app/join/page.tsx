"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPlayerId } from "@/lib/player-session";

export default function JoinGamePage() {
  const router = useRouter();

  const [code, setCode] =
    useState("");

  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleJoinGame() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/games/join",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            code,
            name,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to join game"
        );
      }

      setPlayerId(data.playerId);

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
            🎵
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            Join Game
          </h1>

          <p className="mt-2 text-gray-500">
            Enter the game code and your name.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">
              Game Code
            </label>

            <input
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .toUpperCase()
                    .slice(0, 6)
                )
              }
              placeholder="A7K9B2"
              maxLength={6}
              className="mt-2 w-full rounded-lg border p-3 text-center text-xl font-semibold tracking-widest uppercase outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Your Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              maxLength={30}
              className="mt-2 w-full rounded-lg border p-3 outline-none focus:ring-2"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleJoinGame}
          disabled={
            loading ||
            code.length !== 6 ||
            !name.trim()
          }
          className="mt-8 w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Joining..."
            : "Join Game"}
        </button>
      </div>
    </main>
  );
}