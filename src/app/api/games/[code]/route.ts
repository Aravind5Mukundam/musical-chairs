import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import {
  games,
  gameSessions,
  gamePlayers,
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
    const { code } = await params;

    const gameResults = await db
      .select()
      .from(games)
      .where(eq(games.code, code))
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

    return NextResponse.json({
      game: {
        id: game.id,
        code: game.code,
        maxPlayers:
          game.maxPlayers,
        status: game.status,
      },

      session: {
        id: session.id,
        status: session.status,
        sessionNumber:
          session.sessionNumber,
      },

      players: players.map(
        (player) => ({
          id: player.id,
          name: player.displayName,
          isEliminated:
            player.isEliminated,
          joinedAt:
            player.joinedAt,
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