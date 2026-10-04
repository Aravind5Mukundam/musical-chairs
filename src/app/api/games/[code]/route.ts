import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";

import {
  games,
  gameSessions,
  gamePlayers,
  gameRounds,
  gameRoundPlayers,
  users,
} from "@/db/schema";

interface RouteProps {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteProps
) {
  try {
    /* -------------------------------- */
    /* Get route params + auth           */
    /* -------------------------------- */

    const { code } = await params;

    const { userId } = await auth();

    /* -------------------------------- */
    /* Find game                         */
    /* -------------------------------- */

    const gameResults = await db
      .select()
      .from(games)
      .where(
        eq(
          games.code,
          code.toUpperCase()
        )
      )
      .limit(1);

    const game = gameResults[0];

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

    /* -------------------------------- */
    /* Determine host                    */
    /* -------------------------------- */

    let isHost = false;

    if (userId) {
      const userResults = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(
          eq(
            users.clerkUserId,
            userId
          )
        )
        .limit(1);

      isHost =
        userResults[0]?.id ===
        game.hostUserId;
    }

    /* -------------------------------- */
    /* Find latest session               */
    /* -------------------------------- */

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
          status: 500,
        }
      );
    }

    /* -------------------------------- */
    /* Get session players               */
    /* -------------------------------- */

    const players =
      await db
        .select()
        .from(gamePlayers)
        .where(
          eq(
            gamePlayers.sessionId,
            session.id
          )
        );

    /* -------------------------------- */
    /* Find latest round                 */
    /* -------------------------------- */

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

    /* -------------------------------- */
    /* Get round players                 */
    /* -------------------------------- */

    let roundPlayers: typeof gameRoundPlayers.$inferSelect[] =
      [];

    if (round) {
      roundPlayers =
        await db
          .select()
          .from(gameRoundPlayers)
          .where(
            eq(
              gameRoundPlayers.roundId,
              round.id
            )
          );
    }

    /* -------------------------------- */
    /* Response                          */
    /* -------------------------------- */

    return NextResponse.json({
      game: {
        id: game.id,

        code: game.code,

        maxPlayers:
          game.maxPlayers,

        status:
          game.status,

        isHost,
      },

      session: {
        id: session.id,

        status:
          session.status,

        sessionNumber:
          session.sessionNumber,
      },

      players: players.map(
        (player) => ({
          id: player.id,

          name:
            player.displayName,

          isEliminated:
            player.isEliminated,

          joinedAt:
            player.joinedAt,

          leftAt:
            player.leftAt,
        })
      ),

      /* -------------------------------- */
      /* Current round                    */
      /* -------------------------------- */

      round: round
        ? {
            id: round.id,

            roundNumber:
              round.roundNumber,

            playerCount:
              round.playerCount,

            chairCount:
              round.chairCount,

            status:
              round.status,

            movementSpeed:
              round.movementSpeed,

            totalPausedMs:
              round.totalPausedMs,

            startedAt:
              round.startedAt,

            pausedAt:
              round.pausedAt,

            completedAt:
              round.completedAt,

            eliminatedPlayerId:
              round.eliminatedPlayerId,
          }
        : null,

      /* -------------------------------- */
      /* Round player positions            */
      /* -------------------------------- */

      roundPlayers:
        roundPlayers.map(
          (player) => ({
            id: player.id,

            playerId:
              player.playerId,

            initialAngle:
              player.initialAngle,

            pausedAngle:
              player.pausedAngle,

            chairIndex:
              player.chairIndex,

            distanceToChair:
              player.distanceToChair,

            isEliminated:
              player.isEliminated,

            createdAt:
              player.createdAt,
          })
        ),
    });
  } catch (error) {
    console.error(
      "GET_GAME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch game",
      },
      {
        status: 500,
      }
    );
  }
}