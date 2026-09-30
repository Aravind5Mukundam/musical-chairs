import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";

import {
  games,
  gameSessions,
  gamePlayers,
} from "@/db/schema";

import {
  joinGameSchema,
} from "@/lib/validation";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const parsed =
      joinGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid game code or player name",
        },
        {
          status: 400,
        }
      );
    }

    const {
      code,
      name,
    } = parsed.data;

    /* ------------------------------ */
    /* Find game                      */
    /* ------------------------------ */

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

    /* ------------------------------ */
    /* Check game status              */
    /* ------------------------------ */

    if (game.status !== "WAITING") {
      return NextResponse.json(
        {
          error:
            "This game has already started",
        },
        {
          status: 400,
        }
      );
    }

    /* ------------------------------ */
    /* Find current session           */
    /* ------------------------------ */

    const sessionResults = await db
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

    /* ------------------------------ */
    /* Check player count             */
    /* ------------------------------ */

    const existingPlayers =
      await db
        .select()
        .from(gamePlayers)
        .where(
          eq(
            gamePlayers.sessionId,
            session.id
          )
        );

    if (
      existingPlayers.length >=
      game.maxPlayers
    ) {
      return NextResponse.json(
        {
          error: "Game is full",
        },
        {
          status: 400,
        }
      );
    }

    /* ------------------------------ */
    /* Prevent duplicate names        */
    /* ------------------------------ */

    const duplicateName =
      existingPlayers.some(
        (player) =>
          player.displayName
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (duplicateName) {
      return NextResponse.json(
        {
          error:
            "A player with this name is already in the game",
        },
        {
          status: 400,
        }
      );
    }

    /* ------------------------------ */
    /* Add player                     */
    /* ------------------------------ */

    const playerResults =
      await db
        .insert(gamePlayers)
        .values({
          sessionId: session.id,
          displayName: name,
        })
        .returning();

    const player =
      playerResults[0];

    return NextResponse.json(
      {
        playerId: player.id,
        gameId: game.id,
        sessionId: session.id,
        code: game.code,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "JOIN_GAME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to join game",
      },
      {
        status: 500,
      }
    );
  }
}