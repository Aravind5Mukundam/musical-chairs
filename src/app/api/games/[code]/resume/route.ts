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
  gameRounds,
  gamePlayers,
  gameRoundPlayers,
} from "@/db/schema";

interface RouteProps {
  params: Promise<{
    code: string;
  }>;
}

export async function POST(
  _request: Request,
  { params }: RouteProps
) {
  try {
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

    /* Find user */

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

    /* Find game */

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

    /* Verify host */

    if (
      game.hostUserId !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Only the host can resume the game",
        },
        {
          status: 403,
        }
      );
    }

    /* Latest session */

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

    /* Latest round */

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

    if (
      !round ||
      round.status !== "PAUSED"
    ) {
      return NextResponse.json(
        {
          error:
            "Round is not paused",
        },
        {
          status: 400,
        }
      );
    }

    if (!round.pausedAt) {
      return NextResponse.json(
        {
          error:
            "Pause timestamp is missing",
        },
        {
          status: 500,
        }
      );
    }

    const now =
      new Date();

    const pausedDuration =
      now.getTime() -
      round.pausedAt.getTime();

    // Finish the resolved round and begin a fresh one with the survivors.
    // Eliminated players remain in the session but are omitted from the new
    // round, so they cannot re-enter when the host resumes.
    await db
      .update(gameRounds)
      .set({
        status: "COMPLETED",
        completedAt: now,
        totalPausedMs: round.totalPausedMs + pausedDuration,
        pausedAt: null,
      })
      .where(
        eq(
          gameRounds.id,
          round.id
        )
      );

    const survivingPlayers = await db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.sessionId, session.id));
    const activePlayers = survivingPlayers.filter(
      (player) => !player.isEliminated
    );

    if (activePlayers.length < 2) {
      return NextResponse.json(
        { error: "There are not enough players to start another round" },
        { status: 400 }
      );
    }

    const [nextRound] = await db
      .insert(gameRounds)
      .values({
        sessionId: session.id,
        roundNumber: round.roundNumber + 1,
        playerCount: activePlayers.length,
        chairCount: activePlayers.length - 1,
        status: "PLAYING",
        movementSpeed: round.movementSpeed,
        totalPausedMs: 0,
        startedAt: now,
      })
      .returning();

    await db.insert(gameRoundPlayers).values(
      activePlayers.map((player, index) => ({
        roundId: nextRound.id,
        playerId: player.id,
        initialAngle: Math.round((360 / activePlayers.length) * index),
      }))
    );

    await db
      .update(gameSessions)
      .set({ status: "PLAYING", endedAt: null })
      .where(eq(gameSessions.id, session.id));

    return NextResponse.json({
      success: true,

      round: {
        id: nextRound.id,
        status: "PLAYING",
        roundNumber: nextRound.roundNumber,
      },
    });
  } catch (error) {
    console.error(
      "RESUME_GAME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to resume game",
      },
      {
        status: 500,
      }
    );
  }
}
