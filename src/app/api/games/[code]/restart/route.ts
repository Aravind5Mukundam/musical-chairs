import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  gamePlayers,
  gameRoundPlayers,
  gameRounds,
  gameSessions,
  games,
  users,
} from "@/db/schema";

interface RouteProps {
  params: Promise<{ code: string }>;
}

export async function POST(
  _request: Request,
  { params }: RouteProps
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.code, code.toUpperCase()))
      .limit(1);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    if (game.hostUserId !== user.id) {
      return NextResponse.json({ error: "Only the host can restart the game" }, { status: 403 });
    }

    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.gameId, game.id))
      .orderBy(desc(gameSessions.sessionNumber))
      .limit(1);
    if (!session) {
      return NextResponse.json({ error: "Game session not found" }, { status: 404 });
    }

    const [latestRound] = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.sessionId, session.id))
      .orderBy(desc(gameRounds.roundNumber))
      .limit(1);
    if (!latestRound || latestRound.status !== "COMPLETED") {
      return NextResponse.json({ error: "Game is not ready to restart" }, { status: 400 });
    }

    const players = await db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.sessionId, session.id));
    if (players.length < 2) {
      return NextResponse.json({ error: "At least two players are required to restart" }, { status: 400 });
    }

    const now = new Date();
    await db
      .update(gamePlayers)
      .set({ isEliminated: false })
      .where(eq(gamePlayers.sessionId, session.id));

    const [newRound] = await db
      .insert(gameRounds)
      .values({
        sessionId: session.id,
        roundNumber: latestRound.roundNumber + 1,
        playerCount: players.length,
        chairCount: players.length - 1,
        status: "PLAYING",
        movementSpeed: latestRound.movementSpeed,
        totalPausedMs: 0,
        startedAt: now,
      })
      .returning();

    await db.insert(gameRoundPlayers).values(
      players.map((player, index) => ({
        roundId: newRound.id,
        playerId: player.id,
        initialAngle: Math.round((360 / players.length) * index),
      }))
    );

    await db
      .update(gameSessions)
      .set({ status: "PLAYING", startedAt: now, endedAt: null })
      .where(eq(gameSessions.id, session.id));
    await db
      .update(games)
      .set({ status: "PLAYING" })
      .where(eq(games.id, game.id));

    return NextResponse.json({
      success: true,
      round: { id: newRound.id, roundNumber: newRound.roundNumber, status: newRound.status },
    });
  } catch (error) {
    console.error("RESTART_GAME_ERROR:", error);
    return NextResponse.json({ error: "Failed to restart game" }, { status: 500 });
  }
}
