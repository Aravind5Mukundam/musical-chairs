"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GameBoard from "./GameBoard";
import Lobby from "./Lobby";
import GameControls from "./GameControls";

interface GameContainerProps {
  game: {
    id: string;
    code: string;
    maxPlayers: number;
    status: string;
    isHost: boolean;
  };

  session: {
    id: string;
    status: string;
    sessionNumber: number;
  };

  round: {
    id: string;

    roundNumber: number;

    playerCount: number;

    chairCount: number;

    status: string;

    movementSpeed: number;

    totalPausedMs: number;

    startedAt: string | null;

    pausedAt: string | null;

    completedAt: string | null;

    eliminatedPlayerId: string | null;
  } | null;

  roundPlayers: {
    id: string;

    playerId: string;

    initialAngle: number;

    pausedAngle: number | null;

    chairIndex: number | null;

    distanceToChair: number | null;

    isEliminated: boolean;

    createdAt: string;
  }[];

  players: {
    id: string;

    name: string;

    isEliminated: boolean;

    joinedAt: string;
  }[];
}

export default function GameContainer({
  game,
  session,
  round,
  roundPlayers,
  players,
}: GameContainerProps) {
  const router = useRouter();

  // The page's initial state comes from the server. Refresh the server
  // component while a game is active so every browser receives host pause,
  // resume, and round changes from the persisted game state.
  useEffect(() => {
    if (game.status !== "PLAYING" && game.status !== "PAUSED") {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [game.status, router]);

  /* -------------------------------- */
  /* Lobby                             */
  /* -------------------------------- */

  if (game.status === "WAITING") {
    return (
      <Lobby
        initialGame={game}
        initialSession={session}
        initialPlayers={players}
      />
    );
  }

  /* -------------------------------- */
  /* Game board                        */
  /* -------------------------------- */

  if (
  (game.status === "PLAYING" ||
    game.status === "PAUSED" ||
    game.status === "COMPLETED") &&
  round
) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      <div className="flex-1">
        <GameBoard
          players={players}
          roundPlayers={roundPlayers}
          chairCount={
            round.chairCount
          }
          roundNumber={
            round.roundNumber
          }
          status={round.status}
          startedAt={
            round.startedAt
          }
          totalPausedMs={
            round.totalPausedMs
          }
          movementSpeed={
            round.movementSpeed
          }
        />
      </div>

      {/* Host controls */}
      {game.isHost && (
        <GameControls
          code={game.code}
          gameStatus={game.status}
          roundStatus={round.status}
          onStateChange={() => router.refresh()}
          // playerCount={
          //   round.playerCount
          // }
        />
      )}
    </div>
  );
}

  /* -------------------------------- */
  /* Other states                      */
  /* -------------------------------- */

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          Game state:{" "}
          {game.status}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Waiting for the game
          to continue...
        </p>
      </div>
    </div>
  );
}
