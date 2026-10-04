"use client";

import { useEffect, useState } from "react";

interface Player {
  id: string;
  name: string;
  isEliminated: boolean;
}

interface Game {
  id: string;
  code: string;
  maxPlayers: number;
  status: string;
}

interface Session {
  id: string;
  status: string;
  sessionNumber: number;
}

interface LobbyProps {
  initialGame: Game;
  initialSession: Session;
  initialPlayers: Player[];
}

export default function Lobby({
  initialGame,
  // initialSession,
  initialPlayers,
}: LobbyProps) {
  const [game] =
    useState(initialGame);

  const [players, setPlayers] =
    useState(initialPlayers);
  const [starting, setStarting] =
    useState(false);

  const handleStartGame =
    async () => {
      try {
        setStarting(true);

        const response =
          await fetch(
            `/api/games/${game.code}/start`,
            {
              method: "POST",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Failed to start game"
          );
        }

        /*
         * We don't need to navigate.
         *
         * /game/[code] remains the
         * same URL.
         *
         * The page will transition
         * to the GameBoard when the
         * new game state is fetched.
         */

      } catch (error) {
        console.error(error);

        // Add your toast here.
      } finally {
        setStarting(false);
      }
    };

  async function refreshLobby() {
    const response =
      await fetch(
        `/api/games/${game.code}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    setPlayers(data.players);
  }

  useEffect(() => {
    const interval =
      setInterval(
        refreshLobby,
        3000
      );

    return () =>
      clearInterval(interval);
  }, [game.code]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Game Lobby
            </h1>

            <p className="mt-1 text-gray-500">
              Waiting for players...
            </p>
          </div>

          <div className="rounded-xl border bg-white px-5 py-3 text-center">
            <p className="text-xs text-gray-500">
              Game Code
            </p>

            <p className="mt-1 text-2xl font-bold tracking-widest">
              {game.code}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartGame}
            disabled={starting}
            className="rounded-lg bg-black px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting
              ? "Starting..."
              : "Start Game"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Players */}

          <section className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Players
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {players.length}/
                {game.maxPlayers}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {players.map(
                (player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-semibold">
                      {player.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium">
                        {player.name}
                      </p>

                      {index === 0 && (
                        <p className="text-xs text-gray-500">
                          Host
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}

              {players.length === 0 && (
                <p className="py-8 text-center text-gray-500">
                  Waiting for players...
                </p>
              )}
            </div>
          </section>

          {/* Game information */}

          <section className="rounded-2xl border bg-white p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-6xl">
                🪑
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                Waiting for Players
              </h2>

              <p className="mt-2 text-gray-500">
                Share the game code with
                your friends.
              </p>

              <div className="mt-6 rounded-xl bg-gray-100 px-8 py-4">
                <p className="text-3xl font-bold tracking-[0.3em]">
                  {game.code}
                </p>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                {players.length} player
                {players.length !== 1
                  ? "s"
                  : ""}{" "}
                joined
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}