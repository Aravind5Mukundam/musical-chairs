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

export async function POST(
    _request: Request,
    { params }: RouteProps
) {
    try {
        /* -------------------------------- */
        /* Authentication                   */
        /* -------------------------------- */

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

        const { code } = await params;

        const normalizedCode =
            code.toUpperCase();

        /* -------------------------------- */
        /* Find application user            */
        /* -------------------------------- */

        const userResults = await db
            .select()
            .from(users)
            .where(
                eq(users.clerkUserId, userId)
            )
            .limit(1);

        const user = userResults[0];

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

        /* -------------------------------- */
        /* Find game                        */
        /* -------------------------------- */

        const gameResults = await db
            .select()
            .from(games)
            .where(
                eq(
                    games.code,
                    normalizedCode
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
        /* Verify host                      */
        /* -------------------------------- */

        if (game.hostUserId !== user.id) {
            return NextResponse.json(
                {
                    error:
                        "Only the host can start the game",
                },
                {
                    status: 403,
                }
            );
        }

        /* -------------------------------- */
        /* Verify game status               */
        /* -------------------------------- */

        if (game.status !== "WAITING") {
            return NextResponse.json(
                {
                    error:
                        "Game has already started",
                },
                {
                    status: 400,
                }
            );
        }

        /* -------------------------------- */
        /* Get latest session               */
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
        /* Get players                      */
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
        /* Validate player count            */
        /* -------------------------------- */

        if (players.length < 2) {
            return NextResponse.json(
                {
                    error:
                        "At least 2 players are required to start the game",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            players.length >
            game.maxPlayers
        ) {
            return NextResponse.json(
                {
                    error:
                        "Player count exceeds game limit",
                },
                {
                    status: 400,
                }
            );
        }

        /* -------------------------------- */
        /* Calculate chairs                 */
        /* -------------------------------- */

        const playerCount =
            players.length;

        const chairCount =
            playerCount - 1;

        const now = new Date();

        /* -------------------------------- */
        /* Create first round               */
        /* -------------------------------- */

        const roundResults =
            await db
                .insert(gameRounds)
                .values({
                    sessionId: session.id,
                    roundNumber: 1,
                    playerCount,
                    chairCount,
                    status: "PLAYING",
                    movementSpeed: 90,
                    totalPausedMs: 0,
                    startedAt: now,
                })
                .returning();

        const round =  roundResults[0];

        const roundPlayerValues =
            players.map((player, index) => {
                const initialAngle =
                    (360 / playerCount) * index;

                return {
                    roundId: round.id,
                    playerId: player.id,
                    initialAngle: Math.round(
                        initialAngle
                    ),
                };
            });

        await db
            .insert(gameRoundPlayers)
            .values(roundPlayerValues);

        /* -------------------------------- */
        /* Update session                   */
        /* -------------------------------- */

        await db
            .update(gameSessions)
            .set({
                status: "PLAYING",
                startedAt: now,
            })
            .where(
                eq(
                    gameSessions.id,
                    session.id
                )
            );

        /* -------------------------------- */
        /* Update game                      */
        /* -------------------------------- */

        await db
            .update(games)
            .set({
                status: "PLAYING",
            })
            .where(
                eq(games.id, game.id)
            );

        /* -------------------------------- */
        /* Response                         */
        /* -------------------------------- */

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

            round: round
                ? {
                    id: round.id,
                    roundNumber:
                        round.roundNumber,
                    playerCount:
                        round.playerCount,
                    chairCount:
                        round.chairCount,
                    status: round.status,
                    startedAt:
                        round.startedAt,
                    pausedAt:
                        round.pausedAt,
                }
                : null,

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
            "START_GAME_ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to start game",
            },
            {
                status: 500,
            }
        );
    }
}