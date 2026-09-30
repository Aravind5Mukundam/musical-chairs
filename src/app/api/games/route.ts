import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  users,
  games,
  gameSessions,
} from "@/db/schema";

import { generateGameCode } from "@/lib/game-code";
import {
  createGameSchema,
} from "@/lib/validation";

export async function POST(
  request: Request
) {
  try {
    /* ------------------------------ */
    /* Authentication                 */
    /* ------------------------------ */

    const { userId } = await auth();

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

    /* ------------------------------ */
    /* Validate request               */
    /* ------------------------------ */

    const body = await request.json();

    const parsed =
      createGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid player count",
        },
        {
          status: 400,
        }
      );
    }

    const { maxPlayers } = parsed.data;

    /* ------------------------------ */
    /* Find/Create application user   */
    /* ------------------------------ */

    const existingUsers = await db
      .select()
      .from(users)
      .where(
        eq(users.clerkUserId, userId)
      )
      .limit(1);

    let user = existingUsers[0];

    if (!user) {
      const createdUsers = await db
        .insert(users)
        .values({
          clerkUserId: userId,
        })
        .returning();

      user = createdUsers[0];
    }

    /* ------------------------------ */
    /* Generate unique game code      */
    /* ------------------------------ */

    let code = generateGameCode();

    while (true) {
      const existingGames = await db
        .select()
        .from(games)
        .where(eq(games.code, code))
        .limit(1);

      if (existingGames.length === 0) {
        break;
      }

      code = generateGameCode();
    }

    /* ------------------------------ */
    /* Create game                    */
    /* ------------------------------ */

    const createdGames = await db
      .insert(games)
      .values({
        code,
        hostUserId: user.id,
        maxPlayers,
        status: "WAITING",
      })
      .returning();

    const game = createdGames[0];

    /* ------------------------------ */
    /* Create first game session      */
    /* ------------------------------ */

    const createdSessions = await db
      .insert(gameSessions)
      .values({
        gameId: game.id,
        sessionNumber: 1,
        status: "WAITING",
      })
      .returning();

    const session = createdSessions[0];

    /* ------------------------------ */
    /* Response                       */
    /* ------------------------------ */

    return NextResponse.json(
      {
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
      "CREATE_GAME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create game",
      },
      {
        status: 500,
      }
    );
  }
}