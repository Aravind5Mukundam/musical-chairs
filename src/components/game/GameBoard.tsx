"use client";

import { useEffect, useState } from "react";

interface GamePlayer {
  id: string;
  name: string;
  isEliminated: boolean;
}

interface RoundPlayer {
  playerId: string;
  initialAngle: number;
  pausedAngle: number | null;
  chairIndex: number | null;
  isEliminated: boolean;
}

interface GameBoardProps {
  players: GamePlayer[];

  roundPlayers: RoundPlayer[];

  chairCount: number;

  roundNumber: number;

  status: string;

  startedAt: string | null;

  totalPausedMs: number;

  movementSpeed: number;
}

export default function GameBoard({
  players,
  roundPlayers,
  chairCount,
  roundNumber,
  status,
  startedAt,
  totalPausedMs,
  movementSpeed,
}: GameBoardProps) {
  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  /* -------------------------------- */
  /* Board configuration               */
  /* -------------------------------- */

  const boardSize = 560;

  const center = boardSize / 2;

  const chairRadius = 220;

  const playerRadius = 165;

  /* -------------------------------- */
  /* Active players                    */
  /* -------------------------------- */

  const activePlayers = players.filter(
    (player) => !player.isEliminated
  );

  /* -------------------------------- */
  /* Update animation clock            */
  /* -------------------------------- */

  useEffect(() => {
    if (status !== "PLAYING") {
      return;
    }

    let animationFrame: number;

    const animate = () => {
      setCurrentTime(Date.now());

      animationFrame =
        requestAnimationFrame(animate);
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [status]);

  /* -------------------------------- */
  /* Calculate elapsed game time       */
  /* -------------------------------- */

  const getElapsedSeconds = () => {
    if (!startedAt) {
      return 0;
    }

    const startTime =
      new Date(startedAt).getTime();

    const elapsedMs =
      currentTime -
      startTime -
      totalPausedMs;

    return Math.max(
      elapsedMs,
      0
    ) / 1000;
  };

  /* -------------------------------- */
  /* Normalize angle                   */
  /* -------------------------------- */

  const normalizeAngle = (
    angle: number
  ) => {
    return (
      ((angle % 360) + 360) % 360
    );
  };

  /* -------------------------------- */
  /* Calculate current player angle    */
  /* -------------------------------- */

  const getPlayerAngle = (
    roundPlayer: RoundPlayer
  ) => {
    /*
     * While playing:
     *
     * initialAngle
     *      +
     * elapsed time × speed
     */

    if (
      status === "PLAYING"
    ) {
      const elapsedSeconds =
        getElapsedSeconds();

      return normalizeAngle(
        roundPlayer.initialAngle +
          elapsedSeconds *
            movementSpeed
      );
    }

    /*
     * When paused, freeze the
     * player at the angle where
     * the server paused the game.
     */

    if (
      roundPlayer.pausedAngle !==
      null
    ) {
      return roundPlayer.pausedAngle;
    }

    return roundPlayer.initialAngle;
  };

  /* -------------------------------- */
  /* Convert angle → screen position   */
  /* -------------------------------- */

  const getPosition = (
    angle: number,
    radius: number
  ) => {
    /*
     * -90 means the first position
     * starts at the top.
     */

    const radians =
      ((angle - 90) *
        Math.PI) /
      180;

    return {
      x:
        center +
        radius *
          Math.cos(radians),

      y:
        center +
        radius *
          Math.sin(radians),
    };
  };

  /* -------------------------------- */
  /* Find player by ID                 */
  /* -------------------------------- */

  const getPlayer = (
    playerId: string
  ) => {
    return players.find(
      (player) =>
        player.id === playerId
    );
  };

  /* -------------------------------- */
  /* Render                            */
  /* -------------------------------- */

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-6 p-6">
      {/* -------------------------------- */}
      {/* Header                           */}
      {/* -------------------------------- */}

      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
          Round {roundNumber}
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Musical Chairs
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {activePlayers.length} Players
          {" · "}
          {chairCount} Chairs
        </p>

        <div className="mt-3 inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold uppercase">
          {status}
        </div>
      </div>

      {/* -------------------------------- */}
      {/* Game Board                       */}
      {/* -------------------------------- */}

      <div
        className="relative rounded-full"
        style={{
          width: boardSize,
          height: boardSize,
        }}
      >
        {/* -------------------------------- */}
        {/* Outer movement path              */}
        {/* -------------------------------- */}

        <div
          className="absolute rounded-full border-4 border-dashed border-gray-300"
          style={{
            width:
              playerRadius * 2,

            height:
              playerRadius * 2,

            left:
              center -
              playerRadius,

            top:
              center -
              playerRadius,
          }}
        />

        {/* -------------------------------- */}
        {/* Inner area                       */}
        {/* -------------------------------- */}

        <div
          className="absolute rounded-full border border-gray-200 bg-gray-50"
          style={{
            width:
              (playerRadius -
                50) *
              2,

            height:
              (playerRadius -
                50) *
              2,

            left:
              center -
              (playerRadius -
                50),

            top:
              center -
              (playerRadius -
                50),
          }}
        />

        {/* -------------------------------- */}
        {/* Chairs                           */}
        {/* -------------------------------- */}

        {Array.from({
          length: chairCount,
        }).map((_, index) => {
          const angle =
            (360 /
              chairCount) *
            index;

          const seatedRoundPlayer = roundPlayers.find(
            (roundPlayer) => roundPlayer.chairIndex === index && !roundPlayer.isEliminated
          );
          const seatedPlayer = seatedRoundPlayer
            ? getPlayer(seatedRoundPlayer.playerId)
            : undefined;

          const {
            x,
            y,
          } =
            getPosition(
              angle,
              chairRadius
            );

          return (
            <div
              key={`chair-${index}`}
              className={`absolute flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 shadow-sm ${seatedPlayer && status !== "PLAYING" ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-white"}`}
              style={{
                left: x,
                top: y,
              }}
              aria-label={`Chair ${
                index + 1
              }`}
            >
              {seatedPlayer && status !== "PLAYING" && (
                <span className="absolute top-full mt-1 max-w-28 truncate rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {seatedPlayer.name}
                </span>
              )}
              🪑
            </div>
          );
        })}

        {/* -------------------------------- */}
        {/* Players                          */}
        {/* -------------------------------- */}

        {roundPlayers.map(
          (roundPlayer) => {
            const player =
              getPlayer(
                roundPlayer.playerId
              );

            if (!player) {
              return null;
            }

            /*
             * Don't render eliminated
             * players.
             */

            const isEliminated =
              player.isEliminated ||
              roundPlayer.isEliminated;

            // Keep the unseated player visible in the paused snapshot. Once
            // play resumes, the elimination takes effect and their marker is
            // removed from the moving group.
            if (isEliminated && status === "PLAYING") {
              return null;
            }

            const angle =
              getPlayerAngle(
                roundPlayer
              );

            const {
              x,
              y,
            } =
              getPosition(
                angle,
                playerRadius
              );

            return (
              <div
                key={
                  roundPlayer.playerId
                }
                className={`absolute flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-sm font-bold text-white shadow-lg ${isEliminated ? "bg-red-600" : "bg-black"}`}
                style={{
                  left: x,
                  top: y,
                }}
                title={
                  player.name
                }
              >
                {player.name
                  .charAt(0)
                  .toUpperCase()}
                <span className="absolute top-full mt-1 max-w-28 truncate rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gray-900 shadow">
                  {isEliminated ? `${player.name} · Out` : player.name}
                </span>
              </div>
            );
          }
        )}

        {/* -------------------------------- */}
        {/* Center                           */}
        {/* -------------------------------- */}

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
          <div className="text-4xl">
            🎵
          </div>

          <span className="mt-2 text-xs font-medium text-gray-500">
            {status === "PLAYING"
              ? "Music Playing"
              : status === "PAUSED"
              ? "Music Paused"
              : status}
          </span>
        </div>
      </div>
    </div>
  );
}
