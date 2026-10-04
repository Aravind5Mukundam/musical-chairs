import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/db";

import {
  users,
  games,
  gameSessions,
  gamePlayers,
  gameRounds,
  gameRoundPlayers,
} from "@/db/schema";

interface RouteProps {
  params: Promise<{
    code: string;
  }>;
}

function normalizeAngle(
  angle: number
) {
  return (
    ((angle % 360) + 360) % 360
  );
}

function angularDistance(
  a: number,
  b: number
) {
  const difference =
    Math.abs(a - b) % 360;

  return Math.min(
    difference,
    360 - difference
  );
}

/**
 * Hungarian algorithm.
 *
 * We have:
 *
 * N players
 * N - 1 chairs
 *
 * Therefore we transpose the matrix:
 *
 * chairs -> rows
 * players -> columns
 *
 * The algorithm assigns every chair
 * to one unique player.
 *
 * Exactly one player remains
 * unassigned.
 */
function assignChairs(
  costMatrix: number[][]
) {
  const rowCount =
    costMatrix.length;

  const columnCount =
    costMatrix[0]?.length ?? 0;

  const u = new Array(
    rowCount + 1
  ).fill(0);

  const v = new Array(
    columnCount + 1
  ).fill(0);

  const p = new Array(
    columnCount + 1
  ).fill(0);

  const way = new Array(
    columnCount + 1
  ).fill(0);

  for (
    let i = 1;
    i <= rowCount;
    i++
  ) {
    p[0] = i;

    let j0 = 0;

    const minv = new Array(
      columnCount + 1
    ).fill(Infinity);

    const used = new Array(
      columnCount + 1
    ).fill(false);

    do {
      used[j0] = true;

      const i0 = p[j0];

      let delta = Infinity;
      let j1 = 0;

      for (
        let j = 1;
        j <= columnCount;
        j++
      ) {
        if (used[j]) {
          continue;
        }

        const current =
          costMatrix[i0 - 1][
            j - 1
          ] -
          u[i0] -
          v[j];

        if (current < minv[j]) {
          minv[j] = current;
          way[j] = j0;
        }

        if (
          minv[j] < delta
        ) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (
        let j = 0;
        j <= columnCount;
        j++
      ) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];

      p[j0] = p[j1];

      j0 = j1;
    } while (j0 !== 0);
  }

  const assignments: {
    row: number;
    column: number;
    cost: number;
  }[] = [];

  for (
    let j = 1;
    j <= columnCount;
    j++
  ) {
    if (p[j] !== 0) {
      assignments.push({
        row: p[j] - 1,
        column: j - 1,
        cost:
          costMatrix[
            p[j] - 1
          ][j - 1],
      });
    }
  }

  return assignments;
}

export async function POST(
  _request: Request,
  { params }: RouteProps
) {
  try {
    /* ------------------------------ */
    /* Authentication                 */
    /* ------------------------------ */

    const { userId } =
      await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { code } =
      await params;

    /* ------------------------------ */
    /* Find user                      */
    /* ------------------------------ */

    const userResults =
      await db
        .select()
        .from(users)
        .where(
          eq(
            users.clerkUserId,
            userId
          )
        )
        .limit(1);

    const user =
      userResults[0];

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ------------------------------ */
    /* Find game                      */
    /* ------------------------------ */

    const gameResults =
      await db
        .select()
        .from(games)
        .where(
          eq(
            games.code,
            code.toUpperCase()
          )
        )
        .limit(1);

    const game =
      gameResults[0];

    if (!game) {
      return NextResponse.json(
        {
          error: "Game not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ------------------------------ */
    /* Verify host                    */
    /* ------------------------------ */

    if (
      game.hostUserId !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Only the host can pause the game",
        },
        {
          status: 403,
        }
      );
    }

    /* ------------------------------ */
    /* Latest session                 */
    /* ------------------------------ */

    const sessionResults =
      await db
        .select()
        .from(gameSessions)
        .where(
          eq(
            gameSessions.gameId,
            game.id
          )
        )
        .orderBy(
          desc(
            gameSessions.sessionNumber
          )
        )
        .limit(1);

    const session =
      sessionResults[0];

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Game session not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ------------------------------ */
    /* Latest round                   */
    /* ------------------------------ */

    const roundResults =
      await db
        .select()
        .from(gameRounds)
        .where(
          eq(
            gameRounds.sessionId,
            session.id
          )
        )
        .orderBy(
          desc(
            gameRounds.roundNumber
          )
        )
        .limit(1);

    const round =
      roundResults[0];

    if (!round) {
      return NextResponse.json(
        {
          error: "Round not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      round.status !== "PLAYING"
    ) {
      return NextResponse.json(
        {
          error:
            "Round is not currently playing",
        },
        {
          status: 400,
        }
      );
    }

    /* ------------------------------ */
    /* Current time                   */
    /* ------------------------------ */

    const now =
      new Date();

    if (!round.startedAt) {
      return NextResponse.json(
        {
          error:
            "Round has no start time",
        },
        {
          status: 500,
        }
      );
    }

    /* ------------------------------ */
    /* Calculate elapsed movement      */
    /* ------------------------------ */

    const elapsedMs =
      now.getTime() -
      round.startedAt.getTime() -
      round.totalPausedMs;

    const elapsedSeconds =
      Math.max(
        elapsedMs,
        0
      ) / 1000;

    /* ------------------------------ */
    /* Round players                  */
    /* ------------------------------ */

    const roundPlayers =
      await db
        .select()
        .from(gameRoundPlayers)
        .where(
          eq(
            gameRoundPlayers.roundId,
            round.id
          )
        );

    if (
      roundPlayers.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Round players not found",
        },
        {
          status: 500,
        }
      );
    }

    /* ------------------------------ */
    /* Calculate current positions     */
    /* ------------------------------ */

    const playerPositions =
      roundPlayers.map(
        (roundPlayer) => {
          const angle =
            normalizeAngle(
              roundPlayer.initialAngle +
                elapsedSeconds *
                  round.movementSpeed
            );

          return {
            ...roundPlayer,
            currentAngle: angle,
          };
        }
      );

    /* ------------------------------ */
    /* Chair positions                */
    /* ------------------------------ */

    const chairAngles =
      Array.from(
        {
          length:
            round.chairCount,
        },
        (_, index) =>
          normalizeAngle(
            (360 /
              round.chairCount) *
              index
          )
      );

    /*
     * Build:
     *
     * rows    = chairs
     * columns = players
     *
     * Each value is angular distance.
     */

    const costMatrix =
      chairAngles.map(
        (chairAngle) =>
          playerPositions.map(
            (player) =>
              angularDistance(
                chairAngle,
                player.currentAngle
              )
          )
      );

    /* ------------------------------ */
    /* Assign chairs                  */
    /* ------------------------------ */

    const assignments =
      assignChairs(
        costMatrix
      );

    const assignedPlayerIds =
      new Set<string>();

    const assignmentResponse =
      assignments.map(
        (assignment) => {
          const player =
            playerPositions[
              assignment.column
            ];

          const chairIndex =
            assignment.row;

          assignedPlayerIds.add(
            player.playerId
          );

          return {
            playerId:
              player.playerId,

            chairIndex,

            distance: Math.round(
              assignment.cost
            ),

            currentAngle:
              player.currentAngle,

            chairAngle:
              chairAngles[
                chairIndex
              ],
          };
        }
      );

    /* ------------------------------ */
    /* Find eliminated player         */
    /* ------------------------------ */

    const eliminatedPlayer =
      playerPositions.find(
        (player) =>
          !assignedPlayerIds.has(
            player.playerId
          )
      );

    if (!eliminatedPlayer) {
      return NextResponse.json(
        {
          error:
            "Unable to determine eliminated player",
        },
        {
          status: 500,
        }
      );
    }

    /* ------------------------------ */
    /* Persist chair assignments      */
    /* ------------------------------ */

    const chairByPlayer = new Map(
      assignmentResponse.map((assignment) => [
        assignment.playerId,
        assignment,
      ])
    );

    // Save the exact position for every player before changing the round
    // status. Every client can then freeze at the same server-calculated spot.
    for (const player of playerPositions) {
      const assignment = chairByPlayer.get(player.playerId);
      await db
        .update(gameRoundPlayers)
        .set({
          pausedAngle: Math.round(player.currentAngle),
          chairIndex: assignment?.chairIndex ?? null,
          distanceToChair: assignment?.distance ?? null,
        })
        .where(
          eq(gameRoundPlayers.id, player.id)
        );
    }

    /* ------------------------------ */
    /* Mark eliminated player         */
    /* ------------------------------ */

    await db
      .update(gameRoundPlayers)
      .set({
        isEliminated: true,
      })
      .where(
        eq(
          gameRoundPlayers.playerId,
          eliminatedPlayer.playerId
        )
      );

    await db
      .update(gamePlayers)
      .set({
        isEliminated: true,
      })
      .where(
        eq(
          gamePlayers.id,
          eliminatedPlayer.playerId
        )
      );

    /* ------------------------------ */
    /* Pause round                    */
    /* ------------------------------ */

    const gameComplete = playerPositions.length <= 2;

    await db
      .update(gameRounds)
      .set({
        status: gameComplete ? "COMPLETED" : "PAUSED",
        pausedAt: gameComplete ? null : now,
        completedAt: gameComplete ? now : null,
        eliminatedPlayerId: eliminatedPlayer.playerId,
      })
      .where(
        eq(
          gameRounds.id,
          round.id
        )
      );

    if (gameComplete) {
      await db
        .update(games)
        .set({ status: "COMPLETED" })
        .where(eq(games.id, game.id));

      await db
        .update(gameSessions)
        .set({ status: "COMPLETED", endedAt: now })
        .where(eq(gameSessions.id, session.id));
    }

    return NextResponse.json({
      success: true,

      round: {
        id: round.id,
        status: gameComplete ? "COMPLETED" : "PAUSED",
        roundNumber:
          round.roundNumber,
        pausedAt: now,
        elapsedMs,
      },

      assignments:
        assignmentResponse,

      eliminatedPlayer: {
        id:
          eliminatedPlayer.playerId,
        angle:
          eliminatedPlayer.currentAngle,
      },
    });
  } catch (error) {
    console.error(
      "PAUSE_GAME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to pause game",
      },
      {
        status: 500,
      }
    );
  }
}
